// Pure tournament logic shared by public pages, admin screens and API.

export type Media = { url: string; publicId: string; type: "image" | "video" } | null;
export type Scorer = { name: string; goals: number };
/** A player and how many times something happened to them in one match (assists, yellow cards, red cards). */
export type Tally = { name: string; count: number };
export type TeamT = { _id: string; tournament: string; name: string; color: string; photo: Media; squad: string[]; order: number };
export type MatchT = {
  _id: string; tournament: string; home: string; away: string; round: number; no: number; date: string; time: string;
  played: boolean; homeScore: number | null; awayScore: number | null; homeScorers: Scorer[]; awayScorers: Scorer[];
  homeAssists: Tally[]; awayAssists: Tally[]; homeYellows: Tally[]; awayYellows: Tally[]; homeReds: Tally[]; awayReds: Tally[];
  updatedAt?: string;
};
export type AwardT = {
  _id: string; tournament: string; key: string; title: string; scope: "tournament" | "matchday" | "custom";
  round: number | null; winner: string; team: string | null; note: string; media: Media; order: number;
};
export type TournamentT = {
  _id: string; name: string; year: number; slug: string; venue: string; tagline: string; format: string; published: boolean;
  points: { win: number; draw: number; loss: number }; createdAt: string;
};

export type Row = { team: TeamT; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number; form: ("W" | "D" | "L")[] };

export const byOrder = (a: MatchT, b: MatchT) => a.round - b.round || a.no - b.no;

export function standings(teams: TeamT[], matches: MatchT[], points = { win: 3, draw: 1, loss: 0 }): Row[] {
  const rows = new Map<string, Row>(teams.map((t) => [t._id, { team: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] }]));
  for (const m of matches.filter((m) => m.played).sort(byOrder)) {
    const h = rows.get(m.home), a = rows.get(m.away);
    if (!h || !a || m.homeScore == null || m.awayScore == null) continue;
    h.p++; a.p++;
    h.gf += m.homeScore; h.ga += m.awayScore; a.gf += m.awayScore; a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) { h.w++; a.l++; h.pts += points.win; a.pts += points.loss; h.form.push("W"); a.form.push("L"); }
    else if (m.homeScore < m.awayScore) { a.w++; h.l++; a.pts += points.win; h.pts += points.loss; a.form.push("W"); h.form.push("L"); }
    else { h.d++; a.d++; h.pts += points.draw; a.pts += points.draw; h.form.push("D"); a.form.push("D"); }
  }
  return [...rows.values()].sort(
    (x, y) => y.pts - x.pts || y.gf - y.ga - (x.gf - x.ga) || y.gf - x.gf || x.team.name.localeCompare(y.team.name),
  );
}

export type ScorerRow = { name: string; team: string; goals: number; games: number };

export function scorers(matches: MatchT[]): ScorerRow[] {
  const map = new Map<string, ScorerRow & { ids: Set<string> }>();
  for (const m of matches) {
    if (!m.played) continue;
    for (const [list, team] of [[m.homeScorers, m.home], [m.awayScorers, m.away]] as const) {
      for (const s of list) {
        const k = s.name.trim().toLowerCase() + "|" + team;
        const cur = map.get(k) ?? { name: s.name.trim(), team, goals: 0, games: 0, ids: new Set<string>() };
        cur.goals += s.goals; cur.ids.add(m._id); cur.games = cur.ids.size;
        map.set(k, cur);
      }
    }
  }
  return [...map.values()].map(({ ids: _ids, ...r }) => r).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
}

/** "Tunde 2, Seyi" -> [{name:"Tunde",goals:2},{name:"Seyi",goals:1}] */
export function parseScorers(text: string): Scorer[] {
  return text.split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
    const m = /^(.*?)\s*(?:[x×]\s*)?(\d+)$/i.exec(s);
    return m && m[1] ? { name: m[1].trim(), goals: Math.max(1, Number(m[2])) } : { name: s, goals: 1 };
  });
}
export const scorerText = (list: Scorer[]) => list.map((s) => (s.goals > 1 ? `${s.name} ${s.goals}` : s.name)).join(", ");
export const goalsOf = (list: Scorer[]) => list.reduce((a, s) => a + s.goals, 0);

/** Same text format for assists and cards: "Tunde 2, Seyi". */
export const parseTally = (text: string): Tally[] => parseScorers(text).map((s) => ({ name: s.name, count: s.goals }));
export const tallyText = (list: Tally[] = []) => list.map((s) => (s.count > 1 ? `${s.name} ${s.count}` : s.name)).join(", ");
export const countOf = (list: Tally[] = []) => list.reduce((a, s) => a + s.count, 0);

export type AssistRow = { name: string; team: string; assists: number; games: number };

export function assisters(matches: MatchT[]): AssistRow[] {
  const map = new Map<string, AssistRow & { ids: Set<string> }>();
  for (const m of matches) {
    if (!m.played) continue;
    for (const [list, team] of [[m.homeAssists, m.home], [m.awayAssists, m.away]] as const) {
      for (const s of list ?? []) {
        const k = s.name.trim().toLowerCase() + "|" + team;
        const cur = map.get(k) ?? { name: s.name.trim(), team, assists: 0, games: 0, ids: new Set<string>() };
        cur.assists += s.count; cur.ids.add(m._id); cur.games = cur.ids.size;
        map.set(k, cur);
      }
    }
  }
  return [...map.values()].map(({ ids: _ids, ...r }) => r).sort((a, b) => b.assists - a.assists || a.name.localeCompare(b.name));
}

// Fair play points: 1 per yellow card, 3 per red card. Lower is better.
export const FAIR_PLAY = { yellow: 1, red: 3 };

export type CardRow = { name: string; team: string; yellow: number; red: number };
export type TeamCardRow = { team: string; yellow: number; red: number; points: number; played: number };

export function discipline(matches: MatchT[], teams: TeamT[]) {
  const players = new Map<string, CardRow>();
  const byTeam = new Map<string, TeamCardRow>(teams.map((t) => [t._id, { team: t._id, yellow: 0, red: 0, points: 0, played: 0 }]));
  for (const m of matches) {
    if (!m.played) continue;
    for (const [yellows, reds, team] of [[m.homeYellows, m.homeReds, m.home], [m.awayYellows, m.awayReds, m.away]] as const) {
      const tr = byTeam.get(team);
      if (tr) tr.played++;
      for (const [list, kind] of [[yellows, "yellow"], [reds, "red"]] as const) {
        for (const s of list ?? []) {
          const k = s.name.trim().toLowerCase() + "|" + team;
          const cur = players.get(k) ?? { name: s.name.trim(), team, yellow: 0, red: 0 };
          cur[kind] += s.count;
          players.set(k, cur);
          if (tr) { tr[kind] += s.count; tr.points += s.count * FAIR_PLAY[kind]; }
        }
      }
    }
  }
  return {
    players: [...players.values()].sort((a, b) => b.red - a.red || b.yellow - a.yellow || a.name.localeCompare(b.name)),
    // teams that haven't played yet go last, so they can't lead the fair play table
    teams: [...byTeam.values()].sort((a, b) => Number(!a.played) - Number(!b.played) || a.points - b.points || a.red - b.red),
  };
}

/* ---------- Award slots ---------- */
export type Slot = { key: string; title: string; scope: AwardT["scope"]; round?: number; teamOnly?: boolean; video?: boolean };

export const TOURNAMENT_SLOTS: Slot[] = [
  { key: "champion", title: "Champions", scope: "tournament", teamOnly: true },
  { key: "mvp", title: "Player of the Tournament", scope: "tournament" },
  { key: "boot", title: "Golden Boot", scope: "tournament" },
  { key: "assists", title: "Playmaker", scope: "tournament" },
  { key: "gk", title: "Best Goalkeeper", scope: "tournament" },
  { key: "goal", title: "Goal of the Tournament", scope: "tournament", video: true },
  { key: "fairplay", title: "Fair Play Award", scope: "tournament", teamOnly: true },
];

export const matchdaySlots = (round: number): Slot[] => [
  { key: `md${round}-potd`, title: "Player of the Day", scope: "matchday", round },
  { key: `md${round}-goal`, title: "Goal of the Day", scope: "matchday", round, video: true },
];

export const rounds = (matches: MatchT[]) => [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
export const roundDate = (matches: MatchT[], r: number) => matches.find((m) => m.round === r && m.date)?.date ?? "";

/** What an award shows when no winner has been set yet (live leader for Champions and Golden Boot). */
export type Stats = { table: Row[]; goals: ScorerRow[]; assists: AssistRow[]; cards: ReturnType<typeof discipline>; matches: MatchT[] };

export function stats(teams: TeamT[], matches: MatchT[], points?: TournamentT["points"]): Stats {
  return { table: standings(teams, matches, points), goals: scorers(matches), assists: assisters(matches), cards: discipline(matches, teams), matches };
}

/** What an award shows when no winner has been set yet (the live leader for awards the stats can decide). */
export function autoWinner(key: string, s: Stats) {
  const anyPlayed = s.matches.some((m) => m.played);
  const done = s.matches.length > 0 && s.matches.every((m) => m.played);
  const so = done ? "" : "so far";
  if (key === "champion" && anyPlayed) {
    return { winner: s.table[0].team.name, team: s.table[0].team._id, label: done ? "" : "Current leader" };
  }
  if (key === "boot" && s.goals.length) {
    const g = s.goals[0];
    return { winner: g.name, team: g.team, label: `${done ? "Won" : "Leading"} with ${g.goals} goal${g.goals > 1 ? "s" : ""}` };
  }
  if (key === "assists" && s.assists.length) {
    const a = s.assists[0];
    return { winner: a.name, team: a.team, label: `${done ? "Won" : "Leading"} with ${a.assists} assist${a.assists > 1 ? "s" : ""}` };
  }
  if (key === "fairplay" && anyPlayed && s.cards.teams.length) {
    const t = s.cards.teams[0], name = s.table.find((r) => r.team._id === t.team)?.team.name ?? "";
    const cards = t.yellow + t.red === 0 ? "No cards" : `${t.yellow} yellow, ${t.red} red`;
    return { winner: name, team: t.team, label: `Fewest cards ${so}: ${cards}`.replace(" :", ":") };
  }
  return null;
}

export function status(matches: MatchT[]) {
  if (!matches.length) return "Upcoming" as const;
  const played = matches.filter((m) => m.played).length;
  if (played === matches.length) return "Completed" as const;
  return played ? ("In progress" as const) : ("Upcoming" as const);
}

/** Circle-method round robin. Returns rounds of [home, away] pairs. */
export function roundRobin(ids: string[], double: boolean): [string, string][][] {
  const t: (string | null)[] = [...ids];
  if (t.length % 2) t.push(null);
  const n = t.length, out: [string, string][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = t[i], b = t[n - 1 - i];
      if (a && b) pairs.push((r + i) % 2 ? [b, a] : [a, b]);
    }
    out.push(pairs);
    t.splice(1, 0, t.pop()!);
  }
  if (double) out.push(...out.map((p) => p.map(([a, b]) => [b, a] as [string, string])));
  return out;
}
