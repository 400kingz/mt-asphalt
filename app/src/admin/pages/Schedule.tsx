import { useMemo } from "react";
import dayjs from "dayjs";
import { MapPin, Sun, CloudRain, CloudSun, HardHat, Clock, CheckCircle2 } from "lucide-react";
import { useStore } from "../../lib/store";
import { StatusPill } from "../../components/ui";
import { jobStageStyle } from "../../lib/status";
import { money, today } from "../../lib/format";

// Forecast by day offset from today (0 = today), so it never goes stale.
const WEATHER: Record<number, { icon: typeof Sun; label: string; ok: boolean }> = {
  0: { icon: Sun, label: "84° Sunny", ok: true },
  1: { icon: Sun, label: "86° Clear", ok: true },
  2: { icon: CloudSun, label: "81° P.Cloudy", ok: true },
  3: { icon: CloudRain, label: "77° AM rain", ok: false },
  4: { icon: Sun, label: "83° Sunny", ok: true },
  5: { icon: Sun, label: "85° Sunny", ok: true },
  6: { icon: Sun, label: "84° Clear", ok: true },
};

export default function Schedule() {
  const { db } = useStore();

  const days = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const d = today.add(i, "day");
      const key = d.format("YYYY-MM-DD");
      const jobs = db.jobs.filter((j) => j.scheduledDate === key);
      return { d, key, jobs, weather: WEATHER[i] };
    });
  }, [db.jobs]);

  const onJob = db.crew.filter((c) => c.status === "on_job");
  const avail = db.crew.filter((c) => c.status === "available");

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-muted text-sm">Next 10 days · weather-checked for paving & sealcoat</p>
        </div>
        {days.map(({ d, key, jobs, weather: w }) => {
          const isToday = key === today.format("YYYY-MM-DD");
          const Icon = w?.icon ?? Sun;
          return (
            <div key={key} className={`card p-4 ${isToday ? "border-highway/40" : ""}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-center w-11">
                    <div className="data text-[10px] text-steel uppercase">{d.format("ddd")}</div>
                    <div className="display text-2xl text-cream leading-none">{d.format("D")}</div>
                  </div>
                  {isToday && <span className="chip" style={{ background: "#f2b705", color: "#17130a", borderColor: "#f2b705" }}>Today</span>}
                </div>
                {w && (
                  <div className={`flex items-center gap-1.5 data text-xs ${w.ok ? "text-steel" : "text-safety"}`}>
                    <Icon size={16} className={w.ok ? "text-highway" : "text-safety"} />
                    {w.label}
                    {!w.ok && <span className="chip ml-1" style={{ color: "#f25c05", background: "rgba(242,92,5,0.14)", borderColor: "#f25c0555" }}>Hold paving</span>}
                  </div>
                )}
              </div>
              {jobs.length === 0 ? (
                <div className="data text-[11px] text-steel-dim pl-14">— open day —</div>
              ) : (
                <div className="space-y-2 pl-0 sm:pl-14">
                  {jobs.map((j) => (
                    <div key={j.id} className="card bg-surface-2 p-3 flex items-center gap-3">
                      <div className="centerline-v self-stretch w-1 rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-cream truncate">{j.title}</span>
                          <StatusPill s={jobStageStyle[j.stage]} />
                        </div>
                        <div className="data text-[11px] text-steel mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1"><MapPin size={10} /> {j.city}</span>
                          <span>{j.sqft.toLocaleString()} sq ft</span>
                          <span className="text-highway">{money(j.value)}</span>
                        </div>
                      </div>
                      <div className="flex -space-x-1.5">
                        {j.crewIds.slice(0, 3).map((cid) => {
                          const c = db.crew.find((x) => x.id === cid);
                          return (
                            <span key={cid} className="h-6 w-6 rounded-full grid place-items-center data text-[8px] font-bold border border-surface-2" style={{ background: "#242428", color: "#f2b705" }} title={c?.name}>
                              {c?.initials}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Crew roster */}
      <div className="space-y-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <HardHat size={16} className="text-highway" />
            <h3 className="display text-base text-cream">Crew today</h3>
          </div>
          <div className="space-y-2">
            <div className="data text-[10px] text-steel uppercase flex items-center gap-1.5">
              <Clock size={11} /> On a job ({onJob.length})
            </div>
            {onJob.map((c) => (
              <RosterRow key={c.id} name={c.name} role={c.role} initials={c.initials} on />
            ))}
            <div className="data text-[10px] text-steel uppercase flex items-center gap-1.5 mt-3">
              <CheckCircle2 size={11} className="text-ok" /> Available ({avail.length})
            </div>
            {avail.map((c) => (
              <RosterRow key={c.id} name={c.name} role={c.role} initials={c.initials} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RosterRow({ name, role, initials, on }: { name: string; role: string; initials: string; on?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 card bg-surface-2 p-2">
      <span className="h-7 w-7 rounded-full grid place-items-center data text-[9px] font-bold" style={{ background: "#242428", color: on ? "#f25c05" : "#4ec27a" }}>
        {initials}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-cream truncate">{name}</div>
        <div className="data text-[10px] text-steel uppercase">{role.replace("_", " ")}</div>
      </div>
      <span className="h-2 w-2 rounded-full" style={{ background: on ? "#f25c05" : "#4ec27a" }} />
    </div>
  );
}
