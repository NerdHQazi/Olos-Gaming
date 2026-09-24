import { api } from './api';

/**
 * Matches your actual Express backend (src/routes/authRoutes.js):
 *   POST /api/auth/signup  { email, password, fullName, username }
 *   POST /api/auth/login   { email, password }
 * Both proxy straight to Supabase Auth, so the response shapes below mirror
 * what supabase-js returns (session.access_token, not a flat accessToken).
 *
 * verify-email / forgot-password / reset-password / 2FA have NO backend route
 * yet — those are wired directly to Supabase client-side instead (see the
 * corresponding pages), since your backend just calls supabase.auth.* itself
 * and Supabase already exposes those flows to the browser SDK directly.
 */

export type SignUpPayload = { email: string; password: string; fullName: string; username: string };
export type LoginPayload = { email: string; password: string };

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};

export type SupabaseUser = {
  id: string;
  email: string;
  fullName?: string;
  username?: string;
};

export type SignUpResponse = {
  success: boolean;
  message: string;
  user: SupabaseUser;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  session: SupabaseSession;
  user: SupabaseUser;
};

export const authApi = {
  signUp: (payload: SignUpPayload) =>
    api.post<SignUpResponse>('/api/auth/signup', payload),

  login: (payload: LoginPayload) =>
    api.post<LoginResponse>('/api/auth/login', payload),
};
