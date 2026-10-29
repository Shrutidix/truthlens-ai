"use client";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useModelInfo } from "@/components/useModelInfo";
import ConfusionMatrix from "@/components/ConfusionMatrix";
import Kpi from "@/components/ui/Kpi";
import { Disclaimer, ErrorMessage, Loading } from "@/components/ui/Notices";
import { pct } from "@/lib/format";

const show = (v: unknown) => (Array.isArray(v) ? `(${v.join(", ")})` : String(v));

export default function AnalyticsPage() {
  const { data, error, loading, reload } = useModelInfo();
  return (
    <div className="container-page pt-12 md:pt-16">
      <p className="eyebrow">Model analytics</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">How the model was evaluated</h1>
      <p className="mt-4 max-w-2xl text-ink-muted">Every figure below is served by the API from the saved evaluation artifacts. Nothing is hard-coded in the interface.</p>

      <div className="mt-8"><Disclaimer><b>Demo-dataset results.</b> The dataset is synthetic and template-generated, so these scores demonstrate that the pipeline runs end to end. They are not evidence of real-world reliability.</Disclaimer></div>

      {loading && <div className="mt-10"><Loading label="Loading evaluation artifacts…" /></div>}
      {error && <div className="mt-10"><ErrorMessage title="Could not load analytics" onRetry={reload}>{error}</ErrorMessage></div>}
      {data && (() => {
        const m = data.evaluation.metrics_file, cm = data.evaluation.confusion_matrix, ds = data.evaluation.dataset;
        const dist = (["REAL", "FAKE"] as const).map((k) => ({ label: k, rows: ds.class_counts[k] }));
        return (
          <>
            <section className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Test-set metrics">
              <Kpi label="Accuracy" value={pct(m.accuracy)} note="held-out test split" />
              <Kpi label="Precision" value={pct(m.precision)} note="FAKE as positive class" />
              <Kpi label="Recall" value={pct(m.recall)} note="FAKE as positive class" />
              <Kpi label="F1 score" value={pct(m.f1_score)} note="FAKE as positive class" />
            </section>

            <section className="mt-12 grid gap-8 lg:grid-cols-2">
              <div className="card p-6">
                <h2 className="text-2xl">Confusion matrix</h2>
                <p className="mb-5 mt-1 text-sm text-ink-muted">{cm.test_size} held-out articles. Rows: actual. Columns: predicted.</p>
                <ConfusionMatrix labels={cm.labels} matrix={cm.matrix} />
                <details className="mt-5 text-sm">
                  <summary className="cursor-pointer text-sage">Saved training artifact (confusion_matrix.png)</summary>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/confusion_matrix.png" alt="Confusion matrix heatmap saved by train.py: 40 REAL and 40 FAKE articles all classified correctly." className="mt-3 w-full max-w-sm rounded-md border border-rule" />
                </details>
              </div>
              <div className="card p-6">
                <h2 className="text-2xl">Dataset class distribution</h2>
                <p className="mb-5 mt-1 text-sm text-ink-muted">{ds.rows} rows in sample_data.csv (synthetic). Split {ds.train_rows} train / {ds.test_rows} test, stratified.</p>
                <div className="h-[240px]" role="img" aria-label={`Class counts: REAL ${ds.class_counts.REAL}, FAKE ${ds.class_counts.FAKE}`}>
                  <ResponsiveContainer>
                    <BarChart data={dist} margin={{ top: 8 }}>
                      <CartesianGrid vertical={false} stroke="#E9E5DC" />
                      <XAxis dataKey="label" stroke="#E9E5DC" tick={{ fill: "#292D29", fontSize: 13 }} />
                      <YAxis stroke="#E9E5DC" tick={{ fill: "#706F68", fontSize: 12 }} />
                      <Tooltip cursor={{ fill: "#F0EEE7" }} contentStyle={{ borderRadius: 8, border: "1px solid #E9E5DC", fontSize: 12 }} />
                      <Bar dataKey="rows" radius={[4, 4, 0, 0]}>{dist.map((d) => <Cell key={d.label} fill={d.label === "REAL" ? "#526B5D" : "#B07B70"} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-3 text-xs text-ink-muted">Perfectly balanced by construction: 20 topics × 10 templates per class.</p>
              </div>
            </section>

            <section className="mt-12 grid gap-10 border-t border-rule pt-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div><h2 className="text-3xl">Architecture</h2><p className="mt-3 text-ink-muted">One saved scikit-learn Pipeline ({data.evaluation.model.vocabulary_size} vocabulary terms in the saved vectorizer).</p></div>
              <ol className="space-y-3 text-[15px]">
                {data.architecture.map((a, i) => <li key={a} className="flex gap-4 border-b border-rule pb-3"><span className="font-mono text-sage">0{i + 1}</span><span>{a}</span></li>)}
              </ol>
            </section>

            <section className="mt-10 grid gap-6 md:grid-cols-2">
              <ParamTable title="TF-IDF configuration" params={data.tfidf_params} />
              <ParamTable title="Logistic Regression" params={data.logreg_params} />
            </section>

            <section className="mt-12">
              <h2 className="text-3xl">Most influential terms (global)</h2>
              <p className="mt-2 max-w-2xl text-sm text-ink-muted">Largest learned coefficients. Positive pushes toward FAKE, negative toward REAL. These reflect the template wording of the demo data.</p>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <TermList title="Toward FAKE" items={data.evaluation.model.top_fake_features} />
                <TermList title="Toward REAL" items={data.evaluation.model.top_real_features} />
              </div>
            </section>

            <section className="mt-12 grid gap-10 border-t border-rule pt-10 lg:grid-cols-2">
              <div>
                <h2 className="text-2xl">Evaluation methodology</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] text-ink/90">
                  <li>{Math.round(data.split.test_size * 100)}% stratified hold-out split, random_state {data.split.random_state}.</li>
                  <li>Metrics are computed with FAKE (1) as the positive class.</li>
                  <li>Confusion matrix counts were re-derived by applying the saved model to the reproduced test split and match the saved training image.</li>
                  <li>No cross-validation or external dataset has been run.</li>
                </ul>
              </div>
              <div>
                <h2 className="text-2xl">Limitations</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] text-ink/90">
                  <li>Synthetic sentences share templates across train and test, which inflates scores.</li>
                  <li>The model learns wording style (sensational phrasing), not factual correctness.</li>
                  <li>Real news will differ in vocabulary and style; expect degraded, poorly calibrated results.</li>
                </ul>
              </div>
            </section>
          </>
        );
      })()}
    </div>
  );
}

function ParamTable({ title, params }: { title: string; params: Record<string, unknown> }) {
  return (
    <div className="card p-6">
      <h3 className="font-serif text-xl">{title}</h3>
      <table className="mt-3 w-full text-sm">
        <tbody>{Object.entries(params).map(([k, v]) => (
          <tr key={k} className="border-t border-rule first:border-0"><th scope="row" className="py-2 pr-4 text-left font-mono text-[13px] font-normal text-ink-muted">{k}</th><td className="py-2 text-right font-mono text-[13px]">{show(v)}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}
function TermList({ title, items }: { title: string; items: { token: string; coefficient: number }[] }) {
  return (
    <div className="card p-6">
      <h3 className="font-serif text-xl">{title}</h3>
      <ul className="mt-3 divide-y divide-rule text-sm">{items.map((t) => (
        <li key={t.token} className="flex justify-between py-1.5"><span className="font-mono">{t.token}</span><span className="font-mono text-ink-muted">{t.coefficient.toFixed(3)}</span></li>
      ))}</ul>
    </div>
  );
}
