import { NotificationTypes, SendingPerson } from "@prisma/client";
import { Send } from "express";

export interface NotificationMessage {
  toEmail?: string;
  toPhone?: string;
  subject?: string;
  content?: string;
  from? : SendingPerson ,
  to? : SendingPerson
  cc?: string[];
  type? : NotificationTypes ; 
  metadata?: Record<string, any>; // Catch-all for extra variables
  studentId? : string | null ;
}

export interface INotificationService {
  send(message: NotificationMessage): Promise<any>;
}