import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { testController } from "../controllers/testController";
import { TokenBucket } from "../middlewares/RateLimiters/tokenBucket";

const router = Router();
const getPaperLimiter = new TokenBucket('getPaperLimiter' , 1, 0.5) ; 
const createPaperLimiter = new TokenBucket('createPaperLimiter' , 1 , 0.5) ; 
const updatePaperLimiter = new TokenBucket('updatePaperLimiter' , 1 , 1) ; 
const lastTestDetailsPaperLimiter = new TokenBucket('lastTestDetailsPaperLimiter' , 1 , 0.5) ;
const paperAttemptsDetailsPaperLimiter = new TokenBucket('paperAttemptsDetailsPaperLimiter' , 1 , 0.5); 
const submitTestPaperLimiter = new TokenBucket('submitTestPaperLimiter' , 2 , 1) ; 
 0
router.get('/getPaper', authMiddleware, getPaperLimiter.limit ,  testController.gettingQuestionAndDetails);

router.post('/create', authMiddleware, createPaperLimiter.limit ,  testController.createTestStatus); 


router.post('/update', authMiddleware,  updatePaperLimiter.limit ,  testController.updatingTheDetails); 


router.get('/lastTestDetails', authMiddleware,  lastTestDetailsPaperLimiter.limit ,  testController.LastTestDetails);

router.get('/paperAttemptsDetails' , authMiddleware ,  paperAttemptsDetailsPaperLimiter.limit ,  testController.getPapersWithStatus ) ; 
router.post('/submitTest' , authMiddleware , submitTestPaperLimiter.limit , testController.submitTest) ; 

export const testStatusRoutes = router;