"""Push for >60% via stricter moves + selective confidence."""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

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


def collect(horizon: int, min_abs: float, spy: pd.Series):
    train_x, train_y, test_x, test_y = [], [], [], []
    for ticker in TICKERS:
        df = fetch(ticker)
        spy_a = spy.reindex(df.index).ffill()
        featured = build_features(df.reset_index(), spy_closes=pd.Series(spy_a.to_numpy()))
        closes = df["Close"].reset_index(drop=True)
        fwd = closes.shift(-horizon) / closes - 1
        featured = featured.copy()
        featured["fwd"] = fwd
        featured = featured.dropna(subset=FEATURE_ORDER + ["fwd"])
        featured = featured[featured["fwd"].abs() >= min_abs]
        if len(featured) < 30:
            continue
        x = featured[FEATURE_ORDER].to_numpy(dtype=np.float32)
        y = (featured["fwd"] > 0).astype(int).to_numpy()
        split = int(len(x) * 0.8)
        train_x.append(x[:split]); train_y.append(y[:split])
        test_x.append(x[split:]); test_y.append(y[split:])
    return (
        np.vstack(train_x), np.concatenate(train_y),
        np.vstack(test_x), np.concatenate(test_y),
    )


def eval_model(name, model, x_tr, y_tr, x_te, y_te):
    model.fit(x_tr, y_tr)
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(x_te)[:, 1]
    else:
        proba = model.decision_function(x_te)
        proba = 1 / (1 + np.exp(-proba))

    best_acc, best_t = 0.0, 0.5
    for th in np.linspace(0.3, 0.7, 41):
        acc = accuracy_score(y_te, (proba >= th).astype(int))
        if acc > best_acc:
            best_acc, best_t = acc, float(th)

    conf = np.maximum(proba, 1 - proba)
    print(f"\n{name}: n_test={len(y_te)} full_acc={best_acc:.3f}@t={best_t:.2f}")
    for cmin in (0.60, 0.65, 0.70, 0.75, 0.80):
        mask = conf >= cmin
        n = int(mask.sum())
        if n < 30:
            print(f"  conf>={cmin:.2f}: too few ({n})")
            continue
        sel = accuracy_score(y_te[mask], (proba[mask] >= best_t).astype(int))
        coverage = n / len(y_te)
        print(f"  conf>={cmin:.2f}: acc={sel:.3f} n={n} coverage={coverage:.1%}")


def main():
    print("Fetching SPY...")
    spy = fetch("SPY")["Close"]

    for horizon, min_abs in [(10, 0.04), (10, 0.05), (5, 0.04), (15, 0.05), (20, 0.06)]:
        print(f"\n===== horizon={horizon} min_move={min_abs} =====")
        x_tr, y_tr, x_te, y_te = collect(horizon, min_abs, spy)
        models = [
            ("HGB", HistGradientBoostingClassifier(
                max_iter=500, max_depth=4, learning_rate=0.03,
                min_samples_leaf=30, l2_regularization=0.5, random_state=42,
                class_weight="balanced", early_stopping=True,
                validation_fraction=0.1, n_iter_no_change=25,
            )),
            ("RF", RandomForestClassifier(
                n_estimators=300, max_depth=8, min_samples_leaf=15,
                class_weight="balanced", random_state=42, n_jobs=-1,
            )),
            ("LogReg", Pipeline([
                ("scaler", StandardScaler()),
                ("clf", LogisticRegression(max_iter=1000, class_weight="balanced", C=0.3)),
            ])),
        ]
        for name, model in models:
            eval_model(name, model, x_tr, y_tr, x_te, y_te)


if __name__ == "__main__":
    main()
