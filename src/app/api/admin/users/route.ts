import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { handler, ok, plain } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { AdminUser } from "@/lib/models";
import { adminCreateSchema } from "@/lib/validators";

export const GET = handler(async () => {
  await requireAdmin();
  const users = await AdminUser.find({}, { passwordHash: 0, passwordVersion: 0 }).sort({ createdAt: 1 }).lean();
  return ok(plain(users));
});

export const POST = handler(async (req: NextRequest) => {
  await requireAdmin({ owner: true });
  const body = adminCreateSchema.parse(await req.json());
  const u = await AdminUser.create({
    name: body.name,
    email: body.email.toLowerCase(),
    role: body.role,
    passwordHash: await bcrypt.hash(body.password, 12),
  });
  return ok({ _id: String(u._id), name: u.name, email: u.email, role: u.role }, 201);
});
