"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSyncService = void 0;
const database_1 = require("../lib/database");
const analytics_db_1 = require("../repositories/analytics.db");
const caching_1 = require("../lib/caching");
// ─────────────────────────────────────────────────────────────────────────────
// TestSyncService
//
// After finalSubmitTest saves raw question attempts to DB:
//   1. Reads testQuestionAttemptStatus rows back from DB
//   2. Builds SummaryReport from them
//   3. Calls analytics.persistTestAnalytics → writes TestAttemptSummary,
//      SubjectTestResult[], QuestionTypeTestResult[], ChapterAnalytics,
//      SubjectAnalytics, ExamAnalytics, StudentOverallAnalytics
//   4. Cleans up Redis — DB is now the only source of truth
//
// Schema facts used here:
//   - questions.positiveMarks / negativeMarks exist directly on questions model
//   - questions has NO markingScheme relation — paper-level fallback via
//     papers.markingSchemes (paperMarkingScheme[])
//   - questionType enum: SingleCorrect | MultiCorrect | Integer |
//     ComprehensionSingleCorrect | ComprehensionMultiCorrect | ComprehensionInteger
// ─────────────────────────────────────────────────────────────────────────────
class TestSyncService {
    db;
    constructor(db) {
        this.db = db;
    }
    // ===========================================================================
    // PUBLIC — call right after finalSubmitTest completes
    // ===========================================================================
    async syncAfterSubmission(testStatusId, studentId) {
        try {
            console.log(`[TestSync] Starting sync for test ${testStatusId}`);
            const testContext = await this.db.testStatus.findUnique({
                where: { id: testStatusId },
                include: {
                    testQuestionStatus: {
                        include: {
                            questions: {
                                include: {
                                    subjects: true, // for subjectName
                                    chapters: true, // for chapterId + chapterName
                                    // ❌ NO markingScheme — not in schema
                                },
                            },
                        },
                    },
                    papers: {
                        include: {
                            exam: true,
                            markingSchemes: true, // paperMarkingScheme[] — fallback marks
                        },
                    },
                },
            });
            if (!testContext) {
                console.error(`[TestSync] testStatus ${testStatusId} not found`);
                return;
            }
            if (testContext.isAnalyzed) {
                console.log(`[TestSync] Test ${testStatusId} already analyzed, skipping`);
                return;
            }
            const report = this.buildSummaryReport(testContext);
            // Writes: TestAttemptSummary, SubjectTestResult[], QuestionTypeTestResult[],
            //         ChapterAnalytics, SubjectAnalytics, ExamAnalytics,
            //         StudentOverallAnalytics, marks testStatus.isAnalyzed = true
            await analytics_db_1.analytics.persistTestAnalytics(testStatusId, studentId, report);
            console.log(`[TestSync] ✅ DB analytics persisted for test ${testStatusId}`);
            // Remove from Redis — DB is now source of truth
            await this.cleanupRedis(studentId, testStatusId);
            console.log(`[TestSync] ✅ Redis cleaned up for test ${testStatusId}`);
        }
        catch (err) {
            console.error(`[TestSync] ❌ Sync failed for test ${testStatusId}:`, err);
            throw err;
        }
    }
    // ===========================================================================
    // PUBLIC — run once to fix all existing unanalyzed completed tests
    // ===========================================================================
    async backfillUnanalyzedTests(studentId) {
        let processed = 0;
        let failed = 0;
        const whereClause = { isAnalyzed: false, status: "COMPLETED" };
        if (studentId)
            whereClause.studentId = studentId;
        const unanalyzed = await this.db.testStatus.findMany({
            where: whereClause,
            select: { id: true, studentId: true },
            orderBy: { created_at: "asc" },
        });
        console.log(`[TestSync] Backfilling ${unanalyzed.length} unanalyzed tests`);
        for (const test of unanalyzed) {
            try {
                await this.syncAfterSubmission(test.id, test.studentId);
                processed++;
                console.log(`[TestSync] ✅ Backfilled ${test.id} (${processed}/${unanalyzed.length})`);
            }
            catch (err) {
                failed++;
                console.error(`[TestSync] ❌ Failed to backfill ${test.id}:`, err);
            }
        }
        console.log(`[TestSync] Backfill done — processed: ${processed}, failed: ${failed}`);
        return { processed, failed };
    }
    // ===========================================================================
    // PRIVATE — build SummaryReport from DB question attempts
    // ===========================================================================
    buildSummaryReport(testContext) {
        const examName = testContext.papers.exam.name;
        const questions = testContext.testQuestionStatus;
        // Paper-level marking scheme fallback keyed by questionType enum value
        // e.g. "SingleCorrect" → { positiveMarks: 4, negativeMarks: 1, isPartial: false }
        const paperMsMap = {};
        for (const ms of testContext.papers.markingSchemes ?? []) {
            paperMsMap[ms.questionType] = ms;
        }
        // ── Accumulators ──────────────────────────────────────────────────────────
        const subjectAcc = {
            Mathematics: this.emptyAcc(),
            Physics: this.emptyAcc(),
            Chemistry: this.emptyAcc(),
        };
        // Keyed by actual questionType enum value e.g. "SingleCorrect"
        const qtAcc = {};
        const chapterAcc = {};
        let totalAttempted = 0;
        let totalTimeTaken = 0;
        let totalCorrect = 0;
        let totalPartial = 0;
        // ── Process each question attempt ─────────────────────────────────────────
        for (const q of questions) {
            const qData = q.questions;
            const subjectName = qData?.subjects?.name ?? "Mathematics"; // SubjectName enum value
            const chapterId = qData?.chapterId ?? null;
            const chapterName = qData?.chapters?.name ?? "Unknown";
            const qType = qData?.type ?? "SingleCorrect"; // questionType enum
            // Marks: prefer question-level columns, fall back to paper marking scheme
            const paperMs = paperMsMap[qType];
            const positiveMarks = qData?.positiveMarks ?? paperMs?.positiveMarks ?? 4;
            const negativeMarks = qData?.negativeMarks ?? paperMs?.negativeMarks ?? 1;
            const partialMarks = paperMs?.isPartial ? positiveMarks / 2 : 0;
            const isCorrect = q.isCorrect === true;
            const isPartial = !isCorrect && (q.marksObtained ?? 0) > 0;
            const isAttempted = q.status === "answered";
            const isWrong = isAttempted && !isCorrect && !isPartial;
            const marks = q.marksObtained ?? 0;
            totalTimeTaken += q.timeSpent ?? 0;
            if (isAttempted)
                totalAttempted++;
            if (isCorrect)
                totalCorrect++;
            if (isPartial)
                totalPartial++;
            // Subject accumulation
            if (!subjectAcc[subjectName])
                subjectAcc[subjectName] = this.emptyAcc();
            this.accumulate(subjectAcc[subjectName], {
                marks,
                positiveMarks,
                negativeMarks,
                partialMarks,
                isAttempted,
                isCorrect,
                isPartial,
                isWrong,
                timeSpent: q.timeSpent ?? 0,
            });
            // Question type accumulation (using actual enum values like "SingleCorrect")
            if (!qtAcc[qType])
                qtAcc[qType] = this.emptyAcc();
            this.accumulate(qtAcc[qType], {
                marks,
                positiveMarks,
                negativeMarks,
                partialMarks,
                isAttempted,
                isCorrect,
                isPartial,
                isWrong,
                timeSpent: q.timeSpent ?? 0,
            });
            // Chapter accumulation
            if (chapterId) {
                if (!chapterAcc[chapterId]) {
                    chapterAcc[chapterId] = {
                        chapterId,
                        chapterName,
                        subjectName,
                        ...this.emptyAcc(),
                    };
                }
                this.accumulate(chapterAcc[chapterId], {
                    marks,
                    positiveMarks,
                    negativeMarks,
                    partialMarks,
                    isAttempted,
                    isCorrect,
                    isPartial,
                    isWrong,
                    timeSpent: q.timeSpent ?? 0,
                });
            }
        }
        // ── Compute overall ───────────────────────────────────────────────────────
        const totalQuestions = questions.length;
        const totalMaxMarks = Object.values(subjectAcc).reduce((s, a) => s + a.maxMarks, 0);
        const totalMarks = Object.values(subjectAcc).reduce((s, a) => s + a.marks, 0);
        const overallAcc = totalAttempted > 0
            ? parseFloat(((totalCorrect / totalAttempted) * 100).toFixed(2))
            : 0;
        const avgTimePerQ = totalQuestions > 0
            ? parseFloat((totalTimeTaken / totalQuestions).toFixed(2))
            : 0;
        // ── Convert accumulators to typed shapes ──────────────────────────────────
        const toSubjectStats = (acc) => ({
            totalQuestions: acc.totalQuestions,
            attempt: acc.attempt,
            correct: acc.correct,
            partial: acc.partial,
            wrong: acc.wrong,
            marks: acc.marks,
            positiveMarks: acc.positiveMarks,
            maxMarks: acc.maxMarks,
            paritalMarks: acc.partialMarks, // intentional typo kept from your type
            negativeMarks: acc.negativeMarks,
            timeTaken: acc.timeTaken,
            accuracy: acc.attempt > 0
                ? parseFloat(((acc.correct / acc.attempt) * 100).toFixed(2))
                : 0,
        });
        // questionTypes: keyed by actual Prisma enum value e.g. "SingleCorrect"
        const questionTypes = {};
        for (const [type, acc] of Object.entries(qtAcc)) {
            questionTypes[type] = {
                totalQuestions: acc.totalQuestions,
                attempt: acc.attempt,
                correct: acc.correct,
                partial: acc.partial,
                wrong: acc.wrong,
                marks: acc.marks,
                positiveMarks: acc.positiveMarks,
                maxMarks: acc.maxMarks,
                partialMarks: acc.partialMarks,
                negativeMarks: acc.negativeMarks,
                timeTaken: acc.timeTaken,
                accuracy: acc.attempt > 0
                    ? parseFloat(((acc.correct / acc.attempt) * 100).toFixed(2))
                    : 0,
            };
        }
        const chapterWise = Object.values(chapterAcc).map((c) => ({
            chapterId: c.chapterId,
            chapterName: c.chapterName,
            subjectName: c.subjectName,
            totalQuestions: c.totalQuestions,
            attempt: c.attempt,
            correct: c.correct,
            partial: c.partial,
            wrong: c.wrong,
            marks: c.marks,
            positiveMarks: c.positiveMarks,
            maxMarks: c.maxMarks,
            partialMarks: c.partialMarks,
            negativeMarks: c.negativeMarks,
            timeTaken: c.timeTaken,
            accuracy: c.attempt > 0
                ? parseFloat(((c.correct / c.attempt) * 100).toFixed(2))
                : 0,
        }));
        // OverallStats — only fields that exist in the interface
        const paperMeta = testContext.papers;
        const realTotalTimeTaken = paperMeta && typeof paperMeta.totalDuration === 'number' && typeof testContext.timeLeft === 'number'
            ? (paperMeta.totalDuration * 60) - testContext.timeLeft
            : totalTimeTaken;
        const overall = {
            totalQuestions,
            totalAttempted,
            totalCorrect,
            totalPartial,
            overallAccuracy: overallAcc,
            totalTimeTaken: realTotalTimeTaken >= 0 ? realTotalTimeTaken : totalTimeTaken,
            averageTimePerQuestion: avgTimePerQ,
            totalScore: totalMarks,
            maxScore: totalMaxMarks,
        };
        return {
            exam: examName,
            math: toSubjectStats(subjectAcc["Mathematics"] ?? this.emptyAcc()),
            physics: toSubjectStats(subjectAcc["Physics"] ?? this.emptyAcc()),
            chemistry: toSubjectStats(subjectAcc["Chemistry"] ?? this.emptyAcc()),
            overall,
            questionTypes,
            chapterWise,
        };
    }
    // ===========================================================================
    // PRIVATE — remove test from Redis after DB has the data
    // ===========================================================================
    async cleanupRedis(studentId, testStatusId) {
        try {
            const upperLayerKey = `${studentId}:testUpperLayer`;
            const upperLayer = await caching_1.cacheService.getCache(upperLayerKey);
            if (!upperLayer?.testId?.length)
                return;
            const entry = upperLayer.testId.find((e) => e.id === testStatusId);
            if (!entry)
                return;
            await caching_1.cacheService.deleteCache(`${studentId}:${testStatusId}:${entry.created_at}`);
            upperLayer.testId = upperLayer.testId.filter((e) => e.id !== testStatusId);
            await caching_1.cacheService.setCache(upperLayerKey, upperLayer);
        }
        catch (err) {
            // Non-critical — DB already has the data
            console.error(`[TestSync] ⚠️ Redis cleanup failed for ${testStatusId}:`, err);
        }
    }
    // ===========================================================================
    // PRIVATE HELPERS
    // ===========================================================================
    emptyAcc() {
        return {
            totalQuestions: 0,
            attempt: 0,
            correct: 0,
            partial: 0,
            wrong: 0,
            marks: 0,
            positiveMarks: 0,
            maxMarks: 0,
            partialMarks: 0,
            negativeMarks: 0,
            timeTaken: 0,
        };
    }
    accumulate(acc, data) {
        acc.totalQuestions++;
        acc.timeTaken += data.timeSpent;
        acc.marks += data.marks;
        acc.maxMarks += data.positiveMarks;
        if (data.isAttempted)
            acc.attempt++;
        if (data.isCorrect) {
            acc.correct++;
            acc.positiveMarks += data.positiveMarks;
        }
        if (data.isPartial) {
            acc.partial++;
            acc.partialMarks += data.partialMarks;
        }
        if (data.isWrong) {
            acc.wrong++;
            acc.negativeMarks += data.negativeMarks;
        }
    }
}
exports.testSyncService = new TestSyncService(database_1.database);
