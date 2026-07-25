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
    <div className="flex items-center justify-between py-2 text-sm">
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
        <IndicatorRow label="SMA (5)" value={indicators.sma5} format="currency" />
        <IndicatorRow label="SMA (10)" value={indicators.sma10} format="currency" />
        <IndicatorRow label="SMA (20)" value={indicators.sma20} format="currency" />
        <IndicatorRow label="RSI (14)" value={indicators.rsi14} />
        <IndicatorRow label="MACD" value={indicators.macd} />
        <IndicatorRow label="MACD Signal" value={indicators.macdSignal} />
        <IndicatorRow
          label="Volume Change"
          value={indicators.volumeChange}
          format="percent"
        />
        <IndicatorRow
          label="1D Return"
          value={indicators.return1d}
          format="percent"
        />
        <IndicatorRow
          label="5D Return"
          value={indicators.return5d}
          format="percent"
        />
      </CardContent>
    </Card>
  );
}
