import Link from "next/link";
import { FeaturedTournament } from "@/components/home/FeaturedTournament";
import { HomeHero } from "@/components/home/HomeHero";
import { PitchInfo } from "@/components/PitchInfo";
import { getPublicBundle, getSiteInfo, listTournaments } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { nextSession } from "@/lib/site";

export const dynamic = "force-dynamic";

type Listed = Awaited<ReturnType<typeof listTournaments>>[number];

function statusOf(t: Listed) {
  if (!t.matchCount || !t.playedCount) return { label: "Upcoming", cls: "", rank: 1 };
  if (t.playedCount === t.matchCount) return { label: "Completed", cls: "", rank: 2 };
  return { label: "In progress", cls: "top", rank: 0 };
}

function dateRange(t: Listed) {
  if (!t.firstDate) return "Dates to be announced";
  if (t.firstDate === t.lastDate) return fmtDate(t.firstDate, { day: "numeric", month: "long" });
  return `${fmtDate(t.firstDate, { day: "numeric", month: "short" })} – ${fmtDate(t.lastDate, { day: "numeric", month: "short" })}`;
}

export default async function Home() {
  const [tournaments, site] = await Promise.all([listTournaments(), getSiteInfo()]);
  // feature what's in progress, otherwise what's coming up, otherwise the most recent
  const pick = [...tournaments].sort((a, b) => statusOf(a).rank - statusOf(b).rank || b.year - a.year)[0];
  const featured = pick ? await getPublicBundle(pick.slug) : null;
  const years = [...new Set(tournaments.map((t) => t.year))];

  return (
    <>
      <HomeHero next={nextSession(site.sessions)} site={site} featured={pick ?? null} />

      <main className="wrap grid gap-14 py-10 pb-16">
        {featured && <FeaturedTournament b={featured} />}

        <section className="grid gap-4">
          <div>
            <div className="atitle">Archive</div>
            <h2 className="display mt-1 text-[clamp(32px,5vw,48px)]">All tournaments</h2>
          </div>
          {tournaments.length === 0 && <div className="card empty">No tournaments yet. Check back soon.</div>}
          {years.map((y) => (
            <div key={y} className="grid gap-3">
              <h3 className="font-num text-base font-bold tracking-widest text-[var(--muted)]">{y}</h3>
              <div className="grid-cards">
                {tournaments.filter((t) => t.year === y).map((t) => {
                  const s = statusOf(t);
                  return (
                    <Link key={t._id} href={`/${t.slug}`} className="card grid gap-3 transition-colors hover:border-[var(--muted)]">
                      <div className="flex items-start justify-between gap-3">
                        <b className="text-lg leading-tight">{t.name}</b>
                        <span className={`place ${s.cls}`}>{s.label}</span>
                      </div>
                      <div className="text-sm">{dateRange(t)} · {t.teamCount} teams</div>
                      <div className="grid gap-1">
                        <div className="progress"><span style={{ width: `${t.matchCount ? (t.playedCount / t.matchCount) * 100 : 0}%` }} /></div>
                        <div className="hint tnum">{t.playedCount} of {t.matchCount} matches played</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <PitchInfo info={site} />
      </main>

      <footer className="foot">
        <div className="wrap flex flex-wrap items-center justify-between gap-2 py-6 text-sm text-[var(--muted)]">
          <span className="display text-xl text-[var(--ink)]">Pillars Turf</span>
          <span>The referee&apos;s decision is final.</span>
        </div>
      </footer>
    </>
  );
}
