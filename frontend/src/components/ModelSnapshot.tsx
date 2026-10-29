"use client";
import { useModelInfo } from "./useModelInfo";
import { ErrorMessage, Loading } from "./ui/Notices";
import ConfusionMatrix from "./ConfusionMatrix";
import { pct } from "@/lib/format";

/** Data-backed preview: everything here is fetched live from the API. */
export default function ModelSnapshot({ compact = false }: { compact?: boolean }) {
  const { data, error, loading, reload } = useModelInfo();
  if (loading) return <div className="card p-6"><Loading label="Fetching model record from the API…" /></div>;
  if (error || !data) return <ErrorMessage title="Model record unavailable" onRetry={reload}>{error}</ErrorMessage>;
  const m = data.evaluation.metrics_file;
  const cm = data.evaluation.confusion_matrix;
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Model on record</p>
        <span className="rounded-md bg-amber-soft px-2 py-0.5 text-[11px] text-amber">Demo dataset</span>
      </div>
      <dl className="mt-4 grid grid-cols-4 gap-3 border-b border-rule pb-4">
        {([["Accuracy", m.accuracy], ["Precision", m.precision], ["Recall", m.recall], ["F1", m.f1_score]] as const).map(([k, v]) => (
          <div key={k}><dt className="text-[11px] text-ink-muted">{k}</dt><dd className="font-serif text-xl text-sage sm:text-2xl">{pct(v, 0)}</dd></div>
        ))}
      </dl>
      {!compact && <div className="mt-5"><ConfusionMatrix labels={cm.labels} matrix={cm.matrix} /></div>}
      <p className="mt-4 text-xs text-ink-muted">
        {data.evaluation.dataset.rows} synthetic rows · {cm.test_size}-row held-out test split. Perfect scores reflect template data, not real-world reliability.
      </p>
    </div>
  );
}
