# Deploy + backend setup (Cloudflare Pages + D1 + Resend)

IMPORTANT: Cloudflare's dashboard drag-and-drop upload does NOT include the `functions` folder,
so orders/contact/newsletter would not work. Use ONE of these two ways:

## Way A - GitHub (recommended, auto-deploys on every change)
1. Put this folder in a new private GitHub repo.
2. Cloudflare dashboard -> Workers & Pages -> Create -> Pages -> Connect to Git -> pick the repo.
3. Build command: (leave empty). Build output directory: `/` (root). Save and Deploy.

## Way B - Wrangler (from your computer)
1. Install Node.js, then in this folder run:  `npx wrangler pages deploy . --project-name ordinary-store`
2. Log in to Cloudflare when asked. The `functions` folder is uploaded automatically.

You get a test link like `https://ordinary-store.pages.dev` - use it for testing.

## 1. Database (D1)
1. Dashboard -> Storage & Databases -> D1 -> Create database -> name `ordinary-store`.
2. Open it -> Console -> paste everything from `schema.sql` -> Run.
   (Creates orders, reviews, messages and subscribers tables. Safe to run again.)

## 2. Connect the database to the site
Workers & Pages -> your Pages project -> Settings -> Bindings -> Add -> D1 database
- Variable name: **DB** (exactly this)  - Database: ordinary-store

## 3. Email (Resend)
1. Create a free account at resend.com -> API Keys -> create a key.
2. Pages project -> Settings -> Variables and Secrets (Production) -> add:
   - `RESEND_API_KEY` = your key (Secret)
   - `ORDER_EMAIL_TO` = `tali3851377@gmail.com` (MUST be the same email you sign up to Resend with, while you have no own domain)
3. Without your own domain, Resend only delivers to the email you signed up with - fine for testing.
4. With your own domain: Resend -> Domains -> Add domain -> add the DNS records it shows
   (one click if the domain is on Cloudflare). Then also add `EMAIL_FROM` = `The Ordinary <orders@yourdomain.com>`.
   Once EMAIL_FROM is set, customers also get an order confirmation email.

## 4. Redeploy, then test
Bindings and variables apply to the NEXT deployment: redeploy once. Then test:
place one order, send one contact message, subscribe one email, post one review.

## 5. Professional URL
Pages project -> Custom domains -> Set up a domain -> enter e.g. `www.yourbrand.com`.
If the domain's nameservers are on Cloudflare it connects automatically (SSL included).
(Optional, later) Once you buy a domain, ask Claude to add the sitemap, canonical tags and share image links.

## Where you see things
- Orders: D1 -> ordinary-store -> Tables -> `orders` (change `status`: new / confirmed / shipped / delivered / cancelled). Each order also arrives by email.
- Messages: table `messages`. Subscribers: table `subscribers`. Reviews: table `reviews`
  (delete one with `DELETE FROM reviews WHERE id = '...'` in the Console).
