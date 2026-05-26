import { useMemo, useState } from "react";
import { SectionCard } from "../../../components/shared/section-card";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import {
  MOODY_PD_CUM,
  SP_SOV_FCY_PD_CUM,
  SP_SOV_LCY_PD_CUM,
} from "../engine/reference-data";

type Table = "Moody Corporate" | "S&P Sovereign FCY" | "S&P Sovereign LCY";

const TABLES: Record<Table, Record<string, number[]>> = {
  "Moody Corporate": MOODY_PD_CUM,
  "S&P Sovereign FCY": SP_SOV_FCY_PD_CUM,
  "S&P Sovereign LCY": SP_SOV_LCY_PD_CUM,
};

interface Row extends Record<string, unknown> {
  rating: string;
  values: number[];
}

export function IFRS9PDTables() {
  const [active, setActive] = useState<Table>("Moody Corporate");
  const table = TABLES[active];

  const rows = useMemo<Row[]>(
    () =>
      Object.entries(table).map(([rating, values]) => ({
        rating,
        values,
      })),
    [table],
  );

  const horizons = rows[0]?.values.length ?? 0;

  const cols: DataTableColumn<Row>[] = [
    {
      key: "rating",
      header: "Rating",
      width: "100px",
      render: (r) => (
        <span className="font-mono font-semibold text-dark-gray">
          {r.rating}
        </span>
      ),
    },
    ...Array.from({ length: horizons }).map<DataTableColumn<Row>>((_, i) => ({
      key: `y${i + 1}`,
      header: `Y${i + 1}`,
      align: "right" as const,
      render: (r) => (
        <span className="font-mono text-xs">{r.values[i].toFixed(2)}%</span>
      ),
    })),
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          PD Term Structures
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Cumulative probability of default by rating bucket and horizon (year).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TABLES) as Table[]).map((k) => (
          <button
            key={k}
            onClick={() => setActive(k)}
            className={
              k === active
                ? "rounded-lg border border-primary bg-pale-red px-3 py-1.5 text-xs font-medium text-deep-red"
                : "rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-dark-gray/70 hover:border-primary/40 hover:bg-pale-red/40"
            }
          >
            {k}
          </button>
        ))}
      </div>

      <SectionCard noPadding>
        <DataTable
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.rating}
          emptyMessage="No PD data"
        />
      </SectionCard>
    </div>
  );
}
