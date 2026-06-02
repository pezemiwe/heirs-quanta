import { Badge } from "../../../../../components/shared/badge";
import { RowDetailModal } from "../../../../../components/shared/row-detail-modal";
import { fmtCompact, fmtPct } from "../../../../portfolio/engine/book-compute";
import type { Row } from "../types";

interface ReturnsDetailModalProps {
  selected: Row | null;
  onClose: () => void;
}

export function ReturnsDetailModal({
  selected,
  onClose,
}: ReturnsDetailModalProps) {
  return (
    <RowDetailModal
      isOpen={selected !== null}
      onClose={onClose}
      title={selected?.name ?? "Returns Detail"}
      subtitle={`${selected?.id} · ${selected?.classification}`}
      fields={
        selected
          ? [
              { label: "ID", value: selected.id },
              {
                label: "Type",
                value: (
                  <Badge variant="neutral" size="sm">
                    {selected.type}
                  </Badge>
                ),
              },
              { label: "Classification", value: selected.classification },
              {
                label: "AC Carrying / Cost Basis",
                value: fmtCompact(selected.acCarrying),
              },
              { label: "Fair Value", value: fmtCompact(selected.fairValue) },
              ...(selected.classification === "FVOCI"
                ? [
                    {
                      label: "OCI Reserve",
                      value: (
                        <span
                          className={
                            selected.ociReserve >= 0
                              ? "text-emerald-600 font-semibold"
                              : "text-primary font-semibold"
                          }
                        >
                          {fmtCompact(selected.ociReserve)}
                        </span>
                      ),
                    },
                  ]
                : [
                    {
                      label: "Unrealised G/(L)",
                      value: (
                        <span
                          className={
                            selected.unrealisedGL >= 0
                              ? "text-emerald-600 font-semibold"
                              : "text-primary font-semibold"
                          }
                        >
                          {fmtCompact(selected.unrealisedGL)}
                        </span>
                      ),
                    },
                  ]),
              {
                label: "Return %",
                value: (
                  <span
                    className={
                      selected.returnPct >= 0
                        ? "text-emerald-600"
                        : "text-primary"
                    }
                  >
                    {(selected.returnPct >= 0 ? "+" : "") +
                      fmtPct(selected.returnPct)}
                  </span>
                ),
              },
            ]
          : []
      }
    />
  );
}
