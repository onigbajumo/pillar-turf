export function initials(name: string) {
  const w = (name || "?").trim().split(/\s+/);
  return (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 3)).toUpperCase();
}

export function textOn(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#fff";
  const n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#111" : "#fff";
}

export function fmtDate(d: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || "");
  if (!m) return "";
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString("en-GB", opts);
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "") || "tournament";
}
