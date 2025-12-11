"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConfigRefershToken = exports.jwtConfigAccessToken = void 0;
const env_1 = require("./env");
exports.jwtConfigAccessToken = {
    secret_key: env_1.JWT_SECRET_ACCESS_TOKEN,
    expiry_time: env_1.JWT_TEMP_EXPIRES_IN_ACCESS_TOKEN,
    algorithm: env_1.JWT_ALGORITHM_ACCESS_TOKEN
};
exports.jwtConfigRefershToken = {
    secret_key: env_1.JWT_SECRET_REFERSH_TOKEN,
    algorithm: env_1.JWT_ALGORITHM_REFERSH_TOKEN
};
