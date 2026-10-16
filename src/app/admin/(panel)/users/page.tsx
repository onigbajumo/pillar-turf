"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { useMe } from "@/components/admin/hooks";

type U = { _id: string; name: string; email: string; role: "owner" | "admin"; lastLoginAt?: string };

export default function AdminsPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { data, isPending } = useQuery({ queryKey: ["admins"], queryFn: () => api<U[]>("/api/admin/users") });
  const [f, setF] = useState({ name: "", email: "", password: "", role: "admin" as U["role"] });
  const [reset, setReset] = useState<{ id: string; pw: string } | null>(null);
  const isOwner = me?.role === "owner";

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast.success(msg); qc.invalidateQueries({ queryKey: ["admins"] }); return true; }
    catch (e) { toast.error((e as Error).message); return false; }
  };

  return (
    <>
      <h1 className="h2 !mb-0">Admins</h1>
      <p className="hint -mt-3">Admins can manage every tournament. Owners can also add and remove admins.</p>

      <div className="board">
        {isPending && <div className="empty">Loading…</div>}
        {data?.map((u) => (
          <div key={u._id} className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] p-3.5 first:border-t-0">
            <div className="min-w-0">
              <div className="font-semibold">{u.name} {u._id === me?.id && <span className="hint">(you)</span>}</div>
              <div className="hint break-all">{u.email} · {u.lastLoginAt ? `last login ${new Date(u.lastLoginAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : "never logged in"}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`place ${u.role === "owner" ? "top" : ""}`}>{u.role === "owner" ? "Owner" : "Admin"}</span>
              {isOwner && u._id !== me?.id && (
                <>
                  <button className="btn sm" onClick={() => act(() => api(`/api/admin/users/${u._id}`, { method: "PATCH", body: { role: u.role === "owner" ? "admin" : "owner" } }), "Role updated.")}>
                    Make {u.role === "owner" ? "admin" : "owner"}
                  </button>
                  <button className="btn sm" onClick={() => setReset(reset?.id === u._id ? null : { id: u._id, pw: "" })}>Reset password</button>
                  <ConfirmButton className="btn danger sm" onConfirm={() => act(() => api(`/api/admin/users/${u._id}`, { method: "DELETE" }), `${u.name} removed.`)}>Remove</ConfirmButton>
                </>
              )}
            </div>
            {reset?.id === u._id && (
              <form className="flex w-full flex-wrap gap-2" onSubmit={async (e) => {
                e.preventDefault();
                if (await act(() => api(`/api/admin/users/${u._id}`, { method: "PATCH", body: { password: reset.pw } }), `Password reset. Share it with ${u.name} privately.`)) setReset(null);
              }}>
                <input className="input flex-1" type="text" autoComplete="new-password" minLength={8} required placeholder="New temporary password (8+ characters)" value={reset.pw} onChange={(e) => setReset({ ...reset, pw: e.target.value })} />
                <button className="btn primary sm">Set password</button>
              </form>
            )}
          </div>
        ))}
      </div>

      {isOwner ? (
        <form className="card grid gap-3" onSubmit={async (e) => {
          e.preventDefault();
          if (await act(() => api("/api/admin/users", { body: f }), `${f.name} can now log in.`)) setF({ name: "", email: "", password: "", role: "admin" });
        }}>
          <h2 className="h2 !mb-0">Add an admin</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="label">Name<input id="u-name" className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label className="label">Email<input id="u-email" className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
            <label className="label">Temporary password<input id="u-pw" className="input" type="text" autoComplete="new-password" minLength={8} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
            <label className="label">Role
              <select id="u-role" className="select" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as U["role"] })}>
                <option value="admin">Admin (manages tournaments)</option>
                <option value="owner">Owner (also manages admins)</option>
              </select>
            </label>
          </div>
          <p className="hint">Share the password with them privately. They can change it under My account after logging in.</p>
          <div><button className="btn primary">Add admin</button></div>
        </form>
      ) : <p className="hint">Ask an owner if you need another admin added.</p>}
    </>
  );
}
