"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
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
  Club,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { RiCoinsFill } from "react-icons/ri";
import { FaEthereum } from "react-icons/fa";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { useAppKitAccount } from "@reown/appkit/react";
import { ethers } from "ethers";
import { useWallet } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

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
    href: "/dashboard/games",
    icon: Gamepad2,
    active: true,
  },
  {
    label: "Guild Hub",
    href: "/dashboard/guild-hub",
    icon: Club,
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
    label: "NFTs",
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

const GVT_ADDRESS = "0xDE0Bd309CbCaf5E6fBc7e05660E7BCb83520C3fC";
const GVT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFetchingChain, setIsFetchingChain] = useState(false);
  const router = useRouter();
  const { isConnected, address } = useAppKitAccount();
  const [onChainBalance, setOnChainBalance] = useState<string | null>(null);
  const pathname = usePathname();
  const { balance: web2Balance, isLoading: walletLoading } = useWallet();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      if (logout) logout();
      localStorage.clear();
      router.push("/auth/signin");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/");
    }
  };

  const getProvider = useCallback(() => {
    if (typeof window === "undefined") return null;
    const eth = (window as any).ethereum;
    if (!eth) return null;
    return new ethers.BrowserProvider(eth);
  }, []);

  const fetchOnChainBalance = useCallback(async () => {
    if (!isConnected || !address) return;
    const provider = getProvider();
    if (!provider) return;
    setIsFetchingChain(true);
    try {
      const gvt = new ethers.Contract(GVT_ADDRESS, GVT_ABI, provider);
      const raw = await gvt.balanceOf(address);
      setOnChainBalance(
        parseFloat(ethers.formatEther(raw)).toLocaleString("en-US", {
          maximumFractionDigits: 2,
        }),
      );
    } catch (e) {
      console.error("[Wallet] balance fetch failed:", e);
      setOnChainBalance(null);
    } finally {
      setIsFetchingChain(false);
    }
  }, [isConnected, address, getProvider]);

  useEffect(() => {
    if (isConnected && address) {
      fetchOnChainBalance();
    } else if (!isConnected) {
      setOnChainBalance(null);
    }
  }, [isConnected, address, fetchOnChainBalance]);

  const rawBalance = isConnected
    ? onChainBalance?.replace(/,/g, "") || "0"
    : String(web2Balance);
  const displayBalance = isConnected
    ? onChainBalance !== null
      ? `${onChainBalance} GVT`
      : "— GVT"
    : `${web2Balance.toLocaleString()} GVT`;
  const displayUSD = `≈ $${(parseFloat(rawBalance) * 0.25).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  const isLoadingBal = isConnected ? isFetchingChain : walletLoading;

  const isActive = (pathname: string, href: string) => {
    const current = pathname.toLowerCase();
    const target = href.toLowerCase();

    // Root links like "/" or "/dashboard" shouldn't match everything
    if (target === "/") return current === "/";

    return current === target || current.startsWith(`${target}/`);
  };

  return (
    <div className="max-h-screen bg-[#03060d] text-white overflow-hidden">
      <div className="flex">
        <aside
          className={`fixed h-full overflow-auto inset-y-0 left-0 z-50 flex w-55 flex-col border-r border-[#18203b] bg-[#080d1c] transition-transform duration-300 lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-17 items-center justify-between border-b border-[#151d35] px-5">
            <a href="/dashboard" className="flex items-center gap-2">
              <div className="relative">
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

          <div className="flex flex-1 flex-col overflow-y-auto px-3 py-5 justify-between">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const activeHref = navigation
                  .map((item) => item.href)
                  .filter((href) => isActive(pathname, href))
                  .sort((a, b) => b.length - a.length)[0];
                const active = item.href === activeHref;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex h-9 items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition ${
                      active
                        ? "bg-[#341266] text-white shadow-[inset_0_0_0_1px_rgba(112,52,215,0.35)] border border-[#7135DB]"
                        : "text-[#A4B7EB] hover:bg-[#11182c] hover:text-white"
                    }`}
                  >
                    <Icon
                      style={{ color: item?.color || "#fff" }}
                      size={18}
                      strokeWidth={item.active ? 2.5 : 1.8}
                      className="group-hover:text-[#20ceee]"
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Actions Area */}
            <div className="pt-6 space-y-4">
              <div className="rounded-lg border-2 border-[#2A1060] bg-[#1A0A3C33] p-3">
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
                  className="w-full h-17.5 my-4 rounded-md"
                />

                <button
                  type="button"
                  className="flex h-6.75 w-full items-center justify-center rounded-lg bg-[#7135DB] text-[12px] font-bold text-white transition hover:bg-[#8449e8]"
                >
                  GET LINK
                </button>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="group flex w-full h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-all active:scale-95"
              >
                <LogOut size={18} className="text-red-400 group-hover:rotate-12 transition-transform" />
                <span>Log Out</span>
              </button>
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
          <header className="sticky top-0 z-30 h-17 border-b border-[#151d35] bg-[#060a14]/95 backdrop-blur">
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
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  className="hidden items-center gap-2 rounded-md bg-[#1A0A3C33] border border-[#2A1060] px-3 text-[14px] font-medium text-white sm:flex"
                >
                  <FaEthereum />
                  Ethereum
                  <ChevronDown size={16} color="#fff" />
                </button>

                <Link
                  href="/dashboard/wallet"
                  className="hidden rounded-lg border border-[#2A1060] bg-[#1A0A3C] px-3 py-1 sm:block"
                >
                  <div className="text-[11px] font-medium text-[#A4B7EB]">
                    GVT Balance
                  </div>
                  {!isLoadingBal && (
                    <div className="text-[16px] font-bold text-[#4CD7F6]">
                      {displayBalance}
                      <span className="ml-1 text-[11px] font-normal text-[#A4B7EB]">
                        {displayUSD}
                      </span>
                    </div>
                  )}
                </Link>

                <ConnectWalletButton variant="navbar" />

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

          <main className="min-w-0 max-h-screen pb-20 flex-1 bg-[#03060d] overflow-auto">
            <div className="mx-auto w-full max-w-300">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}