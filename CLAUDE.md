# Somnia — Roommate Matching App

**Tagline:** "Don't sleep on good roommates."  
**Concept:** Tinder/Hinge-style mobile app for college students to find compatible roommates.

## Stack

| Layer | Tech |
|---|---|
| Framework | React Native via Expo SDK 52 (TypeScript) |
| Navigation | Expo Router v4 (file-based, typed routes) |
| Styling | NativeWind v4 (`className` on RN components, Tailwind under the hood) |
| Swipe UI | `react-native-deck-swiper` (drag gestures + overlay labels) |
| Backend / Auth | Supabase (Auth + Postgres + Realtime) |
| Session Storage | `expo-secure-store` (encrypted, no AsyncStorage) |

## Project Structure

```
app/
  _layout.tsx            Root layout — GestureHandlerRootView + AuthProvider + Stack
  index.tsx              Redirects to /(app)/swipe or /(auth)/login based on session
  (auth)/
    _layout.tsx          Stack navigator (no header)
    login.tsx
    signup.tsx
  (onboarding)/
    _layout.tsx          Stack navigator
    index.tsx            5-step profile setup (basic info → sleep → lifestyle → housing → review)
  (app)/
    _layout.tsx          Tab navigator (Discover / Matches / Messages)
    swipe.tsx            react-native-deck-swiper + Supabase swipe recording
    matches.tsx          List of mutual matches with compatibility bar
    messages.tsx         Conversation list
    messages/[id].tsx    Realtime chat (Supabase channel subscription)
components/
  ui/
    Button.tsx           TouchableOpacity-based button with variants
    Input.tsx            TextInput wrapper with label/error/hint
  swipe/
    SwipeCard.tsx        Card rendered inside the Swiper (photo, name, preference chips)
  profile/
    ProfileCard.tsx      Compact profile display (used in matches/profile views)
lib/
  types.ts               All TypeScript types (Profile, Preferences, Match, Message…)
  supabase.ts            Supabase client (expo-secure-store session storage)
  auth-context.tsx       AuthProvider + useAuth() hook (wraps supabase.auth.onAuthStateChange)
  matching.ts            calculateCompatibility() + rankCandidates() scoring algorithm
  utils.ts               getInitials(), formatRelativeTime(), formatBudget()
supabase/
  schema.sql             Full DB schema + RLS policies + triggers
```

## Auth Flow

1. `/signup` → Supabase creates user → DB trigger auto-inserts stub `profiles` row
2. → `/(onboarding)` (5 steps: basic info, sleep/study, lifestyle, housing, review)
3. On Finish: `profiles.is_onboarded = true` + `preferences` upsert
4. → `/(app)/swipe`

`app/index.tsx` reads `useAuth()` and redirects accordingly on every cold start.

## Matching Algorithm (`lib/matching.ts`)

Weighted compatibility score (0–100) over 8 preference categories:

| Category | Weight |
|---|---|
| Sleep schedule | 22% |
| Cleanliness | 20% |
| Noise level | 15% |
| Guests | 12% |
| Study habits | 10% |
| Smoking | 8% |
| Drinking | 7% |
| Pets | 6% |

Budget ranges must overlap (hard filter). Results sorted by score descending.

## Database Schema

Tables: `profiles`, `preferences`, `swipes`, `matches`, `conversations`, `messages`

Key triggers:
- `on_auth_user_created` → auto-creates profile stub
- `on_swipe_insert` → auto-creates match + conversation on mutual like

`user1_id < user2_id` enforced in `matches` to prevent duplicate pairs.

## NativeWind Setup

- `tailwind.config.js` — uses `nativewind/preset`, custom `brand.*` colors (violet)
- `babel.config.js` — `babel-preset-expo` with `jsxImportSource: "nativewind"` + `nativewind/babel`
- `metro.config.js` — `withNativeWind(config, { input: "./global.css" })`
- `global.css` — imported in `app/_layout.tsx`
- `nativewind-env.d.ts` — `/// <reference types="nativewind/types" />`

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Copy `.env.example` → `.env` and fill in Supabase project values.

## Dev Commands

```bash
npm start               # Expo dev server (scan QR with Expo Go)
npm run ios             # iOS simulator
npm run android         # Android emulator
npm run web             # Web (metro bundler)
```

## Design System

- Primary brand color: `brand-600` = `#7c3aed` (violet)
- Border radius: `rounded-2xl` (16px) inputs/buttons, `rounded-3xl` (24px) cards
- Font weight: `font-black` for headings, `font-bold` for buttons, `font-semibold` for labels
- Swipe gestures: ±100px threshold triggers like/pass; vertical swipe = super-like

## Next Steps

- [ ] Photo upload via Supabase Storage + `expo-image-picker`
- [ ] Push notifications via `expo-notifications` on new match
- [ ] Compatibility breakdown modal in SwipeCard
- [ ] Profile edit screen
- [ ] Block / report functionality
