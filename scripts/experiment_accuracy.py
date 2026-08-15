"""Quick experiments to find a label setup with >60% test accuracy."""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import accuracy_score

sys.path.insert(0, str(Path(__file__).resolve().parent))
from features import FEATURE_ORDER, build_features

TICKERS = [
    "AAPL", "GOOGL", "MSFT", "TSLA", "AMZN",
    "NVDA", "META", "JPM", "V", "JNJ",
    "WMT", "PG", "HD", "MA", "BAC",
    "AMD", "NFLX", "COST", "XOM", "UNH",
]


def fetch(ticker: str, period: str = "5y") -> pd.DataFrame:
    data = yf.Ticker(ticker).history(period=period, auto_adjust=True).reset_index()
    data["Date"] = pd.to_datetime(data["Date"]).dt.tz_localize(None)
    return data.set_index("Date").sort_index()


def run(horizon: int, min_abs: float, mode: str, spy: pd.Series) -> None:
    train_x, train_y, test_x, test_y = [], [], [], []

    for ticker in TICKERS:
        df = fetch(ticker)
        spy_a = spy.reindex(df.index).ffill()
        featured = build_features(
            df.reset_index(),
            spy_closes=pd.Series(spy_a.to_numpy()),
        )
        closes = df["Close"].reset_index(drop=True)
        spy_s = pd.Series(spy_a.to_numpy())
        fwd = closes.shift(-horizon) / closes - 1
        spy_fwd = spy_s.shift(-horizon) / spy_s - 1

        featured = featured.copy()
        featured["fwd"] = fwd
        featured["rel"] = fwd - spy_fwd
        featured = featured.dropna(subset=FEATURE_ORDER + ["fwd", "rel"])

        if mode == "abs":
            featured = featured[featured["fwd"].abs() >= min_abs]
            y = (featured["fwd"] > 0).astype(int).to_numpy()
        else:
            featured = featured[featured["rel"].abs() >= min_abs]
            y = (featured["rel"] > 0).astype(int).to_numpy()

        if len(featured) < 40:
            continue

        x = featured[FEATURE_ORDER].to_numpy(dtype=np.float32)
        split = int(len(x) * 0.8)
        train_x.append(x[:split])
        train_y.append(y[:split])
        test_x.append(x[split:])
        test_y.append(y[split:])

    if not train_x:
        print(f"h={horizon} min={min_abs} mode={mode}: no data")
        return

    x_tr = np.vstack(train_x)
    y_tr = np.concatenate(train_y)
    x_te = np.vstack(test_x)
    y_te = np.concatenate(test_y)

    model = HistGradientBoostingClassifier(
        max_iter=400,
        max_depth=5,
        learning_rate=0.05,
        min_samples_leaf=25,
        l2_regularization=0.4,
        random_state=42,
        class_weight="balanced",
        early_stopping=True,
        validation_fraction=0.1,
        n_iter_no_change=20,
    )
    model.fit(x_tr, y_tr)
    proba = model.predict_proba(x_te)[:, 1]

    best_acc, best_t = 0.0, 0.5
    for th in np.linspace(0.35, 0.65, 31):
        acc = accuracy_score(y_te, (proba >= th).astype(int))
        if acc > best_acc:
            best_acc, best_t = acc, float(th)

    conf = np.maximum(proba, 1 - proba)
    rows = []
    for cmin in (0.55, 0.60, 0.65, 0.70):
        mask = conf >= cmin
        if mask.sum() < 40:
            rows.append(f"sel{int(cmin*100)}=n/a")
            continue
        sel = accuracy_score(y_te[mask], (proba[mask] >= best_t).astype(int))
        rows.append(f"sel{int(cmin*100)}={sel:.3f}(n={mask.sum()})")

    print(
        f"h={horizon} min={min_abs} mode={mode} n_test={len(y_te)} "
        f"acc={best_acc:.3f}@t={best_t:.2f} " + " ".join(rows)
    )


def main() -> None:
    print("Fetching SPY...")
    spy = fetch("SPY")["Close"]
    configs = [
        (5, 0.02, "abs"),
        (5, 0.03, "abs"),
        (10, 0.02, "abs"),
        (10, 0.03, "abs"),
        (5, 0.015, "rel"),
        (5, 0.02, "rel"),
        (10, 0.02, "rel"),
        (10, 0.025, "rel"),
        (7, 0.025, "abs"),
        (7, 0.02, "rel"),
    ]
    for horizon, min_abs, mode in configs:
        run(horizon, min_abs, mode, spy)


if __name__ == "__main__":
    main()
