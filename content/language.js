// From text to vectors: the two steps that happen before a Transformer sees anything.
// Tokenization (text -> integer ids) and embeddings (ids -> vectors, plus position).
// See regression.js for conventions.
const r = String.raw;

module.exports = [
  {
    id: 'tokenization', short: 'Tokenization (BPE)', title: 'Tokenization and Byte-Pair Encoding (BPE)',
    task: 'concepts', level: 2, minutes: 20,
    explainer: 'bpe', architecture: 'tokenizer', labFile: 'language',
    archIntro: r`What happens to a sentence between you pressing Enter and the model doing any maths, shown with GPT-2’s real tokenizer settings. Hover over any stage (or tap it on a phone) for what it does and an example.`,
    summary: r`Models read numbers, not text. A tokenizer cuts text into pieces from a fixed vocabulary and gives each piece an id. Byte-Pair Encoding learns those pieces by repeatedly merging the most frequent pair.`,
    lead: r`A tokenizer turns <code class="no-math">"Tokenizers are unbelievably useful"</code> into a short list of integers, one per piece. It is not a neural network and it is not trained by gradient descent: it is a fixed lookup procedure, learned once from a large text corpus, and every model is tied to the tokenizer it was trained with.`,
    intuition: [
      r`There are three obvious ways to cut text. <strong>Characters</strong> need a tiny vocabulary and never meet an unknown symbol, but sequences become very long, and attention cost grows with the square of the length. <strong>Whole words</strong> keep sequences short, but the vocabulary explodes (every name, typo and verb form) and any word not seen in training becomes an unknown <code class="no-math">[UNK]</code>. <strong>Subwords</strong> sit in between: frequent words stay whole (<em>the</em>, <em>model</em>), rare words are split into reusable parts (for example <em>un</em> + <em>believ</em> + <em>ably</em>).`,
      r`<strong>Byte-Pair Encoding</strong> finds those subwords automatically. Start with single characters. Count every pair of neighbouring symbols in the corpus, merge the most frequent pair into one new symbol, and repeat. Each merge adds one entry to the vocabulary; after a few tens of thousands of merges, common words are single tokens and everything else can still be spelled out from smaller pieces. To tokenize new text, the same merges are replayed in the same order.`,
      r`Modern LLM tokenizers run BPE on <strong>bytes</strong> instead of characters (GPT-2, GPT-4, Llama 3). The 256 possible byte values form the base vocabulary, so any text in any language, emoji or binary junk can be encoded and nothing is ever unknown. The price is that languages under-represented in the training corpus need many more tokens for the same sentence, which makes them slower and more expensive to process.`,
    ],
    analogy: r`Text messaging shorthand that grows over time: people who type “thank you” often enough start writing “ty”. BPE does the same thing statistically: the most frequent pairs earn their own shortcut, rare words are still spelled out letter by letter.`,
    steps: [
      r`<strong>Normalise</strong> the text if the tokenizer does that (Unicode normalisation, sometimes lower-casing; GPT-style tokenizers keep text exactly as is).`,
      r`<strong>Pre-tokenize</strong>: split into word-like chunks on spaces and punctuation with a regular expression, keeping the leading space as part of the word (GPT-2 shows it as <code class="no-math">Ġ</code>, SentencePiece as <code class="no-math">▁</code>), so merges never cross word boundaries.`,
      r`<strong>Train</strong> (once): start from characters or bytes, repeatedly merge the most frequent adjacent pair, and record every merge in order until the vocabulary reaches its target size.`,
      r`<strong>Encode</strong> new text: split each chunk into bytes and apply the recorded merges in priority order. Look up each resulting piece in the vocabulary to get its id.`,
      r`Add <strong>special tokens</strong> such as <code class="no-math">&lt;|endoftext|&gt;</code>, <code class="no-math">[CLS]</code>, <code class="no-math">[SEP]</code> or chat-role markers, and pad or truncate to the context length.`,
      r`<strong>Decode</strong> is the reverse: ids → pieces → bytes → text. Encoding then decoding gives back the exact original string.`,
    ],
    math: [
      { h: 'One BPE merge', tex: r`$$(a^\*, b^\*) = \arg\max_{(a,b)} \operatorname{count}(a\,b), \qquad V \leftarrow V \cup \{a^\*b^\*\}$$`, p: r`Count each adjacent pair across the corpus, weighted by how often each word occurs. The winning pair becomes one symbol everywhere, and the counts are recomputed.` },
      { h: 'Vocabulary size', tex: r`$$|V| = |\text{base symbols}| + \#\text{merges} + \#\text{special tokens}$$`, p: r`GPT-2: $256$ bytes $+\; 50{,}000$ merges $+\; 1$ end-of-text token $= 50{,}257$. A bigger vocabulary means shorter sequences but a larger embedding table and rarer, less well-trained tokens.` },
      { h: 'WordPiece (BERT) picks merges differently', tex: r`$$\text{score}(a, b) = \frac{\operatorname{count}(ab)}{\operatorname{count}(a)\,\operatorname{count}(b)}$$`, p: r`Instead of raw frequency, it prefers pairs that occur together more often than their parts would suggest. Continuation pieces are marked with ##: <code class="no-math">un ##believ ##ably</code>.` },
      { h: 'Unigram LM (SentencePiece) works the other way round', tex: r`$$\hat{\mathbf x} = \arg\max_{\mathbf x \in S(\text{text})} \prod_i p(x_i)$$`, p: r`Start from a large candidate vocabulary and prune the pieces that hurt the corpus likelihood least. Encoding picks the most probable segmentation, and training can sample different segmentations as a form of regularisation.` },
      { h: 'Why token count matters', tex: r`$$\text{attention cost} \propto T^2, \qquad T \approx \frac{\text{characters}}{4} \text{ for English}$$`, p: r`Context limits, API prices and latency are all counted in tokens. Text that tokenizes badly (rare languages, long numbers, unusual code) uses up the context window faster.` },
    ],
    keyPoints: [
      r`A tokenizer is fixed before the model is trained; a model only understands ids from its own tokenizer.`,
      r`BPE = start from characters or bytes, repeatedly merge the most frequent neighbouring pair, replay those merges to encode.`,
      r`Byte-level BPE never produces an unknown token, but rare scripts and languages can take several times more tokens.`,
      r`Many “LLM quirks” are tokenizer quirks: counting letters in a word, arithmetic on long numbers, and leading-space sensitivity.`,
    ],
    code: r`# 1) Byte-pair encoding from scratch on a toy corpus
from collections import Counter

corpus = {"low": 5, "lower": 2, "newest": 6, "widest": 3}
words = {tuple(w) + ("</w>",): c for w, c in corpus.items()}       # split into characters

def merge_step(words):
    pairs = Counter()
    for sym, c in words.items():
        for a, b in zip(sym, sym[1:]):
            pairs[a, b] += c
    (a, b), n = pairs.most_common(1)[0]
    out = {}
    for sym, c in words.items():
        new, i = [], 0
        while i < len(sym):
            if i < len(sym) - 1 and sym[i] == a and sym[i + 1] == b:
                new.append(a + b); i += 2
            else:
                new.append(sym[i]); i += 1
        out[tuple(new)] = c
    return out, (a, b, n)

for _ in range(6):
    words, m = merge_step(words)
    print("merge", m)          # ('e','s',9) ('es','t',9) ('est','</w>',9) ('l','o',7) ...

# 2) A real tokenizer (pip install tiktoken)
import tiktoken
enc = tiktoken.get_encoding("gpt2")
ids = enc.encode("Tokenizers are unbelievably useful")
print(ids, [enc.decode([i]) for i in ids], enc.n_vocab)       # 50257 tokens

# 3) Train your own byte-level BPE (pip install tokenizers)
from tokenizers import ByteLevelBPETokenizer
tok = ByteLevelBPETokenizer()
tok.train(files=["my_corpus.txt"], vocab_size=8000, min_frequency=2, special_tokens=["<|endoftext|>"])`,
    pitfalls: [
      r`Using a model with a different tokenizer than it was trained with: the ids mean different things and the output is garbage.`,
      r`Estimating context length in words or characters; count tokens with the model’s own tokenizer.`,
      r`Forgetting that <code class="no-math">"Hello"</code> and <code class="no-math">" Hello"</code> are different tokens; stray spaces in prompts change what the model sees.`,
      r`Adding new special tokens without resizing (and training) the model’s embedding table.`,
    ],
    quiz: [
      {
        q: r`At each training step, BPE merges:`,
        o: [
          r`The two rarest characters`,
          r`The most frequent pair of neighbouring symbols`,
          r`Every pair that appears at least twice`,
          r`Whole words into sentences`,
        ],
        a: 1,
        why: r`One merge per step, chosen by frequency; the merge is then applied everywhere.`,
        d: 1,
      },
      {
        q: r`Why can byte-level BPE never produce an unknown token?`,
        o: [
          r`It has an infinite vocabulary`,
          r`Every possible byte is in the base vocabulary, so anything can be spelled out`,
          r`It ignores characters it does not know`,
          r`It uses a neural network to guess`,
        ],
        a: 1,
        why: r`Any text is a sequence of bytes, and all 256 byte values are tokens.`,
        d: 1,
      },
      {
        q: r`A larger vocabulary generally gives:`,
        o: [
          r`Longer sequences and a smaller embedding table`,
          r`Shorter sequences and a larger embedding table`,
          r`No change in sequence length`,
          r`Better arithmetic automatically`,
        ],
        a: 1,
        why: r`More merges mean bigger pieces (fewer tokens per text), but each extra token needs its own row of embedding weights.`,
        d: 1,
      },
      {
        q: r`To tokenize new text, a BPE tokenizer:`,
        o: [
          r`Retrains on the new text`,
          r`Replays the learned merges in the order they were learned`,
          r`Picks merges at random`,
          r`Looks up whole sentences`,
        ],
        a: 1,
        why: r`Merge order is the priority; that makes encoding deterministic.`,
        d: 1,
      },
      {
        q: r`How does WordPiece (used in BERT) decide which subword pair $(a, b)$ to merge during training, compared with standard BPE?`,
        o: [
          r`WordPiece selects the pair that maximises $\frac{\operatorname{count}(ab)}{\operatorname{count}(a)\operatorname{count}(b)}$ (relative likelihood improvement), whereas BPE simply picks the pair with the highest raw co-occurrence count`,
          r`WordPiece merges whole sentences directly using hidden Markov models`,
          r`WordPiece selects the least frequent character pair to keep vocabulary balanced`,
          r`WordPiece relies on a neural network trained with cross-entropy loss`,
        ],
        a: 0,
        why: r`While standard BPE greedily merges the pair with highest absolute count, WordPiece scores pairs by $\frac{\operatorname{count}(ab)}{\operatorname{count}(a)\operatorname{count}(b)}$. This penalises components that already appear frequently on their own, favouring pairs that co-occur far more often than expected by chance.`,
        d: 2,
      },
      {
        q: r`In GPT-style tokenizers (such as tiktoken for GPT-2 / GPT-4), why do "apple" and " apple" (with a leading space) receive completely different token IDs?`,
        o: [
          r`Leading spaces are converted into random numerical noise`,
          r`The tokenizer ignores spaces entirely and creates duplicates by mistake`,
          r`Pre-tokenization attaches the space as a prefix character (e.g. Ġapple), preventing merges from crossing word boundaries and creating distinct vocabulary entries for word starts`,
          r`One-hot encoding requires odd-length strings to have different hashes`,
        ],
        a: 2,
        why: r`GPT tokenizers attach the leading space directly to the subsequent token (represented in GPT-2 vocab as Ġ). Because "apple" and " apple" are different byte sequences, they have separate IDs in the vocabulary table.`,
        d: 2,
      },
      {
        q: r`Why do modern large language models use subword tokenization (such as BPE) rather than pure character-level or pure whole-word tokenization?`,
        o: [
          r`Subword tokenization eliminates the need for positional encodings`,
          r`Character-level tokenization cannot process punctuation marks`,
          r`Subword tokenization guarantees linear $O(T)$ attention cost`,
          r`Subwords balance sequence length and vocabulary size: common words stay whole while rare words are decomposed into known chunks, avoiding out-of-vocabulary [UNK] tokens without creating massive sequence lengths`,
        ],
        a: 3,
        why: r`Whole-word tokenizers require enormous vocabularies and choke on unseen words ([UNK]). Character tokenizers produce tiny vocabularies but inflate sequence lengths by 4–5×, which is catastrophic for $O(T^2)$ Transformer attention. Subwords strike an optimal balance between the two extremes.`,
        d: 2,
      },
      {
        q: r`A custom byte-level BPE tokenizer uses the standard 256 initial byte values. During training, it executes exactly 32,000 merge operations, and the developer adds 4 special tokens (<|pad|>, <|bos|>, <|eos|>, <|unk|>). What is the final total vocabulary size $|V|$?`,
        o: [
          r`32,260`,
          r`32,256`,
          r`32,000`,
          r`32,512`,
        ],
        a: 0,
        why: r`The total vocabulary size is $|V| = |\text{base bytes}| + \#\text{merges} + \#\text{special tokens} = 256 + 32{,}000 + 4 = 32{,}260$.`,
        d: 2,
      },
      {
        q: r`Unlike BPE which builds up a vocabulary bottom-up through iterative merges, how does the Unigram Language Model tokenizer (used in SentencePiece and T5) construct its final vocabulary?`,
        o: [
          r`It merges words based strictly on alphabetical order`,
          r`It clusters word embeddings using $k$-means to select centroids as tokens`,
          r`It randomly removes 10% of characters from every sentence`,
          r`It starts from a massive initial candidate vocabulary and iteratively prunes subwords that minimise the decrease in corpus likelihood until reaching the desired vocabulary size`,
        ],
        a: 3,
        why: r`Unigram LM works top-down: it initialises with a large candidate pool of subwords, estimates a unigram probability for each, and iteratively discards the subwords whose removal hurts the overall training corpus likelihood the least.`,
        d: 2,
      },
      {
        q: r`A toy training corpus consists of three words with word frequencies: "cost" (frequency 4), "lost" (frequency 6), and "lose" (frequency 2). Before any merges take place, which adjacent character pair has the highest count and will be selected for the first BPE merge?`,
        o: [
          r`('l', 'o') with count 8`,
          r`('s', 't') with count 10`,
          r`('o', 's') with count 12`,
          r`('c', 'o') with count 4`,
        ],
        a: 2,
        why: r`Counting adjacent pairs across all occurrences: ('o', 's') appears in "cost" (4), "lost" (6), and "lose" (2), giving total count $4 + 6 + 2 = 12$. Meanwhile, ('s', 't') totals $4 + 6 = 10$, and ('l', 'o') totals $6 + 2 = 8$. Therefore, ('o', 's') wins the first merge.`,
        d: 3,
      },
      {
        q: r`A standard Transformer's self-attention compute cost scales quadratically with sequence length $T$ ($O(T^2)$). A short text passage tokenizes into 200 tokens in English. Due to tokenizer representation bias, the identical text in an underrepresented language tokenizes into 600 tokens ($3\times$ as many). By what factor does the attention compute cost increase for the underrepresented language?`,
        o: [
          r`$3.0\times$`,
          r`$6.0\times$`,
          r`$9.0\times$`,
          r`$27.0\times$`,
        ],
        a: 2,
        why: r`Attention cost scales with the square of sequence length: $\left(\frac{T_B}{T_A}\right)^2 = \left(\frac{600}{200}\right)^2 = 3^2 = 9.0\times$. A $3\times$ increase in token count results in a $9\times$ surge in self-attention FLOPs and memory footprint, directly impacting latency and cost.`,
        d: 3,
      },
      {
        q: r`Why do modern large language models often fail at simple character-level tasks, such as counting the number of occurrences of the letter "r" in the word "strawberry"?`,
        o: [
          r`The model never observes individual characters because the tokenizer collapses "strawberry" into multi-letter subword chunks (e.g. "straw" + "berry"), obscuring the underlying character sequence`,
          r`The model's embedding vectors are initialised with Gaussian noise`,
          r`Self-attention heads are mathematically prohibited from inspecting consonant letters`,
          r`The softmax cross-entropy loss function is insensitive to character frequencies`,
        ],
        a: 0,
        why: r`Models never see raw character strings; they only receive integer token IDs. Because "strawberry" is parsed as subword chunks, the network has no direct access to individual letters unless explicitly prompted to spell the word out character by character.`,
        d: 3,
      },
    ],
    usedBy: ['transformer_networks'],
    prereq: ['lstm_networks'],
    related: ['embeddings', 'transformer_networks'],
    labIntro: r`A real BPE tokenizer, trained in your browser on a short paragraph about machine learning (shown below the lab). Drag the merges slider to grow the vocabulary, or press <em>Train</em> to watch the merges happen one by one. Type anything into the box to see how it is cut up and which ids it gets.`,
    tryThis: [
      r`Set merges to 0: every character is its own token. Now press <em>Train</em> and watch frequent words like “ the” and “ model” collapse into single tokens.`,
      r`Type a word that is not in the corpus, like “unlearnable” or “remodel”. It is still tokenized, from pieces the tokenizer has seen.`,
      r`Type “Model” with a capital M, or a word in Hindi or an emoji. Unseen characters fall back to raw bytes, and the token count jumps.`,
      r`Compare “ the” with “the” at the start of the box: the leading space is part of the token.`,
    ],
    keywords: 'tokenization tokenizer bpe byte pair encoding wordpiece sentencepiece unigram subword vocabulary tiktoken gpt token ids',
  },
  {
    id: 'embeddings', short: 'Embeddings', title: 'Embeddings and Positional Encoding',
    task: 'concepts', level: 2, minutes: 22,
    explainer: 'embed', architecture: 'embedding', labFile: 'language',
    archIntro: r`The input layer of a GPT-2-sized Transformer, from token ids to the vectors the first attention layer reads. Hover over any part (or tap it on a phone) for its shape, its parameter count and what it learns.`,
    summary: r`An embedding turns each token id into a learned vector, so that similar tokens end up close together. Positional encodings add the word order that attention would otherwise ignore.`,
    lead: r`A token id like <code class="no-math">2746</code> is just a name: id 2746 is not “bigger” or “closer” to anything than id 12. An <strong>embedding</strong> replaces each id with a row of a learned table, a vector of a few hundred numbers, and training arranges those vectors so that their geometry means something: similar words point in similar directions.`,
    intuition: [
      r`The naive way to feed ids to a network is <strong>one-hot</strong> vectors: 50,257 numbers, all zero except a single 1. They are huge, and every pair of words is equally far apart, so “cat” is no more similar to “kitten” than to “carburettor”. Multiplying a one-hot vector by a weight matrix just picks out one row of it, so in practice we skip the multiplication and <strong>look the row up</strong>. That table of rows is the embedding layer: a matrix of shape vocabulary × d.`,
      r`The rows start random and are learned. Words that appear in similar contexts receive similar gradients and drift together (“You shall know a word by the company it keeps”). Directions in the space can become meaningful too: the step from <em>man</em> to <em>woman</em> is roughly the same as from <em>king</em> to <em>queen</em>. Word2vec and GloVe learned such vectors on their own; in a Transformer the table is simply the first layer and is trained together with everything else.`,
      r`Self-attention compares every token with every other token but has no idea where they are: “dog bites man” and “man bites dog” would look identical. So a <strong>positional encoding</strong> is added to each token’s embedding. The original Transformer used fixed sine and cosine waves of different wavelengths; GPT-2 and BERT learn one vector per position; many current LLMs (Llama, Mistral) use rotary embeddings (RoPE), which rotate queries and keys by an angle that depends on position.`,
      r`Embeddings at the input are <strong>static</strong>: “bank” has one vector whether it is a river bank or a money bank. After a few attention layers the vector is mixed with its context and becomes <strong>contextual</strong>. Those contextual vectors, pooled over a sentence, are the “sentence embeddings” used for semantic search and retrieval-augmented generation.`,
    ],
    analogy: r`A map of a city where every word is a building. At first the buildings are scattered at random. Over training, words that are used for the same purposes move into the same neighbourhood, and the streets between neighbourhoods start to mean something: walking “north” might always mean “more formal”, walking “east” “female rather than male”.`,
    steps: [
      r`Tokenize the text into ids ([[tokenization|see tokenization]]).`,
      r`Create an embedding matrix $E$ of shape $|V| \times d$ (for GPT-2 small: $50{,}257 \times 768$), initialised with small random numbers.`,
      r`For each id, take its row: $e_t = E[\text{id}_t]$. A sentence of $T$ tokens becomes a $T \times d$ matrix.`,
      r`Add a position vector $p_t$ for each position $t$ (sinusoidal, learned, or applied later as a rotation with RoPE).`,
      r`Feed the result into the first [[transformer_networks|Transformer]] block. Gradients from the loss flow all the way back into the rows of $E$ that were used.`,
      r`Optionally reuse $E^\top$ as the output layer (weight tying), so the same table maps ids to vectors and vectors back to scores over ids.`,
    ],
    math: [
      { h: 'Lookup = one-hot times a matrix', tex: r`$$e = \mathbf 1_{\text{id}}^\top E = E[\text{id}, :] \in \mathbb R^{d}$$`, p: r`Mathematically a linear layer applied to a one-hot vector, implemented as an index operation because the one-hot vector would be enormous.` },
      { h: 'Similarity is an angle', tex: r`$$\cos(u, v) = \frac{u \cdot v}{\lVert u\rVert\,\lVert v\rVert} \in [-1, 1]$$`, p: r`1 means the same direction, 0 unrelated, −1 opposite. Nearest-neighbour search over embeddings almost always uses cosine similarity or a dot product.` },
      { h: 'Learning from co-occurrence (GloVe)', tex: r`$$J = \sum_{i,j} f(X_{ij})\,\big(w_i \cdot \tilde w_j + b_i + \tilde b_j - \log X_{ij}\big)^2$$`, p: r`$X_{ij}$ counts how often word $j$ appears near word $i$. Fitting dot products to log counts forces words with similar neighbours to have similar vectors. The lab on this page trains exactly this kind of objective.` },
      { h: 'Sinusoidal positional encoding', tex: r`$$PE_{(t,\,2i)} = \sin\!\Big(\frac{t}{10000^{2i/d}}\Big), \qquad PE_{(t,\,2i+1)} = \cos\!\Big(\frac{t}{10000^{2i/d}}\Big)$$`, p: r`Each pair of dimensions is a clock ticking at a different speed: early dimensions change every token, late ones barely change across thousands. Any shift $k$ is a fixed rotation, so relative positions are easy to read off.` },
      { h: 'What the first block receives', tex: r`$$x_t = E[\text{id}_t] + p_t, \qquad X \in \mathbb R^{T \times d}$$`, p: r`The original Transformer also multiplied $E[\text{id}_t]$ by $\sqrt d$ so the embedding is not drowned out by the position signal.` },
      { h: 'Parameter count', tex: r`$$|V| \cdot d = 50{,}257 \times 768 \approx 38.6\text{ M}$$`, p: r`About 31% of GPT-2 small’s 124 M parameters sit in this one table, which is why output layers usually share (tie) it.` },
    ],
    keyPoints: [
      r`An embedding layer is a learned lookup table: id in, vector out. It is trained like any other weight.`,
      r`Closeness in embedding space (cosine similarity) reflects similar usage, not dictionary meaning.`,
      r`Attention is blind to order; positional information must be added (sinusoidal, learned or RoPE).`,
      r`Input embeddings are static; vectors after attention layers are contextual, and those are what sentence embeddings and semantic search use.`,
    ],
    code: r`import math, torch, torch.nn as nn

vocab, d, T = 50257, 768, 8
ids = torch.randint(0, vocab, (1, T))              # stand-in for one tokenized sentence

tok_emb = nn.Embedding(vocab, d)                 # the lookup table, vocab x d
pos_emb = nn.Embedding(1024, d)                  # learned positions (GPT-2 / BERT style)
x = tok_emb(ids) + pos_emb(torch.arange(T))      # (1, T, d): what the first block reads

# fixed sinusoidal positions (original Transformer)
def sinusoidal(T, d):
    pos = torch.arange(T).unsqueeze(1)
    freq = torch.exp(torch.arange(0, d, 2) * (-math.log(10000.0) / d))
    pe = torch.zeros(T, d)
    pe[:, 0::2], pe[:, 1::2] = torch.sin(pos * freq), torch.cos(pos * freq)
    return pe

# cosine similarity between two token vectors
cos = nn.functional.cosine_similarity(tok_emb.weight[ids[0, 1]], tok_emb.weight[ids[0, 2]], dim=0)

# pre-trained sentence embeddings for search (pip install sentence-transformers)
# from sentence_transformers import SentenceTransformer
# model = SentenceTransformer("all-MiniLM-L6-v2")          # 384-dimensional vectors
# vecs = model.encode(["a cat on a mat", "a kitten on a rug"], normalize_embeddings=True)`,
    pitfalls: [
      r`Comparing embeddings from two different models; each model has its own space and the axes do not line up.`,
      r`Reading analogies like king − man + woman ≈ queen as proof of understanding: they work for some relations and fail quietly for many others, and they inherit biases from the training text.`,
      r`Using the raw input embeddings of a Transformer as sentence embeddings; use a model trained for sentence similarity.`,
      r`Forgetting positional information in a custom attention model, then wondering why word order has no effect.`,
    ],
    quiz: [
      {
        q: r`An embedding layer is mathematically equivalent to:`,
        o: [
          r`A convolution`,
          r`Multiplying a one-hot vector by a weight matrix`,
          r`A softmax over the vocabulary`,
          r`A fixed hash function`,
        ],
        a: 1,
        why: r`The product picks out one row, so frameworks implement it as a lookup.`,
        d: 1,
      },
      {
        q: r`Why do Transformers need positional encodings?`,
        o: [
          r`To make embeddings smaller`,
          r`Self-attention treats its input as an unordered set`,
          r`To normalise the vectors`,
          r`To speed up the softmax`,
        ],
        a: 1,
        why: r`Without positions, shuffling the words gives the same set of outputs.`,
        d: 1,
      },
      {
        q: r`Two words have cosine similarity close to 1. That means:`,
        o: [
          r`They are spelled similarly`,
          r`Their vectors point in nearly the same direction, usually because they are used in similar contexts`,
          r`They have the same token id`,
          r`They always appear next to each other`,
        ],
        a: 1,
        why: r`Similar contexts produce similar gradients, which pull the vectors together.`,
        d: 1,
      },
      {
        q: r`How many parameters does a 50,257 × 768 embedding table have?`,
        o: [
          r`768`,
          r`50,257`,
          r`About 38.6 million`,
          r`About 124 million`,
        ],
        a: 2,
        why: r`One 768-number row per token: $50{,}257 \times 768$.`,
        d: 2,
      },
      {
        q: r`What is the key difference between a token's input embedding and its representation after passing through several Transformer attention layers?`,
        o: [
          r`The input embedding only represents vowels`,
          r`The input embedding has 10 times more dimensions than the contextual representation`,
          r`The input embedding is non-differentiable, while the contextual representation is learned`,
          r`The input embedding is static (identical regardless of sentence context), while the representation after attention is contextual (tailored to surrounding words)`,
        ],
        a: 3,
        why: r`In the input lookup table $E$, "bank" has one fixed vector. Self-attention layers mix information across tokens, transforming it into a contextual embedding that distinguishes between a financial bank and a river bank.`,
        d: 1,
      },
      {
        q: r`Why do many language model architectures (such as GPT-2) tie the weights of the input embedding matrix $E$ with the final output linear projection layer ($E^\top$)?`,
        o: [
          r`To save memory and parameters (about 31% of GPT-2 small's parameters) while enforcing that input and output token representations live in the same geometric space`,
          r`To prevent the model from learning non-linear functions`,
          r`To force output logits to sum to 1 without needing a softmax`,
          r`To make the model run without GPU memory`,
        ],
        a: 0,
        why: r`The input embedding table and output projection matrix both have shape $|V| \times d$. Reusing $E^\top$ at the output eliminates nearly 38.6 million redundant parameters in GPT-2 small and links input and output semantic representations.`,
        d: 2,
      },
      {
        q: r`Two token embedding vectors are $u = [3.0, 4.0]^\top$ and $v = [1.0, 0.0]^\top$. What is the cosine similarity $\cos(u, v) = \frac{u \cdot v}{\|u\| \|v\|}$ between these two embeddings?`,
        o: [
          r`$0.30$`,
          r`$0.50$`,
          r`$0.75$`,
          r`$0.60$`,
        ],
        a: 3,
        why: r`The dot product is $u \cdot v = (3 \times 1) + (4 \times 0) = 3.0$. The Euclidean norms are $\|u\| = \sqrt{3^2 + 4^2} = \sqrt{25} = 5.0$ and $\|v\| = 1.0$. Thus $\cos(u, v) = \frac{3.0}{5.0 \times 1.0} = 0.60$.`,
        d: 2,
      },
      {
        q: r`What is the main operational limitation of learned absolute positional embeddings (as in GPT-2 and BERT) compared with sinusoidal or relative positional encodings?`,
        o: [
          r`Learned positional embeddings have a fixed maximum length (e.g. 1024 tokens) and cannot easily generalise to sequence lengths longer than seen during training`,
          r`Learned positional embeddings cannot be stored in GPU memory`,
          r`Learned positional embeddings prevent the network from attending to the first token`,
          r`Learned positional embeddings make the attention matrix non-invertible`,
        ],
        a: 0,
        why: r`A learned positional table has a hard capacity limit (e.g. nn.Embedding(1024, d)). Any sequence longer than 1024 has no allocated position vector to look up, whereas mathematical sinusoidal or rotary encodings can naturally extrapolate to arbitrary sequence lengths.`,
        d: 2,
      },
      {
        q: r`During a training step on a batch of text containing 100 distinct token IDs from a vocabulary of 50,000 tokens, how many rows of the input embedding matrix $E$ receive non-zero gradient updates during backpropagation?`,
        o: [
          r`0 rows, because embeddings are fixed lookup tables`,
          r`All 50,000 rows`,
          r`Exactly the 100 rows corresponding to the tokens present in that batch`,
          r`Exactly half the vocabulary (25,000 rows)`,
        ],
        a: 2,
        why: r`Because each token position looks up exactly one row $E[\text{id}]$, gradients only flow back to the rows that were indexed during the forward pass. The remaining 49,900 rows receive zero gradient, which is why optimisers often support sparse updates for embedding layers.`,
        d: 2,
      },
      {
        q: r`In the original Transformer paper ("Attention Is All You Need"), what is the usual explanation for multiplying the token embeddings by $\sqrt{d_{\text{model}}}$ before adding the sinusoidal positional encodings ($x_t = \sqrt{d} \cdot E[\text{id}_t] + p_t$)?`,
        o: [
          r`To ensure that the embedding vectors sum to 1.0 across the sequence`,
          r`To make the embedding matrix orthogonal`,
          r`To convert cosine distances into Euclidean distances`,
          r`Because embedding tables are typically initialised with variance $\sim 1/d$, giving vectors an expected L2 norm of $\sim 1.0$, whereas positional encodings have an L2 norm of $\sqrt{d/2}$; multiplying by $\sqrt{d}$ scales embedding magnitudes up so the semantic content is not overwhelmed by the positional signal`,
        ],
        a: 3,
        why: r`With standard initialisation, embedding vector entries have standard deviation $\approx 1/\sqrt{d}$, giving the vector norm $\mathcal{O}(1)$. Sinusoidal positional vectors, composed of sines and cosines, have an expected norm of $\sqrt{d/2}$. Multiplying embeddings by $\sqrt{d}$ boosts their norm to $\mathcal{O}(\sqrt{d})$, keeping semantic word identity and positional information balanced in magnitude.`,
        d: 3,
      },
      {
        q: r`Under the standard sinusoidal positional encoding formulas $PE_{(t, 2i)} = \sin\left(\frac{t}{10000^{2i/d}}\right)$ and $PE_{(t, 2i+1)} = \cos\left(\frac{t}{10000^{2i/d}}\right)$, what are the values of the first two dimensions $(PE_{(0, 0)}, PE_{(0, 1)})$ for the very first token at position $t = 0$?`,
        o: [
          r`$(0.0, \, 0.0)$`,
          r`$(1.0, \, 0.0)$`,
          r`$(0.0, \, 1.0)$`,
          r`$(1.0, \, 1.0)$`,
        ],
        a: 2,
        why: r`At position $t = 0$, for index $i=0$: $PE_{(0, 0)} = \sin\left(\frac{0}{10000^0}\right) = \sin(0) = 0.0$. For the odd dimension $2i+1 = 1$: $PE_{(0, 1)} = \cos(0) = 1.0$. Thus the vector begins with $(0.0, 1.0)$.`,
        d: 3,
      },
      {
        q: r`A language model has a vocabulary of 64,000 tokens and an embedding dimension of $d_{\text{model}} = 1,024$. How many learnable parameters reside in the input embedding table alone?`,
        o: [
          r`Approximately 65.5 million`,
          r`Approximately 6.55 million`,
          r`65,536`,
          r`Approximately 131.1 million`,
        ],
        a: 0,
        why: r`The embedding table is a matrix of size $|V| \times d = 64{,}000 \times 1{,}024 = 65{,}536{,}000 \approx 65.5$ million parameters. Untied embeddings would require a second table of identical size at the output head ($\approx 131.1$ million total).`,
        d: 3,
      },
    ],
    usedBy: ['transformer_networks', 'recurrent_neural_networks', 'lstm_networks'],
    prereq: ['tokenization'],
    related: ['tokenization', 'transformer_networks', 'gradient-descent'],
    labIntro: r`Sixteen words and about a hundred short sentences (“the queen lives in the palace”, “the puppy chased the ball”). Press <em>Train</em> to learn 8-dimensional word vectors from scratch with a GloVe-style objective, right here in your browser; the map shows them projected to 2-D. Then click words to find their nearest neighbours, or try a vector analogy.`,
    tryThis: [
      r`Press <em>Train</em> and watch the random cloud sort itself into royals, ordinary people, animals and food.`,
      r`Click “cat”: its nearest neighbour is “dog”, not “kitten”. Both are adult pets that sleep all day, so they share more contexts.`,
      r`Switch to <em>Analogy</em> and pick king − man + woman: the arrow from man to woman, added to king, lands next to queen.`,
      r`Press <em>Random start</em> and look at the analogy again: before training, the arithmetic finds nothing.`,
    ],
    keywords: 'embedding embeddings word2vec glove vector one-hot cosine similarity positional encoding sinusoidal rope learned position semantic search',
  },
];
