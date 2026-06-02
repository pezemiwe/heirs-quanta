import type { SecurityComputed } from "./types";

export function computeECLForRow(c: SecurityComputed): number {
  const { finalStage, ttm, ead, pd, lgd, meir, carryingAmountLcy } = c;
  if (finalStage === 3) {
    return carryingAmountLcy * lgd[0];
  }
  const horizon = finalStage === 1 ? Math.min(ttm, 12) : Math.min(ttm, 180);
  let ecl = 0;
  for (let m = 0; m < horizon; m++) {
    const pdM = pd[m] ?? 0;
    const lgdIdx = Math.min(
      Math.max(Math.ceil((m + 1) / 12) - 1, 0),
      lgd.length - 1,
    );
    const lgdM = lgd[lgdIdx];
    const eadM = ead[Math.min(m, ead.length - 1)];
    const disc = Math.pow(1 + meir, -(m + 1));
    ecl += pdM * lgdM * eadM * disc;
  }
  return ecl;
}
