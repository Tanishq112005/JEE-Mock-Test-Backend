import { PrismaClient } from "@prisma/client";

export interface userSignInputDetails {
    name : string , 
    email : string , 
    password : string 
}


export type userDetails = any ;