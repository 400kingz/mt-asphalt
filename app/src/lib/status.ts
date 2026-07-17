import type {
  JobStage,
  InvoiceStatus,
  LeadStatus,
  EquipmentStatus,
  ContractStatus,
} from "./types";

export interface StatusStyle {
  label: string;
  fg: string;
  bg: string;
  bd: string;
  dot: string;
}

const mk = (label: string, color: string, bg: string): StatusStyle => ({
  label,
  fg: color,
  bg,
  bd: color + "55",
  dot: color,
});

export const jobStageStyle: Record<JobStage, StatusStyle> = {
  estimate: mk("Estimate", "#8a97a0", "rgba(138,151,160,0.12)"),
  scheduled: mk("Scheduled", "#5b9bd5", "rgba(91,155,213,0.14)"),
  in_progress: mk("In Progress", "#f25c05", "rgba(242,92,5,0.14)"),
  completed: mk("Completed", "#f2b705", "rgba(242,183,5,0.14)"),
  invoiced: mk("Invoiced", "#c07be0", "rgba(192,123,224,0.14)"),
  paid: mk("Paid", "#4ec27a", "rgba(78,194,122,0.14)"),
};

export const invoiceStatusStyle: Record<InvoiceStatus, StatusStyle> = {
  draft: mk("Draft", "#8a97a0", "rgba(138,151,160,0.12)"),
  sent: mk("Sent", "#5b9bd5", "rgba(91,155,213,0.14)"),
  paid: mk("Paid", "#4ec27a", "rgba(78,194,122,0.14)"),
  overdue: mk("Overdue", "#ef4d4d", "rgba(239,77,77,0.14)"),
  void: mk("Void", "#5b6469", "rgba(91,100,105,0.12)"),
};

export const leadStatusStyle: Record<LeadStatus, StatusStyle> = {
  new: mk("New", "#f2b705", "rgba(242,183,5,0.14)"),
  contacted: mk("Contacted", "#5b9bd5", "rgba(91,155,213,0.14)"),
  quoted: mk("Quoted", "#c07be0", "rgba(192,123,224,0.14)"),
  won: mk("Won", "#4ec27a", "rgba(78,194,122,0.14)"),
  lost: mk("Lost", "#8a97a0", "rgba(138,151,160,0.12)"),
};

export const equipmentStatusStyle: Record<EquipmentStatus, StatusStyle> = {
  operational: mk("Ready", "#4ec27a", "rgba(78,194,122,0.14)"),
  in_use: mk("In Use", "#f25c05", "rgba(242,92,5,0.14)"),
  maintenance: mk("Service", "#f2b705", "rgba(242,183,5,0.14)"),
  down: mk("Down", "#ef4d4d", "rgba(239,77,77,0.14)"),
};

export const contractStatusStyle: Record<ContractStatus, StatusStyle> = {
  draft: mk("Draft", "#8a97a0", "rgba(138,151,160,0.12)"),
  sent: mk("Sent", "#5b9bd5", "rgba(91,155,213,0.14)"),
  signed: mk("Signed", "#4ec27a", "rgba(78,194,122,0.14)"),
  active: mk("Active", "#f25c05", "rgba(242,92,5,0.14)"),
  complete: mk("Complete", "#f2b705", "rgba(242,183,5,0.14)"),
};
