import type { Instrument } from "../../../portfolio/engine/book-compute";

export type Row = Instrument & Record<string, unknown>;
