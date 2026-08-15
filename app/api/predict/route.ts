import { NextRequest, NextResponse } from "next/server";
import {
  computeIndicators,
  indicatorsToFeatureVector,
  isValidFeatureVector,
} from "@/lib/indicators";
import { getModelMeta, predict } from "@/lib/inference";
import { fetchStockHistory } from "@/lib/stock";
import { generateExplanation } from "@/lib/explanation";

export async function GET(request: NextRequest) {
  try {
    const ticker = request.nextUrl.searchParams.get("ticker");
    if (!ticker) {
      return NextResponse.json(
        { error: "Missing ticker", code: "MISSING_TICKER" },
        { status: 400 }
      );
    }

    const trimmedTicker = ticker.trim().toUpperCase();
    if (!/^[A-Z]{1,5}$/.test(trimmedTicker)) {
      return NextResponse.json(
        { error: "Invalid ticker format. Use 1-5 uppercase letters (e.g., AAPL, GOOGL)", code: "INVALID_TICKER" },
        { status: 400 }
      );
    }

    let history;
    let spyHistory;
    try {
      [history, spyHistory] = await Promise.all([
        fetchStockHistory(trimmedTicker),
        fetchStockHistory("SPY"),
      ]);
    } catch (fetchError) {
      return NextResponse.json(
        { error: "Unable to fetch stock data. Please check the ticker symbol.", code: "FETCH_ERROR" },
        { status: 502 }
      );
    }

    if (!history || history.length === 0) {
      return NextResponse.json(
        { error: "No historical data found for this ticker.", code: "NO_DATA" },
        { status: 422 }
      );
    }

    if (history.length < 60) {
      return NextResponse.json(
        { error: `Not enough data (${history.length} days available). Need at least 60 days.`, code: "INSUFFICIENT_DATA" },
        { status: 422 }
      );
    }

    const indicators = computeIndicators(history, spyHistory);
    const features = indicatorsToFeatureVector(indicators);

    if (!isValidFeatureVector(features)) {
      return NextResponse.json(
        { error: "Unable to calculate technical indicators for this stock.", code: "INVALID_FEATURES" },
        { status: 422 }
      );
    }

    const { trend, confidence } = await predict(features);
    const meta = getModelMeta();
    const explanation = generateExplanation(indicators, trend);

    const response = NextResponse.json({
      ticker: trimmedTicker,
      trend,
      confidence,
      indicators,
      history,
      meta,
      explanation,
    });

    // Production optimizations
    response.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
    response.headers.set("Vary", "Accept-Encoding");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Prediction failed";
    
    // Log the actual error for debugging
    console.error("Prediction error:", error);
    
    const response = NextResponse.json(
      { error: "An unexpected error occurred. Please try again later.", code: "SERVER_ERROR" },
      { status: 500 }
    );
    
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("X-Content-Type-Options", "nosniff");
    
    return response;
  }
}