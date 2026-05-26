import { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { SectionCard } from "../../../components/shared/section-card";
import { Input } from "../../../components/shared/input";
import { Button } from "../../../components/shared/button";
import { Badge } from "../../../components/shared/badge";
import { useIFRS9 } from "../store";
import { DEFAULT_ASSUMPTIONS } from "../engine/reference-data";
import type { Assumptions } from "../engine/types";

const toISO = (d: Date) => d.toISOString().slice(0, 10);

export function IFRS9Assumptions() {
  const { assumptions, setAssumptions } = useIFRS9();
  const [draft, setDraft] = useState<Assumptions>(assumptions);

  const updateWeight = (key: keyof Assumptions["weights"], v: number) => {
    setDraft((d) => ({ ...d, weights: { ...d.weights, [key]: v } }));
  };

  const updateOverlay = (
    key: "baseline" | "bestCase" | "worseCase",
    text: string,
  ) => {
    const parsed = text
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(Number)
      .filter((n) => !Number.isNaN(n));
    if (parsed.length === 0) return;
    // pad/truncate to 60 months
    const arr = parsed.slice(0, 60);
    while (arr.length < 60) arr.push(arr[arr.length - 1] ?? 1);
    setDraft((d) => ({ ...d, [key]: arr }) as Assumptions);
  };

  const weightSum =
    draft.weights.baseline + draft.weights.bestCase + draft.weights.worseCase;
  const weightsValid = Math.abs(weightSum - 1) < 0.001;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
            ECL Assumptions
          </h1>
          <p className="mt-1 text-sm text-dark-gray/60">
            Reporting date, recovery rates and forward-looking information
            overlays.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={() => setDraft(DEFAULT_ASSUMPTIONS)}
          >
            Reset to default
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save className="h-3.5 w-3.5" />}
            disabled={!weightsValid}
            onClick={() => setAssumptions(draft)}
          >
            Apply assumptions
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Reporting Parameters"
          description="Set the as-of date and sovereign recovery rate"
        >
          <div className="space-y-4">
            <Input
              type="date"
              label="Reporting Date"
              value={toISO(draft.reportingDate)}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  reportingDate: new Date(e.target.value),
                }))
              }
            />
            <Input
              type="number"
              step="0.01"
              min={0}
              max={1}
              label="Sovereign Recovery Rate (fraction)"
              hint="e.g. 0.53 represents 53% expected recovery on default."
              value={draft.sovereignRecoveryRate}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  sovereignRecoveryRate: Number(e.target.value),
                }))
              }
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Scenario Weights"
          description="Probability-weighting across forward-looking scenarios"
        >
          <div className="space-y-4">
            <Input
              type="number"
              step="0.05"
              min={0}
              max={1}
              label="Baseline weight"
              value={draft.weights.baseline}
              onChange={(e) => updateWeight("baseline", Number(e.target.value))}
            />
            <Input
              type="number"
              step="0.05"
              min={0}
              max={1}
              label="Best-case weight"
              value={draft.weights.bestCase}
              onChange={(e) => updateWeight("bestCase", Number(e.target.value))}
            />
            <Input
              type="number"
              step="0.05"
              min={0}
              max={1}
              label="Worse-case weight"
              value={draft.weights.worseCase}
              onChange={(e) =>
                updateWeight("worseCase", Number(e.target.value))
              }
            />
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs">
              <span className="text-dark-gray/60">Sum of weights</span>
              <Badge variant={weightsValid ? "success" : "danger"} size="sm">
                {weightSum.toFixed(2)}
              </Badge>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="FLI Overlays (60 months)"
        description="Comma- or whitespace-separated multipliers applied to monthly PD vectors"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {(["baseline", "bestCase", "worseCase"] as const).map((k) => (
            <div key={k} className="space-y-1.5">
              <label className="text-sm font-medium text-dark-gray">
                {k === "baseline"
                  ? "Baseline overlay"
                  : k === "bestCase"
                    ? "Best-case overlay"
                    : "Worse-case overlay"}
              </label>
              <textarea
                rows={6}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-mono text-dark-gray outline-none focus:border-primary focus:ring-2 focus:ring-focus/20"
                value={draft[k].join(", ")}
                onChange={(e) => updateOverlay(k, e.target.value)}
              />
              <p className="text-xs text-dark-gray/50">
                {draft[k].length} values · min{" "}
                {Math.min(...draft[k]).toFixed(2)} · max{" "}
                {Math.max(...draft[k]).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
