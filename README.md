# Redirected

An invitation-only guest intake and production desk, built onto the original Redirected landing page. Next.js App Router + React + Tailwind CSS, with a Supabase PostgreSQL migration and server-side authentication.

**Current milestone: private testing.** The existing public website has not been replaced by this branch. This version does not collect a content release, enable payments, send email, or publish test guests.

## Try the local demo

Use Node.js 24 or newer.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000/admin. The demo has two sample invitation links: Sessions and an already-recorded Backstage guest. You can also create your own test invitations. Use fictional details in this unauthenticated, loopback-only demo. Demo data lives in server memory and resets on restart. No real booking is made.

1. Create an invitation and open its link in another tab.
2. Complete the form. Requests for a call appear in the dashboard.
3. Reload the dashboard to review the submission, search/filter it, and update the call status.
4. Reopening the submitted invitation shows it is unavailable. Expired and revoked invitations are also rejected.
5. Public-profile controls stay disabled for test submissions. The public directory remains empty.

## Structure

- `app/page.tsx`, `app/globals.css`: original homepage, extended visual system.
- `public/hero-logo.svg`, `public/assets/fonts/Aylia.otf`: original assets, preserved.
- `app/invite/[token]`: private guest form with Sessions / Backstage routing.
- `app/admin`: private production desk; `/admin/login` authenticates the administrator.
- `app/artists`: public directory and individual profiles; reads only the public projection.
- `app/api/artists/route.ts`: validated, single-use invitation submission and private media-upload endpoint.
- `app/api/admin`: authenticated invite creation/revocation and guest updates.
- `lib/models.ts`: input validation and public field allowlist.
- `lib/store.ts`: Supabase / local-demo adapters.
- `supabase/migrations/001_invited_guests.sql`: schema, RLS, transaction and publication trigger.
- `tests`: validation, token lifecycle, production-demo guard, and real PostgreSQL-engine schema/access tests.
- `docs/SETUP.md`: Supabase, Cal.com, deployment and operational instructions.

The superseded root HTML/CSS and duplicate assets were removed from this branch; the previous site is recoverable from Git history. Next.js requires Vercel hosting rather than GitHub Pages for its server routes. Do not merge until the Vercel project is configured as Next.js.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

Tests use PGlite (a local PostgreSQL engine), not a hosted Supabase account. Webpack is selected for reproducible builds in this desktop environment. Production demo authentication is hard-disabled even if the demo environment flag is mistakenly set.

## Known boundaries

- All issued invitations are **test** invitations. Legal release wording and a separately reviewed live-consent flow are required before genuine publication. Test acknowledgements are never release consent.
- Guests must provide either a private photos/press-kit link or up to 10 supported uploads. Uploaded files use the private `guest-media` Supabase Storage bucket and are exposed only to the authenticated administrator through short-lived links.
- Cal.com displays real availability only after `CAL_EVENT_URL` is configured outside local demo mode. No webhook sync yet: confirm bookings in Cal.com and record the confirmed shoot date in the dashboard. A recorded guest skips scheduling.
- Invitations are bearer links: anyone possessing a link can submit it once. Only the admin can create links. They are not identity-verified; email OTP can be added if stricter recipient binding is needed.
- Membership/referral columns are placeholders for a later phase, with no billing, payouts or tracking implemented.
- Supabase and Cal.com connections require your accounts; no hosted resources were created automatically.
