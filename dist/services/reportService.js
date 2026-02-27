"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = void 0;
const database_1 = require("../lib/database");
const analytics_db_1 = require("../repositories/analytics.db");
const subject_db_1 = require("../repositories/subject.db");
const reddisService_1 = require("./reddisService");
const uniqueCountService_1 = require("./uniqueCountService");
// Canonical question types — always shown even with zero data
const KNOWN_QUESTION_TYPES = ['MCQ', 'NUMERICAL', 'MSQ'];
// Canonical subjects — always shown even with zero data
const KNOWN_SUBJECTS = [
    { key: 'math', name: 'Mathematics' },
    { key: 'physics', name: 'Physics' },
    { key: 'chemistry', name: 'Chemistry' },
];
class ReportService {
    db;
    constructor(database) {
        this.db = database;
    }
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
                exam: item.testData.exam,
                created_at: new Date(item.created_at),
                source: 'reddis',
                math: item.testData.math,
                physics: item.testData.physics,
                chemistry: item.testData.chemistry,
                overAllAnalytics: item.testData.overall,
                questionWise: item.testData.questionTypes,
                chapterWise: item.testData.chapterWise ?? [],
            }));
            const testWiseArray = testWiseData.map((item) => ({
                id: item.testStatusId,
                created_at: new Date(item.created_at),
                source: 'testWise',
                exam: item.exam,
                paperMeta: {
                    year: item.paperMeta?.year ?? null,
                    month: item.paperMeta?.month ?? null,
                    day: item.paperMeta?.day ?? null,
                    date: item.paperMeta?.date ?? null,
                    shift: item.paperMeta?.shift ?? null,
                    mode: item.paperMeta?.mode ?? null,
                    totalMarks: item.paperMeta?.totalMarks ?? null,
                    totalDuration: item.paperMeta?.totalDuration ?? null,
                    totalQuestions: item.paperMeta?.totalQuestions ?? null,
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
        const allQTypes = new Set(KNOWN_QUESTION_TYPES); // always seed known types
        tests.forEach((t) => {
            if (t.questionWise)
                Object.keys(t.questionWise).forEach((k) => allQTypes.add(k));
        });
        const result = {};
        for (const qType of allQTypes) {
            const qTests = tests.filter((t) => t.questionWise?.[qType]);
            // Always include even if no tests have this type — return zeros
            if (qTests.length === 0) {
                result[qType] = {
                    avgScore: 0,
                    avgAccuracy: 0,
                    avgCorrect: 0,
                    avgWrong: 0,
                };
                continue;
            }
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
    // ==========================================
    buildChapterAnalytics(dbChapterAnalytics, reddisChapterWise, examFilter) {
        const calcAcc = (earned, max) => max > 0 ? parseFloat(((earned / max) * 100).toFixed(2)) : 0;
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
        for (const rCh of reddisChapterWise) {
            if (examFilter && rCh.examName !== examFilter)
                continue;
            const isJeeMain = rCh.examName === 'JEE_MAIN';
            const isJeeAdvanced = rCh.examName === 'JEE_ADVANCED';
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
            const section = isJeeMain ? ch.testJeeMain : isJeeAdvanced ? ch.testJeeAdvanced : null;
            if (!section)
                continue;
            section.attempts += rCh.attempt ?? 0;
            section.timeSpent += rCh.timeTaken ?? 0;
            section.marksEarned += rCh.marks ?? 0;
            section.maxPossible += rCh.positiveMarks ?? 0;
            section.correct += rCh.correct ?? 0;
            section.wrong += rCh.wrong ?? 0;
            section.partial += rCh.partial ?? 0;
            section.accuracy = calcAcc(section.marksEarned, section.maxPossible);
            if (!ch.redisContribution) {
                ch.redisContribution = {
                    examName: rCh.examName, attempt: 0, correct: 0, wrong: 0,
                    partial: 0, marks: 0, maxPossible: 0, timeTaken: 0,
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
        let chapters = Object.values(chapterMap);
        if (examFilter) {
            chapters = chapters.filter((ch) => {
                const section = examFilter === 'JEE_MAIN' ? ch.testJeeMain : ch.testJeeAdvanced;
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
            const last3 = this.buildReport(allTestData, 3);
            const last5 = this.buildReport(allTestData, 5);
            const last10 = this.buildReport(allTestData, 10);
            return { studentId, last3, last5, last10 };
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
    // ==========================================
    // PUBLIC: chapterReport
    // ==========================================
    async chapterReport(studentId, examFilter) {
        try {
            const [dbChapterAnalytics, reddisData] = await Promise.all([
                analytics_db_1.analytics.chapterWiseAnalytics(studentId),
                reddisService_1.reddisService.reddisTestData(studentId),
            ]);
            const reddisChapterWise = [];
            for (const test of reddisData.testData ?? []) {
                const chapterWise = test.testData?.chapterWise ?? [];
                for (const ch of chapterWise) {
                    reddisChapterWise.push({
                        ...ch,
                        examName: test.testData.exam,
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
    // ==========================================
    // PUBLIC: fullDashboard
    // ==========================================
    async fullDashboard(studentId, lastNPerGroup = 10) {
        try {
            const allTestData = await this.allTestResult(studentId);
            if (allTestData.length === 0) {
                return {
                    studentId,
                    generatedAt: new Date(),
                    report: null,
                    lastNTests: { last3: null, last5: null, last10: null },
                    allTests: [],
                };
            }
            const report = this.buildReport(allTestData, lastNPerGroup);
            const last3 = this.buildReport(allTestData, 3);
            const last5 = this.buildReport(allTestData, 5);
            const last10 = this.buildReport(allTestData, 10);
            return {
                studentId,
                generatedAt: new Date(),
                report,
                lastNTests: { last3, last5, last10 },
                allTests: allTestData,
            };
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
    // ==========================================
    // PUBLIC: practiceReport
    // ==========================================
    async practiceReport(studentId) {
        try {
            const [overallAnalytics, subjectAnalytics, examAnalytics, questionTypeAnalytics, redisPracticeData, allSubjects, // ← NEW: resolve subjectId → name
            ] = await Promise.all([
                analytics_db_1.analytics.studentOverAllAnalytics(studentId),
                analytics_db_1.analytics.subjectAnanlytics(studentId),
                analytics_db_1.analytics.examWiseAnalytics(studentId),
                analytics_db_1.analytics.questionWiseAnalytics(studentId),
                reddisService_1.reddisService.reddisPraticeWiseData(studentId),
                this.db.subjects.findMany({ select: { id: true, name: true } }), // ← NEW
            ]);
            const calcAcc = (earned, max) => max > 0 ? parseFloat(((earned / max) * 100).toFixed(2)) : 0;
            // Build subjectId → name lookup
            const subjectIdToName = {};
            for (const s of allSubjects) {
                subjectIdToName[s.id] = s.name;
            }
            const redisQuestions = (redisPracticeData.praticeWiseData ?? [])
                .filter((q) => q?.questionData != null)
                .map((q) => q.questionData);
            // ── Overall ──────────────────────────────────────────────
            const overall = overallAnalytics;
            const redisOverall = redisQuestions.reduce((acc, q) => {
                acc.attempts += 1;
                acc.timeSpent += q.timeSpent ?? 0;
                acc.marksEarned += q.marks ?? 0;
                acc.maxPossible += q.positiveMarks ?? 0;
                return acc;
            }, { attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0 });
            const overallReport = {
                totalAttempts: (overall?.practiceAttempts ?? 0) + redisOverall.attempts,
                totalTimeSpent: (overall?.practiceTimeSpent ?? 0) + redisOverall.timeSpent,
                totalMarksEarned: (overall?.practiceMarksEarned ?? 0) + redisOverall.marksEarned,
                totalMaxPossible: (overall?.practiceMaxPossible ?? 0) + redisOverall.maxPossible,
                accuracy: calcAcc((overall?.practiceMarksEarned ?? 0) + redisOverall.marksEarned, (overall?.practiceMaxPossible ?? 0) + redisOverall.maxPossible),
                avgTimePerQuestion: (() => {
                    const totalAttempts = (overall?.practiceAttempts ?? 0) + redisOverall.attempts;
                    const totalTime = (overall?.practiceTimeSpent ?? 0) + redisOverall.timeSpent;
                    return totalAttempts > 0
                        ? parseFloat((totalTime / totalAttempts).toFixed(2))
                        : 0;
                })(),
            };
            // ── Subject wise — pre-seed ALL known subjects with zeros ─
            const subjectMap = {};
            // Seed from DB subjects master list so every subject always appears
            for (const s of allSubjects) {
                subjectMap[s.id] = {
                    subjectId: s.id,
                    subjectName: s.name, // ← name resolved here
                    attempts: 0,
                    timeSpent: 0,
                    marksEarned: 0,
                    maxPossible: 0,
                };
            }
            // Add DB analytics on top of seeds
            for (const s of subjectAnalytics) {
                const sid = s.subjectId;
                if (!subjectMap[sid]) {
                    subjectMap[sid] = {
                        subjectId: sid,
                        subjectName: subjectIdToName[sid] ?? 'Unknown',
                        attempts: 0,
                        timeSpent: 0,
                        marksEarned: 0,
                        maxPossible: 0,
                    };
                }
                subjectMap[sid].attempts += s.practiceAttempts ?? 0;
                subjectMap[sid].timeSpent += s.practiceTimeSpent ?? 0;
                subjectMap[sid].marksEarned += s.practiceMarksEarned ?? 0;
                subjectMap[sid].maxPossible += s.practiceMaxPossible ?? 0;
            }
            // Add Redis questions on top
            for (const q of redisQuestions) {
                if (!q?.subjectId)
                    continue;
                if (!subjectMap[q.subjectId]) {
                    subjectMap[q.subjectId] = {
                        subjectId: q.subjectId,
                        subjectName: subjectIdToName[q.subjectId] ?? 'Unknown',
                        attempts: 0,
                        timeSpent: 0,
                        marksEarned: 0,
                        maxPossible: 0,
                    };
                }
                const s = subjectMap[q.subjectId];
                s.attempts += 1;
                s.timeSpent += q.timeSpent ?? 0;
                s.marksEarned += q.marks ?? 0;
                s.maxPossible += q.positiveMarks ?? 0;
            }
            const subjectReport = Object.values(subjectMap).map((s) => ({
                subjectId: s.subjectId,
                subjectName: s.subjectName, // ← always present now
                attempts: s.attempts,
                timeSpent: s.timeSpent,
                marksEarned: s.marksEarned,
                maxPossible: s.maxPossible,
                accuracy: calcAcc(s.marksEarned, s.maxPossible),
                avgTimePerQuestion: s.attempts > 0
                    ? parseFloat((s.timeSpent / s.attempts).toFixed(2))
                    : 0,
            }));
            // ── Question type wise — pre-seed all known types with zeros ──
            const qtMap = {};
            // Seed known types first so they always appear
            for (const qt of KNOWN_QUESTION_TYPES) {
                qtMap[qt] = {
                    questionType: qt,
                    attempts: 0,
                    timeSpent: 0,
                    marksEarned: 0,
                    maxPossible: 0,
                };
            }
            // Add DB analytics on top
            for (const qt of questionTypeAnalytics) {
                const type = qt.questioType;
                if (!qtMap[type]) {
                    qtMap[type] = {
                        questionType: type,
                        attempts: 0,
                        timeSpent: 0,
                        marksEarned: 0,
                        maxPossible: 0,
                    };
                }
                qtMap[type].attempts += qt.practiceAttempts ?? 0;
                qtMap[type].timeSpent += qt.practiceTimeSpent ?? 0;
                qtMap[type].marksEarned += qt.practiceMarksEarned ?? 0;
                qtMap[type].maxPossible += qt.practiceMaxPossible ?? 0;
            }
            // Add Redis questions on top
            for (const q of redisQuestions) {
                if (!q?.type)
                    continue;
                if (!qtMap[q.type]) {
                    qtMap[q.type] = {
                        questionType: q.type,
                        attempts: 0,
                        timeSpent: 0,
                        marksEarned: 0,
                        maxPossible: 0,
                    };
                }
                const qt = qtMap[q.type];
                qt.attempts += 1;
                qt.timeSpent += q.timeSpent ?? 0;
                qt.marksEarned += q.marks ?? 0;
                qt.maxPossible += q.positiveMarks ?? 0;
            }
            const questionTypeReport = Object.values(qtMap).map((qt) => ({
                questionType: qt.questionType,
                attempts: qt.attempts,
                timeSpent: qt.timeSpent,
                marksEarned: qt.marksEarned,
                maxPossible: qt.maxPossible,
                accuracy: calcAcc(qt.marksEarned, qt.maxPossible),
                avgTimePerQuestion: qt.attempts > 0
                    ? parseFloat((qt.timeSpent / qt.attempts).toFixed(2))
                    : 0,
            }));
            // ── Exam wise ────────────────────────────────────────────
            const examMap = {};
            for (const e of examAnalytics) {
                examMap[e.examName] = {
                    examName: e.examName,
                    attempts: e.practiceAttempts ?? 0,
                    timeSpent: e.practiceTimeSpent ?? 0,
                    marksEarned: e.practiceMarksEarned ?? 0,
                    maxPossible: e.practiceMaxPossible ?? 0,
                };
            }
            for (const q of redisQuestions) {
                if (!q?.examName)
                    continue;
                if (!examMap[q.examName]) {
                    examMap[q.examName] = {
                        examName: q.examName, attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0,
                    };
                }
                const e = examMap[q.examName];
                e.attempts += 1;
                e.timeSpent += q.timeSpent ?? 0;
                e.marksEarned += q.marks ?? 0;
                e.maxPossible += q.positiveMarks ?? 0;
            }
            const examReport = Object.values(examMap).map((e) => ({
                examName: e.examName,
                attempts: e.attempts,
                timeSpent: e.timeSpent,
                marksEarned: e.marksEarned,
                maxPossible: e.maxPossible,
                accuracy: calcAcc(e.marksEarned, e.maxPossible),
                avgTimePerQuestion: e.attempts > 0
                    ? parseFloat((e.timeSpent / e.attempts).toFixed(2))
                    : 0,
            }));
            return {
                studentId,
                generatedAt: new Date(),
                overall: overallReport,
                subjects: subjectReport, // subjectName now included
                questionTypes: questionTypeReport, // always all types, zero if no data
                exams: examReport,
            };
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
    // ==========================================
    // PUBLIC: studentSnapshot
    // ==========================================
    async studentSnapshot(studentId) {
        try {
            const [allTestData, practiceData, attemptedQuestions, subjectTotals,] = await Promise.all([
                this.allTestResult(studentId),
                this.practiceReport(studentId),
                uniqueCountService_1.questionBitmapRegistry.getAttemptedQuestionIds(studentId),
                subject_db_1.subject.readingAllSubjects(),
            ]);
            const calcAcc = (earned, max) => max > 0 ? parseFloat(((earned / max) * 100).toFixed(2)) : 0;
            // ── Subject wise unique count ─────────────────────────────
            const subjectWiseUnique = {
                Mathematics: { uniqueAttempted: 0, totalQuestions: subjectTotals['Mathematics']?.totalQuestion ?? 0 },
                Physics: { uniqueAttempted: 0, totalQuestions: subjectTotals['Physics']?.totalQuestion ?? 0 },
                Chemistry: { uniqueAttempted: 0, totalQuestions: subjectTotals['Chemistry']?.totalQuestion ?? 0 },
            };
            if (attemptedQuestions.questionIds.length > 0) {
                const questionSubjects = await this.db.questions.findMany({
                    where: { id: { in: attemptedQuestions.questionIds } },
                    select: { subjects: { select: { name: true } } },
                });
                for (const q of questionSubjects) {
                    const name = q.subjects.name;
                    if (subjectWiseUnique[name] !== undefined) {
                        subjectWiseUnique[name].uniqueAttempted++;
                    }
                }
            }
            // ── Fetch paper details for last 5 tests (covers both reddis and testWise) ──
            const last5Raw = allTestData.slice(0, 5);
            const last5TestStatusIds = last5Raw.map((t) => t.id);
            // Single query — fetch testStatus → papers → exam for all 5 at once
            const testStatusWithPapers = await this.db.testStatus.findMany({
                where: { id: { in: last5TestStatusIds } },
                select: {
                    id: true,
                    papers: {
                        select: {
                            year: true,
                            month: true,
                            day: true,
                            date: true,
                            shift: true,
                            mode: true,
                            totalMarks: true,
                            totalDuration: true,
                            totalQuestions: true,
                            exam: {
                                select: { name: true },
                            },
                        },
                    },
                },
            });
            // Build a lookup map: testStatusId → paperDetails
            const paperDetailsMap = {};
            for (const ts of testStatusWithPapers) {
                paperDetailsMap[ts.id] = {
                    examName: ts.papers.exam.name ?? null,
                    year: ts.papers.year ?? null,
                    month: ts.papers.month ?? null,
                    day: ts.papers.day ?? null,
                    date: ts.papers.date ?? null,
                    shift: ts.papers.shift ?? null,
                    mode: ts.papers.mode ?? null,
                    totalMarks: ts.papers.totalMarks ?? null,
                    totalDuration: ts.papers.totalDuration ?? null,
                    totalQuestions: ts.papers.totalQuestions ?? null,
                };
            }
            // ── Helper: build per-subject block, always all 3 subjects ──
            const buildSubjectBlock = (t, subKey, subjectName) => {
                const s = t[subKey];
                return {
                    subjectName,
                    marks: s?.marks ?? 0,
                    correct: s?.correct ?? 0,
                    wrong: s?.wrong ?? 0,
                    timeTaken: s?.timeTaken ?? 0,
                    totalQuestions: s?.totalQuestions ?? 0,
                    accuracy: s
                        ? calcAcc(s.marks ?? 0, s.maxMarks ?? s.maxScore ?? s.totalQuestions ?? 0)
                        : 0,
                };
            };
            // ── Helper: build question-wise block for one test ────────
            const buildQuestionWiseBlock = (t) => {
                const qtBlock = {};
                for (const qt of KNOWN_QUESTION_TYPES) {
                    qtBlock[qt] = {
                        questionType: qt,
                        marks: 0,
                        correct: 0,
                        wrong: 0,
                        accuracy: 0,
                    };
                }
                if (t.questionWise && typeof t.questionWise === 'object') {
                    for (const [qtType, qtData] of Object.entries(t.questionWise)) {
                        if (!qtBlock[qtType]) {
                            qtBlock[qtType] = {
                                questionType: qtType,
                                marks: 0,
                                correct: 0,
                                wrong: 0,
                                accuracy: 0,
                            };
                        }
                        const maxForCalc = qtData?.maxMarks ?? qtData?.maxScore ?? 0;
                        qtBlock[qtType] = {
                            questionType: qtType,
                            marks: qtData?.marks ?? 0,
                            correct: qtData?.correct ?? 0,
                            wrong: qtData?.wrong ?? 0,
                            accuracy: calcAcc(qtData?.marks ?? 0, maxForCalc),
                        };
                    }
                }
                return Object.values(qtBlock);
            };
            // ── Last 5 tests ──────────────────────────────────────────
            const last5Tests = last5Raw.map((t) => {
                const overallMarks = t.overAllAnalytics?.marks ?? t.overAllAnalytics?.totalScore ?? 0;
                const overallMaxMark = t.overAllAnalytics?.maxMarks ?? t.overAllAnalytics?.maxScore ?? 0;
                return {
                    testId: t.id,
                    source: t.source,
                    createdAt: t.created_at,
                    // ── Paper details from DB for both reddis and testWise ──
                    paperDetails: paperDetailsMap[t.id] ?? null,
                    // Overall test stats
                    overall: {
                        marks: overallMarks,
                        maxMarks: overallMaxMark,
                        accuracy: calcAcc(overallMarks, overallMaxMark),
                        timeTaken: t.overAllAnalytics?.timeTaken ?? 0,
                    },
                    // Always all 3 subjects, zero if no data
                    subjects: {
                        math: buildSubjectBlock(t, 'math', 'Mathematics'),
                        physics: buildSubjectBlock(t, 'physics', 'Physics'),
                        chemistry: buildSubjectBlock(t, 'chemistry', 'Chemistry'),
                    },
                    // Always all question types, zero if no data
                    questionWise: buildQuestionWiseBlock(t),
                };
            });
            // ── Aggregate analytics across last 5 tests ───────────────
            const last5Aggregate = (() => {
                if (last5Tests.length === 0)
                    return null;
                const qtAggregate = {};
                for (const qt of KNOWN_QUESTION_TYPES) {
                    qtAggregate[qt] = { marks: 0, correct: 0, wrong: 0 };
                }
                const subjectAggregate = {
                    Mathematics: { marks: 0, correct: 0, wrong: 0 },
                    Physics: { marks: 0, correct: 0, wrong: 0 },
                    Chemistry: { marks: 0, correct: 0, wrong: 0 },
                };
                let totalMarks = 0;
                let totalMaxMarks = 0;
                let totalTime = 0;
                for (const test of last5Tests) {
                    totalMarks += test.overall.marks;
                    totalMaxMarks += test.overall.maxMarks;
                    totalTime += test.overall.timeTaken;
                    for (const qw of test.questionWise) {
                        if (!qtAggregate[qw.questionType]) {
                            qtAggregate[qw.questionType] = { marks: 0, correct: 0, wrong: 0 };
                        }
                        qtAggregate[qw.questionType].marks += qw.marks;
                        qtAggregate[qw.questionType].correct += qw.correct;
                        qtAggregate[qw.questionType].wrong += qw.wrong;
                    }
                    for (const { key, name } of KNOWN_SUBJECTS) {
                        const s = test.subjects[key];
                        subjectAggregate[name].marks += s.marks;
                        subjectAggregate[name].correct += s.correct;
                        subjectAggregate[name].wrong += s.wrong;
                    }
                }
                return {
                    testsIncluded: last5Tests.length,
                    totalMarks,
                    totalMaxMarks,
                    overallAccuracy: calcAcc(totalMarks, totalMaxMarks),
                    avgTimeTaken: parseFloat((totalTime / last5Tests.length).toFixed(2)),
                    subjects: KNOWN_SUBJECTS.map(({ name }) => ({
                        subjectName: name,
                        totalMarks: subjectAggregate[name].marks,
                        totalCorrect: subjectAggregate[name].correct,
                        totalWrong: subjectAggregate[name].wrong,
                        accuracy: calcAcc(subjectAggregate[name].marks, subjectAggregate[name].marks + subjectAggregate[name].wrong),
                    })),
                    questionWise: Object.entries(qtAggregate).map(([qt, data]) => ({
                        questionType: qt,
                        totalMarks: data.marks,
                        totalCorrect: data.correct,
                        totalWrong: data.wrong,
                        accuracy: calcAcc(data.marks, data.marks + data.wrong),
                    })),
                };
            })();
            return {
                studentId,
                generatedAt: new Date(),
                tests: {
                    last5: last5Tests,
                    last5Aggregate,
                },
                practice: practiceData,
                uniqueQuestionsAttempted: {
                    total: attemptedQuestions.totalUnique,
                    subjectWise: subjectWiseUnique,
                },
            };
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
}
exports.reportService = new ReportService(database_1.database);
