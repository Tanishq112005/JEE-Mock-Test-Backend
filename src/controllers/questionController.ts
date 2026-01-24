import { Request, Response } from "express";
import { question } from "../repositories/question.db";
import { SubjectName } from "@prisma/client";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { questionParameters } from "../types/questions.types";
import { questionService } from "../services/questionService";
import { paper } from "../repositories/paper.db";

export class QuestionController {
  constructor() {}

  public createSingleQuestion = async (req: Request, res: Response) => {
    const {paperId , questionNumber} = req.body ; 
    try {
      const questionformatData: questionParameters =
        await questionService.htmlContentQuestions(req.body);
      await question.addingSingleQuestion(questionformatData , paperId , questionNumber);

      return res
        .status(201)
        .json(new ApiResponse("Question created successfully"));
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in creating the question", err));
    }
  };

  public uploadingAllQuestion = async (req: Request, res: Response) => {
    try {
      const { data , paperId} = req.body;

      if (!data || !data.results) {
        return res.status(400).json(new ApiError("Invalid JSON format. 'results' array missing."));
      }
      
      const result = await questionService.uploadBulkQuestions(data , paperId);

      return res
        .status(201)
        .json(new ApiResponse(result.message, result));

    } catch (err: any) {
      console.error("Controller Error:", err);
      return res
        .status(500)
        .json(new ApiError("Error in bulk uploading questions", err));
    }
  };

  public deleteQuestion = async (req: Request, res: Response) => {
    const { questionId } = req.params;

    try {
      if (!questionId) {
        return res.status(400).json(new ApiError("Question ID is required"));
      }

      await question.deletingQuestion(questionId);

      return res
        .status(200)
        .json(new ApiResponse("Question deleted successfully"));
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in deleting the question", err));
    }
  };

  public getQuestions = async (req: Request, res: Response) => {
    try {
      const year = req.query.year ? Number(req.query.year) : undefined;
      const chapterId = req.query.chapterId as string | undefined;
      const paperId = req.query.paperId as string | undefined;
      const questionId = req.query.questionId as string | undefined;
      const subject = req.query.subject as SubjectName | undefined;

      if (subject && !Object.values(SubjectName).includes(subject)) {
        return res
          .status(400)
          .json(new ApiError("Invalid Subject Name provided"));
      }

      const questionsList = await question.gettingQuestion(
        year,
        chapterId,
        paperId,
        questionId,
        subject
      );

      return res
        .status(200)
        .json(new ApiResponse("Questions fetched successfully", questionsList));
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in fetching questions", err));
    }
  };




  
  public getPaperQuestions = async (req: Request, res: Response) => {
    const { paperId } = req.params;

    try {
      
      if (!paperId) {
        return res.status(400).json(new ApiError("Paper ID is required"));
      }

   
      const paperData = await question.getQuestionsByPaperId(paperId);

      // 3. Check if paper exists
      if (!paperData) {
        return res.status(404).json(new ApiError("Paper not found"));
      }

      return res
        .status(200)
        .json(
          new ApiResponse("Paper questions fetched successfully", paperData)
        );
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in fetching paper questions", err));
    }
  };
}

export const questionController = new QuestionController();
