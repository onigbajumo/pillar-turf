// Runs a local MongoDB on 127.0.0.1:27017 for development (data kept in ./.mongo-data).
// Use this when you don't have MongoDB installed or an Atlas cluster yet. Stop with Ctrl+C.
import { MongoMemoryServer } from "mongodb-memory-server";
import { mkdirSync } from "node:fs";

const dbPath = new URL("../.mongo-data", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
mkdirSync(dbPath, { recursive: true });

const server = await MongoMemoryServer.create({
  instance: { port: 27017, ip: "127.0.0.1", dbPath, storageEngine: "wiredTiger" },
});
console.log(`MongoDB running at ${server.getUri()} (data in .mongo-data). Press Ctrl+C to stop.`);

const stop = async () => { await server.stop({ doCleanup: false }); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
