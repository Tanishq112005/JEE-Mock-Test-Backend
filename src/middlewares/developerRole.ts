import { UserType } from "@prisma/client";
import ApiError from "../utils/ApiError";

export const developerRoleMiddleware = (req :  any , res : any , next : any) => {
    if(req.type == UserType.Developer){
       return next() ; 
    }
    else {
        res.status(500).json(
            new ApiError(
                "Unauthorised Access" 
            )
        )
    }
} 

