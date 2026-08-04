/* ============================================================
   Verification suite — pricing engine + assistant extraction.

   Run:  npm run verify

   The pricing half cross-checks the TypeScript engine against
   hand-calculated values and against the Python reference
   implementation this was ported from. If those two ever disagree,
   one of them is wrong and a customer gets a bad number.
   ============================================================ */

import {
  DEFAULT_RATES,
  priceJob,
  ratesFrom,
  tonsRequired,
  quoteToScopeItems,
  type PavingRates,
} from "./pricing";
import {
  detectIntent,
  detectService,
  extractSqft,
  extractThickness,
  extractLinearFeet,
  extractStalls,
  extractPrice,
  extractBooleans,
  extractCustomerName,
  extractLocally,
  matchCustomer,
  nextQuestion,
  requiredSlots,
  emptyConversation,
  MAX_QUESTIONS,
  type Conversation,
  type Slots,
} from "./assistant";
import type { Customer, Database } from "./types";

let failures = 0;
let checks = 0;

function ok(label: string, pass: boolean, detail = "") {
  checks += 1;
  if (!pass) failures += 1;
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

function near(label: string, got: number | undefined, want: number, tol = 0.01) {
  const pass = typeof got === "number" && Math.abs(got - want) <= tol;
  ok(label, pass, `got ${got ?? "undefined"}, expected ${want}`);
}

const R: PavingRates = { ...DEFAULT_RATES, markupPct: 18, depositPct: 33 };

console.log("\n== Tonnage ==");
near("1000 sq ft @ 2in", tonsRequired(1000, 2, 145), 12.0833);
near("1 sq yd @ 1in in lb (~110 rule of thumb)", tonsRequired(9, 1, 145) * 2000, 108.75, 2);
near("zero area", tonsRequired(0, 2, 145), 0);
near("zero thickness", tonsRequired(1000, 0, 145), 0);
near("doubling thickness doubles tons", tonsRequired(1000, 4, 145), tonsRequired(1000, 2, 145) * 2);

console.log("\n== Cross-check vs the Python reference engine ==");
// Python produced 44,542.85 for this exact job.
const parking = priceJob(
  { service: "paving", sqft: 8500, thicknessInches: 2.5, basePrep: true },
  R
);
near("8,500 sq ft @ 2.5in + base prep → total", parking.total, 44542.85);
near("  tons", parking.tons, 128.39, 0.01);
near("  subtotal", parking.subtotal, 37748.18);

// Python produced 11,888.50 for this one.
const driveway = priceJob(
  { service: "paving", sqft: 2400, thicknessInches: 2, basePrep: true },
  R
);
near("2,400 sq ft @ 2in + base prep → total", driveway.total, 11888.5);

console.log("\n== Quote structure ==");
near("lines sum to subtotal", parking.lines.reduce((s, l) => s + l.amount, 0), parking.subtotal);
near("deposit + balance = total", parking.deposit + parking.balance, parking.total);
near("deposit is depositPct of total", parking.deposit, (parking.total * 33) / 100);
ok("mobilization always present", parking.lines.some((l) => /Mobilization/.test(l.description)));

console.log("\n== Minimum job charge ==");
const tiny = priceJob({ service: "patching", sqft: 20 }, R);
near("tiny job floors at minimum", tiny.total, R.minJobCharge);

console.log("\n== Manual price override ==");
const manual = priceJob({ service: "paving", sqft: 8500, thicknessInches: 2.5, manualPrice: 39000 }, R);
near("override wins", manual.total, 39000);
ok("override is flagged", manual.isManual);
ok("non-override not flagged", !parking.isManual);

console.log("\n== Service isolation ==");
const seal = priceJob({ service: "sealcoating", sqft: 5000 }, R);
ok("sealcoat has no asphalt tonnage line", !seal.lines.some((l) => /Hot-mix/.test(l.description)));
near("sealcoat line amount", seal.lines[0].amount, 5000 * R.sealcoatPerSqft);
const crack = priceJob({ service: "crack_filling", linearFeet: 800 }, R);
near("crack fill line amount", crack.lines[0].amount, 800 * R.crackFillPerLinearFt);
const stripe = priceJob({ service: "striping", stalls: 60 }, R);
near("striping line amount", stripe.lines[0].amount, 60 * R.stripingPerStall);

console.log("\n== Rates fall back safely ==");
const fromEmpty = ratesFrom({} as never);
near("missing rate falls back to default", fromEmpty.asphaltCostPerTon, DEFAULT_RATES.asphaltCostPerTon);
const fromPartial = ratesFrom({ asphaltCostPerTon: 210 } as never);
near("supplied rate is used", fromPartial.asphaltCostPerTon, 210);
near("other rates still default", fromPartial.mobilizationFee, DEFAULT_RATES.mobilizationFee);

console.log("\n== Intent detection ==");
ok('"give me a contract for Bob" → contract', detectIntent("give me a contract for Bob") === "contract");
ok('"bill him for the job" → invoice', detectIntent("bill him for the job") === "invoice");
ok('"how much should I charge" → quote', detectIntent("how much should I charge") === "quote");
ok('"hello there" → unknown', detectIntent("hello there") === "unknown");

console.log("\n== Service detection ==");
ok("parking lot → paving", detectService("Bob's parking lot") === "paving");
ok("driveway → paving", detectService("resurface the driveway") === "resurfacing");
ok("sealcoat → sealcoating", detectService("needs a sealcoat") === "sealcoating");
ok("crack seal → crack_filling", detectService("crack sealing the lot") === "crack_filling");
ok("potholes → patching", detectService("fix the potholes") === "patching");
ok("striping → striping", detectService("restripe the stalls") === "striping");

console.log("\n== Measurement extraction ==");
near('"8,500 sq ft"', extractSqft("about 8,500 sq ft"), 8500);
near('"8500 sqft"', extractSqft("8500 sqft"), 8500);
near('"8500 square feet"', extractSqft("roughly 8500 square feet"), 8500);
near('"60 x 100"', extractSqft("the lot is 60 x 100"), 6000);
near("\"3 inch\"", extractThickness("3 inch overlay"), 3);
near('\'2"\'', extractThickness('2" compacted'), 2);
near('"two inch"', extractThickness("two inch lift"), 2);
near('"400 linear feet"', extractLinearFeet("400 linear feet of cracks"), 400);
near('"60 stalls"', extractStalls("60 stalls"), 60);
near('"$12,000"', extractPrice("quoted him $12,000"), 12000);
near('"15k"', extractPrice("about 15k"), 15000);
ok("base prep detected", extractBooleans("needs grading first").basePrep === true);
ok("milling detected", extractBooleans("mill the old surface off").milling === true);
ok("no false positive on booleans", extractBooleans("just a repave").basePrep === undefined);

console.log("\n== Customer matching ==");
const customers = [
  { id: "c1", name: "Robert Maddox" },
  { id: "c2", name: "Harbor Plaza Retail (Sarah Jenkins)" },
  { id: "c3", name: "Sunridge HOA (James Lee)" },
  { id: "c4", name: "Del Taco #418" },
] as Customer[];
ok("exact match", matchCustomer("Robert Maddox", customers)?.id === "c1");
ok("first-name match", matchCustomer("Robert", customers)?.id === "c1");
ok("possessive stripped", matchCustomer("Robert's", customers)?.id === "c1");
ok("partial company match", matchCustomer("Harbor Plaza", customers)?.id === "c2");
ok("no match returns undefined", matchCustomer("Zzzz Nonexistent", customers) === undefined);

console.log("\n== Name extraction ==");
ok('"for Bob\'s parking lot" → Bob', extractCustomerName("contract for Bob's parking lot") === "Bob");
ok(
  '"for Harbor Plaza Retail" → Harbor Plaza Retail',
  extractCustomerName("invoice for Harbor Plaza Retail") === "Harbor Plaza Retail"
);

console.log("\n== The headline scenario ==");
const db = { customers } as Database;
const msg = "hey give me a contract for Bob's parking lot, im doing a job for him";
const parsed = extractLocally(msg, db);
ok("intent = contract", parsed.intent === "contract");
ok("service = paving", parsed.service === "paving");
ok("customer name captured", parsed.customerName === "Bob");
ok("no sqft invented", parsed.sqft === undefined);
ok("no thickness invented", parsed.thicknessInches === undefined);
ok("no price invented", parsed.manualPrice === undefined);

console.log("\n== Question flow ==");
let conv: Conversation = {
  ...emptyConversation(),
  intent: "contract",
  slots: { customerName: "Bob", service: "paving" } as Slots,
};
const q1 = nextQuestion(conv);
ok("first asks size (biggest price driver)", q1?.slot === "sqft", q1?.slot);
conv = { ...conv, slots: { ...conv.slots, sqft: 8500 }, questionsAsked: 1, asked: ["sqft"] };
const q2 = nextQuestion(conv);
ok("then asks thickness", q2?.slot === "thicknessInches", q2?.slot);
conv = {
  ...conv,
  slots: { ...conv.slots, thicknessInches: 3 },
  questionsAsked: 2,
  asked: ["sqft", "thicknessInches"],
};
const q3 = nextQuestion(conv);
ok("then asks job address", q3?.slot === "jobAddress", q3?.slot);
conv = {
  ...conv,
  slots: { ...conv.slots, jobAddress: "400 Mill Rd" },
  questionsAsked: 3,
  asked: ["sqft", "thicknessInches", "jobAddress"],
};
ok("stops when it has enough", nextQuestion(conv) === null);

console.log("\n== The 5-question cap ==");
const capped: Conversation = {
  ...emptyConversation(),
  intent: "contract",
  slots: {},
  questionsAsked: MAX_QUESTIONS,
  asked: [],
};
ok("never exceeds the cap", nextQuestion(capped) === null);

console.log("\n== Never re-asks what it knows ==");
const known: Conversation = {
  ...emptyConversation(),
  intent: "contract",
  slots: { customerName: "Bob", service: "sealcoating", sqft: 5000, jobAddress: "1 Main" },
};
ok("complete sealcoat job asks nothing", nextQuestion(known) === null);
ok("sealcoat never asks thickness", !requiredSlots(known.slots).includes("thicknessInches"));

console.log("\n== Scope items ==");
const scope = quoteToScopeItems({ service: "paving", sqft: 8500, thicknessInches: 3, basePrep: true });
ok("names the service", scope.includes("Asphalt Paving"));
ok("includes area", scope.some((s) => s.includes("8,500")));
ok("includes base prep", scope.includes("Base prep & grading"));

console.log("\n" + "=".repeat(56));
if (failures > 0) {
  console.log(`  ${failures} FAILED of ${checks} checks`);
  process.exit(1);
}
console.log(`  All ${checks} checks passed.`);
console.log("=".repeat(56) + "\n");
