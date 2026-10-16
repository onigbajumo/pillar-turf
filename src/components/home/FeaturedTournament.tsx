import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Bundle } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { byOrder, scorers, assisters, standings, status } from "@/lib/league";
import { Crest } from "../Crest";
import { MatchRow } from "../MatchRow";

/** The tournament happening now (or next): mini table, upcoming games and the scoring leaders. */
export function FeaturedTournament({ b }: { b: Bundle }) {
  const { tournament: t, teams, matches } = b;
  const rows = standings(teams, matches, t.points).slice(0, 5);
  const teamMap = new Map(teams.map((x) => [x._id, x]));
  const st = status(matches);
  const upcoming = matches.filter((m) => !m.played).sort(byOrder);
  const recent = matches.filter((m) => m.played).sort((a, c) => byOrder(c, a));
  const list = st === "Completed" ? recent.slice(0, 4) : upcoming.slice(0, 4);
  const listDate = list[0]?.date;
  const topScorer = scorers(matches)[0], topAssist = assisters(matches)[0];
  const played = matches.filter((m) => m.played).length;
  const title = `${t.name}${t.name.includes(String(t.year)) ? "" : " " + t.year}`;

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="atitle">{st === "In progress" ? "Happening now" : st === "Upcoming" ? "Coming up" : "Latest tournament"}</div>
          <h2 className="display mt-1 text-[clamp(32px,5vw,48px)]">{title}</h2>
          {t.tagline && <p className="hint mt-1">{t.tagline}</p>}
        </div>
        <Link href={`/${t.slug}`} className="btn primary">Full table &amp; fixtures <ArrowRight size={16} /></Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="board">
          <table className="lt" aria-label={`${title} table, top 5`}>
            <thead><tr><th>Pos</th><th className="team">Team</th><th>P</th><th>GD</th><th className="pts">Pts</th></tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const gd = r.gf - r.ga;
                return (
                  <tr key={r.team._id} className={played && i === 0 ? "lead" : ""}>
                    <td className="pos">{i + 1}</td>
                    <td className="team"><div className="flex items-center gap-2.5"><Crest team={r.team} size="sm" /><span>{r.team.name}</span></div></td>
                    <td>{r.p}</td>
                    <td className={gd > 0 ? "gd-pos" : gd < 0 ? "gd-neg" : ""}>{gd > 0 ? `+${gd}` : gd}</td>
                    <td className="pts">{r.pts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="grid gap-1.5 border-t border-[var(--line)] p-3.5">
            <div className="flex justify-between text-sm"><span className="hint">Matches played</span><b className="tnum">{played} / {matches.length}</b></div>
            <div className="progress"><span style={{ width: `${matches.length ? (played / matches.length) * 100 : 0}%` }} /></div>
          </div>
        </div>

        <div className="grid content-start gap-4">
          <div className="board">
            <div className="round-h">
              <span><b>{st === "Completed" ? "Latest results" : "Up next"}</b>{listDate && ` · ${fmtDate(listDate)}`}</span>
            </div>
            {list.length ? list.map((m) => <MatchRow key={m._id} m={m} teams={teamMap} />) : <div className="empty">Fixtures will appear here soon.</div>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Leader title="Golden Boot" name={topScorer?.name} team={topScorer ? teamMap.get(topScorer.team) : undefined} value={topScorer?.goals} unit="goals" />
            <Leader title="Playmaker" name={topAssist?.name} team={topAssist ? teamMap.get(topAssist.team) : undefined} value={topAssist?.assists} unit="assists" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Leader({ title, name, team, value, unit }: { title: string; name?: string; team?: { name: string; color: string }; value?: number; unit: string }) {
  return (
    <div className={`card award grid content-start gap-1 ${name ? "" : "tba"}`}>
      <div className="atitle">{title}</div>
      <div className="awinner !text-[22px]">{name ?? "No leader yet"}</div>
      {name && team && (
        <div className="flex items-center gap-2 text-sm"><Crest team={team} size="sm" /><span className="truncate">{team.name}</span></div>
      )}
      {name && <div className="hint tnum">{value} {value === 1 ? unit.replace(/s$/, "") : unit}</div>}
    </div>
  );
}
