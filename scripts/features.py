"""Feature engineering for StockSense AI — must mirror lib/indicators.ts exactly."""

from __future__ import annotations

import numpy as np
import pandas as pd

FEATURE_ORDER = [
    "sma5",
    "sma10",
    "sma20",
    "rsi14",
    "macd",
    "macdSignal",
    "volumeChange",
    "return1d",
    "return5d",
]


def compute_rsi(closes: pd.Series, period: int = 14) -> pd.Series:
    delta = closes.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(window=period, min_periods=period).mean()
    avg_loss = loss.rolling(window=period, min_periods=period).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def compute_macd(closes: pd.Series) -> tuple[pd.Series, pd.Series]:
    ema12 = closes.ewm(span=12, adjust=False).mean()
    ema26 = closes.ewm(span=26, adjust=False).mean()
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    return macd_line, signal_line


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Build feature matrix from OHLCV dataframe."""
    data = df.copy()
    data.columns = [c.lower() for c in data.columns]

    closes = data["close"]
    volumes = data["volume"]

    data["sma5"] = closes.rolling(window=5, min_periods=5).mean()
    data["sma10"] = closes.rolling(window=10, min_periods=10).mean()
    data["sma20"] = closes.rolling(window=20, min_periods=20).mean()
    data["rsi14"] = compute_rsi(closes, 14)
    data["macd"], data["macdSignal"] = compute_macd(closes)
    data["volumeChange"] = volumes.pct_change()
    data["return1d"] = closes.pct_change()
    data["return5d"] = closes.pct_change(5)

    # Target: 1 if next-day close > today close, else 0
    data["target"] = (closes.shift(-1) > closes).astype(int)

    return data


def get_feature_matrix(df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
    featured = build_features(df)
    featured = featured.dropna(subset=FEATURE_ORDER + ["target"])

    x = featured[FEATURE_ORDER].values.astype(np.float32)
    y = featured["target"].values.astype(np.int64)
    return x, y
