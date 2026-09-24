'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * DELETE src/app/auth/callback/route.ts when adding this file — Next.js can't
 * have both a route.ts and a page.tsx in the same folder, and this replaces it.
 *
 * Why: the old route.ts ran `exchangeCodeForSession` in a server route handler,
 * using a throwaway Supabase client with no cookies/localStorage available in
 * that context. The exchange succeeded, but the resulting session had nowhere
 * to go — the browser never received it, so the "successful" redirect actually
 * landed the person on '/' fully logged out. Doing the exchange here instead,
 * client-side, uses your real persisted browser client (src/lib/supabase.ts,
 * persistSession: true), so the session actually sticks — and AuthContext's
 * global onAuthStateChange listener picks up the resulting SIGNED_IN event
 * automatically, same as everywhere else in the app.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const oauthError = params.get('error');
      const oauthErrorDescription = params.get('error_description');

      if (oauthError) {
        console.error('[Auth Callback] Provider error:', oauthError, oauthErrorDescription);
        router.replace('/auth/signin?error=oauth_failed');
        return;
      }

      if (!code) {
        // detectSessionInUrl: true on the shared client also auto-handles a
        // #access_token=... hash fragment if that's what shows up instead —
        // nothing extra to do here for that case, just wait for it.
        setTimeout(() => {
          if (!window.location.hash.includes('access_token')) {
            router.replace('/auth/signin?error=oauth_failed');
          }
        }, 1500);
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error('[Auth Callback] Code exchange failed:', exchangeError.message);
        setError(exchangeError.message);
        setTimeout(() => router.replace('/auth/signin?error=oauth_failed'), 1500);
        return;
      }

      router.replace('/wallet');
    };

    run();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050810] text-white flex flex-col items-center justify-center gap-4">
      <span className="w-8 h-8 border-[3px] border-[#22D3EE]/30 border-t-[#22D3EE] rounded-full animate-spin" />
      <p className="text-sm text-gray-400">
        {error ? `Sign-in failed: ${error}` : 'Finishing sign-in...'}
      </p>
    </div>
  );
}
