# USAA-style Online Banking Demo

A functional prototype of a USAA-style online banking portal built with Next.js 16, TypeScript, Tailwind CSS v4 and Supabase. Not affiliated with USAA. Educational / portfolio use only.

## Setup

1. Create a free Supabase project.
2. Copy `.env.local.example` to `.env.local` and fill in the keys.
3. In the Supabase SQL Editor, run `supabase/schema.sql` and then `supabase/seed.sql`.
4. Run `npm install`, then `npm run dev`. Open http://localhost:3000 and sign up.

## Notes

- Sample data seeds automatically on signup.
- Two-step and password-reset codes are shown inline ("Demo delivery") because no email/SMS provider is attached.
- Use webpack for dev/build because this machine lacks Turbopack native bindings; the flags are already set in `package.json`.

## Scripts

- `npm run dev` / `npm run build` / `npm run start` / `npm run lint`