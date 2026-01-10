import { SubjectName } from "@prisma/client";

export interface chapterInform {
    name: string,
    chapterNumber: number,
    classNumber: number,
    subject: SubjectName,
    isCbse: boolean,
    isJeeMain: boolean,
    isJeeAdvanced: boolean
}


export interface deletingPayload {
    id: string
}


export interface gettingPayload {
    classNumber?: number,
    subjectName?: SubjectName

}