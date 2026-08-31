import { GiGamepad } from "react-icons/gi";
import { ConnectWalletModal } from "./stake";
import { useState } from "react";

export default function GetStarted() {
  const [isMODALOpen, setIsModalOpen] = useState(false);
  return (
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
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-black font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition"
            >
              <GiGamepad className="text-lg" /> Connect & Play
            </button>
            <button className="w-full sm:w-auto border border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400 font-semibold px-6 py-3 rounded-xl transition">
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
              Web3 skill gaming, Compete, Stake and earn - your reputation lives
              on-chain
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
              <li className="hover:text-white cursor-pointer">Snake Xenzia</li>
              <li className="hover:text-white cursor-pointer">Chess Arena</li>
              <li className="hover:text-white cursor-pointer">Tetris Blitz</li>
              <li className="hover:text-white cursor-pointer">Bounce King</li>
              <li className="hover:text-white cursor-pointer">Jumping Jack</li>
              <li className="hover:text-white cursor-pointer">Checkers Rush</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="hover:text-white cursor-pointer">Leaderboard</li>
              <li className="hover:text-white cursor-pointer">Match History</li>
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
              <li className="hover:text-white cursor-pointer">Documentation</li>
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
      {isMODALOpen && (
        <ConnectWalletModal
          onClose={() => {
            setIsModalOpen(false);
          }}
        />
      )}
    </footer>
  );
}
