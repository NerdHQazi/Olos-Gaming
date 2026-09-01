"use client";
import React from "react";
export default function LeaderBoard() {
  const leaderboardData = [
    {
      rank: "#1",
      name: "CryptoKing",
      wins: "234 wins",
      score: "12,450",
      avatar: "👑",
      color: "text-amber-500",
    },
    {
      rank: "#2",
      name: "SnakeMstr",
      wins: "234 wins",
      score: "9,820",
      avatar: "🐍",
      color: "text-amber-500",
    },
    {
      rank: "#3",
      name: "ChessGod",
      wins: "198 wins",
      score: "8,100",
      avatar: "♟️",
      color: "text-amber-500",
    },
    {
      rank: "#4",
      name: "Ainaf_G",
      wins: "132 wins",
      score: "5,430",
      avatar: "⭐",
      color: "text-cyan-400",
    },
  ];
  return (
    <>
      <div className="flex items-center">
        <div className="mt-40 ml-15">
          <div className="text-[#D06311] font-extrabold">LEADERBOARD</div>
          <div className="text-white font-extrabold mt-5 text-3xl">
            Your Rank Live On-Chain Forever
          </div>
          <div className="text-[#657294] font-extrabold mt-5 text-sm">
            Every match is recorded on the blockchain. Build your reputation,
            Climb the ranks and <br /> prove your skill to the world
          </div>
          <div className="font-extrabold flex items-center gap-2 text-white border-[#169EFA] border-1 rounded-[10px] px-7 py-2 w-65 mt-10">
            🏆 View Full Leaderboard
          </div>
        </div>
        <div className="w-full mt-30 max-w-lg bg-[#070b14] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl text-white ml-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <h2 className="text-2xl font-bold tracking-wide">
                Global Rankings
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 px-3 py-1 rounded-full text-sm font-semibold">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
              Live
            </div>
          </div>

          {/* Rankings List */}
          <div className="flex flex-col gap-6">
            {leaderboardData.map((player) => (
              <div
                key={player.rank}
                className="flex items-center justify-between"
              >
                {/* Left Section: Rank + Avatar + Info */}
                <div className="flex items-center gap-4">
                  <span className={`w-8 text-xl font-bold ${player.color}`}>
                    {player.rank}
                  </span>
                  <div className="w-12 h-12 flex items-center justify-center text-2xl bg-slate-900 rounded-full border border-slate-800">
                    {player.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-base leading-tight">
                      {player.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {player.wins}
                    </p>
                  </div>
                </div>

                {/* Right Section: Score */}
                <span className="text-amber-500 font-bold text-lg">
                  {player.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <hr className="ml-15 mt-20 border-[#657294] border-900/40 mb-12 w-[90%]" />
    </>
  );
}
