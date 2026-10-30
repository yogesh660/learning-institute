// Neural networks path. See regression.js for conventions.
const r = String.raw;

module.exports = [
  {
    id: 'perceptron', short: 'Perceptron', title: 'The Perceptron',
    task: 'classification', module: 'From neurons to networks', level: 1, minutes: 14,
    summary: r`The 1958 ancestor of every neural network: a single neuron that nudges its weights each time it makes a mistake.`,
    lead: r`The perceptron computes $\operatorname{sign}(w^\top x + b)$. Whenever it misclassifies a point, it adds that point (times its label) to the weights. If the classes can be separated by a line, this simple rule is guaranteed to find one.`,
    intuition: [
      r`Picture the weight vector $w$ as an arrow perpendicular to the boundary. A misclassified positive point lies on the wrong side, so adding it to $w$ swings the arrow (and the boundary) toward it. A misclassified negative point is subtracted, which swings the boundary away.`,
      r`Rosenblatt’s convergence theorem says that if a separating line exists with margin $\gamma$, the perceptron makes at most $(R/\gamma)^2$ mistakes. But if no line separates the classes, it never settles: it keeps cycling. Fixing that, by adding hidden layers and smooth activations, led to the [[mlp_classifier|multi-layer perceptron]].`,
    ],
    analogy: r`A doorman with a checklist who adjusts how much each item counts every time he lets in the wrong person.`,
    steps: [r`Initialise $w = 0$, $b = 0$.`, r`Loop over the training points in random order.`, r`If $y_i(w^\top x_i + b) \le 0$, update $w \leftarrow w + \eta y_ix_i$ and $b \leftarrow b + \eta y_i$.`, r`Stop when an epoch passes with no mistakes, or after a set number of epochs.`],
    math: [
      { h: 'Update rule', tex: r`$$\text{if } y_i(w^\top x_i + b) \le 0: \quad w \leftarrow w + \eta\,y_i x_i, \quad b \leftarrow b + \eta\,y_i$$`, p: r`Labels are $\pm 1$. This is stochastic gradient descent on the "perceptron loss" $\max(0, -y_if(x_i))$.` },
      { h: 'Novikoff’s bound', tex: r`$$\#\text{mistakes} \le \Big(\frac{R}{\gamma}\Big)^2, \qquad R = \max_i\lVert x_i\rVert$$`, p: r`On separable data the number of updates is finite, however many points there are.` },
    ],
    hyper: [[r`eta0`, r`Learning rate.`, r`With zero initialisation it only rescales $w$; 1.0 is fine.`], [r`max_iter`, r`Epoch limit.`, r`Needed because non-separable data never converges.`], [r`penalty, alpha`, r`Optional regularisation.`, r`Usually none.`]],
    pros: ['Very simple, online, and fast.', 'Guaranteed to converge on separable data.', 'Historically and conceptually foundational.'],
    cons: ['Never converges on non-separable data.', 'No probabilities and no margin maximisation.', 'Linear boundaries only.'],
    use: r`Teaching, online learning on separable streams, or as a building block to understand neural nets.`,
    avoid: r`Real problems; use logistic regression or a linear SVM instead.`,
    complexity: [r`$O(\text{epochs}\cdot n\,p)$`, r`$O(p)$`],
    glance: { learns: 'One weight per feature + bias', family: 'Linear, online' },
    code: r`from sklearn.linear_model import Perceptron
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

model = make_pipeline(StandardScaler(), Perceptron(max_iter=1000, tol=1e-3, random_state=0)).fit(X_tr, y_tr)
print("test accuracy:", round(model.score(X_te, y_te), 3), "epochs run:", model[-1].n_iter_)`,
    pitfalls: [r`Expecting convergence on overlapping classes.`, r`Reading the final weights as meaningful when training stopped at an arbitrary epoch.`],
    quiz: [
      {
        q: r`When does the perceptron update its weights?`,
        o: [
          r`After every point`,
          r`Only when a point is misclassified`,
          r`Only at the end of an epoch`,
          r`When the loss increases`,
        ],
        a: 1,
        why: r`Correct points with $y_if(x_i) > 0$ cause no update.`,
        d: 1,
      },
      {
        q: r`On the XOR problem a single perceptron will:`,
        o: [
          r`Converge quickly`,
          r`Never find a perfect boundary`,
          r`Overfit`,
          r`Output probabilities`,
        ],
        a: 1,
        why: r`XOR is not linearly separable, so no single line classifies it.`,
        d: 1,
      },
      {
        q: r`Which geometric object defines the decision boundary of a perceptron in a 2D feature space?`,
        o: [
          r`A collection of axis-aligned step functions`,
          r`A parabolic curve that bends around the denser class`,
          r`A circular contour centred on the mean of the training points`,
          r`A straight line where $w_1 x_1 + w_2 x_2 + b = 0$`,
        ],
        a: 3,
        why: r`The decision boundary is the affine hyperplane $w^\top x + b = 0$, which is a straight line in two dimensions.`,
        d: 1,
      },
      {
        q: r`Why is a standard perceptron unable to output calibrated class probabilities like logistic regression?`,
        o: [
          r`It uses L1 regularisation instead of L2 regularisation`,
          r`It updates weights after every epoch rather than after each sample`,
          r`Its activation function is a hard step function $\operatorname{sign}(\cdot)$ with no probabilistic loss formulation`,
          r`It requires all feature values to be strictly non-negative`,
        ],
        a: 2,
        why: r`The perceptron outputs hard binary decisions via the step function $\operatorname{sign}(w^\top x + b)$ and does not model posterior class probabilities $P(y=1 \mid x)$.`,
        d: 1,
      },
      {
        q: r`A perceptron has current weights $w = [1.0, -1.0]^\top$, bias $b = 0$, and learning rate $\eta = 1.0$. It encounters a training example $x = [2.0, 1.0]^\top$ with true label $y = -1$. What are the updated weights and bias?`,
        o: [
          r`$w = [-1.0, -2.0]^\top, b = -1.0$`,
          r`$w = [1.0, -1.0]^\top, b = 0.0$ (no change because the point is classified correctly)`,
          r`$w = [3.0, 0.0]^\top, b = 1.0$`,
          r`$w = [0.0, -3.0]^\top, b = -2.0$`,
        ],
        a: 0,
        why: r`The predicted score is $w^\top x + b = 1(2) - 1(1) + 0 = +1$, so $y(w^\top x + b) = -1(+1) = -1 \le 0$ (a mistake). The update rule gives $w \leftarrow w + \eta y x = [1, -1]^\top + (-1)[2, 1]^\top = [-1, -2]^\top$, and $b \leftarrow 0 + (-1) = -1$.`,
        d: 2,
      },
      {
        q: r`In a standard perceptron initialised at $w = 0, b = 0$, what happens if you change the learning rate $\eta$ from $1.0$ to $0.01$ (with identical sample ordering)?`,
        o: [
          r`The sequence of misclassifications and the final decision boundary are identical, as weights and bias are merely scaled by a constant factor`,
          r`The model learns a completely different non-linear decision boundary`,
          r`The model requires exactly 100 times more epochs to converge on linearly separable data`,
          r`The model avoids cycling on non-separable data`,
        ],
        a: 0,
        why: r`Since both $w$ and $b$ start at 0, every update is linear in $\eta$. The score $w^\top x + b$ at every step is simply scaled by $\eta$, so the sign $\operatorname{sign}(w^\top x + b)$ and the sequence of mistakes are completely invariant to $\eta > 0$.`,
        d: 2,
      },
      {
        q: r`If the training dataset contains two classes that overlap and cannot be separated by any straight line, how does the perceptron learning algorithm behave when run without an iteration limit?`,
        o: [
          r`It converges to the maximum-margin hyperplane`,
          r`It halts automatically when the training error reaches its minimum possible value`,
          r`It cycles indefinitely through different weight vectors without ever terminating`,
          r`The weights exponentially decay to zero`,
        ],
        a: 2,
        why: r`The perceptron stops only when an entire epoch passes with zero mistakes. If no separating hyperplane exists, at least one point will always be misclassified in every epoch, causing the algorithm to loop endlessly.`,
        d: 2,
      },
      {
        q: r`Both the perceptron and a hard-margin Linear Support Vector Classifier find a separating hyperplane on linearly separable data. What is the key difference in the boundary they select?`,
        o: [
          r`The perceptron always finds the boundary with the largest possible margin`,
          r`The perceptron can only separate data in one dimension`,
          r`The perceptron uses quadratic programming, whereas the SVM uses stochastic gradient descent`,
          r`The perceptron stops at the first valid separating hyperplane it happens upon, whereas the hard-margin SVM finds the unique hyperplane that maximises the margin`,
        ],
        a: 3,
        why: r`The perceptron terminates as soon as all training points are correctly classified, meaning its final boundary depends heavily on initialisation and data ordering. A linear SVM explicitly maximises the geometric margin $\frac{2}{\|w\|}$, yielding a unique, robust boundary.`,
        d: 2,
      },
      {
        q: r`The perceptron update rule can be viewed as stochastic gradient descent on which loss function for a single example $(x_i, y_i)$ with $y_i \in \{-1, +1\}$?`,
        o: [
          r`Cross-entropy loss $L = -\log(1 + e^{-y_i f(x_i)})$`,
          r`Mean squared error $L = (y_i - f(x_i))^2$`,
          r`Perceptron loss $L = \max(0, -y_i(w^\top x_i + b))$`,
          r`0-1 step loss $L = \mathbb{I}[y_i f(x_i) \le 0]$`,
        ],
        a: 2,
        why: r`When $y_i(w^\top x_i + b) \le 0$, the loss is $-y_i(w^\top x_i + b)$, whose sub-gradient with respect to $w$ is $-y_i x_i$. Subtracting the gradient ($\times \eta$) yields the exact perceptron update $w \leftarrow w + \eta y_i x_i$. When correctly classified, loss and gradient are 0.`,
        d: 2,
      },
      {
        q: r`A linearly separable dataset has all feature vectors bounded inside an origin-centred sphere of radius $R = 6.0$. A separating hyperplane exists with a geometric margin of $\gamma = 0.5$. According to Novikoff's theorem, what is the maximum number of mistakes (weight updates) the perceptron can make starting from $w = 0$?`,
        o: [
          r`24`,
          r`72`,
          r`576`,
          r`144`,
        ],
        a: 3,
        why: r`By Novikoff’s convergence theorem, the maximum number of mistakes is bounded by $(R / \gamma)^2 = (6.0 / 0.5)^2 = 12^2 = 144$. Notably, this bound is independent of the number of training samples $N$.`,
        d: 3,
      },
      {
        q: r`A perceptron with $\eta = 1.0$ starts at $w = [0, 0]^\top, b = 0$. It encounters $x_1 = [1, 2]^\top$ ($y_1 = +1$), then $x_2 = [2, 0]^\top$ ($y_2 = -1$). Both trigger updates. What is the resulting score $w^\top x_3 + b$ when evaluated on a new point $x_3 = [1, 1]^\top$?`,
        o: [
          r`$+1.0$`,
          r`$-2.0$`,
          r`$+3.0$`,
          r`$0.0$`,
        ],
        a: 0,
        why: r`After $x_1$, $w = [1, 2]^\top$ and $b = 1$. For $x_2$, score is $1(2) + 2(0) + 1 = 3 > 0$, misclassifying negative point $y_2 = -1$. Updating gives $w = [1, 2]^\top - [2, 0]^\top = [-1, 2]^\top$ and $b = 1 - 1 = 0$. Evaluating at $x_3 = [1, 1]^\top$ gives $(-1)(1) + 2(1) + 0 = +1.0$.`,
        d: 3,
      },
      {
        q: r`If all training feature vectors $x_i$ are multiplied by a positive scalar $c = 3.0$ while labels remain unchanged, what happens to Novikoff's theoretical mistake bound $(R / \gamma)^2$?`,
        o: [
          r`The bound increases by a factor of 9 because $R^2$ increases by $3^2 = 9$`,
          r`The bound remains completely unchanged because the geometric margin $\gamma$ scales up by the exact same factor $c$ as the radius $R$`,
          r`The bound decreases by a factor of 3 because larger coordinates provide stronger gradient signals`,
          r`The bound becomes infinite because the data is no longer compact`,
        ],
        a: 1,
        why: r`Scaling all input vectors by $c$ scales the maximum radius to $cR$ and also widens the geometric distance of the closest point to the separating hyperplane to $c\gamma$. Therefore, $\frac{cR}{c\gamma} = \frac{R}{\gamma}$, and the upper bound on mistakes $(R / \gamma)^2$ is strictly scale-invariant.`,
        d: 3,
      },
    ],
    related: ['logistic_regression', 'mlp_classifier', 'support_vector_classifier'],
    prereq: ['gradient-descent'],
    concepts: ['gradient-descent', 'loss-functions'],
    labIntro: r`Watch the perceptron learn one update at a time. The highlighted point is the mistake that triggered the latest update.`,
    tryThis: [r`On "separable" data, press <em>Play</em> and count the updates until it stops.`, r`Switch to "XOR": the boundary keeps flipping and never settles.`],
    keywords: 'perceptron rosenblatt neuron linear online update rule',
  },
  {
    id: 'mlp_classifier', short: 'MLP classifier', title: 'Multi-Layer Perceptron Classification',
    task: 'classification', module: 'From neurons to networks', level: 2, minutes: 22,
    summary: r`Hidden layers of neurons learn their own features, so the network can draw any boundary. The core of deep learning.`,
    lead: r`Stack layers of neurons with non-linear activations between them, end with a softmax, and train everything jointly with backpropagation. Hidden layers learn intermediate features, which lets the network carve curved, even disconnected, decision regions.`,
    intuition: [
      r`Each hidden ReLU unit draws one line through the input space and outputs "how far past the line" a point is. The next layer combines these half-planes into polygons, curves and islands. That is how a two-layer network solves XOR, which no single perceptron can.`,
      r`Training is [[gradient-descent]] on cross-entropy loss. Backpropagation applies the chain rule layer by layer to get every weight’s gradient in one backward sweep. Initialisation, learning rate, batch size, L2 penalty and early stopping all matter.`,
    ],
    analogy: r`A team where the first row of workers each draws one rule of thumb, and the second row learns how to combine those rules into a decision.`,
    steps: [r`Scale the inputs.`, r`Forward: $h = \text{ReLU}(W_1x + b_1)$, $p = \text{softmax}(W_2h + b_2)$.`, r`Loss: cross-entropy plus L2 penalty.`, r`Backward: propagate $\partial L/\partial z = p - y$ back through the layers.`, r`Update with Adam on mini-batches; stop early on validation loss.`],
    math: [
      { h: 'Softmax output and cross-entropy', tex: r`$$p_c = \frac{e^{z_c}}{\sum_{c'} e^{z_{c'}}}, \qquad L = -\sum_c y_c\log p_c, \qquad \frac{\partial L}{\partial z} = p - y$$`, p: r`The gradient at the output is simply "predicted minus true", just as in [[logistic_regression]].` },
      { h: 'Backpropagating through a hidden layer', tex: r`$$\delta_1 = (W_2^\top\delta_2)\odot\mathbb 1[z_1 > 0], \qquad \frac{\partial L}{\partial W_1} = \delta_1 x^\top$$`, p: r`The ReLU derivative is 1 where the unit was active and 0 elsewhere, so gradients only flow through active units.` },
    ],
    hyper: [[r`hidden_layer_sizes`, r`Width and depth.`, r`(32,) to (128, 64).`], [r`activation`, r`relu, tanh or logistic.`, r`relu.`], [r`alpha`, r`L2 penalty.`, r`1e-5 to 1e-2.`], [r`learning_rate_init, batch_size`, r`Optimiser settings.`, r`1e-3; 32–256.`], [r`early_stopping`, r`Hold out validation data.`, r`On.`]],
    pros: ['Learns non-linear features automatically.', 'Scales with data and compute.', 'Same building block as modern deep learning.'],
    cons: ['Many hyperparameters; sensitive to scaling and initialisation.', 'Often beaten by boosting on small tabular data.', 'Black box.'],
    use: r`Large datasets with complex structure, or when you will move on to deep architectures.`,
    avoid: r`Small tabular datasets or when you need an interpretable model.`,
    complexity: [r`$O(\text{epochs}\cdot n\cdot\text{weights})$`, r`$O(\text{weights})$`],
    glance: { learns: 'Weights of every layer', family: 'Neural network' },
    code: r`from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier

mlp = make_pipeline(StandardScaler(),
                    MLPClassifier(hidden_layer_sizes=(64, 32), alpha=1e-3, early_stopping=True,
                                  max_iter=1000, random_state=0)).fit(X_tr, y_tr)
print("test accuracy:", round(mlp.score(X_te, y_te), 3), "epochs:", mlp[-1].n_iter_)`,
    pitfalls: [r`Skipping input scaling.`, r`Judging a network by a single training run; seeds matter.`, r`Comparing to boosting without tuning either.`],
    quiz: [
      {
        q: r`Why can a two-layer network solve XOR but a perceptron cannot?`,
        o: [
          r`It trains for longer`,
          r`Hidden units create intermediate features that make the problem separable`,
          r`It uses a different loss`,
          r`It has a bias term`,
        ],
        a: 1,
        why: r`Two hidden lines carve the plane into regions the output layer can combine.`,
        d: 1,
      },
      {
        q: r`For softmax + cross-entropy, the gradient with respect to the logits is:`,
        o: [
          r`$y - p$`,
          r`$p - y$`,
          r`$p(1-p)$`,
          r`$\log p$`,
        ],
        a: 1,
        why: r`A clean result that makes training stable and fast.`,
        d: 2,
      },
      {
        q: r`What would happen if a multi-layer perceptron had 10 hidden layers, but every layer used a linear activation function ($f(z) = z$)?`,
        o: [
          r`The network would become equivalent to a single linear model, because the composition of linear transformations is strictly linear`,
          r`The network would be able to fit any non-linear function due to having 10 layers of parameters`,
          r`The backpropagation gradient would explode exponentially to infinity at every step`,
          r`The network would automatically learn decision trees at each layer`,
        ],
        a: 0,
        why: r`Without non-linear activation functions, multiplying successive weight matrices $W_{10} W_9 \dots W_1 x$ collapses into a single matrix $W_{\text{eff}} x$, restricting the model to linear decision boundaries.`,
        d: 1,
      },
      {
        q: r`Why is it standard practice to apply StandardScaler to input features before feeding them into an MLP?`,
        o: [
          r`Neural networks cannot process negative numerical inputs`,
          r`Unscaled features cause the output softmax probabilities to sum to more than 1.0`,
          r`Feature scaling is required by the mathematical definition of the ReLU activation function`,
          r`Disparate feature scales cause gradients to oscillate unevenly, slowing down gradient descent and biasing regularisation penalties`,
        ],
        a: 3,
        why: r`Unscaled features create elongated, elliptical loss surfaces where gradient descent oscillates wildly. Standardising features to zero mean and unit variance makes the contours spherical and ensures L2 regularisation penalises weights fairly.`,
        d: 1,
      },
      {
        q: r`What is the primary role of enabling early_stopping=True in MLPClassifier?`,
        o: [
          r`To stop training as soon as the training loss drops below a predetermined constant`,
          r`To switch the optimiser from Adam to stochastic gradient descent halfway through training`,
          r`To prevent overfitting by monitoring validation loss and halting when it fails to improve for several epochs`,
          r`To prune hidden neurons with zero incoming weights`,
        ],
        a: 2,
        why: r`Early stopping reserves a validation set from the training data. If validation score stops improving for a patience window, training halts and the best weights are restored, guarding against overfitting.`,
        d: 1,
      },
      {
        q: r`A single hidden layer has 2 ReLU neurons. Given input $x = [2.0, -1.0]^\top$, weight matrix $W = \begin{bmatrix} 1.0 & 3.0 \\ 1.0 & 2.0 \end{bmatrix}$, and bias vector $b = [0.5, 1.5]^\top$, what is the activated hidden vector $h = \text{ReLU}(Wx + b)$?`,
        o: [
          r`$[0.5, 2.5]^\top$`,
          r`$[-0.5, 1.5]^\top$`,
          r`$[0.0, 1.5]^\top$`,
          r`$[0.0, 0.0]^\top$`,
        ],
        a: 2,
        why: r`Pre-activation for neuron 1 is $1(2) + 3(-1) + 0.5 = -0.5$. Since $-0.5 \le 0$, $\text{ReLU}(-0.5) = 0.0$. For neuron 2, $1(2) + 2(-1) + 1.5 = +1.5$. Since $1.5 > 0$, $\text{ReLU}(1.5) = 1.5$. Thus $h = [0.0, 1.5]^\top$.`,
        d: 2,
      },
      {
        q: r`A 3-class classification MLP produces output logits $z = [\ln 4, \, \ln 2, \, \ln 2]$. What are the resulting softmax class probabilities $[p_1, p_2, p_3]$?`,
        o: [
          r`$[0.50, \, 0.25, \, 0.25]$`,
          r`$[0.60, \, 0.20, \, 0.20]$`,
          r`$[0.33, \, 0.33, \, 0.33]$`,
          r`$[0.40, \, 0.30, \, 0.30]$`,
        ],
        a: 0,
        why: r`The unnormalised exponents are $e^{\ln 4} = 4$, $e^{\ln 2} = 2$, and $e^{\ln 2} = 2$. The normalising sum is $4 + 2 + 2 = 8$. Dividing each by 8 yields $p_1 = 4/8 = 0.50$, $p_2 = 2/8 = 0.25$, and $p_3 = 2/8 = 0.25$.`,
        d: 2,
      },
      {
        q: r`What is the "dying ReLU" problem during MLP training?`,
        o: [
          r`Neurons saturate at $+1.0$ because activations grow without bound`,
          r`The softmax denominator approaches 0, causing division by zero`,
          r`The learning rate decays to 0 before the loss function reaches a local minimum`,
          r`Neurons receive large negative pre-activations, outputting 0 with derivative 0, so gradient updates can no longer revive them`,
        ],
        a: 3,
        why: r`For any input where pre-activation $z \le 0$, the ReLU output is 0 and its derivative $\mathbb{1}[z > 0]$ is 0. If a large gradient knocks a neuron's weights such that $z \le 0$ for all training points, no gradient will ever flow back to update it, rendering the neuron permanently inactive ("dead").`,
        d: 2,
      },
      {
        q: r`An MLP takes an input with 4 features, has a single hidden layer of 10 neurons, and outputs class scores for a 3-class classification problem. Including all weights and biases, how many learnable parameters does this network have?`,
        o: [
          r`70`,
          r`73`,
          r`90`,
          r`83`,
        ],
        a: 3,
        why: r`Input-to-hidden layer requires $4 \times 10 = 40$ weights plus 10 biases ($50$ parameters). Hidden-to-output layer requires $10 \times 3 = 30$ weights plus 3 biases ($33$ parameters). Total learnable parameters $= 50 + 33 = 83$.`,
        d: 2,
      },
      {
        q: r`A network with softmax output for a 3-class problem computes predicted probabilities $p = [0.4, 0.4, 0.2]^\top$. The true target label is class 1 (one-hot vector $y = [1, 0, 0]^\top$). What is the exact gradient vector $\frac{\partial L}{\partial z}$ of the cross-entropy loss with respect to the logits $z$?`,
        o: [
          r`$[-0.6, +0.4, +0.2]^\top$`,
          r`$[+0.6, -0.4, -0.2]^\top$`,
          r`$[-0.4, +0.4, +0.2]^\top$`,
          r`$[0.0, +0.4, +0.2]^\top$`,
        ],
        a: 0,
        why: r`For softmax cross-entropy, $\frac{\partial L}{\partial z} = p - y$. Here, $[0.4 - 1.0, \, 0.4 - 0.0, \, 0.2 - 0.0]^\top = [-0.6, +0.4, +0.2]^\top$. The negative gradient on the true class increases its logit under gradient descent, while the positive gradients on the other classes push their logits down.`,
        d: 3,
      },
      {
        q: r`In a network with 2 hidden ReLU neurons and 2 outputs, the incoming gradient from the output layer is $\delta_2 = [0.5, -0.5]^\top$. The connecting weight matrix is $W_2 = \begin{bmatrix} 2.0 & -1.0 \\ 1.0 & 3.0 \end{bmatrix}$ (where row $k$ connects hidden units to output $k$). The hidden pre-activation was $z_1 = [1.2, -0.4]^\top$. What is the backpropagated error vector $\delta_1 = (W_2^\top \delta_2) \odot \mathbb{1}[z_1 > 0]$?`,
        o: [
          r`$[0.5, -2.0]^\top$`,
          r`$[0.5, 0.0]^\top$`,
          r`$[0.0, -2.0]^\top$`,
          r`$[1.0, 0.0]^\top$`,
        ],
        a: 1,
        why: r`First, $W_2^\top \delta_2 = \begin{bmatrix} 2.0 & 1.0 \\ -1.0 & 3.0 \end{bmatrix} \begin{bmatrix} 0.5 \\ -0.5 \end{bmatrix} = \begin{bmatrix} 2(0.5) + 1(-0.5) \\ -1(0.5) + 3(-0.5) \end{bmatrix} = \begin{bmatrix} 0.5 \\ -2.0 \end{bmatrix}$. Next, because neuron 2 was inactive ($z_{1,2} = -0.4 \le 0$), its ReLU derivative is 0, while neuron 1 was active ($z_{1,1} = 1.2 > 0$) with derivative 1. Multiplying elementwise yields $[0.5 \times 1, -2.0 \times 0]^\top = [0.5, 0.0]^\top$.`,
        d: 3,
      },
      {
        q: r`In MLPClassifier, the loss function includes an L2 regularisation term with penalty parameter alpha ($\frac{\alpha}{2} \sum \|W\|^2$). During stochastic gradient descent with learning rate $\eta$, how does this regularisation term modify the weight update for each weight matrix $W$?`,
        o: [
          r`It sets weights with absolute magnitude smaller than $\eta \alpha$ directly to zero`,
          r`It subtracts a constant value $\eta \alpha \operatorname{sgn}(W)$ regardless of weight magnitude`,
          r`It shrinks the weights by a factor of $(1 - \eta \alpha)$ before subtracting the data loss gradient`,
          r`It clips the maximum eigenvalue of $W$ to $1 / \alpha$`,
        ],
        a: 2,
        why: r`The regularised loss is $L_{\text{total}} = L_{\text{data}} + \frac{\alpha}{2}\|W\|^2$. The gradient is $\nabla L_{\text{data}} + \alpha W$. The update step is $W \leftarrow W - \eta(\nabla L_{\text{data}} + \alpha W) = (1 - \eta \alpha)W - \eta \nabla L_{\text{data}}$, which acts as an exponential multiplicative shrinkage (weight decay) on each step.`,
        d: 3,
      },
    ],
    related: ['mlp_regressor', 'perceptron', 'convolutional_neural_networks'],
    prereq: ['perceptron', 'logistic_regression'],
    concepts: ['gradient-descent', 'loss-functions', 'regularization'],
    labIntro: r`A real neural network trained in your browser with backpropagation. Watch the boundary bend as the loss falls.`,
    tryThis: [r`Solve "XOR" with 4 hidden units. Then try it with 1: impossible.`, r`On "spiral", use 2 layers of 16 and be patient.`, r`Crank the learning rate until the loss curve starts to jump.`],
    keywords: 'mlp neural network classifier backpropagation hidden layer relu softmax',
  },
  {
    id: 'convolutional_neural_networks', short: 'CNNs', title: 'Convolutional Neural Networks (CNNs)',
    task: 'classification', module: 'Deep architectures', level: 3, minutes: 24,
    summary: r`Networks that slide small learned filters across an image, so they spot the same pattern wherever it appears.`,
    lead: r`A convolutional layer slides a small grid of weights (a filter) across the image and records how strongly each patch matches. Stacking such layers builds up from edges to textures to parts to objects.`,
    intuition: [
      r`A fully connected network on a 224×224 colour image would need 150,000 weights <em>per neuron</em> and would have to learn "cat ear" separately for every position. Convolution shares one small filter across all positions (<strong>weight sharing</strong>) and looks at local patches only (<strong>local connectivity</strong>). The same edge detector works everywhere: translation equivariance.`,
      r`After convolution, a non-linearity (ReLU) keeps only positive evidence, and pooling summarises small neighbourhoods so the representation shrinks and becomes tolerant to small shifts. Deeper layers see larger regions of the original image (a larger receptive field), so they can respond to bigger structures. A classifier head on top turns the final features into class probabilities.`,
    ],
    analogy: r`Scanning a page with a magnifying glass that lights up whenever it passes over a particular shape.`,
    steps: [r`Convolve the input with $K$ learned filters to produce $K$ feature maps.`, r`Apply ReLU.`, r`Pool (e.g. 2×2 max) to downsample.`, r`Repeat conv–ReLU–pool blocks, increasing the number of filters.`, r`Flatten or global-average-pool, then a dense softmax layer.`, r`Train end-to-end with cross-entropy and backpropagation; augment data (flips, crops) to generalise.`],
    math: [
      { h: 'Discrete 2-D convolution (cross-correlation)', tex: r`$$S(i, j) = \sum_{m}\sum_{n} I(i + m,\, j + n)\,K(m, n) + b$$`, p: r`Each output pixel is the dot product of the filter with the patch under it. Deep-learning libraries use cross-correlation and still call it convolution.` },
      { h: 'Output size', tex: r`$$H_{\text{out}} = \Big\lfloor\frac{H_{\text{in}} + 2P - F}{S}\Big\rfloor + 1$$`, p: r`$F$ = filter size, $P$ = padding, $S$ = stride. A 3×3 filter with padding 1 and stride 1 keeps the size.` },
      { h: 'Parameter count', tex: r`$$\#\text{params} = (F\cdot F\cdot C_{\text{in}} + 1)\cdot C_{\text{out}}$$`, p: r`A 3×3 conv from 64 to 128 channels has about 74k weights, regardless of image size.` },
    ],
    hyper: [[r`filters, kernel size`, r`Number and size of learned patterns.`, r`32→64→128…, 3×3.`], [r`stride, padding`, r`Step size and border handling.`, r`stride 1, "same" padding.`], [r`pooling`, r`Downsampling.`, r`2×2 max or global average.`], [r`optimiser, lr, weight decay`, r`Training.`, r`AdamW 1e-3 or SGD + momentum with a schedule.`], [r`augmentation`, r`Synthetic variations of images.`, r`Flips, crops, colour jitter.`]],
    pros: ['State of the art on images and other grid data.', 'Far fewer parameters than dense nets thanks to weight sharing.', 'Pre-trained backbones transfer well to new tasks.'],
    cons: ['Needs lots of labelled data or transfer learning.', 'GPU-hungry training.', 'Hard to interpret; vulnerable to adversarial perturbations.'],
    use: r`Images, spectrograms, some time series and any data with local spatial structure.`,
    avoid: r`Tabular data, where trees win.`,
    complexity: [r`$O(H\,W\,F^2\,C_{\text{in}}\,C_{\text{out}})$ per layer`, r`Same per image`],
    glance: { learns: 'Filters and dense weights', family: 'Deep, convolutional' },
    code: r`import torch, torch.nn as nn

class SmallCNN(nn.Module):
    def __init__(self, n_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),     # 28 -> 14
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),    # 14 -> 7
        )
        self.head = nn.Sequential(nn.Flatten(), nn.Linear(64 * 7 * 7, 128), nn.ReLU(),
                                  nn.Dropout(0.3), nn.Linear(128, n_classes))

    def forward(self, x):
        return self.head(self.features(x))

model = SmallCNN()
print(sum(p.numel() for p in model.parameters()), "parameters")`,
    pitfalls: [r`Training from scratch on a few thousand images; start from a pre-trained backbone.`, r`Forgetting to normalise inputs the way the pre-trained model expects.`, r`Augmenting the validation set.`],
    quiz: [
      {
        q: r`Why do CNNs need far fewer parameters than dense networks on images?`,
        o: [
          r`They use smaller images`,
          r`One small filter is shared across every position`,
          r`They skip the bias`,
          r`They use pooling only`,
        ],
        a: 1,
        why: r`Weight sharing: the same $3\times3$ weights are applied everywhere.`,
        d: 1,
      },
      {
        q: r`A 32×32 input, 5×5 filter, padding 0, stride 1 gives an output of:`,
        o: [
          r`32×32`,
          r`28×28`,
          r`27×27`,
          r`16×16`,
        ],
        a: 1,
        why: r`$(32 + 0 - 5)/1 + 1 = 28$.`,
        d: 2,
      },
      {
        q: r`What does max-pooling add?`,
        o: [
          r`More parameters`,
          r`Downsampling and tolerance to small shifts`,
          r`Colour invariance`,
          r`Non-linearity only`,
        ],
        a: 1,
        why: r`Taking the max over a window keeps the strongest response wherever it occurs in that window.`,
        d: 1,
      },
      {
        q: r`In a convolutional layer, if an object in an image shifts 5 pixels to the right, what happens to the resulting feature map?`,
        o: [
          r`The feature map collapses to a scalar zero`,
          r`The feature values are completely inverted because spatial locality is lost`,
          r`The output feature map remains in the exact same coordinates without moving (strict invariance)`,
          r`The activated features shift 5 pixels to the right in the feature map (translation equivariance)`,
        ],
        a: 3,
        why: r`Convolution is translation equivariant: shifting the input causes the output feature map to shift by the corresponding amount, preserving the spatial layout of detected patterns. Pooling subsequently introduces local translation invariance.`,
        d: 1,
      },
      {
        q: r`Why do modern CNN architectures often use Global Average Pooling (GAP) before the final classification layer instead of flattening all features into a massive dense layer?`,
        o: [
          r`GAP drastically reduces parameter count and prevents overfitting by collapsing each 2D feature map into a single average value`,
          r`GAP enforces that all input images must have exactly the same fixed pixel resolution`,
          r`GAP doubles the number of trainable parameters to improve model capacity`,
          r`GAP eliminates the need for activation functions throughout the entire network`,
        ],
        a: 0,
        why: r`Flattening a $7 \times 7 \times 512$ tensor into a dense layer requires millions of parameters, making the classifier head prone to overfitting. Global average pooling reduces each spatial map to its mean scalar, producing a compact 512-dimensional vector with zero extra parameters.`,
        d: 1,
      },
      {
        q: r`What is meant by the "effective receptive field" of a neuron in a deep convolutional network?`,
        o: [
          r`The total number of non-zero parameters in the neuron's filter kernel`,
          r`The number of channels output by the layer containing that neuron`,
          r`The specific region of the original raw input image that can influence that neuron's activation value`,
          r`The memory allocated to the neuron on the GPU during the backward pass`,
        ],
        a: 2,
        why: r`The receptive field is the patch of pixels in the input image that feeds into that unit through successive convolutions and pooling layers. Deeper units possess wider receptive fields, enabling them to recognise high-level shapes and full objects.`,
        d: 2,
      },
      {
        q: r`What is the primary purpose of using a $1 \times 1$ convolutional layer (pointwise convolution) in deep networks like ResNet or Inception?`,
        o: [
          r`To rotate the input image by 90 degrees`,
          r`To perform spatial downsampling instead of max pooling`,
          r`To increase the spatial resolution of the feature maps`,
          r`To change the number of feature channels while combining cross-channel information, without altering spatial height and width`,
        ],
        a: 3,
        why: r`A $1 \times 1$ filter operates across all input channels at a single pixel location. It computes a linear combination of channels followed by a non-linearity, allowing the network to project channels up or down cheaply while leaving spatial dimensions $(H, W)$ intact.`,
        d: 2,
      },
      {
        q: r`A convolutional layer receives a $64 \times 64$ feature map. It applies a $3 \times 3$ filter with padding $P = 1$ and stride $S = 2$. What is the spatial resolution of the output feature map?`,
        o: [
          r`$31 \times 31$`,
          r`$33 \times 33$`,
          r`$32 \times 32$`,
          r`$64 \times 64$`,
        ],
        a: 2,
        why: r`Using $H_{\text{out}} = \lfloor \frac{H_{\text{in}} + 2P - F}{S} \rfloor + 1$: here $\lfloor \frac{64 + 2(1) - 3}{2} \rfloor + 1 = \lfloor \frac{63}{2} \rfloor + 1 = 31 + 1 = 32$. A stride of 2 with padding 1 cleanly halves the spatial dimension from 64 to 32.`,
        d: 2,
      },
      {
        q: r`When training a CNN on image classification, why is data augmentation (such as random horizontal flips and random crops) applied strictly to the training split and NEVER to the validation or test splits?`,
        o: [
          r`Validation and test splits must measure performance on uncorrupted, real-world data distributions to provide an unbiased evaluation`,
          r`Data augmentation reduces the number of samples in the validation set`,
          r`Applying augmentation to validation data would corrupt the GPU memory cache`,
          r`Convolutional layers cannot process augmented images during evaluation mode`,
        ],
        a: 0,
        why: r`Validation and test sets serve as ground-truth benchmarks for real-world generalisation. Augmenting them would introduce synthetic artefacts and prevent fair, reproducible measurement of model performance.`,
        d: 2,
      },
      {
        q: r`A 2D convolutional layer receives an input with 32 channels and produces 64 output feature maps using $3 \times 3$ filters. Each output filter has an independent learnable bias term. How many learnable parameters does this layer contain?`,
        o: [
          r`6,144`,
          r`18,432`,
          r`73,792`,
          r`18,496`,
        ],
        a: 3,
        why: r`Each of the 64 filters spans all 32 input channels with a $3 \times 3$ kernel, giving $3 \times 3 \times 32 = 288$ weights per filter. Adding 1 bias per filter gives 289 parameters per filter. In total, $64 \times 289 = 18,496$ learnable parameters (completely invariant to the input image's spatial height and width).`,
        d: 3,
      },
      {
        q: r`A $3 \times 3$ patch of an image channel has values $\begin{bmatrix} 1 & 0 & 2 \\ 0 & 3 & 1 \\ 2 & 1 & 0 \end{bmatrix}$. It is convolved with a filter kernel $\begin{bmatrix} 0 & 1 & 0 \\ 1 & -2 & 1 \\ 0 & 1 & 0 \end{bmatrix}$ with bias $b = 1.0$. What is the linear pre-activation value $S$ at this position?`,
        o: [
          r`$-3.0$`,
          r`$+1.0$`,
          r`$+4.0$`,
          r`$-5.0$`,
        ],
        a: 0,
        why: r`Compute the sum of elementwise products: row 1 gives $1(0) + 0(1) + 2(0) = 0$; row 2 gives $0(1) + 3(-2) + 1(1) = -5$; row 3 gives $2(0) + 1(1) + 0(0) = 1$. Adding the rows gives $0 - 5 + 1 = -4$. Finally, adding bias $b = 1.0$ yields $S = -4 + 1 = -3.0$.`,
        d: 3,
      },
      {
        q: r`During the backward pass (backpropagation) through a $2 \times 2$ max-pooling layer with stride 2, how does the incoming gradient $\frac{\partial L}{\partial y}$ get routed to the 4 input units of the pooling window?`,
        o: [
          r`The gradient is divided equally by 4 and distributed to all 4 input units`,
          r`The gradient is routed to the unit with the smallest value to push it towards the mean`,
          r`The full gradient is routed entirely to the single unit that had the maximum forward value, while the other 3 units receive a gradient of zero`,
          r`The gradient is dropped completely because pooling layers have zero learnable parameters`,
        ],
        a: 2,
        why: r`The forward operation is $y = \max(x_1, x_2, x_3, x_4)$. The partial derivative $\frac{\partial y}{\partial x_i}$ is 1 for the winning unit ($x_i = \max$) and 0 for all other units. By the chain rule, the entire incoming gradient flows solely through the winning unit, while the losing units receive zero gradient.`,
        d: 3,
      },
    ],
    related: ['mlp_classifier', 'recurrent_neural_networks'],
    prereq: ['mlp_classifier'],
    concepts: ['gradient-descent', 'regularization'],
    explainer: 'cnn', architecture: 'cnn',
    archIntro: r`A small CNN that reads 28×28 handwritten digits, drawn layer by layer. Hover over any part (or tap it on a phone) to see what it does, its input and output shape and how many weights it learns.`,
    labIntro: r`Pick an image and a filter. The middle panel is the feature map (the filter’s response at each position); the right panel is that map after ReLU and 2×2 max-pooling. Hover over the input to see the patch under the filter.`,
    tryThis: [r`Apply the vertical-edge filter to the square: only the left and right sides light up.`, r`Edit the filter weights by hand and design a horizontal-line detector.`, r`Compare the pooled map with the feature map: same pattern, a quarter of the size.`],
    keywords: 'cnn convolution filter kernel feature map pooling image deep learning',
  },
  // SEQUENCES
];
