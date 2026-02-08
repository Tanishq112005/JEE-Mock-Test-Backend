import { emailAddingProducer } from "../rabbitmq/producers/emailAdding-producer";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

class EmailController {
    constructor() {

    }


    public addEmail = async (req :any , res : any ) => {

        const {email} = req.body ; 
        try {
           const addEmail = await emailAddingProducer.add(email) ;   
           res.status(200).json(
            new ApiResponse(
                "Email is Added SucessFully"
            )
           )
        }
        catch(err : any){
           
           res.status(500).json(
            new ApiError(
                "Email is Already Added" , 
                err 
            )
           )
        }
    }


}


export const emailController = new EmailController() ; 