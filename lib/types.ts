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
  sma50: number;
  rsi14: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  return1d: number;
  return5d: number;
  return10d: number;
  return20d: number;
  price_change_3d: number;
  price_change_7d: number;
  price_change_14d: number;
  volatility_5d: number;
  volatility_10d: number;
  volatility_20d: number;
  atr14: number;
  bb_position: number;
  bb_width: number;
  volumeChange: number;
  volumeSmaRatio: number;
  obv: number;
  roc_5: number;
  roc_10: number;
  lag_return_1d: number;
  lag_return_2d: number;
  lag_return_3d: number;
  lag_return_5d: number;
  rolling_return_mean_5d: number;
  rolling_return_std_5d: number;
  rolling_return_mean_10d: number;
  rolling_return_std_10d: number;
  price_position_10d: number;
  price_position_20d: number;
}

export interface PredictionExplanation {
  trend: "up" | "down";
  reasons: string[];
  keyIndicators: string[];
}

export interface PredictionResult {
  ticker: string;
  trend: "up" | "down";
  confidence: number;
  indicators: IndicatorValues;
  history: OHLCVBar[];
  meta: ModelMeta;
  explanation?: PredictionExplanation;
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