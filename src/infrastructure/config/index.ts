import "./env.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
// eslint-disable-next-line boundaries/element-types
import logger from "#app/shared/utils/metrics/logger.js";
import { PrismaClient } from "../../../generated/prisma/index.js";

interface Config {
  env: string;
  port: number;
}

const config: Config = {
  env: process.env.NODE_ENV || "development",
  port: Number.parseInt(process.env.PORT || "3000", 10),
};

export { config };

const postgresUrl = process.env.POSTGRES_ANALYTICS_URL;

if (!postgresUrl) {
  logger.debug(process.env.POSTGRES_ANALYTICS_URL || "undefined");
  throw new Error("POSTGRES_ANALYTICS_URL is not set");
}

try {
  new URL(postgresUrl);
} catch {
  logger.debug(postgresUrl);
  const redacted = postgresUrl
    .replace(/:[^:@/]*@/, ":***@")
    .replace(/\?.*$/, "");
  throw new Error(`POSTGRES_ANALYTICS_URL is invalid: ${redacted}`);
}

const pool = new Pool({ connectionString: postgresUrl });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
