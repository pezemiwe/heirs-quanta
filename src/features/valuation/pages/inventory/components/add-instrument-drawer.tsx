import { useState } from "react";
import { X } from "lucide-react";
import { useValuation } from "../../../store";
import { ALL_TYPES, inputCls } from "../config";
import { Field } from "./field";
import type {
  Classification,
  CouponFrequency,
  Currency,
  IFRS13Level,
  ImpairmentStage,
  Instrument,
  InstrumentType,
} from "../types";

export function AddInstrumentDrawer({ onClose }: { onClose: () => void }) {
  const v = useValuation();
  const [draft, setDraft] = useState<Instrument>({
    id: `INV-${String(Math.floor(Math.random() * 900) + 100)}`,
    name: "",
    instrumentType: "Corporate Bond",
    issuer: "",
    sector: "",
    classification: "AC",
    ifrs13Level: "L2",
    currency: "NGN",
    faceValue: 100_000_000,
    purchasePrice: 97_000_000,
    purchaseDate: new Date().toISOString().slice(0, 10),
    maturityDate: new Date(Date.now() + 5 * 365 * 86_400_000)
      .toISOString()
      .slice(0, 10),
    couponRate: 0.15,
    couponFrequency: "Semi",
    status: "Active",
    impairmentStage: "Stage 1",
    eclProvision: 0,
  });
  const [err, setErr] = useState<string | null>(null);

  const save = () => {
    if (!draft.id || !draft.name) {
      setErr("ID and Name are required.");
      return;
    }
    if (v.instruments.some((i) => i.id === draft.id)) {
      setErr("Instrument ID already exists.");
      return;
    }
    v.addInstrument(draft);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-dark-gray">
              Add Instrument
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Manually add a new fixed-income holding to the portfolio.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {err && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-primary">
            {err}
          </div>
        )}

        <div className="space-y-3">
          <Field label="Instrument ID">
            <input
              value={draft.id}
              onChange={(e) => setDraft({ ...draft, id: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Name">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Instrument Type">
              <select
                value={draft.instrumentType}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    instrumentType: e.target.value as InstrumentType,
                  })
                }
                className={inputCls}
              >
                {ALL_TYPES.filter((t) => t !== "All").map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Classification">
              <select
                value={draft.classification}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    classification: e.target.value as Classification,
                  })
                }
                className={inputCls}
              >
                <option>AC</option>
                <option>FVOCI</option>
                <option>FVTPL</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Issuer">
              <input
                value={draft.issuer}
                onChange={(e) => setDraft({ ...draft, issuer: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Sector">
              <input
                value={draft.sector}
                onChange={(e) => setDraft({ ...draft, sector: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Currency">
              <select
                value={draft.currency}
                onChange={(e) =>
                  setDraft({ ...draft, currency: e.target.value as Currency })
                }
                className={inputCls}
              >
                <option>NGN</option>
                <option>USD</option>
                <option>GBP</option>
                <option>EUR</option>
              </select>
            </Field>
            <Field label="IFRS 13 Level">
              <select
                value={draft.ifrs13Level}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    ifrs13Level: e.target.value as IFRS13Level,
                  })
                }
                className={inputCls}
              >
                <option>L1</option>
                <option>L2</option>
                <option>L3</option>
              </select>
            </Field>
            <Field label="Frequency">
              <select
                value={draft.couponFrequency}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    couponFrequency: e.target.value as CouponFrequency,
                  })
                }
                className={inputCls}
              >
                <option>Annual</option>
                <option>Semi</option>
                <option>Quarterly</option>
                <option>Monthly</option>
                <option>Zero</option>
                <option>N/A</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Face Value">
              <input
                type="number"
                value={draft.faceValue}
                onChange={(e) =>
                  setDraft({ ...draft, faceValue: Number(e.target.value) })
                }
                className={inputCls}
              />
            </Field>
            <Field label="Purchase Price">
              <input
                type="number"
                value={draft.purchasePrice}
                onChange={(e) =>
                  setDraft({ ...draft, purchasePrice: Number(e.target.value) })
                }
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchase Date">
              <input
                type="date"
                value={draft.purchaseDate}
                onChange={(e) =>
                  setDraft({ ...draft, purchaseDate: e.target.value })
                }
                className={inputCls}
              />
            </Field>
            <Field label="Maturity Date">
              <input
                type="date"
                value={draft.maturityDate}
                onChange={(e) =>
                  setDraft({ ...draft, maturityDate: e.target.value })
                }
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Coupon Rate (decimal)">
              <input
                type="number"
                step="0.0001"
                value={draft.couponRate}
                onChange={(e) =>
                  setDraft({ ...draft, couponRate: Number(e.target.value) })
                }
                className={inputCls}
              />
            </Field>
            <Field label="Impairment Stage">
              <select
                value={draft.impairmentStage}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    impairmentStage: e.target.value as ImpairmentStage,
                  })
                }
                className={inputCls}
              >
                <option>Stage 1</option>
                <option>Stage 2</option>
                <option>Stage 3</option>
                <option>N/A</option>
              </select>
            </Field>
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
            onClick={save}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
          >
            Add Instrument
          </button>
        </div>
      </div>
    </div>
  );
}
