import { PrismaClient, UserType } from "@prisma/client";

export interface userSignInputDetails {
    name : string , 
    email : string , 
    password : string ,
    type? : UserType
}


export type userDetails = any ;