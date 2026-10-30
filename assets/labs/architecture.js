// Interactive architecture diagrams. Every part of the network is a hotspot: hover (mouse),
// tap (touch) or focus (keyboard) to open its explanation card below the diagram.
(function (root) {
  'use strict';
  const { T, alpha } = root.Lab;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // a small inline picture used inside some info cards
  const strideSVG = `<svg viewBox="0 0 260 74" class="arch-mini" aria-hidden="true">
    ${[0, 1].map(r => `<g transform="translate(${r * 132},0)">
      <text x="2" y="10" fill="${T.muted}" font-size="10" font-family="DM Mono, monospace">stride ${r + 1}</text>
      ${Array.from({ length: 7 }, (_, i) => `<rect x="${2 + i * 16}" y="18" width="14" height="14" rx="2" fill="rgba(255,255,255,0.06)"/>`).join('')}
      ${(r ? [0, 2, 4] : [0, 1, 2, 3, 4]).map((p, j, arr) => `<rect x="${1 + p * 16}" y="${36 + (r ? 0 : 0)}" width="46" height="14" rx="3" fill="none" stroke="${T.amber}" stroke-opacity="${0.35 + 0.65 * (j / (arr.length - 1 || 1))}" transform="translate(0,${j * 6})"/>`).join('')}
    </g>`).join('')}
  </svg>`;
  const paddingSVG = `<svg viewBox="0 0 260 90" class="arch-mini" aria-hidden="true">
    ${[0, 1].map(r => `<g transform="translate(${r * 132},0)">
      <text x="2" y="10" fill="${T.muted}" font-size="10" font-family="DM Mono, monospace">${r ? 'same (pad 1): 5 → 5' : 'valid (no pad): 5 → 3'}</text>
      ${Array.from({ length: r ? 7 : 5 }, (_, i) => Array.from({ length: r ? 7 : 5 }, (_, j) => {
        const border = r && (i === 0 || j === 0 || i === 6 || j === 6);
        return `<rect x="${2 + j * 10}" y="${18 + i * 10}" width="9" height="9" rx="1.5" fill="${border ? 'rgba(255,255,255,0.03)' : alpha(T.violet2, 0.45)}" stroke="${border ? 'rgba(255,255,255,0.18)' : 'none'}" stroke-dasharray="2 2"/>`;
      }).join('')).join('')}
      <rect x="1" y="17" width="31" height="31" rx="3" fill="none" stroke="${T.amber}" stroke-width="1.4"/>
    </g>`).join('')}
  </svg>`;

  // ------------------------------------------------------------------ CNN for 28x28 digits
  const CNN = {
    title: 'A small CNN for handwritten digits',
    total: '207,214 parameters (206,922 without the optional attention block)',
    items: [
      { id: 'input', kind: 'input', label: 'Input', shape: '28×28×1', color: T.violet2, w: 70, h: 70, d: 4,
        info: { title: 'Input image', tag: 'Data', io: '28 × 28 × 1', params: '0',
          body: 'A grayscale handwritten digit: 28 pixels tall, 28 wide, 1 channel. Every pixel is a brightness number, usually scaled from 0–255 down to 0–1 before training.',
          more: 'A colour photo would be H × W × <strong>3</strong> (red, green, blue). The network never sees “a 7”: only this grid of 784 numbers.' } },
      { id: 'conv1', kind: 'block', label: 'Conv 1', shape: '28×28×16', color: T.cyan, w: 70, h: 70, d: 30,
        badges: [['kernel', '3×3 kernel'], ['stride', 'stride 1'], ['padding', 'pad same']],
        info: { title: 'Convolution layer 1', tag: 'Conv2d(1 → 16, kernel 3×3)', io: '28×28×1 → 28×28×16', params: '160 = (3·3·1 + 1) × 16',
          body: 'Sixteen small filters slide across the image. At every position each filter multiplies a 3×3 patch by its 9 weights, adds them up plus a bias, and writes one number. One filter → one feature map; sixteen filters → sixteen maps stacked as channels.',
          more: 'The filters start as random numbers and are learned by backpropagation. In a first layer they usually become edge, stroke and blob detectors.' } },
      { id: 'relu1', kind: 'op', label: 'ReLU', color: T.amber, info: 'relu' },
      { id: 'pool1', kind: 'block', label: 'Max pool', shape: '14×14×16', color: T.green, w: 46, h: 46, d: 30,
        badges: [['poolstride', '2×2, stride 2']],
        info: { title: 'Max pooling 2×2', tag: 'MaxPool2d(2)', io: '28×28×16 → 14×14×16', params: '0 (nothing to learn)',
          body: 'Looks at each 2×2 window of every feature map and keeps only the largest value. Height and width are halved; the number of channels stays the same.',
          more: 'It keeps the strongest evidence (“there is an edge somewhere here”) and makes the network a little tolerant to small shifts. Average pooling takes the mean instead; some modern networks use a stride-2 convolution in place of pooling.' } },
      { id: 'conv2', kind: 'block', label: 'Conv 2', shape: '14×14×32', color: T.cyan, w: 46, h: 46, d: 48,
        badges: [['kernel', '3×3 kernel']],
        info: { title: 'Convolution layer 2', tag: 'Conv2d(16 → 32, kernel 3×3)', io: '14×14×16 → 14×14×32', params: '4,640 = (3·3·16 + 1) × 32',
          body: 'Each of the 32 filters is now 3×3×<strong>16</strong>: one 3×3 slice per input channel. It looks at all sixteen edge maps at once and combines them into something richer: corners, curves, stroke endings.',
          more: 'A neuron here sees a 3×3 window of layer-1 maps, which already summarise pooled regions of the image, so its <strong>receptive field</strong> on the original digit is about 8×8 pixels. Depth = larger view.' } },
      { id: 'relu2', kind: 'op', label: 'ReLU', color: T.amber, info: 'relu' },
      { id: 'pool2', kind: 'block', label: 'Max pool', shape: '7×7×32', color: T.green, w: 30, h: 30, d: 48,
        badges: [['poolstride', '2×2, stride 2']],
        info: { title: 'Max pooling 2×2', tag: 'MaxPool2d(2)', io: '14×14×32 → 7×7×32', params: '0',
          body: 'Halves the maps again. After two pool layers each of the 7×7 positions summarises a 4×4 region of the original image.',
          more: 'Spatial size shrinks (28 → 14 → 7) while the number of channels grows (1 → 16 → 32): the network trades “where” for “what”.' } },
      { id: 'attn', kind: 'attn', label: 'Attention', shape: 'optional', color: T.pink,
        info: { title: 'Channel attention (optional)', tag: 'Squeeze-and-Excitation block', io: '7×7×32 → 7×7×32', params: '292 (32 → 4 → 32)',
          body: 'Not part of a classic CNN, but common in modern ones (SE-Net, EfficientNet, CBAM). It <strong>squeezes</strong> each of the 32 channels to one number by averaging, passes those 32 numbers through a tiny two-layer network, and outputs a weight between 0 and 1 per channel. Every feature map is then multiplied by its weight.',
          more: 'So, for this particular image, the network can turn up the useful channels and turn down the noisy ones. Spatial attention (in CBAM) does the same per location. Vision Transformers go further and replace convolution with self-attention between image patches.' } },
      { id: 'flatten', kind: 'vec', label: 'Flatten', shape: '1,568', color: T.violet2, h: 110,
        info: { title: 'Flatten', tag: 'reshape', io: '7×7×32 → 1,568', params: '0',
          body: 'Unrolls the 3-D block of numbers into one long vector (7 × 7 × 32 = 1,568) so an ordinary dense layer can read it.',
          more: 'Many modern CNNs use <strong>global average pooling</strong> here instead: one average per channel (32 numbers), which removes most of the weights in the next layer.' } },
      { id: 'dense', kind: 'nodes', label: 'Dense', shape: '128', color: T.violet, h: 110,
        info: { title: 'Fully connected layer', tag: 'Linear(1568 → 128) + ReLU', io: '1,568 → 128', params: '200,832 = 1,568 × 128 + 128',
          body: 'Every one of the 1,568 inputs connects to every one of 128 neurons. This is where evidence from all over the image is combined: “a horizontal stroke at the top and a diagonal below” → probably a 7.',
          more: 'This single layer holds about 97% of all the weights in this network, which is exactly why global average pooling became popular.' } },
      { id: 'output', kind: 'out', label: 'Softmax', shape: '10 classes', color: T.amber, h: 110,
        info: { title: 'Output layer + softmax', tag: 'Linear(128 → 10) + softmax', io: '128 → 10', params: '1,290 = 128 × 10 + 10',
          body: 'One score (a logit) per digit 0–9. Softmax turns the ten scores into probabilities that are positive and add up to 1; the prediction is the most probable class.',
          more: 'During training, cross-entropy loss compares these probabilities with the true label, and its gradient flows back through every layer to adjust all 207k weights.' } },
    ],
    extra: {
      relu: { title: 'ReLU activation', tag: 'max(0, x), applied to every value', io: 'same shape in and out', params: '0',
        body: 'Replaces every negative number with zero and leaves positive numbers alone. A feature map then only says where a pattern <em>is</em>, not where its opposite is.',
        more: 'Without a non-linearity, two convolution layers in a row would collapse into one bigger linear filter, and depth would add nothing.' },
      kernel: { title: 'Kernel (filter) size', tag: 'hyperparameter', io: '3 × 3 here', params: 'weights per filter = k × k × input channels',
        body: 'How large a patch each filter looks at. 3×3 is the modern default.',
        more: 'Two stacked 3×3 layers see a 5×5 area with 18 weights per channel; a single 5×5 layer needs 25, and has one non-linearity fewer.' },
      stride: { title: 'Stride', tag: 'hyperparameter', io: 'output = ⌊(n + 2p − k) / s⌋ + 1', params: 'here: (28 + 2 − 3) / 1 + 1 = 28',
        body: 'How many pixels the filter moves between positions. Stride 1 visits every position; stride 2 skips every other one, so the output is about half as wide and half as tall.',
        more: strideSVG + '<br>Larger strides are a cheap way to downsample, at the cost of detail.' },
      padding: { title: 'Padding', tag: 'hyperparameter', io: '“same”: 1 pixel of zeros for a 3×3 kernel', params: 'here: output stays 28 × 28',
        body: 'Extra zeros added around the border so the filter can also sit on edge pixels. With “same” padding the output keeps the input size; with “valid” (no padding) a 3×3 kernel shrinks each side by 2.',
        more: paddingSVG + '<br>Without padding, pixels at the border are seen by fewer filter positions and the maps shrink layer after layer.' },
      poolstride: { title: 'Pooling window and stride', tag: '2 × 2, stride 2', io: 'halves height and width', params: '0',
        body: 'The pooling window is 2×2 and moves 2 pixels at a time, so windows do not overlap and every value is looked at exactly once.',
        more: 'Overlapping pooling (for example 3×3 with stride 2) was used in AlexNet; non-overlapping 2×2 is the usual choice today.' },
    },
  };


  // ------------------------------------------------------------------ linear regression pipeline (California housing sample)
  const box = (g, x, y, w, h, c, dashed) => el('rect', { x, y, width: w, height: h, rx: 10, fill: alpha(c, 0.12), stroke: c, 'stroke-width': 1.2, 'stroke-dasharray': dashed ? '4 3' : 'none' }, g);
  const txt = (g, x, y, s, cls = 'arch-shape', anchor = 'middle', fill) => { const t = el('text', { x, y, 'text-anchor': anchor, class: cls }, g); if (fill) t.setAttribute('style', `fill:${fill}`); t.textContent = s; return t; };
  const LINREG = {
    title: 'The linear regression workflow, end to end',
    labels: ['At a glance', 'In this fit'],
    total: 'Fitted on 400 rows of the California housing sample · test R² = 0.792 · test RMSE = 0.436 ($100k units)',
    items: [
      { id: 'data', kind: 'custom', label: 'Data', shape: '400 rows × 8 + y', color: T.violet2, w: 78, h: 66,
        badges: [['features', 'features X'], ['target', 'target y']],
        draw: (g, l, t) => { box(g, l, t, 78, 66, T.violet2); for (let i = 0; i < 5; i++) for (let j = 0; j < 6; j++) el('rect', { x: l + 7 + j * 11, y: t + 8 + i * 10.5, width: 9, height: 8, rx: 1.5, fill: j === 5 ? alpha(T.amber, 0.8) : alpha(T.violet2, 0.35 + ((i * 7 + j * 3) % 5) * 0.1) }, g); },
        info: { title: 'The data', tag: 'table: one row per example', io: '400 training rows · 8 numeric features + 1 target', params: '—',
          body: 'Each row is one district: median income, house age, average rooms, bedrooms, population, occupancy, latitude and longitude. The column we want to predict, the <strong>target</strong> y, is the median house value (in $100,000s).',
          more: 'Linear regression needs numeric features. Categories are one-hot encoded first; missing values are imputed. 100 further rows are kept aside as a test set and never used for fitting.' } },
      { id: 'design', kind: 'custom', label: 'Design matrix', shape: '400 × 9', color: T.cyan, w: 70, h: 66,
        badges: [['ones', 'column of 1s'], ['scaling', 'scaling']],
        draw: (g, l, t) => { box(g, l, t, 70, 66, T.cyan); for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) el('rect', { x: l + 7 + j * 11.5, y: t + 8 + i * 10.5, width: 9.5, height: 8, rx: 1.5, fill: j === 0 ? alpha(T.amber, 0.9) : alpha(T.cyan, 0.35) }, g); txt(g, l + 11.5, t + 62, '1', 'arch-small'); },
        info: { title: 'Design matrix X', tag: 'n × (p + 1)', io: '400 × 8 → 400 × 9', params: '—',
          body: 'The features are stacked into a matrix X with one row per example, and a <strong>column of 1s</strong> is added in front. That column lets the model learn an intercept with the same maths as every other weight.',
          more: 'Plain OLS predictions do not change if you rescale features, but scaling makes coefficients comparable and is required once you add a penalty (ridge, lasso).' } },
      { id: 'model', kind: 'custom', label: 'Model', shape: 'ŷ = Xβ', color: T.violet, w: 76, h: 66,
        badges: [['weights', 'weights β'], ['intercept', 'intercept β₀']],
        draw: (g, l, t) => { box(g, l, t, 76, 66, T.violet); txt(g, l + 38, t + 26, 'ŷ = Xβ', 'arch-label'); [0.8, 0.2, 0.5, 0.35, 0.1, 0.6].forEach((v, k) => el('rect', { x: l + 10 + k * 9.5, y: t + 58 - v * 20, width: 6.5, height: v * 20, rx: 1.5, fill: alpha(T.violet2, 0.85) }, g)); },
        info: { title: 'The model', tag: 'a weighted sum', io: 'one row of X → one prediction ŷ', params: '9 = 8 weights + 1 intercept',
          body: 'Every prediction is ŷ = β₀ + β₁x₁ + β₂x₂ + … + β₈x₈: multiply each feature by its weight, add them up, add the intercept. In matrix form, all 400 predictions at once: <strong>ŷ = Xβ</strong>.',
          more: 'That is the entire model. Its flexibility is limited to straight lines (hyperplanes), which is both its weakness and why it is so easy to read.' } },
      { id: 'residuals', kind: 'custom', label: 'Residuals', shape: 'e = y − ŷ', color: T.amber, w: 70, h: 66,
        draw: (g, l, t) => { box(g, l, t, 70, 66, T.amber); el('line', { x1: l + 6, y1: t + 54, x2: l + 64, y2: t + 14, stroke: T.cyan, 'stroke-width': 1.6 }, g); [[14, 34], [26, 52], [38, 26], [50, 40], [58, 14]].forEach(([dx, dy]) => { const ly = t + 54 - (dx - 6) * 40 / 58; el('line', { x1: l + dx, y1: t + dy, x2: l + dx, y2: ly, stroke: T.amber, 'stroke-dasharray': '2 2' }, g); el('circle', { cx: l + dx, cy: t + dy, r: 3, fill: T.violet2 }, g); }); },
        info: { title: 'Residuals', tag: 'the errors', io: '400 predictions → 400 residuals', params: '—',
          body: 'For every training row, the residual is what the model got wrong: <strong>e = y − ŷ</strong>, the vertical distance from the point to the line. Positive means the model predicted too low, negative too high.',
          more: 'Good residuals look like structureless noise. A pattern (a curve, a funnel) means the model is missing something.' } },
      { id: 'loss', kind: 'custom', label: 'Loss', shape: 'MSE', color: T.pink, w: 70, h: 66,
        badges: [['squared', 'why squared?']],
        draw: (g, l, t) => { box(g, l, t, 70, 66, T.pink); el('path', { d: `M${l + 10} ${t + 12} Q${l + 35} ${t + 100} ${l + 60} ${t + 12}`, fill: 'none', stroke: T.pink, 'stroke-width': 2 }, g); el('circle', { cx: l + 35, cy: t + 56, r: 3.5, fill: T.amber }, g); },
        info: { title: 'Loss: mean squared error', tag: 'one number to minimise', io: '400 residuals → 1 number', params: '—',
          body: 'All errors are combined into one score: <strong>MSE = (1/n) Σ eᵢ²</strong> (or the sum, RSS; same minimum). Fitting the model means finding the β that makes this number as small as possible.',
          more: 'As a function of β, MSE is a smooth bowl with a single lowest point, which is why linear regression always has one best answer (when features are not perfectly collinear).' } },
      { id: 'solver', kind: 'custom', label: 'Solver', shape: 'find best β', color: T.green, w: 70, h: 66,
        badges: [['normal', 'normal equation'], ['gd', 'gradient descent']],
        draw: (g, l, t) => { box(g, l, t, 70, 66, T.green); el('path', { d: `M${l + 12} ${t + 50} C${l + 26} ${t + 14} ${l + 40} ${t + 60} ${l + 58} ${t + 18}`, fill: 'none', stroke: alpha(T.green, 0.5), 'stroke-dasharray': '3 3' }, g); [[12, 50], [24, 34], [34, 38], [44, 33], [58, 18]].forEach(([dx, dy], k) => el('circle', { cx: l + dx, cy: t + dy, r: 2.5 + k * 0.4, fill: T.green }, g)); },
        info: { title: 'Solver', tag: 'how β is found', io: 'X, y → β', params: '—',
          body: 'For linear regression the bowl’s bottom can be computed exactly with the <strong>normal equation</strong>, or approached step by step with <strong>gradient descent</strong>. Both give the same answer on this data.',
          more: 'scikit-learn’s LinearRegression uses a least-squares solver based on matrix decompositions (not an explicit inverse), which is fast and numerically stable for thousands of features.' } },
      { id: 'fitted', kind: 'custom', label: 'Fitted model', shape: '9 numbers', color: T.cyan, w: 76, h: 66,
        badges: [['coef', 'reading β']],
        draw: (g, l, t) => { box(g, l, t, 76, 66, T.cyan); const v = [0.36, 0.01, -0.01, 0.06, 0, 0, -0.1, -0.01]; v.forEach((c, k) => { const h = Math.abs(c) * 70; el('rect', { x: l + 8 + k * 8, y: c >= 0 ? t + 36 - h : t + 36, width: 5.5, height: Math.max(1, h), rx: 1, fill: c >= 0 ? alpha(T.cyan, 0.9) : alpha(T.pink, 0.9) }, g); }); el('line', { x1: l + 6, y1: t + 36, x2: l + 70, y2: t + 36, stroke: 'rgba(255,255,255,0.3)' }, g); },
        info: { title: 'The fitted model', tag: 'β learned from 400 rows', io: 'intercept 2.04 + 8 weights', params: 'MedInc +0.363 · Latitude −0.096 · AveBedrms +0.060 …',
          body: 'This is all a trained linear regression stores. MedInc +0.363 means: with all other features held fixed, one extra unit of median income ($10k) goes with +0.363 × $100k ≈ <strong>$36,000</strong> higher predicted house value.',
          more: 'Coefficients are in the units of their features, so raw sizes are not comparable (Population’s weight looks like 0 only because it is measured in people). Standardise first to compare, and never read them as causal effects.' } },
      { id: 'eval', kind: 'custom', label: 'Evaluation', shape: 'on held-out data', color: T.amber, w: 70, h: 66,
        badges: [['r2', 'R²'], ['rmse', 'RMSE'], ['resplot', 'residual plot']],
        draw: (g, l, t) => { box(g, l, t, 70, 66, T.amber); el('path', { d: `M${l + 12} ${t + 50} A23 23 0 0 1 ${l + 58} ${t + 50}`, fill: 'none', stroke: 'rgba(255,255,255,0.15)', 'stroke-width': 6 }, g); el('path', { d: `M${l + 12} ${t + 50} A23 23 0 0 1 ${l + 52} ${t + 36}`, fill: 'none', stroke: T.amber, 'stroke-width': 6 }, g); txt(g, l + 35, t + 60, '0.79', 'arch-small', 'middle', T.amber); },
        info: { title: 'Evaluation', tag: 'on the 100 test rows', io: 'test R² 0.792 · RMSE 0.436', params: 'baseline (predict the mean): R² 0.00 · RMSE 0.957',
          body: 'The model is judged on rows it never saw. It explains about 79% of the variance in house values and is off by about $44k on a typical district, against $96k for always guessing the average.',
          more: 'Training R² (0.82) is a little higher than test R² (0.79): a small, healthy gap. A large gap would mean overfitting.' } },
      { id: 'assume', kind: 'custom', label: 'Assumptions', shape: 'check before trusting', color: T.green, w: 70, h: 66,
        badges: [['linearity', 'linearity'], ['independence', 'independence'], ['equalvar', 'equal variance'], ['normality', 'normal errors'], ['collinear', 'multicollinearity']],
        draw: (g, l, t) => { box(g, l, t, 70, 66, T.green, true); for (let k = 0; k < 4; k++) { el('path', { d: `M${l + 12} ${t + 14 + k * 13} l3 3 l6 -6`, fill: 'none', stroke: T.green, 'stroke-width': 1.6 }, g); el('rect', { x: l + 26, y: t + 13 + k * 13, width: 32 - (k % 2) * 8, height: 4, rx: 2, fill: alpha(T.green, 0.45) }, g); } },
        info: { title: 'Assumptions', tag: 'what OLS takes for granted', io: 'L · I · N · E + no multicollinearity', params: '—',
          body: 'Predictions can be useful even when these are bent a little, but the coefficients, their standard errors and confidence intervals are only trustworthy when they roughly hold. Tap each tag to see how to check it.',
          more: 'A handy mnemonic is <strong>LINE</strong>: Linearity, Independence, Normal errors, Equal variance.' } },
    ],
    extra: {
      features: { title: 'Features X', tag: 'inputs, also called predictors', io: '8 columns', params: '—', body: 'The measurable things we predict from: here income, house age, rooms, bedrooms, population, occupancy, latitude and longitude.', more: 'More features are not always better: irrelevant or near-duplicate features add noise and instability.' },
      target: { title: 'Target y', tag: 'what we predict', io: 'MedHouseVal, in $100,000s', params: '—', body: 'A continuous number. That is what makes this a regression problem (a category would make it classification).', more: 'Heavily skewed targets (prices, incomes) often fit better after a log transform.' },
      ones: { title: 'The column of 1s', tag: 'the intercept trick', io: 'x₀ = 1 for every row', params: 'its weight is β₀', body: 'Multiplying β₀ by a constant 1 adds the same number to every prediction, so the intercept becomes just another weight and the whole model is ŷ = Xβ.', more: 'Libraries add this column for you (fit_intercept=True).' },
      scaling: { title: 'Feature scaling', tag: 'optional for OLS', io: 'x → (x − mean) / std', params: '—', body: 'Plain OLS gives identical predictions with or without scaling; only the coefficients change units. Scaling matters for gradient descent (faster, more stable) and for regularised models.', more: 'Fit the scaler on training data only, then apply it to test data.' },
      weights: { title: 'Weights β₁ … βₚ', tag: 'one per feature', io: '8 numbers', params: 'learned', body: 'Each weight says how much the prediction moves when its feature rises by one unit, with every other feature held fixed.', more: 'The sign tells the direction; the size depends on the feature’s units.' },
      intercept: { title: 'Intercept β₀', tag: 'the baseline', io: '2.04 here', params: 'learned', body: 'The prediction when every feature is 0. Often not meaningful by itself (nobody has 0 rooms at latitude 0), but it lets the line sit at the right height.', more: 'With standardised features, β₀ equals the mean of y.' },
      squared: { title: 'Why square the errors?', tag: 'design choice', io: 'error 2 → cost 4, error 10 → cost 100', params: '—', body: 'Squaring makes every error positive, punishes big errors much more than small ones, and gives a smooth bowl with a closed-form minimum. Under Gaussian noise it is also exactly maximum likelihood.', more: 'The price: a few outliers can drag the line. Absolute error (MAE) or Huber loss are more robust alternatives.' },
      normal: { title: 'Normal equation', tag: 'closed form', io: 'β = (XᵀX)⁻¹ Xᵀy', params: 'cost O(np² + p³)', body: 'Setting the gradient of the loss to zero gives XᵀXβ = Xᵀy, which can be solved in one go. Geometrically, Xβ is the projection of y onto the space spanned by the columns of X.', more: 'In practice it is solved with a QR or SVD decomposition, not by inverting XᵀX, which can be numerically unstable.' },
      gd: { title: 'Gradient descent', tag: 'iterative', io: 'β ← β − η · (2/n) Xᵀ(Xβ − y)', params: 'needs a learning rate η', body: 'Start from any β and repeatedly step downhill along the gradient of the loss. Because the bowl has a single minimum, it reaches the same answer as the normal equation.', more: 'Preferred when there are too many rows to fit in memory (stochastic / mini-batch versions) or many features. Scale the features first.' },
      coef: { title: 'Reading a coefficient', tag: 'interpretation', io: 'MedInc: +0.363', params: '“all else held fixed”', body: 'One more unit of median income, with the other seven features unchanged, goes with a 0.363 higher predicted value ($36k). That is an association in this data, not a causal effect.', more: 'With correlated features, “holding the others fixed” may describe situations that never occur in the data, and coefficients can flip sign.' },
      r2: { title: 'R² (coefficient of determination)', tag: 'share of variance explained', io: 'R² = 1 − RSS / TSS', params: 'test: 0.792', body: 'Compares the model’s squared errors (RSS) with those of always predicting the mean (TSS). 1 is perfect, 0 is no better than the mean, and on test data it can even be negative.', more: 'A high R² does not mean the model is right, only that it fits the variance well.' },
      rmse: { title: 'RMSE', tag: 'typical error size', io: '√(mean of e²)', params: 'test: 0.436 → about $44k', body: 'Root mean squared error is in the target’s own units, so it answers “how far off is a typical prediction?”.', more: 'Report it next to a baseline: here, always predicting the mean gives 0.957.' },
      resplot: { title: 'Residual plot', tag: 'the most useful diagnostic', io: 'residuals vs predictions', params: '—', body: 'Plot each residual against its prediction. A healthy model gives a shapeless cloud around 0. A curve means a missing non-linearity; a funnel means the errors grow with the prediction.', more: 'Patterns here tell you what to fix: add a transformed feature, use a log target, or switch model.' },
      linearity: { title: 'Linearity', tag: 'assumption L', io: 'E[y | x] is a straight-line function of x', params: 'check: residual plot', body: 'The true relationship should be (close to) linear in the features. If it curves, the residual plot shows a U shape.', more: 'Fix: add squared or interaction terms, transform features, or use a non-linear model.' },
      independence: { title: 'Independence', tag: 'assumption I', io: 'errors do not depend on each other', params: 'check: residuals vs time or group', body: 'One row’s error should tell you nothing about another’s. Time series and repeated measurements on the same customer often violate this.', more: 'Violations make standard errors too small, so effects look more certain than they are.' },
      equalvar: { title: 'Equal variance (homoscedasticity)', tag: 'assumption E', io: 'Var(e) is the same everywhere', params: 'check: funnel in residual plot', body: 'The spread of errors should be similar for small and large predictions. Prices often violate it: expensive houses have larger errors.', more: 'Fix: log-transform the target, or use robust (heteroscedasticity-consistent) standard errors.' },
      normality: { title: 'Normal errors', tag: 'assumption N', io: 'e ~ Normal(0, σ²)', params: 'check: Q–Q plot of residuals', body: 'Needed for exact confidence intervals and p-values, especially in small samples. Predictions themselves do not require it.', more: 'With hundreds of rows the central limit theorem makes this the least critical assumption.' },
      collinear: { title: 'No multicollinearity', tag: 'features should not duplicate each other', io: 'VIF = 1 / (1 − R²ⱼ)', params: 'here every VIF ≈ 1.0', body: 'If one feature can be predicted from the others, coefficients become unstable and can swing wildly or flip sign. Predictions may still be fine.', more: 'In this repo’s collinear housing sample, SqFt and LotSize have VIFs above 1,000. Fix: drop or combine features, or use ridge regression.' },
    },
  };


  // ------------------------------------------------------------------ language models: shared glyphs
  const G = {
    grid(g, l, t, w, h, c, rows, cols, f) { for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) el('rect', { x: l + 7 + j * ((w - 14) / cols), y: t + 8 + i * ((h - 16) / rows), width: (w - 14) / cols - 2, height: (h - 16) / rows - 2, rx: 1.5, fill: alpha(c, f ? f(i, j) : 0.2 + 0.6 * (((i * 7 + j * 3) % 5) / 5)) }, g); },
    chips(g, l, t, w, c, labels) { labels.forEach((s, k) => { el('rect', { x: l + 8, y: t + 8 + k * 17, width: w - 16, height: 14, rx: 4, fill: alpha(c, 0.18), stroke: alpha(c, 0.7) }, g); txt(g, l + w / 2, t + 18.5 + k * 17, s, 'arch-small'); }); },
    plus(g, cx, cy, c) { el('circle', { cx, cy, r: 15, fill: alpha(c, 0.15), stroke: c, 'stroke-width': 1.2 }, g); el('path', { d: `M${cx - 7} ${cy} H${cx + 7} M${cx} ${cy - 7} V${cy + 7}`, stroke: c, 'stroke-width': 2, 'stroke-linecap': 'round' }, g); },
    ln(g, l, t, w, h, c) { box(g, l, t, w, h, c); [0.5, -0.3, 0.8, -0.6, 0.2, -0.1].forEach((v, k) => { const bh = Math.abs(v) * (h / 2 - 8); el('rect', { x: l + 6 + k * ((w - 12) / 6), y: v > 0 ? t + h / 2 - bh : t + h / 2, width: (w - 12) / 6 - 2, height: Math.max(1, bh), rx: 1, fill: alpha(c, 0.8) }, g); }); el('line', { x1: l + 4, y1: t + h / 2, x2: l + w - 4, y2: t + h / 2, stroke: alpha(T.amber, 0.8), 'stroke-dasharray': '3 2' }, g); },
    nodes(g, l, t, w, h, c) { box(g, l, t, w, h, c); const A1 = [0, 1, 2].map(i => [l + 12, t + 16 + i * 17]), B = [0, 1, 2, 3, 4, 5].map(i => [l + w / 2, t + 8 + i * 10]), C = [0, 1, 2].map(i => [l + w - 12, t + 16 + i * 17]); A1.forEach(a => B.forEach(b => el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: alpha(c, 0.25) }, g))); B.forEach(a => C.forEach(b => el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: alpha(c, 0.25) }, g))); [...A1, ...C].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 3.5, fill: c }, g)); B.forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 2.6, fill: T.amber }, g)); },
    bars(g, l, t, w, h, c, vals, hi) { box(g, l, t, w, h, c); vals.forEach((v, k) => el('rect', { x: l + 8, y: t + 8 + k * ((h - 16) / vals.length), width: Math.max(2, v * (w - 16)), height: (h - 16) / vals.length - 2, rx: 1.5, fill: alpha(k === hi ? T.green : c, k === hi ? 0.9 : 0.5) }, g)); },
  };

  // ------------------------------------------------------------------ GPT-2 small (124M), end to end
  const TRANSFORMER = {
    title: 'GPT-2 small: a decoder-only Transformer',
    labels: ['Shape', 'Parameters'],
    total: '124,439,808 parameters · 12 blocks · d = 768 · 12 heads · context 1,024 tokens · vocabulary 50,257',
    items: [
      { id: 'text', kind: 'custom', label: 'Text', shape: 'a string', color: T.violet2, w: 70, h: 66,
        draw: (g, l, t) => { box(g, l, t, 70, 66, T.violet2); txt(g, l + 35, t + 30, '“The cat', 'arch-small'); txt(g, l + 35, t + 44, 'sat …”', 'arch-small'); },
        info: { title: 'Input text', tag: 'what you type', io: 'any Unicode string', params: '0',
          body: 'The prompt: everything the model has to go on. For a chat model this includes hidden system instructions and the whole conversation so far, all flattened into one long string with special markers.',
          more: 'The model has no other memory. Anything not in this text (or in its weights) does not exist for it.' } },
      { id: 'tok', kind: 'custom', label: 'Tokenizer', shape: 'byte-level BPE', color: T.cyan, w: 70, h: 66,
        badges: [['bpe', 'BPE merges'], ['special', 'special tokens']],
        draw: (g, l, t) => { box(g, l, t, 70, 66, T.cyan); G.chips(g, l, t, 70, T.cyan, ['The', '▁cat', '▁sat']); },
        info: { title: 'Tokenizer', tag: 'not a neural network', io: 'text → T ids (T ≤ 1,024)', params: '0 weights (50,000 merge rules)',
          body: 'Cuts the text into tokens using byte-level BPE and replaces each token by its id from a vocabulary of 50,257. Common words are one token; rare words are split into pieces.',
          more: 'See the <a class="inline" href="../../concepts/tokenization/">tokenization lesson</a> for how the merges are learned.' } },
      { id: 'wte', kind: 'custom', label: 'Token embedding', shape: '50,257 × 768', color: T.violet, w: 76, h: 66,
        badges: [['lookup', 'row lookup'], ['tied', 'weight tying']],
        draw: (g, l, t) => { box(g, l, t, 76, 66, T.violet); G.grid(g, l, t, 76, 66, T.violet, 6, 6, (i) => (i === 2 ? 0.95 : 0.25)); },
        info: { title: 'Token embedding table (wte)', tag: 'nn.Embedding(50257, 768)', io: 'T ids → T × 768', params: '38,597,376 = 50,257 × 768',
          body: 'A learned table with one 768-number row per token. Each id simply selects its row. During training, tokens used in similar ways get similar rows.',
          more: 'About 31% of all GPT-2 small parameters live here. See the <a class="inline" href="../../concepts/embeddings/">embeddings lesson</a>.' } },
      { id: 'wpe', kind: 'custom', label: 'Position embedding', shape: '1,024 × 768', color: T.amber, w: 70, h: 66,
        badges: [['context', 'context window']],
        draw: (g, l, t) => { box(g, l, t, 70, 66, T.amber); for (let k = 0; k < 3; k++) { let d = ''; for (let x = 0; x <= 56; x += 2) d += `${x ? 'L' : 'M'}${l + 7 + x} ${t + 18 + k * 16 + Math.sin(x / (3 + k * 5)) * 5}`; el('path', { d, fill: 'none', stroke: alpha(T.amber, 0.85 - k * 0.2), 'stroke-width': 1.4 }, g); } },
        info: { title: 'Position embedding table (wpe)', tag: 'learned, one row per position', io: 'positions 0 … T−1 → T × 768, added to the token vectors', params: '786,432 = 1,024 × 768',
          body: 'Attention by itself ignores order, so a learned vector for each position (0 to 1,023) is added to each token’s embedding. The sum is the input X to the first block.',
          more: 'Having exactly 1,024 rows is what limits GPT-2 to 1,024 tokens. Newer models use rotary embeddings (RoPE) instead, which handle longer contexts more gracefully.' } },
      { id: 'ln1', kind: 'custom', label: 'LayerNorm', shape: 'per token', color: T.green, w: 50, h: 50, info: 'ln',
        draw: (g, l, t) => G.ln(g, l, t, 50, 50, T.green) },
      { id: 'attn', kind: 'custom', label: 'Self-attention', shape: 'masked · 12 heads', color: T.pink, w: 86, h: 72,
        badges: [['qkv', 'Q, K, V'], ['scores', 'softmax(QKᵀ/√d)'], ['mask', 'causal mask'], ['heads', '12 heads'], ['wo', 'output projection']],
        draw: (g, l, t) => { box(g, l, t, 86, 72, T.pink); for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) el('rect', { x: l + 18 + j * 10.5, y: t + 10 + i * 10.5, width: 9, height: 9, rx: 1.5, fill: j > i ? 'rgba(255,255,255,0.04)' : alpha(T.pink, 0.25 + 0.7 * ((i * 3 + j * 7) % 4) / 4) }, g); },
        info: { title: 'Masked multi-head self-attention', tag: 'the only place tokens exchange information', io: 'T × 768 → T × 768', params: '2,362,368 = (768 × 2,304 + 2,304) + (768 × 768 + 768)',
          body: 'Every token builds a query, a key and a value; each query is compared with the keys of all earlier tokens, the scores become weights with a softmax, and the token’s output is the weighted average of the values. Twelve heads do this in parallel with different learned projections.',
          more: 'This is the only sub-layer where one token can read another. Its cost grows with T²: 1,024 tokens means about a million scores per head per layer.' } },
      { id: 'add1', kind: 'custom', label: 'Add', shape: 'residual', color: T.cyan, w: 34, h: 34, info: 'add',
        draw: (g, l, t, cx, cy) => G.plus(g, cx, cy, T.cyan) },
      { id: 'ln2', kind: 'custom', label: 'LayerNorm', shape: 'per token', color: T.green, w: 50, h: 50, info: 'ln',
        draw: (g, l, t) => G.ln(g, l, t, 50, 50, T.green) },
      { id: 'ffn', kind: 'custom', label: 'Feed-forward (MLP)', shape: '768 → 3,072 → 768', color: T.violet2, w: 80, h: 66,
        badges: [['gelu', 'GELU']],
        draw: (g, l, t) => G.nodes(g, l, t, 80, 66, T.violet2),
        info: { title: 'Position-wise feed-forward network', tag: 'Linear → GELU → Linear', io: 'T × 768 → T × 3,072 → T × 768', params: '4,722,432 = (768 × 3,072 + 3,072) + (3,072 × 768 + 768)',
          body: 'A small two-layer network applied to every token separately, with the same weights at every position. It widens each vector four times, applies a non-linearity and projects back.',
          more: 'Two-thirds of each block’s weights sit here. Research on interpretability suggests many stored facts and patterns are retrieved by these layers.' } },
      { id: 'add2', kind: 'custom', label: 'Add', shape: 'residual', color: T.cyan, w: 34, h: 34, info: 'add',
        draw: (g, l, t, cx, cy) => G.plus(g, cx, cy, T.cyan) },
      { id: 'stack', kind: 'custom', label: 'Repeat × 12', shape: 'blocks 2 … 12', color: T.violet, w: 64, h: 66,
        badges: [['depth', 'why stack?']],
        draw: (g, l, t) => { for (let k = 3; k >= 0; k--) el('rect', { x: l + k * 5, y: t + 14 - k * 4, width: 48, height: 46, rx: 8, fill: alpha(T.violet, 0.12 + k * 0.03), stroke: alpha(T.violet, 0.5 + k * 0.12) }, g); txt(g, l + 24, t + 41, '×12', 'arch-label'); },
        info: { title: 'Twelve Transformer blocks', tag: 'LN → attention → add → LN → MLP → add, repeated', io: 'T × 768 → T × 768', params: '85,054,464 = 12 × 7,087,872',
          body: 'Everything from the first LayerNorm to the second Add is one block. GPT-2 small stacks 12 of them, each with its own weights; the shape never changes, so blocks can be stacked as deep as compute allows.',
          more: 'GPT-2 comes in four sizes: 12, 24, 36 and 48 blocks (124 M to 1.5 B parameters). Today’s large models use dozens of blocks and widths of several thousand.' } },
      { id: 'lnf', kind: 'custom', label: 'Final LayerNorm', shape: 'ln_f', color: T.green, w: 50, h: 50, info: 'ln',
        draw: (g, l, t) => G.ln(g, l, t, 50, 50, T.green) },
      { id: 'head', kind: 'custom', label: 'LM head', shape: '768 → 50,257', color: T.violet, w: 70, h: 66,
        badges: [['logits', 'logits']],
        draw: (g, l, t) => { box(g, l, t, 70, 66, T.violet); for (let k = 0; k < 14; k++) { const v = Math.abs(Math.sin(k * 2.3)) * 0.6 + (k === 5 ? 0.4 : 0); el('rect', { x: l + 7 + k * 4, y: t + 58 - v * 44, width: 3, height: v * 44, rx: 1, fill: alpha(T.violet2, k === 5 ? 0.95 : 0.5) }, g); } },
        info: { title: 'Language-model head', tag: 'h · Eᵀ, sharing the token embedding table', io: 'T × 768 → T × 50,257 logits', params: '0 extra (tied to wte)',
          body: 'Each final vector is compared (dot product) with every row of the token embedding table, giving one score per possible next token. Only the last position matters for generation; every position is used in training.',
          more: 'Reusing the input table here is called <strong>weight tying</strong>: it saves 38.6 M parameters and tends to help, because “which vector means this token” is the same question at both ends.' } },
      { id: 'out', kind: 'custom', label: 'Next token', shape: 'softmax', color: T.green, w: 70, h: 72,
        badges: [['temperature', 'temperature'], ['sampling', 'sampling'], ['loss', 'training loss']],
        draw: (g, l, t) => G.bars(g, l, t, 70, 72, T.violet2, [0.15, 0.85, 0.3, 0.1, 0.22], 1),
        info: { title: 'Softmax → next-token probabilities', tag: 'one distribution over 50,257 tokens', io: '50,257 logits → probabilities summing to 1', params: '0',
          body: 'Softmax turns the logits into probabilities. During generation one token is chosen from them, appended to the input, and the whole model runs again for the next one.',
          more: 'So a 100-token answer takes 100 forward passes. The KV cache stores each earlier token’s keys and values so they are not recomputed every time.' } },
    ],
    extra: {
      ln: { title: 'Layer normalisation', tag: 'nn.LayerNorm(768)', io: 'each token’s vector → mean 0, std 1, then × γ + β', params: '1,536 = γ and β, 768 each',
        body: 'Rescales every token’s 768 numbers on its own, so they keep a stable size however many blocks are stacked. γ and β are learned so the network can undo the scaling where useful.',
        more: 'GPT-2 puts LayerNorm <em>before</em> each sub-layer (pre-norm) and adds one final LayerNorm after the last block. The original 2017 Transformer normalised after each Add (post-norm), which is harder to train deep.' },
      add: { title: 'Residual connection', tag: 'x + sublayer(LN(x))', io: 'T × 768 + T × 768 → T × 768', params: '0',
        body: 'The sub-layer’s output is added to its own input instead of replacing it. A “residual stream” of vectors runs through the whole network, and each attention or MLP layer reads from it and writes a correction back.',
        more: 'The identity path gives gradients a direct route to the earliest layers; without residual connections, networks this deep barely train.' },
      bpe: { title: 'Byte-level BPE', tag: '256 bytes + 50,000 merges + 1 special', io: 'e.g. “unbelievable” → a few pieces', params: 'merge list, learned once before training',
        body: 'Starts from the 256 possible byte values and applies 50,000 learned merges in order. Any input can be encoded, and no token is ever unknown.',
        more: 'A leading space is part of the token, which GPT-2 shows as Ġ: “Ġcat” and “cat” have different ids.' },
      special: { title: 'Special tokens', tag: '<|endoftext|> = id 50256', io: 'one special token in GPT-2', params: '—',
        body: 'GPT-2 has a single special token marking the boundary between documents. Chat models add more (for example markers for system, user and assistant turns).',
        more: 'Special tokens are never produced by ordinary text; the tokenizer inserts them explicitly.' },
      lookup: { title: 'Row lookup', tag: 'equivalent to one-hot × E', io: 'id 3797 → row 3797', params: '—',
        body: 'Multiplying a one-hot vector by the table would select exactly one row, so frameworks just index the row. Only the rows of tokens present in a batch receive gradient.',
        more: 'Rows of tokens that are almost never seen in training stay close to their random start, which can make rare tokens behave strangely.' },
      tied: { title: 'Weight tying', tag: 'output layer = input table transposed', io: 'h · Eᵀ', params: 'saves 38.6 M',
        body: 'The same 50,257 × 768 table maps ids to vectors at the bottom and vectors back to scores over ids at the top.',
        more: 'Introduced for language models by Press and Wolf (2017); used by GPT-2 and many later models.' },
      context: { title: 'Context window', tag: '1,024 tokens for GPT-2', io: 'longer inputs must be truncated or split', params: '—',
        body: 'The model can only attend to as many tokens as it has positions. Everything older falls out of view.',
        more: 'Recent models reach hundreds of thousands of tokens using rotary position embeddings and memory-efficient attention.' },
      qkv: { title: 'Query, key, value', tag: 'one combined projection, 768 → 3 × 768', io: 'per head: q, k, v of 64 numbers', params: '1,771,776 = 768 × 2,304 + 2,304',
        body: 'The query says what a token is looking for, the key what it offers, the value what it hands over when chosen. All three are linear projections of the same input vector.',
        more: 'GPT-2 computes all three for all 12 heads in a single matrix multiplication (c_attn), then splits the result.' },
      scores: { title: 'Scaled dot-product attention', tag: 'softmax(QKᵀ / √64) · V', io: 'T × T weights per head', params: '0',
        body: 'Dot products between queries and keys measure match; dividing by √d (√64 = 8) keeps them in a range where softmax still has useful gradients.',
        more: 'Row i of the weight matrix is token i’s attention distribution, which sums to 1.' },
      mask: { title: 'Causal mask', tag: 'no looking ahead', io: 'scores above the diagonal → −∞', params: '0',
        body: 'Each token may only attend to itself and earlier tokens, so the model cannot cheat by reading the word it is supposed to predict.',
        more: 'Encoder models such as BERT have no mask and read in both directions; they are used for understanding tasks, not open-ended generation.' },
      heads: { title: 'Twelve heads', tag: '12 × 64 = 768', io: '12 attention patterns in parallel', params: 'included in Q, K, V',
        body: 'Splitting 768 dimensions into 12 heads of 64 lets the layer follow several relationships at once, at the same cost as one big head.',
        more: 'Studies of trained models find heads that track the previous token, copy earlier patterns (“induction heads”) or link pronouns to nouns, though many heads are hard to interpret.' },
      wo: { title: 'Output projection', tag: 'c_proj, 768 × 768', io: 'concatenated heads → 768', params: '590,592 = 768 × 768 + 768',
        body: 'The 12 head outputs are concatenated and mixed by one more linear layer before being added to the residual stream.',
        more: 'This is where information from different heads is combined.' },
      gelu: { title: 'GELU activation', tag: 'x · Φ(x)', io: 'applied to each of the 3,072 values', params: '0',
        body: 'A smooth version of ReLU: large positive inputs pass through, large negative inputs go to zero, and small values are scaled softly in between.',
        more: 'GPT-2 uses the tanh approximation. Many newer models use SwiGLU, a gated variant.' },
      depth: { title: 'Why stack blocks?', tag: 'depth = repeated refinement', io: 'same shape in and out', params: '7,087,872 per block',
        body: 'Each block can combine information gathered by the blocks below it, so later layers can represent relationships between relationships.',
        more: 'Scaling laws show loss falling smoothly as parameters, data and compute grow together, which is why model sizes keep increasing.' },
      logits: { title: 'Logits', tag: 'unnormalised scores', io: '50,257 numbers per position', params: '—',
        body: 'Higher means more likely. They can be any real number; only their differences matter to the softmax.',
        more: 'Logit bias and top-k / top-p filtering are applied at this stage when sampling.' },
      temperature: { title: 'Temperature', tag: 'softmax(logits / τ)', io: 'τ < 1 sharper, τ > 1 flatter', params: '—',
        body: 'Dividing logits by a temperature before the softmax controls randomness. τ → 0 always picks the top token (greedy); τ = 1 samples from the model’s own distribution.',
        more: 'Low temperature suits factual answers and code; higher temperature gives more varied creative text, and more mistakes.' },
      sampling: { title: 'Sampling strategies', tag: 'greedy, top-k, top-p', io: 'probabilities → one token id', params: '—',
        body: 'Greedy decoding takes the most likely token. Top-k samples among the k best; top-p (nucleus) samples among the smallest set whose probabilities add up to p.',
        more: 'The chosen token is detokenized to text and appended to the input for the next step.' },
      loss: { title: 'Training loss', tag: 'cross-entropy on the next token', io: 'targets = input shifted by one', params: '—',
        body: 'At every position the model is scored by −log of the probability it gave to the true next token. Thanks to the causal mask, all positions are trained in one forward pass.',
        more: 'GPT-2 was trained this way on WebText, about 40 GB of web pages; nothing else is needed to learn grammar, facts and style.' },
    },
  };

  // ------------------------------------------------------------------ GPT-2's tokenizer pipeline
  const TOKENIZER = {
    title: 'From a string to token ids (GPT-2 tokenizer)',
    labels: ['Example', 'Details'],
    total: 'Vocabulary 50,257 = 256 byte tokens + 50,000 merges + 1 special token · decoding reverses every step exactly',
    items: [
      { id: 'raw', kind: 'custom', label: 'Raw text', shape: 'Unicode', color: T.violet2, w: 70, h: 60,
        draw: (g, l, t) => { box(g, l, t, 70, 60, T.violet2); txt(g, l + 35, t + 26, 'Hello', 'arch-small'); txt(g, l + 35, t + 41, 'world 🙂', 'arch-small'); },
        info: { title: 'Raw text', tag: 'a Unicode string', io: '“Hello world 🙂”', params: 'any language, emoji or symbol',
          body: 'The tokenizer accepts any string. Nothing has been decided yet about what counts as a word.',
          more: 'Text from different sources may encode the same character in different ways (for example “é” as one code point or as “e” plus an accent), which some tokenizers normalise first.' } },
      { id: 'norm', kind: 'custom', label: 'Normalise', shape: 'GPT-2: none', color: T.cyan, w: 64, h: 60,
        badges: [['lower', 'lower-casing?']],
        draw: (g, l, t) => { box(g, l, t, 64, 60, T.cyan, true); txt(g, l + 32, t + 27, 'Aé → ?', 'arch-small'); txt(g, l + 32, t + 43, 'NFKC', 'arch-small'); },
        info: { title: 'Normalisation', tag: 'optional clean-up', io: 'GPT-2 keeps the text exactly as it is', params: 'BERT-uncased: lower-case + strip accents · SentencePiece: NFKC by default',
          body: 'Some tokenizers standardise the text first: Unicode normalisation, lower-casing, removing accents. Byte-level GPT-style tokenizers skip this so that decoding returns exactly the original text.',
          more: 'Normalising loses information (case, accents) but makes the vocabulary more compact.' } },
      { id: 'pre', kind: 'custom', label: 'Pre-tokenize', shape: 'split into chunks', color: T.green, w: 70, h: 60,
        badges: [['regex', 'split regex'], ['space', 'leading space']],
        draw: (g, l, t) => { box(g, l, t, 70, 60, T.green); G.chips(g, l, t - 2, 70, T.green, ['Hello', 'Ġworld', 'Ġ🙂']); },
        info: { title: 'Pre-tokenization', tag: 'a regular expression', io: '“Hello”, “ world”, “ 🙂”', params: 'letters, digits, punctuation and spaces become separate chunks',
          body: 'The text is first cut into word-like chunks, so that merges never cross a word boundary. In GPT-2 a space stays attached to the start of the following word.',
          more: 'Without this step, BPE might learn tokens like “dog.” or “dog!” for every punctuation mark, wasting vocabulary.' } },
      { id: 'bytes', kind: 'custom', label: 'Bytes', shape: 'UTF-8', color: T.amber, w: 70, h: 60,
        badges: [['utf8', 'UTF-8'], ['bytemap', 'byte → symbol']],
        draw: (g, l, t) => { box(g, l, t, 70, 60, T.amber); G.grid(g, l, t, 70, 60, T.amber, 3, 4); },
        info: { title: 'UTF-8 bytes', tag: 'the base alphabet', io: '“🙂” → F0 9F 99 82 (4 bytes)', params: '256 possible values = 256 base tokens',
          body: 'Each chunk is converted to its UTF-8 bytes. English letters are 1 byte each, accented letters 2, Devanagari and most CJK characters 3, emoji usually 4.',
          more: 'Because every possible byte is a token, nothing can ever be out of vocabulary.' } },
      { id: 'merge', kind: 'custom', label: 'Apply merges', shape: '50,000 rules', color: T.pink, w: 76, h: 60,
        badges: [['rank', 'merge order'], ['learned', 'how they were learned']],
        draw: (g, l, t) => { box(g, l, t, 76, 60, T.pink); [['H', 'e'], ['He', 'llo']].forEach(([a1, b1], k) => txt(g, l + 38, t + 24 + k * 18, `${a1}+${b1}`, 'arch-small')); },
        info: { title: 'Apply the BPE merges', tag: 'lowest rank first', io: 'H e l l o → Hello', params: '50,000 ranked merge rules',
          body: 'Inside each chunk, the pair of neighbouring symbols with the best (earliest learned) rank is merged, and this repeats until no learned merge applies.',
          more: 'Common words collapse into one token; rare words stop at whatever pieces the merges reach.' } },
      { id: 'vocab', kind: 'custom', label: 'Vocabulary', shape: 'piece → id', color: T.violet, w: 70, h: 60,
        badges: [['size', 'vocabulary size']],
        draw: (g, l, t) => { box(g, l, t, 70, 60, T.violet); [0, 1, 2].forEach(k => { el('rect', { x: l + 8, y: t + 9 + k * 15, width: 30, height: 11, rx: 2, fill: alpha(T.violet, 0.35) }, g); el('rect', { x: l + 42, y: t + 9 + k * 15, width: 20, height: 11, rx: 2, fill: alpha(T.amber, 0.45) }, g); }); },
        info: { title: 'Vocabulary lookup', tag: 'a fixed dictionary', io: 'each final piece → one integer', params: '50,257 entries',
          body: 'Every piece the merges can produce has exactly one id. The table never changes after the tokenizer is trained.',
          more: 'The model’s embedding table has one row per vocabulary entry, so the tokenizer and the model must always be used together.' } },
      { id: 'spec', kind: 'custom', label: 'Special tokens', shape: '<|endoftext|>', color: T.amber, w: 64, h: 60,
        draw: (g, l, t) => { box(g, l, t, 64, 60, T.amber, true); txt(g, l + 32, t + 34, '<|eot|>', 'arch-small'); },
        info: { title: 'Special tokens', tag: 'added by the program, not by BPE', io: '<|endoftext|> = 50256 in GPT-2', params: 'BERT: [CLS], [SEP], [PAD], [MASK]',
          body: 'Control markers are inserted around the text: document boundaries, the start and end of chat turns, padding to equal length in a batch.',
          more: 'If a user can type a special token as plain text and have it treated as the real thing, that is a prompt-injection risk; tokenizers usually block this by default.' } },
      { id: 'ids', kind: 'custom', label: 'Token ids', shape: 'to the model', color: T.green, w: 70, h: 60,
        badges: [['decode', 'decoding']],
        draw: (g, l, t) => { box(g, l, t, 70, 60, T.green); txt(g, l + 35, t + 27, '[15496,', 'arch-small'); txt(g, l + 35, t + 42, ' 995, …]', 'arch-small'); },
        info: { title: 'Token ids', tag: 'the model’s only input', io: 'a list of T integers', params: 'next step: the embedding lookup',
          body: 'The output is just a list of integers. The model never sees characters; everything it knows about spelling it has to infer from which ids appear together.',
          more: 'In GPT-2, “Hello” is id 15496 and “ world” is 995, which is why the familiar phrase costs only two tokens.' } },
    ],
    extra: {
      lower: { title: 'Should text be lower-cased?', tag: 'trade-off', io: '“Apple” vs “apple”', params: '—', body: 'Lower-casing halves many vocabulary entries but throws away information: proper nouns, acronyms, sentence starts.', more: 'Modern LLM tokenizers are cased; BERT ships both cased and uncased versions.' },
      regex: { title: 'The split regular expression', tag: 'GPT-2 pattern', io: "contractions ('s, 't, 're …), letters, digits, other symbols, spaces", params: '—', body: 'A hand-written pattern decides where chunks start and end. GPT-4’s tokenizer splits digits into groups of at most three.', more: 'Pre-tokenization choices have a surprisingly large effect on how well a model handles numbers and code.' },
      space: { title: 'Leading spaces', tag: 'Ġ in GPT-2, ▁ in SentencePiece', io: '“ world” is one token', params: '—', body: 'Attaching the space to the following word means most words need no separate space token, and decoding can rebuild the exact spacing.', more: 'Side effect: “world” at the start of a line and “ world” mid-sentence are different tokens with different embeddings.' },
      utf8: { title: 'UTF-8', tag: 'variable-length encoding', io: '1 to 4 bytes per character', params: '—', body: 'ASCII characters take 1 byte, most Latin accents 2, most Indian scripts and CJK 3, emoji 4.', more: 'This is one reason the same sentence can need far more tokens in Hindi or Tamil than in English.' },
      bytemap: { title: 'Byte-to-symbol map', tag: 'a GPT-2 implementation detail', io: 'byte 0x20 (space) → “Ġ”', params: '—', body: 'GPT-2 maps each of the 256 bytes to a printable Unicode character so the vocabulary file contains no invisible control characters.', more: 'That is why tokens appear with odd characters like Ġ when you inspect them.' },
      rank: { title: 'Merge order (rank)', tag: 'the priority list', io: 'earlier learned = applied first', params: '—', body: 'Encoding replays the merges by rank, which makes the result deterministic: the same text always gives the same tokens.', more: 'Libraries such as tiktoken implement this with fast lookup tables, encoding millions of tokens per second.' },
      learned: { title: 'How merges are learned', tag: 'once, on a large corpus', io: 'count pairs → merge the most frequent → repeat', params: '50,000 iterations for GPT-2', body: 'Training a tokenizer is pure counting: no gradients, no neural network. It is done once, before the language model is trained.', more: 'Try it yourself in the live lab on this page.' },
      size: { title: 'Choosing a vocabulary size', tag: 'trade-off', io: 'GPT-2 50k · Llama 2 32k · GPT-4 ~100k · Llama 3 ~128k', params: '—', body: 'Larger vocabularies make sequences shorter (cheaper attention) but need a larger embedding table, and rare tokens get little training.', more: 'Multilingual models tend to use larger vocabularies so that non-English text is not split too finely.' },
      decode: { title: 'Decoding', tag: 'ids → text', io: 'ids → pieces → bytes → UTF-8 text', params: '—', body: 'Every step is reversible, so decoding gives back the exact original string, spaces and all.', more: 'When a model streams its answer, an emoji may arrive as several byte tokens that only become a valid character once all of them have arrived.' },
    },
  };

  // ------------------------------------------------------------------ the input layer of a Transformer
  const EMBEDDING = {
    title: 'The input layer: from ids to vectors (GPT-2 small)',
    labels: ['Shape', 'Parameters'],
    total: '39,383,808 parameters in the two embedding tables (≈ 32% of GPT-2 small) · output: one 768-number vector per token',
    items: [
      { id: 'ids', kind: 'custom', label: 'Token ids', shape: 'T integers', color: T.violet2, w: 64, h: 60,
        draw: (g, l, t) => { box(g, l, t, 64, 60, T.violet2); G.chips(g, l, t - 2, 64, T.violet2, ['464', '3797', '3332']); },
        info: { title: 'Token ids', tag: 'from the tokenizer', io: 'T integers in 0 … 50,256', params: '0',
          body: 'The integers produced by the tokenizer. On their own they carry no meaning: id 3797 is not “close” to id 3798.',
          more: 'The example ids are what GPT-2 assigns to “The cat sat”.' } },
      { id: 'table', kind: 'custom', label: 'Embedding table E', shape: '50,257 × 768', color: T.violet, w: 80, h: 72,
        badges: [['onehot', '= one-hot × E'], ['init', 'initialisation'], ['similar', 'similarity']],
        draw: (g, l, t) => { box(g, l, t, 80, 72, T.violet); G.grid(g, l, t, 80, 72, T.violet, 7, 6, (i) => (i === 3 ? 0.95 : 0.22)); },
        info: { title: 'Token embedding table', tag: 'nn.Embedding(50257, 768)', io: '50,257 rows of 768 numbers', params: '38,597,376',
          body: 'A plain matrix of learned numbers, one row per vocabulary entry. It is trained along with the rest of the model by backpropagation.',
          more: 'After training, rows of tokens used in similar contexts point in similar directions, which is what the lab on this page shows on a small scale.' } },
      { id: 'lookup', kind: 'custom', label: 'Lookup', shape: 'T × 768', color: T.cyan, w: 70, h: 60,
        draw: (g, l, t) => { box(g, l, t, 70, 60, T.cyan); G.grid(g, l, t, 70, 60, T.cyan, 3, 6); },
        info: { title: 'Gather the rows', tag: 'E[ids]', io: 'T ids → T × 768', params: '0',
          body: 'Each id picks its row; the rows are stacked in the order of the tokens. A 3-token prompt becomes a 3 × 768 matrix.',
          more: 'In the backward pass only these T rows receive a gradient update.' } },
      { id: 'pos', kind: 'custom', label: 'Position vectors', shape: '1,024 × 768', color: T.amber, w: 70, h: 60,
        badges: [['sin', 'sinusoidal'], ['learned', 'learned'], ['rope', 'RoPE']],
        draw: (g, l, t) => { box(g, l, t, 70, 60, T.amber); for (let k = 0; k < 3; k++) { let d = ''; for (let x = 0; x <= 56; x += 2) d += `${x ? 'L' : 'M'}${l + 7 + x} ${t + 16 + k * 15 + Math.sin(x / (3 + k * 5)) * 5}`; el('path', { d, fill: 'none', stroke: alpha(T.amber, 0.85 - k * 0.2), 'stroke-width': 1.4 }, g); } },
        info: { title: 'Position embeddings', tag: 'GPT-2: learned (wpe)', io: 'positions 0 … T−1 → T × 768', params: '786,432 = 1,024 × 768',
          body: 'One vector per position, so that the same token at different positions gives different inputs. Without it, attention would treat the sentence as an unordered bag of tokens.',
          more: 'Three common designs exist; tap the tags below to compare them.' } },
      { id: 'add', kind: 'custom', label: 'Add', shape: 'token + position', color: T.cyan, w: 34, h: 34,
        draw: (g, l, t, cx, cy) => G.plus(g, cx, cy, T.cyan),
        info: { title: 'Add them', tag: 'element-wise sum', io: 'T × 768 + T × 768 → T × 768', params: '0',
          body: 'Token and position vectors are simply added. The network learns to read both kinds of information out of the sum.',
          more: 'The original Transformer first multiplied the token embedding by √d so that it was not swamped by the position signal.' } },
      { id: 'drop', kind: 'custom', label: 'Dropout', shape: 'p = 0.1', color: T.pink, w: 50, h: 50,
        draw: (g, l, t) => { box(g, l, t, 50, 50, T.pink, true); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) el('rect', { x: l + 7 + j * 9.5, y: t + 7 + i * 9.5, width: 7.5, height: 7.5, rx: 1.5, fill: (i * 5 + j * 3) % 7 === 0 ? 'rgba(255,255,255,0.05)' : alpha(T.pink, 0.6) }, g); },
        info: { title: 'Embedding dropout', tag: 'training only', io: 'randomly zeroes 10% of the numbers', params: '0',
          body: 'During training, a random 10% of the values are set to zero (and the rest scaled up) so the model cannot rely on any single number. At inference time it does nothing.',
          more: 'Many recent large models train for less than one pass over their data and turn dropout off entirely.' } },
      { id: 'x', kind: 'custom', label: 'Input X', shape: 'T × 768 → block 1', color: T.green, w: 70, h: 60,
        draw: (g, l, t) => { box(g, l, t, 70, 60, T.green); G.grid(g, l, t, 70, 60, T.green, 3, 6); },
        info: { title: 'The input matrix X', tag: 'what the first Transformer block reads', io: 'T × 768', params: '—',
          body: 'One vector per token that encodes both what the token is and where it is. From here on, attention layers mix the vectors with their context.',
          more: 'At this point the vectors are still static: “bank” has the same token part whatever the sentence. Context arrives in the blocks above.' } },
      { id: 'tie', kind: 'custom', label: 'Later: output layer', shape: 'h · Eᵀ', color: T.violet, w: 70, h: 60, badges: [['tying', 'weight tying']],
        draw: (g, l, t) => { box(g, l, t, 70, 60, T.violet, true); txt(g, l + 35, t + 34, 'Eᵀ', 'arch-label'); },
        info: { title: 'The same table at the top', tag: 'weight tying', io: 'final vector (768) → 50,257 scores', params: '0 extra',
          body: 'After the last block, each vector is compared with every row of E to score each possible next token. One table serves both directions.',
          more: 'Tying is standard in GPT-2 and many later models; some very large models untie them to give the output layer its own weights.' } },
    ],
    extra: {
      onehot: { title: 'Lookup = one-hot × E', tag: 'same maths, much cheaper', io: '(1 × 50,257) · (50,257 × 768) = 1 × 768', params: '—', body: 'A one-hot vector times the table zeroes every row but one. Indexing gives the same result without 38 million multiplications.', more: 'This is why the embedding layer is often described as a linear layer without a bias.' },
      init: { title: 'Initialisation', tag: 'GPT-2: Normal(0, 0.02)', io: 'small random numbers', params: '—', body: 'Rows start as small random vectors with no meaning. Structure appears only through training.', more: 'Pre-trained embeddings (word2vec, GloVe) were once copied in as a starting point; Transformers now learn them from scratch.' },
      similar: { title: 'Measuring similarity', tag: 'cosine similarity', io: 'u·v / (|u||v|) ∈ [−1, 1]', params: '—', body: 'The angle between two rows says how similar the model considers two tokens. Nearest neighbours of a token are usually its synonyms, inflections or same-category words.', more: 'For whole sentences, use a model trained for sentence embeddings rather than averaging these input rows.' },
      sin: { title: 'Sinusoidal encoding', tag: 'original Transformer (2017)', io: 'sin / cos waves of different wavelengths', params: '0 (fixed)', body: 'Each dimension pair is a wave with its own frequency, giving every position a unique, smooth fingerprint with no parameters.', more: 'Shifting by k positions is the same rotation everywhere, which makes relative positions easy to compute.' },
      learned: { title: 'Learned positions', tag: 'GPT-2, BERT', io: 'one trained vector per position', params: 'max length × d', body: 'Simplest option: treat positions like tokens and learn a vector for each.', more: 'It cannot handle positions beyond the table size, which fixes the context window.' },
      rope: { title: 'Rotary position embedding (RoPE)', tag: 'Llama, Mistral, many current LLMs', io: 'rotates q and k by a position-dependent angle', params: '0', body: 'Instead of adding a vector at the input, RoPE rotates each query and key inside attention. The dot product of two rotated vectors then depends only on their relative distance.', more: 'With some rescaling tricks, RoPE models can be extended to much longer contexts than they were trained on.' },
      tying: { title: 'Weight tying', tag: 'one table, two jobs', io: 'input: id → vector · output: vector → scores', params: 'saves 38.6 M in GPT-2 small', body: 'If a vector means “cat” at the input, scoring “cat” at the output should use the same vector. Sharing enforces that and halves the embedding parameters.', more: 'Introduced for language models by Press and Wolf (2017).' },
    },
  };

  function build(container, spec) {
    container.classList.add('arch');
    container.innerHTML = `
      <div class="arch-head"><small class="kicker"><i></i>${spec.title}</small><span class="arch-hint">Hover or tap any part</span></div>
      <div class="arch-stage"></div>
      <div class="arch-card" aria-live="polite"></div>
      <div class="arch-foot">${spec.total}</div>`;
    const stage = container.querySelector('.arch-stage'), card = container.querySelector('.arch-card');
    let current = spec.items[0].id;

    const show = key => {
      current = key;
      const it = spec.items.find(i => i.id === key);
      const info = it ? (typeof it.info === 'string' ? spec.extra[it.info] : it.info) : spec.extra[key];
      card.innerHTML = `
        <div class="arch-card-top"><b>${info.title}</b><span class="tagline">${info.tag}</span></div>
        <dl><div><dt>${(spec.labels || ['Shape', 'Parameters'])[0]}</dt><dd>${info.io}</dd></div><div><dt>${(spec.labels || ['Shape', 'Parameters'])[1]}</dt><dd>${info.params}</dd></div></dl>
        <p>${info.body}</p><p class="arch-more">${info.more}</p>`;
      stage.querySelectorAll('[data-k]').forEach(n => n.classList.toggle('on', n.dataset.k === key));
    };

    const render = () => {
      const width = stage.getBoundingClientRect().width || 700;
      const rowW = width < 520 ? 400 : width < 900 ? 640 : 1000;
      const gap = 30, labelH = 44;
      // measure each item
      const items = spec.items.map(it => {
        let w, h;
        if (it.kind === 'input' || it.kind === 'block') { w = it.w + it.d * 0.7; h = it.h + it.d * 0.5; }
        else if (it.kind === 'op') { w = 30; h = 30; }
        else if (it.kind === 'attn') { w = 52; h = 52; }
        else if (it.kind === 'custom') { w = it.w; h = it.h; }
        else if (it.kind === 'vec') { w = 14; h = it.h; }
        else if (it.kind === 'nodes') { w = 20; h = it.h; }
        else { w = 56; h = it.h; }
        const bw = (it.badges || []).length ? Math.max(...it.badges.map(b => Math.max(64, b[1].length * 6.6 + 16))) : 0;
        return { ...it, bw: w, bh: h, slot: Math.max(w, bw, it.kind === 'op' ? 30 : 58, (it.label || '').length * 7.4, (it.shape || '').length * 6.4) };
      });
      // flow into rows
      const rows = [[]]; let x = 0;
      items.forEach(it => { if (x + it.slot > rowW - 20 && rows[rows.length - 1].length) { rows.push([]); x = 0; } rows[rows.length - 1].push(it); x += it.slot + gap; });
      const rowH = rows.map(r => Math.max(...r.map(i => i.bh)) + labelH + Math.max(0, ...r.map(i => (i.badges || []).length)) * 22 + 34);
      const H = rowH.reduce((a, b) => a + b, 0) + 10;
      stage.innerHTML = '';
      const svg = el('svg', { viewBox: `0 0 ${rowW} ${H}`, role: 'img', 'aria-label': spec.title }, stage);
      const defs = el('defs', {}, svg);
      const mk = el('marker', { id: `ah-${spec.id || 'a'}`, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0 0 L10 5 L0 10 z', fill: 'rgba(255,255,255,0.4)' }, mk);
      const links = el('g', {}, svg), nodes = el('g', {}, svg);
      let y0 = 6; const placed = [], rowTop = [];
      rows.forEach((r, ri) => {
        rowTop.push(y0);
        const total = r.reduce((a, i) => a + i.slot, 0) + gap * (r.length - 1);
        let cx = (rowW - total) / 2;
        const midY = y0 + Math.max(...r.map(i => i.bh)) / 2 + 26;
        r.forEach(it => { placed.push({ it, x: cx, mid: midY, row: ri, cxm: cx + it.slot / 2 }); cx += it.slot + gap; });
        y0 += rowH[ri];
      });
      // connectors
      placed.forEach((p, i) => {
        const q = placed[i + 1]; if (!q) return;
        const ax = p.cxm + p.it.bw / 2 + 4, bx = q.cxm - q.it.bw / 2 - 6;
        let d;
        if (p.row === q.row) d = `M${ax} ${p.mid} L${bx} ${q.mid}`;
        else { const yb = rowTop[q.row] - 4; d = `M${ax} ${p.mid} L${Math.min(rowW - 6, ax + 12)} ${p.mid} L${Math.min(rowW - 6, ax + 12)} ${yb} L8 ${yb} L8 ${q.mid} L${bx} ${q.mid}`; }
        el('path', { d, fill: 'none', stroke: 'rgba(255,255,255,0.22)', 'stroke-width': 1.4, 'marker-end': `url(#ah-${spec.id || 'a'})` }, links);
        if (!reduced) {
          const dot = el('circle', { r: 2.6, fill: T.cyan, opacity: 0.85 }, links);
          el('animateMotion', { dur: `${1.6 + i * 0.05}s`, repeatCount: 'indefinite', path: d, begin: `-${(i * 0.37) % 1.6}s` }, dot);
        }
      });
      // nodes
      placed.forEach(({ it, cxm, mid }) => {
        const g = el('g', { class: 'arch-node', 'data-k': it.id, tabindex: 0, role: 'button', 'aria-label': `${it.label}: ${it.shape || ''}` }, nodes);
        const left = cxm - it.bw / 2, top = mid - it.bh / 2;
        const c = it.color;
        el('rect', { x: left - 8, y: top - 8, width: it.bw + 16, height: it.bh + 16 + labelH, rx: 12, class: 'arch-hit' }, g);
        if (it.kind === 'input' || it.kind === 'block') {
          const fx = left, fy = top + it.d * 0.5, dx = it.d * 0.7, dy = it.d * 0.5;
          el('path', { d: `M${fx} ${fy} L${fx + dx} ${fy - dy} L${fx + dx + it.w} ${fy - dy} L${fx + it.w} ${fy} Z`, fill: alpha(c, 0.32), stroke: c, 'stroke-width': 1 }, g);
          el('path', { d: `M${fx + it.w} ${fy} L${fx + it.w + dx} ${fy - dy} L${fx + it.w + dx} ${fy - dy + it.h} L${fx + it.w} ${fy + it.h} Z`, fill: alpha(c, 0.2), stroke: c, 'stroke-width': 1 }, g);
          el('rect', { x: fx, y: fy, width: it.w, height: it.h, fill: alpha(c, 0.16), stroke: c, 'stroke-width': 1.2 }, g);
          if (it.kind === 'input') {
            const px = ['0000000', '0111110', '0000110', '0001100', '0011000', '0011000', '0000000'];
            const s = it.w / 7;
            px.forEach((row, i) => [...row].forEach((v, j) => { if (v === '1') el('rect', { x: fx + j * s + 0.5, y: fy + i * s + 0.5, width: s - 1, height: s - 1, fill: alpha(T.ink, 0.85) }, g); }));
          } else {
            for (let k = 1; k < 4; k++) el('line', { x1: fx + it.w + (dx * k) / 4, y1: fy - (dy * k) / 4, x2: fx + it.w + (dx * k) / 4, y2: fy - (dy * k) / 4 + it.h, stroke: alpha(c, 0.35) }, g);
          }
        } else if (it.kind === 'op') {
          el('circle', { cx: cxm, cy: mid, r: 15, fill: alpha(c, 0.18), stroke: c, 'stroke-width': 1.2 }, g);
          el('path', { d: `M${cxm - 9} ${mid + 5} L${cxm} ${mid + 5} L${cxm + 9} ${mid - 7}`, fill: 'none', stroke: c, 'stroke-width': 1.8, 'stroke-linecap': 'round' }, g);
        } else if (it.kind === 'attn') {
          el('rect', { x: left, y: top, width: 52, height: 52, rx: 10, fill: alpha(c, 0.12), stroke: c, 'stroke-dasharray': '4 3', 'stroke-width': 1.3 }, g);
          [0.9, 0.3, 0.7, 0.15, 0.55].forEach((v, k) => el('rect', { x: left + 8 + k * 7.6, y: top + 42 - v * 30, width: 5, height: v * 30, rx: 1.5, fill: alpha(c, 0.4 + 0.6 * v) }, g));
        } else if (it.kind === 'custom') {
          it.draw(g, left, top, cxm, mid);
        } else if (it.kind === 'vec') {
          for (let k = 0; k < 14; k++) el('rect', { x: left, y: top + k * (it.h / 14), width: 14, height: it.h / 14 - 1.5, rx: 1.5, fill: alpha(c, 0.25 + 0.5 * ((k * 37) % 10) / 10) }, g);
        } else if (it.kind === 'nodes') {
          for (let k = 0; k < 8; k++) el('circle', { cx: cxm, cy: top + 7 + k * ((it.h - 14) / 7), r: 6, fill: alpha(c, 0.3), stroke: c, 'stroke-width': 1 }, g);
        } else {
          const probs = [0.01, 0.02, 0.03, 0.04, 0.01, 0.02, 0.01, 0.8, 0.03, 0.03];
          probs.forEach((p, k) => {
            const yy = top + k * (it.h / 10);
            el('rect', { x: left + 12, y: yy + 1, width: Math.max(2, p * 44), height: it.h / 10 - 3, rx: 1.5, fill: alpha(c, k === 7 ? 0.95 : 0.4) }, g);
            const t = el('text', { x: left + 6, y: yy + it.h / 20 + 3, 'text-anchor': 'middle', class: 'arch-small' }, g); t.textContent = k;
          });
        }
        const lt = el('text', { x: cxm, y: mid + it.bh / 2 + 20, 'text-anchor': 'middle', class: 'arch-label' }, g); lt.textContent = it.label;
        if (it.shape) { const st = el('text', { x: cxm, y: mid + it.bh / 2 + 36, 'text-anchor': 'middle', class: 'arch-shape' }, g); st.textContent = it.shape; }
        (it.badges || []).forEach(([key, text], k) => {
          const bg = el('g', { class: 'arch-node arch-badge', 'data-k': key, tabindex: 0, role: 'button', 'aria-label': text }, nodes);
          const by = mid + it.bh / 2 + 46 + k * 22, bw2 = Math.max(64, text.length * 6.6 + 16);
          el('rect', { x: cxm - bw2 / 2, y: by, width: bw2, height: 18, rx: 9, fill: alpha(T.amber, 0.08), stroke: alpha(T.amber, 0.55) }, bg);
          const bt = el('text', { x: cxm, y: by + 12.5, 'text-anchor': 'middle', class: 'arch-badge-t' }, bg); bt.textContent = text;
        });
      });
      stage.querySelectorAll('[data-k]').forEach(n => {
        const k = n.dataset.k;
        n.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') show(k); });
        n.addEventListener('click', () => show(k));
        n.addEventListener('focus', () => show(k));
        n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(k); } });
      });
      show(current);
    };
    let lastW = 0;
    new ResizeObserver(() => { const w = stage.getBoundingClientRect().width; const bucket = w < 520 ? 0 : w < 900 ? 1 : 2; if (bucket !== lastW) { lastW = bucket; render(); } }).observe(stage);
    lastW = -1;
    render();
  }

  root.Labs = root.Labs || {};
  root.Labs.architectures = { cnn: elx => build(elx, { ...CNN, id: 'cnn' }), linreg: elx => build(elx, { ...LINREG, id: 'linreg' }),
    transformer: elx => build(elx, { ...TRANSFORMER, id: 'transformer' }), tokenizer: elx => build(elx, { ...TOKENIZER, id: 'tokenizer' }), embedding: elx => build(elx, { ...EMBEDDING, id: 'embedding' }) };
})(window);
