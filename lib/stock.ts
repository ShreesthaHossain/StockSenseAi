import type { OHLCVBar } from "./types";

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }>;
      };
    }>;
    error?: { description?: string };
  };
}

export async function fetchStockHistory(ticker: string): Promise<OHLCVBar[]> {
  const symbol = ticker.trim().toUpperCase();
  if (!symbol) throw new Error("Invalid ticker");

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1y&interval=1d`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 300 },
  });

  if (!response.ok) throw new Error(`Failed to fetch ${symbol}`);

  const data = (await response.json()) as YahooChartResponse;
  const result = data.chart?.result?.[0];
  if (!result) {
    throw new Error(data.chart?.error?.description ?? `No data for ${symbol}`);
  }

  const timestamps = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0];
  if (!quote?.close) throw new Error(`No prices for ${symbol}`);

  const bars: OHLCVBar[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const open = quote.open?.[i];
    const close = quote.close?.[i];
    if (open == null || close == null) continue;
    bars.push({
      date: new Date(timestamps[i] * 1000).toISOString().split("T")[0],
      open,
      high: quote.high?.[i] ?? close,
      low: quote.low?.[i] ?? close,
      close,
      volume: quote.volume?.[i] ?? 0,
    });
  }

  return bars;
}
