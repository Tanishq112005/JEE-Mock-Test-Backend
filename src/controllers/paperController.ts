import { Request, Response } from "express";
import { paper } from "../repositories/paper.db";
import { ExamName, Session } from "@prisma/client";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { markingSchemePayload, paperDetails } from "../types/paper.types";
import { encryptPayload } from "../utils/encryption";
export class PaperController {
  constructor() {}

  public createPaper = async (req: Request, res: Response) => {
    try {
    
      const paperData: paperDetails = req.body;
      
      if (
        !paperData.exam ||
        !Object.values(ExamName).includes(paperData.exam)
      ) {
        return res
          .status(400)
          .json(new ApiError("Invalid or missing Exam Name"));
      }
      

      if(!Object.values(Session).includes(paperData.session)) {
        return res.status(400).json(
          new ApiError(
            "Session Name is Wrong" 
          )
        )
      }
      const paperId =  await paper.addingPapers(paperData);

      return res
        .status(201)
        .json(new ApiResponse("Paper created successfully" , {
          "paperId" : paperId
        }));
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in creating the paper", err));
    }
  };

  
  public deletePaper = async (req: Request, res: Response) => {

    const { paperId } = req.params;

    try {
      if (!paperId) {
        return res.status(400).json(new ApiError("Paper ID is required"));
      }

      await paper.deletingPapers(paperId);

      return res
        .status(200)
        .json(new ApiResponse("Paper deleted successfully"));
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in deleting the paper", err));
    }
  };


  public getAllPapers = async (req: Request, res: Response) => {
    try {
     
      const year = Number(req.query.year) || 0;
      const examName = req.query.examName as ExamName | undefined;

      
      if (year === 0 && !examName) {
        return res
          .status(400)
          .json(
            new ApiError(
              "Please provide a 'year' or 'examName' query parameter"
            )
          );
      }

      
      if (examName && !Object.values(ExamName).includes(examName)) {
        return res.status(400).json(new ApiError("Invalid Exam Name provided"));
      }

      const { redisConfig, questionRedisclient, REDIS_CACHE_EXPIRATION } = await import("../lib/redis");
      const redisKey = redisConfig.getRedisPapersList(year, examName);
      const cachedPapers = await questionRedisclient.get(redisKey);

      if (cachedPapers) {
        console.log(`[Cache Hit] Papers list for year ${year} and exam ${examName || 'all'} coming from Redis.`);
        return res.status(200).json(
          new ApiResponse("Papers Details Successfully Fetched", encryptPayload(JSON.parse(cachedPapers)))
        );
      }

      console.log(`[Cache Miss] Papers list for year ${year} and exam ${examName || 'all'} coming from Database.`);
      const papersList = await paper.gettingPaperInformation(year, examName);

      if (papersList instanceof ApiError) {
        return res.status(400).json(papersList);
      }

      await questionRedisclient.setEx(redisKey, REDIS_CACHE_EXPIRATION, JSON.stringify(papersList));

      return res
        .status(200)
        .json(
          new ApiResponse(
            "Papers Details Successfully Fetched",
            encryptPayload(papersList)
          )
        );
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in fetching papers", err));
    }
  };


   public addingMarkingScheme = async (req : Request , res : Response) => {
    try {
      const {payload}  = req.body  

      await paper.addpaperMarkingScheme(payload) ; 

      return res.status(200).json(
        new ApiResponse(
          "Paper marking Scheme Is Uploaded"
        )
      )
    }
    catch(err : any){
      return res.status(400).json(
        new ApiError(
          "Error In Adding The Marking Scheme"
        )
      )
    }
   }
   

   public gettingMarkingScheme = async (req : Request , res : Response) => {
    try {
      const {paperId} = req.params ; 
      const data = await paper.paperMarkingScheme(paperId) ;
      return res.status(200).json(
        new ApiResponse(
          "Your Marking Scheme Of The Paper" , 
          encryptPayload(data)
        ) 
      )
    }
    catch(err : any){
      return res.status(400).json(
        new ApiError(
          "Error in getting the Marking Scheme"
        )
      )
    }
   }
} 

export const paperController = new PaperController();
