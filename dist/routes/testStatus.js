"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testStatusRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const testController_1 = require("../controllers/testController");
const router = (0, express_1.Router)();
// 1. Get Exam Data
// Frontend calls: /api/test/getPaper?testStatusId=...
router.get('/getPaper', auth_1.authMiddleware, testController_1.testController.gettingQuestionAndDetails);
// 2. Start New Test
// Frontend calls: /api/test/create (Body: { paperId })
router.post('/create', auth_1.authMiddleware, testController_1.testController.createTestStatus);
// 3. Update Progress
// Frontend calls: /api/test/update (Body: { ...details })
router.post('/update', auth_1.authMiddleware, testController_1.testController.updatingTheDetails);
// 4. Get Last Session Info
// Frontend calls: /api/test/lastTestDetails?paperId=...
router.get('/lastTestDetails', auth_1.authMiddleware, testController_1.testController.LastTestDetails);
router.post('/submitTest', auth_1.authMiddleware, testController_1.testController.submitTest);
exports.testStatusRoutes = router;
