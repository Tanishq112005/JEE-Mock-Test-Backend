import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { developerRoleMiddleware } from "../middlewares/developerRole";
import { bannerController } from "../controllers/bannerController";
import { TokenBucket } from "../middlewares/RateLimiters/tokenBucket";

const router = Router() ; 

const bannerLimiter = new TokenBucket('bannerLimiter' , 2 , 0.25);

router.get('/get' , authMiddleware ,bannerLimiter.limit ,  bannerController.getCurrentStatus) ; 
router.post('/createOrupdate' , authMiddleware , developerRoleMiddleware , bannerController.createAndUpdate) ; 
router.post('/delete' , authMiddleware , developerRoleMiddleware , bannerController.deletingTheBanner) ; 
router.get('/getAllBannerData' , authMiddleware , developerRoleMiddleware , bannerController.gettingAllBannerData) ; 


export const bannerRoutes = router ; 