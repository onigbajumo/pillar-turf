// Loads the 2026 Pillars Turf Cup: 8 teams and the 28 fixtures for Saturday 17 and Saturday 24 October.
//   npm run seed:2026            (skips if it already exists)
//   npm run seed:2026 -- --force (deletes and recreates it, including results)
import "./env";

import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { Award, Match, Team, Tournament } from "../src/lib/models";

const SLUG = "ptc26"; // short link: yourdomain.com/ptc26

const TEAMS: [string, string][] = [
  ["Aston Villa", "#7a1f3d"], ["Everton", "#1b3f94"], ["Brighton", "#1e6fd0"], ["Newcastle United", "#222222"],
  ["Real Betis", "#0b8a3e"], ["Valencia", "#f08a1c"], ["Getafe", "#1554a8"], ["Athletic Bilbao", "#c8102e"],
];
const AV = 0, EV = 1, BR = 2, NE = 3, RB = 4, VA = 5, GE = 6, AB = 7;

// Each matchday has 14 games in 10-minute slots with a 2-minute changeover, starting 8:00 AM.
const slot = (i: number) => {
  const fmt = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;
  const start = 8 * 60 + i * 12;
  return `${fmt(start)}–${fmt(start + 10)} AM`;
};

const DAY1: [number, number][] = [
  [AV, AB], [EV, GE], [NE, RB], [VA, AB], [EV, BR], [AV, GE], [RB, AB],
  [NE, VA], [BR, GE], [AV, EV], [NE, AB], [RB, GE], [BR, VA], [EV, NE],
];
const DAY2: [number, number][] = [
  [EV, VA], [AV, RB], [BR, NE], [GE, AB], [RB, VA], [AV, BR], [EV, AB],
  [NE, GE], [AV, VA], [EV, RB], [BR, AB], [AV, NE], [VA, GE], [BR, RB],
];

async function main() {
  await connectDB();
  const existing = await Tournament.findOne({ slug: SLUG });
  if (existing) {
    if (!process.argv.includes("--force")) {
      console.log(`${SLUG} already exists. Run with --force to recreate it (this deletes its results).`);
      return;
    }
    await Promise.all([Team.deleteMany({ tournament: existing._id }), Match.deleteMany({ tournament: existing._id }), Award.deleteMany({ tournament: existing._id })]);
    await existing.deleteOne();
  }

  const t = await Tournament.create({
    name: "Pillars Turf Cup",
    year: 2026,
    slug: SLUG,
    tagline: "8 teams · Saturdays 17 & 24 October · 28 matches",
  });
  const teams = await Team.insertMany(TEAMS.map(([name, color], order) => ({ tournament: t._id, name, color, order })));
  const id = (i: number) => teams[i]._id;

  let no = 0;
  const matches = [
    ...DAY1.map(([h, a], i) => ({ round: 1, date: "2026-10-17", time: slot(i), h, a })),
    ...DAY2.map(([h, a], i) => ({ round: 2, date: "2026-10-24", time: slot(i), h, a })),
  ].map(({ h, a, ...rest }) => ({ tournament: t._id, home: id(h), away: id(a), no: ++no, ...rest }));
  await Match.insertMany(matches);

  console.log(`Created ${t.name} ${t.year}: ${teams.length} teams, ${matches.length} matches. Public page: /${SLUG}`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
