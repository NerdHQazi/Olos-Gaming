"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Gamepad2,
  Store,
  LayoutDashboard,
  Menu,
  Trophy,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { RiCoinsFill } from "react-icons/ri";
import { FaEthereum } from "react-icons/fa";

type DashboardLayoutProps = {
  children: ReactNode;
};

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Game",
    href: "/dashboard/game",
    icon: Gamepad2,
    active: true,
  },
  {
    label: "Leaderboard",
    href: "/dashboard/leaderboard",
    icon: Trophy,
    color: "gold",
  },
  {
    label: "Tournaments",
    href: "/dashboard/tournaments",
    icon: Trophy,
    color: "gold",
  },
  {
    label: "Token",
    href: "/dashboard/token",
    icon: RiCoinsFill,
  },
  {
    label: "Wallet",
    href: "/dashboard/wallet",
    icon: Wallet,
  },
  {
    label: "Marketplace",
    href: "/dashboard/marketplace",
    icon: Store,
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: UserRound,
  },
  {
    label: "How it works",
    href: "/how-it-works",
    icon: CircleHelp,
    color: "red",
  },
  {
    label: "Support",
    href: "/support",
    icon: CircleHelp,
  },
];

const truncateWalletAddress = (
  address: string,
  startLength = 6,
  endLength = 4,
): string => {
  if (!address) return "";

  if (address.length <= startLength + endLength) {
    return address;
  }

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ethAddress, setEthAddress] = useState("");
  const router = useRouter();

  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const address = localStorage.getItem("eth_address");
      if (address) {
        setEthAddress(address);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#03060d] text-white">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-[#18203b] bg-[#080d1c] transition-transform duration-300 lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-[68px] items-center justify-between border-b border-[#151d35] px-5">
            <a href="/dashboard" className="flex items-center gap-2">
              <div className="relative">
                {/* <div className="text-[20px] font-black tracking-tight text-[#20ceee]">
                  OLOS
                </div>
                <div className="absolute -right-7 -top-1 rounded border border-[#33405e] px-1 py-[1px] text-[6px] font-bold text-[#7783a5]">
                  BETA
                </div> */}
                <Image
                  src="/OLOS_logo.svg"
                  alt="Olos Logo"
                  width={120}
                  height={120}
                  className="w-auto"
                />
              </div>
            </a>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-1 text-[#71809f] hover:bg-[#121a30] hover:text-white lg:hidden"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto px-3 py-5">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex h-9 items-center gap-3 rounded-[12px] px-3 text-[14px] font-medium transition ${
                      pathname.toLowerCase() === item.href.toLowerCase()
                        ? "bg-[#341266] text-white shadow-[inset_0_0_0_1px_rgba(112,52,215,0.35)] border border-[#7135DB]"
                        : "text-[#A4B7EB] hover:bg-[#11182c] hover:text-white"
                    }`}
                  >
                    <Icon
                      style={{
                        color: item?.color || "#fff",
                      }}
                      size={18}
                      strokeWidth={item.active ? 2.5 : 1.8}
                      className="group-hover:text-[#20ceee]"
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-8">
              <div className="rounded-lg border-[2px] border-[#2A1060] bg-[#1A0A3C33] p-3">
                <div className="mb-1 text-[14px] font-black text-white">
                  Invite & Earn
                </div>
                <p className="text-[11px] font-medium leading-3 text-[#A4B7EB]">
                  Earn GVT rewards together
                </p>

                <Image
                  src="/invite.png"
                  alt="invite"
                  width={1000}
                  height={1000}
                  quality={100}
                  className="w-full h-[70px] my-4 rounded-[6px]"
                />

                <button
                  type="button"
                  className="flex h-[27px] w-full items-center justify-center rounded-[8px] bg-[#7135DB] text-[12px] font-bold text-white transition hover:bg-[#8449e8]"
                >
                  GET LINK
                </button>
              </div>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 h-[68px] border-b border-[#151d35] bg-[#060a14]/95 backdrop-blur">
            <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-lg border border-[#202945] bg-[#0c1323] p-2 text-[#8793af] hover:text-white lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu size={18} />
                </button>

                <h1 className="truncate text-sm font-bold text-white sm:text-[24px]">
                  Match Results
                </h1>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  className="hidden items-center gap-2 rounded-md rounded-[8px] bg-[#1A0A3C33] border border-[#2A1060] px-3 text-[14px] font-medium text-[#fff] sm:flex"
                >
                  <FaEthereum />
                  Ethereum
                  <ChevronDown size={16} color="#fff" />
                </button>

                <Link
                  href="/wallet"
                  className="hidden rounded-[8px] border border-[#2A1060] bg-[#1A0A3C] px-3 py-1 sm:block"
                >
                  <div className="text-[11px] font-medium text-[#A4B7EB]">
                    GVT Balance
                  </div>
                  <div className="text-[16px] font-bold text-[#4CD7F6]">
                    2,480 GVT
                    <span className="ml-1 text-[11px] font-normal text-[#A4B7EB]">
                      $24.80
                    </span>
                  </div>
                </Link>

                <button
                  onClick={() => {
                    if (!ethAddress) {
                      router.push("/connect");
                    }
                  }}
                  type="button"
                  className="flex h-8 items-center gap-2 rounded-md border border-[#2A1060] bg-[#1A0A3C1A] px-2 sm:px-3"
                >
                  <span className="h-4 w-4 rounded-full bg-gradient-to-br from-[#f7b267] via-[#d35b4e] to-[#253b80]" />
                  <span className="hidden text-[14px] font-semibold text-[#c1c9db] sm:block">
                    {ethAddress
                      ? truncateWalletAddress(ethAddress)
                      : "Connect Wallet"}
                  </span>
                  {ethAddress && (
                    <ChevronDown size={16} className="text-[#fff]" />
                  )}
                </button>

                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-[#2A1060] bg-[#1A0A3C33] text-[#f7c843] hover:bg-[#131c31]"
                  aria-label="Rewards"
                >
                  <Bell size={16} />
                </button>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 bg-[#03060d] overflow-y-auto">
            <div className="mx-auto w-full max-w-300">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
