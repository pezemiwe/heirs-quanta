import { fmtCompact, stage1, stage2, stage3, totalECLNGN } from "../config";

export function StageDistribution() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-dark-gray">
        ECL Stage Distribution
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            stage: "Stage 1",
            count: stage1,
            ecl: totalECLNGN * 0.15,
            color: "text-success",
          },
          {
            stage: "Stage 2",
            count: stage2,
            ecl: totalECLNGN * 0.35,
            color: "text-yellow-600",
          },
          {
            stage: "Stage 3",
            count: stage3,
            ecl: totalECLNGN * 0.5,
            color: "text-danger",
          },
        ].map((s) => (
          <div key={s.stage} className="rounded-lg border border-border p-4">
            <p className={`text-sm font-semibold ${s.color}`}>{s.stage}</p>
            <p className="mt-1 text-2xl font-bold text-dark-gray">{s.count}</p>
            <p className="text-xs text-gray-400">instruments</p>
            <p className="mt-2 text-xs text-gray-500">
              ECL: {fmtCompact(s.ecl)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
