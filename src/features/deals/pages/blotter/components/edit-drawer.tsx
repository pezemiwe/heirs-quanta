import { useState } from "react";
import { X } from "lucide-react";
import type { Instrument } from "../../../../portfolio/engine/book-compute";
import { inputCls } from "../config";
import type { Row } from "../types";

export function EditBlotterDrawer({
  row,
  onSave,
  onClose,
}: {
  row: Row;
  onSave: (patch: Partial<Instrument>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(String(row.name ?? ""));
  const [issuer, setIssuer] = useState(String(row.issuer ?? ""));
  const [faceValue, setFaceValue] = useState(Number(row.faceValue ?? 0));
  const [couponRate, setCouponRate] = useState(Number(row.couponRate ?? 0));
  const [stage, setStage] = useState(String(row.impairmentStage ?? "Stage 1"));
  const [status, setStatus] = useState(String(row.status ?? "Active"));

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-dark-gray">
              Edit Trade
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">{String(row.id)}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Instrument Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Issuer / Counterparty
            </label>
            <input
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Face Value (NGN)
              </label>
              <input
                type="number"
                value={faceValue}
                onChange={(e) => setFaceValue(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Coupon Rate
              </label>
              <input
                type="number"
                step="0.001"
                value={couponRate}
                onChange={(e) => setCouponRate(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Impairment Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className={inputCls}
              >
                <option>Stage 1</option>
                <option>Stage 2</option>
                <option>Stage 3</option>
                <option>N/A</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputCls}
              >
                <option>Active</option>
                <option>Matured</option>
                <option>Disposed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                name,
                issuer,
                faceValue,
                couponRate,
                impairmentStage: stage as never,
                status: status as never,
              })
            }
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
