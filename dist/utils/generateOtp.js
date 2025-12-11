"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.random6digitnumber = random6digitnumber;
const crypto_1 = require("crypto");
function random6digitnumber() {
    const otp = (0, crypto_1.randomInt)(100000, 999999).toString();
    return otp;
}
