import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { testStatusController } from "../controllers/testController";

const router = Router();

// 1. Get Exam Data
// Frontend calls: /api/test/getPaper?testStatusId=...
router.get('/getPaper', authMiddleware, testStatusController.gettingQuestionAndDetails);

// 2. Start New Test
// Frontend calls: /api/test/create (Body: { paperId })
router.post('/create', authMiddleware, testStatusController.createTestStatus); 

// 3. Update Progress
// Frontend calls: /api/test/update (Body: { ...details })
router.post('/update', authMiddleware, testStatusController.updatingTheDetails); 

// 4. Get Last Session Info
// Frontend calls: /api/test/lastTestDetails?paperId=...
router.get('/lastTestDetails', authMiddleware, testStatusController.LastTestDetails);


router.post('/submitTest' , authMiddleware , testStatusController.submitTest) ; 

export const testStatusRoutes = router;