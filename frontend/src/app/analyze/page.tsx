"use client";
import { useRef, useState } from "react";
import { Eraser, ScanSearch } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { predict } from "@/lib/api";
import { pct } from "@/lib/format";
import type { PredictResponse } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Disclaimer, ErrorMessage } from "@/components/ui/Notices";
import LabelBadge from "@/components/ui/LabelBadge";
import ProbabilityBar from "@/components/ui/ProbabilityBar";

const MAX = 20000;
const EXAMPLES = [
  { name: "Sensational wording", title: "You won't believe this about the economy", text: "SHOCKING: You won't BELIEVE what they don't want you to know about the economy!!!" },
  { name: "Measured reporting", title: "Report on the housing market", text: "Officials confirmed on Monday that the housing market will be reviewed following a report published by independent analysts." },
  { name: "Everyday headline", title: "", text: "Local library extends opening hours for the summer reading programme." },
];

export default function AnalyzePage() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const problem = !text.trim() ? "Enter some article text to analyze." : text.length > MAX ? `Text is limited to ${MAX.toLocaleString()} characters.` : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (problem) return;
    setLoading(true); setError(null);
    try {
      setResult(await predict(text, title));
      setTimeout(() => resultRef.current?.focus(), 50);
    } catch (err) { setResult(null); setError((err as Error).message); }
    finally { setLoading(false); }
  }
  const reset = () => { setTitle(""); setText(""); setResult(null); setError(null); setTouched(false); };

  return (
    <div className="container-page pt-12 md:pt-16">
      <p className="eyebrow">Live analyzer</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">Analyze an article</h1>
      <p className="mt-4 max-w-2xl text-ink-muted">Paste a headline and body. The text is sent to the Python model for real inference; nothing is stored.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={submit} noValidate className="card space-y-5 p-6">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium">Headline <span className="font-normal text-ink-muted">(optional)</span></label>
            <input id="title" className="input" value={title} maxLength={1000} onChange={(e) => setTitle(e.target.value)} placeholder="Article headline" />
          </div>
          <div>
            <label htmlFor="text" className="mb-1.5 block text-sm font-medium">Article text</label>
            <textarea id="text" className="input min-h-[220px] resize-y" value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Paste news text here…" aria-invalid={touched && !!problem} aria-describedby="text-help" />
            <div id="text-help" className="mt-1.5 flex justify-between text-xs">
              <span className={touched && problem ? "text-clay" : "text-ink-muted"} role={touched && problem ? "alert" : undefined}>{touched && problem ? problem : "Headline and body are combined, as in training."}</span>
              <span className={text.length > MAX ? "text-clay" : "text-ink-muted"}>{text.length.toLocaleString()} / {MAX.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={loading}><ScanSearch size={16} aria-hidden /> {loading ? "Analyzing…" : "Analyze Article"}</Button>
            <Button type="button" variant="secondary" onClick={reset}><Eraser size={16} aria-hidden /> Clear</Button>
          </div>
          <div className="border-t border-rule pt-4">
            <p className="text-xs text-ink-muted">Illustrative examples (written for this demo, not real news):</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button key={ex.name} type="button" onClick={() => { setTitle(ex.title); setText(ex.text); setResult(null); setError(null); }}
                  className="rounded-md border border-rule bg-ivory px-3 py-1.5 text-xs transition-colors hover:border-sage/50 hover:bg-sage-soft/50">{ex.name}</button>
              ))}
            </div>
          </div>
        </form>

        <div ref={resultRef} tabIndex={-1} aria-live="polite" className="outline-none">
          {error && <ErrorMessage title="Analysis failed">{error}</ErrorMessage>}
          {!error && !result && !loading && (
            <div className="card grid min-h-[260px] place-items-center p-8 text-center text-sm text-ink-muted">Results will appear here.</div>
          )}
          {loading && <div className="card grid min-h-[260px] place-items-center p-8 text-sm text-ink-muted" role="status">Running the model…</div>}
          {result && !loading && <Result r={result} />}
        </div>
      </div>
    </div>
  );
}

function Result({ r }: { r: PredictResponse }) {
  const data = r.top_features.map((f) => ({ ...f, abs: Math.abs(f.contribution), value: +f.contribution.toFixed(4) }));
  return (
    <div className="card space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
        <div>
          <p className="eyebrow">Model prediction</p>
          <div className="mt-2 flex items-center gap-3"><LabelBadge label={r.label} size="lg" /></div>
        </div>
        <div className="text-right">
          <p className="eyebrow">Confidence in predicted class</p>
          <p className="font-serif text-4xl text-sage">{pct(r.confidence)}</p>
        </div>
      </div>
      <ProbabilityBar real={r.probabilities.REAL} fake={r.probabilities.FAKE} />

      <div>
        <h2 className="font-serif text-xl">Influential words</h2>
        {data.length === 0 ? <p className="mt-2 text-sm text-ink-muted">No known vocabulary terms were found, so there is nothing to explain.</p> : (
          <>
            <div className="mt-3 h-[280px] w-full" aria-hidden>
              <ResponsiveContainer>
                <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#706F68" }} stroke="#E9E5DC" />
                  <YAxis type="category" dataKey="token" width={110} tick={{ fontSize: 12, fill: "#292D29" }} stroke="#E9E5DC" />
                  <Tooltip cursor={{ fill: "#F0EEE7" }} formatter={(v: number) => [v, "contribution"]} contentStyle={{ borderRadius: 8, border: "1px solid #E9E5DC", fontSize: 12 }} />
                  <Bar dataKey="value" radius={3}>{data.map((d) => <Cell key={d.token} fill={d.direction === "FAKE" ? "#B07B70" : "#526B5D"} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 divide-y divide-rule text-sm">
              {data.map((f) => (
                <li key={f.token} className="flex items-center justify-between py-1.5">
                  <span className="font-mono">{f.token}</span>
                  <span className="flex items-center gap-3"><span className="font-mono text-ink-muted">{f.contribution.toFixed(4)}</span><LabelBadge label={f.direction} size="sm" /></span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-muted">Contribution = TF-IDF value × Logistic Regression coefficient. Positive pushes toward FAKE, negative toward REAL.</p>
          </>
        )}
      </div>

      <Disclaimer>
        This is a pattern-based classification, not independent verification of whether the article is true. The model was trained on a small
        synthetic dataset, so confidence on real-world text can be misleading.
      </Disclaimer>
    </div>
  );
}
