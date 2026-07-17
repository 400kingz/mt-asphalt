import { useState } from "react";
import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import {
  Phone,
  LogOut,
  Search,
  Bell,
  ChevronRight,
  Grip,
  X,
  ArrowUpRight,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useStore, useAuth } from "../lib/store";
import { LogoMark, Wordmark } from "../components/Logo";
import { NAV, NAV_GROUPS } from "./nav";

export default function AdminLayout() {
  const { authed, login, logout } = useAuth();
  const { db } = useStore();
  const loc = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!authed) return <Login onLogin={login} company={db.settings.companyName} />;

  const newLeads = db.leads.filter((l) => l.status === "new").length;
  const current = NAV.find((n) => n.to === loc.pathname) ?? NAV[0];
  const primary = NAV.filter((n) => n.primary);

  return (
    <div className="min-h-screen bg-asphalt lg:grid lg:grid-cols-[248px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col border-r border-hairline bg-surface sticky top-0 h-screen">
        <div className="h-16 flex items-center px-5 border-b border-hairline">
          <Link to="/dashboard">
            <Wordmark size={30} />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 no-sb">
          {NAV_GROUPS.map((group) => (
            <div key={group} className="mb-5">
              <div className="data text-[10px] uppercase tracking-[0.2em] text-steel-dim px-2 mb-2">
                {group}
              </div>
              <div className="space-y-0.5">
                {NAV.filter((n) => n.group === group).map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/dashboard"}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors relative ${
                        isActive
                          ? "bg-surface-2 text-cream"
                          : "text-muted hover:text-cream hover:bg-surface-2/50"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-highway" />
                        )}
                        <item.icon size={17} className={isActive ? "text-highway" : ""} />
                        <span className="flex-1">{item.label}</span>
                        {item.to === "/dashboard/leads" && newLeads > 0 && (
                          <span className="chip" style={{ background: "#f2b705", color: "#17130a", borderColor: "#f2b705" }}>
                            {newLeads}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-hairline">
          <a href="/" target="_blank" className="btn-ghost w-full text-xs mb-2">
            <ArrowUpRight size={14} /> View live site
          </a>
          <button onClick={logout} className="w-full flex items-center gap-2 text-xs text-steel hover:text-cream px-2 py-1.5">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-asphalt/90 backdrop-blur border-b border-hairline flex items-center gap-3 px-4 lg:px-6">
          <Link to="/dashboard" className="lg:hidden">
            <LogoMark size={30} />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <current.icon size={18} className="text-highway hidden sm:block" />
            <h1 className="display text-lg md:text-xl text-cream truncate">{current.label}</h1>
          </div>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-2 card px-3 py-1.5 w-56 text-steel">
            <Search size={15} />
            <input
              placeholder="Search jobs, customers…"
              className="bg-transparent outline-none text-sm text-cream w-full placeholder:text-steel-dim"
            />
          </div>
          <button className="relative grid h-9 w-9 place-items-center rounded-lg card card-hover" aria-label="Notifications">
            <Bell size={16} className="text-muted" />
            {newLeads > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 grid place-items-center rounded-full bg-highway text-asphalt data text-[9px] font-bold">
                {newLeads}
              </span>
            )}
          </button>
          <a href={"tel:" + db.settings.phonePrimary.replace(/[^\d]/g, "")} className="btn-primary text-sm hidden sm:inline-flex">
            <Phone size={15} /> <span className="hidden md:inline">{db.settings.phonePrimary}</span>
          </a>
        </header>

        {/* Page */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-hairline grid grid-cols-5" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {primary.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] relative ${
                isActive ? "text-highway" : "text-steel"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-highway" />}
                <span className="relative">
                  <item.icon size={19} />
                  {item.to === "/dashboard/leads" && newLeads > 0 && (
                    <span className="absolute -top-1.5 -right-2 h-3.5 min-w-3.5 px-1 grid place-items-center rounded-full bg-highway text-asphalt data text-[8px] font-bold">
                      {newLeads}
                    </span>
                  )}
                </span>
                <span className="font-medium">{item.label.split(" ")[0]}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] text-steel"
        >
          <Grip size={19} />
          <span className="font-medium">More</span>
        </button>
      </nav>

      {/* More sheet (mobile) */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/60 fadein" />
          <div className="relative bg-surface border-t border-hairline rounded-t-2xl p-4 pb-8 rise" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <Wordmark size={26} />
              <button onClick={() => setMoreOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg card">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/dashboard"}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `card flex flex-col items-center gap-2 py-4 text-xs ${
                      isActive ? "border-highway text-highway" : "text-muted"
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span className="text-center leading-tight">{item.label}</span>
                </NavLink>
              ))}
            </div>
            <button onClick={logout} className="btn-ghost w-full mt-4 text-sm">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Login gate ---------------- */
function Login({ onLogin, company }: { onLogin: (p: string) => boolean; company: string }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-asphalt">
      {/* brand side */}
      <div className="hidden lg:flex flex-col justify-between p-10 border-r border-hairline asphalt-grain relative overflow-hidden">
        <div
          className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle,#f2b705,transparent 70%)" }}
        />
        <Wordmark size={40} showTagline />
        <div className="relative">
          <div className="eyebrow mb-3">Owner's console</div>
          <h2 className="display text-cream text-5xl leading-[0.95]">
            Run the whole
            <br />
            operation from
            <br />
            <span className="text-highway">one screen.</span>
          </h2>
          <p className="text-muted mt-4 max-w-sm">
            Leads, jobs, crews, fleet, invoices, contracts and the public website — all in one place,
            built for the way {company} works.
          </p>
        </div>
        <div className="centerline centerline-live" />
      </div>

      {/* form side */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex justify-center">
            <Wordmark size={38} showTagline />
          </div>
          <div className="card p-8">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-highway/10 text-highway mb-5">
              <Lock size={22} />
            </div>
            <h1 className="display text-2xl text-cream">Welcome back, Michael</h1>
            <p className="text-muted text-sm mt-1">Sign in to your operations dashboard.</p>
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!onLogin(pw)) setErr(true);
              }}
            >
              <label className="block">
                <span className="field-label">Password</span>
                <input
                  type="password"
                  className="input"
                  value={pw}
                  onChange={(e) => {
                    setPw(e.target.value);
                    setErr(false);
                  }}
                  placeholder="Enter your password"
                  autoFocus
                />
              </label>
              {err && <div className="text-danger text-xs">Enter any password to continue.</div>}
              <button type="submit" className="btn-primary w-full">
                Sign in <ChevronRight size={16} />
              </button>
            </form>
            <div className="mt-5 flex items-center gap-2 data text-[11px] text-steel-dim">
              <ShieldCheck size={13} className="text-ok" />
              Demo console — any password unlocks the dashboard.
            </div>
          </div>
          <Link to="/" className="mt-5 flex items-center justify-center gap-1.5 text-sm text-steel hover:text-cream">
            ← Back to public site
          </Link>
        </div>
      </div>
    </div>
  );
}
