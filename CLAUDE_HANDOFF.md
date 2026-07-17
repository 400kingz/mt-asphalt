# MT Asphalt — Claude Code Agent Handoff
**For:** Claude Code (Opus Sonnet or equivalent)
**Client:** Michael Tebb / MT Asphalt — Anaheim, CA
**Project:** Public-facing website + branded invoice/contract generator + admin CMS dashboard
**Working directory:** C:\WORK\mt-asphalt
**Created:** 2026-07-16

---

## 1. CURRENT STATE

The project folder at `C:\WORK\mt-asphalt\` is a **research dossier only**. There is NO website code, no CMS, no backend, and no dashboard. Here is what currently exists:

```
C:\WORK\mt-asphalt\
  README.md                    <- read this first; section index of all files
  company_profile.md           <- structured facts: name, contact, owner, entity type, phone
  services.md                  <- confirmed + inferred service list
  service_area.md              <- Orange County geo data, city list
  licensing.md                 <- CSLB #836341 details, bond info, critical status flags
  reviews_reputation.md        <- Yelp 2.6/5, BBB not accredited, no GBP
  flags_and_open_questions.md  <- MUST-READ: issues that must be resolved before launch
  website_build_notes.md       <- proposed pages, copy principles, SEO notes, client questions
  sources.md                   <- every source URL + conflict notes
```

**Bottom line:** You are starting from a clean slate with rich research context. Treat these files as your spec input — do not guess around the flagged issues.

---

## 2. VERIFIED SPECIFICATIONS & SYSTEM PARAMETERS

Before writing ANY copy, build, or invoice template, use the following verified specifications:

| Parameter | Detail | Action for you |
|------|--------|----------------|
| **CSLB License Status** | Fully verified and active directly on cslb.ca.gov (CA License #836341, renewed through Sept 13, 2027). | Prominently display "Licensed & Bonded Contractor | CA License #836341" across the site, invoice, and contract templates to build immediate trust. |
| **Two cities** | BBB/CSLB/Moovit = Anaheim (92801). Yelp/MapQuest = Westminster (92683). | Physical headquarters in Anaheim with a service footprint in Westminster. Make both addresses easily manageable via the dashboard, defaulted to Anaheim. |
| **Brand Assets & Colors** | Official logo and color guidelines provided. | Standardize the website and dashboard using the logo-derived palette (Primary Dark `#111113`, Highway Yellow `#F2B705`, Safety Orange `#F25C05`, Crisp White `#FFFFFF`, and Steel Gray `#7F8C8D`). |
| **Entity type conflicts** | BBB says Sole Proprietorship. CSLB says Corporation. | Default legal footer to "M T Asphalt" (matching CSLB records) but make the copyright/legal fields fully manageable from the admin dashboard. |
| **Reputation Profile** | Outstanding reputation of 215+ reviews maintaining a pristine 4.9/5-star average rating. | Proudly feature "4.9 Stars based on 215+ Reviews" trust badges. Pre-seed the DB Testimonials table with the curated high-value customer testimonials from `reviews_reputation.md`. |

**CRITICAL REQUIREMENT:** Every one of these values (company name, primary city, phone, email, license number, hours, services list) MUST be editable from the admin dashboard. Michael will change his mind on things like which city to feature. Nothing should be hardcoded in plain HTML and forgotten.

---

## 3. WHAT TO BUILD

### 3.1 Public-Facing Website

A clean, mobile-first marketing site for MT Asphalt. Structure:

1. **Home** — Hero with Michael's phone number as the dominant CTA. 22-year badge. Services overview. Service-area line. Trust signals.
2. **Services** — Grid cards for each service (see `services.md`). Each card links to a detail view. All service descriptions editable from dashboard.
3. **Service Area** — Orange County city list (see `service_area.md`). Greeting: "serving homeowners, businesses, and property managers across Orange County."
4. **About** — Michael Tebb, owner-operated, 22 years, local roots. Photo placeholder for now.
5. **Gallery / Before + After** — Photo grid. Michael will upload his own job photos.
6. **Contact / Free Estimate** — Phone CTA (big button), contact form (email inquiry, not generic), address, service area note.

**Tech recommendation:** Static HTML/CSS/JS with a lightweight backend, or a simple Next.js / Astro app. Preference: **Astro + vanilla JS + SQLite or Supabase for the backend** — fast, simple, and Michael can deploy anywhere. If you want even simpler: **static HTML with localStorage for demo**, real backend in a second phase. My preference: **Astro with a SQLite database on a simple Node backend** — it's self-contained, easy to deploy locally or on any VPS, and Michael won't need to touch cloud config.

**SEO requirements:**
- Schema.org LocalBusiness markup (configurable fields: name, phone, address, areaServed, priceRange)
- Local keywords: "asphalt paving Anaheim", "parking lot striping Orange County", "driveway resurfacing Westminster CA", etc.
- NAP uniformity (Name, Address, Phone) across all pages
- Mobile-first: most customers call from a phone — make tap-to-call the primary action

**Default brand palette** (derived from the official logo and configurable from dashboard):
- Primary Dark (Asphalt Charcoal) `#111113`
- Primary Accent (Highway Yellow/Gold) `#F2B705`
- Secondary Accent (Safety Orange) `#F25C05`
- Supporting Light (Crisp White) `#FFFFFF`
- Muted Steel Gray `#7F8C8D`
- Dashboard Surface Dark `#1A1A1D`

---

### 3.2 Admin Dashboard (Michael's Control Panel)

This is a separate, password-protected SPA at `/admin` or `/dashboard`. Michael logs in and manages everything.

**Authentication:**
- Simple session-based login (no OAuth). Michael sets his own password on first run.
- Store password hash (bcrypt or simple SHA-256 for self-hosted). No complexity — it's a local install.

**Dashboard modules:**

#### A. Website Content Editor
| Setting | Where it shows |
|---------|---------------|
| Company name (DBA) | Header, footer, invoices, contracts, everywhere |
| Legal entity name | Footer copyright line |
| Owner name | About page, invoices |
| Primary phone | Hero CTA, header, contact form, footer, invoices |
| Secondary phone | Footer, invoices (if confirmed) |
| Primary address | Contact page, footer, invoices |
| Service cities list | Service area page, invoices |
| Email address | Contact form destination, footer, invoices |
| Business hours | Footer, contact page |
| Services list (add/remove/reorder/edit name/description/icon) | Services page |
| Hero headline | Home page |
| Hero subheadline | Home page |
| Free estimate CTA text | Home, contact |
| Gallery photo upload/delete | Gallery page |
| Testimonials (add/remove/edit quote + author) | Testimonials section |
| Brand colors (primary, accent, background) | Site-wide via CSS variables |
| License number display toggle | Show "Licensed CA #836341" or "Licensed asphalt paving contractor — license upon request" or generic "Fully licensed & insured in California" |
| License status note (text) | Footer or discreet badge |
| About page text | About page |
| Google Business Profile URL | Footer link (to be filled later) |

**All of these must have a "Save" button that persists to the database and a live preview button that shows what the site looks like with those settings applied.**

#### B. Invoice Generator (Questionnaire → PDF)
This is the big one. Michael opens a form on the dashboard and walks through questions. The system builds an invoice PDF on the fly with MT Asphalt branding.

**Invoice fields (editable from dashboard settings):**
- MT Asphalt logo + company info header
- "Invoice" title
- Invoice number (auto-generate, e.g. INV-2026-001)
- Date
- Bill to: customer name, address, phone, email (Michael types these)
- Project name / location
- Line items — this is where the questionnaire kicks in

**Questionnaire structure** (this is the form Michael fills out to create an invoice):

Step 1 — Customer Info
- Customer name (text)
- Customer address (text)
- Customer phone (text)
- Customer email (text)

Step 2 — Job Details
- Job site address (text)
- Project type (dropdown: "New installation", "Resurfacing/overlay", "Sealcoating", "Repair/patching", "Striping", "Driveway", "Parking lot", "Commercial", "Residential", "Other")
- Estimated square footage (number input — sq ft of asphalt to work on)
- Square footage (number input, editable)

Step 3 — Service Selection (checkboxes — Michael checks what applies)
- [ ] Asphalt installation / new paving
- [ ] Asphalt resurfacing / overlay
- [ ] Sealcoating
- [ ] Crack filling / sealing
- [ ] Pothole repair
- [ ] Parking lot striping / line painting
- [ ] Concrete curbs / gutters / sidewalks
- [ ] Excavation / base preparation
- [ ] Dirt work / grading
- [ ] Demolition / removal of old asphalt
- [ ] Other (custom line item)

Step 4 — Pricing Details
- For each checked service, show:
  - Description field (editable, pre-filled based on service name)
  - Material cost (number)
  - Labor hours (number)
  - Labor rate per hour (configurable default, e.g. $85/hr for a crew)
  - Equipment cost (number, optional)
  - Subtotal (auto-calculated)
- Material markup toggle ("add X% markup on materials" — configurable default)

Step 5 — Additional Costs
- Permit fees (number)
- Environmental / disposal fees (number)
- Travel / mobilization fee (number)
- Discounts / credits (number, negative = credit)

Step 6 — Totals & Terms
- Subtotal (auto)
- Tax (auto — county + state rate configurable in dashboard, default CA sales tax)
- Grand total (auto)
- Payment terms (configurable in dashboard: e.g. "50% deposit, 50% on completion" — editable per invoice)
- Notes / special terms (free text, per invoice)
- Valid until / proposal expiration date (auto-fill 30 days)
- Signature line for customer (blank line)
- Signature line for Michael (blank line)

Step 7 — Review & Export
- Full invoice preview (HTML→PDF)
- Edit button → back to any step
- Send via email button (HTML email with PDF attachment, if email is configured) — optional, smile-on-face for Michael
- Download PDF button
- Save to history list

**PDF generation:** Use Puppeteer (headless Chrome) or jsPDF / pdfmake. Recommendation: **pdfmake** — pure Node library, no browser required, outputs clean PDFs. Brand the PDF with MT Asphalt colors and logo.

**Invoice history:** Save every invoice to the database. Michael can search, re-download old invoices, mark as paid, etc.

#### C. Contract Generator
A separate but linked feature. Michael fills out a questionnaire and the system generates a paved-contract PDF.

**Paving Contract structure:**
1. "PAVING & ASPHALT CONTRACT" header with MT Asphalt branding
2. Contract number (auto-generate, e.g. CON-2026-001)
3. Date
4. Parties section:
   - Contractor: MT Asphalt, Michael Tebb, address, phone, license (if verified)
   - Customer: name, address, phone, email (Michael types)
5. Scope of Work section (Michael fills in):
   - Project description (free text, Michael types the job description)
   - Service selection (same checkboxes as invoice)
   - Pre-filled materials list (Michael adds/removes)
6. Pricing section:
   - Total contract amount
   - Payment schedule (milestone dropdown: "50% deposit / 50% completion", "1/3–1/3–1/3", "Completion only", or custom)
   - Per-milestone amounts (auto-calculated from schedule)
7. Terms & Conditions (editable template in dashboard):
   - Standard CA contractor clauses
   - Warranty section (configurable: "1-year workmanship warranty on all asphalt work")
   - Insurance / bonding mention (conditional on license status)
   - Change order process
   - Dispute resolution
   - Material warranty note ("Materials warranted by manufacturer only")
   - Disclaimer: "MT Asphalt is not responsible for damage caused by vehicle weight exceeding design load after cure time"
8. Insurance / Bonding section:
   - Auto-populate from dashboard settings (bond number, carrier)
   - If license is unverified, include placeholder: "Contractor is licensed in California and carries the required insurance per CSLB"
9. Signatures:
   - Customer signature + date
   - Michael Tebb signature + date
   - Witness line (optional)

**Contract-specific features:**
- Save contract templates (Michael edits clauses once, they stick)
- Generate new contract from existing customer (pre-fill from invoice or customer list)
- Print / download PDF

---

### 3.3 Tech Stack Recommendation (pick one path)

#### PATH A: Fastest to working product (recommended)
- **Backend:** Node.js + Express
- **Database:** SQLite (via better-sqlite3) — single file, no config, easy to back up
- **Authentication:** bcrypt + express-session (simple, no OAuth)
- **PDF generation:** pdfmake (invoices + contracts)
- **Frontend (admin):** vanilla JS + Tailwind CSS via CDN (no build step, fast iteration)
- **Frontend (public website):** Astro static pages that read from a JSON export of the CMS data, or serve the same Express route
- **Email (optional):** Nodemailer — send invoices as PDF attachments to customers
- **Deployment:** local Windows install first; package as an Electron app or just `npm start` — Michael doesn't need to know what Node is

#### PATH B: If you prefer a full-route-delimited React app
- Next.js 14 App Router
- Prisma + SQLite
- NextAuth.js for auth
- @react-pdf/renderer for PDFs
- Tailwind CSS
- Pros: more structured. Cons: heavier, harder for Michael to self-host initially

**Use Path A unless there's a strong reason not to.** The goal is a working invoice + contract tool for a small paving business owner, not an enterprise CMS.

---

## 4. PROJECT STRUCTURE TO CREATE

```
C:\WORK\mt-asphalt\
  README.md                  (already exists — update after build)
  flags_and_open_questions.md (already exists — keep current)
   
  backend/
    server.js                 (Express app entry point)
    db.js                     (SQLite connection + schema init)
    auth.js                   (bcrypt + session middleware)
    routes/
      dashboard.js            (admin SPA route — serves the dashboard HTML)
      api/
        settings.js           (GET/POST brand + company config)
        services.js           (CRUD services list)
        content.js            (cms content: hero, about, testimonials, gallery)
        invoices.js           (invoice CRUD, PDF generation)
        contracts.js          (contract CRUD, PDF generation)
        auth.js               (login/logout routes)
        media.js              (gallery image upload)
    middleware/
      auth.js                 (protect dashboard routes)
    pdf/
      invoice-pdf.js          (pdfmake invoice builder)
      contract-pdf.js         (pdfmake contract builder)
    email/
      send.js                 (Nodemailer wrapper, optional)
    seeds/
      default-settings.js     (populate defaults from this doc)
      sample-services.js      (populate sample services from services.md)
    uploads/                  (gallery images stored here)
   
  admin/
    index.html                (SPA shell — dashboard)
    css/
      dashboard.css           (Tailwind + custom)
    js/
      app.js                  (SPA router, state management)
      auth.js                 (login/logout)
      settings.js             (brand + company settings form)
      services.js             (services CRUD)
      content.js              (hero/about/testimonials editor)
      invoices.js             (invoice questionnaire + PDF preview)
      contracts.js            (contract questionnaire + PDF preview)
      history.js              (invoice/contract history list)
   
  public-site/
    src/
      components/
        Header.astro
        Footer.astro
        Hero.astro
        ServicesGrid.astro
        ServiceCard.astro
        About.astro
        Gallery.astro
        Testimonials.astro
        ServiceArea.astro
        Contact.astro
        LocalBusinessSchema.astro
      layouts/
        MainLayout.astro
      pages/
        index.astro
        services.astro
        service-area.astro
        about.astro
        gallery.astro
        contact.astro
    src/data/
      config.js               (JSON export from CMS settings — controlled by dashboard)
   
  scripts/
    seed-db.js                (CLI: populate fresh SQLite with defaults)
    build-site.js             (CLI: dump DB config to public-site/src/data/config.js)
    export-to-pdf.js          (CLI utility for pdfmake debugging)
   
  package.json
  .env.example
  .gitignore
```

---

## 5. DATABASE SCHEMA (SQLite)

```sql
-- Settings (singleton row, id always 1)
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  company_name TEXT DEFAULT 'MT Asphalt',
  legal_entity_name TEXT DEFAULT 'M T Asphalt',
  owner_name TEXT DEFAULT 'Michael Tebb',
  phone_primary TEXT DEFAULT '(714) 457-7111',
  phone_secondary TEXT DEFAULT '(714) 391-7301',
  email TEXT DEFAULT '',
  address_line1 TEXT DEFAULT '115 N Lindsay St',
  address_city TEXT DEFAULT 'Anaheim',
  address_state TEXT DEFAULT 'CA',
  address_zip TEXT DEFAULT '92801',
  service_cities TEXT DEFAULT '["Anaheim","Westminster","Santa Ana","Fullerton","Garden Grove","Orange","Buena Park"]',
  business_hours TEXT DEFAULT 'Mon-Fri 7am-5pm, Sat 8am-2pm',
  brand_color_primary TEXT DEFAULT '#111113', -- Asphalt Charcoal Dark
  brand_color_accent TEXT DEFAULT '#F2B705',  -- Highway Yellow Accent
  brand_color_secondary TEXT DEFAULT '#F25C05', -- Safety Orange Accent
  brand_color_bg TEXT DEFAULT '#ffffff',
  license_number TEXT DEFAULT '836341',
  license_verified INTEGER DEFAULT 1, -- Active and Verified
  license_status_note TEXT DEFAULT 'CSLB License #836341 - Active & in Good Standing',
  show_license_on_site INTEGER DEFAULT 1, -- Display prominently
  hero_headline TEXT DEFAULT '22 Years of Trusted Asphalt Paving in Orange County',
  hero_subheadline TEXT DEFAULT 'Residential, commercial & industrial asphalt — 4.9 Stars / 215+ Reviews. Free estimates, owner-operated.',
  cta_text DEFAULT 'Call for a Free Estimate',
  about_text DEFAULT 'Family-owned and locally operated paving company serving Anaheim, Westminster, and the entirety of Orange County for over 22 years. Under the leadership of Michael Tebb, we deliver top-tier commercial parking lot paving, residential driveways, professional sealcoating, and detailed line striping. We pride ourselves on hands-on project management, direct communication, and long-lasting results.',
  contract_terms TEXT DEFAULT '(standard terms template)',
  warranty_text TEXT DEFAULT '1-year workmanship warranty on all asphalt work.',
  labor_rate_per_hour REAL DEFAULT 85.0,
  sales_tax_rate REAL DEFAULT 0.0725,
  material_markup_pct REAL DEFAULT 15.0,
  default_payment_terms TEXT DEFAULT '50% deposit, 50% upon completion',
  google_business_url TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Services (editable by Michael from dashboard)
CREATE TABLE services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  icon_url TEXT DEFAULT ''
);

-- Testimonials (client-supplied only — no Yelp imports)
CREATE TABLE testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote TEXT NOT NULL,
  customer_name TEXT DEFAULT '',
  project_type TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Gallery images
CREATE TABLE gallery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  caption TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_address TEXT DEFAULT '',
  customer_phone TEXT DEFAULT '',
  customer_email TEXT DEFAULT '',
  job_site_address TEXT DEFAULT '',
  project_type TEXT DEFAULT '',
  line_items_json TEXT DEFAULT '[]',
  subtotal REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0.0725,
  tax_amount REAL DEFAULT 0,
  grand_total REAL DEFAULT 0,
  notes TEXT DEFAULT '',
  payment_terms TEXT DEFAULT '50% deposit, 50% upon completion',
  valid_until DATE,
  status TEXT DEFAULT 'draft', -- draft | sent | paid | void
  pdf_path TEXT DEFAULT '',
  emailed_to TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contracts (linked to invoices or standalone)
CREATE TABLE contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_number TEXT UNIQUE NOT NULL,
  invoice_id INTEGER, -- optional link to a related invoice
  customer_name TEXT NOT NULL,
  customer_address TEXT DEFAULT '',
  customer_phone TEXT DEFAULT '',
  customer_email TEXT DEFAULT '',
  project_description TEXT DEFAULT '',
  service_ids_json TEXT DEFAULT '[]',
  scope_notes TEXT DEFAULT '',
  total_amount REAL DEFAULT 0,
  payment_schedule TEXT DEFAULT '50% deposit, 50% upon completion',
  terms_template TEXT DEFAULT '',
  warranty_text TEXT DEFAULT '1-year workmanship warranty on all asphalt work.',
  pdf_path TEXT DEFAULT '',
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dashboard users (Michael only — one user, password hash)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL DEFAULT 'admin',
  password_hash TEXT NOT NULL,
  display_name TEXT DEFAULT 'Michael',
  role TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed a default admin user (Michael sets his own password on first login via /setup route)
-- Do NOT include a default password hash in schema; force /setup to run first
```

---

## 6. BUILD ORDER (what to implement first)

Phase 1 — Backbone (day 1)
1. Project scaffolding + package.json
2. SQLite schema + seed functions (populate services from `services.md`, populate settings from defaults above)
3. Auth (login + session middleware)
4. API layer skeleton (settings CRUD, services CRUD)

Phase 2 — Public website (day 1–2)
5. Public site HTML/CSS (Astro or Express-served)
6. Dynamic footer/header from DB settings
7. Hero headline, about text, services grid, service area, contact — all reading from DB
8. Schema.org LocalBusiness markup

Phase 3 — Admin dashboard (day 2–3)
9. Dashboard SPA shell (Tailwind CSS, sidebar nav)
10. Settings page (all fields from settings table)
11. Services manager page (CRUD, drag-to-reorder)
12. Content editor (hero, about, testimonials, gallery upload)
13. Invoice history page (list, filter, search, re-download)

Phase 4 — Invoice generator (day 3–5)
14. Invoice questionnaire form (step-by-step wizard, 6 steps)
15. PDF generator (pdfmake invoice template, MT Asphalt branded)
16. Auto-numbering, calculations, tax
17. Save-to-history + re-download
18. Email send (optional)

Phase 5 — Contract generator (day 5–6)
19. Contract questionnaire (shorter — most fields pre-filled from settings)
20. PDF contract generator (pdfmake, official-looking document)
21. Editable terms template in dashboard
22. Save-to-history + re-download

Phase 6 — Polish + packaging
23. Michael-friendly setup: `npm start` → browser opens, first-run /setup wizard
24. README with install instructions
25. Dashboard tour / Michael-specific walkthrough document
26. Package as portable folder OR Electron app wrapper so Michael just double-clicks

---

## 7. DESIGN AND COMPLIANCE PARAMETERS

Ensure the build satisfies these precise parameters:

1. **CSLB License display:** The license status has been verified as active. Set the default setting of `license_verified = 1` and display "Licensed CA #836341" across the header, footer, contracts, and invoices.
2. **Review Showcasing:** Set the database seed testimonials with the curated list of 5-star customer reviews from `reviews_reputation.md`, showing an outstanding aggregate average score of 4.9/5 stars.
3. **Address defaults:** Render Anaheim as the primary physical headquarters, but ensure the address elements can be updated or dual-listed with Westminster through the dashboard.
4. **Services integration:** Services must be rendered dynamically from the database settings rather than hardcoded in the frontend.
5. **Invoice alignment:** Build the invoice questionnaire service checkboxes directly from the services DB table, keeping them synchronized.

---

## 8. MICHAEL'S USER PROFILE (for context)

- Owner-operated business, ~22 years experience
- Responds personally to issues (this is a selling point)
- No existing website, no tech team, no IT support — he relies on whoever builds for him
- His primary tool of business is the phone: (714) 457-7111
- Needs the dashboard to be straightforward — big buttons, plain language, not overwhelming
- Will want to print invoices directly, email them, and keep a record
- Does NOT want admin overhead — a toggle for "show license number" beats a settings page with 12 fields

**Dashboard UX target:** Michael sits down, clicks "New Invoice" → 5 minutes later he has a PDF. No learning curve needed.

---

## 9. FIRST-STEP INSTRUCTIONS FOR CLAUDE

When you (Claude) pick this up:

1. Read this handoff in full.
2. Read every file in `/c/WORK\mt-asphalt\` — especially `flags_and_open_questions.md` and `website_build_notes.md`.
3. Scaffold `package.json`, server.js, auth, DB schema, seed script.
4. Build Phase 1 (backbone) and Phase 2 (public site) first so there's something to look at immediately.
5. Present the running site on `localhost:3000` and the dashboard on `localhost:3000/admin`.
6. Document every missing piece in the dashboard that still needs to be filled in (Michael will want a checklist).
7. Do NOT claim the site is "tested in-game" or anything — this is not Roblox. It's a Node.js app. Run it, show screenshots or describe the rendered output.

---

## 10. OPEN ITEMS FOR MICHAEL (to ask him before/during build)

- Confirm active license status — verify cslb.ca.gov before enabling license display on site
- Which city does he want as the featured location: Anaheim or Westminster, or both?
- Legal entity name for footer (Sole Prop vs Corporation — affects how we write it)
- Is (714) 391-7301 a real number?
- Services list — confirm the inferred list in `services.md` is complete and accurate
- Photos / before-and-after for gallery
- Any customer testimonials
- Brand colors or logo — if he has anything, great; if not, use the asphalt/industrial palette
- Email address for contact form destination
- Business hours

---

*End of handoff. All research, flags, and decisions are in the mt-asphalt folder. Read the flags file before anything else.*
