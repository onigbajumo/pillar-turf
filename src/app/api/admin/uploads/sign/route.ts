import type { NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api";
import { HttpError, requireAdmin } from "@/lib/auth";
import { cloudinaryReady, signUpload } from "@/lib/cloudinary";

// subfolder inside CLOUDINARY_FOLDER, e.g. "pillars-turf-cup-2026/teams"
const body = z.object({ folder: z.string().regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*$|^$/).max(80).default("") });

export const POST = handler(async (req: NextRequest) => {
  await requireAdmin();
  if (!cloudinaryReady()) throw new HttpError(503, "Photo uploads aren't set up yet. Add the Cloudinary keys to the server's environment.");
  const { folder } = body.parse(await req.json());
  return ok(signUpload(folder));
});
