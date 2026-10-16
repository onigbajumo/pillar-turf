"use client";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { useMe } from "@/components/admin/hooks";

export default function AccountPage() {
  const { data: me } = useMe();
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.next !== f.again) return toast.error("The new passwords don't match.");
    setBusy(true);
    try {
      await api("/api/admin/account/password", { body: { current: f.current, next: f.next } });
      toast.success("Password changed. Other devices have been logged out.");
      setF({ current: "", next: "", again: "" });
    } catch (err) { toast.error((err as Error).message); }
    setBusy(false);
  }

  return (
    <>
      <h1 className="h2 !mb-0">My account</h1>
      {me && <div className="card"><b>{me.name}</b><div className="hint">{me.email} · {me.role === "owner" ? "Owner" : "Admin"}</div></div>}
      <form className="card grid max-w-md gap-3" onSubmit={submit}>
        <h2 className="h2 !mb-0">Change password</h2>
        <label className="label">Current password<input id="pw-current" className="input" type="password" autoComplete="current-password" required value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></label>
        <label className="label">New password<input id="pw-next" className="input" type="password" autoComplete="new-password" minLength={8} required value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></label>
        <label className="label">New password again<input id="pw-again" className="input" type="password" autoComplete="new-password" minLength={8} required value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} /></label>
        <div><button className="btn primary" disabled={busy}>{busy ? "Saving…" : "Change password"}</button></div>
      </form>
    </>
  );
}
