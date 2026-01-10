"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptPayload = encryptPayload;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
function encryptPayload(data) {
    if (!data)
        return "";
    const text = JSON.stringify(data);
    const rawKey = env_1.ENCRYPTION_KEY || '12345678901234567890123456789012';
    if (Buffer.byteLength(rawKey) !== 32) {
        throw new Error(`Invalid ENCRYPTION_KEY length. Expected 32 bytes, got ${Buffer.byteLength(rawKey)}.`);
    }
    const encryptionKeyBuffer = Buffer.from(rawKey);
    const ivLengthVal = parseInt(String(env_1.IV_LENGTH || '16'), 10);
    const iv = crypto_1.default.randomBytes(ivLengthVal);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', encryptionKeyBuffer, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}
