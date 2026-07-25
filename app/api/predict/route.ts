import { NextRequest, NextResponse } from "next/server";
import {
  computeIndicators,
  indicatorsToFeatureVector,
  isValidFeatureVector,
} from "@/lib/indicators";
import { getModelMeta, predict } from "@/lib/inference";
import { fetchStockHistory } from "@/lib/stock";

export async function GET(request: NextRequest) {
  try {
    const ticker = request.nextUrl.searchParams.get("ticker");
    if (!ticker) {
      return NextResponse.json({ error: "Missing ticker" }, { status: 400 });
    }

    const history = await fetchStockHistory(ticker);
    if (history.length < 30) {
      return NextResponse.json({ error: "Not enough data" }, { status: 422 });
    }

    const indicators = computeIndicators(history);
    const features = indicatorsToFeatureVector(indicators);

    if (!isValidFeatureVector(features)) {
      return NextResponse.json({ error: "Invalid features" }, { status: 422 });
    }

    const { trend, confidence } = await predict(features);
    const meta = getModelMeta();

    return NextResponse.json({
      ticker: ticker.toUpperCase(),
      trend,
      confidence,
      indicators,
      history,
      meta: { accuracy: meta.accuracy, trainedAt: meta.trainedAt },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Prediction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
