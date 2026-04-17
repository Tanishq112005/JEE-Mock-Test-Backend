import { Day, ExamMode, ExamName, Month, questionType, Session, Shift } from "@prisma/client";


export interface paperDetails {
    exam : ExamName;
    shift : Shift ; 
    day : Day ;
    Month : Month ; 
    year : number ; 
    date : string ; 
    mode : ExamMode; 
    session : Session ;
    totalDuration : number ; 
    totalMarks? : number | 0  ;
    totalMultiChoice? : number | 0 ; 
    totalSingleChoice? : number | 0;
    totalInteger? : number | 0 ;
}


export interface questionDetails {
    paperId : string ; 
    questionType : questionType ;
    positiveMarks : number ; 
    negativeMarks : number ;

}

export interface markingSchemePayload {
    paperId : string ;
    integerPositiveMarks? : number ;
    integerNegativeMarks? : number ; 
    singleCorrectPositiveMarks? : number ; 
    singleCorrectNegativeMarks? : number ; 
    multiCorrectPositiveMarks? : number ;
    multiCorrectNegativeMarks? : number ; 
    comprehensionSingleCorrectPositiveMarks? : number ; 
    comprehensionSingleCorrectNegativeMarks? : number ; 
    comprehensionMultiCorrectPositiveMarks? : number ;
    comprehensionMultiCorrectNegativeMarks? : number ; 
    comprehensionIntgerPositiveMarks? : number ; 
    comprehensionIntegerNegativeMarks? : number ; 
    integerPartial? : boolean ; 
    singleCorrectPartial? : boolean ; 
    multiCorrectPartial? : boolean ;
    comprehensionSingleCorrectPartial? : boolean ; 
    comprehensionMultiCorrectPartial? : boolean ;
    comprehensionIntegerPartial? : boolean ;  
}