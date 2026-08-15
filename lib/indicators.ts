import type { IndicatorValues, OHLCVBar } from "./types";

/** Must match scripts/features.py FEATURE_ORDER and models/stock_model_meta.json. */
export const FEATURE_ORDER = [
  "sma5",
  "sma10",
  "sma20",
  "sma50",
  "rsi14",
  "macd",
  "macdSignal",
  "macdHistogram",
  "return1d",
  "return5d",
  "return10d",
  "return20d",
  "price_change_3d",
  "price_change_7d",
  "price_change_14d",
  "volatility_5d",
  "volatility_10d",
  "volatility_20d",
  "atr14",
  "bb_position",
  "bb_width",
  "volumeChange",
  "volumeSmaRatio",
  "obv",
  "roc_5",
  "roc_10",
  "lag_return_1d",
  "lag_return_2d",
  "lag_return_3d",
  "lag_return_5d",
  "lag_return_10d",
  "rolling_return_mean_5d",
  "rolling_return_std_5d",
  "rolling_return_mean_10d",
  "rolling_return_std_10d",
  "rolling_return_mean_20d",
  "rolling_return_std_20d",
  "price_position_10d",
  "price_position_20d",
  "price_position_30d",
  "price_sma20_ratio",
  "sma5_sma20_ratio",
  "rsi_centered",
  "spy_rel_return_5d",
  "spy_rel_return_20d",
] as const;

function sma(values: number[], period: number): number {
  const slice = values.slice(-period);
  if (slice.length < period) return NaN;
  return slice.reduce((sum, v) => sum + v, 0) / period;
}

function stdDev(values: number[]): number {
  if (values.length === 0) return NaN;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function computeRsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return NaN;

  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function computeMacd(closes: number[]): {
  macd: number;
  signal: number;
  histogram: number;
} {
  const emaArr = (data: number[], span: number): number[] => {
    const k = 2 / (span + 1);
    const result: number[] = [data[0]];
    for (let i = 1; i < data.length; i++) {
      result.push(data[i] * k + result[i - 1] * (1 - k));
    }
    return result;
  };

  if (closes.length < 26) return { macd: NaN, signal: NaN, histogram: NaN };

  const ema12 = emaArr(closes, 12);
  const ema26 = emaArr(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = emaArr(macdLine, 9);
  const macdVal = macdLine[macdLine.length - 1];
  const signalVal = signalLine[signalLine.length - 1];
  return {
    macd: macdVal,
    signal: signalVal,
    histogram: macdVal - signalVal,
  };
}

function computeAtr(bars: OHLCVBar[], period = 14): number {
  if (bars.length < period + 1) return NaN;
  let trSum = 0;
  for (let i = bars.length - period; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevClose = bars[i - 1].close;
    trSum += Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
  }
  return trSum / period;
}

function computeBollingerBands(
  closes: number[],
  period = 20
): { bbPosition: number; bbWidth: number } {
  if (closes.length < period) return { bbPosition: NaN, bbWidth: NaN };
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const std = stdDev(slice);
  const upper = mean + 2 * std;
  const lower = mean - 2 * std;
  const width = mean !== 0 ? (upper - lower) / mean : NaN;
  const position =
    upper !== lower ? (closes[closes.length - 1] - lower) / (upper - lower) : 0.5;
  return { bbPosition: position, bbWidth: width };
}

function normalizeObv(obvSeries: number[]): number {
  if (obvSeries.length < 20) return NaN;
  const window = obvSeries.slice(-20);
  const mean = window.reduce((a, b) => a + b, 0) / window.length;
  const std = stdDev(window);
  return std > 0 ? (obvSeries[obvSeries.length - 1] - mean) / std : 0;
}

function pctChange(closes: number[], periods: number, at = -1): number {
  const end = at < 0 ? closes.length + at : at;
  const start = end - periods;
  if (start < 0 || closes[start] <= 0) return NaN;
  return (closes[end] - closes[start]) / closes[start];
}

/** Match Python: closes.pct_change(n).shift(n) at latest bar */
function lagReturn(closes: number[], n: number): number {
  const end = closes.length - 1 - n;
  const start = end - n;
  if (start < 0 || closes[start] <= 0) return NaN;
  return (closes[end] - closes[start]) / closes[start];
}

function pricePosition(closes: number[], period: number): number {
  if (closes.length < period) return NaN;
  const slice = closes.slice(-period);
  const min = Math.min(...slice);
  const max = Math.max(...slice);
  if (max === min) return 0.5;
  return (closes[closes.length - 1] - min) / (max - min);
}

function rollingReturnStats(
  returns: number[],
  period: number
): { mean: number; std: number } {
  if (returns.length < period) return { mean: NaN, std: NaN };
  const slice = returns.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  return { mean, std: stdDev(slice) };
}

export function computeIndicators(
  bars: OHLCVBar[],
  spyBars?: OHLCVBar[]
): IndicatorValues {
  const closes = bars.map((b) => b.close);
  const volumes = bars.map((b) => b.volume);
  const { macd, signal, histogram } = computeMacd(closes);

  const returns = closes.map((c, i) =>
    i > 0 && closes[i - 1] > 0 ? (c - closes[i - 1]) / closes[i - 1] : 0
  );

  const latestVolume = volumes[volumes.length - 1];
  const prevVolume = volumes[volumes.length - 2];

  const obvSeries: number[] = [];
  let runningObv = 0;
  for (let i = 0; i < volumes.length; i++) {
    if (i === 0) runningObv = volumes[0];
    else if (closes[i] > closes[i - 1]) runningObv += volumes[i];
    else if (closes[i] < closes[i - 1]) runningObv -= volumes[i];
    obvSeries.push(runningObv);
  }

  const volumeSma = sma(volumes, 20);
  const roll5 = rollingReturnStats(returns, 5);
  const roll10 = rollingReturnStats(returns, 10);
  const roll20 = rollingReturnStats(returns, 20);
  const { bbPosition, bbWidth } = computeBollingerBands(closes);

  const sma20Val = sma(closes, 20);
  const sma5Val = sma(closes, 5);
  const rsi = computeRsi(closes, 14);
  const return5d = pctChange(closes, 5);
  const return20d = pctChange(closes, 20);

  let spyRel5 = 0;
  let spyRel20 = 0;
  if (spyBars && spyBars.length >= 21) {
    const spyCloses = spyBars.map((b) => b.close);
    const spyRet5 = pctChange(spyCloses, 5);
    const spyRet20 = pctChange(spyCloses, 20);
    if (Number.isFinite(spyRet5)) spyRel5 = return5d - spyRet5;
    if (Number.isFinite(spyRet20)) spyRel20 = return20d - spyRet20;
  }

  return {
    sma5: sma5Val,
    sma10: sma(closes, 10),
    sma20: sma20Val,
    sma50: sma(closes, 50),
    rsi14: rsi,
    macd,
    macdSignal: signal,
    macdHistogram: histogram,
    return1d: pctChange(closes, 1),
    return5d,
    return10d: pctChange(closes, 10),
    return20d,
    price_change_3d: pctChange(closes, 3),
    price_change_7d: pctChange(closes, 7),
    price_change_14d: pctChange(closes, 14),
    volatility_5d: roll5.std,
    volatility_10d: roll10.std,
    volatility_20d: roll20.std,
    atr14: computeAtr(bars, 14),
    bb_position: bbPosition,
    bb_width: bbWidth,
    volumeChange:
      prevVolume > 0 ? (latestVolume - prevVolume) / prevVolume : 0,
    volumeSmaRatio: volumeSma > 0 ? latestVolume / volumeSma : 0,
    obv: normalizeObv(obvSeries),
    roc_5: pctChange(closes, 5),
    roc_10: pctChange(closes, 10),
    lag_return_1d: lagReturn(closes, 1),
    lag_return_2d: lagReturn(closes, 2),
    lag_return_3d: lagReturn(closes, 3),
    lag_return_5d: lagReturn(closes, 5),
    lag_return_10d: lagReturn(closes, 10),
    rolling_return_mean_5d: roll5.mean,
    rolling_return_std_5d: roll5.std,
    rolling_return_mean_10d: roll10.mean,
    rolling_return_std_10d: roll10.std,
    rolling_return_mean_20d: roll20.mean,
    rolling_return_std_20d: roll20.std,
    price_position_10d: pricePosition(closes, 10),
    price_position_20d: pricePosition(closes, 20),
    price_position_30d: pricePosition(closes, 30),
    price_sma20_ratio: sma20Val > 0 ? closes[closes.length - 1] / sma20Val : NaN,
    sma5_sma20_ratio: sma20Val > 0 ? sma5Val / sma20Val : NaN,
    rsi_centered: (rsi - 50) / 50,
    spy_rel_return_5d: spyRel5,
    spy_rel_return_20d: spyRel20,
  };
}

export function indicatorsToFeatureVector(
  indicators: IndicatorValues
): number[] {
  return FEATURE_ORDER.map((key) => indicators[key]);
}

export function isValidFeatureVector(features: number[]): boolean {
  return (
    features.length === FEATURE_ORDER.length &&
    features.every((v) => Number.isFinite(v))
  );
}
