"use client";

import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StockSearchProps {
  ticker: string;
  onTickerChange: (value: string) => void;
  onSearch: (overrideTicker?: string) => void;
  loading?: boolean;
}

const POPULAR_TICKERS = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA", "META", "JPM", "V", "JNJ", "WMT", "PG", "HD", "MA", "BAC"];

export function StockSearch({
  ticker,
  onTickerChange,
  onSearch,
  loading,
}: StockSearchProps) {
  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Input
            placeholder="Enter ticker (e.g. AAPL)"
            value={ticker}
            onChange={(e) => onTickerChange(e.target.value.toUpperCase())}
            className="uppercase pr-10"
            disabled={loading}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            </div>
          )}
        </div>
        <Button type="submit" disabled={loading || !ticker.trim()}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Analyze
            </>
          )}
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {POPULAR_TICKERS.map((symbol) => (
          <Button
            key={symbol}
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => {
              onTickerChange(symbol);
              onSearch(symbol);
            }}
            className="transition-all duration-200 hover:scale-105"
          >
            {symbol}
          </Button>
        ))}
      </div>
    </div>
  );
}