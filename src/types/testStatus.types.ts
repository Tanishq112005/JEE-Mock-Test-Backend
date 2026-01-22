import { TestState } from "@prisma/client"

export interface updatingDetails {
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


