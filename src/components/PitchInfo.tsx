import type { SiteInfo } from "@/lib/site";
import { CopyButton } from "./CopyButton";

/** Weekly sessions, pitch rules, prices and payment details for the home page. */
export function PitchInfo({ info }: { info: SiteInfo }) {
  const pay = info.payment;
  return (
    <section id="rules" className="grid scroll-mt-6 gap-5">
      <div>
        <div className="atitle">Play at Pillars Turf</div>
        <h2 className="display mt-1 text-[clamp(32px,5vw,48px)]">Sessions &amp; pitch rules</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {info.sessions.map((s) => (
          <div key={s.day} className="ticket">
            <div className="stub"><span>Every</span><b>{s.day.slice(0, 3)}</b></div>
            <div className="grid content-center gap-1 p-4">
              <div className="font-num text-lg font-bold uppercase tracking-wider">{s.day}</div>
              <div className="tnum text-[17px]">{s.time}</div>
              {s.deadline && <div><span className="place top">Deadline {s.deadline}</span></div>}
            </div>
          </div>
        ))}
      </div>
      {info.lateRule && <div className="notice">{info.lateRule}</div>}

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <ol className="grid gap-3 sm:grid-cols-2">
          {info.rules.map((r, i) => (
            <li key={i} className="card flex gap-3 !p-4">
              <span className="rule-num tnum">{i + 1}</span>
              <span className="leading-6">{r}</span>
            </li>
          ))}
        </ol>

        <aside className="grid content-start gap-4">
          <div className="board">
            <div className="band px-4 py-5">
              <div className="relative z-[1]">
                <div className="eyebrow">Price per player</div>
                <div className="display mt-1 text-5xl">{info.pricePerPlayer}</div>
              </div>
            </div>
            <div className="grid gap-3 p-4">
              {info.subscription && <p className="text-sm"><b>Monthly subscription:</b> {info.subscription}</p>}
              {pay.accountNumber && (
                <div className="grid gap-1 rounded-lg bg-[var(--surface-2)] p-3">
                  <span className="hint">Pay to</span>
                  <span className="tnum select-all break-all font-num text-[28px] font-bold leading-tight tracking-wider">{pay.accountNumber}</span>
                  <span className="text-sm">{[pay.bank, pay.accountName].filter(Boolean).join(" · ")}</span>
                  <div className="mt-1"><CopyButton text={pay.accountNumber} label="Copy account number" /></div>
                </div>
              )}
            </div>
          </div>
          {info.closing && <p className="hint text-center">{info.closing}</p>}
        </aside>
      </div>
    </section>
  );
}
