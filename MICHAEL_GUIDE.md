# MT Asphalt — Your New Website & Dashboard

Hi Michael — here's everything your new system does, in plain English.

You now have **two things that work together**:

1. **Your public website** — what customers see. It shows off your 22 years, your
   4.9-star reputation, your license, your services, and makes it dead-simple for people to
   **tap and call you** or request a free estimate.
2. **Your dashboard** — your private control room. Every estimate request from the website lands
   here automatically, and you run the whole business from it.

---

## Getting it running

Someone technical only needs to do this once:

```
cd app
npm install
npm run dev
```

Then open the address it shows (usually `http://localhost:5173`).

- Your website is the front page.
- Your dashboard is at `/dashboard`. You sign in with **your Google account** — no password to
  remember or lose. Only Google accounts you've approved can get in; see **Signing in** below
  for how that's set up.

---

## Signing in (one-time setup for whoever deploys this)

The dashboard uses **Sign in with Google** instead of a password — nothing for Michael to
remember, and it's locked to specific approved Google accounts, so a stranger who finds the URL
can't get in even if they guess it.

To turn it on, the person deploying the site needs to do this once:

1. Go to [console.cloud.google.com](https://console.cloud.google.com/), create (or pick) a
   project, then **APIs & Services → OAuth consent screen** — fill in the app name ("MT Asphalt
   Dashboard") and Michael's email as the support contact.
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID**, type **Web
   application**. Under **Authorized redirect URIs**, add:
   - `https://<the-live-domain>/api/auth/google-callback`
   - `http://localhost:3000/api/auth/google-callback` (only needed for local testing)
3. Copy the **Client ID** and **Client secret** it gives you.
4. In Vercel → the project → **Settings → Environment Variables**, add:
   - `GOOGLE_CLIENT_ID` — the client ID from step 3
   - `GOOGLE_CLIENT_SECRET` — the client secret from step 3
   - `SESSION_SECRET` — any long random string (generates the login sessions)
5. Redeploy. Michael's own address (`mtasphalt72@gmail.com`) is already approved by default. To
   approve anyone else, add an `ADMIN_EMAILS` environment variable with their address (comma-
   separated if more than one) and redeploy.

Once that's done, Michael (and anyone else approved) just clicks **Sign in with Google** on
`/dashboard` and picks their account.

---

## What your dashboard can do (A–Z)

- **Command Center** — your morning glance: money this month, jobs happening now, new leads
  waiting, what needs attention, and even whether the **weather is good for paving** this week.
- **Leads** — every estimate request, with one-tap Call and buttons to move them from "new" to
  "won."
- **Jobs** — a board of every job from first estimate all the way to "paid." Tap any job to see
  the crew, equipment, location, and profit.
- **Schedule** — the next 10 days, with a heads-up when rain means you shouldn't be laying asphalt.
- **Customers** — everyone you've worked for and what they're worth to the business.
- **Invoices** — build a clean, branded invoice in a minute and print it or save it as a PDF.
- **Contracts** — generate a proper California paving contract with your license, warranty, and
  signature lines.
- **Finance** — see profit by month, which services make you the most, and who owes you money.
- **Crew, Fleet, Materials** — who's available, which machines need service, and when to reorder
  sealer or paint.
- **Reviews** — your 4.9-star wall; add or hide the testimonials that show on your website.
- **Website (CMS)** — change your headline, your story, your services, even your colors, and it
  updates the website **instantly**. No developer needed.
- **Settings** — your phone, address, license number, service cities, tax rate — all editable.

---

## The important part

**Nothing is stuck.** Your phone number, company name, services, prices, and which city you feature
are all editable from the dashboard — change your mind anytime and the website updates itself.

Everything is built mobile-first, so it looks and works great from your phone on a job site.

Questions or changes? The full technical details are in **`app/README.md`**.
