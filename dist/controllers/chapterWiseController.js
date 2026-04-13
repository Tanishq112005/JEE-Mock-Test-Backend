"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chapterWiseController = void 0;
const caching_1 = require("../lib/caching");
const questionEvalutionService_1 = require("../services/questionEvalutionService");
const uniqueCountService_1 = require("../services/uniqueCountService");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
class ChapterWiseController {
    constructor() {
    }
    /* first the user click on the group name
                   |
        click on the chapter name
                   |
        give all the question according of the chapter
                   |
        in the pack of the jee mains and the jee adavanced group , decending order wise
                   |
         when the user click on question then , frontend gives me the question id
                   |
         now through the question id
                   |
        1. all the previous attempt status of the question
        2. if the question leaved by the user incompleted then then again comes and solve from the previos time
    */
    // in the chapter Controller the group name controller is already present 
    // now when the user clicks on the chapter then presenting all the problems name of the user 
    submitQuestion = async (req, res) => {
        try {
            const { questionId, timeSpent, userAnswer, created_at } = req.body;
            const studentId = req.user;
            // ── 1. Evaluate once ─────────────────────────────────────────
            const evaluatedQuestion = await questionEvalutionService_1.practiceQuestionEvaluation.evaluate({
                questionId: questionId,
                timeSpent: timeSpent,
                userAnswer: userAnswer,
                created_at: created_at
            });
            // ── 2. Mark bitmap if correct ────────────────────────────────
            if (evaluatedQuestion.verdict === 'correct') {
                await uniqueCountService_1.questionBitmapRegistry.markAttempted(studentId, questionId);
            }
            // ── 3. Update Redis upper layer (with null guard) ────────────
            let gettingUpperPractice = await caching_1.cacheService.getCache(`${studentId}:praticeUpperLayer`);
            if (!gettingUpperPractice) {
                gettingUpperPractice = { praticeStatus: [] };
            }
            gettingUpperPractice.praticeStatus.push({ questionId, created_at });
            // ── 4. Save to Redis (both keys in parallel) ─────────────────
            await Promise.all([
                caching_1.cacheService.setCache(`${studentId}:praticeUpperLayer`, gettingUpperPractice),
                caching_1.cacheService.setCache(`${studentId}:${questionId}:${created_at}`, evaluatedQuestion),
            ]);
            // ── 5. Send to queue for worker to persist to DB ─────────────
            //  await yourQueueService.send({
            //     studentId,
            //     subjectId:     evaluatedQuestion.subjectId,
            //     questionId,
            //     verdict:       evaluatedQuestion.verdict,
            //     marks:         evaluatedQuestion.marks,
            //     positiveMarks: evaluatedQuestion.positiveMarks,
            //     type:          evaluatedQuestion.type,
            //     timeSpent:     evaluatedQuestion.timeSpent,
            //     userAnswer:    evaluatedQuestion.userAnswer,
            //     isVisited:     true,
            //     chapterId:     evaluatedQuestion.chapterId,
            //     examName:      evaluatedQuestion.examName,
            //     created_at,
            // });
            return res.status(200).json(new ApiResponse_1.default("Question submitted successfully", evaluatedQuestion));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in submitting the question", err));
        }
    };
}
exports.chapterWiseController = new ChapterWiseController();
