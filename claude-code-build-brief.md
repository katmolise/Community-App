# Build brief: Circles & Events — The Hub Social

Paste this into Claude Code in the `thehubsocials` repo. It has two reference
files to load first: `community-board.jsx` (UI/UX reference — do not use its
mock auth or `window.storage` code, only its layout, styling, and data shapes)
and `supabase-schema.sql` (the real schema, apply as-is).

## Stack
React + Vite + Supabase, deployed on Vercel. Extends the existing
thehubsocials project — do not start a new repo.

## 1. Supabase setup
- Run `supabase-schema.sql` against the existing thehubsocials Supabase
  project (SQL editor or `supabase db push`).
- In Authentication > Providers, enable Google. Add the Google OAuth client
  ID/secret (create one in Google Cloud Console if it doesn't exist yet —
  authorized redirect URI is `https://<project-ref>.supabase.co/auth/v1/callback`).
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local` and to
  the Vercel project's environment variables.

## 2. Install
```
npm install @supabase/supabase-js
```
Create `src/lib/supabase.js` exporting a single Supabase client using
`import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

## 3. Auth
- `supabase.auth.signInWithOAuth({ provider: 'google' })` for sign-in.
- `supabase.auth.signOut()` for sign-out.
- `supabase.auth.getSession()` / `onAuthStateChange` to drive the signed-in
  state — replaces the mock `signIn()`/`signOut()` in the reference file.
- On first Google sign-in the DB trigger auto-creates a `profiles` row, so no
  manual profile creation is needed client-side. Let the user edit `area` on
  their profile after first login (a simple settings modal is enough).

## 4. Data layer (replaces window.storage in the reference)
- **Load circles for the board**: select from `circles` joined to the next
  upcoming row in `events` (order by `starts_at`, one per circle, `starts_at
  >= now()`), plus a count from `attendees`.
- **Create a circle**: insert into `circles`, then insert the first `events`
  row for the date/time picked in the form.
- **Join/leave**: insert/delete a row in `attendees` for
  `(event_id, profile_id)`. `profile_id` is `session.user.id`.
- **Filters**: category and area filters are `where` clauses on `circles`,
  applied client-side or as query params — either is fine at this scale.
- Use Supabase Realtime (`supabase.channel(...).on('postgres_changes', ...)`)
  on `circles`/`attendees` so the board updates live without a refresh — this
  is the direct upgrade path from the prototype's shared `window.storage`
  board, which simulated the same "everyone sees it" behavior.

## 5. UI
Port `community-board.jsx` component-for-component: same layout, same CSS
(the `<style>` block can move to a `.css` module or stay inline — your
choice), same category color system, same masonry board and modal. Swap only
the data-fetching and auth internals described above. Keep the Google button
markup as-is; it just needs a real `onClick` now.

## 6. Deploy
Push to the existing repo, confirm env vars are set in Vercel, deploy. Smoke
test: sign in with Google, create a circle, join it from a second account,
confirm RLS blocks editing someone else's circle.
