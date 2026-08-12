"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface MarketMover {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketMoversResponse {
  data: MarketMover[];
  isMarketOpen: boolean;
  lastUpdated: string;
  error?: string;
}

interface MarketMoversProps {
  onStockSelect?: (ticker: string) => void;
}

export function MarketMovers({ onStockSelect }: MarketMoversProps) {
  const [data, setData] = useState<MarketMoversResponse>({
    data: [],
    isMarketOpen: false,
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketMovers = async () => {
      try {
        const response = await fetch("/api/market-movers");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch market movers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketMovers();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchMarketMovers, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? "+" : "";
    const percentSign = changePercent >= 0 ? "+" : "";
    return `${sign}${formatCurrency(change)} | ${percentSign}${changePercent.toFixed(2)}%`;
  };

  const getChangeColor = (changePercent: number) => {
    return changePercent >= 0 ? "text-emerald-400" : "text-red-400";
  };

  const handleStockClick = (ticker: string) => {
    if (onStockSelect) {
      onStockSelect(ticker);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">Live Top 10 Market Movers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-1.5">
                <div className="h-4 w-12 rounded bg-zinc-800 animate-pulse" />
                <div className="h-3 w-16 rounded bg-zinc-800 animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Live Top 10 Market Movers</CardTitle>
          <Badge variant={data.isMarketOpen ? "success" : "secondary"} className="text-xs">
            {data.isMarketOpen ? "LIVE" : "CLOSED"}
          </Badge>
        </div>
        <p className="text-xs text-zinc-500">
          Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
        </p>
      </CardHeader>
      <CardContent>
        {data.error && (
          <p className="text-xs text-zinc-500">
            {data.error}
          </p>
        )}
        
        {data.data.length === 0 && !data.error ? (
          <p className="text-xs text-zinc-500">No market data available</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {data.data.map((mover) => (
              <button
                key={mover.ticker}
                onClick={() => handleStockClick(mover.ticker)}
                className="w-full flex items-center justify-between py-1.5 text-left hover:bg-zinc-800/30 rounded transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium tabular-nums w-10">{mover.ticker}</span>
                  <span className="text-zinc-400 text-sm">{formatCurrency(mover.price)}</span>
                </div>
                <span className={`text-sm font-medium ${getChangeColor(mover.changePercent)}`}>
                  {formatChange(mover.change, mover.changePercent)}
                </span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}