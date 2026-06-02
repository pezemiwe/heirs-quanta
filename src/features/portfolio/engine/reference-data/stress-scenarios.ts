import type { StressScenario } from "../types";

export const STRESS_SCENARIOS: Omit<StressScenario, "impact" | "pct">[] = [
  {
    scenario: "2008 Global Financial Crisis",
    shocks: {
      Equity: -0.4,
      "Fixed Income": -0.05,
      "Real Estate": -0.22,
      "Private Equity": -0.35,
      Alternatives: -0.28,
      Cash: 0,
    },
    severity: "high",
  },
  {
    scenario: "2016 Nigeria Recession",
    shocks: {
      Equity: -0.3,
      "Fixed Income": -0.08,
      "Real Estate": -0.16,
      "Private Equity": -0.24,
      Alternatives: -0.2,
      Cash: 0,
    },
    severity: "medium",
  },
  {
    scenario: "Oil Price Crash (−50%)",
    shocks: {
      Equity: -0.2,
      "Fixed Income": -0.04,
      "Real Estate": -0.1,
      "Private Equity": -0.18,
      Alternatives: -0.1,
      Cash: 0,
    },
    severity: "medium",
  },
  {
    scenario: "NGN Devaluation (−30%)",
    shocks: {
      Equity: -0.12,
      "Fixed Income": -0.06,
      "Real Estate": -0.08,
      "Private Equity": -0.1,
      Alternatives: -0.08,
      Cash: 0.02,
    },
    severity: "low",
  },
  {
    scenario: "CBN Rate Hike (+300 bps)",
    shocks: {
      Equity: -0.09,
      "Fixed Income": -0.14,
      "Real Estate": -0.07,
      "Private Equity": -0.05,
      Alternatives: -0.05,
      Cash: 0.04,
    },
    severity: "low",
  },
];

