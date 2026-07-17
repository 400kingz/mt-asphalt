import React from "react";
import { Star } from "lucide-react";
import type { StatusStyle } from "../lib/status";

export function StatusPill({ s, live = false }: { s: StatusStyle; live?: boolean }) {
  return (
    <span className="chip" style={{ color: s.fg, background: s.bg, borderColor: s.bd }}>
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${live ? "pulse-hot" : ""}`}
        style={{ background: s.dot }}
      />
      {s.label}
    </span>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? "text-highway" : "text-surface-3"}
          fill={i <= Math.round(value) ? "#f2b705" : "none"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export function StatTile({
  label,
  value,
  sub,
  accent = "#f2b705",
  icon,
  trend,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
  icon?: React.ReactNode;
  trend?: { dir: "up" | "down"; text: string };
}) {
  return (
    <div className="card card-hover p-4 relative overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="flex items-start justify-between">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted font-semibold">
          {label}
        </div>
        {icon && <span style={{ color: accent }}>{icon}</span>}
      </div>
      <div className="data text-cream mt-2" style={{ fontSize: 26, fontWeight: 700 }}>
        {value}
      </div>
      {(sub || trend) && (
        <div className="mt-1 flex items-center gap-2 text-xs text-muted">
          {trend && (
            <span
              className="data font-bold"
              style={{ color: trend.dir === "up" ? "#4ec27a" : "#ef4d4d" }}
            >
              {trend.dir === "up" ? "▲" : "▼"} {trend.text}
            </span>
          )}
          {sub && <span>{sub}</span>}
        </div>
      )}
    </div>
  );
}

/** A paving-strip style progress bar. */
export function PaveProgress({ value, live = false }: { value: number; live?: boolean }) {
  return (
    <div className="h-2 w-full rounded-full bg-asphalt overflow-hidden border border-hairline">
      <div
        className="h-full rounded-full relative"
        style={{
          width: `${Math.max(2, value)}%`,
          background: value >= 100 ? "#4ec27a" : "linear-gradient(90deg,#d69e00,#f2b705)",
          transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {live && value < 100 && (
          <div
            className="centerline centerline-live absolute inset-0 opacity-40"
            style={{ height: "100%" }}
          />
        )}
      </div>
    </div>
  );
}

export function Sparkline({
  data,
  color = "#f2b705",
  width = 96,
  height = 30,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1 || 1);
  const pts = data.map((d, i) => [i * step, height - ((d - min) / range) * (height - 4) - 2]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.4" fill={color} />
    </svg>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h2 className="display text-cream text-2xl md:text-3xl">{title}</h2>
        {sub && <p className="text-muted mt-1.5 max-w-2xl text-sm">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Avatar({ initials, color = "#f2b705" }: { initials: string; color?: string }) {
  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-full data text-[11px] font-bold shrink-0"
      style={{ background: color + "22", color, border: `1px solid ${color}55` }}
    >
      {initials}
    </span>
  );
}

export function EmptyState({ icon, title, hint }: { icon?: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="card p-10 text-center">
      {icon && <div className="mx-auto mb-3 text-steel-dim">{icon}</div>}
      <div className="display text-lg text-steel">{title}</div>
      {hint && <div className="text-muted text-sm mt-1">{hint}</div>}
    </div>
  );
}
