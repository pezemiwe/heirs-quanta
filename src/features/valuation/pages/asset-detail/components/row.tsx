export function Row({
  label,
  value,
  mono,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-3 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span
        className={`${mono ? "font-mono" : ""} ${
          emphasis ? "font-semibold text-dark-gray" : "text-dark-gray"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
