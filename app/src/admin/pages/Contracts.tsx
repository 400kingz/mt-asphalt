import { useState } from "react";
import { Printer, X, FileSignature, PenLine, ArrowRight, Plus, Trash2 } from "lucide-react";
import { useStore } from "../../lib/store";
import { StatusPill, EmptyState } from "../../components/ui";
import { contractStatusStyle } from "../../lib/status";
import { money, dateShort, today, uid } from "../../lib/format";
import { LogoMark } from "../../components/Logo";
import type { Contract, ContractStatus } from "../../lib/types";

const NEXT: Record<ContractStatus, ContractStatus | null> = {
  draft: "sent",
  sent: "signed",
  signed: "active",
  active: "complete",
  complete: null,
};

export default function Contracts() {
  const { db, updateContract } = useStore();
  const [preview, setPreview] = useState<Contract | null>(null);
  const [building, setBuilding] = useState(false);

  const totalValue = db.contracts.reduce((s, c) => s + c.totalAmount, 0);
  const active = db.contracts.filter((c) => c.status === "signed" || c.status === "active");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="Contracts" value={db.contracts.length} />
        <MiniStat label="Active value" value={money(active.reduce((s, c) => s + c.totalAmount, 0))} small />
        <MiniStat label="Total booked" value={money(totalValue)} small />
        <button onClick={() => setBuilding(true)} className="btn-primary text-sm justify-center col-span-2 md:col-span-1">
          <Plus size={16} /> New contract
        </button>
      </div>

      {db.contracts.length === 0 ? (
        <EmptyState icon={<FileSignature size={32} />} title="No contracts yet" hint="Create one with the New contract button." />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {db.contracts.map((c) => {
            const next = NEXT[c.status];
            return (
              <div key={c.id} className="card card-hover p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="data text-xs text-highway">{c.number}</div>
                    <div className="font-semibold text-cream mt-0.5">{c.customerName}</div>
                  </div>
                  <StatusPill s={contractStatusStyle[c.status]} />
                </div>
                <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">{c.projectDescription}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {c.scopeItems.map((s) => (
                    <span key={s} className="chip" style={{ background: "var(--color-surface-2)", color: "var(--color-cream)", borderColor: "var(--color-hairline)" }}>{s}</span>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-hairline flex items-center justify-between">
                  <div>
                    <div className="data text-[10px] text-steel uppercase">Amount</div>
                    <div className="data text-lg text-highway font-bold">{money(c.totalAmount)}</div>
                  </div>
                  <div className="text-right data text-[11px] text-steel">
                    {c.signedDate ? `Signed ${dateShort(c.signedDate)}` : `Created ${dateShort(c.createdAt)}`}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => setPreview(c)} className="btn-ghost flex-1 text-xs py-2 px-3 lg:px-[1.4rem]"><Printer size={13} /> View / print</button>
                  {next && (
                    <button onClick={() => updateContract(c.id, { status: next, ...(next === "signed" ? { signedDate: today.format("YYYY-MM-DD") } : {}) })} className="btn-primary flex-1 text-xs py-2 px-3 lg:px-[1.4rem]">
                      Mark {contractStatusStyle[next].label} <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && <ContractPreview contract={preview} onClose={() => setPreview(null)} />}
      {building && <ContractBuilder onClose={() => setBuilding(false)} onCreated={(c) => { setBuilding(false); setPreview(c); }} />}
    </div>
  );
}

/* ---------- Contract builder ---------- */
const SCHEDULE_PRESETS = [
  "50% deposit, 50% upon completion",
  "1/3 deposit · 1/3 at mobilization · 1/3 at completion",
  "Completion only",
  "Net 30",
];

function ContractBuilder({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Contract) => void }) {
  const { db, addContract } = useStore();
  const nextSeq =
    Math.max(0, ...db.contracts.map((c) => parseInt(c.number.split("-").pop() ?? "0", 10) || 0)) + 1;
  const nextNum = `CON-${today.format("YYYY")}-${String(nextSeq).padStart(3, "0")}`;

  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [scopeItems, setScopeItems] = useState<string[]>([]);
  const [customScope, setCustomScope] = useState("");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [paymentSchedule, setPaymentSchedule] = useState(db.settings.defaultPaymentTerms);
  const [warrantyText, setWarrantyText] = useState(db.settings.warrantyText);

  const toggleScope = (name: string) =>
    setScopeItems((arr) => (arr.includes(name) ? arr.filter((x) => x !== name) : [...arr, name]));

  const addCustomScope = () => {
    const v = customScope.trim();
    if (v && !scopeItems.includes(v)) setScopeItems((arr) => [...arr, v]);
    setCustomScope("");
  };

  const milestones = paymentMilestones(paymentSchedule, totalAmount);

  const create = () => {
    const c: Contract = {
      id: uid("con"),
      number: nextNum,
      customerName: customerName || "New customer",
      customerAddress,
      projectDescription: projectDescription || scopeItems.join(", "),
      scopeItems,
      totalAmount,
      paymentSchedule,
      warrantyText,
      status: "draft",
      createdAt: today.format("YYYY-MM-DD"),
    };
    addContract(c);
    onCreated(c);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 fadein" />
      <div className="relative w-full max-w-lg bg-surface border-l border-hairline h-full overflow-y-auto rise" style={{ animationDuration: "0.3s" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-surface/95 backdrop-blur border-b border-hairline p-4 flex items-center justify-between z-10">
          <div>
            <div className="data text-[11px] text-steel">New contract</div>
            <h3 className="display text-lg text-cream">{nextNum}</h3>
          </div>
          <button onClick={onClose} className="grid h-11 w-11 md:h-9 md:w-9 place-items-center rounded-lg card"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <L label="Customer name"><input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Sunridge HOA" /></L>
            <L label="Customer address"><input className="input" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="2400 Sunridge Dr, Santa Ana, CA" /></L>
          </div>

          <L label="Project description">
            <textarea className="input min-h-[90px] resize-y" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder="Describe the job — e.g. 2&quot; overlay across 22,000 sq ft of private access road, mill transitions, compaction, edge sealing." />
          </L>

          <div>
            <span className="field-label">Scope of work</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {db.services.filter((s) => s.active).map((s) => {
                const on = scopeItems.includes(s.name);
                return (
                  <button key={s.id} type="button" onClick={() => toggleScope(s.name)} className="chip cursor-pointer" style={on ? { background: "#f2b705", color: "#17130a", borderColor: "#f2b705" } : { background: "var(--color-surface-2)", color: "var(--color-muted)", borderColor: "var(--color-hairline)" }}>
                    {s.name}
                  </button>
                );
              })}
            </div>
            {scopeItems.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {scopeItems.map((s) => (
                  <span key={s} className="chip" style={{ background: "var(--color-surface-2)", color: "var(--color-cream)", borderColor: "var(--color-hairline)" }}>
                    {s}
                    <button type="button" onClick={() => toggleScope(s)} className="ml-1 text-steel-dim hover:text-danger" aria-label={`Remove ${s}`}><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <input className="input py-1.5 text-sm flex-1" value={customScope} onChange={(e) => setCustomScope(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomScope())} placeholder="Custom scope item…" />
              <button type="button" onClick={addCustomScope} className="btn-ghost text-xs px-3"><Plus size={13} /> Add</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <L label="Total contract amount ($)"><input className="input data" type="number" min={0} value={totalAmount || ""} onChange={(e) => setTotalAmount(Number(e.target.value))} placeholder="41500" /></L>
            <L label="Payment schedule">
              <select className="input" value={SCHEDULE_PRESETS.includes(paymentSchedule) ? paymentSchedule : "__custom"} onChange={(e) => { if (e.target.value !== "__custom") setPaymentSchedule(e.target.value); }}>
                {SCHEDULE_PRESETS.map((p) => <option key={p} value={p}>{p}</option>)}
                <option value="__custom">Custom…</option>
              </select>
            </L>
          </div>
          {!SCHEDULE_PRESETS.includes(paymentSchedule) && (
            <L label="Custom payment schedule"><input className="input" value={paymentSchedule} onChange={(e) => setPaymentSchedule(e.target.value)} placeholder="e.g. 25% deposit · 75% on completion" /></L>
          )}

          <L label="Warranty text">
            <textarea className="input min-h-[60px] resize-y" value={warrantyText} onChange={(e) => setWarrantyText(e.target.value)} />
          </L>

          {totalAmount > 0 && milestones.length > 0 && (
            <div className="card p-3 bg-surface-2 space-y-1 data text-sm">
              <div className="data text-[10px] uppercase tracking-wider text-steel mb-1">Payment milestones</div>
              {milestones.map((m) => (
                <div key={m.label} className="flex justify-between text-steel"><span>{m.label}</span><span className="text-cream">{money(m.amount)}</span></div>
              ))}
              <div className="flex justify-between text-cream font-bold pt-1 border-t border-hairline mt-1"><span>Total</span><span className="text-highway">{money(totalAmount)}</span></div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-surface/95 backdrop-blur border-t border-hairline p-4 flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1 text-sm">Cancel</button>
          <button onClick={create} className="btn-primary flex-1 text-sm">Create & preview</button>
        </div>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

/** Break a payment-schedule string into labeled milestones with amounts. */
function paymentMilestones(schedule: string, total: number): { label: string; amount: number }[] {
  const s = schedule.toLowerCase();
  if (total <= 0) return [];
  if (s.includes("1/3")) {
    const third = Math.round((total / 3) * 100) / 100;
    return [
      { label: "Deposit at signing", amount: third },
      { label: "Due at mobilization", amount: third },
      { label: "Due on completion", amount: Math.round((total - third * 2) * 100) / 100 },
    ];
  }
  if (s.includes("50%")) {
    const half = Math.round((total / 2) * 100) / 100;
    return [
      { label: "Deposit due at signing", amount: half },
      { label: "Balance on completion", amount: Math.round((total - half) * 100) / 100 },
    ];
  }
  if (s.includes("completion only") || s.includes("100%")) {
    return [{ label: "Due on completion", amount: total }];
  }
  return [];
}

function ContractPreview({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const { db } = useStore();
  const s = db.settings;
  const milestones = paymentMilestones(contract.paymentSchedule, contract.totalAmount);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-start justify-center p-3 md:p-8 print-root" onClick={onClose}>
      <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 no-print">
          <span className="data text-xs text-steel">{contract.number}</span>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="btn-primary text-sm"><Printer size={15} /> Print / Save PDF</button>
            <button onClick={onClose} className="btn-ghost text-sm px-3 min-w-[44px] lg:min-w-0"><X size={16} /></button>
          </div>
        </div>
        <div className="print-doc bg-white text-[#17171a] rounded-lg overflow-hidden shadow-2xl">
          <div style={{ height: 8, background: "repeating-linear-gradient(45deg,#f2b705 0,#f2b705 12px,#0f0f11 12px,#0f0f11 24px)" }} />
          <div className="p-5 sm:p-7 text-sm">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <LogoMark size={44} />
                <div>
                  <div className="display text-xl">MT ASPHALT</div>
                  <div className="data text-[11px] text-neutral-500">CSLB #{s.licenseNumber} · {s.licenseClass}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="display text-xl">PAVING CONTRACT</div>
                <div className="data text-xs text-neutral-600 mt-1">{contract.number} · {dateShort(contract.createdAt)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 mt-6">
              <Party title="Contractor" lines={[s.legalEntityName, s.ownerName + ", Owner", s.addressLine1, `${s.addressCity}, ${s.addressState} ${s.addressZip}`, s.phonePrimary, `Bond #${s.bondNumber} · ${money(s.bondAmount)}`]} />
              <Party title="Customer" lines={[contract.customerName, contract.customerAddress]} />
            </div>

            <Section title="1 · Scope of Work">
              <p className="text-neutral-700">{contract.projectDescription}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {contract.scopeItems.map((x) => (
                  <span key={x} className="data text-[11px] px-2 py-0.5 rounded border border-neutral-300 text-neutral-600">{x}</span>
                ))}
              </div>
            </Section>

            <Section title="2 · Contract Price & Payment">
              <div className="flex justify-between border-b border-neutral-200 py-1.5"><span className="text-neutral-600">Total contract amount</span><span className="data font-bold">{money(contract.totalAmount)}</span></div>
              <div className="flex justify-between py-1.5 text-neutral-600"><span>Payment schedule</span><span className="data text-right">{contract.paymentSchedule}</span></div>
              {milestones.length > 0 && (
                <div className="data text-[11px] text-neutral-500 mt-1 flex flex-wrap gap-x-1">
                  {milestones.map((m, i) => (
                    <span key={m.label} className="whitespace-nowrap">{i > 0 && "· "}{m.label}: {money(m.amount)}</span>
                  ))}
                </div>
              )}
            </Section>

            <Section title="3 · Warranty & Terms">
              <ul className="list-disc pl-5 text-neutral-700 space-y-1 text-[13px]">
                <li>{contract.warrantyText}</li>
                <li>Materials warranted by manufacturer only.</li>
                <li>Change orders must be approved in writing before additional work proceeds.</li>
                <li>Contractor is licensed, bonded & insured in California per CSLB requirements.</li>
                <li>MT Asphalt is not responsible for damage caused by vehicle weight exceeding design load prior to full cure.</li>
              </ul>
            </Section>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 mt-8">
              <Sign label="Customer signature" />
              <Sign label="Michael Tebb — MT Asphalt" />
            </div>

            <div className="mt-6 pt-3 text-center data text-[10px] text-neutral-400 border-t border-neutral-200">
              {s.legalEntityName} · {s.phonePrimary} · Licensed, Bonded & Insured — CSLB #{s.licenseNumber}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function Party({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div>
      <div className="data text-[10px] uppercase tracking-wider text-neutral-400 mb-1">{title}</div>
      {lines.map((l, i) => (
        <div key={i} className={i === 0 ? "font-bold" : "text-neutral-600"}>{l}</div>
      ))}
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="display text-sm mb-1.5" style={{ color: "#0f0f11" }}>{title}</div>
      {children}
    </div>
  );
}
function Sign({ label }: { label: string }) {
  return (
    <div>
      <div className="h-10 border-b border-neutral-400 flex items-end">
        <PenLine size={14} className="text-neutral-300 mb-1" />
      </div>
      <div className="data text-[10px] text-neutral-500 mt-1 flex justify-between"><span>{label}</span><span>Date</span></div>
    </div>
  );
}
function MiniStat({ label, value, small, className }: { label: string; value: React.ReactNode; small?: boolean; className?: string }) {
  return (
    <div className={`card p-3.5 relative overflow-hidden ${className ?? ""}`}>
      <div className="absolute left-0 top-0 h-full w-1 bg-highway" />
      <div className="data text-[11px] sm:text-[10px] uppercase tracking-wider text-steel">{label}</div>
      <div className={`display text-cream mt-1 ${small ? "text-lg" : "text-2xl"}`}>{value}</div>
    </div>
  );
}
