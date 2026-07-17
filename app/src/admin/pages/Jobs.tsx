import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  X,
  Ruler,
  DollarSign,
  CalendarDays,
  CloudRain,
  Phone,
  Layers,
  HardHat,
  Truck,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { StatusPill, PaveProgress } from "../../components/ui";
import { jobStageStyle } from "../../lib/status";
import { money, dateShort, initials } from "../../lib/format";
import type { Job, JobStage } from "../../lib/types";

const STAGES: JobStage[] = ["estimate", "scheduled", "in_progress", "completed", "invoiced", "paid"];

export default function Jobs() {
  const { db, updateJob } = useStore();
  const [openJob, setOpenJob] = useState<Job | null>(null);

  const move = (job: Job, dir: -1 | 1) => {
    const idx = STAGES.indexOf(job.stage);
    const nextIdx = Math.min(STAGES.length - 1, Math.max(0, idx + dir));
    const stage = STAGES[nextIdx];
    const patch: Partial<Job> = { stage };
    if (stage === "in_progress" && job.progress === 0) patch.progress = 10;
    if (["completed", "invoiced", "paid"].includes(stage)) patch.progress = 100;
    updateJob(job.id, patch);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-muted text-sm">
          {db.jobs.length} jobs ·{" "}
          <span className="text-highway data">
            {money(db.jobs.filter((j) => j.stage !== "paid").reduce((s, j) => s + j.value, 0))}
          </span>{" "}
          in flight
        </p>
        <div className="data text-[11px] text-steel hidden sm:block">← swipe the board · tap a card for details</div>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto no-sb pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 snap-x">
        {STAGES.map((stage) => {
          const s = jobStageStyle[stage];
          const jobs = db.jobs.filter((j) => j.stage === stage);
          const val = jobs.reduce((sum, j) => sum + j.value, 0);
          return (
            <div key={stage} className="shrink-0 w-[80vw] sm:w-72 snap-start">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.dot }} />
                  <span className="display text-sm text-cream">{s.label}</span>
                  <span className="data text-[11px] text-steel">{jobs.length}</span>
                </div>
                <span className="data text-[10px] text-steel">{money(val)}</span>
              </div>
              <div className="space-y-2.5 min-h-[60px]">
                {jobs.map((j) => (
                  <JobCard key={j.id} job={j} crew={db.crew} onOpen={() => setOpenJob(j)} onMove={(d) => move(j, d)} />
                ))}
                {jobs.length === 0 && (
                  <div className="card border-dashed py-6 text-center data text-[11px] text-steel-dim">empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {openJob && <JobDrawer job={db.jobs.find((j) => j.id === openJob.id)!} onClose={() => setOpenJob(null)} />}
    </div>
  );
}

function JobCard({
  job,
  crew,
  onOpen,
  onMove,
}: {
  job: Job;
  crew: ReturnType<typeof useStore>["db"]["crew"];
  onOpen: () => void;
  onMove: (d: -1 | 1) => void;
}) {
  return (
    <div className="card card-hover p-3">
      <button onClick={onOpen} className="text-left w-full">
        <div className="flex items-center justify-between">
          <span className="data text-[10px] text-steel">{job.number}</span>
          {job.weatherSensitive && <CloudRain size={12} className="text-info" />}
          {job.priority === "high" && (
            <span className="chip" style={{ color: "#f25c05", background: "rgba(242,92,5,0.14)", borderColor: "#f25c0555" }}>
              High
            </span>
          )}
        </div>
        <div className="text-sm font-semibold text-cream mt-1 leading-snug">{job.title}</div>
        <div className="data text-[11px] text-steel mt-1 flex items-center gap-1">
          <MapPin size={10} /> {job.city} · {job.sqft.toLocaleString()} sq ft
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="data text-sm text-highway">{money(job.value)}</span>
          <div className="flex -space-x-1.5">
            {job.crewIds.slice(0, 3).map((cid) => {
              const c = crew.find((x) => x.id === cid);
              return (
                <span
                  key={cid}
                  className="h-5 w-5 rounded-full grid place-items-center data text-[8px] font-bold border border-surface"
                  style={{ background: "#242428", color: "#f2b705" }}
                  title={c?.name}
                >
                  {c?.initials}
                </span>
              );
            })}
          </div>
        </div>
        {job.stage === "in_progress" && (
          <div className="mt-2">
            <PaveProgress value={job.progress} live />
          </div>
        )}
      </button>
      <div className="mt-2.5 pt-2.5 border-t border-hairline flex items-center justify-between">
        <button onClick={() => onMove(-1)} className="text-steel-dim hover:text-cream p-1" aria-label="Move back" disabled={job.stage === "estimate"}>
          <ChevronLeft size={15} />
        </button>
        <span className="data text-[9px] text-steel-dim uppercase tracking-wider">move stage</span>
        <button onClick={() => onMove(1)} className="text-steel hover:text-highway p-1" aria-label="Advance" disabled={job.stage === "paid"}>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

function JobDrawer({ job, onClose }: { job: Job; onClose: () => void }) {
  const { db, updateJob } = useStore();
  const s = jobStageStyle[job.stage];
  const crew = job.crewIds.map((id) => db.crew.find((c) => c.id === id)).filter(Boolean);
  const equip = job.equipmentIds.map((id) => db.equipment.find((e) => e.id === id)).filter(Boolean);
  const margin = job.value - job.cost;
  const marginPct = job.value ? Math.round((margin / job.value) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 fadein" />
      <div
        className="relative w-full max-w-md bg-surface border-l border-hairline h-full overflow-y-auto rise"
        style={{ animationDuration: "0.3s" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface/95 backdrop-blur border-b border-hairline p-4 flex items-center justify-between z-10">
          <div>
            <div className="data text-[11px] text-steel">{job.number}</div>
            <StatusPill s={s} live={job.stage === "in_progress"} />
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg card">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          <div>
            <h3 className="display text-xl text-cream">{job.title}</h3>
            <div className="data text-xs text-steel mt-1 flex items-center gap-1">
              <MapPin size={12} /> {job.address}, {job.city}
            </div>
          </div>

          {job.stage === "in_progress" && (
            <div className="card p-4 bg-surface-2">
              <div className="flex items-center justify-between mb-2">
                <span className="data text-[11px] text-steel uppercase">Progress</span>
                <span className="data text-sm text-highway">{job.progress}%</span>
              </div>
              <PaveProgress value={job.progress} live />
              <div className="flex gap-2 mt-3">
                {[25, 50, 75, 100].map((p) => (
                  <button
                    key={p}
                    onClick={() => updateJob(job.id, { progress: p, stage: p === 100 ? "completed" : "in_progress" })}
                    className="btn-ghost flex-1 text-xs py-1.5"
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Detail icon={<Ruler size={14} />} label="Area" value={`${job.sqft.toLocaleString()} sq ft`} />
            <Detail icon={<DollarSign size={14} />} label="Contract" value={money(job.value)} />
            <Detail icon={<CalendarDays size={14} />} label="Scheduled" value={dateShort(job.scheduledDate)} />
            <Detail icon={<Layers size={14} />} label="Margin" value={`${money(margin)} · ${marginPct}%`} accent="#4ec27a" />
          </div>

          <div>
            <div className="data text-[11px] text-steel uppercase mb-2">Scope</div>
            <div className="flex flex-wrap gap-1.5">
              {job.serviceTypes.map((t) => (
                <span key={t} className="chip" style={{ background: "var(--color-surface-2)", color: "var(--color-cream)", borderColor: "var(--color-hairline)" }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* stylized location card */}
          <div className="card overflow-hidden">
            <div className="relative h-32 asphalt-grain" style={{ background: "linear-gradient(135deg,#1f1f23,#0f0f11)" }}>
              <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: "linear-gradient(#8a97a0 1px,transparent 1px),linear-gradient(90deg,#8a97a0 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <MapPin size={26} className="text-highway" fill="#f2b705" fillOpacity={0.25} />
                <span className="data text-[10px] text-steel mt-1">
                  {job.lat.toFixed(3)}, {job.lng.toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="data text-[11px] text-steel uppercase mb-2 flex items-center gap-1.5">
              <HardHat size={12} /> Crew ({crew.length})
            </div>
            <div className="space-y-1.5">
              {crew.map((c) => (
                <div key={c!.id} className="flex items-center gap-2 card p-2 bg-surface-2">
                  <span className="h-7 w-7 rounded-full grid place-items-center data text-[9px] font-bold" style={{ background: "#242428", color: "#f2b705" }}>
                    {c!.initials}
                  </span>
                  <span className="text-sm text-cream flex-1">{c!.name}</span>
                  <span className="data text-[10px] text-steel uppercase">{c!.role.replace("_", " ")}</span>
                </div>
              ))}
              {crew.length === 0 && <div className="data text-xs text-steel-dim">No crew assigned yet.</div>}
            </div>
          </div>

          {equip.length > 0 && (
            <div>
              <div className="data text-[11px] text-steel uppercase mb-2 flex items-center gap-1.5">
                <Truck size={12} /> Equipment
              </div>
              <div className="flex flex-wrap gap-1.5">
                {equip.map((e) => (
                  <span key={e!.id} className="chip" style={{ background: "var(--color-surface-2)", color: "var(--color-cream)", borderColor: "var(--color-hairline)" }}>
                    {e!.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.notes && (
            <div className="card p-3 bg-surface-2">
              <div className="data text-[11px] text-steel uppercase mb-1">Notes</div>
              <p className="text-sm text-cream">{job.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ icon, label, value, accent = "#f6f4ef" }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="card p-3 bg-surface-2">
      <div className="flex items-center gap-1.5 text-steel">{icon}<span className="data text-[10px] uppercase">{label}</span></div>
      <div className="data text-sm mt-1 font-bold" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}
