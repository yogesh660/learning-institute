"""Train and evaluate Lasso (CV-tuned alpha) on the diabetes progression sample.

Run from the repository root:

    python models/lasso_regression/train.py

Writes models/lasso_regression/metrics.json, which the lesson page reads.
"""
import json
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.dummy import DummyRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LassoCV

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent

df = pd.read_csv(ROOT / "datasets/raw/diabetes.csv")
X, y = df.drop(columns="Target"), df["Target"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = make_pipeline(StandardScaler(), LassoCV(cv=5, random_state=0))
model.fit(X_train, y_train)
baseline = DummyRegressor(strategy="mean").fit(X_train, y_train)


def evaluate(estimator):
    pred = estimator.predict(X_test)
    return {
        "RMSE": round(float(mean_squared_error(y_test, pred) ** 0.5), 4),
        "MAE": round(float(mean_absolute_error(y_test, pred)), 4),
        "R²": round(float(r2_score(y_test, pred)), 4),
    }


result = {
    "dataset": "diabetes progression sample",
    "summary": "Lasso (CV-tuned alpha) trained on 80% of the diabetes progression sample (Target as target), "
               "scored on a held-out 20%. The baseline always predicts the training mean.",
    "model_label": "Lasso (CV-tuned alpha)",
    "baseline_label": "Predict the mean",
    "metrics": evaluate(model),
    "baseline": evaluate(baseline),
    "generated": f"generated {date.today().isoformat()}",
}
(HERE / "metrics.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
print(json.dumps(result, indent=2, ensure_ascii=False))
