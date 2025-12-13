"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailSender = void 0;
const axios_1 = __importDefault(require("axios"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const env_1 = require("../config/env");
const BREVO_KEYS = [
    env_1.BREVO_KEY_1,
    env_1.BREVO_KEY_2
].filter(Boolean);
class BrevoRotator {
    currentKeyIndex = 0;
    async send(data) {
        const { email_to, subject, content } = data;
        let attempts = 0;
        while (attempts < BREVO_KEYS.length) {
            const apiKey = BREVO_KEYS[this.currentKeyIndex];
            try {
                console.log(`🔄 Trying Brevo Account #${this.currentKeyIndex + 1}...`);
                const response = await axios_1.default.post("https://api.brevo.com/v3/smtp/email", {
                    sender: { name: "JEE Archive Support", email: env_1.EMAIL_ID },
                    to: [{ email: email_to, name: "User" }],
                    subject: subject,
                    htmlContent: `<html><body>${content}</body></html>`,
                }, {
                    headers: {
                        "api-key": apiKey,
                        "Content-Type": "application/json",
                        "accept": "application/json",
                    },
                });
                console.log(`✅ Success! Sent via Account #${this.currentKeyIndex + 1}`);
                return response.data;
            }
            catch (error) {
                const status = error.response?.status;
                const errorMsg = error.response?.data?.message || error.message;
                console.warn(`⚠️ Account #${this.currentKeyIndex + 1} Failed: ${errorMsg}`);
                if (status === 400 || status === 402 || errorMsg.includes("credit")) {
                    console.log(`🔻 Account #${this.currentKeyIndex + 1} Empty. Switching to next...`);
                    this.currentKeyIndex = (this.currentKeyIndex + 1) % BREVO_KEYS.length;
                    attempts++;
                }
                else {
                    console.error("❌ Fatal Error (Not Quota Related). Stopping.");
                    throw new ApiError_1.default("Email Failed", errorMsg);
                }
            }
        }
        throw new ApiError_1.default("All Brevo Accounts Exhausted", 500);
    }
}
exports.emailSender = new BrevoRotator();
