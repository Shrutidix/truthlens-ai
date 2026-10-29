import { describe, expect, it } from "vitest";
import { csvCell, filterSortPage, resultsToCsv } from "@/lib/csv";
import type { BatchResponse, BatchRow } from "@/types/api";

const row = (n: number, text: string, label: "REAL" | "FAKE" | null, conf: number | null): BatchRow => ({
  row: n, status: label ? "ok" : "skipped", reason: label ? null : "Empty text", label, confidence: conf,
  prob_real: null, prob_fake: null, data: { text },
});
const res: BatchResponse = {
  columns: ["text"], summary: { total_rows: 3, predicted: 2, skipped: 1, real: 1, fake: 1 },
  rows: [row(1, 'He said "hi", ok', "REAL", 0.8), row(2, "=HYPERLINK(\"x\")", "FAKE", 0.95), row(3, "", null, null)],
};

describe("csv export", () => {
  it("quotes commas, quotes and newlines", () => expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"'));
  it("neutralises spreadsheet formulas", () => { expect(csvCell("=1+1")).toBe("'=1+1"); expect(csvCell("@cmd")).toBe("'@cmd"); });
  it("exports every row with original + prediction columns", () => {
    const lines = resultsToCsv(res).trim().split("\n");
    expect(lines[0]).toBe("text,status,predicted_label,confidence,prob_real,prob_fake,note");
    expect(lines).toHaveLength(4);
    expect(lines[3]).toContain("skipped");
  });
});

describe("table logic", () => {
  const base = { query: "", sortKey: "row" as const, sortDir: "asc" as const, page: 0, pageSize: 2 };
  it("paginates", () => { const v = filterSortPage(res.rows, base); expect(v.items).toHaveLength(2); expect(v.pages).toBe(2); });
  it("searches across data and labels", () => expect(filterSortPage(res.rows, { ...base, query: "fake" }).items.map((r) => r.row)).toEqual([2]));
  it("sorts by confidence descending with skipped rows last", () =>
    expect(filterSortPage(res.rows, { ...base, sortKey: "confidence", sortDir: "desc", pageSize: 10 }).items.map((r) => r.row)).toEqual([2, 1, 3]));
  it("clamps page index", () => expect(filterSortPage(res.rows, { ...base, page: 99 }).page).toBe(1));
});
