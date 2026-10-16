"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import type { Bundle } from "@/lib/data";
import { useRun } from "./hooks";
import { ShortLinkField } from "./ShortLinkField";

export function DetailsTab({ bundle }: { bundle: Bundle }) {
  const t = bundle.tournament;
  const run = useRun(t._id);
  const router = useRouter();
  const [f, setF] = useState({ name: t.name, year: t.year, slug: t.slug, tagline: t.tagline, venue: t.venue, published: t.published, points: { ...t.points } });
  const [confirm, setConfirm] = useState("");

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => api(`/api/admin/tournaments/${t._id}`, { method: "PATCH", body: f }), "Details saved.");
  };

  async function remove() {
    const ok = await run(() => api(`/api/admin/tournaments/${t._id}`, { method: "DELETE" }), "Tournament deleted.");
    if (ok) router.replace("/admin");
  }

  return (
    <>
      <form className="card grid gap-3" onSubmit={save}>
        <h2 className="h2 !mb-0">Tournament details</h2>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <label className="label">Name<input id="d-name" className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="label">Year<input id="d-year" className="input" type="number" min={2000} max={2100} value={f.year} onChange={(e) => setF({ ...f, year: Number(e.target.value) })} /></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="label">Tagline<input id="d-tagline" className="input" value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></label>
          <label className="label">Venue<input id="d-venue" className="input" value={f.venue} onChange={(e) => setF({ ...f, venue: e.target.value })} /></label>
        </div>
        <fieldset className="grid gap-2">
          <legend className="label mb-1">Points</legend>
          <div className="flex flex-wrap gap-4">
            {(["win", "draw", "loss"] as const).map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm capitalize">{k}
                <input id={`d-pts-${k}`} className="input num" type="number" min={0} max={10} value={f.points[k]} onChange={(e) => setF({ ...f, points: { ...f.points, [k]: Number(e.target.value) } })} />
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm">
          <input id="d-published" type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />
          Show this tournament on the public site
        </label>
        <ShortLinkField value={f.slug} onChange={(slug) => setF({ ...f, slug })} />
        {f.slug !== t.slug && <p className="hint" style={{ color: "var(--loss)" }}>Saving changes the link. Anyone using the old link /{t.slug} will see “page not found”.</p>}
        <div><button className="btn primary">Save details</button></div>
      </form>

      <div className="card grid gap-3" style={{ borderColor: "var(--loss)" }}>
        <h2 className="h2 !mb-0" style={{ color: "var(--loss)" }}>Delete tournament</h2>
        <p className="hint">Deletes the tournament with all its teams, fixtures, results, awards and uploaded photos and videos. This can&apos;t be undone.</p>
        <label className="label">Type <b style={{ color: "var(--ink)" }}>{t.name}</b> to confirm
          <input id="d-confirm" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        <div><button type="button" className="btn danger" disabled={confirm !== t.name} onClick={remove}>Delete permanently</button></div>
      </div>
    </>
  );
}
