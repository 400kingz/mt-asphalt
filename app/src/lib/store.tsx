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
import { seed } from "./seed";

/* ============================================================
   Store — the app's data tier.
   Persists the whole database to localStorage and exposes a
   small typed API (read + mutate). Shaped like a repository so
   it can be swapped for the included Express/JSON server later
   without touching component code.
   ============================================================ */

const KEY = "mt-asphalt-db-v1";
const AUTH_KEY = "mt-asphalt-auth-v1";

// Optional backend tier. When VITE_API_URL is set (e.g. http://localhost:8787),
// the store hydrates from and syncs to the Node REST server; otherwise it runs
// entirely on localStorage. Component code is identical either way.
const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");

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
}

const StoreCtx = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Database>(load);
  const hydrated = useRef(false);

  // Hydrate from the API server on first mount, if configured.
  useEffect(() => {
    if (!API) {
      hydrated.current = true;
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/db`);
        const remote = await res.json();
        if (!cancelled && remote && remote.settings) {
          setDb(remote as Database);
        } else if (!cancelled) {
          // Server is empty — seed it with our current data.
          fetch(`${API}/api/db`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(db),
          }).catch(() => {});
        }
      } catch {
        /* offline — fall back to localStorage copy already in state */
      } finally {
        hydrated.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist: always to localStorage; debounced to the API when configured.
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* quota — ignore */
    }
    if (!API || !hydrated.current) return;
    const t = setTimeout(() => {
      fetch(`${API}/api/db`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
    };
  }, [db]);

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

/* ---- lightweight auth (local, single-owner) ---- */
export function useAuth() {
  const [authed, setAuthed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(AUTH_KEY) === "1";
    } catch {
      return false;
    }
  });
  const login = (password: string) => {
    // Demo gate — any non-empty password unlocks Michael's console.
    if (password.trim().length > 0) {
      sessionStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
      return true;
    }
    return false;
  };
  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  };
  return { authed, login, logout };
}
