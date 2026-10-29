"use client";
import { useState } from "react";
import clsx from "clsx";
import type { Label } from "@/types/api";

interface Props { labels: Label[]; matrix: number[][]; }

/** Rows = Actual, columns = Predicted (same orientation as the saved PNG). */
export default function ConfusionMatrix({ labels, matrix }: Props) {
  const [active, setActive] = useState<[number, number] | null>(null);
  const max = Math.max(1, ...matrix.flat());
  const rowTotals = matrix.map((r) => r.reduce((a, b) => a + b, 0));
  const kind = (i: number, j: number) => (i === j ? "correct" : labels[j] === "FAKE" ? "false positive (REAL predicted as FAKE)" : "false negative (FAKE predicted as REAL)");

  return (
    <figure>
      <div className="grid grid-cols-[auto_1fr] gap-x-3">
        <div />
        <p className="mb-2 text-center text-xs font-medium tracking-wide text-ink-muted">PREDICTED</p>
        <p className="flex items-center text-xs font-medium tracking-wide text-ink-muted [writing-mode:vertical-rl] rotate-180 justify-center">ACTUAL</p>
        <div role="table" aria-label="Confusion matrix. Rows are actual class, columns are predicted class." className="grid grid-cols-[auto_1fr_1fr] gap-1.5">
          <div role="row" className="contents">
            <span />
            {labels.map((l) => <span key={l} role="columnheader" className="pb-1 text-center text-sm font-medium">{l}</span>)}
          </div>
          {matrix.map((row, i) => (
            <div role="row" className="contents" key={i}>
              <span role="rowheader" className="flex items-center pr-2 text-sm font-medium">{labels[i]}</span>
              {row.map((v, j) => {
                const on = active?.[0] === i && active?.[1] === j;
                const diag = i === j;
                const a = 0.12 + 0.88 * (v / max);
                return (
                  <button key={j} role="cell" type="button" onMouseEnter={() => setActive([i, j])} onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive([i, j])} onBlur={() => setActive(null)}
                    aria-label={`Actual ${labels[i]}, predicted ${labels[j]}: ${v} articles (${kind(i, j)})`}
                    className={clsx("aspect-[4/3] min-h-[84px] rounded-lg border text-center transition-all",
                      on ? "border-sage shadow-lift" : "border-rule")}
                    style={{ backgroundColor: diag ? `rgba(82,107,93,${a})` : v > 0 ? `rgba(138,75,63,${a})` : "#F0EEE7" }}>
                    <span className={clsx("font-serif text-3xl", diag && a > 0.55 ? "text-paper" : "text-ink")}>{v}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-4 min-h-[44px] text-sm text-ink-muted" aria-live="polite">
        {active
          ? <>Actual <b className="text-ink">{labels[active[0]]}</b> → predicted <b className="text-ink">{labels[active[1]]}</b>: <b className="text-ink">{matrix[active[0]][active[1]]}</b> of {rowTotals[active[0]]} ({kind(active[0], active[1])}).</>
          : "Hover or focus a cell for details. Counts are articles in the held-out test split."}
      </figcaption>
    </figure>
  );
}
