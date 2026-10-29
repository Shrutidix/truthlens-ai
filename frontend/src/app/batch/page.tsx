"use client";
import { useRef, useState } from "react";
import { Download, FileUp, RotateCcw } from "lucide-react";
import { predictBatch } from "@/lib/api";
import { resultsToCsv } from "@/lib/csv";
import { kb } from "@/lib/format";
import type { BatchResponse } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Disclaimer, ErrorMessage } from "@/components/ui/Notices";
import Kpi from "@/components/ui/Kpi";
import ResultsTable from "@/components/ResultsTable";

const MAX_BYTES = 2 * 1024 * 1024; // mirrors the API default; the server is the authority

export default function BatchPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchResponse | null>(null);

  function choose(f: File | undefined) {
    setResult(null); setError(null); setFile(null);
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) return setError("Please choose a .csv file.");
    if (f.size === 0) return setError("The file is empty.");
    if (f.size > MAX_BYTES) return setError(`File is too large (${kb(f.size)}). The limit is ${kb(MAX_BYTES)}.`);
    setFile(f);
  }
  async function run() {
    if (!file) return;
    setBusy(true); setError(null); setProgress(0);
    try { setResult(await predictBatch(file, setProgress)); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); setProgress(null); }
  }
  function download() {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([resultsToCsv(result)], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "truthlens_predictions.csv" });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  const reset = () => { setFile(null); setResult(null); setError(null); if (inputRef.current) inputRef.current.value = ""; };

  return (
    <div className="container-page pt-12 md:pt-16">
      <p className="eyebrow">Batch analysis</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">Classify a CSV</h1>
      <p className="mt-4 max-w-2xl text-ink-muted">Upload a UTF-8 CSV with a <code className="font-mono text-sm">text</code> column and, optionally, a <code className="font-mono text-sm">title</code> column. Up to 1,000 rows and 2 MB. Files are processed in memory and not stored.</p>

      {!result && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); choose(e.dataTransfer.files[0]); }}
              className={`card grid place-items-center border-dashed p-10 text-center transition-colors ${drag ? "border-sage bg-sage-soft/40" : ""}`}>
              <FileUp size={28} className="text-sage" aria-hidden />
              <p className="mt-3 font-medium">{file ? file.name : "Drop a CSV here"}</p>
              <p className="mt-1 text-sm text-ink-muted">{file ? kb(file.size) : "or choose a file from your device"}</p>
              <input ref={inputRef} id="csv" type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => choose(e.target.files?.[0])} />
              <label htmlFor="csv" className="mt-4 cursor-pointer rounded-lg border border-rule bg-paper px-4 py-2 text-sm font-medium transition-colors hover:border-sage/50 hover:bg-linen focus-within:outline">Choose file</label>
            </div>
            {error && <div className="mt-4"><ErrorMessage title="Cannot process this file">{error}</ErrorMessage></div>}
            <div className="mt-4 flex items-center gap-4">
              <Button onClick={run} loading={busy} disabled={!file}>{busy ? "Classifying…" : "Classify file"}</Button>
              {busy && progress !== null && (
                <div className="flex-1" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                  <div className="h-1.5 rounded-full bg-linen"><div className="h-full rounded-full bg-sage transition-all" style={{ width: `${progress}%` }} /></div>
                  <p className="mt-1 text-xs text-ink-muted">{progress < 100 ? `Uploading ${progress}%` : "Running the model…"}</p>
                </div>
              )}
            </div>
          </div>
          <div className="card p-6 text-sm">
            <h2 className="font-serif text-xl">Expected format</h2>
            <pre className="mt-3 overflow-x-auto rounded-md bg-linen p-3 font-mono text-xs leading-relaxed">{`title,text\nHeadline one,"Body of the article…"\n,"Text without a title"`}</pre>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-ink-muted">
              <li>Other columns are kept in the output.</li>
              <li>Empty or unusable rows are skipped, never classified.</li>
              <li>Preprocessing is identical to single-article analysis.</li>
            </ul>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Kpi label="Rows" value={String(result.summary.total_rows)} />
            <Kpi label="Predicted" value={String(result.summary.predicted)} note={`${result.summary.real} REAL · ${result.summary.fake} FAKE`} />
            <Kpi label="Skipped" value={String(result.summary.skipped)} note="empty or unusable text" />
            <Kpi label="Flagged FAKE" value={String(result.summary.fake)} note="of predicted rows" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={download}><Download size={16} aria-hidden /> Download results CSV</Button>
            <Button variant="secondary" onClick={reset}><RotateCcw size={16} aria-hidden /> New file</Button>
          </div>
          <ResultsTable result={result} />
          <Disclaimer>Labels are statistical predictions from a model trained on synthetic demo data, not fact-checks.</Disclaimer>
        </div>
      )}
    </div>
  );
}
