"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.exam = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../lib/database");
class Exam {
    db;
    constructor(database) {
        this.db = database;
    }
    async addingExam(name) {
        try {
            const adding = await this.db.exam.create({
                data: {
                    name: name
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
    async deletingExam(name) {
        try {
            const deleting = await this.db.exam.delete({
                where: {
                    name: name
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
    async gettingExam() {
        try {
            const { redisConfig, questionRedisclient, REDIS_CACHE_EXPIRATION } = await Promise.resolve().then(() => __importStar(require("../lib/redis")));
            const redisKey = redisConfig.getRedisExamList();
            const cachedExams = await questionRedisclient.get(redisKey);
            if (cachedExams) {
                console.log(`[Cache Hit] Exam list coming from Redis.`);
                return JSON.parse(cachedExams);
            }
            console.log(`[Cache Miss] Exam list coming from Database.`);
            const examInDb = await this.db.exam.findMany({
                select: {
                    name: true
                }
            });
            let examList = [];
            for (let i = 0; i < examInDb.length; i++) {
                examList.push(examInDb[i].name);
            }
            await questionRedisclient.setEx(redisKey, REDIS_CACHE_EXPIRATION, JSON.stringify(examList));
            return examList;
        }
        catch (err) {
            throw err;
        }
    }
    async gettingIdOfExam(examName) {
        try {
            const { redisConfig, questionRedisclient, REDIS_CACHE_EXPIRATION } = await Promise.resolve().then(() => __importStar(require("../lib/redis")));
            const redisKey = redisConfig.getRedisExamId(examName);
            const cachedExamId = await questionRedisclient.get(redisKey);
            if (cachedExamId) {
                console.log(`[Cache Hit] Exam ID for "${examName}" coming from Redis.`);
                return JSON.parse(cachedExamId);
            }
            console.log(`[Cache Miss] Exam ID for "${examName}" coming from Database.`);
            let condition;
            if (examName === client_1.ExamName.JEE_ADVANCED) {
                condition = client_1.ExamName.JEE_ADVANCED;
            }
            else {
                condition = client_1.ExamName.JEE_MAIN;
            }
            const examDetails = await this.db.exam.findUnique({
                where: {
                    name: condition
                }
            });
            const examId = examDetails?.id;
            if (examId) {
                await questionRedisclient.setEx(redisKey, REDIS_CACHE_EXPIRATION, JSON.stringify(examId));
            }
            return examId;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.exam = new Exam(database_1.database);
