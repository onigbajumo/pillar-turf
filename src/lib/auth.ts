import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { connectDB } from "./db";
import { AdminUser } from "./models";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session";

export type CurrentAdmin = { id: string; name: string; email: string; role: "owner" | "admin" };

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** The signed-in admin, re-checked against the database (removed admins and changed passwords lose access). */
export async function getAdmin(): Promise<CurrentAdmin | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const s = await verifySession(token);
  if (!s) return null;
  await connectDB();
  const u = await AdminUser.findById(s.sub).lean();
  if (!u || u.passwordVersion !== s.pv) return null;
  return { id: String(u._id), name: u.name, email: u.email, role: u.role as CurrentAdmin["role"] };
}

export async function requireAdmin(opts: { owner?: boolean } = {}) {
  const a = await getAdmin();
  if (!a) throw new HttpError(401, "Please log in again.");
  if (opts.owner && a.role !== "owner") throw new HttpError(403, "Only the owner can manage admin accounts.");
  return a;
}

export async function startSession(res: NextResponse, u: { _id: unknown; name: string; role: string; passwordVersion: number }) {
  const token = await signSession({ sub: String(u._id), name: u.name, role: u.role as "owner" | "admin", pv: u.passwordVersion });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function endSession(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
