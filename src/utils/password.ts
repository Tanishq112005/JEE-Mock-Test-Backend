import bcrypt from 'bcrypt';
import { SALT_ROUND } from '../config/env';


 export async function hashPassword(rawPassword: string): Promise<string> {
  const saltRound = parseInt(SALT_ROUND || '10', 10);
  return await bcrypt.hash(rawPassword, saltRound);
};


export async function comparePasswords  (
  rawPassword: string, 
  storedHash: string
): Promise<boolean> {
  return await bcrypt.compare(rawPassword, storedHash);
};