import { paperMarkingScheme, questionType } from "@prisma/client";

export class AnswerVerifyService {

    private paperMarkingScheme : paperMarkingScheme[] ; 
    constructor(paperMarkingScheme : paperMarkingScheme[]) {
       this.paperMarkingScheme = paperMarkingScheme ; 
    } 
     

     
      questionResult(userAnswer : string[] , correctAnswer : string[] , questionType : questionType ) : {
         marks : number , 
         verdict : string
      }{

       // defining the random marking schema 
       let questionMarkingScheme : paperMarkingScheme = {
        isPartial : false , 
        positiveMarks : 4 ,
        negativeMarks : 1 ,
        id : 'efe7370b-f81e-43bd-9eec-7fb225c099eb' , 
        paperId : 'ae71c552-6b6c-455a-9fa1-a637fa36cae0' , 
        questionType : "Integer"
       } 


       for(let i = 0 ; i<this.paperMarkingScheme.length ; i++){
        if(this.paperMarkingScheme[i].questionType == questionType){
            questionMarkingScheme = this.paperMarkingScheme[i] ; 
            break;
        }
       }
       
       if(questionMarkingScheme.isPartial && (questionType === "MultiCorrect" || questionType === "ComprehensionMultiCorrect")){
          let count : number  = 0 ; 

          if(userAnswer == correctAnswer){
            return {
                marks : questionMarkingScheme.positiveMarks,
                verdict : "correct"
             } ; 
          }



          for(let i = 0 ; i<userAnswer.length ; i++){
            let matched : boolean = false ; 
            for(let j = 0 ; j<correctAnswer.length ; j++){
                if(userAnswer[i] == correctAnswer[j]){
                    matched = true ; 
                    break;
                }
            }
             
            if(matched){
                count ++ ; 
            }
            else {
                return {
                    marks : questionMarkingScheme.negativeMarks,
                    verdict : "wrong"
                  }  ; 
            }
          }
          
          return {
               marks : count,
               verdict : "partial"
           } ; 
       }
       else {
        if(userAnswer == correctAnswer){
            return {
                marks : questionMarkingScheme.positiveMarks,
                verdict : "correct"
             } ;
        }
        else {
            return {
                marks : questionMarkingScheme.negativeMarks,
                verdict : "wrong" 
             } ; 
        }
       }
    }



}




