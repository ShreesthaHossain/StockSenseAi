# StockSense AI

Serverless stock trend predictor — Next.js dashboard + Python Random Forest + ONNX inference.

## How it works

```
User → /api/predict → Yahoo Finance data → 36 technical indicators → ONNX model → UP/DOWN (3-day)
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
  indicators-panel.tsx  # all 36 technical indicators
  prediction-card.tsx   # prediction result card
  error-alert.tsx       # error display component
  price-chart.tsx       # interactive price chart (Recharts)
  stock-search.tsx      # ticker search input
lib/
  stock.ts              # fetch prices from Yahoo
  indicators.ts         # 36 technical indicators (RSI, SMA, MACD, BB, OBV, ROC, etc.)
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
  test-manual.js        # manual E2E test script
```

## Key features

- **36 technical indicators** — SMA (5, 10, 20, 50), RSI, MACD (with histogram), Bollinger Bands, ATR, OBV, ROC, lag returns, rolling statistics, price positions
- **3-day prediction target** — stronger signal, less noise than next-day
- **Balanced class weighting** — handles imbalanced up/down distributions
- **300 trees with regularization** — improved generalization
- **15 tickers, 3-year history** — diverse training data

## Testing

### Manual Testing

Start the dev server:
```bash
npm run dev
```

Run the manual test script:
```bash
node scripts/test-manual.js
```

### API Testing

Test the API endpoint:
```bash
# Valid ticker
curl "http://localhost:3000/api/predict?ticker=AAPL"

# Invalid ticker
curl "http://localhost:3000/api/predict?ticker=INVALID123"
```

## Deploy to Vercel

1. Commit `models/stock_model.onnx` and `models/stock_model_meta.json`
2. Push to GitHub → import in Vercel → deploy

No environment variables needed.

## Production Optimizations

- Caching: 5-minute cache with stale-while-revalidate
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- Error handling with user-friendly messages
- Loading states with skeleton UI

## Disclaimer

Educational use only. Not financial advice.