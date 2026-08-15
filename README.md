# StockSense AI

Serverless stock trend predictor — Next.js dashboard + Python-trained ONNX model inference.

Model name, accuracy, sample counts, and prediction horizon are defined in
[`models/stock_model_meta.json`](models/stock_model_meta.json) and returned by
`GET /api/predict` in the `meta` field. The UI reads these values dynamically
(do not hardcode them in components).

## How it works

```
User → /api/predict → Yahoo Finance data → technical indicators → ONNX model → UP/DOWN
```

Training runs offline in Python. The app only needs Node.js at runtime.

## Quick start

```bash
cd stocksense-ai
npm install
pip install -r scripts/requirements.txt
npm run train          # creates models/stock_model.onnx + stock_model_meta.json
npm run dev            # http://localhost:3000
```

## Project layout

```
app/
  page.tsx              # dashboard (header uses meta.modelType from API)
  api/predict/route.ts  # prediction endpoint (returns meta from JSON)
components/
  prediction-card.tsx   # shows model name/accuracy/samples from meta
  ...
models/
  stock_model.onnx      # trained model artifact
  stock_model_meta.json # single source of truth for model metadata
scripts/
  train.py              # trains candidates, writes meta + pickle
  convert_to_onnx.py    # exports ONNX
  features.py           # feature engineering (mirrors lib/indicators.ts)
```

## Model metadata (source of truth)

See `models/stock_model_meta.json` for the currently deployed values, including:

- `modelType`
- `accuracy`, `precision`, `recall`
- `samples`, `numFeatures`
- `predictionHorizonDays`, `minMove`, `labelDescription`
- `decisionThreshold`

After training, re-check this file — the UI will pick up the new values automatically via the API.

## Deploy to Vercel

1. Commit `models/stock_model.onnx` and `models/stock_model_meta.json`
2. Push to GitHub → import in Vercel → deploy

No environment variables required for core prediction (Finnhub key is optional for market movers).

## Disclaimer

Educational use only. Not financial advice.
