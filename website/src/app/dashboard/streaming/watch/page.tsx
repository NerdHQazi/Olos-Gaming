"use client";

import { useEffect, useRef, useState } from "react";
import BackButton from "../../marketplace/[id]/back-button";

type ChatMessage = {
  id: string;
  user: string;
  time: string;
  text: string;
  color: string;
};

// TODO: replace placeholder data with real stream data and a realtime chat channel.
const STREAM = {
  streamer: "CryptoKing.eth",
  avatar: "/streams/avatars/cryptoking.png",
  followers: "14.5k",
  game: "Hyper-Snake Protocol",
  viewers: 1204,
  startedSecondsAgo: 2 * 3600 + 14 * 60 + 35,
  playerSrc: "/streams/cyber-coil.png",
};

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: "1", user: "WarpRunner.eth", time: "10:24", text: "THAT STEER WAS INSANE!", color: "#00d2ff" },
  { id: "2", user: "GVT_Validator", time: "10:24", text: "50 GVT on-chain pot is secured", color: "#ffb400" },
  { id: "3", user: "ChessGod.sol", time: "10:25", text: "Is this matching the latency test?", color: "#ffffff" },
  { id: "4", user: "Crypto_Rookie", time: "10:25", text: "How do I stake 10 GVT?", color: "#22e08a" },
  { id: "5", user: "SithLord_GVT", time: "10:26", text: "Use WASD keys to loop guys", color: "#ffffff" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const formatDuration = (total: number) =>
  `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
const clock = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function WatchStreamPage() {
  const [elapsed, setElapsed] = useState(STREAM.startedSecondsAgo);
  const [following, setFollowing] = useState(false);
  const [shared, setShared] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [avatarFailed, setAvatarFailed] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    // TODO: send through your chat backend; this only appends locally.
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), user: "You", time: clock(), text, color: "#a478ff" },
    ]);
    setDraft("");
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `${STREAM.streamer} is live`, url: location.href });
      } else {
        await navigator.clipboard.writeText(location.href);
      }
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      /* user cancelled the share sheet */
    }
  };

  return (
    <main className="min-h-screen text-white">
      <div className="flex ml-4 pt-5">
        <BackButton />
      </div>
      <div className="mx-auto -ml-4 -mr-4 grid max-w-325 gap-6 px-6 py-8 lg:grid-cols-[1fr_350px]">
        {/* Player + streamer */}
        <div className="min-w-0">
          <section
            aria-label="Live stream"
            className="relative aspect-16/10 overflow-hidden rounded-3xl border border-white/10 bg-black"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={STREAM.playerSrc}
              alt={`${STREAM.streamer} playing ${STREAM.game}`}
              className="h-full w-full object-cover border border-[#FFFFFF1A]"
            />
            {/* TODO: replace the image with your video player (HLS / WebRTC). */}

            <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-[#FF3B30] bg-[#FF3B3022] px-3 py-1 text-[9px] bai-jamjuree-bold uppercase tracking-wide">
              <i className="h-2 w-2 rounded-full bg-[#FF3B30]" aria-hidden="true" />
              Live
            </span>

            <div className="absolute right-4 top-4 flex items-center gap-3 text-[11px] inter-bold">
              <span className="rounded-full bg-black/60 px-3 py-1 uppercase backdrop-blur-sm">
                {STREAM.viewers.toLocaleString()} Viewers
              </span>
              <span
                className="rounded-full bg-black/60 px-3 py-1 tabular-nums text-[#00D3FE] backdrop-blur-sm inter-bold text-[11px]"
                aria-label="Stream duration"
              >
                {formatDuration(elapsed)}
              </span>
            </div>
          </section>

          <section className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#0b1020] px-5 py-4">
            {avatarFailed ? (
              <span
                aria-hidden="true"
                className="flex h-13 w-13 items-center justify-center rounded-full bg-[#1b2442] text-sm font-black text-olos-neon"
              >
                CK
              </span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={STREAM.avatar}
                alt=""
                onError={() => setAvatarFailed(true)}
                className="h-13 w-13 rounded-full border border-white/10 object-cover"
              />
            )}

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[16px] bai-jamjuree-bold">{STREAM.streamer}</h1>
              <p className="truncate text-[11px] text-[#A4B7EB] inter-extralight">
                {STREAM.followers} Followers · Playing {STREAM.game}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFollowing((f) => !f)}
                aria-pressed={following}
                className={`rounded-lg px-4 py-2 text-[12px] bai-jamjuree-bold uppercase tracking-wide transition active:scale-[.98] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#a478ff] ${
                  following
                    ? "border border-[#7034d7] bg-transparent text-[#c9b8ff]"
                    : "bg-[#7034d7] text-white hover:bg-[#7f45e6]"
                }`}
              >
                {following ? "Following" : "Follow"}
              </button>
              <button
                type="button"
                onClick={share}
                className="rounded-lg border border-white/15 bg-transparent px-4 py-2 text-[12px] bai-jamjuree-bold uppercase tracking-wide transition hover:border-white/35 active:scale-[.98] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-olos-neon"
              >
                {shared ? "Link copied" : "Share"}
              </button>
            </div>
          </section>
        </div>

        {/* Chat */}
        <aside
          aria-label="Live stream chat"
          className="flex h-130 flex-col rounded-2xl border border-white/[0.07] bg-[#0b1020] lg:h-auto lg:min-h-135"
        >
          <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
            <h2 className="text-[14px] bai-jamjuree-bold uppercase tracking-wide">Live Stream Chat</h2>
            <i className="h-2 w-2 rounded-full bg-[#00FF87] shadow-[0_0_8px_#22e08a]" aria-label="Chat connected" />
          </header>

          <ul
            ref={listRef}
            role="log"
            aria-live="polite"
            className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
          >
            {messages.map((m) => (
              <li key={m.id} className="text-[12px]">
                <p className="flex items-baseline gap-2">
                  <span className="inter-bold text-[11px]" style={{ color: m.color }}>
                    {m.user}
                  </span>
                  <span className="text-[8px] text-[#6B7280] inter-light">{m.time}</span>
                </p>
                <p className="mt-0.5 wrap-break-word text-[#A4B7EB]">{m.text}</p>
              </li>
            ))}
          </ul>

          <form onSubmit={send} className="flex items-center inter-light text-[#6B7280] gap-2 border-t border-white/[0.07] p-4">
            <label htmlFor="chat-input" className="sr-only">
              Send a chat message
            </label>
            <input
              id="chat-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={200}
              placeholder="Send a chat message..."
              className="h-10 min-w-0 flex-1 rounded-lg border border-white/[0.07] bg-[#080b16] px-3 text-[12px] text-white outline-none placeholder:text-gray-600 focus:border-olos-neon"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-olos-neon text-[#04121a] transition hover:shadow-[0_0_14px_rgba(0,210,255,.45)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8.5l3.2 3.2L13 4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}