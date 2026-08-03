"use client";

import { useCallback, useEffect, useState } from "react";
import { Results } from "@/components/results";
import { StockSearch } from "@/components/stock-search";
import type { PredictionResult } from "@/lib/types";

export default function DashboardPage() {
  const [ticker, setTicker] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const analyze = useCallback(async (symbol?: string) => {
    const t = (symbol ?? ticker).trim().toUpperCase();
    if (!t) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/predict?ticker=${t}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data);
      setTicker(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    void analyze("AAPL");
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 px-6 py-5">
        <h1 className="text-xl font-bold">StockSense AI</h1>
        <p className="text-sm text-zinc-400">
          Random Forest stock trend prediction
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6">
          <StockSearch
            ticker={ticker}
            onTickerChange={setTicker}
            onSearch={analyze}
            loading={loading}
          />
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {result && <Results data={result} isLoading={loading} />}
      </main>
    </div>
  );
}
