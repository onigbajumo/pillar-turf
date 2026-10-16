import { handler, ok } from "@/lib/api";
import { listTournaments } from "@/lib/data";

export const GET = handler(async () => ok(await listTournaments()));
