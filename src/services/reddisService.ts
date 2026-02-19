import { reddisConfigForCaching } from "../lib/caching";
import { analytics } from "../repositories/analytics.db";
import { cachingDataChapterUpperLayer, cachingDataTestUpperLayer } from "../types/caching.types";
import { updatingDetails } from "../types/testStatus.types";
import { testEvaluation } from "./testEvaluationService";
import { questionBitmapRegistry } from "./uniqueCountService";


class ReddisService {
    
    
  
    constructor(){
      
    }


    async reddisTestData(studentId : string) {
        try {
          
            // collecting the data of the user for the questions 

            const usersTestData : cachingDataTestUpperLayer = await reddisConfigForCaching.gettingData(`${studentId}:testUpperLayer`)  ;
          
            
            // now getting the user data 
            let userTestReddis = [] ; 
            if(usersTestData){
                

                for(let i = 0 ; i<usersTestData.testId.length ; i++){
                    const testId = usersTestData.testId[i] ; 
                    const testData : updatingDetails = await reddisConfigForCaching.gettingData(`${studentId}:${testId}`) ; 
                    const finalTestResult  = await testEvaluation.evaluation(testData , studentId) ; 
                    userTestReddis.push({
                        testId : testId , 
                        created_at : testData.created_at , 
                        finalTestResult 
                        }
                    ) ; 
                }


            }
            
            
            
          
            return {
                testData : userTestReddis 
            }
        }
        catch(err : any){
            console.error(err) ; 
           throw err ; 
        }
         
    }


    async reddisChapterWiseData(studentId : any){
        try {
             const usersChapterWiseData : cachingDataChapterUpperLayer = await reddisConfigForCaching.gettingData(`${studentId}:chapterUpperLayer`) ;

             let userChapterWiseReddis = [] ; 
            if(usersChapterWiseData){
                for(let i = 0 ; i<usersChapterWiseData.questionId.length ; i++){
                   const questionId = usersChapterWiseData.questionId[i] ; 
                   await questionBitmapRegistry.markAttempted(studentId , questionId) ; 
                   const questionDetails = await reddisConfigForCaching.gettingData(`${studentId}:${questionId}`) ; 
                   userChapterWiseReddis.push(questionDetails) ; 
                }
            }
             
            return {
                chapterWiseData : userChapterWiseReddis 
            }
        }
        catch(err : any){
            console.error(err) ; 
            throw err ; 
        }
    }
    
    
    

}


export const  reddisService = new ReddisService() ; 
