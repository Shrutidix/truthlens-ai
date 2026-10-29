import type { BatchResponse, BatchRow } from "@/types/api";

/** Escape one CSV cell; neutralise spreadsheet formula injection (=,+,-,@). */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function resultsToCsv(res: BatchResponse): string {
  const extra = ["status", "predicted_label", "confidence", "prob_real", "prob_fake", "note"];
  const head = [...res.columns, ...extra].map(csvCell).join(",");
  const lines = res.rows.map((r) =>
    [
      ...res.columns.map((c) => r.data[c]),
      r.status, r.label, r.confidence, r.prob_real, r.prob_fake, r.reason,
    ].map(csvCell).join(","),
  );
  return [head, ...lines].join("\n") + "\n";
}

export type SortKey = "row" | "label" | "confidence" | "status";
export interface TableState { query: string; sortKey: SortKey; sortDir: "asc" | "desc"; page: number; pageSize: number }

export function filterSortPage(rows: BatchRow[], s: TableState) {
  const q = s.query.trim().toLowerCase();
  let out = q
    ? rows.filter((r) => Object.values(r.data).some((v) => (v ?? "").toLowerCase().includes(q)) ||
        (r.label ?? "").toLowerCase().includes(q) || (r.reason ?? "").toLowerCase().includes(q))
    : rows.slice();
  const dir = s.sortDir === "asc" ? 1 : -1;
  out.sort((a, b) => {
    const av = (a[s.sortKey] ?? (s.sortKey === "confidence" ? -1 : "")) as string | number;
    const bv = (b[s.sortKey] ?? (s.sortKey === "confidence" ? -1 : "")) as string | number;
    return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
  });
  const pages = Math.max(1, Math.ceil(out.length / s.pageSize));
  const page = Math.min(s.page, pages - 1);
  return { total: out.length, pages, page, items: out.slice(page * s.pageSize, (page + 1) * s.pageSize) };
}
