"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { api, uploadMedia } from "@/lib/client";
import type { Bundle } from "@/lib/data";
import type { TeamT } from "@/lib/league";
import { Crest } from "../Crest";
import { Media } from "../Media";
import { ConfirmButton } from "./ConfirmButton";
import { useMe, useRun } from "./hooks";

export function TeamsTab({ bundle }: { bundle: Bundle }) {
  const t = bundle.tournament;
  const run = useRun(t._id);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#1f5fa8");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await run(() => api(`/api/admin/tournaments/${t._id}/teams`, { body: { name, color } }), `${name} added.`)) setName("");
  };

  return (
    <>
      <div className="grid-cards">
        {bundle.teams.map((team) => (
          <TeamEditor key={team._id + JSON.stringify(team.photo) + team.squad.length} team={team} bundle={bundle} />
        ))}
      </div>
      {bundle.teams.length === 0 && <div className="card empty">No teams yet. Add the first one below.</div>}
      <form className="card flex flex-wrap items-end gap-2" onSubmit={add}>
        <label className="label flex-1 basis-52">New team<input id="new-team" className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name" /></label>
        <input id="new-team-color" type="color" className="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Team colour" />
        <button className="btn primary">Add team</button>
      </form>
    </>
  );
}

function TeamEditor({ team, bundle }: { team: TeamT; bundle: Bundle }) {
  const run = useRun(bundle.tournament._id);
  const { data: me } = useMe();
  const [name, setName] = useState(team.name);
  const [color, setColor] = useState(team.color);
  const [squad, setSquad] = useState(team.squad.join("\n"));
  const [busy, setBusy] = useState(false);
  const patch = (body: unknown, msg: string) => run(() => api(`/api/admin/teams/${team._id}`, { method: "PATCH", body }), msg);
  const hasFixtures = bundle.matches.some((m) => m.home === team._id || m.away === team._id);

  async function onPhoto(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      if (!file.type.startsWith("image/")) throw new Error("Team photos must be an image file.");
      const media = await uploadMedia(file, `${bundle.tournament.slug}/teams`);
      await patch({ photo: media }, "Team photo updated.");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <article className="board flex flex-col">
      <div className="photo">
        {team.photo ? <Media media={team.photo} alt={`${team.name} team photo`} /> : <Crest team={{ name, color }} size="lg" />}
      </div>
      <div className="grid gap-2.5 p-3.5">
        <div className="flex gap-2">
          <input id={`tn-${team._id}`} className="input flex-1" value={name} onChange={(e) => setName(e.target.value)} aria-label="Team name" />
          <input id={`tc-${team._id}`} type="color" className="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Team colour" />
        </div>
        <label className="label">Squad, one player per line
          <textarea id={`sq-${team._id}`} className="textarea" rows={4} value={squad} onChange={(e) => setSquad(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="btn primary sm" onClick={() => patch({ name, color, squad: squad.split("\n").map((s) => s.trim()).filter(Boolean) }, "Team saved.")}>Save</button>
          {me?.uploadsEnabled ? (
            <label className={`btn sm ${busy ? "opacity-60" : ""}`}>
              <Camera size={14} /> {busy ? "Uploading…" : team.photo ? "Change photo" : "Upload photo"}
              <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => onPhoto(e.target.files?.[0])} />
            </label>
          ) : <span className="hint self-center">Photo uploads need Cloudinary keys</span>}
          {team.photo && <ConfirmButton className="btn danger sm" onConfirm={() => patch({ photo: null }, "Photo removed.")}>Remove photo</ConfirmButton>}
          <ConfirmButton className="btn danger sm" disabled={hasFixtures} onConfirm={() => run(() => api(`/api/admin/teams/${team._id}`, { method: "DELETE" }), "Team removed.")}>
            Remove team
          </ConfirmButton>
        </div>
        {hasFixtures && <p className="hint">This team has fixtures, so it can&apos;t be removed.</p>}
      </div>
    </article>
  );
}
