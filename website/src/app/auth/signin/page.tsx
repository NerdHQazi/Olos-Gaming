"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthInput from "@/components/auth/AuthInput";
import { authApi } from "@/lib/authApi";
import { extractApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
// Using useAppKit directly rather than importing your ConnectWalletButton
// component — that import's exact export style (default vs named) couldn't
// be verified against your live repo, and a wrong guess there would crash
// this whole page again. This talks to the same underlying AppKit modal
// your ConnectWalletButton uses. If you'd rather reuse that component
// directly, swap this out — just confirm its export style first.
import { useAppKit } from "@reown/appkit/react";

function MailIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
      <path d="M9.9 5.2A9.8 9.8 0 0112 5c5 0 9 4 10 7-.4 1.2-1.2 2.6-2.3 3.8M6.2 6.2C4.3 7.5 2.9 9.3 2 12c1 3 5 7 10 7 1.2 0 2.4-.2 3.5-.6" />
    </svg>
  );
}
function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09a6.6 6.6 0 010-4.19V7.07H2.18a11 11 0 000 9.87l3.66-2.85z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
function XGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 2H22l-7.6 8.7L23.3 22H16.6l-5.2-6.8L5.4 22H2.3l8.2-9.3L1.5 2h6.9l4.7 6.2L18.9 2zm-1.2 18h1.7L7.4 4H5.6l12.1 16z" />
    </svg>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { open } = useAppKit();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );

  const filled = EMAIL_RE.test(email) && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filled) return;
    setLoading(true);
    setError(false);
    try {
      const { data } = await authApi.login({ email, password });
      await login({ user: data.user, session: data.session });
      router.push("/dashboard");
    } catch (err) {
      setError(true);
      setErrorMessage(
        extractApiError(
          err,
          "Incorrect password, please enter a valid password",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  // Connecting a wallet here does NOT by itself log the person into Supabase
  // (no SIWE endpoint on your backend yet) — it only opens the wallet connect
  // modal. Full wallet-as-signin needs backend work.
  const handleConnectWallet = () => open();

  const handleOAuth = async (provider: "google" | "twitter") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <AuthPageShell>
      <div className="h-full w-full overflow-y-auto">
        <div className="min-h-full w-full max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 items-center px-4 sm:px-8 py-6">
          {/* Left: visual panel */}
          <div className="hidden lg:flex flex-col justify-center pr-10 xl:pr-16">
            <span className="inline-flex w-fit items-center px-3 py-1 rounded-md bg-[#0B1121] border border-[#22D3EE]/30 text-[#22D3EE] text-xs font-bold tracking-widest mb-4">
              OLOS
            </span>

            {/* TODO: swap this placeholder for the real hero illustration asset */}
            <div className="w-full aspect-[16/10] rounded-2xl bg-gradient-to-br from-[#7135DB]/30 via-[#0B1121] to-[#22D3EE]/20 border border-white/10 mb-5" />

            <h2 className="text-2xl xl:text-3xl font-black text-white">
              Dominate the Arena.
            </h2>
            <p className="text-sm text-gray-300 mt-2">
              Compete in skill-based games. Stake GVT. Win On-Chain.
            </p>
            <p className="text-xs text-gray-500 mt-1.5 max-w-md">
              Join the world&apos;s most competitive Web3 gaming ecosystem.
              Secure, transparent, and built for the next generation of
              operators.
            </p>

            <div className="grid grid-cols-4 gap-2 mt-5">
              {[
                ["Players Online", "12,480"],
                ["GVT Locked", "840K"],
                ["Active Games", "6"],
                ["Prize Pool", "$2.1M+"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-white/10 bg-[#0B1121] px-2.5 py-2"
                >
                  <p className="text-[9px] font-bold tracking-widest text-gray-500 uppercase leading-tight">
                    {label}
                  </p>
                  <p className="text-sm font-black text-white mt-0.5">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form panel */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B1121]/40 p-6 sm:p-8">
              <div className="mb-5">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Welcome back, Operator
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Sign in to your secure terminal
                </p>
              </div>

              <button
                type="button"
                onClick={handleConnectWallet}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#7135DB] text-black font-bold tracking-wide text-sm transition-all active:scale-[0.98] hover:opacity-90 mb-5"
              >
                CONNECT WALLET
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-bold tracking-wide text-gray-500">
                  OR CONNECT WITH
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  className="h-11 rounded-xl bg-black border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 text-sm font-bold text-white transition-all"
                >
                  <GoogleGlyph /> Google
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth("twitter")}
                  className="h-11 rounded-xl bg-black border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 text-sm font-bold text-white transition-all"
                >
                  <XGlyph /> X / Twitter
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="text-xs font-bold tracking-wide text-gray-400 block mb-1.5"
                  >
                    IDENTITY TERMINAL
                  </label>
                  <AuthInput
                    id="email"
                    type="email"
                    name="email"
                    placeholder="email@protocol.xyz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<MailIcon />}
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="text-xs font-bold tracking-wide text-gray-400 block mb-1.5"
                  >
                    SECURITY KEY
                  </label>
                  <AuthInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(false);
                    }}
                    leftIcon={<LockIcon />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label="Toggle password visibility"
                      >
                        <EyeOffIcon />
                      </button>
                    }
                    invalid={error}
                    errorMessage={errorMessage}
                    autoComplete="current-password"
                  />
                </div>

                <div className="text-right">
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-[#7135DB] font-semibold"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={!filled || loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#7135DB] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold tracking-wide text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    "INITIALIZE LOGIN"
                  )}
                </button>

                <p className="text-center text-sm text-gray-400">
                  New Player?{" "}
                  <Link
                    href="/auth/signup"
                    className="text-[#22D3EE] font-semibold"
                  >
                    Create Account
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthPageShell>
  );
}
