// Lessons for this track. Conventions: see regression.js and CLAUDE.md.
const r = String.raw;
module.exports = [
  {
    id: 'sql-for-analysis-joins-and-window-functions',
    short: 'SQL joins & window functions',
    title: 'SQL for Analysis: Joins and Window Functions',
    task: 'concepts',
    module: 'Data wrangling',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Expressing complex relational logic with declarative SQL joins and analytical window partitions without collapsing row granularity.`,
    lead: r`Data extraction for machine learning and analytics rarely begins with clean flat files. Relational data stores demand sophisticated joins to link entity tables and window functions to compute running totals, temporal lags, and rank orders without collapsing row granularity. Mastering set-based query execution prevents insidious silent data duplication and preserves temporal integrity.`,
    intuition: [
      r`Imagine working at a retail bank where customer records live in one table and daily account transactions live in another. To calculate each customer's lifetime transaction balance, a standard GROUP BY customer_id works fine, collapsing hundreds of individual receipts into a single summary row per customer. But what if you need to know how each individual transaction compares to that customer's rolling 30-day average, or how long elapsed since their previous deposit? A standard GROUP BY destroys the individual transaction rows, making it impossible to evaluate transaction-level anomalies.`,
      r`Window functions solve this dilemma by performing calculations across a set of related table rows (the window) while keeping every original row intact in the output. Using the OVER (PARTITION BY customer_id ORDER BY transaction_date) clause, the database segments data into independent customer buckets, sorts transactions chronologically, and slides a calculation frame across them. Functions like LAG() look directly into previous rows to calculate inter-transaction arrival times, while ROW_NUMBER() or DENSE_RANK() index sequences for deduplication.`,
      r`Joining tables introduces another critical hazard: cardinality explosion. An INNER JOIN preserves only matching keys, an OUTER JOIN retains unattached records by padding with NULLs, and a LEFT JOIN keeps all left-hand records. However, if the joining key has non-unique duplicates on the right (e.g. joining customer accounts to multiple shipping addresses without filtering), the join silently multiplies rows ($m \times n$ Cartesian explosion), inflating downstream aggregates like sum of revenue and silently distorting predictive model features.`,
    ],
    analogy: r`Running a transparent magnifying glass along an organised chronological paper ledger to compute running totals in the margin, without cutting or combining any receipts.`,
    steps: [
      r`Inspect join key uniqueness: verify whether primary and foreign keys have 1-to-1, 1-to-many, or many-to-many cardinality before writing the JOIN predicate.`,
      r`Choose the appropriate join type: use LEFT JOIN to retain base observational cohorts with unattached entities, filtering NULLs explicitly where required.`,
      r`Formulate the window specification: define PARTITION BY to establish the boundary of aggregation (e.g. per user or per product category).`,
      r`Specify chronological ordering with ORDER BY inside the window clause to ensure deterministic sequential calculations (mandatory for LAG, LEAD, and running sums).`,
      r`Define the frame clause (ROWS BETWEEN ... PRECEDING AND CURRENT ROW) to prevent future leakage when computing rolling historical metrics for time-series and predictive modelling.`,
    ],
    math: [
      {
        h: 'Relational join cardinality and Cartesian expansion',
        tex: r`$$|R \bowtie_{R.k = S.k} S| = \sum_{v \in \text{dom}(k)} n_R(v) \cdot n_S(v)$$`,
        p: r`Here $n_R(v)$ and $n_S(v)$ are the occurrence counts of key value $v$ in tables $R$ and $S$. When key $v$ is non-unique in both tables ($n_R(v) > 1, n_S(v) > 1$), row counts expand multiplicatively, distorting downstream counts and metric sums.`,
      },
      {
        h: 'Window partition aggregation operator',
        tex: r`$$W_f(t) = f\Big(\{u \in R \mid \text{part}(u) = \text{part}(t) \;\wedge\; u \in \text{frame}(t)\}\Big)$$`,
        p: r`For each row $t$, $\text{part}(t)$ identifies its partition subset, $\text{frame}(t)$ defines the active evaluation window (e.g. preceding rows), and $f$ is the analytic operator (SUM, AVG, RANK). Crucially, row $t$ retains its distinct identity and granularity in the output relation.`,
      },
      {
        h: 'Discrete relative rank and dense rank',
        tex: r`$$\text{rank}(t) = 1 + \sum_{u \in \text{part}(t)} \mathbf{1}_{\text{ord}(u) < \text{ord}(t)}, \qquad \text{dense\_rank}(t) = 1 + \big|\{\text{ord}(u) \mid u \in \text{part}(t), \text{ord}(u) < \text{ord}(t)\}\big|$$`,
        p: r`Here $\text{ord}(t)$ represents the sorting key. Standard RANK() leaves gaps after duplicate ties (e.g. ranks 1, 2, 2, 4), whereas DENSE_RANK() advances sequentially without skipping integer positions (1, 2, 2, 3), making it preferable for pagination and top-$k$ filtering.`,
      },
    ],
    keyPoints: [
      r`Retention of row granularity: window functions evaluate aggregate statistics across partitions while preserving individual transaction-level rows.`,
      r`Join cardinality awareness: many-to-many joins silently duplicate rows, artificially inflating metrics and distorting model training sets.`,
      r`Leakage-safe framing: rolling window queries for machine learning must strictly bound frame windows to ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW to avoid future leakage.`,
    ],
    pitfalls: [
      r`Accidental Cartesian fan-out: joining on non-unique columns causes row explosion, quietly multiplying calculated revenues and counts.`,
      r`Default window framing trap: RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW treats identical timestamp ties as simultaneous, grouping them together instead of calculating row-by-row.`,
      r`NULL handling in joins: NULL = NULL evaluates to UNKNOWN in SQL three-valued logic, causing equality join conditions to drop matching NULL rows unless explicit IS NOT DISTINCT FROM is specified.`,
    ],
    code: r`import sqlite3

conn = sqlite3.connect(":memory:")
c = conn.cursor()
c.executescript("""
CREATE TABLE users (user_id INT, tier TEXT);
INSERT INTO users VALUES (101, 'Gold'), (102, 'Silver'), (103, 'Bronze');
CREATE TABLE tx (tx_id INT, user_id INT, amount REAL, dt TEXT);
INSERT INTO tx VALUES (1, 101, 50.0, '2026-01-01'), (2, 101, 120.0, '2026-01-03'),
                      (3, 102, 200.0, '2026-01-02'), (4, 101, 30.0, '2026-01-06');
""")

query = """
SELECT u.user_id, u.tier, t.dt, COALESCE(t.amount, 0.0) AS amt,
       SUM(t.amount) OVER (PARTITION BY u.user_id ORDER BY t.dt
                           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum_amt,
       LAG(t.amount, 1, 0.0) OVER (PARTITION BY u.user_id ORDER BY t.dt) AS prev_amt
FROM users u
LEFT JOIN tx t ON u.user_id = t.user_id
ORDER BY u.user_id, t.dt;
"""
for row in c.execute(query).fetchall():
    print(row)`,
    quiz: [
      {
        q: r`What is the primary difference between an analytical window function and a standard GROUP BY aggregation?`,
        o: [
          r`Window functions calculate aggregates across partitions while preserving individual row granularity, whereas GROUP BY collapses rows into single summaries`,
          r`Window functions can only be executed on integer columns`,
          r`GROUP BY requires an indexed primary key, whereas window functions do not`,
          r`Window functions modify the underlying table on disk, whereas GROUP BY creates a temporary view`,
        ],
        a: 0,
        why: r`Standard GROUP BY collapses all rows belonging to a group into a single summary row. A window function computes the aggregate across the partition while returning every original row with its computed window value attached.`,
      },
      {
        q: r`When joining two tables where the join key appears 3 times in table A and 4 times in table B, how many rows will an INNER JOIN generate for that specific key?`,
        o: [
          r`12 rows`,
          r`7 rows`,
          r`4 rows`,
          r`3 rows`,
        ],
        a: 0,
        why: r`Relational joins perform a Cartesian product over matching key values. A key with 3 occurrences in table A and 4 occurrences in table B yields $3 \times 4 = 12$ rows, potentially multiplying metric sums by 4.`,
      },
      {
        q: r`Why is it critical to specify ROWS BETWEEN ... PRECEDING AND CURRENT ROW rather than relying on default window framing when computing rolling features for ML?`,
        o: [
          r`The default RANGE frame groups identical timestamp values together as ties, which can cause lookahead leakage across equal timestamps`,
          r`The default frame clause causes SQL syntax errors in relational engines`,
          r`ROWS framing automatically imputes missing NULL values with zero`,
          r`RANGE framing restricts the window calculation to a maximum of 10 rows`,
        ],
        a: 0,
        why: r`In standard SQL, specifying ORDER BY without an explicit frame defaults to RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW. When multiple rows share the same order timestamp, RANGE includes all peer rows up to the end of the tie group, leaking concurrent or future information.`,
      },
    ],
    usedBy: ['pandas-and-polars-patterns', 'data-cleaning-and-validation'],
    prereq: ['sampling-and-standard-error', 'cross-validation'],
    related: ['pandas-and-polars-patterns', 'data-cleaning-and-validation', 'missing-data-mcar-mar-mnar-and-imputation'],
    keywords: 'sql window functions joins left join inner join partition by lead lag dense rank relational database analytical sql',
  },
  {
    id: 'pandas-and-polars-patterns',
    short: 'pandas & Polars patterns',
    title: 'pandas and Polars Patterns',
    task: 'concepts',
    module: 'Data wrangling',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Modern idiomatic tabular data manipulation, contrasting pandas eager in-memory index model with Polars lazy, multithreaded query optimisation.`,
    lead: r`Tabular data wrangling in Python has evolved from imperative loops and fragmented pandas operations to declarative expression chains and columnar execution engines. While pandas relies on an eager, index-oriented memory model, Polars uses Apache Arrow memory layouts and a Rust query engine to evaluate lazy expressions in parallel with query optimisation. Choosing the right paradigms eliminates copy overhead and prevents out-of-memory crashes on multi-gigabyte datasets.`,
    intuition: [
      r`Imagine preparing a complex five-course dinner from a written recipe. In an eager cooking approach, as soon as step 1 says "slice ten onions", you slice all ten, put them in a bowl, and store them. When step 2 says "dice ten potatoes", you dice all ten and store them. By step 4, your kitchen counter is overflowing with bowls of prepared food, consuming all available space. If step 5 suddenly says "throw away half the vegetables because only five portions are needed", all that earlier slicing and storage was completely wasted effort.`,
      r`This is eager execution, the default mode of pandas. Every intermediate transformation immediately allocates a new DataFrame in memory and computes values sequentially on a single CPU core. If your initial CSV is 5 GB, chaining three intermediate transformations can demand 20 GB of RAM, triggering an Out-of-Memory (OOM) operating system crash. Furthermore, pandas relies heavily on custom Index structures that add overhead and complicate joins.`,
      r`Polars introduces lazy execution and expression-based pipelining. Instead of executing transformations step by step, Polars builds a directed acyclic graph (logical plan) of the intended operations. When you call .collect(), the query optimiser inspects the entire graph: it pushes filters down to the file scan so unnecessary rows are never read from disk (predicate pushdown), discards unused columns before parsing (projection pushdown), and parallelises group aggregations across all CPU cores using lock-free Apache Arrow arrays.`,
    ],
    analogy: r`Handing an entire blueprint to an architect who reorganises the steps for maximum speed and minimum materials, rather than hiring bricklayers who immediately pour concrete before the site is cleared.`,
    steps: [
      r`Define pipelines using declarative method chaining rather than imperative for-loops or in-place mutations.`,
      r`Select columnar expressions: in Polars, leverage pl.col() to express parallel column projections without intermediate DataFrame copies.`,
      r`Construct a lazy query plan (df.lazy()) when processing large datasets, inspecting the execution strategy with .explain().`,
      r`Enable predicate and projection pushdowns by filtering rows and selecting target columns before resource-intensive joins or group-bys.`,
      r`Trigger execution via .collect(), converting query outputs back to eager memory only when final tabular results or ML features are required.`,
    ],
    math: [
      {
        h: 'Columnar contiguous memory addressing vs row-major stride',
        tex: r`$$\text{Address}(\text{col}_j, \text{row}_i) = \text{Base}_j + i \cdot w$$`,
        p: r`In Apache Arrow and Polars columnar memory layout, values for column $j$ are stored in a contiguous memory block with uniform byte width $w$. SIMD CPU vectorisation loads contiguous elements in single cache lines without cache misses, whereas row-major formats require strided memory jumps.`,
      },
      {
        h: 'Predicate pushdown filter reduction',
        tex: r`$$\text{Memory}_{\text{lazy}} = \int_{\sigma_P(D)} dD = \rho \cdot \text{Memory}_{\text{eager}}, \qquad \rho = \frac{|\sigma_P(D)|}{|D|} \ll 1$$`,
        p: r`Predicate pushdown applies selection condition $P$ directly at the storage scan layer ($\sigma_P(D)$). If only $5\%$ of rows match the filter ($\rho = 0.05$), $95\%$ of raw bytes are never loaded into memory, avoiding memory exhaustion during joins and aggregations.`,
      },
      {
        h: 'Multithreaded partition speedup (Amdahl\'s Law)',
        tex: r`$$S(p) = \frac{1}{(1 - f) + \frac{f}{p}}$$`,
        p: r`Here $p$ is the number of CPU execution cores and $f$ is the fraction of embarrassingly parallel partition hash calculations. Polars leverages lock-free chunked Arrow arrays to execute partition hash maps in parallel across all $p$ threads, delivering near-linear throughput scaling over single-threaded pandas.`,
      },
    ],
    keyPoints: [
      r`Declarative expressions: writing operations as functional expressions allows execution engines to reorder and optimise query evaluation plans.`,
      r`Arrow memory standard: contiguous columnar formats minimise memory fragmentation and enable zero-copy sharing between tools.`,
      r`Eager vs lazy distinction: eager systems compute intermediate tables immediately; lazy systems compile and optimise the execution plan before execution.`,
    ],
    pitfalls: [
      r`Iterating over rows with Python for-loops: row iteration in pandas is 100 to 1,000 times slower than vectorised columnar operations.`,
      r`SettingWithCopyWarning: modifying sliced pandas views without explicit .copy() causes unpredictable silent assignment failures.`,
      r`High memory churn from chained eager copies: calling multiple .drop() or .fillna() steps in eager pandas duplicates full DataFrames in RAM.`,
    ],
    code: r`import numpy as np

# Columnar representation: contiguous 1D arrays (Apache Arrow / Polars memory model)
data = {
    'user_id': np.array([101, 101, 102, 101, 102, 103]),
    'amount': np.array([45.0, 120.0, 80.0, 30.0, 150.0, 20.0]),
    'active': np.array([True, True, True, False, True, False]),
}

# Declarative expression: predicate pushdown + vectorised aggregation
# Filter active transactions > $40, then group sum by user_id
mask = data['active'] & (data['amount'] > 40.0)
filtered_users = data['user_id'][mask]
filtered_amts = data['amount'][mask]

# Group-by hash aggregation without python loops
unique_users, inverse_idx = np.unique(filtered_users, return_inverse=True)
group_sums = np.bincount(inverse_idx, weights=filtered_amts)

print(f"Total rows: {len(data['user_id'])}, Filtered rows: {np.sum(mask)}")
for u, s in zip(unique_users, group_sums):
    print(f"User {u}: aggregated total = {s:.2f}")`,
    quiz: [
      {
        q: r`Why does Polars lazy execution (LazyFrame) consume significantly less memory than pandas on large datasets?`,
        o: [
          r`It optimises the query plan, pushing filters down to the file scan so unnecessary rows and columns are never loaded into RAM`,
          r`It stores all numbers as 8-bit integers`,
          r`It executes calculations on a remote cloud cluster automatically`,
          r`It converts all text data into binary booleans`,
        ],
        a: 0,
        why: r`Polars query optimiser inspects the complete computation graph before execution, applying predicate pushdown (reading only rows that match filter criteria) and projection pushdown (loading only referenced columns), dramatically slashing memory usage.`,
      },
      {
        q: r`Why is iterating over DataFrame rows with a Python for-loop considered an anti-pattern in tabular data engineering?`,
        o: [
          r`Python-level loops bypass vectorised CPU instructions and Arrow memory locality, running up to 1,000 times slower`,
          r`Python loops cause the underlying CSV files to become read-only`,
          r`Python loops can only process up to 256 rows before overflowing`,
          r`Python loops automatically delete missing NULL values`,
        ],
        a: 0,
        why: r`Vectorised operations and expression engines dispatch batch operations directly to compiled C/Rust kernels using SIMD instructions. Python row iterations incur Python interpreter overhead and pointer indirection on every single cell.`,
      },
      {
        q: r`What causes the infamous SettingWithCopyWarning in pandas?`,
        o: [
          r`Modifying a DataFrame slice where pandas cannot determine if the slice is an independent copy or a view of original memory`,
          r`Writing a DataFrame to disk without specifying an index column`,
          r`Joining two tables with differing column numbers`,
          r`Sorting a DataFrame without ascending=True`,
        ],
        a: 0,
        why: r`Chained indexing like df[mask]['col'] = val creates ambiguity over whether the slice is a view or a copy. If it is a copy, mutations silently discard changes without updating the parent DataFrame.`,
      },
    ],
    usedBy: ['data-cleaning-and-validation'],
    prereq: ['sql-for-analysis-joins-and-window-functions'],
    related: ['sql-for-analysis-joins-and-window-functions', 'data-cleaning-and-validation', 'missing-data-mcar-mar-mnar-and-imputation'],
    keywords: 'pandas polars dataframe arrow columnar query optimisation lazy execution method chaining vectorisation',
  },
  {
    id: 'data-cleaning-and-validation',
    short: 'Data cleaning & validation',
    title: 'Data Cleaning and Validation',
    task: 'concepts',
    module: 'Data wrangling',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Systematic detection and correction of corrupted records, schema violations, invalid ranges, and duplicate keys before feature pipelines.`,
    lead: r`Machine learning pipelines follow a strict rule: garbage in, garbage out. Raw enterprise data arrives riddled with duplicated keys, negative ages, invalid categorical codes, and subtle floating-point corruptions. Establishing declarative data contracts and automated validation assertions verifies structural integrity and prevents silent predictive model degradation.`,
    intuition: [
      r`Imagine a flight reservation database where passenger age is stored as free-form user input. A passenger enters their birth year "1994" into the age field, another writes "-1" to indicate unknown, another enters "250", and a typo inputs "0". If you feed this raw column directly into a gradient boosted tree or linear model without validation, the model might infer that customers who are 1,994 years old never default on tickets or that negative age reduces churn. A single unvalidated anomalous value distorts split thresholds across hundreds of decision trees.`,
      r`Data cleaning is not about haphazardly deleting rows whenever an error appears; it is a systematic auditing process. We divide validation into four progressive tiers: structural schema validation (checking data types and non-null constraints), range and domain validation (asserting that probabilities lie in $[0, 1]$ and ages in $[0, 120]$), cross-field relational consistency (checking that checkout_date $\ge$ checkin_date), and distributional sanity (detecting sudden spikes in duplicate identifiers or category cardinality drift).`,
      r`In production machine learning, data cleaning should be encoded as explicit, automated assertions—data contracts—often using tools like Great Expectations, Pandera, or Pydantic. Instead of silently patching bad rows with ad-hoc heuristics, data contracts flag schema regressions at the ingestion boundary, distinguishing between recoverable sensor drift that requires imputation and upstream API pipeline breakages that require hard alerts.`,
    ],
    analogy: r`A stringent customs inspection checkpoint at an international port that verifies passports, weights, and cargo manifests before any shipping container enters the domestic highway system.`,
    steps: [
      r`Profile raw ingestion data: compute frequency tables, missingness percentages, uniqueness ratios, and quantile distributions.`,
      r`Validate schema and constraints: assert column existence, expected data types, and primary key uniqueness.`,
      r`Enforce domain and range boundaries: check that continuous variables fall within plausible physiological or physical bounds.`,
      r`Verify cross-column relational rules: check multi-attribute dependencies (e.g. cancellation_date can only exist if is_cancelled is True).`,
      r`Quarantine corrupted records into an audit dead-letter queue, separating recoverable values from fatal schema breaks.`,
    ],
    math: [
      {
        h: 'Primary key uniqueness ratio',
        tex: r`$$U(k) = \frac{|\text{distinct}(k)|}{|R|}$$`,
        p: r`The uniqueness ratio measures distinct candidate key occurrences relative to total row count $|R|$. A valid primary key demands $U(k) = 1.0$. Ratios strictly below $1.0$ indicate duplicate entity keys, which cause row-multiplication errors in downstream joins.`,
      },
      {
        h: 'Modified Z-score for robust anomaly detection',
        tex: r`$$M_i = \frac{0.6745 \cdot |x_i - \text{median}(X)|}{\text{MAD}(X)}, \qquad \text{MAD}(X) = \text{median}\big(|x_i - \text{median}(X)|\big)$$`,
        p: r`Standard z-scores fail because extreme outliers distort both the sample mean and variance. The modified Z-score uses the median and Median Absolute Deviation (MAD). Observations with $|M_i| > 3.5$ are flagged as robust statistical anomalies without suffering masking effects.`,
      },
      {
        h: 'Schema constraint satisfaction rate',
        tex: r`$$\text{CSR} = \frac{1}{N \cdot M} \sum_{i=1}^N \sum_{j=1}^M \mathbf{1}_{\mathcal{C}_j(x_{i, j})}$$`,
        p: r`The constraint satisfaction rate measures the fraction of dataset elements that satisfy assigned validation rules $\mathcal{C}_j$. Production data contracts enforce strict gating thresholds (e.g. $\text{CSR} \ge 0.999$) to halt pipeline execution upon upstream schema corruption.`,
      },
    ],
    keyPoints: [
      r`Declarative data contracts: validate data boundaries at ingestion before downstream transformations hide corruptions.`,
      r`Robust anomaly detection: use median-based statistics (MAD) rather than mean and standard deviation to detect invalid ranges resistant to extreme outliers.`,
      r`Deduplication strategy: define deterministic tie-breaking logic (e.g. latest updated_at timestamp) when removing duplicated keys.`,
    ],
    pitfalls: [
      r`Silent drop disaster: automatically dropping all rows with validation errors without logging shrinks sample sizes and introduces severe selection bias.`,
      r`Overfitting validation rules to training samples: setting min/max boundaries strictly to current historical bounds causes future valid seasonal extremes to fail.`,
      r`Ignoring silent type coercion: parsing string "None" or "N/A" as string text rather than NaN bypasses null checks.`,
    ],
    code: r`import numpy as np

# Seeded raw batch: [user_id, age, income, is_active]
raw_data = np.array([
    [101, 28, 55000, 1],
    [102, -5, 62000, 1],   # Invalid age (-5)
    [103, 42, 85000, 0],
    [101, 28, 55000, 1],   # Duplicate user_id (101)
    [104, 35, -1200, 1],   # Invalid income (-1200)
    [105, 190, 72000, 1],  # Impossible age (190)
], dtype=float)

n_rows = len(raw_data)
v_age = (raw_data[:, 1] >= 0) & (raw_data[:, 1] <= 120)
v_income = raw_data[:, 2] >= 0
_, first_idx = np.unique(raw_data[:, 0], return_index=True)
v_unique = np.zeros(n_rows, dtype=bool)
v_unique[first_idx] = True

valid_mask = v_age & v_income & v_unique
clean_data = raw_data[valid_mask]
rejected_data = raw_data[~valid_mask]

print(f"Total raw records: {n_rows}")
print(f"Passed validation: {len(clean_data)} ({len(clean_data)/n_rows*100:.1f}%)")
print(f"Rejected records: {len(rejected_data)}")
print(f" - Invalid age: {np.sum(~v_age)} rows")
print(f" - Negative income: {np.sum(~v_income)} rows")
print(f" - Duplicate keys: {np.sum(~v_unique)} rows")`,
    quiz: [
      {
        q: r`Why is Median Absolute Deviation (MAD) preferred over standard deviation when validating numeric bounds for outlier detection?`,
        o: [
          r`Extreme outliers pull the sample mean and inflate the standard deviation, masking genuine anomalies; the median and MAD remain robust`,
          r`MAD can only be computed on categorical data`,
          r`Standard deviation requires the dataset to have an odd number of rows`,
          r`MAD runs in $O(1)$ constant time on distributed clusters`,
        ],
        a: 0,
        why: r`A single extreme anomaly (e.g. age entered as 9999) heavily inflates the standard deviation, expanding the normal acceptance envelope so widely that other errors pass undetected. The median and MAD have a 50% breakdown point, resisting outlier corruption.`,
      },
      {
        q: r`What is a major risk of automatically dropping all rows that fail validation checks without logging or quarantine?`,
        o: [
          r`It introduces severe selection bias by systematically discarding specific customer segments without alert`,
          r`It converts all numeric columns to floating-point numbers`,
          r`It causes the database storage engine to crash`,
          r`It forces models to overfit on duplicate rows`,
        ],
        a: 0,
        why: r`Silently dropping failed rows hides upstream sensor or API breakages and creates survivorship bias. For instance, if an updated mobile app sends a new currency format that fails validation, all mobile users are quietly erased from the dataset.`,
      },
      {
        q: r`In production machine learning systems, where should data contracts and schema validation checks be placed?`,
        o: [
          r`At the ingestion boundary before downstream feature transformations and training pipelines execute`,
          r`Only after the final machine learning predictions are generated`,
          r`Inside the gradient descent optimiser step`,
          r`Validation should only be executed during offline annual audits`,
        ],
        a: 0,
        why: r`Validating at ingestion prevents corrupted records from propagating into feature pipelines and database tables, ensuring bad data is quarantined immediately at the boundary.`,
      },
    ],
    usedBy: ['missing-data-mcar-mar-mnar-and-imputation'],
    prereq: ['sampling-and-standard-error', 'sql-for-analysis-joins-and-window-functions'],
    related: ['pandas-and-polars-patterns', 'missing-data-mcar-mar-mnar-and-imputation', 'normality-tests-shapiro-wilk-kolmogorov-smirnov-anderson-darling'],
    keywords: 'data cleaning data validation data contracts schema validation data quality mad outlier detection pandera',
  },
  {
    id: 'missing-data-mcar-mar-mnar-and-imputation',
    short: 'Missing data: MCAR, MAR, MNAR',
    title: 'Missing Data: MCAR, MAR, MNAR and Imputation',
    task: 'concepts',
    module: 'Data wrangling',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Diagnosing missingness mechanisms—MCAR, MAR, and MNAR—and selecting statistically sound single, multiple, or model-based imputation strategies.`,
    lead: r`Blank cells and missing indicators occur across nearly every real-world dataset. Blindly dropping rows or imputing simple column means distorts feature distributions, collapses variance, and introduces severe sampling bias. Donald Rubin's taxonomy—Missing Completely at Random (MCAR), Missing at Random (MAR), and Missing Not at Random (MNAR)—governs whether missingness can be ignored, conditioned on observed covariates, or modelled as an informative signal.`,
    intuition: [
      r`Imagine administering a medical health survey measuring body weight and blood pressure. Suppose a lab technician accidentally drops five test tubes and their test results shatter on the floor. The missingness was caused by physical clumsiness completely unrelated to the patients' health or weight. This is Missing Completely at Random (MCAR): missing values are a random subsample of the true population. If you discard these rows (complete case analysis), your statistical estimators lose statistical power but remain unbiased.`,
      r`Now suppose younger patients are far less likely to report their annual blood pressure because they visit doctors less frequently, but among people of the same age, missingness is unrelated to their actual blood pressure. This is Missing at Random (MAR): missingness depends systematically on an observed variable (age), but not on the unobserved value itself. Dropping rows here causes severe bias (your sample over-represents older people). However, if you condition on age (e.g. imputing blood pressure using age-stratified models or regression imputation), unbiased estimates are recovered.`,
      r`Finally, suppose patients with severe clinical obesity deliberately skip the survey question asking for their weight. The probability that weight is missing depends directly on the unobserved weight itself. This is Missing Not at Random (MNAR). No standard imputation method that relies solely on observed data can fix this bias without explicitly modelling the censoring mechanism itself (e.g. Heckman selection models or adding explicit binary missingness indicator flags).`,
    ],
    analogy: r`Distinguishing between a phone call dropped because of random atmospheric static (MCAR), a call skipped because it rang during business hours (MAR), and a debtor refusing to answer calls from a debt-collection agency (MNAR).`,
    steps: [
      r`Quantify missingness topography: calculate the percentage of missing values per column and plot missingness co-occurrence patterns.`,
      r`Diagnose the missingness mechanism: test whether missingness correlates with other observed features (ruling out MCAR via logistic regression or Little's test).`,
      r`Select an imputation strategy: use median or mode for quick baseline models, or iterative multivariate imputation (MICE / MissForest / KNN) for MAR data.`,
      r`Preserve uncertainty with Multiple Imputation: generate $M$ imputed datasets, fit models on each, and pool parameters via Rubin's rules to avoid underestimating standard errors.`,
      r`Encode missingness as a feature: append binary indicator columns ($\mathbf{1}_{x \text{ is missing}}$) to allow tree models to learn informative MNAR patterns.`,
    ],
    math: [
      {
        h: 'Rubin\'s formal missingness mechanisms',
        tex: r`$$P(M \mid Y_{\text{obs}}, Y_{\text{mis}}) = \begin{cases} P(M) & \text{MCAR} \\ P(M \mid Y_{\text{obs}}) & \text{MAR} \\ P(M \mid Y_{\text{obs}}, Y_{\text{mis}}) & \text{MNAR} \end{cases}$$`,
        p: r`Here $M \in \{0, 1\}^n$ is the binary missingness indicator vector, $Y_{\text{obs}}$ are observed entries, and $Y_{\text{mis}}$ are missing values. Under MCAR, missingness is independent of all data. Under MAR, missingness depends only on observed covariates $Y_{\text{obs}}$. Under MNAR, missingness depends on the unobserved values $Y_{\text{mis}}$ themselves.`,
      },
      {
        h: 'Variance collapse under single mean imputation',
        tex: r`$$\mathbb{E}[s^2_{\text{imp}}] = \frac{n_{\text{obs}} - 1}{n - 1} \sigma^2 < \sigma^2$$`,
        p: r`Imputing missing values with the constant sample mean artificially pulls the empirical variance toward zero by factor $\frac{n_{\text{obs}} - 1}{n - 1}$. This deflation distorts confidence intervals and artificially inflates test statistics, generating false positive discoveries.`,
      },
      {
        h: 'Rubin\'s pooling rules for Multiple Imputation',
        tex: r`$$\bar{\theta} = \frac{1}{M} \sum_{m=1}^M \hat{\theta}^{(m)}, \qquad T = \bar{W} + \Big(1 + \frac{1}{M}\Big) B, \quad \bar{W} = \frac{1}{M}\sum W_m, \quad B = \frac{1}{M-1}\sum (\hat{\theta}^{(m)} - \bar{\theta})^2$$`,
        p: r`Multiple Imputation draws $M$ plausible values for each missing cell to create $M$ complete datasets. The pooled parameter $\bar{\theta}$ averages point estimates, while total variance $T$ combines within-imputation variance $\bar{W}$ and between-imputation variance $B$, accurately propagating imputation uncertainty into downstream inferences.`,
      },
    ],
    keyPoints: [
      r`Rubin's classification: understanding whether missingness is MCAR, MAR, or MNAR dictates whether complete-case deletion or imputation is valid.`,
      r`Variance deflation: single mean imputation artificially compresses variance and distorts covariance structures, inflating false positive rates.`,
      r`Informative missingness: in tree-based machine learning, adding binary missing indicators ($\mathbf{1}_{\text{missing}}$) allows models to leverage MNAR signals directly.`,
    ],
    pitfalls: [
      r`Defaulting to dropna() without inspection: dropping missing rows under MAR or MNAR introduces severe sample truncation and survivor bias.`,
      r`Imputing before train/test splitting: computing the mean or median over the entire dataset before splitting leaks test set statistics into training data.`,
      r`Believing MAR means "at random": despite its confusing name, MAR is NOT random; missingness depends systematically on other observed features.`,
    ],
    code: r`import numpy as np

np.random.seed(42)
n = 100
age = np.random.uniform(20, 60, n)
true_income = 20000 + 1200 * age + np.random.normal(0, 5000, n)

# Missingness depends on age: younger people less likely to report income (MAR)
prob_missing = 1.0 / (1.0 + np.exp(0.15 * (age - 35)))
is_missing = np.random.binomial(1, prob_missing).astype(bool)

obs_income = true_income.copy()
obs_income[is_missing] = np.nan

mean_imputed = obs_income.copy()
mean_imputed[is_missing] = np.nanmean(obs_income)

poly = np.polyfit(age[~is_missing], obs_income[~is_missing], deg=1)
reg_imputed = obs_income.copy()
reg_imputed[is_missing] = np.polyval(poly, age[is_missing])

print(f"Missing records: {np.sum(is_missing)} / {n} ({np.sum(is_missing)/n*100:.1f}%)")
print(f"True population mean income:    {np.mean(true_income):.2f}")
print(f"Complete-case (dropped) mean:   {np.nanmean(obs_income):.2f} (Biased!)")
print(f"Mean imputed variance:          {np.var(mean_imputed):.2f} vs True: {np.var(true_income):.2f}")
print(f"Regression imputed mean income: {np.mean(reg_imputed):.2f} (Unbiased under MAR)")`,
    quiz: [
      {
        q: r`In Rubin's missing data taxonomy, what distinguishes Missing at Random (MAR) from Missing Completely at Random (MCAR)?`,
        o: [
          r`Under MAR, missingness depends systematically on observed covariates; under MCAR, missingness is entirely independent of all variables`,
          r`Under MAR, missingness cannot be corrected by any statistical method`,
          r`Under MCAR, missing values must be imputed with zero`,
          r`Under MAR, missing values only occur in text columns`,
        ],
        a: 0,
        why: r`MCAR means missingness is pure random noise ($P(M \mid Y) = P(M)$). MAR means missingness depends systematically on other observed variables ($P(M \mid Y_{\text{obs}}, Y_{\text{mis}}) = P(M \mid Y_{\text{obs}})$); conditioning on those observed variables resolves the bias.`,
      },
      {
        q: r`Why is imputing missing values with a single column mean considered hazardous for subsequent hypothesis testing?`,
        o: [
          r`It artificially reduces the sample variance, inflating test statistics and producing falsely narrow confidence intervals`,
          r`It causes the matrix determinant to become negative`,
          r`It converts continuous variables into discrete integers`,
          r`It violates the central limit theorem`,
        ],
        a: 0,
        why: r`Replacing varying unobserved points with an identical constant value clusters data around the mean, shrinking the estimated variance $\sigma^2$ and standard error, which leads to artificially small p-values and inflated Type I error rates.`,
      },
      {
        q: r`When evaluating a machine learning model, why must imputation transformers (like median or KNN imputers) be fitted strictly on the training split?`,
        o: [
          r`Fitting on the full dataset before splitting causes data leakage, allowing test set distribution statistics to contaminate training`,
          r`Imputers cannot process arrays with more than 1,000 rows`,
          r`Test sets are forbidden from containing missing values`,
          r`Scikit-learn raises a syntax error if an imputer is used on test sets`,
        ],
        a: 0,
        why: r`If you compute the imputation statistic (e.g. mean or median) across the entire dataset before train/test splitting, information from test labels and features leaks into the training pipeline, leading to over-optimistic performance estimates.`,
      },
    ],
    usedBy: [],
    prereq: ['sampling-and-standard-error', 'confidence-intervals', 'data-cleaning-and-validation'],
    related: ['data-cleaning-and-validation', 'pandas-and-polars-patterns', 'knn_regressor'],
    keywords: 'missing data mcar mar mnar imputation mice knn imputation rubin rules data wrangling',
  },
  {
    id: 'outlier-handling',
    short: 'Outlier handling',
    title: 'Outlier Handling',
    task: 'concepts',
    module: 'Data wrangling',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Detecting, evaluating, and transforming anomalous extreme observations using robust statistical thresholds, clipping, and power transforms.`,
    lead: r`Extreme outliers corrupt parametric estimators, inflate standard errors, and distort loss gradients during model training. Simply deleting every extreme row discards genuine black-swan signals and induces severe sample truncation. Systematic outlier handling diagnoses whether anomalies stem from measurement corruption or genuine heavy tails, deploying robust winsorisation, clipping, or loss reformulation.`,
    intuition: [
      r`Imagine calculating the average net worth of ten patrons enjoying coffee at a neighbourhood café. Nine patrons earn normal middle-class salaries around £50,000. Suddenly, a tech billionaire walks in with a net worth of £50,000,000,000. If you calculate the arithmetic mean, the café's average patron net worth rockets to £5,000,045,000. A standard linear regression or Ordinary Least Squares model trained on this sample will tilt its entire prediction surface to accommodate this single individual, rendering its predictions wildly inaccurate for the other nine ordinary patrons.`,
      r`What should an analyst do? The knee-jerk reaction—immediately deleting the billionaire's record—is often dangerous. If you are predicting luxury yacht purchases, the billionaire is your primary customer; deleting them erases the signal you exist to model. First, we must distinguish between error outliers (a human entering 999999 as a placeholder for unknown data) and valid extremes (rare but genuine high-value events). Error outliers should be quarantined or replaced with nulls; valid extremes require statistical treatment.`,
      r`To handle valid heavy tails without corrupting models, data scientists employ three robust strategies: trimming (removing observations beyond extreme quantile boundaries like the 1st and 99th percentiles), winsorisation or clipping (capping values exceeding a threshold $c$ at $c$, preserving rank order while bounding leverage), and monotonic transformations (such as logarithmic or Box-Cox transforms) that pull exponential right tails inward. Alternatively, switching from squared error loss ($L_2$) to robust Huber or pinball loss bounds the gradient influence of extreme residuals.`,
    ],
    analogy: r`Trimming the extreme high and low scores from Olympic judges to prevent a single biased score from deciding the medal.`,
    steps: [
      r`Profile tail behaviour: visualise distributions using box plots, histograms, and QQ plots to assess whether data exhibits Gaussian, log-normal, or Pareto heavy tails.`,
      r`Compute robust boundary thresholds: calculate the Interquartile Range ($\text{IQR} = Q_3 - Q_1$) or Median Absolute Deviation (MAD) to establish non-parametric fence limits.`,
      r`Classify outlier genesis: audit anomalous records against domain rules to separate sensor or keystroke errors from genuine natural extremes.`,
      r`Apply transformation or clipping: winsorise extreme values to lower and upper percentile fences ($[P_1, P_{99}]$) or apply $\log(1 + x)$ to compress positive right tails.`,
      r`Select robust downstream models: use tree ensembles or loss functions with linear tail penalties (Huber loss) when outliers carry valid predictive signal.`,
    ],
    math: [
      {
        h: 'Tukey\'s Interquartile Range (IQR) fence boundaries',
        tex: r`$$\text{Fence}_{\text{lower}} = Q_1 - 1.5 \cdot \text{IQR}, \qquad \text{Fence}_{\text{upper}} = Q_3 + 1.5 \cdot \text{IQR}$$`,
        p: r`Here $Q_1$ is the 25th percentile, $Q_3$ is the 75th percentile, and $\text{IQR} = Q_3 - Q_1$. For Gaussian distributions, the $1.5 \times \text{IQR}$ fence encompasses approximately $99.3\%$ of values. Observations outside this interval represent potential outliers; values beyond $3.0 \times \text{IQR}$ are classified as extreme outliers.`,
      },
      {
        h: 'Winsorisation (quantile clipping) operator',
        tex: r`$$\tilde{x}_i = \begin{cases} c_{\text{lower}} & \text{if } x_i < c_{\text{lower}} \\ x_i & \text{if } c_{\text{lower}} \le x_i \le c_{\text{upper}} \\ c_{\text{upper}} & \text{if } x_i > c_{\text{upper}} \end{cases}$$`,
        p: r`Cut-offs $c_{\text{lower}}$ and $c_{\text{upper}}$ are chosen percentiles (such as the 1st and 99th percentiles). Capping preserves sample size $n$ and monotonic rank order while strictly bounding maximum leverage $x_i^2$, preventing a single extreme observation from dictating squared-error loss gradients.`,
      },
      {
        h: 'Huber loss gradient saturation',
        tex: r`$$\frac{\partial L_\delta}{\partial r} = \begin{cases} r & \text{if } |r| \le \delta \\ \delta \cdot \text{sign}(r) & \text{if } |r| > \delta \end{cases}$$`,
        p: r`For residual $r = y - \hat{y}$, Huber loss scales quadratically for small errors ($|r| \le \delta$) but switches to linear scaling for large errors ($|r| > \delta$). The derivative saturates at constant $\pm \delta$, preventing extreme target outliers from dominating gradient updates.`,
      },
    ],
    keyPoints: [
      r`Distinction between error and signal: never delete extreme values without verifying whether they represent data corruption or genuine black-swan events.`,
      r`Non-parametric bounds: IQR and MAD fences detect outliers without assuming data follows a normal bell curve.`,
      r`Winsorisation preserves sample size: capping at extreme quantiles neutralises leverage while retaining valid observational rows.`,
    ],
    pitfalls: [
      r`Blind 3-sigma rule on non-normal distributions: applying mean $\pm 3\sigma$ to skewed log-normal or power-law data falsely flags valid high-volume transactions as outliers while corrupting the mean.`,
      r`Truncation bias: dropping high-value outliers when estimating financial totals systematically underestimates risk and expected revenue.`,
      r`Fitting outlier cut-offs on test data: computing winsorisation limits on test splits leaks distribution boundaries; boundaries must be fit on training data and applied to test.`,
    ],
    code: r`import numpy as np

np.random.seed(42)
x = np.concatenate([np.random.normal(50, 5, 95), [180, 220, -40, 195, 210]])
q1, q3 = np.percentile(x, [25, 75])
iqr = q3 - q1
lower_fence, upper_fence = q1 - 1.5 * iqr, q3 + 1.5 * iqr

p1, p99 = np.percentile(x, [1, 99])
x_winsor = np.clip(x, p1, p99)

outliers = (x < lower_fence) | (x > upper_fence)
print(f"Total samples: {len(x)}, Outliers detected: {np.sum(outliers)}")
print(f"Raw mean: {np.mean(x):.2f}, std: {np.std(x):.2f}")
print(f"Winsorised mean: {np.mean(x_winsor):.2f}, std: {np.std(x_winsor):.2f}")`,
    quiz: [
      {
        q: r`Why does applying the standard 3-sigma rule (mean $\pm 3\sigma$) often fail on skewed financial transaction data?`,
        o: [
          r`Extreme outliers pull the sample mean upward and heavily inflate $\sigma$, masking valid outliers while misclassifying valid positive skewness as anomalous`,
          r`The 3-sigma rule can only be evaluated on integer values`,
          r`Standard deviations cannot be calculated when sample size exceeds 1,000`,
          r`Financial transactions must always follow a uniform distribution`,
        ],
        a: 0,
        why: r`The sample mean and standard deviation have a 0% breakdown point. In heavily right-skewed or heavy-tailed distributions, a few massive values drastically inflate $\sigma$, creating an artificially wide acceptance band that fails to flag anomalies while corrupting the centre.`,
      },
      {
        q: r`What is the primary operational advantage of winsorisation (clipping at quantiles) over row deletion?`,
        o: [
          r`It preserves the total sample size $n$ and rank ordering while bounding leverage on squared-error loss gradients`,
          r`It guarantees that all values become normally distributed`,
          r`It removes the need for cross-validation`,
          r`It converts continuous numbers into discrete categories`,
        ],
        a: 0,
        why: r`Row deletion discards observational evidence and induces truncation bias. Winsorisation caps extreme values at safe percentile limits (e.g. 1st and 99th percentiles), bounding outlier influence while retaining the record in training.`,
      },
      {
        q: r`When preparing data for a gradient boosted tree model, how should valid extreme outliers in predictor features be handled?`,
        o: [
          r`Tree models split on monotonic rank thresholds, making them inherently invariant to monotonic scaling and extreme outlier magnitudes`,
          r`Outliers must always be replaced with zero`,
          r`Features must be scaled using min-max normalisation between -1 and 1`,
          r`Decision trees crash when feature values exceed 100`,
        ],
        a: 0,
        why: r`Decision trees choose split points based on ordered partitions ($x_j \le \theta$). A value of 1,000,000 is placed on the exact same side of a split as a value of 100, making decision trees robust to monotonic feature outliers.`,
      },
    ],
    usedBy: ['scaling-and-transforms-standard-robust-box-cox-yeo-johnson'],
    prereq: ['sampling-and-standard-error', 'data-cleaning-and-validation'],
    related: ['data-cleaning-and-validation', 'robust_regression', 'isolation-forest'],
    keywords: 'outlier handling winsorisation tukey iqr mad clipping robust statistics huber loss data wrangling',
  },
  {
  "id": "dates-time-zones-and-temporal-joins",
  "short": "Dates, time zones & joins",
  "title": "Dates, Time Zones, and Temporal Joins in Data Engineering",
  "task": "concepts",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Mastering ISO 8601 timestamps, UTC normalisation, daylight saving edge cases, as-of joins, and point-in-time correct temporal feature lookups.",
  "lead": "Temporal data is ubiquitous in real-world machine learning, yet improper handling of time zones, daylight saving shifts, and non-aligned timestamps introduces subtle, silent data corruption and severe lookahead leakage. A single local time mix-up can make an event appear an hour before it actually occurred, or corrupt training targets when matching asynchronous market prices to client orders.",
  "analogy": "Imagine matching flight departure announcements in Tokyo with passenger bookings recorded in New York. If both systems record \"14:00\" without specifying time zones or offsets, you cannot know which happened first. Converting every event to Greenwich Mean Time (UTC) establishes a single unambiguous timeline, while an as-of join acts like looking at the departure board right at the moment you step up to the gate, ensuring you only see the latest scheduled boarding gate rather than tomorrow's update.",
  "intuition": [
    "Temporal information spans two concepts: physical time (an absolute point on the cosmic timeline, correctly measured in Unix epoch seconds or UTC ISO 8601 strings) and civil time (local wall-clock time subject to political boundaries, time zones, and daylight saving time adjustments).",
    "A fundamental rule of data engineering is: ingest and store all timestamps in UTC ($+00:00$), and only convert to local civil time at the presentation layer or when extracting calendar features (such as local hour of day or day of week). Daylight saving transitions create ambiguous times (an hour repeating during autumn fallback) and nonexistent times (an hour skipped during spring forward).",
    "Standard relational equijoins require exact timestamp matches ($t_A = t_B$), which almost never occurs across independent distributed telemetry streams. Instead, time-series workflows require temporal inequality joins, most notably the as-of join (or backward merge).",
    "An as-of join merges each record from a primary table with the most recent preceding record from a secondary reference table, strictly enforcing $t_{\\mathrm{ref}} \\le t_{\\mathrm{event}}$. This guarantees point-in-time correctness, preventing target leakage where future prices or status changes inadvertently leak into past feature states."
  ],
  "steps": [
    "Ingest and canonicalise: Parse input strings against ISO 8601 standard (`YYYY-MM-DDTHH:MM:SSZ`), resolve timezone offsets immediately, and store as UTC timestamps or epoch nanoseconds.",
    "Feature extraction in local time: When creating behavioural features (e.g. rush-hour indicators, morning vs evening shopping), convert UTC to user-local civil time using the regional timezone database (IANA tzdb).",
    "Index sorting: Ensure both event and reference tables are strictly sorted by entity ID and timestamp prior to temporal joining.",
    "Point-in-time as-of join: Execute backward matching (`join_asof`) on matching keys (e.g. `user_id`, `ticker`) matching the latest reference timestamp $\\le$ the query timestamp.",
    "Tolerance and lookahead audit: Configure a backward tolerance window (e.g. do not match reference data older than 24 hours) and assert zero forward-looking records."
  ],
  "math": [
    {
      "h": "Universal Time Normalisation",
      "tex": "t_{\\mathrm{UTC}} = t_{\\mathrm{local}} - \\Delta_{\\mathrm{tz}}(\\mathrm{date}, \\mathrm{location})",
      "p": "Physical time is invariant. Local civil time is adjusted by the historical offset $\\Delta_{\\mathrm{tz}}$ dictated by timezone rules and daylight saving time."
    },
    {
      "h": "As-Of Temporal Join Specification",
      "tex": "j^*(i) = \\operatorname*{arg\\,max}_{j \\in \\mathcal{R}_{k_i}} \\left\\{ t_j \\;\\middle|\\; t_j \\le t_i \\;\\land\\; t_i - t_j \\le \\tau_{\\max} \\right\\}",
      "p": "For query event $i$ with key $k_i$ at time $t_i$, the as-of join identifies reference index $j^*$ with the latest timestamp $t_j$ strictly before $t_i$, bounded by maximum lookback tolerance $\\tau_{\\max}$."
    },
    {
      "h": "Lookahead Leakage Violation Condition",
      "tex": "\\exists i, j : \\text{Joined}(i, j) \\implies t_j > t_i \\quad [\\text{Fatal Target Leakage}]",
      "p": "If any feature state incorporated at decision time $t_i$ derives from an event at $t_j > t_i$, the offline validation model evaluates with non-causal future information."
    }
  ],
  "code": "import pandas as pd\nimport numpy as np\n\n# Create trade execution events (primary table)\ntrades = pd.DataFrame({\n    'timestamp': pd.to_datetime([\n        '2026-03-15 10:00:02Z',\n        '2026-03-15 10:00:07Z',\n        '2026-03-15 10:00:15Z'\n    ]),\n    'symbol': ['AAPL', 'AAPL', 'AAPL'],\n    'shares': [100, 250, 50]\n})\n\n# Create asynchronous quote updates (reference table)\nquotes = pd.DataFrame({\n    'timestamp': pd.to_datetime([\n        '2026-03-15 10:00:00Z',\n        '2026-03-15 10:00:05Z',\n        '2026-03-15 10:00:12Z',\n        '2026-03-15 10:00:20Z'\n    ]),\n    'symbol': ['AAPL', 'AAPL', 'AAPL', 'AAPL'],\n    'bid_price': [182.10, 182.25, 182.15, 182.40]\n})\n\n# Sort both frames by timestamp (prerequisite for merge_asof)\ntrades = trades.sort_values('timestamp')\nquotes = quotes.sort_values('timestamp')\n\n# Point-in-time backward join: find the latest quote before each trade\nenriched_trades = pd.merge_asof(\n    trades,\n    quotes,\n    on='timestamp',\n    by='symbol',\n    direction='backward',\n    tolerance=pd.Timedelta('10s')\n)\n\nprint(enriched_trades[['timestamp', 'symbol', 'shares', 'bid_price']])\n# Output matches 10:00:02 -> 182.10, 10:00:07 -> 182.25, 10:00:15 -> 182.15",
  "keyPoints": [
    "Store and transport timestamps exclusively in UTC; convert to local civil time solely for domain features or reporting.",
    "As-of joins match each record with the most recent preceding entry from another table, preventing future data leakage.",
    "Temporal joins require both dataframes to be sorted chronologically on the join timestamp.",
    "Daylight saving transitions cause duplicate hours in autumn and missing hours in spring in naive local datetimes."
  ],
  "pitfalls": [
    "Using naive datetime objects without timezone metadata (`tz_localize(None)`), causing silent 1-to-5 hour offsets when merging across systems.",
    "Performing standard forward joins or nearest joins in trading or medical records, allowing future outcomes to leak into predictive features.",
    "Neglecting daylight saving shifts when aggregating by \"local hour of day\", resulting in artificial spikes or dips twice a year."
  ],
  "quiz": [
    {
      "q": "Why should database timestamps almost always be stored in UTC rather than local time?",
      "o": [
        "UTC stores smaller integer values that take half the disk space",
        "UTC provides an unambiguous, monotonic timeline free from daylight saving anomalies and timezone shifts",
        "Database engines cannot index columns that contain timezone offsets",
        "UTC automatically handles categorical variable encodings"
      ],
      "a": 1,
      "why": "UTC is an invariant, continuous reference standard without discontinuities caused by daylight saving changes or local government decree."
    },
    {
      "q": "What distinguishes an as-of join (`merge_asof`) with `direction=\"backward\"` from an inner join?",
      "o": [
        "It requires exact timestamp equivalence across both tables",
        "It pairs each row in the left table with the closest preceding timestamp in the right table",
        "It replaces missing values with the overall column mean",
        "It randomly samples rows from the secondary dataset"
      ],
      "a": 1,
      "why": "A backward as-of join matches each record with the most recent historical record that occurred at or before that record's timestamp."
    },
    {
      "q": "What critical machine learning error occurs if an analyst uses `direction=\"nearest\"` when enriching transaction data with reference prices?",
      "o": [
        "Multicollinearity in continuous predictors",
        "Lookahead leakage, because future reference prices after the transaction could be selected",
        "Underfitting due to excessive regularisation",
        "Covariate shift between train and test sets"
      ],
      "a": 1,
      "why": "`direction=\"nearest\"` can select a reference timestamp that occurred in the future relative to the transaction, leaking unavailable future information into features."
    }
  ],
  "related": [
    "data-leakage",
    "pandas-and-polars-patterns",
    "train-validation-test-splits-group-and-time-based"
  ],
  "keywords": "dates, time zones, temporal joins, as-of join, merge_asof, utc, daylight saving, lookahead leakage, point-in-time correctness",
  "usedBy": []
},
  {
    id: 'encoding-categoricals-one-hot-ordinal-target-woe',
    short: 'Encoding categoricals',
    title: 'Encoding Categoricals: One-Hot, Ordinal, Target, WoE',
    task: 'concepts',
    module: 'Feature engineering',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Transforming discrete strings and high-cardinality levels into informative numerical representations while preventing target leakage and dimensionality explosion.`,
    lead: r`Mathematical models cannot multiply, divide, or take gradients over raw string labels. Encoding maps discrete categorical variables into numeric vectors, but each strategy balances distinct trade-offs between dimensionality, ordinal assumptions, and information retention. From sparse one-hot expansions to smoothed target encoding and Weight of Evidence (WoE), selecting the correct transformation prevents curse-of-dimensionality memory crashes and catastrophic target leakage.`,
    intuition: [
      r`Imagine predicting hotel booking cancellations using categorical columns like room type (Standard, Deluxe, Suite) and user nationality (195 countries). The simplest idea is assigning consecutive integers: Standard = 1, Deluxe = 2, Suite = 3. For room type, this ordinal encoding makes intuitive sense because there is a natural hierarchy of luxury and price. But if you apply arbitrary integers to nationalities (France = 1, Germany = 2, Japan = 3), a linear model or neural network assumes that Germany is twice France and Japan is three times France, inventing nonsensical mathematical arithmetic out of arbitrary alphabetical order.`,
      r`One-hot encoding avoids this false ordering by creating an independent binary flag for each level (e.g. [1, 0, 0] for France). For variables with few categories (low cardinality), one-hot encoding is clean and effective. But for UK postcodes or search queries with 50,000 unique levels, one-hot encoding explodes the feature space into a colossal 50,000-column sparse matrix. Tree models struggle because each individual binary split isolates only a tiny fraction of samples, diluting statistical split strength.`,
      r`Target encoding and Weight of Evidence (WoE) solve high cardinality by condensing each category into a single continuous number representing its historical association with the outcome $y$. For each nationality, target encoding replaces the label with the mean cancellation rate of that country. To prevent rare categories (like a country with only 1 customer who cancelled) from overfitting to 100%, empirical Bayes m-estimate smoothing pulls rare categories toward the global cancellation prior.`,
    ],
    analogy: r`Translating a foreign menu: giving each dish an arbitrary catalogue number (ordinal), creating 200 checkboxes for 200 ingredients (one-hot), or simply labelling each dish with its average customer spiciness rating (target encoding).`,
    steps: [
      r`Audit cardinality and ordering: determine whether levels possess an intrinsic natural hierarchy (ordinal) or arbitrary nominal identity.`,
      r`Apply one-hot encoding to low-cardinality nominals ($k < 10$): drop one reference dummy column when training unregularised linear models to avoid multicollinearity.`,
      r`Map ranked tiers via ordinal encoding: assign monotonic integer values when domain hierarchy is strict (e.g. Low, Medium, High to 0, 1, 2).`,
      r`Deploy smoothed target encoding for high-cardinality features: blend category target means with global priors using m-estimate or empirical Bayes weighting.`,
      r`Enforce leakage-safe cross-validation: compute target encodings strictly inside cross-validation folds or using out-of-fold leave-one-out calculation to prevent target leakage.`,
    ],
    math: [
      {
        h: 'Smoothed empirical Bayes target encoding (m-estimate)',
        tex: r`$$\hat{S}_c = \frac{n_c \cdot \bar{y}_c + m \cdot \bar{y}_{\text{global}}}{n_c + m}$$`,
        p: r`Here $n_c$ is the count of category $c$ in training data, $\bar{y}_c$ is the sample mean of the target for category $c$, $\bar{y}_{\text{global}}$ is the overall target mean across all rows, and $m > 0$ is the smoothing weight of the prior. When $n_c \gg m$, $\hat{S}_c \to \bar{y}_c$; when $n_c \to 0$, $\hat{S}_c \to \bar{y}_{\text{global}}$, preventing rare categories from producing overfit extreme values.`,
      },
      {
        h: 'Weight of Evidence (WoE) for binary classification',
        tex: r`$$\text{WoE}_c = \ln\left(\frac{P(Y=1 \mid X=c)}{P(Y=0 \mid X=c)} \Big/ \frac{P(Y=1)}{P(Y=0)}\right) = \ln\left(\frac{B_c / B_{\text{total}}}{G_c / G_{\text{total}}}\right)$$`,
        p: r`Here $B_c$ and $G_c$ are bad (events, $y=1$) and good (non-events, $y=0$) counts for category $c$. WoE represents the log-odds ratio relative to the population base rate. Because WoE possesses an exact linear relationship with log-odds, it is extensively used in credit risk scorecards with logistic regression.`,
      },
      {
        h: 'Dummy variable trap and rank deficiency',
        tex: r`$$\sum_{j=1}^k D_j = \mathbf{1}_n = X_0 \implies \text{rank}(X) < k$$`,
        p: r`The sum of all $k$ one-hot binary indicator columns equals the constant intercept column vector $\mathbf{1}_n$, creating perfect multicollinearity. For unregularised Ordinary Least Squares, one category must be omitted ($k-1$ dummy columns) to ensure the design matrix $X^T X$ is invertible.`,
      },
    ],
    keyPoints: [
      r`Cardinality dictates strategy: use one-hot for low cardinality ($<10$ levels), frequency or target encoding for high cardinality.`,
      r`Target leakage hazard: target encoding must never compute category statistics across the entire dataset before cross-validation splitting.`,
      r`Bayesian prior smoothing: blending category averages with global priors prevents rare levels with tiny sample sizes from producing extreme overfit predictions.`,
    ],
    pitfalls: [
      r`Catastrophic target leakage: calculating target means on training and validation data simultaneously causes near-perfect training scores and disastrous test performance.`,
      r`Unseen categories in production: new categories absent during training crash one-hot transformers unless handle_unknown='ignore' or fallback to global target prior is configured.`,
      r`Ordinal encoding on nominal variables: assigning sequential integers to arbitrary categories forces non-linear models to navigate artificial metric distances.`,
    ],
    code: r`import numpy as np

categories = np.array(['UK', 'FR', 'DE', 'UK', 'US', 'FR', 'UK', 'LUX'])
y = np.array([1, 0, 1, 1, 0, 0, 1, 0], dtype=float)
global_mean, m = np.mean(y), 2.0  # m-estimate prior weight

encoded = np.zeros_like(y)
for cat in np.unique(categories):
    idx = np.where(categories == cat)[0]
    n_c, y_c = len(idx), np.sum(y[idx])
    smoothed = (y_c + m * global_mean) / (n_c + m)
    encoded[idx] = smoothed

print(f"Global target mean: {global_mean:.3f}")
for c in ['UK', 'LUX']:
    print(f"Category {c} target encoded: {encoded[categories == c][0]:.3f}")`,
    quiz: [
      {
        q: r`Why does raw unsmoothed target encoding overfit heavily on categories with very few observations?`,
        o: [
          r`A category with a single observation will receive an encoding of exactly 0.0 or 1.0, memorising target noise instead of true population affinity`,
          r`It converts numbers into complex imaginary components`,
          r`It causes the matrix determinant to equal zero`,
          r`It only operates when the target is multi-class`,
        ],
        a: 0,
        why: r`If category 'LUX' appears only once with target $y=1$, unsmoothed target encoding assigns it 1.0 (100% cancellation rate), creating an over-confident feature based on zero statistical evidence. Smoothing pulls small-sample categories toward the global mean.`,
      },
      {
        q: r`What is the primary danger of applying ordinal integer encoding (e.g. 1, 2, 3, 4) to nominal variables like car colours?`,
        o: [
          r`It imposes an artificial metric distance and ordering, causing linear models and neural networks to assume colour 4 is mathematically four times colour 1`,
          r`It causes memory exhaustion in decision trees`,
          r`It is unsupported in Python`,
          r`It requires all colours to have equal row counts`,
        ],
        a: 0,
        why: r`Nominal categories possess no quantitative hierarchy. Assigning numbers implies metric distances ($|1 - 2| = |2 - 3|$) and mathematical ratios that corrupt linear regression, distance metrics, and neural weights.`,
      },
      {
        q: r`How must target encoding be calculated to completely eliminate data leakage during cross-validation?`,
        o: [
          r`Category target statistics must be computed strictly on the training fold, or calculated out-of-fold without using each row's own target value`,
          r`Target encoding should be computed across the test fold first`,
          r`The target variable must be binned into quintiles`,
          r`Target encoding cannot be used in cross-validation`,
        ],
        a: 0,
        why: r`If validation row targets are included when computing category means, the model learns to reconstruct the validation target directly from the encoding, producing severe over-optimistic leakage. Out-of-fold or strictly train-fold statistics prevent this.`,
      },
    ],
    usedBy: ['scaling-and-transforms-standard-robust-box-cox-yeo-johnson'],
    prereq: ['sampling-and-standard-error', 'cross-validation'],
    related: ['scaling-and-transforms-standard-robust-box-cox-yeo-johnson', 'multicollinearity-and-vif', 'logistic_regression'],
    keywords: 'categorical encoding one hot encoding target encoding woe weight of evidence ordinal encoding high cardinality feature engineering',
  },
  {
    id: 'scaling-and-transforms-standard-robust-box-cox-yeo-johnson',
    short: 'Scaling and transforms',
    title: 'Scaling and Transforms: Standard, Robust, Box–Cox, Yeo–Johnson',
    task: 'concepts',
    module: 'Feature engineering',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Standardising feature ranges and normalising skewed distributions to satisfy linear assumptions and accelerate gradient convergence.`,
    lead: r`Distance metrics, regularisation penalties, and gradient descent updates are acutely sensitive to feature scales. If one feature spans $[0, 1]$ while another ranges $[0, 1{,}000{,}000]$, the larger variable completely dominates Euclidean distances and distorts L1/L2 penalties. Transforming features via standard, robust, or power transformations aligns feature scales and normalises skewed distributions into symmetrical Gaussian-like shapes.`,
    intuition: [
      r`Imagine training a k-Nearest Neighbours or Support Vector Machine model to evaluate bank loan risk based on two customer attributes: age in years (ranging from 18 to 75) and annual income in pounds (ranging from £15,000 to £500,000). If you compute the Euclidean distance between two applicants, a difference of 30 years in age contributes $(30)^2 = 900$ to the squared distance, while a difference of £10,000 in income contributes $(10,000)^2 = 100,000,000$. The income feature is over 100,000 times more influential simply because of the arbitrary choice of measurement currency. Age becomes completely invisible to the algorithm.`,
      r`Scaling resolves this by transforming variables into comparable dimensionless numerical spaces. Standard scaling (Z-score normalisation) shifts the mean to 0 and rescales variance to 1. Min-max scaling squashes values into a bounded interval such as $[0, 1]$. However, both techniques are vulnerable to extreme outliers: a single massive outlier compresses all normal data points into a microscopic cluster near zero. Robust scaling replaces the sample mean and variance with the median and interquartile range (IQR), ensuring scale normalisation remains unaffected by rogue outliers.`,
      r`Beyond scaling spread, many linear algorithms and hypothesis tests assume underlying errors or features are normally distributed. Highly skewed variables (such as website visit durations or insurance claim amounts) violate these assumptions. Power transformations—such as the Box-Cox transform for strictly positive data and the Yeo-Johnson transform for data containing zero or negative values—estimate an optimal power parameter $\lambda$ that mathematically bends skewed probability distributions into symmetrical, near-Gaussian bell curves.`,
    ],
    analogy: r`Converting currencies from Yen, Pounds, and Dollars into a single standardised international credit unit so that prices can be compared on equal terms.`,
    steps: [
      r`Diagnose distribution characteristics: inspect feature skewness, presence of negative values, and outlier density using histograms and quantile plots.`,
      r`Select scaling mechanism: apply standard scaling ($z = (x - \mu)/\sigma$) for Gaussian features, Min-Max scaling for bounded bounds (e.g. neural network inputs), or robust scaling (median/IQR) for outlier-rich data.`,
      r`Fit scaler exclusively on training data: calculate $\mu$, $\sigma$, or median strictly on training folds to prevent distribution leakage.`,
      r`Evaluate power transformations for skewed data: apply Box-Cox for strictly positive features ($x > 0$) or Yeo-Johnson for real-valued features with zeros and negatives.`,
      r`Optimise transformation parameter $\lambda$: maximise profile log-likelihood across grid search to find the power that minimises distribution skewness.`,
    ],
    math: [
      {
        h: 'Standard scaling vs Robust scaling',
        tex: r`$$z_i = \frac{x_i - \bar{x}}{s}, \qquad r_i = \frac{x_i - \text{median}(X)}{\text{IQR}(X)}$$`,
        p: r`Standard scaling centres at sample mean $\bar{x}$ and scales by standard deviation $s$. Robust scaling centres at the sample median and divides by $\text{IQR} = Q_3 - Q_1$, maintaining a 50% breakdown point that resists distortion from extreme outliers.`,
      },
      {
        h: 'Box-Cox power transformation ($x > 0$)',
        tex: r`$$y^{(\lambda)} = \begin{cases} \frac{x^\lambda - 1}{\lambda} & \text{if } \lambda \ne 0 \\ \ln(x) & \text{if } \lambda = 0 \end{cases}$$`,
        p: r`Parametrised by power $\lambda$, Box-Cox continuous power scaling maps positive distributions into Gaussian profiles. At $\lambda = 1$, the transform is linear (shift); at $\lambda = 0.5$, it acts as a square root; at $\lambda = 0$, it becomes the natural logarithm, compressing heavy right tails.`,
      },
      {
        h: r`Yeo-Johnson power transformation (all $x \in \mathbb{R}$)`,
        tex: r`$$\psi(\lambda, x) = \begin{cases} \frac{(x + 1)^\lambda - 1}{\lambda} & \text{if } \lambda \ne 0, x \ge 0 \\ \ln(x + 1) & \text{if } \lambda = 0, x \ge 0 \\ -\frac{(-x + 1)^{2 - \lambda} - 1}{2 - \lambda} & \text{if } \lambda \ne 2, x < 0 \\ -\ln(-x + 1) & \text{if } \lambda = 2, x < 0 \end{cases}$$`,
        p: r`Yeo-Johnson generalises Box-Cox to accommodate zero and negative values, guaranteeing monotonic continuity across the entire real line without requiring arbitrary additive positive shifts.`,
      },
    ],
    keyPoints: [
      r`Distance and gradient invariance: scaling ensures features contribute proportionately to Euclidean distance calculations and prevents elongated, zig-zagging gradient descent trajectories.`,
      r`Robust scaling resistance: median/IQR scaling resists outlier contamination, preventing extreme observations from squashing normal feature distributions.`,
      r`Yeo-Johnson zero-handling: unlike Box-Cox, Yeo-Johnson operates over positive, zero, and negative values without requiring arbitrary positive offset shifts.`,
    ],
    pitfalls: [
      r`Data leakage by fitting on entire dataset: computing scaler parameters ($\mu, \sigma$) across training and test sets leaks test distribution bounds.`,
      r`Tree-based model misconception: applying monotonic scaling or power transforms to features fed into decision trees, Random Forests, or XGBoost is computationally superfluous, as trees are invariant to monotonic univariate transforms.`,
      r`Inverting predictions without inverse transformation: when transforming a continuous target variable $y$ with Box-Cox, predictions must be inverted via inverse power transform back to original monetary or physical units.`,
    ],
    code: r`import numpy as np
from scipy import stats

np.random.seed(42)
raw = np.random.exponential(scale=2.0, size=100)

standardised = (raw - np.mean(raw)) / np.std(raw)
med = np.median(raw)
iqr_val = np.percentile(raw, 75) - np.percentile(raw, 25)
robust = (raw - med) / iqr_val
boxcox_trans, opt_lambda = stats.boxcox(raw)

print(f"Raw skewness:        {stats.skew(raw):.3f}")
print(f"Standardised skew:   {stats.skew(standardised):.3f} (mean: {np.mean(standardised):.1f})")
print(f"Robust scaled skew:  {stats.skew(robust):.3f} (median: {np.median(robust):.1f})")
print(f"Box-Cox skew (lambda={opt_lambda:.2f}): {stats.skew(boxcox_trans):.3f}")`,
    quiz: [
      {
        q: r`Why does standardising or min-max scaling features have virtually zero effect on the predictive accuracy of a Random Forest or XGBoost model?`,
        o: [
          r`Decision trees split on monotonic rank thresholds, making split decisions completely invariant to monotonic univariate scaling`,
          r`Tree models internally normalise all columns to Gaussian distributions`,
          r`Ensemble algorithms only process categorical variables`,
          r`Gradient boosting automatically divides all numbers by 100`,
        ],
        a: 0,
        why: r`Decision trees evaluate splits of the form $x_j \le \theta$. Monotonically scaling $x_j$ by $a x_j + b$ simply transforms the threshold $\theta$ by the same factor, leaving sample partitions and impurity gains identical.`,
      },
      {
        q: r`What is the primary constraint that limits the use of the classic Box-Cox transformation?`,
        o: [
          r`All feature values must be strictly positive ($x > 0$)`,
          r`The dataset must have fewer than 100 rows`,
          r`It can only be applied to binary classification labels`,
          r`The data must already follow a normal distribution`,
        ],
        a: 0,
        why: r`Box-Cox relies on power functions and natural logarithms ($\ln x$), which are undefined for zero and negative real numbers. The Yeo-Johnson transform was developed specifically to overcome this constraint.`,
      },
      {
        q: r`Why is RobustScaler (median and IQR) preferred over StandardScaler when scaling data with severe unclipped outliers?`,
        o: [
          r`StandardScaler's mean and variance are heavily distorted by outliers, squashing normal data into a narrow band, whereas median and IQR resist outlier leverage`,
          r`RobustScaler guarantees all outputs fall strictly between 0 and 1`,
          r`RobustScaler eliminates the need for test set splitting`,
          r`StandardScaler cannot process floating-point data`,
        ],
        a: 0,
        why: r`In StandardScaler, an extreme outlier inflates the sample standard deviation, shrinking the scaled values of typical records into a tiny range near zero. RobustScaler's median and IQR have a 50% breakdown point, preserving normal variation.`,
      },
    ],
    usedBy: ['lag-and-rolling-window-features'],
    prereq: ['outlier-handling', 'sampling-and-standard-error'],
    related: ['outlier-handling', 'encoding-categoricals-one-hot-ordinal-target-woe', 'knn_classifier', 'ridge_regression'],
    keywords: 'feature scaling standardisation normalisation robust scaler box cox yeo johnson power transform skewness feature engineering',
  },
  {
    id: 'lag-and-rolling-window-features',
    short: 'Lag and rolling-window features',
    title: 'Lag and Rolling-Window Features',
    task: 'concepts',
    module: 'Feature engineering',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Constructing historical lag shifts, rolling summary statistics, and exponentially weighted moving averages for tabular time-series forecasting.`,
    lead: r`Tabular models like XGBoost and LightGBM cannot inherently process sequential dependencies without explicit temporal feature engineering. Lag features and rolling-window aggregations convert sequential time-series into standard supervised learning matrices, capturing momentum, seasonality, and volatility. Rigorous window construction prevents lookahead leakage and ensures predictive features reflect strictly historical information.`,
    intuition: [
      r`Imagine predicting tomorrow's electricity consumption for a large city. If you provide a gradient boosted tree only with the date "Thursday, 12th November", the model has no way of knowing whether the city is currently experiencing a sudden cold snap or how much power was consumed yesterday. However, if you provide the electricity consumption from 24 hours ago (lag 1 day), from 7 days ago (lag 7 days, capturing weekly seasonality), and the average consumption over the past 3 days (rolling mean), the model instantly grasps current demand momentum and baseline expectations.`,
      r`Constructing temporal tabular features relies on two primary primitives: lags and rolling windows. A lag feature shifts the time series backward by $k$ time steps ($y_{t-k}$), allowing standard tabular regression models to condition on previous state values. Rolling-window features pass a sliding aggregation frame over past observations, computing summary statistics such as rolling mean (trend), rolling standard deviation (volatility), rolling min/max (envelope range), and exponentially weighted moving averages (EWMA), which weight recent observations more heavily than distant history.`,
      r`The single most catastrophic error in time-series feature engineering is lookahead leakage (future leakage). If you calculate a rolling 7-day average using a centred window that includes $t-3$ to $t+3$, your model is trained using information from three days in the future. In offline cross-validation, the model appears to predict the future with supernatural precision. When deployed into production, tomorrow's data does not exist, causing model accuracy to collapse completely. Every rolling feature must be strictly left-aligned or shifted by at least the forecast horizon.`,
    ],
    analogy: r`Driving a car forward while glancing at the rear-view mirror to observe how fast traffic behind you is moving, rather than attempting to look through a crystal ball.`,
    steps: [
      r`Establish regular time index: verify uniform sampling frequency (hourly, daily) and resolve missing temporal timestamps via forward-filling or interpolation.`,
      r`Generate lag features: shift the target series backward by $k$ discrete steps ($y_{t-1}, y_{t-7}, y_{t-365}$) corresponding to domain seasonality cycles.`,
      r`Compute rolling window aggregates: slide fixed-length historical frames ($W \in \{7, 14, 30\}$) to compute rolling means, standard deviations, and quantiles.`,
      r`Enforce strict causal alignment: shift rolling calculations by at least the forecast horizon ($h \ge 1$) to eliminate lookahead leakage.`,
      r`Calculate momentum and divergence ratios: compute relative velocity features such as $(y_{t-1} - \text{mean}_{7}) / \text{std}_{7}$ to measure deviation from recent baseline trends.`,
    ],
    math: [
      {
        h: 'Discrete lag operator and difference transformations',
        tex: r`$$L^k y_t = y_{t-k}, \qquad \Delta^k y_t = (1 - L)^k y_t = y_t - y_{t-k}$$`,
        p: r`Here $L$ is the backshift lag operator. The term $y_{t-k}$ captures the historical value $k$ steps prior. First-order differences $\Delta y_t = y_t - y_{t-1}$ remove linear trends, while seasonal differences $y_t - y_{t-s}$ remove recurring periodicities (such as $s = 7$ for weekly patterns).`,
      },
      {
        h: 'Causal rolling window mean and variance',
        tex: r`$$\mu_{t, W} = \frac{1}{W} \sum_{i=1}^W y_{t-i}, \qquad \sigma_{t, W}^2 = \frac{1}{W - 1} \sum_{i=1}^W \big(y_{t-i} - \mu_{t, W}\big)^2$$`,
        p: r`Historical window $W$ is summed strictly over historical indices $i \in \{1, \dots, W\}$. The upper index is $t-1$, which strictly excludes the concurrent observation $y_t$ to prevent target leakage when training models to predict $y_t$.`,
      },
      {
        h: 'Exponentially Weighted Moving Average (EWMA)',
        tex: r`$$\hat{y}_t^{(\alpha)} = \alpha y_{t-1} + (1 - \alpha) \hat{y}_{t-1}^{(\alpha)} = \alpha \sum_{i=1}^\infty (1 - \alpha)^{i-1} y_{t-i}$$`,
        p: r`The smoothing parameter $\alpha \in (0, 1]$ dictates the geometric decay rate. Recent observations receive exponentially decaying weights $(1 - \alpha)^{i-1}$, adapting rapidly to structural trend shifts without requiring a sharp rectangular cut-off window.`,
      },
    ],
    keyPoints: [
      r`Tabularizing sequential data: lag and window features allow non-recurrent algorithms (like LightGBM) to capture temporal dependencies with exceptional speed.`,
      r`Strict causal lagging: rolling statistics must exclude the current time step $t$ when predicting $y_t$, strictly bounding historical inputs to $\{t-1, t-2, \dots\}$.`,
      r`Domain seasonal lags: alignment with natural cycles (e.g. 24 hours, 7 days, 52 weeks) captures periodic autocorrelation structures.`,
    ],
    pitfalls: [
      r`Centred window lookahead leakage: using default centred rolling windows incorporates future time points $t+1, \dots, t+k$, invalidating the model for live deployment.`,
      r`Multi-step forecast horizon mismatch: when forecasting $h$ steps ahead (e.g. predicting day $t+7$), lag features like $y_{t-1}$ are unobserved at prediction time, demanding recursive or direct forecasting strategies.`,
      r`Inadvertent training set NaN leakage: shifting by $k$ produces $k$ leading NaNs; dropping NaNs carelessly can truncate early training cohorts or cause row misalignment across multi-entity panels.`,
    ],
    code: r`import numpy as np

np.random.seed(42)
series = 10.0 + np.sin(np.linspace(0, 10, 50)) + np.random.normal(0, 0.5, 50)
T = len(series)

# Lags: t-1 and t-3
lag1 = series[2:-1]
lag3 = series[0:-3]
# Causal rolling mean (window=3)
rolling_mean = np.array([np.mean(series[i-3:i]) for i in range(3, T)])
y_target = series[3:]

print(f"Constructed supervised samples: {len(y_target)}")
print(f"Sample 0 -> Target: {y_target[0]:.2f}, Lag-1: {series[2]:.2f}, 3-step Rolling Mean: {rolling_mean[0]:.2f}")`,
    quiz: [
      {
        q: r`Why is calculating a rolling mean using a centred window (e.g. including $t-2$ through $t+2$) considered fatal when building time-series features?`,
        o: [
          r`It introduces lookahead leakage by using future values ($t+1, t+2$) that are unobserved at inference time, rendering the model useless in production`,
          r`It causes the rolling standard deviation to become negative`,
          r`It converts daily time series into monthly data`,
          r`It forces the model to use linear regression`,
        ],
        a: 0,
        why: r`At test time, the model must forecast $y_t$ using only data available prior to $t$. A centred window incorporates future values that cannot exist at prediction time, producing deceptively high backtest scores that collapse in production.`,
      },
      {
        q: r`When building a multi-step forecasting model to predict sales 7 days into the future ($y_{t+7}$), which of the following lag features is valid without recursive chaining?`,
        o: [
          r`$y_t$ or earlier lags like $y_{t-1}, y_{t-7}$`,
          r`$y_{t+6}$`,
          r`$y_{t+1}$`,
          r`A centred 3-day average around $y_{t+7}$`,
        ],
        a: 0,
        why: r`When forecasting 7 steps ahead from origin $t$, only observations at or before time $t$ ($y_t, y_{t-1}, \dots$) are known. Features like $y_{t+1}$ or $y_{t+6}$ are in the future and cannot be observed directly without multi-step recursive forecasting.`,
      },
      {
        q: r`What structural role do lag differences ($\Delta y_t = y_t - y_{t-1}$) serve in time-series feature engineering?`,
        o: [
          r`They transform non-stationary trending series into stationary mean-reverting increments, highlighting short-term acceleration and momentum`,
          r`They eliminate all missing values automatically`,
          r`They ensure all target values are integers`,
          r`They double the number of rows in the dataset`,
        ],
        a: 0,
        why: r`Differencing removes secular non-stationary trends ($y_t - y_{t-1}$), capturing whether the process is accelerating or decelerating relative to its recent level.`,
      },
    ],
    usedBy: [],
    prereq: ['stationarity-acf-and-pacf', 'scaling-and-transforms-standard-robust-box-cox-yeo-johnson'],
    related: ['stationarity-acf-and-pacf', 'exponential-smoothing-ets', 'gradient_boosting_regressor'],
    keywords: 'lag features rolling window features time series feature engineering ewma lookahead leakage supervised forecasting autocorrelation',
  },
  {
  "id": "binning-and-discretisation",
  "short": "Binning & discretisation",
  "title": "Binning and Discretisation: Transforming Continuous Predictors",
  "task": "concepts",
  "level": 2,
  "minutes": 14,
  "noLab": true,
  "summary": "Converting continuous variables into discrete intervals using uniform, quantile, k-means, and supervised decision tree binning strategies.",
  "lead": "Continuous features often exhibit non-linear relationships, extreme outliers, or multimodal distributions that linear and generalised additive models struggle to capture directly. Discretisation maps continuous scales into discrete ordinal or categorical bins, introducing non-linear step responses, dampening outlier sensitivity, and producing interpretable scorecards.",
  "analogy": "Consider categorising human ages for life insurance. Rather than forcing a single rigid linear relationship across all ages from 0 to 100, insurers split ages into distinct brackets: 18–25, 26–40, 41–60, and 60+. Within each bucket, risk is relatively uniform, and the risk premium can step up discretely without requiring complex high-degree polynomial curves.",
  "intuition": [
    "Discretisation partitions the domain of a continuous variable $X$ into $K$ intervals $[b_{k-1}, b_k)$, assigning each observation a discrete bin index or one-hot indicator. This effectively replaces a single continuous parameter with $K$ piecewise constant basis functions.",
    "Unsupervised discretisation relies solely on feature distributions. Equal-width (uniform) binning divides the range into intervals of identical length, but is vulnerable to outliers compressing the vast majority of data into one bin. Equal-frequency (quantile) binning places an identical number of samples in every bin, making it robust against heavy tails and skewness.",
    "Clustering-based binning (e.g. 1D k-means) clusters values into natural density modes, setting cut points midway between cluster centroids.",
    "Supervised discretisation uses the target variable $y$ to determine optimal cutoffs. A single-variable decision tree finds split thresholds that maximise mutual information or minimise impurity with respect to $y$, directly isolating regions of differing risk or class probability."
  ],
  "steps": [
    "Assess variable distribution: Inspect histograms, skewness, and kurtosis to determine whether the feature is uniform, bell-shaped, or heavily tailed.",
    "Select binning strategy: Choose equal-frequency for skewed distributions, equal-width for uniformly bounded metrics, or decision tree binning for non-linear target associations.",
    "Compute cut points on training data only: Fit bin edges $\\{b_0, b_1, \\dots, b_K\\}$ strictly on the training partition to avoid data leakage.",
    "Handle boundary conditions: Ensure the outer edges extend to $(-\\infty, \\infty)$ so unseen minimum or maximum values in production do not produce missing values.",
    "Encode discrete intervals: Encode bins as ordinal integers (for tree models) or one-hot dummy variables (for linear models and credit scorecards)."
  ],
  "math": [
    {
      "h": "Equal-Width (Uniform) Interval Partitioning",
      "tex": "w = \\frac{\\max(X) - \\min(X)}{K}, \\quad b_k = \\min(X) + k \\cdot w, \\quad k \\in \\{0, 1, \\dots, K\\}",
      "p": "Equal-width binning divides the total observed range into $K$ intervals of fixed length $w$."
    },
    {
      "h": "Equal-Frequency (Quantile) Partitioning",
      "tex": "b_k = Q_X\\left(\\frac{k}{K}\\right), \\quad P(X \\in [b_{k-1}, b_k)) = \\frac{1}{K}",
      "p": "Quantile binning places bin edges at percentiles such that each of the $K$ bins contains exactly $1/K$ of the empirical probability mass."
    },
    {
      "h": "Piecewise Constant Basis Expansion",
      "tex": "f(X) = \\sum_{k=1}^K w_k \\cdot \\mathbb{I}(X \\in [b_{k-1}, b_k))",
      "p": "Linear models fit a separate weight $w_k$ to each bin indicator $\\mathbb{I}$, learning arbitrary piecewise constant step functions without explicit polynomial features."
    }
  ],
  "code": "import numpy as np\nfrom sklearn.preprocessing import KBinsDiscretizer\n\n# Generate skewed continuous data (e.g. income or transaction amounts)\nnp.random.seed(42)\nincome = np.random.exponential(scale=35000, size=1000).reshape(-1, 1)\n\n# Fit quantile-based discretisation (5 bins with equal sample frequency)\nquantile_bin = KBinsDiscretizer(n_bins=5, encode='ordinal', strategy='quantile')\nbinned_q = quantile_bin.fit_transform(income)\n\n# Fit uniform (equal-width) discretisation\nuniform_bin = KBinsDiscretizer(n_bins=5, encode='ordinal', strategy='uniform')\nbinned_u = uniform_bin.fit_transform(income)\n\nprint(\"Quantile cut points:\\n\", np.round(quantile_bin.bin_edges_[0], 1))\nprint(\"Quantile bin counts:\\n\", np.bincount(binned_q.flatten().astype(int)))\nprint(\"Uniform bin counts (heavily imbalanced):\\n\", np.bincount(binned_u.flatten().astype(int)))\n# Notice quantile creates balanced ~200 items/bin, while uniform starves upper bins",
  "keyPoints": [
    "Discretisation converts continuous variables into discrete bins, enabling linear models to learn non-linear step responses.",
    "Quantile (equal-frequency) binning handles heavy-tailed skewed distributions without collapsing all samples into one bin.",
    "Cut points must always be calculated strictly on the training set and applied unchanged to validation and test sets.",
    "Supervised binning using decision tree splits finds thresholds that directly optimise class separation."
  ],
  "pitfalls": [
    "Information loss: Discretisation discards fine-grained intra-bin variance, treating all values within an interval as completely identical.",
    "Arbitrary boundary artifacts: Two data points on opposite sides of a cut boundary (e.g. 49.9 and 50.1) receive different representations, while 50.1 and 69.9 receive the same.",
    "Calculating quantile thresholds on the combined dataset before train/test splitting, causing target leakage."
  ],
  "quiz": [
    {
      "q": "What is the primary vulnerability of equal-width (uniform) binning when applied to skewed distributions?",
      "o": [
        "It requires computationally expensive iterative matrix inversion",
        "Outliers stretch the range, crowding the vast majority of observations into a single bin",
        "It cannot be encoded into one-hot binary columns",
        "It violates the Gauss-Markov theorem for linear regression"
      ],
      "a": 1,
      "why": "In a skewed distribution with extreme outliers, the span $(\\max - \\min)$ is dominated by rare values, leaving nearly all normal observations compressed into the first interval."
    },
    {
      "q": "Why does quantile binning generally outperform equal-width binning for financial variables like wealth or income?",
      "o": [
        "It guarantees an equal number of samples in every bin, making it robust against extreme long tails",
        "It transforms categorical strings into continuous floating point numbers",
        "It eliminates the need for cross-validation",
        "It enforces normal Gaussianity on the output labels"
      ],
      "a": 0,
      "why": "Quantile binning places cutoffs at empirical percentiles, ensuring balanced sample support across all bins regardless of distribution skewness."
    },
    {
      "q": "What must an engineer ensure when deploying a fitted discretiser to production inference?",
      "o": [
        "Bin edges must be recomputed on each incoming production batch",
        "The first and last intervals must cover $(-\\infty, \\infty)$ to handle extreme values without generating NaNs",
        "Every bin must contain an odd number of samples",
        "The target variable must be passed alongside the test features"
      ],
      "a": 1,
      "why": "Production features may exhibit values lower than the training minimum or higher than the maximum. Infinite bounds prevent out-of-range errors."
    }
  ],
  "related": [
    "encoding-categoricals-one-hot-ordinal-target-woe",
    "scaling-and-transforms-standard-robust-box-cox-yeo-johnson",
    "outlier-handling"
  ],
  "keywords": "binning, discretisation, kbinsdiscretizer, equal width, equal frequency, quantile binning, step function, feature engineering",
  "usedBy": []
},
  {
  "id": "interactions-and-polynomial-features",
  "short": "Interactions & polynomials",
  "title": "Interactions and Polynomial Features: Capturing Non-Linear Synergies",
  "task": "concepts",
  "level": 2,
  "minutes": 15,
  "noLab": true,
  "summary": "Constructing multiplicative feature interactions and polynomial expansions to model non-linear synergies while managing combinatorial feature explosion.",
  "lead": "Linear models inherently assume that the effect of one feature on the target is entirely independent of all other features. In real-world phenomena, however, effects are deeply interactive: the impact of advertising depends on household income, and drug efficacy depends on patient body mass. Constructing interaction terms and polynomial features enables linear algorithms to capture multiplicative synergies and curved response surfaces.",
  "analogy": "Imagine baking bread. Flour and yeast each contribute weight, but their true effect on loaf height occurs through their interactive combination: yeast without flour yields zero bread, and flour without yeast yields flatbread. A model that only adds individual flour weight plus yeast weight misses the multiplicative reaction entirely.",
  "intuition": [
    "In a standard linear regression $\\hat{y} = w_1 x_1 + w_2 x_2 + b$, the marginal derivative $\\frac{\\partial \\hat{y}}{\\partial x_1} = w_1$ is constant. It never changes regardless of whether $x_2$ is tiny or massive.",
    "Adding an interaction term $x_1 x_2$ yields $\\hat{y} = w_1 x_1 + w_2 x_2 + w_{12} (x_1 x_2) + b$. Now the marginal effect $\\frac{\\partial \\hat{y}}{\\partial x_1} = w_1 + w_{12} x_2$ depends directly on the level of $x_2$, unlocking synergy or antagonism modelling.",
    "Polynomial features expand individual inputs to higher powers ($x_1^2, x_1^3$), allowing linear models to fit quadratic parabolas, cubic curves, and multi-dimensional saddle surfaces.",
    "The primary danger of polynomial and interaction expansion is combinatorial explosion. Expanding $d$ features to degree $p$ generates $\\binom{d+p}{p}$ terms. For 100 features at degree 2, this produces 5,151 columns, leading to extreme multicollinearity, memory bloat, and severe overfitting unless paired with L1 regularisation (Lasso) or domain-guided selection."
  ],
  "steps": [
    "Domain hypothesis generation: Identify intuitive pairwise synergies based on physical or business logic (e.g. $\\text{speed} \\times \\text{time} = \\text{distance}$, $\\text{price} \\times \\text{quantity} = \\text{revenue}$) before blind generation.",
    "Feature standardisation: Standardise raw continuous variables before creating polynomial terms to prevent high-degree powers from exploding to huge numerical scales.",
    "Polynomial expansion: Generate cross-products and powers up to degree 2 or 3 using matrix operations or `PolynomialFeatures`.",
    "Filter collinear columns: Check correlation matrices and variance inflation factors (VIF) to detect near-duplicate collinear interaction terms.",
    "Regularised model fitting: Train linear models with L1/L2 regularisation (e.g. ElasticNet) to drive irrelevant cross-products to zero."
  ],
  "math": [
    {
      "h": "Two-Way Multiplicative Interaction Model",
      "tex": "\\hat{y} = w_0 + w_1 x_1 + w_2 x_2 + w_{12} (x_1 x_2)",
      "p": "The interaction coefficient $w_{12}$ represents the change in the slope of $x_1$ per unit increase in $x_2$."
    },
    {
      "h": "Combinatorial Dimensionality Expansion",
      "tex": "D_{\\mathrm{expanded}} = \\binom{d + p}{p} = \\frac{(d + p)!}{d! \\, p!}",
      "p": "Expanding a $d$-dimensional feature vector up to polynomial degree $p$ scales factorially, necessitating strict feature pruning."
    },
    {
      "h": "Marginal Rate of Substitution / Sensitivity",
      "tex": "\\frac{\\partial \\hat{y}}{\\partial x_1} = w_1 + w_{12} x_2 + 2 w_{11} x_1",
      "p": "With both interaction and quadratic terms, the sensitivity of predictions to changes in $x_1$ is a function of both $x_1$ and $x_2$."
    }
  ],
  "code": "import numpy as np\nfrom sklearn.preprocessing import PolynomialFeatures, StandardScaler\nfrom sklearn.linear_model import LassoCV\n\n# Generate synthetic non-linear interaction data: y = 2*x1 - 3*x2 + 4*(x1*x2) + noise\nnp.random.seed(42)\nX_raw = np.random.uniform(-2, 2, size=(200, 3))  # 3 features: x0, x1, x2\ny = 2.0 * X_raw[:, 0] - 3.0 * X_raw[:, 1] + 4.0 * (X_raw[:, 0] * X_raw[:, 1]) + np.random.normal(0, 0.5, 200)\n\n# Standardise before polynomial expansion\nscaler = StandardScaler()\nX_norm = scaler.fit_transform(X_raw)\n\n# Generate degree-2 interaction features (including bias and squares)\npoly = PolynomialFeatures(degree=2, include_bias=False)\nX_poly = poly.fit_transform(X_norm)\nfeature_names = poly.get_feature_names_out(['x0', 'x1', 'x2'])\n\n# Fit Lasso to automatically select the true interaction terms\nlasso = LassoCV(cv=5).fit(X_poly, y)\n\nprint(\"Expanded feature count:\", X_poly.shape[1])\nselected = [(name, round(coef, 2)) for name, coef in zip(feature_names, lasso.coef_) if abs(coef) > 0.1]\nprint(\"Lasso selected non-zero features:\", selected)\n# Output reveals strong weights on x0, x1, and the cross-product x0*x1",
  "keyPoints": [
    "Interaction terms allow the marginal effect of one predictor to depend on the magnitude of another.",
    "Polynomial features enable linear algorithms to fit smooth non-linear curves and saddle points.",
    "Combinatorial expansion generates thousands of features rapidly, creating multicollinearity and overfitting risks.",
    "Regularisation methods (Lasso, ElasticNet) are critical to prune redundant interaction terms."
  ],
  "pitfalls": [
    "Expanding unscaled features: Raising variables with large raw scales (e.g. salaries of 100,000) to powers causes extreme floating point overflow and gradient instability.",
    "Failing to keep main effects: Removing linear terms ($x_1, x_2$) while retaining their interaction ($x_1 x_2$) creates models whose interpretation changes drastically under simple coordinate shifts.",
    "Overfitting on small samples: Degree-3 or degree-4 expansions on modest datasets fit random noise patterns perfectly, collapsing test set generalisation."
  ],
  "quiz": [
    {
      "q": "What is the mathematical meaning of the coefficient $w_{12}$ on the interaction term $x_1 x_2$?",
      "o": [
        "The baseline prediction when all features are zero",
        "The rate at which the slope of $x_1$ with respect to $y$ changes as $x_2$ varies",
        "The correlation coefficient between $x_1$ and $x_2$",
        "The shrinkage factor applied to regularise the model"
      ],
      "a": 1,
      "why": "Differentiating $\\hat{y}$ with respect to $x_1$ yields $w_1 + w_{12} x_2$. Thus $w_{12}$ indicates how the impact of $x_1$ shifts per unit change in $x_2$."
    },
    {
      "q": "What severe issue arises when blindly generating degree-2 polynomial features on a dataset with 500 columns?",
      "o": [
        "The feature count balloons to over 125,000 columns, causing memory exhaustion and extreme overfitting",
        "Linear models can no longer compute convex loss gradients",
        "All correlation coefficients become exactly zero",
        "Decision tree algorithms will fail to split on the data"
      ],
      "a": 0,
      "why": "Formula $\\binom{500+2}{2} = 125{,}751$ terms (including the constant term). Such explosive dimensionality overwhelms memory and requires aggressive regularisation or domain pruning."
    },
    {
      "q": "Why should continuous variables be standardised prior to computing polynomial expansions?",
      "o": [
        "To ensure all target labels are strictly positive",
        "To prevent high powers from producing astronomical numerical scales and numerical overflow",
        "To convert categorical strings into integers",
        "To force all interaction coefficients to equal 1.0"
      ],
      "a": 1,
      "why": "Variables with large magnitudes ($10^4$) when squared become $10^8$, creating vast disparities in feature magnitudes that destabilise optimisation algorithms."
    }
  ],
  "related": [
    "scaling-and-transforms-standard-robust-box-cox-yeo-johnson",
    "binning-and-discretisation",
    "scikit-learn-pipelines-and-columntransformer"
  ],
  "keywords": "interactions, polynomial features, multiplicative synergy, cross-products, polynomial expansion, combinatorial explosion, feature engineering",
  "usedBy": []
},
  {
  "id": "date-and-text-features",
  "short": "Date & text features",
  "title": "Date and Text Features: Engineering Tabular Signals from Unstructured Inputs",
  "task": "concepts",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Extracting high-value cyclical calendar signals and bag-of-words or embedding representations for tabular machine learning models.",
  "lead": "Tabular machine learning models cannot directly process raw timestamps or free-form text strings. Converting calendar timestamps into cyclical trigonometric components and holiday indicators, while extracting term statistics, TF-IDF weights, or dense pretrained embeddings from text fields, unlocks high-signal tabular predictors without full deep language model infrastructure.",
  "analogy": "Imagine a shopkeeper tracking sales notes. A timestamp like \"2026-12-25 09:30\" means little to an arithmetic equation until separated into \"Christmas Day\", \"Friday\", \"Morning rush\", and \"Month 12\". Similarly, a customer review saying \"the battery melted immediately\" is useless as a string, but highly predictive once flagged with high-severity sentiment terms and n-gram keyword counts.",
  "intuition": [
    "Raw dates contain rich multi-scale periodicity: intraday hour (24-hour cycle), day of week (7-day cycle), day of month (payday effects), month of year (seasonal cycle), and boolean holiday flags.",
    "Treating cyclical calendar variables as simple integers (e.g. mapping hours to $0, 1, \\dots, 23$) introduces a severe false discontinuity: hour 23 and hour 0 appear 23 units apart despite being consecutive 60-minute neighbours. Sine and cosine trigonometric encodings $\\sin(2\\pi t / T)$ and $\\cos(2\\pi t / T)$ map time onto a smooth continuous 2D circle where 23:59 wraps seamlessly into 00:00.",
    "Text fields in tabular datasets (product descriptions, customer support tickets, error logs) range from short categorical phrases to long paragraphs. Lightweight tabular text engineering uses token length, uppercase character ratios, punctuation counts, and n-gram TF-IDF representations.",
    "Alternatively, passing short text through a small pretrained sentence transformer generates dense 384-dimensional embeddings, which can be compressed via TruncatedSVD or PCA into 8–16 dense numerical columns for gradient boosted decision trees."
  ],
  "steps": [
    "Calendar component decomposition: Extract year, month, day, day of week, day of year, hour, and is_weekend booleans from canonical UTC timestamps.",
    "Trigonometric cyclical encoding: Transform periodic variables (hour, day of week, month) into paired sine and cosine coordinates to preserve circle topology.",
    "Calendar event enrichment: Join country-specific public holiday calendars, commercial sales events (e.g. Black Friday), and financial reporting period closes.",
    "Text surface feature extraction: Compute character lengths, word counts, uppercase letter ratios, exclamation frequencies, and language identification.",
    "Dense text representation: Compute TF-IDF matrices (with n-gram range (1, 2) and minimum document frequency threshold) or SVD-reduced sentence embeddings, concatenating them with tabular feature arrays."
  ],
  "math": [
    {
      "h": "Cyclical Periodic Coordinate Projection",
      "tex": "x_{\\sin} = \\sin\\left(\\frac{2\\pi t}{T}\\right), \\quad x_{\\cos} = \\cos\\left(\\frac{2\\pi t}{T}\\right)",
      "p": "Projects periodic index $t \\in [0, T)$ onto the 2D unit circle, ensuring Euclidean distance between boundary values $t=0$ and $t=T-1$ reflects true temporal proximity."
    },
    {
      "h": "Circular Euclidean Distance Invariance",
      "tex": "\\|(\\sin\\theta_1 - \\sin\\theta_2)^2 + (\\cos\\theta_1 - \\cos\\theta_2)^2\\| = 2 - 2\\cos(\\theta_1 - \\theta_2) = 4\\sin^2\\left(\\frac{\\theta_1 - \\theta_2}{2}\\right)",
      "p": "The Euclidean distance between two points in projected sinusoidal space is a monotonic function of the angular difference along the cycle."
    },
    {
      "h": "Term Frequency-Inverse Document Frequency (TF-IDF)",
      "tex": "\\mathrm{tfidf}(t, d, D) = \\mathrm{tf}(t, d) \\times \\ln\\left(\\frac{1 + |D|}{1 + |\\{d \\in D : t \\in d\\}|}\\right) + 1",
      "p": "Measures the informational specificity of token $t$ in document $d$ relative to the entire tabular corpus $D$."
    }
  ],
  "code": "import numpy as np\nimport pandas as pd\nfrom sklearn.feature_extraction.text import TfidfVectorizer\nfrom sklearn.decomposition import TruncatedSVD\n\n# Sample tabular data with timestamps and customer support notes\ndf = pd.DataFrame({\n    'timestamp': pd.to_datetime([\n        '2026-01-01 23:45:00',\n        '2026-01-02 00:15:00',\n        '2026-07-15 14:30:00'\n    ]),\n    'ticket_text': [\n        'Payment gateway returned fatal timeout error',\n        'Unable to complete purchase during checkout timeout',\n        'How do I update my profile mailing address'\n    ]\n})\n\n# 1. Cyclical hour encoding\nhours = df['timestamp'].dt.hour + df['timestamp'].dt.minute / 60.0\ndf['hour_sin'] = np.sin(2 * np.pi * hours / 24.0)\ndf['hour_cos'] = np.cos(2 * np.pi * hours / 24.0)\n\n# 2. Text feature extraction: character count and TF-IDF\ndf['text_len'] = df['ticket_text'].str.len()\ntfidf = TfidfVectorizer(max_features=10, stop_words='english')\ntfidf_matrix = tfidf.fit_transform(df['ticket_text'])\n\n# Reduce text dimensionality for tabular inclusion\nsvd = TruncatedSVD(n_components=2, random_state=42)\ntext_dense = svd.fit_transform(tfidf_matrix)\ndf['text_svd_1'] = text_dense[:, 0]\ndf['text_svd_2'] = text_dense[:, 1]\n\nprint(df[['hour_sin', 'hour_cos', 'text_len', 'text_svd_1']])\n# Observe hour 23:45 and 00:15 have nearly identical trigonometric coordinates",
  "keyPoints": [
    "Trigonometric sine/cosine encodings eliminate artificial boundary gaps between consecutive cyclical times (e.g. 23:59 and 00:00).",
    "Decomposing dates into hierarchical calendar units (day of week, holiday flag, quarter) reveals seasonality to tree algorithms.",
    "Text fields can be efficiently represented using word counts, TF-IDF weights, or SVD-reduced sentence embeddings.",
    "Always fit text vectorisers and normalisers exclusively on training data to prevent out-of-fold vocabulary leakage."
  ],
  "pitfalls": [
    "Using only sine without cosine: Sine alone creates an ambiguous mapping where two distinct times of day (e.g. 06:00 and 18:00) share the exact same value.",
    "High-dimensional sparse text vectors in tree models: Passing raw 50,000-column TF-IDF matrices to LightGBM or XGBoost causes memory thrashing; reduce via SVD first.",
    "Ignoring local time when calculating \"hour of day\": UTC 02:00 corresponds to mid-morning in Tokyo but late evening in London."
  ],
  "quiz": [
    {
      "q": "Why is it necessary to include both sine and cosine terms when cyclically encoding hours of the day?",
      "o": [
        "Because linear regression requires even numbers of input variables",
        "A single trigonometric wave produces identical values for two distinct times within each 24-hour cycle",
        "Cosine removes the effect of leap years",
        "Decision trees cannot split on negative floating point numbers"
      ],
      "a": 1,
      "why": "The sine function is non-monotonic on $[0, 2\\pi)$, producing identical values for distinct hours (e.g. $\\sin(\\pi/4) = \\sin(3\\pi/4)$). Paired sine and cosine coordinates uniquely identify every point on the circle."
    },
    {
      "q": "What is the most effective way to include free-text descriptions into a gradient boosted tree model alongside tabular columns?",
      "o": [
        "Convert the entire text into a single integer hash",
        "Extract length/token metadata and reduce TF-IDF or embedding vectors to a small number of dense components via SVD",
        "Train an end-to-end 70-billion parameter LLM for every single tabular row",
        "Delete the text column because decision trees only support binary indicators"
      ],
      "a": 1,
      "why": "Gradient boosted trees handle a moderate number of continuous dense signals well. Compressing text representations with SVD or sentence embeddings preserves semantic variance without overwhelming tree splits."
    },
    {
      "q": "What issue arises when integer encoding the month of the year (1 to 12) in distance-based algorithms like k-NN?",
      "o": [
        "December (12) and January (1) appear maximally distant (distance 11) despite being consecutive months",
        "The algorithm will fail to converge to a global minimum",
        "The target distribution becomes multimodal",
        "Matrix inversion yields an ill-conditioned determinant"
      ],
      "a": 0,
      "why": "In linear integer encoding, 12 and 1 have an artificial distance of 11, obscuring winter seasonality across year boundaries."
    }
  ],
  "related": [
    "dates-time-zones-and-temporal-joins",
    "bag-of-words-and-tf-idf",
    "encoding-categoricals-one-hot-ordinal-target-woe"
  ],
  "keywords": "date features, text features, cyclical encoding, sine cosine encoding, tf-idf, truncated svd, calendar features, tabular feature engineering",
  "usedBy": []
},
  {
  "id": "feature-hashing-and-high-cardinality-columns",
  "short": "Feature hashing & cardinality",
  "title": "Feature Hashing and High-Cardinality Columns: The Hashing Trick",
  "task": "concepts",
  "level": 2,
  "minutes": 15,
  "noLab": true,
  "summary": "Handling massive categorical feature spaces with the hashing trick (MurmurHash) to bound memory, handle unseen categories, and avoid dictionary lookups.",
  "lead": "When categorical variables contain hundreds of thousands or millions of unique levels (such as user IDs, IP addresses, URL tokens, or search queries), standard one-hot encoding creates enormous, unmanageable sparse matrices that exhaust memory and break distributed pipelines. The hashing trick maps arbitrary string tokens into a fixed-size vector space using fast deterministic hash functions, bounding memory usage and effortlessly absorbing previously unseen levels.",
  "analogy": "Imagine a coat check room in a massive convention centre with 500,000 attendees. Building a dedicated numbered hook for every single potential person would require a vast warehouse. Instead, the cloakroom uses 4,096 pigeonholes numbered $0$ to $4095$. When you arrive, your name is converted into a pigeonhole number via a fixed mathematical formula. Occasionally two people share a pigeonhole, but coats take up vastly less physical room, and anyone arriving with an unexpected ticket can be accommodated immediately.",
  "intuition": [
    "Standard categorical encodings (one-hot, frequency, target encoding) require maintaining a global vocabulary mapping each token to an integer index. In streaming environments and massive datasets, maintaining this vocabulary causes memory growth, synchronisation bottlenecks across worker nodes, and failure on unseen out-of-vocabulary (OOV) tokens.",
    "The hashing trick (Weinberger et al., 2009) replaces the dictionary lookup with a deterministic hash function $h(x) \\pmod B$, which directly maps any arbitrary string token to an index in a fixed $B$-dimensional array.",
    "To prevent collision bias, a second independent sign hash function $\\xi(x) \\in \\{-1, +1\\}$ is applied. If two uncorrelated tokens happen to hash to the same bucket, their expected inner product remains zero because their signs cancel out in expectation.",
    "The trade-off is hash collision: multiple tokens mapped to the same index introduce slight variance into feature coefficients. By choosing bucket size $B$ sufficiently large relative to the number of active non-zero features per sample, collisions remain negligible while guaranteeing strict, constant memory bounds."
  ],
  "steps": [
    "Determine feature sparsity and budget: Choose bucket dimension $B = 2^b$ (typically $2^{18}$ to $2^{22}$ in production ad-tech) balancing memory constraints against collision probability.",
    "Select fast non-cryptographic hash: Use fast hash algorithms such as MurmurHash3 or xxHash for high-throughput string hashing.",
    "Compute bucket index and sign: For token $x$, compute index $j = |h(x)| \\pmod B$ and sign $\\xi(x) = 2 \\cdot (h_2(x) \\pmod 2) - 1$.",
    "Accumulate feature vector: Add $\\xi(x)$ (or $\\xi(x) \\times \\text{value}$) into index $j$ of the sparse sample vector.",
    "Fit online or linear model: Train models such as Vowpal Wabbit, SGDClassifier, or sparse linear networks directly on the hashed sparse arrays."
  ],
  "math": [
    {
      "h": "Hashing Trick Feature Mapping",
      "tex": "\\phi_j(x) = \\sum_{i : h(x_i) = j} \\xi(x_i) \\cdot v_i, \\quad j \\in \\{0, 1, \\dots, B-1\\}",
      "p": "Maps an arbitrary token $x_i$ with value $v_i$ into bucket $j$ using primary hash $h$ and signed hash $\\xi$."
    },
    {
      "h": "Unbiased Inner Product Preservation",
      "tex": "\\mathbb{E}[\\langle \\phi(u), \\phi(v) \\rangle] = \\langle u, v \\rangle, \\quad \\operatorname{Var}(\\langle \\phi(u), \\phi(v) \\rangle) = \\frac{1}{B} \\left( \\|u\\|^2 \\|v\\|^2 + \\langle u, v \\rangle^2 \\right)",
      "p": "Under independent sign hashing $\\xi$, the expected inner product is completely unbiased, with collision variance decaying inversely with bucket size $B$."
    },
    {
      "h": "Birthday Paradox Collision Expectation",
      "tex": "P(\\text{collision}) \\approx 1 - \\exp\\left( -\\frac{k(k - 1)}{2B} \\right)",
      "p": "Estimates the probability of at least one collision when hashing $k$ distinct active tokens into $B$ discrete buckets."
    }
  ],
  "code": "import numpy as np\nfrom sklearn.feature_extraction import FeatureHasher\n\n# High-cardinality categorical records (e.g. ad impressions with millions of user IDs and domains)\nrecords = [\n    {'user_id': 'usr_948271', 'domain': 'techcrunch.com', 'country': 'GB'},\n    {'user_id': 'usr_102938', 'domain': 'github.com', 'country': 'US'},\n    {'user_id': 'usr_948271', 'domain': 'reddit.com', 'country': 'GB'},\n    {'user_id': 'usr_unseen_9999', 'domain': 'bbc.co.uk', 'country': 'GB'}  # Unseen user at inference\n]\n\n# Set fixed hash space to 2^10 = 1024 buckets (strictly bounded memory)\nhasher = FeatureHasher(n_features=1024, input_type='dict')\nsparse_hashed = hasher.fit_transform(records)\n\nprint(\"Hashed sparse matrix shape:\", sparse_hashed.shape)\nprint(\"Non-zero entries in first row:\", sparse_hashed[0].nnz)\nprint(\"Memory bound: Exactly 1024 columns regardless of how many millions of new users arrive!\")\n# Handles unseen user 'usr_unseen_9999' instantly without re-fitting or vocabulary lookup",
  "keyPoints": [
    "The hashing trick maps unbounded categorical strings to a fixed $B$-dimensional space using fast hash functions.",
    "Eliminates vocabulary storage and inter-worker dictionary synchronisation in distributed clusters.",
    "Handles out-of-vocabulary tokens seamlessly at inference time without re-indexing.",
    "Signed hashing ensures the expected inner product between samples is mathematically unbiased."
  ],
  "pitfalls": [
    "Irreversible representation: Once hashed, feature names cannot be recovered from bucket indices, making coefficient interpretation difficult.",
    "Bucket undersizing: If $B$ is set too small relative to the number of distinct categories, excessive collisions corrupt signal and degrade accuracy.",
    "Hashing noise features: Hashing pure random identifiers that possess zero predictive power still consumes bucket capacity and increases collision noise."
  ],
  "quiz": [
    {
      "q": "What is the primary benefit of the hashing trick over standard one-hot encoding for massive categorical columns?",
      "o": [
        "It guarantees zero feature collisions under all circumstances",
        "It bounds memory usage to a constant size and requires no vocabulary dictionary lookup",
        "It forces gradient boosted trees to converge in a single iteration",
        "It automatically converts non-linear relationships into linear ones"
      ],
      "a": 1,
      "why": "Feature hashing allocates a fixed number of buckets, requiring zero vocabulary storage in memory and absorbing unseen tokens without schema updates."
    },
    {
      "q": "Why does the hashing trick employ a secondary sign hash function $\\xi(x) \\in \\{-1, +1\\}$?",
      "o": [
        "To ensure all output matrix entries are positive",
        "To make the expected inner product unbiased so random collisions cancel out in expectation",
        "To encrypt private customer identifiers against cyber attacks",
        "To accelerate matrix multiplication by avoiding floating point arithmetic"
      ],
      "a": 1,
      "why": "Independent sign hashing ensures $\\mathbb{E}[\\xi(u)\\xi(v)] = 0$ for distinct tokens $u \\ne v$, meaning collision interference averages to zero."
    },
    {
      "q": "What is a major operational downside of using feature hashing in production systems?",
      "o": [
        "It cannot process string inputs",
        "Loss of feature interpretability: you cannot trace a learned weight back to a specific category name",
        "It requires calculating the full Hessian matrix during inference",
        "It cannot be implemented in streaming Python pipelines"
      ],
      "a": 1,
      "why": "Hash functions are one-way projections. When a model assigns a large weight to bucket #4912, you cannot determine which original category produced it."
    }
  ],
  "related": [
    "encoding-categoricals-one-hot-ordinal-target-woe",
    "scikit-learn-pipelines-and-columntransformer",
    "bag-of-words-and-tf-idf"
  ],
  "keywords": "feature hashing, hashing trick, high-cardinality, featurehasher, murmurhash, collision, signed hashing, memory-bounded encoding",
  "usedBy": []
},
  {
    id: 'train-validation-test-splits-group-and-time-based',
    short: 'Splits: group and time-based',
    title: 'Train/Validation/Test Splits: Group and Time-Based',
    task: 'concepts',
    module: 'Pipelines and validation',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Partitioning data to mirror true production inference constraints, preventing optimistic bias caused by grouped customer records or temporal lookahead.`,
    lead: r`A naive random 80/20 split assumes observations are independent and identically distributed. In real-world data science, multiple rows often originate from the same patient, device, or customer, and data arrives chronologically over time. Group-aware and time-based splits enforce strict boundaries across clusters and time horizons, ensuring validation scores accurately reflect generalisation to unseen entities and future events.`,
    intuition: [
      r`Imagine building a diagnostic computer vision system to detect skin lesions. You collect 10,000 dermatoscopic images across 200 patients. If you shuffle the images uniformly into a standard 80/20 train/test split, photos from almost every patient appear in both the training set and the test set. The model can easily achieve 98% test accuracy simply by memorising patient-specific skin tones, hair patterns, lighting conditions, or hospital background tags. When you ship the model to a new clinic and test it on patient #201, performance collapses to 65% because the model learned patient identity rather than medical pathology. Group-based splitting prevents this by allocating all observations from any single patient exclusively to train or test.`,
      r`A parallel disaster unfolds in temporal forecasting. Suppose you predict daily supermarket sales. If you shuffle transactions randomly across a year, the training set will contain transactions from Monday, Wednesday, and Friday, while the validation set contains Tuesday and Thursday. The model predicts Tuesday's sales using information from Wednesday and Thursday—an impossible lookahead scenario in deployment. Time-based splitting enforces the chronological arrow of time: training on historical months (e.g. January through September) and validating strictly on subsequent months (e.g. October through December).`,
      r`The classic three-way partition separates concerns across the modelling lifecycle: the training set optimises internal model parameters; the validation set compares architectures, calibrates thresholds, and tunes hyperparameters; and the test set remains locked in an untouchable vault until final sign-off. Repeatedly consulting test metrics during model iteration leaks test information into human design decisions, turning the final evaluation into a disguised validation set.`,
    ],
    analogy: r`Testing a trainee doctor on new patients they have never examined before, rather than quizzing them on the exact same patients they observed during morning rounds.`,
    steps: [
      r`Audit structural dependencies: identify whether records cluster within entities (user ID, hospital, vehicle) or follow a continuous timeline.`,
      r`Select splitting architecture: use GroupKFold or GroupShuffleSplit for clustered entities, and TimeSeriesSplit or chronological holdout for sequential processes.`,
      r`Enforce temporal embargo gaps: when features use rolling lookback windows or labels take time to resolve, insert an embargo buffer between train and test.`,
      r`Isolate the final test vault: seal test data prior to exploratory analysis, feature extraction, and preprocessing fitment.`,
      r`Verify disjoint entity boundaries: programmatically assert that the intersection between training entity identifiers and validation entity identifiers is strictly empty.`,
    ],
    math: [
      {
        h: 'Disjoint group partition constraint',
        tex: r`\mathcal{G}_{\text{train}} \cap \mathcal{G}_{\text{val}} = \emptyset, \qquad \mathcal{G}_{\text{train}} \cup \mathcal{G}_{\text{val}} \subseteq \mathcal{G}`,
        p: r`Where $\mathcal{G}$ represents the universe of unique entity identifiers (such as user or device IDs), and $\mathcal{G}_{\text{train}}$ and $\mathcal{G}_{\text{val}}$ are the subsets allocated to training and validation. Enforcing zero intersection ensures that no entity-specific idiosyncrasies can leak across partition boundaries.`,
      },
      {
        h: 'Chronological split with purge and embargo gap',
        tex: r`\max_{i \in \mathcal{D}_{\text{train}}} t_i < t_{\text{split}} < t_{\text{split}} + \Delta t_{\text{embargo}} \le \min_{j \in \mathcal{D}_{\text{val}}} t_j`,
        p: r`Where $t_i$ is the event timestamp for record $i$, $t_{\text{split}}$ is the historical cutoff, and $\Delta t_{\text{embargo}}$ is an enforced purge window. Purging eliminates records whose rolling aggregations or future outcome resolutions span across the split boundary.`,
      },
      {
        h: 'Expected generalisation risk under cluster shift',
        tex: r`\mathcal{R}_{\text{group}}(\hat{f}) = \mathbb{E}_{G \sim \mathcal{P}_G} \left[ \mathbb{E}_{(X, Y) \sim \mathcal{P}_{XY|G}} [L(Y, \hat{f}(X))] \right]`,
        p: r`Validation evaluates expected loss across newly drawn groups $G \sim \mathcal{P}_G$ rather than repeated draws from known training groups. This provides an unbiased estimator of true out-of-distribution performance when deploying to fresh customers or environments.`,
      },
    ],
    keyPoints: [
      r`Random shuffling on clustered or longitudinal data creates severe optimistic bias by rewarding models that memorise entity identities.`,
      r`Chronological splits preserve the causal arrow of time, replicating true forward-looking production conditions.`,
      r`Purging and embargo gaps prevent subtle leakage caused by multi-day rolling features or forward-looking label windows near split cutoffs.`,
    ],
    pitfalls: [
      r`Randomly splitting panel datasets where multiple rows originate from the same user, machine, or household.`,
      r`Evaluating time series with standard k-fold cross-validation, allowing future information to train models predicting past events.`,
      r`Peeking at the final test set: adjusting hyperparameters or feature selections based on test feedback invalidates unbiased generalisation guarantees.`,
    ],
    code: r`import numpy as np

# 1. Simulate longitudinal data: 8 entities, 5 measurements each
np.random.seed(42)
n_groups, n_obs = 8, 5
group_ids = np.repeat(np.arange(n_groups), n_obs)
# Entity random intercepts induce strong intra-group correlation
group_effects = np.random.normal(0, 5.0, size=n_groups)
X = np.random.normal(0, 1.0, size=(n_groups * n_obs, 1))
y = 2.0 * X[:, 0] + group_effects[group_ids] + np.random.normal(0, 0.5, size=n_groups * n_obs)

# Standard random split: same groups appear in both train and test
perm = np.random.permutation(len(y))
train_idx_rand, test_idx_rand = perm[:24], perm[24:]
rand_overlap = len(set(group_ids[train_idx_rand]) & set(group_ids[test_idx_rand]))

# Group-aware split: groups are partitioned disjointly
unique_groups = np.unique(group_ids)
np.random.shuffle(unique_groups)
train_groups, test_groups = unique_groups[:5], unique_groups[5:]
train_idx_grp = np.isin(group_ids, train_groups)
test_idx_grp = np.isin(group_ids, test_groups)
grp_overlap = len(set(group_ids[train_idx_grp]) & set(group_ids[test_idx_grp]))

print(f"Random split shared entity overlap: {rand_overlap} groups")
print(f"Group split shared entity overlap:  {grp_overlap} groups")
print(f"Train groups: {[int(g) for g in train_groups]}, Test groups: {[int(g) for g in test_groups]}")`,
    quiz: [
      {
        q: r`Why does standard random k-fold cross-validation yield misleadingly optimistic accuracy when applied to multi-visit hospital patient records?`,
        o: [
          r`Because patient records can only be validated using leave-one-out cross-validation`,
          r`Because images and measurements from the same patient appear in both train and test folds, allowing models to memorise patient traits`,
          r`Because k-fold cross-validation forces all features to follow Gaussian distributions`,
          r`Because random splitting removes rows with missing values automatically`,
        ],
        a: 1,
        why: r`When multi-row records from the same patient are scattered randomly across folds, the model learns patient-specific quirks (skin tone, background artifacts) rather than generalisable disease patterns, producing false confidence.`,
      },
      {
        q: r`When splitting time-series data for a model forecasting demand 7 days ahead, why is an embargo or purge gap necessary at the split boundary?`,
        o: [
          r`To prevent rolling window features computed near the boundary from incorporating future post-split information`,
          r`To ensure the training dataset contains an even number of samples`,
          r`To artificially boost the variance of the validation predictions`,
          r`Because scikit-learn models crash if time steps are strictly contiguous`,
        ],
        a: 0,
        why: r`If features compute rolling multi-day averages or if target labels take several days to materialize, observations immediately preceding the split line may incorporate or overlap with target period data unless an embargo buffer is enforced.`,
      },
      {
        q: r`What is the primary role of the holdout test set compared to the validation set in a supervised learning project?`,
        o: [
          r`The test set is used to optimise gradient descent learning rates`,
          r`The test set is used for feature selection, while validation is used for training`,
          r`The test set provides an untouched, unbiased assessment of final generalisation after all model and tuning decisions are frozen`,
          r`The test set must be three times larger than the training set`,
        ],
        a: 2,
        why: r`Iterating on models, features, and hyperparameters against a validation set causes subtle validation overfitting. An untouched test set serves as the final arbiter of performance.`,
      },
    ],
    usedBy: [],
    prereq: ['cross-validation', 'bias-variance-tradeoff'],
    related: ['data-leakage', 'scikit-learn-pipelines-and-columntransformer', 'lag-and-rolling-window-features'],
    keywords: 'train test split group kfold time based split validation data leakage embargo purge temporal holdout',
  },
  {
    id: 'data-leakage',
    short: 'Data leakage',
    title: 'Data Leakage',
    task: 'concepts',
    module: 'Pipelines and validation',
    level: 2,
    minutes: 15,
    noLab: true,
    summary: r`Diagnosing and preventing the insidious contamination of training data with information available only at inference or in the future.`,
    lead: r`Data leakage occurs when information from outside the training partition—or information unavailable at the real-time moment of prediction—inadvertently contaminates model training. Leakage produces deceptively flawless cross-validation scores that abruptly collapse into catastrophic failures in production. Recognizing target leakage, feature leakage, and preprocessing leakage is essential for reliable machine learning.`,
    intuition: [
      r`Imagine training a machine learning model to predict whether a hospital patient will develop severe pneumonia. During feature engineering, you include a column called "Antibiotic IV Dosage Administered". In offline validation, the model achieves a miraculous 99.8% ROC-AUC. But in clinical practice, doctors only prescribe high-dose IV antibiotics after pneumonia has already been diagnosed! The model did not predict pneumonia; it merely detected the physician's reaction to pneumonia. This is classic target leakage—including a feature that is a downstream consequence of the target rather than a genuine antecedent predictor.`,
      r`A subtler, pervasive trap is preprocessing leakage. Suppose you standardise a dataset by subtracting the mean and dividing by the standard deviation. If you compute the mean and variance across the entire table before splitting into training and test sets, the training data has absorbed statistical parameters derived from the test set. If you perform feature selection or target encoding across the entire table, test labels directly influence the features selected for training, manufacturing artificial predictive power out of pure noise.`,
      r`The diagnostic hallmark of data leakage is performance that appears "too good to be true". Whenever a model achieves near-perfect metrics on a notoriously noisy or uncertain task, the cause is almost never an algorithmic breakthrough—it is almost always data leakage. Building strict isolation firewalls around the point of prediction ensures models rely solely on information that genuinely exists at decision time.`,
    ],
    analogy: r`Studying for a medical licensing exam with a stolen copy of the answer key: you score 100% on practice exams, but fail in the clinic when answers are no longer provided.`,
    steps: [
      r`Define the point of prediction: fix the exact real-world timestamp $T_{\text{pred}}$ when inference executes in production.`,
      r`Audit feature timelines: systematically eliminate any feature created, updated, or recorded after $T_{\text{pred}}$ (downstream consequence of the target).`,
      r`Fit all transformers inside cross-validation: enforce that scalers, imputers, and encoders call fit strictly on training folds and transform on validation folds.`,
      r`Isolate target encoding out-of-fold: ensure target-based categorical encodings exclude the current record's label to prevent self-referential leakage.`,
      r`Stress-test with temporal holdouts: validate models on a strictly future time block; a dramatic divergence between cross-validation and holdout exposes leakage.`,
    ],
    math: [
      {
        h: 'Mutual information target leakage condition',
        tex: r`I(X_{\text{leaked}}; Y \mid T_{\text{pred}}) \gg I(X_{\text{valid}}; Y \mid T_{\text{pred}})`,
        p: r`Where $X_{\text{leaked}}$ represents information generated chronologically after decision timestamp $T_{\text{pred}}$. Such features exhibit spurious high mutual information with target $Y$ during backtesting that disappears under true live inference.`,
      },
      {
        h: 'Global preprocessing parameter mismatch',
        tex: r`\hat{\mu}_{\text{leaked}} = \frac{1}{n_{\text{tr}} + n_{\text{val}}} \sum_{i \in \mathcal{D}_{\text{tr}} \cup \mathcal{D}_{\text{val}}} x_i \ne \hat{\mu}_{\text{train}} = \frac{1}{n_{\text{tr}}} \sum_{i \in \mathcal{D}_{\text{tr}}} x_i`,
        p: r`Estimating transformation parameters (such as mean $\hat{\mu}$ or variance $\hat{\sigma}^2$) across the pooled dataset introduces an out-of-fold bias of order $\mathcal{O}(n_{\text{val}} / n)$, breaking the statistical independence assumption between training and validation partitions.`,
      },
      {
        h: 'Out-of-fold target encoding formulation',
        tex: r`\hat{S}_{i, c} = \frac{\sum_{j \in \mathcal{D}_{\text{tr}} \setminus \{i\}, X_j = c} y_j + m \bar{y}_{\text{tr}}}{n_{c, \text{tr},-i} + m}`,
        p: r`Target encoding must be computed by explicitly excluding sample $i$ (or via out-of-fold cross-fitting), preventing observation $i$'s own target label $y_i$ from leaking directly into its feature representation.`,
      },
    ],
    keyPoints: [
      r`Target leakage introduces features that are downstream effects or proxies of the outcome rather than causes.`,
      r`Preprocessing leakage occurs whenever transformation parameters (means, medians, vocabularies) are learned on pooled train and test data.`,
      r`Feature selection leakage across the entire dataset can make pure noise appear 80%+ accurate in cross-validation.`,
    ],
    pitfalls: [
      r`Calling fit_transform on the full dataset before splitting into train, validation, and test partitions.`,
      r`Performing unsupervised or supervised feature selection on the entire dataset prior to cross-validation.`,
      r`Including database record update timestamps, transaction IDs, or account closure dates that are logged concurrently with the target event.`,
    ],
    code: r`import numpy as np

# Simulate feature selection leakage on pure noise (100 samples, 500 noise features)
np.random.seed(42)
n_samples, n_features = 100, 500
X = np.random.normal(0, 1, size=(n_samples, n_features))
y = np.random.binomial(1, 0.5, size=n_samples)  # independent random binary targets

# 1. LEAKED: Select top 5 correlated features using the FULL dataset before splitting
corrs = np.array([np.abs(np.corrcoef(X[:, j], y)[0, 1]) for j in range(n_features)])
top_leaked = np.argsort(corrs)[-5:]

# Nearest centroid classification on test set using leaked features
train_idx, test_idx = np.arange(70), np.arange(70, 100)
c1_leak = np.mean(X[train_idx][y[train_idx] == 1][:, top_leaked], axis=0)
c0_leak = np.mean(X[train_idx][y[train_idx] == 0][:, top_leaked], axis=0)
preds_leak = (np.linalg.norm(X[test_idx][:, top_leaked] - c1_leak, axis=1) <
              np.linalg.norm(X[test_idx][:, top_leaked] - c0_leak, axis=1)).astype(int)
acc_leak = np.mean(preds_leak == y[test_idx])

# 2. CLEAN: Select features using ONLY training partition
corrs_clean = np.array([np.abs(np.corrcoef(X[train_idx, j], y[train_idx])[0, 1]) for j in range(n_features)])
top_clean = np.argsort(corrs_clean)[-5:]
c1_clean = np.mean(X[train_idx][y[train_idx] == 1][:, top_clean], axis=0)
c0_clean = np.mean(X[train_idx][y[train_idx] == 0][:, top_clean], axis=0)
preds_clean = (np.linalg.norm(X[test_idx][:, top_clean] - c1_clean, axis=1) <
               np.linalg.norm(X[test_idx][:, top_clean] - c0_clean, axis=1)).astype(int)
acc_clean = np.mean(preds_clean == y[test_idx])

print(f"Test accuracy with feature selection leakage: {acc_leak:.2f}")
print(f"Test accuracy with clean in-fold selection:   {acc_clean:.2f}")`,
    quiz: [
      {
        q: r`A machine learning engineer achieves 99.5% accuracy predicting loan defaults, but in production the model performs no better than random guessing. What is the most probable cause?`,
        o: [
          r`The learning rate in gradient descent was set too low`,
          r`A feature such as 'Collection Agency Referral Date' was included, which is only populated after a borrower defaults (target leakage)`,
          r`The dataset was scaled using RobustScaler instead of StandardScaler`,
          r`The model had too few tree estimators`,
        ],
        a: 1,
        why: r`Features that are populated or updated as a consequence of the target event (like referral to collections) leak future outcome knowledge into training, creating deceptive offline performance that fails live.`,
      },
      {
        q: r`Why is computing StandardScaler mean and standard deviation across an entire dataset prior to cross-validation considered data leakage?`,
        o: [
          r`It inflates the training set with test distribution statistics, violating the assumption that test data is unseen`,
          r`It forces continuous features to become discrete integers`,
          r`It causes the matrix inverse to become singular during regression`,
          r`It converts the target variable into a normal distribution`,
        ],
        a: 0,
        why: r`Fitting transformers on the full dataset allows test set statistical information to seep into the training set, causing optimistic validation scores.`,
      },
      {
        q: r`How does out-of-fold target encoding prevent target leakage in high-cardinality categorical variables?`,
        o: [
          r`By replacing all categorical strings with random Gaussian noise`,
          r`By ensuring each observation's target encoding is calculated exclusively from other rows, excluding its own target value`,
          r`By converting categorical columns into one-hot binary columns`,
          r`By calculating category means only on the test partition`,
        ],
        a: 1,
        why: r`If a row's own target label is included when calculating its category's mean target value, the feature directly leaks the label, especially for rare categories with sample count 1.`,
      },
    ],
    usedBy: [],
    prereq: ['train-validation-test-splits-group-and-time-based', 'cross-validation'],
    related: ['scikit-learn-pipelines-and-columntransformer', 'missing-data-mcar-mar-mnar-and-imputation', 'encoding-categoricals-one-hot-ordinal-target-woe'],
    keywords: 'data leakage target leakage preprocessing leakage feature leakage lookahead bias out of fold cross validation',
  },
  {
    id: 'scikit-learn-pipelines-and-columntransformer',
    short: 'Pipelines and ColumnTransformer',
    title: 'scikit-learn Pipelines and ColumnTransformer',
    task: 'concepts',
    module: 'Pipelines and validation',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Composing heterogeneous feature transformations and estimators into unified, leakage-free workflows that adhere to the standard fit/transform contract.`,
    lead: r`Real-world datasets mix numeric measurements, categorical identifiers, and text fields that each require distinct preprocessing pipelines. Manually transforming columns across loose scripts invariably induces subtle data leakage and deployment friction. scikit-learn Pipeline chains sequential transformations with estimators, while ColumnTransformer routes heterogeneous columns through dedicated preprocessing branches under an atomic fit/transform contract.`,
    intuition: [
      r`Imagine an automobile manufacturing assembly line. Raw steel and chassis components enter at station 1, doors and windows are attached at station 2, the engine is mounted at station 3, and final safety inspection occurs at station 4. If a mechanic at station 2 tries to install doors using measurements from a vehicle that has not yet entered the factory, the entire process breaks down. In messy data science workflows, analysts often run loose pandas scripts that fill missing values with the global median and scale columns across the whole table before splitting. This silently leaks test data into training.`,
      r`The scikit-learn Pipeline solves this by encapsulating the entire chain into a single composite estimator. When you call pipeline.fit(X_train, y_train), every intermediate step learns its parameters (e.g. imputation medians, scaling means and standard deviations) exclusively on X_train. When you subsequently call pipeline.predict(X_test), those exact learned parameters are applied to X_test without re-fitting. The test set remains completely pristine and unobserved until the prediction step.`,
      r`ColumnTransformer extends this principle to multi-type tabular data. Instead of forcing you to manually slice and re-glue numpy matrices, ColumnTransformer acts as a declarative routing switchboard: continuous numerical columns are routed to median imputers and standard scalers; categorical columns are routed to frequent imputers and one-hot encoders; and non-informative IDs are dropped. The transformed branches are automatically concatenated horizontally into a dense or sparse design matrix ready for the final model.`,
    ],
    analogy: r`A parcel sorting facility where letters, fragile boxes, and oversized packages are routed to dedicated conveyor belts and reassembled into a single delivery truck.`,
    steps: [
      r`Partition feature columns by type: identify continuous numerical features, low-cardinality categoricals, and high-cardinality identifiers.`,
      r`Construct modular sub-pipelines: build dedicated Pipeline objects for each data type (e.g. median imputer + robust scaler for numeric columns).`,
      r`Assemble ColumnTransformer: bind sub-pipelines to column lists, specifying remainder='drop' or remainder='passthrough'.`,
      r`Append final estimator: package the ColumnTransformer and the downstream classifier or regressor into a unified root Pipeline.`,
      r`Execute atomic validation: pass the root Pipeline directly into cross-validation functions; all preprocessing steps re-fit cleanly within each training fold.`,
    ],
    math: [
      {
        h: 'Sequential transformation composition',
        tex: r`\hat{y} = f_{\theta} \left( T_k \left( T_{k-1} \left( \dots T_1(X) \dots \right) \right) \right)`,
        p: r`Where each transformation $T_j(X) = \phi_j(X; \hat{\Theta}_j)$ is parametrised by parameters $\hat{\Theta}_j$ learned strictly during the fitting phase of the training partition $\mathcal{D}_{\text{train}}$, ensuring complete encapsulation.`,
      },
      {
        h: 'ColumnTransformer partitioned dispatch',
        tex: r`T_{\text{column}}(X) = \bigoplus_{m=1}^M T_m\left(X_{[:, \mathcal{J}_m]}\right)`,
        p: r`Where $\mathcal{J}_1, \dots, \mathcal{J}_M$ partition the feature column indices, $X_{[:, \mathcal{J}_m]}$ is the submatrix of selected features, and $\bigoplus$ represents horizontal matrix concatenation along the feature axis.`,
      },
      {
        h: 'Out-of-sample inference invariance',
        tex: r`T_m\left(X_{\text{test}}; \hat{\Theta}_{m, \text{train}}\right) = \phi_m\left(X_{\text{test}}; \hat{\Theta}_{m, \text{train}}\right)`,
        p: r`Crucially, the learned transformation parameters $\hat{\Theta}_{m, \text{train}}$ remain fixed and immutable when transforming $X_{\text{test}}$, guaranteeing that test set distribution shifts never feed backward into model parameters.`,
      },
    ],
    keyPoints: [
      r`Pipelines enforce atomic execution of preprocessing and modelling, completely eliminating preprocessing leakage across cross-validation folds.`,
      r`ColumnTransformer dispatches distinct feature subsets to specialised sub-pipelines, eliminating fragile manual matrix slicing.`,
      r`Hyperparameter search can simultaneously optimise preprocessing choices (e.g. imputer strategy) and estimator hyperparameters (e.g. regularisation strength) in a single grid search.`,
    ],
    pitfalls: [
      r`Calling fit_transform on validation or test datasets instead of transform, which overwrites learned training statistics with test statistics.`,
      r`Relying on column integer indices in ColumnTransformer when input dataframes can have columns reordered between development and deployment.`,
      r`Writing custom transformers that do not adhere to the scikit-learn API contract: missing fit returning self, or transform returning a 2D array.`,
    ],
    code: r`import numpy as np

# Pure NumPy implementation of Pipeline and ColumnTransformer pattern
class ColumnTransformer:
    def __init__(self, transformers):
        self.transformers = transformers  # list of (name, transformer, cols)
    def fit(self, X):
        for _, t, cols in self.transformers:
            t.fit(X[:, cols])
        return self
    def transform(self, X):
        transformed = [t.transform(X[:, cols]) for _, t, cols in self.transformers]
        return np.hstack(transformed)

class ImputeAndScale:
    def fit(self, X):
        self.mean_ = np.nanmean(X, axis=0)
        X_imp = np.where(np.isnan(X), self.mean_, X)
        self.std_ = np.std(X_imp, axis=0) + 1e-8
        return self
    def transform(self, X):
        X_imp = np.where(np.isnan(X), self.mean_, X)
        return (X_imp - self.mean_) / self.std_

# Simulated dataset: cols 0-1 continuous with NaNs, col 2 binary indicator
np.random.seed(42)
X_train = np.array([[25.0, 50000.0, 1], [np.nan, 80000.0, 0], [45.0, 120000.0, 1], [30.0, np.nan, 0]])
X_test = np.array([[np.nan, 60000.0, 1], [50.0, 95000.0, 0]])

ct = ColumnTransformer([
    ('num', ImputeAndScale(), [0, 1]),
    ('pass', type('Pass', (), {'fit': lambda s, x: s, 'transform': lambda s, x: x})(), [2])
])
ct.fit(X_train)
X_test_trans = ct.transform(X_test)

print(f"Fitted train means: age={ct.transformers[0][1].mean_[0]:.1f}, salary={ct.transformers[0][1].mean_[1]:.1f}")
print(f"Transformed test shape: {X_test_trans.shape}")
print(f"Test sample 0 transformed: {np.round(X_test_trans[0], 2)}")`,
    quiz: [
      {
        q: r`When evaluating a composite scikit-learn Pipeline with cross-validation, how does it prevent preprocessing data leakage?`,
        o: [
          r`By fitting intermediate transformers strictly on the training fold and applying transform to the validation fold`,
          r`By removing all non-numeric columns from the dataset before splitting`,
          r`By doubling the number of cross-validation iterations automatically`,
          r`By converting all estimators into linear regressions`,
        ],
        a: 0,
        why: r`Because the Pipeline encapsulates transformers and estimators together, cross-validation re-fits the transformers from scratch on each training fold, preventing test fold contamination.`,
      },
      {
        q: r`What critical scikit-learn convention must custom transformer classes adhere to so they integrate smoothly into a Pipeline?`,
        o: [
          r`They must define fit(X, y) returning self and transform(X) returning a 2D array or dataframe`,
          r`They must inherit from torch.nn.Module`,
          r`They must run asynchronously using Python threading`,
          r`They must implement backpropagation gradients manually`,
        ],
        a: 0,
        why: r`The standard scikit-learn transformer protocol requires a fit method that estimates parameters and returns self, and a transform method that applies those parameters to transform input arrays.`,
      },
      {
        q: r`What happens if you accidentally call fit_transform instead of transform on a test dataset during production inference?`,
        o: [
          r`The code throws an immediate syntax error`,
          r`The pipeline re-estimates transformation parameters (e.g. mean, variance) from the test batch, discarding learned training baselines and creating distribution shift`,
          r`The pipeline permanently deletes the trained model weights`,
          r`The predictions become exactly zero for all inputs`,
        ],
        a: 1,
        why: r`Calling fit_transform on test or production data recalculates statistics from the incoming batch, which corrupts inference if test batch sizes are small or unrepresentative.`,
      },
    ],
    usedBy: [],
    prereq: ['data-leakage', 'train-validation-test-splits-group-and-time-based'],
    related: ['scaling-and-transforms-standard-robust-box-cox-yeo-johnson', 'missing-data-mcar-mar-mnar-and-imputation', 'encoding-categoricals-one-hot-ordinal-target-woe'],
    keywords: 'scikit learn pipeline columntransformer feature preprocessing transformer fit transform data leakage cross validation',
  },
  {
  "id": "experiment-tracking",
  "short": "Experiment tracking",
  "title": "Experiment Tracking: Systematic Machine Learning Lifecycle Logging",
  "task": "concepts",
  "level": 1,
  "minutes": 14,
  "noLab": true,
  "summary": "Logging hyperparameters, training metrics, code hashes, dataset versions, and model artifacts to ensure auditability and scientific reproducibility.",
  "lead": "Machine learning development is fundamentally iterative and empirical: data scientists test dozens of model architectures, feature subsets, and hyperparameter combinations. Without systematic experiment tracking, critical institutional knowledge is lost in terminal outputs, scripts become irreproducible, and identifying which exact run produced the production model becomes impossible.",
  "analogy": "Imagine a pharmaceutical laboratory testing hundreds of chemical compounds for a new vaccine. If scientists write recipes on loose napkins and throw away temperature logs once an experiment fails, they will inadvertently repeat dead ends and cannot prove to regulatory inspectors which exact process yielded the successful cure. Experiment tracking is the immutable, timestamped laboratory notebook of machine learning.",
  "intuition": [
    "An ad-hoc approach to ML relies on manual naming conventions (`model_v2_final_really.pkl`), local notes, and memory. This quickly breaks down when teams scale or when models must be audited months later.",
    "Modern experiment tracking platforms (such as MLflow, Weights & Biases, Comet, and Neptune) formalise every training iteration as an immutable \"run\" that logs three core categories of information: inputs, outputs, and metadata.",
    "Inputs include git commit SHA, uncommitted code diffs, data version hashes (e.g. DVC commit), and hyperparameter dictionaries. Outputs include epoch-by-epoch loss curves, evaluation metrics (AUC, F1, RMSE), confusion matrices, and serialized model artifacts.",
    "Metadata tracks hardware environment (GPU type, CUDA version), Python package dependency locks (`requirements.txt`), execution timestamp, and execution author. This structured logging enables multi-run comparisons, leaderboard ranking, and automated lineage auditing."
  ],
  "steps": [
    "Instrumentation: Initialize an experiment client and wrap training scripts with automated logging callbacks or context managers (`mlflow.start_run()`).",
    "Parameter logging: Record complete configuration payloads (learning rate, tree depth, batch size, feature lists) at run initialization.",
    "Metric streaming: Log training and validation loss curves at every epoch or step to detect overfitting and training divergence.",
    "Artifact registration: Log serialized model checkpoints, diagnostic plots (ROC curves, calibration curves), and dependency manifests.",
    "Lineage tagging: Tag the run with git commit hash, dataset commit ID, and author to ensure total end-to-end provenance."
  ],
  "math": [
    {
      "h": "Deterministic Run Provenance Tuple",
      "tex": "\\mathcal{R} = \\left( \\mathcal{C}_{\\mathrm{git}}, \\mathcal{D}_{\\mathrm{hash}}, \\Theta_{\\mathrm{params}}, \\mathcal{E}_{\\mathrm{env}}, \\mathcal{M}_{\\mathrm{metrics}}, \\mathcal{A}_{\\mathrm{artifact}} \\right)",
      "p": "A fully specified experiment run $\\mathcal{R}$ binds the code commit, data hash, hyperparameter configuration, environment lock, evaluated metrics, and saved binary artifacts."
    },
    {
      "h": "Metric Trajectory Series",
      "tex": "\\mathcal{T}_m = \\left\\{ (s, t, v_s) \\;\\middle|\\; s \\in \\{1, \\dots, S\\}, \\; v_s = m(f_{\\theta_s}(X_{\\mathrm{val}}), y_{\\mathrm{val}}) \\right\\}",
      "p": "Experiment tracking logs timestamped metric evaluations across training steps $s$ to reconstruct full learning trajectories."
    },
    {
      "h": "Model Checkpoint Lineage Verification",
      "tex": "\\mathrm{SHA256}(\\mathcal{A}) = \\mathrm{RegistryMatch}(\\mathcal{R}_{\\mathrm{id}})",
      "p": "Cryptographic hashing verifies that a production-deployed binary artifact exactly matches the recorded experiment run."
    }
  ],
  "code": "import json\nimport hashlib\nimport time\n\nclass MiniExperimentTracker:\n    def __init__(self, experiment_name: str):\n        self.experiment_name = experiment_name\n        self.runs = []\n\n    def log_run(self, params: dict, metrics: dict, code_commit: str, data_hash: str):\n        run_record = {\n            'run_id': hashlib.sha1(f\"{time.time()}_{params}\".encode()).hexdigest()[:8],\n            'timestamp': time.strftime(\"%Y-%m-%dT%H:%M:%SZ\", time.gmtime()),\n            'code_commit': code_commit,\n            'data_hash': data_hash,\n            'params': params,\n            'metrics': metrics\n        }\n        self.runs.append(run_record)\n        return run_record\n\n# Simulate tracking two model experiments\ntracker = MiniExperimentTracker(experiment_name=\"churn-prediction\")\n\n# Run 1: Baseline Random Forest\nrun_1 = tracker.log_run(\n    params={'model': 'RandomForest', 'n_estimators': 100, 'max_depth': 6},\n    metrics={'val_auc': 0.812, 'val_logloss': 0.425},\n    code_commit='git_a4f10c',\n    data_hash='dvc_98b1e2'\n)\n\n# Run 2: Tuned Gradient Boosting\nrun_2 = tracker.log_run(\n    params={'model': 'LightGBM', 'learning_rate': 0.05, 'max_depth': 5},\n    metrics={'val_auc': 0.849, 'val_logloss': 0.381},\n    code_commit='git_c7b20e',\n    data_hash='dvc_98b1e2'\n)\n\n# Compare runs\nprint(f\"Logged {len(tracker.runs)} runs in '{tracker.experiment_name}':\")\nfor r in tracker.runs:\n    print(f\"Run {r['run_id']} | Model: {r['params']['model']} | AUC: {r['metrics']['val_auc']}\")",
  "keyPoints": [
    "Experiment tracking captures parameters, metrics, code revisions, and artifacts for every model run.",
    "Prevents loss of empirical findings and eliminates ad-hoc filename versioning.",
    "Provides auditable lineage connecting production model binaries back to their exact training data and code.",
    "Enables multi-run metric comparisons, loss curve visualisations, and leaderboard ranking."
  ],
  "pitfalls": [
    "Logging only summary metrics: Forgetting to log the git commit hash or dataset snapshot makes a run impossible to reproduce even if metrics look outstanding.",
    "Metric logging bottleneck: Sending high-frequency metrics across a remote network on every single micro-batch degrades GPU training throughput.",
    "Uncommitted code changes: Running experiments with dirty git working directories logs a commit hash that does not actually reflect the code that ran."
  ],
  "quiz": [
    {
      "q": "Which set of elements is essential to guarantee complete reproducibility of a machine learning experiment run?",
      "o": [
        "Model accuracy score and user password",
        "Git commit hash, dataset version hash, hyperparameters, software environment lock, and random seed",
        "Only the final serialized `.pkl` binary file",
        "The CPU clock speed and monitor resolution"
      ],
      "a": 1,
      "why": "Reproducibility requires knowing the exact code commit, immutable training dataset version, configuration parameters, dependencies, and initial random seeds."
    },
    {
      "q": "What is a common performance pitfall when logging training metrics during deep neural network training?",
      "o": [
        "Logging strings causes floating point rounding errors",
        "Synchronous remote network logging on every micro-batch blocks GPU computation and slows down training",
        "Logging validation loss causes gradient explosion",
        "Experiment tracking platforms cannot store more than 10 numbers"
      ],
      "a": 1,
      "why": "Synchronous HTTP API calls inside tight GPU training loops cause GPUs to sit idle waiting for network round-trips. Metrics should be buffered or logged asynchronously."
    },
    {
      "q": "Why should dataset version hashes (e.g. via DVC or LakeFS) be logged alongside hyperparameter configurations?",
      "o": [
        "Because datasets naturally drift or get updated over time; without the data hash, identical code will produce different models",
        "Because databases refuse to run queries without a hash key",
        "To compress tabular files into smaller zip archives",
        "To automatically impute missing null values"
      ],
      "a": 0,
      "why": "If the underlying data changes, re-running identical code with identical hyperparameters produces an entirely different model unless the exact dataset version was logged."
    }
  ],
  "related": [
    "reproducibility",
    "scikit-learn-pipelines-and-columntransformer",
    "docker-and-reproducible-environments"
  ],
  "keywords": "experiment tracking, mlflow, weights and biases, metrics, hyperparameters, model lineage, provenance, machine learning lifecycle",
  "usedBy": []
},
  {
  "id": "reproducibility",
  "short": "Reproducibility",
  "title": "Reproducibility in Machine Learning: Determinism, Seeds, and Environments",
  "task": "concepts",
  "level": 2,
  "minutes": 15,
  "noLab": true,
  "summary": "Achieving scientific and production reproducibility across pseudorandom number generators, multi-threading, GPU nondeterminism, and environment locks.",
  "lead": "In software engineering, compiling the same source code with the same compiler always yields identical binaries. In machine learning, however, re-running identical code on identical data often produces different weights, fluctuating metrics, and divergent decisions. Achieving true end-to-end reproducibility requires controlling random seeds, hardware thread scheduling, GPU CUDA operations, and software dependency locks.",
  "analogy": "Imagine following a baking recipe where the recipe specifies \"add yeast and stir until bubbly\". Depending on room temperature, humidity, and the vigour of your whisking, the dough rises differently every time. Achieving commercial culinary reproducibility requires an automated climate-controlled chamber, exact gram weights, and a mechanical mixer running at a fixed RPM for exactly 180 seconds.",
  "intuition": [
    "Machine learning pipelines contain dozens of stochastic elements: train/test split sampling, random weight initialisation, minibatch shuffling, dropout masks, and tree feature subsampling. Each relies on pseudorandom number generators (PRNGs).",
    "Setting a single seed (e.g. `np.random.seed(42)`) is insufficient because modern frameworks run multiple independent PRNGs across Python built-in `random`, NumPy, PyTorch CPU, and PyTorch CUDA.",
    "Beyond seeds, parallel hardware execution introduces non-determinism. Multi-threaded operations like OpenMP matrix multiplications and asynchronous CUDA atomic additions sum floating point numbers in varying orders. Because floating point addition is non-associative ($ (a + b) + c \\ne a + (b + c) $ due to rounding), different thread arrival orders produce different rounding errors that compound over millions of gradient steps.",
    "Finally, environment drift (a minor patch update to scikit-learn, CUDA drivers, or BLAS linear algebra libraries) can alter default parameters or algorithmic implementations. Hermetic reproducibility requires containerised environment locks (Docker, conda-lock, or poetry.lock)."
  ],
  "steps": [
    "Multi-engine PRNG seeding: Seed all active random generators: Python `random`, NumPy, PyTorch CPU, PyTorch CUDA, and environment variable `PYTHONHASHSEED`.",
    "Enforce algorithmic determinism: Configure deep learning frameworks to enforce deterministic algorithms (`torch.use_deterministic_algorithms(True)` and `CUBLAS_WORKSPACE_CONFIG=:4096:8`).",
    "Pin hardware concurrency: Constrain multi-threaded math libraries (MKL, OpenMP, BLAS) to fixed thread counts (`torch.set_num_threads(1)` during strict testing).",
    "Dependency locking: Export explicit hash-pinned dependency manifests (`pip freeze` with hashes, `poetry.lock`, or Docker image digest).",
    "Data version pinning: Reference immutable dataset commits using tools like DVC, LakeFS, or Delta Lake time-travel rather than mutable database tables."
  ],
  "math": [
    {
      "h": "Floating Point Non-Associativity",
      "tex": "(a \\oplus b) \\oplus c \\ne a \\oplus (b \\oplus c)",
      "p": "Due to finite precision truncation in IEEE 754 floating point arithmetic, differing summation orders in parallel threads produce non-identical results."
    },
    {
      "h": "Atomic Float Accumulation Divergence",
      "tex": "\\hat{g} = \\bigoplus_{k=1}^K g_{\\pi(k)}, \\quad \\pi \\in \\mathcal{S}_K",
      "p": "When $K$ CUDA threads execute atomic additions, the thread arrival permutation $\\pi$ varies across runs, causing slight divergence in computed gradients $\\hat{g}$."
    },
    {
      "h": "Deterministic State Transition Function",
      "tex": "\\mathcal{S}_{t+1} = f(\\mathcal{S}_t, \\mathcal{D}_t; \\xi_t), \\quad \\xi_t = \\mathrm{PRNG}(\\sigma, t)",
      "p": "Model state $\\mathcal{S}$ evolves deterministically if and only if initial seed $\\sigma$, dataset batch order $\\mathcal{D}_t$, and framework operations $f$ are strictly invariant."
    }
  ],
  "code": "import random\nimport os\nimport numpy as np\nimport torch\n\ndef set_strict_determinism(seed: int = 42):\n    \"\"\"Enforce complete determinism across all random number generators and hardware.\"\"\"\n    # 1. Python built-in and hash seed\n    random.seed(seed)\n    os.environ['PYTHONHASHSEED'] = str(seed)\n    \n    # 2. NumPy PRNG\n    np.random.seed(seed)\n    \n    # 3. PyTorch CPU and CUDA\n    torch.manual_seed(seed)\n    if torch.cuda.is_available():\n        torch.cuda.manual_seed(seed)\n        torch.cuda.manual_seed_all(seed)\n        \n        # Enforce deterministic convolution algorithms\n        torch.backends.cudnn.deterministic = True\n        torch.backends.cudnn.benchmark = False\n        \n        # Configure cuBLAS workspace for deterministic operations\n        os.environ['CUBLAS_WORKSPACE_CONFIG'] = ':4096:8'\n    \n    # Throw an error if a non-deterministic operation is invoked\n    try:\n        torch.use_deterministic_algorithms(True)\n    except AttributeError:\n        pass\n    print(f\"Deterministic seed locked: {seed}\")\n\nset_strict_determinism(42)\n\n# Verify reproducible tensor operations\nt1 = torch.randn(3, 3)\nset_strict_determinism(42)\nt2 = torch.randn(3, 3)\nassert torch.equal(t1, t2), \"Tensors must be strictly identical across identical seeds!\"\nprint(\"Determinism verified successfully.\")",
  "keyPoints": [
    "True reproducibility requires seeding Python, NumPy, PyTorch, and locking `PYTHONHASHSEED`.",
    "Floating point operations are non-associative; thread race conditions in multi-GPU and multi-CPU environments introduce variation.",
    "Enforcing strict GPU determinism may incur a modest throughput penalty (10–20%) because fast non-deterministic atomic operations are disabled.",
    "Containerisation (Docker) and pinned lockfiles guarantee identical compiler, driver, and library versions."
  ],
  "pitfalls": [
    "Assuming `torch.manual_seed` seeds NumPy: PyTorch and NumPy use completely separate PRNG states; seeding one does not affect the other.",
    "Multi-worker DataLoader leakage: In PyTorch DataLoaders with `num_workers > 0`, workers inherit identical seed states unless configured with a `worker_init_fn`.",
    "Running on different GPU architectures: A model trained on an NVIDIA A100 vs an RTX 4090 will produce slightly different floating point weights even with identical seeds due to microarchitecture math differences."
  ],
  "quiz": [
    {
      "q": "Why does multi-threaded parallel floating point summation produce different numbers across runs even with identical random seeds?",
      "o": [
        "CPUs intentionally inject random noise to avoid overheating",
        "Floating point addition is non-associative; varying thread execution orders sum numbers in different sequences",
        "Random seeds expire after 100 milliseconds",
        "Operating system kernel memory leaks randomly modify bit registers"
      ],
      "a": 1,
      "why": "Because $(a + b) + c \\ne a + (b + c)$ in IEEE 754 arithmetic, changing the order in which parallel threads accumulate numbers alters the lowest-order bits."
    },
    {
      "q": "What is the consequence of setting `torch.backends.cudnn.benchmark = True` in PyTorch?",
      "o": [
        "It forces all neural network weights to zero",
        "It tests multiple convolution algorithms and selects the fastest, which may introduce non-determinism across runs",
        "It disables GPU acceleration and runs everything on the CPU",
        "It guarantees bitwise reproducibility across different hardware devices"
      ],
      "a": 1,
      "why": "`cudnn.benchmark = True` benchmarks several convolution algorithms on the fly to pick the fastest one, which may change between runs and cause non-deterministic behaviour."
    },
    {
      "q": "In a multi-worker PyTorch DataLoader (`num_workers=4`), what happens if you do not provide a custom `worker_init_fn`?",
      "o": [
        "The script crashes with a memory allocation fault",
        "Each worker process may generate identical sequences of random augmentations, reducing data diversity",
        "Training becomes completely deterministic",
        "The DataLoader converts all images to grayscale"
      ],
      "a": 1,
      "why": "Forked worker processes inherit the exact same base PRNG seed, causing each worker to perform identical augmentations on different items unless re-seeded per worker."
    }
  ],
  "related": [
    "experiment-tracking",
    "docker-and-reproducible-environments",
    "the-pytorch-training-loop"
  ],
  "keywords": "reproducibility, determinism, random seeds, prng, floating point non-associativity, cudnn deterministic, dependency locking",
  "usedBy": []
},
  {
    id: 'forecast-metrics-mae-mase-smape-wape',
    short: 'Forecast metrics: MAE, MASE',
    title: 'Forecast Metrics: MAE, MASE, sMAPE, WAPE',
    task: 'concepts',
    module: 'Forecasting at scale',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Evaluating time-series forecasts across varying demand scales, intermittent zeros, and directional asymmetries without scale distortion.`,
    lead: r`Evaluating time-series forecasts requires fundamentally different metrics than standard cross-sectional regression. Traditional percentage errors like MAPE explode or divide by zero when demand is intermittent, while scale-dependent metrics like RMSE penalize high-volume series while ignoring slow-moving items. Scale-independent metrics such as MASE, sMAPE, and WAPE provide robust, business-interpretable evaluations across massive forecasting hierarchies.`,
    intuition: [
      r`Imagine managing inventory for a national supermarket chain with 50,000 distinct items. For high-velocity goods like two-litre milk bottles, a single store sells 5,000 units weekly; your forecast of 4,800 units is off by 200 units, representing an error of 4%. For slow-moving specialty items like saffron or organic truffle oil, the store sells 1 unit every other week (average 0.5 units). If your model predicts 0 units when 1 unit is sold, the absolute error is just 1 unit, but the classic Mean Absolute Percentage Error (MAPE) is 100%. If actual sales are 0 and the model predicts 1, MAPE divides by zero and becomes mathematically undefined! Averaging MAPE across 50,000 items produces an infinite or completely distorted score dominated by slow movers.`,
      r`To resolve scale disparities without dividing by zero, Rob Hyndman and Anne Koehler introduced Mean Absolute Scaled Error (MASE). MASE divides the model's test Mean Absolute Error (MAE) by the in-sample MAE of a naive baseline (predicting tomorrow using yesterday's actuals on historical training data). If MASE is less than 1.0, the forecast outperforms a trivial random-walk persistence baseline; if MASE exceeds 1.0, the forecast is literally worse than doing nothing. Because the scaling denominator comes from the training series, MASE never divides by zero on non-constant series and remains directly comparable across high-volume and low-volume products.`,
      r`For supply chain executives and inventory planners, aggregate financial discrepancies matter more than unweighted item percentages. Weighted Absolute Percentage Error (WAPE) sums the absolute forecast errors across all time steps and items and divides by the total actual sales volume. Unlike unweighted MAPE, WAPE cannot divide by zero at individual item timestamps, and it automatically weights errors in proportion to each product's sales volume.`,
    ],
    analogy: r`Scoring a golfer relative to par on different courses (MASE) rather than counting raw strokes, or measuring an entire company's budget accuracy by total revenue discrepancy (WAPE) rather than averaging departmental percentage errors.`,
    steps: [
      r`Audit series for zero demand: identify sparsity, intermittency, or zeros that rule out standard percentage metrics like MAPE.`,
      r`Establish naive baseline benchmark: compute the in-sample Mean Absolute Error of a one-step persistence forecast on training history.`,
      r`Compute scale-free MASE: divide forecast test MAE by the training naive benchmark MAE to measure relative skill.`,
      r`Calculate portfolio WAPE: sum absolute errors across all time points and SKUs, dividing by total actual volume to obtain a volume-weighted percentage error.`,
      r`Inspect directional bias: calculate mean error or sMAPE to ensure the model does not systematically over-forecast or under-forecast demand.`,
    ],
    math: [
      {
        h: 'Mean Absolute Error (MAE) and Weighted Absolute Percentage Error (WAPE)',
        tex: r`\text{MAE} = \frac{1}{H} \sum_{t=1}^H |y_t - \hat{y}_t|, \qquad \text{WAPE} = \frac{\sum_{t=1}^H |y_t - \hat{y}_t|}{\sum_{t=1}^H y_t}`,
        p: r`Where $H$ is the forecast horizon, $y_t$ is actual demand, and $\hat{y}_t$ is the forecast. WAPE aggregates errors across all time points and items before dividing by total volume, avoiding zero-division singularities and weighting errors by volume.`,
      },
      {
        h: 'Mean Absolute Scaled Error (MASE)',
        tex: r`\text{MASE} = \frac{\frac{1}{H}\sum_{t=1}^H |y_t - \hat{y}_t|}{\frac{1}{T-1} \sum_{t=2}^T |y_t - y_{t-1}|}`,
        p: r`Where the denominator is the in-sample Mean Absolute Error of the naive persistence forecast computed across training history of length $T$. A value $\text{MASE} < 1$ indicates that the forecast outperforms the trivial persistence baseline.`,
      },
      {
        h: 'Symmetric Mean Absolute Percentage Error (sMAPE)',
        tex: r`\text{sMAPE} = \frac{100\%}{H} \sum_{t=1}^H \frac{|y_t - \hat{y}_t|}{(|y_t| + |\hat{y}_t|) / 2}`,
        p: r`sMAPE bounds percentage errors between $0\%$ and $200\%$ by normalising by the average of actual and predicted values, though it penalises under-forecasting more heavily than over-forecasting.`,
      },
    ],
    keyPoints: [
      r`MASE normalises error by the in-sample naive persistence baseline, enabling unbiased comparisons across series with radically different scales.`,
      r`WAPE weights errors by volume, providing a robust aggregate percentage metric that never divides by zero on intermittent demand.`,
      r`Standard MAPE fails on intermittent demand series where actual values equal zero, producing infinities and heavily skewed portfolio summaries.`,
    ],
    pitfalls: [
      r`Using traditional MAPE on datasets with zero actual values, resulting in division by zero or explosive values.`,
      r`Computing the MASE naive benchmark denominator on the test set instead of the historical training set.`,
      r`Overlooking sMAPE directional asymmetry: predicting 0 when actual is 100 yields 200% error, whereas predicting 200 when actual is 100 yields only 66.7% error.`,
    ],
    code: r`import numpy as np

def mae(actual, pred):
    return np.mean(np.abs(actual - pred))

def wape(actual, pred):
    return np.sum(np.abs(actual - pred)) / np.sum(actual)

def mase(actual, pred, train_history):
    naive_mae = np.mean(np.abs(np.diff(train_history)))
    return mae(actual, pred) / naive_mae

def smape(actual, pred):
    denom = (np.abs(actual) + np.abs(pred)) / 2.0
    return np.mean(np.where(denom == 0, 0, np.abs(actual - pred) / denom)) * 100

# Realistic intermittent retail demand series
train_history = np.array([12, 15, 11, 14, 0, 8, 10, 13, 16, 12, 14, 15], dtype=float)
y_actual = np.array([14, 0, 9, 12, 15, 0], dtype=float)
y_pred = np.array([13, 2, 10, 11, 14, 1], dtype=float)

print(f"MAE:   {mae(y_actual, y_pred):.2f} units")
print(f"WAPE:  {wape(y_actual, y_pred):.1%} of total volume")
print(f"MASE:  {mase(y_actual, y_pred, train_history):.3f} (< 1 beats naive baseline)")
print(f"sMAPE: {smape(y_actual, y_pred):.1f}%")`,
    quiz: [
      {
        q: r`Why is Mean Absolute Scaled Error (MASE) preferred over Mean Absolute Percentage Error (MAPE) when evaluating intermittent demand forecasts with frequent zero sales?`,
        o: [
          r`Because MAPE divides by zero whenever actual demand is zero, producing undefined or explosive errors, whereas MASE normalises by the in-sample naive baseline`,
          r`Because MASE only works on integer values`,
          r`Because MAPE cannot be computed on more than 10 time periods`,
          r`Because MASE converts all forecasts into negative probabilities`,
        ],
        a: 0,
        why: r`MAPE has actual demand in its denominator, creating division-by-zero singularities whenever sales are 0. MASE scales by the historical naive baseline error, avoiding zero division on non-trivial series.`,
      },
      {
        q: r`A retail demand forecasting model achieves a MASE of 0.65 on a holdout test horizon. How should an analyst interpret this result?`,
        o: [
          r`The model has an error rate of 65%`,
          r`The model reduces mean absolute error by 35% compared to a naive persistence random-walk baseline`,
          r`The model fails to beat a trivial persistence forecast`,
          r`The model predicts negative demand for 65% of products`,
        ],
        a: 1,
        why: r`A MASE below 1.0 indicates superior performance relative to the one-step naive baseline; a score of 0.65 means the model's error is 65% of the naive baseline error (a 35% error reduction).`,
      },
      {
        q: r`In supply chain forecasting across multiple products, why is Weighted Absolute Percentage Error (WAPE) often preferred over unweighted portfolio MAPE?`,
        o: [
          r`WAPE squares all errors to heavily penalise outliers`,
          r`WAPE weights errors proportionally by product sales volume, preventing low-volume items from dominating total business error`,
          r`WAPE does not require knowing the actual sales values`,
          r`WAPE is strictly guaranteed to be zero for linear regression models`,
        ],
        a: 1,
        why: r`Unweighted MAPE gives equal importance to an item selling 1 unit and an item selling 10,000 units. WAPE sums errors across all items before dividing by total volume, accurately reflecting overall business impact.`,
      },
    ],
    usedBy: [],
    prereq: ['regression-metrics', 'lag-and-rolling-window-features'],
    related: ['train-validation-test-splits-group-and-time-based', 'data-leakage', 'outlier-handling'],
    keywords: 'forecast metrics mae mase smape wape mape time series demand forecasting scale independent hyndman',
  },
  {
    id: 'time-series-cross-validation',
    short: 'Time-series cross-validation',
    title: 'Time-Series Cross-Validation',
    task: 'concepts',
    module: 'Forecasting at scale',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Evaluating sequential forecasters with expanding or rolling temporal windows, enforcing causal forward testing without lookahead contamination.`,
    lead: r`Standard k-fold cross-validation shuffles observations at random, which permits models predicting past events to learn from future data. Time-series cross-validation respects the chronological arrow of time by training strictly on historical windows and testing on subsequent future horizons. Selecting between expanding windows, rolling fixed-length windows, and inserting purge/embargo buffers guarantees that backtest metrics faithfully mirror live operational accuracy.`,
    intuition: [
      r`Imagine evaluating a weather model that predicts daily rainfall. If you randomly partition 365 calendar days into 5 standard cross-validation folds, fold 1 might test on a rainy Tuesday in April while training on Monday in April, Wednesday in April, and November storms. The model effectively interpolates between known adjacent data points. In reality, on 15 April you only possess data up to 14 April. Shuffled cross-validation dramatically overestimates accuracy because the model exploits future information that will never exist at forecast origin.`,
      r`Walk-forward evaluation (also known as rolling-origin evaluation) replicates true operational deployment. In the first split, you train on months 1 to 6 and forecast month 7. In the second split, you expand the training window to include months 1 to 7 and forecast month 8. In the third split, you train on months 1 to 8 and forecast month 9. At every step, the forecast origin moves forward in time, generating out-of-sample predictions strictly on future periods.`,
      r`The choice between an expanding window and a rolling window depends on stationarity. An expanding window retains all historical data, maximising sample size for stable long-term processes. A rolling window maintains a fixed duration (e.g. exactly 180 days), dropping older observations as new ones arrive. When underlying economic regimes, consumer tastes, or operational processes drift, rolling windows prevent obsolete historical patterns from misleading contemporary forecasts.`,
    ],
    analogy: r`Testing an investment fund manager day-by-day as the financial calendar advances, rather than letting them trade past quarters using tomorrow's newspaper.`,
    steps: [
      r`Define forecast horizon $H$: fix the exact number of future time steps the model must predict simultaneously in production (e.g. 7 days or 12 weeks).`,
      r`Determine initial training length $T_0$ and stride $S$: establish the minimum warm-up history required for stable model estimation and the step size between evaluation origins.`,
      r`Choose window geometry: adopt an expanding window if older data reinforces seasonal baselines, or a rolling fixed window if historical regimes become stale.`,
      r`Enforce purge and embargo margins: purge observations whose feature lookback windows overlap with training data, and embargo between consecutive folds if labels have multi-step duration.`,
      r`Aggregate out-of-fold performance: compute metrics like MAE, WAPE, or MASE across all evaluation origins to produce a robust temporal generalisation score.`,
    ],
    math: [
      {
        h: 'Expanding window walk-forward split partition',
        tex: r`\mathcal{D}_{\text{train}}^{(k)} = \{ (x_t, y_t) \mid t \le T_0 + k \cdot S \}, \qquad \mathcal{D}_{\text{val}}^{(k)} = \{ (x_t, y_t) \mid T_0 + k \cdot S < t \le T_0 + k \cdot S + H \}`,
        p: r`Where $T_0$ is the initial training duration, $S$ is the stride between forecast origins, and $H$ is the forecast horizon. Every split strictly enforces $\max(t_{\text{train}}) < \min(t_{\text{val}})$, ensuring complete temporal causality.`,
      },
      {
        h: 'Rolling fixed-width window partition',
        tex: r`\mathcal{D}_{\text{train, rolling}}^{(k)} = \{ (x_t, y_t) \mid T_0 + k \cdot S - W < t \le T_0 + k \cdot S \}`,
        p: r`Where $W$ is the fixed historical window length. Observations older than $t - W$ are discarded, preventing obsolete structural regimes from biasing model parameters.`,
      },
      {
        h: 'Multi-horizon aggregate forecast loss',
        tex: r`\mathcal{L}_{\text{TSCV}} = \frac{1}{K \cdot H} \sum_{k=0}^{K-1} \sum_{h=1}^H L\left(y_{T_k + h}, \hat{y}_{T_k + h \mid T_k}\right)`,
        p: r`Where $\hat{y}_{T_k + h \mid T_k}$ is the forecast generated at origin $T_k = T_0 + k \cdot S$ for lead time $h$. Averaging loss across multiple origins reduces evaluation variance caused by single-period anomalies.`,
      },
    ],
    keyPoints: [
      r`Walk-forward evaluation preserves temporal causality, completely eliminating lookahead leakage in forecasting benchmarks.`,
      r`Expanding windows maximise training sample size; rolling windows drop outdated historical data in non-stationary series.`,
      r`Multi-origin evaluation exposes models to diverse seasonal phases, holidays, and economic cycles.`,
    ],
    pitfalls: [
      r`Using standard shuffled k-fold cross-validation on time-series data, which leaks future information into training folds.`,
      r`Relying on a single train-test split: a single holdout month may coincide with an outlier event (e.g. severe blizzard or supply shock), yielding misleading validation metrics.`,
      r`Mismatching evaluation horizon with operational reality: evaluating one-step-ahead forecasts when production demands fourteen-day cumulative supply planning.`,
    ],
    code: r`import numpy as np

np.random.seed(42)
T = 40
t = np.arange(T)
y = 10.0 + 0.5 * t + np.random.normal(0, 1.0, size=T)

# Walk-forward expanding window cross-validation (horizon H=3, step S=3, initial T0=25)
T0, H, S = 25, 3, 3
n_splits = (T - T0) // S
maes = []

for k in range(n_splits):
    split_t = T0 + k * S
    train_idx = np.arange(split_t)
    val_idx = np.arange(split_t, split_t + H)
    
    # Fit simple autoregressive lag-1 model on historical window
    y_tr_y = y[train_idx[1:]]
    y_tr_x = y[train_idx[:-1]]
    a, b = np.polyfit(y_tr_x, y_tr_y, 1)
    
    # 3-step recursive forecast
    preds = []
    curr = y[train_idx[-1]]
    for _ in range(H):
        curr = a * curr + b
        preds.append(curr)
    
    mae_k = np.mean(np.abs(y[val_idx] - np.array(preds)))
    maes.append(mae_k)
    print(f"Fold {k}: Train t=0..{split_t-1}, Test t={split_t}..{split_t+H-1}, MAE: {mae_k:.2f}")

print(f"Average Walk-Forward MAE: {np.mean(maes):.2f}")`,
    quiz: [
      {
        q: r`Why is standard randomly shuffled k-fold cross-validation invalid for evaluating time-series forecasting models?`,
        o: [
          r`It requires all time series to be strictly stationary`,
          r`It scatters future time steps into training folds, enabling the model to predict past events using future knowledge`,
          r`It can only be computed if the series contains exactly 100 observations`,
          r`It converts continuous numerical series into discrete categories`,
        ],
        a: 1,
        why: r`Shuffling destroys chronological ordering, allowing future observations to appear in the training fold when predicting past validation points (temporal lookahead leakage).`,
      },
      {
        q: r`Under what condition is a rolling fixed-width window preferred over an expanding window in time-series cross-validation?`,
        o: [
          r`When the process is strictly stationary with zero trend`,
          r`When underlying data-generating dynamics experience structural regime shifts or drift, making distant historical data counterproductive`,
          r`When the dataset has fewer than 10 total time steps`,
          r`When the forecast horizon H is equal to 1`,
        ],
        a: 1,
        why: r`Rolling windows discard older observations past a fixed duration W, preventing outdated historical relationships from distorting current predictions when regimes shift.`,
      },
      {
        q: r`Why is evaluating a forecasting model across multiple walk-forward origins superior to evaluating on a single fixed train/test split?`,
        o: [
          r`It guarantees that the training loss equals zero on all folds`,
          r`It tests model resilience across varying economic cycles, seasonality phases, and volatility conditions, lowering evaluation variance`,
          r`It removes the need to clean or validate the dataset`,
          r`It allows the model to predict without input features`,
        ],
        a: 1,
        why: r`A single test split might coincide with an unrepresentative period (such as an unusual promotion or supply chain disruption). Averaging across multiple origins yields a far more reliable generalisation metric.`,
      },
    ],
    usedBy: [],
    prereq: ['train-validation-test-splits-group-and-time-based', 'forecast-metrics-mae-mase-smape-wape'],
    related: ['global-vs-local-models-gradient-boosting-for-forecasting', 'lag-and-rolling-window-features', 'data-leakage'],
    keywords: 'time series cross validation walk forward rolling origin expanding window backtesting time series split purges embargo',
  },
  {
    id: 'global-vs-local-models-gradient-boosting-for-forecasting',
    short: 'Global vs local forecasting',
    title: 'Global vs Local Models: Gradient Boosting for Forecasting',
    task: 'concepts',
    module: 'Forecasting at scale',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Comparing individual per-series models against pooled tabular gradient boosters that learn shared cross-series representations across millions of time series.`,
    lead: r`Classical forecasting fits an independent model (such as ARIMA or ETS) to every individual series. While effective for isolated macroeconomic indicators, this local approach breaks down when managing thousands of retail products with short, noisy histories. Modern global forecasting trains a single machine learning model across all pooled time series simultaneously, cross-learning shared temporal dynamics, calendar events, and cross-sectional features.`,
    intuition: [
      r`Imagine a nationwide retailer managing 100,000 product-store combinations. A traditional local modelling strategy fits 100,000 independent ARIMA or exponential smoothing models every week. For a newly launched product with only three weeks of sales history, a local model fails completely because three data points are insufficient to estimate seasonal orders or trend parameters. If thousands of independent models fail to converge or require manual parameter tuning, maintaining the fleet becomes an operational impossibility.`,
      r`A global model restructures the forecasting challenge into a large tabular regression problem. All 100,000 time series are stacked into a unified dataset where each row corresponds to a specific product, store, and timestamp. Features include historical lags, rolling statistics, calendar flags (day of week, month, holidays), and static entity attributes (category, store size, price tier). A single gradient boosted decision tree (such as LightGBM or XGBoost) is trained across all pooled records.`,
      r`The global model cross-learns relationships across series: it discovers that discount promotions increase unit sales by 40% across all snack categories, and that sales dip on rainy Mondays across suburban stores. Because the model learns the structural mapping from features to demand, it can forecast a brand-new product on its very first day of sale by relying on its category, price, and store attributes. While local models remain ideal for isolated, high-frequency series with unique dynamics (like regional electrical grid load), global tree ensembles dominate large-scale retail competitions like the M5.`,
    ],
    analogy: r`A specialist doctor who has treated 10,000 diverse patients (global model) diagnosing a new patient instantly, versus a doctor who has only ever monitored one patient for a decade (local model).`,
    steps: [
      r`Unpivot panel data to long tabular structure: stack all series into rows containing series ID, timestamp, and target values.`,
      r`Engineer temporal and metadata features: construct causal lag features, rolling summary statistics, calendar flags, and static entity properties.`,
      r`Normalise series to handle scale heterogeneity: scale each series by its historical mean volume or train on log-transformed targets.`,
      r`Train unified gradient boosting ensemble: fit LightGBM, CatBoost, or XGBoost minimising Huber or MAE loss across all pooled rows.`,
      r`Benchmark against local baselines: compare the global model against naive persistence and local exponential smoothing baselines on holdout horizons.`,
    ],
    math: [
      {
        h: 'Local independent model formulation',
        tex: r`\hat{y}_{i, t+h} = f_i\left(y_{i, 1:t}; \boldsymbol{\theta}_i\right), \qquad \boldsymbol{\theta}_i = \arg\min_{\boldsymbol{\theta}} \sum_{s=1}^t L\left(y_{i, s}, f_i(y_{i, 1:s-1}; \boldsymbol{\theta})\right)`,
        p: r`Where an independent parameter vector $\boldsymbol{\theta}_i$ is estimated separately for each series $i \in \{1, \dots, N\}$. Parameters cannot be shared or transferred across series.`,
      },
      {
        h: 'Global pooled model formulation',
        tex: r`\hat{y}_{i, t+h} = F\left(\mathbf{x}_{i, t}, \mathbf{z}_i; \boldsymbol{\Theta}\right), \qquad \boldsymbol{\Theta} = \arg\min_{\boldsymbol{\Theta}} \sum_{i=1}^N \sum_{s=1}^{T_i} L\left(y_{i, s}, F(\mathbf{x}_{i, s-1}, \mathbf{z}_i; \boldsymbol{\Theta})\right)`,
        p: r`Where $\mathbf{x}_{i, t}$ represents dynamic temporal features (lags, rolling stats), $\mathbf{z}_i$ represents static entity metadata, and parameter vector $\boldsymbol{\Theta}$ is shared across all $N$ series simultaneously.`,
      },
      {
        h: 'Normalised scaling for global pooling',
        tex: r`\tilde{y}_{i, t} = \frac{y_{i, t}}{s_i}, \qquad s_i = \frac{1}{T_i} \sum_{t=1}^{T_i} y_{i, t} + \epsilon`,
        p: r`Dividing each series by its historical scale factor $s_i$ standardises target magnitudes across disparate products, preventing high-volume products from dominating gradient updates.`,
      },
    ],
    keyPoints: [
      r`Global models train a single estimator across thousands of pooled series, cross-learning shared patterns across items.`,
      r`Global approaches naturally solve the cold-start problem by forecasting newly introduced products using static metadata attributes.`,
      r`Scale normalisation is essential: without standardisation, high-volume series dictate tree split criteria at the expense of smaller series.`,
    ],
    pitfalls: [
      r`Failing to normalise target scales across series: high-volume series dominate tree splits, causing poor predictions on low-volume items.`,
      r`Cross-series leakage in rolling features: computing rolling averages without grouping by series ID, accidentally blending unrelated series together.`,
      r`Overfitting on high-cardinality raw series IDs: treating series ID as an unregularised categorical feature causes trees to memorise individual historical trajectories.`,
    ],
    code: r`import numpy as np

np.random.seed(42)
n_series, time_steps = 4, 30
scales = [10.0, 50.0, 100.0, 500.0]
season = np.sin(2 * np.pi * np.arange(time_steps) / 7.0)

all_series = []
for s in scales:
    noise = np.random.normal(0, 0.05, size=time_steps)
    all_series.append(s * (1.0 + 0.3 * season + noise))

train_len, horizon = 24, 6
# 1. Local models: independent linear trend fitted per series
local_maes = []
for i in range(n_series):
    s_tr = all_series[i][:train_len]
    s_te = all_series[i][train_len:]
    slope, intercept = np.polyfit(np.arange(train_len), s_tr, 1)
    pred_local = slope * np.arange(train_len, train_len + horizon) + intercept
    local_maes.append(np.mean(np.abs(s_te - pred_local)))

# 2. Global model: pooled regression across series normalised by training mean
X_pool, y_pool = [], []
for i in range(n_series):
    s_tr = all_series[i][:train_len]
    scale_i = np.mean(s_tr)
    norm_tr = s_tr / scale_i
    for t_idx in range(7, train_len):
        X_pool.append([norm_tr[t_idx-1], norm_tr[t_idx-7]])
        y_pool.append(norm_tr[t_idx])

X_pool, y_pool = np.array(X_pool), np.array(y_pool)
w = np.linalg.lstsq(X_pool, y_pool, rcond=None)[0]

global_maes = []
for i in range(n_series):
    s_tr = all_series[i][:train_len]
    s_te = all_series[i][train_len:]
    scale_i = np.mean(s_tr)
    norm_tr = list(s_tr / scale_i)
    preds_norm = []
    for h in range(horizon):
        pred_val = w[0] * norm_tr[-1] + w[1] * norm_tr[-7]
        norm_tr.append(pred_val)
        preds_norm.append(pred_val)
    pred_global = np.array(preds_norm) * scale_i
    global_maes.append(np.mean(np.abs(s_te - pred_global)))

print(f"Local models mean test MAE across series:  {np.mean(local_maes):.2f}")
print(f"Global model mean test MAE across series: {np.mean(global_maes):.2f}")`,
    quiz: [
      {
        q: r`What is the primary operational advantage of a global forecasting model over thousands of local ARIMA models in large-scale retail?`,
        o: [
          r`Global models can only forecast one day ahead`,
          r`A single global model learns shared patterns across all series, requires maintaining only one training pipeline, and can forecast cold-start items`,
          r`Global models never require feature engineering`,
          r`Global models guarantee that forecast errors are strictly zero`,
        ],
        a: 1,
        why: r`Global models pool observations across all products and stores, learning general promotional and seasonal dynamics while dramatically simplifying pipeline maintenance compared to managing 100,000 separate models.`,
      },
      {
        q: r`Why is target scale normalisation crucial when pooling disparate time series into a global gradient boosting model?`,
        o: [
          r`Because decision trees can only split on numbers between 0 and 1`,
          r`To prevent high-volume series from dominating loss gradients and tree split points at the expense of lower-volume series`,
          r`To convert all time series into categorical text strings`,
          r`Because scikit-learn models crash if targets exceed 1,000 units`,
        ],
        a: 1,
        why: r`If one series sells 50,000 units and another sells 20 units, absolute errors on the large series will overwhelm tree loss functions unless targets are normalised or log-transformed.`,
      },
      {
        q: r`In which scenario is an independent local forecasting model typically preferred over a global pooled model?`,
        o: [
          r`When forecasting 50,000 retail SKUs with high product turnover and short sales histories`,
          r`When forecasting a single, long, high-frequency time series with unique physical properties (such as electrical grid frequency) and no related series`,
          r`When introducing a brand-new product with zero historical sales records`,
          r`When all series have identical mean volume and identical seasonality`,
        ],
        a: 1,
        why: r`When a single series has abundant history and highly specialised physical dynamics with no related series to learn from, a bespoke local model avoids negative transfer from irrelevant external data.`,
      },
    ],
    usedBy: [],
    prereq: ['time-series-cross-validation', 'forecast-metrics-mae-mase-smape-wape'],
    related: ['lag-and-rolling-window-features', 'encoding-categoricals-one-hot-ordinal-target-woe', 'train-validation-test-splits-group-and-time-based'],
    keywords: 'global forecasting local forecasting gradient boosting lightgbm arima panel data cross series learning m5 competition',
  },
  {
  "id": "hierarchical-forecasting-and-reconciliation",
  "short": "Hierarchical forecasting",
  "title": "Hierarchical Forecasting and Coherent Reconciliation: Bottom-Up, Top-Down, and MinT",
  "task": "concepts",
  "level": 3,
  "minutes": 18,
  "noLab": true,
  "summary": "Ensuring structural consistency across nested aggregation levels (SKU, store, region, national) using optimal linear reconciliation (MinT).",
  "lead": "In enterprise demand planning and retail supply chains, time series naturally form hierarchies: individual SKU sales roll up into product categories, store sales roll up into regional markets, and regional markets sum to national revenue. Generating independent forecasts at each level produces incoherent numbers where store-level forecasts do not add up to regional predictions. Hierarchical reconciliation mathematically aligns predictions across the entire tree, guaranteeing coherence while improving overall accuracy.",
  "analogy": "Imagine a corporate budget spreadsheet. Department managers create their own expense forecasts, while the regional director forecasts the total regional expenditure. If the individual department line items sum to £12M but the regional director's model forecasts £10M, the finance department cannot balance the books. Reconciliation is an optimal arbitration mechanism that adjusts all numbers simultaneously so that every sub-branch adds up cleanly to its parent total while respecting which forecasts are historically most reliable.",
  "intuition": [
    "A hierarchical time series consists of $m$ series at different levels of aggregation, linked by a summing matrix $\\mathbf{S} \\in \\{0, 1\\}^{m \\times m_b}$, where $m_b$ is the number of bottom-level series. The relationship $\\mathbf{y}_t = \\mathbf{S} \\mathbf{b}_t$ must hold at all times.",
    "Traditional heuristic reconciliation methods include Bottom-Up (forecast only the bottom level and aggregate upwards) and Top-Down (forecast the top series and disaggregate using historical proportions). Bottom-up suffers when bottom series are noisy and sparse; top-down loses sub-category dynamics and product-level seasonality.",
    "Middle-Out blends both by forecasting an intermediate level and projecting both up and down, but remains suboptimal because it ignores correlations between series.",
    "Optimal reconciliation (Hyndman et al., MinT - Minimum Trace) treats reconciliation as a generalised least squares problem. Unreconciled base forecasts $\\hat{\\mathbf{y}}$ are mapped to coherent forecasts $\\tilde{\\mathbf{y}} = \\mathbf{S} \\mathbf{P} \\hat{\\mathbf{y}}$, where the projection matrix $\\mathbf{P} = (\\mathbf{S}^T \\mathbf{W}^{-1} \\mathbf{S})^{-1} \\mathbf{S}^T \\mathbf{W}^{-1}$ minimises the total forecast error variance across the hierarchy using the base forecast error covariance matrix $\\mathbf{W}$."
  ],
  "steps": [
    "Define hierarchy structure: Construct the structural summing matrix $\\mathbf{S}$ encoding parent-child aggregation relationships across all tiers.",
    "Fit base forecasting models: Independently train optimal time series models (ARIMA, LightGBM, Exponential Smoothing) for every series at every level.",
    "Compute base forecast residuals: Evaluate in-sample or cross-validation residuals to estimate the base error covariance matrix $\\mathbf{W}$.",
    "Select covariance approximation: Use sample covariance, diagonal shrinkage, or structural variance scaling if series count $m$ is large.",
    "Compute optimal projection: Calculate reconciliation projection matrix $\\mathbf{P}$ and multiply base forecasts $\\hat{\\mathbf{y}}_h$ to obtain coherent forecasts $\\tilde{\\mathbf{y}}_h = \\mathbf{S} \\mathbf{P} \\hat{\\mathbf{y}}_h$."
  ],
  "math": [
    {
      "h": "Structural Summing Matrix Equality",
      "tex": "\\mathbf{y}_t = \\begin{bmatrix} \\mathbf{u}_t \\\\ \\mathbf{b}_t \\end{bmatrix} = \\mathbf{S} \\mathbf{b}_t, \\quad \\mathbf{S} = \\begin{bmatrix} \\mathbf{A} \\\\ \\mathbf{I}_{m_b} \\end{bmatrix}",
      "p": "The structural summing matrix $\\mathbf{S}$ maps $m_b$ bottom-level series $\\mathbf{b}_t$ to all $m$ series in the hierarchy, where $\\mathbf{A}$ contains aggregation weights."
    },
    {
      "h": "Linear Reconciliation Representation",
      "tex": "\\tilde{\\mathbf{y}}_h = \\mathbf{S} \\mathbf{P} \\hat{\\mathbf{y}}_h, \\quad \\mathbf{P} \\in \\mathbb{R}^{m_b \\times m}",
      "p": "Coherent forecasts $\\tilde{\\mathbf{y}}_h$ are guaranteed to add up because they are formed as a linear combination of base forecasts mapped through summing matrix $\\mathbf{S}$."
    },
    {
      "h": "MinT (Minimum Trace) Optimal Solution",
      "tex": "\\mathbf{P}_{\\mathrm{MinT}} = (\\mathbf{S}^T \\mathbf{W}^{-1} \\mathbf{S})^{-1} \\mathbf{S}^T \\mathbf{W}^{-1}",
      "p": "MinT provides the unique unbiased linear projection that minimises the trace of the reconciled error covariance matrix $\\operatorname{Tr}[\\operatorname{Var}(\\mathbf{y} - \\tilde{\\mathbf{y}})]$, where $\\mathbf{W} = \\operatorname{Var}(\\mathbf{y} - \\hat{\\mathbf{y}})$."
    }
  ],
  "code": "import numpy as np\n\n# Consider a 2-level hierarchy: Total (T) = Store A (A) + Store B (B)\n# Number of total series m = 3, bottom series m_b = 2\n# Summing matrix S: [T; A; B] = S * [A; B]\nS = np.array([\n    [1.0, 1.0],  # Total = A + B\n    [1.0, 0.0],  # A = A\n    [0.0, 1.0]   # B = B\n])\n\n# Base independent forecasts from separate models (incoherent! 80 + 45 = 125 != 130)\ny_hat = np.array([130.0, 80.0, 45.0])\n\n# Estimate base error covariance matrix W (assuming diagonal variance for simplicity)\n# Total has variance 20, A has variance 10, B has variance 15\nW = np.diag([20.0, 10.0, 15.0])\nW_inv = np.linalg.inv(W)\n\n# Compute MinT projection matrix: P = (S^T W^-1 S)^-1 S^T W^-1\nSt_Winv = S.T @ W_inv\nP_mint = np.linalg.inv(St_Winv @ S) @ St_Winv\n\n# Reconcile forecasts: y_tilde = S @ P @ y_hat\ny_tilde = S @ P_mint @ y_hat\n\nprint(\"Base forecasts (Incoherent): Total=%.1f, A=%.1f, B=%.1f (Sum=%.1f)\" % \n      (y_hat[0], y_hat[1], y_hat[2], y_hat[1] + y_hat[2]))\nprint(\"Reconciled forecasts (Coherent): Total=%.2f, A=%.2f, B=%.2f (Sum=%.2f)\" % \n      (y_tilde[0], y_tilde[1], y_tilde[2], y_tilde[1] + y_tilde[2]))\n# Notice the reconciled forecasts satisfy Total = A + B exactly!",
  "keyPoints": [
    "Hierarchical reconciliation ensures forecasts across all levels of aggregation add up consistently.",
    "Base independent forecasts are almost always incoherent due to individual model estimation noise.",
    "MinT uses generalised least squares to find the optimal unbiased coherent projection that minimises error variance.",
    "Reconciliation consistently improves forecast accuracy compared to isolated single-level forecasts by sharing cross-hierarchy information."
  ],
  "pitfalls": [
    "Singular covariance matrix: When $m > n$ (more series than time observations), the sample covariance matrix $\\mathbf{W}$ is non-invertible; use diagonal shrinkage.",
    "Negative reconciled forecasts: Linear projection can occasionally yield small negative numbers for bottom-level series with near-zero demand; apply non-negative quadratic programming.",
    "Ignoring cross-level correlations: Using simple Ordinary Least Squares (OLS) reconciliation assumes all base forecasts have equal variance, which is false since top aggregates have vastly different scales."
  ],
  "quiz": [
    {
      "q": "Why are base forecasts generated independently at different hierarchical levels almost never coherent?",
      "o": [
        "Different levels use different date formats",
        "Independent models minimise loss on their own series without knowledge of the aggregation summing constraint $\\mathbf{y} = \\mathbf{S}\\mathbf{b}$",
        "Computers introduce floating point non-linearity",
        "Time series models cannot handle integers"
      ],
      "a": 1,
      "why": "Base models optimise isolated loss functions without imposing structural equality constraints, causing aggregate sums to deviate from parent predictions."
    },
    {
      "q": "What is the key advantage of MinT (Minimum Trace) over simple Bottom-Up forecasting?",
      "o": [
        "It eliminates the need to collect historical data",
        "It incorporates signals from top and intermediate series while weighting series by their forecast reliability",
        "It guarantees integer forecasts for inventory counts",
        "It works without linear algebra matrix inversion"
      ],
      "a": 1,
      "why": "Bottom-up discards all top-level signals and magnifies noisy bottom series. MinT combines information from all levels, weighting them by their inverse covariance."
    },
    {
      "q": "What role does the summing matrix $\\mathbf{S}$ play in hierarchical forecasting?",
      "o": [
        "It computes the cross-entropy loss between training batches",
        "It mathematically defines how bottom-level series aggregate to form higher-level parent series",
        "It stores the hyperparameters of the neural network",
        "It scales features to zero mean and unit variance"
      ],
      "a": 1,
      "why": "The summing matrix $\\mathbf{S} \\in \\{0, 1\\}^{m \\times m_b}$ maps bottom series to all aggregated series such that $\\mathbf{y} = \\mathbf{S}\\mathbf{b}$."
    }
  ],
  "related": [
    "forecast-metrics-mae-mase-smape-wape",
    "global-vs-local-models-gradient-boosting-for-forecasting",
    "time-series-cross-validation"
  ],
  "keywords": "hierarchical forecasting, reconciliation, mint, minimum trace, bottom up, top down, summing matrix, coherent forecasting, demand planning",
  "usedBy": []
},
  {
  "id": "intermittent-demand-croston-and-tsb",
  "short": "Intermittent demand & Croston",
  "title": "Intermittent Demand Forecasting: Croston's Method and TSB Formulation",
  "task": "concepts",
  "level": 2,
  "minutes": 15,
  "noLab": true,
  "summary": "Forecasting sporadic and lumpy demand (spare parts, rare equipment) by decomposing series into non-zero demand size and inter-arrival intervals.",
  "lead": "Standard forecasting methods such as ARIMA and exponential smoothing assume demand occurs continuously at every time period. When applied to intermittent or \"lumpy\" demand (such as aircraft spare parts, high-end enterprise hardware, or specialised medical equipment), continuous models predict fractional demands (e.g. 0.08 units every day), resulting in severe inventory distortion, phantom holding costs, and frequent stockouts.",
  "analogy": "Imagine managing emergency heart defibrillators for a hospital. The hospital does not order 0.05 defibrillators every morning; rather, zero units are ordered for six months, and then suddenly five units are ordered at once when a new wing opens. Croston's method tracks two separate clocks: how long between orders, and how many units are bought when an order finally arrives.",
  "intuition": [
    "Intermittent time series are characterised by long sequences of zero values interspersed with occasional positive transactions. Syntetos and Boylan classify demand into four quadrants based on average inter-demand interval ($p$) and squared coefficient of variation ($CV^2$): Smooth, Intermittent, Erratic, and Lumpy.",
    "Croston (1972) proposed decomposing the series into two separate processes: non-zero demand size $z_t$ and inter-arrival time $p_t$ (the number of periods between consecutive orders).",
    "Whenever non-zero demand occurs, both components are updated using single exponential smoothing. When demand is zero, both state variables remain completely unchanged. The forecast per period is the ratio $\\hat{y} = z_t / p_t$.",
    "However, Croston's formulation is positively biased. Syntetos-Boylan Approximation (SBA) applies a multiplicative shrinkage factor $(1 - \\alpha/2)$ to correct this bias. Furthermore, the Teunter-Syntetos-Babai (TSB) method updates demand probability at every single period (even when demand is zero), allowing the model to quickly detect product obsolescence or sudden end-of-life drops."
  ],
  "steps": [
    "Classify demand lumpiness: Calculate average inter-arrival interval $p$ and demand size squared coefficient of variation $CV^2$ to confirm intermittent classification.",
    "Decompose series: Separate the historical series into non-zero transaction magnitudes $z_k$ and elapsed periods between transactions $p_k$.",
    "Apply conditional exponential smoothing: Update magnitude state $z_t$ and interval state $p_t$ strictly when demand occurs.",
    "Apply SBA bias correction: Multiply the estimated demand rate by $(1 - \\alpha_p / 2)$ to eliminate positive estimation bias.",
    "Or apply TSB formulation: Update demand probability $p_t$ on every time step using smoothing parameter $\\beta$ and demand size $z_t$ on non-zero steps using $\\alpha$."
  ],
  "math": [
    {
      "h": "Croston Conditional State Updates",
      "tex": "y_t > 0 \\implies \\begin{cases} z_t = \\alpha y_t + (1 - \\alpha) z_{t-1} \\\\ p_t = \\alpha q_t + (1 - \\alpha) p_{t-1} \\end{cases}, \\quad y_t = 0 \\implies \\begin{cases} z_t = z_{t-1} \\\\ p_t = p_{t-1} \\end{cases}",
      "p": "Demand size $z_t$ and elapsed periods $q_t$ are updated only on positive demand occurrences; states remain frozen during zero periods."
    },
    {
      "h": "Syntetos-Boylan Approximation (SBA) Debiaising",
      "tex": "\\hat{y}_{t+1} = \\left( 1 - \\frac{\\alpha}{2} \\right) \\frac{z_t}{p_t}",
      "p": "Corrects for the positive bias inherent in the expectation of the reciprocal ratio $\\mathbb{E}[z/p] \\ne \\mathbb{E}[z]/\\mathbb{E}[p]$."
    },
    {
      "h": "Teunter-Syntetos-Babai (TSB) Obsolescence Update",
      "tex": "d_t = \\begin{cases} 1 & \\text{if } y_t > 0 \\\\ 0 & \\text{if } y_t = 0 \\end{cases}, \\quad p_t = \\beta d_t + (1 - \\beta) p_{t-1}, \\quad \\hat{y}_{t+1} = p_t \\cdot z_t",
      "p": "TSB updates demand probability $p_t$ every period, allowing the forecast to decay to zero when a product becomes obsolete."
    }
  ],
  "code": "import numpy as np\n\ndef croston_sba(series: np.ndarray, alpha: float = 0.1) -> np.ndarray:\n    \"\"\"Croston method with Syntetos-Boylan Approximation (SBA) bias correction.\"\"\"\n    n = len(series)\n    forecast = np.zeros(n)\n    \n    # Initialise states with first positive demand\n    first_idx = np.where(series > 0)[0][0]\n    z = float(series[first_idx])\n    p = 1.0\n    q = 1  # Inter-arrival counter\n    \n    for t in range(first_idx + 1, n):\n        q += 1\n        if series[t] > 0:\n            z = alpha * series[t] + (1 - alpha) * z\n            p = alpha * q + (1 - alpha) * p\n            q = 0  # Reset counter\n        # SBA forecast rate per period\n        forecast[t] = (1.0 - alpha / 2.0) * (z / p)\n        \n    return forecast\n\n# Intermittent spare parts demand (mostly zeros with sporadic spikes)\nnp.random.seed(42)\ndemand = np.array([0, 0, 4, 0, 0, 0, 0, 6, 0, 0, 0, 5, 0, 0, 0, 0, 0, 7, 0, 0])\nsba_forecast = croston_sba(demand, alpha=0.15)\n\nprint(\"Observed demand:   \", demand[-6:])\nprint(\"SBA rate forecast: \", np.round(sba_forecast[-6:], 3))\n# Notice smooth, realistic continuous rate (~0.8 to 1.1 units/period) rather than noisy swings",
  "keyPoints": [
    "Intermittent demand features long zero sequences separated by occasional non-zero orders.",
    "Standard ARIMA/ETS models create severe stockout risks by producing noisy fractional estimates.",
    "Croston decomposes demand into demand size and inter-demand arrival intervals.",
    "TSB updates demand probability every period, making it capable of detecting product obsolescence."
  ],
  "pitfalls": [
    "Evaluating with MAPE: Mean Absolute Percentage Error divides by actual demand; when actual demand is 0, MAPE produces division by zero.",
    "Using unadjusted Croston: The standard Croston ratio $\\hat{z}/\\hat{p}$ suffers from systematic positive bias; always apply the SBA correction.",
    "Failing to recognize obsolescence in Croston: If demand ceases permanently, Croston's states freeze forever, maintaining a positive forecast indefinitely."
  ],
  "quiz": [
    {
      "q": "Why does Mean Absolute Percentage Error (MAPE) fail when evaluating intermittent demand forecasts?",
      "o": [
        "It cannot be computed for non-linear models",
        "It involves division by actual demand $y_t$, which yields division by zero whenever demand is zero",
        "It produces negative error values",
        "It penalises large forecasts more than small forecasts"
      ],
      "a": 1,
      "why": "In intermittent demand, the majority of time steps have $y_t = 0$. Dividing by zero renders MAPE undefined or infinite."
    },
    {
      "q": "What critical flaw in classical Croston does the Teunter-Syntetos-Babai (TSB) formulation solve?",
      "o": [
        "Croston cannot handle negative values",
        "Croston freezes state updates during zero periods, failing to detect when a product becomes obsolete",
        "Croston requires GPU acceleration",
        "Croston requires stationary Gaussian errors"
      ],
      "a": 1,
      "why": "Because Croston updates only when $y_t > 0$, if a product is discontinued, the forecast remains positively frozen forever. TSB updates demand probability on zeros, decaying to zero."
    },
    {
      "q": "What is the purpose of the Syntetos-Boylan Approximation (SBA) correction factor $(1 - \\alpha/2)$?",
      "o": [
        "It normalises the forecast to sum to 100%",
        "It corrects the mathematical positive bias arising from the expected value of a reciprocal ratio $\\mathbb{E}[z/p]$",
        "It multiplies forecasts by the annual inflation rate",
        "It forces all forecasts to be integer values"
      ],
      "a": 1,
      "why": "Because $\\mathbb{E}[1/p] > 1/\\mathbb{E}[p]$ by Jensen's inequality, the standard Croston ratio overestimates demand. SBA applies $(1 - \\alpha/2)$ to debias the estimate."
    }
  ],
  "related": [
    "forecast-metrics-mae-mase-smape-wape",
    "time-series-cross-validation",
    "global-vs-local-models-gradient-boosting-for-forecasting"
  ],
  "keywords": "intermittent demand, croston method, tsb, syntetos boylan approximation, sporadic demand, inventory forecasting, spare parts, lumpy demand",
  "usedBy": []
},
  {
  "id": "prophet-and-trend-seasonality-decomposition",
  "short": "Prophet & decomposition",
  "title": "Prophet and Trend-Seasonality Decomposition: Generalised Additive Models for Time Series",
  "task": "concepts",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Decomposing business time series into piecewise linear trends, Fourier seasonality, and holiday regressors using modular Bayesian GAMs.",
  "lead": "Classical ARIMA models require stationary transformations, differencing, and strict uniform temporal intervals. In contrast, real-world business time series exhibit multiple nested seasonal patterns (day of week, month of year), structural trend changepoints, missing observations, and dramatic holiday shifts. Prophet frames forecasting as a curve-fitting problem using a generalised additive model (GAM), providing robust automated decomposition with intuitive parameters.",
  "analogy": "Imagine tuning a musical synthesizer. Rather than trying to describe the combined sound wave with a single complex recurrence equation, the synthesizer decomposes the sound into a low-frequency bassline (trend), repetitive harmonic oscillators (daily and weekly Fourier cycles), and occasional drum hits (holidays). Tuning the sound simply involves adjusting the volume and tempo of each independent track.",
  "intuition": [
    "Prophet (developed by Taylor and Letham at Meta) models a time series as an additive decomposition: $y(t) = g(t) + s(t) + h(t) + \\epsilon_t$, where $g(t)$ is trend, $s(t)$ is periodic seasonality, $h(t)$ models holiday effects, and $\\epsilon_t$ is normally distributed error.",
    "The trend $g(t)$ is modelled as a continuous piecewise linear or logistic growth curve with automatic changepoints. A sparse Laplace prior on changepoint rate adjustments $\\delta_j$ acts like L1 regularisation, allowing the model to fit flexible curves while avoiding overfitting to short-term noise.",
    "Seasonality $s(t)$ is modelled using truncated Fourier series: $\\sum [a_n \\cos(2\\pi n t / P) + b_n \\sin(2\\pi n t / P)]$. Using Fourier series allows the model to handle multi-period seasonality (e.g. weekly $P=7$ and yearly $P=365.25$) simultaneously without requiring regular integer spacing or differencing.",
    "Holiday effects $h(t)$ are modelled using indicator matrices that assign separate parameters to user-specified dates, accommodating windows around holidays (e.g. Christmas Eve through Boxing Day). Because it frames forecasting as regression rather than autoregression, Prophet handles missing data seamlessly without imputation."
  ],
  "steps": [
    "Format input data: Prepare a two-column dataframe with timestamp `ds` (ISO date) and target `y` (continuous metric).",
    "Configure trend model: Select linear or logistic growth (defining capacity `cap` if upper saturation boundaries exist).",
    "Tune changepoint flexibility: Adjust `changepoint_prior_scale` (higher values allow rapid trend shifts; lower values enforce stiff linear trends).",
    "Configure multi-scale seasonality: Enable daily, weekly, or yearly seasonality and adjust Fourier order (higher orders capture sharper cyclical peaks).",
    "Incorporate holiday calendars: Add predefined country holidays and custom event indicators with dedicated prior scales.",
    "Generate future predictions: Extrapolate future timestamps and sample uncertainty intervals via Monte Carlo simulation of future trend changepoints."
  ],
  "math": [
    {
      "h": "Additive Time Series Decomposition Formulation",
      "tex": "y(t) = g(t) + s(t) + h(t) + \\epsilon_t, \\quad \\epsilon_t \\sim \\mathcal{N}(0, \\sigma^2)",
      "p": "The observed series is decomposed into trend $g(t)$, seasonal component $s(t)$, holiday effects $h(t)$, and Gaussian noise $\\epsilon_t$."
    },
    {
      "h": "Piecewise Linear Trend with Changepoints",
      "tex": "g(t) = \\left( k + \\mathbf{a}(t)^T \\boldsymbol{\\delta} \\right) t + \\left( m + \\mathbf{a}(t)^T \\boldsymbol{\\gamma} \\right), \\quad \\delta_j \\sim \\mathrm{Laplace}(0, \\tau)",
      "p": "Trend slope changes by $\\delta_j$ at changepoints $s_j$, where vector $\\mathbf{a}(t)$ indicates active changepoints and $\\gamma_j = -s_j \\delta_j$ ensures continuity."
    },
    {
      "h": "Fourier Series Seasonality Representation",
      "tex": "s(t) = \\sum_{n=1}^N \\left( a_n \\cos\\left(\\frac{2\\pi n t}{P}\\right) + b_n \\sin\\left(\\frac{2\\pi n t}{P}\\right) \\right)",
      "p": "Captures arbitrary periodic seasonality with period $P$ using $2N$ Fourier basis coefficients estimated via linear regression."
    }
  ],
  "code": "import numpy as np\nimport pandas as pd\n\n# Minimal implementation of Prophet's Fourier seasonality regression\ndef build_fourier_basis(dates: pd.Series, period: float, order: int) -> np.ndarray:\n    \"\"\"Construct Fourier sin/cos columns for arbitrary period P and order N.\"\"\"\n    t = (dates - dates.min()).dt.total_seconds() / 86400.0  # Elapsed days\n    basis = []\n    for n in range(1, order + 1):\n        basis.append(np.sin(2.0 * np.pi * n * t / period))\n        basis.append(np.cos(2.0 * np.pi * n * t / period))\n    return np.column_stack(basis)\n\n# Generate synthetic daily data with trend and weekly seasonality\nnp.random.seed(42)\ndate_range = pd.date_range('2026-01-01', periods=120, freq='D')\nt_days = np.arange(len(date_range))\ntrue_trend = 100.0 + 0.5 * t_days\ntrue_season = 15.0 * np.sin(2.0 * np.pi * t_days / 7.0)\ny = true_trend + true_season + np.random.normal(0, 2.0, len(date_range))\n\n# Build design matrix: Intercept + Linear Trend + Fourier Order 3 Weekly (P=7)\nX_fourier = build_fourier_basis(pd.Series(date_range), period=7.0, order=3)\nX = np.column_stack([np.ones(len(t_days)), t_days, X_fourier])\n\n# Fit via Ridge regression\nweights = np.linalg.solve(X.T @ X + 1e-3 * np.eye(X.shape[1]), X.T @ y)\ny_pred = X @ weights\n\nprint(\"Learned baseline intercept:\", round(weights[0], 2))\nprint(\"Learned linear trend slope:\", round(weights[1], 2))\nprint(\"Mean Absolute Error:       \", round(float(np.mean(np.abs(y - y_pred))), 3))",
  "keyPoints": [
    "Prophet models time series using a modular Generalised Additive Model (GAM) decomposed into trend, seasonality, and holidays.",
    "Piecewise linear trends use automatic changepoints regularised by a sparse Laplace prior.",
    "Seasonality is flexibly represented using Fourier series, allowing multiple overlapping cycles (weekly and yearly).",
    "Robust against missing data, non-uniform timestamp intervals, and large holiday shifts without imputation."
  ],
  "pitfalls": [
    "Over-extrapolating recent trend shifts: If `changepoint_prior_scale` is set too high, the model overfits temporary dips, projecting unrealistic downward slopes into the future.",
    "Ignoring multiplicative effects: For series where seasonal swings grow proportionally with revenue volume, using additive decomposition produces severe underestimation; set `seasonality_mode=\"multiplicative\"`.",
    "Autocorrelation neglect: Because Prophet treats observations as independent conditional on components, confidence intervals do not account for residual autocorrelation, often being narrower than reality."
  ],
  "quiz": [
    {
      "q": "How does Prophet model complex periodic seasonality such as day-of-week and day-of-year cycles?",
      "o": [
        "Using recurrent LSTM neural network layers",
        "Using truncated Fourier series expansions with configurable orders",
        "Using k-nearest neighbour spatial lookups",
        "Using recursive box-cox transformations"
      ],
      "a": 1,
      "why": "Prophet approximates arbitrary periodic seasonal cycles using linear combinations of sine and cosine Fourier terms."
    },
    {
      "q": "What is the role of the Laplace prior on trend changepoints $\\delta_j$ in Prophet?",
      "o": [
        "It acts like L1 regularisation (Lasso), encouraging most changepoints to be exactly zero while allowing a few significant shifts",
        "It forces the trend slope to remain strictly positive",
        "It ensures all predicted values are integers",
        "It eliminates holiday anomalies automatically"
      ],
      "a": 0,
      "why": "The Laplace prior places strong probability mass at zero, acting like L1 regularisation to keep the trend smooth and prevent overfitting to noise."
    },
    {
      "q": "When should an analyst configure `seasonality_mode=\"multiplicative\"` instead of the default additive mode?",
      "o": [
        "When the dataset contains negative values",
        "When the magnitude of seasonal swings expands proportionally as the overall baseline trend grows",
        "When the time series contains only 5 observations",
        "When predicting binary classification probabilities"
      ],
      "a": 1,
      "why": "In many businesses, seasonal spikes represent a percentage of baseline volume (e.g. +20% at Christmas). As sales grow from 1,000 to 10,000, seasonal swings expand from 200 to 2,000, which requires multiplicative decomposition."
    }
  ],
  "related": [
    "lag-and-rolling-window-features",
    "forecast-metrics-mae-mase-smape-wape",
    "time-series-cross-validation"
  ],
  "keywords": "prophet, generalised additive models, trend decomposition, fourier seasonality, changepoints, additive seasonality, multiplicative seasonality, time series",
  "usedBy": []
},
  {
  "id": "probabilistic-forecasts-and-quantile-loss",
  "short": "Probabilistic forecasts & quantile",
  "title": "Probabilistic Forecasts and Quantile Loss: Pinball Loss and Prediction Intervals",
  "task": "concepts",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Predicting asymmetric quantiles (p10, p50, p90) and full predictive distributions using the pinball loss function and conformalised calibration.",
  "lead": "A single point forecast (such as predicting \"tomorrow's sales will be 150 units\") provides zero information about real-world uncertainty, downside risk, or extreme tail exposure. In supply chain inventory, under-predicting demand causes costly stockouts, whereas over-predicting causes inventory holding waste. Probabilistic forecasting models the full probability distribution or specific target percentiles using asymmetric quantile loss (pinball loss).",
  "analogy": "Imagine packing a parachute or ordering hospital oxygen tanks. Knowing the \"average\" air consumption or \"average\" deployment speed is dangerous; you need to plan for the 99th percentile worst-case scenario. If running out of stock costs ten times more than having excess stock, you should deliberately forecast a high quantile (p90) rather than the symmetric median (p50).",
  "intuition": [
    "Standard Mean Squared Error (MSE) loss forces models to predict the conditional mean $\\mathbb{E}[y|x]$, which is symmetric and heavily sensitive to outliers. Mean Absolute Error (MAE) predicts the conditional median (p50).",
    "The pinball loss (or tilted absolute value function) $\\mathcal{L}_\\tau(y, \\hat{y})$ penalises under-prediction by weight $\\tau$ and over-prediction by weight $(1 - \\tau)$, where $\\tau \\in (0, 1)$ is the target quantile.",
    "Training a regression model (e.g. Quantile LightGBM, Quantile Regression Forests, or a neural network) with pinball loss directly predicts the $\\tau$-th conditional quantile $Q_y(\\tau | x)$ without assuming Gaussianity or homoscedasticity.",
    "By training three models at $\\tau = 0.1, 0.5, 0.9$, an engineer produces a median forecast along with an 80% prediction interval $[Q_{0.1}, Q_{0.9}]$ that dynamically widens during volatile periods and narrows during calm periods."
  ],
  "steps": [
    "Define operational cost asymmetry: Calculate relative costs of under-prediction $c_u$ vs over-prediction $c_o$ to select target operational quantile $\\tau^* = \\frac{c_u}{c_u + c_o}$ (Newsvendor formula).",
    "Select model architecture: Choose a native quantile model such as gradient boosting with `objective=\"quantile\"` or deep neural networks with multiple quantile output heads.",
    "Train across multiple quantile levels: Fit separate models or multi-head objectives for $\\tau \\in \\{0.05, 0.10, 0.50, 0.90, 0.95\\}$.",
    "Check for quantile crossing: Post-process predictions to enforce monotonicity ($Q_{\\tau_1} \\le Q_{\\tau_2}$ for $\\tau_1 < \\tau_2$) using sorting or isotonic rearrangement.",
    "Evaluate calibration and sharpness: Measure empirical coverage (proportion of actuals falling below $Q_\\tau$) and interval width (sharpness)."
  ],
  "math": [
    {
      "h": "Pinball Loss (Quantile Loss) Function",
      "tex": "\\mathcal{L}_\\tau(y, \\hat{y}) = \\max\\left( \\tau (y - \\hat{y}), \\; (1 - \\tau)(\\hat{y} - y) \\right) = (y - \\hat{y}) \\left( \\tau - \\mathbb{I}(y < \\hat{y}) \\right)",
      "p": "Under-predicting ($y > \\hat{y}$) incurs penalty $\\tau |y - \\hat{y}|$, while over-predicting ($y < \\hat{y}$) incurs penalty $(1 - \\tau) |y - \\hat{y}|$."
    },
    {
      "h": "Conditional Quantile Optimality",
      "tex": "Q_y(\\tau | x) = \\operatorname*{arg\\,min}_{q(x)} \\mathbb{E}_{Y|X}\\left[ \\mathcal{L}_\\tau(Y, q(X)) \\right]",
      "p": "Minimising expected pinball loss uniquely yields the true conditional $\\tau$-th quantile function of the underlying distribution."
    },
    {
      "h": "Winkler Score for Prediction Interval Evaluation",
      "tex": "\\mathrm{WS}_{\\alpha}(l, u, y) = (u - l) + \\frac{2}{\\alpha} (l - y) \\mathbb{I}(y < l) + \\frac{2}{\\alpha} (y - u) \\mathbb{I}(y > u)",
      "p": "Evaluates $(1 - \\alpha)$ prediction intervals $[l, u]$, balancing narrow interval width (sharpness) against severe penalties for coverage violations."
    }
  ],
  "code": "import numpy as np\nfrom sklearn.ensemble import GradientBoostingRegressor\n\n# Generate heteroscedastic synthetic data (noise variance expands with x)\nnp.random.seed(42)\nX = np.sort(np.random.uniform(0, 10, size=500)).reshape(-1, 1)\nnoise = np.random.normal(0, 0.3 + 0.2 * X.flatten(), size=500)\ny = 2.0 * np.sin(X.flatten()) + noise\n\n# Fit 10th, 50th (median), and 90th percentiles using Quantile Gradient Boosting\nquantiles = [0.1, 0.5, 0.9]\nmodels = {}\nfor q in quantiles:\n    gbr = GradientBoostingRegressor(loss='quantile', alpha=q, n_estimators=100, max_depth=3)\n    gbr.fit(X, y)\n    models[q] = gbr\n\n# Predict on new test points\nX_test = np.array([[2.0], [5.0], [8.0]])\npreds = {q: models[q].predict(X_test) for q in quantiles}\n\nfor i, x_val in enumerate(X_test.flatten()):\n    p10, p50, p90 = preds[0.1][i], preds[0.5][i], preds[0.9][i]\n    print(f\"X={x_val:.1f} -> P10: {p10:.2f} | P50 (median): {p50:.2f} | P90: {p90:.2f} | 80% Width: {p90 - p10:.2f}\")\n# Notice prediction interval width expands substantially as X increases!",
  "keyPoints": [
    "Probabilistic forecasting quantifies prediction uncertainty rather than providing a single blind point estimate.",
    "Pinball loss asymmetrically penalises under- vs over-predictions to directly target arbitrary percentiles.",
    "Heteroscedasticity (varying uncertainty across different regimes) is captured naturally by quantile regression.",
    "Prediction intervals should be evaluated for both empirical coverage (calibration) and narrow interval width (sharpness)."
  ],
  "pitfalls": [
    "Quantile crossing: Training independent models for p10 and p90 can occasionally result in $\\hat{Q}_{0.1}(x) > \\hat{Q}_{0.9}(x)$ in sparse regions; apply monotonic sorting.",
    "Assuming constant Gaussian error bars: Applying $\\pm 1.96 \\sigma$ uniformly across all time periods fails when variance is non-constant or skewed.",
    "Evaluating quantile models with RMSE: Evaluating a model trained on pinball loss using RMSE evaluates the wrong statistical functional (mean instead of quantile)."
  ],
  "quiz": [
    {
      "q": "What quantile does the standard Mean Absolute Error (MAE) loss function implicitly estimate?",
      "o": [
        "The 90th percentile (p90)",
        "The conditional median (50th percentile, p50)",
        "The conditional mean $\\mathbb{E}[y|x]$",
        "The mode of the empirical distribution"
      ],
      "a": 1,
      "why": "MAE is the symmetric pinball loss where $\\tau = 0.5$. Minimising expected MAE yields the conditional median."
    },
    {
      "q": "If under-estimating demand costs £90 in lost customer goodwill while over-estimating costs £10 in storage, which quantile should a retailer forecast according to the Newsvendor problem?",
      "o": [
        "The 10th percentile (p10)",
        "The 50th percentile (p50)",
        "The 90th percentile (p90)",
        "The 100th percentile"
      ],
      "a": 2,
      "why": "Formula $\\tau^* = c_u / (c_u + c_o) = 90 / (90 + 10) = 0.90$. The critical fractile dictates targeting the 90th percentile to minimise total expected costs."
    },
    {
      "q": "What is \"quantile crossing\" in independent quantile regression models?",
      "o": [
        "When the learning rate crosses zero during gradient descent",
        "A pathology where a higher predicted quantile (e.g. p90) evaluates to a lower number than a lower predicted quantile (e.g. p10) for some test input",
        "When cross-validation folds overlap",
        "When features cross the decision boundary"
      ],
      "a": 1,
      "why": "Because independent models are trained separately without joint constraints, prediction curves can intersect in unseen feature regions, violating distribution monotonicity."
    }
  ],
  "related": [
    "conformal-prediction",
    "forecast-metrics-mae-mase-smape-wape",
    "cost-sensitive-learning"
  ],
  "keywords": "probabilistic forecasting, quantile regression, pinball loss, quantile loss, prediction intervals, newsvendor problem, heteroscedasticity, sharpness, calibration",
  "usedBy": []
},
  {
    id: 'data-drift-psi-ks-and-jensen-shannon',
    short: 'Data drift: PSI, KS and JS',
    title: 'Data Drift: PSI, KS and Jensen–Shannon',
    task: 'concepts',
    module: 'Monitoring and drift',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Detecting distribution shifts in predictor features between training baseline and live production data using statistical distance metrics.`,
    lead: r`Machine learning models assume that production inputs follow the same probability distribution as the training data. In reality, seasonal changes, consumer trends, sensor wear, and upstream schema modifications cause input distributions to shift—a phenomenon known as data drift or covariate shift. Population Stability Index (PSI), the Kolmogorov–Smirnov (KS) test, and Jensen–Shannon divergence quantify feature drift without requiring target labels.`,
    intuition: [
      r`Suppose a credit risk model is trained on loan applications submitted in 2021, when applicant incomes averaged £45,000 and the median applicant age was 42. In 2024, the bank launches a student mobile app. Suddenly, 60% of incoming applicants are aged 18 to 24 with part-time incomes under £15,000. Even if the model's software pipeline runs without throwing exceptions, the inputs have shifted into a sparse, unrepresentative region of the training feature space. The model is forced to extrapolate, leading to erratic credit score decisions. This is data drift: the input distribution P(X) has changed, even if the underlying definition of credit default P(Y | X) has not yet been observed.`,
      r`Population Stability Index (PSI) is the industry standard in financial risk and credit scoring for measuring feature drift. You partition the reference training feature into 10 quantile bins (deciles), each containing exactly 10% of training data. You then pass the latest batch of production observations through those exact same bin cutoffs and compute the actual proportion in each bin. For each bin, PSI calculates (Actual - Reference) multiplied by ln(Actual / Reference). Summing across all bins yields the overall PSI. An industry rule of thumb treats PSI below 0.1 as stable, 0.1 to 0.2 as moderate drift, and 0.2 or greater as significant drift requiring investigation or retraining.`,
      r`Continuous features can also be monitored without binning using the two-sample Kolmogorov–Smirnov (KS) test, which measures the maximum vertical discrepancy between the empirical cumulative distribution functions (CDFs) of training and production samples. For general probability distributions, Jensen–Shannon (JS) divergence provides a smoothed, symmetric, bounded measure based on Kullback–Leibler divergence that gracefully handles differences in feature support.`,
    ],
    analogy: r`A manufacturing quality inspector sampling incoming raw metal batches to check whether their density or purity has drifted away from the original engineering specification.`,
    steps: [
      r`Establish reference baseline distribution: record quantile boundaries (e.g. deciles) and empirical CDFs on the validated training or holdout test partition.`,
      r`Sample current production window: aggregate incoming production feature vectors over an operational monitoring window (e.g. daily or weekly).`,
      r`Compute Population Stability Index (PSI): bin the current data using the baseline quantile thresholds and evaluate the sum of binned divergence terms.`,
      r`Apply Kolmogorov–Smirnov test on continuous features: compute the maximum distance $D$ between empirical CDFs and evaluate the statistical p-value.`,
      r`Trigger alert hierarchies: flag features with $\text{PSI} \ge 0.1$ for automated tracking, and escalate features with $\text{PSI} \ge 0.2$ for root-cause analysis and potential model retraining.`,
    ],
    math: [
      {
        h: 'Population Stability Index (PSI)',
        tex: r`\text{PSI} = \sum_{k=1}^K \left( \hat{p}_{\text{curr}, k} - \hat{p}_{\text{ref}, k} \right) \cdot \ln\left( \frac{\hat{p}_{\text{curr}, k}}{\hat{p}_{\text{ref}, k}} \right)`,
        p: r`Where $K$ is the number of bins (typically 10 reference deciles), $\hat{p}_{\text{ref}, k}$ is the baseline proportion in bin $k$, and $\hat{p}_{\text{curr}, k}$ is the current production proportion. Laplace smoothing prevents division by zero when a production bin contains zero samples.`,
      },
      {
        h: 'Two-sample Kolmogorov–Smirnov statistic',
        tex: r`D_{n, m} = \sup_x \left| F_{\text{ref}, n}(x) - F_{\text{curr}, m}(x) \right|`,
        p: r`Where $F_{\text{ref}, n}(x)$ and $F_{\text{curr}, m}(x)$ represent empirical cumulative distribution functions of reference and production samples of sizes $n$ and $m$. $D_{n, m}$ measures the supreme absolute divergence between the two empirical curves.`,
      },
      {
        h: 'Jensen–Shannon Divergence (JSD)',
        tex: r`\text{JSD}(P \parallel Q) = \frac{1}{2} D_{\text{KL}}(P \parallel M) + \frac{1}{2} D_{\text{KL}}(Q \parallel M), \qquad M = \frac{1}{2}(P + Q)`,
        p: r`Where $D_{\text{KL}}$ is the Kullback–Leibler divergence and $M$ is the average distribution. Unlike standard KL divergence, Jensen–Shannon divergence is strictly symmetric, bounded between $0$ and $\ln(2)$, and well-defined across overlapping supports.`,
      },
    ],
    keyPoints: [
      r`Data drift detects shifts in input feature distributions P(X) immediately, without waiting for delayed ground-truth target labels.`,
      r`PSI decile bins must be derived strictly from the reference training set and held static during monitoring.`,
      r`Standard PSI thresholds: below 0.1 indicates stability, 0.1 to 0.2 indicates moderate change, and 0.2+ signals critical distribution drift.`,
    ],
    pitfalls: [
      r`Recomputing quantile bins dynamically on current production data instead of applying fixed reference training cutoffs.`,
      r`Zero-count crash in PSI: if a production bin has 0 records, the log term diverges to negative infinity without Laplace or epsilon smoothing.`,
      r`Assuming absence of data drift implies absence of model decay: concept drift can degrade predictions even when input distributions P(X) remain completely static.`,
    ],
    code: r`import numpy as np

def calculate_psi(ref, curr, num_bins=10):
    # Quantile bins derived strictly from reference baseline
    quantiles = np.linspace(0, 100, num_bins + 1)
    bins = np.percentile(ref, quantiles)
    bins[0] -= 1e-6
    bins[-1] += 1e-6
    
    ref_counts = np.histogram(ref, bins=bins)[0]
    curr_counts = np.histogram(curr, bins=bins)[0]
    
    # Laplace smoothing prevents log(0) and division by zero
    p_ref = (ref_counts + 1e-4) / (len(ref) + 1e-4 * num_bins)
    p_curr = (curr_counts + 1e-4) / (len(curr) + 1e-4 * num_bins)
    
    psi = np.sum((p_curr - p_ref) * np.log(p_curr / p_ref))
    return psi

np.random.seed(42)
reference = np.random.normal(50.0, 10.0, size=1000)
prod_stable = np.random.normal(50.2, 9.8, size=500)     # Stable
prod_drifted = np.random.normal(55.0, 12.0, size=500)    # Drifted

psi_stable = calculate_psi(reference, prod_stable)
psi_drifted = calculate_psi(reference, prod_drifted)

print(f"Baseline vs Stable Production:  PSI = {psi_stable:.3f} (< 0.1 stable)")
print(f"Baseline vs Drifted Production: PSI = {psi_drifted:.3f} (>= 0.2 significant drift)")`,
    quiz: [
      {
        q: r`What is the primary advantage of monitoring data drift (covariate shift) over monitoring model accuracy metrics in production?`,
        o: [
          r`Data drift requires knowing the true ground-truth labels immediately`,
          r`Data drift can be computed instantly on incoming feature inputs P(X) without waiting for delayed or expensive ground-truth labels Y`,
          r`Data drift metrics are only valid for linear models`,
          r`Data drift eliminates the need for cross-validation`,
        ],
        a: 1,
        why: r`Ground-truth outcome labels (such as loan defaults or cancer diagnoses) often take weeks or months to arrive. Data drift alerts engineering teams to distribution changes immediately upon inference.`,
      },
      {
        q: r`When computing Population Stability Index (PSI), how must the bin boundaries be established?`,
        o: [
          r`By recomputing quantiles on the incoming production batch every hour`,
          r`Using fixed quantile cutoffs derived strictly from the baseline reference training dataset`,
          r`By arbitrarily dividing the feature into 100 equal-width bins`,
          r`Using the min and max of the production dataset only`,
        ],
        a: 1,
        why: r`PSI measures how current data shifts relative to the reference standard. The bin boundaries must remain fixed to the baseline reference quantiles so each reference bin represents an expected 10% share.`,
      },
      {
        q: r`A production feature produces a PSI value of 0.26 when compared against training data. What action should the engineering team take according to industry conventions?`,
        o: [
          r`Do nothing, because PSI below 0.5 indicates complete stability`,
          r`Permanently delete the feature and all related models`,
          r`Investigate the root cause of significant drift, check upstream data schemas, and evaluate retraining or recalibrating the model`,
          r`Invert the sign of all feature values`,
        ],
        a: 2,
        why: r`Industry rules of thumb define PSI >= 0.2 as significant distribution drift that demands immediate root-cause investigation, schema validation, and potential retraining.`,
      },
    ],
    usedBy: [],
    prereq: ['exploratory-data-analysis', 'hypothesis-testing-and-p-values'],
    related: ['concept-drift-and-performance-monitoring', 'data-cleaning-and-validation', 'missing-data-mcar-mar-mnar-and-imputation'],
    keywords: 'data drift covariate shift population stability index psi kolmogorov smirnov test jensen shannon divergence model monitoring distribution shift',
  },
  {
    id: 'concept-drift-and-performance-monitoring',
    short: 'Concept drift and monitoring',
    title: 'Concept Drift and Performance Monitoring',
    task: 'concepts',
    module: 'Monitoring and drift',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Tracking degradation in the statistical relationship between features and targets over time, separating label delay from true relationship decay.`,
    lead: r`Data drift occurs when input features P(X) change; concept drift occurs when the fundamental relationship between inputs and targets P(Y | X) alters over time. A model trained on pre-pandemic consumer behaviour or historical fraud tactics will fail when human habits evolve, even if feature distributions appear normal. Monitoring concept drift through rolling performance tracking and sequential change-point detection (such as Page–Hinkley) ensures timely model retraining.`,
    intuition: [
      r`Imagine an automated fraud detection model protecting an online electronics store. Prior to holiday clearance sales, a purchase of £800 at 2:00 AM on a newly created customer account had a 95% probability of being fraudulent. During a flash holiday clearance sale, legitimate customers wake up at 2:00 AM to buy £800 discounted laptops. The input features (time = 2:00 AM, amount = £800) have not necessarily changed their individual ranges, but the conditional probability P(Fraud | Time, Amount) has dramatically flipped. This is concept drift: the underlying rules and causal relationships connecting features to targets have evolved.`,
      r`Concept drift manifests in diverse temporal patterns: sudden drift (an abrupt change, such as a major tax law or quarantine policy introduced overnight), gradual drift (competitors slowly releasing alternative products over several months), incremental drift (gradual inflation steadily eroding purchasing power), or recurring cyclical drift (holiday spending patterns returning every November and December). Identifying the type of drift determines whether the model requires a quick retraining patch or a dynamic seasonal architecture.`,
      r`The principal operational challenge in concept drift monitoring is ground-truth label delay. While input features are observed at the exact millisecond of inference, outcome labels require time to resolve. In credit lending, whether a borrower defaults might not be known for 180 days; in customer subscription churn, inactivity can only be confirmed after 60 days. Performance monitoring frameworks must track cohort maturity carefully, avoiding false alarms caused by incomplete recent label windows.`,
    ],
    analogy: r`A chess grandmaster who memorised opening books from the 19th century discovering that contemporary opponents play completely different defensive responses to the same opening moves.`,
    steps: [
      r`Classify drift dynamics: determine whether relationship shifts are sudden (policy changes), gradual (inflation), or recurrent (holiday seasons).`,
      r`Characterise label maturation latency: quantify the label delay distribution $T_{\text{delay}} = t_{\text{ground\_truth}} - t_{\text{prediction}}$ to define mature evaluation windows.`,
      r`Track rolling operational metrics: compute rolling log-loss, Brier score, ROC-AUC, or WAPE strictly on cohorts with mature, fully resolved labels.`,
      r`Deploy sequential change-point detection: run online statistical change detectors (such as the Page–Hinkley test) on prediction loss residuals to flag statistically significant shifts.`,
      r`Execute tiered mitigation policies: fall back to conservative business rules upon detection, retrain models on recent temporal windows, or update prediction calibration curves.`,
    ],
    math: [
      {
        h: 'Decomposition of joint distribution shift',
        tex: r`P_{\text{curr}}(X, Y) = P_{\text{curr}}(X) \cdot P_{\text{curr}}(Y \mid X)`,
        p: r`Where pure data drift (covariate shift) corresponds to $P_{\text{curr}}(X) \ne P_{\text{ref}}(X)$ while $P(Y \mid X)$ remains fixed, whereas pure concept drift corresponds to $P_{\text{curr}}(Y \mid X) \ne P_{\text{ref}}(Y \mid X)$ even if input distribution $P(X)$ is completely unaltered.`,
      },
      {
        h: 'Page–Hinkley sequential change detection test',
        tex: r`m_t = \sum_{i=1}^t (e_i - \bar{e}_{\text{ref}} - \delta), \qquad M_t = \min_{1 \le i \le t} m_i, \qquad \text{Alarm if } (m_t - M_t) > \lambda`,
        p: r`Where $e_i = L(y_i, \hat{y}_i)$ is prediction loss at time $i$, $\bar{e}_{\text{ref}}$ is the baseline error mean, $\delta$ is an allowable drift tolerance magnitude, and $\lambda$ is a detection threshold controlling false alarm rate.`,
      },
      {
        h: 'Exponential forgetting loss weighting',
        tex: r`\boldsymbol{\theta}^* = \arg\min_{\boldsymbol{\theta}} \sum_{t=1}^T \gamma^{T-t} L\left(y_t, f(x_t; \boldsymbol{\theta})\right), \qquad 0 < \gamma \le 1`,
        p: r`Where decay factor $\gamma$ down-weights older observations exponentially relative to recent events, allowing continuous online retraining to adapt fluidly to evolving target concepts.`,
      },
    ],
    keyPoints: [
      r`Concept drift represents changes in P(Y | X), altering the predictive mapping between inputs and outcomes.`,
      r`Label delay is the central bottleneck in concept drift monitoring, requiring separate tracking of mature and immature cohorts.`,
      r`Sequential change-point algorithms like Page–Hinkley detect statistically significant error increases without requiring arbitrary sliding window sizes.`,
    ],
    pitfalls: [
      r`Confusing label maturation delay with model degradation: declaring false alarm failures on recent cohorts whose positive outcomes have not yet arrived.`,
      r`Retraining blindly on recent data during cyclical drift: retraining exclusively on summer data deletes critical knowledge required for winter demand.`,
      r`Relying on aggregate accuracy for imbalanced classification: overall accuracy can remain at 98% while recall on the critical positive class drops to zero.`,
    ],
    code: r`import numpy as np

def page_hinkley(errors, ref_mean, delta=0.05, threshold=8.0):
    cum_sum, min_cum_sum = 0.0, 0.0
    for t, e in enumerate(errors):
        cum_sum += (e - ref_mean - delta)
        if cum_sum < min_cum_sum:
            min_cum_sum = cum_sum
        if (cum_sum - min_cum_sum) > threshold:
            return t
    return -1

np.random.seed(42)
# 100 stationary predictions (mean error ~0.15) followed by concept drift (~0.45)
stationary = np.random.exponential(0.15, size=100)
drifted = np.random.exponential(0.45, size=50)
stream = np.concatenate([stationary, drifted])
ref_mean = np.mean(stationary[:50])

alarm_step = page_hinkley(stream, ref_mean=ref_mean, delta=0.05, threshold=8.0)
print(f"Baseline mean error: {ref_mean:.2f}, Post-drift mean: {np.mean(drifted):.2f}")
print(f"Drift introduced at step 100 -> Alarm raised at step {alarm_step}")`,
    quiz: [
      {
        q: r`What distinguishes concept drift from data drift?`,
        o: [
          r`Data drift changes the relationship P(Y | X), whereas concept drift changes only input distributions P(X)`,
          r`Concept drift alters the underlying relationship P(Y | X) between features and target, whereas data drift changes only the input distribution P(X)`,
          r`Concept drift only occurs in deep neural networks`,
          r`Data drift can only be measured after ground-truth labels arrive`,
        ],
        a: 1,
        why: r`Data drift (covariate shift) means the input distribution P(X) shifted. Concept drift means the actual relationship between inputs and outputs P(Y | X) changed, degrading model accuracy even if P(X) remains unchanged.`,
      },
      {
        q: r`Why is label verification delay a major challenge when monitoring concept drift in applications like credit default prediction?`,
        o: [
          r`Because loan defaults take months or years to materialize, preventing instant measurement of true model error on recent cohorts`,
          r`Because credit scores cannot be computed on weekends`,
          r`Because delayed labels cause models to train in reverse order`,
          r`Because banks are legally forbidden from storing historical predictions`,
        ],
        a: 0,
        why: r`Whether a loan defaults or a subscriber churns cannot be confirmed immediately at prediction time. Evaluating recent performance requires waiting for labels to mature or tracking leading proxy metrics.`,
      },
      {
        q: r`How does the Page–Hinkley sequential test detect concept drift in a streaming production environment?`,
        o: [
          r`By fitting an ARIMA model to the input features`,
          r`By accumulating deviations of prediction errors above an allowable tolerance delta and raising an alarm when the cumulative sum exceeds a threshold lambda`,
          r`By calculating the correlation between training features and test features`,
          r`By retraining the model at fixed 24-hour intervals regardless of error`,
        ],
        a: 1,
        why: r`Page–Hinkley tracks cumulative deviations of error residuals against a baseline mean and tolerance parameter delta, signaling a change point when the difference from the running minimum exceeds threshold lambda.`,
      },
    ],
    usedBy: [],
    prereq: ['data-drift-psi-ks-and-jensen-shannon', 'cross-validation'],
    related: ['train-validation-test-splits-group-and-time-based', 'time-series-cross-validation', 'forecast-metrics-mae-mase-smape-wape'],
    keywords: 'concept drift performance monitoring covariate shift page hinkley adwin label delay model decay continuous evaluation',
  },
  {
  "id": "model-decay-and-retraining-policies",
  "short": "Model decay & retraining",
  "title": "Model Decay and Retraining Policies: Scheduled, Metric-Driven, and Continual Updating",
  "task": "concepts",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Designing sustainable retraining cadences, canary deployments, backtesting triggers, and shadow policies to counter operational model decay.",
  "lead": "No machine learning model deployed to production remains optimal indefinitely. Real-world consumer preferences change, competitors alter pricing, macroeconomic climates shift, and upstream telemetry schemas mutate. Without structured retraining policies, models silently degrade in performance—a phenomenon known as model decay or model staleness. Designing robust retraining strategies balances computational cost against performance decay.",
  "analogy": "Imagine navigational charts for a busy coastal harbour with shifting sandbanks. If cartographers update the depth maps only once a decade, ships eventually run aground on newly formed shallows. However, re-surveying the entire seabed every single hour is astronomically expensive. The harbour authority sets a sensible compromise: routine quarterly bathymetric surveys, coupled with emergency soundings whenever sonar buoy alarms detect depth drops after severe storms.",
  "intuition": [
    "Model decay originates from two primary mechanisms: covariate shift $P(X)$ (the distribution of incoming features changes) and concept drift $P(Y|X)$ (the relationship between features and the target label shifts).",
    "The half-life of a model varies widely across domains: high-frequency trading and ad click-through prediction models decay within hours, fraud detection models decay within weeks as attackers adapt, while medical imaging diagnostics can remain stable for years.",
    "Teams select among four primary retraining architectures: Scheduled (fixed cadence: daily, weekly, monthly), Metric-triggered (retraining initiates when drift metrics like PSI or KS distance breach thresholds), Performance-triggered (retraining triggers when ground-truth labels arrive and show degraded metric performance), and Online / Continual learning (model weights update continuously with streaming data).",
    "Production retraining requires defensive safeguards: automated model evaluation on holdout golden sets, statistical tests against the incumbent champion model, shadow mode verification, and canary rollouts to prevent corrupted models from serving 100% of live traffic."
  ],
  "steps": [
    "Establish performance half-life: Backtest historical model degradation across expanding holdout horizons to determine the optimal natural retraining cadence.",
    "Select retraining architecture: Choose between scheduled cron jobs, event-driven drift triggers, or streaming incremental learning.",
    "Define data windowing policy: Select sliding window (retain only the most recent $N$ months of data) or expanding window (retain all historical data with decay sample weights).",
    "Execute automated candidate gate: Compare the newly trained challenger against the incumbent production champion on a recent validation slice.",
    "Deploy via canary or shadow mode: Route 5% of live traffic to the candidate model (canary) or mirror 100% traffic silently (shadow) to verify latency and stability before full cutover."
  ],
  "math": [
    {
      "h": "Temporal Degradation Trajectory",
      "tex": "\\mathcal{M}(t) = \\mathcal{M}_0 \\cdot e^{-\\lambda (t - t_0)} + \\epsilon_t",
      "p": "Model metric $\\mathcal{M}(t)$ (e.g. AUC or F1) typically decays exponentially with elapsed time $(t - t_0)$, where decay parameter $\\lambda$ reflects domain volatility."
    },
    {
      "h": "Sample Weighting with Exponential Decay",
      "tex": "w_i = \\exp\\left( -\\frac{\\ln(2)}{t_{1/2}} \\cdot (t_{\\mathrm{now}} - t_i) \\right)",
      "p": "Weights historical training observation $i$ exponentially based on elapsed time relative to half-life $t_{1/2}$, prioritising modern behaviour."
    },
    {
      "h": "Champion-Challenger Inferential Hypothesis Test",
      "tex": "Z = \\frac{\\mathcal{M}_{\\mathrm{challenger}} - \\mathcal{M}_{\\mathrm{champion}}}{\\sqrt{\\mathrm{Var}(\\mathcal{M}_{\\mathrm{chal}}) + \\mathrm{Var}(\\mathcal{M}_{\\mathrm{champ}})}} > Z_{1 - \\alpha}",
      "p": "The challenger model replaces the incumbent champion only if it demonstrates statistically significant metric superiority on holdout verification data."
    }
  ],
  "code": "import numpy as np\nfrom datetime import datetime, timedelta\n\ndef calculate_time_decay_weights(dates: np.ndarray, current_date: datetime, half_life_days: float) -> np.ndarray:\n    \"\"\"Calculate exponential time-decay sample weights for training observations.\"\"\"\n    decay_rate = np.log(2.0) / half_life_days\n    elapsed_days = np.array([(current_date - d).total_seconds() / 86400.0 for d in dates])\n    weights = np.exp(-decay_rate * elapsed_days)\n    # Normalise weights to average 1.0\n    return weights / np.mean(weights)\n\n# Simulate 5 historical observations over 90 days\nnow = datetime(2026, 6, 1)\nsample_dates = np.array([\n    now - timedelta(days=90),\n    now - timedelta(days=60),\n    now - timedelta(days=30),\n    now - timedelta(days=10),\n    now - timedelta(days=1)\n])\n\n# Compute sample weights with a 30-day half-life\nweights = calculate_time_decay_weights(sample_dates, current_date=now, half_life_days=30.0)\n\nfor d, w in zip(sample_dates, weights):\n    days_ago = (now - d).days\n    print(f\"Observation from {days_ago:2d} days ago -> Sample weight: {w:.3f}\")\n# Notice 30 days ago has half the weight of yesterday, while 90 days ago has 1/8th",
  "keyPoints": [
    "Model decay is inevitable due to evolving covariate distributions and shifting concept definitions.",
    "Retraining policies combine fixed scheduled cadences with automated metric-driven alerts.",
    "Exponential time-decay weighting enables models to adapt to modern trends without discarding older edge cases.",
    "Candidate models must pass automated validation gates and canary testing before replacing the production champion."
  ],
  "pitfalls": [
    "Unsupervised retraining loops: Automatically retraining and deploying models without human approval or strict validation gates risks training on corrupted data and propagating systemic errors.",
    "Feedback loops (performative prediction): When model decisions alter future training data (e.g. credit approvals only yielding labels for approved borrowers), naive retraining amplifies bias.",
    "Training on unlabelled delayed actuals: Retraining on recent data where ground truth labels have not yet matured (e.g. fraud reported 60 days late) treats unconfirmed fraudsters as legitimate users."
  ],
  "quiz": [
    {
      "q": "What is the risk of an unmonitored automated retraining loop that deploys newly trained models directly to 100% of production traffic?",
      "o": [
        "It guarantees memory allocation failures in the database",
        "A temporary upstream pipeline error or corrupted data ingestion can train an invalid model that instantly takes down production service",
        "It automatically deletes historical git repositories",
        "Decision trees will stop splitting on continuous variables"
      ],
      "a": 1,
      "why": "Without automated gating tests, canary rollouts, or circuit breakers, an automated training pipeline could consume corrupted data and replace a working model with a defective one."
    },
    {
      "q": "Why should fraud detection models not be retrained on the most recent 14 days of transactional data without adjustment?",
      "o": [
        "Because fraud labels have high maturation delay; many fraudulent transactions have not yet been reported or confirmed",
        "Because fraud models require exactly 365 days of data",
        "Because Python cannot calculate ROC curves on recent data",
        "Because fraud rates are always exactly 50%"
      ],
      "a": 0,
      "why": "Fraud chargebacks and bank investigations typically take 30–90 days to settle. Training on fresh data treats undetected fraud as negative examples, poisoning model quality."
    },
    {
      "q": "What is the role of a \"canary deployment\" in a model retraining lifecycle?",
      "o": [
        "To test whether the model runs on older Linux kernels",
        "To route a tiny fraction (e.g. 5%) of live production traffic to the challenger model to observe real-world latency, error rates, and behaviour before full cutover",
        "To encrypt the feature names using SHA-256",
        "To compress the model weights into an archive"
      ],
      "a": 1,
      "why": "Canary deployment limits blast radius: if the new model fails or crashes on production inputs, only 5% of users are exposed before the system automatically rolls back."
    }
  ],
  "related": [
    "concept-drift-and-performance-monitoring",
    "data-drift-psi-ks-and-jensen-shannon",
    "experiment-tracking"
  ],
  "keywords": "model decay, retraining policies, concept drift, champion challenger, canary deployment, shadow mode, time decay weights, performative prediction",
  "usedBy": []
},
  {
  "id": "data-quality-checks",
  "short": "Data quality checks",
  "title": "Data Quality Checks: Defensive Schemas, Assertions, and Anomaly Detection",
  "task": "concepts",
  "level": 1,
  "minutes": 15,
  "noLab": true,
  "summary": "Building defensive data testing pipelines with Great Expectations, Pandera, schema contracts, and volumetric anomaly detection.",
  "lead": "Machine learning systems are uniquely silent failures: whereas a traditional software bug throws a null pointer exception and crashes with a clear stack trace, a machine learning model provided with corrupted or null data will still return floating point predictions without complaint. Defending production ML pipelines requires rigorous data quality frameworks that validate schemas, test distribution boundaries, and halt execution before bad data reaches models.",
  "analogy": "Imagine a high-speed bottling factory. If a delivery truck arrives with shattered glass bottles or contaminated spring water, running the assembly line will ruin thousands of finished drinks and destroy bottling machinery. Quality control stations at the factory gate inspect bottle integrity, test liquid pH, and check delivery volumes before allowing materials into the manufacturing plant.",
  "intuition": [
    "Data quality errors stem from diverse failure modes: schema drift (column renames, type mutations), value anomalies (impossible negative ages, out-of-bounds percentages), completeness violations (null surges), and volumetric failures (a pipeline receiving 50 rows instead of 5,000,000).",
    "Defensive data engineering applies the \"Unit Testing for Data\" paradigm. Tools like Great Expectations, Pandera, and Soda define declarative test suites that assert schema contracts prior to training and inference.",
    "Tests fall into four tiers: Schema tests (column presence, strict types, nullability constraints), Domain constraints (ranges, regex patterns, allowed set memberships), Statistical checks (mean and standard deviation bounds, category frequency ratios), and Relational checks (foreign key referential integrity across tables).",
    "Automating these checks in CI/CD and production orchestrators (Airflow, Dagster, Prefect) creates \"circuit breakers\" that automatically quarantine malformed batches and alert on-call engineers before corrupted inputs degrade model outputs."
  ],
  "steps": [
    "Define declarative schema contract: Specify column names, dtypes, nullable flags, and permissible value domains using tools like Pandera or Great Expectations.",
    "Establish freshness and volume expectations: Assert minimum and maximum record counts and ensure the latest timestamp is within the expected ingestion SLA.",
    "Enforce statistical distribution bounds: Assert that continuous metrics fall within expected interquartile ranges and that categorical levels match registered vocabularies.",
    "Embed checks in pipeline gates: Execute validation checks immediately after data ingestion and immediately prior to model scoring.",
    "Implement circuit breakers and alerts: If critical assertions fail, halt downstream pipeline execution, quarantine the offending partition, and trigger incident notifications."
  ],
  "math": [
    {
      "h": "Z-Score Volumetric Anomaly Detection",
      "tex": "Z_v = \\frac{N_t - \\mu_v}{\\sigma_v}, \\quad \\text{Alert if } |Z_v| > 3.0",
      "p": "Measures whether the incoming record volume $N_t$ deviates significantly from historical rolling mean $\\mu_v$ and standard deviation $\\sigma_v$."
    },
    {
      "h": "Null Ratio Bound Expectation",
      "tex": "\\rho_{\\mathrm{null}}(c) = \\frac{1}{N} \\sum_{i=1}^N \\mathbb{I}(x_{i,c} \\text{ is null}) \\le \\epsilon_c",
      "p": "Asserts that the empirical missing value proportion for feature $c$ does not exceed maximum allowable tolerance $\\epsilon_c$."
    },
    {
      "h": "Domain Value Set Inclusion Test",
      "tex": "\\mathcal{V}(c) = \\{x_{i,c} \\mid i \\in \\{1, \\dots, N\\}\\} \\subseteq \\mathcal{S}_{\\mathrm{valid}}",
      "p": "Guarantees that all observed values in categorical column $c$ belong strictly to the approved set of discrete states $\\mathcal{S}_{\\mathrm{valid}}$."
    }
  ],
  "code": "import pandas as pd\nimport numpy as np\n\ndef validate_dataframe(df: pd.DataFrame) -> dict:\n    \"\"\"Execute defensive data quality assertions on incoming inference batch.\"\"\"\n    errors = []\n    \n    # 1. Volume assertion\n    if len(df) < 5:\n        errors.append(f\"Volume check failed: Expected >= 5 rows, got {len(df)}\")\n        \n    # 2. Schema check: required columns\n    required = {'user_id', 'age', 'account_balance', 'country'}\n    missing = required - set(df.columns)\n    if missing:\n        errors.append(f\"Missing required columns: {missing}\")\n        \n    # 3. Domain constraints: age between 18 and 120\n    if 'age' in df.columns:\n        invalid_age = df[(df['age'] < 18) | (df['age'] > 120)]\n        if not invalid_age.empty:\n            errors.append(f\"Age domain violation: {len(invalid_age)} rows out of bounds\")\n            \n    # 4. Null ratio constraint: account_balance must have 0% nulls\n    if 'account_balance' in df.columns:\n        null_count = df['account_balance'].isnull().sum()\n        if null_count > 0:\n            errors.append(f\"Null constraint violated: account_balance has {null_count} nulls\")\n            \n    return {'is_valid': len(errors) == 0, 'errors': errors}\n\n# Sample incoming batch with data quality issues\nincoming_data = pd.DataFrame({\n    'user_id': ['u1', 'u2', 'u3', 'u4', 'u5'],\n    'age': [25, 42, -3, 65, 30],  # Negative age error!\n    'account_balance': [1200.5, np.nan, 350.0, 5000.0, 800.0],  # NaN error!\n    'country': ['GB', 'US', 'GB', 'DE', 'FR']\n})\n\nreport = validate_dataframe(incoming_data)\nprint(\"Data validation passed?\", report['is_valid'])\nfor err in report['errors']:\n    print(\" - Assertion error:\", err)\n# Pipeline halts and quarantines bad batch before feeding to model!",
  "keyPoints": [
    "Data quality checks prevent silent machine learning failures by validating data before model consumption.",
    "Checks span schema contracts, column domain ranges, null proportions, and batch row counts.",
    "Tools like Great Expectations and Pandera automate declarative dataset assertions.",
    "Circuit breakers halt downstream execution and quarantine anomalous partitions upon critical assertion failure."
  ],
  "pitfalls": [
    "Testing only in development: Writing unit tests for code while leaving production data pipelines unmonitored invites silent failures.",
    "Overly rigid constraints: Setting zero-tolerance thresholds on volatile metrics causes false-positive alerts that cause alert fatigue.",
    "Silent type coercion: Pandas automatically casting integer columns to floating point when null values are introduced, silently breaking downstream type assertions."
  ],
  "quiz": [
    {
      "q": "Why are data quality failures considered \"silent failures\" in machine learning pipelines?",
      "o": [
        "Because models make zero CPU noise when calculating matrix operations",
        "Because models will accept corrupted, shifted, or null-imputed data and produce invalid predictions without throwing an execution exception",
        "Because databases do not store text logs",
        "Because Python ignores syntax errors during inference"
      ],
      "a": 1,
      "why": "Unlike traditional software that throws runtime exceptions on bad input types, machine learning models process corrupted numbers smoothly, silently making incorrect decisions."
    },
    {
      "q": "What is the purpose of a \"circuit breaker\" in an automated data pipeline?",
      "o": [
        "To increase the clock speed of GPUs during training",
        "To automatically stop downstream execution and prevent bad data from reaching customer-facing models when critical quality checks fail",
        "To convert CSV files into compressed Parquet files",
        "To balance network bandwidth across worker nodes"
      ],
      "a": 1,
      "why": "A circuit breaker halts downstream jobs and alerts engineers when assertions fail, preventing corrupted data from overwriting good tables or driving invalid predictions."
    },
    {
      "q": "Which assertion is an example of a \"volumetric\" data quality check?",
      "o": [
        "Asserting that column \"age\" is a 64-bit float",
        "Asserting that the daily partition contains between 800,000 and 1,200,000 rows based on historical volume",
        "Asserting that \"email\" matches a valid regular expression",
        "Asserting that the model AUC is above 0.80"
      ],
      "a": 1,
      "why": "Volumetric checks inspect the quantity of incoming data (row counts, file sizes) to detect upstream ingestion drops or duplication."
    }
  ],
  "related": [
    "data-cleaning-and-validation",
    "data-drift-psi-ks-and-jensen-shannon",
    "concept-drift-and-performance-monitoring"
  ],
  "keywords": "data quality, great expectations, pandera, schema contracts, circuit breakers, data testing, null checks, volumetric anomaly detection",
  "usedBy": []
},
  {
    id: 'metric-design-and-north-star-metrics',
    short: 'Metric design and north-star',
    title: 'Metric Design and North-Star Metrics',
    task: 'concepts',
    module: 'Product analytics',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Architecting primary, proxy, and guardrail metric frameworks to align algorithmic optimisation with sustainable user value and business health.`,
    lead: r`Every machine learning model and product feature relentlessly optimises whatever quantitative objective function it is given. If you define a naive metric like daily clicks or raw sign-ups, algorithms exploit clickbait, spam notifications, and deceptive UI patterns, causing long-term churn—an outcome known as Goodhart's Law. Robust metric design constructs a balanced hierarchy: a single North-Star Metric capturing core customer value exchange, supported by sensitive input proxies and strictly enforced guardrails.`,
    intuition: [
      r`Imagine leading product data science for a video streaming service. The executive committee announces that the primary target for the recommendation engine is "Total Video Plays". Your team tunes the recommender to autoplay 5-second teaser clips whenever a user hovers their mouse over a thumbnail. Total video plays triple within two weeks, and the leadership dashboard looks euphoric. Six months later, paid subscription renewals drop by 25%. Users were exasperated by unexpected blaring audio and irrelevant recommendations. The metric skyrocketed while genuine customer satisfaction and long-term lifetime value cratered.`,
      r`A true North-Star Metric (NSM) represents the precise intersection of customer-experienced value and long-term enterprise sustainability. It is rarely raw revenue (which is a lagging accounting output) or top-of-funnel activity (which is easily gamed). For Spotify, it is "Time Spent Listening to Music" (not app launches or search clicks). For Airbnb, it is "Nights Booked" (not total search queries). For Slack, it is "Daily Active Teams Sending Messages" (measuring collaborative network utility). When the North-Star Metric increases honestly, both user utility and enterprise value expand simultaneously.`,
      r`Because a North-Star Metric is often slow and lagging—measuring 90-day retention takes 90 days—teams decompose it into two operational pillars: leading input proxies and guardrails. Input proxies are sensitive, fast-moving metrics in early lifecycle stages (e.g. streaming 3 songs in the first 24 hours) that statistically correlate with downstream retention. Guardrail metrics are non-negotiable boundaries that protect customer trust and system integrity, such as page latency ceilings, unsubscribe rates, and customer support ticket frequency.`,
    ],
    analogy: r`A ship navigating open ocean: the North Star indicates the true navigational destination, responsive helm adjustments serve as leading input proxies, and hull depth sensors act as non-negotiable guardrails against submerged reefs.`,
    steps: [
      r`Identify core value exchange: isolate the fundamental transaction where the user derives genuine utility from the product.`,
      r`Formulate the North-Star Metric: define a measurable rate or composite volume that reflects successful value exchanges (e.g. Weekly Active Users Streaming > 1 hour).`,
      r`Derive leading input proxies: run regression and correlation analyses to find sensitive behavioural actions in days 1 to 7 that predict long-term 90-day retention.`,
      r`Establish non-negotiable guardrails: fix strict operational thresholds on user trust and engineering reliability (e.g. p99 latency < 250ms, spam reports < 0.1%).`,
      r`Conduct Goodhart adversarial review: stress-test metrics by hypothesising how automated algorithms or rogue incentives could inflate numbers without creating customer value.`,
    ],
    math: [
      {
        h: 'Proxy metric statistical sensitivity and predictive power',
        tex: r`R^2 = \frac{\text{Cov}(M_{\text{proxy}}, Y_{\text{long-term}})^2}{\text{Var}(M_{\text{proxy}}) \cdot \text{Var}(Y_{\text{long-term}})}, \qquad \text{SNR} = \frac{\Delta \bar{M}_{\text{proxy}}}{\sqrt{\text{Var}(\Delta M_{\text{proxy}})}}`,
        p: r`Where $M_{\text{proxy}}$ is an early behavioural signal, $Y_{\text{long-term}}$ is ultimate customer retention or lifetime value, and $\text{SNR}$ is the signal-to-noise ratio in A/B test horizons. A valid operational proxy must maximise both correlation with long-term value and statistical sensitivity to short-term product changes.`,
      },
      {
        h: 'Multi-objective constrained metric optimisation',
        tex: r`\max_{\boldsymbol{\theta}} \mathbb{E}\left[ M_{\text{north-star}}(\boldsymbol{\theta}) \right] \quad \text{subject to} \quad G_j(\boldsymbol{\theta}) \le c_j \quad \forall j \in \{1, \dots, J\}`,
        p: r`Where $\boldsymbol{\theta}$ represents algorithmic hyperparameters or UI design variants, and $G_j(\boldsymbol{\theta}) \le c_j$ enforces $J$ guardrail constraints such as user unsubscribe rates, technical latency budgets, or regulatory compliance limits.`,
      },
      {
        h: 'Goodhart divergence decomposition',
        tex: r`\Delta \text{TrueValue} = \beta_1 \Delta M + \beta_2 (\Delta M)^2 + \epsilon`,
        p: r`When an indicator $M$ is converted into an aggressive target, unmodelled feedback loops induce quadratic penalties ($\beta_2 < 0$). Beyond an optimal threshold, incremental metric gains erode real customer value through annoyance, fatigue, or spam.`,
      },
    ],
    keyPoints: [
      r`Goodhart's Law dictates that any metric transformed into a sole target ceases to be a reliable measure due to systemic gaming.`,
      r`A North-Star Metric captures the reciprocal delivery of customer value and sustainable business growth.`,
      r`Pairing primary goals with non-negotiable guardrails prevents models from cannibalising customer trust or degrading infrastructure.`,
    ],
    pitfalls: [
      r`Targeting top-of-funnel vanity metrics (e.g. app downloads, page views) that exhibit zero correlation with recurring customer retention.`,
      r`Using long-lagging metrics directly as A/B test criteria, delaying decision velocity by months rather than using validated leading proxies.`,
      r`Omitting negative guardrail constraints, allowing recommendation engines to inflate click numbers via clickbait or notification bombardment.`,
    ],
    code: r`import numpy as np

np.random.seed(42)
n_users = 200
# User early engagement: meaningful content hours vs notification clicks
meaningful_hours = np.random.exponential(2.0, size=n_users)
notification_clicks = np.random.poisson(15, size=n_users)

# True 90-day retention driven strongly by meaningful hours, weakly by clicks
retention_logit = -1.5 + 0.8 * meaningful_hours + 0.02 * notification_clicks + np.random.normal(0, 0.3, size=n_users)
retained_90d = (1 / (1 + np.exp(-retention_logit)) > 0.5).astype(int)

corr_meaningful = np.corrcoef(meaningful_hours, retained_90d)[0, 1]
corr_clicks = np.corrcoef(notification_clicks, retained_90d)[0, 1]

print(f"Proxy correlation with 90-day retention: meaningful hours = {corr_meaningful:.3f}")
print(f"Vanity metric correlation with retention: notification clicks = {corr_clicks:.3f}")
print(f"Recommended North-Star input proxy: meaningful hours (R2={corr_meaningful**2:.2f})")`,
    quiz: [
      {
        q: r`What does Goodhart's Law imply in the context of machine learning product optimisation?`,
        o: [
          r`Models automatically converge faster when metrics are continuous`,
          r`When a statistical measure is chosen as an operational target, models and teams game the metric, breaking its correlation with true business health`,
          r`The number of training parameters must always exceed the number of features`,
          r`Cross-validation error is strictly equal to test error`,
        ],
        a: 1,
        why: r`Goodhart's Law states that when a measure becomes a target, it ceases to be a good measure because optimisation processes exploit loopholes (e.g. clickbait to drive clicks).`,
      },
      {
        q: r`Why is raw monthly revenue generally unsuitable as an operational North-Star Metric for iterative A/B testing?`,
        o: [
          r`Revenue cannot be measured in digital products`,
          r`Revenue is a lagging accounting metric that takes too long to respond to product changes and fails to measure whether users found genuine value`,
          r`Revenue is always negatively correlated with customer happiness`,
          r`Revenue violates the central limit theorem`,
        ],
        a: 1,
        why: r`Revenue is an output outcome that lags product interventions by months. A North-Star Metric should capture the leading value exchange that ultimately drives revenue.`,
      },
      {
        q: r`What is the primary architectural purpose of a guardrail metric in an experimentation framework?`,
        o: [
          r`To double the sample size of control groups`,
          r`To protect organisational health by setting non-negotiable boundaries on parameters like latency, error rates, and unsubscribe frequency`,
          r`To convert discrete variables into continuous floating-point numbers`,
          r`To ensure all A/B tests achieve p-values below 0.001`,
        ],
        a: 1,
        why: r`Guardrail metrics act as protective safety checks, ensuring that interventions designed to improve a primary metric do not quietly inflict unacceptable harm elsewhere.`,
      },
    ],
    usedBy: [],
    prereq: ['exploratory-data-analysis', 'correlation-pearson-spearman-kendall'],
    related: ['cohort-and-funnel-analysis', 'customer-segmentation-with-rfm', 'data-visualisation-principles'],
    keywords: 'metric design north star metric goodhart law proxy metrics guardrail metrics product analytics user retention a b testing',
  },
  {
    id: 'cohort-and-funnel-analysis',
    short: 'Cohort and funnel analysis',
    title: 'Cohort and Funnel Analysis',
    task: 'concepts',
    module: 'Product analytics',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Tracking user lifecycle progression over time through acquisition cohorts and diagnosing drop-off bottlenecks along multi-step conversion funnels.`,
    lead: r`Aggregate business metrics like monthly active users or overall conversion rate combine veteran power users with newly acquired visitors, concealing underlying product decay. Cohort analysis isolates groups of users who joined during the same time window to track how their retention evolves over their lifecycle. Funnel analysis maps the sequential conversion journey, identifying the precise friction points where prospective users abandon the product.`,
    intuition: [
      r`Consider an e-commerce subscription box business that reports 10,000 active subscribers in January and 10,000 active subscribers in June. A superficial glance at the total active user chart suggests healthy stability. But underneath the surface, the business is suffering catastrophic attrition: out of 10,000 January users, 8,000 cancelled their subscriptions by March. The business masked this collapse by spending aggressively on advertising to acquire 8,000 replacement users. This leaky bucket business is burning capital and will collapse the moment customer acquisition costs rise. Cohort analysis reveals this immediately by plotting retention curves for each signup month independently.`,
      r`In a cohort retention matrix, rows represent acquisition cohorts (e.g. users registered in January, February, or March) and columns represent lifecycle age (Month 0, Month 1, Month 2). If a product has achieved product-market fit, its retention curve decays initially but eventually flattens into a stable horizontal shelf (e.g. retaining a loyal 30% indefinitely). If the curve slopes continuously toward zero, the product lacks long-term value. Comparing cohorts vertically reveals whether product redesigns or onboarding improvements increased retention across successive customer generations.`,
      r`While cohort analysis monitors retention across months, funnel analysis diagnoses micro-conversions across minutes along a designated pathway: (1) Visit Landing Page to (2) View Product Details to (3) Add to Basket to (4) Enter Shipping Info to (5) Complete Purchase. If 1,000 users add items to their basket but only 100 complete shipping details, the 90% drop-off points directly to friction: hidden shipping fees, checkout bugs, or cumbersome form fields.`,
    ],
    analogy: r`A hospital tracking recovery: cohort analysis monitors how patients admitted in January recuperate over subsequent months, while funnel analysis tracks the sequential intake journey from emergency triage to doctor consultation to discharge.`,
    steps: [
      r`Assign acquisition cohort timestamp: tag every user with their initial activation or registration period (e.g. Year-Month or Year-Week).`,
      r`Calculate relative lifecycle periods: compute the elapsed interval between each transaction and the user's cohort inception date ($\Delta t = t_{\text{event}} - t_{\text{cohort}}$).`,
      r`Construct cohort retention matrix: pivot customer activity counts into a matrix of cohort inception dates versus relative lifecycle periods, computing percentage retention.`,
      r`Map multi-step conversion funnel: define sequential steps along the user conversion journey with explicit completion criteria and time-to-convert attribution limits.`,
      r`Identify highest-leverage drop-off: evaluate step-to-step drop-off percentages and prioritize product fixes where the absolute lost volume is greatest.`,
    ],
    math: [
      {
        h: 'Cohort retention rate at lifecycle period k',
        tex: r`R_c(k) = \frac{|\mathcal{U}_c \cap \mathcal{A}_{c, k}|}{|\mathcal{U}_c|}`,
        p: r`Where $\mathcal{U}_c$ is the set of unique users acquired in cohort $c$, and $\mathcal{A}_{c, k}$ is the subset of those users who engaged in qualifying activity during lifecycle period $k$ ($k=0, 1, 2, \dots$).`,
      },
      {
        h: 'Funnel step-to-step and cumulative conversion rates',
        tex: r`\text{CR}_{s \to s+1} = \frac{N_{s+1}}{N_s}, \qquad \text{CR}_{\text{cumulative}} = \frac{N_S}{N_1} = \prod_{s=1}^{S-1} \text{CR}_{s \to s+1}`,
        p: r`Where $N_s$ is the number of distinct users who successfully completed stage $s$ within allowed time window $\tau$, and $S$ is the final terminal funnel step.`,
      },
      {
        h: 'Product-market fit retention asymptote',
        tex: r`\lim_{k \to \infty} R_c(k) = r_{\infty} > 0`,
        p: r`A strictly positive horizontal asymptote $r_{\infty} > 0$ demonstrates that a core percentage of users retain indefinitely, proving product-market fit and distinguishing sustainable businesses from churn treadmills.`,
      },
    ],
    keyPoints: [
      r`Cohort analysis unmasks true retention dynamics by separating user lifecycle age from external calendar seasonality.`,
      r`A flattening retention curve proves product-market fit; a curve that decays to zero indicates a leaky-bucket product.`,
      r`Funnel analysis pinpoints exact friction bottlenecks along sequential multi-step user conversion pathways.`,
    ],
    pitfalls: [
      r`Evaluating funnels without enforcing chronological sequence: counting users who visited a confirmation page prior to viewing a product.`,
      r`Omitting time-to-convert attribution windows: attributing a purchase made six months later to an initial promotional funnel.`,
      r`Blending heterogeneous acquisition channels into a single cohort, obscuring the fact that paid ads retain poorly while organic search retains strongly.`,
    ],
    code: r`import numpy as np

# 1. 3 acquisition cohorts across lifecycle months
cohort_sizes = np.array([1000, 1200, 1500])
m1_retention = np.array([0.42, 0.39, 0.41])
m2_retention = np.array([0.30, 0.28])

# 2. 4-step conversion funnel: Visits -> Product Views -> Add to Cart -> Purchase
funnel_counts = np.array([10000, 4500, 1200, 360])
step_conversion = funnel_counts[1:] / funnel_counts[:-1]
cumulative_conversion = funnel_counts[-1] / funnel_counts[0]

print(f"Cohort Month 1 average retention: {np.mean(m1_retention):.1%}")
print(f"Funnel stage conversions: Views/Visits={step_conversion[0]:.1%}, Cart/Views={step_conversion[1]:.1%}, Buy/Cart={step_conversion[2]:.1%}")
print(f"End-to-end cumulative funnel conversion: {cumulative_conversion:.1%}")`,
    quiz: [
      {
        q: r`Why is looking solely at aggregate Monthly Active Users (MAU) potentially dangerous for an online platform?`,
        o: [
          r`Because MAU requires knowing user demographic data`,
          r`Because high user acquisition spending can mask severe underlying user churn, hiding a leaky-bucket product`,
          r`Because MAU cannot be calculated in SQL`,
          r`Because active user counts are strictly non-stationary`,
        ],
        a: 1,
        why: r`Aggregate MAU conflates incoming new users with retaining old users. If churn is high, aggressive marketing can maintain top-line numbers while the underlying product fails to retain anyone.`,
      },
      {
        q: r`What does a flattening horizontal retention curve signify in cohort analysis?`,
        o: [
          r`The product has achieved zero user churn across all cohorts`,
          r`The product has achieved product-market fit for a core group of users who find recurring value and continue using the product indefinitely`,
          r`The dataset has too few rows to calculate statistics`,
          r`All users have permanently uninstalled the application`,
        ],
        a: 1,
        why: r`A retention curve that flattens into an asymptote above zero proves that a stable percentage of users derive ongoing utility, establishing a solid foundation for sustainable growth.`,
      },
      {
        q: r`In funnel analysis, what is the significance of measuring step-to-step conversion rather than only cumulative top-to-bottom conversion?`,
        o: [
          r`It guarantees that all users complete the checkout flow`,
          r`It isolates the exact stage where the largest drop-off occurs, allowing engineering and product teams to target the specific friction point`,
          r`It allows the funnel to be calculated backwards from purchase to visit`,
          r`It eliminates the need for user tracking cookies`,
        ],
        a: 1,
        why: r`Step-to-step conversion pinpoints the specific friction bottleneck (e.g. payment gateway or address entry) where users abandon, directing engineering resources to the highest-impact fix.`,
      },
    ],
    usedBy: [],
    prereq: ['sql-for-analysis-joins-and-window-functions', 'pandas-and-polars-patterns'],
    related: ['metric-design-and-north-star-metrics', 'customer-segmentation-with-rfm', 'data-visualisation-principles'],
    keywords: 'cohort analysis funnel analysis retention curve product analytics churn conversion rate product market fit lifecycle drop off',
  },
  {
    id: 'customer-segmentation-with-rfm',
    short: 'Customer segmentation: RFM',
    title: 'Customer Segmentation with RFM',
    task: 'concepts',
    module: 'Product analytics',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Segmenting customer portfolios by Recency, Frequency, and Monetary value to identify VIPs, at-risk accounts, and targeted retention opportunities.`,
    lead: r`Treating all customers identically in marketing and product communication wastes budget on churned users while neglecting high-value advocates. Recency, Frequency, and Monetary value (RFM) analysis is a classic behavioural segmentation technique that translates transaction logs into actionable customer tiers. By scoring how recently a customer purchased, how often they purchase, and how much they spend, businesses can tailor messaging, automate win-back campaigns, and nurture customer lifetime value.`,
    intuition: [
      r`Consider an online retail store with 100,000 customers. Customer Alice spent £1,200 on three designer coats 18 months ago, but has not visited the website or opened an email since. Customer Bob spends £35 on coffee beans every three weeks, most recently two days ago (total historical spend £420). If you sort your customer database purely by total revenue, Alice appears to be your VIP. In reality, Alice has almost certainly churned, whereas Bob is an active, highly engaged brand advocate. RFM analysis separates these critical dynamics.`,
      r`The three RFM pillars represent distinct behavioural traits: Recency (R) measures the elapsed days since the customer's last purchase; customers who bought recently remain in an active buying mindset and respond warmly to communications. Frequency (F) measures the total count of distinct purchasing transactions over the observation window, reflecting loyalty and habitual brand trust. Monetary value (M) sums total expenditure, identifying high-margin revenue drivers.`,
      r`Customers are scored along each dimension from 1 to 5 (or 1 to 3) using quantile ranks. Combining scores creates actionable personas: a customer scored 5-5-5 is an elite Champion (bought recently, buys frequently, spends heavily). A customer scored 1-5-5 is a high-value customer At Risk (used to buy frequently and spend heavily, but has lapsed). Targeted CRM workflows can trigger personalised concierge check-ins or win-back incentives for at-risk accounts, while champions receive VIP previews and loyalty rewards.`,
    ],
    analogy: r`A restaurant manager greeting regulars: welcoming the patron who dined yesterday and visits weekly differently from someone who hosted an expensive private party two years ago and never returned.`,
    steps: [
      r`Select observation window and reference anchor date: set $T_{\text{ref}}$ as the day following the latest observed transaction in the log.`,
      r`Aggregate transaction histories per customer: calculate Recency ($T_{\text{ref}} - \max(t_i)$), Frequency (count of distinct orders), and Monetary value (sum of spend).`,
      r`Discretise metrics into ranked quantile tiers: assign scores from 1 to 5 using quantile thresholds, inverting Recency so lower elapsed days receive higher scores.`,
      r`Map score combinations to customer segments: cluster scores into actionable personas (e.g. Champions, Loyal Customers, At Risk, Hibernating).`,
      r`Deploy targeted marketing interventions: route segmented customer lists into automated email flows, loyalty tiers, or win-back discount campaigns.`,
    ],
    math: [
      {
        h: 'RFM raw metric formulations',
        tex: r`R_i = T_{\text{ref}} - \max_{j \in \mathcal{T}_i} t_{i, j}, \qquad F_i = |\mathcal{T}_i|, \qquad M_i = \sum_{j \in \mathcal{T}_i} v_{i, j}`,
        p: r`Where $\mathcal{T}_i$ is the set of completed orders for customer $i$, $t_{i, j}$ is the timestamp of transaction $j$, $v_{i, j}$ is the net revenue of that transaction, and $T_{\text{ref}}$ is the fixed reference evaluation date.`,
      },
      {
        h: 'Quantile ranking and scoring transformation',
        tex: r`S_{R, i} = K - \text{rank}_{\text{quantile}}(R_i; K) + 1, \qquad S_{F, i} = \text{rank}_{\text{quantile}}(F_i; K), \qquad S_{M, i} = \text{rank}_{\text{quantile}}(M_i; K)`,
        p: r`Where $K$ is the number of quantile tiers (typically $K=5$ or $K=3$). Recency ranking is inverted so that smaller elapsed durations map to higher scores ($S_{R}=K$ represents the freshest purchasers).`,
      },
      {
        h: 'Weighted composite RFM index',
        tex: r`\text{RFM\_Index}_i = w_R \cdot \tilde{R}_i + w_F \cdot \tilde{F}_i + w_M \cdot \tilde{M}_i, \qquad w_R + w_F + w_M = 1`,
        p: r`Where $\tilde{R}_i, \tilde{F}_i, \tilde{M}_i$ represent normalised continuous scores and weights $w_R, w_F, w_M$ are calibrated based on statistical correlation with 12-month forward customer retention.`,
      },
    ],
    keyPoints: [
      r`Recency is almost universally the single most predictive feature of future customer purchasing probability.`,
      r`Quantile binning establishes balanced segment cohorts and insulates scoring from extreme monetary outliers.`,
      r`RFM delivers immediate, interpretable customer segmentation without complex unsupervised machine learning infrastructure.`,
    ],
    pitfalls: [
      r`Treating Frequency as total unit quantity rather than distinct orders: purchasing 20 pairs of socks in a single transaction is frequency 1, not 20.`,
      r`Overweighting Monetary value over Recency: spending heavily two years ago does not make a customer active today.`,
      r`Using shifting calendar boundaries instead of a static reference anchor date, distorting recency metrics across customer cohorts.`,
    ],
    code: r`import numpy as np

np.random.seed(42)
n_cust = 150
recency = np.random.exponential(30, size=n_cust) + 1       # 1 to 150 days
frequency = np.random.poisson(4, size=n_cust) + 1          # 1 to 12 orders
monetary = frequency * np.random.gamma(40, 2, size=n_cust) # total spend

r33, r67 = np.percentile(recency, [33.3, 66.7])
r_score = np.where(recency <= r33, 3, np.where(recency <= r67, 2, 1))

f33, f67 = np.percentile(frequency, [33.3, 66.7])
f_score = np.where(frequency <= f33, 1, np.where(frequency <= f67, 2, 3))

m33, m67 = np.percentile(monetary, [33.3, 66.7])
m_score = np.where(monetary <= m33, 1, np.where(monetary <= m67, 2, 3))

champions = (r_score == 3) & (f_score == 3) & (m_score == 3)
at_risk = (r_score == 1) & (m_score >= 2)

print(f"Total customers: {n_cust}")
print(f"Champions (recent, frequent, high spend): {np.sum(champions)} users, avg spend {np.mean(monetary[champions]):.1f}")
print(f"At-Risk VIPs (high past spend, lapsed):    {np.sum(at_risk)} users, avg spend {np.mean(monetary[at_risk]):.1f}")`,
    quiz: [
      {
        q: r`In empirical retail studies, which of the three RFM dimensions is consistently the strongest predictor of a customer making another purchase?`,
        o: [
          r`Monetary value (total spend)`,
          r`Recency (time elapsed since last purchase)`,
          r`Frequency (total order count)`,
          r`Customer age in years`,
        ],
        a: 1,
        why: r`Recency is consistently the most predictive factor: customers who bought recently remain engaged in the buying cycle and demonstrate far higher responsiveness than lapsed customers.`,
      },
      {
        q: r`Why is Recency scoring inverted during RFM quantile transformation so that smaller elapsed day values receive higher scores?`,
        o: [
          r`To make the numbers negative for accounting purposes`,
          r`Because lower elapsed days represent more recent activity, which corresponds to higher customer engagement and buying propensity`,
          r`Because computers cannot sort numbers in ascending order`,
          r`To eliminate all customers who bought in the last 7 days`,
        ],
        a: 1,
        why: r`Higher RFM scores denote more desirable customer attributes. A customer who purchased yesterday (small elapsed days) is more valuable and engaged than one who purchased a year ago.`,
      },
      {
        q: r`How should a marketing team handle customers classified in the 'At Risk' segment (low Recency score, high Frequency and Monetary scores)?`,
        o: [
          r`Immediately delete their accounts from the database`,
          r`Trigger proactive win-back email sequences, special discounts, or personal outreach to re-engage valuable customers before they permanently churn`,
          r`Send them identical standard marketing emails sent to brand-new leads`,
          r`Charge them an additional subscription fee`,
        ],
        a: 1,
        why: r`At-Risk customers have proven high lifetime value and loyalty in the past, but their lack of recent activity warns of impending churn. Proactive win-back campaigns can recover significant revenue.`,
      },
    ],
    usedBy: [],
    prereq: ['exploratory-data-analysis', 'sql-for-analysis-joins-and-window-functions'],
    related: ['cohort-and-funnel-analysis', 'metric-design-and-north-star-metrics', 'kmeans_clustering'],
    keywords: 'rfm analysis customer segmentation recency frequency monetary value customer lifetime value crm product analytics retail segmentation',
  },
  {
  "id": "churn-and-retention-modelling",
  "short": "Churn & retention modelling",
  "title": "Customer Churn and Retention Modelling: Survival Analysis and Hazard Functions",
  "task": "concepts",
  "level": 2,
  "minutes": 17,
  "noLab": true,
  "summary": "Predicting customer attrition, right-censored lifespans, and intervention timing using Kaplan-Meier, Cox Proportional Hazards, and uplift classification.",
  "lead": "In subscription businesses and customer platforms, retaining existing customers is dramatically cheaper than acquiring new ones. However, framing churn simply as binary classification (churned vs not churned) discards the critical temporal dimension: when will the customer churn, and what is their survival probability over time? Survival analysis accounts for right-censoring to model the complete tenure curve and hazard dynamics.",
  "analogy": "Imagine clinical researchers studying patient recovery from a rare illness. When the clinical trial concludes after two years, some patients have fully recovered, while others are still undergoing treatment. The researchers cannot classify surviving patients as \"never recovering\" or discard them as missing data. Survival analysis mathematically incorporates the fact that ongoing patients survived at least two years without assuming they will never recover.",
  "intuition": [
    "In customer databases, active customers have not yet churned; their true eventual churn date lies in the future. This is classic right-censoring: we know their tenure is at least $T$ days, but we cannot observe their final lifespan.",
    "Standard binary classification models trained on a fixed time window (e.g. \"did the user churn in month 3?\") suffer from survivorship bias, window length sensitivity, and inability to predict expected remaining customer lifetime.",
    "Survival analysis models two core mathematical functions: the Survival function $S(t) = P(T > t)$ (the probability that a customer remains active past time $t$) and the Hazard function $\\lambda(t)$ (the instantaneous churn risk rate at time $t$ given survival up to $t$).",
    "The Kaplan-Meier estimator non-parametrically estimates the baseline survival curve across cohorts. The Cox Proportional Hazards semi-parametric model then evaluates how customer covariates (login frequency, support tickets, monthly spend) multiply the baseline hazard rate, allowing proactive retention interventions."
  ],
  "steps": [
    "Define churn event and observation window: Establish rigorous operational churn definitions (e.g. cancellation confirmation or 60 days of zero activity).",
    "Construct survival dataset: For each customer, record elapsed tenure $T_i$ and event indicator $E_i \\in \\{0, 1\\}$ ($1$ if churn was observed, $0$ if right-censored / still active).",
    "Fit non-parametric Kaplan-Meier curves: Estimate baseline retention trajectories across customer acquisition channels or subscription tiers.",
    "Fit Cox Proportional Hazards model: Estimate covariate hazard ratios $e^{\\beta_j}$ to quantify which behavioural features multiply or diminish churn risk.",
    "Validate proportional hazards assumption: Test Schoenfeld residuals to ensure covariate effects remain proportional across customer tenure.",
    "Deploy proactive retention triggers: Score active customers on cumulative churn hazard over the upcoming 30 days to trigger targeted customer success interventions."
  ],
  "math": [
    {
      "h": "Survival Function and Cumulative Hazard",
      "tex": "S(t) = P(T > t) = \\exp\\left( -\\int_0^t \\lambda(u) \\, du \\right) = \\exp\\left( -\\Lambda(t) \\right)",
      "p": "The survival probability $S(t)$ decays as the cumulative hazard function $\\Lambda(t)$ accumulates over tenure $t$."
    },
    {
      "h": "Kaplan-Meier Non-Parametric Estimator",
      "tex": "\\hat{S}(t) = \\prod_{t_i \\le t} \\left( 1 - \\frac{d_i}{n_i} \\right)",
      "p": "Estimates survival curve step-by-step at event times $t_i$, where $d_i$ is the number of churn events and $n_i$ is the number of customers at risk immediately prior to $t_i$."
    },
    {
      "h": "Cox Proportional Hazards Formulation",
      "tex": "\\lambda(t \\mid \\mathbf{x}) = \\lambda_0(t) \\cdot \\exp\\left( \\boldsymbol{\\beta}^T \\mathbf{x} \\right)",
      "p": "Decomposes churn risk into an arbitrary baseline hazard $\\lambda_0(t)$ multiplied by an exponential linear combination of customer covariates $\\mathbf{x}$."
    }
  ],
  "code": "import numpy as np\nimport pandas as pd\n\ndef kaplan_meier_estimator(durations: np.ndarray, events: np.ndarray):\n    \"\"\"Compute non-parametric Kaplan-Meier survival curve.\"\"\"\n    # Sort chronologically by duration\n    order = np.argsort(durations)\n    d_sorted = durations[order]\n    e_sorted = events[order]\n    \n    unique_times = np.unique(d_sorted[e_sorted == 1])\n    n_at_risk = len(durations)\n    survival_prob = 1.0\n    km_curve = [(0.0, 1.0)]\n    \n    for t in unique_times:\n        # Count at risk and events at time t\n        at_risk = np.sum(d_sorted >= t)\n        deaths = np.sum((d_sorted == t) & (e_sorted == 1))\n        survival_prob *= (1.0 - deaths / at_risk)\n        km_curve.append((t, survival_prob))\n        \n    return km_curve\n\n# Sample customer tenure data: (tenure_months, churned: 1=churn, 0=active/censored)\ndurations = np.array([3, 5, 6, 8, 12, 12, 15, 18, 24, 24, 30, 36])\nevents = np.array([1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0])  # Several active customers\n\nkm = kaplan_meier_estimator(durations, events)\nprint(\"Customer Survival Curve (Kaplan-Meier):\")\nfor t, s in km:\n    print(f\"Month {t:2.0f} -> Survival Probability: {s * 100:.1f}%\")\n# Observe probability accounts for right-censored users who have not churned yet",
  "keyPoints": [
    "Survival analysis properly handles right-censored active customers without introducing survivorship bias.",
    "The survival function $S(t)$ gives the probability of a customer remaining past tenure $t$.",
    "The Cox model estimates hazard ratios: a feature with $\\exp(\\beta) = 1.40$ increases churn risk by 40% at any point in time.",
    "Enables proactive, time-aware interventions by predicting when churn probability spikes."
  ],
  "pitfalls": [
    "Discarding active customers: Throwing away active customers because their eventual outcome is unobserved biases the model heavily towards short-tenure churners.",
    "Treating active customers as non-churners: Coding active customers as $y=0$ in binary classification assumes they will stay forever, underestimating long-term churn.",
    "Violating proportional hazards: If a feature's effect changes drastically over time (e.g. onboarding discounts having large impact in month 1 but zero in month 12), standard Cox models must use time-varying covariates."
  ],
  "quiz": [
    {
      "q": "What is \"right-censoring\" in customer churn modelling?",
      "o": [
        "When customers leave bad reviews on external websites",
        "When a customer is still active at the end of the observation window, so their eventual churn time is unobserved but known to exceed their current tenure",
        "When data is stored on right-aligned database columns",
        "When a model overfits to the most recent training batch"
      ],
      "a": 1,
      "why": "Right-censoring occurs because active customers have not churned yet; we know their survival time is at least their current tenure, but not when they will eventually leave."
    },
    {
      "q": "In a Cox Proportional Hazards model, what does a hazard ratio of $\\exp(\\beta_j) = 1.35$ for a feature indicate?",
      "o": [
        "The customer will churn in exactly 1.35 months",
        "A one-unit increase in that feature increases the instantaneous churn rate by 35% at any given tenure point",
        "The customer has a 35% probability of never churning",
        "The feature is uncorrelated with customer retention"
      ],
      "a": 1,
      "why": "The hazard ratio multiplies the baseline hazard $\\lambda_0(t)$. A ratio of 1.35 corresponds to a 35% relative increase in instantaneous attrition risk."
    },
    {
      "q": "Why does standard binary classification (predicting churn yes/no over the next 90 days) fall short compared to survival analysis?",
      "o": [
        "Binary classification cannot handle numerical numbers",
        "It collapses the continuous time-to-event dimension into an arbitrary binary window and cannot distinguish between a customer churning tomorrow versus on day 89",
        "It requires calculating the inverse Fisher information matrix on GPUs",
        "Binary models cannot be evaluated with ROC curves"
      ],
      "a": 1,
      "why": "Binary classification loses temporal granularity and cannot estimate expected remaining customer lifespan or dynamic hazard curves over tenure."
    }
  ],
  "related": [
    "customer-segmentation-with-rfm",
    "cohort-and-funnel-analysis",
    "customer-lifetime-value"
  ],
  "keywords": "churn modelling, customer retention, survival analysis, kaplan-meier, cox proportional hazards, right-censoring, hazard function, customer lifetime",
  "usedBy": []
},
  {
  "id": "customer-lifetime-value",
  "short": "Customer lifetime value",
  "title": "Customer Lifetime Value (CLV): Buy 'Til You Die Models and Expected Value",
  "task": "concepts",
  "level": 2,
  "minutes": 17,
  "noLab": true,
  "summary": "Estimating future customer financial value in contractual and non-contractual settings using Pareto/NBD, BG/NBD, and Gamma-Gamma spend models.",
  "lead": "Customer Lifetime Value (CLV) is the definitive economic compass of customer-centric businesses, determining how much a company can afford to spend on customer acquisition (CAC), which customer segments merit bespoke VIP service, and how corporate equity should be valued. In non-contractual settings (e.g. e-commerce, hospitality), customers never notify a company when they leave—they simply stop buying. \"Buy 'Til You Die\" (BTYD) models probabilistically uncouple transaction frequency from the unobserved latent churn process.",
  "analogy": "Imagine a neighbourhood coffee shop. Regular patrons visit three times a week, but occasionally someone stops showing up. Did they move to another city (churned), or did they go on a three-week holiday and will return next week? BTYD probabilistic models act like an experienced barista who knows that for a customer who usually visits daily, a 10-day silence likely means they have moved away, whereas for a once-a-month customer, a 10-day gap is entirely normal.",
  "intuition": [
    "In contractual settings (SaaS, telecom), churn is directly observed via subscription cancellations, making CLV tractable through retention rate discount formulas: $\\mathrm{CLV} = \\mathrm{Margin} \\times \\frac{r}{1 + d - r}$.",
    "In non-contractual settings (e-commerce, retail), transactions occur at random intervals, and customer attrition is silent and unobserved. If a customer made 5 purchases last year and none in the last 6 months, are they dormant or dead?",
    "BTYD models (such as Pareto/NBD and the BG/NBD model by Fader et al.) capture this using two intertwined latent processes: while \"alive\", a customer makes repeat purchases according to a Poisson process with rate $\\lambda_i$; after each transaction, the customer has a probability $p_i$ of permanently dropping out (dying).",
    "Individual purchase rates $\\lambda_i$ and dropout probabilities $p_i$ vary across the customer base according to Gamma and Beta prior distributions, capturing customer heterogeneity. The separate Gamma-Gamma model estimates average monetary transaction value, completing the expected financial CLV calculation."
  ],
  "steps": [
    "Classify business regime: Determine whether business model is contractual (subscription) or non-contractual (retail/e-commerce).",
    "Aggregate customer RFM summary: For each customer, calculate frequency $x$ (number of repeat transactions), recency $t_x$ (time of last transaction), and total observation time $T$.",
    "Fit BG/NBD model: Estimate latent purchase rate parameters $(r, \\alpha)$ and dropout parameters $(a, b)$ via maximum likelihood estimation.",
    "Estimate latent alive probability: Compute $P(\\text{alive}_i \\mid x_i, t_{x,i}, T_i)$ to identify which customers are actively engaged vs dormant.",
    "Fit Gamma-Gamma monetary model: Model average transaction values to estimate expected spend per transaction conditional on customer history.",
    "Project discounted net present value: Multiply projected transaction counts over horizon $H$ by expected transaction margin, applying financial discount rate $d$."
  ],
  "math": [
    {
      "h": "Contractual Infinite-Horizon CLV",
      "tex": "\\mathrm{CLV} = \\sum_{t=1}^\\infty \\frac{M \\cdot r^t}{(1 + d)^t} = M \\cdot \\frac{r}{1 + d - r}",
      "p": "Calculates the net present value of expected cash margins $M$ under constant retention rate $r$ and annual discount rate $d$."
    },
    {
      "h": "BG/NBD Latent State Likelihood",
      "tex": "L(r, \\alpha, a, b \\mid x, t_x, T) = A_1 \\cdot A_2 \\cdot \\left( A_3 + \\mathbb{I}(x > 0) \\cdot A_4 \\right)",
      "p": "Formulates joint likelihood over observed repeat purchases $x$, recency $t_x$, and tenure $T$, integrating out unobserved customer death times."
    },
    {
      "h": "BG/NBD Probability of Being Alive",
      "tex": "P(\\text{alive} \\mid x, t_x, T) = \\left( 1 + \\frac{a}{b + x} \\left( \\frac{\\alpha + T}{\\alpha + t_x} \\right)^{r + x} \\right)^{-1}",
      "p": "Evaluates the probability that a customer remains active given their elapsed recency $(T - t_x)$ relative to their historical transaction frequency $x$."
    }
  ],
  "code": "import numpy as np\n\ndef contractual_clv(monthly_margin: float, monthly_retention: float, annual_discount: float) -> float:\n    \"\"\"Calculate Net Present Value CLV for subscription business.\"\"\"\n    # Convert annual discount rate to monthly\n    monthly_discount = (1.0 + annual_discount) ** (1.0 / 12.0) - 1.0\n    return monthly_margin * (monthly_retention / (1.0 + monthly_discount - monthly_retention))\n\ndef simple_p_alive_heuristic(recency: float, tenure: float, frequency: int) -> float:\n    \"\"\"Heuristic approximation of probability of being alive in non-contractual setting.\"\"\"\n    if frequency == 0:\n        return 0.5\n    avg_inter_arrival = recency / frequency\n    elapsed_since_last = tenure - recency\n    # Decay probability based on how many expected purchase cycles have elapsed since last seen\n    cycles_missed = elapsed_since_last / max(avg_inter_arrival, 1.0)\n    return float(1.0 / (1.0 + np.exp(cycles_missed - 2.0)))\n\n# Example 1: Contractual SaaS Customer ($100/mo margin, 95% monthly retention, 10% discount)\nsaas_clv = contractual_clv(monthly_margin=100.0, monthly_retention=0.95, annual_discount=0.10)\nprint(f\"Contractual SaaS Expected CLV: £{saas_clv:.2f}\")\n\n# Example 2: E-commerce Latent P(Alive)\n# Customer A bought 10 times in 100 days, last bought 5 days ago (tenure 105)\np_alive_a = simple_p_alive_heuristic(recency=100.0, tenure=105.0, frequency=10)\n# Customer B bought 10 times in 100 days, last bought 200 days ago (tenure 300)\np_alive_b = simple_p_alive_heuristic(recency=100.0, tenure=300.0, frequency=10)\n\nprint(f\"Customer A (5 days silent):   P(Alive) = {p_alive_a * 100:.1f}%\")\nprint(f\"Customer B (200 days silent): P(Alive) = {p_alive_b * 100:.1f}%\")",
  "keyPoints": [
    "CLV quantifies the total financial net present value a customer brings throughout their entire commercial relationship.",
    "Contractual businesses have explicit cancellations, modelled via retention discount formulas.",
    "Non-contractual businesses feature unobserved churn, requiring Buy 'Til You Die (BTYD / BG-NBD) models.",
    "Expected monetary value per transaction is typically modelled independently using a Gamma-Gamma distribution."
  ],
  "pitfalls": [
    "Applying historical average spend blindly: Assuming a customer who spent £1,000 in their first month will continue spending £1,000 every month ignores natural regression to the mean.",
    "Confusing revenue with gross margin: Calculating CLV on gross merchandise value (GMV) rather than contribution margin leads to catastrophic overspending on customer acquisition.",
    "Ignoring discounting: For long horizons (3–5 years), failing to discount future cash flows overstates present financial value."
  ],
  "quiz": [
    {
      "q": "Why are standard classification models inadequate for predicting customer churn and CLV in non-contractual e-commerce?",
      "o": [
        "Because retail customers sign legal contracts every time they purchase",
        "Because customers never declare when they churn; they simply stop purchasing, leaving the churn event unobserved and latent",
        "Because e-commerce databases cannot store dates",
        "Because e-commerce transactions only occur in integer increments"
      ],
      "a": 1,
      "why": "In non-contractual commerce, there is no cancellation notice. An unobserved drop-off must be probabilistically inferred from transaction frequency and recency."
    },
    {
      "q": "In the BG/NBD model, what happens to the estimated $P(\\text{alive})$ as the time elapsed since a customer's last purchase $(T - t_x)$ grows much larger than their typical inter-purchase interval?",
      "o": [
        "It increases exponentially towards 1.0",
        "It monotonically decays towards 0.0 as evidence of latent churn accumulates",
        "It remains exactly constant",
        "It oscillates as a sine wave"
      ],
      "a": 1,
      "why": "The longer a customer remains silent relative to their historical purchasing rhythm, the higher the probability that they have permanently dropped out."
    },
    {
      "q": "What is the fundamental business purpose of calculating Customer Lifetime Value (CLV)?",
      "o": [
        "To determine how much financial capital can be rationally spent to acquire a customer (CAC) and allocate retention resources",
        "To replace accounting audits required by tax authorities",
        "To automatically write code for website frontends",
        "To normalise input features to zero mean"
      ],
      "a": 0,
      "why": "CLV establishes the economic upper bound for Customer Acquisition Cost (CAC) and dictates optimal budget allocation for customer loyalty and VIP services."
    }
  ],
  "related": [
    "customer-segmentation-with-rfm",
    "churn-and-retention-modelling",
    "cohort-and-funnel-analysis"
  ],
  "keywords": "customer lifetime value, clv, ltv, buy til you die, bg-nbd, pareto-nbd, gamma-gamma, non-contractual churn, net present value",
  "usedBy": []
},
  {
  "id": "uplift-modelling",
  "short": "Uplift modelling",
  "title": "Uplift Modelling and Causal Machine Learning: Persuasion and Treatment Effects",
  "task": "concepts",
  "level": 3,
  "minutes": 17,
  "noLab": true,
  "summary": "Estimating Individual Treatment Effects (ITE) and Conditional Average Treatment Effects (CATE) using meta-learners (S-learner, T-learner, X-learner).",
  "lead": "Standard predictive models predict customer outcomes: who will renew their subscription or who will buy a product. However, targeting customers with the highest propensity to buy often wastes marketing budget on \"Sure Things\" who would have purchased anyway, while bothering \"Sleeping Dogs\" who cancel when contacted. Uplift modelling estimates the incremental causal impact of an intervention, identifying the persuadable segment where treatment changes behaviour.",
  "analogy": "Imagine a medical triage team administering a vaccine during an epidemic. Some patients will recover naturally on their own (Sure Things), some patients are unfortunately incurable regardless of treatment (Lost Causes), and some will experience dangerous allergic reactions if vaccinated (Sleeping Dogs). The vaccine should be reserved strictly for the Persuadables—the group whose recovery depends directly on receiving the medication.",
  "intuition": [
    "In causal inference, each individual $i$ has two potential outcomes: $Y_i(1)$ under treatment $W=1$ (e.g. receiving a marketing discount) and $Y_i(0)$ under control $W=0$. The Individual Treatment Effect is $\\tau_i = Y_i(1) - Y_i(0)$.",
    "Because an individual cannot simultaneously be treated and untreated (the Fundamental Problem of Causal Inference), we cannot observe both outcomes for the same person. Uplift modelling estimates the Conditional Average Treatment Effect (CATE) $\\tau(x) = \\mathbb{E}[Y(1) - Y(0) \\mid X = x]$.",
    "Meta-learners frame CATE estimation using standard supervised regression algorithms: The S-Learner (Single learner) includes the treatment indicator $W$ as a feature alongside $X$. However, if $X$ is high-dimensional, regularisation often shrinks the treatment effect towards zero.",
    "The T-Learner (Two learners) trains two independent models: $\\mu_1(x)$ on treated units and $\\mu_0(x)$ on control units, computing $\\hat{\\tau}(x) = \\hat{\\mu}_1(x) - \\hat{\\mu}_0(x)$. The X-Learner (Künzel et al.) uses imputed counterfactual residuals to dramatically outperform T-learners when treatment and control sample sizes are severely imbalanced.",
    "Uplift models are evaluated using Qini curves and Cumulative Gain charts, measuring the area under the incremental uplift curve (AUUC)."
  ],
  "steps": [
    "Collect randomised experiment data: Ensure training data derives from an A/B test where treatment assignment $W \\in \\{0, 1\\}$ is completely unconfounded ($W \\perp \\{Y(1), Y(0)\\} \\mid X$).",
    "Segment customers conceptually: Identify the four archetypes: Persuadables (uplift $> 0$), Sure Things (outcome $1$ regardless), Lost Causes (outcome $0$ regardless), and Sleeping Dogs (uplift $< 0$).",
    "Select meta-learner architecture: Use S-Learner for tiny datasets, T-Learner for balanced sample sizes, or X-Learner / Causal Forests for complex heterogeneous treatment effects.",
    "Estimate individual uplift scores: Compute $\\hat{\\tau}(x_i)$ for every candidate customer.",
    "Evaluate via Qini / Cumulative Gain curves: Rank holdout customers descending by uplift score and compute the cumulative incremental uplift over a random targeting baseline.",
    "Target positive uplift threshold: Deploy interventions exclusively to customers with $\\hat{\\tau}(x) > \\text{cost of treatment}$."
  ],
  "math": [
    {
      "h": "Conditional Average Treatment Effect (CATE)",
      "tex": "\\tau(x) = \\mathbb{E}[Y(1) - Y(0) \\mid X = x] = \\mathbb{E}[Y \\mid X = x, W = 1] - \\mathbb{E}[Y \\mid X = x, W = 0]",
      "p": "Under unconfoundedness, CATE is identified as the difference between conditional regression surfaces in the treated and control populations."
    },
    {
      "h": "T-Learner Uplift Estimator",
      "tex": "\\hat{\\tau}_{T}(x) = \\hat{\\mu}_1(x) - \\hat{\\mu}_0(x), \\quad \\hat{\\mu}_1 = \\operatorname{Fit}(X_{\\mathrm{treat}}, Y_{\\mathrm{treat}}), \\; \\hat{\\mu}_0 = \\operatorname{Fit}(X_{\\mathrm{ctrl}}, Y_{\\mathrm{ctrl}})",
      "p": "Fits two independent supervised models and evaluates their difference, eliminating the risk of treatment feature shrinkage."
    },
    {
      "h": "Qini Metric for Causal Evaluation",
      "tex": "Q(n) = Y_1(n) - Y_0(n) \\cdot \\frac{N_1(n)}{N_0(n)}",
      "p": "Measures cumulative incremental conversions among the top $n$ ranked customers, scaling control responses by the treatment-to-control ratio."
    }
  ],
  "code": "import numpy as np\nfrom sklearn.ensemble import GradientBoostingRegressor\n\n# Simulate A/B test data with heterogeneous treatment effects\nnp.random.seed(42)\nN = 1000\n# Features: x0 (baseline loyalty), x1 (price sensitivity)\nX = np.random.uniform(0, 1, size=(N, 2))\n# Randomised treatment assignment (50% treated)\nW = np.random.binomial(1, 0.5, size=N)\n\n# Baseline conversion without discount: high loyalty x0 buys naturally\ny0 = (X[:, 0] > 0.6).astype(float)\n# True treatment effect: discount only persuades price-sensitive users with high x1\ntrue_tau = 0.4 * X[:, 1] - 0.1 * X[:, 0]\n# Observed outcome\ny = np.clip(y0 + W * true_tau + np.random.normal(0, 0.05, N), 0, 1)\n\n# Fit T-Learner: two independent models\nidx_treat = (W == 1)\nidx_ctrl = (W == 0)\n\nmodel_treat = GradientBoostingRegressor(max_depth=3, random_state=42).fit(X[idx_treat], y[idx_treat])\nmodel_ctrl = GradientBoostingRegressor(max_depth=3, random_state=42).fit(X[idx_ctrl], y[idx_ctrl])\n\n# Predict Conditional Average Treatment Effect (CATE)\nX_test = np.array([\n    [0.9, 0.1],  # Sure Thing (high loyalty, low price sensitivity): tau ~ -0.05\n    [0.2, 0.9]   # Persuadable (low loyalty, high price sensitivity): tau ~ +0.34\n])\ncate_pred = model_treat.predict(X_test) - model_ctrl.predict(X_test)\n\nprint(f\"Customer 1 (Sure Thing) predicted uplift:   {cate_pred[0]:+.3f} (Do not send promo!)\")\nprint(f\"Customer 2 (Persuadable) predicted uplift:  {cate_pred[1]:+.3f} (Send promo!)\")",
  "keyPoints": [
    "Uplift modelling estimates the incremental causal effect of an intervention rather than baseline response propensity.",
    "Separates customers into Persuadables, Sure Things, Lost Causes, and Sleeping Dogs.",
    "T-learners fit independent models on treated and control cohorts to avoid regularising away treatment effects.",
    "Models are evaluated using Qini curves and Area Under the Uplift Curve (AUUC)."
  ],
  "pitfalls": [
    "Training on observational data with unmeasured confounders: If discounts were given only to high-spending users historically, models learn confounding bias rather than true causal uplift.",
    "Targeting high-propensity users: Relying on standard churn/conversion propensity scores causes companies to subsidise customers who would have converted anyway.",
    "S-Learner bias: In high-dimensional settings, an S-Learner tree model may never split on the treatment indicator $W$, predicting zero treatment effect everywhere."
  ],
  "quiz": [
    {
      "q": "Why is targeting customers based on standard response propensity (propensity to buy) often suboptimal compared to uplift modelling?",
      "o": [
        "Propensity models require non-linear neural networks",
        "High propensity customers are often \"Sure Things\" who would have purchased without any expensive promotional discount",
        "Propensity models cannot be evaluated with cross-validation",
        "Uplift models run ten times faster than propensity models"
      ],
      "a": 1,
      "why": "Propensity models identify who will buy, not who was caused to buy by the intervention. Marketing to Sure Things wastes budget with zero incremental revenue."
    },
    {
      "q": "In uplift segmentation terminology, who are the \"Sleeping Dogs\"?",
      "o": [
        "Customers who churn immediately after signup",
        "Customers who would remain positive or active if left alone, but react negatively (e.g. unsubscribe or cancel) when contacted",
        "Inactive accounts with zero transactions",
        "Bots and scrapers crawling the website"
      ],
      "a": 1,
      "why": "Sleeping Dogs have negative treatment effects: reminding them of a subscription reminds them to cancel, making the intervention actively destructive."
    },
    {
      "q": "What is the primary vulnerability of the single-model S-Learner when estimating treatment effects?",
      "o": [
        "It cannot process continuous outcomes",
        "Regularisation algorithms (like Lasso or tree depth penalties) can easily shrink or ignore the single treatment indicator column, falsely estimating zero uplift",
        "It requires two separate databases to run",
        "It divides by zero on unlabelled data"
      ],
      "a": 1,
      "why": "Because the treatment flag is just one feature among many, decision trees and regularised models frequently drop it, causing treatment effect estimates to vanish."
    }
  ],
  "related": [
    "churn-and-retention-modelling",
    "cohort-and-funnel-analysis",
    "a-b-testing-end-to-end"
  ],
  "keywords": "uplift modelling, causal inference, cate, treatment effects, t-learner, s-learner, x-learner, qini curve, sleeping dogs, persuadables",
  "usedBy": []
},
  {
    id: 'data-visualisation-principles',
    short: 'Data visualisation principles',
    title: 'Data Visualisation Principles',
    task: 'concepts',
    module: 'Communication',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Designing truthful, perceptually effective charts that exploit human visual encoding channels, minimise chartjunk, and prevent statistical distortion.`,
    lead: r`The most sophisticated machine learning model or analytical insight is useless if stakeholders misunderstand or distrust the visual communication. Data visualisation is not decorative graphic design; it is the science of mapping statistical numbers onto human visual perceptual channels in accordance with cognitive processing limits. Grounded in Edward Tufte's data-ink ratio and Cleveland and McGill's graphical perception hierarchy, disciplined visualisation ensures visual signals communicate truth with clarity and efficiency.`,
    intuition: [
      r`Imagine a corporate dashboard presenting quarterly sales. In Q1, revenue was £100M; in Q2, it rose to £105M—a modest 5% increase. The designer creates a bar chart with the vertical axis truncated to start at £95M rather than £0. On screen, the Q2 bar appears exactly twice as tall as the Q1 bar! Stakeholders glancing at the slide perceive an explosive 100% boom rather than a subtle 5% uptick. Truncating the baseline on length-encoded charts violates visual proportionality, misleading decision-makers and permanently eroding the data team's credibility.`,
      r`Humans do not decode all visual attributes with equal precision. Psychophysical experiments by William Cleveland and Robert McGill proved that human perception ranks visual encodings in a strict hierarchy of quantitative accuracy: (1) Position along a common aligned scale (scatter plots, dot plots) is decoded with the highest accuracy; (2) Length along a common scale (bar charts); (3) Angle and slope (line charts, pie charts); (4) 2D Area (bubble charts); and (5) Colour saturation and hue (heatmaps). Pie charts force human eyes to compare angles and 2D areas—a perceptual task humans perform notoriously poorly compared to evaluating aligned bar lengths.`,
      r`Edward Tufte formulated the central guideline of analytical design: maximise the data-ink ratio. Every pixel of ink or colour on the screen must serve an informative purpose. Non-data ink—decorative 3D shadowing, gratuitous dark gridlines, redundant legends, and rainbow colour palettes—creates visual clutter (chartjunk) that exhausts viewer working memory. Ruthlessly eliminating non-essential ink allows patterns, anomalies, and relationships to stand out effortlessly.`,
    ],
    analogy: r`An aircraft cockpit display: every altimeter, artificial horizon, and airspeed indicator uses high-contrast position encoding to deliver instant, unambiguous comprehension without decorative distraction.`,
    steps: [
      r`Map data types to appropriate perceptual channels: use position along an aligned scale for primary quantitative metrics, and distinct spatial clusters or restrained hue palettes for categories.`,
      r`Enforce zero baselines on bar charts: always anchor bar chart quantitative axes at zero to preserve physical length-to-magnitude proportionality.`,
      r`Maximise the Data-Ink Ratio: remove non-data borders, heavy background fills, dark gridlines, and redundant legends.`,
      r`Employ accessible, perceptually uniform colour maps: use monotonic luminance palettes (e.g. Viridis, Cividis) for ordered data, avoiding uncalibrated red-green contrasts that hinder colour-blind viewers.`,
      r`Provide direct inline annotation: label trend lines and data series directly at their endpoints rather than forcing viewers to cross-reference distant legends.`,
    ],
    math: [
      {
        h: 'Tufte data-ink ratio',
        tex: r`\text{Data-Ink Ratio} = \frac{\text{Data-Ink}}{\text{Total Ink Used to Print the Graphic}} = 1 - \frac{\text{Non-Data-Ink}}{\text{Total Ink}}`,
        p: r`Where Data-Ink is the non-redundant visual ink dedicated directly to displaying statistical data. Designing graphics to approach a ratio of $1.0$ minimises cognitive load and visual distraction.`,
      },
      {
        h: 'Lie factor (visual proportionality metric)',
        tex: r`\text{Lie Factor} = \frac{\text{Size of Effect Shown in Graphic}}{\text{Size of Effect in Data}} = \frac{\frac{\Delta \text{Graphic}}{\text{Graphic}_{\text{initial}}}}{\frac{\Delta \text{Data}}{\text{Data}_{\text{initial}}}}`,
        p: r`A truthful graphic exhibits a $\text{Lie Factor} = 1.0$. Values substantially greater than $1.0$ (such as truncating bar axes or scaling 2D areas as radii) exaggerate statistical differences; values less than $1.0$ understate effects.`,
      },
      {
        h: 'Stevens psychophysical power law of perceptual scaling',
        tex: r`S = k \cdot I^{\alpha}`,
        p: r`Where perceived subjective sensation $S$ scales with physical stimulus intensity $I$ raised to exponent $\alpha$. For line length $\alpha \approx 1.0$ (accurate linear perception), whereas for 2D area $\alpha \approx 0.7$ and 3D volume $\alpha \approx 0.5$ (severe perceptual compression), explaining why humans systematically misjudge area and volume encodings.`,
      },
    ],
    keyPoints: [
      r`Position along an aligned scale is decoded with the highest perceptual accuracy; area, angle, and colour saturation are significantly less precise.`,
      r`Bar charts must always start at zero because human vision decodes bar magnitude as proportional to bar length.`,
      r`Maximising the data-ink ratio strips non-essential chartjunk, reducing cognitive burden and clarifying core analytical signals.`,
    ],
    pitfalls: [
      r`Truncating the baseline on bar charts, producing Lie Factors far greater than 1.0 that mislead stakeholders.`,
      r`Using pseudo-3D bar or pie charts: 3D perspective adds artificial occlusion and distorts angle and area perception.`,
      r`Using rainbow colour palettes (e.g. Jet) where non-uniform perceptual luminance creates artificial boundaries in smooth continuous data.`,
    ],
    code: r`import numpy as np

# Lie Factor demonstration: Truthful bar baseline vs Deceptive truncated axis
data_v1, data_v2 = 100.0, 105.0  # True 5% increase
delta_data_pct = (data_v2 - data_v1) / data_v1

# 1. Truthful graphic: axis starts at 0
graphic_truth_v1, graphic_truth_v2 = data_v1, data_v2
lie_factor_truth = ((graphic_truth_v2 - graphic_truth_v1) / graphic_truth_v1) / delta_data_pct

# 2. Deceptive graphic: y-axis truncated to start at 95
y_min = 95.0
graphic_trunc_v1 = data_v1 - y_min  # bar height = 5
graphic_trunc_v2 = data_v2 - y_min  # bar height = 10 (2x taller on screen)
delta_graphic_pct = (graphic_trunc_v2 - graphic_trunc_v1) / graphic_trunc_v1
lie_factor_deceptive = delta_graphic_pct / delta_data_pct

print(f"True statistical increase: {delta_data_pct:.1%}")
print(f"Truthful axis Lie Factor:  {lie_factor_truth:.2f} (1.0 = perfectly truthful)")
print(f"Truncated axis Lie Factor: {lie_factor_deceptive:.2f} (20.0 = 20x visual exaggeration)")`,
    quiz: [
      {
        q: r`According to the Cleveland and McGill perceptual hierarchy, which visual encoding channel allows humans to compare quantitative numbers with the highest accuracy?`,
        o: [
          r`Colour saturation and hue`,
          r`Position along a common aligned scale (e.g. scatter plots, dot plots)`,
          r`Angle and slope (e.g. pie charts)`,
          r`2D bubble area`,
        ],
        a: 1,
        why: r`Cleveland and McGill proved that position along a common aligned scale is decoded with the lowest perceptual error, whereas area, angle, and colour saturation suffer significantly higher cognitive error.`,
      },
      {
        q: r`Why is truncating the quantitative axis to a non-zero baseline considered acceptable on line charts but strictly unacceptable on bar charts?`,
        o: [
          r`Line charts encode values via position in 2D space, whereas bar charts encode values via physical bar length, which must be proportional to magnitude`,
          r`Bar charts can only display negative numbers`,
          r`Line charts cannot be printed in black and white`,
          r`There is no difference; line charts must also always start at zero`,
        ],
        a: 0,
        why: r`Bar charts use length as the visual encoding, so human perception compares the physical length of bars. Truncating the axis distorts the length-to-value ratio. Line charts encode position, where displaying fine fluctuations around a high baseline is valid.`,
      },
      {
        q: r`What does a Lie Factor of 5.0 indicate about a data visualisation?`,
        o: [
          r`The chart took 5 hours to design`,
          r`The visual effect displayed on screen exaggerates the true statistical difference in the data by a factor of 5`,
          r`The data is five times more accurate than normal`,
          r`The chart contains five distinct data series`,
        ],
        a: 1,
        why: r`Tufte's Lie Factor is the ratio of the visual percentage change shown in the graphic to the true statistical percentage change in the data. A value of 5.0 means the graphic magnifies the effect fivefold.`,
      },
    ],
    usedBy: [],
    prereq: ['exploratory-data-analysis', 'metric-design-and-north-star-metrics'],
    related: ['cohort-and-funnel-analysis', 'customer-segmentation-with-rfm', 'data-cleaning-and-validation'],
    keywords: 'data visualisation principles data ink ratio lie factor edward tufte cleveland mcgill chartjunk perceptual hierarchy visual encoding',
  },
  {
  "id": "dashboards-and-storytelling",
  "short": "Dashboards & storytelling",
  "title": "Dashboards and Storytelling: Translating Analytical Insights into Executive Decisions",
  "task": "concepts",
  "level": 1,
  "minutes": 14,
  "noLab": true,
  "summary": "Structuring diagnostic dashboards, executive narrative hierarchies, cognitive load reduction, and action-oriented analytical storytelling.",
  "lead": "The most technically sophisticated machine learning model or analytical model is worthless if stakeholders cannot understand its findings or trust its recommendations. Dashboards and data storytelling bridge the gap between technical data science and business leadership. Crafting clear visual hierarchies, minimising cognitive clutter, and structuring narratives around actionable business decisions transforms raw metrics into operational impact.",
  "analogy": "Imagine an airplane cockpit versus an automobile speedometer. An aeronautical engineer might desire 80 dials showing fuel pump temperatures and hydraulic pressures, but an airline pilot navigating turbulence needs immediate, unmistakable indicators: airspeed, altitude, and artificial horizon. A great executive dashboard is not a data junkyard—it is a clear heads-up display designed for fast, accurate decisions.",
  "intuition": [
    "Data dashboards fail primarily due to three architectural errors: cognitive overload (stuffing every possible metric onto one screen), lack of narrative context (showing a number without showing whether it is good, bad, or expected), and lack of actionability (displaying metrics that business users cannot influence).",
    "Effective dashboard design adheres to the Five-Second Rule: within five seconds of opening the view, an executive should understand the current state of business performance (red/amber/green) and know where attention is required.",
    "Visual hierarchies follow the Inverted Pyramid narrative structure: high-level KPI scorecards at the top (What happened?), diagnostic breakdown charts in the middle (Why did it happen?), and granular tabular drill-downs at the bottom (What specific actions should be taken?).",
    "Storytelling with data structures insights around the classic narrative arc: Context (baseline performance) $\\to$ Conflict (an unexpected metric deviation or emerging bottleneck) $\\to$ Resolution (data-backed recommendations for corrective action)."
  ],
  "steps": [
    "Define core audience and decision mandate: Determine whether the dashboard serves C-level executives (strategic KPI tracking), managers (operational diagnosis), or frontline analysts (granular drill-down).",
    "Establish primary KPI scorecard: Place 3 to 5 core outcome metrics at the top with explicit baseline comparisons (vs prior week, vs budget, vs forecast).",
    "Design diagnostic breakdowns: Use bar charts, waterfall charts, or cohort heatmaps to explain variance by geography, customer segment, or product line.",
    "Minimise non-data ink: Strip away decorative 3D effects, heavy gridlines, dark borders, and saturated rainbow palettes (Edward Tufte's data-to-ink ratio).",
    "Enforce visual consistency: Ensure colours carry uniform semantic meaning throughout (e.g. green strictly indicates positive performance, amber indicates warning, blue indicates neutral categories).",
    "Frame insights as actionable recommendations: Accompany visual charts with concise narrative callouts summarising the primary takeaway and recommended next step."
  ],
  "math": [
    {
      "h": "Data-to-Ink Ratio (Tufte Formulation)",
      "tex": "\\mathrm{DIR} = \\frac{\\text{Data-Ink}}{\\text{Total Ink Used to Produce Graphic}} = 1.0 - \\text{Proportion of Decorative Clutter}",
      "p": "Maximising the data-to-ink ratio eliminates non-informational visual noise, reducing viewer cognitive load."
    },
    {
      "h": "Period-over-Period Variance Attribution",
      "tex": "\\Delta Y = Y_t - Y_{t-1} = \\sum_{k=1}^K \\left( w_{k,t} y_{k,t} - w_{k,t-1} y_{k,t-1} \\right)",
      "p": "Decomposes aggregate KPI shifts into component volume effects ($w_k$) and rate effects ($y_k$) across business segments in waterfall charts."
    },
    {
      "h": "Cognitive Chunking Capacity (Miller's Law)",
      "tex": "N_{\\mathrm{metrics}} \\le 7 \\pm 2 \\implies \\text{Target } 3 \\text{ to } 5 \\text{ Primary KPIs per Screen}",
      "p": "Human working memory processes at most 5–9 distinct visual elements simultaneously without experiencing comprehension degradation."
    }
  ],
  "code": "import matplotlib.pyplot as plt\nimport numpy as np\n\n# Executive waterfall chart: Explaining revenue variance from Budget to Actual\ncategories = ['Budget', 'Volume (+)', 'Price (+)', 'Churn (-)', 'FX Drift (-)', 'Actual']\ndeltas = [100.0, 15.0, 8.0, -12.0, -5.0, 0.0]  # Final value calculated as sum\n\n# Calculate cumulative waterfall positions\nbottoms = [0.0]\nrunning = 100.0\nfor d in deltas[1:-1]:\n    if d > 0:\n        bottoms.append(running)\n        running += d\n    else:\n        running += d\n        bottoms.append(running)\nbottoms.append(0.0)  # Actual starts from ground\ndeltas[-1] = running  # Actual total\n\ncolours = ['#334155', '#10B981', '#10B981', '#EF4444', '#EF4444', '#1E40AF']\n\nfig, ax = plt.subplots(figsize=(8, 4.5))\nbars = ax.bar(categories, [abs(d) for d in deltas], bottom=bottoms, colour=colours, width=0.55)\n\n# Formatting: Clean typography, high data-to-ink ratio\nax.spines['top'].set_visible(False)\nax.spines['right'].set_visible(False)\nax.yaxis.grid(True, linestyle='--', alpha=0.3)\nax.set_ylabel('Revenue (£M)', fontsize=11, fontweight='bold')\nax.set_title('Executive Revenue Walk: Budget vs Actuals (£106M vs £100M)', fontsize=12, pad=15)\n\nprint(\"Executive Story: Revenue exceeded budget by £6M due to strong enterprise volume, despite £12M churn.\")",
  "keyPoints": [
    "Effective dashboards focus on actionable decisions rather than exhaustive data dumps.",
    "The inverted pyramid organizes views: top-level KPIs $\\to$ diagnostic breakdowns $\\to$ detailed records.",
    "Maximise the data-to-ink ratio by stripping away non-essential gridlines, 3D effects, and decorative colours.",
    "Analytical storytelling pairs visual charts with clear narrative context: Baseline $\\to$ Deviation $\\to$ Action."
  ],
  "pitfalls": [
    "Rainbow colour schemes: Using distinct bright colours for 15 categories forces users to constantly refer back and forth to legends, overwhelming working memory.",
    "Metrics without baselines: Displaying \"Weekly Revenue: £450,000\" provides zero value unless accompanied by context (e.g. \"-12% vs target\").",
    "Overloading a single dashboard: Attempting to build one monolithic dashboard that satisfies executives, engineers, and financial auditors simultaneously pleases nobody."
  ],
  "quiz": [
    {
      "q": "What does Edward Tufte's \"Data-to-Ink Ratio\" advocate in dashboard and chart design?",
      "o": [
        "Using as much colourful ink as possible to make reports vibrant",
        "Maximising the proportion of ink devoted strictly to communicating actual data while eliminating decorative clutter and non-informative borders",
        "Printing physical paper reports rather than viewing dashboards on monitors",
        "Using dark mode themes exclusively"
      ],
      "a": 1,
      "why": "The data-to-ink ratio states that the majority of ink should represent data. Non-data ink (heavy gridlines, borders, decorative ornaments) should be pruned."
    },
    {
      "q": "What is the \"Five-Second Rule\" in executive dashboard design?",
      "o": [
        "Dashboards must automatically refresh their database connections every five seconds",
        "A user should be able to discern the overall status of performance and identify primary problem areas within five seconds of viewing",
        "Visual animations must last at least five seconds to engage users",
        "Dashboards should be permanently deleted if not visited every five seconds"
      ],
      "a": 1,
      "why": "Executive dashboards must provide instant clarity. If an executive cannot grasp current status and anomalies within five seconds, the dashboard is overly complex."
    },
    {
      "q": "Which chart type is most effective for explaining how several positive and negative factors caused an outcome to deviate from its target budget?",
      "o": [
        "A 3D pie chart with 20 slices",
        "A waterfall chart (bridge chart) showing sequential positive and negative step contributions",
        "A radar chart with overlapping polygons",
        "A word cloud"
      ],
      "a": 1,
      "why": "Waterfall charts illustrate how an initial value increases or decreases through a series of intermediate steps to reach a final total, making variance attribution immediately obvious."
    }
  ],
  "related": [
    "data-visualisation-principles",
    "metric-design-and-north-star-metrics",
    "communicating-uncertainty"
  ],
  "keywords": "dashboards, data storytelling, data-to-ink ratio, tufte, waterfall chart, executive reporting, visual hierarchy, kpi scorecard, cognitive load",
  "usedBy": []
},
  {
  "id": "communicating-uncertainty",
  "short": "Communicating uncertainty",
  "title": "Communicating Uncertainty: Error Bars, Fan Charts, and Decision Risks",
  "task": "concepts",
  "level": 2,
  "minutes": 15,
  "noLab": true,
  "summary": "Presenting probabilistic estimates, prediction intervals, and risk bounds to non-technical stakeholders without creating decision paralysis.",
  "lead": "Machine learning engineers naturally think in terms of distributions, confidence intervals, and standard deviations. Non-technical decision makers, however, crave binary certainty: \"Will our revenue meet target or not?\" When technical teams conceal uncertainty by delivering single point estimates, businesses fail to build risk buffers and are blindsided when reality fluctuates. Communicating uncertainty effectively requires intuitive visual representations that convey risk without causing decision paralysis.",
  "analogy": "Imagine a weather app forecasting tomorrow's commute. If it says \"it will rain 3.2 mm\", you might leave your umbrella at home thinking 3.2 mm is negligible, only to get soaked by a torrential storm. If it shows \"80% chance of rain with potential downpours between 4 PM and 6 PM\", you immediately know to pack a raincoat and plan travel around the high-risk window.",
  "intuition": [
    "Concealing uncertainty produces the \"Flaw of Averages\": plans based on average assumptions fail on average because real-world costs and capacities are non-linear (e.g. a warehouse designed for average shipments overflows during peak days).",
    "Presenting uncertainty through raw technical jargon ($p$-values, standard errors, confidence vs prediction intervals) confuses stakeholders. Business leaders interpret a \"95% confidence interval\" as \"there is a 95% chance the true future value falls here\", conflating parameter estimation with future outcome spread.",
    "Visual metaphors matter: Standard error bars are frequently misread as \"the full range of possible values\". Gradient fan charts (shaded opacity ribbons), probability density strips, and hypothetical outcome plots (HOPs) visually reinforce that values near the centre are substantially more probable than extreme edges.",
    "Frame uncertainty in terms of operational decisions and risk thresholds rather than abstract probabilities. Instead of saying \"there is a 12% probability of stockout\", state: \"under this ordering policy, we expect a stockout once every 8 quarters, risking £45,000 in lost revenue.\""
  ],
  "steps": [
    "Distinguish confidence vs prediction intervals: Ensure communication explicitly differentiates uncertainty about an average model parameter from uncertainty about a single future customer outcome.",
    "Select visual metaphor: Use gradient fan charts for time series forecasts and violin / density strips for cross-sectional predictions, avoiding thin error bars.",
    "Present discrete scenarios alongside continuous bands: Pair probability intervals with concrete \"Bear / Base / Bull\" narrative scenario descriptions.",
    "Translate probabilities to frequencies and expected losses: Convert abstract percentiles into natural frequencies (e.g. \"1 in 10 chance\") and financial impact bounds.",
    "Highlight decision thresholds: Overlay the operational break-even or capacity limit line directly onto the probability distribution.",
    "Provide interactive sensitivity controls: Allow decision makers to adjust risk tolerance sliders (e.g. toggling from p50 median to p90 conservative risk posture)."
  ],
  "math": [
    {
      "h": "Prediction Interval vs Confidence Interval Width",
      "tex": "\\mathrm{Var}(\\hat{y}_{\\mathrm{pred}}) = \\underbrace{\\sigma^2}_{\\text{Irreducible Noise}} + \\underbrace{\\mathbf{x}_0^T (\\mathbf{X}^T \\mathbf{X})^{-1} \\mathbf{x}_0 \\sigma^2}_{\\text{Parameter Estimation Uncertainty}}",
      "p": "Prediction intervals for individual future instances are substantially wider than confidence intervals for the mean response because they incorporate irreducible observation variance $\\sigma^2$."
    },
    {
      "h": "Expected Value Under Uncertainty (Decision Rule)",
      "tex": "\\mathbb{E}[U(a)] = \\int_{-\\infty}^\\infty U(a, y) \\cdot p(y \\mid x) \\, dy",
      "p": "Optimal decision $a^*$ maximises expected utility by integrating payoff function $U(a, y)$ across the full predicted probability density $p(y \\mid x)$."
    },
    {
      "h": "Value at Risk (VaR) and Tail Risk",
      "tex": "P(L > \\mathrm{VaR}_\\alpha) = 1 - \\alpha, \\quad \\mathrm{CVaR}_\\alpha = \\mathbb{E}[L \\mid L > \\mathrm{VaR}_\\alpha]",
      "p": "Communicates financial downside risk by quantifying the threshold loss $\\mathrm{VaR}_\\alpha$ and the expected loss in the worst $(1 - \\alpha)$ tail."
    }
  ],
  "code": "import numpy as np\n\ndef explain_forecast_risk(p10: float, p50: float, p90: float, budget_target: float):\n    \"\"\"Translate quantile forecasts into actionable executive risk narrative.\"\"\"\n    iqr_spread = p90 - p10\n    skewness = \"symmetric\"\n    if (p90 - p50) > 1.3 * (p50 - p10):\n        skewness = \"skewed upside (high breakout potential)\"\n    elif (p50 - p10) > 1.3 * (p90 - p50):\n        skewness = \"skewed downside (vulnerable to severe drops)\"\n        \n    print(f\"=== Executive Uncertainty Briefing ===\")\n    print(f\"Base Case (Median):     £{p50:,.0f}\")\n    print(f\"80% Plausible Range:    £{p10:,.0f} to £{p90:,.0f} (Spread: £{iqr_spread:,.0f})\")\n    print(f\"Distribution Shape:     {skewness}\")\n    \n    if budget_target < p10:\n        print(f\"Target £{budget_target:,.0f} Assessment: Very Low Risk (>90% probability of meeting target).\")\n    elif budget_target <= p50:\n        print(f\"Target £{budget_target:,.0f} Assessment: Moderate Risk (~50-80% probability of meeting target).\")\n    elif budget_target <= p90:\n        print(f\"Target £{budget_target:,.0f} Assessment: High Risk (~10-50% probability; requires contingency).\")\n    else:\n        print(f\"Target £{budget_target:,.0f} Assessment: Critical Risk (<10% probability; budget unrealistic).\")\n\n# Scenario: Forecasting next quarter sales with downside volatility\nexplain_forecast_risk(p10=82000, p50=105000, p90=112000, budget_target=100000)",
  "keyPoints": [
    "Point forecasts conceal risk, leading to the \"Flaw of Averages\" in operations and budgeting.",
    "Prediction intervals model single future outcomes and are always wider than confidence intervals for the mean.",
    "Shaded fan charts and density strips communicate probability density far more intuitively than thin error bars.",
    "Translate probabilities into natural frequencies (\"1 in 5 years\") and clear financial loss boundaries."
  ],
  "pitfalls": [
    "Conflating confidence intervals with prediction intervals: Reporting a narrow 95% confidence interval for the average as if it represented individual customer outcomes severely understates real-world variance.",
    "Paralysing the audience with technical jargon: Spending meeting time debating heteroscedasticity rather than discussing operational risk buffers causes decision makers to ignore the model entirely.",
    "Presenting false symmetry: Applying $\\pm 10\\%$ symmetrically when real risk is heavily skewed towards catastrophic downside."
  ],
  "quiz": [
    {
      "q": "What is the \"Flaw of Averages\" in business decision making?",
      "o": [
        "Calculators fail when dividing by large integers",
        "Plans based on average assumptions fail on average because real-world costs and operational capacities respond non-linearly to fluctuations",
        "Averages are mathematically harder to compute than medians",
        "Every customer has an average lifetime value of zero"
      ],
      "a": 1,
      "why": "Because revenue, capacity limits, and stockout costs are non-linear, planning around a single average number fails whenever real-world demand swings above or below average."
    },
    {
      "q": "Why are prediction intervals substantially wider than confidence intervals for the regression mean?",
      "o": [
        "Prediction intervals include irreducible random noise $\\sigma^2$ inherent to an individual observation, whereas confidence intervals only reflect parameter estimation variance",
        "Prediction intervals are always calculated at the 99.9% level",
        "Confidence intervals ignore sample size",
        "Prediction intervals can only be computed with deep neural networks"
      ],
      "a": 0,
      "why": "A confidence interval bounds the mean of the population $\\mathbb{E}[y|x]$, which shrinks towards zero with large $N$. A prediction interval predicts a single individual outcome $y = \\hat{y} + \\epsilon$, which retains irreducible error $\\sigma^2$."
    },
    {
      "q": "What is the most effective way to communicate a 10% risk of system failure to non-technical operational managers?",
      "o": [
        "State that $p = 0.1000$ with 3 degrees of freedom",
        "Translate the probability into natural frequency: \"This system is expected to fail once every 10 quarters, with an estimated downtime cost of £50,000\"",
        "Refuse to share the number because 10% is statistically insignificant",
        "Tell them the failure is impossible because 90% is high"
      ],
      "a": 1,
      "why": "Cognitive research shows that natural frequencies (\"1 in 10\") paired with concrete operational impacts are understood far more accurately than raw decimal probabilities."
    }
  ],
  "related": [
    "probabilistic-forecasts-and-quantile-loss",
    "dashboards-and-storytelling",
    "confidence-intervals"
  ],
  "keywords": "communicating uncertainty, prediction intervals, error bars, fan charts, flaw of averages, risk communication, decision analysis, value at risk",
  "usedBy": []
},
  {
    id: 'docker-and-reproducible-environments',
    short: 'Docker and reproducibility',
    title: 'Docker and Reproducible Environments',
    task: 'concepts',
    module: 'MLOps and engineering',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Packaging machine learning models, system dependencies, and runtimes into immutable container images to eliminate deployment divergence.`,
    lead: r`A machine learning pipeline rarely fails because the mathematical weights are wrong; it fails because the target server runs Python 3.10 instead of 3.11, or lacks a specific C++ CUDA driver or OpenMP shared library. Docker packages the entire operating system user space, runtime binaries, pinned Python libraries, and serialised model artifacts into an immutable container image. This guarantees deterministic, byte-for-byte reproducibility from a data scientist's local workstation to production Kubernetes clusters.`,
    intuition: [
      r`Imagine spending three months developing a high-performing fraud detection model on your local laptop. In your local Jupyter environment, the code runs flawlessly and achieves 94% precision. You push the code to git and hand it over to the platform engineering team. On the production Linux server, the service crashes instantly on startup: ImportError: libgomp.so.1: cannot open shared object file: No such file or directory. The production operating system has an older Linux distribution lacking the multi-threading C library required by your gradient boosted tree package. You enter dependency hell, manually installing system libraries on production servers and risking breaking other running services.`,
      r`Virtual machines (VMs) solve isolation by bundling a complete guest operating system, including a full virtualised kernel, which makes them heavy (gigabytes in size) and slow to boot (minutes). Docker containers solve this using Linux kernel primitives: namespaces (which give each container an isolated view of process trees, networking, and filesystems) and cgroups (which enforce strict CPU and memory limits). Containers share the host OS kernel while maintaining completely isolated filesystems and user spaces, booting in milliseconds with negligible performance overhead.`,
      r`A Dockerfile is a declarative recipe where each instruction (FROM, COPY, RUN) creates an immutable, content-addressable filesystem layer. When you rebuild an image after editing your Python prediction script, Docker reuses cached layers for the base OS and compiled pip packages, rebuilding only the final layer in seconds. Once built, an image tagged with a git commit hash or semantic version is immutable: running docker run on AWS, GCP, Azure, or a colleague's laptop produces an identical, byte-for-byte reproducible execution environment.`,
    ],
    analogy: r`A standardised intermodal shipping container: whether transporting electronics, fresh fruit, or auto parts, the container has universal corner castings so cranes and cargo ships can load it without caring about what is packed inside.`,
    steps: [
      r`Select a minimal, secure base image: choose official slim or distroless images (e.g. python:3.11-slim) rather than bloated full OS distributions.`,
      r`Structure Dockerfile instructions to maximise layer caching: copy dependency manifests (requirements.txt or pyproject.toml) and execute pip install before copying volatile application source code.`,
      r`Implement multi-stage builds: compile heavy dependencies (C++ build tools, wheel compilers) in a builder stage, copying only compiled artifacts into a lightweight production runtime image.`,
      r`Pin exact dependency versions: lock strict semantic versions for every library in requirements.txt to prevent silent upstream breaking updates during container rebuilds.`,
      r`Execute under a non-root service user: create an unprivileged user inside the container to prevent potential container breakout vulnerabilities in production clusters.`,
    ],
    math: [
      {
        h: 'Union filesystem layer composition',
        tex: r`\mathcal{F}_{\text{image}} = \mathcal{L}_0 \oplus \mathcal{L}_1 \oplus \dots \oplus \mathcal{L}_K, \qquad \mathcal{F}_{\text{container}} = \mathcal{F}_{\text{image}} \cup \mathcal{L}_{\text{R/W}}`,
        p: r`Where each layer $\mathcal{L}_k$ is an immutable read-only differential changeset (using overlayfs), and $\mathcal{L}_{\text{R/W}}$ is the ephemeral copy-on-write layer instantiated when a container process starts. Modifying files affects only the top writable layer, keeping the underlying base image pristine.`,
      },
      {
        h: 'Content-addressable cryptographic layer digest',
        tex: r`\text{Digest}(\mathcal{L}_k) = \text{SHA-256}\left(\text{tar}(\Delta \mathcal{F}_k)\right)`,
        p: r`Every layer is uniquely identified by the cryptographic hash of its filesystem diff. If the instruction and input context for step $k$ do not change, Docker reuses the cached layer instantly without rebuilding.`,
      },
      {
        h: 'Container resource cgroup boundary constraints',
        tex: r`\sum_{p \in \mathcal{P}_{\text{container}}} \text{CPU}_p(t) \le C_{\text{quota}} \cdot \frac{t}{\text{period}}, \qquad \sum_{p \in \mathcal{P}_{\text{container}}} \text{Mem}_p(t) \le M_{\text{limit}}`,
        p: r`Where Linux cgroups strictly throttle CPU quotas and enforce hard memory limits. If model memory allocation breaches $M_{\text{limit}}$, the Linux kernel terminates the container process with an Out-Of-Memory (OOM-killer) signal, protecting the host machine from exhaustion.`,
      },
    ],
    keyPoints: [
      r`Containers provide lightweight OS-level virtualisation via Linux kernel namespaces and cgroups, sharing the host kernel with zero hypervisor overhead.`,
      r`Instruction ordering in Dockerfiles governs build speed: place slow-changing dependencies early and rapid-changing source code last.`,
      r`Multi-stage builds dramatically reduce image footprint and attack surface by stripping compilers from final runtime containers.`,
    ],
    pitfalls: [
      r`Copying application source code before installing dependencies: every minor code edit invalidates the pip install cache, forcing 10-minute builds.`,
      r`Running containers as the root user: container breakouts can grant root privileges on the underlying host node.`,
      r`Using unpinned base image tags like python:latest: an unexpected upstream update to Python 3.12 can break compiled dependencies overnight.`,
    ],
    code: r`# Simulation of Docker content-addressable layer caching
import hashlib

def hash_layer(name, content):
    return hashlib.sha256((name + ":" + content).encode()).hexdigest()[:12]

# Initial cold build: all layers built from scratch
layers_spec = [
    ("Base OS", "python:3.11-slim"),
    ("System Dependencies", "gcc libgomp1"),
    ("Python Libraries", "numpy==1.26.0 scipy==1.11.0"),
    ("App Code", "v1.0.0 def predict(): return 1")
]

cache = {}
cold_build_time = 0.0
for name, content in layers_spec:
    h = hash_layer(name, content)
    cache[name] = h
    cold_build_time += 10.0  # cold build duration per layer

# Rebuild with ONLY application code updated
layers_spec_v2 = [
    ("Base OS", "python:3.11-slim"),
    ("System Dependencies", "gcc libgomp1"),
    ("Python Libraries", "numpy==1.26.0 scipy==1.11.0"),
    ("App Code", "v1.0.1 def predict(): return 2")
]

cache_hits, rebuild_time = 0, 0.0
for name, content in layers_spec_v2:
    h = hash_layer(name, content)
    if cache.get(name) == h:
        cache_hits += 1
        rebuild_time += 0.1  # cache retrieval
    else:
        rebuild_time += 10.0 # rebuild layer

print(f"Total layers: {len(layers_spec_v2)}, Cached layers: {cache_hits}")
print(f"Cold build time: {cold_build_time:.1f}s vs Cached rebuild time: {rebuild_time:.1f}s")
print(f"Build acceleration factor: {cold_build_time / rebuild_time:.1f}x")`,
    quiz: [
      {
        q: r`Why does Docker recommend copying requirements.txt and running pip install before copying the rest of the application source code in a Dockerfile?`,
        o: [
          r`Because pip install cannot run if Python source files exist in the directory`,
          r`To take advantage of Docker layer caching, so third-party library installations are reused unless requirements.txt itself changes`,
          r`Because requirements.txt must always be placed in the root directory /`,
          r`To convert Python libraries into compiled C binaries`,
        ],
        a: 1,
        why: r`Docker caches each layer by comparing instruction text and file checksums. Putting requirements.txt first ensures that edits to application code do not invalidate the cached pip installation layer.`,
      },
      {
        q: r`What is the primary operational difference between a Docker container and a traditional Virtual Machine (VM)?`,
        o: [
          r`Containers cannot run Python code`,
          r`Containers share the host operating system kernel and isolate user space via namespaces and cgroups, whereas VMs bundle an entire guest operating system and virtual kernel`,
          r`VMs cannot connect to the internet`,
          r`Containers take hours to boot, while VMs boot in milliseconds`,
        ],
        a: 1,
        why: r`Containers leverage OS-level virtualisation, sharing the host Linux kernel while isolating processes and filesystems, providing instant startup and negligible resource overhead compared to hypervisor VMs.`,
      },
      {
        q: r`What is the purpose of a multi-stage build in a production machine learning Dockerfile?`,
        o: [
          r`To train two different models in parallel inside the container`,
          r`To separate heavy build-time compilers and headers from the final runtime image, drastically reducing image size and security attack surface`,
          r`To convert the Docker image into a virtual machine image`,
          r`To run unit tests automatically on the developer's laptop`,
        ],
        a: 1,
        why: r`Multi-stage builds allow compiling libraries in an initial build container, copying only the resulting wheels or binaries into a clean slim container, leaving compilers and build tools behind.`,
      },
    ],
    usedBy: [],
    prereq: ['data-cleaning-and-validation', 'scikit-learn-pipelines-and-columntransformer'],
    related: ['serving-models-with-fastapi', 'batch-vs-online-inference', 'train-validation-test-splits-group-and-time-based'],
    keywords: 'docker containerization reproducible environments dockerfile cgroups namespaces oom killer image layers multi-stage build mlops',
  },
  {
    id: 'serving-models-with-fastapi',
    short: 'Serving models with FastAPI',
    title: 'Serving Models with FastAPI',
    task: 'concepts',
    module: 'MLOps and engineering',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Building high-throughput, low-latency prediction microservices with asynchronous concurrency, strict Pydantic schema validation, and health probes.`,
    lead: r`A trained machine learning model stored as a serialised weights file cannot deliver business value until other software systems can query it over the network. FastAPI has become the standard framework for Python model serving, pairing asynchronous concurrency with automated OpenAPI documentation and Pydantic schema validation. Architecting endpoints with application lifespan handlers, payload validation, and non-blocking worker pools ensures models serve live predictions in milliseconds under high concurrent traffic.`,
    intuition: [
      r`During model training, you run batch inference across a static test dataframe. In production, a mobile app sends a single JSON payload over HTTP: {"user_id": 412, "transaction_amount": 89.50, "merchant_category": "electronics"} and expects a fraud probability response within 50 milliseconds. If you wrap your model in a naive synchronous Flask script, each incoming HTTP request blocks the server process. If 50 users submit transactions simultaneously, request #50 sits in a queue waiting several seconds for the earlier 49 requests to finish, triggering client timeouts.`,
      r`FastAPI is built on Starlette and Pydantic, running inside an asynchronous ASGI server like Uvicorn. When a request arrives, FastAPI validates the JSON payload types automatically: if transaction_amount is missing or passed as text "invalid", Pydantic returns an explicit HTTP 422 Unprocessable Entity error immediately, protecting your model from missing-value exceptions. Asynchronous event loops allow the server to handle I/O-bound tasks (such as retrieving user embeddings from a database or Redis cache) concurrently without blocking other client requests.`,
      r`A critical architectural pattern is model lifecycle management. Loading a 1GB deep learning model or an ensemble of 500 gradient boosted trees takes several seconds. A common beginner trap is loading the model inside the prediction route function, which forces the server to reload model weights from disk on every single HTTP request! FastAPI's lifespan context manager loads the model into memory once at application startup, keeping weights warm in RAM for sub-millisecond evaluation.`,
    ],
    analogy: r`A sushi restaurant kitchen: the head chef keeps knives sharp and ingredients prepared on the counter at opening time (startup lifespan), while waitstaff validate order tickets (Pydantic) and ferry plates continuously without making customers wait for the kitchen to be built from scratch.`,
    steps: [
      r`Define strict input and output data contracts: build Pydantic BaseModel schemas declaring expected field types, default values, and numerical constraints.`,
      r`Manage model lifecycle via lifespan context: load serialised model artifacts into memory once during application startup, storing them in app state.`,
      r`Implement dedicated health check endpoints: expose /healthz/live (process is alive) and /healthz/ready (model weights loaded and ready to serve).`,
      r`Offload CPU-bound inference: wrap heavy NumPy or PyTorch matrix computations in thread pools (run_in_threadpool) to avoid freezing the async event loop.`,
      r`Configure production ASGI server: deploy Uvicorn with multiple worker processes pinned behind a reverse proxy (e.g. Nginx or Kubernetes ingress).`,
    ],
    math: [
      {
        h: 'Little\'s Law for concurrent request capacity',
        tex: r`L = \lambda \cdot W`,
        p: r`Where $L$ is the average number of concurrent in-flight requests inside the service, $\lambda$ is incoming request arrival rate (requests per second), and $W$ is average response latency. If model latency $W$ is $50\text{ms}$ ($0.05\text{s}$) and traffic $\lambda$ is $1,000\text{ req/s}$, the service must maintain $L = 50$ concurrent connections without degradation.`,
      },
      {
        h: 'Latency percentile bounds (tail SLA compliance)',
        tex: r`p_{99} = \inf \{ \ell \mid F_{\text{latency}}(\ell) \ge 0.99 \}`,
        p: r`Where $F_{\text{latency}}$ is the empirical cumulative distribution of request latency. In production microservice architectures, service-level agreements enforce tail constraints (e.g. $p_{99} \le 100\text{ms}$) to prevent downstream timeouts during traffic spikes.`,
      },
      {
        h: 'Asynchronous throughput scaling factor',
        tex: r`\text{RPS}_{\max} = \frac{N_{\text{workers}}}{T_{\text{CPU}} + T_{\text{I/O}} / C_{\text{async}}}`,
        p: r`Where $N_{\text{workers}}$ is the number of operating system worker processes, $T_{\text{CPU}}$ is non-preemptible inference compute time, $T_{\text{I/O}}$ is waiting time for network or database calls, and $C_{\text{async}}$ is the asynchronous concurrent multiplexing factor.`,
      },
    ],
    keyPoints: [
      r`FastAPI uses Pydantic to enforce strict data contracts at the API gateway, returning HTTP 422 before malformed payloads reach model code.`,
      r`Model weights must be loaded exactly once during application startup lifespan, never reloaded inside request handler routes.`,
      r`CPU-intensive inference must not block the main async event loop; offload heavy computations to worker thread pools.`,
    ],
    pitfalls: [
      r`Loading serialised weights inside the request handler: reloading a 500MB model on every query spikes latency from 5ms to 2,000ms.`,
      r`Running heavy CPU-bound inference directly in async def functions: long compute blocks freeze the single-threaded event loop, starving other incoming requests.`,
      r`Missing input schema validation: passing unvalidated raw JSON dictionaries directly to model.predict() causes unhandled 500 crashes on missing keys.`,
    ],
    code: r`import numpy as np

# Mock Pydantic validation and Model serving
class RequestValidator:
    @staticmethod
    def validate(payload):
        # Validate schema: 'amount' must be positive float, 'age' positive int >= 18
        if 'amount' not in payload or not isinstance(payload['amount'], (int, float)) or payload['amount'] <= 0:
            return False, "HTTP 422: Invalid or missing 'amount'"
        if 'age' not in payload or not isinstance(payload['age'], int) or payload['age'] < 18:
            return False, "HTTP 422: Invalid or underage 'age'"
        return True, "HTTP 200: Valid"

# Mock Model loaded once during lifespan startup
weights = np.array([0.05, 0.01])
bias = -2.0

requests = [
    {"amount": 120.0, "age": 35},       # valid
    {"amount": -50.0, "age": 28},       # invalid amount (422)
    {"amount": 450.0, "age": 16},       # invalid age (422)
    {"amount": 80.0,  "age": 42},       # valid
]

success, rejected = 0, 0
for r in requests:
    is_valid, msg = RequestValidator.validate(r)
    if is_valid:
        features = np.array([r['amount'], r['age']])
        prob = 1.0 / (1.0 + np.exp(-(np.dot(weights, features) + bias)))
        success += 1
    else:
        rejected += 1

print(f"Incoming requests processed: {len(requests)}")
print(f"Valid HTTP 200 predictions: {success}, Schema rejections HTTP 422: {rejected}")
print(f"Sample prediction for request 0: p(fraud) = {prob:.3f}")`,
    quiz: [
      {
        q: r`Why should a machine learning model artifact be loaded inside FastAPI's lifespan event rather than inside the endpoint route function?`,
        o: [
          r`Because lifespan events convert the model from Python to C++ automatically`,
          r`To load the model into memory once at application startup, avoiding massive disk I/O latency spikes on every individual HTTP request`,
          r`Because FastAPI routes cannot access NumPy arrays`,
          r`To ensure the model is deleted after every prediction`,
        ],
        a: 1,
        why: r`Loading a model from disk takes hundreds of milliseconds or seconds. Doing this inside a request handler causes unacceptable latency and memory fragmentation. Lifespan handlers keep the model in memory.`,
      },
      {
        q: r`What HTTP status code does FastAPI return by default when an incoming JSON payload fails Pydantic schema validation?`,
        o: [
          r`HTTP 200 OK`,
          r`HTTP 422 Unprocessable Entity`,
          r`HTTP 500 Internal Server Error`,
          r`HTTP 404 Not Found`,
        ],
        a: 1,
        why: r`FastAPI uses Pydantic to inspect request payloads; if required fields are missing or have incorrect datatypes, it automatically returns HTTP 422 with a structured error explanation.`,
      },
      {
        q: r`Why should CPU-intensive model inference not be executed directly in an 'async def' route handler in FastAPI?`,
        o: [
          r`Because async def functions are only allowed to return strings`,
          r`Because CPU-bound execution blocks the single-threaded asyncio event loop, preventing the server from handling other incoming network connections`,
          r`Because async def functions cannot use NumPy or PyTorch`,
          r`Because the operating system terminates async functions after 1 millisecond`,
        ],
        a: 1,
        why: r`The asyncio event loop runs on a single thread. If an async function performs heavy non-preemptible CPU computations, the event loop freezes, stalling all concurrent connections. Heavy compute should run in worker thread pools.`,
      },
    ],
    usedBy: [],
    prereq: ['docker-and-reproducible-environments', 'scikit-learn-pipelines-and-columntransformer'],
    related: ['batch-vs-online-inference', 'data-leakage', 'time-series-cross-validation'],
    keywords: 'fastapi model serving uvicorn pydantic asgi api microservice latency p99 async inference schema validation',
  },
  {
    id: 'batch-vs-online-inference',
    short: 'Batch vs online inference',
    title: 'Batch vs Online Inference',
    task: 'concepts',
    module: 'MLOps and engineering',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Architecting prediction systems across offline precomputed batch pipelines and real-time streaming services, evaluating latency, throughput, and freshness trade-offs.`,
    lead: r`Not all machine learning models belong behind a live HTTP endpoint. Batch inference scores millions of records offline on scheduled pipelines, maximising hardware throughput and amortising computational cost. Online inference generates predictions on-demand in milliseconds using live streaming features, delivering immediate personalisation at the cost of operational complexity. Selecting the right inference pattern—or combining them in a hybrid two-tower architecture—is a fundamental system design decision.`,
    intuition: [
      r`Consider two contrasting machine learning applications at a major retail bank. Application A computes weekly credit card churn risk scores for 10 million customers to trigger targeted retention emails. Nobody needs to know a customer's churn score in 20 milliseconds while they are browsing an app; computing scores every Sunday night in an offline batch job using high-throughput Spark or SQL clusters is cheap, robust, and cost-effective. Application B evaluates credit card transactions for fraud: when a customer taps their card at a terminal, the bank has 50 milliseconds to approve or decline the purchase. Computing fraud scores offline the night before is impossible because the transaction features (merchant, location, amount) did not exist until the card was tapped.`,
      r`The choice between batch and online inference balances cost, latency, and feature freshness. Batch inference prioritises throughput and cost-efficiency: you can run heavy ensembles or compute complex aggregations (e.g. 90-day rolling spend) across full tables, writing precomputed predictions directly into a low-latency key-value cache (like Redis). The downside is staleness: predictions reflect data as of the last batch run. Online inference guarantees maximum freshness: predictions react instantly to a user's latest in-session clicks. However, online inference demands dedicated 24/7 server infrastructure, strict tail SLAs (sub-100ms response), and lightweight feature pipelines.`,
      r`Modern high-scale recommendation engines (such as streaming platforms and e-commerce marketplaces) combine both paradigms into a hybrid two-tower pattern. Offline batch pipelines precompute candidate item embeddings for 10 million items every night. When a user opens the mobile app, a lightweight online scoring service retrieves the top 100 candidate items via approximate nearest neighbours and ranks them in real-time using current session context (time of day, device, and last 3 clicks).`,
    ],
    analogy: r`A bakery preparing bread: baking 500 loaves of sourdough in large ovens overnight (batch precomputation) versus custom-making a fresh hot espresso in 30 seconds when a customer orders at the counter (online inference).`,
    steps: [
      r`Audit operational freshness requirements: determine whether the business decision requires data generated at query time or if hourly/daily batch data is sufficient.`,
      r`Establish latency and throughput budgets: benchmark target response times (e.g. batch: 10,000 items/sec over 2 hours; online: < 50ms per item with p99 < 100ms).`,
      r`Assess feature store dependencies: verify whether features reside offline in data warehouses (BigQuery, Snowflake) or require streaming feature stores (Redis, Feast) for sub-second retrieval.`,
      r`Evaluate cost economics: compare continuous 24/7 online server hosting costs against on-demand scheduled batch cluster compute.`,
      r`Design fallback mechanisms: implement local caching or rule-based fallback heuristics for online inference endpoints when network timeouts occur.`,
    ],
    math: [
      {
        h: 'Amortised hardware inference cost comparison',
        tex: r`C_{\text{batch}} = \frac{T_{\text{run}} \cdot P_{\text{compute}}}{N_{\text{total}}}, \qquad C_{\text{online}} = \frac{24 \times 3600 \cdot P_{\text{cluster}}}{N_{\text{requests}}}`,
        p: r`Where $P_{\text{compute}}$ and $P_{\text{cluster}}$ are hourly infrastructure costs. Because scheduled batch jobs achieve near 100% GPU/CPU utilization during execution, $C_{\text{batch}}$ is typically an order of magnitude cheaper per scored record than continuous online serving under variable traffic.`,
      },
      {
        h: 'End-to-end online serving latency budget',
        tex: r`T_{\text{total}} = T_{\text{network\_roundtrip}} + T_{\text{feature\_retrieval}} + T_{\text{inference}} + T_{\text{serialization}} \le T_{\text{SLA}}`,
        p: r`In online inference, model computation $T_{\text{inference}}$ is only one component of the total latency budget; network roundtrip and database feature hydration often dominate total response time.`,
      },
      {
        h: 'Feature freshness staleness function',
        tex: r`\Delta t_{\text{staleness}} = t_{\text{inference}} - t_{\text{feature\_observed}}`,
        p: r`In batch systems, $\Delta t$ can range from hours to days; in online streaming systems, $\Delta t \to 0$, maximising responsiveness to immediate user behavioural shifts.`,
      },
    ],
    keyPoints: [
      r`Batch inference maximises throughput and minimises hardware cost by scoring millions of records in scheduled offline pipelines.`,
      r`Online inference is mandatory when features only exist at query time (such as fraud detection and search autocomplete).`,
      r`Hybrid architectures precompute static candidate sets in batch, applying lightweight ranking online using real-time session context.`,
    ],
    pitfalls: [
      r`Building an expensive online microservice when a daily scheduled batch job stored in Redis satisfies the business requirement.`,
      r`Online feature hydration bottlenecks: designing a 5ms model that times out because retrieving user history from a remote SQL database takes 150ms.`,
      r`Training-serving skew: using pandas transformations in offline batch training that differ subtly from Java/C++ streaming feature transformations in production online inference.`,
    ],
    code: r`import numpy as np
import time

np.random.seed(42)
n_samples, n_features = 1000, 10
X = np.random.normal(0, 1, size=(n_samples, n_features))
w = np.random.normal(0, 1, size=n_features)

# 1. Batch inference (vectorised matrix-vector product)
t0 = time.perf_counter()
preds_batch = 1.0 / (1.0 + np.exp(-np.dot(X, w)))
t_batch = time.perf_counter() - t0
throughput_batch = n_samples / t_batch

# 2. Online inference simulation (iterative per-request processing)
t0 = time.perf_counter()
preds_online = []
for i in range(n_samples):
    x_i = X[i]
    p_i = 1.0 / (1.0 + np.exp(-np.dot(x_i, w)))
    preds_online.append(p_i)
t_online = time.perf_counter() - t0
throughput_online = n_samples / t_online

print(f"Batch inference throughput:  {throughput_batch:,.0f} samples/sec (Total: {t_batch*1000:.2f}ms)")
print(f"Online inference throughput: {throughput_online:,.0f} samples/sec (Total: {t_online*1000:.2f}ms)")
print(f"Throughput speedup factor:   {throughput_batch / throughput_online:.1f}x")`,
    quiz: [
      {
        q: r`When is online (real-time) inference strictly required over batch precomputation?`,
        o: [
          r`When the dataset contains more than 10,000 rows`,
          r`When inference requires features that only exist at query time, such as transaction amount, GPS coordinates, or real-time user session context`,
          r`When models are trained using linear regression`,
          r`When the budget for cloud compute is zero`,
        ],
        a: 1,
        why: r`Online inference is essential when features cannot be known in advance (such as a card transaction or search query). If features only appear at the moment of the request, batch precomputation is impossible.`,
      },
      {
        q: r`What is the primary economic advantage of batch inference over online inference?`,
        o: [
          r`Batch inference does not require Python`,
          r`Batch inference maximises hardware utilization by saturating GPUs/CPUs on scheduled jobs, avoiding 24/7 server idle costs under fluctuating traffic`,
          r`Batch inference guarantees zero model error`,
          r`Batch inference eliminates the need for test data`,
        ],
        a: 1,
        why: r`Batch jobs run on-demand clusters at near 100% capacity, scoring millions of rows at peak throughput and shutting down, whereas online serving requires 24/7 provisioned capacity sized for peak traffic.`,
      },
      {
        q: r`What is 'training-serving skew' in machine learning operations?`,
        o: [
          r`A difference between training loss and validation loss`,
          r`A discrepancy in performance or logic between the feature engineering code used during offline training and the code used during live inference`,
          r`A situation where the training set has more columns than rows`,
          r`A model that predicts negative values for positive targets`,
        ],
        a: 1,
        why: r`Training-serving skew occurs when data pipelines differ between offline training (e.g. batch SQL/pandas) and online serving (e.g. streaming Java/C++ or microservices), causing silent prediction errors in production.`,
      },
    ],
    usedBy: [],
    prereq: ['serving-models-with-fastapi', 'docker-and-reproducible-environments'],
    related: ['scikit-learn-pipelines-and-columntransformer', 'data-leakage', 'time-series-cross-validation'],
    keywords: 'batch inference online inference real time prediction feature store streaming latency throughput training serving skew mlops',
  },
  {
  "id": "ci-cd-for-ml",
  "short": "CI/CD for ML",
  "title": "CI/CD for Machine Learning: Continuous Integration, Testing, and Automated Delivery",
  "task": "concepts",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Automating ML test suites, data pipeline regression tests, model quality gates, and containerised delivery using GitHub Actions and modern MLOps.",
  "lead": "Continuous Integration and Continuous Delivery (CI/CD) revolutionized traditional software engineering by automating testing and deployment. In machine learning, however, traditional code unit tests are fundamentally insufficient: code can be 100% bug-free and pass every linting check, while the resulting model is completely dysfunctional due to data leakage, silent feature corruption, or performance degradation. CI/CD for ML (CT/CD) expands automation to test code, data, and models.",
  "analogy": "Imagine an automated rocket assembly line. Standard software CI tests whether the robotic welding arms move correctly and screws fit into their sockets. ML CI goes a giant step further: it tests the purity of the rocket fuel in the tanks, tests that the payload weight matches physics calculations, and conducts a simulated static engine test fire in a wind tunnel before granting the rocket clearance for launch.",
  "intuition": [
    "Traditional CI verifies code syntax, unit tests, and integration tests. ML CI/CD introduces two new testing dimensions: Data Validation (testing data schemas, distributions, and null ratios) and Model Quality Testing (testing model accuracy, inference latency, bias, and adversarial robustness).",
    "Continuous Training (CT) is a unique ML capability: when new data arrives or model decay alerts trigger, an automated pipeline re-executes data prep, hyperparameter tuning, model training, and evaluation without manual human intervention.",
    "A robust ML CI pipeline executes tiered test gates: Fast pull request tests (code linting, unit tests on synthetic micro-datasets, schema validation), Nightly integration tests (end-to-end pipeline execution on sampled data), and Release qualification gates (evaluating trained candidate models against production champions on golden benchmark sets).",
    "Continuous Delivery packages validated models into reproducible container images (Docker), registers them in an immutable model registry (MLflow / Vertex AI), and deploys them to staging environments for shadow testing and canary rollouts."
  ],
  "steps": [
    "Fast PR gate: Run linters (Ruff, Flake8), type checks (Mypy), and unit tests on mock data fixtures using lightweight runners (GitHub Actions).",
    "Data pipeline validation: Run automated data regression tests asserting that preprocessing functions preserve row counts, prevent lookahead leakage, and handle missing values.",
    "Automated training & qualification: Train candidate model on staging data and evaluate performance against golden regression test suites and safety baselines.",
    "Model card & metadata logging: Generate automated model performance cards documenting accuracy across demographic slices, latency benchmarks, and carbon footprint.",
    "Containerisation & registry push: Build Docker image embedding dependencies and model weights; register with semantic versioning tag (`v2.4.0-rc1`).",
    "Canary deployment & telemetry monitoring: Deploy container to production cluster with progressive traffic routing (5% $\\to$ 25% $\\to$ 100%) governed by automated error-budget alerts."
  ],
  "math": [
    {
      "h": "Non-Regression Quality Gate Assertion",
      "tex": "\\mathcal{M}_{\\mathrm{cand}}(\\mathcal{D}_{\\mathrm{test}}) \\ge \\mathcal{M}_{\\mathrm{prod}}(\\mathcal{D}_{\\mathrm{test}}) - \\epsilon_{\\mathrm{tolerance}} \\;\\land\\; \\mathrm{Latency}_{\\mathrm{p99}} \\le L_{\\max}",
      "p": "A candidate model passes the deployment gate only if its metric $\\mathcal{M}$ meets parity with the production model within tolerance $\\epsilon$, and its 99th percentile inference latency is below threshold $L_{\\max}$."
    },
    {
      "h": "Slicing Invariance Fairness Constraint",
      "tex": "\\max_{s \\in \\mathcal{S}} \\left| \\mathcal{M}_{\\mathrm{cand}}(\\mathcal{D}_s) - \\mathcal{M}_{\\mathrm{cand}}(\\mathcal{D}_{\\mathrm{test}}) \\right| \\le \\delta_{\\mathrm{slice}}",
      "p": "Ensures model performance does not severely degrade on critical sub-populations or demographic slices $s \\in \\mathcal{S}$."
    },
    {
      "h": "Canary Traffic Shift Transition",
      "tex": "w_{\\mathrm{cand}}(t) = \\min\\left( 1.0, \\; w_{\\mathrm{cand}}(0) + \\alpha \\cdot t \\right) \\;\\text{if } \\operatorname{Errors}(t) < \\tau_{\\mathrm{error}}",
      "p": "Canary traffic weight $w_{\\mathrm{cand}}$ expands linearly over time $t$ provided production operational error rates remain below threshold $\\tau_{\\mathrm{error}}$."
    }
  ],
  "code": "import pytest\nimport numpy as np\n\n# Example: Production ML Unit & Integration Tests (pytest style)\n\ndef test_feature_pipeline_zero_leakage():\n    \"\"\"Assert feature scaling does not leak mean across train and test partitions.\"\"\"\n    train_data = np.array([10.0, 20.0, 30.0])\n    test_data = np.array([100.0, 200.0])\n    \n    train_mean = np.mean(train_data)\n    # Scaled test data must use train_mean, NOT test_mean!\n    scaled_test = test_data - train_mean\n    assert np.allclose(scaled_test, [80.0, 180.0]), \"Test scaling leaked out-of-fold statistics!\"\n\ndef test_model_inference_latency_benchmark():\n    \"\"\"Assert candidate model satisfies SLA under 20 milliseconds per sample.\"\"\"\n    import time\n    # Simulate forward pass on batch\n    start = time.perf_counter()\n    _ = np.dot(np.random.randn(1, 50), np.random.randn(50, 1))\n    elapsed_ms = (time.perf_counter() - start) * 1000.0\n    assert elapsed_ms < 20.0, f\"Inference latency breached SLA: {elapsed_ms:.2f}ms\"\n\ndef test_model_non_negative_predictions():\n    \"\"\"Domain assertion: Model predicting house prices must never output negative numbers.\"\"\"\n    dummy_preds = np.array([250000.0, 180000.0, 420000.0])\n    assert np.all(dummy_preds >= 0.0), \"Model generated invalid negative prices!\"\n\nprint(\"CI/CD Test Suite Passed: Zero leakage, latency within SLA, valid prediction bounds.\")",
  "keyPoints": [
    "CI/CD for ML expands standard software CI to test code, data, and models.",
    "Automated qualification gates evaluate candidate models against incumbent production champions.",
    "Data regression tests verify that preprocessing logic prevents lookahead data leakage.",
    "Continuous Delivery packages models into reproducible Docker images deployed via canary rollouts."
  ],
  "pitfalls": [
    "Testing only model accuracy: Deploying a model that achieves 92% AUC but has a 400ms inference latency crashes user-facing web services under live load.",
    "Testing on dynamic unpinned test sets: If the CI test dataset changes constantly, tests become flaky and pass or fail due to data shifts rather than model changes.",
    "Running 8-hour deep learning training inside pull request CI: PR test runs should use small synthetic fixtures; full retraining should run in separate nightly CT pipelines."
  ],
  "quiz": [
    {
      "q": "Why are traditional software unit tests insufficient for validating machine learning systems?",
      "o": [
        "Because Python does not support unit testing",
        "Because ML code can compile and run with 100% test coverage while the resulting model is completely corrupted due to data leakage or metric degradation",
        "Because unit tests cannot run on Linux servers",
        "Because ML algorithms only work in Jupyter Notebooks"
      ],
      "a": 1,
      "why": "Traditional unit tests verify software syntax and logic execution, but cannot detect data distribution shifts, subtle lookahead leakage, or degraded statistical predictive performance."
    },
    {
      "q": "What is the role of a \"golden evaluation dataset\" in an ML CI/CD pipeline?",
      "o": [
        "It is a dataset that costs millions of pounds to store in cloud storage",
        "A curated, immutable benchmark dataset used to evaluate every candidate model under identical conditions before production deployment",
        "A dataset containing only positive conversion labels",
        "A dataset encrypted with blockchain technology"
      ],
      "a": 1,
      "why": "An immutable golden test set ensures that candidate models are judged objectively against the exact same test cases as the incumbent model, preventing regressions."
    },
    {
      "q": "What is \"Continuous Training\" (CT) in the context of MLOps pipelines?",
      "o": [
        "Requiring data scientists to take weekly machine learning examinations",
        "An automated pipeline that retrains, tests, and validates models automatically whenever new data arrives or performance decay triggers fire",
        "Running a model continuously without ever turning off the server",
        "A neural network that never converges to a loss minimum"
      ],
      "a": 1,
      "why": "CT automates the training and validation lifecycle, triggering retraining automatically in response to data updates or performance drift."
    }
  ],
  "related": [
    "docker-and-reproducible-environments",
    "serving-models-with-fastapi",
    "data-quality-checks"
  ],
  "keywords": "ci/cd for ml, mlops, continuous integration, continuous delivery, continuous training, model qualification gates, golden evaluation set, automated testing",
  "usedBy": []
},
  {
  "id": "model-registry-and-versioning",
  "short": "Model registry & versioning",
  "title": "Model Registry and Versioning: Governance, Lineage, and Lifecycle Promotion",
  "task": "concepts",
  "level": 2,
  "minutes": 15,
  "noLab": true,
  "usedBy": [],
  "summary": "Managing model governance, semantic versioning, lineage graphs, and deployment staging gates with MLflow and cloud model registries.",
  "lead": "In enterprise production, a machine learning model is not just a saved pickle file on an engineer's laptop. Deploying unversioned models introduces operational chaos: nobody knows which training code produced the running binary, rollback becomes impossible during outages, and regulatory compliance is breached. A centralized Model Registry provides immutable versioning, audit trails, and automated lifecycle promotion gates.",
  "analogy": "Imagine an aircraft maintenance hangar. Every replacement jet engine has a serial number, a stamped maintenance certificate, an immutable logbook of all test bench runs, and a formal signed release from the chief inspector before being bolted to an airframe. A model registry acts as that rigorous aeronautical logbook and parts warehouse for trained algorithms.",
  "intuition": [
    "A Model Registry bridges the gap between experimentation and production serving. While experiment tracking logs hundreds of intermediate runs, the registry stores only curated, candidate-grade models.",
    "A registered model entity maintains an immutable sequence of versions (v1, v2, v3). Each version links directly back to its source experiment run ID, capturing the git commit hash, training dataset version, hyperparameter payload, and evaluation metrics.",
    "Model promotion follows explicit lifecycle stages: `None` $\\to$ `Staging` (candidate undergoing integration and shadow testing) $\\to$ `Production` (live serving traffic) $\\to$ `Archived` (decommissioned models kept for auditing). Modern registries often replace rigid stages with flexible deployment aliases (e.g. `@champion`, `@challenger`).",
    "Registries enforce governance: models must pass automated validation gates (minimum accuracy, latency thresholds, fairness checks) and require dual-control peer approvals before being promoted to production."
  ],
  "steps": [
    "Register candidate model: Log the serialized model artifact from an experiment run into the registry under a unique logical model name.",
    "Attach metadata and signature: Define explicit input/output tensor or tabular schema signatures and link evaluation metrics.",
    "Automate qualification testing: Trigger automated CI webhooks to run regression benchmarks, schema compatibility tests, and latency profiling on the newly registered version.",
    "Assign deployment alias or stage: Promote the validated candidate to `@challenger` or `Staging` for shadow traffic evaluation.",
    "Promote to production with rollback guard: Atomically update the `@champion` pointer to the new version, retaining the previous version for instant one-click rollback."
  ],
  "math": [
    {
      "h": "Model Lineage Directed Acyclic Graph (DAG)",
      "tex": "\\mathcal{G}_{\\mathrm{lineage}} = (\\mathcal{V}, \\mathcal{E}), \\quad \\mathcal{V} = \\{\\mathcal{C}_{\\mathrm{code}}, \\mathcal{D}_{\\mathrm{data}}, \\mathcal{E}_{\\mathrm{env}}, \\mathcal{M}_{\\mathrm{model}}\\}",
      "p": "Lineage tracking models the provenance graph linking raw data partitions, code commits, and training environments to the registered model artifact."
    },
    {
      "h": "Model Signature Verification Predicate",
      "tex": "\\operatorname{Compatible}(\\mathbf{x}, \\Sigma_{\\mathrm{model}}) = \\bigwedge_{j=1}^d \\left( \\mathrm{type}(x_j) = \\tau_j \\;\\land\\; x_j \\in \\operatorname{Domain}_j \\right)",
      "p": "Enforces that incoming production query vectors $\\mathbf{x}$ strictly conform to the expected feature schema and types $\\Sigma$ registered with the model."
    },
    {
      "h": "Semantic Versioning Progression",
      "tex": "V = \\text{MAJOR}.\\text{MINOR}.\\text{PATCH} \\quad [\\text{Breaking Schema} \\mid \\text{Retrained Architecture} \\mid \\text{Cadence Refresh}]",
      "p": "Formalises version upgrades: patch for scheduled retraining on new data, minor for feature additions, major for breaking input schema changes."
    }
  ],
  "code": "import json\nimport time\n\nclass MockModelRegistry:\n    def __init__(self):\n        self.models = {}\n\n    def register_version(self, model_name: str, run_id: str, metrics: dict, schema: dict):\n        if model_name not in self.models:\n            self.models[model_name] = {'versions': [], 'aliases': {}}\n        \n        version_num = len(self.models[model_name]['versions']) + 1\n        record = {\n            'version': version_num,\n            'registered_at': time.strftime(\"%Y-%m-%d %H:%M:%SZ\", time.gmtime()),\n            'run_id': run_id,\n            'metrics': metrics,\n            'schema': schema,\n            'status': 'Staging'\n        }\n        self.models[model_name]['versions'].append(record)\n        print(f\"Registered {model_name} v{version_num} (Run: {run_id}, AUC: {metrics.get('auc', 0):.3f})\")\n        return version_num\n\n    def promote_to_champion(self, model_name: str, version: int):\n        self.models[model_name]['aliases']['champion'] = version\n        for v in self.models[model_name]['versions']:\n            if v['version'] == version:\n                v['status'] = 'Production'\n        print(f\"Promoted {model_name} v{version} to @champion!\")\n\n# Simulate model registration and governance promotion\nregistry = MockModelRegistry()\nv1 = registry.register_version(\n    model_name=\"fraud-detection\",\n    run_id=\"run_a91b2c\",\n    metrics={\"auc\": 0.882, \"p99_latency_ms\": 12.4},\n    schema={\"amount\": \"float64\", \"merchant_category\": \"string\"}\n)\nregistry.promote_to_champion(\"fraud-detection\", version=v1)\n\n# Challenger retrained on fresh monthly data\nv2 = registry.register_version(\n    model_name=\"fraud-detection\",\n    run_id=\"run_d45e6f\",\n    metrics={\"auc\": 0.904, \"p99_latency_ms\": 11.8},\n    schema={\"amount\": \"float64\", \"merchant_category\": \"string\"}\n)\nregistry.promote_to_champion(\"fraud-detection\", version=v2)",
  "keyPoints": [
    "Model registries centralise governance, versioning, and lifecycle promotion across environments.",
    "Every registered version preserves full lineage back to training code, dataset snapshots, and metrics.",
    "Deployment aliases (`@champion`, `@challenger`) allow atomic traffic redirection and instant rollbacks.",
    "Enforces schema validation contracts to prevent serving incompatible production feature payloads."
  ],
  "pitfalls": [
    "Treating the registry as an experiment log: Registering thousands of half-baked training iterations pollutes the registry; only register viable deployment candidates.",
    "Missing schema definitions: Registering model weights without input feature types leads to runtime deserialisation crashes when upstream schemas change.",
    "Manual, un-audited promotions: Allowing individual engineers to change production aliases without automated test gates or dual approvals invites accidental outages."
  ],
  "quiz": [
    {
      "q": "What is the primary operational distinction between an experiment tracking system and a model registry?",
      "o": [
        "Experiment tracking is for Python, while model registries are strictly for Java",
        "Experiment tracking logs all exploratory runs and metric curves, while a model registry stores and governs production-candidate models across lifecycle stages",
        "Model registries only work on local hard drives",
        "Experiment tracking automatically deploys models to Kubernetes"
      ],
      "a": 1,
      "why": "Experiment tracking captures all iterations during research, whereas a model registry curates, versions, and manages the deployment lifecycle of viable production models."
    },
    {
      "q": "Why are deployment aliases like `@champion` and `@challenger` preferred over hard-coded version numbers in serving infrastructure?",
      "o": [
        "They compress the network payload size",
        "They allow serving services to query a stable alias while the registry points to new versions atomically behind the scenes without restarting services",
        "They prevent git merge conflicts",
        "They eliminate the need for containerisation"
      ],
      "a": 1,
      "why": "Microservices call the `@champion` endpoint. Upgrading or rolling back the model simply involves moving the alias in the registry without modifying client service code."
    },
    {
      "q": "What is \"model lineage\" in machine learning governance?",
      "o": [
        "The historical tree of git branches",
        "The complete auditable provenance tracing a deployed model back to its exact training dataset version, code commit, hyperparameters, and environment dependencies",
        "The hierarchy of decision tree depth splits",
        "The inheritance of Python class structures"
      ],
      "a": 1,
      "why": "Lineage provides end-to-end traceability, proving to auditors and engineers exactly what data, code, and configurations produced a production decision."
    }
  ],
  "related": [
    "experiment-tracking",
    "ci-cd-for-ml",
    "docker-and-reproducible-environments"
  ],
  "keywords": "model registry, mlflow, model versioning, model governance, model lineage, champion challenger, model lifecycle, deployment stages"
},
  {
  "id": "feature-stores",
  "short": "Feature stores",
  "title": "Feature Stores: Unifying Offline Training and Online Low-Latency Serving",
  "task": "concepts",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "usedBy": [],
  "summary": "Eliminating training-serving skew, managing point-in-time correct historical joins, and serving low-latency online features with Feast and Hopsworks.",
  "lead": "In enterprise machine learning, feature engineering code is often written twice: once in SQL or Python by data scientists building training sets on data warehouses, and again in Java or Go by software engineers building low-latency microservices for live scoring. This duplicate implementation creates training-serving skew—subtle differences between training and serving features that ruin production model accuracy. A Feature Store unifies feature definitions across offline training and online serving.",
  "analogy": "Imagine a central commercial kitchen serving both a luxury restaurant and a high-volume catering delivery service. Instead of having two separate chef teams chopping onions and brewing stocks according to different recipes in separate rooms, a central prep station prepares standard ingredients to strict specifications, flash-freezing portions for future banquets (offline warehouse) while keeping fresh bowls ready on the assembly line (online low-latency cache).",
  "intuition": [
    "Machine learning applications require two distinct feature access patterns: High-throughput batch reads over months of history for model training (offline store: Snowflake, BigQuery, Delta Lake), and sub-10ms single-entity key-value lookups for live inference (online store: Redis, DynamoDB, Cassandra).",
    "Without a feature store, teams suffer from training-serving skew (calculating rolling 7-day spend slightly differently in SQL vs Java), feature duplication (multiple teams re-engineering the same customer features), and lookahead data leakage during training set creation.",
    "A Feature Store (e.g. Feast, Hopsworks, Tecton) provides a unified registry of entity-keyed feature views. Features are defined once in declarative code. The system continuously ingests raw event streams, updating the online key-value store for live queries while appending to the offline store.",
    "Crucially, the feature store provides \"Time-Travel\" (as-of point-in-time correct historical retrieval): given a historical dataset of customer actions, it reconstructs the exact feature values as they existed at each action timestamp, preventing future leakage."
  ],
  "steps": [
    "Define entities and feature views: Declare business keys (e.g. `user_id`, `merchant_id`) and associated feature definitions with explicit data types and SLAs.",
    "Configure dual-storage backends: Connect an offline analytical warehouse (Parquet, BigQuery, Snowflake) and an online low-latency store (Redis, DynamoDB).",
    "Continuous streaming / batch ingestion: Schedule batch syncs or stream real-time Kafka events through the feature store ingestion engine.",
    "Point-in-time training set generation: Call `get_historical_features()` with observation timestamps to generate leak-free training matrices via automated as-of joins.",
    "Low-latency online serving: Fetch real-time vector payloads in microservices via `get_online_features()` using entity primary keys.",
    "Monitor feature drift and statistics: Continuously track feature distributions and missingness across both storage tiers."
  ],
  "math": [
    {
      "h": "Training-Serving Skew Definition",
      "tex": "\\Delta_{\\mathrm{skew}} = \\mathbb{E}_{x \\sim P_{\\mathrm{live}}}\\left[ \\| f_{\\mathrm{offline}}(x) - f_{\\mathrm{online}}(x) \\| \\right] > 0 \\quad [\\text{Operational Hazard}]",
      "p": "Training-serving skew occurs whenever offline training feature transformations $f_{\\mathrm{offline}}$ diverge from real-time online calculations $f_{\\mathrm{online}}$."
    },
    {
      "h": "Point-in-Time Historical Feature Lookup",
      "tex": "\\mathcal{F}(e, t_{\\mathrm{obs}}) = \\operatorname*{arg\\,max}_{v \\in \\mathcal{V}_e} \\left\\{ t_v \\;\\middle|\\; t_v \\le t_{\\mathrm{obs}} \\right\\}",
      "p": "Reconstructs the exact feature state for entity $e$ at historical observation moment $t_{\\mathrm{obs}}$, strictly forbidding lookahead data access."
    },
    {
      "h": "Online Latency Service Level Agreement (SLA)",
      "tex": "P\\left( T_{\\mathrm{lookup}}(\\mathbf{e}) \\le \\tau_{\\mathrm{SLA}} \\right) \\ge 0.999, \\quad \\tau_{\\mathrm{SLA}} \\approx 5\\text{--}10\\text{ ms}",
      "p": "Online feature stores guarantee high-availability sub-10ms p99 read latencies for real-time inference microservices."
    }
  ],
  "code": "import pandas as pd\nfrom datetime import datetime, timedelta\n\n# Conceptual mini feature store simulation\nclass MiniFeatureStore:\n    def __init__(self):\n        # Offline store: immutable historical log (user_id, timestamp, feature, value)\n        self.offline_records = []\n        # Online store: fast key-value cache (user_id -> latest features)\n        self.online_cache = {}\n\n    def push_features(self, user_id: str, timestamp: datetime, features: dict):\n        # 1. Update online cache with latest values\n        self.online_cache[user_id] = {'updated_at': timestamp, **features}\n        # 2. Append to offline event log\n        for feat_name, val in features.items():\n            self.offline_records.append({\n                'user_id': user_id, 'timestamp': timestamp,\n                'feature': feat_name, 'value': val\n            })\n\n    def get_online_features(self, user_ids: list) -> dict:\n        \"\"\"Low-latency key-value lookup for live model inference (<5ms).\"\"\"\n        return {uid: self.online_cache.get(uid, {}) for uid in user_ids}\n\nfs = MiniFeatureStore()\nt0 = datetime(2026, 4, 1, 10, 0, 0)\nfs.push_features('user_123', t0, {'avg_spend_7d': 42.50, 'num_logins_30d': 14})\n\nt1 = datetime(2026, 4, 1, 15, 30, 0)\nfs.push_features('user_123', t1, {'avg_spend_7d': 85.00, 'num_logins_30d': 15})\n\n# Production microservice serving real-time fraud prediction\nonline_payload = fs.get_online_features(['user_123'])\nprint(\"Online real-time features for user_123:\")\nprint(online_payload['user_123'])\n# Returns latest state: avg_spend_7d = 85.00 instantaneously",
  "keyPoints": [
    "Feature stores bridge offline batch data warehouses and online low-latency caches.",
    "Eliminates training-serving skew by using a single source of truth for feature transformation logic.",
    "Enables point-in-time correct historical joins (\"time-travel\") that prevent target leakage.",
    "Promotes feature reuse and discovery across data science and machine learning teams."
  ],
  "pitfalls": [
    "Over-engineering simple batch use cases: If a model only runs once a week as a batch offline job, setting up an online Redis feature store adds unnecessary infrastructure overhead.",
    "Neglecting entity TTL (time-to-live): Allowing inactive entity keys to persist indefinitely in RAM-based online caches causes memory exhaustion and skyrocketing cloud costs.",
    "Timestamp misalignment: Pushing event ingestion time instead of the event occurrence time corrupts point-in-time correctness during historical joins."
  ],
  "quiz": [
    {
      "q": "What is \"training-serving skew\" in production machine learning?",
      "o": [
        "When model training runs slower than production inference",
        "A discrepancy between feature definitions, data distributions, or computation logic between offline training and online serving environments",
        "When the training loss curve is skewed to the left",
        "When training uses GPUs but serving uses CPUs"
      ],
      "a": 1,
      "why": "Training-serving skew happens when features are computed differently in production serving vs offline training, causing severe performance drops in live deployment."
    },
    {
      "q": "Why does an online feature store use key-value stores (like Redis or DynamoDB) rather than data warehouses (like Snowflake or BigQuery)?",
      "o": [
        "Key-value stores support complex SQL window functions",
        "Key-value stores provide sub-10 millisecond single-record read latencies required for real-time API scoring",
        "Data warehouses cannot store numerical floating point values",
        "Redis is completely free and requires zero hardware memory"
      ],
      "a": 1,
      "why": "Real-time API requests have strict SLA latency budgets (10–50ms). In-memory key-value stores return feature vectors in single-digit milliseconds."
    },
    {
      "q": "What capability allows a feature store to generate leak-free training datasets for historical events?",
      "o": [
        "Automatic random undersampling",
        "Point-in-time correct temporal joins (\"time travel\"), matching each historical event only to feature values that existed at that exact moment",
        "Converting all dates into UTC strings",
        "Training a separate neural network on timestamps"
      ],
      "a": 1,
      "why": "Point-in-time joins strictly match entity feature states that existed prior to or at the observation timestamp, preventing future data leakage into the training set."
    }
  ],
  "related": [
    "dates-time-zones-and-temporal-joins",
    "data-leakage",
    "serving-models-with-fastapi"
  ],
  "keywords": "feature stores, feast, hopsworks, tecton, training serving skew, time travel, point-in-time join, redis, offline store, online store"
},
  {
  "id": "orchestration-with-airflow-and-databricks",
  "short": "Airflow & Databricks",
  "title": "Data and ML Orchestration: Directed Acyclic Graphs with Apache Airflow and Databricks",
  "task": "concepts",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "usedBy": [],
  "summary": "Scheduling, monitoring, and executing multi-step ML pipelines with Apache Airflow DAGs, Celery workers, and managed Databricks clusters.",
  "lead": "Machine learning workflows are not single monolithic scripts; they are multi-stage dependency graphs encompassing data ingestion, cleaning, feature transformation, model training, validation gating, and batch scoring. Running these pipelines using brittle shell scripts or cron jobs leads to silent task failures, untracked dependencies, and manual operational nightmares. Orchestrators formalise workflows as Directed Acyclic Graphs (DAGs), managing task scheduling, automatic retries, backfilling, and cloud compute execution.",
  "analogy": "Imagine the conductor of a 100-piece symphony orchestra. The conductor does not play the violins or strike the kettle drums themselves; instead, they cue each instrumental section at the precise beat, ensuring the woodwinds do not start until the brass fanfare finishes. If a trumpet player drops their sheet music, the conductor handles the recovery without halting the entire performance.",
  "intuition": [
    "A workflow orchestrator (such as Apache Airflow, Prefect, Dagster, or Kubeflow Pipelines) models processes as Directed Acyclic Graphs (DAGs), where nodes represent discrete tasks and directed edges represent execution dependencies.",
    "Airflow separates orchestration (scheduling, retrying, dependency resolution) from computation (executing data transformations). Operators act as triggers: the `DatabricksSubmitRunOperator` delegates heavy Spark compute jobs to auto-scaling Databricks cloud clusters, freeing Airflow workers from memory-heavy tasks.",
    "Key architectural concepts include Idempotency (re-running a pipeline on the same date produces identical results without side effects) and Backfilling (automatically re-executing historical pipelines across past date ranges after a code bug is fixed).",
    "Airflow manages failure states defensively: task timeouts, exponential backoff retries, SLA alerts, and dead-man switches ensure pipeline resilience in mission-critical enterprise environments."
  ],
  "steps": [
    "Design modular task DAG: Decompose ML pipeline into independent tasks (Ingest $\\to$ Clean $\\to$ Feature Eng $\\to$ Train $\\to$ Validate $\\to$ Deploy).",
    "Define dependency order: Declare task dependencies using Python bitshift operators (`extract >> transform >> train >> validate`).",
    "Configure execution environment: Assign lightweight tasks to local Celery/Kubernetes workers and offload heavy distributed workloads to Databricks or Spark clusters.",
    "Implement defensive retries: Configure `retries=3`, `retry_delay=timedelta(minutes=5)`, and exponential backoff to recover from transient cloud network faults.",
    "Ensure execution idempotency: Use date-partitioned paths (`/data/year=2026/month=04/day=01/`) and atomic database write modes (`overwrite` rather than `append`).",
    "Set up alerting and SLA monitors: Configure Slack/PagerDuty webhooks on task failure and monitor upstream data arrival SLAs."
  ],
  "math": [
    {
      "h": "Directed Acyclic Graph (DAG) Condition",
      "tex": "\\mathcal{G} = (\\mathcal{V}, \\mathcal{E}), \\quad \\forall v_i \\in \\mathcal{V}, \\; \\nexists \\text{ path } v_i \\to \\dots \\to v_i \\quad [\\text{Cycle-Free}]",
      "p": "A workflow graph must contain zero directed cycles, ensuring deterministic top-down topological sorting of tasks."
    },
    {
      "h": "Topological Sort Task Execution Order",
      "tex": "(u, v) \\in \\mathcal{E} \\implies \\operatorname{pos}(u) < \\operatorname{pos}(v)",
      "p": "Downstream task $v$ cannot execute until all upstream ancestor tasks $u$ have successfully completed with exit status zero."
    },
    {
      "h": "Exponential Backoff Retry Interval",
      "tex": "T_{\\mathrm{wait}}(k) = T_{\\mathrm{base}} \\cdot 2^{k-1} + \\mathcal{U}(0, \\sigma)",
      "p": "Calculates the delay before retry attempt $k$, adding random jitter $\\mathcal{U}$ to prevent thundering herd congestion on external APIs."
    }
  ],
  "code": "from datetime import datetime, timedelta\n\n# Simplified representation of an Apache Airflow DAG structure in Python\nclass MockTask:\n    def __init__(self, task_id: str):\n        self.task_id = task_id\n        self.downstream = []\n\n    def __rshift__(self, other):\n        \"\"\"Implement bitshift operator >> for dependency chaining.\"\"\"\n        self.downstream.append(other)\n        return other\n\n    def __repr__(self):\n        return f\"Task({self.task_id})\"\n\n# Define ML pipeline DAG tasks\ningest_raw_events   = MockTask(\"ingest_kafka_events\")\nfeature_engineering = MockTask(\"databricks_spark_feature_prep\")\ntrain_lightgbm      = MockTask(\"train_candidate_model\")\nevaluate_champion   = MockTask(\"evaluate_vs_production_champion\")\ndeploy_canary       = MockTask(\"deploy_canary_service\")\nalert_slack_failure = MockTask(\"notify_on_call_slack\")\n\n# Construct pipeline dependency flow using >>\ningest_raw_events >> feature_engineering >> train_lightgbm >> evaluate_champion >> deploy_canary\n\nprint(\"Constructed ML Orchestration DAG:\")\ncurr = ingest_raw_events\nwhile curr.downstream:\n    nxt = curr.downstream[0]\n    print(f\"[{curr.task_id}] ---> triggers ---> [{nxt.task_id}]\")\n    curr = nxt\nprint(\"Deployment gate: deploy_canary runs strictly after evaluate_champion succeeds.\")",
  "keyPoints": [
    "Orchestrators formalise complex ML workflows as Directed Acyclic Graphs (DAGs).",
    "Airflow separates scheduling and dependency management from compute, offloading heavy processing to Databricks/Spark.",
    "Idempotent task design ensures pipelines can be safely re-run and backfilled without duplicating data.",
    "Automated retries, exponential backoff, and SLA monitoring ensure fault-tolerant production operations."
  ],
  "pitfalls": [
    "Running heavy ML training on Airflow workers: Airflow schedulers and workers are meant for orchestration; running 50GB model training directly in Airflow exhausts worker RAM and crashes the scheduler.",
    "Non-idempotent database appends: Using `INSERT INTO` without date partitioning means re-running a failed DAG run duplicates millions of rows.",
    "Circular dependencies: Introducing cyclic dependencies creates non-terminating deadlock loops that prevent DAG compilation."
  ],
  "quiz": [
    {
      "q": "Why should heavy machine learning training workloads not be executed directly on Apache Airflow worker nodes?",
      "o": [
        "Airflow does not support Python scripts",
        "Airflow workers are lightweight orchestration processes; memory-heavy jobs can exhaust worker RAM and crash the central scheduler",
        "Airflow cannot connect to the internet",
        "Airflow requires all tasks to finish in under 1 second"
      ],
      "a": 1,
      "why": "Airflow is an orchestrator, not a distributed compute engine. Heavy workloads should be delegated to specialized engines like Databricks, Ray, or Kubernetes."
    },
    {
      "q": "What is the property of \"idempotence\" in data engineering and ML orchestration?",
      "o": [
        "A pipeline that executes in zero milliseconds",
        "The property where re-executing a pipeline with the exact same input parameters produces identical output states without creating duplicate data or side effects",
        "A model that achieves 100% test accuracy",
        "An encrypted database connection"
      ],
      "a": 1,
      "why": "Idempotent pipelines can be re-run safely after errors or for historical backfilling without corrupting or duplicating existing data tables."
    },
    {
      "q": "What does the `>>` bitshift operator represent in Apache Airflow Python DAG files?",
      "o": [
        "Bitwise binary shift of integer variables",
        "Defining an execution dependency where the downstream task depends on the upstream task finishing successfully",
        "Dividing numbers by two",
        "Exporting data to CSV"
      ],
      "a": 1,
      "why": "In Airflow DSL, `task_A >> task_B` defines a directed edge signifying that `task_B` will execute only after `task_A` completes successfully."
    }
  ],
  "related": [
    "ci-cd-for-ml",
    "docker-and-reproducible-environments",
    "feature-stores"
  ],
  "keywords": "airflow, databricks, orchestration, dag, directed acyclic graph, idempotency, backfilling, spark, celery worker, retries"
},
  {
  "id": "data-formats-parquet-and-delta",
  "short": "Parquet & Delta Lake",
  "title": "Modern Data Formats: Columnar Parquet and ACID Delta Lake Architecture",
  "task": "concepts",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "usedBy": [],
  "summary": "Optimising big data ML storage with columnar compression, dictionary encoding, predicate pushdown, ACID transactions, and time travel.",
  "lead": "Storing big data in raw text formats like CSV or JSON is disastrous for production machine learning: text files consume huge storage, lack schema enforcement, require slow row-by-row parsing, and cannot be filtered without scanning the entire file. Columnar storage formats like Apache Parquet and transactional lakehouse layers like Delta Lake compress data by up to 90%, enable sub-second predicate pushdown filtering, and provide ACID reliability with time travel.",
  "analogy": "Imagine a library cataloguing a million books. A row-oriented CSV is like storing the entire text of every book sequentially in a single giant paper roll: finding every book published in 1985 requires reading through every single word of all million books from start to finish. A columnar format is like an organized index where all publication years are listed in one compact column; you scan only that single column in seconds and ignore the rest.",
  "intuition": [
    "Row-oriented formats (CSV, JSON, traditional relational tables) store all features of row 1, then row 2, etc. This is optimal for transactional writes (OLTP), but inefficient for machine learning (OLAP), where an algorithm typically selects only 10 features out of 200 columns across 50,000,000 rows.",
    "Columnar storage (Apache Parquet) stores data column by column. Because all values in a column share the exact same data type, specialised compression algorithms (Run-Length Encoding, Dictionary Encoding, Snappy, ZSTD) achieve massive compression ratios.",
    "Parquet files embed rich metadata in file footers, recording minimum and maximum values for every column block (row group). When an SQL or Spark query filters `WHERE country = 'GB'`, the engine reads the metadata and skips entire multi-megabyte row groups without touching disk (Predicate Pushdown / Min-Max pruning).",
    "Delta Lake sits atop Parquet, adding a JSON transaction log (`_delta_log/`). This brings ACID transaction guarantees to data lakes, preventing readers from seeing partially written files, supporting `MERGE` upserts, and enabling \"Time Travel\" to query historical table snapshots."
  ],
  "steps": [
    "Choose compression codec: Select Snappy for balanced speed/compression or ZSTD for archival storage and high-throughput network reads.",
    "Organise into row groups: Configure Parquet row group size (typically 128MB to 512MB) to balance memory usage during compression against parallel scan efficiency.",
    "Partition on low-cardinality keys: Partition directory trees on sensible query keys (e.g. `year=2026/month=04/`) while avoiding hive partition over-fragmentation.",
    "Leverage predicate pushdown: Write queries with explicit column filtering so engines skip non-matching row groups using min/max footer metadata.",
    "Enable Delta Lake ACID logging: Wrap Parquet tables with Delta Lake to guarantee atomic commits and prevent corrupted reads during pipeline crashes.",
    "Use Delta Time Travel for model training: Query historical tables via `VERSION AS OF` or `TIMESTAMP AS OF` to ensure absolute training set reproducibility."
  ],
  "math": [
    {
      "h": "Columnar I/O Scan Reduction Ratio",
      "tex": "\\mathrm{ScanRatio} = \\frac{\\sum_{j \\in \\mathcal{S}_{\\mathrm{query}}} \\mathrm{size}(C_j)}{\\sum_{k=1}^D \\mathrm{size}(C_k)} \\ll 1.0",
      "p": "When a model requires feature subset $\\mathcal{S}_{\\mathrm{query}}$, columnar storage reads strictly those columns, reducing disk I/O proportionally."
    },
    {
      "h": "Predicate Pushdown Pruning Condition",
      "tex": "\\text{Skip Row Group if } \\left( v_{\\mathrm{target}} < \\min(C_{j,g}) \\;\\lor\\; v_{\\mathrm{target}} > \\max(C_{j,g}) \\right)",
      "p": "If the target query value falls outside the min-max boundary stored in row group header $g$, the entire chunk is bypassed without decompression."
    },
    {
      "h": "Delta Lake ACID Serialisability",
      "tex": "T_{\\mathrm{commit}}(k) = \\mathrm{AtomicWrite}(\\text{\\_delta\\_log/}00000k.\\mathrm{json})",
      "p": "State transitions in Delta Lake are recorded through atomic commit logs, guaranteeing that concurrent readers always observe consistent snapshots."
    }
  ],
  "code": "import pandas as pd\nimport numpy as np\nimport os\n\n# Create synthetic dataset with diverse column types\nN = 100_000\ndf = pd.DataFrame({\n    'user_id': [f\"usr_{i:06d}\" for i in range(N)],\n    'category': np.random.choice(['electronics', 'books', 'fashion', 'home'], size=N),\n    'amount': np.random.exponential(scale=50.0, size=N),\n    'is_fraud': np.random.choice([0, 1], size=N, p=[0.99, 0.01])\n})\n\n# 1. Save as uncompressed CSV\ncsv_path = 'sample_data.csv'\ndf.to_csv(csv_path, index=False)\ncsv_size_mb = os.path.getsize(csv_path) / (1024 * 1024)\n\n# 2. Save as columnar Parquet with Snappy compression\nparquet_path = 'sample_data.parquet'\ndf.to_parquet(parquet_path, engine='pyarrow', compression='snappy')\nparquet_size_mb = os.path.getsize(parquet_path) / (1024 * 1024)\n\nprint(f\"CSV File Size:     {csv_size_mb:.2f} MB\")\nprint(f\"Parquet File Size: {parquet_size_mb:.2f} MB\")\nprint(f\"Storage Reduction: {(1.0 - parquet_size_mb / csv_size_mb) * 100:.1f}% space saved!\")\n\n# Clean up temp files\nos.remove(csv_path)\nos.remove(parquet_path)",
  "keyPoints": [
    "Parquet stores data column-by-column, enabling high compression ratios and partial column reads.",
    "Predicate pushdown skips entire blocks of records using min/max statistics in file footers.",
    "Delta Lake adds an ACID transaction log to Parquet, preventing dirty reads and corrupted writes.",
    "Delta Time Travel enables querying historical snapshots for reproducible model training."
  ],
  "pitfalls": [
    "The \"Small Files Problem\": Writing thousands of tiny 50KB Parquet files overwhelms storage metadata and degrades query speed; compact files into 128MB–1GB sizes.",
    "Over-partitioning: Partitioning tables by high-cardinality keys (like user ID or timestamp) creates millions of empty folders; partition only by coarse keys (year, month).",
    "Ignoring column projection: Running `SELECT *` defeats the entire efficiency advantage of columnar formats by forcing disk reads of all columns."
  ],
  "quiz": [
    {
      "q": "Why does Apache Parquet achieve significantly higher compression ratios than CSV or JSON formats?",
      "o": [
        "Parquet encrypts data with 256-bit AES algorithms",
        "Parquet stores values column-by-column; identical data types stored contiguously compress far more efficiently using dictionary encoding and run-length encoding",
        "Parquet deletes duplicate rows automatically",
        "CSV files cannot be compressed with gzip"
      ],
      "a": 1,
      "why": "Contiguous values of identical types exhibit low entropy and repeated patterns, allowing columnar encoders (Snappy, ZSTD, Dictionary encoding) to compress tightly."
    },
    {
      "q": "What is \"predicate pushdown\" in columnar query engines like Spark and DuckDB?",
      "o": [
        "Pushing calculations to client web browsers",
        "Using min/max summary metadata in file footers to skip reading entire row groups that cannot contain matching rows, without decompressing the data",
        "Sorting numbers in descending order",
        "Converting text columns to uppercase"
      ],
      "a": 1,
      "why": "Predicate pushdown evaluates filter conditions against file block metadata. If a row group's maximum value is less than the filter value, the engine skips the block entirely."
    },
    {
      "q": "What critical capability does Delta Lake's transaction log (`_delta_log/`) provide for machine learning pipelines?",
      "o": [
        "It translates Python code into C++",
        "It provides ACID transactions and time travel, allowing models to train on exact historical snapshots of data as they existed at a specific time",
        "It replaces the need for GPUs during neural network training",
        "It automatically computes feature importance scores"
      ],
      "a": 1,
      "why": "Delta Lake's transaction log enables ACID guarantees and time-travel querying, ensuring datasets are not corrupted by partial writes and historical states can be reproduced exactly."
    }
  ],
  "related": [
    "spark-essentials",
    "data-cleaning-and-validation",
    "reproducibility"
  ],
  "keywords": "parquet, delta lake, columnar storage, acid transactions, predicate pushdown, time travel, compression, lakehouse, snappy"
},
  {
  "id": "spark-essentials",
  "short": "Spark essentials",
  "title": "Apache Spark Essentials for Machine Learning: Resilient Distributed Data and Catalyst Optimisation",
  "task": "concepts",
  "level": 2,
  "minutes": 17,
  "noLab": true,
  "usedBy": [],
  "summary": "Scaling data preprocessing to terabytes with Apache Spark DataFrames, lazy evaluation, Catalyst query optimisation, and distributed shuffle management.",
  "lead": "Single-node Python tools like pandas and NumPy are constrained by the RAM of a single physical machine. When datasets expand beyond dozens of gigabytes into terabyte scales, single-node processes crash with out-of-memory errors. Apache Spark provides distributed computing across clusters of worker machines, executing complex SQL queries, feature transformations, and matrix operations in parallel with resilient fault tolerance.",
  "analogy": "Imagine a team sorting and counting 10 million mail packages. If one worker tries to carry the entire warehouse of mail onto their desk at once, the desk collapses under the weight. Instead, a supervisor (Spark Driver) partitions the mail into 100 balanced carts and assigns each cart to a separate sorter (Spark Executor). If one sorter trips and drops their cart, only that single cart is reloaded and recounted, while the remaining 99 continue working uninterrupted.",
  "intuition": [
    "Spark's architecture follows a Driver-Executor master-worker topology. The Driver node contains the central coordination process, compiling user code into execution stages. Worker nodes run Executors—JVM processes that store partition data in RAM and execute parallel tasks.",
    "Spark operations are strictly divided into Transformations (e.g. `select`, `filter`, `groupBy`, `join`) and Actions (e.g. `count`, `collect`, `write`). Transformations are lazily evaluated: Spark records transformations as a logical plan without executing them until an Action is explicitly triggered.",
    "Lazy evaluation enables the Catalyst Optimiser to inspect the complete workflow end-to-end. Catalyst rearranges operators, pushes filters down to Parquet files (filter pushdown), eliminates dead columns (projection pruning), and selects optimal join strategies (broadcasting small tables to eliminate network shuffles).",
    "The primary performance bottleneck in distributed computing is data shuffling: redistributing partitions across network cables during wide transformations (such as `groupBy` or `join`). Managing partition counts and leveraging broadcast joins prevents cluster network congestion and out-of-memory executor crashes."
  ],
  "steps": [
    "Initialise SparkSession: Configure driver and executor RAM budgets and cluster manager endpoints.",
    "Load distributed data: Ingest Parquet, Delta Lake, or CSV partitions lazily into distributed DataFrames.",
    "Formulate declarative transformations: Apply filtering, aggregations, window functions, and string tokenisation using the PySpark DataFrame API.",
    "Inspect physical execution plan: Call `df.explain(True)` to review Catalyst optimisation, partition pruning, and broadcast join execution.",
    "Mitigate shuffle bottlenecks: For joins where one table is under 100MB, wrap the table in `broadcast()` to eliminate full network shuffles.",
    "Trigger terminal action: Execute an action (`write.parquet()` or `count()`) to trigger the physical DAG computation across the cluster."
  ],
  "math": [
    {
      "h": "Distributed Partition Work Distribution",
      "tex": "T_{\\mathrm{exec}} = \\max_{k \\in \\{1, \\dots, P\\}} \\left( \\frac{\\operatorname{Vol}(p_k)}{\\mathrm{Throughput}_k} \\right) + T_{\\mathrm{shuffle}}",
      "p": "Total job execution time is bounded by the slowest, largest partition (the straggler) plus network shuffle latency $T_{\\mathrm{shuffle}}$."
    },
    {
      "h": "Broadcast Hash Join Communication Cost",
      "tex": "\\operatorname{Comm}_{\\mathrm{broadcast}} = O(N_{\\mathrm{small}} \\cdot K_{\\mathrm{executors}}) \\ll \\operatorname{Comm}_{\\mathrm{shuffle}} = O(N_{\\mathrm{large}} + N_{\\mathrm{small}})",
      "p": "Broadcasting small table $N_{\\mathrm{small}}$ avoids shuffling massive dataset $N_{\\mathrm{large}}$ across the network, reducing network I/O by orders of magnitude."
    },
    {
      "h": "Catalyst Relational Algebra Equivalence",
      "tex": "\\sigma_{\\mathrm{cond}}(\\pi_{\\mathcal{A}}(R)) \\equiv \\pi_{\\mathcal{A}}(\\sigma_{\\mathrm{cond}}(R))",
      "p": "Catalyst pushes relational filter selection $\\sigma$ prior to column projection $\\pi$ to minimise intermediate data volumes in memory."
    }
  ],
  "code": "from pyspark.sql import SparkSession\nfrom pyspark.sql import functions as F\n\n# Initialise local SparkSession\nspark = SparkSession.builder \\\n    .appName(\"MLFeatureEngineering\") \\\n    .master(\"local[2]\") \\\n    .config(\"spark.sql.shuffle.partitions\", \"4\") \\\n    .getOrCreate()\n\n# Create sample distributed dataset\ndata = [\n    (\"usr_1\", \"electronics\", 250.0, \"2026-04-01\"),\n    (\"usr_2\", \"books\", 15.0, \"2026-04-01\"),\n    (\"usr_1\", \"electronics\", 80.0, \"2026-04-02\"),\n    (\"usr_3\", \"home\", 450.0, \"2026-04-02\"),\n    (\"usr_2\", \"fashion\", 60.0, \"2026-04-03\"),\n]\ncolumns = [\"user_id\", \"category\", \"spend\", \"event_date\"]\ndf = spark.createDataFrame(data, columns)\n\n# Perform distributed lazy transformations\nuser_aggregates = df.filter(F.col(\"spend\") > 20.0) \\\n    .groupBy(\"user_id\") \\\n    .agg(\n        F.sum(\"spend\").alias(\"total_spend\"),\n        F.count(\"category\").alias(\"transaction_count\"),\n        F.avg(\"spend\").alias(\"avg_spend\")\n    )\n\n# Inspect Catalyst execution plan\nuser_aggregates.explain()\n\n# Trigger Action (collect results back to Driver)\nresults = user_aggregates.collect()\nfor row in results:\n    print(f\"User: {row['user_id']} | Total: £{row['total_spend']:.2f} | Count: {row['transaction_count']}\")\n\nspark.stop()",
  "keyPoints": [
    "Apache Spark scales data processing across distributed clusters with master-worker topology.",
    "Transformations are lazily evaluated, allowing the Catalyst Optimiser to construct optimal physical execution plans.",
    "Network shuffles during wide operations (`groupBy`, `join`) represent the primary performance bottleneck.",
    "Broadcast joins copy small lookup tables to every worker, eliminating expensive full-cluster data shuffling."
  ],
  "pitfalls": [
    "Data skew: If 90% of user records belong to a single \"guest\" ID, one executor processes almost the entire dataset while others sit idle (the straggler problem).",
    "Calling `.collect()` on massive DataFrames: Calling `collect()` pulls all distributed data into the Driver node's local RAM, instantly crashing the Driver with an Out-of-Memory error.",
    "Uncontrolled partitioning: Creating too few partitions under-utilises CPU cores; creating millions of tiny partitions creates excessive task scheduling overhead."
  ],
  "quiz": [
    {
      "q": "Why are transformations in Apache Spark (like `.filter()` or `.select()`) lazily evaluated?",
      "o": [
        "Because Java cannot run immediately",
        "Lazy evaluation allows Spark's Catalyst optimiser to analyse the complete query graph and reorder operations for maximum execution efficiency before running",
        "Because Spark requires human confirmation before performing math",
        "To prevent hard drives from overheating"
      ],
      "a": 1,
      "why": "Lazy evaluation lets the Catalyst query planner optimise the global execution graph—pushing filters down and pruning unused columns before touching disk."
    },
    {
      "q": "What is a \"Broadcast Hash Join\" in Apache Spark?",
      "o": [
        "A join that converts all data to radio signals",
        "A join where a small table is copied in full to every worker executor, eliminating the need to shuffle the large table across the network",
        "A join that randomly deletes mismatched records",
        "A join that runs exclusively on GPUs"
      ],
      "a": 1,
      "why": "Broadcast joins distribute the entire small table to every node. Each node can then join its local partition of the massive table without any network shuffle."
    },
    {
      "q": "What catastrophic mistake occurs if an engineer runs `df.collect()` on a 5-terabyte distributed Spark DataFrame?",
      "o": [
        "The cluster CPUs will permanently freeze",
        "Spark will attempt to pull all 5 terabytes across the network into the single Driver node's RAM, instantly causing an Out-of-Memory (OOM) crash",
        "All Parquet files on disk will be deleted",
        "The driver node will automatically reformat the hard drive"
      ],
      "a": 1,
      "why": "`collect()` transmits all distributed partitions to the central Driver memory. If the data exceeds Driver RAM, the process crashes."
    }
  ],
  "related": [
    "data-formats-parquet-and-delta",
    "orchestration-with-airflow-and-databricks",
    "pandas-and-polars-patterns"
  ],
  "keywords": "spark, pyspark, big data, catalyst optimiser, lazy evaluation, broadcast join, data skew, distributed computing, dataframe"
},
];
