"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/client";
import type { SiteInfo } from "@/lib/site";

export default function PitchInfoAdmin() {
  const qc = useQueryClient();
  const { data, isPending } = useQuery({ queryKey: ["site"], queryFn: () => api<SiteInfo>("/api/admin/site") });
  const [f, setF] = useState<SiteInfo | null>(null);
  const [rules, setRules] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data && !f) { setF(data); setRules(data.rules.join("\n")); }
  }, [data, f]);

  if (isPending || !f) return <div className="card empty">Loading…</div>;
  const set = (patch: Partial<SiteInfo>) => setF({ ...f, ...patch });
  const setSession = (i: number, patch: Partial<SiteInfo["sessions"][number]>) =>
    set({ sessions: f.sessions.map((s, k) => (k === i ? { ...s, ...patch } : s)) });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...f!, rules: rules.split("\n").map((r) => r.trim()).filter(Boolean) };
      const saved = await api<SiteInfo>("/api/admin/site", { method: "PUT", body });
      qc.setQueryData(["site"], saved);
      toast.success("Pitch info saved. The home page is updated.");
    } catch (err) { toast.error((err as Error).message); }
    setBusy(false);
  }

  return (
    <form className="grid gap-6" onSubmit={save}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h2 !mb-0">Pitch info</h1>
          <p className="hint">Shown on the home page under “Play at Pillars Turf”.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/#rules" target="_blank" className="btn">View on home page</Link>
          <button className="btn primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
        </div>
      </div>

      <section className="card grid gap-3">
        <h2 className="h2 !mb-0">Weekly sessions</h2>
        {f.sessions.map((s, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <label className="label basis-32">Day<input className="input" required value={s.day} onChange={(e) => setSession(i, { day: e.target.value })} /></label>
            <label className="label flex-1 basis-40">Time<input className="input" value={s.time} onChange={(e) => setSession(i, { time: e.target.value })} placeholder="7:00pm – 10:00pm" /></label>
            <label className="label basis-28">Deadline<input className="input" value={s.deadline} onChange={(e) => setSession(i, { deadline: e.target.value })} placeholder="7:10pm" /></label>
            <button type="button" className="btn danger" aria-label={`Remove ${s.day}`} onClick={() => set({ sessions: f.sessions.filter((_, k) => k !== i) })}><Trash2 size={15} /></button>
          </div>
        ))}
        <div><button type="button" className="btn sm" onClick={() => set({ sessions: [...f.sessions, { day: "", time: "", deadline: "" }] })}><Plus size={14} /> Add session</button></div>
        <label className="label">Late arrivals<textarea className="textarea" rows={2} value={f.lateRule} onChange={(e) => set({ lateRule: e.target.value })} /></label>
      </section>

      <section className="card grid gap-3">
        <h2 className="h2 !mb-0">Pitch rules</h2>
        <label className="label">One rule per line. They&apos;re numbered in this order.
          <textarea className="textarea" rows={12} value={rules} onChange={(e) => setRules(e.target.value)} />
        </label>
        <label className="label">Closing note<input className="input" value={f.closing} onChange={(e) => set({ closing: e.target.value })} /></label>
      </section>

      <section className="card grid gap-3">
        <h2 className="h2 !mb-0">Prices and payment</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="label">Price per player<input className="input" value={f.pricePerPlayer} onChange={(e) => set({ pricePerPlayer: e.target.value })} placeholder="₦2,000" /></label>
          <label className="label">Monthly subscription<input className="input" value={f.subscription} onChange={(e) => set({ subscription: e.target.value })} /></label>
          <label className="label">Account number<input className="input" inputMode="numeric" value={f.payment.accountNumber} onChange={(e) => set({ payment: { ...f.payment, accountNumber: e.target.value } })} /></label>
          <label className="label">Bank<input className="input" value={f.payment.bank} onChange={(e) => set({ payment: { ...f.payment, bank: e.target.value } })} /></label>
          <label className="label sm:col-span-2">Account name<input className="input" value={f.payment.accountName} onChange={(e) => set({ payment: { ...f.payment, accountName: e.target.value } })} /></label>
        </div>
        <p className="hint">Leave the account number blank to hide payment details from the home page.</p>
      </section>

      <div><button className="btn primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div>
    </form>
  );
}
