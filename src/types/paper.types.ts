import { Day, ExamMode, ExamName, Month, questionType, Shift } from "@prisma/client";


export interface paperDetails {
    exam : ExamName;
    shift : Shift ; 
    day : Day ;
    Month : Month ; 
    year : number ; 
    date : string ; 
    mode : ExamMode; 
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
}