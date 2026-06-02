import type { Security } from "./types";
import { MOODY_RR } from "./reference-data";

function bucketCorporateForRR(rating: string): string {
  if (rating === "Aaa") return "Aaa";
  if (rating.startsWith("C")) return "Caa-C";
  const trimmed = rating.replace(/\d+$/, "");
  if (MOODY_RR[trimmed]) return trimmed;
  return "Baa";
}

export function computeLGD(
  s: Security,
  ratingEq: string,
  sovereignRR: number,
): { lgd: number[]; bucket: string } {
  if (s.assetSpecification !== "Corporate") {
    const lgd = Array(5).fill(1 - sovereignRR);
    return { lgd, bucket: "Sovereign" };
  }
  const bucket = bucketCorporateForRR(ratingEq);
  const rr = MOODY_RR[bucket] ?? MOODY_RR.Baa;
  const lgd = rr.map((r) => 1 - r / 100);
  return { lgd, bucket };
}
