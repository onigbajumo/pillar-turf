"use client";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import type { Bundle } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { byOrder, countOf, goalsOf, parseScorers, parseTally, roundDate, rounds, scorerText, tallyText, type MatchT, type TeamT } from "@/lib/league";
import { MatchRow } from "../MatchRow";
import { ConfirmButton } from "./ConfirmButton";
import { useRun } from "./hooks";

export function FixturesTab({ bundle }: { bundle: Bundle }) {
  const t = bundle.tournament;
  const run = useRun(t._id);
  const teamMap = new Map(bundle.teams.map((x) => [x._id, x]));
  const all = [...bundle.matches].sort(byOrder);
  const lastRound = all.length ? all[all.length - 1].round : 1;

  return (
    <>
      <div className="board">
        {all.length === 0 && <div className="empty">No fixtures yet. Add matches below, or generate a full schedule.</div>}
        {rounds(all).map((r) => {
          const day = all.filter((m) => m.round === r), date = roundDate(all, r);
          return (
            <div key={r}>
              <div className="round-h">
                <span><b>Matchday {r}</b>{date && ` · ${fmtDate(date)}`}</span>
                <span>{day.filter((m) => m.played).length}/{day.length} played</span>
              </div>
              {day.map((m) => <MatchEditor key={m._id + (m.updatedAt ?? "")} m={m} teams={teamMap} run={run} />)}
            </div>
          );
        })}
      </div>
      <p className="hint">In goals, assists and cards, separate names with commas and put a number after anyone who did it more than once, e.g. <code>Tunde 2, Seyi</code>. Leave a box blank if you don&apos;t know.</p>
      <AddMatch bundle={bundle} defaultRound={lastRound} run={run} />
      <Schedule bundle={bundle} run={run} />
    </>
  );
}

type Run = ReturnType<typeof useRun>;

const SIDES = ["home", "away"] as const;
type Side = (typeof SIDES)[number];
type EventField = "Scorers" | "Assists" | "Yellows" | "Reds";
const EVENT_FIELDS: { key: EventField; label: string; mark: string; hint: string }[] = [
  { key: "Scorers", label: "Goals", mark: "mk-goal", hint: "Tunde 2, Seyi" },
  { key: "Assists", label: "Assists", mark: "mk-assist", hint: "Bayo" },
  { key: "Yellows", label: "Yellow cards", mark: "mk-card y", hint: "Kola" },
  { key: "Reds", label: "Red cards", mark: "mk-card r", hint: "" },
];

function MatchEditor({ m, teams, run }: { m: MatchT; teams: Map<string, TeamT>; run: Run }) {
  const [hs, setHs] = useState(m.played ? String(m.homeScore) : "");
  const [as, setAs] = useState(m.played ? String(m.awayScore) : "");
  const [ev, setEv] = useState<Record<`${Side}${EventField}`, string>>({
    homeScorers: scorerText(m.homeScorers), awayScorers: scorerText(m.awayScorers),
    homeAssists: tallyText(m.homeAssists), awayAssists: tallyText(m.awayAssists),
    homeYellows: tallyText(m.homeYellows), awayYellows: tallyText(m.awayYellows),
    homeReds: tallyText(m.homeReds), awayReds: tallyText(m.awayReds),
  });
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [info, setInfo] = useState({ round: m.round, date: m.date, time: m.time });
  const names = { home: teams.get(m.home)?.name ?? "Home", away: teams.get(m.away)?.name ?? "Away" };
  const patch = (body: unknown, msg: string) => run(() => api(`/api/admin/matches/${m._id}`, { method: "PATCH", body }), msg);

  function saveResult() {
    if (hs === "" || as === "") return toast.error("Enter both scores first.");
    const score = { home: Number(hs), away: Number(as) };
    const r = {
      homeScorers: parseScorers(ev.homeScorers), awayScorers: parseScorers(ev.awayScorers),
      homeAssists: parseTally(ev.homeAssists), awayAssists: parseTally(ev.awayAssists),
      homeYellows: parseTally(ev.homeYellows), awayYellows: parseTally(ev.awayYellows),
      homeReds: parseTally(ev.homeReds), awayReds: parseTally(ev.awayReds),
    };
    for (const side of SIDES) {
      if (goalsOf(r[`${side}Scorers`]) > score[side]) return toast.error(`${names[side]}'s scorers add up to more than ${score[side]} goal${score[side] === 1 ? "" : "s"}.`);
      if (countOf(r[`${side}Assists`]) > score[side]) return toast.error(`${names[side]} has more assists than goals.`);
    }
    patch({ result: { homeScore: score.home, awayScore: score.away, ...r } }, `Result saved: ${names.home} ${hs}–${as} ${names.away}.`);
  }

  const filled = Object.values(ev).filter(Boolean).length;

  return (
    <MatchRow m={m} teams={teams}>
      <div className="col-span-3 flex flex-wrap items-center justify-center gap-1.5 pt-1">
        <input id={`hs-${m._id}`} className="input num" type="number" min={0} value={hs} onChange={(e) => setHs(e.target.value)} aria-label={`${names.home} goals`} />
        <span>–</span>
        <input id={`as-${m._id}`} className="input num" type="number" min={0} value={as} onChange={(e) => setAs(e.target.value)} aria-label={`${names.away} goals`} />
        <button className="btn sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? "Hide match details" : `Scorers, assists & cards${filled ? ` (${filled})` : ""}`}
        </button>
        <button className="btn primary sm" onClick={saveResult}>Save result</button>
        {m.played && <button className="btn sm" onClick={() => patch({ result: null }, "Marked as not played.")}>Mark unplayed</button>}
        <button className="btn sm" onClick={() => setMore((v) => !v)} aria-expanded={more}>{more ? "Close" : "Edit match"}</button>
      </div>
      {open && (
        <div className="col-span-3 grid gap-3 rounded-lg bg-[var(--surface-2)] p-3 sm:grid-cols-2">
          {SIDES.map((side) => (
            <fieldset key={side} className="grid min-w-0 content-start gap-2">
              <legend className="mb-1 font-semibold">{names[side]}</legend>
              {EVENT_FIELDS.map((f) => (
                <label key={f.key} className="flex min-w-0 items-center gap-2">
                  <span className={f.mark} aria-hidden="true">{f.key === "Assists" ? "A" : null}</span>
                  <span className="w-[86px] flex-none text-[13px] text-[var(--muted)]">{f.label}</span>
                  <input
                    id={`${side}${f.key}-${m._id}`}
                    className="input min-w-0 flex-1"
                    value={ev[`${side}${f.key}`]}
                    onChange={(e) => setEv({ ...ev, [`${side}${f.key}`]: e.target.value })}
                    placeholder={f.hint ? `e.g. ${f.hint}` : ""}
                  />
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      )}
      {more && (
        <div className="col-span-3 flex flex-wrap items-end justify-center gap-2 border-t border-[var(--line)] pt-2">
          <label className="label">Matchday<input className="input num" type="number" min={1} value={info.round} onChange={(e) => setInfo({ ...info, round: Number(e.target.value) })} /></label>
          <label className="label">Date<input className="input" type="date" value={info.date} onChange={(e) => setInfo({ ...info, date: e.target.value })} /></label>
          <label className="label">Time<input className="input" value={info.time} onChange={(e) => setInfo({ ...info, time: e.target.value })} placeholder="8:12–8:22 AM" /></label>
          <button className="btn sm" onClick={() => patch(info, "Match updated.")}>Save changes</button>
          <ConfirmButton className="btn danger sm" onConfirm={() => run(() => api(`/api/admin/matches/${m._id}`, { method: "DELETE" }), "Match deleted.")}>Delete match</ConfirmButton>
        </div>
      )}
    </MatchRow>
  );
}

function AddMatch({ bundle, defaultRound, run }: { bundle: Bundle; defaultRound: number; run: Run }) {
  const teams = bundle.teams;
  const [f, setF] = useState({ home: teams[0]?._id ?? "", away: teams[1]?._id ?? "", round: defaultRound, date: roundDate(bundle.matches, defaultRound), time: "" });
  if (teams.length < 2) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.home === f.away) return toast.error("Pick two different teams.");
    if (await run(() => api(`/api/admin/tournaments/${bundle.tournament._id}/matches`, { body: f }), "Match added.")) setF({ ...f, time: "" });
  };
  return (
    <form className="card grid gap-3" onSubmit={submit}>
      <h2 className="h2 !mb-0">Add a match</h2>
      <div className="flex flex-wrap items-end gap-2">
        <label className="label">Home<select id="am-home" className="select" value={f.home} onChange={(e) => setF({ ...f, home: e.target.value })}>{teams.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select></label>
        <label className="label">Away<select id="am-away" className="select" value={f.away} onChange={(e) => setF({ ...f, away: e.target.value })}>{teams.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select></label>
        <label className="label">Matchday<input id="am-round" className="input num" type="number" min={1} value={f.round} onChange={(e) => setF({ ...f, round: Number(e.target.value) })} /></label>
        <label className="label">Date<input id="am-date" className="input" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
        <label className="label">Time<input id="am-time" className="input" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} placeholder="8:12–8:22 AM" /></label>
        <button className="btn primary">Add match</button>
      </div>
    </form>
  );
}

function Schedule({ bundle, run }: { bundle: Bundle; run: Run }) {
  const [double, setDouble] = useState(false);
  const id = bundle.tournament._id;
  const has = bundle.matches.length > 0;
  return (
    <div className="card grid gap-3">
      <h2 className="h2 !mb-0">Schedule tools</h2>
      <p className="hint">Generate a schedule where every team plays every other team. {has && "This replaces all current fixtures and results."}</p>
      <div className="flex flex-wrap gap-2">
        <select id="rr-mode" className="select" value={double ? "double" : "single"} onChange={(e) => setDouble(e.target.value === "double")}>
          <option value="single">Each pair plays once</option>
          <option value="double">Each pair plays twice</option>
        </select>
        <ConfirmButton className={has ? "btn danger" : "btn primary"} confirmLabel={has ? "Replace everything? Tap again" : "Tap again to generate"}
          onConfirm={() => run(() => api(`/api/admin/tournaments/${id}/schedule`, { body: { double } }), "Schedule generated.")}>
          Generate schedule
        </ConfirmButton>
        {has && (
          <ConfirmButton confirmLabel="Delete all fixtures? Tap again" onConfirm={() => run(() => api(`/api/admin/tournaments/${id}/matches`, { method: "DELETE" }), "All fixtures deleted.")}>
            Delete all fixtures
          </ConfirmButton>
        )}
      </div>
    </div>
  );
}
