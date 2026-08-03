import type { IndicatorValues, OHLCVBar } from "./types";

export const FEATURE_ORDER = [
  "sma5",
  "sma10",
  "sma20",
  "rsi14",
  "macd",
  "macdSignal",
  "volumeChange",
  "return1d",
  "return5d",
  "price_change_3d",
  "price_change_7d",
  "price_change_14d",
  "volatility_5d",
  "volatility_10d",
] as const;

function sma(values: number[], period: number): number {
  const slice = values.slice(-period);
  if (slice.length < period) return NaN;
  return slice.reduce((sum, v) => sum + v, 0) / period;
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

function computeMacd(closes: number[]): { macd: number; signal: number } {
  const ema = (data: number[], span: number): number[] => {
    const k = 2 / (span + 1);
    const result: number[] = [data[0]];
    for (let i = 1; i < data.length; i++) {
      result.push(data[i] * k + result[i - 1] * (1 - k));
    }
    return result;
  };

  if (closes.length < 26) return { macd: NaN, signal: NaN };

  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine, 9);

  return {
    macd: macdLine[macdLine.length - 1],
    signal: signalLine[signalLine.length - 1],
  };
}

export function computeIndicators(bars: OHLCVBar[]): IndicatorValues {
  const closes = bars.map((b) => b.close);
  const volumes = bars.map((b) => b.volume);
  const { macd, signal } = computeMacd(closes);

  const latestClose = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2];
  const close5Ago = closes[closes.length - 6];
  const close3Ago = closes[closes.length - 4];
  const close7Ago = closes[closes.length - 8];
  const close14Ago = closes[closes.length - 15];
  const latestVolume = volumes[volumes.length - 1];
  const prevVolume = volumes[volumes.length - 2];

  // Price changes
  const priceChange3d = close3Ago > 0 ? (latestClose - close3Ago) / close3Ago : 0;
  const priceChange7d = close7Ago > 0 ? (latestClose - close7Ago) / close7Ago : 0;
  const priceChange14d = close14Ago > 0 ? (latestClose - close14Ago) / close14Ago : 0;

  // Volatility (standard deviation of returns)
  const returns = closes.map((c, i) => i > 0 ? (c - closes[i-1]) / closes[i-1] : 0);
  const volatility5d = returns.slice(-5).reduce((sum, r, i, arr) => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return sum + Math.pow(r - mean, 2);
  }, 0) / 5;
  const volatility10d = returns.slice(-10).reduce((sum, r, i, arr) => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return sum + Math.pow(r - mean, 2);
  }, 0) / 10;

  return {
    sma5: sma(closes, 5),
    sma10: sma(closes, 10),
    sma20: sma(closes, 20),
    rsi14: computeRsi(closes, 14),
    macd,
    macdSignal: signal,
    volumeChange:
      prevVolume > 0 ? (latestVolume - prevVolume) / prevVolume : 0,
    return1d: prevClose > 0 ? (latestClose - prevClose) / prevClose : 0,
    return5d: close5Ago > 0 ? (latestClose - close5Ago) / close5Ago : 0,
    price_change_3d: priceChange3d,
    price_change_7d: priceChange7d,
    price_change_14d: priceChange14d,
    volatility_5d: volatility5d,
    volatility_10d: volatility10d,
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
