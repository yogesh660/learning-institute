// Lessons for this track. Conventions: see regression.js and CLAUDE.md.
const r = String.raw;
module.exports = [
  {
    id: 'probability-rules-and-bayes-theorem',
    short: 'Probability and Bayes',
    title: r`Probability Rules and Bayes' Theorem`,
    task: 'concepts',
    module: 'Probability',
    level: 1,
    minutes: 20,
    explainer: 'bayes',
    labIntro: r`Each dot is one of 1,000 people. Move the sliders and watch the cyan dots (real cases) compete with the pink ones (false alarms). The curve on the right shows the posterior for every prevalence at once. Repeated tests assume each one errs independently, given whether the person is really sick.`,
    tryThis: [
      r`Press <em>Rare disease</em> (prevalence 0.1%). The pink false alarms swamp the cyan dots and a positive test means only about 1%.`,
      r`At 1% prevalence, raise sensitivity from 90% to 99%. The posterior barely moves (about 10% to 11%), because the false alarms are the real problem.`,
      r`Instead, cut the false-positive rate from 8% to 1%. The posterior jumps to about 48%.`,
      r`Go back to the defaults and raise <em>Independent positive tests</em> to 2 and 3: the posterior climbs from 10% to about 56% and then 93%.`,
    ],
    summary: r`The calculus of uncertainty: addition, multiplication, conditional probability and Bayes' theorem. Invert probabilities to update beliefs as new evidence arrives.`,
    lead: r`Probability quantifies uncertainty on a principled scale from 0 to 1. Bayes' theorem provides the mathematical machinery to invert conditional probabilities, updating prior beliefs into posterior distributions in the light of fresh empirical data.`,
    intuition: [
      r`Suppose a clinic screens 1,000 patients for a rare disease affecting 1% of the population (10 people). A diagnostic test boasts a 90% true positive rate (detecting 9 of the 10 sick patients) and an 8% false positive rate (falsely flagging roughly 79 of the 990 healthy patients). If a patient tests positive, what is the chance they actually have the disease? Most people guess 90%, yet the actual probability is only 9 out of (9 + 79) = 88 positive tests, which is roughly 10.2%.`,
      r`This counter-intuitive outcome is known as the base rate fallacy. Because healthy individuals vastly outnumber sick individuals, even a modest false positive rate creates far more false alarms than true cases. To compute the probability of disease after seeing a positive test, you cannot evaluate the test in a vacuum; you must weigh the likelihood of the test against the prior prevalence of the disease.`,
      r`This exact reasoning powers probabilistic machine learning. A spam filter assessing an email does not merely check how often the word "lottery" appears in junk mail; it balances that evidence against the base rate of spam in your inbox. In models like [[gaussian_naive_bayes]] and Bayesian inference, Bayes' theorem is the formal engine that turns likelihoods into actionable class probabilities.`,
    ],
    analogy: r`Updating beliefs with Bayes' theorem is like spotting dark clouds: they strongly indicate rain in Manchester, but rarely mean rain in the Atacama desert.`,
    steps: [
      r`Define the sample space $\Omega$ and assign valid prior probabilities $P(A_k)$ that sum to 1 over all mutually exclusive outcomes.`,
      r`Calculate conditional probabilities using the multiplication rule: $P(A \cap B) = P(A \mid B)P(B)$.`,
      r`Sum across all mutually exclusive scenarios via the law of total probability to establish the marginal evidence $P(B)$.`,
      r`Invert the conditional direction with Bayes' theorem: multiply the prior $P(A)$ by the likelihood $P(B \mid A)$ and divide by $P(B)$.`,
      r`Use the resulting posterior distribution $P(A \mid B)$ to drive decision thresholds or serve as the prior for future observations.`,
    ],
    math: [
      {
        h: 'Probability Axioms and Fundamental Rules',
        tex: r`$$P(A \cup B) = P(A) + P(B) - P(A \cap B), \qquad P(A \cap B) = P(A \mid B)P(B)$$`,
        p: r`Kolmogorov's axioms require probabilities to be non-negative, bounded in $[0, 1]$, and sum to 1 over the sample space. The addition rule subtracts the intersection $P(A \cap B)$ so overlapping events are not counted twice. When events are mutually exclusive, $P(A \cap B) = 0$. When events are statistically independent, conditional conditioning vanishes: $P(A \mid B) = P(A)$, reducing the intersection to $P(A)P(B)$.`,
      },
      {
        h: 'The Law of Total Probability',
        tex: r`$$P(B) = \sum_{k=1}^K P(B \mid A_k)P(A_k)$$`,
        p: r`If the events $\{A_1, A_2, \dots, A_K\}$ form a partition of the sample space (meaning they are mutually exclusive and collectively exhaustive, $\bigcup_k A_k = \Omega$), the total marginal probability of any event $B$ is the weighted average of its conditional probabilities across all possible states $A_k$.`,
      },
      {
        h: 'Bayes\' Theorem',
        tex: r`$$P(A_j \mid B) = \frac{P(B \mid A_j)P(A_j)}{P(B)} = \frac{P(B \mid A_j)P(A_j)}{\sum_{k=1}^K P(B \mid A_k)P(A_k)}$$`,
        p: r`Bayes' theorem translates the prior probability $P(A_j)$ into the posterior probability $P(A_j \mid B)$ by multiplying by the likelihood $P(B \mid A_j)$ and normalising by the total probability of the evidence $P(B)$. It allows us to infer hidden causes from observed effects.`,
      },
    ],
    keyPoints: [
      r`Conditional probability $P(A \mid B)$ is mathematically distinct from $P(B \mid A)$; confusing them is the prosecutor's fallacy.`,
      r`A rare prior requires overwhelming likelihood evidence to produce a convincing posterior probability.`,
      r`Statistical independence is a property of probabilities ($P(A \cap B) = P(A)P(B)$), not of physical separation.`,
      r`Bayes' theorem is the foundation for updating models sequentially as streaming batches of data arrive.`,
    ],
    pitfalls: [
      r`Base rate neglect: evaluating the diagnostic accuracy of a classifier or test while ignoring class imbalance.`,
      r`Assuming events are independent when latent confounding factors or serial correlations link them together.`,
      r`Confusing mutually exclusive events ($P(A \cap B) = 0$) with independent events ($P(A \cap B) = P(A)P(B)$); mutually exclusive events with non-zero probability can never be independent.`,
      r`Forgetting to normalise by the denominator $P(B)$, which is essential whenever absolute posterior probabilities are required.`,
    ],
    code: r`import numpy as np

# Medical screening base-rate calculation
prior_disease = 0.01          # P(D) = 1%
prior_healthy = 1.0 - prior_disease  # P(~D) = 99%

# Test characteristics: sensitivity and false positive rate
sensitivity = 0.90            # P(+ | D) = 90%
false_positive_rate = 0.08    # P(+ | ~D) = 8%

# Total evidence: Law of total probability
p_positive = (sensitivity * prior_disease) + (false_positive_rate * prior_healthy)

# Bayes' theorem: Posterior P(D | +)
posterior = (sensitivity * prior_disease) / p_positive
print(f"P(Positive Test) = {p_positive:.4f}")
print(f"P(Disease | Positive) = {posterior:.4f}")`,
    quiz: [
      {
        q: r`A rare condition has a prevalence of 0.1%. A test has 99% sensitivity and a 2% false positive rate. If someone tests positive, their posterior probability of having the condition is closest to:`,
        o: [r`4.7%`, r`98.0%`, r`50.0%`, r`99.0%`],
        a: 0,
        why: r`$P(+) = (0.99 \times 0.001) + (0.02 \times 0.999) = 0.00099 + 0.01998 = 0.02097$. The posterior $P(\text{condition} \mid +) = 0.00099 / 0.02097 \approx 0.0472$ (or 4.7%).`,
        d: 3,
      },
      {
        q: r`Two events $A$ and $B$ both have probability 0.5 and are mutually exclusive. What is $P(A \cap B)$?`,
        o: [r`0.25`, r`0.50`, r`0`, r`1.0`],
        a: 2,
        why: r`Mutually exclusive events cannot occur simultaneously by definition, so their intersection is the empty set with probability 0.`,
        d: 1,
      },
      {
        q: r`Under what condition does $P(A \mid B) = P(A)$?`,
        o: [r`When $A$ and $B$ are mutually exclusive`, r`When $A$ and $B$ are statistically independent`, r`When $P(B) = 1$ only`, r`When $A$ is a subset of $B$`],
        a: 1,
        why: r`By definition of statistical independence, knowledge that $B$ has occurred provides zero information about the occurrence of $A$.`,
        d: 1,
      },
      {
        q: r`Why does the denominator in Bayes' theorem sum over all hypotheses $A_k$?`,
        o: [r`To ensure the posterior probabilities across all hypotheses sum to 1`, r`To remove the effect of the prior`, r`To maximise the likelihood function`, r`To penalise overly complex models`],
        a: 0,
        why: r`The denominator is the marginal probability of the evidence across the full partition, acting as the normalising constant so the posteriors form a valid probability distribution.`,
        d: 2,
      },
      {
        q: r`If $P(A) = 0.4$, $P(B) = 0.5$, and $P(A \cap B) = 0.1$, what is the union probability $P(A \cup B)$?`,
        o: [r`0.9`, r`0.7`, r`0.2`, r`0.8`],
        a: 3,
        why: r`The addition rule gives $P(A \cup B) = P(A) + P(B) - P(A \cap B) = 0.4 + 0.5 - 0.1 = 0.8$. Simply adding $0.4 + 0.5$ would double-count the intersection.`,
        d: 1,
      },
      {
        q: r`Can two events $A$ and $B$ with strictly positive probabilities ($P(A) > 0, P(B) > 0$) be simultaneously mutually exclusive and statistically independent?`,
        o: [r`Yes, provided $P(A) + P(B) = 1$`, r`Yes, whenever they share no outcomes in the sample space`, r`No, because mutual exclusivity requires $P(A \cap B) = 0$, whereas independence requires $P(A \cap B) = P(A)P(B) > 0$`, r`No, because independent events must always be subsets of each other`],
        a: 2,
        why: r`Mutual exclusivity requires $P(A \cap B) = 0$. Statistical independence requires $P(A \cap B) = P(A)P(B)$. Because both probabilities are strictly positive, their product is positive, so both conditions cannot hold at once.`,
        d: 2,
      },
      {
        q: r`A factory uses two assembly lines. Line 1 produces 60% of all parts with a defect rate of 2%, while Line 2 produces 40% with a defect rate of 5%. What is the overall probability that a randomly chosen part is defective?`,
        o: [r`3.5%`, r`7.0%`, r`2.8%`, r`3.2%`],
        a: 3,
        why: r`By the law of total probability, $P(D) = P(D \mid L_1)P(L_1) + P(D \mid L_2)P(L_2) = (0.02 \times 0.60) + (0.05 \times 0.40) = 0.012 + 0.020 = 0.032$ (or 3.2%). Averaging 2% and 5% ignores line volume.`,
        d: 2,
      },
      {
        q: r`A diagnostic test runs in code with <code>prior = 0.20</code>, <code>likelihood = 0.80</code>, and marginal evidence <code>p_evidence = 0.40</code>. Evaluating <code>(likelihood * prior) / p_evidence</code> produces:`,
        o: [r`0.16`, r`0.40`, r`0.25`, r`0.50`],
        a: 1,
        why: r`Applying Bayes' theorem directly: $(0.80 \times 0.20) / 0.40 = 0.16 / 0.40 = 0.40$.`,
        d: 2,
      },
      {
        q: r`In a medical screening scenario with a very rare disease (prevalence 0.1%), why does cutting the false-positive rate from 8% to 1% increase posterior disease probability far more than raising sensitivity from 90% to 99%?`,
        o: [r`Because sensitivity has no effect on Bayes' theorem`, r`Because false alarms arise from the healthy majority, which vastly outnumbers the small sick cohort`, r`Because false-positive rates are mathematically bounded by sensitivity`, r`Because the law of total probability applies only to uninfected individuals`],
        a: 1,
        why: r`When 99.9% of people are healthy, even a modest false-positive rate generates dozens of false alarms that swamp the few genuine positive cases. Reducing false alarms directly cuts the dominant term in the denominator.`,
        d: 2,
      },
      {
        q: r`On the factory lines (Line 1: 60% volume, 2% defects; Line 2: 40% volume, 5% defects; overall defect rate 3.2%), an inspected part turns out to be defective. What is the posterior probability that it came from Line 2?`,
        o: [r`62.5%`, r`50.0%`, r`40.0%`, r`71.4%`],
        a: 0,
        why: r`Bayes' inversion gives $P(L_2 \mid D) = P(D \mid L_2)P(L_2) / P(D) = (0.05 \times 0.40) / 0.032 = 0.020 / 0.032 = 20/32 = 0.625$ (62.5%). Even with lower output volume, Line 2's higher defect rate produces the majority of defects.`,
        d: 3,
      },
      {
        q: r`A patient tests positive on a test with 10% disease prior, 80% sensitivity, and 10% false-positive rate. A second, independent test from an external laboratory with identical characteristics also returns positive. What is the posterior probability after both positive tests?`,
        o: [r`47.1%`, r`72.0%`, r`87.7%`, r`98.2%`],
        a: 2,
        why: r`After one test, the posterior is $(0.8 \times 0.1) / (0.8 \times 0.1 + 0.1 \times 0.9) = 0.08 / 0.17 = 8/17 \approx 47.1\%$. With independent errors, the joint likelihoods are $0.8^2 \times 0.10 = 0.064$ for disease and $0.1^2 \times 0.90 = 0.009$ for healthy, giving $0.064 / (0.064 + 0.009) = 64/73 \approx 87.7\%$.`,
        d: 3,
      },
      {
        q: r`Confusing the probability of evidence given an innocence hypothesis, $P(E \mid I)$, with the probability of innocence given that evidence, $P(I \mid E)$, is an error known as:`,
        o: [r`Berkson's bias`, r`The ecological fallacy`, r`Simpson's paradox`, r`The prosecutor's fallacy`],
        a: 3,
        why: r`The prosecutor's fallacy equates the probability of innocent evidence $P(E \mid I)$ with the posterior $P(I \mid E)$ by neglecting the prior probability of guilt or innocence.`,
        d: 1,
      },
    ],
    usedBy: ['gaussian_naive_bayes', 'multinomial_bernoulli_nb', 'bayesian_linear_regression'],
    prereq: ['confusion-matrix'],
    related: ['random-variables-and-distributions', 'log-odds', 'maximum-likelihood-estimation'],
    keywords: 'probability bayes theorem conditional prior posterior likelihood addition multiplication law total',
  },
  {
    id: 'random-variables-and-distributions',
    short: 'Random variables',
    title: 'Random Variables and Distributions',
    task: 'concepts',
    module: 'Probability',
    level: 1,
    minutes: 16,
    noLab: true,
    summary: r`Mapping random outcomes to real numbers: discrete PMFs, continuous PDFs, CDFs, and canonical distributions from Bernoulli to Gaussian.`,
    lead: r`A random variable is not a variable in the algebraic sense, but a deterministic function mapping outcomes of a random process to real numbers. Probability mass functions (PMFs) and probability density functions (PDFs) formalise where those numbers land and how likelihood concentrates across continuous and discrete domains.`,
    intuition: [
      r`Consider rolling a pair of standard dice. The actual physical outcome is an ordered pair like $(3, 5)$ or $(1, 6)$. But as a game designer or gambler, you rarely care about the individual dice faces; you care about their sum. The rule that maps the outcome $(3, 5)$ to the number 8 is a random variable. It turns messy physical events into numbers we can analyse mathematically.`,
      r`Random variables split into two families. Discrete random variables take separate, countable values: the number of website visits today, or whether an email is spam (0 or 1). We describe them with a Probability Mass Function (PMF), where each individual value has an exact probability, such as $P(X = 3) = 0.25$. Continuous random variables take values on a continuous continuum: the response time of a server in milliseconds, or the height of a person.`,
      r`For continuous variables, the probability of hitting any single exact number—like a latency of precisely 142.385921... milliseconds—is technically 0. Instead, we use a Probability Density Function (PDF) where the area under the curve between two points gives the probability of landing in that interval. Cumulative Distribution Functions (CDFs) bridge both worlds by reporting the probability of being less than or equal to any threshold.`,
    ],
    analogy: r`A probability density function is like the elevation profile of a mountain: height at a single point does not give you volume, but integrating over an area gives the total mass of rock.`,
    steps: [
      r`Define the random variable $X: \Omega \to \mathbb{R}$ by specifying what numeric quantity is extracted from each event.`,
      r`Determine whether the support of $X$ is discrete (countable integers) or continuous (real intervals).`,
      r`Assign the appropriate distribution model: PMF $p(x)$ for discrete cases or PDF $f(x)$ for continuous cases.`,
      r`Verify normalisation: discrete probabilities must sum to 1 ($\sum p(x) = 1$), while continuous density must integrate to 1 ($\int f(x)dx = 1$).`,
      r`Compute probabilities of intervals by integrating the PDF or evaluating the difference in CDF values: $P(a \le X \le b) = F(b) - F(a)$.`,
    ],
    math: [
      {
        h: 'Discrete PMF and Continuous PDF',
        tex: r`$$P(X = x) = p(x), \quad \sum_{x} p(x) = 1 \qquad \text{vs.} \qquad P(a \le X \le b) = \int_a^b f(x)\,dx, \quad \int_{-\infty}^\infty f(x)\,dx = 1$$`,
        p: r`For a discrete variable, $p(x)$ represents the exact point probability. For a continuous variable, $f(x)$ represents probability density; individual points have zero measure ($P(X = x) = 0$), so probabilities are non-zero only over intervals of non-zero width.`,
      },
      {
        h: 'Cumulative Distribution Function (CDF)',
        tex: r`$$F(x) = P(X \le x) = \begin{cases} \sum_{t \le x} p(t) & \text{discrete} \\[6pt] \int_{-\infty}^x f(t)\,dt & \text{continuous} \end{cases}$$`,
        p: r`The CDF $F(x)$ is non-decreasing, right-continuous, and satisfies $\lim_{x \to -\infty} F(x) = 0$ and $\lim_{x \to +\infty} F(x) = 1$. By the Fundamental Theorem of Calculus, for continuous variables the PDF is the derivative of the CDF: $f(x) = F'(x)$.`,
      },
      {
        h: 'The Gaussian (Normal) Distribution',
        tex: r`$$f(x \mid \mu, \sigma^2) = \frac{1}{\sigma \sqrt{2\pi}} \exp\left(-\frac{(x - \mu)^2}{2\sigma^2}\right)$$`,
        p: r`The bell-shaped normal distribution is parameterised by its mean $\mu$ (centre of mass) and variance $\sigma^2$ (dispersion). By the 68–95–99.7 empirical rule, approximately 68.3% of the density lies within $\mu \pm \sigma$, and 95.4% lies within $\mu \pm 2\sigma$.`,
      },
    ],
    keyPoints: [
      r`A probability density $f(x)$ can exceed 1 (unlike a discrete probability), provided the total area under the curve remains 1.`,
      r`The CDF $F(x) = P(X \le x)$ exists for both discrete and continuous variables, making it the most general representation.`,
      r`The Gaussian distribution arises naturally in errors and residuals because sums of independent random variables converge to normality.`,
      r`Quantiles and percentiles are found by inverting the CDF: $x_q = F^{-1}(q)$.`,
    ],
    pitfalls: [
      r`Interpreting a continuous PDF value $f(x)$ as the probability of observing $x$; point probabilities in continuous distributions are always 0.`,
      r`Forgetting that changing scale or units alters continuous density values, while probabilities remain invariant.`,
      r`Assuming non-negative data is Gaussian, leading to negative predictions or distorted tail estimates where a Poisson, Gamma or Log-normal distribution is appropriate.`,
      r`Confusing the parameter $\sigma$ (standard deviation) with $\sigma^2$ (variance) in software library arguments.`,
    ],
    code: r`import numpy as np
from scipy import stats

# Continuous Gaussian distribution
mu, sigma = 100.0, 15.0
dist = stats.norm(loc=mu, scale=sigma)

# Probability of falling within 1 standard deviation [85, 115]
p_1sigma = dist.cdf(mu + sigma) - dist.cdf(mu - sigma)
# Exact density at the mode
density_mode = dist.pdf(mu)
# 95th percentile
p95 = dist.ppf(0.95)

print(f"P(mu - sigma <= X <= mu + sigma) = {p_1sigma:.4f}")
print(f"Density at mode f({mu}) = {density_mode:.5f}")
print(f"95th percentile = {p95:.2f}")`,
    quiz: [
      {
        q: r`For a continuous random variable $X$ with PDF $f(x)$, what is $P(X = 5)$?`,
        o: [r`$f(5)$`, r`0`, r`$F(5)$`, r`$1 - F(5)$`],
        a: 1,
        why: r`The probability of any single real point in a continuous distribution is zero, because the integral of a density over an interval of width zero evaluates to 0.`,
        d: 1,
      },
      {
        q: r`Can the probability density function $f(x)$ of a continuous distribution ever exceed 1.0?`,
        o: [r`No, probabilities can never exceed 1.0`, r`Yes, because density is probability per unit length and can be arbitrarily large if concentrated in a tiny interval`, r`Only for discrete distributions`, r`Only if the variance is negative`],
        a: 1,
        why: r`$f(x)$ is a density, not a probability. For example, a uniform distribution on $[0, 0.5]$ has constant density $f(x) = 2.0$, which integrates to 1.0 over its support.`,
        d: 2,
      },
      {
        q: r`If $F(x)$ is the cumulative distribution function (CDF) of $X$, how do you compute $P(a < X \le b)$?`,
        o: [r`$F(b) - F(a)$`, r`$F(b) / F(a)$`, r`$F(a) + F(b)$`, r`$f(b) - f(a)$`],
        a: 0,
        why: r`$P(a < X \le b) = P(X \le b) - P(X \le a) = F(b) - F(a)$ by definition of the cumulative distribution function.`,
        d: 1,
      },
      {
        q: r`What proportion of probability mass lies within two standard deviations ($\mu \pm 2\sigma$) of the mean for any Gaussian distribution?`,
        o: [r`Roughly 50.0%`, r`Roughly 68.3%`, r`Roughly 95.4%`, r`Roughly 99.7%`],
        a: 2,
        why: r`The empirical rule for Gaussian distributions states that approximately 68.3% lies within $\pm 1\sigma$, 95.4% within $\pm 2\sigma$, and 99.7% within $\pm 3\sigma$.`,
        d: 1,
      },
      {
        q: r`A continuous random variable $X$ is uniformly distributed on the interval $[2, 10]$. What is the value of its probability density function $f(x)$ for $x \in [2, 10]$, and what is $P(4 \le X \le 8)$?`,
        o: [r`$f(x) = 0.10$ and $P(4 \le X \le 8) = 0.40$`, r`$f(x) = 0.125$ and $P(4 \le X \le 8) = 0.25$`, r`$f(x) = 0.25$ and $P(4 \le X \le 8) = 0.50$`, r`$f(x) = 0.125$ and $P(4 \le X \le 8) = 0.50$`],
        a: 3,
        why: r`The uniform PDF is $f(x) = 1 / (b - a) = 1 / (10 - 2) = 1/8 = 0.125$. The probability over the sub-interval $[4, 8]$ is the area $\int_4^8 0.125 \, dx = 0.125 \times (8 - 4) = 0.50$.`,
        d: 2,
      },
      {
        q: r`Mathematically, what is a random variable?`,
        o: [r`A deterministic function that maps outcomes from a sample space to real numbers`, r`An algebraic variable whose value cannot be determined until an equation is solved`, r`A floating-point number generated by a pseudo-random number algorithm`, r`A probability value that fluctuates between 0 and 1`],
        a: 0,
        why: r`A random variable is formally a function $X: \Omega \to \mathbb{R}$ assigning a numerical value to each outcome in the sample space.`,
        d: 1,
      },
      {
        q: r`Executing <code>scipy.stats.norm(loc=50, scale=10).ppf(0.50)</code> evaluates to:`,
        o: [r`0.0`, r`0.50`, r`50.0`, r`60.0`],
        a: 2,
        why: r`The percent point function <code>ppf</code> computes quantiles (inverse CDF). For any symmetric Gaussian distribution, the 50th percentile (median) equals the mean (<code>loc</code>), which is 50.0.`,
        d: 2,
      },
      {
        q: r`Which of the following functions could NOT be a valid Cumulative Distribution Function (CDF) $F(x)$ for a real-valued random variable?`,
        o: [r`A step function that starts at 0 and jumps up at integers, reaching 1 for $x \ge 5$`, r`A piecewise linear function that rises steadily from 0 at $x = 0$ to 1 at $x = 10$`, r`A function that is 0 for all $x < 0$ and $1 - e^{-2x}$ for $x \ge 0$`, r`A continuous S-shaped function that decreases from 0.8 to 0.4 over the interval $[2, 4]$`],
        a: 3,
        why: r`A CDF must be monotonically non-decreasing ($F(x_1) \le F(x_2)$ whenever $x_1 \le x_2$). A function that decreases violates this axiom and would imply negative probabilities for intervals.`,
        d: 2,
      },
      {
        q: r`A discrete random variable $X$ takes values in $\{1, 2, 3, 4\}$ with probabilities $P(X=1) = 0.1$, $P(X=2) = 0.3$, and $P(X=3) = 0.4$. What must $P(X=4)$ be for this to be a valid PMF, and what is $P(X \ge 3)$?`,
        o: [r`$P(X=4) = 0.2$ and $P(X \ge 3) = 0.6$`, r`$P(X=4) = 0.2$ and $P(X \ge 3) = 0.4$`, r`$P(X=4) = 0.1$ and $P(X \ge 3) = 0.5$`, r`$P(X=4) = 0.3$ and $P(X \ge 3) = 0.7$`],
        a: 0,
        why: r`Probabilities across all disjoint outcomes must sum to 1: $P(X=4) = 1 - (0.1 + 0.3 + 0.4) = 0.20$. Then $P(X \ge 3) = P(X=3) + P(X=4) = 0.4 + 0.2 = 0.60$.`,
        d: 2,
      },
      {
        q: r`A continuous random variable $X$ has PDF $f(x) = c x^2$ for $x \in [0, 3]$, and $f(x) = 0$ elsewhere. What is the value of the normalising constant $c$, and what is $P(1 \le X \le 2)$?`,
        o: [r`$c = 1/3$ and $P(1 \le X \le 2) = 7/9$`, r`$c = 1/9$ and $P(1 \le X \le 2) = 1/3$`, r`$c = 1/9$ and $P(1 \le X \le 2) = 7/27$`, r`$c = 1/27$ and $P(1 \le X \le 2) = 7/81$`],
        a: 2,
        why: r`Normalising requires $\int_0^3 c x^2 dx = c [x^3 / 3]_0^3 = 9c = 1$, giving $c = 1/9$. Then $P(1 \le X \le 2) = \int_1^2 \frac{1}{9}x^2 dx = \frac{1}{27}(2^3 - 1^3) = 7/27$.`,
        d: 3,
      },
      {
        q: r`For a standard normal random variable $Z \sim \mathcal{N}(0, 1)$, the PDF mode is $f(0) \approx 0.3989$. If $X \sim \mathcal{N}(100, 0.04)$, where variance $\sigma^2 = 0.04$ (so $\sigma = 0.2$), what is the value of the PDF at its mode $x = 100$?`,
        o: [r`0.0798`, r`1.9947`, r`0.3989`, r`9.9735`],
        a: 1,
        why: r`At the mode $x = \mu$, the exponential factor is $\exp(0) = 1$, leaving $f(\mu) = 1 / (\sigma \sqrt{2\pi})$. Since $\sigma = \sqrt{0.04} = 0.2$, $f(100) \approx 0.3989 / 0.2 = 1.9947$. This neatly illustrates why continuous densities can exceed 1.0.`,
        d: 3,
      },
      {
        q: r`Suppose the CDF of server response time $T$ (in seconds) is $F(t) = 1 - e^{-\lambda t}$ for $t \ge 0$. Which expression gives the probability density function $f(t)$ and the probability that a response takes strictly longer than 3 seconds?`,
        o: [r`$f(t) = -\lambda e^{-\lambda t}$ and $P(T > 3) = 1 - e^{-3\lambda}$`, r`$f(t) = \lambda e^{-\lambda t}$ and $P(T > 3) = 1 - e^{-3\lambda}$`, r`$f(t) = e^{-\lambda t}$ and $P(T > 3) = e^{-3\lambda}$`, r`$f(t) = \lambda e^{-\lambda t}$ and $P(T > 3) = e^{-3\lambda}$`],
        a: 3,
        why: r`The PDF is the first derivative of the CDF: $f(t) = F'(t) = \frac{d}{dt}(1 - e^{-\lambda t}) = \lambda e^{-\lambda t}$. The tail probability $P(T > 3)$ is $1 - F(3) = 1 - (1 - e^{-3\lambda}) = e^{-3\lambda}$.`,
        d: 3,
      },
    ],
    usedBy: ['gaussian_naive_bayes', 'gaussian_mixture_models', 'bayesian_linear_regression'],
    prereq: ['probability-rules-and-bayes-theorem'],
    related: ['expectation-variance-and-covariance', 'maximum-likelihood-estimation'],
    keywords: 'random variable probability distribution pdf pmf cdf normal gaussian bernoulli continuous discrete',
  },
  {
    id: 'expectation-variance-and-covariance',
    short: 'Expectation and variance',
    title: 'Expectation, Variance and Covariance',
    task: 'concepts',
    module: 'Probability',
    level: 1,
    minutes: 16,
    noLab: true,
    summary: r`The three pillars of summary statistics: expected value as centre of mass, variance as spread, and covariance as joint linear co-movement.`,
    lead: r`Expectation measures the long-run average outcome of a random process, variance quantifies the dispersion around that average, and covariance tracks how two variables move together. Together, they form the algebraic backbone of loss functions, risk analysis, and matrix methods in machine learning.`,
    intuition: [
      r`Imagine a roulette game where you bet £10 on red. Eighteen out of 37 slots are red, 18 are black, and 1 is green (zero). If red hits, you win £10; otherwise, you lose your £10. On any single spin, you either gain £10 or lose £10—you never see a fractional amount. But if you play 1,000 times, your average outcome per spin converges toward $(18/37)(+10) + (19/37)(-10) \approx -£0.27$. That long-run average is the expected value $\mathbb{E}[X]$.`,
      r`Now compare two investments. Asset A returns 5% every single year without fail. Asset B returns 45% in good years and loses 35% in bad years, averaging 5%. Both assets have the exact same expected return of 5%, yet Asset B is dramatically riskier. Variance $\operatorname{Var}(X)$ captures this risk by measuring the average squared deviation from the mean, while its square root—standard deviation $\sigma$—puts the spread back into original units like pounds or percentage points.`,
      r`When we track multiple variables, we need to know whether they move in sympathy. If temperature rises and ice cream sales climb while hot tea sales drop, temperature shares positive covariance with ice cream and negative covariance with tea. In linear regression and PCA, covariance matrices summarise all pairwise relationships to find optimal projections and regression slopes.`,
    ],
    analogy: r`Expectation is the fulcrum where a seesaw balances; variance is how widely the weights are distributed along the plank; covariance is whether two passengers lean in unison.`,
    steps: [
      r`Calculate expected value $\mathbb{E}[X]$ by weighting every possible outcome by its probability (or integrating $x f(x) dx$).`,
      r`Exploit linearity of expectation: $\mathbb{E}[aX + bY] = a\mathbb{E}[X] + b\mathbb{E}[Y]$ holds whether variables are independent or not.`,
      r`Compute variance via the computational shortcut: $\operatorname{Var}(X) = \mathbb{E}[X^2] - (\mathbb{E}[X])^2$.`,
      r`Evaluate covariance $\operatorname{Cov}(X, Y) = \mathbb{E}[(X - \mathbb{E}[X])(Y - \mathbb{E}[Y])] = \mathbb{E}[XY] - \mathbb{E}[X]\mathbb{E}[Y]$.`,
      r`Assemble pairwise covariances into a symmetric, positive semi-definite covariance matrix $\boldsymbol{\Sigma}$ for multivariate modelling.`,
    ],
    math: [
      {
        h: 'Expected Value and Linearity',
        tex: r`$$\mathbb{E}[X] = \begin{cases} \sum_x x\,p(x) & \text{discrete} \\[6pt] \int_{-\infty}^\infty x\,f(x)\,dx & \text{continuous} \end{cases}, \qquad \mathbb{E}[aX + bY + c] = a\mathbb{E}[X] + b\mathbb{E}[Y] + c$$`,
        p: r`The expected value is the probability-weighted average (first moment). Linearity of expectation is an unconditional property that holds regardless of correlation or non-linear dependence between $X$ and $Y$.`,
      },
      {
        h: 'Variance and Standard Deviation',
        tex: r`$$\operatorname{Var}(X) = \mathbb{E}\big[(X - \mathbb{E}[X])^2\big] = \mathbb{E}[X^2] - (\mathbb{E}[X])^2, \qquad \operatorname{Var}(aX + b) = a^2\operatorname{Var}(X)$$`,
        p: r`Variance is the second central moment, quantifying dispersion around the mean in squared units. Adding a constant shift $b$ leaves spread unchanged, while multiplying by a scale factor $a$ magnifies variance by $a^2$. Standard deviation is $\sigma = \sqrt{\operatorname{Var}(X)}$.`,
      },
      {
        h: 'Covariance and Sum of Correlated Variables',
        tex: r`$$\operatorname{Cov}(X, Y) = \mathbb{E}[(X - \mu_X)(Y - \mu_Y)] = \mathbb{E}[XY] - \mu_X\mu_Y, \quad \operatorname{Var}(X \pm Y) = \operatorname{Var}(X) + \operatorname{Var}(Y) \pm 2\operatorname{Cov}(X, Y)$$`,
        p: r`Covariance measures joint linear tendency. If high values of $X$ coincide with high values of $Y$, covariance is positive; if they coincide with low values, it is negative. If $X$ and $Y$ are independent, $\operatorname{Cov}(X, Y) = 0$, though zero covariance does not necessarily imply independence.`,
      },
    ],
    keyPoints: [
      r`Linearity of expectation requires zero assumptions about independence; it holds universally across all random variables.`,
      r`Variance scales quadratically ($\operatorname{Var}(aX) = a^2\operatorname{Var}(X)$), which is why standard deviation is preferred for intuitive scale comparisons.`,
      r`Zero covariance indicates absence of linear association, but strong non-linear relationships (such as $Y = X^2$ for symmetric $X$) can still exist.`,
      r`Sample variance divides by $n - 1$ (Bessel's correction) rather than $n$ to guarantee an unbiased estimator of population variance.`,
    ],
    pitfalls: [
      r`Writing $\operatorname{Var}(aX + b) = a\operatorname{Var}(X) + b$; constants vanish under variance and scalar multipliers are squared ($a^2\operatorname{Var}(X)$).`,
      r`Assuming that $\operatorname{Cov}(X, Y) = 0$ implies $X$ and $Y$ are independent; covariance only checks for linear co-movement.`,
      r`Confusing sample variance (divided by $n-1$) with population variance (divided by $n$) when computing degrees of freedom.`,
      r`Comparing raw covariances across different features without standardising; features with larger numerical units naturally produce artificially massive covariances.`,
    ],
    code: r`import numpy as np

# Seeded inline data generation
rng = np.random.default_rng(42)
x = rng.normal(loc=10.0, scale=2.0, size=1000)
# y shares linear co-movement with x plus noise
y = 1.5 * x + rng.normal(loc=0.0, scale=1.0, size=1000)

mean_x, mean_y = np.mean(x), np.mean(y)
var_x = np.var(x, ddof=1)
cov_xy = np.cov(x, y)[0, 1]
var_sum = np.var(x + y, ddof=1)
theoretical_sum = var_x + np.var(y, ddof=1) + 2 * cov_xy

print(f"E[X] = {mean_x:.2f}, E[Y] = {mean_y:.2f}")
print(f"Var(X) = {var_x:.3f}, Cov(X, Y) = {cov_xy:.3f}")
print(f"Var(X + Y) empirical = {var_sum:.3f}, identity = {theoretical_sum:.3f}")`,
    quiz: [
      {
        q: r`If $X$ is a random variable with $\mathbb{E}[X] = 4$ and $\operatorname{Var}(X) = 9$, what is $\mathbb{E}[X^2]$?`,
        o: [r`16`, r`25`, r`13`, r`81`],
        a: 1,
        why: r`Using the identity $\operatorname{Var}(X) = \mathbb{E}[X^2] - (\mathbb{E}[X])^2$, we have $\mathbb{E}[X^2] = \operatorname{Var}(X) + (\mathbb{E}[X])^2 = 9 + 4^2 = 9 + 16 = 25$.`,
        d: 2,
      },
      {
        q: r`If $\operatorname{Var}(X) = 4$, what is $\operatorname{Var}(-3X + 5)$?`,
        o: [r`-12`, r`41`, r`36`, r`9`],
        a: 2,
        why: r`Constants shift the distribution without changing spread, and scalar multipliers are squared: $\operatorname{Var}(aX + b) = a^2\operatorname{Var}(X) = (-3)^2 \times 4 = 9 \times 4 = 36$.`,
        d: 2,
      },
      {
        q: r`If two random variables $X$ and $Y$ have $\operatorname{Cov}(X, Y) = 0$, which statement is strictly true?`,
        o: [r`$X$ and $Y$ are independent`, r`There is no linear association between $X$ and $Y$`, r`$X$ and $Y$ must be Gaussian`, r`$Y$ cannot be predicted from $X$`],
        a: 1,
        why: r`Zero covariance guarantees zero linear correlation. However, they can still share a deterministic non-linear relationship (e.g. $Y = X^2$ for symmetric $X$).`,
        d: 1,
      },
      {
        q: r`Why does sample variance use $n - 1$ in the denominator instead of $n$?`,
        o: [r`To correct for the degrees of freedom consumed when estimating the sample mean`, r`To make the variance larger on large datasets`, r`Because of the central limit theorem`, r`To match the formula for standard deviation`],
        a: 0,
        why: r`Using the sample mean $\bar{x}$ instead of the true population mean $\mu$ slightly underestimates squared deviations; dividing by $n - 1$ (Bessel's correction) yields an unbiased estimator.`,
        d: 1,
      },
      {
        q: r`Under what conditions does linearity of expectation, $\mathbb{E}[X + Y] = \mathbb{E}[X] + \mathbb{E}[Y]$, hold?`,
        o: [r`Only when $X$ and $Y$ are statistically independent`, r`Only when $X$ and $Y$ both follow a normal distribution`, r`Only when $\operatorname{Cov}(X, Y) = 0$`, r`For any random variables $X$ and $Y$, regardless of their dependence or joint distribution`],
        a: 3,
        why: r`Linearity of expectation is an algebraic property of integrals and summations. It holds universally for all random variables with finite expectations, with zero assumptions about independence.`,
        d: 1,
      },
      {
        q: r`What is the covariance of any random variable $X$ with itself, $\operatorname{Cov}(X, X)$?`,
        o: [r`$\operatorname{Var}(X)$`, r`1`, r`0`, r`$\mathbb{E}[X]$`],
        a: 0,
        why: r`By definition, $\operatorname{Cov}(X, X) = \mathbb{E}[(X - \mu_X)(X - \mu_X)] = \mathbb{E}[(X - \mu_X)^2] = \operatorname{Var}(X)$.`,
        d: 1,
      },
      {
        q: r`A game pays £20 with probability 0.2, £10 with probability 0.3, and £0 with probability 0.5. If it costs £8 to play, what is the net expected profit or loss per game?`,
        o: [r`Expected gain of £1.00`, r`Break-even (£0.00)`, r`Expected loss of £2.50`, r`Expected loss of £1.00`],
        a: 3,
        why: r`Expected payout is $\mathbb{E}[\text{payout}] = (20 \times 0.2) + (10 \times 0.3) + (0 \times 0.5) = 4 + 3 + 0 = £7.00$. Subtracting the £8.00 entry fee leaves a net expected loss of $£7 - £8 = -£1.00$.`,
        d: 2,
      },
      {
        q: r`If two independent random variables $X$ and $Y$ have variances $\operatorname{Var}(X) = 25$ and $\operatorname{Var}(Y) = 16$, what is the variance of their difference, $\operatorname{Var}(X - Y)$?`,
        o: [r`9`, r`1`, r`41`, r`20`],
        a: 2,
        why: r`Variances of independent variables always add, even when subtracting the variables: $\operatorname{Var}(X - Y) = \operatorname{Var}(X) + (-1)^2 \operatorname{Var}(Y) = 25 + 16 = 41$. Subtracting variances to get 9 is a classic pitfall.`,
        d: 2,
      },
      {
        q: r`Evaluating <code>np.var(data)</code> and <code>np.var(data, ddof=1)</code> on <code>data = np.array([2, 4, 4, 4, 6])</code> yields:`,
        o: [r`1.6 and 1.6`, r`2.0 and 1.6`, r`8.0 and 2.0`, r`1.6 and 2.0`],
        a: 3,
        why: r`The mean is 4. Sum of squared differences is $(-2)^2 + 0 + 0 + 0 + 2^2 = 8$. Default <code>np.var</code> divides by $n = 5$ (giving 1.6), whereas <code>ddof=1</code> applies Bessel's correction, dividing by $n - 1 = 4$ (giving 2.0).`,
        d: 2,
      },
      {
        q: r`Suppose $\operatorname{Var}(X) = 9$, $\operatorname{Var}(Y) = 16$, and $\operatorname{Cov}(X, Y) = -6$. What is the variance of the linear combination $Z = 2X - Y$?`,
        o: [r`28`, r`52`, r`76`, r`100`],
        a: 2,
        why: r`$\operatorname{Var}(2X - Y) = 2^2\operatorname{Var}(X) + (-1)^2\operatorname{Var}(Y) + 2(2)(-1)\operatorname{Cov}(X, Y) = 4(9) + 16 - 4(-6) = 36 + 16 + 24 = 76$.`,
        d: 3,
      },
      {
        q: r`Two binary random variables $X, Y \in \{0, 1\}$ have joint distribution $P(0,0)=0.4, P(0,1)=0.1, P(1,0)=0.1, P(1,1)=0.4$. What is their covariance $\operatorname{Cov}(X, Y)$?`,
        o: [r`0.15`, r`0.05`, r`0.25`, r`0.40`],
        a: 0,
        why: r`Marginal expectations are $\mathbb{E}[X] = 0.5$ and $\mathbb{E}[Y] = 0.5$. The product expectation is $\mathbb{E}[XY] = 1 \times P(1, 1) = 0.40$. Thus $\operatorname{Cov}(X, Y) = 0.40 - (0.50 \times 0.50) = 0.40 - 0.25 = 0.15$.`,
        d: 3,
      },
      {
        q: r`Let $X$ take values $\{-2, -1, 0, 1, 2\}$ each with probability $0.2$, and let $Y = X^2$. What is $\operatorname{Cov}(X, Y)$ and what does it reveal about independence?`,
        o: [r`$\operatorname{Cov}(X, Y) > 0$, confirming statistical dependence`, r`$\operatorname{Cov}(X, Y) = 0$, yet $X$ and $Y$ are strongly dependent`, r`$\operatorname{Cov}(X, Y) = 0$, confirming statistical independence`, r`$\operatorname{Cov}(X, Y) = 4$, confirming linear correlation`],
        a: 1,
        why: r`By symmetry, $\mathbb{E}[X] = 0$ and $\mathbb{E}[X^3] = 0$, so $\operatorname{Cov}(X, Y) = \mathbb{E}[X^3] - \mathbb{E}[X]\mathbb{E}[X^2] = 0$. However, $Y$ is completely determined by $X$, demonstrating that zero covariance does not imply statistical independence.`,
        d: 3,
      },
    ],
    usedBy: ['ols_linear_regression', 'linear_discriminant_analysis', 'gaussian_process_regressor'],
    prereq: ['random-variables-and-distributions'],
    related: ['correlation-pearson-spearman-kendall', 'bias-variance-tradeoff'],
    keywords: 'expectation variance covariance standard deviation expected value moments dispersion bessel',
  },
  {
    id: 'correlation-pearson-spearman-kendall',
    short: 'Correlation coefficients',
    title: 'Correlation: Pearson, Spearman, Kendall',
    task: 'concepts',
    module: 'Probability',
    level: 1,
    minutes: 15,
    noLab: true,
    summary: r`Measuring linear vs monotonic dependence: Pearson r for straight lines, Spearman rho for rank trends, and Kendall tau for concordant pairs.`,
    lead: r`Correlation standardises covariance into a dimensionless scale between -1 and +1, making associations comparable across features of completely different units. Choosing between Pearson, Spearman and Kendall determines whether your model looks for straight linear lines, rank monotonicity, or robust ordinal agreement in noisy data.`,
    intuition: [
      r`Suppose you track study hours and exam scores for 100 students. If every additional hour of studying reliably adds 3 percentage points to a score, the relationship is linear and Pearson's $r$ approaches $+1.0$. But now imagine an exponential learning curve: going from 1 to 2 hours doubles your score, but going from 20 to 21 hours barely registers a change. The relationship is strictly increasing (more study always helps), yet it is not a straight line. Pearson's $r$ drops because the line bends, but Spearman's rank correlation remains exactly $+1.0$.`,
      r`This distinction between linear and monotonic relationships is crucial in feature selection and exploratory data analysis. Pearson assumes both variables are interval-scaled, roughly normal, and free of extreme outliers. A single outlier—such as a rogue data point with 100 study hours and a score of 0—can pull a strong Pearson correlation of $+0.85$ down to zero or even flip its sign.`,
      r`Spearman and Kendall protect against this by discarding raw numerical distances and looking only at order. Spearman converts raw numbers to ranks ($1\text{st}, 2\text{nd}, 3\text{rd}\dots$) before applying Pearson's formula. Kendall takes an even cleaner combinatorial approach: it looks at every possible pair of students and counts whether the student with more study hours also got the higher exam score. This makes Kendall exceptionally robust on small sample sizes with heavy ties.`,
    ],
    analogy: r`Pearson checks if two runners maintain a constant speed ratio; Spearman checks if the first runner always finishes ahead of the second, regardless of the gap.`,
    steps: [
      r`Inspect a scatter plot to diagnose whether the expected relationship is strictly linear, non-linear monotonic, or contaminated by outliers.`,
      r`Compute Pearson's $r$ to assess linear association when both features are continuous and approximately Gaussian: $r = \frac{\operatorname{Cov}(X, Y)}{\sigma_X \sigma_Y}$.`,
      r`If the trend is curved or heavily skewed, convert values to fractional ranks and compute Spearman's $\rho$.`,
      r`On small samples or data with frequent tied ranks, compute Kendall's $\tau$ by evaluating the proportion of concordant versus discordant pairs.`,
      r`Test statistical significance via hypothesis tests ($t$-test for Pearson, permutation or asymptotic $z$ for ranks) against the null hypothesis $H_0: \rho = 0$.`,
    ],
    math: [
      {
        h: 'Pearson Product-Moment Correlation',
        tex: r`$$r = \frac{\sum_{i=1}^n (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum_{i=1}^n (x_i - \bar{x})^2}\sqrt{\sum_{i=1}^n (y_i - \bar{y})^2}} = \frac{\operatorname{Cov}(X, Y)}{\sigma_X \sigma_Y}$$`,
        p: r`Pearson's $r \in [-1, 1]$ standardises covariance by dividing by the product of both standard deviations. It measures the strength and direction of a purely linear relationship. $r = \pm 1$ indicates that points lie exactly along a straight line with positive or negative slope.`,
      },
      {
        h: 'Spearman Rank Correlation',
        tex: r`$$\rho = 1 - \frac{6 \sum_{i=1}^n d_i^2}{n(n^2 - 1)}, \qquad d_i = \operatorname{rank}(x_i) - \operatorname{rank}(y_i)$$`,
        p: r`Spearman's $\rho$ is Pearson's $r$ computed on the ordinal ranks of $X$ and $Y$. The simplified difference formula applies when there are no tied ranks ($d_i$ is the rank discrepancy). It measures monotonic relationships: whether one variable increases when the other increases, regardless of linearity.`,
      },
      {
        h: 'Kendall\'s Tau',
        tex: r`$$\tau = \frac{C - D}{\frac{1}{2} n (n - 1)}$$`,
        p: r`Kendall's $\tau$ counts pairwise concordance across all $\binom{n}{2}$ distinct observation pairs $(x_i, y_i)$ and $(x_j, y_j)$. A pair is concordant ($C$) if $(x_i - x_j)(y_i - y_j) > 0$, and discordant ($D$) if negative. It offers superior small-sample efficiency and intuitive probabilistic interpretation: $P(\text{concordance}) - P(\text{discordance})$.`,
      },
    ],
    keyPoints: [
      r`Correlation measures association, never causation: a third lurking variable can induce strong spurious correlations.`,
      r`Pearson is highly sensitive to outliers; a single distant rogue point can artificially inflate or destroy linear correlation.`,
      r`Spearman and Kendall are invariant to any strictly monotonic transformation, such as taking logarithms or square roots.`,
      r`Kendall's $\tau$ has a direct reading (the probability of a concordant pair minus the probability of a discordant pair) and is often preferred to Spearman's $\rho$ for small samples with many ties.`,
    ],
    pitfalls: [
      r`Relying on Pearson's $r$ for non-linear associations (e.g. Anscombe's quartet or quadratic curves where $r \approx 0$ despite perfect dependence).`,
      r`Confusing statistical significance ($p$-value) with practical significance; with a million rows, even $r = 0.01$ will have $p < 0.001$.`,
      r`Computing Pearson correlation on ordinal survey responses (e.g. Likert scales) instead of rank-based Spearman or Kendall.`,
      r`Assuming correlation implies zero multicollinearity; two features can have modest pairwise correlation yet cause severe multicollinearity in a multivariate regression.`,
    ],
    code: r`import numpy as np
from scipy import stats

rng = np.random.default_rng(42)
x = np.linspace(1, 10, 50)
# Strictly monotonic non-linear relationship: y = exp(x / 3) + noise
y = np.exp(x / 3.0) + rng.normal(0, 0.5, size=50)

# Add an extreme outlier to demonstrate robustness
x_out = np.append(x, [10.0])
y_out = np.append(y, [0.0])

r_clean, _ = stats.pearsonr(x, y)
rho_clean, _ = stats.spearmanr(x, y)
r_dirty, _ = stats.pearsonr(x_out, y_out)
rho_dirty, _ = stats.spearmanr(x_out, y_out)
tau_clean, _ = stats.kendalltau(x, y)

print(f"Clean Data   -> Pearson r: {r_clean:.3f}, Spearman rho: {rho_clean:.3f}, Kendall tau: {tau_clean:.3f}")
print(f"With Outlier -> Pearson r: {r_dirty:.3f}, Spearman rho: {rho_dirty:.3f}")`,
    quiz: [
      {
        q: r`If $Y = \exp(X)$ for strictly positive $X$, what are the Pearson and Spearman correlations?`,
        o: [r`Pearson $r = 1.0$, Spearman $\rho = 1.0$`, r`Pearson $r < 1.0$, Spearman $\rho = 1.0$`, r`Pearson $r = 1.0$, Spearman $\rho < 1.0$`, r`Both are 0 because the relationship is non-linear`],
        a: 1,
        why: r`The relationship is perfectly monotonic but non-linear. Spearman's rank correlation is strictly $1.0$, whereas Pearson's linear correlation is strictly less than $1.0$ due to curvature.`,
        d: 2,
      },
      {
        q: r`How does a single extreme outlier typically affect Pearson's $r$ compared to Spearman's $\rho$?`,
        o: [r`Pearson can be heavily distorted, while Spearman only changes by a predictable rank displacement`, r`Pearson is unaffected; Spearman fluctuates wildly`, r`Both change by the exact same amount`, r`Neither can change if $n > 30$`],
        a: 0,
        why: r`Pearson calculates squared Euclidean distances from the mean, so an outlier has immense leverage. Spearman ranks observations, so an outlier moves at most to the end of the ranking.`,
        d: 1,
      },
      {
        q: r`What does a Kendall tau ($\tau$) of $+0.6$ mean probabilistically?`,
        o: [r`60% of the variance in $Y$ is explained by $X$`, r`60% of the data points lie on the regression line`, r`The probability of drawing a concordant pair is 60 percentage points higher than drawing a discordant pair`, r`The slope of the line is 0.6`],
        a: 2,
        why: r`Kendall's $\tau = P(\text{concordant}) - P(\text{discordant})$, so $\tau = 0.6$ means the concordance probability exceeds discordance by 0.6.`,
        d: 2,
      },
      {
        q: r`You want to measure association between two ordinal survey ratings (1 to 5) that contain many tied values. Which choice is appropriate?`,
        o: [
          r`Pearson's $r$ on the raw scores, which assumes a linear relationship between the numbers`,
          r`Covariance, because it ignores the scale of the ratings`,
          r`A rank-based coefficient with a tie correction, such as Spearman's $\rho$ or Kendall's $\tau_b$`,
          r`$R^2$ from a straight-line fit`,
        ],
        a: 2,
        why: r`Ordinal ratings carry order but not equal spacing, so a rank-based measure fits. With many ties you need a version that corrects for them: Spearman's $\rho$ uses average ranks and Kendall's $\tau_b$ adjusts its denominator.`,
        d: 1,
      },
      {
        q: r`What happens to Pearson's correlation $r(X, Y)$ if you transform the variables by setting $X' = 2X$ and $Y' = Y + 10$?`,
        o: [r`$r$ doubles`, r`$r$ increases by 10`, r`$r$ is multiplied by 20`, r`$r$ remains completely unchanged`],
        a: 3,
        why: r`Pearson's $r$ is invariant to positive affine transformations ($aX + b$ with $a > 0$). Scaling changes covariance and standard deviations by the exact same factor, which cancels in the ratio.`,
        d: 1,
      },
      {
        q: r`Which correlation measure evaluates associations strictly by counting whether pairs of observations agree in their relative rank directions (concordant versus discordant pairs)?`,
        o: [r`Pearson's $r$`, r`Kendall's $\tau$`, r`Spearman's $\rho$`, r`Adjusted $R^2$`],
        a: 1,
        why: r`Kendall's $\tau$ is defined combinatorially as $(C - D) / \binom{n}{2}$, evaluating concordant and discordant pairs directly.`,
        d: 1,
      },
      {
        q: r`Running <code>scipy.stats.pearsonr([1, 2, 3, 4, 5], [10, 20, 30, 40, 50])</code> yields correlation $r$ equal to:`,
        o: [r`1.0`, r`0.5`, r`10.0`, r`0.0`],
        a: 0,
        why: r`The relationship $y = 10x$ is a straight line with zero residual error. Pearson's $r$ measures linear association on a normalised scale from $-1$ to $+1$, yielding exactly $+1.0$.`,
        d: 2,
      },
      {
        q: r`An analyst computes Pearson's $r = 0.02$ on a dataset of $n = 10{,}000{,}000$ rows and finds $p < 0.00001$. How should this result be interpreted?`,
        o: [r`The association is both statistically and practically massive`, r`One variable is confirmed to causally drive the other`, r`The calculation is mathematically invalid because $p$-values cannot be small when $r \approx 0$`, r`The correlation is statistically distinguishable from zero due to sample size, but explains negligible variance`],
        a: 3,
        why: r`With $10^7$ rows, standard error is tiny ($\approx 1/\sqrt{n}$), making even a trivial $r = 0.02$ (which explains only $0.04\%$ of variance) statistically significant while practically inconsequential.`,
        d: 2,
      },
      {
        q: r`Two continuous positive features $X$ and $Y$ have Spearman rank correlation $\rho = 0.75$. If you replace $X$ with $\log(X)$ and $Y$ with $Y^3$, what is the new Spearman rank correlation?`,
        o: [r`0.75`, r`1.0`, r`0.25`, r`2.25`],
        a: 0,
        why: r`Both logarithm and cubing are strictly increasing monotonic transformations. They leave observation ranks completely unchanged, so rank correlations like Spearman's $\rho$ remain identical.`,
        d: 2,
      },
      {
        q: r`Given four observations $(X, Y)$: $(1, 2), (2, 1), (3, 4), (4, 3)$, what is Kendall's $\tau$?`,
        o: [r`0.00`, r`0.50`, r`0.33`, r`0.67`],
        a: 2,
        why: r`There are $\binom{4}{2} = 6$ pairs. Four pairs are concordant ($(1,2)\&(3,4), (1,2)\&(4,3), (2,1)\&(3,4), (2,1)\&(4,3)$) and two are discordant ($(1,2)\&(2,1), (3,4)\&(4,3)$). Thus $\tau = (4 - 2) / 6 = 2/6 = 1/3 \approx 0.33$.`,
        d: 3,
      },
      {
        q: r`For the four points with $X$ ranks $(1, 2, 3, 4)$ and $Y$ ranks $(2, 1, 4, 3)$, what is Spearman's rank correlation $\rho$?`,
        o: [r`0.40`, r`0.60`, r`0.80`, r`0.20`],
        a: 1,
        why: r`Rank differences are $d = [-1, +1, -1, +1]$, so $\sum d_i^2 = 1 + 1 + 1 + 1 = 4$. Using $\rho = 1 - \frac{6 \sum d_i^2}{n(n^2 - 1)} = 1 - \frac{24}{4(15)} = 1 - 0.40 = 0.60$.`,
        d: 3,
      },
      {
        q: r`Two features have $\operatorname{Var}(X) = 25$, $\operatorname{Var}(Y) = 64$, and $\operatorname{Cov}(X, Y) = -24$. What is Pearson's $r$ and the proportion of variance explained ($r^2$)?`,
        o: [r`$r = -0.48$ and $r^2 = 0.23$`, r`$r = -0.30$ and $r^2 = 0.09$`, r`$r = -0.60$ and $r^2 = -0.36$`, r`$r = -0.60$ and $r^2 = 0.36$`],
        a: 3,
        why: r`Standard deviations are $\sigma_X = 5$ and $\sigma_Y = 8$. Pearson's $r = -24 / (5 \times 8) = -24 / 40 = -0.60$. The coefficient of determination is $r^2 = (-0.60)^2 = 0.36$ (36%).`,
        d: 3,
      },
    ],
    usedBy: ['feature-selection', 'ols_linear_regression', 'ridge_regression'],
    prereq: ['expectation-variance-and-covariance'],
    related: ['feature-selection', 'exploratory-data-analysis', 'ols_linear_regression'],
    keywords: 'correlation pearson spearman kendall rank linear monotonic association collinearity',
  },
  {
    id: 'central-limit-theorem-and-law-of-large-numbers',
    short: 'CLT and LLN',
    title: 'Central Limit Theorem and Law of Large Numbers',
    task: 'concepts',
    module: 'Probability',
    level: 1,
    minutes: 16,
    noLab: true,
    summary: r`Why averages converge and bell curves appear everywhere: the Law of Large Numbers pins down the mean, while the Central Limit Theorem dictates the shape of sample sums.`,
    lead: r`The Law of Large Numbers guarantees that sample averages converge to the true population expectation as sample size grows. The Central Limit Theorem goes further, proving that the standardised sum or mean of independent random variables converges to a Gaussian distribution, regardless of the underlying distribution's shape.`,
    intuition: [
      r`Imagine rolling a fair six-sided die. A single roll has a completely flat, discrete uniform distribution: 1, 2, 3, 4, 5, or 6 each appear with equal probability 1/6. The true expected value is 3.5. If you roll the die 10 times, your average might be 2.9 or 4.1. But roll it 10,000 times, and the average will be virtually indistinguishable from 3.5. That stability is the Law of Large Numbers (LLN): random noise cancels out across large samples.`,
      r`Now, instead of one long run, imagine taking 1,000 separate players. Each player rolls 30 dice and computes their own average. If you plot the histogram of those 1,000 averages, something remarkable emerges: the flat uniform distribution has completely vanished. In its place sits a smooth, bell-shaped Gaussian curve centred at 3.5.`,
      r`This is the Central Limit Theorem (CLT). Even if the original population is skewed, bimodal, or uniform, the distribution of sample averages becomes approximately normal once sample size $n$ is sufficiently large (typically $n \ge 30$). This explains why Gaussian assumptions dominate machine learning: measurement errors and composite features are usually sums of many small, independent underlying effects.`,
    ],
    analogy: r`The Law of Large Numbers tells you that a fleet of ships will on average reach their port; the Central Limit Theorem describes the bell-shaped dispersion pattern of their arrival times.`,
    steps: [
      r`Draw independent, identically distributed (i.i.d.) observations $X_1, X_2, \dots, X_n$ from any population with finite mean $\mu$ and variance $\sigma^2$.`,
      r`Compute the sample average $\bar{X}_n = \frac{1}{n}\sum_{i=1}^n X_i$.`,
      r`Observe the Law of Large Numbers in action: as $n \to \infty$, the sample mean $\bar{X}_n$ converges in probability to the true population mean $\mu$.`,
      r`Apply the Central Limit Theorem: standardise the sum or mean to form $Z_n = \frac{\bar{X}_n - \mu}{\sigma / \sqrt{n}}$.`,
      r`Approximate probabilities of sample averages using the standard Gaussian CDF $\Phi(z)$ whenever $n$ is adequately large.`,
    ],
    math: [
      {
        h: 'Weak and Strong Laws of Large Numbers',
        tex: r`$$\text{Weak Law (WLLN): } \lim_{n \to \infty} P(|\bar{X}_n - \mu| \ge \varepsilon) = 0, \qquad \text{Strong Law (SLLN): } P\left(\lim_{n \to \infty} \bar{X}_n = \mu\right) = 1$$`,
        p: r`The Weak Law (Khinchin's theorem) guarantees convergence in probability: for any margin $\varepsilon > 0$, the probability of a discrepancy larger than $\varepsilon$ decays to 0. The Strong Law (Kolmogorov's theorem) guarantees almost sure convergence: the sample trajectory itself converges to the constant $\mu$ with probability 1.`,
      },
      {
        h: 'The Lindeberg–Lévy Central Limit Theorem',
        tex: r`$$\sqrt{n}\left(\frac{\bar{X}_n - \mu}{\sigma}\right) \xrightarrow{d} \mathcal{N}(0, 1) \quad \text{as } n \to \infty$$`,
        p: r`For any sequence of i.i.d. random variables with finite variance $\sigma^2 < \infty$, the distribution of the normalised error converges in distribution ($\xrightarrow{d}$) to a standard Gaussian. Equivalently, the unstandardised sample mean follows approximately $\bar{X}_n \sim \mathcal{N}\left(\mu, \frac{\sigma^2}{n}\right)$.`,
      },
      {
        h: 'Berry–Esseen Rate of Convergence',
        tex: r`$$\sup_{z \in \mathbb{R}} \big| F_n(z) - \Phi(z) \big| \le \frac{C \cdot \mathbb{E}\big[|X - \mu|^3\big]}{\sigma^3 \sqrt{n}}$$`,
        p: r`The Berry–Esseen theorem bounds the maximum discrepancy between the actual CDF of the standardised sample mean $F_n(z)$ and the standard normal CDF $\Phi(z)$. The convergence rate is $O(1/\sqrt{n})$, scaled by the population skewness. Heavily skewed distributions require larger $n$ before the normal approximation becomes accurate.`,
      },
    ],
    keyPoints: [
      r`LLN guarantees that empirical risk converges to expected risk in machine learning as training set size grows.`,
      r`CLT applies to the sum or average of random variables, not to the raw data distribution itself; raw data does not magically become normal.`,
      r`Finite variance is an absolute requirement; heavy-tailed distributions like Cauchy have no finite variance and violate the CLT entirely.`,
      r`The spread of sample averages shrinks at the rate $1/\sqrt{n}$, meaning halving estimation error requires quadrupling the sample size.`,
    ],
    pitfalls: [
      r`Believing the raw data becomes normally distributed with more samples; only sample sums and averages become normal.`,
      r`Applying CLT to Cauchy or Pareto distributions with infinite variance where averages wander erratically forever.`,
      r`Assuming $n = 30$ is always sufficient; heavily skewed or zero-inflated distributions can require hundreds or thousands of samples for good Gaussian fits.`,
      r`Confusing standard deviation of the population ($\sigma$) with standard error of the mean ($\sigma / \sqrt{n}$).`,
    ],
    code: r`import numpy as np

rng = np.random.default_rng(42)
# Draw from a heavily skewed Exponential distribution (scale = 2.0)
scale = 2.0
n_samples = 50
n_experiments = 5000

# True parameters: mean = scale, var = scale^2
true_mean = scale
true_se = scale / np.sqrt(n_samples)

# Simulate 5,000 separate sample means of size n = 50
means = rng.exponential(scale=scale, size=(n_experiments, n_samples)).mean(axis=1)

empirical_mean = np.mean(means)
empirical_se = np.std(means, ddof=1)
# Fraction of sample averages falling within 1.96 standard errors of the mean
coverage = np.mean(np.abs(means - true_mean) <= 1.96 * true_se)

print(f"True Mean: {true_mean:.2f}, Simulated Mean: {empirical_mean:.4f}")
print(f"Theoretical SE: {true_se:.4f}, Simulated SE: {empirical_se:.4f}")
print(f"95% Gaussian Coverage: {coverage * 100:.2f}%")`,
    quiz: [
      {
        q: r`What happens to the distribution of individual data points $X_i$ as the sample size $n$ increases?`,
        o: [r`It approaches a standard normal distribution`, r`It remains exactly the true population distribution from which it is drawn`, r`Its variance drops to zero`, r`It becomes uniform`],
        a: 1,
        why: r`The CLT applies exclusively to sample sums and averages. The raw individual observations continue to reflect their true underlying population distribution regardless of sample size.`,
        d: 1,
      },
      {
        q: r`If you wish to cut the standard error of a sample mean in half, by what factor must you increase the sample size?`,
        o: [r`2`, r`$\sqrt{2}$`, r`4`, r`8`],
        a: 2,
        why: r`The standard error is $\sigma / \sqrt{n}$. To divide the error by 2, $n$ must increase by a factor of $2^2 = 4$.`,
        d: 2,
      },
      {
        q: r`Which fundamental condition must a probability distribution satisfy for the classical Lindeberg–Lévy CLT to hold?`,
        o: [r`The population must be symmetric`, r`The sample size must exceed 100,000`, r`The observations must be correlated`, r`The population must have finite variance`],
        a: 3,
        why: r`The classical CLT requires independent, identically distributed observations with finite mean and finite variance ($\sigma^2 < \infty$). Distributions with infinite variance (like Cauchy) violate CLT.`,
        d: 1,
      },
      {
        q: r`What is the conceptual difference between the Law of Large Numbers (LLN) and the Central Limit Theorem (CLT)?`,
        o: [r`LLN shows the sample mean converges to the true mean; CLT describes the distribution of errors around that mean`, r`LLN describes the limiting Gaussian shape; CLT proves the mean converges to a point`, r`LLN applies only to continuous variables; CLT applies only to discrete variables`, r`There is no difference; they are alternative names for the same theorem`],
        a: 0,
        why: r`LLN pins down the destination ($\bar{X}_n \to \mu$), whereas CLT provides the rate and probability distribution of the fluctuations around that destination ($\sqrt{n}(\bar{X}_n - \mu) \to \mathcal{N}(0, \sigma^2)$).`,
        d: 2,
      },
      {
        q: r`Which of the following distributions is a celebrated counterexample where sample averages fail to converge under the Law of Large Numbers because it lacks a finite mean?`,
        o: [r`Uniform distribution`, r`Cauchy distribution`, r`Exponential distribution`, r`Poisson distribution`],
        a: 1,
        why: r`The Cauchy distribution has heavy polynomial tails and undefined mean and variance. Averaging $n$ Cauchy variables produces the exact same Cauchy spread, never concentrating around a point.`,
        d: 1,
      },
      {
        q: r`What distinguishes the Weak Law of Large Numbers (WLLN) from the Strong Law of Large Numbers (SLLN)?`,
        o: [r`WLLN describes variance; SLLN describes expectation`, r`WLLN applies to independent variables; SLLN applies to dependent variables`, r`WLLN applies only to small samples; SLLN applies when $n \ge 30$`, r`WLLN establishes convergence in probability; SLLN establishes almost sure convergence with probability 1`],
        a: 3,
        why: r`The Weak Law (Khinchin) proves that $P(|\bar{X}_n - \mu| \ge \varepsilon) \to 0$ as $n \to \infty$. The Strong Law (Kolmogorov) proves that the sample average trajectory converges to $\mu$ with probability 1.`,
        d: 1,
      },
      {
        q: r`A machine packs bags with mean weight 250 g and standard deviation 5 g. For a box containing 100 independently filled bags, what are the expected total weight and standard deviation of the box?`,
        o: [r`25,000 g and 500 g`, r`25,000 g and 0.5 g`, r`25,000 g and 50 g`, r`2,500 g and 50 g`],
        a: 2,
        why: r`Expected values add directly ($\mathbb{E}[S] = 100 \times 250 = 25{,}000\text{ g}$). Variances add ($\operatorname{Var}(S) = 100 \times 5^2 = 2{,}500$), so standard deviation is $\sqrt{2{,}500} = 50\text{ g}$.`,
        d: 2,
      },
      {
        q: r`A simulation averages 64 independent $U(0, 1)$ random variables ($\mu = 0.5, \sigma \approx 0.2887$) across 10,000 runs. What should the empirical standard deviation of these 10,000 means be closest to?`,
        o: [r`0.036`, r`0.289`, r`0.005`, r`0.500`],
        a: 0,
        why: r`By the CLT, the standard error of the sample mean is $\sigma / \sqrt{n} = 0.2887 / \sqrt{64} = 0.2887 / 8 \approx 0.0361$.`,
        d: 2,
      },
      {
        q: r`According to the Berry–Esseen theorem, what property of the underlying population primarily governs how quickly sample averages converge to normality?`,
        o: [r`Whether the support is continuous or discrete`, r`The population median`, r`The standardised third moment (skewness)`, r`The size of the population mean`],
        a: 2,
        why: r`Berry–Esseen bounds the maximum discrepancy from a normal CDF by $\frac{C \cdot \mathbb{E}[|X - \mu|^3]}{\sigma^3 \sqrt{n}}$. Heavily skewed populations converge much more slowly than symmetric ones.`,
        d: 2,
      },
      {
        q: r`Server request times have mean $\mu = 40\text{ ms}$ and standard deviation $\sigma = 30\text{ ms}$. For a random sample of $n = 100$ requests, what is the approximate probability that the sample mean latency exceeds $45\text{ ms}$? (Given: $P(Z > 1.67) \approx 0.048$).`,
        o: [r`33.3%`, r`15.9%`, r`2.5%`, r`4.8%`],
        a: 3,
        why: r`Standard error is $\sigma / \sqrt{n} = 30 / \sqrt{100} = 3\text{ ms}$. The $z$-score is $(45 - 40) / 3 = 5/3 \approx 1.67$. Using standard normal tables, $P(Z > 1.67) \approx 0.048$ (or 4.8%).`,
        d: 3,
      },
      {
        q: r`Battery lifetime has population standard deviation $\sigma = 80\text{ hours}$. What is the minimum sample size $n$ required so that the standard error of the sample mean is at most $4\text{ hours}$?`,
        o: [r`400`, r`100`, r`20`, r`1,600`],
        a: 0,
        why: r`Setting $\sigma / \sqrt{n} \le 4$ gives $80 / \sqrt{n} \le 4$, so $\sqrt{n} \ge 20$, which implies $n \ge 20^2 = 400$.`,
        d: 3,
      },
      {
        q: r`Suppose $X_1, X_2, \dots, X_n$ are drawn from a heavy-tailed distribution with finite mean $\mu$ but infinite variance $\sigma^2 = \infty$. How does the normalised sample average behave as $n \to \infty$?`,
        o: [r`It converges to a standard Gaussian by the Lindeberg–Lévy CLT`, r`It converges to an alpha-stable non-Gaussian distribution rather than a normal distribution`, r`It fails to converge to any distribution because the mean is undefined`, r`Its standard deviation drops to zero at rate $1/n$`],
        a: 1,
        why: r`The classical Lindeberg–Lévy CLT requires finite variance. When variance is infinite, the generalised CLT states that sums of independent variables converge to Lévy alpha-stable distributions.`,
        d: 3,
      },
    ],
    usedBy: ['ols_linear_regression', 'linear_discriminant_analysis'],
    prereq: ['random-variables-and-distributions', 'expectation-variance-and-covariance'],
    related: ['sampling-and-standard-error', 'confidence-intervals'],
    keywords: 'central limit theorem law large numbers clt lln gaussian convergence normal distribution standard error',
  },
  {
    id: 'sampling-and-standard-error',
    short: 'Sampling & standard error',
    title: 'Sampling and Standard Error',
    task: 'concepts',
    module: 'Estimation',
    level: 1,
    minutes: 15,
    noLab: true,
    summary: r`Distinguishing population variability from estimation uncertainty: standard deviation measures individual spread, standard error measures how much sample statistics fluctuate.`,
    lead: r`Statistical inference hinges on distinguishing between the spread of individual observations and the uncertainty of a summary statistic. While standard deviation quantifies the dispersion of the raw population, standard error measures the variability of an estimator across hypothetical repeated samples.`,
    intuition: [
      r`Suppose you want to know the average income in a city of 1,000,000 residents. Asking every resident is prohibitively expensive, so you draw a random sample of 100 people. Some make £25,000, some £60,000, and a few make £150,000. The standard deviation of your sample—say £20,000—describes the broad diversity of incomes among individual citizens. It will not shrink if you survey 1,000 people instead; people's salaries remain just as diverse.`,
      r`Now consider the sample mean income, which turns out to be £45,000. If your colleague surveys a completely different random sample of 100 residents, they might find a mean of £43,200. A third sample might yield £47,100. The spread of these hypothetical sample averages is the standard error (SE). Because averages are far more stable than individual measurements, the standard error for $n = 100$ is much smaller than the standard deviation: roughly $£20,000 / \sqrt{100} = £2,000$.`,
      r`Crucially, while population standard deviation stays constant as sample size grows, standard error shrinks steadily at rate $1/\sqrt{n}$. If you expand your survey to 10,000 residents, your sample standard deviation remains £20,000, but your standard error plunges to $£20,000 / \sqrt{10,000} = £200$. Standard error directly measures the precision of your estimate.`,
    ],
    analogy: r`Standard deviation is the size of the waves in the ocean; standard error is the slight bobbing of a massive cargo ship resting on those waves.`,
    steps: [
      r`Identify the population parameter of interest (e.g. population mean $\mu$ or proportion $p$).`,
      r`Draw a representative random sample of size $n$ using independent, identically distributed sampling.`,
      r`Compute the sample statistic (the point estimate), such as the sample mean $\bar{x}$ or sample proportion $\hat{p}$.`,
      r`Compute the sample standard deviation $s$ as a measure of raw observational scatter.`,
      r`Calculate the estimated standard error of the estimator: $\operatorname{SE}(\bar{x}) = s / \sqrt{n}$.`,
      r`Use the standard error to construct confidence intervals or evaluate statistical significance in hypothesis testing.`,
    ],
    math: [
      {
        h: 'Standard Deviation vs. Standard Error',
        tex: r`$$\sigma = \sqrt{\frac{1}{N}\sum_{i=1}^N (x_i - \mu)^2} \qquad \text{vs.} \qquad \operatorname{SE}(\bar{X}) = \frac{\sigma}{\sqrt{n}} \approx \frac{s}{\sqrt{n}}$$`,
        p: r`The standard deviation $\sigma$ describes the inherent variability of individual observations in the population. The standard error $\operatorname{SE}(\bar{X})$ is the standard deviation of the sampling distribution of the sample mean $\bar{X}$. When the population $\sigma$ is unknown, we substitute the sample standard deviation $s = \sqrt{\frac{1}{n-1}\sum (x_i - \bar{x})^2}$.`,
      },
      {
        h: 'Standard Error of a Proportion',
        tex: r`$$\operatorname{SE}(\hat{p}) = \sqrt{\frac{p(1 - p)}{n}} \approx \sqrt{\frac{\hat{p}(1 - \hat{p})}{n}}$$`,
        p: r`For binary outcomes (Bernoulli trials with probability of success $p$), the variance is $p(1-p)$. The standard error of the sample proportion $\hat{p}$ peaks at $p = 0.5$ and decays symmetrically toward the boundaries 0 and 1.`,
      },
      {
        h: 'Finite Population Correction (FPC)',
        tex: r`$$\operatorname{SE}_{\text{finite}}(\bar{X}) = \frac{\sigma}{\sqrt{n}} \sqrt{\frac{N - n}{N - 1}}$$`,
        p: r`When sampling without replacement from a finite population of size $N$, observations are not strictly independent. The finite population correction factor $\sqrt{(N-n)/(N-1)}$ shrinks the standard error toward zero as the sample size $n$ approaches the full population size $N$.`,
      },
    ],
    keyPoints: [
      r`Standard deviation describes data spread; standard error describes estimator precision.`,
      r`Standard error always decreases as sample size increases, scaling strictly with $1/\sqrt{n}$.`,
      r`Reporting an estimate without its standard error gives an illusion of certainty without context.`,
      r`In linear regression, every coefficient $\beta_j$ has a dedicated standard error used to compute $t$-statistics.`,
    ],
    pitfalls: [
      r`Reporting standard deviation when asked for estimation uncertainty, or reporting standard error to describe population diversity.`,
      r`Assuming non-random convenience samples can be cured with standard error formulas; selection bias invalidates standard error entirely.`,
      r`Forgetting the $1/\sqrt{n}$ diminishing returns; doubling precision requires a fourfold increase in data.`,
      r`Omitting Bessel's correction ($n-1$) when computing sample standard deviation on small samples.`,
    ],
    code: r`import numpy as np

rng = np.random.default_rng(42)
true_mu, true_sigma = 50.0, 12.0

sample_sizes = [25, 100, 400, 1600]
print("True Population SD:", true_sigma)

for n in sample_sizes:
    # Draw 1,000 independent samples of size n
    samples = rng.normal(loc=true_mu, scale=true_sigma, size=(1000, n))
    sample_means = samples.mean(axis=1)
    
    single_sample = samples[0]
    s = np.std(single_sample, ddof=1)
    estimated_se = s / np.sqrt(n)
    empirical_se = np.std(sample_means, ddof=1)
    
    print(f"n={n:4d} | Sample SD: {s:.2f} | Est SE: {estimated_se:.3f} | Empirical SE: {empirical_se:.3f}")`,
    quiz: [
      {
        q: r`What is the primary conceptual difference between standard deviation and standard error?`,
        o: [r`Standard deviation measures dispersion of individual observations; standard error measures the variability of a sample statistic across samples`, r`Standard error is for discrete data; standard deviation is for continuous data`, r`Standard error is always larger than standard deviation`, r`Standard deviation decreases with sample size, while standard error remains constant`],
        a: 0,
        why: r`Standard deviation describes the spread of individual observations in a population or sample. Standard error describes the spread of the sampling distribution of an estimator (e.g. sample mean).`,
        d: 1,
      },
      {
        q: r`If a sample of 64 observations has a sample standard deviation of $s = 16$, what is the estimated standard error of the mean?`,
        o: [r`0.25`, r`2.0`, r`4.0`, r`8.0`],
        a: 1,
        why: r`$\operatorname{SE}(\bar{x}) = s / \sqrt{n} = 16 / \sqrt{64} = 16 / 8 = 2.0$.`,
        d: 2,
      },
      {
        q: r`What happens to the population standard deviation $\sigma$ and the standard error of the mean $\operatorname{SE}(\bar{X})$ as the sample size $n$ grows arbitrarily large?`,
        o: [r`Both converge to zero`, r`$\sigma$ grows toward infinity; $\operatorname{SE}(\bar{X})$ remains constant`, r`$\sigma$ remains fixed (it is a population constant); $\operatorname{SE}(\bar{X})$ converges toward zero`, r`Both remain constant`],
        a: 2,
        why: r`The population standard deviation $\sigma$ is a fixed physical attribute of the population. The standard error $\sigma / \sqrt{n}$ measures sampling uncertainty and converges to 0 as $n \to \infty$.`,
        d: 1,
      },
      {
        q: r`For a binary classification test set of $n = 400$ instances with an observed accuracy of $\hat{p} = 0.80$, what is the estimated standard error of the accuracy estimate?`,
        o: [r`0.04`, r`0.16`, r`0.20`, r`0.02`],
        a: 3,
        why: r`$\operatorname{SE}(\hat{p}) = \sqrt{\hat{p}(1 - \hat{p}) / n} = \sqrt{(0.80 \times 0.20) / 400} = \sqrt{0.16 / 400} = \sqrt{0.0004} = 0.02$ (or 2 percentage points).`,
        d: 2,
      },
      {
        q: r`At what true population proportion $p$ is the standard error $\operatorname{SE}(\hat{p}) = \sqrt{p(1-p)/n}$ at its maximum for any fixed sample size $n$?`,
        o: [r`$p = 0.50$`, r`$p = 0.05$`, r`$p = 0.95$`, r`$p = 1.00$`],
        a: 0,
        why: r`The Bernoulli variance $p(1 - p)$ is a quadratic curve peaking at $p = 0.50$ (where $p(1 - p) = 0.25$). As $p$ approaches 0 or 1, the variance and standard error shrink toward zero.`,
        d: 1,
      },
      {
        q: r`When sampling without replacement from a finite population of size $N$, which factor is applied to adjust the standard error of the sample mean?`,
        o: [r`Bessel's correction factor $\frac{n}{n - 1}$`, r`Student's $t$ critical multiplier`, r`Bonferroni's correction $\frac{\alpha}{k}$`, r`The Finite Population Correction (FPC), $\sqrt{\frac{N - n}{N - 1}}$`],
        a: 3,
        why: r`The Finite Population Correction factor $\sqrt{(N-n)/(N-1)}$ accounts for the reduction in sampling variability when a sizable fraction of the finite population is sampled without replacement.`,
        d: 1,
      },
      {
        q: r`Study A surveys 100 participants and reports $\operatorname{SE} = 6.0$. If Study B samples the same population and desires a standard error of $\operatorname{SE} = 1.5$, how many participants must Study B recruit?`,
        o: [r`400`, r`1,600`, r`800`, r`2,400`],
        a: 1,
        why: r`Standard error shrinks as $1/\sqrt{n}$. To cut the standard error by a factor of $6.0 / 1.5 = 4$, the sample size must increase by a factor of $4^2 = 16$. Thus $n = 100 \times 16 = 1{,}600$.`,
        d: 2,
      },
      {
        q: r`In Python, evaluating <code>s / np.sqrt(len(data))</code> where <code>s = np.std(data, ddof=1)</code> computes:`,
        o: [r`The population standard deviation`, r`The median absolute deviation`, r`The estimated standard error of the sample mean using Bessel's correction`, r`The variance of individual data points`],
        a: 2,
        why: r`Dividing the sample standard deviation by $\sqrt{n}$ calculates the standard error of the mean. Using <code>ddof=1</code> ensures the sample variance estimator is unbiased.`,
        d: 2,
      },
      {
        q: r`An online survey collects 250,000 voluntary responses and calculates a tiny standard error of $\pm 0.1\%$. Why can this precision be deceptive?`,
        o: [r`The formula $\sqrt{p(1-p)/n}$ is mathematically invalid for sample sizes over 100,000`, r`Standard error only measures random sampling variability, not systematic selection bias from voluntary participation`, r`Standard error cannot be computed on proportion data`, r`Surveys must always have a minimum standard error of 5%`],
        a: 1,
        why: r`Standard error only reflects random sampling fluctuations under probability sampling. It cannot diagnose or fix systematic sampling bias (e.g. self-selection), which undermines the estimate regardless of sample size.`,
        d: 2,
      },
      {
        q: r`A company has $N = 500$ employees. A random audit of $n = 100$ employees without replacement yields $s = 20\text{ hours}$. Using the Finite Population Correction $\sqrt{\frac{N-n}{N-1}}$, what is the corrected standard error? (Given: $\sqrt{400/499} \approx 0.895$).`,
        o: [r`2.00 hours`, r`1.44 hours`, r`1.79 hours`, r`0.89 hours`],
        a: 2,
        why: r`The unadjusted standard error is $s / \sqrt{n} = 20 / 10 = 2.0\text{ hours}$. Multiplying by the FPC factor $\sqrt{400/499} \approx 0.8953$ gives $2.0 \times 0.8953 \approx 1.79\text{ hours}$.`,
        d: 3,
      },
      {
        q: r`An A/B test has two independent groups: Group A ($n_A = 100, s_A^2 = 300$) and Group B ($n_B = 100, s_B^2 = 100$). What is the standard error of the difference between the two sample means, $\operatorname{SE}(\bar{x}_A - \bar{x}_B)$?`,
        o: [r`2.0`, r`4.0`, r`1.0`, r`5.0`],
        a: 0,
        why: r`For independent samples, variances of the sample means sum: $\operatorname{Var}(\bar{x}_A - \bar{x}_B) = \frac{s_A^2}{n_A} + \frac{s_B^2}{n_B} = \frac{300}{100} + \frac{100}{100} = 3 + 1 = 4$. Taking the square root gives $\operatorname{SE} = \sqrt{4} = 2.0$.`,
        d: 3,
      },
      {
        q: r`A model achieves test accuracy $\hat{p} = 0.90$. To ensure the standard error of this accuracy estimate is at most 0.015 (1.5 percentage points), what is the minimum test sample size $n$?`,
        o: [r`100`, r`225`, r`600`, r`400`],
        a: 3,
        why: r`Setting $\sqrt{\hat{p}(1-\hat{p})/n} \le 0.015$ gives $(0.90 \times 0.10) / n \le 0.015^2 = 0.000225$. Thus $n \ge 0.09 / 0.000225 = 400$.`,
        d: 3,
      },
    ],
    usedBy: ['ols_linear_regression', 'logistic_regression'],
    prereq: ['expectation-variance-and-covariance', 'central-limit-theorem-and-law-of-large-numbers'],
    related: ['confidence-intervals', 'bootstrap-and-jackknife'],
    keywords: 'sampling standard error standard deviation population sample mean proportion bessel',
  },
  {
    id: 'confidence-intervals',
    short: 'Confidence intervals',
    title: 'Confidence Intervals',
    task: 'concepts',
    module: 'Estimation',
    level: 1,
    minutes: 16,
    noLab: true,
    summary: r`Quantifying parameter uncertainty with frequentist coverage: margin of error, critical values, Student's t distribution, and proper probabilistic interpretation.`,
    lead: r`A point estimate alone provides an incomplete picture of an unknown population parameter. Confidence intervals construct a calibrated range around the estimate, guaranteeing that a chosen percentage of such intervals across repeated sampling will trap the true parameter value.`,
    intuition: [
      r`Imagine an archer shooting arrows at a bullseye hidden in thick fog. You cannot see where the bullseye is, but you can see where each arrow lands. If you only look at one arrow, you have a point estimate of where the target might be. But if you draw a circle around that arrow with a radius based on the archer's known spread, you create an interval. If the radius is calibrated for 95% confidence, then across 100 shots in the fog, about 95 of your circles will capture the hidden bullseye.`,
      r`Notice what this means: the bullseye is fixed in one spot; it does not move. It is your circles that shift with each new shot. This is the heart of the frequentist confidence interval. You cannot say "there is a 95% probability the true target lies inside this specific circle"—either it does or it does not (0 or 1). What you can say is that the procedure used to draw the circle captures the target 95% of the time under repeated sampling.`,
      r`In machine learning and statistics, we build these intervals by taking our point estimate (like a regression coefficient or validation accuracy) and adding and subtracting a margin of error: $\text{Estimate} \pm (\text{Critical Value} \times \text{Standard Error})$. If the population variance is known, we use the standard normal $z$-distribution; when estimating variance from a small sample, we switch to Student's $t$-distribution with heavier tails to account for extra uncertainty.`,
    ],
    analogy: r`A confidence interval is like tossing a ring around a fixed peg: the peg does not move, but 95 out of 100 tossed rings will successfully encircle it.`,
    steps: [
      r`Specify the desired confidence level $1 - \alpha$ (most commonly 95%, where $\alpha = 0.05$).`,
      r`Compute the point estimate (e.g. sample mean $\bar{x}$) from the empirical sample.`,
      r`Compute the estimated standard error of the estimator: $\operatorname{SE} = s / \sqrt{n}$.`,
      r`Select the appropriate critical value: $z_{1 - \alpha/2}$ for large samples or known $\sigma$; $t_{1 - \alpha/2, n-1}$ for unknown $\sigma$ on small samples.`,
      r`Calculate the margin of error: $m = \text{Critical Value} \times \operatorname{SE}$.`,
      r`Construct the interval boundaries: $[\bar{x} - m, \, \bar{x} + m]$.`,
    ],
    math: [
      {
        h: 'Gaussian and Student\'s t Confidence Intervals',
        tex: r`$$\text{Known } \sigma: \quad \bar{x} \pm z_{1-\alpha/2} \frac{\sigma}{\sqrt{n}}, \qquad \text{Unknown } \sigma: \quad \bar{x} \pm t_{1-\alpha/2, \, n-1} \frac{s}{\sqrt{n}}$$`,
        p: r`When $\sigma$ is unknown and estimated by $s$, the ratio follows Student's $t$-distribution with $n - 1$ degrees of freedom. The $t$-distribution has heavier tails than the standard normal distribution, widening the interval to reflect uncertainty in estimating the standard deviation. As $n \to \infty$, $t_{n-1} \to \mathcal{N}(0, 1)$.`,
      },
      {
        h: 'Margin of Error and Sample Size Determination',
        tex: r`$$m = z_{1-\alpha/2} \frac{\sigma}{\sqrt{n}} \implies n = \left(\frac{z_{1-\alpha/2} \cdot \sigma}{m}\right)^2$$`,
        p: r`The margin of error $m$ is half the interval width. To achieve a specified target precision $m$ with $(1 - \alpha)$ confidence, the required sample size scales inversely with the square of the margin of error.`,
      },
      {
        h: 'Confidence Interval for a Population Proportion',
        tex: r`$$\hat{p} \pm z_{1-\alpha/2} \sqrt{\frac{\hat{p}(1 - \hat{p})}{n}}$$`,
        p: r`The Wald interval for a Bernoulli proportion approximates the binomial distribution with a normal distribution. When $n\hat{p} < 10$ or $n(1-\hat{p}) < 10$, the Wilson score interval or Agresti–Coull adjustment is preferred to prevent coverage breakdown near 0 and 1.`,
      },
    ],
    keyPoints: [
      r`Confidence is a property of the sampling procedure over infinite hypothetical replications, not a Bayesian posterior probability on a single interval.`,
      r`Student's $t$-distribution automatically compensates for small sample sizes by expanding critical values.`,
      r`Narrower intervals indicate higher precision, achieved by increasing sample size $n$ or accepting a lower confidence level.`,
      r`If a 95% confidence interval for a treatment effect includes 0, the effect is not statistically significant at the $\alpha = 0.05$ level.`,
    ],
    pitfalls: [
      r`Interpreting a 95% CI as "there is a 95% probability the true parameter lies in this specific calculated interval" (that is a Bayesian credible interval).`,
      r`Using the standard normal $z$-distribution on small samples ($n < 30$) when the population standard deviation is unknown, leading to undercoverage.`,
      r`Overlapping confidence intervals: two groups whose 95% CIs slightly overlap can still be statistically significantly different.`,
      r`Ignoring the independence assumption; correlated or clustered data produces artificially narrow confidence intervals that fail to cover at the nominal rate.`,
    ],
    code: r`import numpy as np
from scipy import stats

rng = np.random.default_rng(42)
true_mu, true_sigma = 75.0, 10.0
n = 20
alpha = 0.05

# Simulate 1,000 independent 95% confidence intervals
trials = 1000
captured = 0

for _ in range(trials):
    sample = rng.normal(loc=true_mu, scale=true_sigma, size=n)
    mean = np.mean(sample)
    se = stats.sem(sample)
    # Student's t critical value for df = n - 1
    t_crit = stats.t.ppf(1.0 - alpha / 2.0, df=n - 1)
    ci_lower = mean - t_crit * se
    ci_upper = mean + t_crit * se
    if ci_lower <= true_mu <= ci_upper:
        captured += 1

print(f"Sample Size n={n}, Degrees of Freedom={n - 1}")
print(f"t Critical Value: {t_crit:.3f} (vs normal z = 1.960)")
print(f"Empirical Coverage: {captured / trials * 100:.1f}% (Nominal: 95.0%)")`,
    quiz: [
      {
        q: r`Which statement correctly reflects the frequentist meaning of a 95% confidence interval $[12.4, 18.2]$ for a population mean $\mu$?`,
        o: [
          r`There is a 95% probability that $\mu$ is between 12.4 and 18.2`,
          r`Across many hypothetical random samples, 95% of the intervals computed using this exact method will contain $\mu$`,
          r`95% of individual data points in the population lie between 12.4 and 18.2`,
          r`The probability that $\mu = 15.3$ (the midpoint) is 0.95`,
        ],
        a: 1,
        why: r`In frequentist statistics, the population parameter $\mu$ is a fixed constant, not a random variable. The 95% confidence level describes the long-run success rate of the interval-generating procedure.`,
        d: 1,
      },
      {
        q: r`Why is Student's $t$-distribution used instead of the standard normal $z$-distribution when constructing confidence intervals for small samples?`,
        o: [
          r`Because the data is guaranteed to be non-normal`,
          r`Because $t$-critical values are smaller than $z$-critical values`,
          r`To account for the additional sampling uncertainty introduced by estimating $\sigma$ with the sample standard deviation $s$`,
          r`To force the confidence interval to be symmetric`,
        ],
        a: 2,
        why: r`Estimating the unknown population variance introduces extra randomness. Student's $t$-distribution has heavier tails, producing wider intervals that preserve the correct nominal coverage.`,
        d: 1,
      },
      {
        q: r`If a 95% confidence interval for the difference between two model accuracies $(\text{Acc}_A - \text{Acc}_B)$ is $[-0.015, +0.062]$, what can you conclude at the $\alpha = 0.05$ significance level?`,
        o: [
          r`Model A is significantly better than Model B`,
          r`Model B is significantly better than Model A`,
          r`Both models have exactly identical accuracy`,
          r`The difference is not statistically significant because the interval contains 0`,
        ],
        a: 3,
        why: r`Because the 95% confidence interval spans across zero (from negative to positive), the null hypothesis of equal performance ($\text{Acc}_A - \text{Acc}_B = 0$) cannot be rejected at $\alpha = 0.05$.`,
        d: 2,
      },
      {
        q: r`How does increasing the confidence level from 90% to 99% affect the width of a confidence interval (all else being equal)?`,
        o: [
          r`The interval becomes wider`,
          r`The interval becomes narrower`,
          r`The width remains unchanged`,
          r`The interval shifts to the right`,
        ],
        a: 0,
        why: r`A higher confidence level requires a larger critical value (e.g. $z = 2.576$ for 99% vs $z = 1.645$ for 90%), expanding the margin of error and widening the interval to guarantee higher coverage.`,
        d: 1,
      },
      {
        q: r`A machine learning engineer measures model latency across $n = 100$ independent query runs, finding sample mean latency $\bar{x} = 45.0\text{ ms}$ and sample standard deviation $s = 15.0\text{ ms}$. Using standard normal approximation with $z_{0.975} = 1.96$, what is the margin of error for a 95% confidence interval for the mean latency?`,
        o: [
          r`$1.50\text{ ms}$`,
          r`$2.94\text{ ms}$`,
          r`$5.88\text{ ms}$`,
          r`$0.29\text{ ms}$`,
        ],
        a: 1,
        why: r`The standard error is $\operatorname{SE} = s / \sqrt{n} = 15.0 / \sqrt{100} = 1.50\text{ ms}$. The margin of error is $m = z_{0.975} \times \operatorname{SE} = 1.96 \times 1.50 = 2.94\text{ ms}$. The full width of the interval is $2m = 5.88\text{ ms}$.`,
        d: 2,
      },
      {
        q: r`When constructing a 95% confidence interval for the mean of a normally distributed feature from a sample of $n = 18$ observations with unknown population variance $\sigma^2$, which critical value must be used?`,
        o: [
          r`$t_{0.975, \, 17}$ from Student's $t$-distribution with 17 degrees of freedom`,
          r`$t_{0.975, \, 18}$ from Student's $t$-distribution with 18 degrees of freedom`,
          r`$z_{0.975} = 1.960$`,
          r`$\chi^2_{0.975, \, 17}$ from the chi-square distribution with 17 degrees of freedom`,
        ],
        a: 0,
        why: r`When the population standard deviation $\sigma$ is unknown and estimated by the sample standard deviation $s$, the standardised mean follows Student's $t$-distribution with $n - 1$ degrees of freedom. For $n = 18$, $\nu = 18 - 1 = 17$.`,
        d: 2,
      },
      {
        q: r`When estimating a 95% confidence interval for a conversion rate where only 3 conversions occurred out of 200 visitors ($\hat{p} = 0.015$), why is the standard Wald interval $[\hat{p} \pm 1.96\sqrt{\hat{p}(1-\hat{p})/n}]$ problematic?`,
        o: [
          r`It fails because proportions cannot be modelled with random variables`,
          r`It requires knowing the true population variance $\sigma^2$ in advance`,
          r`It always produces an interval that is twice as wide as the true parameter range`,
          r`It tends to produce intervals with severe undercoverage and lower bounds that can extend below zero`,
        ],
        a: 3,
        why: r`The Wald interval relies on a normal approximation to the binomial distribution. When $n\hat{p} < 10$ (here $200 \times 0.015 = 3$), the distribution is highly skewed; the Wald interval gives poor actual coverage (often well below nominal 95%) and can yield negative lower limits. Wilson score or Agresti–Coull intervals are preferred.`,
        d: 2,
      },
      {
        q: r`Consider the following Python snippet using SciPy to construct a 95% confidence interval for a sample mean:
<code>data = np.array([12, 15, 14, 18, 16])
mean = np.mean(data)
se = stats.sem(data)
ci = stats.t.interval(0.95, df=len(data) - 1, loc=mean, scale=se)</code>
What does <code>stats.sem(data)</code> compute in this snippet?`,
        o: [
          r`The sample standard deviation $s$ of the data points`,
          r`The margin of error $t_{0.975, 4} \times (s / \sqrt{n})$`,
          r`The standard error of the mean, $s / \sqrt{n}$`,
          r`The 95% quantile of the Student's $t$-distribution`,
        ],
        a: 2,
        why: r`<code>stats.sem</code> computes the standard error of the mean, $\hat{\sigma} / \sqrt{n} = s / \sqrt{n}$. The <code>stats.t.interval</code> function multiplies this standard error by the two-tailed critical value and centres it around <code>loc</code>.`,
        d: 2,
      },
      {
        q: r`In the standard notation of confidence intervals, if the desired confidence level is $99\%$, what is the significance level $\alpha$?`,
        o: [
          r`0.05`,
          r`0.01`,
          r`0.10`,
          r`0.001`,
        ],
        a: 1,
        why: r`The confidence level is defined as $1 - \alpha$. For a $99\%$ confidence interval ($0.99$), the significance level is $\alpha = 1 - 0.99 = 0.01$.`,
        d: 1,
      },
      {
        q: r`An analytics team wants to estimate the mean response time of a web service to within a margin of error $m = 2.0\text{ ms}$ with $95\%$ confidence ($z_{0.975} = 1.96$). From past measurements, the standard deviation is known to be $\sigma = 20.0\text{ ms}$. What is the minimum sample size $n$ required?`,
        o: [
          r`196`,
          r`98`,
          r`770`,
          r`385`,
        ],
        a: 3,
        why: r`Using the sample size formula $n = (z_{1-\alpha/2} \cdot \sigma / m)^2 = (1.96 \times 20.0 / 2.0)^2 = (19.6)^2 = 384.16$. Rounding up to the next integer guarantees the desired precision: $n = 385$.`,
        d: 3,
      },
      {
        q: r`Suppose two independent models, Model 1 and Model 2, have estimated mean latencies whose 95% confidence intervals overlap slightly: Model 1 has $[10.0, 14.0]$ and Model 2 has $[13.0, 17.0]$. A colleague claims that because their individual 95% confidence intervals overlap, the difference between the two models cannot be statistically significant at $\alpha = 0.05$. Why is this claim incorrect?`,
        o: [
          r`Because testing the difference requires the standard error of the difference $\sqrt{\operatorname{SE}_1^2 + \operatorname{SE}_2^2}$, which is smaller than the sum of the separate margins of error $\operatorname{SE}_1 + \operatorname{SE}_2$`,
          r`Because confidence intervals only apply to proportions, not continuous latencies`,
          r`Because overlapping intervals prove that the null hypothesis is true with 95% certainty`,
          r`Because Model 2 has a strictly higher upper bound than Model 1`,
        ],
        a: 0,
        why: r`The margin of error for the difference $(m_{\text{diff}} = z \sqrt{\operatorname{SE}_1^2 + \operatorname{SE}_2^2})$ is strictly smaller than the sum of the individual margins of error $(m_1 + m_2 = z(\operatorname{SE}_1 + \operatorname{SE}_2))$ because $\sqrt{a^2 + b^2} < a + b$. Two 95% confidence intervals can overlap by up to roughly 29% of their width while their difference remains statistically significant at $\alpha = 0.05$.`,
        d: 3,
      },
      {
        q: r`In an A/B test with $n = 100$ visitors, 50 users convert, giving sample proportion $\hat{p} = 0.50$. Using the Wald method with $z_{0.975} = 1.96$, what is the 95% confidence interval for the population conversion rate?`,
        o: [
          r`$[0.304, 0.696]$`,
          r`$[0.450, 0.550]$`,
          r`$[0.402, 0.598]$`,
          r`$[0.350, 0.650]$`,
        ],
        a: 2,
        why: r`The estimated standard error is $\operatorname{SE} = \sqrt{\hat{p}(1 - \hat{p}) / n} = \sqrt{0.50 \times 0.50 / 100} = \sqrt{0.0025} = 0.050$. The margin of error is $m = 1.96 \times 0.050 = 0.098$. The interval is $0.500 \pm 0.098 = [0.402, 0.598]$.`,
        d: 3,
      },
    ],
    usedBy: ['ols_linear_regression', 'bayesian_linear_regression'],
    prereq: ['sampling-and-standard-error', 'central-limit-theorem-and-law-of-large-numbers'],
    related: ['bootstrap-and-jackknife', 'cross-validation'],
    keywords: 'confidence interval student t distribution margin error critical value coverage frequentist estimation',
  },
  {
    id: 'bootstrap-and-jackknife',
    short: 'Bootstrap & jackknife',
    title: 'Bootstrap and Jackknife',
    task: 'concepts',
    module: 'Estimation',
    level: 2,
    minutes: 17,
    noLab: true,
    summary: r`Non-parametric resampling for uncertainty estimation: sample with replacement to bootstrap any statistic, or leave one out with the jackknife.`,
    lead: r`When analytical formulas for standard errors do not exist—such as for medians, complex ratios, or pipeline metrics—resampling methods provide a universal computational solution. The bootstrap treats the empirical sample as a proxy population and resamples with replacement, while the jackknife systematically leaves out one observation at a time.`,
    intuition: [
      r`Imagine you calculate the median household wealth in a small sample of 50 families. Calculating the standard error of a mean is trivial ($s / \sqrt{n}$), but what is the formula for the standard error of a sample median? Under arbitrary or skewed distributions, there is no simple textbook formula. Historically, statisticians were forced to make rigid parametric assumptions or give up on interval estimates entirely.`,
      r`In 1979, Bradley Efron proposed the bootstrap: "pulling yourself up by your own bootstraps". If your sample of 50 families is the best representation of the population you have, treat it as the population. Put all 50 values into an imaginary urn, draw 50 families with replacement (so some appear multiple times and others not at all), and compute the median. Repeat this computational drawing 2,000 times. The spread of those 2,000 recomputed medians gives you an accurate standard error, and their 2.5th and 97.5th percentiles give you an empirical 95% confidence interval.`,
      r`The jackknife is an older, deterministic cousin pioneered by Maurice Quenouille and John Tukey. Instead of random sampling with replacement, the jackknife leaves out observation 1 and recalculates the statistic on the remaining $n - 1$ points, then leaves out observation 2, and so on. This produces $n$ leave-one-out replicates, offering a fast, non-random diagnostic for estimator bias and variance.`,
    ],
    analogy: r`Bootstrapping is like photocopying your sample, cutting it into slips of paper, and drawing new random datasets from the hat to see how sensitive your conclusion is.`,
    steps: [
      r`Given an original dataset $\mathbf{x} = (x_1, x_2, \dots, x_n)$, compute the point estimate of interest $\hat{\theta} = T(\mathbf{x})$.`,
      r`For each of $B$ bootstrap iterations (typically $B \in [1000, 5000]$), draw a sample $\mathbf{x}^{*b}$ of size $n$ with replacement from $\mathbf{x}$.`,
      r`Compute the replicate estimate $\hat{\theta}^{*b} = T(\mathbf{x}^{*b})$ on each resampled dataset.`,
      r`Estimate the bootstrap standard error as the sample standard deviation of the $B$ replicates: $\widehat{\operatorname{SE}}_B = \sqrt{\frac{1}{B-1}\sum (\hat{\theta}^{*b} - \bar{\theta}^*)^2}$.`,
      r`Construct confidence intervals: use the percentile method ($[\hat{\theta}^*_{\alpha/2}, \, \hat{\theta}^*_{1-\alpha/2}]$) or bias-corrected accelerated ($\text{BC}_a$) intervals.`,
      r`For the jackknife, compute $n$ leave-one-out replicates $\hat{\theta}_{(-i)} = T(\mathbf{x} \setminus \{x_i\})$ to estimate bias $\widehat{\text{Bias}}_{\text{jack}} = (n-1)(\bar{\theta}_{(\cdot)} - \hat{\theta})$.`,
    ],
    math: [
      {
        h: 'Bootstrap Standard Error and Percentile Interval',
        tex: r`$$\widehat{\operatorname{SE}}_{\text{boot}} = \sqrt{\frac{1}{B - 1} \sum_{b=1}^B \left(\hat{\theta}^{*b} - \bar{\theta}^*\right)^2}, \qquad \text{CI}_{1-\alpha} = \left[ q_{\alpha/2}\left(\{\hat{\theta}^{*b}\}\right), \; q_{1-\alpha/2}\left(\{\hat{\theta}^{*b}\}\right) \right]$$`,
        p: r`The empirical bootstrap standard error is the standard deviation across all $B$ bootstrap estimates $\hat{\theta}^{*b}$. The percentile confidence interval takes the empirical quantiles of the bootstrap distribution directly, requiring zero normality assumptions.`,
      },
      {
        h: 'The 63.2% Rule of Sampling with Replacement',
        tex: r`$$P(\text{observation } i \text{ selected}) = 1 - \left(1 - \frac{1}{n}\right)^n \xrightarrow{n \to \infty} 1 - e^{-1} \approx 0.6321$$`,
        p: r`When drawing $n$ items with replacement from a set of size $n$, each observation has probability $1/n$ of being picked on any single draw. In the limit, each bootstrap sample contains roughly 63.2% unique original observations, leaving approximately 36.8% out-of-bag (OOB).`,
      },
      {
        h: 'Jackknife Variance and Bias Estimators',
        tex: r`$$\widehat{\operatorname{Var}}_{\text{jack}}(\hat{\theta}) = \frac{n - 1}{n} \sum_{i=1}^n \left(\hat{\theta}_{(-i)} - \bar{\theta}_{(\cdot)}\right)^2, \qquad \widehat{\text{Bias}}_{\text{jack}} = (n - 1)(\bar{\theta}_{(\cdot)} - \hat{\theta})$$`,
        p: r`The jackknife leaves out each observation $i$ sequentially to compute $\hat{\theta}_{(-i)}$. The scale factor $\frac{n-1}{n}$ corrects for the fact that the leave-one-out subsamples are heavily overlapping and far more similar to each other than independent samples would be.`,
      },
    ],
    keyPoints: [
      r`Bootstrapping requires no parametric distribution assumptions; it works for medians, ratios, eigenvalues, and complex ML metric pipelines.`,
      r`Roughly 63.2% of the distinct original observations appear in each bootstrap sample, leaving 36.8% out-of-bag (the foundation of Random Forest OOB error).`,
      r`The standard jackknife fails on non-smooth statistics (such as the sample median); the delete-$d$ jackknife or bootstrap must be used instead.`,
      r`Percentile bootstrap intervals can be biased for skewed distributions; the $\text{BC}_a$ (bias-corrected and accelerated) method adjusts for skewness and acceleration.`,
    ],
    pitfalls: [
      r`Bootstrapping time series data with simple i.i.d. resampling, which destroys serial autocorrelation; block bootstrap must be used instead.`,
      r`Using the standard leave-one-out jackknife for the median; removing one point changes the median in discrete jumps, leading to inconsistent variance estimates.`,
      r`Believing the bootstrap creates new information; if the original sample is small or unrepresentative, the bootstrap simply replicates that bias.`,
      r`Using too few bootstrap replications; while $B = 200$ suffices for standard errors, confidence interval tails require $B \ge 1,000$ to $2,000$.`,
    ],
    code: r`import numpy as np

rng = np.random.default_rng(42)
# Skewed sample of 50 observations (e.g. server latencies in ms)
data = rng.lognormal(mean=3.0, sigma=0.8, size=50)

# Non-parametric statistic: sample median
sample_median = np.median(data)

# Bootstrap estimation (B = 2,000 resamples)
B = 2000
boot_medians = np.zeros(B)
n = len(data)

for b in range(B):
    resample = rng.choice(data, size=n, replace=True)
    boot_medians[b] = np.median(resample)

boot_se = np.std(boot_medians, ddof=1)
ci_lower = np.percentile(boot_medians, 2.5)
ci_upper = np.percentile(boot_medians, 97.5)

print(f"Sample Median: {sample_median:.2f}")
print(f"Bootstrap SE: {boot_se:.3f}")
print(f"95% Percentile CI: [{ci_lower:.2f}, {ci_upper:.2f}]")`,
    quiz: [
      {
        q: r`What approximate percentage of unique original training instances are included in any single standard bootstrap sample of size $n$?`,
        o: [
          r`50.0%`,
          r`63.2%`,
          r`95.0%`,
          r`100.0%`,
        ],
        a: 1,
        why: r`Because sampling is done with replacement, each point has probability $1 - (1 - 1/n)^n \approx 1 - e^{-1} \approx 0.6321$ (or 63.2%) of appearing at least once.`,
        d: 1,
      },
      {
        q: r`For which of the following statistics does the classical leave-one-out jackknife fail to provide a consistent variance estimate?`,
        o: [
          r`Sample mean`,
          r`Sample variance`,
          r`Sample median`,
          r`Linear regression slope`,
        ],
        a: 2,
        why: r`The jackknife requires the estimator to be smooth (differentiable). The sample median is non-smooth; deleting a single point causes discontinuous jumps in rank.`,
        d: 2,
      },
      {
        q: r`Why is naive i.i.d. bootstrapping inappropriate for time-series forecasting models?`,
        o: [
          r`Because time-series data cannot be averaged`,
          r`Because bootstrap samples must be larger than $n$`,
          r`Because time-series data is always strictly Gaussian`,
          r`Because random resampling with replacement destroys temporal ordering and autocorrelation`,
        ],
        a: 3,
        why: r`Independent resampling scrambles the sequence of observations, destroying serial dependence. Time-series data requires block bootstrapping to preserve local autocorrelation.`,
        d: 2,
      },
      {
        q: r`What is the primary advantage of the bootstrap over classical asymptotic normal confidence intervals?`,
        o: [
          r`It does not require deriving analytical formulas or assuming a specific parametric distribution`,
          r`It guarantees narrower confidence intervals`,
          r`It eliminates all sampling bias automatically`,
          r`It works with zero data`,
        ],
        a: 0,
        why: r`The bootstrap is fully non-parametric and computational: it estimates standard errors and quantiles directly from empirical resampling without requiring closed-form calculus derivations or Gaussian assumptions.`,
        d: 1,
      },
      {
        q: r`In standard non-parametric bootstrapping, how are resamples of size $n$ drawn from the original dataset of $n$ observations?`,
        o: [
          r`Resampling without replacement, so every observation appears exactly once`,
          r`Drawing synthetic points generated from a fitted multivariate Gaussian distribution`,
          r`Drawing sub-samples of size $n/2$ without replacement`,
          r`Resampling with replacement, so individual observations may appear multiple times or not at all`,
        ],
        a: 3,
        why: r`The core mechanism of Efron's non-parametric bootstrap is drawing samples of size $n$ with replacement from the empirical dataset, treating the empirical sample as a proxy for the unknown population.`,
        d: 1,
      },
      {
        q: r`How does the standard leave-one-out jackknife differ in execution from the standard bootstrap?`,
        o: [
          r`The jackknife is completely deterministic and produces exactly $n$ leave-one-out datasets, whereas the bootstrap draws $B$ pseudo-random resamples`,
          r`The jackknife requires at least 2,000 iterations, whereas the bootstrap only requires 50`,
          r`The jackknife generates random subsamples with replacement, whereas the bootstrap is deterministic`,
          r`The jackknife can only be computed on binary classification models`,
        ],
        a: 0,
        why: r`For a sample of size $n$, the leave-one-out jackknife systematically omits observation $i$ for each $i \in \{1, \dots, n\}$, producing exactly $n$ deterministic subsets without random sampling.`,
        d: 1,
      },
      {
        q: r`When applying the bootstrap to estimate confidence interval percentiles (such as the 2.5th and 97.5th percentiles for a 95% CI), approximately how many bootstrap replications $B$ are recommended as a minimum?`,
        o: [
          r`$B = 50,000$ to $100,000$`,
          r`$B = 10$ to $20$`,
          r`$B = 1,000$ to $2,000$`,
          r`$B = n - 1$`,
        ],
        a: 2,
        why: r`While estimating standard errors requires only $B \approx 100\text{ to }200$ replicates, estimating extreme tail quantiles (2.5% and 97.5%) reliably requires significantly more iterations, typically $B \ge 1,000\text{ to }2,000$ to reduce Monte Carlo simulation noise.`,
        d: 2,
      },
      {
        q: r`After drawing $B = 1,000$ bootstrap replicates of a model's test accuracy, you sort the 1,000 replicate accuracies in ascending order. Under the empirical percentile method, which sorted ranks define the two-sided 95% confidence interval?`,
        o: [
          r`The 5th and 95th sorted values`,
          r`The 25th and 975th sorted values`,
          r`The 50th and 950th sorted values`,
          r`The 1st and 1000th sorted values`,
        ],
        a: 1,
        why: r`For a two-sided 95% confidence interval, $\alpha = 0.05$. The tail cutoff quantiles are $\alpha/2 = 0.025$ and $1 - \alpha/2 = 0.975$. Out of 1,000 sorted values, $0.025 \times 1,000 = 25$ and $0.975 \times 1,000 = 975$.`,
        d: 2,
      },
      {
        q: r`When bootstrapping serially correlated time-series data, why is the block bootstrap used instead of individual point resampling?`,
        o: [
          r`It eliminates the need for computing confidence interval percentiles`,
          r`It converts non-stationary data into white noise`,
          r`It resamples consecutive chunks of observations together, preserving short-term autocorrelation within each block`,
          r`It forces all bootstrap sample means to equal zero`,
        ],
        a: 2,
        why: r`Independent resampling scrambles the chronological order of observations, destroying serial dependence. Block bootstrapping samples contiguous blocks of length $L$, preserving the autocorrelation structure within each block.`,
        d: 2,
      },
      {
        q: r`Suppose a tiny dataset consists of $n = 3$ observations: $\{A, B, C\}$. If a bootstrap sample of size 3 is drawn uniformly with replacement, what is the exact probability that observation $A$ is omitted entirely (i.e. is out-of-bag)?`,
        o: [
          r`$8/27 \approx 0.296$`,
          r`$1/27 \approx 0.037$`,
          r`$19/27 \approx 0.704$`,
          r`$1/3 \approx 0.333$`,
        ],
        a: 0,
        why: r`On any single draw, the probability of selecting an observation other than $A$ is $(1 - 1/3) = 2/3$. Across 3 independent draws with replacement, the probability that $A$ is never chosen is $(2/3)^3 = 8/27 \approx 0.2963$. (As $n \to \infty$, $(1 - 1/n)^n \to 1/e \approx 0.368$).`,
        d: 3,
      },
      {
        q: r`A researcher has $n = 4$ observations: $[2, 4, 6, 8]$. The overall sample mean is $\hat{\theta} = 5.0$. The four leave-one-out means are: $\hat{\theta}_{(-1)} = 6.0$, $\hat{\theta}_{(-2)} = 5.333$, $\hat{\theta}_{(-3)} = 4.667$, $\hat{\theta}_{(-4)} = 4.0$. What is the average of these leave-one-out means $\bar{\theta}_{(\cdot)}$, and what does the jackknife bias estimate $\widehat{\text{Bias}} = (n - 1)(\bar{\theta}_{(\cdot)} - \hat{\theta})$ evaluate to?`,
        o: [
          r`$\bar{\theta}_{(\cdot)} = 5.5$, so $\widehat{\text{Bias}} = 1.5$`,
          r`$\bar{\theta}_{(\cdot)} = 5.0$, so $\widehat{\text{Bias}} = 3.0$`,
          r`$\bar{\theta}_{(\cdot)} = 4.5$, so $\widehat{\text{Bias}} = -1.5$`,
          r`$\bar{\theta}_{(\cdot)} = 5.0$, so $\widehat{\text{Bias}} = 0.0$`,
        ],
        a: 3,
        why: r`The average of the leave-one-out means is $\bar{\theta}_{(\cdot)} = (6.0 + 16/3 + 14/3 + 4.0) / 4 = 20.0 / 4 = 5.0$. The jackknife bias estimate is $(4 - 1)(5.0 - 5.0) = 3 \times 0.0 = 0.0$, correctly confirming that the sample mean is an unbiased estimator.`,
        d: 3,
      },
      {
        q: r`Why is the bias-corrected and accelerated ($\text{BC}_a$) bootstrap interval preferred over the simple percentile interval for skewed estimators?`,
        o: [
          r`Because the simple percentile interval is only valid for sample sizes $n > 100,000$`,
          r`Because the simple percentile interval fails to adjust for median bias and variance dependence on the parameter, leading to poor coverage on skewed distributions`,
          r`Because the $\text{BC}_a$ method converts non-linear models into linear regressions`,
          r`Because the simple percentile interval cannot produce closed intervals`,
        ],
        a: 1,
        why: r`The simple percentile interval assumes transformation symmetry. When the sampling distribution of $\hat{\theta}$ is skewed or its variance varies with the true parameter (non-zero acceleration), simple percentile intervals suffer from substantial coverage error. $\text{BC}_a$ adjusts the percentile cutoff indices for both median bias $z_0$ and acceleration $a$.`,
        d: 3,
      },
    ],
    usedBy: ['random_forest_regressor', 'random_forest_classifier', 'cross-validation'],
    prereq: ['sampling-and-standard-error', 'confidence-intervals'],
    related: ['cross-validation', 'bias-variance-tradeoff'],
    keywords: 'bootstrap jackknife resampling replacement out-of-bag oob non-parametric percentile',
  },
  {
    id: 'hypothesis-testing-and-p-values',
    short: 'Hypothesis Tests & p-Values',
    title: r`Hypothesis Testing and p-Values`,
    task: 'concepts',
    module: 'Hypothesis testing',
    level: 1,
    minutes: 16,
    noLab: true,
    summary: r`Establish null and alternative hypotheses, choose test statistics, and compute p-values to make principled scientific decisions under uncertainty.`,
    lead: r`Hypothesis testing formalises empirical decision-making by evaluating whether observed data can be credibly explained by pure random chance. The p-value quantifies how extreme the observed evidence is under an assumed null hypothesis, providing an objective benchmark for rejecting baseline models.`,
    intuition: [
      r`Suppose an online store tests a checkout redesign intended to improve purchase completion above the historic 10% rate. In a test run of 500 shoppers using the new design, 65 complete their orders (13.0%). Is this 3 percentage point uplift genuine evidence that the new checkout converts better, or could it easily be a streak of good luck from 500 random customer decisions?`,
      r`Hypothesis testing tackles this by adopting a sceptical devil's advocate stance known as the null hypothesis ($H_0$): assume the redesign made no difference and the true conversion probability remains exactly 10%, giving an expected count of 50 purchasers. We then construct the sampling distribution of outcomes that pure chance would generate under $H_0$ and ask: how likely is it to see 65 or more purchasers purely by random sampling noise?`,
      r`Using the standard normal approximation with standard error $\sqrt{0.10 \times 0.90 / 500} \approx 0.0134$, an observed 13% rate sits $2.236$ standard errors above expectation. Under the null hypothesis, obtaining an outcome at least this extreme in either direction occurs with a probability of approximately 0.0253 (a p-value of 2.53%). Because this p-value falls below our pre-established significance threshold of 5% ($\alpha = 0.05$), we reject the null hypothesis and conclude that the conversion increase is statistically significant.`,
    ],
    analogy: r`A hypothesis test operates like a criminal trial: the defendant is presumed innocent (null hypothesis) until the prosecution presents evidence so improbable under innocence that guilt is established beyond reasonable doubt (the significance threshold $\alpha$).`,
    steps: [
      r`State the null hypothesis $H_0$ (baseline equality or absence of effect) and the alternative hypothesis $H_1$ (presence of an effect or difference).`,
      r`Choose a significance threshold $\alpha$ (conventionally 0.05 or 0.01) before inspecting or collecting the experimental data.`,
      r`Select an appropriate test statistic $T$ whose exact or asymptotic sampling distribution is known when $H_0$ is true.`,
      r`Compute the observed test statistic $t_{\text{obs}}$ from the collected sample data.`,
      r`Calculate the p-value: the probability under the null distribution of obtaining a test statistic at least as extreme as $t_{\text{obs}}$.`,
      r`Make a formal decision: if $p \le \alpha$, reject $H_0$ in favour of $H_1$; if $p > \alpha$, fail to reject $H_0$.`,
    ],
    math: [
      {
        h: 'Null and Alternative Hypotheses',
        tex: r`$$H_0: \theta = \theta_0 \quad \text{versus} \quad H_1: \theta \ne \theta_0 \quad (\text{or } H_1: \theta > \theta_0)$$`,
        p: r`Here $\theta$ denotes the true population parameter and $\theta_0$ is the baseline null value. A two-sided alternative ($H_1: \theta \ne \theta_0$) tests for departures in either direction, whereas a one-sided alternative ($H_1: \theta > \theta_0$ or $\theta < \theta_0$) concentrates statistical power entirely on one pre-specified direction. One-sided tests must be justified on rigorous theoretical grounds prior to seeing the data.`,
      },
      {
        h: 'The p-Value Definition',
        tex: r`$$p = P(T(\mathbf{X}) \ge t_{\text{obs}} \mid H_0) \quad \text{or} \quad p = 2 \cdot \min\left(P(T \ge t_{\text{obs}} \mid H_0), \, P(T \le t_{\text{obs}} \mid H_0)\right)$$`,
        p: r`The p-value is the conditional probability of obtaining a test statistic $T(\mathbf{X})$ at least as contradictory to $H_0$ as the observed value $t_{\text{obs}}$, calculated assuming $H_0$ is true. For symmetric distributions, a two-sided p-value doubles the one-sided tail probability. Crucially, the p-value is $P(\text{data} \mid H_0)$, not the posterior probability $P(H_0 \mid \text{data})$ of the hypothesis being true.`,
      },
      {
        h: 'Uniformity under the Null',
        tex: r`$$p \sim \text{Uniform}(0, 1) \quad \text{when } H_0 \text{ holds}$$`,
        p: r`When the null hypothesis is true and the test statistic is continuous with cumulative distribution function $F_0$, the probability integral transform ensures that the p-value is uniformly distributed across the interval $[0, 1]$. Consequently, the probability of falsely rejecting a true null hypothesis at threshold $\alpha$ is identically $P(p \le \alpha \mid H_0) = \alpha$.`,
      },
    ],
    keyPoints: [
      r`The p-value measures compatibility between observed data and the null model; it is never the probability that the null hypothesis is true.`,
      r`Statistical significance is not practical significance: massive datasets make negligible, irrelevant differences yield $p < 0.001$.`,
      r`The decision threshold $\alpha$ must be fixed strictly in advance of data collection to prevent post-hoc rationalisation.`,
      r`Failing to reject the null hypothesis does not prove the null is true; absence of evidence is not evidence of absence.`,
    ],
    pitfalls: [
      r`The prosecutor's fallacy: treating $p = 0.02$ as a 2% probability that the null hypothesis is correct. Inverting conditional probabilities requires Bayes' theorem and prior odds.`,
      r`Data dredging and p-hacking: testing dozens of subgroup combinations or stopping data collection early as soon as $p < 0.05$ emerges.`,
      r`Treating $\alpha = 0.05$ as an ontological cliff: interpreting $p = 0.049$ as scientific truth and $p = 0.051$ as complete absence of an effect.`,
      r`Reporting p-values without confidence intervals or effect sizes, hiding whether an effect is commercially or scientifically meaningful.`,
    ],
    code: r`import numpy as np
import scipy.stats as stats

# Test whether new checkout conversion exceeds historic 10%
n = 500
p0 = 0.10
observed_conversions = 65
p_hat = observed_conversions / n

# Standard error under the null hypothesis H0
se_null = np.sqrt(p0 * (1.0 - p0) / n)
z_stat = (p_hat - p0) / se_null

# Two-sided p-value from standard normal distribution
p_value = 2.0 * (1.0 - stats.norm.cdf(abs(z_stat)))
alpha = 0.05

print(f"Observed rate: {p_hat:.1%} (n={n})")
print(f"z-statistic: {z_stat:.3f}")
print(f"p-value: {p_value:.4f}")
print(f"Decision at alpha={alpha}: {'Reject H0' if p_value <= alpha else 'Fail to reject H0'}")`,
    quiz: [
      {
        q: r`What does a p-value of 0.03 strictly mean in an experimental hypothesis test?`,
        o: [
          r`There is a 3% probability that the null hypothesis is true`,
          r`If the null hypothesis were true, there is a 3% probability of observing data at least as extreme as the actual result`,
          r`There is a 97% probability that the experimental intervention is effective`,
          r`The experiment has an error rate of 3% across repeated trials`,
        ],
        a: 1,
        why: r`The p-value is the conditional probability $P(\text{data as or more extreme} \mid H_0)$. It says nothing about $P(H_0 \mid \text{data})$ without specifying prior probabilities via Bayes' theorem.`,
        d: 1,
      },
      {
        q: r`Why does collecting an enormous sample size (e.g. $n = 1,000,000$) create a challenge for interpreting p-values?`,
        o: [
          r`Standard errors expand, making p-values unreliable`,
          r`The central limit theorem ceases to apply`,
          r`Tiny, practically meaningless differences between groups become statistically significant with $p < 0.001$`,
          r`The test statistic no longer follows its theoretical null distribution`,
        ],
        a: 2,
        why: r`Standard error shrinks as $1/\sqrt{n}$. With millions of observations, trivial deviations with zero practical importance easily generate massive test statistics and tiny p-values.`,
        d: 2,
      },
      {
        q: r`If an analyst carries out a hypothesis test at $\alpha = 0.05$ and finds $p = 0.22$, which conclusion is formally valid?`,
        o: [
          r`The null hypothesis is proven true`,
          r`The sample data provides insufficient evidence to reject the null hypothesis at the 5% level`,
          r`The probability that the alternative hypothesis is true is 0.22`,
          r`The test should be switched to a one-sided test to achieve significance`,
        ],
        a: 1,
        why: r`Failing to reject $H_0$ means the observed data is reasonably consistent with chance; it never proves the null hypothesis holds true.`,
        d: 1,
      },
      {
        q: r`Under the null hypothesis for a continuous test statistic, what probability distribution does the p-value follow?`,
        o: [
          r`Standard normal distribution $\mathcal{N}(0, 1)$`,
          r`Student's $t$-distribution with $n-1$ degrees of freedom`,
          r`Uniform distribution on $[0, 1]$`,
          r`Exponential distribution with parameter $\lambda = 1$`,
        ],
        a: 2,
        why: r`By the probability integral transform, any continuous random variable transformed by its own cumulative distribution function follows $\text{Uniform}(0, 1)$. Hence $P(p \le \alpha \mid H_0) = \alpha$.`,
        d: 2,
      },
      {
        q: r`In statistical hypothesis testing, what role does the null hypothesis ($H_0$) serve?`,
        o: [
          r`It represents the researcher's desired experimental discovery or breakthrough`,
          r`It specifies the statistical power of the test`,
          r`It defines the mathematical distribution of the alternative parameter`,
          r`It serves as the baseline default model of "no effect", "no difference", or pure random chance`,
        ],
        a: 3,
        why: r`The null hypothesis acts as the baseline sceptical model (presumption of innocence or absence of effect) that the collected sample data must demonstrate sufficient evidence to reject.`,
        d: 1,
      },
      {
        q: r`Why must the significance threshold $\alpha$ (e.g. $\alpha = 0.05$) be specified before collecting or analysing experimental data?`,
        o: [
          r`To prevent post-hoc rationalisation, where researchers adjust the threshold to fit observed results`,
          r`Because statistical software cannot execute test scripts without an initial $\alpha$ parameter`,
          r`Because $\alpha$ must always match the sample standard deviation`,
          r`To force the p-value to be uniformly distributed under the alternative hypothesis`,
        ],
        a: 0,
        why: r`Setting $\alpha$ prior to data collection guarantees methodological objectivity and controls the false positive rate. Choosing or adjusting $\alpha$ after inspecting the data introduces confirmation bias and p-hacking.`,
        d: 1,
      },
      {
        q: r`Suppose an analyst computes a test statistic whose sampling distribution under $H_0$ is symmetric around 0. The one-sided p-value for testing $H_1: \mu > \mu_0$ is found to be $0.02$. If the analyst had instead pre-specified a two-sided test ($H_1: \mu \ne \mu_0$), what would the two-sided p-value be?`,
        o: [
          r`0.04`,
          r`0.02`,
          r`0.01`,
          r`0.98`,
        ],
        a: 0,
        why: r`For a symmetric null distribution, a two-sided test considers departures in both tails. The two-sided p-value is double the one-sided tail probability: $2 \times 0.02 = 0.04$.`,
        d: 2,
      },
      {
        q: r`An engineer runs the following code in Python to test whether a model's latency change is significant:
<code>z_stat = -2.10
p_value = 2.0 * (1.0 - stats.norm.cdf(abs(z_stat)))</code>
Why does the calculation use <code>abs(z_stat)</code> and multiply by <code>2.0</code>?`,
        o: [
          r`To ensure the resulting p-value is greater than 1.0`,
          r`To correct for degrees of freedom in small sample sizes`,
          r`To convert a normal distribution test into a Student's t-test`,
          r`To calculate a two-sided p-value from a symmetric normal distribution regardless of the sign of z_stat`,
        ],
        a: 3,
        why: r`<code>abs(z_stat)</code> projects the statistic into the positive tail, <code>1.0 - stats.norm.cdf(...)</code> evaluates the upper tail probability, and multiplying by 2 accounts for both tails in a two-sided test.`,
        d: 2,
      },
      {
        q: r`A clinical trial evaluates two competing drugs against a placebo: Drug A yields $p = 0.048$ while Drug B yields $p = 0.052$. What is the main error in concluding that "Drug A is effective, whereas Drug B has no effect"?`,
        o: [
          r`The tests should have been performed without a control group`,
          r`The difference between "statistically significant" and "not statistically significant" is not itself statistically significant; an arbitrary threshold creates an illusion of a sharp divide`,
          r`Drug B has a lower p-value than Drug A`,
          r`Both drugs should have used a threshold of $\alpha = 0.50$`,
        ],
        a: 1,
        why: r`As Andrew Gelman highlighted, the difference between "significant" and "not significant" is not necessarily statistically significant. A minute difference ($p = 0.048$ vs $0.052$) reflects routine sampling variance, not an ontological qualitative difference in drug efficacy.`,
        d: 2,
      },
      {
        q: r`A website tests whether a new banner increases click rates above the historical rate of $p_0 = 0.20$. In a sample of $n = 400$ visitors, 100 click the banner ($\hat{p} = 0.25$). What is the standard error under the null hypothesis, and what is the resulting $z$-test statistic?`,
        o: [
          r`$\operatorname{SE}_0 = 0.02$, $z = 2.50$`,
          r`$\operatorname{SE}_0 = 0.04$, $z = 1.25$`,
          r`$\operatorname{SE}_0 = 0.05$, $z = 1.00$`,
          r`$\operatorname{SE}_0 = 0.02$, $z = 5.00$`,
        ],
        a: 0,
        why: r`Under $H_0$, the standard error is $\operatorname{SE}_0 = \sqrt{p_0(1 - p_0) / n} = \sqrt{0.20 \times 0.80 / 400} = \sqrt{0.16 / 400} = \sqrt{0.0004} = 0.02$. The test statistic is $z = (\hat{p} - p_0) / \operatorname{SE}_0 = (0.25 - 0.20) / 0.02 = 0.05 / 0.02 = 2.50$.`,
        d: 3,
      },
      {
        q: r`A researcher tests 100 hypotheses where only 10 represent genuine effects (prior probability $P(H_1) = 0.10$). The test has significance level $\alpha = 0.05$ and statistical power of $80\%$ ($1 - \beta = 0.80$). If a randomly selected test yields $p < 0.05$, what is the posterior probability that this significant finding is actually a true effect (the positive predictive value)?`,
        o: [
          r`95%`,
          r`80%`,
          r`5%`,
          r`64%`,
        ],
        a: 3,
        why: r`Out of 100 hypotheses, 10 are real ($H_1$) and 90 are null ($H_0$). The test detects $10 \times 0.80 = 8.0$ true positives and falsely rejects $90 \times 0.05 = 4.5$ false positives. Total positive calls = $8.0 + 4.5 = 12.5$. The posterior probability that a positive finding is genuine is $8.0 / 12.5 = 64\%$, demonstrating why $p < 0.05$ does not imply a 95% chance that the hypothesis is true.`,
        d: 3,
      },
      {
        q: r`An analyst tests 20 completely independent features that are pure Gaussian noise with zero true relationship to an outcome ($H_0$ is true for all 20). If each feature is tested at significance level $\alpha = 0.05$, what is the exact probability that at least one feature produces a falsely significant result ($p \le 0.05$)?`,
        o: [
          r`$5.0\%$`,
          r`$20 \times 0.05 = 100.0\%$`,
          r`$1 - (0.95)^{20} \approx 64.2\%$`,
          r`$(0.05)^{20} \approx 9.5 \times 10^{-27}$`,
        ],
        a: 2,
        why: r`The probability of correctly failing to reject $H_0$ on all 20 independent tests is $(1 - 0.05)^{20} = 0.95^{20} \approx 0.3585$. The family-wise error rate (probability of at least one false positive) is $1 - 0.3585 = 0.6415$ (or roughly $64.2\%$).`,
        d: 3,
      },
    ],
    usedBy: ['ols_linear_regression', 'logistic_regression'],
    prereq: ['random-variables-and-distributions', 'sampling-and-standard-error', 'confidence-intervals'],
    related: ['type-i-ii-errors-power-and-sample-size', 'z-test-and-t-tests', 'chi-square-tests'],
    keywords: 'hypothesis testing p-value null hypothesis alternative test statistic significance alpha level two-sided one-sided',
  },
  {
    id: 'type-i-ii-errors-power-and-sample-size',
    short: 'Errors, Power and Sample Size',
    title: r`Type I/II Errors, Power and Sample Size`,
    task: 'concepts',
    module: 'Hypothesis testing',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Master the trade-off between false alarms (Type I error) and missed detections (Type II error). Size experiments to guarantee adequate statistical power.`,
    lead: r`Every statistical decision risks two fundamental mistakes: raising a false alarm when no effect exists (Type I error), or missing a genuine effect when one is present (Type II error). Statistical power measures a test's ability to detect true differences, and pre-experiment sample size planning guarantees that studies are neither underpowered nor wastefully oversized.`,
    intuition: [
      r`Think of a commercial smoke alarm system installed in an office. A Type I error ($\alpha$) is a false alarm: someone burns toast in the kitchen, triggering sirens and evacuating the entire building even though there is no actual blaze. A Type II error ($\beta$) is a missed detection: a genuine electrical fire starts in the server room, but the sensor fails to register the smoke. Statistical power ($1 - \beta$) is the system's true positive rate: the probability that the siren sounds given that a real fire has erupted.`,
      r`Dialling up sensor sensitivity makes the alarm trigger at the faintest wisp of smoke, reducing missed detections (lowering $\beta$, boosting power) but causing more false alarms from routine cooking (increasing $\alpha$). Conversely, making the sensor less sensitive suppresses false alarms but leaves real fires undetected. In hypothesis testing, researchers fix the maximum acceptable false alarm rate in advance, typically setting $\alpha = 0.05$.`,
      r`Once $\alpha$ is locked at 5%, how can an experimenter detect subtle effects without increasing false alarms? The only universal lever is collecting more data. Increasing sample size shrinks standard errors, sharpening the separation between the null and alternative distributions. For example, detecting a subtle uplift of Cohen's $d = 0.35$ with 80% power at $\alpha = 0.05$ requires exactly 129 participants per group. With only 30 participants per group, power plunges below 28%, meaning you are more than twice as likely to miss the true effect as to detect it.`,
    ],
    analogy: r`Balancing Type I and Type II errors is like setting the sensitivity on an airport metal detector: tune it too high and every belt buckle triggers an inspection; tune it too low and contraband passes through unnoticed.`,
    steps: [
      r`Specify the significance threshold $\alpha$ (the maximum tolerable false positive rate, typically 0.05).`,
      r`Determine the minimum detectable effect (MDE) $\delta$ that is commercially or scientifically worthwhile to discover.`,
      r`Choose the desired statistical power $1 - \beta$ (typically 0.80 or 0.90, accepting a 10% to 20% risk of a false negative).`,
      r`Estimate baseline variance $\sigma^2$ from historical records or an exploratory pilot sample.`,
      r`Calculate the required per-group sample size $n$ using the analytical power equation prior to collecting any live data.`,
      r`Run the experiment to the full calculated sample size without early stopping or opportunistic peeking.`,
    ],
    math: [
      {
        h: 'The Decision Matrix and Error Probabilities',
        tex: r`$$\alpha = P(\text{Reject } H_0 \mid H_0 \text{ true}), \qquad \beta = P(\text{Fail to reject } H_0 \mid H_1 \text{ true})$$`,
        p: r`Type I error ($\alpha$, false positive rate) occurs when we reject a true null hypothesis. Type II error ($\beta$, false negative rate) occurs when we fail to reject a false null hypothesis. Statistical power is defined as the complement $1 - \beta = P(\text{Reject } H_0 \mid H_1 \text{ true})$, which corresponds to sensitivity or recall in binary classification.`,
      },
      {
        h: 'Two-Sample Mean Sample Size Formula',
        tex: r`$$n = \frac{2\left(z_{1 - \alpha/2} + z_{1 - \beta}\right)^2 \sigma^2}{\delta^2}$$`,
        p: r`For a two-sample $z$-test comparing means with common variance $\sigma^2$ and true difference $\delta = |\mu_1 - \mu_2|$, the required sample size per group $n$ scales with the squared critical normal quantiles. At $\alpha = 0.05$ ($z_{0.975} \approx 1.960$) and 80% power ($z_{0.80} \approx 0.842$), the numerator multiplier $(1.960 + 0.842)^2 \approx 7.85$.`,
      },
      {
        h: 'Standardised Effect Size (Cohen\'s d)',
        tex: r`$$d = \frac{|\mu_1 - \mu_2|}{\sigma} \implies n \approx \frac{2\left(z_{1 - \alpha/2} + z_{1 - \beta}\right)^2}{d^2}$$`,
        p: r`Cohen's $d$ expresses the effect size in units of standard deviations. Because $n$ is inversely proportional to $d^2$, detecting an effect half as large requires four times as many observations per group. Sizing studies to detect tiny effects without adequate sample sizes guarantees severe underpowering.`,
      },
    ],
    keyPoints: [
      r`Statistical power depends on four interconnected parameters: significance level $\alpha$, sample size $n$, effect size $\delta$, and population variance $\sigma^2$.`,
      r`Required sample size scales inversely with the square of effect size: halving the target effect quadruples the required sample size.`,
      r`Underpowered studies suffer from the winner's curse: when a small study does reach significance, its estimated effect size is substantially exaggerated.`,
      r`Never compute retrospective or post-hoc power using observed p-values; power is an essential pre-experiment design tool, not an after-the-fact diagnostic.`,
    ],
    pitfalls: [
      r`Interpreting a non-significant result ($p > 0.05$) in an underpowered study as evidence of "no difference", when the study was simply blind to realistic effect sizes.`,
      r`The winner's curse: deploying an algorithm or feature based on a tiny significant pilot test, only to discover performance collapses in production.`,
      r`Continuous peeking: repeatedly checking p-values as users arrive and stopping the test the moment $p < 0.05$, which multiplies the true Type I error rate substantially above $\alpha$.`,
      r`Confusing statistical power with sample representativeness: a huge sample size provides high power to detect differences, but cannot fix selection bias.`,
    ],
    code: r`import numpy as np
import scipy.stats as stats

# Required sample size for two-sample test (Cohen's d = 0.35)
alpha = 0.05
target_power = 0.80
d = 0.35

z_alpha = stats.norm.ppf(1.0 - alpha / 2.0)  # ~1.960
z_beta = stats.norm.ppf(target_power)         # ~0.842
n_required = int(np.ceil(2.0 * ((z_alpha + z_beta) / d) ** 2))

# Verify statistical power through Monte Carlo simulation
rng = np.random.default_rng(42)
n_simulations = 2000
group_a = rng.normal(loc=0.0, scale=1.0, size=(n_simulations, n_required))
group_b = rng.normal(loc=d, scale=1.0, size=(n_simulations, n_required))

# Independent two-sample t-tests across all simulated trials
_, p_values = stats.ttest_ind(group_b, group_a, axis=1)
empirical_power = float(np.mean(p_values < alpha))

print(f"Cohen's d: {d}, alpha: {alpha}, target power: {target_power}")
print(f"Required sample size per group: {n_required}")
print(f"Empirical power ({n_simulations} trials): {empirical_power:.3f}")`,
    quiz: [
      {
        q: r`In hypothesis testing, what constitutes a Type II error ($\beta$)?`,
        o: [
          r`Rejecting the null hypothesis when the null hypothesis is true`,
          r`Failing to reject the null hypothesis when the alternative hypothesis is true`,
          r`Choosing a significance threshold $\alpha$ that is too conservative`,
          r`Calculating a p-value using the wrong test statistic`,
        ],
        a: 1,
        why: r`Type II error is a false negative: failing to reject $H_0$ despite a real effect existing in the underlying population.`,
        d: 1,
      },
      {
        q: r`If you want to detect an effect size half as large as in a previous study (e.g. $d = 0.20$ instead of $0.40$) while keeping $\alpha$ and power constant, how does the required sample size change?`,
        o: [
          r`It doubles ($2\times$)`,
          r`It quadruples ($4\times$)`,
          r`It increases by $\sqrt{2}\approx 1.41\times$`,
          r`It remains unchanged`,
        ],
        a: 1,
        why: r`Because the required sample size is proportional to $1/d^2$, halving the effect size ($d \to d/2$) multiplies the required sample size by $(2)^2 = 4$.`,
        d: 2,
      },
      {
        q: r`What is the primary danger of the "winner's curse" in severely underpowered experiments?`,
        o: [
          r`Significant results from small studies systematically overestimate the true magnitude of the effect`,
          r`The Type I error rate drops to zero`,
          r`p-values become completely impossible to calculate`,
          r`Computations take excessive time to converge`,
        ],
        a: 0,
        why: r`When power is low, only sample estimates that randomly overshoot the true mean by a huge margin cross the significance threshold, leading to severe upward bias in published effect estimates.`,
        d: 2,
      },
      {
        q: r`How does continuous data peeking (checking p-values after every observation and stopping when $p < 0.05$) affect the experiment?`,
        o: [
          r`It improves statistical power without affecting Type I error`,
          r`It drastically inflates the actual Type I error rate far above the nominal 5% level`,
          r`It reduces the required sample size with zero statistical penalty`,
          r`It converts a two-sided test into a paired t-test`,
        ],
        a: 1,
        why: r`Repeatedly testing accumulating data provides multiple opportunities for random noise to cross the threshold, inflating false positive rates well beyond nominal $\alpha$.`,
        d: 2,
      },
      {
        q: r`What is a Type I error ($\alpha$) in statistical hypothesis testing?`,
        o: [
          r`Failing to reject the null hypothesis when there is a true effect`,
          r`Miscalculating the sample variance during exploratory analysis`,
          r`Rejecting the null hypothesis when the null hypothesis is true (a false alarm)`,
          r`Failing to collect enough sample observations to reach target power`,
        ],
        a: 2,
        why: r`A Type I error is a false positive: rejecting the null hypothesis when no true effect exists in the population.`,
        d: 1,
      },
      {
        q: r`How is statistical power defined in terms of the error probabilities $\alpha$ and $\beta$?`,
        o: [
          r`$1 - \alpha$`,
          r`$\alpha + \beta$`,
          r`$\alpha / \beta$`,
          r`$1 - \beta$`,
        ],
        a: 3,
        why: r`Statistical power is the probability of correctly rejecting a false null hypothesis, defined as $1 - \beta$, where $\beta$ is the Type II error rate.`,
        d: 1,
      },
      {
        q: r`What does Cohen's $d$ measure in a comparison between two group means $\mu_1$ and $\mu_2$?`,
        o: [
          r`The p-value of the two-sample test`,
          r`The sample size ratio between group 1 and group 2`,
          r`The degrees of freedom of the Welch t-test`,
          r`The standardised difference between means expressed in units of pooled standard deviation ($|\mu_1 - \mu_2| / \sigma$)`,
        ],
        a: 3,
        why: r`Cohen's $d = |\mu_1 - \mu_2| / \sigma$ is a standardised effect size that expresses the difference between means in standard deviation units, allowing comparisons across different metrics and studies.`,
        d: 1,
      },
      {
        q: r`In a study with a fixed sample size $n$, what happens to the Type II error rate ($\beta$) if the experimenter decreases the significance threshold $\alpha$ from $0.05$ to $0.001$?`,
        o: [
          r`$\beta$ increases, reducing power`,
          r`$\beta$ decreases, increasing power`,
          r`$\beta$ remains unchanged because $\alpha$ and $\beta$ are mathematically independent`,
          r`$\beta$ drops to zero`,
        ],
        a: 0,
        why: r`Tightening the significance threshold $\alpha$ makes the test more conservative to reduce false alarms. With a fixed sample size, this requires stronger evidence to reject $H_0$, inevitably increasing the risk of missing genuine effects ($\beta$ rises, power falls).`,
        d: 2,
      },
      {
        q: r`Why do statistical authorities strongly advise against computing "retrospective" or "post-hoc" power using the observed effect size from a completed experiment?`,
        o: [
          r`Because retrospective power requires at least $10,000$ observations to compute`,
          r`Because post-hoc power can only be computed for one-tailed tests`,
          r`Because retrospective power is mathematically a one-to-one transformation of the observed p-value, providing zero new information beyond the p-value itself`,
          r`Because post-hoc power always evaluates to exactly $0.50$`,
        ],
        a: 2,
        why: r`Post-hoc power computed from observed data is a monotonic transformation of the p-value: non-significant results will always yield low observed power and significant results high power. Power is a planning tool before collecting data, not a post-hoc diagnostic.`,
        d: 2,
      },
      {
        q: r`An A/B testing team wants to detect an effect size of Cohen's $d = 0.50$ with $80\%$ power ($z_{0.80} \approx 0.84$) at a two-sided significance level $\alpha = 0.05$ ($z_{0.975} \approx 1.96$). Using the standard formula $n \approx 2(z_{1 - \alpha/2} + z_{1 - \beta})^2 / d^2$, what is the required sample size per group?`,
        o: [
          r`32`,
          r`250`,
          r`126`,
          r`63`,
        ],
        a: 3,
        why: r`Substituting the values: $n \approx 2 \times (1.96 + 0.84)^2 / (0.50)^2 = 2 \times (2.80)^2 / 0.25 = 2 \times 7.84 / 0.25 = 15.68 \times 4 = 62.72$. Rounding up gives $n = 63$ observations per group.`,
        d: 3,
      },
      {
        q: r`When sizing an experiment, an engineer assumes the standard deviation of latency is $\sigma = 10\text{ ms}$ and sizes the test for $n = 100$ per group to achieve 80% power for a $4\text{ ms}$ difference. In reality, the true standard deviation in production is $\sigma = 20\text{ ms}$ (twice as large). How does this affect the true Cohen's $d$ and the required sample size for the planned power?`,
        o: [
          r`True $d$ is halved ($0.40 \to 0.20$), so the required sample size quadruples to $n = 400$`,
          r`True $d$ is doubled ($0.40 \to 0.80$), so the required sample size halves to $n = 50$`,
          r`True $d$ remains unchanged because the mean difference is still $4\text{ ms}$`,
          r`Statistical power increases from 80% to 95%`,
        ],
        a: 0,
        why: r`Cohen's $d = \delta / \sigma$. When $\sigma$ doubles from 10 to 20, $d$ drops from $4/10 = 0.40$ to $4/20 = 0.20$. Because required sample size scales inversely with $d^2$, halving $d$ quadruples the required sample size from 100 to 400 per group.`,
        d: 3,
      },
      {
        q: r`Consider this Python simulation estimating empirical power for an experiment:
<code>n_sims = 1000
n_per_group = 50
d = 0.20
group_a = rng.normal(0, 1, size=(n_sims, n_per_group))
group_b = rng.normal(d, 1, size=(n_sims, n_per_group))
_, p_vals = stats.ttest_ind(group_a, group_b, axis=1)
power = np.mean(p_vals < 0.05)</code>
Given that detecting $d = 0.20$ with 80% power at $\alpha = 0.05$ requires approximately $n \approx 393$ observations per group, what approximate value will this script obtain for <code>power</code>?`,
        o: [
          r`Approximately 0.80`,
          r`Approximately 0.05`,
          r`Approximately 0.17`,
          r`Exactly 1.00`,
        ],
        a: 2,
        why: r`With $n = 50$ per group, $\operatorname{SE}(\bar{X}_B - \bar{X}_A) = \sqrt{2/50} = 0.20$. The non-centrality parameter is $d / \operatorname{SE} = 0.20 / 0.20 = 1.0$. The probability of exceeding the two-sided critical value $z = 1.96$ is approximately $\Phi(1.0 - 1.96) = \Phi(-0.96) \approx 0.1685$ (or roughly 17%), showing the severe risk of missed detections in underpowered studies.`,
        d: 3,
      },
    ],
    usedBy: ['confusion-matrix', 'precision-recall-f1'],
    prereq: ['hypothesis-testing-and-p-values', 'sampling-and-standard-error', 'confidence-intervals'],
    related: ['z-test-and-t-tests', 'chi-square-tests', 'confusion-matrix'],
    keywords: 'type i error type ii error statistical power sample size beta alpha false positive false negative mde cohens d winners curse',
  },
  {
    id: 'z-test-and-t-tests',
    short: 'z-Test and Student\'s t-Tests',
    title: r`z-Test and t-Tests`,
    task: 'concepts',
    module: 'Hypothesis testing',
    level: 1,
    minutes: 16,
    noLab: true,
    summary: r`Compare population means against benchmarks or between independent and paired groups using normal z-tests and Student's and Welch's t-tests.`,
    lead: r`When testing hypotheses about population means, the choice of test statistic hinges on whether population variance is known and whether sample sizes justify asymptotic normal approximations. The z-test applies when variance is known or sample sizes are large, whereas Student's and Welch's t-tests account for the extra uncertainty of estimating variance from small samples.`,
    intuition: [
      r`Imagine an engineering team modifies a database query engine to reduce latency below the historic benchmark of 120 ms. They benchmark 25 query runs and record a sample mean latency of 112 ms with a sample standard deviation $s = 15$ ms. Is this 8 ms reduction convincing evidence of improvement, or could it be routine variance in server load?`,
      r`If we knew with absolute certainty from millions of historic runs that the true population standard deviation was $\sigma = 15$ ms, the standard error would be exactly $\sigma / \sqrt{25} = 3.0$ ms. The standard score would be $z = (112 - 120) / 3.0 = -2.67$, giving a two-sided p-value of approximately 0.0076 under the standard normal distribution.`,
      r`However, in realistic settings we do not know the true $\sigma$; we must estimate it using $s$ from the very same 25 queries. When William Gosset analysed this problem at the Guinness Brewery in 1908 (publishing under the pen name "Student"), he proved that dividing by an estimated $s$ inflates sampling variability. The resulting $t$-distribution has heavier tails than the normal curve. For 24 degrees of freedom, $t = -2.67$ yields a p-value of approximately 0.0134—nearly double the normal p-value! Relying naively on a $z$-test when $s$ is estimated causes overconfidence and elevated false alarms.`,
    ],
    analogy: r`Using a normal z-test when you only have sample variance s is like driving at top speed on a foggy morning: it assumes clarity where there is hidden uncertainty, which the t-distribution's heavier tails properly account for.`,
    steps: [
      r`Determine the test design: one-sample (mean vs standard), two-sample independent (group A vs group B), or paired (repeated measures on the same subjects).`,
      r`Verify assumptions: continuous data, random independent sampling, and approximate normality of sample means (guaranteed by CLT for $n \ge 30$).`,
      r`If population standard deviation $\sigma$ is known, compute the $z$-statistic; if estimated via $s$, compute the $t$-statistic.`,
      r`For two independent groups, adopt Welch's $t$-test by default to guard against unequal variances ($\sigma_1^2 \ne \sigma_2^2$).`,
      r`For paired observations, compute unit-level differences $D_i = X_{1,i} - X_{2,i}$ and perform a one-sample $t$-test on the differences.`,
      r`Evaluate the p-value against degrees of freedom $\nu$ and decide whether to reject the null hypothesis at threshold $\alpha$.`,
    ],
    math: [
      {
        h: 'One-Sample z-Statistic and Student\'s t-Statistic',
        tex: r`$$z = \frac{\bar{X} - \mu_0}{\sigma / \sqrt{n}} \sim \mathcal{N}(0, 1), \qquad t = \frac{\bar{X} - \mu_0}{s / \sqrt{n}} \sim t(n - 1)$$`,
        p: r`Here $\bar{X}$ is the sample mean, $\mu_0$ is the hypothesised benchmark, $\sigma$ is the known population standard deviation, and $s = \sqrt{\frac{1}{n-1}\sum (X_i - \bar{X})^2}$ is the sample standard deviation. Gosset's $t$-statistic follows Student's $t$-distribution with $\nu = n - 1$ degrees of freedom, converging to $\mathcal{N}(0, 1)$ as $n \to \infty$.`,
      },
      {
        h: 'Welch\'s Two-Sample t-Test (Unequal Variances)',
        tex: r`$$t = \frac{\bar{X}_1 - \bar{X}_2}{\sqrt{\frac{s_1^2}{n_1} + \frac{s_2^2}{n_2}}}, \qquad \nu \approx \frac{\left(\frac{s_1^2}{n_1} + \frac{s_2^2}{n_2}\right)^2}{\frac{(s_1^2 / n_1)^2}{n_1 - 1} + \frac{(s_2^2 / n_2)^2}{n_2 - 1}}$$`,
        p: r`Welch's $t$-test compares two independent group means without assuming equal population variances ($\sigma_1^2 = \sigma_2^2$). The Welch–Satterthwaite equation approximates the effective degrees of freedom $\nu$. Welch's test maintains robust Type I error control under heteroscedasticity where Student's pooled $t$-test breaks down.`,
      },
      {
        h: 'Paired t-Test for Dependent Samples',
        tex: r`$$D_i = X_{1,i} - X_{2,i}, \qquad t = \frac{\bar{D} - 0}{s_D / \sqrt{n}} \sim t(n - 1)$$`,
        p: r`For matched pairs or repeated measures (such as pre- and post-treatment values for the same users), between-subject variability is removed by taking differences $D_i$. Here $\bar{D}$ is the average difference and $s_D$ is the sample standard deviation of differences. Subtracting out subject baseline variation dramatically increases statistical power.`,
      },
    ],
    keyPoints: [
      r`Gosset's $t$-distribution accounts for the joint uncertainty of estimating both the population mean $\mu$ and population standard deviation $\sigma$.`,
      r`Always prefer Welch's $t$-test over Student's pooled $t$-test for two independent samples; testing for equality of variances first creates pre-test bias.`,
      r`Paired $t$-tests eliminate subject-to-subject variability by analysing intra-subject differences, providing far greater statistical power for matched cohorts.`,
      r`Thanks to the central limit theorem, $t$-tests are remarkably robust to non-normal data once sample sizes exceed roughly 30 observations per group.`,
    ],
    pitfalls: [
      r`Applying an independent two-sample $t$-test to paired or before-and-after data, throwing away subject pairing and crippling statistical power.`,
      r`Using Student's pooled $t$-test when group sample sizes and variances are unequal, which severely inflates the false positive rate.`,
      r`Running a $t$-test on small samples ($n < 20$) with extreme skewness or severe outliers where the sample mean is not approximately normal.`,
      r`Using a $z$-test when sample size is small and $\sigma$ is estimated from the sample, producing falsely narrow confidence bounds and deflated p-values.`,
    ],
    code: r`import numpy as np
import scipy.stats as stats

rng = np.random.default_rng(42)
n_users = 30

# Paired experiment: latency before and after database indexing
pre_latency = rng.normal(loc=72.0, scale=8.0, size=n_users)
# Each user improves by ~3.5 ms, plus individual variation
post_latency = pre_latency - rng.normal(loc=3.5, scale=4.0, size=n_users)

# 1. Paired t-test (correct: accounts for within-subject correlation)
t_pair, p_pair = stats.ttest_rel(pre_latency, post_latency)

# 2. Independent Welch t-test (incorrect: ignores pairing)
t_welch, p_welch = stats.ttest_ind(pre_latency, post_latency, equal_var=False)

mean_improvement = float(np.mean(pre_latency - post_latency))
print(f"Mean improvement: {mean_improvement:.2f} ms")
print(f"Paired t-test:    t={t_pair:.3f}, p-value={p_pair:.4e}")
print(f"Welch t-test:     t={t_welch:.3f}, p-value={p_welch:.4f}")`,
    quiz: [
      {
        q: r`Why does Student's $t$-distribution have heavier tails than the standard normal distribution?`,
        o: [
          r`Because data points in small samples are inherently non-normal`,
          r`Because estimating the unknown population variance with the sample variance introduces additional random variability into the denominator`,
          r`Because the degrees of freedom increase the variance of the numerator`,
          r`Because Student's test assumes an exponential distribution`,
        ],
        a: 1,
        why: r`The sample standard deviation $s$ fluctuates from sample to sample. Dividing the sample mean by a random denominator fattens the tails of the test statistic distribution.`,
        d: 1,
      },
      {
        q: r`When comparing means between two independent groups of different sizes, why is Welch's $t$-test preferred over Student's pooled $t$-test?`,
        o: [
          r`Welch's test does not require the assumption of equal population variances ($\sigma_1^2 = \sigma_2^2$)`,
          r`Welch's test always produces a smaller p-value`,
          r`Welch's test works on categorical data`,
          r`Welch's test eliminates the need for random sampling`,
        ],
        a: 0,
        why: r`Student's pooled test assumes homoscedasticity ($\sigma_1^2 = \sigma_2^2$). When variances differ and group sizes are unequal, the pooled test has severely distorted Type I error rates. Welch's test does not require equal variances.`,
        d: 1,
      },
      {
        q: r`In an experiment where 40 users complete tasks using Interface A and then Interface B, which test is appropriate to compare task completion times?`,
        o: [
          r`One-sample z-test`,
          r`Independent two-sample Welch t-test`,
          r`Paired t-test on the difference scores for each user`,
          r`Chi-square goodness-of-fit test`,
        ],
        a: 2,
        why: r`Because the same 40 users were tested under both conditions, observations are paired. Taking within-user differences removes user-to-user variability and isolates the interface effect.`,
        d: 1,
      },
      {
        q: r`As the degrees of freedom $\nu$ in Student's $t$-distribution approach infinity ($\nu \to \infty$), what does the distribution become?`,
        o: [
          r`A uniform distribution $\text{Uniform}(-1, 1)$`,
          r`A chi-square distribution $\chi^2(1)$`,
          r`The standard normal distribution $\mathcal{N}(0, 1)$`,
          r`A Cauchy distribution`,
        ],
        a: 2,
        why: r`As $n \to \infty$, the sample standard deviation $s$ converges in probability to the true population standard deviation $\sigma$ by the law of large numbers, so $t(\nu)$ converges to $\mathcal{N}(0, 1)$.`,
        d: 1,
      },
      {
        q: r`A network engineer benchmarks a new caching layer across $n = 25$ requests, finding a sample mean response time of $\bar{x} = 88.0\text{ ms}$ with sample standard deviation $s = 10.0\text{ ms}$. If the baseline target latency is $\mu_0 = 92.0\text{ ms}$, what is the value of the one-sample $t$-statistic?`,
        o: [
          r`-0.40`,
          r`+2.00`,
          r`-4.00`,
          r`-2.00`,
        ],
        a: 3,
        why: r`The standard error is $\operatorname{SE} = s / \sqrt{n} = 10.0 / \sqrt{25} = 2.0\text{ ms}$. The $t$-statistic is $(\bar{x} - \mu_0) / \operatorname{SE} = (88.0 - 92.0) / 2.0 = -4.0 / 2.0 = -2.00$.`,
        d: 2,
      },
      {
        q: r`In a study evaluating model compression, 30 deep neural networks are each evaluated before and after pruning, yielding 30 pair-wise differences in inference latency. How many degrees of freedom does the paired $t$-test have?`,
        o: [
          r`58`,
          r`29`,
          r`30`,
          r`60`,
        ],
        a: 1,
        why: r`A paired $t$-test computes differences for each of the $n$ pairs and runs a one-sample test on those differences. With $n = 30$ pairs, the degrees of freedom are $\nu = n - 1 = 30 - 1 = 29$.`,
        d: 2,
      },
      {
        q: r`Under what condition is Student's $t$-test robust to moderate departures from normality in the underlying population?`,
        o: [
          r`Only when the population variance is known with zero error`,
          r`Only when all data values are strictly non-negative integers`,
          r`When the data follows a Cauchy distribution`,
          r`When sample sizes are reasonably large (e.g. $n \ge 30$) so that the central limit theorem ensures the sample mean is approximately normally distributed`,
        ],
        a: 3,
        why: r`The $t$-statistic relies on the distribution of the sample mean $\bar{X}$. By the central limit theorem, sample means of independent observations converge to normality as $n$ increases (typically $n \ge 30$), rendering the $t$-test robust to non-normal data without severe outliers.`,
        d: 2,
      },
      {
        q: r`Consider this Python function call to compare two independent groups:
<code>stat, p_val = stats.ttest_ind(group_a, group_b, equal_var=False)</code>
What test does setting <code>equal_var=False</code> execute?`,
        o: [
          r`Welch's t-test, which does not assume equal variances between groups`,
          r`Mann-Whitney U non-parametric test`,
          r`Paired two-sample t-test`,
          r`Student's pooled two-sample t-test`,
        ],
        a: 0,
        why: r`In SciPy, <code>stats.ttest_ind</code> defaults to Student's pooled $t$-test (<code>equal_var=True</code>). Setting <code>equal_var=False</code> instructs SciPy to perform Welch's $t$-test using the Welch–Satterthwaite approximation for degrees of freedom.`,
        d: 2,
      },
      {
        q: r`In which of the following scenarios is a normal $z$-test formally valid instead of a Student's $t$-test?`,
        o: [
          r`Whenever the sample mean is greater than zero`,
          r`When sample size is $n = 12$ and population variance $\sigma^2$ is estimated using $s^2$`,
          r`When the sample is drawn without replacement from a finite population`,
          r`When the population variance $\sigma^2$ is known exactly from extensive historical census data`,
        ],
        a: 3,
        why: r`A $z$-test requires known population standard deviation $\sigma$. When $\sigma$ is unknown and estimated by the sample standard deviation $s$, Gosset proved the ratio follows a $t$-distribution, not a standard normal distribution.`,
        d: 2,
      },
      {
        q: r`Two independent groups have sample statistics:
Group 1: $n_1 = 10$, $s_1^2 = 9$ (so $s_1^2/n_1 = 0.90$)
Group 2: $n_2 = 10$, $s_2^2 = 81$ (so $s_2^2/n_2 = 8.10$)
Using the Welch–Satterthwaite formula $\nu \approx \frac{(v_1 + v_2)^2}{\frac{v_1^2}{n_1 - 1} + \frac{v_2^2}{n_2 - 1}}$ where $v_1 = s_1^2/n_1$ and $v_2 = s_2^2/n_2$, what is the approximate effective degrees of freedom $\nu$?`,
        o: [
          r`18.0`,
          r`11.0`,
          r`9.0`,
          r`14.5`,
        ],
        a: 1,
        why: r`$v_1 = 9/10 = 0.9$, $v_2 = 81/10 = 8.1$. The numerator is $(0.9 + 8.1)^2 = 9^2 = 81.0$. The denominator is $(0.9^2 / 9) + (8.1^2 / 9) = 0.09 + 7.29 = 7.38$. Thus $\nu \approx 81.0 / 7.38 \approx 10.98$ (or approximately 11.0), substantially lower than the pooled df of 18.`,
        d: 3,
      },
      {
        q: r`In repeated-measures data, the variance of the difference between paired measurements is $\operatorname{Var}(X_1 - X_2) = \sigma_1^2 + \sigma_2^2 - 2\operatorname{Cov}(X_1, X_2)$. If two measurements have variances $\sigma_1^2 = 25$ and $\sigma_2^2 = 25$ with positive correlation $\rho = 0.80$, how does the variance of the difference $\operatorname{Var}(X_1 - X_2)$ compare to the variance under an independent two-sample design?`,
        o: [
          r`It is identical: $\operatorname{Var} = 50$ in both designs`,
          r`It is increased from $50$ to $90$ due to double counting`,
          r`It is reduced fivefold from $50$ to $10$, dramatically shrinking the standard error and boosting power`,
          r`It reduces the degrees of freedom to zero`,
        ],
        a: 2,
        why: r`With covariance $\operatorname{Cov}(X_1, X_2) = 0.80 \times 5 \times 5 = 20$, the paired variance is $25 + 25 - 2(20) = 10$, compared to $25 + 25 = 50$ for independent samples. By subtracting out the strong shared variance between matched pairs, the standard error shrinks by $\sqrt{5} \approx 2.24\times$.`,
        d: 3,
      },
      {
        q: r`A researcher tests whether there is a difference in mean latency among 4 different model variants. Instead of running a one-way ANOVA, the researcher conducts all possible pair-wise two-sample $t$-tests at $\alpha = 0.05$. How many pair-wise tests are performed, and what is the approximate upper bound on the family-wise error rate if the tests were independent?`,
        o: [
          r`6 tests, family-wise error rate $\approx 26.5\%$`,
          r`12 tests, family-wise error rate $\approx 60.0\%$`,
          r`6 tests, family-wise error rate $\approx 5.0\%$`,
          r`4 tests, family-wise error rate $\approx 5.0\%$`,
        ],
        a: 0,
        why: r`For $k = 4$ groups, there are $\binom{4}{2} = 6$ distinct pairwise comparisons. Performing 6 independent tests at $\alpha = 0.05$ yields a family-wise false positive risk of $1 - (0.95)^6 \approx 26.5\%$. This severe inflation is why ANOVA omnibus tests and post-hoc corrections (like Tukey HSD) are required.`,
        d: 3,
      },
    ],
    usedBy: ['ols_linear_regression', 'logistic_regression'],
    prereq: ['hypothesis-testing-and-p-values', 'type-i-ii-errors-power-and-sample-size', 'central-limit-theorem-and-law-of-large-numbers'],
    related: ['sampling-and-standard-error', 'confidence-intervals', 'chi-square-tests'],
    keywords: 'z-test t-test students t welchs t paired t test degrees of freedom two sample one sample difference in means',
  },
  {
    id: 'chi-square-tests',
    short: 'Chi-Square Tests',
    title: r`Chi-Square Tests`,
    task: 'concepts',
    module: 'Hypothesis testing',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Test categorical distributions using goodness-of-fit and contingency table tests of independence, comparing observed counts against expected frequencies.`,
    lead: r`While t-tests evaluate continuous measurements, many empirical problems involve counts of categorical occurrences. Pearson's chi-square ($\chi^2$) tests assess whether observed categorical frequencies conform to a theoretical distribution (goodness-of-fit) or whether two categorical variables are statistically independent.`,
    intuition: [
      r`Suppose an engineering team tests whether user device type (Desktop vs Mobile) is independent of subscription tier choice (Free, Pro, Enterprise). Over a week, 500 new users register: Desktop users comprise 120 Free, 80 Pro, and 50 Enterprise (250 total); Mobile users comprise 180 Free, 50 Pro, and 20 Enterprise (250 total). Overall, 300 users choose Free (60%), 130 choose Pro (26%), and 70 choose Enterprise (14%).`,
      r`If device type had zero influence on subscription choice (the null hypothesis of independence), both Desktop and Mobile users should mirror these overall 60%, 26%, and 14% shares. We would expect $250 \times 0.60 = 150.0$ Free Desktop users, $250 \times 0.26 = 65.0$ Pro Desktop users, and $250 \times 0.14 = 35.0$ Enterprise Desktop users. The exact same expected counts would apply to Mobile users.`,
      r`Comparing observed counts to expected frequencies reveals clear discrepancies: Free Desktop count is 120 (30 fewer than expected), while Enterprise Desktop is 50 (15 more than expected). Pearson's chi-square test tallies the normalised squared discrepancy $(O - E)^2 / E$ across all six table cells. Squaring prevents positive and negative deviations from cancelling out, while dividing by $E$ scales each residual relative to its baseline magnitude. For this table, the sum of residuals yields $\chi^2 = 31.78$ with 2 degrees of freedom, producing a p-value of $1.26 \times 10^{-7}$. Because this is vastly smaller than $\alpha = 0.05$, we reject independence and confirm that subscription choice is strongly linked to device type.`,
    ],
    analogy: r`Pearson's chi-square test is like auditing a casino roulette wheel: you compare how often the ball lands in each pocket against how often it should land if the wheel were perfectly balanced.`,
    steps: [
      r`Compile observed data into a two-way contingency table of raw frequency counts across $R$ rows and $C$ columns.`,
      r`Compute row totals $R_i$, column totals $C_j$, and the grand total sample size $N = \sum O_{ij}$.`,
      r`Under the null hypothesis of independence, calculate expected cell frequencies: $E_{ij} = (R_i \times C_j) / N$.`,
      r`Check Cochran's sample size criteria: ensure all $E_{ij} \ge 1$ and at least 80% of cells have $E_{ij} \ge 5$.`,
      r`Sum Pearson residuals $\sum (O_{ij} - E_{ij})^2 / E_{ij}$ to obtain the test statistic $\chi^2$ with degrees of freedom $\nu = (R - 1)(C - 1)$.`,
      r`Calculate the p-value from the $\chi^2(\nu)$ distribution and decide whether to reject the null hypothesis of independence.`,
    ],
    math: [
      {
        h: 'Pearson\'s Chi-Square Test Statistic',
        tex: r`$$\chi^2 = \sum_{i=1}^R \sum_{j=1}^C \frac{(O_{ij} - E_{ij})^2}{E_{ij}} \sim \chi^2(\nu)$$`,
        p: r`Here $O_{ij}$ is the observed integer frequency in row $i$ and column $j$, and $E_{ij}$ is the expected frequency under $H_0$. Under the null hypothesis, as sample size $N \to \infty$, this sum of normalised squared deviations converges asymptotically to a chi-square distribution with $\nu$ degrees of freedom.`,
      },
      {
        h: 'Expected Frequencies and Degrees of Freedom',
        tex: r`$$E_{ij} = \frac{R_i C_j}{N}, \qquad \nu = (R - 1)(C - 1)$$`,
        p: r`Here $R_i$ is the $i$-th row marginal sum, $C_j$ is the $j$-th column marginal sum, and $N$ is total sample size. In an $R \times C$ contingency table, fixing row and column totals leaves $(R - 1)(C - 1)$ cells free to vary independently, determining the degrees of freedom $\nu$. For a 1D goodness-of-fit test with $K$ categories, $\nu = K - 1$.`,
      },
      {
        h: 'Goodness-of-Fit Test Statistic',
        tex: r`$$\chi^2 = \sum_{k=1}^K \frac{(O_k - n p_k)^2}{n p_k} \sim \chi^2(K - 1 - m)$$`,
        p: r`In goodness-of-fit testing, observed counts $O_k$ across $K$ categories are compared to theoretical expected counts $n p_k$, where $p_k$ is the hypothesised probability of category $k$. If $m$ parameters of the theoretical distribution are estimated from the sample data (such as fitting a Poisson rate $\lambda$), the degrees of freedom are reduced to $\nu = K - 1 - m$.`,
      },
    ],
    keyPoints: [
      r`Chi-square tests require raw integer counts; never run chi-square calculations on percentages, fractions, or normalised rates.`,
      r`Degrees of freedom in contingency tables depend exclusively on table dimensions $(R - 1)(C - 1)$, entirely independent of sample size $N$.`,
      r`Cochran's guideline requires expected cell counts to equal or exceed 5 in at least 80% of cells; when counts are smaller, use Fisher's exact test.`,
      r`A significant chi-square test confirms an association exists, but standardised residuals must be examined to identify which specific cells drive the divergence.`,
    ],
    pitfalls: [
      r`Inputting percentages or conversion rates instead of raw integer counts, which destroys the underlying multinomial sampling variance model.`,
      r`Applying standard chi-square tests to repeated measures or paired categorical data (such as user choices before and after an update); use McNemar's test instead.`,
      r`Ignoring low expected cell frequencies ($E_{ij} < 5$), where the continuous chi-square approximation fails and produces inaccurate p-values.`,
      r`Confusing statistical association with causal direction: a significant chi-square test indicates dependence between variables, not that one variable causes the other.`,
    ],
    code: r`import numpy as np
import scipy.stats as stats

# Contingency table: Device (Desktop, Mobile) vs Tier (Free, Pro, Enterprise)
observed = np.array([
    [120, 80, 50],   # Desktop
    [180, 50, 20],   # Mobile
])

# Pearson's chi-square test of independence
chi2_stat, p_val, dof, expected = stats.chi2_contingency(observed)

print("Observed table:\n", observed)
print(f"Expected counts:\n{np.round(expected, 1)}")
print(f"Chi-square statistic: {chi2_stat:.3f}")
print(f"Degrees of freedom:   {dof}")
print(f"p-value:              {p_val:.4e}")
print(f"Independence rejected at alpha=0.05: {p_val <= 0.05}")`,
    quiz: [
      {
        q: r`Why is it invalid to run a chi-square test on percentages or proportions (e.g. 0.40 and 0.60) rather than raw counts?`,
        o: [
          r`Because chi-square algorithms only accept floating-point numbers`,
          r`Because percentages disguise sample size, destroying the relationship between count variance and expected frequencies`,
          r`Because percentages always sum to 100`,
          r`Because proportions follow a Student's t-distribution`,
        ],
        a: 1,
        why: r`Chi-square test statistics rely on Poisson or multinomial sampling variance, where the variance of a count is proportional to $N$. Converting counts to proportions eliminates sample size information.`,
        d: 1,
      },
      {
        q: r`How many degrees of freedom does a $3 \times 4$ contingency table have in a test of independence?`,
        o: [
          r`12`,
          r`11`,
          r`6`,
          r`7`,
        ],
        a: 2,
        why: r`Degrees of freedom for an $R \times C$ table are $(R - 1)(C - 1)$. For a $3 \times 4$ table, $(3 - 1)(4 - 1) = 2 \times 3 = 6$.`,
        d: 1,
      },
      {
        q: r`When expected cell counts $E_{ij}$ in a $2 \times 2$ table fall below 5, which test should be used instead of Pearson's chi-square test?`,
        o: [
          r`Paired t-test`,
          r`Fisher's exact test`,
          r`One-way ANOVA`,
          r`Mann-Whitney U test`,
        ],
        a: 1,
        why: r`When cell counts are small ($E_{ij} < 5$), the continuous chi-square approximation breaks down. Fisher's exact test computes exact hypergeometric probabilities without relying on asymptotic approximations.`,
        d: 1,
      },
      {
        q: r`What does a statistically significant result ($p < 0.001$) in a chi-square test of independence demonstrate?`,
        o: [
          r`One categorical variable directly causes the other`,
          r`The two categorical variables are statistically dependent in the sampled population`,
          r`All categories have identical frequencies`,
          r`The expected cell counts are all greater than 5`,
        ],
        a: 1,
        why: r`Rejecting the null hypothesis of independence indicates that the row and column classifications are statistically dependent, though it does not imply causal direction.`,
        d: 1,
      },
      {
        q: r`In a customer survey of $N = 200$ people, 80 are mobile users and 120 are desktop users. Overall, 50 users prefer dark mode. Under the null hypothesis that UI preference is independent of device, what is the expected count of mobile users who prefer dark mode?`,
        o: [
          r`20.0`,
          r`25.0`,
          r`40.0`,
          r`10.0`,
        ],
        a: 0,
        why: r`Under the null hypothesis of independence, $E_{ij} = (R_i \times C_j) / N$. Here $E = (80 \times 50) / 200 = 4000 / 200 = 20.0$.`,
        d: 2,
      },
      {
        q: r`What is Cochran's standard criterion for determining whether sample sizes are sufficient for the asymptotic chi-square approximation in an $R \times C$ contingency table?`,
        o: [
          r`The degrees of freedom must be greater than 10`,
          r`Every observed cell count $O_{ij}$ must exceed 30`,
          r`The total sample size $N$ must exceed 10,000`,
          r`All expected frequencies $E_{ij}$ must be at least 1, and at least 80% of cells must have $E_{ij} \ge 5$`,
        ],
        a: 3,
        why: r`Cochran (1954) established that the continuous chi-square distribution accurately approximates multinomial cell probabilities when no expected cell frequency is less than 1 and at least 80% of cells have expected frequencies of 5 or more.`,
        d: 2,
      },
      {
        q: r`100 users are surveyed on whether they like a software interface before and after a major redesign (producing binary Yes/No responses for each user at both time points). Why is Pearson's standard chi-square test of independence invalid for this table?`,
        o: [
          r`Because the data is continuous rather than categorical`,
          r`Because a $2 \times 2$ table has zero degrees of freedom`,
          r`Because the before and after observations come from the same individuals, violating the assumption of independent observations`,
          r`Because binary data cannot be analysed with hypothesis tests`,
        ],
        a: 2,
        why: r`Pearson's chi-square test requires mutually independent observations. When the same users are evaluated before and after an update, the data is paired (repeated measures); McNemar's test must be used instead.`,
        d: 2,
      },
      {
        q: r`After obtaining a statistically significant chi-square test of independence in a $3 \times 3$ table, how can an analyst identify which specific combinations of categories deviate most strongly from independence?`,
        o: [
          r`By recalculating the table with percentages`,
          r`By running a one-sample z-test on the grand total $N$`,
          r`By summing the row marginals`,
          r`By examining the standardised (Pearson) residuals $r_{ij} = (O_{ij} - E_{ij}) / \sqrt{E_{ij}}$, where values with $|r_{ij}| > 2$ or $3$ indicate substantial divergence`,
        ],
        a: 3,
        why: r`Standardised residuals $r_{ij} = (O_{ij} - E_{ij}) / \sqrt{E_{ij}}$ quantify the direction and magnitude of departure in each individual cell. Under $H_0$, they approximate standard normal variates, so values outside $[-2, +2]$ highlight cells that drive the overall significance.`,
        d: 2,
      },
      {
        q: r`Consider the following code:
<code>table = [ [50, 30], [20, 60] ]
chi2, p, dof, expected = stats.chi2_contingency(table, correction=False)</code>
What does the parameter <code>correction=False</code> control in this test?`,
        o: [
          r`It disables Yates' continuity correction, which subtracts $0.5$ from $|O_{ij} - E_{ij}|$ in $2 \times 2$ tables`,
          r`It skips calculating expected cell frequencies`,
          r`It converts the test from a two-sided test to a one-sided test`,
          r`It forces degrees of freedom to equal 1`,
        ],
        a: 0,
        why: r`For $2 \times 2$ contingency tables, Yates' continuity correction adjusts for approximating discrete counts with a continuous distribution by subtracting 0.5 from each absolute difference $|O - E|$. Setting <code>correction=False</code> computes the uncorrected Pearson chi-square statistic.`,
        d: 2,
      },
      {
        q: r`Consider the following $2 \times 2$ observed table:
Row 1: [30, 10] (Total = 40)
Row 2: [10, 30] (Total = 40)
Column totals are 40 and 40, with grand total $N = 80$.
Under $H_0$, all four expected counts are $E_{ij} = (40 \times 40) / 80 = 20$.
What is the uncorrected Pearson chi-square statistic $\chi^2 = \sum (O - E)^2 / E$?`,
        o: [
          r`5.0`,
          r`10.0`,
          r`40.0`,
          r`20.0`,
        ],
        a: 3,
        why: r`For each of the 4 cells, $|O - E| = 10$, so $(O - E)^2 = 100$. Dividing by $E = 20$ yields $100 / 20 = 5.0$ per cell. Summing over all 4 cells gives $\chi^2 = 4 \times 5.0 = 20.0$.`,
        d: 3,
      },
      {
        q: r`An auditor rolls a 6-sided die 60 times to test if it is fair ($p_k = 1/6$, expected count $E_k = 10$ for each face). The observed counts are: Face 1: 15, Face 2: 5, Face 3: 10, Face 4: 10, Face 5: 10, Face 6: 10. What is the chi-square goodness-of-fit statistic $\chi^2$ and its degrees of freedom?`,
        o: [
          r`$\chi^2 = 5.0$ with $\nu = 5$ degrees of freedom`,
          r`$\chi^2 = 5.0$ with $\nu = 6$ degrees of freedom`,
          r`$\chi^2 = 10.0$ with $\nu = 5$ degrees of freedom`,
          r`$\chi^2 = 2.5$ with $\nu = 1$ degree of freedom`,
        ],
        a: 0,
        why: r`The discrepancy comes entirely from Face 1 ($25/10 = 2.5$) and Face 2 ($25/10 = 2.5$), summing to $\chi^2 = 5.0$. For goodness-of-fit with $K = 6$ categories and no estimated parameters, degrees of freedom are $K - 1 = 6 - 1 = 5$.`,
        d: 3,
      },
      {
        q: r`A data scientist fits a Poisson distribution to website server crash counts grouped into $K = 8$ discrete frequency bins. The Poisson rate parameter $\lambda$ is not known in advance and must be estimated from the sample data. What are the degrees of freedom for the chi-square goodness-of-fit test?`,
        o: [
          r`7`,
          r`8`,
          r`6`,
          r`5`,
        ],
        a: 2,
        why: r`For a chi-square goodness-of-fit test, estimating $m$ parameters from the data imposes $m$ additional linear constraints on the expected counts. The degrees of freedom are $\nu = K - 1 - m$. With $K = 8$ bins and $m = 1$ parameter ($\lambda$), $\nu = 8 - 1 - 1 = 6$.`,
        d: 3,
      },
    ],
    usedBy: ['decision_tree_classifier', 'feature-selection'],
    prereq: ['hypothesis-testing-and-p-values', 'random-variables-and-distributions'],
    related: ['type-i-ii-errors-power-and-sample-size', 'z-test-and-t-tests', 'confusion-matrix'],
    keywords: 'chi-square test contingency table goodness of fit independence pearsons test expected frequencies categorical',
  },
  {
    id: "joint-marginal-and-conditional-distributions",
    short: "Joint & Conditional Dist.",
    title: "Joint, marginal and conditional distributions",
    task: "concepts",
    module: "Probability",
    level: 2,
    minutes: 20,
    noLab: true,
    summary: "Multivariate probability distributions formalise the simultaneous behaviour of multiple random variables. The joint distribution P(X=x, Y=y) captures all co-occurrence probabilities. Marginalisation collapses dimensions by integrating or summing out nuisance variables, while conditioning isolates the distribution of one variable given fixed observations of another via Bayes' rule P(X | Y) = P(X, Y) / P(Y). Understanding the decomposition of joint spaces into marginals and conditionals is fundamental to probabilistic graphical models, Markov decision processes, and multivariate density estimation.",
    lead: "When working with tabular datasets, image channels, or sensor networks, variables rarely operate in isolation. How does knowing an applicant's credit score alter the probability distribution of their loan default risk, and how can we recover the standalone distribution of default risk across the entire population? Joint distributions capture complete multivariate reality, while marginalisation and conditioning allow us to slice and project high-dimensional uncertainty down to actionable inferences.",
    intuition: [
      "The 2D Table of Reality: Imagine a 2D contingency grid where columns represent education levels and rows represent income brackets. The joint distribution assigns a probability to every individual cell (x, y), such that all cell probabilities sum to 1.",
      "Marginalisation (Collapsing Dimensions): If you only want to know the distribution of income regardless of education, you sum horizontally across all columns. You are projecting the 2D grid onto the vertical margin—hence the term \"marginal distribution\". Mathematically, marginalisation integrates out the unwanted variable: P(X) = sum_y P(X, y).",
      "Conditioning (Slicing the Distribution): If you learn a specific candidate holds a PhD, you discard every column except the \"PhD\" column. You take that single column slice, but because its cells do not sum to 1, you normalise by dividing by the marginal probability of having a PhD. That renormalised slice is the conditional distribution P(Income | Education = PhD).",
      "Independence and Covariance: Two variables are statistically independent if and only if knowing one yields zero information about the other: P(X, Y) = P(X)P(Y), which implies P(Y | X) = P(Y). When variables are dependent, conditioning reshapes the distribution, shifting both its conditional expectation and conditional variance."
    ],
    analogy: "Think of an aerial heat map of a crowded festival park where altitude represents the joint probability of finding a person at GPS coordinate (x, y). The marginal distribution of the east-west axis X is the silhouette of the crowd projected onto a northern wall: you look from the side and sum up everyone at that longitude regardless of latitude. The conditional distribution given latitude Y=y0 is like putting up a physical laser tape along latitude y0 and examining only the crowd profile walking along that exact east-west path, normalised so total presence sums to 100%.",
    steps: [
      {
        "title": "Specify or estimate joint distribution",
        "desc": "Construct the full joint probability mass function P(X, Y) or joint density f_{X,Y}(x, y).",
        "detail": "Tabulate discrete co-occurrences or model continuous densities using multivariate parametric distributions (e.g. bivariate normal) or non-parametric kernel density estimators."
      },
      {
        "title": "Compute marginal distributions via summation or integration",
        "desc": "Collapse the joint distribution across the dimension of the unobserved variable.",
        "detail": "Sum across columns to obtain row marginals P(X=x) = sum_y P(X=x, Y=y), or integrate continuous densities f_X(x) = int f_{X,Y}(x, y) dy. Check that the marginal distribution sums to 1."
      },
      {
        "title": "Derive conditional distributions by slicing and normalising",
        "desc": "Isolate the target variable's distribution conditioned on an observed evidence value.",
        "detail": "Extract the slice where the conditioning variable equals the observed evidence, and divide by the marginal probability of that evidence: P(Y=y | X=x) = P(X=x, Y=y) / P(X=x)."
      },
      {
        "title": "Evaluate conditional expectation and variance",
        "desc": "Compute the expected value and dispersion of the conditioned variable.",
        "detail": "Calculate E[Y | X=x] = sum_y y * P(Y=y | X=x) and Var(Y | X=x). Verify consistency using the Law of Total Expectation E[Y] = E[E[Y|X]] and Law of Total Variance."
      },
      {
        "title": "Test for statistical independence",
        "desc": "Check whether the joint distribution factorises into the product of its marginals.",
        "detail": "Confirm if P(X=x, Y=y) = P(X=x)P(Y=y) holds for all (x, y) pairs. If it holds everywhere, X and Y are independent; otherwise, they are dependent."
      }
    ],
    math: [
      {
        "h": "Joint, Marginal, and Conditional Probability Densities",
        "tex": "f_X(x) = \\int_{-\\infty}^{\\infty} f_{X,Y}(x, y) \\, dy, \\qquad f_{Y \\mid X}(y \\mid x) = \\frac{f_{X,Y}(x, y)}{f_X(x)} \\quad \\text{for } f_X(x) > 0",
        "p": "For continuous random variables, the marginal density f_X(x) integrates the joint density f_{X,Y}(x, y) across all possible values of y. The conditional density f_{Y \\mid X}(y \\mid x) represents the cross-sectional slice of the joint density at x, normalised so that \\int f_{Y \\mid X}(y \\mid x) \\, dy = 1."
      },
      {
        "h": "Law of Total Expectation and Total Variance (Eve's Law)",
        "tex": "\\mathbb{E}[Y] = \\mathbb{E}\\Big[\\mathbb{E}[Y \\mid X]\\Big], \\qquad \\text{Var}(Y) = \\mathbb{E}\\Big[\\text{Var}(Y \\mid X)\\Big] + \\text{Var}\\Big(\\mathbb{E}[Y \\mid X]\\Big)",
        "p": "Eve's Law decomposes the total variance of Y into two orthogonal components: the expected value of the conditional variance (unexplained within-group variance or noise) plus the variance of the conditional expectation (explained between-group variance). This identity forms the foundational mathematics of ANOVA and decision tree split criteria."
      },
      {
        "h": "Bivariate Gaussian Conditional Distribution",
        "tex": "Y \\mid (X = x) \\sim \\mathcal{N}\\left( \\mu_Y + \\rho \\frac{\\sigma_Y}{\\sigma_X}(x - \\mu_X), \\; \\sigma_Y^2(1 - \\rho^2) \\right)",
        "p": "When X and Y follow a joint bivariate normal distribution with correlation \\rho, the conditional distribution of Y given X=x remains strictly Gaussian. Its conditional mean shifts linearly with x, and its conditional variance shrinks by a factor of (1 - \\rho^2), demonstrating how conditioning reduces uncertainty."
      }
    ],
    code: "\"\"\"\nJoint, Marginal, and Conditional Distributions\nDemonstrates discrete joint probability tables, marginal collapse,\nconditional slicing, and verification of Eve's Law of Total Variance.\n\"\"\"\n\nimport numpy as np\n\n# 1. Define a 2D discrete joint distribution table P(Income, Education)\n# Rows: Income Levels (Low, Medium, High)\n# Columns: Education Levels (HighSchool, Bachelors, Postgraduate)\njoint_table = np.array([\n    [0.18, 0.08, 0.02],  # Low Income\n    [0.12, 0.25, 0.13],  # Medium Income\n    [0.02, 0.07, 0.13]   # High Income\n])\n\nincome_levels = [\"Low\", \"Medium\", \"High\"]\nincome_values = np.array([25000, 60000, 120000])  # Representative numeric values in GBP\neducation_levels = [\"HighSchool\", \"Bachelors\", \"Postgraduate\"]\n\nprint(\"=== 1. Joint Probability Table P(Income, Education) ===\")\nprint(\"Total Joint Sum (must equal 1.0):\", round(np.sum(joint_table), 4))\nfor i, inc in enumerate(income_levels):\n    row_str = \"  \" + f\"{inc:6s} | \" + \" \".join(f\"{joint_table[i, j]:6.2f}\" for j in range(3))\n    print(row_str)\n\n# 2. Marginal Distributions\np_education = np.sum(joint_table, axis=0)  # Sum down rows (marginal education)\np_income = np.sum(joint_table, axis=1)     # Sum across columns (marginal income)\n\nprint(\"\\n=== 2. Marginal Distributions ===\")\nfor j, edu in enumerate(education_levels):\n    print(f\"  P(Education = {edu:12s}) = {p_education[j]:.3f}\")\n\nprint(\"\")\nfor i, inc in enumerate(income_levels):\n    print(f\"  P(Income = {inc:6s}) = {p_income[i]:.3f}\")\n\n# 3. Conditional Distributions P(Income | Education)\n# For each column j, divide cell by p_education[j]\ncond_income_given_edu = joint_table / p_education[np.newaxis, :]\n\nprint(\"\\n=== 3. Conditional Distributions P(Income | Education) ===\")\nfor j, edu in enumerate(education_levels):\n    print(f\"P(Income | Education = {edu}):\")\n    for i, inc in enumerate(income_levels):\n        print(f\"  P({inc:6s} | {edu}) = {cond_income_given_edu[i, j]:.3f}\")\n\n# 4. Conditional Expectations and Eve's Law Verification\ncond_means = np.sum(income_values[:, np.newaxis] * cond_income_given_edu, axis=0)\ncond_vars = np.sum(((income_values[:, np.newaxis] - cond_means)**2) * cond_income_given_edu, axis=0)\n\noverall_mean = np.sum(income_values * p_income)\noverall_var = np.sum(((income_values - overall_mean)**2) * p_income)\n\nexpected_cond_var = np.sum(cond_vars * p_education)     # E[Var(Y|X)]\nvar_of_cond_mean = np.sum(((cond_means - overall_mean)**2) * p_education)  # Var(E[Y|X])\n\nprint(\"\\n=== 4. Verification of Eve's Law of Total Variance ===\")\nprint(f\"Overall Marginal Mean Income: £{overall_mean:,.2f}\")\nfor j, edu in enumerate(education_levels):\n    print(f\"  E[Income | {edu:12s}] = £{cond_means[j]:,.2f} | Std = £{np.sqrt(cond_vars[j]):,.2f}\")\n\nprint(f\"\\nTotal Population Variance:          {overall_var:,.0f}\")\nprint(f\"E[Var(Income | Education)] (Within): {expected_cond_var:,.0f}\")\nprint(f\"Var(E[Income | Education]) (Between):{var_of_cond_mean:,.0f}\")\nprint(f\"Within + Between Sum:               {expected_cond_var + var_of_cond_mean:,.0f}\")\nprint(\"Eve's Law Holds Exactly:\", np.isclose(overall_var, expected_cond_var + var_of_cond_mean))\n",
    keyPoints: [
      "The joint distribution specifies the simultaneous probability of all variable configurations across the multidimensional state space.",
      "Marginalisation collapses dimensions by integrating or summing out unobserved nuisance variables.",
      "Conditioning takes a slice along an observed variable and renormalises it by dividing by that variable's marginal probability.",
      "Eve's Law of Total Variance decomposes total variance into expected conditional variance (within-group noise) plus variance of conditional expectation (between-group signal)."
    ],
    pitfalls: [
      "Confusing P(X | Y) with P(Y | X): Conditional probabilities are directional and asymmetric; inverting them requires Bayes' theorem.",
      "Forgetting to renormalise conditional slices: A raw row or column of a joint table sums to the marginal probability, not 1; dividing by the marginal is mandatory.",
      "Assuming zero covariance implies independence: Covariance measures only linear relationships; non-linear dependencies can have zero covariance while remaining strongly dependent."
    ],
    quiz: [
      {
        "q": "How is a marginal distribution P(X) obtained from a discrete joint distribution P(X, Y)?",
        "o": [
          "By summing the joint probabilities over all possible values of the unwanted variable Y: P(X=x) = sum_y P(X=x, Y=y)",
          "By multiplying P(X, Y) by P(Y)",
          "By differentiating P(X, Y) with respect to X",
          "By setting all values of Y equal to zero"
        ],
        "a": 0,
        "why": "Marginalisation integrates or sums over all states of the unobserved variable, collapsing the joint distribution onto the marginal axis."
      },
      {
        "q": "According to Eve's Law of Total Variance, what two components comprise the total variance Var(Y)?",
        "o": [
          "The expected value of the conditional variance E[Var(Y|X)] plus the variance of the conditional expectation Var(E[Y|X])",
          "The sum of the marginal variances Var(X) + Var(Y)",
          "The square of the covariance Cov(X, Y)^2 plus the correlation coefficient",
          "The mean of X multiplied by the variance of Y"
        ],
        "a": 0,
        "why": "Eve's Law states Var(Y) = E[Var(Y|X)] + Var(E[Y|X]), decomposing overall variance into unexplained within-group dispersion and explained between-group variation."
      },
      {
        "q": "Under a bivariate normal distribution, how does the conditional variance Var(Y | X=x) compare to the marginal variance Var(Y)?",
        "o": [
          "It shrinks by a factor of (1 - rho^2), reflecting reduced uncertainty due to the correlation rho with X",
          "It is always strictly larger than Var(Y)",
          "It changes depending on the specific numeric value of x",
          "It is always identically equal to zero"
        ],
        "a": 0,
        "why": "For bivariate Gaussians, Var(Y | X=x) = sigma_Y^2 * (1 - rho^2). Unless rho=0, observing X strictly reduces uncertainty about Y, independent of the value of x."
      }
    ],
    usedBy: [],
    prereq: [
      "probability-rules-and-bayes-theorem",
      "random-variables-and-distributions"
    ],
    related: [
      "probability-rules-and-bayes-theorem",
      "expectation-variance-and-covariance",
      "bayesian_linear_regression"
    ],
    keywords: "joint distribution marginal distribution conditional distribution bayes law of total expectation eves law bivariate normal covariance"
  },
  {
    id: "map-and-bayesian-estimation",
    short: "MAP & Bayesian Estimation",
    title: "MAP and Bayesian estimation",
    task: "concepts",
    module: "Estimation",
    level: 2,
    minutes: 20,
    noLab: true,
    summary: "Maximum A Posteriori (MAP) and full Bayesian estimation extend classical point estimation by incorporating prior probability distributions over model parameters. While Maximum Likelihood Estimation (MLE) seeks parameters that maximise data likelihood alone, MAP identifies the single mode of the posterior distribution, functioning as a Bayesian bridge to penalised regularisation (such as L2 ridge and L1 lasso). Full Bayesian estimation rejects single point estimates entirely, retaining the complete posterior probability distribution p(\\theta | D) to compute posterior predictive distributions with principled parameter uncertainty.",
    lead: "What happens when you flip a coin 3 times and get 3 heads? Maximum Likelihood Estimation insists the coin has a 100% chance of landing heads on every flip. Intuitively, we know coins are usually fair; our prior belief anchors our judgment against extreme conclusions from small samples. How do we formalise prior domain knowledge into statistical estimators, and what is the crucial distinction between choosing a single \"best\" parameter (MAP) versus maintaining a full distribution over all possible parameters (Bayesian estimation)?",
    intuition: [
      "MLE vs MAP vs Full Bayes:\n- Maximum Likelihood Estimation (MLE): Seeks argmax_theta p(D | theta). It considers only the observed dataset. On small or sparse samples, it severely overfits, placing zero probability on unobserved events.\n- Maximum A Posteriori (MAP): Seeks argmax_theta p(theta | D) = argmax_theta [p(D | theta) p(theta)]. It combines data evidence with a prior belief distribution, yielding a single optimal point estimate (the posterior mode).\n- Full Bayesian Estimation: Rejects single point estimates entirely. It maintains the entire posterior distribution p(theta | D). When predicting a new outcome y*, it integrates over all possible values of theta, weighted by their posterior credibility.",
      "The Secret Identity of Regularisation: In machine learning, L2 weight decay (Ridge regression) and L1 penalty (Lasso regression) are often presented as heuristic loss penalties. In reality, MAP estimation reveals their true origin: an L2 penalty is mathematically identical to assuming an independent zero-mean Gaussian prior on weights, while an L1 penalty is identical to assuming a Laplacian prior. Regularisation is literally MAP estimation in disguise!",
      "Epistemic vs Aleatoric Uncertainty: Point estimators (both MLE and MAP) cannot express epistemic uncertainty (uncertainty stemming from lack of training data). Full Bayesian estimation explicitly tracks epistemic uncertainty: when data is scarce, the posterior distribution is wide, yielding broad prediction intervals that widen safely in uncharted feature space."
    ],
    analogy: "Imagine a jury deliberating on a criminal trial. An MLE juror considers only the physical evidence presented in the courtroom, ignoring whether the defendant has a pristine record or a history of identical crimes. A MAP juror combines the evidence with their background knowledge of human behaviour to pick the single verdict they feel is most probable. A full Bayesian deliberation does not pick a single juror's hunch; it polls all possible interpretations, weighting every plausible scenario by how well it fits both the evidence and prior reality to arrive at a calibrated distribution of reasonable doubt.",
    steps: [
      {
        "title": "Define parametric likelihood function",
        "desc": "Specify the probability distribution of observing data given parameters p(D | theta).",
        "detail": "Formulate the generative likelihood model (e.g. Binomial for binary trials, Gaussian for continuous regression targets). Compute the log-likelihood function."
      },
      {
        "title": "Specify prior probability distribution",
        "desc": "Select a prior p(theta) reflecting prior knowledge or regularisation constraints.",
        "detail": "Choose an uninformative prior, an empirical domain prior, or a conjugate prior (such as Beta for Binomial, or Normal-Inverse-Gamma for Linear Regression) to enable analytical tractability."
      },
      {
        "title": "Compute unnormalised posterior distribution",
        "desc": "Multiply likelihood by prior according to Bayes' rule: p(theta | D) proportional to p(D | theta) * p(theta).",
        "detail": "Work in log-space: log p(theta | D) = log p(D | theta) + log p(theta) + constant. Identify the functional form of the posterior distribution."
      },
      {
        "title": "Derive the MAP point estimate",
        "desc": "Maximise the log-posterior with respect to model parameters.",
        "detail": "Set gradient nabla_theta [log p(D | theta) + log p(theta)] = 0. Solve analytically or via numerical gradient ascent to obtain theta_MAP."
      },
      {
        "title": "Compute full Bayesian posterior predictive distribution",
        "desc": "Integrate likelihood predictions over the entire posterior parameter distribution.",
        "detail": "Evaluate p(y* | D) = int p(y* | theta) p(theta | D) d theta. Extract credible intervals to quantify parameter and observation uncertainty simultaneously."
      }
    ],
    math: [
      {
        "h": "MAP Objective and Log-Posterior Formulation",
        "tex": "\\hat{\\theta}_{\\text{MAP}} = \\arg\\max_\\theta \\left\\{ \\sum_{i=1}^N \\log p(x_i \\mid \\theta) + \\log p(\\theta) \\right\\} = \\arg\\min_\\theta \\Big\\{ \\text{NLL}(\\theta) - \\log p(\\theta) \\Big\\}",
        "p": "MAP estimation maximises the joint probability of data and parameters. Minimising negative log-likelihood with a negative log-prior penalty demonstrates the direct equivalence between MAP estimation and regularised loss minimisation."
      },
      {
        "h": "MAP Equivalence to L2 Regularisation (Gaussian Prior)",
        "tex": "\\theta_j \\sim \\mathcal{N}(0, \\sigma_0^2) \\implies \\log p(\\theta) = -\\frac{\\|\\theta\\|_2^2}{2\\sigma_0^2} - C \\implies \\mathcal{L}_{\\text{MAP}}(\\theta) = \\text{NLL}(\\theta) + \\frac{\\lambda}{2} \\|\\theta\\|_2^2, \\quad \\lambda = \\frac{1}{\\sigma_0^2}",
        "p": "Assuming an independent zero-mean normal prior over model parameters produces a quadratic penalty identical to Ridge regression (L2 weight decay). Smaller prior variance \\sigma_0^2 corresponds to stronger regularisation hyperparameter \\lambda."
      },
      {
        "h": "Posterior Predictive Distribution (Full Bayesian)",
        "tex": "p(y^* \\mid \\mathcal{D}) = \\int_\\Theta p(y^* \\mid \\theta) \\, p(\\theta \\mid \\mathcal{D}) \\, d\\theta, \\qquad \\text{where } p(\\theta \\mid \\mathcal{D}) = \\frac{p(\\mathcal{D} \\mid \\theta) p(\\theta)}{\\int_\\Theta p(\\mathcal{D} \\mid \\theta') p(\\theta') \\, d\\theta'}",
        "p": "Instead of committing to a single point estimate \\hat{\\theta}, full Bayesian inference integrates across all parameter possibilities. The marginalisation accounts for parameter uncertainty, avoiding overconfident predictions in regions with sparse data."
      }
    ],
    code: "\"\"\"\nComparison of Maximum Likelihood (MLE), Maximum A Posteriori (MAP),\nand Full Bayesian Estimation on a Small Bernoulli Sample.\n\"\"\"\n\nimport numpy as np\n\n# Scenario: We flip a coin N=5 times and observe k=4 heads.\n# We want to estimate theta (probability of heads).\nN = 5\nk = 4  # 4 heads out of 5 flips\n\n# 1. Maximum Likelihood Estimation (MLE)\n# theta_MLE = k / N\ntheta_mle = k / N\n\n# 2. Maximum A Posteriori (MAP) Estimation with Beta(alpha, beta) Prior\n# Suppose our prior belief is centered at a fair coin: Beta(alpha=3, beta=3)\n# (equivalent to having seen 2 virtual heads and 2 virtual tails prior to the experiment)\nalpha_prior = 3.0\nbeta_prior = 3.0\n\n# Posterior is Beta(alpha + k, beta + N - k)\nalpha_post = alpha_prior + k\nbeta_post = beta_prior + (N - k)\n\n# Mode of Beta(a, b) for a, b > 1 is (a - 1) / (a + b - 2)\ntheta_map = (alpha_post - 1) / (alpha_post + beta_post - 2)\n\n# 3. Full Bayesian Estimation (Posterior Mean and Credible Interval)\n# Posterior Mean E[theta | D] = a / (a + b)\ntheta_bayes_mean = alpha_post / (alpha_post + beta_post)\n\n# 4. Posterior Predictive Distribution for next flip being Heads\n# P(Y* = 1 | D) = int theta * p(theta | D) d theta = E[theta | D]\np_next_heads_mle = theta_mle\np_next_heads_map = theta_map\np_next_heads_bayes = theta_bayes_mean\n\nprint(f\"=== Experiment: {k} Heads in {N} Flips ===\")\nprint(f\"MLE Estimate:            theta = {theta_mle:.3f} (80% heads)\")\nprint(f\"Prior:                   Beta(alpha={alpha_prior}, beta={beta_prior}) -> Prior Mode = 0.500\")\nprint(f\"Posterior Distribution:  Beta(alpha={alpha_post:.1f}, beta={beta_post:.1f})\")\nprint(f\"MAP Estimate (Mode):     theta = {theta_map:.3f} (shrunk toward prior)\")\nprint(f\"Bayes Posterior Mean:    theta = {theta_bayes_mean:.3f}\")\n\n# Numerical evaluation of 95% Equal-Tailed Credible Interval\n# Discretise theta in [0, 1] to calculate exact CDF\nthetas = np.linspace(0.001, 0.999, 10000)\n# Unnormalised Beta PDF: theta^(a-1) * (1-theta)^(b-1)\nlog_pdf = (alpha_post - 1) * np.log(thetas) + (beta_post - 1) * np.log(1 - thetas)\npdf = np.exp(log_pdf - np.max(log_pdf))\npdf /= np.trapz(pdf, thetas)\ncdf = np.cumsum(pdf) * (thetas[1] - thetas[0])\n\nci_lower = thetas[np.searchsorted(cdf, 0.025)]\nci_upper = thetas[np.searchsorted(cdf, 0.975)]\n\nprint(f\"\\n95% Bayesian Credible Interval: [{ci_lower:.3f}, {ci_upper:.3f}]\")\nprint(f\"Predictive Probability for Next Flip Heads:\")\nprint(f\"  Under MLE:        {p_next_heads_mle:.3f}\")\nprint(f\"  Under Full Bayes: {p_next_heads_bayes:.3f} (accounts for small sample size)\")\n",
    keyPoints: [
      "MLE finds the parameter value that maximises data likelihood alone, which overfits severely on small samples.",
      "MAP incorporates a prior distribution, finding the posterior mode; it is mathematically equivalent to penalised regularisation (L2 = Gaussian prior, L1 = Laplace prior).",
      "Full Bayesian estimation avoids single point estimates, maintaining the full posterior distribution and integrating over parameter uncertainty for predictions.",
      "As sample size N approaches infinity, the data likelihood dominates the prior, causing MLE, MAP, and Bayesian posterior mean to converge to the same value."
    ],
    pitfalls: [
      "Treating the MAP estimate as a full Bayesian solution: MAP is still a point estimate that discards parameter uncertainty and variance.",
      "Using improper priors with MAP without verifying posterior propriety: Maximising an unnormalised objective with ill-defined priors can yield divergent solutions.",
      "Assuming priors are purely subjective: Priors can represent empirical historical data, physical constraints (e.g. non-negative mass), or regularisation inductors."
    ],
    quiz: [
      {
        "q": "What machine learning regularisation technique is mathematically equivalent to MAP estimation with a zero-mean Gaussian prior?",
        "o": [
          "L2 regularisation (Ridge regression / weight decay)",
          "L1 regularisation (Lasso regression)",
          "Dropout regularisation",
          "Early stopping"
        ],
        "a": 0,
        "why": "The negative log-probability of a Gaussian prior is proportional to the squared Euclidean norm ||theta||_2^2, which corresponds directly to an L2 Ridge penalty."
      },
      {
        "q": "Why does full Bayesian estimation produce superior predictive uncertainty compared to MAP estimation?",
        "o": [
          "Because full Bayesian prediction integrates over the entire posterior parameter distribution p(theta | D), whereas MAP reduces the posterior to a single point estimate (the mode)",
          "Because Bayesian estimation never uses Bayes' theorem",
          "Because MAP requires GPU matrix multiplication whereas Bayes runs on CPU",
          "Because full Bayesian models have zero parameters"
        ],
        "a": 0,
        "why": "MAP commits to a single parameter vector, ignoring how wide or flat the posterior surface is. Full Bayesian inference marginalises over all plausible parameters, preserving epistemic uncertainty in predictions."
      },
      {
        "q": "As sample size N grows toward infinity, what happens to the relationship between MLE and MAP estimates?",
        "o": [
          "The likelihood grows proportionally with N while the prior remains constant, causing the MAP estimate to converge asymptotically to the MLE estimate",
          "The prior overpowers the likelihood and forces the estimate to the prior mean",
          "The MAP estimate diverges to infinity",
          "The difference between them becomes permanently fixed at 1.0"
        ],
        "a": 0,
        "why": "Data evidence scales with N. For large datasets, the likelihood dominates the prior term in log-space, making MAP and MLE numerically identical in the large-sample limit."
      }
    ],
    usedBy: [],
    prereq: [
      "maximum-likelihood-estimation",
      "conjugate-priors-beta-binomial"
    ],
    related: [
      "maximum-likelihood-estimation",
      "conjugate-priors-beta-binomial",
      "ridge_regression",
      "bayesian_linear_regression"
    ],
    keywords: "map estimation maximum a posteriori bayesian estimation prior posterior predictive ridge lasso regularisation conjugate prior"
  },
  {
    id: "estimator-properties-bias-consistency-cramer-rao-bound",
    short: "Estimator Properties",
    title: "Estimator properties: bias, consistency, Cramér–Rao bound",
    task: "concepts",
    module: "Estimation",
    level: 2,
    minutes: 20,
    noLab: true,
    summary: "Statistical estimation evaluates how empirical sample statistics infer unknown true population parameters. The four fundamental criteria of estimator quality are Bias (systematic deviation from the true parameter), Consistency (convergence in probability to the truth as sample size approaches infinity), Efficiency (achieving the lowest possible variance among unbiased estimators), and Sufficiency. The Cramér–Rao Lower Bound (CRLB) establishes the theoretical lower limit on estimator variance, governed by the inverse of the Fisher Information matrix I(\\theta)^{-1}.",
    lead: "When estimating the variance of a population from n sample points, why do statisticians divide the sum of squared deviations by n-1 instead of n? Why does an estimator that works well on 50 samples fail to converge as you gather 50,000 samples? Evaluating estimators requires a rigorous mathematical vocabulary: bias, consistency, efficiency, and asymptotic normality. The Cramér–Rao inequality sets the ultimate speed limit: no matter how clever your estimator is, its precision is physically bounded by the information contained in the data.",
    intuition: [
      "Bias vs Consistency:\n- Bias is a finite-sample property: across repeated hypothetical experiments of fixed size n, does your estimator hit the bullseye on average? Bias(theta_hat) = E[theta_hat] - theta.\n- Consistency is an asymptotic property: as sample size n approaches infinity, does the distribution of theta_hat collapse to a single point mass on the exact true value? plim_{n -> inf} theta_hat = theta.\n- An estimator can be biased in finite samples but completely consistent. A famous example is the maximum likelihood estimator for sample variance: S_n^2 = (1/n) sum (x_i - x_bar)^2. It is biased by a factor of (n-1)/n, but as n -> inf, (n-1)/n -> 1, making it fully consistent.",
      "Efficiency and the Cramér–Rao Bound: If two candidate estimators are both unbiased, which one should you choose? The one with smaller variance. But can variance be made arbitrarily small? No! The Cramér–Rao Lower Bound (CRLB) proves that for any unbiased estimator, Var(theta_hat) >= 1 / I_n(theta), where I_n(theta) is Fisher Information. An estimator that achieves this theoretical minimum variance is called an efficient estimator or Minimum Variance Unbiased Estimator (MVUE).",
      "The Bias-Variance Trade-off in Estimation: An unbiased estimator is not always the best choice. In many practical settings, introducing a small amount of bias (e.g. Ridge shrinkage, empirical Bayes shrinkage) reduces variance so dramatically that the total Mean Squared Error (MSE = Bias^2 + Variance) is substantially smaller than any unbiased estimator."
    ],
    analogy: "Think of an archer shooting arrows at a target. Bias is how far the centre of the arrow cluster is from the bullseye. Variance is the scatter or spread of the arrows. Consistency means as the archer takes more and more shots, the cluster tightens infinitesimally toward the exact centre. The Cramér–Rao bound is the atmospheric wind limit: physics dictates that even a perfect robotic archer cannot cluster tighter than the fundamental aerodynamic turbulence of the arrows.",
    steps: [
      {
        "title": "Define the estimator as a function of random samples",
        "desc": "Express theta_hat = g(X_1, ..., X_n) as a formal random variable.",
        "detail": "Determine the functional mapping from sample observations to parameter space. Characterise its sampling distribution under repeated draws."
      },
      {
        "title": "Evaluate expectation and calculate bias",
        "desc": "Compute E[theta_hat] and check if it equals the true parameter theta.",
        "detail": "Calculate Bias(theta_hat) = E[theta_hat] - theta. If bias is identically zero for all sample sizes n, the estimator is strictly unbiased."
      },
      {
        "title": "Verify consistency as sample size approaches infinity",
        "desc": "Demonstrate convergence in probability to the true parameter theta.",
        "detail": "Check whether lim_{n -> inf} Bias(theta_hat_n) = 0 and lim_{n -> inf} Var(theta_hat_n) = 0. If Mean Squared Error vanishes asymptotically, consistency is guaranteed by Chebyshev's inequality."
      },
      {
        "title": "Compute Fisher Information matrix",
        "desc": "Evaluate the expected curvature of the log-likelihood function.",
        "detail": "Calculate I_n(theta) = -n * E[d^2/d theta^2 log f(X; theta)]. Fisher Information quantifies the amount of statistical information sample data carries about the unknown parameter."
      },
      {
        "title": "Evaluate efficiency against the Cramér–Rao Lower Bound",
        "desc": "Compare the variance of theta_hat against the theoretical bound 1 / I_n(theta).",
        "detail": "Compute efficiency ratio e(theta_hat) = [1 / I_n(theta)] / Var(theta_hat). If the ratio equals 1.0, the estimator is efficient and achieves the CRLB."
      }
    ],
    math: [
      {
        "h": "Bias, Variance, and Mean Squared Error Decomposition",
        "tex": "\\text{Bias}(\\hat{\\theta}) = \\mathbb{E}[\\hat{\\theta}] - \\theta, \\qquad \\text{MSE}(\\hat{\\theta}) = \\mathbb{E}\\left[(\\hat{\\theta} - \\theta)^2\\right] = \\text{Var}(\\hat{\\theta}) + \\left[\\text{Bias}(\\hat{\\theta})\\right]^2",
        "p": "Mean Squared Error decomposes cleanly into variance (precision of the estimator across repeated samples) plus squared bias (systematic error). An estimator that sacrifices unbiasedness can achieve lower total MSE if the variance reduction outweighs the squared bias penalty."
      },
      {
        "h": "Fisher Information Formulation",
        "tex": "\\mathcal{I}_n(\\theta) = n \\, \\mathbb{E}\\left[ \\left(\\frac{\\partial \\log f(X; \\theta)}{\\partial \\theta}\\right)^2 \\right] = -n \\, \\mathbb{E}\\left[ \\frac{\\partial^2 \\log f(X; \\theta)}{\\partial \\theta^2} \\right]",
        "p": "Fisher Information measures the expected curvature (Hessian) of the log-likelihood function. If the log-likelihood is sharply curved around the true parameter, small deviations in parameter space cause steep drops in likelihood, meaning observations carry high information about \\theta."
      },
      {
        "h": "The Cramér–Rao Lower Bound (CRLB)",
        "tex": "\\text{Var}(\\hat{\\theta}) \\ge \\frac{\\left(1 + b'(\\theta)\\right)^2}{\\mathcal{I}_n(\\theta)}, \\qquad \\text{For unbiased estimators } (b(\\theta) = 0): \\; \\text{Var}(\\hat{\\theta}) \\ge \\frac{1}{\\mathcal{I}_n(\\theta)}",
        "p": "The Cramér–Rao inequality sets a fundamental lower bound on the variance of any estimator. For unbiased estimators, no valid statistical procedure can produce a variance smaller than the reciprocal of Fisher Information. Maximum likelihood estimators achieve the CRLB asymptotically as n \\to \\infty."
      }
    ],
    code: "\"\"\"\nEstimator Properties Simulation\nDemonstrating finite-sample bias of sample variance, asymptotic consistency,\nand Fisher Information vs Cramér-Rao Lower Bound for Poisson data.\n\"\"\"\n\nimport numpy as np\n\n# 1. Finite-Sample Bias of Variance Estimator (Bessel's Correction)\n# Compare S_biased (1/n) vs S_unbiased (1/(n-1)) across 20,000 Monte Carlo trials\ntrue_sigma2 = 25.0  # True variance\ntrue_mu = 100.0\nsample_size = 5     # Small sample size where bias is pronounced\nnum_simulations = 20000\n\nnp.random.seed(42)\nsamples = np.random.normal(loc=true_mu, scale=np.sqrt(true_sigma2), size=(num_simulations, sample_size))\n\n# Sample variance with denominator n (MLE formula)\ns2_mle = np.var(samples, axis=1, ddof=0)\n# Sample variance with denominator n - 1 (Unbiased formula)\ns2_unbiased = np.var(samples, axis=1, ddof=1)\n\nmean_s2_mle = np.mean(s2_mle)\nmean_s2_unbiased = np.mean(s2_unbiased)\n\ntheoretical_mle_bias = -true_sigma2 / sample_size\nempirical_mle_bias = mean_s2_mle - true_sigma2\n\nprint(f\"=== 1. Sample Variance Bias (n = {sample_size}, True Variance = {true_sigma2}) ===\")\nprint(f\"Mean MLE Estimator (ddof=0):     {mean_s2_mle:.3f} (Biased: underestimates variance)\")\nprint(f\"Empirical MLE Bias:              {empirical_mle_bias:.3f} | Theoretical Bias: {theoretical_mle_bias:.3f}\")\nprint(f\"Mean Unbiased Estimator (ddof=1):{mean_s2_unbiased:.3f} (Unbiased!)\")\n\n# 2. Asymptotic Consistency Demonstration\n# Show that as n increases, the bias and variance of the MLE estimator vanish toward 0\nsample_sizes = [5, 20, 100, 1000]\nprint(\"\\n=== 2. Consistency: Asymptotic Behaviour as n -> Infinity ===\")\nfor n in sample_sizes:\n    s = np.random.normal(loc=true_mu, scale=np.sqrt(true_sigma2), size=(5000, n))\n    v = np.var(s, axis=1, ddof=0)\n    bias = np.mean(v) - true_sigma2\n    mse = np.mean((v - true_sigma2)**2)\n    print(f\"  n = {n:4d} | Bias: {bias:7.3f} | Variance: {np.var(v):7.3f} | MSE: {mse:7.3f}\")\n\n# 3. Fisher Information and Cramér-Rao Lower Bound for Poisson(lambda)\n# For Poisson(lambda), f(x) = exp(-lambda) * lambda^x / x!\n# Log-likelihood: -lambda + x*log(lambda) - log(x!)\n# d/d_lambda = -1 + x/lambda, d^2/d_lambda^2 = -x / lambda^2\n# I_n(lambda) = -n * E[-X / lambda^2] = n * lambda / lambda^2 = n / lambda\n# CRLB = 1 / I_n(lambda) = lambda / n\ntrue_lambda = 4.0\nn_poisson = 15\ncrlb = true_lambda / n_poisson\n\n# The sample mean X_bar is an unbiased estimator for lambda:\npoisson_samples = np.random.poisson(lam=true_lambda, size=(50000, n_poisson))\nsample_means = np.mean(poisson_samples, axis=1)\n\nempirical_var_mean = np.var(sample_means)\nefficiency = crlb / empirical_var_mean\n\nprint(f\"\\n=== 3. Fisher Information & Cramér-Rao Lower Bound (Poisson lambda={true_lambda}, n={n_poisson}) ===\")\nprint(f\"Fisher Information I_n(lambda): {n_poisson / true_lambda:.3f}\")\nprint(f\"Theoretical CRLB Lower Bound:   {crlb:.5f}\")\nprint(f\"Empirical Var(X_bar):           {empirical_var_mean:.5f}\")\nprint(f\"Estimator Efficiency:           {efficiency:.3f} (1.0 = reaches CRLB speed limit exactly!)\")\n",
    keyPoints: [
      "Bias measures systematic error in finite samples: E[theta_hat] - theta.",
      "Consistency measures asymptotic convergence in probability to the truth: as sample size grows, the estimator converges to the true parameter.",
      "Fisher Information measures the log-likelihood curvature; higher curvature means samples carry greater parameter precision.",
      "The Cramér–Rao Lower Bound defines the mathematical minimum achievable variance for any unbiased estimator: Var(theta_hat) >= 1 / I_n(theta)."
    ],
    pitfalls: [
      "Assuming an unbiased estimator is always superior to a biased one: Biased estimators (like Ridge regression) often achieve lower total Mean Squared Error by dramatically reducing variance.",
      "Confusing unbiasedness with consistency: An estimator can be unbiased yet inconsistent (e.g. taking only the very first sample X_1 regardless of total sample size n).",
      "Applying the standard CRLB to biased estimators without adjustment: If an estimator has non-zero bias b(theta), the lower bound is scaled by [1 + b'(theta)]^2."
    ],
    quiz: [
      {
        "q": "Why does Bessel's correction divide by n-1 instead of n in sample variance calculation?",
        "o": [
          "Because deviations are measured from the sample mean rather than the true population mean, which absorbs one degree of freedom and causes division by n to systematically underestimate population variance by a factor of (n-1)/n",
          "Because sample variance is an exponential distribution",
          "Because computers cannot divide by even numbers",
          "To make the variance equal to the standard deviation"
        ],
        "a": 0,
        "why": "Using the sample mean x_bar instead of true mean mu minimises the sum of squared deviations around x_bar, underestimating true variance by sigma^2 / n. Dividing by n-1 restores exact unbiasedness."
      },
      {
        "q": "What does the Cramér–Rao Lower Bound (CRLB) establish for an unbiased estimator?",
        "o": [
          "The theoretical minimum variance that any unbiased estimator can possibly achieve, equal to the reciprocal of the Fisher Information 1 / I_n(theta)",
          "The maximum number of features allowed in a regression model",
          "The probability that a hypothesis test makes a Type I error",
          "The maximum execution time of a gradient descent algorithm"
        ],
        "a": 0,
        "why": "The CRLB sets a strict mathematical lower limit on variance. An unbiased estimator that attains this bound cannot be improved in terms of variance and is termed efficient."
      },
      {
        "q": "Can an estimator be biased yet consistent?",
        "o": [
          "Yes: an estimator can have non-zero bias for small sample sizes n, provided that its bias and variance both shrink to zero as n approaches infinity",
          "No: any estimator with bias is permanently barred from being consistent",
          "Only when the data follows a uniform distribution",
          "Only if the Fisher Information is negative"
        ],
        "a": 0,
        "why": "Consistency requires plim theta_hat = theta as n -> inf. Many maximum likelihood estimators (such as MLE sample variance) have finite-sample bias of order O(1/n), which vanishes asymptotically."
      }
    ],
    usedBy: [],
    prereq: [
      "sampling-and-standard-error",
      "maximum-likelihood-estimation"
    ],
    related: [
      "sampling-and-standard-error",
      "bias-variance-tradeoff",
      "maximum-likelihood-estimation",
      "ols-inference-t-tests-f-test-r2-and-adjusted-r2"
    ],
    keywords: "estimator properties bias consistency efficiency cramer rao lower bound crlb fisher information mvue asymptotic variance"
  },
  {
    id: 'anova-and-post-hoc-tests',
    short: 'ANOVA and Post-Hoc Tests',
    title: r`ANOVA and Post-Hoc Tests`,
    task: 'concepts',
    module: 'Hypothesis testing',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Compare means across three or more groups simultaneously with the F-test, and pinpoint specific differences using Tukey's HSD post-hoc procedure.`,
    lead: r`Running repeated pair-wise t-tests across multiple groups rapidly inflates the false alarm rate to unacceptable levels. Analysis of Variance (ANOVA) solves this multi-group dilemma with a single omnibus F-test that partitions total variability into between-group signal and within-group noise. When the omnibus test reveals significant variance, post-hoc procedures like Tukey's Honest Significant Difference (HSD) safely isolate which specific pairs differ.`,
    intuition: [
      r`Imagine an e-commerce platform testing three landing page layouts: A, B, and C. They recruit 30 users per layout (90 users total) and measure session duration in seconds. Average engagement is 45.2 seconds for Layout A, 49.1 seconds for Layout B, and 54.0 seconds for Layout C.`,
      r`A novice analyst might test Layout A vs B, A vs C, and B vs C with three separate two-sample $t$-tests. However, conducting three independent tests at a 5% false positive threshold gives a combined risk of at least one false alarm of $1 - (1 - 0.05)^3 \approx 14.3\%$. With 10 groups, there are 45 pairwise comparisons, pushing the chance of at least one false discovery over 90%!`,
      r`ANOVA prevents this multiplicity trap by evaluating all groups at once. It asks a single question: is the variance between group averages substantially larger than the natural random variance among users within each group? For our landing page data, the ratio of between-group variance to within-group variance produces an $F$-statistic of 10.18, with an omnibus p-value of $0.0001$. This establishes that the layouts do not perform identically. Next, Tukey's HSD examines the pairs with family-wise error protection: it reveals that Layout C significantly outperforms Layout A ($p < 0.0001$) and Layout B ($p = 0.0399$), while Layouts A and B do not significantly differ from each other ($p = 0.1114$).`,
    ],
    analogy: r`ANOVA is like a stadium metal detector that first checks whether anyone in a crowd is carrying metal; only when the master alarm rings do guards search individuals one by one.`,
    steps: [
      r`Define the omnibus hypotheses: $H_0: \mu_1 = \mu_2 = \dots = \mu_K$ versus $H_1$: at least one group mean differs.`,
      r`Verify ANOVA assumptions: independent observations, approximately normal distributions within each group, and homogeneity of variances (homoscedasticity).`,
      r`Calculate the sum of squares between groups ($SS_B$) and sum of squares within groups ($SS_W$).`,
      r`Divide each sum of squares by its respective degrees of freedom to obtain Mean Square Between ($MS_B$) and Mean Square Within ($MS_W$).`,
      r`Compute the variance ratio $F = MS_B / MS_W$ and obtain the omnibus p-value from the $F(K-1, N-K)$ distribution.`,
      r`If the omnibus test rejects $H_0$, run Tukey's HSD to identify which pairwise differences are statistically significant while preserving family-wise error control.`,
    ],
    math: [
      {
        h: 'Total Variance Partitioning',
        tex: r`$$SS_T = SS_B + SS_W \implies \sum_{i=1}^K \sum_{j=1}^{n_i} (X_{ij} - \bar{X}_{\cdot\cdot})^2 = \sum_{i=1}^K n_i (\bar{X}_{i\cdot} - \bar{X}_{\cdot\cdot})^2 + \sum_{i=1}^K \sum_{j=1}^{n_i} (X_{ij} - \bar{X}_{i\cdot})^2$$`,
        p: r`Here $X_{ij}$ is observation $j$ in group $i$, $\bar{X}_{i\cdot}$ is the sample mean of group $i$, $\bar{X}_{\cdot\cdot}$ is the grand mean across all observations, and $n_i$ is group size. The total sum of squares $SS_T$ splits cleanly into between-group explained variation $SS_B$ and within-group residual variation $SS_W$.`,
      },
      {
        h: 'The ANOVA F-Statistic',
        tex: r`$$F = \frac{MS_B}{MS_W} = \frac{SS_B / (K - 1)}{SS_W / (N - K)} \sim F(K - 1, \, N - K)$$`,
        p: r`Mean squares divide sums of squares by their degrees of freedom: $K - 1$ for groups and $N - K$ for residuals. Under the null hypothesis of equal means, both $MS_B$ and $MS_W$ provide independent, unbiased estimates of the common population variance $\sigma^2$, yielding $F \approx 1$. When true differences exist between group means, $MS_B$ inflates, pushing $F \gg 1$.`,
      },
      {
        h: 'Tukey\'s Honest Significant Difference (HSD)',
        tex: r`$$q = \frac{\bar{X}_i - \bar{X}_j}{\sqrt{MS_W / n}} \sim q(K, \, N - K) \implies \text{HSD} = q_{\alpha, K, N-K} \sqrt{\frac{MS_W}{n}}$$`,
        p: r`Tukey's post-hoc procedure evaluates studentised range statistics $q$ across all group pairs. Comparing mean differences against the critical HSD threshold guarantees that the family-wise error rate across all $K(K-1)/2$ pairwise comparisons is strictly capped at $\alpha$.`,
      },
    ],
    keyPoints: [
      r`ANOVA prevents multiple-testing error inflation by evaluating group differences in a single omnibus test.`,
      r`Rejecting the null hypothesis in ANOVA indicates that at least one group mean differs, but does not identify which specific groups drive the difference.`,
      r`Tukey's HSD controls the family-wise error rate across all pairwise contrasts while providing greater statistical power than Bonferroni correction.`,
      r`When group variances are substantially unequal, standard ANOVA breaks down; Welch's ANOVA should be used instead.`,
    ],
    pitfalls: [
      r`Conducting multiple independent two-sample $t$-tests instead of ANOVA, drastically inflating false discovery rates.`,
      r`Running post-hoc pairwise comparisons after a non-significant omnibus ANOVA $F$-test (data dredging).`,
      r`Ignoring severe heteroscedasticity: when group sample sizes are unequal and variances differ, standard ANOVA false positive rates become untrustworthy.`,
      r`Using standard one-way ANOVA on repeated-measures data, failing to remove between-subject variance.`,
    ],
    code: r`import numpy as np
import scipy.stats as stats

rng = np.random.default_rng(42)
n = 30

# User engagement duration (seconds) across three landing page layouts
layout_a = rng.normal(loc=45.0, scale=10.0, size=n)
layout_b = rng.normal(loc=48.0, scale=10.0, size=n)
layout_c = rng.normal(loc=55.0, scale=10.0, size=n)

# 1. One-way ANOVA omnibus test
f_stat, p_anova = stats.f_oneway(layout_a, layout_b, layout_c)

# 2. Tukey's HSD post-hoc test
tukey = stats.tukey_hsd(layout_a, layout_b, layout_c)

print(f"ANOVA F-statistic: {f_stat:.3f}, p-value: {p_anova:.4e}")
print(f"Layout A mean: {np.mean(layout_a):.1f}s, B: {np.mean(layout_b):.1f}s, C: {np.mean(layout_c):.1f}s")
print(f"Tukey p-values -> A vs B: {tukey.pvalue[0, 1]:.4f}")
print(f"                 A vs C: {tukey.pvalue[0, 2]:.4e}")
print(f"                 B vs C: {tukey.pvalue[1, 2]:.4f}")`,
    quiz: [
      {
        q: r`Why is conducting multiple independent two-sample $t$-tests problematic when comparing five experimental groups?`,
        o: [
          r`Because Student's t-distribution cannot handle more than 20 observations`,
          r`Because running 10 pairwise tests compounds the probability of making at least one Type I error to over 40%`,
          r`Because two-sample t-tests cannot compute standard errors`,
          r`Because degrees of freedom become negative`,
        ],
        a: 1,
        why: r`With 5 groups there are $\binom{5}{2} = 10$ pairs. Testing each at $\alpha = 0.05$ produces an overall family-wise error rate of $1 - (1 - 0.05)^{10} \approx 40.1\%$.`,
      },
      {
        q: r`Under the null hypothesis that all group means are identical ($\mu_1 = \mu_2 = \dots = \mu_K$), what value is the ANOVA $F$-statistic expected to take on average?`,
        o: [
          r`Approximately 0`,
          r`Approximately 1`,
          r`Equal to the sample size $N$`,
          r`Equal to the number of groups $K$`,
        ],
        a: 1,
        why: r`Under $H_0$, both between-group mean square $MS_B$ and within-group mean square $MS_W$ estimate the same population variance $\sigma^2$, so their ratio $F = MS_B / MS_W \approx 1$.`,
      },
      {
        q: r`What is the primary role of a post-hoc procedure like Tukey's HSD following a significant ANOVA test?`,
        o: [
          r`To determine whether the data is normally distributed`,
          r`To identify exactly which specific pairs of group means differ while controlling the family-wise error rate`,
          r`To recalculate the degrees of freedom for the F-statistic`,
          r`To transform skewed data into Gaussian distributions`,
        ],
        a: 1,
        why: r`The omnibus ANOVA test only indicates that at least one group mean differs. Tukey's HSD isolates the specific differing pairs without inflating the false positive rate.`,
      },
      {
        q: r`An experiment compares 4 treatments with 25 participants per treatment (total $N = 100$). What are the numerator and denominator degrees of freedom for the ANOVA $F$-test?`,
        o: [
          r`3 and 96`,
          r`4 and 96`,
          r`3 and 100`,
          r`4 and 25`,
        ],
        a: 0,
        why: r`Numerator degrees of freedom are $K - 1 = 4 - 1 = 3$. Denominator degrees of freedom are $N - K = 100 - 4 = 96$.`,
      },
    ],
    usedBy: ['feature-selection', 'decision_tree_regressor'],
    prereq: ['hypothesis-testing-and-p-values', 'z-test-and-t-tests', 'type-i-ii-errors-power-and-sample-size'],
    related: ['non-parametric-tests-mann-whitney-wilcoxon-kruskal-wallis', 'multiple-testing-bonferroni-holm-benjamini-hochberg', 'confidence-intervals'],
    keywords: 'anova analysis of variance f-test f-statistic tukey hsd post-hoc between-group within-group one-way anova',
  },
  {
    id: 'non-parametric-tests-mann-whitney-wilcoxon-kruskal-wallis',
    short: 'Non-Parametric Rank Tests',
    title: r`Non-Parametric Tests: Mann–Whitney, Wilcoxon, Kruskal–Wallis`,
    task: 'concepts',
    module: 'Hypothesis testing',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Replace fragile parametric assumptions with robust rank-based inference for skewed, heavy-tailed or ordinal data.`,
    lead: r`When data violates normality through heavy skewness, severe outliers or ordinal scales, classical t-tests and ANOVA produce unreliable p-values and lose statistical power. Non-parametric rank tests discard absolute numerical values in favour of relative order, providing exact, distribution-free hypothesis tests. The Mann–Whitney U test, Wilcoxon signed-rank test, and Kruskal–Wallis H-test form the complete non-parametric counterpart to two-sample, paired, and multi-group parametric inference.`,
    intuition: [
      r`Consider measuring web service response times. Out of 35 requests, 34 complete in 40 to 90 milliseconds, but one request suffers a database lock timeout and hangs for 45,000 milliseconds (45 seconds). In a standard parametric $t$-test, this single massive outlier drastically distorts both the sample mean and the sample standard deviation, inflating the denominator and destroying our ability to detect genuine improvements in typical user experience.`,
      r`Non-parametric tests solve this by replacing raw milliseconds with ranks: the fastest request gets rank 1, the second fastest rank 2, and the 45,000 ms timeout simply receives rank 35. Whether that timeout took 200 ms or 200,000 ms, its rank is exactly 35. By working with ranks, extreme values can never pull the test statistic off course.`,
      r`If we have two independent services, the Mann–Whitney $U$ test pools all observations, ranks them from 1 to $N$, and sums the ranks for each service. If one service systematically responds faster than the other, its rank sum will be much smaller than expected by chance. Similarly, for before-and-after paired data, the Wilcoxon signed-rank test ranks the absolute differences, attaching positive or negative signs. And for three or more independent groups, the Kruskal–Wallis $H$-test generalises rank sums to evaluate whether any group dominates stochastically.`,
    ],
    analogy: r`Non-parametric tests are like ranking marathon runners by their finish place rather than their stopwatch times: a runner who stumbles and finishes an hour late does not disrupt who came first, second, and third.`,
    steps: [
      r`Inspect the measurement scale and distribution: choose rank tests when data is ordinal, heavily skewed, or contaminated with outliers that invalidate normality.`,
      r`Select the appropriate rank design: Mann–Whitney $U$ for two independent groups, Wilcoxon signed-rank for paired samples, or Kruskal–Wallis $H$ for three or more independent groups.`,
      r`Pool observations and assign ascending integer ranks from 1 to $N$, replacing ties with their average rank.`,
      r`Compute the test statistic by summing ranks per group (or summing positive and negative ranks of paired differences).`,
      r`Evaluate the p-value: using exact permutation distributions for small sample sizes, or asymptotic normal or chi-square approximations for $N > 20$.`,
      r`Interpret the test as an assessment of stochastic dominance or median shift under the assumption of similarly shaped distributions.`,
    ],
    math: [
      {
        h: 'Mann–Whitney U Statistic (Two Independent Samples)',
        tex: r`$$U_1 = R_1 - \frac{n_1(n_1 + 1)}{2}, \qquad U_2 = n_1 n_2 - U_1, \qquad U = \min(U_1, U_2)$$`,
        p: r`Here $R_1$ is the sum of ranks for group 1, and $n_1, n_2$ are sample sizes. The statistic $U_1$ directly counts the number of times an observation from group 1 is smaller than an observation from group 2. Under the null hypothesis of equal distributions, $E[U] = n_1 n_2 / 2$ and $\text{Var}(U) = n_1 n_2 (n_1 + n_2 + 1) / 12$.`,
      },
      {
        h: 'Wilcoxon Signed-Rank Statistic (Paired Samples)',
        tex: r`$$D_i = X_{1,i} - X_{2,i}, \qquad W = \min\left(\sum_{D_i > 0} \text{rank}(|D_i|), \, \sum_{D_i < 0} \text{rank}(|D_i|)\right)$$`,
        p: r`For paired observations, non-zero differences $D_i$ are ranked by absolute magnitude $|D_i|$. Ranks for positive differences and negative differences are summed separately. Under the null hypothesis of symmetric, zero-median differences, positive and negative rank sums are balanced with expectation $E[W] = n(n + 1) / 4$.`,
      },
      {
        h: 'Kruskal–Wallis H-Statistic (K Independent Groups)',
        tex: r`$$H = \frac{12}{N(N + 1)} \sum_{k=1}^K \frac{R_k^2}{n_k} - 3(N + 1) \sim \chi^2(K - 1)$$`,
        p: r`Here $N = \sum n_k$ is the total pooled sample size, and $R_k$ is the rank sum of the $k$-th group. The statistic $H$ measures how far average group ranks deviate from the overall expected average rank $(N + 1) / 2$. Under $H_0$, $H$ converges asymptotically to a chi-square distribution with $K - 1$ degrees of freedom.`,
      },
    ],
    keyPoints: [
      r`Non-parametric tests do not assume Gaussian distributions; they operate on ranks, making them invariant to monotonic transformations.`,
      r`The Mann–Whitney U test tests whether one distribution stochastically dominates another ($P(X > Y) \ne 0.5$); it is only a test of medians if distributions share identical shape and spread.`,
      r`The asymptotic relative efficiency of the Mann–Whitney test compared to Student's t-test is 95.5% on perfect Gaussian data, and can be substantially higher on heavy-tailed distributions.`,
      r`When sample sizes are small ($n < 20$), exact permutation p-values should be computed rather than normal approximations.`,
    ],
    pitfalls: [
      r`Claiming a significant Mann–Whitney U test proves a difference in medians when group variances or distributional shapes differ substantially.`,
      r`Discarding zero differences in the Wilcoxon signed-rank test without realising it reduces effective sample size and can induce bias.`,
      r`Using parametric tests on ordinal survey ratings (e.g. Likert 1–5 scales) where spacing between numbers is not metric or uniform.`,
      r`Forgetting that non-parametric tests still require independent and identically distributed observations within groups.`,
    ],
    code: r`import numpy as np
import scipy.stats as stats

rng = np.random.default_rng(42)
n = 35

# Skewed latency distributions for two services (exponential)
service_a = rng.exponential(scale=150.0, size=n)
service_b = rng.exponential(scale=80.0, size=n)

# 1. Mann-Whitney U test (two independent samples)
u_stat, p_mann = stats.mannwhitneyu(service_b, service_a, alternative='less')

# 2. Wilcoxon signed-rank test (paired benchmark on same 35 workload queries)
latency_before = rng.exponential(scale=120.0, size=n)
latency_after = latency_before * rng.uniform(0.70, 0.95, size=n)
w_stat, p_wilc = stats.wilcoxon(latency_after, latency_before, alternative='less')

# 3. Kruskal-Wallis H-test (three independent groups)
service_c = rng.exponential(scale=200.0, size=n)
h_stat, p_kruskal = stats.kruskal(service_a, service_b, service_c)

print(f"Mann-Whitney U: stat={u_stat:.1f}, p={p_mann:.4f}")
print(f"Wilcoxon signed-rank: stat={w_stat:.1f}, p={p_wilc:.4e}")
print(f"Kruskal-Wallis H: stat={h_stat:.3f}, p={p_kruskal:.4e}")`,
    quiz: [
      {
        q: r`Why are rank-based tests like Mann–Whitney and Wilcoxon robust against severe outliers?`,
        o: [
          r`Because outliers are deleted before calculation begins`,
          r`Because data points are converted into ranks, bounding the influence of any extreme value to its ordinal position`,
          r`Because rank tests automatically apply a log transform`,
          r`Because ranks follow a Student's t-distribution`,
        ],
        a: 1,
        why: r`Converting measurements to ranks ensures that whether an extreme value is 100 or 1,000,000, its impact on the test statistic is limited strictly to its position in the sorted list.`,
      },
      {
        q: r`What does the Mann–Whitney $U$ test formally evaluate without making any distributional shape assumptions?`,
        o: [
          r`Equality of population variances`,
          r`Stochastic dominance: the probability that a random draw from one distribution exceeds a draw from the other ($P(X > Y) = 0.5$)`,
          r`Strict equality of sample means`,
          r`Linear correlation between two variables`,
        ],
        a: 1,
        why: r`Mann–Whitney U evaluates stochastic dominance. It only reflects a pure shift in population medians if one assumes the two distributions possess identical shape and variance.`,
      },
      {
        q: r`How does the statistical efficiency of the Mann–Whitney test compare to Student's $t$-test on purely Gaussian data?`,
        o: [
          r`It has an asymptotic relative efficiency of roughly 95.5% ($3/\pi$), sacrificing minimal power`,
          r`It loses more than 50% of statistical power`,
          r`It cannot be computed on Gaussian data`,
          r`It always has higher power than the t-test on Gaussian data`,
        ],
        a: 0,
        why: r`The Hodges–Lehmann asymptotic relative efficiency (ARE) of Mann–Whitney relative to the t-test on normal data is $3/\pi \approx 0.955$, meaning very little efficiency is lost even when normality holds.`,
      },
      {
        q: r`Which non-parametric test serves as the distribution-free counterpart to one-way ANOVA for three or more independent groups?`,
        o: [
          r`Wilcoxon signed-rank test`,
          r`Kruskal–Wallis H-test`,
          r`McNemar's test`,
          r`Pearson's chi-square test`,
        ],
        a: 1,
        why: r`The Kruskal–Wallis H-test generalises the two-sample Mann–Whitney rank test to three or more independent groups, evaluating whether group rank sums differ significantly.`,
      },
    ],
    usedBy: ['feature-selection', 'decision_tree_classifier'],
    prereq: ['hypothesis-testing-and-p-values', 'z-test-and-t-tests', 'random-variables-and-distributions'],
    related: ['anova-and-post-hoc-tests', 'normality-tests-shapiro-wilk-kolmogorov-smirnov-anderson-darling', 'bootstrap-and-jackknife'],
    keywords: 'non-parametric mann whitney wilcoxon signed rank kruskal wallis ranks median test distribution free',
  },
  {
    id: 'normality-tests-shapiro-wilk-kolmogorov-smirnov-anderson-darling',
    short: 'Normality Tests',
    title: r`Normality Tests: Shapiro–Wilk, Kolmogorov–Smirnov, Anderson–Darling`,
    task: 'concepts',
    module: 'Hypothesis testing',
    level: 2,
    minutes: 17,
    noLab: true,
    summary: r`Verify whether data satisfies Gaussian assumptions using the correlation-based Shapiro–Wilk test, empirical CDF Kolmogorov–Smirnov test, and tail-sensitive Anderson–Darling test.`,
    lead: r`Many classical statistical procedures—from linear regression inference to Student's t-tests and ANOVA—rely on assumptions of underlying normality. Rather than relying on wishful thinking or visual inspection of histograms alone, formal normality tests quantify whether sample data deviates significantly from a Gaussian distribution. Understanding the distinct mathematical mechanics of Shapiro–Wilk, Kolmogorov–Smirnov, and Anderson–Darling tests enables practitioners to diagnose skewness, kurtosis, and tail anomalies accurately.`,
    intuition: [
      r`Imagine training a regression model and checking whether its residuals conform to the standard assumption of normally distributed errors. You generate 60 residual values. Visually, a histogram or Q-Q plot might look "roughly bell-shaped", but human eyes are notoriously prone to subjective bias.`,
      r`How can we mathematically evaluate Gaussian adherence? There are three distinct perspectives:`,
      r`First, correlation with normal order statistics: if data is truly normal, plotting sorted sample values against expected standard normal quantiles should form an almost perfect straight line. The Shapiro–Wilk test computes this exact correlation squared ($W$). For a genuine normal sample of size 60, $W \approx 0.982$ with $p = 0.502$ (no deviation detected). For exponential or skewed data, points curl away from the line, dropping $W$ to $0.833$ with $p \approx 10^{-6}$ (overwhelming rejection). Second, maximum gap between cumulative curves: the Kolmogorov–Smirnov (KS) test compares the empirical step-function distribution against the theoretical smooth normal cumulative curve, measuring the single largest vertical gap ($D$). Third, weighted tail sensitivity: the KS test is insensitive in the extreme tails because cumulative curves are anchored to 0 and 1 at the boundaries. The Anderson–Darling test solves this by weighting discrepancies by $1 / [F(x)(1 - F(x))]$, placing heavy mathematical emphasis on the tails where critical anomalies occur.`,
    ],
    analogy: r`Testing normality with these three methods is like inspecting a tailor-made suit: Shapiro–Wilk checks if the overall silhouette matches the pattern, Kolmogorov–Smirnov checks the single widest seam gap, and Anderson–Darling inspects the hems and cuffs where wear and tear happen first.`,
    steps: [
      r`Inspect the sample visually with a Q-Q (quantile-quantile) plot to develop an initial diagnostic intuition of skewness and tail weight.`,
      r`State the formal null hypothesis $H_0$: the sample was drawn from a normally distributed population, versus $H_1$: the parent population is non-normal.`,
      r`For general univariate data ($n \le 5,000$), run the Shapiro–Wilk test as the most statistically powerful omnibus test of normality.`,
      r`If tail discrepancies or extreme events are the primary operational risk (such as latency SLAs), evaluate the Anderson–Darling test.`,
      r`If parameters $(\mu, \sigma)$ are estimated from the sample data rather than known beforehand, do not use standard Kolmogorov–Smirnov tables; use the Lilliefors correction.`,
      r`Synthesise test results with sample size: in very large samples, slight harmless departures trigger $p < 0.05$; in small samples, low power can mask severe non-normality.`,
    ],
    math: [
      {
        h: 'Shapiro–Wilk Test Statistic',
        tex: r`$$W = \frac{\left(\sum_{i=1}^n a_i X_{(i)}\right)^2}{\sum_{i=1}^n (X_i - \bar{X})^2}$$`,
        p: r`Here $X_{(1)} \le X_{(2)} \le \dots \le X_{(n)}$ are ordered sample statistics, and $\mathbf{a} = \frac{\mathbf{m}^T \mathbf{V}^{-1}}{\sqrt{\mathbf{m}^T \mathbf{V}^{-1}\mathbf{V}^{-1}\mathbf{m}}}$ incorporates the expected values $\mathbf{m}$ and covariance matrix $\mathbf{V}$ of standard normal order statistics. The statistic $W$ lies in $(0, 1]$, where $W = 1$ indicates perfect linearity between sample quantiles and normal quantiles.`,
      },
      {
        h: 'Kolmogorov–Smirnov Test Statistic',
        tex: r`$$D = \sup_{x} |F_n(x) - F_0(x)|$$`,
        p: r`Here $F_n(x) = \frac{1}{n}\sum_{i=1}^n \mathbf{1}_{X_i \le x}$ is the empirical cumulative distribution function, and $F_0(x)$ is the reference continuous cumulative distribution function. $D$ represents the supremum absolute vertical distance between the empirical step function and theoretical curve.`,
      },
      {
        h: 'Anderson–Darling Test Statistic',
        tex: r`$$A^2 = -n - \sum_{i=1}^n \frac{2i - 1}{n} \left[\ln F_0(X_{(i)}) + \ln(1 - F_0(X_{(n+1-i)}))\right]$$`,
        p: r`The Anderson–Darling statistic weights squared discrepancies by the inverse variance function $[F_0(x)(1 - F_0(x))]^{-1}$. This weighting amplifies discrepancies in the lower and upper tails, making $A^2$ far more sensitive to heavy tails and skewness than the unweighted Kolmogorov–Smirnov statistic.`,
      },
    ],
    keyPoints: [
      r`The Shapiro–Wilk test exhibits the highest overall statistical power across a broad range of non-normal distributions for sample sizes up to several thousand.`,
      r`Standard Kolmogorov–Smirnov assumes a fully specified reference distribution; plugging in sample mean and sample variance requires the Lilliefors correction to avoid conservative bias.`,
      r`Anderson–Darling prioritises tail deviations, making it the preferred diagnostic when detecting heavy tails or extreme-value risk.`,
      r`In huge datasets ($n > 10,000$), tiny, practically trivial deviations from Gaussian perfection will trigger $p < 0.001$; always combine formal tests with Q-Q plots.`,
    ],
    pitfalls: [
      r`Plugging sample estimates of $\mu$ and $\sigma$ into the standard Kolmogorov–Smirnov test without using Lilliefors critical values, producing falsely inflated p-values.`,
      r`Mistaking a non-significant normality test in a small sample ($n < 25$) as positive confirmation that the population is normal.`,
      r`Discarding linear regression models when a massive sample fails a normality test, overlooking that regression coefficient estimators remain asymptotically normal via the central limit theorem.`,
      r`Testing normality exclusively with numbers while skipping graphical Q-Q plots, missing the structural nature of departures (skewness vs kurtosis vs outliers).`,
    ],
    code: r`import numpy as np
import scipy.stats as stats

rng = np.random.default_rng(42)
n = 60

# Normal sample vs skewed exponential sample
normal_data = rng.normal(loc=10.0, scale=2.5, size=n)
skewed_data = rng.exponential(scale=2.5, size=n)

# 1. Shapiro-Wilk test (highest omnibus power)
w_norm, p_sw_norm = stats.shapiro(normal_data)
w_skew, p_sw_skew = stats.shapiro(skewed_data)

# 2. Kolmogorov-Smirnov test against fitted normal distribution
ks_skew, p_ks_skew = stats.kstest(skewed_data, 'norm',
    args=(np.mean(skewed_data), np.std(skewed_data, ddof=1)))

# 3. Anderson-Darling test (tail-weighted)
ad_skew = stats.anderson(skewed_data, dist='norm', method='interpolate')

print(f"Normal data: Shapiro W={w_norm:.4f}, p={p_sw_norm:.4f}")
print(f"Skewed data: Shapiro W={w_skew:.4f}, p={p_sw_skew:.4e}")
print(f"Skewed data: KS stat={ks_skew:.4f}, p={p_ks_skew:.4f}")
print(f"Skewed data: Anderson A2={ad_skew.statistic:.3f}, p={ad_skew.pvalue:.4f}")`,
    quiz: [
      {
        q: r`Which normality test is empirically proven to deliver the highest statistical power against the widest variety of non-normal alternative distributions for moderate sample sizes?`,
        o: [
          r`Standard Kolmogorov–Smirnov test`,
          r`Shapiro–Wilk test`,
          r`Pearson's chi-square goodness-of-fit test`,
          r`Student's t-test`,
        ],
        a: 1,
        why: r`Extensive Monte Carlo studies confirm that the Shapiro–Wilk test, which evaluates the squared correlation between sample order statistics and normal quantiles, offers superior statistical power across diverse alternatives.`,
      },
      {
        q: r`What occurs if you test normality with the standard Kolmogorov–Smirnov test after estimating $\mu$ and $\sigma$ from the sample?`,
        o: [
          r`The test becomes overly conservative, underestimating discrepancies and yielding p-values that are too large`,
          r`The test statistic becomes undefined`,
          r`The test automatically converts into an Anderson–Darling test`,
          r`The p-value is always zero`,
        ],
        a: 0,
        why: r`Estimating parameters from the sample forces the theoretical CDF closer to the empirical CDF than an independent reference curve would be, shrinking $D$ and inflating p-values unless the Lilliefors correction is applied.`,
      },
      {
        q: r`What is the primary advantage of the Anderson–Darling test over the Kolmogorov–Smirnov test?`,
        o: [
          r`It requires no sample data`,
          r`It places inverse variance weights on discrepancies, providing much greater sensitivity to departures in the distribution tails`,
          r`It only applies to uniform distributions`,
          r`It eliminates all Type I errors`,
        ],
        a: 1,
        why: r`Anderson–Darling divides deviations by $F_0(x)(1 - F_0(x))$, which prevents tail discrepancies from being compressed to zero near the boundaries and magnifies sensitivity to heavy tails.`,
      },
      {
        q: r`Why is a formal normality test often unhelpful when analysing huge datasets ($n = 100,000$)?`,
        o: [
          r`Computational algorithms fail on arrays larger than 1,000 items`,
          r`The test becomes so powerful that trivial, practically inconsequential imperfections trigger $p < 0.0001$`,
          r`Large samples can never follow normal distributions`,
          r`The central limit theorem ceases to operate`,
        ],
        a: 1,
        why: r`With huge sample sizes, test power approaches 100% for microscopic departures that have zero practical impact on downstream estimation or model validity.`,
      },
    ],
    usedBy: ['ols_linear_regression', 'linear_discriminant_analysis'],
    prereq: ['hypothesis-testing-and-p-values', 'random-variables-and-distributions', 'sampling-and-standard-error'],
    related: ['non-parametric-tests-mann-whitney-wilcoxon-kruskal-wallis', 'z-test-and-t-tests', 'exploratory-data-analysis'],
    keywords: 'normality tests shapiro wilk kolmogorov smirnov anderson darling goodness of fit gaussian q-q plot lilliefors',
  },
  {
    id: 'multiple-testing-bonferroni-holm-benjamini-hochberg',
    short: 'Multiple Testing Corrections',
    title: r`Multiple Testing: Bonferroni, Holm, Benjamini–Hochberg`,
    task: 'concepts',
    module: 'Hypothesis testing',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Control family-wise error rates and false discovery rates across multiple hypothesis tests using Bonferroni, Holm step-down, and Benjamini–Hochberg procedures.`,
    lead: r`When testing hundreds of features, genome variants, or concurrent A/B test variations, standard significance thresholds collapse under the weight of multiplicity. Testing 100 null hypotheses at $\alpha = 0.05$ produces an average of five false discoveries by pure chance. Multiple testing corrections adjust p-values to control either the strict probability of even a single false alarm (Family-Wise Error Rate) or the expected proportion of false alarms among all declared discoveries (False Discovery Rate).`,
    intuition: [
      r`Suppose a machine learning team evaluates 10 new candidate features for a credit scoring model, running an individual hypothesis test for each feature at the conventional $\alpha = 0.05$ threshold. The resulting raw p-values from smallest to largest are: $[0.001, 0.006, 0.012, 0.024, 0.038, 0.082, 0.150, 0.290, 0.440, 0.810]$. Without any adjustment, five features pass the threshold ($p \le 0.05$). But if all 10 candidate features were actually useless noise, the probability of finding at least one false positive is $1 - (1 - 0.05)^{10} \approx 40.1\%$.`,
      r`To protect against false discoveries, we can choose between two paradigms:`,
      r`First, Family-Wise Error Rate (FWER): if a single false claim is unacceptable (such as approving an ineffective drug), we require that the probability of any false positive across all 10 tests remains $\le 5\%$. The Bonferroni correction multiplies each p-value by $m = 10$. Now only the first feature survives ($0.001 \times 10 = 0.010 \le 0.05$), while the second becomes $0.006 \times 10 = 0.060 > 0.05$. The Holm step-down method improves on Bonferroni by stepping down the multiplier $(10, 9, 8, \dots)$, but still declares only 1 discovery. Second, False Discovery Rate (FDR): in exploratory data science and feature selection, demanding zero false positives is overly conservative and discards valuable signal. Benjamini and Hochberg (1995) proposed controlling the expected proportion of false positives among all declared discoveries. Applying the Benjamini–Hochberg procedure declares three discoveries ($p \le [0.010, 0.030, 0.040]$), recovering three legitimate features while strictly capping false discoveries.`,
    ],
    analogy: r`FWER methods are like a zero-tolerance airport security checkpoint where a single false alarm grounds all flights; FDR methods are like an automated spam filter that accepts a small, manageable percentage of spam in the inbox in exchange for never missing important emails.`,
    steps: [
      r`Assemble all $m$ raw p-values from the family of tests and sort them in ascending order: $p_{(1)} \le p_{(2)} \le \dots \le p_{(m)}$.`,
      r`Choose the appropriate error control criterion: FWER for confirmatory decisions, or FDR for exploratory screening and feature selection.`,
      r`For conservative FWER control, apply Bonferroni: reject hypotheses where $p_{(i)} \le \alpha / m$.`,
      r`For uniformly superior FWER control without additional assumptions, apply Holm's step-down method: compare $p_{(i)}$ against $\alpha / (m - i + 1)$ sequentially, stopping at the first non-rejection.`,
      r`For balanced FDR control, apply Benjamini–Hochberg: find the largest rank $k$ where $p_{(k)} \le \frac{k}{m} Q$, and reject all hypotheses from rank 1 through $k$.`,
      r`Report adjusted p-values alongside original unadjusted statistics to maintain full scientific transparency.`,
    ],
    math: [
      {
        h: 'Family-Wise Error Rate and Bonferroni Inequality',
        tex: r`$$\text{FWER} = P(V \ge 1) \le \sum_{i=1}^{m_0} P(\text{Reject } H_{0,i} \mid H_{0,i} \text{ true}) \le m_0 \frac{\alpha}{m} \le \alpha$$`,
        p: r`Here $V$ is the number of false rejections (Type I errors), $m$ is total hypotheses tested, and $m_0 \le m$ is the number of true nulls. By Boole's union bound, testing each hypothesis at significance level $\alpha / m$ ensures the family-wise error rate remains $\le \alpha$ under any dependency structure.`,
      },
      {
        h: 'Holm\'s Sequentially Rejective Step-Down Method',
        tex: r`$$\text{Step } i: \quad p_{(i)} \le \frac{\alpha}{m - i + 1}$$`,
        p: r`Holm's method sorts p-values in ascending order and tests sequentially: $p_{(1)}$ against $\alpha / m$, $p_{(2)}$ against $\alpha / (m - 1)$, and so on. As soon as a p-value fails its criterion, testing terminates and all remaining hypotheses are retained. Holm controls FWER at level $\alpha$ under arbitrary dependence while being strictly more powerful than Bonferroni.`,
      },
      {
        h: 'Benjamini–Hochberg False Discovery Rate (FDR)',
        tex: r`$$\text{FDR} = E\left[\frac{V}{\max(R, 1)}\right] \le Q \implies k = \max\left\{i : p_{(i)} \le \frac{i}{m} Q\right\}, \quad \text{Reject } H_{(1)}, \dots, H_{(k)}$$`,
        p: r`Here $V$ is false rejections, $R$ is total rejections, and $Q$ is target FDR level. Sorting p-values and finding the largest index $k$ whose p-value falls below the rank line $\frac{i}{m} Q$ guarantees that the expected proportion of false discoveries does not exceed $Q$ under independent or positively dependent test statistics.`,
      },
    ],
    keyPoints: [
      r`The family-wise error rate (FWER) controls the probability of making at least one false discovery; the false discovery rate (FDR) controls the expected proportion of false discoveries among rejected hypotheses.`,
      r`Bonferroni is universally valid under any dependence structure, but becomes severely underpowered when testing hundreds or thousands of hypotheses.`,
      r`Holm's step-down procedure is always at least as powerful as Bonferroni and carries zero extra assumptions; there is virtually no statistical reason to use classic Bonferroni over Holm.`,
      r`The Benjamini–Hochberg procedure dramatically increases statistical power in high-dimensional settings by tolerating a controlled rate of false positives.`,
    ],
    pitfalls: [
      r`Using Bonferroni correction in large-scale feature selection ($m > 1,000$), which obliterates statistical power and results in severe Type II errors.`,
      r`Failing to apply any multiplicity correction when examining dozens of subgroup breakdowns or metrics in A/B tests.`,
      r`Interpreting FDR adjusted p-values as posterior probabilities that a specific hypothesis is null; FDR is a property of the collective discovery set.`,
      r`Applying multiple testing corrections after cherry-picking which tests to report; corrections require knowing the total number of tests executed.`,
    ],
    code: r`import numpy as np
import scipy.stats as stats

# Raw p-values from 10 parallel A/B tests or candidate features
p_vals = np.array([0.001, 0.006, 0.012, 0.024, 0.038, 0.082, 0.150, 0.290, 0.440, 0.810])
m = len(p_vals)
alpha = 0.05

# 1. Bonferroni: multiply by total tests m
p_bonf = np.minimum(p_vals * m, 1.0)

# 2. Holm step-down: multiply by (m - rank) and enforce monotonicity
p_holm = np.maximum.accumulate(np.minimum(p_vals * (m - np.arange(m)), 1.0))

# 3. Benjamini-Hochberg (FDR control)
p_bh = stats.false_discovery_control(p_vals, method='bh')

print(f"Raw p-values:        {p_vals}")
print(f"Bonferroni adjusted: {np.round(p_bonf, 3)}")
print(f"Holm adjusted:       {np.round(p_holm, 3)}")
print(f"BH adjusted (FDR):   {np.round(p_bh, 3)}")
print(f"Discoveries at alpha={alpha} -> Unadjusted: {np.sum(p_vals <= alpha)}, "
      f"Bonferroni: {np.sum(p_bonf <= alpha)}, Holm: {np.sum(p_holm <= alpha)}, "
      f"Benjamini-Hochberg: {np.sum(p_bh <= alpha)}")`,
    quiz: [
      {
        q: r`What is the crucial difference between Family-Wise Error Rate (FWER) and False Discovery Rate (FDR)?`,
        o: [
          r`FWER controls the probability of making at least one false positive, while FDR controls the expected fraction of false positives among declared discoveries`,
          r`FWER is only for medical trials, while FDR is only for computer science`,
          r`FWER always yields more discoveries than FDR`,
          r`FDR assumes all null hypotheses are true`,
        ],
        a: 0,
        why: r`FWER bounds $P(V \ge 1) \le \alpha$, demanding near-certainty of zero false discoveries. FDR bounds $E[V / \max(R, 1)] \le Q$, tolerating a small fraction of false discoveries to boost power.`,
      },
      {
        q: r`Why should practitioners generally prefer Holm's step-down procedure over the classical Bonferroni correction?`,
        o: [
          r`Holm's method requires assuming normal distributions`,
          r`Holm's method controls FWER at the exact same level $\alpha$ under arbitrary dependence while being strictly more powerful`,
          r`Holm's method computes p-values faster`,
          r`Holm's method can be run without sorting p-values`,
        ],
        a: 1,
        why: r`Holm's step-down method guarantees the same FWER protection as Bonferroni without any additional assumptions, but uses smaller multipliers for subsequent ranks, making it uniformly more powerful.`,
      },
      {
        q: r`In the Benjamini–Hochberg procedure with $m$ tests and target FDR $Q$, what is the rejection criterion for the sorted p-values $p_{(1)} \le \dots \le p_{(m)}$?`,
        o: [
          r`Reject all $p_{(i)} \le Q / m$`,
          r`Find the largest rank $k$ such that $p_{(k)} \le \frac{k}{m} Q$, and reject all hypotheses from rank 1 to $k$`,
          r`Reject only hypotheses with $p_{(i)} \le Q$`,
          r`Reject the single smallest p-value`,
        ],
        a: 1,
        why: r`The Benjamini–Hochberg step-up procedure identifies the largest index $k$ satisfying $p_{(k)} \le \frac{k}{m} Q$ and declares all hypotheses $1, \dots, k$ significant.`,
      },
      {
        q: r`If you evaluate 20 orthogonal features with independent tests at $\alpha = 0.05$ without multiplicity correction, what is the probability of at least one false positive if all features are pure noise?`,
        o: [
          r`5.0%`,
          r`20.0%`,
          r`Approximately 64.2%`,
          r`100%`,
        ],
        a: 2,
        why: r`The probability of at least one false alarm across 20 independent true null tests is $1 - (1 - 0.05)^{20} = 1 - 0.95^{20} \approx 1 - 0.3585 = 0.6415$ (or 64.2%).`,
      },
    ],
    usedBy: ['feature-selection', 'decision_tree_classifier'],
    prereq: ['hypothesis-testing-and-p-values', 'type-i-ii-errors-power-and-sample-size', 'probability-rules-and-bayes-theorem'],
    related: ['anova-and-post-hoc-tests', 'normality-tests-shapiro-wilk-kolmogorov-smirnov-anderson-darling', 'cross-validation'],
    keywords: 'multiple testing bonferroni holm benjamini hochberg fdr fwer false discovery rate family wise error p-value adjustment',
  },
  {
    id: 'effect-sizes-cohens-d-cramers-v',
    short: 'Effect Sizes: Cohen\'s d & V',
    title: r`Effect Sizes: Cohen's d, Cramér's V`,
    task: 'concepts',
    module: 'Hypothesis testing',
    level: 1,
    minutes: 15,
    noLab: true,
    summary: r`Quantify the practical magnitude of experimental findings beyond mere p-values using standardised metrics for continuous and categorical differences.`,
    lead: r`A tiny p-value tells you an effect is unlikely to be pure noise, but says nothing about whether it actually matters. Effect size metrics decouple statistical significance from sample size, quantifying the real-world strength of relationships on standardised scales. Cohen's d, Hedges' g, and Cramér's V provide universal, scale-free benchmarks for comparing continuous mean shifts and categorical associations across experiments.`,
    intuition: [
      r`Suppose an online education platform evaluates a new tutorial on test scores. In a massive sample of 100,000 students, the new tutorial improves the average score from 75.00 to 75.15 points (a 0.15 point lift out of 100), with a pooled standard deviation $s = 15.0$ points. Because the sample size is enormous ($N = 100,000$), the standard error is $\approx 0.067$, producing $z = 2.24$ and $p = 0.025$. A naive team might announce a "statistically significant breakthrough".`,
      r`However, dividing the 0.15 point difference by the standard deviation of 15.0 yields a Cohen's $d$ of just $0.01$—a minuscule shift of one-hundredth of a standard deviation. Over 99% of student scores overlap completely between the two cohorts. The effect is practically indistinguishable from zero. Conversely, a tiny pilot study of 20 users might show a massive 12-point jump ($d = 0.80$), but have $p = 0.08$ due to low sample size.`,
      r`Effect sizes protect teams from both traps. For continuous two-group comparisons, Cohen's $d$ expresses the difference in terms of pooled standard deviations ($0.2$ is small, $0.5$ is medium, $0.8$ is large). Hedges' $g$ applies an exact small-sample correction. For categorical contingency tables, Cramér's $V$ bounds association between 0 (complete independence) and 1 (perfect correlation), converting unscaled chi-square statistics into interpretable association strengths.`,
    ],
    analogy: r`A p-value is like a telescope telling you whether a celestial body exists; the effect size is the measurement that tells you whether it is a pebble or a planet.`,
    steps: [
      r`Determine the data type: continuous measurements between two groups (Cohen's $d$ or Hedges' $g$) or categorical counts in a contingency table (Cramér's $V$).`,
      r`For continuous variables, compute the mean difference $\bar{X}_1 - \bar{X}_2$ and the pooled standard deviation $s_{\text{pooled}}$.`,
      r`Divide the mean difference by $s_{\text{pooled}}$ to obtain Cohen's $d$; if $n < 20$, multiply by the Hedges correction factor $J \approx 1 - \frac{3}{4(n_1 + n_2) - 9}$.`,
      r`For categorical contingency tables, compute the Pearson chi-square statistic $\chi^2$ and total sample size $N$.`,
      r`Compute Cramér's $V = \sqrt{\frac{\chi^2}{N \min(R - 1, C - 1)}}$.`,
      r`Interpret the magnitude against established domain standards rather than treating p-values as proxies for impact.`,
    ],
    math: [
      {
        h: 'Cohen\'s d and Pooled Standard Deviation',
        tex: r`$$d = \frac{\bar{X}_1 - \bar{X}_2}{s_{\text{pooled}}}, \qquad s_{\text{pooled}} = \sqrt{\frac{(n_1 - 1)s_1^2 + (n_2 - 1)s_2^2}{n_1 + n_2 - 2}}$$`,
        p: r`Here $\bar{X}_1, \bar{X}_2$ are group sample means, $s_1^2, s_2^2$ are sample variances, and $n_1, n_2$ are sample sizes. The pooled standard deviation $s_{\text{pooled}}$ weights variances by their degrees of freedom, standardising the mean difference into units of population standard deviations.`,
      },
      {
        h: 'Hedges\' g Small-Sample Correction',
        tex: r`$$g = d \cdot \left(1 - \frac{3}{4(n_1 + n_2) - 9}\right)$$`,
        p: r`Cohen's $d$ exhibits a slight positive bias when estimated from small sample sizes ($n_1 + n_2 < 30$). Larry Hedges introduced this exact scaling factor to produce an unbiased estimator $g$, which converges to $d$ as sample sizes increase.`,
      },
      {
        h: 'Cramér\'s V for Categorical Association',
        tex: r`$$V = \sqrt{\frac{\chi^2}{N \cdot \min(R - 1, C - 1)}}$$`,
        p: r`Here $\chi^2$ is Pearson's chi-square test statistic, $N$ is total observations, and $R$ and $C$ are the row and column dimensions of the contingency table. Dividing by $N \cdot \min(R - 1, C - 1)$ normalises the metric into the interval $[0, 1]$, where 0 indicates statistical independence and 1 indicates perfect complete association.`,
      },
    ],
    keyPoints: [
      r`Effect sizes measure the substantive magnitude of a difference or relationship completely independent of sample size.`,
      r`A finding can achieve statistical significance ($p < 0.05$) while remaining practically negligible ($d < 0.05$), or carry huge real-world impact ($d > 0.80$) while lacking significance in a small study.`,
      r`Jacob Cohen's classic thresholds ($0.2$ small, $0.5$ medium, $0.8$ large) provide general heuristics, but must always be interpreted in domain-specific context.`,
      r`Reporting effect sizes with confidence intervals gives readers both the magnitude of an effect and the precision of its estimation.`,
    ],
    pitfalls: [
      r`Equating a small p-value with a large effect size: with huge datasets, trivial noise differences yield $p < 0.0001$.`,
      r`Using unpooled standard deviations when computing Cohen's $d$ on groups with unequal variances; use Glass's delta or Welch-standardised metrics instead.`,
      r`Ignoring Hedges' small-sample correction ($g$) when reporting results from pilot studies with fewer than 20 observations per group.`,
      r`Comparing raw Cramér's V values across tables of different dimensions without accounting for the degrees of freedom scaling factor.`,
    ],
    code: r`import numpy as np
import scipy.stats as stats

rng = np.random.default_rng(42)

# Continuous comparison: tutorial vs control test scores
scores_tut = rng.normal(loc=78.5, scale=12.0, size=25)
scores_ctrl = rng.normal(loc=71.2, scale=11.5, size=25)
n1, n2 = len(scores_tut), len(scores_ctrl)
s1, s2 = np.std(scores_tut, ddof=1), np.std(scores_ctrl, ddof=1)
s_pooled = np.sqrt(((n1 - 1) * s1**2 + (n2 - 1) * s2**2) / (n1 + n2 - 2))

cohens_d = (np.mean(scores_tut) - np.mean(scores_ctrl)) / s_pooled
hedges_g = cohens_d * (1.0 - 3.0 / (4.0 * (n1 + n2) - 9.0))

# Categorical association: 2x3 contingency table
table = np.array([[120, 80, 50], [180, 50, 20]])
chi2_val, _, _, _ = stats.chi2_contingency(table)
cramers_v = np.sqrt(chi2_val / (np.sum(table) * (min(table.shape) - 1)))

print(f"Mean difference: {np.mean(scores_tut) - np.mean(scores_ctrl):.2f}")
print(f"Cohen's d:       {cohens_d:.3f} (medium effect)")
print(f"Hedges' g:       {hedges_g:.3f} (bias-corrected)")
print(f"Cramér's V:      {cramers_v:.3f} (moderate association)")`,
    quiz: [
      {
        q: r`Why is it dangerous to rely exclusively on p-values without reporting effect sizes?`,
        o: [
          r`Because p-values cannot be computed on continuous data`,
          r`Because massive sample sizes can make minuscule, practically meaningless differences achieve $p < 0.001$`,
          r`Because p-values only apply to non-parametric distributions`,
          r`Because effect sizes eliminate experimental variance`,
        ],
        a: 1,
        why: r`The p-value conflates effect size and sample size: with large enough $N$, even an imperceptible difference of 0.01 standard deviations will produce a tiny p-value.`,
      },
      {
        q: r`Under Jacob Cohen's conventional benchmarks for continuous mean comparisons ($d$), what value represents a "medium" effect size?`,
        o: [
          r`0.1`,
          r`0.5`,
          r`0.8`,
          r`1.5`,
        ],
        a: 1,
        why: r`Cohen's widely adopted guidelines define $d = 0.2$ as small, $d = 0.5$ as medium, and $d = 0.8$ as large.`,
      },
      {
        q: r`When should an analyst report Hedges' $g$ instead of Cohen's $d$?`,
        o: [
          r`When sample sizes are small ($N < 30$), to correct for positive small-sample bias in estimated pooled variance`,
          r`When data is categorical`,
          r`When comparing more than two groups simultaneously`,
          r`When population standard deviations are known exactly`,
        ],
        a: 0,
        why: r`Cohen's $d$ slightly overestimates the true effect size in small samples. Hedges' $g$ applies an exact correction factor that removes this small-sample bias.`,
      },
      {
        q: r`What range of values can Cramér's $V$ take in an $R \times C$ contingency table?`,
        o: [
          r`$[-1, 1]$`,
          r`$[0, 1]$`,
          r`$[0, \infty)$`,
          r`$[-0.5, 0.5]$`,
        ],
        a: 1,
        why: r`Cramér's $V$ is normalised by dividing by $N \cdot \min(R - 1, C - 1)$, constraining the metric strictly to $[0, 1]$, where 0 reflects independence and 1 reflects complete association.`,
      },
    ],
    usedBy: ['ols_linear_regression', 'logistic_regression'],
    prereq: ['hypothesis-testing-and-p-values', 'type-i-ii-errors-power-and-sample-size', 'z-test-and-t-tests'],
    related: ['chi-square-tests', 'anova-and-post-hoc-tests', 'confidence-intervals'],
    keywords: 'effect size cohens d cramers v hedges g standardized difference magnitude practical significance',
  },
  {
    id: "permutation-tests",
    short: "Permutation Tests",
    title: "Permutation tests",
    task: "concepts",
    module: "Hypothesis testing",
    level: 2,
    minutes: 18,
    noLab: true,
    summary: "Permutation tests (also called randomisation or exact re-randomisation tests) are non-parametric hypothesis tests that calculate exact, distribution-free p-values by exhaustively or randomly shuffling group labels under the null hypothesis. Unlike classical t-tests and ANOVA that rely on asymptotic central limit theorems and strict normality assumptions, permutation tests require only that observations are exchangeable under the null hypothesis H_0. They can evaluate arbitrary test statistics—including medians, trimmed means, ratios, and custom business metrics—with exact finite-sample Type I error guarantees.",
    lead: "What should you do when evaluating an A/B test with 25 users per variant, where the metric is heavily skewed with extreme outliers and violates every assumption of the Student's t-test? Classical parametric formulas fall apart on small, non-normal samples. Permutation tests provide the gold standard solution: by shuffling the \"Variant A\" and \"Variant B\" labels thousands of times, they construct an exact empirical null distribution directly from the observed data without making any parametric distributional assumptions.",
    intuition: [
      "The Core Logic of Exchangeability: Under the null hypothesis H_0, the treatment has no effect on the outcome. Therefore, the group labels (\"Control\" vs \"Treatment\") assigned to each participant are completely arbitrary! If treatment had no impact, an observed revenue of £150 in group A was equally likely to have occurred in group B.",
      "Building the Empirical Null by Shuffling: Pool all observations from groups A and B together. Randomly shuffle the labels and recompute your test statistic (e.g. difference in means x_bar_A - x_bar_B). Repeat this shuffling process 10,000 times. This builds an exact empirical reference distribution showing what differences arise purely from random chance.",
      "Calculating the Exact p-Value: The two-sided p-value is simply the proportion of shuffled permutations where the test statistic is at least as extreme as the observed test statistic from the real experiment. No z-tables, t-tables, or degrees of freedom required!",
      "Total Metric Flexibility: In classical tests, you are restricted to statistics with known analytical sampling distributions (like the mean). In a permutation test, you can test differences in medians, 90th percentiles, variance ratios, or custom profit formulas with identical mathematical validity."
    ],
    analogy: "Imagine dealing a deck of cards into two piles, Red and Blue, and noticing the Red pile has a higher total face value. Did the dealer cheat, or was it pure chance? To test this, you don't need a mathematical theorem about Gaussian curves. You simply gather the cards, shuffle them thoroughly, deal them into two piles again, and check the difference. If you repeat this shuffle 10,000 times and an advantage as large as the original deal appears only 12 times, the p-value is 12 / 10,000 = 0.0012, proving the original deal was extraordinarily unlikely to occur by random chance.",
    steps: [
      {
        "title": "State the null hypothesis and exchangeability assumption",
        "desc": "Formalise H_0: the probability distribution of outcomes is identical across groups.",
        "detail": "Verify that observations are exchangeable under H_0 (e.g. independent samples assigned via randomisation)."
      },
      {
        "title": "Choose an appropriate test statistic",
        "desc": "Select a statistic T(D) that quantifies the difference between treatment and control.",
        "detail": "Pick the difference in means, difference in medians, trimmed mean difference, or ratio of variances based on the metric most relevant to the business decision."
      },
      {
        "title": "Compute the observed test statistic",
        "desc": "Calculate T_obs on the original, unmodified experimental dataset.",
        "detail": "Evaluate T_obs = T(group_A, group_B) and store it as the benchmark for significance."
      },
      {
        "title": "Reshuffle group labels under the null hypothesis",
        "desc": "Pool observations, permute assignments B times, and recalculate the statistic.",
        "detail": "Draw B random permutations (typically B = 10,000). For each permutation b, reassign pooled observations to groups of size n_A and n_B, and record T^(b)."
      },
      {
        "title": "Compute exact empirical p-value",
        "desc": "Determine the fraction of permutations as extreme as T_obs, including the continuity correction.",
        "detail": "Calculate p = (1 + sum I(|T^(b)| >= |T_obs|)) / (B + 1). The addition of 1 to numerator and denominator accounts for the observed data, ensuring strict Type I error control."
      }
    ],
    math: [
      {
        "h": "Exact Permutation p-Value Formulation",
        "tex": "p_{\\text{exact}} = \\frac{1}{\\binom{N}{n_A}} \\sum_{\\pi \\in \\Pi} \\mathbb{I}\\Big( \\big|T(\\pi(\\mathcal{D}))\\big| \\ge |T_{\\text{obs}}| \\Big)",
        "p": "For sample sizes n_A and n_B with total N = n_A + n_B, there are \\binom{N}{n_A} possible ways to partition the observations into two groups. When N is small, all permutations \\Pi can be evaluated exhaustively to yield an exact finite-sample p-value."
      },
      {
        "h": "Monte Carlo Permutation p-Value with Continuity Correction",
        "tex": "\\hat{p} = \\frac{1 + \\sum_{b=1}^B \\mathbb{I}\\Big( |T^{(b)}| \\ge |T_{\\text{obs}}| \\Big)}{B + 1}",
        "p": "When the total number of permutations is astronomically large, B random permutations are sampled uniformly with replacement. Including the original observed dataset as the (B+1)-th permutation ensures \\hat{p} is strictly conservative and guarantees exact Type I error control at level \\alpha."
      },
      {
        "h": "Exchangeability Condition under Null Hypothesis",
        "tex": "P(X_1 = x_1, \\dots, X_N = x_N) = P(X_{\\pi(1)} = x_1, \\dots, X_{\\pi(N)} = x_N) \\quad \\forall \\pi \\in \\mathcal{S}_N",
        "p": "The fundamental assumption underpinning permutation testing is exchangeability: under H_0, the joint probability distribution of the pooled sample is invariant under all permutations \\pi in the symmetric group \\mathcal{S}_N. Independent and identically distributed (i.i.d.) observations satisfy this condition automatically."
      }
    ],
    code: "\"\"\"\nTwo-Sample Permutation Test vs Student's t-test\nDemonstrating exact distribution-free hypothesis testing on skewed,\nheavy-tailed A/B test data with extreme outliers.\n\"\"\"\n\nimport numpy as np\n\n# Simulate skewed A/B test data (e.g. e-commerce purchase amounts in GBP)\n# Control: Log-normal(mu=2.5, sigma=1.0)\n# Treatment: Log-normal(mu=2.9, sigma=1.2) with extreme outliers\nnp.random.seed(42)\nn_control = 25\nn_treatment = 25\n\ncontrol_data = np.random.lognormal(mean=2.5, sigma=1.0, size=n_control)\ntreatment_data = np.random.lognormal(mean=2.9, sigma=1.2, size=n_treatment)\n# Introduce two extreme high-value spender outliers in treatment\ntreatment_data[0] *= 4.0\ntreatment_data[1] *= 5.0\n\nprint(f\"=== Sample Summary (n_control={n_control}, n_treatment={n_treatment}) ===\")\nprint(f\"Control:   Mean = £{np.mean(control_data):.2f} | Median = £{np.median(control_data):.2f}\")\nprint(f\"Treatment: Mean = £{np.mean(treatment_data):.2f} | Median = £{np.median(treatment_data):.2f}\")\n\ndef run_permutation_test(group_a: np.ndarray, group_b: np.ndarray, num_permutations: int = 10000, statistic_type: str = \"mean\"):\n    \"\"\"\n    Execute two-sided Monte Carlo permutation test for mean or median difference.\n    \"\"\"\n    n_a = len(group_a)\n    n_b = len(group_b)\n    pooled = np.concatenate([group_a, group_b])\n    total_n = len(pooled)\n\n    # 1. Observed test statistic\n    if statistic_type == \"mean\":\n        t_obs = np.mean(group_b) - np.mean(group_a)\n    elif statistic_type == \"median\":\n        t_obs = np.median(group_b) - np.median(group_a)\n    else:\n        raise ValueError(\"Unsupported statistic type\")\n\n    # 2. Monte Carlo shuffling under H0\n    permuted_diffs = np.empty(num_permutations)\n    for b in range(num_permutations):\n        shuffled = np.random.permutation(pooled)\n        new_a = shuffled[:n_a]\n        new_b = shuffled[n_a:]\n        if statistic_type == \"mean\":\n            permuted_diffs[b] = np.mean(new_b) - np.mean(new_a)\n        else:\n            permuted_diffs[b] = np.median(new_b) - np.median(new_a)\n\n    # 3. Two-sided p-value with continuity correction\n    count_extreme = np.sum(np.abs(permuted_diffs) >= np.abs(t_obs))\n    p_value = (1 + count_extreme) / (num_permutations + 1)\n\n    return t_obs, p_value, permuted_diffs\n\n# 1. Permutation Test on Difference in Means\nt_obs_mean, p_perm_mean, _ = run_permutation_test(control_data, treatment_data, num_permutations=10000, statistic_type=\"mean\")\n\n# 2. Permutation Test on Difference in Medians (Robust to outliers!)\nt_obs_med, p_perm_med, _ = run_permutation_test(control_data, treatment_data, num_permutations=10000, statistic_type=\"median\")\n\n# 3. Classical Student's t-test for comparison\nfrom scipy import stats\nt_stat, p_ttest = stats.ttest_ind(treatment_data, control_data, equal_var=False)\n\nprint(\"\\n=== Hypothesis Testing Results ===\")\nprint(f\"Student's Welch t-test:           Difference = £{np.mean(treatment_data) - np.mean(control_data):.2f} | p-value = {p_ttest:.4f}\")\nprint(f\"Permutation Test (Means):         Obs Diff   = £{t_obs_mean:.2f} | p-value = {p_perm_mean:.4f}\")\nprint(f\"Permutation Test (Medians):       Obs Diff   = £{t_obs_med:.2f} | p-value = {p_perm_med:.4f}\")\n\nalpha = 0.05\nprint(\"\\nConclusion at alpha = 0.05:\")\nprint(f\"  Permutation (Means):   {'Statistically Significant' if p_perm_mean < alpha else 'Fail to Reject H0'}\")\nprint(f\"  Permutation (Medians): {'Statistically Significant' if p_perm_med < alpha else 'Fail to Reject H0'}\")\n",
    keyPoints: [
      "Permutation tests generate exact, distribution-free p-values by shuffling group labels under the null hypothesis of exchangeability.",
      "Unlike parametric t-tests or ANOVA, permutation tests require no assumptions of normality, homoscedasticity, or large sample sizes.",
      "They allow testing arbitrary test statistics—including medians, percentiles, trimmed means, and custom revenue ratios.",
      "The Monte Carlo formulation with continuity correction (1 + extreme) / (B + 1) guarantees strict finite-sample Type I error control."
    ],
    pitfalls: [
      "Assuming permutation tests allow heteroscedasticity under general hypotheses: Under H_0, the entire outcome distribution must be invariant across groups, not just the mean.",
      "Forgetting the +1 continuity correction: Omitting the +1 can produce a p-value of exactly 0.0 when no permuted sample exceeds T_obs, which is theoretically invalid under finite B.",
      "High computational cost on large datasets: Reshuffling millions of rows 10,000 times is computationally prohibitive; in large samples, asymptotic tests or fast approximations should be used."
    ],
    quiz: [
      {
        "q": "What is the primary mathematical assumption required for a two-sample permutation test to be valid?",
        "o": [
          "Observations are exchangeable across groups under the null hypothesis H_0",
          "Data must follow a Gaussian bell curve",
          "Sample size must be greater than 1,000",
          "Variances of both groups must be known exactly in advance"
        ],
        "a": 0,
        "why": "The permutation test requires exchangeability: under H_0, swapping labels between observations does not alter their joint probability distribution."
      },
      {
        "q": "Why is the continuity correction (1 + extreme) / (B + 1) used when calculating Monte Carlo permutation p-values?",
        "o": [
          "Because treating the observed experimental dataset as an additional valid permutation guarantees strict Type I error control and prevents p-values from erroneously equaling zero",
          "Because Python arrays are zero-indexed",
          "To convert the test statistic from a float to an integer",
          "To correct for missing data in the control group"
        ],
        "a": 0,
        "why": "The observed test statistic is itself one valid permutation of the pooled data under H_0. Counting it (+1 in numerator and denominator) guarantees that E[p-value] under H_0 is uniform and non-zero."
      },
      {
        "q": "What major advantage do permutation tests offer over classical Student's t-tests in A/B testing?",
        "o": [
          "They do not assume normal distributions and can be computed on arbitrary non-linear statistics such as medians, percentiles, or ratios without deriving custom sampling distributions",
          "They guarantee that every test reaches statistical significance",
          "They eliminate the need for an A/B test control group",
          "They run in zero CPU cycles"
        ],
        "a": 0,
        "why": "Permutation tests construct the empirical null distribution by direct simulation, freeing analysts to test robust statistics (like medians or 95th percentiles) that have no closed-form analytical distribution."
      }
    ],
    usedBy: [],
    prereq: [
      "hypothesis-testing-and-p-values",
      "non-parametric-tests-mann-whitney-wilcoxon-kruskal-wallis"
    ],
    related: [
      "hypothesis-testing-and-p-values",
      "bootstrap-and-jackknife",
      "a-b-testing-end-to-end",
      "z-test-and-t-tests"
    ],
    keywords: "permutation tests randomisation tests exact test exchangeability non-parametric resampling monte carlo a b testing"
  },
  {
    id: "likelihood-ratio-wald-and-score-tests",
    short: "LR, Wald & Score Tests",
    title: "Likelihood-ratio, Wald and score tests",
    task: "concepts",
    module: "Hypothesis testing",
    level: 2,
    minutes: 20,
    noLab: true,
    summary: "The \"Holy Trinity\" of classical parametric hypothesis testing consists of the Likelihood-Ratio (LR) test, the Wald test, and the Score (Lagrange Multiplier / Rao) test. Derived from the geometry of the log-likelihood function \\ell(\\theta), all three tests evaluate null hypotheses of the form H_0: \\theta = \\theta_0 (or nested model restrictions) and share identical asymptotic chi-squared (\\chi^2) distributions under the null. However, they differ radically in computational cost: the Wald test requires fitting only the unconstrained model; the Score test requires fitting only the constrained model under H_0; and the Likelihood-Ratio test requires fitting both models, achieving optimal finite-sample invariance.",
    lead: "Suppose you want to test whether adding 5 interaction terms to a logistic regression model significantly improves its predictive power. Should you compare the drop in log-likelihood (Likelihood-Ratio test), check how many standard errors the estimated parameters sit from zero (Wald test), or evaluate the gradient slope at the restricted baseline without fitting the full model at all (Score test)? Understanding the geometric relationship and computational trade-offs among the \"Holy Trinity\" is essential for modern statistical inference and econometric modelling.",
    intuition: [
      "The Three Views of the Likelihood Surface: Imagine the log-likelihood curve \\ell(\\theta) plotted against parameter \\theta, with the unconstrained maximum likelihood estimate at the peak \\hat{\\theta}, and the restricted null value at \\theta_0:\n- Likelihood-Ratio (LR) Test: Looks at vertical height: how much lower is the log-likelihood at the null compared to the peak? 2 * [\\ell(\\hat{\\theta}) - \\ell(\\theta_0)].\n- Wald Test: Looks at horizontal distance: how far is \\hat{\\theta} from \\theta_0, weighted by the estimated curvature (Fisher Information) at the peak? (\\hat{\\theta} - \\theta_0)^2 * I(\\hat{\\theta}).\n- Score (Rao) Test: Looks at slope (gradient): how steep is the slope of the log-likelihood evaluated at the null point \\theta_0? If \\theta_0 were truly the maximum, the slope would be zero.",
      "Computational Asymmetry in Large Models:\n- When fitting the unconstrained model is trivial, the Wald test is fast and convenient (this is why software packages print Wald z-statistics next to every regression coefficient).\n- When the unconstrained model is massive, complex, or expensive to train (e.g. adding 10,000 genomic features), the Score test is brilliant because you never fit the full model! You only evaluate the gradient at the simple restricted baseline.\n- The Likelihood-Ratio test requires fitting both models, but achieves transformation invariance: reparameterising \\theta as log \\theta or e^\\theta leaves the LR test statistic identical, whereas the Wald test changes.",
      "Asymptotic Equivalence under the Null: Under H_0 as sample size n approaches infinity, Taylor expansions show that all three test statistics converge to the exact same value and follow a chi-squared distribution with degrees of freedom equal to the number of parameter restrictions: LR ~ W ~ S ~ \\chi^2(r)."
    ],
    analogy: "Imagine trying to verify whether the summit of a mountain \\hat{\\theta} is significantly higher than a base camp \\theta_0. The LR test measures the vertical elevation drop between the summit and the camp. The Wald test measures the horizontal walking distance from the summit to the camp and multiplies by the summit's terrain curvature. The Score test stands at the base camp and measures the steepness of the upward slope pointing toward the summit without ever hiking up to the top.",
    steps: [
      {
        "title": "Define unrestricted model and null hypothesis restrictions",
        "desc": "Formalise the unrestricted parameter vector \\theta and r linear or non-linear constraints H_0: h(\\theta) = 0.",
        "detail": "Determine the degrees of freedom r representing the dimensionality difference between unrestricted space \\Theta and restricted subspace \\Theta_0."
      },
      {
        "title": "Fit unconstrained and constrained models",
        "desc": "Obtain unrestricted MLE \\hat{\\theta} and restricted MLE \\tilde{\\theta}.",
        "detail": "Maximise log-likelihood \\ell(\\theta) freely to get \\hat{\\theta}. Maximise under the constraint H_0 to get \\tilde{\\theta}."
      },
      {
        "title": "Compute Likelihood-Ratio test statistic",
        "desc": "Calculate twice the difference in log-likelihood values: \\Lambda = 2[\\ell(\\hat{\\theta}) - \\ell(\\tilde{\\theta})].",
        "detail": "Evaluate log-likelihood at both optima. \\Lambda is strictly non-negative and invariant to continuous monotonic parameter transformations."
      },
      {
        "title": "Compute Wald and Score test statistics",
        "desc": "Calculate horizontal curvature distance (Wald) and gradient slope norm (Score).",
        "detail": "Wald: W = (\\hat{\\theta} - \\theta_0)^\\top [Var(\\hat{\\theta})]^{-1} (\\hat{\\theta} - \\theta_0). Score: S = U(\\tilde{\\theta})^\\top [I(\\tilde{\\theta})]^{-1} U(\\tilde{\\theta}), where U is the score vector \\nabla_\\theta \\ell."
      },
      {
        "title": "Evaluate p-values against Chi-Squared reference",
        "desc": "Compare test statistics against \\chi^2(r) distribution with r degrees of freedom.",
        "detail": "Compute p-value = P(\\chi^2(r) >= T). If p < \\alpha, reject the null hypothesis in favour of the unconstrained alternative."
      }
    ],
    math: [
      {
        "h": "Likelihood-Ratio (LR) Test Statistic",
        "tex": "\\text{LR} = 2 \\left[ \\ell(\\hat{\\theta}) - \\ell(\\tilde{\\theta}) \\right] \\xrightarrow{d} \\chi^2(r)",
        "p": "The Wilks theorem proves that twice the difference in log-likelihood between the unrestricted maximum \\hat{\\theta} and restricted maximum \\tilde{\\theta} converges asymptotically to a chi-squared distribution with degrees of freedom r equal to the number of restrictions."
      },
      {
        "h": "Wald Test Statistic",
        "tex": "W = (\\hat{\\theta} - \\theta_0)^\\top \\left[ \\widehat{\\text{Var}}(\\hat{\\theta}) \\right]^{-1} (\\hat{\\theta} - \\theta_0) = (\\hat{\\theta} - \\theta_0)^\\top \\mathcal{I}_n(\\hat{\\theta}) (\\hat{\\theta} - \\theta_0) \\xrightarrow{d} \\chi^2(r)",
        "p": "The Wald test evaluates the quadratic distance of the unconstrained estimate \\hat{\\theta} from the null hypothesis value \\theta_0, weighted by the observed Fisher Information matrix \\mathcal{I}_n(\\hat{\\theta}). It requires fitting only the unconstrained model."
      },
      {
        "h": "Score (Lagrange Multiplier / Rao) Test Statistic",
        "tex": "S = \\mathbf{U}(\\tilde{\\theta})^\\top \\left[ \\mathcal{I}_n(\\tilde{\\theta}) \\right]^{-1} \\mathbf{U}(\\tilde{\\theta}) \\xrightarrow{d} \\chi^2(r), \\qquad \\mathbf{U}(\\theta) = \\nabla_\\theta \\ell(\\theta)",
        "p": "The Score test evaluates the score vector (gradient) \\mathbf{U} evaluated at the restricted estimate \\tilde{\\theta}. If the null hypothesis is true, \\tilde{\\theta} is close to the true maximum, so the gradient \\mathbf{U}(\\tilde{\\theta}) should be statistically indistinguishable from zero."
      }
    ],
    code: "\"\"\"\nThe Holy Trinity of Hypothesis Testing: Likelihood-Ratio, Wald, and Score Tests\nDemonstrated on a Poisson Rate Parameter H0: lambda = lambda_0.\n\"\"\"\n\nimport numpy as np\nfrom scipy import stats\n\n# Generate synthetic Poisson count data\nnp.random.seed(42)\ntrue_lambda = 4.8\nn_obs = 60\ndata = np.random.poisson(lam=true_lambda, size=n_obs)\nsum_x = np.sum(data)\n\n# Null hypothesis: lambda = lambda_0\nlambda_0 = 4.0\n\n# 1. Unconstrained Maximum Likelihood Estimate\n# For Poisson: log L(lambda) = -n*lambda + sum_x * log(lambda) - sum(log(x!))\n# MLE lambda_hat = sum_x / n\nlambda_hat = sum_x / n_obs\n\n# Fisher Information: I_n(lambda) = n / lambda\n# Log-likelihood function (dropping constant factorial terms)\ndef log_lik(lam):\n    return -n_obs * lam + sum_x * np.log(lam)\n\n# 2. Likelihood-Ratio Test\n# LR = 2 * [log L(lambda_hat) - log L(lambda_0)]\nlr_stat = 2 * (log_lik(lambda_hat) - log_lik(lambda_0))\np_lr = 1 - stats.chi2.cdf(lr_stat, df=1)\n\n# 3. Wald Test\n# W = (lambda_hat - lambda_0)^2 * I_n(lambda_hat) = (lambda_hat - lambda_0)^2 * (n / lambda_hat)\ni_wald = n_obs / lambda_hat\nwald_stat = ((lambda_hat - lambda_0) ** 2) * i_wald\np_wald = 1 - stats.chi2.cdf(wald_stat, df=1)\n\n# 4. Score (Rao / LM) Test\n# Score U(lambda) = d log L / d lambda = -n + sum_x / lambda\n# Evaluated at lambda_0: U(lambda_0) = -n + sum_x / lambda_0\n# Score Stat = [U(lambda_0)]^2 / I_n(lambda_0) = (-n + sum_x / lambda_0)^2 / (n / lambda_0)\nscore_u0 = -n_obs + (sum_x / lambda_0)\ni_score0 = n_obs / lambda_0\nscore_stat = (score_u0 ** 2) / i_score0\np_score = 1 - stats.chi2.cdf(score_stat, df=1)\n\nprint(f\"=== Hypothesis Test: H0: lambda = {lambda_0:.1f} vs H1: lambda != {lambda_0:.1f} ===\")\nprint(f\"Sample Size n = {n_obs} | Sample Mean (MLE) = {lambda_hat:.3f} | Sample Sum = {sum_x}\")\nprint(f\"\\n1. Likelihood-Ratio (LR) Test: Stat = {lr_stat:.4f} | p-value = {p_lr:.4f}\")\nprint(f\"2. Wald Test:                  Stat = {wald_stat:.4f} | p-value = {p_wald:.4f}\")\nprint(f\"3. Score (Rao) Test:           Stat = {score_stat:.4f} | p-value = {p_score:.4f}\")\n\nprint(\"\\n--- Practical Invariance Check ---\")\nprint(\"All three test statistics are asymptotically equivalent under H0.\")\nprint(f\"Difference |LR - Wald|:  {abs(lr_stat - wald_stat):.4f}\")\nprint(f\"Difference |LR - Score|: {abs(lr_stat - score_stat):.4f}\")\nprint(\"At alpha = 0.05, conclusion across all three tests:\", \"REJECT H0\" if p_lr < 0.05 else \"FAIL TO REJECT H0\")\n",
    keyPoints: [
      "The Likelihood-Ratio, Wald, and Score tests form the 'Holy Trinity' of classical parametric testing, all asymptotically chi-squared under H_0.",
      "The LR test evaluates vertical log-likelihood difference, the Wald test evaluates horizontal parameter distance, and the Score test evaluates gradient slope at the null.",
      "Computational trade-offs: Wald requires fitting only the unconstrained model; Score requires fitting only the constrained model; LR requires fitting both.",
      "The Likelihood-Ratio test is invariant to parameter reparameterisation, whereas the Wald test can vary depending on parameter scaling."
    ],
    pitfalls: [
      "The Hauck-Donner effect in Wald tests: When parameters are very large or separation occurs, estimated standard errors explode faster than coefficients, causing Wald statistics to erroneously shrink toward zero.",
      "Assuming tests give identical finite-sample p-values: While asymptotically equivalent, their finite-sample numerical values often differ: typically Wald >= LR >= Score in linear regression.",
      "Ignoring boundary constraints: If the null hypothesis lies on the boundary of the parameter space (e.g. variance sigma^2 = 0), the asymptotic distribution is a mixture of chi-squared distributions, not a standard chi-squared."
    ],
    quiz: [
      {
        "q": "Which of the three classical tests requires estimating ONLY the constrained model under the null hypothesis H_0?",
        "o": [
          "The Score (Rao / Lagrange Multiplier) test",
          "The Wald test",
          "The Likelihood-Ratio test",
          "The Student's t-test"
        ],
        "a": 0,
        "why": "The Score test evaluates the slope (gradient) of the log-likelihood at the restricted parameter estimate \\tilde{\\theta}. It requires no estimation of the unconstrained model."
      },
      {
        "q": "What is the primary advantage of the Likelihood-Ratio test over the Wald test in non-linear models?",
        "o": [
          "The Likelihood-Ratio test is invariant to continuous monotonic reparameterisations of the model, whereas the Wald test statistic changes under non-linear transformations",
          "The Likelihood-Ratio test runs in O(1) time",
          "The Likelihood-Ratio test does not require the null hypothesis to be specified",
          "The Likelihood-Ratio test never rejects the null hypothesis"
        ],
        "a": 0,
        "why": "The height difference between the peak and restricted point on the likelihood surface is completely invariant to how parameters are scaled (e.g. \\theta vs \\log \\theta), whereas the curvature-weighted distance in Wald tests is sensitive to parameterisation."
      },
      {
        "q": "Under the null hypothesis H_0 with r independent parameter restrictions, what is the asymptotic distribution of the Likelihood-Ratio test statistic?",
        "o": [
          "A Chi-Squared distribution with r degrees of freedom, \\chi^2(r)",
          "A standard normal distribution \\mathcal{N}(0, 1)",
          "A Student's t-distribution with n-1 degrees of freedom",
          "A uniform distribution on [0, 1]"
        ],
        "a": 0,
        "why": "Wilks' theorem guarantees that 2[\\ell(\\hat{\\theta}) - \\ell(\\tilde{\\theta})] converges asymptotically to \\chi^2(r), where r is the number of parameter restrictions."
      }
    ],
    usedBy: [],
    prereq: [
      "hypothesis-testing-and-p-values",
      "maximum-likelihood-estimation"
    ],
    related: [
      "hypothesis-testing-and-p-values",
      "maximum-likelihood-estimation",
      "generalised-linear-models",
      "chi-square-tests"
    ],
    keywords: "likelihood ratio test wald test score test lagrange multiplier rao test wilks theorem holy trinity hypothesis testing"
  },
  {
    id: 'entropy-and-cross-entropy',
    short: 'Entropy and Cross-Entropy',
    title: r`Entropy and Cross-Entropy`,
    task: 'concepts',
    module: 'Information theory',
    level: 1,
    minutes: 16,
    noLab: true,
    summary: r`Quantify information content, uncertainty and coding cost with Shannon entropy, and optimise probabilistic classifiers using cross-entropy loss.`,
    lead: r`Information theory formalises uncertainty by measuring how many bits are required to encode events drawn from a probability distribution. Shannon entropy quantifies the intrinsic unpredictability of a system, while cross-entropy measures the expected coding length when events from a true distribution are encoded using an estimated model. Cross-entropy serves as the standard loss function for training modern classification models and neural networks.`,
    intuition: [
      r`Imagine receiving daily weather forecasts for the Sahara Desert in July, where it is sunny 99% of days and rains 1%. A message stating "Tomorrow will be sunny" carries almost zero surprise—you could have guessed it with 99% accuracy before opening the email. But a message stating "Tomorrow will rain" carries enormous surprise and high information value.`,
      r`Claude Shannon formalised this in 1948: an event with probability $p$ yields surprise (information content) proportional to $\log_2(1/p) = -\log_2(p)$ bits. A fair coin flip has $p = 0.5$, providing exactly $-\log_2(0.5) = 1$ bit of surprise. The expected surprise over all possible outcomes is the distribution's entropy $H(P)$. For a fair coin, entropy is $1.0$ bit (maximum uncertainty for two states). For a heavily biased coin with 90% heads and 10% tails, entropy drops to $-0.90\log_2(0.90) - 0.10\log_2(0.10) \approx 0.469$ bits. If a coin lands heads 100% of the time, entropy is $0$ bits—complete certainty.`,
      r`Now suppose the true coin has $P(\text{Heads}) = 0.90$, but a machine learning model predicts $Q(\text{Heads}) = 0.60$. If we design a communication code optimised for the model's beliefs $Q$, the average number of bits required to transmit outcomes from reality $P$ is the cross-entropy $H(P, Q) = -0.90\log_2(0.60) - 0.10\log_2(0.40) \approx 0.796$ bits. Notice that $0.796 > 0.469$: using the wrong probability model wastes $0.327$ bits per message. Minimising cross-entropy forces the model $Q$ to match ground reality $P$.`,
    ],
    analogy: r`Entropy is the minimum storage space required to pack an uncompressed file; cross-entropy is the actual storage consumed when you compress the file using a compression dictionary tailored for a different language.`,
    steps: [
      r`Define a discrete probability distribution $P$ over $K$ outcomes, ensuring non-negativity and $\sum p_k = 1$.`,
      r`Compute Shannon information content for each event: $I(x) = -\log_2(p(x))$ bits (or nats using natural logarithm).`,
      r`Calculate Shannon entropy $H(P) = -\sum p(x) \log p(x)$ as the expected information content across the distribution.`,
      r`For classification models predicting probabilities $Q$, compute cross-entropy $H(P, Q) = -\sum p(x) \log q(x)$.`,
      r`For one-hot ground truth labels where $p_c = 1$ for true class $c$, simplify cross-entropy to the negative log-likelihood $-\log q_c$.`,
      r`Compute gradients of cross-entropy loss with respect to model logits to train neural networks via gradient descent.`,
    ],
    math: [
      {
        h: 'Shannon Entropy',
        tex: r`$$H(P) = -\sum_{x \in \mathcal{X}} P(x) \log_2 P(x) = E_P[-\log_2 P(X)]$$`,
        p: r`Here $P(x)$ is the probability mass function. When using base 2 logarithm, entropy is measured in bits (shannons); when using natural logarithm $\ln$, it is measured in nats. For $K$ discrete outcomes, entropy is bounded: $0 \le H(P) \le \log_2 K$, achieving zero for deterministic events and maximum entropy for a uniform distribution.`,
      },
      {
        h: 'Cross-Entropy',
        tex: r`$$H(P, Q) = -\sum_{x \in \mathcal{X}} P(x) \log_2 Q(x) = E_P[-\log_2 Q(X)]$$`,
        p: r`Here $P(x)$ is the true reference distribution and $Q(x)$ is the approximating model distribution. Cross-entropy quantifies the average number of bits required to encode data from $P$ when using an encoding scheme optimised for $Q$. By Gibbs' inequality, $H(P, Q) \ge H(P)$, with equality if and only if $Q = P$.`,
      },
      {
        h: 'Categorical Cross-Entropy Loss in Machine Learning',
        tex: r`$$\mathcal{L}_{\text{CE}} = -\sum_{k=1}^K y_k \ln \hat{y}_k = -\ln \hat{y}_{\text{true}}$$`,
        p: r`In supervised classification, the ground truth distribution $\mathbf{y}$ is a one-hot vector where $y_c = 1$ for the true class and $y_k = 0$ for all $k \ne c$. Cross-entropy simplifies directly to the negative log-likelihood of the true class under model softmax predictions $\hat{\mathbf{y}}$, establishing that minimising cross-entropy is equivalent to maximum likelihood estimation.`,
      },
    ],
    keyPoints: [
      r`Entropy measures the fundamental unpredictability of a probability distribution; uniform distributions maximise entropy, while deterministic outcomes minimise it to zero.`,
      r`Cross-entropy measures the expected coding length when reality follows $P$ but messages are compressed using a model distribution $Q$.`,
      r`In machine learning, minimising cross-entropy loss is mathematically identical to maximising the likelihood of the training labels.`,
      r`The difference between cross-entropy and entropy is the Kullback–Leibler divergence: $H(P, Q) = H(P) + D_{\text{KL}}(P \parallel Q)$.`,
    ],
    pitfalls: [
      r`Taking the logarithm of zero when model predicted probabilities reach exact 0.0; always clamp probabilities with an epsilon $\epsilon \approx 10^{-15}$.`,
      r`Mixing up base 2 logarithms (bits) with natural logarithms (nats); machine learning libraries universally compute losses in nats.`,
      r`Confusing entropy with variance: high-variance continuous variables can have low differential entropy if concentrated into disjoint sharp spikes.`,
      r`Assuming cross-entropy is symmetric: $H(P, Q) \ne H(Q, P)$ because expectations are taken with respect to different reference distributions.`,
    ],
    code: r`import numpy as np

# True distribution P vs approximating model Q
p = np.array([0.70, 0.20, 0.10])
q = np.array([1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0])

# Shannon entropy H(P) in bits
entropy_p = -np.sum(p * np.log2(p))

# Cross-entropy H(P, Q) in bits
cross_entropy_pq = -np.sum(p * np.log2(q))
divergence_bits = cross_entropy_pq - entropy_p

# Binary cross-entropy in nats (standard ML classification loss)
y_true = np.array([1, 0, 1, 1])
y_prob = np.array([0.92, 0.15, 0.78, 0.65])
bce = -np.mean(y_true * np.log(y_prob) + (1 - y_true) * np.log(1.0 - y_prob))

print(f"Entropy H(P):         {entropy_p:.4f} bits")
print(f"Cross-Entropy H(P,Q): {cross_entropy_pq:.4f} bits")
print(f"Excess code length:   {divergence_bits:.4f} bits")
print(f"Sample Binary CE loss: {bce:.4f} nats")`,
    quiz: [
      {
        q: r`What probability distribution over $K$ discrete outcomes achieves the maximum possible Shannon entropy?`,
        o: [
          r`A deterministic distribution with probability 1.0 on a single state`,
          r`A uniform distribution where every outcome has probability $1/K$`,
          r`A Poisson distribution`,
          r`A Gaussian distribution`,
        ],
        a: 1,
        why: r`When all $K$ outcomes are equally likely, uncertainty is maximised and entropy reaches its upper bound $H(P) = \log_2 K$.`,
      },
      {
        q: r`Why is minimising categorical cross-entropy the standard objective for training classification neural networks?`,
        o: [
          r`Because cross-entropy ignores incorrect predictions`,
          r`Because minimising cross-entropy is mathematically equivalent to maximising the log-likelihood of the true classes`,
          r`Because cross-entropy is always strictly negative`,
          r`Because it eliminates the need for gradient descent`,
        ],
        a: 1,
        why: r`For one-hot target vectors, cross-entropy reduces to $-\ln \hat{y}_{\text{true}}$, which is the negative log-likelihood. Minimising it is exact maximum likelihood estimation.`,
      },
      {
        q: r`What is the relationship connecting entropy $H(P)$, cross-entropy $H(P, Q)$, and Kullback–Leibler divergence $D_{\text{KL}}(P \parallel Q)$?`,
        o: [
          r`$H(P, Q) = H(P) + D_{\text{KL}}(P \parallel Q)$`,
          r`$H(P, Q) = H(P) - D_{\text{KL}}(P \parallel Q)$`,
          r`$D_{\text{KL}}(P \parallel Q) = H(P) \times H(P, Q)$`,
          r`$H(P) = H(P, Q) + D_{\text{KL}}(P \parallel Q)$`,
        ],
        a: 0,
        why: r`Cross-entropy decomposes into the intrinsic entropy of reality $H(P)$ plus the inefficiency penalty $D_{\text{KL}}(P \parallel Q)$ caused by approximating $P$ with $Q$.`,
      },
      {
        q: r`If a fair coin flip has entropy $H = 1.0$ bit, what is the entropy of a completely rigged coin that always lands heads?`,
        o: [
          r`0.5 bits`,
          r`0 bits`,
          r`-1.0 bit`,
          r`Infinite bits`,
        ],
        a: 1,
        why: r`When an outcome is certain ($p = 1$), there is zero surprise: $-1 \log_2(1) = 0$ bits.`,
      },
    ],
    usedBy: ['logistic_regression', 'decision_tree_classifier'],
    prereq: ['random-variables-and-distributions', 'probability-rules-and-bayes-theorem'],
    related: ['kl-divergence', 'jensen-shannon-divergence', 'loss-functions'],
    keywords: 'entropy cross-entropy shannon information theory bits nats log-loss surprise uncertainty negative log-likelihood',
  },
  {
    id: 'kl-divergence',
    short: 'Kullback–Leibler Divergence',
    title: r`KL Divergence`,
    task: 'concepts',
    module: 'Information theory',
    level: 2,
    minutes: 17,
    noLab: true,
    summary: r`Measure the informational divergence and excess code length between probability distributions with relative entropy.`,
    lead: r`How much information is lost when an estimated probability distribution is substituted for ground truth? The Kullback–Leibler (KL) divergence, or relative entropy, quantifies the asymmetric statistical distance between two probability distributions over the same sample space. It acts as the mathematical cornerstone of variational autoencoders, Bayesian inference, and modern policy gradient reinforcement learning algorithms.`,
    intuition: [
      r`Imagine transmitting messages about daily financial market movements where the true probabilities are 70% Bull market, 20% Neutral, and 10% Bear market ($P = [0.70, 0.20, 0.10]$). The optimal Shannon code length for these true states requires an average of $H(P) = -0.7\log_2(0.7) - 0.2\log_2(0.2) - 0.1\log_2(0.1) \approx 1.157$ bits per message.`,
      r`Now suppose an inexperienced analyst assumes a uniform prior, believing all three outcomes are equally likely at 33.3% each ($Q = [1/3, 1/3, 1/3]$). If you build your transmission code using the analyst's uniform model $Q$, each outcome requires $-\log_2(1/3) \approx 1.585$ bits. When reality sends messages drawn from $P$, the expected message length is $1.585$ bits.`,
      r`The excess storage wasted per transmission is $1.585 - 1.157 = 0.428$ bits. This exact excess cost—the penalty for using an incorrect distribution $Q$ instead of true distribution $P$—is the Kullback–Leibler divergence $D_{\text{KL}}(P \parallel Q)$. Notice what happens if we reverse the roles: if reality were uniform $Q$, but we mistakenly coded with the analyst's skewed beliefs $P$, the penalty would be $D_{\text{KL}}(Q \parallel P) \approx 0.468$ bits. Because $0.428 \ne 0.468$, KL divergence is not a true mathematical distance metric: it is strictly asymmetric and violates the triangle inequality.`,
    ],
    analogy: r`KL divergence is like the fuel penalty of navigating a ship with an outdated nautical map: if the map slightly misjudges open waters the penalty is modest, but if the map assumes deep ocean where a reef exists, disaster strikes.`,
    steps: [
      r`Define discrete probability distributions $P$ and $Q$ over the identical support set $\mathcal{X}$.`,
      r`Verify absolute continuity: ensure $Q(x) > 0$ whenever $P(x) > 0$; if $P(x) > 0$ and $Q(x) = 0$, $D_{\text{KL}}$ is infinite.`,
      r`Calculate the log-likelihood ratio (information gain) for each state: $\ln(P(x) / Q(x))$.`,
      r`Compute the expected log-ratio under distribution $P$: $D_{\text{KL}}(P \parallel Q) = \sum P(x) \ln(P(x) / Q(x))$.`,
      r`Check Gibbs' inequality: verify that $D_{\text{KL}}(P \parallel Q) \ge 0$, with equality if and only if $P = Q$ almost everywhere.`,
      r`Use $D_{\text{KL}}$ to regularise model posteriors towards priors, such as in variational autoencoders and trust-region policy optimisation.`,
    ],
    math: [
      {
        h: 'Discrete and Continuous KL Divergence',
        tex: r`$$D_{\text{KL}}(P \parallel Q) = \sum_{x \in \mathcal{X}} P(x) \ln\left(\frac{P(x)}{Q(x)}\right) = \int_{-\infty}^{\infty} p(x) \ln\left(\frac{p(x)}{q(x)}\right) dx$$`,
        p: r`Here $P(x)$ is the true or target reference distribution and $Q(x)$ is the approximating distribution. KL divergence can be rewritten as the cross-entropy minus the entropy: $D_{\text{KL}}(P \parallel Q) = H(P, Q) - H(P)$. When using base 2 logarithms, the result is in bits; when using natural logarithms, it is in nats.`,
      },
      {
        h: 'Gibbs\' Inequality and Non-Negativity',
        tex: r`$$D_{\text{KL}}(P \parallel Q) \ge 0, \qquad D_{\text{KL}}(P \parallel Q) = 0 \iff P = Q \text{ almost everywhere}$$`,
        p: r`By Jensen's inequality and the strict convexity of $-\ln(t)$, $E_P[-\ln(Q/P)] \ge -\ln(E_P[Q/P]) = -\ln(1) = 0$. This fundamental property guarantees that approximating a distribution never reduces expected coding length below the true entropy.`,
      },
      {
        h: 'KL Divergence Between Univariate Gaussians',
        tex: r`$$D_{\text{KL}}\left(\mathcal{N}(\mu_1, \sigma_1^2) \parallel \mathcal{N}(\mu_2, \sigma_2^2)\right) = \ln\left(\frac{\sigma_2}{\sigma_1}\right) + \frac{\sigma_1^2 + (\mu_1 - \mu_2)^2}{2\sigma_2^2} - \frac{1}{2}$$`,
        p: r`For continuous Gaussian distributions, KL divergence has a closed-form analytic solution. In Variational Autoencoders (VAEs), this formula measures the divergence between an encoder's latent Gaussian posterior $\mathcal{N}(\mu, \sigma^2)$ and a standard Gaussian prior $\mathcal{N}(0, 1)$, simplifying to $\frac{1}{2}(\sigma^2 + \mu^2 - 1 - \ln \sigma^2)$.`,
      },
    ],
    keyPoints: [
      r`KL divergence measures the expected excess surprise or coding inefficiency of using distribution $Q$ to model reality $P$.`,
      r`KL divergence is strictly non-negative ($D_{\text{KL}} \ge 0$) and equals zero if and only if the two distributions are identical.`,
      r`KL divergence is asymmetric: $D_{\text{KL}}(P \parallel Q) \ne D_{\text{KL}}(Q \parallel P)$, meaning it cannot serve as a true distance metric.`,
      r`Forward KL ($D_{\text{KL}}(P \parallel Q)$) penalises $Q$ heavily where $P > 0$, forcing $Q$ to cover all modes (mean-seeking); reverse KL ($D_{\text{KL}}(Q \parallel P)$) penalises $Q > 0$ where $P = 0$, forcing $Q$ to concentrate on a single mode (mode-seeking).`,
    ],
    pitfalls: [
      r`Dividing by zero when $Q(x) = 0$ while $P(x) > 0$, causing divergence to explode to infinity.`,
      r`Treating KL divergence as a symmetric distance metric, causing errors in generative modelling and loss design.`,
      r`Confusing forward KL (zero-avoiding) with reverse KL (zero-forcing) in variational inference and policy optimisation.`,
      r`Overlooking that continuous KL divergence is invariant under coordinate reparameterisation, whereas differential entropy is coordinate-dependent.`,
    ],
    code: r`import numpy as np
import scipy.stats as stats

# Discrete distributions: true market states vs uniform belief
p = np.array([0.70, 0.20, 0.10])
q = np.array([1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0])

# Forward and reverse KL divergence in bits
kl_forward = stats.entropy(p, q, base=2)
kl_reverse = stats.entropy(q, p, base=2)

# Analytic KL divergence between two univariate Gaussians (nats)
mu1, sig1 = 0.0, 1.0
mu2, sig2 = 1.0, 1.5
kl_gauss = np.log(sig2 / sig1) + (sig1**2 + (mu1 - mu2)**2) / (2.0 * sig2**2) - 0.5

print(f"Forward KL D(P || Q): {kl_forward:.4f} bits")
print(f"Reverse KL D(Q || P): {kl_reverse:.4f} bits")
print(f"Asymmetry delta:      {abs(kl_forward - kl_reverse):.4f} bits")
print(f"Gaussian KL divergence: {kl_gauss:.4f} nats")`,
    quiz: [
      {
        q: r`Why is the Kullback–Leibler divergence not considered a true distance metric in mathematics?`,
        o: [
          r`Because it can take negative values`,
          r`Because it is asymmetric ($D_{\text{KL}}(P \parallel Q) \ne D_{\text{KL}}(Q \parallel P)$) and violates the triangle inequality`,
          r`Because it only applies to discrete distributions`,
          r`Because it requires continuous differentiability`,
        ],
        a: 1,
        why: r`A formal metric must be symmetric ($d(x,y)=d(y,x)$) and satisfy the triangle inequality ($d(x,z) \le d(x,y)+d(y,z)$). KL divergence violates both properties.`,
      },
      {
        q: r`What happens to $D_{\text{KL}}(P \parallel Q)$ if there exists an outcome $x$ where $P(x) > 0$ but $Q(x) = 0$?`,
        o: [
          r`It evaluates to 0`,
          r`It evaluates to $+\infty$`,
          r`It equals 1.0 bit`,
          r`It is undefined and defaults to $-1$`,
        ],
        a: 1,
        why: r`Because the formula involves $\ln(P(x) / Q(x))$, dividing a positive probability by zero causes the logarithm—and hence the divergence—to become infinite.`,
      },
      {
        q: r`In variational inference, how does minimising reverse KL divergence ($D_{\text{KL}}(Q \parallel P)$) affect the approximating distribution $Q$?`,
        o: [
          r`It forces $Q$ to spread out over all modes of $P$`,
          r`It acts as a mode-seeking objective, penalising $Q$ heavily whenever $Q > 0$ where $P \approx 0$, causing $Q$ to focus on a single dominant mode`,
          r`It turns $Q$ into a uniform distribution`,
          r`It prevents the model from updating parameters`,
        ],
        a: 1,
        why: r`Reverse KL penalises positive density in $Q$ where $P$ has low density, forcing $Q$ to compress tightly onto one of the major modes of $P$.`,
      },
      {
        q: r`What is the minimum possible value of the Kullback–Leibler divergence $D_{\text{KL}}(P \parallel Q)$?`,
        o: [
          r`$-\infty$`,
          r`$-1.0$`,
          r`0, achieved if and only if $P = Q$ almost everywhere`,
          r`0.5`,
        ],
        a: 2,
        why: r`Gibbs' inequality guarantees $D_{\text{KL}}(P \parallel Q) \ge 0$, with equality holding strictly if and only if $P$ and $Q$ are identical probability distributions.`,
      },
    ],
    usedBy: ['logistic_regression', 'decision_tree_classifier'],
    prereq: ['entropy-and-cross-entropy', 'probability-rules-and-bayes-theorem'],
    related: ['jensen-shannon-divergence', 'loss-functions', 'maximum-likelihood-estimation'],
    keywords: 'kl divergence kullback leibler relative entropy information divergence information theory asymmetry variational',
  },
  {
    id: 'jensen-shannon-divergence',
    short: 'Jensen–Shannon Divergence',
    title: r`Jensen–Shannon Divergence`,
    task: 'concepts',
    module: 'Information theory',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Establish symmetric, bounded statistical distances between probability distributions using mixture averages and the square-root metric property.`,
    lead: r`While the Kullback–Leibler divergence is fundamental to information theory, its asymmetry and unbounded nature create severe numerical instability when distributions have non-overlapping support. The Jensen–Shannon divergence (JSD) resolves these flaws by averaging KL divergences to a shared mixture distribution. Symmetrical, always finite, and bounded between 0 and 1, the square root of Jensen–Shannon divergence forms a true mathematical metric widely used in generative adversarial networks (GANs) and distribution drift monitoring.`,
    intuition: [
      r`Imagine auditing data drift between two model deployment environments. In training, user age follows distribution $P$; in production, user age follows distribution $Q$.`,
      r`If there is even a single age category present in production that never occurred in training (say, users aged 95+), $P(95+) = 0$ while $Q(95+) > 0$. If you compute the forward KL divergence $D_{\text{KL}}(Q \parallel P)$, the ratio $Q(x) / P(x)$ divides by zero, blowing the score up to infinity! A single rare event completely blinds the metric to how closely the remaining 99.9% of the distribution matches.`,
      r`The Jensen–Shannon divergence solves this by introducing a midpoint: the balanced mixture distribution $M = \frac{1}{2}(P + Q)$. Because $M$ contains half of $P$ and half of $Q$, $M(x)$ is strictly positive whenever either $P(x) > 0$ or $Q(x) > 0$. Neither distribution can ever divide by zero against $M$. JSD then measures the average divergence from both distributions to this midpoint: $\text{JSD}(P \parallel Q) = \frac{1}{2} D_{\text{KL}}(P \parallel M) + \frac{1}{2} D_{\text{KL}}(Q \parallel M)$. For our financial market example ($P = [0.70, 0.20, 0.10]$ and $Q = [1/3, 1/3, 1/3]$), $M = [0.517, 0.267, 0.217]$. The divergences to $M$ produce $\text{JSD} \approx 0.108$ bits. Taking the base 2 logarithm guarantees JSD is bounded between 0 (identical) and 1 bit (completely disjoint). Furthermore, $\sqrt{\text{JSD}}$ satisfies the triangle inequality, creating a true metric distance between probability distributions.`,
    ],
    analogy: r`If KL divergence is like measuring the elevation difference between two hikers on a mountain where one hiker cannot see the other's cliff, Jensen–Shannon divergence is like finding the exact halfway basecamp and measuring how far each hiker must walk to meet in the middle.`,
    steps: [
      r`Given two distributions $P$ and $Q$ over the same space, construct the equal-weight midpoint mixture $M = \frac{1}{2}(P + Q)$.`,
      r`Compute the forward KL divergence from $P$ to the mixture: $D_{\text{KL}}(P \parallel M)$.`,
      r`Compute the forward KL divergence from $Q$ to the mixture: $D_{\text{KL}}(Q \parallel M)$.`,
      r`Average the two divergences to obtain the Jensen–Shannon divergence: $\text{JSD}(P \parallel Q) = \frac{1}{2} D_{\text{KL}}(P \parallel M) + \frac{1}{2} D_{\text{KL}}(Q \parallel M)$.`,
      r`If using logarithm base 2, note that JSD is bounded in $[0, 1]$; if using natural logarithm $\ln$, JSD is bounded in $[0, \ln 2]$.`,
      r`Compute the Jensen–Shannon distance $\sqrt{\text{JSD}}$ whenever a true mathematical metric satisfying the triangle inequality is required.`,
    ],
    math: [
      {
        h: 'Jensen–Shannon Divergence Definition',
        tex: r`$$\text{JSD}(P \parallel Q) = \frac{1}{2} D_{\text{KL}}(P \parallel M) + \frac{1}{2} D_{\text{KL}}(Q \parallel M), \qquad M = \frac{1}{2}(P + Q)$$`,
        p: r`Here $M$ is the equal-weight mixture distribution. Because $M(x) > 0$ wherever either $P(x) > 0$ or $Q(x) > 0$, the ratio never divides by zero, ensuring JSD is always well-defined and finite even for distributions with disjoint supports. Furthermore, JSD is strictly symmetric: $\text{JSD}(P \parallel Q) = \text{JSD}(Q \parallel P)$.`,
      },
      {
        h: 'Entropy Formulation and Boundedness',
        tex: r`$$\text{JSD}(P \parallel Q) = H(M) - \frac{1}{2}\left[H(P) + H(Q)\right]$$`,
        p: r`JSD equals the Shannon entropy of the mixture distribution minus the average entropies of the individual distributions. By the strict concavity of Shannon entropy, $\text{JSD} \ge 0$, with equality if and only if $P = Q$. When measured in base 2 logarithm, JSD is bounded in $[0, 1]$ bit, reaching its theoretical maximum of $1.0$ bit when $P$ and $Q$ have completely disjoint support.`,
      },
      {
        h: 'The Jensen–Shannon Distance Metric',
        tex: r`$$d_{\text{JS}}(P, Q) = \sqrt{\text{JSD}(P \parallel Q)}$$`,
        p: r`In 2003, Endres and Schindelin proved that the square root of the Jensen–Shannon divergence satisfies the triangle inequality: $d_{\text{JS}}(P, R) \le d_{\text{JS}}(P, Q) + d_{\text{JS}}(Q, R)$. Combined with non-negativity, symmetry, and identity of indiscernibles, $d_{\text{JS}}$ forms a true mathematical metric.`,
      },
    ],
    keyPoints: [
      r`Jensen–Shannon divergence is strictly symmetric: $\text{JSD}(P \parallel Q) = \text{JSD}(Q \parallel P)$.`,
      r`JSD is bounded in $[0, 1]$ (when measured in bits) and remains finite even when distributions have completely disjoint support.`,
      r`The square root $\sqrt{\text{JSD}}$ is a valid mathematical metric satisfying the triangle inequality.`,
      r`The original formulation of Generative Adversarial Networks (Goodfellow et al., 2014) showed that an optimal discriminator minimax game is mathematically equivalent to minimising the Jensen–Shannon divergence between real and generated distributions.`,
    ],
    pitfalls: [
      r`Using natural logarithm instead of $\log_2$ and assuming the upper bound is 1.0 (with natural log $\ln$, the upper bound is $\ln 2 \approx 0.6931$).`,
      r`Forgetting that when distributions have disjoint support with zero overlap, JSD saturates at its maximum value (1.0), causing vanishing gradients in GAN training.`,
      r`Confusing JSD (which is not a metric, but a squared distance) with the Jensen–Shannon distance $\sqrt{\text{JSD}}$ (a true metric).`,
      r`Applying JSD to unnormalised weight vectors without ensuring $\sum p_i = 1$ and $\sum q_i = 1$.`,
    ],
    code: r`import numpy as np
import scipy.spatial.distance as dist
import scipy.stats as stats

p = np.array([0.70, 0.20, 0.10])
q = np.array([1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0])

# Midpoint mixture distribution M
m = 0.5 * (p + q)

# Jensen-Shannon divergence in bits
jsd = 0.5 * stats.entropy(p, m, base=2) + 0.5 * stats.entropy(q, m, base=2)

# Jensen-Shannon distance metric: sqrt(JSD)
js_distance = dist.jensenshannon(p, q, base=2)

# Completely disjoint distributions (maximal JSD)
p_disjoint = np.array([1.0, 0.0])
q_disjoint = np.array([0.0, 1.0])
m_disjoint = 0.5 * (p_disjoint + q_disjoint)
jsd_max = 0.5 * stats.entropy(p_disjoint, m_disjoint, base=2) + \
          0.5 * stats.entropy(q_disjoint, m_disjoint, base=2)

print(f"JSD(P || Q):          {jsd:.4f} bits")
print(f"JS distance metric:   {js_distance:.4f}")
print(f"Disjoint support JSD: {jsd_max:.4f} bits (bounded maximum = 1.0)")`,
    quiz: [
      {
        q: r`Why is the Jensen–Shannon divergence preferred over the Kullback–Leibler divergence for monitoring data drift in production pipelines?`,
        o: [
          r`Because JSD is always symmetric and stays finite even when new categories appear that had zero probability in training`,
          r`Because JSD requires only one distribution`,
          r`Because JSD does not use logarithms`,
          r`Because JSD cannot be computed on categorical data`,
        ],
        a: 0,
        why: r`If a production distribution has an outcome unseen in training, KL divergence divides by zero and explodes to infinity. JSD compares against the average mixture $M$, remaining bounded and stable.`,
      },
      {
        q: r`When calculated using base 2 logarithms, what is the maximum possible value of the Jensen–Shannon divergence $\text{JSD}(P \parallel Q)$?`,
        o: [
          r`$0.5$ bits`,
          r`$1.0$ bit`,
          r`$\infty$`,
          r`$\ln 2$ bits`,
        ],
        a: 1,
        why: r`When distributions $P$ and $Q$ have completely disjoint support (no shared non-zero states), $\text{JSD} = \log_2(2) = 1.0$ bit.`,
      },
      {
        q: r`Which mathematical transformation turns the Jensen–Shannon divergence into a true distance metric that satisfies the triangle inequality?`,
        o: [
          r`Taking the square root ($\sqrt{\text{JSD}}$)`,
          r`Squaring it ($\text{JSD}^2$)`,
          r`Multiplying by 2`,
          r`Inverting it ($1 / \text{JSD}$)`,
        ],
        a: 0,
        why: r`By the Endres–Schindelin theorem (2003), the square root of the Jensen–Shannon divergence satisfies the triangle inequality, making $\sqrt{\text{JSD}}$ a true metric.`,
      },
      {
        q: r`What issue arises in generative adversarial network (GAN) training when real and generated distributions have disjoint support under Jensen–Shannon divergence?`,
        o: [
          r`JSD becomes negative`,
          r`JSD saturates at its constant maximum (1.0 bit), yielding zero gradients and halting generator learning`,
          r`The discriminator loss oscillates uncontrollably`,
          r`The mixture distribution cannot be formed`,
        ],
        a: 1,
        why: r`When supports do not overlap, JSD is constantly 1.0 regardless of how far apart the distributions are in space, producing vanishing gradients that motivated Wasserstein GANs.`,
      },
    ],
    usedBy: ['clustering-metrics', 'decision_tree_classifier'],
    prereq: ['entropy-and-cross-entropy', 'kl-divergence'],
    related: ['clustering-metrics', 'loss-functions'],
    keywords: 'jensen shannon divergence jsd jensen shannon distance symmetric divergence information theory drift monitoring gans',
  },
  {
    id: 'mutual-information',
    short: 'Mutual Information',
    title: r`Mutual Information`,
    task: 'concepts',
    module: 'Information theory',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Measure linear and non-linear dependence between random variables using information gain and entropy reduction.`,
    lead: r`While Pearson correlation measures strictly linear associations and fails on curved dependencies, Mutual Information (MI) quantifies all forms of statistical dependence—linear, non-linear, and non-monotonic. Grounded in information theory, MI measures how much uncertainty about one random variable is eliminated by knowing the value of another. It serves as a foundational technique for non-linear feature selection, decision tree splitting, and representation learning.`,
    intuition: [
      r`Suppose you analyse the relationship between outdoor temperature $X$ and electricity demand $Y$. On freezing winter days and scorching summer days, electricity demand surges to power heating and air conditioning, while on mild spring days demand is low. The relationship forms a parabolic U-shape ($Y \approx X^2$).`,
      r`If you compute Pearson's linear correlation coefficient $r$, the positive slope on the hot side cancels out the negative slope on the cold side, yielding $r \approx -0.058$ ($p = 0.193$). An analyst relying solely on linear correlation would mistakenly conclude that temperature has zero statistical relationship with electricity demand!`,
      r`Mutual information avoids this blind spot entirely. It does not look for straight lines; it compares the joint distribution $P(X, Y)$ against the product of the marginals $P(X)P(Y)$ (what the joint distribution would look like if $X$ and $Y$ were completely independent). When temperature strongly dictates electricity demand, knowing $X$ removes substantial uncertainty from $Y$, yielding a high mutual information of $1.722$ bits. If two variables are truly statistically independent, $P(X, Y) = P(X)P(Y)$ everywhere, and mutual information drops to identically $0.0$ bits.`,
    ],
    analogy: r`Pearson correlation is like a rigid wooden ruler that can only measure straight paths; mutual information is like a flexible measuring tape that wraps around every curve and bend to measure true connection.`,
    steps: [
      r`Estimate the joint probability distribution $P(X, Y)$ and compute individual marginal distributions $P(X)$ and $P(Y)$.`,
      r`For continuous variables, discretise features into two-dimensional grid bins or employ $k$-nearest neighbours estimators.`,
      r`Compute the individual Shannon marginal entropies $H(X)$ and $H(Y)$.`,
      r`Compute the joint entropy $H(X, Y)$ or the conditional entropy $H(Y \mid X)$.`,
      r`Calculate mutual information: $I(X; Y) = H(X) + H(Y) - H(X, Y) = H(Y) - H(Y \mid X)$.`,
      r`Rank candidate explanatory features by mutual information with the target label to perform non-linear feature selection.`,
    ],
    math: [
      {
        h: 'Mutual Information Definition via KL Divergence',
        tex: r`$$I(X; Y) = D_{\text{KL}}\left(P(X, Y) \parallel P(X)P(Y)\right) = \sum_{x \in \mathcal{X}}\sum_{y \in \mathcal{Y}} P(x, y) \log_2\left(\frac{P(x, y)}{P(x)P(y)}\right)$$`,
        p: r`Here $P(x, y)$ is the joint probability mass function, and $P(x)P(y)$ is the product of independent marginal distributions. Mutual information measures the Kullback–Leibler divergence between joint reality and the independent null baseline. By Gibbs' inequality, $I(X; Y) \ge 0$, with equality holding if and only if $X$ and $Y$ are statistically independent.`,
      },
      {
        h: 'Entropy Decomposition and Symmetry',
        tex: r`$$I(X; Y) = H(X) - H(X \mid Y) = H(Y) - H(Y \mid X) = H(X) + H(Y) - H(X, Y)$$`,
        p: r`Here $H(Y)$ is the initial uncertainty in $Y$, and $H(Y \mid X)$ is the remaining uncertainty in $Y$ after observing $X$. Their difference represents the information gain about $Y$ provided by $X$. Because entropy Venn diagrams are symmetric, $I(X; Y) = I(Y; X)$.`,
      },
      {
        h: 'Continuous Mutual Information and Gaussian Equivalence',
        tex: r`$$I(X; Y) = -\frac{1}{2} \ln\left(1 - \rho^2\right) \quad \text{for jointly Gaussian variables}$$`,
        p: r`When $X$ and $Y$ follow a bivariate normal distribution with correlation coefficient $\rho$, mutual information is an exact monotonic function of $\rho^2$. For non-Gaussian variables, $I(X; Y) \ge -\frac{1}{2}\ln(1 - \rho^2)$, capturing higher-order non-linear associations that linear correlation misses.`,
      },
    ],
    keyPoints: [
      r`Mutual information detects all forms of statistical association, including non-linear, non-monotonic, and periodic relationships.`,
      r`$I(X; Y)$ is strictly non-negative and symmetric: $I(X; Y) = I(Y; X) \ge 0$, with $I(X; Y) = 0$ if and only if $X$ and $Y$ are independent.`,
      r`In decision trees, the information gain splitting criterion is mathematically identical to the mutual information between the candidate split feature and the target class.`,
      r`Unlike Pearson correlation, mutual information is invariant under any invertible, monotonic transformation of the variables.`,
    ],
    pitfalls: [
      r`Naive binning on continuous data: too few bins underestimates true dependence; too many bins overestimates MI due to finite-sample sampling noise.`,
      r`Expecting an upper bound of 1.0: unnormalised mutual information is bounded by $\min(H(X), H(Y))$; use normalised mutual information (NMI) if a $[0, 1]$ metric is required.`,
      r`Feature redundancy in greedy selection: picking top features by individual MI can select highly collinear duplicates; use minimum redundancy maximum relevance (mRMR).`,
      r`High computational cost: estimating high-dimensional joint mutual information suffers from the curse of dimensionality.`,
    ],
    code: r`import numpy as np
import scipy.stats as stats

rng = np.random.default_rng(42)
n = 500

# Parabolic non-linear relationship: Y = X^2 + noise
x = rng.uniform(-3.0, 3.0, size=n)
y = x**2 + rng.normal(loc=0.0, scale=0.5, size=n)

# 1. Pearson linear correlation (fails on non-linear curves)
r_val, p_r = stats.pearsonr(x, y)

# 2. Discrete mutual information via 2D binning (Shannon formula in bits)
bins = 12
hist_2d, _, _ = np.histogram2d(x, y, bins=bins)
p_xy = hist_2d / np.sum(hist_2d)
p_x = np.sum(p_xy, axis=1, keepdims=True)
p_y = np.sum(p_xy, axis=0, keepdims=True)

# I(X; Y) = sum P(x,y) * log2(P(x,y) / (P(x)*P(y)))
nonzero = p_xy > 0
mi_bits = np.sum(p_xy[nonzero] * np.log2(p_xy[nonzero] / (p_x @ p_y)[nonzero]))

print(f"Pearson correlation r: {r_val:.3f} (p-value: {p_r:.3f})")
print(f"Mutual Information:    {mi_bits:.3f} bits")`,
    quiz: [
      {
        q: r`Why does Pearson's correlation coefficient evaluate to approximately zero on a perfect parabolic relationship ($Y = X^2$ on $[-3, 3]$)?`,
        o: [
          r`Because parabolic data violates the central limit theorem`,
          r`Because the positive linear trend on $X > 0$ cancels out the negative linear trend on $X < 0$`,
          r`Because Pearson correlation can only be computed on positive values`,
          r`Because the variance of $Y$ is zero`,
        ],
        a: 1,
        why: r`Pearson correlation evaluates strictly linear slope. In symmetric U-shaped curves, positive and negative slopes cancel out, yielding $r \approx 0$ despite complete deterministic dependence.`,
      },
      {
        q: r`Under what condition is the mutual information $I(X; Y)$ strictly equal to zero?`,
        o: [
          r`When $X$ and $Y$ are statistically independent`,
          r`When $X$ and $Y$ have a negative linear correlation`,
          r`When $X$ and $Y$ follow standard normal distributions`,
          r`When the covariance of $X$ and $Y$ is positive`,
        ],
        a: 0,
        why: r`By definition, $I(X; Y) = D_{\text{KL}}(P(X, Y) \parallel P(X)P(Y))$. The divergence is zero if and only if $P(X, Y) = P(X)P(Y)$, which is the exact definition of statistical independence.`,
      },
      {
        q: r`In decision tree induction algorithms like ID3 and C4.5, what information-theoretic quantity corresponds to "information gain"?`,
        o: [
          r`Gini impurity difference`,
          r`Mutual information between the candidate split feature and the target label`,
          r`Kullback–Leibler divergence between tree branches`,
          r`Cramér's V statistic`,
        ],
        a: 1,
        why: r`Information gain is defined as $H(Y) - H(Y \mid X)$, which is mathematically identical to the mutual information $I(X; Y)$.`,
      },
      {
        q: r`What is the theoretical upper bound on the mutual information $I(X; Y)$ between two discrete random variables?`,
        o: [
          r`1.0 bit`,
          r`$\min(H(X), H(Y))$`,
          r`$H(X) + H(Y)$`,
          r`$\infty$ for any discrete variable`,
        ],
        a: 1,
        why: r`Because knowing $X$ cannot eliminate more uncertainty than exists in $X$ itself or in $Y$, $I(X; Y) \le \min(H(X), H(Y))$.`,
      },
    ],
    usedBy: ['decision_tree_classifier', 'feature-selection'],
    prereq: ['entropy-and-cross-entropy', 'kl-divergence', 'probability-rules-and-bayes-theorem'],
    related: ['correlation-pearson-spearman-kendall', 'feature-selection', 'decision_tree_classifier'],
    keywords: 'mutual information mi entropy information gain non-linear dependence feature selection ksg contingency table',
  },
  {
    id: "wasserstein-earth-movers-distance",
    short: "Wasserstein Distance",
    title: "Wasserstein (earth mover's) distance",
    task: "concepts",
    module: "Information theory",
    level: 2,
    minutes: 20,
    noLab: true,
    summary: "The Wasserstein distance (also known as the Earth Mover's Distance) measures the minimum work required to transform one probability distribution into another, defined as mass multiplied by physical ground distance. Unlike Kullback-Leibler (KL) divergence and Jensen-Shannon (JS) divergence, which collapse to infinite or constant values when probability distributions have non-overlapping supports, the Wasserstein distance provides a continuous, meaningful, and differentiable metric that reflects geometry in the underlying metric space. This geometric property makes the Wasserstein-1 metric fundamental to Optimal Transport, generative adversarial networks (WGAN), and domain adaptation.",
    lead: "Suppose you have two discrete point mass distributions: P has all its probability mass at position x=0, and Q_1 has all its mass at x=1, while Q_2 has all its mass at x=100. Standard information-theoretic metrics like KL divergence or Total Variation see no difference between these two scenarios: in both cases, the distributions do not overlap, yielding maximal divergence. But clearly Q_1 is vastly closer to P than Q_2 is! The Wasserstein distance fixes this fatal flaw by factoring in the physical metric distance that probability mass must travel.",
    intuition: [
      "The Dirt Pile Analogy (Earth Mover's Distance): Imagine distribution P is a pile of dirt spread across the ground, and distribution Q is an excavation hole of identical volume. The Wasserstein-1 distance W_1(P, Q) is the minimum mechanical work (mass multiplied by transport distance) required to shovel and transport the dirt from pile P until it fills hole Q.",
      "The Overlap Failure of KL and JS Divergences: In high-dimensional spaces (e.g. natural images), real data concentrates on low-dimensional manifolds. Two different manifolds in 1000-dimensional space almost never intersect. When supports do not overlap, KL divergence is infinite and JS divergence is constant log 2. Their gradients vanish everywhere, making neural network training impossible. The Wasserstein distance remains smooth, linear, and continuous regardless of overlap!",
      "Kantorovich-Rubinstein Duality: Computing optimal transport directly requires solving a linear programming problem over all joint couplings \\gamma(x, y). The Kantorovich-Rubinstein duality reveals a magical alternative: W_1(P, Q) equals the maximum expectation difference sup_{||f||_L <= 1} [E_P[f(x)] - E_Q[f(y)]] over all 1-Lipschitz functions! This is the exact objective optimised by the WGAN critic."
    ],
    analogy: "Imagine moving furniture between two apartments. KL divergence is like a strict landlord who only checks whether a sofa is sitting in the exact same centimetre in both apartments: if it is moved by even one inch, they declare the apartments 100% completely different. The Wasserstein distance is the moving company invoice: it charges you based on the physical weight of the sofa multiplied by how many miles the lorry had to drive to deliver it.",
    steps: [
      {
        "title": "Define ground metric space",
        "desc": "Establish physical distance metric d(x, y) (e.g. Euclidean distance |x - y|) over support space X.",
        "detail": "The ground metric defines the cost of transporting a unit of mass from location x to location y."
      },
      {
        "title": "Formulate primal optimal transport coupling",
        "desc": "Define set of joint probability distributions \\Pi(P, Q) whose marginals equal P and Q.",
        "detail": "Each coupling \\gamma(x, y) represents a transport plan specifying how much mass moves from x to y. Marginal constraints ensure no dirt is created or destroyed."
      },
      {
        "title": "Compute Wasserstein-1 distance in 1D via CDFs",
        "desc": "For one-dimensional distributions, evaluate the integrated absolute difference between cumulative distribution functions.",
        "detail": "Use the closed-form theorem: W_1(P, Q) = int |F_P(t) - F_Q(t)| dt. This avoids linear programming and calculates the exact optimal transport cost in O(N log N) time."
      },
      {
        "title": "Apply Kantorovich-Rubinstein dual formulation for high dimensions",
        "desc": "Frame transport cost as supremum over 1-Lipschitz continuous critic functions.",
        "detail": "Maximise E_{x ~ P}[f(x)] - E_{y ~ Q}[f(y)] subject to |f(x) - f(y)| <= d(x, y). Enforce the Lipschitz constraint via gradient penalty or weight clipping."
      },
      {
        "title": "Evaluate gradients for distribution alignment",
        "desc": "Compute continuous non-vanishing gradients to guide generative model parameters.",
        "detail": "Because W_1(P_\\theta, Q) provides meaningful linear gradients even when supports are completely disjoint, use its derivative to shift generated distributions toward target data."
      }
    ],
    math: [
      {
        "h": "Primal Wasserstein-p Distance Formulation",
        "tex": "W_p(P, Q) = \\left( \\inf_{\\gamma \\in \\Pi(P, Q)} \\mathbb{E}_{(x, y) \\sim \\gamma}\\left[ d(x, y)^p \\right] \\right)^{1/p}",
        "p": "Here \\Pi(P, Q) denotes the collection of all joint probability distributions (couplings) \\gamma(x, y) having marginals P and Q respectively. For p=1, W_1 is the standard Earth Mover's Distance."
      },
      {
        "h": "One-Dimensional Closed-Form via Cumulative Distribution Functions",
        "tex": "W_1(P, Q) = \\int_{-\\infty}^\\infty \\big| F_P(t) - F_Q(t) \\big| \\, dt = \\int_0^1 \\big| F_P^{-1}(u) - F_Q^{-1}(u) \\big| \\, du",
        "p": "In one dimension, optimal transport has a closed-form identity: the minimum cost equals the L_1 distance between the cumulative distribution functions F_P and F_Q, or equivalently, the integral of quantile function differences."
      },
      {
        "h": "Kantorovich-Rubinstein Duality",
        "tex": "W_1(P, Q) = \\sup_{\\|f\\|_L \\le 1} \\left( \\mathbb{E}_{x \\sim P}[f(x)] - \\mathbb{E}_{y \\sim Q}[f(y)] \\right)",
        "p": "The dual theorem reformulates the infimum over joint couplings into a supremum over 1-Lipschitz continuous functions \\|f\\|_L \\le 1. This enables deep neural networks (such as WGAN critics) to approximate the Wasserstein distance without combinatorial optimisation."
      }
    ],
    code: "\"\"\"\nWasserstein (Earth Mover's) Distance vs Kullback-Leibler (KL) Divergence\nDemonstrates 1D optimal transport, CDF integration, and linear gradient\nproperties under non-overlapping support translation.\n\"\"\"\n\nimport numpy as np\nfrom scipy import stats\n\ndef wasserstein_1d(samples_p: np.ndarray, samples_q: np.ndarray) -> float:\n    \"\"\"\n    Compute 1D Wasserstein-1 distance via sorted quantile differences.\n    O(N log N) closed-form optimal transport.\n    \"\"\"\n    p_sorted = np.sort(samples_p)\n    q_sorted = np.sort(samples_q)\n    # If sample sizes match, W_1 is simply mean absolute difference between sorted arrays\n    return float(np.mean(np.abs(p_sorted - q_sorted)))\n\n# Generate two 1D Gaussian distributions\n# P: N(0, 1), Q: N(delta, 1) as delta moves from 0 to 10\nnp.random.seed(42)\nn_samples = 5000\np_samples = np.random.normal(loc=0.0, scale=1.0, size=n_samples)\n\nprint(\"=== Demonstration: Wasserstein Distance vs Translation Delta ===\")\nprint(\"True analytical W_1 between N(0, 1) and N(delta, 1) is exactly |delta|.\\n\")\n\ndeltas = [0.0, 1.0, 2.5, 5.0, 10.0]\n\nfor delta in deltas:\n    q_samples = np.random.normal(loc=delta, scale=1.0, size=n_samples)\n    w1_dist = wasserstein_1d(p_samples, q_samples)\n    \n    # Analytical KL divergence between N(0, 1) and N(delta, 1): KL = delta^2 / 2\n    kl_div = 0.5 * (delta ** 2)\n    \n    print(f\"Shift delta = {delta:4.1f} | Empirical W_1 = {w1_dist:6.3f} (True: {delta:4.1f}) | KL Divergence = {kl_div:6.2f}\")\n\n# Discrete Optimal Transport via Linear Programming Demonstration\nprint(\"\\n=== Discrete Earth Mover's Distance on a Grid ===\")\n# Pile P at positions [0, 1, 2] with masses [0.5, 0.5, 0.0]\n# Hole Q at positions [0, 1, 2] with masses [0.0, 0.5, 0.5]\np_mass = np.array([0.5, 0.5, 0.0])\nq_mass = np.array([0.0, 0.5, 0.5])\n# Distance matrix between bins: |i - j|\ncost_matrix = np.array([\n    [0.0, 1.0, 2.0],\n    [1.0, 0.0, 1.0],\n    [2.0, 1.0, 0.0]\n])\n\n# Optimal plan: keep 0.5 at pos 1, move 0.5 from pos 0 to pos 2 (cost = 0.5 * 2 = 1.0)\n# Closed-form 1D discrete CDF:\ncdf_p = np.cumsum(p_mass)\ncdf_q = np.cumsum(q_mass)\ndiscrete_w1 = np.sum(np.abs(cdf_p - cdf_q))\n\nprint(f\"Distribution P masses: {p_mass}\")\nprint(f\"Distribution Q masses: {q_mass}\")\nprint(f\"Discrete 1D Wasserstein Cost: {discrete_w1:.3f} units of work\")\n",
    keyPoints: [
      "The Wasserstein distance measures the minimal work (mass * distance) required to morph one probability distribution into another.",
      "Unlike KL and JS divergences, the Wasserstein metric reflects the underlying geometry of metric space and remains continuous even when supports are completely disjoint.",
      "In one dimension, W_1 has an exact closed-form solution equal to the integrated absolute difference between cumulative distribution functions.",
      "The Kantorovich-Rubinstein duality converts the primal coupling problem into a supremum over 1-Lipschitz continuous critic functions, powering WGAN architectures."
    ],
    pitfalls: [
      "High computational complexity in multiple dimensions: Solving multi-dimensional discrete optimal transport scales cubically O(N^3) without Sinkhorn entropy regularisation.",
      "Violating the Lipschitz constraint in dual estimation: If the critic network in WGAN fails to maintain ||f||_L <= 1, the objective ceases to approximate the true Wasserstein distance.",
      "Assuming Wasserstein distance is dimensionless: W_1 inherits the physical units of the underlying sample space (e.g. metres, seconds, pixels), unlike unitless KL divergence."
    ],
    quiz: [
      {
        "q": "Why does the Wasserstein distance provide superior optimisation gradients compared to Jensen-Shannon divergence when training generative models?",
        "o": [
          "Because Wasserstein distance remains continuous, smooth, and informative even when generated and real data distributions reside on non-overlapping manifolds, avoiding vanishing gradients",
          "Because Wasserstein distance is always equal to zero",
          "Because Jensen-Shannon divergence cannot be computed on GPUs",
          "Because Wasserstein distance ignores data outliers completely"
        ],
        "a": 0,
        "why": "When distributions have disjoint supports, JS divergence saturates at log(2) with zero gradient. The Wasserstein distance grows linearly with physical separation distance, providing clean, non-vanishing gradients everywhere."
      },
      {
        "q": "In one dimension, what is the closed-form formulation for the Wasserstein-1 distance between two distributions P and Q?",
        "o": [
          "The integral of the absolute difference between their cumulative distribution functions: int |F_P(t) - F_Q(t)| dt",
          "The difference between their maximum values",
          "The ratio of their standard deviations",
          "The dot product of their probability density functions"
        ],
        "a": 0,
        "why": "For 1D distributions, optimal transport preserves monotonic quantile order, meaning W_1 is exactly equal to the area between the two cumulative distribution curves."
      },
      {
        "q": "What condition must the critic function f(x) satisfy in the Kantorovich-Rubinstein dual formulation of the Wasserstein-1 distance?",
        "o": [
          "It must be 1-Lipschitz continuous: |f(x) - f(y)| <= d(x, y) for all x and y",
          "It must integrate to zero across all space",
          "It must be strictly convex and positive everywhere",
          "It must have an inverse function"
        ],
        "a": 0,
        "why": "The Kantorovich-Rubinstein theorem proves that W_1(P, Q) is the supremum of E_P[f(x)] - E_Q[f(x)] over the family of 1-Lipschitz continuous functions."
      }
    ],
    usedBy: [],
    prereq: [
      "kl-divergence",
      "jensen-shannon-divergence"
    ],
    related: [
      "kl-divergence",
      "jensen-shannon-divergence",
      "total-variation-hellinger-and-bhattacharyya-distances",
      "entropy-and-cross-entropy"
    ],
    keywords: "wasserstein distance earth movers distance optimal transport kantorovich rubinstein duality wgan lipschitz continuity cdf coupling"
  },
  {
    id: "total-variation-hellinger-and-bhattacharyya-distances",
    short: "TV, Hellinger & Bhattacharyya",
    title: "Total variation, Hellinger and Bhattacharyya distances",
    task: "concepts",
    module: "Information theory",
    level: 2,
    minutes: 20,
    noLab: true,
    summary: "Total Variation distance, Hellinger distance, and Bhattacharyya distance form the foundational geometric family of probability metrics grounded in statistical distinguishability and f-divergences. While Total Variation quantifies the maximum possible difference in probability assigned to any measurable event, Hellinger distance provides a true metric on the unit Hilbert sphere via square-root density mappings, obeying the triangle inequality and establishing tight bounds on minimax estimation error via Le Cam's inequalities. The Bhattacharyya distance connects these metrics to optimal Bayes classification error bounds.",
    lead: "How different are two probability distributions, and what is the absolute worst-case error you could make if you used model Q instead of true distribution P? While KL divergence is asymmetric, unbounded, and violates the triangle inequality, Total Variation distance is bounded in [0, 1] and directly measures the maximum discrepancy across all possible events. Hellinger distance turns probability densities into Euclidean vectors on a sphere. Mastering these classical metrics provides the theoretical foundation for differential privacy, Markov chain convergence, and statistical minimax theory.",
    intuition: [
      "Total Variation as Maximum Disagreement: Suppose an auditor inspects two probability models P and Q. The auditor is allowed to pick any conceivable event A (e.g. \"tomorrow's temperature exceeds 30C\"). The Total Variation distance D_TV(P, Q) is the maximum possible difference |P(A) - Q(A)| the auditor could ever find. If D_TV = 0.05, the two models will never differ by more than 5 percentage points on any forecast.",
      "Hellinger Distance as Sphere Geometry: Probability densities integrate to 1: int p(x) dx = 1. If we take the square root sqrt(p(x)), then int (sqrt(p(x)))^2 dx = 1. This means sqrt(p(x)) is a unit vector on an infinite-dimensional hypersphere! The Hellinger distance is simply the standard Euclidean distance between these two square-root unit vectors, scaled by 1/sqrt(2). Because it is an actual metric space distance, it satisfies symmetry and the triangle inequality!",
      "The Bhattacharyya Affinity: The inner product between the two square-root vectors is the Bhattacharyya coefficient rho(P, Q) = int sqrt(p(x) q(x)) dx in [0, 1]. If the distributions are identical, rho = 1; if they have disjoint supports, rho = 0. The Bhattacharyya distance -log rho provides an upper bound on Bayes classification error.",
      "Le Cam's Inequalities and Minimax Rates: In statistical decision theory, Le Cam's lemmas prove that the ability of any algorithm to distinguish between two hypothetical data distributions is fundamentally bounded by their Total Variation and Hellinger distances: H^2(P, Q) <= D_TV(P, Q) <= sqrt(2) * H(P, Q)."
    ],
    analogy: "Think of two light beams shining through stained glass. Total Variation is the maximum difference in brightness you could see through any filter. Hellinger distance treats each light beam as an arrow pointing to the surface of a globe, measuring the straight-line physical distance between the two arrow tips through 3D space.",
    steps: [
      {
        "title": "Evaluate point-wise absolute density difference",
        "desc": "Compute |p(x) - q(x)| across the support space.",
        "detail": "Total Variation evaluates L_1 norm discrepancy: D_TV(P, Q) = 0.5 * int |p(x) - q(x)| dx. It is bounded in [0, 1]."
      },
      {
        "title": "Compute the Bhattacharyya affinity coefficient",
        "desc": "Calculate the overlap integral of square-root densities \\rho(P, Q) = int \\sqrt{p(x) q(x)} dx.",
        "detail": "The affinity \\rho \\in [0, 1] acts as a cosine similarity between square-root density vectors on the unit sphere."
      },
      {
        "title": "Derive the Hellinger distance",
        "desc": "Compute H^2(P, Q) = 1 - \\rho(P, Q).",
        "detail": "Verify metric properties: non-negativity, symmetry H(P, Q) = H(Q, P), identity of indiscernibles, and triangle inequality H(P, R) <= H(P, Q) + H(Q, R)."
      },
      {
        "title": "Calculate the Bhattacharyya distance and Bayes error bound",
        "desc": "Compute D_B(P, Q) = -\\ln \\rho(P, Q) and assess classification separability.",
        "detail": "Establish upper bound on minimum Bayes misclassification error: P_error <= 0.5 * exp(-D_B)."
      },
      {
        "title": "Verify Le Cam's sandwich inequalities",
        "desc": "Confirm H^2 <= D_TV <= \\sqrt{2 H^2 (1 - H^2/2)}.",
        "detail": "These inequalities guarantee that bounding Hellinger distance automatically controls Total Variation distance."
      }
    ],
    math: [
      {
        "h": "Total Variation Distance Formulation",
        "tex": "D_{\\text{TV}}(P, Q) = \\sup_{A \\in \\mathcal{F}} \\big| P(A) - Q(A) \\big| = \\frac{1}{2} \\int_{\\mathcal{X}} \\big| p(x) - q(x) \\big| \\, dx = \\frac{1}{2} \\|p - q\\|_1",
        "p": "Total Variation is the supremum difference over all measurable events A. It equals half the L_1 distance between the densities, bounded in [0, 1], where 0 indicates identical distributions and 1 indicates mutually singular distributions with disjoint supports."
      },
      {
        "h": "Squared Hellinger Distance and Bhattacharyya Coefficient",
        "tex": "H^2(P, Q) = \\frac{1}{2} \\int_{\\mathcal{X}} \\left( \\sqrt{p(x)} - \\sqrt{q(x)} \\right)^2 dx = 1 - \\int_{\\mathcal{X}} \\sqrt{p(x) q(x)} \\, dx = 1 - \\rho(P, Q)",
        "p": "The Hellinger distance is a true metric satisfying the triangle inequality. The quantity \\rho(P, Q) = \\int \\sqrt{p(x) q(x)} \\, dx is the Bhattacharyya affinity coefficient. For product distributions P = \\prod P_i and Q = \\prod Q_i, the affinity factorises multiplicatively: \\rho(P, Q) = \\prod \\rho(P_i, Q_i)."
      },
      {
        "h": "Le Cam's Sandwich Inequalities",
        "tex": "H^2(P, Q) \\le D_{\\text{TV}}(P, Q) \\le H(P, Q) \\sqrt{2 - H^2(P, Q)} \\le \\sqrt{2} H(P, Q)",
        "p": "Le Cam's inequalities connect Total Variation and Hellinger distance. Because Hellinger distance factorises cleanly across independent observations, it is widely used to prove minimax lower bounds in statistical estimation."
      }
    ],
    code: "\"\"\"\nTotal Variation, Hellinger, and Bhattacharyya Distances\nCalculates exact distances for Gaussian distributions and verifies\nLe Cam's bounding inequalities.\n\"\"\"\n\nimport numpy as np\n\ndef compute_distances_gaussian(mu1: float, sig1: float, mu2: float, sig2: float):\n    \"\"\"\n    Compute analytical Bhattacharyya, Hellinger, and numerical Total Variation\n    between two univariate Gaussians N(mu1, sig1^2) and N(mu2, sig2^2).\n    \"\"\"\n    v1, v2 = sig1**2, sig2**2\n    \n    # 1. Bhattacharyya Distance for 1D Gaussians\n    # D_B = (1/4) * ln( (1/4)*(v1/v2 + v2/v1 + 2) ) + (1/4) * ( (mu1 - mu2)^2 / (v1 + v2) )\n    term1 = 0.25 * np.log(0.25 * (v1/v2 + v2/v1 + 2.0))\n    term2 = 0.25 * ((mu1 - mu2)**2 / (v1 + v2))\n    d_bhattacharyya = term1 + term2\n    \n    # Bhattacharyya affinity rho = exp(-D_B)\n    rho = np.exp(-d_bhattacharyya)\n    \n    # 2. Hellinger Distance: H^2 = 1 - rho\n    h_squared = 1.0 - rho\n    h_distance = np.sqrt(h_squared)\n    \n    # 3. Total Variation Distance via numerical integration\n    x_grid = np.linspace(min(mu1 - 4*sig1, mu2 - 4*sig2), max(mu1 + 4*sig1, mu2 + 4*sig2), 20000)\n    dx = x_grid[1] - x_grid[0]\n    p_dens = (1.0 / (np.sqrt(2 * np.pi) * sig1)) * np.exp(-0.5 * ((x_grid - mu1) / sig1)**2)\n    q_dens = (1.0 / (np.sqrt(2 * np.pi) * sig2)) * np.exp(-0.5 * ((x_grid - mu2) / sig2)**2)\n    tv_distance = 0.5 * np.sum(np.abs(p_dens - q_dens)) * dx\n    \n    return {\n        \"bhattacharyya_dist\": round(d_bhattacharyya, 4),\n        \"affinity_rho\": round(rho, 4),\n        \"hellinger_squared\": round(h_squared, 4),\n        \"hellinger_dist\": round(h_distance, 4),\n        \"total_variation\": round(tv_distance, 4),\n    }\n\n# Experiment: P ~ N(0, 1), Q ~ N(mu, 1) as mu shifts\nprint(\"=== Metric Comparison for N(0, 1) vs N(mu, 1) ===\")\nfor mu in [0.0, 0.5, 1.0, 2.0, 3.5]:\n    m = compute_distances_gaussian(0.0, 1.0, mu, 1.0)\n    h2 = m[\"hellinger_squared\"]\n    tv = m[\"total_variation\"]\n    upper_bound = np.sqrt(2 * h2)\n    print(f\"Shift mu = {mu:3.1f} | TV: {tv:6.4f} | H^2: {h2:6.4f} | Bhattacharyya: {m['bhattacharyya_dist']:6.4f}\")\n    print(f\"    Le Cam Bounds Check: H^2 ({h2:.4f}) <= TV ({tv:.4f}) <= sqrt(2)*H ({upper_bound:.4f}) -> {h2 <= tv <= upper_bound + 1e-4}\")\n",
    keyPoints: [
      "Total Variation distance quantifies the maximum possible difference in probability assigned to any measurable event, bounded in [0, 1].",
      "Hellinger distance is a true metric obeying the triangle inequality, measuring Euclidean distance between square-root density vectors on the unit Hilbert sphere.",
      "The Bhattacharyya distance directly establishes an upper bound on the minimum Bayes classification error rate.",
      "Le Cam's inequalities tightly sandwich Total Variation between H^2 and sqrt(2)*H, enabling minimax sample complexity proofs."
    ],
    pitfalls: [
      "Confusing Total Variation with total variance: Total Variation is a bounded probability divergence, whereas variance measures second-order dispersion around the mean.",
      "Assuming Bhattacharyya distance satisfies the triangle inequality: The Bhattacharyya distance -ln(\\rho) is not a true metric (it violates the triangle inequality); only Hellinger distance is a true metric.",
      "Overlooking product factorisation: For multi-dimensional independent variables, the Bhattacharyya affinity \\rho factorises as a simple product, making Hellinger distance vastly easier to compute than Total Variation."
    ],
    quiz: [
      {
        "q": "What is the maximum possible value of the Total Variation distance between two probability distributions?",
        "o": [
          "1.0 (indicating that the distributions have completely disjoint supports and disagree with certainty on some event)",
          "Positive infinity",
          "0.5",
          "2.0"
        ],
        "a": 0,
        "why": "Total Variation is defined as the supremum difference in event probabilities |P(A) - Q(A)|. Since probabilities are bounded in [0, 1], D_TV is strictly bounded in [0, 1]."
      },
      {
        "q": "Why is Hellinger distance preferred over KL divergence in statistical minimax lower bound proofs?",
        "o": [
          "Because Hellinger distance is a true metric that satisfies the triangle inequality and factorises cleanly over independent product distributions",
          "Because Hellinger distance is always equal to 1",
          "Because KL divergence cannot be computed for Gaussian distributions",
          "Because Hellinger distance does not require integration"
        ],
        "a": 0,
        "why": "KL divergence is asymmetric and violates the triangle inequality. Hellinger distance is a genuine metric on the unit sphere whose affinity factorises multiplicatively across independent dimensions, facilitating Le Cam's minimax bounds."
      },
      {
        "q": "How does the Bhattacharyya distance D_B relate to the minimum achievable Bayes classification error rate?",
        "o": [
          "It provides an analytical upper bound on the Bayes error: P_error <= 0.5 * exp(-D_B)",
          "It is equal to the training set accuracy",
          "It guarantees zero false positives",
          "It has no relation to classification error"
        ],
        "a": 0,
        "why": "The Bhattacharyya bound is a celebrated result in statistical pattern recognition: the probability of misclassification under the optimal Bayes classifier is bounded above by (1/2) * exp(-D_B)."
      }
    ],
    usedBy: [],
    prereq: [
      "entropy-and-cross-entropy",
      "kl-divergence"
    ],
    related: [
      "wasserstein-earth-movers-distance",
      "kl-divergence",
      "jensen-shannon-divergence",
      "hypothesis-testing-and-p-values"
    ],
    keywords: "total variation hellinger distance bhattacharyya distance le cam inequalities f-divergence probability metrics bayes error"
  },
  {
    id: 'ols-inference-t-tests-f-test-r2-and-adjusted-r2',
    short: 'OLS Inference: t, F & R-Squared',
    title: r`OLS Inference: t-Tests, F-Test, R² and Adjusted R²`,
    task: 'concepts',
    module: 'Regression inference',
    level: 1,
    minutes: 18,
    noLab: true,
    summary: r`Conduct rigorous hypothesis tests on regression coefficients with t-tests, evaluate overall model significance with the F-test, and penalise overfitting with adjusted R².`,
    lead: r`Fitting an ordinary least squares (OLS) regression line is only the first step in linear modelling. To determine whether estimated slopes represent genuine population relationships rather than sampling noise, we must perform statistical inference. Individual coefficient t-tests evaluate specific predictors, the omnibus F-test assesses whether the model explains more variance than a simple average, and adjusted R² prevents the deceptive inflation of goodness-of-fit as redundant variables are added.`,
    intuition: [
      r`Suppose an analyst fits an OLS regression predicting house prices using three features: square footage, number of bedrooms, and the homeowner's lucky lottery number. Least squares outputs estimated slopes: square footage has $\hat{\beta}_1 = 3.350$ (£3,350 per unit), bedrooms has $\hat{\beta}_2 = 12.901$ (£12,900 per bedroom), and lucky number has $\hat{\beta}_3 = -0.031$.`,
      r`Did the owner's lucky number genuinely influence property price? The estimated slope is $-0.031$, but its standard error is $0.036$. Dividing the coefficient by its standard error gives a $t$-statistic of $t = -0.856$, producing a p-value of $p = 0.394$. Because this p-value is far above the conventional significance threshold $\alpha = 0.05$, we fail to reject the null hypothesis $\beta_3 = 0$ and conclude that lucky number has zero statistical relationship with house prices. Conversely, square footage achieves $t = 25.91$ ($p < 10^{-15}$), demonstrating an overwhelmingly reliable effect.`,
      r`Next, look at the overall model: the coefficient of determination $R^2$ indicates that the model accounts for $90.7\%$ of total price variance ($R^2 = 0.907$). However, least squares mathematically guarantees that adding any extra variable—even pure random noise—will never decrease $R^2$. Adjusted $R^2$ corrects for this by penalising model complexity: for our model, adjusted $R^2$ is $0.904$. Finally, the omnibus $F$-test evaluates whether all three predictors jointly explain significant variance compared to an intercept-only baseline: an $F$-statistic of $310.4$ ($p < 10^{-15}$) decisively rejects the global null hypothesis.`,
    ],
    analogy: r`The coefficient t-test is like interviewing individual job candidates to verify each person pulls their weight; the omnibus F-test checks whether the team as a whole beats random noise; and adjusted R² penalises the manager for hiring unnecessary staff.`,
    steps: [
      r`Fit the OLS regression model $\mathbf{y} = \mathbf{X}\boldsymbol{\beta} + \boldsymbol{\epsilon}$ via normal equations: $\hat{\boldsymbol{\beta}} = (\mathbf{X}^T\mathbf{X})^{-1}\mathbf{X}^T\mathbf{y}$.`,
      r`Compute the residual variance estimate $s^2 = \frac{\mathbf{e}^T\mathbf{e}}{n - p - 1}$ and the covariance matrix $\widehat{\text{Var}}(\hat{\boldsymbol{\beta}}) = s^2 (\mathbf{X}^T\mathbf{X})^{-1}$.`,
      r`Extract standard errors $\text{SE}(\hat{\beta}_j) = s\sqrt{[(\mathbf{X}^T\mathbf{X})^{-1}]_{jj}}$ and compute $t$-statistics $t_j = \hat{\beta}_j / \text{SE}(\hat{\beta}_j)$ with $n - p - 1$ degrees of freedom.`,
      r`Calculate the unadjusted coefficient of determination $R^2 = 1 - SS_{\text{res}} / SS_{\text{tot}}$.`,
      r`Calculate adjusted $R^2 = 1 - \left(1 - R^2\right)\frac{n - 1}{n - p - 1}$ to penalise over-parameterisation.`,
      r`Compute the omnibus $F$-statistic $F = \frac{(SS_{\text{tot}} - SS_{\text{res}}) / p}{SS_{\text{res}} / (n - p - 1)}$ to assess the collective significance of all predictors.`,
    ],
    math: [
      {
        h: 'Coefficient t-Statistic and Standard Errors',
        tex: r`$$t_j = \frac{\hat{\beta}_j - 0}{\text{SE}(\hat{\beta}_j)} = \frac{\hat{\beta}_j}{s \sqrt{[(\mathbf{X}^T\mathbf{X})^{-1}]_{jj}}} \sim t(n - p - 1)$$`,
        p: r`Here $\hat{\beta}_j$ is the estimated slope, $s = \sqrt{SS_{\text{res}} / (n - p - 1)}$ is the residual standard error, and $[(\mathbf{X}^T\mathbf{X})^{-1}]_{jj}$ is the $j$-th diagonal element of the inverted Gram matrix. Under the null hypothesis $H_0: \beta_j = 0$, $t_j$ follows Student's $t$-distribution with $n - p - 1$ degrees of freedom ($n$ observations, $p$ predictors, 1 intercept).`,
      },
      {
        h: 'R-Squared and Adjusted R-Squared',
        tex: r`$$R^2 = 1 - \frac{SS_{\text{res}}}{SS_{\text{tot}}}, \qquad R_{\text{adj}}^2 = 1 - \left(1 - R^2\right)\frac{n - 1}{n - p - 1}$$`,
        p: r`Here $SS_{\text{res}} = \sum (y_i - \hat{y}_i)^2$ is the residual sum of squares and $SS_{\text{tot}} = \sum (y_i - \bar{y})^2$ is the total sum of squares. Unadjusted $R^2$ measures the proportion of variance explained by the model, but monotonically increases whenever a new feature is added. Adjusted $R^2$ divides sums of squares by their degrees of freedom, increasing only if the added feature improves model fit by more than expected by chance ($t^2 > 1$).`,
      },
      {
        h: 'Omnibus F-Statistic',
        tex: r`$$F = \frac{(SS_{\text{tot}} - SS_{\text{res}}) / p}{SS_{\text{res}} / (n - p - 1)} = \frac{R^2 / p}{(1 - R^2) / (n - p - 1)} \sim F(p, \, n - p - 1)$$`,
        p: r`The omnibus $F$-test evaluates the joint null hypothesis $H_0: \beta_1 = \beta_2 = \dots = \beta_p = 0$ against the alternative that at least one coefficient is non-zero. It tests whether the regression model as a whole explains significantly more variance than a flat horizontal line through the sample mean.`,
      },
    ],
    keyPoints: [
      r`Individual $t$-tests assess the marginal contribution of each predictor given that all other predictors are already included in the model.`,
      r`$R^2$ never decreases when adding variables; adjusted $R^2$ penalises degrees of freedom to protect against spurious model complexity.`,
      r`The omnibus $F$-test guards against false discovery by evaluating whether all explanatory variables jointly explain significant outcome variance.`,
      r`In the presence of multicollinearity, the omnibus $F$-test can be highly significant even if no individual $t$-test achieves significance.`,
    ],
    pitfalls: [
      r`Mistaking high $R^2$ for causal validity: an overfitted model with 50 irrelevant polynomial terms can achieve $R^2 > 0.98$ while failing completely on new data.`,
      r`Interpreting a non-significant $t$-test as proof that a feature has no relationship with $Y$; collinearity with another feature can inflate standard errors.`,
      r`Comparing unadjusted $R^2$ values across models with different numbers of predictors.`,
      r`Trusting standard OLS p-values when errors are heteroscedastic or serially correlated, which violates Gauss–Markov assumptions.`,
    ],
    code: r`import numpy as np
import scipy.stats as stats

rng = np.random.default_rng(42)
n = 100
p = 3

# Predict house prices using sqft (x1), bedrooms (x2), and lucky number (x3)
x1 = rng.uniform(10.0, 40.0, size=n)
x2 = rng.integers(1, 6, size=n)
x3 = rng.uniform(1.0, 100.0, size=n)  # Pure noise variable
y = 50.0 + 3.5 * x1 + 12.0 * x2 + rng.normal(0.0, 10.0, size=n)

# OLS normal equations: beta = (X^T X)^(-1) X^T y
X = np.column_stack([np.ones(n), x1, x2, x3])
beta = np.linalg.inv(X.T @ X) @ X.T @ y
residuals = y - X @ beta

# Inference: standard errors, t-statistics, p-values
s2 = np.sum(residuals**2) / (n - p - 1)
se_beta = np.sqrt(np.diag(s2 * np.linalg.inv(X.T @ X)))
t_stats = beta / se_beta
p_vals = 2.0 * (1.0 - stats.t.cdf(np.abs(t_stats), df=n - p - 1))

# Goodness-of-fit: R2, Adjusted R2, F-statistic
ss_tot = np.sum((y - np.mean(y))**2)
ss_res = np.sum(residuals**2)
r2 = 1.0 - ss_res / ss_tot
r2_adj = 1.0 - (ss_res / (n - p - 1)) / (ss_tot / (n - 1))
f_stat = ((ss_tot - ss_res) / p) / (ss_res / (n - p - 1))

print(f"R2: {r2:.3f}, Adjusted R2: {r2_adj:.3f}, F-stat: {f_stat:.1f}")
print(f"SqFt:   beta={beta[1]:.3f}, SE={se_beta[1]:.3f}, t={t_stats[1]:.2f}, p={p_vals[1]:.4e}")
print(f"Lucky:  beta={beta[3]:.3f}, SE={se_beta[3]:.3f}, t={t_stats[3]:.2f}, p={p_vals[3]:.3f}")`,
    quiz: [
      {
        q: r`Why does adding a completely random noise feature to a linear regression model always increase (or leave unchanged) the unadjusted $R^2$?`,
        o: [
          r`Because random noise always correlates with the target variable`,
          r`Because least squares minimises residual sum of squares over an expanded parameter space, making $SS_{\text{res}}$ weakly decrease`,
          r`Because degrees of freedom increase`,
          r`Because the F-statistic forces $R^2$ upward`,
        ],
        a: 1,
        why: r`Adding any column to $\mathbf{X}$ gives least squares an extra dimension to fit the training points, so $SS_{\text{res}}$ cannot increase and $R^2 = 1 - SS_{\text{res}} / SS_{\text{tot}}$ never decreases.`,
      },
      {
        q: r`What does a non-significant coefficient t-test ($p = 0.45$) for predictor $X_1$ strictly indicate in a multiple regression model?`,
        o: [
          r`$X_1$ has zero correlation with the response variable $Y$`,
          r`Given the other predictors already in the model, $X_1$ provides no statistically significant marginal explanatory power`,
          r`The entire regression model is statistically invalid`,
          r`$X_1$ should be replaced with its logarithm`,
        ],
        a: 1,
        why: r`Regression $t$-tests measure marginal significance conditioned on all other included variables; $X_1$ might have strong univariate correlation with $Y$, but be redundant in the presence of other features.`,
      },
      {
        q: r`Under what condition does adding a new explanatory variable cause the adjusted $R^2$ to increase?`,
        o: [
          r`Whenever the new variable has a positive slope`,
          r`Only when the new variable's individual $t$-statistic has $|t| > 1$`,
          r`Whenever sample size $n > 100$`,
          r`Adjusted $R^2$ always increases when features are added`,
        ],
        a: 1,
        why: r`Mathematically, adjusted $R^2$ increases if and only if the absolute $t$-statistic of the added variable exceeds 1.0 (or its partial $F$-statistic exceeds 1.0).`,
      },
      {
        q: r`In an OLS regression with 100 observations and 3 predictors (plus intercept), how many degrees of freedom does the residual variance estimator possess?`,
        o: [
          r`100`,
          r`97`,
          r`96`,
          r`3`,
        ],
        a: 2,
        why: r`Residual degrees of freedom are $n - p - 1 = 100 - 3 - 1 = 96$, where $p = 3$ is the number of predictors and 1 accounts for the intercept.`,
      },
    ],
    usedBy: ['ols_linear_regression', 'polynomial_regression', 'regression-metrics'],
    prereq: ['hypothesis-testing-and-p-values', 'z-test-and-t-tests', 'anova-and-post-hoc-tests'],
    related: ['ols_linear_regression', 'residual-diagnostics-and-heteroscedasticity', 'multicollinearity-and-vif'],
    keywords: 'ols linear regression inference t-test f-test r-squared adjusted r-squared coefficients standard errors p-value',
  },
  {
    id: 'residual-diagnostics-and-heteroscedasticity',
    short: 'Residuals & Heteroscedasticity',
    title: r`Residual Diagnostics and Heteroscedasticity`,
    task: 'concepts',
    module: 'Regression inference',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Diagnose regression failure modes with residual plots, detect non-constant variance using the Breusch–Pagan test, and correct inference with robust standard errors.`,
    lead: r`The Gauss–Markov theorem guarantees that ordinary least squares estimators are the Best Linear Unbiased Estimator (BLUE) only when errors are homoscedastic and uncorrelated. When residual variance expands or contracts across predictor ranges (heteroscedasticity), OLS coefficient estimates remain unbiased, but standard errors become severely distorted, invalidating confidence intervals and hypothesis tests. Systematic residual diagnostics and White's heteroscedasticity-consistent standard errors restore valid statistical inference.`,
    intuition: [
      r`Imagine predicting annual household expenditure on restaurant dining based on household income. For families earning £25,000 per year, dining spending is tightly constrained between £500 and £1,500 (small error variance). For affluent families earning £250,000 per year, dining spending varies wildly: some families cook gourmet meals at home and spend £2,000, while others dine out constantly and spend £30,000 (huge error variance).`,
      r`If you plot residuals ($y - \hat{y}$) against fitted values $\hat{y}$, the points do not form a uniform horizontal band. Instead, they fan outward like an opening megaphone—classic heteroscedasticity.`,
      r`What is the danger? Standard OLS assumes every single data point has identical error variance $\sigma^2$. It treats high-income households (where noise is £15,000) with the exact same credibility as low-income households (where noise is £300). While the estimated slope is still unbiased on average, the standard OLS formula underestimates the true standard error, producing artificially narrow confidence intervals and falsely low p-values. A formal test like the Breusch–Pagan test regresses squared residuals against predictors: if variance scales with income, it yields a significant chi-square statistic ($p < 0.001$). Switching to Huber–White heteroscedasticity-robust standard errors (HC1) corrects the standard error without needing to throw away the linear model.`,
    ],
    analogy: r`Fitting standard OLS under heteroscedasticity is like judging an archer's skill on windy days and calm days equally: it mistakes erratic, windblown shots for reliable evidence unless you account for changing conditions.`,
    steps: [
      r`Fit the OLS regression model and compute raw residuals $e_i = y_i - \hat{y}_i$.`,
      r`Plot residuals against fitted values $\hat{y}_i$ to visually check for non-linearity (curved patterns) and heteroscedasticity (fan shapes).`,
      r`Plot standardised residuals against theoretical normal quantiles (Q-Q plot) to check for heavy-tailed or skewed errors.`,
      r`Perform the Breusch–Pagan test: regress squared residuals $e_i^2$ on predictors and compute the LM test statistic $n R^2 \sim \chi^2(p)$.`,
      r`If heteroscedasticity is detected, compute Huber–White heteroscedasticity-consistent (HC) sandwich covariance matrices (e.g. HC1).`,
      r`Alternatively, apply variance-stabilising transforms (such as $\log y$) or Weighted Least Squares (WLS) if variance weights are known.`,
    ],
    math: [
      {
        h: 'The Homoscedasticity Assumption vs Heteroscedasticity',
        tex: r`$$\text{Homoscedasticity: } \text{Var}(\epsilon_i \mid \mathbf{x}_i) = \sigma^2, \qquad \text{Heteroscedasticity: } \text{Var}(\epsilon_i \mid \mathbf{x}_i) = \sigma_i^2$$`,
        p: r`Under homoscedasticity, the covariance matrix of disturbances is $\boldsymbol{\Sigma} = \sigma^2 \mathbf{I}$, producing the classic textbook variance formula $\text{Var}(\hat{\boldsymbol{\beta}}) = \sigma^2 (\mathbf{X}^T\mathbf{X})^{-1}$. Under heteroscedasticity, the diagonal elements $\sigma_i^2$ vary, turning the true variance into the sandwich form $(\mathbf{X}^T\mathbf{X})^{-1}\mathbf{X}^T\boldsymbol{\Sigma}\mathbf{X}(\mathbf{X}^T\mathbf{X})^{-1}$.`,
      },
      {
        h: 'The Breusch–Pagan Lagrange Multiplier Test',
        tex: r`$$e_i^2 = \gamma_0 + \gamma_1 x_{i1} + \dots + \gamma_p x_{ip} + u_i \implies \text{LM} = n R_{e^2}^2 \sim \chi^2(p)$$`,
        p: r`The Breusch–Pagan test fits an auxiliary regression of squared residuals $e_i^2$ on the original predictors. Under the null hypothesis of homoscedasticity ($H_0: \gamma_1 = \dots = \gamma_p = 0$), the sample size $n$ multiplied by the auxiliary determination coefficient $R_{e^2}^2$ converges asymptotically to a chi-square distribution with $p$ degrees of freedom.`,
      },
      {
        h: 'Huber–White Heteroscedasticity-Consistent (HC1) Standard Errors',
        tex: r`$$\widehat{\text{Var}}_{\text{HC1}}(\hat{\boldsymbol{\beta}}) = \frac{n}{n - p - 1} (\mathbf{X}^T\mathbf{X})^{-1} \left(\sum_{i=1}^n e_i^2 \mathbf{x}_i \mathbf{x}_i^T\right) (\mathbf{X}^T\mathbf{X})^{-1}$$`,
        p: r`The White sandwich estimator places squared sample residuals along the diagonal of the central "meat" matrix. Multiplying by degrees-of-freedom correction $\frac{n}{n - p - 1}$ yields HC1. This estimator converges asymptotically to the true covariance matrix without requiring knowledge of the functional form of heteroscedasticity.`,
      },
    ],
    keyPoints: [
      r`Heteroscedasticity does not bias OLS slope estimates; it invalidates standard error formulas, making confidence intervals and p-values untrustworthy.`,
      r`Residual-versus-fitted scatter plots serve as the primary diagnostic: homoscedastic errors display an even horizontal cloud with constant vertical spread.`,
      r`The Breusch–Pagan test provides an objective hypothesis test for linear variance dependence on predictors.`,
      r`Huber–White robust standard errors (HC1) fix inferential hypothesis testing without altering point estimates or discarding data.`,
    ],
    pitfalls: [
      r`Believing that heteroscedasticity makes regression coefficients biased; coefficients remain completely unbiased and consistent.`,
      r`Throwing away linear regression models upon detecting heteroscedasticity instead of reporting heteroscedasticity-robust standard errors.`,
      r`Running standard Breusch–Pagan tests on non-normal errors without Koenker's studentisation, which inflates false positive rates.`,
      r`Confusing non-linearity with heteroscedasticity: an omitted quadratic term often produces both a curved residual pattern and apparent variance changes.`,
    ],
    code: r`import numpy as np
import scipy.stats as stats

rng = np.random.default_rng(42)
n = 150

# Heteroscedastic data: error variance scales proportionally with x
x = rng.uniform(1.0, 10.0, size=n)
y = 2.0 + 3.0 * x + rng.normal(0.0, 0.8 * x, size=n)
X = np.column_stack([np.ones(n), x])

# OLS point estimates
beta = np.linalg.inv(X.T @ X) @ X.T @ y
e = y - X @ beta

# 1. Breusch-Pagan test for heteroscedasticity
e2 = e**2
beta_aux = np.linalg.inv(X.T @ X) @ X.T @ e2
r2_aux = 1.0 - np.sum((e2 - X @ beta_aux)**2) / np.sum((e2 - np.mean(e2))**2)
lm_stat = n * r2_aux
p_bp = 1.0 - stats.chi2.cdf(lm_stat, df=1)

# 2. Standard OLS SE vs Huber-White HC1 robust SE
cov_ols = (np.sum(e**2) / (n - 2)) * np.linalg.inv(X.T @ X)
cov_hc1 = (n / (n - 2)) * np.linalg.inv(X.T @ X) @ (X.T @ np.diag(e2) @ X) @ np.linalg.inv(X.T @ X)

se_ols = np.sqrt(np.diag(cov_ols))[1]
se_hc1 = np.sqrt(np.diag(cov_hc1))[1]

print(f"Breusch-Pagan LM: {lm_stat:.2f} (p-value: {p_bp:.4e})")
print(f"Slope beta_1:     {beta[1]:.3f}")
print(f"Standard OLS SE:  {se_ols:.3f}")
print(f"Robust HC1 SE:    {se_hc1:.3f}")`,
    quiz: [
      {
        q: r`What is the primary statistical consequence of ignoring heteroscedasticity in an OLS regression model?`,
        o: [
          r`The estimated regression coefficients become biased and inconsistent`,
          r`Standard errors are computed incorrectly, invalidating t-tests, confidence intervals, and p-values`,
          r`The model cannot compute fitted values`,
          r`The $R^2$ becomes negative`,
        ],
        a: 1,
        why: r`OLS coefficient estimates remain unbiased under heteroscedasticity, but the textbook formula for $\text{Var}(\hat{\boldsymbol{\beta}})$ is wrong, distorting standard errors and hypothesis tests.`,
      },
      {
        q: r`How does a classic residual-versus-fitted values plot look when heteroscedasticity is present?`,
        o: [
          r`A uniform rectangular band with constant vertical thickness`,
          r`A widening cone or funnel shape where vertical scatter expands across fitted values`,
          r`A single straight 45-degree diagonal line`,
          r`A circle centered at the origin`,
        ],
        a: 1,
        why: r`A widening cone (megaphone shape) indicates that error variance is not constant, but scales with the magnitude of predictions.`,
      },
      {
        q: r`What does the Breusch–Pagan test evaluate?`,
        o: [
          r`Whether the errors are normally distributed`,
          r`Whether squared residuals can be predicted by the independent variables, indicating non-constant variance`,
          r`Whether two predictors are collinear`,
          r`Whether the true relationship is non-linear`,
        ],
        a: 1,
        why: r`The Breusch–Pagan test regresses squared residuals on the explanatory variables; a significant $R^2$ demonstrates that error variance depends on predictor values.`,
      },
      {
        q: r`How do Huber–White robust standard errors (HC1) resolve the problem of heteroscedasticity?`,
        o: [
          r`They delete outliers from the dataset`,
          r`They recalculate the parameter covariance matrix using a sandwich estimator that provides asymptotically consistent standard errors without changing point estimates`,
          r`They force residuals to follow a normal distribution`,
          r`They apply a polynomial transformation to $Y$`,
        ],
        a: 1,
        why: r`Huber–White sandwich estimators substitute squared sample residuals into the covariance calculation, restoring consistent standard errors without altering regression coefficients.`,
      },
    ],
    usedBy: ['ols_linear_regression', 'robust_regression'],
    prereq: ['ols-inference-t-tests-f-test-r2-and-adjusted-r2', 'normality-tests-shapiro-wilk-kolmogorov-smirnov-anderson-darling'],
    related: ['ols_linear_regression', 'multicollinearity-and-vif', 'robust_regression'],
    keywords: 'residual diagnostics heteroscedasticity breusch pagan test robust standard errors huber white hc1 sandwich estimator homoscedasticity',
  },
  {
    id: 'multicollinearity-and-vif',
    short: 'Multicollinearity & VIF',
    title: r`Multicollinearity and VIF`,
    task: 'concepts',
    module: 'Regression inference',
    level: 2,
    minutes: 17,
    noLab: true,
    summary: r`Diagnose redundant predictor correlations in regression models using the Variance Inflation Factor and condition indices.`,
    lead: r`When two or more explanatory variables in a multiple regression model are strongly correlated with each other, ordinary least squares faces multicollinearity. While multicollinearity does not reduce the model's overall predictive capacity, it inflates coefficient variances dramatically, turning regression estimates erratic, unstable, and uninterpretable. The Variance Inflation Factor (VIF) quantifies how much parameter variance is magnified by linear dependencies among predictors.`,
    intuition: [
      r`Imagine an athletic trainer building a regression model to predict sprinting speed using two features: left leg length and right leg length. Naturally, an athlete's left leg and right leg lengths are almost perfectly correlated ($r = 0.957$).`,
      r`When both variables enter the regression simultaneously, least squares attempts to answer: "What is the effect of lengthening the left leg while keeping the right leg length strictly fixed?" Because this scenario is physically impossible in the data, the algorithm cannot partition credit between the two limbs. The model might assign $+15.0$ to the left leg and $-14.2$ to the right leg. The overall model predicts sprint speed reasonably well, but the standard errors on both coefficients balloon dramatically. Both $t$-statistics drop to near zero, giving non-significant p-values.`,
      r`An analyst inspecting the p-values might naively conclude that neither leg matters for sprinting! This is the essence of multicollinearity. It does not mean the features lack predictive power; it means the features share redundant information, making it impossible to isolate individual effects. The Variance Inflation Factor (VIF) measures how much the variance of an estimated slope is inflated compared to when predictors are orthogonal. A VIF of 1 means zero collinearity; a VIF of 11.77 means variance is inflated nearly twelve-fold. Dropping one redundant leg from the model instantly collapses VIF and restores stable, significant estimates.`,
    ],
    analogy: r`Multicollinearity is like two singers harmonizing into the exact same microphone: the audience hears a rich sound, but the sound engineer cannot determine which singer was singing louder.`,
    steps: [
      r`Examine the pairwise correlation matrix of all predictors to identify obvious bivariate correlations ($|r| > 0.8$).`,
      r`For each predictor $X_j$, fit an auxiliary OLS regression predicting $X_j$ from all remaining $p - 1$ predictors.`,
      r`Extract the auxiliary determination coefficient $R_j^2$ from the auxiliary regression.`,
      r`Compute the Variance Inflation Factor: $\text{VIF}_j = \frac{1}{1 - R_j^2}$.`,
      r`Evaluate VIF against diagnostic thresholds: $\text{VIF} = 1$ is orthogonal, $\text{VIF} > 5$ warrants caution, and $\text{VIF} > 10$ indicates severe, harmful multicollinearity.`,
      r`Remediate collinearity: remove redundant features, combine correlated features via dimensionality reduction, or apply ridge regularisation.`,
    ],
    math: [
      {
        h: 'Variance Inflation Factor Formula',
        tex: r`$$\text{Var}(\hat{\beta}_j) = \frac{\sigma^2}{(n - 1)s_j^2} \cdot \frac{1}{1 - R_j^2} = \frac{\sigma^2}{(n - 1)s_j^2} \cdot \text{VIF}_j$$`,
        p: r`Here $\sigma^2$ is the residual variance, $s_j^2$ is the sample variance of predictor $X_j$, and $R_j^2$ is the coefficient of determination obtained by regressing $X_j$ on all other predictors. $\text{VIF}_j$ directly measures the factor by which the variance of $\hat{\beta}_j$ is multiplied due to correlation with other explanatory variables.`,
      },
      {
        h: 'Tolerance and Condition Number',
        tex: r`$$\text{Tolerance}_j = \frac{1}{\text{VIF}_j} = 1 - R_j^2, \qquad \kappa(\mathbf{X}^T\mathbf{X}) = \sqrt{\frac{\lambda_{\max}}{\lambda_{\min}}}$$`,
        p: r`Tolerance expresses the fraction of variance in $X_j$ that is unique and independent of all other predictors; a tolerance below $0.10$ signifies $\text{VIF} > 10$. The condition number $\kappa$ evaluates the ratio of maximum to minimum eigenvalues of $\mathbf{X}^T\mathbf{X}$; $\kappa > 30$ indicates severe ill-conditioning and numerical instability in matrix inversion.`,
      },
      {
        h: 'Regularisation as a Collinearity Remedy',
        tex: r`$$\hat{\boldsymbol{\beta}}_{\text{ridge}} = \left(\mathbf{X}^T\mathbf{X} + \lambda \mathbf{I}\right)^{-1}\mathbf{X}^T\mathbf{y}$$`,
        p: r`When predictors are collinear, $\mathbf{X}^T\mathbf{X}$ is nearly singular with eigenvalues near zero, causing $(\mathbf{X}^T\mathbf{X})^{-1}$ to explode. Ridge regression adds a positive constant $\lambda$ along the diagonal, bounding eigenvalues away from zero and dramatically contracting parameter variance.`,
      },
    ],
    keyPoints: [
      r`Multicollinearity does not bias OLS slope estimates or reduce overall $R^2$; it inflates standard errors and makes individual coefficients erratic and uninterpretable.`,
      r`High pairwise correlation signals collinearity, but multi-variable collinearity can also emerge from linear combinations of three or more variables with low pairwise correlations.`,
      r`VIF quantifies the degree of variance inflation; $\text{VIF} > 10$ is the standard empirical threshold denoting severe collinearity.`,
      r`Regularisation techniques like [[ridge_regression]] directly resolve multicollinearity by trading small bias for large variance reduction.`,
    ],
    pitfalls: [
      r`Dropping important control variables from a causal model without verifying whether their omission creates omitted variable bias.`,
      r`Relying exclusively on pairwise correlation matrices, failing to detect multi-variable collinearity where $X_1 \approx X_2 + X_3$.`,
      r`Believing that multicollinearity degrades out-of-sample prediction accuracy when test data follows the same joint predictor distribution.`,
      r`Confusing multicollinearity (linear dependence among features) with high correlation between features and the target label.`,
    ],
    code: r`import numpy as np
import scipy.stats as stats

rng = np.random.default_rng(42)
n = 100

# Collinear features x1 and x2 (r ~ 0.968) and independent feature x3
x1 = rng.normal(loc=10.0, scale=2.0, size=n)
x2 = x1 + rng.normal(loc=0.0, scale=0.5, size=n)
x3 = rng.normal(loc=5.0, scale=1.5, size=n)

X_all = np.column_stack([x1, x2, x3])
vifs = []

# Compute VIF for each predictor via auxiliary regressions
for j in range(3):
    y_aux = X_all[:, j]
    X_others = np.column_stack([np.ones(n), np.delete(X_all, j, axis=1)])
    b_aux = np.linalg.inv(X_others.T @ X_others) @ X_others.T @ y_aux
    res_aux = y_aux - X_others @ b_aux
    r2_j = 1.0 - np.sum(res_aux**2) / np.sum((y_aux - np.mean(y_aux))**2)
    vifs.append(1.0 / (1.0 - r2_j))

r_12, _ = stats.pearsonr(x1, x2)
print(f"Pairwise correlation r(x1, x2): {r_12:.3f}")
print(f"VIF x1: {vifs[0]:.2f} (severe collinearity)")
print(f"VIF x2: {vifs[1]:.2f} (severe collinearity)")
print(f"VIF x3: {vifs[2]:.2f} (orthogonal)")`,
    quiz: [
      {
        q: r`What is the primary consequence of multicollinearity in an ordinary least squares regression?`,
        o: [
          r`The model's overall $R^2$ collapses to zero`,
          r`Coefficient variances and standard errors are inflated, making individual slope estimates erratic and unstable`,
          r`The regression coefficients become systematically biased`,
          r`Residuals no longer sum to zero`,
        ],
        a: 1,
        why: r`Multicollinearity does not bias estimates or reduce $R^2$, but inflates coefficient variances, leading to wide confidence intervals and non-significant t-tests.`,
      },
      {
        q: r`If an auxiliary regression of predictor $X_j$ on all other predictors yields $R_j^2 = 0.90$, what is the Variance Inflation Factor $\text{VIF}_j$?`,
        o: [
          r`0.9`,
          r`1.0`,
          r`10.0`,
          r`90.0`,
        ],
        a: 2,
        why: r`$\text{VIF}_j = \frac{1}{1 - R_j^2} = \frac{1}{1 - 0.90} = \frac{1}{0.10} = 10.0$.`,
      },
      {
        q: r`Why does Ridge regression effectively resolve numerical problems caused by severe multicollinearity?`,
        o: [
          r`It removes correlated variables from the dataset completely`,
          r`It adds a penalty $\lambda \mathbf{I}$ to $\mathbf{X}^T\mathbf{X}$, bounding eigenvalues away from zero and stabilising matrix inversion`,
          r`It converts continuous variables into discrete categories`,
          r`It forces all slopes to be positive`,
        ],
        a: 1,
        why: r`Adding $\lambda \mathbf{I}$ guarantees that the eigenvalues of $\mathbf{X}^T\mathbf{X} + \lambda \mathbf{I}$ are at least $\lambda > 0$, preventing matrix singularity and shrinking inflated variances.`,
      },
      {
        q: r`Why is inspecting only the pairwise correlation matrix insufficient to rule out multicollinearity?`,
        o: [
          r`Because correlation matrices cannot be computed for more than two variables`,
          r`Because multicollinearity can arise from linear combinations of three or more variables even when all pairwise correlations are moderate`,
          r`Because Pearson correlation is insensitive to linear relationships`,
          r`Because pairwise correlation depends on sample size`,
        ],
        a: 1,
        why: r`Three or more variables can be almost perfectly collinear ($X_1 \approx X_2 + X_3$) even when each individual pairwise correlation is modest (e.g. $r \approx 0.5$). VIF detects this multi-variable dependence.`,
      },
    ],
    usedBy: ['ols_linear_regression', 'ridge_regression'],
    prereq: ['ols-inference-t-tests-f-test-r2-and-adjusted-r2', 'correlation-pearson-spearman-kendall'],
    related: ['ols_linear_regression', 'ridge_regression', 'feature-selection'],
    keywords: 'multicollinearity vif variance inflation factor tolerance condition number ridge regression collinear predictors auxiliary regression',
  },
  {
    id: 'generalised-linear-models',
    short: 'Generalised Linear Models',
    title: r`Generalised Linear Models`,
    task: 'concepts',
    module: 'Regression inference',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Extend linear regression beyond Gaussian errors to binary, count and skewed outcomes using the exponential dispersion family and link functions.`,
    lead: r`Ordinary least squares assumes continuous, normally distributed responses with constant variance—an assumption that fails catastrophically for click counts, hospital lengths of stay, or failure probabilities. Generalised Linear Models (GLMs) unify regression by connecting a linear predictor to any distribution in the exponential dispersion family via a monotonic link function. This flexible framework powers Poisson regression for event counts, Gamma regression for positive right-skewed durations, and logistic regression for binary classification.`,
    intuition: [
      r`Suppose an online streaming service predicts the number of support tickets $Y$ a customer submits per month based on their subscription tenure and monthly usage hours. Because ticket counts are discrete non-negative integers ($0, 1, 2, \dots$), fitting a standard linear regression model produces nonsensical predictions: for low-usage users, the line predicts negative tickets! Furthermore, count variance naturally scales with the mean (Poisson dispersion), violating the constant variance assumption of OLS.`,
      r`GLMs solve this with three modular components: a random component choosing an outcome distribution from the exponential dispersion family (such as Poisson for counts or Bernoulli for binary outcomes); a systematic linear predictor $\eta = \beta_0 + \beta_1 x_1 + \dots + \beta_p x_p$; and a link function $g(\mu) = \eta$ that bridges expected response $\mu = E[Y]$ onto the unbounded real line $(-\infty, \infty)$.`,
      r`For count data, the log link $g(\mu) = \ln(\mu)$ ensures that the expected count $\mu = \exp(\mathbf{x}^T\boldsymbol{\beta})$ remains strictly positive for every possible input. Exponentiating coefficients transforms additive changes in $x$ into multiplicative rate ratios: an estimated slope of $\hat{\beta}_1 = 0.417$ means each additional unit of $x$ multiplies expected ticket volume by $\exp(0.417) \approx 1.517$ (a 51.7% increase).`,
    ],
    analogy: r`A GLM is like an electrical transformer: the linear predictor produces raw voltage across the real line, and the link function transforms it down into the exact physical voltage (probability, count, or positive duration) required by the appliance.`,
    steps: [
      r`Identify the response variable's data type and support: binary ($y \in \{0, 1\}$), integer counts ($y \in \{0, 1, 2, \dots\}$), or positive continuous durations ($y > 0$).`,
      r`Select an appropriate distribution from the exponential dispersion family: Bernoulli, Poisson, Negative Binomial, or Gamma.`,
      r`Choose a monotonic link function $g(\mu)$ that maps the expected mean domain onto $(-\infty, \infty)$ (e.g. logit for binary, log for counts).`,
      r`Formulate the log-likelihood function across observations: $\ell(\boldsymbol{\beta}) = \sum \ln f(y_i; \theta_i, \phi)$.`,
      r`Estimate parameters via Iteratively Reweighted Least Squares (IRLS) using Fisher scoring until convergence.`,
      r`Assess model goodness-of-fit using deviance statistics and evaluate individual predictor significance via Wald or likelihood-ratio tests.`,
    ],
    math: [
      {
        h: 'The Exponential Dispersion Family',
        tex: r`$$f(y; \theta, \phi) = \exp\left(\frac{y\theta - b(\theta)}{a(\phi)} + c(y, \phi)\right)$$`,
        p: r`Here $\theta$ is the natural parameter, $b(\theta)$ is the cumulant generator function, $\phi$ is the dispersion parameter, and $a(\phi)$ and $c(y, \phi)$ are known scaling functions. The mean and variance follow directly: $E[Y] = \mu = b'(\theta)$ and $\text{Var}(Y) = b''(\theta) a(\phi) = V(\mu) a(\phi)$, where $V(\mu)$ is the characteristic variance function.`,
      },
      {
        h: 'The Three GLM Components and Link Functions',
        tex: r`$$\eta_i = \mathbf{x}_i^T\boldsymbol{\beta}, \qquad g(\mu_i) = \eta_i \iff \mu_i = g^{-1}(\mathbf{x}_i^T\boldsymbol{\beta})$$`,
        p: r`The systematic component $\eta_i$ is a linear combination of explanatory features. The link function $g(\cdot)$ maps the expected mean $\mu_i$ onto the linear predictor. Common canonical links include the identity link $g(\mu) = \mu$ for Gaussian OLS, the logit link $g(\mu) = \ln\left(\frac{\mu}{1-\mu}\right)$ for Bernoulli classification, and the log link $g(\mu) = \ln(\mu)$ for Poisson count regression.`,
      },
      {
        h: 'Iteratively Reweighted Least Squares (IRLS)',
        tex: r`$$\boldsymbol{\beta}^{(t+1)} = (\mathbf{X}^T\mathbf{W}_t\mathbf{X})^{-1}\mathbf{X}^T\mathbf{W}_t\mathbf{z}_t, \qquad W_{ii} = \frac{1}{V(\mu_i)(g'(\mu_i))^2}$$`,
        p: r`GLMs are fitted using Fisher scoring, which simplifies to weighted least squares with weights $W_{ii}$ inversely proportional to variance and squared link derivative. The working response vector $\mathbf{z}_t = \boldsymbol{\eta}_t + (\mathbf{y} - \boldsymbol{\mu}_t) \odot g'(\boldsymbol{\mu}_t)$ updates parameters iteratively until log-likelihood changes drop below tolerance.`,
      },
    ],
    keyPoints: [
      r`GLMs unify linear regression, logistic regression, and Poisson regression under a single rigorous maximum-likelihood framework.`,
      r`The link function transforms the expected value $\mu = E[Y]$, NOT the raw response variable $y$; regressing $\ln(y)$ in OLS produces biased estimates compared to a log-link GLM.`,
      r`GLM parameters are estimated via Iteratively Reweighted Least Squares (IRLS), which converges rapidly to the global maximum likelihood estimator for canonical links.`,
      r`Overdispersion occurs when count variance exceeds the Poisson mean ($\text{Var}(Y) > \mu$); it must be addressed using Negative Binomial or quasi-Poisson models.`,
    ],
    pitfalls: [
      r`Log-transforming counts with zeros ($\ln(y + 1)$) and fitting OLS instead of fitting a Poisson GLM, which introduces substantial bias and heteroscedasticity.`,
      r`Failing to check for overdispersion in Poisson models, leading to severely deflated standard errors and inflated false positive rates.`,
      r`Confusing link functions with response transformations: $g(E[Y]) \ne E[g(Y)]$.`,
      r`Using identity links on non-negative count data, leading to negative rate predictions and convergence failures during IRLS optimisation.`,
    ],
    code: r`import numpy as np

rng = np.random.default_rng(42)
n = 120

# Synthetic count data: true log-linear rate log(mu) = 0.5 + 0.4*x
x = rng.uniform(0.0, 5.0, size=n)
true_beta = np.array([0.5, 0.4])
X = np.column_stack([np.ones(n), x])
mu_true = np.exp(X @ true_beta)
y = rng.poisson(mu_true)

# Fit Poisson GLM using IRLS (Newton-Raphson with log link)
beta = np.array([0.0, 0.0])
for iteration in range(10):
    eta = X @ beta
    mu = np.exp(eta)
    W = np.diag(mu)
    z = eta + (y - mu) / mu
    beta = np.linalg.inv(X.T @ W @ X) @ X.T @ W @ z

rate_ratio = np.exp(beta[1])
print(f"True beta:      {true_beta}")
print(f"Estimated beta: [{beta[0]:.3f}, {beta[1]:.3f}]")
print(f"Rate ratio exp(beta_1): {rate_ratio:.3f} (per unit increase in x)")`,
    quiz: [
      {
        q: r`What is the crucial mathematical difference between fitting a GLM with a log link versus fitting OLS on $\ln(Y)$?`,
        o: [
          r`A log-link GLM models $\ln(E[Y])$, preserving the expectation scale, whereas OLS on transformed data models $E[\ln(Y)]$, which introduces Jensen's inequality bias`,
          r`There is zero mathematical difference`,
          r`OLS on $\ln(Y)$ only works for negative numbers`,
          r`GLMs do not use maximum likelihood estimation`,
        ],
        a: 0,
        why: r`Because the logarithm is concave, $E[\ln(Y)] \le \ln(E[Y])$ by Jensen's inequality. Log-transforming the response biases predictions downward, whereas a log-link GLM models $\ln(E[Y])$ directly.`,
      },
      {
        q: r`In a Poisson GLM with a log link, how is a slope coefficient $\hat{\beta}_1 = 0.30$ substantively interpreted?`,
        o: [
          r`Each unit increase in $x$ adds $0.30$ to the expected count`,
          r`Each unit increase in $x$ multiplies the expected count by $\exp(0.30) \approx 1.35$ (a 35% increase)`,
          r`The probability of success increases by 30 percentage points`,
          r`The response variance decreases by 30%`,
        ],
        a: 1,
        why: r`Because $\ln(\mu) = \beta_0 + \beta_1 x$, exponentiating gives $\mu = e^{\beta_0} e^{\beta_1 x}$. An increase of 1 in $x$ multiplies $\mu$ by $e^{\beta_1}$.`,
      },
      {
        q: r`Which canonical link function pairs with the Bernoulli distribution in generalised linear modelling?`,
        o: [
          r`Identity link $g(\mu) = \mu$`,
          r`Log link $g(\mu) = \ln(\mu)$`,
          r`Logit link $g(\mu) = \ln\left(\frac{\mu}{1 - \mu}\right)$`,
          r`Inverse link $g(\mu) = 1 / \mu$`,
        ],
        a: 2,
        why: r`The logit link maps probability $\mu \in (0, 1)$ to unbounded log-odds $(-\infty, \infty)$ and serves as the canonical link for the Bernoulli distribution.`,
      },
      {
        q: r`What numerical algorithm is universally employed to compute maximum likelihood parameter estimates in GLMs?`,
        o: [
          r`Ordinary least squares`,
          r`Iteratively Reweighted Least Squares (IRLS)`,
          r`K-means clustering`,
          r`Markov chain Monte Carlo exclusively`,
        ],
        a: 1,
        why: r`IRLS implements Fisher scoring for exponential families, transforming maximum likelihood optimisation into a sequence of weighted least squares regressions that converge in few iterations.`,
      },
    ],
    usedBy: ['logistic_regression', 'ols_linear_regression'],
    prereq: ['ols-inference-t-tests-f-test-r2-and-adjusted-r2', 'sigmoid-and-link-functions', 'maximum-likelihood-estimation'],
    related: ['logistic_regression', 'residual-diagnostics-and-heteroscedasticity', 'loss-functions'],
    keywords: 'glm generalised linear models poisson regression link function exponential family irls deviance overdispersion',
  },
  {
    id: "logistic-regression-inference-odds-ratios-wald-tests",
    short: "Logistic Regression Inference",
    title: "Logistic regression inference: odds ratios, Wald tests",
    task: "concepts",
    module: "Regression inference",
    level: 2,
    minutes: 20,
    noLab: true,
    summary: "Statistical inference in logistic regression moves beyond binary classification accuracy to evaluate parameter uncertainty, hypothesis testing, and quantitative risk interpretation. Because logistic regression models the log-odds (logit) of an outcome as a linear combination of predictors \\ln(\\frac{p}{1-p}) = \\mathbf{x}^\\top \\boldsymbol{\\beta}, exponentiating coefficients yields Odds Ratios (\\text{OR} = \\exp(\\beta_j)). Hypothesis tests rely on the asymptotic normality of maximum likelihood estimators via Wald z-tests, profile likelihood confidence intervals, and likelihood-ratio deviance tests.",
    lead: "In medical trials or credit scoring, predicting whether a patient recovers or a borrower defaults is only half the battle. Regulatory compliance and clinical decision-making demand rigorous statistical inference: Does a new drug reduce the odds of relapse by a statistically significant margin, and what is the exact 95% confidence interval on that effect size? Unlike linear regression where coefficients represent direct additive changes, logistic regression operates on the multiplicative scale of odds ratios. Understanding Wald inference, odds ratios, and deviance is essential for rigorous applied data science.",
    intuition: [
      "From Probabilities to Odds to Log-Odds:\n- Probability p in (0, 1) is bounded and non-linear.\n- Odds p / (1 - p) in (0, inf) measures the ratio of success probability to failure probability. An odds of 3.0 means success is 3 times more likely than failure.\n- Log-odds ln(p / (1 - p)) in (-inf, inf) maps odds onto the unbounded real line, allowing linear modelling: logit(p) = \\beta_0 + \\beta_1 x_1 + ...",
      "Interpreting the Odds Ratio exp(\\beta_j): If feature x_j increases by 1 unit, the log-odds increases by \\beta_j. Therefore, the odds are multiplied by exp(\\beta_j)!\n- If \\beta_j = 0, exp(\\beta_j) = 1.0: feature has zero association with the outcome.\n- If \\beta_j = 0.693, exp(\\beta_j) = 2.0: each 1-unit increase doubles the odds of the outcome (100% increase in odds).\n- If \\beta_j = -0.693, exp(\\beta_j) = 0.5: each 1-unit increase cuts the odds of the outcome in half (50% reduction in odds).",
      "Wald Inference and the Hauck-Donner Effect: The Wald test statistic z = \\hat{\\beta}_j / SE(\\hat{\\beta}_j) tests H_0: \\beta_j = 0. However, in extreme cases (e.g. near-perfect separation), the estimated standard error explodes faster than the coefficient, causing the Wald statistic to paradoxically drop toward zero! In critical applications, profile likelihood intervals and likelihood-ratio deviance tests should always be inspected."
    ],
    analogy: "Think of betting at a horse racing track. The track does not quote probabilities like 0.75; it quotes betting odds like 3 to 1. If a horse's jockey changes and the trainer says the new jockey improves performance with an odds ratio of 2.0, your 3-to-1 odds become 6-to-1 odds. Exponentiating logistic regression coefficients is literally finding the multiplier that scales betting odds.",
    steps: [
      {
        "title": "Fit logistic regression via maximum likelihood estimation",
        "desc": "Estimate coefficients \\hat{\\boldsymbol{\\beta}} using Iteratively Reweighted Least Squares (IRLS).",
        "detail": "Maximise log-likelihood \\ell(\\boldsymbol{\\beta}) = \\sum [y_i \\ln p_i + (1 - y_i) \\ln(1 - p_i)]. Store final fitted probabilities \\hat{p}_i."
      },
      {
        "title": "Extract covariance matrix from inverse Fisher Information",
        "desc": "Calculate \\widehat{\\text{Cov}}(\\hat{\\boldsymbol{\\beta}}) = (\\mathbf{X}^\\top \\mathbf{W} \\mathbf{X})^{-1}, where \\mathbf{W} is the diagonal weight matrix.",
        "detail": "Diagonal weights are w_i = \\hat{p}_i(1 - \\hat{p}_i). Standard errors are the square roots of the diagonal elements of the inverse information matrix."
      },
      {
        "title": "Calculate Wald statistics and p-values",
        "desc": "Evaluate z_j = \\hat{\\beta}_j / \\text{SE}(\\hat{\\beta}_j) against standard normal distribution.",
        "detail": "Compute two-tailed p-values p_j = 2 * (1 - \\Phi(|z_j|)) to determine if predictors have statistically significant associations."
      },
      {
        "title": "Compute Odds Ratios and exponentiated confidence intervals",
        "desc": "Transform linear log-odds coefficients into multiplicative odds multipliers.",
        "detail": "Evaluate \\text{OR}_j = \\exp(\\hat{\\beta}_j). Calculate 95% confidence intervals by exponentiating the linear bounds: [\\exp(\\hat{\\beta}_j - 1.96 \\cdot \\text{SE}), \\exp(\\hat{\\beta}_j + 1.96 \\cdot \\text{SE})]."
      },
      {
        "title": "Assess goodness-of-fit via residual deviance",
        "desc": "Compare model deviance against null deviance using a likelihood-ratio test.",
        "detail": "Compute deviance D = -2 \\ell(\\hat{\\boldsymbol{\\beta}}). Calculate overall model significance \\Delta D = D_{\\text{null}} - D_{\\text{model}} \\sim \\chi^2(p) to verify joint predictive power."
      }
    ],
    math: [
      {
        "h": "Logit Transformation and Odds Ratio Formulation",
        "tex": "\\text{logit}(p) = \\ln\\left(\\frac{p}{1 - p}\\right) = \\beta_0 + \\sum_{j=1}^k \\beta_j x_j \\implies \\text{OR}_j = \\frac{\\text{Odds}(x_j + 1)}{\\text{Odds}(x_j)} = \\exp(\\beta_j)",
        "p": "The logit function linearises binary probabilities. Because the link function is logarithmic in the odds ratio, adding 1 unit to predictor x_j multiplies the outcome odds by \\exp(\\beta_j), holding all other covariates constant."
      },
      {
        "h": "Asymptotic Covariance and Wald z-Statistic",
        "tex": "\\text{Cov}(\\hat{\\boldsymbol{\\beta}}) \\approx \\left( \\mathbf{X}^\\top \\mathbf{W} \\mathbf{X} \\right)^{-1}, \\quad \\mathbf{W} = \\text{diag}\\big( \\hat{p}_i (1 - \\hat{p}_i) \\big), \\qquad z_j = \\frac{\\hat{\\beta}_j}{\\text{SE}(\\hat{\\beta}_j)} \\xrightarrow{d} \\mathcal{N}(0, 1)",
        "p": "The inverse of the negative Hessian (observed Fisher Information) yields the asymptotic covariance matrix of parameter estimates. The Wald z-statistic evaluates individual coefficient significance against standard normal critical thresholds."
      },
      {
        "h": "Model Deviance and Likelihood-Ratio Goodness-of-Fit",
        "tex": "D = -2 \\sum_{i=1}^n \\left[ y_i \\ln \\hat{p}_i + (1 - y_i) \\ln(1 - \\hat{p}_i) \\right], \\qquad G = D_{\\text{null}} - D_{\\text{model}} \\sim \\chi^2(k)",
        "p": "Deviance measures unexplained variation analogous to residual sum of squares in OLS. The drop in deviance G between the null model (intercept only) and fitted model follows a \\chi^2 distribution with k degrees of freedom, testing overall model utility."
      }
    ],
    code: "\"\"\"\nLogistic Regression Statistical Inference Engine\nDemonstrating IRLS maximum likelihood estimation, Fisher Information,\nWald z-tests, Odds Ratios, and Deviance goodness-of-fit.\n\"\"\"\n\nimport numpy as np\nfrom scipy import stats\n\nclass LogisticRegressionInference:\n    def __init__(self, add_intercept: bool = True):\n        self.add_intercept = add_intercept\n        self.beta = None\n        self.cov_matrix = None\n        self.se = None\n\n    def fit(self, X: np.ndarray, y: np.ndarray, max_iter: int = 50, tol: float = 1e-7):\n        if self.add_intercept:\n            X = np.column_stack([np.ones(len(X)), X])\n        \n        n_samples, n_features = X.shape\n        beta = np.zeros(n_features)\n\n        # Iteratively Reweighted Least Squares (Newton-Raphson)\n        for iteration in range(max_iter):\n            p = 1.0 / (1.0 + np.exp(-np.clip(X @ beta, -30, 30)))\n            # Weight matrix W = diag(p * (1 - p))\n            w = p * (1.0 - p)\n            # Prevent zero division\n            w = np.maximum(w, 1e-12)\n            \n            # Gradient: X^T (y - p)\n            gradient = X.T @ (y - p)\n            # Hessian: -X^T W X\n            hessian = -X.T @ (w[:, np.newaxis] * X)\n            \n            # Newton-Raphson update: beta_new = beta - H^-1 * g\n            delta = np.linalg.solve(-hessian, gradient)\n            beta += delta\n            \n            if np.max(np.abs(delta)) < tol:\n                break\n\n        self.beta = beta\n        # Asymptotic covariance is inverse Fisher Information = (-H)^-1\n        self.cov_matrix = np.linalg.inv(-hessian)\n        self.se = np.sqrt(np.diagonal(self.cov_matrix))\n        self.p_fitted = 1.0 / (1.0 + np.exp(-np.clip(X @ beta, -30, 30)))\n        self.X_design = X\n        self.y = y\n\n    def summary(self, feature_names=None):\n        if feature_names is None:\n            feature_names = [f\"x{i}\" for i in range(len(self.beta))]\n            if self.add_intercept:\n                feature_names[0] = \"Intercept\"\n\n        z_scores = self.beta / self.se\n        p_values = 2.0 * (1.0 - stats.norm.cdf(np.abs(z_scores)))\n        odds_ratios = np.exp(self.beta)\n        or_ci_lower = np.exp(self.beta - 1.96 * self.se)\n        or_ci_upper = np.exp(self.beta + 1.96 * self.se)\n\n        # Deviance\n        eps = 1e-12\n        p_safe = np.clip(self.p_fitted, eps, 1 - eps)\n        model_deviance = -2.0 * np.sum(self.y * np.log(p_safe) + (1.0 - self.y) * np.log(1.0 - p_safe))\n        \n        y_mean = np.mean(self.y)\n        null_deviance = -2.0 * np.sum(self.y * np.log(y_mean) + (1.0 - self.y) * np.log(1.0 - y_mean))\n        g_stat = null_deviance - model_deviance\n        df = len(self.beta) - 1\n        p_model = 1.0 - stats.chi2.cdf(g_stat, df=df)\n\n        print(\"=== Logistic Regression Statistical Summary ===\")\n        header = f\"{'Variable':14s} | {'Coef':8s} | {'StdErr':8s} | {'z-value':8s} | {'p-value':8s} | {'OddsRatio':10s} | {'95% CI on OR':16s}\"\n        print(header)\n        print(\"-\" * len(header))\n        for j, name in enumerate(feature_names):\n            ci_str = f\"[{or_ci_lower[j]:.3f}, {or_ci_upper[j]:.3f}]\"\n            row = f\"{name:14s} | {self.beta[j]:8.4f} | {self.se[j]:8.4f} | {z_scores[j]:8.3f} | {p_values[j]:8.4f} | {odds_ratios[j]:10.4f} | {ci_str:16s}\"\n            print(row)\n\n        print(\"-\" * len(header))\n        print(f\"Null Deviance:     {null_deviance:.2f}\")\n        print(f\"Residual Deviance: {model_deviance:.2f}\")\n        print(f\"Model Chi-Square:  {g_stat:.2f} (df={df}, p-value = {p_model:.4e})\")\n\n# Demonstration on synthetic clinical trial data\n# Outcome: Disease recovery (1 = yes, 0 = no)\n# Predictor 1: Treatment dosage in mg\n# Predictor 2: Patient baseline age in years\nnp.random.seed(42)\nN = 250\ndosage = np.random.uniform(1.0, 5.0, N)\nage = np.random.normal(50.0, 10.0, N)\n\n# True model: logit = -2.0 + 0.8 * dosage - 0.04 * age\ntrue_logits = -2.0 + 0.8 * dosage - 0.04 * age\ntrue_probs = 1.0 / (1.0 + np.exp(-true_logits))\nrecovery = np.random.binomial(1, true_probs)\n\nX_data = np.column_stack([dosage, age])\nmodel = LogisticRegressionInference(add_intercept=True)\nmodel.fit(X_data, recovery)\nmodel.summary(feature_names=[\"Intercept\", \"Dosage (mg)\", \"Age (years)\"])\n",
    keyPoints: [
      "Logistic regression models log-odds; exponentiating coefficients yields multiplicative Odds Ratios: OR = exp(\\beta_j).",
      "An Odds Ratio > 1 indicates increased probability of outcome per unit predictor increase; OR < 1 indicates decreased odds.",
      "Wald z-tests test individual parameter significance using the inverse Fisher Information covariance matrix.",
      "Deviance measures goodness-of-fit; the drop in deviance from the null model tests overall model predictive validity."
    ],
    pitfalls: [
      "Interpreting Odds Ratios as relative risks: Odds Ratios only approximate Relative Risk when the baseline outcome is rare (< 5%); for common outcomes, Odds Ratios substantially exaggerate effect sizes.",
      "The Hauck-Donner failure in Wald tests: With quasi-complete or perfect data separation, coefficients grow large while standard errors explode, causing Wald statistics to fall paradoxically to zero.",
      "Adding Odds Ratios instead of multiplying: Odds Ratios operate on a multiplicative scale; two 1-unit increases multiply odds by OR^2, not 2*OR."
    ],
    quiz: [
      {
        "q": "In a logistic regression model, what does an estimated coefficient of beta_1 = 0.693 for a binary treatment variable imply?",
        "o": [
          "Treatment doubles the odds of the outcome (Odds Ratio = exp(0.693) approx 2.0)",
          "Treatment increases the probability of the outcome by 69.3 percentage points",
          "Treatment has zero effect on the outcome",
          "Treatment decreases the odds by half"
        ],
        "a": 0,
        "why": "Because the link function is the log-odds, exponentiating the coefficient yields the odds multiplier: exp(0.693) = 2.0, meaning the odds of the outcome double under treatment."
      },
      {
        "q": "What paradoxical behaviour can occur in Wald tests when data exhibits near-perfect separation (the Hauck-Donner effect)?",
        "o": [
          "The estimated standard error explodes to infinity faster than the coefficient estimate, causing the Wald z-statistic to erroneously approach zero and fail to detect significance",
          "The p-value becomes negative",
          "The model deviance becomes infinite",
          "The odds ratio becomes negative"
        ],
        "a": 0,
        "why": "In separated data, the likelihood becomes flat asymptotically. The curvature (information) vanishes, driving standard errors to extreme values and causing Wald tests to fail. Profile likelihood or LR tests must be used instead."
      },
      {
        "q": "How is overall model significance evaluated in logistic regression?",
        "o": [
          "By comparing the difference between Null Deviance and Residual Deviance against a Chi-Squared distribution with degrees of freedom equal to the number of predictors",
          "By computing the R-squared value like in OLS",
          "By calculating the mean squared error",
          "By checking if all coefficients are positive"
        ],
        "a": 0,
        "why": "The difference G = D_null - D_model is a likelihood-ratio test statistic that follows a \\chi^2 distribution with degrees of freedom equal to the number of non-intercept predictors."
      }
    ],
    usedBy: [],
    prereq: [
      "generalised-linear-models",
      "ols-inference-t-tests-f-test-r2-and-adjusted-r2"
    ],
    related: [
      "logistic_regression",
      "generalised-linear-models",
      "ols-inference-t-tests-f-test-r2-and-adjusted-r2",
      "likelihood-ratio-wald-and-score-tests"
    ],
    keywords: "logistic regression inference odds ratios wald test deviance fisher information irls logit link hauck donner effect"
  },
  {
    id: "mixed-effects-models",
    short: "Mixed-Effects Models",
    title: "Mixed-effects models",
    task: "concepts",
    module: "Regression inference",
    level: 2,
    minutes: 20,
    noLab: true,
    summary: "Linear Mixed-Effects Models (LMMs / hierarchical linear models) extend classical regression to handle clustered, grouped, longitudinal, and repeated-measures data by simultaneously estimating fixed effects (population-level averages) and random effects (cluster-specific deviations drawn from a probability distribution). By pooling information across groups through empirical Bayes shrinkage (\"partial pooling\"), mixed models avoid the dual pitfalls of complete pooling (ignoring cluster structure) and no pooling (overfitting isolated groups), providing unbiased variance components and robust inference under non-independent errors.",
    lead: "Suppose you measure patient blood pressure across 50 different hospitals. If you fit a single regression line ignoring hospitals (complete pooling), you violate the independence assumption and produce falsely confident standard errors. If you fit 50 separate regression models for each hospital (no pooling), small clinics with only 3 patients produce wild, noisy estimates. How do you share statistical strength across groups while respecting individual cluster idiosyncrasies? Mixed-effects models provide the mathematically principled answer through partial pooling and variance components.",
    intuition: [
      "The Three Regimes of Grouped Data:\n- Complete Pooling: Fit one global model y = X\\beta + \\epsilon. Treats all observations as independent. Violates independence, masks Simpson's paradox, and underestimates standard errors.\n- No Pooling: Fit separate isolated models or dummy indicators for every group. Small groups with few observations overfit wildly. Fails to capitalise on population commonalities.\n- Partial Pooling (Mixed Effects): Treat group differences as random draws from a latent distribution u_j ~ N(0, \\sigma_u^2). Groups with abundant data rely on their own observations; groups with sparse data shrink automatically toward the global mean!",
      "Fixed Effects vs Random Effects:\n- Fixed Effects (\\beta): Non-random parameters representing constant population-wide relationships (e.g. the average effect of a drug dosage across all humans).\n- Random Effects (u): Random variables representing idiosyncratic cluster deviations (e.g. hospital baseline offsets or clinic-specific dosage sensitivities), governed by covariance matrix G.",
      "Shrinkage and Empirical Bayes: The estimated random effect u_hat_j for group j shrinks toward 0 by shrinkage factor \\sigma_u^2 / (\\sigma_u^2 + \\sigma_\\epsilon^2 / n_j). When group sample size n_j is large, shrinkage is negligible; when n_j is small, shrinkage pulls the group toward the population grand mean, protecting against extreme outliers."
    ],
    analogy: "Imagine a school district evaluating teachers based on student test scores. Complete pooling compares raw student scores across all schools, ignoring that some schools are in wealthy suburbs and others in underfunded areas. No pooling ranks teachers strictly within their own school, making a new teacher with only 4 students either the best or worst in the district due to small-sample noise. Mixed-effects models use partial pooling: a teacher with 4 students is gently pulled toward the district average until more student scores are collected, balancing local performance with district-wide context.",
    steps: [
      {
        "title": "Identify hierarchical grouping structure",
        "desc": "Detect clustered, longitudinal, or repeated-measures dependencies in experimental observations.",
        "detail": "Determine grouping variables (e.g. patient ID, classroom, clinic, geographical region). Confirm that errors within clusters are correlated."
      },
      {
        "title": "Specify fixed and random effects design matrices",
        "desc": "Formulate model y = X\\beta + Z u + \\epsilon with fixed matrix X and random matrix Z.",
        "detail": "Choose random intercepts (cluster-specific baseline shifts) or random slopes (cluster-specific covariate sensitivities). Define covariance structure G = Cov(u) and R = Cov(\\epsilon)."
      },
      {
        "title": "Estimate variance components via REML",
        "desc": "Apply Restricted Maximum Likelihood to eliminate degrees-of-freedom bias in variance estimation.",
        "detail": "Standard MLE underestimates variance components because it fails to account for degrees of freedom consumed by fixed effects. REML projects data onto the error contrast subspace to obtain unbiased variance estimates."
      },
      {
        "title": "Solve Henderson's Mixed Model Equations",
        "desc": "Simultaneously estimate fixed coefficients \\hat{\\beta} and Best Linear Unbiased Predictions (BLUPs) \\hat{u}.",
        "detail": "Compute empirical Bayes shrinkage estimates for each group. Extract standard errors for fixed effects that properly account for clustered variance."
      },
      {
        "title": "Compute Intraclass Correlation Coefficient (ICC)",
        "desc": "Measure the proportion of total variance explained by grouping structure: ICC = \\sigma_u^2 / (\\sigma_u^2 + \\sigma_\\epsilon^2).",
        "detail": "An ICC near 0 indicates clusters are negligible (OLS is sufficient); an ICC > 0.10 confirms strong grouping requiring mixed modelling."
      }
    ],
    math: [
      {
        "h": "Linear Mixed Model Formulation",
        "tex": "\\mathbf{y} = \\mathbf{X}\\boldsymbol{\\beta} + \\mathbf{Z}\\mathbf{u} + \\boldsymbol{\\epsilon}, \\quad \\mathbf{u} \\sim \\mathcal{N}(\\mathbf{0}, \\mathbf{G}), \\quad \\boldsymbol{\\epsilon} \\sim \\mathcal{N}(\\mathbf{0}, \\sigma^2 \\mathbf{I}), \\quad \\mathbf{y} \\sim \\mathcal{N}(\\mathbf{X}\\boldsymbol{\\beta}, \\; \\mathbf{V})",
        "p": "Here \\mathbf{X}\\boldsymbol{\\beta} represents fixed effects across the population, and \\mathbf{Z}\\mathbf{u} represents group-specific random effects. The total marginal covariance matrix is \\mathbf{V} = \\mathbf{Z}\\mathbf{G}\\mathbf{Z}^\\top + \\sigma^2 \\mathbf{I}, inducing non-zero correlations among observations from the same cluster."
      },
      {
        "h": "Empirical Bayes Shrinkage Factor (Random Intercept)",
        "tex": "\\hat{u}_j = \\frac{n_j \\sigma_u^2}{\\sigma^2 + n_j \\sigma_u^2} \\left( \\bar{y}_j - \\bar{\\mathbf{x}}_j^\\top \\hat{\\boldsymbol{\\beta}} \\right) = \\lambda_j \\left( \\bar{y}_j - \\bar{\\mathbf{x}}_j^\\top \\hat{\\boldsymbol{\\beta}} \\right), \\quad \\lambda_j \\in [0, 1)",
        "p": "The random effect prediction for group j shrinks the observed group residual toward zero by shrinkage multiplier \\lambda_j. For large sample sizes n_j, \\lambda_j \\approx 1 (no pooling); for small sample sizes n_j \\to 0, \\lambda_j \\to 0, borrowing strength from the population grand mean (complete pooling)."
      },
      {
        "h": "Intraclass Correlation Coefficient (ICC)",
        "tex": "\\text{ICC} = \\frac{\\sigma_u^2}{\\sigma_u^2 + \\sigma^2} = \\text{Corr}(y_{ij}, y_{ik}) \\quad \\text{for } j \\neq k",
        "p": "The ICC quantifies the proportion of total variance attributable to differences between clusters. It represents the expected correlation between two randomly drawn observations from the same cluster."
      }
    ],
    code: "\"\"\"\nLinear Mixed-Effects Model Simulation\nDemonstrates complete pooling vs no pooling vs partial pooling (LMM)\nand empirical Bayes shrinkage across groups of varying sample sizes.\n\"\"\"\n\nimport numpy as np\n\n# Simulate hierarchical multi-centre clinical trial\n# 8 clinics with vastly different patient counts (from 3 to 100 patients)\nnp.random.seed(42)\nnum_clinics = 8\nclinic_sizes = [3, 4, 6, 10, 20, 35, 60, 100]\n\ntrue_beta_0 = 10.0   # Population baseline score\ntrue_beta_1 = 2.5    # Population treatment effect\ntrue_sigma_u = 3.0   # Between-clinic standard deviation\ntrue_sigma_e = 2.0   # Within-clinic residual noise\n\n# Sample clinic random baseline offsets u_j ~ N(0, sigma_u^2)\nclinic_offsets = np.random.normal(0, true_sigma_u, num_clinics)\n\nrecords = []\nfor j in range(num_clinics):\n    n_j = clinic_sizes[j]\n    x_dosage = np.random.uniform(0.5, 4.0, n_j)\n    noise = np.random.normal(0, true_sigma_e, n_j)\n    y_response = (true_beta_0 + clinic_offsets[j]) + true_beta_1 * x_dosage + noise\n    for i in range(n_j):\n        records.append({\n            \"clinic\": j,\n            \"x\": x_dosage[i],\n            \"y\": y_response[i]\n        })\n\nprint(f\"=== Hierarchical Dataset: {len(records)} patients across {num_clinics} clinics ===\")\nprint(\"Clinic sizes:\", clinic_sizes)\nprint(f\"True Population Intercept: {true_beta_0:.2f} | True Between-Clinic Std: {true_sigma_u:.2f}\\n\")\n\n# Calculate group sample means and residuals\nclinic_means = []\nfor j in range(num_clinics):\n    y_j = [r[\"y\"] for r in records if r[\"clinic\"] == j]\n    clinic_means.append(np.mean(y_j))\n\ngrand_mean = np.mean([r[\"y\"] for r in records])\n\n# Partial Pooling (Empirical Bayes Shrinkage calculation)\n# Shrinkage weight lambda_j = n_j * sigma_u^2 / (sigma_e^2 + n_j * sigma_u^2)\nvar_u = true_sigma_u ** 2\nvar_e = true_sigma_e ** 2\n\nprint(\"=== Comparison: No Pooling vs Partial Pooling (Shrinkage) ===\")\nprint(f\"{'Clinic':7s} | {'Size':5s} | {'Raw Mean':10s} | {'Shrinkage lambda':18s} | {'Partial Pooled':15s} | {'Offset from Grand':18s}\")\nprint(\"-\" * 82)\n\nfor j in range(num_clinics):\n    n_j = clinic_sizes[j]\n    raw_mean = clinic_means[j]\n    lambda_j = (n_j * var_u) / (var_e + n_j * var_u)\n    # Shrunk estimate: grand_mean + lambda_j * (raw_mean - grand_mean)\n    partial_pooled = grand_mean + lambda_j * (raw_mean - grand_mean)\n    \n    print(f\"Clinic {j:1d} | {n_j:5d} | {raw_mean:10.2f} | {lambda_j:18.3f} | {partial_pooled:15.2f} | {(partial_pooled - grand_mean):18.2f}\")\n\nicc = var_u / (var_u + var_e)\nprint(\"-\" * 82)\nprint(f\"Grand Mean: {grand_mean:.2f}\")\nprint(f\"True Intraclass Correlation Coefficient (ICC): {icc:.3f}\")\nprint(\"Notice: Small clinics (n=3, 4) experience heavy shrinkage toward the grand mean (lambda ~ 0.85),\")\nprint(\"while large clinics (n=100) retain their observed data with virtually zero shrinkage (lambda ~ 0.99).\")\n",
    keyPoints: [
      "Linear Mixed-Effects Models combine fixed effects (population averages) and random effects (cluster deviations).",
      "Partial pooling via empirical Bayes shrinkage borrows statistical strength across groups, protecting small clusters from noisy overfitting.",
      "Restricted Maximum Likelihood (REML) provides unbiased variance component estimation by accounting for fixed effect degrees of freedom.",
      "The Intraclass Correlation Coefficient (ICC) measures the proportion of variance attributable to grouping structure."
    ],
    pitfalls: [
      "Treating cluster variables as fixed effect dummies when predicting on new clusters: Fixed effect models cannot generalise to unseen clusters; random effects models quantify the population distribution of cluster effects.",
      "Using standard Maximum Likelihood instead of REML for small sample sizes: ML variance estimates have downward bias of order O(p/n).",
      "Ignoring random slopes: If treatment effects vary systematically across clusters, fitting only random intercepts yields overconfident standard errors for treatment."
    ],
    quiz: [
      {
        "q": "Why does partial pooling in mixed-effects models outperform 'no pooling' (separate models per group) on small clusters?",
        "o": [
          "Because empirical Bayes shrinkage pulls noisy small-sample estimates toward the population grand mean, borrowing statistical strength from the rest of the dataset",
          "Because partial pooling deletes small groups entirely",
          "Because mixed models do not allow regression slopes",
          "Because no pooling requires GPU supercomputers"
        ],
        "a": 0,
        "why": "No pooling overfits small groups due to high sampling variance. Partial pooling shrinks small groups toward the population mean while allowing large groups to remain close to their sample means."
      },
      {
        "q": "What does the Intraclass Correlation Coefficient (ICC) represent?",
        "o": [
          "The proportion of total variance explained by grouping structure, or the expected correlation between two observations from the same cluster",
          "The Pearson correlation between x and y",
          "The p-value of the fixed effect slopes",
          "The R-squared value of the residuals"
        ],
        "a": 0,
        "why": "ICC = \\sigma_u^2 / (\\sigma_u^2 + \\sigma^2). It measures how much variance is between clusters versus within clusters, defining intra-cluster correlation."
      },
      {
        "q": "Why is Restricted Maximum Likelihood (REML) preferred over standard Maximum Likelihood (ML) for estimating variance components?",
        "o": [
          "Because REML accounts for the degrees of freedom consumed by fixed effect parameters, eliminating the downward bias inherent in standard ML variance estimates",
          "Because REML runs faster than standard matrix multiplication",
          "Because REML forces random effects to equal zero",
          "Because ML cannot invert positive-definite matrices"
        ],
        "a": 0,
        "why": "Just as Bessel's correction divides by n-1 instead of n in sample variance, REML adjusts for estimated fixed effects \\hat{\\boldsymbol{\\beta}}, yielding strictly unbiased variance component estimates."
      }
    ],
    usedBy: [],
    prereq: [
      "ols-inference-t-tests-f-test-r2-and-adjusted-r2",
      "generalised-linear-models"
    ],
    related: [
      "ols-inference-t-tests-f-test-r2-and-adjusted-r2",
      "residual-diagnostics-and-heteroscedasticity",
      "anova-and-post-hoc-tests",
      "bayesian_linear_regression"
    ],
    keywords: "mixed effects models hierarchical linear models lmm reml partial pooling empirical bayes shrinkage blup random intercepts icc"
  },
  {
    id: 'a-b-testing-end-to-end',
    short: 'A/B Testing End-to-End',
    title: r`A/B Testing End-to-End`,
    task: 'concepts',
    module: 'Experiments and causality',
    level: 1,
    minutes: 18,
    noLab: true,
    summary: r`Design, run and analyse randomised controlled online experiments from sample sizing to hypothesis testing and guardrail metrics.`,
    lead: r`Online controlled experiments, or A/B tests, represent the gold standard of causal inference in modern software and product engineering. By randomly allocating users between a control variant and an experimental treatment, A/B tests guarantee that observed differences are caused by the feature change rather than confounding factors. Designing an end-to-end test requires disciplined sample sizing, Sample Ratio Mismatch (SRM) validation, statistical testing, and tracking guardrail metrics.`,
    intuition: [
      r`Imagine an e-commerce company testing a "Buy with 1-Click" button against the standard 3-step checkout. Over two weeks, 40,000 users are randomly assigned: 20,000 to Control (A) and 20,000 to Treatment (B). In Control, 1,600 users purchase (8.0% conversion). In Treatment, 1,760 users purchase (8.8% conversion)—an apparent absolute uplift of 0.8 percentage points (a 10% relative increase).`,
      r`How does the team verify this win? First, they audit experiment integrity using a Sample Ratio Mismatch (SRM) test. If the randomisation server delivered 19,200 Control users and 20,800 Treatment users, a chi-square goodness-of-fit test against the expected 50/50 split yields $p < 0.0001$. This indicates that the experiment is fundamentally broken—perhaps buggy JavaScript crashed older browsers in Treatment, silently dropping users and invalidating the sample.`,
      r`When the allocation passes the SRM test ($p = 1.000$), the team runs a two-proportion $z$-test: the 0.8 percentage point lift with standard error $0.00277$ gives $z = 2.884$ and $p = 0.0039$. Because $p < 0.05$, the lift is statistically significant, with a 95% confidence interval spanning $[0.26\%, 1.34\%]$. Finally, they inspect guardrail metrics: did 1-Click checkout cause a surge in accidental orders and customer support refunds? Only when guardrails remain healthy is the winning variant safely rolled out.`,
    ],
    analogy: r`An A/B test is like a randomised medical clinical trial: patients receive either a placebo or the active drug under identical conditions so that health improvements can be attributed solely to the molecule, not to weather, diet, or doctor optimism.`,
    steps: [
      r`Formulate a falsifiable causal hypothesis and define the primary evaluation metric and secondary guardrail metrics.`,
      r`Choose the unit of randomisation (e.g. user ID, cookie, device ID) to prevent cross-contamination across sessions.`,
      r`Determine the required sample size based on baseline conversion, Minimum Detectable Effect (MDE), significance level $\alpha = 0.05$, and power $1 - \beta = 0.80$.`,
      r`Run an initial Sample Ratio Mismatch (SRM) chi-square test to verify that traffic allocation matches the design split.`,
      r`Collect data for a pre-determined duration that encompasses full weekly cycles (minimum 1 to 2 weeks) without early peeking.`,
      r`Compute the test statistic, confidence interval for the treatment effect, and p-value; check guardrail metrics before rolling out.`,
    ],
    math: [
      {
        h: 'Two-Sample Proportion Test Statistic',
        tex: r`$$z = \frac{\hat{p}_B - \hat{p}_A}{\sqrt{\hat{p}_{\text{pool}}(1 - \hat{p}_{\text{pool}})\left(\frac{1}{n_A} + \frac{1}{n_B}\right)}}, \qquad \hat{p}_{\text{pool}} = \frac{x_A + x_B}{n_A + n_B}$$`,
        p: r`Here $x_A, x_B$ are conversion counts, $n_A, n_B$ are sample sizes, and $\hat{p}_{\text{pool}}$ is the pooled proportion. Under the null hypothesis $H_0: p_A = p_B$, the test statistic $z$ asymptotically follows the standard normal distribution $\mathcal{N}(0, 1)$.`,
      },
      {
        h: 'Sample Ratio Mismatch (SRM) Test',
        tex: r`$$\chi_{\text{SRM}}^2 = \sum_{v \in \{A, B\}} \frac{(n_v - E_v)^2}{E_v} \sim \chi^2(1), \qquad E_A = E_B = \frac{n_A + n_B}{2}$$`,
        p: r`The SRM test checks whether observed traffic counts conform to the planned 50/50 allocation ratio. A significant discrepancy ($p < 0.001$) signals severe tracking bugs, redirect delays, or platform-specific crashes that invalidate all downstream statistical inference.`,
      },
      {
        h: 'Sample Size Determination Formula',
        tex: r`$$n = \frac{2\left(z_{1 - \alpha/2} + z_{1 - \beta}\right)^2 p(1 - p)}{\delta^2}$$`,
        p: r`Here $p$ is the baseline conversion probability and $\delta = |p_B - p_A|$ is the Minimum Detectable Effect. Sizing experiments to achieve 80% power at $\alpha = 0.05$ requires fixing $n$ in advance to avoid underpowered experiments and inflated false discovery rates.`,
      },
    ],
    keyPoints: [
      r`A/B testing isolates causality by ensuring treatment and control cohorts differ exclusively by the experimental intervention.`,
      r`The Sample Ratio Mismatch (SRM) test is a mandatory hygiene check: an SRM failure invalidates all downstream metrics regardless of p-values.`,
      r`Experiments must run across complete business cycles (typically 7 or 14 full days) to account for weekday versus weekend behavioural shifts.`,
      r`Guardrail metrics ensure that optimising the primary metric does not silently degrade user experience, system stability, or long-term retention.`,
    ],
    pitfalls: [
      r`Peeking at p-values daily and stopping the test early as soon as significance is reached, multiplying the true false positive rate.`,
      r`Ignoring Sample Ratio Mismatches (SRMs), treating severe traffic drop-offs as legitimate experimental outcomes.`,
      r`Seasonality and novelty effects: enthusiastic initial adoption of a new UI that fades after novelty wears off.`,
      r`Twyman's law: "Any figure that looks interesting or different is usually wrong"—unexpectedly massive uplifts almost always reflect instrumentation bugs.`,
    ],
    code: r`import numpy as np
import scipy.stats as stats

# A/B test results: 20,000 visitors per variant
n_a, n_b = 20000, 20000
x_a, x_b = 1600, 1760  # Conversions
p_a, p_b = x_a / n_a, x_b / n_b

# 1. Sample Ratio Mismatch (SRM) check (expected 50/50 split)
chi2_srm, p_srm = stats.chisquare([n_a, n_b], [20000, 20000])

# 2. Two-proportion z-test
p_pool = (x_a + x_b) / (n_a + n_b)
se_diff = np.sqrt(p_pool * (1.0 - p_pool) * (1.0 / n_a + 1.0 / n_b))
z_stat = (p_b - p_a) / se_diff
p_val = 2.0 * (1.0 - stats.norm.cdf(abs(z_stat)))

lift = p_b - p_a
ci_low = lift - 1.96 * se_diff
ci_high = lift + 1.96 * se_diff

print(f"SRM check p-value: {p_srm:.4f} (Valid allocation)")
print(f"Control conversion:   {p_a:.1%}")
print(f"Treatment conversion: {p_b:.1%} (Lift: {lift:+.2%})")
print(f"z-statistic: {z_stat:.3f}, p-value: {p_val:.4f}")
print(f"95% Confidence Interval: [{ci_low:.4f}, {ci_high:.4f}]")`,
    quiz: [
      {
        q: r`Why does daily "peeking" at accumulated A/B test results and stopping early as soon as $p < 0.05$ invalidate the experiment?`,
        o: [
          r`Because sample sizes must always be odd numbers`,
          r`Because repeated testing across accumulating data inflates the true Type I error rate far above the nominal 5% level`,
          r`Because early stopping decreases statistical power`,
          r`Because conversion rates cannot be calculated before 30 days`,
        ],
        a: 1,
        why: r`Continuous monitoring gives random sampling noise multiple opportunities to cross the significance boundary, drastically inflating false discovery rates.`,
      },
      {
        q: r`What does a statistically significant result ($p < 0.0001$) in a Sample Ratio Mismatch (SRM) test indicate?`,
        o: [
          r`The treatment variant won with overwhelming confidence`,
          r`The experiment has severe tracking or allocation flaws (such as browser crashes or redirect drops), invalidating all causal claims`,
          r`The sample size was too small`,
          r`The primary conversion metric should be adjusted`,
        ],
        a: 1,
        why: r`An SRM failure indicates that users were systematically dropped or misallocated between variants, violating the fundamental assumption of unbiased random assignment.`,
      },
      {
        q: r`Why must A/B tests typically run for a minimum duration of 7 or 14 full consecutive days?`,
        o: [
          r`To capture day-of-week seasonality and cyclical user behavioural differences`,
          r`Because standard normal distributions require 7 degrees of freedom`,
          r`To allow database indexes to rebuild`,
          r`Because p-values cannot be computed on weekends`,
        ],
        a: 0,
        why: r`User behaviour varies systematically across weekdays and weekends; running experiments in full 7-day multiples balances day-of-week cyclicality.`,
      },
      {
        q: r`What is the primary role of "guardrail metrics" in online controlled experiments?`,
        o: [
          r`To replace the primary evaluation metric`,
          r`To ensure that optimising the primary metric does not cause unintended harm to system performance, latency, or customer satisfaction`,
          r`To guarantee that $R^2$ remains positive`,
          r`To compute statistical power`,
        ],
        a: 1,
        why: r`Guardrail metrics monitor critical operational and business vitals (e.g. page load latency, crash rates, refund requests) to prevent destructive wins.`,
      },
    ],
    usedBy: ['hypothesis-testing-and-p-values', 'type-i-ii-errors-power-and-sample-size'],
    prereq: ['hypothesis-testing-and-p-values', 'type-i-ii-errors-power-and-sample-size', 'confidence-intervals'],
    related: ['simpsons-paradox-and-confounding', 'z-test-and-t-tests', 'chi-square-tests'],
    keywords: 'a-b testing online experiments randomized controlled trial srm sample ratio mismatch guardrail metrics conversion lift mde',
  },
  {
    id: 'simpsons-paradox-and-confounding',
    short: 'Simpson\'s Paradox & Confounding',
    title: r`Simpson's Paradox and Confounding`,
    task: 'concepts',
    module: 'Experiments and causality',
    level: 2,
    minutes: 17,
    noLab: true,
    summary: r`Discover how hidden confounding variables can reverse statistical conclusions between aggregated data and subgroup strata.`,
    lead: r`When analysing aggregated datasets, a statistical trend observed in the population can completely reverse direction when the data is partitioned into subgroups. This statistical phenomenon—Simpson's paradox—occurs when an unobserved or uncontrolled confounding variable distorts the marginal relationship between treatment and outcome. Understanding confounding and applying stratified analysis or causal adjustment prevents disastrously mistaken policy and business decisions.`,
    intuition: [
      r`Consider a clinical trial evaluating two treatments for kidney stones: Treatment A (an invasive open surgical procedure) and Treatment B (a non-invasive ultrasound procedure). Looking at the overall aggregate data across 700 patients, Treatment A succeeds in 273 out of 350 patients (78.0%), while Treatment B succeeds in 289 out of 350 patients (82.6%). A health authority inspecting only this aggregate summary would recommend Treatment B, which appears to boast a 4.6 percentage point advantage.`,
      r`Now partition the data by stone severity (the confounding variable): for small stones, Treatment A succeeds in 81/87 (93.1%), while Treatment B succeeds in 234/270 (86.7%)—Treatment A wins by 6.4 percentage points! For large stones, Treatment A succeeds in 192/263 (73.0%), while Treatment B succeeds in 55/80 (68.8%)—Treatment A wins again by 4.3 percentage points!`,
      r`Treatment A is medically superior for small stones AND superior for large stones. Yet when pooled together, Treatment A looks worse! Why does this happen? Stone severity acts as a confounder: severe cases have lower survival rates overall, and doctors disproportionately assigned severe patients to invasive Treatment A (263 vs 80). Treatment B received a flood of easy, mild cases (270 vs 87). Aggregation conflates treatment efficacy with patient sickness, producing an illusory reversal. Standardised adjustment reweighting by marginal stone size restores the true positive treatment effect of +5.4%.`,
    ],
    analogy: r`Simpson's paradox is like comparing two basketball players' overall shooting percentages when one player shoots mostly easy layups and the other takes contested three-pointers: the second player can have a higher percentage from both ranges yet have a lower overall score.`,
    steps: [
      r`Identify the treatment variable $X$, the outcome variable $Y$, and potential confounding covariates $Z$.`,
      r`Inspect the data at both the aggregated level and within stratified subgroups of $Z$.`,
      r`Test whether the confounder $Z$ is associated with both the treatment allocation $X$ and the outcome $Y$.`,
      r`Draw a causal directed acyclic graph (DAG) to determine if $Z$ is a true confounder ($X \leftarrow Z \rightarrow Y$) rather than a mediator ($X \rightarrow Z \rightarrow Y$).`,
      r`Compute stratum-specific effect sizes and combine them using weighted stratification or standardised adjustment.`,
      r`Interpret the adjusted causal effect rather than the misleading aggregated marginal association.`,
    ],
    math: [
      {
        h: 'Mathematical Formulation of Simpson\'s Reversal',
        tex: r`$$P(Y \mid X) < P(Y \mid \neg X) \quad \text{while} \quad P(Y \mid X, Z_k) > P(Y \mid \neg X, Z_k) \quad \forall k$$`,
        p: r`By the law of total probability, marginal probability is a weighted sum over subgroups: $P(Y \mid X) = \sum_k P(Y \mid X, Z_k) P(Z_k \mid X)$. When treatment assignment strongly correlates with the confounder $Z$, the subgroup weights $P(Z_k \mid X)$ differ dramatically, allowing the aggregate marginal comparison to reverse sign relative to every subgroup.`,
      },
      {
        h: 'Confounder Structure (Causal DAG)',
        tex: r`$$X \longleftarrow Z \longrightarrow Y$$`,
        p: r`A confounder $Z$ is a common cause that affects both treatment assignment $X$ and outcome $Y$. Failing to condition on $Z$ leaves an open backdoor path $X \leftarrow Z \rightarrow Y$, confounding the true causal effect of $X$ on $Y$ with non-causal association.`,
      },
      {
        h: 'Standardised Causal Risk Difference',
        tex: r`$$\Delta_{\text{adj}} = \sum_{k=1}^K \left[P(Y=1 \mid X=1, Z=k) - P(Y=1 \mid X=0, Z=k)\right] P(Z=k)$$`,
        p: r`Standardised adjustment eliminates confounding bias by re-weighting stratum-specific treatment differences by the marginal population distribution $P(Z=k)$ rather than the biased treatment-dependent weights $P(Z \mid X)$.`,
      },
    ],
    keyPoints: [
      r`Simpson's paradox occurs when an uncontrolled confounding variable is associated with both the treatment and the outcome.`,
      r`A treatment can be superior in every single subgroup yet appear inferior in aggregate data due to imbalanced allocation.`,
      r`True confounders must be controlled for; however, conditioning on a mediator ($X \rightarrow M \rightarrow Y$) or a collider ($X \rightarrow C \leftarrow Y$) introduces severe bias.`,
      r`Randomised controlled trials (A/B tests) prevent Simpson's paradox by forcing treatment allocation to be statistically independent of all baseline covariates.`,
    ],
    pitfalls: [
      r`Blindly trusting aggregate conversion rates or medical trial results without checking for subgroup imbalances.`,
      r`Controlling for variables that are consequences of the treatment (mediators), which blocks the true causal mechanism.`,
      r`Conditioning on colliders (common effects of treatment and outcome), which artificially manufactures non-existent correlations.`,
      r`Believing that collecting more observational data resolves Simpson's paradox; more unadjusted data simply estimates the biased number with higher precision.`,
    ],
    code: r`import numpy as np

# Kidney stone treatment data: [Successes, Total]
# Small stones: Treatment A vs B
a_small, a_small_tot = 81, 87      # 93.1%
b_small, b_small_tot = 234, 270    # 86.7%

# Large stones: Treatment A vs B
a_large, a_large_tot = 192, 263    # 73.0%
b_large, b_large_tot = 55, 80      # 68.8%

# Aggregated data
rate_a_agg = (a_small + a_large) / (a_small_tot + a_large_tot)
rate_b_agg = (b_small + b_large) / (b_small_tot + b_large_tot)

# Stratified differences within each stone size
diff_small = (a_small / a_small_tot) - (b_small / b_small_tot)
diff_large = (a_large / a_large_tot) - (b_large / b_large_tot)

# Standardised causal risk difference (reweighting by population stone distribution)
tot_small = a_small_tot + b_small_tot
tot_large = a_large_tot + b_large_tot
w_small = tot_small / (tot_small + tot_large)
w_large = tot_large / (tot_small + tot_large)
adj_causal_diff = w_small * diff_small + w_large * diff_large

print(f"Aggregate Success:  Treatment A={rate_a_agg:.1%}, B={rate_b_agg:.1%} (B appears +{rate_b_agg - rate_a_agg:.1%} better)")
print(f"Small Stones:       Treatment A={a_small/a_small_tot:.1%}, B={b_small/b_small_tot:.1%} (A is {diff_small:+.1%} better)")
print(f"Large Stones:       Treatment A={a_large/a_large_tot:.1%}, B={b_large/b_large_tot:.1%} (A is {diff_large:+.1%} better)")
print(f"Adjusted Causal Difference: {adj_causal_diff:+.1%} (Treatment A is truly superior)")`,
    quiz: [
      {
        q: r`What causes Simpson's paradox to occur in observational data?`,
        o: [
          r`Measurement rounding errors in digital databases`,
          r`A confounding variable that is correlated with both the treatment assignment and the outcome variable`,
          r`Small sample sizes that violate the central limit theorem`,
          r`Negative variances in the calculation`,
        ],
        a: 1,
        why: r`When an uncontrolled confounder influences both treatment allocation and the outcome, the marginal aggregated average is weighted unevenly, reversing the true subgroup direction.`,
      },
      {
        q: r`In the classic kidney stone example, why did Treatment B appear superior in the aggregate data despite being inferior in both stone subgroups?`,
        o: [
          r`Treatment B was given predominantly to patients with small stones (easy cases), inflating its overall success rate`,
          r`Treatment A was administered incorrectly`,
          r`The study had a Sample Ratio Mismatch`,
          r`The p-value was greater than 0.50`,
        ],
        a: 0,
        why: r`Doctors disproportionately assigned mild cases to Treatment B and severe cases to Treatment A, confounding treatment efficacy with baseline patient sickness.`,
      },
      {
        q: r`Why does running a properly randomised A/B test prevent Simpson's paradox from occurring?`,
        o: [
          r`Because randomisation forces sample sizes to be greater than 1,000`,
          r`Because random assignment ensures that all baseline confounding variables are balanced across treatment and control groups ($P(Z \mid X) = P(Z \mid \neg X)$)`,
          r`Because randomisation eliminates random noise`,
          r`Because it automatically stratifies data into deciles`,
        ],
        a: 1,
        why: r`Random assignment breaks the link between confounders and treatment ($X \leftarrow Z$), ensuring both groups have identical distributions of all baseline characteristics.`,
      },
      {
        q: r`In a causal DAG, what type of variable is positioned on the causal chain between treatment and outcome ($X \rightarrow M \rightarrow Y$)?`,
        o: [
          r`A confounder`,
          r`A mediator`,
          r`A collider`,
          r`An instrument`,
        ],
        a: 1,
        why: r`A mediator lies on the causal path from treatment to outcome. Controlling for a mediator blocks the causal effect rather than removing confounding.`,
      },
    ],
    usedBy: ['logistic_regression', 'decision_tree_classifier'],
    prereq: ['probability-rules-and-bayes-theorem', 'a-b-testing-end-to-end', 'correlation-pearson-spearman-kendall'],
    related: ['a-b-testing-end-to-end', 'logistic_regression', 'feature-selection'],
    keywords: 'simpsons paradox confounding causal inference backdoor path dag stratification observational data treatment effect',
  },
  {
    id: "sequential-testing-and-the-peeking-problem",
    short: "Sequential Testing & Peeking",
    title: "Sequential testing and the peeking problem",
    task: "concepts",
    module: "Experiments and causality`",
    level: 2,
    minutes: 20,
    noLab: true,
    summary: "Continuous monitoring (\"peeking\") at incoming experimental data in classical fixed-horizon A/B testing inflates False Positive Rates (Type I error) from a nominal 5% to over 30–40%. Because the test statistic performs a random walk across time, repeatedly evaluating whether p < 0.05 creates multiple testing across time, virtually guaranteeing that chance fluctuations will trigger a false rejection. Sequential testing frameworks—including Group Sequential Designs (O'Brien-Fleming alpha spending), Wald's Sequential Probability Ratio Test (SPRT), and Always-Valid p-values via martingales (mSPRT)—allow continuous experiment evaluation and early stopping while strictly controlling overall Type I error.",
    lead: "In digital product experimentation, product managers cannot resist checking experiment dashboards every morning. If the dashboard flashes \"Statistically Significant (p < 0.05)\" on Day 3, the temptation to declare victory and stop the experiment immediately is overwhelming. What happens if you stop an A/B test early the moment p < 0.05? You have committed the \"peeking problem\", drastically corrupting your statistical guarantees. How can data teams safely monitor live experiments and stop early for massive wins without destroying statistical validity?",
    intuition: [
      "The Random Walk of the p-Value: Under the null hypothesis (two identical variants), the difference in sample means is a stochastic Wiener process (Brownian motion). Even though the true effect is zero, random noise causes the difference to occasionally spike into the \"rejection zone\" before reverting to zero. If you only look once at sample size N, the chance of being in the rejection zone is 5%. But if you look every single day, you are giving random noise 30 chances to breach the threshold! Over a 30-day experiment, the true false alarm rate exceeds 35%.",
      "Alpha Spending Functions: You have a total budget of \\alpha = 0.05 to spend across the lifetime of the experiment. If you want to peek at multiple interim milestones, you must \"spend\" a tiny fraction of alpha early on and reserve the bulk for the end. The O'Brien-Fleming boundary sets extremely conservative early thresholds (e.g. requiring z > 4.5, p < 0.0001 on Day 1), ensuring that only colossal effects stop the test prematurely.",
      "Always-Valid p-Values and Martingales (mSPRT): Developed by Robbins and modernised by tech platforms (Netflix, experimentation platforms), mixture Sequential Probability Ratio Tests (mSPRT) construct test statistics that are mathematical martingales. By applying Ville's inequality, an always-valid p-value can be checked continuously after every single user with an ironclad mathematical guarantee: P(exists t : p_t <= \\alpha) <= \\alpha."
    ],
    analogy: "Imagine flipping a fair coin 10,000 times. By the law of large numbers, the percentage of heads will be close to 50% at the end. However, early on (e.g. at flip 5), you might see 4 heads and 1 tail (80% heads). If you allow yourself to stop the game whenever heads leads by 3 flips and declare \"the coin is biased toward heads!\", you will always find a moment to stop and \"prove\" the coin is biased. Fixed-horizon testing requires waiting until all 10,000 flips conclude. Sequential testing allows stopping early only if the coin produces a run of heads so astronomical that no fair coin could ever produce it.",
    steps: [
      {
        "title": "Define monitoring cadence and sample budget",
        "desc": "Specify maximum sample size N_max and planned interim inspection milestones.",
        "detail": "Determine whether evaluation occurs at discrete batches (Group Sequential) or continuously after every observation (mSPRT)."
      },
      {
        "title": "Select sequential stopping boundary",
        "desc": "Choose an alpha spending function (e.g. O'Brien-Fleming or Pocock).",
        "detail": "O'Brien-Fleming boundaries start extremely strict and converge to nominal alpha at 100% information, preserving end-of-test power. Pocock boundaries distribute alpha evenly across all looks."
      },
      {
        "title": "Calculate dynamic critical thresholds",
        "desc": "Compute adjusted critical values c(t) as a function of information fraction t = n / N_max.",
        "detail": "At look k with fraction t_k, evaluate threshold c(t_k). In O'Brien-Fleming, c(t) = z_{\\alpha/2} / \\sqrt{t}."
      },
      {
        "title": "Evaluate test statistic at interim milestones",
        "desc": "Check whether current test statistic exceeds the adjusted critical threshold.",
        "detail": "If |z_k| >= c(t_k), terminate early for efficacy (variant wins). If futility boundary is crossed, terminate early for lack of effect. If within continuation region, collect next batch."
      },
      {
        "title": "Compute always-valid p-values for continuous streaming",
        "desc": "Apply martingale-based mSPRT to enable anytime evaluation without look schedules.",
        "detail": "Track likelihood ratio martingale \\Lambda_n. Reject null whenever \\Lambda_n >= 1/\\alpha."
      }
    ],
    math: [
      {
        "h": "Type I Error Rate Inflation Under Repeated Peeking",
        "tex": "\\alpha_{\\text{inflated}} = P_{H_0}\\left( \\bigcup_{k=1}^K \\big\\{ |Z_k| \\ge z_{\\alpha/2} \\big\\} \\right) \\approx 1 - (1 - \\alpha)^K \\quad \\text{(upper bound)}, \\qquad \\lim_{K \\to \\infty} \\alpha_{\\text{inflated}} = 1.0",
        "p": "Because the sequence of test statistics Z_1, Z_2, \\dots, Z_K forms a correlated stochastic process, repeated evaluations against an unadjusted threshold cause Type I error to inflate rapidly with the number of looks K."
      },
      {
        "h": "O'Brien-Fleming Alpha Spending Boundary",
        "tex": "c(t) = \\frac{z_{\\alpha/2}}{\\sqrt{t}}, \\qquad \\alpha^*(t) = 2 \\left( 1 - \\Phi\\left(\\frac{z_{\\alpha/2}}{\\sqrt{t}}\\right) \\right), \\quad t = \\frac{n}{N_{\\max}} \\in (0, 1]",
        "p": "The O'Brien-Fleming boundary scales inversely with the square root of the information fraction t. Early in the experiment (small t), the required critical z-score is very high, guarding against premature false rejections while spending minimal alpha."
      },
      {
        "h": "Mixture Sequential Probability Ratio Test (mSPRT)",
        "tex": "\\Lambda_n = \\int_{-\\infty}^\\infty \\prod_{i=1}^n \\frac{f(x_i; \\theta)}{f(x_i; 0)} \\, dH(\\theta), \\qquad P_{H_0}\\left( \\exists n \\ge 1 : \\Lambda_n \\ge \\frac{1}{\\alpha} \\right) \\le \\alpha",
        "p": "By mixing likelihood ratios over a prior distribution H(\\theta) (typically Gaussian), \\Lambda_n is a non-negative martingale under H_0 with expectation 1. Ville's inequality guarantees that the probability of ever exceeding 1/\\alpha at ANY stopping time is bounded by \\alpha."
      }
    ],
    code: "\"\"\"\nThe Peeking Problem in A/B Testing vs O'Brien-Fleming Sequential Testing\nDemonstrates false positive rate inflation under naive monitoring\nand how sequential boundaries restore nominal alpha = 0.05.\n\"\"\"\n\nimport numpy as np\nfrom scipy import stats\n\nnp.random.seed(42)\nnum_simulations = 2000\nsample_size_max = 500\nnum_looks = 10  # Peek every 50 observations\nlook_points = np.linspace(50, sample_size_max, num_looks, dtype=int)\n\n# Simulate A/A tests (True effect = 0.0, both groups N(0, 1))\nnaive_false_positives = 0\nfixed_horizon_false_positives = 0\nobrien_fleming_false_positives = 0\n\nz_alpha_fixed = stats.norm.ppf(0.975)  # 1.96\n\nfor _ in range(num_simulations):\n    # Generate A and B observations\n    a = np.random.normal(0, 1, sample_size_max)\n    b = np.random.normal(0, 1, sample_size_max)\n    \n    # 1. Fixed Horizon Test (Only evaluate at the very end n = sample_size_max)\n    z_final = (np.mean(b) - np.mean(a)) / np.sqrt(2.0 / sample_size_max)\n    if abs(z_final) >= z_alpha_fixed:\n        fixed_horizon_false_positives += 1\n        \n    # 2. Naive Peeking (Check at every look using unadjusted z >= 1.96)\n    naive_stopped = False\n    of_stopped = False\n    \n    for look_idx, n in enumerate(look_points):\n        # Current z-statistic\n        sub_a = a[:n]\n        sub_b = b[:n]\n        z_k = (np.mean(sub_b) - np.mean(sub_a)) / np.sqrt(2.0 / n)\n        \n        # Check Naive Threshold\n        if not naive_stopped and abs(z_k) >= z_alpha_fixed:\n            naive_false_positives += 1\n            naive_stopped = True\n            \n        # Check O'Brien-Fleming Threshold\n        # t = information fraction n / N_max\n        t_frac = n / sample_size_max\n        c_t = z_alpha_fixed / np.sqrt(t_frac)\n        \n        if not of_stopped and abs(z_k) >= c_t:\n            obrien_fleming_false_positives += 1\n            of_stopped = True\n\nrate_fixed = (fixed_horizon_false_positives / num_simulations) * 100\nrate_naive = (naive_false_positives / num_simulations) * 100\nrate_of = (obrien_fleming_false_positives / num_simulations) * 100\n\nprint(f\"=== A/A Simulation Results ({num_simulations} simulated experiments, Nominal Alpha = 5.0%) ===\")\nprint(f\"1. Fixed Horizon (Check once at end):      {rate_fixed:5.2f}% False Positives (Controlled!)\")\nprint(f\"2. Naive Daily Peeking (Check every look): {rate_naive:5.2f}% False Positives (Dramatically Inflated!)\")\nprint(f\"3. O'Brien-Fleming Sequential Boundary:    {rate_of:5.2f}% False Positives (Controlled at ~5%!)\")\nprint(\"\\nO'Brien-Fleming Critical Z-Score Trajectory:\")\nfor n in look_points:\n    t = n / sample_size_max\n    c = z_alpha_fixed / np.sqrt(t)\n    p_thresh = 2 * (1 - stats.norm.cdf(c))\n    print(f\"  n = {n:3d} (t={t:.2f}) -> Required z >= {c:.2f} (p < {p_thresh:.5f})\")\n",
    keyPoints: [
      "Repeatedly checking p-values on accumulating data inflates Type I error rates from 5% to 30% or more.",
      "The peeking problem occurs because the difference in sample means executes a random walk that frequently touches significance thresholds by chance.",
      "Group Sequential Designs (O'Brien-Fleming) adjust critical boundaries across looks, requiring extreme evidence early on to preserve overall alpha.",
      "Martingale-based tests (mSPRT) provide always-valid p-values, allowing continuous real-time monitoring and stopping with strict mathematical guarantees."
    ],
    pitfalls: [
      "Stopping an experiment early for significance while using fixed-horizon p-values: This guarantees an elevated false positive rate and inflates estimated effect sizes (the winner's curse).",
      "Extending an experiment because it was 'almost significant': Post-hoc sample extension is peeking in reverse; it also severely inflates false positive rates.",
      "Failing to define N_max upfront in sequential testing: Group sequential boundaries depend on the maximum planned sample size N_max; without it, information fractions cannot be calculated."
    ],
    quiz: [
      {
        "q": "Why does checking an A/B test daily and stopping as soon as p < 0.05 inflate the False Positive Rate?",
        "o": [
          "Because test statistics fluctuate like a random walk over time, giving random chance multiple opportunities to breach the significance threshold",
          "Because sample variance decreases over time",
          "Because users become tired of seeing variant B",
          "Because computers round floating-point numbers differently each day"
        ],
        "a": 0,
        "why": "Continuous peeking creates multiple testing across time. Even when the null hypothesis is true, random Brownian fluctuations will cross the unadjusted z=1.96 boundary at some point with high probability."
      },
      {
        "q": "How does the O'Brien-Fleming boundary prevent false positive inflation during early looks?",
        "o": [
          "By requiring extremely conservative significance thresholds early in the test (e.g. z > 4.0, p < 0.0001) and gradually relaxing the threshold toward 1.96 as sample size approaches N_max",
          "By multiplying all p-values by 100",
          "By discarding all data collected during the first week",
          "By forcing the sample sizes of A and B to be odd numbers"
        ],
        "a": 0,
        "why": "O'Brien-Fleming sets critical threshold c(t) = z_{\\alpha/2} / \\sqrt{t}, spending negligible alpha during early looks and preserving the majority of the alpha budget for the final evaluation."
      },
      {
        "q": "What mathematical tool allows mSPRT to compute 'always-valid' p-values for continuous monitoring?",
        "o": [
          "Non-negative martingales and Ville's maximal inequality",
          "Fourier transforms",
          "Polynomial regression",
          "K-means clustering"
        ],
        "a": 0,
        "why": "The likelihood ratio in mSPRT is a non-negative martingale under H_0. Ville's inequality bounds the probability of the supremum over all time steps, guaranteeing strict Type I error control regardless of when peeking occurs."
      }
    ],
    usedBy: [],
    prereq: [
      "a-b-testing-end-to-end",
      "hypothesis-testing-and-p-values"
    ],
    related: [
      "a-b-testing-end-to-end",
      "bayesian-a-b-testing",
      "multiple-testing-bonferroni-holm-benjamini-hochberg",
      "type-i-ii-errors-power-and-sample-size"
    ],
    keywords: "sequential testing peeking problem a b testing obrien fleming alpha spending msprt martingales optional stopping"
  },
  {
    id: "bayesian-a-b-testing",
    short: "Bayesian A/B Testing",
    title: "Bayesian A/B testing",
    task: "concepts",
    module: "Experiments and causality",
    level: 2,
    minutes: 20,
    noLab: true,
    summary: "Bayesian A/B testing reformulates online experimentation from binary null-hypothesis significance testing (p-values) into direct posterior probability assessment. Instead of asking \"Is there a statistically significant difference under the assumption that the variants are identical?\", Bayesian testing answers the intuitive questions business stakeholders actually care about: \"What is the probability that Variant B is better than Variant A?\" (P(B > A)) and \"What is the expected financial loss if I choose Variant B and I am wrong?\" (Expected Loss / Bayes Risk). This framework naturally integrates historical priors and supports continuous decision-making without multiple testing penalties.",
    lead: "Ask an executive what a p-value of 0.03 means, and they will almost certainly say: \"There is a 97% chance Variant B is better than Variant A.\" In classical frequentist statistics, this interpretation is completely false: a p-value only measures how improbable the observed data would be if the two variants were identical. Why use a framework whose core output is routinely misunderstood? Bayesian A/B testing computes the exact quantity decision-makers desire: the direct probability of superiority and the monetary risk of making the wrong decision.",
    intuition: [
      "Probability of Superiority (P(B > A)): By placing prior distributions on conversion rates \\theta_A ~ Beta(\\alpha_A, \\beta_A) and \\theta_B ~ Beta(\\alpha_B, \\beta_B), observed customer conversions update these into posterior distributions. We can directly compute the probability that variant B has a higher conversion rate than variant A by integrating over the joint posterior: P(\\theta_B > \\theta_A | D).",
      "Expected Loss (Bayes Risk) as the Decision Threshold: Knowing P(B > A) = 90% is not enough. If B is better, it might beat A by only 0.01%; but if A is better, B might destroy conversion rates by 50%! Expected Loss computes the expected financial cost of choosing variant B when A is actually better: E[Loss | Choose B] = \\int_{\\theta_A > \\theta_B} (\\theta_A - \\theta_B) p(\\theta_A, \\theta_B | D) d\\theta_A d\\theta_B. When Expected Loss drops below a business threshold \\epsilon (e.g. 0.001 lift), you can safely ship Variant B with guaranteed bounded risk.",
      "Natural Peeking and Continuous Stopping: In Bayesian inference, the posterior distribution at step n is an exact reflection of all evidence accumulated up to step n. Updating posteriors as data streams in does not corrupt the posterior. You can evaluate Expected Loss continuously and stop whenever uncertainty is sufficiently small."
    ],
    analogy: "Imagine deciding between two routes to the airport. A frequentist test assumes both routes take identical time, collects 50 test drives, and computes whether the observed difference is rare enough to reject equality. A Bayesian driver combines traffic reports (priors) with live GPS data (observations) to output: \"Route B has an 88% chance of being faster, and if you choose Route B and it turns out to be slower, you will lose on average only 45 seconds.\" That expected loss lets the driver make a rational, risk-calibrated choice instantly.",
    steps: [
      {
        "title": "Specify prior distributions for conversion rates",
        "desc": "Select informative or uninformative conjugate Beta priors \\theta ~ Beta(\\alpha, \\beta).",
        "detail": "Use historical baseline data to calibrate prior parameters (e.g. Beta(100, 900) for a 10% historical conversion rate), or use uninformative Beta(1, 1)."
      },
      {
        "title": "Update posterior distributions with experiment data",
        "desc": "Apply analytical Beta-Binomial updating rule: \\theta | (y, n) ~ Beta(\\alpha + y, \\beta + n - y).",
        "detail": "Add observed successes y and failures n - y directly to the prior shape parameters for both Variant A and Variant B."
      },
      {
        "title": "Compute Probability of Superiority",
        "desc": "Calculate P(\\theta_B > \\theta_A | D) via numerical integration or Monte Carlo draws.",
        "detail": "Sample 100,000 draws from both posterior Beta distributions and calculate the proportion of samples where \\theta_B > \\theta_A."
      },
      {
        "title": "Evaluate Expected Loss (Bayes Risk) for each decision",
        "desc": "Quantify the expected downside: E[max(0, \\theta_A - \\theta_B)] if B is chosen, and vice versa.",
        "detail": "Calculate the average magnitude of error when the decision is wrong. If choosing B and \\theta_A > \\theta_B, you lose \\theta_A - \\theta_B."
      },
      {
        "title": "Execute stopping rule against risk threshold",
        "desc": "Conclude experiment and ship the winning variant when Expected Loss <= \\epsilon.",
        "detail": "Define business tolerance threshold \\epsilon (e.g. 0.1% absolute conversion rate). Once Expected Loss drops below \\epsilon, deploy the winner."
      }
    ],
    math: [
      {
        "h": "Beta-Binomial Conjugate Posterior Updating",
        "tex": "\\theta_A \\mid (y_A, n_A) \\sim \\text{Beta}(\\alpha_0 + y_A, \\; \\beta_0 + n_A - y_A), \\qquad \\theta_B \\mid (y_B, n_B) \\sim \\text{Beta}(\\alpha_0 + y_B, \\; \\beta_0 + n_B - y_B)",
        "p": "The Beta distribution is conjugate to the Binomial likelihood. The posterior parameters represent effective pseudo-counts of successes and failures combining prior beliefs with observed experimental results."
      },
      {
        "h": "Probability of Superiority Formulation",
        "tex": "P(\\theta_B > \\theta_A \\mid \\mathcal{D}) = \\int_0^1 f(\\theta_B \\mid \\mathcal{D}_B) \\left[ \\int_0^{\\theta_B} f(\\theta_A \\mid \\mathcal{D}_A) \\, d\\theta_A \\right] d\\theta_B",
        "p": "Because Variant A and Variant B are sampled independently, their joint posterior distribution factorises as p(\\theta_A, \\theta_B \\mid \\mathcal{D}) = p(\\theta_A \\mid \\mathcal{D}_A) \\, p(\\theta_B \\mid \\mathcal{D}_B). The probability that B beats A is the volume of the joint distribution above the diagonal \\theta_B > \\theta_A."
      },
      {
        "h": "Expected Loss (Bayes Risk)",
        "tex": "\\mathcal{L}_B = \\mathbb{E}\\Big[\\max(0, \\, \\theta_A - \\theta_B) \\;\\Big|\\; \\mathcal{D}\\Big], \\qquad \\mathcal{L}_A = \\mathbb{E}\\Big[\\max(0, \\, \\theta_B - \\theta_A) \\;\\Big|\\; \\mathcal{D}\\Big]",
        "p": "Expected Loss calculates the expected penalty incurred if you choose a given variant and that variant is suboptimal. Unlike p-values which only measure evidence against equality, Expected Loss directly measures economic risk."
      }
    ],
    code: "\"\"\"\nBayesian A/B Testing Framework\nDemonstrating Beta-Binomial posterior updating, Probability of Superiority,\nExpected Loss (Bayes Risk), and threshold stopping rules.\n\"\"\"\n\nimport numpy as np\n\n# Experiment Setup:\n# Variant A (Control): 1,000 visitors, 120 conversions (12.0%)\n# Variant B (Treatment): 1,000 visitors, 145 conversions (14.5%)\nvisitors_a, conv_a = 1000, 120\nvisitors_b, conv_b = 1000, 145\n\n# Prior: Weakly informative Beta(alpha=10, beta=90) -> Prior Mean = 10%\nalpha_prior = 10.0\nbeta_prior = 90.0\n\n# Posterior Beta parameters\nalpha_post_a = alpha_prior + conv_a\nbeta_post_a = beta_prior + (visitors_a - conv_a)\n\nalpha_post_b = alpha_prior + conv_b\nbeta_post_b = beta_prior + (visitors_b - conv_b)\n\n# Monte Carlo Sampling from Posteriors\nnum_draws = 100000\ndraws_a = np.random.beta(alpha_post_a, beta_post_a, size=num_draws)\ndraws_b = np.random.beta(alpha_post_b, beta_post_b, size=num_draws)\n\n# 1. Probability of Superiority P(B > A)\nprob_b_better = np.mean(draws_b > draws_a)\n\n# 2. Relative Lift Distribution: (B - A) / A\nrelative_lift = (draws_b - draws_a) / draws_a\nexpected_lift = np.mean(relative_lift)\nlift_ci_lower = np.percentile(relative_lift, 2.5)\nlift_ci_upper = np.percentile(relative_lift, 97.5)\n\n# 3. Expected Loss (Bayes Risk)\n# Loss if we choose B: max(0, A - B)\nloss_choose_b = np.mean(np.maximum(0, draws_a - draws_b))\n# Loss if we choose A: max(0, B - A)\nloss_choose_a = np.mean(np.maximum(0, draws_b - draws_a))\n\n# Business Decision Rule: Stop and ship B if Expected Loss <= 0.001 (0.1% conversion rate)\nrisk_threshold = 0.0010\nship_b = loss_choose_b <= risk_threshold\n\nprint(f\"=== Bayesian A/B Test Analysis ===\")\nprint(f\"Variant A: {conv_a}/{visitors_a} ({conv_a/visitors_a:.1%}) -> Posterior Mean: {np.mean(draws_a):.3f}\")\nprint(f\"Variant B: {conv_b}/{visitors_b} ({conv_b/visitors_b:.1%}) -> Posterior Mean: {np.mean(draws_b):.3f}\")\n\nprint(f\"\\nProbability Variant B is Superior: P(B > A) = {prob_b_better:.1%}\")\nprint(f\"Expected Relative Lift: {expected_lift:.1%} [95% Credible Interval: {lift_ci_lower:.1%}, {lift_ci_upper:.1%}]\")\n\nprint(f\"\\nExpected Loss if choosing B: {loss_choose_b:.5f} ({loss_choose_b * 100:.3f}% conversion rate)\")\nprint(f\"Expected Loss if choosing A: {loss_choose_a:.5f} ({loss_choose_a * 100:.3f}% conversion rate)\")\n\nprint(f\"\\nDecision against Risk Threshold (epsilon = {risk_threshold}):\")\nif ship_b:\n    print(f\"  SHIP VARIANT B: Expected risk ({loss_choose_b:.5f}) is within acceptable threshold ({risk_threshold})!\")\nelse:\n    print(f\"  CONTINUE EXPERIMENT: Expected risk ({loss_choose_b:.5f}) exceeds threshold.\")\n",
    keyPoints: [
      "Bayesian A/B testing computes direct posterior probabilities of superiority: P(\\theta_B > \\theta_A | \\mathcal{D}).",
      "Expected Loss (Bayes Risk) measures the economic cost of making the wrong decision, providing an actionable stopping criterion.",
      "Historical priors easily incorporate baseline domain knowledge, anchoring small-sample experiments against extreme flukes.",
      "Because posteriors represent cumulative updated evidence, Bayesian testing allows continuous monitoring without multiple testing inflation."
    ],
    pitfalls: [
      "Relying solely on Probability of Superiority without checking Expected Loss: A variant might have P(B > A) = 95% but possess a heavy left tail that risks catastrophic financial losses if wrong.",
      "Using overly strong subjective priors without validation: An aggressive prior requires substantial experimental evidence to overturn, potentially masking real treatment gains.",
      "Confusing credible intervals with confidence intervals: A 95% Bayesian credible interval means there is a 95% probability the true parameter lies within the bounds; a frequentist confidence interval does not carry this interpretation."
    ],
    quiz: [
      {
        "q": "In Bayesian A/B testing, what does 'Expected Loss' measure?",
        "o": [
          "The expected reduction in conversion rate or financial metric if you deploy a variant that turns out to be inferior to the alternative",
          "The cost of cloud server hosting for the experiment",
          "The percentage of users who bounce from the landing page",
          "The p-value multiplied by the sample size"
        ],
        "a": 0,
        "why": "Expected Loss calculates E[max(0, \\theta_A - \\theta_B)]. It quantifies the expected margin of regret if you choose variant B and variant A was actually better."
      },
      {
        "q": "Why is continuous monitoring permissible in Bayesian A/B testing without the classical 'peeking problem'?",
        "o": [
          "Because the posterior distribution at any point in time is a mathematically valid representation of total accumulated evidence, independent of how many times it was inspected",
          "Because Bayesian statistics does not allow early stopping",
          "Because Bayesian tests only use 10 samples",
          "Because prior distributions eliminate all variance"
        ],
        "a": 0,
        "why": "In Bayesian inference, probability is a measure of belief given data. The posterior distribution after n observations is identical whether you inspected it 100 times or zero times prior to step n."
      },
      {
        "q": "What conjugate prior family is used to model conversion rates in binary A/B testing?",
        "o": [
          "Beta distribution (Beta-Binomial conjugate pair)",
          "Gaussian distribution",
          "Poisson distribution",
          "Weibull distribution"
        ],
        "a": 0,
        "why": "The Beta distribution is conjugate to the Binomial likelihood: updating Beta(\\alpha, \\beta) with y successes and n-y failures produces Beta(\\alpha + y, \\beta + n - y)."
      }
    ],
    usedBy: [],
    prereq: [
      "a-b-testing-end-to-end",
      "conjugate-priors-beta-binomial"
    ],
    related: [
      "a-b-testing-end-to-end",
      "sequential-testing-and-the-peeking-problem",
      "map-and-bayesian-estimation",
      "conjugate-priors-beta-binomial"
    ],
    keywords: "bayesian a b testing expected loss bayes risk probability of superiority beta binomial conjugate prior conversion rate"
  },
  {
    id: "causal-graphs-dags-and-adjustment",
    short: "Causal Graphs & Adjustment",
    title: "Causal graphs (DAGs) and adjustment",
    task: "concepts",
    module: "Experiments and causality",
    level: 2,
    minutes: 20,
    noLab: true,
    summary: "Causal Directed Acyclic Graphs (DAGs) and Pearl's structural causal framework provide the mathematical language to differentiate mere statistical correlation from genuine causal effect. By formalising causal assumptions as directional graphical models (X -> Y), causal DAGs systematically identify confounding, mediation, and collider structures. The Backdoor Criterion and d-separation establish exactly which set of covariates Z must be controlled for—and crucially, which variables must NOT be conditioned on (to avoid collider stratification bias)—to eliminate spurious confounding and identify causal effects from observational data.",
    lead: "\"Correlation does not imply causation\"—every data scientist knows this axiom, yet when building predictive models, how do you decide which variables to include as regression controls? Adding more control variables is not always safe: controlling for the wrong variable can create massive spurious correlations that did not exist in the raw data! Pearl's causal DAGs provide the mathematical calculus to identify true causal pathways, avoid collider bias, and determine whether observational data can answer causal questions.",
    intuition: [
      "The Three Fundamental Causal Junctions: Any causal graph is built from three 3-node patterns:\n- Chain (Mediation): X -> M -> Y. X causes M, which causes Y. Conditioning on mediator M blocks the causal path between X and Y.\n- Fork (Confounder): X <- Z -> Y. Confounder Z causes both X and Y, creating a spurious non-causal association. Conditioning on Z blocks the spurious correlation.\n- Collider: X -> C <- Y. Both X and Y independently cause collider C. In the unconditioned data, X and Y are independent! But if you condition on collider C (or a descendant of C), you open a spurious path and induce artificial correlation between X and Y!",
      "The Danger of Bad Controls (Collider Stratification Bias): Suppose being a brilliant actor (X) and having movie star looks (Y) are completely independent in the general population. But to be cast in Hollywood films (C), you need either talent or looks (X -> C <- Y). If you only analyse Hollywood actors (conditioning on C), you will find a strong negative correlation: talented actors seem less attractive, and attractive actors seem less talented! This is Berkson's fallacy / collider bias.",
      "The Backdoor Criterion: To find the true causal effect of treatment X on outcome Y, you must block all \"backdoor paths\" (paths that start with an arrow pointing into X: X <- ... -> Y) by conditioning on a valid adjustment set Z, without conditioning on any collider or descendant of X."
    ],
    analogy: "Imagine water flowing through a plumbing pipe network from tap X to drain Y. A backdoor path is an accidental cross-connection through an upstream water tower Z that leaks into both pipes. Conditioning on a confounder is closing a valve on the leak so only water from tap X reaches drain Y. A collider is a shared flood sensor that is normally dry; if you tamper with it (condition on it), you inadvertently create an electrical short that connects two previously isolated pipe valves together.",
    steps: [
      {
        "title": "Construct causal DAG encoding domain knowledge",
        "desc": "Draw directed arrows representing causal mechanisms between variables.",
        "detail": "Ensure the graph is acyclic (no feedback loops). Include unobserved latent confounders where unmeasured shared causes exist."
      },
      {
        "title": "Identify all paths between treatment and outcome",
        "desc": "Catalogue both directed causal paths (X -> ... -> Y) and backdoor paths (X <- ... -> Y).",
        "detail": "A backdoor path is any undirected path connecting X and Y that starts with an arrow pointing into treatment X."
      },
      {
        "title": "Classify all path junctions using d-separation",
        "desc": "Identify forks (A <- B -> C), chains (A -> B -> C), and colliders (A -> B <- C).",
        "detail": "Remember the golden d-separation rules: unconditioned colliders are naturally blocked; conditioning on a non-collider blocks a path; conditioning on a collider opens a path."
      },
      {
        "title": "Select valid adjustment set via Backdoor Criterion",
        "desc": "Find a set of covariates Z that blocks all backdoor paths without including descendants of X.",
        "detail": "Conditioning on Z neutralises confounding without introducing collider stratification bias or blocking causal mediators."
      },
      {
        "title": "Estimate causal effect using backdoor adjustment",
        "desc": "Estimate P(Y | do(X=x)) = sum_z P(Y | X=x, Z=z) P(Z=z) via multivariable regression or matching.",
        "detail": "Fit regression model including treatment X and adjustment set Z. The coefficient on X represents the true causal effect."
      }
    ],
    math: [
      {
        "h": "The do-Operator and Causal Effect Identification",
        "tex": "P(Y = y \\mid \\text{do}(X = x)) \\neq P(Y = y \\mid X = x), \\qquad P(Y = y \\mid \\text{do}(X = x)) = \\sum_{\\mathbf{z}} P(Y = y \\mid X = x, \\mathbf{Z} = \\mathbf{z}) \\, P(\\mathbf{Z} = \\mathbf{z})",
        "p": "The do-operator \\text{do}(X=x) represents a physical intervention that severs all incoming arrows into X, setting X to value x. When the set of covariates \\mathbf{Z} satisfies the Backdoor Criterion, the causal effect is identified from purely observational data using the adjustment formula."
      },
      {
        "h": "The Backdoor Criterion (Pearl)",
        "tex": "\\mathbf{Z} \\text{ satisfies Backdoor Criterion for } (X, Y) \\iff \\begin{cases} (1) \\; \\text{No node in } \\mathbf{Z} \\text{ is a descendant of } X \\\\ (2) \\; \\mathbf{Z} \\text{ d-separates (blocks) every path } X \\leftarrow \\dots \\to Y \\end{cases}",
        "p": "Condition (1) ensures that causal mechanisms mediated by X are not accidentally blocked. Condition (2) ensures that all spurious non-causal confounding associations are completely blocked."
      },
      {
        "h": "Collider Conditioning Bias (Berkson's Paradox)",
        "tex": "X \\perp Y \\quad \\text{but} \\quad X \\not\\perp Y \\mid C \\quad \\text{for collider junction } X \\to C \\leftarrow Y",
        "p": "Two independent causes X and Y become conditionally dependent when conditioning on their common effect C (or any descendant of C). Conditioning on a collider induces spurious negative or positive correlation where none exists in the population."
      }
    ],
    code: "\"\"\"\nCausal DAG Simulation: Confounding vs Collider Bias\nDemonstrating that adding control variables can eliminate confounding\nOR artificially introduce collider bias (Berkson's fallacy).\n\"\"\"\n\nimport numpy as np\n\n# Ground Truth Causal Data Generating Process:\n# Z (Confounder: Socioeconomic status) -> X (Education) and Y (Health)\n# True Causal Effect of Education on Health = 2.0\n# C (Collider: Hospital admission) <- X (Education) and Y (Health)\nnp.random.seed(42)\nN = 10000\n\n# 1. Confounder Z\nz_socioeconomic = np.random.normal(loc=0.0, scale=1.0, size=N)\n\n# 2. Treatment X (caused by Z + independent noise)\nx_education = 1.5 * z_socioeconomic + np.random.normal(0, 1, size=N)\n\n# 3. Outcome Y (caused by X with true effect beta=2.0 + Z + noise)\ntrue_causal_beta = 2.0\ny_health = true_causal_beta * x_education + 2.5 * z_socioeconomic + np.random.normal(0, 1, size=N)\n\n# 4. Collider C (caused by BOTH X and Y)\n# e.g. Admission to a specialised clinic: C = 1 if 0.8*X + 0.8*Y + noise > 2.0\ncollider_score = 0.8 * x_education + 0.8 * y_health + np.random.normal(0, 1, size=N)\nc_admitted = (collider_score > 1.5).astype(int)\n\ndef fit_ols(y_vec, *x_vecs):\n    \"\"\"Simple OLS solver returning slope coefficients.\"\"\"\n    X_mat = np.column_stack([np.ones(len(y_vec))] + list(x_vecs))\n    beta = np.linalg.inv(X_mat.T @ X_mat) @ (X_mat.T @ y_vec)\n    return beta\n\nprint(\"=== Causal Inference Demonstration: True Causal Effect beta = 2.00 ===\")\n\n# Model 1: Naive Regression (No controls: Y ~ X)\n# Confounded by Z!\nbeta_naive = fit_ols(y_health, x_education)\nprint(f\"1. Naive Regression (Y ~ X):                   Estimated beta = {beta_naive[1]:.3f} (Severely Confounded!)\")\n\n# Model 2: Valid Backdoor Adjustment (Y ~ X + Z)\n# Blocks the backdoor path X <- Z -> Y\nbeta_adjusted = fit_ols(y_health, x_education, z_socioeconomic)\nprint(f\"2. Valid Backdoor Adjustment (Y ~ X + Z):      Estimated beta = {beta_adjusted[1]:.3f} (Recovers True Effect!)\")\n\n# Model 3: Bad Control - Conditioning on Collider C (Y ~ X + Z + C)\n# Inadvertently opens the collider path X -> C <- Y!\nbeta_collider = fit_ols(y_health, x_education, z_socioeconomic, collider_score)\nprint(f\"3. Bad Control / Collider Bias (Y ~ X + Z + C):Estimated beta = {beta_collider[1]:.3f} (Biased by Collider!)\")\n\n# Model 4: Berkson's Fallacy (Analysing only the admitted subpopulation C == 1)\nmask = (c_admitted == 1)\nbeta_subpop = fit_ols(y_health[mask], x_education[mask], z_socioeconomic[mask])\nprint(f\"4. Stratified on Collider (Subset where C=1):   Estimated beta = {beta_subpop[1]:.3f} (Berkson's Bias!)\")\n",
    keyPoints: [
      "Causal DAGs represent causal mechanisms via directed acyclic graphs, distinguishing correlation from causation.",
      "The three fundamental junctions are Chains (mediation), Forks (confounding), and Colliders (common effects).",
      "Confounders must be controlled for to block spurious backdoor paths; colliders must NOT be conditioned on, as conditioning opens spurious association.",
      "The Backdoor Criterion provides the graphical rules for identifying valid adjustment sets from observational data."
    ],
    pitfalls: [
      "The 'kitchen sink' regression trap: Adding all available features as control variables often controls for colliders or mediators, destroying causal validity.",
      "Controlling for post-treatment variables: Conditioning on an outcome of treatment (mediator) blocks the very causal mechanism being measured.",
      "Assuming causal DAGs can be discovered purely from data without assumptions: Observational data can identify Markov equivalence classes, but orienting arrows requires domain knowledge or physical interventions."
    ],
    quiz: [
      {
        "q": "In a causal DAG, what happens when you condition on a collider node (X -> C <- Y)?",
        "o": [
          "You inadvertently open a spurious non-causal path between X and Y, inducing artificial correlation (collider stratification bias / Berkson's fallacy)",
          "You completely eliminate all confounding in the dataset",
          "You reverse the direction of time in the graph",
          "The causal effect becomes impossible to calculate on a computer"
        ],
        "a": 0,
        "why": "An unconditioned collider naturally blocks association between X and Y. Conditioning on the collider opens the path, creating an artificial statistical association between its independent causes."
      },
      {
        "q": "What two conditions must a set of covariates Z satisfy to meet the Backdoor Criterion for (X, Y)?",
        "o": [
          "No variable in Z can be a descendant of treatment X, and Z must block (d-separate) every backdoor path from X to Y",
          "Z must include every variable in the dataset",
          "Z must be perfectly correlated with X",
          "Z must be measured after outcome Y"
        ],
        "a": 0,
        "why": "Pearl's Backdoor Criterion requires that Z blocks all confounding paths (X <- ... -> Y) without conditioning on any downstream consequence of treatment X (descendant)."
      },
      {
        "q": "What is the difference between P(Y | X=x) and P(Y | do(X=x))?",
        "o": [
          "P(Y | X=x) represents passive observation which can be confounded, whereas P(Y | do(X=x)) represents physical intervention where incoming causes to X are severedd",
          "They are identical in all statistical models",
          "P(Y | do(X=x)) can only be evaluated in laboratory chemistry experiments",
          "P(Y | X=x) is always equal to 1.0"
        ],
        "a": 0,
        "why": "Observational conditioning P(Y | X=x) filters existing data (and includes confounding associations). The do-operator P(Y | do(X=x)) simulates an intervention that fixes X, establishing genuine causal impact."
      }
    ],
    usedBy: [],
    prereq: [
      "a-b-testing-end-to-end",
      "simpsons-paradox-and-confounding"
    ],
    related: [
      "simpsons-paradox-and-confounding",
      "a-b-testing-end-to-end",
      "bayesian-a-b-testing",
      "ols-inference-t-tests-f-test-r2-and-adjusted-r2"
    ],
    keywords: "causal graphs dags backdoor criterion d-separation colliders confounding berksons fallacy do-operator structural causal models"
  },
  {
    id: "propensity-scores-and-matching",
    short: "Propensity Scores & Matching",
    title: "Propensity scores and matching",
    task: "concepts",
    module: "Experiments and causality",
    level: 2,
    minutes: 20,
    noLab: true,
    summary: "Propensity score methods estimate causal treatment effects from observational data by addressing non-random treatment assignment and covariate imbalance. The propensity score e(\\mathbf{x}) = P(D = 1 | \\mathbf{X} = \\mathbf{x}) acts as a balancing score: conditional on e(\\mathbf{x}), the distribution of measured baseline covariates \\mathbf{X} is statistically independent of treatment assignment D. By pairing, stratifying, or weighting units via Inverse Probability Weighting (IPW), propensity methods emulate randomised controlled trials, isolating the Average Treatment Effect (ATE) and Average Treatment Effect on the Treated (ATT) under the assumption of unconfoundedness.",
    lead: "Suppose you want to know whether a premium customer subscription increases annual spending. In observational logs, customers who purchase the subscription already spend vastly more than non-subscribers before ever buying the membership. Comparing raw averages is wildly confounded by selection bias. Randomised controlled trials are often impossible, unethical, or prohibitively expensive. How can we synthesise a fair \"apples-to-apples\" comparison from observational data? Propensity score matching creates balanced synthetic cohorts, pairing each subscriber with an identical non-subscriber who had the exact same propensity to subscribe.",
    intuition: [
      "The Balancing Score Property (Rosenbaum & Rubin, 1983): If you have 50 baseline covariates (age, income, browsing frequency, geography), matching on all 50 dimensions simultaneously suffers from the curse of dimensionality—no two humans are identical across 50 features. Rosenbaum and Rubin proved a remarkable theorem: you do not need to match on all 50 covariates. You only need to match on a single 1D scalar: the propensity score e(x) = P(D=1 | X=x)! Conditional on having the same probability of receiving treatment, the distribution of all 50 covariates is balanced between treated and control units.",
      "Common Support and Positivity: For a valid causal comparison, there must be \"common support\" (positivity: 0 < e(x) < 1). If certain customers have a 100% probability of subscribing (e.g. enterprise accounts), no comparable control unit exists. Units outside the common support overlap region must be trimmed.",
      "Matching vs Weighting (IPW):\n- Propensity Score Matching (PSM): For each treated unit, find the nearest control unit with the closest propensity score (e.g. within a caliper of 0.05).\n- Inverse Probability Weighting (IPW): Keep all data, but weight each unit by the inverse probability of receiving their actual treatment: w_i = D_i / e(x_i) + (1 - D_i) / (1 - e(x_i)). This upweights under-represented units to create a balanced pseudo-population."
    ],
    analogy: "Imagine comparing the driving performance of sports car owners versus minivan drivers. Sports car owners might speed more, but is it the car or the fact that sports car owners are younger and more aggressive? A propensity score model calculates each driver's probability of buying a sports car based on age, income, and lifestyle. Matching then pairs a 28-year-old sports car owner with a 28-year-old minivan driver who had the exact same 70% probability of buying a sports car but happened to buy a minivan instead. Comparing these matched twins isolates the true causal effect of the vehicle.",
    steps: [
      {
        "title": "Estimate propensity scores from baseline covariates",
        "desc": "Fit logistic regression or gradient-boosted trees to predict treatment probability e(x) = P(D=1 | X).",
        "detail": "Include all pre-treatment covariates that affect both treatment selection and outcome. Check that model outputs well-calibrated probabilities."
      },
      {
        "title": "Evaluate common support and trim non-overlapping regions",
        "desc": "Plot propensity score distributions for treated and control cohorts.",
        "detail": "Discard treated units with propensity scores higher than any control unit, and control units with scores lower than any treated unit to prevent extrapolation."
      },
      {
        "title": "Perform cohort matching or calculate IPW weights",
        "desc": "Execute nearest-neighbour caliper matching or calculate inverse probability weights.",
        "detail": "Pair treated units with control units whose propensity scores fall within a defined caliper distance (e.g. 0.2 standard deviations of logit propensity)."
      },
      {
        "title": "Assess post-matching covariate balance",
        "desc": "Calculate Standardised Mean Differences (SMD) across all baseline covariates.",
        "detail": "Confirm that SMD < 0.10 for all covariates. If imbalances persist, refine the propensity specification with polynomial or interaction terms."
      },
      {
        "title": "Estimate treatment effect on balanced sample",
        "desc": "Compute difference in outcomes between matched cohorts to obtain ATT or ATE.",
        "detail": "Evaluate the treatment effect using paired t-tests or weighted regression with cluster-robust standard errors."
      }
    ],
    math: [
      {
        "h": "The Propensity Score Balancing Property",
        "tex": "e(\\mathbf{x}) \\equiv P(D = 1 \\mid \\mathbf{X} = \\mathbf{x}), \\qquad \\mathbf{X} \\perp D \\mid e(\\mathbf{x})",
        "p": "The propensity score is the coarsest balancing score. Conditioning on e(\\mathbf{x}) renders the multi-dimensional covariate vector \\mathbf{X} statistically independent of treatment assignment D, removing all observable confounding."
      },
      {
        "h": "Unconfoundedness (Conditional Independence Assumption)",
        "tex": "\\big(Y(1), Y(0)\\big) \\perp D \\mid \\mathbf{X} \\implies \\big(Y(1), Y(0)\\big) \\perp D \\mid e(\\mathbf{x})",
        "p": "If potential outcomes (Y(1), Y(0)) are independent of treatment conditional on \\mathbf{X} (no unmeasured confounders), then conditional independence holds given the one-dimensional propensity score e(\\mathbf{x})."
      },
      {
        "h": "Inverse Probability Weighting (IPW) Estimator for ATE",
        "tex": "\\hat{\\tau}_{\\text{ATE}} = \\frac{1}{N} \\sum_{i=1}^N \\left( \\frac{D_i Y_i}{\\hat{e}(\\mathbf{x}_i)} - \\frac{(1 - D_i) Y_i}{1 - \\hat{e}(\\mathbf{x}_i)} \\right)",
        "p": "IPW reweights the sample so that both treated and control groups reflect the covariate distribution of the combined population. Treated units with low propensity and control units with high propensity receive higher weights."
      }
    ],
    code: "\"\"\"\nPropensity Score Matching (PSM) vs Naive Comparison\nDemonstrating confounding correction, covariate balance diagnostics,\nand nearest-neighbour caliper matching on observational data.\n\"\"\"\n\nimport numpy as np\n\n# Simulate observational customer study\n# True Causal Effect of Premium Membership on Annual Spend = £50.00\nnp.random.seed(42)\nN = 1000\n\n# Confounders: Age and Prior Year Spending (in £)\nage = np.random.normal(38.0, 8.0, N)\nprior_spend = np.random.normal(300.0, 80.0, N)\n\n# Treatment assignment D (Premium Membership): Older and higher-spending users are far more likely to buy\n# Logit propensity = -6.0 + 0.08 * age + 0.012 * prior_spend\nlogit_prop = -6.0 + 0.08 * age + 0.012 * prior_spend\ntrue_propensity = 1.0 / (1.0 + np.exp(-logit_prop))\nmembership = np.random.binomial(1, true_propensity)\n\n# Observed Outcome Y (Annual Spend in £):\n# True effect is +£50, but prior spend and age strongly drive spending\ntrue_effect = 50.0\nannual_spend = 100.0 + true_effect * membership + 1.2 * prior_spend + 2.0 * age + np.random.normal(0, 25, N)\n\n# 1. Naive Comparison (Raw Difference in Means)\nnaive_treated_mean = np.mean(annual_spend[membership == 1])\nnaive_control_mean = np.mean(annual_spend[membership == 0])\nnaive_diff = naive_treated_mean - naive_control_mean\n\nprint(\"=== Observational Data Summary ===\")\nprint(f\"Total Customers: {N} | Treated (Members): {np.sum(membership)} | Control: {N - np.sum(membership)}\")\nprint(f\"Naive Observed Difference: £{naive_diff:.2f} (True Causal Effect is £{true_effect:.2f} -> Massively Overestimated!)\")\n\n# 2. Estimate Propensity Scores via Logistic Regression\n# Design matrix\nX_cov = np.column_stack([np.ones(N), age, prior_spend])\n# Quick Newton-Raphson logistic fit\nbeta_prop = np.zeros(3)\nfor _ in range(15):\n    p_hat = 1.0 / (1.0 + np.exp(-np.clip(X_cov @ beta_prop, -30, 30)))\n    w = np.maximum(p_hat * (1 - p_hat), 1e-10)\n    grad = X_cov.T @ (membership - p_hat)\n    hess = -X_cov.T @ (w[:, np.newaxis] * X_cov)\n    beta_prop += np.linalg.solve(-hess, grad)\n\nest_propensity = 1.0 / (1.0 + np.exp(-np.clip(X_cov @ beta_prop, -30, 30)))\n\n# 3. Nearest-Neighbour Caliper Matching (1:1 with replacement)\ntreated_indices = np.where(membership == 1)[0]\ncontrol_indices = np.where(membership == 0)[0]\ncaliper = 0.05\n\nmatched_pairs = []\nfor t_idx in treated_indices:\n    p_t = est_propensity[t_idx]\n    diffs = np.abs(est_propensity[control_indices] - p_t)\n    best_c_idx = control_indices[np.argmin(diffs)]\n    if diffs[np.argmin(diffs)] <= caliper:\n        matched_pairs.append((t_idx, best_c_idx))\n\nmatched_t = [pair[0] for pair in matched_pairs]\nmatched_c = [pair[1] for pair in matched_pairs]\n\n# 4. Covariate Balance Check: Standardised Mean Difference (SMD)\ndef calc_smd(feat, treat_mask):\n    m1, m0 = np.mean(feat[treat_mask]), np.mean(feat[~treat_mask])\n    v1, v0 = np.var(feat[treat_mask]), np.var(feat[~treat_mask])\n    return (m1 - m0) / np.sqrt((v1 + v0) / 2.0)\n\nsmd_age_before = calc_smd(age, membership == 1)\nsmd_spend_before = calc_smd(prior_spend, membership == 1)\n\nsmd_age_after = (np.mean(age[matched_t]) - np.mean(age[matched_c])) / np.std(age)\nsmd_spend_after = (np.mean(prior_spend[matched_t]) - np.mean(prior_spend[matched_c])) / np.std(prior_spend)\n\nprint(\"\\n=== Covariate Balance Diagnostics ===\")\nprint(f\"Age SMD:         Before Matching = {smd_age_before:+.3f} | After Matching = {smd_age_after:+.3f} (Balanced!)\")\nprint(f\"Prior Spend SMD: Before Matching = {smd_spend_before:+.3f} | After Matching = {smd_spend_after:+.3f} (Balanced!)\")\n\n# 5. Treatment Effect on Matched Sample (ATT)\nmatched_diff = np.mean(annual_spend[matched_t]) - np.mean(annual_spend[matched_c])\nprint(f\"\\nMatched Cohort Size: {len(matched_pairs)} pairs\")\nprint(f\"Propensity Matched ATT Estimate: £{matched_diff:.2f} (True: £{true_effect:.2f} -> Causal Effect Recovered!)\")\n",
    keyPoints: [
      "The propensity score e(x) collapses high-dimensional baseline covariates into a 1D scalar balancing score.",
      "Conditional on the propensity score, treatment assignment is independent of measured baseline covariates: X \\perp D | e(x).",
      "Propensity score matching creates balanced synthetic cohorts, isolating true causal effects from observational selection bias.",
      "Standardised Mean Difference (SMD) < 0.10 confirms that matched treatment and control groups achieve satisfactory covariate balance."
    ],
    pitfalls: [
      "Unmeasured confounding: Propensity scores only balance measured covariates; if an unobserved variable influences both treatment and outcome, estimates remain confounded.",
      "Violating common support: Including treated units with extreme propensity scores that have zero counterpart controls forces dangerous extrapolation.",
      "Extreme weights in IPW: When propensity scores approach 0 or 1, inverse probability weights explode, causing extreme variance; weight trimming or stabilised weights are required."
    ],
    quiz: [
      {
        "q": "What is the primary theorem proved by Rosenbaum and Rubin regarding propensity scores?",
        "o": [
          "Conditional on the propensity score e(x) = P(D=1 | X=x), baseline covariates X are statistically independent of treatment assignment D",
          "Propensity scores are always equal to 0.5",
          "Propensity score matching works even when confounders are unmeasured",
          "Propensity scores eliminate the need for training data"
        ],
        "a": 0,
        "why": "Rosenbaum & Rubin (1983) proved the balancing score property: adjusting for the 1D propensity score balances all underlying covariates simultaneously, overcoming the curse of dimensionality."
      },
      {
        "q": "What threshold of Standardised Mean Difference (SMD) is widely accepted as indicating satisfactory covariate balance after matching?",
        "o": [
          "SMD < 0.10 (less than 10% of a standard deviation)",
          "SMD = 1.0",
          "SMD > 2.0",
          "SMD = 0.50"
        ],
        "a": 0,
        "why": "An SMD below 0.10 indicates that the difference in covariate means between treated and control cohorts is negligible, mirroring a randomised trial."
      },
      {
        "q": "Why must units outside the common support overlap region be trimmed in propensity score analysis?",
        "o": [
          "Because treatment effects cannot be causally identified for individuals who have zero probability of receiving the alternative treatment",
          "Because logistic regression cannot process negative numbers",
          "To make the sample size an even number",
          "Because p-values cannot be computed on unbalanced datasets"
        ],
        "a": 0,
        "why": "The positivity assumption requires 0 < P(D=1 | X) < 1. If a unit has a propensity of 1.0, there are no comparable controls, making counterfactual comparison impossible without speculative extrapolation."
      }
    ],
    usedBy: [],
    prereq: [
      "a-b-testing-end-to-end",
      "simpsons-paradox-and-confounding",
      "logistic_regression"
    ],
    related: [
      "causal-graphs-dags-and-adjustment",
      "difference-in-differences",
      "a-b-testing-end-to-end",
      "simpsons-paradox-and-confounding"
    ],
    keywords: "propensity scores matching psm ipw inverse probability weighting causal inference balancing score common support smd"
  },
  {
    id: "difference-in-differences",
    short: "Difference-in-Differences",
    title: "Difference-in-differences",
    task: "concepts",
    module: "Experiments and causality",
    level: 2,
    minutes: 20,
    noLab: true,
    summary: "Difference-in-Differences (DiD) is a quasi-experimental econometric methodology that estimates causal effects by comparing the pre- and post-treatment changes in outcomes between a treatment group and an untreated control group. By subtracting the control group's temporal trend from the treatment group's observed change, DiD eliminates both time-invariant unobserved confounders (e.g. fixed regional culture or baseline ability) and shared macro-temporal shocks (e.g. economic recessions or nationwide seasonal trends). The foundational cornerstone of DiD validity is the Parallel Trends Assumption.",
    lead: "In 1992, New Jersey raised its state minimum wage while neighbouring Pennsylvania kept its minimum wage constant. Economists Card and Krueger famously evaluated this natural experiment: did employment fall as classical economic theory predicted? Simply comparing New Jersey to Pennsylvania after the law change ignores baseline state differences; comparing New Jersey before and after ignores national economic trends. By calculating the difference of the differences, Card and Krueger revolutionised empirical economics. How does DiD isolate causal effects across time, and what happens when the parallel trends assumption fails?",
    intuition: [
      "The 2x2 Grid:\n- Difference 1 (Within Treatment Group over Time): \\Delta_Treat = Y_Treat,Post - Y_Treat,Pre. This captures both the true treatment effect AND any broader macro-temporal trend (inflation, seasons).\n- Difference 2 (Within Control Group over Time): \\Delta_Control = Y_Control,Post - Y_Control,Pre. This captures the pure macro-temporal trend (since the control group never received treatment).\n- The Difference-in-Differences: \\tau_DiD = \\Delta_Treat - \\Delta_Control. Subtracting the control trend cancels out the secular time trend, leaving only the genuine causal treatment effect!",
      "The Parallel Trends Assumption: DiD does NOT require the treatment and control groups to have the same baseline outcome level! It only requires that, in the absence of treatment, both groups would have followed parallel trajectories over time. If New Jersey normally grew by 2% per year and Pennsylvania normally grew by 2% per year, any deviation from that parallel path after the policy change is attributed to the policy.",
      "Event Study Designs and Placebo Tests: How can we test whether parallel trends holds? We inspect pre-treatment periods! An event study plots regression coefficients for periods t-3, t-2, t-1 before treatment. If pre-treatment coefficients are statistically indistinguishable from zero, the parallel trends assumption is credible."
    ],
    analogy: "Imagine two fitness trainees, Alice and Bob. Alice is naturally fitter and can run 10 km/h, while Bob can run only 6 km/h. Alice starts taking a new nutrition supplement, and one month later she runs 13 km/h (+3 km/h). Bob does not take the supplement, but because both were training in the same warm summer weather, Bob improves to 7 km/h (+1 km/h). The DiD effect of the supplement is not 13 - 7 = 6 (naive cross-sectional), nor is it 13 - 10 = 3 (naive before-after). It is (13 - 10) - (7 - 6) = 3 - 1 = +2 km/h.",
    steps: [
      {
        "title": "Define treatment cohort, control cohort, and intervention timing",
        "desc": "Establish panel structure identifying treated units and the exact intervention date t_event.",
        "detail": "Ensure that control units never received treatment and were not indirectly affected by spillover effects."
      },
      {
        "title": "Verify pre-treatment parallel trends",
        "desc": "Examine historical data across multiple pre-intervention periods.",
        "detail": "Plot average outcome trajectories. Confirm that treatment and control groups tracked each other with parallel slopes prior to the intervention."
      },
      {
        "title": "Formulate two-way fixed effects (TWFE) regression",
        "desc": "Specify regression model: y_{it} = \\beta_0 + \\gamma Treat_i + \\lambda Post_t + \\tau (Treat_i * Post_t) + \\epsilon_{it}.",
        "detail": "The coefficient \\tau on the interaction term represents the Difference-in-Differences treatment effect."
      },
      {
        "title": "Execute event study lead-and-lag specification",
        "desc": "Fit dynamic model estimating separate coefficients for each time period relative to treatment.",
        "detail": "Verify that pre-treatment interaction leads are statistically zero (falsification test), while post-treatment lags reveal dynamic adoption curves."
      },
      {
        "title": "Compute cluster-robust standard errors",
        "desc": "Cluster standard errors at the group/regional level to correct for serial autocorrelation.",
        "detail": "Bertrand, Duflo, and Mullainathan (2004) proved that unclustered OLS standard errors in DiD produce massive false positives due to serially correlated errors."
      }
    ],
    math: [
      {
        "h": "The 2x2 Difference-in-Differences Estimator",
        "tex": "\\hat{\\tau}_{\\text{DiD}} = \\left( \\bar{Y}_{\\text{Treat, Post}} - \\bar{Y}_{\\text{Treat, Pre}} \\right) - \\left( \\bar{Y}_{\\text{Control, Post}} - \\bar{Y}_{\\text{Control, Pre}} \\right)",
        "p": "The sample estimator computes the difference in average growth rates between treatment and control cohorts across pre- and post-intervention epochs."
      },
      {
        "h": "Two-Way Interaction Regression Model",
        "tex": "y_{it} = \\beta_0 + \\gamma \\, \\text{Treat}_i + \\lambda \\, \\text{Post}_t + \\tau_{\\text{DiD}} \\left( \\text{Treat}_i \\times \\text{Post}_t \\right) + \\epsilon_{it}",
        "p": "Here \\gamma captures time-invariant baseline differences between groups, \\lambda captures time trends common to all units, and \\tau_{\\text{DiD}} captures the interaction identifying the true causal treatment effect."
      },
      {
        "h": "Counterfactual Parallel Trends Condition",
        "tex": "\\mathbb{E}\\big[Y_{it}(0) - Y_{is}(0) \\mid \\text{Treat}\\big] = \\mathbb{E}\\big[Y_{it}(0) - Y_{is}(0) \\mid \\text{Control}\\big] \\quad \\forall t > t_{\\text{event}}, \\; s < t_{\\text{event}}",
        "p": "The counterfactual expectation states that in the absence of treatment (potential outcome Y(0)), the expected change in outcome for the treated group would have exactly mirrored the observed change in the control group."
      }
    ],
    code: "\"\"\"\nDifference-in-Differences (DiD) Econometric Simulation\nDemonstrates 2x2 DiD calculation, interaction regression,\nand pre-trend parallel trajectory verification.\n\"\"\"\n\nimport numpy as np\n\n# Simulate a policy intervention across two regions (Region A = Treated, Region B = Control)\n# Over 8 quarters: Quarters 1-4 are Pre-intervention, Quarters 5-8 are Post-intervention\n# True Causal Effect of Policy = +15.0 units\nnp.random.seed(42)\nn_per_group_per_qtr = 100\nquarters = np.arange(1, 9)\n\n# Baseline regional difference: Region A starts 20 units higher than Region B\nbase_a = 50.0\nbase_b = 30.0\ntrend_per_quarter = 2.5  # Common upward economic trend affecting both regions\ntrue_policy_shock = 15.0 # Introduced at Quarter >= 5 for Region A only\n\ndata_records = []\nfor q in quarters:\n    is_post = 1 if q >= 5 else 0\n    # Region A (Treated)\n    shock = true_policy_shock if is_post else 0.0\n    y_a = base_a + (trend_per_quarter * q) + shock + np.random.normal(0, 5, n_per_group_per_qtr)\n    for y in y_a:\n        data_records.append({\"y\": y, \"treat\": 1, \"post\": is_post, \"quarter\": q})\n        \n    # Region B (Control: Never treated)\n    y_b = base_b + (trend_per_quarter * q) + np.random.normal(0, 5, n_per_group_per_qtr)\n    for y in y_b:\n        data_records.append({\"y\": y, \"treat\": 0, \"post\": is_post, \"quarter\": q})\n\n# Convert to arrays\ny_all = np.array([r[\"y\"] for r in data_records])\ntreat_all = np.array([r[\"treat\"] for r in data_records])\npost_all = np.array([r[\"post\"] for r in data_records])\ninter_all = treat_all * post_all\n\n# 1. Classical 2x2 Cell Means\ny_treat_post = np.mean(y_all[(treat_all == 1) & (post_all == 1)])\ny_treat_pre  = np.mean(y_all[(treat_all == 1) & (post_all == 0)])\ny_ctrl_post  = np.mean(y_all[(treat_all == 0) & (post_all == 1)])\ny_ctrl_pre   = np.mean(y_all[(treat_all == 0) & (post_all == 0)])\n\ndiff_treat = y_treat_post - y_treat_pre\ndiff_ctrl  = y_ctrl_post - y_ctrl_pre\ndid_estimate_cell = diff_treat - diff_ctrl\n\nprint(\"=== 1. Classical 2x2 Cell Means Calculation ===\")\nprint(f\"Treatment Group: Pre = {y_treat_pre:5.2f} -> Post = {y_treat_post:5.2f} | Delta = {diff_treat:+5.2f}\")\nprint(f\"Control Group:   Pre = {y_ctrl_pre:5.2f} -> Post = {y_ctrl_post:5.2f} | Delta = {diff_ctrl:+5.2f}\")\nprint(f\"Difference-in-Differences Estimate: Delta_Treat - Delta_Ctrl = {did_estimate_cell:+.2f}\")\nprint(f\"True Causal Policy Effect:        +{true_policy_shock:.2f}\\n\")\n\n# 2. Regression Interaction Model: Y = beta0 + gamma*Treat + lambda*Post + tau*(Treat * Post)\nX_did = np.column_stack([np.ones(len(y_all)), treat_all, post_all, inter_all])\nbeta_did = np.linalg.inv(X_did.T @ X_did) @ (X_did.T @ y_all)\nresids = y_all - X_did @ beta_did\ns2 = np.sum(resids**2) / (len(y_all) - 4)\nse_did = np.sqrt(np.diagonal(s2 * np.linalg.inv(X_did.T @ X_did)))\n\nprint(\"=== 2. OLS Interaction Regression Model ===\")\nprint(f\"Intercept (beta0):              {beta_did[0]:6.2f} (SE: {se_did[0]:.3f})\")\nprint(f\"Region A Baseline (gamma):      {beta_did[1]:6.2f} (SE: {se_did[1]:.3f}) [Baseline Level Gap]\")\nprint(f\"Post-Period Time Trend (lambda):{beta_did[2]:6.2f} (SE: {se_did[2]:.3f}) [Macro Secular Trend]\")\nprint(f\"DiD Treatment Effect (tau):     {beta_did[3]:6.2f} (SE: {se_did[3]:.3f}) [CAUSAL SHOCK]\")\nprint(f\"\\n95% Confidence Interval on Causal Effect: [{beta_did[3] - 1.96*se_did[3]:.2f}, {beta_did[3] + 1.96*se_did[3]:.2f}]\")\n",
    keyPoints: [
      "Difference-in-Differences compares the change over time in a treated group to the change over time in a control group.",
      "DiD eliminates time-invariant unobserved confounders and shared macro-temporal trends.",
      "The validity of DiD depends on the Parallel Trends Assumption: in the absence of treatment, both groups would have evolved in parallel.",
      "The interaction coefficient in a two-way regression model estimates the DiD causal effect directly."
    ],
    pitfalls: [
      "Failing to test parallel pre-trends: If treatment and control groups had different growth trajectories prior to treatment, DiD conflates pre-existing divergent trends with the treatment effect.",
      "Serial autocorrelation in standard errors: Ignoring autocorrelation across repeated time periods in panel data leads to severe underestimation of standard errors; cluster-robust standard errors are essential.",
      "Staggered rollout bias in Two-Way Fixed Effects: When units adopt treatment at different times, traditional TWFE can assign negative weights to earlier-treated units, requiring modern staggered DiD estimators (Callaway & Sant'Anna)."
    ],
    quiz: [
      {
        "q": "What is the crucial assumption required for Difference-in-Differences to identify a valid causal effect?",
        "o": [
          "The Parallel Trends Assumption: in the absence of treatment, the treatment and control groups would have experienced identical temporal changes",
          "Treatment and control groups must have identical baseline outcome levels prior to treatment",
          "Sample sizes in both groups must be equal",
          "Outcomes must follow a standard normal distribution"
        ],
        "a": 0,
        "why": "DiD allows baseline levels to differ arbitrarily (\\gamma). Its validity relies solely on parallel trajectories: that the unobserved counterfactual trend in the treated group equals the observed trend in the control group."
      },
      {
        "q": "How does Difference-in-Differences remove time-invariant omitted variable bias?",
        "o": [
          "By differencing each group's post-period outcome from its pre-period outcome, subtracting out all fixed regional or subject-specific baseline characteristics",
          "By deleting unobserved variables from the dataset",
          "By performing principal component analysis on the covariates",
          "By transforming all data into logarithms"
        ],
        "a": 0,
        "why": "Any factor that is constant over time (such as geographic geography or historical culture) is identical in pre- and post-periods; taking the first difference (Y_post - Y_pre) cancels it out completely."
      },
      {
        "q": "In the regression model Y = beta0 + beta1*Treat + beta2*Post + beta3*(Treat * Post), which coefficient estimates the DiD causal effect?",
        "o": [
          "beta3 (the interaction term coefficient)",
          "beta1 (the treatment group indicator)",
          "beta2 (the post-period indicator)",
          "beta0 (the intercept)"
        ],
        "a": 0,
        "why": "The interaction term Treat * Post is 1 only for treated units in the post-treatment period; its coefficient beta3 measures the differential lift above the baseline group gap and macro time trend."
      }
    ],
    usedBy: [],
    prereq: [
      "ols-inference-t-tests-f-test-r2-and-adjusted-r2",
      "a-b-testing-end-to-end"
    ],
    related: [
      "causal-graphs-dags-and-adjustment",
      "propensity-scores-and-matching",
      "a-b-testing-end-to-end",
      "simpsons-paradox-and-confounding"
    ],
    keywords: "difference in differences did parallel trends natural experiment quasi experiment panel data event study card krueger"
  },
  {
    id: 'conjugate-priors-beta-binomial',
    short: 'Beta–Binomial Conjugacy',
    title: r`Conjugate Priors (Beta–Binomial)`,
    task: 'concepts',
    module: 'Bayesian and stochastic',
    level: 2,
    minutes: 17,
    noLab: true,
    summary: r`Update probability beliefs in closed form by combining Beta prior distributions with Binomial observations.`,
    lead: r`In Bayesian statistics, updating beliefs via Bayes' theorem often involves intractable integrals that require complex Markov chain Monte Carlo (MCMC) simulations. Conjugate priors provide an elegant algebraic shortcut: when the prior and likelihood belong to a conjugate family, the posterior distribution belongs to the exact same family as the prior. The Beta–Binomial model serves as the canonical example of conjugacy, updating binary conversion beliefs by simply adding observed successes and failures to prior hyperparameters.`,
    intuition: [
      r`Imagine launching a brand-new website feature where you want to estimate the conversion rate $\theta$. Before collecting data, you have prior experience from dozens of similar features: conversions typically hover around 20%, but rarely drop below 5% or exceed 45%.`,
      r`In Bayesian terms, we represent this initial uncertainty with a Beta distribution: $\text{Beta}(\alpha, \beta)$. The hyperparameters $\alpha$ and $\beta$ can be intuitively interpreted as "pseudo-observations": $\alpha$ prior successes and $\beta$ prior failures. Setting $\alpha = 4$ and $\beta = 16$ encodes a prior belief centred at $\frac{4}{4 + 16} = 20\%$, backed by the equivalent strength of 20 prior visitors.`,
      r`Now, run a live experiment: 100 new visitors arrive, and 35 convert (35 successes, 65 failures). Because the Beta distribution is conjugate to the Binomial likelihood, computing the posterior does not require calculus or numerical integration. You simply add live counts directly to your prior counts: $\alpha_{\text{post}} = 4 + 35 = 39$ and $\beta_{\text{post}} = 16 + 65 = 81$. The updated posterior is $\text{Beta}(39, 81)$, with posterior mean $\frac{39}{39 + 81} = 32.5\%$ and 95% credible interval $[24.4\%, 41.1\%]$. The prior gently regularises the noisy raw sample rate of 35% toward baseline beliefs.`,
    ],
    analogy: r`Updating a Beta prior with Binomial data is like adding tallies to a score sheet: you start with a few pencil marks representing previous games, and each new game simply adds tally marks in the win and loss columns without having to redesign the sheet.`,
    steps: [
      r`Specify the parameter of interest: a success probability $\theta \in [0, 1]$ governing binary Bernoulli or Binomial trials.`,
      r`Select prior hyperparameters $\alpha_0$ and $\beta_0$ to encode baseline domain knowledge (or set $\alpha_0 = \beta_0 = 1$ for a flat uniform prior).`,
      r`Observe experimental data: record the number of successes $k$ out of $n$ independent trials (with $n - k$ failures).`,
      r`Compute posterior hyperparameters in closed form: $\alpha_1 = \alpha_0 + k$ and $\beta_1 = \beta_0 + n - k$.`,
      r`Calculate summary properties of the posterior $\text{Beta}(\alpha_1, \beta_1)$: posterior mean $\frac{\alpha_1}{\alpha_1 + \beta_1}$ and credible intervals via Beta quantiles.`,
      r`Use the posterior distribution as the prior for subsequent incoming batches of data in a streaming, sequential learning pipeline.`,
    ],
    math: [
      {
        h: 'Beta Prior and Binomial Likelihood',
        tex: r`$$P(\theta) = \frac{\theta^{\alpha - 1}(1 - \theta)^{\beta - 1}}{\text{B}(\alpha, \beta)}, \qquad P(k \mid \theta) = \binom{n}{k} \theta^k (1 - \theta)^{n - k}$$`,
        p: r`Here $\theta$ is the success probability, $\text{B}(\alpha, \beta) = \frac{\Gamma(\alpha)\Gamma(\beta)}{\Gamma(\alpha + \beta)}$ is the Beta normalisation constant, and $\alpha, \beta > 0$ are shape hyperparameters. The Binomial likelihood gives the probability of observing $k$ successes in $n$ independent trials given rate $\theta$.`,
      },
      {
        h: 'Posterior Derivation via Conjugacy',
        tex: r`$$P(\theta \mid k) \propto P(k \mid \theta) P(\theta) \propto \theta^k (1 - \theta)^{n - k} \cdot \theta^{\alpha - 1}(1 - \theta)^{\beta - 1} = \theta^{(\alpha + k) - 1} (1 - \theta)^{(\beta + n - k) - 1}$$`,
        p: r`Multiplying likelihood and prior preserves the exact algebraic functional form: the exponents sum directly. The posterior distribution is identically $\text{Beta}(\alpha + k, \, \beta + n - k)$, proving that the Beta family is conjugate to the Binomial likelihood.`,
      },
      {
        h: 'Posterior Mean as a Weighted Average',
        tex: r`$$E[\theta \mid k] = \frac{\alpha + k}{\alpha + \beta + n} = \left(\frac{\alpha + \beta}{\alpha + \beta + n}\right) \frac{\alpha}{\alpha + \beta} + \left(\frac{n}{\alpha + \beta + n}\right) \frac{k}{n}$$`,
        p: r`The Bayesian posterior mean is a transparent convex combination of the prior mean $\frac{\alpha}{\alpha + \beta}$ and the empirical sample mean $\frac{k}{n}$. The relative weight assigned to each component is proportional to effective sample size: $(\alpha + \beta)$ for the prior versus $n$ for the data.`,
      },
    ],
    keyPoints: [
      r`Conjugacy occurs when the posterior distribution belongs to the exact same functional probability family as the prior distribution.`,
      r`The Beta distribution is conjugate to the Binomial and Bernoulli likelihoods, reducing Bayesian updating to basic integer addition.`,
      r`The posterior mean is an exact weighted average between prior belief and sample evidence, providing natural shrinkage regularisation.`,
      r`Sequential updating is seamless: today's posterior becomes tomorrow's prior as streaming batches of data arrive.`,
    ],
    pitfalls: [
      r`Setting hyperparameter counts $\alpha, \beta$ too large, which rigidly anchors the model and prevents it from learning from moderate sample sizes.`,
      r`Confusing the posterior mode (MAP estimate, $\frac{\alpha - 1}{\alpha + \beta - 2}$) with the posterior mean ($\frac{\alpha}{\alpha + \beta}$).`,
      r`Using Beta–Binomial conjugacy on time-varying conversion rates where underlying probabilities drift over time.`,
      r`Assuming all likelihoods possess conjugate priors; complex neural networks and non-linear models lack conjugate priors and require MCMC or variational approximations.`,
    ],
    code: r`import scipy.stats as stats

# Prior: Beta(4, 16) -> centered at 20% conversion
alpha_0, beta_0 = 4, 16
prior_mean = alpha_0 / (alpha_0 + beta_0)

# Observed data: 35 conversions out of 100 visitors
n_visitors = 100
k_conversions = 35

# Conjugate update: add successes and failures directly
alpha_1 = alpha_0 + k_conversions
beta_1 = beta_0 + (n_visitors - k_conversions)

post_mean = alpha_1 / (alpha_1 + beta_1)
post_mode = (alpha_1 - 1.0) / (alpha_1 + beta_1 - 2.0)
ci_lower = stats.beta.ppf(0.025, alpha_1, beta_1)
ci_upper = stats.beta.ppf(0.975, alpha_1, beta_1)

print(f"Prior:     Beta({alpha_0}, {beta_0}), Mean: {prior_mean:.1%}")
print(f"Observed:  {k_conversions}/{n_visitors} ({k_conversions/n_visitors:.1%})")
print(f"Posterior: Beta({alpha_1}, {beta_1}), Mean: {post_mean:.1%}, Mode: {post_mode:.1%}")
print(f"95% Credible Interval: [{ci_lower:.3f}, {ci_upper:.3f}]")`,
    quiz: [
      {
        q: r`Why are conjugate priors computationally advantageous in Bayesian statistics?`,
        o: [
          r`They eliminate all uncertainty from parameter estimates`,
          r`They allow posterior distributions to be calculated in closed form using simple algebra, avoiding costly numerical integration or MCMC sampling`,
          r`They can only be used when sample sizes exceed 10,000`,
          r`They guarantee that the prior distribution is always uniform`,
        ],
        a: 1,
        why: r`Conjugacy ensures the posterior belongs to the same functional family as the prior, reducing Bayesian updates to simple parameter addition without numerical integration.`,
      },
      {
        q: r`If you begin with a uniform prior $\text{Beta}(1, 1)$ and observe 7 heads and 3 tails in coin flips, what is the posterior distribution?`,
        o: [
          r`$\text{Beta}(7, 3)$`,
          r`$\text{Beta}(8, 4)$`,
          r`$\text{Beta}(10, 10)$`,
          r`$\mathcal{N}(7, 3)$`,
        ],
        a: 1,
        why: r`Adding observed counts to prior hyperparameters gives $\alpha' = 1 + 7 = 8$ and $\beta' = 1 + 3 = 4$, resulting in $\text{Beta}(8, 4)$.`,
      },
      {
        q: r`In the Beta–Binomial model, what happens to the posterior distribution as the sample size $n \to \infty$?`,
        o: [
          r`The prior completely dominates the data`,
          r`The posterior variance shrinks toward zero, and the posterior mean converges to the maximum likelihood sample proportion`,
          r`The posterior distribution becomes uniform`,
          r`The posterior mean becomes undefined`,
        ],
        a: 1,
        why: r`As $n$ grows large, the weight $\frac{n}{\alpha + \beta + n}$ approaches 1.0, causing the posterior to concentrate around the sample mean with vanishing variance.`,
      },
      {
        q: r`What intuitive interpretation do the hyperparameters $\alpha$ and $\beta$ carry in a Beta prior?`,
        o: [
          r`The number of iterations required for gradient descent`,
          r`The effective number of pseudo-observations (prior successes and prior failures) before collecting live data`,
          r`The degrees of freedom of a Student's t-test`,
          r`The regularisation penalty $\lambda$`,
        ],
        a: 1,
        why: r`The parameters $\alpha$ and $\beta$ act as virtual or pseudo-observations: $\alpha$ reflects prior successes and $\beta$ prior failures, with sum $\alpha + \beta$ representing prior sample strength.`,
      },
    ],
    usedBy: ['bayesian_linear_regression', 'gaussian_naive_bayes'],
    prereq: ['probability-rules-and-bayes-theorem', 'random-variables-and-distributions', 'sampling-and-standard-error'],
    related: ['bayesian_linear_regression', 'confidence-intervals', 'maximum-likelihood-estimation'],
    keywords: 'conjugate priors beta binomial bayesian updating posterior prior credible interval pseudo observations',
  },
  {
    id: "mcmc-metropolis-hastings-and-gibbs",
    short: "MCMC: Metropolis & Gibbs",
    title: "MCMC: Metropolis–Hastings and Gibbs",
    task: "concepts",
    module: "Bayesian and stochastic",
    level: 2,
    minutes: 20,
    noLab: true,
    summary: "Markov Chain Monte Carlo (MCMC) algorithms enable numerical sampling from complex, high-dimensional posterior probability distributions whose normalising constants (evidence integrals) are analytically intractable. The Metropolis-Hastings (MH) algorithm constructs an ergodic Markov chain whose stationary distribution equals the target posterior by proposing candidate states from an arbitrary proposal distribution and accepting them with a calculated acceptance probability that satisfies detailed balance. Gibbs sampling specialises Metropolis-Hastings by iteratively sampling each variable conditioned on all remaining parameters, achieving a guaranteed 100% acceptance rate.",
    lead: "Bayes' rule is simple in concept: posterior equals likelihood times prior divided by marginal likelihood. But that denominator—the marginal likelihood \\int p(\\mathcal{D} \\mid \\theta) p(\\theta) \\, d\\theta—is an integral over hundreds or thousands of parameters. In high dimensions, standard numerical grid integration is impossible (requiring more grid points than atoms in the universe). How can we draw samples from a posterior distribution when we can only evaluate its unnormalised numerator? MCMC algorithms solve this profound computational bottleneck.",
    intuition: [
      "The Intractable Denominator: We know p(\\theta | D) = p(D | \\theta) p(\\theta) / Z, but normalising constant Z is unknown. Notice that if we take the ratio of posterior densities between two proposed states \\theta^* and \\theta, the unknown constant Z cancels out completely: p(\\theta^* | D) / p(\\theta | D) = [p(D | \\theta^*) p(\\theta^*)] / [p(D | \\theta) p(\\theta)]. We can compute relative probabilities anywhere in parameter space!",
      "Detailed Balance and the Metropolis-Hastings Acceptance Rule: The algorithm walks through parameter space. At state \\theta, it proposes a new state \\theta^* ~ q(\\theta^* | \\theta). If \\theta^* has a higher posterior density, we always move there. If \\theta^* has a lower posterior density, we do not reject it outright—we accept it with probability equal to the density ratio! This ensures the chain explores the entire distribution without getting stuck at the mode, with the frequency of visits exactly proportional to the true posterior probability.",
      "Gibbs Sampling: Full Conditionals: When parameter vector \\boldsymbol{\\theta} = (\\theta_1, \\dots, \\theta_D) has high dimension, proposing random vectors often results in high rejection rates. Gibbs sampling updates parameters one coordinate at a time by sampling from the full conditional distribution p(\\theta_j | \\boldsymbol{\\theta}_{-j}, D). Because the proposal matches the conditional target exactly, the Metropolis-Hastings acceptance ratio is identically 1.0!"
    ],
    analogy: "Imagine a blind cartographer mapping the topography of a mountainous island chain at night. The cartographer cannot see the whole island, but at any spot they stand, a handheld altimeter tells them their current elevation. To map the terrain, the cartographer picks a random direction and takes a step. If the new spot is higher, they step up. If the new spot is lower, they roll a die: if the elevation drop is small, they usually accept the step down; if it is a steep cliff, they reject it and stay put. Over months of walking, the fraction of hours spent at any altitude precisely matches the true surface area of the mountains.",
    steps: [
      {
        "title": "Define unnormalised target posterior density",
        "desc": "Specify joint model f(\\theta) = p(D | \\theta) p(\\theta) without normalising constant.",
        "detail": "Work in log-space: \\ln f(\\theta) = \\ln p(D | \\theta) + \\ln p(\\theta) to prevent numerical underflow."
      },
      {
        "title": "Select proposal distribution q(\\theta^* | \\theta)",
        "desc": "Choose a random walk proposal (e.g. Gaussian \\theta^* ~ N(\\theta, \\sigma^2)).",
        "detail": "Tune proposal variance \\sigma^2 to achieve optimal acceptance rate (~23.4% for high-dimensional Random Walk Metropolis, ~44% in 1D)."
      },
      {
        "title": "Evaluate Metropolis-Hastings acceptance probability",
        "desc": "Calculate \\alpha = \\min(1, [p(\\theta^*) q(\\theta | \\theta^*)] / [p(\\theta) q(\\theta^* | \\theta)]).",
        "detail": "For symmetric proposals, proposal densities cancel out: \\alpha = \\min(1, f(\\theta^*) / f(\\theta))."
      },
      {
        "title": "Execute accept/reject step and update chain",
        "desc": "Draw u ~ Uniform(0, 1). If u <= \\alpha, accept \\theta^{(t)} = \\theta^*; else retain \\theta^{(t)} = \\theta^{(t-1)}.",
        "detail": "Append current state to chain history. The chain forms an ergodic Markov chain converging to the true posterior."
      },
      {
        "title": "Discard burn-in and verify convergence",
        "desc": "Drop initial warmup iterations and calculate Gelman-Rubin R_hat diagnostic.",
        "detail": "Confirm R_hat < 1.05 across multiple independent chains and evaluate Effective Sample Size (ESS) to ensure chain mixing."
      }
    ],
    math: [
      {
        "h": "Detailed Balance Condition",
        "tex": "p(\\theta) \\, T(\\theta \\to \\theta^*) = p(\\theta^*) \\, T(\\theta^* \\to \\theta), \\qquad T(\\theta \\to \\theta^*) = q(\\theta^* \\mid \\theta) \\, \\alpha(\\theta, \\theta^*)",
        "p": "Detailed balance is a sufficient condition ensuring that the target posterior distribution p(\\theta) is the unique stationary invariant distribution of the Markov chain. In equilibrium, probability flux from \\theta to \\theta^* exactly matches reverse flux."
      },
      {
        "h": "Metropolis-Hastings Acceptance Probability",
        "tex": "\\alpha(\\theta, \\theta^*) = \\min\\left( 1, \\; \\frac{p(\\theta^* \\mid \\mathcal{D}) \\, q(\\theta \\mid \\theta^*)}{p(\\theta \\mid \\mathcal{D}) \\, q(\\theta^* \\mid \\theta)} \\right) = \\min\\left( 1, \\; \\frac{p(\\mathcal{D} \\mid \\theta^*) p(\\theta^*) \\, q(\\theta \\mid \\theta^*)}{p(\\mathcal{D} \\mid \\theta) p(\\theta) \\, q(\\theta^* \\mid \\theta)} \\right)",
        "p": "Because the normalising constant Z appears in both numerator and denominator, it cancels out completely. This allows sampling from arbitrary unnormalised distributions."
      },
      {
        "h": "Gibbs Sampling as a Special Case of Metropolis-Hastings",
        "tex": "q(\\theta_j^* \\mid \\boldsymbol{\\theta}) = p(\\theta_j^* \\mid \\boldsymbol{\\theta}_{-j}, \\mathcal{D}) \\implies \\alpha(\\boldsymbol{\\theta}, \\boldsymbol{\\theta}^*) = \\min\\left(1, \\; \\frac{p(\\boldsymbol{\\theta}^*) \\, p(\\theta_j \\mid \\boldsymbol{\\theta}_{-j}^*)}{p(\\boldsymbol{\\theta}) \\, p(\\theta_j^* \\mid \\boldsymbol{\\theta}_{-j})} \\right) \\equiv 1.0",
        "p": "When proposing each coordinate directly from its full conditional distribution, the Metropolis-Hastings acceptance ratio simplifies algebraically to exactly 1.0. Every proposed Gibbs step is accepted."
      }
    ],
    code: "\"\"\"\nMetropolis-Hastings and Gibbs Sampling Implementations\nSampling from an unnormalised bivariate Gaussian posterior\nand evaluating chain mixing and burn-in.\n\"\"\"\n\nimport numpy as np\n\n# Target Distribution: Bivariate Normal with correlation rho = 0.8\n# Unnormalised log density: -0.5 * (1 / (1 - rho^2)) * (x1^2 - 2*rho*x1*x2 + x2^2)\nrho = 0.8\nvar_scale = 1.0 - rho**2\n\ndef target_log_prob(theta):\n    x1, x2 = theta[0], theta[1]\n    return -0.5 * (x1**2 - 2.0 * rho * x1 * x2 + x2**2) / var_scale\n\n# 1. Random Walk Metropolis-Hastings Sampler\ndef run_metropolis_hastings(num_samples=10000, proposal_std=0.6):\n    chain = np.empty((num_samples, 2))\n    curr_theta = np.array([5.0, -5.0])  # Start far from mode (testing convergence)\n    curr_log_p = target_log_prob(curr_theta)\n    accepted_count = 0\n\n    for i in range(num_samples):\n        # Propose candidate theta* ~ N(curr_theta, proposal_std^2)\n        candidate = curr_theta + np.random.normal(0, proposal_std, size=2)\n        candidate_log_p = target_log_prob(candidate)\n        \n        # Log acceptance ratio: log_alpha = candidate_log_p - curr_log_p\n        log_alpha = candidate_log_p - curr_log_p\n        \n        if np.log(np.random.uniform(0, 1)) <= log_alpha:\n            curr_theta = candidate\n            curr_log_p = candidate_log_p\n            accepted_count += 1\n            \n        chain[i] = curr_theta\n\n    acc_rate = accepted_count / num_samples\n    return chain, acc_rate\n\n# 2. Gibbs Sampler\n# Full Conditionals for Bivariate Normal:\n# x1 | x2 ~ N(rho * x2, 1 - rho^2)\n# x2 | x1 ~ N(rho * x1, 1 - rho^2)\ndef run_gibbs_sampler(num_samples=10000):\n    chain = np.empty((num_samples, 2))\n    x1, x2 = 5.0, -5.0\n    cond_std = np.sqrt(1.0 - rho**2)\n\n    for i in range(num_samples):\n        # Sample x1 | x2\n        x1 = np.random.normal(loc=rho * x2, scale=cond_std)\n        # Sample x2 | x1\n        x2 = np.random.normal(loc=rho * x1, scale=cond_std)\n        chain[i] = [x1, x2]\n\n    return chain\n\n# Run simulations\nnp.random.seed(42)\nnum_steps = 10000\nburn_in = 2000\n\nmh_chain, mh_acc_rate = run_metropolis_hastings(num_steps, proposal_std=0.7)\ngibbs_chain = run_gibbs_sampler(num_steps)\n\n# Discard burn-in\nmh_samples = mh_chain[burn_in:]\ngibbs_samples = gibbs_chain[burn_in:]\n\nprint(\"=== 1. Metropolis-Hastings Results ===\")\nprint(f\"Total Steps: {num_steps} | Discarded Burn-in: {burn_in}\")\nprint(f\"Empirical Acceptance Rate: {mh_acc_rate:.1%} (Target optimal ~23-44%)\")\nprint(f\"Estimated Mean:   [{np.mean(mh_samples[:, 0]):.3f}, {np.mean(mh_samples[:, 1]):.3f}] (True: [0.00, 0.00])\")\nprint(f\"Estimated Corr:   {np.corrcoef(mh_samples[:, 0], mh_samples[:, 1])[0, 1]:.3f} (True: {rho:.3f})\")\n\nprint(\"\\n=== 2. Gibbs Sampler Results ===\")\nprint(\"Acceptance Rate: 100.0% (by mathematical construction)\")\nprint(f\"Estimated Mean:   [{np.mean(gibbs_samples[:, 0]):.3f}, {np.mean(gibbs_samples[:, 1]):.3f}] (True: [0.00, 0.00])\")\nprint(f\"Estimated Corr:   {np.corrcoef(gibbs_samples[:, 0], gibbs_samples[:, 1])[0, 1]:.3f} (True: {rho:.3f})\")\n",
    keyPoints: [
      "MCMC draws representative samples from unnormalised posterior distributions where integration of the denominator is intractable.",
      "Metropolis-Hastings accepts moves according to the posterior ratio, satisfying detailed balance to ensure convergence to the target distribution.",
      "Gibbs sampling updates one variable at a time from its full conditional distribution, achieving a 100% acceptance rate.",
      "Burn-in samples from early iterations before the chain reaches stationarity must be discarded prior to posterior inference."
    ],
    pitfalls: [
      "High autocorrelation and slow mixing: When proposal step size is too small, the chain explores slowly via Brownian diffusion; when too large, proposals are rejected repeatedly.",
      "Premature stopping before convergence: A chain starting far from the true mode requires sufficient burn-in to find the typical set; Gelman-Rubin diagnostics across multiple chains are essential.",
      "Gibbs sampling in highly correlated dimensions: When variables exhibit extreme correlation, coordinate-wise Gibbs sampling becomes trapped taking tiny zig-zag steps; reparameterisation or HMC is needed."
    ],
    quiz: [
      {
        "q": "Why does the normalising constant Z cancel out in the Metropolis-Hastings acceptance ratio?",
        "o": [
          "Because the acceptance ratio divides the posterior density of the proposed state by the posterior density of the current state, causing constant denominators to cancel algebraically",
          "Because the normalising constant is always equal to 1.0",
          "Because MCMC algorithms only work on uniform distributions",
          "Because logarithms eliminate all division"
        ],
        "a": 0,
        "why": "The ratio p(\\theta^* | \\mathcal{D}) / p(\\theta | \\mathcal{D}) = [p(\\mathcal{D}|\\theta^*)p(\\theta^*)/Z] / [p(\\mathcal{D}|\\theta)p(\\theta)/Z] = [p(\\mathcal{D}|\\theta^*)p(\\theta^*)] / [p(\\mathcal{D}|\\theta)p(\\theta)], bypassing the intractable integral Z."
      },
      {
        "q": "What condition guarantees that a Markov chain converges to the desired target distribution?",
        "o": [
          "Detailed balance (reversibility) combined with ergodicity (irreducibility and aperiodicity)",
          "The chain must visit every point on a continuous grid",
          "The acceptance rate must be 0%",
          "All parameters must be statistically independent"
        ],
        "a": 0,
        "why": "Detailed balance ensures the target distribution is stationary. Ergodicity guarantees the chain can reach any state and will not get trapped in periodic cycles."
      },
      {
        "q": "Why does Gibbs sampling achieve a 100% acceptance rate?",
        "o": [
          "Because candidates are proposed directly from full conditional distributions, causing the Metropolis-Hastings acceptance ratio to simplify identically to 1.0",
          "Because Gibbs sampling does not use random numbers",
          "Because it rejects all proposals before evaluating them",
          "Because Gibbs sampling only runs on Gaussian data"
        ],
        "a": 0,
        "why": "Substituting the full conditional proposal q(\\theta_j^* | \\boldsymbol{\\theta}) = p(\\theta_j^* | \\boldsymbol{\\theta}_{-j}) into the MH formula cancels the numerator and denominator completely, yielding \\alpha = 1.0."
      }
    ],
    usedBy: [],
    prereq: [
      "map-and-bayesian-estimation",
      "conjugate-priors-beta-binomial"
    ],
    related: [
      "hamiltonian-monte-carlo",
      "variational-inference",
      "markov-chains-and-stationary-distributions",
      "bayesian_linear_regression"
    ],
    keywords: "mcmc metropolis hastings gibbs sampling markov chain monte carlo detailed balance burn in stationary distribution acceptance rate"
  },
  {
    id: "hamiltonian-monte-carlo",
    short: "Hamiltonian Monte Carlo",
    title: "Hamiltonian Monte Carlo",
    task: "concepts",
    module: "Bayesian and stochastic",
    level: 2,
    minutes: 20,
    noLab: true,
    summary: "Hamiltonian Monte Carlo (HMC) and the No-U-Turn Sampler (NUTS) overcome the random-walk diffusion limits of classical Metropolis-Hastings by transforming Bayesian parameter sampling into physical Hamiltonian dynamics. By augmenting target parameters (position) with auxiliary momentum vectors, HMC simulates frictionless motion across the negative log-posterior potential energy surface using symplectic numerical integrators (leapfrog algorithm). This physical trajectory simulation enables large, distant state transitions with acceptance rates approaching 100%, scaling Bayesian inference to models with thousands of correlated parameters.",
    lead: "Random Walk Metropolis-Hastings is like taking drunken random steps in the dark: in a 100-dimensional space, almost every random direction steps into low-probability regions, causing acceptance rates to plummet unless step sizes are reduced to microscopic increments. In high dimensions, random walks take millions of iterations to explore the posterior. Hamiltonian Monte Carlo replaces random diffusion with physical mechanics: imagine rolling a frictionless hockey puck down the gravitational contours of your posterior landscape. Why does simulating classical mechanics solve high-dimensional Bayesian inference, and how does the leapfrog algorithm preserve energy?",
    intuition: [
      "The Curse of Dimensionality in Random Walks: In high dimensions, probability mass does not concentrate at the mode (where volume is zero) nor in the tails (where density is zero). It concentrates in a narrow hyperspherical shell called the \"typical set\". A random walk step almost always steps off this narrow ridge, getting rejected. To make distant jumps that stay within the typical set, we need vectors that guide proposals along the contours of the probability landscape.",
      "The Hamiltonian Physics Analogy:\n- Position (\\mathbf{q}): The model parameters we want to sample (\\boldsymbol{\\theta}).\n- Potential Energy (U(\\mathbf{q})): The negative log-posterior density -\\ln p(\\mathbf{q} \\mid \\mathcal{D}). High probability corresponds to deep valleys.\n- Momentum (\\mathbf{p}): Auxiliary random velocities sampled from a Gaussian distribution \\mathbf{p} \\sim \\mathcal{N}(\\mathbf{0}, \\mathbf{M}).\n- Kinetic Energy (K(\\mathbf{p})): \\frac{1}{2} \\mathbf{p}^\\top \\mathbf{M}^{-1} \\mathbf{p}.\n- Total Hamiltonian Energy: H(\\mathbf{q}, \\mathbf{p}) = U(\\mathbf{q}) + K(\\mathbf{p}).",
      "Frictionless Gliding: By Hamiltonian conservation of energy, as the particle rolls downhill into high probability valleys, potential energy converts into kinetic energy (it speeds up). As it climbs uphill into low probability tails, kinetic energy converts into potential energy (it slows down). The total energy H remains strictly constant! Because total energy is conserved, the Metropolis-Hastings acceptance probability \\exp(-\\Delta H) is identically 1.0!",
      "The Leapfrog Integrator: Computers cannot simulate continuous differential equations perfectly. Standard Euler integration accumulates energy drift, causing the puck to fly into space. The leapfrog algorithm is \"symplectic\"—it alternates half-step momentum updates with full-step position updates, preserving phase space volume (Liouville's theorem) and maintaining near-perfect energy conservation over long trajectories."
    ],
    analogy: "Imagine a skateboarder in a giant U-shaped concrete skate bowl. The bottom of the bowl is the highest posterior probability region. If the skateboarder were a random-walk Metropolis sampler, they would stagger in random directions, falling flat on their face 95% of the time. HMC pushes the skateboarder with a random burst of speed (momentum): the skateboarder effortlessly carves high-speed arcs along the walls of the bowl, gliding across the entire geometry without ever losing total energy, landing at a completely different, distant spot on the bowl with 100% stability.",
    steps: [
      {
        "title": "Define potential energy and analytical gradient",
        "desc": "Establish U(q) = -ln p(q | D) and gradient \\nabla_q U(q).",
        "detail": "Compute log-posterior derivatives with respect to parameters using autodiff or manual calculus."
      },
      {
        "title": "Sample auxiliary momentum vector",
        "desc": "Draw initial momentum p ~ N(0, M) independently at each step.",
        "detail": "The mass matrix M is typically chosen as identity I or tuned to match parameter scales."
      },
      {
        "title": "Simulate trajectory via symplectic leapfrog integration",
        "desc": "Execute L leapfrog steps of size \\epsilon to update position and momentum.",
        "detail": "Perform half-step momentum update, full-step position update, and half-step momentum update. Preserve volume in phase space."
      },
      {
        "title": "Negate momentum and evaluate energy conservation",
        "desc": "Calculate Hamiltonian energy difference \\Delta H = H(q^*, p^*) - H(q_old, p_0).",
        "detail": "Negate momentum p* = -p to ensure time-reversibility of the transition kernel."
      },
      {
        "title": "Accept or reject via Metropolis criterion",
        "desc": "Accept candidate state q* with probability min(1, exp(-\\Delta H)).",
        "detail": "Due to symplectic energy conservation, \\Delta H \\approx 0, achieving acceptance rates of 80% to 95% across distant jumps."
      }
    ],
    math: [
      {
        "h": "Hamiltonian System Differential Equations",
        "tex": "\\frac{d\\mathbf{q}}{dt} = \\frac{\\partial H}{\\partial \\mathbf{p}} = \\mathbf{M}^{-1}\\mathbf{p}, \\qquad \\frac{d\\mathbf{p}}{dt} = -\\frac{\\partial H}{\\partial \\mathbf{q}} = -\\nabla_\\mathbf{q} U(\\mathbf{q}) = \\nabla_\\mathbf{q} \\ln p(\\mathbf{q} \\mid \\mathcal{D})",
        "p": "Hamilton's equations describe the time evolution of position \\mathbf{q} and momentum \\mathbf{p}. The total energy H(\\mathbf{q}, \\mathbf{p}) = U(\\mathbf{q}) + K(\\mathbf{p}) is conserved along continuous trajectories: dH/dt = 0."
      },
      {
        "h": "Symplectic Leapfrog Integrator",
        "tex": "\\mathbf{p}\\left(t + \\frac{\\epsilon}{2}\\right) = \\mathbf{p}(t) - \\frac{\\epsilon}{2} \\nabla U(\\mathbf{q}(t)), \\quad \\mathbf{q}(t + \\epsilon) = \\mathbf{q}(t) + \\epsilon \\mathbf{M}^{-1} \\mathbf{p}\\left(t + \\frac{\\epsilon}{2}\\right), \\quad \\mathbf{p}(t + \\epsilon) = \\mathbf{p}\\left(t + \\frac{\\epsilon}{2}\\right) - \\frac{\\epsilon}{2} \\nabla U(\\mathbf{q}(t + \\epsilon))",
        "p": "The leapfrog algorithm updates momentum at half-integer time steps and position at integer time steps. It is time-reversible and volume-preserving (symplectic), ensuring that energy errors do not drift secularly over time."
      },
      {
        "h": "Metropolis Acceptance Probability under Numerical Discretisation",
        "tex": "\\alpha = \\min\\left(1, \\; \\exp\\big( -H(\\mathbf{q}^*, \\mathbf{p}^*) + H(\\mathbf{q}^{(t-1)}, \\mathbf{p}^{(0)}) \\big) \\right) = \\min\\left(1, \\; \\exp\\left( -\\Delta H \\right)\\right)",
        "p": "Even though continuous dynamics preserve energy exactly (\\Delta H = 0), finite step size \\epsilon introduces minor discretisation error. The final Metropolis filter guarantees exact convergence to the stationary distribution."
      }
    ],
    code: "\"\"\"\nHamiltonian Monte Carlo (HMC) Sampler Implementation\nDemonstrating leapfrog symplectic integration, energy conservation,\nand high acceptance sampling on a correlated 2D Gaussian.\n\"\"\"\n\nimport numpy as np\n\n# Target Potential Energy U(q) = -log p(q)\n# Correlated Gaussian: q ~ N(0, Sigma), Sigma = [[1.0, 0.8], [0.8, 1.0]]\ncov = np.array([[1.0, 0.8], [0.8, 1.0]])\ncov_inv = np.linalg.inv(cov)\n\ndef potential_energy(q):\n    \"\"\"U(q) = 0.5 * q^T Sigma^-1 q\"\"\"\n    return 0.5 * (q @ cov_inv @ q)\n\ndef grad_potential_energy(q):\n    \"\"\"nabla U(q) = Sigma^-1 q\"\"\"\n    return cov_inv @ q\n\ndef kinetic_energy(p):\n    \"\"\"K(p) = 0.5 * p^T p (assuming identity mass matrix M = I)\"\"\"\n    return 0.5 * np.sum(p ** 2)\n\ndef leapfrog(q, p, epsilon, num_steps):\n    \"\"\"Symplectic Leapfrog Integrator.\"\"\"\n    q_curr = np.copy(q)\n    p_curr = np.copy(p)\n    \n    # Initial half-step for momentum\n    p_curr -= 0.5 * epsilon * grad_potential_energy(q_curr)\n    \n    # Alternate full position and momentum steps\n    for step in range(num_steps):\n        q_curr += epsilon * p_curr\n        if step < num_steps - 1:\n            p_curr -= epsilon * grad_potential_energy(q_curr)\n            \n    # Final half-step for momentum\n    p_curr -= 0.5 * epsilon * grad_potential_energy(q_curr)\n    \n    # Negate momentum to make transition reversible\n    return q_curr, -p_curr\n\ndef run_hmc(num_samples=3000, epsilon=0.15, leapfrog_steps=20):\n    samples = np.empty((num_samples, 2))\n    curr_q = np.array([4.0, -4.0]) # Starting point\n    accepted = 0\n    delta_h_list = []\n\n    for i in range(num_samples):\n        # 1. Sample auxiliary momentum p ~ N(0, I)\n        curr_p = np.random.normal(0, 1, size=2)\n        \n        # 2. Compute initial Hamiltonian H = U(q) + K(p)\n        h_init = potential_energy(curr_q) + kinetic_energy(curr_p)\n        \n        # 3. Simulate Leapfrog Trajectory\n        prop_q, prop_p = leapfrog(curr_q, curr_p, epsilon, leapfrog_steps)\n        \n        # 4. Compute proposed Hamiltonian\n        h_prop = potential_energy(prop_q) + kinetic_energy(prop_p)\n        delta_h = h_prop - h_init\n        delta_h_list.append(delta_h)\n        \n        # 5. Metropolis Acceptance\n        if np.log(np.random.uniform(0, 1)) < -delta_h:\n            curr_q = prop_q\n            accepted += 1\n            \n        samples[i] = curr_q\n\n    acc_rate = accepted / num_samples\n    return samples, acc_rate, delta_h_list\n\n# Run HMC simulation\nnp.random.seed(42)\nsamples, acc_rate, delta_h_list = run_hmc(num_samples=4000, epsilon=0.18, leapfrog_steps=15)\nburn_in = 500\nclean_samples = samples[burn_in:]\n\nprint(\"=== Hamiltonian Monte Carlo Simulation ===\")\nprint(f\"Total Steps: 4000 | Burn-in: {burn_in} | Clean Samples: {len(clean_samples)}\")\nprint(f\"HMC Acceptance Rate: {acc_rate:.1%} (High acceptance despite large leapfrog jumps!)\")\nprint(f\"Mean Energy Error |Delta H|: {np.mean(np.abs(delta_h_list)):.4f} (Energy is near-conserved!)\")\n\nprint(f\"\\nEstimated Posterior Mean: [{np.mean(clean_samples[:, 0]):.3f}, {np.mean(clean_samples[:, 1]):.3f}] (True: [0.00, 0.00])\")\nprint(f\"Estimated Correlation:    {np.corrcoef(clean_samples[:, 0], clean_samples[:, 1])[0, 1]:.3f} (True: 0.800)\")\n",
    keyPoints: [
      "Hamiltonian Monte Carlo simulates classical Hamiltonian physical dynamics to propose distant, high-probability state transitions.",
      "Auxiliary momentum variables allow the sampler to glide along the contours of the typical set, avoiding random-walk diffusion.",
      "The leapfrog numerical integrator is symplectic and time-reversible, preserving phase-space volume and conserving total energy.",
      "Because energy is approximately conserved (\\Delta H \\approx 0), HMC achieves high acceptance rates (> 80%) even in high-dimensional spaces."
    ],
    pitfalls: [
      "Tuning leapfrog step size epsilon and trajectory length L: Too large an epsilon causes catastrophic numerical divergence; too small causes slow exploration (solved by the NUTS algorithm).",
      "Pathological geometry and funnels: In hierarchical models with varying curvature (Neal's funnel), HMC encounters divergent transitions; non-centred parameterisations are necessary.",
      "Requiring differentiable posteriors: HMC requires the gradient of the log-posterior \\nabla_\\mathbf{q} \\ln p(\\mathbf{q} \\mid \\mathcal{D}); it cannot be applied directly to discrete parameters without marginalisation."
    ],
    quiz: [
      {
        "q": "Why does Hamiltonian Monte Carlo scale vastly better to high dimensions than Random Walk Metropolis?",
        "o": [
          "Because physical momentum trajectories guide proposals along the contours of the high-probability typical set, enabling large distant jumps without falling into low-probability rejection regions",
          "Because HMC avoids computing the likelihood function",
          "Because HMC only samples 1 parameter at a time",
          "Because HMC does not use the Metropolis acceptance step"
        ],
        "a": 0,
        "why": "Random-walk proposals must shrink as dimension grows to keep a sensible acceptance rate, so the cost per independent sample rises roughly linearly with the dimension d (against about d^{1/4} for HMC). HMC translates gradient vector information into momentum, traversing the typical set efficiently."
      },
      {
        "q": "What property of the leapfrog integrator makes it essential for HMC?",
        "o": [
          "It is symplectic (volume-preserving) and time-reversible, preventing numerical energy drift from accumulating over long trajectory simulations",
          "It computes integrals in O(1) time without gradients",
          "It eliminates the need for potential energy",
          "It guarantees that momentum is always zero"
        ],
        "a": 0,
        "why": "Non-symplectic integrators (like Euler) accumulate energy drift, causing the Hamiltonian to explode. Symplectic integrators oscillate around the true energy surface, preserving phase space volume."
      },
      {
        "q": "What algorithm automatically tunes the trajectory length L in modern Bayesian probabilistic programming languages (such as Stan and PyMC)?",
        "o": [
          "The No-U-Turn Sampler (NUTS)",
          "K-means clustering",
          "Stochastic Gradient Descent",
          "The Expectation-Maximisation algorithm"
        ],
        "a": 0,
        "why": "NUTS builds recursive binary trees of leapfrog steps, automatically terminating the trajectory as soon as the particle begins to turn back on itself (No-U-Turn), eliminating the need for manual tuning of L."
      }
    ],
    usedBy: [],
    prereq: [
      "mcmc-metropolis-hastings-and-gibbs",
      "map-and-bayesian-estimation"
    ],
    related: [
      "mcmc-metropolis-hastings-and-gibbs",
      "variational-inference",
      "markov-chains-and-stationary-distributions",
      "bayesian_linear_regression"
    ],
    keywords: "hamiltonian monte carlo hmc nuts no u turn sampler leapfrog integrator symplectic momentum typical set stan"
  },
  {
    id: "variational-inference",
    short: "Variational inference",
    title: "Variational Inference",
    task: "concepts",
    module: "Bayesian and stochastic",
    level: 3,
    minutes: 18,
    noLab: true,
    summary: "Turn intractable posterior integration into continuous optimisation: fit a simpler tractable distribution q(z) to the true posterior p(z|x) by maximising the Evidence Lower Bound (ELBO).",
    lead: "Exact Bayesian posterior calculation requires computing a marginal likelihood integral over latent variables that is intractable for all but conjugate models. Variational inference circumvents numerical integration by recasting inference as an optimisation problem.",
    intuition: [
      "In Bayesian modelling, we observe data $x$ generated via unobserved latent variables $z$ according to a joint distribution $p(x, z) = p(x \\mid z) p(z)$. The central goal is evaluating the posterior distribution $p(z \\mid x) = p(x, z) / p(x)$. However, the marginal likelihood (evidence) $p(x) = \\int p(x, z) dz$ is frequently an intractable high-dimensional integral when priors and likelihoods are non-conjugate, as in deep latent variable models or complex hierarchical Bayesian networks.",
      "Markov chain Monte Carlo (MCMC) tackles this intractability by constructing a Markov chain whose stationary distribution matches the exact posterior. While asymptotically exact, MCMC explores state spaces slowly and scales poorly to millions of observations or real-time latent inferences. Variational inference (VI) offers an alternative paradigm: instead of sampling, approximate the posterior using continuous optimisation.",
      "VI posits a tractable family of distributions over latent variables $\\mathcal{Q} = \\{q_\\theta(z)\\}$ parameterised by variational parameters $\\theta$. It then searches within $\\mathcal{Q}$ for the distribution $q^*(z)$ that minimises the Kullback–Leibler divergence $D_{\\mathrm{KL}}(q_\\theta(z) \\parallel p(z \\mid x))$ to the true posterior. Because the true posterior $p(z \\mid x)$ is unknown, we cannot minimise this divergence directly. Fortunately, decomposing the log marginal evidence reveals that maximising the Evidence Lower Bound (ELBO) is mathematically identical to minimising this divergence.",
      "The choice of family $\\mathcal{Q}$ determines both fidelity and computational tractability. The classic mean-field approximation assumes latent variables factorise completely: $q(z) = \\prod_{j=1}^M q_j(z_j)$. Under this structure, Coordinate Ascent Variational Inference (CAVI) iteratively updates each variational factor in closed form. In modern deep learning, variational autoencoders (VAEs) employ stochastic gradient variational inference, using amortised neural networks and the reparameterisation trick to optimise the ELBO via standard backpropagation."
    ],
    analogy: "Imagine sculpting a statue out of a block of marble to match a phantom figure standing behind a frosted glass screen. You cannot touch or measure the phantom directly (the intractable posterior), but every step closer your chisel sculpts the marble against a shadow projection (the joint likelihood and prior) raises the total illumination in the studio (the evidence lower bound). When illumination reaches its peak, your marble sculpture is the closest possible physical approximation within your sculpting toolset.",
    steps: [
      {
        "title": "1. Specify generative model and variational family",
        "body": "Define the joint distribution $p(x, z) = p(x \\mid z) p(z)$ with observed $x$ and latents $z$. Choose a tractable variational family $\\mathcal{Q} = \\{q(z \\mid \\theta)\\}$, such as a factorised mean-field Gaussian distribution."
      },
      {
        "title": "2. Formulate the Evidence Lower Bound (ELBO)",
        "body": "Decompose $\\log p(x) = \\mathrm{ELBO}(q) + D_{\\mathrm{KL}}(q(z) \\parallel p(z \\mid x))$. Because KL divergence is non-negative, $\\mathrm{ELBO}(q) = \\mathbb{E}_q[\\log p(x, z)] - \\mathbb{E}_q[\\log q(z)] \\le \\log p(x)$. Maximising the ELBO directly minimises divergence to the true posterior."
      },
      {
        "title": "3. Coordinate ascent updates (CAVI)",
        "body": "Under the mean-field assumption $q(z) = \\prod_j q_j(z_j)$, derive closed-form updates for each factor: $\\log q_j^*(z_j) = \\mathbb{E}_{q_{-j}}[\\log p(x, z)] + \\mathrm{const}$. Iterate across factors until the ELBO converges."
      },
      {
        "title": "4. Stochastic gradient and reparameterisation",
        "body": "For non-conjugate or deep neural models where expectations lack closed forms, approximate gradients using Monte Carlo samples. For continuous latents, apply the reparameterisation trick $z = g_\\theta(\\epsilon)$ with $\\epsilon \\sim \\mathcal{N}(0, I)$ to propagate low-variance gradients directly into variational parameters."
      }
    ],
    math: [
      {
        "h": "Evidence and KL Decomposition",
        "tex": "\\log p(x) = \\mathbb{E}_{q(z)}\\left[\\log \\frac{p(x, z)}{q(z)}\\right] + D_{\\mathrm{KL}}(q(z) \\parallel p(z \\mid x)) = \\mathrm{ELBO}(q) + D_{\\mathrm{KL}}(q \\parallel p)",
        "p": "Because the KL divergence is non-negative and equals zero if and only if q(z) = p(z|x), the ELBO serves as a strict mathematical lower bound on the log evidence log p(x). Maximising the ELBO with respect to q directly minimises KL divergence to the exact posterior."
      },
      {
        "h": "ELBO Components: Reconstruction vs Regularisation",
        "tex": "\\mathrm{ELBO}(q) = \\mathbb{E}_{q(z)}[\\log p(x \\mid z)] - D_{\\mathrm{KL}}(q(z) \\parallel p(z))",
        "p": "Rewriting the ELBO decomposes the objective into an expected log-likelihood term (rewarding variational states that reconstruct observed data well) and a prior KL penalty (regularising q(z) toward prior p(z))."
      },
      {
        "h": "Mean-Field Coordinate Ascent (CAVI)",
        "tex": "\\log q_j^*(z_j) = \\mathbb{E}_{-j}[\\log p(x, z_j, z_{-j})] + \\text{const}",
        "p": "For each latent variable j, the optimal mean-field factor q_j*(z_j) is proportional to the exponential of the expected complete-data log-likelihood conditioned on all remaining factors -j."
      }
    ],
    code: "import numpy as np\n\n# Coordinate Ascent Variational Inference (CAVI) for 1D Gaussian Mixture\n# Model: x_i ~ N(mu_{c_i}, 1), prior mu_k ~ N(0, sigma_0^2), equal cluster weights\nnp.random.seed(42)\n\n# Generate synthetic two-component mixture\nn_samples = 300\ntrue_mus = np.array([-2.5, 3.0])\nassignments = np.random.binomial(1, 0.5, size=n_samples)\nx = np.where(assignments == 0, np.random.normal(true_mus[0], 1.0, n_samples),\n                               np.random.normal(true_mus[1], 1.0, n_samples))\n\nK = 2\nsigma0_sq = 10.0  # Prior variance on cluster means\n\n# Initialise variational parameters:\n# q(mu_k) = N(m_k, s2_k), q(c_i) = Categorical(phi_i)\nm = np.random.normal(0, 1, size=K)\ns2 = np.ones(K)\nphi = np.ones((n_samples, K)) / K\n\ndef compute_elbo(x, m, s2, phi, sigma0_sq):\n    elbo = 0.0\n    for k in range(K):\n        # Prior on mu_k\n        elbo += -0.5 * np.log(2 * np.pi * sigma0_sq) - (m[k]**2 + s2[k]) / (2 * sigma0_sq)\n        # Entropy of q(mu_k)\n        elbo += 0.5 * np.log(2 * np.pi * np.e * s2[k])\n    \n    # Expected likelihood and cluster entropy\n    for i in range(n_samples):\n        for k in range(K):\n            if phi[i, k] > 1e-12:\n                exp_log_lik = -0.5 * np.log(2 * np.pi) - 0.5 * ((x[i] - m[k])**2 + s2[k])\n                elbo += phi[i, k] * (exp_log_lik - np.log(phi[i, k]) - np.log(K))\n    return elbo\n\n# Coordinate Ascent iterations\nn_iters = 25\nelbo_history = []\n\nfor it in range(n_iters):\n    # 1. Update cluster responsibilities phi_ik\n    for i in range(n_samples):\n        log_rho = np.zeros(K)\n        for k in range(K):\n            log_rho[k] = -0.5 * ((x[i] - m[k])**2 + s2[k]) - np.log(K)\n        # Softmax normalisation for stability\n        rho = np.exp(log_rho - np.max(log_rho))\n        phi[i] = rho / np.sum(rho)\n        \n    # 2. Update variational parameters for cluster means m_k and s2_k\n    for k in range(K):\n        sum_phi = np.sum(phi[:, k])\n        s2[k] = 1.0 / (1.0 / sigma0_sq + sum_phi)\n        m[k] = s2[k] * np.sum(phi[:, k] * x)\n        \n    elbo = compute_elbo(x, m, s2, phi, sigma0_sq)\n    elbo_history.append(elbo)\n\nprint(f\"True cluster means: {true_mus}\")\nprint(f\"Variational posterior means: {np.sort(m).round(3)}\")\nprint(f\"Variational posterior variances: {s2[np.argsort(m)].round(4)}\")\nprint(f\"Initial ELBO: {elbo_history[0]:.2f} -> Final ELBO: {elbo_history[-1]:.2f}\")\nprint(f\"ELBO strictly non-decreasing: {np.all(np.diff(elbo_history) >= -1e-7)}\")",
    keyPoints: [
      "Transforms Bayesian inference from intractable numerical integration into continuous optimisation over distribution parameters.",
      "The Evidence Lower Bound (ELBO) satisfies ELBO(q) = log p(x) - D_KL(q || p) <= log p(x); maximising it minimises divergence to the true posterior.",
      "Mean-field variational inference factorises latent variables independently, enabling coordinate ascent (CAVI) in conditionally conjugate models.",
      "Underestimates posterior variance: because reverse KL heavily penalises places where q > 0 but p approx 0, VI fits tightly into the dominant mode rather than covering the whole spread.",
      "Stochastic VI and the reparameterisation trick allow VI to scale to massive datasets and power variational autoencoders (VAEs)."
    ],
    pitfalls: [
      "Zero-forcing variance underestimation: Reverse KL forces q(z) to remain strictly within high-density regions of p(z|x), underestimating true parameter uncertainty and ignoring secondary modes.",
      "Mean-field correlation blindness: Assuming complete factorisation q(z) = \\prod q_j(z_j) forces all covariance between latent variables to zero, potentially corrupting inference when latents are strongly coupled.",
      "Local optima: Unlike MCMC which theoretically visits the whole support asymptotically, gradient ascent on the ELBO can get trapped in local optima or bad saddle points."
    ],
    quiz: [
      {
        "q": "Why does maximising the Evidence Lower Bound (ELBO) minimise the KL divergence D_KL(q(z) || p(z|x))?",
        "o": [
          "Because the log evidence log p(x) is constant with respect to q(z), and log p(x) = ELBO(q) + D_KL(q || p)",
          "Because the KL divergence is always negative, so increasing ELBO reduces its absolute magnitude",
          "Because ELBO equals the exact likelihood multiplied by the prior",
          "Because variational inference forces the posterior to equal 1 everywhere"
        ],
        "a": 0,
        "why": "The fundamental decomposition is log p(x) = ELBO(q) + D_KL(q || p(z|x)). Since log p(x) does not depend on variational distribution q, increasing ELBO directly forces D_KL down."
      },
      {
        "q": "What is a major qualitative difference between the posterior approximation from mean-field VI compared to MCMC?",
        "o": [
          "Mean-field VI tends to underestimate posterior variance and ignores correlations between latent variables",
          "Mean-field VI is guaranteed to be asymptotically exact while MCMC always diverges",
          "Mean-field VI overestimates posterior variance across all peripheral modes",
          "Mean-field VI cannot be applied to models with continuous latent variables"
        ],
        "a": 0,
        "why": "Because reverse KL D_KL(q || p) is zero-forcing and the mean-field assumption forces factorisation q(z) = \\prod q_j(z_j), VI fits tightly inside the primary mode and zeroes out off-diagonal posterior covariances."
      }
    ],
    usedBy: [],
    prereq: [
      "kl-divergence",
      "conjugate-priors-beta-binomial"
    ],
    related: [
      "mcmc-metropolis-hastings-and-gibbs",
      "hamiltonian-monte-carlo",
      "map-and-bayesian-estimation",
      "conjugate-priors-beta-binomial"
    ],
    keywords: "variational inference, elbo, mean field, cavi, coordinate ascent, kl divergence, latent variables, reparameterisation trick"
  },
  {
    id: "markov-chains-and-stationary-distributions",
    short: "Markov chains",
    title: "Markov Chains and Stationary Distributions",
    task: "concepts",
    module: "Bayesian and stochastic",
    level: 2,
    minutes: 16,
    noLab: true,
    summary: "Model stochastic state transitions where the future depends only on the present: understand transition matrices, Chapman–Kolmogorov equations, ergodicity, and the stationary distribution \\pi = \\pi P.",
    lead: "From Google PageRank and queueing systems to MCMC sampling and reinforcement learning, stochastic processes with memoryless state transitions provide the foundational framework for long-run equilibrium analysis.",
    intuition: [
      "A Markov chain is a discrete-time stochastic process {X_0, X_1, X_2, ...} taking values in a discrete state space S. Its defining property—the Markov property—states that conditional on current state X_t, the probability of transitioning to any future state X_{t+1} is independent of the sequence of past states: P(X_{t+1} = j | X_t = i, X_{t-1}, ..., X_0) = P(X_{t+1} = j | X_t = i) = P_{ij}.",
      "These one-step transition probabilities form a row-stochastic matrix P where every entry P_{ij} >= 0 and each row sums to 1. To predict the distribution over states n steps into the future, we apply the Chapman–Kolmogorov equations: P(X_{t+n} = j | X_t = i) = (P^n)_{ij}. If the initial state distribution across all states is a row vector \\pi_0, the state distribution at step n is simply \\pi_n = \\pi_0 P^n.",
      "A fundamental question is: what happens as n -> \\infty? Does the distribution settle into a steady state, independent of the initial starting condition \\pi_0? A probability distribution \\pi is called a stationary (or invariant) distribution if \\pi = \\pi P. Once the process attains this distribution, running it further forward in time never alters the probability of finding the system in any given state.",
      "The Fundamental Convergence Theorem of Markov Chains guarantees that a unique stationary distribution \\pi exists and \\lim_{n \\to \\infty} \\pi_0 P^n = \\pi$ for any initial distribution \\pi_0, provided the chain is ergodic—meaning it is irreducible (any state can be reached from any other state in finite steps) and aperiodic (transitions do not cycle deterministically on fixed periods). Furthermore, if a distribution satisfies detailed balance (reversibility), \\pi_i P_{ij} = \\pi_j P_{ji}, it is guaranteed to be a stationary distribution—a property exploited by MCMC algorithms."
    ],
    analogy: "Imagine a group of commuters moving between three subway stations every morning according to fixed transition odds: 70% stay at their workplace station, 20% move to the downtown station, and 10% move to the outer ring. Regardless of where commuters began on Monday morning, within two or three weeks the percentage of commuters found at each station stabilises into an invariant daily distribution—the stationary distribution of the transit chain.",
    steps: [
      {
        "title": "1. Specify states and transition matrix",
        "body": "Define the state space S = {1, ..., K} and populate the transition matrix P where P_{ij} = P(X_{t+1}=j | X_t=i), ensuring each row sums strictly to 1."
      },
      {
        "title": "2. Verify ergodicity (irreducibility and aperiodicity)",
        "body": "Ensure the transition graph is strongly connected (every state communicates with every other state) and has no periodic loops (gcd of return path lengths equals 1)."
      },
      {
        "title": "3. Solve the stationary distribution balance equation",
        "body": "Solve the linear system \\pi = \\pi P subject to \\sum_i \\pi_i = 1 and \\pi_i >= 0. Algebraically, this corresponds to finding the normalised left eigenvector of P associated with eigenvalue \\lambda = 1."
      },
      {
        "title": "4. Monitor convergence and mixing time",
        "body": "Track ||\\pi_0 P^n - \\pi||_{TV} as step count n grows. The rate of geometric convergence is governed by the second largest eigenvalue magnitude |\\lambda_2| < 1, with spectral gap \\gamma = 1 - |\\lambda_2| determining mixing time."
      }
    ],
    math: [
      {
        "h": "The Markov Property and Chapman–Kolmogorov",
        "tex": "P(X_{t+n} = j \\mid X_t = i) = (P^n)_{ij}, \\quad \\pi_n = \\pi_0 P^n",
        "p": "The memoryless property implies multi-step transition probabilities are obtained directly by matrix powering. Given initial row probability vector pi_0, the marginal state distribution at step n is pi_0 P^n."
      },
      {
        "h": "Stationary Distribution Equation",
        "tex": "\\pi P = \\pi \\quad \\iff \\quad \\pi (I - P) = 0 \\quad \\text{subject to} \\quad \\sum_{i=1}^K \\pi_i = 1, \\; \\pi_i \\ge 0",
        "p": "The stationary distribution pi is the normalised left eigenvector of transition matrix P corresponding to eigenvalue lambda = 1."
      },
      {
        "h": "Detailed Balance (Reversibility)",
        "tex": "\\pi_i P_{ij} = \\pi_j P_{ji} \\quad \\forall i, j \\in \\mathcal{S}",
        "p": "Detailed balance states the probability flux from state i to state j equals the reverse flux from j to i. Summing both sides over i shows detailed balance is a sufficient condition for stationarity."
      }
    ],
    code: "import numpy as np\n\n# 4-state ergodic Markov chain\nstates = ['Sunny', 'Cloudy', 'Rainy', 'Stormy']\nK = len(states)\n\n# Row-stochastic transition matrix P: P[i, j] = P(X_{t+1} = j | X_t = i)\nP = np.array([\n    [0.70, 0.20, 0.08, 0.02],  # Sunny\n    [0.30, 0.40, 0.25, 0.05],  # Cloudy\n    [0.15, 0.35, 0.40, 0.10],  # Rainy\n    [0.10, 0.20, 0.50, 0.20],  # Stormy\n])\n\n# Method 1: Solve via Left Eigenvector of P\neigenvalues, left_eigenvectors = np.linalg.eig(P.T)\n# Find eigenvalue closest to 1.0\nidx = np.argmin(np.abs(eigenvalues - 1.0))\nstationary_eigen = np.real(left_eigenvectors[:, idx])\nstationary_eigen /= np.sum(stationary_eigen)\n\n# Method 2: Solve linear system (P.T - I) pi = 0 with constraint sum(pi) = 1\nA = np.vstack([P.T - np.eye(K), np.ones((1, K))])\nb = np.append(np.zeros(K), 1.0)\nstationary_lstsq, _, _, _ = np.linalg.lstsq(A, b, rcond=None)\n\n# Method 3: Simulate long-run discrete Markov trajectory\nnp.random.seed(42)\nn_steps = 100_000\ncurrent_state = 0  # Start at Sunny\nvisits = np.zeros(K)\n\nfor _ in range(n_steps):\n    visits[current_state] += 1\n    current_state = np.random.choice(K, p=P[current_state])\n\nempirical_dist = visits / n_steps\n\nprint(\"Stationary distribution (Analytic left-eigen):\")\nfor s, p in zip(states, stationary_eigen):\n    print(f\"  {s:8s}: {p:.4f}\")\n\nprint(\"\\nEmpirical long-run frequency (100k steps):\")\nfor s, p in zip(states, empirical_dist):\n    print(f\"  {s:8s}: {p:.4f}\")\n\n# Spectral gap and mixing rate\nsorted_eigenvals = np.sort(np.abs(eigenvalues))[::-1]\nspectral_gap = 1.0 - sorted_eigenvals[1]\nprint(f\"\\nSecond eigenvalue magnitude: {sorted_eigenvals[1]:.4f}\")\nprint(f\"Spectral gap: {spectral_gap:.4f} (governs mixing rate)\")",
    keyPoints: [
      "The Markov property dictates that the future state depends only on current state, not on the sequence of preceding states.",
      "A stochastic matrix P has non-negative entries with row sums equal to 1, guaranteeing that 1 is its largest eigenvalue.",
      "Ergodic chains (irreducible and aperiodic) possess a unique stationary distribution \\pi such that \\lim_{n \\to \\infty} \\pi_0 P^n = \\pi regardless of initial distribution \\pi_0.",
      "Detailed balance \\pi_i P_{ij} = \\pi_j P_{ji} provides a sufficient condition for stationarity, forming the foundation of MCMC sampling algorithms.",
      "The spectral gap 1 - |\\lambda_2| controls the mixing time: larger spectral gaps yield rapid convergence to the stationary distribution."
    ],
    pitfalls: [
      "Periodic chains failing to converge: An alternating two-state chain oscillating between state A and B has stationary distribution (0.5, 0.5), but \\pi_0 P^n alternates (1, 0) and (0, 1) without converging.",
      "Reducible chains with multiple equilibria: If the chain has disconnected absorbing sets, the stationary distribution is non-unique and depends directly on where the chain began.",
      "Confusing row vectors and column vectors: Because P is row-stochastic (\\sum_j P_{ij} = 1), the stationary distribution satisfies the left-multiplication \\pi P = \\pi, not P \\pi = \\pi."
    ],
    quiz: [
      {
        "q": "Which condition is strictly required for a finite Markov chain to possess a unique stationary distribution independent of initial conditions?",
        "o": [
          "The chain must be ergodic (irreducible and aperiodic)",
          "The transition matrix must be symmetric",
          "All diagonal transition probabilities must be zero",
          "The state space must contain at least one absorbing state"
        ],
        "a": 0,
        "why": "Ergodicity guarantees irreducibility (every state is reachable from every other state) and aperiodicity (no deterministic cyclical loops), ensuring unique convergence regardless of initial distribution."
      },
      {
        "q": "What is the relationship between detailed balance \\pi_i P_{ij} = \\pi_j P_{ji} and the stationary distribution?",
        "o": [
          "Detailed balance is a sufficient condition for stationarity, meaning any distribution satisfying it is guaranteed to be stationary",
          "Detailed balance is necessary for stationarity; non-reversible chains never have stationary distributions",
          "Detailed balance implies that the transition matrix P must be identity",
          "Detailed balance guarantees that the chain will terminate within a finite number of steps"
        ],
        "a": 0,
        "why": "Summing both sides of detailed balance over i yields \\sum_i \\pi_i P_{ij} = \\pi_j \\sum_i P_{ji} = \\pi_j(1) = \\pi_j, which is exactly the stationarity condition \\pi P = \\pi."
      }
    ],
    usedBy: [],
    prereq: [
      "probability-rules-and-bayes-theorem"
    ],
    related: [
      "mcmc-metropolis-hastings-and-gibbs",
      "hamiltonian-monte-carlo",
      "variational-inference",
      "state-space-models-and-the-kalman-filter"
    ],
    keywords: "markov chain, stationary distribution, transition matrix, ergodicity, detailed balance, chapman kolmogorov, mixing time, spectral gap"
  },
  {
    id: 'stationarity-acf-and-pacf',
    short: 'Stationarity, ACF and PACF',
    title: 'Stationarity, Autocorrelation and Partial Autocorrelation',
    task: 'concepts',
    module: 'Time series and survival',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Weak stationarity ensures that mean, variance, and autocovariance remain invariant over time, while the ACF and PACF reveal the memory structure of temporal data.`,
    lead: r`Statistical forecasting models rely on stationarity: historical patterns must behave consistently into the future. Autocorrelation (ACF) measures total linear association between observations at varying lags, whereas partial autocorrelation (PACF) isolates direct linear relationships by removing the confounding influence of intervening lags.`,
    intuition: [
      r`Imagine forecasting daily electricity demand. If demand grows steadily by 5% each year as the population expands, yesterday's mean is an unreliable baseline for tomorrow. Similarly, if winter demand swings by 50 GW while spring fluctuations rarely exceed 10 GW, the variance depends on the calendar. A non-stationary process is a moving target whose statistical parameters shift underneath your model, generating spurious correlations and unstable predictions.`,
      r`Weak (second-order or covariance) stationarity imposes three conditions: a constant mean $\mu$, a constant finite variance $\sigma^2$, and an autocovariance $\gamma(k)$ that depends solely on the time separation $k = |t - s|$, not on the absolute calendar date $t$. When raw data drifts or displays changing volatility, transformations such as logarithmic scaling and differencing ($\Delta y_t = y_t - y_{t-1}$) stabilise the moments, converting persistent wanderings into stationary fluctuations around zero.`,
      r`Once a series is stationary, we map its temporal memory using autocorrelation functions. The ACF at lag 2 measures the raw correlation between $y_t$ and $y_{t-2}$. However, $y_t$ correlates with $y_{t-1}$, and $y_{t-1}$ correlates with $y_{t-2}$, creating an indirect echo through the intermediate period. The PACF strips away this linear chain of mediation, measuring only the residual connection between $y_t$ and $y_{t-2}$ once $y_{t-1}$ is controlled for. For a pure autoregressive process AR(1), the ACF decays geometrically while the PACF cuts off cleanly after lag 1.`,
    ],
    analogy: r`ACF is like the total reverberation echoing down a corridor, while PACF isolates the distinct sound bouncing directly off a specific far wall after silencing echoes from every doorway in between.`,
    steps: [
      r`Plot the raw sequence against time to inspect for deterministic trends, seasonal cycles, or widening variance envelopes.`,
      r`Calculate rolling window metrics (such as a 30-period rolling mean and standard deviation) to visually inspect parameter constancy across historical segments.`,
      r`Execute formal unit-root hypothesis tests, such as the Augmented Dickey–Fuller (ADF) test, to assess whether stochastic trending requires first-order differencing.`,
      r`Apply variance-stabilising transformations (e.g. natural logarithms) and differencing ($\Delta y_t = y_t - y_{t-1}$) until the series exhibits mean-reverting behaviour.`,
      r`Compute sample ACF and PACF coefficients up to lag $K$, plotting them alongside 95% Bartlett confidence bounds ($\pm 1.96 / \sqrt{n}$) for white noise.`,
      r`Diagnose model signatures: an AR($p$) process displays decaying ACF and sharp PACF cut-off at lag $p$, whereas an MA($q$) process displays sharp ACF cut-off at lag $q$ and decaying PACF.`,
    ],
    math: [
      {
        h: 'Weak (covariance) stationarity',
        tex: r`$$\mathbb{E}[y_t] = \mu, \quad \operatorname{Var}(y_t) = \sigma^2 < \infty, \quad \operatorname{Cov}(y_t, y_{t-k}) = \gamma(k) \quad \forall t, k$$`,
        p: r`A process is weakly stationary if its first moment (mean $\mu$) and second moments (variance $\sigma^2$ and autocovariance $\gamma(k)$) are finite and invariant to time shifts $t$. Strict stationarity requires all joint probability distributions to remain identical under time shifts, but weak stationarity suffices for linear time-series modelling.`,
      },
      {
        h: 'Autocorrelation function (ACF)',
        tex: r`$$\rho(k) = \frac{\gamma(k)}{\gamma(0)} = \frac{\sum_{t=k+1}^n (y_t - \bar{y})(y_{t-k} - \bar{y})}{\sum_{t=1}^n (y_t - \bar{y})^2}$$`,
        p: r`$\rho(k)$ measures the linear correlation between observations separated by $k$ periods. Under the null hypothesis of Gaussian white noise, sample autocorrelations are asymptotically normal with variance $1/n$, yielding Bartlett 95% confidence bands of $\pm 1.96 / \sqrt{n}$.`,
      },
      {
        h: 'Partial autocorrelation function (PACF)',
        tex: r`$$\phi_{kk} = \operatorname{Corr}\big(y_t - \hat{y}_t^{(k-1)}, \; y_{t-k} - \hat{y}_{t-k}^{(k-1)}\big)$$`,
        p: r`$\phi_{kk}$ represents the partial correlation between $y_t$ and $y_{t-k}$ after projecting both onto the linear subspace spanned by intermediate lags $\{y_{t-1}, \dots, y_{t-k+1}\}$. In an AR($p$) process, $\phi_{kk} = 0$ for all $k > p$, providing an exact diagnostic cut-off.`,
      },
    ],
    keyPoints: [
      r`Non-stationary series produce spurious regressions: two completely independent drifting series frequently exhibit inflated $R^2$ values and misleadingly tiny p-values.`,
      r`ACF captures total serial correlation across time including cascaded intermediaries, while PACF isolates the direct conditional correlation at lag $k$.`,
      r`Bartlett bounds ($\pm 1.96 / \sqrt{n}$) establish the threshold beyond which sample autocorrelations reflect genuine signal rather than sampling noise.`,
      r`Differencing removes stochastic polynomial trends, but excessive over-differencing adds artificial negative autocorrelation and needlessly inflates forecast variance.`,
    ],
    pitfalls: [
      r`Evaluating ACF and PACF on un-differenced trending data: strong trends cause sample ACF to decay linearly and sluggishly, obscuring the true autoregressive structure.`,
      r`Over-differencing stationary data: differencing a stationary white noise series creates a non-invertible MA(1) process with $\theta = 1$, introducing artificial negative correlation.`,
      r`Confusing weak stationarity with strict stationarity: weak stationarity concerns only the first two moments, whereas strict stationarity requires invariance of the entire joint distribution.`,
      r`Neglecting seasonal non-stationarity: seasonal peaks occurring every $s$ periods violate autocovariance invariance and require seasonal differencing ($y_t - y_{t-s}$).`,
    ],
    code: r`import numpy as np

np.random.seed(42)
n = 300
eps = np.random.normal(0, 1.0, n)
y = np.zeros(n)
for t in range(1, n):
    y[t] = 0.7 * y[t-1] + eps[t]

# Sample moments
y_dm = y - np.mean(y)
gamma0 = np.dot(y_dm, y_dm) / n
acf = [np.dot(y_dm[k:], y_dm[:-k]) / (n * gamma0) for k in range(1, 4)]

# PACF: lag 1 equals ACF lag 1; lag 2 via OLS conditioning on lag 1
pacf1 = acf[0]
X2 = np.column_stack([y[1:-1], y[:-2]])
y2 = y[2:]
beta2 = np.linalg.lstsq(X2 - X2.mean(axis=0), y2 - y2.mean(), rcond=None)[0]
pacf2 = beta2[1]
bound_95 = 1.96 / np.sqrt(n)

print("Sample mean:", round(float(np.mean(y)), 3))
print("Sample var:", round(float(np.var(y)), 3))
print("ACF lags 1..3:", [round(float(x), 3) for x in acf])
print("PACF lag 1:", round(float(pacf1), 3), "lag 2:", round(float(pacf2), 3))
print("Bartlett 95% bound:", round(float(bound_95), 3))`,
    quiz: [
      {
        q: r`Which condition is strictly required for a time series to be weakly (covariance) stationary?`,
        o: [
          r`All higher-order moments must equal zero`,
          r`The mean, variance, and autocovariance depend only on lag displacement, not on calendar time`,
          r`The observations must follow an exact Gaussian distribution`,
          r`The series must have zero autocorrelation at all lags`,
        ],
        a: 1,
        why: r`Weak stationarity requires constant mean, constant finite variance, and autocovariances that depend solely on the lag difference $k = |t - s|$.`,
      },
      {
        q: r`If a stationary series is generated by an AR(1) process $y_t = \phi y_{t-1} + \epsilon_t$ with $0 < \phi < 1$, what behaviour do ACF and PACF display?`,
        o: [
          r`ACF decays geometrically, while PACF cuts off cleanly after lag 1`,
          r`ACF cuts off sharply after lag 1, while PACF decays exponentially`,
          r`Both ACF and PACF remain exactly zero at all lags`,
          r`Both ACF and PACF decay linearly to infinity`,
        ],
        a: 0,
        why: r`In an AR(1) model, ACF displays geometric decay $\rho(k) = \phi^k$, whereas PACF isolates the direct lag effect and drops to zero for all lags $k \ge 2$.`,
      },
      {
        q: r`Why does PACF differ from ACF at lag 2 for an autoregressive process?`,
        o: [
          r`PACF squares the correlation values to prevent negative numbers`,
          r`PACF only uses even-numbered time steps`,
          r`PACF controls for the linear intermediate influence of lag 1, isolating the direct relationship between $y_t$ and $y_{t-2}$`,
          r`PACF includes non-linear polynomial interactions while ACF is linear`,
        ],
        a: 2,
        why: r`ACF at lag 2 incorporates both the direct relationship and indirect transmission through $y_{t-1}$; PACF eliminates the intermediate linear mediation of $y_{t-1}$.`,
      },
      {
        q: r`What is the risk of over-differencing a series that is already stationary?`,
        o: [
          r`It artificially increases the degrees of freedom`,
          r`It permanently converts the series into a deterministic linear trend`,
          r`It eliminates all random error from future forecasts`,
          r`It introduces artificial negative autocorrelation and induces an unnecessary moving-average unit root`,
        ],
        a: 3,
        why: r`Differencing white noise $y_t = \epsilon_t$ yields $\Delta y_t = \epsilon_t - \epsilon_{t-1}$, introducing an artificial MA(1) structure with $\rho(1) = -0.5$ and inflating prediction variance.`,
      },
    ],
    usedBy: ['arima-and-sarima'],
    prereq: ['expectation-variance-and-covariance', 'correlation-pearson-spearman-kendall', 'hypothesis-testing-and-p-values'],
    related: ['arima-and-sarima', 'residual-diagnostics-and-heteroscedasticity', 'exponential-smoothing-ets'],
    keywords: 'stationarity acf pacf autocorrelation partial autocorrelation time series bartlett bounds unit root differencing',
  },
  {
    id: 'arima-and-sarima',
    short: 'ARIMA and SARIMA',
    title: 'Autoregressive Integrated Moving Average Models',
    task: 'concepts',
    module: 'Time series and survival',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`ARIMA combines autoregression, differencing, and moving-average error shocks into a flexible framework for non-seasonal and seasonal time-series forecasting.`,
    lead: r`Real-world temporal sequences exhibit persistence, non-stationarity, and recurring seasonal cycles. ARIMA($p, d, q$) integrates autoregressive lag terms of order $p$, differencing of degree $d$ to enforce stationarity, and moving-average error shocks of order $q$. SARIMA extends this formulation with seasonal operators $(P, D, Q)_s$ to capture periodic cycles without inflating parameter counts.`,
    intuition: [
      r`Consider monthly retail revenue. Sales steadily climb over years (trend), spike dramatically every December (seasonality), and display momentum from quarter to quarter (persistence). To forecast next month's sales, three sources of information help: (1) where sales stood last month (autoregression, AR), (2) how much the series drifted recently (differencing, I), and (3) unexpected shocks—such as a promotional surge or a freight delay—whose effects linger into subsequent months (moving average, MA).`,
      r`ARIMA integrates these three mechanisms into a single linear equation. The parameter $d$ specifies how many times successive differences ($y_t - y_{t-1}$) are taken to eliminate non-stationary drift and stabilise the mean. Once differenced, the AR($p$) component models the current value as a weighted sum of its own previous $p$ values, while the MA($q$) component models it as a linear combination of the current and prior $q$ unobserved white-noise forecast errors.`,
      r`When dynamics repeat across seasonal periods of length $s$ (e.g. $s = 12$ for monthly cycles), fitting a high-order non-seasonal ARIMA model would require estimating dozens of intermediate coefficients, wasting statistical power. SARIMA resolves this with multiplicative seasonal operators: seasonal differencing $\Delta_s y_t = y_t - y_{t-s}$ eliminates cyclical baselines, while seasonal autoregressive ($P$) and moving-average ($Q$) terms link observations across annual intervals using only a handful of well-identified parameters.`,
    ],
    analogy: r`ARIMA steers a vessel by holding course based on recent heading (AR), trimming against prevailing drift (I), and damping turbulence from rogue waves (MA); SARIMA consults an annual tidal chart to anticipate periodic swells.`,
    steps: [
      r`Examine time plots, variance stability, and unit-root tests (ADF) to determine the required regular differencing order $d \in \{0, 1, 2\}$.`,
      r`Inspect seasonal cycles across period $s$ and apply seasonal differencing $D \in \{0, 1\}$ if repeating annual or weekly patterns persist.`,
      r`Examine ACF and PACF plots of the differenced series: non-seasonal spikes suggest orders $p$ and $q$, while recurring spikes at seasonal multiples ($s, 2s$) suggest $P$ and $Q$.`,
      r`Estimate model coefficients ($\phi, \theta, \Phi, \Theta$) using conditional maximum likelihood estimation (MLE) or non-linear least squares.`,
      r`Perform residual diagnostic checks: verify residuals resemble white noise using the Ljung–Box test ($p > 0.05$) and inspect residual ACF for leftover signal.`,
      r`Compute multi-step point forecasts alongside analytical prediction intervals ($1.96 \times \text{SE}(h)$) that expand with horizon $h$.`,
    ],
    math: [
      {
        h: 'The non-seasonal ARIMA($p, d, q$) equation',
        tex: r`$$\phi(B)(1 - B)^d y_t = c + \theta(B)\epsilon_t, \quad \epsilon_t \sim \mathcal{WN}(0, \sigma^2)$$`,
        p: r`$B$ denotes the backshift operator ($B^k y_t = y_{t-k}$), $\phi(B) = 1 - \sum_{i=1}^p \phi_i B^i$ is the autoregressive polynomial, $(1 - B)^d$ denotes $d$-th order differencing, and $\theta(B) = 1 + \sum_{j=1}^q \theta_j B^j$ is the moving-average polynomial. Constant $c$ governs deterministic drift, and $\epsilon_t$ is zero-mean white noise with variance $\sigma^2$.`,
      },
      {
        h: 'The multiplicative SARIMA($p, d, q) \times (P, D, Q)_s$ model',
        tex: r`$$\Phi_P(B^s)\,\phi(B)(1 - B^s)^D(1 - B)^d y_t = \Theta_Q(B^s)\,\theta(B)\epsilon_t$$`,
        p: r`$\Phi_P(B^s) = 1 - \sum_{k=1}^P \Phi_k B^{ks}$ models seasonal autoregression, $(1 - B^s)^D$ represents seasonal differencing of period $s$, and $\Theta_Q(B^s) = 1 + \sum_{m=1}^Q \Theta_m B^{ms}$ models seasonal moving-average errors. Multiplying seasonal and non-seasonal operators yields a parsimonious composite filter.`,
      },
      {
        h: 'Stationarity and invertibility roots',
        tex: r`$$\text{Roots of } \phi(z) = 0 \text{ and } \theta(z) = 0 \text{ must lie strictly outside the unit circle } (|z| > 1)$$`,
        p: r`Characteristic roots outside the complex unit circle guarantee that the AR polynomial is stable (stationary) and the MA polynomial is invertible. Invertibility ensures that unobserved noise shocks $\epsilon_t$ can be expressed uniquely as a convergent infinite autoregression of observed past values.`,
      },
    ],
    keyPoints: [
      r`The "I" stands for integrated: a series differenced $d$ times must be integrated (cumulatively summed) $d$ times to recover original forecast levels.`,
      r`Parsimony avoids parameter redundancy: adding both redundant AR and MA terms can cause roots to nearly cancel, destabilising numerical optimisation.`,
      r`Moving-average terms model unobserved past forecast errors ($\epsilon_{t-j}$), not a simple rolling average of observed data points.`,
      r`Forecast uncertainty expands with horizon: for $d \ge 1$, prediction interval widths grow without bound as time horizon $h \to \infty$.`,
    ],
    pitfalls: [
      r`Over-differencing the series: applying $d=2$ when $d=1$ suffices induces an artificial moving-average root $\theta \approx 1$ and inflates forecast variance.`,
      r`Neglecting the invertibility condition: non-invertible MA models yield unstable recursive error estimates and unreliable out-of-sample confidence intervals.`,
      r`Relying on in-sample fit metrics ($R^2$): high-order ARIMA specifications easily overfit historical noise; model selection should minimise AIC or BIC.`,
      r`Skipping residual diagnostic testing: failing to evaluate the Ljung–Box statistic leaves unmodelled serial dependence buried in forecast residuals.`,
    ],
    code: r`import numpy as np

np.random.seed(42)
n = 200
phi_true, c_true = 0.65, 0.2
eps = np.random.normal(0, 1.0, n)

# Generate stationary AR(1) process w_t
w = np.zeros(n)
for t in range(1, n):
    w[t] = c_true + phi_true * w[t-1] + eps[t]

# Integrate to create ARIMA(1, 1, 0) series
y = np.cumsum(w) + 100.0

# Difference series to achieve stationarity
dy = np.diff(y)
X = np.column_stack([np.ones(len(dy) - 1), dy[:-1]])
y_target = dy[1:]
beta = np.linalg.lstsq(X, y_target, rcond=None)[0]
c_hat, phi_hat = beta[0], beta[1]
res = y_target - X @ beta
sigma2_hat = np.var(res, ddof=2)

# Multi-step point forecast for horizon h = 1, 2, 3
current_dy = dy[-1]
forecast_dy = []
for _ in range(3):
    current_dy = c_hat + phi_hat * current_dy
    forecast_dy.append(current_dy)
forecast_y = y[-1] + np.cumsum(forecast_dy)

print("Estimated drift c:", round(float(c_hat), 3), "true:", c_true)
print("Estimated phi:", round(float(phi_hat), 3), "true:", phi_true)
print("Residual variance:", round(float(sigma2_hat), 3))
print("Last observed y:", round(float(y[-1]), 2))
print("Forecasts y_{t+1..3}:", [round(float(val), 2) for val in forecast_y])`,
    quiz: [
      {
        q: r`In an ARIMA($p, d, q$) model, what does the parameter $d$ represent?`,
        o: [
          r`The number of seasonal dummy variables included in the model`,
          r`The damping factor applied to multi-step forecasts`,
          r`The number of times the series is consecutively differenced to eliminate trend and achieve stationarity`,
          r`The autoregressive lag order of the disturbance term`,
        ],
        a: 2,
        why: r`The parameter $d$ represents the integration order—the number of consecutive differencing operations $(1-B)^d$ required to achieve covariance stationarity.`,
      },
      {
        q: r`What does the moving-average component MA($q$) model?`,
        o: [
          r`A linear combination of the current and past $q$ unobserved white-noise forecast errors`,
          r`A simple rolling arithmetic average of the last $q$ observed historical values`,
          r`A polynomial trend of degree $q$ fitted via ordinary least squares`,
          r`The moving variance of the seasonal residuals`,
        ],
        a: 0,
        why: r`The MA($q$) component models current deviations as a linear combination of past random shocks $\epsilon_t + \theta_1 \epsilon_{t-1} + \dots + \theta_q \epsilon_{t-q}$.`,
      },
      {
        q: r`Why is the multiplicative SARIMA parameterisation preferred over including separate indicator dummy variables for every seasonal period?`,
        o: [
          r`SARIMA does not require computing any residual diagnostics`,
          r`SARIMA captures seasonal dependence using far fewer parameters, avoiding degrees-of-freedom depletion and overfitting`,
          r`SARIMA guarantees that prediction intervals never widen over time`,
          r`SARIMA can only be applied to non-stationary data`,
        ],
        a: 1,
        why: r`SARIMA models seasonal autoregression and moving averages parsimoniously across period $s$, capturing periodic dynamics with few parameters rather than estimating $s-1$ separate coefficients.`,
      },
      {
        q: r`What condition must the roots of the autoregressive characteristic polynomial $\phi(z) = 0$ satisfy for the model to be stationary?`,
        o: [
          r`All roots must equal exactly 1.0`,
          r`All roots must lie strictly on the imaginary axis`,
          r`At least one root must lie inside the unit circle ($|z| < 1$)`,
          r`All roots must lie strictly outside the complex unit circle ($|z| > 1$)`,
        ],
        a: 3,
        why: r`Stationarity requires the roots of $\phi(z) = 1 - \sum \phi_i z^i = 0$ to lie outside the unit circle ($|z| > 1$), ensuring past shocks decay to zero rather than exploding over time.`,
      },
    ],
    usedBy: [],
    prereq: ['stationarity-acf-and-pacf', 'expectation-variance-and-covariance', 'residual-diagnostics-and-heteroscedasticity'],
    related: ['stationarity-acf-and-pacf', 'exponential-smoothing-ets', 'ols-inference-t-tests-f-test-r2-and-adjusted-r2'],
    keywords: 'arima sarima time series autoregressive moving average differencing box jenkins seasonal forecasting',
  },
  {
    id: 'exponential-smoothing-ets',
    short: 'Exponential smoothing (ETS)',
    title: 'Exponential Smoothing and the ETS Framework',
    task: 'concepts',
    module: 'Time series and survival',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Exponential smoothing generates forecasts using geometrically decaying weights on past data, generalised by the ETS state-space framework into formal statistical likelihood models.`,
    lead: r`Moving averages assign equal weight to recent observations and drop older history abruptly at window boundaries. Exponential smoothing replaces this cliff edge with geometrically decaying weights, giving greatest weight to recent data. The ETS (Error, Trend, Seasonal) framework formalises these intuitive heuristics into state-space innovations models with exact likelihoods and probabilistic prediction intervals.`,
    intuition: [
      r`Imagine tracking customer foot traffic at a café. Yesterday's attendance provides a strong signal for today's staffing needs, whereas traffic from three months ago carries much less relevance. If you compute a simple 7-day moving average, an unusual spike on day 1 drops off abruptly on day 8, causing an artificial jump in your forecast. Exponential smoothing eliminates this cliff: the most recent observation receives weight $\alpha$, the preceding day $\alpha(1-\alpha)$, the day before $\alpha(1-\alpha)^2$, and so on, fading into the past along an elegant, continuous curve.`,
      r`Simple exponential smoothing (SES) handles stationary series with no clear trend or seasonal rhythm. When a series trends steadily upward or downward, Holt's linear method introduces a second parameter $\beta$ to update a local slope (growth rate). When periodic rhythms appear—such as weekend demand spikes—Holt–Winters smoothing incorporates a third parameter $\gamma$ to adjust seasonal indices, operating additively (constant seasonal amplitude) or multiplicatively (seasonal swings proportional to the series level).`,
      r`The modern ETS taxonomy (Hyndman et al.) classifies time-series models by their three constituent components: Error ($\{A, M\}$), Trend ($\{N, A, A_d, M\}$), and Seasonal ($\{N, A, M\}$). Formulating exponential smoothing as state-space innovations models provides an exact Gaussian likelihood, transforming heuristic smoothing formulas into rigorous statistical estimators that support automated model selection via AIC and analytical prediction intervals.`,
    ],
    analogy: r`Exponential smoothing acts like a vehicular shock absorber: it damps short-term road turbulence while smoothly adjusting to sustained uphill grades (trend) and rhythmic highway ripples (seasonality).`,
    steps: [
      r`Decompose the historical series to determine whether trend and seasonal oscillations are absent, additive, or multiplicative.`,
      r`Select candidate ETS specifications: e.g. $\text{ETS}(A, N, N)$ for level data, $\text{ETS}(A, A, N)$ for trending data, or $\text{ETS}(M, A, M)$ for seasonal series with widening variance.`,
      r`Formulate state recursive equations for unobserved level $l_t$, trend growth $b_t$, and seasonal factor $s_t$.`,
      r`Estimate smoothing parameters ($\alpha, \beta, \gamma \in [0, 1]$) and initial states ($l_0, b_0, s_0$) by minimising the sum of squared one-step forecast errors or maximising likelihood.`,
      r`Generate recursive one-step-ahead fitted values $\hat{y}_{t|t-1}$ across training observations and perform residual diagnostic checks.`,
      r`Extrapolate state estimates forward across forecast horizon $h$ and compute probabilistic prediction bounds.`,
    ],
    math: [
      {
        h: 'Simple exponential smoothing (SES)',
        tex: r`$$\hat{y}_{t+1|t} = l_t, \quad l_t = \alpha y_t + (1 - \alpha) l_{t-1} = l_{t-1} + \alpha(y_t - l_{t-1})$$`,
        p: r`$l_t$ represents the estimated series level at time $t$, $\alpha \in (0, 1)$ is the smoothing parameter, and $e_t = y_t - l_{t-1}$ is the one-step-ahead forecast error. As $\alpha \to 1$, the model approaches a naive random walk; as $\alpha \to 0$, it converges to the historical sample mean.`,
      },
      {
        h: 'Holt’s linear trend method',
        tex: r`$$l_t = \alpha y_t + (1 - \alpha)(l_{t-1} + b_{t-1}), \quad b_t = \beta(l_t - l_{t-1}) + (1 - \beta)b_{t-1}$$`,
        p: r`$l_t$ tracks the local level, $b_t$ tracks local slope (trend), and $\beta \in (0, 1)$ governs the adaptation rate of the trend. Forecasts $h$ steps ahead extrapolate linearly: $\hat{y}_{t+h|t} = l_t + h b_t$. Damped trends multiply $b_t$ by damping factor $\phi \in (0, 1)$ to prevent unrealistic long-horizon divergence.`,
      },
      {
        h: 'The state-space innovations model: ETS(A, A, N)',
        tex: r`$$y_t = l_{t-1} + b_{t-1} + \epsilon_t, \quad l_t = l_{t-1} + b_{t-1} + \alpha\epsilon_t, \quad b_t = b_{t-1} + \alpha\beta\epsilon_t$$`,
        p: r`Writing exponential smoothing in state-space form with a single innovation source $\epsilon_t \sim \mathcal{N}(0, \sigma^2)$ defines a joint probability density over the observations. This allows maximum likelihood estimation, information-criterion model selection (AIC, BIC), and exact prediction interval derivations.`,
      },
    ],
    keyPoints: [
      r`Weights decay geometrically: past observation $y_{t-k}$ carries weight $\alpha(1-\alpha)^k$, ensuring all historical data contributes while recent data dominates.`,
      r`Damped trend specifications ($\phi \in [0.8, 0.98]$) guard against overly aggressive linear trend extrapolations in long-range forecasting.`,
      r`Multiplicative error models explicitly accommodate heteroscedasticity where forecast uncertainty scales in proportion to series magnitude.`,
      r`ETS models focus on trend, level, and seasonal states; unlike ARIMA, they do not explicitly parameterise stationary cyclical autocorrelations.`,
    ],
    pitfalls: [
      r`Selecting smoothing parameters outside permissible stability bounds, which causes state updates to oscillate unstably or diverge.`,
      r`Unconstrained linear trend extrapolation: projecting undamped linear trends into distant horizons often yields implausibly massive forecasts.`,
      r`Using additive seasonality when seasonal amplitude expands proportionally with the series level: multiplicative seasonality ($\text{ETS}(\cdot, \cdot, M)$) is required.`,
      r`Confusing simple moving averages with exponential smoothing: moving averages have a finite rectangular memory, whereas exponential smoothing has an infinite decaying memory.`,
    ],
    code: r`import numpy as np

np.random.seed(42)
n = 100
# Synthesise time series with shifting level and noise
level = 50.0 + np.cumsum(np.random.normal(0, 0.5, n))
y = level + np.random.normal(0, 1.5, n)

def ses_fit(y_series, alpha):
    n_pts = len(y_series)
    l = np.zeros(n_pts)
    l[0] = y_series[0]
    for t in range(1, n_pts):
        l[t] = alpha * y_series[t-1] + (1 - alpha) * l[t-1]
    errors = y_series[1:] - l[1:]
    return l, errors

# Optimise alpha over grid [0.05, 0.95] by minimising sum of squared errors
alphas = np.linspace(0.05, 0.95, 91)
best_alpha, best_sse = None, float('inf')
for a in alphas:
    _, errs = ses_fit(y, a)
    sse = np.sum(errs**2)
    if sse < best_sse:
        best_sse, best_alpha = sse, a

opt_l, opt_errs = ses_fit(y, best_alpha)
rmse = np.sqrt(np.mean(opt_errs**2))
final_level = best_alpha * y[-1] + (1 - best_alpha) * opt_l[-1]
forecast_h = [final_level] * 3

print("Optimal alpha:", round(float(best_alpha), 3))
print("In-sample RMSE:", round(float(rmse), 3))
print("Last observed y:", round(float(y[-1]), 2))
print("Estimated final level:", round(float(final_level), 2))
print("3-step ahead forecasts:", [round(float(f), 2) for f in forecast_h])`,
    quiz: [
      {
        q: r`In Simple Exponential Smoothing, how do the weights assigned to past observations behave as we look further back in time?`,
        o: [
          r`They decay geometrically at rate $(1 - \alpha)^k$`,
          r`They remain completely constant up to window length $k$ and then drop to zero`,
          r`They increase linearly with age`,
          r`They oscillate periodically between positive and negative values`,
        ],
        a: 0,
        why: r`Expanding the recursive formula shows that observation $y_{t-k}$ receives weight $\alpha(1-\alpha)^k$, decaying smoothly and geometrically as lag $k$ increases.`,
      },
      {
        q: r`When should multiplicative seasonality be chosen over additive seasonality in the ETS framework?`,
        o: [
          r`When the series contains negative values only`,
          r`When the seasonal period $s$ is strictly less than 4`,
          r`When seasonal swings expand in amplitude as the overall level of the time series rises`,
          r`When all smoothing parameters are set to 1.0`,
        ],
        a: 2,
        why: r`Additive seasonality assumes seasonal fluctuations have constant magnitude regardless of series level, whereas multiplicative seasonality scales seasonal swings proportionally to the local level.`,
      },
      {
        q: r`What is the primary benefit of formulating exponential smoothing as a state-space innovations model in ETS?`,
        o: [
          r`It eliminates the need for historical training data`,
          r`It guarantees that forecast errors are identically zero`,
          r`It restricts all smoothing parameters to equal exactly 0.5`,
          r`It provides an exact statistical likelihood for automated model selection via AIC and derives analytical prediction intervals`,
        ],
        a: 3,
        why: r`The state-space innovations formulation defines an exact probability distribution for the series, enabling maximum likelihood estimation, AIC/BIC comparison, and formal probabilistic forecast intervals.`,
      },
      {
        q: r`Why is trend damping ($\phi < 1$) frequently introduced into Holt’s linear trend method?`,
        o: [
          r`To force the trend to reverse direction after every step`,
          r`To prevent unrealistic and unbounded linear trend extrapolation over long forecast horizons`,
          r`To convert the series into white noise`,
          r`To eliminate the need for estimating the level parameter $\alpha$`,
        ],
        a: 1,
        why: r`Linear trends tend to produce overly extreme projections on distant horizons; damping factor $\phi \in (0.8, 0.98)$ gradually flattens the trend toward a constant horizon level.`,
      },
    ],
    usedBy: [],
    prereq: ['stationarity-acf-and-pacf', 'expectation-variance-and-covariance'],
    related: ['arima-and-sarima', 'stationarity-acf-and-pacf', 'regression-metrics'],
    keywords: 'exponential smoothing ets holt winters state space forecasting trend seasonal level damping',
  },
  {
    id: "state-space-models-and-the-kalman-filter",
    short: "Kalman filter",
    title: "State-Space Models and the Kalman Filter",
    task: "concepts",
    module: "Time series and survival",
    level: 3,
    minutes: 18,
    noLab: true,
    summary: "Track hidden dynamical states from noisy sequential observations: understand linear Gaussian state-space systems, the two-phase Predict–Update recursion, and optimal Kalman gain.",
    lead: "Whether tracking satellite orbits, estimating vehicle velocity from GPS, or forecasting latent macroeconomic trends, real-world signals are obscured by measurement noise. The Kalman filter recursively computes the exact minimum mean squared error Bayesian estimate of hidden states.",
    intuition: [
      "A state-space model represents a dynamical system across time using two core components: a hidden state vector $x_t$ that evolves dynamically according to physical laws or autoregressive processes, and an observed measurement vector $y_t$ that reflects noisy, incomplete linear projections of that hidden state. The transition equation $x_t = F_t x_{t-1} + B_t u_t + w_t$ governs state progression with process noise $w_t \\sim \\mathcal{N}(0, Q_t)$, while the measurement equation $y_t = H_t x_t + v_t$ captures observations subject to sensor noise $v_t \\sim \\mathcal{N}(0, R_t)$.",
      "The challenge is that neither process dynamics nor sensor readings are immaculate. If you rely solely on forward physics (process model), errors accumulate unbounded over time. If you rely solely on instantaneous sensor measurements, high-frequency measurement noise corrupts estimates. The Kalman filter provides the mathematically optimal fusion: it combines the dynamical prediction with the incoming sensor measurement, weighting each strictly in proportion to their relative inverse uncertainties.",
      "The filter operates as a two-phase recursive algorithm: Predict and Update. In the Predict phase, the state estimate and error covariance are projected forward one step in time using system dynamics $F_t$ and process noise $Q_t$. In the Update phase, an incoming measurement $y_t$ is compared against predicted observation $H_t \\hat{x}_{t \\mid t-1}$ to form the innovation (or measurement residual) $\\tilde{y}_t$. The Kalman gain $K_t$ balances prior uncertainty $P_{t \\mid t-1}$ against measurement noise $R_t$, steering the posterior state estimate toward whichever source is cleaner.",
      "Under linear dynamics and Gaussian noise distributions, the Kalman filter is the exact optimal Bayesian posterior estimator, producing the exact conditional mean and covariance at every time step. Even when noise distributions are non-Gaussian, the Kalman filter remains the Best Linear Unbiased Estimator (BLUE)."
    ],
    analogy: "Imagine steering a yacht through thick coastal fog at midnight. Your nautical dead-reckoning equations predict your position based on compass heading and engine throttle (the dynamic state prediction), but sea currents steadily drift your vessel off course (process noise). Every five minutes, a lighthouse flash briefly illuminates a shoreline buoy (noisy sensor measurement). The Kalman filter is the seasoned navigator who compares the dead-reckoning position against the momentary glimpse of the buoy, shifting the helm by an optimal correction that yields the most accurate position on the chart.",
    steps: [
      {
        "title": "1. Model state dynamics and sensor geometry",
        "body": "Formulate state vector $x_t$ (e.g. $[position, velocity]^T$), state transition matrix $F$, process noise covariance $Q$, measurement matrix $H$, and measurement noise covariance $R$."
      },
      {
        "title": "2. Time update: predict state and covariance",
        "body": "Project state ahead: $\\hat{x}_{t \\mid t-1} = F_t \\hat{x}_{t-1 \\mid t-1} + B_t u_t$. Project error covariance ahead: $P_{t \\mid t-1} = F_t P_{t-1 \\mid t-1} F_t^T + Q_t$."
      },
      {
        "title": "3. Measurement update: compute innovation and Kalman gain",
        "body": "Compute measurement innovation $\\tilde{y}_t = y_t - H_t \\hat{x}_{t \\mid t-1}$ and innovation covariance $S_t = H_t P_{t \\mid t-1} H_t^T + R_t$. Calculate optimal Kalman gain: $K_t = P_{t \\mid t-1} H_t^T S_t^{-1}$."
      },
      {
        "title": "4. Correct state estimate and refine covariance",
        "body": "Update posterior state: $\\hat{x}_{t \\mid t} = \\hat{x}_{t \\mid t-1} + K_t \\tilde{y}_t$. Refine posterior error covariance: $P_{t \\mid t} = (I - K_t H_t) P_{t \\mid t-1}$. Repeat for every incoming observation."
      }
    ],
    math: [
      {
        "h": "State-Space Formulation",
        "tex": "x_t = F_t x_{t-1} + B_t u_t + w_t, \\quad y_t = H_t x_t + v_t, \\quad w_t \\sim \\mathcal{N}(0, Q_t), \\; v_t \\sim \\mathcal{N}(0, R_t)",
        "p": "Linear Gaussian state-space model relating unobserved hidden state x_t to observable measurements y_t via transition matrix F_t and observation matrix H_t."
      },
      {
        "h": "Predict Step (Prior Distribution)",
        "tex": "\\hat{x}_{t \\mid t-1} = F_t \\hat{x}_{t-1 \\mid t-1}, \\quad P_{t \\mid t-1} = F_t P_{t-1 \\mid t-1} F_t^T + Q_t",
        "p": "Extrapolates state mean and covariance forward in time prior to incorporating measurement at step t, compounding existing uncertainty with process noise Q_t."
      },
      {
        "h": "Update Step (Kalman Gain and Posterior)",
        "tex": "K_t = P_{t \\mid t-1} H_t^T (H_t P_{t \\mid t-1} H_t^T + R_t)^{-1}, \\quad \\hat{x}_{t \\mid t} = \\hat{x}_{t \\mid t-1} + K_t (y_t - H_t \\hat{x}_{t \\mid t-1})",
        "p": "Kalman gain K_t minimises the trace of posterior covariance matrix P_{t|t}. When sensor noise R_t is small, K_t approaches H^{-1} trusting measurement; when R_t is massive, K_t approaches 0 trusting prediction."
      }
    ],
    code: "import numpy as np\n\n# 1D Kinematic Tracking: Position and Velocity\n# True physics: constant velocity with random acceleration shocks\nnp.random.seed(42)\ndt = 0.1\nn_steps = 100\n\n# State transition matrix F: [position, velocity]^T\nF = np.array([[1.0, dt],\n              [0.0, 1.0]])\n\n# Measurement matrix H: observe position only\nH = np.array([[1.0, 0.0]])\n\n# Noise covariances\nq_var = 0.1   # Process noise acceleration variance\nQ = np.array([[0.25 * dt**4, 0.5 * dt**3],\n              [0.5 * dt**3, dt**2]]) * q_var\nr_var = 4.0   # Measurement noise variance (noisy sensor)\nR = np.array([[r_var]])\n\n# Simulate true trajectory and noisy measurements\ntrue_state = np.array([0.0, 5.0])  # Initial: pos=0m, vel=5m/s\ntrue_positions = []\nnoisy_measurements = []\n\nfor _ in range(n_steps):\n    process_shock = np.random.multivariate_normal([0, 0], Q)\n    true_state = F @ true_state + process_shock\n    sensor_noise = np.random.normal(0, np.sqrt(r_var))\n    measurement = H @ true_state + sensor_noise\n    \n    true_positions.append(true_state[0])\n    noisy_measurements.append(measurement[0])\n\n# Kalman Filter Estimation\nx_hat = np.array([0.0, 0.0])       # Initial estimate\nP = np.array([[10.0, 0.0],\n              [0.0, 10.0]])        # High initial uncertainty\n\nestimated_positions = []\nestimated_velocities = []\n\nfor y_t in noisy_measurements:\n    # --- Predict Step ---\n    x_pred = F @ x_hat\n    P_pred = F @ P @ F.T + Q\n    \n    # --- Update Step ---\n    y_meas = np.array([y_t])\n    innovation = y_meas - H @ x_pred\n    S = H @ P_pred @ H.T + R\n    K = P_pred @ H.T @ np.linalg.inv(S)\n    \n    x_hat = x_pred + K @ innovation\n    P = (np.eye(2) - K @ H) @ P_pred\n    \n    estimated_positions.append(x_hat[0])\n    estimated_velocities.append(x_hat[1])\n\n# Calculate Root Mean Squared Errors\nrmse_noisy = np.sqrt(np.mean((np.array(noisy_measurements) - np.array(true_positions))**2))\nrmse_kalman = np.sqrt(np.mean((np.array(estimated_positions) - np.array(true_positions))**2))\n\nprint(f\"Raw measurement position RMSE: {rmse_noisy:.3f} m\")\nprint(f\"Kalman filtered position RMSE: {rmse_kalman:.3f} m\")\nprint(f\"Noise reduction: {(1 - rmse_kalman / rmse_noisy) * 100:.1f}%\")\nprint(f\"Final velocity estimate: {estimated_velocities[-1]:.3f} m/s (true: {true_state[1]:.3f} m/s)\")",
    keyPoints: [
      "Recursive online Bayesian estimator: processes observations sequentially without needing to store past history.",
      "Optimal under Gaussian noise: minimises Mean Squared Error (MMSE) across all estimators for linear Gaussian models.",
      "BLUE under non-Gaussian noise: Best Linear Unbiased Estimator even when noise distributions deviate from Gaussianity.",
      "The Kalman gain K_t dynamically balances model prediction against sensor noise based on their relative covariances.",
      "Forms the foundation for non-linear state estimation: Extended Kalman Filter (EKF via Jacobians) and Unscented Kalman Filter (UKF via sigma points)."
    ],
    pitfalls: [
      "Filter divergence from mis-specified process noise Q: Setting Q unrealistically small causes the filter to overconfidently disregard new measurements, diverging from the true trajectory when accelerations or shocks occur.",
      "Numerical instability in covariance update: Repeated subtractions in P_{t|t} = (I - K_t H_t) P_{t|t-1} can lose positive semi-definiteness due to floating-point rounding; Joseph form (I - KH)P(I - KH)^T + KRK^T or square-root Cholesky filtering ensures numerical stability.",
      "Non-linear dynamics breakdown: Standard Kalman filtering requires strictly linear F and H; applying it directly to non-linear systems leads to catastrophic divergence."
    ],
    quiz: [
      {
        "q": "What occurs to the Kalman gain K_t as the measurement noise covariance R_t approaches infinity?",
        "o": [
          "K_t approaches 0, and the filter relies entirely on its dynamic state prediction",
          "K_t approaches 1, and the filter trusts only the sensor measurement",
          "The filter covariance P_t diverges to infinity immediately",
          "The state estimate oscillates sinusoidally"
        ],
        "a": 0,
        "why": "From K_t = P H^T (H P H^T + R)^{-1}, as R -> infinity the inverse matrix vanishes toward zero, driving K_t -> 0. Consequently x_hat = x_pred + 0 = x_pred, ignoring useless sensor data."
      },
      {
        "q": "Why is the Kalman filter preferred over full batch historical smoothing for real-time robotic navigation?",
        "o": [
          "The Kalman filter is recursive and requires only the latest estimate and covariance, using O(1) memory per step",
          "The Kalman filter requires inversion of an N x N matrix spanning all time steps",
          "The Kalman filter does not require knowledge of measurement noise",
          "The Kalman filter works only when offline batch data is fully available"
        ],
        "a": 0,
        "why": "Because it is Markovian and recursive, the Kalman filter updates state estimates in constant O(1) time and memory per observation, making it ideal for online real-time embedded systems."
      }
    ],
    usedBy: [],
    prereq: [
      "expectation-variance-and-covariance",
      "ols-inference-t-tests-f-test-r2-and-adjusted-r2"
    ],
    related: [
      "stationarity-acf-and-pacf",
      "arima-and-sarima",
      "exponential-smoothing-ets",
      "markov-chains-and-stationary-distributions"
    ],
    keywords: "kalman filter, state space model, hidden state, process noise, measurement noise, kalman gain, innovation, blue estimator"
  },
  {
    id: "survival-analysis-kaplan-meier-and-cox",
    short: "Survival analysis",
    title: "Survival Analysis: Kaplan–Meier and Cox Proportional Hazards",
    task: "concepts",
    module: "Time series and survival",
    level: 2,
    minutes: 18,
    noLab: true,
    summary: "Analyse time-to-event outcomes subject to right-censoring: master survival functions, the Kaplan–Meier non-parametric estimator, the log-rank test, and semi-parametric Cox proportional hazards modelling.",
    lead: "Standard regression fails when predicting time-to-event outcomes because unfinished durations are right-censored: customers have not yet churned, machines have not yet failed, and patients remain alive at study conclusion. Survival analysis properly accounts for censored observation windows.",
    intuition: [
      "In many data science problems, the target variable of interest is the time $T \\ge 0$ until an event occurs: customer subscription cancellation (churn), machine component failure, loan default, or clinical relapse. Ordinary regression models encounter a fundamental roadblock: right-censoring. When a customer is still subscribed at the end of a six-month analysis period, their true time-to-churn is unknown—all we know is $T > 6$. Excluding censored cases creates severe survival bias, while treating censored duration as the true event time severely underestimates survival times.",
      "Survival analysis resolves this by modelling two linked mathematical functions: the survival function $S(t) = P(T > t)$, which specifies the probability an individual survives past time $t$, and the hazard function $h(t)$, which quantifies the instantaneous rate of event occurrence at time $t$ conditional on having survived up to time $t$.",
      "The Kaplan–Meier estimator provides the gold-standard non-parametric estimate of the survival curve. At each unique event time $t_i$, it computes the conditional probability of surviving step $t_i$ given the risk set $n_i$ (individuals still alive and uncensored immediately prior to $t_i$): $1 - d_i / n_i$, where $d_i$ is the number of events. The cumulative survival function is the product of these conditional survival probabilities. Greenwood's formula supplies asymptotic standard errors and confidence intervals.",
      "When evaluating the impact of covariates (such as customer tier, contract type, or medical treatment), the Cox Proportional Hazards model provides an elegant semi-parametric regression framework: $h(t \\mid x) = h_0(t) \\exp(\\beta^T x)$. Here, $h_0(t)$ is an arbitrary baseline hazard function that requires no parametric assumptions, while the hazard ratio $\\exp(\\beta_j)$ quantifies the multiplicative increase in instantaneous risk associated with a unit increase in covariate $x_j$. The coefficients $\\beta$ are estimated via Cox's partial likelihood without needing to specify $h_0(t)$."
    ],
    analogy: "Imagine tracking the lifespan of lightbulbs in an office tower over a 12-month study. Some bulbs burn out after 3 months (uncensored events). But at month 12, hundreds of bulbs are still burning bright (right-censored). If you average only the burned-out bulbs, you calculate an artificially dismal lifespan. The Kaplan–Meier estimator treats each burnout as an event against the pool of currently glowing bulbs, accurately charting survival probabilities out to 12 months without discarding surviving bulbs.",
    steps: [
      {
        "title": "1. Structure time and censoring indicators",
        "body": "Represent each individual by duration $T_i$ and event indicator $\\delta_i \\in \\{0, 1\\}$, where $\\delta_i = 1$ denotes observed event and $\\delta_i = 0$ denotes right-censoring."
      },
      {
        "title": "2. Compute Kaplan–Meier non-parametric survival curve",
        "body": "Sort unique event times $t_1 < t_2 < \\dots < t_k$. At each $t_i$, calculate risk set size $n_i$ and event count $d_i$. Evaluate $\\hat{S}(t) = \\prod_{t_i \\le t} (1 - d_i/n_i)$."
      },
      {
        "title": "3. Compare cohorts using the log-rank test",
        "body": "Test the null hypothesis that survival curves across groups are identical: compare observed vs expected events at each event time using a chi-square test statistic."
      },
      {
        "title": "4. Fit Cox proportional hazards model via partial likelihood",
        "body": "Fit $h(t \\mid x) = h_0(t) \\exp(\\beta^T x)$ by maximising Cox's partial likelihood $L(\\beta) = \\prod_{i: \\delta_i=1} \\frac{\\exp(\\beta^T x_i)}{\\sum_{j \\in R(t_i)} \\exp(\\beta^T x_j)}$. Interpret exponentiated coefficients $\\exp(\\beta_j)$ as hazard ratios."
      }
    ],
    math: [
      {
        "h": "Survival and Hazard Relationships",
        "tex": "S(t) = P(T > t) = \\exp\\left(-\\int_0^t h(u) du\\right) = \\exp(-H(t)), \\quad h(t) = \\lim_{\\Delta t \\to 0} \\frac{P(t \\le T < t + \\Delta t \\mid T \\ge t)}{\\Delta t} = -\\frac{S'(t)}{S(t)}",
        "p": "The survival function S(t) and hazard function h(t) are mathematically dual: hazard is the negative derivative of log survival, and cumulative hazard H(t) integrates hazard over time."
      },
      {
        "h": "Kaplan–Meier Estimator and Greenwood Formula",
        "tex": "\\hat{S}(t) = \\prod_{t_i \\le t} \\left(1 - \\frac{d_i}{n_i}\\right), \\quad \\widehat{\\operatorname{Var}}(\\hat{S}(t)) = \\hat{S}(t)^2 \\sum_{t_i \\le t} \\frac{d_i}{n_i (n_i - d_i)}",
        "p": "Product-limit estimator accumulating survival rates over observed failure times. Greenwood formula yields standard error used to construct pointwise confidence intervals."
      },
      {
        "h": "Cox Proportional Hazards and Partial Likelihood",
        "tex": "h(t \\mid x) = h_0(t) \\exp(\\beta^T x), \\quad L(\\beta) = \\prod_{i=1}^k \\frac{\\exp(\\beta^T x_{(i)})}{\\sum_{j \\in R(t_{(i)})} \\exp(\\beta^T x_j)}",
        "p": "Baseline hazard h_0(t) cancels completely out of the partial likelihood, allowing estimation of covariate effect coefficients beta without making parametric distributional assumptions about event times."
      }
    ],
    code: "import numpy as np\n\n# Kaplan-Meier Estimator and Cox Partial Likelihood from Scratch\nnp.random.seed(42)\nn_samples = 200\n\n# Synthetic customer churn data\n# Covariate x: premium subscription tier (1 = premium, 0 = standard)\ntier = np.random.binomial(1, 0.4, size=n_samples)\n# True baseline hazard: exponential survival, premium reduces hazard by half (beta = -0.693)\ntrue_beta = -0.7\nhazard = 0.05 * np.exp(true_beta * tier)\ntrue_survival_time = np.random.exponential(1.0 / hazard)\n\n# Study ends at month 24: right-censoring\nstudy_duration = 24.0\nobserved_time = np.minimum(true_survival_time, study_duration)\nevent_occurred = (true_survival_time <= study_duration).astype(int)\n\n# --- Kaplan-Meier Estimation Function ---\ndef kaplan_meier(durations, events):\n    unique_times = np.sort(np.unique(durations[events == 1]))\n    s_t = 1.0\n    km_table = []\n    \n    for t in unique_times:\n        n_at_risk = np.sum(durations >= t)\n        d_events = np.sum((durations == t) & (events == 1))\n        s_t *= (1.0 - d_events / n_at_risk)\n        km_table.append((t, n_at_risk, d_events, s_t))\n    return km_table\n\nkm_standard = kaplan_meier(observed_time[tier == 0], event_occurred[tier == 0])\nkm_premium = kaplan_meier(observed_time[tier == 1], event_occurred[tier == 1])\n\n# --- Cox Proportional Hazards Partial Likelihood ---\ndef cox_log_partial_likelihood(beta, x, time, event):\n    # Sort events in descending order\n    order = np.argsort(time)[::-1]\n    sorted_time = time[order]\n    sorted_event = event[order]\n    sorted_x = x[order]\n    \n    log_lik = 0.0\n    risk_sum = 0.0\n    for i in range(len(sorted_time)):\n        risk_sum += np.exp(beta * sorted_x[i])\n        if sorted_event[i] == 1:\n            log_lik += beta * sorted_x[i] - np.log(risk_sum)\n    return log_lik\n\n# Grid search for maximum partial likelihood estimate beta\nbetas = np.linspace(-1.5, 0.5, 201)\nlog_liks = [cox_log_partial_likelihood(b, tier, observed_time, event_occurred) for b in betas]\nopt_beta = betas[np.argmax(log_liks)]\nhazard_ratio = np.exp(opt_beta)\n\nprint(f\"Censored observations: {np.sum(event_occurred == 0)} / {n_samples} ({np.mean(event_occurred == 0)*100:.1f}%)\")\nprint(f\"Estimated Cox beta: {opt_beta:.3f} (true beta: {true_beta:.3f})\")\nprint(f\"Estimated Hazard Ratio: {hazard_ratio:.3f} (premium customers have {(1 - hazard_ratio)*100:.1f}% lower churn hazard)\")\nprint(f\"Standard tier 12-month survival: {[s for t, n, d, s in km_standard if t <= 12][-1]:.3f}\")\nprint(f\"Premium tier 12-month survival:  {[s for t, n, d, s in km_premium if t <= 12][-1]:.3f}\")",
    keyPoints: [
      "Right-censoring occurs when an observation window ends before an event takes place; standard regression creates severe survival bias if censoring is neglected.",
      "Survival function S(t) = P(T > t) gives the probability of surviving past t; hazard function h(t) gives the instantaneous event rate conditional on prior survival.",
      "The Kaplan–Meier product-limit estimator provides an exact non-parametric step function estimate of S(t) with Greenwood confidence bands.",
      "The log-rank test evaluates whether two or more survival curves differ significantly under a non-parametric null hypothesis.",
      "Cox proportional hazards model is semi-parametric: it estimates hazard ratios exp(beta) via partial likelihood without specifying the baseline hazard h_0(t)."
    ],
    pitfalls: [
      "Treating censored observations as event occurrences or dropping them entirely: Dropping censored data removes the longest-lived subjects, skewing average duration downwards.",
      "Violation of proportional hazards assumption: Cox models assume hazard ratios exp(beta) remain constant across all time; if a treatment effect decays or inverts over time, the model is mis-specified and needs time-varying covariates or stratification.",
      "Informative censoring: Survival analysis assumes censoring is non-informative (unrelated to the event probability); if high-risk subjects selectively drop out of a study, estimates become biased."
    ],
    quiz: [
      {
        "q": "Why does calculating mean time-to-event via standard linear regression produce biased estimates in right-censored studies?",
        "o": [
          "Because censored subjects have unknown future event times, and ignoring them removes long survivors while treating duration as event time underestimates survival",
          "Because linear regression cannot handle continuous dependent variables",
          "Because the survival function is always strictly greater than 1",
          "Because censored data implies that the variance of the error terms is exactly zero"
        ],
        "a": 0,
        "why": "Right-censoring means event time is strictly greater than study duration. Dropping censored subjects induces survival bias (discards long lifespans), while treating censored time as event time truncates true lifespan downwards."
      },
      {
        "q": "In a Cox proportional hazards model, what does an estimated hazard ratio exp(beta_j) = 0.65 for a drug treatment indicate?",
        "o": [
          "Treated patients experience an instantaneous event risk that is 35% lower than untreated patients at any point in time",
          "Treated patients live exactly 65% longer in total days",
          "65% of patients in the treatment group were cured completely",
          "The hazard increases by 65% per unit increase in drug dosage"
        ],
        "a": 0,
        "why": "A hazard ratio of 0.65 represents a multiplicative scaling of the baseline hazard h(t|x) = h_0(t) * 0.65, meaning event hazard is reduced by 1 - 0.65 = 35% relative to the reference group."
      }
    ],
    usedBy: [],
    prereq: [
      "hypothesis-testing-and-p-values",
      "ols-inference-t-tests-f-test-r2-and-adjusted-r2"
    ],
    related: [
      "stationarity-acf-and-pacf",
      "logistic-regression-inference-odds-ratios-wald-tests",
      "state-space-models-and-the-kalman-filter"
    ],
    keywords: "survival analysis, kaplan meier, cox proportional hazards, right censoring, hazard ratio, log rank test, greenwood formula, time to event"
  },
];
