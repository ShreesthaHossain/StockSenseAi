"""Feature engineering for StockSense AI " must mirror lib/indicators.ts exactly."""

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
    "price_change_3d",
    "price_change_7d",
    "price_change_14d",
    "volatility_5d",
    "volatility_10d",
    "bb_position",
    "bb_width",
    "obv",
    "roc_5",
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


def compute_bollinger_bands(closes: pd.Series, period: int = 20) -> tuple[pd.Series, pd.Series, pd.Series]:
    sma = closes.rolling(window=period, min_periods=period).mean()
    std = closes.rolling(window=period, min_periods=period).std()
    upper = sma + 2 * std
    lower = sma - 2 * std
    width = (upper - lower) / sma
    position = (closes - lower) / (upper - lower).replace(0, np.nan)
    return upper, lower, width, position


def compute_obv(volumes: pd.Series, closes: pd.Series) -> pd.Series:
    direction = np.sign(closes.diff())
    obv = (volumes * direction).fillna(0).cumsum()
    return obv


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

    # Target: 1 if close 3 days ahead > today close, else 0
    data["target"] = (closes.shift(-3) > closes).astype(int)

    # Additional features
    data["price_change_3d"] = closes.pct_change(3)
    data["price_change_7d"] = closes.pct_change(7)
    data["price_change_14d"] = closes.pct_change(14)
    data["volatility_5d"] = closes.pct_change().rolling(window=5).std()
    data["volatility_10d"] = closes.pct_change().rolling(window=10).std()

    # Bollinger Bands
    _, _, bb_width, bb_position = compute_bollinger_bands(closes)
    data["bb_width"] = bb_width
    data["bb_position"] = bb_position

    # On-Balance Volume
    data["obv"] = compute_obv(volumes, closes)
    # Normalize OBV to percentage change relative to its mean
    obv_mean = data["obv"].rolling(window=20, min_periods=20).mean()
    obv_std = data["obv"].rolling(window=20, min_periods=20).std()
    data["obv"] = (data["obv"] - obv_mean) / obv_std.replace(0, np.nan)

    # Rate of Change 5-day
    data["roc_5"] = closes.pct_change(5)

    return data


def get_feature_matrix(df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
    featured = build_features(df)
    featured = featured.dropna(subset=FEATURE_ORDER + ["target"])

    x = featured[FEATURE_ORDER].values.astype(np.float32)
    y = featured["target"].values.astype(np.int64)
    return x, y
