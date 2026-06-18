import { ObjectEnumValue } from "@prisma/client/runtime/client";
import ApiError from "../utils/ApiError";
import { BannerType } from "@prisma/client";
import { bannerDB } from "../repositories/banner.db";
import ApiResponse from "../utils/ApiResponse";

const parseIST = (timeStr?: string) => {
    if (!timeStr) return undefined;
    if (timeStr.includes('Z') || timeStr.includes('+') || timeStr.match(/-\d{2}:\d{2}$/)) {
        return new Date(timeStr);
    }
    return new Date(timeStr + "+05:30");
};


const formatIST = (date?: Date | null) => {
    if (!date) return undefined;
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(date.getTime() + istOffset);
    return istTime.toISOString().replace('Z', '+05:30');
};


class BannerController {
    constructor(){

    }

    public createAndUpdate  = async (req : any , res : any) => {
         try {
            const {id , type , isBanner , startTime , endTime , reason } = req.body ; 
            if(!Object.values(BannerType).includes(type)){
                res.status(500).json(
                    new ApiError(
                        "Please Correctly Enter The Type Of The Banner From The Given Types Only" 
                    )
                )
                return;
            }

            const parsedStartTime = parseIST(startTime);
            const parsedEndTime = parseIST(endTime);

            await bannerDB.creatingAndUpdatingBanner({
                id : id , 
                type : type , 
                isBanner : isBanner , 
                startTime : parsedStartTime , 
                endTime : parsedEndTime, 
                reason : reason
            })

            res.status(200).json(
                 new ApiResponse(
                    "Banner Is Created Successfully !" 
                 )
            )

         }
         catch(err : any){
            res.status(500).json(
                new ApiError(
                    "Error In Creating Or Updating The Banner" , 
                    err 
                )
            )
         }
    }



    public getCurrentStatus = async (req : any , res : any) => {
         try {
            const data = await bannerDB.currentBannerStatus() ; 
            
            

            res.status(200).json({
                status: "Current Status of the Banner",
                data: data[0]
            }); 
         }
         catch(err : any){
            res.status(500).json(
                new ApiError(
                    "Error In Getting The Current Status" , 
                    err 
                )
            )
         }
    }



    public gettingAllBannerData = async (req : any , res : any) => {
        try {
           const dataOfBanner = await bannerDB.gettingAllBannerInDb() ; 
           return res.status(200).json(
            new ApiResponse(
                "All Banner Data In DB" , 
                dataOfBanner 
            )
           )
        }

        catch(err : any){
            res.status(500).json(
                new ApiError(
                    "Error In Getting All The Banner Data" , 
                    err 
                )
            )
        }
    }


    public deletingTheBanner = async (req : any , res : any) => {
        try {
            const {id} = req.body ; 
            await bannerDB.deletingBanner(id) ; 

            return res.status(200).json(
                new ApiResponse(
                        `Banner with id ${id} is successfully deleted !` 
                )
            )
        }
        catch(err : any){
            return res.status(500).json(
                new ApiError(
                    "Error In Deleting The Banner" , 
                    err 
                )
            )
        }
    }



    
}


export const bannerController = new BannerController() ;