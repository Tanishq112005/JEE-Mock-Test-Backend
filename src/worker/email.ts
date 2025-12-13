
import { createTransport, Transporter } from "nodemailer";
import { email_data } from "../types/email.worker.types";
import { EMAIL_ID, GOOGLE_AUTH_PASSWORD } from "../config/env";
import ApiError from "../utils/ApiError";

class EmailSender {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
    // 🔥 WARM UP: Connect immediately when server starts
    // This ensures the "first" request isn't actually the first connection
    this.warmUpConnection(); 
  }
  
  private initTransporter() {
    // usage of 'as any' here forces TypeScript to accept the 'host' property
    this.transporter = createTransport({
      host: "smtp.gmail.com", // 👈 THIS IS MANDATORY. Do not remove it.
      port: 465,
      secure: true,
      pool: true,
      maxConnections: 1,
      maxMessages: 10,
      family: 4, // Forces IPv4 to prevent timeouts
      auth: {
        user: EMAIL_ID,
        pass: GOOGLE_AUTH_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    } as any); // 👈 THIS 'as any' FIXES THE TYPESCRIPT ERROR
  }
  // Helper to establish connection before any user requests come in
  private async warmUpConnection() {
    try {
      const verified = await this.transporter?.verify();
      if (verified) {
        console.log("✅ Email Worker: SMTP Connection Warmed Up & Ready");
      }
    } catch (error) {
      console.warn("⚠️ Email Worker: Warmup failed (will retry on first request)", error);
    }
  }

  async send(data: email_data) {
    const { email_to, subject, content } = data;
    
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      try {
        if (!this.transporter) {
          this.initTransporter();
        }

        // We removed the explicit verify() here because it slows down the loop.
        // If the pool is broken, sendMail will throw, and the catch block will handle it.

        const info = await this.transporter!.sendMail({
          from: `"JEE Archive Support" <${EMAIL_ID}>`,
          to: email_to,
          subject: subject,
          text: content,
        });

        console.log(`✅ Email sent to ${email_to}: ${info.messageId}`);
        return info;

      } catch (err: any) {
        attempts++;
        console.error(`❌ Attempt ${attempts} failed: ${err.message}`);

        // If the pool is dead (e.g., internet disconnected), recreate it for the next try
        if (err.message.includes('Connection') || err.message.includes('socket')) {
            this.initTransporter();
        }

        if (attempts >= maxRetries) {
          console.error("💀 Critical Failure: Giving up on email.");
          // You might want to push this back to a "Dead Letter Queue" in RabbitMQ here
          throw new ApiError("Critical Email Failure", err);
        }
        
        // Wait 2 seconds before retrying
        await new Promise(res => setTimeout(res, 2000));
      }
    }
  }
}

export const emailSender = new EmailSender();