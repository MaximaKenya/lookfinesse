export interface LedgerEntry {
  id: string;

  vendor_id?: string;

  amount: number;

  geo_location?: string;

  failed_attempts?: number;

  is_new_device?: boolean;

  geo_velocity_flag?: boolean;

  blocked?: boolean;

  created_at?: string;
}

export interface Vendor {
  id: string;

  name?: string;

  quarantined?: boolean;

  payouts_frozen?: boolean;

  risk_score?: number;
}

export interface ThreatResult {
  level:
    | "low"
    | "medium"
    | "high"
    | "critical";

  actions: string[];

  reason: string;
}

export interface DefenseAction {
  transaction: string;

  action: string;

  reason: string;

  result: {
    success: boolean;

    action: string;
  };
}

export interface RiskAnalysis {
  suspiciousCount: number;

  averageRisk: number;

  highRiskTransactions: LedgerEntry[];
}

export interface HeatmapZone {
  zone: string;

  intensity: number;
}

export interface AlertEvent {
  id?: string;

  type: string;

  severity:
    | "info"
    | "warning"
    | "critical";

  message?: string;

  created_at?: string;
}

export interface AuditEvent {
  id?: string;

  event: string;

  payload: unknown;

  created_at?: string;
}

export interface CopilotInsight {
  summary: string;

  recommendations: string[];

  confidence?: number;
}