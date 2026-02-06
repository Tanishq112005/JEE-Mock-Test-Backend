import {
  PrismaClient,
  SubjectName,
  ExamName,
  TestState,
  questionType,
} from "@prisma/client";
import { database } from "../lib/database";

class AnalyticsService {
  private db: PrismaClient;

  constructor(database: PrismaClient) {
    this.db = database;
  }

  // ... (Keep updateStreak and updateGlobalRanks as they are) ...
  
  async updateStreak(studentId: string) {
    // ... [Use the code from the previous correct response] ...
    // Included for context, but hidden to save space in this snippet
    // (Ensure you use the version that handles the 0 reset logic we discussed)
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [todaysTest, todaysPractice] = await Promise.all([
        this.db.testStatus.count({ where: { studentId, updated_at: { gte: today } } }),
        this.db.chapterWiseQuestionAttemptStatus.count({ where: { studentId, created_at: { gte: today } } }),
      ]);

      const totalActivitiesToday = todaysTest + todaysPractice;
      if (totalActivitiesToday === 0) return; 
      if (totalActivitiesToday > 1) return;

      const [lastTest, lastPractice, profile] = await Promise.all([
        this.db.testStatus.findFirst({
          where: { studentId, updated_at: { lt: today } },
          orderBy: { updated_at: "desc" },
          select: { updated_at: true },
        }),
        this.db.chapterWiseQuestionAttemptStatus.findFirst({
          where: { studentId, created_at: { lt: today } },
          orderBy: { created_at: "desc" },
          select: { created_at: true },
        }),
        this.db.studentProfile.findUnique({
          where: { user_id: studentId },
          select: { streak: true, maximumStreak: true },
        }),
      ]);

      if (!profile) return;

      const testTime = lastTest?.updated_at.getTime() || 0;
      const practiceTime = lastPractice?.created_at.getTime() || 0;
      const lastActivityTime = Math.max(testTime, practiceTime);

      let newStreak = 1;

      if (lastActivityTime > 0) {
        const lastDate = new Date(lastActivityTime);
        lastDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil(Math.abs(today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) newStreak = Number(profile.streak) + 1;
        else newStreak = 1;
      }

      const newMaxStreak = Math.max(newStreak, Number(profile.maximumStreak));
      if (newStreak !== Number(profile.streak)) {
        await this.db.studentProfile.update({
          where: { user_id: studentId },
          data: { streak: newStreak, maximumStreak: newMaxStreak },
        });
      }
    } catch (err) {
      console.error("Streak Update Error:", err);
    }
  }

  async updateGlobalRanks() {
     // ... (Keep existing logic) ...
     // Included for completeness
     try {
      const subjects = await this.db.subjects.findMany();
      const mathId = subjects.find((s) => s.name === SubjectName.Mathematics)?.id;
      const phyId = subjects.find((s) => s.name === SubjectName.Physics)?.id;
      const chemId = subjects.find((s) => s.name === SubjectName.Chemistry)?.id;

      const allStudents = await this.db.studentProfile.findMany({
        select: {
          id: true,
          overallAnalytics: { select: { totalAttempted: true, totalCorrect: true } },
          examAnalytics: { where: { examName: ExamName.JEE_ADVANCED }, select: { totalAttempted: true } },
          subjectAnalytics: { select: { subjectId: true, totalAttempted: true } },
        },
      });

      const rankedList = allStudents.map((student) => {
        const totalSolved = student.overallAnalytics?.totalAttempted || 0;
        const totalCorrect = student.overallAnalytics?.totalCorrect || 0;
        const totalWrong = totalSolved - totalCorrect;
        const errorRatio = totalCorrect === 0 ? 999999 : totalWrong / totalCorrect;
        const advSolved = student.examAnalytics[0]?.totalAttempted || 0;
        const mathSolved = student.subjectAnalytics.find((s) => s.subjectId === mathId)?.totalAttempted || 0;
        const phySolved = student.subjectAnalytics.find((s) => s.subjectId === phyId)?.totalAttempted || 0;
        const chemSolved = student.subjectAnalytics.find((s) => s.subjectId === chemId)?.totalAttempted || 0;

        return { id: student.id, totalSolved, advSolved, mathSolved, phySolved, chemSolved, errorRatio };
      });

      rankedList.sort((a, b) => {
        if (b.totalSolved !== a.totalSolved) return b.totalSolved - a.totalSolved;
        if (b.advSolved !== a.advSolved) return b.advSolved - a.advSolved;
        if (b.mathSolved !== a.mathSolved) return b.mathSolved - a.mathSolved;
        if (b.phySolved !== a.phySolved) return b.phySolved - a.phySolved;
        if (b.chemSolved !== a.chemSolved) return b.chemSolved - a.chemSolved;
        return a.errorRatio - b.errorRatio;
      });

      const updates = rankedList.map((student, index) => {
        return this.db.studentProfile.update({
          where: { id: student.id },
          data: { rank: index + 1 },
        });
      });

      await this.db.$transaction(updates);
      console.log(`✅ Global Ranks Updated for ${updates.length} students.`);
    } catch (err) {
      console.error("❌ Global Rank Update Failed:", err);
    }
  }

  // =====================================================================
  // 🧠 HELPER: Check History to prevent Double Counting
  // Returns a Set of Question IDs the user has ALREADY attempted before
  // =====================================================================
  private async getExistingAttempts(studentId: string, questionIds: string[], excludeAttemptIds: string[] = []): Promise<Set<string>> {
    // 1. Check previous Practice attempts
    const practiceHistory = await this.db.chapterWiseQuestionAttemptStatus.findMany({
      where: {
        studentId,
        questionId: { in: questionIds },
        id: { notIn: excludeAttemptIds } // Don't count the current session itself
      },
      select: { questionId: true }
    });

    // 2. Check previous Test attempts
    const testHistory = await this.db.testQuestionAttemptStatus.findMany({
        where: {
            testStatus: { studentId: studentId }, // Join to filter by student
            questionId: { in: questionIds },
            id: { notIn: excludeAttemptIds }
        },
        select: { questionId: true }
    });

    const attemptedSet = new Set<string>();
    practiceHistory.forEach(p => attemptedSet.add(p.questionId));
    testHistory.forEach(t => attemptedSet.add(t.questionId));

    return attemptedSet;
  }

  /**
   * ==========================================
   * 3. DATA PROCESSOR: TEST SUBMISSION
   * ==========================================
   */
  async processTestSubmission(testStatusId: string) {
    // 1. Fetch Test Data
    const test = await this.db.testStatus.findUnique({
      where: { id: testStatusId },
      include: {
        testQuestionStatus: {
          include: { questions: { include: { chapters: true, subjects: true } } },
        },
        papers: { include: { exam: true } },
        user: true,
      },
    });

    if (!test || test.isAnalyzed || test.status !== TestState.COMPLETED) return;

    const studentId = test.studentId;
    const examName = test.papers.exam.name;

    // 2. CHECK HISTORY (Batch)
    // We get all question IDs from this test to check if they were solved before.
    const allQuestionIds = test.testQuestionStatus.map(q => q.questionId);
    const allAttemptIds = test.testQuestionStatus.map(q => q.id); // Exclude current attempts from history check
    
    const previouslyAttempted = await this.getExistingAttempts(studentId, allQuestionIds, allAttemptIds);

    // 3. Aggregators
    const subjectStats = new Map();
    const chapterStats = new Map();
    const typeStats = new Map();
    let overall = { attempted: 0, correct: 0, partial: 0, earned: 0, max: 0, time: 0 };

    for (const attempt of test.testQuestionStatus) {
      if (attempt.status !== "answered" && attempt.status !== "markedForReview") continue;

      const q = attempt.questions;
      
      // --- LOGIC: IS THIS NEW? ---
      const isNew = !previouslyAttempted.has(q.id); // If NOT in history, it's new.

      // Values
      const earned = attempt.marksObtained;
      const max = q.positiveMarks;
      const time = attempt.timeSpent; // Time is ALWAYS counted
      const isFullCorrect = attempt.isCorrect;
      const isPartial = !isFullCorrect && earned > 0;

      // --- CALCULATE DELTAS ---
      // We only add to 'Attempted', 'Correct', 'Marks' if it's a NEW UNIQUE question.
      // We ALWAYS add 'Time' because effort is real.
      
      const deltaAttempted = isNew ? 1 : 0;
      const deltaCorrect = (isNew && isFullCorrect) ? 1 : 0;
      const deltaPartial = (isNew && isPartial) ? 1 : 0;
      const deltaEarned = isNew ? earned : 0;
      const deltaMax = isNew ? max : 0;
      const deltaTime = time; // Always increment time

      // Aggregate Overall
      overall.attempted += deltaAttempted;
      overall.earned += deltaEarned;
      overall.max += deltaMax;
      overall.time += deltaTime; // Efficiency calculation in dashboard will update: (OldMarks + NewDeltaMarks) / (OldMax + NewDeltaMax)
      if (deltaCorrect) overall.correct++;
      if (deltaPartial) overall.partial++;

      // Helper for Maps
      const updateStats = (map: Map<any, any>, key: any) => {
        const entry = map.get(key) || { attempted: 0, earned: 0, max: 0, time: 0, correct: 0, partial: 0 };
        entry.attempted += deltaAttempted;
        entry.earned += deltaEarned;
        entry.max += deltaMax;
        entry.time += deltaTime; // Always add time
        if (deltaCorrect) entry.correct++;
        if (deltaPartial) entry.partial++;
        map.set(key, entry);
      };

      updateStats(subjectStats, q.subjectId);
      if (q.chapterId) updateStats(chapterStats, q.chapterId);
      updateStats(typeStats, q.type);
    }

    const operations: any[] = [];

    // A. Overall
    operations.push(
      this.db.studentOverallAnalytics.upsert({
        where: { studentId },
        create: {
          studentId,
          totalAttempted: overall.attempted,
          totalCorrect: overall.correct,
          totalPartial: overall.partial,
          totalMarksEarned: overall.earned,
          maxPossibleMarks: overall.max,
          totalTimeSpent: overall.time,
        },
        update: {
          totalAttempted: { increment: overall.attempted },
          totalCorrect: { increment: overall.correct },
          totalPartial: { increment: overall.partial },
          totalMarksEarned: { increment: overall.earned },
          maxPossibleMarks: { increment: overall.max },
          totalTimeSpent: { increment: overall.time },
        },
      }),
    );

    // B. Exam (e.g. JEE Main vs Adv)
    operations.push(
      this.db.examAnalytics.upsert({
        where: { studentId_examName: { studentId, examName } },
        create: {
          studentId,
          examName,
          totalAttempted: overall.attempted,
          totalMarksEarned: overall.earned,
          testsCompleted: 1, // This is "Tests Taken", so we ALWAYS increment this, even if questions were repeats.
        },
        update: {
          totalAttempted: { increment: overall.attempted },
          totalMarksEarned: { increment: overall.earned },
          testsCompleted: { increment: 1 },
        },
      }),
    );

    // C. Subjects
    for (const [id, d] of subjectStats) {
      operations.push(
        this.db.subjectAnalytics.upsert({
          where: { studentId_subjectId: { studentId, subjectId: id } },
          create: {
            studentId, subjectId: id,
            totalAttempted: d.attempted, totalCorrect: d.correct,
            totalMarksEarned: d.earned, maxPossibleMarks: d.max, totalTimeSpent: d.time,
          },
          update: {
            totalAttempted: { increment: d.attempted }, totalCorrect: { increment: d.correct },
            totalMarksEarned: { increment: d.earned }, maxPossibleMarks: { increment: d.max }, totalTimeSpent: { increment: d.time },
          },
        }),
      );
    }

    // D. Chapters
    for (const [id, d] of chapterStats) {
      operations.push(
        this.db.chapterAnalytics.upsert({
          where: { studentId_chapterId: { studentId, chapterId: id } },
          create: {
            studentId, chapterId: id,
            testAttempted: d.attempted, testCorrect: d.correct,
            totalMarksEarned: d.earned, maxPossibleMarks: d.max, totalTimeSpent: d.time,
          },
          update: {
            testAttempted: { increment: d.attempted }, testCorrect: { increment: d.correct },
            totalMarksEarned: { increment: d.earned }, maxPossibleMarks: { increment: d.max }, totalTimeSpent: { increment: d.time },
          },
        }),
      );
    }

    // E. Question Types
    for (const [type, d] of typeStats) {
      operations.push(
        this.db.questionTypeAnalytics.upsert({
          where: { studentId_type: { studentId, type: type as questionType } },
          create: {
            studentId, type: type as questionType,
            totalAttempted: d.attempted, totalCorrect: d.correct, totalPartial: d.partial,
            totalMarksEarned: d.earned, totalTimeSpent: d.time,
          },
          update: {
            totalAttempted: { increment: d.attempted }, totalCorrect: { increment: d.correct },
            totalPartial: { increment: d.partial }, totalMarksEarned: { increment: d.earned }, totalTimeSpent: { increment: d.time },
          },
        }),
      );
    }

    // F. Summary (ALWAYS RECORDS FULL MARKS FOR THIS SPECIFIC TEST)
    // NOTE: Test Summary is a snapshot of *this* test. Even if the user solved the question before, 
    // for *this* test report card, they get the marks. We do NOT use the 'delta' values here.
   let rawTotalScore = 0;
    let rawAttempted = 0;
    let rawCorrect = 0;
    const subjectJson: Record<string, any> = {};
    const tempSubjectMap = new Map();

    for (const attempt of test.testQuestionStatus) {
        // Only count answered questions
        if (attempt.status !== "answered" && attempt.status !== "markedForReview") continue;

        // 1. Accumulate Score & Attempts
        rawTotalScore += attempt.marksObtained;
        rawAttempted += 1;
        if (attempt.isCorrect) rawCorrect += 1;

        // 2. Accumulate Subject Splits
        const subId = attempt.questions.subjectId;
        const entry = tempSubjectMap.get(subId) || { score: 0, attempted: 0 };
        entry.score += attempt.marksObtained;
        entry.attempted += 1;
        tempSubjectMap.set(subId, entry);
    }

    // Convert Map to JSON for DB
    for (const [id, d] of tempSubjectMap) {
        subjectJson[id] = { score: d.score, attempted: d.attempted };
    }

    // 3. Create the Summary Record
    operations.push(
      this.db.testAttemptSummary.create({
        data: {
          testStatusId,
          studentId,
          totalScore: rawTotalScore,
          maxScore: test.papers.totalMarks || 0,
          
          // --- FIXED FIELDS ---
          percentage: test.papers.totalMarks 
            ? (rawTotalScore / test.papers.totalMarks) * 100 
            : 0,
            
          accuracy: rawAttempted > 0 
            ? (rawCorrect / rawAttempted) * 100 
            : 0, // <--- THIS WAS MISSING
            
          efficiency: test.papers.totalMarks 
            ? (rawTotalScore / test.papers.totalMarks) * 100 
            : 0,
            
          timeTaken: overall.time, // Total time is valid for the session
          subjectSplits: subjectJson,
        },
      }),
    );

    // H. Finalize
    operations.push(
      this.db.testStatus.update({
        where: { id: testStatusId },
        data: { isAnalyzed: true },
      }),
    );

    await this.db.$transaction(operations);
    await this.updateStreak(studentId);
    console.log(`Processed analytics for Test: ${testStatusId}`);
  }

  /**
   * ==========================================
   * 4. DATA PROCESSOR: CHAPTER PRACTICE
   * ==========================================
   */
  async processChapterPractice(attemptId: string) {
    const attempt = await this.db.chapterWiseQuestionAttemptStatus.findUnique({
      where: { id: attemptId },
      include: { question: true },
    });

    if (!attempt) return;

    const { studentId, question, marksObtained, isCorrect, timeSpent } = attempt;
    
    // 1. CHECK HISTORY (Single Question)
    const previouslyAttempted = await this.getExistingAttempts(studentId, [question.id], [attemptId]);
    const isNew = !previouslyAttempted.has(question.id);

    // 2. Calculate Deltas
    const deltaAttempted = isNew ? 1 : 0;
    const deltaCorrect = (isNew && isCorrect) ? 1 : 0;
    const deltaEarned = isNew ? marksObtained : 0;
    const deltaMax = isNew ? question.positiveMarks : 0;
    const deltaTime = timeSpent; // Always add time

    const operations = [];

    // A. Chapter
    if (question.chapterId) {
      operations.push(
        this.db.chapterAnalytics.upsert({
          where: { studentId_chapterId: { studentId, chapterId: question.chapterId } },
          create: {
            studentId, chapterId: question.chapterId,
            practiceAttempted: 1, practiceCorrect: isCorrect ? 1 : 0,
            totalMarksEarned: marksObtained, maxPossibleMarks: question.positiveMarks, totalTimeSpent: timeSpent,
          },
          update: {
            practiceAttempted: { increment: deltaAttempted },
            practiceCorrect: { increment: deltaCorrect },
            totalMarksEarned: { increment: deltaEarned },
            maxPossibleMarks: { increment: deltaMax },
            totalTimeSpent: { increment: deltaTime },
          },
        }),
      );
    }

    // B. Subject
    operations.push(
      this.db.subjectAnalytics.upsert({
        where: { studentId_subjectId: { studentId, subjectId: question.subjectId } },
        create: {
          studentId, subjectId: question.subjectId,
          totalAttempted: 1, totalCorrect: isCorrect ? 1 : 0,
          totalMarksEarned: marksObtained, maxPossibleMarks: question.positiveMarks, totalTimeSpent: timeSpent,
        },
        update: {
          totalAttempted: { increment: deltaAttempted },
          totalCorrect: { increment: deltaCorrect },
          totalMarksEarned: { increment: deltaEarned },
          maxPossibleMarks: { increment: deltaMax },
          totalTimeSpent: { increment: deltaTime },
        },
      }),
    );

    // C. Type
    operations.push(
      this.db.questionTypeAnalytics.upsert({
        where: { studentId_type: { studentId, type: question.type } },
        create: {
          studentId, type: question.type,
          totalAttempted: 1, totalCorrect: isCorrect ? 1 : 0,
          totalMarksEarned: marksObtained, totalTimeSpent: timeSpent,
        },
        update: {
          totalAttempted: { increment: deltaAttempted },
          totalCorrect: { increment: deltaCorrect },
          totalMarksEarned: { increment: deltaEarned },
          totalTimeSpent: { increment: deltaTime },
        },
      }),
    );

    // D. Overall
    operations.push(
      this.db.studentOverallAnalytics.upsert({
        where: { studentId },
        create: {
          studentId, totalAttempted: 1, totalCorrect: isCorrect ? 1 : 0,
          totalMarksEarned: marksObtained, maxPossibleMarks: question.positiveMarks, totalTimeSpent: timeSpent,
        },
        update: {
          totalAttempted: { increment: deltaAttempted },
          totalCorrect: { increment: deltaCorrect },
          totalMarksEarned: { increment: deltaEarned },
          maxPossibleMarks: { increment: deltaMax },
          totalTimeSpent: { increment: deltaTime },
        },
      }),
    );

    await this.db.$transaction(operations);
    await this.updateStreak(studentId);
  }
}

export const analytics = new AnalyticsService(database);