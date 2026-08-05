import { initializePersistence } from "../lib/serverPersistence.mjs";

await initializePersistence();
console.log("InterviewIQ PostgreSQL schema is ready.");
