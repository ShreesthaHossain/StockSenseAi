"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";

interface TrendMeterProps {
  trend: "up" | "down";
  confidence: number;
}

export function TrendMeter({ trend, confidence }: TrendMeterProps) {
  const isUp = trend === "up";
  const confidencePercent = Math.min(confidence * 100, 100);

  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isUp ? (
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-400" />
            )}
            <span className="text-lg font-semibold">
              {isUp ? "Bullish" : "Bearish"}
            </span>
          </div>
          <Badge variant={isUp ? "success" : "danger"} className="text-xs">
            {formatPercent(confidence)}
          </Badge>
        </div>

        <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isUp
                ? "bg-gradient-to-r from-emerald-500 to-green-400"
                : "bg-gradient-to-r from-red-500 to-rose-400"
            }`}
            style={{ width: `${confidencePercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-2">
            <span className="text-xs text-zinc-500">0%</span>
            <span className="text-xs text-zinc-500">50%</span>
            <span className="text-xs text-zinc-500">100%</span>
          </div>
        </div>

        <div className="mt-2 flex justify-between text-xs text-zinc-500">
          <span>Bearish</span>
          <span>Bullish</span>
        </div>
      </CardContent>
    </Card>
  );
}