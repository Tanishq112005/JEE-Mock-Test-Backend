import { PrismaClient, ExamName, SubjectName, questionType } from "@prisma/client";
import { database } from "../lib/database";
import {
  SubjectStats,
  QuestionTypeStat,
  ChapterStat,
  OverallStats,
  SummaryReport,
} from "../types/analytics.types";

// ─────────────────────────────────────────────────────────────────────────────
// Analytics
//
// Schema facts:
//   questionType enum: SingleCorrect | MultiCorrect | Integer |
//     ComprehensionSingleCorrect | ComprehensionMultiCorrect | ComprehensionInteger
//
//   TestAttemptSummary has: totalScore, maxScore, percentage, accuracy, timeTaken
//   SubjectTestResult has:  subjectName (SubjectName enum), marks, positiveMarks, etc.
//   QuestionTypeTestResult has: questionType (questionType enum), marks, etc.
// ─────────────────────────────────────────────────────────────────────────────

class Analytics {
  private db: PrismaClient;

  constructor(database: PrismaClient) {
    this.db = database;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // READ
  // ══════════════════════════════════════════════════════════════════════════

  async collectingTotalQuestion() {
    return this.db.subjects.findMany();
  }

  async subjectAnanlytics(studentId: string) {
    return this.db.subjectAnalytics.findMany({ where: { studentId } });
  }

  async studentOverAllAnalytics(studentId: string) {
    return this.db.studentOverallAnalytics.findUnique({ where: { studentId } });
  }

  async questionWiseAnalytics(studentId: string) {
    return this.db.studentQuestionAnalytics.findMany({ where: { studentId } });
  }

  async chapterWiseAnalytics(studentId: string) {
    return this.db.chapterAnalytics.findMany({ where: { studentId } });
  }

  async examWiseAnalytics(studentId: string) {
    return this.db.examAnalytics.findMany({ where: { studentId } });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // testWiseData
  // Reads from TestAttemptSummary → SubjectTestResult[] + QuestionTypeTestResult[]
  // Returns shape that reportService builders consume
  // ══════════════════════════════════════════════════════════════════════════

  async testWiseData(studentId: string) {
    const rows = await this.db.testAttemptSummary.findMany({
      where:   { studentId },
      include: {
        subjectResults:      true,
        questionTypeResults: true,
        testStatus: {
          include: {
            papers: {
              include: { exam: true },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return rows.map((test) => {
      const paper = test.testStatus.papers;

      // ── Subject blocks (null-safe) ─────────────────────────────────────────
      const findSub = (name: SubjectName) =>
        test.subjectResults.find((s) => s.subjectName === name) ?? null;

      const buildSubject = (raw: ReturnType<typeof findSub>) => {
        if (!raw) return null;
        return {
          marks:          raw.marks,
          maxMarks:       raw.positiveMarks,   // used by reportService calcAccuracy
          correct:        raw.correct,
          wrong:          raw.wrong,
          partial:        raw.partial,
          attempt:        raw.attempted,
          timeTaken:      raw.timeTaken,
          totalQuestions: raw.totalQuestions,
          accuracy:       raw.accuracy,
        };
      };

      // ── Question type blocks ──────────────────────────────────────────────
      // Keys are actual questionType enum values: "SingleCorrect", "MultiCorrect", etc.
      const questionTypes: Record<string, any> = {};
      for (const qt of test.questionTypeResults) {
        questionTypes[qt.questionType] = {
          marks:          qt.marks,
          maxMarks:       qt.positiveMarks,    // used by reportService calcAccuracy
          correct:        qt.correct,
          wrong:          qt.wrong,
          partial:        qt.partial,
          attempt:        qt.attempted,
          timeTaken:      qt.timeTaken,
          totalQuestions: qt.totalQuestions,
          accuracy:       qt.accuracy,
        };
      }

      // ── overAllAnalytics — shape reportService reads ───────────────────────
      // reportService reads: marks ?? totalScore, maxMarks ?? maxScore, timeTaken, totalQuestions
      const overAllAnalytics = {
        totalScore:     test.totalScore,   // marks
        maxScore:       test.maxScore,     // maxMarks
        timeTaken:      test.timeTaken,
        totalQuestions: paper.totalQuestions ?? 0,
        accuracy:       test.accuracy,
        percentage:     test.percentage,
      };

      return {
        id:           test.testStatusId,
        testStatusId: test.testStatusId,
        created_at:   test.created_at,
        source:       "testWise" as const,
        exam:         paper.exam.name,

        math:      buildSubject(findSub("Mathematics")),
        physics:   buildSubject(findSub("Physics")),
        chemistry: buildSubject(findSub("Chemistry")),

        overAllAnalytics,
        questionTypes,

        paperMeta: {
          year:           paper.year           ?? null,
          month:          paper.month          ?? null,
          day:            paper.day            ?? null,
          date:           paper.date           ?? null,
          shift:          paper.shift          ?? null,
          mode:           paper.mode           ?? null,
          totalMarks:     paper.totalMarks     ?? null,
          totalDuration:  paper.totalDuration  ?? null,
          totalQuestions: paper.totalQuestions ?? null,
        },

        chapterWise: [],
      };
    });
  }

  async chapterWiseSnapshots(studentId: string) {
    return this.db.testChapterAnalytics.findMany({
      where:   { studentId },
      orderBy: { created_at: "desc" },
    });
  }

  async getFullTestSummaryReport(testStatusId: string, studentId: string) {
    const testSummary = await this.db.testAttemptSummary.findFirst({
      where:   { testStatusId, studentId },
      include: {
        subjectResults:      true,
        questionTypeResults: true,
        testStatus: {
          include: {
            papers: { include: { exam: true } },
            testQuestionStatus: true,
          },
        },
      },
    });

    if (!testSummary) return null;

    const getSub = (name: SubjectName) =>
      testSummary.subjectResults.find((s) => s.subjectName === name);

    const buildStat = (s: ReturnType<typeof getSub>) =>
      s ? {
        totalQuestions: s.totalQuestions,
        attempt:        s.attempted,
        marks:          s.marks,
        timeTaken:      s.timeTaken,
        positiveMarks:  s.positiveMarks,
        paritalMarks:   s.partialMarks,  // typo kept
        negativeMarks:  s.negativeMarks,
        correct:        s.correct,
        partial:        s.partial,
        wrong:          s.wrong,
        accuracy:       s.accuracy,
      } : null;

    const questionTypes: Record<string, any> = {};
    for (const qt of testSummary.questionTypeResults) {
      questionTypes[qt.questionType] = {
        totalQuestions: qt.totalQuestions,
        attempt:        qt.attempted,
        marks:          qt.marks,
        timeTaken:      qt.timeTaken,
        positiveMarks:  qt.positiveMarks,
        partialMarks:   qt.partialMarks,
        negativeMarks:  qt.negativeMarks,
        correct:        qt.correct,
        partial:        qt.partial,
        wrong:          qt.wrong,
        accuracy:       qt.accuracy,
      };
    }

    const chapterSnapshots = await this.db.testChapterAnalytics.findMany({
      where: { testStatusId, studentId },
    });

    const paper = testSummary.testStatus.papers;
    const math  = getSub("Mathematics");
    const phy   = getSub("Physics");
    const chem  = getSub("Chemistry");

    return {
      exam:       paper.exam.name,
      created_at: testSummary.created_at,

      math:      buildStat(math),
      physics:   buildStat(phy),
      chemistry: buildStat(chem),

      overall: {
        totalQuestions:
          (math?.totalQuestions ?? 0) +
          (phy?.totalQuestions  ?? 0) +
          (chem?.totalQuestions ?? 0),
        totalAttempted:
          (math?.attempted ?? 0) +
          (phy?.attempted  ?? 0) +
          (chem?.attempted ?? 0),
        totalCorrect:
          (math?.correct ?? 0) + (phy?.correct ?? 0) + (chem?.correct ?? 0),
        totalPartial:
          (math?.partial ?? 0) + (phy?.partial ?? 0) + (chem?.partial ?? 0),
        overallAccuracy:        testSummary.accuracy,
        totalTimeTaken:         testSummary.timeTaken,
        averageTimePerQuestion: testSummary.avgTimePerQ,
        totalScore:             testSummary.totalScore,
        maxScore:               testSummary.maxScore,
        percentage:             testSummary.percentage,
      },

      questionTypes,

      chapterWise: chapterSnapshots.map((ch) => ({
        chapterId:      ch.chapterId,
        chapterName:    ch.chapterName,
        subjectName:    ch.subjectName,
        totalQuestions: ch.totalQuestions,
        attempt:        ch.attempt,
        correct:        ch.correct,
        partial:        ch.partial,
        wrong:          ch.wrong,
        positiveMarks:  ch.positiveMarks,
        partialMarks:   ch.partialMarks,
        negativeMarks:  ch.negativeMarks,
        marks:          ch.marksEarned,
        timeTaken:      ch.timeTaken,
        accuracy:       ch.accuracy,
      })),

      paperMeta: {
        year:           paper.year           ?? null,
        month:          paper.month          ?? null,
        day:            paper.day            ?? null,
        date:           paper.date           ?? null,
        shift:          paper.shift          ?? null,
        mode:           paper.mode           ?? null,
        totalMarks:     paper.totalMarks     ?? null,
        totalDuration:  paper.totalDuration  ?? null,
        totalQuestions: paper.totalQuestions ?? null,
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PERSIST — main transaction
  // ══════════════════════════════════════════════════════════════════════════

  async persistTestAnalytics(
    testStatusId: string,
    studentId:    string,
    report:       SummaryReport,
  ) {
    const { exam, math, physics, chemistry, chapterWise } = report;

    // Resolve subjectIds
    const subjects = await this.db.subjects.findMany({ select: { id: true, name: true } });
    const subjectIdMap: Record<string, string> = {};
    for (const s of subjects) subjectIdMap[s.name] = s.id;

    const mathId  = subjectIdMap["Mathematics"];
    const phyId   = subjectIdMap["Physics"];
    const chemId  = subjectIdMap["Chemistry"];

    if (!mathId || !phyId || !chemId) {
      throw new Error("One or more subjects not found in DB");
    }

    const subjectMap = {
      Mathematics: { subjectId: mathId,  stats: math },
      Physics:     { subjectId: phyId,   stats: physics },
      Chemistry:   { subjectId: chemId,  stats: chemistry },
    };

    await this.db.$transaction(
      async (tx) => {
        const _tx = tx as unknown as PrismaClient;

        // ✅ 1. TestAttemptSummary + SubjectTestResult[] + QuestionTypeTestResult[]
        //    THIS was the missing call — without it math/physics/chemistry were null
        await this.writeTestAttemptSummary(_tx, testStatusId, studentId, report);

        // ✅ 2. Per-test per-chapter snapshot rows
        if (chapterWise.length > 0) {
          await Promise.all(
            this.writeTestChapterSnapshots(_tx, testStatusId, studentId, exam, chapterWise),
          );
        }

        // ✅ 3. Cumulative chapter analytics
        if (chapterWise.length > 0) {
          await Promise.all(
            this.writeChapterAnalytics(_tx, studentId, exam, chapterWise),
          );
        }

        // ✅ 4. Cumulative subject analytics
        await Promise.all(
          this.writeSubjectAnalytics(
            _tx, studentId,
            subjectMap as Record<SubjectName, { subjectId: string; stats: SubjectStats }>,
          ),
        );

        // ✅ 5. Student overall analytics
        await this.writeStudentOverallAnalytics(_tx, studentId, report);

        // ✅ 6. Exam analytics
        await this.writeExamAnalytics(_tx, studentId, report);

        // ✅ 7. Mark as analyzed
        await tx.testStatus.update({
          where: { id: testStatusId },
          data:  { isAnalyzed: true, updated_at: new Date() },
        });
      },
      { maxWait: 5000, timeout: 30000 },
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // WRITE HELPERS — test analytics
  // ══════════════════════════════════════════════════════════════════════════

  private writeTestAttemptSummary(
    tx:          PrismaClient,
    testStatusId: string,
    studentId:   string,
    report:      SummaryReport,
  ) {
    const { overall, math, physics, chemistry, questionTypes } = report;

    const totalScore   = math.marks + physics.marks + chemistry.marks;
    const totalMaxMark = math.positiveMarks + physics.positiveMarks + chemistry.positiveMarks;
    const percentage   = totalMaxMark > 0
      ? parseFloat(((totalScore / totalMaxMark) * 100).toFixed(4)) : 0;

    // SubjectName enum values that match schema
    const subjectRows: {
      subjectName:    SubjectName;
      totalQuestions: number;
      attempted:      number;
      correct:        number;
      partial:        number;
      wrong:          number;
      marks:          number;
      positiveMarks:  number;
      partialMarks:   number;
      negativeMarks:  number;
      timeTaken:      number;
      accuracy:       number;
    }[] = (
      [
        ["Mathematics", math],
        ["Physics",     physics],
        ["Chemistry",   chemistry],
      ] as [SubjectName, SubjectStats][]
    ).map(([name, s]) => ({
      subjectName:    name,
      totalQuestions: s.totalQuestions,
      attempted:      s.attempt,
      correct:        s.correct,
      partial:        s.partial,
      wrong:          s.wrong,
      marks:          s.marks,
      positiveMarks:  s.positiveMarks,
      partialMarks:   s.paritalMarks,  // typo kept
      negativeMarks:  s.negativeMarks,
      timeTaken:      s.timeTaken,
      accuracy:       s.accuracy,
    }));

    // questionType enum values from your schema e.g. "SingleCorrect"
    const qtRows: {
      questionType:   questionType;
      totalQuestions: number;
      attempted:      number;
      correct:        number;
      partial:        number;
      wrong:          number;
      marks:          number;
      positiveMarks:  number;
      partialMarks:   number;
      negativeMarks:  number;
      timeTaken:      number;
      accuracy:       number;
    }[] = Object.entries(questionTypes).map(([type, qt]) => ({
      questionType:   type as questionType,
      totalQuestions: qt.totalQuestions,
      attempted:      qt.attempt,
      correct:        qt.correct,
      partial:        qt.partial,
      wrong:          qt.wrong,
      marks:          qt.marks,
      positiveMarks:  qt.positiveMarks,
      partialMarks:   qt.partialMarks,
      negativeMarks:  qt.negativeMarks,
      timeTaken:      qt.timeTaken,
      accuracy:       qt.accuracy,
    }));

    return tx.testAttemptSummary.upsert({
      where:  { testStatusId },
      create: {
        testStatusId,
        studentId,
        totalScore,
        maxScore:    totalMaxMark,
        percentage,
        accuracy:    overall.overallAccuracy,
        timeTaken:   overall.totalTimeTaken,
        avgTimePerQ: overall.averageTimePerQuestion,
        subjectResults:      { create: subjectRows },
        questionTypeResults: { create: qtRows },
      },
      update: {
        totalScore,
        maxScore:    totalMaxMark,
        percentage,
        accuracy:    overall.overallAccuracy,
        timeTaken:   overall.totalTimeTaken,
        avgTimePerQ: overall.averageTimePerQuestion,
        subjectResults: {
          deleteMany: {},
          create:     subjectRows,
        },
        questionTypeResults: {
          deleteMany: {},
          create:     qtRows,
        },
      },
    });
  }

  private writeTestChapterSnapshots(
    tx:          PrismaClient,
    testStatusId: string,
    studentId:   string,
    examName:    ExamName,
    chapterWise: ChapterStat[],
  ) {
    return chapterWise.map((ch) =>
      tx.testChapterAnalytics.upsert({
        where: {
          studentId_chapterId_testStatusId: {
            studentId,
            chapterId: ch.chapterId,
            testStatusId,
          },
        },
        create: {
          studentId,
          chapterId:      ch.chapterId,
          testStatusId,
          examName,
          chapterName:    ch.chapterName,
          subjectName:    ch.subjectName,
          totalQuestions: ch.totalQuestions,
          attempt:        ch.attempt,
          correct:        ch.correct,
          partial:        ch.partial,
          wrong:          ch.wrong,
          marksEarned:    ch.marks,
          maxPossible:    ch.positiveMarks,
          positiveMarks:  ch.positiveMarks,
          partialMarks:   ch.partialMarks,
          negativeMarks:  ch.negativeMarks,
          timeTaken:      ch.timeTaken,
          accuracy:       ch.accuracy,
        },
        update: {
          attempt:       ch.attempt,
          correct:       ch.correct,
          partial:       ch.partial,
          wrong:         ch.wrong,
          marksEarned:   ch.marks,
          maxPossible:   ch.positiveMarks,
          positiveMarks: ch.positiveMarks,
          partialMarks:  ch.partialMarks,
          negativeMarks: ch.negativeMarks,
          timeTaken:     ch.timeTaken,
          accuracy:      ch.accuracy,
        },
      }),
    );
  }

  private writeChapterAnalytics(
    tx:          PrismaClient,
    studentId:   string,
    examName:    ExamName,
    chapterWise: ChapterStat[],
  ) {
    const isJeeMain     = examName === "JEE_MAIN";
    const isJeeAdvanced = examName === "JEE_ADVANCED";

    return chapterWise.map((ch) => {
      const mainCreate = isJeeMain ? {
        testJeeMainAttempts:    ch.attempt,
        testJeeMainTimeSpent:   ch.timeTaken,
        testJeeMainMarksEarned: ch.marks,
        testJeeMainMaxPossible: ch.positiveMarks,
        testJeeMainCorrect:     ch.correct,
        testJeeMainWrong:       ch.wrong,
        testJeeMainPartial:     ch.partial,
      } : {};

      const advCreate = isJeeAdvanced ? {
        testJeeAdvancedAttempts:    ch.attempt,
        testJeeAdvancedTimeSpent:   ch.timeTaken,
        testJeeAdvancedMarksEarned: ch.marks,
        testJeeAdvancedMaxPossible: ch.positiveMarks,
        testJeeAdvancedCorrect:     ch.correct,
        testJeeAdvancedWrong:       ch.wrong,
        testJeeAdvancedPartial:     ch.partial,
      } : {};

      const mainInc = isJeeMain ? {
        testJeeMainAttempts:    { increment: ch.attempt },
        testJeeMainTimeSpent:   { increment: ch.timeTaken },
        testJeeMainMarksEarned: { increment: ch.marks },
        testJeeMainMaxPossible: { increment: ch.positiveMarks },
        testJeeMainCorrect:     { increment: ch.correct },
        testJeeMainWrong:       { increment: ch.wrong },
        testJeeMainPartial:     { increment: ch.partial },
      } : {};

      const advInc = isJeeAdvanced ? {
        testJeeAdvancedAttempts:    { increment: ch.attempt },
        testJeeAdvancedTimeSpent:   { increment: ch.timeTaken },
        testJeeAdvancedMarksEarned: { increment: ch.marks },
        testJeeAdvancedMaxPossible: { increment: ch.positiveMarks },
        testJeeAdvancedCorrect:     { increment: ch.correct },
        testJeeAdvancedWrong:       { increment: ch.wrong },
        testJeeAdvancedPartial:     { increment: ch.partial },
      } : {};

      return tx.chapterAnalytics.upsert({
        where:  { studentId_chapterId: { studentId, chapterId: ch.chapterId } },
        create: { studentId, chapterId: ch.chapterId, ...mainCreate, ...advCreate },
        update: { ...mainInc, ...advInc, updated_at: new Date() },
      });
    });
  }

  private writeSubjectAnalytics(
    tx:         PrismaClient,
    studentId:  string,
    subjectMap: Record<SubjectName, { subjectId: string; stats: SubjectStats }>,
  ) {
    return Object.values(subjectMap).map(({ subjectId, stats }) =>
      tx.subjectAnalytics.upsert({
        where:  { studentId_subjectId: { studentId, subjectId } },
        create: {
          studentId,
          subjectId,
          testAttempts:    stats.attempt,
          testTimeSpent:   stats.timeTaken,
          testMarksEarned: stats.marks,
          testMaxPossible: stats.positiveMarks,
        },
        update: {
          testAttempts:    { increment: stats.attempt },
          testTimeSpent:   { increment: stats.timeTaken },
          testMarksEarned: { increment: stats.marks },
          testMaxPossible: { increment: stats.positiveMarks },
          updated_at:      new Date(),
        },
      }),
    );
  }

  private writeStudentOverallAnalytics(
    tx:        PrismaClient,
    studentId: string,
    report:    SummaryReport,
  ) {
    const { overall, math, physics, chemistry } = report;
    const totalMarks = math.marks + physics.marks + chemistry.marks;
    const totalMax   = math.positiveMarks + physics.positiveMarks + chemistry.positiveMarks;

    return tx.studentOverallAnalytics.upsert({
      where:  { studentId },
      create: {
        studentId,
        testAttempts:       overall.totalAttempted,
        testTimeSpent:      overall.totalTimeTaken,
        testMarksEarned:    totalMarks,
        testMaxPossible:    totalMax,
        uniqueTestAttempts: overall.totalAttempted,
      },
      update: {
        testAttempts:       { increment: overall.totalAttempted },
        testTimeSpent:      { increment: overall.totalTimeTaken },
        testMarksEarned:    { increment: totalMarks },
        testMaxPossible:    { increment: totalMax },
        uniqueTestAttempts: { increment: overall.totalAttempted },
        updated_at:         new Date(),
      },
    });
  }

  private writeExamAnalytics(
    tx:        PrismaClient,
    studentId: string,
    report:    SummaryReport,
  ) {
    const { exam, overall, math, physics, chemistry } = report;
    const totalMarks = math.marks + physics.marks + chemistry.marks;
    const totalMax   = math.positiveMarks + physics.positiveMarks + chemistry.positiveMarks;

    return tx.examAnalytics.upsert({
      where:  { studentId_examName: { studentId, examName: exam } },
      create: {
        studentId,
        examName:        exam,
        testAttempts:    overall.totalAttempted,
        testTimeSpent:   overall.totalTimeTaken,
        testMarksEarned: totalMarks,
        testMaxPossible: totalMax,
        testsCompleted:  1,
      },
      update: {
        testAttempts:    { increment: overall.totalAttempted },
        testTimeSpent:   { increment: overall.totalTimeTaken },
        testMarksEarned: { increment: totalMarks },
        testMaxPossible: { increment: totalMax },
        testsCompleted:  { increment: 1 },
        updated_at:      new Date(),
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STREAK
  // ══════════════════════════════════════════════════════════════════════════

  async updateStreak(studentId: string): Promise<void> {
    const now          = new Date();
    const todayUTC     = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const yesterdayUTC = new Date(todayUTC);
    yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);

    await this.db.$transaction(async (tx) => {
      const todayLog = await tx.dailyActivityLog.findUnique({
        where: { studentId_date: { studentId, date: todayUTC } },
      });
      if (todayLog) return;

      await tx.dailyActivityLog.upsert({
        where:  { studentId_date: { studentId, date: todayUTC } },
        create: { studentId, date: todayUTC, questionsSolved: 1 },
        update: { questionsSolved: { increment: 1 } },
      });

      const profile = await tx.studentProfile.findUnique({
        where:  { id: studentId },
        select: { streak: true, maximumStreak: true },
      });
      if (!profile) throw new Error(`Profile not found: ${studentId}`);

      const yesterdayLog = await tx.dailyActivityLog.findUnique({
        where: { studentId_date: { studentId, date: yesterdayUTC } },
      });

      const newStreak    = yesterdayLog ? profile.streak + 1 : 1;
      const newMaxStreak = Math.max(newStreak, profile.maximumStreak);

      await tx.studentProfile.update({
        where: { id: studentId },
        data:  { streak: newStreak, maximumStreak: newMaxStreak },
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRACTICE ANALYTICS
  // ══════════════════════════════════════════════════════════════════════════

  async persistPracticeAnalytics(
    studentId: string,
    subjectId: string,
    result: {
      questionId:    string;
      verdict:       string;
      marks:         number;
      positiveMarks: number;
      type:          string;
      timeSpent:     number;
      userAnswer:    string[];
      isVisited:     boolean;
      chapterId:     string | null;
      examName:      string | null;
    },
  ): Promise<void> {
    if (!result.isVisited) return;

    const isCorrect = result.verdict === "correct";

    await this.db.$transaction(async (tx) => {
      const _tx    = tx as unknown as PrismaClient;
      const now    = new Date();
      const today  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

      await Promise.all([
        // Attempt record
        _tx.chapterWiseQuestionAttemptStatus.create({
          data: {
            questionId:     result.questionId,
            studentId,
            questionStatus: result.isVisited ? "answered" : "notAnswered",
            isCorrect,
            marksObtained:  result.marks,
            timeSpent:      result.timeSpent,
            userAnswer:     result.userAnswer,
            isAnalyzed:     true,
          },
        }),

        // Overall
        _tx.studentOverallAnalytics.upsert({
          where:  { studentId },
          create: {
            studentId,
            practiceAttempts:       1,
            practiceTimeSpent:      result.timeSpent,
            practiceMarksEarned:    result.marks,
            practiceMaxPossible:    result.positiveMarks,
            uniquePracticeAttempts: 1,
          },
          update: {
            practiceAttempts:       { increment: 1 },
            practiceTimeSpent:      { increment: result.timeSpent },
            practiceMarksEarned:    { increment: result.marks },
            practiceMaxPossible:    { increment: result.positiveMarks },
            uniquePracticeAttempts: { increment: 1 },
            updated_at: new Date(),
          },
        }),

        // Subject
        _tx.subjectAnalytics.upsert({
          where:  { studentId_subjectId: { studentId, subjectId } },
          create: {
            studentId,
            subjectId,
            practiceAttempts:    1,
            practiceTimeSpent:   result.timeSpent,
            practiceMarksEarned: result.marks,
            practiceMaxPossible: result.positiveMarks,
          },
          update: {
            practiceAttempts:    { increment: 1 },
            practiceTimeSpent:   { increment: result.timeSpent },
            practiceMarksEarned: { increment: result.marks },
            practiceMaxPossible: { increment: result.positiveMarks },
            updated_at: new Date(),
          },
        }),

        // Question type
        _tx.studentQuestionAnalytics.upsert({
          where:  { studentId_questioType: { studentId, questioType: result.type as questionType } },
          create: {
            studentId,
            questioType:         result.type as questionType,
            practiceAttempts:    1,
            practiceTimeSpent:   result.timeSpent,
            practiceMarksEarned: result.marks,
            practiceMaxPossible: result.positiveMarks,
          },
          update: {
            practiceAttempts:    { increment: 1 },
            practiceTimeSpent:   { increment: result.timeSpent },
            practiceMarksEarned: { increment: result.marks },
            practiceMaxPossible: { increment: result.positiveMarks },
            updated_at: new Date(),
          },
        }),

        // Daily log
        _tx.dailyActivityLog.upsert({
          where:  { studentId_date: { studentId, date: today } },
          create: {
            studentId,
            date:             today,
            questionsSolved:  1,
            questionsCorrect: isCorrect ? 1 : 0,
            timeSpent:        result.timeSpent,
          },
          update: {
            questionsSolved:  { increment: 1 },
            questionsCorrect: { increment: isCorrect ? 1 : 0 },
            timeSpent:        { increment: result.timeSpent },
          },
        }),

        // Chapter (only if both chapterId and examName present)
        result.chapterId && result.examName
          ? (() => {
              const isJeeMain     = result.examName === "JEE_MAIN";
              const isJeeAdvanced = result.examName === "JEE_ADVANCED";
              const isWrong       = result.verdict === "wrong";
              const isPartial     = result.verdict === "partial";

              const mainC = isJeeMain ? {
                practiceJeeMainAttempts:    1,
                practiceJeeMainTimeSpent:   result.timeSpent,
                practiceJeeMainMarksEarned: result.marks,
                practiceJeeMainMaxPossible: result.positiveMarks,
                practiceJeeMainCorrect:     isCorrect  ? 1 : 0,
                practiceJeeMainWrong:       isWrong    ? 1 : 0,
                practiceJeeMainPartial:     isPartial  ? 1 : 0,
              } : {};

              const advC = isJeeAdvanced ? {
                practiceJeeAdvancedAttempts:    1,
                practiceJeeAdvancedTimeSpent:   result.timeSpent,
                practiceJeeAdvancedMarksEarned: result.marks,
                practiceJeeAdvancedMaxPossible: result.positiveMarks,
                practiceJeeAdvancedCorrect:     isCorrect  ? 1 : 0,
                practiceJeeAdvancedWrong:       isWrong    ? 1 : 0,
                practiceJeeAdvancedPartial:     isPartial  ? 1 : 0,
              } : {};

              const mainU = isJeeMain ? {
                practiceJeeMainAttempts:    { increment: 1 },
                practiceJeeMainTimeSpent:   { increment: result.timeSpent },
                practiceJeeMainMarksEarned: { increment: result.marks },
                practiceJeeMainMaxPossible: { increment: result.positiveMarks },
                practiceJeeMainCorrect:     { increment: isCorrect  ? 1 : 0 },
                practiceJeeMainWrong:       { increment: isWrong    ? 1 : 0 },
                practiceJeeMainPartial:     { increment: isPartial  ? 1 : 0 },
              } : {};

              const advU = isJeeAdvanced ? {
                practiceJeeAdvancedAttempts:    { increment: 1 },
                practiceJeeAdvancedTimeSpent:   { increment: result.timeSpent },
                practiceJeeAdvancedMarksEarned: { increment: result.marks },
                practiceJeeAdvancedMaxPossible: { increment: result.positiveMarks },
                practiceJeeAdvancedCorrect:     { increment: isCorrect  ? 1 : 0 },
                practiceJeeAdvancedWrong:       { increment: isWrong    ? 1 : 0 },
                practiceJeeAdvancedPartial:     { increment: isPartial  ? 1 : 0 },
              } : {};

              return _tx.chapterAnalytics.upsert({
                where:  { studentId_chapterId: { studentId, chapterId: result.chapterId! } },
                create: { studentId, chapterId: result.chapterId!, ...mainC, ...advC },
                update: { ...mainU, ...advU, updated_at: new Date() },
              });
            })()
          : Promise.resolve(),
      ]);
    });
  }
}

export const analytics = new Analytics(database);