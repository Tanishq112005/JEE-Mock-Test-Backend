import { AttemptStatus, TestState } from "@prisma/client";

export interface detailsFromFrontend  {
    testId : string ;
    paperId : string ;
    timeLeft : number ;
    created_at : Date ;
    timeStamp : Date ;
    state :  TestState ;
    activeSection : string ; 
    activeQuestionId : string ;
    questionsById : questionDetailsFromFrontend[] ;
}


export interface questionDetailsFromFrontend {
    isVisited : boolean ;
    markedForReview : boolean ; 
    questionId : string ; 
    timeSpentSeconds : number ; 
    status : AttemptStatus ; 
    userAnswer : string[] ;
}