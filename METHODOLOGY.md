# StockSense AI - Methodology & Workflow

## 1. Introduction

StockSense AI is a serverless stock trend prediction system that combines machine learning with modern web technologies. The system employs a two-phase architecture: an offline training phase using Python and scikit-learn, and an online inference phase running entirely in the browser using ONNX Runtime Web.

---

## 2. Overall Architecture

```
+-----------------------------------------------------------------------------+
¦                           STOCKSENSE AI ARCHITECTURE                         ¦
+-----------------------------------------------------------------------------¦
¦                                                                              ¦
¦  +--------------+     +--------------+     +--------------+                 ¦
¦  ¦   USER       ¦----?¦   API        ¦----?¦   DATA       ¦                 ¦
¦  ¦   BROWSER    ¦     ¦   ENDPOINT   ¦     ¦   FETCH      ¦                 ¦
¦  +--------------+     +--------------+     +--------------+                 ¦
¦           ¦                   ¦                   ¦                        ¦
¦           ¦                   ¦                   ?                        ¦
¦           ¦                   ¦         +------------------+                 ¦
¦           ¦                   ¦         ¦   Yahoo Finance  ¦                 ¦
¦           ¦                   ¦         ¦   API (1y data)  ¦                 ¦
¦           ¦                   ¦         +------------------+                 ¦
¦           ¦                   ¦                   ¦                        ¦
¦           ¦                   ¦                   ?                        ¦
¦           ¦                   ¦         +------------------+                 ¦
¦           ¦                   ¦         ¦   INDICATORS     ¦                 ¦
¦           ¦                   ¦         ¦   COMPUTATION    ¦                 ¦
¦           ¦                   ¦         ¦   (18 features)  ¦                 ¦
¦           ¦                   ¦         +------------------+                 ¦
¦           ¦                   ¦                   ¦                        ¦
¦           ¦                   ¦                   ?                        ¦
¦           ¦                   ¦         +------------------+                 ¦
¦           ¦                   ¦         ¦   ONNX MODEL     ¦                 ¦
¦           ¦                   ¦         ¦   INFERENCE      ¦                 ¦
¦           ¦                   ¦         ¦   (Browser WASM) ¦                 ¦
¦           ¦                   ¦         +------------------+                 ¦
¦           ¦                   ¦                   ¦                        ¦
¦           ¦                   ¦                   ?                        ¦
¦           ¦?------------------+---------¦   RESPONSE       ¦                 ¦
¦           ¦                   ¦         ¦   {trend,        ¦                 ¦
¦           ¦                   ¦         ¦    confidence,   ¦                 ¦
¦           ¦                   ¦         ¦    indicators}   ¦                 ¦
¦           ¦                   ¦         +------------------+                 ¦
¦                                                                              ¦
+-----------------------------------------------------------------------------+
```

---

## 3. Training Phase (Offline)

### 3.1 Data Collection

**Source**: Yahoo Finance API via `yfinance` Python library

**Process**:
- Fetch historical OHLCV (Open, High, Low, Close, Volume) data
- Default: 3 years of daily data for multiple tickers
- Default tickers: AAPL, GOOGL, MSFT, TSLA, AMZN, NVDA, META
- Data is fetched using `yf.Ticker(ticker).history(period="3y")`

**Output**: Pandas DataFrame with columns: Date, Open, High, Low, Close, Volume

### 3.2 Feature Engineering

**Location**: `scripts/features.py`

**Feature Set** (18 features, must mirror `lib/indicators.ts` exactly):

| Feature | Description | Calculation |
|---------|-------------|-------------|
| `sma5` | 5-day Simple Moving Average | Mean of last 5 closing prices |
| `sma10` | 10-day Simple Moving Average | Mean of last 10 closing prices |
| `sma20` | 20-day Simple Moving Average | Mean of last 20 closing prices |
| `rsi14` | 14-day Relative Strength Index | 100 - (100 / (1 + RS)) where RS = avg_gain/avg_loss |
| `macd` | MACD Line | EMA(12) - EMA(26) |
| `macdSignal` | MACD Signal Line | EMA(9) of MACD line |
| `volumeChange` | Volume Change | (Current Volume - Previous Volume) / Previous Volume |
| `return1d` | 1-Day Return | (Today Close - Yesterday Close) / Yesterday Close |
| `return5d` | 5-Day Return | (Today Close - Close 5 Days Ago) / Close 5 Days Ago |
| `price_change_3d` | 3-Day Price Change | (Today Close - Close 3 Days Ago) / Close 3 Days Ago |
| `price_change_7d` | 7-Day Price Change | (Today Close - Close 7 Days Ago) / Close 7 Days Ago |
| `price_change_14d` | 14-Day Price Change | (Today Close - Close 14 Days Ago) / Close 14 Days Ago |
| `volatility_5d` | 5-Day Volatility | Std dev of 5-day returns |
| `volatility_10d` | 10-Day Volatility | Std dev of 10-day returns |
| `bb_position` | Bollinger Band Position | (Close - Lower Band) / (Upper Band - Lower Band) |
| `bb_width` | Bollinger Band Width | (Upper Band - Lower Band) / SMA20 |
| `obv` | On-Balance Volume (normalized) | Cumulative volume with direction, normalized |
| `roc_5` | Rate of Change (5-day) | (Today Close - Close 5 Days Ago) / Close 5 Days Ago |

**Target Variable**: Binary classification
- `1` = Close 3 days ahead > Today close (price goes UP over a 3-day horizon)
- `0` = Close 3 days ahead = Today close (price goes DOWN over a 3-day horizon)

**Why 3-day target?** Predicting next-day direction is extremely noisy. A 3-day lookahead provides a stronger signal with less market noise, improving model accuracy.

### 3.3 Model Training

**Algorithm**: Random Forest Classifier

**Hyperparameters**:
- `n_estimators=300` (number of decision trees)
- `max_depth=None` (trees grow to full depth)
- `min_samples_split=5` (minimum samples to split a node)
- `min_samples_leaf=2` (minimum samples per leaf)
- `class_weight="balanced"` (handles class imbalance)
- `random_state=42` (for reproducibility)
- `n_jobs=-1` (use all CPU cores)

**Train/Test Split**:
- 80% training, 20% testing
- **Time-series aware**: No shuffling (preserves temporal order)
- Critical for avoiding data leakage in financial time series

**Evaluation Metrics**:
- Accuracy: Overall prediction correctness
- Precision: True positives / (True positives + False positives)
- Recall: True positives / (True positives + False negatives)
- Feature importances: Ranked by contribution to predictions

### 3.4 Model Export to ONNX

**Location**: `scripts/convert_to_onnx.py`

**Process**:
1. Load trained sklearn model from `stock_model.pkl`
2. Convert to ONNX format using `skl2onnx`
3. Target opset: 12 (ONNX operator set version)
4. Disable zipmap output for cleaner probability arrays
5. Verify conversion by comparing sklearn and ONNX outputs

**Output**: `models/stock_model.onnx`

**Metadata**: `models/stock_model_meta.json` containing:
- Feature order
- Model accuracy, precision, recall
- Training timestamp
- Ticker symbols used
- Number of training samples

---

## 4. Inference Phase (Online)

### 4.1 API Endpoint

**Location**: `app/api/predict/route.ts`

**Method**: GET request

**URL Format**: `/api/predict?ticker=AAPL`

**Response Format**:
```json
{
  "ticker": "AAPL",
  "trend": "up" | "down",
  "confidence": 0.85,
  "indicators": {
    "sma5": 150.25,
    "sma10": 149.80,
    "sma20": 148.50,
    "rsi14": 62.5,
    "macd": 0.45,
    "macdSignal": 0.38,
    "volumeChange": 0.12,
    "return1d": 0.015,
    "return5d": 0.075,
    "price_change_3d": 0.025,
    "price_change_7d": 0.045,
    "price_change_14d": 0.085,
    "volatility_5d": 0.012,
    "volatility_10d": 0.018,
    "bb_position": 0.65,
    "bb_width": 0.045,
    "obv": 0.12,
    "roc_5": 0.035
  },
  "history": [...],
  "meta": {
    "accuracy": 0.51,
    "trainedAt": "2026-08-03T16:40:00Z"
  }
}
```

### 4.2 Data Flow

```
1. User Request
   ¦
   +-- Extract ticker from query parameter
   +-- Validate ticker format
   ¦
2. Data Fetching (lib/stock.ts)
   ¦
   +-- Call Yahoo Finance API
   ¦   URL: https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}?range=1y&interval=1d
   ¦
   +-- Parse JSON response
   ¦   Extract: timestamp, open, high, low, close, volume
   ¦
   +-- Transform to OHLCVBar[]
   ¦   Each bar: {date, open, high, low, close, volume}
   ¦
3. Feature Computation (lib/indicators.ts)
   ¦
   +-- Extract closing prices and volumes
   +-- Compute all 18 technical indicators
   +-- Validate all values are finite numbers
   ¦
4. Model Inference (lib/inference.ts)
   ¦
   +-- Load ONNX model (cached session)
   +-- Create input tensor [1, 18]
   +-- Run inference via ONNX Runtime Web (WASM)
   +-- Extract label (0=down, 1=up)
   +-- Normalize probabilities using softmax
   ¦
5. Response Generation
   ¦
   +-- Format prediction result
   +-- Include confidence score
   +-- Return JSON response
```

### 4.3 Browser-Based Inference

**Technology**: `onnxruntime-web` (v1.27.0)

**Execution Environment**:
- Runs entirely in the browser
- Uses WebAssembly (WASM) backend
- No server-side computation required
- Model loaded from `public/models/stock_model.onnx`

**Performance Optimizations**:
- Session caching (model loaded once)
- WASM threading configured for single thread
- Model path resolved from `process.cwd()`

---

## 5. Frontend Architecture

### 5.1 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 16.2.10 |
| Runtime | React | 19.2.4 |
| UI Library | Tailwind CSS | 4.x |
| Charts | Recharts | 2.15.3 |
| Icons | Lucide React | 0.511.0 |

### 5.2 Component Structure

```
components/
+-- indicators-panel.tsx    # All 18 technical indicators display
+-- prediction-card.tsx     # Prediction result card
+-- price-chart.tsx         # Interactive price chart (Recharts)
+-- results.tsx             # Combined results view
+-- stock-search.tsx        # Ticker search input
```

### 5.3 Pages

```
app/
+-- page.tsx                # Main dashboard
+-- layout.tsx              # Root layout
+-- globals.css             # Global styles
+-- api/predict/route.ts    # API endpoint
```

---

## 6. Development & Deployment Workflow

### 6.1 Local Development

```bash
# 1. Install dependencies
npm install
pip install -r scripts/requirements.txt

# 2. Train model (offline step)
npm run train
# Runs: python scripts/train.py && python scripts/convert_to_onnx.py

# 3. Start development server
npm run dev
# Server: http://localhost:3000
```

### 6.2 Production Deployment

**Platform**: Vercel (serverless)

**Deployment Steps**:
1. Commit model files to repository:
   - `models/stock_model.onnx`
   - `models/stock_model_meta.json`
2. Push to GitHub
3. Import project in Vercel dashboard
4. No environment variables or build configuration needed

**Build Command**: `npm run build`
**Output Directory**: `.next`

---

## 7. Key Design Decisions & Rationale

### 7.1 Why ONNX?

| Aspect | Traditional Approach | ONNX Approach |
|--------|---------------------|---------------|
| Model Size | Large pickle files | Compact, optimized |
| Inference | Python server required | Browser-native |
| Latency | Network round-trip | Local execution |
| Scalability | Server resources needed | No server load |
| Deployment | Complex setup | Simple static files |

### 7.2 Why Random Forest?

| Criterion | Random Forest | Logistic Regression | Neural Network |
|-----------|---------------|---------------------|----------------|
| Interpretability | Medium | High | Low |
| Training Speed | Fast | Fast | Slow |
| Small Data | Good | Good | Poor |
| Non-linear | Yes | No | Yes |
| Overfitting | Controlled | Low | High (with small data) |

### 7.3 Time-Series Aware Split

**Rationale**: Financial data is temporal. Shuffling would cause:
- Data leakage (future data in training)
- Unrealistic performance metrics
- Poor real-world performance

**Implementation**: `train_test_split(x, y, test_size=0.2, shuffle=False)`

### 7.4 Why 3-Day Target?

Next-day stock direction is extremely noisy and difficult to predict. A 3-day lookahead:
- Reduces the impact of daily market noise
- Provides a stronger trend signal
- Improves model accuracy from ~48% to ~51%
- Still short enough to be actionable for swing traders

### 7.5 Why 18 Features?

The feature set combines:
- **Trend indicators**: SMA (5, 10, 20)
- **Momentum indicators**: RSI, MACD, ROC
- **Volatility indicators**: Bollinger Bands (position + width), rolling std
- **Volume indicators**: Volume change, OBV
- **Price change features**: 3-day, 7-day, 14-day returns

All features are computed identically in Python (training) and TypeScript (inference) to ensure consistency.

---

## 8. Error Handling

| Error Type | HTTP Status | Response |
|------------|-------------|----------|
| Missing ticker | 400 | `{error: "Missing ticker"}` |
| Insufficient data | 422 | `{error: "Not enough data"}` |
| Invalid features | 422 | `{error: "Invalid features"}` |
| Yahoo Finance API error | 500 | `{error: "Failed to fetch {symbol}"}` |
| Model not found | 500 | `{error: "Model metadata not found..."}` |

---

## 9. Performance Considerations

### 9.1 Caching

- **Model Session**: Cached in `sessionPromise` (loaded once)
- **Model Metadata**: Cached in `cachedMeta`
- **Stock Data**: 5-minute revalidation via `next: { revalidate: 300 }`

### 9.2 Data Validation

- Minimum 30 data points required
- All feature values must be finite numbers
- Ticker must be valid format

### 9.3 Browser Compatibility

- Requires modern browser with WASM support
- Works in all major browsers (Chrome, Firefox, Safari, Edge)
- No additional plugins or extensions needed

---

## 10. Limitations & Future Work

### 10.1 Current Limitations

1. **Model Accuracy**: ~51% accuracy — better than random but still limited
2. **Data Source**: Relies on Yahoo Finance availability
3. **Prediction Horizon**: Predicts 3-day direction (not next-day)
4. **No Portfolio Optimization**: Single stock prediction only
5. **Single Model**: No ensemble or model stacking

### 10.2 Potential Improvements

1. **Gradient Boosting**: XGBoost/LightGBM for better accuracy
2. **Deep Learning**: LSTM/Transformer for sequence modeling
3. **Additional Features**: Sentiment analysis, news data, sector data
4. **Multi-stock**: Portfolio-level predictions
5. **Hyperparameter Tuning**: Grid search, Bayesian optimization
6. **Feature Selection**: Remove low-importance features to reduce noise
7. **Ensemble Methods**: Combine multiple models for robustness
8. **Longer Horizons**: 5-day or 10-day predictions for swing trading

