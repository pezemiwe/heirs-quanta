import type {
  Security,
  Assumptions,
  Stage,
  SecurityComputed,
  EngineResult,
  AssetSpecification,
  StageSummary,
  SpecificationSummary,
} from "./types";
import {
  computeTTM,
  computeMEIR,
  computeMCIR,
  computeLCD,
  computeDPDStage,
  computePerformanceStage,
  computeExpiryStage,
  computeModelStage,
  computeFinalStage,
} from "./staging";
import { mapRating } from "./rating";
import { buildPDTermStructure, pdTableFor } from "./pd";
import { computeLGD } from "./lgd";
import { projectEAD } from "./ead";
import { computeECLForRow } from "./ecl";

export function runEngine(
  securities: Security[],
  assumptions: Assumptions,
): EngineResult {
  const rows: SecurityComputed[] = securities.map((s) => {
    const ttm = computeTTM(s, assumptions.reportingDate);
    const meir = computeMEIR(s);
    const mcir = computeMCIR(s);
    const lcd = computeLCD(s, assumptions.reportingDate);
    const dpdStage = computeDPDStage(s.daysPastDue);
    const performanceStage = computePerformanceStage(s.performanceStatus);
    const expiryStage = computeExpiryStage(
      s.maturityDate,
      assumptions.reportingDate,
    );
    const modelStage = computeModelStage(
      dpdStage,
      performanceStage,
      expiryStage,
    );
    const finalStage = computeFinalStage(
      modelStage,
      s.qualitativeStagingOverride,
    );

    const ratingEquivalent = mapRating(s);
    const pdTable = pdTableFor(s.assetSpecification);
    const cum =
      pdTable[ratingEquivalent] ?? pdTable.B ?? Object.values(pdTable)[0];
    const pd = buildPDTermStructure(cum, assumptions);

    const { lgd, bucket } = computeLGD(
      s,
      ratingEquivalent,
      assumptions.sovereignRecoveryRate,
    );
    const ead = projectEAD(s, ttm, meir, mcir, lcd);

    const partial: SecurityComputed = {
      ...s,
      ttm,
      meir,
      mcir,
      lcd,
      dpdStage,
      performanceStage,
      expiryStage,
      modelStage,
      finalStage,
      ratingEquivalent,
      rrRating: bucket,
      pd,
      lgd,
      ead,
      ecl: 0,
      coverageRatio: 0,
    };
    partial.ecl = computeECLForRow(partial);
    partial.coverageRatio =
      partial.carryingAmountLcy > 0
        ? partial.ecl / partial.carryingAmountLcy
        : 0;
    return partial;
  });

  const stageBuckets: Record<
    Stage,
    { exposure: number; impairment: number; count: number }
  > = {
    1: { exposure: 0, impairment: 0, count: 0 },
    2: { exposure: 0, impairment: 0, count: 0 },
    3: { exposure: 0, impairment: 0, count: 0 },
  };
  for (const r of rows) {
    stageBuckets[r.finalStage].exposure += r.carryingAmountLcy;
    stageBuckets[r.finalStage].impairment += r.ecl;
    stageBuckets[r.finalStage].count += 1;
  }
  const byStage: StageSummary[] = ([1, 2, 3] as Stage[]).map((st) => {
    const b = stageBuckets[st];
    return {
      stage: st,
      exposure: b.exposure,
      impairment: b.impairment,
      count: b.count,
      coverageRatio: b.exposure > 0 ? b.impairment / b.exposure : 0,
    };
  });
  const totalExposure = byStage.reduce((a, b) => a + b.exposure, 0);
  const totalImpairment = byStage.reduce((a, b) => a + b.impairment, 0);
  byStage.push({
    stage: "TOTAL",
    exposure: totalExposure,
    impairment: totalImpairment,
    count: rows.length,
    coverageRatio: totalExposure > 0 ? totalImpairment / totalExposure : 0,
  });

  const specs: AssetSpecification[] = [
    "Corporate",
    "Sovereign FCY",
    "Sovereign LCY",
  ];
  const bySpecification: SpecificationSummary[] = specs.map((sp) => {
    const matched = rows.filter((r) => r.assetSpecification === sp);
    const exposure = matched.reduce((a, b) => a + b.carryingAmountLcy, 0);
    const impairment = matched.reduce((a, b) => a + b.ecl, 0);
    return {
      specification: sp,
      exposure,
      impairment,
      count: matched.length,
      coverageRatio: exposure > 0 ? impairment / exposure : 0,
    };
  });
  bySpecification.push({
    specification: "TOTAL",
    exposure: totalExposure,
    impairment: totalImpairment,
    count: rows.length,
    coverageRatio: totalExposure > 0 ? totalImpairment / totalExposure : 0,
  });

  return {
    rows,
    byStage,
    bySpecification,
    totals: {
      exposureLcy: totalExposure,
      impairmentLcy: totalImpairment,
      coverageRatio: totalExposure > 0 ? totalImpairment / totalExposure : 0,
      instrumentCount: rows.length,
    },
  };
}
