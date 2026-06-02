import { Pencil, Trash2 } from "lucide-react";
import type { DataTableColumn } from "../../../../../components/shared/data-table";
import { Badge } from "../../../../../components/shared/badge";
import { AcronymTip } from "../../../../../components/shared/acronym-tip";
import {
  fmtCompact,
  fmtPct,
  fmtDate,
} from "../../../../portfolio/engine/book-compute";
import { CLF_COLOR } from "../config";
import type { Row } from "../types";

export function makeBlotterColumns(opts: {
  onEdit: (r: Row) => void;
  onDelete: (r: Row) => void;
}): DataTableColumn<Row>[] {
  const { onEdit, onDelete } = opts;
  return [
    { key: "id", header: "ID", width: "90px" },
    { key: "name", header: "Instrument Name" },
    {
      key: "instrumentType",
      header: "Type",
      render: (r) => (
        <Badge variant="neutral" size="sm">
          {r.instrumentType}
        </Badge>
      ),
    },
    { key: "issuer", header: "Issuer / Counterparty" },
    {
      key: "classification",
      header: "Classification",
      render: (r) => (
        <AcronymTip term={r.classification}>
          <Badge variant={CLF_COLOR[r.classification]} size="sm">
            {r.classification}
          </Badge>
        </AcronymTip>
      ),
    },
    { key: "currency", header: "CCY", width: "60px" },
    {
      key: "faceValue",
      header: "Face Value",
      align: "right",
      render: (r) => fmtCompact(r.faceValue),
    },
    {
      key: "couponRate",
      header: "Coupon",
      align: "right",
      render: (r) =>
        r.couponRate > 0 ? (
          fmtPct(r.couponRate)
        ) : (
          <span className="text-gray-400">Disc.</span>
        ),
    },
    { key: "couponFrequency", header: "Freq", width: "80px" },
    {
      key: "purchaseDate",
      header: "Purchase",
      render: (r) => fmtDate(r.purchaseDate),
    },
    {
      key: "maturityDate",
      header: "Maturity",
      render: (r) => fmtDate(r.maturityDate),
    },
    {
      key: "impairmentStage",
      header: "Stage",
      render: (r) => {
        const stage = r.impairmentStage ?? "N/A";
        const v =
          stage === "Stage 1"
            ? "stage1"
            : stage === "Stage 2"
              ? "stage2"
              : stage === "Stage 3"
                ? "stage3"
                : "neutral";
        return (
          <Badge variant={v as never} size="sm">
            {stage}
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant="performing" size="sm">
          {r.status}
        </Badge>
      ),
    },
    {
      key: "_actions" as never,
      header: "",
      width: "72px",
      render: (r) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(r)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(r)}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-danger"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];
}
