import { ArrowRight, Loader } from "lucide-react";
import Link from "next/link";

const walletOptions = [
  {
    name: "MetaMask",
    description: "Connect via browser extension",
    icon: "🦊",
  },
  {
    name: "WalletConnect",
    description: "Mobile apps and multi-chain support",
    icon: "🌐",
  },
  {
    name: "Embedded Wallet",
    description: "Continue with email or socials",
    icon: "👻",
  },
];

export default function WalleConnections({
  isPending,
  handleWalletClick,
  isReady,
}: {
  isReady: boolean;
  isPending: boolean;
  handleWalletClick: (e: string) => void;
}) {
  return (
    <section className="flex flex-col justify-center">
      <div className="space-y-3">
        {walletOptions.map((wallet) => (
          <button
            key={wallet.name}
            type="button"
            disabled={
              wallet.name === "WalletConnect" && (!isReady || isPending)
            }
            onClick={() => handleWalletClick(wallet.name)}
            className="group flex w-full items-center rounded-lg border border-[#171c28] bg-[#10141e] px-3 py-3 text-left transition-all duration-200 hover:border-[#292f43] hover:bg-[#141925] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[#252b3a] bg-[#0a0e16] text-2xl">
              {wallet.icon}
            </div>

            <div className="ml-3 flex-1">
              <p className="text-[18px] font-semibold text-white">
                {wallet.name}
              </p>

              <p className="mt-0.5 text-[14px] font-normal text-[#A4B7EB]">
                {wallet.description}
              </p>
            </div>

            {wallet.name === "WalletConnect" && isPending ? (
              <Loader className="h-4 w-4 animate-spin text-[#20CEEE]" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5 text-[#a1a9bd] transition-transform group-hover:translate-x-0.5" />
            )}
          </button>
        ))}
      </div>

      <div className="relative my-5 flex items-center justify-center">
        <div className="absolute h-px w-full bg-[#171c28]" />

        <span className="relative bg-[#05080f] px-4 text-[14px] font-normal uppercase text-[#A4B7EB]">
          OR
        </span>
      </div>

      <button
        type="button"
        className="relative w-full rounded-lg border border-dashed border-[#7034D780] bg-[#080c15] px-4 py-4 text-center transition-colors hover:bg-[#0c101c]"
      >
        <p className="pt-2 text-[12px] font-medium uppercase tracking-[0.1em] text-[#A4B7EB]">
          New User?
        </p>

        <p className="mt-1 text-[18px] font-semibold text-white">
          Create Your Wallet
        </p>

        <p className="mt-1 text-[13px] font-normal text-[#A4B7EB]">
          Create a secure wallet to start playing, staking GVT, and earning
          on-chain rewards.
        </p>
      </button>

      <p className="mt-4 text-center text-[12px] leading-relaxed text-[#6B7280]">
        By connecting a wallet, you agree to the OLOS{" "}
        <Link href="#" className="text-[#20CEEE] underline">
          Terms of Service
        </Link>{" "}
        and acknowledge our{" "}
        <Link href="#" className="text-[#20CEEE] underline">
          Security Architecture
        </Link>
        .
      </p>
    </section>
  );
}
