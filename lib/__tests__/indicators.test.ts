import {
  FEATURE_ORDER,
  computeIndicators,
  indicatorsToFeatureVector,
  isValidFeatureVector,
} from "../indicators";
import type { OHLCVBar } from "../types";

function createMockBars(count: number): OHLCVBar[] {
  const bars: OHLCVBar[] = [];
  for (let i = 0; i < count; i++) {
    bars.push({
      date: `2024-01-${String(i + 1).padStart(2, "0")}`,
      open: 100 + i,
      high: 105 + i,
      low: 95 + i,
      close: 100 + i,
      volume: 1000000 + i * 1000,
    });
  }
  return bars;
}

describe("computeIndicators", () => {
  it("should return valid indicators for sufficient data", () => {
    const bars = createMockBars(60);
    const indicators = computeIndicators(bars);
    expect(typeof indicators.sma5).toBe("number");
    expect(typeof indicators.price_sma20_ratio).toBe("number");
  });

  it("should compute all features in FEATURE_ORDER", () => {
    const bars = createMockBars(60);
    const indicators = computeIndicators(bars);
    FEATURE_ORDER.forEach((key) => {
      expect(indicators[key]).toBeDefined();
    });
  });
});

describe("indicatorsToFeatureVector", () => {
  it("should return the expected feature count", () => {
    const bars = createMockBars(60);
    const features = indicatorsToFeatureVector(computeIndicators(bars));
    expect(features.length).toBe(FEATURE_ORDER.length);
  });
});

describe("isValidFeatureVector", () => {
  it("should return true for valid features", () => {
    expect(isValidFeatureVector(Array(FEATURE_ORDER.length).fill(0.5))).toBe(
      true
    );
  });

  it("should return false for wrong length", () => {
    expect(isValidFeatureVector(Array(10).fill(0.5))).toBe(false);
  });
});
