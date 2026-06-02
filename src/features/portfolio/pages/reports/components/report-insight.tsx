type Props = { insight: string };

export function ReportInsight({ insight }: Props) {
  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-dark-gray">
        Report Insight
      </h3>
      <p className="text-sm leading-relaxed text-gray-600">{insight}</p>
    </div>
  );
}
