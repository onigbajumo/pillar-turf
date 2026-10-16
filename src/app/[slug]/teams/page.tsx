import { notFound } from "next/navigation";
import { Crest } from "@/components/Crest";
import { Media } from "@/components/Media";
import { getPublicBundle } from "@/lib/data";
import { ordinal } from "@/lib/format";
import { assisters, scorers, standings } from "@/lib/league";

export default async function TeamsPage({ params }: { params: Promise<{ slug: string }> }) {
  const b = await getPublicBundle((await params).slug);
  if (!b) notFound();
  const rows = standings(b.teams, b.matches, b.tournament.points);
  const goals = scorers(b.matches);
  const assists = assisters(b.matches);
  const anyPlayed = rows.some((r) => r.p);

  return (
    <section>
      <h2 className="h2">Teams <small>Team photos and squads</small></h2>
      {rows.length === 0 && <div className="card empty">No teams yet.</div>}
      <div className="grid-cards">
        {rows.map((r, i) => {
          const t = r.team, top = goals.find((g) => g.team === t._id), maker = assists.find((a) => a.team === t._id);
          return (
            <article key={t._id} className="board flex flex-col">
              <div className="photo">
                {t.photo ? <Media media={t.photo} alt={`${t.name} team photo`} /> : (
                  <div className="grid justify-items-center gap-2 text-[12.5px] text-[var(--chalk)] opacity-90"><Crest team={t} size="lg" /><span>Team photo coming soon</span></div>
                )}
              </div>
              <div className="grid flex-1 content-start gap-2 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <b className="text-[17px]">{t.name}</b>
                  {anyPlayed && <span className={`place ${i < 3 ? "top" : ""}`}>{ordinal(i + 1)} · {r.pts} pts</span>}
                </div>
                <div className="tnum font-num text-[15px] text-[var(--muted)]">P{r.p} · W{r.w} D{r.d} L{r.l} · GF {r.gf} GA {r.ga}</div>
                {top && <div className="hint">Top scorer: <b>{top.name}</b> ({top.goals})</div>}
                {maker && <div className="hint">Top playmaker: <b>{maker.name}</b> ({maker.assists})</div>}
                {t.squad.length ? (
                  <ul className="squad">{t.squad.map((p) => <li key={p}>{p}</li>)}</ul>
                ) : <p className="hint">Squad list not added yet.</p>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
