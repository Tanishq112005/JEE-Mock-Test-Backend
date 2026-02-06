import { InventoryIncludedObjectVersions } from "@aws-sdk/client-s3";
import { updatingTestDetailsProducer } from "../rabbitmq/producers/updateTestDetails-producer";
import { paper } from "../repositories/paper.db";
import { testStatus } from "../repositories/testStatus.db";
import { user } from "../repositories/user.db";
import { updatingDetails } from "../types/testStatus.types";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { AttemptStatus } from "@prisma/client";
import { questionDetails } from "../types/paper.types";
import { detailsFromFrontend, questionDetailsFromFrontend } from "../types/update.types";
import { testEvaluationProducer } from "../rabbitmq/producers/testEvalution-producer";

class TestStatusController {
    constructor(){

    }
    
    // creating new test 
    public createTestStatus = async (req : any , res : any) => {
        const {paperId} = req.body ; 
        const userId = req.user ; 
        
        try {
           const testStatusDetails = await testStatus.startNewTestSession(userId , paperId);
            
           return res.status(200).json(
            new ApiResponse(
                "Test Details" , 
                testStatusDetails
            )
           )
        }

        catch(err : any){
            return res.status(500).json(
                new ApiError("Error in Creating Test" , err)
            )
        }
    }

    // getting question and details 
    public gettingQuestionAndDetails = async(req : any , res : any) => {
        const {testStatusId} = req.query ; 
        const userId = req.user ; 
        try {
            
            const gettingTheTestResponse = await testStatus.getSessionData(testStatusId , userId) ; 
            return res.status(200).json(
                new ApiResponse(
                    "Your question + test result" , 
                    gettingTheTestResponse
                )
            )

        }
        catch(err : any){
            return res.status(500).json(
                new ApiError(
                    "Error in getting question details" , 
                    err 
                )
            )
        }
    }
    

    
    public updatingTheDetails = async(req : any , res : any) => {
        const {testId , paperId , timeLeft , created_at , timeStamp , state , activeSection , activeQuestionId , questionsById }  : detailsFromFrontend = req.body ;
        const userId = req.user ; 
        try {
            const questionStatusArray = Object.values(questionsById || {}).map((q: questionDetailsFromFrontend) => {
               
               
                
                if(q.status == AttemptStatus.answered){
                return {
                    isVisited : q.isVisited , 
                    markedForReview : q.markedForReview , 
                    questionId: q.questionId,
                    userAnswer: q.userAnswer ,  
                    timeSpent: q.timeSpentSeconds || 0,
                    status : AttemptStatus.answered
                };
            }
                else {
                   return {
                    isVisited : q.isVisited , 
                    markedForReview : q.markedForReview , 
                    questionId: q.questionId,
                    userAnswer: q.userAnswer ,  
                    timeSpent: q.timeSpentSeconds || 0,
                    status : AttemptStatus.notAnswered
                };
                }
            
            });

            const details : updatingDetails = {
                testId : testId , 
                userId : userId , 
                paperId : paperId , 
                timeLeft : timeLeft , 
                activeQuestionId : activeQuestionId , 
                activeSection : activeSection , 
                created_at : created_at ,
                timeStamp : timeStamp , 
                state : state ,
                questionStatus : questionStatusArray
            }

            // sending in the queue 
            const pushingInQueue = await updatingTestDetailsProducer.updateData(details) ; 
            
            return res.status(200).json(
                new ApiResponse(
                    "Pushed in queue" 
                )
            )
        }
        catch(err : any){
            res.status(500).json(
                new ApiError("Error in updating the details" , err)
            )
        }
    }

    //  last test session of the user with the paper 
    public LastTestDetails = async(req : any , res : any) => {
        const {paperId} = req.query ; 
        const userId = req.user ; 

        try {
            const testStatusDetails = await testStatus.gettingAllTestDetails(userId , paperId) ;
            let payload ; 
            if(testStatusDetails.length === 0){
                payload = {} ; 
            }
            else {
                payload = {
                    status : testStatusDetails[0].status ,
                    created_at : testStatusDetails[0].created_at ,
                    testId : testStatusDetails[0].id
                } 
            }

            return res.status(200).json(
                new ApiResponse("Last Test Data" , payload) 
            )
            
            
        }
        catch(err : any){
            return res.status(500).json(
                new ApiError("Error in getting Details" , err)
            )
        }
    } 

    
    // submitting the test 
    public submitTest = async(req : any , res : any) => {
        const {testId , paperId , timeLeft , created_at , timeStamp , state , activeSection , activeQuestionId , questionsById }  : detailsFromFrontend = req.body ;
        const userId = req.user ; 

      
            try {
            const questionStatusArray = Object.values(questionsById || {}).map((q: questionDetailsFromFrontend) => {
               
               
                
                if(q.status == AttemptStatus.answered){
                return {
                    isVisited : q.isVisited , 
                    markedForReview : q.markedForReview , 
                    questionId: q.questionId,
                    userAnswer: q.userAnswer ,  
                    timeSpent: q.timeSpentSeconds || 0,
                    status : AttemptStatus.answered
                };
            }
                else {
                   return {
                    isVisited : q.isVisited , 
                    markedForReview : q.markedForReview , 
                    questionId: q.questionId,
                    userAnswer: q.userAnswer ,  
                    timeSpent: q.timeSpentSeconds || 0,
                    status : AttemptStatus.notAnswered
                };
                }
            
            });

            const details : updatingDetails = {
                testId : testId , 
                userId : userId , 
                paperId : paperId , 
                timeLeft : timeLeft , 
                activeQuestionId : activeQuestionId , 
                activeSection : activeSection , 
                created_at : created_at ,
                timeStamp : timeStamp , 
                state : state ,
                questionStatus : questionStatusArray
            }

            // sending in the queue 
            const pushingInQueue = await testEvaluationProducer.evaluateTheData(details); 
            
            return res.status(200).json(
                new ApiResponse(
                    "Pushed in queue" 
                )
            )
        }
        catch(err : any){
            res.status(500).json(
                new ApiError(
                    "Error in submitting the test" , err
                )
            )
        }
    }

}


export const testStatusController = new TestStatusController() ; 