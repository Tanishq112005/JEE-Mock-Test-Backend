"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = void 0;
const analytics_db_1 = require("../repositories/analytics.db");
const reddisService_1 = require("./reddisService");
class ReportService {
    constructor() { }
    // ==========================================
    // HELPERS
    // ==========================================
    calcAccuracy(marks, maxMarks) {
        return maxMarks > 0 ? parseFloat(((marks / maxMarks) * 100).toFixed(2)) : 0;
    }
    avgOf(arr) {
        return arr.length > 0
            ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2))
            : 0;
    }
    // ==========================================
    // FETCH & MERGE ALL TEST DATA
    // ==========================================
    async allTestResult(studentId) {
        try {
            const reddisTestData = await reddisService_1.reddisService.reddisTestData(studentId);
            const testWiseData = await analytics_db_1.analytics.testWiseData(studentId);
            const reddisArray = reddisTestData.testData.map((item) => ({
                id: item.testId,
                exam: item.finalTestResult.exam,
                created_at: new Date(item.created_at),
                source: 'reddis',
                math: item.finalTestResult.math,
                physics: item.finalTestResult.physics,
                chemistry: item.finalTestResult.chemistry,
                overAllAnalytics: item.finalTestResult.overall,
                questionWise: item.finalTestResult.questionTypes,
                chapterWise: item.finalTestResult.chapterWise ?? [],
            }));
            const testWiseArray = testWiseData.map((item) => ({
                id: item.testStatusId,
                created_at: new Date(item.created_at),
                source: 'testWise',
                exam: item.exam,
                paperMeta: {
                    year: item.testStatus?.papers?.year ?? null,
                    month: item.testStatus?.papers?.month ?? null,
                    day: item.testStatus?.papers?.day ?? null,
                    date: item.testStatus?.papers?.date ?? null,
                    shift: item.testStatus?.papers?.shift ?? null,
                    mode: item.testStatus?.papers?.mode ?? null,
                    totalMarks: item.testStatus?.papers?.totalMarks ?? null,
                    totalDuration: item.testStatus?.papers?.totalDuration ?? null,
                    totalQuestions: item.testStatus?.papers?.totalQuestions ?? null,
                },
                math: item.math,
                physics: item.physics,
                chemistry: item.chemistry,
                overAllAnalytics: item.overall,
                questionWise: item.questionTypes,
                chapterWise: [],
            }));
            const mergedTests = [...reddisArray, ...testWiseArray].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
            return mergedTests;
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
    // ==========================================
    // SUBJECT ANALYTICS BUILDER
    // ==========================================
    buildSubjectAnalytics(tests, subject) {
        const s = tests.filter((t) => t[subject]);
        if (s.length === 0)
            return null;
        const marks = s.map((t) => t[subject]?.marks ?? 0);
        const maxMarks = s.map((t) => t[subject]?.maxMarks ?? t[subject]?.maxScore ?? 0);
        const correct = s.map((t) => t[subject]?.correct ?? 0);
        const wrong = s.map((t) => t[subject]?.wrong ?? 0);
        const time = s.map((t) => t[subject]?.timeTaken ?? 0);
        const totalQ = s.map((t) => t[subject]?.totalQuestions ?? 0);
        return {
            avgScore: this.avgOf(marks),
            avgMaxScore: this.avgOf(maxMarks),
            avgAccuracy: this.avgOf(s.map((_, i) => this.calcAccuracy(marks[i], maxMarks[i]))),
            avgCorrect: this.avgOf(correct),
            avgWrong: this.avgOf(wrong),
            avgTimeTaken: this.avgOf(time),
            avgTimePerQuestion: this.avgOf(s.map((_, i) => totalQ[i] > 0 ? parseFloat((time[i] / totalQ[i]).toFixed(2)) : 0)),
        };
    }
    // ==========================================
    // QUESTION TYPE ANALYTICS BUILDER
    // ==========================================
    buildQuestionTypes(tests) {
        const allQTypes = new Set();
        tests.forEach((t) => {
            if (t.questionWise)
                Object.keys(t.questionWise).forEach((k) => allQTypes.add(k));
        });
        const result = {};
        for (const qType of allQTypes) {
            const qTests = tests.filter((t) => t.questionWise?.[qType]);
            if (qTests.length === 0)
                continue;
            const marks = qTests.map((t) => t.questionWise[qType]?.marks ?? 0);
            const maxMarks = qTests.map((t) => t.questionWise[qType]?.maxMarks ?? t.questionWise[qType]?.maxScore ?? 0);
            result[qType] = {
                avgScore: this.avgOf(marks),
                avgAccuracy: this.avgOf(qTests.map((_, i) => this.calcAccuracy(marks[i], maxMarks[i]))),
                avgCorrect: this.avgOf(qTests.map((t) => t.questionWise[qType]?.correct ?? 0)),
                avgWrong: this.avgOf(qTests.map((t) => t.questionWise[qType]?.wrong ?? 0)),
            };
        }
        return result;
    }
    // ==========================================
    // IMPROVEMENT BUILDER
    // ==========================================
    buildImprovement(tests) {
        const latest = tests[0];
        const previous = tests.slice(1);
        if (previous.length === 0)
            return null;
        const latestAcc = this.calcAccuracy(latest.overAllAnalytics?.marks ?? latest.overAllAnalytics?.totalScore ?? 0, latest.overAllAnalytics?.maxMarks ?? latest.overAllAnalytics?.maxScore ?? 0);
        const prevAcc = this.avgOf(previous.map((t) => this.calcAccuracy(t.overAllAnalytics?.marks ?? t.overAllAnalytics?.totalScore ?? 0, t.overAllAnalytics?.maxMarks ?? t.overAllAnalytics?.maxScore ?? 0)));
        const latestScore = latest.overAllAnalytics?.marks ?? latest.overAllAnalytics?.totalScore ?? 0;
        const prevScore = this.avgOf(previous.map((t) => t.overAllAnalytics?.marks ?? t.overAllAnalytics?.totalScore ?? 0));
        const latestQ = latest.overAllAnalytics?.totalQuestions ?? 0;
        const latestTime = latestQ > 0
            ? parseFloat(((latest.overAllAnalytics?.timeTaken ?? 0) / latestQ).toFixed(2)) : 0;
        const prevTime = this.avgOf(previous.map((t) => {
            const q = t.overAllAnalytics?.totalQuestions ?? 0;
            return q > 0 ? parseFloat(((t.overAllAnalytics?.timeTaken ?? 0) / q).toFixed(2)) : 0;
        }));
        const subjectImprovement = (subject) => {
            const latestS = latest[subject];
            const prevS = previous.filter((t) => t[subject]);
            if (!latestS || prevS.length === 0)
                return null;
            return {
                accuracyChange: parseFloat((this.calcAccuracy(latestS.marks ?? 0, latestS.maxMarks ?? latestS.maxScore ?? 0) -
                    this.avgOf(prevS.map((t) => this.calcAccuracy(t[subject]?.marks ?? 0, t[subject]?.maxMarks ?? t[subject]?.maxScore ?? 0)))).toFixed(2)),
                scoreChange: parseFloat(((latestS.marks ?? 0) -
                    this.avgOf(prevS.map((t) => t[subject]?.marks ?? 0))).toFixed(2)),
                wrongChange: parseFloat(((latestS.wrong ?? 0) -
                    this.avgOf(prevS.map((t) => t[subject]?.wrong ?? 0))).toFixed(2)),
            };
        };
        return {
            overall: {
                accuracyChange: parseFloat((latestAcc - prevAcc).toFixed(2)),
                scoreChange: parseFloat((latestScore - prevScore).toFixed(2)),
                avgTimePerQuestionChange: parseFloat((latestTime - prevTime).toFixed(2)),
            },
            subjects: {
                math: subjectImprovement('math'),
                physics: subjectImprovement('physics'),
                chemistry: subjectImprovement('chemistry'),
            },
        };
    }
    // ==========================================
    // CHAPTER ANALYTICS BUILDER
    // DB cumulative (ChapterAnalytics) + Redis only
    // ==========================================
    buildChapterAnalytics(dbChapterAnalytics, reddisChapterWise, examFilter) {
        const calcAcc = (earned, max) => max > 0 ? parseFloat(((earned / max) * 100).toFixed(2)) : 0;
        // ── Step 1: Build map from DB cumulative ChapterAnalytics ──
        const chapterMap = {};
        for (const ch of dbChapterAnalytics) {
            chapterMap[ch.chapterId] = {
                chapterId: ch.chapterId,
                practiceJeeMain: {
                    attempts: ch.practiceJeeMainAttempts,
                    timeSpent: ch.practiceJeeMainTimeSpent,
                    marksEarned: ch.practiceJeeMainMarksEarned,
                    maxPossible: ch.practiceJeeMainMaxPossible,
                    correct: ch.practiceJeeMainCorrect,
                    wrong: ch.practiceJeeMainWrong,
                    partial: ch.practiceJeeMainPartial,
                    accuracy: calcAcc(ch.practiceJeeMainMarksEarned, ch.practiceJeeMainMaxPossible),
                },
                practiceJeeAdvanced: {
                    attempts: ch.practiceJeeAdvancedAttempts,
                    timeSpent: ch.practiceJeeAdvancedTimeSpent,
                    marksEarned: ch.practiceJeeAdvancedMarksEarned,
                    maxPossible: ch.practiceJeeAdvancedMaxPossible,
                    correct: ch.practiceJeeAdvancedCorrect,
                    wrong: ch.practiceJeeAdvancedWrong,
                    partial: ch.practiceJeeAdvancedPartial,
                    accuracy: calcAcc(ch.practiceJeeAdvancedMarksEarned, ch.practiceJeeAdvancedMaxPossible),
                },
                testJeeMain: {
                    attempts: ch.testJeeMainAttempts,
                    timeSpent: ch.testJeeMainTimeSpent,
                    marksEarned: ch.testJeeMainMarksEarned,
                    maxPossible: ch.testJeeMainMaxPossible,
                    correct: ch.testJeeMainCorrect,
                    wrong: ch.testJeeMainWrong,
                    partial: ch.testJeeMainPartial,
                    accuracy: calcAcc(ch.testJeeMainMarksEarned, ch.testJeeMainMaxPossible),
                },
                testJeeAdvanced: {
                    attempts: ch.testJeeAdvancedAttempts,
                    timeSpent: ch.testJeeAdvancedTimeSpent,
                    marksEarned: ch.testJeeAdvancedMarksEarned,
                    maxPossible: ch.testJeeAdvancedMaxPossible,
                    correct: ch.testJeeAdvancedCorrect,
                    wrong: ch.testJeeAdvancedWrong,
                    partial: ch.testJeeAdvancedPartial,
                    accuracy: calcAcc(ch.testJeeAdvancedMarksEarned, ch.testJeeAdvancedMaxPossible),
                },
                redisContribution: null,
            };
        }
        // ── Step 2: Merge Redis chapter data on top ──
        for (const rCh of reddisChapterWise) {
            if (examFilter && rCh.examName !== examFilter)
                continue;
            const isJeeMain = rCh.examName === 'JEE_MAIN';
            const isJeeAdvanced = rCh.examName === 'JEE_ADVANCED';
            // ✅ Chapter only exists in Redis — initialize it
            if (!chapterMap[rCh.chapterId]) {
                chapterMap[rCh.chapterId] = {
                    chapterId: rCh.chapterId,
                    practiceJeeMain: { attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0, correct: 0, wrong: 0, partial: 0, accuracy: 0 },
                    practiceJeeAdvanced: { attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0, correct: 0, wrong: 0, partial: 0, accuracy: 0 },
                    testJeeMain: { attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0, correct: 0, wrong: 0, partial: 0, accuracy: 0 },
                    testJeeAdvanced: { attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0, correct: 0, wrong: 0, partial: 0, accuracy: 0 },
                    redisContribution: null,
                };
            }
            const ch = chapterMap[rCh.chapterId];
            const section = isJeeMain
                ? ch.testJeeMain
                : isJeeAdvanced
                    ? ch.testJeeAdvanced
                    : null;
            if (!section)
                continue;
            // ✅ Add Redis on top of DB cumulative
            section.attempts += rCh.attempt ?? 0;
            section.timeSpent += rCh.timeTaken ?? 0;
            section.marksEarned += rCh.marks ?? 0;
            section.maxPossible += rCh.positiveMarks ?? 0;
            section.correct += rCh.correct ?? 0;
            section.wrong += rCh.wrong ?? 0;
            section.partial += rCh.partial ?? 0;
            section.accuracy = calcAcc(section.marksEarned, section.maxPossible);
            // ✅ Track Redis contribution separately
            if (!ch.redisContribution) {
                ch.redisContribution = {
                    examName: rCh.examName,
                    attempt: 0,
                    correct: 0,
                    wrong: 0,
                    partial: 0,
                    marks: 0,
                    maxPossible: 0,
                    timeTaken: 0,
                };
            }
            ch.redisContribution.attempt += rCh.attempt ?? 0;
            ch.redisContribution.correct += rCh.correct ?? 0;
            ch.redisContribution.wrong += rCh.wrong ?? 0;
            ch.redisContribution.partial += rCh.partial ?? 0;
            ch.redisContribution.marks += rCh.marks ?? 0;
            ch.redisContribution.maxPossible += rCh.positiveMarks ?? 0;
            ch.redisContribution.timeTaken += rCh.timeTaken ?? 0;
        }
        // ── Step 3: Filter by examFilter if provided ──
        let chapters = Object.values(chapterMap);
        if (examFilter) {
            chapters = chapters.filter((ch) => {
                const section = examFilter === 'JEE_MAIN'
                    ? ch.testJeeMain
                    : ch.testJeeAdvanced;
                return section.attempts > 0 || section.marksEarned > 0;
            });
        }
        return chapters;
    }
    // ==========================================
    // GROUP ANALYTICS BUILDER
    // ==========================================
    buildGroupAnalytics(tests) {
        if (tests.length === 0)
            return null;
        return {
            totalTests: tests.length,
            overall: {
                avgScore: this.avgOf(tests.map((t) => t.overAllAnalytics?.marks ?? t.overAllAnalytics?.totalScore ?? 0)),
                avgAccuracy: this.avgOf(tests.map((t) => this.calcAccuracy(t.overAllAnalytics?.marks ?? t.overAllAnalytics?.totalScore ?? 0, t.overAllAnalytics?.maxMarks ?? t.overAllAnalytics?.maxScore ?? 0))),
                avgTimePerQuestion: this.avgOf(tests.map((t) => {
                    const q = t.overAllAnalytics?.totalQuestions ?? 0;
                    const time = t.overAllAnalytics?.timeTaken ?? 0;
                    return q > 0 ? parseFloat((time / q).toFixed(2)) : 0;
                })),
            },
            subjects: {
                math: this.buildSubjectAnalytics(tests, 'math'),
                physics: this.buildSubjectAnalytics(tests, 'physics'),
                chemistry: this.buildSubjectAnalytics(tests, 'chemistry'),
            },
            questionTypes: this.buildQuestionTypes(tests),
            improvement: this.buildImprovement(tests),
            testMarksList: tests.map((t) => ({
                testId: t.id,
                examName: t.exam,
                createdAt: t.created_at,
                marks: t.overAllAnalytics?.marks ?? t.overAllAnalytics?.totalScore ?? 0,
                maxMarks: t.overAllAnalytics?.maxMarks ?? t.overAllAnalytics?.maxScore ?? 0,
                accuracy: this.calcAccuracy(t.overAllAnalytics?.marks ?? t.overAllAnalytics?.totalScore ?? 0, t.overAllAnalytics?.maxMarks ?? t.overAllAnalytics?.maxScore ?? 0),
            })),
        };
    }
    // ==========================================
    // CORE REPORT BUILDER
    // ==========================================
    buildReport(allTestData, lastNPerGroup) {
        if (allTestData.length === 0)
            return null;
        const groups = {};
        for (const test of allTestData) {
            const exam = test.exam ?? 'UNKNOWN';
            if (!groups[exam])
                groups[exam] = [];
            groups[exam].push(test);
        }
        for (const exam of Object.keys(groups)) {
            groups[exam] = groups[exam].slice(0, lastNPerGroup);
        }
        const examReports = {};
        for (const [examName, tests] of Object.entries(groups)) {
            examReports[examName] = this.buildGroupAnalytics(tests);
        }
        return { lastNPerGroup, examReports };
    }
    // ==========================================
    // PUBLIC: reportMaking
    // ==========================================
    async reportMaking(studentId, lastNPerGroup = 10) {
        try {
            const allTestData = await this.allTestResult(studentId);
            if (allTestData.length === 0)
                return null;
            return {
                studentId,
                generatedAt: new Date(),
                ...this.buildReport(allTestData, lastNPerGroup),
            };
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
    // ==========================================
    // PUBLIC: lastTest
    // ==========================================
    async lastTest(studentId) {
        try {
            const allTestData = await this.allTestResult(studentId);
            if (allTestData.length === 0)
                return null;
            const [last3, last5, last10] = await Promise.all([
                Promise.resolve(this.buildReport(allTestData, 3)),
                Promise.resolve(this.buildReport(allTestData, 5)),
                Promise.resolve(this.buildReport(allTestData, 10)),
            ]);
            return {
                studentId,
                last3,
                last5,
                last10,
            };
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
    // ==========================================
    // PUBLIC: chapterReport
    // ChapterAnalytics (DB cumulative) + Redis only
    // ==========================================
    async chapterReport(studentId, examFilter) {
        try {
            // ✅ Only 2 sources — parallel fetch
            const [dbChapterAnalytics, reddisData] = await Promise.all([
                analytics_db_1.analytics.chapterWiseAnalytics(studentId),
                reddisService_1.reddisService.reddisTestData(studentId),
            ]);
            // ✅ Flatten Redis chapter data from all unsynced tests
            const reddisChapterWise = [];
            for (const test of reddisData.testData ?? []) {
                const chapterWise = test.finalTestResult?.chapterWise ?? [];
                for (const ch of chapterWise) {
                    reddisChapterWise.push({
                        ...ch,
                        examName: test.finalTestResult?.exam,
                        testId: test.testId,
                        createdAt: test.created_at,
                    });
                }
            }
            const chapters = this.buildChapterAnalytics(dbChapterAnalytics, reddisChapterWise, examFilter);
            return {
                studentId,
                generatedAt: new Date(),
                examFilter: examFilter ?? 'ALL',
                chapters,
            };
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
}
exports.reportService = new ReportService();
