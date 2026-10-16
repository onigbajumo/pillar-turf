import { initials, textOn } from "@/lib/format";

export function Crest({ team, size }: { team?: { name: string; color: string } | null; size?: "sm" | "lg" }) {
  const cls = `crest${size ? " " + size : ""}`;
  if (!team) return <span className={cls} style={{ background: "var(--line)" }} aria-hidden="true" />;
  return (
    <span className={cls} style={{ background: team.color, color: textOn(team.color) }} aria-hidden="true">
      {initials(team.name)}
    </span>
  );
}
