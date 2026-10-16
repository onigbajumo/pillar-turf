"use client";
import { useEffect, useState } from "react";

/** A button that needs a second tap within 4 seconds before it runs. */
export function ConfirmButton({ children, confirmLabel = "Tap again to confirm", onConfirm, className = "btn danger", disabled }: {
  children: React.ReactNode; confirmLabel?: string; onConfirm: () => void; className?: string; disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${className} ${armed ? "armed" : ""}`}
      onClick={() => {
        if (armed) { setArmed(false); onConfirm(); } else setArmed(true);
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
