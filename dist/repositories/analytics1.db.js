"use strict";
// /*
// import { PrismaClient, TestState, AttemptStatus } from "@prisma/client";
// import { TestSubmissionPayload } from "../types/testStatus.types";
// export class AnalyticsService {
//   private db: PrismaClient;
//   constructor(database: PrismaClient) {
//     this.db = database;
//   }
//   /**
//    * ==========================================
//    * 🧠 PHASE 1: DATA AGGREGATION & MATH
//    * ==========================================
//    * PUBLIC: So the API Controller can calculate instant results for Redis/Frontend
//    */
//   /*
//   public aggregateTestData(test: TestSubmissionPayload) {
//     const data = {
//       totalScore: 0,
//       totalAttempts: 0,
//       totalCorrect: 0,
//       totalTime: 0,
//       subjectStats: {} as Record<string, any>,
//       chapterStats: {} as Record<string, any>,
//       questionStats: [] as any[],
//     };
//     for (const attempt of test.testQuestionStatus) {
//       if (
//         attempt.status === AttemptStatus.notAnswered ||
//         attempt.status === AttemptStatus.visited
//       ) {
//         continue;
//       }
//       const q = attempt.questions;
//       data.totalAttempts++;
//       data.totalTime += attempt.timeSpent;
//       data.totalScore += attempt.marksObtained;
//       if (attempt.isCorrect) data.totalCorrect++;
//       if (!data.subjectStats[q.subjectId]) {
//         data.subjectStats[q.subjectId] = {
//           score: 0, attempts: 0, correct: 0, time: 0, maxScore: 0,
//         };
//       }
//       data.subjectStats[q.subjectId].score += attempt.marksObtained;
//       data.subjectStats[q.subjectId].attempts++;
//       data.subjectStats[q.subjectId].time += attempt.timeSpent;
//       data.subjectStats[q.subjectId].maxScore += q.positiveMarks;
//       if (attempt.isCorrect) data.subjectStats[q.subjectId].correct++;
//       if (q.chapterId) {
//         if (!data.chapterStats[q.chapterId]) {
//           data.chapterStats[q.chapterId] = {
//             score: 0, attempts: 0, correct: 0, time: 0, maxScore: 0,
//           };
//         }
//         data.chapterStats[q.chapterId].score += attempt.marksObtained;
//         data.chapterStats[q.chapterId].attempts++;
//         data.chapterStats[q.chapterId].time += attempt.timeSpent;
//         data.chapterStats[q.chapterId].maxScore += q.positiveMarks;
//         if (attempt.isCorrect) data.chapterStats[q.chapterId].correct++;
//       }
//       data.questionStats.push({
//         id: q.id,
//         isCorrect: attempt.isCorrect,
//         timeSpent: attempt.timeSpent,
//       });
//     }
//     return data;
//   }
//   /**
//    * ==========================================
//    * 🚀 MAIN PROCESSOR: TEST SUBMISSION (BACKGROUND WORKER)
//    * ==========================================
//    */
//   async processTestSubmission(test: TestSubmissionPayload) {
//     if (!test || test.isAnalyzed || test.status !== TestState.COMPLETED) return;
//     const questionIds = test.testQuestionStatus.map((q) => q.questionId);
//     // Fetch existing stats to accurately calculate the Topper and Averages
//     const [existingPaperStats, existingQuestionStats] = await Promise.all([
//       this.db.paperGlobalStats.findUnique({ where: { paperId: test.paperId } }),
//       this.db.questionGlobalStats.findMany({
//         where: { questionId: { in: questionIds } },
//       }),
//     ]);
//     // Pre-calculate ALL test session data
//     const aggregatedData = this.aggregateTestData(test);
//     // Calculate Global Overrides (Topper score, new averages)
//     const newPaperStats = this._calculateNewPaperStats(
//       aggregatedData.totalScore,
//       aggregatedData.totalTime,
//       existingPaperStats,
//     );
//     const newQuestionStats = this._calculateNewQuestionStats(
//       aggregatedData.questionStats,
//       existingQuestionStats,
//     );
//     // Calculate proper Daily Streak
//     const newStreakData = await this._calculateNewStreak(
//       test.studentId,
//       test.user.streak,
//       test.user.maximumStreak,
//     );
//     // Generate all Prisma Query Operations
//     const transactionOps = [
//       this._prepTestStatusUpdate(test.id),
//       this._prepTestSummary(
//         test.studentId, test.id, test.papers.totalMarks || 300, aggregatedData,
//       ),
//       this._prepOverallAnalytics(test.studentId, aggregatedData),
//       this._prepExamAnalytics(
//         test.studentId, test.papers.exam.name, aggregatedData,
//       ),
//       ...this._prepSubjectAnalytics(test.studentId, aggregatedData.subjectStats),
//       ...this._prepChapterAnalytics(test.studentId, aggregatedData.chapterStats),
//       ...this._prepQuestionGlobalStats(newQuestionStats),
//       this._prepPaperGlobalStats(test.paperId, newPaperStats),
//       this._prepDailyActivityLog(test.studentId, aggregatedData),
//       this._prepStreakUpdate(test.studentId, newStreakData),
//     ];
//     // Execute everything in a single, atomic transaction
//     await this.db.$transaction(transactionOps);
//     // Async: Trigger Rank Updates
//     this.updateGlobalRanks().catch(console.error);
//   }
//   /**
//    * ==========================================
//    * 🛠️ PRIVATE HELPERS: MATH & QUERY BUILDERS
//    * ==========================================
//    */
//   private _calculateNewPaperStats(testScore: number, testTime: number, existingStats: any | null) {
//     if (!existingStats) {
//       return {
//         totalAttempts: 1, averageScore: testScore, highestScore: testScore, averageTimeTaken: testTime,
//       };
//     }
//     const newAttempts = existingStats.totalAttempts + 1;
//     return {
//       totalAttempts: newAttempts,
//       averageScore: (existingStats.averageScore * existingStats.totalAttempts + testScore) / newAttempts,
//       highestScore: Math.max(existingStats.highestScore, testScore),
//       averageTimeTaken: Math.floor((existingStats.averageTimeTaken * existingStats.totalAttempts + testTime) / newAttempts),
//     };
//   }
//   private _calculateNewQuestionStats(currentTestQuestions: any[], existingStats: any[]) {
//     return currentTestQuestions.map((q) => {
//       const existing = existingStats.find((e) => e.questionId === q.id);
//       const isCorrectInt = q.isCorrect ? 1 : 0;
//       if (!existing) {
//         return {
//           id: q.id, totalAttempts: 1, totalCorrect: isCorrectInt, totalTimeSpent: q.timeSpent,
//           averageTimeSpent: q.timeSpent, accuracyRate: isCorrectInt * 100,
//         };
//       }
//       const newAttempts = existing.totalAttempts + 1;
//       const newCorrect = existing.totalCorrect + isCorrectInt;
//       const newTime = existing.totalTimeSpent + q.timeSpent;
//       return {
//         id: q.id, totalAttempts: newAttempts, totalCorrect: newCorrect, totalTimeSpent: newTime,
//         averageTimeSpent: newTime / newAttempts, accuracyRate: (newCorrect / newAttempts) * 100,
//       };
//     });
//   }
//   private async _calculateNewStreak(studentId: string, currentStreak: number, maxStreak: number) {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const todayActivity = await this.db.dailyActivityLog.findUnique({
//       where: { studentId_date: { studentId, date: today } },
//     });
//     if (todayActivity) return { streak: currentStreak, maximumStreak: maxStreak };
//     const yesterday = new Date(today);
//     yesterday.setDate(yesterday.getDate() - 1);
//     const yesterdayActivity = await this.db.dailyActivityLog.findUnique({
//       where: { studentId_date: { studentId, date: yesterday } },
//     });
//     const newStreak = yesterdayActivity ? currentStreak + 1 : 1;
//     return {
//       streak: newStreak,
//       maximumStreak: Math.max(newStreak, maxStreak),
//     };
//   }
//   private _prepTestStatusUpdate(testId: string) {
//     return this.db.testStatus.update({
//       where: { id: testId }, data: { isAnalyzed: true },
//     });
//   }
//   private _prepTestSummary(studentId: string, testId: string, maxMarks: number, data: any) {
//     const accuracy = data.totalAttempts > 0 ? (data.totalCorrect / data.totalAttempts) * 100 : 0;
//     const avgTimePerQ = data.totalAttempts > 0 ? data.totalTime / data.totalAttempts : 0;
//     const percentage = maxMarks > 0 ? (data.totalScore / maxMarks) * 100 : 0;
//     return this.db.testAttemptSummary.create({
//       data: {
//         testStatusId: testId, studentId, totalScore: data.totalScore, maxScore: maxMarks,
//         accuracy, avgTimePerQ, timeTaken: data.totalTime, percentage,
//         subjectSplits: data.subjectStats, chapterSplits: data.chapterStats,
//       },
//     });
//   }
//   private _prepOverallAnalytics(studentId: string, data: any) {
//     return this.db.studentOverallAnalytics.upsert({
//       where: { studentId },
//       create: {
//         studentId, totalAttempts: data.totalAttempts, totalCorrect: data.totalCorrect,
//         totalTestsTaken: 1, totalMarksEarned: data.totalScore, totalTimeSpent: data.totalTime,
//       },
//       update: {
//         totalAttempts: { increment: data.totalAttempts },
//         totalCorrect: { increment: data.totalCorrect },
//         totalTestsTaken: { increment: 1 },
//         totalMarksEarned: { increment: data.totalScore },
//         totalTimeSpent: { increment: data.totalTime },
//       },
//     });
//   }
//   private _prepExamAnalytics(studentId: string, examName: any, data: any) {
//     return this.db.examAnalytics.upsert({
//       where: { studentId_examName: { studentId, examName } },
//       create: {
//         studentId, examName, totalAttempts: data.totalAttempts, totalCorrect: data.totalCorrect,
//         totalMarksEarned: data.totalScore, testsCompleted: 1,
//       },
//       update: {
//         totalAttempts: { increment: data.totalAttempts },
//         totalCorrect: { increment: data.totalCorrect },
//         totalMarksEarned: { increment: data.totalScore },
//         testsCompleted: { increment: 1 },
//       },
//     });
//   }
//   private _prepSubjectAnalytics(studentId: string, subjectStats: Record<string, any>) {
//     return Object.entries(subjectStats).map(([subjectId, stats]) => {
//       return this.db.subjectAnalytics.upsert({
//         where: { studentId_subjectId: { studentId, subjectId } },
//         create: {
//           studentId, subjectId, totalAttempts: stats.attempts, totalCorrect: stats.correct,
//           totalMarksEarned: stats.score, maxPossibleMarks: stats.maxScore, totalTimeSpent: stats.time,
//         },
//         update: {
//           totalAttempts: { increment: stats.attempts },
//           totalCorrect: { increment: stats.correct },
//           totalMarksEarned: { increment: stats.score },
//           maxPossibleMarks: { increment: stats.maxScore },
//           totalTimeSpent: { increment: stats.time },
//         },
//       });
//     });
//   }
//   private _prepChapterAnalytics(studentId: string, chapterStats: Record<string, any>) {
//     return Object.entries(chapterStats).map(([chapterId, stats]) => {
//       return this.db.chapterAnalytics.upsert({
//         where: { studentId_chapterId: { studentId, chapterId } },
//         create: {
//           studentId, chapterId, totalAttempts: stats.attempts, totalCorrect: stats.correct,
//           totalMarksEarned: stats.score, maxPossibleMarks: stats.maxScore, totalTimeSpent: stats.time,
//         },
//         update: {
//           totalAttempts: { increment: stats.attempts },
//           totalCorrect: { increment: stats.correct },
//           totalMarksEarned: { increment: stats.score },
//           maxPossibleMarks: { increment: stats.maxScore },
//           totalTimeSpent: { increment: stats.time },
//         },
//       });
//     });
//   }
//   private _prepQuestionGlobalStats(calculatedStats: any[]) {
//     return calculatedStats.map((q) => {
//       return this.db.questionGlobalStats.upsert({
//         where: { questionId: q.id },
//         create: {
//           questionId: q.id, totalAttempts: q.totalAttempts, totalCorrect: q.totalCorrect,
//           totalTimeSpent: q.totalTimeSpent, averageTimeSpent: q.averageTimeSpent, accuracyRate: q.accuracyRate,
//         },
//         update: {
//           totalAttempts: q.totalAttempts, totalCorrect: q.totalCorrect,
//           totalTimeSpent: q.totalTimeSpent, averageTimeSpent: q.averageTimeSpent, accuracyRate: q.accuracyRate,
//         },
//       });
//     });
//   }
//   private _prepPaperGlobalStats(paperId: string, stats: any) {
//     return this.db.paperGlobalStats.upsert({
//       where: { paperId },
//       create: {
//         paperId, totalAttempts: stats.totalAttempts, averageScore: stats.averageScore,
//         highestScore: stats.highestScore, averageTimeTaken: stats.averageTimeTaken,
//       },
//       update: {
//         totalAttempts: stats.totalAttempts, averageScore: stats.averageScore,
//         highestScore: stats.highestScore, averageTimeTaken: stats.averageTimeTaken,
//       },
//     });
//   }
//   private _prepDailyActivityLog(studentId: string, data: any) {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     return this.db.dailyActivityLog.upsert({
//       where: { studentId_date: { studentId, date: today } },
//       create: {
//         studentId, date: today, questionsSolved: data.totalAttempts,
//         questionsCorrect: data.totalCorrect, testsTaken: 1, timeSpent: data.totalTime,
//       },
//       update: {
//         questionsSolved: { increment: data.totalAttempts },
//         questionsCorrect: { increment: data.totalCorrect },
//         testsTaken: { increment: 1 },
//         timeSpent: { increment: data.totalTime },
//       },
//     });
//   }
//   private _prepStreakUpdate(studentId: string, streakData: any) {
//     return this.db.studentProfile.update({
//       where: { id: studentId },
//       data: { streak: streakData.streak, maximumStreak: streakData.maximumStreak },
//     });
//   }
//   async updateGlobalRanks() {
//     try {
//       const allStudents = await this.db.studentOverallAnalytics.findMany({
//         select: { studentId: true, totalAttempts: true, totalCorrect: true },
//       });
//       const rankedList = allStudents.map((student) => {
//         const accuracy = student.totalAttempts > 0 ? student.totalCorrect / student.totalAttempts : 0;
//         return { id: student.studentId, totalSolved: student.totalAttempts, accuracy };
//       });
//       rankedList.sort((a, b) => {
//         if (b.totalSolved !== a.totalSolved) return b.totalSolved - a.totalSolved;
//         return b.accuracy - a.accuracy;
//       });
//       const updates = rankedList.map((student, index) => {
//         return this.db.studentProfile.update({
//           where: { id: student.id },
//           data: { globalRank: index + 1 },
//         });
//       });
//       await this.db.$transaction(updates);
//       console.log("🏆 Global Ranks recalculated successfully.");
//     } catch (err) {
//       console.error("❌ Global Rank Update Failed:", err);
//     }
//   }
// }
