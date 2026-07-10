import type { ReactNode } from "react";
import { PageHeader } from "./page-header";
import { SectionCard } from "./section-card";

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  cta?: ReactNode;
}

/* A consistent placeholder used by scaffolded modules whose pages
   are not yet implemented. Renders a header + a check-list of the
   capabilities scheduled for the page. */
export function PlaceholderPage({
  eyebrow,
  title,
  description,
  bullets,
  cta,
}: PlaceholderPageProps) {
  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={cta}
      />

      <SectionCard
        title="Planned Capabilities"
        description="Detailed functionality scheduled for this page."
      >
        <ul className="space-y-2.5">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2.5 text-sm text-dark-gray"
            >
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
