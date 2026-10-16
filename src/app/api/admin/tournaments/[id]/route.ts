import type { NextRequest } from "next/server";
import { handler, oid, ok } from "@/lib/api";
import { HttpError, requireAdmin } from "@/lib/auth";
import { destroyMedia } from "@/lib/cloudinary";
import { getBundleById } from "@/lib/data";
import { Award, Match, Team, Tournament } from "@/lib/models";
import { tournamentUpdateSchema } from "@/lib/validators";
import { checkCode } from "@/lib/slug";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const b = await getBundleById((await params).id);
  if (!b) throw new HttpError(404, "Tournament not found.");
  return ok(b);
});

export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const body = tournamentUpdateSchema.parse(await req.json());
  const t = await Tournament.findById(oid(id));
  if (!t) throw new HttpError(404, "Tournament not found.");
  // the short link only changes when an admin edits it, so shared links keep working after a rename
  if (body.slug !== undefined && body.slug !== t.slug) body.slug = await checkCode(body.slug, id);
  Object.assign(t, body);
  await t.save();
  return ok({ _id: id, slug: t.slug });
});

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const _id = oid((await params).id);
  const [teams, awards] = await Promise.all([Team.find({ tournament: _id }).lean(), Award.find({ tournament: _id }).lean()]);
  await Promise.all([...teams.map((t) => destroyMedia(t.photo)), ...awards.map((a) => destroyMedia(a.media))]);
  await Promise.all([Team.deleteMany({ tournament: _id }), Match.deleteMany({ tournament: _id }), Award.deleteMany({ tournament: _id })]);
  await Tournament.deleteOne({ _id });
  return ok({ ok: true });
});
