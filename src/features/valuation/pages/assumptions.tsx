import { useState } from "react";
import { useValuation } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { fmtNumber, fmtPct } from "../utils";

export function ValuationAssumptions() {
  const v = useValuation();
  const a = v.assumptions;

  const update = (patch: Partial<typeof a>) =>
    v.setAssumptions({ ...a, ...patch });

  const [isFetchingFx, setIsFetchingFx] = useState(false);

  const handleFetchFx = async () => {
    setIsFetchingFx(true);
    try {
      const [usdRes, gbpRes, eurRes] = await Promise.all([
        fetch("https://api.frankfurter.dev/v2/rate/USD/NGN?providers=CBN").then(r => r.json()),
        fetch("https://api.frankfurter.dev/v2/rate/GBP/NGN?providers=CBN").then(r => r.json()),
        fetch("https://api.frankfurter.dev/v2/rate/EUR/NGN?providers=CBN").then(r => r.json())
      ]);

      const patch: Partial<typeof a> = {};
      if (usdRes?.rate) patch.fxUSD = usdRes.rate;
      if (gbpRes?.rate) patch.fxGBP = gbpRes.rate;
      if (eurRes?.rate) patch.fxEUR = eurRes.rate;
      
      if (Object.keys(patch).length > 0) {
        update(patch);
      } else {
        alert("No rates returned from the provider.");
      }
    } catch (e) {
      console.error("Failed to fetch FX rates", e);
      alert("Failed to fetch FX rates. See console for details.");
    } finally {
      setIsFetchingFx(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">
          Valuation Assumptions
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Yield curves, FX rates, and global settings used by the engine.
        </p>
      </div>

      <SectionCard title="Valuation Date">
        <input
          type="date"
          value={a.valuationDate}
          onChange={(e) => update({ valuationDate: e.target.value })}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </SectionCard>

      <SectionCard 
        title="FX Rates (vs NGN)" 
        actions={
          <button
            onClick={handleFetchFx}
            disabled={isFetchingFx}
            className="flex items-center gap-1.5 rounded-lg bg-surface border border-border px-3 py-1.5 text-xs font-medium text-dark-gray shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          >
            {isFetchingFx ? (
              <>
                <svg className="h-3 w-3 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Fetching...
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Sync with CBN Live
              </>
            )}
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <FxField
            label="USD"
            value={a.fxUSD}
            onChange={(n) => update({ fxUSD: n })}
          />
          <FxField
            label="GBP"
            value={a.fxGBP}
            onChange={(n) => update({ fxGBP: n })}
          />
          <FxField
            label="EUR"
            value={a.fxEUR}
            onChange={(n) => update({ fxEUR: n })}
          />
        </div>
      </SectionCard>

      <SectionCard title="Credit Spreads">
        <div className="grid gap-4 sm:grid-cols-3">
          <PctField
            label="Corporate Spread"
            value={a.corporateSpread}
            onChange={(n) => update({ corporateSpread: n })}
          />
          <PctField
            label="State Bond Spread"
            value={a.stateSpread}
            onChange={(n) => update({ stateSpread: n })}
          />
          <PctField
            label="OCI Recycling Tax Rate"
            value={a.taxRate}
            onChange={(n) => update({ taxRate: n })}
          />
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="FGN Sovereign Yield Curve">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2 text-left">Tenor (yrs)</th>
                <th className="py-2 text-right">Yield</th>
              </tr>
            </thead>
            <tbody>
              {a.fgnYieldCurve.map((p, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td className="py-1.5 font-mono">{p.tenorYears}</td>
                  <td className="py-1.5 text-right font-mono">
                    {fmtPct(p.yield, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
        <SectionCard title="USD Benchmark Yield Curve">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2 text-left">Tenor (yrs)</th>
                <th className="py-2 text-right">Yield</th>
              </tr>
            </thead>
            <tbody>
              {a.usdYieldCurve.map((p, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td className="py-1.5 font-mono">{p.tenorYears}</td>
                  <td className="py-1.5 text-right font-mono">
                    {fmtPct(p.yield, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      </div>
    </div>
  );
}

function FxField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">
        {label} / NGN
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <span className="mt-1 block text-xs text-gray-400">
        1 {label} = ₦{fmtNumber(value, 2)}
      </span>
    </label>
  );
}

function PctField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">
        {label}
      </span>
      <input
        type="number"
        step="0.0001"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <span className="mt-1 block text-xs text-gray-400">
        ≈ {fmtPct(value, 2)}
      </span>
    </label>
  );
}
