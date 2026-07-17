import { useState } from "react";
import { Phone, Mail, MapPin, Search as SearchIcon, Building2, Home, Users2, Landmark } from "lucide-react";
import { useStore } from "../../lib/store";
import { Avatar, EmptyState } from "../../components/ui";
import { money, dateShort, initials } from "../../lib/format";
import type { Customer } from "../../lib/types";

const typeMeta: Record<Customer["type"], { label: string; icon: typeof Home; color: string }> = {
  residential: { label: "Residential", icon: Home, color: "#4ec27a" },
  commercial: { label: "Commercial", icon: Building2, color: "#5b9bd5" },
  property_mgmt: { label: "Property Mgmt", icon: Users2, color: "#c07be0" },
  hoa: { label: "HOA", icon: Landmark, color: "#f2b705" },
  municipal: { label: "Municipal", icon: Landmark, color: "#f25c05" },
};

export default function Customers() {
  const { db } = useStore();
  const [q, setQ] = useState("");

  const rows = db.customers
    .map((c) => {
      const jobs = db.jobs.filter((j) => j.customerId === c.id);
      const ltv = jobs.reduce((s, j) => s + j.value, 0);
      return { c, jobCount: jobs.length, ltv };
    })
    .filter(({ c }) => (q ? (c.name + c.city + c.type).toLowerCase().includes(q.toLowerCase()) : true))
    .sort((a, b) => b.ltv - a.ltv);

  const totalLtv = db.jobs.reduce((s, j) => s + j.value, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Customers" value={db.customers.length} />
        <MiniStat label="Total booked" value={money(totalLtv)} small />
        <MiniStat label="Key accounts" value={db.customers.filter((c) => c.tags.includes("key-account")).length} />
      </div>

      <div className="card flex items-center gap-2 px-3 py-2 text-steel max-w-sm">
        <SearchIcon size={15} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search customers…"
          className="bg-transparent outline-none text-sm text-cream w-full placeholder:text-steel-dim"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No customers found" />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {rows.map(({ c, jobCount, ltv }) => {
            const meta = typeMeta[c.type];
            return (
              <div key={c.id} className="card card-hover p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar initials={initials(c.name)} color={meta.color} />
                    <div className="min-w-0">
                      <div className="font-semibold text-cream truncate">{c.name}</div>
                      <div className="data text-[11px] flex items-center gap-1" style={{ color: meta.color }}>
                        <meta.icon size={11} /> {meta.label}
                      </div>
                    </div>
                  </div>
                  {c.tags.includes("key-account") && (
                    <span className="chip" style={{ color: "#f2b705", background: "rgba(242,183,5,0.12)", borderColor: "#f2b70555" }}>
                      Key
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 data text-[11px] text-steel">
                  <a href={"tel:" + c.phone.replace(/[^\d]/g, "")} className="flex items-center gap-2 hover:text-cream">
                    <Phone size={11} /> {c.phone}
                  </a>
                  <a href={"mailto:" + c.email} className="flex items-center gap-2 hover:text-cream truncate">
                    <Mail size={11} /> {c.email}
                  </a>
                  <div className="flex items-center gap-2">
                    <MapPin size={11} /> {c.address}, {c.city}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-hairline flex items-center justify-between">
                  <div>
                    <div className="data text-[10px] text-steel uppercase">Lifetime</div>
                    <div className="data text-sm text-highway font-bold">{money(ltv)}</div>
                  </div>
                  <div className="text-right">
                    <div className="data text-[10px] text-steel uppercase">Jobs</div>
                    <div className="data text-sm text-cream font-bold">{jobCount}</div>
                  </div>
                  <div className="text-right">
                    <div className="data text-[10px] text-steel uppercase">Since</div>
                    <div className="data text-sm text-cream">{dateShort(c.createdAt).split(",")[1]}</div>
                  </div>
                </div>
                {c.notes && <p className="text-xs text-muted mt-3 leading-relaxed">{c.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
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
