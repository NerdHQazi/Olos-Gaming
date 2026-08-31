import { useState } from "react";
import {
  HiChevronRight,
  HiShieldCheck,
  HiOutlineGlobeAlt,
  HiXMark,
} from "react-icons/hi2";
import { SiWalletconnect, SiCoinbase } from "react-icons/si";

const wallets = [
  {
    id: "walletconnect",
    name: "Walletconnect",
    icon: <SiWalletconnect className="text-blue-500 text-xl" />,
  },
  {
    id: "coinbase",
    name: "Coinbase wallet",
    icon: <SiCoinbase className="text-blue-400 text-xl" />,
  },
  {
    id: "okx",
    name: "OKX",
    icon: (
      <span className="text-white text-xs font-black bg-black border border-slate-700 px-1.5 py-0.5 rounded">
        OKX
      </span>
    ),
  },
  {
    id: "phantom",
    name: "Phantom",
    icon: <HiOutlineGlobeAlt className="text-purple-400 text-xl" />,
  },
];

export function ConnectWalletModal({ onClose }: { onClose: () => void }) {
  const [selectedWallet, setSelectedWallet] = useState<string>("walletconnect");
  const [agreed, setAgreed] = useState<boolean>(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="w-full max-w-md bg-[#090a16] border border-purple-600/60 rounded-3xl p-8 shadow-[0_0_50px_rgba(147,51,234,0.15)] flex flex-col items-center text-white relative z-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <HiXMark className="text-2xl" />
        </button>
        <div className="w-16 h-16 mb-4 flex items-center justify-center relative">
          <div className="absolute inset-0 border-2 border-purple-500/80 rounded-2xl rotate-45 transform"></div>
          <span className="text-purple-400 text-2xl font-bold z-10">⬡</span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-1 text-center">
          Connect Your Wallet
        </h2>
        <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">
          Choose a wallet to continue <br /> and start playing on OLOS.
        </p>

        <div className="w-full space-y-3 mb-6">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              type="button"
              onClick={() => setSelectedWallet(wallet.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                selectedWallet === wallet.id
                  ? "border-purple-500 bg-purple-950/20 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  : "border-slate-800/80 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50"
              }`}
            >
              <div className="flex items-center gap-3">
                {wallet.icon}
                <span className="text-sm font-medium">{wallet.name}</span>
              </div>
              <HiChevronRight className="text-slate-500 text-lg" />
            </button>
          ))}
        </div>

        <div className="w-full flex items-center gap-4 mb-6">
          <div className="h-[1px] bg-slate-800/80 flex-1"></div>
          <span className="text-xs text-slate-400 font-medium">Or</span>
          <div className="h-[1px] bg-slate-800/80 flex-1"></div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <input
            type="checkbox"
            id="terms"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 accent-cyan-500 cursor-pointer"
          />
          <label
            htmlFor="terms"
            className="text-[11px] text-slate-300 cursor-pointer select-none"
          >
            I agree to the{" "}
            <a href="#terms" className="text-orange-500 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#privacy" className="text-orange-500 hover:underline">
              Privacy Policy
            </a>
            .
          </label>
        </div>

        <button
          type="button"
          disabled={!agreed}
          onClick={() => {
            alert(`Connecting to ${selectedWallet}`);
            onClose();
          }}
          className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
            agreed
              ? "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
              : "bg-cyan-900/40 text-cyan-700 cursor-not-allowed border border-cyan-800/30"
          }`}
        >
          <span>👛</span> Connect Wallet
        </button>

        <div className="mt-6 flex items-center gap-1.5 text-[11px] text-slate-400">
          <HiShieldCheck className="text-amber-500 text-sm" />
          <span>Your asset are always safe with</span>
          <span className="text-cyan-400 font-bold">OLOS</span>
        </div>
      </div>
    </div>
  );
}

export default function StakeToken() {
  const [stake, setStake] = useState<number>(25);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const options = [10, 25, 50, 100, 250];

  const fee = stake * 0.05;
  const reward = stake * 2 - fee;

  return (
    <>
      <div className="mt-10 max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-white">
        <div className="bg-[#0b0e17] border border-orange-500/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-orange-500 text-lg">⬡</span>
              <h3 className="text-xl font-bold">Stake Calculation</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              See your potential reward before you play
            </p>

            <label className="text-xs text-slate-300 font-medium block mb-2">
              Quick Select (GVT)
            </label>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {options.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setStake(val)}
                  className={`py-2 text-sm rounded-lg border font-semibold transition ${
                    stake === val
                      ? "border-orange-500 bg-orange-500/10 text-orange-400"
                      : "border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>

            <label className="text-xs text-slate-300 font-medium block mb-2">
              Custom Amount
            </label>
            <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 mb-6">
              <span className="text-orange-500">⬡</span>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value) || 0)}
                className="bg-transparent outline-none w-full text-white text-sm font-semibold"
              />
            </div>

            <div className="border-t border-slate-800/80 pt-4 space-y-3 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Your stake</span>
                <span className="font-bold text-white">{stake} GVT</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Platform fee(5%)</span>
                <span className="font-bold text-white">
                  {fee.toFixed(2)} GVT
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                <span className="text-slate-300">You win if victorious</span>
                <span className="font-bold text-emerald-400 text-base">
                  {reward.toFixed(1)} GVT
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-8 w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>⬡</span> Play Now
          </button>
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-orange-500 text-xs font-bold tracking-widest uppercase mb-2">
            TOKEN ECONOMIC
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold mb-1">
            Stake GVT.
          </h2>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-orange-500 mb-4">
            Winner Takes All
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Both players lock GVT tokens into a smart contract. The winner
            receives both stakes minus a 5% platform fee instantly.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="text-orange-500 text-lg mt-1">🔒</div>
              <div>
                <h4 className="font-bold text-white text-base">
                  Escrow Protected
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-snug">
                  Smart contract holds stakes—no one can cheat or withdraw
                  mid-match
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="text-orange-500 text-lg mt-1">⚡</div>
              <div>
                <h4 className="font-bold text-white text-base">
                  Instant Payout
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-snug">
                  Rewards sent to winner wallet the moment match result is
                  submitted
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="text-cyan-400 text-lg mt-1">🛡️</div>
              <div>
                <h4 className="font-bold text-white text-base">Anti-Cheat</h4>
                <p className="text-xs text-slate-400 mt-1 leading-snug">
                  Score range validation, time checks, and device fingerprint on
                  every match
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ConnectWalletModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
