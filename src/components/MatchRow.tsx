import type { MatchT, TeamT } from "@/lib/league";
import { scorerText } from "@/lib/league";
import { Crest } from "./Crest";

export function MatchRow({ m, teams, children }: { m: MatchT; teams: Map<string, TeamT>; children?: React.ReactNode }) {
  const h = teams.get(m.home), a = teams.get(m.away);
  const meta = [m.no ? `Match ${m.no}` : "", m.time].filter(Boolean).join(" · ");
  return (
    <div className="match">
      <div className="side"><Crest team={h} size="sm" /><span>{h?.name ?? "Removed team"}</span></div>
      {m.played ? <span className="score">{m.homeScore} – {m.awayScore}</span> : <span className="score vs">vs</span>}
      <div className="side away"><Crest team={a} size="sm" /><span>{a?.name ?? "Removed team"}</span></div>
      {m.played && (m.homeScorers.length > 0 || m.awayScorers.length > 0) && (
        <>
          <div className="scorers">{scorerText(m.homeScorers)}</div>
          <div className="scorers r">{scorerText(m.awayScorers)}</div>
        </>
      )}
      {meta && <div className="mmeta">{meta}</div>}
      {children}
    </div>
  );
}
