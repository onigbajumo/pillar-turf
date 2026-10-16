import type { NextRequest } from "next/server";
import { handler, oid, ok } from "@/lib/api";
import { HttpError, requireAdmin } from "@/lib/auth";
import { destroyMedia } from "@/lib/cloudinary";
import { Award, Match, Team } from "@/lib/models";
import { teamUpdateSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const body = teamUpdateSchema.parse(await req.json());
  const team = await Team.findById(oid((await params).id));
  if (!team) throw new HttpError(404, "Team not found.");
  const old = team.photo;
  if (body.photo !== undefined && old?.publicId && old.publicId !== body.photo?.publicId) await destroyMedia(old);
  Object.assign(team, body);
  await team.save();
  return ok({ ok: true });
});

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const _id = oid((await params).id);
  if (await Match.exists({ $or: [{ home: _id }, { away: _id }] }))
    throw new HttpError(400, "This team has fixtures. Delete its matches first.");
  const team = await Team.findById(_id);
  if (!team) throw new HttpError(404, "Team not found.");
  await destroyMedia(team.photo);
  await Award.updateMany({ team: _id }, { $set: { team: null } });
  await team.deleteOne();
  return ok({ ok: true });
});
