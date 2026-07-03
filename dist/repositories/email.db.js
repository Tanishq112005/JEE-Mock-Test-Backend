"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailRepositories = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../lib/database");
const notificationBuilder_1 = require("../interfaces/notificationBuilder");
class Email {
    db;
    constructor(database) {
        this.db = database;
    }
    async adding(email) {
        try {
            await this.db.email.upsert({
                where: { email: email },
                update: {},
                create: { email: email }
            });
        }
        catch (err) {
            throw err;
        }
    }
    async sendingEmail() {
        const content = ` 
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <h2 style="margin-top: 0; color: #111827; font-size: 22px; font-weight: 700; line-height: 1.3;">
    Our mock test and PYQ practice platform is here! 🚀
  </h2>
  
  <p style="margin-bottom: 16px; color: #374151; font-size: 16px; line-height: 1.6;">
    If you were using some other platform till now, this is the time to switch to jeearchive.com.
  </p>
  
  <p style="margin-bottom: 30px; color: #374151; font-size: 16px; line-height: 1.6;">
    We've designed each pixel with care, built a far better product than what's out there, and it's <strong style="color: #e87c1e; font-weight: 700;">FREE TO USE</strong>.
  </p>
  
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
    <tr>
      <td align="center">
        <a href="https://jeearchive.com" style="display: inline-block; background-color: #e87c1e; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 6px; text-align: center;">
          Make your account now
        </a>
      </td>
    </tr>
  </table>
  
  <p style="margin: 0; color: #4b5563; font-size: 15px;">
    Best of luck with your preparation,<br>
    <strong style="color: #111827;">Team JEE Archive</strong>
  </p>
</div> 
`;
        const subject = `JEE Archive Mock Test & PYQ Practice Platform (FREE)`;
        try {
            // 1. Fetch all pending emails
            const allEmails = await this.db.email.findMany({
                where: {
                    isEmailSended: false
                }
            });
            if (allEmails.length === 0) {
                console.log("No pending emails to send.");
                return;
            }
            // 2. Create an array of asynchronous tasks
            const emailTasks = allEmails.map(async (emailRecord) => {
                try {
                    // 3. Attempt to send the email
                    // Replace 'sendEmailHelper' with your actual email sending function (e.g., Nodemailer, AWS SES)
                    const message = (new notificationBuilder_1.NotificationBuilder())
                        .setToEmail(emailRecord.email)
                        .setSubject(subject)
                        .setContent(content)
                        .setType(client_1.NotificationTypes.Update)
                        .setTo(client_1.SendingPerson.User)
                        .setFrom(client_1.SendingPerson.Developer)
                        .build();
                    // 4. If the above line succeeds, update the database for this specific record
                    await this.db.email.update({
                        where: { id: emailRecord.id },
                        data: { isEmailSended: true }
                    });
                    console.log(`✅ Email successfully sent to: ${emailRecord.email}`);
                }
                catch (error) {
                    console.error(`❌ Failed to send email to ${emailRecord.email}:`, error);
                }
            });
            // 5. Execute all tasks concurrently and wait for them all to finish
            // We use Promise.all here because the inner try/catch prevents any single failure from rejecting the whole array
            await Promise.all(emailTasks);
            console.log("Email batch processing complete.");
        }
        catch (err) {
            console.error("Critical error fetching emails from DB:", err);
            throw err;
        }
    }
}
exports.emailRepositories = new Email(database_1.database);
