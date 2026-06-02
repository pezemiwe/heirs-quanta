import { Target, TrendingUp } from "lucide-react";

interface Props {
  totalDeals: number;
  highCount: number;
  avgIRR: number;
  totalNGN: number;
  totalUSD: number;
}

export const KpiStrip = ({
  totalDeals,
  highCount,
  avgIRR,
  totalNGN,
  totalUSD,
}: Props) => {
  const cards = [
    {
      icon: <Target className="h-4 w-4 text-primary" />,
      label: "Active Deals",
      value: String(totalDeals),
      sub: `${highCount} high priority`,
      accent: "text-dark-gray",
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-success" />,
      label: "Avg Projected IRR",
      value: `${avgIRR.toFixed(1)}%`,
      sub: "Unweighted mean",
      accent: "text-success",
    },
    {
      icon: <span className="text-sm font-bold text-primary">₦</span>,
      label: "NGN Pipeline",
      value: `₦${totalNGN.toFixed(1)}B`,
      sub: "Deal value",
      accent: "text-primary",
    },
    {
      icon: <span className="text-sm font-bold text-emerald-600">$</span>,
      label: "USD Pipeline",
      value: `$${totalUSD.toFixed(1)}B`,
      sub: "Deal value",
      accent: "text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((k) => (
        <div
          key={k.label}
          className="rounded-xl border border-border bg-surface p-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            {k.icon}
            <p className="text-xs text-dark-gray/50 font-medium">{k.label}</p>
          </div>
          <p className={`mt-1.5 text-xl font-bold ${k.accent}`}>{k.value}</p>
          <p className="mt-0.5 text-xs text-dark-gray/40">{k.sub}</p>
        </div>
      ))}
    </div>
  );
};
