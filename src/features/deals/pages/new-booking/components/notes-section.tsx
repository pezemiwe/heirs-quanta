export function NotesSection({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-dark-gray">
        Notes / Rationale
      </h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Investment rationale, IC approval reference, or other notes..."
        className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-300 resize-none"
      />
    </div>
  );
}
