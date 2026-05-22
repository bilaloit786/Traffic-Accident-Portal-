"""Train traffic accident risk models from the completed data folder."""

from pathlib import Path
import shutil
import sys


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from ml.model import AccidentPredictor  # noqa: E402


def main():
    data_path = ROOT / "data" / "accidents.csv"
    model_path = ROOT / "ml" / "trained_model.pkl"

    predictor = AccidentPredictor(model_path=str(model_path))
    accuracy = predictor.train(csv_path=str(data_path), target_accuracy=0.79)

    backend_model_path = ROOT / "backend" / "ml" / "trained_model.pkl"
    backend_model_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(model_path, backend_model_path)

    print(f"Best model accuracy: {accuracy * 100:.2f}%")
    print(f"Saved root model: {model_path}")
    print(f"Synced backend model: {backend_model_path}")


if __name__ == "__main__":
    main()
