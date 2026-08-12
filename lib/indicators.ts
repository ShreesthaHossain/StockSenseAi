import type { IndicatorValues, OHLCVBar } from "./types";

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
  "rolling_return_mean_5d",
  "rolling_return_std_5d",
  "rolling_return_mean_10d",
  "rolling_return_std_10d",
  "price_position_10d",
  "price_position_20d",
] as const;

function sma(values: number[], period: number): number {
  const slice = values.slice(-period);
  if (slice.length < period) return NaN;
  return slice.reduce((sum, v) => sum + v, 0) / period;
}

function ema(values: number[], period: number): number {
  if (values.length < period) return NaN;
  const k = 2 / (period + 1);
  let ema = values[0];
  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
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

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function computeMacd(closes: number[]): { macd: number; signal: number; histogram: number } {
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
  const histogram = macdVal - signalVal;

  return { macd: macdVal, signal: signalVal, histogram };
}

function computeAtr(bars: OHLCVBar[], period = 14): number {
  if (bars.length < period + 1) return NaN;

  let trSum = 0;
  for (let i = bars.length - period; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevClose = bars[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trSum += tr;
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
  const variance = slice.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / period;
  const std = Math.sqrt(variance);

  const upper = mean + 2 * std;
  const lower = mean - 2 * std;
  const width = (upper - lower) / mean;
  const position = upper !== lower ? (closes[closes.length - 1] - lower) / (upper - lower) : 0.5;

  return { bbPosition: position, bbWidth: width };
}

function computeObv(volumes: number[], closes: number[]): number {
  if (volumes.length < 2) return 0;

  let obv = volumes[0];
  for (let i = 1; i < volumes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) obv += volumes[i];
    else if (change < 0) obv -= volumes[i];
  }
  return obv;
}

function normalizeObv(obv: number, volumes: number[], closes: number[]): number {
  const recentVolumes = volumes.slice(-20);
  const mean = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
  const std = Math.sqrt(
    recentVolumes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / recentVolumes.length
  );
  return std > 0 ? (obv - mean * closes.length) / (std * Math.sqrt(closes.length)) : 0;
}

export function computeIndicators(bars: OHLCVBar[]): IndicatorValues {
  const closes = bars.map((b) => b.close);
  const volumes = bars.map((b) => b.volume);
  const { macd, signal, histogram } = computeMacd(closes);

  const latestClose = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2];
  const close3Ago = closes[closes.length - 4];
  const close5Ago = closes[closes.length - 6];
  const close7Ago = closes[closes.length - 8];
  const close10Ago = closes[closes.length - 11];
  const close14Ago = closes[closes.length - 15];
  const close20Ago = closes[closes.length - 21];
  const latestVolume = volumes[volumes.length - 1];
  const prevVolume = volumes[volumes.length - 2];

  // Price changes
  const priceChange3d = close3Ago > 0 ? (latestClose - close3Ago) / close3Ago : 0;
  const priceChange7d = close7Ago > 0 ? (latestClose - close7Ago) / close7Ago : 0;
  const priceChange14d = close14Ago > 0 ? (latestClose - close14Ago) / close14Ago : 0;

  // Volatility (standard deviation of returns)
  const returns = closes.map((c, i) => (i > 0 ? (c - closes[i - 1]) / closes[i - 1] : 0));
  const volatility5d = returns.slice(-5).reduce((sum, r, i, arr) => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return sum + Math.pow(r - mean, 2);
  }, 0) / 5;
  const volatility10d = returns.slice(-10).reduce((sum, r, i, arr) => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return sum + Math.pow(r - mean, 2);
  }, 0) / 10;
  const volatility20d = returns.slice(-20).reduce((sum, r, i, arr) => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return sum + Math.pow(r - mean, 2);
  }, 0) / 20;

  // Bollinger Bands
  const { bbPosition, bbWidth } = computeBollingerBands(closes);

  // OBV (normalized)
  const obv = computeObv(volumes, closes);
  const obvNormalized = normalizeObv(obv, volumes, closes);

  // ROC 5-day and 10-day
  const roc5 = close5Ago > 0 ? (latestClose - close5Ago) / close5Ago : 0;
  const roc10 = close10Ago > 0 ? (latestClose - close10Ago) / close10Ago : 0;

  // Volume SMA ratio
  const volumeSma = sma(volumes, 20);
  const volumeSmaRatio = volumeSma > 0 ? latestVolume / volumeSma : 0;

  // ATR
  const atr14 = computeAtr(bars, 14);

  // Lag returns
  const lagReturn1d = prevClose > 0 ? (prevClose - closes[closes.length - 2]) / closes[closes.length - 2] : 0;
  const lagReturn2d = closes.length >= 3 && closes[closes.length - 3] > 0
    ? (prevClose - closes[closes.length - 3]) / closes[closes.length - 3]
    : 0;
  const lagReturn3d = close3Ago > 0 ? (close3Ago - closes[closes.length - 4]) / closes[closes.length - 4] : 0;
  const lagReturn5d = close5Ago > 0 ? (close5Ago - closes[closes.length - 6]) / closes[closes.length - 6] : 0;

  // Rolling return statistics
  const rollingReturns5d = returns.slice(-5);
  const rollingMean5d = rollingReturns5d.reduce((a, b) => a + b, 0) / rollingReturns5d.length;
  const rollingStd5d = Math.sqrt(
    rollingReturns5d.reduce((sum, r) => sum + Math.pow(r - rollingMean5d, 2), 0) / rollingReturns5d.length
  );

  const rollingReturns10d = returns.slice(-10);
  const rollingMean10d = rollingReturns10d.reduce((a, b) => a + b, 0) / rollingReturns10d.length;
  const rollingStd10d = Math.sqrt(
    rollingReturns10d.reduce((sum, r) => sum + Math.pow(r - rollingMean10d, 2), 0) / rollingReturns10d.length
  );

  // Price position (where current price stands relative to recent range)
  const pricePosition10d = close10Ago > 0
    ? (latestClose - Math.min(...closes.slice(-10))) / (Math.max(...closes.slice(-10)) - Math.min(...closes.slice(-10)))
    : 0.5;
  const pricePosition20d = close20Ago > 0
    ? (latestClose - Math.min(...closes.slice(-20))) / (Math.max(...closes.slice(-20)) - Math.min(...closes.slice(-20)))
    : 0.5;

  return {
    sma5: sma(closes, 5),
    sma10: sma(closes, 10),
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    rsi14: computeRsi(closes, 14),
    macd,
    macdSignal: signal,
    macdHistogram: histogram,
    return1d: prevClose > 0 ? (latestClose - prevClose) / prevClose : 0,
    return5d: close5Ago > 0 ? (latestClose - close5Ago) / close5Ago : 0,
    return10d: close10Ago > 0 ? (latestClose - close10Ago) / close10Ago : 0,
    return20d: close20Ago > 0 ? (latestClose - close20Ago) / close20Ago : 0,
    price_change_3d: priceChange3d,
    price_change_7d: priceChange7d,
    price_change_14d: priceChange14d,
    volatility_5d: volatility5d,
    volatility_10d: volatility10d,
    volatility_20d: volatility20d,
    atr14,
    bb_position: bbPosition,
    bb_width: bbWidth,
    volumeChange: prevVolume > 0 ? (latestVolume - prevVolume) / prevVolume : 0,
    volumeSmaRatio,
    obv: obvNormalized,
    roc_5: roc5,
    roc_10: roc10,
    lag_return_1d: lagReturn1d,
    lag_return_2d: lagReturn2d,
    lag_return_3d: lagReturn3d,
    lag_return_5d: lagReturn5d,
    rolling_return_mean_5d: rollingMean5d,
    rolling_return_std_5d: rollingStd5d,
    rolling_return_mean_10d: rollingMean10d,
    rolling_return_std_10d: rollingStd10d,
    price_position_10d: pricePosition10d,
    price_position_20d: pricePosition20d,
  };
}

export function indicatorsToFeatureVector(
  indicators: IndicatorValues
): number[] {
  return FEATURE_ORDER.map((key) => indicators[key]);
}

export function isValidFeatureVector(features: number[]): boolean {
  return features.every((v) => Number.isFinite(v));
}