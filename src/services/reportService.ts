import { PrismaClient } from "@prisma/client";
import { database } from "../lib/database";
import { analytics } from "../repositories/analytics.db";
import { subject } from "../repositories/subject.db";
import { reddisService } from "./reddisService";
import { questionBitmapRegistry } from "./uniqueCountService";

class ReportService {
    private db: PrismaClient;

    constructor(database: PrismaClient) {
        this.db = database;
    }

    // ==========================================
    // HELPERS
    // ==========================================

    private calcAccuracy(marks: number, maxMarks: number): number {
        return maxMarks > 0 ? parseFloat(((marks / maxMarks) * 100).toFixed(2)) : 0;
    }

    private avgOf(arr: number[]): number {
        return arr.length > 0
            ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2))
            : 0;
    }

    // ==========================================
    // FETCH & MERGE ALL TEST DATA
    // ==========================================

    async allTestResult(studentId: any) {
        try {
            const reddisTestData = await reddisService.reddisTestData(studentId);
            const testWiseData   = await analytics.testWiseData(studentId);

            // ✅ Fix 3 — was item.finalTestResult, correct field is item.testData
            const reddisArray = reddisTestData.testData.map((item: any) => ({
                id:               item.testId,
                exam:             item.testData.exam,
                created_at:       new Date(item.created_at),
                source:           'reddis',
                math:             item.testData.math,
                physics:          item.testData.physics,
                chemistry:        item.testData.chemistry,
                overAllAnalytics: item.testData.overall,
                questionWise:     item.testData.questionTypes,
                chapterWise:      item.testData.chapterWise ?? [],
            }));

            const testWiseArray = testWiseData.map((item: any) => ({
                id:               item.testStatusId,
                created_at:       new Date(item.created_at),
                source:           'testWise',
                exam:             item.exam,
                paperMeta: {
                    year:           item.paperMeta?.year           ?? null,
                    month:          item.paperMeta?.month          ?? null,
                    day:            item.paperMeta?.day            ?? null,
                    date:           item.paperMeta?.date           ?? null,
                    shift:          item.paperMeta?.shift          ?? null,
                    mode:           item.paperMeta?.mode           ?? null,
                    totalMarks:     item.paperMeta?.totalMarks     ?? null,
                    totalDuration:  item.paperMeta?.totalDuration  ?? null,
                    totalQuestions: item.paperMeta?.totalQuestions ?? null,
                },
                math:             item.math,
                physics:          item.physics,
                chemistry:        item.chemistry,
                overAllAnalytics: item.overall,
                questionWise:     item.questionTypes,
                chapterWise:      [],
            }));

            const mergedTests = [...reddisArray, ...testWiseArray].sort(
                (a, b) => b.created_at.getTime() - a.created_at.getTime()
            );

            return mergedTests;

        } catch (err: any) {
            console.error(err);
            throw err;
        }
    }

    // ==========================================
    // SUBJECT ANALYTICS BUILDER
    // ==========================================

    private buildSubjectAnalytics(tests: any[], subject: 'math' | 'physics' | 'chemistry') {
        const s = tests.filter((t) => t[subject]);
        if (s.length === 0) return null;

        const marks    = s.map((t) => t[subject]?.marks ?? 0);
        const maxMarks = s.map((t) => t[subject]?.maxMarks ?? t[subject]?.maxScore ?? 0);
        const correct  = s.map((t) => t[subject]?.correct ?? 0);
        const wrong    = s.map((t) => t[subject]?.wrong ?? 0);
        const time     = s.map((t) => t[subject]?.timeTaken ?? 0);
        const totalQ   = s.map((t) => t[subject]?.totalQuestions ?? 0);

        return {
            avgScore:           this.avgOf(marks),
            avgMaxScore:        this.avgOf(maxMarks),
            avgAccuracy:        this.avgOf(s.map((_, i) => this.calcAccuracy(marks[i], maxMarks[i]))),
            avgCorrect:         this.avgOf(correct),
            avgWrong:           this.avgOf(wrong),
            avgTimeTaken:       this.avgOf(time),
            avgTimePerQuestion: this.avgOf(
                s.map((_, i) => totalQ[i] > 0 ? parseFloat((time[i] / totalQ[i]).toFixed(2)) : 0)
            ),
        };
    }

    // ==========================================
    // QUESTION TYPE ANALYTICS BUILDER
    // ==========================================

    private buildQuestionTypes(tests: any[]) {
        const allQTypes = new Set<string>();
        tests.forEach((t) => {
            if (t.questionWise) Object.keys(t.questionWise).forEach((k) => allQTypes.add(k));
        });

        const result: Record<string, any> = {};
        for (const qType of allQTypes) {
            const qTests = tests.filter((t) => t.questionWise?.[qType]);
            if (qTests.length === 0) continue;

            const marks    = qTests.map((t) => t.questionWise[qType]?.marks ?? 0);
            const maxMarks = qTests.map((t) => t.questionWise[qType]?.maxMarks ?? t.questionWise[qType]?.maxScore ?? 0);

            result[qType] = {
                avgScore:    this.avgOf(marks),
                avgAccuracy: this.avgOf(qTests.map((_, i) => this.calcAccuracy(marks[i], maxMarks[i]))),
                avgCorrect:  this.avgOf(qTests.map((t) => t.questionWise[qType]?.correct ?? 0)),
                avgWrong:    this.avgOf(qTests.map((t) => t.questionWise[qType]?.wrong ?? 0)),
            };
        }
        return result;
    }

    // ==========================================
    // IMPROVEMENT BUILDER
    // ==========================================

    private buildImprovement(tests: any[]) {
        const latest   = tests[0];
        const previous = tests.slice(1);
        if (previous.length === 0) return null;

        const latestAcc = this.calcAccuracy(
            latest.overAllAnalytics?.marks ?? latest.overAllAnalytics?.totalScore ?? 0,
            latest.overAllAnalytics?.maxMarks ?? latest.overAllAnalytics?.maxScore ?? 0
        );
        const prevAcc = this.avgOf(previous.map((t) => this.calcAccuracy(
            t.overAllAnalytics?.marks ?? t.overAllAnalytics?.totalScore ?? 0,
            t.overAllAnalytics?.maxMarks ?? t.overAllAnalytics?.maxScore ?? 0
        )));

        const latestScore = latest.overAllAnalytics?.marks ?? latest.overAllAnalytics?.totalScore ?? 0;
        const prevScore   = this.avgOf(previous.map((t) =>
            t.overAllAnalytics?.marks ?? t.overAllAnalytics?.totalScore ?? 0
        ));

        const latestQ    = latest.overAllAnalytics?.totalQuestions ?? 0;
        const latestTime = latestQ > 0
            ? parseFloat(((latest.overAllAnalytics?.timeTaken ?? 0) / latestQ).toFixed(2)) : 0;
        const prevTime = this.avgOf(previous.map((t) => {
            const q = t.overAllAnalytics?.totalQuestions ?? 0;
            return q > 0 ? parseFloat(((t.overAllAnalytics?.timeTaken ?? 0) / q).toFixed(2)) : 0;
        }));

        const subjectImprovement = (subject: 'math' | 'physics' | 'chemistry') => {
            const latestS = latest[subject];
            const prevS   = previous.filter((t) => t[subject]);
            if (!latestS || prevS.length === 0) return null;

            return {
                accuracyChange: parseFloat((
                    this.calcAccuracy(latestS.marks ?? 0, latestS.maxMarks ?? latestS.maxScore ?? 0) -
                    this.avgOf(prevS.map((t) => this.calcAccuracy(
                        t[subject]?.marks ?? 0,
                        t[subject]?.maxMarks ?? t[subject]?.maxScore ?? 0
                    )))
                ).toFixed(2)),
                scoreChange: parseFloat((
                    (latestS.marks ?? 0) -
                    this.avgOf(prevS.map((t) => t[subject]?.marks ?? 0))
                ).toFixed(2)),
                wrongChange: parseFloat((
                    (latestS.wrong ?? 0) -
                    this.avgOf(prevS.map((t) => t[subject]?.wrong ?? 0))
                ).toFixed(2)),
            };
        };

        return {
            overall: {
                accuracyChange:           parseFloat((latestAcc - prevAcc).toFixed(2)),
                scoreChange:              parseFloat((latestScore - prevScore).toFixed(2)),
                avgTimePerQuestionChange: parseFloat((latestTime - prevTime).toFixed(2)),
            },
            subjects: {
                math:      subjectImprovement('math'),
                physics:   subjectImprovement('physics'),
                chemistry: subjectImprovement('chemistry'),
            },
        };
    }

    // ==========================================
    // CHAPTER ANALYTICS BUILDER
    // ==========================================

    private buildChapterAnalytics(
        dbChapterAnalytics: any[],
        reddisChapterWise:  any[],
        examFilter?:        string
    ) {
        const calcAcc = (earned: number, max: number) =>
            max > 0 ? parseFloat(((earned / max) * 100).toFixed(2)) : 0;

        const chapterMap: Record<string, any> = {};

        for (const ch of dbChapterAnalytics) {
            chapterMap[ch.chapterId] = {
                chapterId: ch.chapterId,
                practiceJeeMain: {
                    attempts:    ch.practiceJeeMainAttempts,
                    timeSpent:   ch.practiceJeeMainTimeSpent,
                    marksEarned: ch.practiceJeeMainMarksEarned,
                    maxPossible: ch.practiceJeeMainMaxPossible,
                    correct:     ch.practiceJeeMainCorrect,
                    wrong:       ch.practiceJeeMainWrong,
                    partial:     ch.practiceJeeMainPartial,
                    accuracy:    calcAcc(ch.practiceJeeMainMarksEarned, ch.practiceJeeMainMaxPossible),
                },
                practiceJeeAdvanced: {
                    attempts:    ch.practiceJeeAdvancedAttempts,
                    timeSpent:   ch.practiceJeeAdvancedTimeSpent,
                    marksEarned: ch.practiceJeeAdvancedMarksEarned,
                    maxPossible: ch.practiceJeeAdvancedMaxPossible,
                    correct:     ch.practiceJeeAdvancedCorrect,
                    wrong:       ch.practiceJeeAdvancedWrong,
                    partial:     ch.practiceJeeAdvancedPartial,
                    accuracy:    calcAcc(ch.practiceJeeAdvancedMarksEarned, ch.practiceJeeAdvancedMaxPossible),
                },
                testJeeMain: {
                    attempts:    ch.testJeeMainAttempts,
                    timeSpent:   ch.testJeeMainTimeSpent,
                    marksEarned: ch.testJeeMainMarksEarned,
                    maxPossible: ch.testJeeMainMaxPossible,
                    correct:     ch.testJeeMainCorrect,
                    wrong:       ch.testJeeMainWrong,
                    partial:     ch.testJeeMainPartial,
                    accuracy:    calcAcc(ch.testJeeMainMarksEarned, ch.testJeeMainMaxPossible),
                },
                testJeeAdvanced: {
                    attempts:    ch.testJeeAdvancedAttempts,
                    timeSpent:   ch.testJeeAdvancedTimeSpent,
                    marksEarned: ch.testJeeAdvancedMarksEarned,
                    maxPossible: ch.testJeeAdvancedMaxPossible,
                    correct:     ch.testJeeAdvancedCorrect,
                    wrong:       ch.testJeeAdvancedWrong,
                    partial:     ch.testJeeAdvancedPartial,
                    accuracy:    calcAcc(ch.testJeeAdvancedMarksEarned, ch.testJeeAdvancedMaxPossible),
                },
                redisContribution: null,
            };
        }

        for (const rCh of reddisChapterWise) {
            if (examFilter && rCh.examName !== examFilter) continue;

            const isJeeMain     = rCh.examName === 'JEE_MAIN';
            const isJeeAdvanced = rCh.examName === 'JEE_ADVANCED';

            if (!chapterMap[rCh.chapterId]) {
                chapterMap[rCh.chapterId] = {
                    chapterId:           rCh.chapterId,
                    practiceJeeMain:     { attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0, correct: 0, wrong: 0, partial: 0, accuracy: 0 },
                    practiceJeeAdvanced: { attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0, correct: 0, wrong: 0, partial: 0, accuracy: 0 },
                    testJeeMain:         { attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0, correct: 0, wrong: 0, partial: 0, accuracy: 0 },
                    testJeeAdvanced:     { attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0, correct: 0, wrong: 0, partial: 0, accuracy: 0 },
                    redisContribution:   null,
                };
            }

            const ch      = chapterMap[rCh.chapterId];
            const section = isJeeMain ? ch.testJeeMain : isJeeAdvanced ? ch.testJeeAdvanced : null;
            if (!section) continue;

            section.attempts    += rCh.attempt       ?? 0;
            section.timeSpent   += rCh.timeTaken     ?? 0;
            section.marksEarned += rCh.marks         ?? 0;
            section.maxPossible += rCh.positiveMarks ?? 0;
            section.correct     += rCh.correct       ?? 0;
            section.wrong       += rCh.wrong         ?? 0;
            section.partial     += rCh.partial       ?? 0;
            section.accuracy     = calcAcc(section.marksEarned, section.maxPossible);

            if (!ch.redisContribution) {
                ch.redisContribution = {
                    examName: rCh.examName, attempt: 0, correct: 0, wrong: 0,
                    partial: 0, marks: 0, maxPossible: 0, timeTaken: 0,
                };
            }
            ch.redisContribution.attempt     += rCh.attempt       ?? 0;
            ch.redisContribution.correct     += rCh.correct       ?? 0;
            ch.redisContribution.wrong       += rCh.wrong         ?? 0;
            ch.redisContribution.partial     += rCh.partial       ?? 0;
            ch.redisContribution.marks       += rCh.marks         ?? 0;
            ch.redisContribution.maxPossible += rCh.positiveMarks ?? 0;
            ch.redisContribution.timeTaken   += rCh.timeTaken     ?? 0;
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

    private buildGroupAnalytics(tests: any[]) {
        if (tests.length === 0) return null;

        return {
            totalTests: tests.length,
            overall: {
                avgScore: this.avgOf(
                    tests.map((t) => t.overAllAnalytics?.marks ?? t.overAllAnalytics?.totalScore ?? 0)
                ),
                avgAccuracy: this.avgOf(
                    tests.map((t) => this.calcAccuracy(
                        t.overAllAnalytics?.marks ?? t.overAllAnalytics?.totalScore ?? 0,
                        t.overAllAnalytics?.maxMarks ?? t.overAllAnalytics?.maxScore ?? 0
                    ))
                ),
                avgTimePerQuestion: this.avgOf(
                    tests.map((t) => {
                        const q    = t.overAllAnalytics?.totalQuestions ?? 0;
                        const time = t.overAllAnalytics?.timeTaken ?? 0;
                        return q > 0 ? parseFloat((time / q).toFixed(2)) : 0;
                    })
                ),
            },
            subjects: {
                math:      this.buildSubjectAnalytics(tests, 'math'),
                physics:   this.buildSubjectAnalytics(tests, 'physics'),
                chemistry: this.buildSubjectAnalytics(tests, 'chemistry'),
            },
            questionTypes: this.buildQuestionTypes(tests),
            improvement:   this.buildImprovement(tests),
            testMarksList: tests.map((t) => ({
                testId:    t.id,
                examName:  t.exam,
                createdAt: t.created_at,
                marks:     t.overAllAnalytics?.marks ?? t.overAllAnalytics?.totalScore ?? 0,
                maxMarks:  t.overAllAnalytics?.maxMarks ?? t.overAllAnalytics?.maxScore ?? 0,
                accuracy:  this.calcAccuracy(
                    t.overAllAnalytics?.marks ?? t.overAllAnalytics?.totalScore ?? 0,
                    t.overAllAnalytics?.maxMarks ?? t.overAllAnalytics?.maxScore ?? 0
                ),
            })),
        };
    }

    // ==========================================
    // CORE REPORT BUILDER
    // ==========================================

    private buildReport(allTestData: any[], lastNPerGroup: number) {
        if (allTestData.length === 0) return null;

        const groups: Record<string, any[]> = {};
        for (const test of allTestData) {
            const exam = test.exam ?? 'UNKNOWN';
            if (!groups[exam]) groups[exam] = [];
            groups[exam].push(test);
        }

        for (const exam of Object.keys(groups)) {
            groups[exam] = groups[exam].slice(0, lastNPerGroup);
        }

        const examReports: Record<string, any> = {};
        for (const [examName, tests] of Object.entries(groups)) {
            examReports[examName] = this.buildGroupAnalytics(tests);
        }

        return { lastNPerGroup, examReports };
    }

    // ==========================================
    // PUBLIC: reportMaking
    // ==========================================

    async reportMaking(studentId: string, lastNPerGroup: number = 10) {
        try {
            const allTestData = await this.allTestResult(studentId);
            if (allTestData.length === 0) return null;

            return {
                studentId,
                generatedAt: new Date(),
                ...this.buildReport(allTestData, lastNPerGroup),
            };

        } catch (err: any) {
            console.error(err);
            throw err;
        }
    }

    // ==========================================
    // PUBLIC: lastTest
    // ==========================================

    async lastTest(studentId: string) {
        try {
            const allTestData = await this.allTestResult(studentId);
            if (allTestData.length === 0) return null;

            // ✅ Fix 4 — buildReport is synchronous, no need for Promise.all + Promise.resolve
            const last3  = this.buildReport(allTestData, 3);
            const last5  = this.buildReport(allTestData, 5);
            const last10 = this.buildReport(allTestData, 10);

            return { studentId, last3, last5, last10 };

        } catch (err: any) {
            console.error(err);
            throw err;
        }
    }

    // ==========================================
    // PUBLIC: chapterReport
    // ==========================================

    async chapterReport(studentId: string, examFilter?: 'JEE_MAIN' | 'JEE_ADVANCED') {
        try {
            const [dbChapterAnalytics, reddisData] = await Promise.all([
                analytics.chapterWiseAnalytics(studentId),
                reddisService.reddisTestData(studentId),
            ]);

            const reddisChapterWise: any[] = [];
            for (const test of reddisData.testData ?? []) {
                const chapterWise = test.testData?.chapterWise ?? [];
                for (const ch of chapterWise) {
                    reddisChapterWise.push({
                        ...ch,
                        examName:  test.testData.exam,
                        testId:    test.testId,
                        createdAt: test.created_at,
                    });
                }
            }

            const chapters = this.buildChapterAnalytics(
                dbChapterAnalytics,
                reddisChapterWise,
                examFilter,
            );

            return {
                studentId,
                generatedAt: new Date(),
                examFilter:  examFilter ?? 'ALL',
                chapters,
            };

        } catch (err: any) {
            console.error(err);
            throw err;
        }
    }

    // ==========================================
    // PUBLIC: fullDashboard
    // ==========================================

    async fullDashboard(studentId: string, lastNPerGroup: number = 10) {
        try {
            const allTestData = await this.allTestResult(studentId);

            if (allTestData.length === 0) {
                return {
                    studentId,
                    generatedAt: new Date(),
                    report:     null,
                    lastNTests: { last3: null, last5: null, last10: null },
                    allTests:   [],
                };
            }

            // ✅ Fix 4 — synchronous calls, no Promise.all needed
            const report = this.buildReport(allTestData, lastNPerGroup);
            const last3  = this.buildReport(allTestData, 3);
            const last5  = this.buildReport(allTestData, 5);
            const last10 = this.buildReport(allTestData, 10);

            return {
                studentId,
                generatedAt: new Date(),
                report,
                lastNTests: { last3, last5, last10 },
                allTests:   allTestData,
            };

        } catch (err: any) {
            console.error(err);
            throw err;
        }
    }

    // ==========================================
    // PUBLIC: practiceReport
    // ==========================================

    async practiceReport(studentId: string) {
        try {
            const [
                overallAnalytics,
                subjectAnalytics,
                examAnalytics,
                questionTypeAnalytics,
                redisPracticeData,
            ] = await Promise.all([
                analytics.studentOverAllAnalytics(studentId),
                analytics.subjectAnanlytics(studentId),
                analytics.examWiseAnalytics(studentId),
                analytics.questionWiseAnalytics(studentId),
                reddisService.reddisPraticeWiseData(studentId),
            ]);

            const calcAcc = (earned: number, max: number) =>
                max > 0 ? parseFloat(((earned / max) * 100).toFixed(2)) : 0;

            // ✅ Fix 2 — unwrap questionData so all field accesses work directly
            const redisQuestions: any[] = (redisPracticeData.praticeWiseData ?? [])
                .filter((q: any) => q?.questionData != null)
                .map((q: any) => q.questionData);

            // ── Overall ──────────────────────────────────────────────
            const overall = overallAnalytics;  // ✅ findUnique returns object directly

            const redisOverall = redisQuestions.reduce(
                (acc, q) => {
                    acc.attempts    += 1;
                    acc.timeSpent   += q.timeSpent     ?? 0;
                    acc.marksEarned += q.marks         ?? 0;
                    acc.maxPossible += q.positiveMarks ?? 0;
                    return acc;
                },
                { attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0 },
            );

            const overallReport = {
                totalAttempts:    (overall?.practiceAttempts    ?? 0) + redisOverall.attempts,
                totalTimeSpent:   (overall?.practiceTimeSpent   ?? 0) + redisOverall.timeSpent,
                totalMarksEarned: (overall?.practiceMarksEarned ?? 0) + redisOverall.marksEarned,
                totalMaxPossible: (overall?.practiceMaxPossible ?? 0) + redisOverall.maxPossible,
                accuracy: calcAcc(
                    (overall?.practiceMarksEarned ?? 0) + redisOverall.marksEarned,
                    (overall?.practiceMaxPossible ?? 0) + redisOverall.maxPossible,
                ),
                avgTimePerQuestion: (() => {
                    const totalAttempts = (overall?.practiceAttempts ?? 0) + redisOverall.attempts;
                    const totalTime     = (overall?.practiceTimeSpent ?? 0) + redisOverall.timeSpent;
                    return totalAttempts > 0
                        ? parseFloat((totalTime / totalAttempts).toFixed(2))
                        : 0;
                })(),
            };

            // ── Subject wise ─────────────────────────────────────────
            const subjectMap: Record<string, any> = {};

            for (const s of subjectAnalytics) {
                subjectMap[(s as any).subjectId] = {
                    subjectId:   (s as any).subjectId,
                    attempts:    (s as any).practiceAttempts,
                    timeSpent:   (s as any).practiceTimeSpent,
                    marksEarned: (s as any).practiceMarksEarned,
                    maxPossible: (s as any).practiceMaxPossible,
                };
            }

            for (const q of redisQuestions) {
                if (!q?.subjectId) continue;
                if (!subjectMap[q.subjectId]) {
                    subjectMap[q.subjectId] = {
                        subjectId: q.subjectId, attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0,
                    };
                }
                const s = subjectMap[q.subjectId];
                s.attempts    += 1;
                s.timeSpent   += q.timeSpent     ?? 0;
                s.marksEarned += q.marks         ?? 0;
                s.maxPossible += q.positiveMarks ?? 0;
            }

            const subjectReport = Object.values(subjectMap).map((s: any) => ({
                subjectId:          s.subjectId,
                attempts:           s.attempts,
                timeSpent:          s.timeSpent,
                marksEarned:        s.marksEarned,
                maxPossible:        s.maxPossible,
                accuracy:           calcAcc(s.marksEarned, s.maxPossible),
                avgTimePerQuestion: s.attempts > 0
                    ? parseFloat((s.timeSpent / s.attempts).toFixed(2))
                    : 0,
            }));

            // ── Question type wise ───────────────────────────────────
            const qtMap: Record<string, any> = {};

            for (const qt of questionTypeAnalytics) {
                qtMap[(qt as any).questioType] = {
                    questionType: (qt as any).questioType,
                    attempts:     (qt as any).practiceAttempts,
                    timeSpent:    (qt as any).practiceTimeSpent,
                    marksEarned:  (qt as any).practiceMarksEarned,
                    maxPossible:  (qt as any).practiceMaxPossible,
                };
            }

            for (const q of redisQuestions) {
                if (!q?.type) continue;
                if (!qtMap[q.type]) {
                    qtMap[q.type] = {
                        questionType: q.type, attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0,
                    };
                }
                const qt = qtMap[q.type];
                qt.attempts    += 1;
                qt.timeSpent   += q.timeSpent     ?? 0;
                qt.marksEarned += q.marks         ?? 0;
                qt.maxPossible += q.positiveMarks ?? 0;
            }

            const questionTypeReport = Object.values(qtMap).map((qt: any) => ({
                questionType:       qt.questionType,
                attempts:           qt.attempts,
                timeSpent:          qt.timeSpent,
                marksEarned:        qt.marksEarned,
                maxPossible:        qt.maxPossible,
                accuracy:           calcAcc(qt.marksEarned, qt.maxPossible),
                avgTimePerQuestion: qt.attempts > 0
                    ? parseFloat((qt.timeSpent / qt.attempts).toFixed(2))
                    : 0,
            }));

            // ── Exam wise ────────────────────────────────────────────
            const examMap: Record<string, any> = {};

            for (const e of examAnalytics) {
                examMap[(e as any).examName] = {
                    examName:    (e as any).examName,
                    attempts:    (e as any).practiceAttempts,
                    timeSpent:   (e as any).practiceTimeSpent,
                    marksEarned: (e as any).practiceMarksEarned,
                    maxPossible: (e as any).practiceMaxPossible,
                };
            }

            for (const q of redisQuestions) {
                if (!q?.examName) continue;
                if (!examMap[q.examName]) {
                    examMap[q.examName] = {
                        examName: q.examName, attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0,
                    };
                }
                const e = examMap[q.examName];
                e.attempts    += 1;
                e.timeSpent   += q.timeSpent     ?? 0;
                e.marksEarned += q.marks         ?? 0;
                e.maxPossible += q.positiveMarks ?? 0;
            }

            const examReport = Object.values(examMap).map((e: any) => ({
                examName:           e.examName,
                attempts:           e.attempts,
                timeSpent:          e.timeSpent,
                marksEarned:        e.marksEarned,
                maxPossible:        e.maxPossible,
                accuracy:           calcAcc(e.marksEarned, e.maxPossible),
                avgTimePerQuestion: e.attempts > 0
                    ? parseFloat((e.timeSpent / e.attempts).toFixed(2))
                    : 0,
            }));

            return {
                studentId,
                generatedAt:   new Date(),
                overall:       overallReport,
                subjects:      subjectReport,
                questionTypes: questionTypeReport,
                exams:         examReport,
            };

        } catch (err: any) {
            console.error(err);
            throw err;
        }
    }

    // ==========================================
    // PUBLIC: studentSnapshot
    // ==========================================

    async studentSnapshot(studentId: string) {
        try {
            const [
                allTestData,
                practiceData,
                attemptedQuestions,
                subjectTotals,
            ] = await Promise.all([
                this.allTestResult(studentId),
                this.practiceReport(studentId),
                questionBitmapRegistry.getAttemptedQuestionIds(studentId),
                subject.readingAllSubjects(),
            ]);

            const calcAcc = (earned: number, max: number) =>
                max > 0 ? parseFloat(((earned / max) * 100).toFixed(2)) : 0;

            // ── Subject wise unique count ─────────────────────────────
            const subjectWiseUnique: Record<string, any> = {
                Mathematics: { uniqueAttempted: 0, totalQuestions: subjectTotals['Mathematics']?.totalQuestion ?? 0 },
                Physics:     { uniqueAttempted: 0, totalQuestions: subjectTotals['Physics']?.totalQuestion     ?? 0 },
                Chemistry:   { uniqueAttempted: 0, totalQuestions: subjectTotals['Chemistry']?.totalQuestion   ?? 0 },
            };

            if (attemptedQuestions.questionIds.length > 0) {
                const questionSubjects = await this.db.questions.findMany({
                    where:  { id: { in: attemptedQuestions.questionIds } },
                    select: { subjects: { select: { name: true } } },
                });

                for (const q of questionSubjects) {
                    const name = q.subjects.name;
                    if (subjectWiseUnique[name] !== undefined) {
                        subjectWiseUnique[name].uniqueAttempted++;
                    }
                }
            }

            // ── Last 5 tests ──────────────────────────────────────────
            const last5Tests = allTestData.slice(0, 5).map((t: any) => ({
                testId:    t.id,
                examName:  t.exam,
                source:    t.source,
                createdAt: t.created_at,
                marks:     t.overAllAnalytics?.marks    ?? t.overAllAnalytics?.totalScore ?? 0,
                maxMarks:  t.overAllAnalytics?.maxMarks ?? t.overAllAnalytics?.maxScore   ?? 0,
                accuracy:  calcAcc(
                    t.overAllAnalytics?.marks    ?? t.overAllAnalytics?.totalScore ?? 0,
                    t.overAllAnalytics?.maxMarks ?? t.overAllAnalytics?.maxScore   ?? 0,
                ),
                timeTaken: t.overAllAnalytics?.timeTaken ?? 0,
                subjects: {
                    math:      t.math ? {
                        marks:    t.math.marks   ?? 0,
                        correct:  t.math.correct ?? 0,
                        wrong:    t.math.wrong   ?? 0,
                        accuracy: calcAcc(t.math.marks ?? 0, t.math.totalQuestions ?? 0),
                    } : null,
                    physics:   t.physics ? {
                        marks:    t.physics.marks   ?? 0,
                        correct:  t.physics.correct ?? 0,
                        wrong:    t.physics.wrong   ?? 0,
                        accuracy: calcAcc(t.physics.marks ?? 0, t.physics.totalQuestions ?? 0),
                    } : null,
                    chemistry: t.chemistry ? {
                        marks:    t.chemistry.marks   ?? 0,
                        correct:  t.chemistry.correct ?? 0,
                        wrong:    t.chemistry.wrong   ?? 0,
                        accuracy: calcAcc(t.chemistry.marks ?? 0, t.chemistry.totalQuestions ?? 0),
                    } : null,
                },
            }));

            return {
                studentId,
                generatedAt: new Date(),
                last5Tests,
                practice: practiceData,
                uniqueQuestionsAttempted: {
                    total:       attemptedQuestions.totalUnique,
                    subjectWise: subjectWiseUnique,
                },
            };

        } catch (err: any) {
            console.error(err);
            throw err;
        }
    }
}

export const reportService = new ReportService(database);