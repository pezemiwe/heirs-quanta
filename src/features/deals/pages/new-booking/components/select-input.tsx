import type { SelectOption } from "../types";

export function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray outline-none focus:border-primary focus:ring-1 focus:ring-primary"
    >
      <option value="">— Select —</option>
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value;
        const lbl = typeof o === "string" ? o : o.label;
        return (
          <option key={val} value={val}>
            {lbl}
          </option>
        );
      })}
    </select>
  );
}
