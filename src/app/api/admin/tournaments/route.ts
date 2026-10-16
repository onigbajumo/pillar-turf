import type { NextRequest } from "next/server";
import { handler, oid, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { listTournaments } from "@/lib/data";
import { Team, Tournament } from "@/lib/models";
import { checkCode, defaultCode } from "@/lib/slug";
import { tournamentCreateSchema } from "@/lib/validators";

export const GET = handler(async () => {
  await requireAdmin();
  return ok(await listTournaments({ includeHidden: true }));
});

export const POST = handler(async (req: NextRequest) => {
  await requireAdmin();
  const body = tournamentCreateSchema.parse(await req.json());
  const t = await Tournament.create({
    name: body.name,
    year: body.year,
    tagline: body.tagline,
    venue: body.venue || "Pillars Turf",
    slug: body.slug ? await checkCode(body.slug) : await defaultCode(body.name, body.year),
  });
  if (body.copyTeamsFrom) {
    const prev = await Team.find({ tournament: oid(body.copyTeamsFrom) }).sort({ order: 1 }).lean();
    if (prev.length)
      await Team.insertMany(prev.map((p, i) => ({ tournament: t._id, name: p.name, color: p.color, squad: p.squad, order: i })));
  }
  return ok({ _id: String(t._id), slug: t.slug }, 201);
});
