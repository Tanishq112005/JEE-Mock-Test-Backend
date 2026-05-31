import { NotificationTypes, SendingPerson } from "@prisma/client";
import { NotificationMessage } from "./notificationInterface";

export class NotificationBuilder {
  public message: NotificationMessage;

  constructor() {
    // We create a fresh instance to hold our data
    this.message = {
     
    };
  }

  setToEmail(email: string): this {
    this.message.toEmail = email;
    return this;
  }

  setToPhone(phone: string): this {
    this.message.toPhone = phone;
    return this;
  }

  setSubject(subject: string): this {
    this.message.subject = subject;
    return this;
  }

  setContent(content: string): this {
    this.message.content = content;
    return this;
  }

  addCc(email: string): this {
    if (!this.message.cc) {
      this.message.cc = [];
    }
    this.message.cc.push(email);
    return this;
  }

   
  setFrom(from : SendingPerson){
    this.message.from = from;
    return this ; 
  }

  setTo(to : SendingPerson){
    this.message.to = to ;
    return this ; 
  }


  setType(type : NotificationTypes) : this {
     this.message.type = type ; 
     return this ; 
  }

  setStudentId(type : any) {
    this.message.studentId = type ; 
    return this ; 
  }

  fromJSON(data: any): this {

    const rawData = data.message ? data.message : data;

    Object.assign(this.message, rawData);
    
    return this;
  }

  build(): NotificationMessage {
    // You can add validation here (e.g., must have an email or phone)
    if (!this.message.toEmail && !this.message.toPhone) {
      throw new Error("Cannot build notification: No destination (email or phone) provided.");
    }
    return this.message;
  }
}