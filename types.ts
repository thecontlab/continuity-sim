export enum AuditStage {
  FOUNDATION = 'FOUNDATION',
  RISK_AUDIT = 'RISK_AUDIT',
  PROCESSING = 'PROCESSING',
  TEASER = 'TEASER',
  IDENTITY_GATE = 'IDENTITY_GATE',
  FULL_REPORT = 'FULL_REPORT'
}

export enum RiskCategory {
  SUPPLY_CHAIN = 'Supply Chain',
  CASH_FLOW = 'Cash Flow',
  WEATHER_PHYSICAL = 'Weather & Physical',
  INFRASTRUCTURE_TOOLS = 'Infrastructure & Tools',
  WORKFORCE = 'Workforce'
}

export interface RiskInput {
  category: RiskCategory;
  severity: number; // 1-10
  latency: number; // 1-10
  skipped: boolean;
  // NEW: Rich Context for the AI
  metadata?: {
    question1_label: string;
    answer1_value: string | number;
    question2_label: string;
    answer2_value: string | number;
    selected_tags: string[];
  };
}

export interface FoundationData {
  industry: string;
  revenue: number;
}

export interface IdentityData {
  companyName: string;
  email: string;
}

export interface HeatmapPoint {
  label: string;
  x: number;
  y: number;
  status: string;
}

export interface AuditResults {
  primary_rar: number;
  primary_risk_category: string;
  volatility_index: number;
  unknown_vulnerabilities: string[];
}

export interface TeaserSummary {
  headline: string;
  critical_finding: string;
}

export interface PriorityFix {
  timeline: string;
  task: string;
  target: string;
}

export interface GeminiAuditResponse {
  audit_results: AuditResults;
  heatmap_coordinates: HeatmapPoint[];
  teaser_summary: TeaserSummary;
  priority_fix_list: PriorityFix[];
}

export interface AppState {
  stage: AuditStage;
  foundation: FoundationData;
  riskInputs: RiskInput[];
  identity: IdentityData;
  auditResult: GeminiAuditResponse | null;
  leadId?: number; // <--- NEW: Stores the database ID of the current session
}
