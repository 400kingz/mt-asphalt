import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Percent, Clock } from "lucide-react";
import { useStore } from "../../lib/store";
import { StatTile } from "../../components/ui";
import { money, compactMoney, invoiceSubtotal, daysUntil } from "../../lib/format";

const SERVICE_COLORS = ["#f2b705", "#f25c05", "#4ec27a", "#5b9bd5", "#c07be0", "#8a97a0", "#d69e00"];

export default function Finance() {
  const { db } = useStore();
  const { revenue, jobs, invoices } = db;

  const ytd = revenue.reduce((s, r) => s + r.revenue, 0);
  const ytdExp = revenue.reduce((s, r) => s + r.expenses, 0);
  const profit = ytd - ytdExp;
  const marginPct = Math.round((profit / ytd) * 100);
  const avgJob = Math.round(jobs.reduce((s, j) => s + j.value, 0) / jobs.length);

  // revenue by service (from jobs)
  const byService: Record<string, number> = {};
  jobs.forEach((j) => {
    const share = j.value / j.serviceTypes.length;
    j.serviceTypes.forEach((t) => (byService[t] = (byService[t] ?? 0) + share));
  });
  const servicePie = Object.entries(byService)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  // profit series
  const profitSeries = revenue.map((r) => ({ month: r.month, profit: r.revenue - r.expenses }));

  // receivables aging
  const unpaid = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const aging = { current: 0, d30: 0, d60: 0 };
  unpaid.forEach((i) => {
    const total = invoiceSubtotal(i.lineItems) * (1 + i.taxRate);
    const late = -daysUntil(i.dueDate);
    if (late <= 0) aging.current += total;
    else if (late <= 30) aging.d30 += total;
    else aging.d60 += total;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Revenue (12 mo)" value={compactMoney(ytd)} accent="#4ec27a" icon={<TrendingUp size={18} />} sub="trailing year" />
        <StatTile label="Net profit" value={compactMoney(profit)} accent="#f2b705" icon={<DollarSign size={18} />} sub={`${marginPct}% margin`} />
        <StatTile label="Avg. job value" value={money(avgJob)} accent="#5b9bd5" icon={<Percent size={18} />} sub={`${jobs.length} jobs`} />
        <StatTile label="Receivables" value={compactMoney(aging.current + aging.d30 + aging.d60)} accent={aging.d30 + aging.d60 > 0 ? "#f25c05" : "#8a97a0"} icon={<Clock size={18} />} sub={`${unpaid.length} open invoices`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profit bars */}
        <div className="lg:col-span-2 card p-5 min-w-0">
          <div className="eyebrow mb-1">Monthly net profit</div>
          <h3 className="display text-lg text-cream mb-4">Revenue minus expenses</h3>
          <div className="h-64 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitSeries} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#242428" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#8a97a0", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} minTickGap={18} />
                <YAxis tick={{ fill: "#8a97a0", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} width={38} />
                <Tooltip contentStyle={{ background: "#1f1f23", border: "1px solid #34343a", borderRadius: 10 }} labelStyle={{ color: "#f6f4ef", fontFamily: "Space Mono" }} formatter={(v: number) => [money(v), "Profit"]} cursor={{ fill: "rgba(242,183,5,0.06)" }} />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                  {profitSeries.map((_, i) => (
                    <Cell key={i} fill={i === profitSeries.length - 1 ? "#f2b705" : "#4ec27a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by service */}
        <div className="card p-5 min-w-0">
          <div className="eyebrow mb-1">Revenue mix</div>
          <h3 className="display text-lg text-cream mb-2">By service</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={servicePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={64} paddingAngle={2} stroke="none">
                  {servicePie.map((_, i) => (
                    <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1f1f23", border: "1px solid #34343a", borderRadius: 10 }} formatter={(v: number) => money(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {servicePie.slice(0, 5).map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERVICE_COLORS[i % SERVICE_COLORS.length] }} />
                <span className="text-muted flex-1 truncate">{s.name}</span>
                <span className="data text-steel">{money(s.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Receivables aging */}
      <div className="card p-5">
        <div className="eyebrow mb-1">Cash flow</div>
        <h3 className="display text-lg text-cream mb-4">Receivables aging</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            ["Current", aging.current, "#4ec27a", "not yet due"],
            ["1–30 days late", aging.d30, "#f2b705", "follow up"],
            ["31+ days late", aging.d60, "#ef4d4d", "call now"],
          ].map(([label, amt, color, hint]) => (
            <div key={label as string} className="card bg-surface-2 p-4 relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-1" style={{ background: color as string }} />
              <div className="data text-[10px] text-steel uppercase">{label as string}</div>
              <div className="display text-2xl mt-1" style={{ color: color as string }}>{money(amt as number)}</div>
              <div className="data text-[10px] text-steel-dim mt-0.5">{hint as string}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
