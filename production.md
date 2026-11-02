# Production setup — Lobaloba Deluxe

This guide takes the project from a working local copy to a live store. It covers the production database, email through Resend, payments, deployment and the checks to run before launch.

Work through the sections in order. Each one ends with a quick check, so problems surface early.

---

## 0. What you need

| Account / tool | Used for |
| --- | --- |
| Supabase project (paid plan recommended for daily backups) | Database, customer accounts, image storage |
| Resend account and access to your domain's DNS | All emails: order, quotation, newsletter, sign-up verification and password reset |
| Paystack business account (verified for live payments) | Card, bank transfer and USSD payments |
| Vercel account (or any Node.js host) | Hosting the Next.js app |
| Node.js 22+, Supabase CLI, Git | Building and running migrations from your computer |

Decide your production domain now, for example `lobalobadeluxe.com`. It is used in many of the settings below. This guide writes it as `https://<domain>`.

---

## 1. Supabase (database, auth, storage)

### 1.1 Create the project and apply the schema

1. In the Supabase dashboard, create a new project. Choose a region close to your customers (e.g. `eu-west` or `af-south` if available) and save the database password.
2. Link the project and push the migrations from your computer:

   ```bash
   supabase login
   supabase link --project-ref <project-ref>     # the ref is in the project URL
   supabase db push                               # applies everything in supabase/migrations
   ```

   This creates all tables, row-level security policies, the `media` storage bucket, the payment and search functions, and the default store content (categories, shipping zones, Asoebi packages, FAQs, policies).

3. **Optional — demo catalogue.** Load it only if you want sample products while you prepare real ones:

   ```bash
   psql "<connection string from Project Settings → Database>" -f supabase/seed.sql
   ```

   The demo products and articles are flagged `is_demo` and can be removed later in one step (see section 6).

### 1.2 Collect the API keys

Go to **Project Settings → API** and copy:

| Supabase value | Environment variable |
| --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` / publishable key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` / secret key | `SUPABASE_SERVICE_ROLE_KEY` (**server only — never expose it or commit it**) |

### 1.3 Auth URL settings

Go to **Authentication → URL Configuration**:

- **Site URL:** `https://<domain>`
- **Redirect URLs:** add `https://<domain>/auth/confirm`. If you use Vercel preview deployments, also add `https://*-<your-team>.vercel.app/auth/confirm`.

Then go to **Authentication → Providers → Email** and make sure **Confirm email** is turned on. The store requires customers to verify their email address.

Auth emails (verification and password reset) are sent through Resend. You will connect that in section 2.4.

**Check:** the Table Editor shows the tables, and **Storage** shows a public `media` bucket.

---

## 2. Resend (email notifications)

The app sends two kinds of email, and both go out through Resend.

| Type | Sent by | Examples |
| --- | --- | --- |
| **Transactional** | The Next.js app, through the Resend API (`lib/email/send.ts`) | Order confirmation, payment received, processing, dispatched, out for delivery, delivered, cancelled, refunded, restock alerts, quotation received/issued/accepted, quotation payment link, newsletter confirmation, admin alerts (new order, new quotation, contact message) |
| **Account** | Supabase Auth, through Resend SMTP | Sign-up email verification, password reset, email-address change |

### 2.1 Verify your sending domain

1. Sign in to https://resend.com and go to **Domains → Add Domain**.
2. Use a subdomain dedicated to sending, for example `mail.lobalobadeluxe.com`. This keeps your main domain's email reputation separate.
3. Resend shows several DNS records: SPF (TXT), DKIM (TXT, `resend._domainkey…`) and an MX record for bounces. Add **exactly** those records at your DNS provider (Cloudflare, Namecheap, GoDaddy, etc.).
4. Recommended: add a DMARC record on your root domain if you don't have one, e.g.
   `TXT  _dmarc  "v=DMARC1; p=none; rua=mailto:dmarc@lobalobadeluxe.com"`
5. Back in Resend, click **Verify**. DNS changes can take from a few minutes to a few hours. Wait until the domain shows **Verified**.

### 2.2 Create an API key

1. Go to **API Keys → Create API Key**.
2. Name it, for example, `lobaloba-production`, with permission **Sending access**, restricted to your verified domain.
3. Copy the key (it starts with `re_`). It is shown only once.

### 2.3 Configure the app

Set these environment variables in production (section 4):

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM="Lobaloba Deluxe <orders@mail.lobalobadeluxe.com>"   # must be on the verified domain
ADMIN_NOTIFICATION_EMAIL=orders@lobalobadeluxe.com              # fallback inbox for admin alerts
```

After the site is live, finish the setup in **Admin → Settings**:

- **Email configuration → Reply-to address:** where replies from customers should land, e.g. `contact@lobalobadeluxe.com`.
- **Store & notifications → Admin notification email:** receives new-order, quotation and contact-form alerts. It overrides `ADMIN_NOTIFICATION_EMAIL`.
- **Business → Business email:** shown on the website.

The admin Settings page also shows whether `RESEND_API_KEY` is configured and which "from" address is in use.

> If `RESEND_API_KEY` is missing, the app does not fail. Emails are skipped and a warning is written to the server logs (`[email] RESEND_API_KEY not set — skipped …`). Always confirm the key is set in production.

### 2.4 Send Supabase Auth emails through Resend (SMTP)

Supabase's built-in email sender is only for testing: it is heavily rate-limited and sends only to team members. Point Supabase at Resend SMTP instead.

1. In Supabase, open **Project Settings → Authentication → SMTP Settings** (or **Authentication → Emails → SMTP Settings**) and enable **Custom SMTP**:

   | Field | Value |
   | --- | --- |
   | Sender email | `accounts@mail.lobalobadeluxe.com` (on the verified domain) |
   | Sender name | `Lobaloba Deluxe` |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | your Resend API key (`re_…`) |

2. Under **Authentication → Rate Limits**, raise the email limit to a sensible value for your traffic (for example 100 per hour).

3. Install the branded templates. Go to **Authentication → Emails → Templates** and, for each template below, set the subject and paste the HTML from the repository:

   | Supabase template | Subject | File |
   | --- | --- | --- |
   | Confirm signup | Confirm your Lobaloba Deluxe account | `supabase/templates/confirmation.html` |
   | Reset password | Reset your Lobaloba Deluxe password | `supabase/templates/recovery.html` |
   | Change email address | Confirm your new email address | `supabase/templates/email_change.html` |

   These templates link to `https://<domain>/auth/confirm?token_hash=…`. That route verifies the token, signs the customer in and sends them to their account (or to the "choose a new password" page for resets). Keep the `{{ .SiteURL }}` and `{{ .TokenHash }}` placeholders unchanged.

### 2.5 Test email delivery

After deployment (section 4):

1. Register a new account with an address you can check. You should receive **"Confirm your Lobaloba Deluxe account"**. Click the link and you should land signed in on `/account`.
2. Use **Forgot your password?** and confirm the reset email arrives and its link works.
3. Subscribe to the newsletter in the footer and confirm the email arrives.
4. Submit the contact form. The admin notification address should receive an alert.
5. Place a test order with Paystack test keys (section 3). You should receive **Order confirmed** and **Payment received**.
6. In **Admin → Orders**, change that order to *Processing*, then *Shipped* with a tracking number. Each change should send an email.
7. Check **Resend → Emails** to confirm each message shows *Delivered*. If one shows *Bounced* or *Complained*, the log there explains why.

**Troubleshooting**

| Symptom | Likely cause |
| --- | --- |
| No emails at all, and the server logs say `RESEND_API_KEY not set` | Env var missing, or the app wasn't redeployed after adding it |
| Resend error *"domain is not verified"* | `EMAIL_FROM` isn't on the verified domain, or DNS is still propagating |
| Order emails work but sign-up emails don't arrive | Supabase custom SMTP not enabled or wrong credentials. Check **Authentication → Logs** |
| Verification link says *invalid or expired* | Supabase Site URL or redirect URL doesn't match your domain, or the template placeholders were changed |
| Emails land in spam | Missing DKIM/SPF/DMARC records. Re-check Resend's domain page |

---

## 3. Paystack (payments)

1. In the Paystack dashboard, go to **Settings → API Keys & Webhooks**.
2. Start with the **test** keys:
   `PAYSTACK_SECRET_KEY=sk_test_…`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_…`
3. Set the **Test Webhook URL** to `https://<domain>/api/paystack/webhook`.
4. Once testing is complete and your business is verified for live payments, switch to the live keys (`sk_live_…`, `pk_live_…`) and set the **Live Webhook URL** to the same address. Redeploy after changing keys.
5. In **Admin → Settings → Payment configuration**, choose the payment channels to offer. They must also be enabled on your Paystack account.

How payments stay safe:

- Orders are priced and created on the server.
- An order is marked paid only after the server verifies the transaction with Paystack's API. This happens on the return page *and* in the signed webhook.
- Duplicate webhooks are ignored, and stock is deducted exactly once.

---

## 4. Build and deploy

### 4.1 Environment variables

Set all of these in your hosting provider for the **Production** environment. Use the same names as `.env.example`.

| Variable | Example | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://lobalobadeluxe.com` | No trailing slash. Used in emails, payment callbacks, sitemap and canonical URLs |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ…` / `sb_publishable_…` | |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ…` / `sb_secret_…` | Server only |
| `PAYSTACK_SECRET_KEY` | `sk_live_…` | Server only |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | `pk_live_…` | |
| `RESEND_API_KEY` | `re_…` | Server only |
| `EMAIL_FROM` | `Lobaloba Deluxe <orders@mail.lobalobadeluxe.com>` | Must be on the verified Resend domain |
| `ADMIN_NOTIFICATION_EMAIL` | `orders@lobalobadeluxe.com` | Optional fallback |

> **Important:** `NEXT_PUBLIC_*` values are embedded at **build time**. `NEXT_PUBLIC_SUPABASE_URL` is also used to allow product images from Supabase Storage. If you change any `NEXT_PUBLIC_*` value, you must **rebuild and redeploy**, not just restart.

### 4.2 Option A — Vercel (recommended)

1. Push the repository to GitHub, GitLab or Bitbucket.
2. In Vercel, click **Add New → Project**, import the repository, and accept the detected Next.js settings. The build command is `npm run build`.
3. Add the environment variables from 4.1 under **Settings → Environment Variables** (Production; also Preview if you want working preview deployments).
4. Click **Deploy**.
5. Under **Settings → Domains**, add `lobalobadeluxe.com` (and `www`). Create the DNS records Vercel shows and wait for the certificate.
6. Make sure `NEXT_PUBLIC_SITE_URL` matches the final domain, then redeploy if you changed it.

### 4.3 Option B — your own server (VPS / Docker host)

```bash
git clone <repo> lobaloba && cd lobaloba
npm ci
# create .env.production.local with the variables from 4.1
npm run build
npm run start            # serves on port 3000
```

- Run it under a process manager such as `pm2 start npm --name lobaloba -- start`, or a systemd service.
- Put a reverse proxy in front (Nginx or Caddy) for HTTPS. It must forward the `Host` and `X-Forwarded-Proto` headers.
- Allow request bodies of at least **12 MB**, so admins can upload product images.
- For more detail, see `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md`.

### 4.4 Verify the build before deploying (optional but recommended)

```bash
npm run typecheck
npm run lint
npm run build
```

All three should finish without errors.

---

## 5. First administrator

From your computer, using the **production** values, create the owner's dashboard account:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
node scripts/create-admin.mjs owner@lobalobadeluxe.com '<strong-password>' "Owner Name" admin
```

Then sign in at `https://<domain>/account/login` and open `/admin`.

To add staff later:

- Have them register on the site, then change their role in **Admin → Customers → (person) → Account access**, or
- Run the same script with `staff` as the last argument.

Staff can use the dashboard but cannot issue refunds, change payment or business settings, or manage roles.

---

## 6. Prepare the store content

In the admin dashboard:

1. **Settings → Business:** name, email, phone, **WhatsApp number** (digits with country code, e.g. `2348012345678`), address and opening hours.
2. **Settings → Social media links**, then **Store & notifications** and **Email configuration** (section 2.3).
3. **Website content:** announcement bar, homepage hero (upload a real photo), homepage sections and policy pages (shipping, returns, privacy, terms, fabric care, yardage guide).
4. **Shipping:** review every zone and rate. The defaults are placeholders, not business rules.
5. **Categories / Collections / Products:** upload real photography and set prices, purchase units, colours, variants and stock.
6. **Journal & FAQs:** publish your first articles and review the FAQs.
7. **Settings → Demo data → Remove all demo data** once your real products are ready. Alternatively, run `supabase/demo/remove_demo_data.sql`.

---

## 7. Go-live checklist

- [ ] `https://<domain>` loads over HTTPS, and `/sitemap.xml` and `/robots.txt` use the real domain
- [ ] Register → the verification email arrives (via Resend) → the link signs you in
- [ ] Password reset email arrives and works
- [ ] Test purchase with Paystack **test** keys: payment completes, the order shows **Payment Confirmed**, stock drops, and both order emails arrive
- [ ] Paystack dashboard shows the webhook delivered with HTTP 200
- [ ] Order status changes in the admin send customer emails; `/track` works with order number + email
- [ ] Asoebi quotation: request → admin sends quote (email arrives) → customer accepts → admin converts → payment link email arrives
- [ ] Admin alerts arrive at the admin notification address
- [ ] Demo data removed and real products live
- [ ] Switched to **live** Paystack keys, set the live webhook URL, and redeployed
- [ ] Supabase backups enabled (daily backups / point-in-time recovery on your plan)
- [ ] Resend domain shows SPF, DKIM and DMARC as verified

---

## 8. Ongoing operations

- **Schema changes:** add a new file in `supabase/migrations/`, test it locally (`supabase db reset`), then run `supabase db push` against production *before* deploying the code that depends on it.
- **Logs:** check Vercel → Logs (or your server logs) for `[email]`, `[checkout]` and `[paystack-webhook]` entries; Resend → Emails for delivery status; Supabase → Logs for auth and database errors.
- **Failed webhooks:** they are recorded in the `payment_webhook_events` table with status `failed` and are retried automatically by Paystack. A retry is processed safely because confirmation is idempotent.
- **Rotating secrets:** create a new key in Resend, Paystack or Supabase → update the environment variable → redeploy → revoke the old key.
