import { user as PrismaUser } from "../prisma/generated/prisma/client";

export interface userSignInputDetails {
    name : string , 
    email : string , 
    password : string 
}


export type userDetails = PrismaUser ;