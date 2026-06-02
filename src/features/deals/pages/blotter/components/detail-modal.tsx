import { RowDetailModal } from "../../../../../components/shared/row-detail-modal";
import { Badge } from "../../../../../components/shared/badge";
import { AcronymTip } from "../../../../../components/shared/acronym-tip";
import {
  fmtCompact,
  fmtPct,
  fmtDate,
} from "../../../../portfolio/engine/book-compute";
import { CLF_COLOR } from "../config";
import type { Row } from "../types";

export function BlotterDetailModal({
  selected,
  onClose,
}: {
  selected: Row | null;
  onClose: () => void;
}) {
  return (
    <RowDetailModal
      isOpen={selected !== null}
      onClose={onClose}
      title={selected?.name ?? "Instrument Detail"}
      subtitle={selected?.id}
      fields={
        selected
          ? [
              { label: "ID", value: selected.id },
              {
                label: "Type",
                value: (
                  <Badge variant="neutral" size="sm">
                    {selected.instrumentType}
                  </Badge>
                ),
              },
              { label: "Issuer / Counterparty", value: selected.issuer },
              {
                label: "Classification",
                value: (
                  <AcronymTip term={selected.classification}>
                    <Badge
                      variant={CLF_COLOR[selected.classification]}
                      size="sm"
                    >
                      {selected.classification}
                    </Badge>
                  </AcronymTip>
                ),
              },
              { label: "Currency", value: selected.currency },
              { label: "Face Value", value: fmtCompact(selected.faceValue) },
              {
                label: "Coupon Rate",
                value:
                  selected.couponRate > 0
                    ? fmtPct(selected.couponRate)
                    : "Discount",
              },
              { label: "Coupon Frequency", value: selected.couponFrequency },
              {
                label: "Purchase Date",
                value: fmtDate(selected.purchaseDate),
              },
              {
                label: "Maturity Date",
                value: fmtDate(selected.maturityDate),
              },
              { label: "Stage", value: selected.impairmentStage ?? "N/A" },
              {
                label: "Status",
                value: (
                  <Badge variant="performing" size="sm">
                    {selected.status}
                  </Badge>
                ),
              },
            ]
          : []
      }
    />
  );
}
