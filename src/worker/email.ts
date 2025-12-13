import { createTransport, Transporter } from "nodemailer";
import { email_data } from "../types/email.worker.types";
import { EMAIL_ID, GOOGLE_AUTH_PASSWORD } from "../config/env";
import ApiError from "../utils/ApiError";

class EmailSender {
  private transporter: Transporter | null = null;

  constructor() {
    // Initialize the host immediately on class instantiation
    this.createHost();
  }

  private createHost() {
    this.transporter = createTransport({
      service: "gmail", 
      pool: true,       
      maxConnections: 1,
      maxMessages: 10,  
      secure: true,
      port: 465,
      auth: {
        user: EMAIL_ID,
        pass: GOOGLE_AUTH_PASSWORD,
      },
      tls: {
        
        rejectUnauthorized: false,
      },
    });
  }


  async verifyConnection() {
    if (!this.transporter) return false;
    try {
      await this.transporter.verify();
      console.log("✅ SMTP Server Ready");
      return true;
    } catch (error) {
      console.error("❌ SMTP Connection Error:", error);
      return false;
    }
  }

  async send(data: email_data) {
    const { email_to, subject, content } = data;

    
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      try {
        if (!this.transporter) {
          this.createHost();
        }

        const info = await this.transporter!.sendMail({
          from: EMAIL_ID,
          to: email_to,
          subject: subject,
          text: content,
        });

        console.log(`Message sent successfully (Attempt ${attempts + 1}):`, info.messageId);
        return info;

      } catch (err: any) {
        attempts++;
        console.warn(`Attempt ${attempts} failed. Retrying... Error: ${err.message}`);

      
        if (attempts >= maxRetries) {
          console.error("All email attempts failed.");
          throw new ApiError("Failed to send mail after multiple attempts", err);
        }

      
        await new Promise((res) => setTimeout(res, 1000));
      }
    }
  }
}

export const emailSender = new EmailSender();