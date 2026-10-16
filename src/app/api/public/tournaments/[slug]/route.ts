import type { NextRequest } from "next/server";
import { handler, ok } from "@/lib/api";
import { HttpError } from "@/lib/auth";
import { getPublicBundle } from "@/lib/data";
import { stats } from "@/lib/league";

type Ctx = { params: Promise<{ slug: string }> };

/** Read-only tournament data for other clients (a future mobile app, a TV display, etc). */
export const GET = handler(async (_req: NextRequest, { params }: Ctx) => {
  const b = await getPublicBundle((await params).slug);
  if (!b) throw new HttpError(404, "Tournament not found.");
  const s = stats(b.teams, b.matches, b.tournament.points);
  const table = s.table.map((r) => ({ ...r, team: r.team._id }));
  return ok({ ...b, table, scorers: s.goals, assists: s.assists, cards: s.cards });
});
