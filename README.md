# Green Moon — Production Full-Stack

## What is included
- Premium Green Moon storefront UI.
- Cloudflare Worker API.
- D1 database schema for products, categories, orders, reviews, flash offers and settings.
- Server-side order pricing and stock validation.
- Wholesale/cost fields stored only in D1 and never returned by the public store API.
- AI endpoints for space analysis and plant doctor.
- Admin-only endpoints for settings/products/offers/reviews.
- Frontend can fall back to local demo data if the backend is not configured.

## Required deployment configuration
1. Create a Cloudflare D1 database named `green-moon-db`.
2. Put its ID in `wrangler.jsonc`.
3. Run `npm run db:init`.
4. Set Worker secrets:
   - `ADMIN_TOKEN`
   - `OPENAI_API_KEY`
5. Deploy with `npm run deploy`.

## Important production hardening
The demo UI is retained as the visual shell. The admin UI should be wired to the admin endpoints and protected with Cloudflare Access or an equivalent real authentication layer before public production use. Never put OpenAI or admin secrets in frontend JavaScript.

## Magazine music
The magazine includes a controlled background-music player. Music configuration is stored server-side through `/api/admin/magazine-music`. In production, upload the selected audio file to R2 and save its public/authorized URL in the music settings. Browser autoplay with sound can be blocked; the UI provides a one-tap fallback.

## Admin console
Open `/admin` on the deployed Worker. Set the `ADMIN_TOKEN` Worker secret before use. Customer APIs do not return wholesale/cost fields.


## New production UX
- Customer-facing gear button removed.
- Admin is available at `/admin` and API operations remain protected by `ADMIN_TOKEN`.
- Products support multiple storefront sections stored in `care_json._sections`.
- Welcome gate starts music from a user gesture; this is required by mobile browser autoplay policies.
- Music settings are stored server-side through `/api/admin/magazine-music`.
