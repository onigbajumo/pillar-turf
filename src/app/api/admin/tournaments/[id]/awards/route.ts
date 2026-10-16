import type { NextRequest } from "next/server";
import { handler, oid, ok } from "@/lib/api";
import { HttpError, requireAdmin } from "@/lib/auth";
import { destroyMedia } from "@/lib/cloudinary";
import { Award, Team, Tournament } from "@/lib/models";
import { awardUpsertSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

/** Creates or updates the award with this key (one per slot, e.g. "mvp" or "md2-goal"). */
export const PUT = handler(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const tournament = oid((await params).id);
  if (!(await Tournament.exists({ _id: tournament }))) throw new HttpError(404, "Tournament not found.");
  const body = awardUpsertSchema.parse(await req.json());
  if (body.team && !(await Team.exists({ _id: oid(body.team), tournament }))) throw new HttpError(400, "That team isn't in this tournament.");
  const existing = await Award.findOne({ tournament, key: body.key });
  if (existing?.media?.publicId && existing.media.publicId !== body.media?.publicId) await destroyMedia(existing.media);
  const data = { ...body, tournament, team: body.team ? oid(body.team) : null };
  const a = existing ? Object.assign(existing, data) : new Award({ ...data, order: await Award.countDocuments({ tournament }) });
  await a.save();
  return ok({ _id: String(a._id) });
});
