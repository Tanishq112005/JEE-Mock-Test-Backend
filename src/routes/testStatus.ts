import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { testController } from "../controllers/testController";
import { TokenBucket } from "../middlewares/RateLimiters/tokenBucket";

const router = Router();
const paperLimiter = new TokenBucket(1, 0.8) ; 

router.get('/getPaper', authMiddleware, paperLimiter.limit ,  testController.gettingQuestionAndDetails);

router.post('/create', authMiddleware,  paperLimiter.limit ,  testController.createTestStatus); 


router.post('/update', authMiddleware,  paperLimiter.limit ,  testController.updatingTheDetails); 


router.get('/lastTestDetails', authMiddleware,  paperLimiter.limit ,  testController.LastTestDetails);

router.get('/paperAttemptsDetails' , authMiddleware ,  paperLimiter.limit ,  testController.getPapersWithStatus ) ; 
router.post('/submitTest' , authMiddleware , paperLimiter.limit , testController.submitTest) ; 

export const testStatusRoutes = router;