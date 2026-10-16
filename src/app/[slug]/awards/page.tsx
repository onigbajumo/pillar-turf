import { notFound } from "next/navigation";
import { AwardCard } from "@/components/AwardCard";
import { ScorersTable } from "@/components/LeagueTable";
import { getPublicBundle } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { TOURNAMENT_SLOTS, autoWinner, matchdaySlots, roundDate, rounds, scorers, standings } from "@/lib/league";

export default async function AwardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const b = await getPublicBundle((await params).slug);
  if (!b) notFound();
  const { teams, matches, awards } = b;
  const teamMap = new Map(teams.map((x) => [x._id, x]));
  const byKey = new Map(awards.map((a) => [a.key, a]));
  const table = standings(teams, matches, b.tournament.points);
  const goals = scorers(matches);
  const custom = awards.filter((a) => a.scope === "custom");

  return (
    <>
      <section>
        <h2 className="h2">Tournament awards</h2>
        <div className="grid-cards">
          {TOURNAMENT_SLOTS.map((s) => (
            <AwardCard key={s.key} slot={s} award={byKey.get(s.key)} auto={autoWinner(s.key, table, goals, matches)} teams={teamMap} />
          ))}
        </div>
      </section>

      {rounds(matches).map((r) => (
        <section key={r}>
          <h2 className="h2">Matchday {r} {roundDate(matches, r) && <small>{fmtDate(roundDate(matches, r))}</small>}</h2>
          <div className="grid-cards">
            {matchdaySlots(r).map((s) => <AwardCard key={s.key} slot={s} award={byKey.get(s.key)} teams={teamMap} />)}
          </div>
        </section>
      ))}

      {custom.length > 0 && (
        <section>
          <h2 className="h2">Special awards</h2>
          <div className="grid-cards">
            {custom.map((a) => <AwardCard key={a._id} slot={{ key: a.key, title: a.title, scope: "custom" }} award={a} teams={teamMap} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="h2">Full scoring chart</h2>
        <ScorersTable rows={goals} teams={teams} />
      </section>
    </>
  );
}
