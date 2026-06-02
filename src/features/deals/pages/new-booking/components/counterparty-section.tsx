import type { FormState } from "../types";
import { FieldLabel } from "./field-label";
import { TextInput } from "./text-input";

export function CounterpartySection({
  form,
  set,
}: {
  form: FormState;
  set: (field: keyof FormState) => (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-dark-gray">
        Counterparty &amp; Custody
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Custodian</FieldLabel>
          <TextInput
            value={form.custodian}
            onChange={set("custodian")}
            placeholder="e.g. First Bank Custodial"
          />
        </div>
        <div>
          <FieldLabel>Counterparty</FieldLabel>
          <TextInput
            value={form.counterparty}
            onChange={set("counterparty")}
            placeholder="e.g. Stanbic IBTC Securities"
          />
        </div>
      </div>
    </div>
  );
}
