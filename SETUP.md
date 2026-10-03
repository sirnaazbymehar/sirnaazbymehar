# Sirnaaz by Mehar — going live on Netlify + Supabase (free tiers)

You need three free accounts: **Supabase**, **GitHub** and **Netlify**. You already own the domain.
Nothing here asks for a card. Allow about an hour. Values in `CAPITALS` are placeholders.

---

## 1. Supabase — database and photo storage

1. Sign up at supabase.com → **New project**.
   - Region: **Mumbai (ap-south-1)** (closest to your customers).
   - Database password: generate a strong one and save it in a password manager.
2. **Create the tables, settings and photo bucket:**
   - Left menu → **SQL Editor** → **New query**.
   - Open `supabase/setup.sql` from this project, copy **everything**, paste, press **Run**.
   - The result is a 9-row check list. **Every row must say `OK`.**
   - The script is **safe to run again** at any time: it only adds what is missing and never deletes or changes
     your data. Messages like `relation "…" already exists, skipping` are normal on a re-run.
   - OPTIONAL: run `supabase/sample-products.sql` the same way for 12 illustrated example products
     (also safe to re-run). You can delete them later in Admin → Products.
   - Not sure what is already set up? Run `supabase/diagnose.sql` — it only reads, and lists what exists.
3. **Check the photo bucket:** left menu → **Storage**. You should see `product-images`, marked **Public**.
   Don't add any policies to it — uploads only work through the website's admin.
4. **Copy three values** (you'll paste them into Netlify in step 3):

| What | Where in Supabase | Looks like |
|---|---|---|
| Project URL | **Settings → Data API** (or the **Connect** button) | `https://abcdefghij.supabase.co` |
| Secret key | **Settings → API Keys** → *Secret keys* (the `sb_secret_…` key). An older project may show `service_role` instead — that also works. | `sb_secret_…` |
| Database connection string | **Connect** (top of the dashboard) → **Transaction pooler** → copy, then replace `[YOUR-PASSWORD]` with your database password | `postgresql://postgres.abcdefghij:…@aws-0-ap-south-1.pooler.supabase.com:6543/postgres` |

> The secret key and the connection string are **server-only secrets**. They go into Netlify's environment
> variables and nowhere else — never into a file you share, never into GitHub.

OPTIONAL (stronger database encryption check): **Settings → Database → SSL Configuration → Download certificate**,
open the file in a text editor, and paste its whole contents as `DATABASE_CA_CERT` in step 3.

## 2. GitHub — where Netlify gets the code

1. Sign up at github.com → **New repository** → make it **Private**.
2. Upload this project folder's contents (drag-and-drop works). The included `.gitignore` already leaves out
   `node_modules`, `dist`, `.netlify` and any `.env` file.

## 3. Netlify — the website and its API

1. Sign up at netlify.com → **Add new project → Import an existing project → GitHub** → choose the repository.
2. Build settings are read from `netlify.toml` automatically:
   build command `npm run build`, publish directory `dist`, functions `netlify/functions`.
3. Before the first deploy, open **Site configuration → Environment variables → Add a variable** and add:

| Key | Value | Secret? |
|---|---|---|
| `DATABASE_URL` | the Transaction pooler string from step 1 | **yes** |
| `SUPABASE_URL` | the Project URL from step 1 | no (it appears in photo addresses) |
| `SUPABASE_SERVICE_ROLE_KEY` | the `sb_secret_…` key from step 1 | **yes** |
| `STORAGE_BUCKET` | `product-images` | no |
| `PUBLIC_URL` | `https://www.YOURDOMAIN` (use the `…netlify.app` address until the domain is connected) | no |
| `ADMIN_SETUP_TOKEN` | a long random code you make up (30+ characters), used once to create your admin login | **yes** |
| `DATABASE_CA_CERT` | OPTIONAL — the certificate text from step 1 | no |
| `RESEND_API_KEY`, `MAIL_FROM` | OPTIONAL — only if you set up email (see "Email" below) | key: **yes** |

   None of these start with `VITE_`, so none of them can end up in the website's JavaScript (this was tested).

4. **Deploy.** When it finishes, open `https://YOUR-SITE.netlify.app` — you should see the shop.

## 4. Create your admin login (once)

1. Open `https://YOUR-SITE.netlify.app/admin`. Because no admin exists yet, it shows **Create the admin account**.
2. Enter the `ADMIN_SETUP_TOKEN` code, your name, your email and a password of 12+ characters.
3. You're signed in. This setup screen now closes permanently — nobody else can use it, even with the code.
4. OPTIONAL but tidy: delete the `ADMIN_SETUP_TOKEN` variable in Netlify afterwards.

Then: **Admin → Settings** (check email, stores, shipping, COD; write your shipping and return policies),
**Admin → Products → + Add product** (photos straight from your phone are fine — they're resized automatically),
and place a test Cash-on-Delivery order, then cancel it in **Orders** (cancelling returns the stock).

## 5. Your domain (when you're ready)

In Netlify: **Domain management → Add a domain** → enter `www.YOURDOMAIN` and also add `YOURDOMAIN`.
Netlify shows the exact records to create. At the company where you bought the domain, add:

| Type | Host / Name | Value |
|---|---|---|
| CNAME | `www` | `YOUR-SITE.netlify.app` |
| ALIAS / ANAME / flattened CNAME (if your provider offers it) | `@` (root) | `apex-loadbalancer.netlify.com` |
| **or** A (if it doesn't) | `@` (root) | `75.2.60.5` |

- Delete any old `A`/`CNAME` records for `@` and `www` that point elsewhere (keep email records such as MX/TXT).
- Make **www** the primary domain in Netlify; the bare domain then redirects to it.
- HTTPS certificates are issued automatically once DNS is correct. Changes can take up to 24 hours.
- Afterwards set `PUBLIC_URL` to `https://www.YOURDOMAIN` and redeploy (Deploys → Trigger deploy).
- Always confirm the values in Netlify's "Pending DNS verification" box — they are the source of truth for your site.

## 6. Email (OPTIONAL, free)

Without email everything works, except customers can't reset a forgotten password themselves
(the page asks them to contact you). To turn it on: create a free Resend account (resend.com), verify your
domain there, create an API key, add `RESEND_API_KEY` and `MAIL_FROM` (e.g. `Sirnaaz by Mehar <orders@YOURDOMAIN>`)
in Netlify, and redeploy. Order confirmation emails start at the same time.

## Day-to-day

- **Adding or editing products, orders, settings never needs a deploy** — they're saved in the database instantly.
- A deploy happens each time code changes on GitHub. On Netlify's free plan each deploy uses 15 of 300 monthly
  credits (≈20 a month), so group code changes together.
- **Backups:** the Supabase free plan has no automatic backups. Once a week: Supabase → **Table Editor** →
  `orders` → **Export → CSV** (and `order_items`). Keep the files somewhere safe.
- **Pausing:** a Supabase free project pauses after a week with no activity. Normal shop visits count as activity.
  If it ever pauses, the site shows "We'll be right back"; open Supabase and click **Restore project**.

## Troubleshooting

| You see | Do this |
|---|---|
| "We'll be right back" on the site | Supabase may be paused or `DATABASE_URL` is wrong. Check the project is running, and that the string uses port `6543` with your real password. |
| Photos won't upload | Check `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and that the `product-images` bucket exists. |
| Netlify function log mentions "prepared statement" | Use the **Session pooler** string (port 5432) from Supabase → Connect instead, and redeploy. |
| Admin setup screen doesn't appear | It only appears while `ADMIN_SETUP_TOKEN` is set (30+ chars recommended, minimum 24) and no admin exists. |
| Forgot the admin password | On a computer with Node.js: put `DATABASE_URL` in a `.env` file, then run `ADMIN_PASSWORD='new long password' npm run create-admin -- you@example.com "Mehar"`. |

## Running it on your own computer (developers)

```bash
npm install
cp .env.example .env            # fill in the values (a free Supabase project works for testing)
npm run dev                     # Netlify dev server: website + API at http://localhost:8888
```

Without a Supabase project you can test photo uploads against the local stand-in:
`MOCK_SERVICE_KEY=dev-service-key node scripts/dev/mock-supabase-storage.mjs`
with `SUPABASE_URL=http://localhost:54321` and `SUPABASE_SERVICE_ROLE_KEY=dev-service-key` in `.env`.
