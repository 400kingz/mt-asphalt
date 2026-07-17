# MT Asphalt — Operations Platform

An all-in-one, mobile-first web app for **MT Asphalt** (Michael Tebb · Anaheim, CA · CSLB #836341):

- **Public landing site** — a customer-facing marketing site that turns visitors into leads.
- **Owner's dashboard** (`/dashboard`) — run the whole business from one screen: leads, jobs, scheduling, customers, invoices, contracts, crew, fleet, materials, reviews, finances, and a live website CMS.

Both live in one codebase and share one data layer, so a lead captured on the website appears in the dashboard instantly.

---

## Quick start

```bash
cd app
npm install
npm run dev
```

Open **http://localhost:5173**

- Public site: `/`
- Dashboard: `/dashboard` — sign in with **any password** (demo gate; see note below).

### Full-stack mode (optional)

The app persists to `localStorage` out of the box (zero config). To run it against the
included Node backend instead:

```bash
# terminal 1 — start the API + static server (no dependencies, pure Node)
npm run server            # → http://localhost:8787

# terminal 2 — run the front-end pointed at the API
VITE_API_URL=http://localhost:8787 npm run dev
```

Or build once and let the server host everything on a single port:

```bash
npm run build
npm run server            # serves app/dist + REST API at http://localhost:8787
```

REST API: `GET`/`PUT /api/db` · `GET /api/health` · `GET /api/<collection>` (jobs, leads, invoices, …).

---

## What's inside

### Public landing site (`src/public/PublicSite.tsx`)
Announcement bar · sticky header with tap-to-call · hero with an embossed **CSLB credential
plate** · trust strip · services grid · **interactive instant-estimate widget** · our-work
gallery · stylized Orange County service-area map · owner story · reviews · free-estimate form
(writes a real lead) · SEO `LocalBusiness` schema · mobile sticky call bar.

### Dashboard modules (`src/admin/pages/`)
| Module | What Michael does |
|---|---|
| **Command Center** | KPIs, revenue chart, jobs on the ground, pipeline, weather-based pave conditions, attention items, activity feed |
| **Leads** | Website/phone inquiries with a new → contacted → quoted → won/lost pipeline |
| **Jobs** | Kanban board (estimate → paid) with drag-through stages + a full job drawer (crew, equipment, map, margin) |
| **Schedule** | 10-day agenda, weather-checked for paving/sealcoat, with crew roster |
| **Customers** | CRM with lifetime value, type, and job history |
| **Invoices** | Branded, printable/PDF invoices with a builder, tax math, and aging |
| **Contracts** | Printable CA paving contracts with scope, payment schedule, warranty, signatures |
| **Finance** | P&L, monthly profit, revenue mix by service, receivables aging |
| **Crew / Fleet / Materials** | Team availability, equipment service cycles, inventory with reorder alerts |
| **Reviews** | 4.9★ reputation manager; add/hide testimonials shown on the site |
| **Website (CMS)** | Edit homepage copy, brand palette, and the services list — **live** |
| **Settings** | Company info, license, service area, tax/labor defaults, reset demo data |

### Architecture
- **React 18 + TypeScript + Vite 6**, **Tailwind CSS v4** (CSS-first theme).
- **Charts:** Recharts · **Icons:** lucide-react · **Dates:** dayjs.
- **Data tier:** `src/lib/store.tsx` — a typed repository (localStorage, optional REST sync)
  seeded from real MT Asphalt facts in `src/lib/seed.ts`.
- **Backend:** `server/index.js` — dependency-free Node HTTP server (REST + static).

### Design language
"Industrial dispatch" drawn from the trade itself: asphalt-charcoal surfaces, **highway-yellow
centerline striping** as the signature structural device, `Anton` highway-sign display type, and
`Space Mono` gauge-style data readouts. Palette derived from the official MT Asphalt logo.

---

## Notes
- **Auth is a demo gate** — any non-empty password unlocks the dashboard. Before going live,
  wire `useAuth` in `src/lib/store.tsx` to a real password hash / session on the backend.
- Gallery images and job photos are placeholders; Michael uploads real before/after shots via
  the Website CMS once photos are supplied.
- All company facts, colors, testimonials, and license details come from the research dossier in
  the parent folder and are fully editable from **Settings** and **Website (CMS)**.
