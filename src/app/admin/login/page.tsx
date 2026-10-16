"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/client";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api("/api/auth/login", { body: { email, password } });
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card grid w-full max-w-sm gap-4">
      <div>
        <div className="eyebrow" style={{ color: "var(--gold)" }}>Pillars Turf</div>
        <h1 className="display mt-1 text-4xl">Organiser login</h1>
      </div>
      <label className="label">Email
        <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="label">Password
        <input id="password" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p className="text-sm font-semibold text-[var(--loss)]" role="alert">{error}</p>}
      <button className="btn primary" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      <p className="hint">Only tournament organisers need an account. <Link href="/" className="underline">See the tournaments</Link></p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="band grid min-h-screen place-items-center px-4">
      <div className="relative z-[1] flex w-full justify-center">
        <Suspense><LoginForm /></Suspense>
      </div>
    </main>
  );
}
