/**
 * Heirs Quanta — Demo / Seed Data Archive
 *
 * All original hardcoded reference data lives here.
 * Nothing in the application imports from this file at runtime.
 * It exists solely so we can reinstate the demo dataset at any time
 * via the "Load demo" button in the Import Portfolio Book modal,
 * or by reverting the stores during development.
 *
 * DO NOT import from this file in any feature/store/page.
 * Use src/context/instrument-book.tsx (useInstrumentBook) instead.
 */

// IFRS 9 reference securities (original 30-instrument sample book)
export { SAMPLE_SECURITIES as DEMO_SECURITIES } from "../features/ifrs9/engine/reference-data";

// Valuation reference instruments (original 204-instrument portfolio book)
export { SAMPLE_INSTRUMENTS as DEMO_INSTRUMENTS } from "../features/valuation/engine/reference-data";

// Portfolio management holdings (original Heirs Holdings group positions)
export {
  HOLDINGS as DEMO_HOLDINGS,
  TRANSACTIONS as DEMO_TRANSACTIONS,
  TARGETS as DEMO_TARGETS,
} from "../features/portfolio/engine/reference-data";

// Default model assumptions (these ARE used at runtime — yield curves, FX rates, etc.)
export { DEFAULT_ASSUMPTIONS as DEMO_VALUATION_ASSUMPTIONS } from "../features/valuation/engine/reference-data";
export { DEFAULT_ASSUMPTIONS as DEMO_IFRS9_ASSUMPTIONS } from "../features/ifrs9/engine/reference-data";
export { DEFAULT_LIABILITY_STRUCTURE as DEMO_LIABILITY_STRUCTURE } from "../features/duration-risk/engine/reference-data";
