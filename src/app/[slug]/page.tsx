import { notFound } from "next/navigation";
import { AssistsTable, LeagueTable, ScorersTable } from "@/components/LeagueTable";
import { MatchRow } from "@/components/MatchRow";
import { getPublicBundle } from "@/lib/data";
import { assisters, byOrder, scorers, standings } from "@/lib/league";

export default async function TablePage({ params }: { params: Promise<{ slug: string }> }) {
  const b = await getPublicBundle((await params).slug);
  if (!b) notFound();
  const { tournament: t, teams, matches } = b;
  const rows = standings(teams, matches, t.points);
  const teamMap = new Map(teams.map((x) => [x._id, x]));
  const played = matches.filter((m) => m.played).sort((a, c) => byOrder(c, a));
  const upcoming = matches.filter((m) => !m.played).sort(byOrder);
  const goals = played.reduce((s, m) => s + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);

  return (
    <>
      <div className="stats">
        <div className="stat"><b>{teams.length}</b><span>Teams</span></div>
        <div className="stat"><b>{played.length}<small> / {matches.length}</small></b><span>Matches played</span></div>
        <div className="stat"><b>{goals}</b><span>Goals scored</span></div>
        <div className="stat"><b>{played.length ? (goals / played.length).toFixed(1) : "–"}</b><span>Goals per match</span></div>
      </div>

      <LeagueTable rows={rows} points={t.points} />

      <div className="grid gap-6 md:grid-cols-2">
        <section className="min-w-0">
          <h2 className="h2">Latest results</h2>
          <div className="board">
            {played.length ? played.slice(0, 5).map((m) => <MatchRow key={m._id} m={m} teams={teamMap} />) : <div className="empty">No results yet. Scores appear here after each game.</div>}
          </div>
        </section>
        <section className="min-w-0">
          <h2 className="h2">Up next</h2>
          <div className="board">
            {upcoming.length ? upcoming.slice(0, 5).map((m) => <MatchRow key={m._id} m={m} teams={teamMap} />) : <div className="empty">{matches.length ? "Every match has been played." : "No fixtures scheduled yet."}</div>}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="min-w-0">
          <h2 className="h2">Golden Boot race <small>Top scorers</small></h2>
          <ScorersTable rows={scorers(matches)} teams={teams} limit={5} />
        </section>
        <section className="min-w-0">
          <h2 className="h2">Playmaker race <small>Top assists</small></h2>
          <AssistsTable rows={assisters(matches)} teams={teams} limit={5} />
        </section>
      </div>
    </>
  );
}
