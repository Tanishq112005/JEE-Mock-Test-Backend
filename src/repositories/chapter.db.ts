import { PrismaClient, SubjectName } from "@prisma/client";
import { database } from "../lib/database";
import {
  chapterInform,
  deletingPayload,
  gettingPayload,
} from "../types/chapter.types";
import ApiError from "../utils/ApiError";

class Chapter {
  private db: PrismaClient;

  constructor(database: PrismaClient) {
    this.db = database;
  }

  // ---------------- ADD CHAPTER ----------------
  public addingChapter = async (payload: chapterInform) => {
     console.log("REPO PAYLOAD:", payload);
    const subjectInformation = await this.db.subjects.findUnique({
      where: {
        name: payload.subject as SubjectName,
      },
    });

    if (!subjectInformation) {
      throw new ApiError("Subject not found");
    }

    await this.db.chapters.create({
      data: {
        name: payload.name,
        class: payload.classNumber,
        chapterNumber: payload.chapterNumber,
        subjectId: subjectInformation.id,
      },
    });
  };

  // ---------------- DELETE CHAPTER ----------------
  public deletingChapter = async (payload: deletingPayload) => {
    await this.db.chapters.delete({
      where: {
        id: payload.id,
      },
    });
  };

  // ---------------- GET CHAPTERS ----------------
  public gettingChapter = async (payload: gettingPayload) => {
    const whereCondition: any = {};

    if (payload.classNumber) {
      whereCondition.class = payload.classNumber;
    }

    if (payload.subjectName) {
      whereCondition.subjects = {
        name: payload.subjectName,
      };
    }

    return this.db.chapters.findMany({
      where: whereCondition,
      orderBy: {
        chapterNumber: "asc",
      },
      select: {
        id: true,
        name: true,
        chapterNumber: true,
        class: true,
        subjects: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  };
}

export const chapter = new Chapter(database);
