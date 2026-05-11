import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  console.log('[OAuth Callback] Incoming request:', {
    url: request.url,
    hasCode: !!code,
    error,
    error_description
  });

  // If provider returned an error
  if (error) {
    console.error('[OAuth Callback] Provider error:', error, error_description);
    return NextResponse.redirect(`${origin}/auth?error=oauth_failed`);
  }

  if (code) {
    // Create a Supabase client scoped to this server request
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('[OAuth Callback] Exchanging code for session...');
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[OAuth Callback] Code exchange failed:', exchangeError.message);
      return NextResponse.redirect(`${origin}/auth?error=oauth_failed`);
    }

    console.log('[OAuth Callback] Success! Redirecting to home.');
    // Success — redirect to home; AuthContext.onAuthStateChange will pick up the session
    return NextResponse.redirect(`${origin}/`);
  }

  // No code — something unexpected happened (likely a hash fragment was sent instead of a code)
  console.warn('[OAuth Callback] No code found in query parameters. If the URL has a #fragment, the server cannot see it.');
  return NextResponse.redirect(`${origin}/auth?error=oauth_failed`);
}
