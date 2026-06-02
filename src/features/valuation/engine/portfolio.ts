import type {
  Assumptions,
  Classification,
  IncomeSummary,
  Instrument,
  InstrumentType,
  MaturityBucket,
  PortfolioByClassification,
  PortfolioBySector,
  PortfolioByType,
  PortfolioResult,
  TopExposure,
} from "./types";
import { daysBetween, parseDate } from "./date-helpers";
import { fxRate } from "./yield-curve";
import { valueInstrument } from "./valuation";

const MATURITY_BUCKETS: {
  bucket: string;
  minDays: number;
  maxDays: number;
}[] = [
  { bucket: "Matured", minDays: -100000, maxDays: 0 },
  { bucket: "0-3 Months", minDays: 0, maxDays: 90 },
  { bucket: "3-6 Months", minDays: 90, maxDays: 180 },
  { bucket: "6-12 Months", minDays: 180, maxDays: 365 },
  { bucket: "1-2 Years", minDays: 365, maxDays: 730 },
  { bucket: "2-5 Years", minDays: 730, maxDays: 1826 },
  { bucket: "5-10 Years", minDays: 1826, maxDays: 3652 },
  { bucket: "10+ Years", minDays: 3652, maxDays: 100000 },
];

export function runPortfolioEngine(
  instruments: Instrument[],
  assumptions: Assumptions,
): PortfolioResult {
  const valuations = instruments.map((i) => valueInstrument(i, assumptions));

  const totalFaceValueNGN = valuations.reduce(
    (s, v) =>
      s + v.instrument.faceValue * fxRate(v.instrument.currency, assumptions),
    0,
  );
  const totalBSValueNGN = valuations.reduce(
    (s, v) => s + v.balanceSheetValueNGN,
    0,
  );
  const totalECLNGN = valuations.reduce(
    (s, v) =>
      s +
      (v.instrument.eclProvision ?? 0) *
        fxRate(v.instrument.currency, assumptions),
    0,
  );
  const totalOCIReserveNGN = valuations
    .filter((v) => v.instrument.classification === "FVOCI")
    .reduce(
      (s, v) => s + v.ociReserve * fxRate(v.instrument.currency, assumptions),
      0,
    );
  const totalFVTPLGLNGN = valuations
    .filter((v) => v.instrument.classification === "FVTPL")
    .reduce(
      (s, v) => s + v.unrealisedGL * fxRate(v.instrument.currency, assumptions),
      0,
    );

  const classes: Classification[] = ["AC", "FVOCI", "FVTPL"];
  const byClassification: PortfolioByClassification[] = classes.map((c) => {
    const subset = valuations.filter((v) => v.instrument.classification === c);
    return {
      classification: c,
      count: subset.length,
      faceValueNGN: subset.reduce(
        (s, v) =>
          s +
          v.instrument.faceValue * fxRate(v.instrument.currency, assumptions),
        0,
      ),
      bsValueNGN: subset.reduce((s, v) => s + v.balanceSheetValueNGN, 0),
      eclNGN: subset.reduce(
        (s, v) =>
          s +
          (v.instrument.eclProvision ?? 0) *
            fxRate(v.instrument.currency, assumptions),
        0,
      ),
    };
  });

  const typeMap = new Map<InstrumentType, PortfolioByType>();
  for (const v of valuations) {
    const t = v.instrument.instrumentType;
    const cur = typeMap.get(t) ?? {
      type: t,
      count: 0,
      faceValueNGN: 0,
      bsValueNGN: 0,
    };
    cur.count++;
    cur.faceValueNGN +=
      v.instrument.faceValue * fxRate(v.instrument.currency, assumptions);
    cur.bsValueNGN += v.balanceSheetValueNGN;
    typeMap.set(t, cur);
  }
  const byType = [...typeMap.values()].sort(
    (a, b) => b.bsValueNGN - a.bsValueNGN,
  );

  const sectorMap = new Map<string, PortfolioBySector>();
  for (const v of valuations) {
    const s = v.instrument.sector;
    const cur = sectorMap.get(s) ?? {
      sector: s,
      count: 0,
      faceValueNGN: 0,
      bsValueNGN: 0,
      pctOfPortfolio: 0,
    };
    cur.count++;
    cur.faceValueNGN +=
      v.instrument.faceValue * fxRate(v.instrument.currency, assumptions);
    cur.bsValueNGN += v.balanceSheetValueNGN;
    sectorMap.set(s, cur);
  }
  const bySector = [...sectorMap.values()].sort(
    (a, b) => b.faceValueNGN - a.faceValueNGN,
  );
  for (const r of bySector) {
    r.pctOfPortfolio =
      totalFaceValueNGN > 0 ? r.faceValueNGN / totalFaceValueNGN : 0;
  }

  const valDate = parseDate(assumptions.valuationDate);
  const maturityProfile: MaturityBucket[] = MATURITY_BUCKETS.map((b) => ({
    ...b,
    count: 0,
    faceValueNGN: 0,
  }));
  for (const v of valuations) {
    const days = daysBetween(valDate, parseDate(v.instrument.maturityDate));
    const bucket = maturityProfile.find(
      (b) => days > b.minDays && days <= b.maxDays,
    );
    if (bucket) {
      bucket.count++;
      bucket.faceValueNGN +=
        v.instrument.faceValue * fxRate(v.instrument.currency, assumptions);
    }
  }

  const topExposures: TopExposure[] = [...valuations]
    .sort((a, b) => b.balanceSheetValueNGN - a.balanceSheetValueNGN)
    .slice(0, 10)
    .map((v, i) => ({
      rank: i + 1,
      id: v.instrument.id,
      name: v.instrument.name,
      type: v.instrument.instrumentType,
      classification: v.instrument.classification,
      bsValueNGN: v.balanceSheetValueNGN,
    }));

  const acSet = valuations.filter((v) => v.instrument.classification === "AC");
  const fvociSet = valuations.filter(
    (v) => v.instrument.classification === "FVOCI",
  );
  const fvtplSet = valuations.filter(
    (v) => v.instrument.classification === "FVTPL",
  );
  const income: IncomeSummary = {
    ac: {
      instruments: acSet.length,
      totalCarryingValueNGN: acSet.reduce(
        (s, v) =>
          s + v.acCarryingValue * fxRate(v.instrument.currency, assumptions),
        0,
      ),
      totalAccruedInterestNGN: acSet.reduce(
        (s, v) =>
          s + v.accruedInterest * fxRate(v.instrument.currency, assumptions),
        0,
      ),
      totalECLNGN: acSet.reduce(
        (s, v) =>
          s +
          (v.instrument.eclProvision ?? 0) *
            fxRate(v.instrument.currency, assumptions),
        0,
      ),
    },
    fvoci: {
      instruments: fvociSet.length,
      totalACCarryingValueNGN: fvociSet.reduce(
        (s, v) =>
          s + v.acCarryingValue * fxRate(v.instrument.currency, assumptions),
        0,
      ),
      totalFairValueNGN: fvociSet.reduce(
        (s, v) =>
          s + v.cleanFairValue * fxRate(v.instrument.currency, assumptions),
        0,
      ),
      totalOCIReserveNGN: fvociSet.reduce(
        (s, v) => s + v.ociReserve * fxRate(v.instrument.currency, assumptions),
        0,
      ),
      totalECLNGN: fvociSet.reduce(
        (s, v) =>
          s +
          (v.instrument.eclProvision ?? 0) *
            fxRate(v.instrument.currency, assumptions),
        0,
      ),
    },
    fvtpl: {
      instruments: fvtplSet.length,
      totalFairValueNGN: fvtplSet.reduce(
        (s, v) =>
          s + v.cleanFairValue * fxRate(v.instrument.currency, assumptions),
        0,
      ),
      totalUnrealisedGLNGN: fvtplSet.reduce(
        (s, v) =>
          s + v.unrealisedGL * fxRate(v.instrument.currency, assumptions),
        0,
      ),
    },
  };

  return {
    valuations,
    totals: {
      instruments: instruments.length,
      totalFaceValueNGN,
      totalBSValueNGN,
      totalECLNGN,
      totalOCIReserveNGN,
      totalFVTPLUnrealisedGLNGN: totalFVTPLGLNGN,
    },
    byClassification,
    byType,
    bySector,
    maturityProfile,
    topExposures,
    income,
  };
}
