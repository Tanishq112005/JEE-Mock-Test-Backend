"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDIS_USERNAME = exports.REDIS_PASSWORD = exports.WINDOW_SIZE = exports.MAX_ATTEMENTS = exports.SALT_ROUND = exports.OTP_EXPIRE_TIME = exports.RABBITMQ_PORT = exports.RABBITMQ_PASSWORD = exports.RABBITMQ_CONNECTION = exports.GOOGLE_AUTH_PASSWORD = exports.EMAIL_ID = exports.REDIS_PORT = exports.REDIS_HOST = exports.DATABASE_REPICA_URL = exports.DATABASE_URL = exports.JWT_ALGORITHM_REFERSH_TOKEN = exports.JWT_TEMP_EXPIRES_IN_REFERSH_TOKEN = exports.JWT_SECRET_REFERSH_TOKEN = exports.JWT_ALGORITHM_ACCESS_TOKEN = exports.JWT_TEMP_EXPIRES_IN_ACCESS_TOKEN = exports.JWT_SECRET_ACCESS_TOKEN = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../.env") });
_a = process.env, exports.PORT = _a.PORT, exports.JWT_SECRET_ACCESS_TOKEN = _a.JWT_SECRET_ACCESS_TOKEN, exports.JWT_TEMP_EXPIRES_IN_ACCESS_TOKEN = _a.JWT_TEMP_EXPIRES_IN_ACCESS_TOKEN, exports.JWT_ALGORITHM_ACCESS_TOKEN = _a.JWT_ALGORITHM_ACCESS_TOKEN, exports.JWT_SECRET_REFERSH_TOKEN = _a.JWT_SECRET_REFERSH_TOKEN, exports.JWT_TEMP_EXPIRES_IN_REFERSH_TOKEN = _a.JWT_TEMP_EXPIRES_IN_REFERSH_TOKEN, exports.JWT_ALGORITHM_REFERSH_TOKEN = _a.JWT_ALGORITHM_REFERSH_TOKEN, exports.DATABASE_URL = _a.DATABASE_URL, exports.DATABASE_REPICA_URL = _a.DATABASE_REPICA_URL, exports.REDIS_HOST = _a.REDIS_HOST, exports.REDIS_PORT = _a.REDIS_PORT, exports.EMAIL_ID = _a.EMAIL_ID, exports.GOOGLE_AUTH_PASSWORD = _a.GOOGLE_AUTH_PASSWORD, exports.RABBITMQ_CONNECTION = _a.RABBITMQ_CONNECTION, exports.RABBITMQ_PASSWORD = _a.RABBITMQ_PASSWORD, exports.RABBITMQ_PORT = _a.RABBITMQ_PORT, exports.OTP_EXPIRE_TIME = _a.OTP_EXPIRE_TIME, exports.SALT_ROUND = _a.SALT_ROUND, exports.MAX_ATTEMENTS = _a.MAX_ATTEMENTS, exports.WINDOW_SIZE = _a.WINDOW_SIZE, exports.REDIS_PASSWORD = _a.REDIS_PASSWORD, exports.REDIS_USERNAME = _a.REDIS_USERNAME;
