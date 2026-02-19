import { questionDetails } from "./paper.types";
import { questionUpdateDetails } from "./testStatus.types";

export  interface cachingDataTestUpperLayer {
     testId : string[] 
}




export interface cachingDataChapterUpperLayer {
    questionId : string[]  
}

export interface chapterWiseStatus {
    questionId : string , 
    created_at : Date , 
    questionData : questionUpdateDetails , 
    studentId : string 
}