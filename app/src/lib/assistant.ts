/* ============================================================
   MT ASPHALT — Assistant brain

   Turns "give me a contract for Bob's parking lot" into a priced,
   reviewable draft, asking at most 5 follow-up questions and never
   asking about anything Michael already said.

   Two paths, same result shape:
     · model available  — /api/chat extracts intent and fields as JSON
     · no model         — regex extraction + scripted questions

   The fallback is not a degraded toy. Michael is running a business on
   this; if the key expires or the provider is down mid-job, the assistant
   still gathers the job and produces the contract.
   ============================================================ */

import type { Customer, Database } from "./types";
import {
  SERVICE_LABELS,
  type JobSpec,
  type ServiceKind,
} from "./pricing";

export const MAX_QUESTIONS = 5;

export type Intent = "contract" | "invoice" | "quote" | "unknown";

export interface Slots {
  customerName?: string;
  customerId?: string;
  customerAddress?: string;
  jobAddress?: string;
  service?: ServiceKind;
  sqft?: number;
  thicknessInches?: number;
  linearFeet?: number;
  stalls?: number;
  basePrep?: boolean;
  milling?: boolean;
  manualPrice?: number;
  notes?: string;
}

export interface Conversation {
  intent: Intent;
  slots: Slots;
  questionsAsked: number;
  /** Slot keys we have already asked about — never ask twice. */
  asked: string[];
  attachmentText?: string;
}

export const emptyConversation = (): Conversation => ({
  intent: "unknown",
  slots: {},
  questionsAsked: 0,
  asked: [],
});

/* ------------------------------------------------------------------ intent */

const INTENT_PATTERNS: [Intent, RegExp][] = [
  ["contract", /\b(contract|agreement|proposal|sign|signing)\b/i],
  ["invoice", /\b(invoice|bill|billing|charge (?:him|her|them)|get paid)\b/i],
  ["quote", /\b(quote|estimate|bid|how much|what should i charge|price (?:it|this|out))\b/i],
];

export function detectIntent(text: string): Intent {
  for (const [intent, re] of INTENT_PATTERNS) {
    if (re.test(text)) return intent;
  }
  return "unknown";
}

/* ----------------------------------------------------------------- service */

const SERVICE_PATTERNS: [ServiceKind, RegExp][] = [
  ["sealcoating", /\bseal\s?coat(?:ing|ed)?\b|\bsealer\b/i],
  ["crack_filling", /\bcrack\s?(?:seal|fill)(?:ing|ed)?\b|\bcrack repair\b/i],
  ["striping", /\bstrip(?:e|ing)\b|\bline paint|\bre-?stripe\b|\bstall(?:s)? paint/i],
  ["patching", /\bpatch(?:ing|es|ed)?\b|\bpot\s?hole/i],
  ["resurfacing", /\bresurfac|\boverlay\b|\bcap\b|\bgrind and pave\b/i],
  ["paving", /\bpav(?:e|ing|ed)\b|\bdriveway\b|\bparking lot\b|\bnew asphalt\b|\brepave\b/i],
];

export function detectService(text: string): ServiceKind | undefined {
  for (const [kind, re] of SERVICE_PATTERNS) {
    if (re.test(text)) return kind;
  }
  return undefined;
}

/* ------------------------------------------------------------- measurements */

/** "8500 sq ft", "8,500 sqft", "about 8500 square feet", "8500sf" */
export function extractSqft(text: string): number | undefined {
  const m = text.match(
    /([\d,]+(?:\.\d+)?)\s*(?:sq\.?\s?ft|sqft|sf|square\s?f(?:ee|oo)?t)\b/i
  );
  if (m) {
    const n = Number(m[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  // "60 x 100" or "60' x 100'" → area
  const dim = text.match(/(\d[\d,.]*)\s*(?:'|ft|feet)?\s*(?:x|by)\s*(\d[\d,.]*)\s*(?:'|ft|feet)?/i);
  if (dim) {
    const a = Number(dim[1].replace(/,/g, ""));
    const b = Number(dim[2].replace(/,/g, ""));
    if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) return a * b;
  }
  return undefined;
}

const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  "one and a half": 1.5, "two and a half": 2.5,
};

/** '2"', "2 inch", "three inches", "2.5in" */
export function extractThickness(text: string): number | undefined {
  const m = text.match(/([\d.]+)\s*(?:"|''|in\b|inch(?:es)?\b)/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > 0 && n <= 12) return n;
  }
  for (const [word, n] of Object.entries(WORD_NUMBERS)) {
    if (new RegExp(`\\b${word}\\s*(?:"|in\\b|inch)`, "i").test(text)) return n;
  }
  return undefined;
}

export function extractLinearFeet(text: string): number | undefined {
  const m = text.match(/([\d,]+(?:\.\d+)?)\s*(?:linear|lin\.?|lf\b|running)\s*(?:ft|feet|f)?/i);
  if (m) {
    const n = Number(m[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}

export function extractStalls(text: string): number | undefined {
  const m = text.match(/([\d,]+)\s*(?:stall|space|spot)s?\b/i);
  if (m) {
    const n = Number(m[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}

/** "$12,000", "12k", "twelve grand" (the first two only) */
export function extractPrice(text: string): number | undefined {
  const dollar = text.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
  if (dollar) {
    const n = Number(dollar[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  const k = text.match(/\b([\d.]+)\s*k\b/i);
  if (k) {
    const n = Number(k[1]) * 1000;
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}

export function extractBooleans(text: string): { basePrep?: boolean; milling?: boolean } {
  const out: { basePrep?: boolean; milling?: boolean } = {};
  if (/\bbase\s?(?:prep|work)|\bgrad(?:e|ing)\b|\bsub-?base\b/i.test(text)) out.basePrep = true;
  if (/\bmill(?:ing|ed)?\b|\bgrind(?:ing)?\b|\btear\s?out\b|\bremove (?:the )?(?:old|existing)/i.test(text)) {
    out.milling = true;
  }
  return out;
}

/* ---------------------------------------------------------------- customer */

const STOPWORDS = new Set([
  "the", "a", "an", "for", "his", "her", "their", "job", "parking", "lot",
  "driveway", "contract", "invoice", "quote", "estimate", "me", "give", "make",
]);

/** Normalised token overlap — tolerant of "Bob" vs "Bob Reyes", "Bob's". */
export function matchCustomer(name: string, customers: Customer[]): Customer | undefined {
  const clean = (s: string) =>
    s.toLowerCase().replace(/['’]s\b/g, "").replace(/[^a-z0-9 ]/g, " ").trim();
  const needle = clean(name);
  if (!needle) return undefined;

  const exact = customers.find((c) => clean(c.name) === needle);
  if (exact) return exact;

  const starts = customers.find((c) => clean(c.name).startsWith(needle));
  if (starts) return starts;

  const needleTokens = needle.split(/\s+/).filter((t) => t && !STOPWORDS.has(t));
  if (needleTokens.length === 0) return undefined;

  let best: { c: Customer; score: number } | undefined;
  for (const c of customers) {
    const tokens = new Set(clean(c.name).split(/\s+/).filter(Boolean));
    let score = 0;
    for (const t of needleTokens) {
      if (tokens.has(t)) score += 2;
      else if ([...tokens].some((x) => x.startsWith(t) && t.length >= 3)) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { c, score };
  }
  return best?.c;
}

/** "for Bob's parking lot" → "Bob";  "contract for Riverside HOA" → "Riverside HOA" */
export function extractCustomerName(text: string): string | undefined {
  const m = text.match(
    /\bfor\s+([A-Z][\w'’.-]*(?:\s+[A-Z][\w'’.-]*){0,3})/
  );
  if (m) {
    const raw = m[1].replace(/['’]s$/, "").trim();
    const words = raw.split(/\s+/).filter((w) => !STOPWORDS.has(w.toLowerCase()));
    if (words.length) return words.join(" ");
  }
  const poss = text.match(/\b([A-Z][\w'’.-]+)['’]s\b/);
  if (poss && !STOPWORDS.has(poss[1].toLowerCase())) return poss[1];
  return undefined;
}

/* ------------------------------------------------- local (no-model) extract */

export function extractLocally(text: string, db: Database): Partial<Slots> & { intent: Intent } {
  const slots: Slots = {};
  const intent = detectIntent(text);

  const service = detectService(text);
  if (service) slots.service = service;

  const sqft = extractSqft(text);
  if (sqft) slots.sqft = sqft;

  const thickness = extractThickness(text);
  if (thickness) slots.thicknessInches = thickness;

  const linear = extractLinearFeet(text);
  if (linear) slots.linearFeet = linear;

  const stalls = extractStalls(text);
  if (stalls) slots.stalls = stalls;

  const price = extractPrice(text);
  if (price) slots.manualPrice = price;

  Object.assign(slots, extractBooleans(text));

  const name = extractCustomerName(text);
  if (name) {
    const found = matchCustomer(name, db.customers);
    if (found) {
      slots.customerName = found.name;
      slots.customerId = found.id;
      slots.customerAddress = [found.address, found.city].filter(Boolean).join(", ");
    } else {
      slots.customerName = name;
    }
  }

  return { ...slots, intent };
}

/* ------------------------------------------------------------- slot logic */

/** Which fields this job genuinely needs, most price-critical first. */
export function requiredSlots(slots: Slots): (keyof Slots)[] {
  const need: (keyof Slots)[] = [];
  if (!slots.customerName) need.push("customerName");
  if (!slots.service) need.push("service");

  switch (slots.service) {
    case "paving":
    case "resurfacing":
      if (!slots.sqft) need.push("sqft");
      if (!slots.thicknessInches) need.push("thicknessInches");
      break;
    case "sealcoating":
    case "patching":
      if (!slots.sqft) need.push("sqft");
      break;
    case "crack_filling":
      if (!slots.linearFeet) need.push("linearFeet");
      break;
    case "striping":
      if (!slots.stalls) need.push("stalls");
      break;
    default:
      break;
  }
  if (!slots.jobAddress) need.push("jobAddress");
  return need;
}

export const QUESTION_TEXT: Record<string, string> = {
  customerName: "Who's the customer? Name it however you have them saved.",
  service: "What's the work — paving, resurfacing, sealcoating, crack sealing, patching, or striping?",
  sqft: "Roughly how many square feet? A rough number is fine, or give me the dimensions like 60 x 100.",
  thicknessInches: "How thick is the asphalt going down? Most driveways run 2\", commercial lots 3\".",
  linearFeet: "About how many linear feet of cracks?",
  stalls: "How many stalls are you striping?",
  jobAddress: "What's the job site address?",
};

/** The next question to ask, or null when we have enough (or hit the cap). */
export function nextQuestion(conv: Conversation): { slot: string; text: string } | null {
  if (conv.questionsAsked >= MAX_QUESTIONS) return null;
  const need = requiredSlots(conv.slots).filter((s) => !conv.asked.includes(s as string));
  if (need.length === 0) return null;
  const slot = need[0] as string;
  return { slot, text: QUESTION_TEXT[slot] ?? `What's the ${slot}?` };
}

/** Anything still unknown when we stop asking — shown on the draft, never hidden. */
export function outstandingGaps(conv: Conversation): string[] {
  return requiredSlots(conv.slots).map((s) => QUESTION_TEXT[s as string] ?? String(s));
}

export function slotsToJobSpec(slots: Slots): JobSpec {
  return {
    service: slots.service ?? "paving",
    sqft: slots.sqft,
    thicknessInches: slots.thicknessInches,
    linearFeet: slots.linearFeet,
    stalls: slots.stalls,
    basePrep: slots.basePrep,
    milling: slots.milling,
    manualPrice: slots.manualPrice,
  };
}

/* ----------------------------------------------------------- model-backed */

const EXTRACT_SYSTEM = `You extract structured job details for an asphalt paving contractor in Orange County, California. You reply with json only.

Return this exact json shape, omitting any field the user did not mention. Never guess a value the user did not say.

{
  "intent": "contract" | "invoice" | "quote" | "unknown",
  "customerName": string,
  "service": "paving" | "resurfacing" | "sealcoating" | "crack_filling" | "patching" | "striping",
  "sqft": number,
  "thicknessInches": number,
  "linearFeet": number,
  "stalls": number,
  "basePrep": boolean,
  "milling": boolean,
  "manualPrice": number,
  "jobAddress": string,
  "notes": string
}

Rules:
- Omit fields rather than inventing them. A missing field is correct; a guessed one is a wrong quote.
- "parking lot" and "driveway" both imply service "paving" unless the user says resurface, sealcoat, stripe, patch, or crack.
- Dimensions like "60 by 100" mean sqft 6000.
- manualPrice only when the user states a price they intend to charge.
- notes is for access, timing, or site conditions worth putting on the contract.`;

export interface ChatResult {
  ok: boolean;
  content: string;
  configured: boolean;
  error?: string;
}

export async function callModel(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: { json?: boolean; maxTokens?: number } = {}
): Promise<ChatResult> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        json: opts.json ?? false,
        max_tokens: opts.maxTokens ?? 1200,
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.status === 503) {
      return { ok: false, configured: false, content: "", error: data?.error };
    }
    if (!res.ok) {
      return { ok: false, configured: true, content: "", error: data?.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, configured: true, content: String(data?.content ?? "") };
  } catch {
    return { ok: false, configured: false, content: "", error: "network" };
  }
}

const NUM = (v: unknown): number | undefined => {
  const n = typeof v === "string" ? Number(v.replace(/[^\d.]/g, "")) : v;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : undefined;
};

/**
 * Extract with the model, then reconcile against local regex extraction.
 * Local wins where the model omitted something — two extractors disagreeing
 * only ever adds information, never overwrites a value the user literally typed.
 */
export async function extractSlots(
  text: string,
  db: Database,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<{ slots: Slots; intent: Intent; usedModel: boolean }> {
  const local = extractLocally(text, db);
  const localSlots: Slots = { ...local };
  delete (localSlots as { intent?: Intent }).intent;

  const customerList = db.customers.slice(0, 60).map((c) => c.name).join(", ");
  const res = await callModel(
    [
      { role: "system", content: EXTRACT_SYSTEM },
      {
        role: "user",
        content:
          (customerList ? `Known customers: ${customerList}\n\n` : "") +
          (history.length
            ? `Conversation so far:\n${history.map((h) => `${h.role}: ${h.content}`).join("\n")}\n\n`
            : "") +
          `Latest message: ${text}\n\nReturn the json.`,
      },
    ],
    { json: true, maxTokens: 700 }
  );

  if (!res.ok) {
    return { slots: localSlots, intent: local.intent, usedModel: false };
  }

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(res.content) as Record<string, unknown>;
  } catch {
    return { slots: localSlots, intent: local.intent, usedModel: false };
  }

  const merged: Slots = { ...localSlots };

  const name = typeof parsed.customerName === "string" ? parsed.customerName.trim() : "";
  if (name && !merged.customerName) {
    const found = matchCustomer(name, db.customers);
    if (found) {
      merged.customerName = found.name;
      merged.customerId = found.id;
      merged.customerAddress = [found.address, found.city].filter(Boolean).join(", ");
    } else {
      merged.customerName = name;
    }
  }

  if (!merged.service && typeof parsed.service === "string" && parsed.service in SERVICE_LABELS) {
    merged.service = parsed.service as ServiceKind;
  }
  if (!merged.sqft) merged.sqft = NUM(parsed.sqft);
  if (!merged.thicknessInches) merged.thicknessInches = NUM(parsed.thicknessInches);
  if (!merged.linearFeet) merged.linearFeet = NUM(parsed.linearFeet);
  if (!merged.stalls) merged.stalls = NUM(parsed.stalls);
  if (!merged.manualPrice) merged.manualPrice = NUM(parsed.manualPrice);
  if (merged.basePrep === undefined && parsed.basePrep === true) merged.basePrep = true;
  if (merged.milling === undefined && parsed.milling === true) merged.milling = true;
  if (!merged.jobAddress && typeof parsed.jobAddress === "string" && parsed.jobAddress.trim()) {
    merged.jobAddress = parsed.jobAddress.trim();
  }
  if (!merged.notes && typeof parsed.notes === "string" && parsed.notes.trim()) {
    merged.notes = parsed.notes.trim();
  }

  const intent =
    local.intent !== "unknown"
      ? local.intent
      : typeof parsed.intent === "string" &&
        ["contract", "invoice", "quote"].includes(parsed.intent)
      ? (parsed.intent as Intent)
      : "unknown";

  return { slots: merged, intent, usedModel: true };
}

/* -------------------------------------------------------------- prose gen */

const SCOPE_SYSTEM = `You write the scope-of-work paragraph for MT Asphalt, a licensed California paving contractor (CSLB #836341).

Rules:
- 2 to 4 sentences, plain English a property manager or homeowner understands.
- Describe only the work in the line items you are given.
- Never state prices, dollar amounts, or dates — those are filled in elsewhere.
- Never promise a completion date, a warranty, or a specific lifespan.
- No marketing adjectives. Not "premium", not "top-quality".
- Output the paragraph only, no heading.`;

export async function generateScope(
  spec: JobSpec,
  lineDescriptions: string[],
  jobAddress: string | undefined,
  notes: string | undefined
): Promise<{ text: string; usedModel: boolean }> {
  const res = await callModel(
    [
      { role: "system", content: SCOPE_SYSTEM },
      {
        role: "user",
        content: [
          `Service: ${SERVICE_LABELS[spec.service]}`,
          jobAddress ? `Location: ${jobAddress}` : "",
          `Line items:\n${lineDescriptions.map((d) => `- ${d}`).join("\n")}`,
          notes ? `Site notes: ${notes}` : "",
          "",
          "Write the scope-of-work paragraph.",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
    { maxTokens: 400 }
  );

  if (res.ok && res.content.trim()) {
    return { text: res.content.trim(), usedModel: true };
  }

  // Deterministic fallback.
  const work = lineDescriptions
    .filter((d) => !/^Mobilization/i.test(d))
    .join("; ");
  return {
    text:
      `MT Asphalt will perform ${SERVICE_LABELS[spec.service].toLowerCase()}` +
      (jobAddress ? ` at ${jobAddress}` : "") +
      `. Work includes: ${work}. All materials, labor, and equipment are included as itemized below.` +
      (notes ? ` Site notes: ${notes}` : ""),
    usedModel: false,
  };
}
