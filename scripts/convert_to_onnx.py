"""Convert trained sklearn model (including Pipelines) to ONNX."""

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
    n_features = getattr(model, "n_features_in_", None)
    if n_features is None and hasattr(model, "named_steps"):
        # Pipeline: infer from first step or from a dummy predict
        n_features = model.named_steps["scaler"].n_features_in_

    initial_type = [("float_input", FloatTensorType([None, int(n_features)]))]

    options = {}
    # Disable ZipMap for classifiers so probabilities are a dense array
    try:
        from sklearn.linear_model import LogisticRegression
        from sklearn.ensemble import HistGradientBoostingClassifier

        for est in model.named_steps.values() if hasattr(model, "named_steps") else [model]:
            if isinstance(est, (LogisticRegression, HistGradientBoostingClassifier)):
                options[id(est)] = {"zipmap": False}
    except Exception:
        pass

    if not options:
        options = {id(model): {"zipmap": False}}

    onnx_model = convert_sklearn(
        model,
        initial_types=initial_type,
        target_opset=12,
        options=options,
    )

    with open(onnx_path, "wb") as f:
        f.write(onnx_model.SerializeToString())

    print(f"Converted model saved to {onnx_path}")

    sample = np.random.randn(1, int(n_features)).astype(np.float32)
    sklearn_proba = model.predict_proba(sample)[0]

    import onnxruntime as ort

    session = ort.InferenceSession(str(onnx_path))
    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: sample})
    output_map = {o.name: arr for o, arr in zip(session.get_outputs(), outputs)}
    # Find probability output
    if "probabilities" in output_map:
        onnx_proba = output_map["probabilities"][0]
    else:
        # last output often probabilities
        onnx_proba = outputs[-1][0]

    print(f"Sklearn proba: {sklearn_proba}")
    print(f"ONNX proba:    {onnx_proba}")
    print("Conversion complete.")


if __name__ == "__main__":
    main()
