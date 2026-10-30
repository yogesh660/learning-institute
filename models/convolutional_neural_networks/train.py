"""Train a small convolutional network on scikit-learn's 8x8 handwritten digits.

Run from the repository root (needs PyTorch: pip install torch):

    python models/convolutional_neural_networks/train.py

The digits ship with scikit-learn, so nothing is downloaded. Writes metrics.json next to this file.
"""
import json
from datetime import date
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from sklearn.datasets import load_digits
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split

HERE = Path(__file__).resolve().parent
torch.manual_seed(0)

digits = load_digits()
X = (digits.images / 16.0).astype(np.float32)[:, None]          # (n, 1, 8, 8)
y = digits.target
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)


class SmallCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 16, 3, padding=1), nn.ReLU(),
            nn.Conv2d(16, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),     # 8 -> 4
        )
        self.head = nn.Sequential(nn.Flatten(), nn.Dropout(0.25), nn.Linear(32 * 4 * 4, 10))

    def forward(self, x):
        return self.head(self.features(x))


model = SmallCNN()
opt = torch.optim.AdamW(model.parameters(), lr=2e-3, weight_decay=1e-4)
Xt, yt = torch.tensor(X_train), torch.tensor(y_train)
for epoch in range(40):
    model.train()
    for idx in torch.randperm(len(Xt)).split(64):
        opt.zero_grad()
        nn.functional.cross_entropy(model(Xt[idx]), yt[idx]).backward()
        opt.step()

model.eval()
with torch.no_grad():
    pred = model(torch.tensor(X_test)).argmax(1).numpy()
baseline = LogisticRegression(max_iter=2000).fit(X_train.reshape(len(X_train), -1), y_train)
base_pred = baseline.predict(X_test.reshape(len(X_test), -1))

result = {
    "dataset": "scikit-learn digits (8x8 images)",
    "summary": "A two-layer CNN trained for 40 epochs on 80% of the 1,797 digit images, scored on a stratified 20% "
               "hold-out. The baseline is logistic regression on the flattened pixels.",
    "model_label": "Small CNN",
    "baseline_label": "Logistic regression on pixels",
    "metrics": {"Accuracy": round(float(accuracy_score(y_test, pred)), 4),
                "Macro F1": round(float(f1_score(y_test, pred, average="macro")), 4),
                "Parameters": int(sum(p.numel() for p in model.parameters()))},
    "baseline": {"Accuracy": round(float(accuracy_score(y_test, base_pred)), 4),
                 "Macro F1": round(float(f1_score(y_test, base_pred, average="macro")), 4)},
    "generated": f"generated {date.today().isoformat()}",
}
(HERE / "metrics.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result, indent=2))
