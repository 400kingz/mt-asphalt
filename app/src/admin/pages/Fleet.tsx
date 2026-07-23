import {
  Truck,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Cog,
  PaintBucket,
  SprayCan,
  Forklift,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { equipmentStatusStyle } from "../../lib/status";
import { StatusPill } from "../../components/ui";
import { dateShort, num, today } from "../../lib/format";
import type { Equipment } from "../../lib/types";

const typeIcon: Record<Equipment["type"], typeof Truck> = {
  paver: PaintBucket,
  roller: Cog,
  dump_truck: Truck,
  sealcoat_rig: SprayCan,
  striper: SprayCan,
  skid_steer: Forklift,
  compactor: Cog,
};

export default function Fleet() {
  const { db, updateEquipment } = useStore();
  const { equipment, jobs } = db;

  const ready = equipment.filter((e) => e.status === "operational").length;
  const service = equipment.filter((e) => e.status === "maintenance" || e.status === "down").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <MiniStat label="Fleet units" value={equipment.length} />
        <MiniStat label="Ready" value={ready} accent="#4ec27a" />
        <MiniStat label="Needs service" value={service} accent={service ? "#ef4d4d" : "#8a97a0"} />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {equipment.map((e) => {
          const Icon = typeIcon[e.type];
          const s = equipmentStatusStyle[e.status];
          const job = e.assignedJobId ? jobs.find((j) => j.id === e.assignedJobId) : null;
          const dueIn = e.nextServiceHours - e.hours;
          const cyclePct = Math.max(2, Math.min(100, 100 - (dueIn / 150) * 100));
          const overdue = dueIn <= 0;
          return (
            <div key={e.id} className={`card card-hover p-4 ${e.status === "down" ? "border-danger/40" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-highway shrink-0"><Icon size={22} /></span>
                  <div className="min-w-0">
                    <div className="font-semibold text-cream leading-tight break-words">{e.name}</div>
                    <div className="data text-[11px] text-steel uppercase mt-0.5">{e.type.replace("_", " ")}</div>
                  </div>
                </div>
                <StatusPill s={s} live={e.status === "in_use"} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 data text-xs">
                <div>
                  <div className="text-[11px] sm:text-[10px] text-steel uppercase">Engine hours</div>
                  <div className="text-cream font-bold text-sm">{num(e.hours)}</div>
                </div>
                <div>
                  <div className="text-[11px] sm:text-[10px] text-steel uppercase">Last service</div>
                  <div className="text-cream text-sm">{dateShort(e.lastService)}</div>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="data text-[11px] sm:text-[10px] text-steel uppercase flex items-center gap-1"><Wrench size={10} /> Service cycle</span>
                  <span className="data text-[11px]" style={{ color: overdue ? "#ef4d4d" : dueIn < 60 ? "#f2b705" : "#8a97a0" }}>
                    {overdue ? "DUE NOW" : `${num(dueIn)} hrs left`}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-asphalt overflow-hidden border border-hairline">
                  <div className="h-full rounded-full" style={{ width: `${cyclePct}%`, background: overdue ? "#ef4d4d" : cyclePct > 75 ? "#f2b705" : "#4ec27a" }} />
                </div>
              </div>

              {job && (
                <div className="mt-3 card bg-surface-2 p-2 data text-[11px] text-steel">
                  <span className="text-safety">● </span>{job.number} — {job.city}
                </div>
              )}

              {(e.status === "maintenance" || e.status === "down") && (
                <button
                  onClick={() => updateEquipment(e.id, { status: "operational", lastService: today.format("YYYY-MM-DD"), nextServiceHours: e.hours + 150 })}
                  className="btn-primary w-full mt-3 text-xs py-2"
                >
                  <CheckCircle2 size={13} /> Mark serviced
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent = "#f2b705" }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="card p-3 sm:p-3.5 relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-1" style={{ background: accent }} />
      <div className="data text-[11px] sm:text-[10px] uppercase tracking-wide sm:tracking-wider text-steel">{label}</div>
      <div className="display text-cream mt-1 text-2xl">{value}</div>
    </div>
  );
}
