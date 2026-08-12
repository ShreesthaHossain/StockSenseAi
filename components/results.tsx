"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PredictionResult } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PredictionCard } from "@/components/prediction-card";
import { IndicatorsPanel } from "@/components/indicators-panel";
import { TrendMeter } from "@/components/trend-meter";
import { MarketMovers } from "@/components/market-movers";

interface ResultsProps {
  data: PredictionResult;
  isLoading?: boolean;
  onStockSelect?: (ticker: string) => void;
}

export function Results({ data, isLoading = false, onStockSelect }: ResultsProps) {
  const isUp = data.trend === "up";
  const chartData = data.history.map((bar) => ({
    date: bar.date.slice(5),
    close: bar.close,
  }));
  const latestClose = data.history.at(-1)?.close ?? 0;

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="mb-4 h-6 w-48 rounded" />
          <Skeleton className="aspect-[4/3] rounded-xl border border-zinc-800 bg-zinc-900/50" />
          <Skeleton className="mt-4 h-24 w-full rounded-xl border border-zinc-800 bg-zinc-900/50" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-40 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-8 w-20 rounded" />
          <Skeleton className="aspect-[2/1] rounded-xl border border-zinc-800 bg-zinc-900/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 lg:col-span-2">
        <h2 className="mb-4 text-lg font-semibold">
          {data.ticker} — Price Chart
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
              <YAxis
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `$${v}`}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: 8,
                }}
                formatter={(v) => [formatCurrency(Number(v)), "Close"]}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <TrendMeter trend={data.trend} confidence={data.confidence} />

        <div className="mt-6">
          <PredictionCard
            ticker={data.ticker}
            trend={data.trend}
            confidence={data.confidence}
            meta={data.meta}
            explanation={data.explanation}
          />
        </div>
      </div>

      <div className="space-y-4">
        <MarketMovers onStockSelect={onStockSelect} />
        <IndicatorsPanel
          indicators={data.indicators}
          latestClose={latestClose}
        />
      </div>
    </div>
  );
}