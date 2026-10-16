"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function TournamentTabs({ slug }: { slug: string }) {
  const path = usePathname();
  const base = `/${slug}`;
  const tabs = [
    { href: base, label: "Table" },
    { href: `${base}/fixtures`, label: "Fixtures & results" },
    { href: `${base}/teams`, label: "Teams" },
    { href: `${base}/awards`, label: "Awards" },
  ];
  return (
    <nav className="tabs mt-4" aria-label="Tournament sections">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className="tab" aria-current={path === t.href ? "page" : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
