import { ECOSYSTEM_ENTITIES } from "../data";

export const HeirsEcosystemSection = () => (
  <div className="border-b border-t border-border bg-white py-8">
    <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
      <p className="mb-6 text-center text-[10px] font-bold uppercase tracking-widest text-dark-gray/30">
        Serving the Heirs Holdings Group family of companies
      </p>
      <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
        {ECOSYSTEM_ENTITIES.map((e) => (
          <span
            key={e}
            className="text-sm font-semibold text-dark-gray/35 transition-colors hover:text-dark-gray/65"
          >
            {e}
          </span>
        ))}
      </div>
    </div>
  </div>
);
