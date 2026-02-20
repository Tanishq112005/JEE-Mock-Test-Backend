import { PrismaClient, ExamName, SubjectName, questionType } from "@prisma/client";
import { database } from "../lib/database";
import { SubjectStats , QuestionTypeStat , ChapterStat , OverallStats , SummaryReport , SubjectIds} from "../types/analytics.types";

// ─────────────────────────────────────────────
// Analytics Class
// ─────────────────────────────────────────────

class Analytics {
  private db: PrismaClient;

  constructor(database: PrismaClient) {
    this.db = database;
  }

  // ══════════════════════════════════════════
  // READ OPERATIONS
  // ══════════════════════════════════════════

  async collectingTotalQuestion() {
    try {
      return await this.db.subjects.findMany();
    } catch (err: any) {
      throw err;
    }
  }

  async subjectAnanlytics(studentId: string) {
    try {
      return await this.db.subjectAnalytics.findMany({
        where: { studentId },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async studentOverAllAnalytics(studentId: string) {
    try {
      return await this.db.studentOverallAnalytics.findUnique({
        where: { studentId },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async questionWiseAnalytics(studentId: string) {
    try {
      return await this.db.studentQuestionAnalytics.findMany({
        where: { studentId },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async subjectWiseAnalytics(studentId: string) {
    try {
      return await this.db.subjectAnalytics.findMany({
        where: { studentId },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async testWiseData(studentId: string) {
    try {
      const rawTestData = await this.db.testAttemptSummary.findMany({
        where: { studentId },
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

      return rawTestData.map((test) => {
        const getSub = (name: "Mathematics" | "Physics" | "Chemistry") =>
          test.subjectResults.find((s) => s.subjectName === name);

        const math      = getSub("Mathematics");
        const physics   = getSub("Physics");
        const chemistry = getSub("Chemistry");

        const formattedQuestionTypes: Record<string, any> = {};
        test.questionTypeResults.forEach((qt) => {
          formattedQuestionTypes[qt.questionType] = this.formatStats(qt);
        });

        const examName = test.testStatus.papers.exam.name;
        const paper    = test.testStatus.papers;

        return {
          id:           test.id,
          testStatusId: test.testStatusId,
          exam:         examName,
          created_at:   test.created_at,
          math:         math      ? this.formatStats(math)      : null,
          physics:      physics   ? this.formatStats(physics)   : null,
          chemistry:    chemistry ? this.formatStats(chemistry) : null,
          overall: {
            totalScore:             test.totalScore,
            maxScore:               test.maxScore,
            percentage:             test.percentage,
            overallAccuracy:        test.accuracy,
            totalTimeTaken:         test.timeTaken,
            averageTimePerQuestion: test.avgTimePerQ,
          },
          paperMeta: {
            year:           paper.year,
            month:          paper.month,
            day:            paper.day,
            date:           paper.date,
            shift:          paper.shift,
            mode:           paper.mode,
            totalMarks:     paper.totalMarks,
            totalDuration:  paper.totalDuration,
            totalQuestions: paper.totalQuestions,
          },
          questionTypes: formattedQuestionTypes,
        };
      });
    } catch (err: any) {
      throw err;
    }
  }

  async getTestChapterSnapshots(studentId: string) {
    try {
      return await this.db.testChapterAnalytics.findMany({
        where:   { studentId },
        orderBy: { created_at: "desc" },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async chapterWiseAnalytics(studentId: string) {
    try {
      return await this.db.chapterAnalytics.findMany({
        where: { studentId },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async examWiseAnalytics(studentId: string) {
    try {
      return await this.db.examAnalytics.findMany({
        where: { studentId },
      });
    } catch (err: any) {
      throw err;
    }
  }

  // ══════════════════════════════════════════
  // WRITE OPERATIONS — small focused builders
  // ══════════════════════════════════════════

  // 1. TestAttemptSummary + SubjectTestResult[] + QuestionTypeTestResult[]
  private writeTestAttemptSummary(
    tx:           PrismaClient,
    testStatusId: string,
    studentId:    string,
    report:       SummaryReport,
  ) {
    const { overall, math, physics, chemistry, questionTypes } = report;

    const totalScore       = math.marks + physics.marks + chemistry.marks;
    const totalMaxPossible = math.totalQuestions + physics.totalQuestions + chemistry.totalQuestions;
    const percentage       = totalMaxPossible > 0 ? (totalScore / totalMaxPossible) * 100 : 0;

    const subjectRows = (
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
      partialMarks:   s.paritalMarks,
      negativeMarks:  s.negativeMarks,
      timeTaken:      s.timeTaken,
      accuracy:       s.accuracy,
    }));

    const qtRows = Object.entries(questionTypes).map(([type, qt]) => ({
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
        maxScore:    totalMaxPossible,
        percentage,
        accuracy:    overall.overallAccuracy,
        timeTaken:   overall.totalTimeTaken,
        avgTimePerQ: overall.averageTimePerQuestion,
        subjectResults:      { create: subjectRows },
        questionTypeResults: { create: qtRows },
      },
      update: {
        totalScore,
        maxScore:    totalMaxPossible,
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

  // 2. TestChapterAnalytics — one snapshot row per chapter per test
  private writeTestChapterSnapshots(
    tx:           PrismaClient,
    testStatusId: string,
    studentId:    string,
    examName:     ExamName,
    chapterWise:  ChapterStat[],
  ) {
    return chapterWise.map((ch) =>
      tx.testChapterAnalytics.upsert({
        where: {
          studentId_chapterId_testStatusId: { studentId, chapterId: ch.chapterId, testStatusId },
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
          maxPossible:    ch.totalQuestions,
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
          positiveMarks: ch.positiveMarks,
          partialMarks:  ch.partialMarks,
          negativeMarks: ch.negativeMarks,
          timeTaken:     ch.timeTaken,
          accuracy:      ch.accuracy,
        },
      }),
    );
  }

  // 3. ChapterAnalytics — cumulative aggregate, split by exam type
  private writeChapterAnalytics(
    tx:          PrismaClient,
    studentId:   string,
    examName:    ExamName,
    chapterWise: ChapterStat[],
  ) {
    const isJeeMain     = examName === "JEE_MAIN";
    const isJeeAdvanced = examName === "JEE_ADVANCED";

    return chapterWise.map((ch) => {
      const jeeMainCreate = isJeeMain
        ? {
            testJeeMainAttempts:    ch.attempt,
            testJeeMainTimeSpent:   ch.timeTaken,
            testJeeMainMarksEarned: ch.marks,
            testJeeMainMaxPossible: ch.totalQuestions,
            testJeeMainCorrect:     ch.correct,
            testJeeMainWrong:       ch.wrong,
            testJeeMainPartial:     ch.partial,
          }
        : {};

      const jeeAdvancedCreate = isJeeAdvanced
        ? {
            testJeeAdvancedAttempts:    ch.attempt,
            testJeeAdvancedTimeSpent:   ch.timeTaken,
            testJeeAdvancedMarksEarned: ch.marks,
            testJeeAdvancedMaxPossible: ch.totalQuestions,
            testJeeAdvancedCorrect:     ch.correct,
            testJeeAdvancedWrong:       ch.wrong,
            testJeeAdvancedPartial:     ch.partial,
          }
        : {};

      const jeeMainIncrement = isJeeMain
        ? {
            testJeeMainAttempts:    { increment: ch.attempt },
            testJeeMainTimeSpent:   { increment: ch.timeTaken },
            testJeeMainMarksEarned: { increment: ch.marks },
            testJeeMainMaxPossible: { increment: ch.totalQuestions },
            testJeeMainCorrect:     { increment: ch.correct },
            testJeeMainWrong:       { increment: ch.wrong },
            testJeeMainPartial:     { increment: ch.partial },
          }
        : {};

      const jeeAdvancedIncrement = isJeeAdvanced
        ? {
            testJeeAdvancedAttempts:    { increment: ch.attempt },
            testJeeAdvancedTimeSpent:   { increment: ch.timeTaken },
            testJeeAdvancedMarksEarned: { increment: ch.marks },
            testJeeAdvancedMaxPossible: { increment: ch.totalQuestions },
            testJeeAdvancedCorrect:     { increment: ch.correct },
            testJeeAdvancedWrong:       { increment: ch.wrong },
            testJeeAdvancedPartial:     { increment: ch.partial },
          }
        : {};

      return tx.chapterAnalytics.upsert({
        where:  { studentId_chapterId: { studentId, chapterId: ch.chapterId } },
        create: { studentId, chapterId: ch.chapterId, ...jeeMainCreate, ...jeeAdvancedCreate },
        update: { ...jeeMainIncrement, ...jeeAdvancedIncrement, updated_at: new Date() },
      });
    });
  }

  // 4. SubjectAnalytics — per subject cumulative
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
          testAttempts:       stats.attempt,
          testTimeSpent:      stats.timeTaken,
          testMarksEarned:    stats.marks,
          testMaxPossible:    stats.totalQuestions,
        },
        update: {
          testAttempts:    { increment: stats.attempt },
          testTimeSpent:   { increment: stats.timeTaken },
          testMarksEarned: { increment: stats.marks },
          testMaxPossible: { increment: stats.totalQuestions },
          updated_at:      new Date(),
        },
      }),
    );
  }

  // 5. StudentOverallAnalytics — global cumulative
  private writeStudentOverallAnalytics(
    tx:        PrismaClient,
    studentId: string,
    report:    SummaryReport,
  ) {
    const { overall, math, physics, chemistry } = report;
    const totalMarks       = math.marks + physics.marks + chemistry.marks;
    const totalMaxPossible = math.totalQuestions + physics.totalQuestions + chemistry.totalQuestions;

    return tx.studentOverallAnalytics.upsert({
      where:  { studentId },
      create: {
        studentId,
        testAttempts:       overall.totalAttempted,
        testTimeSpent:      overall.totalTimeTaken,
        testMarksEarned:    totalMarks,
        testMaxPossible:    totalMaxPossible,
        uniqueTestAttempts: overall.totalAttempted,
      },
      update: {
        testAttempts:       { increment: overall.totalAttempted },
        testTimeSpent:      { increment: overall.totalTimeTaken },
        testMarksEarned:    { increment: totalMarks },
        testMaxPossible:    { increment: totalMaxPossible },
        uniqueTestAttempts: { increment: overall.totalAttempted },
        updated_at:         new Date(),
      },
    });
  }

  // 6. ExamAnalytics — per exam cumulative
  private writeExamAnalytics(
    tx:        PrismaClient,
    studentId: string,
    report:    SummaryReport,
  ) {
    const { exam, overall, math, physics, chemistry } = report;
    const totalMarks       = math.marks + physics.marks + chemistry.marks;
    const totalMaxPossible = math.totalQuestions + physics.totalQuestions + chemistry.totalQuestions;

    return tx.examAnalytics.upsert({
      where:  { studentId_examName: { studentId, examName: exam } },
      create: {
        studentId,
        examName:        exam,
        testAttempts:    overall.totalAttempted,
        testTimeSpent:   overall.totalTimeTaken,
        testMarksEarned: totalMarks,
        testMaxPossible: totalMaxPossible,
        testsCompleted:  1,
      },
      update: {
        testAttempts:    { increment: overall.totalAttempted },
        testTimeSpent:   { increment: overall.totalTimeTaken },
        testMarksEarned: { increment: totalMarks },
        testMaxPossible: { increment: totalMaxPossible },
        testsCompleted:  { increment: 1 },
        updated_at:      new Date(),
      },
    });
  }

  // ══════════════════════════════════════════
  // STREAK MANAGEMENT
  // ══════════════════════════════════════════

  // Call this every time a student solves any problem (practice or test).
  // - If the student already solved something today → no-op (streak already counted).
  // - If the student solved something yesterday → streak continues, increment it.
  // - If the student missed a day or more → streak resets to 1.
  // - maximumStreak is updated whenever the current streak beats it.
  async updateStreak(studentId: string): Promise<void> {
    try {
      // Normalize "today" and "yesterday" to midnight UTC so time-of-day is irrelevant
      const now       = new Date();
      const todayUTC  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const yesterdayUTC = new Date(todayUTC);
      yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);

      await this.db.$transaction(async (tx) => {
        // 1. Check if the student already has activity logged for today
        const todayLog = await tx.dailyActivityLog.findUnique({
          where: {
            studentId_date: { studentId, date: todayUTC },
          },
        });

        // Already solved something today — streak was already incremented, nothing to do
        if (todayLog) return;

        // 2. First problem of the day — upsert today's activity log
        await tx.dailyActivityLog.upsert({
          where:  { studentId_date: { studentId, date: todayUTC } },
          create: { studentId, date: todayUTC, questionsSolved: 1 },
          update: { questionsSolved: { increment: 1 } },
        });

        // 3. Fetch current streak state from profile
        const profile = await tx.studentProfile.findUnique({
          where:  { id: studentId },
          select: { streak: true, maximumStreak: true },
        });

        if (!profile) throw new Error(`Student profile not found: ${studentId}`);

        // 4. Check if the student solved something yesterday (streak is alive)
        const yesterdayLog = await tx.dailyActivityLog.findUnique({
          where: {
            studentId_date: { studentId, date: yesterdayUTC },
          },
        });

        // Streak continues if yesterday had activity, otherwise reset to 1
        const newStreak = yesterdayLog ? profile.streak + 1 : 1;

        // Maximum streak is the higher of the two
        const newMaximumStreak = Math.max(newStreak, profile.maximumStreak);

        // 5. Persist updated streak back to the profile
        await tx.studentProfile.update({
          where: { id: studentId },
          data:  {
            streak:        newStreak,
            maximumStreak: newMaximumStreak,
          },
        });
      });
    } catch (err: any) {
      throw err;
    }
  }

  // ══════════════════════════════════════════
  // COMBINED TRANSACTION — orchestrates all
  // write operations in a single atomic call
  // ══════════════════════════════════════════
  async persistTestAnalytics(
    testStatusId: string,
    studentId:    string,
    report:       SummaryReport,
) {
    const { exam, math, physics, chemistry, chapterWise } = report;

    // ── Fetch subjectIds internally ──────────────────────────────────
    const subjects = await this.db.subjects.findMany({
        select: { id: true, name: true },
    });

    const subjectIdMap: Record<string, string> = {};
    for (const s of subjects) {
        subjectIdMap[s.name] = s.id;
    }

    const mathematicsId = subjectIdMap['Mathematics'];
    const physicsId     = subjectIdMap['Physics'];
    const chemistryId   = subjectIdMap['Chemistry'];

    if (!mathematicsId || !physicsId || !chemistryId) {
        throw new Error('One or more subjects not found in DB');
    }

    const subjectMap: Record<SubjectName, { subjectId: string; stats: SubjectStats }> = {
        Mathematics: { subjectId: mathematicsId, stats: math },
        Physics:     { subjectId: physicsId,     stats: physics },
        Chemistry:   { subjectId: chemistryId,   stats: chemistry },
    };

    await this.db.$transaction(async (tx) => {
        const _tx = tx as unknown as PrismaClient;

        await Promise.all(
            this.writeChapterAnalytics(_tx, studentId, exam, chapterWise),
        );

        // 3. ✅ FIX: Now write TestChapterSnapshots (Child records will now find their parents)
        await Promise.all(
            this.writeTestChapterSnapshots(_tx, testStatusId, studentId, exam, chapterWise),
        );

        await Promise.all(
            this.writeChapterAnalytics(_tx, studentId, exam, chapterWise),
        );

        await Promise.all(
            this.writeSubjectAnalytics(_tx, studentId, subjectMap),
        );

        await this.writeStudentOverallAnalytics(_tx, studentId, report);

        await this.writeExamAnalytics(_tx, studentId, report);

        await tx.testStatus.update({
            where: { id: testStatusId },
            data:  { isAnalyzed: true, updated_at: new Date() },
        });
    } , {
        maxWait: 5000,  // Time to wait to acquire the transaction lock (default 2000ms)
        timeout: 30000  // Increase timeout to 30 seconds (default is 5000ms)
    });
}

  // ══════════════════════════════════════════
  // PRACTICE ANALYTICS WRITE
  // ══════════════════════════════════════════

  // Input shape — comes from practiceQuestionEvaluationService result
  // verdict: "correct" | "partial" | "wrong" | "unattempted"

  private writePracticeAttemptRecord(
    tx:          PrismaClient,
    studentId:   string,
    questionId:  string,
    verdict:     string,
    marks:       number,
    timeSpent:   number,
    userAnswer:  string[],
    isVisited:   boolean,
  ) {
    return tx.chapterWiseQuestionAttemptStatus.create({
      data: {
        questionId,
        studentId,
        questionStatus: isVisited ? "answered" : "notAnswered",
        isCorrect:      verdict === "correct",
        marksObtained:  marks,
        timeSpent,
        userAnswer,
        isAnalyzed:     true,
      },
    });
  }
  
  async getFullTestSummaryReport(testStatusId: string, studentId: string) {
  try {
    const testSummary = await this.db.testAttemptSummary.findFirst({
      where: { testStatusId, studentId },
      include: {
        subjectResults:      true,
        questionTypeResults: true,
        testStatus: {
          include: {
            papers: {
              include: { exam: true },
            },
            testQuestionStatus: true,
          },
        },
      },
    });

    if (!testSummary) return null;

    // ── Subject results ──────────────────────────────────────────────
    const getSub = (name: "Mathematics" | "Physics" | "Chemistry") =>
      testSummary.subjectResults.find((s) => s.subjectName === name);

    const math      = getSub("Mathematics");
    const physics   = getSub("Physics");
    const chemistry = getSub("Chemistry");

    const buildSubjectStat = (s: typeof math) => s ? {
      totalQuestions: s.totalQuestions,
      attempt:        s.attempted,
      marks:          s.marks,
      timeTaken:      s.timeTaken,
      positiveMarks:  s.positiveMarks,
      paritalMarks:   s.partialMarks,
      negativeMarks:  s.negativeMarks,
      correct:        s.correct,
      partial:        s.partial,
      wrong:          s.wrong,
      accuracy:       s.accuracy,
    } : null;

    // ── Question type results ────────────────────────────────────────
    const questionTypes: Record<string, any> = {};
    testSummary.questionTypeResults.forEach((qt) => {
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
    });

    // ── Chapter wise breakdown ───────────────────────────────────────
    const chapterSnapshots = await this.db.testChapterAnalytics.findMany({
      where:   { testStatusId, studentId },
      orderBy: { created_at: "asc" },
    });

    const chapterWise = chapterSnapshots.map((ch) => ({
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
    }));

    // ── Final verdict (per-question attempt details) ─────────────────
    const questionAttempts = testSummary.testStatus.testQuestionStatus;

    const finalVerdict = questionAttempts.map((q) => ({
      questionId:      q.questionId,
      isVisited:       q.isVisited,
      timeSpent:       q.timeSpent,
      markedForReview: q.markedForReview,
      userAnswer:      q.userAnswer,
      verdict:         q.isCorrect ? "correct" : q.marksObtained > 0 ? "partial" : "wrong",
      marks:           q.marksObtained,
    }));

    // ── Paper meta ───────────────────────────────────────────────────
    const paper    = testSummary.testStatus.papers;
    const examName = paper.exam.name;

    const mathStats      = buildSubjectStat(math);
    const physicsStats   = buildSubjectStat(physics);
    const chemistryStats = buildSubjectStat(chemistry);

    return {
      exam:       examName,
      created_at: testSummary.created_at,

      math:       mathStats,
      physics:    physicsStats,
      chemistry:  chemistryStats,

      overall: {
        totalQuestions:         (math?.totalQuestions ?? 0) + (physics?.totalQuestions ?? 0) + (chemistry?.totalQuestions ?? 0),
        totalAttempted:         (math?.attempted ?? 0) + (physics?.attempted ?? 0) + (chemistry?.attempted ?? 0),
        totalCorrect:           (math?.correct ?? 0) + (physics?.correct ?? 0) + (chemistry?.correct ?? 0),
        totalPartial:           (math?.partial ?? 0) + (physics?.partial ?? 0) + (chemistry?.partial ?? 0),
        overallAccuracy:        testSummary.accuracy,
        totalTimeTaken:         testSummary.timeTaken,
        averageTimePerQuestion: testSummary.avgTimePerQ,
        totalScore:             testSummary.totalScore,
        maxScore:               testSummary.maxScore,
        percentage:             testSummary.percentage,
      },

      questionTypes,
      chapterWise,
      finalVerdict,

      paperMeta: {
        year:           paper.year,
        month:          paper.month,
        day:            paper.day,
        date:           paper.date,
        shift:          paper.shift,
        mode:           paper.mode,
        totalMarks:     paper.totalMarks,
        totalDuration:  paper.totalDuration,
        totalQuestions: paper.totalQuestions,
      },
    };
  } catch (err: any) {
    throw err;
  }
}

  private writePracticeOverallAnalytics(
    tx:        PrismaClient,
    studentId: string,
    marks:     number,
    maxMarks:  number,
    timeSpent: number,
  ) {
    return tx.studentOverallAnalytics.upsert({
      where:  { studentId },
      create: {
        studentId,
        practiceAttempts:       1,
        practiceTimeSpent:      timeSpent,
        practiceMarksEarned:    marks,
        practiceMaxPossible:    maxMarks,
        uniquePracticeAttempts: 1,
      },
      update: {
        practiceAttempts:       { increment: 1 },
        practiceTimeSpent:      { increment: timeSpent },
        practiceMarksEarned:    { increment: marks },
        practiceMaxPossible:    { increment: maxMarks },
        uniquePracticeAttempts: { increment: 1 },
        updated_at:             new Date(),
      },
    });
  }

  private writePracticeSubjectAnalytics(
    tx:        PrismaClient,
    studentId: string,
    subjectId: string,
    marks:     number,
    maxMarks:  number,
    timeSpent: number,
  ) {
    return tx.subjectAnalytics.upsert({
      where:  { studentId_subjectId: { studentId, subjectId } },
      create: {
        studentId,
        subjectId,
        practiceAttempts:    1,
        practiceTimeSpent:   timeSpent,
        practiceMarksEarned: marks,
        practiceMaxPossible: maxMarks,
      },
      update: {
        practiceAttempts:    { increment: 1 },
        practiceTimeSpent:   { increment: timeSpent },
        practiceMarksEarned: { increment: marks },
        practiceMaxPossible: { increment: maxMarks },
        updated_at:          new Date(),
      },
    });
  }

  private writePracticeChapterAnalytics(
    tx:        PrismaClient,
    studentId: string,
    chapterId: string,
    examName:  string,
    verdict:   string,
    marks:     number,
    maxMarks:  number,
    timeSpent: number,
  ) {
    const isCorrect     = verdict === "correct";
    const isWrong       = verdict === "wrong";
    const isPartial     = verdict === "partial";
    const isJeeMain     = examName === "JEE_MAIN";
    const isJeeAdvanced = examName === "JEE_ADVANCED";

    const jeeMainCreate = isJeeMain ? {
      practiceJeeMainAttempts:    1,
      practiceJeeMainTimeSpent:   timeSpent,
      practiceJeeMainMarksEarned: marks,
      practiceJeeMainMaxPossible: maxMarks,
      practiceJeeMainCorrect:     isCorrect ? 1 : 0,
      practiceJeeMainWrong:       isWrong   ? 1 : 0,
      practiceJeeMainPartial:     isPartial ? 1 : 0,
    } : {};

    const jeeAdvancedCreate = isJeeAdvanced ? {
      practiceJeeAdvancedAttempts:    1,
      practiceJeeAdvancedTimeSpent:   timeSpent,
      practiceJeeAdvancedMarksEarned: marks,
      practiceJeeAdvancedMaxPossible: maxMarks,
      practiceJeeAdvancedCorrect:     isCorrect ? 1 : 0,
      practiceJeeAdvancedWrong:       isWrong   ? 1 : 0,
      practiceJeeAdvancedPartial:     isPartial ? 1 : 0,
    } : {};

    const jeeMainUpdate = isJeeMain ? {
      practiceJeeMainAttempts:    { increment: 1 },
      practiceJeeMainTimeSpent:   { increment: timeSpent },
      practiceJeeMainMarksEarned: { increment: marks },
      practiceJeeMainMaxPossible: { increment: maxMarks },
      practiceJeeMainCorrect:     { increment: isCorrect ? 1 : 0 },
      practiceJeeMainWrong:       { increment: isWrong   ? 1 : 0 },
      practiceJeeMainPartial:     { increment: isPartial ? 1 : 0 },
    } : {};

    const jeeAdvancedUpdate = isJeeAdvanced ? {
      practiceJeeAdvancedAttempts:    { increment: 1 },
      practiceJeeAdvancedTimeSpent:   { increment: timeSpent },
      practiceJeeAdvancedMarksEarned: { increment: marks },
      practiceJeeAdvancedMaxPossible: { increment: maxMarks },
      practiceJeeAdvancedCorrect:     { increment: isCorrect ? 1 : 0 },
      practiceJeeAdvancedWrong:       { increment: isWrong   ? 1 : 0 },
      practiceJeeAdvancedPartial:     { increment: isPartial ? 1 : 0 },
    } : {};

    return tx.chapterAnalytics.upsert({
      where:  { studentId_chapterId: { studentId, chapterId } },
      create: { studentId, chapterId, ...jeeMainCreate, ...jeeAdvancedCreate },
      update: { ...jeeMainUpdate, ...jeeAdvancedUpdate, updated_at: new Date() },
    });
  }

  private writePracticeQuestionTypeAnalytics(
    tx:           PrismaClient,
    studentId:    string,
    questionType: string,
    marks:        number,
    maxMarks:     number,
    timeSpent:    number,
  ) {
    return tx.studentQuestionAnalytics.upsert({
      where:  { studentId_questioType: { studentId, questioType: questionType as any } },
      create: {
        studentId,
        questioType:         questionType as any,
        practiceAttempts:    1,
        practiceTimeSpent:   timeSpent,
        practiceMarksEarned: marks,
        practiceMaxPossible: maxMarks,
      },
      update: {
        practiceAttempts:    { increment: 1 },
        practiceTimeSpent:   { increment: timeSpent },
        practiceMarksEarned: { increment: marks },
        practiceMaxPossible: { increment: maxMarks },
        updated_at:          new Date(),
      },
    });
  }

  private writePracticeDailyLog(
    tx:        PrismaClient,
    studentId: string,
    isCorrect: boolean,
    timeSpent: number,
  ) {
    const now      = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    return tx.dailyActivityLog.upsert({
      where:  { studentId_date: { studentId, date: todayUTC } },
      create: {
        studentId,
        date:             todayUTC,
        questionsSolved:  1,
        questionsCorrect: isCorrect ? 1 : 0,
        timeSpent,
      },
      update: {
        questionsSolved:  { increment: 1 },
        questionsCorrect: { increment: isCorrect ? 1 : 0 },
        timeSpent:        { increment: timeSpent },
      },
    });
  }

  // Combined transaction — call this with the result from practiceQuestionEvaluationService
  async persistPracticeAnalytics(
    studentId:  string,
    subjectId:  string,             // pass subject id from subjects table
    result: {
      questionId:    string;
      verdict:       string;
      marks:         number;
      positiveMarks: number;       // used as maxMarks
      type:          string;
      timeSpent:     number;
      userAnswer:    string[];
      isVisited:     boolean;
      chapterId:     string | null;
      examName:      string | null;
    },
  ): Promise<void> {
    // Unattempted questions — nothing to persist
    if (!result.isVisited) return;

    const isCorrect = result.verdict === "correct";

    await this.db.$transaction(async (tx) => {
      const _tx = tx as unknown as PrismaClient;

      await Promise.all([
        // 1. Raw attempt record
        this.writePracticeAttemptRecord(
          _tx, studentId, result.questionId,
          result.verdict, result.marks,
          result.timeSpent, result.userAnswer, result.isVisited,
        ),

        // 2. Overall analytics
        this.writePracticeOverallAnalytics(
          _tx, studentId,
          result.marks, result.positiveMarks, result.timeSpent,
        ),

        // 3. Subject analytics
        this.writePracticeSubjectAnalytics(
          _tx, studentId, subjectId,
          result.marks, result.positiveMarks, result.timeSpent,
        ),

        // 4. Chapter analytics (only if question belongs to a chapter and has an exam)
        result.chapterId && result.examName
          ? this.writePracticeChapterAnalytics(
              _tx, studentId, result.chapterId, result.examName,
              result.verdict, result.marks, result.positiveMarks, result.timeSpent,
            )
          : Promise.resolve(),

        // 5. Question type analytics
        this.writePracticeQuestionTypeAnalytics(
          _tx, studentId, result.type,
          result.marks, result.positiveMarks, result.timeSpent,
        ),

        // 6. Daily activity log
        this.writePracticeDailyLog(_tx, studentId, isCorrect, result.timeSpent),
      ]);
    });
  }

  // ══════════════════════════════════════════
  // PRIVATE HELPERS
  // ══════════════════════════════════════════

  private formatStats(statBlock: any) {
    return {
      totalQuestions: statBlock.totalQuestions,
      attempt:        statBlock.attempted,
      marks:          statBlock.marks,
      timeTaken:      statBlock.timeTaken,
      positiveMarks:  statBlock.positiveMarks,
      paritalMarks:   statBlock.partialMarks, // keeping typo for consistency
      negativeMarks:  statBlock.negativeMarks,
      correct:        statBlock.correct,
      partial:        statBlock.partial,
      wrong:          statBlock.wrong,
      accuracy:       statBlock.accuracy,
    };
  }
}

export const analytics = new Analytics(database);
