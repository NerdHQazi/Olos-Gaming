import { ArrowRight, Check, Copy, Loader, X } from "lucide-react";
import Link from "next/link";

export default function ConnectionStates({
  connectionState,
  connectedWallet,
  resetConnection,
  shortenAddress,
  copyAddress,
  copied,
  errorMessage,
  connectMetaMask,
  connectWalletConnect,
  walletAddress,
}: {
  connectionState: string;
  connectedWallet: string;
  resetConnection: () => void;
  shortenAddress: (e: string) => string;
  copyAddress: () => void;
  copied: boolean;
  errorMessage: string;
  connectMetaMask: () => void;
  connectWalletConnect: () => void;
  walletAddress: string;
}) {
  return (
    <>
      {connectionState === "connecting" && connectedWallet === "MetaMask" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02050b]/90 px-5 backdrop-blur-[3px]">
          <div
            style={{
              boxShadow: "0px 12px 32px 2px #7034D7",
            }}
            className="relative w-full max-w-[450px] rounded-[24px] border-[3px] border-[#906CDB] bg-[#11151f] p-8"
          >
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-[2px] border-[#7034D7] bg-[#171125] text-3xl shadow-[0_0_30px_rgba(145,60,255,0.2)]">
                🦊
              </div>

              <h2 className="mt-5 text-[24px] font-bold text-white">
                MetaMask
              </h2>

              <p className="mt-1 max-w-[300px] text-[14px] font-normal leading-relaxed text-[#A4B7EB]">
                Approve the connection request in MetaMask.
              </p>

              <div className="my-7 flex items-center justify-center">
                <Loader color="#20CEEE" className="animate-spin" size={28} />
              </div>

              <div className="rounded-[8px] border border-[#20CEEE4D] bg-[#07151c] px-3 py-1.5 text-[13px] font-normal text-[#20CEEE]">
                WAITING FOR WALLET CONNECTION...
              </div>

              <button
                type="button"
                onClick={resetConnection}
                className="mt-5 text-[14px] font-semibold text-[#7034D7] underline underline-offset-2"
              >
                Cancel Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {connectionState === "success" && walletAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02050b]/90 px-5 backdrop-blur-[3px]">
          <div className="relative w-full max-w-[450px] overflow-visible">
            <div className="relative overflow-hidden rounded-xl border border-[#303745] bg-[#11151f] p-5 shadow-[0_0_45px_rgba(81,54,255,0.15)]">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0a2730] shadow-[0_0_25px_rgba(32,206,238,0.45)]">
                  <Check className="h-6 w-6 text-[#20CEEE]" />
                </div>

                <h2 className="mt-3 text-[24px] font-bold text-[#C0C1FF]">
                  Wallet Connected
                </h2>

                <div className="mt-1 flex items-center gap-2 rounded-[12px] border border-[#20CEEE4D] bg-[#062229] px-2 py-0.5 text-[11px] font-bold text-[#20CEEE]">
                  <div className="h-[8px] w-[8px] rounded-full bg-[#20CEEE] shadow-[0_0_8px_#20CEEE]" />
                  Connection Successful
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[12px] font-normal uppercase text-[#A4B7EB]">
                  Connected Identity
                </p>

                <div className="flex items-center gap-3 rounded-[8px] bg-[#0D0D15] px-3 py-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#FFFFFF1A] bg-[#111722] text-2xl">
                    {connectedWallet === "MetaMask" ? "🦊" : "🌐"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-bold text-white">
                      {shortenAddress(walletAddress)}
                    </p>

                    <p className="text-[13px] font-normal text-[#A4B7EB]">
                      Sepolia Network
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={copyAddress}
                    className="text-[#78839b] transition-colors hover:text-white"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-[#20CEEE]" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-[8px] border border-[#FFB78333] bg-[#D977211A] px-3 py-3">
                <div className="flex items-start gap-2">
                  <div className="text-[#FFB783]">ⓘ</div>

                  <div>
                    <p className="text-[14px] font-bold text-[#FFB783]">
                      Backup Reminder
                    </p>

                    <p className="mt-1 text-[13px] font-normal leading-relaxed text-[#A4B7EB]">
                      Your connection setup is active. Ensure your seed /
                      recovery phrase is securely configured offline. OLOS
                      protocol cannot recover lost wallet accounts.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="mt-5 flex h-[53px] w-full items-center justify-center gap-2 rounded-[6px] bg-[#C0C1FF] text-[16px] font-bold text-[#1000A9] transition-colors hover:bg-[#d0cfff]"
              >
                Continue to Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] font-normal uppercase text-[#A4B7EB]">
                  Latency
                </p>

                <p className="text-[14px] font-bold text-[#20CEEE]">12ms</p>
              </div>

              <div>
                <p className="text-[10px] font-normal uppercase text-[#A4B7EB]">
                  Region
                </p>

                <p className="text-[14px] font-bold text-[#20CEEE]">
                  US-EAST-1
                </p>
              </div>

              <div>
                <p className="text-[10px] font-normal uppercase text-[#A4B7EB]">
                  Uptime
                </p>

                <p className="text-[14px] font-bold text-[#20CEEE]">99.99%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {connectionState === "error" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02050b]/90 px-5 backdrop-blur-[3px]">
          <div className="relative w-full max-w-[450px] rounded-xl border border-[#3a2730] bg-[#11151f] p-7 shadow-[0_0_45px_rgba(255,60,90,0.12)]">
            <button
              type="button"
              onClick={resetConnection}
              className="absolute right-4 top-4 text-[#65708b] transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#ef476f]/40 bg-[#28131c] text-[#ef476f]">
                <X className="h-6 w-6" />
              </div>

              <h2 className="mt-4 text-[24px] font-bold text-white">
                Connection Failed
              </h2>

              <p className="mt-2 max-w-[330px] text-[14px] leading-relaxed text-[#8994b1]">
                {errorMessage}
              </p>

              <button
                type="button"
                onClick={() => {
                  if (connectedWallet === "MetaMask") {
                    void connectMetaMask();
                  } else {
                    void connectWalletConnect();
                  }
                }}
                className="mt-6 flex h-[53px] w-full items-center justify-center rounded bg-[#c0bfff] text-[14px] font-bold text-[#17145a] transition-colors hover:bg-[#d0cfff]"
              >
                Try Again
              </button>

              <button
                type="button"
                onClick={resetConnection}
                className="mt-4 text-[12px] text-[#8994b1] underline underline-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
