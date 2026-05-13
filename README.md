# Somnia
### don't sleep on good roommates.

Somnia is a mobile roommate matching app for college students — think Hinge for finding compatible roommates. Built for BU students first, with plans to expand across Boston universities.

## Stack
- React Native + Expo (iOS)
- TypeScript
- Supabase (Postgres + Auth + Realtime)
- Hono (Cloudflare Workers API layer)
- NativeWind (Tailwind for React Native)

## Features
- Multi-step onboarding with .edu verification
- Compatibility matching across lifestyle preferences
- Swipe deck (like/pass)
- Mutual match detection
- Realtime messaging between matches

## Getting Started
1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your Supabase credentials
3. Run `npm install`
4. Push the schema: paste `supabase/schema.sql` into your Supabase SQL editor
5. Start the app: `./node_modules/.bin/expo start`

## Project Structure
- `app/` — Expo Router screens (auth, onboarding, swipe, matches, messages)
- `api/` — Hono API on Cloudflare Workers
- `components/` — Reusable UI components
- `lib/` — Supabase client, matching algorithm, TypeScript types
- `supabase/` — Database schema

---
Built by [@insomniackk](https://github.com/insomniackk)
