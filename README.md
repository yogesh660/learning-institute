# Learn · machine learning from first principles

An interactive learning hub with 69 lessons: 50 machine learning models and 19 statistics, theory and language-model concepts, arranged into five learning paths. Every lesson explains the idea in plain words, works through the maths, shows runnable code and includes a live lab where the algorithm actually trains in your browser.

This repository is the target workspace for the AI Learning Institute. It was imported from `yogesh660/ml-model-zoo`; that source repository remains read-only. Deployment for this private repository is not configured yet.

## Learning paths

Eleven paths: 69 lessons are live and 328 more are planned. A planned lesson already has a "coming soon" page, so the whole syllabus is browsable and searchable.

| Path | Live | Planned | What it covers |
|---|---|---|---|
| 01 Foundations | 17 | 0 | EDA, feature selection, loss functions, gradient descent, MLE, Newton/BFGS, bias–variance, regularisation, cross-validation, log-odds, link functions, metrics |
| 02 Statistics | 0 | 51 | Probability, estimation, hypothesis tests, information theory and divergences, regression inference, experiments and causality, Bayesian methods, time series |
| 03 Regression | 17 | 6 | OLS to polynomial, ridge, lasso, elastic net, robust and Bayesian regression, k-NN, SVR, Gaussian processes, trees, boosting, MLP |
| 04 Classification | 12 | 7 | Logistic regression, LDA, QDA, naive Bayes, SVM, k-NN, trees, random forests, AdaBoost, gradient boosting, stacking |
| 05 Clustering | 14 | 3 | k-means family, hierarchical, density-based, GMM, spectral, affinity propagation |
| 06 Machine learning toolbox | 0 | 50 | Dimensionality reduction, anomaly detection, optimisation, tuning, interpretability, learning theory, recommenders |
| 07 Data science | 0 | 47 | Wrangling, feature engineering, validation, forecasting at scale, drift, product analytics, MLOps |
| 08 Deep learning | 6 | 36 | Perceptron, MLP, CNN, RNN, GRU, LSTM, then training, architectures, representation learning, efficiency |
| 09 Computer vision | 0 | 37 | Filters and features, geometry, detection, segmentation, vision transformers, applications |
| 10 Natural language processing | 3 | 49 | Tokenization (BPE), embeddings and the Transformer, plus words, syntax, meaning, language models, tasks |
| 11 AI | 0 | 42 | Search, reinforcement learning, LLM foundations, RAG, agents, serving, safety |

The planned lessons are defined in `content/curriculum.js` as `[title, tier]` entries (Core, Extended or Capstone).

Each lesson follows the same structure: the idea, how it works, an interactive architecture diagram and an animated walkthrough (for linear regression, CNNs, the sequence models, tokenization, embeddings and Transformers), a live lab, the maths, hyperparameters (or key takeaways), when to use it, code with common pitfalls, results on a dataset (models), a short quiz and related lessons.

## Structure

```
content/              every word on the site
  curriculum.js       paths, modules and lesson order
  concepts.js         the 17 foundation lessons
  regression.js       classification.js  clustering.js  neural.js  sequences.js  language.js
assets/
  site.css, site.js   straight copies of the portfolio's stylesheet and script
  learn.css, learn.js what Learn adds: paths, syllabus, lesson layout, labs, quiz, progress
  labs/               the in-browser labs (no dependencies)
    core.js           canvas plotting, seeded datasets, controls
    algos.js          from-scratch implementations of every algorithm
    models.js         one lab per model lesson
    concepts.js       one lab per concept lesson
    sequences.js      labs for the RNN, GRU, LSTM and Transformer lessons
    language.js       a BPE tokenizer and a word-embedding trainer, both running in the browser
    explainers.js     step-by-step animated explainers shown above the labs (linear regression, CNN, sequence and language lessons)
    architecture.js   interactive architecture diagrams with hover/tap explanations (linear regression, CNN, tokenizer, embedding and Transformer lessons)
scripts/build.js      content -> index.html, models/<id>/index.html, concepts/<id>/index.html
scripts/dev/check.py  screenshots and overflow checks for walkthroughs, diagrams and labs (Playwright)
models/<id>/          train.py (scikit-learn or PyTorch) and the metrics.json it writes
datasets/raw/         small synthetic teaching samples modelled on well-known datasets
```

## Build and run

```bash
node scripts/build.js        # regenerates every page from content/
node server.js               # http://localhost:8000
```

No npm install is needed. Pages are plain HTML; KaTeX (for the maths) and Google Fonts load from CDNs, the same way the portfolio does.

To change a lesson, edit its entry in `content/` and rebuild. `[[lesson-id]]` or `[[lesson-id|text]]` inside any text becomes a link to that lesson; the build fails if the id does not exist, so links cannot rot.

## Training scripts

Every model has a self-contained `models/<id>/train.py` that trains on one of the CSVs, compares against a trivial baseline on a held-out split and writes `metrics.json`. The lesson page shows those numbers under "On real data".

```bash
pip install -r requirements.txt
python models/random_forest_regressor/train.py
node scripts/build.js        # pick up the new metrics
```

The XGBoost, LightGBM and CatBoost scripts need their libraries, and the CNN, RNN, GRU, LSTM and Transformer scripts need PyTorch (`pip install torch`); they train on scikit-learn's bundled digits so nothing is downloaded. Until they have been run, those eight lessons simply leave out the results section.

The CSVs are synthetic and deliberately easy, so some scores (Titanic in the mid-90s, breast cancer at 100%) are far higher than you would see on the original datasets. They are there to make the scripts runnable and comparable, not to benchmark models.

## Progress

"Mark as complete" and the path progress bars use `localStorage`, so progress stays in the visitor's browser and is never sent anywhere.
