# Connect Redirected for a private pilot

## 1. Supabase project

Create your own account at https://supabase.com/dashboard and create a new project under the Free plan if available to your account. Select a region appropriate for you (for example a European region), set a strong database password, and keep it in your password manager. This app does not need your database password. Check current plan limits at https://supabase.com/pricing before enabling optional paid features.

Open the project's SQL Editor and run `supabase/migrations/001_invited_guests.sql` once. This is a new-project migration; do not rerun it against existing tables or substitute a destructive reset.

The migration creates:

- `invitations`: 14-day, single-use, revocable invitations. Only a SHA-256 hash of each 256-bit random token is stored.
- `artists`: private intake submissions. Includes the requested artist fields plus email, invitation reference, recorded/test state, Backstage logistics and release metadata. `press_kit_url` is optional; `linktree_url` accepts any main social/profile URL despite its historical field name.
- `artist_profiles`: only the seven publicly allowed fields. A trigger maintains this table when an eligible artist is published/unpublished. No email, legal name, private production notes, or media-folder URL can appear here.
- `submit_invited_artist`: a server-only transaction that locks an invitation, checks validity/format, inserts a submission and consumes the invitation atomically. Failure rolls back the entire operation.

RLS is enabled on every table. `anon` and `authenticated` have no permissions to read or mutate private tables or call the submission function. The service-role/secret client is used only on the Next.js server after invitation validation or an admin identity check. Public roles may read the public profile table only.

## 2. Your administrator account

In Supabase Authentication:

1. Disable public user sign-ups. There is no guest-account signup page in this application.
2. Use the dashboard's user-management action to create your own email/password account (use your chosen administrator email). Confirm it through the dashboard or Supabase's normal verification flow.
3. Copy its user UUID as `ADMIN_USER_ID`. The API validates the signed-in user with Supabase `getUser()` on each admin request and compares this UUID. Merely creating another Supabase user will not grant administrator access.
4. Use a strong, unique password. Configure Supabase's authentication rate limits before exposing the login page. Password recovery is managed in Supabase for this milestone; no in-app reset flow is provided.

The browser receives an HttpOnly, SameSite=Strict cookie containing only an access token. It expires after at most one hour; sign in again afterward. Production cookies require HTTPS. No refresh token is kept. Signing out deletes the app cookie; an already stolen token could remain usable until it expires, as with ordinary bearer JWT sessions. For a higher-risk deployment, add MFA and a revocable session layer before launch.

## 3. Environment variables

Copy `.env.example` to `.env.local` for local use. For a connected private pilot, set:

```dotenv
REDIRECTED_DEMO_MODE=false
APP_URL=http://127.0.0.1:3000
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
ADMIN_USER_ID=YOUR_USER_UUID
CAL_EVENT_URL=https://cal.com/YOUR_ACCOUNT/YOUR_EVENT
```

The Supabase Connect/API settings provide the project URL and API keys. A legacy anon key can fill `SUPABASE_PUBLISHABLE_KEY`; a legacy service-role key can fill `SUPABASE_SECRET_KEY`. Never put the secret/service-role key in a `NEXT_PUBLIC_` variable, commit it, or paste it into a guest form. `.env.local` is ignored by Git.

`APP_URL` must match the actual browser origin exactly. On Vercel production use `https://redirectedmusic.com`. Redirect `www` to that canonical domain. For a Vercel preview deployment use its exact preview origin; do not use the production origin for a preview's API calls. Origin checks apply to every mutation.

`REDIRECTED_DEMO_MODE=true` works only with `NODE_ENV=development`. It is never honored in a production build. Local demo mode uses memory, bypasses administrator login, and binds to loopback through the supplied dev script. Do not expose it through a tunnel or public network.

Restart the dev server after changing environment variables. Open `/admin/login` and sign in. Create an **already-recorded test invitation** for the first pilot guest after reviewing the flow yourself. Copy the link immediately; full tokens are not recoverable from the database. Revoke an unused invitation and create a new one if you lose its link. Creating a link does not email anyone.

## 4. Cal.com availability

Create one event type for a Redirected shoot. Configure your real available hours, connected calendar conflict checks, timezone, duration, minimum notice and buffers in Cal.com. If you want final approval, enable **Requires Confirmation** for the event. Guests can then choose an available slot, subject to your approval.

Put that event's `https://cal.com/<account>/<event>` URL into `CAL_EVENT_URL`. The form shows scheduling after a successful submission, so no guest has to book before completing their intake. The guest actively opens the calendar; a separate link is provided if the embed does not load. The invitation token and private answers are not passed to Cal.com. The app sets `Referrer-Policy: no-referrer` as well.

- An already-recorded invitation shows no booking calendar.
- A requested pre-production call is tracked separately from the shoot; arrange it with the guest for now.
- Booking confirmation, rescheduling and cancellation happen in Cal.com.
- This version does **not** trust iframe events or guest-supplied timestamps as a confirmed booking. Record the confirmed shoot date manually in the admin dashboard. Its field uses your browser's local timezone, converting to UTC for storage.
- A signed Cal.com webhook with event correlation, idempotency, and cancellation handling is a later integration, not a configured feature of this milestone.

Official reference: https://cal.com/blog/requires-confirmation-feature-calcom

## 5. Before deploying this branch

This branch is a Next.js migration. The current production site is still the earlier static homepage. Use a Vercel preview before touching the live domain.

1. Run `npm ci`, `npm test`, `npm run typecheck`, and `npm run build` using Node.js 24+.
2. Push the feature branch and create a preview deployment. In the existing Vercel project, use the Next.js framework preset, repository root, `npm run build`, and the default Next.js output. Remove any old static-output override. Confirm framework changes against a preview before promoting.
3. Add server environment variables for the correct deployment scope. Demo mode must be off. Match `APP_URL` to the preview hostname while testing.
4. Verify the homepage, invalid/expired/replayed invitations, both formats, the recorded guest path, unauthenticated admin/API rejection, and login as your sole allowed administrator against hosted Supabase.
5. Confirm that public API roles cannot read `artists` or `invitations`. Verify a test submission never appears in `/artists` or `artist_profiles`.
6. Keep the pilot private. The release remains unfinished and publication is intentionally blocked for all newly issued invitations. Do not label this version legally or operationally production-ready.
7. When approved for deployment, promote/merge into the existing repository's `main` branch and set production `APP_URL=https://redirectedmusic.com`. Existing Vercel domain/DNS settings stay in place. Subsequent main-branch pushes deploy automatically through the existing integration.

GitHub Pages cannot run this application's server endpoints. It may continue hosting the earlier static version until you deliberately unpublish it; Vercel serves the custom domain. Do not move the custom domain to GitHub Pages.

## 6. Release and later work

No legal release text is fabricated here. All invitations created by the app are test invitations; the submit function enforces that state. `content_release_accepted` remains false and the test acknowledgement is not stored as release consent. The UI, server, and database all block publishing test records.

Before live intake: supply reviewed release/privacy wording, implement the versioned acceptance step (including timestamp), review data-retention and guest correction/deletion procedures, add a new migration/API path for non-test invitations, and test it against Supabase. Never convert a test acknowledgement into a release acceptance. Collect any necessary new consent explicitly from the guest.

The public directory infrastructure and publish/unpublish trigger are included and tested using isolated future-release fixtures, but are deliberately inaccessible to test submissions. Image uploads, artist account editing, email automation/outbox delivery, Cal.com webhooks, payments and referral payouts remain future phases.

## 7. Recovery and maintenance

Keep tokens, request bodies, and private answers out of analytics and error logging. Invitation URLs are bearer credentials; configure host access-log retention accordingly. API error responses avoid exposing database details. Tokens expire after 14 days and can be revoked by the administrator.

The dashboard currently lists the newest 500 guests/invitations; pagination should be added before exceeding that volume. Demo data is disposable; hosted test records persist in Supabase and should be removed after the pilot according to your retention decision. Admin deletion/export tools are not yet part of the UI.

Original website code remains in Git history. To roll back a deployment, use Vercel's previous production deployment rather than rewriting Git history or deleting this repository.

References:

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/reference/javascript/auth-getuser
- https://supabase.com/docs/reference/javascript/auth-signinwithpassword
- https://nextjs.org/docs/app/api-reference/functions/cookies
