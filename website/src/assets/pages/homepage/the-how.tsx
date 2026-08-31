import { GiWallet } from "react-icons/gi";
import { GiGamepad } from "react-icons/gi";
import { LuHexagon } from "react-icons/lu";

export default function HowtoPage() {
  return (
    <>
      <div className="flex flex-col items-center justify-center mt-40">
        <div className="text-[#169EFA] font-extrabold">HOW IT WORKS</div>
        <div className="text-white font-extrabold text-3xl">
          Four Steps to Earning
        </div>
      </div>
      <div className="mt-20">
        <div className="flex">
          <div className="ml-15 border-[#169EFA] border-1 w-60 rounded-[12px] px-5 py-3">
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
          <div className="ml-15 border-[#169EFA] border-1 w-60 rounded-[12px] px-5 py-3">
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

          <div className="ml-15 border-[#169EFA] border-1 w-60 rounded-[12px] px-5 py-3">
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
          <div className="ml-15 border-[#169EFA] border-1 w-60 rounded-[12px] px-5 py-3">
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
      </div>
    </>
  );
}
