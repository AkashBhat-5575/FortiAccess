export type ArchitectureId = "A" | "B" | "C";
export type ArchitectureMetric =
  "cost" | "performance" | "scalability" | "availability" | "security";
export type ArchitectureScore = Record<ArchitectureMetric, number>;
export interface Workload {
  application_name: string;
  users: number;
  traffic_level: "low" | "medium" | "high";
  monthly_budget: number;
  availability_required: number;
  data_sensitivity: "low" | "medium" | "high";
  performance_priority: number;
  scalability_priority: number;
  security_priority: number;
  role: "admin" | "cloud_engineer" | "viewer";
  device_trusted: boolean;
  network_trusted: boolean;
  monthly_requests: number | null;
  storage_gb: number;
  compute_duration_ms: number;
  memory_mb: number;
}
export interface ArchitectureService {
  id: string;
  name: string;
  category: string;
  detail: string;
}
export interface ArchitectureConnection {
  source: string;
  target: string;
  kind: "traffic" | "control";
}
export interface SecurityRisk {
  risk_score: number;
  risk_level: string;
  decision: string;
  policy: string;
  factors: { factor: string; value: number; reason: string }[];
}
export interface Architecture {
  id: ArchitectureId;
  name: string;
  type: string;
  rank: number;
  services: string[];
  nodes: ArchitectureService[];
  connections: ArchitectureConnection[];
  metric_scores: ArchitectureScore;
  weights: ArchitectureScore;
  contributions: ArchitectureScore;
  metric_reasons: Record<ArchitectureMetric, string>;
  cost_score: number;
  performance_score: number;
  scalability_score: number;
  availability_score: number;
  security_score: number;
  overall_score: number;
  estimated_monthly_cost: number;
  budget_status: string;
  strengths: string[];
  weaknesses: string[];
  cost_details: {
    total: number;
    breakdown: Record<string, number>;
    monthly_requests: number;
    replicas: number | null;
    assumptions: string[];
  };
  metadata: {
    boundary: string;
    tradeoff: string;
    security_controls: { service: string; description: string }[];
  };
}
export interface AnalysisResult {
  application: string;
  workload: Workload;
  access_risk: SecurityRisk;
  recommendation: Architecture;
  architectures: Architecture[];
  explanation: string;
}
export interface SimulationResult extends AnalysisResult {
  simulation: Workload;
  recommended_architecture: Architecture;
}
