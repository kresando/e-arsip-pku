import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prismaGlobal?: PrismaClient;
  poolGlobal?: Pool;
};

const pool =
  globalForPrisma.poolGlobal ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prismaGlobal ??
  new PrismaClient({
    adapter,
  });

globalForPrisma.poolGlobal = pool;
globalForPrisma.prismaGlobal = prisma;

