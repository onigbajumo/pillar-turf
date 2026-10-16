import { notFound } from "next/navigation";
import { MatchRow } from "@/components/MatchRow";
import { getPublicBundle } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { byOrder, roundDate, rounds } from "@/lib/league";

export default async function FixturesPage({ params }: { params: Promise<{ slug: string }> }) {
  const b = await getPublicBundle((await params).slug);
  if (!b) notFound();
  const teamMap = new Map(b.teams.map((x) => [x._id, x]));
  const all = [...b.matches].sort(byOrder);

  return (
    <section>
      <h2 className="h2">All fixtures {all.length > 0 && <small>{all.filter((m) => m.played).length} of {all.length} played</small>}</h2>
      <div className="board">
        {all.length === 0 && <div className="empty">No fixtures scheduled yet.</div>}
        {rounds(all).map((r) => {
          const day = all.filter((m) => m.round === r), date = roundDate(all, r);
          return (
            <div key={r}>
              <div className="round-h">
                <span><b>Matchday {r}</b>{date && ` · ${fmtDate(date)}`}</span>
                <span>{day.filter((m) => m.played).length}/{day.length} played</span>
              </div>
              {day.map((m) => <MatchRow key={m._id} m={m} teams={teamMap} />)}
            </div>
          );
        })}
      </div>
    </section>
  );
}
