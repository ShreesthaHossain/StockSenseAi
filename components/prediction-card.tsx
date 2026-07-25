"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ModelMeta } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

interface PredictionCardProps {
  ticker: string;
  trend: "up" | "down";
  confidence: number;
  meta: ModelMeta;
}

export function PredictionCard({
  ticker,
  trend,
  confidence,
  meta,
}: PredictionCardProps) {
  const isUp = trend === "up";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          AI Prediction
          <Badge variant={isUp ? "success" : "danger"}>
            {isUp ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3" />
            )}
            {trend.toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription>
          Random Forest forecast for {ticker} next-day trend
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-zinc-400">Confidence</span>
            <span className="font-medium">{formatPercent(confidence)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all ${
                isUp ? "bg-emerald-500" : "bg-red-500"
              }`}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-zinc-950/50 p-3">
            <p className="text-zinc-500">Model Accuracy</p>
            <p className="text-lg font-semibold">
              {formatPercent(meta.accuracy)}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-950/50 p-3">
            <p className="text-zinc-500">Training Samples</p>
            <p className="text-lg font-semibold">{meta.samples.toLocaleString()}</p>
          </div>
        </div>

        <p className="text-xs text-zinc-500">
          Trained on {meta.tickers.join(", ")} ·{" "}
          {new Date(meta.trainedAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
