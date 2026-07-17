import { useState } from "react";
import { ArrowUpRight, Plus, Trash2, GripVertical, Star, Eye, EyeOff, Globe, Palette } from "lucide-react";
import { useStore } from "../../lib/store";
import { getServiceIcon, serviceIconKeys } from "../../lib/icons";
import { uid } from "../../lib/format";
import type { Service } from "../../lib/types";

export default function WebsiteCms() {
  const { db, updateSettings, addService, updateService, removeService } = useStore();
  const s = db.settings;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="card p-4 flex items-center justify-between gap-3 border-highway/30 bg-highway/5">
        <div className="flex items-center gap-3">
          <Globe size={18} className="text-highway" />
          <div>
            <div className="text-sm text-cream font-semibold">Changes go live instantly</div>
            <div className="data text-[11px] text-steel">Everything you edit here updates the public website in real time.</div>
          </div>
        </div>
        <a href="/" target="_blank" className="btn-ghost text-sm whitespace-nowrap"><ArrowUpRight size={14} /> View site</a>
      </div>

      {/* Homepage copy */}
      <Panel title="Homepage copy" hint="The headline and story customers read first.">
        <Field label="Tagline"><input className="input" value={s.tagline} onChange={(e) => updateSettings({ tagline: e.target.value })} /></Field>
        <Field label="Hero subheadline">
          <textarea className="input min-h-[70px] resize-y" value={s.heroSubheadline} onChange={(e) => updateSettings({ heroSubheadline: e.target.value })} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Primary CTA text"><input className="input" value={s.ctaText} onChange={(e) => updateSettings({ ctaText: e.target.value })} /></Field>
          <Field label="Google Business URL"><input className="input" value={s.googleBusinessUrl} onChange={(e) => updateSettings({ googleBusinessUrl: e.target.value })} placeholder="https://…" /></Field>
        </div>
        <Field label="About / story">
          <textarea className="input min-h-[120px] resize-y" value={s.aboutText} onChange={(e) => updateSettings({ aboutText: e.target.value })} />
        </Field>
      </Panel>

      {/* Brand palette */}
      <Panel title="Brand palette" hint="Colors from your logo, used across the site and documents.">
        <div className="flex items-center gap-2 mb-3 data text-[11px] text-steel">
          <Palette size={13} className="text-highway" /> Derived from the MT Asphalt flyer
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Swatch label="Charcoal" value={s.brandPrimary} onChange={(v) => updateSettings({ brandPrimary: v })} />
          <Swatch label="Highway yellow" value={s.brandAccent} onChange={(v) => updateSettings({ brandAccent: v })} />
          <Swatch label="Safety orange" value={s.brandSecondary} onChange={(v) => updateSettings({ brandSecondary: v })} />
        </div>
      </Panel>

      {/* Services */}
      <Panel
        title="Services"
        hint="Shown on the homepage grid & used in quotes."
        action={
          <button
            onClick={() =>
              addService({ id: uid("svc"), name: "New service", slug: "new-service", icon: "Construction", short: "Short description", description: "", priceHint: "Quoted per project", sortOrder: db.services.length + 1, active: true, featured: false })
            }
            className="btn-primary text-xs py-1.5"
          >
            <Plus size={13} /> Add
          </button>
        }
      >
        <div className="space-y-2.5">
          {db.services.map((svc) => (
            <ServiceRow key={svc.id} svc={svc} onChange={(p) => updateService(svc.id, p)} onRemove={() => removeService(svc.id)} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ServiceRow({ svc, onChange, onRemove }: { svc: Service; onChange: (p: Partial<Service>) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const Icon = getServiceIcon(svc.icon);
  return (
    <div className={`card bg-surface-2 ${svc.active ? "" : "opacity-60"}`}>
      <div className="flex items-center gap-3 p-3">
        <GripVertical size={16} className="text-steel-dim shrink-0" />
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-highway/10 text-highway shrink-0"><Icon size={18} /></span>
        <button onClick={() => setOpen((v) => !v)} className="flex-1 text-left min-w-0">
          <div className="text-sm text-cream font-medium truncate">{svc.name}</div>
          <div className="data text-[11px] text-steel truncate">{svc.short}</div>
        </button>
        <button onClick={() => onChange({ featured: !svc.featured })} title="Featured" className="p-1.5">
          <Star size={15} className={svc.featured ? "text-highway" : "text-steel-dim"} fill={svc.featured ? "#f2b705" : "none"} />
        </button>
        <button onClick={() => onChange({ active: !svc.active })} title={svc.active ? "Shown" : "Hidden"} className="p-1.5">
          {svc.active ? <Eye size={15} className="text-ok" /> : <EyeOff size={15} className="text-steel" />}
        </button>
        <button onClick={onRemove} className="p-1.5 text-steel-dim hover:text-danger"><Trash2 size={15} /></button>
      </div>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-hairline space-y-3 fadein">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name"><input className="input py-1.5 text-sm" value={svc.name} onChange={(e) => onChange({ name: e.target.value })} /></Field>
            <Field label="Price hint"><input className="input py-1.5 text-sm" value={svc.priceHint} onChange={(e) => onChange({ priceHint: e.target.value })} /></Field>
          </div>
          <Field label="Short description"><input className="input py-1.5 text-sm" value={svc.short} onChange={(e) => onChange({ short: e.target.value })} /></Field>
          <Field label="Full description"><textarea className="input py-1.5 text-sm min-h-[70px] resize-y" value={svc.description} onChange={(e) => onChange({ description: e.target.value })} /></Field>
          <Field label="Icon">
            <div className="flex flex-wrap gap-1.5">
              {serviceIconKeys.map((k) => {
                const I = getServiceIcon(k);
                return (
                  <button key={k} onClick={() => onChange({ icon: k })} className="grid h-9 w-9 place-items-center rounded-lg border transition-colors" style={svc.icon === k ? { background: "#f2b705", color: "#17130a", borderColor: "#f2b705" } : { background: "var(--color-asphalt)", color: "var(--color-muted)", borderColor: "var(--color-hairline)" }}>
                    <I size={16} />
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      )}
    </div>
  );
}

function Panel({ title, hint, action, children }: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h3 className="display text-lg text-cream">{title}</h3>
          {hint && <p className="data text-[11px] text-steel mt-0.5">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
function Swatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="card bg-surface-2 p-3 flex flex-col items-center gap-2 cursor-pointer">
      <div className="h-12 w-full rounded-lg border border-hairline" style={{ background: value }} />
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-7 bg-transparent cursor-pointer" />
      <div className="text-center">
        <div className="data text-[10px] text-steel uppercase">{label}</div>
        <div className="data text-[11px] text-cream">{value}</div>
      </div>
    </label>
  );
}
