# Production verification checklist

## Code checks completed
- [x] Inline JavaScript syntax check passed.
- [x] Worker TypeScript type-check passed with Cloudflare binding definitions.
- [x] Root/public HTML synchronized.
- [x] Music asset exists and matches in both locations.
- [x] Secret scan clean.
- [x] D1 category defaults seeded.
- [x] Product CRUD routes connected to D1.
- [x] Settings persist to D1 and preserve music settings.
- [x] Production order flow records orders and refreshes stock.
- [x] AI space selector calls the Worker AI endpoint with fallback.
- [x] AI plant selector loads from the live product list.
- [x] Scratch card touch/pointer handling checked.

## Required Cloudflare steps
- [ ] Confirm D1 `green-moon-db` exists and matches `wrangler.jsonc`.
- [ ] Run `npm run db:init` once against production D1.
- [ ] Set `ADMIN_TOKEN` as a Worker secret.
- [ ] Set `OPENAI_API_KEY` as a Worker secret.
- [ ] Deploy the latest GitHub commit.
- [ ] Open `/api/health` and confirm `ok:true`.
- [ ] Open `/admin` and verify product edit/delete.
- [ ] Test AI care and AI space with the secret configured.
- [ ] Test welcome speech + music on the target Android browser.
- [ ] Test one complete order and confirm it appears in D1.
- [ ] Add Cloudflare Access or equivalent protection for `/admin` before public launch.
