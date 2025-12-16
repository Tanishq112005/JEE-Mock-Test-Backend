import { Request, Response } from "express";
import ApiError from "../utils/ApiError";
import { subject } from "../repositories/subject.db";
import { SubjectName } from "@prisma/client";
import ApiResponse from "../utils/ApiResponse";

export class SubjectController {
 
  constructor() {
    
  }

  // adding the subject
  public createSubject = async (req: Request, res: Response) => {
    const { name } = req.body;

    try {
      if (!Object.values(SubjectName).includes(name)) {
        return res.status(400).json(new ApiError("Invalid subject name"));
      }

      await subject.addingSubject(name as SubjectName);

      return res
        .status(200)
        .json(new ApiResponse("Subject created successfully"));
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in creating the subject", err));
    }
  };


  // deleting the subject
 public deletingSubject = async (req : Request , res : Response) => {
   const {name} = req.body ; 

   try {
      if (!Object.values(SubjectName).includes(name)) {
        return res.status(400).json(new ApiError("Invalid subject name"));
      }

      await subject.deletingSubject(name) ; 
      return res.status(200).json(
        new ApiResponse("Subject is deleted successfully") 
      )
   }
   catch(err : any){
    res.status(500).json(
      new ApiError("Error in deleting the subject" , err) 
    ) ; 
   }
 }



  // giving all the subject name
   public givingSubjectName = async (req : Request , res : Response) => {
     try {
        const subjectList : string[]  = await subject.readingAllSubjects() ; 
        res.status(200).json(
          new ApiResponse("All Subject List Is : " , subjectList) 
        )
     }
     catch(err : any){
      res.status(500).json(
        new ApiError("Error in giving the name of all subject from the database" , err) 
      )
     }
   }


}

export const subjectController = new SubjectController();
