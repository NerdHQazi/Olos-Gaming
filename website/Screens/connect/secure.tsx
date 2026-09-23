import { LockKeyhole, Wallet, Zap } from "lucide-react";

const benefits = [
  {
    title: "Secure Wallet Connection",
    description: "Gas-efficient transaction management",
    icon: LockKeyhole,
  },
  {
    title: "Your Assets Stay in Your Wallet",
    description: "Military-grade standard encryption",
    icon: Wallet,
  },
  {
    title: "Fast & Low-cost Transactions.",
    description: "Play instantly with low gas fees and seamless signing.",
    icon: Zap,
  },
];

export default function Secure() {
  return (
    <section className="flex flex-col justify-center">
      <div className="mb-5">
        <p className="text-[16px] font-bold uppercase tracking-[0.12em] text-[#C0C1FF]">
          Secure Wallet Integration
        </p>

        <h1 className="mt-3 max-w-[440px] text-[28px] font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-[40px]">
          Connect your wallet to start playing.
        </h1>

        <p className="mt-3 max-w-[430px] text-[16px] leading-[1.65] text-[#A4B7EB]">
          Connect your wallet securely to access OLOS games, stake GVT, and earn
          on-chain rewards.
        </p>
      </div>

      <div className="space-y-3">
        {benefits.map((benefit) => {
          const Icon = benefit.icon;

          return (
            <div key={benefit.title} className="flex items-center gap-3">
              <div className="mt-1 flex h-2 w-2 shrink-0 items-center justify-center rounded-full bg-[#20d9ff] shadow-[0_0_9px_#20d9ff]">
                <div className="h-1 w-1 rounded-full bg-white" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <Icon className="hidden h-3 w-3 text-[#6975e8] sm:block" />

                  <p className="text-sm font-bold text-[#20CEEE]">
                    {benefit.title}
                  </p>
                </div>

                <p className="text-[13px] font-normal text-[#A4B7EB]">
                  {benefit.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative mt-6 max-w-[430px] rounded-[12px] border border-[#20CEEE4D] bg-[#0a101a] px-4 py-3">
        <div className="absolute right-3 top-3 rounded-full border border-[#14586b] bg-[#0a1b23] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#20CEEE]">
          Operational
        </div>

        <p className="text-[11px] font-normal text-[#20CEEE]">
          Platform Status
        </p>

        <div className="mt-2 space-y-1 text-[12px] text-[#A4B7EB]">
          <p>Network Status: Online</p>
          <p>Average Response: 14ms</p>
          <p>Players Online: 12,480</p>
        </div>
      </div>
    </section>
  );
}
