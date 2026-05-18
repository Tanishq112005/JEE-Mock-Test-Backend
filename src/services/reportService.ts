import { PrismaClient } from "@prisma/client";
import { database } from "../lib/database";
import { analytics } from "../repositories/analytics.db";
import { subject } from "../repositories/subject.db";
import { dashboardCacheService } from "./dashboardCacheService";
import { questionBitmapRegistry } from "./uniqueCountService";

// ── Actual Prisma questionType enum values (NOT MCQ/NUMERICAL/MSQ) ───────────
const KNOWN_QUESTION_TYPES = [
  "SingleCorrect",
  "MultiCorrect",
  "Integer",
  "ComprehensionSingleCorrect",
  "ComprehensionMultiCorrect",
  "ComprehensionInteger",
];

const KNOWN_SUBJECTS = [
  { key: "math", name: "Mathematics" },
  { key: "physics", name: "Physics" },
  { key: "chemistry", name: "Chemistry" },
];

class ReportService {
  private db: PrismaClient;

  constructor(database: PrismaClient) {
    this.db = database;
  }

  // ══════════════════════════════════════════
  // HELPERS (Standard Functions, 4 Precision)
  // ══════════════════════════════════════════

  // TRUE ACCURACY: (Correct / Attempted) * 100
  private calcAccuracy(correct: number, wrong: number): number {
    const attempted = correct + wrong;
    if (attempted > 0) {
      return parseFloat(((correct / attempted) * 100).toFixed(4));
    }
    return 0;
  }

  // PERCENTAGE SCORE: (Marks / Max Marks) * 100
  private calcPercentage(marks: number, maxMarks: number): number {
    if (maxMarks > 0) {
      return parseFloat(((marks / maxMarks) * 100).toFixed(4));
    }
    return 0;
  }

  private avgOf(arr: number[]): number {
    if (arr.length > 0) {
      const sum = arr.reduce(function (a, b) {
        return a + b;
      }, 0);
      return parseFloat((sum / arr.length).toFixed(4));
    }
    return 0;
  }

  // ROBUST FALLBACK GETTERS (No Arrow Functions)
  private getMarks(t: any): number {
    const oa = t.overAllAnalytics ?? t.overall ?? {};
    if (oa.totalScore != null) return oa.totalScore;
    if (oa.marks != null) return oa.marks;
    return (
      (t.math?.marks ?? 0) + (t.physics?.marks ?? 0) + (t.chemistry?.marks ?? 0)
    );
  }

  private getMaxMarks(t: any): number {
    const oa = t.overAllAnalytics ?? t.overall ?? {};
    if (oa.maxScore != null) return oa.maxScore;
    if (oa.maxMarks != null) return oa.maxMarks;
    if (oa.totalMarks != null) return oa.totalMarks;
    return (
      (t.math?.maxMarks ?? t.math?.totalMarks ?? t.math?.maxScore ?? 0) +
      (t.physics?.maxMarks ??
        t.physics?.totalMarks ??
        t.physics?.maxScore ??
        0) +
      (t.chemistry?.maxMarks ??
        t.chemistry?.totalMarks ??
        t.chemistry?.maxScore ??
        0)
    );
  }

  private getCorrect(t: any): number {
    const oa = t.overAllAnalytics ?? t.overall ?? {};
    if (oa.correct != null) return oa.correct;
    return (
      (t.math?.correct ?? 0) +
      (t.physics?.correct ?? 0) +
      (t.chemistry?.correct ?? 0)
    );
  }

  private getWrong(t: any): number {
    const oa = t.overAllAnalytics ?? t.overall ?? {};
    if (oa.wrong != null) return oa.wrong;
    return (
      (t.math?.wrong ?? 0) + (t.physics?.wrong ?? 0) + (t.chemistry?.wrong ?? 0)
    );
  }

  // ── UPDATED LOGIC HERE ──────────────────────────────────────────────────────
  private getTime(t: any): number {
    // 1. Calculate from timeLeft if it exists in the mapped object
    if (t.timeLeft != null && t.totalDuration != null) {
      let durationInSeconds = t.totalDuration;

      // Safety check: If totalDuration is in minutes (e.g., 180), convert to seconds.
      // If it's already in seconds (e.g., 10800), skip the conversion.
      if (durationInSeconds < 1000) {
        durationInSeconds *= 60;
      }

      const calculatedTimeTaken = durationInSeconds - t.timeLeft;
      // Math.max ensures we don't return negative time in case of a DB anomaly
      return Math.max(0, calculatedTimeTaken);
    }

    // 2. Existing Fallbacks
    const oa = t.overAllAnalytics ?? t.overall ?? {};
    if (oa.timeTaken != null) return oa.timeTaken;
    if (oa.totalTimeTaken != null) return oa.totalTimeTaken;
    if (oa.timeSpent != null) return oa.timeSpent;
    if (t.timeTaken != null) return t.timeTaken;

    // Fallback: sum up subject-level times if overall time is missing
    return (
      (t.math?.timeTaken ?? t.math?.timeSpent ?? 0) +
      (t.physics?.timeTaken ?? t.physics?.timeSpent ?? 0) +
      (t.chemistry?.timeTaken ?? t.chemistry?.timeSpent ?? 0)
    );
  }

  private getQ(t: any): number {
    const oa = t.overAllAnalytics ?? t.overall ?? {};
    return oa.totalQuestions ?? 0;
  }

  // ══════════════════════════════════════════
  // BLOCK BUILDERS FOR DASHBOARDS
  // ══════════════════════════════════════════

  private buildSubjectBlock(
    t: any,
    key: "math" | "physics" | "chemistry",
    name: string,
  ) {
    const s = t[key];
    if (!s) {
      return {
        subjectName: name,
        marks: 0,
        correct: 0,
        wrong: 0,
        timeTaken: 0,
        totalQuestions: 0,
        accuracy: 0,
        percentage: 0,
      };
    }
    return {
      subjectName: name,
      marks: s.marks ?? 0,
      correct: s.correct ?? 0,
      wrong: s.wrong ?? 0,
      timeTaken: s.timeTaken ?? 0,
      totalQuestions: s.totalQuestions ?? 0,
      accuracy: this.calcAccuracy(s.correct ?? 0, s.wrong ?? 0),
      percentage: this.calcPercentage(
        s.marks ?? 0,
        s.maxMarks ?? s.totalMarks ?? 0,
      ),
    };
  }

  private buildQuestionWiseBlock(t: any) {
    const qtBlock: Record<string, any> = {};
    for (const qt of KNOWN_QUESTION_TYPES) {
      qtBlock[qt] = {
        questionType: qt,
        marks: 0,
        correct: 0,
        wrong: 0,
        accuracy: 0,
        percentage: 0,
      };
    }
    if (t.questionWise && typeof t.questionWise === "object") {
      for (const [qtType, qtData] of Object.entries(
        t.questionWise as Record<string, any>,
      )) {
        qtBlock[qtType] = {
          questionType: qtType,
          marks: qtData?.marks ?? 0,
          correct: qtData?.correct ?? 0,
          wrong: qtData?.wrong ?? 0,
          accuracy: this.calcAccuracy(qtData?.correct ?? 0, qtData?.wrong ?? 0),
          percentage: this.calcPercentage(
            qtData?.marks ?? 0,
            qtData?.maxMarks ?? 0,
          ),
        };
      }
    }
    return Object.values(qtBlock);
  }

  // ══════════════════════════════════════════
  // allTestResult
  // ══════════════════════════════════════════

  async allTestResult(studentId: string) {
    const [reddisTestData, testWiseData] = await Promise.all([
      dashboardCacheService.reddisTestData(studentId),
      analytics.testWiseData(studentId),
    ]);

    const reddisArray = (reddisTestData.testData ?? []).map((item: any) => ({
      id: item.testId,
      paperId: item.testData?.paperId ?? null,
      exam: item.testData?.exam,
      created_at: new Date(item.created_at),
      source: "reddis" as const,
      math: item.testData?.math ?? null,
      physics: item.testData?.physics ?? null,
      chemistry: item.testData?.chemistry ?? null,
      overall: item.testData?.overall ?? null,
      questionWise: item.testData?.questionTypes ?? {},
      chapterWise: item.testData?.chapterWise ?? [],
      timeLeft: item.testData?.timeLeft, // Map if available in redis
      totalDuration: item.testData?.totalDuration,
    }));

    // ── UPDATED LOGIC HERE ──────────────────────────────────────────────────────
    const testWiseArray = testWiseData.map((item: any) => ({
      id: item.testStatusId,
      created_at: new Date(item.created_at),
      source: "testWise" as const,
      exam: item.exam,
      paperMeta: item.paperMeta,
      math: item.math,
      physics: item.physics,
      chemistry: item.chemistry,
      overAllAnalytics: item.overAllAnalytics,
      questionWise: item.questionTypes ?? {},
      chapterWise: item.chapterWise ?? [],
      timeLeft: item.timeLeft, // Injecting timeLeft from DB
      totalDuration: item.paperMeta?.totalDuration || item.paperMeta?.duration, // Injecting total duration
    }));

    // ── Dedup: DB wins if same testId exists in both ────────────────────────
    const dbIds = new Set(testWiseArray.map((t) => t.id));
    const filteredReddis = reddisArray.filter((t) => !dbIds.has(t.id));

    const combined = [...filteredReddis, ...testWiseArray].sort(
      function (a, b) {
        return b.created_at.getTime() - a.created_at.getTime();
      },
    );

    return combined;
  }

  // ══════════════════════════════════════════
  // SUBJECT ANALYTICS
  // ══════════════════════════════════════════

  private buildSubjectAnalytics(
    tests: any[],
    subject: "math" | "physics" | "chemistry",
  ) {
    const valid = tests.filter((t) => t[subject] != null);
    if (valid.length === 0) return null;

    const marks = valid.map((t) => t[subject].marks ?? 0);
    const maxMarks = valid.map(
      (t) =>
        t[subject].maxMarks ??
        t[subject].totalMarks ??
        t[subject].maxScore ??
        0,
    );
    const correct = valid.map((t) => t[subject].correct ?? 0);
    const wrong = valid.map((t) => t[subject].wrong ?? 0);
    const time = valid.map((t) => t[subject].timeTaken ?? 0);
    const totalQ = valid.map((t) => t[subject].totalQuestions ?? 0);

    const _this = this;

    return {
      avgScore: this.avgOf(marks),
      avgMaxScore: this.avgOf(maxMarks),
      avgAccuracy: this.avgOf(
        valid.map(function (_, i) {
          return _this.calcAccuracy(correct[i], wrong[i]);
        }),
      ),
      avgPercentage: this.avgOf(
        valid.map(function (_, i) {
          return _this.calcPercentage(marks[i], maxMarks[i]);
        }),
      ),
      avgCorrect: this.avgOf(correct),
      avgWrong: this.avgOf(wrong),
      avgTimeTaken: this.avgOf(time),
      avgTimePerQuestion: this.avgOf(
        valid.map(function (_, i) {
          return totalQ[i] > 0
            ? parseFloat((time[i] / totalQ[i]).toFixed(4))
            : 0;
        }),
      ),
    };
  }

  // ══════════════════════════════════════════
  // QUESTION TYPE ANALYTICS
  // ══════════════════════════════════════════

  private buildQuestionTypes(tests: any[]) {
    const allQTypes = new Set<string>(KNOWN_QUESTION_TYPES);
    for (const t of tests) {
      if (t.questionWise) {
        Object.keys(t.questionWise).forEach(function (k) {
          allQTypes.add(k);
        });
      }
    }

    const result: Record<string, any> = {};
    const _this = this;

    for (const qType of allQTypes) {
      const relevant = tests.filter((t) => t.questionWise?.[qType] != null);

      if (relevant.length === 0) {
        result[qType] = {
          avgScore: 0,
          avgAccuracy: 0,
          avgCorrect: 0,
          avgWrong: 0,
        };
        continue;
      }

      const marks = relevant.map((t) => t.questionWise[qType].marks ?? 0);
      const maxMarks = relevant.map((t) => t.questionWise[qType].maxMarks ?? 0);
      const correct = relevant.map((t) => t.questionWise[qType].correct ?? 0);
      const wrong = relevant.map((t) => t.questionWise[qType].wrong ?? 0);

      result[qType] = {
        avgScore: this.avgOf(marks),
        avgAccuracy: this.avgOf(
          relevant.map(function (_, i) {
            return _this.calcAccuracy(correct[i], wrong[i]);
          }),
        ),
        avgPercentage: this.avgOf(
          relevant.map(function (_, i) {
            return _this.calcPercentage(marks[i], maxMarks[i]);
          }),
        ),
        avgCorrect: this.avgOf(correct),
        avgWrong: this.avgOf(wrong),
      };
    }

    return result;
  }

  // ══════════════════════════════════════════
  // IMPROVEMENT
  // ══════════════════════════════════════════

  private buildImprovement(tests: any[]) {
    if (tests.length < 2) return null;

    const latest = tests[0];
    const previous = tests.slice(1);
    const _this = this;

    const latestAcc = this.calcAccuracy(
      this.getCorrect(latest),
      this.getWrong(latest),
    );
    const prevAcc = this.avgOf(
      previous.map(function (t) {
        return _this.calcAccuracy(_this.getCorrect(t), _this.getWrong(t));
      }),
    );

    const latestTime =
      this.getQ(latest) > 0
        ? parseFloat((this.getTime(latest) / this.getQ(latest)).toFixed(4))
        : 0;

    const prevTime = this.avgOf(
      previous.map(function (t) {
        const q = _this.getQ(t);
        return q > 0 ? parseFloat((_this.getTime(t) / q).toFixed(4)) : 0;
      }),
    );

    function subjectImprovement(s: "math" | "physics" | "chemistry") {
      const lS = latest[s];
      const prevS = previous.filter((t) => t[s] != null);
      if (!lS || prevS.length === 0) return null;

      const prevAccuracyAvg = _this.avgOf(
        prevS.map(function (t) {
          return _this.calcAccuracy(t[s].correct ?? 0, t[s].wrong ?? 0);
        }),
      );
      const prevMarksAvg = _this.avgOf(
        prevS.map(function (t) {
          return t[s].marks ?? 0;
        }),
      );
      const prevWrongAvg = _this.avgOf(
        prevS.map(function (t) {
          return t[s].wrong ?? 0;
        }),
      );

      return {
        accuracyChange: parseFloat(
          (
            _this.calcAccuracy(lS.correct ?? 0, lS.wrong ?? 0) - prevAccuracyAvg
          ).toFixed(4),
        ),
        scoreChange: parseFloat(((lS.marks ?? 0) - prevMarksAvg).toFixed(4)),
        wrongChange: parseFloat(((lS.wrong ?? 0) - prevWrongAvg).toFixed(4)),
      };
    }

    return {
      overall: {
        accuracyChange: parseFloat((latestAcc - prevAcc).toFixed(4)),
        scoreChange: parseFloat(
          (
            this.getMarks(latest) -
            this.avgOf(
              previous.map(function (t) {
                return _this.getMarks(t);
              }),
            )
          ).toFixed(4),
        ),
        avgTimePerQuestionChange: parseFloat(
          (latestTime - prevTime).toFixed(4),
        ),
      },
      subjects: {
        math: subjectImprovement("math"),
        physics: subjectImprovement("physics"),
        chemistry: subjectImprovement("chemistry"),
      },
    };
  }

  // ══════════════════════════════════════════
  // GROUP ANALYTICS
  // ══════════════════════════════════════════

  private buildGroupAnalytics(tests: any[]) {
    if (tests.length === 0) return null;

    const uniquePapers = new Set<string>();
    for (const t of tests) {
      const pId = t.paperMeta?.id || t.paperId || t.id;
      uniquePapers.add(String(pId));
    }

    const _this = this;

    return {
      totalTests: uniquePapers.size,
      totalAttempts: tests.length,
      overall: {
        avgScore: this.avgOf(
          tests.map(function (t) {
            return _this.getMarks(t);
          }),
        ),
        avgPercentage: this.avgOf(
          tests.map(function (t) {
            return _this.calcPercentage(
              _this.getMarks(t),
              _this.getMaxMarks(t),
            );
          }),
        ),
        avgAccuracy: this.avgOf(
          tests.map(function (t) {
            return _this.calcAccuracy(_this.getCorrect(t), _this.getWrong(t));
          }),
        ),
        avgTimePerQuestion: this.avgOf(
          tests.map(function (t) {
            const q = _this.getQ(t);
            return q > 0 ? parseFloat((_this.getTime(t) / q).toFixed(4)) : 0;
          }),
        ),
      },
      subjects: {
        math: this.buildSubjectAnalytics(tests, "math"),
        physics: this.buildSubjectAnalytics(tests, "physics"),
        chemistry: this.buildSubjectAnalytics(tests, "chemistry"),
      },
      questionTypes: this.buildQuestionTypes(tests),
      improvement: this.buildImprovement(tests),
      testMarksList: tests.map(function (t) {
        return {
          testId: t.id,
          examName: t.exam,
          createdAt: t.created_at,
          marks: _this.getMarks(t),
          maxMarks: _this.getMaxMarks(t),
          accuracy: _this.calcAccuracy(_this.getCorrect(t), _this.getWrong(t)),
          percentage: _this.calcPercentage(
            _this.getMarks(t),
            _this.getMaxMarks(t),
          ),
        };
      }),
    };
  }

  // ══════════════════════════════════════════
  // CORE REPORT BUILDER
  // ══════════════════════════════════════════

  private buildReport(allTestData: any[], lastNPerGroup: number) {
    if (allTestData.length === 0) return null;

    const groups: Record<string, any[]> = {};
    for (const test of allTestData) {
      const exam = test.exam ?? "UNKNOWN";
      if (!groups[exam]) groups[exam] = [];
      groups[exam].push(test);
    }

    const examReports: Record<string, any> = {};
    for (const [examName, tests] of Object.entries(groups)) {
      examReports[examName] = this.buildGroupAnalytics(
        tests.slice(0, lastNPerGroup),
      );
    }

    return { lastNPerGroup, examReports };
  }

  // ══════════════════════════════════════════
  // PUBLIC DASHBOARD / REPORTING METHODS
  // ══════════════════════════════════════════

  async reportMaking(studentId: string, lastNPerGroup = 10) {
    const allTestData = await this.allTestResult(studentId);
    if (allTestData.length === 0) return null;

    const uniqueTestIdsSet = new Set<string>();
    for (const test of allTestData) {
      const pId =
        (test as any).paperMeta?.id || (test as any).paperId || test.id;
      uniqueTestIdsSet.add(String(pId));
    }

    return {
      studentId,
      totalUniqueMockTests: uniqueTestIdsSet.size,
      generatedAt: new Date(),
      ...this.buildReport(allTestData, lastNPerGroup),
    };
  }

  async lastTest(studentId: string) {
    const allTestData = await this.allTestResult(studentId);
    if (allTestData.length === 0) return null;

    return {
      studentId,
      last3: this.buildReport(allTestData, 3),
      last5: this.buildReport(allTestData, 5),
      last10: this.buildReport(allTestData, 10),
    };
  }

  async fullDashboard(studentId: string, lastNPerGroup = 10) {
    const allTestData = await this.allTestResult(studentId);

    if (allTestData.length === 0) {
      return {
        studentId,
        totalUniqueMockTests: 0,
        generatedAt: new Date(),
        report: null,
        lastNTests: { last3: null, last5: null, last10: null },
        allTests: [],
      };
    }

    const uniqueTestIdsSet = new Set<string>();
    for (const test of allTestData) {
      const pId =
        (test as any).paperMeta?.id || (test as any).paperId || test.id;
      uniqueTestIdsSet.add(String(pId));
    }

    const practiceAnalytics = await this.buildPracticeAnalytics(studentId);

    return {
      studentId,
      totalUniqueMockTests: uniqueTestIdsSet.size,
      generatedAt: new Date(),
      practiceAnalytics,
      report: this.buildReport(allTestData, lastNPerGroup),
      lastNTests: {
        last3: this.buildReport(allTestData, 3),
        last5: this.buildReport(allTestData, 5),
        last10: this.buildReport(allTestData, 10),
      },
      allTests: allTestData,
    };
  }

  // ══════════════════════════════════════════
  // PRACTICE ANALYTICS BALANCE Builders
  // ══════════════════════════════════════════
  
  async buildPracticeAnalytics(studentId: string) {
    const { chapterWisePractice } = await import("../repositories/chapterWisePractice.db");
    const { chapterWiseCacheService } = await import("./chapterWiseCacheService");

    const activeAttempts = await chapterWiseCacheService.getAllActiveAttempts(studentId);
    const dbAttempts = await chapterWisePractice.getAllPracticeAttemptsRaw(studentId);

    const mergedMap = new Map<string, any>();

    for (const record of dbAttempts) {
       mergedMap.set(record.questionId, {
          questionId: record.questionId,
          subject: record.question?.subjects?.name || "Unknown",
          type: record.question?.type || "Unknown",
          timeSpent: record.timeSpent || 0,
          isCorrect: record.isCorrect || false,
          status: record.questionStatus,
       });
    }

    for (const [qId, active] of Object.entries(activeAttempts)) {
       if (active.length === 0) continue;
       const latestActive = active[active.length - 1];
       const existing = mergedMap.get(qId);
       if (existing) {
         existing.timeSpent = latestActive.timeSpent || existing.timeSpent;
         existing.status = latestActive.status || existing.status;
         if (latestActive.isCorrect !== undefined) {
           existing.isCorrect = latestActive.isCorrect;
         }
         if (latestActive.marksObtained !== undefined) {
           existing.marks = latestActive.marksObtained;
         }
       }
    }

    let totalAttempted = 0;
    let totalCorrect = 0;
    let totalTimeSpent = 0;
    
    const subjectBalance: Record<string, any> = {
       Mathematics: { attempted: 0, correct: 0, timeSpent: 0 },
       Physics: { attempted: 0, correct: 0, timeSpent: 0 },
       Chemistry: { attempted: 0, correct: 0, timeSpent: 0 }
    };

    const questionBalance: Record<string, any> = {};

    for (const record of mergedMap.values()) {
        totalTimeSpent += record.timeSpent;
        
        const isAttempted = record.status === "answered" || record.isCorrect !== null;
        if (isAttempted) {
           totalAttempted++;
           if (record.isCorrect) totalCorrect++;
           
           if (subjectBalance[record.subject]) {
              subjectBalance[record.subject].attempted++;
              subjectBalance[record.subject].timeSpent += record.timeSpent;
              if (record.isCorrect) subjectBalance[record.subject].correct++;
           }

           if (!questionBalance[record.type]) {
              questionBalance[record.type] = { attempted: 0, correct: 0, timeSpent: 0 };
           }
           questionBalance[record.type].attempted++;
           questionBalance[record.type].timeSpent += record.timeSpent;
           if (record.isCorrect) questionBalance[record.type].correct++;
        }
    }

    const practiceAccuracy = totalAttempted > 0 ? parseFloat(((totalCorrect / totalAttempted) * 100).toFixed(4)) : 0;
    const avgTime = totalAttempted > 0 ? parseFloat((totalTimeSpent / totalAttempted).toFixed(4)) : 0;

    return {
       practiceAccuracy,
       avgTime,
       subjectWiseBalance: subjectBalance,
       questionWiseBalance: questionBalance,
       totalTimeSpent
    };
  }

  // ══════════════════════════════════════════
  // PUBLIC: chapterReport
  // ══════════════════════════════════════════

  async chapterReport(
    studentId: string,
    examFilter?: "JEE_MAIN" | "JEE_ADVANCED",
  ) {
    const [dbChapters, reddisData] = await Promise.all([
      analytics.chapterWiseAnalytics(studentId),
      dashboardCacheService.reddisTestData(studentId),
    ]);

    const chapterMap: Record<string, any> = {};

    for (const ch of dbChapters) {
      chapterMap[(ch as any).chapterId] = {
        chapterId: (ch as any).chapterId,
        practiceJeeMain: {
          attempts: (ch as any).practiceJeeMainAttempts,
          timeSpent: (ch as any).practiceJeeMainTimeSpent,
          marksEarned: (ch as any).practiceJeeMainMarksEarned,
          maxPossible: (ch as any).practiceJeeMainMaxPossible,
          correct: (ch as any).practiceJeeMainCorrect,
          wrong: (ch as any).practiceJeeMainWrong,
          partial: (ch as any).practiceJeeMainPartial,
          accuracy: this.calcAccuracy(
            (ch as any).practiceJeeMainCorrect,
            (ch as any).practiceJeeMainWrong,
          ),
          percentage: this.calcPercentage(
            (ch as any).practiceJeeMainMarksEarned,
            (ch as any).practiceJeeMainMaxPossible,
          ),
        },
        practiceJeeAdvanced: {
          attempts: (ch as any).practiceJeeAdvancedAttempts,
          timeSpent: (ch as any).practiceJeeAdvancedTimeSpent,
          marksEarned: (ch as any).practiceJeeAdvancedMarksEarned,
          maxPossible: (ch as any).practiceJeeAdvancedMaxPossible,
          correct: (ch as any).practiceJeeAdvancedCorrect,
          wrong: (ch as any).practiceJeeAdvancedWrong,
          partial: (ch as any).practiceJeeAdvancedPartial,
          accuracy: this.calcAccuracy(
            (ch as any).practiceJeeAdvancedCorrect,
            (ch as any).practiceJeeAdvancedWrong,
          ),
          percentage: this.calcPercentage(
            (ch as any).practiceJeeAdvancedMarksEarned,
            (ch as any).practiceJeeAdvancedMaxPossible,
          ),
        },
        testJeeMain: {
          attempts: (ch as any).testJeeMainAttempts,
          timeSpent: (ch as any).testJeeMainTimeSpent,
          marksEarned: (ch as any).testJeeMainMarksEarned,
          maxPossible: (ch as any).testJeeMainMaxPossible,
          correct: (ch as any).testJeeMainCorrect,
          wrong: (ch as any).testJeeMainWrong,
          partial: (ch as any).testJeeMainPartial,
          accuracy: this.calcAccuracy(
            (ch as any).testJeeMainCorrect,
            (ch as any).testJeeMainWrong,
          ),
          percentage: this.calcPercentage(
            (ch as any).testJeeMainMarksEarned,
            (ch as any).testJeeMainMaxPossible,
          ),
        },
        testJeeAdvanced: {
          attempts: (ch as any).testJeeAdvancedAttempts,
          timeSpent: (ch as any).testJeeAdvancedTimeSpent,
          marksEarned: (ch as any).testJeeAdvancedMarksEarned,
          maxPossible: (ch as any).testJeeAdvancedMaxPossible,
          correct: (ch as any).testJeeAdvancedCorrect,
          wrong: (ch as any).testJeeAdvancedWrong,
          partial: (ch as any).testJeeAdvancedPartial,
          accuracy: this.calcAccuracy(
            (ch as any).testJeeAdvancedCorrect,
            (ch as any).testJeeAdvancedWrong,
          ),
          percentage: this.calcPercentage(
            (ch as any).testJeeAdvancedMarksEarned,
            (ch as any).testJeeAdvancedMaxPossible,
          ),
        },
      };
    }

    for (const test of reddisData.testData ?? []) {
      for (const rCh of test.testData?.chapterWise ?? []) {
        const examName = test.testData.exam;
        const isJeeMain = examName === "JEE_MAIN";
        const isJeeAdv = examName === "JEE_ADVANCED";
        if (examFilter && examName !== examFilter) continue;

        if (!chapterMap[rCh.chapterId]) {
          chapterMap[rCh.chapterId] = {
            chapterId: rCh.chapterId,
            practiceJeeMain: {
              attempts: 0,
              timeSpent: 0,
              marksEarned: 0,
              maxPossible: 0,
              correct: 0,
              wrong: 0,
              partial: 0,
              accuracy: 0,
              percentage: 0,
            },
            practiceJeeAdvanced: {
              attempts: 0,
              timeSpent: 0,
              marksEarned: 0,
              maxPossible: 0,
              correct: 0,
              wrong: 0,
              partial: 0,
              accuracy: 0,
              percentage: 0,
            },
            testJeeMain: {
              attempts: 0,
              timeSpent: 0,
              marksEarned: 0,
              maxPossible: 0,
              correct: 0,
              wrong: 0,
              partial: 0,
              accuracy: 0,
              percentage: 0,
            },
            testJeeAdvanced: {
              attempts: 0,
              timeSpent: 0,
              marksEarned: 0,
              maxPossible: 0,
              correct: 0,
              wrong: 0,
              partial: 0,
              accuracy: 0,
              percentage: 0,
            },
          };
        }

        const section = isJeeMain
          ? chapterMap[rCh.chapterId].testJeeMain
          : isJeeAdv
            ? chapterMap[rCh.chapterId].testJeeAdvanced
            : null;

        if (section) {
          section.attempts += rCh.attempt ?? 0;
          section.timeSpent += rCh.timeTaken ?? 0;
          section.marksEarned += rCh.marks ?? 0;
          section.maxPossible += rCh.positiveMarks ?? 0;
          section.correct += rCh.correct ?? 0;
          section.wrong += rCh.wrong ?? 0;
          section.partial += rCh.partial ?? 0;
          section.accuracy = this.calcAccuracy(section.correct, section.wrong);
          section.percentage = this.calcPercentage(
            section.marksEarned,
            section.maxPossible,
          );
        }
      }
    }

    return {
      studentId,
      generatedAt: new Date(),
      examFilter: examFilter ?? "ALL",
      chapters: Object.values(chapterMap),
    };
  }

  async practiceReport(studentId: string) {
    const [
      overallAnalytics,
      subjectAnalytics,
      examAnalytics,
      questionTypeAnalytics,
      redisPracticeData,
      allSubjects,
    ] = await Promise.all([
      analytics.studentOverAllAnalytics(studentId),
      analytics.subjectAnanlytics(studentId),
      analytics.examWiseAnalytics(studentId),
      analytics.questionWiseAnalytics(studentId),
      dashboardCacheService.reddisPraticeWiseData(studentId),
      this.db.subjects.findMany({ select: { id: true, name: true } }),
    ]);

    const subjectIdToName: Record<string, string> = {};
    for (const s of allSubjects) subjectIdToName[s.id] = s.name;

    const redisQuestions: any[] = (redisPracticeData.praticeWiseData ?? [])
      .filter((q: any) => q?.questionData != null)
      .map((q: any) => q.questionData);

    const redisOverall = redisQuestions.reduce(
      function (acc, q) {
        acc.attempts += 1;
        acc.timeSpent += q.timeSpent ?? 0;
        acc.marksEarned += q.marks ?? 0;
        acc.maxPossible += q.positiveMarks ?? 0;
        return acc;
      },
      { attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0 },
    );

    const dbAttempts = overallAnalytics?.practiceAttempts ?? 0;
    const dbTime = overallAnalytics?.practiceTimeSpent ?? 0;
    const dbMarks = overallAnalytics?.practiceMarksEarned ?? 0;
    const dbMax = overallAnalytics?.practiceMaxPossible ?? 0;
    const totalAttempts = dbAttempts + redisOverall.attempts;
    const totalTime = dbTime + redisOverall.timeSpent;
    const totalMarks = dbMarks + redisOverall.marksEarned;
    const totalMax = dbMax + redisOverall.maxPossible;

    const overallReport = {
      totalAttempts,
      totalTimeSpent: totalTime,
      totalMarksEarned: totalMarks,
      totalMaxPossible: totalMax,
      accuracy: this.calcPercentage(totalMarks, totalMax),
      avgTimePerQuestion:
        totalAttempts > 0
          ? parseFloat((totalTime / totalAttempts).toFixed(4))
          : 0,
    };

    const subjectMap: Record<string, any> = {};
    for (const s of allSubjects) {
      subjectMap[s.id] = {
        subjectId: s.id,
        subjectName: s.name,
        attempts: 0,
        timeSpent: 0,
        marksEarned: 0,
        maxPossible: 0,
      };
    }
    for (const s of subjectAnalytics) {
      const sid = (s as any).subjectId;
      if (subjectMap[sid]) {
        subjectMap[sid].attempts += (s as any).practiceAttempts ?? 0;
        subjectMap[sid].timeSpent += (s as any).practiceTimeSpent ?? 0;
        subjectMap[sid].marksEarned += (s as any).practiceMarksEarned ?? 0;
        subjectMap[sid].maxPossible += (s as any).practiceMaxPossible ?? 0;
      }
    }
    for (const q of redisQuestions) {
      if (!q?.subjectId || !subjectMap[q.subjectId]) continue;
      subjectMap[q.subjectId].attempts += 1;
      subjectMap[q.subjectId].timeSpent += q.timeSpent ?? 0;
      subjectMap[q.subjectId].marksEarned += q.marks ?? 0;
      subjectMap[q.subjectId].maxPossible += q.positiveMarks ?? 0;
    }

    const _this = this;

    const subjectReport = Object.values(subjectMap).map(function (s: any) {
      return {
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        attempts: s.attempts,
        timeSpent: s.timeSpent,
        marksEarned: s.marksEarned,
        maxPossible: s.maxPossible,
        accuracy: _this.calcPercentage(s.marksEarned, s.maxPossible),
        avgTimePerQuestion:
          s.attempts > 0
            ? parseFloat((s.timeSpent / s.attempts).toFixed(4))
            : 0,
      };
    });

    const qtMap: Record<string, any> = {};
    for (const qt of KNOWN_QUESTION_TYPES) {
      qtMap[qt] = {
        questionType: qt,
        attempts: 0,
        timeSpent: 0,
        marksEarned: 0,
        maxPossible: 0,
      };
    }
    for (const qt of questionTypeAnalytics) {
      const type = (qt as any).questioType;
      if (!qtMap[type])
        qtMap[type] = {
          questionType: type,
          attempts: 0,
          timeSpent: 0,
          marksEarned: 0,
          maxPossible: 0,
        };
      qtMap[type].attempts += (qt as any).practiceAttempts ?? 0;
      qtMap[type].timeSpent += (qt as any).practiceTimeSpent ?? 0;
      qtMap[type].marksEarned += (qt as any).practiceMarksEarned ?? 0;
      qtMap[type].maxPossible += (qt as any).practiceMaxPossible ?? 0;
    }
    for (const q of redisQuestions) {
      if (!q?.type) continue;
      if (!qtMap[q.type])
        qtMap[q.type] = {
          questionType: q.type,
          attempts: 0,
          timeSpent: 0,
          marksEarned: 0,
          maxPossible: 0,
        };
      qtMap[q.type].attempts += 1;
      qtMap[q.type].timeSpent += q.timeSpent ?? 0;
      qtMap[q.type].marksEarned += q.marks ?? 0;
      qtMap[q.type].maxPossible += q.positiveMarks ?? 0;
    }

    const questionTypeReport = Object.values(qtMap).map(function (qt: any) {
      return {
        questionType: qt.questionType,
        attempts: qt.attempts,
        timeSpent: qt.timeSpent,
        marksEarned: qt.marksEarned,
        maxPossible: qt.maxPossible,
        accuracy: _this.calcPercentage(qt.marksEarned, qt.maxPossible),
        avgTimePerQuestion:
          qt.attempts > 0
            ? parseFloat((qt.timeSpent / qt.attempts).toFixed(4))
            : 0,
      };
    });

    const examMap: Record<string, any> = {};
    for (const e of examAnalytics) {
      examMap[(e as any).examName] = {
        examName: (e as any).examName,
        attempts: (e as any).practiceAttempts ?? 0,
        timeSpent: (e as any).practiceTimeSpent ?? 0,
        marksEarned: (e as any).practiceMarksEarned ?? 0,
        maxPossible: (e as any).practiceMaxPossible ?? 0,
      };
    }
    for (const q of redisQuestions) {
      if (!q?.examName) continue;
      if (!examMap[q.examName])
        examMap[q.examName] = {
          examName: q.examName,
          attempts: 0,
          timeSpent: 0,
          marksEarned: 0,
          maxPossible: 0,
        };
      examMap[q.examName].attempts += 1;
      examMap[q.examName].timeSpent += q.timeSpent ?? 0;
      examMap[q.examName].marksEarned += q.marks ?? 0;
      examMap[q.examName].maxPossible += q.positiveMarks ?? 0;
    }

    const examReport = Object.values(examMap).map(function (e: any) {
      return {
        examName: e.examName,
        attempts: e.attempts,
        timeSpent: e.timeSpent,
        marksEarned: e.marksEarned,
        maxPossible: e.maxPossible,
        accuracy: _this.calcPercentage(e.marksEarned, e.maxPossible),
        avgTimePerQuestion:
          e.attempts > 0
            ? parseFloat((e.timeSpent / e.attempts).toFixed(4))
            : 0,
      };
    });

    return {
      studentId,
      generatedAt: new Date(),
      overall: overallReport,
      subjects: subjectReport,
      questionTypes: questionTypeReport,
      exams: examReport,
    };
  }

  // ── UPDATED STUDENT SNAPSHOT LOGIC ───────────────────────────────────────────
  async studentSnapshot(studentId: string) {
    const [allTestData, practiceData, attemptedQuestions, subjectTotals] =
      await Promise.all([
        this.allTestResult(studentId),
        this.practiceReport(studentId),
        questionBitmapRegistry.getAttemptedQuestionIds(studentId),
        subject.readingAllSubjects(),
      ]);

    const subjectWiseUnique: Record<string, any> = {
      Mathematics: {
        uniqueAttempted: 0,
        totalQuestions:
          (subjectTotals as any)["Mathematics"]?.totalQuestion ?? 0,
      },
      Physics: {
        uniqueAttempted: 0,
        totalQuestions: (subjectTotals as any)["Physics"]?.totalQuestion ?? 0,
      },
      Chemistry: {
        uniqueAttempted: 0,
        totalQuestions: (subjectTotals as any)["Chemistry"]?.totalQuestion ?? 0,
      },
    };

    if (attemptedQuestions.questionIds.length > 0) {
      const questionSubjects = await this.db.questions.findMany({
        where: { id: { in: attemptedQuestions.questionIds } },
        select: { subjects: { select: { name: true } } },
      });
      for (const q of questionSubjects) {
        const name = q.subjects.name;
        if (subjectWiseUnique[name]) subjectWiseUnique[name].uniqueAttempted++;
      }
    }

    const last5Raw = allTestData.slice(0, 5);
    const paperDetailsMap: Record<string, any> = {};

    if (last5Raw.length > 0) {
      const tsWithPapers = await this.db.testStatus.findMany({
        where: { id: { in: last5Raw.map((t: any) => t.id) } },
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
              exam: { select: { name: true } },
            },
          },
        },
      });
      for (const ts of tsWithPapers) {
        paperDetailsMap[ts.id] = ts.papers;
      }
    }

    const _this = this;

    const last5Tests = last5Raw.map(function (t: any) {
      // Inject paper details into the mapped object so getTime() works properly
      if (paperDetailsMap[t.id]) {
        t.totalDuration = paperDetailsMap[t.id].totalDuration;
      }

      const finalMarks = _this.getMarks(t);
      const finalMaxMarks = _this.getMaxMarks(t);
      const finalCorrect = _this.getCorrect(t);
      const finalWrong = _this.getWrong(t);

      return {
        testId: t.id,
        source: t.source,
        createdAt: t.created_at,
        paperDetails: paperDetailsMap[t.id] ?? null,
        overall: {
          marks: finalMarks,
          maxMarks: finalMaxMarks,
          correct: finalCorrect,
          wrong: finalWrong,
          accuracy: _this.calcAccuracy(finalCorrect, finalWrong),
          percentage: _this.calcPercentage(finalMarks, finalMaxMarks),
          timeTaken: _this.getTime(t), // Will now accurately use DB totalDuration
        },
        subjects: {
          math: _this.buildSubjectBlock(t, "math", "Mathematics"),
          physics: _this.buildSubjectBlock(t, "physics", "Physics"),
          chemistry: _this.buildSubjectBlock(t, "chemistry", "Chemistry"),
        },
        questionWise: _this.buildQuestionWiseBlock(t),
      };
    });

    let totalMarks = 0,
      totalMaxMarks = 0,
      totalTime = 0,
      totalCorrect = 0,
      totalWrong = 0;
    const subAgg: Record<
      string,
      { marks: number; maxMarks: number; correct: number; wrong: number }
    > = {
      Mathematics: { marks: 0, maxMarks: 0, correct: 0, wrong: 0 },
      Physics: { marks: 0, maxMarks: 0, correct: 0, wrong: 0 },
      Chemistry: { marks: 0, maxMarks: 0, correct: 0, wrong: 0 },
    };
    const qtAgg: Record<
      string,
      { marks: number; maxMarks: number; correct: number; wrong: number }
    > = {};

    for (const test of last5Tests) {
      totalMarks += test.overall.marks;
      totalMaxMarks += test.overall.maxMarks;
      totalTime += test.overall.timeTaken;
      totalCorrect += test.overall.correct;
      totalWrong += test.overall.wrong;

      for (const qw of test.questionWise) {
        if (!qtAgg[qw.questionType])
          qtAgg[qw.questionType] = {
            marks: 0,
            maxMarks: 0,
            correct: 0,
            wrong: 0,
          };
        qtAgg[qw.questionType].marks += qw.marks;
        qtAgg[qw.questionType].correct += qw.correct;
        qtAgg[qw.questionType].wrong += qw.wrong;
      }
      for (const { key, name } of KNOWN_SUBJECTS) {
        const s = test.subjects[key as "math" | "physics" | "chemistry"];
        subAgg[name].marks += s.marks;
        subAgg[name].correct += s.correct;
        subAgg[name].wrong += s.wrong;
      }
    }

    let last5Aggregate = null;
    if (last5Tests.length > 0) {
      last5Aggregate = {
        testsIncluded: last5Tests.length,
        totalMarks: totalMarks,
        totalMaxMarks: totalMaxMarks,
        overallAccuracy: this.calcAccuracy(totalCorrect, totalWrong),
        overallPercentage: this.calcPercentage(totalMarks, totalMaxMarks),
        avgTimeTaken: parseFloat((totalTime / last5Tests.length).toFixed(4)),
        subjects: KNOWN_SUBJECTS.map(function (item) {
          return {
            subjectName: item.name,
            totalMarks: subAgg[item.name].marks,
            totalCorrect: subAgg[item.name].correct,
            totalWrong: subAgg[item.name].wrong,
            accuracy: _this.calcAccuracy(
              subAgg[item.name].correct,
              subAgg[item.name].wrong,
            ),
          };
        }),
        questionWise: Object.entries(qtAgg).map(function ([qt, d]) {
          return {
            questionType: qt,
            totalMarks: d.marks,
            totalCorrect: d.correct,
            totalWrong: d.wrong,
            accuracy: _this.calcAccuracy(d.correct, d.wrong),
          };
        }),
      };
    }

    const uniqueTestIdsSet = new Set<string>();
    for (const test of allTestData) {
      const pId =
        (test as any).paperMeta?.id || (test as any).paperId || test.id;
      uniqueTestIdsSet.add(String(pId));
    }

    return {
      studentId,
      totalUniqueMockTests: uniqueTestIdsSet.size,
      generatedAt: new Date(),
      tests: { last5: last5Tests, last5Aggregate },
      practice: practiceData,
      uniqueQuestionsAttempted: {
        total: attemptedQuestions.totalUnique,
        subjectWise: subjectWiseUnique,
      },
    };
  }
}

export const reportService = new ReportService(database);
