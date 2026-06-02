import { MATURITY_BUCKETS_ORDER } from "./reference-data";
import type {
  ALMBucketRow,
  ALMResult,
  DurationRow,
  LiabilityBucket,
} from "./types";
import { assignBucket, weightedAvg } from "./helpers";

export function computeALMGap(
  durationRows: DurationRow[],
  liabilities: LiabilityBucket[],
): ALMResult {
  const assetMap: Record<string, { value: number; weightedDur: number }> = {};
  for (const b of MATURITY_BUCKETS_ORDER) {
    assetMap[b] = { value: 0, weightedDur: 0 };
  }
  for (const d of durationRows) {
    const b = assignBucket(d.remainingTenor);
    if (!assetMap[b]) continue;
    assetMap[b].value += d.bsValueNGN;
    assetMap[b].weightedDur += d.modifiedDur * d.bsValueNGN;
  }
  const liabMap = new Map(liabilities.map((l) => [l.bucket, l]));

  let totalAsset = 0;
  let totalLiab = 0;
  let totalAssetDV01 = 0;
  let totalLiabDV01 = 0;
  const buckets: ALMBucketRow[] = MATURITY_BUCKETS_ORDER.map((b) => {
    const av = assetMap[b].value;
    const ad = av > 0 ? assetMap[b].weightedDur / av : 0;
    const lb = liabMap.get(b);
    const lv = lb?.valueNGN ?? 0;
    const ld = lb?.duration ?? 0;
    totalAsset += av;
    totalLiab += lv;
    totalAssetDV01 += av * ad * 0.0001;
    totalLiabDV01 += lv * ld * 0.0001;
    return {
      bucket: b,
      assetValue: av,
      assetDur: ad,
      liabValue: lv,
      liabDur: ld,
      gap: av - lv,
      durGap: ad - ld,
    };
  });

  const wtdAssetDur = weightedAvg(
    durationRows.map((d) => d.modifiedDur),
    durationRows.map((d) => d.bsValueNGN),
  );
  const totalLiabValue = liabilities.reduce((s, l) => s + l.valueNGN, 0);
  const wtdLiabDur =
    totalLiabValue > 0
      ? liabilities.reduce((s, l) => s + l.duration * l.valueNGN, 0) /
        totalLiabValue
      : 0;

  return {
    buckets,
    totalAssetNGN: totalAsset,
    totalLiabNGN: totalLiab,
    wtdAssetDur,
    wtdLiabDur,
    durationGap: wtdAssetDur - wtdLiabDur,
    dv01Gap: totalAssetDV01 - totalLiabDV01,
  };
}
