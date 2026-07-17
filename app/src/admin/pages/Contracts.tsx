import { useState } from "react";
import { Printer, X, FileSignature, PenLine, ArrowRight } from "lucide-react";
import { useStore } from "../../lib/store";
import { StatusPill, EmptyState } from "../../components/ui";
import { contractStatusStyle } from "../../lib/status";
import { money, dateShort } from "../../lib/format";
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

  const totalValue = db.contracts.reduce((s, c) => s + c.totalAmount, 0);
  const active = db.contracts.filter((c) => c.status === "signed" || c.status === "active");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Contracts" value={db.contracts.length} />
        <MiniStat label="Active value" value={money(active.reduce((s, c) => s + c.totalAmount, 0))} small />
        <MiniStat label="Total booked" value={money(totalValue)} small />
      </div>

      {db.contracts.length === 0 ? (
        <EmptyState icon={<FileSignature size={32} />} title="No contracts yet" />
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
                  <button onClick={() => setPreview(c)} className="btn-ghost flex-1 text-xs py-2"><Printer size={13} /> View / print</button>
                  {next && (
                    <button onClick={() => updateContract(c.id, { status: next, ...(next === "signed" ? { signedDate: "2026-07-16" } : {}) })} className="btn-primary flex-1 text-xs py-2">
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
    </div>
  );
}

function ContractPreview({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const { db } = useStore();
  const s = db.settings;
  const half = contract.totalAmount / 2;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-start justify-center p-3 md:p-8 print-root" onClick={onClose}>
      <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 no-print">
          <span className="data text-xs text-steel">{contract.number}</span>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="btn-primary text-sm"><Printer size={15} /> Print / Save PDF</button>
            <button onClick={onClose} className="btn-ghost text-sm px-3"><X size={16} /></button>
          </div>
        </div>
        <div className="print-doc bg-white text-[#17171a] rounded-lg overflow-hidden shadow-2xl">
          <div style={{ height: 8, background: "repeating-linear-gradient(45deg,#f2b705 0,#f2b705 12px,#0f0f11 12px,#0f0f11 24px)" }} />
          <div className="p-7 text-sm">
            <div className="flex items-start justify-between">
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

            <div className="grid grid-cols-2 gap-6 mt-6">
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
              <div className="data text-[11px] text-neutral-500 mt-1">Deposit due at signing: {money(half)} · Balance on completion: {money(half)}</div>
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

            <div className="grid grid-cols-2 gap-8 mt-8">
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
function MiniStat({ label, value, small }: { label: string; value: React.ReactNode; small?: boolean }) {
  return (
    <div className="card p-3.5 relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-1 bg-highway" />
      <div className="data text-[10px] uppercase tracking-wider text-steel">{label}</div>
      <div className={`display text-cream mt-1 ${small ? "text-lg" : "text-2xl"}`}>{value}</div>
    </div>
  );
}
