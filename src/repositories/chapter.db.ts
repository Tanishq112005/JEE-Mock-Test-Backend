import { chapters, PrismaClient, SubjectName } from "@prisma/client";
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
        isJeeAdvanced: payload.isJeeAdvanced,
        isJeeMain: payload.isJeeMain,
        group: payload.group,
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

    if (payload.group) {
      whereCondition.group = payload.group;
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
        group: true,
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

  public gettingGroup = async (subjectName: string) => {
    try {
      const groups = await this.db.chapters.findMany({
        where: {
          subjects: {
            name: subjectName as SubjectName, // Ensure strict Enum matching
          },
        },
        select: {
          group: true,
        },
        distinct: ["group"],
      });

      // Transform [{ group: "Mechanics" }, { group: "Optics" }] -> ["Mechanics", "Optics"]
      return groups.map((item) => item.group);
    } catch (err) {
      throw err;
    }
  };

  public gettingDetailedGroups = async (subjectName: string) => {
    try {
      const subjectParts = await this.db.subjects.findUnique({
        where: { name: subjectName as SubjectName },
        include: { chapters: { select: { group: true }, distinct: ["group"] } }
      });

      if (!subjectParts) {
        throw new ApiError("Subject not found");
      }

      return subjectParts.chapters.map((ch, index) => ({
        id: `${subjectParts.id}-group-${index}`,
        subjectId: subjectParts.id,
        subjectName: subjectParts.name,
        groupName: ch.group
      }));
    } catch(err) {
      throw err;
    }
  };

  public gettingChapterId = async (chapterName: string): Promise<chapters> => {
    const chapter = await this.db.chapters.findUnique({
      where: { name: chapterName },
    });

    if (!chapter) {
      throw new ApiError("Chapter not found");
    }

    return chapter;
  };
}

export const chapter = new Chapter(database);
