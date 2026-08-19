"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const emailTemplate_1 = require("../utils/emailTemplate");
// 1. Correctly store your accounts
const BREVO_ACCOUNTS = [
    { apiKey: env_1.BREVO_KEY_1 ?? "", emailId: env_1.EMAIL_ID_1 ?? "", sentCount: 0 },
    { apiKey: env_1.BREVO_KEY_2 ?? "", emailId: env_1.EMAIL_ID_2 ?? "", sentCount: 0 },
    { apiKey: env_1.BREVO_KEY_3 ?? "", emailId: env_1.EMAIL_ID_3 ?? "", sentCount: 0 },
    { apiKey: env_1.BREVO_KEY_4 ?? "", emailId: env_1.EMAIL_ID_4 ?? "", sentCount: 0 },
    { apiKey: env_1.BREVO_KEY_5 ?? "", emailId: env_1.EMAIL_ID_5 ?? "", sentCount: 0 }
].filter(account => account.apiKey !== "" && account.emailId !== "");
const MAX_EMAILS_PER_ACCOUNT = 295; // Brevo free limit is 300/day. Safe margin.
class Brevo {
    currentKeyIndex = 0;
    async send(message) {
        if (BREVO_ACCOUNTS.length === 0) {
            throw new ApiError_1.default("No Brevo accounts configured. Please check your .env file.", 500);
        }
        if (!message.toEmail) {
            throw new ApiError_1.default("Email destination is required for Brevo service", 400);
        }
        if (!message.content) {
            throw new ApiError_1.default("No Content is There , Please Add It", 500);
        }
        if (!message.type) {
            throw new ApiError_1.default("Error  message type is not present");
        }
        let attempts = 0;
        // 2. Loop based on the length of our accounts array
        while (attempts < BREVO_ACCOUNTS.length) {
            // 3. Access the object instead of just the key
            const account = BREVO_ACCOUNTS[this.currentKeyIndex];
            // Force rotation if this account has reached our internal limit
            if (account.sentCount >= MAX_EMAILS_PER_ACCOUNT) {
                console.log(`🔻 Account #${this.currentKeyIndex + 1} reached internal limit of ${MAX_EMAILS_PER_ACCOUNT}. Switching to next...`);
                this.currentKeyIndex = (this.currentKeyIndex + 1) % BREVO_ACCOUNTS.length;
                attempts++;
                continue;
            }
            try {
                console.log(`Trying Brevo Account #${this.currentKeyIndex + 1} (Sent: ${account.sentCount}/${MAX_EMAILS_PER_ACCOUNT})...`);
                const response = await axios_1.default.post("https://api.brevo.com/v3/smtp/email", {
                    // 4. Use the dynamic sender email from the account object
                    sender: { name: "JEE Archive Support", email: account.emailId },
                    to: [{ email: message.toEmail, name: "User" }],
                    subject: message.subject,
                    htmlContent: (0, emailTemplate_1.emailTemplate)(message.content),
                }, {
                    headers: {
                        "api-key": account.apiKey, // Use the specific key
                        "Content-Type": "application/json",
                        "accept": "application/json",
                    },
                });
                account.sentCount++; // Increment our internal tracker
                console.log(`Success! Sent via Account #${this.currentKeyIndex + 1}`);
                return response.data;
            }
            catch (error) {
                const status = error.response?.status;
                const errorMsg = error.response?.data?.message || error.message;
                console.warn(`Account #${this.currentKeyIndex + 1} Failed: ${errorMsg}`);
                // 5. Update logic to check for quota/credit errors
                // Removed status === 400 as it's typically for bad requests (e.g., unverified sender, invalid format), not quota issues.
                if (status === 402 || status === 429 || errorMsg.toLowerCase().includes("credit") || errorMsg.toLowerCase().includes("exhausted") || errorMsg.toLowerCase().includes("limit")) {
                    console.log(`🔻 Account #${this.currentKeyIndex + 1} Quota Empty. Switching to next...`);
                    this.currentKeyIndex = (this.currentKeyIndex + 1) % BREVO_ACCOUNTS.length;
                    attempts++;
                }
                else {
                    console.error(`Fatal Error (Not Quota Related) for Account #${this.currentKeyIndex + 1}. Stopping.`);
                    throw new ApiError_1.default(`Email Failed: ${errorMsg}`, 500);
                }
            }
        }
        throw new ApiError_1.default("All Brevo Accounts Exhausted", 500);
    }
}
exports.emailService = new Brevo();
