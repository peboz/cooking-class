import { PrismaClient } from "@/app/generated/prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"
 
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
 
export const prisma =
  globalForPrisma.prisma || 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }).$extends(withAccelerate())
 
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
