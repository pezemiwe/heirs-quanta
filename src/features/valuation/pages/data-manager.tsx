import { useRef, useState } from "react";
import {
  Upload,
  Database,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Download,
} from "lucide-react";
import { useValuation } from "../store";
import { CSV_TEMPLATE_HEADER } from "../engine/parsing";
import { fmtNGN, ASSET_TYPE_LABEL } from "../utils";

export function ValuationDataManager() {
  const v = useValuation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const res = v.loadFromCSV(text, file.name);
      setStatus({
        ok: res.ok,
        msg: res.ok
          ? `Loaded ${res.count} assets from ${file.name}.`
          : `Failed to load. ${res.errors.length} error(s).`,
      });
    };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE_HEADER + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "valuation-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Data Manager</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload an asset register or start with the Heirs Holdings sample
          portfolio.
        </p>
      </div>

      {/* status banner */}
      {status && (
        <div
          className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${
            status.ok
              ? "border-teal-200 bg-teal-50 text-success"
              : "border-red-200 bg-red-50 text-danger"
          }`}
        >
          {status.ok ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {status.msg}
        </div>
      )}

      {/* action cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* upload */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pale-red text-primary">
              <Upload className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-dark-gray">Upload CSV</p>
              <p className="text-xs text-gray-400">
                Asset register from custodian or treasury
              </p>
            </div>
          </div>
          <p className="mb-4 text-xs text-gray-500">
            Required columns: id, name, type, sector, currency, holdingPct,
            carryingValue. Method-specific fields (DCF inputs, bond inputs,
            etc.) are optional per row.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
            >
              Choose file…
            </button>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-gray-600 hover:border-primary hover:text-primary"
            >
              <Download className="h-3.5 w-3.5" /> Template
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {/* sample */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pale-red text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-dark-gray">
                Load Sample Portfolio
              </p>
              <p className="text-xs text-gray-400">
                19 demonstration assets across the Group
              </p>
            </div>
          </div>
          <p className="mb-4 text-xs text-gray-500">
            Spans Heirs Insurance, Heirs Life, Heirs Oil & Gas (Tenoil),
            Transcorp Plc, Transcorp Hotels, United Capital, Africa Prudential,
            Heritage Bank, real estate, FGN bonds, T-Bills, and PE funds.
          </p>
          <button
            onClick={() => {
              v.loadSample();
              setStatus({
                ok: true,
                msg: "Sample Heirs Holdings portfolio loaded.",
              });
            }}
            className="rounded-lg border border-primary bg-pale-red px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-white"
          >
            Load sample data
          </button>
        </div>
      </div>

      {/* current dataset */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-dark-gray">
              Active Dataset
            </h2>
          </div>
          {v.hasData && (
            <button
              onClick={v.clear}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
        {!v.hasData ? (
          <p className="text-sm text-gray-400">
            No data loaded. Upload a CSV or load the sample portfolio above.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
              <div>
                <p className="text-xs text-gray-400">Source</p>
                <p className="text-xs font-medium text-dark-gray truncate">
                  {v.lastUploadedFile}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Assets</p>
                <p className="text-sm font-bold text-dark-gray">
                  {v.assets.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Carrying Value</p>
                <p className="text-sm font-bold text-dark-gray">
                  {fmtNGN(v.result.totalCarryingValue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Fair Value (Base)</p>
                <p className="text-sm font-bold text-primary">
                  {fmtNGN(v.result.totalFairValue)}
                </p>
              </div>
            </div>

            {/* breakdown */}
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Composition by asset type
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {v.result.byType.map((t) => (
                  <div
                    key={t.type}
                    className="rounded-lg border border-border bg-surface-muted p-3"
                  >
                    <p className="text-xs text-gray-500">
                      {ASSET_TYPE_LABEL[t.type]}
                    </p>
                    <p className="text-sm font-semibold">{t.count} assets</p>
                    <p className="text-xs text-primary">{fmtNGN(t.fair)}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* parse errors */}
      {v.parseErrors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="mb-2 text-sm font-semibold text-danger">
            {v.parseErrors.length} parse error(s)
          </p>
          <ul className="space-y-1 text-xs text-danger">
            {v.parseErrors.slice(0, 10).map((e, i) => (
              <li key={i}>
                Row {e.row}: {e.message}
              </li>
            ))}
            {v.parseErrors.length > 10 && (
              <li className="italic">…and {v.parseErrors.length - 10} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
