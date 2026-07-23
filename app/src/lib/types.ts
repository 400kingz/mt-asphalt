/* ============================================================
   MT ASPHALT — Domain model
   Shared types for the operations dashboard + public site.
   ============================================================ */

export type ID = string;

export interface Settings {
  companyName: string;
  legalEntityName: string;
  ownerName: string;
  tagline: string;
  phonePrimary: string;
  phoneSecondary: string;
  email: string;
  addressLine1: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  mailingCity: string;
  serviceCities: string[];
  businessHours: string;
  licenseNumber: string;
  licenseClass: string;
  licenseVerified: boolean;
  licenseStatusNote: string;
  showLicenseOnSite: boolean;
  bondNumber: string;
  bondCarrier: string;
  bondAmount: number;
  ratingAverage: number;
  reviewCount: number;
  yearsInBusiness: number;
  foundedYear: number;
  heroHeadline: string;
  heroSubheadline: string;
  ctaText: string;
  aboutText: string;
  googleBusinessUrl: string;
  // financial defaults
  laborRatePerHour: number;
  salesTaxRate: number;
  materialMarkupPct: number;
  defaultPaymentTerms: string;
  warrantyText: string;
  // brand
  brandPrimary: string;
  brandAccent: string;
  brandSecondary: string;
}

export interface Service {
  id: ID;
  name: string;
  slug: string;
  icon: string; // lucide icon key
  short: string;
  description: string;
  priceHint: string;
  sortOrder: number;
  active: boolean;
  featured: boolean;
}

export interface Testimonial {
  id: ID;
  quote: string;
  author: string;
  location: string;
  projectType: string;
  rating: number;
  active: boolean;
}

export type LeadStatus = "new" | "contacted" | "quoted" | "won" | "lost";
export type LeadSource = "website" | "phone" | "referral" | "google" | "yelp" | "repeat";

export interface Lead {
  id: ID;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  serviceInterest: string;
  message: string;
  estSqft?: number;
  status: LeadStatus;
  source: LeadSource;
  createdAt: string;
  value?: number; // estimated opportunity value
}

export interface Customer {
  id: ID;
  name: string;
  type: "residential" | "commercial" | "property_mgmt" | "hoa" | "municipal";
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  createdAt: string;
  tags: string[];
}

export type JobStage =
  | "estimate"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "invoiced"
  | "paid";

export type JobPriority = "low" | "normal" | "high";

export interface Job {
  id: ID;
  number: string; // JOB-2026-014
  title: string;
  customerId: ID;
  customerName: string;
  city: string;
  address: string;
  serviceTypes: string[];
  stage: JobStage;
  priority: JobPriority;
  sqft: number;
  value: number;
  cost: number; // estimated internal cost
  crewIds: ID[];
  equipmentIds: ID[];
  scheduledDate?: string;
  completedDate?: string;
  weatherSensitive: boolean;
  progress: number; // 0-100
  notes: string;
  createdAt: string;
  lat: number;
  lng: number;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

export interface LineItem {
  id: ID;
  description: string;
  qty: number;
  unit: string;
  rate: number;
}

export interface Invoice {
  id: ID;
  number: string; // INV-2026-031
  jobId?: ID;
  customerName: string;
  customerAddress: string;
  customerEmail: string;
  customerPhone?: string;
  jobSiteAddress: string;
  projectType?: string; // e.g. "Resurfacing/overlay", "New installation"
  sqft?: number; // estimated square footage of the work area
  serviceTypes?: string[]; // services selected in the builder
  lineItems: LineItem[];
  taxRate: number;
  notes: string;
  paymentTerms: string;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
  paidDate?: string;
}

export type ContractStatus = "draft" | "sent" | "signed" | "active" | "complete";

export interface Contract {
  id: ID;
  number: string;
  customerName: string;
  customerAddress: string;
  projectDescription: string;
  scopeItems: string[];
  totalAmount: number;
  paymentSchedule: string;
  warrantyText: string;
  status: ContractStatus;
  createdAt: string;
  signedDate?: string;
}

export type CrewRole = "foreman" | "operator" | "laborer" | "striping_tech" | "driver";

export interface CrewMember {
  id: ID;
  name: string;
  role: CrewRole;
  phone: string;
  status: "available" | "on_job" | "off";
  skills: string[];
  hourlyCost: number;
  initials: string;
}

export type EquipmentStatus = "operational" | "in_use" | "maintenance" | "down";
export type EquipmentType =
  | "paver"
  | "roller"
  | "dump_truck"
  | "sealcoat_rig"
  | "striper"
  | "skid_steer"
  | "compactor";

export interface Equipment {
  id: ID;
  name: string;
  type: EquipmentType;
  status: EquipmentStatus;
  hours: number; // engine hours
  nextServiceHours: number;
  lastService: string;
  assignedJobId?: ID;
}

export interface Material {
  id: ID;
  name: string;
  unit: string;
  onHand: number;
  reorderAt: number;
  unitCost: number;
  supplier: string;
}

export interface Activity {
  id: ID;
  ts: string;
  kind: "lead" | "job" | "invoice" | "payment" | "review" | "crew" | "system";
  text: string;
}

export interface RevenuePoint {
  month: string; // "Feb"
  revenue: number;
  expenses: number;
  jobs: number;
}

export interface Database {
  settings: Settings;
  services: Service[];
  testimonials: Testimonial[];
  leads: Lead[];
  customers: Customer[];
  jobs: Job[];
  invoices: Invoice[];
  contracts: Contract[];
  crew: CrewMember[];
  equipment: Equipment[];
  materials: Material[];
  activity: Activity[];
  revenue: RevenuePoint[];
}
