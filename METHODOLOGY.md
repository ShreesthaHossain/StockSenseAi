# StockSense AI - Methodology & Workflow

## 1. Introduction

StockSense AI is a serverless stock trend prediction system with an offline Python training phase and an online Next.js / ONNX inference phase.

**Deployed model metadata** (name, accuracy, samples, horizon) always comes from
`models/stock_model_meta.json` and is exposed to the UI via `GET /api/predict` → `meta`.

---

## 2. Overall Architecture

```
Browser → /api/predict → Yahoo Finance OHLCV
                      → feature engineering (TypeScript)
                      → ONNX Runtime Web (WASM)
                      → trend + confidence + meta
```

---

## 3. Features

Feature definitions live in `scripts/features.py` and `lib/indicators.ts` and must stay in sync.
The exact feature list for the deployed model is `featureOrder` in `stock_model_meta.json`.

---

## 4. Training & model selection

`scripts/train.py` may evaluate multiple candidates (for example HistGradientBoostingClassifier
and LogisticRegression), then writes:

- `models/stock_model.pkl`
- `models/stock_model_meta.json` (`modelType`, metrics, horizon, threshold, …)
- after `convert_to_onnx.py`: `models/stock_model.onnx`

**Do not hardcode model names or accuracy in the UI** — read `meta` from the API.

---

## 5. Current deployed artifact

Inspect `models/stock_model_meta.json` for the live values. The ONNX graph for a linear
model typically contains `Scaler` + `LinearClassifier` nodes; tree/boosting models have
different operator graphs. The UI must display `meta.modelType`, which should match the
exported ONNX model.

---

## 6. Inference

1. Fetch ticker (+ SPY) history
2. Compute features in the same order as `meta.featureOrder`
3. Run ONNX session
4. Apply `meta.decisionThreshold` when present
5. Return prediction + full `meta` object

---

## Disclaimer

Educational use only. Not financial advice.
