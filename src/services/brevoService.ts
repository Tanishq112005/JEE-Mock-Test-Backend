import axios from "axios";
import { BREVO_KEY_1, BREVO_KEY_2, EMAIL_ID } from "../config/env";
import ApiError from "../utils/ApiError";
import { EmailPayload } from "../types/emailPayload";
import { IEmailProvider } from "../interfaces/emailInterface";
import { emailTemplate } from "../utils/emailTemplate";


const BREVO_KEYS = [
  BREVO_KEY_1,
  BREVO_KEY_2 
].filter(Boolean) as string[]; 



class Brevo implements IEmailProvider {
  private currentKeyIndex = 0;

  async sendEmail(payload: EmailPayload) {
    const { email_to, subject, content } = payload;
  
    let attempts = 0;
    
    while (attempts < BREVO_KEYS.length) {
      const apiKey = BREVO_KEYS[this.currentKeyIndex];
      try {
        console.log(`Trying Brevo Account #${this.currentKeyIndex + 1}...`);

        const response = await axios.post(
          "https://api.brevo.com/v3/smtp/email",
          {
            sender: { name: "JEE Archive Support", email: EMAIL_ID }, 
            to: [{ email: email_to, name: "User" }],
            subject: subject,
            htmlContent: emailTemplate(content),
          },
          {
            headers: {
              "api-key": apiKey,
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

        if (status === 400 || status === 402 || errorMsg.includes("credit")) {
          console.log(`🔻 Account #${this.currentKeyIndex + 1} Empty. Switching to next...`);
          
          this.currentKeyIndex = (this.currentKeyIndex + 1) % BREVO_KEYS.length;
          
          attempts++; 
        } else {
          console.error("Fatal Error (Not Quota Related). Stopping.");
          throw new ApiError(`Email Failed: ${errorMsg}` , 500);
        }
      }
    }

    throw new ApiError("All Brevo Accounts Exhausted" , 500);
  }
}

// FIX 3: Type the exported instance as the Interface
export const emailService: IEmailProvider = new Brevo();