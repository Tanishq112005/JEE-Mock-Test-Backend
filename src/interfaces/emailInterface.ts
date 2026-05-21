import { EmailPayload } from "../types/emailPayload";

export interface IEmailProvider {
    sendEmail(payload: EmailPayload): Promise<any>;
}

