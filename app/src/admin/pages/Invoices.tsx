import { useState } from "react";
import {
  Plus,
  X,
  Printer,
  Trash2,
  Send,
  CheckCircle2,
  ReceiptText,
  Search as SearchIcon,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { StatusPill, EmptyState } from "../../components/ui";
import { invoiceStatusStyle } from "../../lib/status";
import { money, dateShort, uid, invoiceSubtotal, daysUntil } from "../../lib/format";
import { LogoMark } from "../../components/Logo";
import type { Invoice, InvoiceStatus, LineItem } from "../../lib/types";

const invTotal = (inv: Invoice) => invoiceSubtotal(inv.lineItems) * (1 + inv.taxRate);

export default function Invoices() {
  const { db, updateInvoice } = useStore();
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [building, setBuilding] = useState(false);

  const invoices = db.invoices
    .filter((i) => (filter === "all" ? true : i.status === filter))
    .filter((i) => (q ? (i.number + i.customerName).toLowerCase().includes(q.toLowerCase()) : true));

  const paidMTD = db.invoices
    .filter((i) => i.status === "paid" && i.paidDate && i.paidDate >= "2026-07-01")
    .reduce((s, i) => s + invTotal(i), 0);
  const outstanding = db.invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((s, i) => s + invTotal(i), 0);
  const overdueAmt = db.invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + invTotal(i), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="Paid — July" value={money(paidMTD)} accent="#4ec27a" small />
        <MiniStat label="Outstanding" value={money(outstanding)} accent="#5b9bd5" small />
        <MiniStat label="Overdue" value={money(overdueAmt)} accent="#ef4d4d" small />
        <button onClick={() => setBuilding(true)} className="btn-primary text-sm justify-center">
          <Plus size={16} /> New invoice
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="card flex items-center gap-2 px-3 py-2 text-steel flex-1 min-w-[160px] max-w-xs">
          <SearchIcon size={15} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoices…" className="bg-transparent outline-none text-sm text-cream w-full placeholder:text-steel-dim" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "draft", "sent", "paid", "overdue"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className="chip cursor-pointer" style={filter === f ? { background: "#f2b705", color: "#17130a", borderColor: "#f2b705" } : { background: "var(--color-surface-2)", color: "var(--color-muted)", borderColor: "var(--color-hairline)" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {invoices.length === 0 ? (
        <EmptyState icon={<ReceiptText size={32} />} title="No invoices" hint="Create one with the New invoice button." />
      ) : (
        <div className="card overflow-hidden">
          {/* header row (desktop) */}
          <div className="hidden md:grid grid-cols-[1fr_1.4fr_1fr_0.8fr_0.9fr_auto] gap-3 px-4 py-2.5 border-b border-hairline data text-[10px] uppercase tracking-wider text-steel">
            <span>Invoice</span><span>Customer</span><span>Issued / Due</span><span>Status</span><span className="text-right">Total</span><span></span>
          </div>
          <div className="divide-y divide-[#242428]">
            {invoices.map((inv) => {
              const overdue = inv.status === "overdue";
              return (
                <div key={inv.id} className="grid md:grid-cols-[1fr_1.4fr_1fr_0.8fr_0.9fr_auto] gap-2 md:gap-3 px-4 py-3 items-center hover:bg-surface-2/50 transition-colors">
                  <button onClick={() => setPreview(inv)} className="data text-sm text-highway text-left">{inv.number}</button>
                  <div className="text-sm text-cream truncate">{inv.customerName}</div>
                  <div className="data text-[11px] text-steel">
                    {dateShort(inv.issuedDate)}
                    <span className={overdue ? "text-danger" : ""}> · due {dateShort(inv.dueDate)}</span>
                    {overdue && <span className="text-danger"> ({Math.abs(daysUntil(inv.dueDate))}d late)</span>}
                  </div>
                  <div><StatusPill s={invoiceStatusStyle[inv.status]} live={overdue} /></div>
                  <div className="data text-sm text-cream md:text-right font-bold">{money(invTotal(inv))}</div>
                  <div className="flex items-center gap-1 md:justify-end">
                    <button onClick={() => setPreview(inv)} className="grid h-8 w-8 place-items-center rounded-lg card card-hover" title="Preview / print">
                      <Printer size={14} className="text-muted" />
                    </button>
                    {inv.status !== "paid" && (
                      <button onClick={() => updateInvoice(inv.id, { status: "paid", paidDate: "2026-07-16" })} className="grid h-8 w-8 place-items-center rounded-lg card card-hover" title="Mark paid">
                        <CheckCircle2 size={14} className="text-ok" />
                      </button>
                    )}
                    {inv.status === "draft" && (
                      <button onClick={() => updateInvoice(inv.id, { status: "sent" })} className="grid h-8 w-8 place-items-center rounded-lg card card-hover" title="Mark sent">
                        <Send size={14} className="text-info" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {preview && <InvoicePreview invoice={preview} onClose={() => setPreview(null)} />}
      {building && <InvoiceBuilder onClose={() => setBuilding(false)} onCreated={(inv) => { setBuilding(false); setPreview(inv); }} />}
    </div>
  );
}

/* ---------- Printable branded invoice ---------- */
function InvoicePreview({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const { db } = useStore();
  const s = db.settings;
  const subtotal = invoiceSubtotal(invoice.lineItems);
  const tax = subtotal * invoice.taxRate;
  const total = subtotal + tax;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-start justify-center p-3 md:p-8 print-root" onClick={onClose}>
      <div className="w-full max-w-2xl my-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 no-print">
          <span className="data text-xs text-steel">Preview · {invoice.number}</span>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="btn-primary text-sm">
              <Printer size={15} /> Print / Save PDF
            </button>
            <button onClick={onClose} className="btn-ghost text-sm px-3">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* document */}
        <div className="print-doc bg-white text-[#17171a] rounded-lg overflow-hidden shadow-2xl">
          <div style={{ height: 8, background: "repeating-linear-gradient(45deg,#f2b705 0,#f2b705 12px,#0f0f11 12px,#0f0f11 24px)" }} />
          <div className="p-5 sm:p-7">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <LogoMark size={48} />
                <div>
                  <div className="display text-2xl" style={{ color: "#0f0f11" }}>
                    MT ASPHALT
                  </div>
                  <div className="data text-[11px] text-neutral-500">{s.tagline}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="display text-3xl" style={{ color: "#0f0f11" }}>INVOICE</div>
                <div className="data text-sm text-neutral-600 mt-1">{invoice.number}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6 text-sm">
              <div>
                <div className="data text-[10px] uppercase tracking-wider text-neutral-400 mb-1">From</div>
                <div className="font-bold">{s.legalEntityName}</div>
                <div className="text-neutral-600">{s.addressLine1}</div>
                <div className="text-neutral-600">{s.addressCity}, {s.addressState} {s.addressZip}</div>
                <div className="text-neutral-600">{s.phonePrimary}</div>
                <div className="text-neutral-600">CSLB #{s.licenseNumber} · {s.licenseClass}</div>
              </div>
              <div>
                <div className="data text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Bill to</div>
                <div className="font-bold">{invoice.customerName}</div>
                <div className="text-neutral-600 whitespace-pre-line">{invoice.customerAddress}</div>
                <div className="text-neutral-600">{invoice.customerEmail}</div>
                <div className="mt-2 data text-[11px] text-neutral-500">
                  Issued {dateShort(invoice.issuedDate)} · Due {dateShort(invoice.dueDate)}
                </div>
              </div>
            </div>

            {invoice.jobSiteAddress && (
              <div className="mt-4 data text-[11px] text-neutral-500">Job site: {invoice.jobSiteAddress}</div>
            )}

            <div className="overflow-x-auto mt-5">
              <table className="w-full text-sm min-w-[420px]">
                <thead>
                  <tr className="text-left data text-[10px] uppercase tracking-wider text-neutral-400 border-b-2" style={{ borderColor: "#0f0f11" }}>
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((li) => (
                    <tr key={li.id} className="border-b border-neutral-200">
                      <td className="py-2.5 pr-2">{li.description}</td>
                      <td className="py-2.5 text-right data text-neutral-600">{li.qty.toLocaleString()} {li.unit}</td>
                      <td className="py-2.5 text-right data text-neutral-600">{money(li.rate, true)}</td>
                      <td className="py-2.5 text-right data font-bold">{money(li.qty * li.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4">
              <div className="w-56 space-y-1.5 text-sm">
                <Row k="Subtotal" v={money(subtotal)} />
                <Row k={`Tax (${(invoice.taxRate * 100).toFixed(2)}%)`} v={money(tax)} />
                <div className="flex justify-between pt-2 mt-1 border-t-2" style={{ borderColor: "#0f0f11" }}>
                  <span className="display text-lg">Total</span>
                  <span className="display text-lg" style={{ color: "#0f0f11" }}>{money(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6 text-xs text-neutral-600">
              <div>
                <div className="data text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Payment terms</div>
                <div>{invoice.paymentTerms}</div>
                {invoice.notes && <div className="mt-2">{invoice.notes}</div>}
              </div>
              <div>
                <div className="data text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Warranty</div>
                <div>{s.warrantyText}</div>
              </div>
            </div>

            <div className="mt-8 pt-3 text-center data text-[10px] text-neutral-400 border-t border-neutral-200">
              Thank you for your business · {s.phonePrimary} · Licensed, Bonded & Insured — CSLB #{s.licenseNumber}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-neutral-600">
      <span>{k}</span>
      <span className="data">{v}</span>
    </div>
  );
}

/* ---------- Invoice builder ---------- */
function InvoiceBuilder({ onClose, onCreated }: { onClose: () => void; onCreated: (inv: Invoice) => void }) {
  const { db, addInvoice } = useStore();
  // Next number = highest existing sequence + 1 (robust to any history)
  const nextSeq =
    Math.max(0, ...db.invoices.map((i) => parseInt(i.number.split("-").pop() ?? "0", 10) || 0)) + 1;
  const nextNum = `INV-2026-${String(nextSeq).padStart(3, "0")}`;
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [jobSite, setJobSite] = useState("");
  const [terms, setTerms] = useState(db.settings.defaultPaymentTerms);
  const [items, setItems] = useState<LineItem[]>([{ id: uid("li"), description: "", qty: 1, unit: "job", rate: 0 }]);

  const setItem = (id: string, patch: Partial<LineItem>) =>
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const subtotal = invoiceSubtotal(items);
  const tax = subtotal * db.settings.salesTaxRate;

  const create = () => {
    const inv: Invoice = {
      id: uid("inv"),
      number: nextNum,
      customerName: customerName || "New customer",
      customerAddress,
      customerEmail,
      jobSiteAddress: jobSite,
      lineItems: items.filter((i) => i.description),
      taxRate: db.settings.salesTaxRate,
      notes: "",
      paymentTerms: terms,
      status: "draft",
      issuedDate: "2026-07-16",
      dueDate: "2026-08-15",
    };
    addInvoice(inv);
    onCreated(inv);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 fadein" />
      <div className="relative w-full max-w-lg bg-surface border-l border-hairline h-full overflow-y-auto rise" style={{ animationDuration: "0.3s" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-surface/95 backdrop-blur border-b border-hairline p-4 flex items-center justify-between z-10">
          <div>
            <div className="data text-[11px] text-steel">New invoice</div>
            <h3 className="display text-lg text-cream">{nextNum}</h3>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg card"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <L label="Customer name"><input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Acme Property Mgmt" /></L>
            <L label="Billing address"><input className="input" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="123 Main St, Anaheim, CA" /></L>
            <div className="grid grid-cols-2 gap-3">
              <L label="Email"><input className="input" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="ap@acme.com" /></L>
              <L label="Job site"><input className="input" value={jobSite} onChange={(e) => setJobSite(e.target.value)} placeholder="Same as billing" /></L>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="field-label mb-0">Line items</span>
              <button onClick={() => setItems((a) => [...a, { id: uid("li"), description: "", qty: 1, unit: "job", rate: 0 }])} className="text-xs text-highway flex items-center gap-1">
                <Plus size={13} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="card p-2.5 bg-surface-2 space-y-2">
                  <input className="input py-1.5 text-sm" value={it.description} onChange={(e) => setItem(it.id, { description: e.target.value })} placeholder="Description — e.g. Sealcoat 12,000 sq ft" />
                  <div className="grid grid-cols-[1fr_1fr_1.2fr_auto] gap-2 items-center">
                    <input className="input py-1.5 text-sm data" type="number" value={it.qty} onChange={(e) => setItem(it.id, { qty: Number(e.target.value) })} placeholder="Qty" />
                    <input className="input py-1.5 text-sm" value={it.unit} onChange={(e) => setItem(it.id, { unit: e.target.value })} placeholder="unit" />
                    <input className="input py-1.5 text-sm data" type="number" value={it.rate} onChange={(e) => setItem(it.id, { rate: Number(e.target.value) })} placeholder="Rate $" />
                    <button onClick={() => setItems((a) => a.filter((x) => x.id !== it.id))} className="text-steel-dim hover:text-danger p-1"><Trash2 size={14} /></button>
                  </div>
                  <div className="data text-[11px] text-steel text-right">= {money(it.qty * it.rate)}</div>
                </div>
              ))}
            </div>
          </div>

          <L label="Payment terms"><input className="input" value={terms} onChange={(e) => setTerms(e.target.value)} /></L>

          <div className="card p-3 bg-surface-2 space-y-1 data text-sm">
            <div className="flex justify-between text-steel"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between text-steel"><span>Tax ({(db.settings.salesTaxRate * 100).toFixed(2)}%)</span><span>{money(tax)}</span></div>
            <div className="flex justify-between text-cream font-bold pt-1 border-t border-hairline mt-1"><span>Total</span><span className="text-highway">{money(subtotal + tax)}</span></div>
          </div>
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
function MiniStat({ label, value, accent, small }: { label: string; value: React.ReactNode; accent: string; small?: boolean }) {
  return (
    <div className="card p-3.5 relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-1" style={{ background: accent }} />
      <div className="data text-[10px] uppercase tracking-wider text-steel">{label}</div>
      <div className={`display text-cream mt-1 ${small ? "text-lg" : "text-2xl"}`}>{value}</div>
    </div>
  );
}
