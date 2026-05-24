import { PrismaClient } from "@prisma/client";
import { database } from "../lib/database";
import { analytics } from "../repositories/analytics.db";
import { subject } from "../repositories/subject.db";
import { dashboardCacheService } from "./dashboardCacheService";
import { questionBitmapRegistry } from "./uniqueCountService";

// ── Actual Prisma questionType enum values ───────────
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

// ══════════════════════════════════════════
// 1. MATH UTILITY
// ══════════════════════════════════════════
class MathUtil {
  static calcAccuracy(correct: number, wrong: number): number {
    const attempted = correct + wrong;
    if (attempted > 0) return parseFloat(((correct / attempted) * 100).toFixed(4));
    return 0;
  }

  static calcPercentage(marks: number, maxMarks: number): number {
    if (maxMarks > 0) return parseFloat(((marks / maxMarks) * 100).toFixed(4));
    return 0;
  }

  static avgOf(arr: number[]): number {
    if (arr.length > 0) {
      const sum = arr.reduce((a, b) => a + b, 0);
      return parseFloat((sum / arr.length).toFixed(4));
    }
    return 0;
  }
}

// ══════════════════════════════════════════
// 2. EXAM SPLITTER UTILITY
// ══════════════════════════════════════════
class ExamSplitter {
  static partition<T>(items: T[], getExamFn: (item: T) => string | undefined) {
    return {
      overall: items,
      jeeMain: items.filter((i) => getExamFn(i) === "JEE_MAIN"),
      jeeAdvanced: items.filter((i) => getExamFn(i) === "JEE_ADVANCED"),
    };
  }

  static combineStats(a: any, b: any) {
    return {
      attempts: (a?.attempts ?? 0) + (b?.attempts ?? 0),
      timeSpent: (a?.timeSpent ?? 0) + (b?.timeSpent ?? 0),
      marksEarned: (a?.marksEarned ?? 0) + (b?.marksEarned ?? 0),
      maxPossible: (a?.maxPossible ?? 0) + (b?.maxPossible ?? 0),
      correct: (a?.correct ?? 0) + (b?.correct ?? 0),
      wrong: (a?.wrong ?? 0) + (b?.wrong ?? 0),
      partial: (a?.partial ?? 0) + (b?.partial ?? 0),
    };
  }

  static finalizeStats(stats: any) {
    return {
      ...stats,
      accuracy: MathUtil.calcAccuracy(stats.correct ?? 0, stats.wrong ?? 0),
      percentage: MathUtil.calcPercentage(stats.marksEarned ?? 0, stats.maxPossible ?? 0),
    };
  }
}

// ══════════════════════════════════════════
// 3. TEST METRICS EXTRACTOR
// ══════════════════════════════════════════
class TestMetricsExtractor {
  static getMarks(t: any): number {
    const oa = t.overAllAnalytics ?? t.overall ?? {};
    if (oa.totalScore != null) return oa.totalScore;
    if (oa.marks != null) return oa.marks;
    return (t.math?.marks ?? 0) + (t.physics?.marks ?? 0) + (t.chemistry?.marks ?? 0);
  }

  static getMaxMarks(t: any): number {
    const oa = t.overAllAnalytics ?? t.overall ?? {};
    if (oa.maxScore != null) return oa.maxScore;
    if (oa.maxMarks != null) return oa.maxMarks;
    if (oa.totalMarks != null) return oa.totalMarks;
    return (
      (t.math?.maxMarks ?? t.math?.totalMarks ?? t.math?.maxScore ?? 0) +
      (t.physics?.maxMarks ?? t.physics?.totalMarks ?? t.physics?.maxScore ?? 0) +
      (t.chemistry?.maxMarks ?? t.chemistry?.totalMarks ?? t.chemistry?.maxScore ?? 0)
    );
  }

  static getCorrect(t: any): number {
    const oa = t.overAllAnalytics ?? t.overall ?? {};
    if (oa.correct != null) return oa.correct;
    return (t.math?.correct ?? 0) + (t.physics?.correct ?? 0) + (t.chemistry?.correct ?? 0);
  }

  static getWrong(t: any): number {
    const oa = t.overAllAnalytics ?? t.overall ?? {};
    if (oa.wrong != null) return oa.wrong;
    return (t.math?.wrong ?? 0) + (t.physics?.wrong ?? 0) + (t.chemistry?.wrong ?? 0);
  }

  static getTime(t: any): number {
    if (t.timeLeft != null && t.totalDuration != null) {
      let durationInSeconds = t.totalDuration;
      if (durationInSeconds < 1000) durationInSeconds *= 60;
      return Math.max(0, durationInSeconds - t.timeLeft);
    }
    const oa = t.overAllAnalytics ?? t.overall ?? {};
    if (oa.timeTaken != null) return oa.timeTaken;
    if (oa.totalTimeTaken != null) return oa.totalTimeTaken;
    if (oa.timeSpent != null) return oa.timeSpent;
    if (t.timeTaken != null) return t.timeTaken;
    return (t.math?.timeTaken ?? t.math?.timeSpent ?? 0) + (t.physics?.timeTaken ?? t.physics?.timeSpent ?? 0) + (t.chemistry?.timeTaken ?? t.chemistry?.timeSpent ?? 0);
  }

  static getQ(t: any): number {
    const oa = t.overAllAnalytics ?? t.overall ?? {};
    return oa.totalQuestions ?? 0;
  }
}

// ══════════════════════════════════════════
// 4. TEST DATA FETCHING SERVICE
// ══════════════════════════════════════════
class TestResultService {
  async fetchAll(studentId: string) {
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
      // DELIBERATELY REMOVED chapterWise TO PREVENT PAYLOAD BLOAT
      timeLeft: item.testData?.timeLeft,
      totalDuration: item.testData?.totalDuration,
    }));

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
      // DELIBERATELY REMOVED chapterWise TO PREVENT PAYLOAD BLOAT
      timeLeft: item.timeLeft,
      totalDuration: item.paperMeta?.totalDuration || item.paperMeta?.duration,
    }));

    const dbIds = new Set(testWiseArray.map((t) => t.id));
    const filteredReddis = reddisArray.filter((t) => !dbIds.has(t.id));

    return [...filteredReddis, ...testWiseArray].sort(
      (a, b) => b.created_at.getTime() - a.created_at.getTime()
    );
  }
}

// ══════════════════════════════════════════
// 5. MOCK TEST ANALYTICS BUILDER
// ══════════════════════════════════════════
class MockTestAnalyticsBuilder {
  
  // Creates the 3, 5, and ALL test summaries 
  buildScopeReports(tests: any[]) {
    return {
      last3: this.buildGroupAnalytics(tests.slice(0, 3)),
      last5: this.buildGroupAnalytics(tests.slice(0, 5)),
      all: this.buildGroupAnalytics(tests)
    };
  }

  private buildGroupAnalytics(tests: any[]) {
    if (tests.length === 0) return null;
    const uniquePapers = new Set<string>();
    for (const t of tests) uniquePapers.add(String(t.paperMeta?.id || t.paperId || t.id));

    return {
      totalTests: uniquePapers.size,
      totalAttempts: tests.length,
      overall: {
        avgScore: MathUtil.avgOf(tests.map((t) => TestMetricsExtractor.getMarks(t))),
        avgPercentage: MathUtil.avgOf(tests.map((t) => MathUtil.calcPercentage(TestMetricsExtractor.getMarks(t), TestMetricsExtractor.getMaxMarks(t)))),
        avgAccuracy: MathUtil.avgOf(tests.map((t) => MathUtil.calcAccuracy(TestMetricsExtractor.getCorrect(t), TestMetricsExtractor.getWrong(t)))),
        avgTimePerQuestion: MathUtil.avgOf(tests.map((t) => {
          const q = TestMetricsExtractor.getQ(t);
          return q > 0 ? parseFloat((TestMetricsExtractor.getTime(t) / q).toFixed(4)) : 0;
        })),
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
        marks: TestMetricsExtractor.getMarks(t),
        maxMarks: TestMetricsExtractor.getMaxMarks(t),
        accuracy: MathUtil.calcAccuracy(TestMetricsExtractor.getCorrect(t), TestMetricsExtractor.getWrong(t)),
        percentage: MathUtil.calcPercentage(TestMetricsExtractor.getMarks(t), TestMetricsExtractor.getMaxMarks(t)),
      })),
    };
  }

  private buildSubjectAnalytics(tests: any[], subject: "math" | "physics" | "chemistry") {
    const valid = tests.filter((t) => t[subject] != null);
    if (valid.length === 0) return null;

    const marks = valid.map((t) => t[subject].marks ?? 0);
    const maxMarks = valid.map((t) => t[subject].maxMarks ?? t[subject].totalMarks ?? t[subject].maxScore ?? 0);
    const correct = valid.map((t) => t[subject].correct ?? 0);
    const wrong = valid.map((t) => t[subject].wrong ?? 0);
    const time = valid.map((t) => t[subject].timeTaken ?? 0);
    const totalQ = valid.map((t) => t[subject].totalQuestions ?? 0);

    return {
      avgScore: MathUtil.avgOf(marks),
      avgMaxScore: MathUtil.avgOf(maxMarks),
      avgAccuracy: MathUtil.avgOf(valid.map((_, i) => MathUtil.calcAccuracy(correct[i], wrong[i]))),
      avgPercentage: MathUtil.avgOf(valid.map((_, i) => MathUtil.calcPercentage(marks[i], maxMarks[i]))),
      avgCorrect: MathUtil.avgOf(correct),
      avgWrong: MathUtil.avgOf(wrong),
      avgTimeTaken: MathUtil.avgOf(time),
      avgTimePerQuestion: MathUtil.avgOf(valid.map((_, i) => totalQ[i] > 0 ? parseFloat((time[i] / totalQ[i]).toFixed(4)) : 0)),
    };
  }

  private buildQuestionTypes(tests: any[]) {
    const allQTypes = new Set<string>(KNOWN_QUESTION_TYPES);
    for (const t of tests) if (t.questionWise) Object.keys(t.questionWise).forEach((k) => allQTypes.add(k));
    const result: Record<string, any> = {};
    for (const qType of allQTypes) {
      const relevant = tests.filter((t) => t.questionWise?.[qType] != null);
      if (relevant.length === 0) {
        result[qType] = { avgScore: 0, avgAccuracy: 0, avgCorrect: 0, avgWrong: 0 };
        continue;
      }
      const marks = relevant.map((t) => t.questionWise[qType].marks ?? 0);
      const maxMarks = relevant.map((t) => t.questionWise[qType].maxMarks ?? 0);
      const correct = relevant.map((t) => t.questionWise[qType].correct ?? 0);
      const wrong = relevant.map((t) => t.questionWise[qType].wrong ?? 0);
      result[qType] = {
        avgScore: MathUtil.avgOf(marks),
        avgAccuracy: MathUtil.avgOf(relevant.map((_, i) => MathUtil.calcAccuracy(correct[i], wrong[i]))),
        avgPercentage: MathUtil.avgOf(relevant.map((_, i) => MathUtil.calcPercentage(marks[i], maxMarks[i]))),
        avgCorrect: MathUtil.avgOf(correct),
        avgWrong: MathUtil.avgOf(wrong),
      };
    }
    return result;
  }

  private buildImprovement(tests: any[]) {
    if (tests.length < 2) return null;
    const latest = tests[0], previous = tests.slice(1);
    const latestAcc = MathUtil.calcAccuracy(TestMetricsExtractor.getCorrect(latest), TestMetricsExtractor.getWrong(latest));
    const prevAcc = MathUtil.avgOf(previous.map((t) => MathUtil.calcAccuracy(TestMetricsExtractor.getCorrect(t), TestMetricsExtractor.getWrong(t))));
    const latestQ = TestMetricsExtractor.getQ(latest);
    const latestTime = latestQ > 0 ? parseFloat((TestMetricsExtractor.getTime(latest) / latestQ).toFixed(4)) : 0;
    
    const prevTime = MathUtil.avgOf(previous.map((t) => {
      const q = TestMetricsExtractor.getQ(t);
      return q > 0 ? parseFloat((TestMetricsExtractor.getTime(t) / q).toFixed(4)) : 0;
    }));

    const subjectImprovement = (s: "math" | "physics" | "chemistry") => {
      const lS = latest[s], prevS = previous.filter((t) => t[s] != null);
      if (!lS || prevS.length === 0) return null;
      const prevAccuracyAvg = MathUtil.avgOf(prevS.map((t) => MathUtil.calcAccuracy(t[s].correct ?? 0, t[s].wrong ?? 0)));
      const prevMarksAvg = MathUtil.avgOf(prevS.map((t) => t[s].marks ?? 0));
      const prevWrongAvg = MathUtil.avgOf(prevS.map((t) => t[s].wrong ?? 0));
      return {
        accuracyChange: parseFloat((MathUtil.calcAccuracy(lS.correct ?? 0, lS.wrong ?? 0) - prevAccuracyAvg).toFixed(4)),
        scoreChange: parseFloat(((lS.marks ?? 0) - prevMarksAvg).toFixed(4)),
        wrongChange: parseFloat(((lS.wrong ?? 0) - prevWrongAvg).toFixed(4)),
      };
    };

    return {
      overall: {
        accuracyChange: parseFloat((latestAcc - prevAcc).toFixed(4)),
        scoreChange: parseFloat((TestMetricsExtractor.getMarks(latest) - MathUtil.avgOf(previous.map((t) => TestMetricsExtractor.getMarks(t)))).toFixed(4)),
        avgTimePerQuestionChange: parseFloat((latestTime - prevTime).toFixed(4)),
      },
      subjects: { math: subjectImprovement("math"), physics: subjectImprovement("physics"), chemistry: subjectImprovement("chemistry") },
    };
  }
}

// ══════════════════════════════════════════
// 6. PRACTICE ANALYTICS BUILDER
// ══════════════════════════════════════════
class PracticeAnalyticsBuilder {
  constructor(private db: PrismaClient) {}

  private processPracticeGroup(records: any[], overallAnalyticsDb: any, dbSubjects: any, dbQuestionTypes: any) {
    const totalAttempts = (overallAnalyticsDb?.attempts ?? 0) + records.length;
    const totalTimeSpent = (overallAnalyticsDb?.timeSpent ?? 0) + records.reduce((sum, q) => sum + (q.timeSpent ?? 0), 0);
    const totalMarksEarned = (overallAnalyticsDb?.marksEarned ?? 0) + records.reduce((sum, q) => sum + (q.marks ?? 0), 0);
    const totalMaxPossible = (overallAnalyticsDb?.maxPossible ?? 0) + records.reduce((sum, q) => sum + (q.positiveMarks ?? 0), 0);

    const subjectMap: Record<string, any> = {};
    dbSubjects.forEach((s: any) => { subjectMap[s.id] = { subjectId: s.id, subjectName: s.name, attempts: s.dbAttempts ?? 0, timeSpent: s.dbTime ?? 0, marksEarned: s.dbMarks ?? 0, maxPossible: s.dbMax ?? 0 }; });

    records.forEach((q) => {
      if (q?.subjectId && subjectMap[q.subjectId]) {
        subjectMap[q.subjectId].attempts += 1;
        subjectMap[q.subjectId].timeSpent += q.timeSpent ?? 0;
        subjectMap[q.subjectId].marksEarned += q.marks ?? 0;
        subjectMap[q.subjectId].maxPossible += q.positiveMarks ?? 0;
      }
    });

    const qtMap: Record<string, any> = {};
    KNOWN_QUESTION_TYPES.forEach((qt) => { qtMap[qt] = { questionType: qt, attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0 }; });
    dbQuestionTypes.forEach((qt: any) => {
      if (!qtMap[qt.type]) qtMap[qt.type] = { questionType: qt.type, attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0 };
      qtMap[qt.type].attempts += qt.dbAttempts ?? 0;
      qtMap[qt.type].timeSpent += qt.dbTime ?? 0;
      qtMap[qt.type].marksEarned += qt.dbMarks ?? 0;
      qtMap[qt.type].maxPossible += qt.dbMax ?? 0;
    });

    records.forEach((q) => {
      if (q?.type) {
        if (!qtMap[q.type]) qtMap[q.type] = { questionType: q.type, attempts: 0, timeSpent: 0, marksEarned: 0, maxPossible: 0 };
        qtMap[q.type].attempts += 1;
        qtMap[q.type].timeSpent += q.timeSpent ?? 0;
        qtMap[q.type].marksEarned += q.marks ?? 0;
        qtMap[q.type].maxPossible += q.positiveMarks ?? 0;
      }
    });

    return {
      overall: {
        totalAttempts, totalTimeSpent, totalMarksEarned, totalMaxPossible,
        accuracy: MathUtil.calcPercentage(totalMarksEarned, totalMaxPossible),
        avgTimePerQuestion: totalAttempts > 0 ? parseFloat((totalTimeSpent / totalAttempts).toFixed(4)) : 0,
      },
      subjects: Object.values(subjectMap).map((s: any) => ({
        ...s, accuracy: MathUtil.calcPercentage(s.marksEarned, s.maxPossible),
        avgTimePerQuestion: s.attempts > 0 ? parseFloat((s.timeSpent / s.attempts).toFixed(4)) : 0,
      })),
      questionTypes: Object.values(qtMap).map((qt: any) => ({
        ...qt, accuracy: MathUtil.calcPercentage(qt.marksEarned, qt.maxPossible),
        avgTimePerQuestion: qt.attempts > 0 ? parseFloat((qt.timeSpent / qt.attempts).toFixed(4)) : 0,
      })),
    };
  }

  async practiceReport(studentId: string) {
    const [overallAnalytics, subjectAnalytics, examAnalytics, questionTypeAnalytics, redisPracticeData, allSubjects] = await Promise.all([
      analytics.studentOverAllAnalytics(studentId),
      analytics.subjectAnanlytics(studentId),
      analytics.examWiseAnalytics(studentId),
      analytics.questionWiseAnalytics(studentId),
      dashboardCacheService.reddisPraticeWiseData(studentId),
      this.db.subjects.findMany({ select: { id: true, name: true } }),
    ]);

    const redisQuestions = (redisPracticeData.praticeWiseData ?? [])
      .filter((q: any) => q?.questionData != null)
      .map((q: any) => q.questionData);
    
    
    const redisPartitions = ExamSplitter.partition(redisQuestions, (q) => q.examName);

    const dbSubsOverall = allSubjects.map(s => {
      const dbS = subjectAnalytics.find((sa: any) => sa.subjectId === s.id) as any;
      return { id: s.id, name: s.name, dbAttempts: dbS?.practiceAttempts, dbTime: dbS?.practiceTimeSpent, dbMarks: dbS?.practiceMarksEarned, dbMax: dbS?.practiceMaxPossible };
    });
    
    const dbQTOverall = questionTypeAnalytics.map((qt: any) => ({
      type: qt.questioType, dbAttempts: qt.practiceAttempts, dbTime: qt.practiceTimeSpent, dbMarks: qt.practiceMarksEarned, dbMax: qt.practiceMaxPossible
    }));

    const findExamPractice = (examName: string) => {
      const row = examAnalytics.find((ea: any) => ea.examName === examName) as any;
      return {
        attempts: row?.practiceAttempts ?? 0,
        timeSpent: row?.practiceTimeSpent ?? 0,
        marksEarned: row?.practiceMarksEarned ?? 0,
        maxPossible: row?.practiceMaxPossible ?? 0,
      };
    };

    const emptySubjectRows = allSubjects.map(s => ({
      id: s.id,
      name: s.name,
      dbAttempts: 0,
      dbTime: 0,
      dbMarks: 0,
      dbMax: 0,
    }));
    
    console.log(dbSubsOverall , dbQTOverall) ; 
    return {
      overall: this.processPracticeGroup(redisPartitions.overall, {
        attempts: overallAnalytics?.practiceAttempts, timeSpent: overallAnalytics?.practiceTimeSpent, marksEarned: overallAnalytics?.practiceMarksEarned, maxPossible: overallAnalytics?.practiceMaxPossible
      }, dbSubsOverall, dbQTOverall),
      jeeMain: this.processPracticeGroup(redisPartitions.jeeMain, findExamPractice("JEE_MAIN"), emptySubjectRows, []),
      jeeAdvanced: this.processPracticeGroup(redisPartitions.jeeAdvanced, findExamPractice("JEE_ADVANCED"), emptySubjectRows, []),
    };
  }
}

// ══════════════════════════════════════════
// 7. CHAPTER ANALYTICS BUILDER
// ══════════════════════════════════════════
class ChapterAnalyticsBuilder {
  async chapterReport(studentId: string) {
    const [dbChapters, reddisData] = await Promise.all([
      analytics.chapterWiseAnalytics(studentId),
      dashboardCacheService.reddisTestData(studentId),
    ]);
    console.log(dbChapters , reddisData) ;  
    const chapterMap: Record<string, any> = {};

    for (const ch of dbChapters as any[]) {
      const pMain = this.buildSubReport(ch.practiceJeeMainAttempts, ch.practiceJeeMainTimeSpent, ch.practiceJeeMainMarksEarned, ch.practiceJeeMainMaxPossible, ch.practiceJeeMainCorrect, ch.practiceJeeMainWrong, ch.practiceJeeMainPartial);
      const pAdv = this.buildSubReport(ch.practiceJeeAdvancedAttempts, ch.practiceJeeAdvancedTimeSpent, ch.practiceJeeAdvancedMarksEarned, ch.practiceJeeAdvancedMaxPossible, ch.practiceJeeAdvancedCorrect, ch.practiceJeeAdvancedWrong, ch.practiceJeeAdvancedPartial);
      const tMain = this.buildSubReport(ch.testJeeMainAttempts, ch.testJeeMainTimeSpent, ch.testJeeMainMarksEarned, ch.testJeeMainMaxPossible, ch.testJeeMainCorrect, ch.testJeeMainWrong, ch.testJeeMainPartial);
      const tAdv = this.buildSubReport(ch.testJeeAdvancedAttempts, ch.testJeeAdvancedTimeSpent, ch.testJeeAdvancedMarksEarned, ch.testJeeAdvancedMaxPossible, ch.testJeeAdvancedCorrect, ch.testJeeAdvancedWrong, ch.testJeeAdvancedPartial);

      chapterMap[ch.chapterId] = {
        chapterId: ch.chapterId,
        practice: { overall: ExamSplitter.finalizeStats(ExamSplitter.combineStats(pMain, pAdv)), jeeMain: pMain, jeeAdvanced: pAdv },
        test: { overall: ExamSplitter.finalizeStats(ExamSplitter.combineStats(tMain, tAdv)), jeeMain: tMain, jeeAdvanced: tAdv }
      };
    }

    for (const test of reddisData.testData ?? []) {
      for (const rCh of test.testData?.chapterWise ?? []) {
        const examName = test.testData.exam;
        const isJeeMain = examName === "JEE_MAIN";
        const isJeeAdv = examName === "JEE_ADVANCED";

        if (!chapterMap[rCh.chapterId]) {
          chapterMap[rCh.chapterId] = {
            chapterId: rCh.chapterId,
            practice: { overall: this.buildSubReport(0,0,0,0,0,0,0), jeeMain: this.buildSubReport(0,0,0,0,0,0,0), jeeAdvanced: this.buildSubReport(0,0,0,0,0,0,0) },
            test: { overall: this.buildSubReport(0,0,0,0,0,0,0), jeeMain: this.buildSubReport(0,0,0,0,0,0,0), jeeAdvanced: this.buildSubReport(0,0,0,0,0,0,0) }
          };
        }

        const section = isJeeMain ? chapterMap[rCh.chapterId].test.jeeMain : isJeeAdv ? chapterMap[rCh.chapterId].test.jeeAdvanced : null;

        if (section) {
          section.attempts += rCh.attempt ?? 0;
          section.timeSpent += rCh.timeTaken ?? 0;
          section.marksEarned += rCh.marks ?? 0;
          section.maxPossible += rCh.positiveMarks ?? 0;
          section.correct += rCh.correct ?? 0;
          section.wrong += rCh.wrong ?? 0;
          section.partial += rCh.partial ?? 0;
          section.accuracy = MathUtil.calcAccuracy(section.correct, section.wrong);
          section.percentage = MathUtil.calcPercentage(section.marksEarned, section.maxPossible);
          
          chapterMap[rCh.chapterId].test.overall = ExamSplitter.finalizeStats(ExamSplitter.combineStats(chapterMap[rCh.chapterId].test.jeeMain, chapterMap[rCh.chapterId].test.jeeAdvanced));
        }
      }
    }

    return { chapters: Object.values(chapterMap) };
  }

  private buildSubReport(attempts = 0, timeSpent = 0, marksEarned = 0, maxPossible = 0, correct = 0, wrong = 0, partial = 0) {
    return { attempts, timeSpent, marksEarned, maxPossible, correct, wrong, partial, accuracy: MathUtil.calcAccuracy(correct, wrong), percentage: MathUtil.calcPercentage(marksEarned, maxPossible) };
  }
}

// ══════════════════════════════════════════
// 8. WEAKNESS HUNTER BUILDER (Partitioned)
// ══════════════════════════════════════════
class WeaknessHunterBuilder {
  constructor(private db: PrismaClient) {}

  async buildPartitionedWeakness(chapterReport: any) {
    const chapterIds = chapterReport.chapters.map((c: any) => c.chapterId);
    const chaptersMeta = await this.db.chapters.findMany({
      where: { id: { in: chapterIds } },
      select: { id: true, name: true, subjects: { select: { name: true } } }
    });

    const metaMap = new Map();
    for (const c of chaptersMeta) metaMap.set(c.id, { name: c.name, subject: c.subjects?.name });

    const createEmptySubjectGroup = () => ({ Mathematics: [], Physics: [], Chemistry: [] });
    const result: Record<string, any> = {
      overall: createEmptySubjectGroup(),
      jeeMain: createEmptySubjectGroup(),
      jeeAdvanced: createEmptySubjectGroup()
    };

    for (const ch of chapterReport.chapters) {
      const meta = metaMap.get(ch.chapterId);
      if (!meta || !meta.subject) continue; 
      
      const subjectKey = meta.subject; 

      const addIfAttempted = (groupKey: string, testNode: any, practiceNode: any) => {
        if (!result[groupKey][subjectKey]) return;
        const totalMarks = (testNode.marksEarned || 0) + (practiceNode.marksEarned || 0);
        const totalMax = (testNode.maxPossible || 0) + (practiceNode.maxPossible || 0);
        const totalCorrect = (testNode.correct || 0) + (practiceNode.correct || 0);
        const totalWrong = (testNode.wrong || 0) + (practiceNode.wrong || 0);
        const totalAttempts = (testNode.attempts || 0) + (practiceNode.attempts || 0);

        if (totalAttempts > 0) {
          result[groupKey][subjectKey].push({
            chapterId: ch.chapterId,
            chapterName: meta.name,
            percentage: MathUtil.calcPercentage(totalMarks, totalMax),
            accuracy: MathUtil.calcAccuracy(totalCorrect, totalWrong),
            totalAttempts,
            totalMarks,
            totalMax
          });
        }
      };

      addIfAttempted('overall', ch.test.overall, ch.practice.overall);
      addIfAttempted('jeeMain', ch.test.jeeMain, ch.practice.jeeMain);
      addIfAttempted('jeeAdvanced', ch.test.jeeAdvanced, ch.practice.jeeAdvanced);
    }

    // Sort chapters from 0% ascending for every category
    for (const scope of ['overall', 'jeeMain', 'jeeAdvanced']) {
      for (const subj of ['Mathematics', 'Physics', 'Chemistry']) {
        result[scope][subj].sort((a: any, b: any) => a.percentage - b.percentage);
      }
    }

    return result;
  }
}

// ══════════════════════════════════════════
// 9. SNAPSHOT BUILDER
// ══════════════════════════════════════════
class SnapshotBuilder {
  constructor(private db: PrismaClient, private testFetcher: TestResultService, private practiceBuilder: PracticeAnalyticsBuilder) {}

  private processSnapshotGroup(testsRaw: any[], paperDetailsMap: Record<string, any>) {
    const last5Raw = testsRaw.slice(0, 5);
    
    const last5Tests = last5Raw.map((t: any) => {
      if (paperDetailsMap[t.id]) t.totalDuration = paperDetailsMap[t.id].totalDuration;
      const finalMarks = TestMetricsExtractor.getMarks(t), finalMaxMarks = TestMetricsExtractor.getMaxMarks(t);
      const finalCorrect = TestMetricsExtractor.getCorrect(t), finalWrong = TestMetricsExtractor.getWrong(t);

      return {
        testId: t.id, source: t.source, createdAt: t.created_at, paperDetails: paperDetailsMap[t.id] ?? null,
        overall: { marks: finalMarks, maxMarks: finalMaxMarks, correct: finalCorrect, wrong: finalWrong, accuracy: MathUtil.calcAccuracy(finalCorrect, finalWrong), percentage: MathUtil.calcPercentage(finalMarks, finalMaxMarks), timeTaken: TestMetricsExtractor.getTime(t) },
        subjects: {
          math: this.buildSubjectBlock(t, "math", "Mathematics"),
          physics: this.buildSubjectBlock(t, "physics", "Physics"),
          chemistry: this.buildSubjectBlock(t, "chemistry", "Chemistry"),
        },
        questionWise: this.buildQuestionWiseBlock(t),
      };
    });

    let totalMarks = 0, totalMaxMarks = 0, totalTime = 0, totalCorrect = 0, totalWrong = 0;
    const subAgg: Record<string, { marks: number; maxMarks: number; correct: number; wrong: number }> = {
      Mathematics: { marks: 0, maxMarks: 0, correct: 0, wrong: 0 }, Physics: { marks: 0, maxMarks: 0, correct: 0, wrong: 0 }, Chemistry: { marks: 0, maxMarks: 0, correct: 0, wrong: 0 },
    };
    const qtAgg: Record<string, { marks: number; maxMarks: number; correct: number; wrong: number }> = {};

    for (const test of last5Tests) {
      totalMarks += test.overall.marks; totalMaxMarks += test.overall.maxMarks; totalTime += test.overall.timeTaken;
      totalCorrect += test.overall.correct; totalWrong += test.overall.wrong;

      for (const qw of test.questionWise) {
        if (!qtAgg[qw.questionType]) qtAgg[qw.questionType] = { marks: 0, maxMarks: 0, correct: 0, wrong: 0 };
        qtAgg[qw.questionType].marks += qw.marks; qtAgg[qw.questionType].correct += qw.correct; qtAgg[qw.questionType].wrong += qw.wrong;
      }
      for (const { key, name } of KNOWN_SUBJECTS) {
        const s = test.subjects[key as "math" | "physics" | "chemistry"];
        subAgg[name].marks += s.marks; subAgg[name].correct += s.correct; subAgg[name].wrong += s.wrong;
      }
    }

    let aggregate = null;
    if (last5Tests.length > 0) {
      aggregate = {
        testsIncluded: last5Tests.length, totalMarks, totalMaxMarks,
        overallAccuracy: MathUtil.calcAccuracy(totalCorrect, totalWrong),
        overallPercentage: MathUtil.calcPercentage(totalMarks, totalMaxMarks),
        avgTimeTaken: parseFloat((totalTime / last5Tests.length).toFixed(4)),
        subjects: KNOWN_SUBJECTS.map((item) => ({ subjectName: item.name, totalMarks: subAgg[item.name].marks, totalCorrect: subAgg[item.name].correct, totalWrong: subAgg[item.name].wrong, accuracy: MathUtil.calcAccuracy(subAgg[item.name].correct, subAgg[item.name].wrong) })),
        questionWise: Object.entries(qtAgg).map(([qt, d]) => ({ questionType: qt, totalMarks: d.marks, totalCorrect: d.correct, totalWrong: d.wrong, accuracy: MathUtil.calcAccuracy(d.correct, d.wrong) })),
      };
    }

    return { last5: last5Tests, aggregate };
  }

  private buildSubjectBlock(t: any, key: "math" | "physics" | "chemistry", name: string) {
    const s = t[key];
    if (!s) return { subjectName: name, marks: 0, correct: 0, wrong: 0, timeTaken: 0, totalQuestions: 0, maxMarks: 0, accuracy: 0, percentage: 0 };
    return {
      subjectName: name, marks: s.marks ?? 0, correct: s.correct ?? 0, wrong: s.wrong ?? 0,
      timeTaken: s.timeTaken ?? 0, totalQuestions: s.totalQuestions ?? 0, maxMarks: s.maxMarks ?? s.totalMarks ?? 0,
      accuracy: MathUtil.calcAccuracy(s.correct ?? 0, s.wrong ?? 0), percentage: MathUtil.calcPercentage(s.marks ?? 0, s.maxMarks ?? s.totalMarks ?? 0),
    };
  }

  private buildQuestionWiseBlock(t: any) {
    const qtBlock: Record<string, any> = {};
    for (const qt of KNOWN_QUESTION_TYPES) qtBlock[qt] = { questionType: qt, marks: 0, correct: 0, wrong: 0, maxMarks: 0, accuracy: 0, percentage: 0 };
    if (t.questionWise && typeof t.questionWise === "object") {
      for (const [qtType, qtData] of Object.entries(t.questionWise as Record<string, any>)) {
        qtBlock[qtType] = {
          questionType: qtType, marks: qtData?.marks ?? 0, correct: qtData?.correct ?? 0, wrong: qtData?.wrong ?? 0, maxMarks: qtData?.maxMarks ?? 0,
          accuracy: MathUtil.calcAccuracy(qtData?.correct ?? 0, qtData?.wrong ?? 0), percentage: MathUtil.calcPercentage(qtData?.marks ?? 0, qtData?.maxMarks ?? 0),
        };
      }
    }
    return Object.values(qtBlock);
  }

  async studentSnapshot(studentId: string) {
    const [allTestData, practiceData, attemptedQuestions, subjectTotals] = await Promise.all([
      this.testFetcher.fetchAll(studentId),
      this.practiceBuilder.practiceReport(studentId),
      questionBitmapRegistry.getAttemptedQuestionIds(studentId),
      subject.readingAllSubjects(),
    ]);

    const partitions = ExamSplitter.partition(allTestData, (t) => t.exam);
    const paperDetailsMap: Record<string, any> = {};

    const requiredIds = [...partitions.overall.slice(0, 5), ...partitions.jeeMain.slice(0, 5), ...partitions.jeeAdvanced.slice(0, 5)].map((t: any) => t.id);
    
    if (requiredIds.length > 0) {
      const tsWithPapers = await this.db.testStatus.findMany({
        where: { id: { in: requiredIds } },
        select: { id: true, papers: { select: { year: true, month: true, day: true, date: true, shift: true, mode: true, totalMarks: true, totalDuration: true, totalQuestions: true, exam: { select: { name: true } } } } },
      });
      for (const ts of tsWithPapers) paperDetailsMap[ts.id] = ts.papers;
    }

    const subjectWiseUnique: Record<string, any> = {
      Mathematics: { uniqueAttempted: 0, totalQuestions: (subjectTotals as any)["Mathematics"]?.totalQuestion ?? 0 },
      Physics: { uniqueAttempted: 0, totalQuestions: (subjectTotals as any)["Physics"]?.totalQuestion ?? 0 },
      Chemistry: { uniqueAttempted: 0, totalQuestions: (subjectTotals as any)["Chemistry"]?.totalQuestion ?? 0 },
    };

    if (attemptedQuestions.questionIds.length > 0) {
      const questionSubjects = await this.db.questions.findMany({
        where: { id: { in: attemptedQuestions.questionIds } },
        select: { subjects: { select: { name: true } } },
      });
      for (const q of questionSubjects) {
        if (subjectWiseUnique[q.subjects.name]) subjectWiseUnique[q.subjects.name].uniqueAttempted++;
      }
    }

    return {
      studentId, generatedAt: new Date(),
      totalUniqueMockTests: new Set(allTestData.map((t: any) => String(t.paperMeta?.id || t.paperId || t.id))).size,
      tests: {
        overall: this.processSnapshotGroup(partitions.overall, paperDetailsMap),
        jeeMain: this.processSnapshotGroup(partitions.jeeMain, paperDetailsMap),
        jeeAdvanced: this.processSnapshotGroup(partitions.jeeAdvanced, paperDetailsMap),
      },
      practice: practiceData,
      uniqueQuestionsAttempted: { total: attemptedQuestions.totalUnique, subjectWise: subjectWiseUnique },
    };
  }
}

// ══════════════════════════════════════════
// 10. REPORT SERVICE (The Orchestrator / Facade)
// ══════════════════════════════════════════
class ReportService {
  private testFetcher: TestResultService;
  private mockAnalytics: MockTestAnalyticsBuilder;
  private practiceAnalytics: PracticeAnalyticsBuilder;
  private chapterAnalytics: ChapterAnalyticsBuilder;
  private weaknessHunter: WeaknessHunterBuilder;
  private snapshotAnalytics: SnapshotBuilder;

  constructor(private db: PrismaClient) {
    this.testFetcher = new TestResultService();
    this.mockAnalytics = new MockTestAnalyticsBuilder();
    this.practiceAnalytics = new PracticeAnalyticsBuilder(this.db);
    this.chapterAnalytics = new ChapterAnalyticsBuilder();
    this.weaknessHunter = new WeaknessHunterBuilder(this.db);
    this.snapshotAnalytics = new SnapshotBuilder(this.db, this.testFetcher, this.practiceAnalytics);
  }

  // ── ANALYTICS PAGE (Tests Only) ─────────────────────────────────────────────────
  async reportMaking(studentId: string) {
    const allTestData = await this.testFetcher.fetchAll(studentId);
    if (allTestData.length === 0) return null;

    const partitions = ExamSplitter.partition(allTestData, t => t.exam);
    const totalUniqueMockTests = new Set(allTestData.map(t => String((t as any).paperMeta?.id || (t as any).paperId || t.id))).size;

    return {
      studentId, 
      generatedAt: new Date(),
      totalUniqueMockTests, 
      overall: this.mockAnalytics.buildScopeReports(partitions.overall),
      jeeMain: this.mockAnalytics.buildScopeReports(partitions.jeeMain),
      jeeAdvanced: this.mockAnalytics.buildScopeReports(partitions.jeeAdvanced),
    };
  }

  // ── DASHBOARD (The Full Tripartite Payload) ──────────────────────────────────
  async fullDashboard(studentId: string) {
    const allTestData = await this.testFetcher.fetchAll(studentId);

    if (allTestData.length === 0) {
      return { studentId, totalUniqueMockTests: 0, generatedAt: new Date(), overall: null, jeeMain: null, jeeAdvanced: null };
    }

    const practiceData = await this.practiceAnalytics.practiceReport(studentId);
    const chapterReport = await this.chapterAnalytics.chapterReport(studentId);
    const weaknessData = await this.weaknessHunter.buildPartitionedWeakness(chapterReport);

    const partitions = ExamSplitter.partition(allTestData, t => t.exam);
    const totalUniqueMockTests = new Set(allTestData.map(t => String((t as any).paperMeta?.id || (t as any).paperId || t.id))).size;

    const buildTab = (tests: any[], practiceNode: any, weaknessNode: any) => ({
      practiceAnalytics: practiceNode,
      testReports: this.mockAnalytics.buildScopeReports(tests),
      weakChapters: weaknessNode,
      allTests: tests 
    });

    return {
      studentId,
      generatedAt: new Date(),
      totalUniqueMockTests,
      overall: buildTab(partitions.overall, practiceData.overall, weaknessData.overall),
      jeeMain: buildTab(partitions.jeeMain, practiceData.jeeMain, weaknessData.jeeMain),
      jeeAdvanced: buildTab(partitions.jeeAdvanced, practiceData.jeeAdvanced, weaknessData.jeeAdvanced)
    };
  }

  // Fallbacks if you need raw endpoints
  async allTestResult(studentId: string) { return this.testFetcher.fetchAll(studentId); }
  async studentSnapshot(studentId: string) { return this.snapshotAnalytics.studentSnapshot(studentId); }
}

export const reportService = new ReportService(database);

