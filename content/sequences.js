// Sequence models: RNN -> GRU -> LSTM -> Transformer. See regression.js for conventions.
const r = String.raw;

const digitsLoad = r`import torch, torch.nn as nn
from sklearn.datasets import load_digits

# read each 8x8 digit image as a sequence: 8 time steps, 8 pixels per step
digits = load_digits()
X = torch.tensor(digits.images / 16.0, dtype=torch.float32)    # (n, 8, 8)
y = torch.tensor(digits.target)`;

module.exports = [
  {
    id: 'recurrent_neural_networks', explainer: 'rnn', short: 'RNNs', title: 'Recurrent Neural Networks (RNNs)',
    task: 'classification', module: 'Sequences', level: 2, minutes: 18,
    summary: r`A network with a memory: it reads a sequence one step at a time and carries a hidden state forward. Simple, and forgetful.`,
    lead: r`An RNN reads a sequence one item at a time. At every step it mixes the new input with a running summary of everything so far, the <strong>hidden state</strong> $h_t$, and passes that summary on to the next step.`,
    intuition: [
      r`Feed-forward networks see a fixed-size input all at once. Text, speech, sensor readings and prices arrive as sequences of any length, where order matters. An RNN handles this with one small trick: the same cell is applied at every step, and its output at step $t$ becomes part of its input at step $t+1$.`,
      r`Think of $h_t$ as a short note the network keeps updating as it reads. With one hidden unit, $h_t = \tanh(w\,h_{t-1} + u\,x_t)$. If the recurrent weight $|w| < 1$, an input from 10 steps ago has been multiplied by $w$ ten times, so it fades: $0.8^{10} \approx 0.1$. If $|w| > 1$ things blow up (and tanh saturates). Training has the same problem in reverse: gradients flowing back through time shrink or explode, so vanilla RNNs struggle to learn anything that spans more than a handful of steps. That is the problem [[gru_networks|GRUs]] and [[lstm_networks|LSTMs]] were built to solve.`,
    ],
    analogy: r`Reading a book while only allowed to keep a single sticky note: every page you overwrite a little of it, so early chapters slowly blur away.`,
    steps: [
      r`Start with $h_0 = 0$.`,
      r`At each step, combine the previous state and the new input: $h_t = \tanh(W_h h_{t-1} + W_x x_t + b)$. The same weights are reused at every step.`,
      r`Read out what you need: the last state $h_T$ for classifying a whole sequence, or every $h_t$ for tagging each step.`,
      r`Train with backpropagation through time (BPTT): unroll the loop into a deep network with shared weights and backpropagate through it.`,
      r`Clip gradients to stop explosions; use a GRU or LSTM when you need longer memory.`,
    ],
    math: [
      { h: 'The recurrence', tex: r`$$h_t = \tanh(W_h\,h_{t-1} + W_x\,x_t + b), \qquad \hat y = \operatorname{softmax}(W_o\,h_T + c)$$`, p: r`$W_h$, $W_x$ and $b$ are shared across all time steps, so the parameter count does not grow with sequence length.` },
      { h: 'Why memory fades (and gradients vanish)', tex: r`$$\frac{\partial h_T}{\partial h_k} = \prod_{t=k+1}^{T} \operatorname{diag}\!\big(1 - h_t^2\big)\,W_h$$`, p: r`A product of $T - k$ matrices. If their size is below 1 the product shrinks exponentially with distance (vanishing); above 1 it grows (exploding). The lab shows exactly this product for a one-unit RNN.` },
    ],
    hyper: [[r`hidden_size`, r`Size of the memory vector $h_t$.`, r`32–256.`], [r`num_layers`, r`Stacked recurrent layers.`, r`1–2.`], [r`nonlinearity`, r`tanh or relu.`, r`tanh (relu explodes more easily).`], [r`gradient clipping`, r`Caps gradient norm during BPTT.`, r`clip_grad_norm_ at 1.0.`]],
    pros: ['Handles sequences of any length with a fixed number of parameters.', 'Small, simple and fast per step; natural for streaming data.', 'The conceptual base for GRUs and LSTMs.'],
    cons: ['Short memory: vanishing gradients after roughly 10–20 steps.', 'Exploding gradients without clipping.', 'Sequential: each step waits for the previous one, so training does not parallelise over time.'],
    use: r`Short sequences, streaming or on-device settings where a tiny model matters, or to understand the ideas behind gated RNNs.`,
    avoid: r`Anything that needs long-range memory; use a [[lstm_networks|LSTM]], [[gru_networks|GRU]] or [[transformer_networks|Transformer]].`,
    complexity: [r`$O(T\,d^2)$ per sequence, sequential in $T$`, r`$O(d^2)$ per step`],
    glance: { learns: 'Shared input, recurrent and output weights', family: 'Recurrent network' },
    code: digitsLoad + r`

class RNNClassifier(nn.Module):
    def __init__(self, hidden=64):
        super().__init__()
        self.rnn = nn.RNN(input_size=8, hidden_size=hidden, batch_first=True)
        self.out = nn.Linear(hidden, 10)

    def forward(self, x):
        states, h_last = self.rnn(x)        # states: every h_t, h_last: final h_T
        return self.out(h_last[-1])

model = RNNClassifier()
opt = torch.optim.Adam(model.parameters(), lr=2e-3)
for epoch in range(30):
    opt.zero_grad()
    loss = nn.functional.cross_entropy(model(X), y)
    loss.backward()
    nn.utils.clip_grad_norm_(model.parameters(), 1.0)     # tame exploding gradients
    opt.step()`,
    pitfalls: [r`Forgetting gradient clipping and watching the loss jump to NaN.`, r`Expecting a vanilla RNN to remember something from 50 steps ago.`, r`Padding variable-length sequences and letting the padding flow into $h_T$; use packed sequences or masks.`],
    quiz: [
      {
        q: r`What makes an RNN "recurrent"?`,
        o: [
          r`It has many layers`,
          r`Its hidden state from the previous step is fed back in at the next step`,
          r`It uses convolutions over time`,
          r`It reads the sequence backwards`,
        ],
        a: 1,
        why: r`The loop $h_{t-1} \to h_t$ with shared weights is the defining feature.`,
        d: 1,
      },
      {
        q: r`With a recurrent weight of 0.5, roughly how much of an input survives 5 steps later (ignoring tanh)?`,
        o: [
          r`50%`,
          r`10%`,
          r`About 3%`,
          r`All of it`,
        ],
        a: 2,
        why: r`$0.5^5 = 0.03$. Memory fades geometrically.`,
        d: 2,
      },
      {
        q: r`Why does a vanilla RNN struggle with long-range dependencies?`,
        o: [
          r`It has too few parameters`,
          r`Gradients are multiplied by the recurrent Jacobian at every step and shrink or explode`,
          r`It cannot process long inputs`,
          r`It has no output layer`,
        ],
        a: 1,
        why: r`Backpropagation through time multiplies many Jacobians together.`,
        d: 1,
      },
      {
        q: r`Why does the number of learnable parameters in a vanilla RNN remain constant even when processing sequences of widely varying lengths?`,
        o: [
          r`The exact same weight matrices $W_h$, $W_x$ and bias vector $b$ are reused at every time step`,
          r`The network dynamically prunes zero weights at longer sequences`,
          r`The inputs are always downsampled to a fixed length of 10 tokens`,
          r`The hidden state size expands proportionally with sequence length $T$`,
        ],
        a: 0,
        why: r`In an RNN, recurrence shares the parameter tensors across time: step 1 and step 100 use identical weights $W_h$ and $W_x$. Sequence length affects run time, not parameter count.`,
        d: 1,
      },
      {
        q: r`Why is gradient clipping (such as clip_grad_norm_) commonly applied when training vanilla RNNs with Backpropagation Through Time (BPTT)?`,
        o: [
          r`To prevent vanishing gradients across early sequence positions`,
          r`To enforce sparsity in the recurrent transition matrix`,
          r`To automatically tune the learning rate per parameter like Adam`,
          r`To prevent gradient explosion, where large Jacobian products cause catastrophic numerical overflows and NaN losses`,
        ],
        a: 3,
        why: r`When eigenvalues of the recurrent weight matrix exceed 1, repeated multiplication over time steps causes gradients to explode exponentially. Clipping scales down the gradient vector whenever its norm exceeds a threshold, keeping optimisation stable.`,
        d: 1,
      },
      {
        q: r`A single-unit RNN cell computes $h_t = \tanh(W_h h_{t-1} + W_x x_t + b)$. Given $W_h = 0.6$, $W_x = 0.4$, and bias $b = -0.1$, if the hidden state at step 1 was $h_1 = 0.50$ and the new input at step 2 is $x_2 = 1.5$, what is the pre-activation value before applying $\tanh$?`,
        o: [
          r`$0.50$`,
          r`$1.10$`,
          r`$0.90$`,
          r`$0.80$`,
        ],
        a: 3,
        why: r`The pre-activation is $W_h h_1 + W_x x_2 + b = (0.6 \times 0.50) + (0.4 \times 1.5) - 0.1 = 0.30 + 0.60 - 0.10 = 0.80$.`,
        d: 2,
      },
      {
        q: r`Why cannot the forward training pass of an RNN over a sequence of length $T$ be parallelised across the time dimension on a GPU, unlike a Transformer?`,
        o: [
          r`Each time step $t$ strictly requires the hidden state $h_{t-1}$ from the immediately preceding step, creating an inherently sequential dependency chain`,
          r`RNNs use $\tanh$ activations which are not supported by GPU hardware`,
          r`Backpropagation through time requires sequences to be padded to powers of two`,
          r`GPU memory cannot store more than one set of weight matrices simultaneously`,
        ],
        a: 0,
        why: r`Because $h_t = f(h_{t-1}, x_t)$, step $t$ cannot begin until step $t-1$ has finished. This recurrence forces sequential computation along $T$, making vanilla RNNs and gated RNNs difficult to scale horizontally during training compared with non-recurrent attention architectures.`,
        d: 2,
      },
      {
        q: r`In PyTorch's nn.RNN, calling states, h_last = rnn(x) on an input tensor with batch_first=True yields two outputs. For whole-sequence classification, which tensor is typically passed to the linear output classifier head?`,
        o: [
          r`The elementwise product of states and x`,
          r`states[:, 0, :] (the initial hidden state from step 1)`,
          r`h_last[-1] (the hidden state from the final time step of the top recurrent layer)`,
          r`The transposed input embedding table`,
        ],
        a: 2,
        why: r`h_last[-1] contains the summary vector produced after consuming the entire sequence up to step $T$. For whole-sequence classification, this final state vector is projected through a linear layer to produce class logits.`,
        d: 2,
      },
      {
        q: r`Under the standard recurrence equation $h_t = \tanh(W_h h_{t-1} + W_x x_t + b)$, an RNN cell processes an input vector $x_t \in \mathbb{R}^8$ with a hidden state vector $h_t \in \mathbb{R}^{16}$. How many total learnable scalar parameters are contained in $W_h$, $W_x$, and $b$?`,
        o: [
          r`272`,
          r`384`,
          r`512`,
          r`400`,
        ],
        a: 3,
        why: r`$W_x$ maps 8 inputs to 16 hidden units ($16 \times 8 = 128$ weights). $W_h$ maps 16 recurrent units to 16 units ($16 \times 16 = 256$ weights). The bias vector $b$ has 16 parameters. Total $= 128 + 256 + 16 = 400$ parameters.`,
        d: 2,
      },
      {
        q: r`In a scalar RNN $h_t = \tanh(w h_{t-1} + u x_t)$ with recurrent weight $w = 1.0$, suppose the hidden unit reaches activation $h_t = 0.80$. What is the local gradient factor $\frac{\partial h_t}{\partial h_{t-1}} = (1 - h_t^2) w$ at this step?`,
        o: [
          r`$0.20$`,
          r`$0.36$`,
          r`$0.64$`,
          r`$0.80$`,
        ],
        a: 1,
        why: r`The derivative of $\tanh(z)$ with respect to its pre-activation is $1 - \tanh^2(z) = 1 - h_t^2$. With $h_t = 0.80$, this gives $1 - 0.80^2 = 1 - 0.64 = 0.36$. Multiplying by $w = 1.0$ yields $\frac{\partial h_t}{\partial h_{t-1}} = 0.36$, demonstrating how even non-decaying weights ($w=1$) suffer severe gradient vanishing when activations saturate.`,
        d: 3,
      },
      {
        q: r`Consider a linearised 1-unit RNN where $\frac{\partial h_t}{\partial h_{t-1}} = 1.5$. Over a sequence of $T = 8$ backward steps, by what factor does the gradient grow before clipping is applied?`,
        o: [
          r`$12.0$`,
          r`Approximately $18.5$`,
          r`Approximately $25.6$`,
          r`$64.0$`,
        ],
        a: 2,
        why: r`By the chain rule across 8 unrolled steps, the backward gradient is multiplied by the transition factor at each step: $\prod_{t=1}^8 1.5 = 1.5^8 \approx 25.63$. A learner who mistakenly multiplies $1.5 \times 8 = 12.0$ overlooks the exponential nature of backpropagation through time.`,
        d: 3,
      },
      {
        q: r`Why is the vanishing gradient problem in RNNs fundamentally harder to resolve during optimisation than the exploding gradient problem?`,
        o: [
          r`Exploding gradients produce a clear geometric direction that can simply be truncated by norm clipping, whereas vanishing gradients leave virtually zero signal, giving gradient descent no information about which direction to update distant weights`,
          r`Vanishing gradients only affect the bias terms, leaving weight matrices completely unaffected`,
          r`Exploding gradients cannot occur when using double-precision floating point numbers`,
          r`Modern GPUs automatically inject artificial noise that eliminates exploding gradients`,
        ],
        a: 0,
        why: r`Exploding gradients point in the correct descent direction, so renormalising them via gradient clipping preserves the update trajectory and prevents overflow. Vanishing gradients, however, decay exponentially toward machine precision ($\approx 0$), depriving the optimiser of any directional signal for long-range dependencies.`,
        d: 3,
      },
    ],
    related: ['gru_networks', 'lstm_networks', 'mlp_classifier'],
    prereq: ['mlp_classifier'],
    concepts: ['gradient-descent', 'sigmoid-and-link-functions'],
    labIntro: r`A one-unit RNN, unrolled over 24 time steps. Each box is the same cell at a different time; its colour is the hidden state $h_t$. Press <em>Play</em> to watch an input travel through the sequence, then change the recurrent weight $w$.`,
    tryThis: [r`With $w = 0.8$, watch the first pulse fade: how much of it is left at the last step?`, r`Raise $w$ to 1.3: the state saturates near ±1 and stops responding to new inputs.`, r`Look at the bottom chart: the influence of step 1 on the final state is the vanishing gradient, plotted directly.`],
    keywords: 'rnn recurrent neural network hidden state sequence bptt vanishing gradient',
  },
  {
    id: 'gru_networks', explainer: 'gru', short: 'GRUs', title: 'Gated Recurrent Units (GRUs)',
    task: 'classification', module: 'Sequences', level: 3, minutes: 18,
    summary: r`An RNN with two gates that decide, at every step, how much of the memory to keep and how much to overwrite.`,
    lead: r`A GRU adds a learned switch to the RNN. The <strong>update gate</strong> $z_t$ decides how much of the old state to keep and how much to replace with new content. When $z_t \approx 0$, the state passes through untouched, so memory and gradients survive for many steps.`,
    intuition: [
      r`A vanilla RNN rewrites its memory at every step whether it wants to or not. A GRU instead blends: $h_t = (1 - z_t)\odot h_{t-1} + z_t \odot \tilde h_t$. With $z_t$ near 0 it copies the old state forward; near 1 it replaces it with the candidate $\tilde h_t$. Because the gate is computed from the current input and state, the network learns <em>when</em> to write.`,
      r`The <strong>reset gate</strong> $r_t$ controls how much of the old state is used when proposing the candidate. With $r_t \approx 0$ the candidate ignores history, which helps the network start a fresh thought, for example at the start of a new sentence. GRUs have fewer parameters than LSTMs and often perform about as well.`,
    ],
    analogy: r`A notebook with a pencil and an eraser: most pages you just carry forward, and you only erase and rewrite a line when something important happens.`,
    steps: [
      r`Compute the update gate $z_t = \sigma(W_z x_t + U_z h_{t-1})$ and reset gate $r_t = \sigma(W_r x_t + U_r h_{t-1})$, each between 0 and 1.`,
      r`Propose new content using the reset-scaled history: $\tilde h_t = \tanh(W x_t + U(r_t \odot h_{t-1}))$.`,
      r`Blend: $h_t = (1 - z_t)\odot h_{t-1} + z_t\odot\tilde h_t$.`,
      r`Read out from $h_T$ (or every $h_t$) as with an RNN.`,
    ],
    math: [
      { h: 'Gates', tex: r`$$z_t = \sigma(W_z x_t + U_z h_{t-1} + b_z), \qquad r_t = \sigma(W_r x_t + U_r h_{t-1} + b_r)$$`, p: r`The [[sigmoid-and-link-functions|sigmoid]] keeps each gate between 0 (closed) and 1 (open), elementwise per memory unit.` },
      { h: 'Candidate and update', tex: r`$$\tilde h_t = \tanh\!\big(W x_t + U(r_t \odot h_{t-1}) + b\big), \qquad h_t = (1 - z_t)\odot h_{t-1} + z_t\odot\tilde h_t$$`, p: r`An interpolation between keeping and replacing.` },
      { h: 'Why gradients survive', tex: r`$$\frac{\partial h_t}{\partial h_{t-1}} \approx \operatorname{diag}(1 - z_t) \quad\text{when } z_t \text{ is small}$$`, p: r`If the gate stays near 0, the Jacobian is close to the identity, so the product over many steps does not vanish. Compare with the RNN, where every step multiplies by $W_h$ and a tanh derivative.` },
    ],
    hyper: [[r`hidden_size`, r`Memory size.`, r`64–512.`], [r`num_layers`, r`Stacked GRUs.`, r`1–3.`], [r`dropout`, r`Between stacked layers.`, r`0.1–0.3.`], [r`bidirectional`, r`Also read the sequence backwards.`, r`On for whole-sequence classification.`]],
    pros: ['Remembers much longer than a vanilla RNN.', 'Fewer parameters and faster than an LSTM (two gates, no separate cell).', 'Strong default for small and medium sequence tasks.'],
    cons: ['Still sequential: slow to train on long sequences.', 'Memory still degrades over very long ranges.', 'Usually outperformed by Transformers when data is plentiful.'],
    use: r`Time series, sensor streams and text classification with modest data or compute.`,
    avoid: r`Long documents and large datasets, where Transformers parallelise better and capture longer context.`,
    complexity: [r`$O(T\,d^2)$, about 3× an RNN`, r`$O(d^2)$ per step`],
    glance: { learns: 'Gate, candidate and output weights', family: 'Gated recurrent network' },
    code: digitsLoad + r`

class GRUClassifier(nn.Module):
    def __init__(self, hidden=64):
        super().__init__()
        self.gru = nn.GRU(input_size=8, hidden_size=hidden, batch_first=True)
        self.out = nn.Linear(hidden, 10)

    def forward(self, x):
        _, h_last = self.gru(x)
        return self.out(h_last[-1])

model = GRUClassifier()
print(sum(p.numel() for p in model.parameters()), "parameters")   # ~3x an RNN of the same width`,
    pitfalls: [r`Confusing conventions: some papers (and PyTorch) swap the roles of $z_t$ and $1 - z_t$. The idea is the same.`, r`Using a GRU where a simple moving average or gradient boosting on lag features would do.`],
    quiz: [
      {
        q: r`What does the update gate $z_t \approx 0$ mean (in the convention used here)?`,
        o: [
          r`Erase the memory`,
          r`Copy the previous state forward almost unchanged`,
          r`Ignore the input entirely and output zero`,
          r`Reset the network`,
        ],
        a: 1,
        why: r`$h_t = (1 - z_t)h_{t-1} + z_t\tilde h_t \approx h_{t-1}$.`,
        d: 1,
      },
      {
        q: r`What is the reset gate for?`,
        o: [
          r`Clearing the output`,
          r`Deciding how much history to use when proposing new content`,
          r`Resetting the weights`,
          r`Choosing the learning rate`,
        ],
        a: 1,
        why: r`It scales $h_{t-1}$ inside the candidate computation.`,
        d: 1,
      },
      {
        q: r`Compared with an LSTM, a GRU:`,
        o: [
          r`Has more gates`,
          r`Has no separate cell state and fewer parameters`,
          r`Cannot be trained with backpropagation`,
          r`Is a Transformer`,
        ],
        a: 1,
        why: r`Two gates and one state vector instead of three gates plus a cell.`,
        d: 2,
      },
      {
        q: r`Why do the update gate $z_t$ and reset gate $r_t$ in a GRU use the sigmoid activation function $\sigma(\cdot)$ instead of $\tanh(\cdot)$?`,
        o: [
          r`Sigmoid is computationally faster to evaluate on GPUs than $\tanh$`,
          r`Sigmoid has a non-zero derivative everywhere from $-\infty$ to $+\infty$`,
          r`Sigmoid maps outputs strictly to the range $(0, 1)$, acting naturally as a continuous soft switch or interpolation percentage`,
          r`Sigmoid prevents the candidate state from becoming negative`,
        ],
        a: 2,
        why: r`Gates represent proportions or probabilities of keeping/filtering information. The sigmoid function maps real-valued linear projections onto $(0, 1)$, where 0 corresponds to fully closed and 1 corresponds to fully open.`,
        d: 1,
      },
      {
        q: r`In the interpolation equation $h_t = (1 - z_t) \odot h_{t-1} + z_t \odot \tilde h_t$, what happens when the update gate vector is close to 1 ($z_t \approx 1$)?`,
        o: [
          r`The network halts sequence processing immediately`,
          r`The previous hidden state $h_{t-1}$ is preserved perfectly and the new candidate $\tilde h_t$ is ignored`,
          r`The cell completely overwrites the old hidden state with the newly proposed candidate state $\tilde h_t$`,
          r`The hidden state is reset to a vector of exact zeros`,
        ],
        a: 2,
        why: r`When $z_t \approx 1$, the retention term $(1 - z_t) \odot h_{t-1} \approx 0$, while the update term $z_t \odot \tilde h_t \approx \tilde h_t$, so the hidden state is almost entirely replaced by the new candidate.`,
        d: 1,
      },
      {
        q: r`A GRU cell has a previous hidden state $h_{t-1} = 0.80$. For the current time step, the network computes an update gate value of $z_t = 0.25$ and a candidate state of $\tilde h_t = -0.40$. Using the formula $h_t = (1 - z_t)h_{t-1} + z_t \tilde h_t$, what is the new hidden state $h_t$?`,
        o: [
          r`$0.35$`,
          r`$0.50$`,
          r`$0.60$`,
          r`$0.70$`,
        ],
        a: 1,
        why: r`Retention of previous state is $(1 - 0.25) \times 0.80 = 0.75 \times 0.80 = 0.60$. Contribution of candidate is $0.25 \times (-0.40) = -0.10$. Blending them yields $h_t = 0.60 + (-0.10) = 0.50$.`,
        d: 2,
      },
      {
        q: r`When the reset gate $r_t$ in a GRU evaluates to 0 for all units, what does the candidate state $\tilde h_t = \tanh(W x_t + U(r_t \odot h_{t-1}) + b)$ represent?`,
        o: [
          r`A pure representation of the current input $x_t$ alone ($\tanh(W x_t + b)$), completely ignoring historical context`,
          r`A copy of the previous hidden state $h_{t-1}$`,
          r`A vector of zeros`,
          r`The linear derivative of the update gate`,
        ],
        a: 0,
        why: r`When $r_t = 0$, the historical context $r_t \odot h_{t-1} = 0$, so $\tilde h_t = \tanh(W x_t + b)$. This allows the GRU to discard irrelevant past history when starting a new sequence segment (such as the beginning of a sentence).`,
        d: 2,
      },
      {
        q: r`For the same input dimension $d_{\text{in}}$ and hidden size $d_{\text{hid}}$, roughly what is the ratio of trainable parameters in a GRU compared with a standard LSTM?`,
        o: [
          r`$1 : 2$ (GRU has half the parameters of an LSTM)`,
          r`$2 : 3$`,
          r`$1 : 1$ (they have identical parameter counts)`,
          r`$3 : 4$ (GRU has 3 sets of matrix operations per step, while LSTM has 4)`,
        ],
        a: 3,
        why: r`A GRU computes 3 sets of projections (update gate $z_t$, reset gate $r_t$, and candidate $\tilde h_t$). A standard LSTM computes 4 sets of projections (forget gate $f_t$, input gate $i_t$, output gate $o_t$, and candidate $\tilde c_t$). Therefore, a GRU has approximately $\frac{3}{4} = 75\%$ of the parameters of an LSTM of identical width.`,
        d: 2,
      },
      {
        q: r`According to the GRU gradient relation $\frac{\partial h_t}{\partial h_{t-1}} \approx \operatorname{diag}(1 - z_t)$ (when $z_t$ is small), how does the GRU prevent the vanishing gradient problem across many time steps?`,
        o: [
          r`By setting the learning rate to a value greater than 1.0`,
          r`By replacing the chain rule with forward-mode automatic differentiation`,
          r`By forcing all weight matrices to be orthogonal`,
          r`When $z_t$ remains close to 0, $(1 - z_t) \approx 1$, meaning the recurrent Jacobian acts close to the identity matrix so gradients flow back through time without decaying`,
        ],
        a: 3,
        why: r`If the network chooses not to update its memory ($z_t \approx 0$), the Jacobian $\frac{\partial h_t}{\partial h_{t-1}} \approx I$. Gradients backpropagated through time are multiplied by values close to 1, creating an effective shortcut across dozens or hundreds of steps.`,
        d: 2,
      },
      {
        q: r`A 1-unit GRU computes its candidate state as $\tilde h_t = \tanh(W x_t + U(r_t \cdot h_{t-1}) + b)$. Given $W = 0.5$, $U = -0.5$, bias $b = -0.3$, input $x_t = 1.0$, previous state $h_{t-1} = 0.80$, and reset gate $r_t = 0.50$, what is the candidate state $\tilde h_t$?`,
        o: [
          r`$0.00$`,
          r`$-0.20$`,
          r`$0.25$`,
          r`$0.50$`,
        ],
        a: 0,
        why: r`First scale the historical state by the reset gate: $r_t \cdot h_{t-1} = 0.50 \times 0.80 = 0.40$. Next, compute the linear pre-activation: $W x_t + U(0.40) + b = (0.5 \times 1.0) + (-0.5 \times 0.40) - 0.3 = 0.50 - 0.20 - 0.30 = 0.00$. Finally, $\tanh(0.00) = 0.00$.`,
        d: 3,
      },
      {
        q: r`The lesson defines the GRU update as $h_t = (1 - z_t)\odot h_{t-1} + z_t\odot\tilde h_t$. However, PyTorch's official nn.GRU documentation defines it as $h_t = (1 - z_t)\odot n_t + z_t\odot h_{t-1}$ (where $n_t$ is the candidate). Under PyTorch's convention, what does a gate value of $z_t \approx 1$ indicate?`,
        o: [
          r`The network completely replaces the state with the candidate $n_t$`,
          r`The network acts as a pass-through, carrying forward the previous hidden state $h_{t-1}$ almost unchanged`,
          r`The network forces all outputs to be non-negative`,
          r`The gradient is set to zero for all previous time steps`,
        ],
        a: 1,
        why: r`In PyTorch's notation, $z_t$ multiplies $h_{t-1}$ directly while $(1 - z_t)$ multiplies candidate $n_t$. Thus when $z_t \approx 1$, $(1 - z_t) \approx 0$, so $h_t \approx h_{t-1}$, retaining the old memory. The lesson highlights this notation swap as a common pitfall when reading papers versus codebase implementations.`,
        d: 3,
      },
      {
        q: r`A GRU unit receives zero inputs ($x_t = 0, \tilde h_t = 0$) while its update gate stays fixed at $z_t = 0.10$. Starting from $h_0 = 1.0$, what is the value of the hidden state $h_3$ after 3 time steps?`,
        o: [
          r`$0.729$`,
          r`$0.810$`,
          r`$0.700$`,
          r`$0.900$`,
        ],
        a: 0,
        why: r`With $\tilde h_t = 0$, $h_t = (1 - z_t) h_{t-1} = 0.90 \times h_{t-1}$. Over 3 steps, $h_3 = 0.90^3 \times h_0 = 0.729 \times 1.0 = 0.729$. Assuming a linear reduction of $0.10 \times 3 = 0.30 \implies 0.70$ is a common pitfall that overlooks geometric decay.`,
        d: 3,
      },
    ],
    related: ['recurrent_neural_networks', 'lstm_networks', 'transformer_networks'],
    prereq: ['recurrent_neural_networks'],
    concepts: ['sigmoid-and-link-functions', 'gradient-descent'],
    labIntro: r`The same 24-step timeline as the RNN lesson, now with an update gate. The gate opens (bright bar) when an input arrives and closes otherwise. Compare how long the GRU (cyan) and a plain RNN (grey) remember the first pulse.`,
    tryThis: [r`Lower "gate when idle" toward 0: the GRU keeps the first pulse almost perfectly while the RNN forgets it.`, r`Raise it to 0.5: the GRU now forgets about as fast as the RNN.`, r`Turn on the second pulse and see the gate open again to overwrite the memory.`],
    keywords: 'gru gated recurrent unit update gate reset gate sequence memory',
  },
  {
    id: 'lstm_networks', explainer: 'lstm', short: 'LSTMs', title: 'Long Short-Term Memory Networks (LSTMs)',
    task: 'classification', module: 'Sequences', level: 3, minutes: 22,
    summary: r`An RNN with a separate memory cell and three gates (forget, input, output) that decide what to store, keep and reveal.`,
    lead: r`An LSTM keeps two things per step: a <strong>cell state</strong> $c_t$, a long-term memory that is only changed by small, gated additions, and a <strong>hidden state</strong> $h_t$, the part it shows to the rest of the network. Three gates control the flow: forget, input and output.`,
    intuition: [
      r`Picture the cell state as a conveyor belt running through time. At each step the <strong>forget gate</strong> $f_t$ decides how much of what is on the belt to keep, the <strong>input gate</strong> $i_t$ decides how much new information to place on it, and the <strong>output gate</strong> $o_t$ decides how much of the belt to reveal as $h_t$. Because the belt is updated by addition rather than repeated squashing, information (and gradient) can travel hundreds of steps.`,
      r`The classic test is "remember something, ignore distractions, recall it later": a value appears at the start, then many irrelevant inputs follow, then the network must report the value. A vanilla RNN smears the value with every distractor. An LSTM opens its input gate once, closes it, holds the forget gate near 1, and opens the output gate at the end. The lab runs exactly this task.`,
    ],
    analogy: r`A safe with three doors: one to throw old things out, one to put new things in, one to show what is inside. Most of the time all three stay shut and the contents are kept intact.`,
    steps: [
      r`Compute three gates from $x_t$ and $h_{t-1}$: forget $f_t$, input $i_t$, output $o_t$ (each a sigmoid, 0 to 1).`,
      r`Propose new content $\tilde c_t = \tanh(W_c x_t + U_c h_{t-1})$.`,
      r`Update the cell: $c_t = f_t \odot c_{t-1} + i_t \odot \tilde c_t$ (keep some old, add some new).`,
      r`Reveal part of it: $h_t = o_t \odot \tanh(c_t)$.`,
      r`Initialise the forget-gate bias to about 1 so the network starts by remembering.`,
    ],
    math: [
      { h: 'Gates', tex: r`$$f_t = \sigma(W_f x_t + U_f h_{t-1} + b_f), \quad i_t = \sigma(W_i x_t + U_i h_{t-1} + b_i), \quad o_t = \sigma(W_o x_t + U_o h_{t-1} + b_o)$$`, p: r`Each gate is a vector the same size as the memory, so different units can keep or forget independently.` },
      { h: 'Cell and hidden state', tex: r`$$c_t = f_t\odot c_{t-1} + i_t\odot\tilde c_t, \qquad h_t = o_t\odot\tanh(c_t)$$`, p: r`The cell state is updated additively: the key difference from an RNN.` },
      { h: 'The gradient highway', tex: r`$$\frac{\partial c_t}{\partial c_{k}} = \prod_{s=k+1}^{t} \operatorname{diag}(f_s)$$`, p: r`Along the cell path, gradients are only scaled by forget gates. With $f_s \approx 1$, they reach far into the past without vanishing.` },
    ],
    hyper: [[r`hidden_size`, r`Size of $c_t$ and $h_t$.`, r`64–512.`], [r`num_layers`, r`Stacked LSTMs.`, r`1–3.`], [r`forget-gate bias`, r`Initial tendency to remember.`, r`1.0 (a common trick).`], [r`dropout / bidirectional`, r`Regularisation and backward reading.`, r`0.1–0.3; bidirectional for classification.`]],
    pros: ['Long memory through the additive cell path.', 'Robust and well understood; strong on time series and speech.', 'Explicit gates are somewhat interpretable.'],
    cons: ['About 4× the parameters of an RNN of the same width.', 'Sequential computation limits training speed.', 'Transformers usually win on large text datasets.'],
    use: r`Time-series forecasting, speech, handwriting, and text tasks with moderate data where long memory matters.`,
    avoid: r`Very long contexts with lots of data and GPUs available: Transformers train faster and attend directly.`,
    complexity: [r`$O(T\,d^2)$, about 4× an RNN`, r`$O(d^2)$ per step`],
    glance: { learns: 'Weights for three gates and the candidate', family: 'Gated recurrent network' },
    code: digitsLoad + r`

class LSTMClassifier(nn.Module):
    def __init__(self, hidden=64):
        super().__init__()
        self.lstm = nn.LSTM(input_size=8, hidden_size=hidden, batch_first=True)
        self.out = nn.Linear(hidden, 10)
        # start by remembering: forget-gate biases (second quarter of each bias vector) set to 1
        for name, b in self.lstm.named_parameters():
            if "bias" in name:
                b.data[hidden:2 * hidden].fill_(1.0)

    def forward(self, x):
        _, (h_last, c_last) = self.lstm(x)
        return self.out(h_last[-1])`,
    pitfalls: [r`Leaving the forget-gate bias at 0, which makes the network forget by default early in training.`, r`Confusing $h_t$ (what the LSTM shows) with $c_t$ (what it remembers).`, r`Using an LSTM for tabular data with no meaningful order.`],
    quiz: [
      {
        q: r`Which gate decides how much of the old cell state to keep?`,
        o: [
          r`Input gate`,
          r`Forget gate`,
          r`Output gate`,
          r`Reset gate`,
        ],
        a: 1,
        why: r`$c_t = f_t \odot c_{t-1} + \dots$`,
        d: 1,
      },
      {
        q: r`Why do gradients survive longer in an LSTM than in a vanilla RNN?`,
        o: [
          r`It uses ReLU`,
          r`The cell state is updated by addition and only scaled by the forget gate`,
          r`It has more layers`,
          r`It uses attention`,
        ],
        a: 1,
        why: r`Along the cell path the Jacobian is $\operatorname{diag}(f_t)$, close to the identity when $f_t \approx 1$.`,
        d: 1,
      },
      {
        q: r`To remember a value and ignore 20 distractors, an LSTM ideally keeps:`,
        o: [
          r`Input gate open, forget gate near 0`,
          r`Input gate open once, then closed; forget gate near 1`,
          r`All gates at 0.5`,
          r`Output gate always open`,
        ],
        a: 1,
        why: r`Write once, then hold; the output gate opens when the value is needed.`,
        d: 2,
      },
      {
        q: r`What is the fundamental conceptual difference between the cell state $c_t$ and the hidden state $h_t$ in an LSTM?`,
        o: [
          r`$c_t$ contains gradients while $h_t$ contains inputs`,
          r`$c_t$ is computed using convolution while $h_t$ is computed using self-attention`,
          r`$c_t$ is reset to zero at every time step while $h_t$ is persistent`,
          r`$c_t$ is the internal long-term memory modified only by additive gated updates, while $h_t$ is the filtered exposure of that memory passed to the next layer and output`,
        ],
        a: 3,
        why: r`The cell state $c_t$ acts as a linear conveyor belt running through time. The hidden state $h_t = o_t \odot \tanh(c_t)$ is the gated, squashed view of the cell state that the network reveals to upper layers and the next step.`,
        d: 1,
      },
      {
        q: r`Why is it standard practice (recommended by Gers et al. and built into PyTorch architectures) to initialise the forget-gate bias $b_f$ to $+1.0$ instead of $0.0$?`,
        o: [
          r`To ensure that $\sigma(b_f) \approx 0.73$, so the network defaults to remembering past information early in training rather than aggressively forgetting`,
          r`To prevent division by zero in the softmax classifier head`,
          r`To force the cell state to remain strictly positive`,
          r`To make the backward pass completely linear`,
        ],
        a: 0,
        why: r`Setting $b_f = 1.0$ makes the initial forget gate output $\sigma(1.0) \approx 0.73$ (or higher), biasing the network to retain history at the start of training before it has learned what to forget. With $b_f = 0$, $\sigma(0) = 0.5$, which causes memory to decay exponentially by $0.5^t$.`,
        d: 1,
      },
      {
        q: r`An LSTM cell has previous cell state $c_{t-1} = 4.0$. At the current time step, its gates and candidate evaluate to: forget gate $f_t = 0.75$, input gate $i_t = 0.50$, and candidate state $\tilde c_t = -2.0$. What is the updated cell state $c_t$?`,
        o: [
          r`$1.0$`,
          r`$3.0$`,
          r`$2.0$`,
          r`$4.0$`,
        ],
        a: 2,
        why: r`By the cell update equation $c_t = f_t c_{t-1} + i_t \tilde c_t$: $c_t = (0.75 \times 4.0) + (0.50 \times -2.0) = 3.0 - 1.0 = 2.0$.`,
        d: 2,
      },
      {
        q: r`In an LSTM, the updated cell state satisfies $\tanh(c_t) = 0.50$. The output gate evaluates to $o_t = 0.40$. What is the resulting hidden state $h_t$?`,
        o: [
          r`$0.50$`,
          r`$0.40$`,
          r`$0.20$`,
          r`$0.90$`,
        ],
        a: 2,
        why: r`The hidden state is computed as $h_t = o_t \odot \tanh(c_t) = 0.40 \times 0.50 = 0.20$. The output gate acts as a valve scaling the saturated cell state before exposing it.`,
        d: 2,
      },
      {
        q: r`Why does the LSTM use $\tanh$ for the candidate cell content $\tilde c_t$ and for cell squashing $\tanh(c_t)$, while using $\sigma$ for the gates?`,
        o: [
          r`$\tanh$ can be both positive and negative (centred at 0 with range $(-1, 1)$), allowing the network to either add or subtract information from the cell, whereas gates act as non-negative scaling percentages in $(0, 1)$`,
          r`$\tanh$ prevents gradients from vanishing over long sequences`,
          r`$\sigma$ requires more parameters to compute than $\tanh$`,
          r`$\tanh$ is required because input features must be non-negative`,
        ],
        a: 0,
        why: r`The cell state needs to be able to increment (positive values) or decrement (negative values) based on new evidence, making the zero-centred $(-1, 1)$ range of $\tanh$ ideal. Gates, on the other hand, are control valves that determine what fraction of a signal to pass, requiring the $(0, 1)$ range of $\sigma$.`,
        d: 2,
      },
      {
        q: r`A standard LSTM layer has input dimension $d_{\text{in}} = 10$ and hidden size $d_{\text{hid}} = 20$. Considering the 4 internal operations (forget, input, output gates, and candidate state), each with input weights, recurrent weights, and a single bias vector, how many total learnable parameters are in this LSTM layer?`,
        o: [
          r`620`,
          r`1,240`,
          r`4,960`,
          r`2,480`,
        ],
        a: 3,
        why: r`Each of the 4 components has $W \in \mathbb{R}^{20 \times 10}$ ($200$), $U \in \mathbb{R}^{20 \times 20}$ ($400$), and $b \in \mathbb{R}^{20}$ ($20$), totalling $620$ parameters each. Across the 3 gates plus candidate state, $4 \times 620 = 2,480$ parameters.`,
        d: 2,
      },
      {
        q: r`In Hochreiter and Schmidhuber's LSTM formulation, along the cell state path the gradient is given by $\frac{\partial c_t}{\partial c_k} = \prod_{s=k+1}^t \operatorname{diag}(f_s)$. If the network maintains $f_s = 1.0$ across 100 intermediate time steps, what happens to the backpropagated error along this path?`,
        o: [
          r`It flows backward completely unattenuated with an exact multiplier of 1.0, preserving long-range gradient signals without vanishing`,
          r`It decays exponentially by $0.5^{100}$`,
          r`It explodes exponentially due to accumulated matrix powers`,
          r`It is converted into attention scores`,
        ],
        a: 0,
        why: r`When the forget gate is saturated open ($f_s = 1.0$), the local Jacobian $\frac{\partial c_s}{\partial c_{s-1}} = \operatorname{diag}(1.0) = I$. Multiplying the identity matrix across 100 steps leaves the gradient magnitude unchanged, creating the constant error carousel that solves vanishing gradients.`,
        d: 3,
      },
      {
        q: r`An initial value is stored in an LSTM cell, giving $c_1 = 6.0$. During the next two time steps ($t=2$ and $t=3$), the input gate is shut ($i_2 = i_3 = 0$), but the forget gate drops to $f_2 = f_3 = 0.50$. What is the cell state $c_3$ at the end of step 3?`,
        o: [
          r`$0.0$`,
          r`$3.0$`,
          r`$1.5$`,
          r`$4.5$`,
        ],
        a: 2,
        why: r`At step 2, $c_2 = f_2 c_1 + i_2 \tilde c_2 = 0.50 \times 6.0 + 0 = 3.0$. At step 3, $c_3 = f_3 c_2 + i_3 \tilde c_3 = 0.50 \times 3.0 + 0 = 1.5$. When the forget gate falls below 1, stored memories leak away geometrically.`,
        d: 3,
      },
      {
        q: r`When using a bidirectional LSTM (bidirectional=True) with hidden size $d_{\text{hid}} = 64$ for sequence classification, what is the dimension of the concatenated output hidden state vector for a single time step?`,
        o: [
          r`64`,
          r`32`,
          r`256`,
          r`128`,
        ],
        a: 3,
        why: r`A bidirectional LSTM runs two independent recurrent passes: one forward from $t=1 \to T$, and one backward from $t=T \to 1$. At each step, their hidden states are concatenated ($[h_t^{\to}; h_t^{\leftarrow}]$), resulting in a combined feature vector of size $64 + 64 = 128$.`,
        d: 3,
      },
    ],
    related: ['gru_networks', 'recurrent_neural_networks', 'transformer_networks'],
    prereq: ['gru_networks'],
    concepts: ['sigmoid-and-link-functions', 'gradient-descent'],
    labIntro: r`The memory task: a value arrives at step 1, then 20 distractor inputs, then the network must recall the value. Watch the cell state (the conveyor belt) and the three gates step by step, and compare with a plain RNN trying the same thing.`,
    tryThis: [r`Press <em>Play</em> with the defaults: the input gate opens once, the forget gate holds, and the value is recalled almost exactly.`, r`Switch the input gate to "always open": distractors pour into the cell and recall falls apart.`, r`Lower the forget gate to 0.8: the stored value leaks away, just like the RNN.`],
    keywords: 'lstm long short term memory cell state forget gate input gate output gate',
  },
  {
    id: 'transformer_networks', explainer: 'transformer', architecture: 'transformer', short: 'Transformers',
    archIntro: r`The full GPT-2 small architecture (124 million parameters), from raw text to the next-token prediction. Hover over any part (or tap it on a phone) for its shape, its parameter count and what it does; the amber tags open the details inside each part.`, title: 'Transformers and Self-Attention',
    task: 'classification', module: 'Sequences', level: 3, minutes: 24,
    summary: r`No recurrence at all: every token looks directly at every other token through attention, all in parallel. The architecture behind modern LLMs.`,
    lead: r`A Transformer replaces "read step by step" with "look everywhere at once". Each token asks a question (a <strong>query</strong>), every token advertises what it contains (a <strong>key</strong>), and each token collects information (the <strong>values</strong>) from the tokens whose keys best match its query.`,
    intuition: [
      r`In "The animal did not cross the street because it was tired", the word "it" needs to find "animal". An RNN would have to carry "animal" through six steps of memory. Self-attention lets "it" compare itself with every word directly and pull in information from the best match, however far away it is. Distance stops mattering.`,
      r`The comparison is a dot product between the query of one token and the key of another, scaled and turned into weights with a [[sigmoid-and-link-functions|softmax]]. The output for a token is the weighted average of all value vectors. Several <strong>heads</strong> do this in parallel, each with its own query/key/value projections, so one head can track meaning ("which noun is this pronoun about?") while another tracks position ("what came just before me?"). Since attention ignores order, <strong>positional encodings</strong> are added to the inputs. Stack attention with small feed-forward layers, residual connections and layer norm, and you have a Transformer block.`,
    ],
    analogy: r`A room where everyone holds up a sign describing themselves (keys), each person has a question in mind (query), and each listens most closely to the people whose signs match their question.`,
    steps: [
      r`[[tokenization|Tokenize]] the text into ids, turn each id into a vector with an [[embeddings|embedding]] table and add positional encodings.`,
      r`For each token, compute query $q = xW_Q$, key $k = xW_K$ and value $v = xW_V$.`,
      r`Score every pair: $q_i \cdot k_j / \sqrt{d_k}$; mask future tokens in decoders.`,
      r`Softmax each row of scores into attention weights that sum to 1.`,
      r`Output for token $i$: $\sum_j a_{ij} v_j$. Do this in several heads, concatenate, and project.`,
      r`Add a feed-forward layer, residual connections and layer norm; stack many blocks; pool (or use a [CLS] token) and classify.`,
    ],
    math: [
      { h: 'Scaled dot-product attention', tex: r`$$\operatorname{Attention}(Q, K, V) = \operatorname{softmax}\!\Big(\frac{QK^\top}{\sqrt{d_k}}\Big)V$$`, p: r`Row $i$ of the softmax matrix is the attention distribution of token $i$ over all tokens.` },
      { h: 'Why divide by √d', tex: r`$$q, k \sim \mathcal N(0, I_{d}) \;\Rightarrow\; \operatorname{Var}(q\cdot k) = d$$`, p: r`Without scaling, larger dimensions give larger scores, the softmax becomes nearly one-hot, and its gradients vanish. The lab’s temperature slider shows that effect.` },
      { h: 'Multi-head attention', tex: r`$$\operatorname{MHA}(X) = [\text{head}_1; \dots; \text{head}_h]\,W_O, \qquad \text{head}_j = \operatorname{Attention}(XW_Q^{j}, XW_K^{j}, XW_V^{j})$$`, p: r`Each head can specialise in a different kind of relationship.` },
      { h: 'One Transformer block (pre-norm, as in GPT-2)', tex: r`$$H = X + \operatorname{MHA}(\operatorname{LN}(X)), \qquad Y = H + \operatorname{FFN}(\operatorname{LN}(H)), \qquad \operatorname{FFN}(h) = \operatorname{GELU}(hW_1 + b_1)W_2 + b_2$$`, p: r`Attention mixes information <em>between</em> tokens; the feed-forward network (usually 4× wider) processes each token <em>on its own</em>. The residual additions keep a direct path for gradients through dozens of layers, and layer norm keeps every vector at a stable scale.` },
      { h: 'Predicting the next token', tex: r`$$p(\text{next} = w \mid x_{\le t}) = \operatorname{softmax}\!\big(h_t E^\top / \tau\big)_w, \qquad \mathcal L = -\frac1T\sum_t \log p(x_{t+1} \mid x_{\le t})$$`, p: r`The last vector is scored against every row of the (tied) embedding table $E$. Training uses cross-entropy at every position at once; generation samples one token, appends it and repeats. $\tau$ is the sampling temperature.` },
      { h: 'Cost', tex: r`$$\text{time and memory} \propto T^2 d$$`, p: r`Every token attends to every token, so long contexts are expensive; much current research is about making this cheaper.` },
    ],
    hyper: [[r`d_model, heads, layers`, r`Model width, attention heads, depth.`, r`Start from a pre-trained checkpoint.`], [r`max sequence length`, r`Context window.`, r`Cost grows with its square.`], [r`learning rate + warm-up`, r`Fine-tuning schedule.`, r`2e-5 to 5e-5 with linear warm-up.`], [r`dropout`, r`Regularisation.`, r`0.1.`]],
    pros: ['Direct access between any two positions: long-range context is easy.', 'Fully parallel over the sequence, so training scales on GPUs.', 'Pre-trained models transfer to new tasks with little labelled data.'],
    cons: ['Quadratic cost in sequence length.', 'Data- and compute-hungry when trained from scratch.', 'Large models are expensive to serve.'],
    use: r`Text, code, and increasingly images, audio and time series, especially when a pre-trained model exists.`,
    avoid: r`Tiny datasets with no pre-trained model, or short simple sequences where a GRU or a linear model is enough.`,
    complexity: [r`$O(T^2 d + T d^2)$ per layer, parallel over $T$`, r`Same per sequence`],
    glance: { learns: 'Embeddings, Q/K/V projections, feed-forward weights', family: 'Attention network' },
    code: digitsLoad + r`

class TinyTransformer(nn.Module):
    def __init__(self, d=64, heads=4, layers=2):
        super().__init__()
        self.embed = nn.Linear(8, d)
        self.pos = nn.Parameter(torch.zeros(1, 8, d))                # learned positional encoding
        block = nn.TransformerEncoderLayer(d, heads, dim_feedforward=128, batch_first=True)
        self.encoder = nn.TransformerEncoder(block, layers)
        self.out = nn.Linear(d, 10)

    def forward(self, x):
        h = self.encoder(self.embed(x) + self.pos)                   # every row attends to every row
        return self.out(h.mean(dim=1))

# for real text, fine-tune a pre-trained model instead:
# from transformers import AutoModelForSequenceClassification`,
    pitfalls: [r`Training a Transformer from scratch on a few thousand examples; fine-tune a pre-trained one.`, r`Forgetting positional information: without it, "dog bites man" and "man bites dog" look identical.`, r`Reading attention weights as explanations. They show where information flows, not why the model decided.`],
    quiz: [
      {
        q: r`In self-attention, what does a token’s query get compared with?`,
        o: [
          r`Its own value`,
          r`The keys of every token`,
          r`The output layer`,
          r`The previous hidden state`,
        ],
        a: 1,
        why: r`Scores are $q_i \cdot k_j$ for all $j$.`,
        d: 1,
      },
      {
        q: r`Why are positional encodings needed?`,
        o: [
          r`To speed up training`,
          r`Attention by itself ignores word order`,
          r`To normalise the values`,
          r`To mask future tokens`,
        ],
        a: 1,
        why: r`Shuffling the tokens would otherwise give the same set of outputs.`,
        d: 1,
      },
      {
        q: r`How does attention’s cost grow with sequence length $T$?`,
        o: [
          r`Linearly`,
          r`Quadratically`,
          r`Logarithmically`,
          r`Not at all`,
        ],
        a: 1,
        why: r`A $T \times T$ score matrix.`,
        d: 1,
      },
      {
        q: r`What does a causal mask do?`,
        o: [
          r`Hides future tokens so each token only attends to itself and the past`,
          r`Removes padding`,
          r`Drops attention heads`,
          r`Reverses the sequence`,
        ],
        a: 0,
        why: r`Needed for text generation, where the next token must not be visible.`,
        d: 1,
      },
      {
        q: r`Why is the dot product $QK^\top$ divided by $\sqrt{d_k}$ in scaled dot-product attention?`,
        o: [
          r`To convert the matrix into an orthogonal basis`,
          r`To prevent negative values in the resulting score matrix`,
          r`To enforce that the attention weights sum to $\sqrt{d_k}$ rather than 1.0`,
          r`Without scaling, for large key dimensions $d_k$ the dot products grow large, pushing the softmax into regions with extremely small gradients`,
        ],
        a: 3,
        why: r`When components of $q$ and $k$ are independent with zero mean and unit variance, $\operatorname{Var}(q \cdot k) = d_k$. As $d_k$ increases, dot products have large magnitudes, driving softmax probabilities towards 0 and 1, which causes vanishing gradients during backpropagation.`,
        d: 2,
      },
      {
        q: r`Token 1 has computed attention weights of $0.80$ to itself and $0.20$ to Token 2. The value vectors are $v_1 = [10.0, 0.0]^\top$ and $v_2 = [0.0, 20.0]^\top$. What is the resulting attention output vector for Token 1?`,
        o: [
          r`$[5.0, 10.0]^\top$`,
          r`$[10.0, 20.0]^\top$`,
          r`$[8.0, 4.0]^\top$`,
          r`$[2.0, 8.0]^\top$`,
        ],
        a: 2,
        why: r`The output is the weighted average of the value vectors: $0.80 \times [10.0, 0.0]^\top + 0.20 \times [0.0, 20.0]^\top = [8.0, 0.0]^\top + [0.0, 4.0]^\top = [8.0, 4.0]^\top$.`,
        d: 2,
      },
      {
        q: r`What is the primary benefit of using Multi-Head Attention rather than a single large attention head with the same total dimension $d_{\text{model}}$?`,
        o: [
          r`It reduces the overall parameter count of the Transformer by half`,
          r`It eliminates the need for feed-forward sub-layers`,
          r`It allows the model to jointly attend to information from different representation subspaces and positions simultaneously`,
          r`It prevents the quadratic complexity of self-attention`,
        ],
        a: 2,
        why: r`Multiple heads project queries, keys, and values into different lower-dimensional subspaces. This allows distinct heads to specialise in different relationships—such as grammatical dependencies, coreference resolution, or relative position—which a single averaging operation would blur together.`,
        d: 2,
      },
      {
        q: r`Inside a standard Transformer block (such as GPT or BERT), what is the function of the position-wise Feed-Forward Network (FFN) that follows the multi-head attention layer?`,
        o: [
          r`It downsamples the sequence length by half`,
          r`It computes cross-token attention between adjacent sentences`,
          r`It aggregates all token vectors into a single sentence representation`,
          r`It processes each token position independently and identically, applying a non-linear feature transformation (typically expanding 4× wider before projecting back)`,
        ],
        a: 3,
        why: r`While attention mixes information across different token positions, the FFN operates position-wise: it applies the same two-layer MLP with non-linearity (e.g. GELU or ReLU) to each token vector separately, allowing complex feature processing per token.`,
        d: 2,
      },
      {
        q: r`In modern Transformer blocks (Pre-LN formulation, as used in GPT-2 and LLaMA), how is the residual connection and Layer Normalisation (LN) structured for input $X$?`,
        o: [
          r`$H = X + \operatorname{MHA}(\operatorname{LN}(X))$`,
          r`$H = \operatorname{MHA}(X) + \operatorname{LN}(X)$`,
          r`$H = \operatorname{LN}(X + \operatorname{MHA}(X))$`,
          r`$H = \operatorname{MHA}(X) / \sqrt{d}$`,
        ],
        a: 0,
        why: r`In Pre-LN, normalisation is applied to the input branch before entering the attention sub-layer, and the original input $X$ is added directly via the residual connection: $H = X + \operatorname{MHA}(\operatorname{LN}(X))$. This preserves an unhindered gradient highway throughout dozens of stacked blocks.`,
        d: 2,
      },
      {
        q: r`Given query vector $q = [2.0, -1.0, 2.0, 1.0]$ and key vector $k = [1.0, 2.0, 3.0, 2.0]$ with key dimension $d_k = 4$, what is the scaled attention score $\frac{q \cdot k}{\sqrt{d_k}}$ before softmax?`,
        o: [
          r`$4.0$`,
          r`$8.0$`,
          r`$2.0$`,
          r`$16.0$`,
        ],
        a: 0,
        why: r`The raw dot product is $q \cdot k = (2 \times 1) + (-1 \times 2) + (2 \times 3) + (1 \times 2) = 2 - 2 + 6 + 2 = 8.0$. Dividing by $\sqrt{d_k} = \sqrt{4} = 2.0$ yields $\frac{8.0}{2.0} = 4.0$. Failing to divide by $\sqrt{d_k}$ leaves the unscaled score $8.0$.`,
        d: 3,
      },
      {
        q: r`In a Transformer with model embedding dimension $d_{\text{model}} = 768$ and $h = 12$ attention heads, how is each head's query, key, and value dimension $d_k$ typically configured, and why?`,
        o: [
          r`$d_k = 768$, so the total concatenated projection size is $12 \times 768 = 9,216$`,
          r`$d_k = \sqrt{768} \approx 28$, to match the scaling denominator`,
          r`$d_k = d_{\text{model}} / h = 768 / 12 = 64$, ensuring that concatenating all 12 head outputs yields dimension 768 with computational cost matching single-head attention`,
          r`$d_k = 12$, matching the number of heads`,
        ],
        a: 2,
        why: r`Standard Transformer architectures split the model width across the heads: $d_k = d_v = d_{\text{model}} / h = 768 / 12 = 64$. Concatenating the twelve 64-dimensional outputs reconstructs a 768-dimensional vector, keeping parameter count and FLOPs roughly equal to a single full-rank head.`,
        d: 3,
      },
      {
        q: r`In next-token generation with logit vector $z$, what happens mathematically to the probability distribution as the sampling temperature $\tau \to 0$ versus when $\tau \to \infty$?`,
        o: [
          r`As $\tau \to 0$, the distribution becomes uniform over all tokens; as $\tau \to \infty$, it becomes deterministic`,
          r`The temperature only modifies negative logits, leaving positive logits unaffected`,
          r`As $\tau \to 0$, all token probabilities become 0.0`,
          r`As $\tau \to 0$, the distribution converges to a one-hot distribution placed entirely on the highest logit ($\operatorname{argmax}$ greedy selection); as $\tau \to \infty$, it converges to a uniform distribution over the entire vocabulary`,
        ],
        a: 3,
        why: r`Dividing logits by small $\tau > 0$ magnifies differences between scores: in the limit $\tau \to 0$, the largest logit dominates the softmax sum, yielding probability 1.0 for the top token (greedy decoding). Conversely, as $\tau \to \infty$, $z / \tau \to 0$, and $e^0 = 1$ for all tokens, converging to a completely uniform random distribution.`,
        d: 3,
      },
    ],
    related: ['lstm_networks', 'gru_networks', 'convolutional_neural_networks'],
    prereq: ['embeddings'],
    concepts: ['tokenization', 'embeddings', 'sigmoid-and-link-functions', 'gradient-descent'],
    labIntro: r`A toy Transformer you can read. Each word has a small, labelled embedding (is it a noun, an animal, a place, a pronoun, a verb). Click a word to make it the query: the arcs show where it looks, and the panel below works through the scores, softmax and output. Two heads are available: one matches meaning, one looks at position.`,
    tryThis: [r`Click "it": the meaning head sends most of its attention to "animal", six words away.`, r`Switch to the position head: every word now looks mainly at the word just before it.`, r`Lower the temperature: attention becomes almost one-hot. Raise it: attention spreads evenly and the output becomes an average of everything.`, r`Turn on the causal mask and click the first word: it can only attend to itself.`],
    keywords: 'transformer attention self-attention query key value multi-head positional encoding llm bert gpt',
  },
];
