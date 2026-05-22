import { NotificationBuilder } from "../interfaces/notificationBuilder";
import { INotificationService, NotificationMessage } from "../interfaces/notificationInterface";
import { emailProducer } from "../rabbitmq/producers/email-producer";
import { user } from "../repositories/user.db";
import { emailService } from "../services/brevoService";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";




const technicalEmail : string = 'techjeearchive@gmail.com';


class NotificationController {
   
   private emailInstance : INotificationService ; 
   constructor(emailInstance : INotificationService){
        this.emailInstance = emailInstance ; 
   }

   

   // sending the Notification Through The Email To Particular User 
   public sendingEmailParticularUser = async (req : any , res : any) => {
    try {
      const {to , subject , content} = req.body ; 
      
      const payload : NotificationMessage = (new NotificationBuilder())
                                            .setToEmail(to)
                                            .setSubject(subject)
                                            .setContent(content)
                                            .setType("Notification")
                                            .build() ; 
       
       await this.emailInstance.send(payload) ; 

       return res.status(200).json(
        new ApiResponse(
            "Message is Sended" 
        )
       )
    }
    catch(err : any){
        return res.status(500).json(
            new ApiError(
                "Message is Not Sended" ,
                err 
            )
        )
    }
   }

   // user contanct details message 
   public sendingEmailToAllUser = async (req : any , res : any) => {
    try {

        const {subject , content} = req.body ; 

        // getting all the user 
        const allTheUser = await user.gettingAllUser() ; 
        
        
        for(let i = 0 ; i<allTheUser.length ; i ++){
          const payload : NotificationMessage = (new NotificationBuilder())
                                                 .setToEmail(allTheUser[i].email)
                                                 .setSubject(subject)
                                                 .setContent(content)
                                                 .setType("Notification")
                                                 .build() ; 
          
           await this.emailInstance.send(payload) ;                                      
                                                 
        }

        return res.status(200).json(
            new ApiResponse(
                "Email is Sended To Every One Perfectfully" 
            )
        )
        
    }
    catch(err : any) {
         return res.status(500).json(
            "Email is not sended to Everyone" , err 
         )
    } 
   }
   


   public emailToSupport = async (req : any , res : any) => {
    try {
       const {content} = req.body ; 
       const userId = req.user ; 
       const detailsOfUser = await user.userDetailsThroughStudentId(userId) ; 
       const userSubject = `Technical Glitch From The User ${detailsOfUser.allTheUserDetails?.name} having student Id ${detailsOfUser.studentDetails?.id} and email ${detailsOfUser.allTheUserDetails?.email}` ; 
       const payload : NotificationMessage = (new NotificationBuilder())
                                              .setToEmail(technicalEmail) 
                                              .setSubject(userSubject)
                                              .setContent(content)
                                              .setType("Technical Email")
                                              .build() ; 
        await emailProducer.send(payload) ; 
        
        return res.status(200).json(
            new ApiResponse(
                "Email Is Sended SuccessFully" 
            )
        )

    }
    catch(err : any){
        return res.status(500).json(
            new ApiError(
                "Email Is Not Sended" , 
                err
            )
        )
    }
   }
   





}


export const notificationController = new NotificationController(emailService)