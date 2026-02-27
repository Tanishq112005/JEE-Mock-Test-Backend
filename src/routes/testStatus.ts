import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { testController } from "../controllers/testController";

const router = Router();

// 1. Get Exam Data
// Frontend calls: /api/test/getPaper?testStatusId=...
router.get('/getPaper', authMiddleware, testController.gettingQuestionAndDetails);

// 2. Start New Test
// Frontend calls: /api/test/create (Body: { paperId })
router.post('/create', authMiddleware, testController.createTestStatus); 

// 3. Update Progress
// Frontend calls: /api/test/update (Body: { ...details })
router.post('/update', authMiddleware, testController.updatingTheDetails); 

// 4. Get Last Session Info
// Frontend calls: /api/test/lastTestDetails?paperId=...
router.get('/lastTestDetails', authMiddleware, testController.LastTestDetails);

router.get('/paperAttemptsDetails' , authMiddleware , testController.getPapersWithStatus ) ; 
router.post('/submitTest' , authMiddleware , testController.submitTest) ; 

export const testStatusRoutes = router;