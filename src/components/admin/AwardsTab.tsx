"use client";
import { useState } from "react";
import { toast } from "sonner";
import { api, uploadMedia } from "@/lib/client";
import type { Bundle } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { TOURNAMENT_SLOTS, autoWinner, matchdaySlots, roundDate, rounds, scorers, standings, type AwardT, type Slot } from "@/lib/league";
import { AwardCard } from "../AwardCard";
import { ConfirmButton } from "./ConfirmButton";
import { useMe, useRun } from "./hooks";

export function AwardsTab({ bundle }: { bundle: Bundle }) {
  const { teams, matches, awards, tournament: t } = bundle;
  const run = useRun(t._id);
  const [editing, setEditing] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const teamMap = new Map(teams.map((x) => [x._id, x]));
  const byKey = new Map(awards.map((a) => [a.key, a]));
  const table = standings(teams, matches, t.points);
  const goals = scorers(matches);
  const custom = awards.filter((a) => a.scope === "custom");

  const card = (slot: Slot, auto: ReturnType<typeof autoWinner> = null) => {
    const award = byKey.get(slot.key);
    if (editing === slot.key) return <AwardForm key={slot.key} slot={slot} award={award} bundle={bundle} onDone={() => setEditing(null)} />;
    return (
      <AwardCard key={slot.key} slot={slot} award={award} auto={auto} teams={teamMap}>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <button className="btn sm" onClick={() => setEditing(slot.key)}>{award ? "Edit" : "Announce winner"}</button>
          {award && (
            <ConfirmButton className="btn danger sm" onConfirm={() => run(() => api(`/api/admin/awards/${award._id}`, { method: "DELETE" }), slot.scope === "custom" ? "Award deleted." : "Award cleared.")}>
              {slot.scope === "custom" ? "Delete" : "Clear"}
            </ConfirmButton>
          )}
        </div>
      </AwardCard>
    );
  };

  async function addCustom(e: React.FormEvent) {
    e.preventDefault();
    const key = "custom-" + Date.now().toString(36);
    const ok = await run(() => api(`/api/admin/tournaments/${t._id}/awards`, { method: "PUT", body: { key, title: newTitle, scope: "custom" } }), `${newTitle} added.`);
    if (ok) { setNewTitle(""); setEditing(key); }
  }

  return (
    <>
      <section>
        <h2 className="h2">Tournament awards <small>Champions and Golden Boot follow the table until you announce a winner</small></h2>
        <div className="grid-cards">{TOURNAMENT_SLOTS.map((s) => card(s, autoWinner(s.key, table, goals, matches)))}</div>
      </section>
      {rounds(matches).map((r) => (
        <section key={r}>
          <h2 className="h2">Matchday {r} {roundDate(matches, r) && <small>{fmtDate(roundDate(matches, r))}</small>}</h2>
          <div className="grid-cards">{matchdaySlots(r).map((s) => card(s))}</div>
        </section>
      ))}
      <section>
        <h2 className="h2">Special awards</h2>
        {custom.length > 0 && <div className="grid-cards mb-4">{custom.map((a) => card({ key: a.key, title: a.title, scope: "custom", video: true }))}</div>}
        <form className="card flex flex-wrap items-end gap-2" onSubmit={addCustom}>
          <label className="label flex-1 basis-60">New award<input id="new-award" className="input" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Best Defender, Best Celebration" /></label>
          <button className="btn primary">Add award</button>
        </form>
      </section>
    </>
  );
}

function AwardForm({ slot, award, bundle, onDone }: { slot: Slot; award?: AwardT; bundle: Bundle; onDone: () => void }) {
  const run = useRun(bundle.tournament._id);
  const { data: me } = useMe();
  const [f, setF] = useState({ title: award?.title ?? slot.title, winner: award?.winner ?? "", team: award?.team ?? "", note: award?.note ?? "" });
  const [media, setMedia] = useState(award?.media ?? null);
  const [busy, setBusy] = useState(false);

  async function onFile(file?: File) {
    if (!file) return;
    if (!slot.video && !file.type.startsWith("image/")) return toast.error("This award takes a photo.");
    setBusy(true);
    try { setMedia(await uploadMedia(file, `${bundle.tournament.slug}/awards`)); toast.success("Uploaded. Press Save to keep it."); }
    catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await run(() => api(`/api/admin/tournaments/${bundle.tournament._id}/awards`, {
      method: "PUT",
      body: { key: slot.key, scope: slot.scope, round: slot.round ?? null, title: f.title, winner: slot.teamOnly ? "" : f.winner, team: f.team || null, note: f.note, media },
    }), "Award saved.");
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <form className="board award grid content-start gap-2.5 p-3.5" onSubmit={save}>
      <div className="atitle">{f.title}</div>
      {slot.scope === "custom" && <label className="label">Award name<input className="input" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>}
      {!slot.teamOnly && <label className="label">Winner<input className="input" value={f.winner} onChange={(e) => setF({ ...f, winner: e.target.value })} placeholder="Player name" /></label>}
      <label className="label">{slot.teamOnly ? "Winning team" : "Team"}
        <select className="select" value={f.team} onChange={(e) => setF({ ...f, team: e.target.value })}>
          <option value="">{slot.teamOnly ? "Not announced" : "No team"}</option>
          {bundle.teams.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </label>
      <label className="label">Note<input className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder={slot.video ? "e.g. Volley from outside the box, Match 7" : "e.g. 6 goals and 3 assists"} /></label>
      {me?.uploadsEnabled ? (
        <label className="label">{slot.video ? "Photo or video" : "Photo"}
          <input type="file" accept={slot.video ? "image/*,video/mp4,video/webm,video/quicktime" : "image/*"} disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
      ) : <p className="hint">Photo uploads need Cloudinary keys on the server.</p>}
      {media && (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span>{media.type === "video" ? "Video attached" : "Photo attached"}</span>
          <button type="button" className="btn danger sm" onClick={() => setMedia(null)}>Remove</button>
        </div>
      )}
      <div className="flex gap-2">
        <button className="btn primary" disabled={busy}>{busy ? "Working…" : "Save"}</button>
        <button type="button" className="btn" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}
