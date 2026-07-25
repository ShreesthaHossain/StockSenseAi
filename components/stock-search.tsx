"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StockSearchProps {
  ticker: string;
  onTickerChange: (value: string) => void;
  onSearch: (overrideTicker?: string) => void;
  loading?: boolean;
}

const POPULAR_TICKERS = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"];

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
        <Input
          placeholder="Enter ticker (e.g. AAPL)"
          value={ticker}
          onChange={(e) => onTickerChange(e.target.value.toUpperCase())}
          className="uppercase"
        />
        <Button type="submit" disabled={loading || !ticker.trim()}>
          <Search className="mr-2 h-4 w-4" />
          Analyze
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
          >
            {symbol}
          </Button>
        ))}
      </div>
    </div>
  );
}
