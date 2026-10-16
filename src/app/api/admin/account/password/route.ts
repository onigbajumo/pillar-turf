import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { handler } from "@/lib/api";
import { HttpError, requireAdmin, startSession } from "@/lib/auth";
import { AdminUser } from "@/lib/models";
import { changePasswordSchema } from "@/lib/validators";

export const POST = handler(async (req: NextRequest) => {
  const me = await requireAdmin();
  const { current, next } = changePasswordSchema.parse(await req.json());
  const user = await AdminUser.findById(me.id);
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) throw new HttpError(400, "Your current password is incorrect.");
  user.passwordHash = await bcrypt.hash(next, 12);
  user.passwordVersion += 1; // signs out other devices
  await user.save();
  const res = NextResponse.json({ ok: true });
  await startSession(res, user); // keep this device signed in
  return res;
});
