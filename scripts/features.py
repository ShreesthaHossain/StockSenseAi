"""Feature engineering for StockSense AI — must mirror lib/indicators.ts exactly."""

from __future__ import annotations

import numpy as np
import pandas as pd

# Prediction: direction of a meaningful move over HORIZON trading days.
HORIZON_DAYS = 20
MIN_MOVE = 0.06  # keep clearer ≥6% moves (stronger signal)

FEATURE_ORDER = [
    "sma5",
    "sma10",
    "sma20",
    "sma50",
    "rsi14",
    "macd",
    "macdSignal",
    "macdHistogram",
    "return1d",
    "return5d",
    "return10d",
    "return20d",
    "price_change_3d",
    "price_change_7d",
    "price_change_14d",
    "volatility_5d",
    "volatility_10d",
    "volatility_20d",
    "atr14",
    "bb_position",
    "bb_width",
    "volumeChange",
    "volumeSmaRatio",
    "obv",
    "roc_5",
    "roc_10",
    "lag_return_1d",
    "lag_return_2d",
    "lag_return_3d",
    "lag_return_5d",
    "lag_return_10d",
    "rolling_return_mean_5d",
    "rolling_return_std_5d",
    "rolling_return_mean_10d",
    "rolling_return_std_10d",
    "rolling_return_mean_20d",
    "rolling_return_std_20d",
    "price_position_10d",
    "price_position_20d",
    "price_position_30d",
    # High-signal additions
    "price_sma20_ratio",
    "sma5_sma20_ratio",
    "rsi_centered",
    "spy_rel_return_5d",
    "spy_rel_return_20d",
]


def compute_rsi(closes: pd.Series, period: int = 14) -> pd.Series:
    delta = closes.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(window=period, min_periods=period).mean()
    avg_loss = loss.rolling(window=period, min_periods=period).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def compute_macd(closes: pd.Series) -> tuple[pd.Series, pd.Series, pd.Series]:
    ema12 = closes.ewm(span=12, adjust=False).mean()
    ema26 = closes.ewm(span=26, adjust=False).mean()
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def compute_bollinger_bands(
    closes: pd.Series, period: int = 20
) -> tuple[pd.Series, pd.Series, pd.Series, pd.Series]:
    sma = closes.rolling(window=period, min_periods=period).mean()
    std = closes.rolling(window=period, min_periods=period).std()
    upper = sma + 2 * std
    lower = sma - 2 * std
    width = (upper - lower) / sma
    position = (closes - lower) / (upper - lower).replace(0, np.nan)
    return upper, lower, width, position


def compute_atr(
    high: pd.Series, low: pd.Series, closes: pd.Series, period: int = 14
) -> pd.Series:
    tr1 = high - low
    tr2 = (high - closes.shift(1)).abs()
    tr3 = (low - closes.shift(1)).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=period, min_periods=period).mean()


def compute_obv(volumes: pd.Series, closes: pd.Series) -> pd.Series:
    direction = np.sign(closes.diff())
    return (volumes * direction).fillna(0).cumsum()


def build_features(
    df: pd.DataFrame,
    spy_closes: pd.Series | None = None,
) -> pd.DataFrame:
    """Build feature matrix from OHLCV dataframe."""
    data = df.copy()
    data.columns = [c.lower() for c in data.columns]

    closes = data["close"]
    high = data["high"]
    low = data["low"]
    volumes = data["volume"]

    data["sma5"] = closes.rolling(window=5, min_periods=5).mean()
    data["sma10"] = closes.rolling(window=10, min_periods=10).mean()
    data["sma20"] = closes.rolling(window=20, min_periods=20).mean()
    data["sma50"] = closes.rolling(window=50, min_periods=50).mean()

    data["rsi14"] = compute_rsi(closes, 14)
    data["macd"], data["macdSignal"], data["macdHistogram"] = compute_macd(closes)
    data["return1d"] = closes.pct_change()
    data["return5d"] = closes.pct_change(5)
    data["return10d"] = closes.pct_change(10)
    data["return20d"] = closes.pct_change(20)

    # Meaningful-move label over HORIZON_DAYS
    fwd = closes.shift(-HORIZON_DAYS) / closes - 1.0
    data["fwd_return"] = fwd
    data["target"] = (fwd > 0).astype(int)

    data["price_change_3d"] = closes.pct_change(3)
    data["price_change_7d"] = closes.pct_change(7)
    data["price_change_14d"] = closes.pct_change(14)

    data["volatility_5d"] = closes.pct_change().rolling(window=5).std()
    data["volatility_10d"] = closes.pct_change().rolling(window=10).std()
    data["volatility_20d"] = closes.pct_change().rolling(window=20).std()
    data["atr14"] = compute_atr(high, low, closes, 14)

    _, _, bb_width, bb_position = compute_bollinger_bands(closes)
    data["bb_width"] = bb_width
    data["bb_position"] = bb_position

    data["volumeChange"] = volumes.pct_change()
    data["volumeSmaRatio"] = volumes / volumes.rolling(window=20, min_periods=20).mean()
    obv_raw = compute_obv(volumes, closes)
    obv_mean = obv_raw.rolling(window=20, min_periods=20).mean()
    obv_std = obv_raw.rolling(window=20, min_periods=20).std()
    data["obv"] = (obv_raw - obv_mean) / obv_std.replace(0, np.nan)

    data["roc_5"] = closes.pct_change(5)
    data["roc_10"] = closes.pct_change(10)

    data["lag_return_1d"] = closes.pct_change(1).shift(1)
    data["lag_return_2d"] = closes.pct_change(2).shift(2)
    data["lag_return_3d"] = closes.pct_change(3).shift(3)
    data["lag_return_5d"] = closes.pct_change(5).shift(5)
    data["lag_return_10d"] = closes.pct_change(10).shift(10)

    returns = closes.pct_change()
    data["rolling_return_mean_5d"] = returns.rolling(window=5, min_periods=5).mean()
    data["rolling_return_std_5d"] = returns.rolling(window=5, min_periods=5).std()
    data["rolling_return_mean_10d"] = returns.rolling(window=10, min_periods=10).mean()
    data["rolling_return_std_10d"] = returns.rolling(window=10, min_periods=10).std()
    data["rolling_return_mean_20d"] = returns.rolling(window=20, min_periods=20).mean()
    data["rolling_return_std_20d"] = returns.rolling(window=20, min_periods=20).std()

    rolling_max_10 = closes.rolling(window=10, min_periods=10).max()
    rolling_min_10 = closes.rolling(window=10, min_periods=10).min()
    data["price_position_10d"] = (closes - rolling_min_10) / (
        rolling_max_10 - rolling_min_10
    ).replace(0, np.nan)

    rolling_max_20 = closes.rolling(window=20, min_periods=20).max()
    rolling_min_20 = closes.rolling(window=20, min_periods=20).min()
    data["price_position_20d"] = (closes - rolling_min_20) / (
        rolling_max_20 - rolling_min_20
    ).replace(0, np.nan)

    rolling_max_30 = closes.rolling(window=30, min_periods=30).max()
    rolling_min_30 = closes.rolling(window=30, min_periods=30).min()
    data["price_position_30d"] = (closes - rolling_min_30) / (
        rolling_max_30 - rolling_min_30
    ).replace(0, np.nan)

    data["price_sma20_ratio"] = closes / data["sma20"]
    data["sma5_sma20_ratio"] = data["sma5"] / data["sma20"]
    data["rsi_centered"] = (data["rsi14"] - 50.0) / 50.0

    if spy_closes is not None and len(spy_closes) > 0:
        spy_vals = np.asarray(spy_closes, dtype=float).ravel()
        if len(spy_vals) == len(closes):
            spy = pd.Series(spy_vals, index=closes.index)
        else:
            spy = pd.Series(spy_vals).reindex(range(len(closes))).ffill()
            spy.index = closes.index
        spy_ret_5 = spy.pct_change(5)
        spy_ret_20 = spy.pct_change(20)
        data["spy_rel_return_5d"] = data["return5d"] - spy_ret_5
        data["spy_rel_return_20d"] = data["return20d"] - spy_ret_20
    else:
        data["spy_rel_return_5d"] = 0.0
        data["spy_rel_return_20d"] = 0.0

    return data


def get_feature_matrix(
    df: pd.DataFrame,
    spy_closes: pd.Series | None = None,
    min_move: float = MIN_MOVE,
) -> tuple[np.ndarray, np.ndarray, pd.DataFrame]:
    featured = build_features(df, spy_closes=spy_closes)
    featured = featured.dropna(subset=FEATURE_ORDER + ["target", "fwd_return"])

    # Keep only meaningful moves (clearer signal → higher accuracy)
    featured = featured[featured["fwd_return"].abs() >= min_move]

    x = featured[FEATURE_ORDER].values.astype(np.float32)
    y = featured["target"].values.astype(np.int64)
    return x, y, featured
