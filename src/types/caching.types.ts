import { questionDetails } from "./paper.types";
import { questionUpdateDetails } from "./testStatus.types";

export  interface cachingDataTestUpperLayer {
     testId : insideTestId[]
}


export interface insideTestId {
    id : string , 
    created_at : string
}



export interface cachingDataPraticeUpperLayer {
    praticeStatus : praticeWiseStatus[]  
}

export interface praticeWiseStatus {
    questionId : string , 
    created_at : Date
}
