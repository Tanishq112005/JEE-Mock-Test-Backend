import { createTransport, Transporter } from "nodemailer";
import { email_data } from "../types/email.worker.types";
import { EMAIL_ID, GOOGLE_AUTH_PASSWORD } from "../config/env";
import ApiError from "../utils/ApiError";



class EmailSender {
  private transporter: Transporter | null = null;

  constructor() {}

  private createHost() {
    this.transporter = createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, 
      auth: {
        user: EMAIL_ID,
        pass: GOOGLE_AUTH_PASSWORD,
      },     
      tls: {
        rejectUnauthorized: false
      }
    });
  }


  
  async send(data: email_data) {
    const { email_to, subject, content } = data;

    try {
      if (!this.transporter) {
        this.createHost();
      }

      
      if (!this.transporter) {
         throw new Error("Transporter creation failed");
      }

      const info = await this.transporter.sendMail({
        from: EMAIL_ID,
        to: email_to,
        subject: subject,
        text: content, 
      });

      console.log("Message is sent", info.messageId);
      return info;

    } catch (err: any) {
      
      throw new ApiError("Error in sending the mail", err);
    }
  }
}

export const emailSender = new EmailSender();