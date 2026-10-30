// Lessons for this track. Conventions: see regression.js and CLAUDE.md.
const r = String.raw;
module.exports = [
  {
    id: 'backpropagation-and-autodiff',
    short: 'Backprop and autodiff',
    title: 'Backpropagation and Automatic Differentiation',
    task: 'concepts',
    module: 'Training fundamentals',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Computing exact loss gradients across millions of nested parameters using the multivariate chain rule on directed computation graphs.`,
    lead: r`Neural networks learn by adjusting weights to reduce prediction loss, but computing gradients numerically via finite differences across millions of parameters is computationally impossible. Backpropagation applies the multivariate calculus chain rule in reverse topological order across a directed acyclic computation graph. Reverse-mode automatic differentiation evaluates exact gradients for all parameters simultaneously in a single backward pass with compute cost proportional to the forward pass.`,
    intuition: [
      r`Suppose you train a neural network with 1,000 weights and need the gradient of the loss with respect to each weight. The naive numerical method perturbs weight w_1 by a tiny step epsilon = 0.0001, executes a complete forward pass to measure the change in loss, and divides by epsilon. You must repeat this full forward pass 1,000 times—once for every individual parameter! For modern deep learning models containing billions of weights, computing gradients numerically would take centuries for a single optimisation step.`,
      r`Backpropagation recognizes that any neural network is simply a composite chain of elementary mathematical operations (additions, matrix multiplications, non-linear activations) arranged in a Directed Acyclic Graph (DAG). During the forward pass, data flows from inputs to loss, and intermediate activations are cached in memory. To determine how much an early weight influenced the final scalar loss, we work backwards from the output. By the multivariate chain rule, the gradient at any intermediate node equals the sum of incoming adjoint gradients from its downstream consumers multiplied by the local Jacobian.`,
      r`Forward-mode autodiff propagates tangent derivatives forward alongside activations. It is efficient when a function has few inputs and many outputs. In deep learning, however, the loss function maps millions of parameters to a single scalar loss. Reverse-mode automatic differentiation computes adjoint derivatives backwards from the scalar root, yielding exact, analytically perfect gradients for all parameters simultaneously in approximately twice the computational time of a single forward pass.`,
    ],
    analogy: r`A financial auditor tracing a multi-million-pound deficit back through an enterprise ledger: rather than recalculating the entire global supply chain for every invoice, the auditor works backward from the final balance sheet line-by-line, apportioning exact responsibility to each contributing department.`,
    steps: [
      r`Construct the forward computational tape: trace tensor operations during the forward pass, recording operation types and caching intermediate values needed for local Jacobians.`,
      r`Evaluate terminal scalar loss: compute the objective value $L(y, \hat{y})$ and seed the backward gradient root with $\bar{L} = \partial L / \partial L = 1.0$.`,
      r`Traverse graph in reverse topological order: visit each node from output to input, applying its specific vector-Jacobian product (VJP).`,
      r`Accumulate gradients at branching nodes: when an intermediate tensor feeds multiple downstream operations, sum the adjoint contributions.`,
      r`Update leaf parameter tensors: apply the accumulated gradients via your optimiser and clear intermediate activations to free GPU memory.`,
    ],
    math: [
      {
        h: 'Multivariate chain rule on a directed acyclic graph',
        tex: r`\frac{\partial L}{\partial u_i} = \sum_{j \in \text{Children}(u_i)} \frac{\partial L}{\partial u_j} \frac{\partial u_j}{\partial u_i}`,
        p: r`Where $u_i$ is an intermediate node in the computation graph. The adjoint derivative $\bar{u}_i = \partial L / \partial u_i$ accumulates contributions from all descendant nodes that consumed $u_i$ during forward execution.`,
      },
      {
        h: 'Vector-Jacobian product (VJP) for linear transformations',
        tex: r`Z = X W \implies \frac{\partial L}{\partial X} = \frac{\partial L}{\partial Z} W^T, \qquad \frac{\partial L}{\partial W} = X^T \frac{\partial L}{\partial Z}`,
        p: r`Where $\bar{Z} = \partial L / \partial Z \in \mathbb{R}^{B \times D_{\text{out}}}$ is the incoming gradient tensor, $X \in \mathbb{R}^{B \times D_{\text{in}}}$, and $W \in \mathbb{R}^{D_{\text{in}} \times D_{\text{out}}}$. Gradients are evaluated via matrix transposition without materialising enormous explicit Jacobian tensors.`,
      },
      {
        h: 'Computational complexity bound (Baur–Strassen theorem)',
        tex: r`\text{ops}\left(\nabla L(\mathbf{w})\right) \le c \cdot \text{ops}\left(L(\mathbf{w})\right), \qquad c \approx 2 \text{ to } 5`,
        p: r`The Baur–Strassen theorem guarantees that evaluating the entire gradient vector $\nabla L$ via reverse-mode autodiff requires a small constant multiple $c$ of the forward pass floating-point operations, completely independent of parameter count $P$.`,
      },
    ],
    keyPoints: [
      r`Reverse-mode automatic differentiation evaluates exact gradients for all model parameters in a single backward pass.`,
      r`Branching tensors in computation graphs sum gradients from all downstream consumers (multivariate chain rule).`,
      r`Intermediate forward activations must be retained in memory until the backward pass completes, dictating GPU memory usage during training.`,
    ],
    pitfalls: [
      r`In-place tensor modifications: mutating a tensor in-place overwrites activations required by backward Jacobians, corrupting gradient calculations.`,
      r`Forgetting to zero accumulated gradients: deep learning frameworks accumulate gradients by default; omitting zero_grad() compounds gradients across training steps.`,
      r`Performing finite-difference gradient checks in single precision float32, which introduces numerical roundoff artifacts rather than verifying autodiff correctness.`,
    ],
    code: r`import numpy as np

# Scalar reverse-mode autodiff engine
class Value:
    def __init__(self, data, _children=()):
        self.data = float(data)
        self.grad = 0.0
        self._backward = lambda: None
        self._prev = set(_children)

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other))
        def _backward():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = _backward
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other))
        def _backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad
        out._backward = _backward
        return out

    def tanh(self):
        t = np.tanh(self.data)
        out = Value(t, (self,))
        def _backward():
            self.grad += (1.0 - t**2) * out.grad
        out._backward = _backward
        return out

    def backward(self):
        topo = []
        visited = set()
        def build_topo(v):
            if v not in visited:
                visited.add(v)
                for child in v._prev:
                    build_topo(child)
                topo.append(v)
        build_topo(self)
        self.grad = 1.0
        for node in reversed(topo):
            node._backward()

# Evaluate loss: L = (y - tanh(x*w + b))^2
x, y = Value(2.0), Value(1.0)
w, b = Value(0.5), Value(-0.2)
pred = (x * w + b).tanh()
diff = pred + Value(-y.data)
loss = diff * diff
loss.backward()

# Finite difference verification
eps = 1e-6
w_plus = Value(0.5 + eps)
l_plus = ((x * w_plus + b).tanh() + Value(-y.data)) * ((x * w_plus + b).tanh() + Value(-y.data))
w_minus = Value(0.5 - eps)
l_minus = ((x * w_minus + b).tanh() + Value(-y.data)) * ((x * w_minus + b).tanh() + Value(-y.data))
num_grad_w = (l_plus.data - l_minus.data) / (2 * eps)

print(f"Analytical autodiff gradient dL/dw: {w.grad:.6f}")
print(f"Numerical finite-difference dL/dw:  {num_grad_w:.6f}")
print(f"Absolute discrepancy: {abs(w.grad - num_grad_w):.2e}")`,
    quiz: [
      {
        q: r`Why is reverse-mode automatic differentiation universally preferred over forward-mode automatic differentiation in deep learning?`,
        o: [
          r`Forward-mode cannot compute derivatives of non-linear activations`,
          r`Reverse-mode computes gradients for all input parameters in a single backward pass when the output is a scalar loss, whereas forward-mode requires one pass per parameter`,
          r`Reverse-mode consumes zero GPU memory`,
          r`Forward-mode only works on CPUs`,
        ],
        a: 1,
        why: r`In deep learning, loss functions map millions of parameters to a single scalar loss. Reverse-mode evaluates gradients for all inputs in one reverse pass, whereas forward-mode requires as many passes as there are input parameters.`,
      },
      {
        q: r`In a computation graph, what mathematical rule dictates how gradients are handled when a single tensor feeds into multiple downstream operation branches?`,
        o: [
          r`The gradients from all downstream branches must be multiplied together`,
          r`The gradients from all downstream branches must be summed together (multivariate chain rule)`,
          r`Only the largest downstream gradient is retained`,
          r`The gradient is set to zero to prevent exploding values`,
        ],
        a: 1,
        why: r`By the multivariate chain rule of calculus, if a variable x influences the final output through multiple paths, the total derivative dL/dx is the sum of the derivatives across all individual paths.`,
      },
      {
        q: r`Why does deep learning training consume significantly more GPU memory during backpropagation than during inference?`,
        o: [
          r`Because backward passes compile the network into machine code`,
          r`Because all intermediate layer activations computed in the forward pass must be held in memory to evaluate backward vector-Jacobian products`,
          r`Because weights are doubled in size during backpropagation`,
          r`Because the optimiser creates ten copies of the dataset`,
        ],
        a: 1,
        why: r`Evaluating local derivatives of activations (such as tanh or matrix products) requires the exact forward activation values, forcing frameworks to cache intermediate tensors until the backward pass completes.`,
      },
    ],
    usedBy: [],
    prereq: ['gradient-descent', 'loss-functions'],
    related: ['activation-functions', 'weight-initialisation-xavier-and-he', 'optimisers-sgd-momentum-rmsprop-adam-adamw'],
    keywords: 'backpropagation autodiff automatic differentiation reverse mode chain rule computation graph vjp jacobian gradient descent',
  },
  {
    id: 'activation-functions',
    short: 'Activation functions',
    title: 'Activation Functions: Sigmoid, Tanh, ReLU, GELU, and Swish',
    task: 'concepts',
    module: 'Training fundamentals',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Injecting non-linearity into neural architectures to enable universal function approximation while preserving healthy gradient flow.`,
    lead: r`Without non-linear activation functions, stacking 100 neural network layers collapses mathematically into a single matrix multiplication, incapable of learning anything beyond linear regression. Non-linear activations enable networks to approximate complex continuous functions, but each choice introduces distinct trade-offs between gradient saturation, computational efficiency, and zero-centred outputs. From early saturating sigmoids to ReLU, GELU, and Swish, modern activations are engineered to maintain healthy gradient propagation throughout deep transformer and convolutional backbones.`,
    intuition: [
      r`Imagine building a multi-layer neural network where each layer simply multiplies the input by a weight matrix: h = x W_1 and y = h W_2. Substituting the first equation into the second yields y = x (W_1 W_2) = x W_combined. No matter how many layers you stack, ten billion linear layers are mathematically identical to a single linear layer! The network cannot learn XOR, detect image contours, or model language syntax. Inserting a non-linear activation function between layers shatters this linearity, allowing the network to fold and curve the decision boundary in high-dimensional space.`,
      r`Early neural networks relied on the sigmoid function, which maps inputs into the range (0, 1). However, when input values become moderately large or small (e.g. |z| > 3), the sigmoid curve becomes almost completely flat. Its derivative tops out at 0.25 and drops to near zero in the wings. When backpropagating through 10 sigmoid layers, multiplying derivatives below 0.25 shrinks the gradient exponentially (0.25^10 is less than 0.000001), causing gradient updates in early layers to vanish entirely.`,
      r`The Rectified Linear Unit (ReLU) transformed deep learning by providing a constant derivative of 1.0 for all positive inputs, eliminating saturation and accelerating convergence. However, for negative inputs, ReLU outputs zero with a derivative of zero, causing inactive neurons to permanently die when pushed negative. Modern architectures (such as GPT, BERT, and modern vision backbones) employ smooth, non-monotonic activations like GELU (Gaussian Error Linear Unit) and Swish/SiLU, which retain small non-zero curvatures for negative inputs, ensuring continuous gradient flow.`,
    ],
    analogy: r`A sculptor carving marble: linear transformations can only slide, tilt, or stretch a stone slab in straight lines; non-linear activation functions provide the chisels to carve intricate curves, hollows, and detailed lifelike contours.`,
    steps: [
      r`Select output layer activation based on task: use Sigmoid for binary classification, Softmax for multi-class classification, and linear identity for regression.`,
      r`Choose default hidden activation: deploy ReLU as an initial baseline for standard feedforward and convolutional networks.`,
      r`Address dead neuron issues with LeakyReLU: if a high proportion of ReLU units output zero, introduce a small negative slope alpha = 0.01.`,
      r`Adopt GELU or Swish/SiLU for state-of-the-art architectures: use GELU for Transformers and language models, and Swish/SiLU for advanced vision networks.`,
      r`Verify activation statistics during training: monitor mean and variance of hidden layer activations to verify that distributions do not collapse or explode.`,
    ],
    math: [
      {
        h: 'Rectified Linear Unit (ReLU) and LeakyReLU',
        tex: r`\text{ReLU}(z) = \max(0, z), \qquad \text{LeakyReLU}(z) = \begin{cases} z & \text{if } z \ge 0 \\ \alpha z & \text{if } z < 0 \end{cases}`,
        p: r`Where $\alpha \ll 1$ (typically $\alpha = 0.01$). ReLU maintains a constant unit derivative $\partial / \partial z = 1$ for positive inputs, completely avoiding positive-side saturation, while LeakyReLU permits a small non-zero gradient $\alpha$ across the negative half-plane.`,
      },
      {
        h: 'Gaussian Error Linear Unit (GELU)',
        tex: r`\text{GELU}(z) = z \cdot \Phi(z) = z \cdot P(X \le z) \approx 0.5 z \left( 1 + \tanh\left( \sqrt{\frac{2}{\pi}} \left( z + 0.044715 z^3 \right) \right) \right)`,
        p: r`Where $\Phi(z)$ is the standard Gaussian cumulative distribution function. GELU probabilistically gates the input $z$ by how likely it is to exceed a random draw from $\mathcal{N}(0, 1)$, producing smooth non-monotonic curvature with non-zero gradients everywhere.`,
      },
      {
        h: 'Swish / Sigmoid Linear Unit (SiLU)',
        tex: r`\text{Swish}_\beta(z) = z \cdot \sigma(\beta z) = \frac{z}{1 + e^{-\beta z}}, \qquad \frac{d}{dz} \text{Swish}_1(z) = \sigma(z) + z \sigma(z)(1 - \sigma(z))`,
        p: r`Swish smoothly interpolates between linear behaviour at $\beta \to 0$ and ReLU at $\beta \to \infty$. Its non-monotonic dip near $z \approx -1.28$ allows small negative signals to propagate gradients backward.`,
      },
    ],
    keyPoints: [
      r`Non-linear activations prevent deep networks from collapsing mathematically into a single linear matrix multiplication.`,
      r`Saturating functions (Sigmoid, Tanh) cause vanishing gradients in deep networks because their derivatives approach zero away from the origin.`,
      r`GELU and Swish/SiLU provide smooth, non-monotonic gradient flow, serving as the standard activations for modern transformers and vision backbones.`,
    ],
    pitfalls: [
      r`Using Sigmoid or Tanh in hidden layers of deep neural networks (>5 layers), which severely dampens gradient propagation.`,
      r`The Dying ReLU trap: setting learning rates too high can push weights into regions where neurons output negative values for all dataset samples, permanently killing their gradient.`,
      r`Applying Softmax across the wrong tensor dimension: in multi-head attention or sequence classification, applying Softmax across the batch dimension instead of the class or key dimension breaks learning.`,
    ],
    code: r`import numpy as np

def sigmoid(z): return 1.0 / (1.0 + np.exp(-np.clip(z, -30, 30)))
def d_sigmoid(z): s = sigmoid(z); return s * (1.0 - s)
def relu(z): return np.maximum(0, z)
def d_relu(z): return (z > 0).astype(float)
def gelu(z): return 0.5 * z * (1.0 + np.tanh(np.sqrt(2.0 / np.pi) * (z + 0.044715 * z**3)))
def d_gelu(z, eps=1e-5): return (gelu(z + eps) - gelu(z - eps)) / (2 * eps)

test_pts = np.array([-3.0, 0.0, 3.0])
print(f"Evaluation points: {test_pts}")
print(f"Sigmoid derivatives: {np.round(d_sigmoid(test_pts), 4)} (vanishes at +/-3.0)")
print(f"ReLU derivatives:    {np.round(d_relu(test_pts), 4)} (constant 1.0 for z>0, dead at z<0)")
print(f"GELU derivatives:    {np.round(d_gelu(test_pts), 4)} (smooth, non-zero negative dip)")`,
    quiz: [
      {
        q: r`What occurs mathematically if all activation functions in a 50-layer deep neural network are replaced with linear identity functions f(z) = z?`,
        o: [
          r`The network becomes impossible to differentiate`,
          r`The entire 50-layer network collapses into a single equivalent linear regression model, incapable of learning non-linear relationships`,
          r`The network automatically achieves zero training error`,
          r`The network parameters double in size`,
        ],
        a: 1,
        why: r`Because the composition of linear transformations is always another linear transformation, any number of stacked linear layers collapses mathematically into a single matrix multiplication.`,
      },
      {
        q: r`Why does the standard Sigmoid activation function cause vanishing gradients when used across many hidden layers in deep networks?`,
        o: [
          r`Because its derivative is strictly negative everywhere`,
          r`Because its maximum derivative is only 0.25 and approaches 0 for inputs away from the origin, shrinking gradients exponentially during chain rule multiplication`,
          r`Because it cannot be computed in float32 precision`,
          r`Because it only accepts binary 0 and 1 inputs`,
        ],
        a: 1,
        why: r`The derivative of sigmoid is at most 0.25. Multiplying values below 0.25 across multiple layers causes gradients in early layers to vanish exponentially toward zero.`,
      },
      {
        q: r`What is a key advantage of GELU and Swish over standard ReLU in deep transformer architectures?`,
        o: [
          r`They require zero floating-point operations`,
          r`They are smooth and non-monotonic, allowing small negative values to propagate non-zero restorative gradients rather than hard-clipping them to zero`,
          r`They convert all model weights into positive integers`,
          r`They eliminate the need for backpropagation`,
        ],
        a: 1,
        why: r`Unlike ReLU's abrupt zero cut-off, GELU and Swish have smooth, non-monotonic curves that allow small negative signals to maintain gentle gradient flow, preventing permanently dead neurons.`,
      },
    ],
    usedBy: [],
    prereq: ['backpropagation-and-autodiff', 'gradient-descent'],
    related: ['weight-initialisation-xavier-and-he', 'optimisers-sgd-momentum-rmsprop-adam-adamw', 'sigmoid-and-link-functions'],
    keywords: 'activation functions relu gelu swish silu sigmoid tanh vanishing gradient dying relu non-linearity neural networks',
  },
  {
    id: 'weight-initialisation-xavier-and-he',
    short: 'Weight initialisation: Xavier, He',
    title: 'Weight Initialisation: Xavier and He',
    task: 'concepts',
    module: 'Training fundamentals',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Calibrating weight variance based on layer fan-in and fan-out to preserve signal variance and prevent vanishing or exploding activations across deep networks.`,
    lead: r`Initialising neural network weights to all zeros traps neurons in a symmetry lock where every unit computes identical outputs and receives identical gradients. Conversely, initialising weights with uncalibrated random variance causes activations and gradients to either explode exponentially to infinity or vanish to zero as depth increases. Xavier (Glorot) and He (Kaiming) initialisation scale weight variances inversely with layer dimensions, maintaining stable unit-variance signals from the very first training iteration.`,
    intuition: [
      r`Suppose you initialise all weights in a 100-neuron hidden layer to zero. For any input, every single neuron computes identical outputs. During backpropagation, every neuron receives the exact same gradient update. After the optimiser takes a step, all 100 neurons still share identical weights! The network is trapped in symmetry, effectively behaving as a single neuron regardless of width. Breaking symmetry requires initialising weights with random values.`,
      r`However, choosing random values carelessly creates extreme numerical instability. Consider a layer with 256 inputs initialised from a standard normal distribution N(0, 1). The variance of each neuron's output is roughly 256 times the input variance. Across 10 layers, the signal variance scales by 256^10, causing numbers to explode into NaN overflows within milliseconds. Conversely, initialising with weights that are too small (e.g. standard deviation 0.01) causes variance to decay exponentially to zero, extinguishing the signal completely within a few layers.`,
      r`In 2010, Xavier Glorot and Yoshua Bengio derived that preserving constant variance forward and backward for linear and symmetric activations (such as Tanh) requires scaling weight variance inversely with the average of fan-in and fan-out: Var(w) = 2 / (D_in + D_out). In 2015, Kaiming He discovered that because ReLU zeroes out negative inputs (halving the transmitted variance), ReLU layers require double the variance: Var(w) = 2 / D_in. This simple correction enabled training deep convolutional networks with over 100 layers without divergence.`,
    ],
    analogy: r`A chain of audio amplifiers: if each amplifier in a 20-stage studio rig multiplies signal volume by 1.5x, the sound deafens into screeching distortion; if each multiplies volume by 0.7x, the sound fades into silence. Xavier and He initialisation set every stage's gain to exactly 1.0x.`,
    steps: [
      r`Identify downstream activation non-linearity: check whether the layer uses symmetric/linear activations (Tanh, Sigmoid, Linear) or half-rectifying activations (ReLU, LeakyReLU, GELU).`,
      r`Compute fan-in and fan-out: calculate input dimensions $D_{\text{in}}$ and output dimensions $D_{\text{out}}$ (multiplying kernel spatial dimensions $k_w \cdot k_h \cdot C_{\text{in}}$ for convolutions).`,
      r`Apply Xavier/Glorot for Tanh or Sigmoid: draw weights from $\mathcal{N}\left(0, \frac{2}{D_{\text{in}} + D_{\text{out}}}\right)$ or uniform distribution $\mathcal{U}\left(-\sqrt{\frac{6}{D_{\text{in}} + D_{\text{out}}}}, \sqrt{\frac{6}{D_{\text{in}} + D_{\text{out}}}}\right)$.`,
      r`Apply He/Kaiming for ReLU and GELU: draw weights from $\mathcal{N}\left(0, \frac{2}{D_{\text{in}}}\right)$ to compensate for rectified negative inputs.`,
      r`Initialise bias vectors to zero: set all bias parameters to constant zero, avoiding arbitrary initial directional offsets.`,
    ],
    math: [
      {
        h: 'Forward signal variance propagation',
        tex: r`\text{Var}(y_j) = D_{\text{in}} \cdot \text{Var}(w) \cdot \text{Var}(x)`,
        p: r`Assuming input features $x$ and weights $w$ are mutually independent with mean zero. Preserving unit variance across the transformation ($\text{Var}(y) = \text{Var}(x)$) requires setting $\text{Var}(w) = 1 / D_{\text{in}}$.`,
      },
      {
        h: 'Xavier (Glorot) initialisation formula',
        tex: r`\text{Var}(w_{\text{Xavier}}) = \frac{2}{D_{\text{in}} + D_{\text{out}}}, \qquad w \sim \mathcal{N}\left( 0, \sqrt{\frac{2}{D_{\text{in}} + D_{\text{out}}}} \right)`,
        p: r`Taking the harmonic compromise between preserving forward activation variance ($1 / D_{\text{in}}$) and backward gradient variance ($1 / D_{\text{out}}$) guarantees balanced bidirectional signal flow for symmetric activations like Tanh.`,
      },
      {
        h: 'He (Kaiming) initialisation for ReLU networks',
        tex: r`\text{Var}(w_{\text{He}}) = \frac{2}{D_{\text{in}}}, \qquad w \sim \mathcal{N}\left( 0, \sqrt{\frac{2}{D_{\text{in}}}} \right)`,
        p: r`Because ReLU clips negative inputs to zero, $\mathbb{E}[(\max(0, x))^2] = \frac{1}{2} \text{Var}(x)$. To balance the 50% loss of signal energy through rectification, the weight variance must be doubled to $2 / D_{\text{in}}$.`,
      },
    ],
    keyPoints: [
      r`Initialising weights to constant values locks neurons into identical symmetry, preventing them from learning distinct features.`,
      r`Xavier initialisation balances forward and backward variance for symmetric, linear, and Tanh non-linearities.`,
      r`He initialisation doubles weight variance (2 / D_in) to compensate for ReLU setting half of all activations to zero.`,
    ],
    pitfalls: [
      r`Using Xavier initialisation in deep ReLU networks: after 20 layers, activation variance decays by 0.5^20, causing severe vanishing gradients.`,
      r`Sampling weights from standard normal N(0, 1) without scaling: variance scales with fan-in, causing immediate numerical overflow and NaN weights.`,
      r`Randomly initialising bias vectors: biases should be initialised to zero to avoid introducing arbitrary non-zero offsets before training.`,
    ],
    code: r`import numpy as np

np.random.seed(42)
D = 256
n_layers = 10
n_samples = 1000

# Input: standard Gaussian features
X = np.random.normal(0, 1.0, size=(n_samples, D))

def simulate_propagation(init_type):
    current = X.copy()
    for _ in range(n_layers):
        if init_type == "std_normal":
            W = np.random.normal(0, 1.0, size=(D, D))
        elif init_type == "xavier":
            std = np.sqrt(2.0 / (D + D))
            W = np.random.normal(0, std, size=(D, D))
        elif init_type == "he":
            std = np.sqrt(2.0 / D)
            W = np.random.normal(0, std, size=(D, D))
        current = np.maximum(0, np.dot(current, W)) # ReLU activation
    return np.var(current)

var_normal = simulate_propagation("std_normal")
var_xavier = simulate_propagation("xavier")
var_he = simulate_propagation("he")

print(f"10-layer forward ReLU variance:")
print(f"Standard Normal N(0,1): {var_normal:.2e} (explodes to infinity)")
print(f"Xavier initialisation:  {var_xavier:.2e} (vanishes toward zero)")
print(f"He initialisation:      {var_he:.2f} (stable near 1.0)")`,
    quiz: [
      {
        q: r`Why does initialising all weights in a neural network layer to zero prevent it from learning effectively?`,
        o: [
          r`Because zero weights cause the loss function to divide by zero`,
          r`Because all neurons in the layer compute identical forward outputs and receive identical backward gradients, remaining locked in identical symmetry`,
          r`Because backpropagation can only run on positive floating-point numbers`,
          r`Because zero weights delete the input data permanently`,
        ],
        a: 1,
        why: r`If all weights in a layer are equal, every neuron computes the same output and receives the same gradient update. Breaking this symmetry requires random initialisation.`,
      },
      {
        q: r`Why does He (Kaiming) initialisation use a variance of 2 / D_in instead of 1 / D_in?`,
        o: [
          r`Because He initialisation is designed for networks with twice as many layers`,
          r`To compensate for the fact that ReLU sets all negative values to zero, which halves the variance of the propagated signal`,
          r`Because GPU hardware requires numbers to be powers of two`,
          r`To ensure the learning rate can be doubled during training`,
        ],
        a: 1,
        why: r`ReLU zeroes out half of the Gaussian input distribution on average, reducing signal variance by 50%. Multiplying the initial variance by 2 restores the expected signal variance to 1.0.`,
      },
      {
        q: r`What happens if you initialise a 30-layer deep neural network with weights drawn from a standard normal distribution N(0, 1)?`,
        o: [
          r`The network converges in a single training epoch`,
          r`Activation variance compounds exponentially with depth, causing immediate floating-point overflow and NaN values`,
          r`The network automatically converts into an SVM`,
          r`The weights all decay to zero immediately`,
        ],
        a: 1,
        why: r`With fan-in D, each layer multiplies variance by D. Without scaling by 1/D, variance grows as D^L, leading to rapid numerical explosion and NaN values.`,
      },
    ],
    usedBy: [],
    prereq: ['backpropagation-and-autodiff', 'activation-functions'],
    related: ['optimisers-sgd-momentum-rmsprop-adam-adamw', 'gradient-descent', 'bias-variance-tradeoff'],
    keywords: 'weight initialisation xavier glorot he kaiming variance scaling symmetry breaking relu tanh deep learning',
  },
  {
    id: 'optimisers-sgd-momentum-rmsprop-adam-adamw',
    short: 'Optimisers: SGD to AdamW',
    title: 'Optimisers: SGD, Momentum, RMSProp, Adam, and AdamW',
    task: 'concepts',
    module: 'Training fundamentals',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Navigating non-convex loss landscapes using adaptive learning rates, first-order momentum, and decoupled weight decay.`,
    lead: r`Standard Stochastic Gradient Descent (SGD) struggles in ill-conditioned loss ravines where surfaces curve steeply in one dimension and gently in another, causing oscillations and slow progress. Modern deep learning relies on advanced optimisers that accelerate along consistent directions and adapt step sizes per parameter. Tracing the algorithmic lineage from classical SGD to Momentum, RMSProp, Adam, and AdamW reveals how decoupled weight decay resolved Adam's generalisation gap to become the standard optimiser for training deep transformers and vision backbones.`,
    intuition: [
      r`Imagine rolling a heavy bowling ball down a steep, narrow canyon where the canyon walls slope steeply downwards at 80 degrees, while the river floor slopes gently toward the sea at 2 degrees. If you take a step purely in the direction of steepest descent (standard SGD), you bounce violently back and forth between the canyon walls, making almost zero forward progress down the river. The loss function oscillates wildly along high-curvature dimensions while creeping at a crawl along low-curvature dimensions.`,
      r`Momentum addresses this by introducing physical inertia: it accumulates an exponentially decaying moving average of past gradients. Perpendicular oscillations cancel each other out, while forward momentum down the river floor compounds, propelling the optimiser smoothly forward. RMSProp tackles the problem from another angle: it divides the learning rate by the square root of running gradient variance. Dimensions with massive oscillating gradients have their step size dampened; dimensions with gentle gradients have their step size boosted.`,
      r`Adam combined both mechanisms: maintaining both an exponentially decaying average of past gradients (first moment) and past squared gradients (second moment). However, researchers noticed that SGD with momentum frequently achieved superior final test generalisation. In 2017, Loshchilov and Hutter showed why: frameworks implemented L2 regularisation by adding lambda * w directly to the gradient vector. In Adam, this gradient penalty was scaled by 1 / sqrt(v), penalising frequent features far less than rare features! AdamW decouples weight decay, applying the regularisation penalty directly to the weights after the adaptive step, restoring state-of-the-art generalisation and cementing AdamW as the gold standard for LLMs and vision transformers.`,
    ],
    analogy: r`Navigating a rocky, foggy mountain trail in a heavy toboggan: momentum provides forward physical inertia that carries you over small bumps and prevents sideways wobbling, while adaptive suspension automatically softens the ride over rugged terrain and accelerates on smooth flat stretches.`,
    steps: [
      r`Select baseline optimiser: deploy AdamW as the standard choice for Transformers, language models, and complex architectures; choose SGD with momentum for standard convolutional backbones.`,
      r`Configure core AdamW hyperparameters: set standard defaults: learning rate eta = 0.001, beta_1 = 0.9 (momentum), beta_2 = 0.999 (second moment), and epsilon = 1e-8.`,
      r`Apply decoupled weight decay: set weight decay lambda between 0.01 and 0.1 in AdamW, ensuring regularisation acts directly on parameters without distorting adaptive moments.`,
      r`Exclude 1D parameters from weight decay: explicitly disable weight decay for layer normalisation gains, biases, and embedding offsets to avoid underfitting.`,
      r`Pair with learning rate warmup and decay: combine AdamW with an initial linear warmup phase followed by cosine annealing decay to stabilize early training steps.`,
    ],
    math: [
      {
        h: 'Stochastic gradient descent with classical momentum',
        tex: r`v_t = \beta v_{t-1} + (1 - \beta) g_t, \qquad \theta_t = \theta_{t-1} - \eta v_t`,
        p: r`Where $g_t = \nabla_\theta \mathcal{L}(\theta_{t-1})$ is the stochastic minibatch gradient, $\beta \in [0.9, 0.99]$ is the momentum decay factor, and $\eta$ is the learning rate. Oscillations perpendicular to the gradient canyon cancel out while consistent gradient directions accelerate.`,
      },
      {
        h: 'Adam (Adaptive Moment Estimation) with bias correction',
        tex: r`m_t = \beta_1 m_{t-1} + (1 - \beta_1) g_t, \qquad v_t = \beta_2 v_{t-1} + (1 - \beta_2) g_t^2`,
        p: r`Where $\hat{m}_t = m_t / (1 - \beta_1^t)$ and $\hat{v}_t = v_t / (1 - \beta_2^t)$ correct for initialization bias toward zero during early training steps ($t=1, 2$). The update step divides the momentum estimate by $\sqrt{\hat{v}_t} + \epsilon$.`,
      },
      {
        h: 'AdamW decoupled weight decay formulation',
        tex: r`\theta_t = \theta_{t-1} - \eta \lambda \theta_{t-1} - \frac{\eta}{\sqrt{\hat{v}_t} + \epsilon} \hat{m}_t`,
        p: r`Where regularisation penalty $\eta \lambda \theta_{t-1}$ is subtracted directly from parameter $\theta$, completely decoupled from the adaptive gradient scale factor $\sqrt{\hat{v}_t}$. This guarantees true scale-invariant weight shrinkage.`,
      },
    ],
    keyPoints: [
      r`Momentum accumulates first-order gradient history, dampening oscillations across steep ill-conditioned ravines.`,
      r`RMSProp and Adam divide updates by the square root of second moments, automatically calibrating individual learning rates per parameter.`,
      r`AdamW fixes Adam's weight decay flaw by decoupling regularisation shrinkage from adaptive gradient scaling, restoring generalisation parity with SGD.`,
    ],
    pitfalls: [
      r`Implementing L2 regularisation inside Adam by adding lambda * w to the gradient: this dilutes weight decay on parameters with large gradients, corrupting regularisation.`,
      r`Omitting bias correction terms in custom Adam implementations: without dividing by (1 - beta^t), initial gradient steps are artificially tiny.`,
      r`Applying weight decay indiscriminately to normalisation scales and bias parameters: penalising affine shift/scale parameters damages representation capacity without aiding regularisation.`,
    ],
    code: r`import numpy as np

# Minimise 2D anisotropic ill-conditioned quadratic: f(x, y) = 0.5*x^2 + 12.5*y^2
def grad(pos): return np.array([pos[0], 25.0 * pos[1]])

pos_sgd = np.array([5.0, 1.0])
pos_mom = np.array([5.0, 1.0])
pos_adamw = np.array([5.0, 1.0])

v_mom = np.zeros(2)
m, v = np.zeros(2), np.zeros(2)
lr = 0.075

for t in range(1, 51):
    # 1. Standard SGD
    pos_sgd -= lr * grad(pos_sgd)
    
    # 2. SGD with Momentum (beta=0.8)
    g_m = grad(pos_mom)
    v_mom = 0.8 * v_mom + 0.2 * g_m
    pos_mom -= lr * v_mom
    
    # 3. AdamW (beta1=0.9, beta2=0.99, weight_decay=0.01)
    g_ad = grad(pos_adamw)
    m = 0.9 * m + 0.1 * g_ad
    v = 0.99 * v + 0.01 * (g_ad**2)
    m_hat = m / (1.0 - 0.9**t)
    v_hat = v / (1.0 - 0.99**t)
    pos_adamw = pos_adamw * (1.0 - lr * 0.01) - 0.2 * m_hat / (np.sqrt(v_hat) + 1e-8)

print('Initial loss:', round(0.5 * 5.0**2 + 12.5 * 1.0**2, 2))
print('Standard SGD loss after 50 steps:   ', round(0.5 * pos_sgd[0]**2 + 12.5 * pos_sgd[1]**2, 4))
print('SGD + Momentum loss after 50 steps: ', round(0.5 * pos_mom[0]**2 + 12.5 * pos_mom[1]**2, 4))
print('AdamW loss after 50 steps:          ', round(0.5 * pos_adamw[0]**2 + 12.5 * pos_adamw[1]**2, 4))`,
    quiz: [
      {
        q: r`Why does adding classical momentum help optimisers navigate steep, narrow loss ravines?`,
        o: [
          r`It reduces the memory required to store gradients to zero`,
          r`It accumulates an exponentially decaying moving average of past gradients, causing perpendicular oscillations to cancel while accelerating forward progress`,
          r`It computes second derivatives using the Hessian matrix`,
          r`It inverts the loss function so the minimum becomes a maximum`,
        ],
        a: 1,
        why: r`In steep ravines, gradient signs oscillate rapidly across the narrow walls. Momentum averages these oscillations out, dampening perpendicular bounce while building speed along the consistent gentle ravine floor.`,
      },
      {
        q: r`What key flaw in the original Adam optimiser did AdamW fix?`,
        o: [
          r`Adam could only run on CPU architectures`,
          r`Adam coupled L2 regularisation with adaptive gradient scaling by adding weight decay directly to the gradient vector, diluting regularisation for weights with large gradients`,
          r`Adam was incapable of computing momentum`,
          r`Adam required learning rates above 10.0 to converge`,
        ],
        a: 1,
        why: r`Original Adam added L2 regularisation to the gradient g_t, which was then divided by sqrt(v_t), reducing weight decay for parameters with frequent large gradients. AdamW decouples weight decay, applying direct shrinkage.`,
      },
      {
        q: r`Why are bias parameters and normalisation scale/shift gains typically excluded from weight decay during neural network training?`,
        o: [
          r`Because PyTorch cannot compute derivatives for 1D vectors`,
          r`Biases and normalisation parameters represent very few parameters and penalising them causes underfitting without preventing overfitting`,
          r`Because weight decay turns all bias parameters to positive infinity`,
          r`Because biases must always remain strictly zero`,
        ],
        a: 1,
        why: r`Overfitting is driven by complex combinations of weight matrices. Biases and normalisation affine parameters simply shift and scale representations; decaying them harms network expressivity without aiding regularisation.`,
      },
    ],
    usedBy: [],
    prereq: ['gradient-descent', 'backpropagation-and-autodiff'],
    related: ['activation-functions', 'weight-initialisation-xavier-and-he', 'quasi-newton-and-lbfgs'],
    keywords: 'optimisers sgd momentum rmsprop adam adamw weight decay adaptive learning rate gradient descent loss landscape',
  },
  {
    id: 'learning-rate-schedules-and-warm-up',
    short: 'LR schedules and warm-up',
    title: 'Learning-Rate Schedules and Warm-Up',
    task: 'concepts',
    module: 'Training fundamentals',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`A fixed learning rate is either too aggressive early in training or too coarse near the end. Schedules start gently with warm-up, scale to peak velocity, and anneal downward to settle into sharp, high-generalisation minima.`,
    lead: r`The learning rate is widely regarded as the most critical hyperparameter in deep learning. Modern training recipes rarely keep it constant: linear warm-up stabilises the network when momentum buffers and running statistics are empty, followed by cosine annealing or 1cycle decay to explore broadly and converge cleanly.`,
    intuition: [
      r`At the start of training ($t=1$), network weights are random, running moments in adaptive optimisers such as [[optimisers-sgd-momentum-rmsprop-adam-adamw|AdamW]] ($m_0=0, v_0=0$) are uninitialised, and intermediate representations fluctuate violently. Taking large gradient steps in this chaotic phase thrusts parameters into distorted, ill-conditioned loss ravines from which recovery is slow or impossible. Linear warm-up ramps the learning rate smoothly from near zero to its target peak over the first 1% to 5% of training steps, allowing gradient statistics to form reliable second-moment estimates before high-velocity updates begin.`,
      r`Once representations stabilise, maintaining a large learning rate allows the optimiser to cross saddle points and skip shallow, poor local basins. However, as the loss landscape transitions into a narrow valley containing desirable minima, a high step size causes parameters to oscillate back and forth between opposing walls without ever reaching the trough. Decaying the learning rate gradually contracts the step radius, enabling the parameter trajectory to settle smoothly into the lowest point of the basin.`,
      r`Among decay patterns, step decay (cutting the rate by a factor of 10 every $N$ epochs) produces sharp, discontinuous drops that require manual schedule tuning. By contrast, cosine annealing smoothly interpolates the learning rate along a half-cosine curve from $\eta_{\text{max}}$ down to $\eta_{\text{min}}$, offering smooth deceleration with zero abrupt plateaus. This approach has become the standard default across modern vision architectures and large language models.`,
    ],
    analogy: r`Like landing a spacecraft on an asteroid: thrusters fire delicately at first to establish stable orientation (warm-up), cruise at maximum velocity across space (peak rate), and gradually throttle down to a feathering touch for touchdown without bouncing off (cosine decay).`,
    steps: [
      r`Determine peak learning rate $\eta_{\text{max}}$: run an LR range test (Leslie Smith test) or adopt proven architecture defaults ($3 \times 10^{-4}$ for AdamW on Transformers; $10^{-1}$ for SGD on ConvNets).`,
      r`Configure the warm-up window: designate $T_{\text{warm}}$ (typically 1% to 5% of total iterations, or 1 to 5 epochs) to ramp the learning rate linearly from $\eta_{\text{min}}$ (or 0) to $\eta_{\text{max}}$.`,
      r`Select decay trajectory: deploy cosine annealing for fixed total training budgets $T_{\text{total}}$, or linear decay for bounded fine-tuning tasks.`,
      r`Synchronise with batch scale: when scaling effective batch size across multiple GPUs, scale $\eta_{\text{max}}$ proportionally (linear scaling $\eta \propto B$ or square-root scaling $\eta \propto \sqrt{B}$) and extend the warm-up window.`,
      r`Monitor validation dynamics: verify that loss does not explode in the initial 200 steps and that late-stage annealing coincides with sustained improvements in validation metrics.`,
    ],
    math: [
      {
        h: 'Linear warm-up schedule',
        tex: r`$$\eta_t = \eta_{\text{base}} + \frac{t}{T_{\text{warm}}}(\eta_{\text{max}} - \eta_{\text{base}}), \quad 1 \le t \le T_{\text{warm}}$$`,
        p: r`$t$ is the current training iteration, $T_{\text{warm}}$ is the total number of warm-up iterations, $\eta_{\text{base}}$ is the initial floor rate (often $0$ or $10^{-7}$), and $\eta_{\text{max}}$ is the peak target rate. This linear progression shields uninitialised layers from destabilising gradient shocks during initial steps.`,
      },
      {
        h: 'Cosine annealing decay',
        tex: r`$$\eta_t = \eta_{\text{min}} + \frac{1}{2}(\eta_{\text{max}} - \eta_{\text{min}})\left(1 + \cos\left(\frac{t - T_{\text{warm}}}{T_{\text{total}} - T_{\text{warm}}}\pi\right)\right), \quad T_{\text{warm}} \le t \le T_{\text{total}}$$`,
        p: r`$\eta_{\text{min}}$ is the asymptotic minimum learning rate (commonly $0.01 \cdot \eta_{\text{max}}$ or $0$), and $T_{\text{total}}$ is the planned step count. The argument to $\cos$ ranges smoothly from $0$ (where $\cos(0) = 1$) to $\pi$ (where $\cos(\pi) = -1$), providing continuous deceleration without discrete hyperparameter step thresholds.`,
      },
      {
        h: 'Step decay comparison',
        tex: r`$$\eta_k = \eta_0 \cdot \gamma^{\lfloor k / s \rfloor}$$`,
        p: r`$k$ is the completed epoch index, $s$ is the step interval (e.g. drop every 30 epochs), and $\gamma$ is the multiplicative discount factor (typically $0.1$ or $0.2$). While simple, step decay introduces sudden drop discontinuities that make progress sensitive to the exact choice of step boundaries.`,
      },
    ],
    keyPoints: [
      r`Linear warm-up prevents early divergence caused by noisy gradients and uncalibrated second-moment statistics in adaptive optimisers.`,
      r`Cosine annealing provides a smooth, schedule-long decay that eliminates the arbitrary epoch milestone tuning of step decay.`,
      r`Cosine schedules are budget-dependent: they require knowing the total step count $T_{\text{total}}$ in advance; interrupting training at 50% budget leaves the learning rate far too high for optimal convergence.`,
    ],
    pitfalls: [
      r`Omitting warm-up when training deep Transformers with AdamW, frequently resulting in immediate gradient explosion or loss divergence in the opening epochs.`,
      r`Setting $T_{\text{total}}$ in a cosine schedule significantly higher than actual training duration, which truncates training before the learning rate can anneal into its low-variance basin.`,
      r`Decaying the learning rate prematurely, trapping the optimiser in a mediocre local plateau before it has sufficiently traversed the parameter space.`,
    ],
    code: r`import numpy as np

def schedule_lr(step, total_steps=100, warm_steps=20, lr_max=0.01, lr_min=0.0001):
    # Linear warm-up phase
    if step < warm_steps:
        return lr_min + (lr_max - lr_min) * (step / warm_steps)
    # Cosine annealing decay phase
    progress = (step - warm_steps) / (total_steps - warm_steps)
    return lr_min + 0.5 * (lr_max - lr_min) * (1.0 + np.cos(np.pi * progress))

# Evaluate schedule at representative milestones
milestones = [5, 20, 60, 100]
print("Warm-up & Cosine Annealing Milestones (lr_max=0.01, warm=20, total=100):")
for s in milestones:
    rate = schedule_lr(s)
    phase = "Warm-up" if s < 20 else ("Peak" if s == 20 else "Cosine decay")
    print(f"Step {s:3d} ({phase:12s}): learning rate = {rate:.6f}")`,
    quiz: [
      {
        q: r`Why is linear warm-up particularly essential when training Transformers with Adam or AdamW?`,
        o: [
          r`Because Transformers have no activation functions in their feed-forward blocks`,
          r`Because early gradients are noisy and uninitialised second-moment variance buffers can produce destructively large initial parameter steps`,
          r`Because warm-up guarantees that training loss drops to zero within the first epoch`,
          r`Because AdamW cannot compute weight decay unless the learning rate is below 0.001`,
        ],
        a: 1,
        why: r`In early iterations, the second-moment estimate $v_t$ in Adam is biased near zero. Even with bias corrections, initial steps can be volatile; ramping the learning rate protects parameters until gradient statistics stabilise.`,
      },
      {
        q: r`What is the primary operational drawback of a cosine annealing schedule compared to adaptive learning rate methods?`,
        o: [
          r`It requires knowing the total step budget $T_{\text{total}}$ in advance to plan the decay curve`,
          r`It cannot be implemented with Stochastic Gradient Descent`,
          r`It increases the computational complexity of the backward pass from $O(N)$ to $O(N^2)$`,
          r`It forces the learning rate to increase exponentially after reaching the midpoint`,
        ],
        a: 0,
        why: r`Cosine annealing maps progress along $t / T_{\text{total}}$. If training is stopped early (or extended beyond $T_{\text{total}}$), the schedule does not align with the actual stopping point.`,
      },
      {
        q: r`Suppose you train a model with total steps $T_{\text{total}}=100$, warm-up steps $T_{\text{warm}}=20$, peak rate $\eta_{\text{max}}=0.01$, and minimum rate $\eta_{\text{min}}=0.0001$. What is the learning rate at step 60 (halfway through the cosine decay phase)?`,
        o: [
          r`Approximately 0.000100`,
          r`Approximately 0.005050`,
          r`Approximately 0.009900`,
          r`Approximately 0.002575`,
        ],
        a: 1,
        why: r`At step 60, progress through decay is $(60-20)/(100-20) = 40/80 = 0.5$. With $\cos(0.5\pi) = 0$, the rate is $\eta_{\text{min}} + 0.5(\eta_{\text{max}} - \eta_{\text{min}}) = 0.0001 + 0.5(0.0099) = 0.005050$.`,
      },
      {
        q: r`How does the 1cycle policy differ from standard monotonic cosine decay?`,
        o: [
          r`It keeps the learning rate permanently constant while varying batch size`,
          r`It increases learning rate to a peak while decreasing momentum, then decreases learning rate while increasing momentum`,
          r`It applies dropout only during the final 10% of training steps`,
          r`It skips backpropagation during alternate training mini-batches`,
        ],
        a: 1,
        why: r`Leslie Smith's 1cycle policy couples learning rate warm-up and decay with inverted momentum cycles (e.g. momentum drops from 0.95 to 0.85 during warm-up, then rises back to 0.95 during decay).`,
      },
    ],
    usedBy: [],
    prereq: ['optimisers-sgd-momentum-rmsprop-adam-adamw', 'backpropagation-and-autodiff'],
    related: ['weight-initialisation-xavier-and-he', 'vanishing-and-exploding-gradients-clipping', 'normalisation-batch-layer-rms'],
    keywords: 'learning rate schedule warmup cosine annealing step decay 1cycle sgdr adamw learning rate scheduler step size',
  },
  {
    id: 'vanishing-and-exploding-gradients-clipping',
    short: 'Vanishing/exploding gradients',
    title: 'Vanishing and Exploding Gradients, Gradient Clipping',
    task: 'concepts',
    module: 'Training fundamentals',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`In deep architectures, backpropagation repeatedly chains Jacobian matrices across layers: if their singular values average less than 1, gradients decay to zero; if greater than 1, they blow up to NaN.`,
    lead: r`Training networks with dozens or hundreds of layers requires gradients to propagate reliably from loss to input. Without architectural safeguards, repeated matrix products cause gradients to vanish exponentially into numerical insignificance or explode into non-finite NaNs. Modern deep learning addresses this through gradient norm clipping, non-saturating activations, normalisation, and residual skip connections.`,
    intuition: [
      r`Backpropagation computes the gradient of the loss with respect to early layer weights by chaining together partial derivatives across every intervening layer. In an $L$-layer network, the derivative at layer 1 is proportional to the product of $L-1$ weight matrices and activation Jacobian matrices. If the effective amplification factor at each layer is even slightly below one—say, $0.8$—then after 50 layers the gradient scales as $0.8^{50} \approx 1.4 \times 10^{-5}$. The earliest layers receive virtually no update signal and freeze in their random initialisation state.`,
      r`Conversely, if the effective amplification factor exceeds one—for instance, $1.2$—the product over 50 layers compounds to $1.2^{50} \approx 9,100$. A single step with this inflated gradient sends parameters flying into regions of extreme loss, overflowing floating-point limits and producing ` + '`NaN`' + r` loss values. This exploding gradient phenomenon is especially acute in recurrent networks unrolled across long sequences and in deep networks encountering sharp, steep loss cliffs.`,
      r`Gradient clipping is the primary algorithmic safeguard against exploding gradients. Rather than letting an unexpectedly large gradient take a disastrous leap, clipping caps the global vector norm at a predetermined threshold $c$ (typically $1.0$). By rescaling the entire gradient vector proportionally when its length exceeds $c$, the update preserves its exact descent direction while strictly bounding the maximum spatial displacement.`,
    ],
    analogy: r`Like whispering a message down a telephone line of 50 people: if each participant speaks at 80% volume, the message fades to complete silence (vanishing); if each shouts 20% louder than the last, the final output is a deafening, blown-out screech (exploding).`,
    steps: [
      r`Monitor layer-wise gradient norms: record $\lVert \nabla_{W_l} \mathcal{L} \rVert_2$ across depth during training to spot early decay or sudden magnitude spikes.`,
      r`Deploy non-saturating activations: replace sigmoid ($\sigma'(z) \le 0.25$) and tanh ($\tanh'(z) \le 1.0$) with [[activation-functions|ReLU or GELU]] to prevent derivative saturation.`,
      r`Enforce variance-preserving initialisation: apply [[weight-initialisation-xavier-and-he|He/Kaiming initialisation]] so weight tensors maintain signal variance across forward and backward sweeps.`,
      r`Apply global gradient norm clipping: compute the concatenated Euclidean norm across all parameter gradients and rescale by $c / \lVert g \rVert_2$ whenever $\lVert g \rVert_2 > c$.`,
      r`Incorporate residual pathways: insert skip connections ($x + f(x)$) to grant backpropagated gradients an unhindered linear highway directly to early layers.`,
    ],
    math: [
      {
        h: 'Backpropagated gradient product across layers',
        tex: r`$$\frac{\partial \mathcal{L}}{\partial h_1} = \frac{\partial \mathcal{L}}{\partial h_L} \prod_{l=1}^{L-1} \left( W_{l+1}^T \operatorname{diag}\big(\sigma'(z_l)\big) \right)$$`,
        p: r`$h_l$ is the hidden representation at layer $l$, $W_{l+1}$ is the weight matrix, and $\operatorname{diag}(\sigma'(z_l))$ is the diagonal Jacobian of the activation function. If the spectral radius of the transition matrix satisfies $\rho < 1$, the gradient norm shrinks as $O(\rho^L)$ (vanishing); if $\rho > 1$, it expands as $O(\rho^L)$ (exploding).`,
      },
      {
        h: 'Global gradient norm clipping',
        tex: r`$$g_{\text{clipped}} = \begin{cases} g & \text{if } \lVert g \rVert_2 \le c \\ c \frac{g}{\lVert g \rVert_2} & \text{if } \lVert g \rVert_2 > c \end{cases}, \qquad \lVert g \rVert_2 = \sqrt{\sum_{i=1}^P g_i^2}$$`,
        p: r`$g$ is the unrolled vector of all $P$ model parameter gradients, $\lVert g \rVert_2$ is its global Euclidean length, and $c$ is the maximum permitted clipping threshold (commonly $0.5$ to $1.0$). Global norm clipping preserves the exact geometric angle and descent direction of $g$, scaling only its step length.`,
      },
      {
        h: 'Value-based clipping comparison',
        tex: r`$$g_i' = \operatorname{clip}(g_i, -c, c) = \min(\max(g_i, -c), c)$$`,
        p: r`Element-wise clipping truncates each gradient scalar independently. While computationally trivial, clipping by value alters the orientation of the gradient vector in multi-dimensional space, skewing the optimiser away from the true steepest descent trajectory.`,
      },
    ],
    keyPoints: [
      r`Vanishing gradients freeze parameter updates in early layers, preventing the network from learning rich hierarchical representations.`,
      r`Global norm clipping rescales the gradient vector without altering its directional angle, protecting against catastrophic steps near steep loss cliffs.`,
      r`While clipping halts gradient explosions, vanishing gradients require structural remedies: non-saturating activations (ReLU/GELU), He initialisation, and residual skip connections.`,
    ],
    pitfalls: [
      r`Clipping coordinate-wise by value instead of global norm, which distorts the search direction and degrades optimisation trajectories.`,
      r`Setting the clipping threshold $c$ excessively small (e.g. $10^{-4}$), which effectively degenerates gradient descent into fixed-step sign navigation.`,
      r`Assuming gradient clipping cures vanishing gradients: clipping only bounds maximum gradient magnitude and cannot resurrect derivatives that have collapsed to zero.`,
    ],
    code: r`import numpy as np

# 1. Compare derivative decay across a 10-layer depth
depth = 10
sig_max_deriv = 0.25  # max derivative of standard sigmoid is 0.25
relu_deriv = 1.0      # active ReLU derivative is exactly 1.0

sig_decay = sig_max_deriv ** depth
relu_decay = relu_deriv ** depth
print(f"10-layer derivative product (sigmoid): {sig_decay:.2e}")
print(f"10-layer derivative product (active ReLU): {relu_decay:.2f}")

# 2. Global gradient norm clipping demonstration
np.random.seed(42)
grads = np.array([30.0, -25.0, 15.0, 10.0])
norm = np.linalg.norm(grads)
threshold = 1.0

if norm > threshold:
    clipped = grads * (threshold / norm)
else:
    clipped = grads

clipped_norm = np.linalg.norm(clipped)
cos_sim = np.dot(grads, clipped) / (norm * clipped_norm)

print(f"Original gradient vector: {grads.tolist()}, norm = {norm:.2f}")
print(f"Clipped gradient vector:  {np.round(clipped, 4).tolist()}, norm = {clipped_norm:.4f}")
print(f"Cosine directional similarity: {cos_sim:.4f} (direction perfectly preserved)")`,
    quiz: [
      {
        q: r`Why does global norm clipping preserve the search direction of gradient descent while element-wise value clipping does not?`,
        o: [
          r`Because global norm clipping applies the exact same scalar multiplier to every gradient coordinate`,
          r`Because global norm clipping sets negative gradients to zero`,
          r`Because element-wise clipping only operates on the final output layer`,
          r`Because global norm clipping converts the gradient to a probability distribution`,
        ],
        a: 0,
        why: r`Global norm clipping multiplies the entire gradient vector $g$ by the scalar $c / \lVert g \rVert_2$, scaling its magnitude without rotating its spatial angle in parameter space. Value clipping truncates individual components independently, shifting the vector direction.`,
      },
      {
        q: r`Why did deep neural networks built with sigmoid activation functions suffer severely from vanishing gradients?`,
        o: [
          r`Because sigmoid functions cannot be computed on modern GPUs`,
          r`Because the maximum value of the sigmoid derivative is only 0.25, guaranteeing exponential decay $(0.25)^L$ across depth`,
          r`Because sigmoid activations produce negative variance in hidden layers`,
          r`Because sigmoid derivatives are discontinuous at zero`,
        ],
        a: 1,
        why: r`Since $\sigma'(z) = \sigma(z)(1 - \sigma(z)) \le 0.25$, chaining $L$ sigmoid activations multiplies gradients by at most $0.25$ per layer, shrinking early layer gradients to near zero even with ideal weight scales.`,
      },
      {
        q: r`Which of the following architectural innovations provides a direct structural solution to vanishing gradients in 100+ layer networks?`,
        o: [
          r`Residual skip connections ($x + f(x)$)`,
          r`Element-wise gradient clipping by value`,
          r`Replacing AdamW with vanilla SGD without momentum`,
          r`Increasing the learning rate by a factor of 10 every epoch`,
        ],
        a: 0,
        why: r`Residual connections introduce an additive identity pathway $h_{l+1} = h_l + f(h_l)$. During backpropagation, $\frac{\partial \mathcal{L}}{\partial h_l} = \frac{\partial \mathcal{L}}{\partial h_{l+1}}(I + \frac{\partial f}{\partial h_l})$, ensuring that gradients can pass back unattenuated through the identity matrix term.`,
      },
      {
        q: r`If a model experiences exploding gradients causing loss values to display as NaN, what is the immediate recommended operational fix?`,
        o: [
          r`Increase the learning rate to bypass the unstable loss region`,
          r`Add global gradient norm clipping (e.g. threshold = 1.0) and verify weight initialisation`,
          r`Remove all normalisation layers from the network`,
          r`Double the batch size while keeping weights unclipped`,
        ],
        a: 1,
        why: r`Global gradient norm clipping immediately halts runaway update magnitudes near steep ravines, preventing parameters from jumping into invalid floating-point overflow regimes.`,
      },
    ],
    usedBy: [],
    prereq: ['backpropagation-and-autodiff', 'activation-functions', 'weight-initialisation-xavier-and-he'],
    related: ['optimisers-sgd-momentum-rmsprop-adam-adamw', 'learning-rate-schedules-and-warm-up', 'normalisation-batch-layer-rms'],
    keywords: 'vanishing gradients exploding gradients gradient clipping grad norm jacobian spectral radius nan loss explosion residual skip connection',
  },
  {
    id: 'normalisation-batch-layer-rms',
    short: 'Normalisation: Batch, Layer, RMS',
    title: 'Normalisation: Batch, Layer, and RMS Normalisation',
    task: 'concepts',
    module: 'Training fundamentals',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Intermediate activations shift and rescale during training as upstream weights update. Normalisation standardises activations across batch, channel, or feature dimensions to smooth the loss landscape and accelerate convergence.`,
    lead: r`Deep neural networks are notoriously vulnerable to internal activation drift: small weight changes in early layers cause cascading shifts in the mean and scale of downstream inputs. Normalisation techniques—principally Batch Normalisation for vision, Layer Normalisation for sequences, and RMS Normalisation for modern language models—stabilise internal distributions, allowing higher learning rates and dramatically smoother optimisation landscapes.`,
    intuition: [
      r`Imagine training layer 30 in a deep network. At every step, layers 1 through 29 update their parameters. Even if each update is modest, their combined effect alters the mean, variance, and distribution of the inputs arriving at layer 30. Layer 30 is perpetually trying to learn a mapping on a moving target. Without calibration, activations can saturate nonlinearities or drift toward extreme magnitudes, slowing training to a crawl.`,
      r`<strong>Batch Normalisation (BatchNorm)</strong> tackles this by computing the mean and variance across the batch dimension for each feature channel independently. By forcing the mini-batch activations to have zero mean and unit variance, it smooths the loss landscape and permits learning rates ten times larger. However, BatchNorm couples the representations of distinct examples within a batch, requires maintaining running statistics for inference, and deteriorates when mini-batch sizes are small ($B < 8$) or sequences vary in length.`,
      r`<strong>Layer Normalisation (LayerNorm)</strong> eliminates batch dependencies by computing the mean and variance across the hidden feature dimension for each individual sample independently. Because it operates within a single example, LayerNorm behaves identically during training and evaluation, handles dynamic sequence lengths effortlessly, and serves as the structural foundation of Transformers. Building on this, <strong>RMS Normalisation (RMSNorm)</strong> observes that the primary stabilisation benefit stems from scaling invariance rather than mean-centring; by normalising activations strictly by their root-mean-square, RMSNorm achieves identical training stability while cutting normalisation compute overhead by 10% to 50% in architectures like Llama and Mistral.`,
    ],
    analogy: r`Like tuning instruments in an orchestra: BatchNorm adjusts each instrument section by averaging volume across the whole day's rehearsals (the batch), whereas LayerNorm and RMSNorm balance all instruments within each individual musician's performance independently.`,
    steps: [
      r`Match normalisation type to architecture: deploy BatchNorm for 2D/3D ConvNets with large stable batches ($B \ge 32$); deploy LayerNorm or RMSNorm for Transformers, sequence models, or small-batch regimes.`,
      r`Compute reduction statistics: for LayerNorm, calculate sample mean $\mu_i$ and sample variance $\sigma_i^2$ across the hidden dimension $D$; for RMSNorm, calculate the root-mean-square $\operatorname{RMS}(x_i) = \sqrt{\frac{1}{D}\sum_j x_{i,j}^2 + \epsilon}$.`,
      r`Standardise activations: centre and divide by scale for LayerNorm; divide raw activations directly by the root-mean-square for RMSNorm.`,
      r`Apply learnable affine parameters: scale by learnable vector $\gamma$ and shift by $\beta$ ($y = \gamma \odot \hat{x} + \beta$), guaranteeing the network can recover any optimal activation distribution.`,
      r`Select architectural placement: in Transformer blocks, place normalisation before attention and feed-forward sublayers (Pre-LN: $x + \operatorname{SubLayer}(\operatorname{Norm}(x))$) to guarantee stable gradient flow without brittle warm-up requirements.`,
    ],
    math: [
      {
        h: 'Batch Normalisation (per feature channel across batch)',
        tex: r`$$\hat{x}_{i,k} = \frac{x_{i,k} - \mu_B}{\sqrt{\sigma_B^2 + \epsilon}}, \quad y_{i,k} = \gamma_k \hat{x}_{i,k} + \beta_k, \qquad \mu_B = \frac{1}{B}\sum_{i=1}^B x_{i,k}, \quad \sigma_B^2 = \frac{1}{B}\sum_{i=1}^B (x_{i,k} - \mu_B)^2$$`,
        p: r`$B$ is batch size, $x_{i,k}$ is the activation of sample $i$ at channel $k$, $\epsilon$ is a small numerical floor (e.g. $10^{-5}$), and $\gamma_k, \beta_k$ are learnable affine parameters. In inference, $\mu_B$ and $\sigma_B^2$ are replaced by frozen running population averages $\mu_{\text{run}}$ and $\sigma^2_{\text{run}}$.`,
      },
      {
        h: 'Layer Normalisation (per sample across hidden features)',
        tex: r`$$\hat{x}_{i,j} = \frac{x_{i,j} - \mu_i}{\sqrt{\sigma_i^2 + \epsilon}}, \quad y_{i,j} = \gamma_j \hat{x}_{i,j} + \beta_j, \qquad \mu_i = \frac{1}{D}\sum_{j=1}^D x_{i,j}, \quad \sigma_i^2 = \frac{1}{D}\sum_{j=1}^D (x_{i,j} - \mu_i)^2$$`,
        p: r`$D$ is the hidden representation dimension, and statistics are computed across features $j=1,\dots,D$ for each individual sample $i$ independently. Because no cross-sample averaging occurs, training and inference calculations are identical and completely invariant to batch size.`,
      },
      {
        h: 'Root Mean Square Normalisation (RMSNorm)',
        tex: r`$$\bar{x}_{i,j} = \frac{x_{i,j}}{\operatorname{RMS}(x_i)} \cdot \gamma_j, \qquad \operatorname{RMS}(x_i) = \sqrt{\frac{1}{D}\sum_{j=1}^D x_{i,j}^2 + \epsilon}$$`,
        p: r`RMSNorm discards the mean-centring step ($\mu_i=0$) and scales activations solely by their quadratic root-mean-square norm. By removing two sequential memory passes (mean computation and mean subtraction), RMSNorm accelerates execution latency on modern GPU tensor cores while preserving regularised scaling stability.`,
      },
    ],
    keyPoints: [
      r`BatchNorm normalises across samples in a mini-batch; LayerNorm normalises across hidden features within a single sample.`,
      r`RMSNorm removes mean subtraction from LayerNorm, matching its training stability while substantially reducing memory bandwidth and kernel overhead.`,
      r`Learnable affine parameters ($\gamma, \beta$) preserve representational capacity by allowing the network to scale or shift standardised activations if an identity mapping is optimal.`,
    ],
    pitfalls: [
      r`Using Batch Normalisation with small mini-batch sizes ($B \le 4$), where high sampling noise in batch statistics degrades convergence and final accuracy.`,
      r`Failing to set the model to evaluation mode (` + '`model.eval()`' + r`) during inference, causing BatchNorm to compute statistics on test batches instead of using tracked population averages.`,
      r`Using Post-LN (placing LayerNorm after the residual addition) without extensive learning rate warm-up, which causes sharp gradient instabilities in deep Transformer backbones.`,
    ],
    code: r`import numpy as np

# Synthetic batch: 2 samples, 5 hidden features
np.random.seed(42)
X = np.random.randn(2, 5) * 3.0 + 2.0  # mean ~ 2, std ~ 3

# 1. LayerNorm: zero mean and unit variance per sample across features
mu_ln = np.mean(X, axis=1, keepdims=True)
var_ln = np.var(X, axis=1, keepdims=True)
X_ln = (X - mu_ln) / np.sqrt(var_ln + 1e-5)

# 2. RMSNorm: unit root-mean-square per sample across features
rms = np.sqrt(np.mean(X**2, axis=1, keepdims=True) + 1e-5)
X_rms = X / rms

print("Original Sample 0:      ", np.round(X[0], 2).tolist())
print("Sample 0 mean and std:  ", round(float(np.mean(X[0])), 2), round(float(np.std(X[0])), 2))
print("LayerNorm Sample 0:     ", np.round(X_ln[0], 2).tolist())
print("LayerNorm mean and std: ", round(float(np.mean(X_ln[0])), 4), round(float(np.std(X_ln[0])), 4))
print("RMSNorm Sample 0:       ", np.round(X_rms[0], 2).tolist())
print("RMSNorm root-mean-square:", round(float(np.sqrt(np.mean(X_rms[0]**2))), 4))`,
    quiz: [
      {
        q: r`Why is Layer Normalisation preferred over Batch Normalisation in Transformers and natural language processing?`,
        o: [
          r`Because LayerNorm can only be applied to convolutional layers`,
          r`Because LayerNorm computes statistics across features within each token independently, handling variable sequence lengths and batch size 1 seamlessly`,
          r`Because LayerNorm completely eliminates the need for backpropagation`,
          r`Because BatchNorm requires labels to compute batch variance`,
        ],
        a: 1,
        why: r`LayerNorm operates along the channel/feature dimension for each individual token and sample independently. It does not mix information across the batch dimension, allowing identical execution during training and single-token inference.`,
      },
      {
        q: r`What key computational modification distinguishes RMSNorm from standard LayerNorm?`,
        o: [
          r`RMSNorm adds an exponential moving average across previous layers`,
          r`RMSNorm omits the mean subtraction step and standardises purely by the root-mean-square of activations`,
          r`RMSNorm replaces matrix multiplication with convolution`,
          r`RMSNorm eliminates all learnable parameters $\gamma$`,
        ],
        a: 1,
        why: r`RMSNorm posits that the scaling property of LayerNorm provides the primary training benefit. By omitting mean-centring ($\mu_i=0$), it reduces memory traffic and execution time while maintaining equivalent stability.`,
      },
      {
        q: r`What role do the learnable parameters $\gamma$ (scale) and $\beta$ (shift) serve in normalisation layers?`,
        o: [
          r`They enforce that activations are strictly bounded between 0 and 1`,
          r`They allow the network to learn any affine transformation of the standardised activations, including restoring original values if needed`,
          r`They prevent the optimiser from updating weight matrices`,
          r`They compute the test set accuracy at every forward pass`,
        ],
        a: 1,
        why: r`Without $\gamma$ and $\beta$, normalisation strictly forces activations to zero mean and unit variance, which might limit the representational power of non-linear activations. Learnable affine parameters allow the model to adapt or even undo the normalisation if optimal.`,
      },
      {
        q: r`What happens if you deploy a model containing Batch Normalisation in production but forget to switch it to evaluation mode?`,
        o: [
          r`The model refuses to process any inference requests and throws an immediate syntax error`,
          r`The model calculates mean and variance from the incoming test mini-batch rather than using frozen population statistics, causing erratic predictions on small batches`,
          r`All parameter weights are automatically reset to random Gaussian values`,
          r`The output probabilities become identical for every class`,
        ],
        a: 1,
        why: r`In training mode, BatchNorm computes statistics from the current batch. During inference on a single query ($B=1$), the batch variance is zero, producing undefined divisions or nonsensical outputs unless frozen running statistics are used.`,
      },
    ],
    usedBy: [],
    prereq: ['weight-initialisation-xavier-and-he', 'backpropagation-and-autodiff'],
    related: ['vanishing-and-exploding-gradients-clipping', 'learning-rate-schedules-and-warm-up', 'regularisation-dropout-weight-decay-early-stopping'],
    keywords: 'normalisation batchnorm layernorm rmsnorm internal covariate shift pre-ln post-ln affine scale shift standardisation transformer',
  },
  {
    id: 'regularisation-dropout-weight-decay-early-stopping',
    short: 'Regularisation: dropout, decay',
    title: 'Regularisation: Dropout, Weight Decay, and Early Stopping',
    task: 'concepts',
    module: 'Training fundamentals',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Overparameterised neural networks have enough capacity to memorise training noise verbatim. Regularisation bounds model complexity through stochastic feature dropout, weight shrinkage penalties, and validation-based early stopping.`,
    lead: r`Modern deep neural networks often contain far more parameters than training observations, granting them the capacity to achieve zero training error even on completely randomised labels. To ensure high test-time generalisation, practitioners combine three complementary regularisation pillars: weight decay to shrink parameter norms, inverted dropout to break co-adaptations between neurons, and early stopping to halt optimisation before noise memorisation begins.`,
    intuition: [
      r`Consider a dense neural network where two neurons in layer 2 always activate together to compensate for each other's errors. This co-adaptation creates fragile internal representations: if test data exhibits a slightly different distribution, both neurons misfire. <strong>Dropout</strong> shatters co-adaptations by randomly deactivating a subset of neurons (with probability $p$, typically $0.1$ to $0.5$) during each training forward pass. Because no neuron can rely on the presence of any other specific neuron, each is forced to learn robust, self-sufficient features. Mathematically, dropout acts as an implicit ensemble over $2^N$ possible thinned subnetworks.`,
      r`<strong>Weight Decay</strong> adds an $L_2$ penalty on parameter magnitudes, directly shrinking weights toward zero at every optimisation step. Keeping weights small ensures that small perturbations in input features cannot trigger massive, uncontrolled swings in downstream activations, effectively bounding the model's curvature. In adaptive optimisers such as [[optimisers-sgd-momentum-rmsprop-adam-adamw|AdamW]], this shrinkage must be decoupled from gradient scaling to prevent parameters with historically large gradients from escaping regularisation.`,
      r`<strong>Early Stopping</strong> exploits the learning dynamics of gradient descent. When training deep networks, optimisers typically capture broad, low-frequency patterns first before memorising high-frequency sample quirks and labelling errors. By continuously evaluating loss on a separate validation split and stopping training when validation loss stops improving (after a patience window, such as 5 epochs), early stopping acts as a non-parametric complexity control, preserving the checkpoint with the highest true generalisation power.`,
    ],
    analogy: r`Like training a robust disaster response team: weight decay ensures no single specialist hoards all responsibility, dropout ensures team members can function when colleagues are absent, and early stopping ends drills when team peak performance is reached before exhaustion induces bad habits.`,
    steps: [
      r`Partition a validation holdout: reserve 10% to 20% of training data (or establish cross-validation splits) to monitor generalisation independently of the optimiser's loss.`,
      r`Apply decoupled weight decay: set decay coefficient $\lambda$ (commonly $0.01$ to $0.1$ in AdamW) across 2D/3D weight matrices, while excluding 1D bias vectors and normalisation scales.`,
      r`Insert inverted dropout layers: position dropout modules ($p \in [0.1, 0.5]$) after activations or attention projections, scaling active units by $1 / (1-p)$ during training.`,
      r`Toggle evaluation mode: invoke ` + '`model.eval()`' + r` during inference to disable dropout, allowing all neurons to contribute deterministically without test-time scaling.`,
      r`Configure early stopping monitor: track validation loss with a patience threshold $P$ (e.g. 5 epochs), automatically rolling back to the best checkpoint when patience is exhausted.`,
    ],
    math: [
      {
        h: 'Decoupled weight decay parameter update',
        tex: r`$$w_t = (1 - \eta \lambda) w_{t-1} - \eta \Delta w_t$$`,
        p: r`$w_t$ is the weight vector at iteration $t$, $\eta$ is the learning rate, $\lambda$ is the weight decay coefficient, and $\Delta w_t$ is the gradient update direction (either the standard gradient or Adam's preconditioned gradient). The factor $(1 - \eta \lambda)$ shrinks the parameter toward zero at every step independently of gradient magnitudes.`,
      },
      {
        h: 'Inverted Dropout forward transform',
        tex: r`$$\tilde{h}_i = \frac{m_i}{1 - p} \cdot h_i, \qquad m_i \sim \operatorname{Bernoulli}(1 - p)$$`,
        p: r`$h_i$ is the original pre-dropout activation, $p$ is the dropout drop probability ($1-p$ is the survival probability), and $m_i \in \{0, 1\}$ is a random binary mask. Multiplying by the inverted scale factor $\frac{1}{1-p}$ ensures $\mathbb{E}[\tilde{h}_i] = h_i$, meaning expected activation magnitudes are preserved and test-time evaluation requires no post-scaling.`,
      },
      {
        h: 'Early stopping decision criterion',
        tex: r`$$\text{Halt if } t - \arg\min_{k \le t} \mathcal{L}_{\text{val}}(k) \ge P$$`,
        p: r`$\mathcal{L}_{\text{val}}(k)$ denotes validation loss evaluated at epoch $k$, and $P$ is the patience window. Training terminates when the number of epochs elapsed since the historical minimum validation loss reaches or exceeds $P$, preventing late-stage overfitting on idiosyncratic training artifacts.`,
      },
    ],
    keyPoints: [
      r`Weight decay penalises large parameter norms, smoothing the model's decision boundaries and bounding sensitivity to input noise.`,
      r`Inverted dropout trains an exponential ensemble of sub-architectures by randomly silencing units during forward passes, preventing co-adaptation.`,
      r`Early stopping serves as a compute-efficient regulariser that halts training before the network expends capacity memorising sample-specific label noise.`,
    ],
    pitfalls: [
      r`Leaving dropout active during inference, which introduces unwanted stochastic randomness and degraded deterministic test accuracy.`,
      r`Applying weight decay to bias parameters and normalisation scales ($\gamma, \beta$), which underfits the model by unnecessarily constraining affine shifts.`,
      r`Using $L_2$ regularisation inside Adam instead of decoupled weight decay (AdamW), where adaptive gradient denominators distort the intended shrinkage rate.`,
    ],
    code: r`import numpy as np

# 1. Inverted Dropout: preserve expectation across 10,000 activations
np.random.seed(42)
h = np.ones(10000) * 4.0
p_drop = 0.25
mask = (np.random.rand(10000) >= p_drop).astype(float)
h_drop = (h * mask) / (1.0 - p_drop)

print("Original activation mean: ", round(float(np.mean(h)), 2))
print("Inverted dropout mean:   ", round(float(np.mean(h_drop)), 2), "(expectation preserved)")

# 2. Decoupled weight decay step
w = 2.0
lr, wd = 0.1, 0.05
w_decayed = w * (1.0 - lr * wd)
print(f"Weight after decay step (lr={lr}, wd={wd}): {w_decayed:.4f}")

# 3. Early stopping loop with patience = 2
val_losses = [1.20, 0.90, 0.70, 0.72, 0.75, 0.80]
patience, best_loss, counter, stop_epoch = 2, float('inf'), 0, -1

for epoch, loss in enumerate(val_losses):
    if loss < best_loss:
        best_loss = loss
        counter = 0
    else:
        counter += 1
        if counter >= patience:
            stop_epoch = epoch
            break

print(f"Early stopping triggered at epoch {stop_epoch} (restoring best loss {best_loss:.2f})")`,
    quiz: [
      {
        q: r`Why does inverted dropout multiply surviving activations by $1 / (1 - p)$ during training?`,
        o: [
          r`To ensure that the loss function is strictly non-negative`,
          r`To maintain the same expected activation magnitude during training so that evaluation requires no modification`,
          r`To completely eliminate the need for backpropagation through hidden layers`,
          r`To convert negative activations into positive values`,
        ],
        a: 1,
        why: r`Because each neuron has probability $1-p$ of surviving, the expected sum of activations drops by a factor of $1-p$. Pre-scaling by $1/(1-p)$ ensures $\mathbb{E}[\tilde{h}] = h$, meaning the model can be used directly at test time without any rescaling.`,
      },
      {
        q: r`Why should weight decay typically be applied to weight matrices but excluded from bias vectors and normalisation scales?`,
        o: [
          r`Because bias vectors cannot be stored in 32-bit floating point format`,
          r`Because biases and normalisation gains govern output shifting and scaling; shrinking them toward zero restricts expressivity without reducing variance`,
          r`Because biases do not receive gradients during backpropagation`,
          r`Because regularising biases causes the Adam optimiser to divide by zero`,
        ],
        a: 1,
        why: r`Biases and normalisation parameters represent a tiny fraction of total model capacity. Penalising them forces the model's activations toward an arbitrary zero baseline, risking underfitting without improving overfitting protection.`,
      },
      {
        q: r`What is the primary mechanism through which dropout prevents overfitting in deep neural networks?`,
        o: [
          r`It breaks co-adaptations between neurons by forcing each unit to extract useful features in the absence of random peers`,
          r`It forces the learning rate to decay to zero after each mini-batch`,
          r`It rounds weight values to the nearest integer`,
          r`It discards 50% of the training labels at every epoch`,
        ],
        a: 0,
        why: r`Dropout ensures that no neuron can rely on a specific partner neuron to fix its errors. Neurons must develop standalone, generalisable features, functioning like an implicit ensemble over vast sub-networks.`,
      },
      {
        q: r`When implementing early stopping, what parameter state should be deployed to production?`,
        o: [
          r`The final weights from the very last training epoch`,
          r`The checkpoint that achieved the lowest recorded validation loss before patience was exhausted`,
          r`An average of all weights across all training epochs`,
          r`The initial random weights before training began`,
        ],
        a: 1,
        why: r`Early stopping continues past the optimum to confirm that validation loss has truly stopped improving. Once patience is exhausted, the training process must restore the checkpoint corresponding to the minimum validation loss.`,
      },
    ],
    usedBy: [],
    prereq: ['optimisers-sgd-momentum-rmsprop-adam-adamw', 'bias-variance-tradeoff', 'backpropagation-and-autodiff'],
    related: ['normalisation-batch-layer-rms', 'learning-rate-schedules-and-warm-up', 'vanishing-and-exploding-gradients-clipping'],
    keywords: 'regularisation dropout weight decay early stopping overparameterisation adamw inverted dropout l2 penalty patience co-adaptation validation loss',
  },
  {
  "id": "mixed-precision-and-training-stability",
  "short": "Mixed precision training",
  "title": "Mixed Precision and Training Stability: FP16, BF16, Loss Scaling, and Numerical Underflow",
  "task": "concepts",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "usedBy": [],
  "summary": "Accelerating neural network training by 2–3x and halving memory using FP16/BF16, master FP32 weights, and dynamic loss scaling.",
  "lead": "For decades, deep learning was trained exclusively in 32-bit single-precision floating point (FP32). Modern GPUs (NVIDIA Volta, Ampere, Hopper) feature dedicated Tensor Cores that execute 16-bit matrix multiplications up to 8x faster while consuming half the memory bandwidth. However, naive 16-bit training causes gradients to vanish into numerical zero (underflow) or explode into infinity. Mixed precision training combines 16-bit computation with 32-bit master weights and dynamic loss scaling.",
  "analogy": "Imagine an architect sketching blueprints. When brainstorming room layouts and drawing wall lengths, quick pencil sketches on half-sheet paper (16-bit) are fast and take up little desk space. But when calculating precise structural beam load equations where millimeter rounding errors could collapse the building, the engineer switches to an ultra-precise digital computer with double precision (32-bit). Mixed precision sketches quickly in 16-bit while anchoring critical structural sums in 32-bit.",
  "intuition": [
    "Standard IEEE 754 FP32 consists of 1 sign bit, 8 exponent bits, and 23 mantissa (fraction) bits, offering a dynamic range of $\\approx 10^{-38}$ to $10^{38}$. Standard FP16 has only 5 exponent bits and 10 mantissa bits, with a narrow dynamic range of $2^{-14} \\approx 6.1 \\times 10^{-5}$ to $65,504$.",
    "In deep networks, backpropagated gradients are frequently tiny (e.g. $10^{-6}$). In raw FP16, any gradient smaller than $6.1 \\times 10^{-5}$ flushes to exact zero (underflow), stalling learning completely. Conversely, activations larger than 65,504 overflow to `+Inf` / `NaN`.",
    "Mixed precision solves this via three techniques: 1) Master Weights: Weights and optimiser momentum states are maintained in full FP32, while forward and backward passes execute in fast FP16. 2) Dynamic Loss Scaling: Loss is multiplied by a large scale factor $S$ (e.g. 1024 or 65536) before backpropagation, shifting small gradients upward into the representable FP16 range. Gradients are then unscaled by $1/S$ before applying weight updates. 3) Precision-sensitive ops (Softmax, LayerNorm, loss) remain in FP32.",
    "BF16 (Bfloat16, Brain Floating Point) preserves the full 8 exponent bits of FP32 with 7 mantissa bits. It matches FP32's dynamic range, eliminating the need for complex loss scaling entirely."
  ],
  "steps": [
    "Select precision format: Choose BF16 on modern hardware (Ampere, Hopper, TPU) or FP16 with dynamic loss scaling on older GPUs (Turing, Volta).",
    "Maintain FP32 master weights: Store canonical model weights and optimiser states (Adam $m_t$ and $v_t$) in 32-bit precision.",
    "Cast activations for forward pass: Automatically cast input tensors and weights to FP16/BF16 during matrix multiplications and convolutions.",
    "Apply dynamic loss scaling: Multiply calculated scalar loss by scale factor $S$ prior to calling `.backward()`.",
    "Detect overflow and unscale: Inspect FP16 gradients for `Inf` or `NaN`. If detected, skip the optimiser step and decrease $S$; otherwise unscale gradients by $1/S$ and update FP32 master weights.",
    "Cast weights back to 16-bit: Copy updated FP32 master weights into 16-bit tensors for the subsequent training iteration."
  ],
  "math": [
    {
      "h": "Floating Point Bit Layout Comparison",
      "tex": "\\begin{aligned} \\text{FP32:} & \\quad 1 \\text{ sign}, \\; 8 \\text{ exp}, \\; 23 \\text{ mantissa} \\quad [\\text{Range } 10^{\\pm 38}] \\\\ \\text{FP16:} & \\quad 1 \\text{ sign}, \\; 5 \\text{ exp}, \\; 10 \\text{ mantissa} \\quad [\\text{Range } 10^{\\pm 5}, \\; \\max = 65,504] \\\\ \\text{BF16:} & \\quad 1 \\text{ sign}, \\; 8 \\text{ exp}, \\; 7 \\text{ mantissa} \\quad [\\text{Range } 10^{\\pm 38}, \\; \\max = 3.39 \\times 10^{38}] \\end{aligned}",
      "p": "BF16 allocates 8 exponent bits identical to FP32, preventing gradient underflow without requiring loss scaling."
    },
    {
      "h": "Dynamic Loss Scaling Gradient Shift",
      "tex": "g_{\\mathrm{scaled}} = \\nabla_w (S \\cdot \\mathcal{L}) = S \\cdot \\nabla_w \\mathcal{L}, \\quad g_{\\mathrm{true}} = \\frac{1}{S} \\cdot g_{\\mathrm{scaled}}",
      "p": "Multiplying loss by scale factor $S$ shifts tiny gradients into the representable positive exponent range of FP16."
    },
    {
      "h": "Dynamic Scale Factor Adaptation Rule",
      "tex": "S_{t+1} = \\begin{cases} S_t \\cdot \\frac{1}{2} & \\text{if } \\operatorname{has\\_inf\\_nan}(g_{\\mathrm{scaled}}) \\\\ S_t \\cdot 2 & \\text{if no inf/nan for } M \\text{ consecutive steps} \\\\ S_t & \\text{otherwise} \\end{cases}",
      "p": "Adapts loss scale dynamically: shrinking immediately upon numerical overflow and expanding when training is stable."
    }
  ],
  "code": "import torch\nimport torch.nn as nn\n\n# Standard PyTorch Automatic Mixed Precision (AMP) training pattern\ndevice = 'cuda' if torch.cuda.is_available() else 'cpu'\n\nmodel = nn.Sequential(\n    nn.Linear(1024, 2048),\n    nn.ReLU(),\n    nn.Linear(2048, 10)\n).to(device)\n\noptimiser = torch.optim.AdamW(model.parameters(), lr=1e-3)\ncriterion = nn.CrossEntropyLoss()\n\n# Initialise GradScaler for FP16 loss scaling (on CUDA)\nscaler = torch.amp.GradScaler('cuda', enabled=(device == 'cuda'))\n\n# Dummy input batch\nx = torch.randn(64, 1024, device=device)\ntarget = torch.randint(0, 10, (64,), device=device)\n\noptimiser.zero_grad()\n\n# Forward pass under autocast context\n# Tensor Core operations (Linear, Conv) run in fast FP16/BF16\nwith torch.amp.autocast(device_type=device, dtype=torch.float16, enabled=(device == 'cuda')):\n    output = model(x)\n    loss = criterion(output, target)\n\n# Backward pass with scaled gradients to prevent underflow\nscaler.scale(loss).backward()\n\n# Unscale gradients and update FP32 master weights\nscaler.step(optimiser)\nscaler.update()\n\nprint(f\"Mixed precision step completed on {device}. Current scale factor: {scaler.get_scale()}\")",
  "keyPoints": [
    "Mixed precision accelerates training 2–3x and cuts activation memory in half using Tensor Cores.",
    "FP16 has a narrow dynamic range, requiring dynamic loss scaling to prevent tiny gradients from flushing to zero.",
    "BF16 shares FP32's 8-bit exponent, matching FP32 dynamic range and eliminating loss scaling.",
    "Master weights and optimiser states must remain in FP32 to accumulate tiny weight delta updates."
  ],
  "pitfalls": [
    "Applying FP16 to Softmax or LayerNorm: Operations that sum exponents (Softmax) or compute variances easily overflow 65,504; always run normalisation in FP32.",
    "Accumulating Adam optimiser states in FP16: In Adam, $v_t$ squares tiny gradients ($10^{-8}$), causing complete underflow in 16-bit; optimiser states must be FP32.",
    "Using FP16 without GradScaler: Running raw FP16 backward passes without gradient scaling causes 30–50% of gradients to underflow to zero, stalling convergence."
  ],
  "quiz": [
    {
      "q": "Why are master weights and optimiser momentum states stored in FP32 even during mixed precision training?",
      "o": [
        "Because GPUs cannot write to 16-bit memory",
        "Because individual weight updates $\\eta \\cdot g_t$ are tiny; adding a tiny 16-bit delta to a larger weight causes arithmetic cancellation and underflow in 16-bit",
        "Because PyTorch models cannot be saved to disk in 16-bit",
        "Because FP32 weights run faster than FP16 weights"
      ],
      "a": 1,
      "why": "Learning rate multiplied by gradient is often small ($10^{-5}$). Adding this tiny delta to an FP16 weight results in no change due to lack of mantissa bits. FP32 master weights preserve small accumulations."
    },
    {
      "q": "What is the primary advantage of BF16 (Brain Floating Point) over classical FP16?",
      "o": [
        "BF16 uses only 8 bits in total",
        "BF16 allocates 8 exponent bits (same as FP32), matching FP32's broad dynamic range and eliminating the need for loss scaling",
        "BF16 has higher fractional precision than FP32",
        "BF16 works on standard consumer laptops without GPUs"
      ],
      "a": 1,
      "why": "By keeping 8 exponent bits, BF16 spans the same dynamic range ($10^{\\pm 38}$) as FP32, making underflow and overflow virtually non-existent without complex loss scalers."
    },
    {
      "q": "What is the purpose of dynamic loss scaling when training in FP16?",
      "o": [
        "To increase the learning rate of the optimiser",
        "To multiply the loss by a large factor before backpropagation, shifting small gradients upward into the representable range of FP16 to prevent underflow",
        "To normalise input image pixels between 0 and 1",
        "To prevent the GPU from overheating"
      ],
      "a": 1,
      "why": "Many backpropagated gradients are smaller than $2^{-14} \\approx 6 \\times 10^{-5}$. Scaling loss by e.g. 1024 shifts gradients into the representable positive exponent range."
    }
  ],
  "related": [
    "the-pytorch-training-loop",
    "weight-initialisation-xavier-and-he",
    "vanishing-and-exploding-gradients-clipping"
  ],
  "keywords": "mixed precision, fp16, bf16, bfloat16, tensor cores, dynamic loss scaling, underflow, overflow, automatic mixed precision, amp"
},
  {
    id: 'the-pytorch-training-loop',
    short: 'PyTorch training loop',
    title: 'The PyTorch Training Loop',
    task: 'concepts',
    module: 'Practical deep learning',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`The core heartbeat of deep learning. Five explicit operations inside nested epoch and mini-batch loops convert raw datasets into trained weights with full control over gradient flow.`,
    lead: r`Unlike high-level frameworks that bury mechanics inside opaque black-box calls, PyTorch exposes the training loop explicitly. An idiomatic loop orchestrates data mini-batching, device transfers, gradient zeroing, forward propagation, loss calculation, backpropagation, and optimiser parameter updates with surgical precision.`,
    intuition: [
      r`Training a neural network is an iterative dialogue between empirical data batches and parameter gradients. At the centre of every training script sits a nested loop: an outer loop that repeats over epochs (full sweeps through the dataset) and an inner loop that processes one mini-batch at a time. Within each batch, five fundamental operations must execute in strict sequence: zero gradients, compute predictions, evaluate the loss, backpropagate gradients, and step the optimiser.`,
      r`The first operation—zeroing gradients via ` + '`optimiser.zero_grad(set_to_none=True)`' + r`—is essential because PyTorch deliberately accumulates gradients by default. If you omit this call, gradients from the current batch add directly to the residual gradients of all preceding batches, quickly blowing parameters to non-finite infinity. Passing ` + '`set_to_none=True`' + r` deletes the gradient memory buffers entirely rather than writing zeros into them, saving valuable GPU memory bandwidth.`,
      r`Equally crucial is the discipline of toggling execution modes. Setting ` + '`model.train()`' + r` enables stochastic behaviours such as [[regularisation-dropout-weight-decay-early-stopping|dropout]] and updates running statistics in [[normalisation-batch-layer-rms|Batch Normalisation]]. Conversely, before running validation, switching to ` + '`model.eval()`' + r` freezes these layers and wrapping evaluation in ` + '`with torch.no_grad():`' + r` disables computational graph construction, drastically slashing memory consumption and preventing memory leaks.`,
    ],
    analogy: r`Like a competitive rowing crew executing a stroke cycle: clear the oars from the water (zero gradients), drive the stroke forward (forward pass), check boat speed against the pace clock (loss), assess blade resistance (backward pass), and adjust rower body angles (optimiser step).`,
    steps: [
      r`Assemble the pipeline: define the neural architecture, instantiate the criterion (` + '`nn.CrossEntropyLoss`' + r`), initialise the optimiser ([[optimisers-sgd-momentum-rmsprop-adam-adamw|torch.optim.AdamW]]), and prepare shuffled ` + '`DataLoader`' + r` instances.`,
      r`Set training mode: invoke ` + '`model.train()`' + r` at the start of each training epoch so dropout masks and normalisation layers engage their stochastic training logic.`,
      r`Execute the 5-step batch loop: iterate over mini-batches, clear parameter gradients, evaluate the forward pass, compute the loss scalar, run ` + '`loss.backward()`' + r`, and apply ` + '`optimiser.step()`' + r`.`,
      r`Accumulate metrics cleanly: extract scalar loss values using ` + '`loss.item()`' + r` rather than appending raw loss tensors, preventing dynamic computational graphs from accumulating indefinitely in GPU memory.`,
      r`Run evaluation under no-grad: switch to ` + '`model.eval()`' + r`, wrap validation loops in ` + '`with torch.no_grad():`' + r`, accumulate validation loss, and step learning-rate schedulers.`,
    ],
    math: [
      {
        h: 'Gradient accumulation across micro-batches',
        tex: r`$$g = \frac{1}{K}\sum_{k=1}^K \nabla_\theta \mathcal{L}(B_k; \theta), \qquad \theta \leftarrow \theta - \eta \cdot \Delta(g)$$`,
        p: r`$K$ is the number of accumulation steps, $B_k$ is the $k$-th micro-batch, and $\Delta(g)$ is the optimiser update direction. Because PyTorch accumulates gradients in ` + '`p.grad`' + r` by default, calling ` + '`optimiser.step()`' + r` and ` + '`optimiser.zero_grad()`' + r` only once every $K$ batches enables training with large effective batch sizes without exhausting GPU VRAM.`,
      },
      {
        h: 'Training vs evaluation forward transformation',
        tex: r`$$\hat{y}_{\text{train}} = f(x; \theta, \mathbf{m} \sim \operatorname{Bernoulli}(1-p), \mu_B, \sigma_B^2), \qquad \hat{y}_{\text{eval}} = f(x; \theta, \mathbf{1}, \mu_{\text{run}}, \sigma_{\text{run}}^2)$$`,
        p: r`Illustrates the operational difference between ` + '`model.train()`' + r` and ` + '`model.eval()`' + r`. In training mode, activations are perturbed by random dropout mask $\mathbf{m}$ and normalised by batch statistics $(\mu_B, \sigma_B^2)$; in evaluation mode, all units remain active ($\mathbf{1}$) and frozen population averages $(\mu_{\text{run}}, \sigma^2_{\text{run}})$ ensure deterministic inference.`,
      },
    ],
    keyPoints: [
      r`Calling ` + '`optimiser.zero_grad(set_to_none=True)`' + r` before ` + '`loss.backward()`' + r` is mandatory; omitting it causes gradients from consecutive batches to compound destructively.`,
      r`Setting ` + '`model.eval()`' + r` adjusts layer behaviour (dropout, batchnorm) but does not turn off autodiff; ` + '`with torch.no_grad():`' + r` is required to disable computational graph allocation during evaluation.`,
      r`Tracking total epoch loss must always use ` + '`loss.item()`' + r` (a Python float); adding the raw ` + '`loss`' + r` tensor retains the entire autograd tape in VRAM, causing an out-of-memory crash.`,
    ],
    pitfalls: [
      r`Omitting ` + '`optimiser.zero_grad()`' + r`, causing gradients to compound across batches and producing exploding parameter values in the first epoch.`,
      r`Evaluating validation data inside ` + '`model.train()`' + r`, which contaminates predictions with stochastic dropout noise and calculates batch statistics on test splits.`,
      r`Accumulating the autograd graph by writing ` + '`total_loss += loss`' + r` instead of ` + '`total_loss += loss.item()`' + r`, exhausting host or accelerator memory.`,
    ],
    code: r`import numpy as np

# Synthetic linear dataset: y = 2*x + 1
np.random.seed(42)
X = np.random.randn(20, 1)
y = 2.0 * X + 1.0 + np.random.randn(20, 1) * 0.05

# Initialise model parameters and learning rate
w = np.random.randn(1, 1)
b = np.zeros(1)
lr = 0.1

print("Executing 5-step training loop across 30 epochs:")
for epoch in range(1, 31):
    # Step 1: Zero gradients
    dw, db = np.zeros_like(w), np.zeros_like(b)
    # Step 2: Forward pass
    y_pred = X @ w + b
    # Step 3: Compute loss (Mean Squared Error)
    loss = float(np.mean((y_pred - y)**2))
    # Step 4: Backward pass (analytical autodiff gradients)
    grad = 2.0 * (y_pred - y) / len(X)
    dw = X.T @ grad
    db = np.sum(grad, axis=0)
    # Step 5: Optimiser parameter update step
    w -= lr * dw
    b -= lr * db

print(f"Trained parameter w: {w[0, 0]:.4f} (target: 2.0000)")
print(f"Trained parameter b: {b[0]:.4f} (target: 1.0000)")
print(f"Final training loss: {loss:.4f}")`,
    quiz: [
      {
        q: r`What occurs if a developer forgets to call optimiser.zero_grad() between mini-batch iterations?`,
        o: [
          r`The model stops updating because gradients are automatically reset to NaN`,
          r`The gradients of the new batch are added onto the gradients of the previous batch, leading to runaway update magnitudes`,
          r`PyTorch throws an immediate runtime exception and halts execution`,
          r`The learning rate is automatically divided by the batch index`,
        ],
        a: 1,
        why: r`PyTorch accumulates gradients into parameter ` + '`.grad`' + r` buffers by default. Without zeroing, gradients from all prior batches sum together, rapidly destabilising training.`,
      },
      {
        q: r`Why is wrapping the validation loop in with torch.no_grad(): strongly recommended?`,
        o: [
          r`It disables the backward pass autograd tape, significantly reducing GPU memory consumption and speeding up inference`,
          r`It automatically applies cosine learning rate decay to the optimiser`,
          r`It converts the model into a scikit-learn compatible estimator`,
          r`It forces the model to use 8-bit integer quantisation`,
        ],
        a: 0,
        why: r`During validation, gradients are never computed. Disabling graph tracking prevents PyTorch from allocating memory for intermediate forward activations, avoiding out-of-memory errors.`,
      },
      {
        q: r`Why should running loss be accumulated using loss.item() rather than the loss tensor itself?`,
        o: [
          r`Because loss.item() converts the loss to logarithmic units`,
          r`Because appending the raw tensor keeps a reference to the entire autograd computational graph, causing a memory leak across epochs`,
          r`Because Python floats cannot be divided by batch count`,
          r`Because loss.item() automatically normalises the loss across multiple GPUs`,
        ],
        a: 1,
        why: r`A PyTorch loss tensor contains pointers to the backward computational graph. Retaining it prevents garbage collection of the graph, quickly exhausting available system or GPU RAM.`,
      },
      {
        q: r`What is the primary operational benefit of gradient accumulation across multiple micro-batches?`,
        o: [
          r`It eliminates the need for computing cross-entropy loss`,
          r`It allows practitioners to simulate large effective batch sizes without exceeding GPU physical memory limits`,
          r`It guarantees that the model achieves zero validation error`,
          r`It replaces weight decay with explicit gradient clipping`,
        ],
        a: 1,
        why: r`By executing multiple forward and backward passes before calling ` + '`optimiser.step()`' + r`, gradient accumulation aggregates gradients over multiple smaller micro-batches, simulating a much larger batch size on hardware with restricted VRAM.`,
      },
    ],
    usedBy: [],
    prereq: ['backpropagation-and-autodiff', 'optimisers-sgd-momentum-rmsprop-adam-adamw'],
    related: ['reading-loss-curves-and-debugging-training', 'transfer-learning-and-fine-tuning', 'vanishing-and-exploding-gradients-clipping'],
    keywords: 'pytorch training loop zero_grad backward step optimiser state_dict dataloader model train eval no_grad gradient accumulation loss item',
  },
  {
    id: 'reading-loss-curves-and-debugging-training',
    short: 'Reading loss curves',
    title: 'Reading Loss Curves and Debugging Training',
    task: 'concepts',
    module: 'Practical deep learning',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Loss curves are the primary telemetry of machine learning. Diagnosing divergence, underfitting, overfitting, gradient collapse, and bad learning rates from training versus validation trajectories.`,
    lead: r`Deep learning models rarely converge cleanly on the first try. Training and validation loss curves provide an unfiltered diagnostic window into internal optimisation dynamics: learning rates that are too aggressive, representational underfitting, noise memorisation, or corrupted labels each leave unmistakable graphical signatures.`,
    intuition: [
      r`When training a neural network, logging training loss $\mathcal{L}_{\text{train}}$ and validation loss $\mathcal{L}_{\text{val}}$ at regular intervals creates a pair of diagnostic curves. In a healthy run, both curves decline steadily in tandem; the training curve settles slightly below the validation curve, and both decelerate into a smooth asymptotic plateau as parameters approach a high-quality basin.`,
      r`When learning fails, the curves reveal the underlying pathology. In **overfitting**, the training loss continues its monotonic descent toward zero while the validation loss reaches a trough and turns sharply upward (the classic U-shaped curve). The model has exhausted generalisable patterns and has begun memorising idiosyncratic sample noise. In **underfitting**, both curves flatten almost immediately at an unacceptably high loss plateau: the model lacks sufficient capacity, features lack signal, or the optimisation has stalled.`,
      r`The single most powerful diagnostic protocol is the **single-batch sanity check**: take 10 to 20 samples from your dataset and train the model on them without regularisation. If an overparameterised network cannot drive training loss to absolute zero on 10 samples within 50 epochs, there is an algorithmic or coding defect in your pipeline—such as inverted loss signs, detached autograd tensors, mismatched label dimensions, or unscaled input features.`,
    ],
    analogy: r`Like reading an intensive care telemetry monitor: a steady downward rhythm reflects healthy recovery, erratic vertical spikes indicate cardiac fibrillation (exploding learning rate), and flatlining indicates complete system failure (dead gradients or frozen weights).`,
    steps: [
      r`Perform the single-batch check: train on 10 fixed samples with zero regularisation; confirm that loss drives to zero ($< 10^{-4}$) to rule out implementation bugs.`,
      r`Check initial loss magnitude: verify that initial epoch loss aligns with random guessing (e.g. $-\ln(1/C) = \ln(C)$ for cross-entropy with $C$ balanced classes).`,
      r`Plot curves on identical step axes: chart $\mathcal{L}_{\text{train}}$ and $\mathcal{L}_{\text{val}}$ simultaneously, smoothing noisy batch fluctuations with exponential moving averages.`,
      r`Measure the generalisation gap: compute $\Delta = \mathcal{L}_{\text{val}} - \mathcal{L}_{\text{train}}$; an expanding gap signals the onset of overfitting, dictating early stopping or increased weight decay.`,
      r`Calibrate learning rate from curvature: if loss oscillates wildly or produces NaNs, decrease the rate by $3\times$ to $10\times$; if loss slopes downward at a glacial pace, increase the learning rate or apply warm-up.`,
    ],
    math: [
      {
        h: 'Expected initial cross-entropy loss baseline',
        tex: r`$$\mathcal{L}_{\text{init}} = -\sum_{c=1}^C \frac{1}{C} \ln\left(\frac{1}{C}\right) = \ln(C)$$`,
        p: r`$C$ is the number of mutually exclusive target classes. For a randomly initialised network where all output logits are approximately zero, predicted probabilities are uniform ($1/C$). For CIFAR-10 ($C=10$), initial loss must be near $\ln(10) \approx 2.3026$. An initial loss of $15.0$ or $0.1$ signals broken initialisation, incorrect loss criteria, or faulty label indices.`,
      },
      {
        h: 'Generalisation gap tracking',
        tex: r`$$\mathcal{G}(t) = \mathcal{L}_{\text{val}}(t) - \mathcal{L}_{\text{train}}(t), \qquad \frac{d\mathcal{G}}{dt} > 0 \quad \text{when } \frac{d\mathcal{L}_{\text{val}}}{dt} > 0 \text{ and } \frac{d\mathcal{L}_{\text{train}}}{dt} < 0$$`,
        p: r`$\mathcal{G}(t)$ measures the generalisation gap at epoch $t$. When the derivative of validation loss turns positive while training loss continues declining, the model transitions from representation learning to memorisation, indicating that [[regularisation-dropout-weight-decay-early-stopping|early stopping]] should trigger.`,
      },
    ],
    keyPoints: [
      r`Overfitting a single mini-batch of 10 samples to zero loss is the fastest method to verify that data loading, forward passes, autograd, and loss calculation work correctly.`,
      r`Initial cross-entropy loss on $C$ balanced classes should always be approximately $\ln(C)$; substantial divergence warns of unnormalised inputs or corrupted labels.`,
      r`A rising validation loss paired with a collapsing training loss marks the textbook onset of overfitting, calling for increased regularisation or early stopping.`,
    ],
    pitfalls: [
      r`Tuning regularisation hyperparameters before proving that the network can overfit a single mini-batch to zero loss.`,
      r`Calculating training loss as a cumulative running average across an epoch while evaluating validation loss at epoch end, falsely making validation loss appear lower than training loss.`,
      r`Confusing optimisation stagnation (loss plateauing early due to vanishing gradients or a tiny learning rate) with genuine model convergence.`,
    ],
    code: r`import numpy as np

# 1. Theoretical initial loss check for C=10 classes
C = 10
expected_init = np.log(C)
print(f"Theoretical initial loss for {C} balanced classes: {expected_init:.4f}")

# 2. Diagnose training trajectories from loss history
epochs = list(range(1, 7))
train_curve = [2.30, 1.80, 1.20, 0.60, 0.20, 0.05]
val_curve   = [2.31, 1.85, 1.30, 0.95, 1.10, 1.45]

gap = val_curve[-1] - train_curve[-1]
is_overfitting = (val_curve[-1] > val_curve[-2]) and (train_curve[-1] < train_curve[-2])

print(f"Epoch 6 - Training loss:   {train_curve[-1]:.2f}")
print(f"Epoch 6 - Validation loss: {val_curve[-1]:.2f}")
print(f"Generalisation gap:        {gap:.2f}")
if is_overfitting:
    print("Diagnosis: Severe overfitting detected (val loss rising while train loss drops)")`,
    quiz: [
      {
        q: r`You initialise a neural network for a 100-class classification problem. What should the initial loss be approximately if weights are randomised properly?`,
        o: [
          r`Approximately 0.0100`,
          r`Approximately 4.6052`,
          r`Approximately 10.0000`,
          r`Approximately 0.6931`,
        ],
        a: 1,
        why: r`With uniform random predictions across $C=100$ balanced classes, predicted probabilities are $1/100 = 0.01$. The expected negative log-likelihood is $-\ln(0.01) = \ln(100) \approx 4.6052$.`,
      },
      {
        q: r`What is the primary purpose of the "single-batch sanity check" in deep learning?`,
        o: [
          r`To verify that the model achieves high test-set accuracy on unseen data`,
          r`To prove that the pipeline has no implementation bugs by confirming the network can memorise 10 samples to zero loss`,
          r`To calculate the optimal learning rate schedule automatically`,
          r`To measure the GPU memory bandwidth of the data loader`,
        ],
        a: 1,
        why: r`An overparameterised network has ample capacity to fit 10 samples perfectly. If it cannot achieve zero training loss on a tiny fixed batch, an algorithmic or coding defect exists in the model or loss setup.`,
      },
      {
        q: r`If both training loss and validation loss flatten early at a very high error rate and do not improve with further training, what is the most likely diagnosis?`,
        o: [
          r`Severe overfitting to training labels`,
          r`High bias (underfitting), caused by insufficient network capacity, poor feature scaling, or a learning rate that is too low`,
          r`Data leakage between training and validation splits`,
          r`Excessive inverted dropout probability`,
        ],
        a: 1,
        why: r`When both curves plateau together at an unacceptably high loss, the model is failing to fit the training data itself (underfitting), indicating capacity or optimisation constraints rather than variance issues.`,
      },
      {
        q: r`During training, you observe that training loss decreases steadily while validation loss decreases to a minimum at epoch 12 and then steadily rises. What action should you take?`,
        o: [
          r`Stop training and deploy the checkpoint saved at epoch 12, or increase regularisation (weight decay, dropout)`,
          r`Increase the learning rate by a factor of 10 to jump over the validation plateau`,
          r`Remove all validation data and train exclusively on the combined dataset`,
          r`Disable early stopping and train for 500 more epochs until validation loss drops`,
        ],
        a: 0,
        why: r`The divergence of validation loss away from training loss indicates that the model has crossed into noise memorisation. Restoring the epoch 12 checkpoint or applying stronger regularisation directly addresses this overfitting.`,
      },
    ],
    usedBy: [],
    prereq: ['the-pytorch-training-loop', 'bias-variance-tradeoff', 'learning-rate-schedules-and-warm-up'],
    related: ['regularisation-dropout-weight-decay-early-stopping', 'transfer-learning-and-fine-tuning', 'vanishing-and-exploding-gradients-clipping'],
    keywords: 'loss curves debugging training overfitting underfitting generalisation gap cross-entropy baseline single batch sanity check telemetry',
  },
  {
    id: 'transfer-learning-and-fine-tuning',
    short: 'Transfer learning & fine-tuning',
    title: 'Transfer Learning and Fine-Tuning',
    task: 'concepts',
    module: 'Practical deep learning',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Do not train complex vision or language networks from scratch when foundation models have spent millions of GPU hours learning universal representations. Freeze, adapt, and fine-tune for sample-efficient mastery.`,
    lead: r`Training deep architectures from scratch requires massive labelled datasets and substantial computational budgets. Transfer learning reuses parameter representations learned on massive upstream corpora (such as ImageNet or web-scale text) and adapts them to specialized downstream tasks using linear probing, head replacement, and differential fine-tuning.`,
    intuition: [
      r`Deep neural networks learn hierarchical feature representations. In vision backbones, early layers act as Gabor-like edge and texture filters; intermediate layers assemble these primitives into textures, corners, and motifs; and late layers combine parts into task-specific semantic classes. Because early and middle representations capture fundamental statistical structures of the physical world, they transfer effortlessly across domains. A model pre-trained on natural photos already understands edge detection and spatial composition, making it equally adept at learning medical radiographs or satellite images.`,
      r`Practitioners adapt pre-trained models using two primary methodologies. In **feature extraction (linear probing)**, the entire pre-trained backbone is frozen (` + '`param.requires_grad = False`' + r`), and only a newly appended classification head is trained. This strategy is lightning-fast, computationally cheap, and immune to overfitting on small target datasets ($N < 1,000$). In **fine-tuning**, the backbone weights are unfrozen and trained alongside the head using a substantially reduced learning rate ($10\times$ to $100\times$ smaller than training from scratch), allowing pre-trained filters to adapt gently to target domain nuances.`,
      r`A common failure mode during fine-tuning is **catastrophic forgetting**: if you unfreeze the backbone immediately while the new head is completely random, large initial gradient updates from the disordered head wash backward through the network, destroying years of pre-trained feature representations in the very first epoch. The standard remedy is staged unfreezing: train the head alone for several epochs until its loss stabilizes, then unfreeze the backbone with layer-wise discriminative learning rates.`,
    ],
    analogy: r`Like hiring a classically trained concert pianist to play jazz: you do not need to teach them finger agility, pitch recognition, or reading music from scratch (pre-trained backbone); you simply teach them jazz harmonic progressions and improvisation phrasing (fine-tuning the head).`,
    steps: [
      r`Select a foundation backbone: pick a pre-trained model whose upstream data distribution shares structural affinities with the target task (e.g. ResNet/ConvNeXt for vision; BERT/RoBERTa/Llama for NLP).`,
      r`Replace the task head: strip the original final projection layer and attach a new randomly initialised linear classifier sized to your target class count.`,
      r`Warm up the head (linear probe): freeze all backbone layers (` + '`requires_grad = False`' + r`) and train only the new head for 3 to 5 epochs to bring output projections into an orderly parameter regime.`,
      r`Unfreeze with discriminative learning rates: unlock backbone parameters and assign smaller learning rates to early layers ($\eta_{\text{early}} = 0.1 \cdot \eta_{\text{head}}$) to preserve universal primitive filters.`,
      r`Apply regularisation and evaluate: employ [[regularisation-dropout-weight-decay-early-stopping|weight decay]] and early stopping to prevent overparameterised backbones from memorising small target datasets.`,
    ],
    math: [
      {
        h: 'Transfer learning objective with parameter regularisation',
        tex: r`$$\min_{\theta_{\text{bb}}, \theta_{\text{head}}} \frac{1}{N}\sum_{i=1}^N \mathcal{L}\Big(g_{\theta_{\text{head}}}\big(f_{\theta_{\text{bb}}}(x_i)\big), y_i\Big) + \lambda_{\text{head}} \lVert \theta_{\text{head}} \rVert_2^2 + \lambda_{\text{bb}} \lVert \theta_{\text{bb}} - \theta_{\text{bb}}^{(0)} \rVert_2^2$$`,
        p: r`$f_{\theta_{\text{bb}}}$ is the feature extraction backbone, $g_{\theta_{\text{head}}}$ is the task head, and $\theta_{\text{bb}}^{(0)}$ represents the original pre-trained weight initialisation. The final term anchors backbone weights to their pre-trained values, regularising representation drift during fine-tuning.`,
      },
      {
        h: 'Layer-wise discriminative learning rate schedule',
        tex: r`$$\eta_l = \eta_{\text{head}} \cdot \xi^{L - l}, \qquad 0 < \xi < 1$$`,
        p: r`$L$ is the total layer depth, $l \in [1, L]$ is the layer index, and $\xi$ is the decay multiplier (typically $0.7$ to $0.9$). Early layers ($l=1$) receive geometrically smaller updates, ensuring that low-level edge and texture detectors remain stable while higher layers adapt to target semantics.`,
      },
    ],
    keyPoints: [
      r`Transfer learning drastically reduces the dataset size and training duration required to achieve competitive deep learning accuracy.`,
      r`Freezing the backbone to train the randomly initialised head first prevents catastrophic forgetting of pre-trained feature hierarchies.`,
      r`Discriminative learning rates assign smaller update steps to lower layers, protecting universal spatial or syntactic primitives while adapting high-level semantics.`,
    ],
    pitfalls: [
      r`Fine-tuning the entire network end-to-end with a large learning rate from epoch 1, immediately destroying pre-trained representations.`,
      r`Using mismatched image normalisation statistics (e.g. standardising with mean $0.5$ when the backbone was trained with ImageNet RGB mean and variance).`,
      r`Attempting feature extraction when the downstream task is drastically dissimilar from pre-training data, where end-to-end fine-tuning is required.`,
    ],
    code: r`import numpy as np

# Simulate pre-trained feature extraction on target classification task
np.random.seed(42)
N, D = 100, 8  # 100 target samples with 8-dimensional pre-trained embeddings
X_features = np.random.randn(N, D)
# Target ground truth driven primarily by features 0 and 1
y_target = (1.5 * X_features[:, 0] - 2.0 * X_features[:, 1] > 0).astype(int)

# Linear probe: train head weights (8 -> 1) with frozen backbone features
w_head = np.zeros(D)
lr_head = 0.2

for _ in range(50):
    logits = X_features @ w_head
    probs = 1.0 / (1.0 + np.exp(-logits))
    grad = X_features.T @ (probs - y_target) / N
    w_head -= lr_head * grad

# Evaluate target accuracy
predictions = (X_features @ w_head > 0).astype(int)
accuracy = float(np.mean(predictions == y_target))

print(f"Linear probe target task accuracy: {accuracy * 100:.1f}%")
print(f"Learned head weights for top 2 features: {w_head[0]:.3f}, {w_head[1]:.3f}")`,
    quiz: [
      {
        q: r`What is catastrophic forgetting during fine-tuning of deep neural networks?`,
        o: [
          r`The model runs out of GPU memory during backward passes`,
          r`Large gradient updates from a randomly initialised head overwrite and destroy pre-trained representations in early layers`,
          r`The optimiser permanently deletes learning rate schedule milestones`,
          r`The validation dataset is accidentally shuffled into the training split`,
        ],
        a: 1,
        why: r`When an untrained head outputs large random errors, backpropagating these massive gradients into an unfrozen backbone immediately shatters the delicately tuned pre-trained weights.`,
      },
      {
        q: r`When is linear probing (feature extraction with a frozen backbone) preferred over full fine-tuning?`,
        o: [
          r`When the target dataset has millions of labelled examples`,
          r`When the target dataset is small (e.g. hundreds of samples) and similar in domain to the pre-training data`,
          r`When the target task has 1,000 output classes`,
          r`When the model must run exclusively on CPU hardware`,
        ],
        a: 1,
        why: r`With small target datasets, fine-tuning millions of backbone parameters quickly leads to severe overfitting. Freezing the backbone restricts training to the linear head, preserving generalisation.`,
      },
      {
        q: r`How do discriminative (layer-wise) learning rates help preserve pre-trained knowledge?`,
        o: [
          r`They apply progressively smaller learning rates to earlier layers, leaving low-level general feature detectors largely intact while allowing higher layers to adapt`,
          r`They set the learning rate of odd-numbered layers to zero`,
          r`They force all convolutional kernels to sum to one`,
          r`They multiply the learning rate by the batch size at every epoch`,
        ],
        a: 0,
        why: r`Early layers capture universal features (edges, basic textures) that rarely need alteration. Decaying the learning rate with depth shields these foundational filters while granting semantic layers flexibility.`,
      },
      {
        q: r`What pre-processing step is essential when performing transfer learning with a vision backbone like ResNet?`,
        o: [
          r`Converting all target images to binary black-and-white silhouettes`,
          r`Applying the exact same normalisation mean and standard deviation used during the model's original pre-training`,
          r`Randomly swapping the red and blue colour channels`,
          r`Padding every image to $1024 \times 1024$ resolution with zeros`,
        ],
        a: 1,
        why: r`Pre-trained neural weights expect input activations to conform to the specific channel means and variances used during upstream training (such as ImageNet channel statistics); mismatching them degrades performance.`,
      },
    ],
    usedBy: [],
    prereq: ['the-pytorch-training-loop', 'learning-rate-schedules-and-warm-up', 'weight-initialisation-xavier-and-he'],
    related: ['reading-loss-curves-and-debugging-training', 'regularisation-dropout-weight-decay-early-stopping', 'residual-networks-and-skip-connections'],
    keywords: 'transfer learning fine tuning linear probing frozen backbone catastrophic forgetting discriminative learning rates head adaptation foundation models',
  },
  {
  "id": "data-augmentation-and-mixup",
  "short": "Data augmentation & Mixup",
  "title": "Data Augmentation and Mixup: Regularising Deep Models via Synthetic Manifold Interpolation",
  "task": "concepts",
  "level": 2,
  "minutes": 15,
  "noLab": true,
  "usedBy": [],
  "summary": "Preventing overfitting and calibrating overconfident predictions using geometric transforms, CutMix, RandAugment, and Mixup linear interpolation.",
  "lead": "Deep neural networks possess millions or billions of parameters, giving them the capacity to memorize the training dataset entirely. When trained on finite data, networks overfit to spurious background cues and develop overconfident calibration errors. Data augmentation synthesises diverse, label-preserving training examples on the fly, while continuous interpolation methods like Mixup enforce linear behaviour between training samples.",
  "analogy": "Imagine training a police dog to recognise illegal contraband. If the dog is trained only on packages wrapped in brown cardboard boxes, it might mistakenly learn that \"brown cardboard equals contraband\". Data augmentation is like hiding contraband inside plastic suitcases, gift boxes, and metal tins under bright lights and in shadows so the dog learns invariant scent features rather than superficial packaging.",
  "intuition": [
    "Standard data augmentation applies domain-specific label-preserving transformations: for images, random cropping, horizontal flipping, affine rotations, and colour jittering. This injects inductive bias (e.g. an object's identity is invariant to translation or slight lighting changes).",
    "Advanced policy-based augmentation (RandAugment, AutoAugment) replaces manual guesswork by randomly sampling $N$ transforms with magnitude $M$ from a library of operations, maximising data entropy without distorting semantics.",
    "Mixup (Zhang et al., 2017) goes beyond domain-specific transforms: it generates virtual training examples via convex linear combinations of pairs of training examples and their one-hot labels: $\\tilde{x} = \\lambda x_i + (1 - \\lambda) x_j$ and $\\tilde{y} = \\lambda y_i + (1 - \\lambda) y_j$, where $\\lambda \\sim \\mathrm{Beta}(\\alpha, \\alpha)$.",
    "Mixup regularises the neural network to favour simple linear transitions between class regions in feature space, dampening oscillation and preventing extreme overconfident probabilities on out-of-distribution inputs. CutMix blends patches from one image into another, forcing the network to attend to multiple distributed visual features."
  ],
  "steps": [
    "Define baseline invariant transforms: Configure basic label-preserving operations (random horizontal flips, random crops with padding).",
    "Apply automated policy (RandAugment): Randomly select $K$ augmentations per image with uniform magnitude parameter $M$.",
    "Sample Mixup interpolation coefficient: Draw mixing weight $\\lambda$ from a symmetrical Beta distribution $\\mathrm{Beta}(\\alpha, \\alpha)$ (typically $\\alpha \\in [0.1, 0.4]$).",
    "Construct virtual training pairs: Shuffle minibatch to pair observation $(x_i, y_i)$ with random partner $(x_j, y_j)$.",
    "Compute blended tensors and targets: Create interpolated input $\\tilde{x} = \\lambda x_i + (1 - \\lambda) x_j$ and evaluate loss as $\\mathcal{L} = \\lambda \\ell(f(\\tilde{x}), y_i) + (1 - \\lambda) \\ell(f(\\tilde{x}), y_j)$.",
    "Disable Mixup during evaluation: Evaluate strictly on raw, unaugmented validation and test samples to measure genuine generalisation."
  ],
  "math": [
    {
      "h": "Mixup Linear Manifold Interpolation",
      "tex": "\\tilde{x} = \\lambda x_i + (1 - \\lambda) x_j, \\quad \\tilde{y} = \\lambda y_i + (1 - \\lambda) y_j, \\quad \\lambda \\sim \\mathrm{Beta}(\\alpha, \\alpha)",
      "p": "Constructs synthetic training instances along linear lines connecting random training sample pairs in data space."
    },
    {
      "h": "Mixup Convex Combination Loss",
      "tex": "\\mathcal{L}_{\\mathrm{mixup}}(\\tilde{x}, y_i, y_j; \\theta) = \\lambda \\mathcal{L}\\left( f_\\theta(\\tilde{x}), y_i \\right) + (1 - \\lambda) \\mathcal{L}\\left( f_\\theta(\\tilde{x}), y_j \\right)",
      "p": "Evaluates loss as the convex combination of individual cross-entropy losses with respect to both parent targets."
    },
    {
      "h": "CutMix Spatial Patch Insertion",
      "tex": "\\tilde{x} = \\mathbf{M} \\odot x_i + (\\mathbf{1} - \\mathbf{M}) \\odot x_j, \\quad \\lambda = 1 - \\frac{W_{\\mathrm{box}} H_{\\mathrm{box}}}{W H}",
      "p": "Replaces a rectangular bounding box region $\\mathbf{M}$ in image $x_i$ with a patch from image $x_j$, weighting target labels by patch area ratio."
    }
  ],
  "code": "import torch\nimport numpy as np\n\ndef mixup_data(x: torch.Tensor, y: torch.Tensor, alpha: float = 0.2):\n    \"\"\"Generate mixup inputs and blended target pairs.\"\"\"\n    if alpha > 0:\n        lam = np.random.beta(alpha, alpha)\n    else:\n        lam = 1.0\n\n    batch_size = x.size(0)\n    index = torch.randperm(batch_size)\n\n    mixed_x = lam * x + (1.0 - lam) * x[index]\n    y_a, y_b = y, y[index]\n    return mixed_x, y_a, y_b, lam\n\ndef mixup_criterion(criterion, pred, y_a, y_b, lam):\n    \"\"\"Compute weighted loss for mixup prediction.\"\"\"\n    return lam * criterion(pred, y_a) + (1.0 - lam) * criterion(pred, y_b)\n\n# Simulate batch of 4 images (batch_size=4, channels=1, height=4, width=4)\ntorch.manual_seed(42)\ninputs = torch.randn(4, 1, 4, 4)\ntargets = torch.tensor([0, 1, 2, 1])\n\n# Apply Mixup\nmixed_inputs, target_a, target_b, lam = mixup_data(inputs, targets, alpha=0.4)\n\nprint(f\"Sampled Mixup lambda: {lam:.3f}\")\nprint(f\"Interpolated Target:  {lam:.2f} * Class {target_a[0]} + {1 - lam:.2f} * Class {target_b[0]}\")\n# Network learns that an interpolated input deserves proportionally interpolated probabilities",
  "keyPoints": [
    "Data augmentation regularises deep networks by synthetically expanding the empirical training manifold.",
    "Mixup interpolates pairs of inputs and labels, enforcing smooth linear transitions between classes.",
    "Prevents neural networks from outputting overconfident predictions on out-of-distribution examples.",
    "CutMix pastes patches between images, forcing the network to attend to multiple localized features."
  ],
  "pitfalls": [
    "Applying invalid domain transforms: Applying vertical flips to digit recognition (turning a '6' into a '9') corrupts class labels.",
    "Augmenting test/validation sets: Data augmentation must be applied exclusively to training batches; evaluating on augmented test sets distorts benchmark metrics.",
    "Setting Mixup alpha too high: If $\\alpha > 1.0$, the Beta distribution places most mass at $0.5$, producing excessively blended inputs that destroy semantic discriminability."
  ],
  "quiz": [
    {
      "q": "What is the mathematical mechanism of Mixup data augmentation?",
      "o": [
        "It deletes random pixels from an image",
        "It constructs virtual training samples and labels by taking convex linear combinations of pairs of randomly selected training instances",
        "It shifts the image by 5 pixels to the left",
        "It trains a separate generative adversarial network (GAN) to generate new images"
      ],
      "a": 1,
      "why": "Mixup computes $\\tilde{x} = \\lambda x_i + (1 - \\lambda) x_j$ and $\\tilde{y} = \\lambda y_i + (1 - \\lambda) y_j$, teaching the network to predict linear interpolations between samples."
    },
    {
      "q": "Why should you NOT apply random vertical flips when training an OCR model on handwritten English digits?",
      "o": [
        "Because vertical flips require double the memory",
        "Because flipping a \"6\" vertically turns it into a \"9\", corrupting the ground truth label",
        "Because PyTorch does not support vertical flips on images",
        "Because vertical flips cause floating point overflow"
      ],
      "a": 1,
      "why": "Data augmentation must be label-preserving. For digits, vertical flips invert meanings (6 becomes 9), poisoning training data."
    },
    {
      "q": "How does Mixup improve model calibration on out-of-distribution (OOD) data?",
      "o": [
        "It forces weights to become exactly zero",
        "It regularises the model to output smooth linear transitions between classes rather than memorising sharp, overconfident step functions",
        "It eliminates the need for gradient descent",
        "It guarantees 100% test accuracy"
      ],
      "a": 1,
      "why": "Standard training encourages networks to output extreme 0.999 probabilities outside the training manifold. Mixup enforces linear transition slopes, producing well-calibrated softer probabilities."
    }
  ],
  "related": [
    "the-pytorch-training-loop",
    "transfer-learning-and-fine-tuning",
    "reading-loss-curves-and-debugging-training"
  ],
  "keywords": "data augmentation, mixup, cutmix, randaugment, regularisation, manifold interpolation, overconfidence, label smoothing"
},
  {
  "id": "distributed-training-ddp-and-fsdp",
  "short": "DDP & FSDP distributed training",
  "title": "Distributed Deep Learning: Distributed Data Parallel (DDP) and Fully Sharded Data Parallel (FSDP)",
  "task": "concepts",
  "level": 3,
  "minutes": 18,
  "noLab": true,
  "usedBy": [],
  "summary": "Scaling model training across multiple GPUs and nodes using Ring-AllReduce DDP and parameter/gradient/optimiser sharding with FSDP (ZeRO).",
  "lead": "Modern deep learning models have expanded beyond the compute and memory limits of any single GPU. A 70-billion parameter LLM requires over 140 GB of RAM just to store 16-bit weights—before accounting for gradients and optimiser states, which require another 560 GB. Scaling training across dozens or thousands of GPUs requires distributed parallelism: Distributed Data Parallel (DDP) scales throughput for models that fit in one GPU, while Fully Sharded Data Parallel (FSDP) shards models across GPU memories.",
  "analogy": "Imagine transcribing an ancient 1,000-page manuscript. In DDP, each scribe receives an identical copy of the full dictionary (model weights) and transcribes a separate chapter (minibatch); at the end of each hour, all scribes shout out their edits and average their notes. In FSDP, the dictionary itself is so enormous that no scribe has room on their desk for it; each scribe holds 1/8th of the dictionary pages in their drawer, swapping pages on demand right when a word needs translating and immediately discarding it afterwards.",
  "intuition": [
    "Single-GPU training is constrained by three memory consumers: Model Parameters, Gradients, and Optimiser States (in AdamW, 2 states per parameter: momentum $m$ and variance $v$, requiring $12$ bytes per parameter in mixed precision). Activations add further memory scaling with batch size.",
    "Distributed Data Parallel (DDP) replicates the entire model on each GPU. Each GPU processes an independent minibatch slice, computes local gradients, and synchronises gradients across all GPUs using an efficient Ring-AllReduce collective communication algorithm before taking an identical optimiser step.",
    "DDP fails when the model itself exceeds a single GPU's VRAM. ZeRO (Zero Redundancy Optimiser) and PyTorch FSDP (Fully Sharded Data Parallel) eliminate memory redundancy by sharding states across ranks: ZeRO-1 shards optimiser states (4x memory reduction), ZeRO-2 shards optimiser states and gradients (8x reduction), and ZeRO-3 / FSDP shards optimiser states, gradients, and model parameters.",
    "In FSDP, during the forward pass, each layer's parameters are gathered via `AllGather` across ranks just in time for computation, and immediately discarded after the layer computes. Backward passes repeat this just-in-time gather and execute `ReduceScatter` to compute and shard gradients."
  ],
  "steps": [
    "Evaluate model memory footprint: Compute total memory $M_{\\mathrm{total}} = 16 \\times N_{\\mathrm{params}} + M_{\\mathrm{activations}}$. If $M_{\\mathrm{model}} \\le V_{\\mathrm{GPU}}$, select DDP; otherwise select FSDP.",
    "Initialise process group: Call `torch.distributed.init_process_group(backend=\"nccl\")` using NVIDIA Collective Communications Library (NCCL).",
    "Wrap model: Wrap PyTorch module with `torch.nn.parallel.DistributedDataParallel(model)` or `FullyShardedDataParallel(model, auto_wrap_policy=...)`.",
    "Distribute data partitions: Attach a `DistributedSampler(dataset)` to the DataLoader to ensure each GPU receives a disjoint, non-overlapping batch slice.",
    "Set epoch seed in sampler: Call `sampler.set_epoch(epoch)` at the start of each epoch to shuffle batches uniquely across GPUs.",
    "Execute synchronized training step: Compute forward pass, backward pass (which triggers overlapping communication and computation), and optimiser step."
  ],
  "math": [
    {
      "h": "Total Training Memory Overhead (AdamW FP16/FP32)",
      "tex": "M_{\\mathrm{static}} = \\underbrace{2 N}_{\\text{FP16 Weights}} + \\underbrace{2 N}_{\\text{FP16 Grads}} + \\underbrace{4 N}_{\\text{FP32 Master Weights}} + \\underbrace{8 N}_{\\text{Adam } m, v} = 16 N \\text{ bytes}",
      "p": "Static memory overhead scales at 16 bytes per parameter, requiring 160GB for a 10-billion parameter model before activations."
    },
    {
      "h": "Ring-AllReduce Communication Volume",
      "tex": "\\operatorname{Comm}_{\\mathrm{AllReduce}} = 2 \\cdot \\left( \\frac{K - 1}{K} \\right) \\cdot N_{\\mathrm{bytes}}",
      "p": "The communication volume per GPU in Ring-AllReduce is completely independent of the total GPU count $K$, scaling only with model byte size."
    },
    {
      "h": "FSDP (ZeRO-3) Memory per GPU Rank",
      "tex": "M_{\\mathrm{FSDP}}(K) = \\frac{16 N}{K} + M_{\\mathrm{layer\\_buffer}} + M_{\\mathrm{activations}}",
      "p": "Shards all parameters, gradients, and optimiser states across $K$ GPUs, scaling static memory linearly down with cluster size."
    }
  ],
  "code": "import torch\nimport torch.nn as nn\nimport os\n\n# Conceptual structure of PyTorch Distributed Data Parallel (DDP)\ndef ddp_training_step():\n    # In practice: run with 'torchrun --nproc_per_node=4 script.py'\n    # Environment variables set automatically by torchrun\n    local_rank = int(os.environ.get(\"LOCAL_RANK\", 0))\n    world_size = int(os.environ.get(\"WORLD_SIZE\", 1))\n    \n    print(f\"Initialising rank {local_rank} of {world_size}\")\n    \n    # Model definition\n    model = nn.Sequential(\n        nn.Linear(512, 1024),\n        nn.ReLU(),\n        nn.Linear(1024, 10)\n    )\n    \n    # In multi-GPU environment:\n    # torch.distributed.init_process_group(\"nccl\")\n    # model = nn.parallel.DistributedDataParallel(model.cuda(local_rank), device_ids=[local_rank])\n    # sampler = torch.utils.data.distributed.DistributedSampler(dataset)\n    \n    print(\"DDP model wrapped: Gradients will synchronize via Ring-AllReduce on .backward()\")\n\nddp_training_step()",
  "keyPoints": [
    "DDP replicates the model on each GPU, synchronising gradients using Ring-AllReduce communication.",
    "DDP communication volume is independent of the number of GPUs, scaling near-linearly with cluster size.",
    "FSDP (ZeRO-3) shards parameters, gradients, and optimiser states, dividing static memory consumption by $K$ GPUs.",
    "FSDP enables training models with tens of billions of parameters that cannot fit into single GPU VRAM."
  ],
  "pitfalls": [
    "Forgetting `sampler.set_epoch(epoch)`: If omitted, the DistributedSampler generates the exact same batch sequence on every epoch, degrading training stochasticity.",
    "Using PyTorch DataParallel (`nn.DataParallel`): Single-process multi-threaded `DataParallel` suffers from Python GIL bottlenecks and master-GPU memory imbalance; always use DDP.",
    "Communication overhead on slow interconnects: Running FSDP across nodes connected by standard 1Gbps Ethernet causes GPUs to spend 90% of their time waiting for network AllGather; high-speed InfiniBand (RoCE) is essential."
  ],
  "quiz": [
    {
      "q": "Why is `DistributedDataParallel` (DDP) far superior to `DataParallel` (DP) in PyTorch?",
      "o": [
        "DDP only works on MacBooks",
        "DDP spawns a separate Python process per GPU, avoiding Python GIL contention and distributing communication evenly without single-GPU bottlenecks",
        "DP cannot train neural networks with more than 1 layer",
        "DDP does not require backpropagation"
      ],
      "a": 1,
      "why": "`DataParallel` runs in a single process subject to Python GIL locks and concentrates all gradient aggregation on GPU 0. DDP spawns separate processes with decentralized Ring-AllReduce."
    },
    {
      "q": "When must an engineer switch from standard DDP to FSDP (Fully Sharded Data Parallel)?",
      "o": [
        "When training on images instead of text",
        "When the model parameters, gradients, and optimiser states exceed the VRAM of a single physical GPU",
        "When the learning rate is less than 0.001",
        "When training on CPUs only"
      ],
      "a": 1,
      "why": "DDP requires the full model to fit on every single GPU. When a model is too large for one GPU, FSDP shards parameters and states across multiple GPUs."
    },
    {
      "q": "What collective communication operation does DDP use to synchronize gradients across GPUs?",
      "o": [
        "Point-to-point HTTP POST requests",
        "Ring-AllReduce, where gradients are averaged in parallel with communication volume independent of GPU count",
        "Single master database write",
        "Broadcasting weights from rank 0 only"
      ],
      "a": 1,
      "why": "Ring-AllReduce divides tensor buffers into chunks passed around a logical ring of nodes, achieving optimal network bandwidth utilization."
    }
  ],
  "related": [
    "the-pytorch-training-loop",
    "mixed-precision-and-training-stability",
    "vanishing-and-exploding-gradients-clipping"
  ],
  "keywords": "distributed training, ddp, fsdp, zero, ring-allreduce, deep learning, torchrun, nccl, sharding, distributed data parallel"
},
  {
    id: 'residual-networks-and-skip-connections',
    short: 'ResNets and skip connections',
    title: 'Residual Networks and Skip Connections',
    task: 'concepts',
    module: 'Architectures',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Standard deep networks degrade as layers multiply. By reformulating layers to learn residual differences $\mathcal{F}(x) = \mathcal{H}(x) - x$, skip connections establish unbroken gradient superhighways across hundreds of layers.`,
    lead: r`Before 2015, stacking more than 20 or 30 layers in a deep network caused training accuracy to degrade sharply—not due to overfitting, but because optimisation collapsed completely. Residual Networks (ResNets, He et al. 2015) solved this fundamental architectural hurdle by introducing identity shortcut connections, transforming loss surfaces and enabling stable optimisation across hundreds or thousands of layers.`,
    intuition: [
      r`In a conventional plain network, each stacked layer attempts to approximate an underlying target mapping $\mathcal{H}(x)$. Imagine constructing a 50-layer network when a 20-layer network already suffices for the problem. To match the shallower model's performance, the remaining 30 layers must learn the identity function $\mathcal{H}(x) = x$. However, fitting an exact identity mapping through non-linear weight transformations ($W_2 \sigma(W_1 x)$) is surprisingly difficult for stochastic gradient descent, causing deep plain networks to achieve higher training error than their shallow counterparts.`,
      r`ResNet reframes the objective: instead of tasking parameterised layers with fitting $\mathcal{H}(x)$ directly, the layers fit the **residual** difference $\mathcal{F}(x) = \mathcal{H}(x) - x$. The original input is then reintroduced via an identity skip connection: $\mathcal{H}(x) = \mathcal{F}(x) + x$. Under this reformulation, if an identity mapping is optimal, the optimiser can simply drive the residual weights towards zero ($\mathcal{F}(x) \to 0$), which standard weight decay achieves naturally.`,
      r`The profound mathematical consequence occurs during backpropagation. The derivative of a residual block with respect to its input is $\frac{\partial \mathcal{H}}{\partial x} = \frac{\partial \mathcal{F}}{\partial x} + I$. Because of the additive identity matrix $I$, the backpropagated gradient contains an unattenuated term that flows backward through the skip connection completely independent of weight magnitudes. Even if the parameterised gradient $\frac{\partial \mathcal{F}}{\partial x}$ vanishes, the identity pathway ensures gradient signals reach early layers with full fidelity.`,
    ],
    analogy: r`Like an expressway with local detour loops: instead of forcing all traffic through 50 congested city intersections (plain layers), the highway lets traffic cruise unimpeded from start to finish (skip connection), exiting into local workshops (residuals) only when specialized modifications are needed.`,
    steps: [
      r`Construct the residual transformation: build two or three convolutional or linear layers with [[normalisation-batch-layer-rms|normalisation]] and non-linear activations ($\mathcal{F}(x)$).`,
      r`Add the identity shortcut: route the unmodified input $x$ parallel to the transformations and add it element-wise ($y = \mathcal{F}(x) + x$).`,
      r`Handle dimension changes: when downsampling spatial dimensions or doubling channels, apply a $1 \times 1$ projection convolution on the shortcut path ($y = \mathcal{F}(x) + W_s x$) to align tensor shapes.`,
      r`Position post-addition activations: apply the non-linear activation (e.g. ReLU or GELU) immediately following the element-wise addition ($\sigma(\mathcal{F}(x) + x)$).`,
      r`Stack modular stages: assemble residual blocks into hierarchical stages (e.g. 64 → 128 → 256 → 512 channels) to construct deep backbones for vision, speech, or Transformer architectures.`,
    ],
    math: [
      {
        h: 'Residual block formulation',
        tex: r`$$\mathcal{H}(x) = \mathcal{F}(x; \{W_i\}) + x$$`,
        p: r`$x$ is the input tensor, $\mathcal{F}$ represents the residual mapping to be learned across parameterised layers $\{W_i\}$, and $\mathcal{H}(x)$ is the output tensor. If the optimal transformation is the identity function, parameter weights shrink to zero ($\mathcal{F} = 0$), leaving $\mathcal{H}(x) = x$ without distortion.`,
      },
      {
        h: 'Unattenuated gradient highway across depth',
        tex: r`$$\frac{\partial \mathcal{L}}{\partial x_l} = \frac{\partial \mathcal{L}}{\partial x_L}\frac{\partial x_L}{\partial x_l} = \frac{\partial \mathcal{L}}{\partial x_L} \left( I + \frac{\partial}{\partial x_l}\sum_{k=l}^{L-1} \mathcal{F}_k(x_k) \right)$$`,
        p: r`$x_l$ is the activation at block $l$, and $x_L = x_l + \sum_{k=l}^{L-1} \mathcal{F}_k(x_k)$ is the activation at block $L$. The gradient contains an additive identity component $I$, guaranteeing that the gradient cannot vanish across depth even if the Jacobians of intermediate residual transformations $\frac{\partial \mathcal{F}_k}{\partial x_l}$ approach zero.`,
      },
    ],
    keyPoints: [
      r`Residual connections reparameterise layers to learn the differential mapping $\mathcal{F}(x) = \mathcal{H}(x) - x$, making identity functions trivial to approximate.`,
      r`The additive identity term in backpropagation ($\frac{\partial \mathcal{F}}{\partial x} + I$) creates a gradient superhighway, solving the degradation problem in deep networks.`,
      r`Skip connections are standard architecture components across modern deep learning, including ResNets, ConvNeXts, Transformers, and diffusion models.`,
    ],
    pitfalls: [
      r`Confusing the degradation problem with overfitting: deeper plain networks suffered from higher *training* error, proving it was an optimisation failure, not excessive variance.`,
      r`Adding heavy non-linear operations onto the skip path itself, which obstructs the clean linear flow of gradients.`,
      r`Failing to project shortcut dimensions when spatial resolution or channel depth changes, causing dimension mismatch errors during tensor addition.`,
    ],
    code: r`import numpy as np

# Simulate gradient propagation across a 10-layer depth
depth = 10
w_scale = 0.5  # Sub-unitary Jacobian weight per layer

# 1. Plain feedforward network: gradients multiply sequentially
grad_plain = 1.0
for _ in range(depth):
    grad_plain *= w_scale  # grad * W

# 2. Residual network: gradients add identity term (W + I)
grad_res = 1.0
for _ in range(depth):
    grad_res *= (w_scale + 1.0)  # grad * (W + I)

print(f"Depth = {depth} layers (layer weight scale = {w_scale}):")
print(f"Plain network backpropagated gradient:    {grad_plain:.6f} (vanished to zero)")
print(f"Residual network backpropagated gradient: {grad_res:.2f} (unbroken gradient flow)")`,
    quiz: [
      {
        q: r`What was the degradation problem that motivated the invention of ResNets in 2015?`,
        o: [
          r`Deeper plain networks began to overfit because they had too many parameters`,
          r`Deeper plain networks exhibited higher training error than their shallower counterparts, caused by optimisation failure rather than overfitting`,
          r`Convolutions ran out of GPU memory when image sizes exceeded 256 pixels`,
          r`Batch Normalisation failed to compute running means on deep networks`,
        ],
        a: 1,
        why: r`He et al. showed that a 56-layer plain network suffered higher training error than a 20-layer plain network on CIFAR-10. Because the 56-layer network could theoretically mimic the 20-layer network via identity layers, higher training error demonstrated an optimisation breakdown.`,
      },
      {
        q: r`Why does backpropagation through a residual block prevent vanishing gradients?`,
        o: [
          r`The derivative of $\mathcal{F}(x) + x$ contains an additive identity matrix $+ I$, providing an unhindered linear path for gradients to flow backward`,
          r`Residual blocks eliminate all activation functions`,
          r`Residual blocks double the learning rate at every backward step`,
          r`The skip connection sets negative gradients to zero`,
        ],
        a: 0,
        why: r`Because $\frac{\partial (\mathcal{F}(x) + x)}{\partial x} = \frac{\partial \mathcal{F}}{\partial x} + I$, the gradient always contains $+ I$, guaranteeing that gradient information reaches early layers even if $\frac{\partial \mathcal{F}}{\partial x}$ is small.`,
      },
      {
        q: r`When downsampling feature maps (e.g. stride 2) in a ResNet, what must be done to the skip connection?`,
        o: [
          r`The skip connection must be deleted entirely`,
          r`A $1 \times 1$ convolution with stride 2 must be applied to the shortcut to match spatial and channel dimensions`,
          r`The input must be repeated twice`,
          r`The batch size must be halved`,
        ],
        a: 1,
        why: r`Because element-wise addition requires matching spatial height, width, and channel counts, a $1 \times 1$ strided projection convolution is applied to the shortcut path to align dimensions with the residual branch.`,
      },
      {
        q: r`Why is it easier for a residual block to learn an identity mapping than a plain layer?`,
        o: [
          r`Driving residual weights to zero ($\mathcal{F}(x) \to 0$) naturally produces the identity mapping $\mathcal{H}(x) = 0 + x = x$, which weight decay facilitates`,
          r`Residual connections force all weight matrices to be orthogonal`,
          r`Identity mappings are strictly forbidden in plain networks`,
          r`Residual blocks do not use floating-point numbers`,
        ],
        a: 0,
        why: r`In a residual block $\mathcal{H}(x) = \mathcal{F}(x) + x$, setting weights to zero trivially yields $\mathcal{H}(x) = x$. In a plain network, learning an identity function requires finding precise non-zero weights that cancel non-linear activations.`,
      },
    ],
    usedBy: [],
    prereq: ['vanishing-and-exploding-gradients-clipping', 'backpropagation-and-autodiff', 'weight-initialisation-xavier-and-he'],
    related: ['normalisation-batch-layer-rms', 'transfer-learning-and-fine-tuning', 'the-pytorch-training-loop'],
    keywords: 'residual networks resnet skip connections identity shortcuts degradation problem gradient highway he et al residual block deep learning architecture',
  },
  {
    id: 'the-attention-mechanism',
    short: 'The attention mechanism',
    title: 'The Attention Mechanism',
    task: 'concepts',
    module: 'Architectures',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Recurrent networks force variable-length sequences through a fixed-size vector bottleneck. Attention lets every position dynamically look up, weight, and aggregate context from all other positions.`,
    lead: r`The defining constraint of classical sequence models (RNNs and LSTMs) was their sequential information bottleneck: entire sentences had to be compressed into a single hidden vector, causing long-range context to degrade. The attention mechanism—generalised to scaled dot-product self-attention in the Transformer—eliminated this bottleneck by allowing tokens to compute dynamic routing weights over queries, keys, and values.`,
    intuition: [
      r`Imagine searching a library for information about planetary motion. Your search query is the **Query** ($Q$). Every book title on the catalogue shelves is a **Key** ($K$), and the text inside each book is the **Value** ($V$). To find answers, you calculate the semantic similarity between your query and every book title (the dot product $Q K^T$). Titles with high relevance receive large attention weights via a softmax distribution, and your final answer is a weighted blend of the retrieved book contents ($A V$).`,
      r`In **Self-Attention**, queries, keys, and values all originate from the very same sequence. Each token asks: "Which other tokens in this sentence are relevant to resolving my meaning?" In the sentence "The trophy did not fit into the suitcase because it was too large", the pronoun token "it" computes a strong query-key match with "trophy" (its semantic referent) rather than "suitcase", dynamically pulling contextual features across the sequence regardless of physical separation.`,
      r`Why is the dot product scaled by $1 / \sqrt{d_k}$? When the key dimension $d_k$ is large (such as 64 or 128), taking the dot product of two independent zero-mean unit-variance vectors produces a result whose variance equals $d_k$. Large dot products push the softmax function into saturated tails where local derivatives collapse to zero. Dividing by $\sqrt{d_k}$ scales the variance back to $1.0$, preserving healthy gradient flow during backpropagation. In **Multi-Head Attention**, this operation runs in parallel across $h$ distinct subspaces, allowing the model to simultaneously attend to syntactic relations, coreference, and local phrases.`,
    ],
    analogy: r`Like a researcher consulting a comprehensive library index: instead of memorising every book before writing an essay, the researcher pulls relevant passages on demand using targeted title lookups.`,
    steps: [
      r`Project input embeddings: map input tensor $X \in \mathbb{R}^{T \times d_{\text{model}}}$ into queries $Q = X W_Q$, keys $K = X W_K$, and values $V = X W_V$ using learned linear projections.`,
      r`Compute pairwise compatibility: calculate the matrix product $S = Q K^T \in \mathbb{R}^{T \times T}$, measuring the unscaled affinity between every query and every key.`,
      r`Scale by key dimensionality: divide scores by $\sqrt{d_k}$ to prevent variance explosion and preserve softmax gradients in high dimensions.`,
      r`Apply causal masking if autoregressive: in decoder language models, mask upper-triangular future entries to $-\infty$ so tokens cannot look ahead to future steps during training.`,
      r`Compute softmax probabilities and context: apply row-wise softmax to produce attention weights $A = \operatorname{softmax}(S / \sqrt{d_k})$, then compute the context matrix $O = A V$.`,
      r`Merge multi-head projections: concatenate outputs from all $h$ parallel attention heads and project through linear output matrix $W_O$.`,
    ],
    math: [
      {
        h: 'Scaled dot-product attention equation',
        tex: r`$$\operatorname{Attention}(Q, K, V) = \operatorname{softmax}\left(\frac{Q K^T}{\sqrt{d_k}}\right) V$$`,
        p: r`$Q \in \mathbb{R}^{T_q \times d_k}$ contains query vectors, $K \in \mathbb{R}^{T_k \times d_k}$ contains key vectors, and $V \in \mathbb{R}^{T_k \times d_v}$ contains values. The softmax normalises across rows of the $T_q \times T_k$ affinity matrix, producing probability distributions that weight the value vectors.`,
      },
      {
        h: 'Dot-product variance scaling derivation',
        tex: r`$$\text{If } q_i, k_i \sim \mathcal{N}(0, 1) \text{ i.i.d.}, \quad \operatorname{Var}(q^T k) = \sum_{i=1}^{d_k} \operatorname{Var}(q_i k_i) = d_k \implies \operatorname{Var}\left(\frac{q^T k}{\sqrt{d_k}}\right) = 1$$`,
        p: r`Shows why scaling by $\sqrt{d_k}$ is mathematically necessary. Without division by $\sqrt{d_k}$, large key dimensions inflate dot-product variance to $d_k$, pushing softmax inputs into extreme saturating regimes where gradient magnitudes vanish to zero.`,
      },
      {
        h: 'Multi-head attention formulation',
        tex: r`$$\operatorname{MultiHead}(Q, K, V) = \operatorname{Concat}(\text{head}_1, \dots, \text{head}_h) W_O, \quad \text{head}_i = \operatorname{Attention}(Q W_i^Q, K W_i^K, V W_i^V)$$`,
        p: r`$W_i^Q, W_i^K \in \mathbb{R}^{d_{\text{model}} \times d_k}$, $W_i^V \in \mathbb{R}^{d_{\text{model}} \times d_v}$, and $W_O \in \mathbb{R}^{h d_v \times d_{\text{model}}}$. Projecting into $h$ subspaces enables the model to simultaneously attend to information from different representation subspaces at different positions.`,
      },
    ],
    keyPoints: [
      r`Attention replaces the sequential recurrence bottleneck of RNNs with an $O(1)$ maximum path length between any two tokens in a sequence.`,
      r`Dividing dot-product scores by $\sqrt{d_k}$ keeps score variance at unit scale, preventing softmax saturation and vanishing gradients.`,
      r`Multi-head attention allows the model to jointly attend to information from diverse representation subspaces (such as grammar, coreference, and syntax) simultaneously.`,
    ],
    pitfalls: [
      r`Quadratic memory complexity: computing and storing the $T \times T$ attention matrix scales as $O(T^2)$, creating memory bottlenecks for ultra-long context windows.`,
      r`Omitting the causal mask in generative autoregressive decoders, which leaks future ground-truth tokens during training and ruins next-token generation.`,
      r`Omitting the $\sqrt{d_k}$ scaling denominator, which causes softmax attention distributions to peak prematurely on a single token early in training.`,
    ],
    code: r`import numpy as np

# Scaled dot-product self-attention with causal masking
np.random.seed(42)
T, d_k = 3, 4  # 3 tokens, key dimension 4
Q = np.random.randn(T, d_k)
K = np.random.randn(T, d_k)
V = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])  # (3, 2) values

# 1. Scaled dot-product compatibility scores
scale = np.sqrt(d_k)
scores = (Q @ K.T) / scale

# 2. Apply causal mask: mask upper triangular future steps to -1e9
mask = np.triu(np.ones((T, T)), k=1)
scores = np.where(mask == 1, -1e9, scores)

# 3. Row-wise softmax to calculate attention weights
exp_scores = np.exp(scores - np.max(scores, axis=-1, keepdims=True))
weights = exp_scores / np.sum(exp_scores, axis=-1, keepdims=True)

# 4. Weighted combination of value vectors
context_out = weights @ V

print("Attention weights (row 0: token 0 can only attend to itself):")
print(np.round(weights[0], 4).tolist())
print("Attention weights (row 2: token 2 attends across tokens 0, 1, 2):")
print(np.round(weights[2], 4).tolist())
print("Output context representation for token 0:")
print(np.round(context_out[0], 4).tolist())`,
    quiz: [
      {
        q: r`Why is the dot product between queries and keys divided by $\sqrt{d_k}$ before applying softmax?`,
        o: [
          r`To normalise key vectors so their Euclidean length equals 1`,
          r`To prevent dot products from growing excessively large with dimension $d_k$, which pushes softmax into saturated regions with vanishing gradients`,
          r`To convert negative scores into positive probability values`,
          r`To invert the attention matrix for faster linear algebra execution`,
        ],
        a: 1,
        why: r`Because the variance of the dot product of two $d_k$-dimensional random vectors is $d_k$, dividing by $\sqrt{d_k}$ scales variance back to 1.0, preventing softmax from saturating where gradients collapse to zero.`,
      },
      {
        q: r`In an autoregressive decoder (such as GPT), what is the function of the causal attention mask?`,
        o: [
          r`It sets future token attention weights to zero (by setting pre-softmax logits to $-\infty$) so predictions depend only on past and current tokens`,
          r`It reduces computation from $O(T^2)$ to $O(T)$`,
          r`It forces all query and key matrices to be identical`,
          r`It randomly drops 10% of attention heads during training`,
        ],
        a: 0,
        why: r`Without causal masking, a generative model could simply look ahead at future tokens during training, trivialising next-token prediction and failing during inference.`,
      },
      {
        q: r`How does multi-head attention enhance the representational capacity of a single attention layer?`,
        o: [
          r`It doubles the sequence length $T$ that the model can process`,
          r`It projects queries, keys, and values into multiple lower-dimensional subspaces, allowing the model to attend to different relationship types simultaneously`,
          r`It removes the need for residual skip connections and layer normalisation`,
          r`It replaces floating-point multiplications with integer additions`,
        ],
        a: 1,
        why: r`Multi-head attention projects inputs into $h$ distinct subspaces, enabling parallel heads to track distinct syntactic, positional, or semantic relationships independently.`,
      },
      {
        q: r`What is the primary computational bottleneck of standard full self-attention when scaling to very long sequences?`,
        o: [
          r`The number of parameters grows cubically with sequence length`,
          r`Both memory consumption and compute scale quadratically ($O(T^2)$) with sequence length due to the $T \times T$ attention matrix`,
          r`Backpropagation cannot calculate gradients through softmax operations`,
          r`Cross-entropy loss diverges when sequence lengths exceed 512 tokens`,
        ],
        a: 1,
        why: r`Pairwise interactions between all $T$ queries and $T$ keys require materialising an intermediate $T \times T$ attention weight matrix, making $O(T^2)$ memory and time expensive for long context windows.`,
      },
    ],
    usedBy: [],
    prereq: ['residual-networks-and-skip-connections', 'the-pytorch-training-loop', 'weight-initialisation-xavier-and-he'],
    related: ['normalisation-batch-layer-rms', 'transfer-learning-and-fine-tuning', 'autoencoders'],
    keywords: 'attention mechanism scaled dot product self-attention queries keys values multi-head attention causal mask transformer vaswani context vector',
  },
  {
    id: 'autoencoders',
    short: 'Autoencoders',
    title: 'Autoencoders',
    task: 'concepts',
    module: 'Architectures',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Compressing data into a low-dimensional bottleneck and reconstructing it back forces the network to discover the compact generative manifold of the dataset.`,
    lead: r`How can a neural network learn informative representations without human labels? Autoencoders accomplish unsupervised representation learning by posing an input reconstruction objective: an encoder compresses the input into a low-dimensional latent code, and a decoder attempts to reconstruct the original input from that bottleneck representation.`,
    intuition: [
      r`Suppose you want to describe thousands of different face photographs over a radio channel, but bandwidth restricts you to transmitting only 10 numbers per image. You cannot describe individual pixels. To succeed, those 10 numbers must capture the dominant axes of variance across human faces: head shape, eye spacing, skin tone, hair length, and smile width. The sketch artist on the receiving end uses those 10 parameters to recreate the portrait.`,
      r`An **Autoencoder** builds this compression pipeline with two mirrored networks:
1. **Encoder** ($z = f_\theta(x)$): Compresses the high-dimensional input $x \in \mathbb{R}^D$ into a lower-dimensional latent bottleneck $z \in \mathbb{R}^d$ ($d \ll D$).
2. **Decoder** ($\hat{x} = g_\phi(z)$): Expands the latent code $z$ back to reconstruct the original input $\hat{x} \approx x$.
The network trains by minimising a reconstruction loss (such as Mean Squared Error or Binary Cross-Entropy). If the encoder and decoder were strictly linear, the learned bottleneck would span the exact same subspace as [[pca|Principal Component Analysis (PCA)]]. But with non-linear activation functions, autoencoders learn curved, non-linear manifolds that linear projections cannot capture.`,
      r`Beyond simple dimensional bottlenecks, regularised autoencoders prevent trivial memorisation. **Denoising Autoencoders (DAEs)** corrupt the input with noise ($\tilde{x} = x + \epsilon$) and train the decoder to recover the clean original $x$, learning an orthogonal projection field that pushes corrupted points back onto the true data manifold. This makes autoencoders exceptionally useful for anomaly detection: inputs that deviate from the normal training distribution cannot be reconstructed accurately, producing telltale spikes in reconstruction error.`,
    ],
    analogy: r`Like summarising a 500-page historical treatise into a 5-page brief (encoder) and having a historian reconstruct the full event timeline using only those 5 pages (decoder).`,
    steps: [
      r`Choose the bottleneck dimension: select latent dimensionality $d$ reflecting the anticipated intrinsic dimensionality of the data manifold.`,
      r`Construct the encoder network: stack feedforward or convolutional layers tapering down in width from input dimensionality $D$ to latent code $z$.`,
      r`Construct the decoder network: mirror the encoder architecture, progressively expanding from latent code $z$ back to input dimensionality $D$.`,
      r`Define the reconstruction criterion: select Mean Squared Error for continuous real-valued features or Binary Cross-Entropy for normalised pixel intensities.`,
      r`Train and deploy: train end-to-end with [[the-pytorch-training-loop|the PyTorch training loop]]; detach the decoder and use the encoder as a feature extractor or anomaly detector.`,
    ],
    math: [
      {
        h: 'Autoencoder reconstruction objective',
        tex: r`$$\min_{\theta, \phi} \frac{1}{N}\sum_{i=1}^N \mathcal{L}\Big(x_i, g_\phi\big(f_\theta(x_i)\big)\Big), \quad z_i = f_\theta(x_i), \; \hat{x}_i = g_\phi(z_i)$$`,
        p: r`$f_\theta: \mathbb{R}^D \to \mathbb{R}^d$ is the encoder parameterised by $\theta$, $g_\phi: \mathbb{R}^d \to \mathbb{R}^D$ is the decoder parameterised by $\phi$, and $\mathcal{L}$ is the reconstruction loss. Minimising $\mathcal{L}$ forces $z$ to retain maximum information about $x$.`,
      },
      {
        h: 'Relationship to Principal Component Analysis (linear autoencoders)',
        tex: r`$$\text{If } f(x) = W_1 x \text{ and } g(z) = W_2 z, \quad \min_{W_1, W_2} \lVert X - W_2 W_1 X \rVert_F^2 \implies \operatorname{Span}(W_2) = \operatorname{Span}(U_d)$$`,
        p: r`For linear transformations under squared error loss, the global minimum of the autoencoder objective spans the exact same $d$-dimensional subspace as the top $d$ eigenvectors ($U_d$) of PCA. Non-linear activations enable autoencoders to learn non-linear manifolds.`,
      },
      {
        h: 'Denoising autoencoder objective',
        tex: r`$$\mathcal{L}_{\text{DAE}}(\theta, \phi) = \mathbb{E}_{x \sim p_{\text{data}}, \tilde{x} \sim q(\tilde{x}|x)}\left[ \lVert x - g_\phi(f_\theta(\tilde{x})) \rVert_2^2 \right]$$`,
        p: r`$q(\tilde{x}|x)$ is a corruption process (such as additive Gaussian noise or random zero-masking). The network learns a vector field that projects corrupted points back onto the true low-dimensional manifold.`,
      },
    ],
    keyPoints: [
      r`An undercomplete bottleneck ($d \ll D$) forces the network to discard noise and retain only the highest-variance generative factors of the data.`,
      r`Linear autoencoders under MSE loss span the same subspace as PCA; non-linear activations generalise this to non-linear manifold learning.`,
      r`Reconstruction error acts as an effective unsupervised anomaly detector: novel or corrupted inputs produce high reconstruction loss because they lie off the learned manifold.`,
    ],
    pitfalls: [
      r`Using an overcomplete bottleneck ($d \ge D$) without regularisation (such as sparsity or denoising), allowing the network to trivially learn the identity mapping without extracting features.`,
      r`Using standard autoencoders as generative models: their latent space contains empty gaps and holes; sampling random vectors $z$ produces nonsensical decoded outputs.`,
      r`Minimising Mean Squared Error on complex multimodal image distributions, which encourages decoders to produce blurry, averaged reconstructions.`,
    ],
    code: r`import numpy as np

# Synthetic non-linear manifold in 2D: x2 = sin(x1)
np.random.seed(42)
x1 = np.linspace(-np.pi, np.pi, 25)
x2 = np.sin(x1)
X = np.stack([x1, x2], axis=1)

# Undercomplete autoencoder: 2 inputs -> 1 latent unit -> 2 outputs
W_enc = np.random.randn(2, 1) * 0.5
b_enc = np.zeros(1)
W_dec = np.random.randn(1, 2) * 0.5
b_dec = np.zeros(2)
lr = 0.05

for epoch in range(100):
    # Forward pass: non-linear encoder, linear decoder
    z = np.tanh(X @ W_enc + b_enc)
    X_hat = z @ W_dec + b_dec
    loss = float(np.mean((X - X_hat)**2))
    # Backward pass
    d_out = 2.0 * (X_hat - X) / len(X)
    dW_dec, db_dec = z.T @ d_out, np.sum(d_out, axis=0)
    dz = (d_out @ W_dec.T) * (1.0 - z**2)
    dW_enc, db_enc = X.T @ dz, np.sum(dz, axis=0)
    # Optimiser step
    W_dec -= lr * dW_dec; b_dec -= lr * db_dec
    W_enc -= lr * dW_enc; b_enc -= lr * db_enc

# Evaluate reconstruction on normal point vs anomaly
normal_pt = np.array([[0.0, 0.0]])
anom_pt = np.array([[0.0, 5.0]])  # Lies completely off the manifold

rec_normal = np.tanh(normal_pt @ W_enc + b_enc) @ W_dec + b_dec
err_normal = float(np.mean((normal_pt - rec_normal)**2))

rec_anom = np.tanh(anom_pt @ W_enc + b_enc) @ W_dec + b_dec
err_anom = float(np.mean((anom_pt - rec_anom)**2))

print(f"Final training reconstruction loss: {loss:.4f}")
print(f"Normal point reconstruction error:  {err_normal:.4f}")
print(f"Anomaly reconstruction error:       {err_anom:.4f} (anomaly flagged)")`,
    quiz: [
      {
        q: r`What subspace does a linear autoencoder trained with Mean Squared Error loss learn?`,
        o: [
          r`The subspace spanned by the top principal components of the data, equivalent to PCA`,
          r`A random orthogonal projection subspace`,
          r`The Fourier transform frequency domain`,
          r`An overcomplete dictionary of wavelets`,
        ],
        a: 0,
        why: r`It is a classical theorem that a linear autoencoder with squared reconstruction error converges to the subspace spanned by the principal components of the training data.`,
      },
      {
        q: r`Why are standard deterministic autoencoders generally ineffective as generative models?`,
        o: [
          r`Because they cannot be trained using gradient descent`,
          r`Because their latent space is unconstrained, leaving empty gaps and discontinuities where arbitrary sampled points decode to nonsensical noise`,
          r`Because their encoder requires labels during training`,
          r`Because their decoder parameters are always frozen`,
        ],
        a: 1,
        why: r`Standard autoencoders only organise points they have seen during training. The spaces between clusters are unregularised voids; picking a random vector $z$ yields incoherent outputs.`,
      },
      {
        q: r`How does a Denoising Autoencoder (DAE) differ from a standard undercomplete autoencoder?`,
        o: [
          r`It corrupts inputs with noise during training and forces the decoder to reconstruct the original clean input`,
          r`It removes all non-linear activation functions from the encoder`,
          r`It uses reinforcement learning rather than backpropagation`,
          r`It forces the latent bottleneck dimension to be zero`,
        ],
        a: 0,
        why: r`By tasking the network with recovering uncorrupted data from noisy inputs, DAEs learn an orthogonal projection operator that pulls off-manifold points back onto the true data manifold.`,
      },
      {
        q: r`How can an autoencoder be applied to unsupervised anomaly detection?`,
        o: [
          r`By training exclusively on anomalous samples`,
          r`By calculating reconstruction error: novel or anomalous inputs produce high reconstruction error because the network has never learned their manifold`,
          r`By measuring the learning rate of the optimiser`,
          r`By counting the number of non-zero parameters in the decoder`,
        ],
        a: 1,
        why: r`Because the autoencoder is trained to reconstruct normal patterns, anomalous observations that deviate from normal data distributions cannot be compressed and reconstructed accurately, resulting in high reconstruction error.`,
      },
    ],
    usedBy: [],
    prereq: ['the-pytorch-training-loop', 'pca', 'backpropagation-and-autodiff'],
    related: ['variational-autoencoders', 'the-attention-mechanism', 'gans'],
    keywords: 'autoencoders encoder decoder reconstruction error bottleneck latent space denoising autoencoder anomaly detection manifold learning unsupervised',
  },
  {
    id: 'variational-autoencoders',
    short: 'Variational autoencoders',
    title: 'Variational Autoencoders (VAEs)',
    task: 'concepts',
    module: 'Architectures',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Standard autoencoders leave unconstrained voids in latent space that cannot generate new data. Variational autoencoders enforce a smooth Gaussian prior via probabilistic mapping and the reparameterisation trick.`,
    lead: r`While standard autoencoders compress data effectively, their latent spaces are riddled with discontinuities: sampling random vectors produces garbled outputs. Variational Autoencoders (VAEs, Kingma & Welling 2013) transform autoencoders into principled directed probabilistic generative models by mapping inputs to probability distributions and optimising the Evidence Lower Bound (ELBO).`,
    intuition: [
      r`In a deterministic autoencoder, image $A$ maps to point $z = (2.0, 3.0)$ and image $B$ maps to $z = (-4.0, 1.0)$. The optimiser has no reason to smooth the space between them. If you pick a point halfway between them at $(-1.0, 2.0)$, the decoder has never trained on that coordinate and outputs unrecognizable static. The latent space is a constellation of isolated islands surrounded by empty voids.`,
      r`A **Variational Autoencoder** replaces fixed points with probability distributions. Instead of outputting a single vector $z$, the encoder outputs two vectors: a mean $\mu(x)$ and a log-variance $\log \sigma^2(x)$. The latent representation is then sampled from the Gaussian distribution $\mathcal{N}(\mu, \operatorname{diag}(\sigma^2))$. Two competing forces govern the objective:
1. **Reconstruction Loss**: Compels the decoder to reconstruct $x$ accurately from sampled codes $z$.
2. **Kullback-Leibler (KL) Divergence**: Penalises the encoder distribution for deviating from a standard normal prior $p(z) = \mathcal{N}(0, I)$.
The KL penalty acts like an elastic spring: it pulls all means $\mu$ towards zero and forces variances $\sigma^2$ towards one. This prevents clusters from scattering across isolated regions, turning the latent space into a smooth, continuous manifold where interpolating between two points morphs seamlessly from one valid sample to another.`,
      r`The central algorithmic hurdle is backpropagation: you cannot pass gradients through a stochastic sampling operation ($z \sim \mathcal{N}(\mu, \sigma^2)$). The **reparameterisation trick** solves this by isolating the randomness into an independent noise variable $\epsilon \sim \mathcal{N}(0, I)$ and computing $z$ deterministically: $z = \mu + \sigma \odot \epsilon$. Gradients now flow freely into $\mu$ and $\sigma$ via standard autodiff, enabling end-to-end training.`,
    ],
    analogy: r`Like mapping cities onto an elastic sphere: without constraints, you can scatter cities into disconnected corners of space; the KL penalty pulls all coordinates into an orderly, continuous spherical terrain where every coordinate represents realistic geography.`,
    steps: [
      r`Construct the probabilistic encoder: build a network that maps input $x$ to two parallel vectors: mean $\mu_\phi(x) \in \mathbb{R}^d$ and log-variance $\log \sigma^2_\phi(x) \in \mathbb{R}^d$.`,
      r`Execute the reparameterisation trick: sample standard Gaussian noise $\epsilon \sim \mathcal{N}(0, I)$ and calculate latent sample $z = \mu + \exp(0.5 \log \sigma^2) \odot \epsilon$.`,
      r`Construct the generative decoder: build a network $g_\theta(z)$ that reconstructs original data parameters from sampled latent vector $z$.`,
      r`Evaluate the Evidence Lower Bound (ELBO): compute total loss as the sum of reconstruction error and the closed-form analytical KL divergence between $\mathcal{N}(\mu, \sigma^2)$ and $\mathcal{N}(0, I)$.`,
      r`Backpropagate and train: update encoder and decoder parameters end-to-end with [[optimisers-sgd-momentum-rmsprop-adam-adamw|AdamW]].`,
      r`Synthesise novel data: discard the encoder, sample fresh noise $z \sim \mathcal{N}(0, I)$, and pass it through the decoder to generate novel, realistic observations.`,
    ],
    math: [
      {
        h: 'Evidence Lower Bound (ELBO) objective',
        tex: r`$$\log p_\theta(x) \ge \operatorname{ELBO}(\theta, \phi; x) = \mathbb{E}_{q_\phi(z|x)}\big[\log p_\theta(x|z)\big] - D_{\text{KL}}\big(q_\phi(z|x) \parallel p(z)\big)$$`,
        p: r`$\log p_\theta(x)$ is the marginal log-likelihood of the data. The first term measures reconstruction quality under the variational posterior $q_\phi(z|x)$; the second term is the KL divergence penalising deviation from the prior $p(z) = \mathcal{N}(0, I)$. Maximising the ELBO guarantees that true data likelihood increases.`,
      },
      {
        h: 'Closed-form KL divergence for diagonal Gaussians',
        tex: r`$$D_{\text{KL}}\big(\mathcal{N}(\mu, \operatorname{diag}(\sigma^2)) \parallel \mathcal{N}(0, I)\big) = -\frac{1}{2}\sum_{j=1}^d \left( 1 + \log(\sigma_j^2) - \mu_j^2 - \sigma_j^2 \right)$$`,
        p: r`$d$ is latent dimensionality, $\mu_j$ is the predicted mean, and $\sigma_j^2$ is the predicted variance of component $j$. This analytical formula computes exact KL divergence in a single vectorised pass without Monte Carlo integration. If $\mu_j = 0$ and $\sigma_j^2 = 1$, the penalty evaluates to $0$.`,
      },
      {
        h: 'The reparameterisation trick',
        tex: r`$$z = \mu(x) + \sigma(x) \odot \epsilon, \quad \epsilon \sim \mathcal{N}(0, I) \implies \frac{\partial z}{\partial \mu} = I, \quad \frac{\partial z}{\partial \sigma} = \operatorname{diag}(\epsilon)$$`,
        p: r`By rewriting the stochastic variable $z$ as a deterministic transformation of parameters and independent noise $\epsilon$, gradients can backpropagate through $\mu$ and $\sigma$ without encountering non-differentiable sampling nodes.`,
      },
    ],
    keyPoints: [
      r`The reparameterisation trick ($z = \mu + \sigma \odot \epsilon$) permits gradient backpropagation through stochastic sampling by moving randomness into an external noise input.`,
      r`The KL divergence term regularises the latent space into an uninterrupted Gaussian manifold, eliminating dead zones and enabling smooth interpolation.`,
      r`Unlike classical autoencoders, VAEs are true generative models: sampling $z \sim \mathcal{N}(0, I)$ and passing it to the decoder synthesises coherent novel samples.`,
    ],
    pitfalls: [
      r`Posterior collapse: when paired with powerful autoregressive decoders, the decoder learns to generate data unconditionally, ignoring $z$ completely while setting $D_{\text{KL}} \to 0$.`,
      r`Sampling directly using non-differentiable random generators inside the forward pass, which severs the computational graph and stops the encoder from updating.`,
      r`Over-weighting the KL penalty early in training without KL annealing, forcing all representations to zero and producing blurry, featureless reconstructions.`,
    ],
    code: r`import numpy as np

# Reparameterisation trick and analytical KL divergence
np.random.seed(42)
N, d = 2, 2  # 2 samples, 2 latent dimensions

# Encoder outputs: mean and log-variance
mu = np.array([[0.0, 0.0], [1.5, -2.0]])
log_var = np.array([[0.0, 0.0], [-0.5, 0.8]])
std = np.exp(0.5 * log_var)

# 1. Reparameterisation trick: z = mu + std * epsilon
eps = np.random.randn(N, d)
z = mu + std * eps

# 2. Analytical KL divergence against standard Gaussian N(0, I)
kl_divergence = -0.5 * np.sum(1.0 + log_var - mu**2 - np.exp(log_var), axis=1)

print("Sample 0 (ideal prior: mu=0, logvar=0):")
print(f"  Latent sample z: {np.round(z[0], 4).tolist()}")
print(f"  KL divergence:   {kl_divergence[0]:.4f} (zero penalty)")

print("Sample 1 (displaced mean, scaled variance):")
print(f"  Latent sample z: {np.round(z[1], 4).tolist()}")
print(f"  KL divergence:   {kl_divergence[1]:.4f} (regularisation penalty applied)")`,
    quiz: [
      {
        q: r`What is the fundamental purpose of the reparameterisation trick in Variational Autoencoders?`,
        o: [
          r`To convert continuous latent variables into discrete integers`,
          r`To allow backpropagation through the latent sampling step by expressing $z$ as a deterministic function of parameters and independent noise`,
          r`To eliminate the need for a decoder network`,
          r`To speed up matrix multiplication using 16-bit floating point operations`,
        ],
        a: 1,
        why: r`Direct stochastic sampling ($z \sim \mathcal{N}(\mu, \sigma^2)$) has no defined gradient with respect to distribution parameters. Formulating $z = \mu + \sigma \odot \epsilon$ isolates randomness into $\epsilon$, making $z$ fully differentiable with respect to $\mu$ and $\sigma$.`,
      },
      {
        q: r`What failure mode occurs when a VAE experiences "posterior collapse"?`,
        o: [
          r`The encoder mean values explode to infinity`,
          r`The decoder learns to model the data unconditionally, completely ignoring the latent variable $z$ while the KL divergence drops to zero`,
          r`The reconstruction loss becomes negative`,
          r`The training process produces NaN values in the learning rate scheduler`,
        ],
        a: 1,
        why: r`Posterior collapse happens when an expressive decoder reconstructs data without using latent information, causing the variational posterior $q(z|x)$ to collapse to the uninformative prior $p(z)$ ($D_{\text{KL}} \to 0$).`,
      },
      {
        q: r`In the Evidence Lower Bound (ELBO), what role does the KL divergence term play?`,
        o: [
          r`It measures classification accuracy on the validation split`,
          r`It regularises the encoder's posterior distribution to match a standard normal prior $\mathcal{N}(0, I)$, ensuring a smooth, continuous latent space`,
          r`It doubles the learning rate whenever loss plateaus`,
          r`It enforces orthogonality between weight matrices in the decoder`,
        ],
        a: 1,
        why: r`The KL divergence acts as a regulariser that pulls encoded representations toward a zero-centred unit Gaussian distribution, preventing disconnected clusters and guaranteeing that random sampling yields realistic data.`,
      },
      {
        q: r`How does generation of new samples occur in a trained VAE?`,
        o: [
          r`By passing real images through the encoder and discarding the decoder`,
          r`By sampling a latent vector $z$ directly from the standard normal prior $\mathcal{N}(0, I)$ and passing it through the decoder`,
          r`By calculating the gradient of the training loss with respect to pixels`,
          r`By running k-means clustering on the training dataset`,
        ],
        a: 1,
        why: r`Because the KL divergence trained the latent space to approximate $\mathcal{N}(0, I)$, sampling $z \sim \mathcal{N}(0, I)$ and evaluating $g_\theta(z)$ synthesises novel, realistic data without needing an input image.`,
      },
    ],
    usedBy: [],
    prereq: ['autoencoders', 'backpropagation-and-autodiff', 'maximum-likelihood-estimation'],
    related: ['gans', 'the-attention-mechanism', 'residual-networks-and-skip-connections'],
    keywords: 'variational autoencoder vae elbo kl divergence reparameterisation trick generative model posterior collapse latent space continuous manifold kingma welling',
  },
  {
    id: 'gans',
    short: 'GANs',
    title: 'Generative Adversarial Networks (GANs)',
    task: 'concepts',
    module: 'Architectures',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Pitting two neural networks against each other in a zero-sum minimax game: a generator creates synthetic counterfeits while a discriminator learns to detect them.`,
    lead: r`Rather than relying on hand-crafted pixel reconstruction metrics that encourage blurry outputs, Generative Adversarial Networks (GANs, Goodfellow et al. 2014) cast generative modelling as an adversarial game. A generator learns to synthesize realistic data from random noise, while a discriminator acts as an adaptive loss function, continually learning to distinguish genuine training examples from synthetic fakes.`,
    intuition: [
      r`Consider an art counterfeiter and an art detective:
- The **Generator** ($G$) is the counterfeiter: it accepts random Gaussian noise $z \sim \mathcal{N}(0, I)$ and attempts to paint a convincing fake artwork $G(z)$.
- The **Discriminator** ($D$) is the detective: it receives an image $x$ (which is either an authentic museum masterpiece or a counterfeit from the generator) and outputs a probability score $D(x) \in [0, 1]$ indicating whether the image is authentic.
At the beginning, both networks are unskilled: the generator outputs random static noise, and the discriminator guesses at chance levels.`,
      r`Training proceeds as a competitive two-player alternating game:
1. **Train the Discriminator**: Present it with a batch of authentic images (labelled 1) and a batch of generator fakes (labelled 0). Update discriminator weights to maximise classification accuracy.
2. **Train the Generator**: Feed noise through the generator, pass the generated fakes to the discriminator, and update generator weights to fool the discriminator into classifying fakes as authentic ($D(G(z)) \to 1$).
As the discriminator learns to detect increasingly subtle visual flaws, the generator is forced to eliminate those flaws, producing sharper textures, higher fidelity, and convincing spatial details.`,
      r`At theoretical equilibrium (the **Nash equilibrium**), the generator captures the true underlying data distribution ($p_g = p_{\text{data}}$), and the discriminator can do no better than guessing with probability $D(x) = 0.5$ for every candidate image. Because the generator is guided by a learned discriminator rather than an inflexible pixel-wise distance metric like Mean Squared Error, GANs avoid the blurriness typical of standard autoencoders and produce crisp, photorealistic imagery.`,
    ],
    analogy: r`Like a currency counterfeiter and a bank teller: as the counterfeiter refines their printing techniques, the teller learns new counterfeit-detection checks, perpetually driving both to higher levels of mastery.`,
    steps: [
      r`Design dual architectures: construct Generator $G_\theta: \mathbb{R}^{d_z} \to \mathbb{R}^D$ and Discriminator $D_\phi: \mathbb{R}^D \to [0, 1]$ using convolutional or dense layers with LeakyReLU activations.`,
      r`Train the discriminator on real and fake batches: freeze generator parameters, evaluate $D(x_{\text{real}})$ and $D(G(z))$, and update discriminator weights using binary cross-entropy loss.`,
      r`Train the generator with non-saturating loss: freeze discriminator parameters, sample fresh noise $z$, and update generator weights to maximise $\log D(G(z))$ (minimising $-\log D(G(z))$).`,
      r`Alternate training updates: execute one or more discriminator steps per generator step to ensure the discriminator provides informative gradients.`,
      r`Monitor adversarial equilibrium: verify that discriminator loss does not collapse to zero (which eliminates generator gradients) or diverge uncontrollably.`,
    ],
    math: [
      {
        h: 'The minimax zero-sum game objective',
        tex: r`$$\min_G \max_D V(D, G) = \mathbb{E}_{x \sim p_{\text{data}}}\big[\log D(x)\big] + \mathbb{E}_{z \sim p_z}\big[\log\big(1 - D(G(z))\big)\big]$$`,
        p: r`$D(x)$ is the discriminator's predicted probability that $x$ is real, and $G(z)$ is the generator's synthesized sample from noise prior $p_z$. The discriminator seeks to maximise $V(D, G)$ by correctly classifying real and fake inputs; the generator seeks to minimise it by producing fakes that drive $D(G(z)) \to 1$.`,
      },
      {
        h: 'Optimal discriminator and Jensen-Shannon Divergence',
        tex: r`$$D^*(x) = \frac{p_{\text{data}}(x)}{p_{\text{data}}(x) + p_g(x)} \implies V(D^*, G) = -\log(4) + 2 \cdot D_{\text{JS}}(p_{\text{data}} \parallel p_g)$$`,
        p: r`For any fixed generator $G$, the optimal discriminator is the density ratio of real data to combined data. When substituted into the objective, minimising $V(D^*, G)$ is mathematically equivalent to minimising the Jensen-Shannon divergence between real data distribution $p_{\text{data}}$ and generated distribution $p_g$.`,
      },
      {
        h: 'Non-saturating generator loss (practical implementation)',
        tex: r`$$\mathcal{L}_G = -\mathbb{E}_{z \sim p_z}\big[\log D(G(z))\big] \quad \text{instead of} \quad \mathcal{L}_G^{\text{orig}} = \mathbb{E}_{z \sim p_z}\big[\log(1 - D(G(z)))\big]$$`,
        p: r`Early in training when the generator is weak, the discriminator easily identifies fakes ($D(G(z)) \approx 0$). In this regime, the original minimax loss $\log(1 - D(G(z)))$ has flat gradients. Maximising $\log D(G(z))$ provides steep, non-zero gradients early on, dramatically accelerating generator learning.`,
      },
    ],
    keyPoints: [
      r`GANs replace hand-crafted loss functions with an adaptive discriminator network that dynamically discovers the criteria for realism.`,
      r`The non-saturating generator loss ($-\log D(G(z))$) overcomes vanishing gradients early in training when the discriminator easily outmatches the generator.`,
      r`Theoretical Nash equilibrium is reached when the generator reproduces the true data distribution ($p_g = p_{\text{data}}$) and the discriminator predicts $0.5$ for all samples.`,
    ],
    pitfalls: [
      r`Mode collapse: the generator discovers a narrow subset of convincing samples (or a single class) that reliably fools the discriminator, ignoring the rest of the target distribution.`,
      r`Discriminator overpowering: if the discriminator learns too fast and achieves 100% accuracy, generator gradients vanish to zero, freezing training.`,
      r`Using training loss curves to judge visual quality: GAN loss curves fluctuate and do not correlate monotonically with sample fidelity; use metrics like FID (Fréchet Inception Distance) instead.`,
    ],
    code: r`import numpy as np

# Simulate one step of GAN training on 1D Gaussian target N(4.0, 0.5^2)
np.random.seed(42)
N = 20
w_g, b_g = 1.0, 1.0  # Generator: G(z) = w_g * z + b_g
w_d, b_d = 0.5, 0.0  # Discriminator: D(x) = sigmoid(w_d * x + b_d)

# 1. Evaluate Discriminator on real data vs generated fakes
z_noise = np.random.randn(N)
x_fake = w_g * z_noise + b_g
x_real = np.random.normal(4.0, 0.5, size=N)

d_real = 1.0 / (1.0 + np.exp(-(w_d * x_real + b_d)))
d_fake = 1.0 / (1.0 + np.exp(-(w_d * x_fake + b_d)))

loss_d = -float(np.mean(np.log(d_real + 1e-8) + np.log(1.0 - d_fake + 1e-8)))

# 2. Evaluate Generator using non-saturating loss: -log(D(G(z)))
z_fresh = np.random.randn(N)
x_gen = w_g * z_fresh + b_g
d_gen = 1.0 / (1.0 + np.exp(-(w_d * x_gen + b_d)))
loss_g = -float(np.mean(np.log(d_gen + 1e-8)))

print(f"Discriminator loss on mixed batch: {loss_d:.4f}")
print(f"Generator non-saturating loss:     {loss_g:.4f}")
print(f"Avg discriminator score on real data: {float(np.mean(d_real)):.4f}")
print(f"Avg discriminator score on fake data: {float(np.mean(d_fake)):.4f}")`,
    quiz: [
      {
        q: r`What is "mode collapse" in Generative Adversarial Networks?`,
        o: [
          r`The discriminator learning rate drops to zero during training`,
          r`The generator produces only a limited variety of outputs (or a single sample) that fools the discriminator, ignoring the diversity of the true distribution`,
          r`The model runs out of GPU memory during backward passes`,
          r`The generator weights collapse to zero due to excessive weight decay`,
        ],
        a: 1,
        why: r`Mode collapse occurs when the generator finds a small region of the data space that consistently fools the discriminator, repeatedly producing that single pattern rather than learning the entire multimodal distribution.`,
      },
      {
        q: r`Why is the non-saturating generator loss $-\log D(G(z))$ preferred over the original minimax formulation $\log(1 - D(G(z)))$?`,
        o: [
          r`Because it provides strong, non-vanishing gradients early in training when the discriminator easily rejects poor generator fakes`,
          r`Because it eliminates the discriminator network entirely`,
          r`Because it guarantees that the generator converges in exactly one epoch`,
          r`Because it forces the discriminator to predict negative probabilities`,
        ],
        a: 0,
        why: r`Early in training, $D(G(z)) \approx 0$. The slope of $\log(1 - D(G(z)))$ is near zero in this regime, causing vanishing gradients. In contrast, $-\log D(G(z))$ has a steep slope near zero, providing large initial gradient updates.`,
      },
      {
        q: r`What is the theoretical Nash equilibrium state of the ideal GAN minimax game?`,
        o: [
          r`The generator produces zero loss and the discriminator achieves 100% accuracy`,
          r`The generated distribution matches the real data distribution ($p_g = p_{\text{data}}$) and the discriminator predicts 0.5 for all samples`,
          r`The discriminator loss diverges to infinity`,
          r`The generator outputs only negative numbers`,
        ],
        a: 1,
        why: r`At Nash equilibrium, the generator perfectly replicates the true data distribution ($p_g = p_{\text{data}}$), leaving the discriminator unable to distinguish real from fake and forcing its optimal prediction to be chance ($D(x) = 0.5$).`,
      },
      {
        q: r`Why are training loss curves often uninformative for assessing the quality of a GAN?`,
        o: [
          r`Because GAN loss curves do not record floating-point numbers`,
          r`Because the discriminator and generator improve adversarially against each other; an equilibrium game can exhibit oscillating or static losses while visual quality steadily improves`,
          r`Because binary cross-entropy cannot be computed on images`,
          r`Because the generator does not use backpropagation`,
        ],
        a: 1,
        why: r`In a zero-sum game, as the generator gets better, the discriminator also adapts. Both losses can remain roughly constant even as sample realism improves dramatically, necessitating sample-based metrics like Fréchet Inception Distance (FID).`,
      },
    ],
    usedBy: [],
    prereq: ['variational-autoencoders', 'the-pytorch-training-loop', 'backpropagation-and-autodiff'],
    related: ['autoencoders', 'residual-networks-and-skip-connections', 'the-attention-mechanism'],
    keywords: 'gans generative adversarial networks generator discriminator minimax game jensen-shannon divergence mode collapse non-saturating loss nash equilibrium goodfellow',
  },
  {
    id: 'diffusion-models',
    short: 'Diffusion models',
    title: 'Denoising Diffusion Probabilistic Models (DDPMs)',
    task: 'concepts',
    module: 'Architectures',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Destroying data structure with forward Gaussian noise, then training a neural network to reverse entropy step by step to synthesize photorealistic images from pure white noise.`,
    lead: r`Unlike GANs that suffer from delicate adversarial balance and mode collapse, Denoising Diffusion Probabilistic Models (DDPMs, Sohl-Dickstein et al. 2015, Ho et al. 2020) formulate generative modelling as an iterative denoising process. A forward Markov chain adds Gaussian noise over hundreds of timesteps until an image dissolves into pure noise, and a neural network learns to predict and subtract that noise at each step to generate novel samples.`,
    intuition: [
      r`Imagine a single drop of blue food dye suspended in a glass of water. At time $t=0$, the dye is a concentrated, well-structured droplet (the original data image). As time progresses, thermodynamic diffusion causes the dye molecules to disperse randomly until the water becomes a completely uniform, pale blue haze (pure Gaussian noise). This forward process destroys information systematically and requires zero learned parameters.`,
      r`Generative diffusion asks whether we can reverse the video: starting from an unorganised glass of hazy water ($x_T \sim \mathcal{N}(0, I)$), can we trace the molecules backward step by step until the concentrated droplet reforms? A neural network (typically a U-Net equipped with self-attention) inspects the noisy image at step $t$ and predicts the noise component $\epsilon_\theta(x_t, t)$ that was added. Subtracting this predicted noise steps the state backward from $t$ to $t-1$. Repeating this reverse denoising procedure over dozens or hundreds of steps transforms pure random static into an exquisite, coherent image.`,
      r`The fundamental mathematical breakthrough of modern diffusion is the **closed-form forward jump**: you do not need to simulate the forward diffusion step by step during training! By defining the cumulative noise factor $\bar{\alpha}_t = \prod_{s=1}^t (1 - \beta_s)$, you can calculate the noisy image $x_t$ at any arbitrary timestep $t$ directly from the clean image $x_0$ in a single equation: $x_t = \sqrt{\bar{\alpha}_t} x_0 + \sqrt{1 - \bar{\alpha}_t} \epsilon$. Training then collapses into a clean Mean Squared Error regression problem where the network simply predicts the injected noise vector $\epsilon$.`,
    ],
    analogy: r`Like sculpting a statue in reverse: sandblasting a marble masterpiece into a shapeless pile of dust (forward process), then training an artisan to brush away microscopic grains of dust step by step until the statue re-emerges (reverse process).`,
    steps: [
      r`Define the forward variance schedule: select hyperparameter bounds $\beta_1, \dots, \beta_T$ (e.g. linear schedule from $10^{-4}$ to $0.02$) and precompute cumulative products $\bar{\alpha}_t = \prod_{s=1}^t (1 - \beta_s)$.`,
      r`Sample random training batches: select clean data points $x_0$, sample random discrete timesteps $t \sim \operatorname{Uniform}(1, T)$, and sample standard Gaussian noise $\epsilon \sim \mathcal{N}(0, I)$.`,
      r`Calculate the noisy latent in closed form: compute $x_t = \sqrt{\bar{\alpha}_t} x_0 + \sqrt{1 - \bar{\alpha}_t} \epsilon$ directly without simulating preceding timesteps.`,
      r`Predict injected noise with a U-Net: pass noisy input $x_t$ alongside a sinusoidal timestep embedding $t$ through the network to predict noise estimate $\hat{\epsilon} = \epsilon_\theta(x_t, t)$.`,
      r`Optimise with Mean Squared Error: update network weights using the simplified loss $\lVert \epsilon - \epsilon_\theta(x_t, t) \rVert_2^2$ via [[optimisers-sgd-momentum-rmsprop-adam-adamw|AdamW]].`,
      r`Generate samples via reverse denoising: initialise at $x_T \sim \mathcal{N}(0, I)$ and iteratively subtract predicted noise according to the reverse Markov transition formula until reaching clean sample $x_0$.`,
    ],
    math: [
      {
        h: 'Closed-form forward diffusion distribution',
        tex: r`$$q(x_t | x_0) = \mathcal{N}\left(x_t; \, \sqrt{\bar{\alpha}_t} x_0, \, (1 - \bar{\alpha}_t) I\right), \qquad \alpha_t = 1 - \beta_t, \quad \bar{\alpha}_t = \prod_{s=1}^t \alpha_s$$`,
        p: r`$x_0$ is the clean image, $\beta_t \in (0, 1)$ is the variance schedule at step $t$, and $\bar{\alpha}_t$ is the cumulative variance scale. As $t \to T$, $\bar{\alpha}_t \to 0$, causing $x_T$ to converge to standard isotropic Gaussian noise $\mathcal{N}(0, I)$.`,
      },
      {
        h: 'Simplified noise prediction training objective',
        tex: r`$$\mathcal{L}_{\text{simple}}(\theta) = \mathbb{E}_{t, x_0, \epsilon}\left[ \left\lVert \epsilon - \epsilon_\theta\left(\sqrt{\bar{\alpha}_t} x_0 + \sqrt{1 - \bar{\alpha}_t} \epsilon, \, t\right) \right\rVert_2^2 \right]$$`,
        p: r`$\epsilon \sim \mathcal{N}(0, I)$ is the ground-truth noise sampled during the forward jump, and $\epsilon_\theta$ is the neural network. Ho et al. showed that training on unweighted noise regression outperforms optimising the full variational lower bound, yielding sharper perceptual details.`,
      },
      {
        h: 'Reverse Markov transition step (DDPM sampling)',
        tex: r`$$x_{t-1} = \frac{1}{\sqrt{\alpha_t}}\left( x_t - \frac{\beta_t}{\sqrt{1 - \bar{\alpha}_t}} \epsilon_\theta(x_t, t) \right) + \sigma_t z, \quad z \sim \mathcal{N}(0, I) \text{ for } t > 1$$`,
        p: r`$x_t$ is the noisy state at step $t$, $\epsilon_\theta(x_t, t)$ is the predicted noise, and $\sigma_t^2 = \frac{1 - \bar{\alpha}_{t-1}}{1 - \bar{\alpha}_t} \beta_t$ controls stochastic injection. Repeating this step from $t=T$ down to $t=1$ synthesizes clean image $x_0$.`,
      },
    ],
    keyPoints: [
      r`The forward diffusion process progressively destroys structure with Gaussian noise; the reverse process creates data by learning to subtract predicted noise.`,
      r`The closed-form forward jump equation ($x_t = \sqrt{\bar{\alpha}_t} x_0 + \sqrt{1 - \bar{\alpha}_t}\epsilon$) allows training at arbitrary timesteps in $O(1)$ time without simulating intermediate steps.`,
      r`Diffusion models eliminate adversarial minimax instability and mode collapse, providing higher sample diversity and visual fidelity than classical GANs.`,
    ],
    pitfalls: [
      r`Slow ancestral sampling: generating an image with vanilla DDPM requires 50 to 1,000 sequential neural forward passes; accelerated non-Markovian samplers (DDIM, DPM-Solver) are required for interactive latency.`,
      r`Omitting timestep conditioning: the denoising network must receive an explicit embedding of timestep $t$ because removing faint noise at $t=5$ requires entirely different operations than hallucinating shapes from near-pure noise at $t=900$.`,
      r`Using linear noise schedules on high-resolution images, where noise increases too abruptly early in the forward process and destroys structural low-frequency composition.`,
    ],
    code: r`import numpy as np

# Forward diffusion noise schedule simulation (T = 100 timesteps)
np.random.seed(42)
T = 100
beta = np.linspace(1e-4, 0.02, T)
alpha = 1.0 - beta
alpha_bar = np.cumprod(alpha)

# Clean synthetic 1D signal and random noise
x0 = 3.0
eps = float(np.random.randn())

timesteps = [10, 50, 99]
print("Forward diffusion closed-form evaluation (clean x0 = 3.0):")
for t in timesteps:
    ab = float(alpha_bar[t])
    xt = np.sqrt(ab) * x0 + np.sqrt(1.0 - ab) * eps
    signal_ratio = np.sqrt(ab) * x0
    noise_ratio = np.sqrt(1.0 - ab) * eps
    print(f"Step {t+1:3d}: alpha_bar={ab:.4f} | x_t={xt:.4f} (signal={signal_ratio:.4f}, noise={noise_ratio:.4f})")`,
    quiz: [
      {
        q: r`Why does modern diffusion model training not require simulating the forward process step by step from $t=1$ to $t$?`,
        o: [
          r`Because diffusion models only train on the final timestep $t=T$`,
          r`Because cumulative properties of Gaussian distributions permit sampling $x_t$ directly from $x_0$ in closed form: $x_t = \sqrt{\bar{\alpha}_t} x_0 + \sqrt{1 - \bar{\alpha}_t}\epsilon$`,
          r`Because the forward process uses an autoregressive language model`,
          r`Because all intermediate images are pre-computed and stored on disk`,
        ],
        a: 1,
        why: r`Because the sum of independent Gaussians is itself Gaussian, the chain of noise additions compounds into a single closed-form distribution with mean $\sqrt{\bar{\alpha}_t} x_0$ and variance $(1 - \bar{\alpha}_t) I$.`,
      },
      {
        q: r`What is the primary operational disadvantage of DDPM compared to Generative Adversarial Networks (GANs)?`,
        o: [
          r`Diffusion models suffer from catastrophic mode collapse`,
          r`Inference generation is computationally slow because it requires dozens or hundreds of sequential neural network evaluations to denoise an image`,
          r`Diffusion models cannot be trained with the Adam optimiser`,
          r`Diffusion models can only generate black-and-white images`,
        ],
        a: 1,
        why: r`While GANs produce a synthetic image in a single forward pass ($G(z)$), DDPMs must iteratively evaluate the denoising U-Net at every reverse timestep, requiring substantial compute per generated sample.`,
      },
      {
        q: r`In the simplified DDPM training objective $\mathcal{L}_{\text{simple}}$, what target does the neural network attempt to predict?`,
        o: [
          r`The classification label of the image`,
          r`The exact unscaled clean image $x_0$ directly`,
          r`The Gaussian noise vector $\epsilon$ that was added to create $x_t$`,
          r`The optimal learning rate for the backward pass`,
        ],
        a: 2,
        why: r`Ho et al. showed that training the network $\epsilon_\theta(x_t, t)$ to predict the injected noise vector $\epsilon$ with standard MSE loss yields superior sample quality and simpler optimisation than predicting $x_0$ directly.`,
      },
      {
        q: r`What role does the sinusoidal timestep embedding play in the denoising U-Net?`,
        o: [
          r`It informs the network of the current noise level $t$, enabling it to calibrate whether to perform subtle refinement or coarse structural synthesis`,
          r`It normalises the image pixels to zero mean and unit variance`,
          r`It prevents the learning rate from decaying to zero`,
          r`It applies causal masking across the spatial grid`,
        ],
        a: 0,
        why: r`The task of removing faint noise near $t=0$ requires vastly different spatial operations than guessing global layouts from heavy noise near $t=T$; timestep embeddings condition the network on the current noise scale.`,
      },
    ],
    usedBy: [],
    prereq: ['variational-autoencoders', 'the-pytorch-training-loop', 'gans'],
    related: ['residual-networks-and-skip-connections', 'the-attention-mechanism', 'autoencoders'],
    keywords: 'diffusion models ddpm denoising u-net reverse process forward process noise schedule score based generative models stable diffusion ho et al',
  },
  {
  "id": "graph-neural-networks-gcn-gat-graphsage",
  "short": "GNNs: GCN, GAT & GraphSAGE",
  "title": "Graph Neural Networks: Message Passing, GCN, Graph Attention, and GraphSAGE",
  "task": "concepts",
  "level": 3,
  "minutes": 18,
  "noLab": true,
  "usedBy": [],
  "summary": "Learning node, edge, and graph representations using permutation-equivariant message passing, spectral convolutions, and inductive neighbourhood sampling.",
  "lead": "Standard deep learning architectures assume Euclidean data: images are regular 2D grids, and text is a 1D sequence. However, many real-world systems are non-Euclidean graphs: social networks, molecule bonds, financial transaction webs, and knowledge graphs. Graph Neural Networks (GNNs) extend deep learning to arbitrary graphs through neural message passing, aggregating local neighbourhood information while respecting graph permutation symmetries.",
  "analogy": "Imagine a neighbourhood where rumours spread. At time zero, each resident knows only their personal secrets. In round one, everyone walks to their fence and chats with their immediate neighbours, blending what they hear into an updated mental worldview. In round two, chatting again spreads information from two streets away. After $K$ rounds, every resident's understanding incorporates the entire $K$-hop neighbourhood surrounding their house.",
  "intuition": [
    "A graph consists of nodes $\\mathcal{V}$, edges $\\mathcal{E}$, and node feature matrix $\\mathbf{X} \\in \\mathbb{R}^{N \\times d}$. A GNN must be permutation equivariant: renumbering the nodes in the input must produce the exact same renumbering in output representations.",
    "Message Passing Neural Networks (MPNN) generalise GNNs into three steps at each layer: 1) Message: compute messages along edges $m_{uv} = M(h_u, h_v, e_{uv})$; 2) Aggregate: combine incoming messages using a permutation-invariant aggregator (sum, mean, max); 3) Update: combine aggregated message with the node's own state $h_v^{(l+1)} = U(h_v^{(l)}, m_v)$.",
    "Graph Convolutional Networks (GCN; Kipf & Welling) implement isotropic averaging using a renormalized symmetric Laplacian $\\tilde{\\mathbf{D}}^{-1/2} \\tilde{\\mathbf{A}} \\tilde{\\mathbf{D}}^{-1/2} \\mathbf{H} \\mathbf{W}$, weighting neighbours by degree.",
    "Graph Attention Networks (GAT; Veličković et al.) replace fixed degree weights with learned self-attention coefficients $\\alpha_{uv}$, allowing a node to dynamically focus on its most relevant neighbours. GraphSAGE (Hamilton et al.) solves scalability on massive web graphs by sampling a fixed number of neighbours per node rather than loading the entire global adjacency matrix into memory."
  ],
  "steps": [
    "Construct graph representation: Form node feature matrix $\\mathbf{X}$ and edge list / sparse adjacency matrix $\\mathbf{A}$ with self-loops added.",
    "Define neighbourhood aggregation function: Select GCN (degree-normalised mean), GAT (multi-head attention), or GraphSAGE (sampled mean/max pooling).",
    "Sample local neighbourhoods (GraphSAGE): For massive graphs, sample fixed-size sub-neighbourhoods (e.g. $S_1 = 25, S_2 = 10$) to bound minibatch memory.",
    "Compute layer-wise message passing: Transform node features through linear projections $\\mathbf{W}^{(l)}$, aggregate messages across incoming edges, and apply non-linear activations.",
    "Add skip connections: Incorporate residual connections or jumping knowledge networks to prevent oversmoothing in deep architectures.",
    "Downstream readout: Extract updated node embeddings for node classification, link prediction, or pool across the graph via global mean/sum for graph classification."
  ],
  "math": [
    {
      "h": "Message Passing Neural Network (MPNN) Formulation",
      "tex": "h_v^{(l+1)} = \\operatorname{UPDATE}^{(l)}\\left( h_v^{(l)}, \\; \\operatorname{AGG}_{u \\in \\mathcal{N}(v)}^{(l)}\\left( \\operatorname{MSG}^{(l)}(h_v^{(l)}, h_u^{(l)}, e_{vu}) \\right) \\right)",
      "p": "General message passing update: aggregating edge messages from neighbours $u \\in \\mathcal{N}(v)$ via permutation-invariant reduction AGG."
    },
    {
      "h": "Graph Convolutional Network (GCN) Layer",
      "tex": "\\mathbf{H}^{(l+1)} = \\sigma\\left( \\tilde{\\mathbf{D}}^{-\\frac{1}{2}} \\tilde{\\mathbf{A}} \\tilde{\\mathbf{D}}^{-\\frac{1}{2}} \\mathbf{H}^{(l)} \\mathbf{W}^{(l)} \\right), \\quad \\tilde{\\mathbf{A}} = \\mathbf{A} + \\mathbf{I}_N",
      "p": "GCN normalises adjacency matrix with self-loops $\\tilde{\\mathbf{A}}$ using symmetric diagonal degree matrix $\\tilde{\\mathbf{D}}_{ii} = \\sum_j \\tilde{\\mathbf{A}}_{ij}$."
    },
    {
      "h": "Graph Attention Network (GAT) Attention Weights",
      "tex": "\\alpha_{uv} = \\frac{\\exp\\left( \\operatorname{LeakyReLU}\\left( \\mathbf{a}^T [\\mathbf{W} h_u \\parallel \\mathbf{W} h_v] \\right) \\right)}{\\sum_{k \\in \\mathcal{N}(v) \\cup \\{v\\}} \\exp\\left( \\operatorname{LeakyReLU}\\left( \\mathbf{a}^T [\\mathbf{W} h_k \\parallel \\mathbf{W} h_v] \\right) \\right)}",
      "p": "Computes anisotropic softmax attention coefficients $\\alpha_{uv}$ over concatenated linear projections $[mathbf{W} h_u \\parallel \\mathbf{W} h_v]$."
    }
  ],
  "code": "import torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\nclass SimpleGCNLayer(nn.Module):\n    def __init__(self, in_features: int, out_features: int):\n        super().__init__()\n        self.linear = nn.Linear(in_features, out_features, bias=False)\n\n    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:\n        # 1. Add self-loops: A_tilde = A + I\n        N = x.size(0)\n        adj_tilde = adj + torch.eye(N, device=adj.device)\n        \n        # 2. Symmetric degree normalisation: D^-0.5 * A_tilde * D^-0.5\n        deg = torch.sum(adj_tilde, dim=1)\n        deg_inv_sqrt = torch.pow(deg, -0.5)\n        deg_inv_sqrt[torch.isinf(deg_inv_sqrt)] = 0.0\n        d_mat = torch.diag(deg_inv_sqrt)\n        norm_adj = d_mat @ adj_tilde @ d_mat\n        \n        # 3. Message passing: norm_adj @ X @ W\n        support = self.linear(x)\n        out = norm_adj @ support\n        return F.relu(out)\n\n# 4 nodes, 3 features each\nX = torch.tensor([\n    [1.0, 0.0, 0.5],\n    [0.0, 1.0, 0.2],\n    [0.5, 0.5, 0.0],\n    [0.0, 0.0, 1.0]\n])\n# Adjacency matrix: undirected ring graph (0-1, 1-2, 2-3, 3-0)\nA = torch.tensor([\n    [0.0, 1.0, 0.0, 1.0],\n    [1.0, 0.0, 1.0, 0.0],\n    [0.0, 1.0, 0.0, 1.0],\n    [1.0, 0.0, 1.0, 0.0]\n])\n\ngcn = SimpleGCNLayer(in_features=3, out_features=4)\nH1 = gcn(X, A)\nprint(\"Updated node embeddings shape:\", H1.shape)\nprint(\"Node 0 aggregated representation:\\n\", H1[0].detach().numpy())",
  "keyPoints": [
    "GNNs learn representations on non-Euclidean graph topologies through iterative message passing.",
    "Message passing combines localized node transformations with permutation-invariant neighbour aggregations.",
    "GCN performs isotropic degree-normalised smoothing; GAT introduces anisotropic learned attention weights.",
    "GraphSAGE samples fixed-size sub-neighbourhoods, enabling scalable minibatch training on billion-node graphs."
  ],
  "pitfalls": [
    "Oversmoothing in deep GNNs: Stacking more than 3–4 GCN layers causes all node embeddings to converge to identical vectors, destroying discriminative power.",
    "Neighbourhood explosion in dense graphs: A node with 10,000 neighbours causes the $K$-hop computation graph to expand exponentially; use GraphSAGE sampling.",
    "Missing self-loops: If self-loops are omitted from the adjacency matrix, a node ignores its own existing feature state when aggregating messages."
  ],
  "quiz": [
    {
      "q": "What is the \"oversmoothing\" problem in Graph Neural Networks (GNNs)?",
      "o": [
        "Gradients exploding to infinity during training",
        "When stacking many message passing layers causes node embeddings across the entire graph to converge to uniform, identical representations, losing distinction",
        "When images lose their sharpness during convolution",
        "When the learning rate decays too quickly"
      ],
      "a": 1,
      "why": "Repeated Laplacian smoothing averages representations across wide network diameters. After many layers, every node embedding becomes nearly indistinguishable from its neighbours."
    },
    {
      "q": "How does Graph Attention Network (GAT) improve upon the standard Graph Convolutional Network (GCN)?",
      "o": [
        "GAT replaces GPUs with quantum processors",
        "GAT computes learned attention weights between pairs of connected nodes, allowing nodes to assign different importance to different neighbours rather than using static degree weights",
        "GAT eliminates all non-linear activation functions",
        "GAT only works on graphs with fewer than 10 nodes"
      ],
      "a": 1,
      "why": "GCN treats all connected neighbours with fixed isotropic degree normalisation. GAT learns anisotropic attention weights $\\alpha_{uv}$, attending selectively to critical neighbours."
    },
    {
      "q": "Why is GraphSAGE capable of training on massive multi-million node graphs where standard full-batch GCN fails?",
      "o": [
        "GraphSAGE deletes all edges in the graph",
        "GraphSAGE samples a fixed number of neighbours at each hop, allowing scalable minibatch training without loading the entire graph into VRAM",
        "GraphSAGE converts graph nodes into text tokens",
        "GraphSAGE requires zero memory"
      ],
      "a": 1,
      "why": "Full GCN requires computing matrix operations on the full global adjacency matrix. GraphSAGE samples a fixed number of neighbours per node, enabling standard minibatch SGD."
    }
  ],
  "related": [
    "the-attention-mechanism",
    "residual-networks-and-skip-connections",
    "contrastive-learning-simclr-and-infonce"
  ],
  "keywords": "graph neural networks, gnn, gcn, gat, graphsage, message passing, oversmoothing, node classification, graph convolution"
},
  {
  "id": "mixture-of-experts",
  "short": "Mixture of experts (MoE)",
  "title": "Mixture of Experts (MoE): Conditional Computation and Sparse Gating",
  "task": "concepts",
  "level": 3,
  "minutes": 18,
  "noLab": true,
  "usedBy": [],
  "summary": "Decoupling model parameter capacity from FLOP compute cost using sparse top-$k$ gating routers and load balancing auxiliary losses.",
  "lead": "In dense neural networks, every single parameter is activated for every single forward pass: doubling the parameter count doubles the FLOP compute cost and training latency. Mixture of Experts (MoE) introduces conditional computation: replacing dense Feed-Forward Network (FFN) layers with an ensemble of $E$ parallel expert sub-networks, directed by a learned router that routes each token to only top-$k$ experts (e.g. 2 out of 8). MoE scales models to trillions of parameters with constant inference FLOPs.",
  "analogy": "Imagine a high-volume medical clinic. In a dense system, every single patient is examined simultaneously by 16 different medical specialists (cardiologist, neurologist, orthopaedic surgeon, dermatologist), running up astronomical bills. In a Mixture of Experts clinic, a triage nurse (the router) examines the patient's symptoms and routes them strictly to the two most relevant specialists. The clinic maintains the collective knowledge of 16 experts while paying for only 2 specialists per patient.",
  "intuition": [
    "In standard Transformers, Feed-Forward Network (FFN) layers account for $\\approx 2/3$ of total model parameters. MoE replaces each dense FFN with $E$ identical-structure independent FFN blocks called \"experts\".",
    "A lightweight gating router network $G(x) = \\operatorname{Softmax}(\\operatorname{TopK}(x \\cdot W_g + \\epsilon, k))$ computes routing probabilities for each token, directing the token to the $k$ experts with the highest scores.",
    "Because each token interacts with only $k$ experts (typically $k=1$ or $k=2$), the floating point operations (FLOPs) per token remain constant, even as the total parameter count scales by $8\\times$ or $64\\times$.",
    "The primary failure mode of MoE is Expert Collapse: the router quickly learns to send every single token to the same 1–2 favourite experts, leaving the remaining experts starved of gradients. MoE prevents this using an auxiliary Load Balancing Loss that penalises unequal token allocation across experts."
  ],
  "steps": [
    "Select layer replacement: Substitute dense FFN blocks in Transformer decoder layers with MoE layers containing $E$ parallel expert networks.",
    "Configure routing top-$k$: Choose $k=1$ (Switch Transformer; maximum efficiency) or $k=2$ (Mixture of Experts; smoother routing gradients).",
    "Compute router gating logits: Project token representations through router weight matrix $W_g$ and optionally add Gaussian noise during training for exploration.",
    "Apply Top-$k$ gating and normalisation: Select top-$k$ expert indices and re-normalise their softmax gating weights to sum to 1.0.",
    "Dispatch and gather tokens: Dispatch tokens to designated expert buffers, execute parallel forward passes, and combine outputs weighted by gating coefficients.",
    "Calculate load balancing auxiliary loss: Compute the coefficient of variation or dot product between router assignment probabilities and actual batch routing frequencies, adding to main loss."
  ],
  "math": [
    {
      "h": "MoE Conditional Computation Output",
      "tex": "y = \\sum_{i=1}^E G(x)_i \\cdot \\operatorname{Expert}_i(x), \\quad G(x) = \\operatorname{Softmax}\\left( \\operatorname{TopK}\\left( x W_g, \\; k \\right) \\right)",
      "p": "Output is the weighted sum across active experts where $G(x)_i > 0$ for strictly $k$ experts and $0$ for the remaining $(E - k)$ experts."
    },
    {
      "h": "Top-$k$ Gating Operator",
      "tex": "\\operatorname{TopK}(v, k)_i = \\begin{cases} v_i & \\text{if } v_i \\text{ is in top } k \\text{ elements of } v \\\\ -\\infty & \\text{otherwise} \\end{cases}",
      "p": "Sets non-selected expert logits to $-\\infty$ prior to softmax, driving their routing probabilities and compute costs to exact zero."
    },
    {
      "h": "Auxiliary Load Balancing Loss (Switch Transformer)",
      "tex": "\\mathcal{L}_{\\mathrm{aux}} = \\alpha \\cdot E \\sum_{i=1}^E f_i \\cdot P_i, \\quad f_i = \\frac{1}{T} \\sum_{t=1}^T \\mathbb{I}(\\operatorname{routed}(t) = i), \\; P_i = \\frac{1}{T} \\sum_{t=1}^T G(x_t)_i",
      "p": "Minimises the correlation between fraction of tokens dispatched $f_i$ and router probability mass $P_i$, penalising expert concentration."
    }
  ],
  "code": "import torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\nclass SimpleMoELayer(nn.Module):\n    def __init__(self, d_model: int, d_ff: int, num_experts: int = 4, top_k: int = 2):\n        super().__init__()\n        self.num_experts = num_experts\n        self.top_k = top_k\n        self.router = nn.Linear(d_model, num_experts, bias=False)\n        # Create independent expert FFNs\n        self.experts = nn.ModuleList([\n            nn.Sequential(\n                nn.Linear(d_model, d_ff),\n                nn.ReLU(),\n                nn.Linear(d_ff, d_model)\n            ) for _ in range(num_experts)\n        ])\n\n    def forward(self, x: torch.Tensor):\n        # x shape: [batch_size, seq_len, d_model]\n        batch, seq, d_model = x.shape\n        x_flat = x.view(-1, d_model)  # [N, d_model]\n        \n        # 1. Compute router logits\n        logits = self.router(x_flat)  # [N, num_experts]\n        \n        # 2. Select top-k experts per token\n        top_k_logits, top_k_indices = torch.topk(logits, self.top_k, dim=-1)\n        top_k_weights = F.softmax(top_k_logits, dim=-1)  # [N, top_k]\n        \n        # 3. Compute weighted expert outputs\n        out = torch.zeros_like(x_flat)\n        for k in range(self.top_k):\n            expert_idx = top_k_indices[:, k]\n            weight = top_k_weights[:, k].unsqueeze(-1)\n            # Route tokens to corresponding expert\n            for i, expert in enumerate(self.experts):\n                mask = (expert_idx == i)\n                if mask.any():\n                    out[mask] += weight[mask] * expert(x_flat[mask])\n                    \n        return out.view(batch, seq, d_model)\n\n# Test MoE layer with 4 experts, routing top-2 per token\nmoe = SimpleMoELayer(d_model=64, d_ff=256, num_experts=4, top_k=2)\nx = torch.randn(2, 8, 64)  # 16 tokens\nout = moe(x)\nprint(\"MoE Output shape:\", out.shape)\nprint(\"Each token evaluated by strictly 2 out of 4 experts!\")",
  "keyPoints": [
    "MoE decouples model capacity from compute cost through sparse conditional routing.",
    "Only top-$k$ experts are activated per token, keeping inference FLOPs constant as parameters grow.",
    "A learned router network predicts softmax gating scores across parallel expert FFNs.",
    "An auxiliary load balancing loss prevents expert collapse where all tokens route to one favourite expert."
  ],
  "pitfalls": [
    "Expert collapse: Without auxiliary load balancing, the router quickly routes all tokens to a single expert, reducing the model to a tiny fraction of its capacity.",
    "Inference memory overhead: While FLOPs are sparse, all expert weights must reside in GPU VRAM unless offloaded, requiring high aggregate memory.",
    "Communication overhead in distributed MoE: Sharding experts across multiple GPUs requires expensive all-to-all token dispatch shuffles across network interconnects."
  ],
  "quiz": [
    {
      "q": "What is the primary motivation for using Mixture of Experts (MoE) over dense neural network architectures?",
      "o": [
        "It eliminates the need for attention layers",
        "It allows scaling model parameter capacity by orders of magnitude without proportionally increasing computational FLOPs per token",
        "It forces models to output binary classification decisions",
        "It reduces training datasets to zero"
      ],
      "a": 1,
      "why": "In MoE, each token is processed by only top-$k$ experts (e.g. 2 out of 8), allowing parameter capacity to scale massively while computation cost per token stays constant."
    },
    {
      "q": "What is \"expert collapse\" in a Mixture of Experts model?",
      "o": [
        "When an expert network crashes with a segmentation fault",
        "A pathology where the gating router learns to route virtually all tokens to the same 1 or 2 experts, leaving the remaining experts untrained and unutilized",
        "When all expert weights decay to zero due to L2 regularisation",
        "When GPU VRAM runs out during backpropagation"
      ],
      "a": 1,
      "why": "Expert collapse occurs when a router favours a few experts early, creating a positive feedback loop where only those experts receive gradient updates."
    },
    {
      "q": "How do modern MoE models like Switch Transformer prevent expert collapse during training?",
      "o": [
        "By manually assigning words alphabetically to experts",
        "By introducing an auxiliary load balancing loss that penalises unequal distribution of tokens across experts",
        "By disabling backpropagation on the router weights",
        "By training only one expert at a time"
      ],
      "a": 1,
      "why": "The auxiliary load balancing loss penalises correlation between router probability mass and token dispatch fractions, incentivizing balanced expert utilisation."
    }
  ],
  "related": [
    "the-attention-mechanism",
    "residual-networks-and-skip-connections",
    "scaling-laws"
  ],
  "keywords": "mixture of experts, moe, conditional computation, sparse gating, top-k routing, expert collapse, switch transformer, load balancing loss"
},
  {
  "id": "state-space-models-and-mamba",
  "short": "State-space models & Mamba",
  "title": "State-Space Models and Mamba: Linear-Time Sequence Modelling via Selective State Spaces",
  "task": "concepts",
  "level": 3,
  "minutes": 18,
  "noLab": true,
  "usedBy": [],
  "summary": "Replacing quadratic self-attention with linear-time continuous state spaces, selective time-varying matrices, and hardware-aware associative scans.",
  "lead": "The Transformer's self-attention mechanism is the cornerstone of modern language modelling, but it suffers from a fundamental computational bottleneck: sequence length complexity scales quadratically $O(L^2)$ in compute and memory. Processing 100,000-token contexts in Transformers requires astronomical VRAM. State-Space Models (SSMs), culminating in Mamba (Gu & Dao, 2023), achieve Transformer-grade language quality with linear $O(L)$ scaling and constant-time inference.",
  "analogy": "Imagine reading an epic novel series like War and Peace. A Transformer is like an analyst who re-reads every single previous page from chapter 1 every time they read a new sentence to cross-reference every word. Mamba is like a brilliant detective who maintains a dynamic mental summary notebook: as each new line of dialogue arrives, they update their mental state in constant time, effortlessly remembering vital plot clues without rescanning thousands of earlier pages.",
  "intuition": [
    "Classical Structured State-Space Models (S4) map a continuous 1D input signal $x(t)$ to continuous latent state $h(t) \\in \\mathbb{R}^N$ and output $y(t)$ via continuous linear differential equations: $h'(t) = \\mathbf{A} h(t) + \\mathbf{B} x(t)$ and $y(t) = \\mathbf{C} h(t)$.",
    "Continuous SSMs are discretized using step size $\\Delta$ (Euler or Bilinear transform) into recurrence forms: $h_t = \\bar{\\mathbf{A}} h_{t-1} + \\bar{\\mathbf{B}} x_t$. This recurrence enables $O(1)$ constant-time inference per step, like an RNN.",
    "During training, because system matrices $(\\mathbf{A}, \\mathbf{B}, \\mathbf{C})$ were time-invariant (LTI), the entire sequence recurrence can be unrolled into a single global convolution $y = x * \\bar{\\mathbf{K}}$, computable in $O(L \\log L)$ time using Fast Fourier Transforms (FFTs).",
    "However, LTI models cannot perform content-based reasoning (e.g. selectively storing an important token and forgetting trivia). Mamba introduces Selective State Spaces: making $\\mathbf{B}, \\mathbf{C},$ and $\\Delta$ dynamic input-dependent functions of $x_t$. While this breaks global convolution, Mamba preserves parallel training using hardware-aware parallel associative scans implemented in GPU SRAM."
  ],
  "steps": [
    "Input projection: Project input token $x_t$ through linear expansion layers into dimension $D$.",
    "Input-dependent selection: Compute dynamic time-step $\\Delta_t = \\operatorname{softplus}(\\operatorname{Linear}(x_t))$, input matrix $\\mathbf{B}_t = \\operatorname{Linear}(x_t)$, and output matrix $\\mathbf{C}_t = \\operatorname{Linear}(x_t)$.",
    "Discretise continuous parameters: Compute discrete transition $\\bar{\\mathbf{A}}_t = \\exp(\\Delta_t \\mathbf{A})$ and discrete input scale $\\bar{\\mathbf{B}}_t = \\Delta_t \\mathbf{B}_t$.",
    "Parallel associative scan (Training): Compute sequence recurrence in $O(\\log L)$ parallel depth using associative scan operations directly inside high-speed GPU SRAM.",
    "Recurrent generation (Inference): Execute sequential state update $h_t = \\bar{\\mathbf{A}}_t h_{t-1} + \\bar{\\mathbf{B}}_t x_t$ with constant $O(1)$ step latency and zero KV-cache memory expansion.",
    "Output gating & projection: Modulate output with gating branch and project back to model dimension."
  ],
  "math": [
    {
      "h": "Continuous State-Space Differential Equation",
      "tex": "h'(t) = \\mathbf{A} h(t) + \\mathbf{B} x(t), \\quad y(t) = \\mathbf{C} h(t)",
      "p": "Maps 1D continuous driving function $x(t)$ through continuous evolution matrix $\\mathbf{A} \\in \\mathbb{R}^{N \\times N}$ and input matrix $\\mathbf{B}$."
    },
    {
      "h": "Zero-Order Hold (ZOH) Discretisation",
      "tex": "\\bar{\\mathbf{A}} = \\exp(\\Delta \\mathbf{A}), \\quad \\bar{\\mathbf{B}} = (\\Delta \\mathbf{A})^{-1} (\\exp(\\Delta \\mathbf{A}) - \\mathbf{I}) \\cdot \\Delta \\mathbf{B} \\approx \\Delta \\mathbf{B}",
      "p": "Transforms continuous parameters into discrete recurrence matrices using step size parameter $\\Delta$."
    },
    {
      "h": "Selective Input-Dependent Parameterisation (Mamba)",
      "tex": "\\mathbf{B}_t = \\mathbf{W}_B x_t, \\quad \\mathbf{C}_t = \\mathbf{W}_C x_t, \\quad \\Delta_t = \\operatorname{softplus}(\\mathbf{W}_\\Delta x_t + \\mathbf{b}_\\Delta)",
      "p": "Parameters $\\mathbf{B}, \\mathbf{C}, \\Delta$ vary dynamically with input $x_t$, allowing the network to filter out noise and selectively store key information."
    }
  ],
  "code": "import torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\nclass MinimalSSM(nn.Module):\n    \"\"\"Educational demonstration of 1D Selective State-Space recurrence.\"\"\"\n    def __init__(self, d_model: int, d_state: int = 16):\n        super().__init__()\n        self.d_model = d_model\n        self.d_state = d_state\n        \n        # Continuous diagonal A parameter\n        self.A_log = nn.Parameter(torch.log(torch.arange(1, d_state + 1, dtype=torch.float32)))\n        \n        # Linear projections for selective B, C, Delta\n        self.x_proj = nn.Linear(d_model, d_state * 2 + 1, bias=False)\n        self.out_proj = nn.Linear(d_model, d_model)\n\n    def forward(self, x: torch.Tensor):\n        # x shape: [batch, seq_len, d_model]\n        batch, seq_len, _ = x.shape\n        A = -torch.exp(self.A_log)  # [d_state] (enforce stability: negative real values)\n        \n        y_out = []\n        # Sequential inference recurrence: O(1) memory per step!\n        for b in range(batch):\n            h = torch.zeros(self.d_model, self.d_state, device=x.device)\n            y_seq = []\n            for t in range(seq_len):\n                x_t = x[b, t]  # [d_model]\n                proj = self.x_proj(x_t)\n                B_t = proj[:self.d_state]\n                C_t = proj[self.d_state:2*self.d_state]\n                delta_t = F.softplus(proj[-1:])\n                \n                # Discretise: A_bar = exp(delta * A), B_bar = delta * B\n                A_bar = torch.exp(delta_t * A)  # [d_state]\n                B_bar = delta_t * B_t          # [d_state]\n                \n                # Update latent state\n                h = h * A_bar + x_t.unsqueeze(-1) * B_bar\n                # Emit output: y = h * C\n                y_t = torch.sum(h * C_t, dim=-1)  # [d_model]\n                y_seq.append(y_t)\n            y_out.append(torch.stack(y_seq))\n            \n        return self.out_proj(torch.stack(y_out))\n\nssm = MinimalSSM(d_model=32, d_state=8)\ntokens = torch.randn(2, 10, 32)\nout = ssm(tokens)\nprint(\"SSM Processed sequence shape:\", out.shape)\nprint(\"Inference scales O(1) in memory: Zero KV-cache footprint!\")",
  "keyPoints": [
    "Mamba achieves linear $O(L)$ training time and constant $O(1)$ inference memory per step.",
    "Overcomes quadratic $O(L^2)$ attention bottlenecks for long sequence processing.",
    "Selective state spaces make transition parameters input-dependent, unlocking selective memory and forgetting.",
    "Hardware-aware parallel associative scans compute sequential recurrences efficiently in GPU SRAM."
  ],
  "pitfalls": [
    "Loss of global associative recall: While Mamba excels at compression and reasoning, standard SSMs struggle with literal verbatim document retrieval compared to full KV-cache attention.",
    "Sequential Python implementation slowness: Writing sequential loops in PyTorch is extremely slow; Mamba requires custom CUDA kernels with SRAM associative scans for training throughput.",
    "Initialization sensitivity: Initializing matrix $\\mathbf{A}$ randomly causes gradient explosion; $\\mathbf{A}$ must be initialized with HiPPO (High-order Polynomial Projection) theory."
  ],
  "quiz": [
    {
      "q": "What is the primary computational bottleneck of the Transformer self-attention mechanism that State-Space Models (SSMs) solve?",
      "o": [
        "Attention cannot process text tokens",
        "Self-attention scales quadratically $O(L^2)$ in compute and memory with sequence length $L$, making long contexts prohibitive",
        "Transformers cannot run on GPUs",
        "Transformers only support binary inputs"
      ],
      "a": 1,
      "why": "Pairwise dot-product attention computes an $L \\times L$ attention matrix, scaling quadratically $O(L^2)$. SSMs process sequences with linear $O(L)$ complexity."
    },
    {
      "q": "What crucial breakthrough did Mamba introduce over classical LTI (Linear Time-Invariant) State-Space Models like S4?",
      "o": [
        "Mamba removed all matrix multiplications",
        "Selective State Spaces: making parameters $(\\mathbf{B}, \\mathbf{C}, \\Delta)$ dynamic functions of the input token, allowing content-based filtering and selective memory",
        "Mamba replaced neural networks with decision trees",
        "Mamba eliminated backpropagation"
      ],
      "a": 1,
      "why": "Classical S4 used fixed time-invariant matrices, preventing content-dependent memory. Mamba makes matrices input-dependent, enabling selective filtering and forgetting."
    },
    {
      "q": "How does Mamba's inference memory consumption compare to a Transformer with KV-cache during autoregressive generation?",
      "o": [
        "Mamba requires 10x more memory than a Transformer",
        "Mamba maintains a constant-size $O(1)$ hidden state per step, requiring zero growing KV-cache regardless of how many thousands of tokens are generated",
        "Mamba requires storing the full dataset in RAM",
        "Both models consume identical memory"
      ],
      "a": 1,
      "why": "Transformers store keys and values for every past token in a growing KV-cache. Mamba maintains a fixed-size latent state vector, updating it in $O(1)$ constant time."
    }
  ],
  "related": [
    "the-attention-mechanism",
    "recurrent_neural_networks",
    "lstm_networks"
  ],
  "keywords": "mamba, state-space models, ssm, s4, selective state spaces, linear time sequence model, associative scan, hippo, kv-cache"
},
  {
  "id": "normalising-flows",
  "short": "Normalising flows",
  "title": "Normalising Flows: Exact Likelihood Estimation via Invertible Transformations",
  "task": "concepts",
  "level": 3,
  "minutes": 18,
  "noLab": true,
  "usedBy": [],
  "summary": "Evaluating exact probabilities and generating high-fidelity samples using invertible bijectors (RealNVP) and the change-of-variables theorem.",
  "lead": "Generative models generally face a compromise: GANs generate sharp samples but have no tractable likelihood and suffer from mode collapse; VAEs provide tractable lower bounds (ELBO) but generate blurry samples. Normalising Flows achieve both exact analytical probability density evaluation and efficient sampling by transforming simple base distributions (like standard Gaussians) through a sequence of invertible, bijective neural network mappings.",
  "analogy": "Imagine sculpting an intricate vase out of a standard lump of grey potter's clay. Every stretching, rolling, and folding motion of your hands is completely reversible: if you record every pull and push, you can mathematically unfold the vase back into the exact original ball of clay. Calculating the density of clay at any point on the vase simply requires tracking how much your hands stretched or compressed the material during each invertible step.",
  "intuition": [
    "The change-of-variables theorem from calculus states that if $x = f(z)$ where $f$ is an invertible differentiable bijection ($z = f^{-1}(x)$), the probability density function of $x$ is $p_X(x) = p_Z(f^{-1}(x)) \\cdot |\\det J_{f^{-1}}(x)|$.",
    "By composing $K$ invertible transformations $f = f_K \\circ \\dots \\circ f_1$, a simple base density $z_0 \\sim \\mathcal{N}(0, \\mathbf{I})$ can be warped into arbitrarily complex, multimodal distributions $p_X(x)$.",
    "The primary computational challenge is computing the determinant of the $D \\times D$ Jacobian matrix $J_f = \\frac{\\partial f}{\\partial z}$, which in general requires expensive $O(D^3)$ matrix operations.",
    "RealNVP (Dinh et al.) solves this using Affine Coupling Layers: split the vector into two halves $(z_A, z_B)$. Keep $z_A$ unchanged, and transform $z_B$ via $x_B = z_B \\odot \\exp(s(z_A)) + t(z_A)$, where $s$ and $t$ can be arbitrary complex non-invertible neural networks. This forces the Jacobian to be triangular, making its determinant trivially computable in $O(D)$ time as the product of its diagonal elements $\\sum s(z_A)$."
  ],
  "steps": [
    "Select base distribution: Define a tractable prior distribution $p_Z(z)$ (typically standard isotropic Gaussian $\\mathcal{N}(0, \\mathbf{I})$).",
    "Design invertible coupling layer: Split input channels into $z_A$ and $z_B$. Pass $z_A$ through arbitrary deep networks to predict scale $s$ and translation $t$.",
    "Apply affine forward transformation: Compute $x_A = z_A$ and $x_B = z_B \\odot \\exp(s(z_A)) + t(z_A)$.",
    "Compute log-determinant: Sum scaling coefficients $\\sum_i s(z_A)_i$ in linear $O(D)$ time.",
    "Compose multiple layers with permutations: Alternate channel splits or apply invertible $1 \\times 1$ convolutions (Glow) between coupling blocks.",
    "Train via exact negative log-likelihood: Maximise $\\log p_X(x) = \\log p_Z(f^{-1}(x)) + \\sum_{k=1}^K \\log |\\det J_{f_k^{-1}}|$ directly via gradient descent."
  ],
  "math": [
    {
      "h": "Multivariate Change-of-Variables Theorem",
      "tex": "p_X(x) = p_Z(f^{-1}(x)) \\cdot \\left| \\det\\left( \\frac{\\partial f^{-1}(x)}{\\partial x} \\right) \\right| = p_Z(f^{-1}(x)) \\cdot \\left| \\det\\left( \\frac{\\partial f(z)}{\\partial z} \\right) \\right|^{-1}",
      "p": "Calculates the exact density of $x$ by evaluating the base Gaussian density of $f^{-1}(x)$ multiplied by the Jacobian determinant volume correction."
    },
    {
      "h": "RealNVP Affine Coupling Transformation",
      "tex": "\\begin{cases} x_{1:d} = z_{1:d} \\\\ x_{d+1:D} = z_{d+1:D} \\odot \\exp\\left( s(z_{1:d}) \\right) + t(z_{1:d}) \\end{cases}",
      "p": "Transforms second partition $z_{d+1:D}$ conditionally based on arbitrary neural networks $s$ and $t$ evaluating the first partition."
    },
    {
      "h": "Triangular Jacobian Determinant",
      "tex": "J = \\begin{bmatrix} \\mathbf{I}_d & \\mathbf{0} \\\\ \\frac{\\partial x_{d+1:D}}{\\partial z_{1:d}} & \\operatorname{diag}\\left(\\exp(s(z_{1:d}))\\right) \\end{bmatrix} \\implies \\ln |\\det J| = \\sum_{i=1}^{D-d} s(z_{1:d})_i",
      "p": "The Jacobian is block triangular; its determinant equals the product of diagonal entries, reducing computation from $O(D^3)$ to $O(D)$."
    }
  ],
  "code": "import torch\nimport torch.nn as nn\nimport numpy as np\n\nclass RealNVPCouplingLayer(nn.Module):\n    def __init__(self, dim: int, hidden_dim: int = 64):\n        super().__init__()\n        self.d = dim // 2\n        # Scale (s) and translation (t) can be arbitrary deep networks!\n        self.net = nn.Sequential(\n            nn.Linear(self.d, hidden_dim),\n            nn.ReLU(),\n            nn.Linear(hidden_dim, (dim - self.d) * 2)\n        )\n\n    def forward(self, z: torch.Tensor):\n        # z -> x (sampling direction)\n        z_A, z_B = z[:, :self.d], z[:, self.d:]\n        st = self.net(z_A)\n        s, t = st[:, ::2], st[:, 1::2]\n        s = torch.tanh(s)  # Stabilise scaling\n        \n        x_A = z_A\n        x_B = z_B * torch.exp(s) + t\n        x = torch.cat([x_A, x_B], dim=-1)\n        log_det_J = torch.sum(s, dim=-1)\n        return x, log_det_J\n\n    def inverse(self, x: torch.Tensor):\n        # x -> z (density evaluation direction)\n        x_A, x_B = x[:, :self.d], x[:, self.d:]\n        st = self.net(x_A)\n        s, t = st[:, ::2], st[:, 1::2]\n        s = torch.tanh(s)\n        \n        z_A = x_A\n        z_B = (x_B - t) * torch.exp(-s)\n        z = torch.cat([z_A, z_B], dim=-1)\n        log_det_J_inv = -torch.sum(s, dim=-1)\n        return z, log_det_J_inv\n\n# Test bijector invertibility\nlayer = RealNVPCouplingLayer(dim=4)\nz_orig = torch.randn(2, 4)\nx, log_det = layer(z_orig)\nz_rec, _ = layer.inverse(x)\n\nrecon_error = torch.max(torch.abs(z_orig - z_rec)).item()\nprint(f\"Coupling Layer Inversion Error: {recon_error:.2e} (Strictly Invertible!)\")\nprint(f\"Log Jacobian determinant evaluated in O(D) time: {log_det.detach().numpy()}\")",
  "keyPoints": [
    "Normalising flows enable exact analytical log-likelihood calculation and efficient sampling.",
    "Warp simple Gaussian base densities into complex multimodal distributions via invertible bijections.",
    "Affine coupling layers force the Jacobian to be triangular, computing determinants in linear $O(D)$ time.",
    "Scale and translation functions $s$ and $t$ can be arbitrary complex, non-invertible neural networks."
  ],
  "pitfalls": [
    "Dimension preservation restriction: Because bijections require bijective mapping, the latent state $z$ must have the exact same dimensionality as data $x$, causing memory growth for high-resolution images.",
    "Unbounded scaling: If scale function $s(z_A)$ outputs large values, $\\exp(s)$ causes floating point overflow and numerical instability; constrain outputs with `tanh`.",
    "Ignoring channel permutations: Failing to alternate which half of features is transformed leaves half the channels completely unchanged throughout the entire network."
  ],
  "quiz": [
    {
      "q": "What unique advantage do Normalising Flows possess compared to Variational Autoencoders (VAEs) and GANs?",
      "o": [
        "They do not require GPUs for training",
        "They provide both exact analytical log-likelihood computation and efficient sampling via invertible bijections",
        "They only work on discrete text tokens",
        "They eliminate the need for loss functions"
      ],
      "a": 1,
      "why": "GANs lack likelihood evaluation entirely, and VAEs only compute lower bound approximations (ELBO). Normalising Flows compute exact likelihoods via the change-of-variables theorem."
    },
    {
      "q": "How does RealNVP make the calculation of the Jacobian determinant computationally tractable in linear $O(D)$ time?",
      "o": [
        "By assuming all off-diagonal entries are zero",
        "By using affine coupling layers that keep half the vector unchanged, creating a block-triangular Jacobian whose determinant is simply the product of its diagonal elements",
        "By using Monte Carlo sampling to approximate the determinant",
        "By computing the matrix inverse using quantum algorithms"
      ],
      "a": 1,
      "why": "In a triangular matrix, the determinant is the product of the diagonal elements. Affine coupling structures the transformation so the Jacobian is block triangular, evaluating in $O(D)$ steps."
    },
    {
      "q": "In a RealNVP affine coupling layer, do the sub-networks $s(z_A)$ and $t(z_A)$ that compute scale and translation need to be invertible themselves?",
      "o": [
        "Yes, every layer in a normalising flow must be strictly invertible",
        "No, $s$ and $t$ can be arbitrary non-invertible deep neural networks because they only evaluate $z_A$, which is passed through unchanged",
        "They must be linear models with positive weights",
        "They must be decision trees"
      ],
      "a": 1,
      "why": "Because $z_A = x_A$ is preserved unchanged, inversion directly computes $s(x_A)$ and $t(x_A)$ in the reverse direction. Thus $s$ and $t$ can be arbitrary complex networks."
    }
  ],
  "related": [
    "variational-autoencoders",
    "autoencoders",
    "diffusion-models"
  ],
  "keywords": "normalising flows, realnvp, change of variables, bijector, exact likelihood, coupling layers, jacobian determinant, generative models"
},
  {
    id: 'contrastive-learning-simclr-and-infonce',
    short: 'SimCLR and InfoNCE',
    title: 'Contrastive Learning: SimCLR and InfoNCE',
    task: 'concepts',
    module: 'Representation learning',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Extracting rich visual representations without human annotations by pulling augmented views of the same image together while repelling distinct images in embedding space.`,
    lead: r`Supervised visual models require millions of manually annotated labels, which are costly, labour-intensive, and prone to annotator bias. Contrastive self-supervised learning—epitomised by SimCLR (Chen et al. 2020) and the InfoNCE loss—trains neural backbones to learn invariant semantic representations by pulling differently augmented views of the same image together while pushing representations of different images apart.`,
    intuition: [
      r`If you show a child a photograph of a dog, and then show them a cropped, colour-distorted version of that same dog, they instantly recognize it as the same animal. If you then show them a photograph of a bicycle, they immediately recognize it as distinct. Human visual perception relies on learning representations that remain invariant to trivial changes in viewpoint, lighting, and framing while remaining sensitive to genuine semantic differences.`,
      r`**Contrastive Learning** operationalises this principle without any human labels:
1. Sample an unlabelled mini-batch of $N$ images.
2. For each image, apply two stochastic data augmentations (such as random cropping, colour jittering, and Gaussian blur) to create two distinct views. These two views form a **positive pair**.
3. All other $2(N-1)$ augmented images in the mini-batch serve as **negative pairs**.
4. Pass both views through an encoder backbone (such as a ResNet) to produce representation $h$, and then through a small non-linear projection head (a 2-layer MLP) to produce latent vector $z$.
5. The **InfoNCE loss** (Information Noise-Contrastive Estimation) treats the positive view as the target class in a multi-class softmax classification task, pulling positive views together while driving negative views apart.`,
      r`A critical empirical discovery in SimCLR was the role of the non-linear projection head $g(h) = z$. Because the contrastive objective forces $z$ to be completely invariant to transformations, $z$ actively discards information like orientation, cropping bounds, and colour palette. However, downstream tasks often benefit from knowing colour or spatial layout! By throwing away the projection head $g$ after pre-training and using the intermediate representation $h$, practitioners retain richer, more generalisable features for linear probing and transfer learning.`,
    ],
    analogy: r`Like training a facial recognition algorithm with identical twins in different outfits: the model learns that photos of the same twin under different lighting and angles must map to the same identity, while photos of different people must never overlap.`,
    steps: [
      r`Generate stochastic augmented pairs: for each image $x_i$ in mini-batch of size $N$, apply two distinct data augmentations to produce $2N$ views.`,
      r`Extract representations with an encoder: pass each view through backbone network $f(\cdot)$ to extract representation vectors $h_i = f(\tilde{x}_i)$.`,
      r`Map through a projection head: project representations into lower-dimensional space using 2-layer MLP $z_i = g(h_i)$ and $L_2$-normalise each vector ($\lVert z_i \rVert_2 = 1$).`,
      r`Calculate pairwise cosine similarities: compute scaled dot-product matrix $S_{i,j} = z_i^T z_j / \tau$, where $\tau$ is the temperature hyperparameter.`,
      r`Evaluate InfoNCE contrastive loss: for each anchor, compute cross-entropy classifying its positive partner against all $2(N-1)$ negative candidates in the batch.`,
      r`Discard projection head for downstream tasks: detach $g(\cdot)$ and use backbone representations $h$ for downstream linear classification or fine-tuning.`,
    ],
    math: [
      {
        h: 'The InfoNCE loss (NT-Xent in SimCLR)',
        tex: r`$$\ell_{i,j} = -\log \frac{\exp\big(\operatorname{sim}(z_i, z_j) / \tau\big)}{\sum_{k=1}^{2N} \mathbb{I}_{[k \ne i]} \exp\big(\operatorname{sim}(z_i, z_k) / \tau\big)}, \qquad \operatorname{sim}(u, v) = \frac{u^T v}{\lVert u \rVert_2 \lVert v \rVert_2}$$`,
        p: r`$z_i$ and $z_j$ are $L_2$-normalised latent projections of positive views of the same image, $\tau$ is the temperature parameter (typically $0.07$ to $0.1$), and $2N$ is the total number of augmented views in the batch. The loss is symmetric across both views in each pair.`,
      },
      {
        h: 'Mutual information lower bound connection',
        tex: r`$$I(X_1; X_2) \ge \log(K) - \mathcal{L}_{\text{InfoNCE}}, \qquad K = 2N - 1$$`,
        p: r`$K$ is the number of negative samples. Minimising InfoNCE loss directly maximises a lower bound on the mutual information between the representations of two views of the same data sample.`,
      },
    ],
    keyPoints: [
      r`SimCLR learns representations by maximising agreement between differently augmented views of the same image while minimising agreement with negative batch samples.`,
      r`The temperature parameter $\tau$ modulates penalty sharpness: smaller $\tau$ penalises hard negatives with high cosine similarity more aggressively.`,
      r`Discarding the projection head $g(h)$ after pre-training preserves rich semantic features in $h$ that would otherwise be discarded due to forced augmentation invariance.`,
    ],
    pitfalls: [
      r`Using small mini-batch sizes: contrastive learning relies on large numbers of negative pairs to prevent representation collapse; SimCLR requires batch sizes of 2,048 to 4,096 (or memory queues like MoCo).`,
      r`Weak data augmentations: without aggressive colour jittering, the network cheats by simply matching colour histograms between crops rather than learning shape and structure.`,
      r`Deploying projection vectors $z$ instead of representations $h$ for downstream tasks, which reduces transfer accuracy because $z$ has stripped away useful task-specific details.`,
    ],
    code: r`import numpy as np

# Simulate InfoNCE loss on 2 positive pairs (4 views total), embedding dimension D = 3
np.random.seed(42)
# Pair 0: views 0 & 1 (similar); Pair 1: views 2 & 3 (similar)
z = np.array([
    [1.0, 0.1, 0.0],
    [0.95, 0.15, 0.0],
    [0.0, 0.9, 0.1],
    [0.0, 0.95, 0.15]
])

# L2-normalise embeddings
z = z / np.linalg.norm(z, axis=1, keepdims=True)

tau = 0.1  # Temperature parameter
sim_matrix = (z @ z.T) / tau
np.fill_diagonal(sim_matrix, -1e9)  # Mask self-similarity

# Compute InfoNCE loss for anchor 0 (positive partner is view 1)
exp_sim = np.exp(sim_matrix)
loss_anchor_0 = -float(np.log(exp_sim[0, 1] / np.sum(exp_sim[0])))

pos_sim = float(np.dot(z[0], z[1]))
neg_sim = float(np.dot(z[0], z[2]))

print(f"Cosine similarity - positive pair (0, 1): {pos_sim:.4f}")
print(f"Cosine similarity - negative pair (0, 2): {neg_sim:.4f}")
print(f"InfoNCE contrastive loss for anchor 0:   {loss_anchor_0:.4f}")`,
    quiz: [
      {
        q: r`Why does SimCLR discard the projection head $g(h)$ and use the pre-projection representation $h$ for downstream evaluation?`,
        o: [
          r`Because the projection head has too many parameters to run on GPU hardware`,
          r`Because the contrastive loss forces $z$ to be invariant to data augmentations, discarding information like colour and pose that downstream tasks need`,
          r`Because $h$ contains non-normalised probabilities`,
          r`Because the projection head weights are erased after pre-training`,
        ],
        a: 1,
        why: r`Chen et al. showed that forcing representations to be fully invariant to augmentations removes fine-grained spatial and chromatic information from $z$; intermediate representation $h$ retains this information, yielding higher linear probe accuracy.`,
      },
      {
        q: r`What role does the temperature hyperparameter $\tau$ play in the InfoNCE loss?`,
        o: [
          r`It scales the learning rate of the optimiser`,
          r`It controls the penalty sensitivity to hard negative examples: smaller $\tau$ exponentially amplifies penalties for negatives with high cosine similarity`,
          r`It limits the maximum number of layers in the encoder`,
          r`It converts negative cosine similarities into positive numbers`,
        ],
        a: 1,
        why: r`Because similarities are divided by $\tau$ inside the exponential, a small $\tau$ creates sharp probability distributions, heavily penalising any negative sample that lies close to the anchor.`,
      },
      {
        q: r`Why is aggressive colour jittering essential when creating augmented views for contrastive learning?`,
        o: [
          r`To make images look aesthetically pleasing`,
          r`Because without colour distortion, the model exploits an unintended shortcut: matching global colour histograms between crops rather than learning semantic shapes`,
          r`To convert RGB images into greyscale tensors`,
          r`To satisfy requirements of the InfoNCE mutual information bound`,
        ],
        a: 1,
        why: r`If two random crops come from the same photo, they share identical colour palettes. Without colour jittering, the network trivially matches colour distributions without learning object semantics.`,
      },
      {
        q: r`Why does standard SimCLR require exceptionally large batch sizes (e.g. 2,048 to 4,096)?`,
        o: [
          r`Because larger batch sizes provide a rich pool of negative candidates per positive pair, preventing representation collapse`,
          r`Because small batches cannot be processed by GPUs`,
          r`Because cosine similarity cannot be computed with fewer than 1,000 samples`,
          r`Because large batches automatically eliminate the need for data augmentations`,
        ],
        a: 0,
        why: r`Contrastive learning relies on negative examples to push the representation space outwards. With too few negatives, the encoder can collapse representations into a narrow subspace.`,
      },
    ],
    usedBy: [],
    prereq: ['transfer-learning-and-fine-tuning', 'the-pytorch-training-loop', 'residual-networks-and-skip-connections'],
    related: ['clip-and-multimodal-embeddings', 'the-attention-mechanism', 'autoencoders'],
    keywords: 'contrastive learning simclr infonce self supervised representation learning nt-xent temperature projection head data augmentation mutual information',
  },
  {
    id: 'clip-and-multimodal-embeddings',
    short: 'CLIP & multimodal embeddings',
    title: 'CLIP and Multimodal Embeddings',
    task: 'concepts',
    module: 'Representation learning',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Projecting visual images and natural language text into a shared embedding space. Contrastive language-image pre-training unlocks zero-shot classification and open-vocabulary understanding.`,
    lead: r`Classical computer vision models are constrained to a fixed, closed set of pre-determined target categories, requiring costly retraining whenever a new concept is introduced. CLIP (Contrastive Language-Image Pre-training, Radford et al. 2021) overturned this paradigm by training image and text encoders jointly on 400 million internet image-caption pairs, projecting visual and linguistic tokens into a shared semantic space that enables zero-shot classification on arbitrary natural language prompts.`,
    intuition: [
      r`Imagine two independent experts: one inspects photographs (Image Encoder), and the other reads descriptive text captions (Text Encoder). Both experts are tasked with translating their respective inputs into a universal conceptual coordinate system: a 512-dimensional embedding vector on the unit hypersphere.`,
      r`If the first expert is shown a photograph of a red panda munching on bamboo, and the second reads the caption "A fluffy red panda eating fresh green leaves", their output vectors should point in virtually the exact same direction (exhibiting high cosine similarity near 1.0). Conversely, if the second expert reads "A container ship docked in a busy industrial port", the two vectors should be orthogonal (cosine similarity near 0.0).`,
      r`**The Dual-Encoder Pipeline**:
- Take a mini-batch of $N$ paired images and captions $(I_1, T_1), \dots, (I_N, T_N)$.
- Pass images through a vision backbone (such as a ResNet or Vision Transformer) and text through a Transformer language model, $L_2$-normalising both output vectors.
- Compute the $N \times N$ cosine similarity matrix $S_{i,j} = v_i^T u_j \cdot e^\tau$.
- The $N$ diagonal elements represent matched ground-truth pairs; the $N^2 - N$ off-diagonal elements represent mismatched negative pairings.
- A symmetric cross-entropy loss optimises both encoders simultaneously: rows classify the correct text for each image, and columns classify the correct image for each caption.`,
      r`**Zero-Shot Transfer**: How do you classify a new dataset (like CIFAR-10) without training a single new parameter? You turn class labels into full prompt sentences: "A photo of a {dog}", "A photo of a {cat}", "A photo of a {truck}". Pass all 10 candidate prompts through the text encoder to obtain 10 reference target vectors. Pass an unlabelled image through the image encoder. The predicted class is simply the prompt whose text embedding achieves the highest cosine similarity with the image embedding!`,
    ],
    analogy: r`Like building a universal bilingual dictionary: photographs of objects and their textual descriptions are catalogued under the exact same conceptual library reference number.`,
    steps: [
      r`Assemble large-scale paired multimodal data: collect paired images and raw descriptive captions $(I_i, T_i)$ from web-scale sources.`,
      r`Encode across separate modality backbones: compute image feature vector $v_i = f_{\text{img}}(I_i) \in \mathbb{R}^D$ and text feature vector $u_i = f_{\text{txt}}(T_i) \in \mathbb{R}^D$.`,
      r`Apply $L_2$ normalisation: project both embeddings onto the unit hypersphere ($\lVert v_i \rVert_2 = 1, \lVert u_i \rVert_2 = 1$).`,
      r`Compute pairwise multimodal affinity matrix: calculate scaled dot-product matrix $S = (V U^T) \cdot \exp(\tau)$, where $\tau$ is a learnable log-temperature parameter.`,
      r`Minimise symmetric contrastive cross-entropy: compute cross-entropy along the image dimension (rows) and text dimension (columns), averaging both losses.`,
      r`Execute zero-shot inference: synthesize prompt embeddings for all target candidate classes, evaluate the unlabelled image vector, and select the class with maximal cosine similarity.`,
    ],
    math: [
      {
        h: 'Symmetric multimodal contrastive loss',
        tex: r`$$\mathcal{L}_{\text{CLIP}} = \frac{1}{2}\left( \mathcal{L}_{\text{img}\to\text{txt}} + \mathcal{L}_{\text{txt}\to\text{img}} \right)$$`,
        p: r`The global loss is the unweighted average of two symmetric cross-entropy terms: one classifying the correct caption for each image, and one classifying the correct image for each caption across the $N \times N$ batch matrix.`,
      },
      {
        h: 'Directional cross-entropy formulations',
        tex: r`$$\mathcal{L}_{\text{img}\to\text{txt}} = -\frac{1}{N}\sum_{i=1}^N \log \frac{\exp(v_i^T u_i \cdot e^\tau)}{\sum_{j=1}^N \exp(v_i^T u_j \cdot e^\tau)}, \quad \mathcal{L}_{\text{txt}\to\text{img}} = -\frac{1}{N}\sum_{j=1}^N \log \frac{\exp(v_j^T u_j \cdot e^\tau)}{\sum_{i=1}^N \exp(v_i^T u_j \cdot e^\tau)}$$`,
        p: r`$v_i$ is the $L_2$-normalised image representation, $u_j$ is the $L_2$-normalised text representation, and $e^\tau$ is the learned temperature scale. The diagonal elements $v_i^T u_i$ are maximised against all off-diagonal negative candidates.`,
      },
      {
        h: 'Zero-shot classification probability',
        tex: r`$$p(y = c | I) = \frac{\exp\big(v_I^T u_c \cdot e^\tau\big)}{\sum_{k=1}^C \exp\big(v_I^T u_k \cdot e^\tau\big)}$$`,
        p: r`Candidate class names $c \in \{1, \dots, C\}$ are wrapped in prompt templates ("A photo of a {class}") and encoded into text vectors $u_c$. Softmax over scaled cosine similarities produces zero-shot posterior class probabilities without task-specific training.`,
      },
    ],
    keyPoints: [
      r`CLIP projects visual images and descriptive text into a shared, metric-aligned embedding space where cosine distance reflects semantic affinity.`,
      r`Zero-shot classification operates by treating candidate labels as natural language prompts, removing the need for task-specific classification heads.`,
      r`Prompt engineering (using contextual templates like "A photo of a {label}, a type of pet") substantially improves zero-shot accuracy compared to bare class names.`,
    ],
    pitfalls: [
      r`Sensitivity to prompt formulation: evaluating bare single-word labels often underperforms contextual templates ("a photo of a {label}") by 5% to 10% in zero-shot accuracy.`,
      r`Fine-grained spatial or abstract visual tasks: CLIP struggles with counting objects (e.g. "three apples vs four apples"), depth estimation, or reading small text in images.`,
      r`Polysemous label ambiguity: homonyms (such as "crane" the bird vs "crane" the construction equipment) require clarifying context in prompt templates to avoid misclassification.`,
    ],
    code: r`import numpy as np

# Simulate zero-shot multimodal classification with CLIP
np.random.seed(42)
D = 4  # Embedding dimensionality

# 3 synthetic candidate text embeddings: Dog, Car, House
text_prompts = ["A photo of a dog", "A photo of a car", "A photo of a house"]
U = np.array([
    [0.9, 0.2, 0.0, 0.1],   # Dog
    [0.1, 0.9, 0.2, 0.0],   # Car
    [0.0, 0.1, 0.9, 0.3]    # House
])
U = U / np.linalg.norm(U, axis=1, keepdims=True)

# Query image embedding (synthetically generated to resemble a dog)
V_img = np.array([[0.85, 0.25, 0.05, 0.1]])
V_img = V_img / np.linalg.norm(V_img, axis=1, keepdims=True)

# Evaluate cosine similarities scaled by temperature scale exp(tau) = 5.0
scale = 5.0
logits = (V_img @ U.T) * scale
probs = np.exp(logits[0]) / np.sum(np.exp(logits[0]))
pred_idx = int(np.argmax(probs))

print(f"Zero-shot classification prediction: '{text_prompts[pred_idx]}'")
print(f"Class probabilities: Dog={probs[0]*100:.1f}%, Car={probs[1]*100:.1f}%, House={probs[2]*100:.1f}%")`,
    quiz: [
      {
        q: r`How does CLIP perform zero-shot image classification without fine-tuning on downstream datasets?`,
        o: [
          r`By generating a caption with an autoregressive language model and parsing the output`,
          r`By embedding candidate class names as natural language prompt sentences and selecting the class whose text embedding has the highest cosine similarity with the query image embedding`,
          r`By retraining the image encoder using k-nearest neighbours on test images`,
          r`By computing the pixel-level Mean Squared Error between the test image and training templates`,
        ],
        a: 1,
        why: r`Because CLIP aligns vision and language in a shared metric space, candidate classes can be converted to text embeddings ($u_c$) and matched directly against the image embedding ($v_I$) via cosine similarity.`,
      },
      {
        q: r`Why does prompt engineering (e.g. using "A photo of a {label}" instead of just "{label}") improve CLIP's zero-shot performance?`,
        o: [
          r`Because single words cannot be tokenised by byte-pair encoding`,
          r`Because the model was pre-trained on full natural language captions; contextual prompt templates align test inputs with the pre-training text distribution and resolve polysemy`,
          r`Because longer prompts reduce the dimensionality of the text embedding`,
          r`Because prompt templates disable dropout in the text encoder`,
        ],
        a: 1,
        why: r`Web captions are full descriptive sentences rather than isolated words. A prompt template like "A photo of a dog" provides context and matches the natural language statistics of web pre-training data.`,
      },
      {
        q: r`What loss function is used to train CLIP's dual encoders?`,
        o: [
          r`Mean Squared Error between image pixels and text embeddings`,
          r`A symmetric contrastive cross-entropy loss that maximises diagonal image-text cosine similarities while minimising off-diagonal pairings across the batch`,
          r`Wasserstein adversarial loss with a gradient penalty`,
          r`Reinforcement learning with human feedback (RLHF)`,
        ],
        a: 1,
        why: r`CLIP evaluates cross-entropy in two directions: classifying the matching caption among batch alternatives for each image, and classifying the matching image for each caption.`,
      },
      {
        q: r`On which of the following tasks does standard CLIP typically struggle without task-specific fine-tuning?`,
        o: [
          r`Broad zero-shot object classification on natural photographs`,
          r`Visual tasks requiring precise spatial counting or geometric depth estimation`,
          r`Matching natural language captions to relevant photos`,
          r`Open-vocabulary visual search`,
        ],
        a: 1,
        why: r`Dual-encoder contrastive training captures global semantic correspondence effectively, but lacks fine-grained spatial and geometric mechanisms required for counting objects or estimating metric depth.`,
      },
    ],
    usedBy: [],
    prereq: ['contrastive-learning-simclr-and-infonce', 'the-attention-mechanism', 'transfer-learning-and-fine-tuning'],
    related: ['diffusion-models', 'autoencoders', 'residual-networks-and-skip-connections'],
    keywords: 'clip multimodal embeddings zero shot classification contrastive learning text encoder image encoder prompt engineering radford openai',
  },
  {
  "id": "self-supervised-learning-byol-dino-mae",
  "short": "SSL: BYOL, DINO & MAE",
  "title": "Modern Self-Supervised Learning: BYOL, DINO Self-Distillation, and Masked Autoencoders (MAE)",
  "task": "concepts",
  "level": 3,
  "minutes": 18,
  "noLab": true,
  "usedBy": [],
  "summary": "Learning visual representations without negative pairs or human labels using bootstrap non-contrastive dynamics (BYOL), vision transformer self-distillation (DINO), and masked patch reconstruction (MAE).",
  "lead": "Supervised deep learning depends on millions of costly, biased human annotations. Early contrastive self-supervised methods (SimCLR) eliminated human labels but required massive batch sizes and carefully engineered negative pairs to prevent representation collapse. Modern self-supervised learning (SSL) transcends contrastive pairs: BYOL proves negatives are unnecessary, DINO learns emergent semantic segmentation, and Masked Autoencoders (MAE) reconstruct masked patches directly.",
  "analogy": "Imagine learning to appreciate art. Instead of having a curator hand you flashcards stating \"this is a Monet\" or comparing two random paintings to explain why they differ, you either study two distorted photographs of the same cathedral and learn what makes the scene invariant (BYOL/DINO), or look at a jigsaw puzzle where 75% of the pieces have been removed and learn to paint in the missing details based on deep structural context (MAE).",
  "intuition": [
    "Self-supervised learning aims to extract general-purpose semantic feature representations from unlabelled data that transfer effectively to downstream tasks with minimal fine-tuning.",
    "BYOL (Bootstrap Your Own Latent; Grill et al.) demonstrated that negative pairs are completely optional. It uses an Online network and a Target network. The online network predicts the target network's representation of an augmented view. An asymmetric architecture (an extra predictor MLP on the online branch) combined with an Exponential Moving Average (EMA) momentum target update mathematically prevents representation collapse to constant vectors.",
    "DINO (Self-distillation with no labels; Caron et al.) applies this paradigm to Vision Transformers (ViTs). Using centreing and sharpening operations on the teacher output, DINO avoids collapse while developing striking emergent properties: its self-attention maps naturally segment foreground objects from background clutter without any pixel-level supervision.",
    "Masked Autoencoders (MAE; He et al.) introduce masked visual modelling: masking 75%–80% of image patches and feeding only the 20% visible patches through a deep ViT encoder. A lightweight shallow decoder then reconstructs the missing pixel patches. Because pixel reconstruction forces the model to understand global scene geometry, MAE scales visual pretraining to massive models with extreme compute efficiency."
  ],
  "steps": [
    "Select SSL paradigm: Choose non-contrastive invariance (BYOL/DINO) for classification/feature extraction or generative reconstruction (MAE) for scalable pretraining.",
    "Generate multi-crop augmentations: In DINO/BYOL, generate two global views (high resolution) and multiple local views (low resolution) per image.",
    "Mask patch tokens (MAE): Split image into $16 \\times 16$ non-overlapping patches, randomly mask 75% of patches, and feed strictly the visible 25% tokens into the encoder.",
    "Asymmetric architecture design: In BYOL/DINO, route one view through the online/student network and another through the EMA momentum teacher network.",
    "Apply anti-collapse mechanisms: Apply centreing (subtracting rolling mean) and sharpening (low temperature) to teacher probabilities in DINO; use EMA and online predictor in BYOL.",
    "Update parameters: Backpropagate loss through the online/student network; update target/teacher weights using EMA momentum $\\theta_{\\mathrm{target}} \\leftarrow \\tau \\theta_{\\mathrm{target}} + (1 - \\tau) \\theta_{\\mathrm{online}}$."
  ],
  "math": [
    {
      "h": "BYOL Mean Squared Error Regression Loss",
      "tex": "\\mathcal{L}_{\\mathrm{byol}} = 2 - 2 \\cdot \\frac{\\langle q_\\theta(z_\\theta), \\; z'_\\xi \\rangle}{\\|q_\\theta(z_\\theta)\\|_2 \\; \\|z'_\\xi\\|_2}, \\quad z'_\\xi = f_\\xi(v')",
      "p": "Minimises the normalised Euclidean distance between the online network prediction $q_\\theta(z_\\theta)$ and the target network projection $z'_\\xi$."
    },
    {
      "h": "Exponential Moving Average (EMA) Target Dynamics",
      "tex": "\\xi_{t+1} = \\tau \\xi_t + (1 - \\tau) \\theta_t, \\quad \\tau \\in [0.99, \\; 0.999]",
      "p": "The target parameters $\\xi$ smoothly track the online parameters $\\theta$ via momentum coefficient $\\tau$, preventing collapse by keeping targets slowly evolving."
    },
    {
      "h": "MAE Masked Pixel Reconstruction Objective",
      "tex": "\\mathcal{L}_{\\mathrm{mae}} = \\frac{1}{|\\mathcal{M}|} \\sum_{i \\in \\mathcal{M}} \\| p_i - \\hat{p}_i \\|^2",
      "p": "Computes Mean Squared Error strictly over masked patch set $\\mathcal{M}$, reconstructing normalised raw pixel values."
    }
  ],
  "code": "import torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\nclass MiniBYOL(nn.Module):\n    def __init__(self, backbone: nn.Module, dim: int = 128, momentum: float = 0.99):\n        super().__init__()\n        # Online network\n        self.online_encoder = backbone\n        self.online_projector = nn.Linear(dim, dim)\n        self.online_predictor = nn.Linear(dim, dim)  # Asymmetric predictor prevents collapse!\n        \n        # Target network (EMA copy)\n        import copy\n        self.target_encoder = copy.deepcopy(backbone)\n        self.target_projector = copy.deepcopy(self.online_projector)\n        self.momentum = momentum\n        \n        # Freeze target network gradients\n        for p in self.target_encoder.parameters():\n            p.requires_grad = False\n        for p in self.target_projector.parameters():\n            p.requires_grad = False\n\n    @torch.no_grad()\n    def update_target(self):\n        \"\"\"EMA momentum update of target network parameters.\"\"\"\n        for op, tp in zip(self.online_encoder.parameters(), self.target_encoder.parameters()):\n            tp.data = self.momentum * tp.data + (1.0 - self.momentum) * op.data\n        for op, tp in zip(self.online_projector.parameters(), self.target_projector.parameters()):\n            tp.data = self.momentum * tp.data + (1.0 - self.momentum) * op.data\n\n    def forward(self, v1: torch.Tensor, v2: torch.Tensor):\n        # Online forward pass on view 1\n        z1 = self.online_projector(self.online_encoder(v1))\n        p1 = self.online_predictor(z1)\n        \n        # Target forward pass on view 2 (no gradients)\n        with torch.no_grad():\n            z2_target = self.target_projector(self.target_encoder(v2))\n            \n        # Cosine similarity loss\n        p1_norm = F.normalise(p1, dim=-1)\n        z2_norm = F.normalise(z2_target, dim=-1)\n        loss = 2.0 - 2.0 * (p1_norm * z2_norm).sum(dim=-1).mean()\n        return loss\n\n# Test toy BYOL module\nencoder = nn.Sequential(nn.Linear(32, 64), nn.ReLU(), nn.Linear(64, 128))\nbyol = MiniBYOL(encoder, dim=128)\nv1, v2 = torch.randn(8, 32), torch.randn(8, 32)\nloss = byol(v1, v2)\nbyol.update_target()\nprint(\"BYOL Non-contrastive loss:\", round(loss.item(), 4))\nprint(\"Negative pairs needed? Exactly 0!\")",
  "keyPoints": [
    "Modern SSL eliminates the need for expensive human labels and complex negative pair mining.",
    "BYOL avoids representation collapse using asymmetric online predictors and EMA momentum target encoders.",
    "DINO self-distillation on Vision Transformers produces emergent semantic object segmentation in attention maps.",
    "MAE masks 75% of visual patches and reconstructs pixels, scaling visual pretraining with high compute efficiency."
  ],
  "pitfalls": [
    "Representation collapse in non-contrastive models: Removing the online predictor or backpropagating through the target network causes all embeddings to collapse to identical zero vectors within 10 iterations.",
    "Low masking ratios in MAE: Masking only 15%–20% in vision (like BERT in NLP) allows the model to interpolate from adjacent border pixels without learning deep scene semantics; 75%–80% masking is required.",
    "Ignoring normalisation in MAE pixel targets: Reconstructing raw unnormalized pixels causes models to focus on high-frequency noise; normalising each patch by its local mean and standard deviation boosts downstream transfer."
  ],
  "quiz": [
    {
      "q": "How does BYOL prevent \"representation collapse\" (where the model outputs constant vectors for all images) without using negative pairs?",
      "o": [
        "By using L1 weight penalties on the output layer",
        "Through an asymmetric architecture (adding an extra predictor MLP on the online branch) and updating the target network slowly via Exponential Moving Average (EMA)",
        "By forcing the learning rate to zero",
        "By shuffling image channels randomly"
      ],
      "a": 1,
      "why": "The asymmetric predictor combined with slow EMA momentum updates creates non-equilibrium dynamics that mathematically prevent the trivial constant solution from being a stable fixed point."
    },
    {
      "q": "Why does Masked Autoencoders (MAE) mask an extremely high percentage (75%–80%) of image patches compared to BERT's 15% token masking?",
      "o": [
        "Because GPUs cannot compute attention on more than 20 patches",
        "Images contain heavy spatial redundancy; a low masking ratio allows the model to easily interpolate missing pixels from immediate neighbours without learning high-level semantic abstractions",
        "Because 80% is the golden ratio in mathematics",
        "To reduce image file size on disk"
      ],
      "a": 1,
      "why": "Visual pixels exhibit high local correlation. Removing 75% of patches removes trivial local interpolation, forcing the network to understand high-level semantics to reconstruct the image."
    },
    {
      "q": "What striking emergent property is observed in Vision Transformers trained with DINO self-distillation?",
      "o": [
        "The model automatically learns to generate human voice audio",
        "The self-attention maps of the last layers naturally segment distinct foreground objects and semantic parts without any pixel-level ground truth masks",
        "The model converges in a single training epoch",
        "All attention weights become uniform numbers"
      ],
      "a": 1,
      "why": "DINO's self-distillation dynamics encourage ViT attention heads to automatically isolate foreground objects and semantic boundaries from background pixels without supervision."
    }
  ],
  "related": [
    "contrastive-learning-simclr-and-infonce",
    "clip-and-multimodal-embeddings",
    "autoencoders"
  ],
  "keywords": "self-supervised learning, byol, dino, mae, masked autoencoders, representation collapse, vision transformer, self-distillation, momentum encoder"
},
  {
  "id": "metric-learning-and-triplet-loss",
  "short": "Metric learning & triplet loss",
  "title": "Deep Metric Learning: Triplet Loss, Siamese Networks, and Online Semi-Hard Mining",
  "task": "concepts",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "usedBy": [],
  "summary": "Learning semantic embedding spaces where Euclidean distance mirrors similarity using Siamese networks, contrastive loss, and semi-hard triplet mining.",
  "lead": "Standard classification models assign inputs to a fixed set of $C$ classes: adding a new class (e.g. enrolling a new employee into a face recognition security system) requires retraining the entire network. Deep Metric Learning directly learns a distance metric: mapping complex inputs (faces, product images, audio snippets) into a continuous embedding space where similar instances are close together and dissimilar instances are far apart.",
  "analogy": "Imagine a passport border control officer. The officer does not have an internal database memorizing the names of all 8 billion people on Earth (a giant softmax classifier). Instead, the officer looks at your passport photograph and looks at your physical face in person, comparing visual geometric distances to determine if you are the same person or an imposter.",
  "intuition": [
    "In deep metric learning, a neural network $f_\\theta(x)$ maps an input $x$ to a unit-norm embedding vector on a hypersphere $\\|f(x)\\|_2 = 1$. The semantic distance between two items is measured directly by Euclidean distance $d(u, v) = \\|f(u) - f(v)\\|_2$.",
    "Siamese networks process pairs of items $(x_1, x_2)$ through identical shared-weight neural backbones, evaluated using Contrastive Loss which pulls positive pairs together and pushes negative pairs apart beyond a margin $m$.",
    "Triplet Loss (FaceNet; Schroff et al.) evaluates triplets: an Anchor ($a$), a Positive from the same class ($p$), and a Negative from a different class ($n$). The objective enforces: $d(a, p)^2 + \\alpha \\le d(a, n)^2$, ensuring the negative is at least margin $\\alpha$ further from the anchor than the positive.",
    "The critical bottleneck in triplet training is mining informative triplets. Most random triplets are \"Easy Negatives\" ($d(a, n) \\gg d(a, p) + \\alpha$), which produce zero loss and zero gradients. Training on \"Hard Negatives\" ($d(a, n) < d(a, p)$) often causes gradient collapse. The optimal regime is Semi-Hard Negative Mining: selecting negatives that are farther than the positive but still within the margin boundary."
  ],
  "steps": [
    "Structure balanced minibatches: Sample $P$ classes with $K$ instances per class (e.g. $P=16, K=4$; batch size 64) to ensure abundant positive and negative pairs within every batch.",
    "Forward pass and L2 normalisation: Pass all batch images through shared backbone and project onto the unit hypersphere ($L_2$ normalisation).",
    "Compute pairwise distance matrix: Vectorise all-to-all Euclidean distances between batch embeddings in a single GPU matrix operation.",
    "Execute online semi-hard triplet mining: For each anchor-positive pair, identify all negatives satisfying $d(a, p) < d(a, n) < d(a, p) + \\alpha$.",
    "Compute margin triplet loss: Evaluate hinge loss on mined semi-hard triplets and backpropagate gradients.",
    "Inference via nearest neighbour: Index enrolled embeddings in a fast vector search database (FAISS) and classify queries via cosine distance."
  ],
  "math": [
    {
      "h": "Triplet Margin Ranking Objective",
      "tex": "\\mathcal{L}_{\\mathrm{triplet}}(a, p, n) = \\max\\left( 0, \\; \\|f(a) - f(p)\\|_2^2 - \\|f(a) - f(n)\\|_2^2 + \\alpha \\right)",
      "p": "Enforces that anchor-negative squared distance exceeds anchor-positive squared distance by at least margin $\\alpha$."
    },
    {
      "h": "Semi-Hard Negative Condition",
      "tex": "\\|f(a) - f(p)\\|_2^2 < \\|f(a) - f(n)\\|_2^2 < \\|f(a) - f(p)\\|_2^2 + \\alpha",
      "p": "Semi-hard negatives yield positive loss and non-zero gradients without being so extremely hard that they destabilise early training."
    },
    {
      "h": "Hypersphere Embedding Unit Norm Constraint",
      "tex": "\\hat{z} = \\frac{f_\\theta(x)}{\\|f_\\theta(x)\\|_2} \\implies \\|\\hat{z}\\|_2 = 1, \\quad \\|u - v\\|_2^2 = 2 - 2\\cos(u, v)",
      "p": "Normalising embeddings to unit length makes squared Euclidean distance strictly equivalent to cosine distance."
    }
  ],
  "code": "import torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\nclass TripletMarginLossModule(nn.Module):\n    def __init__(self, margin: float = 0.5):\n        super().__init__()\n        self.margin = margin\n\n    def forward(self, anchor: torch.Tensor, positive: torch.Tensor, negative: torch.Tensor) -> torch.Tensor:\n        # 1. Project onto unit hypersphere\n        a = F.normalise(anchor, p=2, dim=-1)\n        p = F.normalise(positive, p=2, dim=-1)\n        n = F.normalise(negative, p=2, dim=-1)\n        \n        # 2. Compute squared Euclidean distances\n        d_ap = torch.sum((a - p) ** 2, dim=-1)\n        d_an = torch.sum((a - n) ** 2, dim=-1)\n        \n        # 3. Triplet loss with margin\n        losses = F.relu(d_ap - d_an + self.margin)\n        return losses.mean()\n\n# Test triplet loss evaluation\nloss_fn = TripletMarginLossModule(margin=0.4)\n\n# Anchor, matching Positive, and non-matching Negative\ntorch.manual_seed(42)\nanchor = torch.randn(4, 128)\npositive = anchor + torch.randn(4, 128) * 0.1   # Close to anchor\nnegative = torch.randn(4, 128)                  # Unrelated random vector\n\nloss = loss_fn(anchor, positive, negative)\nprint(f\"Calculated Triplet Loss: {loss.item():.4f}\")\nprint(\"Loss drives d(a, p) closer while pushing d(a, n) beyond margin 0.4\")",
  "keyPoints": [
    "Metric learning learns continuous embedding spaces where geometric distance reflects semantic similarity.",
    "Enables open-set recognition (face verification, visual product search) without retraining on new classes.",
    "Triplet loss enforces that positive pairs are closer than negative pairs by at least margin $\\alpha$.",
    "Online semi-hard mining selects informative negative samples that produce non-zero gradients without collapsing."
  ],
  "pitfalls": [
    "Omitting L2 embedding normalisation: Without projection onto the unit hypersphere, networks cheat the margin by simply blowing up embedding magnitudes to infinity.",
    "Training without mining: Random negative sampling results in 99% easy negatives with zero loss, causing training loss to flatline near zero while representations remain poor.",
    "Offline batch generation: Pre-computing fixed triplets on disk creates stale pairs that quickly become easy after a few training epochs; mine triplets online within each batch."
  ],
  "quiz": [
    {
      "q": "Why is Deep Metric Learning preferred over standard $C$-class Softmax classification for facial recognition systems?",
      "o": [
        "Because Softmax classification requires infinite GPU VRAM",
        "Metric learning supports open-set recognition: new individuals can be enrolled immediately by computing their embedding, without retraining the network",
        "Softmax cannot process RGB images",
        "Metric learning models run in zero milliseconds"
      ],
      "a": 1,
      "why": "In a facial security system, new faces must be enrolled daily. Softmax classifiers have a fixed class count, whereas metric embeddings compare any arbitrary face via distance."
    },
    {
      "q": "What characterizes a \"Semi-Hard Negative\" in triplet loss mining?",
      "o": [
        "A negative that is identical to the anchor",
        "A negative that is farther from the anchor than the positive, but still within the margin boundary ($d(a, p) < d(a, n) < d(a, p) + \\alpha$)",
        "A negative that produces negative loss",
        "A corrupted image file"
      ],
      "a": 1,
      "why": "Semi-hard negatives violate the margin condition, generating positive loss and stable learning gradients without causing optimisation collapse."
    },
    {
      "q": "Why are output embeddings in metric learning almost always normalised to unit length ($L_2$ norm = 1)?",
      "o": [
        "To convert floating point numbers into integers",
        "To prevent the network from trivially satisfying the margin loss by simply scaling embedding magnitudes to astronomical values",
        "To ensure the matrix determinant equals zero",
        "To prevent overfitting to white background pixels"
      ],
      "a": 1,
      "why": "Without unit normalisation, an unconstrained network can satisfy $d(a, n) - d(a, p) > \\alpha$ by multiplying all output vectors by 1,000 without learning meaningful representations."
    }
  ],
  "related": [
    "contrastive-learning-simclr-and-infonce",
    "collaborative-filtering",
    "two-tower-retrieval"
  ],
  "keywords": "metric learning, triplet loss, siamese networks, semi-hard mining, contrastive loss, face recognition, embedding space, facenet"
},
  {
    id: 'quantisation',
    short: 'Model quantisation',
    title: 'Model Quantisation: FP16, INT8, and INT4',
    task: 'concepts',
    module: 'Efficiency and scale',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Slashing model memory and accelerating inference by converting 32-bit floating-point weights and activations into compact 8-bit or 4-bit integers with minimal loss in accuracy.`,
    lead: r`Modern deep neural networks and large language models contain billions of parameters, demanding tens of gigabytes of expensive high-bandwidth GPU memory (VRAM). Model quantisation compresses 32-bit floating-point numbers (` + '`FP32`' + r`) into compact lower-precision representations—such as 16-bit floats (` + '`FP16`' + r`/` + '`BF16`' + r`), 8-bit integers (` + '`INT8`' + r`), or 4-bit formats (` + '`INT4`' + r`)—reducing memory footprints by up to 75% and multiplying inference throughput on commodity hardware.`,
    intuition: [
      r`In standard deep learning, every single weight and activation is stored as a 32-bit IEEE 754 float: 1 sign bit, 8 exponent bits, and 23 mantissa bits. A 7-billion parameter language model in FP32 consumes $7 \times 10^9 \times 4 \text{ bytes} \approx 28 \text{ GB}$ of VRAM just to store parameter weights! Loading this enormous volume of weights from memory into GPU compute cores during autoregressive generation becomes an acute memory-bandwidth bottleneck.`,
      r`Fortunately, neural networks are remarkably robust to minor numerical perturbations. The exact value of a weight being $0.18374921$ rather than $0.18$ almost never alters the model's final prediction. **Uniform Quantisation** maps a continuous floating-point range $[x_{\text{min}}, x_{\text{max}}]$ into discrete integer buckets:
1. **Scale factor** ($S$): the real-valued step size represented by each integer increment ($S = \frac{\max(x) - \min(x)}{2^b - 1}$).
2. **Zero-point** ($Z$): the integer corresponding to real-valued zero ($0.0$).
3. **Quantise**: $q = \operatorname{clip}(\operatorname{round}(x / S) + Z, q_{\text{min}}, q_{\text{max}})$.
4. **Dequantise**: $\hat{x} = S \cdot (q - Z)$.
In symmetric quantisation, the range is centred around zero ($x_{\text{max}} = -x_{\text{min}}$), setting $Z = 0$ and drastically simplifying integer matrix multiplication kernels.`,
      r`Two primary methodologies govern deployment: **Post-Training Quantisation (PTQ)** quantises an already trained FP32 model directly using a small calibration dataset without retraining. For aggressive compressions (like 4-bit weights in GPTQ and AWQ), **Quantisation-Aware Training (QAT)** simulates low-precision integer rounding in the forward pass during training. Because rounding has a derivative of zero almost everywhere, QAT employs the **Straight-Through Estimator (STE)** to pass gradients directly through the rounding operator during backpropagation, allowing weights to adapt naturally to low-precision boundaries.`,
    ],
    analogy: r`Like converting a high-resolution 24-bit colour photograph to an 8-bit 256-colour indexed palette: while colour gradients become discrete steps, the visual composition remains indistinguishable to the human eye while cutting file size to a fraction.`,
    steps: [
      r`Select precision and target format: choose FP16/BF16 (2 bytes/param) for general GPU acceleration; INT8 (1 byte/param) for edge or CPU deployment; or INT4 (0.5 bytes/param) for hosting large language models in consumer VRAM.`,
      r`Gather calibration data: run 100 to 512 representative domain inputs through the network to record the dynamic activation ranges ($x_{\text{min}}, x_{\text{max}}$) across layers.`,
      r`Compute scale and zero-point parameters: calculate scale $S = \frac{\max(x) - \min(x)}{2^b - 1}$ and zero-point $Z$ per tensor, per channel, or per group.`,
      r`Quantise parameters and activations: map continuous values to discrete integers using $q = \operatorname{clip}(\operatorname{round}(x / S) + Z, q_{\text{min}}, q_{\text{max}})$.`,
      r`Deploy accelerated integer matrix kernels: execute matrix operations using native INT8/INT4 Tensor Core instructions, accumulating sums in 32-bit integer registers before dequantising outputs back to float.`,
      r`Validate accuracy against baseline: measure validation perplexity or task accuracy to ensure the quantised model remains within acceptable tolerances (typically $< 0.5\%$ accuracy loss for INT8).`,
    ],
    math: [
      {
        h: 'Uniform affine quantisation and dequantisation',
        tex: r`$$q = \operatorname{clip}\left(\left\lfloor \frac{x}{S} \right\rceil + Z, \, q_{\text{min}}, \, q_{\text{max}}\right), \qquad \hat{x} = S \cdot (q - Z)$$`,
        p: r`$x \in \mathbb{R}$ is the original continuous floating-point value, $S \in \mathbb{R}^+$ is the scale factor, $Z \in \mathbb{Z}$ is the zero-point offset, $\lfloor \cdot \rceil$ denotes round-to-nearest-integer, and $[q_{\text{min}}, q_{\text{max}}]$ are integer bounds (e.g. $[-128, 127]$ for signed INT8).`,
      },
      {
        h: 'Scale calculation from dynamic tensor range',
        tex: r`$$S = \frac{\alpha - \beta}{q_{\text{max}} - q_{\text{min}}}, \qquad Z = \left\lfloor \frac{-\beta}{S} \right\rceil + q_{\text{min}}$$`,
        p: r`$[\beta, \alpha]$ is the dynamic range of the tensor (often calibrated using percentiles to mitigate outlier distortion). In symmetric quantisation, $\beta = -\alpha$, which enforces $Z = 0$, simplifying integer dot-product computations.`,
      },
      {
        h: 'Straight-Through Estimator (STE) for Quantisation-Aware Training',
        tex: r`$$\frac{\partial \hat{x}}{\partial x} = \begin{cases} 1 & \text{if } x \in [\beta, \alpha] \\ 0 & \text{otherwise} \end{cases}$$`,
        p: r`Because the derivative of the rounding function $\lfloor \cdot \rceil$ is zero almost everywhere, standard gradient descent cannot update parameters. The STE replaces the zero derivative with the identity pass-through ($1.0$) within the valid dynamic range.`,
      },
    ],
    keyPoints: [
      r`Quantisation reduces memory footprint by $2\times$ (FP16), $4\times$ (INT8), or $8\times$ (INT4), enabling large models to fit into consumer GPU VRAM.`,
      r`Symmetric quantisation sets zero-point $Z = 0$, eliminating zero-point offset arithmetic during high-throughput matrix multiplications.`,
      r`Quantisation-Aware Training (QAT) uses the Straight-Through Estimator to adapt neural weights to low-precision discrete grids, preserving accuracy where post-training quantisation degrades.`,
    ],
    pitfalls: [
      r`Activation outlier collapse: large language models exhibit extreme outlier features in specific channels ($100\times$ larger than average); naive per-tensor quantisation destroys accuracy unless per-channel or group-wise scaling is applied.`,
      r`Benchmarking latency on unsupported hardware: executing INT8 models on hardware without native integer compute instructions requires dequantising to float before every multiplication, resulting in slower execution.`,
      r`Quantising sensitive layers: aggressively quantising initial convolutional embeddings, attention softmax denominators, or final classification logits to 4-bit often causes severe divergence; keep sensitive operations in FP16.`,
    ],
    code: r`import numpy as np

# Demonstrate symmetric 8-bit quantisation on synthetic weight tensor
np.random.seed(42)
N = 100
# Generate FP32 weights (mean 0, std 0.5)
W_fp32 = (np.random.randn(N) * 0.5).astype(np.float32)

# 1. Symmetric INT8 scale: map [-max_val, max_val] to [-127, 127]
max_abs = float(np.max(np.abs(W_fp32)))
scale = max_abs / 127.0

# 2. Quantise to signed 8-bit integers
W_int8 = np.clip(np.round(W_fp32 / scale), -127, 127).astype(np.int8)

# 3. Dequantise back to floating-point representation
W_reconstructed = W_int8.astype(np.float32) * scale

mse_noise = float(np.mean((W_fp32 - W_reconstructed)**2))
bytes_fp32 = W_fp32.nbytes
bytes_int8 = W_int8.nbytes

print(f"FP32 memory footprint: {bytes_fp32} bytes")
print(f"INT8 memory footprint: {bytes_int8} bytes ({bytes_fp32 / bytes_int8:.1f}x compression)")
print(f"Quantisation Mean Squared Error: {mse_noise:.6f}")
print(f"Sample weight 0: original = {W_fp32[0]:.4f} -> dequantised = {W_reconstructed[0]:.4f}")`,
    quiz: [
      {
        q: r`Why does symmetric quantisation ($Z = 0$) provide computational advantages over asymmetric affine quantisation?`,
        o: [
          r`It eliminates zero-point offset subtraction during matrix multiplication, enabling direct integer dot products on hardware Tensor Cores`,
          r`It guarantees zero loss of numerical accuracy`,
          r`It doubles the dynamic range from 8 bits to 16 bits`,
          r`It eliminates the need for a scale factor $S$`,
        ],
        a: 0,
        why: r`When $Z=0$, dequantisation simplifies to $\hat{x} = S \cdot q$. The product of two matrices becomes $S_1 S_2 (Q_1 Q_2)$, allowing hardware to perform pure integer GEMM without accumulating zero-point cross-terms.`,
      },
      {
        q: r`What is the function of the Straight-Through Estimator (STE) in Quantisation-Aware Training?`,
        o: [
          r`It converts integer weights into complex numbers`,
          r`It replaces the zero derivative of the non-differentiable rounding operator with the identity function (1.0), allowing gradients to update weights during backpropagation`,
          r`It automatically selects the optimal batch size`,
          r`It prunes zero weights from the model`,
        ],
        a: 1,
        why: r`Rounding $\lfloor x \rceil$ has derivative zero everywhere (and undefined at half-integers). Without STE, backpropagation would produce zero gradients, preventing the optimiser from adjusting weights.`,
      },
      {
        q: r`Why do Large Language Models (LLMs) suffer severe accuracy degradation under naive per-tensor INT8 quantisation?`,
        o: [
          r`Because LLMs cannot run on GPUs`,
          r`Because LLMs develop extreme outlier feature activations in specific channels that compress normal-magnitude weights into a single integer bucket if scaled globally`,
          r`Because cross-entropy loss cannot be computed on integers`,
          r`Because Transformers do not have activation functions`,
        ],
        a: 1,
        why: r`Research (such as LLM.int8()) showed that Transformers develop emergent outlier activation dimensions with values $100\times$ larger than average. A global scale factor stretches the bucket width, collapsing normal features to zero unless per-channel or group-wise scaling is used.`,
      },
      {
        q: r`How does 4-bit weight quantisation (INT4) reduce inference latency in large language model text generation?`,
        o: [
          r`By reducing the volume of weight data transferred from GPU VRAM across memory buses into compute registers, alleviating memory bandwidth bottlenecks`,
          r`By increasing the context window size by $4\times$`,
          r`By eliminating the need for tokenisation`,
          r`By running 4 times as many training epochs per second`,
        ],
        a: 0,
        why: r`Autoregressive text generation is memory-bandwidth bound: the GPU spends most of its time fetching weights from VRAM to compute a single token. Shrinking weights to 4 bits cuts bytes read by $4\times$ compared to FP16, speeding up generation.`,
      },
    ],
    usedBy: [],
    prereq: ['the-pytorch-training-loop', 'weight-initialisation-xavier-and-he', 'backpropagation-and-autodiff'],
    related: ['normalisation-batch-layer-rms', 'residual-networks-and-skip-connections', 'the-attention-mechanism'],
    keywords: 'quantisation int8 fp16 int4 post training quantisation quantisation aware training straight through estimator scale zero point ptq qat compression',
  },
  {
  id: 'lora-and-parameter-efficient-fine-tuning',
  short: 'LoRA & PEFT',
  title: 'LoRA and parameter-efficient fine-tuning',
  task: 'concepts',
  module: 'Efficiency and scale',
  level: 2,
  minutes: 16,
  noLab: true,
  summary: r`Parameter-Efficient Fine-Tuning (PEFT) adapts massive pre-trained foundation models without re-training all parameters. Low-Rank Adaptation (LoRA) freezes the pre-trained model weights $W_0 \in \mathbb{R}^{d \times k}$ and injects trainable rank-decomposition matrices $\Delta W = \frac{\alpha}{r} B A$, where $B \in \mathbb{R}^{d \times r}$ and $A \in \mathbb{R}^{r \times k}$ with $r \ll \min(d, k)$. This cuts trainable parameters and optimiser GPU memory by over 99% while matching full fine-tuning accuracy and introducing zero inference latency via weight merging.`,
  lead: r`Fine-tuning a 70-billion-parameter foundation model requires hundreds of gigabytes of GPU memory purely to store optimiser states (momentum and variance buffers in AdamW) and activation checkpoints, long before computing the actual gradients. LoRA (Low-Rank Adaptation) overcomes this hardware bottleneck based on the intrinsic rank hypothesis: the parameter updates required to specialise a model to a downstream domain lie on a low-dimensional subspace. Constraining weight updates to low-rank matrix products transforms foundation model customisation from a distributed cluster challenge into a single-workstation workflow.`,
  intuition: [
    r`Massive pre-trained transformers are intrinsically over-parameterised. When adapting a multi-billion parameter network to a downstream task (such as contract summarisation, medical triage, or SQL code generation), the weight updates $\Delta W$ do not span the entire ambient parameter space $\mathbb{R}^{d \times k}$. Instead, the degrees of freedom needed to capture the downstream task have an intrinsic dimension orders of magnitude smaller than $d$ and $k$.`,
    r`Full fine-tuning updates every base parameter $W = W_0 + \Delta W$, necessitating gradient calculations and AdamW moment tracking for all weights. In a 16-bit model, each parameter requires 2 bytes for the weight, 2 bytes for the gradient, and 8 bytes for FP32 first and second optimiser moments—amounting to 12 to 16 bytes per parameter. LoRA freezes $W_0$ entirely. Backpropagation computes gradients solely for two diminutive factor matrices: a down-projection matrix $A \in \mathbb{R}^{r \times k}$ and an up-projection matrix $B \in \mathbb{R}^{d \times r}$, where the rank $r \in \{4, 8, 16, 64\}$.`,
    r`To prevent disruptive perturbations at the start of training, LoRA initialises $A$ with a random Gaussian distribution $\mathcal{N}(0, \sigma^2)$ and $B$ to exact zeros. Consequently, the low-rank update $\Delta W = B A$ evaluates to exactly zero at step 0. Training begins smoothly from the exact behaviour of the original pre-trained checkpoint, eliminating catastrophic forgetting during initial gradient descent steps.`,
    r`For production serving, LoRA delivers zero additional latency. The low-rank update can be merged directly into the base weights prior to deployment: $W_{\text{merged}} = W_0 + \frac{\alpha}{r} B A$. The deployed model uses the standard transformer architecture with identical inference latency. Alternatively, in multi-tenant environments, a single base model can remain resident in GPU VRAM while minuscule task-specific adapter weights are dynamically swapped per request.`,
  ],
  analogy: r`Imagine customising an exhaustive 1,000-page leather-bound medical encyclopaedia for a specialised paediatric clinic. Full fine-tuning is equivalent to reprinting the entire 1,000-page book with bespoke modifications on every single leaf—a slow, enormously expensive undertaking that must be repeated for every department. LoRA, by contrast, slips a slim two-page transparent overlay booklet into the back pocket. When reading an entry, a paediatrician views the underlying canonical text through the transparent overlay, seeing only the specialised paediatric annotations. The monumental encyclopaedia remains untouched on the clinic shelf, and swapping overlays adapts the reference text for cardiology or neurology in an instant.`,
  steps: [
    {
      title: r`Identify target linear projection layers`,
      desc: r`Select which weight matrices in the transformer architecture receive low-rank adapter branches.`,
      detail: r`Original LoRA applied adapter matrices solely to multi-head self-attention query ($W_q$) and value ($W_v$) projections. Contemporary best practice (including QLoRA) attaches adapters to all linear projection layers—queries, keys, values, output projections, and feed-forward MLP projections—which allows using smaller ranks (such as $r=8$ or $r=16$) whilst matching full fine-tuning representational capacity.`,
    },
    {
      title: r`Freeze the base model weights`,
      desc: r`Disable gradient tracking across all pre-trained backbone parameters to halt optimiser memory allocation.`,
      detail: r`By setting requires_grad = False on $W_0$, the base model does not allocate gradients or AdamW moment states (momentum and squared gradient averages). In 16-bit mixed precision, this frees roughly 10 to 14 bytes per base parameter from GPU VRAM.`,
    },
    {
      title: r`Initialise low-rank adapter matrices with zero delta`,
      desc: r`Initialise down-projection factor $A$ with Gaussian noise and up-projection factor $B$ with zeros.`,
      detail: r`Down-projection matrix $A \in \mathbb{R}^{r \times k}$ is initialised from $\mathcal{N}(0, 1/r)$ or Kaiming uniform initialisation, while up-projection matrix $B \in \mathbb{R}^{d \times r}$ is set to all zeros. Because $B A = 0$ at step zero, the initial output matches the pre-trained model checkpoint without initial transient artifacts.`,
    },
    {
      title: r`Execute dual-branch forward pass with scaling`,
      desc: r`Compute the parallel adapter projection and scale the output by $\frac{\alpha}{r}$.`,
      detail: r`For an incoming token activation $x \in \mathbb{R}^{B \times k}$, compute $h = x W_0^T + \frac{\alpha}{r} (x A^T) B^T$. Here $\alpha$ is a fixed scaling constant (commonly chosen as $\alpha = 2r$ or $\alpha = r$). The constant scaling factor $\frac{\alpha}{r}$ stabilises gradient magnitudes and allows practitioners to vary the rank $r$ without re-tuning the learning rate.`,
    },
    {
      title: r`Deploy via weight merging or dynamic adapter routing`,
      desc: r`Fold adapters into base weights for zero-overhead inference or swap adapters dynamically in multi-tenant serving.`,
      detail: r`For standalone production deployment, pre-compute $W_{\text{deploy}} = W_0 + \frac{\alpha}{r} B A$. This incurs zero inference latency penalty and requires no architectural changes in serving runtimes. For multi-tenant APIs, keep a single copy of $W_0$ in memory and route activations through customer-specific $A$ and $B$ adapter vectors on the fly.`,
    },
  ],
  math: [
    {
      h: r`Low-rank decomposition and scaled forward pass`,
      tex: r`h = W_0 x + \Delta W x = W_0 x + \frac{\alpha}{r} B A x`,
      p: r`Here $W_0 \in \mathbb{R}^{d \times k}$ represents the frozen pre-trained weight matrix, $B \in \mathbb{R}^{d \times r}$ is the trainable up-projection, $A \in \mathbb{R}^{r \times k}$ is the trainable down-projection, $r \ll \min(d, k)$ is the bottleneck rank, and $\alpha$ is a constant scaling hyperparameter.`,
    },
    {
      h: r`Parameter reduction ratio`,
      tex: r`\rho = \frac{|\Theta_{\text{LoRA}}|}{|\Theta_{\text{Base}}|} = \frac{r(d + k)}{d \times k} = r \left(\frac{1}{k} + \frac{1}{d}\right)`,
      p: r`For a standard projection layer with $d = k = 4096$ and rank $r = 8$, base weights contain $16,777,216$ parameters, whereas the LoRA adapter contains $2 \times 4096 \times 8 = 65,536$ parameters—a parameter reduction of $99.61\%$ (a $256\times$ compression factor).`,
    },
    {
      h: r`Weight merging for zero-latency inference`,
      tex: r`W_{\text{merged}} = W_0 + \frac{\alpha}{r} B A`,
      p: r`Because matrix multiplication is distributive across addition, $W_{\text{merged}} x = (W_0 + \frac{\alpha}{r} B A) x = W_0 x + \frac{\alpha}{r} B A x$. Folding the product $B A$ into $W_0$ produces an adapted weight matrix identical in shape to the original layer, requiring zero auxiliary runtime operators during inference.`,
    },
  ],
  keyPoints: [
    r`LoRA constrains task-specific fine-tuning weight updates to low-rank factorisation matrices $B \in \mathbb{R}^{d \times r}$ and $A \in \mathbb{R}^{r \times k}$ with $r \ll \min(d, k)$.`,
    r`Base backbone weights remain frozen during training; gradients and optimiser states are computed solely for lightweight adapter parameters.`,
    r`Initialising up-projection matrix $B$ to zero guarantees that $\Delta W = 0$ at step 0, preserving pre-trained behaviour from the start.`,
    r`The scaling factor $\frac{\alpha}{r}$ stabilises gradient magnitude and allows changing rank $r$ without extensive learning rate re-tuning.`,
    r`Weight merging folds $\Delta W$ directly into base parameters for production inference, adding zero latency and zero memory overhead at deployment.`,
  ],
  pitfalls: [
    r`Setting rank $r$ unnecessarily high: Empirical studies show that rank $r \in [8, 16]$ often achieves parity with full fine-tuning; larger ranks increase risk of overfitting on modest task datasets without boosting accuracy.`,
    r`Randomly initialising matrix $B$: If $B$ is initialised with random noise rather than exact zeros, $\Delta W \neq 0$ at step 0, introducing immediate noise that can disrupt pre-trained capabilities.`,
    r`Omitting the $\frac{\alpha}{r}$ scaling factor: Scaling weight deltas by $\frac{\alpha}{r}$ decouples adaptation magnitude from rank $r$. Omitting this scaling requires re-tuning learning rates every time $r$ changes.`,
    r`Attempting direct weight merging into quantised base weights: If the base model is stored in INT4 or INT8 (as in QLoRA), merging FP16 adapters directly degrades numerical precision; adapters must either be kept in a separate branch or merged after dequantising to FP16.`,
    r`Targeting only attention projections: Restricting adapters exclusively to query and value projections often requires higher ranks ($r=64$); distributing low-rank adapters across all linear layers (including MLP projections) yields superior results at lower ranks ($r=8$).`,
  ],
  code: r`import numpy as np

# Simulate a linear projection layer with LoRA adaptation
np.random.seed(42)

in_features = 4096
out_features = 4096
rank = 8
alpha = 16.0
scaling = alpha / rank

# 1. Base pre-trained weight (frozen, e.g. FP16/FP32)
W0 = np.random.randn(out_features, in_features).astype(np.float32) * 0.02

# 2. Trainable low-rank adapters: A ~ N(0, 1/sqrt(r)), B = 0
A = np.random.randn(rank, in_features).astype(np.float32) * (1.0 / np.sqrt(rank))
B = np.zeros((out_features, rank), dtype=np.float32)

# Verify parameter counts
base_params = out_features * in_features
lora_params = (out_features * rank) + (rank * in_features)
reduction = (1.0 - (lora_params / base_params)) * 100

print(f"Base parameters:            {base_params:,}")
print(f"LoRA parameters (r={rank}):       {lora_params:,} ({lora_params/base_params*100:.2f}% of base)")
print(f"Parameter reduction:        {reduction:.2f}%\n")

# Simulate trained B matrix after fine-tuning steps
B = np.random.randn(out_features, rank).astype(np.float32) * 0.01

# 3. Forward pass with adapter branch: h = x W0^T + scaling * (x A^T) B^T
x = np.random.randn(2, in_features).astype(np.float32)  # batch of 2 tokens

# Standard base forward pass
h_base = x @ W0.T

# LoRA branch forward pass
h_lora = (x @ A.T) @ B.T * scaling
h_total = h_base + h_lora

# 4. Zero-latency deployment: fold adapter into base weights
W_merged = W0 + scaling * (B @ A)
h_merged = x @ W_merged.T

# Verify mathematical equivalence
diff = np.max(np.abs(h_total - h_merged))
print(f"Forward output shape:       {h_total.shape}")
print(f"Base forward norm:          {np.linalg.norm(h_base):.4f}")
print(f"LoRA delta norm:            {np.linalg.norm(h_lora):.4f}")
print(f"Max diff (LoRA vs merged):  {diff:.2e}")
assert diff < 1e-4, "Merged weight forward pass mismatch!"
print("Weight merging verified successfully!")`,
  quiz: [
    {
      q: r`Why is the up-projection matrix $B$ initialised to zeros while $A$ is initialised with Gaussian noise in LoRA?`,
      o: [
        r`To ensure the initial low-rank product $\Delta W = B A$ equals zero, preserving pre-trained model behaviour at the start of training`,
        r`To prevent division by zero during backward propagation`,
        r`To force the optimiser to update $B$ before updating $A$`,
        r`To compress matrix $B$ into an 8-bit integer representation`,
      ],
      a: 0,
      why: r`Initialising $B=0$ guarantees that $\Delta W = B A = 0$ at step 0. The model starts training from the exact pre-trained checkpoint, avoiding noisy disruptions at the onset of fine-tuning.`,
    },
    {
      q: r`In LoRA, what is the role of the constant scaling factor $\frac{\alpha}{r}$ applied to the low-rank branch?`,
      o: [
        r`It normalises the activations so their Euclidean norm equals 1`,
        r`It scales the magnitude of the adapter update, allowing the rank $r$ to be adjusted without re-tuning the learning rate`,
        r`It clips exploding gradients when backpropagating through attention heads`,
        r`It converts floating-point weights to low-bit integers for inference`,
      ],
      a: 1,
      why: r`By scaling $\Delta W$ by $\frac{\alpha}{r}$, the magnitude of the weight update remains invariant when varying the rank $r$, stabilising the optimisation process across hyperparameter sweeps.`,
    },
    {
      q: r`How does LoRA eliminate runtime latency overhead during inference in production?`,
      o: [
        r`By pruning 90% of the attention tokens dynamically during the forward pass`,
        r`By folding the adapter product $\frac{\alpha}{r} B A$ directly into the frozen base weights $W_0$ prior to deployment`,
        r`By skipping feed-forward layers when processing common tokens`,
        r`By executing the adapter and base projections on separate asynchronous GPUs`,
      ],
      a: 1,
      why: r`Because matrix multiplication is distributive over addition, $W_{\text{deploy}} = W_0 + \frac{\alpha}{r} B A$ can be computed once offline. The resulting matrix has the identical shape of the original layer, incurring zero latency penalty.`,
    },
    {
      q: r`For a linear layer with dimension $d = 4096$ and $k = 4096$, how many trainable parameters does a LoRA module with rank $r = 8$ introduce compared to full fine-tuning?`,
      o: [
        r`65,536 parameters vs 16,777,216 parameters (a 99.61% reduction)`,
        r`131,072 parameters vs 8,388,608 parameters (a 98.44% reduction)`,
        r`32,768 parameters vs 33,554,432 parameters (a 99.90% reduction)`,
        r`1,048,576 parameters vs 16,777,216 parameters (a 93.75% reduction)`,
      ],
      a: 0,
      why: r`Base layer parameters are $4096 \times 4096 = 16,777,216$. LoRA consists of matrix $A$ ($8 \times 4096 = 32,768$) and matrix $B$ ($4096 \times 8 = 32,768$), totalling $65,536$ parameters—a 99.61% reduction.`,
    },
  ],
  usedBy: [],
  prereq: ['the-attention-mechanism', 'transfer-learning-and-fine-tuning', 'the-pytorch-training-loop'],
  related: ['quantisation', 'residual-networks-and-skip-connections', 'optimisers-sgd-momentum-rmsprop-adam-adamw'],
  keywords: 'lora peft parameter efficient fine tuning low rank adaptation qlora adapter rank decomposition intrinsic dimension weight merging transformer',
},
  {
  "id": "knowledge-distillation",
  "short": "Knowledge distillation",
  "title": "Knowledge Distillation: Compressing Deep Networks via Soft Target Transfer",
  "task": "concepts",
  "level": 2,
  "minutes": 16,
  "noLab": true,
  "usedBy": [],
  "summary": "Transferring dark knowledge from cumbersome teacher ensembles into compact student networks using temperature-scaled softmax.",
  "lead": "State-of-the-art deep neural networks achieve high accuracy by stacking hundreds of layers and billions of parameters. However, deploying these massive models to resource-constrained environments (mobile phones, embedded edge devices, real-time microservices) is prohibitive due to high inference latency and memory footprints. Knowledge Distillation (Hinton et al.) compresses a large \"teacher\" model into a compact \"student\" model by training the student on the rich, soft probability outputs of the teacher.",
  "analogy": "Imagine learning to play chess. If you only look at game results (\"White won\" or \"Black lost\"—hard binary labels), it takes thousands of games to understand strategy. But if a Grandmaster sits beside you and explains their thoughts (\"This move has a 65% chance of winning, but that other move is 30% viable because it attacks the bishop, while this third move is 5%\"), you absorb the master's nuanced strategic probabilities directly.",
  "intuition": [
    "Hard labels (one-hot vectors: $[0, 1, 0]$) discard rich inter-class information. A model classifying a BMW car might assign 0.85 to car, 0.14 to truck, and $10^{-6}$ to carrot. This soft distribution contains \"dark knowledge\": it informs the learner that a BMW shares visual similarities with a truck, but looks nothing like a carrot.",
    "Knowledge Distillation softens probabilities by dividing logits $z_i$ by a temperature hyperparameter $T > 1$: $q_i = \\frac{\\exp(z_i / T)}{\\sum_j \\exp(z_j / T)}$. Higher temperatures expose the relative relationships among the non-target classes.",
    "The student network is trained using a blended loss: a distillation loss (Kullback-Leibler divergence between softened student and teacher predictions) and a standard student loss (cross-entropy with hard ground-truth labels).",
    "Because the distillation gradients are scaled down by $1/T^2$ mathematically, the distillation loss is weighted by $T^2$ to ensure balanced gradient propagation."
  ],
  "steps": [
    "Train teacher model: Train a high-capacity teacher network (e.g. ensemble, ResNet-152, or massive Transformer) to peak convergence.",
    "Freeze teacher parameters: Lock teacher weights so only the student network receives gradient updates during distillation.",
    "Configure student network: Construct a lightweight student architecture (e.g. MobileNet or 6-layer DistilBERT) with significantly fewer parameters.",
    "Compute softened distributions: Pass training inputs through both models, applying temperature scaling $T$ to output logits before softmax.",
    "Evaluate blended loss: Compute KL divergence between softened student and teacher outputs (scaled by $T^2$), combined with standard cross-entropy on hard ground truth.",
    "Deploy student in production: Discard the teacher and deploy the fast, lightweight student model with temperature reset to $T=1$."
  ],
  "math": [
    {
      "h": "Temperature-Scaled Softmax Distribution",
      "tex": "q_i = \\frac{\\exp(z_i / T)}{\\sum_j \\exp(z_j / T)}, \\quad T > 1",
      "p": "Higher temperature $T$ flattens the distribution, amplifying the soft probabilities of non-target classes (dark knowledge)."
    },
    {
      "h": "Distillation Blended Loss Formulation",
      "tex": "\\mathcal{L}_{\\mathrm{KD}} = (1 - \\alpha) \\mathcal{L}_{\\mathrm{CE}}(y, \\sigma(z_s)) + \\alpha \\cdot T^2 \\cdot D_{\\mathrm{KL}}\\left( \\sigma(z_t / T) \\;\\middle\\|\\; \\sigma(z_s / T) \\right)",
      "p": "Blends hard ground-truth cross-entropy $\\mathcal{L}_{\\mathrm{CE}}$ with softened teacher-student KL divergence, scaled by $T^2$."
    },
    {
      "h": "Temperature Gradient Scale Equivalence",
      "tex": "\\lim_{T \\to \\infty} \\frac{\\partial \\mathcal{L}_{\\mathrm{distill}}}{\\partial z_i^{(s)}} \\approx \\frac{1}{2 T^2} (z_i^{(s)} - z_i^{(t)})",
      "p": "At high temperature, distillation gradients act as mean squared error between teacher and student logits, justifying the $T^2$ multiplier."
    }
  ],
  "code": "import torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\nclass DistillationLoss(nn.Module):\n    def __init__(self, temperature: float = 4.0, alpha: float = 0.7):\n        super().__init__()\n        self.T = temperature\n        self.alpha = alpha\n        self.ce = nn.CrossEntropyLoss()\n        self.kl = nn.KLDivLoss(reduction='batchmean')\n\n    def forward(self, student_logits: torch.Tensor, teacher_logits: torch.Tensor, targets: torch.Tensor):\n        # 1. Hard label loss (T=1)\n        loss_ce = self.ce(student_logits, targets)\n        \n        # 2. Soft distillation loss (T > 1)\n        soft_student = F.log_softmax(student_logits / self.T, dim=-1)\n        soft_teacher = F.softmax(teacher_logits / self.T, dim=-1)\n        loss_kd = self.kl(soft_student, soft_teacher) * (self.T ** 2)\n        \n        # Combined blended loss\n        return (1.0 - self.alpha) * loss_ce + self.alpha * loss_kd\n\n# Simulation: Teacher (large) and Student (compact)\ntorch.manual_seed(42)\nteacher_logits = torch.tensor([[4.2, 1.8, -1.2], [-0.5, 3.1, 1.0]])  # Precomputed teacher output\nstudent_logits = torch.randn(2, 3, requires_grad=True)\ntrue_labels = torch.tensor([0, 1])\n\ncriterion = DistillationLoss(temperature=3.0, alpha=0.6)\nloss = criterion(student_logits, teacher_logits, true_labels)\nloss.backward()\n\nprint(f\"Distillation Blended Loss: {loss.item():.4f}\")\nprint(\"Student gradients computed smoothly from softened teacher probabilities!\")",
  "keyPoints": [
    "Knowledge distillation compresses large teacher models into compact students with minimal accuracy loss.",
    "Soft teacher probabilities convey \"dark knowledge\" about inter-class geometric similarities.",
    "Temperature scaling $T > 1$ reveals probability ratios among non-target classes.",
    "Distillation loss is multiplied by $T^2$ to compensate for gradient shrinkage at higher temperatures."
  ],
  "pitfalls": [
    "Distilling into an undersized student: If the student architecture is too tiny (e.g. compressing a 100M parameter model into 10K parameters), the student lacks capacity to absorb the teacher's manifold.",
    "Forgetting the $T^2$ multiplier: Omitting $T^2$ in the distillation loss causes the distillation gradient to be thousands of times smaller than the hard cross-entropy gradient.",
    "Keeping temperature high at test time: Temperature must be reset to $T=1$ during production deployment to produce crisp, calibrated predictions."
  ],
  "quiz": [
    {
      "q": "What is \"dark knowledge\" in the context of Knowledge Distillation?",
      "o": [
        "Encrypted weights stored in dark mode themes",
        "The rich information contained in the relative probabilities that the teacher model assigns to the non-target, incorrect classes",
        "Unsupervised data downloaded from the dark web",
        "Weights that have decayed to negative values"
      ],
      "a": 1,
      "why": "Soft probabilities reveal that a truck is closer to a car than to a carrot. This inter-class structure (dark knowledge) provides dense supervision for the student."
    },
    {
      "q": "Why is the KL divergence loss scaled by $T^2$ in knowledge distillation?",
      "o": [
        "To make the loss strictly positive",
        "Because temperature-scaled softmax gradients scale as $1/T^2$; multiplying by $T^2$ ensures the distillation loss contributes balanced gradients alongside hard cross-entropy",
        "To convert floating point operations into integer additions",
        "To account for leap years in training data"
      ],
      "a": 1,
      "why": "Differentiating softened softmax yields gradients with a $1/T^2$ factor. Multiplying by $T^2$ prevents the distillation signal from vanishing when $T$ is high."
    },
    {
      "q": "What should the temperature setting $T$ be when deploying the student model to production inference?",
      "o": [
        "The same high temperature used during training (e.g. $T=4.0$)",
        "Reset to $T=1.0$ for standard, sharp probability evaluation",
        "$T=0.0$",
        "$T=100.0$"
      ],
      "a": 1,
      "why": "High temperature is used strictly during training to soften outputs for student learning. During inference, $T=1.0$ delivers standard calibrated predictions."
    }
  ],
  "related": [
    "quantisation",
    "pruning-and-sparsity",
    "transfer-learning-and-fine-tuning"
  ],
  "keywords": "knowledge distillation, teacher student, dark knowledge, temperature scaling, model compression, hinton, distilbert, kl divergence"
},
  {
  "id": "pruning-and-sparsity",
  "short": "Pruning & sparsity",
  "title": "Pruning and Sparsity: Structural Compression and the Lottery Ticket Hypothesis",
  "task": "concepts",
  "level": 3,
  "minutes": 17,
  "noLab": true,
  "usedBy": [],
  "summary": "Eliminating redundant parameters using magnitude pruning, structured channel removal, and sparse sub-network discovery via the Lottery Ticket Hypothesis.",
  "lead": "Over-parameterised deep neural networks contain massive redundancy: up to 80%–95% of weights can be set to zero without degrading final test accuracy. However, unconstrained training does not produce sparse models on its own. Pruning identifies and eliminates non-essential weights, reducing model storage, memory footprints, and accelerating inference on hardware that supports sparse computation.",
  "analogy": "Imagine a sprawling bonsai tree. When left to grow wildly, the tree develops thousands of tiny overlapping branches that block light from one another. A master gardener prunes away non-essential twigs and weak branches: the tree not only retains its essential artistic shape and health, but requires less water, fits in a smaller ceramic pot, and thrives under focused nutrition.",
  "intuition": [
    "Pruning removes parameters from a trained network based on an importance metric (most commonly weight magnitude $|w|$).",
    "Unstructured Pruning sets individual scalar weights to zero, creating sparse weight tensors. While it dramatically reduces theoretical parameter counts, standard hardware (CPUs/GPUs) cannot easily accelerate unstructured random zero patterns unless running on specialized sparse Tensor Cores (e.g. NVIDIA 2:4 structured sparsity).",
    "Structured Pruning removes entire architectural blocks—entire convolutional channels, attention heads, or linear rows/columns. This directly reduces tensor matrix dimensions, delivering immediate latency speedups on any standard hardware without specialized sparse software libraries.",
    "The Lottery Ticket Hypothesis (Frankle & Carbin, 2018) discovered that dense, randomly-initialised networks contain sparse sub-networks (\"winning lottery tickets\") that, when trained in isolation from their original initialisation, can match the test accuracy of the original dense network in an equal number of training iterations."
  ],
  "steps": [
    "Train dense baseline network: Train the full over-parameterised network to target convergence.",
    "Select pruning granularity: Choose unstructured pruning (for compression and 2:4 sparse accelerators) or structured pruning (for general latency reduction on CPUs/GPUs).",
    "Compute importance scores: Evaluate weight magnitudes $|w_{ij}|$, first-order gradient Taylor expansion, or channel activation norms.",
    "Apply binary pruning mask: Zero out the lowest $P\\%$ of weights by applying a binary indicator mask $\\mathbf{M} \\in \\{0, 1\\}$.",
    "Iterative fine-tuning (Retraining): Fine-tune the remaining unmasked weights at a lower learning rate to recover lost accuracy.",
    "Iterative Pruning Schedule: Repeat prune-and-finetune cycles gradually (e.g. pruning 20% per cycle over 5 rounds) rather than pruning 80% in one shot (One-Shot Pruning)."
  ],
  "math": [
    {
      "h": "Magnitude-Based Unstructured Pruning Mask",
      "tex": "m_{ij} = \\mathbb{I}\\left( |w_{ij}| \\ge \\tau_p \\right), \\quad \\tilde{\\mathbf{W}} = \\mathbf{M} \\odot \\mathbf{W}",
      "p": "Applies binary mask $\\mathbf{M}$ keeping only weights whose absolute magnitude meets or exceeds threshold percentile $\\tau_p$."
    },
    {
      "h": "L1-Norm Structured Channel Pruning",
      "tex": "s_c = \\frac{1}{C_{\\mathrm{in}} \\times K \\times K} \\sum_{j=1}^{C_{\\mathrm{in}}} \\sum_{u=1}^K \\sum_{v=1}^K |W_{c, j, u, v}|",
      "p": "Measures the importance of output channel $c$ by the average magnitude of its convolutional kernel weights, removing bottom channels entirely."
    },
    {
      "h": "Lottery Ticket Hypothesis Formulation",
      "tex": "\\exists \\mathbf{M} \\in \\{0, 1\\}^{|\\theta|} : \\|\\mathbf{M}\\|_0 \\ll |\\theta| \\;\\land\\; \\operatorname{Train}(\\mathbf{M} \\odot \\theta_0) \\approx \\operatorname{Train}(\\theta_0)",
      "p": "A winning ticket sub-network $(\\mathbf{M} \\odot \\theta_0)$ achieves test accuracy comparable to the original dense network $\\theta_0$ when trained from identical initialisation."
    }
  ],
  "code": "import torch\nimport torch.nn as nn\nimport torch.nn.utils.prune as prune\n\n# Create a small convolutional model\nmodel = nn.Sequential(\n    nn.Conv2d(1, 16, kernel_size=3, padding=1),\n    nn.ReLU(),\n    nn.Linear(16, 10)\n)\n\nconv_layer = model[0]\nprint(\"Dense weight non-zero count:\", torch.count_nonzero(conv_layer.weight).item())\n\n# Apply 50% L1 unstructured magnitude pruning to conv weights\nprune.l1_unstructured(conv_layer, name='weight', amount=0.5)\n\nprint(\"Pruned weight non-zero count:\", torch.count_nonzero(conv_layer.weight).item())\nprint(\"Weight sparsity percentage:  50.0%\")\nprint(\"Mask applied:\", hasattr(conv_layer, 'weight_mask'))\n\n# To permanently remove parameters and bake mask into weights:\nprune.remove(conv_layer, 'weight')\nprint(\"Permanent sparsity verified:\", (conv_layer.weight == 0).sum().item(), \"zeros out of\", conv_layer.weight.numel())",
  "keyPoints": [
    "Pruning eliminates redundant parameters to compress networks and reduce inference latency.",
    "Unstructured pruning zeros individual weights; structured pruning eliminates entire channels or attention heads.",
    "Iterative pruning with fine-tuning recovers accuracy far more effectively than one-shot pruning.",
    "The Lottery Ticket Hypothesis proves small sub-networks can match dense accuracy if initialized identically."
  ],
  "pitfalls": [
    "Expecting latency speedups from unstructured sparsity on standard hardware: Zeroing out 70% of weights at random does not make standard dense BLAS libraries faster; it only reduces file compression size unless using 2:4 sparse accelerators.",
    "One-shot aggressive pruning: Pruning 80% of parameters in a single step causes catastrophic accuracy collapse; always prune iteratively with fine-tuning recovery.",
    "Pruning without fine-tuning: Forgetting to fine-tune after pruning leaves the remaining network in a degraded state without adapting to the missing weights."
  ],
  "quiz": [
    {
      "q": "Why does unstructured magnitude pruning often fail to deliver real-world wall-clock latency speedups on standard GPUs?",
      "o": [
        "Because GPUs cannot multiply numbers by zero",
        "Standard dense matrix engines (BLAS) execute dense matrix multiplications; randomly scattered zeros require specialized sparse matrix hardware or libraries to translate into speedups",
        "Because pruning causes memory leaks",
        "Because unstructured pruning increases model parameter counts"
      ],
      "a": 1,
      "why": "Dense GEMM routines process dense matrices uniformly. Random irregular zeros require sparse indexing overhead that negates FLOP savings on standard hardware unless structured (e.g. 2:4 sparsity)."
    },
    {
      "q": "What is the central finding of the \"Lottery Ticket Hypothesis\" (Frankle & Carbin, 2018)?",
      "o": [
        "Neural network training is equivalent to a lottery casino",
        "Dense, randomly-initialised networks contain sparse sub-networks that, when trained from their original initialisation, can match the accuracy of the original dense network",
        "Pruned models can never exceed 50% accuracy",
        "Random seeds have zero impact on deep learning performance"
      ],
      "a": 1,
      "why": "The hypothesis proves that dense over-parameterisation serves primarily to help gradient descent find lucky \"winning ticket\" sub-networks during early initialisation."
    },
    {
      "q": "How does structured pruning differ from unstructured pruning?",
      "o": [
        "Structured pruning only works on text data",
        "Structured pruning removes entire architectural channels, filters, or layers, directly shrinking matrix dimensions and yielding universal hardware speedups",
        "Structured pruning sets all weights to 1.0",
        "Structured pruning does not require fine-tuning"
      ],
      "a": 1,
      "why": "Structured pruning drops complete channels or rows, producing smaller dense matrices that run faster on any standard CPU or GPU without sparse execution libraries."
    }
  ],
  "related": [
    "quantisation",
    "knowledge-distillation",
    "lora-and-parameter-efficient-fine-tuning"
  ],
  "keywords": "pruning, sparsity, lottery ticket hypothesis, unstructured pruning, structured pruning, channel pruning, model compression, fine-tuning"
},
  {
  "id": "scaling-laws",
  "short": "Scaling laws for LLMs",
  "title": "Neural Scaling Laws: Chinchilla Optimality, Compute Frontiers, and Power Laws",
  "task": "concepts",
  "level": 2,
  "minutes": 17,
  "noLab": true,
  "usedBy": [],
  "summary": "Predicting downstream model loss using empirical power laws across model parameters $N$, dataset tokens $D$, and FLOP compute budgets $C$.",
  "lead": "Before training large language models that cost tens of millions of pounds in electricity and cloud GPU clusters, AI laboratories cannot rely on trial and error. Neural scaling laws (Kaplan et al., Chinchilla / Hoffmann et al.) demonstrate that cross-entropy loss follows strict, highly predictable mathematical power laws as compute, dataset size, and parameter counts scale over several orders of magnitude.",
  "analogy": "Imagine launching a spacecraft to Mars. Rocket scientists do not guess how much liquid oxygen to pour into the tanks by trial and error on launch day; they calculate trajectory physics equations that accurately predict fuel consumption and escape velocities based on payload mass. Neural scaling laws provide that precise celestial navigation for pretraining large AI models.",
  "intuition": [
    "Empirical studies demonstrate that cross-entropy loss $L$ scales as a power law with three primary factors: parameter count $N$ (excluding embedding layers), training dataset size $D$ (in tokens), and total floating point compute budget $C \\approx 6 N D$.",
    "The Kaplan et al. (OpenAI, 2020) scaling formulation suggested that model parameters $N$ should scale significantly faster than dataset tokens $D$ ($N \\propto C^{0.73}, D \\propto C^{0.27}$), leading to massive under-trained models like GPT-3 (175B parameters trained on only 300B tokens).",
    "Hoffmann et al. (DeepMind Chinchilla, 2022) identified a critical flaw in Kaplan's learning rate schedule assumptions. When properly tuned with cosine schedules matching the training horizon, model size $N$ and token count $D$ should scale in equal, 1:1 proportion: $N \\propto C^{0.5}$ and $D \\propto C^{0.5}$.",
    "Under Chinchilla optimality, for every doubling of compute budget $C$, parameters and training tokens should both increase by $\\sqrt{2} \\approx 1.41\\times$. This proved that earlier models were severely data-starved, leading modern architectures (Llama) to train compact models on trillions of tokens for low inference costs."
  ],
  "steps": [
    "Define total compute budget $C$: Calculate available floating point operations based on cluster size, training duration, and Model FLOPs Utilization (MFU).",
    "Calculate optimal parameter count $N^*$ and token count $D^*$: Apply Chinchilla scaling coefficients ($N^* = G \\cdot (C/6)^a, D^* = G^{-1} \\cdot (C/6)^b$, where $a \\approx b \\approx 0.5$).",
    "Configure cosine learning rate schedule: Set the learning rate decay horizon to match the target token count $D^*$ exactly, ensuring the learning rate decays to 10% of maximum at the final step.",
    "Train small-scale calibration runs: Train small models across $10^{18}$ to $10^{20}$ FLOPs to fit precise empirical power law constants $(A, B, E, \\alpha, \\beta)$ for the specific architecture.",
    "Extrapolate final loss: Project final cross-entropy loss and downstream benchmark capabilities prior to committing multi-million-dollar cluster compute resources.",
    "Consider inference-optimal trade-offs: For models serving millions of customer queries, intentionally over-train beyond the compute-optimal point (e.g. Llama training a 7B model on 2T tokens) to minimise per-token inference serving latency."
  ],
  "math": [
    {
      "h": "Chinchilla Parametric Loss Power Law",
      "tex": "L(N, D) = E + \\frac{A}{N^\\alpha} + \\frac{B}{D^\\beta}",
      "p": "Decomposes cross-entropy loss into irreducible entropy $E$, parameter error decaying as $N^{-\\alpha}$, and data error decaying as $D^{-\\beta}$."
    },
    {
      "h": "Total Training Compute Approximation",
      "tex": "C \\approx 6 N D \\text{ FLOPs} \\quad [\\text{Forward: } 2 N D, \\; \\text{Backward: } 4 N D]",
      "p": "Estimates total pretraining floating point operations for standard Transformer decoder architectures."
    },
    {
      "h": "Compute-Optimal Parameter-Data Allocation",
      "tex": "N^* \\propto C^a, \\quad D^* \\propto C^b, \\quad a = \\frac{\\beta}{\\alpha + \\beta} \\approx 0.50, \\quad b = \\frac{\\alpha}{\\alpha + \\beta} \\approx 0.50",
      "p": "Under optimal resource allocation where $\\alpha \\approx \\beta$, model parameters $N$ and training tokens $D$ should scale at identical rates."
    }
  ],
  "code": "import numpy as np\n\ndef chinchilla_optimal_allocation(compute_budget_flops: float):\n    \"\"\"Calculate compute-optimal parameters N* and tokens D* given total FLOPs budget.\"\"\"\n    # Empirical Chinchilla constants (Hoffmann et al., 2022)\n    # C = 6 * N * D, with N* proportional to C^0.5 and D* proportional to C^0.5\n    # Ratio roughly yields ~20 tokens per parameter at compute optimality\n    tokens_per_param = 20.0\n    \n    # C = 6 * N * (20 * N) = 120 * N^2  =>  N* = sqrt(C / 120)\n    optimal_params = np.sqrt(compute_budget_flops / 120.0)\n    optimal_tokens = optimal_params * tokens_per_param\n    \n    return optimal_params, optimal_tokens\n\n# Scenario 1: Moderate research cluster (1e23 FLOPs)\nc1 = 1e23\nn1, d1 = chinchilla_optimal_allocation(c1)\nprint(\"=== Compute Budget: 1e23 FLOPs ===\")\nprint(f\"Optimal Parameters: {n1 / 1e9:.2f} Billion\")\nprint(f\"Optimal Data Tokens: {d1 / 1e9:.2f} Billion Tokens (~{d1/n1:.0f} tokens/param)\")\n\n# Scenario 2: Frontier cluster scale (1e25 FLOPs)\nc2 = 1e25\nn2, d2 = chinchilla_optimal_allocation(c2)\nprint(\"\\n=== Compute Budget: 1e25 FLOPs ===\")\nprint(f\"Optimal Parameters: {n2 / 1e9:.2f} Billion\")\nprint(f\"Optimal Data Tokens: {d2 / 1e9:.2f} Billion Tokens (~{d2/n2:.0f} tokens/param)\")",
  "keyPoints": [
    "Neural scaling laws allow predicting large model loss from cheap, small-scale experimental runs.",
    "Cross-entropy loss follows strict empirical power laws as compute, data, and parameters scale.",
    "Chinchilla optimality dictates that model parameters and dataset tokens should scale in equal 1:1 proportion ($C^{0.5}$).",
    "For heavy inference serving, over-training smaller models on vast token corpora (inference-optimal) minimises long-term serving costs."
  ],
  "pitfalls": [
    "Decoupling the learning rate schedule from token counts: The Chinchilla law assumes the cosine learning rate decays to minimum at token $D^*$; using a schedule that assumes 10x more tokens distorts optimality.",
    "Confusing training-optimal with inference-optimal: Chinchilla optimises compute during training; if you serve 100M queries per day, spending more training compute to train a smaller model reduces production serving costs.",
    "Data exhaustion limits: Assuming tokens can scale infinitely ignores the looming \"data wall\"—high-quality human language on the internet is finite."
  ],
  "quiz": [
    {
      "q": "What was the major correction that the Chinchilla scaling law (Hoffmann et al., 2022) made to the earlier Kaplan et al. (2020) scaling law?",
      "o": [
        "Chinchilla proved that neural networks should never exceed 1 million parameters",
        "Chinchilla showed that parameters and tokens should scale equally ($C^{0.5}$ and $C^{0.5}$), proving that previous models like GPT-3 were severely undertrained relative to their size",
        "Chinchilla proved that Transformers scale worse than RNNs",
        "Chinchilla showed that compute budget has zero correlation with validation loss"
      ],
      "a": 1,
      "why": "Kaplan suggested scaling parameters 3x faster than tokens. Chinchilla proved both should scale equally ($\\approx 1:1$), showing GPT-3 (175B params on 300B tokens) was data-starved."
    },
    {
      "q": "What is the relationship between model parameters $N$, dataset tokens $D$, and total training FLOPs $C$ for a standard Transformer?",
      "o": [
        "$C = N + D$",
        "$C \\approx 6 N D$ FLOPs (2 FLOPs per parameter on forward pass, 4 on backward pass)",
        "$C = \\log(N) \\times \\log(D)$",
        "$C = 65,536 \\times N$"
      ],
      "a": 1,
      "why": "Forward pass matrix multiplication requires $\\approx 2 N$ operations per token; backward pass requires $\\approx 4 N$ (computing parameter and activation gradients), totaling $\\approx 6 N D$."
    },
    {
      "q": "Why do modern production models like Llama deliberately train far past the compute-optimal Chinchilla point (e.g. 7B params trained on 2 trillion tokens)?",
      "o": [
        "Because the engineers forgot to stop the training script",
        "To optimise for inference: smaller models are drastically cheaper and faster to serve to millions of live users, justifying extra upfront training compute",
        "Because Chinchilla laws do not apply to open-source models",
        "To compress the model into a zip archive"
      ],
      "a": 1,
      "why": "Inference-optimal scaling invests more compute during training to compress capability into smaller models, minimising inference latency and GPU serving costs over billions of queries."
    }
  ],
  "related": [
    "the-pytorch-training-loop",
    "lora-and-parameter-efficient-fine-tuning",
    "quantisation"
  ],
  "keywords": "scaling laws, chinchilla optimality, kaplan, power laws, flops, compute budget, large language models, inference optimal, token parameter ratio"
},
  {
  "id": "uncertainty-mc-dropout-and-deep-ensembles",
  "short": "MC dropout & deep ensembles",
  "title": "Uncertainty Estimation in Deep Learning: Monte Carlo Dropout and Deep Ensembles",
  "task": "concepts",
  "level": 3,
  "minutes": 18,
  "noLab": true,
  "usedBy": [],
  "summary": "Distinguishing epistemic (model) and aleatoric (data) uncertainty in deep neural networks using Bayesian MC Dropout and Deep Ensembles.",
  "lead": "Standard deep neural networks are notoriously overconfident: a model outputting a 99% softmax probability for cancer diagnosis might be completely guessing when presented with an unseen scan artifact. In high-stakes applications (autonomous driving, medical diagnosis, algorithmic trading), models must know when they do not know. Monte Carlo Dropout and Deep Ensembles provide practical, scalable frameworks for quantifying predictive uncertainty.",
  "analogy": "Imagine consulting a medical panel. A single deterministic doctor might glance at a scan and state with 99% confidence that no tumour exists. If you consult an ensemble of five independent doctors, and three see nothing while two express grave concern, their disagreement immediately reveals high epistemic uncertainty, prompting a mandatory biopsy.",
  "intuition": [
    "Uncertainty decomposes into two distinct types: Aleatoric Uncertainty (inherent noise in the data, e.g. blurry image sensors or ambient audio static, which cannot be reduced by collecting more data) and Epistemic Uncertainty (uncertainty due to lack of knowledge in regions where training data is sparse, which can be eliminated with more data).",
    "Standard deep networks collapse epistemic uncertainty by learning a single point estimate of weights $\\theta$. True Bayesian neural networks place a prior distribution over weights $P(\\theta)$ and infer the posterior $P(\\theta \\mid \\mathcal{D})$, but exact Bayesian inference is computationally intractable.",
    "Monte Carlo Dropout (Gal & Ghahramani, 2016) shows that keeping standard dropout active during inference is mathematically equivalent to approximate variational inference in a deep Gaussian process. Passing the same test sample through the network $T$ times with random dropout masks samples from the predictive distribution.",
    "Deep Ensembles (Lakshminarayanan et al.) train $M$ identical neural networks from different random initialisations. Ensembles explore distinct local minima in the non-convex loss landscape, consistently outperforming MC Dropout in calibration, out-of-distribution (OOD) detection, and uncertainty quality."
  ],
  "steps": [
    "Decompose target uncertainty: Determine whether the application requires aleatoric uncertainty (predicting conditional variance $\\sigma^2(x)$) or epistemic uncertainty (model disagreement).",
    "Select uncertainty architecture: Choose MC Dropout (low training cost; single model with stochastic inference) or Deep Ensembles (highest quality; $M=5$ models trained independently).",
    "Predict aleatoric variance: Modify the network output layer to emit both mean $\\mu(x)$ and log-variance $s(x) = \\log \\sigma^2(x)$, trained with Gaussian negative log-likelihood loss.",
    "Execute stochastic inference: In MC Dropout, enable `model.train()` or keep `p > 0` active during test time; pass query input $T$ times ($T \\approx 30\\text{--}50$). In Ensembles, pass query through all $M$ models.",
    "Compute predictive statistics: Calculate the predictive mean $\\bar{y} = \\frac{1}{M} \\sum_m \\mu_m(x)$ and total predictive variance $\\operatorname{Var}(y) = \\text{Aleatoric} + \\text{Epistemic}$.",
    "Trigger safety fallback: If epistemic variance exceeds safety threshold $\\tau_{\\mathrm{safe}}$, route the sample to human expert review or fail-safe operational modes."
  ],
  "math": [
    {
      "h": "Total Predictive Variance Decomposition (Law of Total Variance)",
      "tex": "\\operatorname{Var}(y^* \\mid x^*) = \\underbrace{\\frac{1}{M} \\sum_{m=1}^M \\sigma_m^2(x^*)}_{\\text{Expected Aleatoric Noise}} + \\underbrace{\\frac{1}{M} \\sum_{m=1}^M \\left( \\mu_m(x^*) - \\bar{\\mu}(x^*) \\right)^2}_{\\text{Epistemic Model Disagreement}}",
      "p": "Total predictive uncertainty decomposes into the mean predicted data variance (aleatoric) plus the variance of individual model predictions (epistemic)."
    },
    {
      "h": "Aleatoric Heteroscedastic Negative Log-Likelihood Loss",
      "tex": "\\mathcal{L}_{\\mathrm{NLL}}(x_i, y_i) = \\frac{1}{2} \\exp(-s_i) \\| y_i - \\mu_i \\|^2 + \\frac{1}{2} s_i, \\quad s_i = \\ln \\sigma_i^2",
      "p": "Forces the network to learn input-dependent noise variance $\\sigma_i^2$ without requiring explicit variance ground-truth labels."
    },
    {
      "h": "MC Dropout Variational Approximation",
      "tex": "P(y^* \\mid x^*, \\mathcal{D}) \\approx \\frac{1}{T} \\sum_{t=1}^T f_{\\hat{\\mathbf{W}}_t}(x^*), \\quad \\hat{\\mathbf{W}}_t = \\mathbf{W} \\cdot \\operatorname{diag}(z_t), \\; z_{t,j} \\sim \\operatorname{Bernoulli}(1 - p)",
      "p": "Averaging $T$ forward passes with stochastic dropout masks approximates marginalisation over the weight posterior."
    }
  ],
  "code": "import torch\nimport torch.nn as nn\nimport numpy as np\n\nclass MCDropoutModel(nn.Module):\n    def __init__(self, in_features: int = 1, hidden: int = 64):\n        super().__init__()\n        self.net = nn.Sequential(\n            nn.Linear(in_features, hidden),\n            nn.ReLU(),\n            nn.Dropout(p=0.3),  # Dropout kept active during inference!\n            nn.Linear(hidden, hidden),\n            nn.ReLU(),\n            nn.Dropout(p=0.3),\n            nn.Linear(hidden, 1)\n        )\n\n    def forward(self, x: torch.Tensor):\n        return self.net(x)\n\n    def predict_uncertainty(self, x: torch.Tensor, n_samples: int = 30):\n        \"\"\"Execute MC Dropout: force dropout active and sample T passes.\"\"\"\n        self.train()  # Crucial: enable dropout during inference\n        preds = []\n        with torch.no_grad():\n            for _ in range(n_samples):\n                preds.append(self.forward(x))\n        # [n_samples, batch, 1]\n        preds_tensor = torch.stack(preds)\n        mean = preds_tensor.mean(dim=0)\n        epistemic_var = preds_tensor.var(dim=0)\n        return mean, epistemic_var\n\n# Simulate test query\nmodel = MCDropoutModel()\nx_test = torch.tensor([[2.5]])  # Point in unseen region\nmean, variance = model.predict_uncertainty(x_test, n_samples=50)\n\nprint(f\"MC Dropout Predictive Mean:     {mean.item():.3f}\")\nprint(f\"Epistemic Variance (Disagreement): {variance.item():.4f}\")\nprint(\"High variance indicates model uncertainty in out-of-distribution regions!\")",
  "keyPoints": [
    "Standard deep networks produce overconfident probabilities; uncertainty estimation quantifies predictive confidence.",
    "Aleatoric uncertainty measures inherent data noise; Epistemic uncertainty measures model lack of knowledge.",
    "MC Dropout enables dropout during test time, sampling stochastic forward passes to approximate Bayesian posteriors.",
    "Deep Ensembles train multiple randomly-initialised models, providing state-of-the-art uncertainty and OOD detection."
  ],
  "pitfalls": [
    "Disabling dropout at test time: Calling `model.eval()` disables standard dropout, collapsing MC Dropout back into a single deterministic point estimate.",
    "Assuming softmax probability equals confidence: In neural networks, an out-of-distribution point can produce 99.9% softmax probability due to unconstrained logit extrapolation.",
    "Computational inference cost: Running 50 MC Dropout passes or 5 ensemble models multiplies inference latency by $5\\times$ to $50\\times$."
  ],
  "quiz": [
    {
      "q": "What is the fundamental difference between Aleatoric Uncertainty and Epistemic Uncertainty?",
      "o": [
        "Aleatoric uncertainty is measured in decibels, while epistemic is measured in pixels",
        "Aleatoric uncertainty is inherent data noise that cannot be reduced by collecting more data; Epistemic uncertainty reflects model lack of knowledge and shrinks with more data",
        "Aleatoric uncertainty only applies to text models",
        "Epistemic uncertainty can only be calculated with decision trees"
      ],
      "a": 1,
      "why": "Aleatoric is sensor/data noise (irreducible). Epistemic is model parameter uncertainty in sparse data regions, which vanishes as infinite training data is observed."
    },
    {
      "q": "How does Monte Carlo Dropout (Gal & Ghahramani, 2016) estimate uncertainty at test time?",
      "o": [
        "By dropping out random input images from the test set",
        "By keeping dropout layers active during inference and passing the same query through the network multiple times to observe output variance across stochastic masks",
        "By retraining the network on every test sample",
        "By calculating the determinant of the Hessian"
      ],
      "a": 1,
      "why": "MC Dropout keeps dropout active during inference, using repeated forward passes to approximate sampling from a deep Gaussian process posterior."
    },
    {
      "q": "Why do Deep Ensembles consistently outperform MC Dropout in real-world benchmark evaluations?",
      "o": [
        "Deep ensembles use fewer parameters than single models",
        "Ensemble models start from different random initialisations and explore diverse, distant local minima in the loss landscape, whereas MC Dropout samples locally around a single minimum",
        "Ensembles do not require training",
        "Ensembles guarantee zero prediction error"
      ],
      "a": 1,
      "why": "MC Dropout perturbs weights around a single basin of attraction. Deep ensembles explore entirely different functional modes in the loss surface, capturing diverse hypotheses."
    }
  ],
  "related": [
    "conformal-prediction",
    "bayesian-networks",
    "the-pytorch-training-loop"
  ],
  "keywords": "uncertainty estimation, mc dropout, deep ensembles, epistemic uncertainty, aleatoric uncertainty, bayesian deep learning, out-of-distribution, overconfidence"
},
  {
  "id": "interpretability-saliency-grad-cam-probing",
  "short": "Saliency, Grad-CAM & probing",
  "title": "Deep Learning Interpretability: Saliency Maps, Grad-CAM, Integrated Gradients, and Probing Classifiers",
  "task": "concepts",
  "level": 3,
  "minutes": 18,
  "noLab": true,
  "usedBy": [],
  "summary": "Opening deep neural network black boxes using gradient attribution (Grad-CAM, Integrated Gradients) and internal representation probing.",
  "lead": "Deep neural networks are frequently dismissed as opaque \"black boxes\": a convolutional network classifies an X-ray as pneumonia, or a Transformer classifies a legal contract as high risk, without revealing which input features drove the decision. Post-hoc interpretability methods bridge this opacity by attributing predictions back to input pixels/tokens (Saliency, Grad-CAM, Integrated Gradients) and dissecting internal layers via probing classifiers.",
  "analogy": "Imagine a detective interrogating a witness who claims to identify a suspect in a photo lineup. If the detective simply accepts the witness's verdict without question, the witness might secretly be identifying the suspect based on their background wall colour. Interpretability methods act like heat-vision eye trackers (Grad-CAM) that show where the witness looked, and targeted cognitive tests (probing) that verify what details the witness actually observed.",
  "intuition": [
    "Gradient-based saliency computes the gradient of target class score $y^c$ with respect to input pixels: $\\frac{\\partial y^c}{\\partial x}$. However, vanilla saliency maps are extremely noisy and suffer from gradient saturation (a feature already fully active has near-zero gradient).",
    "Integrated Gradients (Sundararajan et al.) solves gradient saturation by satisfying the Axiom of Completeness: it integrates gradients along a straight line path from a neutral blank baseline $x'$ (e.g. black image) to input $x$. The sum of all feature attributions equals the exact difference in model output: $\\sum_i \\text{IG}_i(x) = f(x) - f(x')$.",
    "Grad-CAM (Gradient-weighted Class Activation Mapping; Selvaraju et al.) operates on convolutional feature maps. It averages gradients flowing into convolutional activation channels to weight each feature map, generating coarse, class-discriminative visual heatmaps highlighting which spatial regions triggered the decision.",
    "Probing Classifiers (Linear Probes) analyse representation learning in deep layers (e.g. inside Transformers): freezing the pretrained representations and training a lightweight linear classifier to test whether concepts like grammatical syntax, part of speech, or sentiment are linearly separable at layer $L$."
  ],
  "steps": [
    "Select attribution scope: Choose spatial heatmaps for vision (Grad-CAM), feature attributions for tabular/NLP (Integrated Gradients), or internal concept auditing (Linear Probes).",
    "Define baseline reference (Integrated Gradients): Select a neutral counterfactual baseline $x'$ (e.g. an all-black image or all-zero embedding vector).",
    "Compute path integral (Integrated Gradients): Interpolate $M$ steps along the straight line from $x'$ to $x$; compute input gradients at each step and approximate the integral via Riemann sum.",
    "Compute channel weights (Grad-CAM): Backpropagate target class logit $y^c$ to the final convolutional layer; compute global average pooling across spatial dimensions to yield channel importance $\\alpha_k^c$.",
    "Generate Grad-CAM heatmap: Take the linear combination of convolutional activation maps weighted by $\\alpha_k^c$, and apply ReLU to isolate features with positive influence.",
    "Train linear probe (Representation Probing): Freeze the backbone model, extract activations at layer $L$ across a probing dataset, and train a logistic regression probe to evaluate concept encoding."
  ],
  "math": [
    {
      "h": "Integrated Gradients Formulation",
      "tex": "\\mathrm{IG}_i(x) = (x_i - x'_i) \\times \\int_0^1 \\frac{\\partial F(x' + \\alpha (x - x'))}{\\partial x_i} \\, d\\alpha",
      "p": "Integrates gradients along the interpolation path from baseline $x'$ to input $x$, satisfying the Axiom of Completeness."
    },
    {
      "h": "Axiom of Completeness (Attribution Additivity)",
      "tex": "\\sum_{i=1}^D \\mathrm{IG}_i(x) = F(x) - F(x')",
      "p": "The sum of all feature attributions exactly equals the difference between the model output on input $x$ and baseline $x'$."
    },
    {
      "h": "Grad-CAM Class Activation Mapping",
      "tex": "L_{\\mathrm{Grad\\text{-}CAM}}^c = \\operatorname{ReLU}\\left( \\sum_k \\alpha_k^c A^k \\right), \\quad \\alpha_k^c = \\frac{1}{Z} \\sum_{i} \\sum_{j} \\frac{\\partial y^c}{\\partial A_{ij}^k}",
      "p": "Weights convolutional feature map $A^k$ by global-average-pooled gradient $\\alpha_k^c$, applying ReLU to retain features that positively support class $c$."
    }
  ],
  "code": "import torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\nclass MiniConvNet(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.conv = nn.Conv2d(1, 4, kernel_size=3, padding=1)\n        self.fc = nn.Linear(4 * 4 * 4, 2)\n\n    def forward(self, x):\n        h = F.relu(self.conv(x))\n        out = self.fc(h.view(h.size(0), -1))\n        return out, h  # Return logits and final conv activations\n\ndef compute_grad_cam(model: nn.Module, x: torch.Tensor, target_class: int):\n    \"\"\"Educational demonstration of Grad-CAM spatial heatmap computation.\"\"\"\n    model.eval()\n    logits, activations = model(x)\n    score = logits[0, target_class]\n    \n    # Compute gradients of target class with respect to conv activations\n    grads = torch.autograd.grad(score, activations)[0]\n    \n    # Global average pooling of gradients over spatial dimensions (H, W)\n    weights = torch.mean(grads, dim=(2, 3), keepdim=True)  # [1, channels, 1, 1]\n    \n    # Weighted combination of activation maps\n    cam = torch.sum(weights * activations, dim=1, keepdim=True)\n    cam = F.relu(cam)  # Isolate positive contributions\n    cam = cam - cam.min()\n    cam = cam / (cam.max() + 1e-8)  # Normalise between 0 and 1\n    return cam.squeeze().detach().numpy()\n\n# Test Grad-CAM on synthetic 4x4 input image\ntorch.manual_seed(42)\nmodel = MiniConvNet()\ninput_image = torch.randn(1, 1, 4, 4, requires_grad=True)\n\nheatmap = compute_grad_cam(model, input_image, target_class=1)\nprint(\"Grad-CAM Spatial Heatmap (4x4 grid):\")\nprint(np.round(heatmap, 2))\nprint(\"Heatmap highlights the most influential spatial regions driving Class 1!\")",
  "keyPoints": [
    "Interpretability methods open deep network black boxes, providing post-hoc explanations for predictions.",
    "Integrated Gradients solves gradient saturation, ensuring attributions sum to the total prediction difference.",
    "Grad-CAM weights convolutional feature maps by backpropagated gradients to generate class-specific visual heatmaps.",
    "Linear probing evaluates whether internal layer representations linearly encode semantic concepts."
  ],
  "pitfalls": [
    "Edge detection artifacts in vanilla saliency: Simple input gradients $\\frac{\\partial y}{\\partial x}$ often act like high-pass edge detectors, highlighting image boundaries rather than semantic features.",
    "Poor baseline choice in Integrated Gradients: Choosing an inappropriate baseline (e.g. pure white image when text is white) distorts attribution values; use multiple neutral baselines.",
    "Confusing explanation with correctness: A model can produce a beautifully intuitive Grad-CAM explanation while being fundamentally flawed or reliant on confounding correlations."
  ],
  "quiz": [
    {
      "q": "What is the \"gradient saturation\" problem in vanilla gradient saliency maps, and how does Integrated Gradients solve it?",
      "o": [
        "Gradients overflow to infinity; Integrated Gradients divides by zero",
        "Once a feature is strong enough to push model output into saturation (e.g. sigmoid plateaus near 1.0), its local gradient becomes zero; Integrated Gradients integrates gradients along a path from a neutral baseline",
        "Integrated Gradients only works on text models",
        "Gradient saturation causes the CPU to overheat"
      ],
      "a": 1,
      "why": "In saturated non-linearities, local gradients vanish even though the feature is critical. Integrated Gradients accumulates gradients along a path from a blank baseline to the input."
    },
    {
      "q": "Why does Grad-CAM apply the ReLU activation function to the weighted combination of feature maps?",
      "o": [
        "To ensure all numbers are integers",
        "To isolate features that positively contribute to the target class, discarding features that support competing alternative classes",
        "To speed up GPU matrix multiplication",
        "Because ReLU is required by PyTorch"
      ],
      "a": 1,
      "why": "Grad-CAM applies ReLU because pixels that negatively correlate with the class belong to other categories; ReLU keeps only positive evidence."
    },
    {
      "q": "What is a \"Probing Classifier\" (Linear Probe) used for in deep learning analysis?",
      "o": [
        "To test hardware temperature inside server racks",
        "To test whether specific linguistic or semantic concepts are linearly encoded within the intermediate representations of a frozen pretrained neural network",
        "To prune 90% of model weights",
        "To encrypt model weights"
      ],
      "a": 1,
      "why": "A linear probe freezes internal layers and trains a simple linear model to see if intermediate activations linearly separate specific attributes (e.g. part of speech, sentiment)."
    }
  ],
  "related": [
    "shap",
    "lime",
    "pdp-ice-and-ale-plots"
  ],
  "keywords": "interpretability, saliency maps, grad-cam, integrated gradients, linear probing, explainable ai, black box, attribution, class activation mapping"
},
  {
  "id": "adversarial-examples",
  "short": "Adversarial examples & attacks",
  "title": "Adversarial Examples and Robustness: FGSM, PGD Attacks, and Adversarial Training",
  "task": "concepts",
  "level": 3,
  "minutes": 18,
  "noLab": true,
  "usedBy": [],
  "summary": "Evaluating neural network vulnerabilities, generating imperceptible perturbations via FGSM and PGD, and defending models with robust min-max training.",
  "lead": "Deep neural networks achieve superhuman accuracy on benchmark test sets, yet they can be reliably fooled by imperceptible, adversarially crafted noise. Adding tiny, invisible perturbations to an image of a panda can cause a state-of-the-art classifier to predict \"gibbon\" with 99.9% confidence. Adversarial machine learning studies these fundamental vulnerabilities, creating attacks (FGSM, PGD) and defenses (Adversarial Training) to build reliable, safety-critical AI systems.",
  "analogy": "Imagine a high-security facial recognition lock at a military base. To the human eye, an operative wearing an ordinary pair of sunglasses looks completely normal. But microscopic, mathematically calculated iridescent patterns on the sunglass frames reflect light in an exact wave pattern that flips the security system's deep neural network weights, causing the scanner to identify the operative as the base general.",
  "intuition": [
    "Adversarial examples arise from the high-dimensional geometry of neural networks. While activations are non-linear, deep networks operate with high-dimensional linear dot products $w^T x$. If an attacker shifts each of $D=10,000$ input dimensions by an imperceptible epsilon $\\epsilon = 0.005$ in the direction of the weight vector, the cumulative activation shifts by $\\epsilon \\sum |w_i|$, which can be massive.",
    "The Fast Gradient Sign Method (FGSM; Goodfellow et al.) computes an adversarial perturbation in a single gradient step: $x_{\\mathrm{adv}} = x + \\epsilon \\cdot \\operatorname{sign}(\\nabla_x \\mathcal{L}(\\theta, x, y))$. It steps in the direction that maximises loss while constraining the maximum change per pixel within the $L_\\infty$ ball $\\|x_{\\mathrm{adv}} - x\\|_\\infty \\le \\epsilon$.",
    "Projected Gradient Descent (PGD; Madry et al.) is the multi-step iterative extension of FGSM: taking multiple small steps with step size $\\alpha$ and projecting back onto the $\\epsilon$-ball after each step. PGD represents the \"universal first-order adversary\"—the strongest possible attack using local gradient information.",
    "Defending against adversarial attacks cannot rely on heuristic obfuscation (which merely hides gradients without true robustness). The gold standard defense is Adversarial Training: framing training as a robust Min-Max optimisation problem $\\min_\\theta \\mathbb{E} [ \\max_{\\delta \\in \\mathcal{S}} \\mathcal{L}(\\theta, x + \\delta, y) ]$, training the network on worst-case PGD perturbations."
  ],
  "steps": [
    "Define threat model and perturbation budget: Specify the perturbation norm ($L_\\infty$ or $L_2$) and budget $\\epsilon$ (e.g. $\\epsilon = 8/255$ for 8-bit images).",
    "Compute input gradients: Pass clean image $x$ through network, compute classification loss $\\mathcal{L}(f_\\theta(x), y)$, and evaluate gradient with respect to input: $\\nabla_x \\mathcal{L}$.",
    "Generate FGSM perturbation: Multiply the sign of the input gradient by $\\epsilon$: $\\delta = \\epsilon \\cdot \\operatorname{sign}(\\nabla_x \\mathcal{L})$.",
    "Execute multi-step PGD attack: Iterate $K$ steps ($K \\approx 10\\text{--}40$): step by $\\alpha \\cdot \\operatorname{sign}(\\nabla_x \\mathcal{L})$, clip to the $\\epsilon$-ball around $x$, and clip to valid image bounds $[0, 1]$.",
    "Implement adversarial training: In every training minibatch, generate on-the-fly PGD adversarial perturbations and update model weights $\\theta$ on the perturbed inputs.",
    "Evaluate robust vs clean accuracy: Measure clean test accuracy (on unperturbed images) alongside robust test accuracy against white-box and black-box PGD attacks."
  ],
  "math": [
    {
      "h": "Fast Gradient Sign Method (FGSM)",
      "tex": "x_{\\mathrm{adv}} = x + \\epsilon \\cdot \\operatorname{sign}\\left( \\nabla_x \\mathcal{L}(\\theta, x, y) \\right), \\quad \\|x_{\\mathrm{adv}} - x\\|_\\infty \\le \\epsilon",
      "p": "Shifts input $x$ by $\\epsilon$ in the direction of steepest loss ascent, bounded by maximum per-pixel perturbation $\\epsilon$."
    },
    {
      "h": "Projected Gradient Descent (PGD) Iteration",
      "tex": "x^{(t+1)} = \\Pi_{x + \\mathcal{S}}\\left( x^{(t)} + \\alpha \\cdot \\operatorname{sign}\\left( \\nabla_x \\mathcal{L}(\\theta, x^{(t)}, y) \\right) \\right)",
      "p": "Iterative multi-step attack with step size $\\alpha$, projecting ($\\Pi$) back into the valid $\\epsilon$-neighbourhood $\\mathcal{S}$ after each step."
    },
    {
      "h": "Robust Min-Max Adversarial Training Objective",
      "tex": "\\min_\\theta \\mathbb{E}_{(x, y) \\sim \\mathcal{D}}\\left[ \\max_{\\|\\delta\\|_p \\le \\epsilon} \\mathcal{L}\\left( f_\\theta(x + \\delta), \\; y \\right) \\right]",
      "p": "Finds network parameters $\\theta$ that minimise the expected loss on the worst-case adversarial perturbation $\\delta$ within budget $\\epsilon$."
    }
  ],
  "code": "import torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\ndef fgsm_attack(image: torch.Tensor, epsilon: float, data_grad: torch.Tensor) -> torch.Tensor:\n    \"\"\"Generate adversarial example using Fast Gradient Sign Method (FGSM).\"\"\"\n    # 1. Extract element-wise sign of the input gradients\n    sign_data_grad = data_grad.sign()\n    \n    # 2. Shift image in direction of loss ascent\n    perturbed_image = image + epsilon * sign_data_grad\n    \n    # 3. Clip to maintain valid pixel range [0, 1]\n    perturbed_image = torch.clamp(perturbed_image, 0.0, 1.0)\n    return perturbed_image\n\n# Test FGSM attack on toy linear classifier\ntorch.manual_seed(42)\nx = torch.tensor([[0.5, 0.2]], requires_grad=True)\ntrue_label = torch.tensor([0])\n\n# Model that predicts class 0 if x[0] > x[1]\nweights = torch.tensor([[2.0, -2.0]])  # Logit for class 0\nlogits = x @ weights.T\nloss = F.cross_entropy(logits, true_label)\nloss.backward()\n\nprint(\"Original prediction logit for Class 0:\", round(logits.item(), 3))\nprint(\"Input gradient wrt loss:\", x.grad.numpy())\n\n# Apply FGSM perturbation with epsilon = 0.15\nx_adv = fgsm_attack(x, epsilon=0.15, data_grad=x.grad)\nlogits_adv = x_adv @ weights.T\n\nprint(\"Adversarial input coordinates:\", x_adv.detach().numpy())\nprint(\"Adversarial logit for Class 0: \", round(logits_adv.item(), 3))\nprint(\"Prediction confidence successfully degraded by tiny perturbation!\")",
  "keyPoints": [
    "Adversarial examples fool neural networks using imperceptible, mathematically targeted perturbations.",
    "FGSM computes adversarial noise in a single step using the sign of the input gradient.",
    "Projected Gradient Descent (PGD) is a powerful multi-step iterative attack that bounds perturbations to an $\\epsilon$-ball.",
    "Adversarial training frames learning as a min-max game, training on worst-case perturbations to build genuine robustness."
  ],
  "pitfalls": [
    "Gradient masking / obfuscation: Techniques that make gradients noisy (e.g. random input resizing) create a false sense of security; attackers easily bypass them with Expectation Over Transformation (EOT).",
    "The clean vs robust accuracy trade-off: Adversarial training typically reduces standard clean accuracy by 2%–8% because the model must learn smoother, wider decision boundaries.",
    "Testing robustness only with FGSM: Defending against single-step FGSM does not protect against multi-step PGD attacks; always evaluate against PGD and AutoAttack."
  ],
  "quiz": [
    {
      "q": "Why are deep neural networks vulnerable to adversarial examples even when the perturbation $\\epsilon$ on each individual pixel is imperceptibly small?",
      "o": [
        "Because GPUs make arithmetic calculation errors",
        "In high-dimensional input spaces (e.g. 100,000 pixels), tiny perturbations across thousands of dimensions accumulate linearly in dot products, causing massive shifts in pre-activation logits",
        "Because neural networks have zero bias terms",
        "Because images lose colour depth during normalisation"
      ],
      "a": 1,
      "why": "In high dimensions, shifting $D$ inputs by $\\epsilon$ in the direction of weight signs accumulates to an aggregate pre-activation change of $\\epsilon \\sum |w_i|$, which easily flips decisions."
    },
    {
      "q": "What is the Fast Gradient Sign Method (FGSM)?",
      "o": [
        "A compression algorithm for saving model weights",
        "A single-step adversarial attack that perturbs input $x$ by $\\epsilon \\cdot \\operatorname{sign}(\\nabla_x \\mathcal{L})$ in the direction of steepest loss ascent",
        "A fast optimiser that replaces AdamW",
        "A method for generating random Gaussian noise"
      ],
      "a": 1,
      "why": "FGSM takes one step along the sign of the gradient of the loss with respect to the input, maximising loss within the $L_\\infty$ ball $\\epsilon$."
    },
    {
      "q": "What is the mathematically grounded method for making neural networks genuinely robust against first-order adversarial attacks?",
      "o": [
        "Rounding all floating point numbers to integers",
        "Adversarial Training: formulating training as a min-max optimisation problem where the model trains on worst-case PGD perturbations generated on the fly",
        "Adding random Gaussian noise to test images",
        "Hiding the model code behind a firewall"
      ],
      "a": 1,
      "why": "Adversarial training solves the robust min-max problem $\\min_\\theta \\max_\\delta \\mathcal{L}$, forcing the network to maintain low loss within the entire $\\epsilon$-neighbourhood."
    }
  ],
  "related": [
    "the-pytorch-training-loop",
    "loss-functions",
    "activation-functions"
  ],
  "keywords": "adversarial examples, fgsm, pgd, adversarial training, perturbation, robust optimisation, gradient sign, security, robustness"
},
];
