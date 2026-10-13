# FIXFORM — Global Mobile Repair Shop

A responsive Next.js App Router starter for a mobile repair shop. Includes multilingual routing, translated English/Thai/Chinese/Japanese/Spanish/French/German/Arabic catalogs, locale switching, RTL layout handling, repair booking API, privacy-aware repair tracking, admin booking/status management, PostgreSQL/Prisma models, and an AI translation endpoint with cache.

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
# Edit DATABASE_URL and ADMIN_API_KEY in .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Open `http://localhost:3000/en`. The locale switcher offers the configured locale list. Locale JSON files currently have full starter catalogs for English, Thai, Chinese, Japanese, Spanish, French, German, and Arabic. Other configured locales safely fall back to English until reviewed catalogs are added; configure the AI translation API for on-demand translation of dynamic content.

## Main routes
- `/[locale]` — home page
- `/[locale]/services` — service catalog with example THB prices
- `/[locale]/booking` — appointment request form
- `/[locale]/track-repair` — repair lookup using reference + phone
- `/[locale]/admin` — protected staff dashboard
- `POST /api/bookings` — validate and create booking
- `GET /api/repairs/track?reference=...&phone=...` — privacy-aware tracking
- `GET /api/bookings` — admin-only booking list (`x-admin-key` header)
- `PATCH /api/bookings` — admin-only status update
- `POST /api/translate` — cached AI translation fallback

## Multilingual behavior
`src/i18n/routing.ts` defines the supported locale allowlist. Locale URLs are always prefixed. `next-intl` negotiates the initial locale from the browser's `Accept-Language` header and the language switcher allows a manual override; the switcher also writes a `preferred-locale` cookie for app-level preference. Explicit locale URLs remain authoritative. Keep a locale in the allowlist only when its fallback, metadata, RTL behavior, and customer-facing translations are tested.

For new languages, add a `messages/<locale>.json` file and translate every namespace. Missing catalogs fall back to English. Add the right locale direction in `src/app/[locale]/layout.tsx` when it is RTL. For full production localization, use reviewed translation files for indexed landing pages and AI fallback for dynamic/unreviewed content, then publish reviewed translations to the cache/catalog.

## Security and production checklist
This is an application starter, not a deployed production service. Before public launch:
1. Deploy with HTTPS and managed PostgreSQL; run migrations in deployment.
2. Set a strong random `ADMIN_API_KEY` in the deployment secret manager. The included admin-key mechanism is a lightweight starter; replace it with real staff authentication (e.g. Auth.js/SSO), roles, audit logs, CSRF protections where applicable, and session management before public production use.
3. Add rate limiting / bot protection to public booking, tracking, and translation routes; consider CAPTCHA.
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
- No payment processing is wired in; add a compliant payment provider if needed.
- No live deployment, domain, credentials, messaging provider, or production authentication is included.
