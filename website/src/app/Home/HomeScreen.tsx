"use client";

import Navbar from "@/components/Navbar";
import { GiGamepad } from "react-icons/gi";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { GiWallet } from "react-icons/gi";
import { LuHexagon } from "react-icons/lu";
import { useState } from "react";

export default function HomeScreen() {
  const [isMODALOpen, setIsModalOpen] = useState(false);
  const { needsUsername, completeUsername } = useAuth();
  return (
    <div className="min-h-screen bg-[#0B1121] text-white selection:bg-olos-blue/30 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      {/* Hero Section */}
      <section className="relative mt-[83px] min-h-[633px] flex items-center justify-center px-6 lg:px-16 py-12">
        {/* Overlay Layer */}
        <div className="absolute inset-0 z-0 bg-[#030711]/10" />

        <div className="relative z-10 max-w-7xl w-full flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Column: Text & Buttons */}
          <div className="flex flex-col items-start text-left w-full lg:w-1/2">
            <div className="text-[#20CDED]">
              <div className="font-extrabold flex items-center gap-2 rounded-full bg-[#001D26]/20 w-fit py-1 px-4 border border-[#20CDED]">
                <div className="w-3 h-3 rounded-full bg-[#00FF87]"></div>
                Web3 skill Gaming.Beta Live
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <div className="flex items-center gap-3 text-4xl lg:text-5xl font-extrabold">
                <span className="text-white">Play Skill</span>
                <span className="text-[#8c57e7]">Games</span>
              </div>
              <div className="flex items-center gap-3 text-4xl lg:text-5xl font-extrabold">
                <span className="text-white">Stake Tokens.</span>
                <span className="text-[#f9c12c]">Win</span>
              </div>
              <div className="text-4xl lg:text-5xl text-[#f9c12c] font-extrabold">
                On Chain
              </div>
            </div>

            <p className="text-[#657294] mt-6 font-extrabold max-w-md leading-relaxed">
              Compete in skill-based mini-games. <br />
              Stake GVT tokens. Winner takes the spot. <br />
              Your record lives permanently on-chain.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-8">
              <Link
                href="/games"
                className="flex text-black items-center gap-2 font-bold bg-[#169EFA] rounded-[10px] px-7 py-3 cursor-pointer hover:bg-[#169EFA]/90 transition"
              >
                <GiGamepad size={"24px"} />
                Play Now
              </Link>
              <Link
                href="/leaderboard"
                className="font-bold flex items-center gap-2 text-white border-[#169EFA] border rounded-[10px] px-7 py-3 cursor-pointer hover:bg-[#169EFA]/10 transition"
              >
                🏆 View Leaderboards
              </Link>
            </div>
          </div>

          {/* Right Column: Image Grid */}
          <div className="grid grid-cols-2 gap-4 w-full lg:w-1/2 max-w-[500px]">
            <img
              src="/snake.png"
              alt="Snake Game"
              className="border border-[#20CDED] rounded-[22px] w-full h-auto object-cover aspect-square shadow-lg shadow-[#20CDED]/10"
            />
            <img
              src="/tetris.png"
              alt="Tetris Game"
              className="border border-[#20CDED] rounded-[22px] w-full h-auto object-cover aspect-square shadow-lg shadow-[#20CDED]/10"
            />
            <img
              src="/jumping-jack.png"
              alt="Jumping Jack Game"
              className="border border-[#20CDED] rounded-[22px] w-full h-auto object-cover aspect-square shadow-lg shadow-[#20CDED]/10"
            />
            <img
              src="/bounce.png"
              alt="Bounce Game"
              className="border border-[#20CDED] rounded-[22px] w-full h-auto object-cover aspect-square shadow-lg shadow-[#20CDED]/10"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col items-center justify-center mt-40">
        <div className="text-[#169EFA] font-extrabold">HOW IT WORKS</div>
        <div className="text-white font-extrabold text-3xl">
          Four Steps to Earning
        </div>
      </div>

      <div className="flex my-15">
        <div className="ml-15 border-[#169EFA] border w-60 rounded-[12px] px-5 py-3">
          <div className="text-white font-extrabold text-3xl">
            01
            <div className="mt-5">
              <GiWallet color="white" size={"50px"} />
            </div>
            <div className="text-white font-extrabold mt-5 text-2xl">
              Connect Wallet
            </div>
          </div>
          <div className="text-[#657294] font-extrabold mt-5 text-sm">
            Link market, WalletConnect or Coinbase. Your Wallet is your OLOS
            identity
          </div>
        </div>
        <div className="ml-15 border-[#169EFA] border w-60 rounded-[12px] px-5 py-3">
          <div className="text-white font-extrabold text-3xl">
            02
            <div className="mt-5">
              <GiGamepad size={"50px"} />
            </div>
            <div className="text-white font-extrabold mt-5 text-2xl">
              Choose a Game
            </div>
          </div>
          <div className="text-[#657294] font-extrabold mt-5 text-sm">
            Browse skill-based games. Practice free or enter a stake match for
            GVT rewards
          </div>
        </div>
        <div className="ml-15 border-[#169EFA] border w-60 rounded-[12px] px-5 py-3">
          <div className="text-white font-extrabold text-3xl">
            03
            <div className="mt-5">
              <LuHexagon size={"50px"} />
            </div>
            <div className="text-white font-extrabold mt-5 text-2xl">
              Set your Stake
            </div>
          </div>
          <div className="text-[#657294] font-extrabold mt-5 text-sm">
            Pick your GVT stake 5-500. Both players lock the same amount in
            escrow
          </div>
        </div>
        <div className="ml-15 border-[#169EFA] border w-60 rounded-[12px] px-5 py-3">
          <div className="text-white font-extrabold text-3xl">
            04
            <div className="mt-5">🏆</div>
            <div className="text-white font-extrabold mt-5 text-2xl">
              Win $ Collect
            </div>
          </div>
          <div className="text-[#657294] font-extrabold mt-5 text-sm">
            Best score or match winner takes the pot. Reward hits your wallet
            instantly
          </div>
        </div>
      </div>

      <footer className="w-full bg-[#05070e] text-white pt-16 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-orange-500 text-xs font-bold tracking-widest uppercase block mb-3">
              GET STARTED
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Ready to Prove Your Skills?
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Both players lock GVT tokens into a smart contract. The winner
              receives both stakes minus a 5% platform fee instantly
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-black font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition">
                <GiGamepad className="text-lg cursor-pointer" /> Connect & Play
              </button>
              <button className="w-full sm:w-auto border border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400 font-semibold px-6 py-3 rounded-xl transition cursor-pointer">
                Read the Docs
              </button>
            </div>

            <p className="text-xs text-slate-500">
              No account Needed, Practice free. Connect wallet to stake
            </p>
          </div>

          <hr className="border-t border-purple-900/40 mb-12" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <h3 className="text-2xl font-extrabold text-cyan-400 tracking-wider">
                OLOS
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                Web3 skill gaming, Compete, Stake and earn - your reputation
                lives on-chain
              </p>

              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs border border-slate-800 bg-slate-900/80 px-3 py-1 rounded-full text-slate-300 cursor-pointer hover:border-slate-700">
                  X
                </span>
                <span className="text-xs border border-slate-800 bg-slate-900/80 px-3 py-1 rounded-full text-slate-300 cursor-pointer hover:border-slate-700">
                  Slack
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm text-white mb-4">Games</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="hover:text-white cursor-pointer">
                  Snake Xenzia
                </li>
                <li className="hover:text-white cursor-pointer">Chess Arena</li>
                <li className="hover:text-white cursor-pointer">
                  Tetris Blitz
                </li>
                <li className="hover:text-white cursor-pointer">Bounce King</li>
                <li className="hover:text-white cursor-pointer">
                  Jumping Jack
                </li>
                <li className="hover:text-white cursor-pointer">
                  Checkers Rush
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="hover:text-white cursor-pointer">Leaderboard</li>
                <li className="hover:text-white cursor-pointer">
                  Match History
                </li>
                <li className="hover:text-white cursor-pointer">GVT Token</li>
                <li className="hover:text-white cursor-pointer">
                  Smart Contract
                </li>
                <li className="hover:text-white cursor-pointer">Security</li>
                <li className="hover:text-white cursor-pointer">API</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm text-white mb-4">Company</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="hover:text-white cursor-pointer">
                  Documentation
                </li>
                <li className="hover:text-white cursor-pointer">How It Work</li>
                <li className="hover:text-white cursor-pointer">FAQ</li>
                <li className="hover:text-white cursor-pointer">Support</li>
                <li className="hover:text-white cursor-pointer">Terms</li>
                <li className="hover:text-white cursor-pointer">Privacy</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-6 border-t border-slate-900">
            <p>© 2026 OLOS Gaming Platform. All rights reserved</p>
            <p>Powered by GVT Token · EVM Smart Contracts</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 rounded-full bg-olos-blue flex items-center justify-center text-white text-xl font-black mb-8">
        {number}
      </div>
      <h3 className="text-lg font-black mb-4 text-white uppercase tracking-wider">
        {title}
      </h3>
      <p className="text-gray-500 font-bold leading-relaxed max-w-[200px] text-center text-sm">
        {description}
      </p>
    </div>
  );
}

function GameCard({
  image,
  title,
  description,
}: {
  image: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col bg-[#0a0f1e] rounded-3xl border border-blue-500/10 overflow-hidden group hover:border-blue-500/30 transition-all hover:translate-y-[-4px]">
      <div className="aspect-[1.4] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
        />
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-black text-white mb-2">{title}</h3>
        <p className="text-gray-500 text-xs font-bold leading-relaxed mb-6 line-clamp-2 flex-1">
          {description}
        </p>
        <div className="flex gap-2">
          <button className="px-5 py-1.5 rounded-full border border-blue-500/20 text-[11px] font-black uppercase text-blue-500 hover:bg-blue-500 hover:text-white transition-all">
            Solo
          </button>
          <button className="px-5 py-1.5 rounded-full border border-blue-500/20 text-[11px] font-black uppercase text-blue-500 hover:bg-blue-500 hover:text-white transition-all">
            1v1
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[48px] md:text-[56px] font-black text-white tracking-tighter leading-none">
        {value}
      </div>
      <div className="text-[12px] font-black text-gray-500 uppercase tracking-[0.2em]">
        {label}
      </div>
    </div>
  );
}
