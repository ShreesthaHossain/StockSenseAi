# StockSense AI — Role Description

Use this for your viva intro, resume, portfolio, or “What I built” slide.

---

## Suggested titles

**Professional**  
Lead Developer & ML Engineer — StockSense AI

**Academic**  
Serverless Stock Trend Prediction with Python Training and ONNX Inference on Next.js

---

## One-paragraph elevator pitch

StockSense AI is a **serverless** web app that predicts stock trend direction using a machine-learning model trained offline in Python and served online through a Next.js API. Historical prices come from **Yahoo Finance**; features are technical indicators computed consistently in Python (training) and TypeScript (inference). The deployed classifier is **Logistic Regression** (with scaling), exported to **ONNX** and run with **ONNX Runtime Web (WASM)** — so production does not need a Python server. Model name, accuracy, sample count, and prediction horizon are stored in `stock_model_meta.json` and shown dynamically in the UI.

---

## Current system facts (from `stock_model_meta.json`)

| Item | Current value |
|------|----------------|
| **Model** | LogisticRegression |
| **Accuracy** | 62.84% |
| **Precision / Recall** | 63.44% / 90.53% |
| **Training samples** | 10,464 |
| **Features** | 45 |
| **Tickers** | 20 (AAPL, GOOGL, MSFT, TSLA, AMZN, NVDA, META, JPM, V, JNJ, WMT, PG, HD, MA, BAC, XOM, UNH, COST, AMD, NFLX) |
| **Prediction target** | Direction of a **≥6%** move over **20 trading days** |
| **Decision threshold** | 0.36 |
| **Runtime stack** | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Recharts, onnxruntime-web |
| **Deploy target** | Vercel (Node serverless) |

*If you retrain, update this table from the new meta file — do not invent numbers.*

---

## Role description (speak this)

> I designed and built StockSense AI end to end: a Next.js dashboard and API for stock analysis, plus a Python ML pipeline that trains on multi-ticker Yahoo Finance data, engineers 45 technical features (including SPY-relative returns), selects a scikit-learn model, and exports it to ONNX for serverless inference. The live model is Logistic Regression with about 63% test accuracy on predicting the direction of large 20-day moves. The UI never hardcodes model metrics — it reads them from the prediction API metadata.

---

## Contribution bullets (viva / resume)

- **Full-stack product:** Searchable dashboard with price chart, prediction card, technical indicators panel, and error/loading states.
- **ML pipeline:** Offline training (`scripts/train.py`) with chronological per-ticker splits, class balancing, threshold tuning, and ONNX export.
- **Feature engineering:** Shared feature set between `scripts/features.py` and `lib/indicators.ts` (SMA, RSI, MACD, Bollinger, ATR, OBV, lags, rolling stats, SPY-relative returns).
- **Serverless inference:** `/api/predict` loads ONNX via WASM, applies the saved decision threshold, returns trend, confidence, explanation hints, and full model `meta`.
- **Metadata discipline:** `stock_model_meta.json` is the single source of truth for model name, accuracy, samples, and horizon in the UI and docs.
- **Optional market context:** Market movers API can use Finnhub when an API key is configured.

---

## Tech stack (what you should say you used)

| Layer | Technologies |
|-------|----------------|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide, Recharts |
| API | Next.js Route Handlers (`/api/predict`, `/api/market-movers`) |
| Data | Yahoo Finance (training + live OHLCV); Finnhub (optional movers) |
| ML | Python, pandas, scikit-learn, joblib, skl2onnx |
| Inference | ONNX + onnxruntime-web (WASM) on the server |
| Hosting | Vercel-ready serverless deployment |

---

## Disclaimer line (always include)

Educational project only — not financial advice.
