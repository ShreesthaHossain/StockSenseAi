# StockSense AI

Serverless stock trend predictor — Next.js dashboard + Python Random Forest + ONNX inference.

## How it works

```
User ? /api/predict ? Yahoo Finance data ? 18 indicators ? ONNX model ? UP/DOWN (3-day)
```

Training runs offline in Python. The app only needs Node.js at runtime.

## Quick start

```bash
cd stocksense-ai
npm install
pip install -r scripts/requirements.txt
npm run train          # creates models/stock_model.onnx
npm run dev            # http://localhost:3000
```

## Project layout

```
app/
  page.tsx              # dashboard
  api/predict/route.ts  # single API endpoint
components/
  results.tsx           # chart + prediction display
  indicators-panel.tsx  # all 18 technical indicators
  prediction-card.tsx   # prediction result card
  price-chart.tsx       # interactive price chart (Recharts)
  stock-search.tsx      # ticker search input
lib/
  stock.ts              # fetch prices from Yahoo
  indicators.ts         # 18 technical indicators (RSI, SMA, MACD, BB, OBV, ROC, etc.)
  inference.ts          # ONNX model inference
  types.ts              # TypeScript interfaces
  utils.ts              # formatting utilities
models/
  stock_model.onnx      # trained model (run npm run train)
  stock_model_meta.json # model metadata
scripts/
  train.py              # train Random Forest
  features.py           # feature engineering (mirrors lib/indicators.ts)
  convert_to_onnx.py    # export to ONNX
```

## Key improvements over baseline

- **3-day prediction target** — stronger signal, less noise than next-day
- **18 technical indicators** — Bollinger Bands, OBV, ROC added to the original 9
- **Balanced class weighting** — handles imbalanced up/down distributions
- **300 trees with regularization** — improved generalization over the baseline 100-tree model
- **7 tickers, 3-year history** — more diverse training data

## Deploy to Vercel

1. Commit `models/stock_model.onnx` and `stock_model_meta.json`
2. Push to GitHub ? import in Vercel ? deploy

No environment variables needed.

## Disclaimer

Educational use only. Not financial advice.
