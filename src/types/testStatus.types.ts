import { AttemptStatus, TestState } from "@prisma/client"
import { 
  ExamMode, Month, Day, ExamName, questionType 
} from "@prisma/client";

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




// This is the exact type returned by your Prisma query
export type TestSubmissionPayload = {
  id: string;
  studentId: string;
  paperId: string;
  status: TestState;          // e.g., "COMPLETED"
  timeLeft: number;
  activeQuestionId: string | null;
  isAnalyzed: boolean;
  activeSection: string | null;
  created_at: Date;
  updated_at: Date;

  // 1. User Info (Note: Maps to 'studentProfile' table)
  user: {
    id: string;
    user_id: string;
    class: number | null;
    institution: string | null;
    phone: bigint | null;
    phone_country_code: string | null;
    streak: number;
    maximumStreak: number;
    globalRank: number;
    created_at: Date;
    updated_at: Date;
  };

  // 2. Paper & Exam Info
  papers: {
    id: string;
    examId: string;
    year: number | null;
    mode: ExamMode;           // e.g., "online"
    month: Month;             // e.g., "January"
    day: Day;
    totalMarks: number | null;
    totalDuration: number | null;
    totalQuestions: number | null;
    exam: {
      id: string;
      name: ExamName;         // e.g., "JEE_MAIN"
    };
  };

  // 3. Array of Question Attempts
  testQuestionStatus: Array<{
    id: string;
    questionId: string;
    testStatusId: string;
    isCorrect: boolean;
    status: AttemptStatus;    // e.g., "answered" | "notAnswered"
    marksObtained: number;
    timeSpent: number;        // in seconds
    userAnswer: string[];
    isVisited: boolean;
    markedForReview: boolean;
    
    // The actual question data nested inside the attempt
    questions: {
      id: string;
      subjectId: string;
      chapterId: string | null;
      paperId: string | null;
      class: number;
      content: string;
      image: string[];
      type: questionType;     // e.g., "SingleCorrect"
      questionNumber: number;
      comprehensionContent: string | null;
      comprehensionImage: string[];
      positiveMarks: number;
      negativeMarks: number;
      isOutOfSyllabus: boolean;
      isBonus: boolean;
      correctAnswer: string[];
    };
  }>;
};


