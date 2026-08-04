# Assistant V1 — what was added, and what's still blocking real use

The dashboard now has an **Assistant** page. Michael talks or types, it asks at most
five follow-up questions, prices the job from a rate sheet, and produces a draft
contract or invoice for him to review.

---

## The conversation

> **Michael:** "hey give me a contract for Bob's parking lot, im doing a job for him"

From that one sentence the assistant already knows it's a **contract**, the service is
**paving** (a parking lot), and the customer is **Bob** — matched against the customer
list, so "Bob" finds "Robert Maddox". It does not know the size, so it asks. It never
asks about anything Michael already said.

> **Assistant:** "Roughly how many square feet? A rough number is fine, or give me the
> dimensions like 60 x 100."
>
> **Michael:** "about 8500, three inch"
>
> **Assistant:** "What's the job site address?"
>
> **Michael:** "400 Mill Road"
>
> **Assistant:** "Done — I make it $33,416.48. Check the line items below before you send it."

That total is 154.06 tons of hot mix at $125 ($19,257.81), installation labor at $1.10/sq ft
($9,350), mobilization ($450), plus 15% overhead and profit — every figure calculated in
`pricing.ts`, none of it produced by the model. The 15% comes from the existing
`materialMarkupPct` in Settings, which the rate sheet reuses rather than duplicating.

Two questions, not five. The cap is a ceiling, not a quota — questions are ordered by
price impact, so if it only gets a few answers it asked the ones that mattered.

If it hits five questions with something still unknown, it drafts anyway and lists
what's missing on the draft. It never silently invents a number.

---

## What was added

```
app/api/chat.js                    serverless AI proxy — the key lives here, never in the browser
app/src/lib/pricing.ts             tonnage + rate-sheet math, ported from the Python engine
app/src/lib/assistant.ts           intent detection, slot extraction, question logic
app/src/lib/speech.ts              Web Speech API wrapper
app/src/lib/assistant.test.ts      71 verification checks
app/src/admin/pages/Assistant.tsx  the page itself
```

Modified: `App.tsx` (route), `nav.ts` (nav entry, fills the empty 5th slot in the mobile
bottom bar), `types.ts` (optional rate fields on Settings), `tsconfig.json`,
`package.json`, `.env.example`.

Nothing existing was rewritten. The assistant writes into the same `Contract` and
`Invoice` shapes the Contracts and Invoices pages already render, so drafts flow into
the printable documents you already built.

---

## Setup

### The API key

Set these in **Vercel → Project → Settings → Environment Variables**, or in
`app/.env.local` for local dev:

```
AI_API_KEY=sk-your-key-here
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-v4-flash
```

**The missing `VITE_` prefix is deliberate.** Anything named `VITE_*` gets compiled into
the browser bundle where every visitor can read it. These are read only by
`api/chat.js`, server-side. The build is verified to contain no key, no provider URL,
and no `AI_*` variable name.

**Without a key everything still works.** The assistant falls back to a built-in
scripted flow — same questions, same pricing, same drafts, plainer wording. The
business never stops because an API is down.

### Provider choice

Any OpenAI-compatible provider works; only the env vars change.

| | |
|---|---|
| **DeepSeek direct** | `https://api.deepseek.com` · `deepseek-v4-flash` · ~$0.14/M in, $0.28/M out. A few dollars a month at Michael's volume. |
| **OpenCode Go** | `https://opencode.ai/zen/v1` · `deepseek-v4-pro` · $10/mo, 16 models |

Use OpenCode Go while developing. **For Michael's production use, get MT Asphalt its own
DeepSeek key.** OpenCode Go's limits ($12 per 5 hours, $30 weekly, $60 monthly) are
shared across your whole account — a heavy coding session on your side takes his
contracts offline mid-job, and he'll have no idea why.

### Verify it

```
cd app
npm run verify     # 71 checks: pricing, extraction, question flow
npm run build      # typecheck + production build
```

`npm run verify` cross-checks the TypeScript pricing engine against the Python
implementation it was ported from. Both produce **$44,542.85** on the same 8,500 sq ft
job. If they ever diverge, one is wrong.

---

## Voice, and why it's built this way

Speech uses the **browser's built-in Web Speech API**, not an audio-upload
transcription service. Free, no second key, no upload delay, nothing recorded, and it
works natively in Chrome on the S22 Ultra. The mic button hides itself on browsers that
don't support it; typing always works.

## File uploads

- **Text files** (`.txt` `.csv` `.md` `.json`) — contents are extracted and fed to the model as context. Works well.
- **Photos** — attach to the record as reference. **The model cannot see them.** DeepSeek V4 Flash is text-only in the public API; image and document input are not supported. The UI says so plainly rather than pretending.
- **PDFs** — attach but aren't parsed. Text extraction needs `pdfjs-dist` (~2 MB); worth adding only if Michael actually has PDFs he wants read.

Measuring a lot from a photo is a much larger project and not what this is.

---

## Before Michael uses this for real work

You said real use, not a demo. These four are genuine blockers.

### 1. The dashboard has no real password

`useAuth` in `store.tsx` accepts **any non-empty string**. Your own `MICHAEL_GUIDE.md`
flags this as a demo gate. If the Vercel deployment is public, anyone who finds
`/dashboard` types one character and sees every customer, phone number, invoice, and
revenue figure. Fix before real customer data goes in.

### 2. The rate sheet is invented

Every number in `DEFAULT_RATES` is a plausible-looking placeholder, not MT Asphalt's
costs. Placeholder rates producing confident-looking quotes is the most dangerous state
this can be in, because it looks like it's working.

Sit with Michael, get his real numbers, then enter 5–10 jobs he's **already quoted** and
compare. Tune until the gap closes. That session is what makes him trust it — he watches
it reproduce his own pricing on jobs he remembers.

### 3. The seeded data is fake

`seed.ts` contains invented customers, jobs, and revenue. Robert Maddox and Harbor Plaza
Retail are not real. If Michael starts working in the app without clearing them, he will
eventually invoice a customer who doesn't exist or read revenue figures that were made
up. Add a "clear demo data" action, or ship him a clean database.

### 4. localStorage is the only copy

The whole business lives in one browser's localStorage. Clearing site data, a browser
reset, or a new phone loses everything — no warning, no recovery. `store.tsx` already
supports a backend via `VITE_API_URL`, and you already run Vercel Blob for leads. Turn
one of those on before this holds real invoices.

### Also worth resolving

**Sales tax.** Settings carries `salesTaxRate: 0.0775`, but the pricing engine defaults
`taxRatePct` to 0 and shows a banner explaining why. California generally treats paving
as an improvement to real property — the contractor pays tax on materials and does not
charge the customer sales tax on the job. Getting this wrong in either direction is a
real problem. It's a question for Michael's accountant, and the app surfaces it rather
than guessing.

---

## Design rules worth keeping

**The model never calculates money.** Every dollar comes from `pricing.ts`. The model
extracts what Michael said and writes prose. An LLM doing arithmetic is fluent and
occasionally, confidently wrong — and that wrong number goes out as a bill.

**Two extractors, never overwriting.** Regex parsing and model parsing both run; local
wins where they disagree. Michael typing `8500 sqft` always beats the model's
interpretation of it. Disagreement only ever adds information.

**Everything saves as `draft`.** The assistant never sets a contract to sent or an
invoice to issued. Michael reviews on the existing pages and advances the status himself.

---

## Superseded

The standalone Python/Flask app from the earlier session duplicated the Contracts and
Invoices pages that already existed here — it was built without sight of this repo.
Its pricing engine is the thing worth keeping and now lives in `app/src/lib/pricing.ts`.
The rate-calibration workbook (`MT-Asphalt-Job-Intake.xlsx`) is still useful for the
session with Michael; the rest can be dropped.
