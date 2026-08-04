import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type {
  Database,
  Settings,
  Lead,
  Job,
  Invoice,
  Customer,
  Service,
  Testimonial,
  Contract,
  Material,
  Equipment,
} from "./types";
import { seed, seededIds, hasDemoData } from "./seed";

/* ============================================================
   Store — the app's data tier.
   Persists the whole database to localStorage and exposes a
   small typed API (read + mutate). Shaped like a repository so
   it can be swapped for the included Express/JSON server later
   without touching component code.
   ============================================================ */

const KEY = "mt-asphalt-db-v1";
export const AUTH_KEY = "mt-asphalt-auth-v1";

// Optional backend tier. When VITE_API_URL is set (e.g. http://localhost:8787),
// the store hydrates from and syncs to the Node REST server. Otherwise it uses
// the built-in Vercel Blob endpoint (/api/data) as a cloud backup, while still
// keeping localStorage as the instant, offline-first copy. Component code is
// identical either way.
const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");

// Attaches the dashboard session token (set by useAuth's login) to requests
// against /api/data, which requires it. Returns {} when logged out — the
// fetch then gets a 401 and the caller falls back to the local copy.
function authHeaders(): Record<string, string> {
  try {
    const token = sessionStorage.getItem(AUTH_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

function load(): Database {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Database;
  } catch {
    /* ignore */
  }
  return structuredClone(seed);
}

interface StoreApi {
  db: Database;
  // settings
  updateSettings: (patch: Partial<Settings>) => void;
  // generic collection mutators
  addLead: (lead: Lead) => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  removeLead: (id: string) => void;
  updateJob: (id: string, patch: Partial<Job>) => void;
  addJob: (job: Job) => void;
  addInvoice: (inv: Invoice) => void;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  addCustomer: (c: Customer) => void;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  addContract: (c: Contract) => void;
  updateContract: (id: string, patch: Partial<Contract>) => void;
  addService: (s: Service) => void;
  updateService: (id: string, patch: Partial<Service>) => void;
  removeService: (id: string) => void;
  addTestimonial: (t: Testimonial) => void;
  updateTestimonial: (id: string, patch: Partial<Testimonial>) => void;
  removeTestimonial: (id: string) => void;
  updateMaterial: (id: string, patch: Partial<Material>) => void;
  updateEquipment: (id: string, patch: Partial<Equipment>) => void;
  resetAll: () => void;
  clearDemoData: () => void;
  hasDemoData: boolean;
}

const StoreCtx = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Database>(load);
  const hydrated = useRef(false);

  // Hydrate from the backend on first mount.
  // 1. If VITE_API_URL is set, prefer that REST server.
  // 2. Otherwise try the built-in Vercel Blob endpoint (/api/data).
  // 3. Always merge the serverless lead inbox (/api/leads) last so new website
  //    estimate requests appear regardless of which backend is in use.
  // If every fetch fails, the localStorage/seed copy already in state is used.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let nextDb = db;
      try {
        if (API) {
          const res = await fetch(`${API}/api/db`);
          const remote = await res.json();
          if (remote && remote.settings) {
            nextDb = remote as Database;
          } else {
            // Server is empty — seed it with our current data.
            fetch(`${API}/api/db`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(nextDb),
            }).catch(() => {});
          }
        } else {
          // /api/data holds customers, invoices and revenue, not just public
          // content — it requires the same session token as the dashboard
          // login. A logged-out visitor (e.g. the public marketing site) gets
          // 401 here and silently keeps the local seed/localStorage copy.
          const res = await fetch("/api/data", { headers: { ...authHeaders(), accept: "application/json" } });
          if (res.ok) {
            const remote = await res.json();
            if (remote && remote.settings) {
              nextDb = remote as Database;
            } else {
              // Blob is empty — seed it with our current data.
              fetch("/api/data", {
                method: "PUT",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify(nextDb),
              }).catch(() => {});
            }
          }
        }
      } catch {
        /* offline or backend down — use localStorage copy already in state */
      }

      // Pull the serverless lead inbox and merge any leads this browser hasn't seen.
      // A bare `return` here must only skip the merge, not the outer hydrate
      // function — it used to abort the whole hydrate (including the
      // setDb(nextDb) below) whenever there were simply no new leads to
      // merge, which is the common case. That silently discarded whatever
      // /api/data had just returned (e.g. after Clear Demo Data) and left
      // the dashboard showing stale local/seed data indefinitely.
      nextDb = await (async () => {
        try {
          const res = await fetch("/api/leads", { headers: { accept: "application/json" } });
          if (!res.ok || !res.headers.get("content-type")?.includes("json")) return nextDb;
          const remote = (await res.json()) as Partial<Lead>[];
          if (!Array.isArray(remote) || remote.length === 0) return nextDb;
          const known = new Set(nextDb.leads.map((l) => l.id));
          const fresh: Lead[] = remote
            .filter((l) => l && typeof l.id === "string" && !known.has(l.id))
            .map((l) => ({
              id: l.id!,
              name: l.name ?? "Unknown",
              phone: l.phone ?? "",
              email: l.email ?? "",
              address: l.address ?? "",
              city: l.city ?? "",
              serviceInterest: l.serviceInterest ?? "General inquiry",
              message: l.message ?? "",
              status: l.status ?? "new",
              source: l.source ?? "website",
              createdAt: l.createdAt ?? new Date().toISOString(),
              estSqft: l.estSqft,
              value: l.value,
            }));
          return fresh.length > 0 ? { ...nextDb, leads: [...fresh, ...nextDb.leads] } : nextDb;
        } catch {
          /* local dev or offline — dashboard still works from local data */
          return nextDb;
        }
      })();

      if (!cancelled) setDb(nextDb);
      hydrated.current = true;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist: always to localStorage immediately; debounced to the backend when available.
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* quota — ignore */
    }
    if (!hydrated.current) return;
    const url = API ? `${API}/api/db` : "/api/data";
    const t = setTimeout(() => {
      fetch(url, {
        method: "PUT",
        headers: { ...(API ? {} : authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify(db),
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [db]);

  const api = useMemo<StoreApi>(() => {
    const patchIn = <T extends { id: string }>(arr: T[], id: string, patch: Partial<T>): T[] =>
      arr.map((x) => (x.id === id ? { ...x, ...patch } : x));

    return {
      db,
      updateSettings: (patch) => setDb((d) => ({ ...d, settings: { ...d.settings, ...patch } })),

      addLead: (lead) => setDb((d) => ({ ...d, leads: [lead, ...d.leads] })),
      updateLead: (id, patch) => setDb((d) => ({ ...d, leads: patchIn(d.leads, id, patch) })),
      removeLead: (id) => setDb((d) => ({ ...d, leads: d.leads.filter((l) => l.id !== id) })),

      updateJob: (id, patch) => setDb((d) => ({ ...d, jobs: patchIn(d.jobs, id, patch) })),
      addJob: (job) => setDb((d) => ({ ...d, jobs: [job, ...d.jobs] })),

      addInvoice: (inv) => setDb((d) => ({ ...d, invoices: [inv, ...d.invoices] })),
      updateInvoice: (id, patch) =>
        setDb((d) => ({ ...d, invoices: patchIn(d.invoices, id, patch) })),

      addCustomer: (c) => setDb((d) => ({ ...d, customers: [c, ...d.customers] })),
      updateCustomer: (id, patch) =>
        setDb((d) => ({ ...d, customers: patchIn(d.customers, id, patch) })),

      addContract: (c) => setDb((d) => ({ ...d, contracts: [c, ...d.contracts] })),
      updateContract: (id, patch) =>
        setDb((d) => ({ ...d, contracts: patchIn(d.contracts, id, patch) })),

      addService: (s) => setDb((d) => ({ ...d, services: [...d.services, s] })),
      updateService: (id, patch) =>
        setDb((d) => ({ ...d, services: patchIn(d.services, id, patch) })),
      removeService: (id) =>
        setDb((d) => ({ ...d, services: d.services.filter((s) => s.id !== id) })),

      addTestimonial: (t) => setDb((d) => ({ ...d, testimonials: [...d.testimonials, t] })),
      updateTestimonial: (id, patch) =>
        setDb((d) => ({ ...d, testimonials: patchIn(d.testimonials, id, patch) })),
      removeTestimonial: (id) =>
        setDb((d) => ({ ...d, testimonials: d.testimonials.filter((t) => t.id !== id) })),

      updateMaterial: (id, patch) =>
        setDb((d) => ({ ...d, materials: patchIn(d.materials, id, patch) })),
      updateEquipment: (id, patch) =>
        setDb((d) => ({ ...d, equipment: patchIn(d.equipment, id, patch) })),

      resetAll: () => setDb(structuredClone(seed)),

      // Company profile in Settings (name, license #836341, phone, address,
      // verified review stats, brand colors) is Michael's real, already-
      // verified business info, not demo data — this only strips the fake
      // seeded records (customers, jobs, invoices, ...). Settings is left
      // untouched, including the placeholder rate fields, which the user
      // chose to launch with (clearly labeled) rather than blank out.
      clearDemoData: () =>
        setDb((d) => ({
          ...d,
          leads: d.leads.filter((x) => !seededIds.leads.has(x.id)),
          customers: d.customers.filter((x) => !seededIds.customers.has(x.id)),
          jobs: d.jobs.filter((x) => !seededIds.jobs.has(x.id)),
          invoices: d.invoices.filter((x) => !seededIds.invoices.has(x.id)),
          contracts: d.contracts.filter((x) => !seededIds.contracts.has(x.id)),
          crew: d.crew.filter((x) => !seededIds.crew.has(x.id)),
          equipment: d.equipment.filter((x) => !seededIds.equipment.has(x.id)),
          materials: d.materials.filter((x) => !seededIds.materials.has(x.id)),
          activity: d.activity.filter((x) => !seededIds.activity.has(x.id)),
          revenue: [],
        })),

      hasDemoData: hasDemoData(db),
    };
  }, [db]);

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

/* ---- lightweight auth (server-verified, single-owner) ---- */
export function useAuth() {
  const [authed, setAuthed] = useState<boolean>(() => {
    try {
      return Boolean(sessionStorage.getItem(AUTH_KEY));
    } catch {
      return false;
    }
  });

  const login = async (password: string): Promise<boolean> => {
    const trimmed = password.trim();
    if (trimmed.length === 0) return false;

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: trimmed }),
      });

      if (res.ok) {
        const data = (await res.json()) as { token?: string };
        if (data.token) {
          sessionStorage.setItem(AUTH_KEY, data.token);
          setAuthed(true);
          return true;
        }
      }

      // The server is reachable and explicitly rejected the password (or
      // returned something unexpected) — never treat that as success.
      if (!import.meta.env.DEV) return false;

      // Missing /api routes are expected under plain `vite` dev (the Vercel
      // functions aren't served there) — fall back so local dev isn't
      // blocked. This branch is compiled out of production builds.
      // eslint-disable-next-line no-console
      console.warn("[mt-asphalt-auth] Auth endpoint unreachable; using dev fallback.");
    } catch {
      if (!import.meta.env.DEV) return false;
      // eslint-disable-next-line no-console
      console.warn("[mt-asphalt-auth] Auth endpoint unreachable; using dev fallback.");
    }

    sessionStorage.setItem(AUTH_KEY, "dev-fallback-token");
    setAuthed(true);
    return true;
  };

  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  };

  return { authed, login, logout };
}
