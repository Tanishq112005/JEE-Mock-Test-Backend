"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePasswords = comparePasswords;
const bcrypt_1 = __importDefault(require("bcrypt"));
const env_1 = require("../config/env");
async function hashPassword(rawPassword) {
    const saltRound = parseInt(env_1.SALT_ROUND || '10', 10);
    return await bcrypt_1.default.hash(rawPassword, saltRound);
}
;
async function comparePasswords(rawPassword, storedHash) {
    return await bcrypt_1.default.compare(rawPassword, storedHash);
}
;
