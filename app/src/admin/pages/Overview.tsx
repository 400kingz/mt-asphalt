import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  DollarSign,
  Inbox,
  Construction,
  AlertTriangle,
  TrendingUp,
  Sun,
  CloudRain,
  CloudSun,
  Droplets,
  ArrowRight,
  Clock,
  CheckCircle2,
  Wrench,
  Package,
  Users,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { StatTile, PaveProgress, StatusPill } from "../../components/ui";
import { jobStageStyle } from "../../lib/status";
import { money, compactMoney, fromNow, dateTiny, initials } from "../../lib/format";

export default function Overview() {
  const { db } = useStore();
  const { jobs, leads, invoices, materials, equipment, crew, revenue, activity, settings } = db;

  const jul = revenue[revenue.length - 1];
  const jun = revenue[revenue.length - 2];
  const revChange = (((jul.revenue - jun.revenue) / jun.revenue) * 100).toFixed(0);

  const newLeads = leads.filter((l) => l.status === "new");
  const pipeline = jobs
    .filter((j) => ["estimate", "scheduled", "in_progress"].includes(j.stage))
    .reduce((s, j) => s + j.value, 0);
  const outstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((s, i) => s + i.lineItems.reduce((a, li) => a + li.qty * li.rate, 0) * (1 + i.taxRate), 0);
  const inProgress = jobs.filter((j) => j.stage === "in_progress");
  const overdue = invoices.filter((i) => i.status === "overdue");
  const lowMaterials = materials.filter((m) => m.onHand <= m.reorderAt);
  const downEquipment = equipment.filter((e) => e.status === "down" || e.status === "maintenance");
  const availableCrew = crew.filter((c) => c.status === "available").length;

  const stageCounts = (["estimate", "scheduled", "in_progress", "completed", "invoiced", "paid"] as const).map(
    (st) => ({ st, count: jobs.filter((j) => j.stage === st).length })
  );

  const attention = [
    ...overdue.map((i) => ({
      icon: <DollarSign size={15} />,
      color: "#ef4d4d",
      text: `${i.number} overdue — ${i.customerName}`,
      to: "/dashboard/invoices",
    })),
    ...downEquipment.map((e) => ({
      icon: <Wrench size={15} />,
      color: e.status === "down" ? "#ef4d4d" : "#f2b705",
      text: `${e.name} — ${e.status === "down" ? "out of service" : "needs service"}`,
      to: "/dashboard/fleet",
    })),
    ...lowMaterials.map((m) => ({
      icon: <Package size={15} />,
      color: "#f2b705",
      text: `${m.name} low — ${m.onHand} ${m.unit} left (reorder at ${m.reorderAt})`,
      to: "/dashboard/materials",
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="eyebrow mb-1">Wed · July 16, 2026 · Anaheim</div>
          <h2 className="display text-2xl md:text-3xl text-cream">
            Good morning, {settings.ownerName.split(" ")[0]}.
          </h2>
          <p className="text-muted text-sm mt-1">
            {inProgress.length} job{inProgress.length !== 1 ? "s" : ""} on the ground ·{" "}
            {newLeads.length} new lead{newLeads.length !== 1 ? "s" : ""} waiting · perfect paving weather.
          </p>
        </div>
        <Link to="/dashboard/jobs" className="btn-primary text-sm">
          <Construction size={16} /> New job
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="Revenue — July"
          value={compactMoney(jul.revenue)}
          accent="#4ec27a"
          icon={<TrendingUp size={18} />}
          trend={{ dir: Number(revChange) >= 0 ? "up" : "down", text: `${Math.abs(Number(revChange))}% vs Jun` }}
          sub="month to date"
        />
        <StatTile
          label="Open Pipeline"
          value={compactMoney(pipeline)}
          accent="#f2b705"
          icon={<Construction size={18} />}
          sub={`${jobs.filter((j) => ["estimate", "scheduled", "in_progress"].includes(j.stage)).length} active jobs`}
        />
        <StatTile
          label="New Leads"
          value={newLeads.length}
          accent="#f25c05"
          icon={<Inbox size={18} />}
          sub="need a callback"
        />
        <StatTile
          label="Outstanding"
          value={compactMoney(outstanding)}
          accent={overdue.length ? "#ef4d4d" : "#5b9bd5"}
          icon={<DollarSign size={18} />}
          sub={`${invoices.filter((i) => i.status === "sent" || i.status === "overdue").length} unpaid · ${overdue.length} overdue`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="eyebrow mb-1">Trailing 12 months</div>
              <h3 className="display text-lg text-cream">Revenue vs. expenses</h3>
            </div>
            <Link to="/dashboard/finance" className="text-xs text-steel hover:text-cream flex items-center gap-1">
              Finance <ArrowRight size={13} />
            </Link>
          </div>
          <div className="h-64 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenue} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f2b705" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#f2b705" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#242428" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#8a97a0", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fill: "#8a97a0", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} width={38} />
                <Tooltip
                  contentStyle={{ background: "#1f1f23", border: "1px solid #34343a", borderRadius: 10 }}
                  labelStyle={{ color: "#f6f4ef", fontFamily: "Space Mono", fontSize: 12 }}
                  formatter={(v: number, name) => [money(v), name === "revenue" ? "Revenue" : "Expenses"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f2b705" strokeWidth={2} fill="url(#rev)" />
                <Bar dataKey="expenses" fill="#f25c05" opacity={0.35} radius={[3, 3, 0, 0]} barSize={14} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weather / pave conditions */}
        <PaveWeather />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* On the ground today */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="display text-lg text-cream">On the ground</h3>
              <Link to="/dashboard/jobs" className="text-xs text-steel hover:text-cream flex items-center gap-1">
                All jobs <ArrowRight size={13} />
              </Link>
            </div>
            <div className="space-y-3">
              {jobs
                .filter((j) => ["in_progress", "scheduled"].includes(j.stage))
                .slice(0, 4)
                .map((j) => (
                  <Link key={j.id} to="/dashboard/jobs" className="block card card-hover p-4 bg-surface-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="data text-xs text-steel">{j.number}</span>
                          <StatusPill s={jobStageStyle[j.stage]} live={j.stage === "in_progress"} />
                        </div>
                        <div className="text-sm font-semibold text-cream mt-1 truncate">{j.title}</div>
                        <div className="data text-[11px] text-steel mt-0.5">
                          {j.city} · {j.sqft.toLocaleString()} sq ft · {money(j.value)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="data text-[11px] text-steel">
                          {j.stage === "scheduled" ? dateTiny(j.scheduledDate) : `${j.progress}%`}
                        </div>
                        <div className="flex -space-x-1.5 mt-1.5 justify-end">
                          {j.crewIds.slice(0, 3).map((cid) => {
                            const c = crew.find((x) => x.id === cid);
                            return (
                              <span
                                key={cid}
                                className="h-6 w-6 rounded-full grid place-items-center data text-[9px] font-bold border-2 border-surface-2"
                                style={{ background: "#242428", color: "#f2b705" }}
                                title={c?.name}
                              >
                                {c?.initials ?? "?"}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    {j.stage === "in_progress" && (
                      <div className="mt-3">
                        <PaveProgress value={j.progress} live />
                      </div>
                    )}
                  </Link>
                ))}
            </div>
          </div>

          {/* Pipeline snapshot */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="display text-lg text-cream">Job pipeline</h3>
              <span className="data text-xs text-steel">{jobs.length} total</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {stageCounts.map(({ st, count }) => {
                const s = jobStageStyle[st];
                return (
                  <div key={st} className="text-center card p-3 bg-surface-2">
                    <div className="display text-2xl" style={{ color: s.fg }}>
                      {count}
                    </div>
                    <div className="data text-[9px] text-steel uppercase mt-1 leading-tight">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: attention + activity */}
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-highway" />
              <h3 className="display text-lg text-cream">Needs attention</h3>
            </div>
            {attention.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-ok">
                <CheckCircle2 size={16} /> All clear.
              </div>
            ) : (
              <div className="space-y-2">
                {attention.map((a, i) => (
                  <Link key={i} to={a.to} className="flex items-center gap-3 card card-hover p-2.5 bg-surface-2">
                    <span style={{ color: a.color }}>{a.icon}</span>
                    <span className="text-xs text-cream flex-1">{a.text}</span>
                    <ArrowRight size={13} className="text-steel-dim" />
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-hairline grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="display text-xl text-ok">{availableCrew}</div>
                <div className="data text-[10px] text-steel uppercase">Crew free</div>
              </div>
              <div>
                <div className="display text-xl text-cream">{equipment.filter((e) => e.status === "operational").length}</div>
                <div className="data text-[10px] text-steel uppercase">Rigs ready</div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-highway" />
              <h3 className="display text-lg text-cream">Recent activity</h3>
            </div>
            <ol className="relative pl-4 space-y-4">
              <span className="absolute left-0 top-1 bottom-1 w-px bg-hairline" />
              {activity.slice(0, 7).map((a) => (
                <li key={a.id} className="relative">
                  <span
                    className="absolute -left-[19px] top-1 h-2 w-2 rounded-full"
                    style={{ background: activityColor(a.kind) }}
                  />
                  <div className="text-xs text-cream leading-snug">{a.text}</div>
                  <div className="data text-[10px] text-steel-dim mt-0.5">{fromNow(a.ts)}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function activityColor(kind: string) {
  return (
    {
      lead: "#f2b705",
      job: "#f25c05",
      invoice: "#5b9bd5",
      payment: "#4ec27a",
      review: "#c07be0",
      crew: "#8a97a0",
      system: "#8a97a0",
    }[kind] ?? "#8a97a0"
  );
}

/* 5-day OC forecast with paving suitability — asphalt work is weather-dependent. */
const FORECAST = [
  { day: "Wed", hi: 84, lo: 65, rain: 0, icon: Sun, cond: "Sunny", pave: "ideal" },
  { day: "Thu", hi: 86, lo: 66, rain: 0, icon: Sun, cond: "Clear", pave: "ideal" },
  { day: "Fri", hi: 81, lo: 64, rain: 10, icon: CloudSun, cond: "Partly cloudy", pave: "good" },
  { day: "Sat", hi: 77, lo: 63, rain: 40, icon: CloudRain, cond: "AM clouds", pave: "caution" },
  { day: "Sun", hi: 83, lo: 65, rain: 5, icon: Sun, cond: "Sunny", pave: "ideal" },
] as const;

function PaveWeather() {
  const paveColor = (p: string) => (p === "ideal" ? "#4ec27a" : p === "good" ? "#f2b705" : "#f25c05");
  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <div className="eyebrow">Pave conditions</div>
        <span className="data text-[11px] text-steel">Orange County</span>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <Sun size={40} className="text-highway" />
        <div>
          <div className="display text-3xl text-cream">84°</div>
          <div className="text-sm text-ok flex items-center gap-1">
            <Droplets size={13} /> Ideal for paving & sealcoat
          </div>
        </div>
      </div>
      <div className="centerline my-4 opacity-40" />
      <div className="grid grid-cols-5 gap-1 flex-1">
        {FORECAST.map((f) => (
          <div key={f.day} className="text-center">
            <div className="data text-[10px] text-steel">{f.day}</div>
            <f.icon size={20} className="mx-auto my-1.5 text-muted" />
            <div className="data text-xs text-cream">{f.hi}°</div>
            <div className="data text-[10px] text-steel-dim">{f.lo}°</div>
            <div className="mt-1.5 mx-auto h-1.5 w-1.5 rounded-full" style={{ background: paveColor(f.pave) }} title={f.pave} />
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-hairline data text-[10px] text-steel flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-ok inline-block" /> ideal
        <span className="h-1.5 w-1.5 rounded-full bg-highway inline-block ml-2" /> good
        <span className="h-1.5 w-1.5 rounded-full bg-safety inline-block ml-2" /> hold
      </div>
    </div>
  );
}
