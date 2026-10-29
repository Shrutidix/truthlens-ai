import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AnalyzePage from "@/app/analyze/page";
import ConfusionMatrix from "@/components/ConfusionMatrix";

vi.mock("recharts", () => {
  const Null = () => null;
  return { ResponsiveContainer: ({ children }: any) => <div>{children}</div>, BarChart: Null, Bar: Null, Cell: Null, XAxis: Null, YAxis: Null, Tooltip: Null };
});

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com"));
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("Analyzer workflow", () => {
  it("validates empty input without calling the API", async () => {
    const f = vi.spyOn(globalThis, "fetch");
    render(<AnalyzePage />);
    await userEvent.click(screen.getByRole("button", { name: /analyze article/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/enter some article text/i);
    expect(f).not.toHaveBeenCalled();
  });

  it("renders exactly what the API returned", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      label: "FAKE", confidence: 0.9123, probabilities: { REAL: 0.0877, FAKE: 0.9123 },
      top_features: [{ token: "shocking", contribution: 0.31, direction: "FAKE" }],
    }), { status: 200 }));
    render(<AnalyzePage />);
    await userEvent.type(screen.getByLabelText(/article text/i), "SHOCKING news");
    await userEvent.click(screen.getByRole("button", { name: /analyze article/i }));
    await waitFor(() => expect(screen.getAllByText("91.2%").length).toBeGreaterThan(0));
    expect(screen.getByText("8.8%")).toBeInTheDocument();
    expect(screen.getByText("shocking")).toBeInTheDocument();
    expect(screen.getByText(/not independent verification/i)).toBeInTheDocument();
  });

  it("shows an error (no fake result) when the API fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("down"));
    render(<AnalyzePage />);
    await userEvent.type(screen.getByLabelText(/article text/i), "hello world");
    await userEvent.click(screen.getByRole("button", { name: /analyze article/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not reach/i);
    expect(screen.queryByText(/model prediction/i)).not.toBeInTheDocument();
  });
});

describe("ConfusionMatrix", () => {
  it("labels axes and exposes counts accessibly", () => {
    render(<ConfusionMatrix labels={["REAL", "FAKE"]} matrix={[[40, 0], [0, 40]]} />);
    expect(screen.getByText("PREDICTED")).toBeInTheDocument();
    expect(screen.getByText("ACTUAL")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: /actual REAL, predicted REAL: 40/i })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: /actual REAL, predicted FAKE: 0/i })).toBeInTheDocument();
  });
});
