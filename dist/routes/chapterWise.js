"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chapterWiseRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const chapterWiseController_1 = require("../controllers/chapterWiseController");
const router = (0, express_1.Router)();
router.get("/group", auth_1.authMiddleware, chapterWiseController_1.chapterWiseController.groupName);
router.get("/group/chapters", auth_1.authMiddleware, chapterWiseController_1.chapterWiseController.getChaptersByGroups);
// API #3
router.get("/:chapterId/info", auth_1.authMiddleware, chapterWiseController_1.chapterWiseController.getChapterInfo);
// API #5
router.get("/questions/:questionId/attempts", auth_1.authMiddleware, chapterWiseController_1.chapterWiseController.getQuestionAttemptsHistory);
// API #7
router.put("/questions/:questionId/update", auth_1.authMiddleware, chapterWiseController_1.chapterWiseController.updateTimeSpentStatus);
// API #8
router.post("/questions/:questionId/submit", auth_1.authMiddleware, chapterWiseController_1.chapterWiseController.submitImmediateEvaluate);
exports.chapterWiseRoutes = router;
