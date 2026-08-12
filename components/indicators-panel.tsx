"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { IndicatorValues } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface IndicatorsPanelProps {
  indicators: IndicatorValues;
  latestClose: number;
}

// Most important indicators shown by default
const PRIMARY_INDICATORS = [
  { label: "SMA (20)", key: "sma20" as const, format: "currency" as const },
  { label: "RSI (14)", key: "rsi14" as const, format: "number" as const },
  { label: "MACD", key: "macd" as const, format: "number" as const },
  { label: "Volume Change", key: "volumeChange" as const, format: "percent" as const },
  { label: "1D Return", key: "return1d" as const, format: "percent" as const },
];

// All other indicators shown when "Show more" is clicked
const ALL_INDICATORS = [
  { label: "SMA (5)", key: "sma5" as const, format: "currency" as const },
  { label: "SMA (10)", key: "sma10" as const, format: "currency" as const },
  { label: "SMA (50)", key: "sma50" as const, format: "currency" as const },
  { label: "MACD Signal", key: "macdSignal" as const, format: "number" as const },
  { label: "MACD Hist", key: "macdHistogram" as const, format: "number" as const },
  { label: "5D Return", key: "return5d" as const, format: "percent" as const },
  { label: "10D Return", key: "return10d" as const, format: "percent" as const },
  { label: "20D Return", key: "return20d" as const, format: "percent" as const },
  { label: "3D Price Change", key: "price_change_3d" as const, format: "percent" as const },
  { label: "7D Price Change", key: "price_change_7d" as const, format: "percent" as const },
  { label: "14D Price Change", key: "price_change_14d" as const, format: "percent" as const },
  { label: "Volatility (5d)", key: "volatility_5d" as const, format: "percent" as const },
  { label: "Volatility (10d)", key: "volatility_10d" as const, format: "percent" as const },
  { label: "Volatility (20d)", key: "volatility_20d" as const, format: "percent" as const },
  { label: "ATR (14)", key: "atr14" as const, format: "currency" as const },
  { label: "BB Position", key: "bb_position" as const, format: "number" as const },
  { label: "BB Width", key: "bb_width" as const, format: "number" as const },
  { label: "Volume/SMA Ratio", key: "volumeSmaRatio" as const, format: "number" as const },
  { label: "OBV (norm)", key: "obv" as const, format: "number" as const },
  { label: "ROC (5d)", key: "roc_5" as const, format: "percent" as const },
  { label: "ROC (10d)", key: "roc_10" as const, format: "percent" as const },
  { label: "Lag Return (1d)", key: "lag_return_1d" as const, format: "percent" as const },
  { label: "Lag Return (3d)", key: "lag_return_3d" as const, format: "percent" as const },
  { label: "Lag Return (5d)", key: "lag_return_5d" as const, format: "percent" as const },
  { label: "Rolling Return Mean (5d)", key: "rolling_return_mean_5d" as const, format: "percent" as const },
  { label: "Rolling Return Std (5d)", key: "rolling_return_std_5d" as const, format: "percent" as const },
  { label: "Price Position (10d)", key: "price_position_10d" as const, format: "number" as const },
  { label: "Price Position (20d)", key: "price_position_20d" as const, format: "number" as const },
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
      : value.toFixed(4);

  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium tabular-nums">{formatted}</span>
    </div>
  );
}

export function IndicatorsPanel({
  indicators,
  latestClose,
}: IndicatorsPanelProps) {
  const [showAll, setShowAll] = useState(false);

  const displayedIndicators = showAll ? ALL_INDICATORS : PRIMARY_INDICATORS;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Technical Indicators</CardTitle>
        <CardDescription>
          Latest close: {formatCurrency(latestClose)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-zinc-800">
          {displayedIndicators.map((row) => (
            <IndicatorRow
              key={row.key}
              label={row.label}
              value={indicators[row.key]}
              format={row.format}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="mt-2 w-full justify-center text-xs text-zinc-400 hover:text-zinc-200"
        >
          {showAll ? "Show less" : "Show more"}
        </Button>
      </CardContent>
    </Card>
  );
}