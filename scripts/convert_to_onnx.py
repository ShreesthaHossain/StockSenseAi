"""Convert trained sklearn Random Forest to ONNX format."""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"


def main() -> None:
    pkl_path = MODELS_DIR / "stock_model.pkl"
    onnx_path = MODELS_DIR / "stock_model.onnx"

    if not pkl_path.exists():
        raise FileNotFoundError(
            f"Model not found at {pkl_path}. Run: python scripts/train.py"
        )

    model = joblib.load(pkl_path)
    n_features = model.n_features_in_

    initial_type = [("float_input", FloatTensorType([None, n_features]))]
    onnx_model = convert_sklearn(
        model,
        initial_types=initial_type,
        target_opset=12,
        options={id(model): {"zipmap": False}},
    )

    with open(onnx_path, "wb") as f:
        f.write(onnx_model.SerializeToString())

    print(f"Converted model saved to {onnx_path}")

    # Verify ONNX output matches sklearn
    sample = np.random.randn(1, n_features).astype(np.float32)
    sklearn_proba = model.predict_proba(sample)[0]

    import onnxruntime as ort

    session = ort.InferenceSession(str(onnx_path))
    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: sample})
    output_map = {
        o.name: arr for o, arr in zip(session.get_outputs(), outputs)
    }
    onnx_proba = output_map["probabilities"][0]
    onnx_label = output_map["label"][0]

    print(f"Sklearn proba: {sklearn_proba}")
    print(f"ONNX label:    {onnx_label}")
    print(f"ONNX proba:    {onnx_proba}")
    print("Conversion complete.")


if __name__ == "__main__":
    main()
