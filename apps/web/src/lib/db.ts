// src/lib/db.ts
import { Pool } from "pg";
import fs from "fs";
import path from "path";

const caPath = process.env.PGSSL_CA_PATH;
const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED !== "false";
const rawDatabaseUrl = process.env.DATABASE_URL;

let ca: Buffer | undefined;
let caResolvedPath: string | undefined;
if (caPath) {
  caResolvedPath = path.isAbsolute(caPath)
    ? caPath
    : path.resolve(process.cwd(), caPath);
  if (!fs.existsSync(caResolvedPath)) {
    throw new Error(`PGSSL_CA_PATH not found: ${caResolvedPath}`);
  }
  ca = fs.readFileSync(caResolvedPath);
}

const ssl = ca
  ? { ca, rejectUnauthorized }
  : rejectUnauthorized
    ? undefined
    : { rejectUnauthorized: false };

let connectionString = rawDatabaseUrl;
if (rawDatabaseUrl) {
  const url = new URL(rawDatabaseUrl);
  // When we supply explicit SSL options, remove sslmode/sslrootcert from the URL
  // to avoid pg-connection-string behavior conflicts.
  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslrootcert");
  connectionString = url.toString();
}

export const pool = new Pool({
  connectionString,
  ssl,
});

console.log("DATABASE_URL exists:", !!rawDatabaseUrl);
console.log(
  "DATABASE_URL host:",
  process.env.DATABASE_URL?.split("@")[1]?.split("/")[0],
);
console.log("PGSSL_CA_PATH:", process.env.PGSSL_CA_PATH);
console.log("PGSSL_CA_RESOLVED:", caResolvedPath);
console.log("PGSSL_REJECT_UNAUTHORIZED:", rejectUnauthorized);
