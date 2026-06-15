import { BannerType } from "@prisma/client";

export interface bannerData {
    type : BannerType,
    endTime? : Date, 
    startTime? : Date , 
    isBanner : boolean, 
    reason   : string 
}

