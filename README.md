# Wardrobe

A minimal iPhone app for cataloguing the clothes you own and getting outfit suggestions from them.

Built with Expo (React Native, TypeScript, Expo Router) and Supabase (sign-in, database, photo storage). Photos are tagged by Claude through a Supabase Edge Function.

## What works (milestone 1)

- Sign up and sign in with email and password. Anyone can create an account; each person only sees their own closet.
- Add an item by taking a photo or choosing one from the library. Claude suggests tags (type, colors, pattern, seasons, style), which you can edit before saving.
- Closet grid with category and color filters.
- Item detail screen to edit tags or delete the item.
- **Outfit** tab: pick an occasion and season and get an outfit built from your own clothes by a rules engine (`src/lib/outfits.ts`) that avoids clashing colors and patterns.

## One-time setup

1. **Supabase project.** Create a free project at [supabase.com](https://supabase.com). Under *Authentication > Sign In / Providers*, email sign-in is on by default; turn off *Confirm email* while testing if you don't want to click a link each time.
2. **Database and storage.** With the [Supabase CLI](https://supabase.com/docs/guides/cli):
   ```sh
   npx supabase init        # keep the existing supabase/ folder
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push     # creates the items table, photo bucket and access rules
   ```
3. **Auto-tagging (optional).** Without this, the app still works and you tag items by hand.
   ```sh
   npx supabase secrets set ANTHROPIC_API_KEY=<your Anthropic API key>
   npx supabase functions deploy tag-item
   ```
4. **App settings.** Copy `.env.example` to `.env` and fill in your project URL and publishable key.

## Run it on your iPhone

```sh
npm install
npx expo start
```

Install **Expo Go** from the App Store and scan the QR code with the iPhone camera.

## Checks

```sh
npm run typecheck
npm test
```

## Layout

- `src/app/` screens (Expo Router: every file is a route)
- `src/lib/` Supabase client, item data access, outfit engine and its tests
- `src/components/` shared UI
- `supabase/migrations/` database schema and access rules
- `supabase/functions/tag-item/` Claude vision tagging
