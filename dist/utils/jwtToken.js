"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefershToken = generateRefershToken;
exports.verifiyingRefeshToken = verifiyingRefeshToken;
exports.generateAccessToken = generateAccessToken;
exports.verifyAccessToken = verifyAccessToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../config/jwt");
// give the json web token 
function generateAccessToken(payload) {
    const options = {
        expiresIn: jwt_1.jwtConfigAccessToken.expiry_time,
        algorithm: jwt_1.jwtConfigAccessToken.algorithm
    };
    return jsonwebtoken_1.default.sign(payload, jwt_1.jwtConfigAccessToken.secret_key, options);
}
// verify json web token 
function verifyAccessToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwt_1.jwtConfigAccessToken.secret_key);
        return decoded;
    }
    catch (err) {
        return err.message;
    }
}
// generating the refersh token 
function generateRefershToken(payload, expireTime) {
    const options = {
        expiresIn: expireTime,
        algorithm: jwt_1.jwtConfigRefershToken.algorithm
    };
    return jsonwebtoken_1.default.sign(payload, jwt_1.jwtConfigRefershToken.secret_key, options);
}
// verifying the refersh token 
async function verifiyingRefeshToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwt_1.jwtConfigRefershToken.secret_key);
        return decoded;
    }
    catch (err) {
        return err.message;
    }
}
