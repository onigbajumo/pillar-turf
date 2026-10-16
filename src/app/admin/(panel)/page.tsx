"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, RefreshCw } from "lucide-react";
import { api } from "@/lib/client";
import type { TournamentT } from "@/lib/league";
import { ShortLinkField } from "@/components/admin/ShortLinkField";

type Row = TournamentT & { teamCount: number; matchCount: number; playedCount: number };

export default function TournamentsAdmin() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data, isPending, isFetching, refetch, error } = useQuery({ queryKey: ["tournaments"], queryFn: () => api<Row[]>("/api/admin/tournaments") });
  const [form, setForm] = useState({ name: "Pillars Turf Cup", year: new Date().getFullYear(), slug: "", tagline: "", copyTeamsFrom: "" });
  const [open, setOpen] = useState(false);

  const create = useMutation({
    mutationFn: () => api<{ _id: string }>("/api/admin/tournaments", { body: { ...form, copyTeamsFrom: form.copyTeamsFrom || undefined } }),
    onSuccess: (r) => {
      toast.success(`${form.name} ${form.year} created.`);
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      router.push(`/admin/t/${r._id}`);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const years = [...new Set((data ?? []).map((t) => t.year))];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h2 !mb-0">Tournaments</h1>
        <div className="flex gap-2">
          <button className="btn" onClick={() => refetch()} aria-label="Refresh"><RefreshCw size={15} className={isFetching ? "animate-spin" : ""} /></button>
          <button className="btn primary" onClick={() => setOpen((o) => !o)}><Plus size={16} /> New tournament</button>
        </div>
      </div>

      {open && (
        <form className="card grid gap-3" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <h2 className="h2 !mb-0">New tournament</h2>
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
            <label className="label">Name<input id="t-name" className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="label">Year<input id="t-year" className="input" type="number" min={2000} max={2100} required value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></label>
          </div>
          <ShortLinkField required={false} value={form.slug} onChange={(slug) => setForm({ ...form, slug })} placeholder="Leave blank to pick one automatically" />
          <label className="label">Tagline<input id="t-tagline" className="input" placeholder="e.g. 8 teams · Saturdays in October" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></label>
          <label className="label">Start with teams from
            <select id="t-copy" className="select" value={form.copyTeamsFrom} onChange={(e) => setForm({ ...form, copyTeamsFrom: e.target.value })}>
              <option value="">No teams (add them yourself)</option>
              {(data ?? []).map((t) => <option key={t._id} value={t._id}>{t.name} {t.year} ({t.teamCount} teams)</option>)}
            </select>
          </label>
          <p className="hint">Copying brings over team names, colours and squads. Team photos, fixtures and awards start fresh.</p>
          <div className="flex gap-2">
            <button className="btn primary" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create tournament"}</button>
            <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}

      {isPending && <div className="card empty">Loading tournaments…</div>}
      {error && <div className="notice">{(error as Error).message}</div>}
      {data && data.length === 0 && <div className="card empty">No tournaments yet. Create the first one with “New tournament”.</div>}

      {years.map((y) => (
        <section key={y}>
          <h2 className="h2">{y}</h2>
          <div className="grid-cards">
            {data!.filter((t) => t.year === y).map((t) => (
              <article key={t._id} className="card grid gap-2">
                <div className="flex items-start justify-between gap-2">
                  <b className="text-lg">{t.name}</b>
                  <span className={`place ${t.published ? "top" : ""}`}>{t.published ? "Public" : "Hidden"}</span>
                </div>
                <div className="hint">Link: <b>/{t.slug}</b></div>
                <div className="hint tnum">{t.teamCount} teams · {t.playedCount}/{t.matchCount} matches played</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Link href={`/admin/t/${t._id}`} className="btn primary sm">Manage</Link>
                  {t.published && <Link href={`/${t.slug}`} target="_blank" className="btn sm">View public page</Link>}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
