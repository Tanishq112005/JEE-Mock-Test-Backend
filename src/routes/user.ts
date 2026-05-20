import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { userController } from "../controllers/userController";
import { TokenBucket } from "../middlewares/RateLimiters/tokenBucket";

const router = Router() ; 


const limiter = new TokenBucket(1 , 0.5) ; 
router.get('/get' , authMiddleware ,limiter.limit ,  userController.studentProfile ) ;

router.post('/stage1' , authMiddleware , limiter.limit  ,  userController.stage1) ; 

router.post('/stage2' , authMiddleware ,limiter.limit  ,  userController.stage2) ; 

router.post('/stage3' , authMiddleware ,limiter.limit  ,  userController.stage3) ;

router.get('/stageNumber' , authMiddleware ,limiter.limit  ,  userController.stageNumber) ;


router.post('/update' , authMiddleware ,limiter.limit  ,  userController.updateData ) ; 



export const userRoutes = router;