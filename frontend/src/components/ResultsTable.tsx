"use client";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { BatchResponse } from "@/types/api";
import { filterSortPage, SortKey, TableState } from "@/lib/csv";
import LabelBadge from "@/components/ui/LabelBadge";
import { pct } from "@/lib/format";

export default function ResultsTable({ result }: { result: BatchResponse }) {
  const [s, setS] = useState<TableState>({ query: "", sortKey: "row", sortDir: "asc", page: 0, pageSize: 10 });
  const view = useMemo(() => filterSortPage(result.rows, s), [result.rows, s]);
  const sort = (k: SortKey) => setS((p) => ({ ...p, sortKey: k, sortDir: p.sortKey === k && p.sortDir === "asc" ? "desc" : "asc", page: 0 }));
  const Th = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th scope="col" aria-sort={s.sortKey === k ? (s.sortDir === "asc" ? "ascending" : "descending") : "none"} className="whitespace-nowrap px-3 py-2.5 text-left font-medium">
      <button onClick={() => sort(k)} className="inline-flex items-center gap-1 hover:text-sage">{children}
        {s.sortKey === k && (s.sortDir === "asc" ? <ArrowUp size={13} aria-hidden /> : <ArrowDown size={13} aria-hidden />)}</button>
    </th>
  );
  const preview = result.columns.slice(0, 3);
  return (
    <div>
      <div className="relative mb-3 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden />
        <input className="input pl-9" placeholder="Search rows, labels, notes…" aria-label="Search results" value={s.query}
          onChange={(e) => setS((p) => ({ ...p, query: e.target.value, page: 0 }))} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-rule">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-linen text-ink-muted">
            <tr><Th k="row">#</Th>{preview.map((c) => <th key={c} scope="col" className="px-3 py-2.5 text-left font-medium">{c}</th>)}<Th k="status">Status</Th><Th k="label">Label</Th><Th k="confidence">Confidence</Th></tr>
          </thead>
          <tbody>
            {view.items.length === 0 && <tr><td colSpan={preview.length + 4} className="px-3 py-8 text-center text-ink-muted">No rows match your search.</td></tr>}
            {view.items.map((r) => (
              <tr key={r.row} className="border-t border-rule align-top">
                <td className="px-3 py-2.5 font-mono text-ink-muted">{r.row}</td>
                {preview.map((c) => <td key={c} className="max-w-[320px] truncate px-3 py-2.5" title={r.data[c] ?? ""}>{r.data[c] ?? <span className="text-ink-muted">—</span>}</td>)}
                <td className="px-3 py-2.5">{r.status === "ok" ? <span className="text-sage">Predicted</span> : <span className="text-amber">Skipped</span>}</td>
                <td className="px-3 py-2.5">{r.label ? <LabelBadge label={r.label} size="sm" /> : <span className="text-xs text-amber">{r.reason}</span>}</td>
                <td className="px-3 py-2.5 font-mono">{r.confidence != null ? pct(r.confidence) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-ink-muted">
        <span>{view.total} row{view.total === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-2">
          <button className="rounded-md border border-rule p-1.5 disabled:opacity-40" aria-label="Previous page" disabled={view.page === 0} onClick={() => setS((p) => ({ ...p, page: view.page - 1 }))}><ChevronLeft size={16} /></button>
          <span>Page {view.page + 1} of {view.pages}</span>
          <button className="rounded-md border border-rule p-1.5 disabled:opacity-40" aria-label="Next page" disabled={view.page >= view.pages - 1} onClick={() => setS((p) => ({ ...p, page: view.page + 1 }))}><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
