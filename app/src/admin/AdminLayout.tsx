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
  AlertTriangle,
} from "lucide-react";
import { useStore, useAuth } from "../lib/store";
import { LogoMark, Wordmark } from "../components/Logo";
import { NAV, NAV_GROUPS } from "./nav";

const DEMO_BANNER_KEY = "mt-asphalt-demo-banner-dismissed-v1";

export interface AdminOutletContext {
  adminEmail: string | null;
  logout: () => void;
}

export default function AdminLayout() {
  const { authed, adminEmail, login, loginDev, logout } = useAuth();
  const { db, hasDemoData } = useStore();
  const loc = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem(DEMO_BANNER_KEY) === "1";
    } catch {
      return false;
    }
  });

  const dismissBanner = () => {
    try {
      localStorage.setItem(DEMO_BANNER_KEY, "1");
    } catch {
      /* ignore */
    }
    setBannerDismissed(true);
  };

  if (!authed) {
    return (
      <Login
        onLogin={login}
        onDevLogin={import.meta.env.DEV ? loginDev : undefined}
        company={db.settings.companyName}
      />
    );
  }

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
          {adminEmail && (
            <div className="px-2 pb-1.5 text-[11px] text-steel-dim truncate" title={adminEmail}>
              Signed in as {adminEmail}
            </div>
          )}
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
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="md:hidden grid h-11 w-11 place-items-center rounded-lg card card-hover"
            aria-label="Search"
          >
            <Search size={16} className="text-muted" />
          </button>
          <button className="relative grid h-11 w-11 lg:h-9 lg:w-9 place-items-center rounded-lg card card-hover" aria-label="Notifications">
            <Bell size={16} className="text-muted" />
            {newLeads > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 grid place-items-center rounded-full bg-highway text-asphalt data text-[9px] font-bold">
                {newLeads}
              </span>
            )}
          </button>
          <a
            href={"tel:" + db.settings.phonePrimary.replace(/[^\d]/g, "")}
            className="btn-primary text-sm inline-flex"
            aria-label={"Call " + db.settings.phonePrimary}
          >
            <Phone size={15} /> <span className="hidden md:inline">{db.settings.phonePrimary}</span>
          </a>
        </header>

        {searchOpen && (
          <div className="md:hidden px-4 py-2 border-b border-hairline bg-asphalt/90">
            <div className="flex items-center gap-2 card px-3 py-1.5 w-full text-steel">
              <Search size={15} />
              <input
                placeholder="Search jobs, customers…"
                className="bg-transparent outline-none text-sm text-cream w-full placeholder:text-steel-dim"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Demo data banner */}
        {hasDemoData && !bannerDismissed && (
          <div className="px-4 lg:px-6 pt-4">
            <div className="card p-4 border-highway/40 bg-highway/10">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-highway shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="display text-sm text-cream">This dashboard contains sample demo data</h4>
                  <p className="text-muted text-sm mt-1">
                    Customers like "Robert Maddox" and jobs like "Harbor Plaza" are fictional examples.
                    Before you enter real customers or send invoices, go to{" "}
                    <Link to="/dashboard/settings" className="text-highway hover:underline">
                      Settings
                    </Link>{" "}
                    and choose <strong>Clear demo data</strong> to start clean.
                  </p>
                </div>
                <button
                  onClick={dismissBanner}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 shrink-0"
                  aria-label="Dismiss demo data notice"
                >
                  <X size={16} className="text-muted" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 max-w-[1400px] w-full mx-auto">
          <Outlet context={{ adminEmail, logout } satisfies AdminOutletContext} />
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
              `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] relative ${
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
                    <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 grid place-items-center rounded-full bg-highway text-asphalt data text-[9px] font-bold">
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
          className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] text-steel"
        >
          <Grip size={19} />
          <span className="font-medium">More</span>
        </button>
      </nav>

      {/* More sheet (mobile) */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/60 fadein" />
          <div className="relative bg-surface border-t border-hairline rounded-t-2xl p-4 pb-[calc(2rem+env(safe-area-inset-bottom))] rise max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <Wordmark size={26} />
              <button onClick={() => setMoreOpen(false)} className="grid h-11 w-11 place-items-center rounded-lg card">
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

function GoogleG({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 34.8 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.7 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.4 36.4 44 30.8 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}

/* ---------------- Login gate ---------------- */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  forbidden: "That Google account isn't on the approved admin list.",
  unverified: "That Google account's email isn't verified.",
  denied: "Sign-in was cancelled.",
  state: "Sign-in session expired — please try again.",
  config: "Google sign-in isn't configured yet.",
  exchange: "Google sign-in failed. Please try again.",
  userinfo: "Google sign-in failed. Please try again.",
  server: "Something went wrong signing in. Please try again.",
};

function Login({
  onLogin,
  onDevLogin,
  company,
}: {
  onLogin: () => void;
  onDevLogin?: () => void;
  company: string;
}) {
  const authError = new URLSearchParams(window.location.search).get("authError");
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
          <div className="card p-6 sm:p-8">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-highway/10 text-highway mb-5">
              <Lock size={22} />
            </div>
            <h1 className="display text-2xl text-cream">Welcome back, Michael</h1>
            <p className="text-muted text-sm mt-1">Sign in to your operations dashboard.</p>
            {authError && (
              <div className="mt-4 text-danger text-xs">
                {AUTH_ERROR_MESSAGES[authError] ?? "Something went wrong signing in. Please try again."}
              </div>
            )}
            <div className="mt-6 space-y-2">
              <button onClick={onLogin} className="btn-primary w-full">
                <GoogleG size={16} /> Sign in with Google <ChevronRight size={16} />
              </button>
              {onDevLogin && (
                <button onClick={onDevLogin} className="btn-ghost w-full text-xs">
                  Continue without Google (dev mode)
                </button>
              )}
            </div>
            <div className="mt-5 flex items-center gap-2 data text-[11px] text-steel-dim">
              <ShieldCheck size={13} className="text-ok" />
              Owner's console — only approved Google accounts can sign in.
            </div>
          </div>
          <Link to="/" className="mt-5 flex items-center justify-center gap-1.5 py-2.5 text-sm text-steel hover:text-cream">
            ← Back to public site
          </Link>
        </div>
      </div>
    </div>
  );
}
