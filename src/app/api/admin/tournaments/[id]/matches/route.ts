import type { NextRequest } from "next/server";
import { handler, oid, ok } from "@/lib/api";
import { HttpError, requireAdmin } from "@/lib/auth";
import { Match, Team } from "@/lib/models";
import { matchCreateSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const tournament = oid((await params).id);
  const body = matchCreateSchema.parse(await req.json());
  const n = await Team.countDocuments({ tournament, _id: { $in: [oid(body.home), oid(body.away)] } });
  if (n !== 2) throw new HttpError(400, "Both teams must belong to this tournament.");
  const last = await Match.findOne({ tournament }).sort({ no: -1 }).lean();
  const m = await Match.create({ tournament, ...body, home: oid(body.home), away: oid(body.away), no: (last?.no ?? 0) + 1 });
  return ok({ _id: String(m._id), no: m.no }, 201);
});

/** Deletes every fixture in the tournament. */
export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const tournament = oid((await params).id);
  const r = await Match.deleteMany({ tournament });
  return ok({ deleted: r.deletedCount });
});
