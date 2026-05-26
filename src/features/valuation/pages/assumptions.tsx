import { RotateCcw, Save } from "lucide-react";
import { useValuation } from "../store";
import { DEFAULT_ASSUMPTIONS } from "../engine/reference-data";
import { computeWACC } from "../engine";
import { fmtPct } from "../utils";
import type { Assumptions } from "../engine/types";

interface Field {
  key: keyof Assumptions;
  label: string;
  hint?: string;
  step: number;
  isPct?: boolean;
}

const WACC_FIELDS: Field[] = [
  {
    key: "riskFreeRate",
    label: "Risk-Free Rate",
    hint: "10Y FGN yield",
    step: 0.0005,
    isPct: true,
  },
  {
    key: "equityRiskPremium",
    label: "Equity Risk Premium",
    hint: "Mature market ERP",
    step: 0.0025,
    isPct: true,
  },
  {
    key: "countryRiskPremium",
    label: "Country Risk Premium",
    hint: "Nigeria CRP",
    step: 0.0025,
    isPct: true,
  },
  { key: "sizePremium", label: "Size Premium", step: 0.0025, isPct: true },
  {
    key: "costOfDebt",
    label: "Pre-tax Cost of Debt",
    step: 0.0025,
    isPct: true,
  },
  {
    key: "taxRate",
    label: "Tax Rate",
    hint: "Effective CIT",
    step: 0.005,
    isPct: true,
  },
  { key: "targetDebtRatio", label: "Target D/(D+E)", step: 0.01, isPct: true },
];

const MULTIPLE_FIELDS: Field[] = [
  { key: "peMultiple", label: "P/E Multiple", step: 0.1 },
  { key: "evEbitdaMultiple", label: "EV/EBITDA Multiple", step: 0.1 },
  { key: "pbMultiple", label: "P/B Multiple", step: 0.1 },
  { key: "psMultiple", label: "P/S Multiple", step: 0.1 },
];

const RE_FIELDS: Field[] = [
  {
    key: "defaultCapRate",
    label: "Default Cap Rate",
    step: 0.0025,
    isPct: true,
  },
];

const FX_FIELDS: Field[] = [
  { key: "fxUSD", label: "USD / NGN", step: 5 },
  { key: "fxGBP", label: "GBP / NGN", step: 5 },
  { key: "fxEUR", label: "EUR / NGN", step: 5 },
];

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500">
        {field.label}
      </label>
      {field.hint && <p className="text-xs text-gray-300">{field.hint}</p>}
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          step={field.step}
          value={field.isPct ? (value * 100).toFixed(2) : value}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(field.isPct ? n / 100 : n);
          }}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {field.isPct && <span className="text-xs text-gray-400">%</span>}
      </div>
    </div>
  );
}

export function ValuationAssumptions() {
  const v = useValuation();

  function patch(p: Partial<Assumptions>) {
    v.setAssumptions({ ...v.assumptions, ...p });
  }

  const waccPreview = computeWACC(v.assumptions, 1.0);

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Assumptions</h1>
          <p className="mt-1 text-sm text-gray-500">
            All assets are revalued automatically when any input below changes.
          </p>
        </div>
        <button
          onClick={() => v.setAssumptions(DEFAULT_ASSUMPTIONS)}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-gray-500 hover:border-primary hover:text-primary"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
        </button>
      </div>

      {/* WACC preview */}
      <div className="rounded-xl border border-primary/30 bg-pale-red/40 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Live WACC Preview (β=1.0)
        </p>
        <div className="mt-1 flex items-baseline gap-3">
          <p className="text-3xl font-bold text-primary">
            {fmtPct(waccPreview, 2)}
          </p>
          <p className="text-xs text-gray-500">
            = Cost of Equity{" "}
            {fmtPct(
              v.assumptions.riskFreeRate +
                v.assumptions.equityRiskPremium +
                v.assumptions.countryRiskPremium +
                v.assumptions.sizePremium,
              2,
            )}{" "}
            × {fmtPct(1 - v.assumptions.targetDebtRatio)} + After-tax Kd{" "}
            {fmtPct(v.assumptions.costOfDebt * (1 - v.assumptions.taxRate), 2)}{" "}
            × {fmtPct(v.assumptions.targetDebtRatio)}
          </p>
        </div>
      </div>

      {/* WACC build-up */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">
          Discount Rate Build-up
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WACC_FIELDS.map((f) => (
            <FieldRow
              key={f.key}
              field={f}
              value={v.assumptions[f.key] as number}
              onChange={(val) =>
                patch({ [f.key]: val } as Partial<Assumptions>)
              }
            />
          ))}
        </div>
      </div>

      {/* multiples */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-dark-gray">
          Trading Multiples
        </h2>
        <p className="mb-4 text-xs text-gray-400">
          Applied as cross-check for subsidiaries, listed equity, and unlisted
          strategic stakes.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MULTIPLE_FIELDS.map((f) => (
            <FieldRow
              key={f.key}
              field={f}
              value={v.assumptions[f.key] as number}
              onChange={(val) =>
                patch({ [f.key]: val } as Partial<Assumptions>)
              }
            />
          ))}
        </div>
      </div>

      {/* RE + FX */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            Real Estate
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {RE_FIELDS.map((f) => (
              <FieldRow
                key={f.key}
                field={f}
                value={v.assumptions[f.key] as number}
                onChange={(val) =>
                  patch({ [f.key]: val } as Partial<Assumptions>)
                }
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-dark-gray">
            FX Rates (vs NGN)
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {FX_FIELDS.map((f) => (
              <FieldRow
                key={f.key}
                field={f}
                value={v.assumptions[f.key] as number}
                onChange={(val) =>
                  patch({ [f.key]: val } as Partial<Assumptions>)
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* valuation date */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-dark-gray">Reporting</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Valuation Date
            </label>
            <input
              type="date"
              value={v.assumptions.valuationDate}
              onChange={(e) => patch({ valuationDate: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Reporting Currency
            </label>
            <select
              value={v.assumptions.reportingCurrency}
              onChange={(e) =>
                patch({
                  reportingCurrency: e.target
                    .value as Assumptions["reportingCurrency"],
                })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="NGN">NGN — Nigerian Naira</option>
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — Pound Sterling</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-mid-red">
          <Save className="h-4 w-4" /> Save Assumption Set
        </button>
      </div>
    </div>
  );
}
