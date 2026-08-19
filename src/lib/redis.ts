import {
  QUESTION_STORE_REDIS_URL,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
  REDIS_USERNAME,
  REDIS_CACHE_EXPIRATION_SECONDS
} from "../config/env";
import { createClient, RedisClientType } from "redis";

export const REDIS_CACHE_EXPIRATION = REDIS_CACHE_EXPIRATION_SECONDS ? parseInt(REDIS_CACHE_EXPIRATION_SECONDS, 10) : 86400 * 7;

class RedisConfig {
  public questionBitMapclient: RedisClientType;
  public questionsClient : RedisClientType ; 
  constructor() {
    const questionBitMapclientPort = parseInt(REDIS_PORT as string, 10) || 6379;
    
    this.questionBitMapclient = createClient({
      username: REDIS_USERNAME,
      password: REDIS_PASSWORD,
      socket: {
        host: REDIS_HOST,
        port: questionBitMapclientPort
      },
      pingInterval: 1000 * 60 * 4, // 4 minutes
    });
   
    
    this.questionsClient = createClient({
      url: QUESTION_STORE_REDIS_URL,
      socket: {
        family: 4
      },
      pingInterval: 1000 * 60 * 4, // 4 minutes
    });
   

    this.questionBitMapclient.on("error", (err: any) =>
      console.log("Questions Bit Map Redis Client Error:", err),
    );
    this.questionBitMapclient.on("connect", () =>
      console.log("Questions Bit Map Redis Connected Successfully"),
    );
    
    this.questionsClient.on("error"  , (err : any) => 
      console.log("Questions Redis Client Error:" , err)
    ) ;  

    this.questionsClient.on("connect" , () => 
      console.log("Questions Redis Connected")  
    )
    
    this.connect();
    
  }

  private async connect() {
    try {
      await this.questionBitMapclient.connect();
      await this.questionsClient.connect() ;
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
    }
  }
  

  // functions for the redis auth and all 
  getRedisEmailKey(email: string) {
    return `OTP:${email}`;
  }

  getRedisLimitKey(keyPrefix: string, identifier: string) {
    return `rate_limit:${keyPrefix}:${identifier}`;
  }
  


  // functions for the questions loader in the redis 
  getRedisChapterDataUsingChapterName(chapterName : string){
    return `ChapterDataUsingChapterName:${chapterName}`;
  }

  getRedisChapterDataUsingChapterId(id : string){
    return `ChapterDataUsingChapterId:${id}` ; 
  }

  getRedisQuestionsUsingChapterId(chapterId: string) {
    return `QuestionsUsingChapterId:${chapterId}`;
  }

  getRedisGroupName(subjectName: string) {
    return `GroupName:${subjectName}`;
  }

  getRedisChaptersByGroup(groupName: string) {
    return `ChaptersByGroup:${groupName}`;
  }

  getRedisPaperData(paperId: string) {
    return `PaperData:${paperId}`;
  }

  getRedisPapersList(year: number, examName?: string) {
    return `papers:list:${year}:${examName || 'all'}`;
  }
   
  getRedisExamList() {
    return `ExamList`;
  }

  getRedisExamId(examName: string) {
    return `ExamId:${examName}`;
  }
}

export const redisConfig = new RedisConfig();
export const questionBitMapRedisclient = redisConfig.questionBitMapclient;
export const questionRedisclient = redisConfig.questionsClient ; 