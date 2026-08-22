# Green Moon Admin Product Persistence Fix

This version fixes product Add/Edit/Delete so production mode writes to Cloudflare D1 instead of only localStorage.

## Required once
The admin UI asks for the Cloudflare Worker Secret value named `ADMIN_TOKEN` the first time you add/edit/delete a product. It is stored in the browser session only.

If you need to set/rotate it in Cloudflare:
1. Worker & Pages -> green-moon-production
2. Settings -> Variables and Secrets
3. Secret: ADMIN_TOKEN
4. Set/rotate the value to a value you know.
5. Redeploy.

Do not put the secret in GitHub or in the public frontend.
