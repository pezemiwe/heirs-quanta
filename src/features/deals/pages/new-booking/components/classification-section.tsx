import type { FormState } from "../types";
import { CLASSIFICATIONS, IFRS13_LEVELS, CURRENCIES } from "../config";
import { FieldLabel } from "./field-label";
import { SelectInput } from "./select-input";

export function ClassificationSection({
  form,
  set,
}: {
  form: FormState;
  set: (field: keyof FormState) => (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-dark-gray">
        IFRS 9 Classification
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <FieldLabel>Classification *</FieldLabel>
          <SelectInput
            value={form.classification}
            onChange={set("classification")}
            options={CLASSIFICATIONS}
          />
        </div>
        <div>
          <FieldLabel>IFRS 13 Fair Value Level</FieldLabel>
          <SelectInput
            value={form.ifrs13Level}
            onChange={set("ifrs13Level")}
            options={IFRS13_LEVELS}
          />
        </div>
        <div>
          <FieldLabel>Currency *</FieldLabel>
          <SelectInput
            value={form.currency}
            onChange={set("currency")}
            options={CURRENCIES}
          />
        </div>
      </div>
    </div>
  );
}
