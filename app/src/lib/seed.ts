import dayjs from "dayjs";
import type { Database } from "./types";

/* ============================================================
   Seed data — MT Asphalt, Anaheim CA.
   Real company facts (license, reviews, palette) + a plausible
   book of business so every dashboard module has live content.
   Dates were authored against an anchor of 2026-07-16; d() shifts
   them to "now" so the data reads as current whenever the app is
   first opened.
   ============================================================ */

const SHIFT = dayjs().startOf("day").diff(dayjs("2026-07-16"), "day");
const d = (iso: string) => {
  const [date, time] = iso.split("T");
  const shifted = dayjs(date).add(SHIFT, "day").format("YYYY-MM-DD");
  return time ? `${shifted}T${time}` : shifted;
};

export const seed: Database = {
  settings: {
    companyName: "MT Asphalt",
    legalEntityName: "M T Asphalt",
    ownerName: "Michael Tebb",
    tagline: "Paving Excellence in Orange County",
    phonePrimary: "(714) 457-7111",
    phoneSecondary: "(714) 391-7301",
    email: "estimates@mtasphalt.com",
    addressLine1: "115 N Lindsay St",
    addressCity: "Anaheim",
    addressState: "CA",
    addressZip: "92801",
    mailingCity: "Westminster",
    serviceCities: [
      "Anaheim",
      "Westminster",
      "Santa Ana",
      "Fullerton",
      "Garden Grove",
      "Orange",
      "Buena Park",
      "Yorba Linda",
      "Tustin",
      "Irvine",
    ],
    businessHours: "Mon–Fri 7am–5pm · Sat 8am–2pm",
    licenseNumber: "836341",
    licenseClass: "C-32 Parking & Highway Improvement",
    licenseVerified: true,
    licenseStatusNote: "CSLB License #836341 — Active & in Good Standing (exp 9/13/2027)",
    showLicenseOnSite: true,
    bondNumber: "04CF643841",
    bondCarrier: "North River Insurance Company",
    bondAmount: 25000,
    ratingAverage: 4.9,
    reviewCount: 215,
    yearsInBusiness: 22,
    foundedYear: 2004,
    heroHeadline: "22 Years of Trusted Asphalt Paving in Orange County",
    heroSubheadline:
      "Residential, commercial & industrial asphalt — driveways, parking lots, sealcoating & striping. Owner-operated, personally supervised by Michael Tebb.",
    ctaText: "Get a Free Estimate",
    aboutText:
      "Family-owned and locally operated, MT Asphalt has paved Orange County for over 22 years. Under owner Michael Tebb, we deliver top-tier commercial parking lots, residential driveways, professional sealcoating, and razor-sharp line striping. We pride ourselves on hands-on project management, direct communication, and long-lasting results — every job is personally supervised by Michael.",
    googleBusinessUrl: "",
    laborRatePerHour: 85,
    salesTaxRate: 0.0775,
    materialMarkupPct: 15,
    defaultPaymentTerms: "50% deposit, 50% upon completion",
    warrantyText: "1-year workmanship warranty on all asphalt work.",
    brandPrimary: "#0f0f11",
    brandAccent: "#f2b705",
    brandSecondary: "#f25c05",
  },

  services: [
    {
      id: "svc-1",
      name: "Asphalt Paving",
      slug: "asphalt-paving",
      icon: "LayoutGrid",
      short: "New installation for driveways, lots & roads",
      description:
        "Full-depth asphalt installation for driveways, parking lots, private roads, and industrial yards. Includes grading, base preparation, and hot-mix placement compacted to spec for a surface that lasts.",
      priceHint: "From $3.50 / sq ft",
      sortOrder: 1,
      active: true,
      featured: true,
    },
    {
      id: "svc-2",
      name: "Resurfacing & Overlay",
      slug: "resurfacing-overlay",
      icon: "Layers",
      short: "Restore worn asphalt without a full tear-out",
      description:
        "A fresh 1.5\"–2\" asphalt overlay bonded to your existing surface — the cost-effective way to make a tired driveway or lot look and drive like new without a full reconstruction.",
      priceHint: "From $2.25 / sq ft",
      sortOrder: 2,
      active: true,
      featured: true,
    },
    {
      id: "svc-3",
      name: "Sealcoating",
      slug: "sealcoating",
      icon: "ShieldCheck",
      short: "Protect & extend the life of your asphalt",
      description:
        "Commercial-grade sealer that shields asphalt from UV, water, and oil — restoring that deep black finish and adding years of life. Recommended every 2–3 years.",
      priceHint: "From $0.22 / sq ft",
      sortOrder: 3,
      active: true,
      featured: true,
    },
    {
      id: "svc-4",
      name: "Crack Sealing",
      slug: "crack-sealing",
      icon: "Waypoints",
      short: "Stop water intrusion before it spreads",
      description:
        "Hot rubberized crack filler routed and sealed into working cracks to block water from reaching the base — the single most cost-effective way to prevent potholes and premature failure.",
      priceHint: "From $1.10 / linear ft",
      sortOrder: 4,
      active: true,
      featured: false,
    },
    {
      id: "svc-5",
      name: "Pothole Repair & Patching",
      slug: "pothole-repair",
      icon: "CircleDot",
      short: "Fast, permanent hot-asphalt patches",
      description:
        "Saw-cut, clean, prep, and fill with compacted hot asphalt for a smooth, level, permanent repair — not a temporary cold-patch band-aid. Ideal for hazards and liability spots.",
      priceHint: "Priced per site visit",
      sortOrder: 5,
      active: true,
      featured: false,
    },
    {
      id: "svc-6",
      name: "Parking Lot Striping",
      slug: "striping",
      icon: "SignpostBig",
      short: "ADA-compliant layout & line painting",
      description:
        "Crisp, high-visibility striping and stenciling: stalls, fire lanes, ADA stalls and access aisles, directional arrows, and curb painting — fully compliant and razor-sharp.",
      priceHint: "From $4 / stall",
      sortOrder: 6,
      active: true,
      featured: true,
    },
    {
      id: "svc-7",
      name: "Excavation & Grading",
      slug: "excavation-grading",
      icon: "Mountain",
      short: "Base prep, demolition & drainage",
      description:
        "Removal of old asphalt or concrete, sub-grade excavation, base rock placement, and precision grading for positive drainage — the foundation every quality pave depends on.",
      priceHint: "Quoted per project",
      sortOrder: 7,
      active: true,
      featured: false,
    },
  ],

  testimonials: [
    {
      id: "t-1",
      quote:
        "Michael and his crew did an outstanding job resurfacing our long driveway. They arrived right on time, worked efficiently, and the finish is flawless. The water drains perfectly now and the curb appeal is amazing.",
      author: "Robert M.",
      location: "Anaheim, CA",
      projectType: "Residential Paving",
      rating: 5,
      active: true,
    },
    {
      id: "t-2",
      quote:
        "We hired MT Asphalt to repair, sealcoat, and restripe our retail parking lot. They scheduled the work over the weekend to minimize disruption. The lot looks brand new and the striping is razor-sharp. Exceptional communication throughout.",
      author: "Sarah Jenkins",
      location: "Westminster, CA",
      projectType: "Commercial Sealcoating & Striping",
      rating: 5,
      active: true,
    },
    {
      id: "t-3",
      quote:
        "Had a massive pothole in our church parking area that was a major hazard. MT Asphalt cut out the damaged section, prepped the base, and filled it with hot asphalt. Smooth as silk and perfectly level. Highly recommend.",
      author: "Pastor Dave G.",
      location: "Orange, CA",
      projectType: "Asphalt Patching & Repair",
      rating: 5,
      active: true,
    },
    {
      id: "t-4",
      quote:
        "I've used Michael for sealcoating my driveway for years. Fair prices, high-grade materials, and he takes extreme care not to get sealant on the concrete borders or landscaping. 10/10 service.",
      author: "Linda T.",
      location: "Fullerton, CA",
      projectType: "Driveway Sealcoating",
      rating: 5,
      active: true,
    },
    {
      id: "t-5",
      quote:
        "MT Asphalt paved our private HOA access road — a major undertaking with heavy equipment and complex grading. Michael was on-site every day supervising. Finished ahead of schedule and under budget.",
      author: "James L.",
      location: "Santa Ana, CA",
      projectType: "New Asphalt Installation",
      rating: 5,
      active: true,
    },
  ],

  customers: [
    { id: "c-1", name: "Robert Maddox", type: "residential", phone: "(714) 555-0182", email: "rmaddox@example.com", address: "418 W Vermont Ave", city: "Anaheim", notes: "Long driveway, repeat sealcoat client.", createdAt: d("2023-05-11"), tags: ["repeat", "residential"] },
    { id: "c-2", name: "Harbor Plaza Retail (Sarah Jenkins)", type: "property_mgmt", phone: "(714) 555-0244", email: "sjenkins@harborplaza.com", address: "9032 Bolsa Ave", city: "Westminster", notes: "Manages 3 retail centers. Weekend work only.", createdAt: d("2022-09-02"), tags: ["commercial", "property-mgmt", "key-account"] },
    { id: "c-3", name: "Grace Community Church", type: "commercial", phone: "(714) 555-0311", email: "facilities@gracecc.org", address: "1201 E Chapman Ave", city: "Orange", notes: "Parking lot + overflow area. Non-profit rate.", createdAt: d("2024-02-20"), tags: ["commercial"] },
    { id: "c-4", name: "Linda Torres", type: "residential", phone: "(714) 555-0407", email: "linda.t@example.com", address: "77 N Adams St", city: "Fullerton", notes: "Careful about landscaping. Annual sealcoat.", createdAt: d("2021-06-15"), tags: ["repeat", "residential"] },
    { id: "c-5", name: "Sunridge HOA (James Lee)", type: "hoa", phone: "(714) 555-0555", email: "board@sunridgehoa.org", address: "2400 Sunridge Dr", city: "Santa Ana", notes: "Private roads. Board approval required for scope changes.", createdAt: d("2023-11-08"), tags: ["hoa", "key-account"] },
    { id: "c-6", name: "Del Taco #418", type: "commercial", phone: "(714) 555-0620", email: "gm418@deltaco.com", address: "1580 S Euclid St", city: "Anaheim", notes: "Drive-thru lane striping + patch. After-hours.", createdAt: d("2025-01-30"), tags: ["commercial", "quick-service"] },
    { id: "c-7", name: "Buena Park Self Storage", type: "commercial", phone: "(714) 555-0733", email: "manager@bpstorage.com", address: "6300 Beach Blvd", city: "Buena Park", notes: "Large drive aisles. Wants multi-year maintenance plan.", createdAt: d("2024-08-19"), tags: ["commercial", "maintenance-plan"] },
    { id: "c-8", name: "Miguel & Ana Reyes", type: "residential", phone: "(714) 555-0844", email: "reyes.home@example.com", address: "133 S Pine St", city: "Orange", notes: "New driveway install, first-time client.", createdAt: d("2026-05-22"), tags: ["residential", "new"] },
    { id: "c-9", name: "Tustin Auto Group", type: "commercial", phone: "(714) 555-0910", email: "ops@tustinauto.com", address: "36 Auto Center Dr", city: "Tustin", notes: "Dealership lot — needs pristine finish for display.", createdAt: d("2025-10-04"), tags: ["commercial", "key-account"] },
    { id: "c-10", name: "Yorba Linda Medical Plaza", type: "property_mgmt", phone: "(714) 555-1050", email: "pm@ylmedical.com", address: "18700 Yorba Linda Blvd", city: "Yorba Linda", notes: "ADA compliance is top priority.", createdAt: d("2025-03-14"), tags: ["commercial", "ada"] },
  ],

  jobs: [
    { id: "j-1", number: "JOB-2026-041", title: "Harbor Plaza — full lot sealcoat + restripe", customerId: "c-2", customerName: "Harbor Plaza Retail", city: "Westminster", address: "9032 Bolsa Ave", serviceTypes: ["Sealcoating", "Striping"], stage: "in_progress", priority: "high", sqft: 46000, value: 18400, cost: 9600, crewIds: ["cr-1", "cr-3", "cr-4"], equipmentIds: ["eq-4", "eq-5"], scheduledDate: d("2026-07-13"), weatherSensitive: true, progress: 65, notes: "Weekend crew. Section C done, D in progress.", createdAt: d("2026-06-28"), lat: 33.7592, lng: -117.9895 },
    { id: "j-2", number: "JOB-2026-040", title: "Reyes residence — new driveway install", customerId: "c-8", customerName: "Miguel & Ana Reyes", city: "Orange", address: "133 S Pine St", serviceTypes: ["Asphalt Paving", "Excavation & Grading"], stage: "scheduled", priority: "normal", sqft: 1150, value: 7200, cost: 3900, crewIds: ["cr-1", "cr-2"], equipmentIds: ["eq-1", "eq-2", "eq-3"], scheduledDate: d("2026-07-21"), weatherSensitive: true, progress: 0, notes: "Tear-out old concrete first. Confirm dumpster.", createdAt: d("2026-06-30"), lat: 33.7879, lng: -117.8531 },
    { id: "j-3", number: "JOB-2026-039", title: "Sunridge HOA — access road overlay (Phase 1)", customerId: "c-5", customerName: "Sunridge HOA", city: "Santa Ana", address: "2400 Sunridge Dr", serviceTypes: ["Resurfacing & Overlay"], stage: "scheduled", priority: "high", sqft: 22000, value: 41500, cost: 24800, crewIds: ["cr-1", "cr-2", "cr-5", "cr-6"], equipmentIds: ["eq-1", "eq-2", "eq-3", "eq-7"], scheduledDate: d("2026-07-28"), weatherSensitive: true, progress: 0, notes: "Board approved Phase 1. Night restriction until 7am.", createdAt: d("2026-06-18"), lat: 33.7455, lng: -117.8677 },
    { id: "j-4", number: "JOB-2026-038", title: "Tustin Auto Group — display lot repave", customerId: "c-9", customerName: "Tustin Auto Group", city: "Tustin", address: "36 Auto Center Dr", serviceTypes: ["Resurfacing & Overlay", "Striping"], stage: "estimate", priority: "high", sqft: 31000, value: 58000, cost: 33000, crewIds: [], equipmentIds: [], scheduledDate: undefined, weatherSensitive: true, progress: 0, notes: "Big opportunity. Walk-through done, quote out.", createdAt: d("2026-07-08"), lat: 33.7458, lng: -117.8261 },
    { id: "j-5", number: "JOB-2026-037", title: "Grace Church — pothole repair + patch", customerId: "c-3", customerName: "Grace Community Church", city: "Orange", address: "1201 E Chapman Ave", serviceTypes: ["Pothole Repair & Patching"], stage: "completed", priority: "normal", sqft: 900, value: 3200, cost: 1500, crewIds: ["cr-2", "cr-3"], equipmentIds: ["eq-2", "eq-6"], scheduledDate: d("2026-07-09"), completedDate: d("2026-07-09"), weatherSensitive: false, progress: 100, notes: "Finished in one day. Customer thrilled.", createdAt: d("2026-06-25"), lat: 33.7879, lng: -117.8531 },
    { id: "j-6", number: "JOB-2026-036", title: "Del Taco #418 — drive-thru patch + stripe", customerId: "c-6", customerName: "Del Taco #418", city: "Anaheim", address: "1580 S Euclid St", serviceTypes: ["Pothole Repair & Patching", "Striping"], stage: "invoiced", priority: "normal", sqft: 1400, value: 4800, cost: 2100, crewIds: ["cr-3", "cr-4"], equipmentIds: ["eq-5", "eq-6"], scheduledDate: d("2026-07-02"), completedDate: d("2026-07-03"), weatherSensitive: false, progress: 100, notes: "After-hours. Invoice INV sent, awaiting payment.", createdAt: d("2026-06-20"), lat: 33.8366, lng: -117.9143 },
    { id: "j-7", number: "JOB-2026-035", title: "Buena Park Storage — crack seal drive aisles", customerId: "c-7", customerName: "Buena Park Self Storage", city: "Buena Park", address: "6300 Beach Blvd", serviceTypes: ["Crack Sealing", "Sealcoating"], stage: "paid", priority: "normal", sqft: 38000, value: 12600, cost: 6200, crewIds: ["cr-3", "cr-4", "cr-5"], equipmentIds: ["eq-4"], scheduledDate: d("2026-06-22"), completedDate: d("2026-06-24"), weatherSensitive: true, progress: 100, notes: "Paid in full. Discussing annual maintenance plan.", createdAt: d("2026-06-01"), lat: 33.8675, lng: -117.9981 },
    { id: "j-8", number: "JOB-2026-034", title: "Torres driveway — annual sealcoat", customerId: "c-4", customerName: "Linda Torres", city: "Fullerton", address: "77 N Adams St", serviceTypes: ["Sealcoating"], stage: "paid", priority: "low", sqft: 850, value: 620, cost: 240, crewIds: ["cr-3"], equipmentIds: ["eq-4"], scheduledDate: d("2026-06-15"), completedDate: d("2026-06-15"), weatherSensitive: true, progress: 100, notes: "Repeat annual. Protected borders as always.", createdAt: d("2026-06-05"), lat: 33.8704, lng: -117.9242 },
    { id: "j-9", number: "JOB-2026-033", title: "YL Medical Plaza — ADA restripe + signage", customerId: "c-10", customerName: "Yorba Linda Medical Plaza", city: "Yorba Linda", address: "18700 Yorba Linda Blvd", serviceTypes: ["Striping"], stage: "completed", priority: "high", sqft: 28000, value: 9400, cost: 4100, crewIds: ["cr-4", "cr-5"], equipmentIds: ["eq-5"], scheduledDate: d("2026-07-11"), completedDate: d("2026-07-12"), weatherSensitive: false, progress: 100, notes: "ADA-compliant. Ready to invoice.", createdAt: d("2026-06-27"), lat: 33.8886, lng: -117.8131 },
    { id: "j-10", number: "JOB-2026-032", title: "Maddox driveway — resurface + seal", customerId: "c-1", customerName: "Robert Maddox", city: "Anaheim", address: "418 W Vermont Ave", serviceTypes: ["Resurfacing & Overlay", "Sealcoating"], stage: "paid", priority: "normal", sqft: 1600, value: 5400, cost: 2500, crewIds: ["cr-1", "cr-3"], equipmentIds: ["eq-1", "eq-4"], scheduledDate: d("2026-05-30"), completedDate: d("2026-05-31"), weatherSensitive: true, progress: 100, notes: "Flawless finish. Left a 5-star review.", createdAt: d("2026-05-12"), lat: 33.8366, lng: -117.9143 },
    { id: "j-11", number: "JOB-2026-031", title: "Harbor Plaza (Center B) — pothole hazards", customerId: "c-2", customerName: "Harbor Plaza Retail", city: "Westminster", address: "9100 Bolsa Ave", serviceTypes: ["Pothole Repair & Patching"], stage: "paid", priority: "high", sqft: 1200, value: 3900, cost: 1700, crewIds: ["cr-2", "cr-3"], equipmentIds: ["eq-2"], scheduledDate: d("2026-05-18"), completedDate: d("2026-05-18"), weatherSensitive: false, progress: 100, notes: "Liability spots cleared. Paid.", createdAt: d("2026-05-06"), lat: 33.7592, lng: -117.9895 },
    { id: "j-12", number: "JOB-2026-030", title: "Anaheim City Lot 7 — overlay + striping", customerId: "c-6", customerName: "Del Taco #418", city: "Anaheim", address: "500 S Anaheim Blvd", serviceTypes: ["Resurfacing & Overlay", "Striping"], stage: "paid", priority: "normal", sqft: 19000, value: 27800, cost: 15200, crewIds: ["cr-1", "cr-2", "cr-4"], equipmentIds: ["eq-1", "eq-3", "eq-5"], scheduledDate: d("2026-04-27"), completedDate: d("2026-04-29"), weatherSensitive: true, progress: 100, notes: "Multi-day. Clean handoff.", createdAt: d("2026-04-10"), lat: 33.8366, lng: -117.9143 },
  ],

  leads: [
    { id: "l-1", name: "Priya Raman", phone: "(714) 555-2201", email: "praman@example.com", address: "2280 W Ball Rd", city: "Anaheim", serviceInterest: "Driveway resurfacing", message: "Cracks spreading on my driveway, want a quote before winter rains.", estSqft: 1400, status: "new", source: "website", createdAt: d("2026-07-16T08:12:00"), value: 5200 },
    { id: "l-2", name: "Coastline Property Group", phone: "(714) 555-2318", email: "bids@coastlinepg.com", address: "14000 Palm St", city: "Garden Grove", serviceInterest: "Parking lot — seal + stripe (4 sites)", message: "Managing 4 strip-mall lots. Need a maintenance bid across all four.", estSqft: 120000, status: "new", source: "website", createdAt: d("2026-07-16T06:40:00"), value: 48000 },
    { id: "l-3", name: "Kevin Doyle", phone: "(714) 555-2447", email: "kdoyle@example.com", address: "812 S Harbor Blvd", city: "Fullerton", serviceInterest: "Pothole repair", message: "Two bad potholes at my shop entrance. How soon can you come out?", estSqft: 300, status: "contacted", source: "google", createdAt: d("2026-07-15T14:22:00"), value: 1800 },
    { id: "l-4", name: "Westgate Apartments", phone: "(714) 555-2560", email: "manager@westgateapts.com", address: "1750 W Lincoln Ave", city: "Anaheim", serviceInterest: "New asphalt + striping", message: "Repaving the resident lot. Looking for a licensed contractor with references.", estSqft: 34000, status: "quoted", source: "referral", createdAt: d("2026-07-14T10:05:00"), value: 61000 },
    { id: "l-5", name: "Nguyen Family", phone: "(714) 555-2673", email: "nguyen@example.com", address: "9921 Westminster Ave", city: "Westminster", serviceInterest: "Driveway sealcoat", message: "Neighbor recommended you. Small driveway, want it sealed.", estSqft: 700, status: "won", source: "referral", createdAt: d("2026-07-12T16:30:00"), value: 540 },
    { id: "l-6", name: "OC Logistics Yard", phone: "(714) 555-2789", email: "ops@oclogistics.com", address: "3300 E La Palma Ave", city: "Anaheim", serviceInterest: "Industrial yard — full repave", message: "Heavy truck traffic, surface is failing. Need durable full-depth install.", estSqft: 85000, status: "contacted", source: "website", createdAt: d("2026-07-13T09:15:00"), value: 210000 },
    { id: "l-7", name: "Danielle Cho", phone: "(714) 555-2854", email: "dcho@example.com", address: "455 N Tustin Ave", city: "Orange", serviceInterest: "Crack sealing", message: "Just some crack filling before it gets worse. Residential.", estSqft: 600, status: "lost", source: "yelp", createdAt: d("2026-07-09T11:48:00"), value: 700 },
  ],

  invoices: [
    { id: "inv-1", number: "INV-2026-036", jobId: "j-6", customerName: "Del Taco #418", customerAddress: "1580 S Euclid St, Anaheim, CA", customerEmail: "gm418@deltaco.com", jobSiteAddress: "1580 S Euclid St, Anaheim, CA 92802", lineItems: [ { id: "li-1", description: "Hot-asphalt pothole patching — drive-thru lane", qty: 1, unit: "job", rate: 2900 }, { id: "li-2", description: "Line striping & directional arrows restripe", qty: 1, unit: "job", rate: 1900 } ], taxRate: 0.0775, notes: "After-hours work completed 7/3. Thank you!", paymentTerms: "Net 15", status: "sent", issuedDate: d("2026-07-03"), dueDate: d("2026-07-18") },
    { id: "inv-2", number: "INV-2026-035", jobId: "j-7", customerName: "Buena Park Self Storage", customerAddress: "6300 Beach Blvd, Buena Park, CA", customerEmail: "manager@bpstorage.com", jobSiteAddress: "6300 Beach Blvd, Buena Park, CA 90621", lineItems: [ { id: "li-3", description: "Hot rubberized crack sealing — 3,200 linear ft", qty: 3200, unit: "lin ft", rate: 1.1 }, { id: "li-4", description: "Commercial sealcoat — drive aisles (38,000 sq ft)", qty: 38000, unit: "sq ft", rate: 0.24 } ], taxRate: 0.0775, notes: "", paymentTerms: "50% deposit, 50% completion", status: "paid", issuedDate: d("2026-06-24"), dueDate: d("2026-07-09"), paidDate: d("2026-06-30") },
    { id: "inv-3", number: "INV-2026-034", jobId: "j-8", customerName: "Linda Torres", customerAddress: "77 N Adams St, Fullerton, CA", customerEmail: "linda.t@example.com", jobSiteAddress: "77 N Adams St, Fullerton, CA 92831", lineItems: [ { id: "li-5", description: "Driveway sealcoat — 850 sq ft, premium sealer", qty: 850, unit: "sq ft", rate: 0.73 } ], taxRate: 0.0775, notes: "Annual sealcoat — thanks Linda!", paymentTerms: "Due on receipt", status: "paid", issuedDate: d("2026-06-15"), dueDate: d("2026-06-15"), paidDate: d("2026-06-16") },
    { id: "inv-4", number: "INV-2026-033", jobId: "j-10", customerName: "Robert Maddox", customerAddress: "418 W Vermont Ave, Anaheim, CA", customerEmail: "rmaddox@example.com", jobSiteAddress: "418 W Vermont Ave, Anaheim, CA 92805", lineItems: [ { id: "li-6", description: "Driveway resurfacing / 1.5\" overlay — 1,600 sq ft", qty: 1600, unit: "sq ft", rate: 2.5 }, { id: "li-7", description: "Sealcoat over new overlay", qty: 1600, unit: "sq ft", rate: 0.22 } ], taxRate: 0.0775, notes: "", paymentTerms: "50% deposit, 50% completion", status: "paid", issuedDate: d("2026-05-31"), dueDate: d("2026-06-15"), paidDate: d("2026-06-02") },
    { id: "inv-5", number: "INV-2026-032", jobId: "j-11", customerName: "Harbor Plaza Retail", customerAddress: "9032 Bolsa Ave, Westminster, CA", customerEmail: "sjenkins@harborplaza.com", jobSiteAddress: "9100 Bolsa Ave, Westminster, CA 92683", lineItems: [ { id: "li-8", description: "Emergency pothole hazard repair — Center B", qty: 1, unit: "job", rate: 3900 } ], taxRate: 0.0775, notes: "", paymentTerms: "Net 15", status: "overdue", issuedDate: d("2026-05-18"), dueDate: d("2026-06-02") },
    { id: "inv-6", number: "INV-2026-031", jobId: "j-12", customerName: "Del Taco #418", customerAddress: "500 S Anaheim Blvd, Anaheim, CA", customerEmail: "gm418@deltaco.com", jobSiteAddress: "500 S Anaheim Blvd, Anaheim, CA 92805", lineItems: [ { id: "li-9", description: "1.5\" overlay — 19,000 sq ft lot", qty: 19000, unit: "sq ft", rate: 1.28 }, { id: "li-10", description: "Full lot restripe + fire lanes + ADA", qty: 1, unit: "job", rate: 3480 } ], taxRate: 0.0775, notes: "", paymentTerms: "50% deposit, 50% completion", status: "paid", issuedDate: d("2026-04-29"), dueDate: d("2026-05-14"), paidDate: d("2026-05-13") },
    { id: "inv-7", number: "INV-2026-030", jobId: "j-9", customerName: "Yorba Linda Medical Plaza", customerAddress: "18700 Yorba Linda Blvd, Yorba Linda, CA", customerEmail: "pm@ylmedical.com", jobSiteAddress: "18700 Yorba Linda Blvd, Yorba Linda, CA 92886", lineItems: [ { id: "li-11", description: "ADA-compliant restripe — 28,000 sq ft medical lot", qty: 1, unit: "job", rate: 7200 }, { id: "li-12", description: "ADA signage + van-accessible stalls", qty: 6, unit: "ea", rate: 366.67 } ], taxRate: 0.0775, notes: "Draft — pending final walk-through sign-off.", paymentTerms: "Net 30", status: "draft", issuedDate: d("2026-07-14"), dueDate: d("2026-08-13") },
  ],

  contracts: [
    { id: "con-1", number: "CON-2026-014", customerName: "Sunridge HOA", customerAddress: "2400 Sunridge Dr, Santa Ana, CA 92705", projectDescription: "Phased overlay of private HOA access roads — Phase 1 (22,000 sq ft): mill transitions, 2\" asphalt overlay, compaction, and edge sealing.", scopeItems: ["Resurfacing & Overlay", "Crack Sealing"], totalAmount: 41500, paymentSchedule: "50% deposit, 50% upon completion", warrantyText: "1-year workmanship warranty on all asphalt work.", status: "signed", createdAt: d("2026-06-18"), signedDate: d("2026-06-24") },
    { id: "con-2", number: "CON-2026-013", customerName: "Tustin Auto Group", customerAddress: "36 Auto Center Dr, Tustin, CA 92782", projectDescription: "Display lot repave: 2\" overlay across 31,000 sq ft, premium finish for vehicle display, full restripe with directional flow.", scopeItems: ["Resurfacing & Overlay", "Striping"], totalAmount: 58000, paymentSchedule: "1/3 deposit · 1/3 at mobilization · 1/3 at completion", warrantyText: "1-year workmanship warranty on all asphalt work.", status: "sent", createdAt: d("2026-07-08") },
    { id: "con-3", number: "CON-2026-012", customerName: "Buena Park Self Storage", customerAddress: "6300 Beach Blvd, Buena Park, CA 90621", projectDescription: "Annual maintenance agreement — crack seal + sealcoat of drive aisles, priority scheduling, 10% loyalty discount on additional work.", scopeItems: ["Crack Sealing", "Sealcoating"], totalAmount: 12600, paymentSchedule: "50% deposit, 50% upon completion", warrantyText: "1-year workmanship warranty on all asphalt work.", status: "complete", createdAt: d("2026-06-01"), signedDate: d("2026-06-05") },
    { id: "con-4", number: "CON-2026-011", customerName: "Miguel & Ana Reyes", customerAddress: "133 S Pine St, Orange, CA 92866", projectDescription: "New residential driveway: demo existing concrete, excavate & grade sub-base, place aggregate base, install 3\" full-depth hot-mix asphalt (1,150 sq ft).", scopeItems: ["Asphalt Paving", "Excavation & Grading"], totalAmount: 7200, paymentSchedule: "50% deposit, 50% upon completion", warrantyText: "1-year workmanship warranty on all asphalt work.", status: "signed", createdAt: d("2026-06-30"), signedDate: d("2026-07-05") },
  ],

  crew: [
    { id: "cr-1", name: "Michael Tebb", role: "foreman", phone: "(714) 457-7111", status: "on_job", skills: ["Paving", "Grading", "Estimating", "Supervision"], hourlyCost: 0, initials: "MT" },
    { id: "cr-2", name: "Adam Hud", role: "operator", phone: "(714) 555-3120", status: "on_job", skills: ["Paver operation", "Roller", "Skid steer"], hourlyCost: 42, initials: "AH" },
    { id: "cr-3", name: "Luis Ortega", role: "laborer", phone: "(714) 555-3231", status: "on_job", skills: ["Sealcoat", "Patching", "Prep"], hourlyCost: 32, initials: "LO" },
    { id: "cr-4", name: "Marcus Bell", role: "striping_tech", phone: "(714) 555-3345", status: "on_job", skills: ["Line striping", "ADA layout", "Stenciling"], hourlyCost: 38, initials: "MB" },
    { id: "cr-5", name: "Diego Ramos", role: "laborer", phone: "(714) 555-3456", status: "available", skills: ["Prep", "Crack seal", "Cleanup"], hourlyCost: 30, initials: "DR" },
    { id: "cr-6", name: "Tommy Nguyen", role: "driver", phone: "(714) 555-3567", status: "available", skills: ["CDL", "Dump truck", "Material haul"], hourlyCost: 34, initials: "TN" },
  ],

  equipment: [
    { id: "eq-1", name: "LeeBoy 8520 Paver", type: "paver", status: "in_use", hours: 4120, nextServiceHours: 4250, lastService: d("2026-05-20"), assignedJobId: "j-1" },
    { id: "eq-2", name: "CAT CB2.7 Roller", type: "roller", status: "operational", hours: 2870, nextServiceHours: 3000, lastService: d("2026-06-02") },
    { id: "eq-3", name: "Peterbilt Dump Truck", type: "dump_truck", status: "operational", hours: 88400, nextServiceHours: 90000, lastService: d("2026-04-15") },
    { id: "eq-4", name: "SealMaster 550 Sealcoat Rig", type: "sealcoat_rig", status: "in_use", hours: 1640, nextServiceHours: 1750, lastService: d("2026-05-28"), assignedJobId: "j-1" },
    { id: "eq-5", name: "Graco LineLazer Striper", type: "striper", status: "in_use", hours: 940, nextServiceHours: 1000, lastService: d("2026-06-10"), assignedJobId: "j-1" },
    { id: "eq-6", name: "Bobcat S650 Skid Steer", type: "skid_steer", status: "operational", hours: 3310, nextServiceHours: 3500, lastService: d("2026-05-05") },
    { id: "eq-7", name: "Wacker Plate Compactor", type: "compactor", status: "maintenance", hours: 1210, nextServiceHours: 1210, lastService: d("2026-07-14"), assignedJobId: undefined },
    { id: "eq-8", name: "Ford F-750 Flatbed", type: "dump_truck", status: "down", hours: 71200, nextServiceHours: 71200, lastService: d("2026-07-10"), assignedJobId: undefined },
  ],

  materials: [
    { id: "m-1", name: "Hot-Mix Asphalt (HMA)", unit: "ton", onHand: 42, reorderAt: 30, unitCost: 92, supplier: "All American Asphalt" },
    { id: "m-2", name: "Commercial Sealcoat", unit: "gal", onHand: 180, reorderAt: 250, unitCost: 3.1, supplier: "SealMaster OC" },
    { id: "m-3", name: "Crack Filler (rubberized)", unit: "box", onHand: 14, reorderAt: 20, unitCost: 46, supplier: "SealMaster OC" },
    { id: "m-4", name: "Aggregate Base Rock", unit: "ton", onHand: 68, reorderAt: 40, unitCost: 28, supplier: "Robertson's Ready Mix" },
    { id: "m-5", name: "Traffic Paint — White", unit: "gal", onHand: 22, reorderAt: 15, unitCost: 24, supplier: "Ennis-Flint" },
    { id: "m-6", name: "Traffic Paint — Yellow", unit: "gal", onHand: 9, reorderAt: 15, unitCost: 24, supplier: "Ennis-Flint" },
    { id: "m-7", name: "Tack Coat Emulsion", unit: "gal", onHand: 110, reorderAt: 60, unitCost: 2.4, supplier: "All American Asphalt" },
  ],

  activity: [
    { id: "a-1", ts: d("2026-07-16T08:12:00"), kind: "lead", text: "New website lead — Priya Raman (driveway resurfacing, Anaheim)" },
    { id: "a-2", ts: d("2026-07-16T06:40:00"), kind: "lead", text: "New website lead — Coastline Property Group (4-site maintenance bid)" },
    { id: "a-3", ts: d("2026-07-15T17:02:00"), kind: "job", text: "JOB-2026-041 Harbor Plaza reached 65% — Section D sealcoat underway" },
    { id: "a-4", ts: d("2026-07-14T15:30:00"), kind: "invoice", text: "INV-2026-030 drafted for Yorba Linda Medical Plaza ($9,400)" },
    { id: "a-5", ts: d("2026-07-12T12:10:00"), kind: "review", text: "New 5★ Google review from Robert M. — 'finish is flawless'" },
    { id: "a-6", ts: d("2026-07-12T09:45:00"), kind: "job", text: "JOB-2026-033 YL Medical ADA restripe completed" },
    { id: "a-7", ts: d("2026-07-09T16:20:00"), kind: "job", text: "JOB-2026-037 Grace Church pothole repair completed in one day" },
    { id: "a-8", ts: d("2026-07-05T11:00:00"), kind: "system", text: "Contract CON-2026-011 signed — Reyes new driveway" },
    { id: "a-9", ts: d("2026-06-30T10:15:00"), kind: "payment", text: "Payment received — Buena Park Storage, INV-2026-035 ($12,600)" },
    { id: "a-10", ts: d("2026-06-24T14:00:00"), kind: "system", text: "Contract CON-2026-014 signed — Sunridge HOA Phase 1 ($41,500)" },
  ],

  revenue: [
    { month: "Aug '25", revenue: 62400, expenses: 38200, jobs: 9 },
    { month: "Sep '25", revenue: 71800, expenses: 42100, jobs: 11 },
    { month: "Oct '25", revenue: 88300, expenses: 51600, jobs: 13 },
    { month: "Nov '25", revenue: 64200, expenses: 39900, jobs: 8 },
    { month: "Dec '25", revenue: 41500, expenses: 28400, jobs: 6 },
    { month: "Jan '26", revenue: 38900, expenses: 26100, jobs: 5 },
    { month: "Feb '26", revenue: 52700, expenses: 33800, jobs: 8 },
    { month: "Mar '26", revenue: 69400, expenses: 41200, jobs: 10 },
    { month: "Apr '26", revenue: 84600, expenses: 49700, jobs: 12 },
    { month: "May '26", revenue: 96200, expenses: 55300, jobs: 14 },
    { month: "Jun '26", revenue: 102800, expenses: 58900, jobs: 15 },
    { month: "Jul '26", revenue: 58400, expenses: 34600, jobs: 9 },
  ],
};
