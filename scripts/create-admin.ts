// Creates (or resets) an admin account.
//   npm run admin:create -- --email you@example.com --name "Your Name" [--password "..."] [--role owner|admin]
// The first account created is always an owner. If --password is left out you'll be asked for it.
import "./env";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { createInterface } from "node:readline/promises";
import { connectDB } from "../src/lib/db";
import { AdminUser } from "../src/lib/models";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = arg("email")?.toLowerCase();
  const name = arg("name");
  if (!email || !name) throw new Error('Usage: npm run admin:create -- --email you@example.com --name "Your Name" [--role owner|admin]');
  let password = arg("password");
  if (!password) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    password = await rl.question("Password (8+ characters): ");
    rl.close();
  }
  if (!password || password.length < 8) throw new Error("Password must be at least 8 characters.");

  await connectDB();
  const first = (await AdminUser.countDocuments()) === 0;
  const role = first ? "owner" : arg("role") === "owner" ? "owner" : "admin";
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await AdminUser.findOne({ email });
  if (existing) {
    existing.set({ name, passwordHash, passwordVersion: existing.passwordVersion + 1, ...(arg("role") ? { role } : {}) });
    await existing.save();
    console.log(`Updated ${email} (${existing.role}). Their password has been reset.`);
  } else {
    await AdminUser.create({ email, name, passwordHash, role });
    console.log(`Created ${role} account for ${email}.`);
  }
}

main()
  .catch((e) => { console.error(e.message ?? e); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
