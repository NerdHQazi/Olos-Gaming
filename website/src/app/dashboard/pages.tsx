'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { WalletDashboardBadge } from '@/components/WalletDashboardBadge';

export default function DashboardPage() {
  const [hydrated, setHydrated] = useState(false);
  const { user, isLoggedIn, isLoading } = useAuth();
  const { balance, isLoading: walletLoading } = useWallet();

  useEffect(() => {
    setHydrated(true);
  }, []);

  const showAuthedState = hydrated && isLoggedIn;
  const showWalletBalance = hydrated && !walletLoading;
  const statusLabel = !hydrated || isLoading ? 'Loading' : isLoggedIn ? 'Authenticated' : 'Signed out';

  return (
    <div className="min-h-screen bg-[#070E1A] text-white">
      <Navbar />

      <main className="pt-28 pb-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#0B1121] p-6 md:p-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-500">Dashboard</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
                {showAuthedState ? `Welcome back, ${user?.username || user?.email?.split('@')[0] || 'Player'}` : 'Your OLOS dashboard'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">
                Review your wallet balance, jump into staking, and continue managing your OLOS account from one place.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">Platform Balance</p>
                <p className="mt-3 text-3xl font-black text-white">
                  {showWalletBalance ? `${balance.toLocaleString()} GVT` : '...'}
                </p>
                <p className="mt-2 text-xs text-gray-400">Live value from your Supabase wallet record.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">Profile</p>
                <p className="mt-3 text-lg font-black text-white">{showAuthedState ? user?.fullName || user?.email || 'Guest' : 'Guest'}</p>
                <p className="mt-2 text-xs text-gray-400">Username: {showAuthedState ? user?.username || 'Not set' : 'Not set'}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">Status</p>
                <p className="mt-3 text-lg font-black text-white">{statusLabel}</p>
                <p className="mt-2 text-xs text-gray-400">Use the quick links below to continue navigating.</p>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-white/10 bg-[#0B1121] p-6 md:p-8">
              <h2 className="text-xl font-black text-white">Quick Actions</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link href="/profile" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-gray-200 transition-colors hover:border-white/20 hover:text-white">
                  Open Profile
                </Link>
                <Link href="/wallet" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-gray-200 transition-colors hover:border-white/20 hover:text-white">
                  View Wallet
                </Link>
                <Link href="/stake" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-gray-200 transition-colors hover:border-white/20 hover:text-white">
                  Stake GVT
                </Link>
                <Link href="/games" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-gray-200 transition-colors hover:border-white/20 hover:text-white">
                  Browse Games
                </Link>
              </div>
            </div>

            <div className="min-h-[320px]">
              {hydrated ? <WalletDashboardBadge /> : <div className="h-full rounded-3xl border border-white/10 bg-[#0B1121] p-6 md:p-8" />}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}