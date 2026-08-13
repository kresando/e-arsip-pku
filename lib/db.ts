import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const getPrisma = () => {
  if (globalThis.prismaGlobal && (!("nota" in globalThis.prismaGlobal) || !("divisi" in globalThis.prismaGlobal))) {
    globalThis.prismaGlobal = prismaClientSingleton();
  }
  const client = globalThis.prismaGlobal ?? prismaClientSingleton();
  if (process.env.NODE_ENV !== "production" && !globalThis.prismaGlobal) {
    globalThis.prismaGlobal = client;
  }
  return client;
};

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrisma() as any;
    const value = client[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
