// Edge-safe session helpers (used by middleware and server code).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "pt_session";
export const SESSION_DAYS = 7;

export type SessionPayload = { sub: string; role: "owner" | "admin"; name: string; pv: number };

function key() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
  return new TextEncoder().encode(s);
}

export async function signSession(p: SessionPayload) {
  return new SignJWT({ role: p.role, name: p.name, pv: p.pv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return { sub: payload.sub, role: payload.role as SessionPayload["role"], name: String(payload.name ?? ""), pv: Number(payload.pv ?? 0) };
  } catch {
    return null;
  }
}
