import { PrismaClient } from "@prisma/client";
import { database } from "../lib/database";

class ChapterWise {

    private db : PrismaClient ;  
    constructor(database : PrismaClient){
      this.db = database ; 
    }

    // now checking wheather the name is correct or not 
    
    

    // getting chapterId is already made in the chapter.db.ts
    
    // getting all the question from the chapter id 
     
}


export const chapterWise = new ChapterWise(database) ; 