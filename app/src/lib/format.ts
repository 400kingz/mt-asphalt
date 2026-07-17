import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export const money = (n: number, cents = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(n || 0);

export const compactMoney = (n: number) => {
  if (Math.abs(n) >= 1000) return "$" + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k";
  return money(n);
};

export const num = (n: number) => new Intl.NumberFormat("en-US").format(n || 0);

export const dateShort = (d?: string) => (d ? dayjs(d).format("MMM D, YYYY") : "—");
export const dateTiny = (d?: string) => (d ? dayjs(d).format("MMM D") : "—");
export const fromNow = (d?: string) => (d ? dayjs(d).fromNow() : "—");
export const dayName = (d?: string) => (d ? dayjs(d).format("ddd") : "—");

export const today = dayjs("2026-07-16");

export const daysUntil = (d?: string) => (d ? dayjs(d).diff(today, "day") : 0);

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

export const lineTotal = (qty: number, rate: number) => qty * rate;

export const invoiceSubtotal = (items: { qty: number; rate: number }[]) =>
  items.reduce((s, i) => s + i.qty * i.rate, 0);

export const uid = (prefix = "id") =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
