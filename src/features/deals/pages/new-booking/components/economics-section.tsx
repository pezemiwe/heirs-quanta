import type { FormState } from "../types";
import { FREQ_OPTIONS, DAY_COUNTS } from "../config";
import { FieldLabel } from "./field-label";
import { TextInput } from "./text-input";
import { SelectInput } from "./select-input";

export function EconomicsSection({
  form,
  set,
  eirApprox,
}: {
  form: FormState;
  set: (field: keyof FormState) => (v: string) => void;
  eirApprox: number | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-dark-gray">
        Deal Economics
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <FieldLabel tip="Nominal / par value in instrument currency">
            Face Value *
          </FieldLabel>
          <TextInput
            value={form.faceValue}
            onChange={set("faceValue")}
            placeholder="e.g. 100000000"
          />
        </div>
        <div>
          <FieldLabel tip="As decimal, e.g. 0.98 for 98%">
            Purchase Price (decimal)
          </FieldLabel>
          <TextInput
            value={form.purchasePrice}
            onChange={set("purchasePrice")}
            placeholder="e.g. 0.9850"
          />
        </div>
        <div>
          <FieldLabel tip="Annual yield to maturity at purchase">
            Purchase Yield (%)
          </FieldLabel>
          <TextInput
            value={form.purchaseYield}
            onChange={set("purchaseYield")}
            placeholder="e.g. 0.185 for 18.5%"
          />
        </div>
        <div>
          <FieldLabel>Coupon Rate (annual, decimal)</FieldLabel>
          <TextInput
            value={form.couponRate}
            onChange={set("couponRate")}
            placeholder="e.g. 0.1500 for 15%"
          />
        </div>
        <div>
          <FieldLabel>Coupon Frequency</FieldLabel>
          <SelectInput
            value={form.couponFrequency}
            onChange={set("couponFrequency")}
            options={FREQ_OPTIONS}
          />
        </div>
        <div>
          <FieldLabel>Day Count Convention</FieldLabel>
          <SelectInput
            value={form.dayCount}
            onChange={set("dayCount")}
            options={DAY_COUNTS}
          />
        </div>
        <div>
          <FieldLabel tip="Discount rate used for DCF valuation (e.g. 0.185 for 18.5%). Defaults to purchase yield if blank.">
            Discount Rate (%)
          </FieldLabel>
          <TextInput
            value={form.discountRate}
            onChange={set("discountRate")}
            placeholder="e.g. 0.185 for 18.5%"
          />
        </div>
      </div>
      {eirApprox !== null && (
        <div className="mt-4 rounded-lg bg-pale-red/40 border border-primary/20 px-4 py-3">
          <p className="text-xs text-primary">
            <span className="font-semibold">Estimated EIR:</span>{" "}
            {(eirApprox * 100).toFixed(4)}% — precise EIR will be computed on
            deal booking.
          </p>
        </div>
      )}
    </div>
  );
}
