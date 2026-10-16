import type { NextRequest } from "next/server";
import { handler, oid, ok } from "@/lib/api";
import { HttpError, requireAdmin } from "@/lib/auth";
import { roundRobin } from "@/lib/league";
import { Match, Team } from "@/lib/models";
import { scheduleSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

/** Replaces all fixtures with a fresh round-robin schedule. */
export const POST = handler(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const tournament = oid((await params).id);
  const { double } = scheduleSchema.parse(await req.json());
  const teams = await Team.find({ tournament }).sort({ order: 1 }).lean();
  if (teams.length < 2) throw new HttpError(400, "Add at least two teams first.");
  const rounds = roundRobin(teams.map((t) => String(t._id)), double);
  let no = 0;
  const docs = rounds.flatMap((pairs, r) =>
    pairs.map(([home, away]) => ({ tournament, home: oid(home), away: oid(away), round: r + 1, no: ++no })),
  );
  await Match.deleteMany({ tournament });
  await Match.insertMany(docs);
  return ok({ matches: docs.length, rounds: rounds.length }, 201);
});
