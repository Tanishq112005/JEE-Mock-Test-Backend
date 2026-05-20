import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { bookMarkedController } from "../controllers/bookMarkedController";
import { TokenBucket } from "../middlewares/RateLimiters/tokenBucket";

const getBookMarkedLimiter = new TokenBucket('getBookMarked' , 1 , 0.25) ; 
const addBookMarkedLimiter = new TokenBucket('addBookMakrked' , 1 , 1) ; 
const checkBookMarkedLimiter = new TokenBucket('checkBookMarked' , 1 , 1) ; 
const router = Router() ; 

router.get('/get' , authMiddleware , getBookMarkedLimiter.limit ,  bookMarkedController.get) ; 
router.post('/add' , authMiddleware , addBookMarkedLimiter.limit ,  bookMarkedController.create) ; 
router.delete('/remove' , authMiddleware , bookMarkedController.remove) ;
router.post('/check' , authMiddleware , checkBookMarkedLimiter.limit ,  bookMarkedController.checking) ; 


export const bookMarkedRoutes = router ;