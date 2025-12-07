import { createTransport } from "nodemailer";
import { email_data } from "../types/email.worker.types";
import { EMAIL_ID, GOOGLE_AUTH_PASSWORD } from "../config/env";
import ApiError from "../utils/ApiError";

class EmailSender {
  private transporter: any = null ;
  constructor() {}

  async creatingHost() {
    
    this.transporter = createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, 
      auth: {
        user: EMAIL_ID,
        pass: GOOGLE_AUTH_PASSWORD,
      },
    });


  }

   async send(data : email_data){
    const {email_to , subject , content } = data ;    
    try {
    if(!this.transporter){
        this.creatingHost() ; 
      }
     
      // for sending the email 
      const info = await this.transporter.sendMail({
        from : EMAIL_ID , 
        to : email_to , 
        subject : subject , 
        text : content  

      });
      
      console.log("Message is sent" , info.messageId);

    }
    catch(err : any){
        return new ApiError(
            "Error in sending the mail" , 
            err 
        )
    }
   }

}


export const emailSender = new EmailSender() ; 