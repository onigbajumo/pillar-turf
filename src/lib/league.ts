// Pure tournament logic shared by public pages, admin screens and API.

export type Media = { url: string; publicId: string; type: "image" | "video" } | null;
export type Scorer = { name: string; goals: number };
export type TeamT = { _id: string; tournament: string; name: string; color: string; photo: Media; squad: string[]; order: number };
export type MatchT = {
  _id: string; tournament: string; home: string; away: string; round: number; no: number; date: string; time: string;
  played: boolean; homeScore: number | null; awayScore: number | null; homeScorers: Scorer[]; awayScorers: Scorer[];
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

/* ---------- Award slots ---------- */
export type Slot = { key: string; title: string; scope: AwardT["scope"]; round?: number; teamOnly?: boolean; video?: boolean };

export const TOURNAMENT_SLOTS: Slot[] = [
  { key: "champion", title: "Champions", scope: "tournament", teamOnly: true },
  { key: "mvp", title: "Player of the Tournament", scope: "tournament" },
  { key: "boot", title: "Golden Boot", scope: "tournament" },
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
export function autoWinner(key: string, table: Row[], goals: ScorerRow[], matches: MatchT[]) {
  if (key === "champion" && table.some((r) => r.p)) {
    const done = matches.length > 0 && matches.every((m) => m.played);
    return { winner: table[0].team.name, team: table[0].team._id, label: done ? "" : "Current leader" };
  }
  if (key === "boot" && goals.length) {
    const g = goals[0];
    return { winner: g.name, team: g.team, label: `Leading with ${g.goals} goal${g.goals > 1 ? "s" : ""}` };
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
