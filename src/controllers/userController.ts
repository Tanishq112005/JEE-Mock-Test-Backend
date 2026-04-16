import { Category, Class, Gender, PrismaClient } from "@prisma/client";
import { database } from "../lib/database";
import ApiError from "../utils/ApiError";
import { user } from "../repositories/user.db";
import ApiResponse from "../utils/ApiResponse";
import { compare } from "bcrypt";

class UserController {

   
    constructor() {
       
    }


    public stageNumber = async(req : any , res : any) => {
        try {
           const studentId = req.user ; 

           let stageNumber = await user.stageNumber(studentId) ; 
           stageNumber = stageNumber + 1 ; 
           return res.status(200).json(
            new ApiResponse(
                `Student Is At The Stage ${stageNumber}`,
                stageNumber
            )
           )
        }

        catch(err : any){
            return new ApiError(
                "Error in getting the stage number" ,
                err 
            )
        }
    }


    public stage1 = async (req: any, res: any) => {
        try {
            const { className } = req.body;
            const studentId = req.user ; 
            if (!Object.values(Class).includes(className)) {
                return res.status(400).json(
                    new ApiError("Invalid Class Name")
                )
            }

            await user.stage1(className , studentId) ; 
            return res.status(200).json(
            new ApiResponse("Data Is Updated") 
           )
            


        }
        catch (err: any) {
            return res.status(404).json(
                new ApiError(
                    "Error Comming During the Stage 1 Submission",
                    err
                )
            )
        }
    }


    public stage2 = async (req : any , res : any) => {
        try {
          const {category , gender} = req.body ;
          const studentId = req.user ; 
          if(!Object.values(Category).includes(category)){
            return res.status(400).json(
                new ApiError("Invalid Category") 
            )
          }

          if(!Object.values(Gender).includes(gender)){
            return res.status(400).json(
                new ApiError(
                    "Invalid Gender"
                )
            )
          }


        await user.stage2(gender , category , studentId) ; 
        return res.status(200).json(
            new ApiResponse("Data Is Updated") 
           )

        }
        catch(err : any){
            return res.status(404).json(
                new ApiError(
                    "Error Comming During the Stage 2 Submission",
                    err
                )
            )
        }
    }




    public stage3 = async(req : any , res : any) => {
        try {
           const {countryCode , mobileNumber} = req.body ; 
             const studentId = req.user ; 
           await user.stage3(countryCode , mobileNumber , studentId ) ;

           return res.status(200).json(
            new ApiResponse("Data Is Updated") 
           )
        }
        catch(err : any){
            return res.status(404).json(
                new ApiError(
                    "Error Comming During the Stage 3 Submission",
                    err
                )
            )
        }
    }
    


    public studentProfile = async(req : any , res : any) => {
        try {
           const studentId = req.user ; 
           const finalData = await user.studentProfile(studentId) ; 

           return res.status(200).json(
            new ApiResponse(
                "Student Profile Data" , 
                finalData 
            )
           )
        }
        catch(err : any){
            console.log(err) ; 
            return res.status(404).json(
               new ApiError(
                "Student profile not found. Please complete your profile setup" , err )
            )
        }
    }
    
    

    public updateData = async (req : any , res : any) => {
        try {
           const {name ,  className , category , countryCode , mobileNumber , gender} = req.body ; 
           
           const studentId = req.user ; 
        if (!Object.values(Class).includes(className)) {
                return res.status(400).json(
                    new ApiError("Invalid Class Name")
                )
            }

             if(!Object.values(Category).includes(category)){
            return res.status(400).json(
                new ApiError("Invalid Category") 
            )
          }

          if(!Object.values(Gender).includes(gender)){
            return res.status(400).json(
                new ApiError(
                    "Invalid Gender"
                )
            )
          }


          await user.updateStudent(studentId , className , gender , category , name , countryCode , mobileNumber) ; 

          return res.status(200).json(
            new ApiResponse(
                "Your Profile is Updated" 
            )
          )

        }
        catch(err : any){
            return res.status(400).json(
                new ApiError(
                    "Error in updating the Student Profile",
                    err 
                ) 
            )
        }
    }




};


export const userController = new UserController();  