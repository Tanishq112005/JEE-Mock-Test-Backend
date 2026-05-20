import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { userController } from "../controllers/userController";
import { TokenBucket } from "../middlewares/RateLimiters/tokenBucket";

const router = Router() ; 


const getUserLimiter = new TokenBucket('getUserLimiter' , 1 , 0.25) ; 
const stage1UserLimiter = new TokenBucket('stage1UserLimiter' , 1 , 0.25) ; 
const stage2UserLimiter = new TokenBucket('stage2UserLimiter' , 1 , 0.25) ; 
const stage3UserLimiter = new TokenBucket('stage3UserLimiter' , 1 , 0.25) ; 
const updateUserLimiter = new TokenBucket('updateUserLimiter' , 1 , 0.25) ; 
const getNumberUserLimiter = new TokenBucket('getNumberUserLimiter' , 1 , 1) ; 
router.get('/get' , authMiddleware ,getUserLimiter.limit ,  userController.studentProfile ) ;

router.post('/stage1' , authMiddleware , stage1UserLimiter.limit  ,  userController.stage1) ; 

router.post('/stage2' , authMiddleware ,stage2UserLimiter.limit  ,  userController.stage2) ; 

router.post('/stage3' , authMiddleware ,stage3UserLimiter.limit  ,  userController.stage3) ;

router.get('/stageNumber' , authMiddleware ,getNumberUserLimiter.limit  ,  userController.stageNumber) ;


router.post('/update' , authMiddleware ,updateUserLimiter.limit  ,  userController.updateData ) ; 



export const userRoutes = router;