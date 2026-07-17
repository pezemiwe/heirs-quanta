import { useMemo } from "react";
import { Scale, AlertTriangle, CheckCircle2, FileWarning } from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import { useWorkflow } from "../../workflow/store";
import { useInstrumentBook } from "../../../context/instrument-book";
import type { RegisterEntry } from "../../workflow/types";
import type { Currency, Instrument } from "../../valuation/engine/types";
import { fmtCompact, fmtDate } from "../../portfolio/engine/book-compute";

/* ─────────────────────────────────────────────────────────────
   GL Reconciliation - Subledger (deal-slip driven register) vs
   Instrument Book (the "GL" that Valuation / Duration Risk / IFRS 9 /
   Accounting actually read from). Pure read/aggregation over existing
   state - no new store, no persistence.
   ───────────────────────────────────────────────────────────── */

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
};

const CURRENCY_ORDER: Currency[] = ["NGN", "USD", "GBP", "EUR"];

interface CurrencyRow {
  currency: Currency;
  subCount: number;
  subFace: number;
  glCount: number;
  glFace: number;
}
type CurrencyTableRow = CurrencyRow & Record<string, unknown>;

interface BreakRow {
  id: string;
  name: string;
  issuer: string;
  faceValue: number;
  currency: Currency;
  source: string;
}
type BreakTableRow = BreakRow & Record<string, unknown>;

type OrphanTableRow = RegisterEntry & Record<string, unknown>;

function signedCompact(n: number, ccy: string): string {
  if (n === 0) return fmtCompact(0, ccy);
  const prefix = n > 0 ? "+" : "";
  return `${prefix}${fmtCompact(n, ccy)}`;
}

export function Reconciliation() {
  const { register } = useWorkflow();
  const { instruments } = useInstrumentBook();

  const {
    activeRegister,
    withoutSlip,
    orphaned,
    currencyRows,
    subCount,
    glCount,
    countVariance,
    ngnGlFace,
  } = useMemo(() => {
    const activeRegister = register.filter((r) => r.status === "Active");

    const instrumentsById = new Map(instruments.map((i) => [i.id, i]));
    const activeRegisterByInstrumentId = new Map(
      activeRegister.map((r) => [r.instrumentId, r]),
    );

    // Instruments in the book with no corresponding active register entry -
    // these bypassed the deal-slip workflow entirely (typically a bulk
    // workbook upload of historical opening balances).
    const withoutSlip: Instrument[] = instruments.filter(
      (inst) => !activeRegisterByInstrumentId.has(inst.id),
    );

    // Active register entries whose instrument no longer exists in the book -
    // should not normally happen; flags a data-integrity gap.
    const orphaned: RegisterEntry[] = activeRegister.filter(
      (r) => !instrumentsById.has(r.instrumentId),
    );

    // Per-currency totals - face values are never summed across currencies.
    const rowByCcy = new Map<Currency, CurrencyRow>();
    const ensure = (ccy: Currency): CurrencyRow => {
      let row = rowByCcy.get(ccy);
      if (!row) {
        row = { currency: ccy, subCount: 0, subFace: 0, glCount: 0, glFace: 0 };
        rowByCcy.set(ccy, row);
      }
      return row;
    };
    for (const r of activeRegister) {
      const row = ensure(r.currency);
      row.subCount += 1;
      row.subFace += r.faceValue;
    }
    for (const inst of instruments) {
      const row = ensure(inst.currency);
      row.glCount += 1;
      row.glFace += inst.faceValue;
    }
    const currencyRows: CurrencyRow[] = CURRENCY_ORDER.filter((c) =>
      rowByCcy.has(c),
    ).map((c) => rowByCcy.get(c)!);

    const ngnGlFace = instruments
      .filter((i) => i.currency === "NGN")
      .reduce((s, i) => s + i.faceValue, 0);

    return {
      activeRegister,
      withoutSlip,
      orphaned,
      currencyRows,
      subCount: activeRegister.length,
      glCount: instruments.length,
      countVariance: instruments.length - activeRegister.length,
      ngnGlFace,
    };
  }, [register, instruments]);

  const totalBreaks = withoutSlip.length + orphaned.length;

  const currencyCols: DataTableColumn<CurrencyTableRow>[] = [
    { key: "currency", header: "Currency", width: "100px" },
    { key: "subCount", header: "Subledger Count", align: "right" },
    {
      key: "subFace",
      header: "Subledger Face Value",
      align: "right",
      render: (r) => fmtCompact(r.subFace, CURRENCY_SYMBOLS[r.currency]),
    },
    { key: "glCount", header: "GL Count", align: "right" },
    {
      key: "glFace",
      header: "GL Face Value",
      align: "right",
      render: (r) => fmtCompact(r.glFace, CURRENCY_SYMBOLS[r.currency]),
    },
    {
      key: "countVariance" as never,
      header: "Count Variance",
      align: "right",
      render: (r) => {
        const v = r.glCount - r.subCount;
        return (
          <span
            className={
              v === 0 ? "text-dark-gray/60" : "font-semibold text-amber-600"
            }
          >
            {v > 0 ? `+${v}` : v}
          </span>
        );
      },
    },
    {
      key: "faceVariance" as never,
      header: "Face Value Variance",
      align: "right",
      render: (r) => {
        const v = r.glFace - r.subFace;
        return (
          <span
            className={
              v === 0 ? "text-dark-gray/60" : "font-semibold text-amber-600"
            }
          >
            {signedCompact(v, CURRENCY_SYMBOLS[r.currency])}
          </span>
        );
      },
    },
  ];

  const withoutSlipCols: DataTableColumn<BreakTableRow>[] = [
    { key: "id", header: "ID", width: "100px", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "name", header: "Name" },
    { key: "issuer", header: "Issuer" },
    {
      key: "faceValue",
      header: "Face Value",
      align: "right",
      render: (r) => fmtCompact(r.faceValue, CURRENCY_SYMBOLS[r.currency]),
    },
    { key: "currency", header: "CCY", width: "70px" },
    {
      key: "source",
      header: "Source",
      render: (r) => (
        <Badge variant="warning" size="sm">
          {r.source}
        </Badge>
      ),
    },
  ];

  const orphanCols: DataTableColumn<OrphanTableRow>[] = [
    { key: "id", header: "Register Ref", width: "120px", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "dealSlipId", header: "Deal Slip", render: (r) => <span className="font-mono text-xs">{r.dealSlipId}</span> },
    { key: "instrumentId", header: "Missing Instrument ID", render: (r) => <span className="font-mono text-xs">{r.instrumentId}</span> },
    { key: "instrumentName", header: "Instrument" },
    { key: "issuer", header: "Issuer" },
    {
      key: "faceValue",
      header: "Face Value",
      align: "right",
      render: (r) => fmtCompact(r.faceValue, CURRENCY_SYMBOLS[r.currency]),
    },
    { key: "settledAt", header: "Settled", render: (r) => fmtDate(r.settledAt) },
  ];

  const withoutSlipRows: BreakTableRow[] = withoutSlip.map((inst) => ({
    id: inst.id,
    name: inst.name,
    issuer: inst.issuer,
    faceValue: inst.faceValue,
    currency: inst.currency,
    source: inst.sourceFileName ?? inst.importBatchLabel ?? "Unknown",
  }));

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          GL Reconciliation - Subledger vs Instrument Book
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Reconciles the deal-slip-driven investment register (subledger) against the shared instrument book
          (the "GL" that Valuation, Duration Risk, IFRS 9, and Accounting report off) and surfaces any mismatches.
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Subledger - Active Positions"
          value={String(subCount)}
          subtitle="Register entries with status Active"
          variant="default"
        />
        <StatCard
          title="GL - Instrument Book"
          value={String(glCount)}
          subtitle="All instruments in the shared book"
          variant="default"
        />
        <StatCard
          title="Count Variance (GL − Subledger)"
          value={countVariance > 0 ? `+${countVariance}` : String(countVariance)}
          subtitle="Positive = GL holds instruments the subledger doesn't"
          variant={countVariance !== 0 ? "warning" : "highlight"}
        />
        <StatCard
          title="Instruments Without a Deal Slip"
          value={String(withoutSlip.length)}
          subtitle="Bypassed the deal-slip workflow"
          variant={withoutSlip.length > 0 ? "danger" : "highlight"}
        />
      </StatCardGrid>

      <SectionCard
        title="Face Value Reconciliation by Currency"
        description="Subledger vs GL, grouped by currency - totals are never mixed across currencies"
      >
        <DataTable<CurrencyTableRow>
          columns={currencyCols}
          data={currencyRows as CurrencyTableRow[]}
          keyExtractor={(r) => r.currency}
          emptyMessage="No instruments in either the subledger or the instrument book yet"
        />
      </SectionCard>

      {totalBreaks === 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Subledger and GL are fully reconciled - {glCount} instrument{glCount === 1 ? "" : "s"},{" "}
              {fmtCompact(ngnGlFace)} <span className="font-normal text-emerald-700/70">(NGN instruments)</span>
            </p>
            <p className="mt-1 text-sm text-emerald-900/80">
              Every instrument in the book has a matching active deal-slip register entry, and every active register
              entry resolves to an instrument in the book. See the per-currency breakdown above for non-NGN totals.
            </p>
          </div>
        </div>
      ) : (
        <>
          <SectionCard
            title="Breaks - Instruments Without a Deal Slip"
            description="Instruments present in the instrument book with no active deal-slip register entry of record - typically bulk-imported opening balances that bypassed the deal-slip workflow"
          >
            <DataTable<BreakTableRow>
              columns={withoutSlipCols}
              data={withoutSlipRows}
              keyExtractor={(r) => r.id}
              emptyMessage="No instruments are missing a deal slip"
              pageSize={20}
            />
          </SectionCard>

          {orphaned.length > 0 ? (
            <SectionCard
              title="Breaks - Orphaned Register Entries"
              description="Active register entries whose instrument no longer exists in the book - should not normally happen; flagged as a data-integrity issue"
            >
              <DataTable<OrphanTableRow>
                columns={orphanCols}
                data={orphaned as OrphanTableRow[]}
                keyExtractor={(r) => r.id}
                emptyMessage="No orphaned register entries"
                pageSize={20}
              />
            </SectionCard>
          ) : (
            <p className="flex items-center gap-2 text-xs text-dark-gray/50">
              <FileWarning className="h-3.5 w-3.5" /> No orphaned register entries.
            </p>
          )}
        </>
      )}

      {totalBreaks > 0 && (
        <p className="flex items-center gap-2 text-xs text-dark-gray/50">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          {totalBreaks} total break{totalBreaks === 1 ? "" : "s"} between the subledger and the GL.
        </p>
      )}
    </div>
  );
}
