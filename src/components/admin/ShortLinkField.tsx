"use client";
import { useEffect, useState } from "react";

/** Input for a tournament's short link, shown after the site's own address (e.g. pillarsturf.com/c26). */
export function ShortLinkField({ value, onChange, placeholder, required = true }: {
  value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  const [host, setHost] = useState("");
  useEffect(() => setHost(window.location.host), []);
  return (
    <label className="label">Short link
      <span className="flex items-stretch overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)] normal-case tracking-normal">
        <span className="flex items-center bg-[var(--surface-2)] px-2.5 text-sm text-[var(--muted)]">{host || "yoursite"}/</span>
        <input
          id="short-link"
          className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-[15px] text-[var(--ink)] outline-none"
          value={value}
          required={required}
          maxLength={12}
          pattern="[a-z0-9]{1,12}"
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
        />
      </span>
      <span className="normal-case tracking-normal">1–12 letters or numbers, for example <b>c26</b>, <b>cup</b> or just <b>c</b>.</span>
    </label>
  );
}
