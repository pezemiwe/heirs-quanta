export function SeverityBadge({ s }: { s: string }) {
  const styles: Record<string, string> = {
    high: "bg-red-100 text-danger",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[s]}`}
    >
      {s}
    </span>
  );
}
