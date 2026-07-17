import { Routes, Route, Navigate } from "react-router-dom";
import PublicSite from "./public/PublicSite";
import AdminLayout from "./admin/AdminLayout";
import Overview from "./admin/pages/Overview";
import Leads from "./admin/pages/Leads";
import Jobs from "./admin/pages/Jobs";
import Schedule from "./admin/pages/Schedule";
import Customers from "./admin/pages/Customers";
import Invoices from "./admin/pages/Invoices";
import Contracts from "./admin/pages/Contracts";
import Crew from "./admin/pages/Crew";
import Fleet from "./admin/pages/Fleet";
import Materials from "./admin/pages/Materials";
import Reviews from "./admin/pages/Reviews";
import Finance from "./admin/pages/Finance";
import WebsiteCms from "./admin/pages/WebsiteCms";
import SettingsPage from "./admin/pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicSite />} />
      <Route path="/dashboard" element={<AdminLayout />}>
        <Route index element={<Overview />} />
        <Route path="leads" element={<Leads />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="customers" element={<Customers />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="crew" element={<Crew />} />
        <Route path="fleet" element={<Fleet />} />
        <Route path="materials" element={<Materials />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="finance" element={<Finance />} />
        <Route path="website" element={<WebsiteCms />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
