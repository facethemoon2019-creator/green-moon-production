# Green Moon — Fixed One-Shot

## Verified fixes
- Product add/edit/delete routes are connected to Cloudflare D1.
- Admin settings now persist to D1 instead of only localStorage.
- Existing music settings are preserved when other settings are saved.
- Music file is shipped in `public/default-music.mp3` and root/public HTML are synchronized.
- Welcome screen provides text + browser speech synthesis; music starts from the same user gesture when autoplay is allowed.
- AI plant care uses `/api/ai/care` with a local fallback.
- AI space selector calls `/api/ai/space` when OpenAI is configured and falls back safely when it is not.
- Scratch card works on touch/pointer input and stores the reward locally for the current browser.
- Product section assignment supports offers, best sellers, best savings, most requested, new, featured, plants, and vases/accessories.
- Production orders are recorded through `/api/orders` and stock is refreshed from D1 before the WhatsApp message is opened.
- Default categories are seeded automatically if missing.
- API keys remain server-side in Cloudflare secrets.

## Deployment
Cloudflare Workers serves static files from `public/` according to `wrangler.jsonc`. Keep `public/default-music.mp3` in the repository.

Required Cloudflare secret:
- `OPENAI_API_KEY` for real AI features.
- `ADMIN_TOKEN` for the admin console.

Never put an OpenAI API key in browser JavaScript or GitHub source.
