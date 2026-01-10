import crypto from 'crypto';


import { ENCRYPTION_KEY, IV_LENGTH } from '../config/env';

export function encryptPayload(data: any): string {
  if (!data) return "";

 
  const text = JSON.stringify(data);

  const rawKey = ENCRYPTION_KEY || '12345678901234567890123456789012';


  if (Buffer.byteLength(rawKey) !== 32) {
    throw new Error(`Invalid ENCRYPTION_KEY length. Expected 32 bytes, got ${Buffer.byteLength(rawKey)}.`);
  }


  const encryptionKeyBuffer = Buffer.from(rawKey);
  

  const ivLengthVal = parseInt(String(IV_LENGTH || '16'), 10);
  

  const iv = crypto.randomBytes(ivLengthVal);
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKeyBuffer, iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);


  return iv.toString('hex') + ':' + encrypted.toString('hex');
}