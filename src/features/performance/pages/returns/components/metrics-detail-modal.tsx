import { Badge } from "../../../../../components/shared/badge";
import { RowDetailModal } from "../../../../../components/shared/row-detail-modal";
import { fmtPct } from "../../../../portfolio/engine/book-compute";
import type { MRow } from "../types";

interface MetricsDetailModalProps {
  selected: MRow | null;
  onClose: () => void;
}

export function MetricsDetailModal({
  selected,
  onClose,
}: MetricsDetailModalProps) {
  return (
    <RowDetailModal
      isOpen={selected !== null}
      onClose={onClose}
      title={selected?.name ?? "Return Metrics Detail"}
      subtitle={`${selected?.id} · ${selected?.classification}`}
      fields={
        selected
          ? [
              { label: "ID", value: selected.id },
              {
                label: "Classification",
                value: (
                  <Badge
                    variant={
                      selected.classification === "AC"
                        ? "info"
                        : selected.classification === "FVOCI"
                          ? "success"
                          : "warning"
                    }
                    size="sm"
                  >
                    {selected.classification}
                  </Badge>
                ),
              },
              {
                label: "Holding Period",
                value: `${selected.holdingYears.toFixed(2)} years`,
              },
              { label: "EIR (Booked)", value: fmtPct(selected.eir) },
              {
                label: "HPR (Total)",
                value: (
                  <span
                    className={
                      selected.hpr >= 0
                        ? "text-emerald-600 font-medium"
                        : "text-primary font-medium"
                    }
                  >
                    {(selected.hpr >= 0 ? "+" : "") + fmtPct(selected.hpr)}
                  </span>
                ),
              },
              {
                label: "TWR (Annualised)",
                value: (
                  <span
                    className={
                      selected.twr >= 0
                        ? "text-emerald-600 font-semibold"
                        : "text-primary font-semibold"
                    }
                  >
                    {(selected.twr >= 0 ? "+" : "") + fmtPct(selected.twr)}
                  </span>
                ),
              },
              { label: "MWR (EIR proxy)", value: fmtPct(selected.mwr) },
              {
                label: "Projected Return (1yr)",
                value: fmtPct(selected.projected),
              },
              {
                label: "Years to Maturity",
                value: `${selected.ytm.toFixed(2)}y`,
              },
            ]
          : []
      }
    />
  );
}
