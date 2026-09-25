export type Role = "USER" | "ADMIN" | "INSPECTOR" | "CONTRACTOR";
export type ClaimStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "IN_PROGRESS"
  | "REPAIR_SUBMITTED"
  | "VERIFIED"
  | "REJECTED";
export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  organization_id: string | null;
  created_at: string;
};
export type Contractor = {
  id: string;
  name: string;
  organization_id: string;
  bin_or_demo_identifier: string;
  contact_name: string;
  contact_phone: string;
};
export type Contract = {
  id: string;
  title: string;
  contract_number: string;
  contractor_id: string;
  start_date: string;
  completion_date: string;
  description: string;
};
export type Asset = {
  id: string;
  name: string;
  asset_code: string;
  asset_type: string;
  microdistrict: string;
  address: string;
  contract_id: string;
  commissioned_at: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
};
export type Warranty = {
  id: string;
  asset_id: string;
  contractor_id: string;
  starts_at: string;
  expires_at: string;
  terms: string;
  status: string;
  computed_status: string;
  remaining_days: number;
  elapsed_percent: number;
};
export type Defect = {
  id: string;
  asset_id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  reported_at: string;
  status: string;
  repeat_defect: boolean;
  repeat_count: number;
  previous_defect_ids: string[];
};
export type Claim = {
  id: string;
  claim_number: number;
  defect_id: string;
  warranty_id: string;
  contractor_id: string;
  status: ClaimStatus;
  response_deadline: string;
  repair_deadline: string;
  assigned_at: string;
  acknowledged_at: string | null;
  completed_at: string | null;
  verified_at: string | null;
  created_at: string;
  asset_id: string;
  asset_name: string;
  asset_code: string;
  contractor_name: string;
  title: string;
  category: string;
  severity: string;
  repeat_defect: boolean;
  sla_status: string;
  microdistrict: string;
};
export type History = {
  id: string;
  entity_id: string;
  from_status: string | null;
  to_status: string;
  reason: string;
  actor_name: string;
  created_at: string;
};
export type Audit = {
  id: string;
  entity_id: string;
  entity_type: string;
  action: string;
  actor_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
};
export type Evidence = {
  id: string;
  claim_id: string;
  storage_path: string;
  evidence_type: string;
  note: string;
  created_at: string;
  url?: string;
};
export type Notification = {
  id: string;
  title: string;
  body: string;
  claim_id: string | null;
  read_at: string | null;
  created_at: string;
};
export type Dataset = {
  profile: Profile;
  assets: Asset[];
  contractors: Contractor[];
  contracts: Contract[];
  warranties: Warranty[];
  defects: Defect[];
  claims: Claim[];
  history: History[];
  audit: Audit[];
  notifications: Notification[];
  today: string;
};
export type DefectResult = {
  defectId: string;
  claimId: string | null;
  claimNumber: number | null;
  warrantyStatus: string;
  expiresAt: string | null;
  remainingWarrantyDays: number;
  contractor: Contractor | null;
  repeatDefect: boolean;
  repeatCount: number;
  previousDefectIds: string[];
  daysSincePreviousDefect: number | null;
};
export type ActionState = {
  error?: string;
  success?: string;
  result?: DefectResult;
};
