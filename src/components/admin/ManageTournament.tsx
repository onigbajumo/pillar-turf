"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { useBundle } from "./hooks";
import { DetailsTab } from "./DetailsTab";
import { TeamsTab } from "./TeamsTab";
import { FixturesTab } from "./FixturesTab";
import { AwardsTab } from "./AwardsTab";

const TABS = [
  { id: "fixtures", label: "Fixtures & results" },
  { id: "teams", label: "Teams" },
  { id: "awards", label: "Awards" },
  { id: "details", label: "Details" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function ManageTournament({ id }: { id: string }) {
  const { data, isPending, error, isFetching, refetch } = useBundle(id);
  const [tab, setTab] = useState<TabId>("fixtures");

  useEffect(() => {
    const h = window.location.hash.slice(1) as TabId;
    if (TABS.some((t) => t.id === h)) setTab(h);
  }, []);
  const go = (t: TabId) => { setTab(t); history.replaceState(null, "", "#" + t); };

  if (isPending) return <div className="card empty">Loading tournament…</div>;
  if (error || !data) return <div className="notice">{(error as Error)?.message ?? "Tournament not found."} <Link href="/admin" className="underline">Back to tournaments</Link></div>;
  const t = data.tournament;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin" className="hint inline-flex items-center gap-1 hover:underline"><ArrowLeft size={14} /> All tournaments</Link>
          <h1 className="display mt-1 text-[clamp(32px,6vw,52px)]">{t.name} <span style={{ color: "var(--gold)" }}>{t.name.includes(String(t.year)) ? "" : t.year}</span></h1>
          <p className="hint">{t.published ? "Public" : "Hidden from the public site"} · {data.teams.length} teams · {data.matches.filter((m) => m.played).length}/{data.matches.length} played</p>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={() => refetch()} aria-label="Refresh"><RefreshCw size={15} className={isFetching ? "animate-spin" : ""} /></button>
          {t.published && <Link className="btn" href={`/${t.slug}`} target="_blank">View public page <ExternalLink size={14} /></Link>}
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((x) => (
          <button key={x.id} role="tab" aria-selected={tab === x.id} className="tab" onClick={() => go(x.id)}>{x.label}</button>
        ))}
      </div>

      {tab === "fixtures" && <FixturesTab bundle={data} />}
      {tab === "teams" && <TeamsTab bundle={data} />}
      {tab === "awards" && <AwardsTab bundle={data} />}
      {tab === "details" && <DetailsTab bundle={data} />}
    </>
  );
}
