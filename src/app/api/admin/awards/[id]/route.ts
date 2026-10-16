import type { NextRequest } from "next/server";
import { handler, oid, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { destroyMedia } from "@/lib/cloudinary";
import { Award } from "@/lib/models";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const a = await Award.findById(oid((await params).id));
  if (a) {
    await destroyMedia(a.media);
    await a.deleteOne();
  }
  return ok({ ok: true });
});
