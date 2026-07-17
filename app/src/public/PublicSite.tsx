import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  ArrowRight,
  Check,
  MapPin,
  Clock,
  ShieldCheck,
  Award,
  Star,
  Menu,
  X,
  Calculator,
  Quote,
  ChevronRight,
  Mail,
  Lock,
  BadgeCheck,
} from "lucide-react";
import { useStore } from "../lib/store";
import { LogoMark, Wordmark } from "../components/Logo";
import { Stars } from "../components/ui";
import { getServiceIcon } from "../lib/icons";
import { money, uid } from "../lib/format";
import type { Lead } from "../lib/types";

const tel = (p: string) => "tel:" + p.replace(/[^\d]/g, "");

export default function PublicSite() {
  const { db } = useStore();
  const { settings } = db;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.title = `${settings.companyName} — ${settings.tagline} | Licensed CA #${settings.licenseNumber}`;
  }, [settings]);

  const nav = [
    ["Services", "#services"],
    ["Estimate", "#estimate"],
    ["Our Work", "#work"],
    ["Service Area", "#area"],
    ["Reviews", "#reviews"],
    ["Contact", "#contact"],
  ];

  return (
    <div className="min-h-screen bg-asphalt text-cream">
      <LocalBusinessSchema />

      {/* Announcement bar */}
      <div className="bg-surface border-b border-hairline text-xs">
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 data text-steel">
            <ShieldCheck size={13} className="text-highway" />
            <span className="hidden sm:inline">Licensed · Bonded · Insured —</span>
            <span className="text-cream">CSLB #{settings.licenseNumber}</span>
          </div>
          <div className="flex items-center gap-2 data">
            <Stars value={settings.ratingAverage} size={12} />
            <span className="text-cream">{settings.ratingAverage}</span>
            <span className="text-steel hidden sm:inline">/ {settings.reviewCount}+ reviews</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-asphalt/90 backdrop-blur border-b border-hairline">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          <a href="#top" className="shrink-0">
            <Wordmark size={34} />
          </a>
          <nav className="hidden lg:flex items-center gap-6">
            {nav.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-sm text-muted hover:text-cream transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a href={tel(settings.phonePrimary)} className="btn-primary text-sm hidden sm:inline-flex">
              <Phone size={16} /> {settings.phonePrimary}
            </a>
            <button
              className="lg:hidden btn-ghost px-3 py-2"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="lg:hidden border-t border-hairline bg-surface px-4 py-3 fadein">
            <div className="grid grid-cols-2 gap-1">
              {nav.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="py-2.5 text-sm text-muted hover:text-cream"
                >
                  {label}
                </a>
              ))}
            </div>
            <Link to="/dashboard" className="mt-2 flex items-center gap-2 text-xs data text-steel py-2">
              <Lock size={12} /> Owner Login
            </Link>
          </div>
        )}
      </header>

      <main id="top">
        <Hero settings={settings} />
        <TrustStrip settings={settings} />
        <Services services={db.services.filter((s) => s.active)} />
        <EstimateWidget />
        <Work />
        <ServiceArea settings={settings} />
        <About settings={settings} />
        <Reviews testimonials={db.testimonials.filter((t) => t.active)} settings={settings} />
        <ContactForm settings={settings} />
      </main>

      <Footer settings={settings} nav={nav} />
      {/* clearance so the sticky call bar never covers footer content on mobile */}
      <div className="h-20 sm:hidden" aria-hidden />
      <StickyCallBar settings={settings} />
    </div>
  );
}

/* ---------------- Hero ---------------- */
function Hero({ settings }: { settings: ReturnType<typeof useStore>["db"]["settings"] }) {
  return (
    <section className="relative overflow-hidden asphalt-grain">
      {/* ambient glows */}
      <div
        className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full blur-3xl opacity-20"
        style={{ background: "radial-gradient(circle,#f2b705,transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute top-1/2 -left-40 h-96 w-96 rounded-full blur-3xl opacity-10"
        style={{ background: "radial-gradient(circle,#f25c05,transparent 70%)" }}
      />
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-16 md:pt-20 md:pb-24 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center relative">
        <div className="rise">
          <div className="eyebrow mb-4 flex items-center gap-2">
            <span>{settings.yearsInBusiness} Years</span>
            <span className="text-steel-dim">/</span>
            <span>Orange County, CA</span>
          </div>
          <h1 className="display text-cream text-[clamp(38px,11.5vw,58px)] leading-[0.9] sm:text-6xl md:text-7xl">
            Paving done <span className="text-highway">right</span>,
            <br /> the first time.
          </h1>
          <p className="text-muted mt-5 text-base md:text-lg max-w-xl">
            {settings.heroSubheadline}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href={tel(settings.phonePrimary)} className="btn-primary text-base">
              <Phone size={18} /> {settings.ctaText}
            </a>
            <a href="#estimate" className="btn-ghost text-base">
              <Calculator size={18} /> Instant Estimate
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            {[
              [<Check size={15} className="text-ok" key="a" />, "Free written estimates"],
              [<Check size={15} className="text-ok" key="b" />, "Owner-supervised jobs"],
              [<Check size={15} className="text-ok" key="c" />, "1-year workmanship warranty"],
            ].map(([icon, label], i) => (
              <span key={i} className="flex items-center gap-2 text-muted">
                {icon} {label}
              </span>
            ))}
          </div>
        </div>

        {/* Signature: contractor spec plate */}
        <SpecPlate settings={settings} />
      </div>
      <div className="centerline centerline-live opacity-80" />
    </section>
  );
}

/** Signature object — an embossed contractor credential placard. */
function SpecPlate({ settings }: { settings: ReturnType<typeof useStore>["db"]["settings"] }) {
  return (
    <div className="rise" style={{ animationDelay: "0.1s" }}>
      <div className="relative mx-auto max-w-sm">
        <div className="hazard h-3 rounded-t-xl" />
        <div className="card rounded-none border-x-2 border-hairline bg-surface-2 asphalt-grain px-6 py-6">
          <div className="flex items-center justify-between">
            <LogoMark size={44} />
            <div className="text-right">
              <div className="data text-[10px] tracking-[0.2em] text-steel">CSLB VERIFIED</div>
              <div className="flex items-center gap-1 justify-end text-ok data text-xs mt-1">
                <BadgeCheck size={14} /> ACTIVE
              </div>
            </div>
          </div>
          <div className="centerline my-5 opacity-60" />
          <dl className="space-y-3">
            <PlateRow k="License" v={`#${settings.licenseNumber}`} />
            <PlateRow k="Class" v="C-32" />
            <PlateRow k="Bonded" v={money(settings.bondAmount)} />
            <PlateRow k="Established" v={String(settings.foundedYear)} />
          </dl>
          <div className="centerline my-5 opacity-60" />
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="display text-4xl text-highway">{settings.ratingAverage}</span>
                <Stars value={settings.ratingAverage} size={16} />
              </div>
              <div className="data text-[11px] text-steel mt-1">
                {settings.reviewCount}+ VERIFIED REVIEWS
              </div>
            </div>
            <Award size={40} className="text-highway/40" />
          </div>
        </div>
        <div className="hazard h-3 rounded-b-xl" />
      </div>
    </div>
  );
}
function PlateRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="data text-[11px] tracking-[0.14em] uppercase text-steel">{k}</dt>
      <dd className="data text-sm text-cream font-bold">{v}</dd>
    </div>
  );
}

/* ---------------- Trust strip ---------------- */
function TrustStrip({ settings }: { settings: ReturnType<typeof useStore>["db"]["settings"] }) {
  const items = [
    [ShieldCheck, "Licensed & Bonded", `CSLB #${settings.licenseNumber}`],
    [Award, `${settings.yearsInBusiness} Years Paving`, `Since ${settings.foundedYear}`],
    [Star, `${settings.ratingAverage}★ Rated`, `${settings.reviewCount}+ reviews`],
    [MapPin, "All of Orange County", "Anaheim · Westminster"],
  ] as const;
  return (
    <section className="border-y border-hairline bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(([Icon, title, sub], i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-highway/10 text-highway shrink-0">
              <Icon size={20} />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-cream">{title}</div>
              <div className="data text-[11px] text-steel">{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Services ---------------- */
function Services({ services }: { services: ReturnType<typeof useStore>["db"]["services"] }) {
  return (
    <section id="services" className="mx-auto max-w-6xl px-4 py-16 md:py-24 scroll-mt-20">
      <div className="max-w-2xl">
        <div className="eyebrow mb-3">What we do</div>
        <h2 className="display text-cream text-4xl md:text-5xl">
          Every surface, <span className="text-highway">handled.</span>
        </h2>
        <p className="text-muted mt-3">
          From a single residential driveway to a 100,000 sq ft commercial lot — one licensed crew,
          personally run by Michael Tebb.
        </p>
      </div>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s, i) => {
          const Icon = getServiceIcon(s.icon);
          return (
            <div
              key={s.id}
              className="card card-hover p-5 group rise"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-highway/10 text-highway group-hover:bg-highway group-hover:text-asphalt transition-colors">
                  <Icon size={24} />
                </span>
                {s.featured && (
                  <span className="chip" style={{ color: "#f2b705", background: "rgba(242,183,5,0.12)" }}>
                    Popular
                  </span>
                )}
              </div>
              <h3 className="display text-xl text-cream mt-4">{s.name}</h3>
              <p className="text-sm text-muted mt-1.5 leading-relaxed">{s.short}</p>
              <div className="mt-4 pt-4 border-t border-hairline flex items-center justify-between">
                <span className="data text-xs text-highway">{s.priceHint}</span>
                <a href="#contact" className="text-xs text-steel flex items-center gap-1 hover:text-cream">
                  Get quote <ChevronRight size={14} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Instant Estimate (signature interactive) ---------------- */
const ESTIMATE_RATES: Record<string, { label: string; low: number; high: number; unit: string }> = {
  paving: { label: "New asphalt paving", low: 3.0, high: 4.5, unit: "sq ft" },
  overlay: { label: "Resurfacing / overlay", low: 1.8, high: 2.8, unit: "sq ft" },
  sealcoat: { label: "Sealcoating", low: 0.18, high: 0.3, unit: "sq ft" },
  striping: { label: "Striping (per 300 sq ft/stall)", low: 4, high: 7, unit: "sq ft" },
  repair: { label: "Pothole repair & patching", low: 2.5, high: 5, unit: "sq ft" },
};

function EstimateWidget() {
  const [service, setService] = useState("overlay");
  const [sqft, setSqft] = useState(2000);
  const r = ESTIMATE_RATES[service];
  const low = Math.round((sqft * r.low) / 10) * 10;
  const high = Math.round((sqft * r.high) / 10) * 10;

  return (
    <section id="estimate" className="border-y border-hairline bg-surface scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="eyebrow mb-3">Ballpark in seconds</div>
          <h2 className="display text-cream text-4xl md:text-5xl">
            What will it <span className="text-highway">cost?</span>
          </h2>
          <p className="text-muted mt-3 max-w-lg">
            Drag the slider for a rough range. Every real number comes from a free on-site walk-through
            — no surprises, no obligation.
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <label className="field-label">Service</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ESTIMATE_RATES).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setService(key)}
                    className="chip cursor-pointer transition-colors"
                    style={
                      service === key
                        ? { background: "#f2b705", color: "#17130a", borderColor: "#f2b705" }
                        : { background: "var(--color-surface-2)", color: "var(--color-muted)", borderColor: "var(--color-hairline)" }
                    }
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="field-label">Approx. area</label>
                <span className="data text-highway text-sm">{sqft.toLocaleString()} sq ft</span>
              </div>
              <input
                type="range"
                min={200}
                max={40000}
                step={100}
                value={sqft}
                onChange={(e) => setSqft(Number(e.target.value))}
                className="w-full accent-[#f2b705]"
              />
              <div className="flex justify-between data text-[10px] text-steel-dim mt-1">
                <span>200</span>
                <span>40,000 sq ft</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card asphalt-grain p-8 relative overflow-hidden">
          <div className="hazard absolute top-0 left-0 right-0 h-2" />
          <div className="data text-[11px] tracking-[0.2em] text-steel">ESTIMATED RANGE</div>
          <div className="mt-3 flex items-end gap-2 flex-wrap">
            <span className="display text-highway text-4xl sm:text-5xl md:text-6xl">{money(low)}</span>
            <span className="text-steel data pb-1.5">—</span>
            <span className="display text-cream text-3xl sm:text-4xl md:text-5xl">{money(high)}</span>
          </div>
          <div className="mt-2 data text-xs text-steel">
            {r.label} · {sqft.toLocaleString()} {r.unit}
          </div>
          <div className="centerline my-6 opacity-50" />
          <ul className="space-y-2 text-sm text-muted">
            {["Materials & prep included", "Personally supervised by Michael", "Free written estimate on request"].map(
              (t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check size={15} className="text-ok" /> {t}
                </li>
              )
            )}
          </ul>
          <a href="#contact" className="btn-primary w-full mt-6">
            Lock in a real quote <ArrowRight size={16} />
          </a>
          <p className="text-[11px] text-steel-dim mt-3 text-center">
            Estimate only. Final pricing depends on site conditions.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Our Work ---------------- */
const WORK = [
  { title: "Retail lot — seal + restripe", city: "Westminster", tone: 1 },
  { title: "Residential driveway install", city: "Orange", tone: 2 },
  { title: "HOA access road overlay", city: "Santa Ana", tone: 1 },
  { title: "Medical plaza ADA striping", city: "Yorba Linda", tone: 3 },
  { title: "Church lot pothole repair", city: "Orange", tone: 2 },
  { title: "Dealership display repave", city: "Tustin", tone: 1 },
];
function Work() {
  return (
    <section id="work" className="mx-auto max-w-6xl px-4 py-16 md:py-24 scroll-mt-20">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="max-w-xl">
          <div className="eyebrow mb-3">Our work</div>
          <h2 className="display text-cream text-4xl md:text-5xl">
            22 years of <span className="text-highway">smooth</span> finishes.
          </h2>
        </div>
        <a href="#contact" className="btn-ghost text-sm">
          Start your project <ArrowRight size={15} />
        </a>
      </div>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {WORK.map((w, i) => (
          <div key={i} className="card overflow-hidden card-hover group">
            <div
              className="aspect-[4/3] relative asphalt-grain"
              style={{
                background:
                  w.tone === 1
                    ? "linear-gradient(135deg,#1f1f23,#0f0f11)"
                    : w.tone === 2
                    ? "linear-gradient(135deg,#26221a,#131210)"
                    : "linear-gradient(135deg,#201a17,#120f0e)",
              }}
            >
              {/* striped pavement illustration */}
              <div className="absolute inset-0 flex items-center justify-center opacity-70">
                <div className="w-full px-8">
                  <div className="centerline opacity-80" />
                  <div className="centerline opacity-30 mt-6" />
                </div>
              </div>
              <span className="absolute top-3 left-3 chip" style={{ background: "rgba(15,15,17,0.7)", color: "#f2b705" }}>
                <MapPin size={11} /> {w.city}
              </span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="text-sm font-semibold text-cream">{w.title}</div>
              <ChevronRight size={16} className="text-steel group-hover:text-highway transition-colors" />
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-steel-dim mt-6 data">
        Placeholder tiles — Michael uploads real before/after job photos from the dashboard.
      </p>
    </section>
  );
}

/* ---------------- Service area ---------------- */
function ServiceArea({ settings }: { settings: ReturnType<typeof useStore>["db"]["settings"] }) {
  return (
    <section id="area" className="border-y border-hairline bg-surface scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
        <div>
          <div className="eyebrow mb-3">Where we work</div>
          <h2 className="display text-cream text-4xl md:text-5xl">
            Serving all of <span className="text-highway">Orange County</span>
          </h2>
          <p className="text-muted mt-3 max-w-lg">
            Headquartered in Anaheim with a service footprint across Westminster and the wider county —
            homeowners, businesses, and property managers alike.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {settings.serviceCities.map((c) => (
              <span key={c} className="chip" style={{ background: "var(--color-surface-2)", color: "var(--color-cream)", borderColor: "var(--color-hairline)" }}>
                <MapPin size={11} className="text-highway" /> {c}
              </span>
            ))}
          </div>
        </div>
        {/* stylized county map panel */}
        <div className="card asphalt-grain p-6 relative overflow-hidden aspect-[4/3]">
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(#8a97a0 1px,transparent 1px),linear-gradient(90deg,#8a97a0 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
          <svg viewBox="0 0 300 220" className="relative w-full h-full">
            <path
              d="M40 60 L120 30 L210 45 L260 90 L250 150 L180 190 L100 185 L50 140 Z"
              fill="rgba(138,151,160,0.10)"
              stroke="#8a97a0"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* roads */}
            <path d="M40 120 Q150 90 260 120" stroke="#f2b705" strokeWidth="2" fill="none" opacity="0.5" />
            <path d="M120 30 Q140 110 180 190" stroke="#f2b705" strokeWidth="2" fill="none" opacity="0.5" />
            {[
              [95, 85, "Anaheim", true],
              [70, 130, "Westminster"],
              [150, 120, "Santa Ana"],
              [120, 70, "Fullerton"],
              [200, 95, "Orange"],
              [215, 150, "Irvine"],
            ].map(([x, y, name, hq], i) => (
              <g key={i}>
                <circle cx={x as number} cy={y as number} r={hq ? 6 : 4} fill={hq ? "#f2b705" : "#f25c05"} />
                {hq && <circle cx={x as number} cy={y as number} r={11} fill="none" stroke="#f2b705" strokeWidth="1.5" opacity="0.5" />}
                <text x={(x as number) + 9} y={(y as number) + 4} fill="#c8ccd0" fontSize="9" fontFamily="Space Mono">
                  {name as string}
                </text>
              </g>
            ))}
          </svg>
          <div className="absolute bottom-4 left-6 data text-[11px] text-steel">
            <span className="text-highway">●</span> HQ — Anaheim &nbsp;·&nbsp;{" "}
            <span className="text-safety">●</span> Service area
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- About ---------------- */
function About({ settings }: { settings: ReturnType<typeof useStore>["db"]["settings"] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
        <div className="card asphalt-grain p-8 relative">
          <Quote size={40} className="text-highway/30" />
          <p className="display text-cream text-2xl md:text-3xl leading-tight mt-3">
            "I'm on every job site, every day. My name is on the truck — and on the finish."
          </p>
          <div className="centerline my-6 opacity-50" />
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-highway/15 text-highway display text-lg">
              MT
            </span>
            <div>
              <div className="font-semibold text-cream">{settings.ownerName}</div>
              <div className="data text-xs text-steel">Owner & Foreman</div>
            </div>
          </div>
        </div>
        <div>
          <div className="eyebrow mb-3">Who you're hiring</div>
          <h2 className="display text-cream text-4xl md:text-5xl">
            Owner-operated. <span className="text-highway">Personally.</span>
          </h2>
          <p className="text-muted mt-4 leading-relaxed">{settings.aboutText}</p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              [settings.yearsInBusiness + "+", "Years"],
              [settings.reviewCount + "+", "Reviews"],
              [settings.ratingAverage, "Avg rating"],
            ].map(([v, l]) => (
              <div key={l} className="card p-4 text-center">
                <div className="display text-highway text-3xl">{v}</div>
                <div className="data text-[11px] text-steel mt-1 uppercase tracking-wider">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Reviews ---------------- */
function Reviews({
  testimonials,
  settings,
}: {
  testimonials: ReturnType<typeof useStore>["db"]["testimonials"];
  settings: ReturnType<typeof useStore>["db"]["settings"];
}) {
  return (
    <section id="reviews" className="border-y border-hairline bg-surface scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="eyebrow mb-3">Reputation</div>
            <h2 className="display text-cream text-4xl md:text-5xl">
              {settings.ratingAverage}★ from {settings.reviewCount}+ neighbors
            </h2>
          </div>
          <div className="flex items-center gap-2 data text-sm text-steel">
            <Stars value={settings.ratingAverage} size={18} />
            <span className="text-cream">{settings.ratingAverage} / 5.0</span>
          </div>
        </div>
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <figure key={t.id} className="card card-hover p-6 flex flex-col">
              <Stars value={t.rating} size={14} />
              <blockquote className="text-sm text-cream mt-3 leading-relaxed flex-1">"{t.quote}"</blockquote>
              <figcaption className="mt-4 pt-4 border-t border-hairline">
                <div className="font-semibold text-cream text-sm">{t.author}</div>
                <div className="data text-[11px] text-steel">
                  {t.location} · {t.projectType}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Contact / Free estimate form ---------------- */
function ContactForm({ settings }: { settings: ReturnType<typeof useStore>["db"]["settings"] }) {
  const { addLead } = useStore();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", service: "", message: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const lead: Lead = {
      id: uid("l"),
      name: form.name,
      phone: form.phone,
      email: form.email,
      address: "",
      city: form.city,
      serviceInterest: form.service || "General inquiry",
      message: form.message,
      status: "new",
      source: "website",
      createdAt: new Date().toISOString(),
    };
    addLead(lead);
    // Persist to the serverless lead inbox so it reaches Michael's dashboard
    // from any device (and triggers the email notification when configured).
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    }).catch(() => {
      /* offline / local dev — the local copy above still captured it */
    });
    setSent(true);
  };

  return (
    <section id="contact" className="mx-auto max-w-6xl px-4 py-16 md:py-24 scroll-mt-20">
      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          <div className="eyebrow mb-3">Free estimate</div>
          <h2 className="display text-cream text-4xl md:text-5xl">
            Let's pave <span className="text-highway">something.</span>
          </h2>
          <p className="text-muted mt-3 max-w-md">
            Call Michael directly, or send a few details and we'll get right back to you — usually same day.
          </p>
          <div className="mt-8 space-y-3">
            <a href={tel(settings.phonePrimary)} className="card card-hover p-4 flex items-center gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-highway text-asphalt">
                <Phone size={20} />
              </span>
              <div>
                <div className="data text-[11px] text-steel uppercase tracking-wider">Call / text</div>
                <div className="display text-xl text-cream">{settings.phonePrimary}</div>
              </div>
            </a>
            <div className="grid sm:grid-cols-2 gap-3">
              <InfoCard icon={<Mail size={18} />} label="Email" value={settings.email} />
              <InfoCard icon={<Clock size={18} />} label="Hours" value={settings.businessHours} />
              <InfoCard
                icon={<MapPin size={18} />}
                label="Based in"
                value={`${settings.addressCity}, ${settings.addressState}`}
              />
              <InfoCard icon={<ShieldCheck size={18} />} label="License" value={`CSLB #${settings.licenseNumber}`} />
            </div>
          </div>
        </div>

        <div className="card p-6 md:p-8">
          {sent ? (
            <div className="text-center py-10 fadein">
              <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-ok/15 text-ok">
                <Check size={32} />
              </span>
              <h3 className="display text-2xl text-cream">Request received</h3>
              <p className="text-muted mt-2 max-w-sm mx-auto text-sm">
                Thanks {form.name.split(" ")[0] || "there"} — your details are in Michael's dashboard. Expect a
                call at {form.phone || "your number"} shortly.
              </p>
              <a href={tel(settings.phonePrimary)} className="btn-primary mt-6">
                <Phone size={16} /> Or call now
              </a>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Name" required>
                  <input className="input" required value={form.name} onChange={set("name")} placeholder="Jane Homeowner" />
                </Field>
                <Field label="Phone" required>
                  <input className="input" type="tel" inputMode="tel" autoComplete="tel" required value={form.phone} onChange={set("phone")} placeholder="(714) 555-0123" />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Email">
                  <input className="input" type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" />
                </Field>
                <Field label="City">
                  <input className="input" value={form.city} onChange={set("city")} placeholder="Anaheim" />
                </Field>
              </div>
              <Field label="Service needed">
                <select className="input" value={form.service} onChange={set("service")}>
                  <option value="">Select a service…</option>
                  {["New paving", "Resurfacing / overlay", "Sealcoating", "Crack sealing", "Pothole repair", "Striping", "Not sure — need advice"].map(
                    (o) => (
                      <option key={o}>{o}</option>
                    )
                  )}
                </select>
              </Field>
              <Field label="Project details">
                <textarea
                  className="input min-h-[90px] resize-y"
                  value={form.message}
                  onChange={set("message")}
                  placeholder="Tell us about the job — size, condition, timing…"
                />
              </Field>
              <button type="submit" className="btn-primary w-full">
                Request my free estimate <ArrowRight size={16} />
              </button>
              <p className="data text-[11px] text-steel-dim text-center">
                No spam. Your request goes straight to the owner.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">
        {label} {required && <span className="text-highway">*</span>}
      </span>
      {children}
    </label>
  );
}
function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-3">
      <div className="flex items-center gap-2 text-highway">{icon}</div>
      <div className="data text-[10px] text-steel uppercase tracking-wider mt-2">{label}</div>
      <div className="text-sm text-cream break-words">{value}</div>
    </div>
  );
}

/* ---------------- Footer ---------------- */
function Footer({
  settings,
  nav,
}: {
  settings: ReturnType<typeof useStore>["db"]["settings"];
  nav: string[][];
}) {
  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr] gap-8">
          <div>
            <Wordmark size={36} showTagline />
            <p className="text-muted text-sm mt-4 max-w-xs">
              {settings.tagline}. Licensed, bonded & insured asphalt contractor serving Orange County since{" "}
              {settings.foundedYear}.
            </p>
            <div className="mt-4 flex items-center gap-2 data text-xs text-steel">
              <ShieldCheck size={14} className="text-highway" />
              {settings.licenseStatusNote}
            </div>
          </div>
          <div>
            <div className="data text-[11px] uppercase tracking-[0.2em] text-steel mb-3">Explore</div>
            <ul className="space-y-2">
              {nav.map(([label, href]) => (
                <li key={href}>
                  <a href={href} className="text-sm text-muted hover:text-cream">
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/dashboard" className="text-sm text-steel flex items-center gap-1.5 hover:text-cream">
                  <Lock size={12} /> Owner Login
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="data text-[11px] uppercase tracking-[0.2em] text-steel mb-3">Contact</div>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-highway" />
                <a href={tel(settings.phonePrimary)} className="hover:text-cream">
                  {settings.phonePrimary}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-highway" /> {settings.email}
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-highway mt-0.5" />
                <span>
                  {settings.addressLine1}
                  <br />
                  {settings.addressCity}, {settings.addressState} {settings.addressZip}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Clock size={14} className="text-highway" /> {settings.businessHours}
              </li>
            </ul>
          </div>
        </div>
        <div className="centerline my-8 opacity-40" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 data text-[11px] text-steel">
          <span>
            © {new Date().getFullYear()} {settings.legalEntityName}. All rights reserved.
          </span>
          <span>
            CSLB #{settings.licenseNumber} · {settings.licenseClass}
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- Mobile sticky call bar ---------------- */
function StickyCallBar({ settings }: { settings: ReturnType<typeof useStore>["db"]["settings"] }) {
  return (
    <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-hairline p-2.5 flex gap-2" style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}>
      <a href={tel(settings.phonePrimary)} className="btn-primary flex-1 text-sm">
        <Phone size={16} /> Call now
      </a>
      <a href="#contact" className="btn-ghost flex-1 text-sm">
        <Calculator size={16} /> Free estimate
      </a>
    </div>
  );
}

/* ---------------- SEO: LocalBusiness schema ---------------- */
function LocalBusinessSchema() {
  const { db } = useStore();
  const s = db.settings;
  const data = {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    name: s.companyName,
    image: "/logo.svg",
    telephone: s.phonePrimary,
    email: s.email,
    priceRange: "$$",
    founder: s.ownerName,
    foundingDate: String(s.foundedYear),
    address: {
      "@type": "PostalAddress",
      streetAddress: s.addressLine1,
      addressLocality: s.addressCity,
      addressRegion: s.addressState,
      postalCode: s.addressZip,
      addressCountry: "US",
    },
    areaServed: s.serviceCities.map((c) => ({ "@type": "City", name: c })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: s.ratingAverage,
      reviewCount: s.reviewCount,
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
