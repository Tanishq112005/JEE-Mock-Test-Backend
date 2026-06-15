import { PrismaClient } from "@prisma/client";
import { bannerData } from "../types/banner.types";
import { database } from "../lib/database";
 
class Banner {
    private db : PrismaClient ; 
    
    constructor(database : PrismaClient){
        this.db = database ; 
    }
    
    
    async currentBannerStatus(){
        try {
          const checkingBannerCondition = await this.db.banner.findFirst({
            where : {
                id : 1 
            }
          })

          return checkingBannerCondition ; 
        }
        catch(err : any){
            throw err ; 
        }
    }

   

    // once the data entry is created then it remains same for every time 
   async creatingAndUpdatingBanner(inputData: bannerData) { 
    try {
        
        const existingBanner = await this.db.banner.findFirst({
            where: { id: 1 }
        });
  
        if (!existingBanner) {
            await this.db.banner.create({ 
                data: {
                    isbanner: inputData.isBanner, 
                    startTime: inputData.startTime ?? new Date(), 
                    endTime: inputData.endTime ?? new Date(), 
                    reason: inputData.reason,
                    type: inputData.type
                }
            });
        }
        else {
            await this.db.banner.update({
                where : {
                    id : 1 
                }
                , 
                data : {
                     isbanner: inputData.isBanner, 
                startTime: inputData.startTime, 
                endTime: inputData.endTime, 
                reason: inputData.reason,
                type: inputData.type
                }
            })
        }
    }   
    catch(err: any) {
        console.error("Failed to create banner:", err);
        throw err;
    } 
}



} ;


export const bannerDB = new Banner(database) ; 