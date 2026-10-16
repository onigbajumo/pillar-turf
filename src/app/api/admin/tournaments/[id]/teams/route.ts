import type { NextRequest } from "next/server";
import { handler, oid, ok } from "@/lib/api";
import { HttpError, requireAdmin } from "@/lib/auth";
import { Team, Tournament } from "@/lib/models";
import { teamCreateSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const tournament = oid((await params).id);
  if (!(await Tournament.exists({ _id: tournament }))) throw new HttpError(404, "Tournament not found.");
  const body = teamCreateSchema.parse(await req.json());
  const esc = body.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (await Team.exists({ tournament, name: new RegExp(`^${esc}$`, "i") })) throw new HttpError(409, "A team with that name already exists.");
  const order = await Team.countDocuments({ tournament });
  const t = await Team.create({ tournament, ...body, order });
  return ok({ _id: String(t._id) }, 201);
});
