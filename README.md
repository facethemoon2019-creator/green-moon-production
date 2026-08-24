# Green Moon — Production Full-Stack (Verified One-Shot)

## Included
- Cloudflare Worker API + D1 database.
- Customer storefront with product sections and fast static assets.
- Product CRUD: add, edit, delete, price, stock, category and section assignment.
- Server-side order recording and stock validation.
- AI plant-care, plant-doctor and AI space recommendations through OpenAI Responses API.
- Local fallbacks where practical if AI is unavailable.
- Scratch card with touch/pointer scratching and one-time browser reward state.
- Welcome screen with English text + browser voice, then music from the same user gesture when allowed.
- Admin-controlled music URL, volume, enable/disable, autoplay-after-welcome and loop.
- Customer-facing settings/gear removed; admin is available at `/admin`.
- Static music asset included at `public/default-music.mp3`.

## Cloudflare configuration
1. Bind the D1 database `green-moon-db` in `wrangler.jsonc`.
2. Apply `001_init.sql` with `npm run db:init`.
3. Create Cloudflare Worker secrets:
   - `ADMIN_TOKEN`
   - `OPENAI_API_KEY`
4. Deploy with `npm run deploy`.

Cloudflare Workers serves files from `public/` according to the Wrangler `assets.directory` configuration. Static assets are cached by Cloudflare. citeturn0search1turn0search2

## Important security note
Never put an OpenAI API key in browser JavaScript, HTML, GitHub source, or a mobile app. Keep it as a server-side secret. citeturn0search9

The AI uses `gpt-5.6-luna` through `/v1/responses`, which supports text and image input. citeturn1search0turn1search2

## Browser audio note
Mobile browsers can block autoplay with sound. The welcome button is intentionally the user gesture that starts speech and music; a visible music control remains available as a fallback.

## Verification performed on this package
- JavaScript syntax checked for every inline script.
- Worker TypeScript checked against Cloudflare binding stubs.
- `index.html` and `public/index.html` synchronized.
- Music asset exists in both required locations and matches by SHA-256.
- No OpenAI/API secret was found in the project files.


## Green Moon company profile
- Customer-facing company profile now supports company overview, history, founded year, mission, vision, values, services, quality/customer care, B2B services, owner bio and address.
- All company profile fields are editable from Admin → Settings and are stored in D1.
- Plant care opens in its own product-specific modal instead of the company profile.
- Checkout smart add-ons are validated server-side and use the configured delivery fee.
- Delivery is configurable from Admin → Settings and defaults to 50 EGP; there is no automatic free-shipping threshold.
