// Pitch information shown on the home page (sessions, rules, prices, payment). Editable by admins.

export type Session = { day: string; time: string; deadline: string };
export type SiteInfo = {
  sessions: Session[];
  lateRule: string;
  rules: string[];
  pricePerPlayer: string;
  subscription: string;
  payment: { accountNumber: string; bank: string; accountName: string };
  closing: string;
};

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const LAGOS_OFFSET_MIN = 60; // Nigeria is UTC+1 all year

/** "7:00pm" -> minutes after midnight */
function minutesOf(t: string) {
  const m = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i.exec(t);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toLowerCase() === "pm") h += 12;
  return h * 60 + Number(m[2] ?? 0);
}

export type NextSession = { session: Session; when: "now" | "today" | "tomorrow" | "later"; days: number; dateLabel: string };

/** The next weekly session from `now`, in Lagos time. Sessions whose day or time can't be read are skipped. */
export function nextSession(sessions: Session[], now = new Date()): NextSession | null {
  const local = new Date(now.getTime() + LAGOS_OFFSET_MIN * 60_000); // read with getUTC* = Lagos wall clock
  const today = local.getUTCDay(), nowMin = local.getUTCHours() * 60 + local.getUTCMinutes();
  let best: (NextSession & { score: number }) | null = null;
  for (const s of sessions) {
    const day = DAYS.findIndex((d) => s.day.toLowerCase().startsWith(d.slice(0, 3)));
    const times = s.time.split(/[–-]/);
    const start = minutesOf(times[0] ?? ""), end = minutesOf(times[1] ?? "") ?? (start ?? 0) + 120;
    if (day < 0 || start == null) continue;
    let days = (day - today + 7) % 7;
    const live = days === 0 && nowMin >= start && nowMin < end;
    if (days === 0 && nowMin >= end) days = 7;
    const score = live ? -1 : days * 1440 + start - (days === 0 ? nowMin : 0);
    if (!best || score < best.score) {
      const date = new Date(local.getTime() + days * 86_400_000);
      best = {
        session: s, days, score,
        when: live ? "now" : days === 0 ? "today" : days === 1 ? "tomorrow" : "later",
        dateLabel: date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
      };
    }
  }
  if (!best) return null;
  const { score: _s, ...rest } = best;
  return rest;
}

// Starting content, from the pitch announcement. Used until an admin saves their own.
export const DEFAULT_SITE: SiteInfo = {
  sessions: [
    { day: "Thursday", time: "7:00pm – 10:00pm", deadline: "7:10pm" },
    { day: "Saturday", time: "7:00am – 11:30am", deadline: "7:59am" },
  ],
  lateRule: "Any player who arrives after the deadline sits out and watches. First come, first served: there is no grace period once play has started.",
  rules: [
    "Always allow the first touch on a throw-in.",
    "At a corner, 3 players stay in the box and one at the halfway line, or all players can stay in the box.",
    "No fighting. Fighting results in a 2-month match ban.",
    "No smoking or drinking for active players on the pitch. Anyone found doing so forfeits their set. No pleading.",
    "A player who receives a red card is out of play for 3 throw-ins.",
    "If the keeper catches the ball outside the arc, it is a penalty.",
    "Everyone pays their tally before the set starts. If it isn't complete, the ball doesn't start.",
    "Everyone not playing stays outside the field. The referee only starts when both teams are ready.",
    "The referee's decision is final. Arguing with the referee or causing a nuisance results in a 3-match ban.",
  ],
  pricePerPlayer: "₦2,000",
  subscription: "₦15,000 a month. Reach out to the admin if you're interested.",
  payment: { accountNumber: "5762454936", bank: "Moniepoint", accountName: "Mijjy Fabrics" },
  closing: "Thank you all for understanding. One love ❤️",
};
