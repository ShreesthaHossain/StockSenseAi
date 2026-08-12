"""Train gradient boosting model on multi-ticker stock data."""

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
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    precision_score,
    recall_score,
)
from sklearn.model_selection import RandomizedSearchCV, train_test_split
from scipy.stats import uniform, randint

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from features import FEATURE_ORDER, get_feature_matrix

DEFAULT_TICKERS = [
    "AAPL", "GOOGL", "MSFT", "TSLA", "AMZN",
    "NVDA", "META", "JPM", "V", "JNJ",
    "WMT", "PG", "HD", "MA", "BAC",
]
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"


def fetch_ticker_data(ticker: str, period: str = "3y") -> pd.DataFrame:
    data = yf.Ticker(ticker).history(period=period)
    if data.empty:
        raise ValueError(f"No data returned for {ticker}")
    data = data.reset_index()
    data["Date"] = pd.to_datetime(data["Date"]).dt.tz_localize(None)
    return data


def main() -> None:
    parser = argparse.ArgumentParser(description="Train StockSense Gradient Boosting")
    parser.add_argument(
        "--tickers",
        nargs="+",
        default=DEFAULT_TICKERS,
        help="Tickers to include in training",
    )
    parser.add_argument("--period", default="2y", help="yfinance history period")
    parser.add_argument(
        "--tune",
        action="store_true",
        help="Run hyperparameter tuning (slower but more accurate)",
    )
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

    print(f"\nTotal samples: {len(x)}")
    print(f"Class distribution: down={int(np.sum(y == 0))}, up={int(np.sum(y == 1))}")
    print(f"Features: {x.shape[1]}")

    # Time-series aware split: no shuffle
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, shuffle=False
    )

    if args.tune:
        print("\nRunning hyperparameter tuning...")
        param_distributions = {
            "max_iter": [200, 300, 500, 800],
            "max_depth": [3, 4, 5, 6, 8, 10],
            "learning_rate": uniform(0.01, 0.3),
            "min_samples_leaf": randint(5, 30),
            "max_bins": [255],
            "l2_regularization": uniform(0, 1),
            "max_features": ["sqrt", "log2", None],
        }

        search = RandomizedSearchCV(
            HistGradientBoostingClassifier(
                random_state=42,
                early_stopping=True,
                validation_fraction=0.1,
                n_iter_no_change=20,
            ),
            param_distributions,
            n_iter=20,
            cv=3,
            scoring="accuracy",
            random_state=42,
            n_jobs=-1,
        )
        search.fit(x_train, y_train)
        model = search.best_estimator_
        print(f"Best params: {search.best_params_}")
        print(f"Best CV score: {search.best_score_:.4f}")
    else:
        model = HistGradientBoostingClassifier(
            max_iter=500,
            max_depth=6,
            learning_rate=0.05,
            min_samples_leaf=10,
            max_bins=255,
            l2_regularization=0.1,
            random_state=42,
            early_stopping=True,
            validation_fraction=0.1,
            n_iter_no_change=20,
        )
        model.fit(x_train, y_train)

    y_pred = model.predict(x_test)
    accuracy = float(accuracy_score(y_test, y_pred))
    precision = float(precision_score(y_test, y_pred, zero_division=0))
    recall = float(recall_score(y_test, y_pred, zero_division=0))

    print(f"\nAccuracy:  {accuracy:.3f}")
    print(f"Precision: {precision:.3f}")
    print(f"Recall:    {recall:.3f}")
    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["down", "up"]))

    # Feature importances
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        sorted_idx = np.argsort(importances)[::-1]
        print("\nTop 15 Feature Importances:")
        for idx in sorted_idx[:15]:
            print(f"  {FEATURE_ORDER[idx]:25s} {importances[idx]:.4f}")

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
        "modelType": "HistGradientBoosting",
        "numFeatures": len(FEATURE_ORDER),
    }

    meta_path.write_text(json.dumps(meta, indent=2))
    print(f"Saved metadata to {meta_path}")


if __name__ == "__main__":
    main()
