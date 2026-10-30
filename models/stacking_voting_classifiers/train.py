"""Train and evaluate Stacking (LR + k-NN + RF) on the Titanic sample.

Run from the repository root:

    python models/stacking_voting_classifiers/train.py

Writes models/stacking_voting_classifiers/metrics.json, which the lesson page reads.
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
from sklearn.ensemble import StackingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent

df = pd.read_csv(ROOT / "datasets/raw/titanic.csv")
X, y = df.drop(columns="Survived"), df["Survived"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

prep = make_column_transformer((OneHotEncoder(drop="if_binary"), ["Sex"]), remainder=StandardScaler())
base = [
    ("lr", make_pipeline(prep, LogisticRegression(max_iter=1000))),
    ("knn", make_pipeline(prep, KNeighborsClassifier(n_neighbors=15))),
    ("rf", make_pipeline(prep, RandomForestClassifier(n_estimators=300, random_state=0))),
]
model = StackingClassifier(base, final_estimator=LogisticRegression(), cv=5)
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
    "summary": "Stacking (LR + k-NN + RF) trained on 80% of the Titanic sample and scored on a stratified 20% hold-out. "
               "The baseline always predicts the most common class.",
    "model_label": "Stacking (LR + k-NN + RF)",
    "baseline_label": "Majority class",
    "metrics": evaluate(model),
    "baseline": evaluate(baseline),
    "generated": f"generated {date.today().isoformat()}",
}
(HERE / "metrics.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
print(json.dumps(result, indent=2, ensure_ascii=False))
