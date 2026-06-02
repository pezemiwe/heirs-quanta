import { useMemo, useState } from "react";
import { BOOK_COMPUTED } from "../../../portfolio/engine/book-compute";
import type { MRow, ReturnsRow, Row } from "./types";
import { yearsSince, yearsToMaturity } from "./utils";
import { StatsOverview } from "./components/stats-overview";
import { OciTable } from "./components/oci-table";
import { FvtplTable } from "./components/fvtpl-table";
import { ReturnsDetailModal } from "./components/returns-detail-modal";
import { MetricsSection } from "./components/metrics-section";
import { MetricsDetailModal } from "./components/metrics-detail-modal";

export function Returns() {
  const [selected, setSelected] = useState<Row | null>(null);
  const [selectedM, setSelectedM] = useState<MRow | null>(null);

  const { ociRows, fvtplRows, ociTotal, fvtplTotal } = useMemo(() => {
    const oci: ReturnsRow[] = [];
    const fvtpl: ReturnsRow[] = [];

    for (const v of BOOK_COMPUTED.valuations) {
      if (v.instrument.classification === "FVOCI") {
        oci.push({
          id: v.instrument.id,
          name: v.instrument.name,
          type: v.instrument.instrumentType,
          classification: "FVOCI",
          fairValue: v.cleanFairValue,
          acCarrying: v.acCarryingValue,
          ociReserve: v.ociReserve,
          unrealisedGL: 0,
          returnPct:
            v.acCarryingValue > 0 ? v.ociReserve / v.acCarryingValue : 0,
        });
      } else if (v.instrument.classification === "FVTPL") {
        fvtpl.push({
          id: v.instrument.id,
          name: v.instrument.name,
          type: v.instrument.instrumentType,
          classification: "FVTPL",
          fairValue: v.cleanFairValue,
          acCarrying: v.acCarryingValue,
          ociReserve: 0,
          unrealisedGL: v.unrealisedGL,
          returnPct:
            v.acCarryingValue > 0 ? v.unrealisedGL / v.acCarryingValue : 0,
        });
      }
    }

    return {
      ociRows: oci.sort(
        (a, b) => Math.abs(b.ociReserve) - Math.abs(a.ociReserve),
      ) as Row[],
      fvtplRows: fvtpl.sort(
        (a, b) => Math.abs(b.unrealisedGL) - Math.abs(a.unrealisedGL),
      ) as Row[],
      ociTotal: oci.reduce((s, r) => s + r.ociReserve, 0),
      fvtplTotal: fvtpl.reduce((s, r) => s + r.unrealisedGL, 0),
    };
  }, []);

  const metricsRows = useMemo<MRow[]>(() => {
    return BOOK_COMPUTED.valuations
      .filter((v) => v.acCarryingValue > 0)
      .map((v) => {
        const holdYrs = yearsSince(v.instrument.purchaseDate);
        const cost = v.instrument.purchasePrice;
        const current = v.balanceSheetValueNGN;
        const eir = v.eir > 0 ? v.eir : v.instrument.couponRate;

        const hpr = cost > 0 ? (current - cost) / cost : 0;
        const twr = holdYrs > 0 ? Math.pow(1 + hpr, 1 / holdYrs) - 1 : eir;
        const mwr = eir;
        const ytmYears = yearsToMaturity(v.instrument.maturityDate);
        const projected = eir * Math.min(ytmYears, 1);

        return {
          id: v.instrument.id,
          name: v.instrument.name,
          type: v.instrument.instrumentType,
          classification: v.instrument.classification,
          eir,
          hpr,
          twr,
          mwr,
          projected,
          holdingYears: holdYrs,
          ytm: ytmYears,
        } as MRow;
      })
      .sort((a, b) => b.twr - a.twr);
  }, []);

  const totalBSV = BOOK_COMPUTED.totals.totalBSValueNGN;
  const wAvgTWR =
    metricsRows.reduce((s, r) => s + r.twr * (r.mwr || 0), 0) /
    (metricsRows.length || 1);
  const wAvgMWR =
    BOOK_COMPUTED.valuations.reduce(
      (s, v) =>
        s +
        (v.eir > 0 ? v.eir : v.instrument.couponRate) * v.balanceSheetValueNGN,
      0,
    ) / (totalBSV || 1);
  const wAvgProjected =
    metricsRows.reduce((s, r) => s + r.projected, 0) /
    (metricsRows.length || 1);

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Returns — P&amp;L Analysis
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Unrealised gains and losses by classification · Valuation date 28 May
          2026
        </p>
      </div>

      <StatsOverview
        ociTotal={ociTotal}
        ociRowsCount={ociRows.length}
        fvtplTotal={fvtplTotal}
        fvtplRowsCount={fvtplRows.length}
      />

      <OciTable rows={ociRows} onRowClick={setSelected} />

      <FvtplTable rows={fvtplRows} onRowClick={setSelected} />

      <ReturnsDetailModal
        selected={selected}
        onClose={() => setSelected(null)}
      />

      <MetricsSection
        rows={metricsRows}
        wAvgTWR={wAvgTWR}
        wAvgMWR={wAvgMWR}
        wAvgProjected={wAvgProjected}
        onRowClick={setSelectedM}
      />

      <MetricsDetailModal
        selected={selectedM}
        onClose={() => setSelectedM(null)}
      />
    </div>
  );
}
