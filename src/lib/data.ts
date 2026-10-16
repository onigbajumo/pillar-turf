import "server-only";
import mongoose from "mongoose";
import { cache } from "react";
import { connectDB } from "./db";
import { Award, Match, Setting, Team, Tournament } from "./models";
import { plain } from "./api";
import type { AwardT, MatchT, TeamT, TournamentT } from "./league";
import { DEFAULT_SITE, type SiteInfo } from "./site";

export type Bundle = { tournament: TournamentT; teams: TeamT[]; matches: MatchT[]; awards: AwardT[] };

export async function listTournaments(opts: { includeHidden?: boolean } = {}) {
  await connectDB();
  const ts = await Tournament.find(opts.includeHidden ? {} : { published: true }).sort({ year: -1, createdAt: -1 }).lean();
  const ids = ts.map((t) => t._id);
  const [teamCounts, matches] = await Promise.all([
    Team.aggregate([{ $match: { tournament: { $in: ids } } }, { $group: { _id: "$tournament", n: { $sum: 1 } } }]),
    Match.find({ tournament: { $in: ids } }, { tournament: 1, played: 1, date: 1 }).lean(),
  ]);
  return plain(ts).map((t: TournamentT) => {
    const ms = matches.filter((m) => String(m.tournament) === t._id);
    const dates = ms.map((m) => m.date).filter(Boolean).sort();
    return {
      ...t,
      teamCount: teamCounts.find((c) => String(c._id) === t._id)?.n ?? 0,
      matchCount: ms.length,
      playedCount: ms.filter((m) => m.played).length,
      firstDate: dates[0] ?? "",
      lastDate: dates[dates.length - 1] ?? "",
    };
  }) as (TournamentT & { teamCount: number; matchCount: number; playedCount: number; firstDate: string; lastDate: string })[];
}

async function bundleFor(filter: Record<string, unknown>): Promise<Bundle | null> {
  await connectDB();
  const t = await Tournament.findOne(filter).lean();
  if (!t) return null;
  const [teams, matches, awards] = await Promise.all([
    Team.find({ tournament: t._id }).sort({ order: 1, createdAt: 1 }).lean(),
    Match.find({ tournament: t._id }).sort({ round: 1, no: 1 }).lean(),
    Award.find({ tournament: t._id }).sort({ order: 1, createdAt: 1 }).lean(),
  ]);
  // matches saved before assists/cards existed have no such fields
  const EMPTY = { homeAssists: [], awayAssists: [], homeYellows: [], awayYellows: [], homeReds: [], awayReds: [] };
  return plain({ tournament: t, teams, matches: matches.map((m) => ({ ...EMPTY, ...m })), awards });
}

// cached per request so the tournament layout and page share one query
export const getPublicBundle = cache((slug: string) => bundleFor({ slug, published: true }));
export const getBundleById = (id: string) => (mongoose.isValidObjectId(id) ? bundleFor({ _id: id }) : Promise.resolve(null));

export async function getSiteInfo(): Promise<SiteInfo> {
  await connectDB();
  const doc = await Setting.findOne({ key: "site" }).lean();
  return { ...DEFAULT_SITE, ...((doc?.value as Partial<SiteInfo>) ?? {}) };
}
