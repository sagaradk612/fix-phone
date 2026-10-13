# FIXFORM — Global Mobile Repair Shop

A responsive Next.js App Router starter for a mobile repair shop. Includes multilingual routing, repair booking and tracking, a second-hand phone storefront with order requests, private role-based staff management, PostgreSQL/Prisma models, and an AI translation endpoint with cache.

## Stack
- Next.js 15 + React 19 + TypeScript
- `next-intl` locale routing
- PostgreSQL + Prisma
- Zod request validation
- OpenAI-compatible chat completions endpoint for AI translation

## Requirements
- Node.js 20.9+ (recommended current LTS)
- PostgreSQL database
- AI translation key only if you want on-demand AI translations

## Run locally

```bash
cp .env.example .env
# Edit DATABASE_URL in .env
npm install
npx prisma generate
npx prisma migrate dev --name init
# Set BOOTSTRAP_OWNER_EMAIL, BOOTSTRAP_OWNER_NAME, and a unique
# BOOTSTRAP_OWNER_PASSWORD (14+ characters) in .env, then run:
npm run staff:create-owner
# Remove the BOOTSTRAP_OWNER_* values from .env after the owner is created.
npm run dev
```

Open `http://localhost:3000/en`. The locale switcher offers the configured locale list. Locale JSON files currently have full starter catalogs for English, Thai, Chinese, Japanese, Spanish, French, German, and Arabic. Other configured locales safely fall back to English until reviewed catalogs are added; configure the AI translation API for on-demand translation of dynamic content.

## Main routes
- `/[locale]` — home page
- `/[locale]/services` — service catalog with example THB prices
- `/[locale]/sell` — second-hand phone catalog and order-request checkout
- `/[locale]/booking` — appointment request form
- `/[locale]/track-repair` — repair lookup using reference + phone
- `/[locale]/admin/login` — private staff sign-in (not linked in public navigation)
- `/[locale]/admin` — authenticated staff dashboard
- `GET /api/shop/products` — public active phone listings
- `POST /api/shop/orders` — submit an order request and reserve stock
- `GET /api/shop/orders` — staff-only order management
- `/api/staff/login` and `/api/staff/logout` — staff session endpoints
- `POST /api/bookings` — validate and create booking
- `GET /api/repair-prices` — public active model/problem repair prices used by booking
- `POST /api/repair-prices`, `PATCH /api/repair-prices/[id]`, `DELETE /api/repair-prices/[id]` — owner/manager repair price matrix management
- `GET /api/repairs/track?reference=...&phone=...` — privacy-aware tracking
- `GET /api/bookings` — staff-only booking list
- `PATCH /api/bookings` — staff-only status update
- `POST /api/translate` — cached AI translation fallback

## Multilingual behavior
`src/i18n/routing.ts` defines the supported locale allowlist. Locale URLs are always prefixed. `next-intl` negotiates the initial locale from the browser's `Accept-Language` header and the language switcher allows a manual override; the switcher also writes a `preferred-locale` cookie for app-level preference. Explicit locale URLs remain authoritative. Keep a locale in the allowlist only when its fallback, metadata, RTL behavior, and customer-facing translations are tested.

For new languages, add a `messages/<locale>.json` file and translate every namespace. Missing catalogs fall back to English. Add the right locale direction in `src/app/[locale]/layout.tsx` when it is RTL. For full production localization, use reviewed translation files for indexed landing pages and AI fallback for dynamic/unreviewed content, then publish reviewed translations to the cache/catalog.

## Security and production checklist
This is an application starter, not a deployed production service. Before public launch:
1. Deploy with HTTPS and managed PostgreSQL; run migrations in deployment.
2. Use HTTPS and create the initial owner with the one-time bootstrap command. Staff passwords are bcrypt-hashed; sessions use random, database-backed, revocable tokens in HttpOnly, SameSite cookies. Owner manages staff accounts; managers manage inventory; staff manage order and repair status. The sign-in page is unlinked and noindexed, but an unlisted URL is not a security boundary; route and API authorization enforce access.
3. Configure a distributed rate limiter / bot protection for sign-in and public booking, tracking, translation, and order routes; the included sign-in throttle is process-local and is not sufficient across multiple instances. Consider CAPTCHA.
4. Add consent/privacy notices and retention/deletion rules for customer personal data.
5. Configure transactional email/SMS/WhatsApp notifications through a provider; this starter currently stores bookings but does not send notifications.
6. Verify phone normalization for your operating countries. Do not reveal customer name, email, notes, or admin-only fields on the tracking endpoint.
7. Review translated legal, warranty, payment, and price content with qualified humans.
8. Replace example repair prices and brand identity, and configure shop currency/time zone.
9. Add automated tests, error monitoring, database backups, and accessibility checks.

## Translation API
Set `OPENAI_API_KEY` and optionally `TRANSLATION_MODEL` and `OPENAI_BASE_URL`. The API caches translations in `TranslationCache` and returns them as unapproved. Do not automatically publish AI output to SEO landing pages or legal/payment content without review. Add rate limiting and a provider-specific data/privacy review before launch.

## Important notes
- Example prices are placeholders and are not quotes.
- Phone checkout creates an order request and reserves inventory; no payment processing or delivery integration is wired in. Add a compliant payment provider and fulfillment workflow before taking live payments.
- No live deployment, domain, credentials, messaging provider, or production authentication is included.
