import { questionType } from "@prisma/client";

export interface optionsStoring {
    identifier : string ;
    content : string ; 
    image : string[] ; 
}


export interface questionParameters {
    id : string , 
    postiveMarks : number ;
    negativeMarks : number ; 
    subject : string ;
    question : string ;
    questionImage : string[] ;
    comprehension : string ; 
    comprehensionImage : string[] ; 
    options : optionsStoring[] ;  
    correctAnswer : string[] ; 
    questionType : questionType ; 
    chapter : any ; 
    explation : string ; 
    explationImage : string[] ; 
    isOutOfSyllabus : boolean ; 
    isBonus : boolean ;
    chapterGroup : string ; 
}


