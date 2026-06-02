import type { FormState } from "../types";
import { INST_TYPES, SECTORS } from "../config";
import { FieldLabel } from "./field-label";
import { TextInput } from "./text-input";
import { SelectInput } from "./select-input";

export function InstrumentDetailsSection({
  form,
  set,
  portfolios,
}: {
  form: FormState;
  set: (field: keyof FormState) => (v: string) => void;
  portfolios: string[];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-dark-gray">
        Instrument Details
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <FieldLabel>Instrument Type *</FieldLabel>
          <SelectInput
            value={form.instrumentType}
            onChange={set("instrumentType")}
            options={INST_TYPES}
          />
        </div>
        <div>
          <FieldLabel tip="International Securities Identification Number">
            ISIN
          </FieldLabel>
          <TextInput
            value={form.isin}
            onChange={set("isin")}
            placeholder="e.g. NGFGN00001234"
          />
        </div>
        <div>
          <FieldLabel>Instrument Name *</FieldLabel>
          <TextInput
            value={form.instrumentName}
            onChange={set("instrumentName")}
            placeholder="e.g. FGN Bond 2031"
          />
        </div>
        <div>
          <FieldLabel>Issuer *</FieldLabel>
          <TextInput
            value={form.issuer}
            onChange={set("issuer")}
            placeholder="e.g. Federal Government of Nigeria"
          />
        </div>
        <div>
          <FieldLabel>Sector</FieldLabel>
          <SelectInput
            value={form.sector}
            onChange={set("sector")}
            options={SECTORS}
          />
        </div>
        <div>
          <FieldLabel>Portfolio</FieldLabel>
          <SelectInput
            value={form.portfolio}
            onChange={set("portfolio")}
            options={portfolios}
          />
        </div>
      </div>
    </div>
  );
}
