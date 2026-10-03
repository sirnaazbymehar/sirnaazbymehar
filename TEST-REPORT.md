# Test report — Netlify + Supabase version

**Where:** Netlify's own local production server (`netlify serve`, which builds the site and runs the API as a
Netlify Function), a PostgreSQL 16 database set up from `supabase/setup.sql` with Supabase's public API roles and
default grants re-created, and a local stand-in for Supabase Storage that follows the same API and bucket rules.

## Results

| Suite | Result |
|---|---|
| Customer + admin journey (the full sequence you specified) | **45 / 45** (3 clean runs on fresh data) |
| Security (database, admin, customers, prices, stock race, storage, auth, serverless) | **51 / 51** |
| Failure handling + search, filters, wishlist | **13 / 13** |
| Visual comparison with the previous version (7 pages × desktop + mobile) | **14 / 14 pixel-identical** |
| `supabase/setup.sql` on a Supabase-like database | runs cleanly; both built-in checks return 0 rows |
| Secrets in the browser bundle (built with fake secrets set) | **none found** |
| Secrets/.env in the function bundle | **none** (after removing `dotenv`, see below) |

One earlier journey run stopped partway without saving its error; the three runs after it all passed in full.

### Highlights
- First admin created through the one-time setup; wrong code refused; setup closes permanently afterwards.
- A 20.7 MB, 4032×5376 phone photo was prepared in the browser and uploaded as a 1.2 MB file plus a thumbnail; a
  non-photo file was refused with a clear message. Product cards load the small thumbnail (≈20 KB for a real photo).
- **Stock race (your scenario):** stock 2, customer A buys 2 while B buys 1, at the same moment, 25 rounds:
  A won 17, B won 8, **never oversold**.
- 5 identical checkout submissions at once → **1 order**; a retry after a lost reply → the **same** order, stock taken once.
- Real browser: double-click "Place order" → 1 order; reply lost → shopper sees an error, closes the tab, comes back,
  presses Place order → the same order is shown, created once.
- Photo upload with storage failing halfway → product and finished photos kept, clear message, Save again completes
  without duplicates. A brief hiccup is retried automatically.
- Database stopped → API answers 503 with a friendly message, visitors see "We'll be right back"; database restarted →
  site recovers without restarting anything.
- Supabase public roles (`anon`, `authenticated`) refused on all 18 tables for read and write.
- Customer Y cannot open, list, edit or delete customer X's orders, addresses, wishlist or profile.
- Every admin endpoint refuses a customer, including with guessed IDs and a customer session pasted into the admin cookie.
- Prices, totals and discounts sent by the browser are ignored; fake coupons, bad quantities, oversized or sold-out
  purchases refused.
- Over HTTPS the session cookie is `__Host-sbm_session; Secure; HttpOnly; SameSite=Lax`; logout and expiry both end it.
- Login limits hold across two separate server instances (shared counter in the database); the check costs ~0.15 ms.
- No CREATE/ALTER/DROP statements run while visitors use the site; migration code is not in the function.

## Problems found and fixed during testing
1. `dotenv` made the bundler copy a local `.env` file into the function package. Removed; scripts now use Node's
   built-in env-file option.
2. Netlify's local server re-runs a function at `…/index.html`-style paths after a 403/404. Those paths now return
   immediately without running any code, and setup/coupon errors use non-retried status codes.
3. The cross-site check now also accepts the request's own origin (more robust on Netlify preview/custom domains).
4. Server storage calls switched to Supabase's official client so both key types (`sb_secret_…` and legacy
   `service_role`) are handled the way Supabase expects.

## Not possible to test without a live deployment
- Real **Supabase** connection pooler (transaction mode, port 6543) — expected to work with this code (no named
  prepared statements are used); SETUP.md has the fallback if it doesn't.
- Real **Supabase Storage** with your secret key, its bucket rules and CDN — tested against a faithful stand-in.
- Real **Netlify** CDN: HTTPS/HSTS, headers on your domain, function cold starts, free-plan limits.
- **Your domain's DNS** and certificate.
- **Email** (not configured; optional).
- **Real phones**: tests ran in Chromium (desktop and mobile emulation). iPhone Safari (HEIC photos, WebP support)
  should be checked once live — the code falls back to JPEG automatically.

First live check after deploying: create the admin, add one product with photos from your phone, place a COD order
from another phone, confirm it in Admin → Orders, then cancel it.
