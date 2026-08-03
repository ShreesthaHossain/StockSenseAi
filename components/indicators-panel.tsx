"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { IndicatorValues } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface IndicatorsPanelProps {
  indicators: IndicatorValues;
  latestClose: number;
}

const INDICATOR_ROWS = [
  { label: "SMA (5)", key: "sma5" as const, format: "currency" as const },
  { label: "SMA (10)", key: "sma10" as const, format: "currency" as const },
  { label: "SMA (20)", key: "sma20" as const, format: "currency" as const },
  { label: "RSI (14)", key: "rsi14" as const, format: "number" as const },
  { label: "MACD", key: "macd" as const, format: "number" as const },
  { label: "MACD Signal", key: "macdSignal" as const, format: "number" as const },
  { label: "Volume Change", key: "volumeChange" as const, format: "percent" as const },
  { label: "1D Return", key: "return1d" as const, format: "percent" as const },
  { label: "5D Return", key: "return5d" as const, format: "percent" as const },
  { label: "3D Price Change", key: "price_change_3d" as const, format: "percent" as const },
  { label: "7D Price Change", key: "price_change_7d" as const, format: "percent" as const },
  { label: "14D Price Change", key: "price_change_14d" as const, format: "percent" as const },
  { label: "Volatility (5d)", key: "volatility_5d" as const, format: "percent" as const },
  { label: "Volatility (10d)", key: "volatility_10d" as const, format: "percent" as const },
  { label: "BB Position", key: "bb_position" as const, format: "number" as const },
  { label: "BB Width", key: "bb_width" as const, format: "number" as const },
  { label: "OBV (norm)", key: "obv" as const, format: "number" as const },
  { label: "ROC (5d)", key: "roc_5" as const, format: "percent" as const },
];

function IndicatorRow({
  label,
  value,
  format = "number",
}: {
  label: string;
  value: number;
  format?: "number" | "percent" | "currency";
}) {
  const formatted =
    format === "percent"
      ? formatPercent(value)
      : format === "currency"
        ? formatCurrency(value)
        : value.toFixed(2);

  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium tabular-nums">{formatted}</span>
    </div>
  );
}

export function IndicatorsPanel({
  indicators,
  latestClose,
}: IndicatorsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Technical Indicators</CardTitle>
        <CardDescription>
          Latest close: {formatCurrency(latestClose)}
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-zinc-800">
        {INDICATOR_ROWS.map((row) => (
          <IndicatorRow
            key={row.key}
            label={row.label}
            value={indicators[row.key]}
            format={row.format}
          />
        ))}
      </CardContent>
    </Card>
  );
}
