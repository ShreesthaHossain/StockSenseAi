import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import type { ModelMeta } from "./types";

let sessionPromise: Promise<
  import("onnxruntime-web").InferenceSession
> | null = null;
let cachedMeta: ModelMeta | null = null;
let wasmConfigured = false;

function getModelPath(): string {
  return path.join(process.cwd(), "models", "stock_model.onnx");
}

function getMetaPath(): string {
  return path.join(process.cwd(), "models", "stock_model_meta.json");
}

export function getModelMeta(): ModelMeta {
  if (cachedMeta) return cachedMeta;

  const metaPath = getMetaPath();
  if (!fs.existsSync(metaPath)) {
    throw new Error(
      "Model metadata not found. Run: python scripts/train.py && python scripts/convert_to_onnx.py"
    );
  }

  cachedMeta = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as ModelMeta;
  return cachedMeta;
}

async function configureWasm() {
  if (wasmConfigured) return;

  const ort = await import("onnxruntime-web");
  ort.env.wasm.numThreads = 1;
  const wasmDir = path.join(
    process.cwd(),
    "node_modules",
    "onnxruntime-web",
    "dist"
  );
  ort.env.wasm.wasmPaths = pathToFileURL(`${wasmDir}${path.sep}`).href;
  wasmConfigured = true;
}

async function getSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const modelPath = getModelPath();
      if (!fs.existsSync(modelPath)) {
        throw new Error(
          "ONNX model not found. Run: python scripts/train.py && python scripts/convert_to_onnx.py"
        );
      }

      await configureWasm();
      const ort = await import("onnxruntime-web");
      const modelBuffer = fs.readFileSync(modelPath);
      return ort.InferenceSession.create(modelBuffer);
    })();
  }

  return sessionPromise;
}

function softmax(values: number[]): number[] {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

function normalizeProbabilities(raw: number[]): [number, number] {
  if (raw.length < 2) {
    const p = Math.min(1, Math.max(0, raw[0] ?? 0.5));
    return [1 - p, p];
  }

  const inUnitRange = raw.every((v) => v >= 0 && v <= 1);
  const sum = raw[0] + raw[1];

  if (inUnitRange && sum > 0.99 && sum < 1.01) {
    return [raw[0], raw[1]];
  }

  const [down, up] = softmax(raw);
  return [down, up];
}

export async function predict(features: number[]): Promise<{
  trend: "up" | "down";
  confidence: number;
}> {
  const session = await getSession();
  const ort = await import("onnxruntime-web");

  const inputName = session.inputNames[0];
  const inputTensor = new ort.Tensor("float32", Float32Array.from(features), [
    1,
    features.length,
  ]);

  const output = await session.run({ [inputName]: inputTensor });

  const probTensor =
    output["probabilities"] ??
    output[
      session.outputNames.find((n) => n.toLowerCase().includes("prob")) ?? ""
    ] ??
    output[session.outputNames[1]];

  const rawProba = Array.from(probTensor.data as Float32Array).slice(0, 2);
  const [downProb, upProb] = normalizeProbabilities(rawProba);

  const meta = getModelMeta();
  const threshold = meta.decisionThreshold ?? 0.5;
  const trend: "up" | "down" = upProb >= threshold ? "up" : "down";
  const confidence = trend === "up" ? upProb : downProb;

  return { trend, confidence };
}
