import type { IndicatorValues } from "./types";

interface Explanation {
  trend: "up" | "down";
  reasons: string[];
  keyIndicators: string[];
}

export function generateExplanation(
  indicators: IndicatorValues,
  trend: "up" | "down"
): Explanation {
  const reasons: string[] = [];
  const keyIndicators: string[] = [];

  // Price position analysis
  if (indicators.price_position_20d > 0.7) {
    if (trend === "up") {
      reasons.push("Price is in the upper 30% of the 20-day range, indicating bullish momentum");
    } else {
      reasons.push("Price is in the upper 30% of the 20-day range but model predicts a reversal");
    }
    keyIndicators.push("price_position_20d");
  } else if (indicators.price_position_20d < 0.3) {
    if (trend === "down") {
      reasons.push("Price is in the lower 30% of the 20-day range, indicating bearish momentum");
    } else {
      reasons.push("Price is in the lower 30% of the 20-day range but model predicts a bounce");
    }
    keyIndicators.push("price_position_20d");
  }

  // RSI analysis
  if (indicators.rsi14 > 70) {
    if (trend === "down") {
      reasons.push("RSI is overbought (>70), suggesting potential price correction");
    } else {
      reasons.push("RSI is overbought but model expects continued strength");
    }
    keyIndicators.push("rsi14");
  } else if (indicators.rsi14 < 30) {
    if (trend === "up") {
      reasons.push("RSI is oversold (<30), suggesting potential price rebound");
    } else {
      reasons.push("RSI is oversold but model expects further decline");
    }
    keyIndicators.push("rsi14");
  }

  // MACD analysis
  if (indicators.macd > indicators.macdSignal && trend === "up") {
    reasons.push("MACD line is above signal line, confirming bullish trend");
    keyIndicators.push("macd", "macdSignal");
  } else if (indicators.macd < indicators.macdSignal && trend === "down") {
    reasons.push("MACD line is below signal line, confirming bearish trend");
    keyIndicators.push("macd", "macdSignal");
  }

  // Moving averages
  if (indicators.sma5 > indicators.sma20 && trend === "up") {
    reasons.push("Short-term SMA (5) is above medium-term SMA (20), bullish crossover");
    keyIndicators.push("sma5", "sma20");
  } else if (indicators.sma5 < indicators.sma20 && trend === "down") {
    reasons.push("Short-term SMA (5) is below medium-term SMA (20), bearish crossover");
    keyIndicators.push("sma5", "sma20");
  }

  // Volume analysis
  if (indicators.volumeSmaRatio > 1.2 && trend === "up") {
    reasons.push("Volume is above average, confirming price movement validity");
    keyIndicators.push("volumeSmaRatio");
  } else if (indicators.volumeSmaRatio < 0.8 && trend === "down") {
    reasons.push("Volume is below average, suggesting weak price movement");
    keyIndicators.push("volumeSmaRatio");
  }

  // Return rate analysis
  if (indicators.return5d > 0.05 && trend === "up") {
    reasons.push("Strong 5-day return (+5%+), indicating positive momentum");
    keyIndicators.push("return5d");
  } else if (indicators.return5d < -0.05 && trend === "down") {
    reasons.push("Strong 5-day return (-5%+), indicating negative momentum");
    keyIndicators.push("return5d");
  }

  // Bollinger Bands
  if (indicators.bb_position > 0.8 && trend === "up") {
    reasons.push("Price near upper Bollinger Band, showing strong momentum");
    keyIndicators.push("bb_position");
  } else if (indicators.bb_position < 0.2 && trend === "down") {
    reasons.push("Price near lower Bollinger Band, showing weak momentum");
    keyIndicators.push("bb_position");
  }

  // ATR (volatility)
  if (indicators.atr14 > 0) {
    const atrPercent = (indicators.atr14 / indicators.sma20) * 100;
    if (atrPercent > 2) {
      reasons.push(`High volatility (${atrPercent.toFixed(1)}% ATR) increases prediction uncertainty`);
      keyIndicators.push("atr14");
    }
  }

  // Ensure we have at least one reason
  if (reasons.length === 0) {
    if (trend === "up") {
      reasons.push("Model predicts bullish trend based on technical indicator patterns");
    } else {
      reasons.push("Model predicts bearish trend based on technical indicator patterns");
    }
  }

  return {
    trend,
    reasons,
    keyIndicators: [...new Set(keyIndicators)].slice(0, 3),
  };
}