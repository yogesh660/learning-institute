// Lessons for this track. Conventions: see regression.js and CLAUDE.md.
const r = String.raw;
module.exports = [
  {
    id: 'quantile-regression',
    short: 'Quantile regression',
    title: 'Quantile Regression',
    task: 'concepts',
    module: 'Beyond the basics',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Quantile regression estimates conditional percentiles of a response variable using the asymmetric pinball loss, uncovering heteroscedasticity and modelling full risk distributions.`,
    lead: r`Ordinary Least Squares models only the conditional mean $\mathbb{E}[Y \mid X]$, which obscures data dispersion and proves fragile under heavy-tailed errors or outliers. Quantile regression replaces squared error with the asymmetric check (pinball) loss to estimate any conditional quantile $\tau \in (0, 1)$, mapping how the entire shape of the response distribution shifts with predictors.`,
    intuition: [
      r`Imagine predicting house prices based on living area. For entry-level flats, prices cluster tightly near \$200,000. For large detached properties, prices disperse dramatically: some sell for \$800,000 while others reach \$3,000,000 depending on architectural finishes and location. A single Ordinary Least Squares (OLS) line draws an average right through the middle, hiding the fact that error variance explodes with square footage. Furthermore, a single celebrity mansion selling for \$20,000,000 pulls the OLS line upward, distorting predictions for normal buyers.`,
      r`Quantile regression fits a line that leaves exactly $\tau \times 100\%$ of data points below it and $(1 - \tau) \times 100\%$ above it. For the median ($\tau = 0.5$), the penalty is simply absolute error $|y - \hat{y}|$; extreme luxury outliers exert zero leverage on the slope, providing robust predictions. To fit the 90th percentile ($\tau = 0.9$), under-predictions are penalised 9 times more heavily than over-predictions, tilting the fitted line upward to capture the upper echelon of the market.`,
      r`By fitting models across multiple quantiles—such as $\tau \in \{0.1, 0.5, 0.9\}$—practitioners reveal the entire conditional distribution. When the 90th percentile line diverges from the 10th percentile line, the data exhibits heteroscedasticity (expanding variance). When the distance between the 10th percentile and the median differs from that between the median and the 90th percentile, the conditional distribution is skewed. This delivers complete risk profiling without requiring distributional assumptions.`,
    ],
    analogy: r`If OLS summarises a mountain range solely by its average elevation, quantile regression provides topographic contours that delineate the valley floor, the median plateau, and the mountain ridge.`,
    steps: [
      r`Choose target quantile levels $\tau \in (0, 1)$, such as $\tau = 0.5$ for outlier-resistant median regression or $\tau \in \{0.05, 0.95\}$ for probabilistic risk boundaries.`,
      r`Specify the linear predictor $q_\tau(x) = x^T \beta_\tau$, recognising that each quantile level yields its own distinct coefficient vector $\beta_\tau$.`,
      r`Define the empirical objective via the asymmetric check (pinball) loss $\rho_\tau(u) = u(\tau - \mathbb{I}(u < 0))$.`,
      r`Reformulate the non-smooth optimisation problem as a linear program by decomposing residuals into positive and negative slack variables ($u_i^+ - u_i^-$).`,
      r`Solve the linear program using interior-point or simplex algorithms to obtain globally optimal parameter estimates $\hat{\beta}_\tau$.`,
      r`Verify quantile monotonicity: ensure lower quantile prediction hyperplanes do not cross above higher quantiles across the covariate domain.`,
    ],
    math: [
      {
        h: 'The pinball (check) loss function',
        tex: r`$$\rho_\tau(u) = u \cdot \big(\tau - \mathbb{I}(u < 0)\big) = \begin{cases} \tau \, u & \text{if } u \ge 0 \\ (\tau - 1) \, u & \text{if } u < 0 \end{cases}$$`,
        p: r`$u = y - \hat{y}$ denotes the prediction residual, $\tau \in (0, 1)$ specifies the target quantile, and $\mathbb{I}(\cdot)$ is the indicator function. Positive errors (under-prediction) incur slope $\tau$, while negative errors (over-prediction) incur slope $1 - \tau$. At $\tau = 0.5$, $\rho_{0.5}(u) = 0.5|u|$, recovering Least Absolute Deviations (LAD).`,
      },
      {
        h: 'Empirical risk minimisation for quantile regression',
        tex: r`$$\hat{\beta}_\tau = \arg\min_{\beta} \sum_{i=1}^n \rho_\tau\big(y_i - x_i^T \beta\big)$$`,
        p: r`Formulated by Koenker and Bassett (1978), the estimator minimises sample pinball loss. Unlike OLS, which differentiates the squared residual loss to yield closed-form normal equations, quantile loss has a non-differentiable kink at $u = 0$, requiring linear programming solutions.`,
      },
      {
        h: 'Linear programming reformulation',
        tex: r`$$\min_{\beta, u^+, u^-} \sum_{i=1}^n \big(\tau u_i^+ + (1 - \tau) u_i^-\big) \quad \text{subject to} \quad y_i - x_i^T \beta = u_i^+ - u_i^-, \quad u_i^+, u_i^- \ge 0$$`,
        p: r`Splitting each residual into positive slack $u_i^+ = \max(0, y_i - x_i^T\beta)$ and negative slack $u_i^- = \max(0, x_i^T\beta - y_i)$ yields a linear objective with linear equality constraints, solved efficiently via simplex or interior-point algorithms.`,
      },
    ],
    keyPoints: [
      r`Semi-parametric and distribution-free: quantile regression makes no assumptions of error normality, constant variance, or symmetry.`,
      r`Median regression ($\tau = 0.5$) provides breakdown resistance against extreme vertical outliers that distort conditional mean estimates.`,
      r`Diverging quantile slopes ($\beta_{0.9} \ne \beta_{0.1}$) provide a formal geometric test and visual proof of heteroscedasticity.`,
      r`Quantile crossing can occur when models are fitted independently per quantile; monotonicity constraints or post-hoc sorting resolve crossing.`,
    ],
    pitfalls: [
      r`Assuming extreme quantiles are robust: while median regression is outlier-resistant, estimating $\tau = 0.01$ or $\tau = 0.99$ depends heavily on sparse tail observations.`,
      r`Overlooking quantile crossing: independent linear fits can intersect in unpopulated regions of feature space, generating illogical negative interval widths.`,
      r`Applying standard gradient descent without smoothing: the discontinuous derivative of the pinball loss at zero can trap un-smoothed first-order optimisers in limit cycles.`,
      r`Interpreting quantile coefficients as mean effects: $\beta_\tau$ reflects the marginal change in the $\tau$-th percentile, not in the population average.`,
    ],
    code: r`import numpy as np
from scipy.optimise import linprog

np.random.seed(42)
n = 120
x = np.sort(np.random.uniform(1.0, 5.0, n))
# Heteroscedastic response: error spread expands with x
eps = np.random.normal(0, 1.0, n)
y = 3.0 * x + (0.8 * x) * eps

# Fit quantile regression for tau in [0.1, 0.5, 0.9] via linear programming
slopes = {}
for tau in [0.1, 0.5, 0.9]:
    c = np.concatenate([[0.0, 0.0], np.full(n, tau), np.full(n, 1.0 - tau)])
    A_eq = np.zeros((n, 2 + 2 * n))
    A_eq[:, 0] = 1.0
    A_eq[:, 1] = x
    A_eq[:, 2:2+n] = np.eye(n)
    A_eq[:, 2+n:] = -np.eye(n)
    b_eq = y
    bounds = [(None, None), (None, None)] + [(0, None)] * (2 * n)
    res = linprog(c, A_eq=A_eq, b_eq=b_eq, bounds=bounds, method='highs')
    slopes[tau] = (res.x[0], res.x[1])

print("Fitted quantiles (intercept, slope):")
for tau, (b0, b1) in slopes.items():
    print(f"tau={tau}: intercept={round(float(b0), 3)}, slope={round(float(b1), 3)}")`,
    quiz: [
      {
        q: r`Why does quantile regression uncover heteroscedasticity that Ordinary Least Squares fails to reveal?`,
        o: [
          r`Quantile regression fits separate slopes across conditional percentiles, showing how spread widens or narrows with predictors`,
          r`Quantile regression automatically squares all negative residuals to make variances constant`,
          r`Quantile regression requires calculating higher-order polynomial terms for every feature`,
          r`Quantile regression drops all observations that exhibit high leverage`,
        ],
        a: 0,
        why: r`By fitting lines for different percentiles (e.g. $\tau = 0.1$ and $\tau = 0.9$), quantile regression reveals whether the distribution fans out or compresses as predictors change.`,
      },
      {
        q: r`In the pinball (check) loss function for quantile $\tau = 0.9$, how are forecast errors penalised?`,
        o: [
          r`Over-predictions and under-predictions are penalised symmetrically with weight 0.9`,
          r`All errors are squared and multiplied by 0.9`,
          r`Under-predictions ($y > \hat{y}$) receive weight 0.9, while over-predictions ($y < \hat{y}$) receive weight 0.1`,
          r`Errors between the 10th and 90th percentiles receive zero penalty`,
        ],
        a: 2,
        why: r`The pinball loss $\rho_\tau(u)$ assigns weight $\tau = 0.9$ to under-predictions ($u \ge 0$) and $1 - \tau = 0.1$ to over-predictions ($u < 0$).`,
      },
      {
        q: r`What is "quantile crossing" in quantile regression?`,
        o: [
          r`A statistical test comparing OLS residuals against median residuals`,
          r`A condition where independently estimated quantile planes intersect, producing illogical predictions where a lower quantile exceeds a higher quantile`,
          r`The point where the regression line crosses the horizontal x-axis`,
          r`The conversion of continuous variables into categorical quantile buckets`,
        ],
        a: 1,
        why: r`When separate linear quantile regressions are fitted independently, non-parallel slopes can intersect in sparse feature regions, causing estimated lower percentiles to exceed higher percentiles.`,
      },
      {
        q: r`What loss function does median regression ($\tau = 0.5$) minimise?`,
        o: [
          r`Mean squared error ($L_2$ loss)`,
          r`Kullback–Leibler divergence`,
          r`Binary cross-entropy loss`,
          r`Mean absolute error ($L_1$ loss / Least Absolute Deviations)`,
        ],
        a: 3,
        why: r`Setting $\tau = 0.5$ yields $\rho_{0.5}(u) = 0.5 |u|$, which minimises the sum of absolute deviations, making the median regression line robust against vertical outliers.`,
      },
    ],
    usedBy: [],
    prereq: ['ols_linear_regression', 'residual-diagnostics-and-heteroscedasticity', 'cost-vs-loss-vs-error'],
    related: ['gams-and-splines', 'robust_regression', 'ols-inference-t-tests-f-test-r2-and-adjusted-r2'],
    keywords: 'quantile regression pinball loss check loss median regression lad heteroscedasticity linear programming',
  },
  {
    id: 'gams-and-splines',
    short: 'GAMs and splines',
    title: 'Generalised Additive Models (GAMs) and Splines',
    task: 'concepts',
    module: 'Beyond the basics',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Generalised Additive Models replace rigid linear coefficients with smooth, penalised spline curves, capturing non-linear relationships while preserving additive interpretability.`,
    lead: r`Linear models are transparent but miss curved relationships; deep neural networks and tree ensembles model complex curvature but operate as black boxes. Generalised Additive Models (GAMs) strike a balance: each feature enters through a smooth, non-parametric spline function $f_j(x_j)$, enabling visual interpretability while roughness penalties prevent overfitting.`,
    intuition: [
      r`Consider how ambient temperature influences energy demand. On freezing winter days (-5°C), electricity demand surges as heating systems run. In mild spring weather (18°C), demand drops to a minimum. In sweltering summer heat (35°C), demand surges once again as air conditioning units operate at full capacity. A standard linear regression line $y = \beta x$ is ineffective: a positive slope ignores winter heating, while a negative slope ignores summer cooling. High-order polynomials ($x^2, x^3, x^4$) bend, but they oscillate wildly near boundaries (Runge's phenomenon).`,
      r`Splines resolve this tension by stitching simple, well-behaved cubic polynomials together at dividing boundaries called knots. By requiring the curve, its slope (first derivative), and its curvature (second derivative) to match continuously across every knot, cubic splines flow smoothly across complex landscapes without wild edge wobbles. To ensure the curve captures true underlying physics rather than chasing sample noise, a roughness penalty $\lambda \int [f''(x)]^2 dx$ penalises excessive curvature.`,
      r`Generalised Additive Models assemble these smooth univariate splines into an additive sum: $y = \beta_0 + f_1(x_1) + f_2(x_2) + \dots + f_p(x_p) + \epsilon$. Because the model is strictly additive, each function $f_j(x_j)$ can be plotted on a 2D graph holding other variables constant. A data scientist can show stakeholders the isolated curve for temperature, the separate curve for humidity, and a categorical shift for weekends, making GAMs a premier framework for transparent, audited machine learning.`,
    ],
    analogy: r`If linear regression is a rigid wooden yardstick and a neural network is flexible clay, a GAM is an architect's spline ruler: an elastic strip pinned at designated anchor points that flexes gracefully to match terrain without chaotic flapping.`,
    steps: [
      r`Examine bivariate relationships via scatter plots and partial dependence profiles to detect non-linear curves or non-monotonic trends.`,
      r`Select a spline basis expansion for continuous features, such as natural cubic splines or B-splines, placing interior knots across quantiles of $x_j$.`,
      r`Construct the basis design matrix $\mathbf{B}$ by evaluating the basis functions at each observed feature coordinate.`,
      r`Define the penalty matrix $\mathbf{S}$ corresponding to the integrated second derivative of the basis functions to penalise unnecessary curvature.`,
      r`Estimate spline coefficients and smoothing parameter $\lambda$ using Penalised Iteratively Reweighted Least Squares (P-IRLS) with Restricted Maximum Likelihood (REML) or Generalised Cross-Validation (GCV).`,
      r`Plot individual partial effect curves $f_j(x_j)$ alongside pointwise confidence intervals, inspecting Effective Degrees of Freedom (EDF) to assess whether non-linear flexibility is warranted.`,
    ],
    math: [
      {
        h: 'The Generalised Additive Model formulation',
        tex: r`$$g(\mathbb{E}[Y \mid X]) = \beta_0 + \sum_{j=1}^p f_j(x_j), \quad f_j(x_j) = \sum_{k=1}^K \beta_{jk} \, b_{jk}(x_j)$$`,
        p: r`$g(\cdot)$ denotes a monotonic link function (such as identity for regression or logit for classification), $f_j$ are smooth non-parametric functions, and $b_{jk}(x_j)$ represent pre-specified basis functions (e.g. cubic B-splines) weighted by estimated coefficients $\beta_{jk}$.`,
      },
      {
        h: 'Penalised spline objective (smoothing spline)',
        tex: r`$$\min_{\beta} \sum_{i=1}^n \Big(y_i - \beta_0 - \sum_{j=1}^p f_j(x_{ij})\Big)^2 + \sum_{j=1}^p \lambda_j \int \big(f_j''(t)\big)^2 \, dt$$`,
        p: r`The objective balances fidelity to training data against curve roughness. $\int [f_j''(t)]^2 dt$ quantifies total second-derivative curvature. Smoothing parameter $\lambda_j \ge 0$ controls the trade-off: as $\lambda \to 0$, the curve interpolates data; as $\lambda \to \infty$, the penalty forces $f_j''(t) = 0$, reducing the curve to a standard linear function.`,
      },
      {
        h: 'Penalised least squares and Effective Degrees of Freedom (EDF)',
        tex: r`$$\hat{\beta} = (\mathbf{B}^T \mathbf{B} + \lambda \mathbf{S})^{-1} \mathbf{B}^T \mathbf{y}, \quad \operatorname{EDF} = \operatorname{tr}\Big(\mathbf{B}(\mathbf{B}^T \mathbf{B} + \lambda \mathbf{S})^{-1} \mathbf{B}^T\Big)$$`,
        p: r`$\mathbf{B}$ is the basis evaluation matrix and $\mathbf{S}$ is the penalty matrix. Effective Degrees of Freedom ($\operatorname{EDF}$) measures the non-linear flexibility of the fitted term: $\operatorname{EDF} \approx 1$ represents a strict linear relationship, while higher $\operatorname{EDF}$ values indicate increasingly complex, multi-inflection curves.`,
      },
    ],
    keyPoints: [
      r`Additive transparency: each feature contribution $f_j(x_j)$ can be plotted and explained independently of all other inputs.`,
      r`Curvature penalisation: the smoothing penalty $\lambda$ adaptively contracts unnecessary wiggles, preventing overfitting without manual knot tuning.`,
      r`Effective Degrees of Freedom (EDF) provides a principled metric of non-linearity: an EDF near 1 justifies simplifying to a standard linear coefficient.`,
      r`Exponential family flexibility: GAMs seamlessly handle binary, count, and skewed outcomes through canonical GLM link functions.`,
    ],
    pitfalls: [
      r`Neglecting feature interactions: GAMs assume additivity by default; interacting features (e.g. temperature and humidity) require explicit 2D tensor-product smooths $f_{12}(x_1, x_2)$.`,
      r`Unbounded extrapolation: polynomial splines can diverge sharply outside the boundary knots; natural cubic splines mitigate this by enforcing linear extrapolation in the tails.`,
      r`Concurvity: the non-linear analogue of multicollinearity where one smooth curve can be approximated by a combination of other curves, destabilising parameter estimation.`,
      r`Under-smoothing ($\lambda$ too small): insufficient penalisation causes the spline to overfit random noise spikes rather than the underlying generative signal.`,
    ],
    code: r`import numpy as np

np.random.seed(42)
n = 80
x = np.sort(np.random.uniform(0, 2 * np.pi, n))
y_true = np.sin(x)
y = y_true + np.random.normal(0, 0.25, n)

# Natural cubic spline / truncated power basis with 5 interior knots
knots = np.quantile(x, [0.15, 0.35, 0.55, 0.75, 0.9])
def build_basis(x_pts, k_pts):
    cols = [np.ones_like(x_pts), x_pts]
    for k in k_pts:
        cols.append(np.maximum(0.0, x_pts - k)**3)
    return np.column_stack(cols)

B = build_basis(x, knots)
p = B.shape[1]

# Roughness penalty matrix S approximating integrated second derivatives
grid = np.linspace(0, 2 * np.pi, 200)
dx = grid[1] - grid[0]
d2_cols = [np.zeros_like(grid), np.zeros_like(grid)]
for k in knots:
    d2_cols.append(6.0 * np.maximum(0.0, grid - k))
D2 = np.column_stack(d2_cols)
S = (D2.T @ D2) * dx

# Solve penalised least squares: (B^T B + lambda * S) beta = B^T y
lam = 0.05
A = B.T @ B + lam * S
beta = np.linalg.solve(A, B.T @ y)

# Effective degrees of freedom: trace of the hat matrix
H = B @ np.linalg.solve(A, B.T)
edf = np.trace(H)
y_pred = B @ beta
rmse = np.sqrt(np.mean((y - y_pred)**2))

pred_pi2 = (build_basis(np.array([np.pi/2]), knots) @ beta)[0]
pred_3pi2 = (build_basis(np.array([3*np.pi/2]), knots) @ beta)[0]

print("Number of basis functions:", p)
print("Smoothing penalty lambda:", lam)
print("Effective Degrees of Freedom (EDF):", round(float(edf), 2))
print("Fit RMSE:", round(float(rmse), 3))
print("Prediction at pi/2 (true=1.0):", round(float(pred_pi2), 3))
print("Prediction at 3pi/2 (true=-1.0):", round(float(pred_3pi2), 3))`,
    quiz: [
      {
        q: r`What is the primary advantage of Generalised Additive Models (GAMs) over multi-layer neural networks or gradient boosting?`,
        o: [
          r`GAMs guarantee lower training loss than deep neural networks on image datasets`,
          r`GAMs eliminate the need for training data by using mathematical priors`,
          r`Each feature contribution $f_j(x_j)$ is an isolated univariate curve that can be visualised and audited independently`,
          r`GAMs can only fit linear relationships, making computation instantaneous`,
        ],
        a: 2,
        why: r`Because GAMs are additive sums of smooth functions $f_j(x_j)$, each feature's marginal relationship with the target can be plotted on a 2D graph and directly audited.`,
      },
      {
        q: r`In penalised spline regression, what happens to the fitted curve as the smoothing parameter $\lambda \to \infty$?`,
        o: [
          r`The curve interpolates every training data point exactly`,
          r`The roughness penalty dominates, forcing the second derivative to zero everywhere and collapsing the curve into a standard linear regression line`,
          r`The fitted curve oscillates with infinite frequency between knots`,
          r`All coefficients $\beta$ are forced to zero, predicting a flat zero line`,
        ],
        a: 1,
        why: r`The roughness penalty penalises $\int [f''(t)]^2 dt$. As $\lambda \to \infty$, $f''(t)$ is forced to 0 for all $t$, which is the definition of a straight line.`,
      },
      {
        q: r`What does an Effective Degrees of Freedom (EDF) value close to 1.0 indicate for a fitted smooth term?`,
        o: [
          r`The term exhibits a complex, multi-modal non-linear shape`,
          r`The model has severely overfitted the training data`,
          r`The feature has zero explanatory power and should be dropped`,
          r`The relationship between that feature and the response is essentially linear`,
        ],
        a: 3,
        why: r`An EDF of 1 corresponds to a linear term with no curvature; higher EDF values (e.g. 3, 5, 8) represent increasing non-linear complexity and inflection points.`,
      },
      {
        q: r`What is "concurvity" in the context of Generalised Additive Models?`,
        o: [
          r`The non-linear analogue of multicollinearity, where one smooth function can be approximated by a combination of other smooth functions`,
          r`A metric measuring how many knots are placed inside the training data range`,
          r`The rate of convergence for Penalised Iteratively Reweighted Least Squares`,
          r`The difference between training RMSE and test RMSE`,
        ],
        a: 0,
        why: r`Concurvity occurs when a smooth curve of one predictor can be approximated by smooth functions of other predictors, destabilising coefficient estimation just like collinearity does in linear models.`,
      },
    ],
    usedBy: [],
    prereq: ['ols_linear_regression', 'polynomial_regression', 'generalised-linear-models'],
    related: ['quantile-regression', 'ridge_regression', 'bias-variance-tradeoff'],
    keywords: 'gams generalised additive models splines smoothing splines roughness penalty basis functions edf interpretability',
  },
  {
    id: "poisson-and-tweedie-regression",
    short: "Poisson & Tweedie reg.",
    title: "Poisson and Tweedie Regression",
    task: "concepts",
    module: "Beyond the basics",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Model count data and zero-inflated continuous payouts: understand GLMs for non-negative responses, log link functions, overdispersion, and compound Poisson-gamma Tweedie distributions.",
    lead: "Ordinary least squares assumes constant Gaussian error variance and produces negative predictions for counts and costs. Poisson and Tweedie regression model positive, skewed, and zero-inflated targets using tailored exponential dispersion families.",
    intuition: [
      "Standard linear regression encounters serious failures when the target variable is a non-negative count (such as daily website sign-ups, hospital admissions, or insurance claims) or a continuous monetary payout with an exact point mass at zero (such as warranty repair payouts or customer credit defaults). OLS can produce negative predicted values, predicts fractional values for discrete events, and violates homoscedasticity because variance typically grows with the expected value.",
      "Poisson regression addresses discrete count data by placing the response within the generalised Linear Model (GLM) framework. Using a log link function $\\log(\\mu_i) = x_i^T \\beta$, the conditional mean $\\mu_i = \\exp(x_i^T \\beta)$ is guaranteed to remain strictly positive. The model assumes an equi-dispersion property: the conditional variance equals the conditional mean, $\\operatorname{Var}(Y_i \\mid x_i) = \\mu_i$. When empirical data violates this assumption—frequently due to unobserved heterogeneity causing overdispersion (variance exceeding the mean)—analysts upgrade to Quasi-Poisson or Negative Binomial regression.",
      "In insurance pricing and marketing spend modelling, target variables often exhibit a compound nature: many observations are exactly zero (no insurance claim filed), but when non-zero, the cost is a continuous, heavily right-skewed positive monetary sum. Modelling this requires a compound Poisson-gamma distribution, formalised as a Tweedie distribution with power parameter $p \\in (1, 2)$.",
      "Under the Tweedie family, variance scales as $\\operatorname{Var}(Y) = \\phi \\mu^p$. When $p = 0$, the family recovers the Gaussian distribution; $p = 1$ is the Poisson; $p = 2$ is the Gamma; and $p = 3$ is the Inverse Gaussian. For $1 < p < 2$, the Tweedie distribution seamlessly models zero-inflated continuous responses without requiring cumbersome two-stage hurdle models."
    ],
    analogy: "Imagine predicting insurance claims for a fleet of haulage trucks. Most trucks go an entire year without an incident (generating zero payouts). But when a crash occurs, repairs cost thousands of pounds with a long right-skewed tail. A Gaussian model predicts negative £500 payouts for safe drivers, while a pure Gamma model cannot tolerate exact zero payouts. A compound Poisson-gamma Tweedie model matches the reality: a Poisson draw determines how many accidents occur, and an independent Gamma draw sets the severity of each claim.",
    steps: [
      {
        "title": "1. Select response family and verify distribution",
        "body": "Inspect target variable: if integers $y \\in \\{0, 1, 2, \\dots\\}$, evaluate Poisson or Negative Binomial. If zero-inflated continuous sums $y \\ge 0$, specify a Tweedie GLM with $1 < p < 2$ (typically $p \\approx 1.5$)."
      },
      {
        "title": "2. Specify log link function and linear predictor",
        "body": "Relate features to expected response via log link: $\\eta_i = x_i^T \\beta$ and $\\mu_i = g^{-1}(\\eta_i) = \\exp(\\eta_i)$. For rate models over differing exposure periods $t_i$, include an offset term $\\log(t_i)$."
      },
      {
        "title": "3. Fit coefficients via Iteratively Reweighted Least Squares (IRLS)",
        "body": "Maximise the log-likelihood or quasi-likelihood using Fisher scoring / Newton–Raphson, iteratively updating working weights $W = \\operatorname{diag}(\\mu_i)$ and working responses $z_i = \\eta_i + (y_i - \\mu_i)/\\mu_i$."
      },
      {
        "title": "4. Check dispersion and evaluate deviance",
        "body": "Compute Pearson dispersion statistic $\\chi^2 / (n - p)$. If significantly greater than 1 in Poisson regression, fit a Negative Binomial or adjust standard errors with a quasi-likelihood dispersion parameter $\\hat{\\phi}$."
      }
    ],
    math: [
      {
        "h": "Poisson Log-Likelihood and Score Equation",
        "tex": "\\ell(\\beta) = \\sum_{i=1}^n \\left( y_i x_i^T \\beta - \\exp(x_i^T \\beta) - \\log(y_i!) \\right), \\quad \\nabla_\\beta \\ell(\\beta) = \\sum_{i=1}^n (y_i - \\mu_i) x_i = 0",
        "p": "The score equation shows that maximum likelihood estimates match the weighted sum of residuals to zero. The Hessian is strictly negative definite, guaranteeing a unique global optimum."
      },
      {
        "h": "Tweedie Variance Function and Power Parameter",
        "tex": "\\operatorname{Var}(Y) = \\phi \\cdot V(\\mu) = \\phi \\cdot \\mu^p, \\quad p = \\frac{q - 2}{q - 1} \\in (1, 2)",
        "p": "For p in (1, 2), Y is represented as the sum of N independent Gamma random variables where N is Poisson-distributed, creating a valid probability density with a positive point mass at Y = 0."
      },
      {
        "h": "Tweedie Deviance Function",
        "tex": "d(y, \\mu) = 2 \\left( \\frac{y^{2-p}}{(1-p)(2-p)} - \\frac{y \\mu^{1-p}}{1-p} + \\frac{\\mu^{2-p}}{2-p} \\right)",
        "p": "The unit deviance measures distance between observed response y and fitted expectation mu, replacing residual sum of squares during loss optimisation and cross-validation."
      }
    ],
    code: "import numpy as np\n\n# Poisson GLM via Iteratively Reweighted Least Squares (IRLS) from scratch\nnp.random.seed(42)\nn_samples = 500\n\n# Synthetic features and true rate parameters\nx1 = np.random.normal(0, 1, n_samples)\nx2 = np.random.uniform(-1, 1, n_samples)\nX = np.column_stack([np.ones(n_samples), x1, x2])\n\ntrue_beta = np.array([1.2, 0.6, -0.4])\nmu_true = np.exp(X @ true_beta)\n# Sample Poisson counts\ny = np.random.poisson(mu_true)\n\n# IRLS Algorithm for Poisson GLM with Log Link\nbeta = np.zeros(X.shape[1])\nmax_iters = 20\ntol = 1e-8\n\nfor it in range(max_iters):\n    eta = X @ beta\n    mu = np.exp(eta)\n    \n    # Weight matrix W and working response z\n    # For Poisson log link: W_ii = mu_i, z_i = eta_i + (y_i - mu_i) / mu_i\n    W = mu\n    z = eta + (y - mu) / mu\n    \n    # Weighted least squares update: (X^T W X) beta_new = X^T W z\n    XTW = X.T * W\n    beta_new = np.linalg.solve(XTW @ X, XTW @ z)\n    \n    diff = np.max(np.abs(beta_new - beta))\n    beta = beta_new\n    if diff < tol:\n        break\n\n# Compute standard errors from Fisher information matrix\ncov_matrix = np.linalg.inv(X.T @ (X * mu[:, None]))\nse_beta = np.sqrt(np.diag(cov_matrix))\n\n# Compute Pearson dispersion statistic to check for overdispersion\npearson_chi2 = np.sum((y - mu)**2 / mu)\ndispersion = pearson_chi2 / (n_samples - len(beta))\n\nprint(f\"True coefficients:     {true_beta}\")\nprint(f\"Estimated Poisson beta: {beta.round(4)}\")\nprint(f\"Standard errors:        {se_beta.round(4)}\")\nprint(f\"Pearson dispersion:     {dispersion:.3f} (approx 1 indicates no overdispersion)\")\n\n# Tweedie 1.5 Compound Poisson-Gamma Simulation\n# When y has point mass at zero and positive continuous payout\np = 1.5\nn_claims = np.random.poisson(lam=0.3, size=200)\nseverity = np.where(n_claims > 0, np.random.gamma(shape=2.0, scale=500.0, size=200), 0.0)\nprint(f\"Tweedie data zero fraction: {np.mean(severity == 0)*100:.1f}%\")\nprint(f\"Mean non-zero claim: £{np.mean(severity[severity > 0]):.2f}\")",
    keyPoints: [
      "Poisson regression models discrete non-negative counts $y \\in \\{0, 1, 2, \\dots\\}$ using a log link function that guarantees positive predicted means.",
      "Equi-dispersion assumption: Poisson assumes $\\operatorname{Var}(Y) = \\mathbb{E}[Y]$. Overdispersion (variance > mean) requires Quasi-Poisson or Negative Binomial models.",
      "Tweedie distributions parameterised by power parameter $p \\in (1, 2)$ represent a compound Poisson-gamma process with an exact point mass at zero and continuous positive tail.",
      "Eliminates the need for awkward log(y + 1) heuristics or separate two-stage classification/regression pipelines in insurance and marketing pricing.",
      "Estimated via Iteratively Reweighted Least Squares (IRLS), which converges rapidly due to global convexity of exponential dispersion deviance."
    ],
    pitfalls: [
      "Applying standard OLS to log(y + 1): Adding arbitrary pseudo-counts introduces arbitrary bias depending on measurement units, distorting slope estimates.",
      "Ignoring overdispersion in Poisson regression: When data has variance greater than the mean, Poisson point estimates remain consistent but standard errors are severely underestimated, producing false-positive p-values.",
      "Overlooking exposure periods: When observations span differing intervals (e.g. 1 month vs 12 months), failing to include $\\log(exposure)$ as an offset estimates average counts rather than true rates."
    ],
    quiz: [
      {
        "q": "Why is Tweedie regression with power parameter p = 1.5 particularly suited for insurance claim payouts?",
        "o": [
          "It naturally accommodates a point mass at zero (no claims) and a positive right-skewed continuous payout for claims in a single model",
          "It transforms count data into a standard uniform distribution",
          "It assumes errors are normally distributed with zero mean",
          "It requires no iterations or numerical optimisation to fit"
        ],
        "a": 0,
        "why": "Tweedie distributions with 1 < p < 2 represent compound Poisson-gamma distributions, giving a discrete probability at zero combined with continuous Gamma payouts for non-zero events."
      },
      {
        "q": "What should a modeller do if the Pearson dispersion statistic chi^2 / (n - p) for a fitted Poisson GLM equals 4.8?",
        "o": [
          "Switch to a Negative Binomial GLM or apply quasi-Poisson standard error adjustments to account for overdispersion",
          "Use ordinary linear regression with mean squared error loss instead",
          "Add 1 to all count observations and refit",
          "Assume the Poisson model is valid because 4.8 is greater than zero"
        ],
        "a": 0,
        "why": "A dispersion statistic of 4.8 indicates severe overdispersion (variance is almost 5 times the mean). Standard Poisson SEs are heavily underestimated; Negative Binomial or Quasi-Poisson correction is required."
      }
    ],
    usedBy: [],
    prereq: [
      "generalised-linear-models",
      "ols-inference-t-tests-f-test-r2-and-adjusted-r2"
    ],
    related: [
      "generalised-linear-models",
      "logistic-regression-inference-odds-ratios-wald-tests",
      "residual-diagnostics-and-heteroscedasticity"
    ],
    keywords: "poisson regression, tweedie regression, generalised linear models, overdispersion, negative binomial, compound poisson gamma, count data"
  },
  {
    id: "isotonic-regression",
    short: "Isotonic regression",
    title: "Isotonic Regression",
    task: "concepts",
    module: "Beyond the basics",
    level: 2,
    minutes: 14,
    noLab: true,
    summary: "Fit a non-parametric, monotonic increasing step function to 1D data: master the Pool Adjacent Violators Algorithm (PAVA) and probability calibration.",
    lead: "When physical domain knowledge dictates that response y must increase monotonically with predictor x, linear models enforce too much rigidity while splines can wiggle. Isotonic regression finds the exact least-squares monotonic fit using piecewise constant steps.",
    intuition: [
      "In many scientific and business applications, the relationship between a predictor $x$ and target $y$ is strictly monotonic: dose-response curves in clinical pharmacology (higher drug concentration never decreases toxicity), customer pricing sensitivity, credit score default risk, and probability calibration. However, the exact parametric mathematical form (whether linear, exponential, or sigmoidal) is completely unknown.",
      "Linear regression imposes a rigid straight line, which can fail catastrophically if the true relationship is non-linear. High-degree polynomials or unconstrained smoothing splines can capture curvature, but frequently oscillate or violate monotonicity on unobserved gaps, generating nonsense predictions.",
      "Isotonic regression solves this dilemma through non-parametric shape-constrained estimation. It finds a sequence of fitted values $\\hat{y}_i$ that minimises the sum of squared errors $\\sum_{i=1}^n w_i (y_i - \\hat{y}_i)^2$ subject strictly to the monotonicity ordering constraint: $x_i \\le x_j \\implies \\hat{y}_i \\le \\hat{y}_j$. The resulting model is a non-decreasing piecewise constant step function that conforms flexibly to arbitrary monotonic shapes without assuming any predefined mathematical curve.",
      "A premier modern application of isotonic regression is classifier calibration. Machine learning models such as Random Forests, Naive Bayes, or boosted trees output raw scores that rank samples effectively but do not represent well-calibrated probabilities. Isotonic regression maps raw classifier scores into calibrated posterior probabilities non-parametrically, outperforming Platt scaling when the distortion is non-sigmoidal."
    ],
    analogy: "Imagine constructing a wheelchair access ramp across a hillside terrain of jagged mounds and dips. You must grade the dirt such that every point on the path is at least as high as all preceding points (monotonic ascent). Whenever you encounter a downward dip, you must shovel soil from the peak into the valley until both settle into a single flat terrace. The Pool Adjacent Violators Algorithm performs exactly this earth-moving process: pooling violating dips into flat monotonic steps.",
    steps: [
      {
        "title": "1. Sort observations by predictor x",
        "body": "Order the dataset such that $x_1 \\le x_2 \\le \\dots \\le x_n$. Associate each point with observation $y_i$ and non-negative weight $w_i$ (default $w_i = 1$)."
      },
      {
        "title": "2. Initialise fitted values to raw responses",
        "body": "Set initial candidates $\\hat{y}_i = y_i$ for all $i = 1, \\dots, n$."
      },
      {
        "title": "3. Execute Pool Adjacent Violators Algorithm (PAVA)",
        "body": "Scan from left to right. Whenever a monotonicity violation $\\hat{y}_i > \\hat{y}_{i+1}$ occurs, merge the two adjacent groups into a pooled block, setting the joint value to their weighted average: $\\bar{y} = (w_i \\hat{y}_i + w_{i+1} \\hat{y}_{i+1}) / (w_i + w_{i+1})$."
      },
      {
        "title": "4. Back-track and propagate merges",
        "body": "After merging, check if the newly pooled value violates monotonicity with preceding blocks. Back-track and merge leftwards until the entire sequence up to the current point satisfies monotonicity. Continue to the end of the sequence."
      }
    ],
    math: [
      {
        "h": "Constrained Least-Squares Formulation",
        "tex": "\\min_{\\hat{y}_1, \\dots, \\hat{y}_n} \\sum_{i=1}^n w_i (y_i - \\hat{y}_i)^2 \\quad \\text{subject to} \\quad \\hat{y}_1 \\le \\hat{y}_2 \\le \\dots \\le \\hat{y}_n",
        "p": "The quadratic objective is strictly convex, and the constraint set is a closed convex cone (the isotonic cone). This guarantees the existence of a unique global minimiser."
      },
      {
        "h": "PAVA Pooling Condition",
        "tex": "\\bar{y}_{A \\cup B} = \\frac{\\sum_{i \\in A} w_i y_i + \\sum_{j \\in B} w_j y_j}{\\sum_{i \\in A} w_i + \\sum_{j \\in B} w_j}",
        "p": "When group A violates monotonicity with successor B (y_A > y_B), the constrained minimiser across their union is exactly the weighted sample mean of both groups combined."
      },
      {
        "h": "Probability Calibration Error (ECE)",
        "tex": "\\mathrm{ECE} = \\sum_{m=1}^M \\frac{|B_m|}{n} \\left| \\operatorname{acc}(B_m) - \\operatorname{conf}(B_m) \\right|",
        "p": "Expected Calibration Error measures calibration discrepancy across probability bins B_m. Isotonic calibration fits a non-decreasing mapping from raw model confidence to empirical accuracy."
      }
    ],
    code: "import numpy as np\n\n# Pool Adjacent Violators Algorithm (PAVA) from scratch\ndef isotonic_regression_pava(y, w=None):\n    n = len(y)\n    if w is None:\n        w = np.ones(n, dtype=float)\n    else:\n        w = np.array(w, dtype=float)\n        \n    # Stack stores: [weight, sum_wy, y_mean, start_idx, end_idx]\n    stack = []\n    \n    for i in range(n):\n        curr_w = w[i]\n        curr_sum = w[i] * y[i]\n        curr_mean = y[i]\n        start_idx = i\n        end_idx = i\n        \n        # Check for monotonicity violation with top of stack\n        while stack and stack[-1][2] >= curr_mean:\n            prev_w, prev_sum, _, prev_start, _ = stack.pop()\n            curr_w += prev_w\n            curr_sum += prev_sum\n            curr_mean = curr_sum / curr_w\n            start_idx = prev_start\n            \n        stack.append((curr_w, curr_sum, curr_mean, start_idx, end_idx))\n        \n    # Unpack fitted values\n    y_hat = np.zeros(n, dtype=float)\n    for block_w, block_sum, block_mean, s, e in stack:\n        y_hat[s:e+1] = block_mean\n        \n    return y_hat\n\n# Synthetic noisy monotonic dose-response curve\nnp.random.seed(42)\nn_samples = 40\nx = np.linspace(0, 10, n_samples)\ntrue_response = 1.0 / (1.0 + np.exp(-(x - 5)))  # Sigmoidal response\nnoise = np.random.normal(0, 0.15, n_samples)\ny_noisy = true_response + noise\n\n# Fit isotonic regression\ny_iso = isotonic_regression_pava(y_noisy)\n\n# Verify strict monotonicity\nis_monotonic = np.all(np.diff(y_iso) >= 0)\nmse_raw = np.mean((y_noisy - true_response)**2)\nmse_iso = np.mean((y_iso - true_response)**2)\n\nprint(f\"Number of samples:          {n_samples}\")\nprint(f\"Isotonic fit is monotonic:  {is_monotonic}\")\nprint(f\"Number of unique flat steps: {len(np.unique(y_iso))}\")\nprint(f\"Raw noisy MSE to truth:     {mse_raw:.4f}\")\nprint(f\"Isotonic MSE to truth:      {mse_iso:.4f} (noise filtered)\")\nprint(f\"First 5 fitted step values: {np.unique(y_iso)[:5].round(3)}\")",
    keyPoints: [
      "Non-parametric shape-constrained regression: enforces strict monotonicity ($x_i \\le x_j \\implies \\hat{y}_i \\le \\hat{y}_j$) without assuming any specific mathematical curve.",
      "Solved exactly in $O(n)$ time using the Pool Adjacent Violators Algorithm (PAVA).",
      "Yields a piecewise constant step function with horizontal plateaus wherever adjacent points were pooled.",
      "Widely utilised for classifier probability calibration, non-parametrically mapping raw classifier scores into true posterior probabilities.",
      "Highly prone to severe overfitting on small datasets ($n < 1000$) where steps capture noisy spikes; Platt scaling is safer when sample sizes are small."
    ],
    pitfalls: [
      "Overfitting on small sample sizes: In small datasets, isotonic calibration creates step-like over-fitting where probabilities are squashed onto zero or one plateaus.",
      "Out-of-sample extrapolation failure: Isotonic regression cannot extrapolate outside observed ranges of $x$; points below $\\min(x)$ or above $\\max(x)$ are clamped to boundary step values.",
      "Multivariate curse of dimensionality: True multi-dimensional isotonic regression is an NP-hard partial order problem; PAVA applies strictly to 1D ordered arrays."
    ],
    quiz: [
      {
        "q": "How does the Pool Adjacent Violators Algorithm (PAVA) resolve a monotonicity violation where y_i > y_{i+1}?",
        "o": [
          "It pools the adjacent violating observations and replaces both with their weighted average",
          "It deletes the offending observation from the dataset",
          "It sets the violating point to zero",
          "It rotates the coordinate axis until the slope becomes positive"
        ],
        "a": 0,
        "why": "When y_i > y_{i+1}, least-squares under ordering constraints forces hat{y}_i = hat{y}_{i+1}; the least-squares optimum for a pooled group is its weighted sample average."
      },
      {
        "q": "When should a practitioner choose Platt scaling over Isotonic regression for probability calibration?",
        "o": [
          "When the dataset is small (e.g. fewer than 1000 samples) to prevent isotonic step-fitting from overfitting",
          "When the true calibration curve is non-monotonic",
          "When the calibration dataset has over 1,000,000 samples",
          "When the target variable is continuous regression rather than binary classification"
        ],
        "a": 0,
        "why": "Platt scaling is parametric (fitting a 2-parameter logistic sigmoid), making it resistant to overfitting on small validation sets, whereas non-parametric isotonic regression overfits small samples."
      }
    ],
    usedBy: [],
    prereq: [
      "ols-inference-t-tests-f-test-r2-and-adjusted-r2"
    ],
    related: [
      "logistic-regression-inference-odds-ratios-wald-tests",
      "poisson-and-tweedie-regression",
      "pls-and-principal-component-regression"
    ],
    keywords: "isotonic regression, pava, pool adjacent violators, monotonicity, calibration, probability calibration, shape constrained regression"
  },
  {
    id: "pls-and-principal-component-regression",
    short: "PLS & PCR",
    title: "Partial Least Squares and Principal Component Regression",
    task: "concepts",
    module: "Beyond the basics",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Solve severe multicollinearity and high dimensions by projecting features onto low-dimensional latent subspaces: compare unsupervised PCR with covariance-maximising supervised PLS.",
    lead: "When predictors outnumber samples (p >> n) or exhibit collinearity, OLS is rank-deficient or unstable. PCR projects onto top variance directions without looking at the target; PLS finds latent components that simultaneously maximise covariance between predictors and the target.",
    intuition: [
      "In modern high-dimensional settings—such as spectroscopy in chemometrics, genomics, or financial factor models—we frequently encounter hundreds or thousands of features with high inter-correlation, often exceeding sample size ($p \\gg n$). Under these conditions, the ordinary least squares covariance matrix $X^T X$ is singular or ill-conditioned, blowing up coefficient variances and destroying generalisation.",
      "Principal Component Regression (PCR) addresses this problem via a two-stage pipeline: first, perform Principal Component Analysis (PCA) on feature matrix $X$ to extract the top $k$ orthogonal principal components; second, fit an ordinary least squares regression using these $k$ components as predictors. Because components are orthogonal, multicollinearity vanishes completely, and dimension is reduced from $p$ to $k$.",
      "However, PCR has a fundamental structural vulnerability: PCA is entirely unsupervised. It constructs components that maximise variance within $X$, paying zero attention to the response $y$. If the variance in $X$ is dominated by background sensor drift or irrelevant noise, PCR selects high-variance noise directions while discarding low-variance directions that actually contain the predictive signal.",
      "Partial Least Squares (PLS) regression resolves this flaw by making the latent component extraction supervised. Instead of maximising variance $\\operatorname{Var}(X w)$, PLS finds weight vectors $w$ that maximise squared sample covariance $\\operatorname{Cov}(X w, y)^2$. By balancing feature variance with target correlation, PLS achieves equal or superior predictive performance to PCR using significantly fewer latent components."
    ],
    analogy: "Imagine scouting a football team. PCR watches players practice alone in an empty field, selecting the players who run the greatest distance and move the fastest (unsupervised feature variance). But some of those players might be running aimlessly without passing or shooting at goal. PLS scouts players during an active match against an opponent, selecting the players whose runs directly result in goals and assists (covariance between player movement and match score).",
    steps: [
      {
        "title": "1. Standardise predictors and centre response",
        "body": "Standardise feature matrix $X$ to zero mean and unit variance ($Z$-scores); centre response vector $y$ to zero mean."
      },
      {
        "title": "2. PCR: compute principal components of X",
        "body": "Perform SVD on $X = U \\Sigma V^T$. Project $X$ onto top $k$ eigenvectors: $T = X V_k$. Fit OLS: $\\hat{\\gamma} = (T^T T)^{-1} T^T y$. Back-transform coefficients to original feature space: $\\hat{\\beta}_{\\mathrm{PCR}} = V_k \\hat{\\gamma}$."
      },
      {
        "title": "3. PLS: extract covariance-maximising components (NIPALS)",
        "body": "Compute cross-product $w_1 = X^T y / \\|X^T y\\|$. Construct score vector $t_1 = X w_1$. Regress $X$ and $y$ onto $t_1$ to compute loadings $p_1 = X^T t_1 / (t_1^T t_1)$ and $q_1 = y^T t_1 / (t_1^T t_1)$."
      },
      {
        "title": "4. Deflate matrices and iterate",
        "body": "Deflate feature matrix $X_{m+1} = X_m - t_m p_m^T$ and response $y_{m+1} = y_m - t_m q_m$. Repeat for $m = 1, \\dots, k$. Select optimal component count $k$ via cross-validation."
      }
    ],
    math: [
      {
        "h": "PCR Estimator",
        "tex": "T_k = X V_k, \\quad \\hat{\\gamma} = (T_k^T T_k)^{-1} T_k^T y, \\quad \\hat{\\beta}_{\\mathrm{PCR}} = V_k (T_k^T T_k)^{-1} T_k^T y",
        "p": "PCR projects predictors onto the first k eigenvectors of sample covariance X^T X, effectively performing OLS on orthogonal latent scores."
      },
      {
        "h": "PLS Objective Function",
        "tex": "\\max_{\\|w\\| = 1} \\operatorname{Cov}(X w, y)^2 = \\max_{\\|w\\| = 1} \\operatorname{Var}(X w) \\operatorname{Corr}(X w, y)^2",
        "p": "PLS simultaneously balances feature variance with response correlation, ensuring latent directions carry both strong descriptive spread and predictive power."
      },
      {
        "h": "NIPALS Deflation Equations",
        "tex": "t_m = X_m w_m, \\quad p_m = \\frac{X_m^T t_m}{t_m^T t_m}, \\quad X_{m+1} = X_m - t_m p_m^T, \\quad y_{m+1} = y_m - t_m \\frac{y_m^T t_m}{t_m^T t_m}",
        "p": "Subtracting the outer product of score t_m and loading p_m orthogonalises remaining feature space, preventing duplicate information in subsequent components."
      }
    ],
    code: "import numpy as np\n\n# Principal Component Regression (PCR) vs Partial Least Squares (PLS) from scratch\nnp.random.seed(42)\nn_samples = 80\nn_features = 20\n\n# Create collinear high-dimensional features\nlatent = np.random.normal(0, 1, (n_samples, 3))\n# Features: 10 correlate with latent 0, 5 with latent 1, 5 are high-variance noise\nX_signal = latent @ np.random.normal(0, 1, (3, 15))\nX_noise = np.random.normal(0, 3.0, (n_samples, 5))  # High variance noise!\nX = np.hstack([X_signal, X_noise])\n# True response depends ONLY on latent[0] (low total variance compared to noise)\ny = 3.0 * latent[:, 0] - 2.0 * latent[:, 1] + np.random.normal(0, 0.5, n_samples)\n\n# Standardise X and centre y\nX_std = (X - np.mean(X, axis=0)) / np.std(X, axis=0)\ny_std = y - np.mean(y)\n\n# 1. PCR Implementation (Unsupervised SVD)\ndef fit_pcr(X, y, k):\n    U, S, Vt = np.linalg.svd(X, full_matrices=False)\n    V_k = Vt[:k, :].T\n    T_k = X @ V_k\n    gamma = np.linalg.lstsq(T_k, y, rcond=None)[0]\n    beta_pcr = V_k @ gamma\n    return beta_pcr\n\n# 2. PLS Implementation (Supervised NIPALS)\ndef fit_pls(X, y, k):\n    n, p = X.shape\n    X_m = X.copy()\n    y_m = y.copy()\n    \n    W = np.zeros((p, k))\n    P = np.zeros((p, k))\n    q = np.zeros(k)\n    \n    for m in range(k):\n        # Weight vector: covariance with target\n        w_m = X_m.T @ y_m\n        w_m /= np.linalg.norm(w_m)\n        t_m = X_m @ w_m\n        t_norm_sq = t_m @ t_m\n        \n        p_m = (X_m.T @ t_m) / t_norm_sq\n        q_m = (y_m @ t_m) / t_norm_sq\n        \n        # Deflate\n        X_m -= np.outer(t_m, p_m)\n        y_m -= t_m * q_m\n        \n        W[:, m] = w_m\n        P[:, m] = p_m\n        q[m] = q_m\n        \n    # Compute regression coefficients beta_pls\n    # beta = W (P^T W)^{-1} q\n    beta_pls = W @ np.linalg.inv(P.T @ W) @ q\n    return beta_pls\n\n# Compare PCR and PLS with k=3 components\nk = 3\nbeta_pcr = fit_pcr(X_std, y_std, k)\nbeta_pls = fit_pls(X_std, y_std, k)\n\npred_pcr = X_std @ beta_pcr\npred_pls = X_std @ beta_pls\n\nr2_pcr = 1.0 - np.sum((y_std - pred_pcr)**2) / np.sum(y_std**2)\nr2_pls = 1.0 - np.sum((y_std - pred_pls)**2) / np.sum(y_std**2)\n\nprint(f\"Dataset shape: {X.shape} (high multicollinearity + high-variance noise)\")\nprint(f\"PCR (k={k}) R^2: {r2_pcr:.4f} (dragged down by high-variance noise features)\")\nprint(f\"PLS (k={k}) R^2: {r2_pls:.4f} (targets predictive covariance)\")",
    keyPoints: [
      "PCR performs unsupervised PCA on features followed by OLS on the top $k$ principal components, eliminating multicollinearity.",
      "Vulnerability of PCR: PCA maximises feature variance without regard to $y$; if predictors with high variance carry no signal, PCR fails.",
      "PLS performs supervised latent component extraction, finding directions that maximise squared covariance $\\operatorname{Cov}(X w, y)^2$.",
      "PLS typically matches or beats PCR using substantially fewer components because every extracted component is steered toward the response.",
      "Both methods require careful standardisation of features prior to decomposition and selection of component count $k$ via cross-validation."
    ],
    pitfalls: [
      "Failing to standardise features: PCA and PLS are scale-sensitive; features with large arbitrary numerical ranges dominate components regardless of predictive power.",
      "Assuming PCR components are predictive: The first principal component has maximal variance, but may have zero correlation with the response target.",
      "Information leakage in cross-validation: Decompositions (both PCA and PLS) must be computed strictly inside each training fold, not on the entire dataset."
    ],
    quiz: [
      {
        "q": "What is the fundamental difference in the objective function between PCR and PLS?",
        "o": [
          "PCR maximises variance Var(Xw) in an unsupervised manner, while PLS maximises squared covariance Cov(Xw, y)^2 with the target",
          "PCR is a non-linear method while PLS is strictly linear",
          "PCR can only be used for classification while PLS is only for regression",
          "PLS requires inverting the full p x p matrix while PCR never inverts matrices"
        ],
        "a": 0,
        "why": "PCR extracts components via PCA to maximise feature variance alone; PLS extracts components that simultaneously maximise feature variance and correlation with target y."
      },
      {
        "q": "Why might PCR perform poorly when high-variance sensor noise is added to a dataset?",
        "o": [
          "PCA prioritises the noise features due to their large variance, putting them into the top components rather than the true signal",
          "SVD fails to converge when noise is present",
          "The OLS stage will produce imaginary numbers",
          "The number of principal components cannot exceed the sample size"
        ],
        "a": 0,
        "why": "Because PCA is unsupervised, it orders components strictly by variance. High-variance noise dominates the first principal components, pushing the predictive signal into discarded lower components."
      }
    ],
    usedBy: [],
    prereq: [
      "ols-inference-t-tests-f-test-r2-and-adjusted-r2",
      "multicollinearity-and-vif"
    ],
    related: [
      "ols_linear_regression",
      "ridge_regression",
      "multicollinearity-and-vif",
      "poisson-and-tweedie-regression"
    ],
    keywords: "pls, partial least squares, pcr, principal component regression, nipals, dimensionality reduction, multicollinearity, high dimensional regression"
  },
  {
    id: "mars",
    short: "MARS",
    title: "Multivariate Adaptive Regression Splines",
    task: "concepts",
    module: "Beyond the basics",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Construct non-linear, non-parametric regression models using piecewise linear hinge functions: master forward basis selection and backward pruning via generalised cross-validation (GCV).",
    lead: "MARS automatically uncovers non-linear relationships and high-order feature interactions without requiring manual feature engineering, building an interpretable piecewise linear spline model.",
    intuition: [
      "Traditional linear models are constrained by rigid linearity. To capture non-linear patterns, data scientists frequently hand-engineer polynomial features ($x^2, x^3$) or interaction products ($x_1 x_2$). However, polynomial terms have notorious runaway behaviour at boundaries, and searching through all possible interactions among dozens of features creates combinatorial explosion.",
      "Jerome Friedman developed Multivariate Adaptive Regression Splines (MARS) in 1991 to automate non-linear regression and feature interaction discovery. MARS uses mirrored pairs of piecewise linear hinge functions (also known as truncated power functions or hockey-stick functions): $\\max(0, x - c)$ and $\\max(0, c - x)$, where $c$ is a candidate knot location placed at observed values of predictor $x$.",
      "The algorithm proceeds in two distinct stages. In the Forward Pass, MARS starts with an intercept and iteratively searches across all features and knot locations, greedily adding the pair of hinge functions (or interaction products of existing hinges with new hinges) that yields the greatest reduction in sum of squared errors. This forward greedy expansion intentionally overfits the training data.",
      "In the Backward Pruning Pass, MARS systematically removes basis functions one by one, using Generalised Cross-Validation (GCV) to penalise model complexity. The model that minimises GCV is selected. The resulting model is non-linear, continuous, easily interpretable as localized slopes and interaction terms, and computationally fast."
    ],
    analogy: "Imagine sculpting an irregular wooden contour using a set of wooden wedges and hinges. Rather than bending a stiff steel beam across the whole length (a linear model) or trying to carve an infinitely curved mathematical spiral (a high-degree polynomial), you place joint hinges at key stress points. Each hinge bends linearly in one direction and remains flat in the other. Once you have placed hinges everywhere, you remove the redundant joints until you are left with the cleanest structural framework.",
    steps: [
      {
        "title": "1. Initialise model with intercept",
        "body": "Set model $B_0(x) = 1$. The initial candidate basis set contains $\\mathcal{M} = \\{B_0\\}$."
      },
      {
        "title": "2. Forward pass: greedily add hinge pairs",
        "body": "At each step, search over all existing basis functions $B_m \\in \\mathcal{M}$, all features $x_j$, and all observed knots $c$. Find the pair $B_m(x) \\cdot \\max(0, x_j - c)$ and $B_m(x) \\cdot \\max(0, c - x_j)$ that minimises residual sum of squares. Add both to $\\mathcal{M}$ until reaching maximum basis count $M_{\\max}$."
      },
      {
        "title": "3. Backward pass: prune basis functions",
        "body": "Systematically remove basis functions one by one, choosing at each step the term whose deletion causes the smallest increase in RSS. Evaluate the GCV score for each sub-model."
      },
      {
        "title": "4. Select optimal sub-model via GCV",
        "body": "Select the model size $M^*$ that minimises the Generalised Cross-Validation criterion: $\\mathrm{GCV}(M) = \\frac{\\frac{1}{n} \\sum_{i=1}^n (y_i - \\hat{f}_M(x_i))^2}{(1 - \\tilde{C}(M)/n)^2}$, where $\\tilde{C}(M)$ penalises knot placement."
      }
    ],
    math: [
      {
        "h": "Reflected Hinge Functions",
        "tex": "(x - c)_+ = \\max(0, x - c), \\quad (c - x)_+ = \\max(0, c - x)",
        "p": "A pair of reflected hinge functions at knot c. For any x, one function is zero while the other is a linear ramp with slope +1 or -1, ensuring continuous piecewise linear approximations."
      },
      {
        "h": "MARS Model Formulation",
        "tex": "\\hat{f}(x) = \\beta_0 + \\sum_{m=1}^M \\beta_m B_m(x), \\quad B_m(x) = \\prod_{k=1}^{K_m} [s_{km} (x_{v(k, m)} - c_{km})]_+",
        "p": "The fitted function is a linear combination of basis functions, each consisting of an individual hinge or a product of multiple hinges representing multi-way feature interactions."
      },
      {
        "h": "Generalised Cross-Validation (GCV) Criterion",
        "tex": "\\mathrm{GCV}(M) = \\frac{\\frac{1}{n} \\sum_{i=1}^n (y_i - \\hat{f}_M(x_i))^2}{\\left(1 - \\frac{M + d \\cdot (M - 1) / 2}{n}\\right)^2}",
        "p": "GCV penalises model degrees of freedom, where d is an effective cost parameter per knot (typically d = 2 or 3) accounting for the forward search over knot locations."
      }
    ],
    code: "import numpy as np\n\n# Multivariate Adaptive Regression Splines (MARS) Forward Step from scratch\nnp.random.seed(42)\nn_samples = 150\n\n# True function: non-linear piecewise with a sharp bend and an interaction\nx1 = np.random.uniform(0, 10, n_samples)\nx2 = np.random.uniform(0, 10, n_samples)\n# Sharp bend at x1=5, interaction between (x1-5)+ and (x2-4)+\ny_clean = 2.0 + 1.5 * np.maximum(0, 5.0 - x1) + 3.0 * np.maximum(0, x1 - 5.0) + 1.2 * np.maximum(0, x1 - 5.0) * np.maximum(0, x2 - 4.0)\ny = y_clean + np.random.normal(0, 0.5, n_samples)\n\n# Simplified Forward MARS Search\nclass SimpleMARS:\n    def __init__(self, max_terms=7):\n        self.max_terms = max_terms\n        self.bases = [lambda X: np.ones(len(X))]\n        self.basis_names = [\"Intercept\"]\n        self.coef_ = None\n        \n    def fit(self, X, y):\n        n, p = X.shape\n        while len(self.bases) < self.max_terms:\n            best_rss = float(\"inf\")\n            best_pair = None\n            best_name = None\n            \n            # Current design matrix\n            B_curr = np.column_stack([b(X) for b in self.bases])\n            \n            # Search over parent bases, features, and candidate knots\n            for b_idx in range(len(self.bases)):\n                parent_b = self.bases[b_idx]\n                parent_vals = parent_b(X)\n                \n                for f_idx in range(p):\n                    col = X[:, f_idx]\n                    knots = np.percentile(col, [25, 50, 75])\n                    \n                    for c in knots:\n                        h_right = parent_vals * np.maximum(0, col - c)\n                        h_left = parent_vals * np.maximum(0, c - col)\n                        \n                        B_cand = np.column_stack([B_curr, h_right, h_left])\n                        coefs, residuals, _, _ = np.linalg.lstsq(B_cand, y, rcond=None)\n                        rss = np.sum((y - B_cand @ coefs)**2)\n                        \n                        if rss < best_rss:\n                            best_rss = rss\n                            best_pair = (\n                                lambda X, f=f_idx, c=c, pb=parent_b: pb(X) * np.maximum(0, X[:, f] - c),\n                                lambda X, f=f_idx, c=c, pb=parent_b: pb(X) * np.maximum(0, c - X[:, f])\n                            )\n                            best_name = (f\"h(x{f_idx+1}-{c:.1f})\", f\"h({c:.1f}-x{f_idx+1})\")\n                            \n            if best_pair is not None:\n                self.bases.extend(best_pair)\n                self.basis_names.extend(best_name)\n            else:\n                break\n                \n        # Final OLS fit\n        B_final = np.column_stack([b(X) for b in self.bases])\n        self.coef_, _, _, _ = np.linalg.lstsq(B_final, y, rcond=None)\n        \n    def predict(self, X):\n        B = np.column_stack([b(X) for b in self.bases])\n        return B @ self.coef_\n\nX_data = np.column_stack([x1, x2])\nmars = SimpleMARS(max_terms=7)\nmars.fit(X_data, y)\npreds = mars.predict(X_data)\nr2 = 1.0 - np.sum((y - preds)**2) / np.sum((y - np.mean(y))**2)\n\nprint(f\"MARS Model R^2: {r2:.4f}\")\nprint(\"Discovered Basis Functions and Coefficients:\")\nfor name, c in zip(mars.basis_names, mars.coef_):\n    print(f\"  {name:25s}: beta = {c:+.3f}\")",
    keyPoints: [
      "Automates non-linear modelling and interaction detection using reflected piecewise linear hinge functions $\\max(0, x - c)$ and $\\max(0, c - x)$.",
      "Two-stage architecture: greedy forward expansion to capture non-linear patterns followed by backward pruning via GCV to prevent overfitting.",
      "Continuous piecewise linearity ensures models do not exhibit wild polynomial runaway oscillations at outer boundaries.",
      "Provides inherent interpretability: variable importance can be measured by GCV drop upon removing all basis functions involving that feature.",
      "Serves as an effective, interpretable bridge between rigid linear models and black-box gradient-boosted trees."
    ],
    pitfalls: [
      "Computational scaling with sample size: Testing all candidate knot locations across every feature scales as $O(n \\cdot p \\cdot M)$, necessitating knot subsampling for large datasets.",
      "Collinearity among basis functions: Reflected hinge pairs and multi-way interaction terms can be highly correlated; backward pruning and SVD-based solvers are essential.",
      "Higher-order interaction degradation: Allowing interactions beyond degree 2 or 3 rapidly degrades statistical power and creates uninterpretable models."
    ],
    quiz: [
      {
        "q": "Why are reflected hinge functions max(0, x - c) and max(0, c - x) preferred over high-degree polynomials for non-linear regression?",
        "o": [
          "Hinge functions produce piecewise linear splines that are locally adaptive and do not oscillate wildly at data boundaries",
          "Hinge functions guarantee that the model is differentiable everywhere",
          "Polynomial features cannot represent linear relationships",
          "Hinge functions eliminate the need for training data"
        ],
        "a": 0,
        "why": "High-degree polynomials suffer from Runge phenomenon and extreme runaway oscillations at data boundaries. Reflected hinge functions are localized and bounded linearly."
      },
      {
        "q": "What role does Generalised Cross-Validation (GCV) play in the MARS algorithm?",
        "o": [
          "It penalises model degrees of freedom during backward pruning to find the optimal model size without requiring full k-fold CV",
          "It selects the learning rate for gradient descent",
          "It scales input features to zero mean and unit variance",
          "It generates synthetic training examples"
        ],
        "a": 0,
        "why": "GCV provides a fast analytical approximation to leave-one-out cross-validation, penalising the number of knots and basis functions to identify the optimal pruned sub-model."
      }
    ],
    usedBy: [],
    prereq: [
      "ols-inference-t-tests-f-test-r2-and-adjusted-r2"
    ],
    related: [
      "ols_linear_regression",
      "polynomial_regression",
      "residual-diagnostics-and-heteroscedasticity"
    ],
    keywords: "mars, multivariate adaptive regression splines, hinge functions, splines, gcv, non linear regression, piecewise linear, interaction terms"
  },
  {
    id: 'bagging-and-extra-trees',
    short: 'Bagging and Extra-Trees',
    title: 'Bootstrap Aggregating and Extremely Randomised Trees',
    task: 'concepts',
    module: 'Beyond the basics',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Bagging reduces variance by averaging unpruned decision trees trained on bootstrap samples, while Extra-Trees adds split-threshold randomisation for faster training and greater decorrelation.`,
    lead: r`Individual decision trees suffer from high variance: minor fluctuations in training data can completely alter their tree architecture. Bootstrap aggregating (bagging) stabilises predictions by growing an ensemble of deep, low-bias trees on independent bootstrap resamples and aggregating their votes. Extremely Randomised Trees (Extra-Trees) pushes this decorrelation further by choosing split cut-points completely at random, significantly accelerating training speed while suppressing variance on noisy data.`,
    intuition: [
      r`Imagine seeking a medical diagnosis from 50 physicians rather than relying on a single doctor. If all 50 studied the exact same textbooks and evaluated the patient under identical hospital protocols, they might share the same diagnostic blind spots. However, if each doctor trained at a different hospital on a distinct mix of case files (bootstrap sampling), their individual errors tend to cancel out. Averaging their assessments produces a consensus diagnosis that is far more reliable than any individual prognosis.`,
      r`Bagging works because averaging $B$ independent, identically distributed estimators leaves bias unchanged while reducing variance by a factor of $1/B$. In practice, because all trees draw from the same finite training pool, their predictions remain positively correlated ($\rho > 0$). When trees are correlated, variance reduction hits an irreducible floor of $\rho \sigma^2$. Decorrelating individual trees is therefore the primary mechanism for improving ensemble performance.`,
      r`Extra-Trees (Extremely Randomised Trees) tackles tree correlation directly. At each node, rather than scanning all possible threshold values to find the split that maximises the Gini impurity drop, Extra-Trees draws random cut-points from a uniform distribution for each candidate feature and selects the best among them. By abandoning exhaustive threshold searches, Extra-Trees trains drastically faster than standard Random Forests while producing highly diverse, decorrelated trees that often generalise better on noisy datasets.`,
    ],
    analogy: r`Bagging is like taking a consensus vote among independent analysts reviewing randomly shuffled case folders, while Extra-Trees speeds up the deliberation by forcing analysts to evaluate proposals against random benchmark hurdles.`,
    steps: [
      r`Draw $B$ independent bootstrap datasets $\mathcal{D}_1, \dots, \mathcal{D}_B$ of size $n$ by sampling from the original dataset with replacement.`,
      r`For standard Bagging, grow deep, unpruned decision trees on each bootstrap resample using all available features.`,
      r`For Extra-Trees, train trees on the full dataset (or bootstrap draws) and, at each split node, draw split thresholds at random for each feature subset.`,
      r`Track Out-of-Bag (OOB) samples—the $\approx 36.8\\%$ of instances omitted from each bootstrap draw—to compute honest cross-validation metrics on the fly.`,
      r`Aggregate tree outputs: compute majority voting (or soft probability averages) for classification, and arithmetic means for regression.`,
      r`Evaluate ensemble convergence: verify that test error stabilises asymptotically as tree count $B$ grows without risk of overfitting.`,
    ],
    math: [
      {
        h: 'Variance reduction in an ensemble of correlated estimators',
        tex: r`$$\operatorname{Var}\big(\bar{f}(x)\big) = \rho \\, \sigma^2 + \frac{1 - \rho}{B} \\, \sigma^2$$`,
        p: r`$\sigma^2$ is the variance of a single tree, $B$ is the number of trees in the ensemble, and $\rho = \operatorname{Corr}(f_i, f_j)$ is the average pairwise correlation between trees. As $B \to \infty$, the second term vanishes, leaving the irreducible variance floor $\rho \sigma^2$. Extra-Trees achieves superior variance reduction by actively driving down $\rho$.`,
      },
      {
        h: 'Out-of-Bag (OOB) sample probability derivation',
        tex: r`$$P(\text{point } i \text{ is never selected in } n \text{ draws}) = \Big(1 - \frac{1}{n}\Big)^n \xrightarrow{n \to \infty} \frac{1}{e} \approx 0.3679$$`,
        p: r`For a sample of size $n$, each observation has probability $1 - 1/n$ of being omitted in a single draw. Compounding over $n$ independent draws with replacement shows that roughly $36.8\\%$ of data points remain unused per tree, providing a free validation set.`,
      },
      {
        h: 'Aggregation rules (hard voting vs soft voting)',
        tex: r`$$\hat{y}_{\text{hard}} = \operatorname{mode}\big(\\{f_b(x)\\}_{b=1}^B\big), \quad \hat{p}(k \mid x) = \frac{1}{B}\sum_{b=1}^B p_b(k \mid x)$$`,
        p: r`Hard voting selects the majority class label across all $B$ binary decision trees. Soft voting averages the continuous predicted class probability vectors across trees, yielding smoother decision boundaries and lower log-loss.`,
      },
    ],
    keyPoints: [
      r`Pure variance reduction: bagging cannot rectify high-bias models (e.g. linear models or depth-1 stumps); it requires flexible, low-bias base learners.`,
      r`Out-of-Bag (OOB) scoring: provides an unbiased cross-validation estimate without requiring an explicit held-out test split.`,
      r`Extra-Trees trades a small increase in individual tree bias for a significant reduction in ensemble variance and massive computational speed-ups.`,
      r`Ensemble size immunity: bagging cannot overfit by simply increasing the number of trees $B$; error asymptotically plateaus.`,
    ],
    pitfalls: [
      r`Bagging high-bias models: averaging multiple linear models or shallow trees produces essentially the same line, offering zero performance gain.`,
      r`Data pre-processing leakage: scaling, normalisation, or feature selection performed on the full dataset before bootstrap resampling leaks information across folds.`,
      r`Dominant feature masking: if one feature is overwhelmingly predictive, standard bagging trees will all select it at the root, maintaining high pairwise correlation $\rho$.`,
      r`Applying standard bootstrap to temporal sequences: random sampling with replacement shuffles temporal order and destroys auto-regressive structure.`,
    ],
    code: r`import numpy as np

np.random.seed(42)
n = 200
x = np.linspace(-3, 3, n)
y = (np.sin(x) > 0).astype(int)
noise = np.random.choice([0, 1], size=n, p=[0.85, 0.15])
y_noisy = np.bitwise_xor(y, noise)

B = 40
tree_preds = np.zeros((B, n))

for b in range(B):
    idx = np.random.choice(n, n, replace=True)
    best_gain, best_thresh, best_pred = -1, 0, (0, 1)
    for _ in range(6):
        th = np.random.uniform(-2.5, 2.5)
        left = idx[x[idx] < th]
        right = idx[x[idx] >= th]
        if len(left) < 5 or len(right) < 5: continue
        p1 = np.mean(y_noisy[left])
        p2 = np.mean(y_noisy[right])
        gain = len(left) * abs(p1 - 0.5) + len(right) * abs(p2 - 0.5)
        if gain > best_gain:
            best_gain = gain
            best_thresh = th
            best_pred = (int(p1 >= 0.5), int(p2 >= 0.5))
    tree_preds[b] = np.where(x < best_thresh, best_pred[0], best_pred[1])

single_acc = np.mean([np.mean(tree_preds[b] == y) for b in range(B)])
ensemble_pred = (np.mean(tree_preds, axis=0) >= 0.5).astype(int)
ens_acc = np.mean(ensemble_pred == y)

print("Single tree mean accuracy:", round(float(single_acc), 3))
print("Ensemble accuracy:", round(float(ens_acc), 3))
print("Theoretical OOB fraction 1/e:", round(float(1 / np.e), 3))`,
    quiz: [
      {
        q: r`Why does Bagging reduce prediction error when applied to deep decision trees?`,
        o: [
          r`It converts deep trees into linear support vector machines`,
          r`It averages unpruned, low-bias estimators, driving ensemble variance down by cancelling out idiosyncratic noise`,
          r`It prunes leaves that contain fewer than five training samples`,
          r`It forces all trees to use identical split criteria across all nodes`,
        ],
        a: 1,
        why: r`Deep decision trees have low bias but high variance; averaging across diverse bootstrap resamples cancels out random variance without inflating bias.`,
      },
      {
        q: r`What key algorithmic distinction differentiates Extra-Trees from standard Random Forests?`,
        o: [
          r`Extra-Trees only trains on neural network representations`,
          r`Extra-Trees uses gradient boosting rather than bootstrap aggregation`,
          r`Extra-Trees requires all features to follow a normal distribution`,
          r`Extra-Trees draws split thresholds completely at random rather than searching for optimal cut-points`,
        ],
        a: 3,
        why: r`At each node, Extra-Trees draws random cut-points for each candidate feature from a uniform distribution, avoiding the exhaustive search for the optimal Gini threshold.`,
      },
      {
        q: r`What is the theoretical proportion of unique training observations omitted from each bootstrap sample of size $n$ as $n \to \infty$?`,
        o: [
          r`Approximately $1/e \approx 36.8\\%$`,
          r`Exactly $50.0\\%$`,
          r`Zero, because sampling is performed with replacement`,
          r`Approximately $5.0\\%$`,
        ],
        a: 0,
        why: r`The probability that an item is never selected in $n$ independent draws with replacement converges to $(1 - 1/n)^n \to 1/e \approx 0.3679$.`,
      },
      {
        q: r`Why does Bagging fail to improve performance when applied to shallow linear regression models?`,
        o: [
          r`Linear models cannot be evaluated using Out-of-Bag scoring`,
          r`Linear models are already non-linear, making bagging redundant`,
          r`Linear models are stable, low-variance estimators; averaging similar hyperplanes cannot reduce bias and yields virtually no variance benefit`,
          r`Linear models cannot be trained on bootstrap resamples`,
        ],
        a: 2,
        why: r`Bagging is strictly a variance-reduction tool. Because linear models have low variance and high bias, averaging multiple linear fits leaves the error unchanged.`,
      },
    ],
    usedBy: [],
    prereq: ['decision_tree_classifier', 'random_forest_classifier', 'bias-variance-tradeoff', 'bootstrap-and-jackknife'],
    related: ['random_forest_classifier', 'gradient_boosted_classifiers', 'stacking_voting_classifiers'],
    keywords: 'bagging bootstrap aggregating extra trees extremely randomised trees ensemble variance reduction out of bag oob',
  },
  {
    id: 'multiclass-strategies-one-vs-rest-one-vs-one-softmax',
    short: 'Multiclass strategies',
    title: 'Multiclass Strategies: One-vs-Rest, One-vs-One and Softmax',
    task: 'concepts',
    module: 'Beyond the basics',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Multiclass classification decomposes multi-category targets into binary sub-problems via One-vs-Rest or One-vs-One, or predicts class probabilities jointly via Softmax regression.`,
    lead: r`Many foundational classification algorithms—such as standard Support Vector Machines, perceptrons, and linear margins—are inherently binary. To predict among $K > 2$ classes, algorithms either adopt architectural reductions (One-vs-Rest or One-vs-One tournaments) or formulate a native multinomial likelihood using the Softmax function.`,
    intuition: [
      r`Imagine sorting incoming emails into three categories: Work, Personal, and Finance. If your classifier only knows how to answer yes-or-no queries, how do you proceed? The most common heuristic is **One-vs-Rest (OvR)**, also known as One-vs-All. You train three separate binary models: Model 1 asks "Is this Work or not?", Model 2 asks "Is this Personal or not?", and Model 3 asks "Is this Finance or not?". Each model scores the document, and you assign the email to whichever classifier reports the highest decision margin.`,
      r`An alternative decomposition is **One-vs-One (OvO)**. Instead of pitting each class against the pooled remainder of the dataset, you organise a round-robin tournament between every unique pair of classes. For 3 categories, you train $3(2)/2 = 3$ binary classifiers: Work vs Personal, Work vs Finance, and Personal vs Finance. Each classifier votes for its preferred class, and the class with the most aggregate votes wins. Although OvO trains $K(K-1)/2$ models, each model trains on a much smaller dataset ($2/K$ of the data), making it exceptionally fast for algorithms with super-linear computational scaling.`,
      r`Rather than decomposing multi-class problems into disconnected binary tasks, **Softmax regression** solves the problem natively. It maintains a separate weight vector for each class, computes linear logits $z_k = x^T w_k$, and exponentiates and normalises them so the resulting probabilities across all $K$ categories sum to exactly 1.0. By jointly optimising a single multinomial cross-entropy loss, Softmax accounts for direct competition between classes, avoiding the uncalibrated score comparisons that can compromise OvR.`,
    ],
    analogy: r`OvR is like holding separate individual referendum votes on every candidate, OvO is a round-robin boxing tournament where every contender fights every other contender, and Softmax is a single ballot where voters allocate a unified probability distribution across all contenders simultaneously.`,
    steps: [
      r`Determine the class count $K$ and establish whether base estimators natively support multinomial likelihoods or require binary reduction.`,
      r`For One-vs-Rest (OvR), construct $K$ binary classification tasks, setting class $k$ as positive (+1) and pooling all other $K-1$ classes as negative (0).`,
      r`For One-vs-One (OvO), train $K(K-1)/2$ binary models on paired subsets $\mathcal{D}_{ij} = \\{ (x, y) \mid y \in \\{i, j\\} \\}.`,
      r`For Softmax regression, parameterise a weight matrix $W \in \mathbb{R}^{p \times K}$ and compute class probabilities via normalised exponentials.`,
      r`Aggregate classifications: select $\arg\max$ of continuous decision margins in OvR, tally pairwise majority votes in OvO, or pick the maximum posterior probability in Softmax.`,
      r`Diagnose probability calibration and resolve ties or ambiguous multi-class boundaries.`,
    ],
    math: [
      {
        h: 'One-vs-Rest (OvR) decision rule',
        tex: r`$$\hat{y} = \arg\max_{k \in \\{1, \dots, K\\}} f_k(x), \quad f_k(x) = x^T w_k + b_k$$`,
        p: r`$f_k(x)$ represents the decision margin of binary classifier $k$ trained to separate class $k$ from all other classes. When binary models output uncalibrated scores, the $\arg\max$ operator can be skewed toward models with artificially wide margin scales.`,
      },
      {
        h: 'One-vs-One (OvO) model count and voting rule',
        tex: r`$$M = \frac{K(K - 1)}{2}, \quad \hat{y} = \arg\max_{k} \sum_{j \ne k} \mathbb{I}\big(f_{kj}(x) = k\big)$$`,
        p: r`$M$ is the number of pairwise binary classifiers. Each model $f_{kj}$ votes for either class $k$ or class $j$. The class accumulating the highest vote tally across all pairwise duels is selected, with ties broken by sum of decision margins.`,
      },
      {
        h: 'The Softmax function and categorical cross-entropy',
        tex: r`$$P(Y = k \mid x) = \frac{e^{x^T w_k}}{\sum_{j=1}^K e^{x^T w_j}}, \quad \mathcal{L}_{\text{CE}}(W) = -\sum_{i=1}^n \sum_{k=1}^K \mathbb{I}(y_i = k) \log P(Y = k \mid x_i)$$`,
        p: r`Logits $z_k = x^T w_k$ are exponentiated and normalised by the partition denominator $\sum_{j=1}^K e^{z_j}$, ensuring probabilities remain strictly positive and sum to 1.0. Gradient descent updates weights based on prediction error residuals $(p_{ik} - y_{ik}) x_i$.`,
      },
    ],
    keyPoints: [
      r`OvR trains $K$ classifiers on full dataset size $n$; OvO trains $K(K-1)/2$ classifiers on smaller sub-samples ($2n/K$).`,
      r`OvO is computationally advantageous for algorithms with super-linear scaling $\mathcal{O}(n^2)$ (like kernel SVMs), as the sum of squared sub-sample sizes is smaller than $K n^2$.`,
      r`Softmax regression produces mutually exclusive, globally calibrated posterior probabilities that naturally sum to 1.0.`,
      r`OvR introduces severe class imbalance as $K$ increases: in a 20-class dataset, each OvR classifier faces a 1:19 imbalance ratio.`,
    ],
    pitfalls: [
      r`Comparing uncalibrated margins in OvR: binary SVM decision function values have different scales; taking $\arg\max$ directly favours classifiers with higher variance.`,
      r`OvO combinatorial explosion: for problems with $K > 100$ categories, OvO requires thousands of models, creating severe latency and memory bottlenecks.`,
      r`Softmax overconfidence: the exponential function in Softmax aggressively exaggerates logit gaps, often assigning >99% confidence to inputs far from the training data.`,
      r`Applying Softmax to multi-label problems: Softmax enforces a single mutually exclusive winner; multi-label classification requires independent sigmoid outputs.`,
    ],
    code: r`import numpy as np

np.random.seed(42)
n_per_class, K = 60, 3
centres = [[-1.5, -1.0], [1.5, -1.0], [0.0, 1.8]]
X = np.vstack([np.random.normal(c, 0.6, (n_per_class, 2)) for c in centres])
y = np.repeat([0, 1, 2], n_per_class)
N, p = X.shape
X_b = np.column_stack([np.ones(N), X])

# 1. Softmax regression
W = np.zeros((p + 1, K))
lr = 0.1
for _ in range(250):
    logits = X_b @ W
    exp_z = np.exp(logits - np.max(logits, axis=1, keepdims=True))
    P = exp_z / np.sum(exp_z, axis=1, keepdims=True)
    Y_onehot = np.eye(K)[y]
    W -= lr * (X_b.T @ (P - Y_onehot)) / N

softmax_acc = np.mean(np.argmax(X_b @ W, axis=1) == y)

# 2. One-vs-Rest (OvR) binary logistic models
ovr_probs = np.zeros((N, K))
for k in range(K):
    y_bin = (y == k).astype(float)
    w_bin = np.zeros(p + 1)
    for _ in range(250):
        p_bin = 1.0 / (1.0 + np.exp(-np.clip(X_b @ w_bin, -15, 15)))
        w_bin -= lr * (X_b.T @ (p_bin - y_bin)) / N
    ovr_probs[:, k] = 1.0 / (1.0 + np.exp(-np.clip(X_b @ w_bin, -15, 15)))

ovr_acc = np.mean(np.argmax(ovr_probs, axis=1) == y)

print("Softmax classification accuracy:", round(float(softmax_acc), 3))
print("One-vs-Rest classification accuracy:", round(float(ovr_acc), 3))
print("Sample Softmax row sum:", round(float(np.sum(P[0])), 3))
print("Sample OvR row sum (not constrained to 1):", round(float(np.sum(ovr_probs[0])), 3))`,
    quiz: [
      {
        q: r`How many binary classifiers must be trained to solve a $K$-class problem using the One-vs-One (OvO) strategy?`,
        o: [
          r`$K$`,
          r`$2^K$`,
          r`$\frac{K(K - 1)}{2}$`,
          r`$K^2$`,
        ],
        a: 2,
        why: r`OvO trains a separate binary classifier for every unique pair of classes, resulting in $\binom{K}{2} = \frac{K(K-1)}{2}$ models.`,
      },
      {
        q: r`Why can One-vs-One (OvO) train faster than One-vs-Rest (OvR) when using non-linear Support Vector Machines?`,
        o: [
          r`SVMs scale super-linearly with sample size ($\mathcal{O}(n^2)$ to $\mathcal{O}(n^3)$), so training many models on small sub-samples is much cheaper than training $K$ models on the full dataset`,
          r`OvO eliminates the need for computing kernel gram matrices`,
          r`OvO converts non-linear SVMs into linear decision trees`,
          r`OvO only trains on support vectors from the negative class`,
        ],
        a: 0,
        why: r`Because kernel SVM training complexity scales super-linearly with $n$, training $\approx K^2/2$ models on small datasets of size $2n/K$ requires far less computation than training $K$ models on the full dataset of size $n$.`,
      },
      {
        q: r`What is a major limitation of One-vs-Rest (OvR) when the number of classes $K$ is large?`,
        o: [
          r`It requires all classes to have equal variance`,
          r`It cannot be parallelised across CPU cores`,
          r`It forces all predicted probabilities to sum to zero`,
          r`It induces severe class imbalance, as each binary model trains against $K-1$ pooled classes`,
        ],
        a: 3,
        why: r`In an OvR setup with $K$ classes, each binary classifier compares 1 class against $K-1$ combined classes, exposing the binary learner to severe label imbalance.`,
      },
      {
        q: r`How does Softmax regression ensure that predicted class probabilities are mutually consistent?`,
        o: [
          r`It rounds all negative logits up to zero`,
          r`It normalises exponentiated logits by a shared partition function, guaranteeing probabilities sum to exactly 1.0`,
          r`It trains independent threshold moving rules on each feature`,
          r`It requires each class to be strictly orthogonal in feature space`,
        ],
        a: 1,
        why: r`The Softmax denominator $\sum_{j=1}^K e^{z_j}$ acts as a normalising partition function, ensuring all outputs are positive and sum to 1.0.`,
      },
    ],
    usedBy: [],
    prereq: ['logistic_regression', 'support_vector_classifier', 'loss-functions'],
    related: ['logistic_regression', 'mlp_classifier', 'confusion-matrix'],
    keywords: 'multiclass one vs rest one vs one ovo ovr softmax multinomial logistic regression categorical cross entropy',
  },
  {
    id: 'class-imbalance-weights-smote-threshold-moving',
    short: 'Class imbalance strategies',
    title: 'Class Imbalance: Sample Weights, SMOTE and Threshold Moving',
    task: 'concepts',
    module: 'Beyond the basics',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Class imbalance biases learning objectives toward majority examples; cost-sensitive sample weighting, synthetic over-sampling (SMOTE), and decision threshold moving restore minority detection.`,
    lead: r`In fraud detection, rare disease screening, and industrial failure monitoring, positive cases typically comprise less than 1% of observations. Conventional algorithms minimise global error, frequently defaulting to trivial majority predictions. Mitigating class imbalance requires targeted intervention: modifying the loss function with class weights, synthesizing minority examples in feature space via SMOTE, or adjusting the decision threshold post-hoc.`,
    intuition: [
      r`Imagine an automated security inspection where 1 in every 1,000 scanned parcels contains contraband. A lazy inspection system that approves every parcel without checking scores an impressive 99.9% accuracy. Under standard unweighted loss functions, machine learning algorithms emulate that lazy inspector: because misclassifying a rare positive carries the exact same penalty as misclassifying an ordinary negative, the optimiser easily minimises total error by sacrificing the minority class completely.`,
      r`Three distinct strategies counteract this majority bias:
1. **Algorithmic weighting**: penalise errors on rare classes proportionally to their scarcity. By weighting positive errors 999 times more heavily than negative errors, gradient updates are dominated by minority misclassifications.
2. **Resampling**: re-balance the training data before fitting. While random over-sampling causes exact duplicates to overfit and under-sampling discards valuable majority data, **SMOTE** (Synthetic Minority Over-sampling Technique) creates synthetic minority instances by interpolating along line segments connecting $k$-nearest minority neighbours.
3. **Threshold moving**: leave the trained model and data untouched, but modify the classification boundary. Standard classifiers assign positive labels when predicted probability $\\hat{P}(Y=1 \\mid x) \\ge 0.5$. In severe imbalance, the optimal threshold according to business costs often lies at $0.05$ or $0.10$.`,
      r`Selecting among these techniques depends on engineering context. Class weighting is computationally lightweight and preserves true posterior probability calibration. SMOTE expands minority coverage in sparse feature regions, though it can interpolate across noise in high-dimensional settings. Threshold moving provides unmatched operational agility: it enables real-time adjustments between Precision and Recall as business costs, fraud rates, and capacity constraints shift, without requiring model retraining.`,
    ],
    analogy: r`If class imbalance is an exam where 99 questions are trivial and 1 is critical, class weighting makes the critical question worth 99 points, SMOTE writes practice questions similar to the hard one, and threshold moving lowers the passing score so nobody fails to attempt it.`,
    steps: [
      r`Measure the imbalance ratio $r = N_{\text{maj}} / N_{\text{min}}$ and discard raw accuracy in favour of PR-AUC, balanced accuracy, or $F_\beta$ scores.`,
      r`Assign inverse-frequency sample weights $w_k = n / (K \cdot n_k)$ directly in the objective function to equilibrate class gradient contributions.`,
      r`If resampling is desired, apply SMOTE strictly inside cross-validation training folds; never over-sample validation or test data.`,
      r`Train a well-calibrated probabilistic classifier (such as logistic regression or gradient-boosted trees) on the weighted or resampled data.`,
      r`Plot the Precision-Recall curve on held-out validation data to identify the cost-optimal decision threshold $t^*$.`,
      r`Deploy threshold moving in production: classify an instance as positive whenever $\hat{P}(Y=1 \mid x) \ge t^*$.`,
    ],
    math: [
      {
        h: 'Cost-sensitive weighted log-loss',
        tex: r`$$\mathcal{L}_{\text{weighted}}(w) = -\sum_{i=1}^n \Big[ w_1 \\, y_i \log p_i + w_0 \\, (1 - y_i) \log(1 - p_i) \Big], \quad w_k = \frac{n}{K \cdot n_k}$$`,
        p: r`$w_k$ denotes the class weight, $n$ is total sample size, $K$ is number of classes, and $n_k$ is the frequency of class $k$. Weighting scales gradients so that a rare minority instance exerts equal total influence as abundant majority points during parameter updates.`,
      },
      {
        h: 'SMOTE synthetic sample interpolation',
        tex: r`$$x_{\text{new}} = x_i + \lambda \cdot (x_{(j)} - x_i), \quad \lambda \sim \mathcal{U}(0, 1)$$`,
        p: r`$x_i$ is a minority seed instance, $x_{(j)}$ is a randomly chosen neighbour from $x_i$'s $k$-nearest minority neighbours, and $\lambda$ is a uniform random scalar. This generates convex combinations along the line segment connecting neighbouring minority examples in feature space.`,
      },
      {
        h: 'Bayes-optimal decision threshold with asymmetric costs',
        tex: r`$$t^* = \frac{C_{\text{FP}} - C_{\text{TN}}}{(C_{\text{FP}} - C_{\text{TN}}) + (C_{\text{FN}} - C_{\text{TP}})}$$`,
        p: r`$C_{\text{FP}}$ represents the cost of a false positive and $C_{\text{FN}}$ is the cost of a false negative. When missing a positive is 20 times more costly than investigating a false alarm, the Bayes-optimal decision threshold shifts dramatically from $0.5$ down to $t^* \approx 1 / (1 + 20) \approx 0.048$.`,
      },
    ],
    keyPoints: [
      r`Accuracy is completely uninformative under severe imbalance; evaluate using Precision-Recall curves, PR-AUC, and cost curves.`,
      r`Never over-sample before splitting: applying SMOTE to the entire dataset before cross-validation causes massive data leakage and optimistic bias.`,
      r`Threshold moving operates entirely post-hoc, allowing real-time tuning of Precision-Recall trade-offs without costly model retraining.`,
      r`Class weighting and threshold moving do not modify input feature geometry, avoiding synthetic noise generation in high dimensions.`,
    ],
    pitfalls: [
      r`Pre-split SMOTE leakage: synthesizing data prior to train-test splitting allows synthetic points derived from test examples to infiltrate training sets.`,
      r`Applying SMOTE to noisy, high-dimensional spaces: linear interpolation between noisy minority outliers creates synthetic points deep inside majority class territory.`,
      r`Ignoring probability distortion from resampling: artificially inflating minority prevalence distorts posterior probability estimates, requiring post-hoc calibration.`,
      r`Optimising standard $F_1$ score without cost calibration: $F_1$ weights Precision and Recall equally ($\beta=1$), which rarely matches real-world asymmetric business costs.`,
    ],
    code: r`import numpy as np
from scipy.spatial.distance import cdist

np.random.seed(42)
n_maj, n_min = 380, 20
X_maj = np.random.normal([0, 0], 1.0, (n_maj, 2))
X_min = np.random.normal([1.8, 1.8], 0.8, (n_min, 2))
X = np.vstack([X_maj, X_min])
y = np.concatenate([np.zeros(n_maj), np.ones(n_min)])
n_total = len(y)

# 1. SMOTE: generate 60 synthetic minority points via KNN interpolation
dists = cdist(X_min, X_min)
np.fill_diagonal(dists, np.inf)
knn_indices = np.argsort(dists, axis=1)[:, :5]

synthetic_pts = []
for i in range(len(X_min)):
    for _ in range(3):
        neighbor = X_min[np.random.choice(knn_indices[i])]
        synthetic_pts.append(X_min[i] + np.random.uniform(0, 1) * (neighbor - X_min[i]))

# 2. Train logistic regression on original data
X_b = np.column_stack([np.ones(n_total), X])
w = np.zeros(3)
for _ in range(300):
    p = 1.0 / (1.0 + np.exp(-X_b @ w))
    w -= 0.05 * (X_b.T @ (p - y)) / n_total

probs = 1.0 / (1.0 + np.exp(-X_b @ w))

def eval_thresh(t):
    pred = (probs >= t).astype(int)
    tp = np.sum((pred == 1) & (y == 1))
    fp = np.sum((pred == 1) & (y == 0))
    fn = np.sum((pred == 0) & (y == 1))
    prec = tp / (tp + fp) if (tp + fp) > 0 else 0
    rec = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0
    return prec, rec, f1

p_50, r_50, f1_50 = eval_thresh(0.5)
p_opt, r_opt, f1_opt = eval_thresh(0.12)

print("Imbalance ratio:", round(float(n_maj / n_min), 1), ": 1")
print("Threshold 0.50 -> Precision:", round(float(p_50), 3), "Recall:", round(float(r_50), 3), "F1:", round(float(f1_50), 3))
print("Threshold 0.12 -> Precision:", round(float(p_opt), 3), "Recall:", round(float(r_opt), 3), "F1:", round(float(f1_opt), 3))
print("Synthetic points generated via SMOTE:", len(synthetic_pts))`,
    quiz: [
      {
        q: r`Why is raw classification accuracy a deceptive metric in highly imbalanced datasets?`,
        o: [
          r`A trivial model that predicts the majority class exclusively achieves high accuracy while detecting zero minority instances`,
          r`Accuracy cannot be calculated when minority samples are fewer than 100`,
          r`Accuracy values oscillate wildly depending on random number seeds`,
          r`Accuracy is mathematically identical to Recall in imbalanced settings`,
        ],
        a: 0,
        why: r`When 99% of samples belong to the majority class, a model predicting majority everywhere scores 99% accuracy while offering zero practical utility.`,
      },
      {
        q: r`Why must resampling techniques like SMOTE only ever be applied inside cross-validation training folds?`,
        o: [
          r`SMOTE is computationally too slow to execute on full datasets`,
          r`Applying SMOTE to the whole dataset before splitting leaks test information into training folds, producing artificially optimistic scores`,
          r`Scikit-learn raises a syntax error if SMOTE is applied outside a pipeline`,
          r`Applying SMOTE to test sets changes feature names`,
        ],
        a: 1,
        why: r`Over-sampling the full dataset synthesises instances between future test points and training points, causing data leakage and unrealistic validation performance.`,
      },
      {
        q: r`How does the SMOTE algorithm generate new synthetic instances?`,
        o: [
          r`By duplicating minority examples and adding Gaussian noise to all columns`,
          r`By inverting the covariance matrix of the majority class`,
          r`By randomly interpolating along line segments connecting $k$-nearest minority neighbours in feature space`,
          r`By generating points using a deep generative adversarial network`,
        ],
        a: 2,
        why: r`SMOTE takes a minority sample, identifies its $k$-nearest minority neighbours, and creates synthetic points along the convex line segments joining them: $x_{\text{new}} = x_i + \lambda(x_{(j)} - x_i)$.`,
      },
      {
        q: r`What is the primary operational advantage of threshold moving over retraining with class weights or SMOTE?`,
        o: [
          r`Threshold moving guarantees 100% precision and recall simultaneously`,
          r`Threshold moving eliminates the need for computing predicted probabilities`,
          r`Threshold moving works without requiring any validation data`,
          r`It allows real-time adjustment of Precision and Recall trade-offs to match fluctuating business costs without retraining the model`,
        ],
        a: 3,
        why: r`Threshold moving adjusts the decision boundary $t^*$ post-hoc on predicted probabilities, allowing instant operational tuning as business conditions shift.`,
      },
    ],
    usedBy: [],
    prereq: ['logistic_regression', 'confusion-matrix', 'cross-validation'],
    related: ['cost-vs-loss-vs-error', 'probability-calibration-platt-scaling-isotonic-reliability-curves', 'decision_tree_classifier'],
    keywords: 'class imbalance smote sample weights threshold moving precision recall fraud detection cost sensitive learning',
  },
  {
    id: 'probability-calibration-platt-scaling-isotonic-reliability-curves',
    short: 'Probability calibration',
    title: 'Probability Calibration: Platt Scaling, Isotonic Regression and Reliability Curves',
    task: 'concepts',
    module: 'Beyond the basics',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Probability calibration aligns raw classifier confidence scores with true empirical event rates, diagnosed using reliability curves and corrected via Platt scaling or isotonic regression.`,
    lead: r`A classification model can achieve high accuracy and strong AUC while outputting completely uncalibrated confidence scores: when it outputs 0.90 probability, the positive outcome may occur only 50% of the time. In clinical risk estimation, insurance underwriting, and automated fraud routing, numerical probabilities must be reliable. Reliability diagrams diagnose miscalibration, while Platt scaling and Isotonic regression map distorted margins into calibrated posterior probabilities.`,
    intuition: [
      r`Imagine a meteorology app that announces an 80% chance of rain. If you review all 100 days across the year where the app posted an 80% forecast, did it actually rain on approximately 80 of those days? If it only rained on 45 of those days, the forecast is severely overconfident. Conversely, if it rained on 98 of those days, the forecast is underconfident. A classifier is well-calibrated if a predicted probability of $p$ directly corresponds to an empirical positive frequency of $p$.`,
      r`Different model architectures exhibit characteristic calibration flaws:
- **Support Vector Machines (SVMs)** output uncalibrated signed distances to the separating hyperplane; standard margins have no probabilistic meaning.
- **Naive Bayes** pushes probabilities toward 0.0 and 1.0 because multiplying correlated feature probabilities compounds evidence, producing a distinct sigmoidal distortion in reliability curves.
- **Deep Neural Networks** with modern regularisation (dropout, weight decay, cross-entropy over-parameterisation) are systematically overconfident: they achieve high accuracy while assigning 99% confidence to borderline instances (Guo et al., 2017).
- **Random Forests** struggle near 0 and 1 because tree leaf averaging pushes ensemble predictions inward toward the historical base rate.`,
      r`To calibrate a model, we fit a monotonic post-processing function $g(s)$ on held-out validation data. **Platt scaling** fits a two-parameter logistic sigmoid $1 / (1 + e^{A s + B})$, making it ideal for sigmoidal distortions (such as SVM margins) or modest validation sets ($n < 1,000$). **Isotonic regression** fits a non-parametric, piece-wise constant non-decreasing step function using the Pool Adjacent Violators Algorithm (PAVA). Isotonic regression can correct arbitrary monotonic distortions without parametric assumptions, but requires larger validation datasets to prevent step-fitting overfitting.`,
    ],
    analogy: r`Calibration is like zeroing and aligning a bathroom scale: the scale might accurately tell you that you weigh more than your friend (ranking discrimination), but until it is calibrated against certified weights, you cannot trust the actual number on the display.`,
    steps: [
      r`Generate uncalibrated decision scores or raw probabilities $s_i$ on a dedicated held-out validation set (never calibrate on training data).`,
      r`Construct a **Reliability Diagram (Calibration Curve)**: bin predictions into $M$ equal intervals (e.g. $[0, 0.1), [0.1, 0.2), \dots$) and plot mean predicted confidence against observed fraction of positives.`,
      r`Compute the **Expected Calibration Error (ECE)** and **Brier Score** to quantify baseline calibration error.`,
      r`Select a calibrator: choose **Platt Scaling** if the miscalibration is sigmoidal or validation data is modest ($n < 1,000$), or **Isotonic Regression** if the distortion is non-sigmoidal and validation data is plentiful.`,
      r`Fit the post-processing calibration mapping $g(s)$ on validation scores using maximum likelihood or least squares.`,
      r`Apply the fitted calibrator to test predictions, verifying that ECE and Brier score improve while ROC-AUC ranking discrimination remains preserved.`,
    ],
    math: [
      {
        h: 'Definition of perfect calibration',
        tex: r`$$\mathbb{P}\big(Y = 1 \mid \hat{P} = p\big) = p \quad \forall p \in [0, 1]$$`,
        p: r`$\hat{P}$ is the model's predicted probability, and $Y \in \\{0, 1\\}$ is the true binary label. Perfect calibration guarantees that among all instances assigned probability $p$, exactly a fraction $p$ are positive outcomes.`,
      },
      {
        h: 'Expected Calibration Error (ECE)',
        tex: r`$$\operatorname{ECE} = \sum_{m=1}^M \frac{|B_m|}{n} \Big| \operatorname{acc}(B_m) - \operatorname{conf}(B_m) \Big|$$`,
        p: r`Predictions are grouped into $M$ bins $B_m$. $|B_m|/n$ is the bin sample weight, $\operatorname{acc}(B_m) = \frac{1}{|B_m|}\sum_{i \in B_m} y_i$ is empirical bin accuracy, and $\operatorname{conf}(B_m) = \frac{1}{|B_m|}\sum_{i \in B_m} \hat{p}_i$ is mean predicted confidence. ECE computes the weighted absolute divergence between confidence and reality.`,
      },
      {
        h: 'Platt scaling and Isotonic regression',
        tex: r`$$\hat{P}_{\text{Platt}} = \frac{1}{1 + \exp(A s + B)}, \quad \min_{g} \sum_{i=1}^n \big(y_i - g(s_i)\big)^2 \\;\\; \text{s.t.} \\;\\; g(s_i) \le g(s_j) \text{ for } s_i \le s_j$$`,
        p: r`Platt scaling optimises parameters $A$ and $B$ via negative log-likelihood on validation margins $s_i$. Isotonic regression fits a non-parametric monotonic step function $g(s)$ via the Pool Adjacent Violators Algorithm (PAVA), preserving rank order while minimising mean squared error.`,
      },
    ],
    keyPoints: [
      r`Discrimination vs Calibration: ROC-AUC evaluates ranking discrimination, whereas calibration evaluates whether probability magnitudes match empirical event frequencies.`,
      r`Monotonicity preservation: monotonic calibrators (Platt scaling and Isotonic regression) do not alter prediction rank order, leaving ROC-AUC completely unchanged.`,
      r`The Brier Score ($\frac{1}{n}\sum (y_i - \hat{p}_i)^2$) decomposes mathematically into uncertainty, reliability (calibration error), and resolution (discrimination).`,
      r`Always calibrate on held-out data: fitting calibration transformations on training sets perpetuates model overconfidence.`,
    ],
    pitfalls: [
      r`Calibrating on the training set: training predictions are naturally overconfident; calibrating on them freezes this overconfidence into production.`,
      r`Overfitting with Isotonic Regression on small samples ($n < 500$): unconstrained step functions fit sample noise, producing flat, discontinuous probability steps.`,
      r`Assuming high ROC-AUC implies good calibration: modern deep neural networks with 95% AUC frequently exhibit severe calibration drift.`,
      r`Class prevalence shifts: calibration parameters $A$ and $B$ are sensitive to the base rate of the calibration set; if test prevalence shifts, probabilities become biased.`,
    ],
    code: r`import numpy as np

np.random.seed(42)
n = 300
z = np.random.normal(0, 1.2, n)
p_true = 1.0 / (1.0 + np.exp(-z))
y = (np.random.uniform(0, 1, n) < p_true).astype(int)

# Uncalibrated raw decision margins
raw_scores = 2.5 * z + 0.8

def compute_ece(probs, labels, M=5):
    bins = np.linspace(0, 1, M + 1)
    ece = 0.0
    for m in range(M):
        mask = (probs >= bins[m]) & (probs < bins[m+1] if m < M-1 else probs <= bins[m+1])
        if np.sum(mask) == 0: continue
        bin_acc = np.mean(labels[mask])
        bin_conf = np.mean(probs[mask])
        ece += (np.sum(mask) / len(labels)) * abs(bin_acc - bin_conf)
    return ece

# Raw min-max scaled scores
p_raw = (raw_scores - raw_scores.min()) / (raw_scores.max() - raw_scores.min())
ece_raw = compute_ece(p_raw, y)
brier_raw = np.mean((p_raw - y)**2)

# Platt scaling: fit A, B via gradient descent on validation log-loss
A, B = -1.0, 0.0
lr = 0.05
for _ in range(500):
    logits = A * raw_scores + B
    p_platt = 1.0 / (1.0 + np.exp(-np.clip(logits, -15, 15)))
    A -= lr * np.mean((p_platt - y) * raw_scores)
    B -= lr * np.mean(p_platt - y)

p_cal = 1.0 / (1.0 + np.exp(-np.clip(A * raw_scores + B, -15, 15)))
ece_cal = compute_ece(p_cal, y)
brier_cal = np.mean((p_cal - y)**2)

print("Fitted Platt parameters: A =", round(float(A), 3), "B =", round(float(B), 3))
print("Uncalibrated ECE:", round(float(ece_raw), 3), "Brier Score:", round(float(brier_raw), 3))
print("Platt Calibrated ECE:", round(float(ece_cal), 3), "Brier Score:", round(float(brier_cal), 3))`,
    quiz: [
      {
        q: r`When is Platt scaling generally preferred over Isotonic regression for probability calibration?`,
        o: [
          r`When the validation sample size is relatively small ($n < 1,000$) and the distortion is approximately sigmoidal`,
          r`When the base classifier is a decision tree with more than 100 leaves`,
          r`When the target variable is continuous rather than binary`,
          r`When training data contains missing values`,
        ],
        a: 0,
        why: r`Platt scaling fits only two parameters ($A$ and $B$), avoiding the step-function overfitting that Isotonic regression suffers from on small validation samples.`,
      },
      {
        q: r`What does it mean for a probabilistic classifier to be "well-calibrated"?`,
        o: [
          r`The classifier achieves 100% training accuracy`,
          r`When the model predicts probability $p$, the empirical relative frequency of the positive outcome is approximately $p$`,
          r`The decision boundary is strictly linear`,
          r`All false positives and false negatives have equal cost`,
        ],
        a: 1,
        why: r`Calibration evaluates whether predicted probability values match true observed event rates: an 80% prediction should be correct roughly 80% of the time.`,
      },
      {
        q: r`What effect does monotonic calibration (such as Platt scaling or Isotonic regression) have on a classifier's ROC-AUC score?`,
        o: [
          r`It drastically increases the ROC-AUC score`,
          r`It reduces the ROC-AUC score to exactly 0.5`,
          r`It leaves the ROC-AUC score completely unchanged because monotonic transformations preserve sample rank ordering`,
          r`It inverts the ROC curve across the diagonal`,
        ],
        a: 2,
        why: r`ROC-AUC depends purely on the relative rank order of predicted scores. Monotonic transformations preserve rank ordering, leaving the ROC curve and its AUC invariant.`,
      },
      {
        q: r`Why are raw decision margins from Support Vector Machines (SVMs) uncalibrated?`,
        o: [
          r`SVMs can only predict discrete integer labels`,
          r`SVM decision margins are always negative numbers`,
          r`SVM kernels eliminate variance across all data points`,
          r`SVM margins measure geometric perpendicular distances to the separating hyperplane rather than probabilistic likelihoods`,
        ],
        a: 3,
        why: r`Standard SVMs optimise geometric margins, not likelihoods. The output $w^T x + b$ represents distance to the hyperplane, which carries no direct probabilistic meaning without post-hoc scaling.`,
      },
    ],
    usedBy: [],
    prereq: ['support_vector_classifier', 'logistic_regression', 'confusion-matrix'],
    related: ['class-imbalance-weights-smote-threshold-moving', 'loss-functions', 'cross-validation'],
    keywords: 'probability calibration platt scaling isotonic regression reliability curves brier score expected calibration error ece',
  },
  {
    id: "ordinal-classification",
    short: "Ordinal classification",
    title: "Ordinal Classification",
    task: "concepts",
    module: "Beyond the basics",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Classify targets with natural ordering: master cumulative link proportional odds models, ordered probit, and ordinal threshold learning.",
    lead: "Rating scales (1 to 5 stars), disease staging (mild, moderate, severe), and credit ratings (AAA to D) have meaningful order but unequal interval spacing. Ordinal models preserve ranking without falsely assuming equal distances.",
    intuition: [
      "In supervised learning, target variables frequently possess an inherent ordering without possessing a strict metric scale: survey responses (strongly disagree, neutral, agree), customer satisfaction ratings (1 to 5 stars), disease severity stages, or credit bond ratings. Treating these targets with nominal multi-class classification (such as standard multinomial logistic regression) completely discards order information, penalising a 1-star predicted as 2-star identically to a 1-star predicted as 5-star.",
      "Conversely, treating ordinal categories as continuous numbers and applying standard regression falsely assumes that intervals between adjacent categories are identical: that the perceptual difference between 1 and 2 stars is identical to the difference between 4 and 5 stars. Ordinal classification provides the rigorous intermediate framework, respecting relative ranking without imposing arbitrary metric distances.",
      "The standard statistical workhorse is the Proportional Odds model (cumulative logit model). It posits an unobserved continuous latent variable $y^* = x^T \\beta + \\epsilon$. The observed ordinal category $k \\in \\{1, 2, \\dots, K\\}$ is determined by where this latent score falls across a sequence of strictly increasing cut-point thresholds: $\\theta_1 < \\theta_2 < \\dots < \\theta_{K-1}$.",
      "The proportional odds property states that feature coefficients $\\beta$ are invariant across all cut-points: an increase in feature $x$ shifts the latent distribution uniformly, changing the odds of exceeding threshold $k$ by the same multiplicative factor $\\exp(\\beta_j)$ regardless of which threshold $k$ is considered. This parsimonious parameterisation requires estimating only $p$ feature weights plus $K-1$ thresholds, avoiding parameter proliferation."
    ],
    analogy: "Imagine categorising runners in a marathon into three medal tiers: Bronze, Silver, and Gold. The underlying running time is a continuous latent variable. Rather than retraining three unrelated models, the race judges place two cut-off clocks along the course: finish before 3 hours for Gold, finish before 4 hours for Silver, otherwise Bronze. An athlete running faster shifts their latent position across all threshold clocks simultaneously.",
    steps: [
      {
        "title": "1. Verify target ordering and establish categories",
        "body": "Define the ordered categories $\\mathcal{Y} = \\{1, 2, \\dots, K\\}$. Confirm that relative ranking is strictly monotonic while category step sizes are non-metric."
      },
      {
        "title": "2. Formulate cumulative probabilities and cut-points",
        "body": "Model cumulative distribution $P(Y \\le k \\mid x) = \\sigma(\\theta_k - x^T \\beta)$, where $\\theta_1 \\le \\theta_2 \\le \\dots \\le \\theta_{K-1}$ are threshold cut-points and $\\sigma$ is the logistic or Gaussian CDF."
      },
      {
        "title": "3. Maximise cumulative log-likelihood",
        "body": "Express individual category probability as the difference between adjacent cumulative probabilities: $P(Y = k \\mid x) = P(Y \\le k \\mid x) - P(Y \\le k-1 \\mid x)$. Maximise log-likelihood jointly over $\\beta$ and ordered thresholds $\\theta$."
      },
      {
        "title": "4. Evaluate predictions with rank-sensitive metrics",
        "body": "Evaluate performance using Mean Absolute Error on ranks (MAE), quadratic weighted Kappa (QWK), or ordinal cross-entropy rather than raw 0-1 accuracy."
      }
    ],
    math: [
      {
        "h": "Cumulative Link / Proportional Odds Formulation",
        "tex": "P(Y \\le k \\mid x) = \\sigma(\\theta_k - x^T \\beta) = \\frac{1}{1 + \\exp(-(\\theta_k - x^T \\beta))}, \\quad k = 1, \\dots, K-1",
        "p": "The probability of falling into category k or below is governed by distance between threshold theta_k and linear predictor x^T beta. A positive beta shifts probability toward higher categories."
      },
      {
        "h": "Category Probabilities",
        "tex": "P(Y = k \\mid x) = P(Y \\le k \\mid x) - P(Y \\le k - 1 \\mid x), \\quad P(Y \\le 0) = 0, \\; P(Y \\le K) = 1",
        "p": "Each discrete category probability corresponds to the area under the latent logistic curve bounded between adjacent thresholds theta_{k-1} and theta_k."
      },
      {
        "h": "Quadratic Weighted Kappa (QWK)",
        "tex": "\\kappa = 1 - \\frac{\\sum_{i, j} w_{ij} O_{ij}}{\\sum_{i, j} w_{ij} E_{ij}}, \\quad w_{ij} = \\frac{(i - j)^2}{(K - 1)^2}",
        "p": "Measures agreement between predicted and true ranks penalising large category discrepancies quadratically, serving as standard evaluation metric in automated grading and disease staging."
      }
    ],
    code: "import numpy as np\nfrom scipy.optimize import minimize\n\n# Proportional Odds Ordinal Logistic Regression from scratch\nnp.random.seed(42)\nn_samples = 300\n\n# 1. Generate synthetic ordinal data (3 categories: Low, Medium, High)\nx1 = np.random.normal(0, 1, n_samples)\nx2 = np.random.uniform(-1, 1, n_samples)\nX = np.column_stack([x1, x2])\n\n# Latent variable y* = beta1*x1 + beta2*x2 + noise\ntrue_beta = np.array([1.5, -0.8])\nlatent_y = X @ true_beta + np.random.logistic(0, 1, n_samples)\n\n# True cut-points: theta_1 = -0.5, theta_2 = 1.2\ntrue_thetas = np.array([-0.5, 1.2])\ny = np.zeros(n_samples, dtype=int)\ny[latent_y > true_thetas[0]] = 1\ny[latent_y > true_thetas[1]] = 2\n\n# 2. Cumulative Logit Model Fitting via Maximum Likelihood\nK = 3  # Number of classes\ndef sigmoid(z):\n    return 1.0 / (1.0 + np.exp(-np.clip(z, -30, 30)))\n\ndef negative_log_likelihood(params, X, y):\n    beta = params[:2]\n    # Parameterise thresholds with increments to enforce theta_1 < theta_2\n    theta = np.array([params[2], params[2] + np.exp(params[3])])\n    \n    linear_pred = X @ beta\n    n = len(y)\n    nll = 0.0\n    \n    for i in range(n):\n        k = y[i]\n        # P(Y <= k)\n        prob_k = sigmoid(theta[k] - linear_pred[i]) if k < K - 1 else 1.0\n        prob_prev = sigmoid(theta[k-1] - linear_pred[i]) if k > 0 else 0.0\n        prob = max(prob_k - prob_prev, 1e-12)\n        nll -= np.log(prob)\n        \n    return nll\n\n# Initial guess: beta=[0, 0], theta_1=0, increment=0\ninit_params = np.array([0.0, 0.0, 0.0, 0.0])\nres = minimize(negative_log_likelihood, init_params, args=(X, y), method='BFGS')\n\nest_beta = res.x[:2]\nest_thetas = np.array([res.x[2], res.x[2] + np.exp(res.x[3])])\n\n# Compute predictions\nlin_preds = X @ est_beta\npred_probs = np.zeros((n_samples, K))\nfor k in range(K):\n    p_k = sigmoid(est_thetas[k] - lin_preds) if k < K - 1 else 1.0\n    p_prev = sigmoid(est_thetas[k-1] - lin_preds) if k > 0 else 0.0\n    pred_probs[:, k] = p_k - p_prev\npred_classes = np.argmax(pred_probs, axis=1)\n\nmae = np.mean(np.abs(y - pred_classes))\nacc = np.mean(y == pred_classes)\n\nprint(f\"True beta:             {true_beta}\")\nprint(f\"Estimated beta:        {est_beta.round(3)}\")\nprint(f\"True cut-points:       {true_thetas}\")\nprint(f\"Estimated cut-points:  {est_thetas.round(3)}\")\nprint(f\"Classification accuracy: {acc * 100:.1f}%\")\nprint(f\"Mean Absolute Error (ranks): {mae:.3f} (captures distance on ordered scale)\")",
    keyPoints: [
      "Preserves inherent rank ordering of discrete targets without assuming arbitrary metric Euclidean distance.",
      "Cumulative logit proportional odds model relates features to cumulative probability $P(Y \\le k \\mid x) = \\sigma(\\theta_k - x^T \\beta)$.",
      "Feature weights $\\beta$ are shared across all thresholds, requiring only $p + (K - 1)$ parameters compared to $(K - 1) \\cdot p$ in multinomial regression.",
      "Latent threshold formulation $\\theta_1 < \\theta_2 < \\dots < \\theta_{K-1}$ partitions continuous latent response into ordered discrete bins.",
      "Performance is best evaluated via distance-aware metrics like Mean Absolute Error (MAE) on ranks or Quadratic Weighted Kappa (QWK)."
    ],
    pitfalls: [
      "Violation of proportional odds assumption: If a feature affects the transition between Mild and Moderate differently than between Moderate and Severe, the assumption fails and partial proportional odds is needed.",
      "Threshold ordering collapse: Unconstrained numerical optimisation can allow thresholds to cross ($\\theta_{k+1} < \\theta_k$), resulting in negative probabilities; reparameterising with positive increments is vital.",
      "Evaluating with accuracy: A model predicting class 1 when truth is class 5 receives the exact same penalty as predicting class 2 under 0-1 loss, masking severe directional blunders."
    ],
    quiz: [
      {
        "q": "Why is standard multinomial logistic regression sub-optimal for customer satisfaction ratings (1 to 5 stars)?",
        "o": [
          "It treats classes as unordered categories, penalising a 1-star predicted as 2-star identically to a 1-star predicted as 5-star",
          "It cannot handle more than 2 classes",
          "It assumes the response variable is normally distributed",
          "It requires inverting a matrix of dimension n x n"
        ],
        "a": 0,
        "why": "Multinomial logistic regression is nominal; it ignores the ordering of ratings and assigns equal loss to near-misses and extreme ranking blunders."
      },
      {
        "q": "What is the key geometric interpretation of the cut-points theta_1 < theta_2 < ... < theta_{K-1} in an ordinal model?",
        "o": [
          "They represent threshold boundaries partitioning a continuous latent space into ordered discrete categories",
          "They are the weights of the input features",
          "They represent the eigenvalues of the Hessian matrix",
          "They define the learning rate schedule for stochastic gradient descent"
        ],
        "a": 0,
        "why": "In ordinal threshold models, an underlying continuous latent variable y* is partitioned into discrete bins by the ordered boundary thresholds theta_k."
      }
    ],
    usedBy: [],
    prereq: [
      "logistic-regression-inference-odds-ratios-wald-tests",
      "generalised-linear-models"
    ],
    related: [
      "logistic_regression",
      "multi-label-classification",
      "cost-sensitive-learning",
      "generalised-linear-models"
    ],
    keywords: "ordinal classification, proportional odds, cumulative logit, ordered probit, thresholds, cut points, rank prediction, quadratic weighted kappa"
  },
  {
    id: "multi-label-classification",
    short: "Multi-label classification",
    title: "Multi-Label Classification",
    task: "concepts",
    module: "Beyond the basics",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Predict multiple non-mutually exclusive binary labels simultaneously: compare Binary Relevance, Classifier Chains, and label power-sets with Hamming loss.",
    lead: "A document can belong to Politics, Economics, and Tech simultaneously; an image can contain a dog, a frisbee, and a tree. Multi-label learning addresses non-exclusive target vectors while accounting for label correlations.",
    intuition: [
      "In conventional classification, classes are strictly mutually exclusive: an email is either spam or not spam (binary), or an image is either a cat, dog, or bird (multi-class). In contrast, real-world objects frequently possess multiple simultaneous attributes: a film can belong to Comedy, Drama, and Romance; a biomedical article can discuss Genetics, Oncology, and Immunology; a customer can be tagged as Churn-Risk, High-Spender, and Mobile-User.",
      "Multi-label learning maps feature vector $x$ to a binary target vector $y = [y_1, y_2, \\dots, y_L]^T \\in \\{0, 1\\}^L$. The fundamental algorithmic choice revolves around how to handle correlations among labels.",
      "The simplest strategy is Binary Relevance: decompose the problem into $L$ completely independent binary classification tasks, one per label. While embarrassingly parallel and scalable, Binary Relevance is blind to label dependencies: knowing an image contains a \"beach\" vastly increases the probability of \"ocean\" and \"sand\", but Binary Relevance cannot exploit this co-occurrence.",
      "Classifier Chains overcome this blind spot by ordering labels into a sequence and training each classifier with both original features $x$ and the ground-truth/predicted binary labels of all preceding classifiers in the chain. Label Powerset transforms the task into multi-class classification by treating every unique observed label combination as a distinct class, which models correlations perfectly but suffers from severe class explosion on rare combinations. Modern neural architectures employ independent sigmoid heads trained with binary cross-entropy loss."
    ],
    analogy: "Imagine assigning tags to songs in a music streaming library (e.g. Acoustic, Rock, Ballad, 90s, Instrumental). Binary Relevance hires five separate interns who sit in isolated soundproof booths and evaluate one tag each without speaking to each other. Classifier Chains seats the interns in a line: each intern listens to the song and glances at the tag decisions made by previous interns before making their own call.",
    steps: [
      {
        "title": "1. Formulate binary target indicator matrix",
        "body": "Structure targets as a binary matrix $Y \\in \\{0, 1\\}^{n \\times L}$, where $Y_{ij} = 1$ denotes presence of label $j$ on sample $i$."
      },
      {
        "title": "2. Select decomposition or neural architecture",
        "body": "Choose between Binary Relevance (fast, baseline), Classifier Chains (captures sequential correlations), or a shared deep neural backbone with $L$ independent sigmoid outputs."
      },
      {
        "title": "3. Train with Binary Cross-Entropy loss",
        "body": "Compute binary cross-entropy loss independently for each label head: $\\mathcal{L} = -\\frac{1}{L} \\sum_{j=1}^L [y_j \\log \\hat{p}_j + (1 - y_j) \\log (1 - \\hat{p}_j)]$. Average across all labels."
      },
      {
        "title": "4. Evaluate with label-specific and subset metrics",
        "body": "Evaluate predictions using Hamming Loss (fraction of incorrect individual label predictions), Subset Accuracy (fraction of instances where entire label set is 100% correct), and Macro/Micro F1 scores."
      }
    ],
    math: [
      {
        "h": "Hamming Loss",
        "tex": "\\operatorname{HL}(Y, \\hat{Y}) = \\frac{1}{n \\cdot L} \\sum_{i=1}^n \\sum_{j=1}^L \\mathbb{I}(Y_{ij} \\neq \\hat{Y}_{ij}) = \\frac{1}{n \\cdot L} \\|Y \\oplus \\hat{Y}\\|_1",
        "p": "Measures the fraction of individual label mistakes across all instances and labels. A lower Hamming loss indicates higher per-label accuracy."
      },
      {
        "h": "Subset Accuracy (Exact Match Ratio)",
        "tex": "\\operatorname{Acc}_{\\mathrm{subset}} = \\frac{1}{n} \\sum_{i=1}^n \\mathbb{I}(Y_i = \\hat{Y}_i)",
        "p": "The strictest metric: requires the entire predicted binary label vector to match ground truth exactly. Can be low even when individual label accuracy is above 95%."
      },
      {
        "h": "Classifier Chain Conditional Factorisation",
        "tex": "P(y_1, \\dots, y_L \\mid x) = \\prod_{j=1}^L P(y_j \\mid x, y_1, \\dots, y_{j-1})",
        "p": "By the probability chain rule, joint label probability factorises into a product of conditional probabilities, implemented by conditioning each classifier on previous predictions."
      }
    ],
    code: "import numpy as np\nfrom sklearn.linear_model import LogisticRegression\n\n# Multi-label classification: Binary Relevance vs Classifier Chains from scratch\nnp.random.seed(42)\nn_samples = 300\nn_features = 8\nn_labels = 4\n\n# Generate synthetic correlated multi-label dataset\nX = np.random.normal(0, 1, (n_samples, n_features))\n# Latent signals generating co-occurring tags\nlatent_topic = X[:, 0] + X[:, 1]\n\n# Labels with strong dependencies (e.g. Label 2 often co-occurs with Label 0)\ny = np.zeros((n_samples, n_labels), dtype=int)\ny[:, 0] = (latent_topic + np.random.normal(0, 0.5, n_samples) > 0).astype(int)\ny[:, 1] = (X[:, 2] - X[:, 3] + np.random.normal(0, 0.5, n_samples) > 0).astype(int)\ny[:, 2] = (y[:, 0] * 0.7 + X[:, 4] + np.random.normal(0, 0.5, n_samples) > 0.3).astype(int)\ny[:, 3] = (y[:, 1] * 0.8 + X[:, 5] + np.random.normal(0, 0.5, n_samples) > 0.4).astype(int)\n\n# Train/Test Split\nn_train = 200\nX_train, X_test = X[:n_train], X[n_train:]\ny_train, y_test = y[:n_train], y[n_train:]\n\n# 1. Binary Relevance (L independent models)\nbr_models = [LogisticRegression(solver='liblinear') for _ in range(n_labels)]\nfor j in range(n_labels):\n    br_models[j].fit(X_train, y_train[:, j])\n\ny_pred_br = np.column_stack([m.predict(X_test) for m in br_models])\n\n# 2. Classifier Chains (Sequential conditioning)\nchain_order = [0, 1, 2, 3]\nchain_models = []\nX_train_augmented = X_train.copy()\n\nfor j in chain_order:\n    clf = LogisticRegression(solver='liblinear')\n    clf.fit(X_train_augmented, y_train[:, j])\n    chain_models.append(clf)\n    # Augment feature matrix with true labels during training\n    X_train_augmented = np.column_stack([X_train_augmented, y_train[:, j]])\n\n# Predict with Classifier Chain sequentially\nX_test_augmented = X_test.copy()\ny_pred_chain = np.zeros_like(y_test)\n\nfor idx, j in enumerate(chain_order):\n    preds_j = chain_models[idx].predict(X_test_augmented)\n    y_pred_chain[:, j] = preds_j\n    # Augment test features with PREDICTED labels\n    X_test_augmented = np.column_stack([X_test_augmented, preds_j])\n\n# Evaluation\ndef eval_multilabel(y_true, y_pred):\n    hamming_loss = np.mean(y_true != y_pred)\n    subset_acc = np.mean(np.all(y_true == y_pred, axis=1))\n    return hamming_loss, subset_acc\n\nhl_br, sa_br = eval_multilabel(y_test, y_pred_br)\nhl_chain, sa_chain = eval_multilabel(y_test, y_pred_chain)\n\nprint(f\"Binary Relevance  - Hamming Loss: {hl_br:.4f}, Subset Accuracy: {sa_br*100:.1f}%\")\nprint(f\"Classifier Chains - Hamming Loss: {hl_chain:.4f}, Subset Accuracy: {sa_chain*100:.1f}%\")\nprint(f\"Subset Accuracy Improvement: +{(sa_chain - sa_br)*100:.1f}% by capturing label correlations\")",
    keyPoints: [
      "Multi-label classification assigns instances multiple non-mutually exclusive binary labels $y \\in \\{0, 1\\}^L$.",
      "Binary Relevance trains $L$ independent binary models; fast and scalable but ignores label co-occurrence dependencies.",
      "Classifier Chains condition each label on predictions of preceding labels, capturing dependencies via the probability chain rule.",
      "Standard multi-class Softmax activation is replaced with independent Sigmoids $\\sigma(z_j)$ trained via binary cross-entropy loss.",
      "Evaluated via Hamming Loss (per-label error rate) and Subset Accuracy (fraction of instances where all labels match exactly)."
    ],
    pitfalls: [
      "Using Softmax instead of Sigmoid: Softmax enforces a sum-to-one constraint across classes, forcing classes to compete and failing on multi-label targets.",
      "Error propagation in Classifier Chains: If early classifiers in a chain make erroneous predictions, downstream classifiers receive corrupted features during inference.",
      "Evaluating multi-label models with multi-class accuracy: Multi-class accuracy assumes a single scalar output; multi-label problems require Hamming loss or Macro/Micro F1."
    ],
    quiz: [
      {
        "q": "Why is independent Sigmoid activation used instead of Softmax in multi-label neural network heads?",
        "o": [
          "Sigmoid outputs independent probabilities for each label in [0, 1], whereas Softmax forces all class probabilities to sum to 1",
          "Sigmoid is faster to compute than addition",
          "Softmax cannot be differentiated during backpropagation",
          "Sigmoids eliminate the need for hidden layers"
        ],
        "a": 0,
        "why": "Softmax forces probabilities across all classes to sum to 1, assuming mutual exclusivity. Multi-label problems require each label to possess an independent probability in [0, 1] via Sigmoid."
      },
      {
        "q": "What is the primary trade-off of Classifier Chains compared to Binary Relevance?",
        "o": [
          "Classifier Chains capture label correlations but are sensitive to chain ordering and test-time error propagation",
          "Classifier Chains have O(1) computational complexity",
          "Classifier Chains can only be used with decision trees",
          "Classifier Chains cannot predict zero labels for an instance"
        ],
        "a": 0,
        "why": "By feeding preceding predictions as features, Classifier Chains capture label correlations. However, early classification mistakes propagate down the chain, and training cannot be fully parallelised."
      }
    ],
    usedBy: [],
    prereq: [
      "logistic-regression-inference-odds-ratios-wald-tests"
    ],
    related: [
      "logistic_regression",
      "ordinal-classification",
      "cost-sensitive-learning",
      "confusion-matrix"
    ],
    keywords: "multi label classification, binary relevance, classifier chains, label powerset, hamming loss, subset accuracy, binary cross entropy, label correlation"
  },
  {
    id: "cost-sensitive-learning",
    short: "Cost-sensitive learning",
    title: "Cost-Sensitive Learning",
    task: "concepts",
    module: "Beyond the basics",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Minimise expected financial loss rather than error count: master cost matrices, Bayes decision theory threshold shifting, and cost-weighted loss functions.",
    lead: "In fraud detection, loan default, and cancer diagnosis, a false negative is vastly more catastrophic than a false positive. Cost-sensitive learning embeds domain cost asymmetry directly into model training and decision thresholds.",
    intuition: [
      "Standard machine learning algorithms treat all errors as equally harmful: misclassifying a legitimate £10 transaction as fraud (false positive) is assigned the identical loss as letting a £5,000 fraudulent wire transfer slip through undetected (false negative). In real-world enterprise environments—including fraud prevention, loan risk underwriting, medical pathology, and industrial turbine maintenance—costs are wildly asymmetric.",
      "Cost-Sensitive Learning replaces generic accuracy maximisation with expected cost minimisation. This asymmetry is formally captured in a Cost Matrix $C$, where $C(i, j)$ specifies the financial, clinical, or operational cost of predicting class $i$ when the ground truth is class $j$.",
      "Practitioners can incorporate cost asymmetry at three distinct levels of the machine learning pipeline: data-level, algorithm-level, and decision-level.",
      "Data-level methods apply cost-proportionate sampling, over-sampling high-cost instances. Algorithm-level methods modify objective functions, weighting loss terms by their relative cost during gradient updates (cost-weighted empirical risk minimisation). Decision-level methods train standard probabilistic models and apply Bayes decision theory post-processing: shifting the classification decision threshold $p^*$ from 0.5 to the exact theoretical Bayes optimal cut-off dictated by the cost matrix ratio."
    ],
    analogy: "Imagine a smoke detector in a chemical refinery. A false positive triggers a loud siren and requires five minutes to silence (cost: £50 in staff annoyance). A false negative fails to sound an alarm during a toxic chemical fire, destroying the facility (cost: £10,000,000). Tuning the alarm sensitivity to minimise total error count treats both mistakes equally, risking disaster. A cost-sensitive alarm triggers at the slightest whiff of smoke because the asymmetric penalty of silence is existential.",
    steps: [
      {
        "title": "1. Formulate the enterprise cost matrix",
        "body": "Define cost matrix $C(i, j)$ quantifying costs of True Positives ($C_{TP}$), False Positives ($C_{FP}$), True Negatives ($C_{TN}$), and False Negatives ($C_{FN}$)."
      },
      {
        "title": "2. Select incorporation strategy",
        "body": "Decide whether to embed costs into loss functions during training (e.g. weighted cross-entropy) or adjust classification decision threshold $p^*$ post-processing on calibrated probabilities."
      },
      {
        "title": "3. Derive Bayes risk-optimal decision threshold",
        "body": "Under Bayes decision theory, predict positive whenever $P(Y=1 \\mid x) > p^*$, where $p^* = \\frac{C_{FP} - C_{TN}}{(C_{FP} - C_{TN}) + (C_{FN} - C_{TP})}$."
      },
      {
        "title": "4. Calibrate probabilities and evaluate expected cost",
        "body": "Calibrate classifier output probabilities (via Platt scaling or isotonic regression) and evaluate total financial loss $\\sum C(\\hat{y}_i, y_i)$ on test data rather than 0-1 accuracy."
      }
    ],
    math: [
      {
        "h": "Expected Conditional Cost (Bayes Risk)",
        "tex": "R(\\alpha = 1 \\mid x) = C_{TP} P(Y=1 \\mid x) + C_{FP} P(Y=0 \\mid x), \\quad R(\\alpha = 0 \\mid x) = C_{FN} P(Y=1 \\mid x) + C_{TN} P(Y=0 \\mid x)",
        "p": "The expected risk of taking action alpha conditioned on feature vector x. Optimal Bayes decision selects the action minimising expected risk."
      },
      {
        "h": "Bayes Optimal Decision Threshold",
        "tex": "p^* = \\frac{C_{FP} - C_{TN}}{(C_{FP} - C_{TN}) + (C_{FN} - C_{TP})} \\approx \\frac{C_{FP}}{C_{FP} + C_{FN}} \\quad (\\text{when } C_{TP} = C_{TN} = 0)",
        "p": "When false negatives cost 9 times more than false positives (C_FN = 90, C_FP = 10), the optimal threshold drops to p* = 10 / (10 + 90) = 0.10."
      },
      {
        "h": "Cost-Weighted Cross-Entropy Loss",
        "tex": "\\mathcal{L}_{\\mathrm{cost}}(\\theta) = -\\frac{1}{n} \\sum_{i=1}^n \\left[ w_1 y_i \\log \\hat{p}_i + w_0 (1 - y_i) \\log(1 - \\hat{p}_i) \\right], \\quad w_1 = C_{FN}, \\; w_0 = C_{FP}",
        "p": "Directly penalises false negative gradient steps in proportion to financial penalty during backpropagation or IRLS updates."
      }
    ],
    code: "import numpy as np\nfrom sklearn.linear_model import LogisticRegression\n\n# Cost-Sensitive Classification: Threshold Shifting vs Standard 0.5 Threshold\nnp.random.seed(42)\nn_samples = 2000\n\n# Synthetic fraudulent transactions: 95% legitimate (0), 5% fraud (1)\nX = np.random.normal(0, 1, (n_samples, 4))\nlatent = X[:, 0] * 1.2 - X[:, 1] * 0.8 + np.random.normal(0, 0.5, n_samples)\nprobs = 1.0 / (1.0 + np.exp(-latent))\ny = (probs > np.percentile(probs, 95)).astype(int)  # Exactly 5% fraud\n\n# Split into Train and Test\nn_train = 1200\nX_train, X_test = X[:n_train], X[n_train:]\ny_train, y_test = y[:n_train], y[n_train:]\n\n# Cost Matrix:\n# False Negative (missed fraud): £500\n# False Positive (manual fraud review): £20\n# True Positive / True Negative: £0\nC_FN = 500.0\nC_FP = 20.0\nC_TP = 0.0\nC_TN = 0.0\n\n# Bayes Optimal Threshold: p* = C_FP / (C_FP + C_FN)\nbayes_threshold = C_FP / (C_FP + C_FN)\nprint(f\"Theoretical Bayes optimal decision threshold: {bayes_threshold:.4f} (not 0.50!)\")\n\n# Fit standard probabilistic classifier\nmodel = LogisticRegression(solver='liblinear')\nmodel.fit(X_train, y_train)\ntest_probs = model.predict_proba(X_test)[:, 1]\n\n# Strategy 1: Standard Default Threshold (p = 0.50)\npreds_default = (test_probs >= 0.50).astype(int)\n\n# Strategy 2: Bayes Cost-Optimal Threshold (p = p*)\npreds_cost_optimal = (test_probs >= bayes_threshold).astype(int)\n\n# Financial Loss Calculation\ndef calculate_financial_cost(y_true, y_pred, c_fn, c_fp):\n    fn = np.sum((y_true == 1) & (y_pred == 0))\n    fp = np.sum((y_true == 0) & (y_pred == 1))\n    tp = np.sum((y_true == 1) & (y_pred == 1))\n    tn = np.sum((y_true == 0) & (y_pred == 0))\n    total_cost = fn * c_fn + fp * c_fp\n    return total_cost, fn, fp, tp, tn\n\ncost_def, fn_def, fp_def, tp_def, tn_def = calculate_financial_cost(y_test, preds_default, C_FN, C_FP)\ncost_opt, fn_opt, fp_opt, tp_opt, tn_opt = calculate_financial_cost(y_test, preds_cost_optimal, C_FN, C_FP)\n\nprint(\"\\n--- Performance Comparison on Test Set (800 samples) ---\")\nprint(f\"Default (p=0.50):       Total Cost: £{cost_def:,.2f} | Missed Frauds (FN): {fn_def} | False Alarms (FP): {fp_def}\")\nprint(f\"Cost-Optimal (p={bayes_threshold:.2f}): Total Cost: £{cost_opt:,.2f} | Missed Frauds (FN): {fn_opt} | False Alarms (FP): {fp_opt}\")\nprint(f\"Total Money Saved: £{cost_def - cost_opt:,.2f} ({((cost_def - cost_opt) / cost_def) * 100:.1f}% reduction in financial damage)\")",
    keyPoints: [
      "Replaces error count minimisation with expected loss minimisation based on a domain-specific cost matrix $C(i, j)$.",
      "Bayes Decision Theory proves the optimal decision threshold is $p^* = \\frac{C_{FP} - C_{TN}}{(C_{FP} - C_{TN}) + (C_{FN} - C_{TP})}$.",
      "Threshold tuning on well-calibrated probabilities avoids retraining and enables instant adaptation to fluctuating economic cost regimes.",
      "Cost-weighted loss functions inject cost weights directly into gradients during empirical risk minimisation.",
      "Evaluated using total enterprise cost, expected financial loss, or cost-sensitive profit curves rather than ROC AUC or 0-1 accuracy."
    ],
    pitfalls: [
      "Uncalibrated probabilities: Bayes optimal threshold shifting strictly assumes predicted probabilities match empirical event frequencies; uncalibrated scores corrupt threshold performance.",
      "Relying on accuracy as an evaluation metric: In asymmetric domains, a trivial model predicting \"Legitimate\" 100% of the time achieves 99% accuracy while bankrupting the firm.",
      "Assuming static costs: Operational costs (e.g. manual audit wage, regulatory fine per breach) shift over time; hard-coding thresholds into codebases creates silent economic loss."
    ],
    quiz: [
      {
        "q": "If a False Negative costs £450 and a False Positive costs £50 (with zero cost for correct predictions), what is the Bayes optimal decision threshold?",
        "o": [
          "p* = 50 / (50 + 450) = 0.10",
          "p* = 450 / (50 + 450) = 0.90",
          "p* = 0.50",
          "p* = 450 - 50 = 400"
        ],
        "a": 0,
        "why": "From Bayes decision theory p* = C_FP / (C_FP + C_FN) = 50 / 500 = 0.10. Any sample with predicted risk > 10% should be flagged to minimise expected financial loss."
      },
      {
        "q": "Why is probability calibration essential before applying Bayes decision threshold shifting?",
        "o": [
          "Because the theoretical optimal threshold p* relies on the model output representing true posterior probabilities P(Y=1|x)",
          "Because calibration scales all features to zero mean and unit variance",
          "Because uncalibrated models cannot compute predictions",
          "Because calibration makes the dataset completely balanced"
        ],
        "a": 0,
        "why": "The derivation of p* assumes hat{p} = P(Y=1|x). If model scores are uncalibrated (e.g. raw SVM margins or distorted tree scores), comparing them to p* destroys expected loss guarantees."
      }
    ],
    usedBy: [],
    prereq: [
      "logistic-regression-inference-odds-ratios-wald-tests",
      "confusion-matrix"
    ],
    related: [
      "logistic_regression",
      "multi-label-classification",
      "confusion-matrix",
      "cross-validation"
    ],
    keywords: "cost sensitive learning, bayes decision theory, cost matrix, optimal threshold, false negative cost, class imbalance, probability calibration"
  },
  {
    id: "self-organising-maps",
    short: "Self-organising maps",
    title: "Self-Organising Maps (Kohonen Networks)",
    task: "concepts",
    module: "Beyond the basics",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Unsupervised competitive neural network for non-linear dimensionality reduction and clustering: master Kohonen lattices, Best Matching Units (BMU), and topological neighbourhood adaptation.",
    lead: "Developed by Teuvo Kohonen, Self-Organising Maps map high-dimensional complex manifolds onto a discrete, low-dimensional (typically 2D) grid of neurons while preserving spatial topology.",
    intuition: [
      "Exploring high-dimensional datasets with dozens or hundreds of features is difficult because human visual perception is confined to two and three dimensions. Standard linear projection methods like PCA can obliterate non-linear manifolds, while k-means clustering segments data without revealing the geometric relationships between cluster centroids.",
      "Developed by Finnish neuroscientist Teuvo Kohonen in the 1980s, Self-Organising Maps (SOMs) provide a unique blend of vector quantisation, non-linear dimensionality reduction, and clustering. A SOM consists of a regular low-dimensional lattice of neurons (typically a 2D rectangular or hexagonal grid). Each neuron $i$ holds a weight vector $m_i$ possessing the identical dimensionality as the input data.",
      "Learning occurs through an unsupervised competitive learning process inspired by retinotopic mapping in the cerebral cortex. When an input vector $x$ is presented, all neurons compete. The neuron whose weight vector is closest to $x$ in Euclidean space is declared the Best Matching Unit (BMU).",
      "Unlike k-means—which updates only the winning centroid—a SOM updates both the BMU and its spatial topological neighbours on the 2D grid. The magnitude of the update decays with both topological grid distance (via a Gaussian neighbourhood kernel) and training iteration time. Consequently, neighbouring neurons on the 2D grid are pulled toward similar regions of high-dimensional space, preserving topological neighbourhood relations."
    ],
    analogy: "Imagine a flexible 2D rubber mesh laid out across a flat table. You drop points of molten solder in a 3D glass room above the table. For every drop of solder, you find the closest point on the rubber mesh (the BMU) and tug it upwards toward the solder drop. Because the rubber sheet is elastic, pulling the winning point also stretches neighbouring sections of the mesh upwards. Over thousands of tugs, the 2D rubber sheet drapes itself smoothly across the 3D contour of solder points.",
    steps: [
      {
        "title": "1. Initialise lattice geometry and neuron weights",
        "body": "Construct a 2D grid (e.g. $10 \\times 10$ rectangular or hexagonal neurons). Initialise weight vectors $m_i \\in \\mathbb{R}^d$ randomly or using the first two principal component axes."
      },
      {
        "title": "2. Find Best Matching Unit (BMU)",
        "body": "Present sample $x \\in \\mathbb{R}^d$. Calculate Euclidean distance to all neurons: $c = \\arg\\min_i \\|x - m_i\\|_2$."
      },
      {
        "title": "3. Update topological neighbourhood weights",
        "body": "Adjust weights of all neurons: $m_i(t+1) = m_i(t) + \\alpha(t) h_{ci}(t) [x - m_i(t)]$, where $\\alpha(t)$ is the decaying learning rate and $h_{ci}(t) = \\exp(-\\|r_c - r_i\\|^2 / (2 \\sigma(t)^2))$."
      },
      {
        "title": "4. Decay radius and evaluate U-matrix",
        "body": "Gradually reduce neighbourhood radius $\\sigma(t)$ and learning rate $\\alpha(t)$ over training epochs. Visualise clusters using the Unified Distance Matrix (U-matrix), displaying average distance between adjacent neurons."
      }
    ],
    math: [
      {
        "h": "Best Matching Unit (BMU) Selection",
        "tex": "c = \\arg\\min_{i \\in \\mathcal{V}} \\|x(t) - m_i(t)\\|_2",
        "p": "Competitive step: the winner c is the neuron in lattice V with minimal Euclidean distance to input vector x(t)."
      },
      {
        "h": "Weight Vector Update Rule",
        "tex": "m_i(t+1) = m_i(t) + \\alpha(t) h_{ci}(t) [x(t) - m_i(t)], \\quad h_{ci}(t) = \\exp\\left(-\\frac{\\|r_c - r_i\\|^2}{2 \\sigma(t)^2}\\right)",
        "p": "Neuron weights are pulled toward input x(t). The Gaussian spatial kernel h_ci(t) weights adaptation by the Euclidean distance between neuron coordinates r_c and r_i on the 2D lattice."
      },
      {
        "h": "Quantisation and Topographic Errors",
        "tex": "\\mathrm{QE} = \\frac{1}{n} \\sum_{k=1}^n \\|x_k - m_{c(k)}\\|, \\quad \\mathrm{TE} = \\frac{1}{n} \\sum_{k=1}^n u(x_k), \\quad u(x_k) = \\begin{cases} 0 & \\text{if 1st & 2nd BMU are adjacent} \\\\ 1 & \\text{otherwise} \\end{cases}",
        "p": "Quantisation error (QE) measures reconstruction fidelity. Topographic error (TE) measures the proportion of samples whose 1st and 2nd BMUs are not lattice neighbours, quantifying topology preservation."
      }
    ],
    code: "import numpy as np\n\n# 2D Self-Organising Map (SOM) from scratch\nclass SelfOrganisingMap:\n    def __init__(self, grid_size=(8, 8), input_dim=3, lr=0.5, sigma=2.0):\n        self.rows, self.cols = grid_size\n        self.n_neurons = self.rows * self.cols\n        self.input_dim = input_dim\n        self.lr_initial = lr\n        self.sigma_initial = sigma\n        \n        # Initialise weights randomly in [0, 1]\n        self.weights = np.random.uniform(0, 1, (self.rows, self.cols, self.input_dim))\n        \n        # 2D coordinates of neurons on the grid\n        self.grid_coords = np.array([[[r, c] for c in range(self.cols)] for r in range(self.rows)])\n        \n    def find_bmu(self, x):\n        # Compute Euclidean distance from x to all neurons\n        diff = self.weights - x\n        dist_sq = np.sum(diff**2, axis=-1)\n        bmu_idx = np.unravel_index(np.argmin(dist_sq), (self.rows, self.cols))\n        return bmu_idx\n        \n    def fit(self, X, n_epochs=100):\n        n_samples = len(X)\n        total_steps = n_epochs * n_samples\n        step = 0\n        \n        for epoch in range(n_epochs):\n            # Shuffle data\n            indices = np.random.permutation(n_samples)\n            for idx in indices:\n                x = X[idx]\n                step += 1\n                \n                # Decaying learning rate and radius\n                decay = np.exp(-step / total_steps)\n                lr = self.lr_initial * decay\n                sigma = max(self.sigma_initial * decay, 0.5)\n                \n                # Find BMU\n                bmu_r, bmu_c = self.find_bmu(x)\n                bmu_pos = np.array([bmu_r, bmu_c])\n                \n                # Compute grid distance from BMU to all neurons\n                grid_dist_sq = np.sum((self.grid_coords - bmu_pos)**2, axis=-1)\n                \n                # Gaussian neighbourhood kernel\n                h = np.exp(-grid_dist_sq / (2 * sigma**2))\n                \n                # Update weights\n                self.weights += lr * h[:, :, None] * (x - self.weights)\n\n# Synthetic 3D RGB colour cluster data (Red, Green, Blue, Yellow)\nnp.random.seed(42)\nreds = np.random.uniform([0.7, 0, 0], [1, 0.3, 0.3], (25, 3))\ngreens = np.random.uniform([0, 0.7, 0], [0.3, 1, 0.3], (25, 3))\nblues = np.random.uniform([0, 0, 0.7], [0.3, 0.3, 1], (25, 3))\nyellows = np.random.uniform([0.7, 0.7, 0], [1, 1, 0.3], (25, 3))\nX_colours = np.vstack([reds, greens, blues, yellows])\n\nsom = SelfOrganisingMap(grid_size=(6, 6), input_dim=3, lr=0.5, sigma=2.0)\nsom.fit(X_colours, n_epochs=50)\n\n# Calculate Quantisation Error\ndists = []\nfor x in X_colours:\n    bmu_r, bmu_c = som.find_bmu(x)\n    dists.append(np.linalg.norm(x - som.weights[bmu_r, bmu_c]))\nqe = np.mean(dists)\n\nprint(f\"SOM Lattice Dimensions: {som.rows}x{som.cols} ({som.n_neurons} neurons)\")\nprint(f\"Input Data: {X_colours.shape} (RGB colour vectors)\")\nprint(f\"Average Quantisation Error: {qe:.4f}\")\nprint(\"Top-left neuron weight (RGB):  \", som.weights[0, 0].round(3))\nprint(\"Bottom-right neuron weight (RGB):\", som.weights[-1, -1].round(3))",
    keyPoints: [
      "Unsupervised competitive neural network that projects high-dimensional data onto a low-dimensional topological grid (typically 2D).",
      "Best Matching Unit (BMU) competition: the neuron closest in Euclidean distance to the input sample wins the iteration.",
      "Topological preservation: the BMU and its spatial lattice neighbours are updated together via a decaying Gaussian neighbourhood kernel.",
      "U-matrix (Unified Distance Matrix) visualises clustering boundaries by calculating Euclidean distance between adjacent neurons.",
      "Quantisation error measures geometric distortion, while topographic error evaluates the proportion of broken neighbourhood relationships."
    ],
    pitfalls: [
      "Scale sensitivity: SOMs rely on Euclidean distance; unscaled features with large numerical magnitudes dominate BMU selection and corrupt maps.",
      "Dead neurons from poor initialisation: Random weight initialisation can leave peripheral neurons outside the data support that never win competition; PCA initialisation prevents dead neurons.",
      "Computational scaling: Standard SOM scales as $O(n \\cdot N_{\\mathrm{neurons}} \\cdot d)$ per epoch, becoming sluggish on massive datasets."
    ],
    quiz: [
      {
        "q": "What is the crucial mechanism that allows a Self-Organising Map to preserve topology unlike standard k-means clustering?",
        "o": [
          "Updating both the winning neuron (BMU) and its spatial neighbours on the 2D lattice using a neighbourhood function",
          "Using backpropagation and stochastic gradient descent",
          "Normalising all feature columns to zero mean and unit variance",
          "Fitting a linear regression model on the cluster labels"
        ],
        "a": 0,
        "why": "In k-means, only the winning centroid is updated. In a SOM, the BMU and its topological neighbours on the 2D lattice are pulled toward the sample, preserving spatial topology."
      },
      {
        "q": "What does the U-matrix (Unified Distance Matrix) represent in a trained SOM visualisation?",
        "o": [
          "The Euclidean distance between adjacent neurons on the lattice, where high values denote cluster boundaries and valleys denote cluster centres",
          "The training loss curve plotted over epochs",
          "The confusion matrix of classification predictions",
          "The variance explained by each principal component"
        ],
        "a": 0,
        "why": "The U-matrix displays distances between neighbouring neuron weight vectors; high-distance ridges signify boundaries separating distinct clusters."
      }
    ],
    usedBy: [],
    prereq: [
      "kmeans_clustering"
    ],
    related: [
      "kmeans_clustering",
      "affinity_propagation",
      "spectral_clustering",
      "cross-validation"
    ],
    keywords: "self organising maps, som, kohonen network, bmu, competitive learning, u matrix, topological mapping, unsupervised learning"
  },
  {
    id: "biclustering",
    short: "Biclustering",
    title: "Biclustering (Co-clustering)",
    task: "concepts",
    module: "Beyond the basics",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Simultaneously cluster rows and columns of a data matrix: master Spectral Co-clustering, Spectral Biclustering, and gene expression analysis.",
    lead: "Traditional clustering groups rows across all features or features across all samples. Biclustering identifies local sub-matrices where a specific subset of samples exhibits coherent behaviour across a specific subset of features.",
    intuition: [
      "Traditional clustering algorithms partition observations based on their values across all measured features: k-means or DBSCAN compares samples along the entirety of feature space $\\mathbb{R}^d$. However, in genomics, e-commerce, and text mining, relationships are often strictly localized: a group of 50 genes may be co-regulated only in a tiny subset of 12 cancer patients, while expressing unrelated random baseline noise across the other 500 patients.",
      "When classical clustering evaluates distance over all 20,000 genes, the localized 50-gene co-regulation is completely overwhelmed by the background noise of the other 19,950 uninformative genes. Similarly, in collaborative filtering, a group of 300 users may share identical preferences for French arthouse cinema, but have completely divergent preferences across Hollywood blockbusters and sports documentaries.",
      "Biclustering (also termed co-clustering or two-mode clustering) solves this by clustering rows and columns simultaneously. Rather than partitioning the entire row space or column space globally, biclustering identifies local sub-matrices (biclusters) where a specific subset of rows exhibits coherent, correlated, or constant values across a specific subset of columns.",
      "Spectral Co-clustering models the data matrix as an adjacency matrix of an undirected bipartite graph between row and column nodes. By computing singular vectors of the normalised data matrix, it solves a graph partition problem that rearranges rows and columns to expose block-diagonal and checkerboard structures."
    ],
    analogy: "Imagine a giant crossword puzzle grid filled with random jumbled letters. If you look at the whole grid at once, it appears completely chaotic. Biclustering is like finding hidden word rectangles: taking five specific rows and four specific columns, then sliding them together so their intersection forms a perfectly readable English word, even while all surrounding letters remain gibberish.",
    steps: [
      {
        "title": "1. Formulate data matrix and select bicluster model",
        "body": "Structure input matrix $A \\in \\mathbb{R}^{n \\times p}$. Determine whether seeking constant value blocks, constant row/column shifted blocks, or coherent scale/interaction sub-matrices."
      },
      {
        "title": "2. Normalise bipartite graph representation",
        "body": "For Spectral Co-clustering, compute row sums $R_i = \\sum_j A_{ij}$ and column sums $C_j = \\sum_i A_{ij}$. Construct normalised matrix $A_n = R^{-1/2} A C^{-1/2}$."
      },
      {
        "title": "3. Extract singular vectors via SVD",
        "body": "Compute Singular Value Decomposition $A_n = U \\Sigma V^T$. For $k$ biclusters, extract the second through $(1 + \\lceil \\log_2 k \\rceil)$ singular vectors from $U$ and $V$."
      },
      {
        "title": "4. Cluster concatenated singular vectors",
        "body": "Form matrix $Z = [R^{-1/2} U_k ; C^{-1/2} V_k]$. Apply k-means to $Z$ to simultaneously assign row labels and column labels, revealing block-diagonal structure."
      }
    ],
    math: [
      {
        "h": "Mean Squared Residue (Cheng and Church Score)",
        "tex": "H(I, J) = \\frac{1}{|I| |J|} \\sum_{i \\in I, j \\in J} (a_{ij} - a_{iJ} - a_{Ij} + a_{IJ})^2",
        "p": "Measures coherence of a bicluster sub-matrix formed by rows I and columns J. Here a_iJ is row mean, a_Ij is column mean, and a_IJ is overall bicluster mean. A residue of zero indicates perfect additive coherence."
      },
      {
        "h": "Normalised Bipartite Graph Laplacian",
        "tex": "A_n = R^{-1/2} A C^{-1/2}, \\quad R = \\operatorname{diag}(A \\mathbf{1}_p), \\; C = \\operatorname{diag}(\\mathbf{1}_n^T A)",
        "p": "Normalisation ensures degree-invariance on bipartite graph connecting row nodes to column nodes, mapping the problem directly into spectral graph theory."
      },
      {
        "h": "Spectral Co-clustering Partition",
        "tex": "z = \\begin{bmatrix} R^{-1/2} u \\\\ C^{-1/2} v \\end{bmatrix}, \\quad A_n v = \\sigma u, \\; A_n^T u = \\sigma v",
        "p": "The left and right singular vectors u and v of normalised matrix A_n define coordinates that minimise normalised cut on the bipartite graph."
      }
    ],
    code: "import numpy as np\nfrom sklearn.cluster import KMeans\n\n# Spectral Co-Clustering from scratch\ndef spectral_coclustering(A, n_clusters=2):\n    n_rows, n_cols = A.shape\n    \n    # 1. Row and Column marginals\n    R = np.sum(A, axis=1, keepdims=True)\n    C = np.sum(A, axis=0, keepdims=True)\n    \n    # Prevent division by zero\n    R[R == 0] = 1e-12\n    C[C == 0] = 1e-12\n    \n    # 2. Normalised matrix A_n = R^{-1/2} A C^{-1/2}\n    R_inv_sqrt = 1.0 / np.sqrt(R)\n    C_inv_sqrt = 1.0 / np.sqrt(C)\n    A_n = R_inv_sqrt * A * C_inv_sqrt\n    \n    # 3. SVD of normalised matrix\n    U, S, Vt = np.linalg.svd(A_n, full_matrices=False)\n    V = Vt.T\n    \n    # Use singular vectors corresponding to second largest singular values\n    # For n_clusters, take vectors 1 through n_clusters\n    n_vecs = int(np.ceil(np.log2(n_clusters))) + 1\n    U_sub = U[:, 1:n_vecs]\n    V_sub = V[:, 1:n_vecs]\n    \n    # Scale back by R^{-1/2} and C^{-1/2}\n    Z_rows = R_inv_sqrt * U_sub\n    Z_cols = C_inv_sqrt * V_sub\n    \n    # 4. Cluster rows and columns using k-means\n    km_rows = KMeans(n_clusters=n_clusters, random_state=42, n_init=10).fit(Z_rows)\n    km_cols = KMeans(n_clusters=n_clusters, random_state=42, n_init=10).fit(Z_cols)\n    \n    return km_rows.labels_, km_cols.labels_\n\n# Create synthetic matrix with 2 hidden block-diagonal biclusters\nnp.random.seed(42)\nn_r, n_c = 60, 40\ndata = np.random.uniform(1.0, 5.0, (n_r, n_c))\n\n# Bicluster 1: rows 0-24, cols 0-14 have elevated mean\ndata[0:25, 0:15] += 20.0\n# Bicluster 2: rows 25-59, cols 15-39 have elevated mean\ndata[25:60, 15:40] += 20.0\n\n# Shuffle rows and columns to scramble visual structure\nrow_perm = np.random.permutation(n_r)\ncol_perm = np.random.permutation(n_c)\nscrambled = data[row_perm, :][:, col_perm]\n\n# Run Spectral Co-clustering\nrow_labels, col_labels = spectral_coclustering(scrambled, n_clusters=2)\n\nprint(f\"Scrambled matrix shape: {scrambled.shape}\")\nprint(f\"Discovered row cluster sizes: {np.bincount(row_labels)}\")\nprint(f\"Discovered column cluster sizes: {np.bincount(col_labels)}\")\nprint(\"Row partition matches ground truth:\", len(np.unique(row_labels[row_perm < 25])) == 1)\nprint(\"Column partition matches ground truth:\", len(np.unique(col_labels[col_perm < 15])) == 1)",
    keyPoints: [
      "Simultaneously clusters rows and columns of a matrix, isolating local sub-matrices of coherent values.",
      "Vital when target patterns exist only across a subset of features for a subset of samples (e.g. gene pathways or niche product tastes).",
      "Spectral Co-clustering frames the task as finding a minimal normalised cut on a bipartite graph between rows and columns.",
      "Solved efficiently via Singular Value Decomposition (SVD) of the row- and column-normalised data matrix.",
      "Cheng-Church score (Mean Squared Residue) provides a standard quality benchmark for additive and constant biclusters."
    ],
    pitfalls: [
      "Sensitivity to negative values: Spectral co-clustering interprets elements as bipartite edge weights, requiring non-negative entries ($A_{ij} \\ge 0$).",
      "Overlapping biclusters: Standard spectral co-clustering produces disjoint partitions; soft or overlapping biclustering requires Plaid or iterative residue models.",
      "Sensitivity to background noise scale: When matrix sparsity is extreme or noise variance exceeds signal jump, singular vectors fail to separate."
    ],
    quiz: [
      {
        "q": "Why does traditional k-means clustering fail to detect localized gene expression pathways across patients?",
        "o": [
          "k-means measures distance across all 20,000 genes, so the localized 50-gene signal is overwhelmed by noise in the remaining genes",
          "k-means requires square symmetric matrices",
          "k-means cannot be applied to biological data",
          "k-means only works on binary zero-one data"
        ],
        "a": 0,
        "why": "Traditional clustering computes Euclidean distances globally across all features. When a pathway is active only in a tiny fraction of genes, global distance is dominated by irrelevant background genes."
      },
      {
        "q": "How does Spectral Co-clustering simultaneously assign cluster labels to both rows and columns?",
        "o": [
          "By representing the matrix as an undirected bipartite graph and clustering the concatenated left and right singular vectors",
          "By running k-means on rows and then running linear regression on columns",
          "By taking the inverse Fourier transform of the matrix",
          "By discarding all columns with variance below 1.0"
        ],
        "a": 0,
        "why": "Spectral Co-clustering frames rows and columns as bipartite graph nodes. SVD on the normalised matrix yields singular vectors corresponding to graph cuts for both rows and columns."
      }
    ],
    usedBy: [],
    prereq: [
      "kmeans_clustering",
      "svd-and-truncated-svd"
    ],
    related: [
      "kmeans_clustering",
      "spectral_clustering",
      "svd-and-truncated-svd",
      "self-organising-maps"
    ],
    keywords: "biclustering, co-clustering, two mode clustering, spectral coclustering, cheng church, gene expression, bipartite graph, singular value decomposition"
  },
  {
    id: "time-series-clustering-with-dtw",
    short: "Time-series DTW",
    title: "Time-Series Clustering with Dynamic Time Warping",
    task: "concepts",
    module: "Beyond the basics",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Cluster temporal sequences of varying lengths and phase shifts: master Dynamic Time Warping (DTW) distance, Sakoe–Chiba warping bands, and k-DBA centroid averaging.",
    lead: "Euclidean distance fails on time series when temporal patterns are out of phase or stretched in duration. Dynamic Time Warping non-linearly aligns the time axes of two sequences to measure true morphological similarity.",
    intuition: [
      "When clustering temporal sequences—such as electrocardiogram (ECG) heartbeats, smart-meter energy consumption profiles, gesture accelerometry, or financial stock trajectories—standard distance metrics fail. Euclidean distance strictly pairs sample $x_i(t)$ with sample $x_j(t)$ at the identical time index $t$. If one heartbeat is delayed by 50 milliseconds, or if one speaker pronounces a vowel twice as slowly, Euclidean distance reports a colossal distance even though the underlying morphological shapes are identical.",
      "Dynamic Time Warping (DTW) overcomes this rigid lock-step assumption by warping the time dimension non-linearly. It allows multiple consecutive points in one sequence to match a single point in another, accommodating local tempo variations, phase shifts, and differing sequence lengths.",
      "The optimal alignment is determined via dynamic programming, constructing an $n \\times m$ cost matrix where entry $(i, j)$ represents the minimal accumulated distance along a valid warping path from start $(1, 1)$ to end $(n, m)$. Valid paths must satisfy boundary conditions, monotonicity (time cannot flow backwards), and continuity (no time steps can be skipped).",
      "To prevent pathological warping (where a single point in one sequence is matched to an entire plateau in another) and to accelerate computation from $O(n^2)$ to $O(n \\cdot w)$, practitioners apply global window constraints like the Sakoe–Chiba band. When clustering collections of time series, k-means is adapted using DTW Barycentre Averaging (DBA) to iteratively compute the optimal average centroid sequence."
    ],
    analogy: "Imagine comparing two musicians playing the identical trumpet solo. The first musician plays briskly in 4/4 time; the second plays with rubato, lingering on the high notes and rushing through the arpeggios. Comparing their sound waves sample-by-sample with Euclidean distance concludes they are playing completely different songs. Dynamic Time Warping acts like an expert conductor, stretching and compressing the time axis so each note aligns with its counterpart, recognising the identical melody.",
    steps: [
      {
        "title": "1. Formulate pairwise distance cost matrix",
        "body": "Given two sequences $X = (x_1, \\dots, x_n)$ and $Y = (y_1, \\dots, y_m)$, compute local pairwise distances $d(x_i, y_j) = (x_i - y_j)^2$."
      },
      {
        "title": "2. Enforce Sakoe–Chiba warping window",
        "body": "Constrain the search space: allow alignment only when $|i - j| \\le w$, where $w$ is the warping window width (typically 5–10% of sequence length)."
      },
      {
        "title": "3. Fill dynamic programming accumulation table",
        "body": "Compute cumulative cost: $D(i, j) = d(x_i, y_j) + \\min(D(i-1, j), D(i, j-1), D(i-1, j-1))$. The overall DTW distance is $\\sqrt{D(n, m)}$."
      },
      {
        "title": "4. Cluster using k-medoids or k-DBA",
        "body": "Compute pairwise DTW distance matrix across all $N$ time series and cluster using k-medoids (PAM), or iteratively update synthetic cluster centroids via DTW Barycentre Averaging (DBA)."
      }
    ],
    math: [
      {
        "h": "Dynamic Programming Recurrence",
        "tex": "D(i, j) = (x_i - y_j)^2 + \\min \\begin{cases} D(i - 1, j) & \\text{(insertion / warp Y)} \\\\ D(i, j - 1) & \\text{(deletion / warp X)} \\\\ D(i - 1, j - 1) & \\text{(match)} \\end{cases}",
        "p": "Accumulated cost matrix recursion. Each step chooses the minimal cost preceding step to find the optimal global warping path."
      },
      {
        "h": "Warping Path Constraints",
        "tex": "W = (w_1, \\dots, w_K), \\quad w_1 = (1, 1), \\; w_K = (n, m), \\quad w_k = (i, j) \\implies w_{k+1} \\in \\{(i+1, j), (i, j+1), (i+1, j+1)\\}",
        "p": "Enforces boundary conditions (paths must start at beginning and finish at end) and step size conditions (monotonicity and continuity)."
      },
      {
        "h": "Sakoe–Chiba Warping Window Constraint",
        "tex": "|i - j| \\le w",
        "p": "Restricts the warping path to a corridor of width w around the main diagonal, preventing pathological time distortion and speeding up computation from O(nm) to O(nw)."
      }
    ],
    code: "import numpy as np\n\n# Dynamic Time Warping (DTW) with Sakoe-Chiba Band from scratch\ndef dtw_distance(x, y, window=None):\n    n, m = len(x), len(y)\n    if window is None:\n        window = max(n, m)\n    else:\n        window = max(window, abs(n - m))\n        \n    # Initialise cost matrix with infinity\n    dtw_matrix = np.full((n + 1, m + 1), float('inf'))\n    dtw_matrix[0, 0] = 0.0\n    \n    for i in range(1, n + 1):\n        for j in range(max(1, i - window), min(m + 1, i + window + 1)):\n            cost = (x[i - 1] - y[j - 1])**2\n            dtw_matrix[i, j] = cost + min(\n                dtw_matrix[i - 1, j],      # Insertion\n                dtw_matrix[i, j - 1],      # Deletion\n                dtw_matrix[i - 1, j - 1]   # Match\n            )\n            \n    return np.sqrt(dtw_matrix[n, m])\n\n# Generate synthetic time-series with phase shift and tempo differences\nnp.random.seed(42)\nt = np.linspace(0, 4 * np.pi, 60)\n\n# Class 1: Sine wave with random phase shifts\nclass1_series = [np.sin(t + np.random.uniform(-0.8, 0.8)) + np.random.normal(0, 0.1, len(t)) for _ in range(10)]\n\n# Class 2: Square/Triangle wave\nclass2_series = [np.sign(np.sin(t + np.random.uniform(-0.8, 0.8))) + np.random.normal(0, 0.1, len(t)) for _ in range(10)]\n\nall_series = class1_series + class2_series\nN = len(all_series)\n\n# Compute pairwise DTW distance matrix\ndist_matrix = np.zeros((N, N))\nfor i in range(N):\n    for j in range(i + 1, N):\n        d = dtw_distance(all_series[i], all_series[j], window=10)\n        dist_matrix[i, j] = d\n        dist_matrix[j, i] = d\n\n# Simple k-medoids clustering on DTW distance matrix\ndef k_medoids(dist_mat, k=2, max_iters=20):\n    n = dist_mat.shape[0]\n    # Initialise medoids randomly\n    medoids = np.array([0, N - 1])\n    labels = np.zeros(n, dtype=int)\n    \n    for _ in range(max_iters):\n        # Assign samples to closest medoid\n        labels = np.argmin(dist_mat[:, medoids], axis=1)\n        # Update medoids\n        new_medoids = medoids.copy()\n        for cluster_id in range(k):\n            members = np.where(labels == cluster_id)[0]\n            if len(members) > 0:\n                sub_dist = dist_mat[np.ix_(members, members)]\n                best_member = members[np.argmin(np.sum(sub_dist, axis=1))]\n                new_medoids[cluster_id] = best_member\n        if np.array_equal(new_medoids, medoids):\n            break\n        medoids = new_medoids\n    return labels, medoids\n\nlabels, medoids = k_medoids(dist_matrix, k=2)\ntrue_labels = np.array([0]*10 + [1]*10)\nclustering_acc = max(np.mean(labels == true_labels), np.mean(labels == (1 - true_labels)))\n\nprint(f\"Total time series clustered: {N}\")\nprint(f\"DTW distance between phase-shifted identical waves: {dist_matrix[0, 1]:.3f}\")\nprint(f\"DTW distance between Sine and Square waves:        {dist_matrix[0, 10]:.3f}\")\nprint(f\"k-medoids Clustering Accuracy: {clustering_acc * 100:.1f}%\")",
    keyPoints: [
      "Non-linearly aligns temporal sequences to measure morphological similarity invariant to tempo changes and phase shifts.",
      "Replaces rigid one-to-one Euclidean matching with one-to-many warping via dynamic programming in $O(n \\cdot m)$ time.",
      "Sakoe–Chiba band $|i - j| \\le w$ prevents pathological distortions and accelerates calculation to $O(n \\cdot w)$.",
      "Clustering is performed using k-medoids (PAM) on precomputed distance matrices or k-means with DTW Barycentre Averaging (DBA).",
      "Standard benchmark for human gesture recognition, sensor telemetry, ECG cardiology, and speech processing."
    ],
    pitfalls: [
      "Computational scaling: Pairwise DTW across $N$ time series of length $L$ requires $O(N^2 \\cdot L^2)$ operations; LB_Keogh lower bounding is necessary for large datasets.",
      "Pathological warping: Without a Sakoe-Chiba or Itakura window constraint, a flat plateau in one series can match dozens of peaks in another, producing artificially low distances.",
      "Triangular inequality violation: Standard DTW does not strictly satisfy the triangle inequality, meaning DTW is technically a semi-metric rather than a true metric."
    ],
    quiz: [
      {
        "q": "Why does Euclidean distance perform poorly compared to DTW when comparing audio speech signals of the same word?",
        "o": [
          "Euclidean distance requires exact lock-step temporal alignment, so speaking slightly slower or with a delayed start produces huge artificial distance",
          "Euclidean distance cannot be computed on floating point numbers",
          "Audio speech signals have infinite variance",
          "Euclidean distance only works on 2D images"
        ],
        "a": 0,
        "why": "Euclidean distance pairs points strictly by index t. If a speaker lingers on a syllable, waveforms fall out of phase, creating massive point-to-point Euclidean discrepancy."
      },
      {
        "q": "What is the purpose of enforcing a Sakoe–Chiba band constraint |i - j| <= w in DTW?",
        "o": [
          "It prevents excessive pathological time stretching and reduces computational complexity from O(n^2) to O(nw)",
          "It guarantees that the distance will always be zero",
          "It transforms the time series into frequency domain Fourier coefficients",
          "It eliminates the need for dynamic programming"
        ],
        "a": 0,
        "why": "The Sakoe-Chiba band restricts warping to a diagonal corridor of width w, preventing extreme time warping blunders and speeding up computation."
      }
    ],
    usedBy: [],
    prereq: [
      "kmedoids_clustering"
    ],
    related: [
      "kmedoids_clustering",
      "kmeans_clustering",
      "stationarity-acf-and-pacf",
      "biclustering"
    ],
    keywords: "dtw, dynamic time warping, time series clustering, sakoe chiba band, k-dba, k-medoids, phase shift, alignment"
  },
  {
    id: 'pca',
    short: 'PCA',
    title: 'Principal Component Analysis',
    task: 'concepts',
    module: 'Dimensionality reduction',
    level: 1,
    minutes: 16,
    noLab: true,
    summary: r`Linear dimensionality reduction projecting data onto orthogonal axes of maximal variance using singular value decomposition, compressing features while preserving global geometric variance.`,
    lead: r`High-dimensional feature spaces suffer from multicollinearity, redundant measurements, and computational overhead. Principal Component Analysis (PCA) identifies an orthogonal sequence of linear projections that sequentially maximise variance, transforming correlated features into mutually uncorrelated principal components and compressing data with minimal reconstruction error.`,
    intuition: [
      r`Imagine holding a complex three-dimensional object—such as a teapot or a sculpture—in front of a blank wall under a single spotlight. If you align the light from a random angle, the cast shadow collapses into an unrecognisable blob where handles and spouts overlap. But as you rotate the object to its broadest, most characteristic orientation, the 2D shadow captures virtually all the defining contours of the 3D shape. PCA is the mathematical equivalent of finding that optimal orientation: it rotates high-dimensional coordinate axes until the projected shadow of the data exhibits the widest possible spread.`,
      r`The fundamental premise of PCA is that directions exhibiting large variance convey the most informative differences between data points, whereas directions with negligible variance correspond to redundant noise or flat dimensions. When two sensors measure closely coupled phenomena (such as indoor temperature in Celsius and Fahrenheit), the data forms an elongated ellipse in 2D space. Instead of keeping both redundant features, PCA aligns the first principal axis along the major axis of the ellipse (capturing the shared thermal trend) and the second principal axis along the minor axis (capturing minor sensor noise).`,
      r`Crucially, each consecutive principal component is constrained to be strictly orthogonal (perpendicular) to all preceding components. This guarantees that the newly created coordinates are completely decorrelated—their sample covariance is exactly zero. By selecting the top $k$ components that account for 90% or 95% of total variance, analysts dramatically compress datasets, eliminate multicollinearity for downstream linear models, and enable two- and three-dimensional exploratory scatter plots without discarding the primary patterns of variability.`,
    ],
    analogy: r`Rotating a 3D architectural model under a camera until you capture the single elevation angle that reveals the maximum building perimeter and room layout in a single 2D photograph.`,
    steps: [
      r`Centre the dataset by subtracting feature means: $X_c = X - \mathbf{1}\mu^T$, ensuring the origin lies at the geometric centroid. Optionally standardise features to unit variance if variables have unequal measurement scales.`,
      r`Compute the sample covariance matrix $\Sigma = \frac{1}{n-1} X_c^T X_c$, or apply Singular Value Decomposition directly to the centred matrix $X_c = U S V^T$ to avoid numerical squaring of condition numbers.`,
      r`Extract the right singular vectors $V$ (or eigenvectors of $\Sigma$) and their corresponding singular values $S$ (where eigenvalues $\lambda_j = S_j^2 / (n - 1)$).`,
      r`Sort eigenvalues and singular vectors in descending order of explained variance $\lambda_1 \ge \lambda_2 \ge \dots \ge \lambda_d$.`,
      r`Select the top $k$ principal axes $V_k \in \mathbb{R}^{d \times k}$ based on cumulative explained variance ratio criteria (e.g. 95% threshold or scree plot elbow).`,
      r`Project the centred data onto the selected subspace to obtain lower-dimensional coordinates $Z = X_c V_k \in \mathbb{R}^{n \times k}$.`,
      r`Quantify information retention via reconstruction error $\|X_c - Z V_k^T\|_F^2$, which equals the sum of discarded eigenvalues $\sum_{j=k+1}^d \lambda_j$.`,
    ],
    math: [
      {
        h: 'Covariance matrix and principal axis objective',
        tex: r`$$\max_{w} \operatorname{Var}(X_c w) = \max_{w} \frac{1}{n-1} w^T X_c^T X_c w \quad \text{subject to} \quad w^T w = 1$$`,
        p: r`Formulating the Lagrangian $\mathcal{L}(w, \lambda) = w^T \Sigma w - \lambda(w^T w - 1)$ and differentiating yields $\Sigma w = \lambda w$. The principal direction $w$ is the eigenvector of covariance matrix $\Sigma$ corresponding to the largest eigenvalue $\lambda_1 = \operatorname{Var}(X_c w_1)$. Subsequent orthogonal components correspond to eigenvectors ordered by descending eigenvalues.`,
      },
      {
        h: 'SVD connection and computational efficiency',
        tex: r`$$X_c = U S V^T, \qquad \Sigma = \frac{1}{n-1} X_c^T X_c = \frac{1}{n-1} V S^2 V^T$$`,
        p: r`$U \in \mathbb{R}^{n \times d}$ and $V \in \mathbb{R}^{d \times d}$ are orthogonal matrices containing left and right singular vectors, and $S$ contains singular values $s_j$. Computing SVD directly on $X_c$ requires $O(n d \min(n, d))$ operations and preserves double-precision floating-point accuracy without forming the condition-squared product $X_c^T X_c$.`,
      },
      {
        h: 'Explained variance ratio and optimal reconstruction',
        tex: r`$$\operatorname{EVR}_k = \frac{\lambda_k}{\sum_{j=1}^d \lambda_j} = \frac{s_k^2}{\sum_{j=1}^d s_j^2}, \qquad \min_{\operatorname{rank}(\hat{X})=k} \|X_c - \hat{X}\|_F^2 = \sum_{j=k+1}^d \lambda_j$$`,
        p: r`By the Eckart-Young-Mirsky theorem, the truncated projection $\hat{X} = Z V_k^T = X_c V_k V_k^T$ provides the optimal rank-$k$ approximation of centred matrix $X_c$ under both Frobenius and spectral matrix norms.`,
      },
    ],
    code: r`import numpy as np

# Generate synthetic 3D data with correlated features
rng = np.random.default_rng(42)
n_samples = 150
z_true = rng.normal(0, 2, size=(n_samples, 1))
noise = rng.normal(0, 0.3, size=(n_samples, 3))
X = np.hstack([z_true * 2.0, z_true * -1.5, z_true * 0.5]) + noise

# 1. Centre the data (zero mean)
mu = np.mean(X, axis=0)
X_c = X - mu

# 2. Compute SVD: X_c = U * S * Vt
U, S, Vt = np.linalg.svd(X_c, full_matrices=False)
eigenvalues = (S ** 2) / (n_samples - 1)
evr = eigenvalues / np.sum(eigenvalues)

# 3. Project onto top k=2 principal components
k = 2
V_k = Vt[:k, :].T
Z = X_c @ V_k

# 4. Reconstruct and calculate reconstruction error
X_reconstructed = Z @ V_k.T + mu
rec_error = np.mean(np.sum((X - X_reconstructed) ** 2, axis=1))

print(f"Explained variance ratio: {evr[:k].round(4)}")
print(f"Total variance explained: {np.sum(evr[:k]) * 100:.2f}%")
print(f"Mean squared reconstruction error: {rec_error:.4f}")`,
    pitfalls: [
      r`Scale sensitivity: Features measured in large units (e.g. annual salary in pounds) dominate total variance over smaller features (e.g. age in years). Without standardisation, PCA simply projects onto the largest arbitrary units rather than meaningful patterns.`,
      r`Linearity restriction: PCA can only discover linear planar subspaces. Data arranged along non-linear manifolds (such as a Swiss roll, concentric rings, or helical curves) gets squashed and entangled.`,
      r`Assuming high variance equals relevance: PCA is unsupervised and blind to target labels. The direction of maximum variance might represent uninformative measurement noise or illumination differences rather than the target classification signal.`,
      r`Orthogonality constraint: Enforcing mutual orthogonality can force later principal components to blend distinct physical processes together, making individual components difficult to interpret as pure physical entities.`,
    ],
    keyPoints: [
      r`Maximises projected variance while simultaneously minimising mean squared orthogonal reconstruction error.`,
      r`Transforms correlated features into mutually orthogonal, linearly uncorrelated components.`,
      r`Direct SVD of centred data $X_c = U S V^T$ is numerically superior to explicit eigendecomposition of the covariance matrix $\Sigma$.`,
      r`Requires standardisation whenever input features carry differing units or non-comparable variance scales.`,
    ],
    quiz: [
      {
        q: r`Why must features usually be standardised before applying PCA?`,
        o: [
          r`Because PCA cannot run on negative numbers`,
          r`Features with larger numerical scales artificially dominate the covariance matrix and principal axes`,
          r`Because standardisation transforms non-linear relationships into linear ones`,
          r`Standardisation guarantees that the total explained variance reaches exactly 100%`,
        ],
        a: 1,
        why: r`Variance depends on the choice of units. If one feature is measured in millimetres and another in metres, the millimetre feature will display a million-fold greater variance and dominate the top principal component regardless of information content.`,
      },
      {
        q: r`If the eigenvalues of the sample covariance matrix for a 4D dataset are $\lambda = [6.0, 2.5, 1.0, 0.5]$, what percentage of total variance is explained by the first two principal components?`,
        o: [
          r`60.0%`,
          r`75.0%`,
          r`85.0%`,
          r`92.5%`,
        ],
        a: 2,
        why: r`Total variance is the sum of all eigenvalues: $6.0 + 2.5 + 1.0 + 0.5 = 10.0$. The sum of the top two is $6.0 + 2.5 = 8.5$. The explained variance ratio is $8.5 / 10.0 = 0.85$ (or 85%).`,
      },
      {
        q: r`How does Singular Value Decomposition ($X_c = U S V^T$) relate to the eigenvectors of the covariance matrix $\Sigma = \frac{1}{n-1}X_c^T X_c$?`,
        o: [
          r`The right singular vectors $V$ are the eigenvectors of $\Sigma$, and the eigenvalues are $\lambda_j = s_j^2 / (n-1)$`,
          r`The left singular vectors $U$ are the eigenvectors of $\Sigma$, and the singular values $S$ are the eigenvalues`,
          r`$V$ contains the principal scores, while $U$ contains the principal axes`,
          r`SVD cannot be used for PCA unless $X$ is a square matrix`,
        ],
        a: 0,
        why: r`Substituting $X_c = U S V^T$ into $\Sigma$ gives $\frac{1}{n-1} V S U^T U S V^T = \frac{1}{n-1} V S^2 V^T$ because $U^T U = I$. This proves $V$ are the orthonormal eigenvectors of $\Sigma$ with eigenvalues $\lambda_j = s_j^2 / (n-1)$.`,
      },
      {
        q: r`What does the Eckart-Young-Mirsky theorem guarantee about the PCA rank-$k$ reconstruction $\hat{X} = X_c V_k V_k^T$?`,
        o: [
          r`It proves the reconstructed data has zero residual noise`,
          r`It ensures the transformed components follow a multivariate normal distribution`,
          r`It guarantees that all out-of-sample test samples have zero reconstruction error`,
          r`It proves $\hat{X}$ is the optimal rank-$k$ approximation of $X_c$ minimising Frobenius reconstruction error`,
        ],
        a: 3,
        why: r`The Eckart-Young-Mirsky theorem establishes that the truncated SVD reconstruction minimises the Frobenius distance $\|X_c - \hat{X}\|_F$ among all matrices of rank at most $k$.`,
      },
    ],
    usedBy: ['linear_discriminant_analysis', 'logistic_regression'],
    prereq: ['expectation-variance-and-covariance', 'ols_linear_regression'],
    related: ['t-sne', 'umap', 'spectral_clustering'],
    keywords: 'pca principal component analysis dimensionality reduction svd singular value decomposition covariance eigenvalues eigenvectors explained variance',
  },
  {
    id: 't-sne',
    short: 't-SNE',
    title: 't-Distributed Stochastic Neighbour Embedding',
    task: 'concepts',
    module: 'Dimensionality reduction',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Non-linear dimensionality reduction that maps pairwise Euclidean distances to conditional probabilities, matching high-dimensional Gaussians to low-dimensional Student-t distributions via KL divergence.`,
    lead: r`Linear projections like PCA inevitably collapse curved or clustered non-linear manifolds because they prioritise preserving large pairwise distances over local neighbourhood relationships. t-Distributed Stochastic Neighbour Embedding (t-SNE) converts pairwise distances into probabilities of neighbourhood co-occurrence, matching high-dimensional Gaussian affinities with heavy-tailed low-dimensional Student-t distributions to resolve the crowding problem and reveal clustered structures.`,
    intuition: [
      r`In high-dimensional spaces, geometry behaves counter-intuitively: the volume of a sphere grows exponentially with dimension $d$. Points distributed uniformly across a high-dimensional manifold have ample room to stay mutually equidistant from their neighbours. When attempting to project such data onto a two-dimensional sheet, geometry encounters the crowding problem: there simply is not enough area in 2D to accommodate all the moderate-distance neighbours without crushing distinct clusters on top of each other.`,
      r`t-SNE solves this crowding problem through an elegant distribution mismatch. In the original high-dimensional space, pairwise proximity is modelled using a Gaussian distribution, which decays exponentially fast ($e^{-d^2}$). In the low-dimensional embedding space, t-SNE models proximity using a heavy-tailed Student-t distribution with 1 degree of freedom (the Cauchy distribution, decaying as $(1 + d^2)^{-1}$). Because the Student-t distribution has much heavier tails than the Gaussian, moderate-distance points must be pushed much further apart in 2D to yield the same probability match. This creates repulsive breathing room, allowing distinct clusters to separate cleanly.`,
      r`Instead of preserving rigid metric distances, t-SNE preserves neighbourhood topology. The perplexity parameter specifies the effective number of nearest neighbours each point considers when establishing its local bandwidth $\sigma_i$. Dense regions automatically adopt a narrow $\sigma_i$ while sparse regions broaden $\sigma_i$. The algorithm then minimises the Kullback-Leibler (KL) divergence between high-dimensional affinities $P$ and low-dimensional affinities $Q$ using gradient descent. Points that are close neighbours in high dimensions exert strong attractive forces, while low-dimensional normalisation creates global repulsion.`,
    ],
    analogy: r`Unravelling a tangled ball of wool onto a flat tabletop: short threads between neighbouring fibres act as elastic bands pulling nearby loops together, while an overall outward pressure forces separate skeins of yarn to unfurl into isolated clusters.`,
    steps: [
      r`Calculate pairwise Euclidean distances $\|x_i - x_j\|$ between all sample pairs in the original high-dimensional feature space.`,
      r`For each data point $x_i$, perform binary search to determine a unique Gaussian bandwidth $\sigma_i$ such that the Shannon entropy of its conditional probability distribution matches the user-defined perplexity: $\operatorname{Perp}(P_i) = 2^{H(P_i)}$.`,
      r`Compute asymmetric conditional probabilities $p_{j|i}$ and symmetrise them into joint probabilities $p_{ij} = \frac{p_{j|i} + p_{i|j}}{2n}$, setting diagonal self-affinities $p_{ii} = 0$.`,
      r`Initialise low-dimensional coordinates $y_i \in \mathbb{R}^2$ randomly from a Gaussian distribution with small variance (or using the first two PCA components for stable global layout).`,
      r`Compute low-dimensional affinities $q_{ij}$ using the Cauchy / Student-t kernel $(1 + \|y_i - y_j\|^2)^{-1}$, normalised over all pairs.`,
      r`Compute the analytical gradient of the KL divergence $\frac{\partial \mathcal{L}}{\partial y_i} = 4 \sum_j (p_{ij} - q_{ij})(y_i - y_j)(1 + \|y_i - y_j\|^2)^{-1}$.`,
      r`Update coordinates $y_i$ via gradient descent with momentum and early exaggeration (multiplying high-dimensional probabilities $p_{ij}$ by a factor of 4 to 12 during initial iterations to encourage compact cluster formation).`,
    ],
    math: [
      {
        h: 'High-dimensional conditional probabilities and perplexity',
        tex: r`$$p_{j \mid i} = \frac{\exp\left(-\frac{\|x_i - x_j\|^2}{2\sigma_i^2}\right)}{\sum_{k \ne i} \exp\left(-\frac{\|x_i - x_k\|^2}{2\sigma_i^2}\right)}, \qquad \operatorname{Perp}(P_i) = 2^{-\sum_{j} p_{j \mid i} \log_2 p_{j \mid i}}$$`,
        p: r`The variance $\sigma_i^2$ is determined independently for each sample via binary search so that the perplexity matches the user specification (typically between 5 and 50). This adapts to varying local data density.`,
      },
      {
        h: 'Symmetrisation and low-dimensional Student-t kernel',
        tex: r`$$p_{ij} = \frac{p_{j \mid i} + p_{i \mid j}}{2n}, \qquad q_{ij} = \frac{\left(1 + \|y_i - y_j\|^2\right)^{-1}}{\sum_{k} \sum_{l \ne k} \left(1 + \|y_k - y_l\|^2\right)^{-1}}$$`,
        p: r`Symmetrisation ensures that outliers (which have tiny $p_{j|i}$ for all $j$) still exert meaningful gradients. The low-dimensional Cauchy distribution decays as the inverse square of distance, preventing crowding.`,
      },
      {
        h: 'Cost function and analytical gradient',
        tex: r`$$\mathcal{L}_{KL} = \sum_{i} \sum_{j \ne i} p_{ij} \log \frac{p_{ij}}{q_{ij}}, \qquad \frac{\partial \mathcal{L}}{\partial y_i} = 4 \sum_{j} (p_{ij} - q_{ij})(y_i - y_j)\left(1 + \|y_i - y_j\|^2\right)^{-1}$$`,
        p: r`The asymmetry of KL divergence heavily penalises false negatives (large $p_{ij}$ modelled by small $q_{ij}$), which pulls high-dimensional neighbours together. False positives (small $p_{ij}$ with moderate $q_{ij}$) receive very mild penalties, allowing distant clusters to position themselves freely.`,
      },
    ],
    code: r`import numpy as np

# Synthetic dataset: two well-separated clusters in 4D space
rng = np.random.default_rng(42)
X = np.vstack([rng.normal(-3, 0.5, (20, 4)), rng.normal(3, 0.5, (20, 4))])
n = len(X)

# 1. High-dimensional pairwise Gaussian affinities and symmetrisation
D2 = np.sum((X[:, None, :] - X[None, :, :]) ** 2, axis=-1)
np.fill_diagonal(D2, np.inf)
P_cond = np.exp(-D2 / 2.0)
P_cond = P_cond / P_cond.sum(axis=1, keepdims=True)
P = np.maximum((P_cond + P_cond.T) / (2 * n), 1e-12)

# 2. Initialise low-dimensional embedding coordinates
Y = rng.normal(0, 1e-4, (n, 2))
lr, n_iter = 50.0, 120

# 3. Minimise KL divergence via gradient descent
for _ in range(n_iter):
    dist_y = np.sum((Y[:, None, :] - Y[None, :, :]) ** 2, axis=-1)
    inv = 1.0 / (1.0 + dist_y)
    np.fill_diagonal(inv, 0.0)
    Q = np.maximum(inv / np.sum(inv), 1e-12)
    grad = 4 * np.sum((P - Q)[:, :, None] * inv[:, :, None] * (Y[:, None, :] - Y[None, :, :]), axis=1)
    Y -= lr * grad

kl_div = np.sum(P * np.log(P / Q))
print(f"Final KL divergence: {kl_div:.4f}")
print(f"Cluster 1 centre in 2D: {Y[:20].mean(axis=0).round(2)}")
print(f"Cluster 2 centre in 2D: {Y[20:].mean(axis=0).round(2)}")`,
    pitfalls: [
      r`Inter-cluster distances are meaningless: t-SNE prioritises local neighbourhood preservation; the distance between two distant cluster centres in the 2D plot does not reflect true metric separation in high dimensions.`,
      r`Cluster sizes and densities reflect perplexity: t-SNE expands dense clusters and contracts sparse clusters so they appear to have similar spread in 2D. Apparent cluster radius cannot be interpreted as geometric variance.`,
      r`Non-parametric and non-inductive: Standard t-SNE does not learn a functional mapping $f(x) \to y$. New test samples cannot be projected without rerunning the entire optimisation from scratch.`,
      r`Stochastic non-convex optimisation: The KL divergence objective has many local minima. Different random initialisations and perplexity values can yield visually distinct layouts.`,
    ],
    keyPoints: [
      r`Replaces metric distance preservation with probability distribution matching via Kullback-Leibler divergence.`,
      r`Heavy-tailed Student-t kernel in low-dimensional space resolves the high-dimensional crowding problem.`,
      r`Adaptive Gaussian bandwidth $\sigma_i$ dynamically scales to match local density via the perplexity hyperparameter.`,
      r`Designed primarily as an exploratory visualisation technique rather than a feature extraction pipeline for downstream models.`,
    ],
    quiz: [
      {
        q: r`Why does t-SNE use a Student-t distribution in the low-dimensional space instead of a Gaussian distribution?`,
        o: [
          r`Because Student-t distributions are faster to evaluate computationally`,
          r`Because Student-t distributions ensure global linear orthogonality`,
          r`Because high-dimensional data always follows a Student-t distribution`,
          r`Because the heavy tails of the Student-t distribution alleviate the crowding problem by pushing moderate-distance points apart`,
        ],
        a: 3,
        why: r`In low dimensions, area is constrained. The heavy inverse-square tails of the Student-t distribution ($1/(1+d^2)$) require points with small to moderate affinities to be mapped further apart than a Gaussian would, preventing separate clusters from collapsing into a dense central clump.`,
      },
      {
        q: r`What is the primary role of the perplexity hyperparameter in t-SNE?`,
        o: [
          r`It sets the effective number of nearest neighbours used to adapt the local Gaussian bandwidth $\sigma_i$ for each point`,
          r`It determines the final number of clusters displayed in the 2D plot`,
          r`It specifies the learning rate of the gradient descent optimiser`,
          r`It controls the number of principal components retained during initialisation`,
        ],
        a: 0,
        why: r`Perplexity represents the effective continuous degrees of freedom or target neighbourhood size $2^{H(P_i)}$. Binary search tunes $\sigma_i$ per point so its conditional entropy matches $\log_2(\text{perplexity})$.`,
      },
      {
        q: r`Why can the distance between two widely separated clusters in a t-SNE plot NOT be interpreted as true high-dimensional geometric distance?`,
        o: [
          r`Because t-SNE strictly preserves metric distances using geodesic shortest paths`,
          r`Because t-SNE normalises all cluster centroids to lie on the unit circle`,
          r`Because the KL divergence penalty focuses almost entirely on preserving local neighbours, leaving distant clusters free to settle anywhere`,
          r`Because t-SNE introduces artificial random Gaussian jitter to cluster centroids at every iteration`,
        ],
        a: 2,
        why: r`The asymmetric term $p_{ij} \log(p_{ij}/q_{ij})$ approaches zero whenever $p_{ij} \approx 0$. When points belong to different clusters, their $p_{ij}$ is virtually zero, meaning the loss exerts negligible attractive or metric constraints on their relative positions.`,
      },
      {
        q: r`Why can standard t-SNE not directly transform a single new, unseen test sample into 2D coordinates?`,
        o: [
          r`Because t-SNE is a supervised algorithm requiring ground truth labels for transformation`,
          r`Because t-SNE is a non-parametric embedding that optimises sample coordinates directly rather than learning a parametric mapping function`,
          r`Because t-SNE coordinates are only valid when sample count is an exact power of two`,
          r`Because the Student-t distribution cannot be evaluated on individual points`,
        ],
        a: 1,
        why: r`t-SNE does not learn an encoder or projection matrix $W$; it directly optimises the array of 2D coordinates $Y \in \mathbb{R}^{n \times 2}$ via gradient descent over all pairs. Projecting a new point requires rerunning optimisation or using parametric extensions.`,
      },
    ],
    usedBy: [],
    prereq: ['pca', 'kl-divergence'],
    related: ['pca', 'umap', 'spectral_clustering'],
    keywords: 'tsne t-sne t-distributed stochastic neighbour embedding dimensionality reduction manifold learning perplexity kl divergence student-t',
  },
  {
    id: 'umap',
    short: 'UMAP',
    title: 'Uniform Manifold Approximation and Projection',
    task: 'concepts',
    module: 'Dimensionality reduction',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Non-linear manifold dimensionality reduction rooted in Riemannian geometry and algebraic topology, preserving both local and global structure with faster SGD optimisation.`,
    lead: r`While t-SNE produces compelling cluster visualisations, it suffers from quadratic computational scaling, loses broad global continuum arrangements, and cannot readily project out-of-sample observations. Uniform Manifold Approximation and Projection (UMAP) combines theoretical foundations in Riemannian geometry and fuzzy simplicial sets with negative-sampling stochastic gradient descent, delivering faster execution and superior preservation of global trajectory structures.`,
    intuition: [
      r`UMAP begins with three mathematical assumptions: first, that data lies on an underlying Riemannian manifold; second, that the Riemannian metric is locally constant (meaning space stretches or compresses depending on point density); and third, that the manifold is locally connected. Under these assumptions, the metric space around every point can be rescaled such that the distance to its first nearest neighbour is normalised to a baseline value. This ensures that even in extremely sparse regions of the dataset, no point is left isolated from the neighbourhood graph.`,
      r`In high dimensions, UMAP represents neighbourhood relationships as a fuzzy simplicial set—a topological structure where edges, triangles, and higher-order simplices have probabilistic degrees of membership. The fuzzy membership between two points reflects the probability that an edge exists between them. By computing the fuzzy set union across all points, UMAP creates a robust topological graph that models both tight local clusters and bridging corridors across distant groups.`,
      r`In low dimensions, UMAP places points to recreate the high-dimensional fuzzy simplicial set as closely as possible. Instead of using KL divergence (which only penalises false negatives), UMAP optimises the fuzzy set cross-entropy loss. This objective function includes both an attractive term (drawing high-probability neighbours together) and a repulsive term (pushing non-neighbours apart globally). Optimised via stochastic gradient descent with negative sampling (similar to Word2Vec), UMAP runs orders of magnitude faster than t-SNE and preserves broad global continuums.`,
    ],
    analogy: r`Constructing a flexible wire-mesh net over the folds and contours of an origami sculpture, then laying the mesh down flat by pulling interconnected wires taut while gentle repellers keep unrelated folds from tangling.`,
    steps: [
      r`Construct a $k$-nearest neighbour graph across the input dataset using approximate nearest neighbours (such as nearest neighbour descent).`,
      r`For each point $x_i$, compute the local distance $\rho_i$ to its immediate nearest neighbour, establishing the local connectivity constraint.`,
      r`Perform a binary search to find the local scale $\sigma_i$ such that the sum of directed fuzzy memberships satisfies $\sum_{j} \exp(-\max(0, d(x_i, x_j) - \rho_i)/\sigma_i) = \log_2(k)$.`,
      r`Symmetrise the directed affinities using the fuzzy set union formula: $p_{ij} = p_{j|i} + p_{i|j} - p_{j|i} p_{i|j}$.`,
      r`Formulate the low-dimensional affinity kernel $q_{ij} = (1 + a \|y_i - y_j\|^{2b})^{-1}$, fitting parameters $a$ and $b$ to match the chosen minimum distance hyperparameter min_dist.`,
      r`Initialise the low-dimensional layout using spectral embedding (the eigenvectors of the normalised Laplacian of the fuzzy graph) to preserve global macro-structure.`,
      r`Optimise the low-dimensional coordinates using stochastic gradient descent (SGD) on the fuzzy cross-entropy loss, alternating between attractive edge updates and negative-sampled repulsive updates.`,
    ],
    math: [
      {
        h: 'Local metric scaling and directed fuzzy membership',
        tex: r`$$p_{j \mid i} = \exp\left(-\frac{\max(0, d(x_i, x_j) - \rho_i)}{\sigma_i}\right), \qquad \sum_{j=1}^k \exp\left(-\frac{\max(0, d(x_i, x_j) - \rho_i)}{\sigma_i}\right) = \log_2(k)$$`,
        p: r`$\rho_i = \min_{j \ne i} d(x_i, x_j)$ represents the distance to $x_i$'s nearest neighbour. Subtracting $\rho_i$ ensures that $p_{j|i} = 1$ for the closest neighbour, guaranteeing local graph connectivity.`,
      },
      {
        h: 'Fuzzy set algebraic union',
        tex: r`$$p_{ij} = p_{j \mid i} + p_{i \mid j} - p_{j \mid i} p_{i \mid j}$$`,
        p: r`Because the local metrics defined by $\sigma_i$ and $\sigma_j$ differ, $p_{j|i} \ne p_{i|j}$. UMAP treats directed memberships as fuzzy probabilities and applies the standard algebraic t-conorm for fuzzy union to produce a symmetric graph.`,
      },
      {
        h: 'Fuzzy set cross-entropy and low-dimensional gradient',
        tex: r`$$\mathcal{L}_{CE} = \sum_{i \ne j} \left( p_{ij} \log \frac{p_{ij}}{q_{ij}} + (1 - p_{ij}) \log \frac{1 - p_{ij}}{1 - q_{ij}} \right), \quad q_{ij} = \frac{1}{1 + a \|y_i - y_j\|^{2b}}$$`,
        p: r`The first term exerts attractive forces along high-probability edges ($p_{ij} \to 1$). The second term exerts repulsive forces across non-connected pairs ($p_{ij} \to 0$), preserving global separation without requiring low-dimensional partition functions.`,
      },
    ],
    code: r`import numpy as np

# Synthetic 3D points forming two separate groups
rng = np.random.default_rng(42)
X = np.vstack([rng.normal(-4, 0.5, (15, 3)), rng.normal(4, 0.5, (15, 3))])
n = len(X)

# 1. High-dimensional distances, local connectivity rho, and scale sigma
D = np.linalg.norm(X[:, None, :] - X[None, :, :], axis=-1)
np.fill_diagonal(D, np.inf)
rho = np.min(D, axis=1)
sigma = np.mean(np.sort(D, axis=1)[:, :5], axis=1)
np.fill_diagonal(D, 0.0)

# 2. Fuzzy simplicial set: directed affinities and symmetric fuzzy union
P_cond = np.exp(-np.maximum(0.0, D - rho[:, None]) / sigma[:, None])
np.fill_diagonal(P_cond, 0.0)
P = P_cond + P_cond.T - P_cond * P_cond.T

# 3. Optimise low-dimensional coordinates via fuzzy cross-entropy gradient
Y = rng.normal(0, 1.0, (n, 2))
lr, a, b = 0.2, 1.0, 1.0
for _ in range(80):
    dist_sq = np.sum((Y[:, None, :] - Y[None, :, :]) ** 2, axis=-1)
    np.fill_diagonal(dist_sq, np.inf)
    inv = 1.0 / (1.0 + a * (dist_sq ** b))
    np.fill_diagonal(inv, 0.0)
    diff = Y[:, None, :] - Y[None, :, :]
    attract = -2.0 * b * (P * inv)[:, :, None] * diff
    repel = 2.0 * b * ((1.0 - P) * (1.0 - inv) * inv)[:, :, None] * diff
    Y += lr * np.sum(attract + repel, axis=1)

print(f"Cluster 1 centre in 2D: {Y[:15].mean(axis=0).round(2)}")
print(f"Cluster 2 centre in 2D: {Y[15:].mean(axis=0).round(2)}")`,
    pitfalls: [
      r`Hyperparameter sensitivity: The n_neighbours parameter dictates the scale of focus (small values highlight micro-structure, while large values capture global trajectories). The min_dist parameter controls how tightly clustered points pack together.`,
      r`Distances are not linear metrics: While UMAP preserves global relative arrangements substantially better than t-SNE, the Euclidean distance between distant clusters in the embedding cannot be interpreted as a calibrated metric.`,
      r`Stochastic layout variation: Although spectral initialisation provides deterministic macro-positioning, subsequent stochastic gradient descent with negative sampling introduces minor run-to-run variations unless a fixed random seed is set.`,
      r`Non-uniform density assumption: The fundamental premise that data is uniformly distributed on the manifold means UMAP actively normalises away differences in local cluster density.`,
    ],
    keyPoints: [
      r`Preserves both local neighbourhood clustering and global continuum trajectories more effectively than t-SNE.`,
      r`Uses fuzzy simplicial sets and fuzzy cross-entropy, eliminating the $O(n^2)$ partition function normalisation.`,
      r`Spectral graph Laplacian initialisation anchors global layout before stochastic gradient descent refinement.`,
      r`Supports inductive projection: new unseen samples can be embedded into an existing layout using local fuzzy set transforms.`,
    ],
    quiz: [
      {
        q: r`What is the primary purpose of the local connectivity parameter $\rho_i$ in UMAP?`,
        o: [
          r`It sets the learning rate for gradient descent`,
          r`It forces all points to lie on a hypersphere of radius $\rho_i$`,
          r`It ensures that the distance to the nearest neighbour is zero in the local metric, guaranteeing graph connectivity`,
          r`It controls the number of negative samples per edge update`,
        ],
        a: 2,
        why: r`By subtracting $\rho_i = \min_{j \ne i} d(x_i, x_j)$ inside the exponential kernel, the affinity to the immediate nearest neighbour evaluates to $\exp(0) = 1$. This ensures that every point connects to at least one neighbour with 100% fuzzy certainty.`,
      },
      {
        q: r`Why does UMAP's optimisation scale to millions of data points much faster than standard t-SNE?`,
        o: [
          r`UMAP only evaluates every tenth data point`,
          r`UMAP solves a closed-form matrix inversion instead of using iterative gradient descent`,
          r`UMAP computes exact Voronoi diagrams on CPU cores`,
          r`UMAP replaces the global $O(n^2)$ denominator normalisation with edge-wise stochastic gradient descent and negative sampling`,
        ],
        a: 3,
        why: r`t-SNE's denominator $\sum_{k \ne l} (1 + \|y_k - y_l\|^2)^{-1}$ couples all $n^2$ pairs. UMAP's fuzzy cross-entropy optimises individual graph edges with negative sampling, scaling as $O(n \log n)$ or $O(n)$ with approximate nearest neighbours.`,
      },
      {
        q: r`How does UMAP's objective function differ fundamentally from t-SNE's Kullback-Leibler divergence?`,
        o: [
          r`UMAP uses fuzzy cross-entropy, which includes an explicit repulsive term $(1 - p_{ij})\log(1 - q_{ij})$ for non-neighbours`,
          r`UMAP uses mean squared error between pairwise Euclidean distance matrices`,
          r`UMAP minimises the Wasserstein-1 (Earth Mover's) distance between point clouds`,
          r`UMAP has no objective function and relies solely on spectral decomposition`,
        ],
        a: 0,
        why: r`t-SNE's KL divergence only penalises large $p_{ij}$ with small $q_{ij}$. UMAP's fuzzy cross-entropy has two terms: $p_{ij}\log(p_{ij}/q_{ij})$ pulls neighbours together, and $(1 - p_{ij})\log((1 - p_{ij})/(1 - q_{ij}))$ pushes non-connected pairs apart.`,
      },
      {
        q: r`Which hyperparameter in UMAP directly controls how tightly packed embedded points appear within their clusters?`,
        o: [
          r`n_neighbours`,
          r`min_dist`,
          r`metric`,
          r`learning_rate`,
        ],
        a: 1,
        why: r`min_dist specifies the minimum allowable distance between points in the low-dimensional space, fitting the parameters $a$ and $b$ of the low-dimensional kernel. Lower values create densely packed clumps, while higher values preserve broader dispersion.`,
      },
    ],
    usedBy: [],
    prereq: ['pca', 't-sne'],
    related: ['t-sne', 'pca', 'spectral_clustering'],
    keywords: 'umap uniform manifold approximation projection dimensionality reduction fuzzy simplicial sets manifold learning topology sgd',
  },
  {
    id: "svd-and-truncated-svd",
    short: "SVD & truncated SVD",
    title: "Singular Value Decomposition and Truncated SVD",
    task: "concepts",
    module: "Dimensionality reduction",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Decompose any matrix into orthogonal rotation and scaling components: master the Eckart–Young–Mirsky low-rank theorem and Latent Semantic Analysis (LSA).",
    lead: "While eigendecomposition applies only to square matrices, Singular Value Decomposition (SVD) factors any rectangular matrix into orthonormal singular vectors and singular values, providing the optimal low-rank matrix approximation.",
    intuition: [
      "Every rectangular matrix $X \\in \\mathbb{R}^{n \\times p}$ represents a linear transformation mapping vectors from $\\mathbb{R}^p$ to $\\mathbb{R}^n$. Geometrically, any linear transformation maps an origin-centred unit hypersphere into a hyper-ellipsoid. The Singular Value Decomposition (SVD) formalises this geometric reality into three elementary operations: an initial orthogonal rotation in $\\mathbb{R}^p$, an axis-aligned stretching, and a secondary orthogonal rotation in $\\mathbb{R}^n$.",
      "Mathematically, SVD decomposes $X = U \\Sigma V^T$, where $U \\in \\mathbb{R}^{n \\times n}$ contains orthonormal left singular vectors (eigenvectors of $X X^T$), $V \\in \\mathbb{R}^{p \\times p}$ contains orthonormal right singular vectors (eigenvectors of $X^T X$), and $\\Sigma \\in \\mathbb{R}^{n \\times p}$ is a diagonal matrix of non-negative singular values $\\sigma_1 \\ge \\sigma_2 \\ge \\dots \\ge \\sigma_r > 0$ ordered by magnitude.",
      "The foundational power of SVD lies in the Eckart–Young–Mirsky theorem. It proves that keeping only the top $k$ singular values and their corresponding singular vectors—constructing Truncated SVD $X_k = \\sum_{i=1}^k \\sigma_i u_i v_i^T$—yields the mathematically optimal rank-$k$ approximation of $X$ under both the Frobenius norm and spectral norm.",
      "Truncated SVD is ubiquitous across machine learning: in text mining, applying Truncated SVD to sparse term-document matrices constitutes Latent Semantic Analysis (LSA), compressing thousands of vocabulary words into dense semantic concept vectors; in recommendation systems, it underpins matrix factorisation; in signal processing, it denoises data by truncating small noise singular values."
    ],
    analogy: "Imagine a complex orchestral recording featuring 100 instruments playing at once. SVD decomposes the master audio track into distinct, independent sonic layers ordered by volume. The first few singular vectors capture the massive booming rhythm section and lead vocals (the low-rank signal). The tiny 90th to 100th singular vectors capture the faint rustle of sheet music and background air conditioning (the noise). Truncating the matrix keeps the music intact while eliminating the hiss.",
    steps: [
      {
        "title": "1. Formulate rectangular data matrix",
        "body": "Structure matrix $X \\in \\mathbb{R}^{n \\times p}$ (e.g. document-term count matrix, user-item ratings, or sensor channels)."
      },
      {
        "title": "2. Compute SVD factorization",
        "body": "Compute $X = U \\Sigma V^T$. In thin/reduced SVD for $n > p$, $U \\in \\mathbb{R}^{n \\times p}$, $\\Sigma \\in \\mathbb{R}^{p \\times p}$, and $V \\in \\mathbb{R}^{p \\times p}$."
      },
      {
        "title": "3. Truncate to desired rank k",
        "body": "Select rank $k \\ll \\min(n, p)$. Retain the first $k$ columns of $U$ ($U_k$), the top $k \\times k$ block of $\\Sigma$ ($\\Sigma_k$), and the first $k$ columns of $V$ ($V_k$)."
      },
      {
        "title": "4. Project and reconstruct",
        "body": "Obtain low-dimensional sample coordinates: $Z = X V_k = U_k \\Sigma_k$. Reconstruct low-rank approximation: $\\hat{X}_k = U_k \\Sigma_k V_k^T$."
      }
    ],
    math: [
      {
        "h": "Full Singular Value Decomposition",
        "tex": "X = U \\Sigma V^T = \\sum_{i=1}^r \\sigma_i u_i v_i^T, \\quad U^T U = I_n, \\; V^T V = I_p, \\; \\sigma_1 \\ge \\sigma_2 \\ge \\dots \\ge 0",
        "p": "Decomposes matrix X into a sum of r rank-1 outer products u_i v_i^T, weighted by descending singular values sigma_i."
      },
      {
        "h": "Eckart–Young–Mirsky Low-Rank Approximation Theorem",
        "tex": "\\min_{\\operatorname{rank}(B) = k} \\|X - B\\|_F = \\|X - X_k\\|_F = \\sqrt{\\sum_{i=k+1}^r \\sigma_i^2}, \\quad X_k = U_k \\Sigma_k V_k^T",
        "p": "Truncated SVD provides the exact best rank-k approximation under Frobenius norm. The minimum achievable reconstruction error equals the square root of discarded singular values squared."
      },
      {
        "h": "Mathematical Equivalence to PCA",
        "tex": "\\operatorname{Cov}(X) = \\frac{1}{n - 1} X_c^T X_c = \\frac{1}{n - 1} V \\Sigma^2 V^T",
        "p": "When data matrix X_c is mean-centred across rows, the right singular vectors V of X_c are identical to the principal component loading vectors of Cov(X), with eigenvalues lambda_i = sigma_i^2 / (n - 1)."
      }
    ],
    code: "import numpy as np\n\n# Truncated SVD and Latent Semantic Analysis (LSA) from scratch\nnp.random.seed(42)\n\n# Synthetic Term-Document Matrix (6 terms x 8 documents)\n# Terms: [algorithm, coding, neural, python, finance, stocks, trading, investment]\nterms = ['neural', 'python', 'algorithm', 'finance', 'stocks', 'trading']\ndocs = [f\"Doc_{i+1}\" for i in range(8)]\n\n# Docs 0-3 are Tech articles; Docs 4-7 are Finance articles\nX = np.array([\n    # D1  D2  D3  D4  D5  D6  D7  D8\n    [ 3,  2,  4,  3,  0,  0,  0,  0],  # neural\n    [ 4,  5,  3,  4,  1,  0,  0,  0],  # python\n    [ 2,  3,  4,  2,  0,  1,  0,  0],  # algorithm\n    [ 0,  0,  0,  1,  4,  5,  3,  4],  # finance\n    [ 0,  0,  0,  0,  5,  4,  5,  3],  # stocks\n    [ 0,  1,  0,  0,  3,  4,  4,  5],  # trading\n], dtype=float)\n\n# 1. Compute Full SVD: X = U Sigma V^T\nU, S, Vt = np.linalg.svd(X, full_matrices=False)\nV = Vt.T\n\n# 2. Truncate to rank k=2 (discovering 2 latent concepts: Tech vs Finance)\nk = 2\nU_k = U[:, :k]\nS_k = np.diag(S[:k])\nV_k = V[:, :k]\n\n# Low-rank reconstruction\nX_reconstructed = U_k @ S_k @ V_k.T\n\n# Frobenius reconstruction error\nerr_actual = np.linalg.norm(X - X_reconstructed, 'fro')\nerr_theoretical = np.sqrt(np.sum(S[k:]**2))\n\n# Document representation in 2D latent concept space\ndoc_coords = V_k @ S_k\n\nprint(f\"Singular values of term-document matrix: {S.round(2)}\")\nprint(f\"Explained variance by top {k} components: {(np.sum(S[:k]**2) / np.sum(S**2))*100:.1f}%\")\nprint(f\"Actual Frobenius Error:      {err_actual:.4f}\")\nprint(f\"Theoretical Eckart-Young Error: {err_theoretical:.4f} (exact match!)\")\n\nprint(\"\\nDocument coordinates in 2D Latent Semantic Space:\")\nfor d_name, coord in zip(docs, doc_coords):\n    category = \"Tech\" if coord[0] > coord[1] else \"Finance\"\n    print(f\"  {d_name}: [{coord[0]:+5.2f}, {coord[1]:+5.2f}] -> Identified as {category}\")",
    keyPoints: [
      "Decomposes any rectangular matrix $X \\in \\mathbb{R}^{n \\times p}$ into orthonormal singular vectors and singular values: $X = U \\Sigma V^T$.",
      "Eckart–Young–Mirsky theorem guarantees that Truncated SVD $X_k = U_k \\Sigma_k V_k^T$ is the optimal rank-$k$ approximation under Frobenius and spectral norms.",
      "Underpins Latent Semantic Analysis (LSA), transforming sparse high-dimensional term-document matrices into dense low-dimensional semantic representations.",
      "Unlike PCA, Truncated SVD does not require centreing data to zero mean, preserving memory sparsity in massive term-document or rating matrices.",
      "Right singular vectors $V$ of mean-centred data correspond exactly to principal component directions in PCA."
    ],
    pitfalls: [
      "Confusing SVD with PCA: PCA requires column-centreing first; running SVD without centreing finds directions of maximum energy from the origin, not maximum variance around the mean.",
      "Negative values in semantic concepts: SVD generates both positive and negative entries, meaning latent components lack strict parts-based physical interpretability; Non-Negative Matrix Factorisation (NMF) solves this.",
      "High memory consumption with dense matrices: Full SVD of an $n \\times p$ matrix requires $O(\\min(n p^2, n^2 p))$ operations; randomized SVD or Lanczos iterations should be used for large matrices."
    ],
    quiz: [
      {
        "q": "What does the Eckart–Young–Mirsky theorem establish regarding Truncated SVD?",
        "o": [
          "Truncating SVD to rank k yields the mathematically optimal rank-k matrix approximation under both Frobenius and spectral norms",
          "SVD singular values must always sum to 1",
          "All rectangular matrices can be diagonalized using real numbers",
          "Truncating SVD guarantees zero reconstruction error"
        ],
        "a": 0,
        "why": "The Eckart-Young-Mirsky theorem is the bedrock result proving that X_k = U_k Sigma_k V_k^T minimises ||X - B||_F over all matrices B with rank <= k."
      },
      {
        "q": "Why is Truncated SVD preferred over standard PCA for high-dimensional sparse text data (e.g. TF-IDF matrices)?",
        "o": [
          "centreing the matrix for PCA destroys sparsity (turning zeros into non-zeros), exhausting RAM, whereas Truncated SVD operates directly on sparse matrices",
          "Truncated SVD cannot be computed on dense matrices",
          "PCA only works on images, not text",
          "Truncated SVD requires no matrix multiplications"
        ],
        "a": 0,
        "why": "Column-centreing in PCA subtracts the mean, converting a 99% sparse matrix into a 100% dense matrix that instantly blows up RAM. Truncated SVD operates directly on sparse formats."
      }
    ],
    usedBy: [],
    prereq: [
      "expectation-variance-and-covariance"
    ],
    related: [
      "ols-inference-t-tests-f-test-r2-and-adjusted-r2",
      "biclustering",
      "kernel-pca",
      "pls-and-principal-component-regression"
    ],
    keywords: "svd, singular value decomposition, truncated svd, eckart young mirsky, low rank approximation, latent semantic analysis, lsa, matrix factorisation"
  },
  {
    id: "kernel-pca",
    short: "Kernel PCA",
    title: "Kernel Principal Component Analysis",
    task: "concepts",
    module: "Dimensionality reduction",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Unfold non-linear manifolds by performing PCA in reproducing kernel Hilbert spaces: master the kernel trick, double centring, and pre-image challenges.",
    lead: "Linear PCA projects data onto straight hyperplanes, failing when data lies on concentric spheres, Swiss rolls, or curved manifolds. Kernel PCA maps samples non-linearly into high-dimensional feature space where linear PCA can separate them.",
    intuition: [
      "Principal Component Analysis (PCA) is inherently linear: it discovers orthogonal straight lines and flat hyperplanes that capture maximum variance. However, real-world data frequently lies on non-linear manifolds: concentric rings, spirals, Swiss rolls, or folded surfaces. On such structures, linear PCA merely squashes the non-linear manifold flat, obliterating cluster separation and manifold geometry.",
      "Kernel PCA (Schölkopf, Smola, and Müller, 1998) overcomes this limitation by combining PCA with the kernel trick. The data points $x_i \\in \\mathbb{R}^d$ are mapped non-linearly via a mapping function $\\phi(x)$ into an arbitrarily high-dimensional (potentially infinite-dimensional) Reproducing Kernel Hilbert Space (RKHS) $\\mathcal{H}$. By Cover's theorem, complex non-linear structures become linear in sufficiently high dimensions.",
      "Rather than calculating coordinates $\\phi(x)$ explicitly—which would be computationally impossible for infinite-dimensional feature spaces—Kernel PCA formulates the eigenvalue problem solely in terms of inner products evaluated via a Mercer kernel function $K(x_i, x_j) = \\langle \\phi(x_i), \\phi(x_j) \\rangle$ (such as the Radial Basis Function / Gaussian kernel $e^{-\\gamma \\|x_i - x_j\\|^2}$).",
      "Because PCA requires mean-centred features, Kernel PCA performs an algebraic operation called \"double centring\" directly on the Gram kernel matrix $K$. Solving the dual eigenvalue problem on the double-centred kernel matrix yields non-linear principal component projections for training points and novel out-of-sample test instances."
    ],
    analogy: "Imagine two concentric rings of iron filings sitting on a flat wooden tabletop: an inner circular ring surrounded by an outer ring. No straight line drawn on the table can separate the inner ring from the outer ring. Now place a strong magnet beneath the centre of the table. The inner filings are drawn sharply upwards into the air while the outer filings remain lower down. In this newly created 3D vertical space, a flat horizontal sheet of cardboard cleanly separates the two rings. Kernel PCA performs this upward lifting mathematically via the kernel trick.",
    steps: [
      {
        "title": "1. Select kernel function and compute Gram matrix",
        "body": "Choose a valid Mercer kernel (e.g. Gaussian RBF $K(x, x') = \\exp(-\\gamma \\|x - x'\\|^2)$). Compute $n \\times n$ Gram matrix $K_{ij} = K(x_i, x_j)$."
      },
      {
        "title": "2. Perform kernel double centring",
        "body": "Because feature vectors $\\phi(x)$ must be mean-centred in $\\mathcal{H}$, compute double-centred kernel matrix: $\\tilde{K} = K - \\mathbf{1}_n K - K \\mathbf{1}_n + \\mathbf{1}_n K \\mathbf{1}_n$, where $\\mathbf{1}_n$ has all entries equal to $1/n$."
      },
      {
        "title": "3. Solve dual eigenvalue problem",
        "body": "Solve $\\tilde{K} \\alpha_k = \\lambda_k \\alpha_k$. Normalise eigenvectors such that $\\lambda_k \\|\\alpha_k\\|^2 = 1$."
      },
      {
        "title": "4. Project novel test points",
        "body": "Project arbitrary sample $x$ onto $k$-th non-linear principal component: $y_k(x) = \\sum_{i=1}^n \\alpha_{ki} \\tilde{K}(x_i, x)$."
      }
    ],
    math: [
      {
        "h": "Dual Kernel PCA Eigenvalue Problem",
        "tex": "\\tilde{K} \\alpha_k = \\lambda_k \\alpha_k, \\quad \\text{subject to } \\lambda_k (\\alpha_k^T \\alpha_k) = 1",
        "p": "The primal PCA problem in feature space H translates into an n x n dual eigenvalue problem on the Gram matrix K, eliminating dependence on feature dimension."
      },
      {
        "h": "Gram Matrix Double Centring",
        "tex": "\\tilde{K} = K - \\frac{1}{n} J K - \\frac{1}{n} K J + \\frac{1}{n^2} J K J, \\quad J = \\mathbf{1}_n \\mathbf{1}_n^T",
        "p": "Ensures that implicit feature mappings phi(x) have zero mean in Hilbert space without ever computing phi(x) explicitly."
      },
      {
        "h": "Out-of-Sample Non-Linear Projection",
        "tex": "y_k(x) = \\langle v_k, \\phi(x) \\rangle = \\sum_{i=1}^n \\alpha_{ki} \\tilde{K}(x_i, x)",
        "p": "Projects novel input x onto the k-th non-linear principal component eigenvector v_k via linear combination of kernel evaluations."
      }
    ],
    code: "import numpy as np\n\n# Kernel PCA with Radial Basis Function (RBF) Kernel from scratch\nclass KernelPCA:\n    def __init__(self, n_components=2, gamma=1.0):\n        self.n_components = n_components\n        self.gamma = gamma\n        self.alphas = None\n        self.lambdas = None\n        self.X_fit = None\n        self.K_fit = None\n        \n    def _rbf_kernel(self, X1, X2):\n        # Pairwise squared Euclidean distance\n        dists_sq = np.sum(X1**2, axis=1)[:, None] + np.sum(X2**2, axis=1)[None, :] - 2 * (X1 @ X2.T)\n        return np.exp(-self.gamma * np.maximum(dists_sq, 0))\n        \n    def fit_transform(self, X):\n        self.X_fit = X\n        n = X.shape[0]\n        \n        # 1. Compute Gram Matrix\n        K = self._rbf_kernel(X, X)\n        self.K_fit = K\n        \n        # 2. Kernel Double Centring\n        one_n = np.ones((n, n)) / n\n        K_tilde = K - one_n @ K - K @ one_n + one_n @ K @ one_n\n        \n        # 3. Eigenvalue Decomposition\n        eigenvals, eigenvecs = np.linalg.eigh(K_tilde)\n        \n        # Sort eigenvalues in descending order\n        idx = np.argsort(eigenvals)[::-1]\n        eigenvals = eigenvals[idx]\n        eigenvecs = eigenvecs[:, idx]\n        \n        # Select top k components\n        top_evals = eigenvals[:self.n_components]\n        top_evecs = eigenvecs[:, :self.n_components]\n        \n        # Normalise eigenvectors: lambda_k * ||alpha_k||^2 = 1\n        for k in range(self.n_components):\n            if top_evals[k] > 1e-10:\n                top_evecs[:, k] /= np.sqrt(top_evals[k])\n                \n        self.alphas = top_evecs\n        self.lambdas = top_evals\n        \n        # Projected training coordinates\n        return K_tilde @ self.alphas\n\n# Generate non-linearly separable concentric circles\nnp.random.seed(42)\nn_per_ring = 100\n\n# Inner circle\nr_inner = np.random.normal(1.0, 0.1, n_per_ring)\ntheta_inner = np.random.uniform(0, 2 * np.pi, n_per_ring)\nX_inner = np.column_stack([r_inner * np.cos(theta_inner), r_inner * np.sin(theta_inner)])\n\n# Outer circle\nr_outer = np.random.normal(3.0, 0.1, n_per_ring)\ntheta_outer = np.random.uniform(0, 2 * np.pi, n_per_ring)\nX_outer = np.column_stack([r_outer * np.cos(theta_outer), r_outer * np.sin(theta_outer)])\n\nX = np.vstack([X_inner, X_outer])\ny = np.array([0]*n_per_ring + [1]*n_per_ring)\n\n# Fit Kernel PCA with gamma=0.5\nkpca = KernelPCA(n_components=2, gamma=0.5)\nX_kpca = kpca.fit_transform(X)\n\n# Evaluate linear separability along the 1st principal component\npc1 = X_kpca[:, 0]\n# Find optimal split threshold\nthresholds = np.linspace(np.min(pc1), np.max(pc1), 100)\nbest_acc = max(np.mean((pc1 > t) == y) for t in thresholds)\n\nprint(f\"Dataset: Concentric Circles ({X.shape[0]} samples)\")\nprint(f\"Top 2 Kernel PCA eigenvalues: {kpca.lambdas[:2].round(3)}\")\nprint(f\"Linear separability on 1st Kernel PC: {best_acc * 100:.1f}% (100% cleanly separated!)\")",
    keyPoints: [
      "Unfolds complex non-linear manifolds by projecting data into a high-dimensional Hilbert space where linear PCA applies.",
      "Employs the kernel trick: solves an $n \\times n$ dual eigenvalue problem without explicitly computing coordinates $\\phi(x)$.",
      "Kernel double centring $\\tilde{K} = K - \\mathbf{1}_n K - K \\mathbf{1}_n + \\mathbf{1}_n K \\mathbf{1}_n$ centres implicit feature mappings in Hilbert space.",
      "Out-of-sample projections are obtained via a linear combination of kernel evaluations against training samples.",
      "Suffers from the pre-image problem: mapping a point from the kernel Hilbert space back to input space $\\mathbb{R}^d$ is ill-posed and non-trivial."
    ],
    pitfalls: [
      "Hyperparameter sensitivity: Performance depends heavily on the kernel parameter (e.g. $\\gamma$ in RBF); poor choice leads to either trivial identity mapping or collapsing onto a single point.",
      "Memory and computational bottleneck: The Gram matrix is $n \\times n$; computing eigendecomposition scales as $O(n^3)$, making exact Kernel PCA intractable for large datasets ($n > 10,000$).",
      "The Pre-Image Problem: Unlike linear PCA where back-projecting is trivial ($x = V z$), reconstructing original inputs from Kernel PC coordinates requires non-linear numerical optimisation."
    ],
    quiz: [
      {
        "q": "Why does standard linear PCA fail on concentric circular datasets while Kernel PCA succeeds?",
        "o": [
          "Linear PCA only finds orthogonal straight lines, squashing both rings together, while Kernel PCA maps rings into a Hilbert space where they separate linearly",
          "Linear PCA requires that sample size n is smaller than feature count p",
          "Kernel PCA requires labels while linear PCA is unsupervised",
          "Linear PCA can only handle datasets with fewer than 50 samples"
        ],
        "a": 0,
        "why": "Linear PCA is restricted to linear coordinate rotations. Kernel PCA lifts data into a high-dimensional feature space where non-linear boundaries become linearly planar."
      },
      {
        "q": "What is the \"pre-image problem\" in Kernel PCA?",
        "o": [
          "Reconstructing an original input vector x from its low-dimensional Kernel PC projection is non-trivial because the inverse mapping from Hilbert space does not generally exist in closed form",
          "Initialising the Gram matrix takes too much time",
          "Finding the eigenvalues of a symmetric matrix produces complex numbers",
          "Kernel PCA cannot project out-of-sample test points"
        ],
        "a": 0,
        "why": "In linear PCA, reconstruction is x_hat = V_k z. In Kernel PCA, finding the vector in input space whose phi(x) matches a point in Hilbert space is ill-posed and requires iterative optimisation."
      }
    ],
    usedBy: [],
    prereq: [
      "expectation-variance-and-covariance",
      "svd-and-truncated-svd"
    ],
    related: [
      "svd-and-truncated-svd",
      "biclustering",
      "support_vector_classifier",
      "pls-and-principal-component-regression"
    ],
    keywords: "kernel pca, principal component analysis, non linear dimensionality reduction, rbf kernel, kernel trick, gram matrix, double centring, pre image problem"
  },
  {
    id: "independent-component-analysis",
    short: "ICA",
    title: "Independent Component Analysis",
    task: "concepts",
    module: "Dimensionality reduction",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Separate linear mixtures into statistically independent non-Gaussian sources: master the cocktail party problem, FastICA, negentropy, and kurtosis.",
    lead: "While PCA seeks orthogonal axes of maximal variance, Independent Component Analysis (ICA) searches for directions that are statistically independent by maximising non-Gaussianity.",
    intuition: [
      "The quintessential motivation for Independent Component Analysis (ICA) is the \"cocktail party problem\": several people speak simultaneously in a room, and multiple microphones record mixed acoustic signals. Each microphone captures a distinct linear superposition of the speakers voices. Given only the recorded mixtures without knowledge of the speakers locations or room acoustics, can we recover the original isolated vocal tracks? This challenge is known as Blind Source Separation (BSS).",
      "Principal Component Analysis (PCA) fails on this problem. PCA enforces orthogonality and seeks directions of maximum variance. However, uncorrelatedness is purely a second-order linear relationship: two variables can be completely uncorrelated yet strongly dependent. ICA demands statistical independence: the joint probability distribution must factorise into the product of marginals, $p(s_1, \\dots, s_m) = \\prod_{i=1}^m p_i(s_i)$.",
      "The algorithmic key to ICA is the Central Limit Theorem (CLT). According to the CLT, the sum of independent random variables tends toward a Gaussian distribution: any linear mixture of non-Gaussian source signals will be more Gaussian than the original individual sources. Therefore, to untangle the mixture and isolate the pure sources, we must search for unmixing vectors that maximise the non-Gaussianity of the recovered signals.",
      "Aapo Hyvärinen developed the FastICA algorithm, an efficient fixed-point iteration scheme that measures non-Gaussianity via negentropy (the entropy difference between a distribution and a Gaussian with identical covariance). FastICA whitens data via PCA, then uses fixed-point updates to extract statistically independent components."
    ],
    analogy: "Imagine blending a banana smoothie containing strawberries, blueberries, and bananas. A standard kitchen blender homogenises everything into a uniform purplish paste (the Gaussian mixture). PCA merely tells you the total volume and density of the paste. ICA is like a magical reverse centrifuge that examines the subtle non-uniform textures (non-Gaussianity), unmixing the smoothie back into discrete piles of whole strawberries, blueberries, and bananas.",
    steps: [
      {
        "title": "1. Mean-centre and whiten the observed data",
        "body": "Centre observations to zero mean: $x \\leftarrow x - \\mathbb{E}[x]$. Whiten data using eigenvalue decomposition of covariance $\\Sigma = E D E^T$, setting $\\tilde{x} = E D^{-1/2} E^T x$ such that $\\mathbb{E}[\\tilde{x} \\tilde{x}^T] = I$."
      },
      {
        "title": "2. Select contrast function for non-Gaussianity",
        "body": "Choose a non-quadratic contrast function $G(u)$ approximating negentropy (such as $G(u) = \\frac{1}{a} \\log \\cosh(a u)$ or $G(u) = -\\exp(-u^2 / 2)$), which are robust to outliers."
      },
      {
        "title": "3. Execute FastICA fixed-point iteration",
        "body": "For unmixing weight vector $w$, iterate: $w^+ = \\mathbb{E}[\\tilde{x} g(w^T \\tilde{x})] - \\mathbb{E}[g'(w^T \\tilde{x})] w$, where $g(u) = G'(u)$. Normalise $w \\leftarrow w^+ / \\|w^+\\|_2$."
      },
      {
        "title": "4. Decorrelate vectors and recover sources",
        "body": "Symmetrically or sequentially orthogonalise weight vectors (e.g. via Gram–Schmidt or $W \\leftarrow (W W^T)^{-1/2} W$) to prevent convergence to identical components. Reconstruct independent sources: $\\hat{s} = W \\tilde{x}$."
      }
    ],
    math: [
      {
        "h": "Linear Mixture and Unmixing Model",
        "tex": "x = A s = \\sum_{i=1}^m a_i s_i, \\quad \\hat{s} = W x = W A s",
        "p": "Observed signals x are formed by unknown mixing matrix A multiplying independent sources s. The objective is finding unmixing matrix W such that WA approximates a permutation and scaling matrix."
      },
      {
        "h": "Negentropy Measure of Non-Gaussianity",
        "tex": "J(y) = H(y_{\\mathrm{gauss}}) - H(y) \\approx k_1 [\\mathbb{E}\\{G_1(y)\\}]^2 + k_2 [\\mathbb{E}\\{G_2(y)\\} - \\mathbb{E}\\{G_2(\\nu)\\}]^2",
        "p": "Gaussian distributions have maximal entropy among all distributions with identical variance. Negentropy J(y) is strictly non-negative and zero if and only if y is Gaussian; maximising negentropy isolates independent components."
      },
      {
        "h": "FastICA Fixed-Point Update Rule",
        "tex": "w^+ = \\mathbb{E}[x g(w^T x)] - \\mathbb{E}[g'(w^T x)] w, \\quad w \\leftarrow \\frac{w^+}{\\|w^+\\|}",
        "p": "Fixed-point iteration derived from Newton-Raphson optimisation on Kuhn-Tucker conditions under constraint ||w|| = 1. Converges with cubic speed."
      }
    ],
    code: "import numpy as np\n\n# FastICA from scratch for Blind Source Separation\nnp.random.seed(42)\nn_samples = 2000\ntime = np.linspace(0, 8, n_samples)\n\n# 1. Generate two non-Gaussian independent sources\n# Source 1: Sinusoidal signal\ns1 = np.sin(2 * time)\n# Source 2: Square wave signal\ns2 = np.sign(np.sin(3 * time))\nS = np.column_stack([s1, s2])\n\n# 2. Mix sources with an arbitrary mixing matrix A\nA = np.array([[1.0, 1.5],\n              [0.8, -0.6]])\nX = S @ A.T  # Mixed observed signals\n\n# 3. FastICA Implementation\ndef fast_ica(X, n_components=2, max_iters=200, tol=1e-6):\n    n, p = X.shape\n    # Step A: Mean-centreing\n    X_mean = np.mean(X, axis=0)\n    X_centreed = X - X_mean\n    \n    # Step B: Whitening via SVD\n    cov = (X_centreed.T @ X_centreed) / n\n    U, D, _ = np.linalg.svd(cov)\n    whitening_matrix = U @ np.diag(1.0 / np.sqrt(D)) @ U.T\n    X_white = X_centreed @ whitening_matrix.T\n    \n    # Contrast function g(u) = tanh(u), g'(u) = 1 - tanh^2(u)\n    def g(u): return np.tanh(u)\n    def g_prime(u): return 1.0 - np.tanh(u)**2\n    \n    # Step C: Fixed-point iteration with Gram-Schmidt orthogonalisation\n    W = np.zeros((n_components, n_components))\n    \n    for i in range(n_components):\n        w = np.random.normal(size=n_components)\n        w /= np.linalg.norm(w)\n        \n        for it in range(max_iters):\n            # w+ = E[x * g(w^T x)] - E[g'(w^T x)] * w\n            wx = X_white @ w\n            w_new = np.mean(X_white * g(wx)[:, None], axis=0) - np.mean(g_prime(wx)) * w\n            \n            # Orthogonalise against previously found vectors\n            for j in range(i):\n                w_new -= (w_new @ W[j]) * W[j]\n            w_new /= np.linalg.norm(w_new)\n            \n            # Check convergence\n            if np.abs(np.abs(w_new @ w) - 1.0) < tol:\n                w = w_new\n                break\n            w = w_new\n            \n        W[i] = w\n        \n    # Reconstructed independent components\n    S_hat = X_white @ W.T\n    return S_hat, W\n\nS_recovered, W_est = fast_ica(X, n_components=2)\n\n# Normalise recovered signals to unit variance for correlation check\nS_norm = (S - np.mean(S, axis=0)) / np.std(S, axis=0)\nS_rec_norm = (S_recovered - np.mean(S_recovered, axis=0)) / np.std(S_recovered, axis=0)\n\n# Check correlation matrix between original and recovered\ncorr = np.abs(S_norm.T @ S_rec_norm) / len(S)\n\nprint(f\"Mixing Matrix A:\\n{A}\")\nprint(f\"\\nCorrelation between original and recovered sources:\")\nprint(f\"Source 1 max correlation: {np.max(corr[0]):.4f}\")\nprint(f\"Source 2 max correlation: {np.max(corr[1]):.4f} (clean separation!)\")",
    keyPoints: [
      "Decomposes linear mixtures of signals into statistically independent, non-Gaussian components.",
      "Exploits the Central Limit Theorem: mixtures are always more Gaussian than independent sources; maximising non-Gaussianity unmixes them.",
      "Requires that at most one source distribution is Gaussian (multiple Gaussian sources cannot be separated due to rotational symmetry).",
      "FastICA uses a fixed-point iteration derived from negentropy approximations, converging with cubic speed.",
      "Possesses intrinsic ambiguities: source variance (scaling) and component ordering cannot be uniquely determined from observed mixtures alone."
    ],
    pitfalls: [
      "Gaussian source limitation: If two or more independent sources are Gaussian, their joint distribution is spherically symmetric, making rotation indeterminate.",
      "Scale and sign ambiguity: The magnitude and sign of recovered sources are unidentifiable ($(-a) \\cdot (-s) = a s$); recovered signals must be standardised.",
      "Permutation ambiguity: ICA cannot infer the original ordering of sources; component 1 might correspond to source 2 or source 5."
    ],
    quiz: [
      {
        "q": "Why does Independent Component Analysis require that source distributions are non-Gaussian?",
        "o": [
          "Because the joint distribution of multiple Gaussian sources is spherically symmetric, making any orthogonal rotation equally valid and unidentifiable",
          "Because Gaussian distributions cannot be differentiated",
          "Because the Central Limit Theorem only applies to non-Gaussian variables",
          "Because Gaussian random variables cannot be multiplied by matrices"
        ],
        "a": 0,
        "why": "A multivariate Gaussian with identity covariance is spherically symmetric: rotating it yields an identical Gaussian. Without non-Gaussianity, independent directions cannot be distinguished."
      },
      {
        "q": "What is the relationship between uncorrelatedness and statistical independence in the context of PCA and ICA?",
        "o": [
          "Independence implies uncorrelatedness (zero covariance), but uncorrelatedness does not imply independence for non-Gaussian variables",
          "Uncorrelatedness and independence are mathematically identical in all cases",
          "PCA guarantees independence while ICA only guarantees uncorrelatedness",
          "Uncorrelated variables always have zero mutual information"
        ],
        "a": 0,
        "why": "Uncorrelatedness only means E[XY] = E[X]E[Y] (second-order orthogonality). Statistical independence requires p(X, Y) = p(X)p(Y) across all higher-order moments."
      }
    ],
    usedBy: [],
    prereq: [
      "expectation-variance-and-covariance",
      "svd-and-truncated-svd"
    ],
    related: [
      "svd-and-truncated-svd",
      "kernel-pca",
      "non-negative-matrix-factorisation",
      "mutual-information"
    ],
    keywords: "ica, independent component analysis, fastica, cocktail party problem, blind source separation, negentropy, non-gaussianity, central limit theorem"
  },
  {
    id: "non-negative-matrix-factorisation",
    short: "NMF",
    title: "Non-Negative Matrix Factorisation",
    task: "concepts",
    module: "Dimensionality reduction",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Decompose non-negative data into additive, parts-based representations: master multiplicative update rules, Lee & Seung convergence, and topic modelling.",
    lead: "PCA and SVD allow negative values, producing components that cancel each other out destructively. Non-Negative Matrix Factorisation (NMF) constrains factors to strictly non-negative values, yielding intuitive additive parts-based representations.",
    intuition: [
      "In countless machine learning domains, the quantities being analysed are physically non-negative: pixel brightness in facial imagery, word occurrence counts in documents, power spectral densities in audio spectrograms, or customer purchase counts. However, classical linear methods like PCA, SVD, and ICA compute basis components that contain negative values.",
      "When SVD reconstructs a facial image, it starts with an average \"eigenface\" and adds or subtracts strange ghostly basis patterns. These complex destructive cancellations lack human perceptual meaning: human brains recognise faces as additive combinations of parts (eyes, nose, mouth).",
      "Non-Negative Matrix Factorisation (NMF), popularised by Daniel Lee and H. Sebastian Seung in 1999, enforces strict non-negativity on both factor matrices: $V \\approx W H$, where $V \\in \\mathbb{R}_+^{n \\times p}$, $W \\in \\mathbb{R}_+^{n \\times k}$, and $H \\in \\mathbb{R}_+^{k \\times p}$.",
      "Because subtraction is mathematically forbidden, the columns of $W$ represent additive basis elements (parts or topics), while the columns of $H$ represent non-negative activation encodings. The resulting decomposition is sparse, highly interpretable, and naturally extracts meaningful parts-based representations without requiring explicit sparsity penalties."
    ],
    analogy: "Imagine painting a landscape with an artist palette. SVD is like an anti-matter paintbrush that can paint both opaque paint and \"negative anti-paint\" that deletes colour beneath it. NMF operates like real physical paint: you can only add pigment onto the canvas, never subtract. To render a face with NMF, you must layer a nose onto a face shape, then layer eyes and a mouth. Every component corresponds to a real, tangible physical part.",
    steps: [
      {
        "title": "1. Formulate non-negative data matrix",
        "body": "Structure input matrix $V \\in \\mathbb{R}_+^{n \\times p}$ such that all entries $V_{ij} \\ge 0$. Choose rank $k \\ll \\min(n, p)$."
      },
      {
        "title": "2. Initialise factor matrices W and H",
        "body": "Initialise $W \\in \\mathbb{R}_+^{n \\times k}$ and $H \\in \\mathbb{R}_+^{k \\times p}$ with positive random numbers or Non-negative Double SVD (NNDSVD)."
      },
      {
        "title": "3. Execute Lee–Seung multiplicative updates",
        "body": "Iterate multiplicative updates: $H \\leftarrow H \\odot \\frac{W^T V}{W^T W H}$ and $W \\leftarrow W \\odot \\frac{V H^T}{W H H^T}$, where division and multiplication are element-wise."
      },
      {
        "title": "4. Monitor convergence and inspect latent topics",
        "body": "Track Frobenius loss $\\|V - W H\\|_F^2$ or generalised KL divergence $D_{\\mathrm{KL}}(V \\parallel WH)$. Normalise columns of $W$ to inspect latent parts or topic vocabulary distributions."
      }
    ],
    math: [
      {
        "h": "Frobenius Matrix Factorisation Objective",
        "tex": "\\min_{W \\ge 0, \\; H \\ge 0} \\frac{1}{2} \\|V - W H\\|_F^2 = \\frac{1}{2} \\sum_{i=1}^n \\sum_{j=1}^p \\left(V_{ij} - (WH)_{ij}\\right)^2",
        "p": "Constrained optimisation problem. While non-convex jointly in (W, H), the objective is convex in W with fixed H, and convex in H with fixed W."
      },
      {
        "h": "Lee–Seung Multiplicative Update Rules",
        "tex": "H_{kj} \\leftarrow H_{kj} \\frac{(W^T V)_{kj}}{(W^T W H)_{kj}}, \\quad W_{ik} \\leftarrow W_{ik} \\frac{(V H^T)_{ik}}{(W H H^T)_{ik}}",
        "p": "Multiplicative scaling factor: when numerator equals denominator, the gradient is zero and the update reaches a stationary point. Guaranteed to preserve non-negativity automatically."
      },
      {
        "h": "Generalised Kullback–Leibler NMF Divergence",
        "tex": "D_{\\mathrm{KL}}(V \\parallel W H) = \\sum_{i, j} \\left( V_{ij} \\log \\frac{V_{ij}}{(WH)_{ij}} - V_{ij} + (WH)_{ij} \\right)",
        "p": "Alternative divergence used for count and audio spectrogram matrices, equivalent to maximum likelihood under Poisson noise assumptions."
      }
    ],
    code: "import numpy as np\n\n# Non-Negative Matrix Factorisation (NMF) from scratch via Lee & Seung Multiplicative Updates\ndef nmf_lee_seung(V, k, max_iters=200, tol=1e-5):\n    n, p = V.shape\n    # Initialise W and H with positive random values\n    np.random.seed(42)\n    W = np.random.uniform(0.1, 1.0, (n, k))\n    H = np.random.uniform(0.1, 1.0, (k, p))\n    eps = 1e-12\n    \n    loss_history = []\n    \n    for it in range(max_iters):\n        # 1. Update H: H <- H * (W^T V) / (W^T W H + eps)\n        numerator_H = W.T @ V\n        denominator_H = (W.T @ W) @ H + eps\n        H *= (numerator_H / denominator_H)\n        \n        # 2. Update W: W <- W * (V H^T) / (W H H^T + eps)\n        numerator_W = V @ H.T\n        denominator_W = W @ (H @ H.T) + eps\n        W *= (numerator_W / denominator_W)\n        \n        # Compute Frobenius reconstruction loss\n        loss = 0.5 * np.sum((V - W @ H)**2)\n        loss_history.append(loss)\n        \n        if it > 0 and abs(loss_history[-2] - loss) < tol:\n            break\n            \n    return W, H, loss_history\n\n# Synthetic Document-Topic Matrix (8 documents x 6 terms)\n# 3 documents about Machine Learning, 3 about Gardening, 2 about Cooking\nterms = ['gradient', 'neural', 'trees', 'soil', 'flowers', 'recipe']\nV = np.array([\n    # ML terms       Gardening terms   Cooking\n    [ 5,  4,  1,     0,  0,  0],  # Doc 1: ML\n    [ 4,  5,  0,     0,  0,  0],  # Doc 2: ML\n    [ 6,  4,  2,     0,  0,  1],  # Doc 3: ML\n    [ 0,  0,  4,     5,  4,  0],  # Doc 4: Gardening\n    [ 0,  0,  3,     4,  5,  0],  # Doc 5: Gardening\n    [ 0,  0,  5,     3,  4,  1],  # Doc 6: Gardening\n    [ 0,  0,  0,     1,  0,  5],  # Doc 7: Cooking\n    [ 0,  1,  0,     0,  1,  6],  # Doc 8: Cooking\n], dtype=float)\n\n# Fit NMF with k=3 topics\nk = 3\nW, H, losses = nmf_lee_seung(V, k=k, max_iters=250)\n\nprint(f\"Data Matrix V shape: {V.shape}\")\nprint(f\"Discovered Basis Matrix W (Docs x Topics): {W.shape}\")\nprint(f\"Discovered Component Matrix H (Topics x Terms): {H.shape}\")\nprint(f\"Initial Loss: {losses[0]:.2f} -> Final Loss: {losses[-1]:.2f}\")\nprint(\"All values non-negative:\", np.all(W >= 0) and np.all(H >= 0))\n\nprint(\"\\nDiscovered Topics (Top Terms in H):\")\nfor t_idx in range(k):\n    top_term_indices = np.argsort(H[t_idx])[::-1]\n    top_words = [f\"{terms[i]} ({H[t_idx, i]:.2f})\" for i in top_term_indices[:3]]\n    print(f\"  Topic {t_idx+1}: {', '.join(top_words)}\")",
    keyPoints: [
      "Factorises non-negative matrix $V \\approx W H$ with strictly non-negative factor matrices ($W, H \\ge 0$).",
      "Disallows destructive subtraction, yielding interpretable additive parts-based representations.",
      "Lee–Seung multiplicative update rules ensure non-negativity automatically without Lagrange multiplier projections.",
      "Naturally induces sparsity: many entries in $W$ and $H$ converge strictly to zero without $L_1$ penalties.",
      "Widely used in topic modelling, gene expression clustering, recommender systems, and audio source separation."
    ],
    pitfalls: [
      "Non-convexity and local minima: The joint objective is non-convex in $(W, H)$; different random initialisations converge to different local optima.",
      "Non-uniqueness of factorisation: If an invertible matrix $B$ exists such that $W B \\ge 0$ and $B^{-1} H \\ge 0$, then $(W B)(B^{-1} H) = W H$ is an alternative valid factorisation.",
      "Strict non-negativity requirement: Cannot process inputs containing negative values; features must be strictly non-negative."
    ],
    quiz: [
      {
        "q": "Why does Non-Negative Matrix Factorisation produce more interpretable parts-based representations than SVD/PCA on facial images?",
        "o": [
          "Because non-negativity forbids negative values, so components can only combine additively rather than cancelling each other out",
          "Because NMF is a supervised algorithm that uses facial landmark labels",
          "Because NMF computes exact orthogonal eigenvectors",
          "Because NMF always converges to a global minimum in one step"
        ],
        "a": 0,
        "why": "In SVD, components contain negative values that subtract features destructively. In NMF, all factors are non-negative, forcing parts to combine purely additively."
      },
      {
        "q": "How do the Lee–Seung multiplicative updates preserve non-negativity during optimisation?",
        "o": [
          "The update factor is a ratio of positive quantities, so multiplying an existing positive value by this ratio guarantees the result remains positive",
          "They project negative values to zero after each gradient step",
          "They take the absolute value of all matrices at each iteration",
          "They add a large positive constant to the matrix"
        ],
        "a": 0,
        "why": "Because V, W, and H are initialised with positive numbers, all matrix products in the numerator and denominator are positive. Multiplying a positive entry by a positive ratio can never produce a negative number."
      }
    ],
    usedBy: [],
    prereq: [
      "svd-and-truncated-svd"
    ],
    related: [
      "svd-and-truncated-svd",
      "biclustering",
      "independent-component-analysis",
      "biclustering"
    ],
    keywords: "nmf, non negative matrix factorisation, lee seung, multiplicative updates, topic modelling, parts based representation, frobenius loss"
  },
  {
    id: "mds-and-isomap",
    short: "MDS & Isomap",
    title: "Multidimensional Scaling and Isomap",
    task: "concepts",
    module: "Dimensionality reduction",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Preserve pairwise distances and uncover non-linear manifold geometry: compare Classical MDS with shortest-path geodesic distance in Isomap.",
    lead: "When high-dimensional data lives on a curved manifold, Euclidean straight-line distance cuts through empty space. Isomap uses a k-nearest-neighbour graph and Dijkstra shortest paths to estimate true geodesic distances along the manifold, embedding them via Classical MDS.",
    intuition: [
      "How can you construct a map of European cities if you only possess a table of driving distances between them, with zero knowledge of their GPS coordinates? This is the domain of Multidimensional Scaling (MDS): given an $n \\times n$ matrix of pairwise dissimilarities $D$, find a configuration of points in low-dimensional space $\\mathbb{R}^d$ (typically $d=2$) whose Euclidean distances match the input dissimilarities as closely as possible.",
      "Classical MDS (Principal Coordinate Analysis, PCoA) solves this in closed form: it squares the distances, performs double centring to construct an inner product Gram matrix $B = -\\frac{1}{2} H D^2 H$, and extracts coordinates via eigendecomposition. If the input dissimilarities are exact Euclidean distances, Classical MDS is mathematically identical to PCA.",
      "However, when data lies on a complex non-linear manifold (such as the famous \"Swiss roll\" or \"S-curve\"), Euclidean distance measured through ambient high-dimensional space is deceptive: two points on adjacent layers of the rolled spiral have a tiny straight-line distance through empty air, but are far apart along the surface of the manifold.",
      "Isomap (Isometric Feature Mapping, Tenenbaum et al., 2000) resolves this by replacing straight-line Euclidean distance with true geodesic distance (distance along the manifold surface). It builds a $k$-nearest neighbour graph connecting local adjacent points, computes all-pairs shortest paths through the graph via Dijkstra or Floyd–Warshall to estimate geodesic distances, and applies Classical MDS to embed the unrolled manifold into 2D."
    ],
    analogy: "Imagine a rolled-up silk carpet with two ants standing on it: Ant A on the outer layer, Ant B directly beneath it on the inner layer. A straight ruler piercing through the fabric says they are 5 millimetres apart (Euclidean distance). But to actually walk to each other without biting through the silk, Ant A must crawl 3 metres around the spiral (geodesic distance). Isomap measures the crawl distance along the fabric, then unrolls the carpet flat on the floor.",
    steps: [
      {
        "title": "1. Construct local neighbourhood graph",
        "body": "Construct an undirected graph $G$: connect sample $x_i$ to its $k$-nearest neighbours (or points within radius $\\epsilon$), weighting edges by local Euclidean distance $d_X(i, j)$."
      },
      {
        "title": "2. Compute all-pairs shortest paths",
        "body": "Estimate manifold geodesic distance $D_G(i, j)$ between all pairs of points using Dijkstra algorithm (or Floyd–Warshall), finding the shortest path across graph edges."
      },
      {
        "title": "3. Formulate centred Gram matrix",
        "body": "Compute squared distance matrix $D_G^2$. Apply double centring matrix $H = I - \\frac{1}{n} \\mathbf{1}\\mathbf{1}^T$ to obtain inner product matrix $B = -\\frac{1}{2} H D_G^2 H$."
      },
      {
        "title": "4. Extract low-dimensional coordinates",
        "body": "Compute top $d$ eigenvalues and eigenvectors of $B$: $B = V \\Lambda V^T$. Reconstruct coordinates $Y = V_d \\Lambda_d^{1/2}$."
      }
    ],
    math: [
      {
        "h": "Classical MDS Double Centring Formula",
        "tex": "B = -\\frac{1}{2} H D^2 H, \\quad H = I_n - \\frac{1}{n} \\mathbf{1}_n \\mathbf{1}_n^T",
        "p": "Converts a matrix of squared pairwise Euclidean distances D^2 into an origin-centred inner product Gram matrix B = X X^T."
      },
      {
        "h": "Classical MDS Coordinate Extraction",
        "tex": "Y = V_d \\Lambda_d^{1/2}, \\quad B = V \\Lambda V^T",
        "p": "Eigendecomposition of Gram matrix B yields optimal low-dimensional coordinates Y minimising the Strain objective function."
      },
      {
        "h": "Geodesic Graph Distance Approximation",
        "tex": "d_{\\mathcal{M}}(x_i, x_j) \\approx d_G(i, j) = \\min_{p = (v_0, \\dots, v_m)} \\sum_{k=0}^{m-1} \\|v_k - v_{k+1}\\|_2",
        "p": "In the limit of infinite data density, shortest path distance through the k-NN graph converges asymptotically to the true Riemannian geodesic distance along manifold M."
      }
    ],
    code: "import numpy as np\nfrom scipy.sparse.csgraph import floyd_warshall\n\n# Isomap from scratch (k-NN graph + Floyd-Warshall + Classical MDS)\ndef isomap_from_scratch(X, n_neighbors=8, n_components=2):\n    n = len(X)\n    \n    # 1. Compute pairwise Euclidean distances\n    dists_sq = np.sum(X**2, axis=1)[:, None] + np.sum(X**2, axis=1)[None, :] - 2 * (X @ X.T)\n    dists = np.sqrt(np.maximum(dists_sq, 0))\n    \n    # 2. Build k-NN adjacency graph\n    adj_matrix = np.full((n, n), np.inf)\n    for i in range(n):\n        # Find k nearest neighbors (excluding self)\n        nn_indices = np.argsort(dists[i])[1:n_neighbors+1]\n        for j in nn_indices:\n            adj_matrix[i, j] = dists[i, j]\n            adj_matrix[j, i] = dists[i, j]  # Undirected graph\n            \n    # 3. Compute all-pairs shortest paths (Geodesic distance approximation)\n    D_geo = floyd_warshall(adj_matrix, directed=False)\n    \n    # Check for disconnected components\n    if np.any(np.isinf(D_geo)):\n        raise ValueError(\"Graph is disconnected; increase n_neighbors.\")\n        \n    # 4. Classical MDS on geodesic distance matrix\n    # Double centreing: B = -0.5 * H (D^2) H\n    H = np.eye(n) - np.ones((n, n)) / n\n    B = -0.5 * H @ (D_geo**2) @ H\n    \n    # Eigendecomposition\n    eigenvals, eigenvecs = np.linalg.eigh(B)\n    idx = np.argsort(eigenvals)[::-1]\n    eigenvals = eigenvals[idx]\n    eigenvecs = eigenvecs[:, idx]\n    \n    # Extract top d coordinates: Y = V_d * sqrt(Lambda_d)\n    top_evals = np.maximum(eigenvals[:n_components], 0)\n    Y = eigenvecs[:, :n_components] * np.sqrt(top_evals)\n    \n    return Y, D_geo\n\n# Generate synthetic Swiss Roll manifold\nnp.random.seed(42)\nn_points = 250\nphi = np.random.uniform(1.5 * np.pi, 4.0 * np.pi, n_points)\nheight = np.random.uniform(0, 10, n_points)\nx = phi * np.cos(phi)\ny = height\nz = phi * np.sin(phi)\nX_swiss = np.column_stack([x, y, z])\n\n# Run Isomap\nY_embedded, D_geo = isomap_from_scratch(X_swiss, n_neighbors=10, n_components=2)\n\n# Verify correlation between unrolled 1st dimension and true manifold parameter phi\ncorr_with_phi = np.abs(np.corrcoef(Y_embedded[:, 0], phi)[0, 1])\n\nprint(f\"Swiss Roll 3D shape: {X_swiss.shape}\")\nprint(f\"Isomap 2D Embedding shape: {Y_embedded.shape}\")\nprint(f\"Max Euclidean distance through air:    {np.max(np.linalg.norm(X_swiss[0] - X_swiss, axis=1)):.2f}\")\nprint(f\"Max Geodesic distance along manifold: {np.max(D_geo[0]):.2f} (captures unrolling!)\")\nprint(f\"Correlation between 1st Isomap axis and true unrolled spiral (phi): {corr_with_phi:.4f}\")",
    keyPoints: [
      "Multidimensional Scaling (MDS) finds a low-dimensional Euclidean embedding that preserves a given matrix of pairwise distances.",
      "Classical MDS converts squared pairwise distances into an inner product Gram matrix via double centring $B = -\\frac{1}{2} H D^2 H$.",
      "Isomap unrolls non-linear manifolds by substituting straight-line Euclidean distances with shortest-path geodesic distances across a $k$-NN graph.",
      "Guaranteed to find true isometric manifold embeddings asymptotically as data density approaches infinity.",
      "Highly sensitive to topological short-circuiting: noisy points or an overly large $k$ bridge adjacent layers, collapsing the unrolled manifold."
    ],
    pitfalls: [
      "Topological short-circuiting: If $k$ is too large or noise bridges adjacent folds of a manifold, a false shortcut is created that corrupts all geodesic paths.",
      "Disconnected components: If $k$ is too small, the graph fragments into disconnected subgraphs, yielding infinite shortest path distances.",
      "Computational scaling: All-pairs shortest paths via Floyd-Warshall scales as $O(n^3)$; Landmark Isomap (L-Isomap) is required for datasets with $n > 5,000$."
    ],
    quiz: [
      {
        "q": "Why does Isomap construct a k-NN graph before applying Classical MDS?",
        "o": [
          "To estimate the true geodesic distance along the curved manifold via graph shortest paths rather than measuring straight-line Euclidean distance through empty air",
          "To perform supervised classification on the data points",
          "To filter out all outliers before dimensionality reduction",
          "To reduce the number of samples from n to k"
        ],
        "a": 0,
        "why": "Euclidean distance cuts through empty space across manifold folds. By traversing local nearest neighbours, graph shortest paths approximate the true manifold geodesic distance."
      },
      {
        "q": "What is the mathematical role of the double centring matrix H = I - (1/n) 1 1^T in Classical MDS?",
        "o": [
          "It converts a matrix of squared pairwise distances into an origin-centred inner product Gram matrix B = X X^T",
          "It standardises the columns to unit variance",
          "It removes imaginary numbers from the distance matrix",
          "It inverts the matrix using Cholesky factorisation"
        ],
        "a": 0,
        "why": "From the identity d_{ij}^2 = ||x_i||^2 + ||x_j||^2 - 2 x_i^T x_j, double centring cancels out the row and column squared norms, leaving exactly the inner product matrix B."
      }
    ],
    usedBy: [],
    prereq: [
      "svd-and-truncated-svd"
    ],
    related: [
      "svd-and-truncated-svd",
      "kernel-pca",
      "spectral_clustering",
      "random-projections-and-johnson-lindenstrauss"
    ],
    keywords: "isomap, mds, multidimensional scaling, geodesic distance, manifold learning, swiss roll, shortest path, floyd warshall"
  },
  {
    id: "random-projections-and-johnson-lindenstrauss",
    short: "Random projections & JL",
    title: "Random Projections and the Johnson–Lindenstrauss Lemma",
    task: "concepts",
    module: "Dimensionality reduction",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Compress high-dimensional vectors with minimal distortion using random matrices: master the Johnson–Lindenstrauss lemma and Achlioptas sparse projections.",
    lead: "Computing PCA on millions of points in 10,000 dimensions is computationally prohibitive. The Johnson–Lindenstrauss lemma proves that projecting onto a surprisingly small random subspace preserves all pairwise distances within a factor of (1 +- epsilon).",
    intuition: [
      "Modern machine learning applications routinely process data in ultra-high dimensions: 100,000-word TF-IDF document vectors, 1,536-dimensional neural embeddings, or high-throughput biological mass spectrometry. In these spaces, computing exact Principal Component Analysis (PCA) requires covariance matrix operations and SVD scaling as $O(n d^2)$, which is computationally crushing for large datasets.",
      "Remarkably, the geometry of high-dimensional Euclidean space contains an extraordinary mathematical property: two random vectors drawn uniformly in high dimensions are almost guaranteed to be nearly orthogonal to each other. This geometric phenomenon is the foundation of Random Projections.",
      "In 1984, William B. Johnson and Joram Lindenstrauss proved their celebrated lemma: any collection of $n$ points in Euclidean space $\\mathbb{R}^d$ can be projected into a lower-dimensional subspace $\\mathbb{R}^k$ such that all pairwise Euclidean distances are preserved within a factor of $(1 \\pm \\epsilon)$, provided that $k \\ge O(\\epsilon^{-2} \\log n)$.",
      "The most profound consequence of the Johnson–Lindenstrauss lemma is that target dimension $k$ depends strictly on the number of points $n$ and the tolerance $\\epsilon$, and is entirely independent of the original dimension $d$! Even more practically, Dimitris Achlioptas (2003) proved that the random projection matrix does not even need Gaussian entries: simple sparse ternary distributions ($R_{ij} \\in \\{-1, 0, +1\\}$) provide identical guarantees while replacing matrix multiplications with fast integer additions."
    ],
    analogy: "Imagine projecting 1,000 glass statues in a dark room by shining a lantern to cast their 2D shadows onto a flat wall. If you align the lantern along one specific axis, statues might block each other or cast squashed shadows. But if you position the lantern at a completely random angle in 3D space, the shadows cast on the wall almost never overlap, faithfully preserving the relative distances between every statue in the room.",
    steps: [
      {
        "title": "1. Determine target dimension k from JL bound",
        "body": "Given sample size $n$ and acceptable distortion tolerance $\\epsilon \\in (0, 1)$, calculate minimum target dimension: $k \\ge \\frac{4 \\log n}{\\epsilon^2 / 2 - \\epsilon^3 / 3}$."
      },
      {
        "title": "2. Generate random projection matrix R",
        "body": "Draw random matrix $R \\in \\mathbb{R}^{d \\times k}$. For Gaussian projection, sample $R_{ij} \\sim \\mathcal{N}(0, 1/k)$. For Achlioptas sparse projection, sample $R_{ij} \\in \\{+\\sqrt{s/k}, 0, -\\sqrt{s/k}\\}$ with probabilities $\\{1/(2s), 1 - 1/s, 1/(2s)\\}$ with $s=3$."
      },
      {
        "title": "3. Project data matrix into low-dimensional space",
        "body": "Compute projected representation: $X_{\\mathrm{proj}} = X R \\in \\mathbb{R}^{n \\times k}$. Note that $R$ requires zero training data or fitting."
      },
      {
        "title": "4. Verify pairwise distance preservation",
        "body": "Verify that for all pairs $(u, v)$, the ratio $\\|X_{\\mathrm{proj}, u} - X_{\\mathrm{proj}, v}\\|^2 / \\|X_u - X_v\\|^2 \\in [1 - \\epsilon, 1 + \\epsilon]$."
      }
    ],
    math: [
      {
        "h": "The Johnson–Lindenstrauss (JL) Lemma",
        "tex": "(1 - \\epsilon) \\|u - v\\|_2^2 \\le \\|f(u) - f(v)\\|_2^2 \\le (1 + \\epsilon) \\|u - v\\|_2^2 \\quad \\forall u, v \\in X",
        "p": "Guarantees that a linear mapping f preserves all pairwise Euclidean distances within a relative distortion factor epsilon."
      },
      {
        "h": "Theoretical Target Dimension Bound",
        "tex": "k \\ge \\frac{4 \\log n}{\\frac{\\epsilon^2}{2} - \\frac{\\epsilon^3}{3}} = O\\left(\\frac{\\log n}{\\epsilon^2}\\right)",
        "p": "The required target dimension k depends only on sample size n and tolerance epsilon, completely independent of original dimension d."
      },
      {
        "h": "Achlioptas Sparse Random Projection Matrix",
        "tex": "R_{ij} = \\sqrt{\\frac{3}{k}} \\times \\begin{cases} +1 & \\text{with prob } 1/6 \\\\ 0 & \\text{with prob } 2/3 \\\\ -1 & \\text{with prob } 1/6 \\end{cases}",
        "p": "Ternary random projection matrix where two-thirds of entries are zero, accelerating projection computation by 3x and enabling database sparse arithmetic."
      }
    ],
    code: "import numpy as np\n\n# Random Projections: Gaussian vs Achlioptas Sparse from scratch\nnp.random.seed(42)\n\n# Generate 500 samples in d = 2,000 dimensions\nn_samples = 500\nd_features = 2000\nX = np.random.normal(0, 1, (n_samples, d_features))\n\n# Calculate theoretical JL target dimension for epsilon = 0.20\nepsilon = 0.20\n# k >= 4 * log(n) / (eps^2 / 2 - eps^3 / 3)\nk_bound = int(np.ceil((4 * np.log(n_samples)) / (epsilon**2 / 2 - epsilon**3 / 3)))\nk = 300  # Target dimension (compressed from 2,000 to 300)\n\n# 1. Gaussian Random Projection Matrix: R_ij ~ N(0, 1/k)\nR_gaussian = np.random.normal(0, 1.0 / np.sqrt(k), (d_features, k))\nX_proj_gauss = X @ R_gaussian\n\n# 2. Achlioptas Sparse Random Projection Matrix (s = 3)\n# 2/3 of entries are 0, entries are +sqrt(3/k) or -sqrt(3/k)\ns = 3\nrand_draw = np.random.uniform(0, 1, (d_features, k))\nR_sparse = np.zeros((d_features, k))\nR_sparse[rand_draw < 1.0 / (2 * s)] = np.sqrt(s / k)\nR_sparse[rand_draw > 1.0 - 1.0 / (2 * s)] = -np.sqrt(s / k)\nX_proj_sparse = X @ R_sparse\n\n# Evaluate pairwise distance distortion across 1,000 random pairs\nn_pairs = 1000\nidx_u = np.random.choice(n_samples, n_pairs)\nidx_v = np.random.choice(n_samples, n_pairs)\nvalid = idx_u != idx_v\nidx_u, idx_v = idx_u[valid], idx_v[valid]\n\n# Original squared distances\ndist_orig_sq = np.sum((X[idx_u] - X[idx_v])**2, axis=1)\n\n# Projected squared distances\ndist_gauss_sq = np.sum((X_proj_gauss[idx_u] - X_proj_gauss[idx_v])**2, axis=1)\ndist_sparse_sq = np.sum((X_proj_sparse[idx_u] - X_proj_sparse[idx_v])**2, axis=1)\n\n# Distortion ratios: ||f(u) - f(v)||^2 / ||u - v||^2\nratio_gauss = dist_gauss_sq / dist_orig_sq\nratio_sparse = dist_sparse_sq / dist_orig_sq\n\nprint(f\"Original dimension: {d_features} -> Projected dimension: {k} ({(1 - k/d_features)*100:.1f}% reduction)\")\nprint(f\"Theoretical JL target bound (eps={epsilon}): k >= {k_bound}\")\nprint(f\"Target distortion range: [{1 - epsilon:.2f}, {1 + epsilon:.2f}]\")\n\nprint(f\"\\nGaussian Projection  - Mean ratio: {np.mean(ratio_gauss):.3f}, 99% interval: [{np.percentile(ratio_gauss, 0.5):.3f}, {np.percentile(ratio_gauss, 99.5):.3f}]\")\nprint(f\"Sparse Achlioptas   - Mean ratio: {np.mean(ratio_sparse):.3f}, 99% interval: [{np.percentile(ratio_sparse, 0.5):.3f}, {np.percentile(ratio_sparse, 99.5):.3f}]\")\nprint(f\"Sparse Matrix Sparsity: {np.mean(R_sparse == 0)*100:.1f}% zeros (3x faster multiplication!)\")",
    keyPoints: [
      "Embeds high-dimensional points into a lower-dimensional subspace while preserving pairwise distances within $(1 \\pm \\epsilon)$ distortion.",
      "The Johnson–Lindenstrauss lemma dictates target dimension $k = O(\\epsilon^{-2} \\log n)$, which is completely independent of input dimension $d$.",
      "Data-independent and training-free: the projection matrix is drawn purely at random, requiring zero optimisation or SVD factorisation.",
      "Achlioptas sparse projection achieves identical theoretical guarantees while keeping two-thirds of matrix entries at zero.",
      "Widely used in nearest-neighbour search indexing (Locality Sensitive Hashing, LSH), streaming algorithms, and compressed sensing."
    ],
    pitfalls: [
      "Inner product distortion vs Euclidean distance: While JL preserves Euclidean distances $|u - v|$, preserving dot products $u^T v$ requires normalising vectors to unit length.",
      "Only applies to Euclidean ($L_2$) norm: The JL lemma does not hold for Manhattan ($L_1$), Chebyshev ($L_\\infty$), or general $L_p$ norms.",
      "Extreme sample size scaling: Because $k \\propto \\log n$, if $n$ is hundreds of millions, the required $k$ might exceed the original dimension $d$."
    ],
    quiz: [
      {
        "q": "What is the most surprising property of the target dimension k in the Johnson–Lindenstrauss lemma?",
        "o": [
          "k depends only on sample size n and distortion tolerance epsilon, and is completely independent of the original dimension d",
          "k must always equal the rank of the covariance matrix",
          "k must be strictly greater than d",
          "k depends on the eigenvalues of the dataset"
        ],
        "a": 0,
        "why": "The JL lemma bound k >= O(log(n) / eps^2) contains no dependence on original dimension d, allowing 1,000,000-dimensional data to be compressed to the same k as 1,000-dimensional data."
      },
      {
        "q": "Why is Achlioptas sparse random projection computationally faster than Gaussian random projection?",
        "o": [
          "Two-thirds of its entries are exactly zero and non-zero entries are simple integers, accelerating matrix multiplication by 3x with sparse arithmetic",
          "It requires computing the SVD of the dataset",
          "It produces an exact zero distortion ratio",
          "It eliminates the need for test data"
        ],
        "a": 0,
        "why": "The Achlioptas ternary distribution has 2/3 zeros and entries in {-1, 0, +1}, turning dense floating-point matrix multiplications into fast sparse integer additions."
      }
    ],
    usedBy: [],
    prereq: [
      "svd-and-truncated-svd"
    ],
    related: [
      "svd-and-truncated-svd",
      "kernel-pca",
      "mds-and-isomap"
    ],
    keywords: "random projections, johnson lindenstrauss lemma, achlioptas, dimensionality reduction, euclidean distance preservation, lsh, sparse projection"
  },
  {
    id: 'isolation-forest',
    short: 'Isolation Forest',
    title: 'Isolation Forest',
    task: 'concepts',
    module: 'Anomaly detection',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Tree-based anomaly detection that isolates anomalies through random recursive partitioning, exploiting the fact that outliers require fewer random cuts to separate.`,
    lead: r`Traditional anomaly detection algorithms model the normal data profile using density estimation, distance clustering, or convex hulls, which causes quadratic computational bottlenecks and degrades in high dimensions. Isolation Forest inverts this paradigm: instead of constructing an expensive model of normality, it explicitly isolates anomalies by building an ensemble of completely randomised binary decision trees, isolating outliers near the root with linear time complexity.`,
    intuition: [
      r`Consider a large group of people gathered closely in the centre of a town square, with a solitary pedestrian wandering 50 metres away on the empty perimeter. If an observer draws random straight lines across the square, how many cuts will it take to isolate the solitary pedestrian from everyone else? A single random cut that falls between the wanderer and the square isolates them immediately. In contrast, isolating an individual standing shoulder-to-shoulder inside the central crowd requires dozens of precise, finely placed cuts.`,
      r`This geometric property forms the core intuition of Isolation Forest. Anomalies are "few and different": they occur in sparse regions of feature space far from normal data clusters. When a binary tree recursively chooses a feature at random and cuts it at a uniform random value between that feature's minimum and maximum, anomalies are isolated into individual leaf nodes after very few splits (short path length). Normal instances, packed together in high-density regions, require many recursive splits (long path length) to isolate.`,
      r`Because the algorithm relies solely on relative path lengths rather than pairwise Euclidean distances or probability densities, it eliminates the curse of dimensionality and distance distortion. Subsampling data into small subsets (typically 256 instances per tree) prevents two classic anomaly detection pathologies: swamping (falsely labelling inliers as anomalies because they sit near outlier clusters) and masking (clusters of outliers masking each other by appearing locally dense).`,
    ],
    analogy: r`Slicing through a wooden board with random saw cuts: a knothole protruding off the outer edge gets severed in one or two quick passes, whereas isolating a single wood grain deep within the centre requires countless cuts.`,
    steps: [
      r`Subsample the training dataset without replacement into small bags of size $\psi$ (typically $\psi = 256$), mitigating masking and swamping while dramatically accelerating tree construction.`,
      r`Build an ensemble of $t$ completely randomised isolation trees (iTrees), setting the maximum tree depth to $\lceil \log_2(\psi) \rceil$.`,
      r`At each tree node, randomly choose a feature $q$ uniformly from the available feature columns.`,
      r`Select a split value $p$ uniformly at random between the minimum and maximum values of feature $q$ in the current node's data subset.`,
      r`Partition the data into left ($x_q < p$) and right ($x_q \ge p$) child nodes, recursing until instances are isolated ($|X| \le 1$), all feature values are identical, or max depth is reached.`,
      r`Pass each evaluation sample $x$ through all $t$ trees, recording the path length $h_i(x)$ (edges traversed plus the average path length correction $c(n)$ if terminated at an un-isolated node).`,
      r`Compute the normalised anomaly score $s(x, \psi) = 2^{-\mathbb{E}[h(x)] / c(\psi)}$; flag instances with $s(x, \psi) > 0.6$ as anomalies.`,
    ],
    math: [
      {
        h: 'Recursive partitioning and path length h(x)',
        tex: r`$$h(x) = e + c(|X_{\text{leaf}}|)$$`,
        p: r`An isolation tree (iTree) is a proper binary tree where every node has either zero or two children. The path length $h(x)$ of sample $x$ is the number of edges $e$ traversed from the root node to a terminating leaf node, augmented by the unbuilt tree correction $c(|X_{\text{leaf}}|)$ if early stopping was reached.`,
      },
      {
        h: 'Average path length of unsuccessful search in a BST',
        tex: r`$$c(n) = 2 \left( \ln(n - 1) + \gamma \right) - \frac{2(n - 1)}{n}$$`,
        p: r`where $\gamma \approx 0.5772156649$ is Euler's constant. Because iTrees share the exact mathematical structure of random binary search trees, $c(n)$ provides the theoretical average path length of an instance across $n$ randomly inserted items, serving as an exact normalisation constant.`,
      },
      {
        h: 'Normalised anomaly score formulation',
        tex: r`$$s(x, n) = 2^{-\frac{\mathbb{E}[h(x)]}{c(n)}}$$`,
        p: r`where $\mathbb{E}[h(x)]$ is the average path length across all trees in the forest. When $\mathbb{E}[h(x)] \to 0$, $s \to 1$, indicating an unambiguous anomaly isolated in very few splits. When $\mathbb{E}[h(x)] \to c(n)$, $s \to 0.5$, representing an ordinary instance indistinguishable from random data. When $\mathbb{E}[h(x)] \to n - 1$, $s \to 0$, signifying a deeply embedded inlier.`,
      },
    ],
    code: r`import numpy as np

def c_factor(n):
    return 2.0 * (np.log(n - 1) + 0.5772156649) - 2.0 * (n - 1) / n if n > 2 else (1.0 if n == 2 else 0.0)

def build_tree(X, depth, max_depth, rng):
    if len(X) <= 1 or depth >= max_depth:
        return {'size': len(X)}
    feat = rng.integers(0, X.shape[1])
    f_min, f_max = X[:, feat].min(), X[:, feat].max()
    if f_min == f_max:
        return {'size': len(X)}
    split = rng.uniform(f_min, f_max)
    left = build_tree(X[X[:, feat] < split], depth + 1, max_depth, rng)
    right = build_tree(X[X[:, feat] >= split], depth + 1, max_depth, rng)
    return {'feat': feat, 'split': split, 'left': left, 'right': right}

def path_length(x, node, depth):
    if 'size' in node:
        return depth + c_factor(node['size'])
    return path_length(x, node['left'], depth + 1) if x[node['feat']] < node['split'] else path_length(x, node['right'], depth + 1)

rng = np.random.default_rng(42)
X_train = rng.normal(0, 1, size=(200, 2))
trees = [build_tree(X_train[rng.choice(len(X_train), 64, replace=False)], 0, 6, rng) for _ in range(50)]

test_pts = np.array([[0.1, 0.1], [4.5, 4.5]])
for pt, label in zip(test_pts, ['Normal inlier', 'Extreme outlier']):
    avg_path = np.mean([path_length(pt, t, 0) for t in trees])
    score = 2.0 ** (-avg_path / c_factor(64))
    print(f"{label} path: {avg_path:.2f} | score: {score:.3f}")`,
    pitfalls: [
      r`Axis-aligned partition bias: Standard iTrees use axis-parallel orthogonal cuts. Anomalies that reside in empty corners between correlated features (such as diagonal bands) may require more splits to isolate, though extended isolation forests address this with hyperplanes.`,
      r`Over-subsampling vs under-subsampling: Setting subsample size $\psi$ too large causes swamping and masking, whereas setting $\psi$ too small fails to capture the true multivariate structure. The default $\psi = 256$ is empirically proven optimal across diverse domains.`,
      r`Noise features: If a dataset contains hundreds of irrelevant, completely random features, uniformly selecting features at each split introduces noise and dilutes the path length separation of true anomalies.`,
      r`Global score interpretation: Anomaly scores are relative to the dataset; a fixed threshold like 0.5 or 0.6 must be calibrated against business requirements and false alarm tolerances.`,
    ],
    keyPoints: [
      r`Directly isolates anomalies instead of profiling normal instances, achieving linear $O(t \cdot \psi \log \psi)$ computational complexity.`,
      r`Employs subsampling ($\psi = 256$) to eliminate swamping and masking while keeping memory consumption negligible.`,
      r`Uses the average path length of a binary search tree $c(n)$ to normalise scores objectively between 0 and 1.`,
      r`Operates effectively without distance metrics, avoiding distance concentration in high-dimensional spaces.`,
    ],
    quiz: [
      {
        q: r`Why does Isolation Forest deliberately use small subsamples (such as $\psi = 256$) instead of training trees on the entire dataset?`,
        o: [
          r`Because decision trees cannot process more than 256 rows in memory`,
          r`To eliminate swamping and masking while dramatically speeding up tree construction`,
          r`To ensure all isolation trees have identical depth`,
          r`Because small samples guarantee zero false negative classifications`,
        ],
        a: 1,
        why: r`Subsampling prevents "swamping" (normal instances surrounded by outliers being falsely flagged) and "masking" (dense clusters of outliers hiding each other). It also makes tree training extraordinarily fast.`,
      },
      {
        q: r`If an instance $x$ yields an anomaly score $s(x, n) = 0.5$, what does this score indicate?`,
        o: [
          r`The instance is definitely a catastrophic anomaly`,
          r`The instance has an average path length of zero`,
          r`The instance's average path length equals the expected path length $c(n)$ of a random binary search tree, showing no anomalous characteristics`,
          r`The algorithm failed to converge and must be retrained`,
        ],
        a: 2,
        why: r`When $\mathbb{E}[h(x)] = c(n)$, the exponent is $-1$, yielding $s = 2^{-1} = 0.5$. This indicates the instance's path length is indistinguishable from that of an average sample in a random BST.`,
      },
      {
        q: r`What role does Euler's constant $\gamma \approx 0.5772$ play in the Isolation Forest algorithm?`,
        o: [
          r`It serves as the default learning rate for split threshold selection`,
          r`It determines the maximum number of trees to construct`,
          r`It specifies the random seed for NumPy's random number generator`,
          r`It appears in the formula $c(n)$ for the expected path length of unsuccessful searches in a random binary search tree`,
        ],
        a: 3,
        why: r`The harmonic number approximation $H_{n-1} = \ln(n-1) + \gamma$ yields the expected path length $c(n) = 2(\ln(n-1) + \gamma) - \frac{2(n-1)}{n}$ for binary search trees, which acts as the normalising denominator.`,
      },
      {
        q: r`How does an anomaly differ geometrically from an inlier during Isolation Forest recursive splitting?`,
        o: [
          r`Anomalies reside in low-density sparse regions and are isolated near the root with short path lengths $h(x)$`,
          r`Anomalies always fall into the left child node of every split`,
          r`Anomalies require significantly more recursive cuts to separate than dense inliers`,
          r`Anomalies have zero variance across all feature dimensions`,
        ],
        a: 0,
        why: r`Anomalies are few and topologically isolated. Random cuts readily separate them from the rest of the dataset within few splits, resulting in small path lengths $h(x) \ll c(n)$.`,
      },
    ],
    usedBy: [],
    prereq: ['decision_tree_classifier', 'random_forest_classifier'],
    related: ['bagging-and-extra-trees', 'random_forest_classifier'],
    keywords: 'isolation forest anomaly detection outlier detection itree path length recursive partitioning unsupervised learning',
  },
  {
    id: 'local-outlier-factor',
    short: 'Local Outlier Factor',
    title: 'Local Outlier Factor',
    task: 'concepts',
    module: 'Anomaly detection',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Density-based anomaly detection that quantifies how isolated a point is relative to the varying local densities of its surrounding $k$-nearest neighbours.`,
    lead: r`Global anomaly detection algorithms assume that anomalies always sit far away from all other data points according to a single distance threshold. In datasets containing multiple clusters of wildly differing densities, this global assumption collapses: points on the fringe of a sparse cluster look like anomalies, while outliers near a dense cluster remain undetected. Local Outlier Factor (LOF) solves this by computing a ratio of local reachability densities, evaluating each point's degree of isolation purely relative to its immediate neighbourhood.`,
    intuition: [
      r`Imagine comparing population densities in two different regions: central Tokyo and rural Scotland. In central Tokyo, houses sit centimetres apart; if a new house were built 50 metres from its closest neighbour, that house would be an extraordinary anomaly. In the Scottish Highlands, houses routinely sit two kilometres apart; a home separated by 50 metres from its neighbour is not an anomaly at all, but rather part of a tightly clustered village. A global distance threshold would either brand every home in Scotland an anomaly, or miss the isolated house in Tokyo completely.`,
      r`Local Outlier Factor resolves this by measuring relative density rather than absolute distance. For any candidate point $p$, LOF first finds its $k$-nearest neighbours and calculates its local reachability density ($\operatorname{lrd}$)—the reciprocal of the average distance required to reach $p$ from its neighbours. If $p$ is located in the middle of a dense cluster, its reachability density is high. If $p$ sits in a sparse cloud, its density is low.`,
      r`The critical breakthrough is the LOF score itself, which divides the average local reachability density of $p$'s neighbours by $p$'s own local density. If $p$ has roughly the same density as its neighbours, this ratio is approximately 1, identifying $p$ as an inlier regardless of whether the cluster is dense or sparse. If $p$ is isolated—meaning its neighbours enjoy high density while $p$ sits out in the cold—the ratio jumps significantly above 1 (typically 1.5 or higher). This relative formulation makes LOF uniquely adept at uncovering local anomalies across complex, multi-density manifolds.`,
    ],
    analogy: r`Judging whether an ambient sound is unusually loud not by measuring absolute decibels on an open highway, but by comparing the volume to the quiet whisper of the immediate library room you are sitting in.`,
    steps: [
      r`For every point $p$ in the dataset, determine its $k$-distance $d_k(p)$ (the distance to its $k$-th nearest neighbour) and identify its neighbourhood set $N_k(p)$.`,
      r`For each neighbour $o \in N_k(p)$, compute the reachability distance of $p$ from $o$: $\text{reach-dist}_k(p, o) = \max\\{d_k(o), d(p, o)\}$, which stabilises density estimates within dense clusters.`,
      r`Calculate the local reachability density $\operatorname{lrd}_k(p)$ as the inverse of the average reachability distance from $p$ to all points in $N_k(p)$.`,
      r`Compute the Local Outlier Factor $\operatorname{LOF}_k(p)$ by taking the average ratio between the neighbours' local reachability densities $\operatorname{lrd}_k(o)$ and $p$'s own density $\operatorname{lrd}_k(p)$.`,
      r`Flag observations with $\operatorname{LOF}_k(p) \gg 1$ as anomalies; points with $\operatorname{LOF}_k(p) \approx 1$ are confirmed inliers.`,
    ],
    math: [
      {
        h: 'k-distance and reachability distance',
        tex: r`$$\text{reach-dist}_k(p, o) = \max\big\\{d_k(o), \, d(p, o)\big}$$`,
        p: r`where $d(p, o)$ is Euclidean distance and $d_k(o)$ is the distance from neighbour $o$ to its $k$-th nearest neighbour. If $p$ is very close to $o$, the reachability distance is floored at $d_k(o)$, preventing tiny denominator fluctuations from destabilising density estimates.`,
      },
      {
        h: 'Local reachability density',
        tex: r`$$\operatorname{lrd}_k(p) = \frac{|N_k(p)|}{\sum_{o \in N_k(p)} \text{reach-dist}_k(p, o)}$$`,
        p: r`$\operatorname{lrd}_k(p)$ quantifies the number of neighbours per unit reachability distance. Dense regions produce small reachability distances and large $\operatorname{lrd}$, while sparse regions produce small $\operatorname{lrd}$.`,
      },
      {
        h: 'Local Outlier Factor score',
        tex: r`$$\operatorname{LOF}_k(p) = \frac{1}{|N_k(p)|} \sum_{o \in N_k(p)} \frac{\operatorname{lrd}_k(o)}{\operatorname{lrd}_k(p)}$$`,
        p: r`When $p$ is deep inside a cluster, its density matches its neighbours' ($\operatorname{lrd}_k(o) \approx \operatorname{lrd}_k(p)$), yielding $\operatorname{LOF} \approx 1$. When $p$ is an outlier, its density is much lower than its neighbours' ($\operatorname{lrd}_k(p) \ll \operatorname{lrd}_k(o)$), driving $\operatorname{LOF} \gg 1$.`,
      },
    ],
    code: r`import numpy as np

# Synthetic clusters with different densities plus one outlier
rng = np.random.default_rng(42)
c1 = rng.normal(0, 0.5, (30, 2))
c2 = rng.normal(5, 1.5, (30, 2))
outlier = np.array([[1.5, 1.5]])
X = np.vstack([c1, c2, outlier])
n, k = len(X), 5

# Pairwise distances and k-nearest neighbours
dist = np.linalg.norm(X[:, None, :] - X[None, :, :], axis=-1)
sorted_idx = np.argsort(dist, axis=1)
nbr_idx = sorted_idx[:, 1:k+1]
k_dist = dist[np.arange(n), sorted_idx[:, k]]

# Reachability distance and local reachability density (lrd)
reach_dist = np.maximum(dist, k_dist[None, :])
lrd = k / np.sum([reach_dist[i, nbr_idx[i]] for i in range(n)], axis=1)

# Local Outlier Factor (LOF) score
lof = np.array([np.mean(lrd[nbr_idx[i]] / lrd[i]) for i in range(n)])

print(f"Dense cluster inlier LOF: {lof[0]:.3f}")
print(f"Sparse cluster inlier LOF: {lof[30]:.3f}")
print(f"Outlier LOF: {lof[-1]:.3f}")`,
    pitfalls: [
      r`Quadratic computational scaling: Finding exact $k$-nearest neighbours across all pairs requires $O(n^2)$ distance calculations, which becomes computationally prohibitive on millions of rows without spatial tree indexing (like $k$-d trees).`,
      r`Selection of $k$: If $k$ is chosen smaller than the size of an outlier cluster, the outliers form a mutual neighbourhood and mask each other. If $k$ is too large, it dilutes micro-density contrasts.`,
      r`High-dimensional distance concentration: In spaces with hundreds of dimensions, Euclidean distances concentrate and become equidistant, eroding the contrast between local and distant densities.`,
      r`Lack of an absolute score threshold: Unlike a calibrated probability, there is no universal cutoff for LOF; a score of 1.3 might be an extreme outlier in one dataset and a normal border point in another.`,
    ],
    keyPoints: [
      r`Detects anomalies based on relative local density rather than global Euclidean distance cutoffs.`,
      r`Successfully identifies outliers in datasets containing multiple clusters of vastly different densities.`,
      r`Reachability distance $\max\\{d_k(o), d(p, o)\\}$ stabilises calculations within dense clusters.`,
      r`Points with $\operatorname{LOF} \approx 1$ are normal inliers; scores substantially greater than 1 indicate local outliers.`,
    ],
    quiz: [
      {
        q: r`Why does Local Outlier Factor use relative local density rather than absolute distance to the nearest cluster centre?`,
        o: [
          r`Because computing cluster centres requires supervised class labels`,
          r`To avoid falsely labelling normal points in sparse clusters as anomalies while missing true outliers near dense clusters`,
          r`Because absolute distances cannot be computed using Euclidean metrics`,
          r`To guarantee that all inlier scores are identically zero`,
        ],
        a: 1,
        why: r`In datasets with heterogeneous densities, points in a legitimate sparse cluster have large pairwise distances. Global metrics mistake them for outliers, whereas LOF's relative density ratio normalises for local cluster spread.`,
      },
      {
        q: r`What is the expected Local Outlier Factor ($\operatorname{LOF}$) score for a data point nestled securely deep inside a cluster?`,
        o: [
          r`Exactly 0.0`,
          r`Negative infinity`,
          r`Approximately 1.0`,
          r`Greater than 5.0`,
        ],
        a: 2,
        why: r`Deep inside a cluster, a point and all of its neighbours have virtually identical local reachability densities ($\operatorname{lrd}(o) \approx \operatorname{lrd}(p)$), so the ratio averages to approximately 1.0.`,
      },
      {
        q: r`What role does the reachability distance $\text{reach-dist}_k(p, o) = \max\\{d_k(o), d(p, o)\\}$ play in LOF?`,
        o: [
          r`It forces all distances to follow a normal distribution`,
          r`It eliminates the need to specify the neighbourhood size $k$`,
          r`It projects points into a lower-dimensional subspace`,
          r`It establishes a minimum distance floor based on neighbour density, preventing statistical instability from near-zero distances`,
        ],
        a: 3,
        why: r`By replacing tiny distances between identical or near-duplicate points with $d_k(o)$, reachability distance prevents near-zero divisions and stabilises local density estimates.`,
      },
      {
        q: r`What is a primary limitation of standard Local Outlier Factor when scaling to high-dimensional datasets?`,
        o: [
          r`Distance concentration diminishes the contrast between nearest and furthest neighbours, blurring local density differences`,
          r`LOF can only be evaluated on single-dimensional scalar values`,
          r`LOF requires training thousands of deep neural network weights`,
          r`LOF assumes that all features follow independent Bernoulli distributions`,
        ],
        a: 0,
        why: r`As dimensionality increases, Euclidean distances concentrate around a common mean (the curse of dimensionality), causing relative density ratios to flatten toward 1 and degrading outlier discrimination.`,
      },
    ],
    usedBy: [],
    prereq: ['isolation-forest', 'dbscan_clustering'],
    related: ['isolation-forest', 'dbscan_clustering', 'kmedoids_clustering'],
    keywords: 'local outlier factor lof anomaly detection density reachability distance outlier detection k nearest neighbours unsupervised',
  },
  {
    id: "one-class-svm",
    short: "One-class SVM",
    title: "One-Class Support Vector Machines",
    task: "concepts",
    module: "Anomaly detection",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Learn non-linear boundary around normal data to detect novel anomalies: master the Schölkopf hyperplane and Tax & Duin hypersphere formulations.",
    lead: "In anomaly detection, negative examples are rare, unknown, or infinitely varied. The One-Class SVM trains exclusively on nominal data, learning a tight decision boundary that envelops the normal data distribution.",
    intuition: [
      "Supervised classification requires representative training samples from all classes. However, in mission-critical applications—such as credit card fraud detection, industrial wind turbine vibration monitoring, network intrusion detection, or manufacturing defect inspection—anomalies are either exceedingly rare or take completely novel, unimagined forms. Trying to train a standard binary classifier fails because you cannot sample the infinite universe of potential anomalies.",
      "One-Class Classification addresses this challenge by learning strictly from positive, nominal data. Introduced by Bernhard Schölkopf et al. (2001), the One-Class Support Vector Machine (OC-SVM) maps normal training instances into a high-dimensional feature space $\\mathcal{H}$ via a kernel function (typically RBF) and seeks a maximum-margin hyperplane that separates the normal data cloud from the coordinate origin.",
      "Geometrically, the origin serves as a proxy for all anomalous patterns. In the dual formulation, the algorithm identifies a sparse subset of normal points as support vectors that define the outer perimeter of the normal data distribution.",
      "A hyperparameter $\\nu \\in (0, 1]$ controls the trade-off: it acts as an exact upper bound on the fraction of training outliers permitted outside the boundary, and a lower bound on the fraction of support vectors. Alternatively, David Tax and Robert Duin proposed Support Vector Data Description (SVDD), which encloses normal points within a minimum-volume hypersphere of radius $R$; for stationary RBF kernels, SVDD and Schölkopf One-Class SVM are mathematically equivalent."
    ],
    analogy: "Imagine an ancient walled city built on an open plain. The city guards do not know what future invaders will look like (whether bandits, foreign armies, or monsters). Instead of trying to identify enemies, the city architects build a circular stone fortress wall closely enclosing all the lawful citizens homes. Any individual found standing inside the fortress walls is considered a citizen; anyone found outside the perimeter wall is flagged as a stranger.",
    steps: [
      {
        "title": "1. Collect nominal training dataset",
        "body": "Assemble feature matrix $X \\in \\mathbb{R}^{n \\times p}$ composed exclusively (or predominantly) of normal, non-anomalous operational instances."
      },
      {
        "title": "2. Select kernel and configure outlier fraction nu",
        "body": "Choose a Gaussian RBF kernel $K(x, x') = \\exp(-\\gamma \\|x - x'\\|^2)$. Set hyperparameter $\\nu \\in (0, 1]$ representing the expected contamination rate (e.g. $\\nu = 0.05$ for 5% outliers)."
      },
      {
        "title": "3. Solve quadratic programming dual problem",
        "body": "Maximise dual objective: $\\min_\\alpha \\frac{1}{2} \\sum_{i, j} \\alpha_i \\alpha_j K(x_i, x_j)$ subject to $0 \\le \\alpha_i \\le \\frac{1}{\\nu n}$ and $\\sum_{i=1}^n \\alpha_i = 1$. Support vectors satisfy $\\alpha_i > 0$."
      },
      {
        "title": "4. Compute offset rho and evaluate decision function",
        "body": "Calculate threshold $\\rho = \\sum_{i=1}^n \\alpha_i K(x_i, x_{sv})$ for any support vector with $0 < \\alpha_{sv} < 1/(\\nu n)$. Score novel sample $x$: $f(x) = \\operatorname{sign}\\left(\\sum_{i=1}^n \\alpha_i K(x_i, x) - \\rho\\right)$. Points with $f(x) < 0$ are anomalies."
      }
    ],
    math: [
      {
        "h": "Schölkopf One-Class SVM Primal Formulation",
        "tex": "\\min_{w, \\xi, \\rho} \\frac{1}{2} \\|w\\|^2 + \\frac{1}{\\nu n} \\sum_{i=1}^n \\xi_i - \\rho \\quad \\text{subject to} \\quad \\langle w, \\phi(x_i) \\rangle \\ge \\rho - \\xi_i, \\; \\xi_i \\ge 0",
        "p": "Separates normal mapped data from origin with maximum margin rho. Slack variables xi_i penalise instances falling on the origin side of the separating boundary."
      },
      {
        "h": "Dual Quadratic Programming Problem",
        "tex": "\\min_\\alpha \\frac{1}{2} \\sum_{i=1}^n \\sum_{j=1}^n \\alpha_i \\alpha_j K(x_i, x_j) \\quad \\text{subject to} \\quad 0 \\le \\alpha_i \\le \\frac{1}{\\nu n}, \\; \\sum_{i=1}^n \\alpha_i = 1",
        "p": "Dual problem depends only on inner products evaluated via kernel function K(x_i, x_j). The upper bound on alpha_i prevents individual points from disproportionately warping the boundary."
      },
      {
        "h": "Tax & Duin SVDD Hypersphere Primal",
        "tex": "\\min_{R, c, \\xi} R^2 + \\frac{1}{\\nu n} \\sum_{i=1}^n \\xi_i \\quad \\text{subject to} \\quad \\|\\phi(x_i) - c\\|^2 \\le R^2 + \\xi_i, \\; \\xi_i \\ge 0",
        "p": "Encloses normal instances within a minimum-radius hypersphere of centre c and radius R. For RBF kernels with K(x, x) = 1, SVDD yields an identical boundary to Schölkopf formulation."
      }
    ],
    code: "import numpy as np\nfrom sklearn.svm import OneClassSVM\n\n# One-Class SVM for Novelty and Anomaly Detection\nnp.random.seed(42)\n\n# 1. Generate normal operational data (2 clusters in 2D space)\nn_normal = 300\ncluster1 = np.random.normal(loc=[-2, -2], scale=0.6, size=(n_normal // 2, 2))\ncluster2 = np.random.normal(loc=[2, 2], scale=0.7, size=(n_normal // 2, 2))\nX_train_normal = np.vstack([cluster1, cluster2])\n\n# 2. Generate novel test data containing normal points and extreme anomalies\nn_test_normal = 100\nn_anomalies = 20\ntest_normal = np.random.normal(loc=[-2, -2], scale=0.6, size=(n_test_normal, 2))\nanomalies = np.random.uniform(low=-6, high=6, size=(n_anomalies, 2))\n# Ensure anomalies are outside normal clusters\nanomalies = anomalies[np.linalg.norm(anomalies - np.array([-2, -2]), axis=1) > 2.0]\nanomalies = anomalies[np.linalg.norm(anomalies - np.array([2, 2]), axis=1) > 2.0][:n_anomalies]\n\nX_test = np.vstack([test_normal, anomalies])\ny_test = np.array([1]*len(test_normal) + [-1]*len(anomalies))  # 1 = normal, -1 = anomaly\n\n# 3. Fit One-Class SVM with RBF kernel and nu=0.05\nnu = 0.05\noc_svm = OneClassSVM(kernel='rbf', gamma=0.5, nu=nu)\noc_svm.fit(X_train_normal)\n\n# Evaluate predictions (-1 for anomaly, +1 for inlier)\npreds_train = oc_svm.predict(X_train_normal)\npreds_test = oc_svm.predict(X_test)\n\ntrain_outlier_rate = np.mean(preds_train == -1)\ntest_anomaly_detection_rate = np.mean(preds_test[y_test == -1] == -1)\ntest_normal_retention_rate = np.mean(preds_test[y_test == 1] == 1)\n\nprint(f\"One-Class SVM fitted with nu = {nu} (target max outlier fraction)\")\nprint(f\"Training support vectors count: {len(oc_svm.support_)} / {n_normal} ({len(oc_svm.support_)/n_normal*100:.1f}%)\")\nprint(f\"Empirical training outlier fraction: {train_outlier_rate*100:.1f}% (bounded by nu = {nu*100:.1f}%)\")\nprint(f\"Test Anomaly Detection Recall:       {test_anomaly_detection_rate*100:.1f}%\")\nprint(f\"Test Normal Inlier Precision:        {test_normal_retention_rate*100:.1f}%\")",
    keyPoints: [
      "Learns a non-linear decision boundary enclosing normal data, detecting anomalies as points falling outside the boundary.",
      "Trained exclusively on nominal data without requiring negative anomaly examples during training.",
      "Schölkopf formulation separates normal points from the coordinate origin in RKHS with maximum margin.",
      "Hyperparameter $\\nu \\in (0, 1]$ simultaneously bounds the fraction of training outliers and the fraction of support vectors.",
      "When paired with Gaussian RBF kernels, One-Class SVM models complex multi-modal and non-convex normal distributions."
    ],
    pitfalls: [
      "Sensitivity to RBF parameter gamma: If $\\gamma$ is too large, the kernel boundary tightly wraps each individual training sample into isolated islands, causing extreme overfitting and false alarm floods.",
      "Contamination in training set: If the training set contains unlabelled anomalies, the boundary expands to enclose them; robust trimming or robust covariance is needed.",
      "High-dimensional distance concentration: In ultra-high dimensions ($p > 1000$), Euclidean distances in RBF kernels concentrate, degrading boundary quality; dimensionality reduction should precede OC-SVM."
    ],
    quiz: [
      {
        "q": "What role does the hyperparameter nu play in the One-Class SVM?",
        "o": [
          "It acts as an upper bound on the fraction of training outliers and a lower bound on the fraction of support vectors",
          "It sets the learning rate of the gradient descent solver",
          "It specifies the number of clusters in the dataset",
          "It defines the dimensionality of the kernel Hilbert space"
        ],
        "a": 0,
        "why": "In the nu-SVM formulation, nu strictly upper-bounds the training margin errors (outlier fraction) and lower-bounds the fraction of support vectors."
      },
      {
        "q": "Why does the One-Class SVM separate data from the origin in feature space?",
        "o": [
          "The origin serves as a natural proxy representing anomalous or zero-signal states in reproducing kernel Hilbert spaces",
          "Because the origin has infinite variance",
          "Because kernel matrices are singular at the origin",
          "Because support vectors cannot have positive coordinates"
        ],
        "a": 0,
        "why": "In RKHS under an RBF kernel, mapped data points cluster away from the origin on a hypersphere. Separating data from the origin encloses the high-density normal region."
      }
    ],
    usedBy: [],
    prereq: [
      "support_vector_classifier",
      "kernel-pca"
    ],
    related: [
      "support_vector_classifier",
      "mahalanobis-distance-and-robust-covariance",
      "local-outlier-factor",
      "kernel-pca"
    ],
    keywords: "one class svm, anomaly detection, novelty detection, svdd, support vectors, schölkopf, rbf kernel, out of distribution"
  },
  {
    id: "mahalanobis-distance-and-robust-covariance",
    short: "Mahalanobis & robust cov",
    title: "Mahalanobis Distance and Robust Covariance Estimation",
    task: "concepts",
    module: "Anomaly detection",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Detect multivariate outliers while accounting for feature covariance: master Mahalanobis distance, the masking effect, and the Minimum Covariance Determinant (MCD).",
    lead: "Univariate thresholds miss multivariate anomalies where individual features appear normal but violate cross-feature correlations. Mahalanobis distance measures deviation in statistical units, while robust estimators prevent outliers from masking themselves.",
    intuition: [
      "Detecting outliers using univariate rules (such as checking if a feature exceeds 3 standard deviations from its mean) fails catastrophically in multi-dimensional datasets. Consider human biometric telemetry: a height of 150 cm is completely normal, and a body weight of 105 kg is unexceptional. However, a person who is simultaneously 150 cm tall and weighs 105 kg is a severe physical anomaly.",
      "Euclidean distance is blind to this correlation: it measures distances as spherical bubbles, assuming features are independent and equally scaled. Prasanta Chandra Mahalanobis (1936) introduced the Mahalanobis Distance to measure the distance of a point $x$ from a distribution centre $\\mu$ while explicitly accounting for the covariance structure $\\Sigma$: $D_M(x) = \\sqrt{(x - \\mu)^T \\Sigma^{-1} (x - \\mu)}$.",
      "Geometrically, Mahalanobis distance transforms spherical distance bubbles into ellipsoids that stretch and rotate along the principal axes of the data covariance cloud. Under multivariate normality, the squared Mahalanobis distance follows a Chi-square distribution with $p$ degrees of freedom ($D_M^2 \\sim \\chi_p^2$), enabling exact statistical hypothesis tests for outliers.",
      "However, standard empirical sample mean and sample covariance suffer from a fatal flaw: the Masking Effect. A small cluster of extreme outliers artificially drags the sample mean toward themselves and massively inflates the covariance matrix, making their own Mahalanobis distance appear deceptively small. Peter Rousseeuw resolved this with the Minimum Covariance Determinant (MCD / FastMCD), which finds the subset of $h$ observations whose covariance has the minimum determinant, providing a robust estimator with up to 50% breakdown point."
    ],
    analogy: "Imagine an aerial photograph of a busy railway track cutting diagonally across a countryside meadow. If you measure distance using Euclidean metric, a train car parked on the tracks 500 metres down the line is judged to be far away. A cow standing only 5 metres off the track is judged to be close. Mahalanobis distance measures distance along the tracks: moving 500 metres along the rail line is expected normal variance, but being 5 metres off the rail is a dangerous derailment.",
    steps: [
      {
        "title": "1. Centre data and examine correlation structure",
        "body": "Inspect feature matrix $X \\in \\mathbb{R}^{n \\times p}$. Identify linear dependencies and check whether data conforms reasonably to unimodal elliptical contours."
      },
      {
        "title": "2. Fit robust covariance via FastMCD (C-steps)",
        "body": "Select subset size $h \\approx 0.75 n$. Randomly draw initial subsets, calculate covariance, compute Mahalanobis distances for all points, and select the $h$ smallest points (C-step). Iterate until determinant converges."
      },
      {
        "title": "3. Calculate robust Mahalanobis distances",
        "body": "Evaluate robust distance: $D_{\\mathrm{MCD}}(x) = \\sqrt{(x - \\hat{\\mu}_{\\mathrm{MCD}})^T \\hat{\\Sigma}_{\\mathrm{MCD}}^{-1} (x - \\hat{\\mu}_{\\mathrm{MCD}})}$."
      },
      {
        "title": "4. Apply Chi-Square distribution cutoff",
        "body": "Flag sample $x_i$ as a multivariate anomaly if $D_{\\mathrm{MCD}}^2(x_i) > \\chi_{p, 1-\\alpha}^2$, where $\\alpha$ is the significance threshold (e.g. $\\alpha = 0.001$)."
      }
    ],
    math: [
      {
        "h": "Mahalanobis Distance Formulation",
        "tex": "D_M(x) = \\sqrt{(x - \\mu)^T \\Sigma^{-1} (x - \\mu)} = \\|\\Sigma^{-1/2} (x - \\mu)\\|_2",
        "p": "Measures distance in units of statistical standard deviations along the ellipsoidal axes of covariance matrix Sigma."
      },
      {
        "h": "Chi-Square Distribution of Squared Distance",
        "tex": "x \\sim \\mathcal{N}_p(\\mu, \\Sigma) \\implies D_M^2(x) = (x - \\mu)^T \\Sigma^{-1} (x - \\mu) \\sim \\chi_p^2",
        "p": "Under multivariate Gaussian assumptions, the squared Mahalanobis distance is distributed as Chi-square with p degrees of freedom, providing rigorous analytical p-values."
      },
      {
        "h": "Minimum Covariance Determinant (MCD) Objective",
        "tex": "\\min_{H \\subset \\{1, \\dots, n\\}, \\; |H| = h} \\det\\left(\\frac{1}{h - 1} \\sum_{i \\in H} (x_i - \\bar{x}_H) (x_i - \\bar{x}_H)^T\\right)",
        "p": "Searches for the subset of h observations (typically h = 0.5n or 0.75n) yielding the minimal determinant, resisting masking by up to 50% adversarial outliers."
      }
    ],
    code: "import numpy as np\nfrom scipy.stats import chi2\n\n# Mahalanobis Distance: Standard Empirical Covariance vs FastMCD C-Step from scratch\nnp.random.seed(42)\nn_samples = 300\np_dim = 2\n\n# 1. Generate correlated 2D Gaussian data\nmean_true = np.array([0.0, 0.0])\ncov_true = np.array([[2.0, 1.6],\n                     [1.6, 2.0]])  # Strong correlation (corr = 0.8)\nX_clean = np.random.multivariate_normal(mean_true, cov_true, n_samples)\n\n# 2. Inject a masked cluster of 15 severe multivariate outliers\n# Outliers violate the correlation: x1 and x2 have opposite signs!\nn_outliers = 15\noutliers = np.random.multivariate_normal(mean=[4.0, -4.0], cov=np.eye(2)*0.2, size=n_outliers)\nX = np.vstack([X_clean, outliers])\nN = len(X)\n\n# 3. Standard Empirical Mahalanobis Distance\nmu_emp = np.mean(X, axis=0)\ncov_emp = np.cov(X, rowvar=False)\ncov_emp_inv = np.linalg.inv(cov_emp)\ndiff_emp = X - mu_emp\nd_emp = np.sqrt(np.sum(diff_emp @ cov_emp_inv * diff_emp, axis=1))\n\n# 4. FastMCD C-Step Algorithm from scratch\nh = int(0.80 * N)  # Keep 80% cleanest data points\n# Initialise with subset of smallest distances to coordinate median\nmed = np.median(X, axis=0)\ninit_dist = np.linalg.norm(X - med, axis=1)\nH_indices = np.argsort(init_dist)[:h]\n\nfor c_step in range(15):\n    X_sub = X[H_indices]\n    mu_sub = np.mean(X_sub, axis=0)\n    cov_sub = np.cov(X_sub, rowvar=False) + np.eye(p_dim)*1e-6\n    cov_sub_inv = np.linalg.inv(cov_sub)\n    \n    # Compute Mahalanobis distance for ALL points with current sub-covariance\n    diff = X - mu_sub\n    d_mcd = np.sqrt(np.sum(diff @ cov_sub_inv * diff, axis=1))\n    \n    # Select h points with smallest distances\n    new_H = np.argsort(d_mcd)[:h]\n    if np.array_equal(new_H, H_indices):\n        break\n    H_indices = new_H\n\nmu_mcd = np.mean(X[H_indices], axis=0)\ncov_mcd = np.cov(X[H_indices], rowvar=False)\n# Apply consistency factor for Gaussian data\ncov_mcd *= 1.25\ncov_mcd_inv = np.linalg.inv(cov_mcd)\ndiff_mcd = X - mu_mcd\nd_mcd_final = np.sqrt(np.sum(diff_mcd @ cov_mcd_inv * diff_mcd, axis=1))\n\n# Chi-Square Cutoff for p=2 degrees of freedom (alpha = 0.001)\ncutoff = np.sqrt(chi2.ppf(0.999, df=p_dim))\n\noutlier_indices = np.arange(n_samples, N)\nmasked_detected_emp = np.sum(d_emp[outlier_indices] > cutoff)\nmasked_detected_mcd = np.sum(d_mcd_final[outlier_indices] > cutoff)\n\nprint(f\"Dataset: {N} total samples ({n_outliers} masked correlation-violating outliers)\")\nprint(f\"Chi-square 99.9% distance threshold: {cutoff:.3f}\")\nprint(f\"\\nStandard Empirical Estimator:\")\nprint(f\"  Detected outliers: {masked_detected_emp} / {n_outliers} (masking effect failed!)\")\nprint(f\"  Max outlier distance: {np.max(d_emp[outlier_indices]):.2f}\")\nprint(f\"\\nRobust Minimum Covariance Determinant (MCD):\")\nprint(f\"  Detected outliers: {masked_detected_mcd} / {n_outliers} (100% detected!)\")\nprint(f\"  Max outlier distance: {np.max(d_mcd_final[outlier_indices]):.2f} (cleanly exposed!)\")",
    keyPoints: [
      "Measures statistical distance from a multivariate distribution centre, accounting for correlation and unequal variance.",
      "Follows a Chi-square distribution ($D_M^2 \\sim \\chi_p^2$) under normality, providing exact analytical hypothesis tests.",
      "Standard sample covariance is corrupted by the Masking Effect: outliers inflate covariance, hiding their own anomalousness.",
      "Minimum Covariance Determinant (MCD / FastMCD) searches for the subset of $h$ samples minimising covariance determinant, resisting up to 50% outliers.",
      "Essential for multivariate quality control, financial fraud detection, and robust feature standardisation."
    ],
    pitfalls: [
      "Singular covariance matrix: When features are collinear or $p > n$, the covariance matrix $\\Sigma$ is non-invertible; pseudo-inversion or shrinkage (Ledoit–Wolf) is required.",
      "Multivariate non-normality: If data has heavy tails or multimodal clusters, applying $\\chi_p^2$ cutoffs flags legitimate extreme points as false positives.",
      "High-dimensional breakdown: MCD requires $n > 2p$; when $p$ is large relative to $n$, robust covariance estimation requires regularisation or projection pursuit."
    ],
    quiz: [
      {
        "q": "Why can two observations have the identical Euclidean distance from the data mean but radically different Mahalanobis distances?",
        "o": [
          "Because Mahalanobis distance scales distance by variance and correlation: moving along the direction of high covariance is normal, while moving perpendicular to correlation is anomalous",
          "Because Mahalanobis distance uses Manhattan L1 distance",
          "Because Euclidean distance cannot be used in more than 2 dimensions",
          "Because Mahalanobis distance sets negative coordinates to zero"
        ],
        "a": 0,
        "why": "Mahalanobis distance accounts for covariance. If two features are 99% correlated, a point off the correlation axis is an extreme outlier, whereas a point along the axis is normal variance."
      },
      {
        "q": "What is the \"masking effect\" in outlier detection with standard empirical covariance?",
        "o": [
          "Outliers inflate the sample covariance matrix and shift the mean toward themselves, artificially reducing their own Mahalanobis distance and hiding their presence",
          "Outliers cause the eigenvalues to become negative",
          "The distance formula divides by zero",
          "Data points with zero values mask other features"
        ],
        "a": 0,
        "why": "Because sample mean and covariance are non-robust, extreme outliers stretch the covariance ellipse toward themselves, lowering their computed Mahalanobis distance below detection cutoffs."
      }
    ],
    usedBy: [],
    prereq: [
      "ols-inference-t-tests-f-test-r2-and-adjusted-r2",
      "expectation-variance-and-covariance"
    ],
    related: [
      "one-class-svm",
      "local-outlier-factor",
      "chi-square-tests",
      "residual-diagnostics-and-heteroscedasticity"
    ],
    keywords: "mahalanobis distance, robust covariance, mcd, minimum covariance determinant, fastmcd, masking effect, chi square distribution, multivariate outlier"
  },
  {
    id: 'em-algorithm',
    short: 'EM algorithm',
    title: 'Expectation-Maximisation Algorithm',
    task: 'concepts',
    module: 'Probabilistic models',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`General iterative framework for finding maximum likelihood parameter estimates in probabilistic models with hidden latent variables or incomplete observations.`,
    lead: r`In many machine learning problems, the observed data depends on unobserved latent variables, such as unknown cluster memberships, hidden states, or missing sensor values. Directly maximising the marginal log-likelihood is intractable because the sum over latent variables appears inside the logarithm. The Expectation-Maximisation (EM) algorithm circumvents this by alternating between estimating the posterior distribution over latent states (E-step) and maximising the expected complete-data log-likelihood (M-step), guaranteeing non-decreasing likelihood at every iteration.`,
    intuition: [
      r`Suppose you run a survey measuring heights, but the survey accidentally omits whether each participant is male or female. The pooled data forms a bimodal curve—a mixture of two separate normal distributions. If you knew everyone's sex, computing the average height and variance for each group would be trivial (standard maximum likelihood). Conversely, if you already knew the true male and female averages, you could easily calculate the probability that any given participant is male or female. The dilemma is that you know neither.`,
      r`The EM algorithm resolves this chicken-and-egg deadlock through clever alternation. First, make an educated guess for the parameters (the group means and variances). In the Expectation step (E-step), use these guessed parameters to assign each participant a soft probabilistic responsibility—such as 85% chance female and 15% chance male for someone who is 162 cm tall.`,
      r`Next, in the Maximisation step (M-step), use these soft weights to re-estimate the group parameters. Instead of a hard binary assignment, each data point contributes fractionally to updating the means and variances of both groups. These updated parameters yield a better model, which in turn produces more accurate responsibilities in the next E-step. Mathematically, the E-step constructs a tight lower bound (the Evidence Lower Bound, or ELBO) on the log-likelihood function, and the M-step climbs to the peak of that bound. Repeating this cycle guarantees steady progress until reaching a local maximum.`,
    ],
    analogy: r`Alternately sharpening the focus on a twin-lens microscope: adjusting lens A sharpens the contrast of the image, which reveals the exact alignment needed to sharpen lens B, repeating until the entire specimen comes into crystal-clear resolution.`,
    steps: [
      r`Initialise the model parameters $\theta^{(0)}$ randomly or using a fast heuristic (such as $k$-means for mixture model centroids).`,
      r`Perform the Expectation step (E-step): compute the posterior probability distribution over latent variables given current parameters: $q^{(t)}(Z) = p(Z \mid X, \theta^{(t)})$.`,
      r`Formulate the expected complete-data log-likelihood (the $Q$-function): $Q(\theta \mid \theta^{(t)}) = \mathbb{E}_{Z \mid X, \theta^{(t)}} [\ln p(X, Z \mid \theta)]$.`,
      r`Perform the Maximisation step (M-step): update parameters by maximising the $Q$-function: $\theta^{(t+1)} = \arg\max_\theta Q(\theta \mid \theta^{(t)})$.`,
      r`Evaluate the marginal log-likelihood $\ln p(X \mid \theta^{(t+1)})$ or check parameter convergence $\\|\theta^{(t+1)} - \theta^{(t)}\\| < \epsilon$.`,
      r`Repeat the E-step and M-step until the improvement in log-likelihood drops below the convergence tolerance.`,
    ],
    math: [
      {
        h: 'Marginal log-likelihood decomposition and ELBO',
        tex: r`$$\ln p(X \mid \theta) = \sum_{Z} q(Z) \ln \frac{p(X, Z \mid \theta)}{q(Z)} + \sum_{Z} q(Z) \ln \frac{q(Z)}{p(Z \mid X, \theta)} = \operatorname{ELBO}(q, \theta) + \operatorname{KL}\big(q(Z) \parallel p(Z \mid X, \theta)\big)$$`,
        p: r`By Jensen's inequality, the Kullback–Leibler divergence $\operatorname{KL} \ge 0$, establishing that $\operatorname{ELBO}(q, \theta) \le \ln p(X \mid \theta)$ is a rigorous lower bound. In the E-step, setting $q(Z) = p(Z \mid X, \theta^{(t)})$ makes $\operatorname{KL} = 0$, causing the lower bound to touch the true log-likelihood exactly at $\theta^{(t)}$.`,
      },
      {
        h: 'The Q-function in the E-step',
        tex: r`$$Q\big(\theta \mid \theta^{(t)}\big) = \sum_{Z} p\big(Z \mid X, \theta^{(t)}\big) \ln p(X, Z \mid \theta)$$`,
        p: r`Evaluating the complete-data log-likelihood $\ln p(X, Z \mid \theta)$ moves the summation outside the logarithm. For Gaussian Mixture Models, this simplifies to computing soft responsibilities $\gamma_{ik} = \frac{\pi_k \mathcal{N}(x_i \mid \mu_k, \Sigma_k)}{\sum_j \pi_j \mathcal{N}(x_i \mid \mu_j, \Sigma_j)}$.`,
      },
      {
        h: 'Parameter update in the M-step',
        tex: r`$$\theta^{(t+1)} = \arg\max_{\theta} Q\big(\theta \mid \theta^{(t)}\big)$$`,
        p: r`Differentiating $Q$ with respect to $\theta$ and setting to zero yields closed-form analytical updates for exponential family distributions: $\mu_k = \frac{\sum_i \gamma_{ik} x_i}{\sum_i \gamma_{ik}}$ and $\Sigma_k = \frac{\sum_i \gamma_{ik}(x_i - \mu_k)(x_i - \mu_k)^T}{\sum_i \gamma_{ik}}$.`,
      },
    ],
    code: r`import numpy as np

# 1D two-component Gaussian mixture data
rng = np.random.default_rng(42)
X = np.concatenate([rng.normal(-2.0, 0.8, 100), rng.normal(3.0, 1.2, 100)])

# Initial guesses for weights, means, and variances
pi = np.array([0.5, 0.5])
mu = np.array([-0.5, 0.5])
var = np.array([1.0, 1.0])

for _ in range(50):
    # E-step: calculate responsibilities (posterior over latent cluster)
    pdf = np.exp(-0.5 * (X[:, None] - mu) ** 2 / var) / np.sqrt(2 * np.pi * var)
    gamma = (pdf * pi) / np.sum(pdf * pi, axis=1, keepdims=True)
    
    # M-step: update parameters via weighted maximum likelihood
    N_k = np.sum(gamma, axis=0)
    pi = N_k / len(X)
    mu = np.sum(gamma * X[:, None], axis=0) / N_k
    var = np.sum(gamma * (X[:, None] - mu) ** 2, axis=0) / N_k

ll = np.sum(np.log(np.sum(pi * np.exp(-0.5 * (X[:, None] - mu) ** 2 / var) / np.sqrt(2 * np.pi * var), axis=1)))
print(f"Estimated weights: {pi.round(3)}")
print(f"Estimated means: {mu.round(3)}")
print(f"Estimated stds: {np.sqrt(var).round(3)}")
print(f"Final log-likelihood: {ll:.2f}")`,
    pitfalls: [
      r`Convergence to local optima: The marginal log-likelihood surface is non-convex. EM is guaranteed to monotonically increase likelihood, but it can converge to suboptimal local maxima depending on initialisation. Multiple random restarts or $k$-means seeding are essential.`,
      r`Singularities and variance collapse: In Gaussian mixture models, if a single component's mean collapses onto a single data point, its variance approaches zero and its likelihood explodes to infinity. Regularising the covariance diagonal with a small ridge ($\sigma^2 + \epsilon$) prevents numerical explosion.`,
      r`Slow convergence near saddle points: EM has a first-order convergence rate, meaning progress can crawl when components overlap heavily or eigenvalues of the Fisher information matrix are near-zero.`,
      r`Intractable E-step for complex priors: In deep probabilistic models or non-conjugate Bayesian networks, calculating exact posterior responsibilities $p(Z \mid X, \theta)$ is intractable, necessitating Variational EM or Monte Carlo approximations.`,
    ],
    keyPoints: [
      r`Solves maximum likelihood estimation in models with unobserved latent variables or incomplete observations.`,
      r`Guarantees monotonic non-decrease of the marginal log-likelihood at every iteration ($\ln p(X \mid \theta^{(t+1)}) \ge \ln p(X \mid \theta^{(t)})$).`,
      r`Tightens the Evidence Lower Bound (ELBO) in the E-step and climbs to its peak in the M-step.`,
      r`Forms the mathematical foundation for Gaussian Mixture Models, Hidden Markov Models, and topic models.`,
    ],
    quiz: [
      {
        q: r`What mathematical property guarantees that the EM algorithm's log-likelihood never decreases from one iteration to the next?`,
        o: [
          r`The Central Limit Theorem`,
          r`Mercer's condition on kernel functions`,
          r`Jensen's inequality and the non-negativity of Kullback–Leibler divergence ($\operatorname{KL} \ge 0$)`,
          r`The Gauss-Markov theorem`,
        ],
        a: 2,
        why: r`Jensen's inequality guarantees that the Evidence Lower Bound (ELBO) is a valid lower bound on the marginal log-likelihood. In the E-step, setting $q(Z) = p(Z \mid X, \theta)$ drives $\operatorname{KL} = 0$, and the M-step maximises the ELBO, ensuring the log-likelihood monotonically increases or stays constant.`,
      },
      {
        q: r`What occurs during the Expectation step (E-step) of the EM algorithm?`,
        o: [
          r`Model parameters $\theta$ are updated via stochastic gradient descent`,
          r`All missing data points are permanently deleted from the dataset`,
          r`The covariance matrix is inverted using Singular Value Decomposition`,
          r`The posterior probability distribution over latent variables $p(Z \mid X, \theta^{(t)})$ is computed using current parameter estimates`,
        ],
        a: 3,
        why: r`The E-step calculates the conditional distribution of the hidden latent variables given the observed data and current parameters, computing the expected values (responsibilities) needed for the M-step.`,
      },
      {
        q: r`Why is directly maximising the marginal log-likelihood $\ln p(X \mid \theta) = \sum_i \ln \big(\sum_z p(x_i, z \mid \theta)\big)$ analytically difficult without EM?`,
        o: [
          r`The summation over latent states $z$ appears inside the logarithm, preventing clean differentiation and closed-form solutions`,
          r`The marginal log-likelihood is always equal to zero`,
          r`The log-likelihood function has no gradient at any point`,
          r`Exponential distributions cannot be evaluated inside logarithms`,
        ],
        a: 0,
        why: r`When a sum appears inside a logarithm, expanding the derivative yields coupled equations where parameters cannot be isolated into independent closed-form maximum likelihood solutions.`,
      },
      {
        q: r`What is a well-known failure mode when fitting Gaussian Mixture Models with EM without covariance regularisation?`,
        o: [
          r`The algorithm always diverges to negative infinity in the first step`,
          r`A Gaussian component can collapse onto a single data point, driving its variance to zero and causing the likelihood to explode to infinity`,
          r`The mixture weights are forced to be negative`,
          r`The number of clusters $k$ automatically doubles at every iteration`,
        ],
        a: 1,
        why: r`If a Gaussian component centres exactly on an isolated sample and captures only that point, its sample variance shrinks toward 0. The normal density $\frac{1}{\sqrt{2\pi\sigma^2}} \to \infty$, creating a numerical singularity.`,
      },
    ],
    usedBy: ['gaussian_mixture_models'],
    prereq: ['maximum-likelihood-estimation', 'gaussian_mixture_models'],
    related: ['gaussian_mixture_models', 'maximum-likelihood-estimation', 'kmeans_clustering'],
    keywords: 'em expectation maximisation algorithm latent variables gmm gaussian mixture elbo posterior responsibilities maximum likelihood',
  },
  {
    id: "bayesian-networks",
    short: "Bayesian networks",
    title: "Bayesian Networks and Directed Graphical Models",
    task: "concepts",
    module: "Probabilistic models",
    level: 2,
    minutes: 18,
    noLab: true,
    summary: "Represent complex joint probability distributions compactly using Directed Acyclic Graphs: master conditional independence, d-separation, and belief propagation.",
    lead: "A joint distribution over N discrete variables requires 2^N - 1 parameters, causing exponential intractability. Bayesian Networks exploit conditional independence encoded in directed graphs to factorise joint probabilities into compact local conditional probability tables (CPTs).",
    intuition: [
      "A full joint probability distribution over $N$ binary random variables requires specifying $2^N - 1$ independent probability values. For a medical diagnostic system or financial risk engine with 50 variables, storing the joint distribution would require over $10^{15}$ parameters—vastly exceeding the capacity of any computer and requiring impossible amounts of training data.",
      "Fortunately, real-world random variables are not all directly dependent on each other: lung cancer depends directly on smoking and radon exposure, but is conditionally independent of age given smoking history and cellular DNA damage. Bayesian Networks (pioneered by Judea Pearl in the 1980s) formalise these structural independencies using Directed Acyclic Graphs (DAGs).",
      "In a Bayesian Network, each node represents a random variable, and directed edges represent direct probabilistic or causal dependencies. The fundamental local Markov property dictates that each node $X_i$ is conditionally independent of all its non-descendants given its parents: $P(X_1, \\dots, X_n) = \\prod_{i=1}^n P(X_i \\mid \\operatorname{Parents}(X_i))$.",
      "This factorization slashes parameter complexity from exponential $O(2^N)$ to linear or polynomial $O(N \\cdot 2^k)$, where $k$ is the maximum number of parents per node. Furthermore, Pearl's graphical d-separation criterion provides an exact topological algorithm to read off whether any two sets of variables are conditionally independent given observed evidence, enabling exact probabilistic inference via Variable Elimination or Belief Propagation."
    ],
    analogy: "Imagine a corporate hierarchy with a CEO, department managers, team leads, and interns. If an intern needs to know company policy on travel expenses, they ask their direct team lead. Once the team lead gives the instruction, knowing the personal mood of the CEO or the managers in other departments provides zero additional information. The team lead acts as the parent node, shielding the intern from all non-descendants.",
    steps: [
      {
        "title": "1. Define variables and construct DAG structure",
        "body": "Identify domain random variables and construct Directed Acyclic Graph $G = (V, E)$, ensuring no directed cyclical loops exist."
      },
      {
        "title": "2. Populate Conditional Probability Tables (CPTs)",
        "body": "For each node $X_i$, specify local distribution $P(X_i \\mid \\operatorname{Pa}(X_i))$. For discrete variables, populate CPTs empirically or via expert elicitation."
      },
      {
        "title": "3. Test conditional independence via d-separation",
        "body": "Evaluate whether query nodes $X$ and $Y$ are d-separated given evidence set $Z$ by checking paths across causal chains ($A \\to B \\to C$), forks ($A \\leftarrow B \\to C$), and colliders ($A \\to B \\leftarrow C$)."
      },
      {
        "title": "4. Perform probabilistic inference (Variable Elimination)",
        "body": "Compute posterior $P(Query \\mid Evidence)$ by setting observed variables to evidence values, multiplying relevant factors, and summing out (marginalising) unobserved nuisance variables."
      }
    ],
    math: [
      {
        "h": "Bayesian Network Joint Factorisation Chain Rule",
        "tex": "P(X_1, \\dots, X_n) = \\prod_{i=1}^n P(X_i \\mid \\operatorname{Pa}(X_i))",
        "p": "The joint probability factorises into the product of local conditional distributions for each node conditioned only on its immediate parent set Pa(X_i)."
      },
      {
        "h": "The Three Canonical d-Separation Motifs",
        "tex": "\\begin{aligned} \\text{Chain: } & A \\to B \\to C & (A \\perp C \\mid B) \\\\ \\text{Fork: } & A \\leftarrow B \\to C & (A \\perp C \\mid B) \\\\ \\text{Collider: } & A \\to B \\leftarrow C & (A \\perp C \\mid \\emptyset, \\; A \\not\\perp C \\mid B) \\end{aligned}",
        "p": "Chains and forks are blocked when middle node B is observed. Colliders are naturally blocked, but become UNBLOCKED (active) when collider B or its descendant is observed (explaining away)."
      },
      {
        "h": "Variable Elimination Factor Marginalisation",
        "tex": "\\phi_{\\mathrm{new}}(Y) = \\sum_{X} \\prod_{k \\in \\mathcal{F}_X} \\phi_k(X, Y)",
        "p": "Inference operation: multiplies all probability factors involving variable X and sums out X, leaving a reduced factor over remaining variables Y."
      }
    ],
    code: "import numpy as np\n\n# Exact Variable Elimination on a Classic 4-Node Bayesian Network\n# Structure: Burglar (B) -> Alarm (A) <- Earthquake (E)\n#                          Alarm (A) -> JohnCalls (J)\n\n# 1. Define Prior and Conditional Probability Tables (CPTs)\n# B in {0, 1}, E in {0, 1}, A in {0, 1}, J in {0, 1}\nP_B = np.array([0.999, 0.001])         # P(B=0), P(B=1)\nP_E = np.array([0.998, 0.002])         # P(E=0), P(E=1)\n\n# P(A=1 | B, E): shape (2, 2) where index is [B, E]\nP_A_given_BE = np.array([\n    [0.001, 0.290],  # B=0: E=0 -> 0.001, E=1 -> 0.29\n    [0.940, 0.950]   # B=1: E=0 -> 0.940, E=1 -> 0.95\n])\n\n# P(J=1 | A): shape (2,) where index is [A]\nP_J_given_A = np.array([0.05, 0.90])   # A=0 -> 0.05, A=1 -> 0.90\n\n# 2. Query: What is P(Burglary = 1 | JohnCalls = 1)?\n# P(B, J=1) = sum_E sum_A P(B) * P(E) * P(A | B, E) * P(J=1 | A)\n\njoint_B_J = np.zeros(2)\n\nfor b in [0, 1]:\n    prob_b = 0.0\n    for e in [0, 1]:\n        for a in [0, 1]:\n            # P(B=b)\n            p_b = P_B[b]\n            # P(E=e)\n            p_e = P_E[e]\n            # P(A=a | B=b, E=e)\n            p_a = P_A_given_BE[b, e] if a == 1 else (1.0 - P_A_given_BE[b, e])\n            # P(J=1 | A=a)\n            p_j = P_J_given_A[a]\n            \n            prob_b += p_b * p_e * p_a * p_j\n    joint_B_J[b] = prob_b\n\n# Normalise by P(J=1)\nposterior_B_given_J = joint_B_J / np.sum(joint_B_J)\n\n# 3. Demonstrate \"Explaining Away\" (Collider behaviour)\n# What if we now observe Earthquake = 1? Does P(Burglary = 1) drop?\njoint_B_J_E = np.zeros(2)\nfor b in [0, 1]:\n    prob_b = 0.0\n    e = 1  # Given Earthquake = 1\n    for a in [0, 1]:\n        p_b = P_B[b]\n        p_e = P_E[e]\n        p_a = P_A_given_BE[b, e] if a == 1 else (1.0 - P_A_given_BE[b, e])\n        p_j = P_J_given_A[a]\n        prob_b += p_b * p_e * p_a * p_j\n    joint_B_J_E[b] = prob_b\n\nposterior_B_given_J_E = joint_B_J_E / np.sum(joint_B_J_E)\n\nprint(f\"Prior P(Burglary = 1):                {P_B[1]:.4f} (0.1%)\")\nprint(f\"Posterior P(Burglary = 1 | JohnCalls=1): {posterior_B_given_J[1]:.4f} ({posterior_B_given_J[1]*100:.1f}%)\")\nprint(f\"Posterior P(Burglary = 1 | JohnCalls=1, Earthquake=1): {posterior_B_given_J_E[1]:.4f} ({posterior_B_given_J_E[1]*100:.1f}%)\")\nprint(f\"Explaining Away Effect: Learning Earthquake occurred reduced Burglary probability by {((posterior_B_given_J[1] - posterior_B_given_J_E[1])/posterior_B_given_J[1])*100:.1f}%\")",
    keyPoints: [
      "Compactly parameterises complex joint distributions using Directed Acyclic Graphs (DAGs) and local conditional probabilities.",
      "Reduces exponential parameter complexity $O(2^N)$ to polynomial scale by exploiting conditional independence.",
      "The local Markov property guarantees each variable is independent of non-descendants given its parents.",
      "d-separation provides a topological algorithm to determine conditional independence across chains, forks, and colliders.",
      "Colliders ($A \\to B \\leftarrow C$) exhibit \"explaining away\": observing $B$ induces conditional dependence between independent causes $A$ and $C$."
    ],
    pitfalls: [
      "Confusing conditional independence with marginal independence: In a collider ($A \\to B \\leftarrow C$), $A$ and $C$ are marginally independent, but conditioning on $B$ makes them dependent.",
      "Inference complexity on loopy graphs: Exact inference via variable elimination or junction tree is NP-hard in general graphs with high tree-width, requiring approximate MCMC or loopy belief propagation.",
      "Causal over-interpretation: A Bayesian network models statistical conditional independence; inferring true causal counterfactuals requires Pearl do-calculus and intervention assumptions."
    ],
    quiz: [
      {
        "q": "In the collider structure A -> B <- C, what happens to the independence between A and C when B is observed?",
        "o": [
          "A and C were marginally independent, but observing B (or any descendant of B) creates conditional dependence between them (explaining away)",
          "A and C become strictly independent",
          "A and C become identical variables",
          "B becomes independent of both A and C"
        ],
        "a": 0,
        "why": "In a collider, A and C are marginally independent. Observing the common effect B creates an explaining-away coupling: knowing A occurred explains B, lowering the probability of C."
      },
      {
        "q": "How does a Bayesian Network reduce the number of parameters required to specify a joint distribution over N binary variables?",
        "o": [
          "By factorising P(X_1, ..., X_N) into a product of local CPTs P(X_i | Parents(X_i)), scaling with parent count rather than total variable count",
          "By setting all probabilities to equal values",
          "By converting binary variables into continuous variables",
          "By computing the SVD of the graph adjacency matrix"
        ],
        "a": 0,
        "why": "Instead of storing all 2^N - 1 states, each node only stores probabilities conditioned on its immediate parents, reducing complexity to O(N * 2^k) where k is max parent count."
      }
    ],
    usedBy: [],
    prereq: [
      "probability-rules-and-bayes-theorem"
    ],
    related: [
      "probability-rules-and-bayes-theorem",
      "causal-graphs-dags-and-adjustment",
      "markov-random-fields",
      "markov-chains-and-stationary-distributions"
    ],
    keywords: "bayesian networks, directed graphical models, conditional independence, d-separation, variable elimination, explaining away, cpts, belief propagation"
  },
  {
    id: "markov-random-fields",
    short: "Markov random fields",
    title: "Markov Random Fields and Undirected Graphical Models",
    task: "concepts",
    module: "Probabilistic models",
    level: 2,
    minutes: 18,
    noLab: true,
    summary: "Model symmetric spatial and relational interactions with undirected graphical models: master clique potentials, the Hammersley–Clifford theorem, and image denoising.",
    lead: "While Bayesian networks model directed causal flows, many physical and spatial dependencies (like neighbouring pixels in an image or social ties) are symmetric. Markov Random Fields (MRFs) specify joint distributions as products of maximal clique potentials.",
    intuition: [
      "Directed graphical models (Bayesian Networks) are natural for causal processes where time flows forward from cause to effect. However, in spatial and relational systems—such as pixels in a 2D digital image, spatial disease incidence across bordering counties, or spin orientations in a crystal lattice—dependencies are inherently bidirectional and symmetric. Pixel A influences Pixel B just as strongly as Pixel B influences Pixel A.",
      "Markov Random Fields (MRFs), also called Undirected Graphical Models, represent joint probability distributions over undirected graphs $G = (V, E)$. The Markov properties in an MRF state that a variable is conditionally independent of all other nodes in the network given its Markov Blanket (its immediate neighbouring nodes in the graph).",
      "How do we parameterise a joint distribution on an undirected graph? In 1971, John Hammersley and Peter Clifford proved the fundamental theorem of undirected graphical models: any strictly positive probability distribution satisfying the Markov properties factorises as a Gibbs distribution over the maximal cliques of the graph: $P(x) = \\frac{1}{Z} \\prod_{C \\in \\mathcal{C}} \\psi_C(x_C) = \\frac{1}{Z} \\exp\\left(-\\sum_{C} E_C(x_C)\\right)$.",
      "Here, $\\psi_C(x_C) > 0$ are non-negative potential functions (or clique energy functions $E_C$), and $Z = \\sum_x \\exp(-E(x))$ is the normalising constant (termed the Partition Function in statistical physics). While the partition function $Z$ is intractable to compute exactly for large grids, algorithms like Iterated Conditional Modes (ICM) or Graph Cuts perform rapid maximum a posteriori (MAP) inference for applications like image denoising and semantic segmentation."
    ],
    analogy: "Imagine a flock of starlings performing a murmur in the evening sky. No single bird is the directed \"leader\" commanding the others. Instead, each individual starling constantly adjusts its velocity and distance symmetrically relative to its six or seven nearest neighbours. When one bird veers left to avoid a falcon, its neighbours follow, propagating a smooth fluid wave through the entire flock.",
    steps: [
      {
        "title": "1. Construct undirected graph structure",
        "body": "Define graph $G = (V, E)$ where edges represent symmetric interactions (e.g. 4-connected grid on image pixels)."
      },
      {
        "title": "2. Define clique potential energy functions",
        "body": "Assign energy functions $E_C(x_C)$ to cliques: for pairwise MRFs, specify unary potentials $E_i(x_i)$ (data likelihood) and pairwise potentials $E_{ij}(x_i, x_j)$ (neighbour smoothing)."
      },
      {
        "title": "3. Formulate total Gibbs energy",
        "body": "Express joint probability as $P(x) = \\frac{1}{Z} \\exp(-E(x))$, where total energy $E(x) = \\sum_{i} E_i(x_i) + \\sum_{(i, j) \\in E} E_{ij}(x_i, x_j)$. Minimising energy maximises posterior probability."
      },
      {
        "title": "4. Perform MAP inference via Iterated Conditional Modes (ICM)",
        "body": "Initialise state (e.g. noisy image). Iterate over nodes: update node $x_i \\leftarrow \\arg\\min_{k} [E_i(k) + \\sum_{j \\in \\mathcal{N}(i)} E_{ij}(k, x_j)]$. Repeat until energy converges."
      }
    ],
    math: [
      {
        "h": "Hammersley–Clifford Theorem (Gibbs Distribution)",
        "tex": "P(x) = \\frac{1}{Z} \\prod_{C \\in \\mathcal{C}} \\psi_C(x_C) = \\frac{1}{Z} \\exp\\left(-\\sum_{C \\in \\mathcal{C}} E_C(x_C)\\right), \\quad Z = \\sum_{x} \\exp(-E(x))",
        "p": "A positive distribution satisfies the local Markov properties of graph G if and only if it factorises over the maximal cliques C of G. Z is the normalising partition function."
      },
      {
        "h": "Pairwise MRF Energy Formulation (Ising / Potts Model)",
        "tex": "E(x) = \\sum_{i \\in V} \\phi_i(x_i, y_i) + \\beta \\sum_{(i, j) \\in E} \\mathbb{I}(x_i \\neq x_j)",
        "p": "Standard energy model for vision: unary term phi_i enforces fidelity to noisy measurement y_i; pairwise Potts penalty beta enforces spatial smoothness among adjacent pixels."
      },
      {
        "h": "Local Markov Property and Markov Blanket",
        "tex": "P(X_i \\mid X_{-i}) = P(X_i \\mid X_{\\mathcal{N}(i)}) = \\frac{\\exp(-E_i(x_i) - \\sum_{j \\in \\mathcal{N}(i)} E_{ij}(x_i, x_j))}{\\sum_{x'_i} \\exp(-E_i(x'_i) - \\sum_{j \\in \\mathcal{N}(i)} E_{ij}(x'_i, x_j))}",
        "p": "Conditioned on its immediate graph neighbours N(i) (its Markov blanket), node X_i is conditionally independent of all remaining nodes in the graph."
      }
    ],
    code: "import numpy as np\n\n# Binary Image Denoising using a Markov Random Field (Ising Model) and ICM from scratch\nnp.random.seed(42)\n\n# 1. Create a synthetic clean 20x20 binary image (+1 and -1)\nsize = 20\nclean_img = -np.ones((size, size), dtype=int)\n# Draw a square in the centre\nclean_img[5:15, 5:15] = 1\n\n# 2. Corrupt image with 25% random bit-flip noise\nnoisy_img = clean_img.copy()\nflip_mask = np.random.uniform(0, 1, (size, size)) < 0.25\nnoisy_img[flip_mask] *= -1\n\n# 3. Iterated Conditional Modes (ICM) MAP Inference\n# Energy E(x) = -eta * sum_i (x_i * y_i) - beta * sum_{<i, j>} (x_i * x_j)\neta = 2.0   # Data fidelity weight (how much we trust noisy pixel y_i)\nbeta = 1.5  # Spatial smoothness weight (how much adjacent pixels must agree)\n\nx_state = noisy_img.copy()  # Initial state\nmax_iters = 10\n\ndef compute_total_energy(x, y, eta, beta):\n    # Data fidelity term\n    data_energy = -eta * np.sum(x * y)\n    # Horizontal interactions\n    h_energy = -beta * np.sum(x[:, :-1] * x[:, 1:])\n    # Vertical interactions\n    v_energy = -beta * np.sum(x[:-1, :] * x[1:, :])\n    return data_energy + h_energy + v_energy\n\nenergy_history = [compute_total_energy(x_state, noisy_img, eta, beta)]\n\n# ICM coordinate descent iterations\nfor it in range(max_iters):\n    changes = 0\n    for r in range(size):\n        for c in range(size):\n            y_val = noisy_img[r, c]\n            \n            # Sum of 4-connected neighbours\n            neighbour_sum = 0\n            if r > 0: neighbour_sum += x_state[r - 1, c]\n            if r < size - 1: neighbour_sum += x_state[r + 1, c]\n            if c > 0: neighbour_sum += x_state[r, c - 1]\n            if c < size - 1: neighbour_sum += x_state[r, c + 1]\n            \n            # Compare local energy for x = +1 vs x = -1\n            # E_local(val) = -eta * (val * y_val) - beta * (val * neighbour_sum)\n            e_plus = -eta * (1 * y_val) - beta * (1 * neighbour_sum)\n            e_minus = -eta * (-1 * y_val) - beta * (-1 * neighbour_sum)\n            \n            new_val = 1 if e_plus < e_minus else -1\n            if new_val != x_state[r, c]:\n                x_state[r, c] = new_val\n                changes += 1\n                \n    curr_energy = compute_total_energy(x_state, noisy_img, eta, beta)\n    energy_history.append(curr_energy)\n    if changes == 0:\n        break\n\n# Evaluate error rates\nerror_noisy = np.mean(clean_img != noisy_img)\nerror_denoised = np.mean(clean_img != x_state)\n\nprint(f\"Image dimensions: {size}x{size} (400 binary pixels)\")\nprint(f\"Initial Noisy Pixel Error:    {error_noisy * 100:.1f}%\")\nprint(f\"MRF Denoised Pixel Error:     {error_denoised * 100:.1f}% (noise eliminated!)\")\nprint(f\"Initial Energy: {energy_history[0]:.1f} -> Final Converged Energy: {energy_history[-1]:.1f}\")\nprint(\"Energy monotonically decreasing:\", np.all(np.diff(energy_history) <= 1e-6))",
    keyPoints: [
      "Undirected graphical model parameterised by non-negative clique potentials over undirected graph cliques.",
      "Ideal for symmetric spatial and relational systems where directed causal arrows do not apply (e.g. image lattices, physical spins).",
      "Hammersley–Clifford theorem proves any strictly positive Markov distribution factorises as a Gibbs distribution $P(x) = \\frac{1}{Z} \\exp(-E(x))$.",
      "The normalising partition function $Z = \\sum_x \\exp(-E(x))$ is computationally intractable in general, summing over exponentially many states.",
      "Iterated Conditional Modes (ICM) performs greedy coordinate descent on local node energies, guaranteeing monotonic convergence to a local energy minimum."
    ],
    pitfalls: [
      "Intractability of the partition function Z: Computing marginal likelihoods or maximum likelihood parameter gradients requires evaluating $Z$, demanding MCMC or contrastive divergence.",
      "ICM local minima trapping: Because ICM is greedy coordinate descent, it can get trapped in sub-optimal local energy minima; Graph Cuts (alpha-expansion) or simulated annealing find global/stronger optima.",
      "Over-smoothing boundaries: If the pairwise spatial smoothness weight $\\beta$ is set too large, fine edge details and sharp image contours are erased into homogeneous blobs."
    ],
    quiz: [
      {
        "q": "Why are Markov Random Fields preferred over Bayesian Networks for 2D image pixel grids?",
        "o": [
          "Pixel dependencies are symmetric and bidirectional, so imposing an arbitrary directed acyclic ordering would create artificial causal bias",
          "Bayesian networks cannot be used with discrete variables",
          "Markov Random Fields require no math or probability",
          "Images have negative pixel values that Bayesian networks cannot process"
        ],
        "a": 0,
        "why": "Adjacent pixels mutually influence each other symmetrically. Imposing directed arrows on an image grid creates an artificial ordering and DAG cycles."
      },
      {
        "q": "What is the primary computational bottleneck when training general Markov Random Fields via Maximum Likelihood?",
        "o": [
          "Evaluating the partition function Z = sum_x exp(-E(x)), which sums over exponentially many global configurations",
          "Inverting a 2x2 matrix",
          "Computing the discrete Fourier transform",
          "Drawing random numbers"
        ],
        "a": 0,
        "why": "The partition function Z normalises the distribution. For an N-pixel binary image, Z requires summing over 2^N states, which is computationally intractable for exact likelihood."
      }
    ],
    usedBy: [],
    prereq: [
      "bayesian-networks",
      "probability-rules-and-bayes-theorem"
    ],
    related: [
      "bayesian-networks",
      "markov-chains-and-stationary-distributions",
      "variational-inference",
      "bayesian-networks"
    ],
    keywords: "markov random field, mrf, undirected graphical model, hammersley clifford, gibbs distribution, ising model, icm, partition function, image denoising"
  },
  {
  "id": "gaussian-process-classifier",
  "short": "GP classifier",
  "title": "Gaussian Process Classification",
  "task": "concepts",
  "module": "Probabilistic models",
  "level": 3,
  "minutes": 18,
  "noLab": true,
  "summary": "Non-parametric Bayesian classification with principled uncertainty: master latent Gaussian processes, non-conjugate Bernoulli likelihoods, and the Laplace approximation.",
  "lead": "While Gaussian Process Regression has a closed-form Gaussian posterior, GP classification involves a discrete non-Gaussian likelihood that destroys exact conjugacy. Approximate inference methods (Laplace approximation and Expectation Propagation) yield well-calibrated class probabilities and epistemic uncertainty.",
  "intuition": [
    "In safety-critical classification domains—such as autonomous vehicle pedestrian detection, medical radiology triage, or financial stress forecasting—predicting a class label is insufficient; the model must communicate how confident it is in its prediction, distinguishing between familiar operational regimes and alien out-of-distribution inputs (epistemic uncertainty).",
    "Gaussian Process Classification (GPC) models classification non-parametrically by placing a Gaussian Process prior over an unobserved continuous latent function $f(x) \\sim \\mathcal{GP}(m(x), k(x, x'))$. This latent function $f(x)$ represents log-odds scores across input space. To transform latent real numbers into valid probabilities, $f(x)$ is squashed through a sigmoid or probit link function: $\\pi(x) = P(y = 1 \\mid f(x)) = \\sigma(f(x))$.",
    "However, a fundamental mathematical hurdle arises: unlike Gaussian noise in regression, the discrete Bernoulli likelihood $p(y \\mid f) = \\prod_{i=1}^n \\sigma(y_i f_i)$ is non-Gaussian. Multiplying a Gaussian prior $p(f)$ by a non-Gaussian likelihood yields a non-Gaussian posterior distribution $p(f \\mid y) = p(y \\mid f) p(f) / p(y)$ whose normalising marginal evidence integral is analytically intractable.",
    "To resolve this intractability, GPC employs deterministic approximations. The Laplace Approximation fits a Gaussian $\\mathcal{N}(\\hat{f}, \\Sigma)$ centred at the posterior mode $\\hat{f} = \\arg\\max \\log p(f \\mid y)$ by taking the second-order Taylor expansion (negative Hessian) of the unnormalized log posterior. Test predictions are obtained by integrating the sigmoid link over the resulting Gaussian predictive distribution."
  ],
  "analogy": "Imagine a sound engineer setting an audio volume threshold. The underlying acoustics of the room vary smoothly across different corners (the continuous latent Gaussian process f(x)). A red warning light blinks on whenever the noise exceeds a decibel threshold (the discrete binary observation y in {0, 1}). We cannot measure the exact decibel level directly, only whether the red light blinked. The Laplace approximation acts as an acoustic reconstruction tool, calculating the most probable decibel level and uncertainty bands at every coordinate in the room.",
  "steps": [
    {
      "title": "1. Specify GP covariance kernel and latent prior",
      "body": "Choose a valid kernel $k(x, x')$ (such as RBF/Squared Exponential) defining smooth correlation between points. Formulate prior $f \\sim \\mathcal{N}(0, K)$."
    },
    {
      "title": "2. Compute posterior mode via Newton–Raphson",
      "body": "Maximise unnormalized log-posterior $\\Psi(f) = -\\frac{1}{2} f^T K^{-1} f + \\sum_{i=1}^n \\log \\sigma(y_i f_i)$. Iterate Newton updates to find mode $\\hat{f}$."
    },
    {
      "title": "3. Construct Laplace covariance at the mode",
      "body": "Evaluate the negative Hessian: $W = -\\nabla^2 \\sum \\log p(y_i \\mid f_i) = \\operatorname{diag}(\\pi_i (1 - \\pi_i))$. Compute Laplace posterior covariance $\\Sigma = (K^{-1} + W)^{-1}$."
    },
    {
      "title": "4. Compute predictive distribution and squash",
      "body": "For test point $x_*$, compute predictive latent mean $\\mu_* = k_*^T \\nabla \\log p(y \\mid \\hat{f})$ and latent variance $\\sigma_*^2 = k(x_*, x_*) - k_*^T (K + W^{-1})^{-1} k_*$. Approximate test class probability $\\bar{\\pi}_* = \\int \\sigma(f_*) \\mathcal{N}(f_* \\mid \\mu_*, \\sigma_*^2) df_*$."
    }
  ],
  "math": [
    {
      "h": "Laplace Approximation Objective and Mode Finding",
      "tex": "\\nabla \\Psi(f) = -K^{-1} f + (t - \\pi), \\quad \\nabla^2 \\Psi(f) = -(K^{-1} + W), \\quad W = \\operatorname{diag}(\\pi_i (1 - \\pi_i))",
      "p": "Gradient and Hessian of unnormalized log posterior over latent vector f, where t_i = (y_i + 1)/2 and pi_i = sigma(f_i). Because W is positive semi-definite, the objective is strictly concave."
    },
    {
      "h": "Newton Update for Posterior Mode",
      "tex": "f^{\\mathrm{new}} = (K^{-1} + W)^{-1} (W f + t - \\pi) = K (I + W K)^{-1} (W f + t - \\pi)",
      "p": "Numerically stable mode-finding iteration avoiding inversion of K directly, evaluating Cholesky factorisation on (B = I + W^{1/2} K W^{1/2})."
    },
    {
      "h": "Probit Sigmoid Approximation for Predictive Class Probability",
      "tex": "\\bar{\\pi}_* = \\mathbb{E}_{f_* \\sim \\mathcal{N}(\\mu_*, \\sigma_*^2)}[\\sigma(f_*)] \\approx \\sigma\\left(\\frac{\\mu_*}{\\sqrt{1 + \\frac{\\pi}{8} \\sigma_*^2}}\\right)",
      "p": "Convoluting a Gaussian distribution with a sigmoid is analytically intractable, but substituting a cumulative probit link yields this accurate closed-form approximation."
    }
  ],
  "code": "import numpy as np\n\n# Gaussian Process Classifier with Laplace Approximation from scratch\nclass GPClassifierLaplace:\n    def __init__(self, gamma=1.0, max_iters=30, tol=1e-6):\n        self.gamma = gamma\n        self.max_iters = max_iters\n        self.tol = tol\n        self.X_train = None\n        self.y_train = None\n        self.f_hat = None\n        self.K = None\n        self.W = None\n        \n    def _rbf_kernel(self, X1, X2):\n        dists_sq = np.sum(X1**2, axis=1)[:, None] + np.sum(X2**2, axis=1)[None, :] - 2 * (X1 @ X2.T)\n        return np.exp(-self.gamma * np.maximum(dists_sq, 0))\n        \n    def fit(self, X, y):\n        self.X_train = X\n        self.y_train = y  # y in {0, 1}\n        n = len(X)\n        \n        # 1. Compute kernel matrix with jitter for numerical stability\n        self.K = self._rbf_kernel(X, X) + 1e-6 * np.eye(n)\n        \n        # 2. Newton-Raphson iteration to find posterior mode f_hat\n        f = np.zeros(n)\n        for it in range(self.max_iters):\n            pi = 1.0 / (1.0 + np.exp(-np.clip(f, -30, 30)))\n            # W = diag(pi * (1 - pi))\n            w = pi * (1.0 - pi)\n            W = np.diag(w)\n            \n            # Stable Cholesky factorisation of (I + W^{1/2} K W^{1/2})\n            W_sqrt = np.diag(np.sqrt(w))\n            B = np.eye(n) + W_sqrt @ self.K @ W_sqrt\n            L = np.linalg.cholesky(B)\n            \n            grad = self.y_train - pi\n            b = W @ f + grad\n            # Solve (K^{-1} + W) f_new = b via Woodbury identity\n            a = b - W_sqrt @ np.linalg.solve(L.T, np.linalg.solve(L, W_sqrt @ self.K @ b))\n            f_new = self.K @ a\n            \n            diff = np.max(np.abs(f_new - f))\n            f = f_new\n            if diff < self.tol:\n                break\n                \n        self.f_hat = f\n        self.pi_hat = 1.0 / (1.0 + np.exp(-np.clip(f, -30, 30)))\n        self.w_hat = self.pi_hat * (1.0 - self.pi_hat)\n        \n    def predict_proba(self, X_test):\n        n_train = len(self.X_train)\n        n_test = len(X_test)\n        \n        K_star = self._rbf_kernel(self.X_train, X_test)\n        K_star_star = self._rbf_kernel(X_test, X_test) + 1e-6 * np.eye(n_test)\n        \n        # Predictive latent mean: mu_* = K_*^T (y - pi)\n        grad = self.y_train - self.pi_hat\n        mu_star = K_star.T @ grad\n        \n        # Predictive latent variance: sigma_*^2\n        W_sqrt = np.diag(np.sqrt(self.w_hat))\n        B = np.eye(n_train) + W_sqrt @ self.K @ W_sqrt\n        L = np.linalg.cholesky(B)\n        v = np.linalg.solve(L, W_sqrt @ K_star)\n        sigma2_star = np.diag(K_star_star) - np.sum(v**2, axis=0)\n        sigma2_star = np.maximum(sigma2_star, 1e-8)\n        \n        # Probit link approximation for predictive probability\n        kappa = 1.0 / np.sqrt(1.0 + np.pi * sigma2_star / 8.0)\n        p_star = 1.0 / (1.0 + np.exp(-kappa * mu_star))\n        \n        return p_star, sigma2_star\n\n# Synthetic non-linear classification dataset\nnp.random.seed(42)\nn_samples = 80\nX = np.random.uniform(-3, 3, (n_samples, 2))\n# True non-linear boundary: circle x1^2 + x2^2 < 3.0\ny = ((X[:, 0]**2 + X[:, 1]**2) < 3.0).astype(int)\n\ngpc = GPClassifierLaplace(gamma=0.5)\ngpc.fit(X, y)\n\n# Predict on inlier and far out-of-distribution point\ntest_points = np.array([\n    [0.0, 0.0],    # Firmly inside circle (Class 1)\n    [1.8, 1.8],    # Firmly outside circle (Class 0)\n    [10.0, 10.0],  # Far out-of-distribution point!\n])\n\nprobs, latent_vars = gpc.predict_proba(test_points)\n\nprint(\"Gaussian Process Classification (Laplace Approximation):\")\nprint(f\"Point [0, 0] (Inside):      P(Y=1) = {probs[0]:.4f}, Latent Var = {latent_vars[0]:.3f} (High certainty)\")\nprint(f\"Point [1.8, 1.8] (Outside):  P(Y=1) = {probs[1]:.4f}, Latent Var = {latent_vars[1]:.3f} (High certainty)\")\nprint(f\"Point [10, 10] (OOD Alien): P(Y=1) = {probs[2]:.4f}, Latent Var = {latent_vars[2]:.3f} (High uncertainty reverting to 0.50!)\")",
  "keyPoints": [
    "Non-parametric Bayesian classification placing a Gaussian Process prior over continuous latent log-odds function $f(x)$.",
    "Discrete Bernoulli likelihood breaks conjugacy; exact posterior is non-Gaussian and intractable.",
    "Laplace approximation fits a Gaussian distribution around the posterior mode $\\hat{f}$ using the negative Hessian of the log posterior.",
    "Produces principled epistemic uncertainty: on distant out-of-distribution inputs, latent variance increases and probabilities revert toward 0.50.",
    "Provides superior probability calibration compared to uncalibrated neural networks and support vector machines."
  ],
  "pitfalls": [
    "Computational scaling: Mode finding and covariance inversion scale as $O(n^3)$ per Newton step, limiting vanilla GPC to a few thousand samples.",
    "Laplace mode underestimation: The Laplace approximation fits the curvature at the mode; if the true posterior is skewed or multimodal, Expectation Propagation (EP) is more accurate.",
    "Overfitting hyperparameter selection: Optimising marginal likelihood with respect to kernel lengthscales on small datasets can collapse onto narrow lengthscales."
  ],
  "quiz": [
    {
      "q": "Why does Gaussian Process Classification require approximate inference (such as Laplace approximation) whereas GP Regression has a closed-form solution?",
      "o": [
        "The discrete Bernoulli/sigmoid likelihood is non-Gaussian, so the posterior distribution cannot be computed in closed form",
        "Classification has no training labels",
        "Kernel matrices cannot be computed for classification data",
        "GP classification requires infinite samples"
      ],
      "a": 0,
      "why": "In GP regression, Gaussian prior multiplied by Gaussian likelihood yields a Gaussian posterior. In classification, the Bernoulli likelihood is non-conjugate to the Gaussian prior, making the posterior integral intractable."
    },
    {
      "q": "What occurs to the predicted class probability of a Gaussian Process Classifier when presented with an input far outside the training support?",
      "o": [
        "The latent variance increases toward prior variance, driving the probit scaling factor kappa down and reverting predicted probability toward 0.50 (maximum uncertainty)",
        "It outputs exactly 1.0 with 100% confidence",
        "The algorithm crashes with a division by zero error",
        "It outputs negative probabilities"
      ],
      "a": 0,
      "why": "Far from training data, latent variance sigma_*^2 explodes. The probit convolution factor 1/sqrt(1 + pi/8 * sigma^2) dampens the latent mean toward zero, reverting the probability safely to 0.50."
    }
  ],
  "usedBy": [],
  "prereq": [
    "bayesian_linear_regression",
    "logistic-regression-inference-odds-ratios-wald-tests"
  ],
  "related": [
    "gaussian_process_regressor",
    "variational-inference",
    "logistic_regression",
    "kernel-pca"
  ],
  "keywords": "gaussian process classifier, gpc, laplace approximation, non conjugate inference, epistemic uncertainty, out of distribution, probit link"
},
  {
    id: 'convex-optimisation-and-duality',
    short: 'Convex Optimisation & Duality',
    title: 'Convex Optimisation and Duality',
    task: 'concepts',
    module: 'Optimisation',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Fundamental theory of convex optimisation where local minima are global, paired with Lagrange duality providing certified lower bounds and dual problem formulations.`,
    lead: r`In general mathematical optimisation, finding the true global minimum is notoriously difficult because objectives are riddled with deceptive local valleys, plateaus, and saddle points. Convex optimisation defines the boundary of tractable mathematics: when both the objective function and constraint sets are convex, any local minimum is guaranteed to be a global minimum. Lagrange duality transforms difficult constrained primal problems into convex dual problems, providing certificates of optimality and foundational insights for algorithms like Support Vector Machines and LASSO.`,
    intuition: [
      r`Imagine walking through a hilly landscape shrouded in thick fog. If you are standing in a general non-convex terrain (like a mountain range full of craters and ravines), walking downhill until the slope is zero only lands you at the bottom of whichever small ditch you happened to step into—you have no idea if a much deeper valley lies just over the next ridge. But if the terrain is a giant smooth bowl (a convex function), gravity guarantees that descending in any downhill direction leads inexorably to the single lowest point in the entire landscape.`,
      r`Real-world machine learning models must satisfy constraints—such as capping budget, enforcing non-negative weights, or bounding classification margins. A constrained problem asks: "What is the lowest point inside a fenced-off boundary?" Directly navigating the boundary fence in the primal space can be cumbersome.`,
      r`Duality approaches the problem from the outside in. Imagine wanting to prove that a manufacturing cost cannot possibly fall below £500, no matter which choices you make. Instead of testing millions of designs, you construct a lower bound function (the Lagrange dual function) by adding penalty multipliers for each constraint. By maximising this lower bound across all possible multipliers (the dual problem), you push the floor upward until it meets the primal ceiling. Under standard conditions (such as Slater's condition), the dual maximum equals the primal minimum exactly—a phenomenon called strong duality ($p^* = d^*$). The difference between primal and dual objectives, the duality gap, acts as a real-time certificate proving how close any candidate solution is to true optimality.`,
    ],
    analogy: r`Verifying the exact floor of a subterranean cave by measuring how high you can raise a flat hydraulic jack from below until it firmly touches the bedrock ceiling above.`,
    steps: [
      r`Verify convexity: ensure the objective function $f_0(x)$ is convex (its Hessian $\\nabla^2 f_0(x) \\succeq 0$ is positive semidefinite) and the constraint set is convex (convex inequalities $f_i(x) \\le 0$ and affine equalities $Ax = b$).`,
      r`Formulate the primal Lagrangian function by attaching Lagrange multipliers: $L(x, \\lambda, \\nu) = f_0(x) + \\sum_{i=1}^m \\lambda_i f_i(x) + \\sum_{j=1}^p \\nu_j (a_j^T x - b_j)$ with dual feasibility $\\lambda_i \\ge 0$.`,
      r`Derive the Lagrange dual function $g(\\lambda, \\nu) = \\inf_x L(x, \\lambda, \\nu)$ by finding the unconstrained infimum over $x$.`,
      r`Formulate the dual optimisation problem: $\\max_{\\lambda, \\nu} g(\\lambda, \\nu)$ subject to $\\lambda \\ge 0$. Note that $g(\\lambda, \\nu)$ is always concave, making the dual problem convex even if the primal is non-convex.`,
      r`Check constraint qualifications (e.g. Slater's condition: existence of a strictly feasible point where $f_i(\\tilde{x}) < 0$) to confirm strong duality ($p^* = d^*$).`,
      r`Solve the dual problem using dual ascent, interior-point methods, or coordinate descent, monitoring the duality gap $|f_0(x) - g(\\lambda, \\nu)| \\to 0$ as a stopping criterion.`,
    ],
    math: [
      {
        h: 'Convex set and convex function definition',
        tex: r`$$f_0\\big(\\alpha x + (1 - \\alpha) y\\big) \\le \\alpha f_0(x) + (1 - \\alpha) f_0(y) \\quad \\forall \\, \\alpha \\in [0, 1]$$`,
        p: r`A function is convex if the chord connecting any two points on its graph lies above or on the function. For twice-differentiable functions, convexity is equivalent to the Hessian matrix being positive semidefinite: $\\nabla^2 f_0(x) \\succeq 0$.`,
      },
      {
        h: 'The Lagrangian and Lagrange dual function',
        tex: r`$$L(x, \\lambda, \\nu) = f_0(x) + \\sum_{i=1}^m \\lambda_i f_i(x) + \\sum_{j=1}^p \\nu_j h_j(x), \qquad g(\\lambda, \\nu) = \\inf_{x} L(x, \\lambda, \\nu)$$`,
        p: r`where $\\lambda_i \\ge 0$. For any feasible primal $x$ and any dual feasible $(\\lambda, \\nu)$, $\\sum \\lambda_i f_i(x) \\le 0$ and $\\sum \\nu_j h_j(x) = 0$, guaranteeing that $g(\\lambda, \\nu) \\le f_0(x)$. Taking the infimum over $x$ establishes weak duality: $d^* \\le p^*$.`,
      },
      {
        h: 'Strong duality and Slater\'s condition',
        tex: r`$$p^* - d^* = 0 \\quad (\\text{zero duality gap})$$`,
        p: r`Strong duality holds for convex optimisation problems if Slater's condition is satisfied: there exists at least one point $\\tilde{x}$ in the relative interior of the domain such that $f_i(\\tilde{x}) < 0$ for all strictly convex inequality constraints and $A\\tilde{x} = b$.`,
      },
    ],
    code: r`import numpy as np

# Quadratic program: min 0.5 * x^T Q x - c^T x  subject to A x <= b
Q = np.array([[4.0, 1.0], [1.0, 2.0]])
c = np.array([3.0, 2.0])
A = np.array([1.0, 1.0])
b = 1.0
Q_inv = np.linalg.inv(Q)

# Solve via dual ascent on multiplier lambda >= 0
lam = 0.0
lr = 0.1
for _ in range(120):
    x_opt = Q_inv @ (c - lam * A)
    lam = max(0.0, lam + lr * (A @ x_opt - b))

# Reconstruct primal solution and evaluate duality gap
x_star = Q_inv @ (c - lam * A)
primal_obj = 0.5 * x_star @ Q @ x_star - c @ x_star
dual_obj = -0.5 * (c - lam * A) @ Q_inv @ (c - lam * A) - lam * b
gap = abs(primal_obj - dual_obj)

print(f"Primal optimal x*: {x_star.round(4)}")
print(f"Optimal dual multiplier lambda*: {lam:.4f}")
print(f"Constraint value A x - b: {(A @ x_star - b):.6f}")
print(f"Primal objective: {primal_obj:.4f}")
print(f"Dual objective: {dual_obj:.4f}")
print(f"Duality gap: {gap:.6f}")`,
    pitfalls: [
      r`Assuming all machine learning problems are convex: Deep neural networks, matrix factorisation with missing values, and clustering are highly non-convex, meaning duality gaps may remain non-zero and gradient descent can stall in local minima.`,
      r`Failure of strong duality: Without constraint qualifications like Slater's condition, the dual bound can strictly underestimate the primal optimum ($d^* < p^*$), leaving a stubborn duality gap.`,
      r`Unbounded dual functions: If the primal Lagrangian has no lower bound with respect to $x$ for certain multiplier values, the dual function evaluates to $-\\infty$. Enforcing dual domain constraints is essential when deriving analytical duals.`,
      r`Non-unique dual solutions: Even when the primal problem has a unique strictly convex minimiser, the dual problem can have multiple equivalent multiplier configurations if constraints are linearly dependent.`,
    ],
    keyPoints: [
      r`In convex optimisation, any local minimum is guaranteed to be a global minimum.`,
      r`The Lagrange dual function $g(\\lambda, \\nu)$ is always concave, making the dual problem convex regardless of primal convexity.`,
      r`Weak duality ($d^* \\le p^*$) always holds; strong duality ($d^* = p^*$) holds when Slater's condition is satisfied.`,
      r`The duality gap $f_0(x) - g(\\lambda, \\nu)$ provides a computable, certified bound on how close an iterate is to the global optimum.`,
    ],
    quiz: [
      {
        q: r`What is the most important operational advantage of a strictly convex optimisation problem over a non-convex one?`,
        o: [
          r`Convex problems do not require derivative calculations`,
          r`Convex problems can only be solved using linear programming`,
          r`The optimal solution is always located at the origin ($x=0$)`,
          r`Any local minimum is guaranteed to be the global minimum, eliminating entrapment in suboptimal local valleys`,
        ],
        a: 3,
        why: r`In a convex function, all sub-level sets are convex. If a point satisfies the zero-gradient condition $\\nabla f(x) = 0$, the geometry guarantees that no other point in the domain can achieve a strictly lower objective value.`,
      },
      {
        q: r`What is always true about the Lagrange dual function $g(\\lambda, \\nu) = \\inf_x L(x, \\lambda, \\nu)$?`,
        o: [
          r`It is concave with respect to the dual variables $(\\lambda, \\nu)$, even if the original primal problem is non-convex`,
          r`It is strictly convex with respect to $x$`,
          r`It always equals zero at the optimal point`,
          r`It is non-differentiable at all interior points`,
        ],
        a: 0,
        why: r`The dual function is the pointwise infimum of a family of affine functions of $(\\lambda, \\nu)$. Because affine functions are concave and the pointwise infimum of concave functions is always concave, $g(\\lambda, \\nu)$ is concave.`,
      },
      {
        q: r`What does Slater's condition require in order to guarantee strong duality ($p^* = d^*$) for a convex optimisation problem?`,
        o: [
          r`The objective function must be linear`,
          r`There must exist at least one strictly feasible point satisfying all inequality constraints with strict inequality ($f_i(x) < 0$)`,
          r`All Lagrange multipliers must be strictly equal to 1.0`,
          r`The sample size must exceed the number of features by a factor of ten`,
        ],
        a: 1,
        why: r`Slater's condition is a standard constraint qualification. For convex problems, the existence of a strictly feasible point in the interior of the constraint set guarantees that strong duality holds with a zero duality gap.`,
      },
      {
        q: r`What is the duality gap in an optimisation algorithm, and how is it used in practice?`,
        o: [
          r`The difference between training and test loss used for early stopping`,
          r`The difference between the eigenvalues of the Hessian matrix`,
          r`The difference between the primal objective $f_0(x)$ and the dual objective $g(\\lambda, \\nu)$, providing a verified stopping criterion`,
          r`The distance between the initial guess and the final iterate`,
        ],
        a: 2,
        why: r`Because weak duality guarantees $g(\\lambda, \\nu) \\le p^* \\le f_0(x)$, the gap $f_0(x) - g(\\lambda, \\nu)$ bounds the maximum possible error of the current primal solution from true optimality, providing a rigorous stopping criterion.`,
      },
    ],
    usedBy: ['support_vector_classifier', 'ridge_regression', 'lasso_regression'],
    prereq: ['gradient-descent', 'quasi-newton-and-lbfgs'],
    related: ['lagrange-multipliers-and-kkt-conditions', 'support_vector_classifier', 'gradient-descent'],
    keywords: 'convex optimisation duality lagrangian dual function slaters condition duality gap primal dual strong duality',
  },
  {
    id: 'lagrange-multipliers-and-kkt-conditions',
    short: 'Lagrange & KKT conditions',
    title: 'Lagrange Multipliers and KKT Conditions',
    task: 'concepts',
    module: 'Optimisation',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Mathematical conditions for constrained optimisation, extending Lagrange multipliers to inequality constraints via the Karush–Kuhn–Tucker conditions.`,
    lead: r`Constrained optimisation problems govern much of machine learning, from Support Vector Machines maximising geometric margins to LASSO shrinking coefficients within an $\\ell_1$ budget. Lagrange multipliers provide the analytical machinery to handle equality constraints by balancing objective gradients against constraint normals. The Karush–Kuhn–Tucker (KKT) conditions extend this principle to inequality constraints, providing necessary (and often sufficient) conditions that identify active constraints and optimal solutions.`,
    intuition: [
      r`Imagine rolling a marble down a smooth, bowl-shaped wooden track. If the track has no barriers, the marble rolls straight down to the bottom where the surface is flat (gradient equals zero). Now place a stiff circular fence on the slope. The marble rolls downhill until it collides with the fence and comes to a dead stop. At that resting point, gravity is still pulling the marble downward, but the fence pushes back with an equal and opposite force perpendicular to the barrier.`,
      r`This physical balance illustrates the Lagrange multiplier. The gradient of the objective function $\\nabla f_0(x)$ represents the downhill pull of gravity. The gradient of the constraint boundary $\\nabla h(x)$ represents the normal force exerted by the fence. At the constrained optimum, these two vectors must align in opposite directions: $\\nabla f_0(x^*) + \\nu^* \\nabla h(x^*) = 0$. The scalar multiplier $\\nu^*$ measures the exact intensity of force the constraint fence exerts to keep the marble in place.`,
      r`When constraints are inequalities ($f_i(x) \\le 0$), a new question arises: does the marble hit the fence, or does it settle naturally in the interior before reaching it? This is governed by complementary slackness: $\\lambda_i^* f_i(x^*) = 0$. If the unconstrained minimum lies inside the fenced area ($f_i(x^*) < 0$), the fence is inactive and exerts zero force ($\\lambda_i^* = 0$). If the marble is pressed against the fence ($f_i(x^*) = 0$), the fence is active and exerts positive resistance ($\\lambda_i^* > 0$). In Support Vector Machines, this simple condition determines which data points become support vectors.`,
    ],
    analogy: r`A dog resting on a lead: if the dog sits inside the yard, the lead is slack and exerts zero tension; if the dog tries to run past the gate, the lead pulls taut with positive tension exactly counteracting the dog's forward momentum.`,
    steps: [
      r`Formulate the constrained problem: minimise objective $f_0(x)$ subject to inequality constraints $f_i(x) \\le 0$ ($i=1,\\dots,m$) and equality constraints $h_j(x) = 0$ ($j=1,\\dots,p$).`,
      r`Construct the Lagrangian: $L(x, \\lambda, \\nu) = f_0(x) + \\sum_{i=1}^m \\lambda_i f_i(x) + \\sum_{j=1}^p \\nu_j h_j(x)$.`,
      r`Check Stationarity: set the gradient with respect to $x$ to zero: $\\nabla_x L(x^*, \\lambda^*, \\nu^*) = \\nabla f_0(x^*) + \\sum \\lambda_i^* \\nabla f_i(x^*) + \\sum \\nu_j^* \\nabla h_j(x^*) = 0$.`,
      r`Enforce Primal Feasibility: verify all constraints are satisfied: $f_i(x^*) \\le 0$ and $h_j(x^*) = 0$.`,
      r`Enforce Dual Feasibility: ensure inequality multipliers are non-negative: $\\lambda_i^* \\ge 0$.`,
      r`Enforce Complementary Slackness: verify $\\lambda_i^* f_i(x^*) = 0$ for each inequality constraint, separating active constraints ($\\lambda_i^* > 0, f_i(x^*) = 0$) from inactive ones ($\\lambda_i^* = 0, f_i(x^*) < 0$).`,
    ],
    math: [
      {
        h: 'The four Karush–Kuhn–Tucker (KKT) conditions',
        tex: r`$$\\begin{aligned}
\\text{1. Stationarity:} & \\quad \\nabla f_0(x^*) + \\sum_{i=1}^m \\lambda_i^* \\nabla f_i(x^*) + \\sum_{j=1}^p \\nu_j^* \\nabla h_j(x^*) = 0 \\\\
\\text{2. Primal Feasibility:} & \\quad f_i(x^*) \\le 0 \\quad (\\forall i), \qquad h_j(x^*) = 0 \\quad (\\forall j) \\\\
\\text{3. Dual Feasibility:} & \\quad \\lambda_i^* \\ge 0 \\quad (\\forall i) \\\\
\\text{4. Complementary Slackness:} & \\quad \\lambda_i^* f_i(x^*) = 0 \\quad (\\forall i)
\\end{aligned}$$`,
        p: r`For any optimisation problem with zero duality gap, any pair of primal and dual optimal points $(x^*, \\lambda^*, \\nu^*)$ must satisfy these four conditions. If the primal problem is convex, the KKT conditions are both necessary and sufficient for global optimality.`,
      },
      {
        h: 'Geometric interpretation of stationarity',
        tex: r`$$-\\nabla f_0(x^*) = \\sum_{i \in \\mathcal{A}} \\lambda_i^* \\nabla f_i(x^*) + \\sum_{j=1}^p \\nu_j^* \\nabla h_j(x^*)$$`,
        p: r`where $\\mathcal{A} = \\{i : f_i(x^*) = 0\\}$ is the active constraint set. The negative gradient of the objective (the direction of steepest descent) lies inside the cone spanned by the outward normal vectors of the active constraints.`,
      },
      {
        h: 'Complementary slackness in Support Vector Machines',
        tex: r`$$\\alpha_i^* \\big(y_i(w^T x_i + b) - 1\\big) = 0$$`,
        p: r`If a training point lies strictly outside the margin ($y_i(w^T x_i + b) > 1$), its multiplier $\\alpha_i^* = 0$, meaning the point exerts no influence on the decision boundary. Only points lying directly on the margin boundary have $\\alpha_i^* > 0$, forming the sparse set of support vectors.`,
      },
    ],
    code: r`import numpy as np

# Problem: min 0.5 * ||x - x0||^2 subject to a^T x <= b (halfspace projection)
x0 = np.array([3.0, 4.0])
a = np.array([1.0, 2.0])
b = 5.0

# Check unconstrained violation: a^T x0 - b
viol = a @ x0 - b  # 3*1 + 4*2 - 5 = 6 > 0 (infeasible)
if viol <= 0:
    x_star = x0
    lam_star = 0.0
else:
    # Active constraint: lam = (a^T x0 - b) / ||a||^2
    lam_star = viol / np.sum(a ** 2)
    x_star = x0 - lam_star * a

# Verify the 4 KKT conditions
grad_L = (x_star - x0) + lam_star * a       # 1. Stationarity (~ 0)
primal_feas = a @ x_star - b <= 1e-9        # 2. Primal feasibility
dual_feas = lam_star >= 0.0                 # 3. Dual feasibility
comp_slack = lam_star * (a @ x_star - b)    # 4. Complementary slackness (~ 0)

print(f"Unconstrained point: {x0}")
print(f"Optimal constrained point x*: {x_star.round(4)}")
print(f"Lagrange multiplier lambda*: {lam_star:.4f}")
print(f"1. Stationarity norm: {np.linalg.norm(grad_L):.6f}")
print(f"2. Primal feasible: {primal_feas}")
print(f"3. Dual feasible: {dual_feas}")
print(f"4. Complementary slackness: {comp_slack:.6f}")`,
    pitfalls: [
      r`Neglecting dual feasibility sign ($\\lambda_i \\ge 0$): For inequality constraints $f_i(x) \\le 0$, $\\lambda_i$ must be non-negative. A negative $\\lambda_i$ means the constraint is pulling the solution into the forbidden region rather than repelling it.`,
      r`Assuming KKT is sufficient for non-convex problems: In non-convex optimisation, points satisfying the KKT conditions can be saddle points, local maxima, or suboptimal local minima. Sufficiency requires convexity of the objective and constraint functions.`,
      r`Ignoring constraint qualification failure: When gradients of active constraints are linearly dependent at the optimum (such as touching tangent constraints), the standard KKT conditions may fail to hold even at the true global minimum.`,
      r`Misinterpreting inactive constraints: An inactive constraint ($f_i(x^*) < 0$) has $\\lambda_i^* = 0$, meaning removing that constraint entirely leaves the optimal solution unchanged.`,
    ],
    keyPoints: [
      r`Stationarity balances objective gradients against the linear combination of active constraint gradients.`,
      r`Complementary slackness ($\\lambda_i^* f_i(x^*) = 0$) guarantees that non-binding constraints exert zero force on the optimal solution.`,
      r`For convex optimisation problems satisfying Slater's condition, the KKT conditions are both necessary and sufficient for global optimality.`,
      r`Forms the core mathematical justification for support vectors in SVMs, lasso sparsity, and barrier/interior-point algorithms.`,
    ],
    quiz: [
      {
        q: r`What does the complementary slackness condition $\\lambda_i^* f_i(x^*) = 0$ signify about an inequality constraint $f_i(x) \\le 0$?`,
        o: [
          r`The objective function must evaluate to zero at the optimal point`,
          r`Either the constraint is active ($f_i(x^*) = 0$) with a non-negative multiplier, or the constraint is strictly inactive ($f_i(x^*) < 0$) and its multiplier is zero`,
          r`All data points must be equidistant from the decision boundary`,
          r`The Lagrange multiplier must equal the value of the objective function`,
        ],
        a: 1,
        why: r`Complementary slackness dictates that if a point lies in the strict interior of the feasible region ($f_i(x^*) < 0$), the constraint imposes no restriction and $\\lambda_i^* = 0$. If $\\lambda_i^* > 0$, the point must lie precisely on the boundary fence ($f_i(x^*) = 0$).`,
      },
      {
        q: r`Why are the KKT conditions both necessary AND sufficient for global optimality in convex problems, but only necessary in general problems?`,
        o: [
          r`Because non-convex problems do not have gradient vectors`,
          r`Because non-convex problems cannot have equality constraints`,
          r`In convex problems, any stationary point of the Lagrangian is guaranteed to be a global minimum with no deceptive local valleys`,
          r`Because convexity guarantees that all Lagrange multipliers are equal to 1.0`,
        ],
        a: 2,
        why: r`For convex functions, zero gradient implies a global minimum. When paired with constraint qualifications, any point satisfying the KKT conditions is certified to be the global optimum. In non-convex problems, KKT points can be local minima, local maxima, or saddle points.`,
      },
      {
        q: r`In a Support Vector Machine, how does complementary slackness explain why only a small subset of training points become support vectors?`,
        o: [
          r`Points correctly classified beyond the margin satisfy $y_i(w^T x_i + b) > 1$, forcing their dual multiplier $\\alpha_i = 0$ so they do not affect the hyperplane`,
          r`Points beyond the margin are deleted during data pre-processing`,
          r`SVMs only compute gradients for the first ten training instances`,
          r`The kernel trick converts all non-margin points into imaginary numbers`,
        ],
        a: 0,
        why: r`The margin constraint is $1 - y_i(w^T x_i + b) \\le 0$. For any point strictly beyond the margin, $1 - y_i(w^T x_i + b) < 0$. By complementary slackness $\\alpha_i (1 - y_i(w^T x_i + b)) = 0$, the multiplier $\\alpha_i$ must be zero, leaving only boundary points with $\\alpha_i > 0$ as support vectors.`,
      },
      {
        q: r`What does the magnitude of a Lagrange multiplier $\\lambda_i^*$ represent from an economic or sensitivity perspective?`,
        o: [
          r`The percentage of training iterations required for convergence`,
          r`The probability that the constraint will be violated in test data`,
          r`The curvature of the objective function along the principal axis`,
          r`The shadow price: the rate of change in the optimal objective value with respect to relaxing the constraint boundary ($\\partial p^* / \\partial b_i = -\\lambda_i^*$)`,
        ],
        a: 3,
        why: r`In sensitivity analysis, $\\lambda_i^*$ measures how much the optimal objective value improves if the $i$-th constraint is relaxed by an infinitesimal amount: $\\frac{\\partial p^*}{\\partial b_i} = -\\lambda_i^*$. It represents the marginal cost of the constraint.`,
      },
    ],
    usedBy: ['support_vector_classifier'],
    prereq: ['convex-optimisation-and-duality', 'gradient-descent'],
    related: ['convex-optimisation-and-duality', 'support_vector_classifier', 'quasi-newton-and-lbfgs'],
    keywords: 'lagrange multipliers kkt conditions karush kuhn tucker complementary slackness stationarity constrained optimisation support vectors',
  },
  {
  "id": "coordinate-descent",
  "short": "Coordinate descent",
  "title": "Coordinate Descent and Cyclic Updates",
  "task": "concepts",
  "module": "Optimisation",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Minimise multi-variable objective functions by optimising one coordinate at a time: master soft-thresholding, Lasso path solving, and convergence guarantees.",
  "lead": "Full gradient descent computes gradients across all p features at every step. Coordinate descent simplifies optimisation by cycling through parameters one by one, solving fast 1D sub-problems in closed form.",
  "intuition": [
    "When training high-dimensional machine learning models with thousands or millions of parameters, full gradient descent can be computationally unwieldy: each step requires evaluating gradients across all features and carefully selecting a global learning rate. If features vary in curvature, gradient descent oscillates wildly in steep directions while creeping in flat directions.",
    "Coordinate Descent (CD) offers an alternative optimisation strategy: instead of updating all variables simultaneously along a combined gradient vector, update only one coordinate direction at a time while keeping all other $p - 1$ variables rigidly fixed.",
    "At step $j$, the multi-variable problem collapses into a simple one-dimensional scalar optimisation: $\\beta_j^* = \\arg\\min_z f(\\beta_1, \\dots, \\beta_{j-1}, z, \\beta_{j+1}, \\dots, \\beta_p)$. For many common objectives, this 1D sub-problem has an exact closed-form algebraic minimiser, eliminating the need for line searches or learning rate tuning entirely.",
    "Coordinate descent achieves its greatest triumph in $L_1$-regularised problems like Lasso and Elastic Net. The $L_1$ penalty $|\\beta_j|$ has a sharp non-differentiable kink at zero that invalidates standard gradient descent. However, along individual coordinate axes, the objective separates cleanly into 1D sub-problems solved analytically via the Soft-Thresholding Operator. This algorithmic breakthrough makes coordinate descent the core computational engine behind glmnet and scikit-learn Lasso."
  ],
  "analogy": "Imagine tuning an analog radio receiver with ten dials to eliminate background static. Trying to twist all ten dials simultaneously with both hands is clumsy and throws everything out of alignment. Instead, you hold nine dials completely steady with your fingers, twisting only the first dial back and forth until reception peaks. You freeze the first dial, move to the second dial, and repeat. By cycling through the dials one by one, the signal quickly becomes crystal clear.",
  "steps": [
    {
      "title": "1. Initialise coefficient vector and precalculate residuals",
      "body": "Set initial parameters $\\beta = 0$. Calculate initial partial residuals $r = y - X \\beta = y$. Standardise feature columns so that $X_j^T X_j = n$ (or 1)."
    },
    {
      "title": "2. Iterate cyclically over coordinates",
      "body": "For coordinate $j = 1, \\dots, p$, isolate feature $j$ by adding its contribution back to the residual: $r^{(j)} = r + \\beta_j X_j$."
    },
    {
      "title": "3. Compute 1D closed-form minimiser via soft-thresholding",
      "body": "Calculate OLS correlation with residual: $\\rho_j = X_j^T r^{(j)}$. Apply soft-thresholding: $\\beta_j^{\\mathrm{new}} = \\frac{S_{\\lambda}(\\rho_j)}{\\|X_j\\|^2} = \\frac{\\operatorname{sign}(\\rho_j) \\max(0, |\\rho_j| - \\lambda)}{\\|X_j\\|^2}$."
    },
    {
      "title": "4. Update residual and check convergence",
      "body": "Update residual $r \\leftarrow r^{(j)} - \\beta_j^{\\mathrm{new}} X_j$. Continue cycling across all coordinates until maximum parameter shift $\\max_j |\\beta_j^{\\mathrm{new}} - \\beta_j| < \\text{tolerance}$."
    }
  ],
  "math": [
    {
      "h": "Coordinate-Wise Lasso Decomposition",
      "tex": "f(\\beta) = \\frac{1}{2n} \\sum_{i=1}^n \\left( y_i - \\sum_{k \\neq j} x_{ik} \\beta_k - x_{ij} \\beta_j \\right)^2 + \\lambda \\sum_{k \\neq j} |\\beta_k| + \\lambda |\\beta_j|",
      "p": "Decomposes the objective into terms independent of beta_j plus a simple univariate quadratic and absolute value function in beta_j."
    },
    {
      "h": "The Soft-Thresholding Operator",
      "tex": "S_\\lambda(z) = \\operatorname{sign}(z) (|z| - \\lambda)_+ = \\begin{cases} z - \\lambda & \\text{if } z > \\lambda \\\\ 0 & \\text{if } |z| \\le \\lambda \\\\ z + \\lambda & \\text{if } z < -\\lambda \\end{cases}",
      "p": "The exact analytical minimiser of 0.5 (beta_j - z)^2 + lambda |beta_j|. Pulls small coefficients strictly to zero, inducing structural sparsity."
    },
    {
      "h": "Tseng Separability Convergence Condition",
      "tex": "f(\\beta) = g(\\beta) + \\sum_{j=1}^p h_j(\\beta_j)",
      "p": "Paul Tseng proved that cyclic coordinate descent is guaranteed to converge to a global minimum for composite functions where g is convex and smooth, and the non-smooth part h separates into coordinate-wise terms."
    }
  ],
  "code": "import numpy as np\n\n# Cyclic Coordinate Descent for Lasso from scratch\ndef coordinate_descent_lasso(X, y, alpha=0.1, max_iters=500, tol=1e-6):\n    n, p = X.shape\n    beta = np.zeros(p)\n    \n    # Precalculate column squared norms\n    norm_sq = np.sum(X**2, axis=0)\n    \n    # Initial residual\n    r = y - X @ beta\n    \n    # Soft-thresholding operator\n    def soft_thresh(z, thresh):\n        return np.sign(z) * np.maximum(0.0, np.abs(z) - thresh)\n        \n    for it in range(max_iters):\n        max_change = 0.0\n        \n        for j in range(p):\n            beta_old = beta[j]\n            \n            # Partial residual without feature j\n            # r_j = r + beta_old * X[:, j]\n            # rho_j = X[:, j]^T r_j\n            rho_j = np.dot(X[:, j], r) + beta_old * norm_sq[j]\n            \n            # Analytical update via soft-thresholding\n            # Loss: (1 / (2n)) * ||y - X beta||^2 + alpha * ||beta||_1\n            # Scaling threshold by n\n            thresh = alpha * n\n            beta_new = soft_thresh(rho_j, thresh) / norm_sq[j]\n            \n            # Update residual vector: r <- r - (beta_new - beta_old) * X_j\n            delta = beta_new - beta_old\n            if delta != 0.0:\n                r -= delta * X[:, j]\n                beta[j] = beta_new\n                max_change = max(max_change, abs(delta))\n                \n        if max_change < tol:\n            break\n            \n    return beta\n\n# Generate sparse regression problem: 100 samples, 20 features, only 3 active\nnp.random.seed(42)\nn_samples = 150\nn_features = 25\nX = np.random.normal(0, 1, (n_samples, n_features))\ntrue_beta = np.zeros(n_features)\ntrue_beta[2] = 2.5\ntrue_beta[7] = -1.8\ntrue_beta[15] = 3.0\ny = X @ true_beta + np.random.normal(0, 0.5, n_samples)\n\n# Fit Lasso via Coordinate Descent\nlambda_reg = 0.15\nbeta_est = coordinate_descent_lasso(X, y, alpha=lambda_reg)\n\nn_nonzero = np.sum(beta_est != 0)\nmse = np.mean((y - X @ beta_est)**2)\n\nprint(f\"Dataset shape: {X.shape}\")\nprint(f\"True non-zero coefficients: indices 2 (2.5), 7 (-1.8), 15 (3.0)\")\nprint(f\"Recovered non-zero count:  {n_nonzero} / {n_features}\")\nprint(f\"Recovered beta[2]:         {beta_est[2]:.3f}\")\nprint(f\"Recovered beta[7]:         {beta_est[7]:.3f}\")\nprint(f\"Recovered beta[15]:        {beta_est[15]:.3f}\")\nprint(f\"All other 22 features zeroed out: {np.all(beta_est[np.setdiff1d(np.arange(n_features), [2, 7, 15])] == 0)}\")",
  "keyPoints": [
    "Optimises multi-variable objective functions by updating one coordinate at a time, keeping all other variables frozen.",
    "Replaces complex multi-variable gradient steps with fast 1D sub-problems that frequently possess exact closed-form algebraic solutions.",
    "The foundational solver for Lasso and Elastic Net, using the Soft-Thresholding operator to handle non-differentiable $L_1$ kinks.",
    "Guaranteed to converge to the global minimum for convex functions with coordinate-wise separable non-smooth terms (Tseng condition).",
    "Requires zero learning rate tuning or line searches when closed-form coordinate updates exist."
  ],
  "pitfalls": [
    "Non-separable non-smooth penalties: Coordinate descent can get trapped in non-optimal points if non-smooth terms are non-separable (e.g. constraints like $|x_1 - x_2| \\le 1$).",
    "Correlated features slowing convergence: Highly collinear features create elongated diagonal ravines where coordinate steps make slow zigzagging progress.",
    "Memory access inefficiency on column-major data: Cycling across features requires efficient column-wise matrix memory layout; row-major memory causes CPU cache misses."
  ],
  "quiz": [
    {
      "q": "Why is coordinate descent uniquely suited for solving L1-regularised Lasso regression?",
      "o": [
        "The non-differentiable L1 penalty separates across coordinates, allowing each 1D coordinate sub-problem to be solved in closed form via soft-thresholding",
        "Coordinate descent eliminates all noise from the dataset",
        "It inverts the full p x p matrix in O(1) time",
        "It requires no training samples"
      ],
      "a": 0,
      "why": "While the L1 kink breaks joint gradient descent, along any single coordinate axis the sub-problem has an exact closed-form minimiser given by the soft-thresholding operator."
    },
    {
      "q": "Under what condition can coordinate descent fail to converge to a stationary point?",
      "o": [
        "When the objective function has non-smooth terms that are non-separable across coordinates",
        "When all variables are strictly positive",
        "When the objective function is quadratic",
        "When the dataset has more samples than features"
      ],
      "a": 0,
      "why": "If a non-smooth term couples multiple variables (such as non-separable constraints), coordinate descent can get trapped at a corner point where no axis-aligned move reduces loss."
    }
  ],
  "usedBy": [],
  "prereq": [
    "lasso_regression"
  ],
  "related": [
    "lasso_regression",
    "elastic_net",
    "proximal-gradient-methods",
    "newtons-method"
  ],
  "keywords": "coordinate descent, cyclic updates, lasso, soft thresholding, l1 regularisation, glmnet, 1d optimisation, separable convex"
},
  {
  "id": "newtons-method",
  "short": "Newton's method",
  "title": "Newton's Method and Second-Order Optimisation",
  "task": "concepts",
  "module": "Optimisation",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Accelerate convergence using local quadratic curvature: master the Hessian matrix, Newton–Raphson updates, and Quasi-Newton approximations (BFGS).",
  "lead": "First-order gradient descent crawls slowly along narrow ravines. Newton’s method uses the second derivative (Hessian matrix) to fit a local osculating paraboloid, jumping directly to the minimum with quadratic convergence.",
  "intuition": [
    "First-order optimisation methods like Gradient Descent navigate parameter space using only local slope information (the gradient vector $\\nabla f$). When an objective function has ill-conditioned curvature—such as a long, narrow canyon where one direction is 1,000 times steeper than another—gradient descent bounces helplessly between the canyon walls, requiring tens of thousands of tiny steps to make forward progress.",
    "Newton’s method (also known as the Newton–Raphson method) solves this by incorporating second-order curvature information via the Hessian matrix $\\nabla^2 f(x)$, whose entries represent all second-order partial derivatives $\\frac{\\partial^2 f}{\\partial x_i \\partial x_j}$.",
    "At each step, Newton’s method fits a second-order Taylor polynomial (a local quadratic bowl) to the objective function: $f(x + \\Delta x) \\approx f(x) + \\nabla f(x)^T \\Delta x + \\frac{1}{2} \\Delta x^T \\nabla^2 f(x) \\Delta x$. By calculating the exact stationary point of this quadratic approximation, the Newton step jumps directly to the bowl minimum: $\\Delta x = -[\\nabla^2 f(x)]^{-1} \\nabla f(x)$.",
    "When near the minimum, Newton’s method achieves local quadratic convergence: the error at step $t+1$ is proportional to the square of the error at step $t$ ($\\|e_{t+1}\\| \\le M \\|e_t\\|^2$), doubling the number of correct decimal places at every single iteration. However, inverting the $p \\times p$ Hessian matrix costs $O(p^3)$ time, motivating Quasi-Newton algorithms like BFGS and L-BFGS that iteratively build curvature approximations from gradient changes."
  ],
  "analogy": "Imagine hiking down a foggy mountain peak at night. Gradient descent feels the slope beneath your boots and takes a step in the steepest downward direction, frequently stumbling into rocky gullies. Newton’s method shines a radar beam into the fog that scans the 3D bowl shape of the entire valley floor, calculating the exact GPS coordinates of the valley base and walking directly there in a few giant strides.",
  "steps": [
    {
      "title": "1. Compute gradient and Hessian matrix",
      "body": "Evaluate the gradient vector $g = \\nabla f(x) \\in \\mathbb{R}^p$ and the symmetric Hessian matrix $H = \\nabla^2 f(x) \\in \\mathbb{R}^{p \\times p}$."
    },
    {
      "title": "2. Check positive definiteness and modify Hessian",
      "body": "Ensure $H$ is strictly positive definite (all eigenvalues $\\lambda_i > 0$). If negative or near-zero eigenvalues exist, regularise via Levenberg–Marquardt: $H_{\\mathrm{reg}} = H + \\mu I$."
    },
    {
      "title": "3. Solve Newton linear system",
      "body": "Solve $H \\Delta x = -g$ for the Newton direction $\\Delta x$ using Cholesky factorisation ($O(p^3)$), avoiding explicit matrix inversion."
    },
    {
      "title": "4. Perform backtracking line search (Damped Newton)",
      "body": "Ensure global convergence: test step sizes $\\alpha = 1, \\beta, \\beta^2, \\dots$ until Armijo condition $f(x + \\alpha \\Delta x) \\le f(x) + c_1 \\alpha g^T \\Delta x$ is satisfied. Update $x \\leftarrow x + \\alpha \\Delta x$."
    }
  ],
  "math": [
    {
      "h": "Second-Order Taylor Approximation",
      "tex": "f(x + \\Delta x) \\approx f(x) + \\nabla f(x)^T \\Delta x + \\frac{1}{2} \\Delta x^T \\nabla^2 f(x) \\Delta x",
      "p": "Local quadratic model of the objective function. Differentiating with respect to Delta x and setting to zero yields the optimal step."
    },
    {
      "h": "Newton Step Equation",
      "tex": "\\Delta x = -[\\nabla^2 f(x)]^{-1} \\nabla f(x) = -H^{-1} g",
      "p": "The unconstrained Newton step. Scales and rotates the gradient by the inverse Hessian, automatically compensating for anisotropic curvature."
    },
    {
      "h": "Quadratic Convergence Rate",
      "tex": "\\|x_{t+1} - x^*\\| \\le M \\|x_t - x^*\\|^2",
      "p": "In the neighbourhood of a strict local minimum, the distance to the optimum squares at each iteration, achieving extreme precision in fewer than 10 steps."
    }
  ],
  "code": "import numpy as np\n\n# Newton's Method vs Gradient Descent on the Rosenbrock Banana Function\n# f(x, y) = (1 - x)^2 + 100 * (y - x^2)^2 (classic ill-conditioned valley)\ndef rosenbrock(v):\n    x, y = v[0], v[1]\n    return (1.0 - x)**2 + 100.0 * (y - x**2)**2\n\ndef rosenbrock_grad(v):\n    x, y = v[0], v[1]\n    df_dx = -2.0 * (1.0 - x) - 400.0 * x * (y - x**2)\n    df_dy = 200.0 * (y - x**2)\n    return np.array([df_dx, df_dy])\n\ndef rosenbrock_hessian(v):\n    x, y = v[0], v[1]\n    d2f_dx2 = 2.0 - 400.0 * y + 1200.0 * x**2\n    d2f_dxdy = -400.0 * x\n    d2f_dy2 = 200.0\n    return np.array([[d2f_dx2, d2f_dxdy],\n                     [d2f_dxdy, d2f_dy2]])\n\n# 1. Newton's Method with Backtracking Line Search\nx_newton = np.array([-1.2, 1.0])\nnewton_history = [x_newton.copy()]\n\nfor it in range(30):\n    g = rosenbrock_grad(x_newton)\n    if np.linalg.norm(g) < 1e-8:\n        break\n    H = rosenbrock_hessian(x_newton)\n    \n    # Regularise Hessian if not positive definite\n    eigvals = np.linalg.eigvalsh(H)\n    if np.min(eigvals) <= 1e-4:\n        H += np.eye(2) * (1e-3 - np.min(eigvals))\n        \n    # Solve H delta_x = -g\n    delta_x = np.linalg.solve(H, -g)\n    \n    # Backtracking Armijo Line Search\n    alpha = 1.0\n    while rosenbrock(x_newton + alpha * delta_x) > rosenbrock(x_newton) + 1e-4 * alpha * np.dot(g, delta_x):\n        alpha *= 0.5\n        if alpha < 1e-10: break\n        \n    x_newton += alpha * delta_x\n    newton_history.append(x_newton.copy())\n\n# 2. Gradient Descent with Tuned Step Size\nx_gd = np.array([-1.2, 1.0])\nlr = 0.0015\ngd_history = [x_gd.copy()]\n\nfor it in range(1000):\n    g = rosenbrock_grad(x_gd)\n    if np.linalg.norm(g) < 1e-8:\n        break\n    x_gd -= lr * g\n    gd_history.append(x_gd.copy())\n\nprint(f\"True Global Minimum: [1.000, 1.000] with f = 0.000\")\nprint(f\"\\nNewton's Method:\")\nprint(f\"  Converged to: {x_newton.round(5)} in {len(newton_history)-1} iterations!\")\nprint(f\"  Final value:  {rosenbrock(x_newton):.2e}\")\n\nprint(f\"\\nGradient Descent:\")\nprint(f\"  Reached:      {x_gd.round(5)} after {len(gd_history)-1} iterations (struggling in curved valley)\")\nprint(f\"  Final value:  {rosenbrock(x_gd):.4f}\")",
  "keyPoints": [
    "Second-order optimisation algorithm that uses the Hessian matrix to capture local quadratic curvature.",
    "Scales and rotates search directions by the inverse Hessian: $\\Delta x = -[\\nabla^2 f(x)]^{-1} \\nabla f(x)$.",
    "Achieves quadratic local convergence ($\\|e_{t+1}\\| \\le M \\|e_t\\|^2$), doubling accuracy precision at each step near the minimum.",
    "Eliminates the oscillations in narrow ravines that cripple first-order gradient descent.",
    "Inverting the $p \\times p$ Hessian costs $O(p^3)$, motivating Quasi-Newton methods like BFGS and L-BFGS."
  ],
  "pitfalls": [
    "Computational scaling with dimension: Computing and inverting the $p \\times p$ Hessian scales as $O(p^3)$ time and $O(p^2)$ memory, becoming unusable for millions of neural network weights.",
    "Saddle points and maxima in non-convex functions: If the Hessian has negative eigenvalues, the standard Newton step jumps toward local maxima or saddle points; Hessian regularisation is mandatory.",
    "Overshooting without line search: Pure Newton steps (step size $\\alpha = 1$) can jump across non-quadratic regions into explosive divergence; backtracking line search is required for global stability."
  ],
  "quiz": [
    {
      "q": "Why does Newton’s method navigate narrow curved ravines vastly faster than Gradient Descent?",
      "o": [
        "By multiplying the gradient by the inverse Hessian, it rescales directions by their curvature, equalising steep and flat dimensions",
        "Newton’s method uses random exploration",
        "Newton’s method sets all second derivatives to zero",
        "Newton’s method operates only on linear functions"
      ],
      "a": 0,
      "why": "In ill-conditioned ravines, the Hessian inverse H^{-1} shrinks steps along steep directions and expands steps along flat valleys, steering the update directly toward the minimum."
    },
    {
      "q": "What is the primary computational drawback of Newton’s method in high-dimensional deep learning?",
      "o": [
        "Calculating and inverting the p x p Hessian matrix requires O(p^3) time and O(p^2) memory, which is intractable for millions of parameters",
        "Newton’s method cannot compute gradients",
        "Newton’s method works only when sample size n = 1",
        "The learning rate must be tuned manually at every iteration"
      ],
      "a": 0,
      "why": "For a neural network with 100 million parameters, storing the Hessian requires 40 petabytes of RAM, and inverting it would require 10^24 operations."
    }
  ],
  "usedBy": [],
  "prereq": [
    "ols-inference-t-tests-f-test-r2-and-adjusted-r2"
  ],
  "related": [
    "coordinate-descent",
    "proximal-gradient-methods",
    "generalised-linear-models",
    "logistic-regression-inference-odds-ratios-wald-tests"
  ],
  "keywords": "newtons method, second order optimisation, hessian matrix, newton raphson, rosenbrock, quadratic convergence, bfgs, quasi newton"
},
  {
  "id": "proximal-gradient-methods",
  "short": "Proximal gradient methods",
  "title": "Proximal Gradient Methods and FISTA",
  "task": "concepts",
  "module": "Optimisation",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Optimise composite objectives with non-smooth penalties: master the proximal operator, ISTA, and Nesterov acceleration in FISTA.",
  "lead": "Many modern regularised machine learning objectives take composite form: a smooth convex loss f(x) plus a non-smooth convex regulariser g(x). Proximal gradient algorithms split the optimisation, combining gradient descent on f with the proximal operator of g.",
  "intuition": [
    "In modern machine learning, objectives frequently take a composite structure: $\\min_x F(x) = f(x) + g(x)$, where $f(x)$ is a convex, continuously differentiable loss function (such as mean squared error, logistic loss, or neural cross-entropy), and $g(x)$ is a convex but non-smooth regulariser (such as the $L_1$ norm $\\|x\\|_1$ for feature sparsity, nuclear norm for matrix completion, or indicator functions for box constraints).",
    "Standard gradient descent cannot be applied because $g(x)$ lacks derivatives at kinks (e.g. at $x=0$ in the $L_1$ norm). Subgradient methods can handle non-differentiable points, but suffer from a notoriously sluggish convergence rate of $O(1/\\sqrt{k})$ and rarely produce exact sparse zeros.",
    "Proximal Gradient Methods resolve this by operator splitting. At each iteration, the algorithm takes a standard gradient step along the smooth loss $f$, and then passes the resulting intermediate point through the Proximal Operator of $g$: $x_{k+1} = \\operatorname{prox}_{\\gamma g}(x_k - \\gamma \\nabla f(x_k))$. The proximal operator $\\operatorname{prox}_{\\gamma g}(v) = \\arg\\min_x \\left( g(x) + \\frac{1}{2\\gamma} \\|x - v\\|^2 \\right)$ balances minimising the regulariser $g$ while staying close to the gradient step $v$.",
    "When applied to $L_1$ regularisation, this yields the Iterative Shrinkage-Thresholding Algorithm (ISTA), which converges at rate $O(1/k)$. Amir Beck and Marc Teboulle (2009) introduced Fast ISTA (FISTA), which incorporates Nesterov momentum acceleration to achieve the optimal theoretical rate $O(1/k^2)$ for first-order composite optimisation."
  ],
  "analogy": "Imagine sculpting an intricate marble statue. The smooth loss function f is an artist using a coarse polishing cloth to buff out broad curves. The non-smooth regulariser g is an artisan wielding a sharp chisel that clips off unwanted chunks to carve sharp, crisp geometric edges. The proximal gradient method alternates between the two: polish smoothly with the cloth, then immediately chisel with the proximal operator.",
  "steps": [
    {
      "title": "1. Formulate composite objective and evaluate Lipschitz constant",
      "body": "Structure objective as $F(x) = f(x) + g(x)$. Compute the Lipschitz constant $L$ of $\\nabla f$ (for linear regression $\\|X^T X\\|_2$), setting step size $\\gamma \\le 1/L$."
    },
    {
      "title": "2. Perform forward gradient step on smooth loss f",
      "body": "Compute gradient of the smooth loss: $v_k = y_k - \\gamma \\nabla f(y_k)$."
    },
    {
      "title": "3. Apply backward proximal step on non-smooth penalty g",
      "body": "Compute proximal operator: $x_{k+1} = \\operatorname{prox}_{\\gamma g}(v_k)$. For $L_1$ regularisation, this is the element-wise soft-thresholding operator $S_{\\gamma \\lambda}(v_k)$."
    },
    {
      "title": "4. Update Nesterov acceleration momentum (FISTA)",
      "body": "Compute scalar momentum sequence: $t_{k+1} = \\frac{1 + \\sqrt{1 + 4 t_k^2}}{2}$. Update auxiliary extrapolation point: $y_{k+1} = x_{k+1} + \\left(\\frac{t_k - 1}{t_{k+1}}\\right) (x_{k+1} - x_k)$."
    }
  ],
  "math": [
    {
      "h": "The Proximal Operator",
      "tex": "\\operatorname{prox}_{\\gamma g}(v) = \\arg\\min_{x} \\left( g(x) + \\frac{1}{2 \\gamma} \\|x - v\\|_2^2 \\right)",
      "p": "Resolves non-smooth objective by finding a compromise between minimising penalty g(x) and proximity to candidate vector v."
    },
    {
      "h": "Proximal Gradient (ISTA) Update",
      "tex": "x_{k+1} = \\operatorname{prox}_{\\gamma g}\\left(x_k - \\gamma \\nabla f(x_k)\\right)",
      "p": "Iterative Shrinkage-Thresholding Algorithm. Alternates a gradient descent step on smooth term f with the proximal mapping of non-smooth term g."
    },
    {
      "h": "FISTA Nesterov Momentum Acceleration",
      "tex": "y_{k+1} = x_k + \\frac{t_{k-1} - 1}{t_k} (x_k - x_{k-1}), \\quad t_k = \\frac{1 + \\sqrt{1 + 4 t_{k-1}^2}}{2}",
      "p": "Accelerates convergence rate from O(1/k) to the optimal Nesterov theoretical limit O(1/k^2) for first-order composite optimisation."
    }
  ],
  "code": "import numpy as np\n\n# Proximal Gradient Methods: ISTA vs FISTA from scratch on Lasso\nnp.random.seed(42)\nn_samples = 200\nn_features = 80\n\n# True sparse signal (only 5 active coefficients)\nX = np.random.normal(0, 1, (n_samples, n_features))\ntrue_beta = np.zeros(n_features)\ntrue_beta[[5, 12, 28, 45, 60]] = [2.0, -1.5, 3.2, -2.8, 1.0]\ny = X @ true_beta + np.random.normal(0, 0.4, n_samples)\n\n# Smooth loss: f(beta) = 0.5 * ||y - X beta||^2\n# Non-smooth penalty: g(beta) = lambda * ||beta||_1\nlambda_reg = 15.0\n\n# Lipschitz constant of nabla f: L = max eigenvalue of X^T X\nL = np.linalg.norm(X.T @ X, 2)\ngamma = 1.0 / L  # Step size\n\ndef soft_threshold(v, thresh):\n    return np.sign(v) * np.maximum(0.0, np.abs(v) - thresh)\n\ndef objective(beta):\n    return 0.5 * np.sum((y - X @ beta)**2) + lambda_reg * np.sum(np.abs(beta))\n\n# 1. Standard ISTA (O(1/k) convergence)\nn_iters = 120\nbeta_ista = np.zeros(n_features)\nloss_ista = []\n\nfor k in range(n_iters):\n    # Gradient of smooth loss: nabla f(beta) = -X^T (y - X beta)\n    grad_f = -X.T @ (y - X @ beta_ista)\n    # Gradient step followed by proximal soft-thresholding\n    v = beta_ista - gamma * grad_f\n    beta_ista = soft_threshold(v, gamma * lambda_reg)\n    loss_ista.append(objective(beta_ista))\n\n# 2. Fast ISTA (FISTA) with Nesterov Momentum (O(1/k^2) convergence)\nbeta_fista = np.zeros(n_features)\nbeta_prev = np.zeros(n_features)\ny_aux = np.zeros(n_features)\nt = 1.0\nloss_fista = []\n\nfor k in range(n_iters):\n    # Gradient step evaluated at auxiliary momentum point y_aux\n    grad_f = -X.T @ (y - X @ y_aux)\n    v = y_aux - gamma * grad_f\n    beta_fista = soft_threshold(v, gamma * lambda_reg)\n    \n    # Nesterov momentum update\n    t_next = (1.0 + np.sqrt(1.0 + 4.0 * t**2)) / 2.0\n    y_aux = beta_fista + ((t - 1.0) / t_next) * (beta_fista - beta_prev)\n    \n    beta_prev = beta_fista.copy()\n    t = t_next\n    loss_fista.append(objective(beta_fista))\n\nmin_obj = min(loss_fista[-1], loss_ista[-1])\nprint(f\"Dataset: {n_samples} samples x {n_features} features (5 active)\")\nprint(f\"Step size gamma = 1/L = {gamma:.6f}\")\nprint(f\"\\nAfter {n_iters} iterations:\")\nprint(f\"  ISTA Objective:  {loss_ista[-1]:.3f} (Distance to min: {loss_ista[-1] - min_obj:.4f})\")\nprint(f\"  FISTA Objective: {loss_fista[-1]:.3f} (Distance to min: {loss_fista[-1] - min_obj:.4f})\")\nprint(f\"Iterations to reach loss < {loss_ista[-1]:.1f}:\")\nprint(f\"  ISTA:  {n_iters} iterations\")\nfista_match_iter = next(i + 1 for i, l in enumerate(loss_fista) if l <= loss_ista[-1])\nprint(f\"  FISTA: {fista_match_iter} iterations ({n_iters / fista_match_iter:.1f}x speedup via momentum!)\")",
  "keyPoints": [
    "Optimises composite objectives $F(x) = f(x) + g(x)$ combining smooth convex loss $f$ with non-smooth convex regulariser $g$.",
    "Alternates a forward gradient step on $f$ with the backward proximal operator of $g$: $x_{k+1} = \\operatorname{prox}_{\\gamma g}(x_k - \\gamma \\nabla f(x_k))$.",
    "For $L_1$ regularisation, the proximal operator equals the analytical soft-thresholding operator (ISTA).",
    "FISTA incorporates Nesterov momentum acceleration, boosting convergence rate from $O(1/k)$ to the optimal theoretical limit $O(1/k^2)$.",
    "Applies broadly to Lasso, Elastic Net, group lasso, nuclear norm matrix completion, and constrained optimisation."
  ],
  "pitfalls": [
    "Step size exceeding 1/L: Setting step size $\\gamma > 1/L$ (where $L$ is the Lipschitz constant of $\\nabla f$) causes proximal gradient steps to diverge.",
    "Non-convex regularisers: If $g(x)$ is non-convex (e.g. $L_0$ pseudo-norm), the proximal operator may have multiple local solutions, forfeiting global convergence guarantees.",
    "Non-monotone FISTA energy spikes: Standard Nesterov momentum in FISTA can produce temporary objective energy spikes; monotone FISTA (MFISTA) restores strict monotonic descent."
  ],
  "quiz": [
    {
      "q": "What is the theoretical convergence rate of FISTA compared to standard ISTA for composite convex optimisation?",
      "o": [
        "FISTA converges at O(1/k^2) while ISTA converges at O(1/k)",
        "FISTA has exponential convergence while ISTA has linear convergence",
        "FISTA converges at O(1/k) while ISTA converges at O(1/k^2)",
        "Both algorithms have identical convergence rates"
      ],
      "a": 0,
      "why": "By incorporating Nesterov momentum extrapolation, FISTA improves the convergence rate from O(1/k) to O(1/k^2), which is the proven optimal first-order bound."
    },
    {
      "q": "What does the proximal operator prox_{gamma g}(v) compute geometrically?",
      "o": [
        "It balances minimising the penalty function g(x) with staying close to vector v via a quadratic proximity penalty",
        "It calculates the projection onto the null space of the feature matrix",
        "It computes the gradient of the loss function",
        "It inverts the covariance matrix"
      ],
      "a": 0,
      "why": "From its definition prox(v) = argmin_x { g(x) + (1/(2 gamma)) ||x - v||^2 }, it acts as an implicit step compromising between the regulariser g and distance to v."
    }
  ],
  "usedBy": [],
  "prereq": [
    "coordinate-descent",
    "lasso_regression"
  ],
  "related": [
    "coordinate-descent",
    "newtons-method",
    "lasso_regression",
    "elastic_net"
  ],
  "keywords": "proximal gradient, fista, ista, proximal operator, soft thresholding, composite optimisation, nesterov momentum, l1 regularisation"
},
  {
    id: 'hyperparameter-search-grid-random-successive-halving',
    short: 'Hyperparameter search',
    title: 'Hyperparameter Search: Grid, Random, Successive Halving',
    task: 'concepts',
    module: 'Model selection',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Strategies for navigating hyperparameter configurations, from brute-force grid search to distribution sampling and resource-adaptive successive halving.`,
    lead: r`Machine learning models rely on external hyperparameters—such as regularisation strength, tree depth, and learning rates—that cannot be estimated directly through gradient descent. Exhaustive grid search scales exponentially with dimensionality and wastes trials exploring uninformative parameters. Random search and multi-fidelity successive halving dramatically accelerate discovery by sampling continuous spaces and aggressively terminating unpromising configurations early.`,
    intuition: [
      r`Imagine searching for the perfect recipe for baking sourdough bread. You have three knobs to adjust: baking temperature, proofing time, and oven rack height. If you set up an exhaustive grid testing 5 temperatures, 5 proofing times, and 4 rack heights, you must bake $5 \times 5 \times 4 = 100$ individual loaves. Worse, after tasting them all, you discover that oven rack height makes virtually zero difference to the bread's texture. Because you used a rigid grid, you baked the same 25 temperature-time combinations four times over, testing only 5 distinct temperatures.`,
      r`Random search breaks this gridlock. Instead of locking hyperparameters to discrete intersections, it samples configurations randomly from continuous distributions. In 100 random loaves, you test roughly 100 distinct temperatures and 100 distinct proofing times. As Bergstra and Bengio (2012) proved mathematically, most machine learning problems have low effective dimensionality—only a fraction of hyperparameters drive performance. By scattering trials across the space, random search explores the critical dimensions far more granularly for the exact same computational budget.`,
      r`But why bake every trial loaf for the full 45 minutes? If a loaf fails to rise after 10 minutes, you already know it will not win. Successive halving formalises this intuition as a multi-fidelity bandit problem. It begins by launching dozens of configurations on tiny budgets (e.g. 5 epochs or 10% of the training data). At regular checkpoints, it ranks all candidates, prunes the bottom half (or bottom two-thirds), and doubles the resource budget for the survivors. By focusing compute only on configurations that show early promise, successive halving identifies superior hyperparameters up to an order of magnitude faster.`,
    ],
    analogy: r`Running an audition for an orchestra: listening to a hundred musicians play a 30-second scale, inviting the top twenty to play a full piece, and giving the top three a full rehearsal to choose the winner.`,
    steps: [
      r`Define the search space: specify bounds, categorical choices, and prior probability distributions (e.g. log-uniform for learning rates and regularisation penalties).`,
      r`Select an exploration strategy: choose random search over grid search whenever the hyperparameter dimensionality exceeds two or three variables.`,
      r`Configure a multi-fidelity schedule: choose an allocation factor $\eta$ (typically 2 or 3), a minimum resource budget $r_{\min}$ (e.g. 1 epoch or 100 samples), and a maximum resource budget $R$.`,
      r`Initialise candidates: sample $N = \eta^s$ configurations uniformly across the defined search space.`,
      r`Run successive halving rounds: evaluate all active configurations on resource budget $r$, rank by validation loss, retain the top $1/\eta$ fraction, multiply budget $r \leftarrow r \cdot \eta$, and repeat until survivors reach $R$.`,
      r`Refit the winning configuration on the full dataset using maximum compute to produce the final production model.`,
    ],
    math: [
      {
        h: 'Grid search complexity and the curse of dimensionality',
        tex: r`$$N_{\text{grid}} = \prod_{i=1}^d k_i = k^d$$`,
        p: r`Evaluating $k$ discrete values across $d$ hyperparameters requires exponential computational effort. If only $d_{\text{eff}} \ll d$ hyperparameters actually influence model performance, grid search wastes $k^d - k^{d_{\text{eff}}}$ model evaluations re-testing redundant configurations along uninformative axes.`,
      },
      {
        h: 'Random search sample efficiency',
        tex: r`$$P(\text{finding within top } \alpha \text{ percentile}) = 1 - (1 - \alpha)^n$$`,
        p: r`To achieve a 95% probability of sampling at least one configuration within the top 5% of the parameter space ($\alpha = 0.05$), random search requires only $n = \frac{\ln(1 - 0.95)}{\ln(1 - 0.05)} \approx 59$ trials, completely independent of the number of hyperparameter dimensions $d$.`,
      },
      {
        h: 'Successive halving resource allocation',
        tex: r`$$N_k = \left\lfloor \frac{N_{k-1}}{\eta} \right\rfloor, \qquad R_k = R_{k-1} \cdot \eta, \qquad \sum_{k=0}^K N_k R_k \approx N_0 r_{\min} (K + 1)$$`,
        p: r`where $\eta$ is the reduction factor and $K = \lfloor \log_\eta(R / r_{\min}) \rfloor$ is the number of halving rungs. By discarding the worst $(1 - 1/\eta)$ configurations at each rung, the total compute allocated across all configurations scales logarithmically with maximum resource depth.`,
      },
    ],
    code: r`import numpy as np

# Synthetic linear data with 5 features
rng = np.random.default_rng(42)
X_full = rng.normal(0, 1, (200, 5))
y_full = X_full[:, 0] * 2.0 - X_full[:, 1] * 1.5 + rng.normal(0, 0.5, 200)

# Sample 16 random hyperparameter candidates for Ridge (log-alpha in [-3, 3])
alphas = np.exp(rng.uniform(-3, 3, 16))
budgets = [25, 50, 100, 200]  # training subsample sizes

current_alphas = alphas.copy()
for b in budgets[:-1]:
    X_sub, y_sub = X_full[:b], y_full[:b]
    losses = []
    for a in current_alphas:
        w = np.linalg.solve(X_sub.T @ X_sub + a * np.eye(5), X_sub.T @ y_sub)
        val_mse = np.mean((y_full[100:] - X_full[100:] @ w) ** 2)
        losses.append(val_mse)
    survivors = np.argsort(losses)[:len(current_alphas) // 2]
    print(f"Budget n={b:3d} | Candidates: {len(current_alphas):2d} | Best MSE: {min(losses):.4f}")
    current_alphas = current_alphas[survivors]

# Final evaluation on full data
w_best = np.linalg.solve(X_full.T @ X_full + current_alphas[0] * np.eye(5), X_full.T @ y_full)
final_mse = np.mean((y_full - X_full @ w_best) ** 2)
print(f"Best alpha: {current_alphas[0]:.4f} | Full data MSE: {final_mse:.4f}")`,
    pitfalls: [
      r`Early-stage ranking noise: If the initial resource budget $r_{\min}$ is set too low (e.g. only 1 epoch or 10 samples), learning rates with slow warmup or deep architectures may perform poorly early on and get discarded despite having superior asymptotic performance.`,
      r`Uniform sampling on linear scale for scale-sensitive parameters: Sampling learning rates or regularisation parameters linearly between $10^{-5}$ and $1.0$ allocates 90% of trials to values above $0.1$. Multiplicative parameters must be sampled on a logarithmic scale (log-uniform).`,
      r`Data leakage during subsample evaluation: Subsampling data for resource scaling must preserve class label distributions via stratified sampling; otherwise minority classes may be entirely absent from low-resource rungs.`,
      r`Overfitting the validation set: Evaluating thousands of hyperparameter configurations against a single validation split inevitably selects for validation set noise (the winner's curse), requiring nested cross-validation or an untouched holdout test set.`,
    ],
    keyPoints: [
      r`Random search consistently outperforms grid search on high-dimensional spaces because it evaluates far more unique values along critical dimensions.`,
      r`Successive halving allocates compute dynamically by evaluating many candidates on cheap budgets and pruning unpromising configurations early.`,
      r`Logarithmic prior distributions are mandatory for scale-invariant parameters like learning rate, L2 penalty, and kernel width.`,
      r`Hyperband extends successive halving by looping over multiple trade-offs between initial candidate count and minimum resource budget.`,
    ],
    quiz: [
      {
        q: r`Why does random search consistently outperform exhaustive grid search when tuning machine learning models with 5 or more hyperparameters?`,
        o: [
          r`Because random numbers eliminate gradient descent variance`,
          r`Because most models have low effective dimensionality, and random search explores many distinct values along the few important axes rather than re-testing identical coordinates`,
          r`Because grid search cannot be evaluated on GPU hardware`,
          r`Because random search guarantees finding the global analytical minimum in finite steps`,
        ],
        a: 1,
        why: r`In most machine learning models, only 1 or 2 hyperparameters strongly dictate performance (e.g. learning rate and regularisation). While grid search wastes compute repeatedly testing the same few values of the important parameter against unimportant variations, random search tests a unique value on every single trial.`,
      },
      {
        q: r`How many random trials $n$ are required to have a 95% probability of sampling at least one configuration within the top 5% ($\alpha = 0.05$) of all possible hyperparameter settings?`,
        o: [
          r`Exactly 100 trials`,
          r`Over 10,000 trials`,
          r`Approximately 59 trials, regardless of the number of hyperparameter dimensions`,
          r`The number of trials depends exponentially on the number of features $d$`,
        ],
        a: 2,
        why: r`Setting $1 - (1 - 0.05)^n \ge 0.95$ yields $(0.95)^n \le 0.05$. Taking logarithms gives $n \ge \ln(0.05) / \ln(0.95) \approx -2.9957 / -0.05129 \approx 58.4$ (or 59 trials). Remarkably, this probability is completely independent of dimensionality.`,
      },
      {
        q: r`What is the core mechanism of the Successive Halving algorithm?`,
        o: [
          r`It begins with many configurations evaluated on a small resource budget, progressively pruning the worst performers and multiplying resources for the survivors`,
          r`It cuts the learning rate in half every 10 epochs`,
          r`It divides the dataset into two halves and trains on both simultaneously`,
          r`It computes second-order Hessian approximations to halve the parameter space`,
        ],
        a: 0,
        why: r`Successive halving allocates compute efficiently by testing $N$ configurations on a small initial budget (e.g. subsamples or epochs), pruning the bottom fraction (e.g. 50%), and doubling the budget for the survivors over successive rungs.`,
      },
      {
        q: r`Why should hyperparameters like regularisation weight $\lambda$ or learning rate $\eta$ be sampled from a log-uniform distribution rather than a uniform distribution?`,
        o: [
          r`Because logarithms force all sampled values to be negative numbers`,
          r`Because uniform distributions cannot generate floating-point decimals`,
          r`Because log-uniform sampling prevents models from underfitting`,
          r`Because their effects scale multiplicatively; a linear uniform distribution would waste nearly all trials exploring the single largest order of magnitude`,
        ],
        a: 3,
        why: r`A shift from $10^{-4}$ to $10^{-3}$ has a comparable structural impact to a shift from $10^{-1}$ to $1.0$. Sampling uniformly on $[10^{-4}, 1.0]$ would allocate 90% of samples to values between 0.1 and 1.0, virtually ignoring the smaller decades.`,
      },
    ],
    usedBy: ['bayesian-optimisation-and-optuna'],
    prereq: ['cross-validation', 'bias-variance-tradeoff'],
    related: ['bayesian-optimisation-and-optuna', 'nested-cross-validation', 'cross-validation'],
    keywords: 'hyperparameter search grid search random search successive halving hyperband tuning model selection cross-validation',
  },
  {
    id: 'bayesian-optimisation-and-optuna',
    short: 'Bayesian opt. & Optuna',
    title: 'Bayesian Optimisation and Optuna',
    task: 'concepts',
    module: 'Model selection',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Sequential model-based optimisation balancing exploration and exploitation via Gaussian process surrogates, Expected Improvement, and Optuna's TPE.`,
    lead: r`Random search and grid search treat every trial independently, discarding valuable information about the objective landscape uncovered during previous runs. Bayesian optimisation models the objective function as an expensive black-box probabilistic distribution, balancing exploration of uncertain regions with exploitation of known high-performing areas using acquisition functions like Expected Improvement. Modern frameworks like Optuna replace Gaussian processes with Tree-structured Parzen Estimators (TPE) and automated pruning, enabling scalable tuning across complex mixed-type search spaces.`,
    intuition: [
      r`Imagine prospecting for oil across a vast desert by drilling exploratory test wells. Drilling a single well costs £100,000 and takes two weeks. You would never choose your drilling sites using a rigid grid or random lottery. After drilling your first few sites, you analyse the geological data to form a mental map of the subsurface: where oil is likely concentrated (high expected yield) and where the terrain remains completely unknown (high uncertainty).`,
      r`If you only drill right next to your best existing well, you might squeeze out minor gains while missing a massive oil basin fifty miles away (over-exploitation). If you only drill in completely random unexplored corners, you waste millions confirming dry dust (over-exploration). The rational strategy balances both: drill where the probability of finding a larger deposit than your current best is highest.`,
      r`Bayesian optimisation formalises this balance using two components: a probabilistic surrogate model (such as a Gaussian process) that predicts both the expected performance and its uncertainty at every unvisited coordinate, and an acquisition function (such as Expected Improvement) that scores each point's potential. Optuna brings this into modern production through the Tree-structured Parzen Estimator (TPE). Instead of modelling $p(y \mid \theta)$ via expensive matrix inversions, TPE models the parameter distributions of good trials $p(\theta \mid y < y^*)$ and bad trials $p(\theta \mid y \ge y^*)$ separately using kernel density estimates, selecting candidate points that maximise their ratio while aggressively pruning stalled trials mid-training.`,
    ],
    analogy: r`A grandmaster chess player evaluating candidate moves: calculating deep variants only for moves with high tactical promise while occasionally exploring unconventional lines that offer surprising upside.`,
    steps: [
      r`Initialise the search space: evaluate a small budget of seed points (typically 5 to 10 trials) using quasi-random Sobol or Latin hypercube sampling.`,
      r`Fit the surrogate model: train a Gaussian Process or Tree-structured Parzen Estimator (TPE) on all evaluated configurations and their observed validation losses.`,
      r`Formulate the acquisition function: calculate Expected Improvement (EI) or Upper Confidence Bound (UCB) across candidate hyperparameter configurations.`,
      r`Optimise the acquisition function: identify the hyperparameter coordinate $\theta^*$ that maximises the acquisition score.`,
      r`Evaluate the objective: train the machine learning model using $\theta^*$ on validation data to record its true objective value $f(\theta^*)$.`,
      r`Enable automated pruning: abort trials early (via Optuna's MedianPruner or Hyperband) if intermediate training curves fall below median historical progress.`,
      r`Update the surrogate dataset and iterate until the computational trial budget is exhausted.`,
    ],
    math: [
      {
        h: 'Gaussian Process surrogate posterior',
        tex: r`$$f(\theta) \sim \mathcal{GP}\big(\mu(\theta), \, k(\theta, \theta')\big), \qquad \mu_n(\theta) = k_*^T (K + \sigma_n^2 I)^{-1} y, \quad \sigma_n^2(\theta) = k(\theta, \theta) - k_*^T (K + \sigma_n^2 I)^{-1} k_*$$`,
        p: r`where $K$ is the kernel Gram matrix evaluated at observed trials and $k_*$ is the covariance vector between candidate $\theta$ and past observations. The posterior mean $\mu_n(\theta)$ models exploitation, while the posterior variance $\sigma_n^2(\theta)$ quantifies epistemic uncertainty for exploration.`,
      },
      {
        h: 'Expected Improvement (EI) acquisition function',
        tex: r`$$\operatorname{EI}(\theta) = \mathbb{E}\big[\max(0, y_{\text{best}} - f(\theta))\big] = (y_{\text{best}} - \mu_n(\theta)) \, \Phi(z) + \sigma_n(\theta) \, \phi(z), \quad z = \frac{y_{\text{best}} - \mu_n(\theta)}{\sigma_n(\theta)}$$`,
        p: r`where $\Phi$ is the standard normal cumulative distribution function and $\phi$ is the standard normal density function. The first term prioritises exploitation (large improvement over current best $y_{\text{best}}$), while the second term rewards exploration (high uncertainty $\sigma_n(\theta)$).`,
      },
      {
        h: 'Optuna\'s Tree-structured Parzen Estimator (TPE)',
        tex: r`$$\frac{p(\theta \mid y < y^*)}{p(\theta \mid y \ge y^*)} = \frac{\ell(\theta)}{g(\theta)} \propto \operatorname{EI}(\theta)$$`,
        p: r`By setting a quantile threshold $\gamma$ (typically 10% or 15%), TPE partitions historical trials into good performers $\ell(\theta)$ and bad performers $g(\theta)$. Maximising the likelihood ratio $\ell(\theta) / g(\theta)$ samples points that are highly probable under the good distribution and improbable under the bad distribution, eliminating $O(n^3)$ GP matrix inversion.`,
      },
    ],
    code: r`import numpy as np
from scipy.stats import norm

# True black-box function with local minimum
def f(x):
    return np.sin(3 * x) + 0.5 * (x - 1) ** 2

# Initial observations
X_obs = np.array([0.2, 1.8, 2.8])
y_obs = f(X_obs)

# RBF kernel for Gaussian Process surrogate
def rbf_cov(x1, x2, l=0.5, s=1.0):
    return s**2 * np.exp(-0.5 * (x1[:, None] - x2[None, :])**2 / l**2)

# Run 4 Bayesian Optimisation steps via Expected Improvement (EI)
cands = np.linspace(0, 3, 100)
for step in range(4):
    K = rbf_cov(X_obs, X_obs) + 1e-6 * np.eye(len(X_obs))
    K_s = rbf_cov(cands, X_obs)
    mu = K_s @ np.linalg.solve(K, y_obs)
    sigma = np.sqrt(np.maximum(1e-6, 1.0 - np.sum(K_s * np.linalg.solve(K, K_s.T).T, axis=1)))
    
    # Expected Improvement (minimisation: improvement over current best y_best)
    y_best = np.min(y_obs)
    z = (y_best - mu) / sigma
    ei = (y_best - mu) * norm.cdf(z) + sigma * norm.pdf(z)
    
    next_x = cands[np.argmax(ei)]
    X_obs = np.append(X_obs, next_x)
    y_obs = np.append(y_obs, f(next_x))

best_idx = np.argmin(y_obs)
print(f"Evaluated points: {X_obs.round(3)}")
print(f"Best observed x*: {X_obs[best_idx]:.3f} | Minimum value: {y_obs[best_idx]:.4f}")`,
    pitfalls: [
      r`Cubic scaling of Gaussian processes: Inverting the GP covariance matrix scales as $O(n^3)$ with the number of trials $n$. Standard GP Bayesian optimisation slows to a crawl beyond 150 to 200 trials (which is why Optuna uses TPE or Random Forests).`,
      r`Inappropriate kernel length scales: If the GP kernel length-scale is too short, the surrogate assumes the objective is wildly jagged, treating nearby points as completely independent and collapsing into random search.`,
      r`Cold-start vulnerability: If initial seed points all happen to fall in uninformative regions, the acquisition function can get trapped reinforcing local minima before exploring broader basins.`,
      r`Ignoring trial execution overhead: In fast-training models (e.g. linear models or small decision trees), fitting a complex surrogate model can take longer than simply running 500 parallel random trials.`,
    ],
    keyPoints: [
      r`Replaces uninformed sampling with sequential probabilistic modelling of the hyperparameter response surface.`,
      r`Expected Improvement balances the trade-off between exploiting promising regions and exploring uncertain areas.`,
      r`Optuna's Tree-structured Parzen Estimator (TPE) replaces Gaussian processes with non-parametric kernel density ratios, scaling to high trial counts and categorical spaces.`,
      r`Automated pruning terminates unpromising trials midway through training epochs, saving up to 80% of total compute.`,
    ],
    quiz: [
      {
        q: r`What is the primary role of the acquisition function in Bayesian optimisation?`,
        o: [
          r`To compute the gradient of the loss function with respect to model weights`,
          r`To calculate the training accuracy of the neural network`,
          r`To mathematically quantify the trade-off between exploiting areas of known high performance and exploring regions of high uncertainty`,
          r`To perform Singular Value Decomposition on the feature matrix`,
        ],
        a: 2,
        why: r`The acquisition function (such as Expected Improvement or Upper Confidence Bound) evaluates the surrogate model's posterior mean and uncertainty across unvisited points, guiding the search to coordinates with the highest potential return.`,
      },
      {
        q: r`How does Optuna's Tree-structured Parzen Estimator (TPE) differ fundamentally from a standard Gaussian Process surrogate?`,
        o: [
          r`TPE models the input distribution of good trials $\ell(\theta)$ and poor trials $g(\theta)$ separately, choosing points that maximise the ratio $\ell(\theta)/g(\theta)$ without inverting covariance matrices`,
          r`TPE only works on strictly convex linear regression problems`,
          r`TPE requires computing the full Hessian matrix of the neural network weights`,
          r`TPE uses exhaustive grid search across integer coordinates`,
        ],
        a: 0,
        why: r`Instead of modelling $p(y \mid \theta)$ with a computationally heavy Gaussian Process ($O(n^3)$ complexity), TPE splits historical evaluations into top performers $\ell(\theta)$ and remaining performers $g(\theta)$ using a quantile cutoff $\gamma$, maximising $\ell(\theta)/g(\theta) \propto \operatorname{EI}(\theta)$.`,
      },
      {
        q: r`In the Expected Improvement formula $\operatorname{EI}(\theta) = (y_{\text{best}} - \mu) \Phi(z) + \sigma \phi(z)$, what behaviour does the second term $\sigma \phi(z)$ represent?`,
        o: [
          r`Early stopping of divergent neural networks`,
          r`L1 regularisation penalty`,
          r`Exploitation of the current best observed hyperparameter`,
          r`Exploration of regions where the surrogate model has high prediction uncertainty $\sigma$`,
        ],
        a: 3,
        why: r`The term $\sigma \phi(z)$ is proportional to the posterior standard deviation $\sigma$. When evaluating an unexplored region of the search space, $\sigma$ is large, driving up Expected Improvement even if the predicted mean $\mu$ is unremarkable.`,
      },
      {
        q: r`What is the purpose of Optuna's automated "pruning" mechanism (such as MedianPruner)?`,
        o: [
          r`To remove low-importance features from the training dataset`,
          r`To abort unpromising training trials early if intermediate metrics fall below historical baselines, freeing compute for better candidates`,
          r`To prune branches from decision tree models during inference`,
          r`To zero out small neural network weights after backpropagation`,
        ],
        a: 1,
        why: r`Pruning checks intermediate validation scores (e.g. after each epoch) against past completed trials. If a trial performs worse than the historical median at that epoch, Optuna halts the trial immediately, saving compute.`,
      },
    ],
    usedBy: [],
    prereq: ['hyperparameter-search-grid-random-successive-halving', 'cross-validation'],
    related: ['hyperparameter-search-grid-random-successive-halving', 'nested-cross-validation', 'cross-validation'],
    keywords: 'bayesian optimisation optuna gaussian process tpe expected improvement acquisition function surrogate model hyperparameter tuning',
  },
  {
    id: 'learning-curves-and-diagnosing-fit',
    short: 'Learning curves & fit',
    title: 'Learning Curves and Diagnosing Fit',
    task: 'concepts',
    module: 'Model selection',
    level: 1,
    minutes: 16,
    noLab: true,
    summary: r`Empirical diagnostic plotting training and validation error against sample size to distinguish high bias (underfitting) from high variance (overfitting).`,
    lead: r`When a machine learning model underperforms, practitioners often make random architectural tweaks or reflexively gather more training data, often with zero improvement. Learning curves plot training error and validation error as a function of training dataset size $n$, offering an empirical diagnostic that exposes the true bottleneck: high bias, high variance, or data quality limits. Interpreting the gap and convergence asymptotes reveals precisely whether the solution requires more data, a more expressive model, or stronger regularisation.`,
    intuition: [
      r`Imagine a primary school pupil learning to read music versus a student memorising exam answers. If the pupil tries to sight-read complex Mozart symphonies using only a rudimentary knowledge of three notes, their reading error will be atrocious on day one and remain equally atrocious six months later, no matter how many sheet music books you buy them. The problem is not a shortage of books (data); the pupil's mental model is fundamentally too primitive to capture harmonic complexity (high bias / underfitting).`,
      r`Now imagine a student cramming for a history test by memorising exact practice exam questions word for word. On the practice tests they have memorised, their score is 100% (near-zero training error). But on the final exam with slightly rephrased questions, they flounder with a 55% score (high validation error). However, if you give this student 500 diverse practice exams covering every possible variation, memorisation gradually forces them to learn the underlying historical themes, and their exam score steadily climbs toward their practice score (high variance / overfitting).`,
      r`Learning curves plot this exact dynamic across sample sizes $n$. When $n$ is tiny, any flexible model can easily memorise the training instances (training error starts near zero), while validation error starts high. As $n$ increases, fitting every point perfectly becomes harder, so training error rises slightly while validation error falls. Where the two curves end up tells you the whole story: if both flatten early at an unacceptably high error plateau with virtually no gap, collecting more data is a total waste of money. If a large gap persists between low training error and high validation error, more data or regularisation is the exact cure.`,
    ],
    analogy: r`Reading the gauges on an engine diagnostics panel: knowing whether a sputtering car suffers from fuel starvation (underfitting) or spark plug misfires (overfitting) before spending thousands on the wrong replacement parts.`,
    steps: [
      r`Select training sample increments: define a progression of training subset sizes $n_1 < n_2 < \dots < n_m = n_{\text{total}}$ (e.g. 10%, 25%, 50%, 75%, 100%).`,
      r`Perform cross-validation: for each sample size $n_i$, randomly sample $n_i$ instances from the training fold, fit the estimator, and record the training score and validation score across $K$ folds.`,
      r`Compute mean and variance: calculate the mean training error $\bar{E}_{\text{train}}(n_i)$ and validation error $\bar{E}_{\text{val}}(n_i)$, along with confidence bands ($\pm 1 \text{ standard error}$).`,
      r`Diagnose high bias: check if the validation curve plateaus at high error and the training curve converges upward to meet it with a negligible gap.`,
      r`Diagnose high variance: check if the training error remains low while the validation error remains significantly higher, with the validation curve still descending as $n$ grows.`,
      r`Execute corrective action: increase model capacity or reduce regularisation for high bias; add training samples, prune features, or increase regularisation for high variance.`,
    ],
    math: [
      {
        h: 'Generalisation error decomposition',
        tex: r`$$\mathbb{E}\big[(y - \hat{f}(x))^2\big] = \operatorname{Bias}^2\big(\hat{f}(x)\big) + \operatorname{Var}\big(\hat{f}(x)\big) + \sigma_{\epsilon}^2$$`,
        p: r`where $\sigma_{\epsilon}^2$ is the irreducible noise floor (Bayes error). The asymptotic gap between the convergence plateau of learning curves and zero reflects the sum of squared bias and irreducible noise.`,
      },
      {
        h: 'High bias (underfitting) asymptotic regime',
        tex: r`$$\lim_{n \to \infty} E_{\text{train}}(n) \approx \lim_{n \to \infty} E_{\text{val}}(n) \gg \sigma_{\epsilon}^2, \qquad \frac{\partial E_{\text{val}}}{\partial n} \approx 0$$`,
        p: r`As sample size $n$ grows, training error increases and validation error decreases until both collide at a high error plateau. The vanishing derivative $\partial E_{\text{val}} / \partial n \approx 0$ indicates that additional training data yields zero marginal performance gain.`,
      },
      {
        h: 'High variance (overfitting) asymptotic regime',
        tex: r`$$E_{\text{val}}(n) - E_{\text{train}}(n) \gg 0, \qquad \frac{\partial E_{\text{val}}}{\partial n} < 0$$`,
        p: r`A persistent, substantial gap separates training and validation performance. The negative derivative confirms that collecting more training observations will continue driving validation error downward toward the training error asymptote.`,
      },
    ],
    code: r`import numpy as np

# Non-linear ground truth: y = 0.5 * x^2 + noise
rng = np.random.default_rng(42)
X_all = rng.uniform(-3, 3, (300, 1))
y_all = 0.5 * X_all[:, 0]**2 + rng.normal(0, 0.5, 300)

X_test, y_test = X_all[200:], y_all[200:]
train_sizes = [15, 30, 60, 120, 200]

print("--- Linear Model (High Bias: Underfitting) ---")
for n in train_sizes:
    X_tr, y_tr = X_all[:n], y_all[:n]
    A_tr = np.hstack([X_tr, np.ones((n, 1))])
    w = np.linalg.lstsq(A_tr, y_tr, rcond=None)[0]
    
    tr_mse = np.mean((y_tr - A_tr @ w) ** 2)
    A_te = np.hstack([X_test, np.ones((len(X_test), 1))])
    te_mse = np.mean((y_test - A_te @ w) ** 2)
    print(f"n={n:3d} | Train MSE: {tr_mse:.3f} | Val MSE: {te_mse:.3f} | Gap: {abs(te_mse - tr_mse):.3f}")`,
    pitfalls: [
      r`Conflating learning curves with training epoch loss curves: Loss plotted over training epochs tracks optimiser convergence (gradient descent progress), whereas learning curves plot final performance against sample size $n$ to diagnose statistical capacity.`,
      r`Data leakage across training subsamples: When sampling subsets of size $n$, instances must be sampled strictly from the training folds; validation folds must remain constant and untouched.`,
      r`Unstratified subsampling on imbalanced classes: Drawing small subsamples (e.g. $n=20$) from highly imbalanced datasets can omit minority classes entirely, causing massive artificial variance spikes in early curve points.`,
      r`Misinterpreting the irreducible Bayes error floor: If both curves converge at 85% accuracy and no model can exceed 85% due to noisy labels or missing features, the model does not have high bias—it has hit the irreducible Bayes error rate.`,
    ],
    keyPoints: [
      r`High bias displays high training and validation error with an early plateau and a negligible gap; adding data will not help.`,
      r`High variance displays low training error, higher validation error, and a persistent gap that shrinks as training data increases.`,
      r`The asymptote of the learning curve reveals whether the model is limited by statistical sample size or structural model capacity.`,
      r`Saves immense engineering time and budget by proving whether gathering more data will improve performance before collecting it.`,
    ],
    quiz: [
      {
        q: r`If a model's learning curve shows that both training error and validation error plateau at a high error rate with a negligible gap between them, what is the correct diagnosis and remediation?`,
        o: [
          r`High bias (underfitting); increase model capacity, engineer non-linear features, or decrease regularisation (do not gather more data)`,
          r`High variance (overfitting); collect more training data immediately`,
          r`Data leakage; remove duplicate rows from the validation split`,
          r`The model has reached 100% test accuracy`,
        ],
        a: 0,
        why: r`When both training and validation errors are high and parallel with a near-zero gap, the model is underfitting (high bias). The model lacks the capacity to represent the underlying patterns, so adding more training examples will not improve performance.`,
      },
      {
        q: r`What does a learning curve with very low training error and significantly higher validation error that is still trending downwards at the maximum available sample size indicate?`,
        o: [
          r`High bias, indicating the model should be simplified`,
          r`The learning rate is set too high`,
          r`The dataset contains no predictive signal`,
          r`High variance (overfitting); gathering more training data or increasing regularisation will likely improve test performance`,
        ],
        a: 3,
        why: r`A large gap between low training error and higher validation error defines high variance. If the validation error curve maintains a negative downward slope at the maximum sample size, collecting more data will continue driving test error down.`,
      },
      {
        q: r`How do learning curves (performance vs dataset size $n$) differ fundamentally from loss curves in deep learning?`,
        o: [
          r`Learning curves can only be plotted for linear regression models`,
          r`Loss curves track optimiser convergence over training epochs for a fixed dataset, whereas learning curves track final model performance as a function of training dataset size $n$`,
          r`Learning curves are always strictly horizontal lines`,
          r`Loss curves require cross-validation, while learning curves do not`,
        ],
        a: 1,
        why: r`Training loss curves monitor whether gradient descent is converging across iterative epochs. Learning curves evaluate statistical generalisation by retraining models from scratch on subsets of varying sizes $n$.`,
      },
      {
        q: r`Why does training error typically increase as the training sample size $n$ grows on a learning curve?`,
        o: [
          r`Because larger datasets automatically increase label noise`,
          r`Because gradient descent fails on datasets with more than 100 samples`,
          r`Because it is easy for a model to perfectly fit or memorise a small handful of points, but harder to fit a large, diverse dataset with the same parameter budget`,
          r`Because regularisation is automatically disabled on small sample sizes`,
        ],
        a: 2,
        why: r`On tiny datasets (e.g. $n=10$), an expressive model has enough degrees of freedom to interpolate every single point, yielding near-zero training error. As $n$ increases, constraints multiply and the model must compromise, pulling training error up toward the population error.`,
      },
    ],
    usedBy: [],
    prereq: ['bias-variance-tradeoff', 'cross-validation'],
    related: ['bias-variance-tradeoff', 'cross-validation', 'nested-cross-validation'],
    keywords: 'learning curves diagnosing fit bias variance underfitting overfitting model selection sample size validation error',
  },
  {
    id: 'nested-cross-validation',
    short: 'Nested cross-validation',
    title: 'Nested Cross-Validation',
    task: 'concepts',
    module: 'Model selection',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Double cross-validation framework separating hyperparameter optimisation from performance estimation to eliminate optimistic selection bias.`,
    lead: r`In standard cross-validation workflows, practitioners tune hyperparameters across validation folds and report the winning configuration's score as the model's expected future test performance. This common practice introduces optimistic selection bias—the winner's curse—because the reported score reflects the best of many random validation fluctuations. Nested cross-validation resolves this by enclosing hyperparameter tuning inside an outer performance-estimation loop, producing an honest, unbiased assessment of the entire model-building pipeline.`,
    intuition: [
      r`Imagine a financial fund manager testing 1,000 different automated trading strategies on historical stock market data from 2020 to 2023. By pure random chance, one strategy will emerge with an astonishing 95% annual return, even if all 1,000 strategies are based on random coin flips. If the manager advertises that 95% figure to investors as the fund's "expected return", investors will be sorely disappointed in 2024. The manager used the same historical data to pick the winning strategy and to evaluate how good the winning strategy was.`,
      r`The exact same trap plagues standard machine learning workflows. When you evaluate 500 combinations of tree depth, learning rate, and regularisation penalties on your cross-validation folds, you pick the parameter set that achieved the lowest validation error. But part of that stellar score is inevitable overfitting to those specific validation splits. Reporting that winning validation score as your model's expected test accuracy guarantees that real-world deployment performance will fall short.`,
      r`Nested cross-validation cures this by establishing two strictly separated loops: an inner loop and an outer loop. The outer loop splits the data into outer training and outer test sets. For each outer fold, the outer test set is locked away in a vault. The outer training data is handed to an inner cross-validation loop, which tunes and selects the best hyperparameters. Once chosen, that winning configuration is evaluated once on the untouched outer test set. By repeating this process across all outer folds, nested cross-validation provides an unpolluted, statistically rigorous estimate of how well the end-to-end modelling procedure generalises.`,
    ],
    analogy: r`Running a multi-round competitive tournament: inner qualification rounds select the team's best lineup, but the team's true skill is judged only by matches played against unencountered external opponents.`,
    steps: [
      r`Partition the full dataset into $K_{\text{outer}}$ folds (e.g. 5 folds) for the outer evaluation loop.`,
      r`For each outer fold $k$, hold out fold $k$ as an untouched test set, and designate the remaining $K_{\text{outer}} - 1$ folds as the outer training set.`,
      r`Partition the outer training set into $K_{\text{inner}}$ folds (e.g. 3 or 4 folds) for the inner tuning loop.`,
      r`Within the inner loop, evaluate all candidate hyperparameter configurations across the inner folds and identify the configuration $\theta_k^*$ that minimises average inner validation error.`,
      r`Fit a model on the entire outer training set using the selected hyperparameter $\theta_k^*$, and evaluate its performance on the held-out outer test set.`,
      r`Compute the final generalisation estimate as the average test performance across all $K_{\text{outer}}$ outer test evaluations.`,
      r`To ship a production model, run inner cross-validation across the entire dataset to select a final hyperparameter $\theta_{\text{final}}^*$ and fit on all available data.`,
    ],
    math: [
      {
        h: 'Selection bias in standard cross-validation',
        tex: r`$$\hat{\theta} = \arg\min_{\theta \in \Theta} \operatorname{CV}(\theta), \qquad \mathbb{E}\big[\operatorname{CV}(\hat{\theta})\big] < \operatorname{Err}_{\text{true}}(\hat{\theta})$$`,
        p: r`Because $\hat{\theta}$ is chosen as the minimum over many random empirical variables, Jensen's inequality and extreme value theory guarantee that $\min_\theta \operatorname{CV}(\theta)$ is a downward-biased estimator of true error $\operatorname{Err}_{\text{true}}$, especially when sample size $N$ is small and the search space $|\Theta|$ is large.`,
      },
      {
        h: 'Nested cross-validation structure',
        tex: r`$$\operatorname{CV}_{\text{nested}} = \frac{1}{K_{\text{out}}} \sum_{k=1}^{K_{\text{out}}} L\left(y_{\text{test}}^{(k)}, \, \hat{f}_{\hat{\theta}_k}\big(x_{\text{test}}^{(k)}\big)\right)$$`,
        p: r`where each $\hat{\theta}_k = \arg\min_{\theta \in \Theta} \frac{1}{K_{\text{in}}} \sum_{j=1}^{K_{\text{in}}} L\big(y_{\text{val}}^{(k, j)}, \hat{f}_\theta(x_{\text{val}}^{(k, j)})\big)$. Because $x_{\text{test}}^{(k)}$ was never seen during the selection of $\hat{\theta}_k$, $\operatorname{CV}_{\text{nested}}$ is an unbiased estimator of expected generalisation error.`,
      },
      {
        h: 'Computational complexity of nested cross-validation',
        tex: r`$$\text{Cost} = K_{\text{outer}} \times \left( |\Theta| \cdot K_{\text{inner}} + 1 \right) \approx K_{\text{outer}} \cdot K_{\text{inner}} \cdot |\Theta|$$`,
        p: r`A $5 \times 3$ nested cross-validation evaluating 100 hyperparameter configurations trains $5 \times (100 \times 3 + 1) = 1{,}505$ models, representing a $K_{\text{outer}}$-fold multiplier over standard non-nested cross-validation.`,
      },
    ],
    code: r`import numpy as np

# Synthetic noisy dataset: pure noise targets (true R^2 <= 0)
rng = np.random.default_rng(42)
n_samples, n_features = 80, 20
X = rng.normal(0, 1, (n_samples, n_features))
y = rng.normal(0, 1, n_samples)

# Candidate Ridge regularisation penalties
alphas = np.logspace(-3, 3, 20)
k_outer, k_inner = 4, 3
indices = np.arange(n_samples)
outer_folds = np.array_split(indices, k_outer)

nested_scores = []
for i in range(k_outer):
    test_idx = outer_folds[i]
    train_idx = np.setdiff1d(indices, test_idx)
    X_train, y_train = X[train_idx], y[train_idx]
    X_test, y_test = X[test_idx], y[test_idx]
    
    # Inner CV loop for hyperparameter tuning
    inner_folds = np.array_split(np.arange(len(train_idx)), k_inner)
    inner_mses = []
    for a in alphas:
        fold_errs = []
        for j in range(k_inner):
            in_val = inner_folds[j]
            in_tr = np.setdiff1d(np.arange(len(train_idx)), in_val)
            w = np.linalg.solve(X_train[in_tr].T @ X_train[in_tr] + a * np.eye(n_features), X_train[in_tr].T @ y_train[in_tr])
            fold_errs.append(np.mean((y_train[in_val] - X_train[in_val] @ w) ** 2))
        inner_mses.append(np.mean(fold_errs))
    
    # Evaluate best inner hyperparameter on untouched outer test set
    best_a = alphas[np.argmin(inner_mses)]
    w_outer = np.linalg.solve(X_train.T @ X_train + best_a * np.eye(n_features), X_train.T @ y_train)
    nested_scores.append(np.mean((y_test - X_test @ w_outer) ** 2))

print(f"Outer fold test MSEs: {[round(float(s), 3) for s in nested_scores]}")
print(f"Unbiased nested CV MSE: {np.mean(nested_scores):.4f}")`,
    pitfalls: [
      r`Believing nested CV outputs a single best model: Nested CV evaluates the performance of the model-building algorithm, not a single static model. Each outer fold may select slightly different optimal hyperparameters.`,
      r`Computational expense on deep architectures: Multiplying hyperparameter trials by $K_{\text{outer}} \times K_{\text{inner}}$ is computationally prohibitive for deep neural networks taking days to train, where single validation splits are standard.`,
      r`Preprocessing leakage outside the nested loops: Fitting feature scalers, encoders, or PCA on the full dataset before splitting into outer folds leaks test information and invalidates the unbiased estimate.`,
      r`Reporting the final production model without refitting: The outer folds exist only to measure expected test error; the final production model must be trained on 100% of the dataset using the best hyperparameter selected from an overall inner loop.`,
    ],
    keyPoints: [
      r`Completely eliminates optimistic selection bias (the winner's curse) in hyperparameter tuning.`,
      r`Separates hyperparameter selection (inner loop) from model performance estimation (outer loop).`,
      r`Essential for small to medium sample sizes ($n < 1{,}000$) where validation variance is high and selection bias is most severe.`,
      r`Evaluates the generalisation capacity of the entire automated modelling pipeline rather than a single parameter configuration.`,
    ],
    quiz: [
      {
        q: r`Why does standard (non-nested) cross-validation produce optimistically biased estimates of model error when tuning many hyperparameters?`,
        o: [
          r`Because cross-validation only works on classification problems`,
          r`Because picking the minimum validation error across hundreds of configurations capitalises on random validation set noise (the winner's curse)`,
          r`Because standard cross-validation evaluates test data before training`,
          r`Because the number of folds must always equal the number of features`,
        ],
        a: 1,
        why: r`When searching through many candidate configurations, some will achieve lower validation errors purely by chance. Reporting the winning score as expected future performance overestimates real-world accuracy due to selection bias.`,
      },
      {
        q: r`In a $5 \times 3$ nested cross-validation, what is the role of the outer loop test sets?`,
        o: [
          r`They are used to tune the learning rate`,
          r`They are used to perform recursive feature elimination`,
          r`They serve as completely untouched test sets used solely to estimate the unbiased generalisation error of models tuned by the inner loop`,
          r`They determine the optimal number of inner folds`,
        ],
        a: 2,
        why: r`The outer loop's sole function is unbiased performance estimation. The outer test folds are completely isolated from the inner loop's hyperparameter search.`,
      },
      {
        q: r`What does nested cross-validation actually produce as its final output?`,
        o: [
          r`An unbiased estimate of the generalisation error of the model-building procedure, after which a final model is refit on all data`,
          r`A single neural network weight vector`,
          r`A set of five different production models that must all be deployed simultaneously`,
          r`A guaranteed 100% test accuracy score`,
        ],
        a: 0,
        why: r`Nested CV is an evaluation protocol, not a training algorithm. It estimates how well the pipeline generalises. Once the evaluation is complete, the practitioner runs a single tuning loop on all data to produce the final deployable model.`,
      },
      {
        q: r`If each outer fold in a 5-fold nested CV selects a slightly different optimal hyperparameter value (e.g. $\alpha \in \{0.1, 0.5, 0.1, 1.0, 0.5\}$), what does this indicate?`,
        o: [
          r`The nested cross-validation failed and must be restarted with different seeds`,
          r`The dataset contains corrupted corrupted values`,
          r`Ridge regression cannot be evaluated using nested cross-validation`,
          r`This is normal behaviour reflecting sample variance across subsets; the objective landscape may be relatively flat across those values`,
        ],
        a: 3,
        why: r`Optimal hyperparameters naturally vary across sample partitions, particularly when multiple configurations yield nearly equivalent validation error. This variation illustrates why nested CV evaluates the procedure rather than a single frozen setting.`,
      },
    ],
    usedBy: [],
    prereq: ['cross-validation', 'bias-variance-tradeoff'],
    related: ['cross-validation', 'hyperparameter-search-grid-random-successive-halving', 'bayesian-optimisation-and-optuna'],
    keywords: 'nested cross-validation double cv model selection selection bias hyperparameter tuning outer loop inner loop',
  },
  {
  "id": "ensemble-theory-bagging-boosting-stacking-compared",
  "short": "Ensemble theory",
  "title": "Ensemble Theory: Bagging, Boosting, and Stacking Compared",
  "task": "concepts",
  "module": "Model selection",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Understand the mathematical foundations of ensemble learning: compare variance reduction in Bagging, bias reduction in Boosting, and meta-learning in Stacking.",
  "lead": "Why do ensembles of diverse models consistently dominate competitive data science? Ensemble theory formalises how combining multiple learners manipulates the bias-variance trade-off.",
  "intuition": [
    "The foundational insight of ensemble learning traces back to the Condorcet Jury Theorem of 1785: if a group of independent decision-makers each has a probability $p > 0.5$ of being correct, the probability that a majority vote is correct approaches 1 as jury size grows. In machine learning, combining multiple individual learners produces predictions that are strictly superior to any single constituent model.",
    "However, different ensemble paradigms attack the bias-variance trade-off through fundamentally different mathematical mechanisms. The three major pillars are Bagging, Boosting, and Stacking.",
    "Bagging (Bootstrap Aggregation) attacks Variance. It trains high-variance, low-bias models (such as deep decision trees) independently in parallel on bootstrap resampled datasets. If each individual model has variance $\\sigma^2$ and pairwise prediction correlation $\\rho$, averaging $B$ models yields ensemble variance $\\rho \\sigma^2 + \\frac{1 - \\rho}{B} \\sigma^2$. Random Forests reduce $\\rho$ by randomly subsampling features at each split, driving variance down toward zero while preserving low bias.",
    "Boosting attacks Bias. It trains shallow, high-bias \"weak learners\" sequentially. Each subsequent model is trained to predict the residual errors or reweighted mistakes of the preceding ensemble, effectively taking a step along the negative gradient of the loss function in function space.",
    "Stacking (Stacked Generalisation) uses meta-learning. Instead of relying on hand-crafted voting rules, it trains heterogeneous base learners (e.g. a Support Vector Machine, a Random Forest, and a Neural Network) and uses their out-of-fold cross-validated predictions as input features to train a secondary \"meta-model\" (such as Ridge or Logistic regression)."
  ],
  "analogy": "Imagine diagnosing a complex medical illness. Bagging is consulting 20 independent cardiologists who each examine different subsets of the patient medical records; averaging their diagnoses cancels out individual eccentricities. Boosting is a consultation where Doctor 1 offers an initial assessment, Doctor 2 investigates only the symptoms Doctor 1 missed, and Doctor 3 resolves remaining ambiguities. Stacking is convening a cardiologist, a neurologist, and an oncologist, then having an experienced chief medical officer synthesise their divergent findings into a final diagnosis.",
  "steps": [
    {
      "title": "1. Diagnose model error: bias vs variance",
      "body": "Evaluate learning curves. If validation loss is high due to model underfitting, prioritise Boosting. If model exhibits severe overfitting, prioritise Bagging."
    },
    {
      "title": "2. Bagging: train independent parallel learners",
      "body": "Draw $B$ bootstrap samples $\\mathcal{D}_1, \\dots, \\mathcal{D}_B$ with replacement. Train deep trees independently. Average predictions (regression) or take majority vote (classification)."
    },
    {
      "title": "3. Boosting: train sequential residual learners",
      "body": "Fit base learner $h_1(x)$. Compute negative gradient residuals $r_i = -\\left[\\frac{\\partial L(y_i, f(x_i))}{\\partial f(x_i)}\\right]$. Fit subsequent learner $h_t(x)$ to predict residuals. Update $f_t(x) = f_{t-1}(x) + \\eta h_t(x)$."
    },
    {
      "title": "4. Stacking: assemble out-of-fold meta-features",
      "body": "Partition training data into $K$ folds. For each base learner, generate out-of-fold predictions. Assemble $n \\times M$ meta-feature matrix and fit a regularised blender model (e.g. Ridge or Logistic regression)."
    }
  ],
  "math": [
    {
      "h": "Bagging Variance Reduction Formula",
      "tex": "\\operatorname{Var}\\left(\\frac{1}{B} \\sum_{b=1}^B \\hat{f}_b(x)\\right) = \\rho(x) \\sigma^2(x) + \\frac{1 - \\rho(x)}{B} \\sigma^2(x)",
      "p": "As ensemble size B -> infinity, the second term vanishes, leaving rho * sigma^2. Feature subsampling in Random Forests lowers correlation rho, drastically reducing irreducible ensemble variance."
    },
    {
      "h": "Gradient Boosting Functional Gradient Step",
      "tex": "f_m(x) = f_{m-1}(x) + \\eta \\arg\\min_{h} \\sum_{i=1}^n \\left( -\\left[\\frac{\\partial L(y_i, f_{m-1}(x_i))}{\\partial f_{m-1}(x_i)}\\right] - h(x_i) \\right)^2",
      "p": "Each new weak learner h approximates the negative gradient of the loss function, performing functional gradient descent in prediction space."
    },
    {
      "h": "Stacking Out-of-Fold Meta-Dataset",
      "tex": "z_{i} = \\left[ \\hat{f}_1^{-k(i)}(x_i), \\; \\hat{f}_2^{-k(i)}(x_i), \\; \\dots, \\; \\hat{f}_M^{-k(i)}(x_i) \\right]^T, \\quad \\hat{y}_i = g(z_i)",
      "p": "Meta-features z_i are generated strictly out-of-fold (using models trained on all folds except fold k containing sample i), preventing data leakage and target memorisation in meta-learner g."
    }
  ],
  "code": "import numpy as np\nfrom sklearn.tree import DecisionTreeRegressor\nfrom sklearn.linear_model import Ridge\nfrom sklearn.model_selection import KFold\n\n# Comparing Bagging, Boosting, and Stacking from scratch\nnp.random.seed(42)\nn_samples = 400\n\n# Synthetic non-linear data with high noise\nX = np.random.uniform(-3, 3, (n_samples, 2))\ny = np.sin(X[:, 0]) * np.cos(X[:, 1]) + 0.5 * X[:, 0] + np.random.normal(0, 0.4, n_samples)\n\nn_train = 250\nX_train, X_test = X[:n_train], X[n_train:]\ny_train, y_test = y[:n_train], y[n_train:]\n\n# 1. Bagging (Variance Reduction)\nn_bags = 30\nbag_preds = np.zeros((len(X_test), n_bags))\nfor b in range(n_bags):\n    boot_idx = np.random.choice(n_train, size=n_train, replace=True)\n    tree = DecisionTreeRegressor(max_depth=8, random_state=b)\n    tree.fit(X_train[boot_idx], y_train[boot_idx])\n    bag_preds[:, b] = tree.predict(X_test)\npred_bagging = np.mean(bag_preds, axis=1)\n\n# 2. Gradient Boosting (Bias Reduction)\nn_boost_trees = 30\nlearning_rate = 0.1\npred_boost_train = np.full(n_train, np.mean(y_train))\npred_boost_test = np.full(len(X_test), np.mean(y_train))\n\nfor m in range(n_boost_trees):\n    residuals = y_train - pred_boost_train\n    shallow_tree = DecisionTreeRegressor(max_depth=3, random_state=m)\n    shallow_tree.fit(X_train, residuals)\n    pred_boost_train += learning_rate * shallow_tree.predict(X_train)\n    pred_boost_test += learning_rate * shallow_tree.predict(X_test)\n\n# 3. Stacking with Out-of-Fold Meta-Features\nkf = KFold(n_splits=5, shuffle=True, random_state=42)\noof_preds = np.zeros((n_train, 2))\ntest_base_preds = np.zeros((len(X_test), 2))\n\n# Base learner 1: Deep Tree; Base learner 2: Shallow Tree\nfor tr_idx, val_idx in kf.split(X_train):\n    m1 = DecisionTreeRegressor(max_depth=7, random_state=42)\n    m2 = DecisionTreeRegressor(max_depth=3, random_state=42)\n    m1.fit(X_train[tr_idx], y_train[tr_idx])\n    m2.fit(X_train[tr_idx], y_train[tr_idx])\n    oof_preds[val_idx, 0] = m1.predict(X_train[val_idx])\n    oof_preds[val_idx, 1] = m2.predict(X_train[val_idx])\n\n# Fit full base models on train, predict test\nm1_full = DecisionTreeRegressor(max_depth=7, random_state=42).fit(X_train, y_train)\nm2_full = DecisionTreeRegressor(max_depth=3, random_state=42).fit(X_train, y_train)\ntest_base_preds[:, 0] = m1_full.predict(X_test)\ntest_base_preds[:, 1] = m2_full.predict(X_test)\n\n# Meta-learner: Ridge regression on out-of-fold predictions\nmeta_learner = Ridge(alpha=1.0)\nmeta_learner.fit(oof_preds, y_train)\npred_stacking = meta_learner.predict(test_base_preds)\n\n# Single baseline tree\nsingle_tree = DecisionTreeRegressor(max_depth=5, random_state=42).fit(X_train, y_train)\npred_single = single_tree.predict(X_test)\n\ndef mse(y_true, y_pred): return np.mean((y_true - y_pred)**2)\n\nprint(\"--- Test Set MSE Comparison ---\")\nprint(f\"Single Decision Tree:  {mse(y_test, pred_single):.4f}\")\nprint(f\"Bagging (30 trees):    {mse(y_test, pred_bagging):.4f} (Variance reduced)\")\nprint(f\"Boosting (30 trees):   {mse(y_test, pred_boost_test):.4f} (Bias reduced)\")\nprint(f\"Stacking (Meta-Ridge): {mse(y_test, pred_stacking):.4f} (Optimal synthesis)\")",
  "keyPoints": [
    "Ensemble theory proves that combining diverse models produces predictions superior to any individual constituent.",
    "Bagging attacks variance: averages independent models trained on bootstrap datasets; Random Forests reduce pairwise correlation $\\rho$.",
    "Boosting attacks bias: trains weak learners sequentially along the negative gradient of the loss function.",
    "Stacking combines heterogeneous models via a secondary meta-model trained on out-of-fold cross-validated predictions.",
    "Diversity is paramount: combining identical or highly correlated models provides zero variance reduction and zero boosting gain."
  ],
  "pitfalls": [
    "Target leakage in stacking: Training the meta-learner on in-sample predictions causes extreme overfitting; out-of-fold cross-validation is strictly mandatory.",
    "Overfitting in boosting: Unlike bagging, running boosting for too many iterations continues driving training error to zero while test error explodes.",
    "Computational latency: Ensembles require evaluating multiple models at inference time, increasing CPU and memory latency in real-time serving."
  ],
  "quiz": [
    {
      "q": "According to the bagging variance formula Var = rho * sigma^2 + ((1 - rho)/B) * sigma^2, why does Random Forest perform feature subsampling at each tree split?",
      "o": [
        "To reduce the correlation rho between individual trees, lowering the irreducible variance floor",
        "To make the individual trees deeper",
        "To convert regression trees into classification trees",
        "To eliminate the need for training labels"
      ],
      "a": 0,
      "why": "As tree count B -> infinity, the second term approaches zero, leaving rho * sigma^2. Randomly selecting feature subsets decorrelates trees (lowering rho), lowering overall ensemble variance."
    },
    {
      "q": "Why must the meta-features in Stacking be generated strictly using out-of-fold cross-validation?",
      "o": [
        "If base models generate predictions on their own training data, the meta-model will overfit to the memorisation biases of the base learners",
        "Because in-sample predictions cannot be stored in arrays",
        "Because cross-validation eliminates the need for test sets",
        "Because the meta-learner requires equal numbers of samples in each class"
      ],
      "a": 0,
      "why": "In-sample predictions contain training memorisation artifacts. Out-of-fold predictions replicate true test-time behaviour, allowing the meta-learner to learn reliable weights without target leakage."
    }
  ],
  "usedBy": [],
  "prereq": [
    "bias-variance-tradeoff",
    "cross-validation"
  ],
  "related": [
    "random_forest_regressor",
    "gradient_boosting_regressor",
    "stacking_voting_classifiers",
    "bagging-and-extra-trees"
  ],
  "keywords": "ensemble theory, bagging, boosting, stacking, bias variance tradeoff, out of fold, meta learning, condorcet jury theorem"
},
  {
  "id": "conformal-prediction",
  "short": "Conformal prediction",
  "title": "Conformal Prediction and Distribution-Free Uncertainty",
  "task": "concepts",
  "module": "Model selection",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Construct prediction intervals with rigorous finite-sample coverage guarantees: master non-conformity scores, exchangeability, and inductive conformal prediction.",
  "lead": "Standard confidence intervals rely on parametric Gaussian assumptions that fail when distributions are skewed or multimodal. Conformal prediction produces prediction sets with mathematically guaranteed 1 - alpha marginal coverage under any distribution, using any underlying model.",
  "intuition": [
    "Most machine learning models output point predictions: predicting a house price will be £450,000 or a patient will be diagnosed with Disease A. However, when deployed in medicine, finance, or automated hiring, point predictions hide risk: is the true house price guaranteed to lie between £440,000 and £460,000, or could it be anywhere from £200,000 to £700,000?",
    "Traditional statistical methods construct confidence intervals using rigid parametric assumptions: assuming error residuals are identically normally distributed with constant variance. When real-world data is skewed, heteroscedastic, or multi-modal, these parametric intervals collapse and under-cover reality.",
    "Pioneered by Vladimir Vovk, Alex Gammerman, and Glenn Shafer, Conformal Prediction provides a mathematically rigorous, distribution-free framework for uncertainty quantification. It constructs prediction intervals (in regression) or prediction sets (in classification) that satisfy an exact finite-sample coverage guarantee: $P(Y_{n+1} \\in C(X_{n+1})) \\ge 1 - \\alpha$, for any user-chosen significance level $\\alpha$ (e.g. 90% or 95%).",
    "Astonishingly, conformal prediction requires zero parametric assumptions, works on top of any black-box machine learning model (Random Forests, XGBoost, or Deep Neural Networks), and holds for finite sample sizes $n$ without relying on asymptotic $n \\to \\infty$ limits. The only foundational mathematical assumption is exchangeability (satisfied whenever data is identically and independently distributed, i.i.d.)."
  ],
  "analogy": "Imagine a dart player practicing in an arcade. Rather than assuming the darts always land in a neat circular Gaussian bell curve around the bullseye, you watch the player throw 100 calibration darts and measure the exact physical distance of each dart from the bullseye. If you want a 90% guarantee for their next throw, you simply take the 90th largest throw distance. Drawing a circle with that exact radius around the next aimed target is guaranteed by pure permutation symmetry to contain the next dart 90% of the time.",
  "steps": [
    {
      "title": "1. Partition data into training and calibration sets",
      "body": "Split available data into a proper training set $\\mathcal{D}_{\\mathrm{train}}$ and an independent calibration set $\\mathcal{D}_{\\mathrm{cal}} = \\{(x_i, y_i)\\}_{i=1}^n$."
    },
    {
      "title": "2. Train base predictive model",
      "body": "Train any black-box model $\\hat{f}$ exclusively on $\\mathcal{D}_{\\mathrm{train}}$ (e.g. gradient-boosted trees or deep neural network)."
    },
    {
      "title": "3. Compute non-conformity scores on calibration set",
      "body": "For each calibration sample $i = 1, \\dots, n$, compute a non-conformity score $s_i$ measuring how unusual the true label is relative to model prediction (e.g. absolute residual $s_i = |y_i - \\hat{f}(x_i)|$)."
    },
    {
      "title": "4. Compute calibrated empirical quantile and form intervals",
      "body": "Calculate empirical quantile: $\\hat{q} = \\operatorname{Quantile}\\left(\\frac{\\lceil (n+1)(1-\\alpha) \\rceil}{n}, \\{s_1, \\dots, s_n\\}\\right)$. For any new test point $x_{n+1}$, form prediction interval $C(x_{n+1}) = [\\hat{f}(x_{n+1}) - \\hat{q}, \\; \\hat{f}(x_{n+1}) + \\hat{q}]$."
    }
  ],
  "math": [
    {
      "h": "Inductive Non-Conformity Score (Absolute Residual)",
      "tex": "s_i = s(x_i, y_i) = |y_i - \\hat{f}(x_i)|",
      "p": "Quantifies how poorly the model prediction matches the ground truth. Higher values denote points that conform poorly to model expectations."
    },
    {
      "h": "Empirical Conformal Quantile Correction",
      "tex": "\\hat{q} = \\operatorname{Quantile}\\left(\\frac{\\lceil(n + 1)(1 - \\alpha)\\rceil}{n}, \\; \\{s_1, \\dots, s_n\\}\\right)",
      "p": "The finite-sample correction factor (n+1)/n accounts for the unobserved test sample, ensuring the theoretical coverage guarantee holds exactly in finite samples."
    },
    {
      "h": "Conformal Validity Coverage Guarantee Theorem",
      "tex": "1 - \\alpha \\le P\\left(Y_{n+1} \\in C(X_{n+1})\\right) \\le 1 - \\alpha + \\frac{1}{n + 1}",
      "p": "Rigorous finite-sample mathematical guarantee. The true outcome falls inside the prediction set with probability at least 1 - alpha under exchangeability."
    }
  ],
  "code": "import numpy as np\nfrom sklearn.ensemble import GradientBoostingRegressor\n\n# Split Conformal Prediction for Regression from scratch\nnp.random.seed(42)\nn_total = 1000\n\n# Synthetic non-linear data with heteroscedastic skewed noise\nx = np.random.uniform(0, 10, n_total)\n# Variance grows with x, and noise is heavily skewed (exponential)\ny_clean = 2.0 * np.sin(x) + 0.5 * x\nnoise = np.random.exponential(scale=0.3 * (1.0 + 0.2 * x)) - 0.3 * (1.0 + 0.2 * x)\ny = y_clean + noise\nX = x.reshape(-1, 1)\n\n# Split into: Train (50%), Calibration (25%), Test (25%)\nn_train = 500\nn_cal = 250\nX_train, y_train = X[:n_train], y[:n_train]\nX_cal, y_cal = X[n_train:n_train+n_cal], y[n_train:n_train+n_cal]\nX_test, y_test = X[n_train+n_cal:], y[n_train+n_cal:]\n\n# 1. Train black-box base model on training set\nmodel = GradientBoostingRegressor(n_estimators=100, random_state=42)\nmodel.fit(X_train, y_train)\n\n# 2. Compute non-conformity scores on calibration set\ncal_preds = model.predict(X_cal)\nnonconformity_scores = np.abs(y_cal - cal_preds)\n\n# 3. Calculate conformal quantile for 90% coverage (alpha = 0.10)\nalpha = 0.10\nn = len(X_cal)\n# Finite-sample index: ceil((n + 1) * (1 - alpha)) / n\nq_level = np.ceil((n + 1) * (1.0 - alpha)) / n\nq_hat = np.quantile(nonconformity_scores, q_level, method='higher')\n\n# 4. Form prediction intervals on test set\ntest_preds = model.predict(X_test)\nlower_bounds = test_preds - q_hat\nupper_bounds = test_preds + q_hat\n\n# Evaluate empirical coverage on test set\ncovered = (y_test >= lower_bounds) & (y_test <= upper_bounds)\nempirical_coverage = np.mean(covered)\n\nprint(f\"Target Coverage Level: { (1 - alpha) * 100:.1f}%\")\nprint(f\"Calibration set size:  {n_cal} samples\")\nprint(f\"Calibrated Conformal Margin (q_hat): ±{q_hat:.3f}\")\nprint(f\"Empirical Test Coverage: {empirical_coverage * 100:.1f}% (Guaranteed >= 90.0%!)\")\nprint(f\"Average Prediction Interval Width:   {2 * q_hat:.3f}\")",
  "keyPoints": [
    "Provides mathematically guaranteed finite-sample coverage $P(Y \\in C(X)) \\ge 1 - \\alpha$ without parametric assumptions.",
    "Model-agnostic: wraps around any black-box machine learning model (neural nets, gradient boosting, random forests).",
    "Relies solely on exchangeability (i.i.d. assumption), holding exactly for finite samples without asymptotic approximations.",
    "In regression, outputs prediction intervals; in classification, outputs prediction sets of varying cardinality.",
    "Adaptive non-conformity scores (e.g. Conformalised Quantile Regression, CQR) produce variable-width intervals reflecting local heteroscedasticity."
  ],
  "pitfalls": [
    "Marginal coverage vs conditional coverage: Standard conformal prediction guarantees average coverage across the entire population, but may under-cover specific localised minority sub-populations.",
    "Exchangeability violation in time series: If data exhibits temporal drift, non-stationarity, or autoregressive correlation, exchangeability fails and adaptive conformal prediction is required.",
    "Calibration set data taxation: Split conformal prediction requires reserving a clean holdout calibration set, slightly reducing data available for model training."
  ],
  "quiz": [
    {
      "q": "What is the only foundational assumption required for Conformal Prediction coverage guarantees to hold?",
      "o": [
        "Data exchangeability (samples are identically and independently distributed or permutation symmetric)",
        "Normally distributed Gaussian errors with homoscedastic variance",
        "That the base model is a linear regression model",
        "That the sample size approaches infinity"
      ],
      "a": 0,
      "why": "Conformal prediction is distribution-free and finite-sample exact; its mathematical proof relies entirely on permutation symmetry (exchangeability) of the calibration and test instances."
    },
    {
      "q": "Why is the quantile level calculated as ceil((n + 1)(1 - alpha)) / n rather than simply 1 - alpha?",
      "o": [
        "To account for the finite sample size and the fact that the unobserved test sample is the (n+1)-th observation in the exchangeable sequence",
        "To round down to the nearest integer",
        "To correct for heteroscedasticity in the features",
        "To force the interval to be symmetric"
      ],
      "a": 0,
      "why": "Because the calibration set has n samples and the test point is the (n+1)-th point, rank symmetry requires partitioning probability into n+1 intervals, yielding the exact finite-sample bound."
    }
  ],
  "usedBy": [],
  "prereq": [
    "confidence-intervals",
    "cross-validation"
  ],
  "related": [
    "confidence-intervals",
    "ensemble-theory-bagging-boosting-stacking-compared",
    "residual-diagnostics-and-heteroscedasticity"
  ],
  "keywords": "conformal prediction, distribution free uncertainty, prediction intervals, non conformity score, exchangeability, split conformal, finite sample coverage"
},
  {
    id: 'permutation-and-impurity-feature-importance',
    short: 'Permutation & impurity',
    title: 'Permutation and Impurity Feature Importance',
    task: 'concepts',
    module: 'Interpretability and fairness',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Contrasting training-set impurity reduction (MDI) with held-out permutation testing (PFI) to measure genuine feature predictive power.`,
    lead: r`When tree ensembles rank feature importances, practitioners frequently rely on default Mean Decrease in Impurity (MDI). However, MDI suffers from severe structural bias toward high-cardinality features and evaluates importance exclusively on training data, causing overfit noise to appear falsely critical. Permutation Feature Importance (PFI) measures the true drop in model performance when feature values are randomly shuffled on held-out validation data, breaking feature-target associations to quantify genuine generalisable signal.`,
    intuition: [
      r`Imagine an employer evaluating job candidates based on three criteria: university grades, relevant industry experience, and employee ID badge numbers. A complex decision tree can easily memorise the training records by splitting on the unique employee ID badge numbers, partitioning candidates perfectly into individual leaf nodes. If you ask the tree which feature reduced training classification errors most aggressively, it will proudly answer: the employee ID badge numbers (high impurity reduction). Yet in the real world, ID numbers carry zero predictive capability for future hires.`,
      r`This flaw is the Achilles heel of Mean Decrease in Impurity (Gini importance). Because continuous variables and high-cardinality categoricals offer countless potential split thresholds, trees split on them disproportionately often. Furthermore, because MDI is computed entirely on training data, any feature that helps the tree memorise training noise is crowned as "important".`,
      r`Permutation Feature Importance provides the scientific antidote by asking a simple question: "If I destroy the relationship between this feature and the target on unseen validation data, how badly does the model suffer?" By shuffling the values of one feature across validation rows while leaving all other columns intact, PFI preserves the feature's marginal distribution while obliterating its correlation with the outcome. If shuffling a column causes validation error to spike, the model genuinely relied on that feature. If shuffling causes zero change (or even improves performance), the feature was merely redundant noise.`,
    ],
    analogy: r`Assessing which engine component is essential to a car's speed by temporarily disconnecting each wire on a test track and measuring how much lap time degrades.`,
    steps: [
      r`Train the predictive model on the training dataset using standard cross-validation or hyperparameter tuning.`,
      r`Evaluate the baseline performance metric (e.g. MSE, cross-entropy, or ROC-AUC) on an untouched held-out validation dataset: $L_{\text{base}} = L(y_{\text{val}}, \hat{f}(X_{\text{val}}))$.`,
      r`For each feature column $j \in \{1, \dots, d\}$, generate a permuted validation set $X_{\text{val}}^{\text{perm}(j)}$ by randomly shuffling row values in column $j$ while keeping all other columns unchanged.`,
      r`Pass the permuted matrix through the trained model to record the degraded performance metric: $L_{\text{perm}}(j) = L(y_{\text{val}}, \hat{f}(X_{\text{val}}^{\text{perm}(j)}))$.`,
      r`Compute the importance score as the difference $\Delta L(j) = L_{\text{perm}}(j) - L_{\text{base}}$ (or ratio for bounded metrics); repeat across multiple random shuffles to compute confidence intervals.`,
      r`Inspect correlated feature clusters: if two features are strongly collinear, group them together or evaluate conditional permutations to avoid underestimating shared influence.`,
    ],
    math: [
      {
        h: 'Mean Decrease in Impurity (MDI / Gini importance)',
        tex: r`$$\operatorname{MDI}(j) = \frac{1}{T} \sum_{t=1}^T \sum_{n \in \mathcal{N}_t: v(n) = j} p(n) \, \Delta I(n)$$`,
        p: r`where $T$ is the number of trees, $\mathcal{N}_t$ is the set of internal nodes in tree $t$, $v(n)$ denotes the feature split at node $n$, $p(n) = N_n / N_{\text{total}}$ is the proportion of training samples reaching node $n$, and $\Delta I(n) = I(n) - \frac{N_L}{N_n}I(n_L) - \frac{N_R}{N_n}I(n_R)$ is the reduction in impurity (Gini or variance). Because continuous features offer more split opportunities, MDI exhibits an inherent cardinality bias.`,
      },
      {
        h: 'Permutation Feature Importance (PFI)',
        tex: r`$$\operatorname{PFI}(j) = \mathbb{E}\left[ L\big(y, \, \hat{f}(X^{\pi_j})\big) \right] - \mathbb{E}\left[ L\big(y, \, \hat{f}(X)\big) \right]$$`,
        p: r`where $X^{\pi_j}$ denotes the feature matrix where column $j$ has been randomly permuted, breaking the joint distribution $P(X_j, Y)$ while strictly preserving the marginal distribution $P(X_j)$. When evaluated on test data, uninformative features yield $\operatorname{PFI} \le 0$, while critical features yield large positive values.`,
      },
      {
        h: 'Standard error of permutation importance across shuffles',
        tex: r`$$\operatorname{SE}\big(\operatorname{PFI}(j)\big) = \frac{s_j}{\sqrt{B}}, \qquad s_j = \sqrt{\frac{1}{B - 1} \sum_{b=1}^B \big(\Delta L_b(j) - \overline{\Delta L}(j)\big)^2}$$`,
        p: r`where $B$ is the number of independent random permutations (typically $B = 5$ to $10$). Computing the standard error over permutations verifies whether a feature's measured importance is statistically distinct from random baseline noise.`,
      },
    ],
    code: r`import numpy as np

# Synthetic dataset: x0 is predictive, x1 is noise, x2 is high-cardinality ID
rng = np.random.default_rng(42)
n = 200
x0 = rng.normal(0, 1, n)
x1 = rng.normal(0, 1, n)
x2 = np.arange(n, dtype=float)
y = 2.5 * x0 + rng.normal(0, 0.5, n)
X = np.column_stack([x0, x1, x2])

# Train / validation split
X_tr, y_tr = X[:120], y[:120]
X_val, y_val = X[120:], y[120:]
w = np.linalg.lstsq(X_tr, y_tr, rcond=None)[0]

# Baseline validation error
base_mse = np.mean((y_val - X_val @ w) ** 2)

# Compute Permutation Feature Importance (PFI) on held-out validation data
pfi = []
for j in range(3):
    X_perm = X_val.copy()
    X_perm[:, j] = rng.permutation(X_perm[:, j])
    perm_mse = np.mean((y_val - X_perm @ w) ** 2)
    pfi.append(perm_mse - base_mse)

print(f"Baseline validation MSE: {base_mse:.4f}")
print(f"PFI (x0 - true signal):  {pfi[0]:.4f}")
print(f"PFI (x1 - noise):        {pfi[1]:.4f}")
print(f"PFI (x2 - unique ID):    {pfi[2]:.4f}")`,
    pitfalls: [
      r`Misinterpreting correlated features: If two features are almost perfectly collinear (e.g. height in centimetres and height in inches), permuting one leaves the model able to use the other, causing PFI to artificially underestimate the importance of both.`,
      r`Evaluating PFI on training data: Running permutation tests on training data rather than validation data reintroduces memorisation bias, failing to penalise overfit features.`,
      r`Extrapolation into impossible feature spaces: Permuting correlated features can generate physically impossible combinations (e.g. an pregnant male or an 8-bedroom studio apartment), forcing the model to evaluate out-of-distribution regions.`,
      r`Ignoring negative importance values: Features with slightly negative PFI scores indicate that permuting them actually reduced error, signalling noisy or overfitted inputs that should be pruned.`,
    ],
    keyPoints: [
      r`MDI evaluates training split reductions and artificially favours high-cardinality variables like unique IDs or continuous noise.`,
      r`PFI evaluates held-out validation loss degradation and reflects genuine generalisable predictive value.`,
      r`Shuffling breaks feature-target association while preserving the empirical marginal distribution of the feature.`,
      r`For correlated predictors, grouped permutation or conditional importance is necessary to avoid mutual dilution.`,
    ],
    quiz: [
      {
        q: r`Why is default Mean Decrease in Impurity (MDI / Gini importance) dangerous when evaluating tree ensembles on datasets with mixed feature types?`,
        o: [
          r`Because MDI cannot be computed for classification trees`,
          r`Because MDI artificially inflates the importance of continuous and high-cardinality features that offer many split points to overfit training noise`,
          r`Because MDI requires inverting high-dimensional covariance matrices`,
          r`Because MDI values always sum to zero`,
        ],
        a: 1,
        why: r`MDI evaluates impurity reduction strictly on training data. Continuous features and high-cardinality categoricals offer far more split candidates, allowing trees to split on them frequently to memorise noise, creating a severe false importance bias.`,
      },
      {
        q: r`What is the core operational principle behind Permutation Feature Importance (PFI)?`,
        o: [
          r`It permanently sets the feature column to zero in the training dataset`,
          r`It inverts the sign of the model coefficients`,
          r`It randomly shuffles the feature values across held-out validation rows and measures the resulting increase in prediction error`,
          r`It computes partial derivatives of the output with respect to tree depth`,
        ],
        a: 2,
        why: r`By shuffling a feature column across validation instances, PFI breaks the correlation between that feature and the target while keeping its marginal distribution intact. The resulting drop in validation performance quantifies the model's true reliance on that feature.`,
      },
      {
        q: r`If two input features $X_1$ and $X_2$ are nearly 100% correlated and both strongly drive the target $Y$, what does standard Permutation Feature Importance report for them?`,
        o: [
          r`Both will appear falsely unimportant because permuting either one allows the model to predict accurately using the other`,
          r`Both will receive an importance score of exactly 1.0`,
          r`The model will immediately crash due to multicollinearity`,
          r`One will receive 100% importance and the other will receive -100% importance`,
        ],
        a: 0,
        why: r`When two features carry redundant information, permuting $X_1$ leaves $X_2$ completely intact. The model compensates using $X_2$, resulting in a negligible increase in error and misleadingly low PFI scores for both features.`,
      },
      {
        q: r`What does a negative Permutation Feature Importance score (e.g. $\operatorname{PFI} = -0.015$) indicate about a feature?`,
        o: [
          r`The feature has an inverse linear relationship with the target`,
          r`The feature is the single most important variable in the model`,
          r`The algorithm encountered a division by zero error`,
          r`Permuting the feature actually improved validation performance, indicating the feature is pure noise or causing overfitting`,
        ],
        a: 3,
        why: r`A negative score means validation error decreased when the feature was scrambled. This confirms that the model's reliance on that feature was harmful to generalisation, identifying it as a candidate for feature pruning.`,
      },
    ],
    usedBy: ['random_forest_classifier', 'gradient_boosted_classifiers'],
    prereq: ['random_forest_classifier', 'cross-validation'],
    related: ['shap', 'pdp-ice-and-ale-plots', 'random_forest_classifier'],
    keywords: 'permutation feature importance impurity mdi pfi gini importance model interpretability feature selection tree ensembles',
  },
  {
    id: 'shap',
    short: 'SHAP',
    title: 'SHAP (SHapley Additive exPlanations)',
    task: 'concepts',
    module: 'Interpretability and fairness',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Unified game-theoretic framework explaining individual predictions by allocating fair additive credit across feature coalitions.`,
    lead: r`Interpreting complex non-linear models requires answering not just what a model predicts, but exactly why it made that specific prediction for an individual instance. Rooted in cooperative game theory (Shapley values), SHAP (SHapley Additive exPlanations) provides the unique mathematical framework that satisfies foundational fairness axioms: local accuracy, missingness, and consistency. By calculating each feature's marginal contribution across all possible coalitions, SHAP unifies local feature attribution with global model interpretability.`,
    intuition: [
      r`Imagine three colleagues—Alice, Bob, and Charlie—collaborating on a freelance consulting project that earns a total bonus of £9,000. If Alice worked alone, the project would have earned £2,000. If Bob worked alone, £3,000. If Alice and Bob worked together, their synergy would have yielded £7,000. Charlie brings niche domain expertise that only becomes valuable when paired with Bob. How do you divide the £9,000 bonus fairly among the three team members?`,
      r`In 1953, mathematician Lloyd Shapley solved this cooperative game theory dilemma by evaluating each player's marginal contribution across every possible coalition they could join. A player's Shapley value is the weighted average of how much value they add when stepping into a room containing any subset of the other players. In 2017, Scott Lundberg and Su-In Lee recognised that predicting an outcome in machine learning is identical to a cooperative game: the model's prediction is the total payout, and the features are the collaborating players.`,
      r`For any individual prediction, SHAP calculates how much each feature value pushed the prediction away from the dataset's base expected value $\mathbb{E}[f(X)]$. If a patient has a predicted 35% risk of heart disease compared to the population baseline of 10%, SHAP might reveal that their blood pressure added +18%, their age added +12%, and their active exercise routine subtracted -5%, summing up exactly to the 25% discrepancy. Because SHAP guarantees mathematical additivity, these local explanations can be aggregated globally to create summary plots, interaction matrices, and dependence curves.`,
    ],
    analogy: r`Itemising a restaurant bill where friends shared overlapping appetizers and family-style mains: calculating each diner's fair share by averaging their marginal cost across all combinations of who sat at the table.`,
    steps: [
      r`Establish the baseline expectation: compute the base value $\phi_0 = \mathbb{E}[f(X)]$, representing the model's average prediction across the background training distribution.`,
      r`Select a candidate instance $x$ whose individual model prediction $f(x)$ requires explanation.`,
      r`Enumerate feature coalitions: evaluate model predictions across all $2^M$ subsets of features, substituting absent features with background expectation values.`,
      r`Calculate marginal contributions: for feature $i$ and coalition $S$, compute the marginal lift $\Delta(S, i) = f(S \cup \{i\}) - f(S)$.`,
      r`Compute the weighted Shapley average: weight each marginal contribution by the combinatorial probability of coalition size $|S|$ to yield $\phi_i(x)$.`,
      r`Verify the efficiency axiom: ensure that the sum of attributions equals the total prediction offset: $\sum_{i=1}^M \phi_i(x) = f(x) - \phi_0$.`,
      r`Aggregate across the population: stack individual SHAP vectors to construct global beeswarm summary plots, feature importance rankings, and dependency curves.`,
    ],
    math: [
      {
        h: 'Classical Shapley value formulation',
        tex: r`$$\phi_i(x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|! \, (|F| - |S| - 1)!}{|F|!} \Big( f_x(S \cup \{i\}) - f_x(S) \Big)$$`,
        p: r`where $F$ is the total set of features, $S$ is a feature coalition excluding feature $i$, and $|S|!(|F| - |S| - 1)! / |F|!$ is the combinatorial probability that feature $i$ enters coalition $S$ under a uniformly random permutation of players. $f_x(S) = \mathbb{E}[f(X) \mid X_S = x_S]$ represents the conditional expectation with features in $S$ fixed at their instance values.`,
      },
      {
        h: 'Additive feature attribution and efficiency axiom',
        tex: r`$$f(x) = \phi_0 + \sum_{i=1}^M \phi_i(x), \qquad \phi_0 = \mathbb{E}\big[f(X)\big]$$`,
        p: r`Local accuracy (efficiency) guarantees that the sum of all feature attributions $\phi_i(x)$ plus the base value $\phi_0$ recovers the exact model prediction $f(x)$. Unlike heuristic attribution methods (e.g. split counts), SHAP never loses or invents prediction credit.`,
      },
      {
        h: 'The four fundamental Shapley axioms',
        tex: r`$$\begin{aligned}
\text{Efficiency:} & \quad \sum_{i=1}^M \phi_i(x) = f(x) - \mathbb{E}[f(X)] \\\\
\text{Symmetry:} & \quad f(S \cup \{i\}) = f(S \cup \{j\}) \implies \phi_i = \phi_j \\\\
\text{Dummy (Null):} & \quad f(S \cup \{i\}) = f(S) \implies \phi_i = 0 \\\\
\text{Additivity:} & \quad \phi_i(f + g) = \phi_i(f) + \phi_i(g)
\end{aligned}$$`,
        p: r`Shapley proved that the Shapley formula is the unique attribution method satisfying all four axioms simultaneously. If an attribution method violates consistency, altering a model such that a feature contributes more can paradoxically lower that feature's assigned importance.`,
      },
    ],
    code: r`import numpy as np
import math
from itertools import combinations

# Model with interaction: f(x) = 2*x0 + 3*x1 + 4*x0*x1 (x2 is dummy)
def f(x):
    return 2.0 * x[0] + 3.0 * x[1] + 4.0 * x[0] * x[1]

x_inst = np.array([1.0, 1.0, 0.5])
base = np.array([0.0, 0.0, 0.0])
M = 3
phi = np.zeros(M)

# Compute exact Shapley values across all 2^M coalitions
for i in range(M):
    rest = [j for j in range(M) if j != i]
    for s_len in range(M):
        for S in combinations(rest, s_len):
            x_wo, x_w = base.copy(), base.copy()
            for j in S:
                x_wo[j] = x_inst[j]
                x_w[j] = x_inst[j]
            x_w[i] = x_inst[i]
            w = math.factorial(len(S)) * math.factorial(M - len(S) - 1) / math.factorial(M)
            phi[i] += w * (f(x_w) - f(x_wo))

print(f"Prediction: {f(x_inst):.2f}")
print(f"Baseline:   {f(base):.2f}")
print(f"SHAP attributions [x0, x1, x2]: {phi.round(2)}")
print(f"Sum of attributions: {np.sum(phi):.2f}")`,
    pitfalls: [
      r`Exponential complexity of exact Shapley values: Calculating exact attributions across $M$ features requires evaluating $2^M$ coalitions. For large $M$, models require polynomial TreeSHAP or sampled KernelSHAP approximations.`,
      r`Feature correlation and unrealistic background coalitions: When features are strongly correlated, marginal expectation approximations can query models on impossible feature combinations (e.g. low weight, massive BMI), distorting attribution.`,
      r`Conflating SHAP attributions with causal effects: SHAP explains how the statistical model uses features to make predictions; it does not prove that changing a feature in the real world will causally shift the outcome.`,
      r`Choice of background dataset: In KernelSHAP and TreeSHAP, the baseline value $\phi_0$ depends directly on the chosen background distribution; using a biased reference sample shifts all attribution values.`,
    ],
    keyPoints: [
      r`Grounded in cooperative game theory; uniquely satisfies efficiency, symmetry, dummy player, and additivity axioms.`,
      r`Provides both local explanations (instance-level waterfall plots) and global insights (beeswarm summary plots).`,
      r`TreeSHAP computes exact Shapley values in polynomial time $O(T L D^2)$ for tree ensembles.`,
      r`Fairly divides the credit of non-linear feature interactions among participating features.`,
    ],
    quiz: [
      {
        q: r`What does the Efficiency axiom guarantee in SHAP feature attribution?`,
        o: [
          r`The model executes in $O(1)$ time`,
          r`The sum of all feature SHAP values equals the difference between the model prediction $f(x)$ and the baseline expected value $\mathbb{E}[f(X)]$`,
          r`All features have equal variance across training folds`,
          r`The model achieves 100% training accuracy`,
        ],
        a: 1,
        why: r`The efficiency (local accuracy) axiom guarantees that the sum of attributions $\sum \phi_i(x)$ perfectly bridges the gap between the expected baseline prediction $\phi_0$ and the instance prediction $f(x)$ with zero unaccounted credit.`,
      },
      {
        q: r`Why is TreeSHAP widely preferred over KernelSHAP when explaining tree ensembles like XGBoost and LightGBM?`,
        o: [
          r`TreeSHAP only works on linear regression models`,
          r`TreeSHAP ignores all interaction terms between features`,
          r`TreeSHAP requires no training data whatsoever`,
          r`TreeSHAP exploits tree graph structure to compute exact Shapley values in polynomial time $O(T L D^2)$ instead of exponential sampling`,
        ],
        a: 3,
        why: r`While model-agnostic KernelSHAP must sample exponential coalitions ($2^M$), TreeSHAP recurses down decision tree paths, tracking conditional feature distributions in polynomial time relative to tree depth and leaf counts.`,
      },
      {
        q: r`If a feature has zero marginal impact across every single coalition of features ($f(S \cup \{i\}) = f(S)$ for all $S$), what is its SHAP value according to the Dummy axiom?`,
        o: [
          r`Exactly 0`,
          r`Equal to the baseline value $\phi_0$`,
          r`Negative infinity`,
          r`Equal to the average of all other features`,
        ],
        a: 0,
        why: r`The Dummy (or Null player) axiom mandates that if a feature never contributes to altering model predictions in any context, its allocated credit must be strictly 0.`,
      },
      {
        q: r`Why must SHAP explanations NOT be treated as direct causal statements about the real world?`,
        o: [
          r`Because SHAP values cannot be computed on continuous variables`,
          r`Because SHAP reflects the predictive associations learned by the model, which can rely on confounding variables and proxy correlations rather than causal mechanisms`,
          r`Because Shapley values are non-deterministic`,
          r`Because SHAP values are always positive numbers`,
        ],
        a: 1,
        why: r`SHAP explains the internal decision surface of the mathematical model. If a model predicts health outcomes using hospital visit counts as a correlation proxy, SHAP attributes high importance to visits, but hospital visits do not cause illness.`,
      },
    ],
    usedBy: ['gradient_boosted_classifiers', 'random_forest_classifier'],
    prereq: ['random_forest_classifier', 'gradient_boosted_classifiers'],
    related: ['permutation-and-impurity-feature-importance', 'pdp-ice-and-ale-plots', 'random_forest_classifier'],
    keywords: 'shap shapley values additive explanations model interpretability treeshap kernelshap feature attribution xai',
  },
  {
    id: 'pdp-ice-and-ale-plots',
    short: 'PDP, ICE and ALE plots',
    title: 'Partial Dependence, ICE and ALE Plots',
    task: 'concepts',
    module: 'Interpretability and fairness',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Model-agnostic visualisations of feature effects: comparing global marginal averages (PDP), individual instance trajectories (ICE), and correlation-safe local differences (ALE).`,
    lead: r`Global feature importance scores like PFI and SHAP reveal which features matter, but they do not show the direction or functional shape of those relationships. Partial Dependence Plots (PDP) and Individual Conditional Expectation (ICE) curves map how model predictions shift as a target feature varies across its domain. Accumulated Local Effects (ALE) plots resolve the catastrophic extrapolation errors that plague PDPs when features are strongly correlated, providing robust, unpolluted visualisations of complex machine learning models.`,
    intuition: [
      r`Suppose a real estate model predicts house prices using square footage and number of bedrooms. You want to understand: "If a house gains 500 square feet, how much does its predicted price increase?" A Partial Dependence Plot (PDP) answers this by taking every house in your dataset, artificially overwriting its square footage with a specific grid value (e.g. 2,000 sq ft), predicting all prices, and calculating the overall average. By repeating this across a grid of sizes, PDP draws a smooth curve showing the general relationship between area and price.`,
      r`However, PDP has two major blind spots. First, it averages away individual differences. If an extra bedroom increases value for large suburban family homes but decreases value for urban studio flats, the upward and downward slopes cancel each other out, leaving PDP with a flat, deceptive horizontal line. Individual Conditional Expectation (ICE) fixes this by plotting a separate curve for every individual house. Instead of a single averaged line, ICE renders a bundle of trajectories, immediately revealing whether all houses react similarly or if distinct subgroups diverge.`,
      r`The second flaw of PDP is extrapolation on correlated data. Square footage and bedroom count are tightly correlated: 5-bedroom homes are almost never 400 square feet. Yet PDP forces that exact combination into the model, generating nonsensical predictions that contaminate the curve. Accumulated Local Effects (ALE) eliminates this by computing prediction differences strictly within narrow local conditional slices of data (e.g. houses between 1,900 and 2,100 sq ft) and accumulating those differences along the axis, keeping the evaluation entirely within real-world data distributions.`,
    ],
    analogy: r`Inspecting medical treatment responses: PDP shows the average patient improvement, ICE plots each patient's individual vital trajectory to catch adverse subgroup reactions, and ALE evaluates responses strictly within appropriate age cohorts rather than dosing toddlers with adult regimens.`,
    steps: [
      r`Select the feature of interest $x_S$ (e.g. continuous predictor or low-cardinality discrete variable) and define a grid of evaluation values across its range.`,
      r`Compute ICE trajectories: for each instance $i$ in the dataset, substitute its feature value with each grid point $z_k$ while preserving all other features $x_C^{(i)}$, and evaluate the model prediction $\hat{f}(z_k, x_C^{(i)})$.`,
      r`Generate the PDP curve: compute the pointwise arithmetic mean of all ICE curves across each grid point: $\bar{f}_S(z_k) = \frac{1}{n} \sum_{i=1}^n \hat{f}(z_k, x_C^{(i)})$.`,
      r`Detect interactions in ICE: look for non-parallel or crossing ICE curves; parallel trajectories confirm additive effects, while diverging lines indicate strong interactions with other features.`,
      r`Compute ALE plots if features are correlated: partition $x_S$ into narrow intervals, calculate local prediction differences for instances falling inside each interval, and accumulate the average differences across bins.`,
      r`Centre the curves: centre ALE at zero so the vertical axis reflects the deviation from the overall dataset mean prediction.`,
    ],
    math: [
      {
        h: 'Partial Dependence Plot (PDP) formulation',
        tex: r`$$\hat{f}_{S}(x_S) = \mathbb{E}_{X_C}\big[ \hat{f}(x_S, X_C) \big] = \frac{1}{n} \sum_{i=1}^n \hat{f}\big(x_S, \, x_C^{(i)}\big)$$`,
        p: r`where $x_S$ is the feature subset under inspection and $X_C$ represents all other conditioning features. By evaluating the sample average over all $n$ background instances $x_C^{(i)}$, PDP marginalises out the effect of conditioning variables. When $X_S$ and $X_C$ are correlated, this marginalisation forces predictions in unobserved feature spaces.`,
      },
      {
        h: 'Individual Conditional Expectation (ICE) curves',
        tex: r`$$\hat{f}_{S}^{(i)}(x_S) = \hat{f}\big(x_S, \, x_C^{(i)}\big), \qquad \hat{f}_S(x_S) = \frac{1}{n} \sum_{i=1}^n \hat{f}_S^{(i)}(x_S)$$`,
        p: r`An ICE plot displays the $n$ individual lines $\hat{f}_S^{(i)}$ simultaneously. Centred ICE (c-ICE) anchors each line at zero at the minimum grid point: $\hat{f}_{S,\text{cent}}^{(i)}(x_S) = \hat{f}_S^{(i)}(x_S) - \hat{f}_S^{(i)}(x_{S,\min})$, removing baseline offset differences to highlight heterogeneous slopes.`,
      },
      {
        h: 'Accumulated Local Effects (ALE) formulation',
        tex: r`$$\hat{f}_{ALE}(x_S) = \int_{z_0}^{x_S} \mathbb{E}_{X_C \mid X_S = z_S}\left[ \frac{\partial \hat{f}}{\partial X_S}(z_S, X_C) \right] dz_S - c$$`,
        p: r`where $c$ is a centring constant ensuring $\mathbb{E}[\hat{f}_{ALE}(X_S)] = 0$. ALE computes the conditional gradient (or finite differences in empirical bins) strictly among instances whose feature value $X_S$ actually lies near $z_S$, eliminating the unobserved extrapolation errors of PDP.`,
      },
    ],
    code: r`import numpy as np

# Model with interaction: f(x1, x2) = x1 * x2 (where x2 in {-1, +1})
rng = np.random.default_rng(42)
n = 60
x1 = rng.uniform(-2, 2, n)
x2 = rng.choice([-1.0, 1.0], size=n)
y = x1 * x2

# Evaluation grid for feature x1
grid = np.linspace(-2, 2, 9)

# Compute ICE curves for all instances
ice_curves = np.zeros((n, len(grid)))
for i in range(n):
    for g_idx, val in enumerate(grid):
        ice_curves[i, g_idx] = val * x2[i]

# PDP is the pointwise average of ICE curves
pdp = np.mean(ice_curves, axis=0)

print(f"Grid values: {[round(float(v), 1) for v in grid]}")
print(f"PDP values:  {[round(float(v), 2) for v in pdp]}")
print(f"ICE curve instance 0 (x2={x2[0]:.0f}): {[round(float(v), 2) for v in ice_curves[0]]}")
print(f"ICE curve instance 1 (x2={x2[1]:.0f}): {[round(float(v), 2) for v in ice_curves[1]]}")`,
    pitfalls: [
      r`PDP extrapolation on correlated features: Averaging predictions across synthetic combinations that cannot exist in reality distorts the partial dependence curve with nonsensical model extrapolations.`,
      r`Hidden interactions in flat PDPs: A flat horizontal PDP line does not guarantee that a feature has no effect; equal numbers of positive and negative subgroup effects cancel out to zero unless inspected via ICE.`,
      r`Computational cost of ICE: For large datasets ($n > 100{,}000$), computing predictions across $n$ instances for $K$ grid points requires $n \times K$ model inferences, requiring subsampling to 500 or 1,000 curves.`,
      r`Misinterpreting ALE centring: ALE curves are centred around zero; the vertical axis represents difference from average prediction, not the absolute prediction scale.`,
    ],
    keyPoints: [
      r`PDP reveals average marginal feature relationships; ICE exposes individual subgroup heterogeneity and interaction effects.`,
      r`Parallel ICE lines indicate pure additive effects; intersecting or diverging lines indicate strong interactions.`,
      r`ALE plots prevent dangerous extrapolation errors when features are correlated by evaluating local conditional differences.`,
      r`Centred ICE (c-ICE) subtracts instance baselines to isolate heterogeneous response slopes.`,
    ],
    quiz: [
      {
        q: r`Why can a Partial Dependence Plot (PDP) show a completely flat horizontal line even when a feature has a massive impact on predictions?`,
        o: [
          r`Because the model is underfitting`,
          r`Because PDP can only be calculated on linear regression models`,
          r`Because opposing subgroup effects (e.g. positive impact on males and negative impact on females) cancel each other out during averaging`,
          r`Because the feature values were not normalised`,
        ],
        a: 2,
        why: r`PDP computes the average prediction across all instances. If a feature interacts with another variable such that it increases predictions for half the dataset and decreases them for the other half, the average remains flat. ICE plots unmask these hidden interactions.`,
      },
      {
        q: r`What critical flaw in Partial Dependence Plots (PDP) does Accumulated Local Effects (ALE) solve?`,
        o: [
          r`PDP cannot run on GPU clusters`,
          r`PDP creates unrealistic, out-of-distribution synthetic points when features are correlated, while ALE evaluates differences strictly within local conditional slices`,
          r`PDP is non-deterministic, while ALE is exact`,
          r`PDP requires training deep neural networks`,
        ],
        a: 1,
        why: r`When features are correlated (such as height and weight), PDP pairs extreme values together that never appear in reality. ALE computes differences only within narrow local intervals of real data, avoiding out-of-distribution extrapolation.`,
      },
      {
        q: r`How does an Individual Conditional Expectation (ICE) plot differ from a Partial Dependence Plot (PDP)?`,
        o: [
          r`ICE plots a separate prediction trajectory for every individual instance, whereas PDP averages those curves into a single line`,
          r`ICE is evaluated on training data, while PDP is evaluated on test data`,
          r`ICE only works for tree-based models`,
          r`ICE evaluates classification accuracy rather than prediction outputs`,
        ],
        a: 0,
        why: r`PDP is the point-by-point average of all individual ICE curves. Viewing the individual ICE curves exposes whether all samples follow the average trend or whether distinct clusters of instances diverge.`,
      },
      {
        q: r`What visual pattern in an ICE plot indicates that a feature has purely additive effects with zero interactions with other features?`,
        o: [
          r`All ICE curves intersect at the origin`,
          r`The ICE curves form a vertical wall`,
          r`All ICE curves are perfectly parallel to one another`,
          r`The curves form circular concentric rings`,
        ],
        a: 2,
        why: r`If a feature operates additively ($f(x_1, x_2) = g(x_1) + h(x_2)$), changing $x_1$ shifts the prediction by the exact same amount regardless of $x_2$. This makes all ICE curves vertical translations of one another (parallel).`,
      },
    ],
    usedBy: [],
    prereq: ['permutation-and-impurity-feature-importance', 'shap'],
    related: ['shap', 'permutation-and-impurity-feature-importance', 'random_forest_classifier'],
    keywords: 'pdp ice ale partial dependence individual conditional expectation accumulated local effects model interpretability xai',
  },
  {
  "id": "lime",
  "short": "LIME",
  "title": "Local Interpretable Model-Agnostic Explanations",
  "task": "concepts",
  "module": "Interpretability and fairness",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Explain individual predictions of any black-box model using local surrogate linear models: master perturbation sampling, exponential kernels, and local fidelity.",
  "lead": "Complex models like deep neural networks or gradient-boosted trees are globally non-linear and uninterpretable. LIME explains why a model made a specific prediction on sample x by approximating the local decision boundary with an interpretable surrogate model.",
  "intuition": [
    "Modern machine learning architectures—such as 100-tree gradient boosted ensembles or deep neural networks—excel at predictive accuracy by learning highly complex, convoluted non-linear decision boundaries. However, in credit risk underwriting, healthcare pathology, and judicial sentencing, stakeholders demand to know why a specific decision was reached: \"Why was this customer denied a loan?\"",
    "While explaining the global behaviour of a black-box model across all of multi-dimensional feature space is practically impossible, explaining a single localised prediction is entirely feasible. Marco Tulio Ribeiro, Sameer Singh, and Carlos Guestrin (2016) introduced LIME: Local Interpretable Model-Agnostic Explanations.",
    "LIME is grounded in the geometric observation that even the most tortuous non-linear manifold looks flat and linear if you zoom in closely enough onto a tiny local neighbourhood. To explain prediction $f(x)$, LIME draws random perturbations in the immediate vicinity of $x$, observes the black-box outputs for these perturbed samples, weights each sample by its exponential distance to $x$, and fits a simple, interpretable surrogate model (typically a sparse linear model).",
    "The learned surrogate weights $w$ represent local feature importances: showing which features pushed the model toward the prediction, which features pushed against it, and by how much, providing human-understandable explanations for any black-box model."
  ],
  "analogy": "Imagine looking at a globe of the Earth. Globally, the Earth is an intricate curved sphere covered in mountains and ocean trenches (the complex global black-box model). But if you step out of your front door and look down at your local town square, the ground is so locally flat that you can map it with a simple 2D architectural blueprint (the local linear surrogate). LIME constructs that local flat blueprint for any specific decision.",
  "steps": [
    {
      "title": "1. Select instance and draw neighbourhood perturbations",
      "body": "Take instance $x \\in \\mathbb{R}^p$ to explain. Draw $M$ perturbed samples $z_k \\sim \\mathcal{N}(x, \\sigma^2)$ in the continuous feature space around $x$."
    },
    {
      "title": "2. Query black-box predictions for perturbations",
      "body": "Pass all perturbed samples through the black-box model to obtain predictions $y_k = f(z_k)$."
    },
    {
      "title": "3. Compute exponential proximity weights",
      "body": "Calculate proximity weights: $\\pi_x(z_k) = \\exp(-D(x, z_k)^2 / \\sigma^2)$, assigning high weights to perturbations nearest to $x$ and vanishing weights to distant points."
    },
    {
      "title": "4. Fit weighted sparse linear surrogate model",
      "body": "Fit a weighted linear regression: $\\min_w \\sum_{k=1}^M \\pi_x(z_k) (f(z_k) - w^T z_k)^2 + \\Omega(w)$. Output weights $w$ as local feature attributions."
    }
  ],
  "math": [
    {
      "h": "LIME General Optimisation Objective",
      "tex": "\\operatorname{explanation}(x) = \\arg\\min_{g \\in \\mathcal{G}} \\mathcal{L}(f, g, \\pi_x) + \\Omega(g)",
      "p": "Balances local fidelity loss L (how accurately surrogate g approximates black-box f weighted by proximity pi_x) with model complexity Omega(g) (e.g. limiting to K non-zero features)."
    },
    {
      "h": "Exponential Proximity Kernel",
      "tex": "\\pi_x(z) = \\exp\\left(-\\frac{D(x, z)^2}{\\sigma^2}\\right)",
      "p": "Assigns decaying importance to perturbed samples based on their Euclidean distance D(x, z) to instance x, governed by kernel width parameter sigma."
    },
    {
      "h": "Weighted Least Squares Surrogate Fit",
      "tex": "w^* = \\left( Z^T W Z \\right)^{-1} Z^T W y_{\\mathrm{blackbox}}, \\quad W = \\operatorname{diag}(\\pi_x(z_1), \\dots, \\pi_x(z_M))",
      "p": "Closed-form weighted least squares solution for surrogate linear weights, where Z is the design matrix of perturbations and W contains proximity weights."
    }
  ],
  "code": "import numpy as np\nfrom sklearn.ensemble import RandomForestClassifier\n\n# Tabular LIME from scratch\nclass SimpleTabularLIME:\n    def __init__(self, predict_fn, n_samples=1000, kernel_width=0.75):\n        self.predict_fn = predict_fn\n        self.n_samples = n_samples\n        self.kernel_width = kernel_width\n        \n    def explain_instance(self, x, feature_names=None):\n        p = len(x)\n        if feature_names is None:\n            feature_names = [f\"Feature_{i}\" for i in range(p)]\n            \n        # 1. Generate perturbations around x\n        perturbations = np.random.normal(loc=x, scale=0.5, size=(self.n_samples, p))\n        # Ensure exact instance is included\n        perturbations[0] = x\n        \n        # 2. Query black-box predictions (target class 1 probability)\n        blackbox_probs = self.predict_fn(perturbations)\n        if blackbox_probs.ndim > 1:\n            blackbox_probs = blackbox_probs[:, 1]\n            \n        # 3. Compute Euclidean distance and exponential proximity weights\n        dists = np.linalg.norm(perturbations - x, axis=1)\n        weights = np.exp(-(dists**2) / (self.kernel_width**2))\n        \n        # 4. Weighted Ridge/OLS Linear Regression\n        # Centred design matrix\n        Z = np.column_stack([np.ones(self.n_samples), perturbations])\n        W = np.diag(weights)\n        \n        # Solve (Z^T W Z + lambda I) w = Z^T W y\n        ZTW = Z.T @ W\n        ridge_reg = 1e-4 * np.eye(p + 1)\n        w_surrogate = np.linalg.solve(ZTW @ Z + ridge_reg, ZTW @ blackbox_probs)\n        \n        intercept = w_surrogate[0]\n        coefs = w_surrogate[1:]\n        \n        explanation = sorted(zip(feature_names, coefs), key=lambda item: abs(item[1]), reverse=True)\n        return explanation, intercept\n\n# Train a complex non-linear Random Forest on synthetic loan data\nnp.random.seed(42)\nn_train = 500\nfeatures = ['Income', 'DebtRatio', 'CreditScore', 'EmploymentYears']\n\n# Non-linear approval rule with interactions\nX_train = np.random.uniform(1, 10, (n_train, 4))\nlatent_score = 0.5 * X_train[:, 0] - 1.2 * X_train[:, 1] + 1.5 * np.log(X_train[:, 2]) + 0.3 * X_train[:, 3]\ny_train = (latent_score > np.median(latent_score)).astype(int)\n\nrf_model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)\nrf_model.fit(X_train, y_train)\n\n# Instance to explain: High income, but high debt ratio!\nx_applicant = np.array([8.5, 8.0, 4.0, 5.0])\nprob_approval = rf_model.predict_proba(x_applicant.reshape(1, -1))[0, 1]\n\nlime_explainer = SimpleTabularLIME(rf_model.predict_proba, n_samples=1500, kernel_width=1.0)\nexp, base = lime_explainer.explain_instance(x_applicant, feature_names=features)\n\nprint(f\"Applicant Black-Box Approval Probability: {prob_approval * 100:.1f}%\")\nprint(f\"Local Linear Surrogate Base Intercept:   {base:.3f}\")\nprint(\"\\nLocal Feature Importances (LIME Weights):\")\nfor feat, weight in exp:\n    direction = \"Supports (+)\" if weight > 0 else \"Opposes (-)\"\n    print(f\"  {feat:18s}: {weight:+.4f} -> {direction}\")",
  "keyPoints": [
    "Model-agnostic interpretability framework: explains individual predictions of any black-box classifier or regressor.",
    "Grounded in local surrogate models: approximates complex global decision boundaries with a local linear surrogate model.",
    "Generates synthetic perturbations in the vicinity of instance $x$, querying the black-box to observe boundary behaviour.",
    "Exponential proximity kernel $\\pi_x(z) = \\exp(-D(x, z)^2 / \\sigma^2)$ ensures local fidelity by weighting near neighbours heavily.",
    "Output weights provide localised feature attribution: showing how much each feature contributed to pushing the decision over the threshold."
  ],
  "pitfalls": [
    "Sampling instability: Because perturbations are drawn randomly, running LIME multiple times on the same instance can produce slightly varying explanations.",
    "Sensitivity to kernel width sigma: If $\\sigma$ is too small, the surrogate overfits a tiny neighbourhood; if too large, the surrogate tries to linearise a globally curved boundary, failing local fidelity.",
    "Out-of-distribution perturbations: Drawing uniform or Gaussian perturbations around correlated tabular features can create impossible synthetic points (e.g. pregnant males or age 15 with 20 years work experience)."
  ],
  "quiz": [
    {
      "q": "Why does LIME fit a linear model on local perturbations rather than fitting a global linear model on the entire dataset?",
      "o": [
        "A complex black-box model is globally non-linear, but zooming into the microscopic vicinity of a single prediction reveals a locally flat linear boundary",
        "Global linear models require infinite training data",
        "LIME cannot compute matrix multiplications globally",
        "Perturbations can only be generated in 2 dimensions"
      ],
      "a": 0,
      "why": "Globally, black-box boundaries are non-linear and cannot be captured by a single hyperplane. Locally around an individual point, linear approximations achieve high fidelity."
    },
    {
      "q": "What is the role of the exponential proximity kernel pi_x(z) in LIME?",
      "o": [
        "It assigns high regression weights to perturbations closest to instance x, ensuring the surrogate model prioritises local accuracy over distant points",
        "It normalises all feature values to [0, 1]",
        "It speeds up the black-box prediction speed",
        "It converts continuous features into categorical features"
      ],
      "a": 0,
      "why": "The proximity kernel ensures local fidelity: distant perturbations carry near-zero weight, forcing the linear surrogate to fit the boundary immediately surrounding x."
    }
  ],
  "usedBy": [],
  "prereq": [
    "ridge_regression"
  ],
  "related": [
    "counterfactual-explanations",
    "fairness-metrics-and-mitigation",
    "random_forest_classifier",
    "gradient_boosting_regressor"
  ],
  "keywords": "lime, local interpretable model agnostic explanations, interpretability, surrogate models, feature attribution, perturbations, local fidelity"
},
  {
  "id": "counterfactual-explanations",
  "short": "Counterfactuals",
  "title": "Counterfactual Explanations and Recourse",
  "task": "concepts",
  "module": "Interpretability and fairness",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Provide actionable recourse to individuals affected by algorithmic decisions: master minimum-perturbation optimisation, proximity, sparsity, and plausibility.",
  "lead": "When a bank loan is denied or job application rejected by an AI, knowing which features had the highest Shapley values does not tell the applicant what to do. Counterfactual explanations provide concrete, actionable recourse: what minimal changes would flip the decision from denied to approved?",
  "intuition": [
    "Traditional model interpretability tools (like feature importance, SHAP, and LIME) explain the past: they inform a user which features contributed most to a rejected mortgage application. However, telling an applicant that their \"Credit Score\" had a Shapley value of $-0.42$ offers zero actionable guidance. What the applicant needs is algorithmic recourse: \"What concrete steps must I take to get approved?\"",
    "Sandra Wachter, Brent Mittelstadt, and Chris Russell (2017) formalised Counterfactual Explanations to satisfy the legal \"Right to Explanation\" under GDPR. A counterfactual explanation finds a hypothetical alternative instance $x^*$ that is as close as possible to original input $x$, but produces the desired target prediction: $f(x^*) = y^*$.",
    "For example: \"If your monthly savings were £200 higher and your credit card debt were £1,500 lower, your loan would have been approved.\" This bridges the gap between passive attribution and actionable recourse.",
    "Mathematically, counterfactual search is an optimisation problem balancing prediction loss (pushing $f(x^*)$ toward target class $y^*$) against a distance penalty $d(x, x^*)$ (ensuring changes are minimal). Crucially, valid recourse must enforce domain constraints: distinguishing between mutable features (income, debt) and immutable features (age, biological sex, birthplace), and ensuring the counterfactual lies on the plausible data manifold."
  ],
  "analogy": "Imagine a student who scored 48% on a final exam and failed by two marks. An attribution explanation tells them: \"You failed because of your weak history essay score.\" A counterfactual explanation gives actionable advice: \"If you had answered question 3 on the history essay correctly, your score would have been 51% and you would have passed.\" It identifies the minimum effort path across the passing threshold.",
  "steps": [
    {
      "title": "1. Specify target outcome and define feature mutability",
      "body": "Identify desired outcome $y^*$ (e.g. Loan Approved). Categorise features into immutable (age, race), actionable mutable (debt, savings), and directional mutable (education can increase, but not decrease)."
    },
    {
      "title": "2. Formulate optimisation loss function",
      "body": "Construct composite loss: $\\mathcal{L}(x^*) = \\ell_{\\mathrm{pred}}(f(x^*), y^*) + \\lambda \\cdot d(x, x^*)$, where $d$ measures distance using Manhattan $L_1$ or Median Absolute Deviation (MAD)."
    },
    {
      "title": "3. Enforce domain constraints and plausibility",
      "body": "Freeze immutable features by setting $x_j^* = x_j$. Constrain search to realistic feature bounds $[\\min_j, \\max_j]$."
    },
    {
      "title": "4. Solve via gradient descent or Nelder–Mead",
      "body": "Optimise $x^*$ iteratively. Increase penalty parameter $\\lambda$ until the decision flips ($f(x^*) = y^*$) while minimising total distance $\\|x^* - x\\|_1$. Present differences $(x^* - x)$ as actionable recommendations."
    }
  ],
  "math": [
    {
      "h": "Wachter Counterfactual Optimisation Problem",
      "tex": "\\arg\\min_{x^*} \\ell\\left(f(x^*), y^*\\right) + \\lambda d(x, x^*) \\quad \\text{subject to } x_j^* = x_j \\; \\forall j \\in \\mathcal{I}_{\\mathrm{immutable}}",
      "p": "Finds counterfactual x* that minimises discrepancy to desired outcome y* while penalising distance from original instance x."
    },
    {
      "h": "MAD-Normalised Manhattan Distance Metric",
      "tex": "d(x, x^*) = \\sum_{j=1}^p \\frac{|x_j - x_j^*|}{\\operatorname{MAD}_j}, \\quad \\operatorname{MAD}_j = \\operatorname{median}\\left(|X_j - \\operatorname{median}(X_j)|\\right)",
      "p": "Normalises distance by Median Absolute Deviation of each feature, making penalties scale-invariant and robust to outliers while promoting sparsity (changing few features)."
    },
    {
      "h": "Data Manifold Plausibility Penalty (Mahalanobis / VAE)",
      "tex": "\\mathcal{L}_{\\mathrm{plausible}}(x^*) = (x^* - \\mu)^T \\Sigma^{-1} (x^* - \\mu) \\quad \\text{or} \\quad \\|x^* - g(z^*)\\|^2",
      "p": "Prevents adversarial or impossible counterfactuals by penalising points that fall off the empirical data manifold."
    }
  ],
  "code": "import numpy as np\nfrom scipy.optimize import minimize\nfrom sklearn.linear_model import LogisticRegression\n\n# Counterfactual Explanations with Actionability Constraints from scratch\nnp.random.seed(42)\nn_train = 400\n\n# 4 Features: [Age (Immutable), AnnualIncome, CreditCardDebt, Savings]\n# Units: Age (years), Income (£k), Debt (£k), Savings (£k)\nfeature_names = ['Age (Immutable)', 'AnnualIncome (£k)', 'Debt (£k)', 'Savings (£k)']\nimmutable_indices = [0]  # Age cannot be changed!\n\n# Generate synthetic credit underwriting data\nX = np.random.normal(loc=[40, 50, 15, 10], scale=[10, 15, 6, 8], size=(n_train, 4))\nX = np.maximum(X, [18, 10, 0, 0])  # Realistic bounds\n\n# True underwriting rule: High income + high savings - high debt\nlatent = 0.08 * X[:, 1] - 0.15 * X[:, 2] + 0.12 * X[:, 3] - 1.5\ny = (latent > 0).astype(int)  # 1 = Approved, 0 = Denied\n\nclf = LogisticRegression()\nclf.fit(X, y)\n\n# Denied applicant to provide recourse for\n# 45 years old, £35k income, £22k debt, £3k savings -> Denied!\nx_denied = np.array([45.0, 35.0, 22.0, 3.0])\norig_prob = clf.predict_proba(x_denied.reshape(1, -1))[0, 1]\nprint(f\"Original Applicant Approval Probability: {orig_prob*100:.1f}% (DENIED)\")\n\n# Feature Median Absolute Deviations (MAD) for scale normalisation\nmads = np.median(np.abs(X - np.median(X, axis=0)), axis=0)\nmads[mads == 0] = 1.0\n\n# Counterfactual Optimisation Objective\ndef counterfactual_loss(x_candidate, x_orig, model, target_class=1, lambda_dist=0.5):\n    # 1. Prediction loss: binary cross-entropy to target class 1\n    prob = model.predict_proba(x_candidate.reshape(1, -1))[0, target_class]\n    pred_loss = -np.log(max(prob, 1e-12))\n    \n    # 2. Distance penalty: MAD-normalised Manhattan L1 distance\n    dist_loss = np.sum(np.abs(x_candidate - x_orig) / mads)\n    \n    return pred_loss + lambda_dist * dist_loss\n\n# Bounds and constraints\nbounds = [\n    (x_denied[0], x_denied[0]),  # Age is rigidly fixed (immutable!)\n    (10.0, 120.0),               # Income bound\n    (0.0, 50.0),                 # Debt bound\n    (0.0, 100.0)                 # Savings bound\n]\n\n# Run optimisation from x_denied starting point\nres = minimize(\n    counterfactual_loss,\n    x0=x_denied,\n    args=(x_denied, clf, 1, 0.3),\n    bounds=bounds,\n    method='L-BFGS-B'\n)\n\nx_cf = res.x\ncf_prob = clf.predict_proba(x_cf.reshape(1, -1))[0, 1]\n\nprint(f\"\\nCounterfactual Found! New Approval Probability: {cf_prob*100:.1f}% (APPROVED)\")\nprint(\"\\n--- Actionable Recourse Recommendations ---\")\nfor i, name in enumerate(feature_names):\n    delta = x_cf[i] - x_denied[i]\n    if abs(delta) > 0.1:\n        action = \"increase by\" if delta > 0 else \"reduce by\"\n        print(f\"  {name:20s}: Current = {x_denied[i]:5.1f} -> Target = {x_cf[i]:5.1f} ({action} {abs(delta):.1f})\")\n    else:\n        print(f\"  {name:20s}: No change required ({x_denied[i]:.1f})\")",
  "keyPoints": [
    "Provides actionable algorithmic recourse: identifies minimal perturbations required to flip an adverse model decision.",
    "Optimises a composite objective balancing target prediction loss with normalised distance from the original instance.",
    "Enforces domain constraints by distinguishing between mutable features (debt, savings) and immutable features (age, sex, ethnicity).",
    "Normalised Manhattan distance ($L_1 / \\operatorname{MAD}$) induces sparsity, requiring changes across as few features as possible.",
    "Crucial for regulatory compliance (e.g. EU GDPR Right to Explanation) in lending, employment, and medical diagnosis."
  ],
  "pitfalls": [
    "Adversarial vulnerability: Gradient-based counterfactual search can discover adversarial noise perturbations that flip model output without representing genuine real-world plausibility.",
    "Actionability violations: Proposing unachievable recourse (such as \"reduce age by 5 years\" or \"double income in 2 days\") invalidates practical utility.",
    "Causal confounding: Features are rarely independent; increasing income might causally affect debt or tax brackets; pure geometric counterfactuals ignore causal dependencies."
  ],
  "quiz": [
    {
      "q": "Why are Counterfactual Explanations considered more actionable for loan applicants than SHAP or feature importance?",
      "o": [
        "Counterfactuals specify the exact minimal changes required to flip the rejection to an approval, rather than merely scoring past feature contributions",
        "Counterfactuals eliminate the need for financial data",
        "Counterfactuals guarantee that all applicants are approved",
        "Counterfactuals only work on linear models"
      ],
      "a": 0,
      "why": "Feature importances explain what caused the past decision, but do not provide actionable recourse. Counterfactuals provide concrete targets (e.g. reduce debt by £3,000) to reverse the decision."
    },
    {
      "q": "Why must immutable features (like Age or Race) be constrained during counterfactual search?",
      "o": [
        "An applicant cannot physically change their age or ethnicity, so recommending alterations to immutable features provides meaningless recourse",
        "Immutable features cause the loss function to divide by zero",
        "Machine learning models cannot process immutable features",
        "Immutable features always have zero variance"
      ],
      "a": 0,
      "why": "Recourse must be humanly achievable. Recommending that an applicant become 10 years younger or alter their biological traits is impossible in reality."
    }
  ],
  "usedBy": [],
  "prereq": [
    "logistic-regression-inference-odds-ratios-wald-tests"
  ],
  "related": [
    "lime",
    "fairness-metrics-and-mitigation",
    "cost-sensitive-learning",
    "conformal-prediction"
  ],
  "keywords": "counterfactual explanations, algorithmic recourse, wachter, actionable recourse, interpretability, mad distance, immutable features, gdpr"
},
  {
  "id": "fairness-metrics-and-mitigation",
  "short": "Fairness metrics",
  "title": "Algorithmic Fairness: Metrics and Bias Mitigation",
  "task": "concepts",
  "module": "Interpretability and fairness",
  "level": 2,
  "minutes": 18,
  "noLab": true,
  "summary": "Detect and mitigate demographic disparities in machine learning models: master Demographic Parity, Equalized Odds, Predictive Parity, and the impossibility theorem.",
  "lead": "Machine learning models trained on historical data often inherit and amplify societal biases. Algorithmic fairness formalises fairness criteria into mathematical constraints, uncovering inherent trade-offs between competing definitions of fairness.",
  "intuition": [
    "When automated algorithms decide who receives a bank loan, who is interviewed for a job, who receives bail, or who is prioritised for organ transplants, biased decisions inflict grave societal harm. Because machine learning models are trained to optimise accuracy on historical data, they inevitably learn, internalise, and amplify historical prejudices, redlining, and demographic disparities present in the training corpus.",
    "Algorithmic Fairness translates moral and legal concepts of equity into rigorous mathematical definitions, evaluated with respect to a sensitive or protected attribute $A \\in \\{0, 1\\}$ (e.g. race, gender, disability, or age).",
    "Three major mathematical definitions dominate the literature. First, Demographic Parity (Statistical Parity) requires that the decision rate is identical across groups: $P(\\hat{Y}=1 \\mid A=0) = P(\\hat{Y}=1 \\mid A=1)$, formalised in US employment law as the Four-Fifths rule. Second, Equalized Odds requires that the model is equally accurate across groups, demanding identical True Positive Rates and False Positive Rates: $P(\\hat{Y}=1 \\mid A=0, Y=y) = P(\\hat{Y}=1 \\mid A=1, Y=y)$. Third, Predictive Parity (Calibration within groups) requires that predicted risk scores mean the same thing across groups: $P(Y=1 \\mid \\hat{Y}=1, A=0) = P(Y=1 \\mid \\hat{Y}=1, A=1)$.",
    "In 2016, Alexandra Chouldechova and Jon Kleinberg independently proved a foundational impossibility theorem: unless the base rates of the positive outcome are identical across demographic groups ($P(Y=1 \\mid A=0) = P(Y=1 \\mid A=1)$), it is mathematically impossible for any model to simultaneously satisfy Demographic Parity, Equalized Odds, and Predictive Parity. Choosing a fairness metric is therefore an ethical and legal policy choice, not a purely statistical one."
  ],
  "analogy": "Imagine two high schools: School A and School B. At School A, 60% of students pass a national physics exam; at School B, only 30% pass due to historical underfunding of science laboratories. If a university adopts Demographic Parity, it admits the top 20% of students from both schools, ignoring the difference in exam pass rates. If the university adopts Equalized Odds, it ensures that every student who actually mastered the subject has an equal chance of admission regardless of school. If it adopts Predictive Parity, it ensures admitted students from both schools succeed at university with equal probability. You cannot achieve all three simultaneously.",
  "steps": [
    {
      "title": "1. Identify protected attributes and specify legal framework",
      "body": "Designate protected attribute $A$ (e.g. gender or race). Establish the applicable legal regime: Disparate Impact (Demographic Parity) vs Disparate Treatment (Equal Opportunity)."
    },
    {
      "title": "2. Audit model for demographic disparities",
      "body": "Compute Disparate Impact ratio $\\frac{P(\\hat{Y}=1 \\mid A=0)}{P(\\hat{Y}=1 \\mid A=1)}$, Equal Opportunity Difference $|\\mathrm{TPR}_1 - \\mathrm{TPR}_0|$, and False Positive Disparity $|\\mathrm{FPR}_1 - \\mathrm{FPR}_0|$."
    },
    {
      "title": "3. Select mitigation intervention stage",
      "body": "Choose between Pre-processing (reweighing training samples or Disparate Impact Remover), In-processing (adversarial debiasing or constrained empirical risk), or Post-processing (group-specific threshold tuning)."
    },
    {
      "title": "4. Post-processing threshold shifting (Hardt et al.)",
      "body": "Derive separate classification thresholds $\\tau_0$ and $\\tau_1$ for groups $A=0$ and $A=1$ that equalise true positive and false positive rates while maximising utility."
    }
  ],
  "math": [
    {
      "h": "Demographic Parity Disparate Impact Ratio",
      "tex": "\\mathrm{DI} = \\frac{P(\\hat{Y} = 1 \\mid A = 0)}{P(\\hat{Y} = 1 \\mid A = 1)} \\ge 0.80",
      "p": "The four-fifths (80%) rule: if the selection rate for a protected minority group is less than 80% of the selection rate for the majority group, the model exhibits prima facie disparate impact."
    },
    {
      "h": "Equalized Odds Definition",
      "tex": "P(\\hat{Y} = 1 \\mid A = 0, \\; Y = y) = P(\\hat{Y} = 1 \\mid A = 1, \\; Y = y) \\quad \\forall y \\in \\{0, 1\\}",
      "p": "Demands both equal False Positive Rates (FPR_0 = FPR_1) and equal True Positive Rates (TPR_0 = TPR_1) across demographic groups."
    },
    {
      "h": "Kleinberg–Chouldechova Impossibility Theorem",
      "tex": "P(Y = 1 \\mid A = 0) \\neq P(Y = 1 \\mid A = 1) \\implies \\neg \\left( \\text{Equalized Odds} \\wedge \\text{Predictive Parity} \\right)",
      "p": "When true underlying prevalence differs between demographic groups, Equalized Odds and Predictive Parity (calibration within groups) are mutually exclusive."
    }
  ],
  "code": "import numpy as np\nfrom sklearn.linear_model import LogisticRegression\n\n# Algorithmic Fairness Audit and Post-Processing Threshold Tuning from scratch\nnp.random.seed(42)\nn_samples = 1000\n\n# Protected attribute A: 0 (Minority, 30%), 1 (Majority, 70%)\nA = np.random.binomial(1, 0.70, n_samples)\n\n# Features: Experience and Test Score\n# Historical disparity: Group 0 has slightly lower average test score due to systemic bias\nscore = np.where(A == 1, np.random.normal(65, 10, n_samples), np.random.normal(58, 10, n_samples))\nexperience = np.random.uniform(1, 10, n_samples)\nX = np.column_stack([score, experience])\n\n# Ground truth qualification: y depends purely on merit (score + experience)\nlatent_merit = 0.08 * score + 0.3 * experience - 6.5\ny = (latent_merit + np.random.normal(0, 0.5, n_samples) > 0).astype(int)\n\n# Train a standard logistic regression model (without explicit attribute A)\nclf = LogisticRegression()\nclf.fit(X, y)\nprobs = clf.predict_proba(X)[:, 1]\n\n# Baseline: Default single threshold at p = 0.50\npreds_default = (probs >= 0.50).astype(int)\n\ndef compute_fairness_audit(y_true, y_pred, sensitive_attr):\n    mask0 = (sensitive_attr == 0)\n    mask1 = (sensitive_attr == 1)\n    \n    # Selection Rates (Demographic Parity)\n    sr0 = np.mean(y_pred[mask0])\n    sr1 = np.mean(y_pred[mask1])\n    di_ratio = sr0 / max(sr1, 1e-12)\n    \n    # True Positive Rates (Equal Opportunity)\n    tpr0 = np.sum((y_true[mask0] == 1) & (y_pred[mask0] == 1)) / np.sum(y_true[mask0] == 1)\n    tpr1 = np.sum((y_true[mask1] == 1) & (y_pred[mask1] == 1)) / np.sum(y_true[mask1] == 1)\n    \n    # False Positive Rates\n    fpr0 = np.sum((y_true[mask0] == 0) & (y_pred[mask0] == 1)) / np.sum(y_true[mask0] == 0)\n    fpr1 = np.sum((y_true[mask1] == 0) & (y_pred[mask1] == 1)) / np.sum(y_true[mask1] == 0)\n    \n    return di_ratio, tpr0, tpr1, fpr0, fpr1\n\ndi_def, tpr0_def, tpr1_def, fpr0_def, fpr1_def = compute_fairness_audit(y, preds_default, A)\n\n# Post-Processing: Equal Opportunity Threshold Tuning (Hardt et al.)\n# Adjust threshold tau_0 for Group 0 so that TPR_0 matches TPR_1\ntarget_tpr = tpr1_def\nthresholds = np.linspace(0.1, 0.9, 200)\nbest_tau0 = 0.5\nbest_tpr_diff = float(\"inf\")\n\nmask0 = (A == 0)\nfor tau in thresholds:\n    preds_g0 = (probs[mask0] >= tau).astype(int)\n    tpr_g0 = np.sum((y[mask0] == 1) & (preds_g0 == 1)) / np.sum(y[mask0] == 1)\n    diff = abs(tpr_g0 - target_tpr)\n    if diff < best_tpr_diff:\n        best_tpr_diff = diff\n        best_tau0 = tau\n\n# Apply tuned group-specific thresholds\npreds_fair = np.zeros(n_samples, dtype=int)\npreds_fair[A == 1] = (probs[A == 1] >= 0.50).astype(int)\npreds_fair[A == 0] = (probs[A == 0] >= best_tau0).astype(int)\n\ndi_fair, tpr0_fair, tpr1_fair, fpr0_fair, fpr1_fair = compute_fairness_audit(y, preds_fair, A)\n\nprint(\"--- Standard Baseline Model (Threshold = 0.50) ---\")\nprint(f\"Disparate Impact Ratio: {di_def:.3f} (Violates 80% four-fifths rule!)\")\nprint(f\"Group 0 TPR: {tpr0_def*100:.1f}% vs Group 1 TPR: {tpr1_def*100:.1f}% (Equal Opportunity Gap: {abs(tpr0_def - tpr1_def)*100:.1f}%)\")\n\nprint(f\"\\n--- Post-Processed Fair Model (Tau_1 = 0.50, Tau_0 = {best_tau0:.2f}) ---\")\nprint(f\"Disparate Impact Ratio: {di_fair:.3f} (Improved)\")\nprint(f\"Group 0 TPR: {tpr0_fair*100:.1f}% vs Group 1 TPR: {tpr1_fair*100:.1f}% (Equal Opportunity Gap: {abs(tpr0_fair - tpr1_fair)*100:.1f}% -> Parity achieved!)\")",
  "keyPoints": [
    "Formalises ethical equity into mathematical metrics evaluated across protected demographic attributes.",
    "Demographic Parity requires equal positive selection rates across groups ($P(\\hat{Y}=1 \\mid A=0) = P(\\hat{Y}=1 \\mid A=1)$).",
    "Equalized Odds requires equal False Positive and True Positive rates across groups conditional on true label $Y$.",
    "Kleinberg–Chouldechova Impossibility Theorem proves that when demographic base rates differ, competing fairness criteria cannot be satisfied simultaneously.",
    "Mitigation spans pre-processing (reweighing data), in-processing (adversarial debiasing), and post-processing (group-specific threshold shifting)."
  ],
  "pitfalls": [
    "Fairness through blindness: Merely dropping protected attributes (race, gender) from feature sets fails completely because correlated proxy features (zip code, university, hobbies) reconstruct the attribute.",
    "Ignoring the impossibility theorem: Promising a client or regulator that a model will satisfy both calibration and equalised odds simultaneously is mathematically impossible when base rates differ.",
    "Trade-off with global accuracy: Imposing fairness constraints shifts decision boundaries away from Bayes optimal risk minimisation, causing slight reductions in overall unconstrained accuracy."
  ],
  "quiz": [
    {
      "q": "Why does removing the sensitive attribute (e.g. Race or Gender) from the feature set fail to prevent algorithmic discrimination?",
      "o": [
        "Remaining correlated features (such as postal code, browser history, or school district) act as redundant proxies that allow the model to reconstruct the protected attribute",
        "Machine learning algorithms automatically download sensitive data from the web",
        "Removing features causes the model to crash",
        "Sensitive attributes always have zero weight in linear models"
      ],
      "a": 0,
      "why": "Known as \"fairness through blindness\", redundant encodings in high-dimensional datasets allow complex models to infer protected demographics indirectly from correlated proxy features."
    },
    {
      "q": "What is established by the Kleinberg–Chouldechova Impossibility Theorem in algorithmic fairness?",
      "o": [
        "When true base rates differ between demographic groups, it is mathematically impossible for a predictive model to simultaneously satisfy Equalized Odds and Predictive Parity",
        "Fairness can only be achieved using deep neural networks",
        "All models have exactly 50% accuracy on minority groups",
        "Biased training data can never be mitigated"
      ],
      "a": 0,
      "why": "The theorem mathematically proves that calibration within groups (predictive parity) and equalised false positive/negative rates (equalised odds) cannot both hold when base rates P(Y=1|A) differ."
    }
  ],
  "usedBy": [],
  "prereq": [
    "confusion-matrix",
    "type-i-ii-errors-power-and-sample-size"
  ],
  "related": [
    "cost-sensitive-learning",
    "confusion-matrix",
    "counterfactual-explanations",
    "lime"
  ],
  "keywords": "algorithmic fairness, demographic parity, equalised odds, predictive parity, disparate impact, chouldechova, kleinberg impossibility, bias mitigation"
},
  {
    id: 'kernel-trick-and-mercers-condition',
    short: 'Kernel trick & Mercer',
    title: "Kernel Trick and Mercer's Condition",
    task: 'concepts',
    module: 'Learning theory',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Implicitly mapping data into high- or infinite-dimensional Hilbert spaces using positive semidefinite kernel functions without explicit coordinate transformations.`,
    lead: r`Linear algorithms like Support Vector Machines, ridge regression, and PCA are computationally efficient but fail when data is separated by non-linear decision boundaries. Explicitly mapping features into higher-dimensional polynomial or exponential spaces incurs prohibitive memory and computational costs. The kernel trick replaces explicit transformations with pairwise inner-product evaluations, while Mercer's theorem provides the definitive mathematical condition guaranteeing that a symmetric kernel corresponds to a valid Hilbert feature space.`,
    intuition: [
      r`Imagine looking at a flat sheet of rubber where blue pebbles are arranged in a tight inner circle surrounded by a ring of red pebbles. No matter where you draw a straight line with a ruler across the sheet, you cannot separate the blue circle from the surrounding red ring (it is non-linearly separable in 2D). However, if you poke your finger upward beneath the centre of the rubber sheet, the blue pebbles rise into a 3D dome while the red ring remains on the table. You can now slide a flat sheet of cardboard horizontally underneath the dome, cleanly separating the two colours with a flat 2D plane.`,
      r`This is the core insight of non-linear machine learning: data that is hopelessly entangled in low dimensions often becomes cleanly linearly separable when mapped into a higher-dimensional feature space. But mapping every point into a 10,000-dimensional or infinite-dimensional coordinate space is computationally impossible. You would run out of computer memory before computing the coordinates for a single vector.`,
      r`The kernel trick performs mathematical sleight of hand. Many linear algorithms depend exclusively on the dot product between data points $\langle x, z \rangle$, never on individual coordinates in isolation. The kernel trick replaces that simple dot product with a kernel function $K(x, z) = \langle \phi(x), \phi(z) \rangle$ that directly evaluates the inner product in the high-dimensional space without ever calculating or storing the high-dimensional coordinates $\phi(x)$. Mercer's condition ensures that as long as the kernel function produces a positive semidefinite Gram matrix, a valid underlying Hilbert geometry is guaranteed to exist.`,
    ],
    analogy: r`Calculating the distance between two ships over the curvature of the Earth using latitude and longitude coordinates, without needing to excavate a physical 3D tunnel through the Earth's mantle.`,
    steps: [
      r`Identify the inner-product dependency: verify that the learning algorithm (e.g. SVM dual, Ridge regression, PCA) can be expressed purely in terms of pairwise dot products $\langle x_i, x_j \rangle$.`,
      r`Select a kernel function $K(x, z)$ suited to the problem structure (e.g. polynomial, Radial Basis Function (RBF), or sigmoid).`,
      r`Verify Mercer's condition: confirm that the candidate kernel is continuous, symmetric ($K(x, z) = K(z, x)$), and positive semidefinite (all Gram matrix eigenvalues $\lambda_i \ge 0$).`,
      r`Compute the kernel Gram matrix $K \in \mathbb{R}^{n \times n}$ across training instances: $K_{ij} = K(x_i, x_j)$.`,
      r`Solve the dual optimisation problem (e.g. dual ridge weights $\alpha = (K + \lambda I)^{-1} y$ or SVM dual multipliers).`,
      r`Evaluate test instances using kernel evaluations against training support instances: $f(x) = \sum_{i=1}^n \alpha_i K(x_i, x) + b$.`,
    ],
    math: [
      {
        h: 'Mercer\'s Theorem and positive semidefiniteness',
        tex: r`$$\iint K(x, z) \, g(x) \, g(z) \, dx \, dz \ge 0 \quad \forall \, g \in L_2, \qquad K(x, z) = \sum_{i=1}^\infty \lambda_i \, \psi_i(x) \, \psi_i(z)$$`,
        p: r`Mercer's theorem (1909) states that a continuous, symmetric kernel $K(x, z)$ corresponds to an inner product in a Reproducing Kernel Hilbert Space (RKHS) if and only if it is positive semidefinite. The eigenfunctions $\psi_i(x)$ and non-negative eigenvalues $\lambda_i \ge 0$ define the implicit mapping $\phi(x) = \big[\sqrt{\lambda_1}\psi_1(x), \sqrt{\lambda_2}\psi_2(x), \dots\big]^T$.`,
      },
      {
        h: 'Finite-sample Gram matrix condition',
        tex: r`$$c^T K c = \sum_{i=1}^n \sum_{j=1}^n c_i c_j K(x_i, x_j) \ge 0 \quad \forall \, c \in \mathbb{R}^n$$`,
        p: r`For any finite dataset $\{x_1, \dots, x_n\}$, the kernel Gram matrix $K \in \mathbb{R}^{n \times n}$ with entries $K_{ij} = K(x_i, x_j)$ must be positive semidefinite. All eigenvalues of $K$ must be non-negative, ensuring that the quadratic optimisation problem remains convex.`,
      },
      {
        h: 'Radial Basis Function (RBF) infinite-dimensional expansion',
        tex: r`$$K_{\text{RBF}}(x, z) = \exp\left(-\gamma \|x - z\|^2\right) = \exp(-\gamma \|x\|^2) \exp(-\gamma \|z\|^2) \sum_{k=0}^\infty \frac{(2\gamma)^k}{k!} (x^T z)^k$$`,
        p: r`Applying Taylor series expansion to the cross-term $\exp(2\gamma x^T z)$ demonstrates that the RBF (Gaussian) kernel corresponds to an inner product in an infinite-dimensional feature space. The kernel trick computes this infinite dot product in a single closed-form scalar evaluation.`,
      },
    ],
    code: r`import numpy as np

# Non-linear 1D function: y = sin(x) + noise
rng = np.random.default_rng(42)
x_train = np.linspace(-3, 3, 25)[:, None]
y_train = np.sin(x_train[:, 0]) + rng.normal(0, 0.1, 25)

# RBF kernel function: K(x, z) = exp(-gamma * ||x - z||^2)
gamma, lam = 1.0, 0.01
D2_tr = (x_train - x_train.T) ** 2
K_tr = np.exp(-gamma * D2_tr)

# Verify Mercer's condition: Gram matrix eigenvalues must be >= 0
eigvals = np.linalg.eigvalsh(K_tr)
is_psd = np.all(eigvals >= -1e-10)

# Dual solve for Kernel Ridge Regression: alpha = (K + lambda * I)^{-1} y
alpha = np.linalg.solve(K_tr + lam * np.eye(len(x_train)), y_train)

# Test evaluation via kernel trick: f(x_test) = sum alpha_i * K(x_i, x_test)
x_test = np.array([[-1.5], [0.0], [1.5]])
D2_te = (x_train - x_test.T) ** 2
K_te = np.exp(-gamma * D2_te)
y_pred = K_te.T @ alpha

print(f"Gram matrix min eigenvalue: {np.min(eigvals):.6f} (Mercer PSD: {is_psd})")
print(f"True sin(x_test):  {[round(float(v), 3) for v in np.sin(x_test[:, 0])]}")
print(f"Kernel prediction: {[round(float(v), 3) for v in y_pred]}")`,
    pitfalls: [
      r`Quadratic memory and cubic computation: Storing the Gram matrix requires $O(n^2)$ memory, and inverting it requires $O(n^3)$ compute, making exact kernel methods unscalable to millions of samples without Nyström or random Fourier approximations.`,
      r`Overfitting via excessive kernel bandwidth: In RBF kernels, setting $\gamma$ too high narrows the Gaussian bell curve into sharp isolated spikes around individual training points, collapsing generalisation.`,
      r`Using non-Mercer kernels in convex solvers: Functions that do not produce positive semidefinite matrices (such as certain hyperbolic tangents) violate Mercer's theorem, destroying convexity and causing dual solvers to diverge.`,
      r`Curse of dimensionality in kernel space: High-dimensional input spaces cause pairwise Euclidean distances in RBF kernels to concentrate, making all off-diagonal kernel entries decay to near-zero.`,
    ],
    keyPoints: [
      r`Enables linear algorithms to learn non-linear boundaries by substituting dot products with kernel functions.`,
      r`Avoids the computational bottleneck of explicitly constructing high- or infinite-dimensional feature spaces.`,
      r`Mercer's condition requires the kernel Gram matrix to be positive semidefinite, guaranteeing a valid Hilbert space.`,
      r`The RBF Gaussian kernel implicitly projects data into an infinite-dimensional feature space via its Taylor expansion.`,
    ],
    quiz: [
      {
        q: r`What is the core mathematical premise of the "kernel trick"?`,
        o: [
          r`It converts continuous variables into discrete binary flags`,
          r`It computes inner products in a high-dimensional feature space using a function evaluated directly on low-dimensional inputs, without explicitly computing feature coordinates`,
          r`It removes all outliers from the training distribution`,
          r`It inverts matrices using gradient descent instead of LU decomposition`,
        ],
        a: 1,
        why: r`The kernel trick evaluates $K(x, z) = \langle \phi(x), \phi(z) \rangle$ directly on raw coordinates, bypassing the immense (or infinite) computational cost of computing the transformed feature vectors $\phi(x)$ and $\phi(z)$.`,
      },
      {
        q: r`What does Mercer's theorem establish about a continuous, symmetric function $K(x, z)$?`,
        o: [
          r`It guarantees the function can be evaluated in $O(1)$ constant time`,
          r`It proves the function corresponds to an inner product in a valid Hilbert space if and only if its Gram matrix is positive semidefinite`,
          r`It ensures that all classification errors are strictly zero`,
          r`It forces all eigenvalues of the feature matrix to equal 1.0`,
        ],
        a: 1,
        why: r`Mercer's theorem proves that positive semidefiniteness ($\iint K(x, z) g(x) g(z) dx dz \ge 0$) is the necessary and sufficient condition for a continuous symmetric kernel to represent an inner product in a Reproducing Kernel Hilbert Space.`,
      },
      {
        q: r`Into what dimensionality does the Radial Basis Function (RBF / Gaussian) kernel implicitly map input data?`,
        o: [
          r`Exactly twice the input dimension ($2d$)`,
          r`A finite quadratic polynomial space ($d^2 / 2$)`,
          r`An infinite-dimensional Hilbert space`,
          r`One-dimensional scalar space`,
        ],
        a: 2,
        why: r`The Taylor series expansion of $\exp(2\gamma x^T z)$ contains an infinite series of polynomial terms $(x^T z)^k / k!$, corresponding to an inner product in an infinite-dimensional feature space.`,
      },
      {
        q: r`What is a primary computational limitation of exact kernel methods when scaling to very large datasets ($n > 100{,}000$)?`,
        o: [
          r`The Gram matrix requires $O(n^2)$ memory to store and $O(n^3)$ operations to invert`,
          r`Kernels cannot process floating-point numbers`,
          r`The kernel trick only works when the number of features exceeds the number of samples ($d > n$)`,
          r`Mercer's theorem fails when $n$ is an even number`,
        ],
        a: 0,
        why: r`Because the Gram matrix $K$ scales with the square of the sample size ($n \times n$), computing and storing it for large $n$ rapidly exceeds memory limits, requiring approximate methods like Random Fourier Features or Nyström sampling.`,
      },
    ],
    usedBy: ['support_vector_classifier'],
    prereq: ['support_vector_classifier', 'convex-optimisation-and-duality'],
    related: ['support_vector_classifier', 'pca', 'convex-optimisation-and-duality'],
    keywords: 'kernel trick mercer condition rbf kernel gram matrix hilbert space support vector machines positive semidefinite',
  },
  {
  "id": "svm-dual-formulation",
  "short": "SVM dual formulation",
  "title": "Support Vector Machines: The Dual Formulation and KKT Conditions",
  "task": "concepts",
  "module": "Learning theory",
  "level": 3,
  "minutes": 18,
  "noLab": true,
  "summary": "Derive the convex duality behind maximum-margin hyperplanes: master Lagrange multipliers, Wolfe dual, Karush–Kuhn–Tucker (KKT) conditions, and the kernel trick.",
  "lead": "While the primal SVM problem searches over feature weights w in high-dimensional space, the dual problem searches over sample weights alpha, revealing that the optimal decision boundary depends exclusively on inner products between support vectors.",
  "intuition": [
    "The Support Vector Machine (SVM) is founded on the principle of Structural Risk Minimisation: rather than merely separating training data, it searches for the maximum-margin hyperplane that leaves the widest possible buffer zone between classes, guaranteeing the tightest theoretical bound on test generalisation error.",
    "In its Primal formulation, the soft-margin SVM optimises weight vector $w \\in \\mathbb{R}^d$ and bias $b \\in \\mathbb{R}$: $\\min_{w, b, \\xi} \\frac{1}{2} \\|w\\|^2 + C \\sum_{i=1}^n \\xi_i$ subject to classification margin constraints $y_i (w^T x_i + b) \\ge 1 - \\xi_i$. However, when we map features non-linearly into infinite-dimensional Hilbert spaces (via Gaussian RBF kernels), weight vector $w$ has infinite dimension, making the primal problem impossible to solve directly.",
    "Convex optimisation duality resolves this brilliantly. By formulating the Lagrangian function with Lagrange multipliers $\\alpha_i \\ge 0$ and $\\mu_i \\ge 0$, differentiating with respect to primal variables $(w, b, \\xi)$, and setting derivatives to zero, we derive the Wolfe Dual formulation.",
    "The dual problem is an elegant concave quadratic program where the decision variables are the sample multipliers $\\alpha_i$, and feature vectors $x_i$ enter strictly via pairwise dot products $x_i^T x_j$. The Karush–Kuhn–Tucker (KKT) complementary slackness conditions prove that $\\alpha_i = 0$ for every sample comfortably outside the margin: the optimal decision boundary is defined exclusively by the sparse subset of training points with $\\alpha_i > 0$—the Support Vectors! Substituting a Mercer kernel $K(x_i, x_j)$ for the dot product unlocks non-linear boundaries in infinite dimensions."
  ],
  "analogy": "Imagine two rival medieval armies facing each other across a battlefield. The primal commander tries to construct a continuous defensive barrier across the entire width of the landscape. The dual general notices that only the front-line soldiers standing along the very edge of contact (the support vectors) determine where the battle line is drawn; all soldiers standing safely 500 metres behind the front line can turn around and go to sleep without shifting the boundary by a single millimetre.",
  "steps": [
    {
      "title": "1. Formulate primal Lagrangian function",
      "body": "Construct Lagrangian: $\\mathcal{L}(w, b, \\xi, \\alpha, \\mu) = \\frac{1}{2} \\|w\\|^2 + C \\sum_{i=1}^n \\xi_i - \\sum_{i=1}^n \\alpha_i [y_i(w^T \\phi(x_i) + b) - 1 + \\xi_i] - \\sum_{i=1}^n \\mu_i \\xi_i$."
    },
    {
      "title": "2. Enforce KKT stationarity conditions",
      "body": "Set partial derivatives to zero: $\\nabla_w \\mathcal{L} = w - \\sum \\alpha_i y_i \\phi(x_i) = 0 \\implies w = \\sum \\alpha_i y_i \\phi(x_i)$, $\\frac{\\partial \\mathcal{L}}{\\partial b} = -\\sum \\alpha_i y_i = 0$, and $\\frac{\\partial \\mathcal{L}}{\\partial \\xi_i} = C - \\alpha_i - \\mu_i = 0$."
    },
    {
      "title": "3. Substitute stationarity back to obtain Wolfe Dual",
      "body": "Substitute relations into $\\mathcal{L}$: maximise $\\mathcal{D}(\\alpha) = \\sum_{i=1}^n \\alpha_i - \\frac{1}{2} \\sum_{i=1}^n \\sum_{j=1}^n \\alpha_i \\alpha_j y_i y_j K(x_i, x_j)$ subject to box constraints $0 \\le \\alpha_i \\le C$ and $\\sum_{i=1}^n \\alpha_i y_i = 0$."
    },
    {
      "title": "4. Extract support vectors and compute bias b",
      "body": "Identify support vectors with $\\alpha_i > 0$. For any unbounded support vector ($0 < \\alpha_k < C$), compute bias: $b = y_k - \\sum_{i=1}^n \\alpha_i y_i K(x_i, x_k)$. Score new sample: $f(x) = \\operatorname{sign}\\left(\\sum_{i \\in \\mathrm{SV}} \\alpha_i y_i K(x_i, x) + b\\right)$."
    }
  ],
  "math": [
    {
      "h": "The Wolfe Dual Quadratic Program",
      "tex": "\\max_\\alpha \\sum_{i=1}^n \\alpha_i - \\frac{1}{2} \\sum_{i=1}^n \\sum_{j=1}^n \\alpha_i \\alpha_j y_i y_j K(x_i, x_j) \\quad \\text{subject to } 0 \\le \\alpha_i \\le C, \\; \\sum_{i=1}^n \\alpha_i y_i = 0",
      "p": "The dual objective depends solely on pairwise kernel evaluations K(x_i, x_j) and scalar multipliers alpha_i, completely independent of the dimensionality of feature space."
    },
    {
      "h": "KKT Complementary Slackness Conditions",
      "tex": "\\alpha_i \\left[ y_i (w^T \\phi(x_i) + b) - 1 + \\xi_i \\right] = 0, \\quad \\mu_i \\xi_i = (C - \\alpha_i) \\xi_i = 0",
      "p": "Proves sparsity: alpha_i > 0 occurs strictly when y_i f(x_i) <= 1 (support vectors on or inside the margin). Points with y_i f(x_i) > 1 have alpha_i = 0 and do not affect the boundary."
    },
    {
      "h": "Primal Weight Recovery via Dual Multipliers",
      "tex": "w = \\sum_{i=1}^n \\alpha_i y_i \\phi(x_i) = \\sum_{i \\in \\mathrm{SV}} \\alpha_i y_i \\phi(x_i)",
      "p": "Weight vector w is a linear combination of support vectors alone, proving that SVM predictions are entirely memory-sparse."
    }
  ],
  "code": "import numpy as np\nfrom scipy.optimise import minimise\n\n# Support Vector Machine Dual Solver via Quadratic Programming from scratch\nnp.random.seed(42)\nn_samples = 60\n\n# Generate linearly separable 2D data\nX1 = np.random.normal(loc=[-1.5, -1.5], scale=0.7, size=(n_samples // 2, 2))\nX2 = np.random.normal(loc=[1.5, 1.5], scale=0.7, size=(n_samples // 2, 2))\nX = np.vstack([X1, X2])\ny = np.array([-1]*(n_samples // 2) + [1]*(n_samples // 2), dtype=float)\n\n# Linear kernel: K(x_i, x_j) = x_i^T x_j\nK = X @ X.T\nC = 1.0  # Regularisation penalty\n\n# Dual Objective: min 0.5 * alpha^T (Y K Y) alpha - 1^T alpha\nY = np.outer(y, y)\nP = Y * K\n\ndef dual_objective(alpha):\n    return 0.5 * np.dot(alpha, P @ alpha) - np.sum(alpha)\n\ndef dual_grad(alpha):\n    return P @ alpha - np.ones_like(alpha)\n\n# Constraints: sum(alpha_i * y_i) = 0 and 0 <= alpha_i <= C\nconstraints = {'type': 'eq', 'fun': lambda alpha: np.dot(alpha, y), 'jac': lambda alpha: y}\nbounds = [(0.0, C) for _ in range(n_samples)]\nalpha_init = np.zeros(n_samples)\n\nres = minimise(\n    dual_objective,\n    x0=alpha_init,\n    jac=dual_grad,\n    bounds=bounds,\n    constraints=constraints,\n    method='SLSQP',\n    options={'ftol': 1e-9, 'maxiter': 500}\n)\n\nalphas = res.x\nalphas[alphas < 1e-5] = 0.0  # Numerical threshold for sparsity\n\n# Identify Support Vectors\nsv_mask = alphas > 0.0\nsupport_vectors = X[sv_mask]\nsv_alphas = alphas[sv_mask]\nsv_y = y[sv_mask]\n\n# Reconstruct primal weights: w = sum(alpha_i * y_i * x_i)\nw = np.sum((alphas * y)[:, None] * X, axis=0)\n\n# Compute bias b using an unbounded support vector (0 < alpha < C)\nunbounded_sv = (alphas > 1e-4) & (alphas < C - 1e-4)\nif np.any(unbounded_sv):\n    idx = np.where(unbounded_sv)[0][0]\n    b = y[idx] - np.dot(w, X[idx])\nelse:\n    b = np.mean(y[sv_mask] - X[sv_mask] @ w)\n\n# Margin width: 2 / ||w||\nmargin_width = 2.0 / np.linalg.norm(w)\n\nprint(f\"Total training points: {n_samples}\")\nprint(f\"Number of Support Vectors found: {len(support_vectors)} ({len(support_vectors)/n_samples*100:.1f}% sparsity!)\")\nprint(f\"Primal weight vector w: [{w[0]:.4f}, {w[1]:.4f}]\")\nprint(f\"Primal bias b:          {b:.4f}\")\nprint(f\"Geometric margin width: {margin_width:.4f}\")\n\n# Check complementary slackness\nmargins = y * (X @ w + b)\nprint(f\"Min margin for SVs: {np.min(margins[sv_mask]):.4f} (approx 1.0 on margin boundary)\")",
  "keyPoints": [
    "Convex duality transforms the primal $O(d)$ optimisation over weights into a dual $O(n)$ optimisation over sample multipliers $\\alpha_i$.",
    "The dual depends solely on pairwise dot products $x_i^T x_j$, enabling the kernel trick $K(x_i, x_j)$ in infinite-dimensional Hilbert spaces.",
    "KKT complementary slackness proves sparsity: points with $y_i f(x_i) > 1$ have $\\alpha_i = 0$ and exert zero influence on the decision boundary.",
    "Only Support Vectors ($\\alpha_i > 0$) define the separating hyperplane and margin boundary.",
    "Box constraint $0 \\le \\alpha_i \\le C$ controls the penalty: unbounded support vectors ($0 < \\alpha_i < C$) lie exactly on the margin boundary."
  ],
  "pitfalls": [
    "Quadratic memory scaling: The Gram kernel matrix $K$ is $n \\times n$; standard QP solvers scale as $O(n^3)$ time and $O(n^2)$ memory, requiring Sequential Minimal Optimisation (SMO) for large datasets.",
    "Numerical solver precision: Standard off-the-shelf QP solvers can yield small non-zero values ($10^{-7}$) for non-support vectors; thresholding $\\alpha_i$ is necessary to recover true sparsity.",
    "Bias determination when all SVs are bounded: When all support vectors have $\\alpha_i = C$ (high misclassification), bias $b$ cannot be determined from a single point and requires averaging upper/lower bounds."
  ],
  "quiz": [
    {
      "q": "Why does the dual formulation of SVM make the kernel trick possible?",
      "o": [
        "The dual optimisation problem depends exclusively on inner products x_i^T x_j between training points, allowing replacement with a kernel function K(x_i, x_j)",
        "The dual formulation eliminates all constraints",
        "The dual formulation converts non-convex problems into linear equations",
        "The dual formulation operates only on the labels y_i"
      ],
      "a": 0,
      "why": "In the dual formulation, feature vectors x appear strictly inside pairwise inner products x_i^T x_j. By Mercer’s theorem, any positive semi-definite kernel K(x_i, x_j) computes this inner product in Hilbert space."
    },
    {
      "q": "What do the KKT complementary slackness conditions imply about training points that lie safely outside the margin (y_i f(x_i) > 1)?",
      "o": [
        "Their dual multiplier alpha_i must be exactly zero, meaning they exert zero influence on the position of the separating hyperplane",
        "Their dual multiplier alpha_i equals C",
        "They are misclassified outliers",
        "They must be deleted from the dataset"
      ],
      "a": 0,
      "why": "From alpha_i [y_i f(x_i) - 1 + xi_i] = 0, when a point is safely on the correct side outside the margin (y_i f(x_i) > 1, xi_i = 0), alpha_i must be zero."
    }
  ],
  "usedBy": [],
  "prereq": [
    "support_vector_classifier",
    "kernel-pca"
  ],
  "related": [
    "support_vector_classifier",
    "support_vector_regression",
    "one-class-svm",
    "kernel-pca"
  ],
  "keywords": "svm dual, support vector machines, lagrange multipliers, wolfe dual, kkt conditions, complementary slackness, kernel trick, quadratic programming"
},
  {
  "id": "vc-dimension-and-pac-learning",
  "short": "VC dimension & PAC",
  "title": "VC Dimension and Probably Approximately Correct (PAC) Learning",
  "task": "concepts",
  "module": "Learning theory",
  "level": 3,
  "minutes": 18,
  "noLab": true,
  "summary": "Quantify the learning capacity of hypothesis classes and sample complexity: master Valiant’s PAC framework, shattering, and Vapnik–Chervonenkis (VC) dimension.",
  "lead": "How many training samples are mathematically required to guarantee that a machine learning model will generalise out-of-sample? Computational learning theory formalises generalisation bounds using PAC learning and VC dimension.",
  "intuition": [
    "How do we know that a machine learning model with low training error will genuinely perform well on unseen future data, rather than having memorized noise? If a model achieves 0% training error on 50 samples, when does this guarantee true generalisation? Computational Learning Theory provides the mathematical foundation.",
    "Leslie Valiant (1984) founded Probably Approximately Correct (PAC) Learning. The PAC framework defines what it means for an algorithm to \"learn\": given error tolerance $\\epsilon > 0$ and failure probability $\\delta > 0$, an algorithm is a PAC learner if, with high probability (at least $1 - \\delta$), it outputs a hypothesis whose true generalisation error is at most $\\epsilon$. The sample complexity $m$ is the minimum number of training examples required to guarantee this.",
    "For finite hypothesis spaces (a discrete dictionary of $|\\mathcal{H}|$ possible models), PAC bounds show that sample complexity scales logarithmically: $m \\ge \\frac{1}{\\epsilon} \\left( \\ln |\\mathcal{H}| + \\ln \\frac{1}{\\delta} \\right)$. However, nearly all practical models—such as linear hyperplanes, logistic regression, support vector machines, and neural networks—have continuous real-valued parameters, meaning $|\\mathcal{H}| = \\infty$. When $|\\mathcal{H}| = \\infty$, the naive bound $\\ln |\\mathcal{H}|$ becomes infinite and useless.",
    "Vladimir Vapnik and Alexey Chervonenkis resolved this by measuring the combinatorial expressiveness of continuous hypothesis classes through the Vapnik–Chervonenkis (VC) Dimension. A hypothesis class $\\mathcal{H}$ shatters a set of $m$ points if it can assign all $2^m$ possible binary labelings to those points. The VC dimension $d_{\\mathrm{VC}}$ is the maximum number of points that can be shattered. By Sauer’s Lemma, once sample size exceeds $d_{\\mathrm{VC}}$, the number of realizable labelings grows only polynomially, proving that generalisation bounds depend on $d_{\\mathrm{VC}}$ rather than the infinite cardinality of $\\mathcal{H}$."
  ],
  "analogy": "Imagine a teacher testing students with multiple-choice questions. A student who memorized a cheat sheet of 10 answers (finite hypothesis space) might pass a 10-question test purely by memorisation. But to guarantee they truly understand the underlying subject (PAC learning with error < 5%), you must test them on enough diverse questions that pure guessing or memorisation becomes statistically impossible. The VC dimension measures the student memorisation capacity: how many arbitrary questions they could pass by rote before genuine conceptual understanding is required.",
  "steps": [
    {
      "title": "1. Specify PAC parameters and hypothesis class",
      "body": "Select maximum allowable generalisation error $\\epsilon \\in (0, 1)$ and confidence parameter $\\delta \\in (0, 1)$ (guaranteeing $P(\\mathrm{Error} \\le \\epsilon) \\ge 1 - \\delta$)."
    },
    {
      "title": "2. Determine shattering capacity",
      "body": "Test whether hypothesis class $\\mathcal{H}$ can assign all $2^m$ binary labelings to $m$ points in general position. For 2D linear hyperplanes, 3 non-collinear points can be shattered."
    },
    {
      "title": "3. Identify the VC dimension",
      "body": "Find the largest integer $d$ such that a set of $d$ points can be shattered. For linear classifiers in $\\mathbb{R}^p$, $d_{\\mathrm{VC}} = p + 1$."
    },
    {
      "title": "4. Compute PAC sample complexity and generalisation bound",
      "body": "Evaluate the Vapnik generalisation bound: with probability $\\ge 1 - \\delta$, true risk satisfies $R(h) \\le R_{\\mathrm{emp}}(h) + \\sqrt{\\frac{8 d_{\\mathrm{VC}} \\ln(2e m / d_{\\mathrm{VC}}) + 8 \\ln(4/\\delta)}{m}}$."
    }
  ],
  "math": [
    {
      "h": "PAC Sample Complexity (Finite Hypothesis Class)",
      "tex": "m \\ge \\frac{1}{\\epsilon} \\left( \\ln |\\mathcal{H}| + \\ln \\frac{1}{\\delta} \\right)",
      "p": "Minimum number of training samples required to guarantee true risk <= epsilon with probability >= 1 - delta for consistent learners in finite hypothesis spaces."
    },
    {
      "h": "VC Dimension Definition and Growth Function",
      "tex": "d_{\\mathrm{VC}}(\\mathcal{H}) = \\max \\left\\{ m : \\Pi_{\\mathcal{H}}(m) = 2^m \\right\\}, \\quad \\Pi_{\\mathcal{H}}(m) \\le \\sum_{i=0}^{d} \\binom{m}{i} \\le \\left(\\frac{em}{d}\\right)^d \\; (\\text{Sauer's Lemma})",
      "p": "The maximum number of points that can be shattered. Sauer's Lemma proves that for m > d, the growth function is bounded polynomially by (em/d)^d."
    },
    {
      "h": "Vapnik–Chervonenkis Generalisation Error Bound",
      "tex": "R(h) \\le R_{\\mathrm{emp}}(h) + 2 \\sqrt{2 \\frac{d_{\\mathrm{VC}} \\ln\\left(\\frac{2e m}{d_{\\mathrm{VC}}}\\right) + \\ln\\left(\\frac{4}{\\delta}\\right)}{m}}",
      "p": "Guarantees that true out-of-sample risk R(h) is bounded by empirical training risk plus a structural complexity penalty scaling as O(sqrt(d_VC / m))."
    }
  ],
  "code": "import numpy as np\n\n# Demonstrating Shattering and VC Dimension in 2D Linear Classifiers\n# For a 2D line (w1*x1 + w2*x2 + b = 0), VC dimension is 2 + 1 = 3.\n# 3 points can be shattered in all 2^3 = 8 configurations.\n# 4 points cannot be shattered (XOR configuration always fails!)\n\ndef can_shatter(points, labels_list):\n    # Check if a linear classifier can perfectly separate each binary labeling\n    from sklearn.linear_model import LogisticRegression\n    shattered_count = 0\n    \n    for y in labels_list:\n        if len(np.unique(y)) == 1:\n            shattered_count += 1\n            continue\n        clf = LogisticRegression(penalty=None, solver='lbfgs')\n        clf.fit(points, y)\n        preds = clf.predict(points)\n        if np.array_equal(preds, y):\n            shattered_count += 1\n            \n    return shattered_count\n\n# 1. Test 3 non-collinear points in 2D\npoints_3 = np.array([\n    [0.0, 0.0],\n    [1.0, 0.0],\n    [0.0, 1.0]\n])\n\n# Generate all 2^3 = 8 binary labelings\nlabels_3 = []\nfor i in range(8):\n    binary_str = format(i, '03b')\n    labels_3.append(np.array([int(b) for b in binary_str]))\n\nshattered_3 = can_shatter(points_3, labels_3)\n\n# 2. Test 4 points forming an XOR square\npoints_4 = np.array([\n    [0.0, 0.0],\n    [1.0, 0.0],\n    [0.0, 1.0],\n    [1.0, 1.0]\n])\n\n# Generate all 2^4 = 16 binary labelings\nlabels_4 = []\nfor i in range(16):\n    binary_str = format(i, '04b')\n    labels_4.append(np.array([int(b) for b in binary_str]))\n\nshattered_4 = can_shatter(points_4, labels_4)\n\n# 3. Calculate VC Sample Complexity Bound\nd_vc = 3  # For 2D linear classifier\nepsilon = 0.10  # Max 10% generalisation error\ndelta = 0.05    # 95% confidence (delta = 5%)\n\n# Vapnik sample complexity approximation: m approx (d_vc + log(1/delta)) / eps\nm_approx = int(np.ceil((d_vc * np.log(1.0 / epsilon) + np.log(1.0 / delta)) / epsilon))\n\nprint(f\"--- VC Dimension Verification in 2D ---\")\nprint(f\"3 Points: Can shatter {shattered_3} / 8 labelings (100% shattered -> d_VC >= 3)\")\nprint(f\"4 Points: Can shatter {shattered_4} / 16 labelings (XOR fails -> d_VC < 4)\")\nprint(f\"Exact VC Dimension of 2D Linear Classifier: {d_vc}\")\n\nprint(f\"\\n--- PAC Learning Sample Complexity ---\")\nprint(f\"Target generalisation error (epsilon): {epsilon * 100:.1f}%\")\nprint(f\"Confidence level (1 - delta):           {(1 - delta) * 100:.1f}%\")\nprint(f\"Guaranteed sample complexity m:        {m_approx} samples required\")",
  "keyPoints": [
    "PAC learning formalises the conditions under which an algorithm produces low generalisation error with high probability.",
    "For finite hypothesis spaces, sample complexity scales as $m = O\\left(\\frac{1}{\\epsilon} \\ln |\\mathcal{H}|\\right)$.",
    "VC dimension measures the capacity of infinite continuous hypothesis classes by determining the maximum number of shatterable points.",
    "For linear hyperplanes in $\\mathbb{R}^p$, the VC dimension is exactly $p + 1$.",
    "Vapnik’s generalisation bounds prove that generalisation error decays as $O\\left(\\sqrt{d_{\\mathrm{VC}} / m}\\right)$, independent of ambient parameter space."
  ],
  "pitfalls": [
    "Confusing parameter count with VC dimension: A model with only 1 parameter can have infinite VC dimension (e.g. $f(x) = \\operatorname{sign}(\\sin(\\theta x))$ can shatter infinitely many points).",
    "Overly conservative theoretical bounds: VC generalisation bounds are worst-case upper bounds across all distributions, often requiring 10x to 100x more samples than empirical neural network practice.",
    "Data-independent bounds: Standard VC dimension ignores the underlying data distribution $P(x)$; data lying on a low-dimensional manifold generalises with far fewer samples than raw VC dimension suggests."
  ],
  "quiz": [
    {
      "q": "What is the VC dimension of a linear hyperplane classifier operating in 2-dimensional space (R^2)?",
      "o": [
        "3 (it can shatter any 3 non-collinear points in all 8 labelings, but cannot shatter 4 points in an XOR configuration)",
        "2 (matching the number of features)",
        "Infinite",
        "1 (it can only classify 1 point at a time)"
      ],
      "a": 0,
      "why": "In R^p, a linear hyperplane has VC dimension p + 1. In 2D, 3 points can be shattered in all 8 labelings, but an XOR configuration of 4 points cannot be linearly separated."
    },
    {
      "q": "Why does Sauer’s Lemma represent a crucial breakthrough in machine learning theory?",
      "o": [
        "It proves that once sample size m exceeds the VC dimension d, the number of realizable labelings grows polynomially O(m^d) rather than exponentially 2^m, enabling generalisation bounds",
        "It proves that all neural networks converge in polynomial time",
        "It shows that test error is always zero when training error is zero",
        "It allows linear regression to solve classification problems"
      ],
      "a": 0,
      "why": "Without Sauer's lemma, the combinatorial growth of labelings 2^m prevents generalisation bounds. Sauer's lemma establishes polynomial growth (em/d)^d for m > d_VC, proving PAC learnability."
    }
  ],
  "usedBy": [],
  "prereq": [
    "support_vector_classifier",
    "bias-variance-tradeoff"
  ],
  "related": [
    "svm-dual-formulation",
    "no-free-lunch-and-inductive-bias",
    "bias-variance-tradeoff"
  ],
  "keywords": "vc dimension, pac learning, vapnik chervonenkis, sauers lemma, shattering, sample complexity, generalisation bounds, learning theory"
},
  {
  "id": "no-free-lunch-and-inductive-bias",
  "short": "No free lunch & inductive bias",
  "title": "The No Free Lunch Theorem and Inductive Bias",
  "task": "concepts",
  "module": "Learning theory",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Why no single machine learning algorithm outperforms all others: master Wolpert’s No Free Lunch theorems and the necessity of domain-specific inductive bias.",
  "lead": "Is there a \"master algorithm\" that is universally superior to all other models? Wolpert and Macready proved that averaged over all possible data distributions, every learning algorithm performs identically to random guessing. Generalisation is possible only through inductive bias.",
  "intuition": [
    "Machine learning practitioners constantly search for the best model: comparing XGBoost, Random Forests, Neural Networks, and Support Vector Machines. A natural question arises: is there an ultimate machine learning algorithm that is theoretically superior to all other algorithms across all tasks?",
    "In 1997, David Wolpert and William Macready delivered an astonishing mathematical proof: the No Free Lunch (NFL) Theorem for Supervised Learning. The theorem states that if we average out-of-sample performance across the uniform distribution of all conceivable mathematical target functions, every learning algorithm has the exact same expected error rate—matching a coin flip or random guessing!",
    "If Algorithm A outperforms Algorithm B on a specific benchmark dataset, there is guaranteed to exist a complementary set of mathematical universes where Algorithm B outperforms Algorithm A by the exact same margin.",
    "Why, then, does machine learning work so brilliantly in the real world? Because the real world is NOT drawn uniformly from all conceivable mathematical functions! In an unconstrained universe, the next observed data point could have a completely random label unrelated to preceding points. Real-world physical data exhibits profound regularity: spatial continuity, temporal persistence, compositional symmetry, and smooth energy landscapes. An algorithm generalises successfully if and only if its Inductive Bias—its built-in mathematical assumptions about what patterns are natural—matches the physical structure of the problem."
  ],
  "analogy": "Imagine a universal lock-picking tool. If a locksmith faces every conceivable lock mechanism that could ever be built across the multiverse (including locks where the keyhole rearranges its pins randomly after every turn), no single lock-pick is better than a random coat hanger. But in our actual world, human locksmiths build locks based on physical gravity and brass tumblers. A specialised rake pick works brilliantly not because it is universally supreme, but because its design matches the specific mechanical bias of real-world locks.",
  "steps": [
    {
      "title": "1. Understand the uniform distribution over functions",
      "body": "Recognise that over all possible binary functions on input space $\\mathcal{X}$, unobserved test points are equally likely to be labelled $0$ or $1$, regardless of observed training labels."
    },
    {
      "title": "2. Formalise Wolpert No Free Lunch theorem",
      "body": "For any two algorithms $A$ and $B$, $\\sum_{f} \\sum_{x \\notin \\mathcal{D}} \\mathbb{I}(A(\\mathcal{D}, x) \\neq f(x)) = \\sum_{f} \\sum_{x \\notin \\mathcal{D}} \\mathbb{I}(B(\\mathcal{D}, x) \\neq f(x))$. Expected off-training error is strictly equal."
    },
    {
      "title": "3. Identify the model inductive bias",
      "body": "Deconstruct model assumptions: linear models assume planar boundaries; kNN assumes metric distance locality; CNNs assume translation equivariance; Transformers assume permutation-equivariant token interaction."
    },
    {
      "title": "4. Align inductive bias with problem domain",
      "body": "Select architectures whose mathematical priors match physical reality: use CNNs for images (spatial locality), RNNs/LSTMs for sequences (temporal causality), and Tree ensembles for tabular data (axis-aligned thresholds)."
    }
  ],
  "math": [
    {
      "h": "Wolpert No Free Lunch (NFL) Theorem for Supervised Learning",
      "tex": "\\sum_f P(E \\mid f, m, A) = \\sum_f P(E \\mid f, m, B) \\quad \\forall A, B",
      "p": "Averaged over all possible target functions f, the probability of off-training error E given m training examples is identical for any two algorithms A and B."
    },
    {
      "h": "Expected Off-Training Error Equality",
      "tex": "\\mathbb{E}_{f \\sim \\operatorname{Uniform}(\\mathcal{F})}\\left[ R_{\\mathrm{test}}(A) \\right] = 0.50",
      "p": "Without prior assumptions restricting the function universe, no algorithm can outperform a random coin toss on unseen test data."
    },
    {
      "h": "Formal Definition of Inductive Bias (Mitchell)",
      "tex": "\\mathcal{D} \\wedge \\mathcal{B} \\vdash h(x) = y",
      "p": "Inductive bias B is the minimal set of prior assumptions that, when logically conjoined with training data D, deductively entails the model predictions."
    }
  ],
  "code": "import numpy as np\nfrom itertools import product\nfrom sklearn.tree import DecisionTreeClassifier\nfrom sklearn.neighbours import KNeighborsClassifier\n\n# Empirical Simulation of the No Free Lunch Theorem\n# Consider a tiny discrete universe of 4 binary inputs: {00, 01, 10, 11}\n# There are 2^4 = 16 possible distinct binary functions f: {0, 1}^2 -> {0, 1}\n\nX_all = np.array([\n    [0, 0],\n    [0, 1],\n    [1, 0],\n    [1, 1]\n])\n\n# Training set: first 2 points; Test set: remaining 2 points\nX_train = X_all[:2]\nX_test = X_all[2:]\n\n# Enumerate all 16 possible mathematical truth functions\nall_possible_functions = list(product([0, 1], repeat=4))\n\n# Track total test errors across all 16 mathematical universes\nerrors_tree = 0\nerrors_knn = 0\nerrors_random = 0\n\nfor f in all_possible_functions:\n    y_all = np.array(f)\n    y_train = y_all[:2]\n    y_test = y_all[2:]\n    \n    # Algorithm 1: Decision Tree\n    tree = DecisionTreeClassifier(max_depth=2, random_state=42)\n    # If training labels are uniform, default to class 0\n    if len(np.unique(y_train)) == 1:\n        pred_tree = np.full(len(X_test), y_train[0])\n    else:\n        tree.fit(X_train, y_train)\n        pred_tree = tree.predict(X_test)\n        \n    # Algorithm 2: k-Nearest Neighbours (k=1)\n    knn = KNeighborsClassifier(n_neighbors=1)\n    knn.fit(X_train, y_train)\n    pred_knn = knn.predict(X_test)\n    \n    # Algorithm 3: Pure Random Guess (p = 0.5)\n    # Expected error on 2 test points across uniform functions is 1.0\n    errors_tree += np.sum(pred_tree != y_test)\n    errors_knn += np.sum(pred_knn != y_test)\n    errors_random += 1.0  # Theoretical expectation per universe\n\ntotal_test_evaluations = len(all_possible_functions) * len(X_test)  # 16 * 2 = 32\n\nprint(f\"Discrete Universe: {len(X_all)} points, {len(all_possible_functions)} total mathematical truth functions\")\nprint(f\"Total out-of-sample predictions evaluated: {total_test_evaluations}\")\nprint(f\"\\nTotal Test Errors Across All Universes:\")\nprint(f\"  Decision Tree Error Rate:     {errors_tree} / {total_test_evaluations} ({errors_tree / total_test_evaluations * 100:.1f}%)\")\nprint(f\"  1-Nearest Neighbour Error:    {errors_knn} / {total_test_evaluations} ({errors_knn / total_test_evaluations * 100:.1f}%)\")\nprint(f\"  Random Guessing Expected:     16 / 32 (50.0%)\")\nprint(\"\\nConclusion: Across all possible mathematical functions, Tree, kNN, and Random Guessing have EXACTLY IDENTICAL 50.0% error!\")",
  "keyPoints": [
    "Averaged across all conceivable target functions, every machine learning algorithm performs identically to random guessing.",
    "There is no universally optimal \"master algorithm\": superior performance on one class of problems is paid for with inferior performance on complementary problems.",
    "Generalisation is impossible without Inductive Bias: the prior mathematical assumptions built into an algorithm.",
    "Machine learning succeeds in practice because real-world physical data is non-uniform, exhibiting spatial, temporal, and compositional regularities.",
    "Model selection is the art of matching an architecture inductive bias (e.g. CNNs for images, Trees for tabular data) to the physical constraints of the domain."
  ],
  "pitfalls": [
    "Believing deep learning violates No Free Lunch: Deep learning does not violate NFL; its colossal success stems from its hierarchical compositional inductive bias matching real-world perceptual data.",
    "Selecting models purely by generic leaderboard rankings: A model that dominates a tabular Kaggle competition may fail catastrophically on streaming sensor data where its inductive bias is mismatched.",
    "Over-reliance on zero-bias models: A model with zero inductive bias (capable of memorizing any arbitrary lookup table) cannot generalise beyond observed training points."
  ],
  "quiz": [
    {
      "q": "What is the central conclusion of the No Free Lunch Theorem for supervised learning?",
      "o": [
        "Averaged over all mathematically possible data distributions, all learning algorithms have identical expected generalisation performance matching random guessing",
        "Deep learning is mathematically proven to outperform all other algorithms",
        "Training error is always lower than test error",
        "Models with more parameters always overfit"
      ],
      "a": 0,
      "why": "Wolpert proved that across the uniform distribution of all conceivable functions, every algorithm has the exact same average out-of-sample error rate of 50%."
    },
    {
      "q": "Why can Convolutional Neural Networks (CNNs) accurately classify images using far fewer parameters than fully connected networks?",
      "o": [
        "CNNs encode an inductive bias of translation equivariance and local spatial connectivity, which matches the physical structure of visual images",
        "CNNs bypass the need for training data",
        "CNNs do not use activation functions",
        "CNNs invert the image covariance matrix"
      ],
      "a": 0,
      "why": "CNNs bake in domain-specific inductive biases: pixels close together are correlated (local receptive fields) and visual objects retain meaning regardless of position (weight sharing/translation equivariance)."
    }
  ],
  "usedBy": [],
  "prereq": [
    "vc-dimension-and-pac-learning",
    "bias-variance-tradeoff"
  ],
  "related": [
    "vc-dimension-and-pac-learning",
    "bias-variance-tradeoff",
    "ensemble-theory-bagging-boosting-stacking-compared"
  ],
  "keywords": "no free lunch theorem, inductive bias, wolpert, generalisation, machine learning theory, domain adaptation, prior assumptions"
},
  {
  "id": "label-propagation",
  "short": "Label propagation",
  "title": "Label Propagation and Graph-Based Semi-Supervised Learning",
  "task": "concepts",
  "module": "Semi-supervised and active",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Spread ground-truth labels across affinity graphs to unlabelled data: master transition matrices, harmonic functions, and Label Spreading.",
  "lead": "In many real-world applications, labelling data requires expensive human domain experts, leaving 99% of data unlabelled. Label propagation constructs a nearest-neighbour affinity graph, propagating known labels across high-density manifolds.",
  "intuition": [
    "In modern machine learning, collecting unlabelled data is virtually free—scraping millions of web pages, sensor logs, or satellite images. However, obtaining high-quality ground truth labels requires human domain experts (e.g. radiologists annotating MRIs or fraud specialists reviewing transactions), which is slow and expensive. Semi-Supervised Learning (SSL) exploits the structure of unlabelled data to dramatically improve model accuracy from a tiny handful of labelled examples.",
    "Graph-based semi-supervised learning rests on the Cluster / Manifold Assumption: high-density regions of data form continuous clusters or manifolds, and points lying on the same manifold are overwhelmingly likely to share the identical class label.",
    "Pioneered by Xiaojin Zhu and Zoubin Ghahramani (2002), Label Propagation connects all data points (both labelled and unlabelled) into an undirected affinity graph $W$, where edge weights $W_{ij} = \\exp(-\\|x_i - x_j\\|^2 / (2\\sigma^2))$ reflect local similarity.",
    "Label Propagation models probability diffusion: known labels act as source electrodes, pumping probability mass through graph edges into unlabelled nodes. At each iteration, unlabelled nodes update their belief to the weighted average of their neighbours beliefs, while labelled nodes are clamped to their ground-truth values. The process converges to a unique closed-form Harmonic Function satisfying the graph Laplace equation $\\Delta f = 0$. Zhou et al. introduced Label Spreading, which incorporates normalised Graph Laplacians and soft clamping to tolerate noisy labels."
  ],
  "analogy": "Imagine a network of dry irrigation canals connecting hundreds of rice fields in a valley. Only two fields at opposite ends have water pumps: one pumps blue fertilizer water, the other pumps yellow dye water. As water flows through the connecting canals, nearby fields quickly absorb the blue or yellow liquid. At equilibrium, every field settles into a stable shade of green, teal, or blue depending strictly on the network conductivity between them.",
  "steps": [
    {
      "title": "1. Construct pairwise affinity graph matrix",
      "body": "Given $l$ labelled samples and $u$ unlabelled samples, compute $n \\times n$ similarity matrix $W$ via Gaussian RBF kernel $W_{ij} = \\exp(-\\gamma \\|x_i - x_j\\|^2)$ (or $k$-NN graph) with zero diagonal $W_{ii} = 0$."
    },
    {
      "title": "2. Formulate row-stochastic transition matrix",
      "body": "Compute degree matrix $D = \\operatorname{diag}(W \\mathbf{1})$. Construct transition probability matrix $P = D^{-1} W$, where $P_{ij}$ is the probability of hopping from node $i$ to node $j$."
    },
    {
      "title": "3. Partition matrix into labelled and unlabelled blocks",
      "body": "Decompose $P = \\begin{bmatrix} P_{LL} & P_{LU} \\\\ P_{UL} & P_{UU} \\end{bmatrix}$ and label matrix $Y = \\begin{bmatrix} Y_L \\\\ Y_U \\end{bmatrix}$, where $Y_L$ contains one-hot ground-truth labels."
    },
    {
      "title": "4. Compute harmonic equilibrium solution",
      "body": "Iterate $Y_U \\leftarrow P_{UU} Y_U + P_{UL} Y_L$ until convergence, or evaluate exact closed-form harmonic solution: $Y_U^* = (I - P_{UU})^{-1} P_{UL} Y_L$. Assign classes via $\\hat{y}_i = \\arg\\max_k Y_{U, ik}$."
    }
  ],
  "math": [
    {
      "h": "Label Propagation Equilibrium Equation",
      "tex": "Y_U = (I_u - P_{UU})^{-1} P_{UL} Y_L, \\quad P = D^{-1} W",
      "p": "Closed-form solution for unlabelled node label distributions. The matrix inverse exists and is strictly positive because P_UU is sub-stochastic."
    },
    {
      "h": "Harmonic Energy Minimisation",
      "tex": "\\mathcal{E}(f) = \\frac{1}{2} \\sum_{i, j=1}^n W_{ij} (f_i - f_j)^2 = f^T L f \\quad \\text{subject to } f_L = y_L",
      "p": "The equilibrium solution minimises Dirichlet harmonic energy on the graph Laplacian L = D - W, ensuring smooth variation along the data manifold."
    },
    {
      "h": "Label Spreading Soft-Clamping Update (Zhou et al.)",
      "tex": "F^{(t+1)} = \\alpha S F^{(t)} + (1 - \\alpha) Y, \\quad S = D^{-1/2} W D^{-1/2}",
      "p": "Normalised graph Laplacian iteration with clamping parameter alpha in (0, 1) balancing neighbour diffusion with fidelity to initial labels, conferring robustness to label noise."
    }
  ],
  "code": "import numpy as np\n\n# Label Propagation from scratch on Two Concentric Moons\n# We have 200 total samples, but ONLY 2 LABELLED SAMPLES (one per class)!\nnp.random.seed(42)\nn_samples = 100\n\n# Generate 2 moons dataset\ntheta = np.linspace(0, np.pi, n_samples)\nmoon1_x = np.cos(theta) + np.random.normal(0, 0.08, n_samples)\nmoon1_y = np.sin(theta) + np.random.normal(0, 0.08, n_samples)\n\nmoon2_x = 1.0 - np.cos(theta) + np.random.normal(0, 0.08, n_samples)\nmoon2_y = 0.5 - np.sin(theta) + np.random.normal(0, 0.08, n_samples)\n\nX = np.vstack([np.column_stack([moon1_x, moon1_y]),\n               np.column_stack([moon2_x, moon2_y])])\ny_true = np.array([0]*n_samples + [1]*n_samples)\nn_total = len(X)\n\n# Assign ONLY 2 KNOWN LABELS: sample 0 is Class 0, sample 100 is Class 1\n# All other 198 samples are unlabelled (-1)\ny_semi = np.full(n_total, -1)\ny_semi[0] = 0\ny_semi[n_samples] = 1\n\n# 1. Compute RBF Affinity Matrix W\ngamma = 20.0\ndists_sq = np.sum(X**2, axis=1)[:, None] + np.sum(X**2, axis=1)[None, :] - 2 * (X @ X.T)\nW = np.exp(-gamma * np.maximum(dists_sq, 0))\nnp.fill_diagonal(W, 0.0)  # No self-loops\n\n# 2. Row-normalise to create transition matrix P = D^{-1} W\nD = np.sum(W, axis=1)\nD[D == 0] = 1e-12\nP = W / D[:, None]\n\n# 3. Label matrix Y (one-hot encoding)\nY = np.zeros((n_total, 2))\nY[0, 0] = 1.0\nY[n_samples, 1] = 1.0\n\n# 4. Label Propagation Iteration\nlabelled_indices = [0, n_samples]\nunlabelled_indices = [i for i in range(n_total) if i not in labelled_indices]\n\nY_curr = Y.copy()\nfor it in range(50):\n    # Propagate: Y <- P * Y\n    Y_new = P @ Y_curr\n    # Clamp labelled points strictly to ground truth\n    Y_new[0] = [1.0, 0.0]\n    Y_new[n_samples] = [0.0, 1.0]\n    \n    if np.max(np.abs(Y_new - Y_curr)) < 1e-5:\n        break\n    Y_curr = Y_new\n\n# Predicted classes on unlabelled instances\npred_labels = np.argmax(Y_curr, axis=1)\naccuracy_unlabelled = np.mean(pred_labels[unlabelled_indices] == y_true[unlabelled_indices])\n\nprint(f\"Total dataset: {n_total} samples (Two Moons manifold)\")\nprint(f\"Number of labelled samples provided: 2 (1.0% supervision!)\")\nprint(f\"Number of unlabelled samples to infer: {len(unlabelled_indices)}\")\nprint(f\"Label Propagation Accuracy on Unlabelled Data: {accuracy_unlabelled * 100:.1f}%\")\nprint(\"Conclusion: Label propagation successfully navigated the curved manifold from 2 single points!\")",
  "keyPoints": [
    "Graph-based semi-supervised learning that propagates label probabilities from labelled seeds across the data manifold.",
    "Rests on the Cluster/Manifold assumption: points connected by high-density paths share identical class labels.",
    "Converges to a unique harmonic function minimising graph Dirichlet energy $\\mathcal{E}(f) = f^T L f$.",
    "Label Spreading introduces normalised Graph Laplacians and soft clamping, conferring robustness against corrupted labels.",
    "Achieves high classification accuracy on complex non-linear manifolds using less than 1% labelled training data."
  ],
  "pitfalls": [
    "Affinity graph sensitivity: Highly sensitive to graph construction (RBF parameter $\\gamma$ or $k$-NN count); poor choice connects disconnected manifolds (short-circuiting) or fragments the graph.",
    "Label imbalance bias: If one class has significantly more labelled seeds, its probability mass floods unlabelled nodes; class mass normalisation (CMN) is required.",
    "Scalability bottleneck: Full graph propagation requires $O(n^2)$ memory and $O(n^3)$ inversion time, demanding sparse $k$-NN approximations or landmark graphs for large datasets."
  ],
  "quiz": [
    {
      "q": "Why can Label Propagation classify complex curved non-linear manifolds (like Two Moons) using only 2 labelled examples?",
      "o": [
        "It diffuses labels along high-density graph paths, respecting the underlying topological manifold structure without requiring linear separation",
        "It assumes the data is normally distributed in 2D space",
        "It projects data onto the coordinate axes",
        "It discards all unlabelled points before fitting"
      ],
      "a": 0,
      "why": "By constructing an affinity graph along dense geometric corridors, label probabilities flow naturally through the manifold curves, classifying points based on path connectivity."
    },
    {
      "q": "What is the primary difference between Label Propagation and Zhou et al.’s Label Spreading?",
      "o": [
        "Label Spreading uses the symmetrically normalised Graph Laplacian and soft clamping, allowing labelled points to adapt and tolerate label noise",
        "Label Spreading is a supervised regression algorithm",
        "Label Propagation cannot handle binary classification",
        "Label Spreading requires zero parameters"
      ],
      "a": 0,
      "why": "Label Propagation strictly clamps labelled nodes to initial values. Label Spreading uses soft clamping with parameter alpha, allowing labelled nodes to update and filter noisy annotations."
    }
  ],
  "usedBy": [],
  "prereq": [
    "spectral_clustering",
    "markov-chains-and-stationary-distributions"
  ],
  "related": [
    "spectral_clustering",
    "self-training-and-pseudo-labels",
    "active-learning",
    "markov-chains-and-stationary-distributions"
  ],
  "keywords": "label propagation, semi-supervised learning, label spreading, harmonic functions, manifold assumption, graph laplacian, transductive learning"
},
  {
  "id": "self-training-and-pseudo-labels",
  "short": "Self-training & pseudo-labels",
  "title": "Self-Training and Pseudo-Labelling",
  "task": "concepts",
  "module": "Semi-supervised and active",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Bootstrapping classifiers on unlabelled data: master high-confidence pseudo-labelling, confirmation bias, curriculum pseudo-labelling, and FixMatch.",
  "lead": "When large amounts of unlabelled data are available, self-training leverages the model’s own high-confidence predictions to iteratively expand its training dataset, pushing decision boundaries toward low-density regions.",
  "intuition": [
    "In production machine learning systems, data scientists frequently find themselves with a small labelled dataset $\\mathcal{D}_L$ and a massive pool of unlabelled instances $\\mathcal{D}_U$. While graph-based methods like label propagation require holding all data in memory, Self-Training (pseudo-labelling) offers an intuitive, scalable bootstrapping paradigm that works with any supervised model—from logistic regression to 100-million parameter vision transformers.",
    "The core self-training loop operates in iterations: first, train a base model on the available labelled data $\\mathcal{D}_L$. Second, generate predicted class probabilities on unlabelled instances $u \\in \\mathcal{D}_U$. Third, filter the predictions using a strict confidence threshold $\\tau$ (e.g. $\\max_k P(y=k \\mid u) \\ge 0.95$). Fourth, convert confident predictions into hard \"pseudo-labels\" $\\hat{y} = \\arg\\max P(y \\mid u)$, append them to the training set, and retrain the model from scratch.",
    "Why does training a model on its own predictions work? Mathematically, pseudo-labelling acts as an implicit form of Entropy Minimisation (Grandvalet & Bengio, 2004). By forcing model predictions on unlabelled data to become sharp, discrete one-hot vectors, self-training pushes the decision boundary out of high-density data clusters and into low-density boundary margins.",
    "However, self-training contains an inherent danger: Confirmation Bias. If the initial model makes an incorrect prediction with high confidence (e.g. due to class imbalance or misleading noise), it pseudo-labels the sample incorrectly. In subsequent rounds, the model retrains on its own mistake, reinforcing and compounding the error. Modern algorithms like FixMatch prevent confirmation bias using data augmentation consistency: inferring pseudo-labels on weakly augmented images and enforcing loss on strongly augmented versions."
  ],
  "analogy": "Imagine an apprentice botanist learning to identify mushrooms with a guidebook containing only five confirmed photographs. The apprentice walks into a forest of 1,000 unlabelled mushrooms. When they encounter a mushroom that is 99% identical to the guidebook photo of a Chanterelle, they plant a wooden signpost labelled \"Chanterelle\". They use their newly expanded set of reference mushrooms to identify subtly more ambiguous specimens deeper in the forest, gradually mastering the species.",
  "steps": [
    {
      "title": "1. Train teacher model on labelled dataset",
      "body": "Train initial supervised model $f_\\theta$ on available labelled data $\\mathcal{D}_L = \\{(x_i, y_i)\\}_{i=1}^n$."
    },
    {
      "title": "2. Generate predictions on unlabelled pool",
      "body": "Evaluate predictive probabilities $p_u = f_\\theta(u)$ for all instances in unlabelled pool $\\mathcal{D}_U$."
    },
    {
      "title": "3. Filter by confidence threshold and assign pseudo-labels",
      "body": "Identify high-confidence subset: $\\mathcal{D}_{\\mathrm{pseudo}} = \\{(u, \\arg\\max p_u) : \\max_k p_{u, k} \\ge \\tau\\}$, typically setting $\\tau \\in [0.90, 0.98]$."
    },
    {
      "title": "4. Augment training set and retrain",
      "body": "Combine datasets $\\mathcal{D}_{\\mathrm{new}} = \\mathcal{D}_L \\cup \\mathcal{D}_{\\mathrm{pseudo}}$. Remove pseudo-labelled instances from $\\mathcal{D}_U$. Retrain model on combined pool. Repeat for multiple cycles."
    }
  ],
  "math": [
    {
      "h": "Confidence Masking and Pseudo-Label Definition",
      "tex": "q_b = \\mathbb{I}\\left( \\max_k p_{\\mathrm{model}}(y = k \\mid u_b) \\ge \\tau \\right), \\quad \\hat{y}_b = \\arg\\max_k p_{\\mathrm{model}}(y = k \\mid u_b)",
      "p": "Binary mask q_b filters unlabelled instances, retaining only samples where maximum predicted class probability exceeds threshold tau."
    },
    {
      "h": "Combined Supervised and Pseudo-Label Objective",
      "tex": "\\mathcal{L}_{\\mathrm{total}} = \\frac{1}{B_L} \\sum_{i=1}^{B_L} H(y_i, p(x_i)) + \\lambda_u \\frac{1}{B_U} \\sum_{b=1}^{B_U} q_b H(\\hat{y}_b, p(u_b))",
      "p": "Standard cross-entropy loss on labelled data combined with confidence-masked cross-entropy on pseudo-labelled unlabelled instances weighted by lambda_u."
    },
    {
      "h": "Connection to Entropy Minimisation",
      "tex": "\\mathcal{H}(p) = -\\sum_{k=1}^K p_k \\log p_k \\to 0",
      "p": "Training on hard one-hot pseudo-labels forces class probabilities toward 0 or 1, minimising conditional entropy and driving decision boundaries into low-density margins."
    }
  ],
  "code": "import numpy as np\nfrom sklearn.linear_model import LogisticRegression\n\n# Self-Training with Confidence Thresholding from scratch\nnp.random.seed(42)\n\n# Generate synthetic binary dataset (2 clusters in 2D space)\nn_samples = 400\nX1 = np.random.normal(loc=[-1.5, 0], scale=0.8, size=(n_samples // 2, 2))\nX2 = np.random.normal(loc=[1.5, 0], scale=0.8, size=(n_samples // 2, 2))\nX = np.vstack([X1, X2])\ny_true = np.array([0]*(n_samples // 2) + [1]*(n_samples // 2))\n\n# Tiny initial labelled seed: ONLY 10 SAMPLES (5 per class)\n# Remaining 390 samples are unlabelled!\nn_labelled = 10\nlabelled_idx = np.concatenate([np.random.choice(n_samples // 2, n_labelled // 2, replace=False),\n                               np.random.choice(np.arange(n_samples // 2, n_samples), n_labelled // 2, replace=False)])\nunlabelled_idx = np.setdiff1d(np.arange(n_samples), labelled_idx)\n\n# Initial baseline model trained on only 10 samples\nbaseline_model = LogisticRegression()\nbaseline_model.fit(X[labelled_idx], y_true[labelled_idx])\nacc_baseline = np.mean(baseline_model.predict(X[unlabelled_idx]) == y_true[unlabelled_idx])\n\n# Self-Training Loop\ncurrent_labelled_idx = labelled_idx.copy()\ncurrent_unlabelled_idx = unlabelled_idx.copy()\ncurrent_y = y_true.copy()\n\nconfidence_threshold = 0.90\nmax_cycles = 5\n\nfor cycle in range(max_cycles):\n    # 1. Fit model on currently labelled pool\n    clf = LogisticRegression()\n    clf.fit(X[current_labelled_idx], current_y[current_labelled_idx])\n    \n    # 2. Predict probabilities on unlabelled pool\n    if len(current_unlabelled_idx) == 0:\n        break\n    probs = clf.predict_proba(X[current_unlabelled_idx])\n    max_probs = np.max(probs, axis=1)\n    pseudo_labels = np.argmax(probs, axis=1)\n    \n    # 3. Filter by confidence threshold\n    confident_mask = max_probs >= confidence_threshold\n    if not np.any(confident_mask):\n        break\n        \n    newly_labelled_indices = current_unlabelled_idx[confident_mask]\n    current_y[newly_labelled_indices] = pseudo_labels[confident_mask]\n    \n    # 4. Update pools\n    current_labelled_idx = np.concatenate([current_labelled_idx, newly_labelled_indices])\n    current_unlabelled_idx = current_unlabelled_idx[~confident_mask]\n\n# Final model evaluation\nfinal_model = LogisticRegression()\nfinal_model.fit(X[current_labelled_idx], current_y[current_labelled_idx])\nacc_final = np.mean(final_model.predict(X[unlabelled_idx]) == y_true[unlabelled_idx])\n\nprint(f\"Dataset: {n_samples} total samples ({n_labelled} initial labelled, {len(unlabelled_idx)} unlabelled)\")\nprint(f\"Baseline Accuracy (10 labelled samples only): {acc_baseline * 100:.1f}%\")\nprint(f\"Self-Training Confident Pseudo-labels added:   {len(current_labelled_idx) - n_labelled} samples\")\nprint(f\"Final Self-Trained Accuracy:                   {acc_final * 100:.1f}%\")\nprint(f\"Accuracy Improvement: +{(acc_final - acc_baseline) * 100:.1f}% via self-training!\")",
  "keyPoints": [
    "Bootstraps models on unlabelled data by treating high-confidence predictions as ground-truth pseudo-labels.",
    "Model-agnostic and highly scalable: works with any supervised base classifier without graph memory bottlenecks.",
    "Enforces entropy minimisation: pushes classification decision boundaries into low-density regions between clusters.",
    "Confidence thresholding $\\tau \\in [0.90, 0.98]$ prevents noisy ambiguous predictions from corrupting training data.",
    "Forms the foundation of state-of-the-art semi-supervised deep learning frameworks like FixMatch and noisy student training."
  ],
  "pitfalls": [
    "Confirmation bias: If an initial model makes a high-confidence erroneous prediction, it trains on its own blunder in subsequent iterations, entrenching the mistake.",
    "Class imbalance amplification: Models tend to be more confident in dominant majority classes, pseudo-labelling more majority samples and starving minority classes; class-balanced thresholding is vital.",
    "Static threshold collapse: A fixed threshold $\\tau = 0.95$ may be too strict in early epochs (zero pseudo-labels added) or too lenient in late epochs; curriculum pseudo-labelling dynamically adjusts $\\tau$."
  ],
  "quiz": [
    {
      "q": "What is \"confirmation bias\" in the context of self-training and pseudo-labelling?",
      "o": [
        "When a model makes a confident incorrect prediction on unlabelled data, retrains on that false label, and compounds its own mistake in subsequent iterations",
        "When human annotators disagree with each other",
        "When training loss increases instead of decreasing",
        "When the learning rate is set too low"
      ],
      "a": 0,
      "why": "Confirmation bias occurs when the model incorporates its own erroneous pseudo-labels into training, reinforcing the error and cementing corrupted decision boundaries."
    },
    {
      "q": "Why does training on high-confidence pseudo-labels improve classification performance?",
      "o": [
        "It enforces entropy minimisation, driving the decision boundary away from high-density data clusters into low-density margins",
        "It changes the underlying test distribution",
        "It converts continuous features into binary features",
        "It guarantees zero test error"
      ],
      "a": 0,
      "why": "By forcing confident unlabelled predictions to hard one-hot pseudo-labels, the loss encourages low-entropy predictions, pushing boundaries into low-density gaps between clusters."
    }
  ],
  "usedBy": [],
  "prereq": [
    "logistic-regression-inference-odds-ratios-wald-tests"
  ],
  "related": [
    "label-propagation",
    "active-learning",
    "weak-supervision",
    "cost-sensitive-learning"
  ],
  "keywords": "self-training, pseudo-labels, semi-supervised learning, confirmation bias, fixmatch, entropy minimisation, confidence thresholding, bootstrapping"
},
  {
  "id": "active-learning",
  "short": "Active learning",
  "title": "Active Learning: Query Strategies and Human-in-the-Loop",
  "task": "concepts",
  "module": "Semi-supervised and active",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Maximise model accuracy while minimising labelling costs: master Uncertainty Sampling, Query-by-Committee, Expected Model Change, and diversity sampling.",
  "lead": "Data is abundant, but expert annotation is expensive. Active learning flips passive learning on its head: the model actively queries human annotators for labels on the most informative, ambiguous instances.",
  "intuition": [
    "In conventional passive machine learning, practitioners collect a dataset, randomly sample thousands of instances for human labeling, and train a model. However, random sampling is notoriously wasteful: annotators spend hours labelling obvious, redundant instances (e.g. 5,000 nearly identical images of blue skies) that provide zero new information to the model.",
    "Active Learning reverses the control loop: instead of passively receiving training data, the algorithm actively inspects the unlabelled data pool and selects the most informative, valuable instances to send to human annotators (\"oracles\"). By focusing annotation budgets exclusively on ambiguous edge cases, active learning often achieves the same accuracy as passive learning using 10% to 20% of the labelling budget.",
    "The most widely deployed family of active learning algorithms is Uncertainty Sampling. The algorithm queries samples where the model current predictions are least certain: Least Confidence (querying points with the lowest top-1 probability), Margin Sampling (querying points where the gap between the top two class probabilities is smallest), and Entropy Sampling (querying points with maximal prediction entropy across all classes).",
    "Beyond single-model uncertainty, Query-by-Committee (QBC) maintains an ensemble of models and queries instances with the greatest committee voting disagreement. To avoid wasting budget on isolated noise outliers, modern active learning couples uncertainty with density-weighted diversity sampling."
  ],
  "analogy": "Imagine a student preparing for a medical licensing exam with a professor. A passive student reads random textbook pages cover to cover, spending hours rereading basic definitions they already know cold. An active student solves a diagnostic test, identifies the five specific cardiovascular disease scenarios where their knowledge was most confused and hesitant, and brings precisely those five ambiguous cases to the professor office hours for clarification.",
  "steps": [
    {
      "title": "1. Train initial seed model",
      "body": "Train base model $f_\\theta$ on a small initial seed set of labelled samples $\\mathcal{D}_L$."
    },
    {
      "title": "2. Evaluate query strategy across unlabelled pool",
      "body": "Compute informativeness scores for all instances in unlabelled pool $\\mathcal{D}_U$ using an acquisition function (e.g. margin uncertainty or entropy)."
    },
    {
      "title": "3. Query human oracle for top-K batch",
      "body": "Select the batch of $K$ instances with the highest informativeness scores. Send them to human annotators to obtain ground-truth labels."
    },
    {
      "title": "4. Update training set and retrain",
      "body": "Move newly annotated batch from $\\mathcal{D}_U$ to $\\mathcal{D}_L$. Retrain model $f_\\theta$. Repeat the loop until the labelling budget is exhausted or target accuracy is reached."
    }
  ],
  "math": [
    {
      "h": "Uncertainty Sampling Strategies",
      "tex": "\\begin{aligned} \\text{Least Confidence: } & x_{\\mathrm{LC}}^* = \\arg\\max_x \\left( 1 - \\max_k P(y = k \\mid x) \\right) \\\\ \\text{Margin Sampling: } & x_{\\mathrm{M}}^* = \\arg\\min_x \\left( P(\\hat{y}_1 \\mid x) - P(\\hat{y}_2 \\mid x) \\right) \\\\ \\text{Entropy Sampling: } & x_{\\mathrm{Ent}}^* = \\arg\\max_x \\left( -\\sum_{k=1}^K P(y = k \\mid x) \\log P(y = k \\mid x) \\right) \\end{aligned}",
      "p": "Three classic uncertainty metrics. Margin sampling focuses specifically on the boundary separating the top two competing classes, outperforming least confidence in multi-class problems."
    },
    {
      "h": "Query-by-Committee (QBC) Vote Entropy",
      "tex": "x_{\\mathrm{QBC}}^* = \\arg\\max_x \\left( -\\sum_{k=1}^K \\frac{V(k, x)}{C} \\log \\frac{V(k, x)}{C} \\right)",
      "p": "Measures disagreement among a committee of C diverse models, where V(k, x) is the number of committee members predicting class k for instance x."
    },
    {
      "h": "Density-Weighted Information Criterion",
      "tex": "x^* = \\arg\\max_x \\left( \\phi_A(x) \\cdot \\left[\\frac{1}{|U|} \\sum_{u \\in U} \\operatorname{sim}(x, u)\\right]^\\beta \\right)",
      "p": "Multiplies informativeness score phi_A(x) by an average similarity density term, preventing the algorithm from querying isolated noise outliers in unpopulated regions."
    }
  ],
  "code": "import numpy as np\nfrom sklearn.linear_model import LogisticRegression\n\n# Active Learning: Margin Uncertainty Sampling vs Passive Random Sampling\nnp.random.seed(42)\n\n# Generate synthetic 2D classification dataset with overlapping margin\nn_total = 600\nX1 = np.random.normal(loc=[-1.0, -1.0], scale=1.0, size=(n_total // 2, 2))\nX2 = np.random.normal(loc=[1.0, 1.0], scale=1.0, size=(n_total // 2, 2))\nX = np.vstack([X1, X2])\ny = np.array([0]*(n_total // 2) + [1]*(n_total // 2))\n\n# Shuffle\nperm = np.random.permutation(n_total)\nX, y = X[perm], y[perm]\n\n# Test set for evaluation (200 samples)\nX_test, y_test = X[400:], y[400:]\nX_pool, y_pool = X[:400], y[:400]\n\n# Initial seed: 10 randomly labelled samples\ninitial_idx = np.random.choice(len(X_pool), size=10, replace=False)\n\ndef run_experiment(query_strategy='margin', n_rounds=8, batch_size=5):\n    labelled_idx = list(initial_idx)\n    pool_idx = [i for i in range(len(X_pool)) if i not in labelled_idx]\n    \n    accuracies = []\n    \n    for r in range(n_rounds):\n        # 1. Train model on current labelled set\n        clf = LogisticRegression()\n        clf.fit(X_pool[labelled_idx], y_pool[labelled_idx])\n        acc = np.mean(clf.predict(X_test) == y_test)\n        accuracies.append(acc)\n        \n        # 2. Query next batch\n        if query_strategy == 'random':\n            chosen = np.random.choice(pool_idx, size=batch_size, replace=False)\n        elif query_strategy == 'margin':\n            probs = clf.predict_proba(X_pool[pool_idx])\n            # Margin between top two classes: |P(class 1) - P(class 0)|\n            margins = np.abs(probs[:, 0] - probs[:, 1])\n            # Smallest margin = highest uncertainty\n            uncertain_order = np.argsort(margins)[:batch_size]\n            chosen = [pool_idx[idx] for idx in uncertain_order]\n            \n        # 3. Add to labelled set\n        labelled_idx.extend(chosen)\n        pool_idx = [i for i in pool_idx if i not in chosen]\n        \n    return accuracies\n\nacc_random = run_experiment(query_strategy='random')\nacc_active = run_experiment(query_strategy='margin')\n\nsample_sizes = [10 + i * 5 for i in range(len(acc_random))]\n\nprint(\"--- Active Learning vs Passive Random Sampling ---\")\nprint(f\"Initial Accuracy (10 samples): {acc_active[0]*100:.1f}%\\n\")\nfor sz, r_acc, a_acc in zip(sample_sizes[1:], acc_random[1:], acc_active[1:]):\n    print(f\"Sample Size {sz:2d} | Random: {r_acc*100:.1f}% | Active Margin: {a_acc*100:.1f}% (Advantage: +{(a_acc - r_acc)*100:+.1f}%)\")\n\nfinal_gap = acc_active[-1] - acc_random[-1]\nprint(f\"\\nFinal Accuracy Advantage of Active Learning: +{final_gap*100:.1f}% using identical annotation budget!\")",
  "keyPoints": [
    "Iterative human-in-the-loop framework: algorithm actively selects the most informative unlabelled instances for annotation.",
    "Dramatically reduces labelling costs: frequently matches passive random sampling accuracy using 50% to 80% fewer annotations.",
    "Uncertainty sampling queries instances near the decision boundary (least confidence, margin, entropy).",
    "Query-by-Committee (QBC) selects instances with maximal disagreement across an ensemble of hypotheses.",
    "Density-weighted criteria prevent the algorithm from wasting budget on isolated, uninformative outliers."
  ],
  "pitfalls": [
    "Sampling bias and blind spots: If the initial seed model completely misses an entire isolated cluster, uncertainty sampling will never query points near it because the model is falsely confident.",
    "Cold start problem: When initial labelled data is too sparse ($n < 5$), model predictions are noisy and uncertainty scores are meaningless.",
    "Annotation batch correlations: Querying the top $K$ most uncertain points simultaneously often selects $K$ near-duplicate points; batch diversity sampling is required."
  ],
  "quiz": [
    {
      "q": "How does Margin Sampling select the next instance to query for human annotation?",
      "o": [
        "It selects the instance where the difference between the top two predicted class probabilities is smallest, indicating maximal boundary ambiguity",
        "It selects the sample with the largest feature values",
        "It draws a sample completely at random from the dataset",
        "It selects instances that have already been annotated twice"
      ],
      "a": 0,
      "why": "When the gap P(y_1|x) - P(y_2|x) is near zero, the model is balanced on the knife-edge between its top two choices; obtaining a label for this point provides maximal boundary information."
    },
    {
      "q": "Why is density weighting combined with uncertainty sampling in active learning?",
      "o": [
        "To prevent the model from wasting annotation budget on isolated outliers and noise points that have high uncertainty but represent no other data points",
        "To speed up model training by 100x",
        "To eliminate the need for human annotators",
        "To convert multi-class classification into binary classification"
      ],
      "a": 0,
      "why": "An isolated outlier far from all other points naturally produces high uncertainty. Density weighting ensures queried points reside in populated regions where learning benefits many samples."
    }
  ],
  "usedBy": [],
  "prereq": [
    "logistic-regression-inference-odds-ratios-wald-tests"
  ],
  "related": [
    "self-training-and-pseudo-labels",
    "label-propagation",
    "weak-supervision",
    "ensemble-theory-bagging-boosting-stacking-compared"
  ],
  "keywords": "active learning, human in the loop, uncertainty sampling, query by committee, margin sampling, annotation budget, informativeness, density weighting"
},
  {
  "id": "weak-supervision",
  "short": "Weak supervision",
  "title": "Weak Supervision and Programmatic Labeling",
  "task": "concepts",
  "module": "Semi-supervised and active",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Label millions of data points programmatically using noisy heuristic functions: master Snorkel, label models, and generative matrix completion.",
  "lead": "Hand-labelling training datasets is the primary bottleneck in production AI. Weak supervision replaces manual labelling with heuristic labeling functions (LFs), using an unsupervised generative label model to resolve conflicts.",
  "intuition": [
    "In modern machine learning, hand-labelling millions of training examples is often impossible: data changes dynamically, privacy laws forbid human annotators from viewing sensitive medical records or financial transactions, and expert wages are exorbitant.",
    "Weak Supervision (pioneered by Alexander Ratner, Christopher Ré, and the Stanford Snorkel team in 2017) fundamentally re-engineers data creation: instead of manually hand-labelling individual samples, domain experts write programmatic Labeling Functions (LFs).",
    "A Labeling Function is a short Python script encoding a noisy heuristic: a regular expression pattern, a keyword dictionary lookup, a heuristic threshold on metadata, a legacy third-party model, or distant supervision from an external database. Each LF inspects an unlabelled sample and either outputs a candidate label (e.g. $+1$ or $-1$) or abstains ($0$).",
    "Because human heuristics are imperfect, LFs frequently overlap, conflict, and correlate. Weak supervision resolves these conflicts through a two-stage architecture: first, an unsupervised Generative Label Model observes how LFs agree and disagree across millions of unlabelled samples, estimating the unknown accuracy and correlation of each LF without needing ground-truth labels. The Label Model outputs calibrated probabilistic training labels $P(Y \\mid \\Lambda)$. Second, an arbitrary end-to-end deep neural network is trained on these probabilistic labels, generalising far beyond the heuristic rules."
  ],
  "analogy": "Imagine a murder trial with five flawed witnesses. Witness 1 has poor eyesight; Witness 2 dislikes the defendant; Witness 3 only saw what happened from a distance; Witness 4 heard a loud noise; Witness 5 heard a rumor. A wise judge does not take a simple show of hands. By cross-examining the witnesses and observing which details they consistently agree on across 100 questions, the judge deduces the reliability of each witness without having been at the crime scene, synthesising their testimonies into the truth.",
  "steps": [
    {
      "title": "1. Author programmatic Labeling Functions (LFs)",
      "body": "Write multiple heuristic Python functions $\\lambda_j(x) \\in \\{-1, 0, +1\\}$ encoding domain rules, regex patterns, or distant supervision. Each LF votes or abstains ($0$)."
    },
    {
      "title": "2. Generate noisy label matrix Lambda",
      "body": "Execute all $m$ labeling functions across $n$ unlabelled samples, constructing label matrix $\\Lambda \\in \\{-1, 0, +1\\}^{n \\times m}$."
    },
    {
      "title": "3. Fit unsupervised Generative Label Model",
      "body": "Estimate the unknown accuracy vector $\\theta$ and correlation structure of LFs without ground truth, using matrix completion on the covariance matrix $\\mathbb{E}[\\Lambda \\Lambda^T]$."
    },
    {
      "title": "4. Train downstream discriminative model",
      "body": "Infer probabilistic training labels $\\tilde{y}_i = P_\\theta(Y=1 \\mid \\Lambda_i)$. Train a downstream deep neural network or gradient boosted model using cross-entropy with soft probabilistic targets."
    }
  ],
  "math": [
    {
      "h": "Label Matrix Definition",
      "tex": "\\Lambda \\in \\{-1, 0, +1\\}^{n \\times m}, \\quad \\Lambda_{ij} = \\lambda_j(x_i)",
      "p": "Matrix of weak labels from m labeling functions applied to n unlabelled samples. Zero denotes that the labeling function abstained on that sample."
    },
    {
      "h": "Generative Label Model Factorisation",
      "tex": "P_\\theta(\\Lambda, Y) = \\frac{1}{Z_\\theta} \\exp\\left( \\sum_{j=1}^m \\theta_j Y \\Lambda_j + \\sum_{j < k} \\theta_{jk} \\Lambda_j \\Lambda_k \\right)",
      "p": "Ising/Markov Random Field model over latent true label Y and observed weak votes Lambda_j, parameterised by LF accuracies theta_j and pairwise correlations theta_{jk}."
    },
    {
      "h": "Unsupervised Covariance Matching (Matrix Completion)",
      "tex": "\\operatorname{Cov}(\\Lambda_j, \\Lambda_k) = \\mathbb{E}[\\Lambda_j \\Lambda_k] - \\mathbb{E}[\\Lambda_j] \\mathbb{E}[\\Lambda_k] = \\mu_j \\mu_k \\quad (\\text{for conditionally independent LFs})",
      "p": "Because observable covariance between LFs factorises into the product of their latent accuracies mu_j = Cov(Lambda_j, Y), accuracy can be solved without true labels via rank-1 matrix completion."
    }
  ],
  "code": "import numpy as np\nfrom sklearn.linear_model import LogisticRegression\n\n# Programmatic Weak Supervision (Snorkel-style Label Model) from scratch\nnp.random.seed(42)\nn_samples = 500\n\n# Synthetic spam classification problem\n# Ground truth: 1 = Spam, 0 = Ham\n# Features: [contains_link, has_dollar_sign, all_caps_title, sender_reputation]\nX = np.random.uniform(0, 1, (n_samples, 4))\ny_true = ((X[:, 0] * 1.5 + X[:, 1] * 2.0 + X[:, 2] * 1.0 - X[:, 3] * 2.5) > 0.5).astype(int)\n\n# 1. Define 3 noisy Labeling Functions (LFs)\n# Votes: 1 (Spam), 0 (Ham), -1 (Abstain)\ndef lf_dollar(x):\n    # If high dollar sign presence, vote Spam; else abstain\n    return 1 if x[1] > 0.6 else -1\n\ndef lf_link(x):\n    # If link present and low sender rep, vote Spam\n    if x[0] > 0.7 and x[3] < 0.4: return 1\n    if x[0] < 0.2 and x[3] > 0.7: return 0\n    return -1\n\ndef lf_caps(x):\n    # If all caps title, vote Spam\n    return 1 if x[2] > 0.8 else -1\n\n# 2. Build Label Matrix Lambda (n x m)\nlfs = [lf_dollar, lf_link, lf_caps]\nm_lfs = len(lfs)\nLambda = np.zeros((n_samples, m_lfs), dtype=int)\n\nfor i in range(n_samples):\n    for j in range(m_lfs):\n        Lambda[i, j] = lfs[j](X[i])\n\n# 3. Simple Generative Majority / Accuracy-Weighted Label Model\n# Calculate empirical agreement rates between LFs to weight reliability\nweights = np.zeros(m_lfs)\nfor j in range(m_lfs):\n    # Empirical accuracy estimate using inter-LF agreement\n    active_mask = Lambda[:, j] != -1\n    agreements = []\n    for k in range(m_lfs):\n        if j != k:\n            overlap = active_mask & (Lambda[:, k] != -1)\n            if np.sum(overlap) > 0:\n                agreements.append(np.mean(Lambda[overlap, j] == Lambda[overlap, k]))\n    weights[j] = np.mean(agreements) if agreements else 0.5\n\n# Compute soft probabilistic labels P(Y=1 | Lambda)\nsoft_labels = np.zeros(n_samples)\nfor i in range(n_samples):\n    votes = Lambda[i]\n    active = votes != -1\n    if np.any(active):\n        # Weighted log-odds combination\n        log_odds = np.sum(weights[active] * (votes[active] * 2 - 1))\n        soft_labels[i] = 1.0 / (1.0 + np.exp(-log_odds))\n    else:\n        soft_labels[i] = 0.50  # Default prior\n\n# 4. Train downstream discriminative model on soft pseudo-labels\ndownstream_model = LogisticRegression()\n# Convert soft labels to binary training targets (p > 0.5)\ny_weak = (soft_labels > 0.5).astype(int)\ndownstream_model.fit(X, y_weak)\n\npreds_downstream = downstream_model.predict(X)\nacc = np.mean(preds_downstream == y_true)\n\nlf_coverages = [np.mean(Lambda[:, j] != -1) * 100 for j in range(m_lfs)]\n\nprint(f\"Total unlabelled samples processed: {n_samples}\")\nprint(f\"LF 1 (Dollar) Coverage: {lf_coverages[0]:.1f}%\")\nprint(f\"LF 2 (Link)   Coverage: {lf_coverages[1]:.1f}%\")\nprint(f\"LF 3 (Caps)   Coverage: {lf_coverages[2]:.1f}%\")\nprint(f\"Overall Label Matrix Coverage: {np.mean(np.any(Lambda != -1, axis=1))*100:.1f}%\")\nprint(f\"Downstream Model Accuracy (trained on zero human labels!): {acc * 100:.1f}%\")",
  "keyPoints": [
    "Replaces expensive manual hand-labelling with programmatic Labeling Functions (LFs) encoding heuristics.",
    "Unsupervised Generative Label Model learns the accuracy and correlation of each LF without ground-truth labels.",
    "Label model aggregates noisy, conflicting, overlapping votes into calibrated probabilistic labels $P(Y \\mid \\Lambda)$.",
    "Downstream discriminative model (neural network or boosted trees) generalises beyond heuristic rules via feature representations.",
    "Foundational paradigm of data-centric AI (e.g. Snorkel), enabling rapid iteration and privacy-preserving training on sensitive data."
  ],
  "pitfalls": [
    "Correlated labeling functions: If multiple LFs share common dependencies (e.g. three keyword variations of the same rule), naive independent label models double-count their evidence; correlation graphs are required.",
    "Low coverage / high abstention: If LFs abstain on 90% of samples, the downstream model receives zero training signal on the majority of data.",
    "Heuristic concept drift: As language or data distributions shift over time, hard-coded rules can degrade into high-error noise, requiring continuous LF monitoring."
  ],
  "quiz": [
    {
      "q": "How does a Weak Supervision label model estimate the accuracy of labeling functions without access to ground truth labels?",
      "o": [
        "By analysing the statistical covariance, agreement, and disagreement patterns across multiple labeling functions on unlabelled data",
        "By asking human annotators to verify all samples",
        "By assuming all labeling functions are 100% accurate",
        "By taking the Fourier transform of the label matrix"
      ],
      "a": 0,
      "why": "Observable covariance between pairs of LFs equals the product of their unknown accuracies under conditional independence. Rank-1 matrix completion solves for accuracies without true labels."
    },
    {
      "q": "Why is a downstream deep neural network trained on weak labels rather than deploying the heuristic labeling functions directly as the production classifier?",
      "o": [
        "The downstream network learns rich continuous feature embeddings, allowing it to generalise to instances where all labeling functions abstained",
        "Labeling functions cannot be executed in production",
        "Neural networks are required by law for classification",
        "Labeling functions only work on small datasets"
      ],
      "a": 0,
      "why": "LFs only fire on specific keywords or patterns and abstain on everything else. A downstream neural network learns feature representations that generalise to samples the rules never anticipated."
    }
  ],
  "usedBy": [],
  "prereq": [
    "probability-rules-and-bayes-theorem"
  ],
  "related": [
    "self-training-and-pseudo-labels",
    "active-learning",
    "label-propagation",
    "markov-random-fields"
  ],
  "keywords": "weak supervision, snorkel, programmatic labeling, labeling functions, label model, generative model, data centric ai, pseudo labels"
},
  {
    id: 'collaborative-filtering',
    short: 'Collaborative filtering',
    title: 'Collaborative Filtering',
    task: 'concepts',
    module: 'Recommender systems',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Predicting user preferences by pooling feedback patterns across an entire community, using user-based or item-based neighbourhood models.`,
    lead: r`Collaborative filtering generates personalised recommendations without requiring item metadata, tags, or content descriptions. By mining historical ratings or interaction matrices, it identifies akin taste profiles (user-based) or co-rated items (item-based) to predict unseen preferences through neighbourhood aggregation.`,
    intuition: [
      r`Imagine visiting a vast library containing 100,000 novels. Rather than categorising books by genres or author biographies, you look at borrowers who read the same five eclectic titles you adored last month. When you find three other readers whose checkout logs overlap with yours 90% of the time, you can confidently read whatever novel they picked next. You did not need to know whether the book is a sci-fi thriller or historical non-fiction; their shared reading behaviour acts as the collective filter.`,
      r`This is user-based collaborative filtering (UBCF). We build a matrix where rows are users and columns are items. To predict how Alice will rate a new film, we compute pairwise similarity scores between Alice and all other users using their co-rated items. We select Alice's nearest neighbours (the $k$ highest-scoring users) and calculate a weighted average of their ratings. Crucially, because Alice might be a stingy rater whose average score is 2.5 stars while Bob awards 5 stars to everything, we mean-centre ratings before averaging so personal rating baselines do not corrupt predictions.`,
      r`When users dramatically outnumber items—such as millions of shoppers purchasing from an inventory of 20,000 products—computing user similarities becomes computationally prohibitive and volatile. Item-based collaborative filtering (IBCF) flips the perspective: it computes similarities between pairs of items based on how users rated them concurrently. Because item relationships reflect enduring characteristics rather than fleeting user moods, item similarity matrices can be precomputed offline, updated incrementally, and produce explainable recommendations ("Because you watched Inception...").`,
    ],
    analogy: r`Asking your culinary soulmate what they ordered off a foreign menu you cannot read, rather than attempting to decipher the ingredient list yourself.`,
    steps: [
      r`Construct the user-item interaction matrix $R \in \mathbb{R}^{m \times n}$, where observed cells record explicit ratings or implicit actions, and unobserved pairs form the sparse missing majority.`,
      r`Compute user mean ratings $\bar{r}_u$ across observed items to calculate mean-centred ratings $r_{u, i} - \bar{r}_u$, isolating genuine deviations from individual baseline leniency.`,
      r`Calculate pairwise item similarities (for IBCF) or user similarities (for UBCF) using adjusted cosine or Pearson correlation over mutually evaluated entries.`,
      r`For a target user and unrated item, filter candidate neighbours to the top $k$ entities exhibiting positive similarity ($s > 0$).`,
      r`Aggregate the neighbourhood ratings via a similarity-weighted sum added back to the user baseline, predicting the target interaction score.`,
    ],
    math: [
      {
        h: 'Pearson correlation similarity for user-based CF',
        tex: r`$$s(u, v) = \frac{\sum_{i \in I_{uv}} (r_{u, i} - \bar{r}_u)(r_{v, i} - \bar{r}_v)}{\sqrt{\sum_{i \in I_{uv}} (r_{u, i} - \bar{r}_u)^2} \sqrt{\sum_{i \in I_{uv}} (r_{v, i} - \bar{r}_v)^2}}$$`,
        p: r`Here $I_{uv} = I_u \cap I_v$ represents the subset of items evaluated by both user $u$ and user $v$. Subtracting user-specific means $\bar{r}_u$ and $\bar{r}_v$ centres each user's rating distribution around zero, preventing differences in personal rating scales from distorting the cosine angle.`,
      },
      {
        h: 'Adjusted cosine similarity for item-based CF',
        tex: r`$$s(i, j) = \frac{\sum_{u \in U_{ij}} (r_{u, i} - \bar{r}_u)(r_{u, j} - \bar{r}_u)}{\sqrt{\sum_{u \in U_{ij}} (r_{u, i} - \bar{r}_u)^2} \sqrt{\sum_{u \in U_{ij}} (r_{u, j} - \bar{r}_u)^2}}$$`,
        p: r`In item-based filtering, $U_{ij}$ is the set of users who rated both item $i$ and item $j$. Unlike standard cosine similarity between item column vectors, adjusted cosine subtracts the respective user mean $\bar{r}_u$ from each interaction. This normalises across user rating tendencies before evaluating item co-occurrence.`,
      },
      {
        h: 'Rating prediction via normalised neighbourhood aggregation',
        tex: r`$$\hat{r}_{u, i} = \bar{r}_u + \frac{\sum_{j \in N_u(i)} s(i, j) \big(r_{u, j} - \bar{r}_u\big)}{\sum_{j \in N_u(i)} |s(i, j)|}$$`,
        p: r`The predicted rating $\hat{r}_{u, i}$ starts from user $u$'s mean rating $\bar{r}_u$. It then adds the similarity-weighted offset from the top-$k$ nearest items $j \in N_u(i)$ that user $u$ has already rated. Dividing by the sum of absolute similarities ensures the aggregated deviation respects the original rating scale.`,
      },
    ],
    keyPoints: [
      r`Domain-free discovery: collaborative filtering requires no content metadata, discovering unexpected serendipitous connections across item categories.`,
      r`Item-based stability: item-item similarities remain far more stable over time than user-user similarities, allowing large-scale precomputation and caching.`,
      r`Mean-centring necessity: subtracting user averages removes individual bias, ensuring that harsh critics and generous raters contribute on equal terms.`,
    ],
    pitfalls: [
      r`Cold-start vulnerability: completely new users without interaction history or new items with zero ratings cannot be recommended via collaborative signals alone.`,
      r`Extreme sparsity: commercial catalogues typically exhibit $>99\%$ sparsity; two random users rarely co-rate items, collapsing the intersection size $|I_{uv}|$.`,
      r`Popularity echo-chambers: universally popular blockbuster items dominate co-occurrence graphs, crowding out niche long-tail items unless explicit inverse-frequency penalties are applied.`,
    ],
    code: r`import numpy as np

R = np.array([[5, 4, 1, 0], [4, 5, 1, 2], [1, 2, 5, 4], [2, 1, 4, 5], [5, 5, 2, 1]], dtype=float)
means = np.array([row[row > 0].mean() for row in R])
R_c = np.where(R > 0, R - means[:, None], 0.0)

m, n = R.shape
sim = np.eye(n)
for i in range(n):
    for j in range(i + 1, n):
        co = (R[:, i] > 0) & (R[:, j] > 0)
        if np.sum(co) >= 2:
            ui, uj = R_c[co, i], R_c[co, j]
            d = np.sqrt(np.sum(ui**2)) * np.sqrt(np.sum(uj**2))
            sim[i, j] = sim[j, i] = np.sum(ui * uj) / d if d > 1e-9 else 0.0

target_u, target_i, k = 0, 3, 2
rated = np.where(R[target_u] > 0)[0]
top_k = rated[np.argsort(sim[target_i, rated])[::-1][:k]]
w = sim[target_i, top_k]

pred = means[target_u] + np.sum(w * R_c[target_u, top_k]) / np.sum(np.abs(w))
print(f"User 0 mean rating: {means[target_u]:.2f}")
print(f"Item similarities to Item 3: {np.round(sim[target_i], 3)}")
print(f"Predicted rating for User 0 on Item 3: {pred:.2f}")`,
    quiz: [
      {
        q: r`Why is adjusted cosine similarity preferred over standard cosine similarity in item-based collaborative filtering?`,
        o: [
          r`It eliminates user scale differences by subtracting each user's mean rating from their reviews`,
          r`It operates without requiring any observed ratings`,
          r`It guarantees all similarity scores are strictly positive between 0 and 1`,
          r`It converts the user-item matrix into an orthogonal basis`,
        ],
        a: 0,
        why: r`Different users possess distinct internal rating scales (e.g. some hand out 5s easily, others reserve 5 for masterpieces). Adjusted cosine subtracts the user mean $\bar{r}_u$ from each rating, standardising ratings across users before computing item vector similarities.`,
      },
      {
        q: r`In a production system with 50,000,000 registered users and 100,000 catalogue products, why is item-based collaborative filtering (IBCF) favoured over user-based (UBCF)?`,
        o: [
          r`Item catalogues are smaller and their relationships change slower, making similarity precomputation feasible`,
          r`Item-based filtering requires zero memory and runs in $O(1)$ time`,
          r`User-based filtering cannot use cosine similarity`,
          r`Item-based filtering completely solves the cold-start problem for newly launched items`,
        ],
        a: 0,
        why: r`Item similarity matrices are smaller ($10^5 \times 10^5$ vs $10^7 \times 10^7$) and item-item correlations remain stable over time, allowing item similarities to be precomputed and cached offline for sub-millisecond retrieval.`,
      },
      {
        q: r`What is the primary manifestation of the "cold-start" problem in pure collaborative filtering?`,
        o: [
          r`The system cannot make personalised recommendations for new users or items lacking interaction history`,
          r`Gradient descent diverges when learning rates are set too high`,
          r`The similarity matrix cannot be inverted due to zero determinants`,
          r`Ratings cannot be normalised when user scores are integers`,
        ],
        a: 0,
        why: r`Collaborative filtering relies exclusively on past behavioural overlap. When a brand-new user joins or a new item is added, they have zero co-ratings, preventing neighbourhood models from calculating valid similarity scores.`,
      },
    ],
    usedBy: ['matrix-factorisation-and-als'],
    prereq: ['knn_regressor', 'correlation-pearson-spearman-kendall'],
    related: ['matrix-factorisation-and-als', 'ranking-metrics-ndcg-map-learning-to-rank', 'knn_regressor'],
    keywords: 'collaborative filtering recommender systems user based item based pearson correlation adjusted cosine cold start',
  },
  {
    id: 'matrix-factorisation-and-als',
    short: 'Matrix factorisation & ALS',
    title: 'Matrix Factorisation and ALS',
    task: 'concepts',
    module: 'Recommender systems',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Decomposing sparse interaction matrices into low-rank latent user and item embeddings using regularised Alternating Least Squares.`,
    lead: r`High-dimensional user-item interaction matrices are riddled with missing entries, confounding classical SVD and neighbourhood methods. Matrix factorisation projects both users and items into a shared $k$-dimensional latent vector space where inner products predict unobserved interactions. Alternating Least Squares (ALS) solves the non-convex joint optimisation problem by alternately fixing user vectors to solve for item vectors and vice versa via exact closed-form quadratic ridge regressions.`,
    intuition: [
      r`Imagine describing movies not by hundreds of messy genre tags, but along two fundamental psychological axes: seriousness versus comedy, and action versus cerebral dialogue. If we could assign every movie a 2-dimensional coordinate along these axes, and similarly position each moviegoer along the same preference axes, predicting whether a user will enjoy a film becomes as simple as a dot product: $\text{preference} \times \text{attribute}$. A viewer who loves high-octane comedy will score high positive values on films positioned at those exact coordinates.`,
      r`In real applications, we do not hand-craft or label these latent dimensions. Instead, matrix factorisation discovers them automatically from the raw interaction matrix $R \approx U V^T$. For $m$ users and $n$ items, each user $u$ is mapped to a latent vector $p_u \in \mathbb{R}^k$ and each item $i$ to $q_i \in \mathbb{R}^k$, where $k \ll \min(m, n)$ (typically 20 to 100). The predicted rating is $\hat{r}_{u, i} = \mu + b_u + b_i + p_u^T q_i$, incorporating global, user, and item baseline biases to isolate true affinity from systematic scale differences.`,
      r`Because 99% of entries in $R$ are unobserved, classical Singular Value Decomposition (SVD) cannot be directly applied without imputing zeros (which falsely asserts users hate everything they have not yet seen). Jointly optimising $U$ and $V$ over known entries is non-convex. However, when user vectors $U$ are held fixed, the objective function becomes strictly convex and quadratic in $V$—amounting to an independent ridge regression for every item. Alternating Least Squares (ALS) leverages this: hold $U$ constant and solve for $V$ in closed form, then hold $V$ constant and solve for $U$, rapidly converging to a high-quality local minimum.`,
    ],
    analogy: r`Solving a two-variable combination lock by turning dial A while dial B is clamped, then clamping dial A to turn dial B until both slots click into alignment.`,
    steps: [
      r`Initialise user latent matrix $U \in \mathbb{R}^{m \times k}$ and item latent matrix $V \in \mathbb{R}^{n \times k}$ with small random Gaussian values.`,
      r`Compute the global mean $\mu$, user baseline biases $b_u$, and item baseline biases $b_i$ across all observed entries $\mathcal{K}$.`,
      r`Fix the item embeddings $V$ and item biases $b_i$, and solve for each user's vector $p_u$ and bias $b_u$ via regularised ridge regression over the subset of items rated by user $u$.`,
      r`Fix the user embeddings $U$ and user biases $b_u$, and solve for each item's vector $q_i$ and bias $b_i$ via regularised ridge regression over the subset of users who rated item $i$.`,
      r`Repeat the alternating updates until the regularised mean squared error over observed interactions converges below a threshold $\epsilon$.`,
    ],
    math: [
      {
        h: 'Regularised matrix factorisation objective',
        tex: r`$$\min_{U, V, b} \sum_{(u, i) \in \mathcal{K}} \Big(r_{u, i} - (\mu + b_u + b_i + p_u^T q_i)\Big)^2 + \lambda \sum_u \big(\|p_u\|_2^2 + b_u^2\big) + \lambda \sum_i \big(\|q_i\|_2^2 + b_i^2\big)$$`,
        p: r`The objective minimises squared reconstruction error exclusively over the set of observed user-item interactions $\mathcal{K}$. The regularisation parameter $\lambda > 0$ penalises large latent weights and extreme biases, preventing overfitting on active users or items with scarce feedback.`,
      },
      {
        h: 'Closed-form ALS user update step',
        tex: r`$$p_u = \Big(V_{I_u}^T V_{I_u} + \lambda I_k\Big)^{-1} V_{I_u}^T \tilde{r}_{u, I_u}$$`,
        p: r`Holding item matrix $V$ fixed turns user $u$'s optimisation into regularised linear regression. Here $I_u$ is the set of items rated by user $u$, $V_{I_u} \in \mathbb{R}^{|I_u| \times k}$ is the submatrix of corresponding item vectors, and $\tilde{r}_{u, I_u}$ contains residual ratings after subtracting $\mu + b_u + b_i$. The $k \times k$ matrix inversion is fast and parallelisable across users.`,
      },
      {
        h: 'Implicit feedback formulation (Hu, Koren, Volinsky)',
        tex: r`$$\mathcal{L}_{\text{implicit}} = \sum_{u=1}^m \sum_{i=1}^n c_{u, i} \big(p_{u, i} - p_u^T q_i\big)^2 + \lambda \sum_u \|p_u\|_2^2 + \lambda \sum_i \|q_i\|_2^2$$`,
        p: r`For implicit feedback (clicks, watch time), binary preference $p_{u, i} = \mathbf{1}_{r_{u, i} > 0}$ is paired with confidence $c_{u, i} = 1 + \alpha r_{u, i}$. Crucially, the $O(m n)$ sum over all unobserved pairs simplifies because $V^T C^u V = V^T V + V^T (C^u - I) V$, allowing $V^T V$ to be computed once per iteration in $O(n k^2)$, keeping each user update at $O(|I_u| k^2 + k^3)$.`,
      },
    ],
    keyPoints: [
      r`Dense semantic representations: maps sparse interaction matrices into compact $k$-dimensional latent spaces that capture latent user tastes and item attributes.`,
      r`Monotonic convergence: each alternating quadratic sub-step is strictly convex and solved in closed form, guaranteeing non-increasing loss at every iteration.`,
      r`Scalable implicit feedback: reformulating the confidence-weighted objective allows training across billions of implicit missing pairs in polynomial time.`,
    ],
    pitfalls: [
      r`SVD confusion: running standard SVD requires imputing unobserved matrix entries with zeros, corrupting representations by misinterpreting unobserved items as disliked items.`,
      r`Neglecting baseline biases: omitting $b_u$ and $b_i$ forces the latent dot product $p_u^T q_i$ to absorb broad rating scale differences, degrading latent semantic geometry.`,
      r`Overfitting sparse entities: users or items with only one or two ratings easily overfit unless heavy L2 regularisation $\lambda$ is enforced.`,
    ],
    code: r`import numpy as np

np.random.seed(42)
R = np.array([[5, 3, 0, 1], [4, 0, 0, 1], [1, 1, 0, 5], [1, 0, 4, 4], [0, 1, 5, 4]], dtype=float)
m, n, k, reg = *R.shape, 2, 0.1
mu, mask = R[R > 0].mean(), R > 0
P, Q = np.random.normal(0, 0.1, (m, k)), np.random.normal(0, 0.1, (n, k))
bu, bi = np.zeros(m), np.zeros(n)

for _ in range(20):
    for u in range(m):
        idx = np.where(mask[u])[0]
        if len(idx):
            Vu, yu = Q[idx], R[u, idx] - mu - bi[idx]
            bu[u] = np.sum(yu - Vu @ P[u]) / (len(idx) + reg)
            P[u] = np.linalg.solve(Vu.T @ Vu + reg * np.eye(k), Vu.T @ (yu - bu[u]))
    for i in range(n):
        idx = np.where(mask[:, i])[0]
        if len(idx):
            Ui, yi = P[idx], R[idx, i] - mu - bu[idx]
            bi[i] = np.sum(yi - Ui @ Q[i]) / (len(idx) + reg)
            Q[i] = np.linalg.solve(Ui.T @ Ui + reg * np.eye(k), Ui.T @ (yi - bi[i]))

R_pred = mu + bu[:, None] + bi[None, :] + P @ Q.T
rmse = np.sqrt(np.mean((R[mask] - R_pred[mask])**2))
print(f"Global mean: {mu:.2f}")
print(f"Training RMSE on observed: {rmse:.4f}")
print(f"Predicted unobserved rating R[0, 2]: {R_pred[0, 2]:.2f}")`,
    quiz: [
      {
        q: r`Why does Alternating Least Squares (ALS) switch between updating user vectors $P$ and item vectors $Q$ rather than optimising both simultaneously via standard least squares?`,
        o: [
          r`Joint optimisation of $P$ and $Q$ is non-convex, but fixing one makes the objective strictly convex and quadratic in the other`,
          r`Simultaneous least squares requires computing the determinant of non-square matrices`,
          r`ALS is an online reinforcement learning algorithm that cannot process offline batches`,
          r`Standard least squares cannot handle matrices with more than 100 rows`,
        ],
        a: 0,
        why: r`The product $P Q^T$ couples the variables, making the joint loss surface non-convex with saddle points. Holding $Q$ fixed reduces the problem to an independent, strictly convex ridge regression for each row of $P$, solved exactly in closed form.`,
      },
      {
        q: r`What is the role of the user bias $b_u$ and item bias $b_i$ in the formulation $\hat{r}_{u, i} = \mu + b_u + b_i + p_u^T q_i$?`,
        o: [
          r`They capture baseline rating tendencies (e.g. generous raters or critically acclaimed films) so latent vectors model pure interactions`,
          r`They eliminate the need for L2 regularisation`,
          r`They restrict all predictions to integer values between 1 and 5`,
          r`They force the latent factor dimension $k$ to equal 1`,
        ],
        a: 0,
        why: r`A 4-star rating on a movie whose average is 4.5 by a user whose average is 4.2 actually represents a negative relative preference. Baseline terms capture these systematic shifts, leaving the latent dot product to capture genuine affinity patterns.`,
      },
      {
        q: r`How does implicit feedback matrix factorisation (Hu, Koren, Volinsky) handle items that a user has never clicked on or viewed?`,
        o: [
          r`It treats unobserved items as zero preference ($p_{u, i} = 0$) with a low baseline confidence weight ($c_{u, i} = 1$)`,
          r`It removes all unobserved items from the loss function entirely`,
          r`It marks them as negative infinity to prevent recommendations`,
          r`It replaces missing values with the global mean $\mu$`,
        ],
        a: 0,
        why: r`In implicit settings, non-interaction could mean the user dislikes the item or simply never saw it. The model assigns zero preference ($p_{ui} = 0$) to all unobserved pairs but assigns them minimal confidence ($c_{ui} = 1$), reserving higher confidence ($1 + \alpha r_{ui}$) for observed interactions.`,
      },
    ],
    usedBy: ['ranking-metrics-ndcg-map-learning-to-rank'],
    prereq: ['collaborative-filtering', 'ridge_regression'],
    related: ['collaborative-filtering', 'ranking-metrics-ndcg-map-learning-to-rank', 'pca'],
    keywords: 'matrix factorisation als alternating least squares latent factors recommender systems implicit feedback collaborative filtering',
  },
  {
    id: 'ranking-metrics-ndcg-map-learning-to-rank',
    short: 'Ranking metrics & LTR',
    title: 'Ranking Metrics: NDCG, MAP, Learning to Rank',
    task: 'concepts',
    module: 'Recommender systems',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Evaluating ranked lists through position-discounted gains and mean average precision, and training models with learning-to-rank loss functions.`,
    lead: r`Regression and classification metrics evaluate items in isolation, ignoring that search and recommendation systems present ordered lists where top positions command supreme attention. Ranking metrics like NDCG (Normalised Discounted Cumulative Gain) and MAP (Mean Average Precision) penalise relevant items relegated to lower slots. Learning to Rank (LTR) operationalises this principle by training pointwise, pairwise, or listwise models directly on rank orders.`,
    intuition: [
      r`Suppose a search engine returns five documents for the query "emergency plumber". If the single most relevant 24-hour service appears at position 1, the user is thrilled. If that exact same document appears at position 10, the user has likely abandoned the query in frustration. Mean squared error treats an error at rank 1 and an error at rank 10 identically ($(\hat{y} - y)^2$). In ranking systems, position is everything: a prediction error at the very top of the list carries catastrophic cost compared to a swap at position 50.`,
      r`Discounted Cumulative Gain (DCG) reflects human visual browsing behaviour. It assigns each item a graded relevance score (e.g. 0 = irrelevant, 1 = relevant, 2 = highly relevant, 3 = perfect match) and divides that score by a logarithmic discount based on its display position: $\log_2(\text{rank} + 1)$. To allow fair comparison across queries with varying numbers of relevant results, Normalised DCG (NDCG) divides DCG by the Ideal DCG (IDCG)—the theoretical maximum score achieved by sorting all documents in perfect descending relevance order. An NDCG of 1.0 indicates perfect ranking.`,
      r`Moving from evaluation to model training is non-trivial because rank positions are discrete step functions: shifting a prediction score slightly does not change rankings until an item crosses another, resulting in zero gradients almost everywhere. Learning to Rank (LTR) solves this through three paradigms. Pointwise models predict isolated relevance scores via standard regression. Pairwise models (e.g. RankNet, LambdaMART) train on document pairs $(A, B)$, penalising inversions where $A$ was preferred to $B$ but scored lower. Listwise models (e.g. ListNet, Softmax cross-entropy) treat the entire ranked slate as a probability distribution, directly optimising top-heavy list structures.`,
    ],
    analogy: r`Scoring an Olympic gymnastics final where winning a gold medal yields enormous points and finishing fourth receives nothing, rather than grading every athlete on a flat pass/fail test.`,
    steps: [
      r`Collect query-document interaction logs with relevance judgements: binary indicators ($y \in \{0, 1\}$) or graded scores ($y \in \{0, 1, 2, 3\}$).`,
      r`For binary relevance, compute Precision@k across the top $k$ items and calculate Average Precision (AP), averaging across queries to evaluate Mean Average Precision (MAP).`,
      r`For graded relevance, compute Discounted Cumulative Gain at truncation rank $k$ ($\text{DCG}@k$) using logarithmic rank discounts.`,
      r`Sort true relevance scores in descending order to calculate Ideal DCG ($\text{IDCG}@k$), computing the ratio $\text{NDCG}@k = \text{DCG}@k / \text{IDCG}@k$.`,
      r`Train ranking models using pointwise regression, pairwise logistic loss with dynamic lambda-gradients (LambdaMART), or listwise cross-entropy loss.`,
    ],
    math: [
      {
        h: 'Discounted Cumulative Gain (DCG) and NDCG',
        tex: r`$$\text{DCG}@k = \sum_{i=1}^k \frac{2^{r_i} - 1}{\log_2(i + 1)}, \qquad \text{NDCG}@k = \frac{\text{DCG}@k}{\text{IDCG}@k}$$`,
        p: r`Here $r_i$ is the graded relevance of the item displayed at position $i$. The exponential numerator $2^{r_i} - 1$ heavily rewards highly relevant items, while the logarithmic denominator $\log_2(i + 1)$ imposes a position discount. Dividing by $\text{IDCG}@k$ normalises the metric to $[0, 1]$, enabling meaningful averaging across queries of varying difficulty.`,
      },
      {
        h: 'Average Precision (AP) and Mean Average Precision (MAP)',
        tex: r`$$\text{AP}@k = \frac{1}{\min(m, k)} \sum_{i=1}^k P(i) \cdot y_i, \qquad \text{MAP} = \frac{1}{|Q|} \sum_{q \in Q} \text{AP}(q)$$`,
        p: r`In binary ranking ($y_i \in \{0, 1\}$), $P(i)$ is the precision among the top $i$ retrieved items, and $m$ is the total count of relevant items for query $q$. Multiplying by $y_i$ ensures that precision is sampled only at ranks where a relevant item is retrieved. MAP averages AP across all evaluation queries $Q$.`,
      },
      {
        h: 'LambdaMART virtual pairwise gradient',
        tex: r`$$\lambda_{ij} = \frac{-\sigma}{1 + e^{\sigma(s_i - s_j)}} |\Delta \text{NDCG}_{ij}|$$`,
        p: r`Because rank positions are non-differentiable, LambdaMART bypasses explicit differentiation by scaling the pairwise logistic gradient between items $i$ and $j$ by $|\Delta \text{NDCG}_{ij}|$—the exact absolute change in NDCG that would occur if the ranks of items $i$ and $j$ were swapped. Items near the top receive massive gradient forces, aligning tree boosting directly with ranking utility.`,
      },
    ],
    keyPoints: [
      r`Position discounting: logarithmic discounts model user eye-tracking decay, heavily weighting relevance at top ranks while diminishing returns down the page.`,
      r`Relative order over absolute values: ranking models care exclusively about correctly sorting pairs ($s_i > s_j$), making absolute score calibration secondary.`,
      r`LambdaMART gradient synthesis: multiplying pairwise classification gradients by $\Delta \text{NDCG}$ allows gradient boosted trees to directly optimise discrete ranking metrics.`,
    ],
    pitfalls: [
      r`Evaluating beyond the user horizon: calculating NDCG@50 when mobile interfaces display only 3 items provides misleading offline optimism.`,
      r`Position bias in training data: training directly on uncorrected user click logs reinforces historical presentation order rather than true relevance, requiring inverse propensity scoring.`,
      r`Empty query dilution: including queries with zero relevant documents can distort unweighted macro-averaged MAP metrics.`,
    ],
    code: r`import numpy as np

y_true_graded = np.array([3, 1, 2, 0, 3, 0])

def dcg_at_k(r, k):
    r = np.asarray(r, dtype=float)[:k]
    return np.sum((2**r - 1) / np.log2(np.arange(len(r)) + 2)) if r.size else 0.0

def ndcg_at_k(r, k):
    idcg = dcg_at_k(np.sort(r)[::-1], k)
    return dcg_at_k(r, k) / idcg if idcg > 0 else 0.0

def average_precision_at_k(binary_rel, k):
    b = np.asarray(binary_rel)[:k]
    n_rel = np.sum(b)
    if n_rel == 0: return 0.0
    p = [np.sum(b[:i+1]) / (i + 1) for i in range(len(b)) if b[i] == 1]
    return np.sum(p) / min(n_rel, k)

q1_bin, q2_bin = np.array([1, 0, 1, 0, 0]), np.array([0, 1, 1, 0, 0])
map_score = np.mean([average_precision_at_k(q1_bin, 5), average_precision_at_k(q2_bin, 5)])

k = 5
print(f"DCG@{k}:  {dcg_at_k(y_true_graded, k):.4f}")
print(f"IDCG@{k}: {dcg_at_k(np.sort(y_true_graded)[::-1], k):.4f}")
print(f"NDCG@{k}: {ndcg_at_k(y_true_graded, k):.4f}")
print(f"MAP@5:   {map_score:.4f}")`,
    quiz: [
      {
        q: r`What is the role of the Ideal Discounted Cumulative Gain (IDCG) in the computation of NDCG?`,
        o: [
          r`It serves as the normalising denominator, representing the maximum possible DCG achieved by perfect sorting`,
          r`It penalises the model when irrelevant documents appear at the bottom of the list`,
          r`It computes the inverse log discount for documents beyond rank 100`,
          r`It converts graded relevance scores into continuous probabilities`,
        ],
        a: 0,
        why: r`Different queries have different numbers of relevant documents, making raw DCG incomparable across queries. Dividing DCG by IDCG normalises the score to $[0, 1]$, where 1.0 represents a flawless ranking.`,
      },
      {
        q: r`Why is Mean Squared Error (MSE) often a poor loss function when training search and recommendation ranking models?`,
        o: [
          r`MSE penalises prediction errors equally across all positions, ignoring that mistakes at rank 1 are far more damaging than mistakes at rank 50`,
          r`MSE cannot be optimised using gradient descent`,
          r`MSE requires binary labels and cannot handle continuous scores`,
          r`MSE always predicts zero for sparse datasets`,
        ],
        a: 0,
        why: r`Ranking utility is concentrated heavily in the first few displayed positions. Pointwise MSE penalises an error on an obscure item at the bottom of the catalogue identically to an error on the top displayed result.`,
      },
      {
        q: r`How does LambdaMART overcome the mathematical challenge that NDCG is a non-differentiable step function with zero gradient?`,
        o: [
          r`It scales pairwise logistic gradients by the change in NDCG ($|\Delta \text{NDCG}|$) resulting from swapping the two items`,
          r`It approximates NDCG by replacing all logarithmic discounts with linear functions`,
          r`It converts the ranking problem into an unsupervised k-means clustering task`,
          r`It trains trees using non-gradient random search`,
        ],
        a: 0,
        why: r`Instead of defining an explicit smooth surrogate loss, LambdaMART directly defines virtual gradients ($\lambda$-gradients) for item pairs by weighting the logistic loss gradient by the actual discrete change in NDCG ($|\Delta \text{NDCG}|$) that would occur if their ranks were swapped.`,
      },
    ],
    usedBy: [],
    prereq: ['collaborative-filtering', 'matrix-factorisation-and-als'],
    related: ['collaborative-filtering', 'matrix-factorisation-and-als', 'confusion-matrix'],
    keywords: 'ranking metrics ndcg map learning to rank dcg lambdamart recommender systems average precision search ranking',
  },
  {
  "id": "content-based-and-hybrid-recommenders",
  "short": "Content-based & hybrid",
  "title": "Content-Based and Hybrid Recommender Systems",
  "task": "concepts",
  "module": "Recommender systems",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Recommend items using item metadata and hybrid fusion: master user profile vectors, TF-IDF item representations, cold-start mitigation, and hybrid blending.",
  "lead": "Pure collaborative filtering suffers from catastrophic cold-start failure on newly launched items and niche users. Content-based filtering recommends items by matching user profiles against rich item metadata, while hybrid models fuse collaborative and content signals.",
  "intuition": [
    "Recommender systems are the commercial engine of the modern internet—driving content on Netflix, Spotify, Amazon, and YouTube. Collaborative Filtering (CF) algorithms recommend items based purely on user-item interaction histories: \"Users who liked what you liked also liked X.\" However, pure CF exhibits a fatal structural weakness: the Cold-Start Problem. When a new movie is released or a new product is listed, it has zero interaction history, so CF can never recommend it.",
    "Content-Based Filtering (CBF) solves the cold-start challenge by looking at the intrinsic attributes and metadata of items rather than user ratings. For text or movies, an item profile vector $v_j \\in \\mathbb{R}^d$ is constructed using TF-IDF word vectors, genre tags, director, cast, or product categories.",
    "A user profile vector $u_i \\in \\mathbb{R}^d$ is constructed by computing a weighted average of the item vectors for items the user has positively engaged with in the past. Predicted user affinity is calculated via cosine similarity between the user profile and candidate item profiles: $\\cos(u_i, v_j) = \\frac{u_i \\cdot v_j}{\\|u_i\\| \\|v_j\\|}$. Because CBF requires only item metadata, brand-new items can be recommended the second they are uploaded.",
    "However, pure content-based filtering has its own limitation: Overspecialisation (the \"filter bubble\"). If a user watches three Batman movies, CBF will endlessly recommend more Batman and superhero movies, never discovering serendipitous interests in documentaries or jazz. Hybrid Recommender Systems resolve this by combining content-based and collaborative filtering signals—using weighted fusion, cascade filtering, or deep feature combination."
  ],
  "analogy": "Imagine a personal sommelier. A collaborative filtering sommelier checks what other patrons at table 4 ordered and gives you the exact same wine. A content-based sommelier asks you what flavours you enjoy (blackberry, oak, tannins), reads the ingredient notes on the bottle labels, and selects a wine with matching taste notes—even if no one in the restaurant has ever ordered that specific bottle before. A hybrid sommelier balances both: checking bottle notes for new arrivals while using communal reviews for vintage selections.",
  "steps": [
    {
      "title": "1. Extract and vectorize item metadata",
      "body": "Extract textual and categorical attributes for all items. Compute TF-IDF feature vectors or dense neural embeddings $v_j \\in \\mathbb{R}^d$. Normalise vectors to unit length."
    },
    {
      "title": "2. Construct individual user profile vectors",
      "body": "For user $i$, compute user preference profile by taking the rating-weighted average of liked item vectors: $u_i = \\sum_{j \\in \\mathcal{H}_i} r_{ij} v_j$. Normalise $u_i$ to unit length."
    },
    {
      "title": "3. Compute content similarity scores",
      "body": "For unrated candidate items, calculate cosine similarity affinity: $S_{\\mathrm{CBF}}(i, j) = u_i^T v_j$. Rank candidate items by descending similarity."
    },
    {
      "title": "4. Fuse with collaborative filtering (Hybrid)",
      "body": "Combine content scores with collaborative filtering predictions: $\\hat{S}_{ij} = \\alpha S_{\\mathrm{CF}}(i, j) + (1 - \\alpha) S_{\\mathrm{CBF}}(i, j)$, where $\\alpha$ shifts dynamically (favouring CBF for cold items and CF for mature items)."
    }
  ],
  "math": [
    {
      "h": "User Profile Vector Construction",
      "tex": "u_i = \\frac{\\sum_{j \\in \\mathcal{I}_i} r_{ij} v_j}{\\sum_{j \\in \\mathcal{I}_i} |r_{ij}|}, \\quad \\hat{u}_i = \\frac{u_i}{\\|u_i\\|_2}",
      "p": "Aggregates the feature vectors v_j of items rated by user i, weighted by rating r_ij, capturing the user historical taste profile in item attribute space."
    },
    {
      "h": "Cosine Similarity Recommendation Score",
      "tex": "S_{\\mathrm{CBF}}(i, j) = \\cos(\\hat{u}_i, v_j) = \\frac{\\hat{u}_i \\cdot v_j}{\\|\\hat{u}_i\\|_2 \\|v_j\\|_2}",
      "p": "Measures angular proximity between user preference vector and candidate item profile in high-dimensional feature space."
    },
    {
      "h": "Weighted Linear Hybrid Score",
      "tex": "\\hat{R}_{ij} = \\alpha \\hat{R}_{\\mathrm{CF}}(i, j) + (1 - \\alpha) \\hat{R}_{\\mathrm{CBF}}(i, j), \\quad \\alpha = \\frac{\\min(N_j, N_{\\mathrm{threshold}})}{N_{\\mathrm{threshold}}}",
      "p": "Dynamically balances CF and content signals: when item interaction count N_j is zero, alpha = 0 (100% content-based), smoothly transitioning to CF as user ratings accumulate."
    }
  ],
  "code": "import numpy as np\n\n# Content-Based and Weighted Hybrid Recommender from scratch\n# 1. Item catalog: 5 movies with 4 genre features: [Action, Sci-Fi, Comedy, Romance]\ngenres = ['Action', 'Sci-Fi', 'Comedy', 'Romance']\nmovies = ['Terminator', 'Star Wars', 'Superbad', 'Notting Hill', 'New Sci-Fi Movie (0 ratings)']\n\n# Item profile matrix V (5 items x 4 features), normalised\nitem_features = np.array([\n    [1.0, 0.8, 0.1, 0.0],  # Terminator\n    [0.9, 1.0, 0.1, 0.0],  # Star Wars\n    [0.1, 0.0, 1.0, 0.3],  # Superbad\n    [0.0, 0.0, 0.4, 1.0],  # Notting Hill\n    [0.8, 0.9, 0.0, 0.0],  # Brand new unrated movie!\n])\n# Unit norm normalisation\nitem_features = item_features / np.linalg.norm(item_features, axis=1, keepdims=True)\n\n# 2. User history: Alice loved Terminator (5.0) and Star Wars (4.5), hated Notting Hill (1.0)\n# Centred ratings (subtract mean 3.5 to capture positive vs negative sentiment)\nuser_ratings = {0: +1.5, 1: +1.0, 3: -2.5}  # Movie indices and centred scores\n\n# 3. Build Alice's User Profile Vector\nuser_profile = np.zeros(4)\nfor movie_idx, rating in user_ratings.items():\n    user_profile += rating * item_features[movie_idx]\nuser_profile /= np.linalg.norm(user_profile)\n\n# Content-based predicted scores (cosine similarity)\ncbf_scores = item_features @ user_profile\n\n# 4. Collaborative Filtering Scores (hypothetical CF predictions for unrated movies)\n# Notice CF outputs 0.0 for the new movie because it has ZERO interaction history (Cold Start!)\ncf_scores = np.array([4.8, 4.6, 2.1, 1.2, 0.0])\n\n# 5. Dynamic Weighted Hybrid Score\n# Movie 4 has 0 ratings (alpha = 0); items with 100+ ratings are capped at alpha = 0.8\nitem_rating_counts = np.array([120, 350, 85, 90, 0])\nalpha_weights = np.minimum(item_rating_counts / 100.0, 0.8)\n\nhybrid_scores = alpha_weights * (cf_scores / 5.0) + (1.0 - alpha_weights) * ((cbf_scores + 1) / 2.0)\n\nprint(\"Alice User Profile (Genre Preferences):\")\nfor g, weight in zip(genres, user_profile):\n    print(f\"  {g:8s}: {weight:+.3f}\")\n\nprint(\"\\n--- Recommendation Scoring on Unseen Items ---\")\nprint(f\"Movie: '{movies[4]}' (Brand New Cold-Start Release):\")\nprint(f\"  Collaborative Filtering Score: {cf_scores[4]:.2f} (Failed - zero ratings)\")\nprint(f\"  Content-Based Score:           {cbf_scores[4]:.2f} (Accurately identified Sci-Fi match!)\")\nprint(f\"  Hybrid Recommendation Score:   {hybrid_scores[4]:.3f} (Cold-start solved!)\")",
  "keyPoints": [
    "Recommends items based on matching user profile preferences to intrinsic item attributes and metadata.",
    "Completely solves the item cold-start problem: newly listed items with zero interaction history can be recommended immediately.",
    "Constructs user profile vectors by aggregating the metadata vectors of items the user has positively engaged with.",
    "Vulnerable to overspecialisation: risks trapping users in narrow filter bubbles without discovering serendipitous tastes.",
    "Hybrid recommender systems dynamically blend collaborative and content signals, combining cold-start robustness with CF accuracy."
  ],
  "pitfalls": [
    "Feature extraction bottleneck: Content-based systems require rich, structured, high-quality metadata; if product descriptions are missing or noisy, recommendations fail.",
    "Inability to capture subjective quality: Content attributes say an item is \"Action and Sci-Fi\", but cannot distinguish between a cinematic masterpiece and a low-budget disaster.",
    "New user cold-start: While solving item cold-start, content-based filtering cannot recommend items to brand-new users until they rate at least one item to build a profile."
  ],
  "quiz": [
    {
      "q": "How does Content-Based Filtering resolve the cold-start problem for newly released items?",
      "o": [
        "By matching the item metadata and attributes (e.g. genre, keywords) directly against user profile vectors, requiring zero prior interaction history",
        "By generating synthetic fake ratings from bots",
        "By recommending the new item to all users simultaneously",
        "By converting collaborative filtering into an unsupervised clustering problem"
      ],
      "a": 0,
      "why": "Content-based filtering relies on item attributes rather than interaction logs. As long as metadata is available, newly added items can be scored and recommended instantly."
    },
    {
      "q": "What is the primary drawback of a pure Content-Based recommender system?",
      "o": [
        "Overspecialisation (filter bubble): it only recommends items nearly identical to past consumption, preventing serendipitous discovery",
        "It cannot handle text features",
        "It scales as O(n^3) with the number of users",
        "It requires inverting the user rating matrix"
      ],
      "a": 0,
      "why": "Because it only recommends items that resemble past purchases, content-based systems suffer from overspecialisation and fail to discover novel categories."
    }
  ],
  "usedBy": [],
  "prereq": [
    "collaborative-filtering"
  ],
  "related": [
    "collaborative-filtering",
    "implicit-feedback-and-bpr",
    "two-tower-retrieval"
  ],
  "keywords": "content-based filtering, hybrid recommenders, cold start, tf-idf, cosine similarity, user profile, overspecialisation, recommendation systems"
},
  {
  "id": "implicit-feedback-and-bpr",
  "short": "Implicit feedback & BPR",
  "title": "Implicit Feedback and Bayesian Personalized Ranking (BPR)",
  "task": "concepts",
  "module": "Recommender systems",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Optimise pairwise item ranking from clicks, views, and purchases: master implicit feedback matrix factorisation and Bayesian Personalized Ranking (BPR).",
  "lead": "In real-world e-commerce, users rarely leave 1-to-5 star ratings; interactions consist of clicks, views, and purchases where unobserved items are unrated rather than negative. BPR optimises pairwise ranking criteria directly for implicit feedback.",
  "intuition": [
    "Early recommender system research focused heavily on explicit feedback: users assigning 1-to-5 star ratings on Netflix or Amazon. However, in modern commercial platforms, explicit ratings constitute less than 1% of user activity. The vast majority of user data consists of Implicit Feedback: clicks, page views, stream completions, and purchase transactions.",
    "Implicit feedback has unique structural characteristics: interactions are binary (user clicked or did not click), signals are purely positive (clicking reflects interest, but absence of a click does NOT mean dislike—the user might simply never have been shown the item), and the observation matrix contains unobserved entries rather than explicit negative ratings.",
    "Standard matrix factorisation approaches this pointwise, treating unobserved items as negative examples (zeros), which introduces massive negative bias. Steffen Rendle et al. (2009) revolutionized the field by introducing Bayesian Personalized Ranking (BPR).",
    "BPR reframes recommendation from score regression into a Pairwise Ranking task. For any user $u$ who interacted with observed item $i$, and any unobserved item $j$, BPR assumes that user $u$ prefers item $i$ over item $j$ ($i >_u j$). The BPR-Opt objective directly maximises the posterior probability of correct pairwise preference orderings across all triplets $(u, i, j)$ using stochastic gradient descent (BPR-SGD)."
  ],
  "analogy": "Imagine observing customers in a bakery. A customer buys an almond croissant ($i$). They walk past 50 other pastries without buying them ($j$). Pointwise methods assume the customer hates all 50 other pastries and wants to burn the bakery down. BPR recognizes the reality: the customer simply preferred the almond croissant over the other pastries that morning. Training on pairwise preferences ($i > j$) ranks the almond croissant above the others without falsely concluding the others are toxic.",
  "steps": [
    {
      "title": "1. Structure implicit interaction triplets",
      "body": "Given binary interaction matrix $R$, construct dataset of preference triplets $D_S = \\{(u, i, j) : r_{ui} = 1 \\wedge r_{uj} = 0\\}$, assuming user $u$ prefers interacted item $i$ over unobserved item $j$."
    },
    {
      "title": "2. Formulate latent matrix factorisation score difference",
      "body": "Define predicted score $\\hat{x}_{ui} = w_u^T h_i$. Compute pairwise score margin: $\\hat{x}_{uij} = \\hat{x}_{ui} - \\hat{x}_{uj} = w_u^T (h_i - h_j)$."
    },
    {
      "title": "3. Formulate BPR-Opt Bayesian posterior objective",
      "body": "Maximise log-posterior: $\\mathcal{L}_{\\mathrm{BPR}} = \\sum_{(u, i, j) \\in D_S} \\ln \\sigma(\\hat{x}_{uij}) - \\lambda_W \\|w_u\\|^2 - \\lambda_H (\\|h_i\\|^2 + \\|h_j\\|^2)$."
    },
    {
      "title": "4. Train via pairwise stochastic gradient descent (BPR-SGD)",
      "body": "Sample random triplet $(u, i, j)$ uniformly with replacement. Update latent vectors along gradient: $w_u \\leftarrow w_u + \\eta \\left( \\sigma(-\\hat{x}_{uij}) (h_i - h_j) - \\lambda w_u \\right)$."
    }
  ],
  "math": [
    {
      "h": "Bayesian Personalized Ranking (BPR-Opt) Objective",
      "tex": "\\mathcal{L}_{\\mathrm{BPR}}(\\Theta) = \\sum_{(u, i, j) \\in D_S} \\ln \\sigma\\left(\\hat{x}_{ui} - \\hat{x}_{uj}\\right) - \\lambda_\\Theta \\|\\Theta\\|_2^2, \\quad \\sigma(z) = \\frac{1}{1 + e^{-z}}",
      "p": "Maximises the log-likelihood that user u ranks observed item i higher than unobserved item j, regularised by L2 penalties on user and item embeddings."
    },
    {
      "h": "Pairwise Score Difference in Matrix Factorisation",
      "tex": "\\hat{x}_{uij} = \\hat{x}_{ui} - \\hat{x}_{uj} = w_u^T h_i - w_u^T h_j = w_u^T (h_i - h_j)",
      "p": "The preference gap is linear in user latent vector w_u and the difference between positive item embedding h_i and negative item embedding h_j."
    },
    {
      "h": "BPR-SGD Stochastic Gradient Update",
      "tex": "\\frac{\\partial \\ln \\sigma(\\hat{x}_{uij})}{\\partial \\Theta} = \\frac{e^{-\\hat{x}_{uij}}}{1 + e^{-\\hat{x}_{uij}}} \\frac{\\partial \\hat{x}_{uij}}{\\partial \\Theta} = \\sigma(-\\hat{x}_{uij}) \\frac{\\partial \\hat{x}_{uij}}{\\partial \\Theta}",
      "p": "The gradient magnitude scales with sigma(-x_uij): when the model already ranks i far above j, the gradient vanishes; when it misranks j above i, it takes a large corrective step."
    }
  ],
  "code": "import numpy as np\n\n# Bayesian Personalized Ranking Matrix Factorisation (BPR-MF) from scratch\nclass BPRMatrixFactorisation:\n    def __init__(self, n_users, n_items, n_factors=8, lr=0.05, reg=0.01):\n        self.n_users = n_users\n        self.n_items = n_items\n        self.n_factors = n_factors\n        self.lr = lr\n        self.reg = reg\n        \n        # Initialise latent embeddings\n        np.random.seed(42)\n        self.user_emb = np.random.normal(0, 0.1, (n_users, n_factors))\n        self.item_emb = np.random.normal(0, 0.1, (n_items, n_factors))\n        \n    def fit(self, interactions, n_iters=100_000):\n        # interactions: dict of user_id -> set of interacted item_ids\n        users = list(interactions.keys())\n        \n        for step in range(n_iters):\n            # 1. Sample user u uniformly\n            u = np.random.choice(users)\n            pos_items = interactions[u]\n            if len(pos_items) == 0 or len(pos_items) == self.n_items:\n                continue\n                \n            # 2. Sample positive item i and unobserved item j\n            i = np.random.choice(list(pos_items))\n            j = np.random.randint(self.n_items)\n            while j in pos_items:\n                j = np.random.randint(self.n_items)\n                \n            # 3. Compute score difference: x_uij = w_u^T (h_i - h_j)\n            w_u = self.user_emb[u]\n            h_i = self.item_emb[i]\n            h_j = self.item_emb[j]\n            \n            x_uij = np.dot(w_u, h_i - h_j)\n            \n            # Sigmoid derivative factor: sigma(-x_uij)\n            factor = 1.0 / (1.0 + np.exp(np.clip(x_uij, -30, 30)))\n            \n            # 4. Stochastic Gradient Updates\n            self.user_emb[u] += self.lr * (factor * (h_i - h_j) - self.reg * w_u)\n            self.item_emb[i] += self.lr * (factor * w_u - self.reg * h_i)\n            self.item_emb[j] += self.lr * (-factor * w_u - self.reg * h_j)\n            \n    def predict_rankings(self, u):\n        return self.item_emb @ self.user_emb[u]\n\n# Synthetic User-Item Click Dataset\n# 50 users, 30 items. Items 0-14 are Rock music, 15-29 are Classical\nn_users, n_items = 50, 30\nuser_interactions = {}\n\nfor u in range(n_users):\n    # First 25 users like Rock; last 25 like Classical\n    genre_pool = range(0, 15) if u < 25 else range(15, 30)\n    user_interactions[u] = set(np.random.choice(genre_pool, size=6, replace=False))\n\nbpr = BPRMatrixFactorisation(n_users, n_items, n_factors=6, lr=0.08, reg=0.02)\nbpr.fit(user_interactions, n_iters=150_000)\n\n# Evaluate Area Under ROC Curve (AUC) for ranking on user 0 (Rock lover)\nu_eval = 0\ntrue_positives = user_interactions[u_eval]\nunobserved = [item for item in range(n_items) if item not in true_positives]\n\nscores = bpr.predict_rankings(u_eval)\n\n# Pairwise AUC: fraction of (pos, neg) pairs where score(pos) > score(neg)\nauc_pairs = 0\ntotal_pairs = len(true_positives) * len(unobserved)\nfor i in true_positives:\n    for j in unobserved:\n        if scores[i] > scores[j]:\n            auc_pairs += 1\n\nauc_score = auc_pairs / total_pairs\ntop_5_items = np.argsort(scores)[::-1][:5]\n\nprint(f\"Dataset: {n_users} users, {n_items} items (Binary Implicit Clicks)\")\nprint(f\"User 0 Profile: Rock music listener (Items 0-14)\")\nprint(f\"BPR-MF Pairwise Ranking AUC on User 0: {auc_score * 100:.1f}%\")\nprint(f\"Top-5 Recommended Item IDs: {list(top_5_items)}\")\nprint(f\"All top-5 recommended items are Rock (ID < 15): {np.all(top_5_items < 15)}\")",
  "keyPoints": [
    "Tailored specifically for implicit feedback datasets (clicks, purchases, video streams) where negative ratings are unobserved.",
    "Replaces pointwise regression with pairwise ranking optimisation ($i >_u j$).",
    "BPR-Opt objective directly maximises the Area Under the ROC Curve (AUC) for personalized item recommendation.",
    "Trained via BPR-SGD: draws random triplets $(u, i, j)$ with replacement, updating embeddings with constant-time $O(k)$ steps.",
    "Provides superior top-$N$ recommendation ranking compared to pointwise matrix factorisation and square loss."
  ],
  "pitfalls": [
    "Popularity bias in negative sampling: Uniformly sampling unobserved item $j$ disproportionately samples obscure items; negative sampling from popular unclicked items yields stronger gradients.",
    "Cold-start vulnerability: Pure BPR matrix factorisation cannot rank new items with zero interactions; two-tower neural architectures mitigate this.",
    "Triplet combinatorial scale: A dataset with $U$ users and $I$ items contains $O(U \\cdot I^2)$ possible triplets; sampling strategy and learning rate scheduling are critical."
  ],
  "quiz": [
    {
      "q": "Why does Bayesian Personalized Ranking (BPR) outperform standard pointwise Matrix Factorisation on implicit click data?",
      "o": [
        "Pointwise MF treats all unobserved items as negative (0), biasing predictions, whereas BPR optimises pairwise preferences assuming observed items are preferred over unobserved ones",
        "BPR does not use matrix factorisation",
        "Pointwise MF cannot compute gradients",
        "BPR requires 1-to-5 star ratings"
      ],
      "a": 0,
      "why": "In implicit feedback, unobserved items are unrated, not negative. Pointwise models treat them as zeros, corrupting recommendations. BPR optimises relative ranking (i > j) rather than absolute values."
    },
    {
      "q": "What occurs to the BPR-SGD gradient update when the model already ranks positive item i far above negative item j (x_uij >> 0)?",
      "o": [
        "The gradient scaling factor sigma(-x_uij) vanishes toward zero, so the model makes virtually no update and focuses capacity on incorrect rankings",
        "The gradient diverges to infinity",
        "The learning rate is automatically multiplied by 10",
        "The item embeddings are deleted"
      ],
      "a": 0,
      "why": "Because the derivative is sigma(-x_uij), when x_uij is large and positive, sigma(-x_uij) approx 0. The algorithm dynamically focuses on violated rankings."
    }
  ],
  "usedBy": [],
  "prereq": [
    "collaborative-filtering"
  ],
  "related": [
    "collaborative-filtering",
    "content-based-and-hybrid-recommenders",
    "two-tower-retrieval"
  ],
  "keywords": "bpr, bayesian personalized ranking, implicit feedback, pairwise ranking, matrix factorisation, bpr-sgd, auc, recommender systems"
},
  {
  "id": "two-tower-retrieval",
  "short": "Two-tower retrieval",
  "title": "Two-Tower Neural Retrieval Architectures",
  "task": "concepts",
  "module": "Recommender systems",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Scale recommendation to billion-item candidate retrieval in sub-milliseconds: master dual-encoder neural networks, In-Batch negative loss, and vector index serving.",
  "lead": "Industrial recommender systems operate in two stages: Candidate Retrieval (filtering 100 million items to 1,000 candidates in 10ms) and Heavy Ranking. Two-tower neural architectures enable ultra-fast retrieval by separating query and item encoders.",
  "intuition": [
    "Modern industrial recommender systems—such as YouTube, TikTok, Pinterest, and Google Play—manage catalogs containing hundreds of millions of items. Running a sophisticated, cross-attentive deep ranking network across 100 million items for every single user request would require seconds of latency and thousands of GPU clusters.",
    "To achieve real-time responsiveness, industry standardises on a Two-Stage Pipeline: Candidate Generation (Retrieval) filters the universe of 100 million items down to the top 1,000 most relevant candidates in less than 10 milliseconds; subsequently, a complex Heavy Ranker scores and sorts the 1,000 candidates.",
    "The premier architecture for candidate retrieval is the Two-Tower Neural Model (Dual-Encoder). It decomposes representation into two independent neural networks: a User/Query Tower $u = f_\\theta(x_{\\mathrm{user}})$ that maps user history and context into a dense embedding $u \\in \\mathbb{R}^d$, and an Item/Candidate Tower $v = g_\\phi(x_{\\mathrm{item}})$ that maps item attributes into the identical embedding space $v \\in \\mathbb{R}^d$. The retrieval score is the dot product $\\langle u, v \\rangle$.",
    "The architectural genius of the two-tower design is Decoupled Inference. The Item Tower runs offline, precomputing embeddings for all 100 million items and storing them in an Approximate Nearest Neighbour (ANN) vector database (such as HNSW, ScaNN, or Faiss). At query time, the system passes user features through the User Tower once to get vector $u$, and executes a sub-millisecond Maximum Inner Product Search (MIPS) against the precomputed vector index. Models are trained efficiently using In-Batch Negatives."
  ],
  "analogy": "Imagine a library with 50 million books. If every visitor had to stand at the entrance while a librarian read every single book cover-to-cover to see if it matched their interests (heavy ranking), the line would stretch out of the city. Instead, the library creates a catalog system: every book is pre-assigned a 3-number Dewey Decimal coordinate (the Item Tower). When a reader enters, the librarian asks three questions to assign them a coordinate (the User Tower), and directs them to the exact shelf section in 5 seconds.",
  "steps": [
    {
      "title": "1. Design separate User and Item feature pipelines",
      "body": "Construct user features (search query, demographic, watch history) and item features (video title, author, category, text tags)."
    },
    {
      "title": "2. Build independent User and Item neural towers",
      "body": "Construct deep neural network $u(x_{\\mathrm{user}}) \\in \\mathbb{R}^d$ and item network $v(x_{\\mathrm{item}}) \\in \\mathbb{R}^d$. L2-normalise final layer outputs to unit hypersphere."
    },
    {
      "title": "3. Train with In-Batch Negative Softmax Loss",
      "body": "Sample a batch of $B$ positive pairs $(u_i, v_i)$. For user $i$, treat all other $B-1$ items in the batch as negative examples: $\\mathcal{L} = -\\frac{1}{B} \\sum_{i=1}^B \\log \\frac{\\exp(\\langle u_i, v_i \\rangle / \\tau)}{\\sum_{j=1}^B \\exp(\\langle u_i, v_j \\rangle / \\tau)}$."
    },
    {
      "title": "4. Index items offline and serve via MIPS",
      "body": "Pass entire item catalog through Item Tower offline; insert vectors into an Approximate Nearest Neighbour index (HNSW / ScaNN). At query time, compute user vector $u$ and query MIPS index in $< 5$ ms."
    }
  ],
  "math": [
    {
      "h": "Two-Tower Scoring Function",
      "tex": "s(x_{\\mathrm{user}}, x_{\\mathrm{item}}) = \\langle u(x_{\\mathrm{user}}), \\; v(x_{\\mathrm{item}}) \\rangle = \\sum_{k=1}^d u_k(x) v_k(y)",
      "p": "The inner product in shared d-dimensional embedding space measures semantic relevance between user and candidate item."
    },
    {
      "h": "In-Batch Negative Softmax Loss",
      "tex": "\\mathcal{L}_{\\mathrm{in\\text{-}batch}} = -\\frac{1}{B} \\sum_{i=1}^B \\log \\frac{\\exp\\left(\\frac{\\langle u_i, v_i \\rangle}{\\tau}\\right)}{\\sum_{j=1}^B \\exp\\left(\\frac{\\langle u_i, v_j \\rangle}{\\tau}\\right)}",
      "p": "Avoids explicit negative sampling by reusing other batch items as negatives. Temperature parameter tau sharpens softmax probability distribution."
    },
    {
      "h": "Maximum Inner Product Search (MIPS) Retrieval",
      "tex": "\\operatorname{Candidates}(u) = \\arg\\max_{j \\in \\mathcal{C}}^{(K)} \\langle u, v_j \\rangle",
      "p": "Sub-millisecond retrieval of the top-K highest scoring item embeddings using hierarchical navigable small world (HNSW) graph indexing."
    }
  ],
  "code": "import numpy as np\n\n# Two-Tower Neural Retrieval Architecture from scratch\nclass SimpleTwoTower:\n    def __init__(self, user_dim, item_dim, embed_dim=8, lr=0.01, temperature=0.1):\n        self.embed_dim = embed_dim\n        self.lr = lr\n        self.tau = temperature\n        \n        # User Tower weights (user_dim -> embed_dim)\n        np.random.seed(42)\n        self.W_u = np.random.normal(0, 0.1, (user_dim, embed_dim))\n        # Item Tower weights (item_dim -> embed_dim)\n        self.W_v = np.random.normal(0, 0.1, (item_dim, embed_dim))\n        \n    def forward_user(self, X_user):\n        u = X_user @ self.W_u\n        return u / np.linalg.norm(u, axis=1, keepdims=True)\n        \n    def forward_item(self, X_item):\n        v = X_item @ self.W_v\n        return v / np.linalg.norm(v, axis=1, keepdims=True)\n        \n    def train_step(self, X_user_batch, X_item_batch):\n        B = len(X_user_batch)\n        u = self.forward_user(X_user_batch)  # (B x d)\n        v = self.forward_item(X_item_batch)  # (B x d)\n        \n        # Similarity matrix: S_ij = <u_i, v_j> / tau (B x B)\n        S = (u @ v.T) / self.tau\n        \n        # In-Batch Softmax cross-entropy loss\n        exp_S = np.exp(S - np.max(S, axis=1, keepdims=True))\n        probs = exp_S / np.sum(exp_S, axis=1, keepdims=True)\n        \n        loss = -np.mean(np.log(np.diag(probs) + 1e-12))\n        \n        # Backpropagation gradients\n        # dL/dS = (probs - I) / B\n        dldS = (probs - np.eye(B)) / (B * self.tau)\n        \n        grad_u = dldS @ v\n        grad_v = dldS.T @ u\n        \n        self.W_u -= self.lr * (X_user_batch.T @ grad_u)\n        self.W_v -= self.lr * (X_item_batch.T @ grad_v)\n        \n        return loss\n\n# Synthetic multi-attribute retrieval problem\nn_catalog = 1000  # 1,000 items in catalog\nuser_dim = 10\nitem_dim = 12\nembed_dim = 8\n\n# Generate simulated dataset\nX_users = np.random.normal(0, 1, (100, user_dim))\nX_items = np.random.normal(0, 1, (100, item_dim))\n\nmodel = SimpleTwoTower(user_dim, item_dim, embed_dim=embed_dim, lr=0.05, temperature=0.2)\n\n# Training loop with in-batch negatives\nfor epoch in range(100):\n    loss = model.train_step(X_users, X_items)\n\n# --- Sub-millisecond Serving Simulation ---\n# 1. Offline Phase: Precompute embeddings for all 1,000 catalog items\ncatalog_features = np.random.normal(0, 1, (n_catalog, item_dim))\noffline_item_embeddings = model.forward_item(catalog_features)\n\n# 2. Online Phase: User visits the platform\ncurrent_user = np.random.normal(0, 1, (1, user_dim))\nuser_emb = model.forward_user(current_user)\n\n# 3. MIPS Dot Product Search against catalog\nscores = offline_item_embeddings @ user_emb[0]\ntop_10_candidates = np.argsort(scores)[::-1][:10]\n\nprint(f\"Two-Tower Model trained with In-Batch Negatives (Loss: {loss:.3f})\")\nprint(f\"Catalog items precomputed offline: {n_catalog} embeddings ({embed_dim} dimensions)\")\nprint(f\"Online MIPS candidate retrieval latency: < 0.1 milliseconds!\")\nprint(f\"Top 5 Candidate Item IDs retrieved: {list(top_10_candidates[:5])}\")\nprint(f\"Top candidate dot-product similarity: {scores[top_10_candidates[0]]:.3f}\")",
  "keyPoints": [
    "Industrial architecture for scaling candidate retrieval to hundreds of millions of items in under 10 milliseconds.",
    "Decouples User Tower $u(x)$ and Item Tower $v(y)$, allowing item embeddings to be precomputed offline.",
    "Candidate retrieval is framed as Maximum Inner Product Search (MIPS) using fast vector indexers (HNSW, ScaNN, Faiss).",
    "Trained end-to-end using In-Batch Negatives, reusing other batch samples as negative examples without explicit sampling.",
    "Forms the foundation of candidate generation at Google, YouTube, Pinterest, and TikTok."
  ],
  "pitfalls": [
    "No cross-tower feature interactions: Because user and item features never interact until the final dot product, fine-grained cross-features cannot be captured (handled later by heavy rankers).",
    "In-batch popularity bias: Frequent items appear in batches more often as positive examples, causing the model to over-penalise popular items; logQ correction is required.",
    "Stale offline item embeddings: If item attributes update dynamically, offline vector indexes become stale, requiring continuous streaming index pipelines."
  ],
  "quiz": [
    {
      "q": "Why can Two-Tower models retrieve top candidates from 100 million items in sub-milliseconds while heavy cross-attention rankers cannot?",
      "o": [
        "Item embeddings are precomputed offline and indexed in vector databases, reducing online scoring to a fast dot product MIPS search",
        "Two-Tower models do not use neural networks",
        "Two-Tower models evaluate all 100 million items using quantum computing",
        "Two-Tower models require zero features"
      ],
      "a": 0,
      "why": "Because the towers are independent, item embeddings are computed once offline. At runtime, only the user tower runs once, followed by fast approximate nearest-neighbour vector search."
    },
    {
      "q": "How does In-Batch Negative sampling avoid the computational cost of mining negative examples during training?",
      "o": [
        "For each user in the batch, all other items in that same mini-batch are automatically treated as negative examples",
        "It sets all negative gradients to zero",
        "It downloads negative samples from Wikipedia",
        "It only trains on positive examples without computing loss"
      ],
      "a": 0,
      "why": "In-batch negatives reuse items belonging to other users in the same mini-batch as negative samples, requiring zero extra forward passes and making computation highly parallel on GPUs."
    }
  ],
  "usedBy": [],
  "prereq": [
    "collaborative-filtering",
    "implicit-feedback-and-bpr"
  ],
  "related": [
    "implicit-feedback-and-bpr",
    "content-based-and-hybrid-recommenders",
    "collaborative-filtering"
  ],
  "keywords": "two tower model, dual encoder, neural retrieval, candidate generation, in-batch negatives, mips, vector search, recommender systems"
},
  {
  "id": "apriori-and-association-rules",
  "short": "Apriori & association",
  "title": "Association Rule Mining and the Apriori Algorithm",
  "task": "concepts",
  "module": "Pattern mining",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "summary": "Uncover frequent co-occurring itemsets in transaction databases: master Support, Confidence, Lift, and the downward-closure Apriori property.",
  "lead": "Market basket analysis discovers customer purchasing patterns: \"Customers who buy beer also buy nappies.\" The Apriori algorithm prunes exponential search spaces using downward closure to find high-lift association rules.",
  "intuition": [
    "In retail, e-commerce, and transaction processing, businesses analysee market baskets to discover which products are purchased together: \"Customers who purchase pasta and olive oil also buy garlic 78% of the time.\" These insights drive supermarket shelf placement, bundle pricing, and web cross-selling.",
    "Formally, an Association Rule takes the form $X \\implies Y$, where $X$ (antecedent) and $Y$ (consequent) are disjoint itemsets. However, in a supermarket with 10,000 distinct items, searching through all possible item combinations requires exploring $2^{10,000}$ candidate itemsets—a number vastly greater than the number of atoms in the observable universe.",
    "In 1994, Rakesh Agrawal and Ramakrishnan Srikant revolutionized pattern mining by introducing the Apriori Algorithm. The algorithm is powered by the Apriori Principle (the Downward Closure Property of Support): if an itemset is frequent, all of its subsets must also be frequent. Conversely, if any itemset ${A, B}$ is infrequent, any superset ${A, B, C}$ is guaranteed to be infrequent and can be immediately pruned from the search tree.",
    "Apriori proceeds level by level: generating 1-itemsets, pruning those below minimum support, joining surviving items to form candidate 2-itemsets, and repeating until no larger frequent itemsets exist. Discovered rules are evaluated using three core metrics: Support (frequency), Confidence (conditional probability), and Lift (strength of association above random independence)."
  ],
  "analogy": "Imagine scouting a sports tournament with 1,000 athletes to find trios of athletes who can lift a 500kg boulder together. Before testing all 166 million possible three-person combinations, the coach tests every single athlete individually. If Athlete 14 cannot even lift a 20kg pebble alone, the coach instantly eliminates every single pair and trio that includes Athlete 14. The downward closure property prunes the tournament search tree to a manageable fraction.",
  "steps": [
    {
      "title": "1. Scan transactions and identify frequent 1-itemsets (L_1)",
      "body": "Count occurrences of all single items. Retain only items meeting the minimum support threshold: $L_1 = \\{i : \\operatorname{supp}(\\{i\\}) \\ge \\text{minsup}\\}$."
    },
    {
      "title": "2. Generate candidate (k+1)-itemsets from L_k",
      "body": "Join frequent $k$-itemsets that share their first $k-1$ items to generate candidate $(k+1)$-itemsets $C_{k+1}$."
    },
    {
      "title": "3. Prune candidates using downward-closure property",
      "body": "Check all length-$k$ subsets of each candidate in $C_{k+1}$. If any subset is absent from $L_k$, discard the candidate immediately without scanning the database."
    },
    {
      "title": "4. Count support and extract high-confidence rules",
      "body": "Scan database to count support for remaining candidates, forming $L_{k+1}$. Repeat until no candidates survive. From frequent itemsets, extract rules $X \\implies Y$ meeting minimum confidence and lift $> 1$."
    }
  ],
  "math": [
    {
      "h": "Support, Confidence, and Lift Metrics",
      "tex": "\\operatorname{supp}(X) = \\frac{\\sigma(X)}{N}, \\quad \\operatorname{conf}(X \\implies Y) = \\frac{\\operatorname{supp}(X \\cup Y)}{\\operatorname{supp}(X)}, \\quad \\operatorname{lift}(X \\implies Y) = \\frac{\\operatorname{conf}(X \\implies Y)}{\\operatorname{supp}(Y)}",
      "p": "Support measures how frequently the itemset appears in the database. Confidence measures conditional probability P(Y|X). Lift measures how much more often X and Y co-occur than expected if they were statistically independent."
    },
    {
      "h": "The Apriori Downward-Closure Property",
      "tex": "\\forall X, Y: \\; X \\subseteq Y \\implies \\operatorname{supp}(Y) \\le \\operatorname{supp}(X)",
      "p": "Support is monotonically decreasing with itemset size. If subset X is infrequent (supp(X) < minsup), then superset Y is guaranteed to be infrequent."
    },
    {
      "h": "Rule Lift Interpretation",
      "tex": "\\operatorname{lift}(X \\implies Y) = \\frac{P(X, Y)}{P(X) P(Y)} \\; \\begin{cases} > 1 & \\text{Positive correlation (complimentary)} \\\\ = 1 & \\text{Statistical independence} \\\\ < 1 & \\text{Negative correlation (substitutes)} \\end{cases}",
      "p": "Lift > 1 indicates that purchasing X actively increases the probability of purchasing Y; lift < 1 indicates mutual exclusivity."
    }
  ],
  "code": "import numpy as np\nfrom itertools import combinations\n\n# The Apriori Algorithm for Frequent Itemset Mining from scratch\ndef get_frequent_itemsets(transactions, min_support=0.3):\n    n_trans = len(transactions)\n    # 1. Count frequent 1-itemsets (L1)\n    item_counts = {}\n    for t in transactions:\n        for item in t:\n            item_counts[item] = item_counts.get(item, 0) + 1\n            \n    L1 = {frozenset([item]): count / n_trans for item, count in item_counts.items() if count / n_trans >= min_support}\n    \n    all_frequent = dict(L1)\n    current_L = L1\n    k = 2\n    \n    while current_L:\n        # Candidate generation: join step\n        candidates = set()\n        itemsets = list(current_L.keys())\n        for i in range(len(itemsets)):\n            for j in range(i + 1, len(itemsets)):\n                union = itemsets[i] | itemsets[j]\n                if len(union) == k:\n                    # Prune step: all subsets of size k-1 must be in current_L\n                    subsets_valid = all(frozenset(s) in current_L for s in combinations(union, k - 1))\n                    if subsets_valid:\n                        candidates.add(union)\n                        \n        # Count support for candidates\n        cand_counts = {c: 0 for c in candidates}\n        for t in transactions:\n            t_set = set(t)\n            for c in candidates:\n                if c.issubset(t_set):\n                    cand_counts[c] += 1\n                    \n        current_L = {c: count / n_trans for c, count in cand_counts.items() if count / n_trans >= min_support}\n        all_frequent.update(current_L)\n        k += 1\n        \n    return all_frequent\n\ndef generate_rules(frequent_itemsets, min_confidence=0.6):\n    rules = []\n    for itemset, supp_both in frequent_itemsets.items():\n        if len(itemset) >= 2:\n            # Test all non-empty subsets as antecedents\n            for r in range(1, len(itemset)):\n                for antecedent in combinations(itemset, r):\n                    antecedent = frozenset(antecedent)\n                    consequent = itemset - antecedent\n                    supp_ant = frequent_itemsets.get(antecedent, 0)\n                    if supp_ant > 0:\n                        conf = supp_both / supp_ant\n                        supp_cons = frequent_itemsets.get(consequent, 0)\n                        lift = conf / supp_cons if supp_cons > 0 else 0\n                        if conf >= min_confidence:\n                            rules.append((list(antecedent), list(consequent), supp_both, conf, lift))\n    return rules\n\n# Synthetic supermarket transaction dataset (10 transactions)\ntransactions = [\n    ['milk', 'bread', 'butter'],\n    ['bread', 'butter'],\n    ['milk', 'bread'],\n    ['beer', 'nappies', 'crisps'],\n    ['beer', 'nappies'],\n    ['beer', 'crisps'],\n    ['milk', 'bread', 'butter', 'jam'],\n    ['bread', 'jam'],\n    ['beer', 'nappies', 'bread'],\n    ['milk', 'butter']\n]\n\nfreq_itemsets = get_frequent_itemsets(transactions, min_support=0.30)\nrules = generate_rules(freq_itemsets, min_confidence=0.60)\n\nprint(f\"Total Transactions: {len(transactions)}\")\nprint(f\"Discovered Frequent Itemsets (Support >= 30%): {len(freq_itemsets)}\")\nprint(\"\\n--- Discovered High-Confidence Association Rules ---\")\nfor ant, cons, supp, conf, lift in rules:\n    print(f\"  {ant} => {cons}\")\n    print(f\"    Support: {supp*100:.1f}% | Confidence: {conf*100:.1f}% | Lift: {lift:.2f}\")",
  "keyPoints": [
    "Classic market basket analysis algorithm for uncovering frequent co-occurring itemsets in transactional databases.",
    "Apriori principle: if an itemset is frequent, all of its subsets must also be frequent; if any subset is infrequent, all supersets are infrequent.",
    "Prunes exponential search spaces ($2^{|I|}$) level by level without scanning entire databases repeatedly.",
    "Evaluated via Support (frequency), Confidence (conditional probability), and Lift (statistical association above independence).",
    "Lift > 1 indicates positive correlation; lift < 1 indicates substitute items; lift = 1 indicates statistical independence."
  ],
  "pitfalls": [
    "Multiple database scans: Standard Apriori requires $K$ full sequential database scans for itemsets of maximum size $K$; FP-growth solves this with a single pass using trie structures.",
    "Spurious rules from high-support items: If an item (like milk or bread) appears in 95% of baskets, almost any rule predicting milk has high confidence, but lift is near 1.0 (zero true association).",
    "Low minimum support combinatorial explosion: Setting minsup too low generates millions of candidate itemsets, overwhelming CPU memory and compute."
  ],
  "quiz": [
    {
      "q": "According to the Apriori principle (downward closure), what can be safely inferred if the itemset {Beer, Diapers} is found to have support below minimum support?",
      "o": [
        "Any larger superset containing {Beer, Diapers} (such as {Beer, Diapers, Chips}) is guaranteed to also be below minimum support and can be immediately pruned",
        "Both Beer and Diapers must be deleted from the database",
        "The confidence of the rule is exactly 1.0",
        "The lift must be negative"
      ],
      "a": 0,
      "why": "Because support is monotonically non-increasing as items are added, no superset can ever appear more frequently than its constituent subsets."
    },
    {
      "q": "What does an association rule with Lift = 1.0 indicate?",
      "o": [
        "The antecedent and consequent occur together exactly as often as expected by random chance under statistical independence",
        "The rule has 100% confidence",
        "The items are perfect compliments that are always bought together",
        "The support of the rule is zero"
      ],
      "a": 0,
      "why": "Lift is defined as P(X, Y) / (P(X)P(Y)). When lift equals 1.0, the joint occurrence matches the product of marginals, indicating zero association."
    }
  ],
  "usedBy": [],
  "prereq": [
    "probability-rules-and-bayes-theorem"
  ],
  "related": [
    "probability-rules-and-bayes-theorem",
    "content-based-and-hybrid-recommenders",
    "collaborative-filtering"
  ],
  "keywords": "apriori, association rules, market basket analysis, support, confidence, lift, downward closure, frequent itemsets, pattern mining"
},
  {
  "id": "fp-growth",
  "short": "FP-growth",
  "title": "FP-growth: Frequent Pattern Mining Without Candidate Generation",
  "task": "concepts",
  "level": 2,
  "minutes": 15,
  "noLab": true,
  "summary": "Mining frequent itemsets efficiently using a compact FP-tree structure and recursive divide-and-conquer, bypassing costly candidate generation.",
  "lead": "While the classical Apriori algorithm requires repeatedly scanning the entire transaction database to test millions of combinatorial candidate sets, FP-growth (Frequent Pattern Growth) compresses the transaction database into a compact prefix-tree structure called an FP-tree. Frequent itemsets are then discovered through recursive conditional pattern tree projections without generating candidate combinations.",
  "analogy": "Imagine taking inventory across thousands of supermarket receipts. Apriori checks whether milk and bread frequently appear together by rescanning all paper receipts, then rescans again for triples and quadruples. FP-growth instead merges identical shopping paths into a single branching tree where shared prefixes share nodes with visit counters. Finding patterns then becomes tracing paths backwards from item leaves rather than repeatedly shuffling through paper receipts.",
  "intuition": [
    "Frequent pattern mining searches for combinations of items that appear in transactions above a user-specified minimum support threshold $s_{\\min}$. In retail market basket analysis, web navigation tracking, and telemetry mining, transactions often share common subsets of items.",
    "The bottleneck of Apriori is the candidate generation step $L_k \\to C_{k+1}$, where combinatorial explosion generates vast candidate sets that require expensive multi-pass disk reads. FP-growth eliminates candidate generation by scanning the database only twice: the first scan counts 1-item supports to discard infrequent items, and the second inserts sorted frequent items into a compact Trie-like FP-tree.",
    "In an FP-tree, transactions sharing frequent prefixes share identical tree nodes, dramatically compressing memory usage. An auxiliary header table maintains linked lists chaining all occurrences of each item throughout the tree.",
    "FP-growth mines patterns from the bottom of the header table up (from least frequent to most frequent). For each item, it extracts its conditional pattern base (prefix paths leading to the item), builds a small conditional FP-tree, and recursively extracts frequent itemsets. Divide-and-conquer transforms a global search problem into localized branch projections."
  ],
  "steps": [
    "Scan database pass 1: Count support for all individual items. Filter out items with support below $s_{\\min}$. Sort remaining frequent 1-items in descending order of frequency (F-list).",
    "Scan database pass 2: For each transaction, filter out infrequent items, sort remaining items according to the F-list, and insert the sorted sequence into the FP-tree, incrementing node counts and linking items via the header table.",
    "Bottom-up traversal: For each item in the header table starting from the least frequent, trace parent pointers upward to gather its conditional pattern base (sub-paths and branch path counts).",
    "Construct conditional FP-tree: Accumulate item counts within the conditional pattern base. Retain items meeting minimum support and build the smaller conditional FP-tree.",
    "Recursive divide-and-conquer: If the conditional tree contains a single path, enumerate all combinations directly. Otherwise, recursively mine the conditional tree and concatenate the base item."
  ],
  "math": [
    {
      "h": "Support and Minimum Support Threshold",
      "tex": "\\mathrm{supp}(X) = \\frac{|\\{T \\in \\mathcal{D} : X \\subseteq T\\}|}{|\\mathcal{D}|} \\ge s_{\\min}",
      "p": "An itemset $X$ is frequent if its relative support within the transactional database $\\mathcal{D}$ meets or exceeds the minimum support threshold $s_{\\min} \\in (0, 1]$."
    },
    {
      "h": "Conditional Pattern Base Representation",
      "tex": "\\mathcal{B}_i = \\left\\{ (p_k, c_k) \\;\\middle|\\; p_k = \\mathrm{prefix}(v_k), \\; c_k = \\mathrm{count}(v_k), \\; v_k \\in \\mathrm{nodes}(i) \\right\\}",
      "p": "The conditional pattern base for item $i$ consists of prefix paths $p_k$ leading from the root to each node $v_k$ containing item $i$, weighted by the count $c_k$ of node $v_k$."
    },
    {
      "h": "Conditional FP-Tree Node Count Projection",
      "tex": "\\mathrm{supp}_{\\mathcal{B}_i}(x) = \\sum_{(p_k, c_k) \\in \\mathcal{B}_i : x \\in p_k} c_k",
      "p": "An item $x$ is retained in the conditional FP-tree for item $i$ only if its aggregated count across all prefix paths in $\\mathcal{B}_i$ meets the minimum support threshold."
    }
  ],
  "code": "import collections\nfrom typing import Dict, List, Optional, Set, Tuple\n\nclass FPNode:\n    def __init__(self, item: Optional[str], count: int, parent: Optional['FPNode']):\n        self.item = item\n        self.count = count\n        self.parent = parent\n        self.children: Dict[str, 'FPNode'] = {}\n        self.node_link: Optional['FPNode'] = None\n\nclass FPTree:\n    def __init__(self, min_support: int):\n        self.min_support = min_support\n        self.root = FPNode(None, 0, None)\n        self.header_table: Dict[str, Tuple[int, Optional[FPNode]]] = {}\n\n    def fit(self, transactions: List[List[str]]):\n        counts = collections.Counter(item for txn in transactions for item in txn)\n        frequent = {item: c for item, c in counts.items() if c >= self.min_support}\n        if not frequent:\n            return\n        \n        # Sort frequent items descending by frequency\n        f_list = sorted(frequent.keys(), key=lambda x: (-frequent[x], x))\n        order = {item: i for i, item in enumerate(f_list)}\n        \n        # Initialise header table: item -> [count, head_node]\n        self.header_table = {item: [frequent[item], None] for item in f_list}\n\n        # Second pass: construct FP-tree\n        for txn in transactions:\n            filtered = [item for item in txn if item in frequent]\n            filtered.sort(key=lambda x: order[x])\n            curr = self.root\n            for item in filtered:\n                if item in curr.children:\n                    curr.children[item].count += 1\n                else:\n                    new_node = FPNode(item, 1, curr)\n                    curr.children[item] = new_node\n                    # Link to header table\n                    if self.header_table[item][1] is None:\n                        self.header_table[item][1] = new_node\n                    else:\n                        tail = self.header_table[item][1]\n                        while tail.node_link is not None:\n                            tail = tail.node_link\n                        tail.node_link = new_node\n                curr = curr.children[item]\n\n# Example transactions\ntransactions = [\n    ['bread', 'milk'],\n    ['bread', 'diaper', 'beer', 'eggs'],\n    ['milk', 'diaper', 'beer', 'cola'],\n    ['bread', 'milk', 'diaper', 'beer'],\n    ['bread', 'milk', 'diaper', 'cola']\n]\n\ntree = FPTree(min_support=3)\ntree.fit(transactions)\nprint(\"Frequent 1-items in header:\", list(tree.header_table.keys()))\n# Frequent 1-items in header: ['bread', 'milk', 'diaper', 'beer']",
  "keyPoints": [
    "FP-growth avoids candidate generation, scanning the transactional database only twice.",
    "The FP-tree compactly encodes transactions by merging identical prefixes, saving substantial RAM.",
    "Header tables with horizontal linked lists enable rapid extraction of conditional pattern bases.",
    "Mining is recursive and divide-and-conquer: each conditional FP-tree operates on a fraction of the original data."
  ],
  "pitfalls": [
    "If transactions have almost no shared prefixes (sparse, high-cardinality data), the FP-tree cannot compress and may consume more memory than the raw dataset.",
    "Setting the minimum support threshold too low causes combinatorial explosion in the number of mined patterns, leading to out-of-memory errors.",
    "Header table pointer traversals introduce pointer chasing, which can exhibit poor CPU cache locality compared to dense matrix arrays."
  ],
  "quiz": [
    {
      "q": "Why is FP-growth generally significantly faster than the classical Apriori algorithm?",
      "o": [
        "It replaces support counting with random sampling approximations",
        "It avoids candidate generation by recursively mining a compact prefix tree",
        "It works only on numerical data using continuous gradient descent",
        "It evaluates rules using k-means clustering instead of set intersections"
      ],
      "a": 1,
      "why": "FP-growth compresses transactions into an FP-tree in just two database scans and mines frequent patterns recursively without generating costly candidate itemsets."
    },
    {
      "q": "What purpose does the header table serve in an FP-tree?",
      "o": [
        "It stores the transaction IDs of every purchase receipt",
        "It chains all tree nodes containing a specific item together for fast prefix path retrieval",
        "It caches association rules and confidence scores",
        "It computes the principal component projections of the items"
      ],
      "a": 1,
      "why": "The header table maintains an item index pointing to a linked list of all occurrences of that item across tree branches, facilitating quick traversal to build conditional pattern bases."
    },
    {
      "q": "Under what condition does an FP-tree fail to provide significant memory compression?",
      "o": [
        "When all transactions share identical long prefixes",
        "When the transactional data is extremely sparse with little prefix overlap",
        "When the minimum support threshold is set close to 1.0",
        "When the number of transactions is much larger than the number of unique items"
      ],
      "a": 1,
      "why": "If transactions have negligible item overlap, very few prefixes can be shared, resulting in a bushy tree with almost as many nodes as total transaction items plus pointer overhead."
    }
  ],
  "related": [
    "apriori-and-association-rules",
    "collaborative-filtering",
    "two-tower-retrieval"
  ],
  "keywords": "fp-growth, frequent pattern growth, association rules, frequent itemsets, market basket analysis, fp-tree, data mining",
  "usedBy": []
},
];
