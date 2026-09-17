# OLOS Onboarding — build notes

dependencies needed (`next/image`, `next/link`, `next/navigation` only).

## Pages built
- `/auth/splash` — first-launch splash (auto-advances to Welcome)
- `/auth/welcome` — fixed up (see below)
- `/auth/signup` — Create Account
- `/auth/verify-email` — 6-digit OTP
- `/auth/signin` — Sign In, including the "incorrect password" error state
- `/auth/forgot-password` — request reset link
- `/auth/forgot-password/check-email` — "check your email" confirmation
- `/auth/reset-password` — set new password
- `/auth/reset-password/success` — confirmation
- `/auth/enable-2fa` — 2FA method picker
- `/auth/loading` — "Signing you in..." transition screen



## Behavior notes
- All forms have real client-side validation (email format, password rules, confirm-password
  match) matching the checklist/error states shown in the designs.
- API calls are stubbed with `// TODO` comments and a `setTimeout` — I'll wire these up to the actual auth endpoints.
- `AuthButton` now has 5 variants (`primary`, `cyan`, `teal`, `outline`, `outline-green`)
  covering every button state that appears across the figma design.
