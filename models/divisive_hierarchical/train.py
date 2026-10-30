"""Train and evaluate bisecting k-means (5) on the mall customers sample.

Run from the repository root:

    python models/divisive_hierarchical/train.py

Writes models/divisive_hierarchical/metrics.json, which the lesson page reads.
"""
import json
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import calinski_harabasz_score, davies_bouldin_score, silhouette_score
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import BisectingKMeans, KMeans

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent

df = pd.read_csv(ROOT / "datasets/raw/mall_customers.csv")
X = StandardScaler().fit_transform(df[["Annual_Income_k", "Spending_Score"]])

labels = BisectingKMeans(n_clusters=5, random_state=0).fit_predict(X)
extra = {}


def evaluate(labels):
    labels = np.asarray(labels)
    keep = labels >= 0                      # density methods mark noise as -1
    n_clusters = len(set(labels[keep]))
    out = {"Clusters": n_clusters, "Noise points": int((~keep).sum())}
    if n_clusters >= 2:
        out["Silhouette"] = round(float(silhouette_score(X[keep], labels[keep])), 4)
        out["Davies–Bouldin"] = round(float(davies_bouldin_score(X[keep], labels[keep])), 4)
        out["Calinski–Harabasz"] = round(float(calinski_harabasz_score(X[keep], labels[keep])), 1)
    return out


metrics = evaluate(labels)
metrics.update({k: (round(v, 4) if isinstance(v, float) else v) for k, v in extra.items()})
result = {
    "dataset": "mall customers sample",
    "summary": "bisecting k-means (5) on standardised annual income and spending score of the mall customers sample. "
               "No labels exist, so the scores are internal: higher silhouette and lower Davies–Bouldin are better.",
    "model_label": "bisecting k-means (5)",
    "baseline_label": "k-means (k = 5)",
    "metrics": metrics,
    "baseline": evaluate(KMeans(5, n_init=10, random_state=0).fit_predict(X)),
    "generated": f"generated {date.today().isoformat()}",
}
(HERE / "metrics.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
print(json.dumps(result, indent=2, ensure_ascii=False))
