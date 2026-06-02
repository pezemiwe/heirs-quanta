export interface VarMetric {
  label: string;
  value: string;
  pct: string;
  status: string;
}

export interface ConcentrationItem {
  label: string;
  value: string;
  limit: string;
  status: string;
}

export interface StressScenario {
  scenario: string;
  impact: string;
  pct: string;
  severity: string;
}
