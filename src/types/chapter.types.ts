import { SubjectName } from "@prisma/client";

export interface chapterInform  {
    name : string ,
    chapterNumber : number , 
    classNumber : number , 
    subject : SubjectName  
}


export interface deletingPayload {
    id : string 
}


export interface gettingPayload {
    classNumber? : number ,
    subjectName? : SubjectName

}