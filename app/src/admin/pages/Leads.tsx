import { useState } from "react";
import { Phone, Mail, MapPin, ArrowRight, Inbox, Globe, Users, Search as SearchIcon } from "lucide-react";
import { useStore } from "../../lib/store";
import { StatusPill, Avatar, EmptyState } from "../../components/ui";
import { leadStatusStyle } from "../../lib/status";
import { fromNow, money, initials, titleCase } from "../../lib/format";
import type { Lead, LeadStatus } from "../../lib/types";

const STAGES: LeadStatus[] = ["new", "contacted", "quoted", "won", "lost"];
const NEXT: Record<LeadStatus, LeadStatus | null> = {
  new: "contacted",
  contacted: "quoted",
  quoted: "won",
  won: null,
  lost: null,
};

export default function Leads() {
  const { db, updateLead } = useStore();
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [q, setQ] = useState("");

  const leads = db.leads
    .filter((l) => (filter === "all" ? true : l.status === filter))
    .filter((l) => (q ? (l.name + l.city + l.serviceInterest).toLowerCase().includes(q.toLowerCase()) : true));

  const pipelineValue = db.leads
    .filter((l) => ["new", "contacted", "quoted"].includes(l.status))
    .reduce((s, l) => s + (l.value ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="New today" value={db.leads.filter((l) => l.status === "new").length} accent="#f2b705" />
        <MiniStat label="In pipeline" value={db.leads.filter((l) => ["new", "contacted", "quoted"].includes(l.status)).length} accent="#5b9bd5" />
        <MiniStat label="Pipeline value" value={money(pipelineValue)} accent="#f25c05" small />
        <MiniStat label="Won this month" value={db.leads.filter((l) => l.status === "won").length} accent="#4ec27a" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="card flex items-center gap-2 px-3 py-2 text-steel flex-1 min-w-[180px] max-w-full sm:max-w-xs max-sm:min-h-11">
          <SearchIcon size={15} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search leads…"
            className="bg-transparent outline-none text-base sm:text-sm text-cream w-full placeholder:text-steel-dim"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap max-sm:flex-nowrap max-sm:overflow-x-auto no-sb max-sm:-mx-4 max-sm:px-4 max-sm:basis-full">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All ({db.leads.length})
          </FilterChip>
          {STAGES.map((s) => (
            <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
              {leadStatusStyle[s].label} ({db.leads.filter((l) => l.status === s).length})
            </FilterChip>
          ))}
        </div>
      </div>

      {leads.length === 0 ? (
        <EmptyState icon={<Inbox size={32} />} title="No leads here" hint="New website requests land here instantly." />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {leads.map((l) => (
            <LeadCard key={l.id} lead={l} onAdvance={(status) => updateLead(l.id, { status })} />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadCard({ lead, onAdvance }: { lead: Lead; onAdvance: (s: LeadStatus) => void }) {
  const next = NEXT[lead.status];
  const sourceIcon =
    lead.source === "website" ? <Globe size={12} /> : lead.source === "referral" ? <Users size={12} /> : <MapPin size={12} />;
  return (
    <div className="card card-hover p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar initials={initials(lead.name)} />
          <div className="min-w-0">
            <div className="font-semibold text-cream truncate">{lead.name}</div>
            <div className="data text-[11px] text-steel flex items-center gap-1.5">
              {sourceIcon} {titleCase(lead.source)} · {fromNow(lead.createdAt)}
            </div>
          </div>
        </div>
        <StatusPill s={leadStatusStyle[lead.status]} live={lead.status === "new"} />
      </div>

      <div className="mt-3 text-sm text-cream">{lead.serviceInterest}</div>
      {lead.message && <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">"{lead.message}"</p>}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 data text-[11px] text-steel">
        {lead.city && (
          <span className="flex items-center gap-1">
            <MapPin size={11} /> {lead.city}
          </span>
        )}
        {lead.value ? <span className="text-highway">~{money(lead.value)} opportunity</span> : null}
        {lead.estSqft ? <span>{lead.estSqft.toLocaleString()} sq ft</span> : null}
      </div>

      <div className="mt-4 pt-3 border-t border-hairline flex flex-wrap items-center gap-2">
        <a href={"tel:" + lead.phone.replace(/[^\d]/g, "")} className="btn-ghost flex-1 text-xs py-2">
          <Phone size={13} /> Call
        </a>
        {lead.email && (
          <a href={"mailto:" + lead.email} className="btn-ghost text-xs py-2 px-3 max-sm:min-w-11" aria-label="Email">
            <Mail size={13} />
          </a>
        )}
        {next && (
          <button onClick={() => onAdvance(next)} className="btn-primary flex-1 text-xs py-2 whitespace-nowrap max-sm:order-last max-sm:basis-full">
            Mark {leadStatusStyle[next].label} <ArrowRight size={13} />
          </button>
        )}
        {lead.status !== "lost" && lead.status !== "won" && (
          <button
            onClick={() => onAdvance("lost")}
            className="text-xs text-steel-dim hover:text-danger px-2 py-2 self-stretch max-sm:min-h-11 max-sm:px-3"
            title="Mark lost"
          >
            Lost
          </button>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent, small }: { label: string; value: React.ReactNode; accent: string; small?: boolean }) {
  return (
    <div className="card p-3.5 relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-1" style={{ background: accent }} />
      <div className="data text-[11px] sm:text-[10px] uppercase tracking-wider text-steel">{label}</div>
      <div className={`display text-cream mt-1 ${small ? "text-xl" : "text-2xl"}`}>{value}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="chip cursor-pointer transition-colors"
      style={
        active
          ? { background: "#f2b705", color: "#17130a", borderColor: "#f2b705" }
          : { background: "var(--color-surface-2)", color: "var(--color-muted)", borderColor: "var(--color-hairline)" }
      }
    >
      {children}
    </button>
  );
}
