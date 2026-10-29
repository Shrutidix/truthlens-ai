import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiBase, getModelInfo, predict } from "@/lib/api";

const ok = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com/"); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("api client", () => {
  it("uses the configured base URL without trailing slash", () => expect(apiBase()).toBe("https://api.example.com"));

  it("never falls back to localhost in production", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", ""); vi.stubEnv("NODE_ENV", "production");
    expect(() => apiBase()).toThrow(/not configured/);
  });

  it("posts JSON and returns the model response unchanged", async () => {
    const payload = { label: "FAKE", confidence: 0.9, probabilities: { REAL: 0.1, FAKE: 0.9 }, top_features: [] };
    const f = vi.spyOn(globalThis, "fetch").mockImplementation(() => ok(payload));
    expect(await predict("some text", "  ")).toEqual(payload);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/api/predict");
    expect(JSON.parse(init.body as string)).toEqual({ text: "some text", title: null });
  });

  it("maps HTTP errors to friendly messages and never fabricates a result", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => ok({ detail: "The model is not available on the server." }, 503));
    await expect(predict("x")).rejects.toMatchObject({ status: 503, message: "The model is not available on the server." });
    vi.spyOn(globalThis, "fetch").mockImplementation(() => ok({}, 429));
    await expect(predict("x")).rejects.toThrow(/Too many requests/);
    vi.spyOn(globalThis, "fetch").mockImplementation(() => ok({ detail: "Invalid request.", errors: [{ field: "text", message: "text must not be empty" }] }, 422));
    await expect(predict("x")).rejects.toThrow(/text must not be empty/);
  });

  it("reports network failure as ApiError", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    await expect(getModelInfo()).rejects.toBeInstanceOf(ApiError);
  });
});
