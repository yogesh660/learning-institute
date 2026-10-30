"""Train a small Transformer encoder on scikit-learn's digits, read as sequences.

Each 8x8 digit is fed as 8 time steps of 8 pixels, so the model has to combine information across
steps. Nothing is downloaded. Needs PyTorch (pip install torch). Run from the repository root:

    python models/transformer_networks/train.py

Writes models/transformer_networks/metrics.json, which the lesson page reads.
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
X = (digits.images / 16.0).astype(np.float32)          # (n, 8 steps, 8 features)
y = digits.target
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)


class Net(nn.Module):
    def __init__(self, d=64, heads=4, layers=2):
        super().__init__()
        self.embed = nn.Linear(8, d)
        self.pos = nn.Parameter(torch.zeros(1, 8, d))
        block = nn.TransformerEncoderLayer(d, heads, dim_feedforward=128, dropout=0.1, batch_first=True)
        self.encoder = nn.TransformerEncoder(block, layers)
        self.out = nn.Linear(d, 10)

    def forward(self, x):
        return self.out(self.encoder(self.embed(x) + self.pos).mean(dim=1))


model = Net()
opt = torch.optim.AdamW(model.parameters(), lr=2e-3, weight_decay=1e-4)
Xt, yt = torch.tensor(X_train), torch.tensor(y_train)
for epoch in range(40):
    model.train()
    for idx in torch.randperm(len(Xt)).split(64):
        opt.zero_grad()
        nn.functional.cross_entropy(model(Xt[idx]), yt[idx]).backward()
        nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        opt.step()

model.eval()
with torch.no_grad():
    pred = model(torch.tensor(X_test)).argmax(1).numpy()
baseline = LogisticRegression(max_iter=2000).fit(X_train.reshape(len(X_train), -1), y_train)
base_pred = baseline.predict(X_test.reshape(len(X_test), -1))

result = {
    "dataset": "scikit-learn digits read row by row",
    "summary": "Transformer encoder trained for 40 epochs on 80% of the 1,797 digits (each read as 8 steps of 8 pixels), "
               "scored on a stratified 20% hold-out. The baseline is logistic regression on all 64 pixels at once.",
    "model_label": "Transformer encoder",
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
