"use client";

import { TrendingDown, TrendingUp, Loader2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ModelMeta, PredictionExplanation } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

interface PredictionCardProps {
  ticker: string;
  trend: "up" | "down";
  confidence: number;
  meta: ModelMeta;
  explanation?: PredictionExplanation;
  isLoading?: boolean;
}

export function PredictionCard({
  ticker,
  trend,
  confidence,
  meta,
  explanation,
  isLoading = false,
}: PredictionCardProps) {
  const isUp = trend === "up";

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            AI Prediction
            <div className="h-6 w-20 rounded-full bg-zinc-800 animate-pulse" />
          </CardTitle>
          <CardDescription className="h-4 w-48 rounded bg-zinc-800 animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 w-24 rounded bg-zinc-800 animate-pulse" />
          <div className="h-8 w-full rounded-full bg-zinc-800 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 w-full rounded-lg bg-zinc-900/50 animate-pulse" />
            <div className="h-12 w-full rounded-lg bg-zinc-900/50 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          AI Prediction
          <Badge variant={isUp ? "success" : "danger"} className="text-xs">
            {isUp ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3" />
            )}
            {trend.toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
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
              className={`h-full rounded-full transition-all duration-500 ${
                isUp ? "bg-emerald-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.min(confidence * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-zinc-950/50 p-3">
            <p className="text-zinc-500 text-xs">Model Accuracy</p>
            <p className="text-lg font-semibold">
              {formatPercent(meta.accuracy)}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-950/50 p-3">
            <p className="text-zinc-500 text-xs">Training Samples</p>
            <p className="text-lg font-semibold">{meta.samples.toLocaleString()}</p>
          </div>
        </div>

        <p className="text-xs text-zinc-500">
          Trained on {meta.tickers.slice(0, 5).join(", ")}
          {meta.tickers.length > 5 ? ` +${meta.tickers.length - 5} more` : ""}
          · {new Date(meta.trainedAt).toLocaleDateString()}
        </p>

        {/* AI Explanation Section */}
        {explanation && (
          <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-900/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-zinc-400" />
              <span className="text-xs font-medium text-zinc-300">
                Why {isUp ? "Bullish" : "Bearish"}?
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              {explanation.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="mt-0.5 text-emerald-400">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
            {explanation.keyIndicators.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {explanation.keyIndicators.map((indicator) => (
                  <Badge key={indicator} variant="secondary" className="text-xs">
                    {indicator}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prediction Information Row */}
        <div className="mt-4 flex flex-col gap-1 text-xs text-zinc-500">
          <div className="flex justify-between">
            <span className="text-zinc-400">Data source:</span>
            <span className="font-medium">Yahoo Finance</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Model:</span>
            <span className="font-medium">Random Forest</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Prediction horizon:</span>
            <span className="font-medium">Next trading day</span>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-900/30 p-3">
          <p className="text-xs text-zinc-400">
            ⚠️ This prediction is intended for educational purposes only and should not be considered financial or investment advice. Always do your own research before making any investment decisions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}