"use client";

import { useCallback, useEffect, useState } from "react";
import { Results } from "@/components/results";
import type { PredictionResult } from "@/lib/types";

const QUICK_PICKS = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"];

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
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && analyze()}
            placeholder="Ticker e.g. AAPL"
            className="h-10 w-40 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={() => analyze()}
            disabled={loading}
            className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "Analyzing…" : "Analyze"}
          </button>
          <div className="flex gap-2">
            {QUICK_PICKS.map((s) => (
              <button
                key={s}
                onClick={() => analyze(s)}
                disabled={loading}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {result && !loading && <Results data={result} />}
      </main>
    </div>
  );
}
