// Shared setup for the command-line scripts. Import this first.
import { config } from "dotenv";
import dns from "node:dns";

// Variables already set in the terminal win over .env.local, so
// `$env:MONGODB_URI="..."` points a script at another database.
config({ path: ".env.local" });
config();

// On some Windows networks Node can't resolve the SRV records behind
// mongodb+srv:// addresses (querySrv ECONNREFUSED). Public DNS resolves them.
if (process.env.MONGODB_URI?.startsWith("mongodb+srv://")) {
  dns.setServers(["1.1.1.1", "8.8.8.8", ...dns.getServers()]);
}
