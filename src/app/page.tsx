import Link from "next/link";
import { listTournaments } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function statusOf(t: { matchCount: number; playedCount: number }) {
  if (!t.matchCount || !t.playedCount) return { label: "Upcoming", cls: "" };
  if (t.playedCount === t.matchCount) return { label: "Completed", cls: "" };
  return { label: "In progress", cls: "top" };
}

export default async function Home() {
  const tournaments = await listTournaments();
  const years = [...new Set(tournaments.map((t) => t.year))];

  return (
    <>
      <header className="band">
        <div className="wrap py-12">
          <div className="eyebrow">Tournaments</div>
          <h1 className="display mt-2 text-[clamp(52px,11vw,104px)]">Pillars Turf</h1>
          <p className="mt-3 max-w-xl opacity-85">League tables, fixtures, results, team photos and awards from every tournament played at Pillars Turf.</p>
        </div>
      </header>

      <main className="wrap grid gap-8 py-8 pb-16">
        {tournaments.length === 0 && <div className="card empty">No tournaments yet. Check back soon.</div>}
        {years.map((y) => (
          <section key={y}>
            <h2 className="h2">{y}</h2>
            <div className="grid-cards">
              {tournaments.filter((t) => t.year === y).map((t) => {
                const s = statusOf(t);
                const dates = t.firstDate
                  ? t.firstDate === t.lastDate ? fmtDate(t.firstDate, { day: "numeric", month: "long" })
                    : `${fmtDate(t.firstDate, { day: "numeric", month: "short" })} – ${fmtDate(t.lastDate, { day: "numeric", month: "short" })}`
                  : "Dates to be announced";
                return (
                  <Link key={t._id} href={`/${t.slug}`} className="board block transition-colors hover:border-[var(--muted)]">
                    <div className="band px-4 py-5">
                      <div className="relative z-[1] flex items-start justify-between gap-3">
                        <div className="display text-[34px] leading-none">{t.name}</div>
                        <span className={`place ${s.cls}`}>{s.label}</span>
                      </div>
                    </div>
                    <div className="grid gap-1 p-4">
                      <div className="font-semibold">{dates}</div>
                      <div className="hint tnum">{t.teamCount} teams · {t.playedCount}/{t.matchCount} matches played</div>
                      {t.tagline && <div className="hint">{t.tagline}</div>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
