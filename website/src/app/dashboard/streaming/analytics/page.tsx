"use client";

import { useState } from "react";
import BackButton from "../../marketplace/[id]/back-button";

type Point = { minute: number; viewers: number };

// TODO: replace with real per-interval viewer counts from your backend.
const RETENTION: Point[] = [
  { minute: 0, viewers: 2400 },
  { minute: 15, viewers: 3500 },
  { minute: 30, viewers: 5400 },
  { minute: 45, viewers: 6500 },
  { minute: 60, viewers: 8200 },
  { minute: 75, viewers: 10500 },
  { minute: 90, viewers: 9250 },
  { minute: 105, viewers: 11430 },
  { minute: 120, viewers: 9740 },
  { minute: 135, viewers: 11940 },
  { minute: 150, viewers: 13720 },
  { minute: 165, viewers: 14820 },
];

const SUPPORTERS = [
  { rank: 1, name: "GamerWhale", gvt: 500 },
  { rank: 2, name: "0x3f...921", gvt: 350 },
  { rank: 3, name: "SnakeFanatic", gvt: 150 },
];

const DURATION_MINUTES = 165;
const ESTIMATED_REVENUE_USD = 125;
const AXIS_MAX = 15000;
const TICKS = [0, 5000, 10000, 15000];

const fmt = (n: number) => n.toLocaleString("en-US");
const compact = (n: number) => (n === 0 ? "0" : n >= 1000 ? `${n / 1000}K` : String(n));
const duration = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}h ${String(m % 60).padStart(2, "0")}m`;

const PEAK = Math.max(...RETENTION.map((p) => p.viewers));
const AVG = Math.round(RETENTION.reduce((s, p) => s + p.viewers, 0) / RETENTION.length);
const TOTAL_TIPS = SUPPORTERS.reduce((s, x) => s + x.gvt, 0);

const STATS = [
  { label: "Stream duration", value: duration(DURATION_MINUTES) },
  { label: "Peak viewers", value: fmt(PEAK) },
  { label: "Avg. viewers", value: fmt(AVG) },
  { label: "Total GVT tips", value: `${fmt(TOTAL_TIPS)} GVT` },
];

export default function StreamAnalyticsPage() {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [active, setActive] = useState<number | null>(null);

  return (
    <main className="min-h-screen text-white">
        <div className="flex pt-5">
            <BackButton />
        </div>
      <div className="mx-auto -ml-8 -mr-8 grid max-w-400 gap-5 px-6 py-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          {/* Summary */}
          <section
            aria-label="Stream summary"
            className="rounded-xl border border-[#2A1060] bg-[#060A14CC] px-6 py-5"
          >
            <dl className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="text-[11px] inter-light text-[#908FA0]">{s.label}</dt>
                  <dd className="mt-0.5 space-mono-bold text-xl tabular-nums text-[#20CEEE] sm:text-[26px]">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Retention chart */}
          <section
            aria-labelledby="retention-title"
            className="rounded-xl border border-[#2A1060] bg-[#060A14CC] p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="retention-title" className="text-[16px] inter-extrabold">
                  <span aria-hidden="true">📈 </span>Viewer Retention &amp; Peak Growth
                </h2>
                <p className="mt-1 text-[11px] space-mono-regular text-[#8d9ab3]">Viewers at 15-minute intervals</p>
              </div>
              <div role="group" aria-label="Chart view" className="flex space-mono-regular rounded-md border border-[#241b52] p-0.5 text-[11px] font-bold">
                {(["chart", "table"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={view === v}
                    onClick={() => setView(v)}
                    className={`rounded px-3 py-1 capitalize transition focus-visible:outline focus-visible:outline-[#22d3ee] ${
                      view === v ? "bg-[#1b1647] text-white" : "text-[#8d9ab3] hover:text-white"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {view === "chart" ? (
              <div className="mt-6 flex gap-3">
                {/* Y axis */}
                <div className="relative h-50 w-8 shrink-0 text-right text-[10px] tabular-nums text-[#6b7894]" aria-hidden="true">
                  {TICKS.map((t) => (
                    <span
                      key={t}
                      className="absolute right-0 -translate-y-1/2"
                      style={{ bottom: `${(t / AXIS_MAX) * 100}%` }}
                    >
                      {compact(t)}
                    </span>
                  ))}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="relative h-50">
                    {/* Gridlines */}
                    {TICKS.map((t) => (
                      <i
                        key={t}
                        aria-hidden="true"
                        className="absolute inset-x-0 h-px bg-white/6"
                        style={{ bottom: `${(t / AXIS_MAX) * 100}%` }}
                      />
                    ))}

                    <ul className="absolute inset-0 flex items-end gap-1.5 sm:gap-3" onPointerLeave={() => setActive(null)}>
                      {RETENTION.map((p, i) => {
                        const h = (p.viewers / AXIS_MAX) * 100;
                        const isPeak = p.viewers === PEAK;
                        const edge = i === 0 ? "left-0" : i >= RETENTION.length - 2 ? "right-0" : "left-1/2 -translate-x-1/2";
                        return (
                          <li key={p.minute} className="relative flex h-full flex-1 items-end justify-center">
                            <button
                              type="button"
                              aria-label={`${p.minute} minutes: ${fmt(p.viewers)} viewers`}
                              onPointerEnter={() => setActive(i)}
                              onFocus={() => setActive(i)}
                              onBlur={() => setActive(null)}
                              className="group relative flex h-full w-full items-end justify-center outline-none"
                            >
                              {isPeak && (
                                <span
                                  className="absolute -translate-y-full pb-1 text-[10px] font-bold tabular-nums text-white"
                                  style={{ bottom: `${h}%` }}
                                >
                                  {fmt(p.viewers)}
                                </span>
                              )}
                              <span
                                className={`block w-full max-w-11.5 rounded-t-sm bg-linear-to-t from-[#7c3aed] to-[#22d3ee] transition group-focus-visible:ring-2 group-focus-visible:ring-white ${
                                  active === i ? "brightness-125" : ""
                                }`}
                                style={{ height: `${h}%` }}
                              />
                            </button>

                            {active === i && (
                              <div
                                role="tooltip"
                                className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-white/10 bg-[#050810] px-3 py-2 shadow-lg ${edge}`}
                                style={{ bottom: `calc(${h}% + ${isPeak ? 30 : 10}px)` }}
                              >
                                <p className="text-[13px] font-black tabular-nums text-white">{fmt(p.viewers)} viewers</p>
                                <p className="text-[10px] text-[#8d9ab3]">at {p.minute} min</p>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* X axis */}
                  <ul className="mt-2 flex gap-1.5 sm:gap-3" aria-hidden="true">
                    {RETENTION.map((p) => (
                      <li key={p.minute} className="flex-1 text-center text-[9px] text-[#6b7894]">
                        {p.minute}m
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-right text-[10px] text-[#6b7894]">Time into stream (minutes)</p>
                </div>
              </div>
            ) : (
              <table className="mt-5 w-full text-left text-[12px]">
                <caption className="sr-only">Viewers at each 15-minute interval</caption>
                <thead className="text-[10px] uppercase tracking-wide text-[#8d9ab3]">
                  <tr>
                    <th scope="col" className="pb-2 font-semibold">Minute</th>
                    <th scope="col" className="pb-2 text-right font-semibold">Viewers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  {RETENTION.map((p) => (
                    <tr key={p.minute}>
                      <th scope="row" className="py-2 font-normal text-[#aab5cc]">{p.minute}m</th>
                      <td className="py-2 text-right font-bold tabular-nums">{fmt(p.viewers)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        {/* Supporters */}
        <aside className="h-fit rounded-xl border border-[#2A1060] bg-[#060A14CC] p-5">
          <h2 className="mb-5 text-[14px] inter-extrabold">
            <span aria-hidden="true">💎 </span>Top Supporters
          </h2>
          <ol className="space-y-4">
            {SUPPORTERS.map((s) => (
              <li key={s.rank} className="flex items-center justify-between gap-3 text-[12px]">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="inter-bold text-[#20CEEE]">#{s.rank}</span>
                  <span className="truncate text-white inter-light text-[11px]">{s.name}</span>
                </span>
                <span className="shrink-0 text-[11px] space-mono-bold tabular-nums text-[#34D399]">
                  {s.gvt} GVT
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#241b52] pt-4 text-[11px]">
            <span className="text-[#aab5cc]">Total Estimated Revenue</span>
            <span className="font-mono text-[13px] font-bold tabular-nums">
              ${ESTIMATED_REVENUE_USD.toFixed(2)} USD
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}