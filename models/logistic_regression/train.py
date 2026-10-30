"""Train and evaluate Logistic regression on the Titanic sample.

Run from the repository root:

    python models/logistic_regression/train.py

Writes models/logistic_regression/metrics.json, which the lesson page reads.
"""
import json
from datetime import date
from pathlib import Path

import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.compose import make_column_transformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent

df = pd.read_csv(ROOT / "datasets/raw/titanic.csv")
X, y = df.drop(columns="Survived"), df["Survived"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

prep = make_column_transformer((OneHotEncoder(drop="if_binary"), ["Sex"]), remainder=StandardScaler())
model = make_pipeline(prep, LogisticRegression(C=1.0, max_iter=1000))
model.fit(X_train, y_train)
baseline = DummyClassifier(strategy="most_frequent").fit(X_train, y_train)


def score_of(estimator):
    if hasattr(estimator, "predict_proba"):
        return estimator.predict_proba(X_test)[:, 1]
    return estimator.decision_function(X_test)


def evaluate(estimator):
    pred = estimator.predict(X_test)
    return {
        "Accuracy": round(float(accuracy_score(y_test, pred)), 4),
        "F1 (survived)": round(float(f1_score(y_test, pred, zero_division=0)), 4),
        "ROC-AUC": round(float(roc_auc_score(y_test, score_of(estimator))), 4),
    }


result = {
    "dataset": "Titanic sample",
    "summary": "Logistic regression trained on 80% of the Titanic sample and scored on a stratified 20% hold-out. "
               "The baseline always predicts the most common class.",
    "model_label": "Logistic regression",
    "baseline_label": "Majority class",
    "metrics": evaluate(model),
    "baseline": evaluate(baseline),
    "generated": f"generated {date.today().isoformat()}",
}
(HERE / "metrics.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
print(json.dumps(result, indent=2, ensure_ascii=False))
