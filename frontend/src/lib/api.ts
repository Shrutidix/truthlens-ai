import type { BatchResponse, ModelInfo, PredictResponse } from "@/types/api";

export class ApiError extends Error {
  constructor(message: string, public status?: number) { super(message); this.name = "ApiError"; }
}

/** Resolve the API base URL. Production never falls back to localhost. */
export function apiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (env) return env;
  if (process.env.NODE_ENV !== "production") return "http://localhost:8000";
  throw new ApiError("The API URL is not configured (NEXT_PUBLIC_API_URL).");
}

function messageFrom(status: number, body: any): string {
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status === 503) return body?.detail || "The model service is unavailable right now.";
  if (status === 422 && Array.isArray(body?.errors) && body.errors.length)
    return body.errors.map((e: any) => e.message).join("; ");
  if (typeof body?.detail === "string") return body.detail;
  return `The request failed (HTTP ${status}).`;
}

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = 30000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${apiBase()}${path}`, { ...init, signal: ctrl.signal });
    let body: any = null;
    try { body = await res.json(); } catch { /* non-JSON */ }
    if (!res.ok) throw new ApiError(messageFrom(res.status, body), res.status);
    return body as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as Error).name === "AbortError")
      throw new ApiError("The request timed out. The server may be waking up; please try again.");
    throw new ApiError("Could not reach the analysis server. Please try again shortly.");
  } finally { clearTimeout(timer); }
}

export const getModelInfo = () => request<ModelInfo>("/api/model-info");

export const predict = (text: string, title?: string) =>
  request<PredictResponse>("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, title: title?.trim() ? title : null }),
  });

/** XHR so we can report real upload progress. */
export function predictBatch(file: File, onProgress?: (pct: number) => void): Promise<BatchResponse> {
  return new Promise((resolve, reject) => {
    let url: string;
    try { url = `${apiBase()}/api/predict/batch`; } catch (e) { return reject(e); }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = 120000;
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      let body: any = null;
      try { body = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as BatchResponse);
      else reject(new ApiError(messageFrom(xhr.status, body), xhr.status));
    };
    xhr.onerror = () => reject(new ApiError("Could not reach the analysis server. Please try again shortly."));
    xhr.ontimeout = () => reject(new ApiError("The upload timed out. Please try a smaller file."));
    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}
