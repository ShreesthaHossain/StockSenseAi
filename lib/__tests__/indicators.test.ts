import { computeIndicators, indicatorsToFeatureVector, isValidFeatureVector } from '../indicators';
import type { OHLCVBar } from '../types';

describe('computeIndicators', () => {
  const createMockBars = (count: number): OHLCVBar[] => {
    const bars: OHLCVBar[] = [];
    for (let i = 0; i < count; i++) {
      bars.push({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        open: 100 + i,
        high: 105 + i,
        low: 95 + i,
        close: 100 + i,
        volume: 1000000 + i * 1000,
      });
    }
    return bars;
  };

  it('should return valid indicators for sufficient data', () => {
    const bars = createMockBars(50);
    const indicators = computeIndicators(bars);

    expect(indicators).toBeDefined();
    expect(typeof indicators.sma5).toBe('number');
    expect(typeof indicators.rsi14).toBe('number');
    expect(typeof indicators.macd).toBe('number');
  });

  it('should return NaN for insufficient data', () => {
    const bars = createMockBars(10);
    const indicators = computeIndicators(bars);

    expect(isNaN(indicators.rsi14)).toBe(true);
  });

  it('should compute all 36 features', () => {
    const bars = createMockBars(50);
    const indicators = computeIndicators(bars);

    const expectedKeys = [
      'sma5', 'sma10', 'sma20', 'sma50',
      'rsi14', 'macd', 'macdSignal', 'macdHistogram',
      'return1d', 'return5d', 'return10d', 'return20d',
      'price_change_3d', 'price_change_7d', 'price_change_14d',
      'volatility_5d', 'volatility_10d', 'volatility_20d',
      'atr14', 'bb_position', 'bb_width',
      'volumeChange', 'volumeSmaRatio', 'obv',
      'roc_5', 'roc_10',
      'lag_return_1d', 'lag_return_2d', 'lag_return_3d', 'lag_return_5d',
      'rolling_return_mean_5d', 'rolling_return_std_5d',
      'rolling_return_mean_10d', 'rolling_return_std_10d',
      'price_position_10d', 'price_position_20d'
    ];

    expectedKeys.forEach(key => {
      expect(indicators[key as keyof typeof indicators]).toBeDefined();
    });
  });
});

describe('indicatorsToFeatureVector', () => {
  it('should return an array of 36 features', () => {
    const bars = Array.from({ length: 50 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      open: 100 + i,
      high: 105 + i,
      low: 95 + i,
      close: 100 + i,
      volume: 1000000 + i * 1000,
    }));

    const indicators = computeIndicators(bars);
    const features = indicatorsToFeatureVector(indicators);

    expect(features.length).toBe(36);
    expect(features.every(f => typeof f === 'number')).toBe(true);
  });
});

describe('isValidFeatureVector', () => {
  it('should return true for valid features', () => {
    const features = Array(36).fill(0.5);
    expect(isValidFeatureVector(features)).toBe(true);
  });

  it('should return false for features with NaN', () => {
    const features = Array(36).fill(0.5);
    features[0] = NaN;
    expect(isValidFeatureVector(features)).toBe(false);
  });

  it('should return false for features with Infinity', () => {
    const features = Array(36).fill(0.5);
    features[0] = Infinity;
    expect(isValidFeatureVector(features)).toBe(false);
  });
});