import { BannerType } from "@prisma/client";

export interface bannerData {
    id : string , 
    type : BannerType,
    endTime? : Date, 
    startTime? : Date , 
    isBanner : boolean, 
    reason   : string 
}

