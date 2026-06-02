export function fmtDue(iso: string): { label: string; cls: string } {
  const d = new Date(iso);
  const today = new Date("2026-05-26");
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0)
    return {
      label: `${Math.abs(diff)}d overdue`,
      cls: "text-danger font-semibold",
    };
  if (diff === 0)
    return { label: "Due today", cls: "text-danger font-semibold" };
  if (diff <= 2)
    return { label: `${diff}d left`, cls: "text-yellow-600 font-medium" };
  return {
    label: d.toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
    cls: "text-gray-400",
  };
}
