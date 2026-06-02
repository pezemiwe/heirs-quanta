import type { FormState } from "../types";
import { FieldLabel } from "./field-label";
import { TextInput } from "./text-input";

export function DatesSection({
  form,
  set,
}: {
  form: FormState;
  set: (field: keyof FormState) => (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-dark-gray">Dates</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <FieldLabel>Trade / Purchase Date *</FieldLabel>
          <TextInput
            value={form.purchaseDate}
            onChange={set("purchaseDate")}
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div>
          <FieldLabel>Settlement Date</FieldLabel>
          <TextInput
            value={form.settlementDate}
            onChange={set("settlementDate")}
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div>
          <FieldLabel>Maturity Date</FieldLabel>
          <TextInput
            value={form.maturityDate}
            onChange={set("maturityDate")}
            placeholder="YYYY-MM-DD"
          />
        </div>
      </div>
    </div>
  );
}
