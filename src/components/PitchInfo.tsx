import type { SiteInfo } from "@/lib/site";
import { CopyButton } from "./CopyButton";

/** Weekly sessions, pitch rules, prices and payment details for the home page. */
export function PitchInfo({ info }: { info: SiteInfo }) {
  const pay = info.payment;
  return (
    <section id="rules" className="grid gap-4">
      <h2 className="h2">Play at Pillars Turf <small>Weekly sessions and pitch rules</small></h2>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card grid content-start gap-3">
          <div className="atitle">Pitch rules</div>
          <ol className="grid gap-2.5">
            {info.rules.map((r, i) => (
              <li key={i} className="flex gap-3">
                <span className="tnum w-6 flex-none text-right font-num text-lg font-bold leading-6 text-[var(--gold)]">{i + 1}</span>
                <span className="leading-6">{r}</span>
              </li>
            ))}
          </ol>
          {info.closing && <p className="hint mt-1">{info.closing}</p>}
        </div>

        <div className="grid content-start gap-4">
          <div className="board">
            {info.sessions.map((s) => (
              <div key={s.day} className="flex items-center justify-between gap-3 border-t border-[var(--line)] p-3.5 first:border-t-0">
                <div>
                  <div className="font-num text-lg font-bold uppercase tracking-wider">{s.day}</div>
                  <div className="tnum">{s.time}</div>
                </div>
                {s.deadline && <span className="place top">Deadline {s.deadline}</span>}
              </div>
            ))}
            {info.lateRule && <div className="border-t border-[var(--line)] bg-[var(--surface-2)] p-3.5 text-sm">{info.lateRule}</div>}
          </div>

          <div className="card grid gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="atitle">Price per player</span>
              <span className="display text-3xl">{info.pricePerPlayer}</span>
            </div>
            {info.subscription && <p className="text-sm"><b>Monthly subscription:</b> {info.subscription}</p>}
            {pay.accountNumber && (
              <div className="grid gap-1 rounded-lg bg-[var(--surface-2)] p-3">
                <span className="hint">Pay to</span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="tnum select-all font-num text-2xl font-bold tracking-wider">{pay.accountNumber}</span>
                  <CopyButton text={pay.accountNumber} label="Copy number" />
                </div>
                <span className="text-sm">{[pay.bank, pay.accountName].filter(Boolean).join(" · ")}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
