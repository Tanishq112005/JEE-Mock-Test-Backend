import axios from "axios";
import { BREVO_KEY_1, BREVO_KEY_2, BREVO_KEY_3, BREVO_KEY_4, BREVO_KEY_5, EMAIL_ID_1, EMAIL_ID_2, EMAIL_ID_3, EMAIL_ID_4, EMAIL_ID_5 } from "../config/env";
import ApiError from "../utils/ApiError";
import { EmailPayload } from "../types/emailPayload";
import { IEmailProvider } from "../interfaces/emailInterface";
import { emailTemplate } from "../utils/emailTemplate";

interface BrevoAccount {
    apiKey: string;
    emailId: string;
}

// 1. Correctly store your accounts
const BREVO_ACCOUNTS: BrevoAccount[] = [
    { apiKey: BREVO_KEY_1 ?? "", emailId: EMAIL_ID_1 ?? "" },
    { apiKey: BREVO_KEY_2 ?? "", emailId: EMAIL_ID_2 ?? "" } ,
    { apiKey: BREVO_KEY_3 ?? "", emailId: EMAIL_ID_3 ?? "" } ,
    { apiKey: BREVO_KEY_4 ?? "", emailId: EMAIL_ID_4 ?? "" } ,
    { apiKey: BREVO_KEY_5 ?? "", emailId: EMAIL_ID_5 ?? "" } 
    
].filter(account => account.apiKey !== "" && account.emailId !== "");

class Brevo implements IEmailProvider {
  private currentKeyIndex = 0;

  async sendEmail(payload: EmailPayload) {
    const { email_to, subject, content } = payload;
  
    let attempts = 0;
    
    // 2. Loop based on the length of our accounts array
    while (attempts < BREVO_ACCOUNTS.length) {
      // 3. Access the object instead of just the key
      const account = BREVO_ACCOUNTS[this.currentKeyIndex];
      
      try {
        console.log(`Trying Brevo Account #${this.currentKeyIndex + 1}...`);

        const response = await axios.post(
          "https://api.brevo.com/v3/smtp/email",
          {
            // 4. Use the dynamic sender email from the account object
            sender: { name: "JEE Archive Support", email: account.emailId }, 
            to: [{ email: email_to, name: "User" }],
            subject: subject,
            htmlContent: emailTemplate(content),
          },
          {
            headers: {
              "api-key": account.apiKey, // Use the specific key
              "Content-Type": "application/json",
              "accept": "application/json",
            },
          }
        );

        console.log(`Success! Sent via Account #${this.currentKeyIndex + 1}`);
        return response.data;

      } catch (error: any) {
        const status = error.response?.status;
        const errorMsg = error.response?.data?.message || error.message;

        console.warn(`Account #${this.currentKeyIndex + 1} Failed: ${errorMsg}`);

        // 5. Update logic to check for quota/credit errors
        if (status === 400 || status === 402 || errorMsg.toLowerCase().includes("credit")) {
          console.log(`🔻 Account #${this.currentKeyIndex + 1} Empty. Switching to next...`);
          
          this.currentKeyIndex = (this.currentKeyIndex + 1) % BREVO_ACCOUNTS.length;
          
          attempts++; 
        } else {
          console.error("Fatal Error (Not Quota Related). Stopping.");
          throw new ApiError(`Email Failed: ${errorMsg}`, 500);
        }
      }
    }

    throw new ApiError("All Brevo Accounts Exhausted", 500);
  }
}

export const emailService: IEmailProvider = new Brevo();