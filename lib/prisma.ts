import { PrismaClient } from "@prisma/client";

declare global {   
  var prismaGlobal: PrismaClient | undefined;
}

const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

export default prisma;
export { prisma };
