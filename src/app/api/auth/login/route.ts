import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { handler } from "@/lib/api";
import { HttpError, startSession } from "@/lib/auth";
import { AdminUser } from "@/lib/models";
import { loginSchema } from "@/lib/validators";

// Simple in-memory throttle: 8 failed attempts per IP+email per 15 minutes.
const attempts = new Map<string, { n: number; until: number }>();
const WINDOW = 15 * 60 * 1000;
let DUMMY: string | undefined;

export const POST = handler(async (req: NextRequest) => {
  const { email, password } = loginSchema.parse(await req.json());
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const k = ip + "|" + email.toLowerCase();
  const a = attempts.get(k);
  if (a && a.n >= 8 && a.until > Date.now()) throw new HttpError(429, "Too many attempts. Try again in 15 minutes.");

  const user = await AdminUser.findOne({ email: email.toLowerCase() });
  // compare against a dummy hash for unknown emails so response time doesn't reveal which emails exist
  const good = await bcrypt.compare(password, user ? user.passwordHash : (DUMMY ??= bcrypt.hashSync("not-a-real-password", 12)));
  if (!user || !good) {
    const cur = a && a.until > Date.now() ? a : { n: 0, until: Date.now() + WINDOW };
    attempts.set(k, { n: cur.n + 1, until: cur.until });
    throw new HttpError(401, "Email or password is incorrect.");
  }
  attempts.delete(k);
  user.lastLoginAt = new Date();
  await user.save();

  const res = NextResponse.json({ name: user.name, role: user.role });
  await startSession(res, user);
  return res;
});
