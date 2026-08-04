import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Send,
  Paperclip,
  Sparkles,
  FileSignature,
  ReceiptText,
  RotateCcw,
  X,
  AlertTriangle,
  Check,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { money, uid, today } from "../../lib/format";
import { EmptyState } from "../../components/ui";
import {
  priceJob,
  ratesFrom,
  quoteToLineItems,
  quoteToScopeItems,
  taxNotice,
  SERVICE_LABELS,
  type Quote,
} from "../../lib/pricing";
import {
  emptyConversation,
  extractSlots,
  generateScope,
  nextQuestion,
  outstandingGaps,
  slotsToJobSpec,
  MAX_QUESTIONS,
  type Conversation,
  type Intent,
} from "../../lib/assistant";
import { isSpeechSupported, startDictation, type Dictation } from "../../lib/speech";
import type { Contract, Invoice } from "../../lib/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  muted?: boolean;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  kind: "text" | "image" | "other";
  text?: string;
  dataUrl?: string;
}

interface Draft {
  intent: Intent;
  quote: Quote;
  scope: string;
  gaps: string[];
  usedModel: boolean;
}

const GREETING =
  "Tell me what you need and I'll draft it. Something like \"contract for Bob's parking lot, 8,500 square feet, 3 inch\" — or just start talking and I'll ask what's missing.";

const TEXT_EXT = /\.(txt|csv|md|json|log)$/i;
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export default function Assistant() {
  const { db, addContract, addInvoice } = useStore();
  const navigate = useNavigate();

  const rates = useMemo(() => ratesFrom(db.settings), [db.settings]);
  const taxWarning = useMemo(() => taxNotice(rates), [rates]);

  const [messages, setMessages] = useState<Message[]>([
    { id: uid("m"), role: "assistant", text: GREETING },
  ]);
  const [conv, setConv] = useState<Conversation>(emptyConversation);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const dictationRef = useRef<Dictation | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const speechOk = useMemo(() => isSpeechSupported(), []);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, draft, busy]);

  useEffect(() => () => dictationRef.current?.stop(), []);

  const say = useCallback((text: string, muted = false) => {
    setMessages((m) => [...m, { id: uid("m"), role: "assistant", text, muted }]);
  }, []);

  /* ------------------------------------------------------------- dictation */

  const toggleMic = () => {
    if (listening) {
      dictationRef.current?.stop();
      dictationRef.current = null;
      setListening(false);
      return;
    }
    const handle = startDictation({
      onStart: () => setListening(true),
      onTranscript: (text) => setInput(text),
      onError: (msg) => {
        setNotice(msg);
        setListening(false);
      },
      onEnd: () => setListening(false),
    });
    dictationRef.current = handle;
  };

  /* ------------------------------------------------------------------ files */

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const next: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        setNotice(`${file.name} is over 4 MB — skipped.`);
        continue;
      }
      const isText = TEXT_EXT.test(file.name) || file.type.startsWith("text/");
      const isImage = file.type.startsWith("image/");
      if (isText) {
        next.push({
          id: uid("att"),
          name: file.name,
          size: file.size,
          kind: "text",
          text: (await file.text()).slice(0, 20_000),
        });
      } else if (isImage) {
        next.push({
          id: uid("att"),
          name: file.name,
          size: file.size,
          kind: "image",
          dataUrl: await readAsDataUrl(file),
        });
      } else {
        next.push({ id: uid("att"), name: file.name, size: file.size, kind: "other" });
      }
    }
    if (next.length) setAttachments((a) => [...a, ...next]);

    const images = next.filter((a) => a.kind === "image").length;
    const others = next.filter((a) => a.kind === "other").length;
    if (images || others) {
      setNotice(
        `${images ? `${images} photo${images > 1 ? "s" : ""}` : ""}${images && others ? " and " : ""}${
          others ? `${others} file${others > 1 ? "s" : ""}` : ""
        } attached to the job record. The assistant can't read images or PDFs — tell me the measurements and I'll price it.`
      );
    }
  };

  /* ------------------------------------------------------------------- send */

  const handleSend = async () => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;
    if (busy) return;

    if (listening) {
      dictationRef.current?.stop();
      dictationRef.current = null;
      setListening(false);
    }

    const attachedText = attachments
      .filter((a) => a.kind === "text" && a.text)
      .map((a) => `--- ${a.name} ---\n${a.text}`)
      .join("\n\n");

    setMessages((m) => [
      ...m,
      {
        id: uid("m"),
        role: "user",
        text: text || `(${attachments.length} file${attachments.length > 1 ? "s" : ""} attached)`,
      },
    ]);
    setInput("");
    setBusy(true);
    setNotice(null);

    try {
      const history = messages
        .filter((m) => !m.muted)
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.text }));

      const combined = attachedText ? `${text}\n\n${attachedText}` : text;
      const { slots, intent, usedModel } = await extractSlots(combined, db, history);

      // Compute the merged conversation up front. Deriving it inside a setState
      // updater would re-run the side effects below on every StrictMode double-render.
      const merged: Conversation = {
        intent: conv.intent !== "unknown" ? conv.intent : intent,
        slots: { ...conv.slots, ...stripUndefined(slots) },
        questionsAsked: conv.questionsAsked,
        asked: conv.asked,
        attachmentText: attachedText || conv.attachmentText,
      };

      const decided = decide(merged);
      setConv(decided.conversation);
      if (decided.question) {
        say(decided.question);
      } else if (decided.ready) {
        await buildDraft(decided.conversation, usedModel);
      }
    } finally {
      setAttachments([]);
      setBusy(false);
    }
  };

  const buildDraft = async (current: Conversation, usedModel: boolean) => {
    setBusy(true);
    try {
      const spec = slotsToJobSpec(current.slots);
      const quote = priceJob(spec, rates);
      const { text: scope, usedModel: scopeModel } = await generateScope(
        spec,
        quote.lines.map((l) => l.description),
        current.slots.jobAddress,
        current.slots.notes
      );
      setDraft({
        intent: current.intent,
        quote,
        scope,
        gaps: outstandingGaps(current),
        usedModel: usedModel || scopeModel,
      });
      say(
        current.slots.manualPrice
          ? `Done — priced at ${money(quote.total)} as you specified. Look it over below.`
          : `Done — I make it ${money(quote.total)}. Check the line items below before you send it.`
      );
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------------------------- save */

  const saveContract = () => {
    if (!draft) return;
    const s = db.settings;
    const spec = slotsToJobSpec(conv.slots);
    const contract: Contract = {
      id: uid("ct"),
      number: `CT-${today.format("YYYY")}-${String(db.contracts.length + 1).padStart(3, "0")}`,
      customerName: conv.slots.customerName ?? "—",
      customerAddress: conv.slots.jobAddress ?? conv.slots.customerAddress ?? "",
      projectDescription: draft.scope,
      scopeItems: quoteToScopeItems(spec),
      totalAmount: draft.quote.total,
      paymentSchedule: s.defaultPaymentTerms,
      warrantyText: s.warrantyText,
      status: "draft",
      createdAt: today.format("YYYY-MM-DD"),
    };
    addContract(contract);
    navigate("/dashboard/contracts");
  };

  const saveInvoice = () => {
    if (!draft) return;
    const s = db.settings;
    const invoice: Invoice = {
      id: uid("inv"),
      number: `INV-${today.format("YYYY")}-${String(db.invoices.length + 1).padStart(3, "0")}`,
      customerName: conv.slots.customerName ?? "—",
      customerAddress: conv.slots.customerAddress ?? "",
      customerEmail: "",
      jobSiteAddress: conv.slots.jobAddress ?? "",
      lineItems: quoteToLineItems(draft.quote),
      taxRate: rates.taxRatePct / 100,
      notes: draft.scope,
      paymentTerms: s.defaultPaymentTerms,
      status: "draft",
      issuedDate: today.format("YYYY-MM-DD"),
      dueDate: today.add(30, "day").format("YYYY-MM-DD"),
    };
    addInvoice(invoice);
    navigate("/dashboard/invoices");
  };

  const reset = () => {
    setConv(emptyConversation());
    setDraft(null);
    setAttachments([]);
    setNotice(null);
    setMessages([{ id: uid("m"), role: "assistant", text: GREETING }]);
  };

  /* ------------------------------------------------------------------- view */

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-highway/15 text-highway">
              <Sparkles size={18} />
            </span>
            <div>
              <div className="display text-cream text-lg leading-tight">Assistant</div>
              <div className="text-muted text-xs mt-0.5">
                Ask for a contract, invoice, or price. Speak or type.
              </div>
            </div>
          </div>
          <button onClick={reset} className="btn-ghost text-xs py-2 px-3">
            <RotateCcw size={13} /> Start over
          </button>
        </div>

        {conv.questionsAsked > 0 && !draft && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1 flex-1 rounded-full bg-asphalt overflow-hidden border border-hairline">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(conv.questionsAsked / MAX_QUESTIONS) * 100}%`,
                  background: "linear-gradient(90deg,#d69e00,#f2b705)",
                  transition: "width .4s ease",
                }}
              />
            </div>
            <span className="data text-[10px] text-steel whitespace-nowrap">
              {conv.questionsAsked} of {MAX_QUESTIONS} questions
            </span>
          </div>
        )}
      </div>

      {taxWarning && (
        <div className="card p-3 flex items-start gap-2.5 border-l-2" style={{ borderLeftColor: "#f2b705" }}>
          <AlertTriangle size={15} className="text-highway shrink-0 mt-0.5" />
          <p className="text-xs text-muted leading-relaxed">{taxWarning}</p>
        </div>
      )}

      {/* thread */}
      <div ref={threadRef} className="card p-4 space-y-3 max-h-[46vh] overflow-y-auto no-sb">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-xl rounded-br-sm px-3.5 py-2.5 text-sm bg-highway/15 text-cream border border-highway/25"
                  : "max-w-[85%] rounded-xl rounded-bl-sm px-3.5 py-2.5 text-sm bg-surface-2 text-cream border border-hairline"
              }
              style={{ whiteSpace: "pre-wrap" }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-xl rounded-bl-sm px-3.5 py-2.5 bg-surface-2 border border-hairline">
              <span className="inline-flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-steel"
                    style={{ animation: `pulse 1.2s ${i * 0.15}s infinite` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
      </div>

      {notice && (
        <div className="card p-3 flex items-start gap-2.5">
          <AlertTriangle size={15} className="text-highway shrink-0 mt-0.5" />
          <p className="text-xs text-muted flex-1 leading-relaxed">{notice}</p>
          <button onClick={() => setNotice(null)} className="text-steel hover:text-cream shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* draft */}
      {draft && <DraftCard draft={draft} conv={conv} onContract={saveContract} onInvoice={saveInvoice} />}

      {/* composer */}
      <div className="card p-3">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {attachments.map((a) => (
              <span
                key={a.id}
                className="chip inline-flex items-center gap-1.5"
                style={{ background: "var(--color-surface-2)", color: "var(--color-cream)", borderColor: "var(--color-hairline)" }}
              >
                {a.kind === "image" ? <ImageIcon size={11} /> : <FileText size={11} />}
                <span className="max-w-[140px] truncate">{a.name}</span>
                <button
                  onClick={() => setAttachments((x) => x.filter((y) => y.id !== a.id))}
                  className="text-steel hover:text-cream"
                  aria-label={`Remove ${a.name}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              void onFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-ghost px-3 py-2.5 min-w-[44px] shrink-0"
            aria-label="Attach a file"
            title="Attach photos or documents"
          >
            <Paperclip size={16} />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={1}
            placeholder={listening ? "Listening…" : "Type, or tap the mic"}
            className="input flex-1 resize-none py-2.5 min-h-[44px] max-h-32"
          />

          {speechOk && (
            <button
              onClick={toggleMic}
              className={listening ? "btn-primary px-3 py-2.5 min-w-[44px] shrink-0" : "btn-ghost px-3 py-2.5 min-w-[44px] shrink-0"}
              aria-label={listening ? "Stop listening" : "Start voice input"}
              title={listening ? "Stop" : "Speak"}
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}

          <button
            onClick={() => void handleSend()}
            disabled={busy || (!input.trim() && attachments.length === 0)}
            className="btn-primary px-3.5 py-2.5 min-w-[44px] shrink-0 disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </div>

        {listening && (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-highway">
            <span className="h-1.5 w-1.5 rounded-full bg-highway pulse-hot" />
            Listening — tap the mic again when you're done.
          </div>
        )}
        {!speechOk && (
          <p className="text-[11px] text-steel mt-2">
            Voice input needs Chrome (or Edge). Typing works everywhere.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ draft */

function DraftCard({
  draft,
  conv,
  onContract,
  onInvoice,
}: {
  draft: Draft;
  conv: Conversation;
  onContract: () => void;
  onInvoice: () => void;
}) {
  const q = draft.quote;
  const service = conv.slots.service ? SERVICE_LABELS[conv.slots.service] : "Job";

  return (
    <div className="card p-4 space-y-3.5" style={{ borderColor: "var(--color-highway)" }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="eyebrow">Draft — not sent</div>
          <div className="display text-cream text-lg mt-0.5">
            {conv.slots.customerName ?? "Customer"} · {service}
          </div>
          {conv.slots.jobAddress && (
            <div className="text-muted text-xs mt-0.5">{conv.slots.jobAddress}</div>
          )}
        </div>
        <div className="text-right">
          <div className="data text-[10px] uppercase tracking-wider text-steel">Total</div>
          <div className="data text-2xl text-highway font-bold">{money(q.total)}</div>
          {q.isManual && <div className="text-[10px] text-steel mt-0.5">price you set</div>}
        </div>
      </div>

      {draft.gaps.length > 0 && (
        <div className="rounded-lg border border-hairline p-2.5" style={{ background: "var(--color-surface-2)" }}>
          <div className="flex items-center gap-1.5 text-[11px] text-highway font-semibold mb-1">
            <AlertTriangle size={12} /> Still unknown — check before sending
          </div>
          <ul className="text-[11px] text-muted space-y-0.5 list-disc pl-4">
            {draft.gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm text-muted leading-relaxed">{draft.scope}</p>

      <div className="rounded-lg border border-hairline overflow-hidden">
        <table className="w-full text-xs">
          <tbody>
            {q.lines.map((l, i) => (
              <tr key={i} className="border-b border-hairline last:border-0">
                <td className="px-2.5 py-2 text-muted">{l.description}</td>
                <td className="px-2.5 py-2 text-right data text-steel whitespace-nowrap">
                  {l.qty.toLocaleString()} {l.unit}
                </td>
                <td className="px-2.5 py-2 text-right data text-cream whitespace-nowrap">
                  {money(l.amount, true)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-hairline">
              <td colSpan={2} className="px-2.5 py-1.5 text-right text-steel">Subtotal</td>
              <td className="px-2.5 py-1.5 text-right data text-cream">{money(q.subtotal, true)}</td>
            </tr>
            {q.markup > 0 && (
              <tr>
                <td colSpan={2} className="px-2.5 py-1.5 text-right text-steel">
                  Overhead &amp; profit ({q.markupPct}%)
                </td>
                <td className="px-2.5 py-1.5 text-right data text-cream">{money(q.markup, true)}</td>
              </tr>
            )}
            {q.minAdjustment > 0 && (
              <tr>
                <td colSpan={2} className="px-2.5 py-1.5 text-right text-steel">Minimum job adjustment</td>
                <td className="px-2.5 py-1.5 text-right data text-cream">{money(q.minAdjustment, true)}</td>
              </tr>
            )}
            {q.tax > 0 && (
              <tr>
                <td colSpan={2} className="px-2.5 py-1.5 text-right text-steel">Tax ({q.taxRatePct}%)</td>
                <td className="px-2.5 py-1.5 text-right data text-cream">{money(q.tax, true)}</td>
              </tr>
            )}
            <tr className="border-t border-hairline">
              <td colSpan={2} className="px-2.5 py-2 text-right text-cream font-semibold">Total</td>
              <td className="px-2.5 py-2 text-right data text-highway font-bold">{money(q.total, true)}</td>
            </tr>
            <tr>
              <td colSpan={2} className="px-2.5 py-1.5 text-right text-steel">
                Deposit at signing ({q.depositPct}%)
              </td>
              <td className="px-2.5 py-1.5 text-right data text-steel">{money(q.deposit, true)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-[11px] text-steel leading-relaxed">
        Every figure above is calculated from your rate sheet in Settings — the AI writes the
        wording, never the numbers. Saving adds this as a <strong className="text-muted">draft</strong> you
        review and send yourself.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <button onClick={onContract} className="btn-primary flex-1 text-sm py-2.5">
          <FileSignature size={15} /> Save as draft contract
        </button>
        <button onClick={onInvoice} className="btn-ghost flex-1 text-sm py-2.5">
          <ReceiptText size={15} /> Save as draft invoice
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- helpers */

/**
 * Pure decision step: given the conversation so far, either ask the next
 * question or declare it ready to draft. Kept free of side effects so it can
 * be reasoned about and unit-tested independently of React.
 */
function decide(current: Conversation): {
  conversation: Conversation;
  question?: string;
  ready: boolean;
} {
  if (current.intent === "unknown") {
    // Ask once. If they still haven't said, assume a price check and move on
    // rather than trapping them in a loop.
    if (!current.asked.includes("intent")) {
      return {
        conversation: { ...current, asked: [...current.asked, "intent"] },
        question: "Are you after a contract, an invoice, or just a price?",
        ready: false,
      };
    }
    current = { ...current, intent: "quote" };
  }

  const q = nextQuestion(current);
  if (q) {
    const askedCount = current.questionsAsked + 1;
    const left = MAX_QUESTIONS - askedCount;
    return {
      conversation: {
        ...current,
        questionsAsked: askedCount,
        asked: [...current.asked, q.slot],
      },
      question: q.text + (left === 0 ? "\n\nLast one, then I'll draft it." : ""),
      ready: false,
    };
  }

  return { conversation: current, ready: true };
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined && v !== null && v !== "") (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}
