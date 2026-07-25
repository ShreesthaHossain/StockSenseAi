"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OHLCVBar } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PriceChartProps {
  data: OHLCVBar[];
  ticker: string;
}

export function PriceChart({ data, ticker }: PriceChartProps) {
  const chartData = data.map((bar) => ({
    date: bar.date,
    close: bar.close,
    label: formatDate(bar.date),
  }));

  const minPrice = Math.min(...chartData.map((d) => d.close)) * 0.98;
  const maxPrice = Math.max(...chartData.map((d) => d.close)) * 1.02;

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="label"
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis
            domain={[minPrice, maxPrice]}
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              color: "#fafafa",
            }}
            formatter={(value) => [formatCurrency(Number(value)), `${ticker} Close`]}
            labelFormatter={(label) => String(label)}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#priceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
