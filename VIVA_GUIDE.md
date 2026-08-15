# StockSense AI — Viva Guide

Prepared for the **current** project state.  
For live numbers (model name, accuracy, samples, horizon), always open:

**`models/stock_model_meta.json`**

The UI shows the same values via `GET /api/predict` → `meta`.

---

## Snapshot of the deployed model

| Field | Value |
|-------|--------|
| `modelType` | **LogisticRegression** |
| `accuracy` | **62.84%** |
| `precision` | 63.44% |
| `recall` | 90.53% |
| `samples` | 10,464 |
| `numFeatures` | 45 |
| `predictionHorizonDays` | 20 |
| `minMove` | 6% |
| `decisionThreshold` | 0.36 |
| Label | Direction of a ≥6% move over 20 trading days |

ONNX graph for this model uses **Scaler + LinearClassifier** (linear model), which matches Logistic Regression — not Random Forest and not a tree-boosting operator set.

---

## 1. Project overview & architecture

### Q: What is StockSense AI?
**A:** An educational, serverless dashboard that predicts whether a stock is likely to move **up or down** over a defined horizon, using technical indicators and a scikit-learn model exported to ONNX.

### Q: Explain the architecture.
**A:** Two phases:

1. **Offline training (Python)**  
   - Download history with `yfinance` for ~20 tickers (+ SPY for relative features).  
   - Build features in `scripts/features.py`.  
   - Train/compare candidates in `scripts/train.py`.  
   - Save `stock_model.pkl`, write `stock_model_meta.json`, convert to `stock_model.onnx`.

2. **Online inference (Next.js)**  
   - User enters a ticker on the dashboard.  
   - `/api/predict` fetches Yahoo Finance OHLCV (and SPY).  
   - `lib/indicators.ts` builds the same feature vector.  
   - `lib/inference.ts` runs ONNX with **onnxruntime-web (WASM)**.  
   - Response includes trend, confidence, indicators, chart history, explanation text, and **meta**.

```
Browser → /api/predict → Yahoo data → features → ONNX → UP/DOWN + meta
```

### Q: Why Next.js and Python together?
**A:** Python is best for ML training (pandas, scikit-learn). Next.js gives a modern App Router UI and serverless API routes on Vercel. **ONNX** is the bridge so we do not host a Python ML server in production.

### Q: What is ONNX and why use it?
**A:** ONNX (Open Neural Network Exchange) is a portable model format. We train in Python, export with `skl2onnx`, and run in Node with WASM. Benefits: smaller deploy, no Python runtime on Vercel, same weights as training.

### Q: Is this truly serverless?
**A:** Yes for production: Next.js API routes + static/SSR frontend on Vercel. Training is offline on a developer machine (or CI), not a long-running Python service.

---

## 2. Data & features

### Q: Where does the data come from?
**A:**
- **Training:** Yahoo Finance via `yfinance`.  
- **Live prediction:** Yahoo Finance chart HTTP API in `lib/stock.ts`.  
- **Market movers (optional):** Finnhub when `FINNHUB_API_KEY` is set; otherwise fallback demo data.

### Q: How many tickers / samples?
**A:** Currently **20 tickers** and **10,464** labeled samples (see meta). Training uses multi-year history (about 5y in the training script).

### Q: What are the features?
**A:** **45** engineered features, including:
- Trend: SMA 5/10/20/50, price/SMA ratios  
- Momentum: RSI, MACD (+ signal/histogram), returns, ROC, lag returns  
- Volatility: rolling std, ATR, Bollinger position/width  
- Volume: volume change, volume/SMA, normalized OBV  
- Position in recent range  
- **SPY-relative** 5-day and 20-day returns  

Exact order is `featureOrder` in the meta file — inference must use the same order.

### Q: Why keep Python and TypeScript features in sync?
**A:** Training and inference must see the same inputs. Mismatch → wrong ONNX inputs and garbage predictions. We mirror logic in `features.py` and `indicators.ts`.

---

## 3. Label, horizon, and evaluation

### Q: What exactly are you predicting?
**A:** Binary class:
- **UP (1):** forward return over **20 trading days** is positive  
- **DOWN (0):** forward return is negative  

We only keep samples where the absolute forward move is **≥ 6%**. That filters tiny noisy moves and makes the learning problem clearer.

### Q: Why not “next-day up/down”?
**A:** Next-day direction is mostly noise. A longer horizon with a minimum move size is a stronger educational signal and produced better measured accuracy on our holdout set.

### Q: How did you split train/test?
**A:** **Per-ticker chronological split** (~80% past / 20% future), **no shuffle**, then concatenate. Shuffling time series would leak the future into training.

### Q: What about class imbalance?
**A:** There are typically more UP samples in strong bull periods. Training uses **class_weight="balanced"** and a tuned **decision threshold** (currently 0.36) chosen on a validation slice.

---

## 4. The model (expect deep questions here)

### Q: Which algorithm is deployed right now?
**A:** **LogisticRegression** (inside a Pipeline with **StandardScaler**), as recorded in `stock_model_meta.json` and reflected in the ONNX graph (`Scaler`, `LinearClassifier`).

### Q: Did you only ever try Logistic Regression?
**A:** The training script can also evaluate **HistGradientBoostingClassifier**. On this feature set and label, Logistic Regression won on validation and was exported. The UI always shows whatever `modelType` is in the meta file after training.

### Q: Why might Logistic Regression work better than Gradient Boosting / Random Forest here?
**A:**
- Features are mostly ratios and returns — often roughly linear in log-odds space.  
- Markets are noisy; complex trees overfit easily.  
- Regularized linear models are stable, fast, and easy to export to ONNX.  
- We still compare candidates so the choice is empirical, not ideological.

### Q: Why not deep learning (LSTM)?
**A:** Heavier training, harder serverless deploy, more data/tuning needed. For a course project, classical ML + clear features + ONNX is a better scope and easier to explain.

### Q: Your accuracy is ~63%. Is that good?
**A:** For stock **direction**, random guessing is ~50%. Consistent out-of-sample accuracy in the low–mid 60%s on a filtered large-move task is a meaningful edge for an educational system — not a trading guarantee. Precision ~63%, recall ~90% means the model catches many UP moves but still makes mistakes (especially on DOWN).

### Q: What is the confidence score?
**A:** The probability of the predicted class from `predict_proba`, after applying the saved threshold to decide UP vs DOWN.

### Q: What is early stopping / regularization in your pipeline?
**A:** When HistGradientBoosting is trained as a candidate, it uses early stopping and L2. Logistic Regression uses **C** regularization and scaling. Both aim to reduce overfitting.

---

## 5. Backend API & frontend

### Q: Main API endpoint?
**A:** `GET /api/predict?ticker=AAPL`  
Returns: `ticker`, `trend`, `confidence`, `indicators`, `history`, `meta`, `explanation`.

### Q: Where does the UI get the model name and accuracy?
**A:** From `meta` in the predict response (loaded from `stock_model_meta.json`). Header and prediction card are dynamic — **no hardcoded accuracy or old model names**.

### Q: What does the dashboard show?
**A:** Ticker search, price chart (Recharts), AI prediction card (trend, confidence, model details), technical indicators, optional explanation of key signals, error alerts.

### Q: How do you handle bad tickers / little data?
**A:** Validation on ticker format; fetch errors → 502; insufficient history → 422 with clear codes; friendly error UI with retry.

---

## 6. Deployment & security (light)

### Q: How do you deploy?
**A:** Commit ONNX + meta, push to GitHub, import on Vercel. Core predict needs no secrets. Finnhub key is optional for movers.

### Q: Any production considerations?
**A:** Response caching headers on predict, security headers, WASM path handling on Windows (`file://` URLs), model session cached in memory after first load.

---

## 7. Limitations (say this honestly — examiners like it)

- Not financial advice; markets are non-stationary.  
- Past accuracy ≠ future performance.  
- Label filters large moves — quiet periods are out-of-distribution.  
- Yahoo/Finnhub availability and rate limits can affect live demos.  
- Feature parity bugs between Python and TypeScript would silently hurt quality.

---

## 8. Demo script (2 minutes)

1. Open the app → show header picking up **LogisticRegression** from meta after load.  
2. Analyze **AAPL** → chart + UP/DOWN + confidence.  
3. Open Model details → name, 20-day horizon, ≥6% moves, Yahoo + Finnhub labels.  
4. Mention offline train → ONNX → serverless Next.js.  
5. End with disclaimer.

---

## Quick “if stuck” answers

| Question | Short answer |
|----------|----------------|
| Model? | LogisticRegression (see meta / ONNX Scaler+LinearClassifier) |
| Accuracy? | ~62.8% (cite meta) |
| Horizon? | 20 trading days, ≥6% moves |
| Features? | 45 technical (+ SPY relative) |
| Why serverless? | ONNX in Next.js API — no Python server |
| Source of truth? | `stock_model_meta.json` |

---

## Disclaimer

Educational use only. Not financial or investment advice.
