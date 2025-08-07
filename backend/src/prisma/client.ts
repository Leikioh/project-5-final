// backend/src/prisma/client.ts
import { PrismaClient } from "@prisma/client";

// Évite de ré-instancier PrismaClient à chaque import en mode dev
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["query"], // optionnel, pour logger les requêtes SQL
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
