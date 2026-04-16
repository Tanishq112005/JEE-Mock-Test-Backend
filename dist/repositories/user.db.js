"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.user = void 0;
const database_1 = require("../lib/database");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
class User {
    db;
    constructor(database) {
        this.db = database;
    }
    // checking wheather the user is already present or not in the db
    async checkingUserPresent(email) {
        try {
            const allInformation = await this.db.user.findUnique({
                where: {
                    email: email,
                },
            });
            return allInformation;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    // creating the user with not verified status , it means right now user is not verified
    async creatingUser(details) {
        const { name, email, password, type } = details;
        try {
            await this.db.user.create({
                data: {
                    name: name,
                    email: email,
                    password: password,
                    is_verified: false,
                    type: type
                },
            });
        }
        catch (err) {
            throw err;
        }
    }
    // for changing the is_verified status to be true
    async changingIsVerifiedStatus(email) {
        try {
            await this.db.user.update({
                where: {
                    email: email,
                },
                data: {
                    is_verified: true,
                },
            });
        }
        catch (err) {
            throw err;
        }
    }
    // updating the access token in the table 
    async updateRefershToken(email, refersh_token) {
        try {
            await this.db.user.update({
                where: {
                    email: email
                },
                data: {
                    refersh_token: refersh_token
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
    // updating the password in the table using the userid 
    // src/repositories/user.db.ts
    async updatePassword(user_id, password) {
        try {
            console.log(`🔍 REPO: Attempting to update User ID: ${user_id}`);
            // 1. Check if user exists BEFORE updating (Debugging step)
            const exists = await this.db.user.findUnique({ where: { id: user_id } });
            if (!exists) {
                console.error(`❌ REPO ERROR: User ID ${user_id} does not exist in DB!`);
                throw new Error(`User ID ${user_id} not found`);
            }
            console.log(`👤 User Found: ${exists.email}. Updating password...`);
            // 2. Perform Update
            const updated = await this.db.user.update({
                where: { id: user_id },
                data: { password: password }
            });
            console.log("✅ REPO SUCCESS: Password hash updated in DB.");
            return updated;
        }
        catch (err) {
            console.error("❌ REPO CRASH: Prisma failed to update:", err.message);
            throw err;
        }
    }
    // for finding the user in the table 
    async userDetails(email) {
        try {
            const userDetails = await this.db.user.findUnique({
                where: {
                    email: email,
                    is_verified: true
                }
            });
            return userDetails;
        }
        catch (err) {
            throw err;
        }
    }
    // for finding the user through the id 
    async userDetailsThroughId(id) {
        try {
            const userDetails = await this.db.user.findUnique({
                where: {
                    id: id
                }
            });
            if (!userDetails) {
                throw new ApiError_1.default("No such type of the user exxists in the table");
            }
            return userDetails;
        }
        catch (err) {
            throw err;
        }
    }
    async creatingStudent(userId) {
        try {
            // Use upsert so re-verifying OTP (e.g. retry) doesn't throw a unique constraint error
            await this.db.studentProfile.upsert({
                where: { user_id: userId },
                update: {}, // already exists — nothing to change
                create: { user_id: userId }
            });
        }
        catch (err) {
            throw err;
        }
    }
    async stageNumber(studentId) {
        try {
            const studentProfile = await this.db.studentProfile.findFirst({
                where: {
                    id: studentId
                }
            });
            if (!studentProfile) {
                throw "No Student Is Present In The DB";
            }
            return studentProfile.stage;
        }
        catch (err) {
            throw err;
        }
    }
    async stage1(className, studentId) {
        try {
            await this.db.studentProfile.update({
                where: {
                    id: studentId
                },
                data: {
                    class: className,
                    stage: 1
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
    async stage2(gender, category, studentId) {
        try {
            await this.db.studentProfile.update({
                where: {
                    id: studentId
                },
                data: {
                    category: category,
                    gender: gender,
                    stage: 2
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
    async stage3(countryCode, mobileNumber, studentId) {
        try {
            await this.db.studentProfile.update({
                where: {
                    id: studentId
                },
                data: {
                    phone_country_code: countryCode,
                    phone: mobileNumber,
                    stage: 3
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
    async studentProfile(studentId) {
        try {
            const studentData = await this.db.studentProfile.findFirst({
                where: {
                    id: studentId
                }
            });
            if (!studentData) {
                throw new ApiError_1.default("No student profile found for this user. Try logging out and back in.");
            }
            const userId = studentData.user_id;
            const userData = await this.db.user.findFirst({
                where: {
                    id: userId
                }
            });
            const classData = studentData.class;
            const finalPayload = {
                name: userData?.name,
                email: userData?.email,
                class: studentData.class,
                category: studentData.category,
                mobileNumber: studentData.phone,
                countryCode: studentData.phone_country_code,
                gender: studentData.gender
            };
            return finalPayload;
        }
        catch (err) {
            throw err;
        }
    }
    async updateStudent(studentId, className, gender, category, name, countryCode, mobileNumber) {
        try {
            const studentData = await this.db.studentProfile.findFirst({
                where: {
                    id: studentId
                }
            });
            if (!studentData) {
                throw "No Such User Exists";
            }
            const userId = studentData.user_id;
            const userData = await this.db.user.findFirst({
                where: {
                    id: userId
                }
            });
            await this.db.studentProfile.update({
                where: {
                    id: studentId
                },
                data: {
                    class: className,
                    gender: gender,
                    category: category,
                    phone_country_code: countryCode,
                    phone: mobileNumber
                }
            });
            await this.db.user.update({
                where: {
                    id: userId
                },
                data: {
                    name: name
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
}
exports.user = new User(database_1.database);
