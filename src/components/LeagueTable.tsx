import type { Row, ScorerRow, TeamT } from "@/lib/league";
import { Crest } from "./Crest";

export function LeagueTable({ rows, points }: { rows: Row[]; points: { win: number; draw: number; loss: number } }) {
  const anyPlayed = rows.some((r) => r.p);
  return (
    <div className="board">
      <div className="scroll">
        <table className="lt" aria-label="League table">
          <thead>
            <tr>
              <th>Pos</th><th className="team">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Form</th><th className="pts">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={11} className="empty" style={{ fontFamily: "inherit", fontSize: 15, fontWeight: 400 }}>No teams have been added yet.</td></tr>
            )}
            {rows.map((r, i) => {
              const gd = r.gf - r.ga, f = r.form.slice(-5);
              return (
                <tr key={r.team._id} className={anyPlayed && i === 0 ? "lead" : ""}>
                  <td className="pos">{i + 1}</td>
                  <td className="team"><div className="flex items-center gap-2.5"><Crest team={r.team} /><span>{r.team.name}</span></div></td>
                  <td>{r.p}</td><td>{r.w}</td><td>{r.d}</td><td>{r.l}</td><td>{r.gf}</td><td>{r.ga}</td>
                  <td className={gd > 0 ? "gd-pos" : gd < 0 ? "gd-neg" : ""}>{gd > 0 ? `+${gd}` : gd}</td>
                  <td>
                    <div className="form">
                      {f.length
                        ? f.map((x, k) => <i key={k} className={x} title={x === "W" ? "Win" : x === "D" ? "Draw" : "Loss"}>{x}</i>)
                        : [0, 1, 2].map((k) => <i key={k} className="none" />)}
                    </div>
                  </td>
                  <td className="pts">{r.pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="legend">
        <span>Win {points.win} · Draw {points.draw} · Loss {points.loss}</span>
        <span>Ties split by goal difference, then goals scored</span>
      </div>
    </div>
  );
}

export function ScorersTable({ rows, teams, limit }: { rows: ScorerRow[]; teams: TeamT[]; limit?: number }) {
  if (!rows.length) return <div className="board"><div className="empty">No goalscorers recorded yet.</div></div>;
  const byId = new Map(teams.map((t) => [t._id, t]));
  let rank = 0, prev: number | null = null;
  return (
    <div className="board">
      <div className="scroll">
        <table className="lt" aria-label="Top scorers">
          <thead><tr><th>#</th><th className="team">Player</th><th className="team">Team</th><th>Games</th><th className="pts">Goals</th></tr></thead>
          <tbody>
            {rows.slice(0, limit).map((r, i) => {
              if (r.goals !== prev) { rank = i + 1; prev = r.goals; }
              const t = byId.get(r.team);
              return (
                <tr key={r.name + r.team}>
                  <td className="pos">{rank}</td>
                  <td className="team"><div className="flex items-center gap-2"><Crest team={t} size="sm" /><span>{r.name}</span></div></td>
                  <td className="sub">{t?.name ?? "Removed team"}</td>
                  <td>{r.games}</td>
                  <td className="pts">{r.goals}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
