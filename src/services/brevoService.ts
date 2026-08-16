import axios from "axios";
import { BREVO_KEY_1, BREVO_KEY_2, BREVO_KEY_3, BREVO_KEY_4, BREVO_KEY_5, EMAIL_ID_1, EMAIL_ID_2, EMAIL_ID_3, EMAIL_ID_4, EMAIL_ID_5 } from "../config/env";
import ApiError from "../utils/ApiError";

import { INotificationService, NotificationMessage } from "../interfaces/notificationInterface";
import { emailTemplate } from "../utils/emailTemplate";

interface BrevoAccount {
    apiKey: string;
    emailId: string;
    sentCount: number;
}

// 1. Correctly store your accounts
const BREVO_ACCOUNTS: BrevoAccount[] = [
    { apiKey: BREVO_KEY_1 ?? "", emailId: EMAIL_ID_1 ?? "", sentCount: 0 },
    { apiKey: BREVO_KEY_2 ?? "", emailId: EMAIL_ID_2 ?? "", sentCount: 0 },
    { apiKey: BREVO_KEY_3 ?? "", emailId: EMAIL_ID_3 ?? "", sentCount: 0 },
    { apiKey: BREVO_KEY_4 ?? "", emailId: EMAIL_ID_4 ?? "", sentCount: 0 },
    { apiKey: BREVO_KEY_5 ?? "", emailId: EMAIL_ID_5 ?? "", sentCount: 0 } 
].filter(account => account.apiKey !== "" && account.emailId !== "");

const MAX_EMAILS_PER_ACCOUNT = 295; // Brevo free limit is 300/day. Safe margin.

class Brevo implements INotificationService {
  private currentKeyIndex = 0;

  async send(message: NotificationMessage) {
    if (BREVO_ACCOUNTS.length === 0) {
      throw new ApiError("No Brevo accounts configured. Please check your .env file.", 500);
    }

    if (!message.toEmail ) {
      throw new ApiError("Email destination is required for Brevo service", 400);
    }

    if(!message.content){
      throw new ApiError(
        "No Content is There , Please Add It" , 500
      );
    }
  
    if(!message.type){
      throw new ApiError(
        "Error  message type is not present"
      )
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

        const response = await axios.post(
          "https://api.brevo.com/v3/smtp/email",
          {
            // 4. Use the dynamic sender email from the account object
            sender: { name: "JEE Archive Support", email: account.emailId }, 
            to: [{ email: message.toEmail, name: "User" }],
            subject: message.subject,
            htmlContent: emailTemplate(message.content),
          },
          {
            headers: {
              "api-key": account.apiKey, // Use the specific key
              "Content-Type": "application/json",
              "accept": "application/json",
            },
          }
        );

        account.sentCount++; // Increment our internal tracker
        console.log(`Success! Sent via Account #${this.currentKeyIndex + 1}`);
        return response.data;

      } catch (error: any) {
        const status = error.response?.status;
        const errorMsg = error.response?.data?.message || error.message;

        console.warn(`Account #${this.currentKeyIndex + 1} Failed: ${errorMsg}`);

        // 5. Update logic to check for quota/credit errors
        // Removed status === 400 as it's typically for bad requests (e.g., unverified sender, invalid format), not quota issues.
        if (status === 402 || status === 429 || errorMsg.toLowerCase().includes("credit") || errorMsg.toLowerCase().includes("exhausted") || errorMsg.toLowerCase().includes("limit")) {
          console.log(`🔻 Account #${this.currentKeyIndex + 1} Quota Empty. Switching to next...`);
          
          this.currentKeyIndex = (this.currentKeyIndex + 1) % BREVO_ACCOUNTS.length;
          
          attempts++; 
        } else {
          console.error(`Fatal Error (Not Quota Related) for Account #${this.currentKeyIndex + 1}. Stopping.`);
          throw new ApiError(`Email Failed: ${errorMsg}`, 500);
        }
      }
    }

    throw new ApiError("All Brevo Accounts Exhausted", 500);
  }
}

export const emailService: INotificationService = new Brevo();