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

interface ResultsProps {
  data: PredictionResult;
  isLoading?: boolean;
}

export function Results({ data, isLoading = false }: ResultsProps) {
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
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-32 rounded" />
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
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-sm text-zinc-400">Next-day prediction</p>
          <p
            className={`mt-1 text-3xl font-bold ${isUp ? "text-emerald-400" : "text-red-400"}`}
          >
            {isUp ? "↑ UP" : "↓ DOWN"}
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Confidence:{" "}
            <span className="font-medium text-zinc-100">
              {formatPercent(data.confidence)}
            </span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Model accuracy: {formatPercent(data.meta.accuracy)}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="mb-3 text-sm font-medium text-zinc-300">Key indicators</p>
          <dl className="space-y-2 text-sm">
            <Row label="Latest close" value={formatCurrency(latestClose)} />
            <Row label="RSI (14)" value={data.indicators.rsi14.toFixed(1)} />
            <Row label="SMA (20)" value={formatCurrency(data.indicators.sma20)} />
            <Row
              label="1D return"
              value={formatPercent(data.indicators.return1d)}
            />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
