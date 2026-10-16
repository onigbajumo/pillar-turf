import { notFound } from "next/navigation";
import { AwardCard } from "@/components/AwardCard";
import { AssistsTable, CardsTable, FairPlayTable, ScorersTable } from "@/components/LeagueTable";
import { getPublicBundle } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { TOURNAMENT_SLOTS, autoWinner, matchdaySlots, roundDate, rounds, stats } from "@/lib/league";

export default async function AwardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const b = await getPublicBundle((await params).slug);
  if (!b) notFound();
  const { teams, matches, awards } = b;
  const teamMap = new Map(teams.map((x) => [x._id, x]));
  const byKey = new Map(awards.map((a) => [a.key, a]));
  const s = stats(teams, matches, b.tournament.points);
  const custom = awards.filter((a) => a.scope === "custom");

  return (
    <>
      <section>
        <h2 className="h2">Tournament awards</h2>
        <div className="grid-cards">
          {TOURNAMENT_SLOTS.map((slot) => (
            <AwardCard key={slot.key} slot={slot} award={byKey.get(slot.key)} auto={autoWinner(slot.key, s)} teams={teamMap} />
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="min-w-0">
          <h2 className="h2">Golden Boot <small>Goals</small></h2>
          <ScorersTable rows={s.goals} teams={teams} />
        </section>
        <section className="min-w-0">
          <h2 className="h2">Playmaker <small>Assists</small></h2>
          <AssistsTable rows={s.assists} teams={teams} />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="min-w-0">
          <h2 className="h2">Fair play <small>Team cards</small></h2>
          <FairPlayTable rows={s.cards.teams} teams={teams} />
        </section>
        <section className="min-w-0">
          <h2 className="h2">Discipline <small>Cards by player</small></h2>
          <CardsTable rows={s.cards.players} teams={teams} />
        </section>
      </div>
    </>
  );
}
