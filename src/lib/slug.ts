import "server-only";
import { HttpError } from "./auth";
import { oid } from "./api";
import { Tournament } from "./models";

// Paths the short link must never take over.
const RESERVED = new Set(["admin", "api", "t", "login", "logout", "_next", "static", "public", "favicon.ico", "robots.txt", "sitemap.xml"]);

export const SHORT_RE = /^[a-z0-9]{1,12}$/;

/** "Pillars Turf Cup" + 2026 -> "ptc26" (then "ptc26b", "ptc26c"… if taken). */
export async function defaultCode(name: string, year: number) {
  const letters = name.toLowerCase().split(/[^a-z]+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 3) || "t";
  const base = letters + String(year).slice(-2);
  let code = base;
  for (let i = 1; RESERVED.has(code) || (await Tournament.exists({ slug: code })); i++) code = base + String.fromCharCode(97 + i);
  return code;
}

/** Validates a short link chosen by an admin. */
export async function checkCode(code: string, ignoreId?: string) {
  const c = code.trim().toLowerCase();
  if (!SHORT_RE.test(c)) throw new HttpError(422, "Short links use 1–12 lowercase letters or numbers, with no spaces.");
  if (RESERVED.has(c)) throw new HttpError(422, `“${c}” is used by the site itself. Pick another short link.`);
  if (await Tournament.exists({ slug: c, ...(ignoreId ? { _id: { $ne: oid(ignoreId) } } : {}) }))
    throw new HttpError(409, `Another tournament already uses “${c}”.`);
  return c;
}
