# StockSense AI

Simple serverless stock trend predictor — Next.js dashboard + Python Random Forest + ONNX inference.

## How it works

```
User → /api/predict → Yahoo Finance data → indicators → ONNX model → UP/DOWN
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
lib/
  stock.ts              # fetch prices from Yahoo
  indicators.ts         # RSI, SMA, MACD features
  inference.ts          # ONNX model inference
models/
  stock_model.onnx      # trained model (run npm run train)
scripts/
  train.py              # train Random Forest
  convert_to_onnx.py    # export to ONNX
```

## Deploy to Vercel

1. Commit `models/stock_model.onnx` and `stock_model_meta.json`
2. Push to GitHub → import in Vercel → deploy

No environment variables needed.

## Disclaimer

Educational use only. Not financial advice.
