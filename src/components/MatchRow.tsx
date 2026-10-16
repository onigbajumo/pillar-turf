import type { MatchT, Scorer, Tally, TeamT } from "@/lib/league";
import { scorerText, tallyText } from "@/lib/league";
import { Crest } from "./Crest";

/** One side's goals, assists and cards, each line led by a small mark. */
function Events({ goals, assists, yellows, reds, away }: { goals: Scorer[]; assists: Tally[]; yellows: Tally[]; reds: Tally[]; away?: boolean }) {
  const lines = [
    goals.length > 0 && { mark: <span className="mk-goal" title="Goals" />, text: scorerText(goals), label: "Goals" },
    assists.length > 0 && { mark: <span className="mk-assist" title="Assists">A</span>, text: tallyText(assists), label: "Assists" },
    yellows.length > 0 && { mark: <span className="mk-card y" title="Yellow cards" />, text: tallyText(yellows), label: "Yellow cards" },
    reds.length > 0 && { mark: <span className="mk-card r" title="Red cards" />, text: tallyText(reds), label: "Red cards" },
  ].filter(Boolean) as { mark: React.ReactNode; text: string; label: string }[];
  if (!lines.length) return <div />;
  return (
    <ul className={`events ${away ? "r" : ""}`}>
      {lines.map((l) => (
        <li key={l.label}>
          {l.mark}
          <span className="sr-only">{l.label}: </span>
          <span>{l.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function MatchRow({ m, teams, children }: { m: MatchT; teams: Map<string, TeamT>; children?: React.ReactNode }) {
  const h = teams.get(m.home), a = teams.get(m.away);
  const meta = [m.no ? `Match ${m.no}` : "", m.time].filter(Boolean).join(" · ");
  const hasEvents = m.played && [m.homeScorers, m.awayScorers, m.homeAssists, m.awayAssists, m.homeYellows, m.awayYellows, m.homeReds, m.awayReds].some((l) => l?.length);
  return (
    <div className="match">
      <div className="side"><Crest team={h} size="sm" /><span>{h?.name ?? "Removed team"}</span></div>
      {m.played ? <span className="score">{m.homeScore} – {m.awayScore}</span> : <span className="score vs">vs</span>}
      <div className="side away"><Crest team={a} size="sm" /><span>{a?.name ?? "Removed team"}</span></div>
      {hasEvents && (
        <>
          <Events goals={m.homeScorers} assists={m.homeAssists} yellows={m.homeYellows} reds={m.homeReds} />
          <div />
          <Events goals={m.awayScorers} assists={m.awayAssists} yellows={m.awayYellows} reds={m.awayReds} away />
        </>
      )}
      {meta && <div className="mmeta">{meta}</div>}
      {children}
    </div>
  );
}
