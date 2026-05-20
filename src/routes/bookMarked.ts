import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { bookMarkedController } from "../controllers/bookMarkedController";
import { TokenBucket } from "../middlewares/RateLimiters/tokenBucket";

const getBookMarkedLimiter = new TokenBucket(1 , 0.1) ; 
const addBookMarkedLimiter = new TokenBucket(1 , 0.1) ; 
const checkBookMarkedLimiter = new TokenBucket(1 , 0.1) ; 
const router = Router() ; 

router.get('/get' , authMiddleware , getBookMarkedLimiter.limit ,  bookMarkedController.get) ; 
router.post('/add' , authMiddleware , addBookMarkedLimiter.limit ,  bookMarkedController.create) ; 
router.delete('/remove' , authMiddleware , bookMarkedController.remove) ;
router.post('/check' , authMiddleware , checkBookMarkedLimiter.limit ,  bookMarkedController.checking) ; 


export const bookMarkedRoutes = router ;