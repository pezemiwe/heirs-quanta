import type { Security } from "./types";
import { RATING_SCALE } from "./reference-data";

function findScaleRow(
  rating: string,
  agency: string,
): (typeof RATING_SCALE)[number] | undefined {
  const colKey = ((): keyof (typeof RATING_SCALE)[number] | null => {
    const a = (agency || "").toLowerCase();
    if (a.includes("moody")) return "Moody";
    if (a.includes("s&p") || a.includes("sp") || a === "s and p") return "SP";
    if (a.includes("fitch")) return "Fitch";
    if (a.includes("gcr")) return "GCR";
    if (a.includes("agusto")) return "Agusto";
    if (a.includes("datapro")) return "Datapro";
    return null;
  })();
  if (!colKey) return undefined;
  return RATING_SCALE.find((r) => r[colKey] === rating);
}

export function mapRating(s: Security): string {
  const r = s.ratingAtReportingDate;
  const ag = s.ratingAgencyAtReportingDate;
  const targetCol: "Moody" | "SP" =
    s.assetSpecification === "Corporate" ? "Moody" : "SP";

  const agLow = (ag || "").toLowerCase();
  if (targetCol === "Moody" && agLow.includes("moody")) return r;
  if (targetCol === "SP" && (agLow.includes("s&p") || agLow.includes("sp")))
    return r;

  const row = findScaleRow(r, ag);
  if (!row) return r;
  return row[targetCol];
}
