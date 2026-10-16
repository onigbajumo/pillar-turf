import { FAIR_PLAY, type AssistRow, type CardRow, type Row, type ScorerRow, type TeamCardRow, type TeamT } from "@/lib/league";
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

/** Ranked player leaderboard (goals or assists). Players level on the value share a rank. */
function PlayerTable({ rows, teams, limit, valueLabel, empty, label }: {
  rows: { name: string; team: string; value: number; games: number }[]; teams: TeamT[]; limit?: number; valueLabel: string; empty: string; label: string;
}) {
  if (!rows.length) return <div className="board"><div className="empty">{empty}</div></div>;
  const byId = new Map(teams.map((t) => [t._id, t]));
  let rank = 0, prev: number | null = null;
  return (
    <div className="board">
      <div className="scroll">
        <table className="lt" aria-label={label}>
          <thead><tr><th>#</th><th className="team">Player</th><th className="team">Team</th><th>Games</th><th className="pts">{valueLabel}</th></tr></thead>
          <tbody>
            {rows.slice(0, limit).map((r, i) => {
              if (r.value !== prev) { rank = i + 1; prev = r.value; }
              const t = byId.get(r.team);
              return (
                <tr key={r.name + r.team}>
                  <td className="pos">{rank}</td>
                  <td className="team"><div className="flex items-center gap-2"><Crest team={t} size="sm" /><span>{r.name}</span></div></td>
                  <td className="sub">{t?.name ?? "Removed team"}</td>
                  <td>{r.games}</td>
                  <td className="pts">{r.value}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ScorersTable({ rows, teams, limit }: { rows: ScorerRow[]; teams: TeamT[]; limit?: number }) {
  return <PlayerTable rows={rows.map((r) => ({ ...r, value: r.goals }))} teams={teams} limit={limit} valueLabel="Goals" label="Top scorers" empty="No goalscorers recorded yet." />;
}

export function AssistsTable({ rows, teams, limit }: { rows: AssistRow[]; teams: TeamT[]; limit?: number }) {
  return <PlayerTable rows={rows.map((r) => ({ ...r, value: r.assists }))} teams={teams} limit={limit} valueLabel="Assists" label="Top assists" empty="No assists recorded yet." />;
}

export function CardsTable({ rows, teams }: { rows: CardRow[]; teams: TeamT[] }) {
  if (!rows.length) return <div className="board"><div className="empty">No cards shown yet.</div></div>;
  const byId = new Map(teams.map((t) => [t._id, t]));
  return (
    <div className="board">
      <div className="scroll">
        <table className="lt" aria-label="Cards by player">
          <thead><tr><th className="team">Player</th><th className="team">Team</th><th><span className="mk-card y inline-block align-middle" /> Yellow</th><th><span className="mk-card r inline-block align-middle" /> Red</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const t = byId.get(r.team);
              return (
                <tr key={r.name + r.team}>
                  <td className="team"><div className="flex items-center gap-2"><Crest team={t} size="sm" /><span>{r.name}</span></div></td>
                  <td className="sub">{t?.name ?? "Removed team"}</td>
                  <td>{r.yellow || "–"}</td>
                  <td>{r.red || "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FairPlayTable({ rows, teams }: { rows: TeamCardRow[]; teams: TeamT[] }) {
  const byId = new Map(teams.map((t) => [t._id, t]));
  return (
    <div className="board">
      <div className="scroll">
        <table className="lt" aria-label="Fair play table">
          <thead><tr><th>Pos</th><th className="team">Team</th><th>P</th><th>Yellow</th><th>Red</th><th className="pts">Pts</th></tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const t = byId.get(r.team);
              return (
                <tr key={r.team}>
                  <td className="pos">{i + 1}</td>
                  <td className="team"><div className="flex items-center gap-2"><Crest team={t} size="sm" /><span>{t?.name ?? "Removed team"}</span></div></td>
                  <td>{r.played}</td><td>{r.yellow}</td><td>{r.red}</td>
                  <td className="pts">{r.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="legend"><span>Yellow card {FAIR_PLAY.yellow} pt · Red card {FAIR_PLAY.red} pts</span><span>Fewest points wins the Fair Play Award</span></div>
    </div>
  );
}
