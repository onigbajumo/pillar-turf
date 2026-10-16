import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { handler, oid, ok } from "@/lib/api";
import { HttpError, requireAdmin } from "@/lib/auth";
import { AdminUser } from "@/lib/models";
import { adminUpdateSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

async function ownersLeft(excluding: string) {
  return AdminUser.countDocuments({ role: "owner", _id: { $ne: oid(excluding) } });
}

export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  const me = await requireAdmin({ owner: true });
  const { id } = await params;
  const body = adminUpdateSchema.parse(await req.json());
  const user = await AdminUser.findById(oid(id));
  if (!user) throw new HttpError(404, "Admin not found.");
  if (body.role === "admin" && user.role === "owner" && (await ownersLeft(id)) === 0)
    throw new HttpError(400, "There must always be at least one owner.");
  if (body.name) user.name = body.name;
  if (body.role) user.role = body.role;
  if (body.password) {
    user.passwordHash = await bcrypt.hash(body.password, 12);
    user.passwordVersion += 1;
  }
  await user.save();
  return ok({ _id: id, name: user.name, email: user.email, role: user.role, self: me.id === id });
});

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireAdmin({ owner: true });
  const { id } = await params;
  if (me.id === id) throw new HttpError(400, "You can't remove your own account.");
  const user = await AdminUser.findById(oid(id));
  if (!user) throw new HttpError(404, "Admin not found.");
  if (user.role === "owner" && (await ownersLeft(id)) === 0) throw new HttpError(400, "There must always be at least one owner.");
  await user.deleteOne();
  return ok({ ok: true });
});
