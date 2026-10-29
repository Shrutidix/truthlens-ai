"use client";
import { useCallback, useEffect, useState } from "react";
import { getModelInfo } from "@/lib/api";
import type { ModelInfo } from "@/types/api";

let cache: ModelInfo | null = null;

export function useModelInfo() {
  const [data, setData] = useState<ModelInfo | null>(cache);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cache);
  const load = useCallback(() => {
    setLoading(true); setError(null);
    getModelInfo().then((d) => { cache = d; setData(d); })
      .catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (!cache) load(); }, [load]);
  return { data, error, loading, reload: load };
}
