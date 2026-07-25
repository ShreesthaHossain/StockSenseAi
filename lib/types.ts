export interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorValues {
  sma5: number;
  sma10: number;
  sma20: number;
  rsi14: number;
  macd: number;
  macdSignal: number;
  volumeChange: number;
  return1d: number;
  return5d: number;
}

export interface PredictionResult {
  ticker: string;
  trend: "up" | "down";
  confidence: number;
  indicators: IndicatorValues;
  history: OHLCVBar[];
  meta: { accuracy: number; trainedAt: string };
}

export interface ModelMeta {
  featureOrder: string[];
  accuracy: number;
  precision: number;
  recall: number;
  trainedAt: string;
  tickers: string[];
  samples: number;
}
