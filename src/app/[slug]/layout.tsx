import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { TournamentTabs } from "@/components/TournamentTabs";
import { getPublicBundle } from "@/lib/data";
import { byOrder, status } from "@/lib/league";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const b = await getPublicBundle((await params).slug);
  return { title: b ? `${b.tournament.name} ${b.tournament.name.includes(String(b.tournament.year)) ? "" : b.tournament.year}`.trim() : "Not found" };
}

export default async function TournamentLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = await getPublicBundle(slug);
  if (!b) notFound();
  const { tournament: t, teams, matches } = b;
  const next = matches.filter((m) => !m.played).sort(byOrder)[0];
  const st = status(matches);

  return (
    <>
      <header className="band">
        <div className="wrap flex flex-wrap items-end justify-between gap-4 pb-7 pt-6">
          <div>
            <Link href="/" className="eyebrow hover:underline">{t.venue} · {t.year}</Link>
            <h1 className="display mb-2 mt-1.5 text-[clamp(44px,9vw,84px)]">{t.name}</h1>
            <p className="opacity-85">{t.tagline || "League table, fixtures and results"}</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <span className="chip">{teams.length} teams</span>
            {matches.length > 0 && (
              <span className="chip">
                {st === "Completed" ? "Tournament complete" : next ? `Next: Matchday ${next.round}${next.date ? " · " + fmtDate(next.date) : ""}` : st}
              </span>
            )}
          </div>
        </div>
      </header>
      <div className="wrap">
        <TournamentTabs slug={slug} />
        <main className="grid gap-6 py-5 pb-16">{children}</main>
      </div>
      {st !== "Completed" && <AutoRefresh seconds={30} />}
    </>
  );
}
