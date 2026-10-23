"use client";

import { useEffect, useState } from "react";
import BackButton from "../../marketplace/[id]/back-button";

const CATEGORIES = [
  "Hyper-Snake Protocol",
  "Quantum Chess Arena",
  "Neon Tetris Blitz",
  "Mili-Militia 2D",
  "Bounce King",
  "Checkers Rush",
];

// TODO: replace with live metrics from your backend / realtime channel.
const METRICS = [
  { label: "Total Viewers", value: "1,843", color: "text-[#22e08a]" },
  { label: "Chat Velocity", value: "45 msgs/min", color: "text-[#22d3ee]" },
  { label: "Donations Received", value: "420 GVT", color: "text-[#ffb400]" },
  { label: "New Followers", value: "+84 Today", color: "text-[#22d3ee]" },
];

const INITIAL = {
  title: "PRO PvP Arena S2 - 100 GVT Stake Match!",
  category: CATEGORIES[0],
};

const field =
  "h-10 w-full rounded-md border border-[#241b52] inter-light bg-[#080b16] px-3 text-[12px] text-white outline-none transition focus:border-[#22d3ee] focus-visible:ring-2 focus-visible:ring-[#22d3ee]/40";

export default function BroadcastConsolePage() {
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ended, setEnded] = useState(false);

  const [saved, setSaved] = useState(INITIAL);
  const [title, setTitle] = useState(INITIAL.title);
  const [category, setCategory] = useState(INITIAL.category);
  const [notice, setNotice] = useState<string | null>(null);

  const dirty = title !== saved.title || category !== saved.category;
  const titleMissing = title.trim().length === 0;

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  const saveMetadata = () => {
    if (titleMissing) return;
    // TODO: PATCH the broadcast metadata on your backend.
    setSaved({ title: title.trim(), category });
    setTitle(title.trim());
    setNotice("Stream details updated.");
  };

  const endSession = () => {
    // TODO: call your backend to stop the broadcast.
    setEnded(true);
    setConfirmEnd(false);
  };

  const toggles = [
    { id: "mic", label: micMuted ? "Unmute Microphone" : "Mute Microphone", on: micMuted, flip: () => setMicMuted((v) => !v) },
    { id: "cam", label: cameraOff ? "Turn Camera On" : "Toggle Camera", on: cameraOff, flip: () => setCameraOff((v) => !v) },
  ];

  return (
    <main className="min-h-screen text-white">
    <div className="flex pt-5">
        <BackButton />
    </div>
      <div className="mx-auto -ml-8 -mr-8 grid max-w-400 gap-5 px-6 py-8 lg:grid-cols-[1fr_400px]">
        {/* Left: preview + console */}
        <div className="min-w-0 space-y-4">
          <section
            aria-label="Broadcast preview"
            className="relative aspect-[16/8.2] overflow-hidden rounded-xl border border-[#241b52] bg-black"
          >
            {ended ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[#8d9ab3] bai-jamjuree-semibold">
                Your broadcast session has ended. Start a new one from Go Live.
              </div>
            ) : (
              <>
                {/* TODO: replace with your live game feed (WebRTC / HLS preview). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/streams/broadcast-preview.png"
                  alt="Live preview of your Hyper-Snake Protocol broadcast"
                  className="h-full w-full object-cover"
                />
                {/* Camera overlay */}
                <div className="absolute left-3 top-3 h-31 w-40 overflow-hidden rounded-md border-2 border-[#22d3ee] bg-[#0b0f1f]">
                  {cameraOff ? (
                    <div className="flex h-full items-center justify-center text-[9px] font-bold text-[#8d9ab3]">
                      Camera off
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/streams/camera-feed.png" alt="Your camera feed" className="h-full w-full object-cover" />
                  )}
                </div>
              </>
            )}
          </section>

          <section
            aria-label="Broadcast console"
            className="flex flex-wrap items-center gap-3 rounded-xl border border-[#FFFFFF1A] bg-[#060A16] px-3 py-5"
          >
            <h2 className="mr-1 text-[14px] bai-jamjuree-bold uppercase tracking-wide">Broadcast Console</h2>

            {toggles.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={ended}
                aria-pressed={t.on}
                onClick={t.flip}
                className={`rounded-md px-3 py-2 text-[10px] inter-bold uppercase tracking-wide text-white transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#a478ff] ${
                  t.on ? "bg-[#4a2a9a] ring-1 ring-[#a478ff]" : "bg-[#7034d7] hover:bg-[#7f45e6]"
                }`}
              >
                {t.label}
              </button>
            ))}

            <button
              type="button"
              disabled={ended}
              aria-pressed={screenSharing}
              onClick={() => setScreenSharing((v) => !v)}
              className={`rounded-md border px-3 py-2 text-[10px] inter-bold uppercase tracking-wide transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#22d3ee] ${
                screenSharing
                  ? "border-[#22d3ee] bg-[#22d3ee]/10 text-[#22d3ee]"
                  : "border-white/10 bg-black text-white hover:border-white/30"
              }`}
            >
              {screenSharing ? "Stop Screen Share" : "Screen Share"}
            </button>

            {confirmEnd ? (
              <span className="flex items-center gap-2" role="alertdialog" aria-label="Confirm end broadcast">
                <button
                  onClick={endSession}
                  className="rounded-md bg-[#ef4444] px-3 py-2 text-[10px] inter-bold uppercase tracking-wide text-white hover:bg-[#f25b5b] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  End for all viewers
                </button>
                <button
                  onClick={() => setConfirmEnd(false)}
                  className="rounded-md border border-white/15 px-3 py-2.5 text-[11px] font-bold hover:border-white/35"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                disabled={ended}
                onClick={() => setConfirmEnd(true)}
                className="rounded-md bg-[#ef4444] px-3 py-2 text-[10px] inter-bold uppercase tracking-wide text-white transition hover:bg-[#f25b5b] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                End Broadcast Session
              </button>
            )}
          </section>
        </div>

        {/* Right: metrics + metadata */}
        <aside className="h-fit rounded-xl border border-[#FFFFFF1A] bg-[#060A16] p-6">
          <h2 className="mb-5 text-[16px] bai-jamjuree-bold uppercase tracking-wide">Live Stream Metrics</h2>

          <dl className="space-y-4 text-[11px] uppercase tracking-wide">
            {METRICS.map((m) => (
              <div key={m.label} className="flex border-b border-[#FFFFFF1A] pb-2 items-center justify-between gap-3">
                <dt className="text-[#A4B7EB] text-[12px] inter-extralight">{m.label}</dt>
                <dd className={`text-[14px] inter-bold normal-case tabular-nums ${m.color}`}>{m.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6">
            <h3 className="mb-3 text-[10px] inter-bold uppercase tracking-wide text-[#6B7280]">
              Stream Metadata Editor
            </h3>

            <label htmlFor="meta-title" className="mb-1.5 block text-[12px] text-[#A4B7EB] inter-light">
              Stream Title
            </label>
            <input
              id="meta-title"
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={titleMissing}
              className={field}
            />
            {titleMissing && (
              <p className="mt-1.5 text-[12px] text-[#ff8a7a]">Add a stream title before saving.</p>
            )}

            <label htmlFor="meta-category" className="mb-1.5 mt-4 block text-[12px] text-[#A4B7EB] inter-light">
              Game Category
            </label>
            <select
              id="meta-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`${field} cursor-pointer`}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#080b16]">
                  {c}
                </option>
              ))}
            </select>

            {(dirty || notice) && (
              <div className="mt-4 flex items-center gap-2">
                {dirty && (
                  <button
                    type="button"
                    onClick={saveMetadata}
                    disabled={titleMissing}
                    className="rounded-md bg-[#22d3ee] px-4 py-2 text-[12px] font-black text-[#04121a] transition hover:shadow-[0_0_14px_rgba(34,211,238,.4)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Save changes
                  </button>
                )}
                <p role="status" aria-live="polite" className="text-[12px] text-[#22e08a]">
                  {notice}
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}