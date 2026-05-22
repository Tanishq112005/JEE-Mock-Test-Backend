import { Category, Class, Gender, Prisma, PrismaClient } from "@prisma/client";
import { database } from "../lib/database";

import { userDetails, userSignInputDetails } from "../types/user.types";
import ApiError from "../utils/ApiError";

class User {
  private db: PrismaClient;
  constructor(database: PrismaClient) {
    this.db = database;
  }

  // checking wheather the user is already present or not in the db
  async checkingUserPresent(email: string) {
    try {
      const allInformation: userDetails | null = await this.db.user.findUnique({
        where: {
          email: email,
        },
      });

      return allInformation;
    } catch (err: any) {
      console.log(err);
      throw err;
    }
  }

  // creating the user with not verified status , it means right now user is not verified
  async creatingUser(details: userSignInputDetails) {
    const { name, email, password, type } = details;

    try {
      await this.db.user.create({
        data: {
          name: name,
          email: email,
          password: password,
          is_verified: false,
          type: type,
        },
      });
    } catch (err: any) {
      throw err;
    }
  }

  // for changing the is_verified status to be true
  async changingIsVerifiedStatus(email: string) {
    try {
      await this.db.user.update({
        where: {
          email: email,
        },
        data: {
          is_verified: true,
        },
      });
    } catch (err: any) {
      throw err;
    }
  }

  // updating the access token in the table
  async updateRefershToken(email: string, refersh_token: string) {
    try {
      await this.db.user.update({
        where: {
          email: email,
        },
        data: {
          refersh_token: refersh_token,
        },
      });
    } catch (err: any) {
      throw err;
    }
  }

  // updating the password in the table using the userid
  // src/repositories/user.db.ts

  async updatePassword(user_id: string, password: string) {
    try {
      console.log(`🔍 REPO: Attempting to update User ID: ${user_id}`);

      // 1. Check if user exists BEFORE updating (Debugging step)
      const exists = await this.db.user.findUnique({ where: { id: user_id } });
      if (!exists) {
        console.error(
          `❌ REPO ERROR: User ID ${user_id} does not exist in DB!`,
        );
        throw new Error(`User ID ${user_id} not found`);
      }

      console.log(`👤 User Found: ${exists.email}. Updating password...`);

      // 2. Perform Update
      const updated = await this.db.user.update({
        where: { id: user_id },
        data: { password: password },
      });

      console.log("REPO SUCCESS: Password hash updated in DB.");
      return updated;
    } catch (err: any) {
      console.error("REPO CRASH: Prisma failed to update:", err.message);
      throw err;
    }
  }

  // for finding the user in the table
  async userDetails(email: string) {
    try {
      const userDetails = await this.db.user.findUnique({
        where: {
          email: email,
          is_verified: true,
        },
      });

      return userDetails;
    } catch (err: any) {
      throw err;
    }
  }

  // for finding the user through the id
  async userDetailsThroughId(id: string) {
    try {
      const userDetails = await this.db.user.findUnique({
        where: {
          id: id,
        },
      });

      if (!userDetails) {
        throw new ApiError("No such type of the user exxists in the table");
      }
      return userDetails;
    } catch (err: any) {
      throw err;
    }
  }
 

  // for finding the details through the student id 
  async userDetailsThroughStudentId(id : string){
    try {
      const studentDetails = await this.db.studentProfile.findUnique({
        where : {
          id : id , 
        }
      })

      const allTheUserDetails = await this.db.user.findUnique({
        where : {
          id : studentDetails?.user_id 
        }
      })

      return {
         studentDetails , 
         allTheUserDetails
      }

    }
    catch(err : any){
      throw err ; 
    }
  }
  async creatingStudent(userId: string) {
    try {
      // Use upsert so re-verifying OTP (e.g. retry) doesn't throw a unique constraint error
      await this.db.studentProfile.upsert({
        where: { user_id: userId },
        update: {}, // already exists — nothing to change
        create: { user_id: userId },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async stageNumber(studentId: string) {
    try {
      const studentProfile = await this.db.studentProfile.findFirst({
        where: {
          id: studentId,
        },
      });

      if (!studentProfile) {
        throw "No Student Is Present In The DB";
      }

      return studentProfile.stage;
    } catch (err: any) {
      throw err;
    }
  }

  async stage1(className: Class, studentId: string) {
    try {
      await this.db.studentProfile.update({
        where: {
          id: studentId,
        },
        data: {
          class: className,
          stage: 1,
        },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async stage2(gender: Gender, category: Category, studentId: string) {
    try {
      await this.db.studentProfile.update({
        where: {
          id: studentId,
        },
        data: {
          category: category,
          gender: gender,
          stage: 2,
        },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async stage3(countryCode: string, mobileNumber: number, studentId: string) {
    try {
      await this.db.studentProfile.update({
        where: {
          id: studentId,
        },
        data: {
          phone_country_code: countryCode,
          phone: mobileNumber,
          stage: 3,
        },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async studentProfile(studentId: string) {
    try {
      const studentData = await this.db.studentProfile.findFirst({
        where: {
          id: studentId,
        },
      });

      if (!studentData) {
        throw new ApiError(
          "No student profile found for this user. Try logging out and back in.",
        );
      }

      const userId = studentData.user_id;
      const userData = await this.db.user.findFirst({
        where: {
          id: userId,
        },
      });

   
      const finalPayload = {
        name: userData?.name,
        email: userData?.email,
        class: studentData.class,
        category: studentData.category,
        mobileNumber: studentData.phone?.toString(),
        countryCode: studentData.phone_country_code,
        gender: studentData.gender,
      };

      return finalPayload;
    } catch (err: any) {
      throw err;
    }
  }

  async updateStudent(
    studentId: string,
    className: Class,
    gender: Gender,
    category: Category,
    name: string,
    countryCode: string,
    mobileNumber: number,
  ) {
    try {
      const studentData = await this.db.studentProfile.findFirst({
        where: {
          id: studentId,
        },
      });

      if (!studentData) {
        throw "No Such User Exists";
      }

      const userId = studentData.user_id;
      const userData = await this.db.user.findFirst({
        where: {
          id: userId,
        },
      });

      await this.db.studentProfile.update({
        where: {
          id: studentId,
        },
        data: {
          class: className,
          gender: gender,
          category: category,
          phone_country_code: countryCode,
          phone: mobileNumber,
        },
      });

      await this.db.user.update({
        where: {
          id: userId,
        },
        data: {
          name: name,
        },
      });
    } catch (err: any) {
      throw err;
    }
  }





  // getting all the user from the db 

  async gettingAllUser() {
    try {
     const data : any = this.db.user.findMany() ; 
     return data ; 
    }
    catch(err : any) {
      throw err ;
    }
  }
}

export const user = new User(database);
