"""Train Random Forest model on multi-ticker stock data."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from features import FEATURE_ORDER, get_feature_matrix

DEFAULT_TICKERS = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"


def fetch_ticker_data(ticker: str, period: str = "2y") -> pd.DataFrame:
    data = yf.Ticker(ticker).history(period=period)
    if data.empty:
        raise ValueError(f"No data returned for {ticker}")
    data = data.reset_index()
    data["Date"] = pd.to_datetime(data["Date"]).dt.tz_localize(None)
    return data


def main() -> None:
    parser = argparse.ArgumentParser(description="Train StockSense Random Forest")
    parser.add_argument(
        "--tickers",
        nargs="+",
        default=DEFAULT_TICKERS,
        help="Tickers to include in training",
    )
    parser.add_argument("--period", default="2y", help="yfinance history period")
    args = parser.parse_args()

    all_x: list[np.ndarray] = []
    all_y: list[np.ndarray] = []

    for ticker in args.tickers:
        print(f"Fetching {ticker}...")
        df = fetch_ticker_data(ticker, args.period)
        x, y = get_feature_matrix(df)
        print(f"  {ticker}: {len(x)} samples")
        all_x.append(x)
        all_y.append(y)

    x = np.vstack(all_x)
    y = np.concatenate(all_y)

    # Time-series aware split: no shuffle
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, shuffle=False
    )

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(x_train, y_train)

    y_pred = model.predict(x_test)
    accuracy = float(accuracy_score(y_test, y_pred))
    precision = float(precision_score(y_test, y_pred, zero_division=0))
    recall = float(recall_score(y_test, y_pred, zero_division=0))

    print(f"\nAccuracy:  {accuracy:.3f}")
    print(f"Precision: {precision:.3f}")
    print(f"Recall:    {recall:.3f}")

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    model_path = MODELS_DIR / "stock_model.pkl"
    meta_path = MODELS_DIR / "stock_model_meta.json"

    joblib.dump(model, model_path)
    print(f"\nSaved model to {model_path}")

    meta = {
        "featureOrder": FEATURE_ORDER,
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "tickers": args.tickers,
        "samples": int(len(x)),
    }

    meta_path.write_text(json.dumps(meta, indent=2))
    print(f"Saved metadata to {meta_path}")


if __name__ == "__main__":
    main()
