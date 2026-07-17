import { useState } from "react";
import { Building2, Phone, ShieldCheck, DollarSign, MapPin, RotateCcw, X, Plus } from "lucide-react";
import { useStore } from "../../lib/store";

export default function SettingsPage() {
  const { db, updateSettings, resetAll } = useStore();
  const s = db.settings;
  const [cityInput, setCityInput] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Company & contact */}
      <Panel icon={<Building2 size={16} />} title="Company & contact" hint="Shown in the header, footer, invoices and contracts.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Company name (DBA)"><input className="input" value={s.companyName} onChange={(e) => updateSettings({ companyName: e.target.value })} /></Field>
          <Field label="Legal entity name"><input className="input" value={s.legalEntityName} onChange={(e) => updateSettings({ legalEntityName: e.target.value })} /></Field>
          <Field label="Owner name"><input className="input" value={s.ownerName} onChange={(e) => updateSettings({ ownerName: e.target.value })} /></Field>
          <Field label="Email"><input className="input" value={s.email} onChange={(e) => updateSettings({ email: e.target.value })} /></Field>
          <Field label="Primary phone"><input className="input" value={s.phonePrimary} onChange={(e) => updateSettings({ phonePrimary: e.target.value })} /></Field>
          <Field label="Secondary phone"><input className="input" value={s.phoneSecondary} onChange={(e) => updateSettings({ phoneSecondary: e.target.value })} /></Field>
          <Field label="Business hours"><input className="input" value={s.businessHours} onChange={(e) => updateSettings({ businessHours: e.target.value })} /></Field>
        </div>
      </Panel>

      {/* Address & service area */}
      <Panel icon={<MapPin size={16} />} title="Address & service area">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Street"><input className="input" value={s.addressLine1} onChange={(e) => updateSettings({ addressLine1: e.target.value })} /></Field>
          <Field label="City"><input className="input" value={s.addressCity} onChange={(e) => updateSettings({ addressCity: e.target.value })} /></Field>
          <Field label="State"><input className="input" value={s.addressState} onChange={(e) => updateSettings({ addressState: e.target.value })} /></Field>
          <Field label="ZIP"><input className="input" value={s.addressZip} onChange={(e) => updateSettings({ addressZip: e.target.value })} /></Field>
        </div>
        <Field label="Service cities">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {s.serviceCities.map((c) => (
              <span key={c} className="chip flex items-center gap-1" style={{ background: "var(--color-surface-2)", color: "var(--color-cream)", borderColor: "var(--color-hairline)" }}>
                {c}
                <button onClick={() => updateSettings({ serviceCities: s.serviceCities.filter((x) => x !== c) })} className="hover:text-danger"><X size={11} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="input" value={cityInput} onChange={(e) => setCityInput(e.target.value)} placeholder="Add a city…" onKeyDown={(e) => { if (e.key === "Enter" && cityInput.trim()) { updateSettings({ serviceCities: [...s.serviceCities, cityInput.trim()] }); setCityInput(""); } }} />
            <button onClick={() => { if (cityInput.trim()) { updateSettings({ serviceCities: [...s.serviceCities, cityInput.trim()] }); setCityInput(""); } }} className="btn-ghost px-3"><Plus size={15} /></button>
          </div>
        </Field>
      </Panel>

      {/* License */}
      <Panel icon={<ShieldCheck size={16} />} title="License & bonding" hint="Displayed as your trust badge everywhere.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="CSLB license #"><input className="input" value={s.licenseNumber} onChange={(e) => updateSettings({ licenseNumber: e.target.value })} /></Field>
          <Field label="Classification"><input className="input" value={s.licenseClass} onChange={(e) => updateSettings({ licenseClass: e.target.value })} /></Field>
          <Field label="Bond #"><input className="input" value={s.bondNumber} onChange={(e) => updateSettings({ bondNumber: e.target.value })} /></Field>
          <Field label="Bond carrier"><input className="input" value={s.bondCarrier} onChange={(e) => updateSettings({ bondCarrier: e.target.value })} /></Field>
        </div>
        <Field label="License status note"><input className="input" value={s.licenseStatusNote} onChange={(e) => updateSettings({ licenseStatusNote: e.target.value })} /></Field>
        <Toggle label="Show license number publicly on the website" value={s.showLicenseOnSite} onChange={(v) => updateSettings({ showLicenseOnSite: v })} />
      </Panel>

      {/* Financial defaults */}
      <Panel icon={<DollarSign size={16} />} title="Financial defaults" hint="Pre-fill new quotes, invoices and contracts.">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Labor rate ($/hr)"><input type="number" className="input data" value={s.laborRatePerHour} onChange={(e) => updateSettings({ laborRatePerHour: Number(e.target.value) })} /></Field>
          <Field label="Sales tax rate"><input type="number" step="0.0001" className="input data" value={s.salesTaxRate} onChange={(e) => updateSettings({ salesTaxRate: Number(e.target.value) })} /></Field>
          <Field label="Material markup (%)"><input type="number" className="input data" value={s.materialMarkupPct} onChange={(e) => updateSettings({ materialMarkupPct: Number(e.target.value) })} /></Field>
        </div>
        <Field label="Default payment terms"><input className="input" value={s.defaultPaymentTerms} onChange={(e) => updateSettings({ defaultPaymentTerms: e.target.value })} /></Field>
        <Field label="Warranty text"><input className="input" value={s.warrantyText} onChange={(e) => updateSettings({ warrantyText: e.target.value })} /></Field>
      </Panel>

      {/* Danger zone */}
      <div className="card p-5 border-danger/30">
        <h3 className="display text-lg text-cream">Reset demo data</h3>
        <p className="text-muted text-sm mt-1">Restore all leads, jobs, invoices and settings to the original seed. Useful after exploring.</p>
        {confirmReset ? (
          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => { resetAll(); setConfirmReset(false); }} className="btn-primary text-sm" style={{ background: "#ef4d4d", boxShadow: "0 6px 0 -1px #b91c1c" }}>
              <RotateCcw size={15} /> Yes, reset everything
            </button>
            <button onClick={() => setConfirmReset(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmReset(true)} className="btn-ghost text-sm mt-3 border-danger/40 text-danger"><RotateCcw size={15} /> Reset to defaults</button>
        )}
      </div>
    </div>
  );
}

function Panel({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-highway">{icon}</span>
        <div>
          <h3 className="display text-lg text-cream leading-tight">{title}</h3>
          {hint && <p className="data text-[11px] text-steel">{hint}</p>}
        </div>
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
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex items-center gap-3 w-full">
      <span className="relative h-6 w-11 rounded-full transition-colors shrink-0" style={{ background: value ? "#f2b705" : "#34343a" }}>
        <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: value ? "22px" : "2px" }} />
      </span>
      <span className="text-sm text-cream text-left">{label}</span>
    </button>
  );
}
