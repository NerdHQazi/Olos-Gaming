"use client";

import { useEffect, useState } from "react";
import BackButton from "../../marketplace/[id]/back-button";

type ModStatus = "none" | "muted" | "banned";

type ChatMessage = {
  id: string;
  user: string;
  text: string;
  flagged?: boolean;
  tone: "red" | "cyan" | "default";
};

// TODO: replace placeholder data with the live broadcast and a realtime chat channel.
const BROADCAST = {
  title: "Snake Battle Pro Cup: SnakeGod99 vs CyberViper",
  bitrateKbps: 6000,
  startedSecondsAgo: 1 * 3600 + 24 * 60 + 11,
  viewportSrc: "/snake2.png",
};

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: "1", user: "ToxicGamer", text: "This strategy is terrible lol", flagged: true, tone: "red" },
  { id: "2", user: "CryptoKing", text: "Just tipped 50 GVT on this win!", tone: "cyan" },
  { id: "3", user: "OlosWatcher", text: "Can we get a replay on that loop?", tone: "cyan" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const formatDuration = (t: number) =>
  `${pad(Math.floor(t / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`;

export default function BroadcasterDashboardPage() {
  const [elapsed, setElapsed] = useState(BROADCAST.startedSecondsAgo);
  const [live, setLive] = useState(true);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [messages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [status, setStatus] = useState<Record<string, ModStatus>>({});

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [live]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  const moderate = (user: string, next: Exclude<ModStatus, "none">) => {
    // TODO: call your moderation API.
    setStatus((s) => ({ ...s, [user]: next }));
    setNotice(`${user} ${next === "banned" ? "banned from chat" : "muted"}.`);
  };

  const endStream = () => {
    // TODO: call your backend to stop the broadcast.
    setLive(false);
    setConfirmEnd(false);
    setNotice("Stream ended.");
  };

  const actions = [
    { id: "clip", label: "Clip Last 30s", icon: "🎬", primary: true, run: () => setNotice("Clip saved. It will appear in your clips shortly.") },
    { id: "marker", label: "Add Map Marker", icon: "📍", run: () => setNotice("Marker added at " + formatDuration(elapsed) + ".") },
    { id: "poll", label: "Launch Chat Poll", icon: "📊", run: () => setNotice("Poll launched in chat.") },
  ];

  return (
    <main className="min-h-screen text-white">
        <div className="flex ml-4 pt-5">
            <BackButton />
        </div>
      <div className="mx-auto grid max-w-300 gap-6 px-6 py-7 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="min-w-0 space-y-5">
          {/* Status bar */}
          <header className="flex flex-wrap items-center gap-4 rounded-xl border border-[#2A1060] bg-[#060A14CC] px-5 py-4">
            <span
              className={`rounded px-2.5 py-0.5 text-[9px] inter-black uppercase tracking-wide ${
                live ? "bg-[#ef4444] text-white" : "bg-white/10 text-gray-400"
              }`}
            >
              {live ? "Live" : "Offline"}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[16px] inter-extrabold">{BROADCAST.title}</h1>
              <p className="mt-0.5 text-[11px] inter-extralight text-[#A4B7EB]">
                Bitrate: {BROADCAST.bitrateKbps.toLocaleString()} Kbps • Stream Uptime:{" "}
                <span className="tabular-nums">{formatDuration(elapsed)}</span>
              </p>
            </div>

            {live &&
              (confirmEnd ? (
                <div className="flex items-center gap-2" role="alertdialog" aria-label="Confirm end stream">
                  <span className="text-[12px] text-[#aab5cc]">End stream for all viewers?</span>
                  <button
                    onClick={endStream}
                    className="rounded-md bg-[#EF44441A] px-3 py-1.5 text-[11px] inter-bold border border-[#EF4444] text-[#EF4444] transition hover:bg-[#f25b5b] hover:text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    End now
                  </button>
                  <button
                    onClick={() => setConfirmEnd(false)}
                    className="rounded-md border border-white/15 px-3 py-1.5 text-[11px] inter-bold transition hover:border-white/35"
                  >
                    Keep streaming
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmEnd(true)}
                  className="rounded-md bg-[#EF44441A] px-3 py-1.5 text-[11px] inter-bold border border-[#EF4444] text-[#EF4444] transition hover:bg-[#ef4444]/10 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#ef4444]"
                >
                  End Stream
                </button>
              ))}
          </header>

          {/* Viewport */}
          <section
            aria-label="Broadcaster viewport"
            className="relative flex min-h-80 items-center justify-center rounded-2xl border border-[#241b52] bg-black p-6 sm:min-h-81.25"
          >
            <span className="absolute left-4 top-4 rounded border border-[#20CEEE] px-2.5 py-1 text-[10px] inter-bold text-[#20CEEE] bg-[#060A14CC]">
              Broadcaster Viewport
            </span>
            {live ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={BROADCAST.viewportSrc}
                alt="Your live broadcast output"
                className="h-57.5 w-52 object-cover"
              />
            ) : (
              <p className="text-sm text-[#8d9ab3]">
                Your stream has ended. Start a new broadcast from Go Live.
              </p>
            )}
          </section>

          {/* Quick actions */}
          <section className="rounded-xl border border-[#241b52] bg-[#060A14CC] px-4 py-2">
            <h2 className="mb-2 text-[13px] inter-extrabold">
              <span aria-hidden="true">⚡ </span>Quick Broadcaster Actions
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {actions.map((a) => (
                <button
                  key={a.id}
                  disabled={!live}
                  onClick={a.run}
                  className={`rounded-md px-2 py-3 text-[11px] inter-bold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#22d3ee] ${
                    a.primary
                      ? "bg-[#22d3ee] text-[#04121a] hover:shadow-[0_0_16px_rgba(34,211,238,.4)]"
                      : "bg-[#150f33] text-white hover:bg-[#1d1544]"
                  }`}
                >
                  <span aria-hidden="true">{a.icon} </span>
                  {a.label}
                </button>
              ))}
              <button
                disabled={!live}
                aria-pressed={micMuted}
                onClick={() => {
                  setMicMuted((m) => !m);
                  setNotice(micMuted ? "Mic unmuted." : "Broadcast mic muted.");
                }}
                className={`rounded-md px-2 py-3 text-[11px] inter-bold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#22d3ee] ${
                  micMuted ? "bg-[#ef4444]/20 text-[#ff8a8a]" : "bg-[#150f33] text-white hover:bg-[#1d1544]"
                }`}
              >
                <span aria-hidden="true">{micMuted ? "🔇 " : "🎙️ "}</span>
                {micMuted ? "Unmute Broadcast Mic" : "Mute Broadcast Mic"}
              </button>
            </div>

            <p role="status" aria-live="polite" className="mt-2 min-h-4.5 text-[10px] bai-jamjuree-medium text-[#22d3ee]">
              {notice}
            </p>
          </section>
        </div>

        {/* Chat moderation */}
        <aside
          aria-label="Stream chat moderation"
          className="h-fit rounded-xl border border-[#2A1060] bg-[#060A14CC] p-5 lg:min-h-76.25"
        >
          <h2 className="mb-4 text-[14px] inter-extrabold">
            <span aria-hidden="true">💬 </span>Stream Chat Mod
          </h2>
          <ul className="space-y-1.5">
            {messages.map((m) => {
              const st = status[m.user] ?? "none";
              return (
                <li
                  key={m.id}
                  className={`rounded-md px-3 py-2.5 text-[12px] ${
                    m.flagged ? "bg-[#EF444411]" : "bg-[#1A0A3C99]"
                  } ${st !== "none" ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inter-bold ${
                        m.tone === "red" ? "text-[#ef4444]" : m.tone === "cyan" ? "text-[#22d3ee]" : "text-white"
                      }`}
                    >
                      {m.user}
                    </span>
                    {m.flagged && st === "none" ? (
                      <span className="flex gap-1 text-[9px] inter-bold">
                        <button
                          onClick={() => moderate(m.user, "banned")}
                          className="text-[#ef4444] hover:underline focus-visible:outline focus-visible:outline-[#ef4444]"
                          aria-label={`Ban ${m.user}`}
                        >
                          [BAN]
                        </button>
                        <button
                          onClick={() => moderate(m.user, "muted")}
                          className="text-[#aab5cc] hover:underline focus-visible:outline focus-visible:outline-white"
                          aria-label={`Mute ${m.user}`}
                        >
                          [MUTE]
                        </button>
                      </span>
                    ) : st !== "none" ? (
                      <span className="text-[9px] inter-bold uppercase text-[#aab5cc]">{st}</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-white inter-light text-[11px]">{m.text}</p>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </main>
  );
}