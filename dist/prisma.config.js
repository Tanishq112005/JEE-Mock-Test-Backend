"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("prisma/config");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
exports.default = (0, config_1.defineConfig)({
    schema: "./prisma/schema.prisma",
    migrations: {
        path: "src/prisma/migrations",
    },
    datasource: {
        url: (0, config_1.env)('DATABASE_URL')
    },
});
