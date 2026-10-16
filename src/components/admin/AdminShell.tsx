"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { api } from "@/lib/client";
import type { CurrentAdmin } from "@/lib/auth";

export function AdminShell({ admin, children }: { admin: CurrentAdmin; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const nav = [
    { href: "/admin", label: "Tournaments", active: path === "/admin" || path.startsWith("/admin/t/") },
    { href: "/admin/pitch", label: "Pitch info", active: path.startsWith("/admin/pitch") },
    { href: "/admin/users", label: "Admins", active: path.startsWith("/admin/users") },
    { href: "/admin/account", label: "My account", active: path.startsWith("/admin/account") },
  ];

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <>
      <header className="band">
        <div className="wrap flex flex-wrap items-center justify-between gap-3 py-4">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="display text-3xl">Pillars Turf</span>
            <span className="eyebrow">Admin</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="opacity-85">{admin.name} · {admin.role === "owner" ? "Owner" : "Admin"}</span>
            <Link href="/" target="_blank" className="chip inline-flex items-center gap-1.5">View site <ExternalLink size={13} /></Link>
            <button onClick={logout} className="chip inline-flex items-center gap-1.5">Log out <LogOut size={13} /></button>
          </div>
        </div>
      </header>
      <div className="wrap">
        <nav className="tabs mt-3" aria-label="Admin sections">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="tab" aria-current={n.active ? "page" : undefined}>{n.label}</Link>
          ))}
        </nav>
        <main className="grid gap-6 py-6 pb-20">{children}</main>
      </div>
    </>
  );
}
