import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrisma(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Sunucusuz (Vercel) ortamda da tek örnek — bağlantı sızıntısını önler */
export const prisma = globalForPrisma.prisma ?? createPrisma();
globalForPrisma.prisma = prisma;
