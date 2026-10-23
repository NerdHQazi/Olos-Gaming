"use client";

import { useState } from "react";
import BackButton from "../../marketplace/[id]/back-button";

const CATEGORIES = [
  "Snake Battle X",
  "Quantum Chess Arena",
  "Neon Tetris Blitz",
  "Mili-Militia 2D",
  "Bounce King",
];

const QUALITIES = [
  "1080p @ 60fps (Recommended)",
  "1080p @ 30fps",
  "720p @ 60fps",
  "720p @ 30fps",
];

const REGIONS = [
  "US East (Virginia)",
  "US West (Oregon)",
  "EU West (Frankfurt)",
  "Africa (Lagos)",
  "Asia (Singapore)",
];

const OVERLAYS = [
  { id: "hud", label: "Show Game Stats HUD", defaultOn: true },
  { id: "chat", label: "Show Live Chat Overlay", defaultOn: true },
  { id: "donations", label: "Alert on Donations", defaultOn: true },
  { id: "share", label: "Auto-share to Twitter / Discord", defaultOn: false },
] as const;

type OverlayId = (typeof OVERLAYS)[number]["id"];

// TODO: the stream key should come from your backend, never be hardcoded.
const STREAM_KEY = "live_948194_gvt_73a9f0e1bc03e1e2d93e1f0a";

const fieldLabel = "mb-2 block text-[12px] inter-bold text-[#A4B7EB]";
const fieldBase =
  "h-[50px] w-full rounded-lg inter-light border border-[#2A1060] bg-[#060A14CC] px-4 text-[13px] text-white outline-none transition placeholder:text-gray-600 focus:border-olos-neon focus-visible:ring-2 focus-visible:ring-olos-neon/40";

function Select({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldBase} cursor-pointer appearance-none pr-10`}
        >
          {options.map((o) => (
            <option key={o} value={o} className="bg-[#080b16]">
              {o}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-olos-neon"
        >
          ▼
        </span>
      </div>
    </div>
  );
}

export default function GoLivePage() {
  const [title, setTitle] = useState(
    "Snake Arena PvP - Road to 10k GVT tournament matches!",
  );
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [quality, setQuality] = useState(QUALITIES[0]);
  const [region, setRegion] = useState(REGIONS[0]);
  const [overlays, setOverlays] = useState<Record<OverlayId, boolean>>(
    () =>
      Object.fromEntries(OVERLAYS.map((o) => [o.id, o.defaultOn])) as Record<
        OverlayId,
        boolean
      >,
  );
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleMissing = title.trim().length === 0;

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(STREAM_KEY);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't copy the stream key. Select it and copy it manually.");
    }
  };

  const startStream = async () => {
    if (titleMissing) return;
    setStarting(true);
    setError(null);
    try {
      // TODO: call your backend to create the broadcast, then redirect.
      // await fetch("/api/streams", { method: "POST", body: JSON.stringify({ title, category, quality, region, overlays }) });
      await new Promise((r) => setTimeout(r, 600));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the stream. Try again.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <main className="min-h-screen text-white">
      <div className="flex ml-4 pt-5">
        <BackButton />
      </div>
      <div className="mx-auto -ml-4 -mr-4 grid max-w-360 gap-6 px-6 py-12 lg:grid-cols-[1fr_310px]">
        {/* Form */}
        <section aria-labelledby="go-live-title">
          <h1 id="go-live-title" className="text-2xl inter-extrabold tracking-tight sm:text-[26px]">
            <span aria-hidden="true">🎥 </span>Go Live Configuration
          </h1>

          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="stream-title" className={fieldLabel}>
                Stream Title
              </label>
              <input
                id="stream-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                aria-invalid={titleMissing}
                aria-describedby={titleMissing ? "title-error" : undefined}
                className={fieldBase}
              />
              {titleMissing && (
                <p id="title-error" className="mt-2 text-[12px] text-[#ff8a7a]">
                  Add a stream title so viewers know what you're playing.
                </p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Select id="category" label="Game Category" value={category} options={CATEGORIES} onChange={setCategory} />
              <Select id="quality" label="Streaming Quality" value={quality} options={QUALITIES} onChange={setQuality} />
              <Select id="region" label="Server Region" value={region} options={REGIONS} onChange={setRegion} />

              <div>
                <label htmlFor="stream-key" className={fieldLabel}>
                  Stream Key
                </label>
                <div className="relative">
                  <input
                    id="stream-key"
                    readOnly
                    value={STREAM_KEY}
                    className={`${fieldBase} truncate pr-24 font-mono text-[12px] text-[#8d9ab3]`}
                  />
                  <button
                    type="button"
                    onClick={copyKey}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-[#2a1670] px-2.5 py-1.5 text-[10px] font-black text-[#c9b8ff] transition hover:bg-[#3a1f94] focus-visible:outline focus-visible:outline-olos-neon"
                  >
                    {copied ? "Copied" : "Copy Key"}
                  </button>
                </div>
              </div>
            </div>

            <fieldset>
              <legend className={fieldLabel}>Overlay Customizations</legend>
              <div className="flex flex-wrap gap-3">
                {OVERLAYS.map((o) => {
                  const on = overlays[o.id];
                  return (
                    <label
                      key={o.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2 text-[12px] inter-semibold transition focus-within:outline focus-within:outline-offset-2 focus-within:outline-olos-neon ${
                        on
                          ? "border-olos-neon/70 bg-olos-neon/4 text-white"
                          : "border-white/10 bg-[#080b16] text-white hover:border-white/25"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setOverlays((p) => ({ ...p, [o.id]: !p[o.id] }))}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`h-3.5 w-3.5 rounded-[3px] ${on ? "bg-olos-neon" : "bg-white/10"}`}
                      />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </section>

        {/* Preview */}
        <aside className="flex flex-col gap-4 lg:pt-1">
          <section className="rounded-2xl border border-[#2a1f5c] bg-[#060A14CC] p-5">
            <h2 className="mb-4 text-[14px] inter-extrabold">
              <span aria-hidden="true">📹 </span>Camera &amp; Audio Preview
            </h2>
            <div className="flex aspect-16/10 items-center justify-center rounded-lg border border-[#2a1f5c] bg-black px-4 text-center text-[11px] inter-light text-[#8d9ab3]">
              OBS/Webcam Stream Input Connected
            </div>
            <p className="mt-4 flex items-center gap-2 inter-light text-[11px] text-[#A4B7EB]">
              <i className="h-2.5 w-2.5 rounded-full bg-[#22e08a]" aria-hidden="true" />
              Mic level: Good (-12dB)
            </p>
          </section>

          {error && (
            <p role="alert" className="text-[12px] text-[#ff8a7a]">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={startStream}
            disabled={starting || titleMissing}
            className="h-13 rounded-lg bg-[#22d3ee] text-[14px] inter-extrabold text-[#04121a] transition hover:shadow-[0_0_22px_rgba(34,211,238,.45)] active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">🚀 </span>
            {starting ? "Starting stream…" : "Start Live Stream Now"}
          </button>
        </aside>
      </div>
    </main>
  );
}