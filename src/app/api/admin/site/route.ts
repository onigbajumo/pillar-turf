import type { NextRequest } from "next/server";
import { handler, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getSiteInfo } from "@/lib/data";
import { Setting } from "@/lib/models";
import { siteSchema } from "@/lib/validators";

export const GET = handler(async () => {
  await requireAdmin();
  return ok(await getSiteInfo());
});

export const PUT = handler(async (req: NextRequest) => {
  await requireAdmin();
  const value = siteSchema.parse(await req.json());
  await Setting.updateOne({ key: "site" }, { $set: { value } }, { upsert: true });
  return ok(value);
});
