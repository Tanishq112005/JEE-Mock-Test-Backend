import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../prisma/generated/prisma/client'
import { DATABASE_URL } from "./env";



class Database {
  private db : PrismaClient | null = null ; 
  constructor(){
     this.db = null ; 
  }

   getClinet(){
    if(this.db != null){
      return this.db ; 
    }
    const connectionString = DATABASE_URL
    const adapter = new PrismaPg({ connectionString })
    this.db = new PrismaClient({ adapter })

    return this.db ; 
  }
}


export const database : any = new Database().getClinet() ; 