import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { NextSession, SiteInfo } from "@/lib/site";

/** Chalk markings of a full pitch, drawn behind the hero. */
function PitchLines() {
  return (
    <svg className="hero-lines" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect x="40" y="30" width="1120" height="460" />
      <line x1="600" y1="30" x2="600" y2="490" />
      <circle cx="600" cy="260" r="78" />
      <circle className="spot" cx="600" cy="260" r="4" />
      <rect x="40" y="140" width="150" height="240" />
      <rect x="40" y="205" width="55" height="110" />
      <path d="M190 210 A 70 70 0 0 1 190 310" />
      <circle className="spot" cx="145" cy="260" r="4" />
      <rect x="1010" y="140" width="150" height="240" />
      <rect x="1105" y="205" width="55" height="110" />
      <path d="M1010 210 A 70 70 0 0 0 1010 310" />
      <circle className="spot" cx="1055" cy="260" r="4" />
    </svg>
  );
}

const WHEN: Record<NextSession["when"], string> = { now: "On now", today: "Today", tomorrow: "Tomorrow", later: "" };

export function HomeHero({ next, site, featured }: {
  next: NextSession | null; site: SiteInfo; featured?: { name: string; year: number; slug: string } | null;
}) {
  return (
    <header className="hero">
      <PitchLines />
      <div className="wrap grid items-end gap-8 pb-12 pt-14 lg:grid-cols-[1.35fr_1fr] lg:pb-16 lg:pt-20">
        <div>
          <div className="eyebrow">Football pitch · Weekly games · Tournaments</div>
          <h1 className="display mt-3 text-[clamp(64px,13vw,148px)] leading-[.82]">
            Pillars<br /><span style={{ color: "#e9c76b" }}>Turf</span>
          </h1>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed opacity-90">
            Turn up, pay your tally and play. Follow every tournament here too: live tables, results, top scorers and awards.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {featured && (
              <Link href={`/${featured.slug}`} className="btn-gold">
                {featured.name} {featured.name.includes(String(featured.year)) ? "" : featured.year} <ArrowRight size={17} />
              </Link>
            )}
            <a href="#rules" className="btn-ghost">Sessions &amp; pitch rules</a>
          </div>
        </div>

        {next && (
          <aside className="board-panel" aria-label="Next game">
            <div className="flex items-center justify-between gap-3">
              <span className="lbl">{next.when === "now" ? "Playing now" : "Next game"}</span>
              {next.when === "now" ? <span className="live-dot" aria-hidden="true" /> : WHEN[next.when] && <span className="chip">{WHEN[next.when]}</span>}
            </div>
            <div className="display mt-3 text-[clamp(40px,6vw,56px)] leading-none">{next.session.day}</div>
            <div className="mt-1 text-sm opacity-80">{next.dateLabel}</div>
            <div className="tnum mt-4 font-num text-[28px] font-bold leading-none">{next.session.time}</div>
            <div className="mt-4 grid gap-2 border-t border-white/15 pt-4 text-sm">
              {next.session.deadline && (
                <div className="flex items-center gap-2"><Clock size={15} className="flex-none opacity-80" /><span>Be there by <b>{next.session.deadline}</b>. Late players sit out.</span></div>
              )}
              {site.pricePerPlayer && <div className="flex items-center justify-between"><span className="opacity-80">Per player</span><b className="font-num text-lg">{site.pricePerPlayer}</b></div>}
            </div>
          </aside>
        )}
      </div>
    </header>
  );
}
