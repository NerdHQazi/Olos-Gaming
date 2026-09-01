"use client";
import {
  HiSquares2X2,
  HiTrophy,
  HiWallet,
  HiQuestionMarkCircle,
  HiBell,
} from "react-icons/hi2";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StakeAmount() {
  const [selectedStake, setSelectedStake] = useState<number>(50);
  const [customStake, setCustomStake] = useState<string>("");
  const [agreed, setAgreed] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState("Game");
  const router = useRouter();

  const stakeOptions = [
    { amount: 10, usd: "$1.00" },
    { amount: 25, usd: "$2.50" },
    { amount: 50, usd: "$5.00" },
    { amount: 100, usd: "$10.00" },
  ];

  return (
    <div className="flex min-h-screen w-full bg-[#060812] text-white font-sans">
      <aside className="w-64 border-r border-slate-800/60 bg-[#090c17] p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <span className="text-blue-500 font-extrabold text-2xl tracking-wider">
              OLOS
            </span>
            <span className="text-[10px] font-semibold bg-purple-900/50 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded uppercase">
              BETA
            </span>
          </div>

          <nav className="space-y-2">
            {[
              { name: "Dashboard", link: "/dashboard", icon: <HiSquares2X2 /> },
              { name: "Wallet", link: "/wallet", icon: <HiWallet /> },
              { name: "Leaderboard", link: "/leaderboard", icon: <HiTrophy /> },
              {
                name: "How it works",
                link: "/how-to",
                icon: <HiQuestionMarkCircle />,
              },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setActiveNav(item.name);
                  router.push(item.link);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  (activeNav === item.name,
                  item.link
                    ? "bg-purple-600/20 text-purple-400 border border-purple-500/40"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200")
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        <header className="flex justify-end items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#0e1222] border border-slate-800 px-3 py-1.5 rounded-full text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300">Ethereum</span>
            </div>
            <div className="bg-[#0e1222] border border-slate-800 px-3 py-1.5 rounded-full text-xs font-semibold">
              $1,703.345
            </div>
            <button className="p-2.5 bg-[#0e1222] border border-slate-800 rounded-full text-slate-300 hover:text-white">
              <HiBell className="text-lg" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="mb-20">
              <h1 className="text-4xl font-bold">Stake & Play</h1>
              <p className="text-1xl text-slate-400 mt-1">
                Choose your stake amount and <br />
                confirm to find an opponent
              </p>
            </div>
            <div className="bg-[#0a0e1a] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-xs font-bold tracking-wide uppercase text-slate-300">
                  Choose Stake Amount
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {stakeOptions.map((opt) => (
                  <button
                    key={opt.amount}
                    onClick={() => {
                      setSelectedStake(opt.amount);
                      setCustomStake("");
                    }}
                    className={`relative p-3.5 rounded-xl border flex flex-col items-center justify-center transition ${
                      selectedStake === opt.amount && !customStake
                        ? " border text-white"
                        : "border-slate-800/80 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {opt && (
                      <span className="absolute top-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase text-white"></span>
                    )}
                    <span className="font-bold text-sm">{opt.amount} gvt</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {opt.usd}
                    </span>
                  </button>
                ))}
                <div
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center bg-[#0d1222] ${
                    customStake ? "border-purple-500" : "border-slate-800/80"
                  }`}
                >
                  <span className="text-[10px] text-purple-400 font-bold uppercase">
                    Custom
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    value={customStake}
                    onChange={(e) => {
                      setCustomStake(e.target.value);
                      setSelectedStake(0);
                    }}
                    className="w-full text-center bg-transparent text-sm font-bold focus:outline-none text-white"
                  />
                  <span className="text-[9px] text-slate-500">GVT</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e1a] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-xs font-bold tracking-wide uppercase text-slate-300">
                  Review Your Stake
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="h-28 bg-gradient-to-b from-emerald-900/30 to-slate-900 rounded-xl flex items-center justify-center overflow-hidden border border-slate-800">
                  <img
                    src="snake-image.jpg"
                    alt="Snake Game"
                    className="h-24 object-contain"
                  />
                </div>
                <div className="md:col-span-2 space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Network Fee</span>
                    <span className="font-semibold text-white">
                      {customStake || selectedStake} GVT{" "}
                      <span className="text-emerald-400 text-[10px] ml-1">
                        ($5.00 USD)
                      </span>
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Potential Win</span>
                    <span className="font-semibold text-emerald-400">
                      100 GVT{" "}
                      <span className="text-[10px] ml-1">($10.00 USD)</span>
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Win Probability</span>
                    <span className="font-semibold text-white">
                      68%{" "}
                      <span className="text-[10px] text-slate-500 ml-1">
                        Based on your stats
                      </span>
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Network Fee</span>
                    <span className="font-semibold text-white">
                      -0.50 GVT{" "}
                      <span className="text-emerald-400 text-[10px] ml-1">
                        ($0.050 USD)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e1a] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center bg-[#0e1326] p-4 rounded-xl border border-slate-800/60">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Custom Stake Amount
                  </span>
                  <p className="text-lg font-black text-white mt-0.5">
                    2480.00 <span className="text-xs text-purple-400">GVT</span>
                  </p>
                  <span className="text-[10px] text-slate-500">
                    $248.00 USD
                  </span>
                </div>

                <button className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 px-4 py-2 rounded-xl font-semibold border border-slate-700 transition">
                  + Add Fund
                </button>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="agreed"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="accent-purple-600 rounded cursor-pointer"
                />
                <label
                  htmlFor="agreed"
                  className="text-xs text-slate-400 cursor-pointer"
                >
                  I agree to the{" "}
                  <span className="text-purple-400 underline">
                    Terms of Service
                  </span>{" "}
                  and confirm that I want to stake and play.
                </label>
              </div>

              <div className="flex justify-end">
                <div className="w-full sm:w-auto">
                  <button
                    disabled={!agreed}
                    className={`w-full sm:w-64 py-3 rounded-xl font-bold text-xs transition ${
                      agreed
                        ? "bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-lg shadow-purple-600/30"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    Confirm & Play
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0e1a] border border-slate-800 rounded-2xl p-5 flex flex-col items-center mt-10">
            <div className="w-full h-48 bg-gradient-to-b from-[#161f38] to-[#0a0e1a] rounded-xl flex items-center justify-center p-3 mb-4 border border-slate-800/80">
              <img
                src="snake.png"
                alt="Snake Battle"
                className="h-40 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
              />
            </div>

            <h3 className="text-xl font-black text-white">Snake Battle</h3>

            <div className="flex items-center gap-2 mt-2 mb-4">
              <span className="bg-[#1e293b] text-slate-300 text-[10px] px-3 py-1 rounded-full font-semibold border border-slate-700">
                Classic Game
              </span>
              <span className="bg-purple-600/20 text-purple-400 border border-purple-500/40 text-[10px] px-3 py-1 rounded-full font-semibold">
                PvP
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
