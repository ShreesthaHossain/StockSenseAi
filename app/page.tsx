"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Results } from "@/components/results";
import { StockSearch } from "@/components/stock-search";
import { ErrorAlert } from "@/components/error-alert";
import type { PredictionResult } from "@/lib/types";

export default function DashboardPage() {
  const [ticker, setTicker] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const isMountedRef = useRef(false);
  const hasInitialLoadRef = useRef(false);

  const analyze = useCallback(async (symbol?: string, skipLoading = false) => {
    const t = (symbol ?? ticker).trim().toUpperCase();
    if (!t) return;

    if (!skipLoading) {
      setLoading(true);
      setError(null);
    }

    try {
      const res = await fetch(`/api/predict?ticker=${t}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      if (isMountedRef.current) {
        setResult(data);
        setTicker(t);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setResult(null);
      }
    } finally {
      if (isMountedRef.current && !skipLoading) {
        setLoading(false);
      }
    }
  }, [ticker]);

  const handleRetry = () => {
    setError(null);
    analyze();
  };

  const handleStockSelect = useCallback((selectedTicker: string) => {
    analyze(selectedTicker);
  }, [analyze]);

  useEffect(() => {
    isMountedRef.current = true;
    // Initial load - skip loading state to avoid synchronous setState
    if (!hasInitialLoadRef.current) {
      hasInitialLoadRef.current = true;
      void analyze("AAPL", true);
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [analyze]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 px-6 py-5">
        <h1 className="text-xl font-bold">StockSense AI</h1>
        <p className="text-sm text-zinc-400">
          {result?.meta?.modelType
            ? `${result.meta.modelType} stock trend prediction`
            : "AI-powered stock trend prediction"}
          {result?.meta?.predictionHorizonDays != null
            ? ` · ${result.meta.predictionHorizonDays}-day horizon`
            : ""}
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
          <ErrorAlert error={error} onRetry={handleRetry} />
        )}

        {!error && result && (
          <Results 
            data={result} 
            isLoading={loading} 
            onStockSelect={handleStockSelect}
          />
        )}
      </main>
    </div>
  );
}