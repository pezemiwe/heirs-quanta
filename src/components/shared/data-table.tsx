import type { ReactNode } from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { EmptyState } from "./empty-state";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type DataTableColumn<T> = {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (row: T, index: number) => ReactNode;
  align?: "left" | "center" | "right";
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, i: number) => string | number;
  emptyMessage?: string;
  emptyDescription?: string;
  loading?: boolean;
  striped?: boolean;
  className?: string;
};

export const DataTable = <T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data",
  emptyDescription,
  loading = false,
  striped = true,
  className,
}: DataTableProps<T>) => {
  const alignCls = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-xl border border-border",
        className,
      )}
    >
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  "border-b border-border bg-deep-red px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white first:rounded-tl-xl last:rounded-tr-xl",
                  alignCls[col.align ?? "left"],
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={columns.length} className="px-4 py-3">
                  <div className="shimmer-skeleton h-5 rounded-md" />
                </td>
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState
                  preset="no-data"
                  title={emptyMessage}
                  description={emptyDescription}
                  compact
                />
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={keyExtractor(row, i)}
                className={cn(
                  "border-b border-border last:border-0 transition-colors hover:bg-pale-red/40",
                  striped && i % 2 !== 0 && "bg-[#F8F8F8]",
                )}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn(
                      "px-4 py-3 text-dark-gray/80",
                      alignCls[col.align ?? "left"],
                    )}
                  >
                    {col.render
                      ? col.render(row, i)
                      : (row[col.key as keyof T] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
