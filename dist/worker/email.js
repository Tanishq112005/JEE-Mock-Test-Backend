"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailSender = void 0;
const nodemailer_1 = require("nodemailer");
const env_1 = require("../config/env");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
class EmailSender {
    transporter = null;
    constructor() {
        // Initialize the host immediately on class instantiation
        this.createHost();
    }
    createHost() {
        this.transporter = (0, nodemailer_1.createTransport)({
            service: "gmail",
            pool: true,
            maxConnections: 1,
            maxMessages: 10,
            secure: true,
            port: 465,
            auth: {
                user: env_1.EMAIL_ID,
                pass: env_1.GOOGLE_AUTH_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });
    }
    async verifyConnection() {
        if (!this.transporter)
            return false;
        try {
            await this.transporter.verify();
            console.log("✅ SMTP Server Ready");
            return true;
        }
        catch (error) {
            console.error("❌ SMTP Connection Error:", error);
            return false;
        }
    }
    async send(data) {
        const { email_to, subject, content } = data;
        let attempts = 0;
        const maxRetries = 3;
        while (attempts < maxRetries) {
            try {
                if (!this.transporter) {
                    this.createHost();
                }
                const info = await this.transporter.sendMail({
                    from: env_1.EMAIL_ID,
                    to: email_to,
                    subject: subject,
                    text: content,
                });
                console.log(`Message sent successfully (Attempt ${attempts + 1}):`, info.messageId);
                return info;
            }
            catch (err) {
                attempts++;
                console.warn(`Attempt ${attempts} failed. Retrying... Error: ${err.message}`);
                if (attempts >= maxRetries) {
                    console.error("All email attempts failed.");
                    throw new ApiError_1.default("Failed to send mail after multiple attempts", err);
                }
                await new Promise((res) => setTimeout(res, 1000));
            }
        }
    }
}
exports.emailSender = new EmailSender();
