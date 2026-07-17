import { Phone, HardHat, Wrench, Star } from "lucide-react";
import { useStore } from "../../lib/store";
import { money } from "../../lib/format";
import type { CrewMember } from "../../lib/types";

const roleLabel: Record<CrewMember["role"], string> = {
  foreman: "Foreman",
  operator: "Equipment Operator",
  laborer: "Laborer",
  striping_tech: "Striping Tech",
  driver: "Driver / CDL",
};
const statusMeta = {
  available: { label: "Available", color: "#4ec27a" },
  on_job: { label: "On a job", color: "#f25c05" },
  off: { label: "Off", color: "#8a97a0" },
};

export default function Crew() {
  const { db, updateEquipment } = useStore();
  const { crew, jobs } = db;

  const jobFor = (id: string) => jobs.find((j) => j.crewIds.includes(id) && ["in_progress", "scheduled"].includes(j.stage));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Crew size" value={crew.length} />
        <MiniStat label="On jobs" value={crew.filter((c) => c.status === "on_job").length} accent="#f25c05" />
        <MiniStat label="Available" value={crew.filter((c) => c.status === "available").length} accent="#4ec27a" />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {crew.map((c) => {
          const meta = statusMeta[c.status];
          const job = jobFor(c.id);
          const isOwner = c.role === "foreman";
          return (
            <div key={c.id} className={`card card-hover p-4 ${isOwner ? "border-highway/40" : ""}`}>
              <div className="flex items-start gap-3">
                <span className="h-12 w-12 rounded-full grid place-items-center display text-base shrink-0" style={{ background: meta.color + "22", color: meta.color, border: `1px solid ${meta.color}55` }}>
                  {c.initials}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-cream">{c.name}</span>
                    {isOwner && <Star size={13} className="text-highway" fill="#f2b705" />}
                  </div>
                  <div className="data text-[11px] text-steel flex items-center gap-1"><HardHat size={11} /> {roleLabel[c.role]}</div>
                </div>
                <span className="h-2.5 w-2.5 rounded-full mt-1.5" style={{ background: meta.color }} title={meta.label} />
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {c.skills.map((s) => (
                  <span key={s} className="chip" style={{ background: "var(--color-surface-2)", color: "var(--color-muted)", borderColor: "var(--color-hairline)" }}>{s}</span>
                ))}
              </div>

              {job && (
                <div className="mt-3 card bg-surface-2 p-2 data text-[11px] text-steel">
                  <span className="text-safety">● </span>{job.number} — {job.title}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-hairline flex items-center justify-between">
                <a href={"tel:" + c.phone.replace(/[^\d]/g, "")} className="btn-ghost text-xs py-1.5 px-3"><Phone size={12} /> {c.phone}</a>
                <span className="data text-[11px] text-steel">{isOwner ? "Owner" : money(c.hourlyCost) + "/hr"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent = "#f2b705" }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="card p-3.5 relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-1" style={{ background: accent }} />
      <div className="data text-[10px] uppercase tracking-wider text-steel">{label}</div>
      <div className="display text-cream mt-1 text-2xl">{value}</div>
    </div>
  );
}
