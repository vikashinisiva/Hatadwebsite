# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Next dev server (Turbopack) on :3000
npm run build    # production build
npm run start    # serve the production build
npx tsc --noEmit # typecheck — the only automated check in this repo
```

There is no test runner, no linter, and no test files. **Typecheck is the verification gate.** A `PostToolUse` hook in `.claude/settings.json` already runs `npx tsc --noEmit` after any `.ts`/`.tsx` edit — read its output rather than re-running it.

Manual verification is done with curl against a running dev server (see the long allowlist in `.claude/settings.json` for the canonical smoke-test commands — route status codes, `/api/tngis/lookup` with Coimbatore coords, empty-body checks on the payment routes).

## Deployment

Vercel project `hatad_web` under the **HypseAero** team (the team name is historical — see below). Pushing to `main` deploys to production.

**One site, one domain: `hatad.in` / `www.hatad.in`.** `metadataBase`, the canonical, the `sitemap.ts` `ORIGIN` and the single `robots.ts` sitemap entry all point there.

`hypseaero.in` is a **different company** and no HataD content is served on it. The project previously answered on `hypseaero.in` / `www.hypseaero.in` as well, and `sitemap.ts` emitted every route once per host — publishing a second copy of the whole site under another company's domain. Those entries are gone. The hostnames themselves must be detached in the Vercel dashboard; until that is done the project still answers on them for anyone with the URL.

The organisation identity in the `layout.tsx` JSON-LD reads from `COMPANY` in `src/lib/constants.ts` — **Crest Intelligence Private Limited**, which operates hatad.in. Do not retype the legal name, email or phone into the schema; that is exactly how it came to disagree with the page footer. The schema publishes locality/region/country only: the street address that was there belonged to the Hypse Aero entry and has not been reconfirmed.

`vercel.json` registers one cron: `GET /api/cron/cleanup` daily at 21:30 UTC (3 AM IST).

## The pre-launch wall (read this before anything below)

**Everything in Architecture is currently unreachable in production.** With `COMING_SOON=1`, `src/proxy.ts` (Next 16 renamed `middleware` to `proxy`) replaces the whole site with a waitlist page. Launching is one env var: unset it and redeploy.

- `/` is **rewritten** to `/coming-soon`, so the landing page rebuild stays previewable with the flag off. The rewrite means `/coming-soon`'s metadata is what `hatad.in` actually serves — including its `robots`, which is why that page is indexable and its `<title>` leads with the product rather than with "Launching soon".
- `PRELAUNCH_PUBLIC_PATHS` in `constants.ts` is the allowlist: the Razorpay policy pages (a 404 there risks live keys — five of them are listed but **do not yet exist**), `/hq-panel`, `/api/waitlist`, `/api/track`, `/api/cron`, and `/api/razorpay/verify` + `/api/clearance` so an already-authorised payment can still land.
- Non-allowlisted APIs answer **503**, not a redirect — redirecting a POST silently downgrades it to a GET on `/`, which reads as success to the caller. Everything else 307s to `/`.
- Verify changes to the wall by actually running it: `COMING_SOON=1 npm run dev`, then curl the routes. It is off by default locally, so anything tested without it has not tested the wall.

`src/components/sections/LaunchTease.tsx` is the whole page (hero + Mapbox city cycle, `DepartmentDescent`, `CoverageCount`, a GSAP `ScrollReveal` line, the credentials band, FAQ, closing CTA). It uses plain `lt-`/`dd-`/`cc-`/`tr-` CSS classes in `globals.css`, **not** Tailwind — the column scale (`--lt-measure`, `--lt-space-1..5`) lives on `.lt-root` because the join form renders twice, in the hero and at the close.

Signups go to `/api/waitlist` → `waitlist` table, falling back to `analytics_events` if that table is missing so a lead is never lost. `classifyContact` in `src/lib/waitlist-contact.ts` is the real gate and runs on both sides.

**Numbers are counted, never typed.** `SOURCE_COUNT` and `SOURCE_CLAIM` derive from `SOURCE_CLUSTERS` in `src/lib/departments.ts`; the hero sub-line, the descent, the closing line, the convergence diagram and the page metadata all read from them. A hardcoded `'30+'` once disagreed with a list of 28 — on a page whose argument is that we check what is on record. Add a source to the array and every figure follows. Note the noun: of the 30, twenty-nine are departments and one is the judiciary, hence "departments and courts".

## Architecture

Next.js 16 App Router · React 19 (React Compiler on via `next.config.ts`) · Tailwind v4 · TypeScript strict. Path alias `@/*` → `./src/*`.

### The product in one paragraph

A buyer in Tamil Nadu enters a survey number (or lets the browser geolocate them). The app hits Tamil Nadu government GIS APIs for a free "risk preview", then sells a ₹3,599 human-verified land clearance report delivered within 3 hours. Reports are produced manually by ops and uploaded through an admin panel.

### The money path (touch with care)

`/clearance/onboarding` is a single client component driving 4 steps (`steps.tsx`: `StepAccount` → `StepProperty` → `StepPay` → `StepTracking`).

1. Supabase Google OAuth signs the user in.
2. `POST /api/razorpay/order` — server rejects any `amount` that isn't `CLEARANCE_PRICE_PAISE`.
3. Razorpay checkout runs client-side; `POST /api/razorpay/verify` recomputes the HMAC signature, **re-fetches the order from Razorpay to get the authoritative amount** (never trusts the client), and inserts into `verified_payments` with `used: false`.
4. `submitRequest()` uploads any documents to Storage, then `POST /api/clearance` calls the Postgres RPC **`create_clearance_with_payment`**, which marks the payment used and inserts the `clearance_requests` row in one transaction. This is what prevents the "paid but no report" state — do not replace it with separate client-side writes.

Crash recovery: after a successful payment the paymentId + property are written to `sessionStorage` (`STORAGE_KEYS.PAID_PENDING_SUBMIT`) *before* submit, and re-fired automatically on next mount if submit never landed. `/api/cron/cleanup` reconciles what still slips through and emails ops about orphans (`used=true` with no request row) and stuck-unused payments (>2h).

`CLEARANCE_PRICE_PAISE` in `src/lib/constants.ts` is the single price source — the order route, the RPC's `p_expected_amount`, and all UI copy read from it.

### TNGIS integration (the hard part)

Tamil Nadu's GIS APIs (`tngis.tn.gov.in`) block cloud IPs except GCP Mumbai, and reject browser calls with CORS. So:

- **`/api/tngis/lookup`** does *not* call TNGIS. It proxies to a Flask/gunicorn service on a GCP Mumbai VM (`TNGIS_PROXY_URL`, default `http://35.200.151.237:8080`). `maxDuration = 60`, `preferredRegion = 'bom1'`, plus a 1-hour in-memory cache keyed on 4-decimal lat/lon and a Tamil Nadu bounding-box guard.
- **`src/lib/tngis.ts`** is the full TypeScript port of that lookup (parallel fan-out across land details, guideline value, master plan, thematic layers, elevation, FMB/EC availability, Mugavari facilities, with session auto-refresh and throttled down-alert emails). Only `searchPlace()` is still wired up, via `/api/tngis/search` — the rest is the reference implementation the proxy mirrors.
- **`src/lib/tngis-client.ts`** is the abandoned browser-direct path; only its `ClientLookupResult` type is still imported. Don't revive client-side TNGIS calls — they always fail CORS.
- `Tngis testing/` (gitignored) holds the original Python implementation and captured API responses. It's the ground truth when TNGIS response shapes are in question.

Every TNGIS field can come back undefined or partial — urban areas return `revenue_town_name` where rural returns `village_name`. Guard with `|| ''` fallbacks; this has crashed the page before.

### Supabase

Two clients, deliberately separated:
- `src/lib/supabase.ts` — lazy anon client via a Proxy, browser-side, persists sessions.
- `src/lib/supabase-admin.ts` — service-role client, **server-only**, used by every API route.

Tables: `clearance_requests`, `verified_payments`, `analytics_events`, `leads`. Storage buckets: `clearance-documents` (user uploads), `clearance-reports` (finished PDFs), `documents` (contact-form attachments).

**The schema, RLS policies, and the `create_clearance_with_payment` function live only in the Supabase dashboard — there are no migrations in this repo.** Reason about them from call sites, and say so when a change would require a schema edit.

Report downloads never expose storage paths: `/api/clearance/download` verifies the Supabase JWT, confirms `user_id` ownership, then mints a signed URL with the service role.

### Admin

`/hq-panel` is a password-gated ops console (`ADMIN_PASSWORD` held in `sessionStorage`, sent as a bearer token). `/api/admin/update` re-checks that password on every call and handles report upload, status/flag changes, notes, delete, delay emails, and signed URLs for customer documents. It is the only writer of `status: 'ready'`.

### Email

`src/lib/sendNotification.ts` builds the customer-facing HTML templates. `createTransporter()` prefers explicit `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` and otherwise falls back to Gmail via `SMTP_EMAIL`/`SMTP_PASSWORD` — that fallback pattern is duplicated in the cron and TNGIS alert paths. `/api/clearance/notify` is server-to-server only, gated on `INTERNAL_API_SECRET`.

### Other cross-cutting pieces

- **Auth callback**: `layout.tsx` injects a pre-hydration inline script that hides the page the instant `#access_token=` appears in the URL; `AuthCallback.tsx` takes over on mount, waits for the session (event listener *and* a polling fallback), then hard-navigates to the stored destination. Both halves must stay in sync or the OAuth redirect flashes the landing page.
- **Landing page**: `src/app/page.tsx` renders `Hero` eagerly and lazy-loads twelve below-fold sections via `next/dynamic`. Keep new sections lazy.
- **SRO lookup**: `src/lib/sro.ts` maps ~24.7k villages to Sub-Registrar Offices from `src/data/sro_cache.json` (tracked), with Tamil transliteration normalization for fuzzy matches. The identically-named file at the repo root is gitignored scratch — edit the one under `src/data/`.
- **Analytics**: `track()` in `src/lib/track.ts` is fire-and-forget into `analytics_events`; `/api/track` always returns 200 so tracking can never break a user flow. Vercel Analytics, Speed Insights, GA4, and Termly CMP are all wired in `layout.tsx`.
- **i18n**: `src/lib/i18n/context.tsx` with `en.json`/`ta.json` and a `useT()` hook, locale in `localStorage`. Partially adopted — most copy is still inline.

## Conventions

- Design tokens live in the Tailwind v4 `@theme` block in `globals.css` (`bg-background`, `text-text-muted`, …). Marketing sections mix those with raw hex (`#0C1525` navy, `#C9A84C` gold, `#F4F7FC` page background) — match whatever the surrounding file already does rather than converting.
- The onboarding flow is the exception: it uses plain CSS classes from `onboarding.css` (`ob-*`) plus inline styles, not Tailwind.
- Dates shown to users are formatted `en-IN` in `Asia/Kolkata`.
- Server errors are surfaced to users as real messages; don't swallow them into a generic string.
- Environment variables are documented in `.env.local.example`. `.env*` is gitignored.
- Only push or deploy when explicitly asked.
