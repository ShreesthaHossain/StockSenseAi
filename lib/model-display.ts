import type { ModelMeta } from "./types";

/** Canonical display helpers — values always come from stock_model_meta / API. */

export function formatModelName(meta?: ModelMeta | null): string {
  return meta?.modelType?.trim() || "Unknown model";
}

export function formatPredictionHorizon(meta?: ModelMeta | null): string {
  const days = meta?.predictionHorizonDays;
  if (days == null) return "See model metadata";
  const move =
    meta?.minMove != null
      ? ` (≥${(meta.minMove * 100).toFixed(1)}% moves)`
      : "";
  return `${days} trading days${move}`;
}

export function formatLabelDescription(meta?: ModelMeta | null): string {
  return meta?.labelDescription?.trim() || formatPredictionHorizon(meta);
}
