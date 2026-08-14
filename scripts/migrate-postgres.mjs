import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const shellVariables = new Set(Object.keys(process.env));

function loadEnvFile(fileName) {
  const filePath = path.join(projectRoot, fileName);
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || shellVariables.has(match[1])) continue;
    let value = match[2];
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

// Keep shell-provided values authoritative, while matching Next.js local-file precedence.
loadEnvFile(".env");
loadEnvFile(".env.local");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Run `npx vercel env pull .env.local` or export DATABASE_URL before migrating.");
}

const { initializePersistence, pruneExpiredData } = await import("../lib/serverPersistence.mjs");

await initializePersistence();
await pruneExpiredData();
console.log("InterviewIQ PostgreSQL schema is ready.");
