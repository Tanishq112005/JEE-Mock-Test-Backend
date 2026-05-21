"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplate = void 0;
const emailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; color: #1f2937;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border-top: 5px solid #e87c1e;">
          
          <tr>
            <td style="background-color: #1c1c1c; padding: 35px 24px; text-align: center;">
              
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; letter-spacing: 0.5px; font-weight: 700;">
                JEE Archive
              </h1>
              <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 18px; font-weight: 400;">
                Ace your JEE
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px; line-height: 1.6; font-size: 16px; color: #374151;">
              ${content}
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 13px; color: #6b7280;">
                You are receiving this email because you registered on JEE Archive.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #6b7280;">
                © ${new Date().getFullYear()} JEE Archive. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
`;
exports.emailTemplate = emailTemplate;
