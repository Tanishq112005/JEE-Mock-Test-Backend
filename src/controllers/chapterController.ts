import { Request, Response } from "express";
import ApiError from "../utils/ApiError";
import { SubjectName } from "@prisma/client";
import { chapterInform, deletingPayload, gettingPayload } from "../types/chapter.types";
import { chapter } from "../repositories/chapter.db";
import ApiResponse from "../utils/ApiResponse";

class ChapterController {
  constructor() {}

  // adding the chapter
  public addingChapter = async (req: Request, res: Response) => {
    const { name, chapterNumber, classNumber, subject } = req.body;
    try {
      
      if (!Object.values(SubjectName).includes(subject)) {
        return res.status(400).json(new ApiError("Invalid subject name"));
      }

      const payload: chapterInform = {
        name: name,
        chapterNumber: chapterNumber,
        classNumber: classNumber,
        subject: subject,
      };
   
      await chapter.addingChapter(payload);
      res.status(200).json(new ApiResponse("Chapter is added successfully"));
    } catch (err: any) {
      console.log(err) ;
      res.status(500).json(new ApiError("Error in adding the chapter", err));
    }
  };



  // deleting the chapter
   public deletingChapter = async (req : Request , res : Response) => {
    const {id} = req.body ; 
    try {
      const payload : deletingPayload = {
        id : id 
      }

      await chapter.deletingChapter(payload) ; 
      res.status(200).json(
        new ApiResponse("Chapter is removed successfully") 
      )
    }
    catch(err : any){
        res.status(500).json(
            new ApiError("Error in deleting the chapter" , err) 
        )
    }
   }




  // getting all the chapter
  public getChapters = async (req: Request, res: Response) => {
    try {
      const { classNumber, subjectName } = req.query;

     
      const payload: gettingPayload = {};

      if (classNumber) {
        payload.classNumber =  Number(classNumber);
      }

      if (subjectName) {
        
        if (!Object.values(SubjectName).includes(subjectName as SubjectName)) {
          return res
            .status(400)
            .json(new ApiError("Invalid subject name"));
        }

        payload.subjectName = subjectName as SubjectName;
      }

      const chapters = await chapter.gettingChapter(payload);

      return res.status(200).json(
        new ApiResponse("Chapters fetched successfully", chapters)
      );
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error fetching chapters", err));
    }
  };
}

export const chapterController = new ChapterController();
