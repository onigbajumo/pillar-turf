import { handler, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { cloudinaryReady } from "@/lib/cloudinary";

export const GET = handler(async () => {
  const me = await requireAdmin();
  return ok({ ...me, uploadsEnabled: cloudinaryReady() });
});
