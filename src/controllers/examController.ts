import { Request, Response } from "express";
import ApiError from "../utils/ApiError";
import { ExamName } from "@prisma/client";
import { exam } from "../repositories/exam.db";
import ApiResponse from "../utils/ApiResponse";

class ExamController {
  constructor() {}

  // adding the exam
  public createExam = async (req: Request, res: Response) => {
    const { name } = req.body;
    try {
      if (!Object.values(ExamName).includes(name)) {
        return res.status(400).json(new ApiError("Invalid exam name"));
      }
      await exam.addingExam(name);

      res.status(200).json(new ApiResponse("Exam is successfully created"));
    } catch (err: any) {
      res.status(500).json(new ApiError("Error in creating the exam", err));
    }
  };

  // deleting the exam
  public deleteExam = async (req: Request, res: Response) => {
    const { name } = req.body;
    try {
      if (!Object.values(ExamName).includes(name)) {
        return res.status(400).json(new ApiError("Invalid exam name"));
      }

      await exam.deletingExam(name);
      res.status(200).json(new ApiResponse("Exam is successfully deleted"));
    } catch (err: any) {
      res.status(500).json(new ApiError("Error in deleting the exam", err));
    }
  };

  // getting all the exam
  public givingExamName = async(req : Request , res : Response) => {
    try {
        const exmaList : string[] = await exam.gettingExam() ; 
        res.status(200).json(new ApiResponse("All Exams Present in db are :" , exmaList));
    }
    catch(err : any){
        res.status(500).json(new ApiError("Error in getting the exam", err));
    }
  } 
}



export const examController = new ExamController() ; 