# USAA Online Banking Portal

An online banking portal built with Next.js 16, TypeScript, Tailwind CSS v4 and Supabase — checking, savings, credit cards, loans, transfers, bill pay, Zelle, deposits, statements and security.

## Setup

1. Create a free Supabase project.
2. Copy `.env.local.example` to `.env.local` and fill in the project URL and anon key.
3. In the Supabase SQL Editor, run `supabase/schema.sql` and then `supabase/seed.sql`.
4. In Supabase Auth → URL Configuration, set the Site URL and add redirect URLs for `/auth/callback`, `/reset-password` and `/login/verify` (and confirm your email provider is on so two-step and recovery emails are delivered).
5. Run `npm install`, then `npm run dev`. Open http://localhost:3000 and sign up.

## Scripts

- `npm run dev` / `npm run build` / `npm run start` / `npm run lint`

## Notes

- New members get real (empty) accounts at sign-up — checking, savings, a credit card and an investment account, all at $0. Balances and activity come only from the member's own usage.
- Two-step verification and password recovery use Supabase's built-in email delivery. On the free tier, email volume is rate-limited.
- Use webpack for dev/build because this machine lacks Turbopack native bindings; the flags are already set in `package.json`.