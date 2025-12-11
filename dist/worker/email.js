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
    constructor() { }
    createHost() {
        this.transporter = (0, nodemailer_1.createTransport)({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: env_1.EMAIL_ID,
                pass: env_1.GOOGLE_AUTH_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }
    async send(data) {
        const { email_to, subject, content } = data;
        try {
            if (!this.transporter) {
                this.createHost();
            }
            if (!this.transporter) {
                throw new Error("Transporter creation failed");
            }
            const info = await this.transporter.sendMail({
                from: env_1.EMAIL_ID,
                to: email_to,
                subject: subject,
                text: content,
            });
            console.log("Message is sent", info.messageId);
            return info;
        }
        catch (err) {
            throw new ApiError_1.default("Error in sending the mail", err);
        }
    }
}
exports.emailSender = new EmailSender();
