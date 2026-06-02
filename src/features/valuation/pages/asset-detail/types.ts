import type { valueInstrument } from "../../engine";
import type { Instrument } from "../../engine/types";

export type Tab =
  | "summary"
  | "amort"
  | "cashflow"
  | "income"
  | "fairvalue"
  | "oci"
  | "risk"
  | "audit";

export type Valuation = ReturnType<typeof valueInstrument>;

export type TabProps = {
  inst: Instrument;
  val: Valuation;
};
