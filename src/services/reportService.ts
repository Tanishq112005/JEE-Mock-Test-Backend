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
  // HELPERS
  // ══════════════════════════════════════════

  private calcAccuracy(marks: number, maxMarks: number): number {
    return maxMarks > 0 ? parseFloat(((marks / maxMarks) * 100).toFixed(2)) : 0;
  }

  private avgOf(arr: number[]): number {
    return arr.length > 0
      ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2))
      : 0;
  }

  // ══════════════════════════════════════════
  // allTestResult
  // DB is primary source for completed tests.
  // Redis only holds unsynced in-flight tests.
  // ══════════════════════════════════════════

  async allTestResult(studentId: string) {
    const [reddisTestData, testWiseData] = await Promise.all([
      dashboardCacheService.reddisTestData(studentId),
      analytics.testWiseData(studentId),
    ]);

    // ── Redis tests ────────────────────────────────────────────────────────
    const reddisArray = (reddisTestData.testData ?? []).map((item: any) => ({
      id: item.testId,
      paperId: item.testData?.paperId ?? null,
      exam: item.testData?.exam,
      created_at: new Date(item.created_at),
      source: "reddis" as const,
      math: item.testData?.math ?? null,
      physics: item.testData?.physics ?? null,
      chemistry: item.testData?.chemistry ?? null,
      overall: item.testData?.overall ?? null, // Kept as 'overall' from Redis
      questionWise: item.testData?.questionTypes ?? {},
      chapterWise: item.testData?.chapterWise ?? [],
    }));

    // ── DB tests ───────────────────────────────────────────────────────────
    const testWiseArray = testWiseData.map((item: any) => ({
      id: item.testStatusId,
      created_at: new Date(item.created_at),
      source: "testWise" as const,
      exam: item.exam,
      paperMeta: item.paperMeta,
      math: item.math,
      physics: item.physics,
      chemistry: item.chemistry,
      overAllAnalytics: item.overAllAnalytics, // Kept as 'overAllAnalytics' from DB
      questionWise: item.questionTypes ?? {},
      chapterWise: [],
    }));

    // ── Dedup: DB wins if same testId exists in both ────────────────────────
    const dbIds = new Set(testWiseArray.map((t) => t.id));
    const filteredReddis = reddisArray.filter((t) => !dbIds.has(t.id));

    const combined = [...filteredReddis, ...testWiseArray].sort(
      (a, b) => b.created_at.getTime() - a.created_at.getTime(),
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
    const maxMarks = valid.map((t) => t[subject].maxMarks ?? 0);
    const correct = valid.map((t) => t[subject].correct ?? 0);
    const wrong = valid.map((t) => t[subject].wrong ?? 0);
    const time = valid.map((t) => t[subject].timeTaken ?? 0);
    const totalQ = valid.map((t) => t[subject].totalQuestions ?? 0);

    return {
      avgScore: this.avgOf(marks),
      avgMaxScore: this.avgOf(maxMarks),
      avgAccuracy: this.avgOf(
        valid.map((_, i) => this.calcAccuracy(marks[i], maxMarks[i])),
      ),
      avgCorrect: this.avgOf(correct),
      avgWrong: this.avgOf(wrong),
      avgTimeTaken: this.avgOf(time),
      avgTimePerQuestion: this.avgOf(
        valid.map((_, i) =>
          totalQ[i] > 0 ? parseFloat((time[i] / totalQ[i]).toFixed(2)) : 0,
        ),
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
        Object.keys(t.questionWise).forEach((k) => allQTypes.add(k));
      }
    }

    const result: Record<string, any> = {};

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

      result[qType] = {
        avgScore: this.avgOf(marks),
        avgAccuracy: this.avgOf(
          relevant.map((_, i) => this.calcAccuracy(marks[i], maxMarks[i])),
        ),
        avgCorrect: this.avgOf(
          relevant.map((t) => t.questionWise[qType].correct ?? 0),
        ),
        avgWrong: this.avgOf(
          relevant.map((t) => t.questionWise[qType].wrong ?? 0),
        ),
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

    // ✅ Robust fallback getters
    const getMarks = (t: any) => {
      const oa = t.overAllAnalytics ?? t.overall ?? {};
      if (oa.totalScore != null) return oa.totalScore;
      if (oa.marks != null) return oa.marks;
      return (
        (t.math?.marks ?? 0) +
        (t.physics?.marks ?? 0) +
        (t.chemistry?.marks ?? 0)
      );
    };
    const getMaxMarks = (t: any) => {
      const oa = t.overAllAnalytics ?? t.overall ?? {};
      if (oa.maxScore != null) return oa.maxScore;
      if (oa.maxMarks != null) return oa.maxMarks;
      return (
        (t.math?.maxMarks ?? 0) +
        (t.physics?.maxMarks ?? 0) +
        (t.chemistry?.maxMarks ?? 0)
      );
    };
    const getTime = (t: any) => {
      const oa = t.overAllAnalytics ?? t.overall ?? {};
      return oa.timeTaken ?? oa.totalTimeTaken ?? 0;
    };
    const getQ = (t: any) => {
      const oa = t.overAllAnalytics ?? t.overall ?? {};
      return oa.totalQuestions ?? 0;
    };

    const latestAcc = this.calcAccuracy(getMarks(latest), getMaxMarks(latest));
    const prevAcc = this.avgOf(
      previous.map((t) => this.calcAccuracy(getMarks(t), getMaxMarks(t))),
    );
    const latestTime =
      getQ(latest) > 0
        ? parseFloat((getTime(latest) / getQ(latest)).toFixed(2))
        : 0;
    const prevTime = this.avgOf(
      previous.map((t) => {
        const q = getQ(t);
        return q > 0 ? parseFloat((getTime(t) / q).toFixed(2)) : 0;
      }),
    );

    const subjectImprovement = (s: "math" | "physics" | "chemistry") => {
      const lS = latest[s];
      const prevS = previous.filter((t) => t[s] != null);
      if (!lS || prevS.length === 0) return null;

      return {
        accuracyChange: parseFloat(
          (
            this.calcAccuracy(lS.marks ?? 0, lS.maxMarks ?? 0) -
            this.avgOf(
              prevS.map((t) =>
                this.calcAccuracy(t[s].marks ?? 0, t[s].maxMarks ?? 0),
              ),
            )
          ).toFixed(2),
        ),
        scoreChange: parseFloat(
          (
            (lS.marks ?? 0) - this.avgOf(prevS.map((t) => t[s].marks ?? 0))
          ).toFixed(2),
        ),
        wrongChange: parseFloat(
          (
            (lS.wrong ?? 0) - this.avgOf(prevS.map((t) => t[s].wrong ?? 0))
          ).toFixed(2),
        ),
      };
    };

    return {
      overall: {
        accuracyChange: parseFloat((latestAcc - prevAcc).toFixed(2)),
        scoreChange: parseFloat(
          (getMarks(latest) - this.avgOf(previous.map(getMarks))).toFixed(2),
        ),
        avgTimePerQuestionChange: parseFloat(
          (latestTime - prevTime).toFixed(2),
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

    // ✅ Robust fallback getters
    const getMarks = (t: any) => {
      const oa = t.overAllAnalytics ?? t.overall ?? {};
      if (oa.totalScore != null) return oa.totalScore;
      if (oa.marks != null) return oa.marks;
      return (
        (t.math?.marks ?? 0) +
        (t.physics?.marks ?? 0) +
        (t.chemistry?.marks ?? 0)
      );
    };
    const getMaxMarks = (t: any) => {
      const oa = t.overAllAnalytics ?? t.overall ?? {};
      if (oa.maxScore != null) return oa.maxScore;
      if (oa.maxMarks != null) return oa.maxMarks;
      return (
        (t.math?.maxMarks ?? 0) +
        (t.physics?.maxMarks ?? 0) +
        (t.chemistry?.maxMarks ?? 0)
      );
    };
    const getTime = (t: any) => {
      const oa = t.overAllAnalytics ?? t.overall ?? {};
      return oa.timeTaken ?? oa.totalTimeTaken ?? 0;
    };
    const getQ = (t: any) => {
      const oa = t.overAllAnalytics ?? t.overall ?? {};
      return oa.totalQuestions ?? 0;
    };

    const uniquePapers = new Set<string>();
    for (const t of tests) {
      const pId = t.paperMeta?.id || t.paperId || t.id;
      uniquePapers.add(String(pId));
    }

    return {
      totalTests: uniquePapers.size,
      totalAttempts: tests.length,
      overall: {
        avgScore: this.avgOf(tests.map(getMarks)),
        avgAccuracy: this.avgOf(
          tests.map((t) => this.calcAccuracy(getMarks(t), getMaxMarks(t))),
        ),
        avgTimePerQuestion: this.avgOf(
          tests.map((t) => {
            const q = getQ(t);
            return q > 0 ? parseFloat((getTime(t) / q).toFixed(2)) : 0;
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
      testMarksList: tests.map((t) => ({
        testId: t.id,
        examName: t.exam,
        createdAt: t.created_at,
        marks: getMarks(t),
        maxMarks: getMaxMarks(t),
        accuracy: this.calcAccuracy(getMarks(t), getMaxMarks(t)),
      })),
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
  // PUBLIC: reportMaking
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

  // ══════════════════════════════════════════
  // PUBLIC: lastTest
  // ══════════════════════════════════════════

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

  // ══════════════════════════════════════════
  // PUBLIC: fullDashboard
  // ══════════════════════════════════════════

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

    return {
      studentId,
      totalUniqueMockTests: uniqueTestIdsSet.size,
      generatedAt: new Date(),
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

    const calcAcc = (earned: number, max: number) =>
      max > 0 ? parseFloat(((earned / max) * 100).toFixed(2)) : 0;

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
          accuracy: calcAcc(
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
          accuracy: calcAcc(
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
          accuracy: calcAcc(
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
          accuracy: calcAcc(
            (ch as any).testJeeAdvancedMarksEarned,
            (ch as any).testJeeAdvancedMaxPossible,
          ),
        },
      };
    }

    // Merge Redis chapter data for unanalyzed tests
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
          section.accuracy = calcAcc(section.marksEarned, section.maxPossible);
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

  // ══════════════════════════════════════════
  // PUBLIC: practiceReport
  // ══════════════════════════════════════════

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

    const calcAcc = (earned: number, max: number) =>
      max > 0 ? parseFloat(((earned / max) * 100).toFixed(2)) : 0;

    const subjectIdToName: Record<string, string> = {};
    for (const s of allSubjects) subjectIdToName[s.id] = s.name;

    const redisQuestions: any[] = (redisPracticeData.praticeWiseData ?? [])
      .filter((q: any) => q?.questionData != null)
      .map((q: any) => q.questionData);

    // Overall
    const redisOverall = redisQuestions.reduce(
      (acc, q) => {
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
      accuracy: calcAcc(totalMarks, totalMax),
      avgTimePerQuestion:
        totalAttempts > 0
          ? parseFloat((totalTime / totalAttempts).toFixed(2))
          : 0,
    };

    // Subjects
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

    const subjectReport = Object.values(subjectMap).map((s: any) => ({
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      attempts: s.attempts,
      timeSpent: s.timeSpent,
      marksEarned: s.marksEarned,
      maxPossible: s.maxPossible,
      accuracy: calcAcc(s.marksEarned, s.maxPossible),
      avgTimePerQuestion:
        s.attempts > 0 ? parseFloat((s.timeSpent / s.attempts).toFixed(2)) : 0,
    }));

    // Question types
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

    const questionTypeReport = Object.values(qtMap).map((qt: any) => ({
      questionType: qt.questionType,
      attempts: qt.attempts,
      timeSpent: qt.timeSpent,
      marksEarned: qt.marksEarned,
      maxPossible: qt.maxPossible,
      accuracy: calcAcc(qt.marksEarned, qt.maxPossible),
      avgTimePerQuestion:
        qt.attempts > 0
          ? parseFloat((qt.timeSpent / qt.attempts).toFixed(2))
          : 0,
    }));

    // Exams
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

    const examReport = Object.values(examMap).map((e: any) => ({
      examName: e.examName,
      attempts: e.attempts,
      timeSpent: e.timeSpent,
      marksEarned: e.marksEarned,
      maxPossible: e.maxPossible,
      accuracy: calcAcc(e.marksEarned, e.maxPossible),
      avgTimePerQuestion:
        e.attempts > 0 ? parseFloat((e.timeSpent / e.attempts).toFixed(2)) : 0,
    }));

    return {
      studentId,
      generatedAt: new Date(),
      overall: overallReport,
      subjects: subjectReport,
      questionTypes: questionTypeReport,
      exams: examReport,
    };
  }

  // ══════════════════════════════════════════
  // PUBLIC: studentSnapshot
  // ══════════════════════════════════════════

  async studentSnapshot(studentId: string) {
    const [allTestData, practiceData, attemptedQuestions, subjectTotals] =
      await Promise.all([
        this.allTestResult(studentId),
        this.practiceReport(studentId),
        questionBitmapRegistry.getAttemptedQuestionIds(studentId),
        subject.readingAllSubjects(),
      ]);

    const calcAcc = (earned: number, max: number) =>
      max > 0 ? parseFloat(((earned / max) * 100).toFixed(2)) : 0;

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

    const buildSubjectBlock = (
      t: any,
      key: "math" | "physics" | "chemistry",
      name: string,
    ) => {
      const s = t[key];
      if (!s)
        return {
          subjectName: name,
          marks: 0,
          correct: 0,
          wrong: 0,
          timeTaken: 0,
          totalQuestions: 0,
          accuracy: 0,
        };
      return {
        subjectName: name,
        marks: s.marks ?? 0,
        correct: s.correct ?? 0,
        wrong: s.wrong ?? 0,
        timeTaken: s.timeTaken ?? 0,
        totalQuestions: s.totalQuestions ?? 0,
        accuracy: calcAcc(s.marks ?? 0, s.maxMarks ?? 0),
      };
    };

    const buildQuestionWise = (t: any) => {
      const qtBlock: Record<string, any> = {};
      for (const qt of KNOWN_QUESTION_TYPES) {
        qtBlock[qt] = {
          questionType: qt,
          marks: 0,
          correct: 0,
          wrong: 0,
          accuracy: 0,
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
            accuracy: calcAcc(qtData?.marks ?? 0, qtData?.maxMarks ?? 0),
          };
        }
      }
      return Object.values(qtBlock);
    };

    // ✅ Robust fallback getters applied here!
    const getMarks = (t: any) => {
      const oa = t.overAllAnalytics ?? t.overall ?? {};
      if (oa.totalScore != null) return oa.totalScore;
      if (oa.marks != null) return oa.marks;
      return (
        (t.math?.marks ?? 0) +
        (t.physics?.marks ?? 0) +
        (t.chemistry?.marks ?? 0)
      );
    };
    const getMaxMarks = (t: any) => {
      const oa = t.overAllAnalytics ?? t.overall ?? {};
      if (oa.maxScore != null) return oa.maxScore;
      if (oa.maxMarks != null) return oa.maxMarks;
      return (
        (t.math?.maxMarks ?? 0) +
        (t.physics?.maxMarks ?? 0) +
        (t.chemistry?.maxMarks ?? 0)
      );
    };
    const getTime = (t: any) => {
      const oa = t.overAllAnalytics ?? t.overall ?? {};
      return oa.timeTaken ?? oa.totalTimeTaken ?? 0;
    };

    const last5Tests = last5Raw.map((t: any) => {
      const finalMarks = getMarks(t);
      const finalMaxMarks = getMaxMarks(t);

      return {
        testId: t.id,
        source: t.source,
        createdAt: t.created_at,
        paperDetails: paperDetailsMap[t.id] ?? null,
        overall: {
          marks: finalMarks,
          maxMarks: finalMaxMarks,
          accuracy: calcAcc(finalMarks, finalMaxMarks),
          timeTaken: getTime(t),
        },
        subjects: {
          math: buildSubjectBlock(t, "math", "Mathematics"),
          physics: buildSubjectBlock(t, "physics", "Physics"),
          chemistry: buildSubjectBlock(t, "chemistry", "Chemistry"),
        },
        questionWise: buildQuestionWise(t),
      };
    });

    const last5Aggregate = (() => {
      if (last5Tests.length === 0) return null;
      let totalMarks = 0,
        totalMaxMarks = 0,
        totalTime = 0;
      const subAgg: Record<
        string,
        { marks: number; correct: number; wrong: number }
      > = {
        Mathematics: { marks: 0, correct: 0, wrong: 0 },
        Physics: { marks: 0, correct: 0, wrong: 0 },
        Chemistry: { marks: 0, correct: 0, wrong: 0 },
      };
      const qtAgg: Record<
        string,
        { marks: number; correct: number; wrong: number }
      > = {};

      for (const test of last5Tests) {
        totalMarks += test.overall.marks;
        totalMaxMarks += test.overall.maxMarks;
        totalTime += test.overall.timeTaken;
        for (const qw of test.questionWise) {
          if (!qtAgg[qw.questionType])
            qtAgg[qw.questionType] = { marks: 0, correct: 0, wrong: 0 };
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

      return {
        testsIncluded: last5Tests.length,
        totalMarks,
        totalMaxMarks,
        overallAccuracy: calcAcc(totalMarks, totalMaxMarks),
        avgTimeTaken: parseFloat((totalTime / last5Tests.length).toFixed(2)),
        subjects: KNOWN_SUBJECTS.map(({ name }) => ({
          subjectName: name,
          totalMarks: subAgg[name].marks,
          totalCorrect: subAgg[name].correct,
          totalWrong: subAgg[name].wrong,
          accuracy: calcAcc(
            subAgg[name].marks,
            subAgg[name].marks + subAgg[name].wrong,
          ),
        })),
        questionWise: Object.entries(qtAgg).map(([qt, d]) => ({
          questionType: qt,
          totalMarks: d.marks,
          totalCorrect: d.correct,
          totalWrong: d.wrong,
          accuracy: calcAcc(d.marks, d.marks + d.wrong),
        })),
      };
    })();
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
