import type { NextRequest } from "next/server";
import { handler, ok } from "@/lib/api";
import { HttpError } from "@/lib/auth";
import { getPublicBundle } from "@/lib/data";
import { scorers, standings } from "@/lib/league";

type Ctx = { params: Promise<{ slug: string }> };

/** Read-only tournament data for other clients (a future mobile app, a TV display, etc). */
export const GET = handler(async (_req: NextRequest, { params }: Ctx) => {
  const b = await getPublicBundle((await params).slug);
  if (!b) throw new HttpError(404, "Tournament not found.");
  const table = standings(b.teams, b.matches, b.tournament.points).map((r) => ({ ...r, team: r.team._id }));
  return ok({ ...b, table, scorers: scorers(b.matches) });
});
