import { bookMarked } from "../repositories/bookMarked.db";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

class BookMarkedController {
    constructor(){

    }

    public create = async (req : any , res : any) => {
        try {
           const studentId = req.user ; 
           const {questionId} = req.body ; 

           await bookMarked.add(studentId , questionId) ; 
           return res.status(200).json(
            new ApiResponse(
                "Question Is SuccessFully Added In the List"
            )
           )
        }
        catch(err : any){
            return res.status(400).json(
                new ApiError("Error in Making The Question BookMarked" , err) 
            )
        }
    }


    public checking = async (req : any , res : any) => {
        try {
          const studentId = req.user ; 
           const {questionId} = req.body ; 

           const checking : boolean = await bookMarked.checking(studentId , questionId) ;
           
           if(checking){
            return res.status(200).json(
                new ApiResponse(
                    "Question Is Already Present In BookMarked List"
                )
            )
           }
           else {
            return res.status(200).json(
                new ApiResponse(
                    "Question Is Not Already Present In BookMarked List"
                )
            )
           }
        }
        catch(err : any){
            return res.status(400).json(
                new ApiError(
                    "Error In Checking" ,
                    err 
                )
            )
        }
    }



    public remove = async (req : any , res : any) => {
       try {
           const studentId = req.user ; 
           const {questionId} = req.query ; 
           
           await bookMarked.remove(studentId , questionId) ; 

           return res.status(200).json(
            new ApiResponse(
                "Question Is Removed From The BookMarked"
            )
           )
       }
       catch(err : any){
        return res.status(400).json(
            new ApiError(
                "Error In Removing The Question" ,
                err 
            )
        )
       }
    }

    
    public get = async(req : any , res : any) => {
        try {
             const studentId = req.user ; 
             const questionList = await bookMarked.bookMarkedQuestion(studentId) ; 

             return res.status(200).json(
                new ApiResponse(
                    "Question List Is" , 
                    questionList
                )
             )


        }
        catch(err : any){
            return res.status(400).json(
                new ApiError(
                    "Error in Getting the Bookmarked Question" ,
                    err
                )
            )
        }
    }
    
}


export const bookMarkedController = new BookMarkedController() ; 