import { AttemptStatus, TestState } from "@prisma/client"

export interface updatingDetails {
    testId : string , 
    userId: string,
    paperId: string,
    timeLeft: number,
    activeSection: string,
    activeQuestionId: string,
    created_at : Date , 
    timeStamp : Date , 
    state : TestState,
    questionStatus : questionUpdateDetails[] 
}


export interface questionUpdateDetails {
    questionId: string,
    isVisited: boolean,
    timeSpent: number,
    markedForReview: boolean,
    userAnswer: string[]
}


export interface testDetailsInDB {
    id : string ,
    studentId : string , 
    paperId : string , 
    status : TestState ,
    timeLeft : number ,
    activeSection? : string ,
    activeQuestionId? : string ,
    created_at : Date , 
    updated_at : Date ,
    testQuestionAttemeptStatus :  testQuestionAttemptStatusDB[]

}


export interface testQuestionAttemptStatusDB{
    id : string ,
    questionId : string , 
    testStatus : string ,
    isCorrect : Boolean , 
    status : AttemptStatus , 
    marksObtained : number , 
    isVisited : Boolean , 
    markedForReview : Boolean , 
    timeSpent : number ,
    userAnswer : String[]  
}