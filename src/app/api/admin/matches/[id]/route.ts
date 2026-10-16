import type { NextRequest } from "next/server";
import { handler, oid, ok } from "@/lib/api";
import { HttpError, requireAdmin } from "@/lib/auth";
import { goalsOf } from "@/lib/league";
import { Match } from "@/lib/models";
import { matchUpdateSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const body = matchUpdateSchema.parse(await req.json());
  const m = await Match.findById(oid((await params).id));
  if (!m) throw new HttpError(404, "Match not found.");
  const { result, ...rest } = body;
  Object.assign(m, rest);
  if (result === null) {
    m.set({ played: false, homeScore: null, awayScore: null, homeScorers: [], awayScorers: [] });
  } else if (result) {
    if (goalsOf(result.homeScorers) > result.homeScore || goalsOf(result.awayScorers) > result.awayScore)
      throw new HttpError(400, "The scorers add up to more goals than the score.");
    m.set({ played: true, ...result });
  }
  await m.save();
  return ok({ ok: true });
});

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  await Match.deleteOne({ _id: oid((await params).id) });
  return ok({ ok: true });
});
