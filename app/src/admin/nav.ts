import {
  LayoutDashboard,
  Inbox,
  Construction,
  CalendarDays,
  Users,
  ReceiptText,
  FileSignature,
  HardHat,
  Truck,
  Package,
  Star,
  TrendingUp,
  Globe,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  group: string;
  primary?: boolean; // shown in mobile bottom bar
}

export const NAV: NavItem[] = [
  { to: "/dashboard", label: "Command Center", icon: LayoutDashboard, group: "Operate", primary: true },
  { to: "/dashboard/leads", label: "Leads", icon: Inbox, group: "Operate", primary: true },
  { to: "/dashboard/jobs", label: "Jobs", icon: Construction, group: "Operate", primary: true },
  { to: "/dashboard/schedule", label: "Schedule", icon: CalendarDays, group: "Operate", primary: true },
  { to: "/dashboard/customers", label: "Customers", icon: Users, group: "Operate" },
  { to: "/dashboard/invoices", label: "Invoices", icon: ReceiptText, group: "Money" },
  { to: "/dashboard/contracts", label: "Contracts", icon: FileSignature, group: "Money" },
  { to: "/dashboard/finance", label: "Finance", icon: TrendingUp, group: "Money" },
  { to: "/dashboard/crew", label: "Crew", icon: HardHat, group: "Resources" },
  { to: "/dashboard/fleet", label: "Fleet", icon: Truck, group: "Resources" },
  { to: "/dashboard/materials", label: "Materials", icon: Package, group: "Resources" },
  { to: "/dashboard/reviews", label: "Reviews", icon: Star, group: "Brand" },
  { to: "/dashboard/website", label: "Website (CMS)", icon: Globe, group: "Brand" },
  { to: "/dashboard/settings", label: "Settings", icon: Settings, group: "Brand" },
];

export const NAV_GROUPS = ["Operate", "Money", "Resources", "Brand"];
