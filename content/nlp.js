// Lessons for this track. Conventions: see regression.js and CLAUDE.md.
const r = String.raw;
module.exports = [
  {
  id: 'text-normalisation-unicode-and-regex',
  short: 'Normalisation & Regex',
  title: 'Text normalisation, Unicode and regex',
  task: 'concepts',
  module: 'Words and text',
  level: 1,
  minutes: 14,
  noLab: true,
  summary: r`Raw unstructured text is fraught with encoding inconsistencies, non-standard whitespace, varying case representations, and visual homoglyphs. Text normalisation transforms raw character sequences into consistent canonical representations prior to tokenisation and language modelling. By mastering Unicode standardisation forms (NFC, NFD, NFKC, NFKD) to resolve visually identical glyph representations, deploying case folding to consolidate vocabularies, and using declarative regular expressions (regex) to strip noise and extract structured patterns (dates, URLs, phone numbers, monetary figures), natural language pipelines eliminate spurious out-of-vocabulary tokens and stabilise downstream model convergence.`,
  lead: r`To human eyes, the word "café" written with a precomposed acute accent character (U+00E9) looks indistinguishable from "cafe" followed by a combining acute accent (U+0065 U+0301). Yet to a computer or neural embedding layer, these represent completely different byte sequences and hash to distinct dictionary entries. A web scraper collecting user comments will encounter curly quotes, non-breaking spaces, emoticons, multiple exclamation marks, and mixed encodings. Before an algorithm can parse syntax or learn semantic embeddings, it must normalise text into clean, canonical strings.`,
  intuition: [
    r`The Unicode standard and canonical equivalence: The Unicode consortium assigns a unique code point (e.g. U+0041 for 'A') to every character across human writing systems. However, historical design compromises created multiple representations for identical glyphs: a character with an accent can be stored as a single "precomposed" code point (e.g. 'é' as U+00E9) or as a base character followed by a "combining" accent mark ('e' + '´' as U+0065 U+0301). Canonical equivalence establishes that these represent the exact same abstract character. Without Unicode normalisation, string equality tests ('é' == 'e\u0301') fail, splitting model vocabularies in two.`,
    r`The four Unicode normalisation forms: Unicode standardises four normalisation algorithms: normalisation Form D (NFD, canonical decomposition, separating accents into combining marks); normalisation Form C (NFC, canonical decomposition followed by canonical composition, standardising on precomposed characters); normalisation Form KD (NFKD, compatibility decomposition); and normalisation Form KC (NFKC, compatibility decomposition followed by composition). While NFC is the web and Linux standard, compatibility forms (NFKC/NFKD) resolve typographical formatting variants—folding superscript numbers ($2^5 \to 25$), ligature glyphs ('ﬁ' $\to$ 'fi'), and full-width Asian characters into standard ASCII equivalents.`,
    r`Case folding and vocabulary compression: In natural language processing, distinguishing "Apple" (the technology company) from "apple" (the fruit) requires case sensitivity; however, for many information retrieval and sentiment analysis tasks, treating "The", "the", and "THE" as three separate vocabulary tokens increases parameter memory and fragments statistical counts. Lowercasing reduces vocabulary size. In international text, standard lowercasing is insufficient: German 'ß' lowercases to 'ß', but case folding transforms it to 'ss' (allowing 'GROSS' to match 'groß'). Unicode case folding provides language-agnostic character parity.`,
    r`Pattern extraction and noise filtering via Regular Expressions: Once text is canonically encoded, regular expressions (regex) provide a declarative finite-state engine for syntactic pattern matching and text sanitisation. Regex enables removing HTML tags (<[^>]+>), collapsing runs of whitespace (\s+ to single space), stripping control characters, and extracting structured semantic tokens (such as URLs, email addresses, and monetary currencies) before feeding clean text into subword tokenisers like BPE or WordPiece.`,
  ],
  analogy: r`Imagine a postal sorting depot receiving millions of handwritten envelopes every morning. Some senders write "NEW YORK", others write "new york", and some write "New York". Some use fountain pens with sharp accents; others tape printed address labels with typographic ligatures; others leave messy coffee cup stains (HTML tags and control codes). If the sorting machine treats every minor typographic quirk as a completely new city destination, it would need twenty thousand distinct mail sorting bins for New York alone. Text normalisation is like the initial automated intake scanner: it flattens case to canonical lowercase, strips stray postal tape marks, normalises accented characters into standard regional spellings, and cleans excess spaces. All twenty variations drop into a single, clean "new york" sorting bin with zero postal confusion.`,
  steps: [
    {
      title: r`Apply Unicode canonical normalisation`,
      desc: r`Transform diverse byte encodings into standard NFC or NFKC representations.`,
      detail: r`Pass raw text through unicodedata.normalise('NFKC', text). NFKC performs compatibility decomposition followed by canonical composition, converting ligatures (such as 'ﬁ' to 'f' and 'i'), full-width characters, and combining accent marks into their standard canonical forms.`,
    },
    {
      title: r`Execute language-aware case folding`,
      desc: r`Convert text to lowercase using Unicode case folding rather than naive ASCII lowercasing.`,
      detail: r`Use str.casefold() rather than str.lower(). Case folding handles complex multilingual character conversions (such as transforming German 'ß' into 'ss' and resolving Greek uppercase sigma variations), ensuring true linguistic parity.`,
    },
    {
      title: r`Sanitise whitespace and remove non-printing control codes`,
      desc: r`Strip non-breaking spaces, zero-width characters, and collapse redundant spacing.`,
      detail: r`Replace non-breaking spaces (\u00A0) and zero-width joiners (\u200B) with standard spaces. Use regular expressions re.sub(r'\s+', ' ', text).strip() to collapse multiple consecutive space and newline characters into single spaces.`,
    },
    {
      title: r`Filter noise and extract structured entities via regex`,
      desc: r`Identify and protect domain-specific semantic patterns (URLs, emails, numbers).`,
      detail: r`Before applying destructive punctuation stripping, extract or mask structured entities using regular expression patterns: URLs (https?://\S+), email addresses ([\w\.-]+@[\w\.-]+\.\w+), and phone numbers. Replace them with special domain tokens (<URL>, <EMAIL>) to preserve semantic signal.`,
    },
    {
      title: r`Strip unwanted punctuation and accents`,
      desc: r`Optionally strip diacritical marks and special punctuation for search indexing.`,
      detail: r`To strip accents for search indexing, decompose using NFD and filter out combining characters: ''.join(c for c in unicodedata.normalise('NFD', text) if unicodedata.category(c) != 'Mn'). Remove non-alphanumeric punctuation while preserving intra-word hyphens and apostrophes where appropriate.`,
    },
  ],
  math: [
    {
      h: r`Unicode canonical equivalence condition`,
      tex: r`S_1 \equiv_{\text{canonical}} S_2 \iff \operatorname{NFD}(S_1) = \operatorname{NFD}(S_2)`,
      p: r`Two character sequences $S_1$ and $S_2$ are canonically equivalent if and only if their normalisation Form D (NFD) decompositions yield identical sequences of Unicode code points.`,
    },
    {
      h: r`Unicode compatibility equivalence condition`,
      tex: r`S_1 \equiv_{\text{compatibility}} S_2 \iff \operatorname{NFKD}(S_1) = \operatorname{NFKD}(S_2)`,
      p: r`Compatibility equivalence is a weaker relation that equates characters representing the same abstract meaning but possessing distinct visual typography (such as ligature 'ﬁ' $\equiv$ 'f' + 'i', or circled digit '①' $\equiv$ '1'). normalisation Form KC (NFKC) composes compatibility decompositions into canonical precomposed characters.`,
    },
    {
      h: r`Vocabulary reduction ratio`,
      tex: r`\rho_{\text{vocab}} = 1 - \frac{|V_{\text{norm}}|}{|V_{\text{raw}}|}, \quad \text{OOV Rate} = \frac{N_{\text{unseen}}}{N_{\text{total\_tokens}}}`,
      p: r`Normalising casing and Unicode representations dramatically compresses vocabulary size $|V|$, reducing embedding table parameter memory while lowering the Out-Of-Vocabulary (OOV) rate on unseen test text.`,
    },
  ],
  keyPoints: [
    r`Text normalisation converts noisy, unstructured text into clean canonical strings prior to tokenisation.`,
    r`Unicode characters can have multiple encodings; NFC and NFKC standardise precomposed and compatibility glyphs.`,
    r`Case folding (str.casefold()) provides linguistically accurate casing parity across multilingual scripts beyond simple ASCII lowercasing.`,
    r`Regular expressions enable declarative pattern extraction (URLs, emails, dates) and whitespace sanitisation.`,
    r`Normalisation compresses vocabulary size and slashes Out-Of-Vocabulary (OOV) rates in downstream language models.`,
  ],
  pitfalls: [
    r`Stripping accents when language meaning depends on them: In languages like Spanish or French, stripping accents alters lexical meaning ('año' = year vs 'ano' = anus; 'pêche' = peach/fishing vs 'péché' = sin); only strip accents when building broad search indexes.`,
    r`Using naive str.lower() instead of str.casefold(): Standard lowercasing fails on multilingual characters like German 'ß' or Turkish 'I/ı', creating subtle search and tokenisation bugs.`,
    r`Running regex punctuation stripping before URL/email extraction: Naively removing punctuation like dots and slashes destroys URLs and email addresses before they can be parsed or tokenised.`,
    r`Over-normalising numbers and dates: Replacing all numbers with a generic <NUM> token in financial or legal models destroys crucial numerical values; use tailored tokenisation where numerical magnitude matters.`,
    r`Inconsistent normalisation between training and inference: If training data is normalised using NFKC lowercasing but live inference receives un-normalised raw Unicode, tokenisers produce disjoint embeddings and broken predictions.`,
  ],
  code: r`import unicodedata
import re

# 1. Unicode Normalisation demonstration: Resolving visual homoglyphs
# Precomposed 'e' with acute accent (U+00E9) vs decomposed 'e' + combining acute (U+0065, U+0301)
str1 = "café"                  # Precomposed: '\u0063\u0061\u0066\u00e9'
str2 = "cafe\u0301"             # Decomposed:  '\u0063\u0061\u0066\u0065\u0301'

print("Raw Unicode comparison:")
print(f"str1 ('{str1}') length: {len(str1)}, bytes: {[ord(c) for c in str1]}")
print(f"str2 ('{str2}') length: {len(str2)}, bytes: {[ord(c) for c in str2]}")
print(f"Direct string equality (str1 == str2): {str1 == str2} (FAILS without normalisation)")

# Normalise using NFC (Canonical Composition)
norm1 = unicodedata.normalise('NFC', str1)
norm2 = unicodedata.normalise('NFC', str2)
print(f"After NFC normalisation (norm1 == norm2): {norm1 == norm2} (MATCHES!)\n")

# 2. Resolving Typographic Ligatures with NFKC
# Typographic ligature 'fi' (U+FB01) vs separate letters 'f' and 'i'
ligature_str = "The scientific ﬁnding"
nfkc_str = unicodedata.normalise('NFKC', ligature_str)
print(f"Raw ligature string:   '{ligature_str}' (length {len(ligature_str)})")
print(f"After NFKC normalisation: '{nfkc_str}' (length {len(nfkc_str)}, 'ﬁ' split to 'f'+'i')\n")

# 3. Unicode Case Folding
german_text = "Der Fluss ist GROSS"
casefolded = german_text.casefold()
print(f"Raw German text:       '{german_text}'")
print(f"After casefold():      '{casefolded}' ('GROSS' correctly matches 'gross')\n")

# 4. Regex Pattern Masking and Noise Sanitisation
raw_corpus = "Contact support@example.com or visit https://ai.example.org/help!  Price:   £150.00   (tax-free)."

# Extract structured entities before cleaning
url_pattern = r'https?://\S+'
email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'

urls_found = re.findall(url_pattern, raw_corpus)
emails_found = re.findall(email_pattern, raw_corpus)

# Replace structured entities with semantic tokens
clean_text = re.sub(url_pattern, '<URL>', raw_corpus)
clean_text = re.sub(email_pattern, '<EMAIL>', clean_text)

# Collapse redundant whitespace
clean_text = re.sub(r'\s+', ' ', clean_text).strip()

print("Regex Pipeline Results:")
print(f"Extracted URLs:   {urls_found}")
print(f"Extracted Emails: {emails_found}")
print(f"Sanitised Text:   '{clean_text}'")`,
  quiz: [
    {
      q: r`Why does direct string equality ('café' == 'cafe\u0301') evaluate to False in Python without Unicode normalisation?`,
      o: [
        r`Because Python compares character code points sequentially; the precomposed 'é' is a single code point (U+00E9), whereas decomposed 'e\u0301' is two separate code points (U+0065 and U+0301)`,
        r`Because Python converts strings to integers before comparison`,
        r`Because acute accents cannot be stored in UTF-8`,
        r`Because the string length exceeds 256 bytes`,
      ],
      a: 0,
      why: r`Unicode allows canonical equivalence: precomposed 'é' (U+00E9) and decomposed 'e' + combining accent (U+0065 U+0301) represent identical glyphs, but represent different byte code point sequences. Normalising with NFC or NFD standardises the representation.`,
    },
    {
      q: r`What is the difference between Unicode normalisation Form C (NFC) and normalisation Form KC (NFKC)?`,
      o: [
        r`NFC decomposes and recomposes canonical equivalents only; NFKC also decomposes compatibility variants (such as splitting ligatures 'ﬁ' into 'fi' and formatting superscripts $2^5 \to 25$)`,
        r`NFC is for English text, while NFKC is for Asian text`,
        r`NFC deletes all vowels, while NFKC preserves them`,
        r`NFKC is only available on 64-bit operating systems`,
      ],
      a: 0,
      why: r`Canonical equivalence (NFC) preserves visual glyph integrity (accents). Compatibility equivalence (NFKC) goes further, folding stylistic variants—such as ligatures ('ﬁ' $\to$ 'fi'), circled numbers, and fractions—into standard alphanumeric characters.`,
    },
    {
      q: r`Why is str.casefold() preferred over str.lower() when preparing multilingual text for natural language processing?`,
      o: [
        r`str.casefold() implements full Unicode case folding, correctly mapping complex multilingual characters (such as German 'ß' to 'ss') where simple lowercasing fails to establish equivalence`,
        r`str.casefold() executes 10 times faster than str.lower()`,
        r`str.casefold() strips all punctuation from the string`,
        r`str.lower() only works on ASCII characters below code point 128`,
      ],
      a: 0,
      why: r`Lowercasing German 'ß' leaves it unchanged as 'ß', which fails to match lowercase 'ss' in 'GROSS'. Case folding maps both to 'ss', establishing true linguistic equality across diverse languages.`,
    },
    {
      q: r`Why should structured entities (such as URLs and email addresses) be identified and masked with regex before general punctuation removal?`,
      o: [
        r`Because generic punctuation stripping removes periods, slashes, and colons, obliterating the syntactic structure of URLs and emails before they can be extracted`,
        r`Because regex cannot process strings that contain spaces`,
        r`Because URLs cause memory overflow in Python dictionaries`,
        r`Because tokenisers crash when processing punctuation`,
      ],
      a: 0,
      why: r`URLs and email addresses depend heavily on punctuation (://, ., @). If a pipeline strips punctuation first, 'https://example.com/login' is mutilated into 'https example com login', losing its semantic identity.`,
    },
  ],
  usedBy: [],
  prereq: ['exploratory-data-analysis'],
  related: ['tokenization', 'data-cleaning-and-validation', 'exploratory-data-analysis'],
  keywords: 'text normalisation unicode regex regular expressions nfc nfd nfkc nfkd case folding ligatures sanitisation tokenisation nlp preprocessing',
},
  {
  id: 'word-and-sentence-tokenization',
  short: 'Word & Sentence Tokenization',
  title: 'Word and sentence tokenization',
  task: 'concepts',
  module: 'Words and text',
  level: 1,
  minutes: 14,
  noLab: true,
  summary: r`Tokenization partitions continuous streams of natural language characters into discrete linguistic units: sentences and words. While splitting on whitespace serves as a naive first approximation for English, authentic prose is rife with boundary ambiguities: sentence segmenters must distinguish between abbreviation markers ("Dr.", "Inc.", "U.S.") and true sentence-terminal full stops, while word tokenisers must split clitics and contractions ("don't" $\to$ "do", "n't"), isolate punctuation, and preserve hyphenated technical terms. Standard rule-based finite-state tokenisers (such as the Penn Treebank standard) and unsupervised sentence boundary detectors (such as Kiss and Strunk's Punkt algorithm) provide the structured foundation for syntactic parsing and feature extraction.`,
  lead: r`To a computer, a book or webpage is an unbroken sequence of bytes. Before an algorithm can count frequencies, assign parts of speech, or parse syntactic dependencies, it must decide where one thought ends and the next begins, and where individual words separate. Yet human writing resists simplistic delimiter rules: is "St." a saint or a street? Does "Ph.D." terminate a sentence if it ends a paragraph? Is "rock'n'roll" one word or three? Resolving these edge cases cleanly is the objective of word and sentence tokenisation.`,
  intuition: [
    r`The illusion of whitespace separation: In English and Latin-script languages, spaces between words tempt developers to write simple text.split(' '). However, naive whitespace splitting fails on multiple fronts: it glues punctuation onto words ("apple." instead of "apple" and "."), lumps contracted auxiliary verbs into unrecognisable compounds ("we'll" instead of "we" and "will"), and fractures multi-word idioms. In non-segmented writing systems like Chinese, Japanese, or Thai, words are written continuously without spaces, rendering whitespace splitting completely useless.`,
    r`Sentence Boundary Disambiguation (SBD): Splitting text into sentences (Sentence Boundary Detection or sentence segmentation) appears trivial—look for periods, question marks, and exclamation points. However, the period character '.' is overloaded: it serves as a sentence terminator, a decimal point in numbers (3.14), an abbreviation marker ("e.g.", "Prof."), an ellipsis (...), an email/URL element, and an acronym separator ("U.S.A."). If a sentence segmenter splits after "Dr.", subsequent syntactic parsers fail because they receive broken grammatical sentence fragments.`,
    r`The Punkt unsupervised boundary discovery paradigm: Tiberius Kiss and Jan Strunk (2006) proved that sentence boundary disambiguation can be solved with high accuracy without manual rules or labelled training corpora. The Punkt algorithm examines unannotated text using statistical collocations: it identifies abbreviations by calculating whether a word followed by a period occurs frequently without the period, evaluates whether the following word is heavily capitalized, and tests whether the two-word sequence exhibits high mutual information. Punkt achieves over 98% accuracy across multilingual corpora without needing hand-engineered language grammars.`,
    r`Penn Treebank standard for word tokenisation: The Penn Treebank (PTB) tokenisation convention established the standard for linguistic parsing. Rather than discarding punctuation or treating words as monolithic strings, PTB separates clitics and contractions into distinct syntactic morphemes: "don't" becomes "do" and "n't" (so "n't" can be tagged as an adverbial negation), "they'll" becomes "they" and "'ll", and possessive "'s" separates from its noun ("cat's" $\to$ "cat", "'s"). Standardising contractions into distinct grammatical tokens enables uniform downstream syntactic analysis.`,
  ],
  analogy: r`Think of reading a continuous ticker-tape transcript of spoken dialogue. Without spaces, words run together like "wevegottogotothestation". Punctuation marks are like hand gestures made by the speaker: a period is sometimes a firm drop of the hand indicating a finished thought (end of sentence), but other times it is merely an abbreviated flick indicating a job title ("Dr. Smith"). A naive tokeniser is like a paper cutter that blindly slices the ticker tape every time it spots a dot: it accidentally cuts Dr. Smith in half, separating the doctor from their surname and ruining the medical file. A linguistically aware tokeniser inspects the surrounding context: it recognizes that "Dr." is an abbreviation prefix, preserves the integrity of the name, and only drops the slicing blade when a true full stop signals a fresh thought.`,
  steps: [
    {
      title: r`Detect and protect abbreviations and numeric decimals`,
      desc: r`Prevent full stops inside acronyms and numbers from triggering sentence splits.`,
      detail: r`Scan the text with regular expressions to identify decimal points ($[0-9]+\.[0-9]+$) and common honorific / business abbreviations ("Mr.", "Mrs.", "Dr.", "Inc.", "Ltd."). Replace their periods with temporary sentinel tokens to shield them from sentence splitting rules.`,
    },
    {
      title: r`Segment text into sentences`,
      desc: r`Split paragraph strings at authentic terminal punctuation boundaries.`,
      detail: r`Identify terminal punctuation (periods, exclamation marks, question marks) followed by whitespace and an uppercase letter. Split the text into an array of sentence strings, and restore any shielded abbreviation periods.`,
    },
    {
      title: r`Isolate standard punctuation marks`,
      desc: r`Detach commas, brackets, colons, and quotes from adjacent words.`,
      detail: r`Insert whitespace around non-word punctuation marks (e.g. converting "hello," to "hello , "). Treat opening and closing quotes as separate tokens, converting double quotation marks into paired direction-sensitive quotes where appropriate.`,
    },
    {
      title: r`Expand clitics and contractions (Penn Treebank standard)`,
      desc: r`Separate contracted verbal auxiliaries and possessives into distinct tokens.`,
      detail: r`Apply regex substitution to separate clitics: split "'ll", "'ve", "'re", "'m", "'d", and possessive "'s". Split negative contractions ending in "n't" (e.g. "can't" $\to$ "ca", "n't"; "won't" $\to$ "wo", "n't"; "didn't" $\to$ "did", "n't") so negation can receive independent syntactic tags.`,
    },
    {
      title: r`Emit discrete token array`,
      desc: r`Split the formatted character stream into an array of string tokens.`,
      detail: r`Split the prepared text on whitespace delimiters. The resulting array of tokens contains individual words, morphemic contraction fragments, and punctuation elements ready for downstream dictionary vectorisation or part-of-speech tagging.`,
    },
  ],
  math: [
    {
      h: r`Log-likelihood ratio for abbreviation detection (Punkt)`,
      tex: r`\Lambda = 2 \left( \log L(H_1) - \log L(H_0) \right) = 2 \sum_{i} k_i \log \frac{p_i}{p}`,
      p: r`The Punkt algorithm evaluates whether a word with a trailing period (such as "Corp.") is an abbreviation ($H_1$) or an end-of-sentence word ($H_0$) by computing the log-likelihood ratio test of independence. Words with large positive $\Lambda$ scores are added to the abbreviation lexicon.`,
    },
    {
      h: r`Token-to-Type Ratio (TTR)`,
      tex: r`\text{TTR} = \frac{|\mathcal{V}|}{N_{\text{tokens}}} = \frac{\text{Unique Types}}{\text{Total Running Tokens}}`,
      p: r`Here $|\mathcal{V}|$ is the vocabulary size (number of unique types) and $N_{\text{tokens}}$ is total running token count. TTR quantifies lexical diversity in a corpus. Over-tokenising words increases $|\mathcal{V}|$ artificially, while under-tokenising leads to higher out-of-vocabulary rates.`,
    },
    {
      h: r`Heaps' Law of vocabulary growth`,
      tex: r`|\mathcal{V}| = k \cdot N_{\text{tokens}}^\beta, \quad 0 < \beta < 1`,
      p: r`Heaps' Law models how vocabulary size $|\mathcal{V}|$ grows asymptotically with corpus size $N_{\text{tokens}}$. Parameters $k \approx 10$ to $100$ and $\beta \approx 0.4$ to $0.6$ depend directly on how aggressively contractions, hyphens, and compound words are split during tokenisation.`,
    },
  ],
  keyPoints: [
    r`Tokenisation converts raw continuous text into discrete sentence and word elements.`,
    r`Naive whitespace splitting fails on punctuation, clitics, contractions, and unsegmented languages like Chinese.`,
    r`Sentence Boundary Detection must disambiguate periods used for abbreviations, decimals, and true sentence terminations.`,
    r`The Penn Treebank standard separates contractions ("don't" $\to$ "do", "n't") into distinct syntactic units.`,
    r`Unsupervised algorithms like Punkt discover language-specific abbreviations without manual grammar engineering.`,
  ],
  pitfalls: [
    r`Discarding all punctuation during word tokenisation: Stripping punctuation destroys sentence boundaries, removes numerical decimals, and strips grammatical markers; punctuation should be isolated as distinct tokens rather than deleted.`,
    r`Assuming periods always indicate sentence boundaries: Splitting on every period creates fragmented sentences around abbreviations ("Dr. Jane Smith moved to the U.S. in 2020.").`,
    r`Treating contractions as monolithic single words: Treating "don't" as an indivisible token prevents models from recognizing the negation operator "n't" and the auxiliary verb "do" independently.`,
    r`Language-specific tokeniser assumptions: Applying an English whitespace tokeniser to unsegmented scripts (such as Chinese or Japanese) outputs the entire paragraph as a single giant token; specialized segmenters (like Jieba or MeCab) are required.`,
    r`Inconsistent hyphen handling: Inconsistently handling hyphens ("state-of-the-art" vs "state of the art") splits single conceptual adjectives into fragments, causing vocabulary fragmentation unless normalised.`,
  ],
  code: r`import re

# Rule-based word and sentence tokenisation pipeline (Penn Treebank standard)
sample_text = "Dr. Smith arrived at 3.15 p.m. He said, 'We couldn't visit the U.S. capital!' Did you see him?"

# 1. Rule-based Sentence Boundary Detection
# Known honorific / title abbreviations to protect
abbreviations = ["Dr", "Mr", "Mrs", "Ms", "Prof", "Inc", "Ltd", "Jr", "Sr", "U.S", "p.m", "a.m"]

def sentence_tokenize(text):
    # Protect abbreviation periods by replacing them with temporary placeholder
    protected_text = text
    for abbr in abbreviations:
        # Match whole word abbreviation followed by dot
        pattern = r'\b' + re.escape(abbr) + r'\.'
        protected_text = re.sub(pattern, abbr + "@DOT@", protected_text)
    
    # Split on sentence terminals (. ! ?) followed by whitespace or end of string
    raw_sentences = re.split(r'(?<=[.!?])\s+', protected_text)
    
    # Restore protected periods
    sentences = [s.replace("@DOT@", ".") for s in raw_sentences if s.strip()]
    return sentences

sentences = sentence_tokenize(sample_text)
print(f"Detected {len(sentences)} sentences:")
for i, s in enumerate(sentences):
    print(f"  Sentence {i+1}: \"{s}\"")

# 2. Penn Treebank style Word Tokenisation
def word_tokenize_ptb(sentence):
    text = sentence
    
    # Isolate leading and trailing quotes, brackets, and punctuation
    text = re.sub(r'([,;:\(\)\[\]\{\}\?!])', r' \1 ', text)
    
    # Isolate periods that are true terminals (not in decimals or abbreviations)
    text = re.sub(r'(?<!\d)\.(?!\d)', r' . ', text)
    
    # Handle negative contractions: split "n't"
    text = re.sub(r"(?i)\b([a-z]+)n't\b", r"\1 n't", text)
    # Special cases: "can't" -> "ca n't", "won't" -> "wo n't"
    text = re.sub(r"(?i)\bca n't\b", "ca n't", text)
    text = re.sub(r"(?i)\bwo n't\b", "wo n't", text)
    
    # Handle other clitics: 'll, 're, 've, 'm, 'd, 's
    text = re.sub(r"'(ll|re|ve|m|d|s)\b", r" '\1", text)
    
    # Split on whitespace
    tokens = [tok for tok in text.split() if tok]
    return tokens

print(f"\nWord tokens for Sentence 2 (\"We couldn't visit the U.S. capital!\"):")
tokens_s2 = word_tokenize_ptb(sentences[1])
print(tokens_s2)
print(f"Notice 'couldn\\'t' split into: ['could', \"n't\"]")
print(f"Notice punctuation isolated:     ['!']")`,
  quiz: [
    {
      q: r`Why does naive whitespace splitting (text.split(' ')) fail when preparing real-world English text for NLP pipelines?`,
      o: [
        r`It attaches punctuation to adjacent words ("dog." instead of "dog" and "."), fails to separate contractions into distinct grammatical units, and cannot process unsegmented languages like Chinese`,
        r`It causes memory buffer overflows in standard Python dictionaries`,
        r`It converts all characters to uppercase automatically`,
        r`It can only process sentences shorter than ten words`,
      ],
      a: 0,
      why: r`Whitespace splitting glues punctuation onto tokens, creating duplicate vocabulary entries ("dog", "dog,", "dog."). It also fails to decompose grammatical contractions like "can't" into root and negation components.`,
    },
    {
      q: r`What makes Sentence Boundary Detection (SBD) challenging in natural language text?`,
      o: [
        r`The period character '.' is overloaded: it serves as a sentence terminator, an abbreviation indicator ("Dr."), a decimal separator (3.14), and an ellipsis marker (...)`,
        r`Sentences in English never exceed five words in length`,
        r`Exclamation marks and question marks cannot be processed using regular expressions`,
        r`Most operating systems do not support newline characters`,
      ],
      a: 0,
      why: r`Because the full stop is heavily overloaded as an abbreviation marker, decimal separator, and acronym element, simple rule-based splitting after every period causes severe fragmentation of proper names and numerical quantities.`,
    },
    {
      q: r`According to the Penn Treebank standard, how should the contraction "couldn't" be tokenised?`,
      o: [
        r`As two separate tokens: ["could", "n't"]`,
        r`As a single unified token: ["couldn't"]`,
        r`By deleting the apostrophe: ["couldnt"]`,
        r`By expanding to full dictionary words: ["could", "not"]`,
      ],
      a: 0,
      why: r`The Penn Treebank standard separates clitics and contractions into distinct tokens: "could" (modal auxiliary verb) and "n't" (adverbial negation), allowing downstream taggers to assign distinct parts of speech to each.`,
    },
    {
      q: r`How does the Punkt algorithm detect abbreviations in an unannotated text corpus without human-engineered grammar rules?`,
      o: [
        r`By calculating statistical collocations and log-likelihood ratio tests to determine if a token with a period frequently appears in non-terminal positions`,
        r`By querying a hard-coded online English dictionary via an API`,
        r`By translating the text into Latin first`,
        r`By counting the number of syllables in each word`,
      ],
      a: 0,
      why: r`Punkt evaluates whether a word followed by a period occurs with high probability inside sentences, whether subsequent words are capitalized, and whether the pair forms an abbreviation collocation, identifying abbreviations in an unsupervised manner.`,
    },
  ],
  usedBy: ['stop-words-and-n-grams', 'stemming-vs-lemmatisation', 'bag-of-words-and-tf-idf'],
  prereq: ['text-normalisation-unicode-and-regex'],
  related: ['text-normalisation-unicode-and-regex', 'tokenization', 'data-cleaning-and-validation'],
  keywords: 'tokenization tokenisation word tokenisation sentence segmentation sentence boundary detection punkt penn treebank clitics contractions nlp preprocessing',
},
  {
  id: 'stop-words-and-n-grams',
  short: 'Stop Words & N-Grams',
  title: 'Stop words and n-grams',
  task: 'concepts',
  module: 'Words and text',
  level: 1,
  minutes: 14,
  noLab: true,
  summary: r`Stop words are ubiquitous grammatical function words (such as "the", "is", "at", "which") that provide syntactic scaffolding in prose but offer minimal domain-specific topical discrimination in information retrieval and document classification. N-grams capture local multi-word context by forming contiguous tuples of $n$ consecutive tokens (unigrams, bigrams, trigrams), upgrading bag-of-words models into context-sensitive phrase extractors capable of distinguishing "not guilty" from "guilty". Deciding when to filter stop words and engineering word or character n-gram vocabularies balances vector sparsity against semantic nuance.`,
  lead: r`If you tally the most frequent words in Shakespeare's plays, a corporate contract, and a medical textbook, the top of all three lists looks identical: "the", "and", "of", "to", "a", "in". These function words bind sentences together grammatically, but they reveal almost nothing about whether the document discusses Elizabethan tragedy, corporate liability, or cardiovascular surgery. Conversely, treating each word as an isolated island discards crucial phrasing: "hot dog" is not merely heat plus a canine, and "not bad" is positive praise despite containing a negative word. Navigating stop words and constructing n-grams provides the bridge from isolated word counts to contextual phrase representations.`,
  intuition: [
    r`Zipf's Law and the function word explosion: George Kingsley Zipf observed that the frequency of any word in a natural language corpus is inversely proportional to its rank in the frequency table: $f(w) \propto 1 / r^\alpha$ (where $\alpha \approx 1$). The top 50 to 100 most frequent words typically account for $40\%$ to $50\%$ of all word occurrences in a document. In tasks like topic modelling, search indexing, or author classification, these high-frequency function words inflate vector dimensionality, consume memory, and add noise without aiding class separation. Identifying and filtering stop words strips away this high-frequency noise floor.`,
    r`The peril of aggressive stop word removal: While removing stop words helps simple bag-of-words document search, indiscriminate filtering can destroy meaning. Consider sentiment analysis: stripping the stop word "not" transforms the movie review "The movie was not entertaining" into "movie entertaining"—inverting the sentiment from negative to positive. In question answering, filtering "to be or not to be" eliminates the entire query. Modern deep language models (such as BERT and GPT) never remove stop words because self-attention relies heavily on prepositions and pronouns to resolve syntactic dependencies.`,
    r`Capturing local context with N-grams: A unigram is a single isolated token ($n=1$). A bigram ($n=2$) groups two consecutive tokens ("machine learning", "deep learning"). A trigram ($n=3$) groups three ("natural language processing"). Moving from unigrams to n-grams allows statistical models to capture negation ("not good"), compound nouns ("New York City"), and domain idioms. Higher-order n-grams provide richer semantic context, but cause the vocabulary size to explode combinatorially.`,
    r`Character-level N-grams for robust morphology: N-grams can also be constructed at the subword character level rather than the word level. For example, the 3-character n-grams (character trigrams) of "<cat>" are "<ca", "cat", and "at>". Character n-grams are immune to out-of-vocabulary errors, capture morphological roots across inflections ("run", "running", "runner"), and withstand spelling mistakes and OCR typos (such as "definately" matching "definitely"), forming the secret weapon behind FastText and modern subword tokenisers.`,
  ],
  analogy: r`Think of assembling a jigsaw puzzle of a landscape. Stop words are like the thousands of plain blue sky pieces that look virtually identical: they make up half the box, take up huge table space, and tell you very little about whether the puzzle depicts Paris or the Grand Canyon. If you are indexing the puzzle in an inventory catalogue, sweeping the blue sky pieces aside (stop word filtering) lets you focus immediately on the distinctive landmark pieces (the Eiffel Tower or canyon cliffs). Single unigram words are like individual disconnected puzzle tabs: you hold a piece with a brown paw, another with red fabric, another with a wheel. Bigrams and trigrams are like clicking two or three interlocking pieces together: suddenly, you don't just have an isolated paw and wheel; you see a dog sitting in a bicycle basket. You capture the scene's composition without needing the entire thousand-piece puzzle.`,
  steps: [
    {
      title: r`Tokenise text into a clean sequence of words`,
      desc: r`Segment the input corpus into standardised tokens prior to grouping or filtering.`,
      detail: r`Normalise casing, isolate punctuation, and segment text into an ordered token list $[w_1, w_2, \dots, w_T]$. Retaining sequence order is critical: n-grams depend strictly on contiguous token adjacency.`,
    },
    {
      title: r`Filter domain-specific stop words`,
      desc: r`Strip common function words using tailored stop word dictionaries or frequency cutoffs.`,
      detail: r`Apply a stop word list (such as NLTK's English stop words or spaCy's curated lexicon). When building sentiment analysis or question answering systems, preserve negation words ("no", "not", "never", "without") to prevent semantic inversion. Alternatively, compute document frequencies dynamically and prune words appearing in $>80\%$ of corpus documents.`,
    },
    {
      title: r`Construct word-level sliding window N-grams`,
      desc: r`Slide a window of width $n$ across the token sequence to generate tuples.`,
      detail: r`For a sequence $[w_1, \dots, w_T]$, generate bigrams as $[(w_1, w_2), (w_2, w_3), \dots, (w_{T-1}, w_T)]$. Optionally pad the beginning and end of the sequence with start-of-sentence (<s>) and end-of-sentence (</s>) boundary tokens to capture sentence-edge transition statistics.`,
    },
    {
      title: r`Extract character-level subword N-grams`,
      desc: r`Generate overlapping character tuples within words to capture morphological roots.`,
      detail: r`Pad each word with boundary brackets (e.g. "<where>"). Extract sliding character slices of length $n$ (typically $n=3$ to $6$): ["<wh", "whe", "her", "ere", "re>"]. Character n-grams allow models to represent rare, misspelled, or out-of-vocabulary words through shared subword fragments.`,
    },
    {
      title: r`Prune rare N-grams and vectorise`,
      desc: r`Enforce minimum frequency thresholds to control combinatorial vocabulary explosion.`,
      detail: r`Bigrams and trigrams produce vast vocabularies where $90\%$ of combinations appear only once in the entire corpus. Prune n-grams with frequency count $< 3$ or min_df $< 2$. Build sparse count matrices mapping documents to surviving n-gram feature indices.`,
    },
  ],
  math: [
    {
      h: r`Zipf's Law frequency distribution`,
      tex: r`f(r) = \frac{C}{r^\alpha} \approx \frac{C}{r}, \quad \log f(r) = \log C - \alpha \log r`,
      p: r`Here $r$ is the frequency rank of a word (where $r=1$ is the most frequent word, e.g. "the"), $f(r)$ is its empirical frequency, and $\alpha \approx 1$. A log-log plot of word frequency versus rank forms a straight line with slope $-1$, proving that a minuscule fraction of words dominates total corpus volume.`,
    },
    {
      h: r`N-gram token count and sliding window formulation`,
      tex: r`\text{N-grams}(W, n) = \left\{ (w_i, w_{i+1}, \dots, w_{i+n-1}) \;\middle|\; 1 \le i \le |W| - n + 1 \right\}`,
      p: r`A document of length $T = |W|$ tokens yields exactly $T - n + 1$ contiguous n-grams. Adding $n-1$ boundary padding symbols at the start and end yields exactly $T + n - 1$ padded n-grams, preserving transition probabilities for initial and terminal words.`,
    },
    {
      h: r`Maximum likelihood bigram transition probability`,
      tex: r`P(w_i \mid w_{i-1}) = \frac{\operatorname{Count}(w_{i-1}, w_i)}{\operatorname{Count}(w_{i-1})}`,
      p: r`In classical n-gram language modelling, the conditional probability of word $w_i$ given preceding word $w_{i-1}$ is evaluated as the joint bigram count divided by the unigram count of the conditioning prefix.`,
    },
  ],
  keyPoints: [
    r`Stop words are high-frequency grammatical function words that carry minimal topical discrimination in bag-of-words search.`,
    r`Zipf's Law demonstrates that the top 100 most frequent words account for approximately half of all tokens in natural language corpora.`,
    r`Aggressive stop word removal destroys negation and subtle syntax, making it unsuitable for sentiment analysis and modern language models.`,
    r`N-grams capture contiguous local word context, enabling models to differentiate between distinct phrases like "not guilty" and "guilty".`,
    r`Character n-grams capture morphological variations and typos, providing robust representations for out-of-vocabulary words.`,
  ],
  pitfalls: [
    r`Stripping negation words in sentiment tasks: Blindly removing words like "not", "no", and "never" reverses sentiment polarities and ruins sentiment classifiers.`,
    r`Unconstrained N-gram vocabulary explosion: Generating unigrams, bigrams, and trigrams on large corpora without min_df thresholds inflates vocabulary to millions of sparse columns, causing GPU memory exhaustion.`,
    r`Applying stop word lists to modern Transformer models: Removing stop words before feeding text to BERT, RoBERTa, or GPT cripples self-attention, as transformers rely on prepositions and pronouns to parse sentence syntax.`,
    r`Ignoring casing when matching stop words: If stop words are lowercased ("the") but document tokens retain capitalization ("The"), stop word filtering fails on sentence-initial words unless casing is normalised first.`,
    r`Over-filtering rare domain terminology: Using automated frequency thresholds without domain review can inadvertently discard rare medical, legal, or technical acronyms that carry the highest topical information.`,
  ],
  code: r`import numpy as np
from collections import Counter

# Corpus of documents
documents = [
    "Machine learning is not magic, it is computer science.",
    "Deep learning is a subset of machine learning.",
    "Not bad at all, this machine learning model works well!"
]

# 1. Custom stop words list (preserving negation words: 'not')
standard_stop_words = {"is", "it", "a", "of", "at", "all", "this"}

def simple_tokenize(doc):
    # Lowercase and split on non-alphanumeric characters
    import re
    return [tok for tok in re.split(r'\W+', doc.lower()) if tok]

# Tokenise all documents
tokenized_docs = [simple_tokenize(d) for d in documents]

# 2. Filter stop words while retaining negations
filtered_docs = [
    [w for w in doc if w not in standard_stop_words]
    for doc in tokenized_docs
]

print("Document 1 before stop word filtering:")
print(tokenized_docs[0])
print("\nDocument 1 after stop word filtering (notice 'not' preserved):")
print(filtered_docs[0])

# 3. Generate Word-Level Bigrams and Trigrams
def generate_ngrams(tokens, n=2):
    return [tuple(tokens[i:i+n]) for i in range(len(tokens) - n + 1)]

bigrams_doc1 = generate_ngrams(filtered_docs[0], n=2)
print(f"\nWord Bigrams (n=2) for Document 1:")
for bg in bigrams_doc1:
    print(f"  {' '.join(bg)}")

# 4. Character-level N-Grams for Subword Morphology
def generate_char_ngrams(word, n=3):
    padded = f"<{word}>"
    return [padded[i:i+n] for i in range(len(padded) - n + 1)]

sample_word = "learning"
char_trigrams = generate_char_ngrams(sample_word, n=3)
print(f"\nCharacter Trigrams (n=3) for '{sample_word}':")
print(char_trigrams)

# 5. Bigram Frequency Distribution across Corpus
all_bigrams = [bg for doc in filtered_docs for bg in generate_ngrams(doc, n=2)]
bigram_counts = Counter(all_bigrams)

print("\nMost frequent bigrams across corpus:")
for bg, count in bigram_counts.most_common(3):
    print(f"  '{' '.join(bg)}': {count} occurrences")
print("Verified: Word and character n-gram extraction executed successfully!")`,
  quiz: [
    {
      q: r`Why does Zipf's Law motivate the filtering of stop words in classical information retrieval and topic modelling?`,
      o: [
        r`Because the most frequent function words account for up to half of all tokens in a corpus while providing near-zero domain-specific topical discrimination`,
        r`Because computers cannot store words with fewer than three letters`,
        r`Because stop words cause divide-by-zero errors in matrix multiplication`,
        r`Because stop words are only used in conversational speech rather than written text`,
      ],
      a: 0,
      why: r`Zipf's Law states that word frequency decays inversely with rank. The top 50 words ("the", "of", "and") appear in virtually every document regardless of topic, diluting term vectors without offering discrimination between categories.`,
    },
    {
      q: r`Under what natural language processing task can indiscriminate stop word removal cause severe model degradation?`,
      o: [
        r`Sentiment analysis, because removing negation stop words (such as "not" or "never") inverts the semantic polarity of phrases like "not good" to "good"`,
        r`Image classification`,
        r`Speech synthesis`,
        r`Audio waveform Fourier analysis`,
      ],
      a: 0,
      why: r`Negation words ("not", "neither", "hardly") are often included in naive stop word lists. Stripping them completely reverses the sentiment of a sentence, turning praise into condemnation or vice versa.`,
    },
    {
      q: r`What critical advantage do character-level n-grams offer over word-level n-grams in text embeddings (as seen in FastText)?`,
      o: [
        r`They can construct representations for out-of-vocabulary words and are resilient to spelling mistakes and morphological inflections by sharing common subword character slices`,
        r`They eliminate the need for matrix multiplication`,
        r`They double the speed of GPU floating-point operations`,
        r`They require zero memory storage`,
      ],
      a: 0,
      why: r`If an unseen word or typo appears at test time (e.g. "definately"), word models fail (out-of-vocabulary). Character n-grams decompose the word into overlapping fragments ("def", "efi", "fin") that match known subwords, producing a robust embedding.`,
    },
    {
      q: r`Why do modern Transformer architectures (such as BERT and GPT) avoid removing stop words during pre-training and fine-tuning?`,
      o: [
        r`Self-attention mechanisms require full grammatical syntax (including pronouns, prepositions, and auxiliaries) to compute bidirectional syntactic and semantic dependencies accurately`,
        r`Because stop words cannot be stored in PyTorch tensors`,
        r`Because removing stop words reduces the training speed of GPUs`,
        r`Because Transformer models can only process sentences with an even number of tokens`,
      ],
      a: 0,
      why: r`Transformers model natural language holistically: function words provide essential structural clues for pronoun coreference, syntactic dependency parsing, and semantic role assignment. Deleting them destroys linguistic context.`,
    },
  ],
  usedBy: ['stemming-vs-lemmatisation', 'bag-of-words-and-tf-idf'],
  prereq: ['word-and-sentence-tokenization', 'text-normalisation-unicode-and-regex'],
  related: ['bag-of-words-and-tf-idf', 'tokenization', 'word-and-sentence-tokenization'],
  keywords: 'stop words n grams unigram bigram trigram zipf law subword character n grams language modeling nlp preprocessing vocabulary feature extraction',
},
  {
  id: 'stemming-vs-lemmatisation',
  short: 'Stemming vs Lemmatisation',
  title: 'Stemming vs lemmatisation',
  task: 'concepts',
  module: 'Words and text',
  level: 1,
  minutes: 15,
  noLab: true,
  summary: r`Words occur in diverse inflected, derived, and conjugated surface forms across grammatical moods, numbers, and tenses ("organise", "organises", "organising", "organised"). Stemming and lemmatisation are two distinct linguistic normalisation techniques designed to collapse these surface variants into a common base representation, consolidating vocabulary size and enhancing document recall. Stemming applies heuristic, rule-based suffix-stripping algorithms (such as the Porter and Snowball stemmers) that chop word endings into crude root stems ("organ"), often yielding non-dictionary words and suffering from over-stemming and under-stemming. Lemmatisation applies full morphological analysis using comprehensive lexical databases (such as WordNet) and Part-of-Speech context to reduce words to their authentic canonical dictionary lemma ("better" $\to$ "good", "was" $\to$ "be").`,
  lead: r`If a user searches an e-commerce catalogue for "running shoes", they expect the engine to return products described as "runs", "runner", and "ran". If a sentiment classifier encounters the word "frustrated", it should leverage everything it learned about "frustrates", "frustrating", and "frustration". Without morphological normalisation, each inflected variant becomes an independent vocabulary dimension, fragmenting training counts and causing severe sparsity. But should we chop word endings with heuristic rules, or look them up in a morphological dictionary? Understanding the speed, precision, and grammatical trade-offs between stemming and lemmatisation is crucial for designing robust text processing pipelines.`,
  intuition: [
    r`The morphology challenge: In natural languages, inflectional morphology modifies words to express grammatical features (tense, person, number, case) without changing the core semantic meaning ("walk", "walks", "walked", "walking"). Derivational morphology forms completely new words from existing roots ("organise" $\to$ "organisation"). In un-normalised text, these variations inflate the vocabulary exponentially, spreading statistical frequencies thin across dozens of rare tokens.`,
    r`Stemming: Heuristic rule-based suffix chopping: In 1980, Martin Porter introduced the Porter Stemmer, which remains the most widely deployed stemming algorithm in computer science. Porter stemming consists of five sequential phases of hand-crafted cascading rewrite rules: for instance, mapping "sses" to "ss" ("caresses" $\to$ "caress"), "ies" to "i" ("ponies" $\to$ "poni"), and stripping "ing" or "ed" if the preceding stem contains a vowel ("motoring" $\to$ "motor"). Stemmers are blindingly fast because they rely purely on string pattern matching without lexical dictionaries. However, stems are often non-words ("poni", "commun"), and stemmers cannot handle irregular English grammar ("went" cannot be stemmed to "go").`,
    r`The twin pitfalls: Over-stemming and under-stemming: Stemmers suffer from two fundamental error modes: (1) Over-stemming occurs when two words with completely different semantic meanings are conflated to the identical root stem (e.g. "universe", "universal", and "university" all stem to "univers", erroneously equating higher education with astrophysics). (2) Under-stemming occurs when two words expressing the exact same semantic concept fail to stem to the same root (e.g. "European" and "Europe" yield "european" and "europ", remaining disjoint in the index).`,
    r`Lemmatisation: Lexical analysis with Part-of-Speech context: Lemmatisation resolves the shortcomings of stemming by performing complete morphological analysis. A lemmatiser requires two inputs: the surface word and its grammatical Part-of-Speech (POS) tag. By consulting comprehensive lexical databases like WordNet, a lemmatiser handles irregular inflections with ease: "better" with POS=adjective becomes "good", "saw" with POS=verb becomes "see", whereas "saw" with POS=noun remains "saw" (the cutting tool). Lemmatisation guarantees that the resulting base is a legitimate, human-interpretable dictionary headword ("lemma"), providing superior semantic fidelity at the expense of computational lookup overhead.`,
  ],
  analogy: r`Think of pruning and tending a large overgrown botanical garden. Stemming is like a groundskeeper armed with a petrol-powered hedge trimmer who walks along hedges blindly shearing three inches off the end of every branch: it is extraordinarily fast and reduces the wild bush to a tidy uniform height, but occasionally it shears off valuable roses, cuts electrical garden cables, or leaves splintered bare twigs (non-words like "poni"). Lemmatisation is like a skilled master horticulturist who examines each plant individually with pruning shears, identifies the exact plant species from its tag (Part-of-Speech context), traces the branches back to their healthy botanical joints, and trims them neatly to their canonical root system. The master horticulturist takes significantly longer than the petrol hedge trimmer, but every plant remains pristine and identifiable.`,
  steps: [
    {
      title: r`Tokenise and assign Part-of-Speech (POS) tags`,
      desc: r`Disambiguate word syntax to provide grammatical context for lemmatisation.`,
      detail: r`Tokenise the sentence and run a Part-of-Speech tagger (e.g. determining whether "leaves" is a plural noun as in tree foliage or a third-person singular verb as in exiting a room). POS tagging is essential: without syntactic context, lemmatisers cannot resolve polysemous word forms.`,
    },
    {
      title: r`Apply rule-based stemming (Porter / Snowball)`,
      desc: r`Execute sequential heuristic suffix stripping across string patterns.`,
      detail: r`Pass tokens through cascading regex replacement rules: step 1 strips plurals and third-person suffixes (-s, -es, -ed, -ing); step 2 simplifies double suffixes (-ational $\to$ -ate); steps 3 and 4 strip derivational endings (-ful, -ness, -ment). Output crude root stems for high-throughput search engines.`,
    },
    {
      title: r`Map POS tags to lexical database categories`,
      desc: r`Translate detailed Penn Treebank POS tags into coarse WordNet categories.`,
      detail: r`Penn Treebank tags (NN, NNS, VB, VBD, VBG, JJ, RB) must be mapped to the four coarse WordNet categories: Noun ('n'), Verb ('v'), Adjective ('a'), and Adverb ('r'). Unmatched or punctuation tokens default to Noun.`,
    },
    {
      title: r`Perform morphological lookup and rule-based lemma extraction`,
      desc: r`Query dictionary tables and apply morphological transformation rules.`,
      detail: r`Query the lexical database (WordNet). If the (word, POS) pair exists in the irregular inflection index (e.g. ("went", 'v') $\to$ "go", ("mice", 'n') $\to$ "mouse"), return the mapped lemma immediately. Otherwise, apply grammatical detachment rules (e.g. stripping '-s' for plural nouns).`,
    },
    {
      title: r`Select between stemming and lemmatisation for downstream tasks`,
      desc: r`Choose the optimal normalisation strategy based on latency, accuracy, and interpretability constraints.`,
      detail: r`Use stemming for high-throughput information retrieval, large-scale web search indexing, and real-time log ingestion where sub-millisecond execution is paramount. Use lemmatisation for sentiment analysis, semantic parsing, question answering, and topic modelling where grammatical correctness and human-interpretable features are vital.`,
    },
  ],
  math: [
    {
      h: r`Porter Stemmer measure of syllable complexity`,
      tex: r`[C](VC)^m [V], \quad m = \text{measure of syllable alternation}`,
      p: r`The Porter stemmer represents any word as an optional initial consonant sequence $[C]$, followed by $m$ alternating vowel-consonant sequences $(VC)^m$, followed by an optional trailing vowel sequence $[V]$. Suffix stripping rules fire only if the remaining stem satisfies a minimum syllable measure $m > 0$ or $m > 1$, preventing short root words like "bed" or "sing" from being destroyed into single letters.`,
    },
    {
      h: r`Over-stemming and Under-stemming error rates`,
      tex: r`E_{\text{over}} = \frac{|\{(w_i, w_j) : \operatorname{stem}(w_i) = \operatorname{stem}(w_j) \land \text{lemma}(w_i) \neq \text{lemma}(w_j)\}|}{\text{Total Pairs}}, \quad E_{\text{under}} = \frac{|\{(w_i, w_j) : \operatorname{stem}(w_i) \neq \operatorname{stem}(w_j) \land \text{lemma}(w_i) = \text{lemma}(w_j)\}|}{\text{Total Related Pairs}}`,
      p: r`Over-stemming measures false conflations (unrelated words mapped to identical stems, harming search precision), while under-stemming measures missed conflations (related words mapped to different stems, harming search recall).`,
    },
    {
      h: r`Vocabulary reduction efficiency ratio`,
      tex: r`\text{Compression Ratio} = 1 - \frac{|\mathcal{V}_{\text{normalised}}|}{|\mathcal{V}_{\text{raw}}|}, \quad |\mathcal{V}_{\text{stemmed}}| \le |\mathcal{V}_{\text{lemmatised}}| < |\mathcal{V}_{\text{raw}}|`,
      p: r`Stemming achieves higher vocabulary compression than lemmatisation because aggressive suffix stripping frequently collapses distinct semantic words together. Lemmatisation balances vocabulary compression while strictly preserving dictionary headwords.`,
    },
  ],
  keyPoints: [
    r`Stemming applies heuristic suffix stripping rules without dictionaries, producing crude roots that are often non-words.`,
    r`Lemmatisation applies full morphological analysis using lexical databases and Part-of-Speech tags, guaranteeing valid dictionary lemmas.`,
    r`Over-stemming erroneously conflates semantically unrelated words (e.g. "university" and "universe"), reducing retrieval precision.`,
    r`Under-stemming fails to group related morphological inflections (e.g. "Europe" and "European"), reducing retrieval recall.`,
    r`Stemming is favoured in high-speed search indexing; lemmatisation is preferred for syntactic parsing and semantic understanding.`,
  ],
  pitfalls: [
    r`Lemmatising without providing Part-of-Speech tags: Most lemmatisers default to Noun if no POS tag is supplied; attempting to lemmatise the verb "running" without POS='v' leaves it un-lemmatised as "running" instead of "run".`,
    r`Over-stemming in specialized domains: Applying aggressive stemmers to medical or legal documents conflates distinct terminology (e.g. "policy" and "police", or "medical" and "medication"), corrupting domain retrieval.`,
    r`Assuming stemming produces valid dictionary words: Stemming outputs like "commun", "poni", and "relat" are algorithmically convenient index keys, but cannot be displayed to end users in polished search results.`,
    r`Computational latency bottlenecks with lemmatisation: Lemmatisation requires dictionary hash lookups and prior POS tagging, running orders of magnitude slower than simple regex stemming on multi-gigabyte corpora.`,
    r`Irregular verb failure in stemmers: Rule-based stemmers cannot map irregular past tenses ("went" $\to$ "go", "sang" $\to$ "sing", "mice" $\to$ "mouse") because irregular inflections require lexical dictionary mapping.`,
  ],
  code: r`# Comparative implementation of Stemming vs Lemmatisation in pure Python

# 1. Simplified rule-based suffix stripper (mini-Porter style rules)
def simple_porter_stem(word):
    w = word.lower()
    # Step 1a: plurals and past participles
    if w.endswith('sses'): w = w[:-2]
    elif w.endswith('ies'): w = w[:-2]  # ponies -> poni
    elif w.endswith('ss'): pass
    elif w.endswith('s') and len(w) > 2: w = w[:-1]
    
    # Step 1b: -ed, -ing
    if w.endswith('eed'):
        if len(w) > 4: w = w[:-1]
    elif w.endswith('ed'):
        stem = w[:-2]
        if any(c in 'aeiou' for c in stem): w = stem
    elif w.endswith('ing'):
        stem = w[:-3]
        if any(c in 'aeiou' for c in stem): w = stem
        
    # Step 2: derivational suffixes
    if w.endswith('ational'): w = w[:-7] + 'ate'  # relational -> relate
    elif w.endswith('tional'): w = w[:-6] + 'tion'
    elif w.endswith('izer') or w.endswith('iser'): w = w[:-4] + 'ise'
    elif w.endswith('ly'): w = w[:-2]
    
    return w

# 2. Dictionary-based Lemmatiser with POS-context support
# Minimal WordNet-style irregular inflection dictionary
lemma_dict = {
    # Verbs: (word, 'v') -> lemma
    ('went', 'v'): 'go', ('gone', 'v'): 'go', ('going', 'v'): 'go', ('goes', 'v'): 'go',
    ('saw', 'v'): 'see', ('seen', 'v'): 'see', ('seeing', 'v'): 'see', ('sees', 'v'): 'see',
    ('running', 'v'): 'run', ('ran', 'v'): 'run', ('runs', 'v'): 'run',
    ('studying', 'v'): 'study', ('studied', 'v'): 'study', ('studies', 'v'): 'study',
    # Nouns: (word, 'n') -> lemma
    ('mice', 'n'): 'mouse', ('geese', 'n'): 'goose', ('feet', 'n'): 'foot',
    ('ponies', 'n'): 'pony', ('studies', 'n'): 'study', ('saw', 'n'): 'saw',
    # Adjectives: (word, 'a') -> lemma
    ('better', 'a'): 'good', ('best', 'a'): 'good', ('worse', 'a'): 'bad'
}

def simple_lemmatize(word, pos='n'):
    w = word.lower()
    # Direct irregular dictionary lookup
    if (w, pos) in lemma_dict:
        return lemma_dict[(w, pos)]
        
    # Regular inflection rules
    if pos == 'n' and w.endswith('s') and len(w) > 3:
        if w.endswith('ies'): return w[:-3] + 'y'
        return w[:-1]
    if pos == 'v' and w.endswith('ing') and len(w) > 4:
        return w[:-3]
    return w

# 3. Test words showing key distinctions
test_cases = [
    ("running", "v", "Regular verb inflection"),
    ("went", "v", "Irregular verb"),
    ("ponies", "n", "Plural noun"),
    ("better", "a", "Irregular comparative adjective"),
    ("saw", "v", "Ambiguous: past tense verb 'to see'"),
    ("saw", "n", "Ambiguous: noun tool 'saw'"),
    ("university", "n", "Over-stemming candidate"),
    ("universe", "n", "Over-stemming candidate")
]

print(f"{'Input Word':<12} | {'POS':<4} | {'Stem (Porter)':<15} | {'Lemma (WordNet)':<15} | {'Note':<30}")
print("-" * 85)

for word, pos, note in test_cases:
    stem_val = simple_porter_stem(word)
    lemma_val = simple_lemmatize(word, pos)
    print(f"{word:<12} | {pos:<4} | {stem_val:<15} | {lemma_val:<15} | {note:<30}")

print("\nKey observations:")
print("1. Stemming turns 'ponies' into non-word 'poni'; Lemmatisation returns valid dictionary word 'pony'.")
print("2. Stemming fails on irregular 'went' ('went'); Lemmatisation correctly maps to root 'go'.")
print("3. POS context allows Lemmatisation to distinguish verb 'saw' ('see') from noun 'saw' ('saw').")`,
  quiz: [
    {
      q: r`What is the primary operational difference between stemming and lemmatisation?`,
      o: [
        r`Stemming uses heuristic suffix-stripping rules without dictionaries (often producing non-words), whereas lemmatisation uses lexical databases and Part-of-Speech context to return authentic dictionary lemmas`,
        r`Stemming is for sentences, while lemmatisation is for paragraphs`,
        r`Stemming can only be computed on GPU hardware`,
        r`Lemmatisation deletes all vowels from input words`,
      ],
      a: 0,
      why: r`Stemming chops word endings using cascading heuristic string matching rules (producing roots like "poni" or "comput"). Lemmatisation consults a morphological lexicon (WordNet) with grammatical context to output valid dictionary headwords ("pony", "compute").`,
    },
    {
      q: r`What does "over-stemming" mean in natural language processing?`,
      o: [
        r`When two semantically distinct words are incorrectly chopped into the identical root stem (e.g. "universe" and "university" both stemming to "univers")`,
        r`When a stemmer crashes due to memory overflow`,
        r`When a word is stemmed more than three times consecutively`,
        r`When a stemmer converts text into binary numbers`,
      ],
      a: 0,
      why: r`Over-stemming is a false positive conflation error: the stemmer strips too aggressively, equating distinct concepts (such as "universal" and "university") under the same root, degrading search precision.`,
    },
    {
      q: r`Why does effective lemmatisation require providing the Part-of-Speech (POS) tag of a word?`,
      o: [
        r`Because grammatical role dictates the root lemma: "saw" as a verb maps to "see", whereas "saw" as a noun remains "saw" (the cutting tool)`,
        r`Because words without POS tags are deleted by the operating system`,
        r`Because POS tags double the frame rate of neural networks`,
        r`Because lexical databases only store adjectives`,
      ],
      a: 0,
      why: r`Many English surface forms are grammatically ambiguous. Without POS context, a lemmatiser cannot know whether "leaves" is the plural of noun "leaf" or the third-person present form of verb "leave".`,
    },
    {
      q: r`Under what scenario is stemming typically preferred over lemmatisation in production systems?`,
      o: [
        r`In large-scale search engines and high-throughput document retrieval indexing where sub-millisecond execution speed outweighs morphological linguistic purity`,
        r`In translation systems where exact dictionary words are required`,
        r`In medical billing software where strict legal compliance is required`,
        r`In speech synthesis text-to-speech systems`,
      ],
      a: 0,
      why: r`Stemming executes orders of magnitude faster than lemmatisation because it avoids POS tagging and dictionary lookups. For web search engines indexing billions of documents, its speed and recall improvements make it the industry standard.`,
    },
  ],
  usedBy: ['bag-of-words-and-tf-idf'],
  prereq: ['word-and-sentence-tokenization', 'text-normalisation-unicode-and-regex'],
  related: ['bag-of-words-and-tf-idf', 'stop-words-and-n-grams', 'word-and-sentence-tokenization'],
  keywords: 'stemming lemmatisation porter stemmer snowball wordnet morphology lemma pos tagging over stemming under stemming nlp preprocessing',
},
  {
  id: 'bag-of-words-and-tf-idf',
  short: 'BoW & TF-IDF',
  title: 'Bag of words and TF-IDF',
  task: 'concepts',
  module: 'Words and text',
  level: 1,
  minutes: 16,
  noLab: true,
  summary: r`The Bag of Words (BoW) model represents text documents as fixed-length numeric vectors of token counts, discarding grammatical syntax and word order while preserving vocabulary frequency statistics. Term Frequency-Inverse Document Frequency (TF-IDF, Karen Spärck Jones, 1972) refines raw counts by multiplying local Term Frequency ($\text{tf}(t, d)$) by the global Inverse Document Frequency ($\text{idf}(t, D) = \log\frac{N}{|\{d \in D : t \in d\}|}$), systematically damping ubiquitous generic words while elevating informative, domain-specific keywords. Evaluated with cosine similarity over $L_2$-normalised sparse vectors, TF-IDF powers classical document retrieval, topic clustering, and linear text classification.`,
  lead: r`How can an algorithm determine whether a news article discusses astrophysics, international diplomacy, or organic chemistry when computers process only numbers? The simplest representation is to treat a document as a literal bag of words: toss all the words into a sack, shake away grammatical word order, and tally how many times each dictionary term appears. Yet raw word counts deceive: the word "the" might appear fifty times in every document, while the critical distinguishing word "supernova" appears only three times. TF-IDF resolves this disparity mathematically, weighting words by how uniquely informative they are across the entire document corpus.`,
  intuition: [
    r`The Bag of Words vector space model: Given a vocabulary $\mathcal{V}$ of $V$ unique words, any document $d$ can be mapped to a $V$-dimensional vector $\mathbf{x} = [c_1, c_2, \dots, c_V]$, where $c_i$ is the count of occurrences of word $w_i$ in document $d$. This representation possesses two profound properties: (1) it transforms arbitrary-length text into fixed-length mathematical vectors that can be fed directly to linear classifiers, support vector machines, or clustering algorithms; and (2) it discards word order completely ("dog bites man" and "man bites dog" yield identical vectors). Despite this radical simplification, word frequencies capture strong topical semantics.`,
    r`The limitation of raw term frequencies: If you compute Euclidean distance or dot products between raw count vectors, two flaws arise: (1) Longer documents have larger counts simply because they contain more words, creating artificial bias; and (2) Common words that appear everywhere ("said", "year", "people") dominate the dot product, drowning out rare, highly specific keywords ("mitochondria", "amortisation").`,
    r`Inverse Document Frequency as information content: In 1972, British computer scientist Karen Spärck Jones introduced Inverse Document Frequency (IDF) based on information theory. If a word $t$ appears in every single document across a corpus ($|\{d : t \in d\}| = N$), it carries zero discriminative information: $\log(N / N) = \log(1) = 0$. Conversely, if a word appears in only two documents out of ten thousand, it is a rare, highly specialized topic descriptor, producing a large positive IDF score. Multiplying Term Frequency by Inverse Document Frequency ($\text{TF} \times \text{IDF}$) scales each word's weight by its uniqueness.`,
    r`Cosine similarity over normalised sparse vectors: Because document vocabularies span tens of thousands of words, TF-IDF vectors are extremely sparse (over 99% of entries are zeros). Normalising each vector to unit Euclidean norm ($L_2$ normalisation) eliminates document length bias: dividing by vector magnitude ensures that a short 100-word essay and a 1,000-word technical report on the same topic map to identical directions in vector space. The inner dot product between two $L_2$-normalised vectors equals their cosine similarity $\cos(\theta) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|} \in [0, 1]$, providing a fast, scale-invariant metric for search engine document ranking.`,
  ],
  analogy: r`Imagine you are an investigator trying to identify which international culinary cuisine a mystery recipe belongs to. If you simply count raw ingredient quantities (Bag of Words), the recipe lists "4 cups water, 2 tablespoons salt, 1 tablespoon oil". These high-frequency ingredients make up 90% of the bowl, but water and salt appear in nearly every kitchen on Earth: they tell you nothing about whether the dish is French, Indian, or Mexican. Term Frequency is how much of an ingredient is in the bowl. Inverse Document Frequency is like consulting a global culinary spice pantry: salt is in 100% of pantries (IDF near zero); olive oil is in 40% (modest IDF); but "garam masala" is found in only 3% of pantries, and "fenugreek" in only 1%. Multiplying quantity by spice rarity immediately highlights the teaspoon of fenugreek as the true signature of the dish, correctly identifying the cuisine in seconds.`,
  steps: [
    {
      title: r`Construct global vocabulary dictionary`,
      desc: r`Extract all unique tokens across the document corpus and assign column indices.`,
      detail: r`Tokenise and normalise all documents across corpus $D$. Collect the set of unique words $\mathcal{V} = \{w_1, \dots, w_V\}$. Optionally prune words below a minimum document frequency (min_df) or above a maximum frequency (max_df) to eliminate noise and extreme stop words.`,
    },
    {
      title: r`Compute Term Frequency (TF) matrix`,
      desc: r`Count occurrences of each vocabulary word within each individual document.`,
      detail: r`Construct the document-term count matrix $C \in \mathbb{R}^{N \times V}$. Compute Term Frequency $\text{tf}(t, d)$: options include raw counts $f_{t, d}$, relative frequency $\frac{f_{t, d}}{\sum_{t'} f_{t', d}}$, or sub-linear logarithmic frequency $1 + \log(f_{t, d})$ (for $f_{t, d} > 0$) to diminish the leverage of repeated mentions.`,
    },
    {
      title: r`Calculate Inverse Document Frequency (IDF) vector`,
      desc: r`Measure the global rarity of each vocabulary word across the entire corpus.`,
      detail: r`For each word $t \in \mathcal{V}$, count the document frequency $\operatorname{df}(t) = |\{d \in D : t \in d\}|$. Compute smoothed IDF: $\operatorname{idf}(t) = \log\left(\frac{1 + N}{1 + \operatorname{df}(t)}\right) + 1$, where adding 1 to numerator and denominator prevents division by zero and ensures words appearing in all documents retain non-zero positive weights.`,
    },
    {
      title: r`Form TF-IDF matrix and apply L2 normalisation`,
      desc: r`Multiply local frequencies by global weights and project vectors onto the unit sphere.`,
      detail: r`Compute unnormalised weights $w_{d, t} = \text{tf}(t, d) \cdot \operatorname{idf}(t)$. For each document vector $\mathbf{w}_d$, divide by its Euclidean norm: $\tilde{\mathbf{w}}_d = \frac{\mathbf{w}_d}{\|\mathbf{w}_d\|_2} = \frac{\mathbf{w}_d}{\sqrt{\sum_t w_{d, t}^2}}$. $L_2$ normalisation neutralises document length differences completely.`,
    },
    {
      title: r`Query matching via cosine similarity`,
      desc: r`Rank documents by relevance to an incoming user search string.`,
      detail: r`Transform the search query into a TF-IDF vector $\mathbf{q}$ using the pre-computed corpus IDF weights and normalise $\|\mathbf{q}\|_2 = 1$. Evaluate relevance scores across all corpus documents via matrix multiplication: $\mathbf{s} = X_{\text{tfidf}} \mathbf{q}$. Sort documents descending by score to return top search results.`,
    },
  ],
  math: [
    {
      h: r`Smooth Inverse Document Frequency (scikit-learn standard)`,
      tex: r`\operatorname{idf}(t, D) = \log\left(\frac{1 + N}{1 + \operatorname{df}(t)}\right) + 1`,
      p: r`Here $N = |D|$ is the total number of documents in the corpus, and $\operatorname{df}(t) = |\{d \in D : t \in d\}|$ is the number of documents containing term $t$. The additive smoothing $+1$ ensures that words present in all documents do not receive a weight of zero.`,
    },
    {
      h: r`TF-IDF term weight calculation`,
      tex: r`\operatorname{tfidf}(t, d, D) = \operatorname{tf}(t, d) \cdot \operatorname{idf}(t, D)`,
      p: r`Term frequency $\operatorname{tf}(t, d)$ rewards words that appear frequently within document $d$, while $\operatorname{idf}(t, D)$ penalises words that appear commonly across the entire collection $D$, maximising the weight of domain-specific keywords.`,
    },
    {
      h: r`Cosine similarity over L2-normalised vectors`,
      tex: r`\cos(\theta) = \frac{\mathbf{x} \cdot \mathbf{y}}{\|\mathbf{x}\|_2 \|\mathbf{y}\|_2} = \sum_{t \in \mathcal{V}} \tilde{x}_t \cdot \tilde{y}_t \in [0, 1]`,
      p: r`Because TF-IDF entries are strictly non-negative ($x_t \ge 0$), the cosine of the angle between two document vectors is bounded in $[0, 1]$. An angle of $0^\circ$ ($\cos=1$) denotes identical relative term distributions, while an angle of $90^\circ$ ($\cos=0$) indicates completely disjoint vocabularies.`,
    },
  ],
  keyPoints: [
    r`The Bag of Words model represents text as fixed-length vectors of token counts, discarding grammatical syntax and word order.`,
    r`TF-IDF multiplies local Term Frequency by global Inverse Document Frequency to elevate uniquely informative keywords.`,
    r`Inverse Document Frequency (IDF) penalises ubiquitous terms, automatically dampening function words like "the" and "is".`,
    r`$L_2$ vector normalisation eliminates document length bias, allowing fair comparison between short abstracts and long treatises.`,
    r`Cosine similarity over normalised sparse TF-IDF vectors powers classical search ranking, document clustering, and text classification.`,
  ],
  pitfalls: [
    r`Ignoring vocabulary out-of-vocabulary (OOV) terms at test time: Words in test documents that never appeared in the training corpus have undefined IDF weights and must be ignored or mapped to an unknown token.`,
    r`Fitting TF-IDF on test data (data leakage): Computing IDF on the combination of training and test sets leaks global corpus statistics; always fit the TfidfVectorizer strictly on training data and transform test data.`,
    r`Failing to apply sub-linear TF scaling: Raw count TF assumes that twenty mentions of a word imply twenty times more importance than a single mention; sub-linear scaling ($1 + \log(\text{tf})$) mitigates this distortion.`,
    r`Dense array conversion memory blowup: Storing TF-IDF matrices as dense NumPy arrays ($N \times V$) consumes tens of gigabytes of RAM; always maintain representations as scipy.sparse CSR matrices.`,
    r`Polysemy and synonymy blindness: TF-IDF treats "sofa" and "couch" as completely orthogonal dimensions (synonymy), and cannot distinguish between "bank" of a river and financial "bank" (polysemy); dense neural embeddings resolve these semantic gaps.`,
  ],
  code: r`import numpy as np
import re

# Small corpus of 4 documents across two distinct topics (machine learning vs cooking)
corpus = [
    "Machine learning models require training data and algorithms.",
    "Deep neural networks learn representations from training data.",
    "The chef prepared a delicious pasta recipe with garlic sauce.",
    "Italian pasta dishes require garlic, olive oil, and fresh herbs."
]

# 1. Build Vocabulary
def tokenize(text):
    return [w for w in re.split(r'\W+', text.lower()) if len(w) > 2]

tokenized_corpus = [tokenize(doc) for doc in corpus]
vocab = sorted(list(set(w for doc in tokenized_corpus for w in doc)))
word_to_idx = {w: i for i, w in enumerate(vocab)}
N = len(corpus)
V = len(vocab)

print(f"Corpus size: {N} documents")
print(f"Vocabulary size: {V} unique terms")

# 2. Compute Count Matrix (Bag of Words)
count_matrix = np.zeros((N, V), dtype=np.float32)
for doc_idx, tokens in enumerate(tokenized_corpus):
    for tok in tokens:
        if tok in word_to_idx:
            count_matrix[doc_idx, word_to_idx[tok]] += 1.0

# 3. Compute Smooth Inverse Document Frequency (IDF)
# idf(t) = log((1 + N) / (1 + df(t))) + 1
doc_freq = np.sum(count_matrix > 0, axis=0)  # number of documents containing term
smooth_idf = np.log((1.0 + N) / (1.0 + doc_freq)) + 1.0

# 4. Compute TF-IDF Matrix and L2 Normalisation
tf_matrix = count_matrix  # using raw count TF
tfidf = tf_matrix * smooth_idf

# L2 vector normalisation per document row
row_norms = np.linalg.norm(tfidf, axis=1, keepdims=True)
tfidf_norm = tfidf / np.maximum(row_norms, 1e-8)

print("\nSample IDF weights:")
for sample_word in ["training", "garlic", "pasta", "data"]:
    w_idx = word_to_idx[sample_word]
    print(f"  '{sample_word:<10}': df={doc_freq[w_idx]:.0f}/{N}, IDF={smooth_idf[w_idx]:.4f}")

# 5. Information Retrieval Query Matching via Cosine Similarity
query = "pasta recipe garlic"
q_tokens = tokenize(query)
q_counts = np.zeros(V, dtype=np.float32)
for tok in q_tokens:
    if tok in word_to_idx:
        q_counts[word_to_idx[tok]] += 1.0

q_tfidf = q_counts * smooth_idf
q_norm = q_tfidf / np.maximum(np.linalg.norm(q_tfidf), 1e-8)

# Cosine similarity: dot product of normalized vectors
similarities = tfidf_norm @ q_norm

print(f"\nQuery: '{query}'")
print("Document relevance rankings (Cosine Similarity):")
ranked_indices = np.argsort(similarities)[::-1]
for rank, idx in enumerate(ranked_indices):
    print(f"  Rank {rank+1} (Score: {similarities[idx]:.4f}): \"{corpus[idx]}\"")

assert ranked_indices[0] == 2, "Top ranked document should be doc 3 (pasta recipe)!"
print("\nVerified: TF-IDF vectorisation and cosine similarity ranking executed successfully!")`,
  quiz: [
    {
      q: r`Why does Inverse Document Frequency (IDF) take the logarithm of inverse document frequency ($\log\frac{N}{\operatorname{df}(t)}$)?`,
      o: [
        r`To dampen the effect of extreme rarity; without the logarithm, a term appearing in 1 document out of 1,000,000 would receive an overwhelmingly massive weight of 1,000,000`,
        r`To convert negative counts into positive numbers`,
        r`Because computers can only multiply numbers that have been logged`,
        r`To prevent words with odd numbers of letters from being indexed`,
      ],
      a: 0,
      why: r`Linear inverse document frequency ($N / \operatorname{df}$) would scale by millions for rare typos or hapax legomena, swamping all other words. The logarithmic damping scales rarity gracefully according to information theory.`,
    },
    {
      q: r`What is the primary purpose of applying $L_2$ normalisation to document TF-IDF vectors?`,
      o: [
        r`To eliminate document length bias, ensuring that a 200-word summary and a 2,000-word detailed report on the identical topic map to the same directional vector`,
        r`To compress the sparse matrix into a single byte`,
        r`To convert all vector coefficients into integer values`,
        r`To invert the polarity of negative sentiment words`,
      ],
      a: 0,
      why: r`Long documents naturally contain higher word counts purely by virtue of length. $L_2$ normalisation projects each vector onto the unit hypersphere, making cosine similarity sensitive purely to relative word distributions rather than absolute volume.`,
    },
    {
      q: r`What classic semantic limitation does the Bag of Words model suffer from due to discarding word sequence order?`,
      o: [
        r`It cannot distinguish between phrases with identical words but opposite meanings, such as "man bites dog" versus "dog bites man"`,
        r`It cannot represent words longer than eight characters`,
        r`It fails when processing text with more than 100 sentences`,
        r`It cannot be trained using scikit-learn`,
      ],
      a: 0,
      why: r`Because the Bag of Words representation pools all word counts into a single histogram, all syntactic order, grammatical roles, and phrase compositions are discarded, making permutations of the same words indistinguishable.`,
    },
    {
      q: r`Why is it critical to compute IDF weights strictly on the training set and avoid fitting on test data?`,
      o: [
        r`Fitting IDF on test documents causes data leakage by exposing global corpus frequency statistics from the test set to the feature extraction pipeline`,
        r`Because test documents cannot be tokenised using regular expressions`,
        r`Because computing test IDF causes division by zero`,
        r`Because scikit-learn throws an unhandled exception when transforming test data`,
      ],
      a: 0,
      why: r`IDF reflects global corpus statistics. If test documents are included when calculating document frequencies, the model gains illicit foresight into the test distribution (data leakage). Preprocessors must be fit exclusively on training data.`,
    },
  ],
  usedBy: [],
  prereq: ['word-and-sentence-tokenization', 'stop-words-and-n-grams', 'text-normalisation-unicode-and-regex'],
  related: ['stop-words-and-n-grams', 'word-and-sentence-tokenization', 'text-normalisation-unicode-and-regex'],
  keywords: 'bag of words bow tf idf term frequency inverse document frequency information retrieval count vectorizer cosine similarity karen sparck jones nlp text classification',
},
  {
    id: 'bm25-and-search-ranking',
    short: 'BM25 & Search Ranking',
    title: 'BM25 and search ranking',
    task: 'concepts',
    module: 'Words and text',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`BM25 (Best Matching 25, or Okapi BM25) is the industry-standard probabilistic ranking function for lexical search engines such as Lucene and Elasticsearch. It overcomes the two core weaknesses of classical TF-IDF: unbounded term frequency runaway and aggressive length distortion. By introducing asymptotic term frequency saturation via hyperparameter k1 and penalising verbose documents relative to the average corpus length via hyperparameter b, BM25 provides resilient, high-precision search ranking.`,
    lead: r`If a user searches for "machine learning", a document that repeats the word "learning" one thousand times should not automatically outrank a concise, perfectly targeted technical tutorial. Under vanilla TF-IDF, term frequency grows linearly or logarithmically without an upper bound, making keyword-stuffed pages dominate search results. Okapi BM25 fixes this fundamental flaw: it models the probabilistic odds of relevance, caps the scoring contribution of any single term via an asymptotic saturation curve, and balances document length penalisation against average corpus depth.`,
    intuition: [
      r`The diminishing returns of term frequency: Imagine reading an introductory paper on neural networks. The first mention of the word "backpropagation" is enormously informative—it signals that the document is genuinely about neural training. The fourth mention confirms its centrality. But does the fiftieth mention make the document fifty times more relevant than the first? Obviously not. BM25 introduces term frequency saturation: the relevance boost granted by each additional occurrence of a query term rapidly tapers off, approaching an asymptotic upper ceiling (k1 + 1).`,
      r`Document length and the dual nature of verbosity: A long document can arise for two very different reasons: verbosity (the author used 3,000 words to explain what could be said in 300) or scope (the document is a comprehensive handbook covering 50 distinct subtopics). If a search engine ignores document length, long documents win every query by sheer token volume. If it divides by document length naively (like Euclidean normalisation in TF-IDF), comprehensive articles are unfairly penalised. BM25 uses hyperparameter b to calibrate length normalisation against the corpus mean length, penalising repetitive verbosity while preserving fair scoring for comprehensive documents.`,
      r`Why BM25 anchors the modern search stack: Despite the rise of dense neural embeddings and vector databases, BM25 remains indispensable in production information retrieval. Dense vector models struggle with exact product serial numbers, rare medical jargon, and specific names where semantic similarity fails. Production search architectures almost universally rely on hybrid retrieval: an inverted index running BM25 retrieves high-precision candidate documents in microseconds, which are then fused with dense embeddings using reciprocal rank fusion before neural reranking.`,
    ],
    analogy: r`Think of judging candidate job applicants based on a required skill like "Python programming". Candidate A mentions Python twice across a tidy one-page curriculum vitae. Candidate B is a spammer who copy-pasted the word "Python" five hundred times at the bottom of their CV in tiny font. Under linear TF-IDF, Candidate B scores 250 times higher than Candidate A and gets hired immediately. BM25 acts like an experienced hiring manager: hearing "Python" twice is great evidence of competence, but hearing it twenty more times adds almost no extra conviction (saturation via k1). Furthermore, the manager judges whether the applicant's CV is abnormally long compared to typical CVs (length normalisation via b), easily exposing spam while rewarding concise, relevant experience.`,
    steps: [
      {
        title: r`Tokenise and compute collection length statistics`,
        desc: r`Segment documents into tokens and compute total corpus length and average document length.`,
        detail: r`Tokenise all N documents in the collection D. Measure the token length |D| of each document and calculate the average document length avgdl across the entire corpus.`,
      },
      {
        title: r`Construct inverted index and document frequencies`,
        desc: r`Map vocabulary terms to posting lists and calculate document frequencies.`,
        detail: r`For each distinct query term q_i, count the number of documents n(q_i) that contain at least one occurrence of q_i. Build an inverted index mapping each term to its list of matching document IDs and within-document frequencies f(q_i, D).`,
      },
      {
        title: r`Compute Robertson-Spärck Jones IDF with non-negative smoothing`,
        desc: r`Calculate inverse document frequency weights for all terms in the query.`,
        detail: r`Apply the Robertson-Spärck Jones IDF formula with Lucene-style non-negative smoothing: IDF(q_i) = ln(1 + (N - n(q_i) + 0.5) / (n(q_i) + 0.5)). The +1 offset ensures that frequent terms occurring in the majority of documents never produce negative IDF weights.`,
      },
      {
        title: r`Calculate saturated term frequency and length penalty`,
        desc: r`Scale term frequencies using hyperparameters k1 and b relative to avgdl.`,
        detail: r`For each document matching query terms, compute the length scaling factor K = k1 * (1 - b + b * (|D| / avgdl)). Then compute the saturated TF component: (f(q_i, D) * (k1 + 1)) / (f(q_i, D) + K).`,
      },
      {
        title: r`Accumulate BM25 scores and rank candidate documents`,
        desc: r`Sum the products of IDF and saturated TF across all query terms to rank results.`,
        detail: r`Sum the term contributions for each candidate document to obtain the final BM25 score. Sort matching documents in descending order of score and return the top-k ranked results.`,
      },
    ],
    math: [
      {
        h: r`Robertson-Spärck Jones IDF (Lucene non-negative formulation)`,
        tex: r`\operatorname{IDF}(q_i) = \ln \left( 1 + \frac{N - n(q_i) + 0.5}{n(q_i) + 0.5} \right)`,
        p: r`Here $N$ is total corpus size and $n(q_i)$ is the number of documents containing term $q_i$. Adding $1$ inside the natural logarithm guarantees that $\operatorname{IDF}(q_i) \ge 0$ for all terms, eliminating the risk of negative scores on common words.`,
      },
      {
        h: r`Okapi BM25 scoring function`,
        tex: r`\operatorname{BM25}(D, Q) = \sum_{i=1}^{|Q|} \operatorname{IDF}(q_i) \cdot \frac{f(q_i, D) \cdot (k_1 + 1)}{f(q_i, D) + k_1 \left( 1 - b + b \cdot \frac{|D|}{\operatorname{avgdl}} \right)}`,
        p: r`Here $f(q_i, D)$ is raw within-document term frequency, $|D|$ is document length in tokens, $\operatorname{avgdl}$ is the collection mean length, $k_1 \in [1.2, 2.0]$ controls saturation speed, and $b \in [0.5, 0.8]$ calibrates document length normalisation.`,
      },
      {
        h: r`Term frequency asymptotic upper bound`,
        tex: r`\lim_{f(q_i, D) \to \infty} \frac{f(q_i, D) \cdot (k_1 + 1)}{f(q_i, D) + K} = k_1 + 1, \quad \text{where } K = k_1 \left(1 - b + b \cdot \frac{|D|}{\operatorname{avgdl}}\right)`,
        p: r`Unlike vanilla TF-IDF which grows without bound, the term frequency component in BM25 is strictly bounded above by $(k_1 + 1)$, ensuring diminishing marginal returns and neutralising keyword-stuffing attacks.`,
      },
    ],
    keyPoints: [
      r`Okapi BM25 is a probabilistic ranking function that resolves the runaway term frequency and length distortion issues of TF-IDF.`,
      r`Hyperparameter k1 enforces term frequency saturation, establishing an asymptotic ceiling on any single term's score contribution.`,
      r`Hyperparameter b penalises overly verbose documents relative to the collection average length avgdl while fairly scoring comprehensive documents.`,
      r`Lucene-style non-negative IDF prevents terms appearing in more than 50% of documents from generating negative relevance scores.`,
      r`BM25 is the universal sparse lexical baseline in modern search engines and the foundational lexical retrieval leg in hybrid RAG systems.`,
    ],
    pitfalls: [
      r`Using unfloored original RSJ IDF: The original 1976 formula produces negative IDF values when a term appears in more than half the corpus, causing documents matching common terms to lose rank. Always use the modern non-negative Lucene formulation.`,
      r`Setting b = 1 unconditionally: Complete length normalisation severely penalises long, authoritative reference articles covering multiple related topics. Standard practice sets b = 0.75 as an optimal empirical balance.`,
      r`Mismatched query and index tokenisation: If index terms are lowercased and lemmatised but queries are processed verbatim with capital letters and punctuation, BM25 lookup misses matching posting lists entirely. Preprocessing pipelines must be identical.`,
      r`Ignoring zero-count query terms in sparse scoring: Query terms absent from the dictionary have undefined IDF; ensure the query evaluator gracefully defaults unknown tokens to zero score without raising key errors.`,
    ],
    code: r`import math
import re
from collections import Counter

class BM25Okapi:
    """
    Self-contained implementation of Okapi BM25 ranking algorithm
    with Lucene-style non-negative IDF and length normalisation.
    """
    def __init__(self, corpus, k1=1.5, b=0.75):
        self.k1 = k1
        self.b = b
        self.corpus_size = len(corpus)
        self.doc_lengths = []
        self.doc_freqs = Counter()
        self.doc_term_freqs = []
        self.avgdl = 0.0
        self.idf = {}
        
        self._build_index(corpus)
        
    def _tokenize(self, text):
        return [tok for tok in re.split(r'\W+', text.lower()) if tok]

    def _build_index(self, corpus):
        total_len = 0
        for doc in corpus:
            tokens = self._tokenize(doc)
            length = len(tokens)
            self.doc_lengths.append(length)
            total_len += length
            
            tf = Counter(tokens)
            self.doc_term_freqs.append(tf)
            
            for term in tf.keys():
                self.doc_freqs[term] += 1
                
        self.avgdl = total_len / self.corpus_size if self.corpus_size > 0 else 0.0
        
        # Precompute Lucene-style non-negative Robertson-Spärck Jones IDF
        for term, df in self.doc_freqs.items():
            numerator = self.corpus_size - df + 0.5
            denominator = df + 0.5
            self.idf[term] = math.log(1.0 + (numerator / denominator))

    def score(self, query_tokens, doc_index):
        score = 0.0
        doc_len = self.doc_lengths[doc_index]
        tf_dict = self.doc_term_freqs[doc_index]
        
        len_factor = 1.0 - self.b + self.b * (doc_len / self.avgdl)
        
        for q in query_tokens:
            if q not in self.idf:
                continue
            freq = tf_dict.get(q, 0)
            if freq == 0:
                continue
                
            idf_val = self.idf[q]
            tf_comp = (freq * (self.k1 + 1.0)) / (freq + self.k1 * len_factor)
            score += idf_val * tf_comp
            
        return score

    def rank(self, query, top_k=5):
        q_tokens = self._tokenize(query)
        scores = []
        for doc_idx in range(self.corpus_size):
            s = self.score(q_tokens, doc_idx)
            scores.append((doc_idx, s))
            
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]

# Sample corpus
corpus = [
    "Machine learning algorithms build mathematical models based on sample training data.",
    "Deep neural networks and convolutional networks excel at computer vision tasks.",
    "Natural language processing and search engines use inverted indices and ranking functions.",
    "Search engines use BM25 to rank documents based on query term frequency and document length.",
    "Machine learning search engines combine dense embeddings and lexical BM25 for hybrid retrieval.",
    "The weather in London is cloudy with occasional showers in late autumn."
]

bm25 = BM25Okapi(corpus, k1=1.5, b=0.75)

print(f"Corpus size: {bm25.corpus_size} documents")
print(f"Average document length: {bm25.avgdl:.2f} tokens")
print("\nSample IDF weights:")
for sample_term in ["search", "engines", "bm25", "learning", "weather"]:
    print(f"  IDF('{sample_term}'): {bm25.idf.get(sample_term, 0.0):.4f}")

test_query = "search engines BM25 ranking"
print(f"\nTop search results for query: '{test_query}'")
rankings = bm25.rank(test_query, top_k=3)
for rank, (doc_idx, score) in enumerate(rankings, 1):
    print(f"{rank}. [Score: {score:.4f}] Doc {doc_idx}: '{corpus[doc_idx]}'")
`,
    quiz: [
      {
        q: r`Why does BM25 utilise term frequency saturation controlled by hyperparameter k1 instead of linear term frequency?`,
        o: [
          r`To prevent keyword-stuffed documents from achieving artificially inflated relevance scores through diminishing marginal returns`,
          r`To reduce the dimension of the vocabulary matrix to zero`,
          r`To convert all floating-point term weights into 8-bit integers`,
          r`To ensure that query terms are always processed in reverse alphabetical order`,
        ],
        a: 0,
        why: r`Linear TF allows a document repeating a keyword 100 times to dominate rankings regardless of quality. By enforcing an asymptotic upper limit (k1 + 1), BM25 ensures that additional keyword occurrences yield diminishing marginal gains.`,
      },
      {
        q: r`What does setting the length normalisation parameter b = 0 in BM25 achieve?`,
        o: [
          r`It completely deactivates document length penalisation, treating short and long documents identically for equal term frequencies`,
          r`It forces all document relevance scores to exactly zero`,
          r`It eliminates all stop words from the query vector`,
          r`It restricts the index to documents containing exactly zero tokens`,
        ],
        a: 0,
        why: r`In the term K = k1 * (1 - b + b * (|D| / avgdl)), setting b = 0 collapses K to the constant k1. Document length |D| is completely eliminated from the scoring calculation.`,
      },
      {
        q: r`What is the purpose of the +1 offset inside the logarithm in modern Lucene-style BM25 IDF: ln(1 + (N - n(q) + 0.5) / (n(q) + 0.5))?`,
        o: [
          r`It guarantees that the IDF value is always strictly non-negative, preventing terms that appear in the majority of documents from contributing negative scores`,
          r`It ensures that the term frequency is multiplied by two`,
          r`It converts the base from natural logarithm to base 10`,
          r`It allows the algorithm to run on GPU hardware without CUDA errors`,
        ],
        a: 0,
        why: r`In the original RSJ IDF formula, any word appearing in more than 50% of the corpus produced a negative value. Adding 1 inside the natural log guarantees that the argument is always >= 1, ensuring non-negative weights for all terms.`,
      },
    ],
    usedBy: [],
    prereq: ['bag-of-words-and-tf-idf', 'stop-words-and-n-grams'],
    related: ['bag-of-words-and-tf-idf', 'stemming-vs-lemmatisation', 'stop-words-and-n-grams'],
    keywords: 'bm25 okapi bm25 search ranking information retrieval probabilistic relevance term frequency saturation document length normalisation tf idf elasticsearch lucene inverted index',
  },
  {
    "id": "phonetic-matching-soundex",
    "short": "Phonetic Matching & Soundex",
    "title": "Phonetic Matching: Soundex, Metaphone, and String Distance",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Phonetic algorithms encode words based on phonetic pronunciation patterns, ignoring minor spelling variations and silent letters. The classic Soundex algorithm retains the first letter and encodes subsequent consonants into six acoustic phonetic classes, producing a fixed 4-character code. Metaphone and Double Metaphone incorporate English pronunciation rules, diphthongs, and non-English spelling nuances for superior precision. Hybrid deduplication pipelines combine phonetic hashing with string edit distance (Levenshtein, Jaro-Winkler) for scalable entity matching.",
    "lead": "Phonetic matching indexes words and names by pronunciation rather than literal spelling, resolving orthographic errors and acoustic ambiguities. Algorithmic approaches such as Soundex, Metaphone, and Double Metaphone map phonemes into discrete acoustic hash buckets, enabling robust entity resolution and fuzzy retrieval.",
    "analogy": "Imagine a busy airport check-in desk where a gate agent shouts passenger names across a noisy terminal. Regardless of whether a traveller's boarding pass spells their surname as \"Mayer\", \"Meyer\", or \"Meier\", the acoustic signature arriving at the passenger's ear is identical. Phonetic algorithms formalise this acoustic listening filter into deterministic mathematical rules.",
    "intuition": [
      "Names and common terms in natural language are frequently misspelt due to acoustic similarity: \"Smith\", \"Smyth\", and \"Smithe\" are spelled differently but spoken identically in English. Standard string search or Levenshtein distance treats \"Smith\" and \"Smyth\" as distinct strings with edit distance 1, which becomes expensive when querying millions of database records. Phonetic algorithms like Soundex solve this by collapsing acoustically equivalent phonemes into the same hash code (e.g. all three map to \"S530\"). By transforming strings into phonetic representations upfront, databases can match phonetically identical entities using constant-time hash lookups or index scans, reserving expensive fuzzy edit distance comparisons only for ambiguous secondary ranking."
    ],
    "steps": [
      "Normalise text: convert strings to uppercase and strip non-alphabetical punctuation and whitespace.",
      "Record initial anchor: retain the very first character of the word as the leading character of the phonetic key.",
      "Encode remaining characters: map letters to their acoustic category digits (1 through 6) while flagging vowels and silent consonants as 0.",
      "Deduplicate adjacent codes: collapse consecutive identical code digits into a single occurrence.",
      "Remove vowels and non-consonant markers: strip all zeros from the encoded digit sequence.",
      "Format fixed-length output: pad with trailing zeros or truncate to produce the standardised 4-character identifier."
    ],
    "math": [
      {
        "h": "Phonetic Matching: Soundex, Metaphone, and String Distance formulation (Part 1)",
        "tex": "f(c) = \\begin{cases} 1 & c \\in \\{B, F, P, V\\} \\\\ 2 & c \\in \\{C, G, J, K, Q, S, X, Z\\} \\\\ 3 & c \\in \\{D, T\\} \\\\ 4 & c \\in \\{L\\} \\\\ 5 & c \\in \\{M, N\\} \\\\ 6 & c \\in \\{R\\} \\\\ 0 & c \\in \\{A, E, I, O, U, H, W, Y\\} \\end{cases}",
        "p": "Rule constraints apply: 1. Adjacent consonants with the identical digit code are collapsed into one single digit. 2. Vowels and ${H, W, Y}$ (code 0) are dropped after the initial letter. 3. The res..."
      },
      {
        "h": "Phonetic Matching: Soundex, Metaphone, and String Distance formulation (Part 2)",
        "tex": "D(i, j) = \\begin{cases} \\max(i, j) & \\min(i, j) = 0 \\\\ \\min \\begin{cases} D(i-1, j) + 1 \\\\ D(i, j-1) + 1 \\\\ D(i-1, j-1) + \\mathbb{I}(s_i \\ne t_j) \\end{cases} & \\text{otherwise} \\end{cases}",
        "p": "Rule constraints apply: 1. Adjacent consonants with the identical digit code are collapsed into one single digit. 2. Vowels and ${H, W, Y}$ (code 0) are dropped after the initial letter. 3. The res..."
      }
    ],
    "code": "def soundex(word):\n    \"\"\"Computes the classic American Soundex code for an input word.\"\"\"\n    if not word or not isinstance(word, str):\n        return \"\"\n    \n    # 1. Clean and capitalise\n    cleaned = \"\".join([c.upper() for c in word if c.isalpha()])\n    if not cleaned:\n        return \"\"\n    \n    first_letter = cleaned[0]\n    \n    # Mapping table\n    mapping = {\n        'B': '1', 'F': '1', 'P': '1', 'V': '1',\n        'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',\n        'D': '3', 'T': '3',\n        'L': '4',\n        'M': '5', 'N': '5',\n        'R': '6'\n    }\n    \n    # 2. Encode characters\n    digits = []\n    prev_code = mapping.get(first_letter, '0')\n    \n    for char in cleaned[1:]:\n        code = mapping.get(char, '0')\n        if code != '0':\n            if code != prev_code:\n                digits.append(code)\n            prev_code = code\n        else:\n            prev_code = '0'  # Vowel or H/W/Y resets adjacent collapse\n            \n    # 3. Truncate or pad to exactly 3 digits\n    digits_str = \"\".join(digits)[:3]\n    return (first_letter + digits_str).ljust(4, '0')\n\n# Demonstrate phonetic matching across variant spellings\nnames = [\"Smith\", \"Smyth\", \"Smithe\", \"Schmidt\", \"Robert\", \"Rupert\"]\nencoded = {name: soundex(name) for name in names}\n\nprint(\"Phonetic Soundex Codes:\")\nfor name, code in encoded.items():\n    print(f\"  {name:10} -> {code}\")\n\n# Verification of matching clusters\nassert soundex(\"Smith\") == soundex(\"Smyth\") == soundex(\"Smithe\")\nassert soundex(\"Robert\") == soundex(\"Rupert\")\nprint(\"\\nEquivalence verified: ('Smith', 'Smyth', 'Smithe') all map to S530.\")\nprint(\"Equivalence verified: ('Robert', 'Rupert') both map to R163.\")",
    "keyPoints": [
      "Phonetic matching indexes words by acoustic consonant signatures, bypassing superficial orthographic and typographical discrepancies.",
      "Soundex produces deterministic 4-character acoustic buckets, facilitating $O(1)$ initial candidate filtering in entity resolution pipelines.",
      "Combining coarse phonetic blocking with fine-grained Levenshtein or Jaro-Winkler distance yields accurate, scalable fuzzy matching systems."
    ],
    "pitfalls": [
      "Relying on Soundex for cross-lingual phonetic search; Soundex was developed strictly for English phonetic morphology and fails on Slavic, Asian, or Arabic phonology.",
      "Ignoring first-letter orthographic shifts (such as \"Schmidt\" mapping to S253 while \"Smith\" maps to S530 despite similar auditory pronunciations).",
      "Over-collapsing distinct names into identical buckets due to Soundex's crude 4-character truncation; modern systems use Metaphone or Double Metaphone to preserve fine distinctions."
    ],
    "quiz": [
      {
        "q": "Under standard Soundex, which group of characters are mapped to code digit 1?",
        "o": [
          "Labial consonants: B, F, P, V",
          "Sibilants and velars: C, G, J, K, Q, S, X, Z",
          "Dental stops: D, T",
          "Liquid consonants: L, R"
        ],
        "a": 0,
        "why": "In the Soundex mapping system, the labial and labiodental consonants {B, F, P, V} share code digit 1."
      },
      {
        "q": "Why are vowels (A, E, I, O, U) assigned code 0 and dropped after the first letter in Soundex?",
        "o": [
          "Vowels are completely silent in spoken English phonology",
          "Vowels exhibit high variance and instability across dialects, while consonants carry primary lexical identity",
          "Vowels cannot be mapped into numerical integers without floating point division",
          "Vowels would exceed the 4-character byte limit of early storage systems"
        ],
        "a": 1,
        "why": "In English phonetic classification, vowel sounds shift dramatically across regional dialects and accents, whereas the consonant skeleton provides the most reliable acoustic signature."
      },
      {
        "q": "How does Double Metaphone improve upon classic Soundex for practical entity resolution?",
        "o": [
          "It encodes audio spectrograms using neural convolutions",
          "It returns primary and secondary phonetic keys accounting for non-English linguistic origins and silent consonants",
          "It converts all text to phonemic IPA symbols without string truncation",
          "It requires no predefined character mapping tables"
        ],
        "a": 1,
        "why": "Double Metaphone generates both a primary and an alternate pronunciation code, capturing phonetic variations across Germanic, Romance, and Slavic names."
      }
    ],
    "related": [
      "stemming-vs-lemmatisation",
      "bm25-and-search-ranking"
    ],
    "keywords": "phonetic matching soundex, phonetic matching: soundex, metaphone, and string distance, natural language processing, deep learning"
  },
  {
    "id": "collocations-and-pmi",
    "short": "Collocations & PMI",
    "title": "Collocations and Pointwise Mutual Information (PMI)",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Collocations (e.g. \"heavy rain\", \"pay attention\", \"machine learning\") are multi-word expressions with non-random semantic cohesion. Pointwise Mutual Information (PMI) measures the log ratio of joint co-occurrence probability against independent marginal probabilities. Positive PMI (PPMI) truncates negative values to zero, mitigating noise and uninformative negative correlations for low-frequency events. Statistical significance filtering using t-tests or Pearson's chi-squared test prevents rare pairs from dominating PMI rankings.",
    "lead": "Collocations are habitual word co-occurrences whose combined meaning exceeds or differs from the sum of their individual parts. Pointwise Mutual Information (PMI) and statistical hypothesis tests quantify whether words appear together significantly more often than expected by random chance, forming the mathematical foundation for phrase extraction, idiom detection, and distributional embeddings.",
    "analogy": "Imagine monitoring people entering a coffee shop. If two patrons frequently walk through the door within seconds of each other far more often than their individual visit rates would suggest, you conclude they are friends or colleagues who travel together, rather than two unrelated strangers who happened to arrive at the exact same moment.",
    "intuition": [
      "If you see the word \"heavy\", what words follow? You often say \"heavy rain\" or \"heavy smoker\", but rarely \"heavy wind\" or \"heavy worker\" (we say \"strong wind\" and \"hard worker\" instead). Grammatically, all these pairings are valid adjective-noun combinations, yet native speakers naturally favour specific pairings. These established pairings are called collocations. If two words are completely independent, the probability of seeing them together $P(x, y)$ equals the product of their individual occurrences $P(x)P(y)$. Pointwise Mutual Information (PMI) mathematically measures how many times more often words co-occur compared to pure independent chance. A high PMI indicates strong linguistic affinity, whereas a PMI near zero indicates random coincidence."
    ],
    "steps": [
      "Define a sliding context window of size $k$ across the tokenised corpus (or treat immediate bigram sequences as candidate pairs).",
      "Compute unigram counts $C(w)$ for all vocabulary words and total token count $N$.",
      "Compute co-occurrence counts $C(u, v)$ for all word pairs appearing within the context window.",
      "Filter rare candidates: discard pairs with co-occurrence counts below a minimum frequency threshold (e.g. $C(u, v) < 5$).",
      "Calculate PMI and PPMI values for all surviving candidate pairs.",
      "Rank pairs by PPMI score to extract meaningful collocations, multi-word terminology, or construct term-context association matrices."
    ],
    "math": [
      {
        "h": "Collocations and Pointwise Mutual Information (PMI) formulation (Part 1)",
        "tex": "\\text{PMI}(x, y) = \\log_2 \\frac{P(x, y)}{P(x) P(y)} = \\log_2 \\frac{C(x, y) \\cdot N}{C(x) \\cdot C(y)}",
        "p": "where $C(x, y)$ is the co-occurrence count within a sliding context window, $C(x)$ and $C(y)$ are individual word counts, and $N$ is the total number of observed tokens. Because unobserved or extre..."
      },
      {
        "h": "Collocations and Pointwise Mutual Information (PMI) formulation (Part 2)",
        "tex": "\\text{PPMI}(x, y) = \\max(0, \\text{PMI}(x, y))",
        "p": "To counter the tendency of raw PMI to overvalue rare words (e.g. two words occurring once each together yielding huge PMI), frequency-weighted $\\text{PMI}_\\alpha$ raises context probability to powe..."
      },
      {
        "h": "Collocations and Pointwise Mutual Information (PMI) formulation (Part 3)",
        "tex": "\\text{PMI}_\\alpha(x, y) = \\log_2 \\frac{P(x, y)}{P(x) P_\\alpha(y)}, \\quad P_\\alpha(y) = \\frac{C(y)^\\alpha}{\\sum_w C(w)^\\alpha}",
        "p": "To counter the tendency of raw PMI to overvalue rare words (e.g. two words occurring once each together yielding huge PMI), frequency-weighted $\\text{PMI}_\\alpha$ raises context probability to powe..."
      }
    ],
    "code": "import numpy as np\nfrom collections import Counter\n\ndef extract_collocations(corpus, window_size=2, min_count=2):\n    \"\"\"Computes PPMI scores for word pairs in a sliding window.\"\"\"\n    tokens = [t.lower() for doc in corpus for t in doc.split()]\n    N = len(tokens)\n    \n    unigram_counts = Counter(tokens)\n    cooccur_counts = Counter()\n    \n    # 1. Tally co-occurrences within sliding window\n    for i in range(len(tokens)):\n        target = tokens[i]\n        start = max(0, i - window_size)\n        end = min(len(tokens), i + window_size + 1)\n        for j in range(start, end):\n            if i != j:\n                context = tokens[j]\n                cooccur_counts[(target, context)] += 1\n                \n    # 2. Compute PPMI\n    ppmi_scores = {}\n    for (w1, w2), count in cooccur_counts.items():\n        if count < min_count:\n            continue\n        # Joint and marginal probabilities\n        p_joint = count / (N * 2 * window_size)\n        p_w1 = unigram_counts[w1] / N\n        p_w2 = unigram_counts[w2] / N\n        \n        pmi = np.log2(p_joint / (p_w1 * p_w2))\n        ppmi = max(0.0, pmi)\n        ppmi_scores[(w1, w2)] = (ppmi, count)\n        \n    return ppmi_scores\n\n# Synthetic domain corpus\ncorpus = [\n    \"natural language processing models natural language understanding\",\n    \"deep learning and natural language processing techniques\",\n    \"machine learning models process natural language text\",\n    \"deep learning algorithms power modern language processing\"\n]\n\nresults = extract_collocations(corpus, window_size=2, min_count=2)\n# Sort by PPMI descending\nsorted_collocations = sorted(results.items(), key=lambda x: x[1][0], reverse=True)\n\nprint(\"Top Discovered Collocations by PPMI:\")\nfor (w1, w2), (score, count) in sorted_collocations[:6]:\n    print(f\"  ({w1:8}, {w2:10}) -> PPMI: {score:.3f} (Count: {count})\")",
    "keyPoints": [
      "Collocations represent multi-word phrases whose co-occurrence reflects semantic and idiomatic association beyond random syntactic assembly.",
      "PMI contrasts empirical joint occurrence with independent marginal probability, identifying statistically cohesive expressions.",
      "Clipping to PPMI and applying smoothing exponents (such as $\\alpha = 0.75$) mitigates frequency bias towards rare vocabulary items."
    ],
    "pitfalls": [
      "Applying unregularised PMI to small corpora without frequency thresholds; rare words appearing together once can achieve artificially massive PMI scores.",
      "Treating PMI as an absolute probability metric rather than a scale-sensitive relative co-occurrence ratio.",
      "Confusing grammatical constituency with collocation; non-collocated common stopwords like \"of the\" have high co-occurrence counts but low PMI because their marginal frequencies are enormous."
    ],
    "quiz": [
      {
        "q": "What does a Pointwise Mutual Information (PMI) value of zero signify between two words?",
        "o": [
          "The words never appear in the same document",
          "The words co-occur at exactly the rate expected if their distributions were completely independent",
          "The words are strict antonyms with mutually exclusive meanings",
          "One of the words is an out-of-vocabulary token"
        ],
        "a": 1,
        "why": "When $P(x, y) = P(x)P(y)$, their ratio is 1, and $\\log_2(1) = 0$. This indicates that co-occurrence occurs at random baseline chance."
      },
      {
        "q": "Why does standard PMI tend to over-rank rare word pairings over common phrases?",
        "o": [
          "Because rare words have near-zero marginal probabilities $P(x)$ and $P(y)$ in the denominator",
          "Because logarithm functions cannot handle floating point decimals below 0.1",
          "Because rare words are automatically filtered out by tokenisers",
          "Because common words always receive negative PMI scores"
        ],
        "a": 0,
        "why": "If two rare words occur only once in the entire corpus, but happen to appear in the same window, $P(x,y) = 1/N$ while $P(x)P(y) = 1/N^2$, producing an inflated PMI of $\\log_2(N)$."
      },
      {
        "q": "Why is Positive PMI (PPMI) used instead of raw PMI when building term-context embedding matrices?",
        "o": [
          "Negative PMI scores require imaginary numbers to compute",
          "Negative PMI values are uninformative and noisy, indicating negative correlation that is unreliable on finite corpora",
          "PPMI guarantees that the resulting matrix is diagonal",
          "PPMI normalises matrix values strictly between 0 and 1"
        ],
        "a": 1,
        "why": "Negative PMI indicates that two words occur together less often than chance, which is noisy and difficult to estimate accurately on finite text corpora. Clipping to zero stabilizes downstream representations."
      }
    ],
    "related": [
      "distributional-semantics",
      "bm25-and-search-ranking"
    ],
    "keywords": "collocations and pmi, collocations and pointwise mutual information (pmi), natural language processing, deep learning"
  },
  {
    "id": "multilingual-text-scripts-and-the-tokenisation-tax",
    "short": "Multilingual Text & Token Tax",
    "title": "Multilingual Text: Scripts, Normalisation, and the Tokenisation Tax",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Scripts vary fundamentally: alphabetic (phonemic), syllabic (Japanese Kana), logographic/ideographic (Chinese Hanzi), and abjads (consonantal, right-to-left). Unicode standardisation encompasses multiple normalisation forms (NFC, NFD, NFKC, NFKD) to resolve equivalent canonical and compatibility representations. The \"tokenisation tax\" occurs when tokeniser vocabularies over-index on English words, fracturing non-Latin or morphologically rich text into byte fragments. Mitigation strategies include script-balanced vocabulary allocation, byte-level fallback encodings, and morphology-aware segmentation.",
    "lead": "Modern NLP systems process text across diverse writing systems, from Latin and Cyrillic alphabets to logographic scripts (Chinese) and abjads (Arabic, Hebrew). Variations in Unicode normalisation forms (NFC vs NFD) and vocabulary budget allocations impose a \"tokenisation tax\" on non-English languages, inflating sequence lengths, inference latencies, and API serving costs.",
    "analogy": "Imagine an international telegraph service where English words have single-character Morse shorthand codes, but messages in Spanish, Japanese, or Arabic must be spelt out character by character in binary Morse pulses. Senders of non-English messages pay quadrupled line fees and wait four times as long for transmissions to finish, purely because the telegraph codebook was compiled in London.",
    "intuition": [
      "Subword tokenisers like Byte-Pair Encoding (BPE) or WordPiece construct fixed vocabularies (e.g. 32,000 to 128,000 tokens) based on training text frequencies. Because the internet is predominantly English, vocabulary budgets are dominated by common English words and morphemes. In contrast, languages written in non-Latin scripts (such as Hindi, Arabic, Bengali, or Burmese) or morphologically agglutinative languages (like Turkish, Finnish, or Swahili) receive very few dedicated vocabulary entries. Consequently, a single sentence expressing identical semantic meaning might take 8 tokens in English, but require 35 to 45 tokens in Hindi or Amharic because characters are fragmented into individual bytes or punctuation tokens. This discrepancy—known as the tokenisation tax—means non-English speakers suffer higher monetary costs per query, shorter effective context windows, and slower generation speeds."
    ],
    "steps": [
      "Normalise incoming Unicode streams into a consistent canonical form (such as NFC) before tokenisation to avoid diacritic duplication.",
      "Examine script characteristics: handle right-to-left bidirectional flow for Arabic and Hebrew, and apply morphological segmenters for non-spaced logographic scripts (e.g. Jieba for Chinese).",
      "Analyse token fragmentation: measure average bytes per token across target language corpora to calculate the empirical tokenisation tax.",
      "Balance vocabulary allocation: use temperature-sampled multinomial data mixing during tokeniser vocabulary generation to allocate dedicated tokens to low-resource languages.",
      "Implement byte-fallback tokenisation (e.g. BBPE) to handle out-of-vocabulary characters gracefully without injecting uninformative `<unk>` unknown tokens."
    ],
    "math": [
      {
        "h": "Multilingual Text: Scripts, Normalisation, and the Tokenisation Tax Objective Function",
        "tex": "\\mathcal{L}_{\\text{total}} = \\sum_{i=1}^N \\ell(f(x_i), y_i)",
        "p": "Optimisation objective and loss formulation for multilingual text: scripts, normalisation, and the tokenisation tax."
      }
    ],
    "code": "import unicodedata\n\ndef compute_tokenisation_tax(sample_texts, mock_vocab):\n    \"\"\"Calculates token fragmentation across different language scripts.\"\"\"\n    results = {}\n    for lang, text in sample_texts.items():\n        # Canonical Normalisation (NFC)\n        norm_text = unicodedata.normalise('NFC', text)\n        words = norm_text.split()\n        \n        # Greedy longest subword tokenisation simulation\n        tokens = []\n        for word in words:\n            i = 0\n            while i < len(word):\n                matched = False\n                for j in range(len(word), i, -1):\n                    sub = word[i:j]\n                    if sub in mock_vocab:\n                        tokens.append(sub)\n                        i = j\n                        matched = True\n                        break\n                if not matched:\n                    # Fallback to UTF-8 byte tokens\n                    byte_tokens = [f\"<byte_{b}>\" for b in word[i].encode('utf-8')]\n                    tokens.extend(byte_tokens)\n                    i += 1\n                    \n        tax_ratio = len(tokens) / max(1, len(words))\n        results[lang] = {\n            'char_count': len(norm_text),\n            'word_count': len(words),\n            'token_count': len(tokens),\n            'tokens_per_word': tax_ratio,\n            'tokens': tokens[:6]  # First few tokens\n        }\n    return results\n\n# English-centric vocabulary (typical of earlier web-crawled models)\nmock_vocab = {\n    \"Artificial\", \"intelligence\", \"transforms\", \"modern\", \"technology\",\n    \"La\", \"intelligence\", \"artificielle\", \"moderne\"\n}\n\nsample_corpora = {\n    \"English\": \"Artificial intelligence transforms modern technology\",\n    \"French\": \"La intelligence artificielle transforme la technologie moderne\",\n    \"Hindi (Devanagari)\": \"कृत्रिम बुद्धिमत्ता आधुनिक तकनीक को बदल रही है\"\n}\n\nanalysis = compute_tokenisation_tax(sample_corpora, mock_vocab)\n\nprint(\"Multilingual Tokenisation Tax Comparison:\")\nfor lang, stats in analysis.items():\n    print(f\"\\n[{lang}]\")\n    print(f\"  Words: {stats['word_count']} | Generated Tokens: {stats['token_count']}\")\n    print(f\"  Tokens per Word: {stats['tokens_per_word']:.2f}\")\n    print(f\"  Sample Tokens: {stats['tokens']}\")",
    "keyPoints": [
      "Unicode standardisation through NFC normalisation is essential before tokenising multilingual text.",
      "The tokenisation tax leads to longer sequence lengths, reduced context windows, and inflated operational costs for non-English users.",
      "Byte-level subword tokenisers with balanced vocabulary sampling help equalise cross-lingual representation efficiency."
    ],
    "pitfalls": [
      "Neglecting Unicode normalisation (NFC vs NFD); identical looking characters like \"é\" (U+00E9) and \"e + ́\" (U+0065 U+0301) produce entirely different subword token sequences.",
      "Assuming word-level whitespace splitting works for languages without spaces between words (such as Chinese, Japanese, or Thai).",
      "Evaluating multilingual model latency solely on word or character counts, masking massive token count inflation for non-Latin scripts."
    ],
    "quiz": [
      {
        "q": "What is the primary cause of the \"tokenisation tax\" in multilingual language models?",
        "o": [
          "Non-Latin alphabets require more memory bits per letter in CPU cache",
          "Tokeniser vocabularies are heavily biased towards English and Latin subwords, forcing non-Latin text into fragmented single-byte tokens",
          "Non-English grammar requires recurrent neural networks instead of transformers",
          "Unicode consortium charges licensing fees for displaying non-Latin glyphs"
        ],
        "a": 1,
        "why": "Because pretraining data is predominantly English, subword merge operations allocate vocabulary entries to English words, while non-Latin scripts are fragmented into small byte sequences."
      },
      {
        "q": "Which Unicode normalisation form composes characters with their diacritical marks into precomposed code points wherever possible?",
        "o": [
          "NFD (Canonical Decomposition)",
          "NFC (Canonical Decomposition followed by Canonical Composition)",
          "NFKD (Compatibility Decomposition)",
          "ASCII-7 Strict Encoding"
        ],
        "a": 1,
        "why": "NFC decomposes characters canonically and then recomposes them into standard precomposed glyphs, ensuring consistent single-character representations."
      },
      {
        "q": "In a transformer architecture with standard quadratic attention, how does a 3x tokenisation tax impact attention computation FLOPs?",
        "o": [
          "Attention FLOPs remain unchanged",
          "Attention FLOPs increase by approximately 3x",
          "Attention FLOPs increase by approximately 9x ($3^2$)",
          "Attention FLOPs decrease due to higher sparsity"
        ],
        "a": 2,
        "why": "Standard self-attention computes an $N \\times N$ affinity matrix. Tripling the sequence length ($3N$) increases attention dot-products and memory by a factor of $3^2 = 9\\times$."
      }
    ],
    "related": [
      "stemming-vs-lemmatisation",
      "bert-and-masked-language-models"
    ],
    "keywords": "multilingual text scripts and the tokenisation tax, multilingual text: scripts, normalisation, and the tokenisation tax, natural language processing, deep learning"
  },
  {
    id: 'part-of-speech-tagging',
    short: 'POS Tagging',
    title: 'Part-of-speech tagging',
    task: 'concepts',
    module: 'Syntax',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Part-of-speech (POS) tagging is the foundational NLP task of assigning grammatical word classes (such as noun, verb, adjective, or preposition) to each token in a sentence. Because most common words are polysemous and syntactically ambiguous (e.g. "run" as a verb or noun, "flies" as a noun or verb), POS taggers resolve ambiguity by modelling local lexical emissions alongside grammatical transitions using rule-based heuristics, Hidden Markov Models (HMMs), or neural sequence models.`,
    lead: r`Consider the classic ambiguous sentence: "Time flies like an arrow; fruit flies like a banana." In the first half, "flies" is an active verb and "like" is a preposition. In the second half, "flies" is a plural noun (the insect Drosophila) and "like" is a verb expressing enjoyment. A naive dictionary lookup fails because human language is saturated with morphosyntactic ambiguity. Part-of-speech tagging resolves this by balancing what a word looks like against the grammatical rhythm of the words around it.`,
    intuition: [
      r`Open vs closed grammatical word classes: Human language consists of two distinct categories of words. Open classes—nouns, lexical verbs, adjectives, and adverbs—carry core semantic content and welcome new additions freely (e.g. "selfie", "googleable"). Closed classes—pronouns, determiners, conjunctions, and prepositions—are structural function words with small, fixed inventories (e.g. "the", "of", "and"). Closed class words rarely change POS, while open class words frequently shift between nouns, verbs, and modifiers depending on context.`,
      r`The dance between lexical emissions and grammatical transitions: A POS tagger balances two probabilistic forces: emission probability P(word | tag) and transition probability P(tag_i | tag_{i-1}). The emission probability asks: "How likely is the English noun class to emit the specific word 'flies'?" The transition probability asks: "In English grammar, how often does a determiner directly precede another determiner, or a noun precede a verb?" Even if "flies" is most frequently a verb in general usage, if it is preceded by "the fruit", the syntactic transition makes noun far more probable.`,
      r`Why POS tagging unlocks downstream NLP pipelines: POS tags act as essential grammatical signposts. Lemmatisation algorithms need POS tags to know whether "saw" should reduce to the base verb "see" or the noun "saw". Speech synthesis engines use POS tags to choose correct phonetics (e.g. "produce" stressed on the first syllable as a noun versus the second syllable as a verb). In dependency parsing and information extraction, POS tags prune the search space of grammatical relations by orders of magnitude.`,
    ],
    analogy: r`Imagine you are an orchestra conductor listening to an unfamiliar musical piece. Some notes are identical in pitch (like ambiguous words), but their musical function changes completely based on harmony and sequence: a C-major chord can serve as a triumphant tonic home base or a tense transitional pivot. You do not identify a chord in isolation; you evaluate the notes being played right now (lexical emission) alongside the harmonic chord progression that led up to it and where it resolves next (grammatical transition). POS tagging conducts an orchestra of words, ensuring every token plays its proper grammatical role in the syntactic symphony.`,
    steps: [
      {
        title: r`Tokenise text and initialise sentence boundaries`,
        desc: r`Segment input sentences into words and insert boundary start and stop markers.`,
        detail: r`Split text into discrete word tokens. Insert special sentinel tags (<START>, <STOP>) at sentence boundaries to condition initial tag transitions.`,
      },
      {
        title: r`Estimate transition and emission probability matrices`,
        desc: r`Count tag bigrams and word emissions from an annotated training corpus.`,
        detail: r`From a tagged treebank, calculate tag-to-tag transition counts C(t_{i-1}, t_i) and tag-to-word emission counts C(t_i, w_i). Apply Laplace or Good-Turing smoothing to ensure non-zero probabilities for rare pairs.`,
      },
      {
        title: r`Handle out-of-vocabulary words via morphological heuristics`,
        desc: r`Assign emission probabilities to unseen words using affixes and capitalisation.`,
        detail: r`For words absent from the training vocabulary, back off to subword morphological features: suffixes like '-tion' indicate nouns, '-ly' indicates adverbs, '-ed' indicates past verbs, and initial capitalisation indicates proper nouns.`,
      },
      {
        title: r`Execute Viterbi forward dynamic programming`,
        desc: r`Compute maximum prefix probabilities and record state backpointers across time steps.`,
        detail: r`Iterate through tokens t = 1 to T. For each candidate tag j in the tagset, find the preceding tag k that maximises the joint probability: v_t(j) = max_k [v_{t-1}(k) * P(t_j | t_k)] * P(w_t | t_j). Store the argmax index in backpointer bp_t(j).`,
      },
      {
        title: r`Backtrack from optimal terminating tag to construct tag sequence`,
        desc: r`Follow backpointers from sequence end to recover the globally optimal tag sequence.`,
        detail: r`Identify the tag with highest probability at t = T. Follow stored backpointers backward from T down to 1 to reconstruct the global maximum a posteriori tag sequence in O(T * |Y|^2) time.`,
      },
    ],
    math: [
      {
        h: r`Probabilistic sequence formulation (MAP decoding)`,
        tex: r`\hat{T} = \arg\max_{T \in \mathcal{Y}^T} P(T \mid W) = \arg\max_{T} P(W \mid T) P(T)`,
        p: r`Here $W = (w_1, \dots, w_T)$ is the observed token sequence, and $T = (t_1, \dots, t_T)$ is the sequence of grammatical tags. Because $P(W)$ is constant across all candidate tag sequences, decoding maximises the product of prior and emission probabilities.`,
      },
      {
        h: r`First-order Hidden Markov Model factorisation`,
        tex: r`P(W, T) \approx \prod_{i=1}^T P(t_i \mid t_{i-1}) \cdot P(w_i \mid t_i)`,
        p: r`Under the bigram Markov assumption, tag $t_i$ depends strictly on immediate predecessor $t_{i-1}$, and word $w_i$ depends strictly on current tag $t_i$, decomposing the joint probability into local transition and emission terms.`,
      },
      {
        h: r`Viterbi dynamic programming recurrence`,
        tex: r`v_t(j) = \max_{k \in \mathcal{Y}} \left[ v_{t-1}(k) \cdot P(t_j \mid t_k) \right] \cdot P(w_t \mid t_j)`,
        p: r`Here $v_t(j)$ represents the highest probability of any valid tag prefix of length $t$ terminating in tag state $j$. Storing backpointers enables exact sequence recovery in $O(T \cdot |\mathcal{Y}|^2)$ polynomial time instead of exponential search.`,
      },
    ],
    keyPoints: [
      r`Part-of-speech tagging assigns grammatical categories to words to disambiguate morphosyntactic function in context.`,
      r`Words are heavily polysemous: common words like "run", "flies", and "bank" shift between nouns and verbs based on adjacent syntax.`,
      r`The first-order Hidden Markov Model balances tag transition probabilities P(t_i | t_{i-1}) against lexical emission probabilities P(w_i | t_i).`,
      r`The Viterbi algorithm uses dynamic programming to discover the globally optimal tag sequence in O(T * |Y|^2) polynomial time.`,
      r`Universal Dependencies provides a 17-tag cross-linguistic standard that harmonises morphosyntactic categories across human languages.`,
    ],
    pitfalls: [
      r`Greedy local decoding: Picking the highest-probability tag at each token independently ignores downstream grammatical constraints, generating ungrammatical sequences like determiners followed directly by finite verbs.`,
      r`Floating-point probability underflow: Multiplying dozens of small probabilities between 0 and 1 causes numeric underflow to zero. Always compute Viterbi in log-space: log(a * b) = log(a) + log(b).`,
      r`Zero emission probabilities on out-of-vocabulary tokens: Encountering an unseen word without morphological smoothing collapses the entire sequence probability to zero. Always implement fallback subword smoothing.`,
      r`Relying solely on overall accuracy: Because trivial function words ("the", "is") inflate overall token accuracy to >92%, always evaluate ambiguous word accuracy and out-of-vocabulary accuracy separately.`,
    ],
    code: r`import math
from collections import defaultdict, Counter

class HMMPOSTagger:
    """
    Bigram Hidden Markov Model (HMM) Part-of-Speech Tagger
    with Laplace smoothing and log-space Viterbi decoding.
    """
    def __init__(self):
        self.tags = set()
        self.vocab = set()
        self.transitions = defaultdict(Counter)
        self.emissions = defaultdict(Counter)
        self.tag_counts = Counter()
        self.start_tag = "<START>"
        
    def train(self, tagged_sentences):
        for sentence in tagged_sentences:
            prev_tag = self.start_tag
            self.tag_counts[prev_tag] += 1
            
            for word, tag in sentence:
                word_clean = word.lower()
                self.tags.add(tag)
                self.vocab.add(word_clean)
                
                self.transitions[prev_tag][tag] += 1
                self.emissions[tag][word_clean] += 1
                self.tag_counts[tag] += 1
                prev_tag = tag

    def _log_transition(self, prev_t, curr_t, alpha=0.1):
        count = self.transitions[prev_t][curr_t]
        total = self.tag_counts[prev_t]
        prob = (count + alpha) / (total + alpha * len(self.tags))
        return math.log(prob)

    def _log_emission(self, tag, word, beta=0.01):
        word_clean = word.lower()
        count = self.emissions[tag][word_clean]
        total = self.tag_counts[tag]
        vocab_len = len(self.vocab) if len(self.vocab) > 0 else 1
        prob = (count + beta) / (total + beta * vocab_len)
        return math.log(prob)

    def tag(self, sentence_tokens):
        T = len(sentence_tokens)
        if T == 0:
            return []
            
        tag_list = sorted(list(self.tags))
        viterbi = [{} for _ in range(T)]
        backpointer = [{} for _ in range(T)]
        
        w0 = sentence_tokens[0]
        for tag in tag_list:
            trans_p = self._log_transition(self.start_tag, tag)
            emit_p = self._log_emission(tag, w0)
            viterbi[0][tag] = trans_p + emit_p
            backpointer[0][tag] = None
            
        for t in range(1, T):
            wt = sentence_tokens[t]
            for curr_t in tag_list:
                emit_p = self._log_emission(curr_t, wt)
                
                best_prev_t = None
                best_prob = -float('inf')
                for prev_t in tag_list:
                    p = viterbi[t-1][prev_t] + self._log_transition(prev_t, curr_t) + emit_p
                    if p > best_prob:
                        best_prob = p
                        best_prev_t = prev_t
                        
                viterbi[t][curr_t] = best_prob
                backpointer[t][curr_t] = best_prev_t
                
        best_last_tag = max(tag_list, key=lambda tag: viterbi[T-1][tag])
        
        best_tags = [best_last_tag]
        curr = best_last_tag
        for t in range(T - 1, 0, -1):
            curr = backpointer[t][curr]
            best_tags.append(curr)
            
        best_tags.reverse()
        return list(zip(sentence_tokens, best_tags))

# Sample corpus with ambiguous words: "flies", "can", "bank"
train_data = [
    [("the", "DET"), ("fruit", "NOUN"), ("flies", "NOUN"), ("eat", "VERB"), ("apples", "NOUN")],
    [("time", "NOUN"), ("flies", "VERB"), ("like", "ADP"), ("an", "DET"), ("arrow", "NOUN")],
    [("they", "PRON"), ("can", "AUX"), ("fish", "VERB"), ("in", "ADP"), ("the", "DET"), ("river", "NOUN")],
    [("he", "PRON"), ("opened", "VERB"), ("a", "DET"), ("can", "NOUN"), ("of", "ADP"), ("tuna", "NOUN")],
    [("the", "DET"), ("bank", "NOUN"), ("approved", "VERB"), ("the", "DET"), ("loan", "NOUN")],
    [("birds", "NOUN"), ("can", "AUX"), ("bank", "VERB"), ("steeply", "ADV"), ("in", "ADP"), ("flight", "NOUN")]
]

tagger = HMMPOSTagger()
tagger.train(train_data)

test_sentences = [
    ["time", "flies"],
    ["fruit", "flies"],
    ["can", "they", "bank"]
]

print("HMM POS Tagging Results:")
for sent in test_sentences:
    prediction = tagger.tag(sent)
    res_str = " ".join([f"{w}/{t}" for w, t in prediction])
    print(f"  Input: '{' '.join(sent)}' -> {res_str}")
`,
    quiz: [
      {
        q: r`Why is the Viterbi algorithm used instead of exhaustively enumerating every possible part-of-speech sequence?`,
        o: [
          r`Because exhaustive enumeration requires exponential O(|Y|^T) time, whereas Viterbi finds the global optimum in polynomial O(T * |Y|^2) time using dynamic programming`,
          r`Because Viterbi approximates the answer using random sampling`,
          r`Because exhaustive search cannot handle sentences containing punctuation`,
          r`Because Viterbi eliminates the need for emission probabilities`,
        ],
        a: 0,
        why: r`For a tagset of size |Y| and sentence length T, there are |Y|^T distinct paths. For 40 tags and 20 tokens, 40^20 is astronomical. Viterbi collapses identical prefix subproblems into T * |Y|^2 operations.`,
      },
      {
        q: r`In the sentence "The sailor can can the tuna", how should the two occurrences of "can" be tagged morphosyntactically?`,
        o: [
          r`The first "can" is an auxiliary verb (AUX), and the second "can" is a lexical transitive verb (VERB) meaning to preserve food in a container`,
          r`Both occurrences of "can" are common nouns (NOUN)`,
          r`Both occurrences of "can" are modal auxiliaries (AUX)`,
          r`The first "can" is a determiner (DET) and the second is a preposition (ADP)`,
        ],
        a: 0,
        why: r`In English grammar, modal auxiliaries like "can" precede a base verb. Here, "can" serves first as an auxiliary expressing ability, followed immediately by the lexical verb "can" meaning to preserve or package into tins.`,
      },
      {
        q: r`What makes discriminative Conditional Random Fields (CRFs) superior to generative Hidden Markov Models (HMMs) for POS tagging?`,
        o: [
          r`CRFs model the conditional distribution P(T | W) directly, enabling the inclusion of arbitrary overlapping, non-independent features such as capitalisation, prefixes, and suffixes without violating generative independence assumptions`,
          r`CRFs run in O(1) constant time regardless of sentence length`,
          r`CRFs do not require labelled training data`,
          r`CRFs only work on English and cannot be applied to other human languages`,
        ],
        a: 0,
        why: r`HMMs assume emissions are conditionally independent given the tag. Incorporating rich feature conjunctions violates HMM assumptions. CRFs model P(T | W) directly, supporting arbitrary overlapping feature functions.`,
      },
    ],
    usedBy: [],
    prereq: ['word-and-sentence-tokenization', 'text-normalisation-unicode-and-regex'],
    related: ['word-and-sentence-tokenization', 'stemming-vs-lemmatisation', 'tokenization'],
    keywords: 'part of speech pos tagging syntax morphosyntax universal dependencies penn treebank viterbi hidden markov model hmm crf sequence labelling bilstm',
  },
  {
    id: 'dependency-parsing',
    short: 'Dependency Parsing',
    title: 'Dependency parsing',
    task: 'concepts',
    module: 'Syntax',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Dependency parsing analyses the grammatical structure of a sentence by establishing directed, typed relations between words. Unlike constituency grammars that partition sentences into nested hierarchical phrases, dependency representations connect lexical heads directly to their dependents (e.g. subject, direct object, modifier). Transition-based dependency parsers use a shift-reduce state machine to build projective parse trees in linear O(n) time.`,
    lead: r`When an NLP system needs to extract information from the sentence "The large enterprise acquired a promising robotics startup", it does not merely care that words occurred near each other. It must answer: Who acquired whom? What was large, and what was promising? Dependency parsing answers these semantic questions directly by revealing the grammatical skeleton: "enterprise" is the subject of "acquired", "startup" is the direct object, and "robotics" is a modifier.`,
    intuition: [
      r`Constituency versus dependency syntax: Phrase structure grammars (constituency) group words into nested syntactic brackets: sentences are divided into Noun Phrases and Verb Phrases. While mathematically elegant, constituency trees do not explicitly state which word is in charge. Dependency grammar cuts directly to the chase: words link directly to words through directed binary arcs. Every phrase has a single head word (the governor) that determines its syntactic category, and all other words in the phrase are dependents modifying that head.`,
      r`The conveyor belt intuition of shift-reduce parsing: Think of transition-based parsing like an assembly line. Words arrive one by one on an input buffer (the conveyor belt). You pick up words and place them on a stack (your workbench). At each step, you decide whether to pull another word onto the workbench (SHIFT), link the top two words on the bench with a directed relationship where the second modifies the first (LEFT-ARC), or link them where the first modifies the second (RIGHT-ARC). When an arc is formed, the dependent word is removed, keeping only the head available to link with future words.`,
      r`Projectivity and crossing arcs: When words are written out in linear order, a dependency tree is projective if every dependency arc can be drawn as an arc above the words without any lines crossing. Most English sentences are projective. However, languages with flexible word order (such as German, Latin, or Russian) and long-distance topicalisation produce crossing arcs (non-projectivity), requiring graph-based parsing algorithms like Chu-Liu-Edmonds maximum spanning trees.`,
    ],
    analogy: r`Imagine building a family tree or corporate organisational chart. Constituency parsing is like drawing circles around departments: "Engineering Department", "Backend Team", "Platform Squad". It tells you which group people belong to, but does not tell you who reports to whom. Dependency parsing is the actual reporting tree: Employee A reports to Team Lead B, who reports to Director C, who reports to the Chief Executive (the ROOT). Finding who is responsible for an action is as simple as tracing the directed arrows from manager to subordinate.`,
    steps: [
      {
        title: r`Initialise parser configuration state`,
        desc: r`Set up stack containing ROOT, buffer containing sentence words, and empty arc set.`,
        detail: r`Create configuration state c = (stack, buffer, arcs). Push artificial index 0 (ROOT) onto the stack and load all token indices [1, 2, ..., n] into the input buffer.`,
      },
      {
        title: r`Predict next transition action`,
        desc: r`Use an oracle policy or neural classifier to choose between SHIFT, LEFT-ARC, or RIGHT-ARC.`,
        detail: r`Inspect features from the top stack elements (s0, s1) and first buffer element (b0). A trained classifier predicts the highest scoring transition action and syntactic relation label.`,
      },
      {
        title: r`Execute transition and update stack configuration`,
        desc: r`Apply selected action to create directed arcs or advance the buffer.`,
        detail: r`If SHIFT: pop b0 from buffer and push to stack. If LEFT-ARC: create arc s0 -> s1 with relation label and pop s1 from stack. If RIGHT-ARC: create arc s1 -> s0 with relation label and pop s0 from stack.`,
      },
      {
        title: r`Repeat until buffer is empty and stack retains only ROOT`,
        desc: r`Execute exactly 2n transitions to construct complete projective spanning tree.`,
        detail: r`Continue iterating state transitions until the buffer is exhausted and the stack contains only the ROOT token. In an Arc-Standard system, exactly n shifts and n reductions are executed, completing parsing in linear O(n) time.`,
      },
      {
        title: r`Extract typed dependency relations and evaluate tree`,
        desc: r`Verify acyclicity and single-head constraints, then score UAS and LAS.`,
        detail: r`Export extracted directed arcs. Check that each token has exactly one incoming parent arc. Evaluate parser accuracy against gold treebank annotations using Unlabelled Attachment Score (UAS) and Labelled Attachment Score (LAS).`,
      },
    ],
    math: [
      {
        h: r`Formal dependency tree structural axioms`,
        tex: r`d_{\text{in}}(w_0) = 0, \quad \forall i \ge 1: d_{\text{in}}(w_i) = 1, \quad G = (V, A) \text{ is acyclic}`,
        p: r`A valid dependency tree over vocabulary nodes $V = \{w_0 = \text{ROOT}, w_1, \dots, w_n\}$ must be a directed spanning tree rooted at $w_0$, where every non-root word has in-degree exactly 1 with no directed cycles.`,
      },
      {
        h: r`Arc-Standard transition operators`,
        tex: r`\begin{aligned} \text{SHIFT} &: (\sigma, b_0 \mid \beta, A) \implies (\sigma \mid b_0, \beta, A) \\ \text{LEFT-ARC}_r &: (\sigma \mid s_1 \mid s_0, \beta, A) \implies (\sigma \mid s_0, \beta, A \cup \{(s_0, r, s_1)\}) \\ \text{RIGHT-ARC}_r &: (\sigma \mid s_1 \mid s_0, \beta, A) \implies (\sigma \mid s_1, \beta, A \cup \{(s_1, r, s_0)\}) \end{aligned}`,
        p: r`Here $\sigma$ denotes the stack with elements $s_1, s_0$, $\beta$ is the buffer with head $b_0$, and $A$ is the accumulated set of dependency arcs. LEFT-ARC requires $s_1 \ne \text{ROOT}$.`,
      },
      {
        h: r`Unlabelled (UAS) and Labelled (LAS) Attachment Scores`,
        tex: r`\operatorname{UAS} = \frac{\sum_{i=1}^n \mathbb{I}(\hat{h}_i = h_i^*)}{n}, \quad \operatorname{LAS} = \frac{\sum_{i=1}^n \mathbb{I}(\hat{h}_i = h_i^* \land \hat{r}_i = r_i^*)}{n}`,
        p: r`UAS evaluates whether token $i$ is assigned the correct head index $h_i^*$. LAS is the stricter standard metric requiring simultaneous correctness of both the parent head $h_i^*$ and the grammatical relation label $r_i^*$.`,
      },
    ],
    keyPoints: [
      r`Dependency parsing represents syntax as directed, labelled binary relations between head words and their dependent modifiers.`,
      r`A well-formed dependency tree is a rooted, connected, acyclic directed graph where each word has in-degree exactly 1 except ROOT.`,
      r`Transition-based parsers build projective trees in linear O(n) time using a shift-reduce state machine over a stack and buffer.`,
      r`Projective trees have no crossing dependency arcs; non-projective trees require graph-based parsing algorithms or swap transitions.`,
      r`Parsing accuracy is measured by Unlabelled Attachment Score (UAS) for head accuracy and Labelled Attachment Score (LAS) for typed relation accuracy.`,
    ],
    pitfalls: [
      r`Inverting arc direction: In Universal Dependencies, arcs point from governor head to dependent modifier (head -> dependent). Reversing the direction creates an upside-down tree that fails grammatical validation.`,
      r`Assuming all sentences are projective: While English is over 99% projective, languages with flexible word order (German, Russian, Hindi, Latin) have widespread crossing arcs that cannot be parsed by standard Arc-Standard without swap actions.`,
      r`Cascading error propagation in greedy transition systems: Because transition decisions are hard and irrevocable, an early incorrect shift or reduction permanently corrupts subsequent stack states. Beam search or graph-based parsers help avoid early commitment.`,
      r`Including the ROOT token in UAS/LAS scores: Evaluation standards (such as CoNLL) explicitly exclude the artificial ROOT token (id 0) from the scoring denominator. Including it artificially inflates accuracy metrics.`,
    ],
    code: r`class ArcStandardParser:
    """
    Deterministic Arc-Standard Transition-Based Dependency Parser.
    Simulates stack, buffer, and arc transitions with an oracle policy.
    """
    def __init__(self, sentence, gold_arcs=None):
        self.words = ["ROOT"] + sentence
        self.stack = [0]
        self.buffer = list(range(1, len(self.words)))
        self.arcs = []
        self.gold_arcs = gold_arcs or []
        self.history = []

    def can_left_arc(self):
        return len(self.stack) >= 2 and self.stack[-2] != 0

    def can_right_arc(self):
        return len(self.stack) >= 2

    def can_shift(self):
        return len(self.buffer) > 0

    def shift(self):
        tok = self.buffer.pop(0)
        self.stack.append(tok)
        self.history.append(f"SHIFT -> pushed '{self.words[tok]}'")

    def left_arc(self, relation="dep"):
        s0 = self.stack[-1]
        s1 = self.stack[-2]
        self.arcs.append((s0, relation, s1))
        self.stack.pop(-2)
        self.history.append(f"LEFT-ARC ({relation}): '{self.words[s0]}' -> '{self.words[s1]}'")

    def right_arc(self, relation="dep"):
        s0 = self.stack[-1]
        s1 = self.stack[-2]
        self.arcs.append((s1, relation, s0))
        self.stack.pop(-1)
        self.history.append(f"RIGHT-ARC ({relation}): '{self.words[s1]}' -> '{self.words[s0]}'")

    def is_terminal(self):
        return len(self.buffer) == 0 and len(self.stack) == 1 and self.stack[0] == 0

    def display_tree(self):
        print("\nExtracted Dependency Arcs:")
        sorted_arcs = sorted(self.arcs, key=lambda x: x[2])
        for head, rel, dep in sorted_arcs:
            h_word = self.words[head]
            d_word = self.words[dep]
            print(f"  {d_word:<12} (id={dep}) <--[{rel}]-- {h_word:<10} (id={head})")

# Example Sentence: "The quick cat caught the mouse"
tokens = ["The", "quick", "cat", "caught", "the", "mouse"]

parser = ArcStandardParser(tokens)

# Oracle transition sequence:
parser.shift()                          # Push 'The'
parser.shift()                          # Push 'quick'
parser.shift()                          # Push 'cat'
parser.left_arc(relation="amod")        # 'cat' -> 'quick'
parser.left_arc(relation="det")         # 'cat' -> 'The'
parser.shift()                          # Push 'caught'
parser.left_arc(relation="nsubj")       # 'caught' -> 'cat'
parser.shift()                          # Push 'the'
parser.shift()                          # Push 'mouse'
parser.left_arc(relation="det")         # 'mouse' -> 'the'
parser.right_arc(relation="obj")        # 'caught' -> 'mouse'
parser.right_arc(relation="root")       # 'ROOT' -> 'caught'

print(f"Terminal state reached? {parser.is_terminal()}")
print("\nTransition History:")
for step, action in enumerate(parser.history, 1):
    print(f"  {step:2d}. {action}")

parser.display_tree()

def evaluate_scores(predicted_arcs, gold_arcs, num_words):
    pred_heads = {dep: head for head, rel, dep in predicted_arcs}
    pred_labels = {dep: rel for head, rel, dep in predicted_arcs}
    
    gold_heads = {dep: head for head, rel, dep in gold_arcs}
    gold_labels = {dep: rel for head, rel, dep in gold_arcs}
    
    uas_correct = sum(1 for i in range(1, num_words + 1) if pred_heads.get(i) == gold_heads.get(i))
    las_correct = sum(1 for i in range(1, num_words + 1) if (pred_heads.get(i) == gold_heads.get(i) and pred_labels.get(i) == gold_labels.get(i)))
    
    return uas_correct / num_words, las_correct / num_words

uas, las = evaluate_scores(parser.arcs, parser.arcs, len(tokens))
print(f"\nUAS (Unlabelled Attachment Score): {uas * 100:.1f}%")
print(f"LAS (Labelled Attachment Score):   {las * 100:.1f}%")
`,
    quiz: [
      {
        q: r`In Universal Dependencies parsing, what is the single-head structural constraint?`,
        o: [
          r`Every word in the sentence (except the artificial ROOT token) must have exactly one incoming dependency arc`,
          r`Every sentence must contain exactly one noun phrase`,
          r`A head word can never have more than one dependent modifier`,
          r`Every word must be linked directly to the ROOT token`,
        ],
        a: 0,
        why: r`In dependency grammar, every word depends on exactly one syntactic governor (in-degree d_in = 1). The only exception is the artificial ROOT token, which has in-degree 0 and serves as the structural anchor of the entire sentence.`,
      },
      {
        q: r`Why is the computational time complexity of Arc-Standard transition-based dependency parsing strictly O(n) linear with sentence length?`,
        o: [
          r`Because each of the n words is pushed onto the stack exactly once via SHIFT and removed from the stack exactly once via an ARC reduction, yielding exactly 2n total transitions`,
          r`Because it skips parsing all words that are not verbs`,
          r`Because it computes matrix inversions in constant time`,
          r`Because it converts the input string into a regular expression`,
        ],
        a: 0,
        why: r`In Arc-Standard parsing, each token in the buffer is shifted onto the stack exactly once (n shifts) and popped during a left-arc or right-arc reduction exactly once (n reductions). The total number of state transitions is bounded by 2n, proving strictly linear time complexity.`,
      },
      {
        q: r`What is the difference between Unlabelled Attachment Score (UAS) and Labelled Attachment Score (LAS)?`,
        o: [
          r`UAS measures only whether words are assigned the correct parent head, whereas LAS requires both the correct head and the correct grammatical relation label (e.g. nsubj, obj)`,
          r`UAS evaluates verbs while LAS evaluates nouns`,
          r`UAS is evaluated on training data while LAS is evaluated on test data`,
          r`UAS uses cross-entropy loss while LAS uses Mean Squared Error`,
        ],
        a: 0,
        why: r`UAS (Unlabelled Attachment Score) counts a word as correct if its assigned head matches the ground truth. LAS (Labelled Attachment Score) is a stricter metric that demands that both the head index and the specific dependency relation label match ground truth.`,
      },
    ],
    usedBy: [],
    prereq: ['part-of-speech-tagging', 'word-and-sentence-tokenization'],
    related: ['part-of-speech-tagging', 'word-and-sentence-tokenization'],
    keywords: 'dependency parsing syntax tree head dependent projective arc standard arc eager shift reduce uas las universal dependencies',
  },
  {
    id: 'named-entity-recognition-and-iob-tagging',
    short: 'NER & IOB Tagging',
    title: 'Named entity recognition and IOB tagging',
    task: 'concepts',
    module: 'Syntax',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Named Entity Recognition (NER) is the information extraction task of identifying spans of text that denote real-world entities (such as people, organisations, and locations) and classifying them into structured categories. Because named entities often span multiple consecutive tokens, NER reframes text chunking as sequence labelling using boundary schemes such as IOB2 (BIO) and BIOES, modelled through linear-chain CRFs or Transformer token classifiers.`,
    lead: r`If you ask an AI assistant to summarise a news article, it must quickly identify the key actors: Did "Apple" refer to the multinational tech titan or a piece of fruit? Was "Washington" referring to George Washington the historical figure, Washington State, or the United States federal government? Named Entity Recognition extracts these multi-word semantic entities from unstructured prose and classifies them into structured knowledge representations.`,
    intuition: [
      r`Why entity chunking requires boundary schemes: Unlike part-of-speech tagging where each word receives one isolated tag, named entities frequently span multiple words: "New York University", "Bank of England", "Marie Curie". If we only tagged words as ORG or PER, the system would not know whether two adjacent ORG tokens represent two separate organisations or one combined entity. Boundary schemes like IOB2 (Beginning, Inside, Outside) solve this by assigning B-ORG to the first token and I-ORG to continuation tokens.`,
      r`The BIOES advantage for boundary precision: The standard IOB2 scheme uses B-c for both singleton entities and the beginning of multi-word entities. BIOES (Beginning, Inside, Outside, End, Singleton) extends this by providing separate tags for single-token entities (S-c) and terminal tokens (E-c). This explicit distinction provides strong inductive bias to sequence models, preventing them from prematurely truncating long company or geographical names.`,
      r`Guardrails against illegal transitions via CRFs: When training a deep neural network (like a BiLSTM or BERT) for token classification with independent softmax outputs, the model has no built-in awareness of sequence grammar. It might predict O followed immediately by I-PER (an illegal transition). A Conditional Random Field (CRF) layer adds a global transition constraint matrix, penalising illegal boundary sequences with negative infinity and ensuring that every predicted entity path is structurally valid.`,
    ],
    analogy: r`Think of highlighting text in a study guide with coloured markers. If you highlight words individually without notes, someone reading your guide later cannot tell if "United" and "Airlines" were meant to be read together as one company or two separate terms. IOB tagging is like drawing brackets around your highlights: a green opening bracket marked B-ORG at "United", an internal green mark I-ORG at "Airlines", and a closing bracket before returning to unhighlighted text (O). Anyone reading your annotations knows the exact boundaries and identity of every entity you marked.`,
    steps: [
      {
        title: r`Tokenise text and align character span offsets`,
        desc: r`Segment raw text into tokens while preserving exact character start and end indices.`,
        detail: r`Tokenise the document into a list of words or subword tokens. Maintain character offset mappings (start_char, end_char) for each token to ground predictions back to the original text.`,
      },
      {
        title: r`Convert entity spans into IOB2 or BIOES token labels`,
        desc: r`Map gold entity span annotations into token-level boundary tags.`,
        detail: r`For each token overlapping an entity span of category c: assign B-c to the initial token, I-c to internal tokens, and O to all tokens outside entity spans. In BIOES, singletons receive S-c and final tokens receive E-c.`,
      },
      {
        title: r`Encode contextual token representations`,
        desc: r`Extract dense contextual vectors using a BiLSTM or Transformer encoder.`,
        detail: r`Pass tokenised sequences through an encoder (such as BERT or a bidirectional LSTM) to generate contextual hidden states. A linear projection maps hidden states to emission logits for each tag in the label space.`,
      },
      {
        title: r`Apply CRF transition constraints during decoding`,
        desc: r`Decode globally optimal tag sequences using Viterbi with a learned transition matrix.`,
        detail: r`A linear-chain CRF layer models transition potentials A_{i, j}. Viterbi decoding finds the highest-scoring sequence score s(X, Y), explicitly prohibiting invalid label transitions (such as O -> I-ORG).`,
      },
      {
        title: r`Reconstruct entity spans and evaluate CoNLL metrics`,
        desc: r`Parse predicted tags into entity chunks and compute strict span-level F1.`,
        detail: r`Group consecutive B-c and I-c tags into predicted entity spans. Evaluate performance against gold spans using exact span-level Precision, Recall, and F1 (CoNLL 2003 protocol), where partial boundary overlaps receive zero credit.`,
      },
    ],
    math: [
      {
        h: r`Linear-chain CRF sequence scoring function`,
        tex: r`s(X, Y) = \sum_{t=1}^T P_{t, y_t} + \sum_{t=0}^T A_{y_t, y_{t+1}}`,
        p: r`Here $P_{t, j}$ is the emission score of token $t$ for label $j$ from the neural encoder, and $A \in \mathbb{R}^{(K+2) \times (K+2)}$ is the learnable transition matrix modelling grammatical tag transitions between consecutive steps.`,
      },
      {
        h: r`Conditional sequence probability (Softmax over paths)`,
        tex: r`P(Y \mid X) = \frac{\exp(s(X, Y))}{\sum_{Y' \in \mathcal{Y}^T} \exp(s(X, Y'))}`,
        p: r`The CRF defines a normalised probability distribution over all $|\mathcal{Y}|^T$ possible label sequences. The normalisation constant (partition function $Z(X)$) is computed efficiently using the forward dynamic programming algorithm.`,
      },
      {
        h: r`Strict span-level precision, recall, and F1`,
        tex: r`\operatorname{Precision} = \frac{|\mathcal{E}_{\text{gold}} \cap \mathcal{E}_{\text{pred}}|}{|\mathcal{E}_{\text{pred}}|}, \quad \operatorname{Recall} = \frac{|\mathcal{E}_{\text{gold}} \cap \mathcal{E}_{\text{pred}}|}{|\mathcal{E}_{\text{gold}}|}, \quad F_1 = \frac{2 \cdot P \cdot R}{P + R}`,
        p: r`Here an entity span is an exact triple $(c, \text{start}, \text{end})$. Any boundary offset mismatch yields zero credit, preventing token-level outside class imbalance from distorting evaluation metrics.`,
      },
    ],
    keyPoints: [
      r`Named Entity Recognition extracts structured entities (person, organisation, location) from unstructured text and classifies them into predefined types.`,
      r`IOB2 (BIO) and BIOES schemes convert chunk boundary identification into standard discrete sequence labelling tasks.`,
      r`BIOES provides distinct tags for singleton entities (S-) and multi-token endings (E-), reducing boundary ambiguity.`,
      r`Linear-chain CRFs model label transition dynamics A_{i, j}, enforcing sequence validity and preventing illegal transitions like O -> I-PER.`,
      r`NER must be evaluated using strict span-level Precision, Recall, and F1; token-level accuracy is heavily skewed by the overwhelming prevalence of the outside (O) class.`,
    ],
    pitfalls: [
      r`Evaluating NER using token-level accuracy: Because 90% of tokens in typical prose are O, a trivial baseline predicting O everywhere achieves 90% accuracy while extracting zero entities. Always report span-level CoNLL F1.`,
      r`Allowing illegal label transitions: Independent token classifiers often produce invalid sequences like O directly followed by I-ORG. Use a CRF layer or an explicit Viterbi transition mask during inference.`,
      r`Subword tokenisation misalignment: Modern subword tokenisers split rare names into multiple fragments. Training loss must either mask non-initial subwords using an ignore index (-100) or maintain consistent subword alignment to avoid corrupting span boundaries.`,
      r`Treating nested entities as flat sequences: IOB sequence labelling fundamentally cannot represent nested structures (such as Bank of America where America is a nested location). Nested extraction requires span-based classification or generative decoders.`,
    ],
    code: r`class IOBSpanEvaluator:
    """
    Parser and strict span-level evaluator for IOB2 (BIO) sequence labelling.
    Converts token tags to entity spans and computes CoNLL precision, recall, and F1.
    """
    @staticmethod
    def extract_entities(tokens, tags):
        entities = []
        current_cat = None
        start_idx = None
        
        for idx, (tok, tag) in enumerate(zip(tokens, tags)):
            if tag == 'O':
                if current_cat is not None:
                    span_text = " ".join(tokens[start_idx:idx])
                    entities.append((current_cat, start_idx, idx - 1, span_text))
                    current_cat = None
                    start_idx = None
            elif tag.startswith('B-'):
                if current_cat is not None:
                    span_text = " ".join(tokens[start_idx:idx])
                    entities.append((current_cat, start_idx, idx - 1, span_text))
                current_cat = tag[2:]
                start_idx = idx
            elif tag.startswith('I-'):
                tag_cat = tag[2:]
                if current_cat == tag_cat:
                    continue
                else:
                    if current_cat is not None:
                        span_text = " ".join(tokens[start_idx:idx])
                        entities.append((current_cat, start_idx, idx - 1, span_text))
                    current_cat = tag_cat
                    start_idx = idx
                    
        if current_cat is not None:
            span_text = " ".join(tokens[start_idx:len(tokens)])
            entities.append((current_cat, start_idx, len(tokens) - 1, span_text))
            
        return entities

    @classmethod
    def evaluate(cls, tokens, gold_tags, pred_tags):
        gold_spans = cls.extract_entities(tokens, gold_tags)
        pred_spans = cls.extract_entities(tokens, pred_tags)
        
        gold_set = {(cat, s, e) for cat, s, e, _ in gold_spans}
        pred_set = {(cat, s, e) for cat, s, e, _ in pred_spans}
        
        true_positives = len(gold_set & pred_set)
        false_positives = len(pred_set - gold_set)
        false_negatives = len(gold_set - pred_set)
        
        prec = true_positives / len(pred_set) if len(pred_set) > 0 else 0.0
        rec = true_positives / len(gold_set) if len(gold_set) > 0 else 0.0
        f1 = (2.0 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        
        return {
            "precision": prec,
            "recall": rec,
            "f1": f1,
            "gold_entities": gold_spans,
            "pred_entities": pred_spans,
            "tp": true_positives,
            "fp": false_positives,
            "fn": false_negatives
        }

tokens = ["Alan", "Turing", "joined", "Bletchley", "Park", "in", "the", "United", "Kingdom", "."]

gold_tags = [
    "B-PER", "I-PER",
    "O",
    "B-ORG", "I-ORG",
    "O",
    "O",
    "B-LOC", "I-LOC",
    "O"
]

pred_tags = [
    "B-PER", "I-PER",
    "O",
    "B-ORG", "O",
    "O",
    "O",
    "B-LOC", "I-LOC",
    "O"
]

metrics = IOBSpanEvaluator.evaluate(tokens, gold_tags, pred_tags)

print("Named Entity Recognition Span Evaluation:")
print(f"Tokens: {' '.join(tokens)}")
print("\nGold Entities:")
for cat, s, e, text in metrics["gold_entities"]:
    print(f"  [{cat}] tokens {s}..{e}: '{text}'")

print("\nPredicted Entities:")
for cat, s, e, text in metrics["pred_entities"]:
    print(f"  [{cat}] tokens {s}..{e}: '{text}'")

print("\nStrict Evaluation Metrics (CoNLL 2003 protocol):")
print(f"  True Positives:  {metrics['tp']}")
print(f"  False Positives: {metrics['fp']} (boundary/type mismatches)")
print(f"  False Negatives: {metrics['fn']}")
print(f"  Precision:       {metrics['precision'] * 100:.1f}%")
print(f"  Recall:          {metrics['recall'] * 100:.1f}%")
print(f"  F1 Score:        {metrics['f1'] * 100:.1f}%")
`,
    quiz: [
      {
        q: r`Why is token-level accuracy an unsuitable metric for evaluating Named Entity Recognition models?`,
        o: [
          r`Because non-entity outside tokens (O) dominate the corpus (often 85-95% of all tokens), allowing a trivial model that never predicts any entities to achieve deceptively high accuracy`,
          r`Because token-level accuracy can only be computed on binary classification tasks`,
          r`Because named entity tags cannot be represented as numbers`,
          r`Because scikit-learn does not support token-level accuracy`,
        ],
        a: 0,
        why: r`Extreme class imbalance makes token accuracy misleading. Since most words in natural text are not named entities (O), a model that classifies every single word as O gets ~90% accuracy while having a true entity detection F1 score of 0%.`,
      },
      {
        q: r`In the IOB2 (BIO) tagging scheme, which of the following label transitions is grammatically invalid and should be penalised by a CRF?`,
        o: [
          r`Transitioning directly from O to I-ORG without an intervening B-ORG`,
          r`Transitioning from B-PER to I-PER`,
          r`Transitioning from I-LOC to O`,
          r`Transitioning from O to B-LOC`,
        ],
        a: 0,
        why: r`In IOB2, an inside tag (I-c) can only occur immediately after a beginning tag of the same entity category (B-c) or another inside tag of that category. Transitioning directly from O to I-ORG is an illegal orphan boundary.`,
      },
      {
        q: r`What advantage does the BIOES (BILOU) tagging scheme provide over the standard IOB2 (BIO) scheme?`,
        o: [
          r`It assigns distinct tags to single-token entities (S-) and the final tokens of multi-token entities (E-), providing explicit structural cues that improve entity boundary precision`,
          r`It reduces the total number of classes by half`,
          r`It eliminates the need for bidirectional context`,
          r`It allows the model to process unnormalised Unicode emojis`,
        ],
        a: 0,
        why: r`In standard IOB2, the tag B-c is ambiguous: it represents both single-word entities and the start of multi-word entities. BIOES uses S-c for singletons and E-c for entity endings, making entity length and boundary conditions explicit to the classifier.`,
      },
    ],
    usedBy: [],
    prereq: ['part-of-speech-tagging', 'word-and-sentence-tokenization'],
    related: ['part-of-speech-tagging', 'dependency-parsing', 'word-and-sentence-tokenization'],
    keywords: 'named entity recognition ner iob bio iob2 bioes sequence labelling information extraction conll span f1 bilstm crf token classification',
  },
  {
    "id": "conditional-random-fields",
    "short": "Conditional Random Fields (CRF)",
    "title": "Conditional Random Fields (CRF): Sequence Labelling and the Forward-Backward Algorithm",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Sequence labelling tasks (NER, POS tagging, chunking) require predicting structured sequences of discrete tags for input token sequences. Linear-chain CRFs model the conditional distribution $P(Y|X)$ globally, scoring both emission potentials (token-tag compatibility) and transition potentials (tag-tag continuity). The forward-backward dynamic programming algorithm efficiently computes sequence normalisation factors (partition function $Z(X)$) and state marginal probabilities. The Viterbi algorithm identifies the single highest-scoring global sequence in $\\mathcal{O}(T \\cdot K^2)$ time during inference.",
    "lead": "Conditional Random Fields (CRFs) are discriminative probabilistic graphical models for structured sequence labelling tasks such as Named Entity Recognition and Part-of-Speech tagging. By modelling joint transition dependencies across tag sequences rather than making independent per-token decisions, CRFs eliminate label bias and enforce globally optimal label assignments.",
    "analogy": "Imagine booking a multi-leg flight itinerary. An independent decision model would choose the cheapest flight for each individual leg, leaving you with an impossible 15-minute layover in a sprawling airport. A CRF acts like an experienced travel booking engine: it evaluates the total trip cost while strictly enforcing valid connection windows between consecutive flights.",
    "intuition": [
      "Consider tagging named entities using an IOB scheme (e.g. B-PER for beginning of a person name, I-PER for inside a person name, and O for outside). A local classifier predicting each word's tag independently might predict \"I-PER\" immediately following \"O\", which is grammatically invalid according to IOB syntax (an \"I-PER\" must follow either a \"B-PER\" or another \"I-PER\"). This vulnerability—treating interdependent sequential decisions as independent—is called the label bias problem. A Conditional Random Field solves this by scoring the entire sequence of tags simultaneously. It combines local feature emission scores (how well a word matches a tag) with a learned transition matrix (which tags can follow which). When attached as the final decoding layer of a neural network (e.g. BiLSTM-CRF or BERT-CRF), it guarantees that the decoded sequence is both globally optimal and syntactically valid."
    ],
    "steps": [
      "Extract emission representations: compute per-token feature vectors using classical n-gram features or deep neural encodings (BiLSTM or Transformer).",
      "Initialise transition matrix: define a $K \\times K$ trainable parameter matrix $A$, initialising impossible transitions (e.g. `O -> I-PER`) with large negative values.",
      "Execute forward algorithm: compute forward potentials $\\alpha_t(j)$ in log-space using `logsumexp` to evaluate partition function $Z(\\mathbf{x})$.",
      "Calculate sequence score: compute the scalar sum of gold emission scores and gold transition scores for the true target sequence.",
      "Minimise negative log-likelihood: backpropagate gradients from loss $\\mathcal{L} = \\log Z(\\mathbf{x}) - \\text{Score}(\\mathbf{x}, \\mathbf{y}^*)$ through transitions and feature encoders.",
      "Decode optimal sequence: at test time, use the Viterbi dynamic programming algorithm to retrieve the highest-scoring tag sequence $\\hat{\\mathbf{y}}$."
    ],
    "math": [
      {
        "h": "Conditional Random Fields (CRF): Sequence Labelling and the Forward-Backward Algorithm Objective Function",
        "tex": "\\mathcal{L}_{\\text{total}} = \\sum_{i=1}^N \\ell(f(x_i), y_i)",
        "p": "Optimisation objective and loss formulation for conditional random fields (crf): sequence labelling and the forward-backward algorithm."
      }
    ],
    "code": "import numpy as np\n\ndef log_sum_exp(x, axis=-1):\n    \"\"\"Numerically stable log-sum-exp trick.\"\"\"\n    max_val = np.max(x, axis=axis, keepdims=True)\n    return np.squeeze(max_val, axis=axis) + np.log(np.sum(np.exp(x - max_val), axis=axis))\n\ndef viterbi_decode(emissions, transitions):\n    \"\"\"Computes globally optimal tag sequence via Viterbi decoding.\n    \n    emissions: shape (T, K) - token-tag emission potentials\n    transitions: shape (K, K) - tag_t to tag_{t+1} transition matrix\n    \"\"\"\n    T, K = emissions.shape\n    viterbi = np.zeros((T, K))\n    backpointers = np.zeros((T, K), dtype=int)\n    \n    # Initialise t = 0\n    viterbi[0] = emissions[0]\n    \n    # Forward recursion\n    for t in range(1, T):\n        for j in range(K):\n            # Prior scores + transition to j + current emission\n            scores = viterbi[t - 1] + transitions[:, j] + emissions[t, j]\n            best_prev = np.argmax(scores)\n            viterbi[t, j] = scores[best_prev]\n            backpointers[t, j] = best_prev\n            \n    # Backtrack best path\n    best_path = [np.argmax(viterbi[-1])]\n    for t in range(T - 1, 0, -1):\n        prev = backpointers[t, best_path[-1]]\n        best_path.append(prev)\n        \n    best_path.reverse()\n    return best_path, np.max(viterbi[-1])\n\n# Simulation: Tagging a 4-token sentence with 3 tags: [0: 'O', 1: 'B-PER', 2: 'I-PER']\n# Sentence: \"Alan Turing visited London\"\ntags = ['O', 'B-PER', 'I-PER']\nT, K = 4, 3\n\n# Simulated emissions (logits from an encoder)\nemissions = np.array([\n    [0.1,  3.5,  0.2],   # \"Alan\"   -> strong B-PER\n    [0.2,  1.1,  3.0],   # \"Turing\" -> strong I-PER\n    [2.8,  0.1, -1.0],   # \"visited\"-> strong O\n    [0.5,  2.2,  0.1]    # \"London\" -> candidate B-LOC / entity\n])\n\n# Transition matrix A[i, j] representing tag i -> tag j\ntransitions = np.array([\n    [ 1.5,  1.0, -10.0],  # O -> O (good), O -> B-PER (ok), O -> I-PER (INVALID!)\n    [ 0.8, -0.5,   2.5],  # B-PER -> O (ok), B-PER -> B-PER, B-PER -> I-PER (strong)\n    [ 1.2,  0.2,   1.8]   # I-PER -> O (ok), I-PER -> B-PER, I-PER -> I-PER (ok)\n])\n\nbest_sequence, total_score = viterbi_decode(emissions, transitions)\ndecoded_tags = [tags[i] for i in best_sequence]\n\nprint(\"Viterbi Globally Decoded Sequence:\")\ntokens = [\"Alan\", \"Turing\", \"visited\", \"London\"]\nfor token, tag in zip(tokens, decoded_tags):\n    print(f\"  {token:8} -> {tag}\")\nprint(f\"Global Path Score: {total_score:.2f}\")",
    "keyPoints": [
      "CRFs model the global conditional probability of entire label sequences, eliminating local label bias in structured prediction.",
      "The forward algorithm computes the normalisation partition function $Z(\\mathbf{x})$ efficiently in $\\mathcal{O}(T \\cdot K^2)$ time.",
      "Combining neural feature encoders with CRF sequence decoding layers ensures valid entity tagging sequences in NLP pipelines."
    ],
    "pitfalls": [
      "Computing the partition function $Z(\\mathbf{x})$ directly with standard exponential sums, causing arithmetic overflow; always perform calculations in log-space using `logsumexp`.",
      "Forgetting to penalise or mask invalid transitions (e.g. padding tokens or grammatically impossible tag sequences like `O -> I-ORG`), allowing illicit tag transitions.",
      "Applying CRFs to tasks where adjacent label transitions are independent, adding quadratic computational overhead $\\mathcal{O}(K^2)$ with no performance gain."
    ],
    "quiz": [
      {
        "q": "What is the \"label bias problem\" that CRFs resolve over per-token local classifiers?",
        "o": [
          "Local classifiers make isolated decisions per token, unable to enforce valid sequential constraints or account for future context",
          "Local classifiers can only predict binary labels rather than multi-class labels",
          "Local classifiers require hand-crafted features instead of neural networks",
          "Local classifiers suffer from exploding gradients during backpropagation"
        ],
        "a": 0,
        "why": "Local classifiers normalise probabilities per token, which biases predictions toward states with fewer outgoing transitions and permits syntactically invalid sequences like `O -> I-PER`."
      },
      {
        "q": "What is the time complexity of the Viterbi algorithm for decoding a sequence of length $T$ across $K$ tag classes?",
        "o": [
          "$\\mathcal{O}(T \\cdot K)$",
          "$\\mathcal{O}(T \\cdot K^2)$",
          "$\\mathcal{O}(K^T)$",
          "$\\mathcal{O}(T^2 \\cdot K)$"
        ],
        "a": 1,
        "why": "At each of the $T$ time steps, the algorithm considers all $K$ current tags and checks transitions from all $K$ previous tags, resulting in $\\mathcal{O}(T \\cdot K^2)$ complexity."
      },
      {
        "q": "What role does the partition function $Z(\\mathbf{x})$ play in a linear-chain CRF?",
        "o": [
          "It sets the learning rate dynamically during gradient descent",
          "It normalises exponentiated sequence scores into a valid probability distribution summing to 1 across all possible paths",
          "It initialises the weights of the neural feature extractor",
          "It calculates the precision and recall of the predicted tags"
        ],
        "a": 1,
        "why": "$Z(\\mathbf{x})$ sums the potentials over all possible label sequences, acting as the global normalisation constant so $P(\\mathbf{y}|\\mathbf{x})$ sums to 1."
      }
    ],
    "related": [
      "decision_tree_classifier",
      "logistic_regression"
    ],
    "keywords": "conditional random fields, conditional random fields (crf): sequence labelling and the forward-backward algorithm, natural language processing, deep learning"
  },
  {
    id: 'distributional-semantics',
    short: 'Distributional Semantics',
    title: 'Distributional semantics',
    task: 'concepts',
    module: 'Meaning',
    level: 2,
    minutes: 15,
    noLab: true,
    summary: r`Distributional semantics is the theoretical and computational foundation of modern lexical representation. Rooted in J.R. Firth's famous 1957 maxim—"You shall know a word by the company it keeps"—the distributional hypothesis posits that words occurring in similar linguistic contexts possess similar semantic meanings. By counting word co-occurrences in sliding symmetric windows, applying statistical association metrics like Positive Pointwise Mutual Information (PPMI), and evaluating geometric distance via cosine similarity, distributional models transform discrete linguistic tokens into continuous vector spaces.`,
    lead: r`If you encounter an invented English word like "roozle" in the sentences "She poured a chilled glass of fresh roozle", "He sliced the ripe roozle into quarters", and "The tart citrus scent of roozle filled the kitchen", you immediately deduce what it is: a citrus fruit. You did not look it up in a dictionary; you inferred its semantic meaning purely from the surrounding context words ("glass", "poured", "sliced", "ripe", "citrus"). Distributional semantics formalises this human intuition into computational linear algebra.`,
    intuition: [
      r`The Distributional Hypothesis and contextual substitutability: Formalised by Zellig Harris and J.R. Firth in the 1950s, the distributional hypothesis states that the degree of semantic similarity between two words is an empirical function of the similarity of their contextual distributions. Words with high contextual overlap (such as "doctor" and "physician", or "cat" and "kitten") can frequently be substituted into the same sentence frames without violating grammatical or semantic validity.`,
      r`From raw co-occurrence counts to statistical information: Counting raw co-occurrences in a text corpus introduces massive frequency distortion. High-frequency function words like "the", "of", and "is" appear adjacent to almost every word, dominating raw counts without conveying specific semantic information. Pointwise Mutual Information (PMI) resolves this by measuring the ratio between the observed joint probability of two words and their independent probability under random chance.`,
      r`Geometric spaces and cosine similarity: When words are projected as vectors in a high-dimensional vocabulary space, semantic relatedness corresponds to spatial proximity. Rather than measuring Euclidean distance—which is heavily biased by absolute word frequency—distributional models measure the cosine of the angle between vectors. Normalising by Euclidean length ensures that frequent words and rare synonyms align in identical directional rays.`,
    ],
    analogy: r`Think of profiling people based on their social circles. If you want to know who someone is, you do not need to interrogate their inner psyche; you simply observe who they spend time with. If Alice spends her weekends rock-climbing with mountaineers, talking about carabiners and ropes, and Bob spends his weekends at the exact same climbing gym with the exact same people discussing harnesses and chalk, you can confidently conclude that Alice and Bob share a passion for rock climbing, even if Alice and Bob have never personally met. Distributional semantics profiles words by their textual companions: words that hang out with the same linguistic friends share the same underlying meaning.`,
    steps: [
      {
        title: r`Define sliding symmetric context windows`,
        desc: r`Establish a target token and collect adjacent context words within radius w.`,
        detail: r`Scan the corpus sentence by sentence. For each target word w_i, extract all context words c within a symmetric window of radius w (e.g. w = 4 tokens to the left and right).`,
      },
      {
        title: r`Construct sparse co-occurrence matrix`,
        desc: r`Count occurrences of target-context word pairs across the entire text collection.`,
        detail: r`Build a matrix C of size |V| x |V|, where C_{i, j} records how many times target word w_i appeared within the context window of context word c_j. Apply distance-weighted discounting (e.g. 1/d where d is distance) to give closer neighbours higher weight.`,
      },
      {
        title: r`Calculate Pointwise Mutual Information (PMI)`,
        desc: r`Quantify statistical association above chance expectation for each co-occurrence pair.`,
        detail: r`Compute marginal probabilities P(w) and P(c) alongside joint probability P(w, c). Calculate PMI(w, c) = log2(P(w, c) / (P(w) * P(c))). Highly correlated pairs receive large positive scores; independent pairs score near zero.`,
      },
      {
        title: r`Apply Positive PMI (PPMI) thresholding`,
        desc: r`Truncate negative PMI values to zero to prevent uninformative sampling noise.`,
        detail: r`Negative PMI values correspond to word pairs that co-occur less often than random chance, which is notoriously unreliable on finite text corpora. Truncate with PPMI(w, c) = max(0, PMI(w, c)) to retain only positive semantic associations.`,
      },
      {
        title: r`Compute vector similarity across vocabulary terms`,
        desc: r`Measure semantic relatedness using length-normalised cosine similarity.`,
        detail: r`Represent each word as its PPMI row vector. For any query word, compute cosine similarity against all other vocabulary vectors to retrieve the nearest semantic neighbours.`,
      },
    ],
    math: [
      {
        h: r`Pointwise Mutual Information (PMI)`,
        tex: r`\operatorname{PMI}(w, c) = \log_2 \frac{P(w, c)}{P(w) P(c)} = \log_2 \frac{C(w, c) \cdot N}{\sum_{c'} C(w, c') \cdot \sum_{w'} C(w', c)}`,
        p: r`Here $C(w, c)$ is the co-occurrence count of target $w$ and context $c$, and $N = \sum_{w, c} C(w, c)$ is the total sum of all co-occurrences in the corpus. If $w$ and $c$ are completely independent, $P(w, c) = P(w)P(c)$ and $\operatorname{PMI} = 0$.`,
      },
      {
        h: r`Positive Pointwise Mutual Information (PPMI)`,
        tex: r`\operatorname{PPMI}(w, c) = \max \left( 0, \, \operatorname{PMI}(w, c) \right)`,
        p: r`Because negative PMI values are dominated by statistical noise on rare words with insufficient observation counts, PPMI clamps all negative values to zero, producing a non-negative sparse representation.`,
      },
      {
        h: r`Directional cosine similarity in vector space`,
        tex: r`\cos(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2} = \frac{\sum_{i=1}^d u_i v_i}{\sqrt{\sum_{i=1}^d u_i^2} \sqrt{\sum_{i=1}^d v_i^2}}`,
        p: r`Cosine similarity measures the angular alignment between two word vectors on the unit hypersphere, decoupling semantic orientation from raw term frequency magnitude.`,
      },
    ],
    keyPoints: [
      r`The distributional hypothesis asserts that words occurring in similar textual contexts possess similar semantic meanings.`,
      r`Raw co-occurrence counts are heavily distorted by ubiquitous function words; Pointwise Mutual Information (PMI) normalises against random expectation.`,
      r`Positive PMI (PPMI) clips uninformative negative associations to zero, yielding robust non-negative semantic vectors.`,
      r`Cosine similarity measures semantic proximity as angular alignment, preventing document length or word frequency from skewing comparisons.`,
      r`While PPMI matrices capture rich lexical meaning, their extreme sparsity and high dimensionality (|V| x |V|) motivate dense dimensionality reduction techniques.`,
    ],
    pitfalls: [
      r`Rare-word bias in raw PMI: Very rare words that happen to co-occur once receive artificially gigantic PMI scores because P(w) and P(c) in the denominator are minuscule. Mitigate using smoothed context marginal distributions: P_alpha(c) proportional to P(c)^0.75.`,
      r`Selecting inappropriate context window sizes: Small context windows (w = 1 to 2) capture tight syntactic relations (adjective-noun, verb-object); large context windows (w = 8 to 15) capture broad topical/domain associations. Choose window size deliberately based on task.`,
      r`Conflating antonyms with non-synonyms: Because antonyms like "hot" and "cold" or "large" and "small" share almost identical contexts, distributional models score them with high cosine similarity. Distributional similarity reflects relatedness, not necessarily identical polarity.`,
      r`Extreme memory consumption on raw matrices: A vocabulary of 100,000 words produces a 100,000 x 100,000 matrix with 10 billion cells. Always store co-occurrence counts using sparse matrix formats (such as CSR).`,
    ],
    code: r`import math
import re
from collections import defaultdict, Counter

class DistributionalSemantics:
    """
    Co-occurrence matrix builder and PPMI calculator
    for distributional word vectors and cosine similarity.
    """
    def __init__(self, window_size=2):
        self.window_size = window_size
        self.vocab = set()
        self.cooccur = defaultdict(Counter)
        self.word_counts = Counter()
        self.total_pairs = 0
        self.ppmi_vectors = defaultdict(dict)

    def _tokenize(self, text):
        return [w.lower() for w in re.findall(r'\b[a-zA-Z]+\b', text)]

    def fit(self, corpus):
        # Count co-occurrences in sliding symmetric window
        for sentence in corpus:
            tokens = self._tokenize(sentence)
            for i, target in enumerate(tokens):
                self.vocab.add(target)
                self.word_counts[target] += 1
                
                start = max(0, i - self.window_size)
                end = min(len(tokens), i + self.window_size + 1)
                
                for j in range(start, end):
                    if i != j:
                        ctx = tokens[j]
                        self.cooccur[target][ctx] += 1
                        self.total_pairs += 1
                        
        self._compute_ppmi()

    def _compute_ppmi(self):
        # Marginal context sums
        context_totals = Counter()
        for target, contexts in self.cooccur.items():
            for ctx, count in contexts.items():
                context_totals[ctx] += count

        N = self.total_pairs
        for target, contexts in self.cooccur.items():
            target_total = sum(contexts.values())
            for ctx, count in contexts.items():
                # Joint and independent probabilities
                p_wc = count / N
                p_w = target_total / N
                p_c = context_totals[ctx] / N
                
                pmi = math.log2(p_wc / (p_w * p_c))
                ppmi = max(0.0, pmi)
                if ppmi > 0.0:
                    self.ppmi_vectors[target][ctx] = ppmi

    def cosine_similarity(self, word1, word2):
        v1 = self.ppmi_vectors.get(word1.lower(), {})
        v2 = self.ppmi_vectors.get(word2.lower(), {})
        
        if not v1 or not v2:
            return 0.0
            
        # Sparse dot product
        common_keys = set(v1.keys()) & set(v2.keys())
        dot = sum(v1[k] * v2[k] for k in common_keys)
        
        norm1 = math.sqrt(sum(val ** 2 for val in v1.values()))
        norm2 = math.sqrt(sum(val ** 2 for val in v2.values()))
        
        if norm1 == 0.0 or norm2 == 0.0:
            return 0.0
            
        return dot / (norm1 * norm2)

# Training corpus with distinct semantic domains (drinks vs animals)
corpus = [
    "She poured a chilled glass of fresh orange juice into the cup",
    "He drank a hot mug of black tea and sweet coffee in the morning",
    "Cold juice and warm tea are delicious refreshing drinks",
    "The domestic cat chased the small brown mouse across the garden",
    "A hungry dog barked at the swift cat near the wooden fence",
    "The lively puppy played with the clever dog in the backyard"
]

model = DistributionalSemantics(window_size=2)
model.fit(corpus)

print(f"Vocabulary size: {len(model.vocab)} words")
print(f"Total co-occurrence events: {model.total_pairs}")

pairs = [
    ("juice", "tea"),     # High semantic similarity (drinks)
    ("cat", "dog"),       # High semantic similarity (pets)
    ("juice", "dog"),     # Unrelated (drink vs pet)
    ("coffee", "tea")     # High semantic similarity (beverages)
]

print("\nDistributional Cosine Similarities (PPMI):")
for w1, w2 in pairs:
    sim = model.cosine_similarity(w1, w2)
    print(f"  Similarity('{w1}', '{w2}'): {sim:.4f}")
`,
    quiz: [
      {
        q: r`What is the foundational premise of the Distributional Hypothesis formulated by J.R. Firth and Zellig Harris?`,
        o: [
          r`Words that occur in similar linguistic contexts possess similar semantic meanings`,
          r`Every word in a language can be mapped to an integer ASCII code`,
          r`Grammar rules must be manually hand-crafted by lexicographers`,
          r`Word meaning is entirely independent of neighbouring tokens`,
        ],
        a: 0,
        why: r`Firth's principle—"You shall know a word by the company it keeps"—establishes that contextual co-occurrence distributions reflect underlying lexical meaning, allowing models to learn semantic representations from raw text.`,
      },
      {
        q: r`Why is Positive Pointwise Mutual Information (PPMI) preferred over raw Pointwise Mutual Information (PMI)?`,
        o: [
          r`Because negative PMI values are dominated by statistical sampling noise on rare words that co-occur less than random chance on finite text corpora`,
          r`Because computers cannot compute negative numbers`,
          r`Because PPMI doubles the vocabulary size`,
          r`Because raw PMI requires quadratic memory while PPMI requires linear memory`,
        ],
        a: 0,
        why: r`Negative PMI arises when two words co-occur less frequently than expected under independence. On finite corpora, this often reflects lack of data rather than genuine semantic repulsion. Truncating negative values to zero produces a clean, stable representation.`,
      },
      {
        q: r`Why does cosine similarity measure semantic relatedness more reliably than Euclidean distance between raw frequency vectors?`,
        o: [
          r`Cosine similarity normalises by vector length, ensuring that frequent words and rare synonyms pointing in the same direction are judged as highly similar despite disparate frequency magnitudes`,
          r`Cosine similarity converts all negative vectors into positive scalars`,
          r`Cosine similarity works only on square matrices`,
          r`Euclidean distance can only be computed in two dimensions`,
        ],
        a: 0,
        why: r`A frequent word like "car" might appear 10,000 times while its synonym "automobile" appears 50 times. Their Euclidean distance is huge due to frequency scale differences. Cosine similarity evaluates the angle between vectors, measuring contextual distribution shape rather than absolute volume.`,
      },
    ],
    usedBy: [],
    prereq: ['bag-of-words-and-tf-idf', 'stop-words-and-n-grams'],
    related: ['bag-of-words-and-tf-idf', 'stop-words-and-n-grams', 'word-and-sentence-tokenization'],
    keywords: 'distributional semantics firth harris ppmi pmi pointwise mutual information co-occurrence matrix cosine similarity vector space model embeddings',
  },
  {
    id: 'lsa-and-svd-for-text',
    short: 'LSA & SVD for Text',
    title: 'LSA and SVD for text',
    task: 'concepts',
    module: 'Meaning',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Latent Semantic Analysis (LSA), also known as Latent Semantic Indexing (LSI) in information retrieval, applies Truncated Singular Value Decomposition (SVD) to high-dimensional term-document or term-term matrices. By decomposing a sparse matrix into orthonormal singular vectors and singular values, LSA projects words and documents into a low-dimensional continuous latent semantic space. This rank reduction discovers hidden semantic topics, resolves synonymy by mapping distinct surface words to common latent dimensions, and mitigates the curse of dimensionality.`,
    lead: r`Search for "physician" in a traditional keyword search engine, and you will miss every document that exclusively uses the word "doctor". Lexical matching fails because human language is plagued by synonymy (different words describing the exact same concept) and polysemy (one word possessing multiple meanings). Latent Semantic Analysis solves this by decomposing term-document matrices: it discovers the latent conceptual axes connecting vocabulary words, enabling documents to match search queries even when they share zero exact keywords.`,
    intuition: [
      r`The curse of sparse lexical matrices: In standard Bag of Words and TF-IDF representations, each word corresponds to an orthogonal basis axis. If a vocabulary contains 50,000 words, every document is a 50,000-dimensional vector. Because orthogonal vectors have zero dot product, "canine" and "dog" are mathematically as unrelated as "canine" and "refrigerator". We need a mathematical lens that compresses orthogonal lexical dimensions into dense semantic concepts.`,
      r`Singular Value Decomposition as latent concept discovery: SVD factorises any rectangular matrix X into three constituent matrices: X = U * Sigma * V^T. The left singular vectors U define term loadings across latent concepts; the diagonal singular values Sigma rank the semantic importance and variance of each concept; and the right singular vectors V represent document coordinates along those same conceptual axes.`,
      r`Low-rank truncation and noise filtering: The Eckart-Young-Mirsky theorem proves that keeping only the top k largest singular values produces the best possible rank-k approximation of the original matrix under Frobenius and spectral norms. Truncating to k dimensions (typically k = 100 to 300) discards idiosyncrasies and lexical noise, preserving global semantic correlations and merging synonymous words into shared topic coordinates.`,
    ],
    analogy: r`Imagine you are an astronomer mapping a distant star cluster. You have raw observations tracking the positions of 100,000 individual twinkling stars. When you plot them directly, the data is an overwhelming, noisy cloud of coordinates. SVD is like discovering the primary gravitational axes of rotation for the entire galaxy: instead of tracking 100,000 independent stars, you discover that 95% of their motion is governed by just three primary elliptical gravitational planes. By describing each star by its position along these three core planes (low-rank latent space), you filter out astronomical telescope jitter and immediately see the underlying spiral structure of the galaxy.`,
    steps: [
      {
        title: r`Construct term-document matrix with TF-IDF weighting`,
        desc: r`Build vocabulary matrix X of dimensions |V| x D and apply TF-IDF scaling.`,
        detail: r`Tokenise all D documents and construct matrix X of shape |V| x D. Weight cells using TF-IDF or PPMI rather than raw frequencies to prevent ubiquitous terms from dominating variance.`,
      },
      {
        title: r`Compute Singular Value Decomposition (SVD)`,
        desc: r`Factorise the term-document matrix into left singular vectors, singular values, and right singular vectors.`,
        detail: r`Decompose matrix X into U * Sigma * V^T, where U (|V| x |V|) and V (D x D) have orthonormal columns, and Sigma is a diagonal matrix of non-negative singular values sorted in descending order.`,
      },
      {
        title: r`Truncate decomposition to top k latent dimensions`,
        desc: r`Discard small singular values to produce optimal rank-k low-dimensional approximation.`,
        detail: r`Select truncation rank k (typically k in [100, 300]). Retain the top k columns of U (U_k of shape |V| x k), the top k x k block of Sigma (Sigma_k), and the top k columns of V (V_k of shape D x k).`,
      },
      {
        title: r`Derive dense term and document embeddings`,
        desc: r`Scale singular vectors by singular values to produce dense vector representations.`,
        detail: r`Term embeddings in latent semantic space are given by U_k * Sigma_k (or simply U_k). Document embeddings are given by V_k * Sigma_k. Dense vectors compress sparse word dimensions into continuous semantic coordinates.`,
      },
      {
        title: r`Project novel queries into latent space for semantic retrieval`,
        desc: r`Fold unseen query vectors into the k-dimensional latent coordinate frame.`,
        detail: r`For a new query vector q of length |V|, project it into latent space via q_k = Sigma_k^{-1} * U_k^T * q. Rank documents by calculating cosine similarity between q_k and document vectors in V_k.`,
      },
    ],
    math: [
      {
        h: r`Singular Value Decomposition (SVD) matrix factorisation`,
        tex: r`X = U \Sigma V^T`,
        p: r`Here $X \in \mathbb{R}^{m \times n}$ is the term-document matrix ($m = |V|, n = D$), $U \in \mathbb{R}^{m \times m}$ contains orthonormal eigenvectors of $X X^T$, $V \in \mathbb{R}^{n \times n}$ contains orthonormal eigenvectors of $X^T X$, and $\Sigma \in \mathbb{R}^{m \times n}$ contains square roots of non-zero eigenvalues (singular values $\sigma_1 \ge \sigma_2 \ge \dots \ge 0$).`,
      },
      {
        h: r`Optimal low-rank approximation (Eckart-Young-Mirsky Theorem)`,
        tex: r`X_k = U_k \Sigma_k V_k^T = \arg\min_{\operatorname{rank}(A) \le k} \|X - A\|_F`,
        p: r`Keeping the top $k$ singular values minimises the reconstruction error under the Frobenius norm $\|X - X_k\|_F = \sqrt{\sum_{i=k+1}^{\min(m, n)} \sigma_i^2}$, retaining maximal variance while discarding noise.`,
      },
      {
        h: r`Query folding into latent semantic space`,
        tex: r`\mathbf{q}_k = \Sigma_k^{-1} U_k^T \mathbf{q}`,
        p: r`A new sparse query vector $\mathbf{q} \in \mathbb{R}^{|V|}$ is projected into the $k$-dimensional latent space by multiplying by $U_k^T$ and scaling by inverse singular values $\Sigma_k^{-1}$, allowing direct cosine comparison against precomputed document rows in $V_k$.`,
      },
    ],
    keyPoints: [
      r`Latent Semantic Analysis applies truncated SVD to compress sparse term-document matrices into low-dimensional semantic representations.`,
      r`The Eckart-Young-Mirsky theorem guarantees that truncated SVD provides the mathematically optimal rank-k approximation under Frobenius and spectral norms.`,
      r`LSA resolves synonymy: words with similar co-occurrence patterns map to shared coordinates along latent semantic axes.`,
      r`Unseen queries are projected into the latent space via the fold-in equation q_k = Sigma_k^{-1} * U_k^T * q.`,
      r`A core limitation of LSA is polysemy: each word receives a single linear vector that conflates disparate meanings (e.g. "bank" financial vs riverbank).`,
    ],
    pitfalls: [
      r`Applying SVD to raw unweighted term counts: Raw word counts cause high-frequency stop words to dominate the primary singular vectors. Always weight matrices with TF-IDF or PPMI prior to SVD.`,
      r`Full SVD computation on large vocabularies: Computing complete SVD takes O(min(m^2 n, m n^2)) time, which fails on millions of documents. Use randomized truncated SVD or iterative Krylov methods (such as Lanczos).`,
      r`Choosing truncation rank k incorrectly: Setting k too small (e.g. k = 5) discards vital distinguishing topics; setting k too large (e.g. k = 5,000) retains noisy, ungeneralisable lexical variations. Optimal k typically falls between 100 and 300.`,
      r`Interpretability challenges: Unlike non-negative matrix factorisation (NMF) or LDA where topics are strictly positive word probability distributions, SVD produces signed real numbers with arbitrary polarities that can be hard to interpret.`,
    ],
    code: r`import numpy as np
import re
from collections import Counter

class LatentSemanticAnalysis:
    """
    Self-contained Latent Semantic Analysis (LSA) implementation
    using TF-IDF term-document weighting and truncated SVD.
    """
    def __init__(self, k_components=2):
        self.k = k_components
        self.vocab = []
        self.word2idx = {}
        self.U_k = None
        self.Sigma_k = None
        self.V_k = None
        self.doc_embeddings = None

    def _tokenize(self, text):
        return [w.lower() for w in re.findall(r'\b[a-zA-Z]+\b', text)]

    def fit(self, corpus):
        # 1. Build vocabulary
        doc_tokens = [self._tokenize(doc) for doc in corpus]
        all_words = sorted(list(set(w for tokens in doc_tokens for w in tokens)))
        self.vocab = all_words
        self.word2idx = {w: i for i, w in enumerate(self.vocab)}
        
        V = len(self.vocab)
        D = len(corpus)
        
        # 2. Build TF-IDF Term-Document Matrix (V x D)
        X = np.zeros((V, D), dtype=float)
        
        # Compute Document Frequencies
        df = Counter()
        for tokens in doc_tokens:
            unique_in_doc = set(tokens)
            for w in unique_in_doc:
                df[w] += 1
                
        # Fill TF-IDF values
        for d, tokens in enumerate(doc_tokens):
            tf = Counter(tokens)
            for w, count in tf.items():
                row = self.word2idx[w]
                # Log-normalized TF * Smooth IDF
                tf_val = 1.0 + np.log(count)
                idf_val = np.log((D + 1.0) / (df[w] + 1.0)) + 1.0
                X[row, d] = tf_val * idf_val
                
        # 3. Truncated SVD via full SVD
        # X = U * Sigma * V^T
        U, s, Vt = np.linalg.svd(X, full_matrices=False)
        
        # Keep top k components
        self.U_k = U[:, :self.k]             # (V x k)
        self.Sigma_k = np.diag(s[:self.k])   # (k x k)
        self.V_k = Vt[:self.k, :].T          # (D x k)
        
        # Latent document coordinates
        self.doc_embeddings = self.V_k * s[:self.k]
        
    def transform_query(self, query):
        """Fold new query into k-dimensional latent space."""
        tokens = self._tokenize(query)
        q_vec = np.zeros(len(self.vocab), dtype=float)
        for w in tokens:
            if w in self.word2idx:
                q_vec[self.word2idx[w]] += 1.0
                
        # q_k = Sigma_k^{-1} * U_k^T * q
        inv_sigma = np.linalg.inv(self.Sigma_k)
        q_k = inv_sigma @ (self.U_k.T @ q_vec)
        return q_k

    def rank_documents(self, query):
        q_k = self.transform_query(query)
        q_norm = np.linalg.norm(q_k)
        if q_norm == 0.0:
            return [(d, 0.0) for d in range(len(self.doc_embeddings))]
            
        scores = []
        for d_idx, d_vec in enumerate(self.doc_embeddings):
            d_norm = np.linalg.norm(d_vec)
            cos_sim = np.dot(q_k, d_vec) / (q_norm * d_norm) if d_norm > 0 else 0.0
            scores.append((d_idx, float(cos_sim)))
            
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores

# Sample corpus: Machine learning vs Planetary astronomy
documents = [
    "Machine learning neural networks optimize loss functions with gradient descent.",
    "Deep learning models recognize computer vision patterns and speech sequences.",
    "Supervised learning algorithms predict continuous targets from labeled training sets.",
    "Jupiter is a giant gas planet orbited by dozens of icy moons.",
    "Mars has a thin atmosphere and robotic rovers exploring planetary craters.",
    "Saturn possesses prominent planetary rings composed of water ice and cosmic dust."
]

lsa = LatentSemanticAnalysis(k_components=2)
lsa.fit(documents)

print(f"Matrix shape: {len(lsa.vocab)} terms x {len(documents)} documents")
print(f"Truncated rank k: {lsa.k} latent dimensions")
print(f"Top 2 singular values: {np.diag(lsa.Sigma_k)}")

test_query = "planetary astronomy spacecraft"
print(f"\nQuery: '{test_query}' (notice: words 'astronomy' and 'spacecraft' are out of vocabulary!)")
rankings = lsa.rank_documents(test_query)
for rank, (doc_idx, score) in enumerate(rankings[:3], 1):
    print(f"  {rank}. [Similarity: {score:+.4f}] Doc {doc_idx}: '{documents[doc_idx]}'")
`,
    quiz: [
      {
        q: r`According to the Eckart-Young-Mirsky theorem, what property does truncated SVD guarantee for a matrix X?`,
        o: [
          r`It provides the mathematically optimal low-rank approximation of rank k under both Frobenius and spectral matrix norms`,
          r`It guarantees that all negative matrix entries are converted into positive numbers`,
          r`It guarantees that the resulting matrix is strictly upper triangular`,
          r`It eliminates all non-zero singular values`,
        ],
        a: 0,
        why: r`The Eckart-Young-Mirsky theorem proves that the rank-k matrix reconstructed by keeping the top k singular values achieves the minimum possible reconstruction error ||X - X_k|| under both Frobenius and operator norms.`,
      },
      {
        q: r`How does Latent Semantic Analysis address the problem of synonymy in information retrieval?`,
        o: [
          r`By projecting words with similar contextual co-occurrence patterns into overlapping coordinates along dense latent semantic axes`,
          r`By replacing every word with its literal dictionary definition`,
          r`By forcing all words with the same prefix to have identical spellings`,
          r`By clustering documents using Euclidean k-means`,
        ],
        a: 0,
        why: r`Synonyms like "physician" and "doctor" co-occur with similar context words ("hospital", "patient", "cure"). SVD combines these co-occurrence correlations into shared latent singular vectors, giving synonyms similar continuous representations.`,
      },
      {
        q: r`What is a major limitation of LSA when representing polysemous words (words with multiple distinct meanings)?`,
        o: [
          r`It assigns each surface word a single linear vector that averages across all its distinct senses, conflating disparate meanings into a single blended coordinate`,
          r`It cannot process words that appear more than ten times`,
          r`It requires all sentences to have identical character lengths`,
          r`It causes the singular values to become complex imaginary numbers`,
        ],
        a: 0,
        why: r`Because LSA assigns one static vector per vocabulary word, a word like "bank" has its financial sense and riverbank sense conflated into a single compromised vector positioned between financial and geographical concept clusters.`,
      },
    ],
    usedBy: [],
    prereq: ['distributional-semantics', 'bag-of-words-and-tf-idf'],
    related: ['distributional-semantics', 'bag-of-words-and-tf-idf', 'pca'],
    keywords: 'lsa latent semantic analysis lsi svd singular value decomposition eckart young mirsky truncated svd tf idf dimensional reduction synonymy polysemy',
  },
  {
    id: 'glove-and-fasttext',
    short: 'GloVe & FastText',
    title: 'GloVe and FastText',
    task: 'concepts',
    module: 'Meaning',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`GloVe (Global Vectors for Word Representation) and FastText are the two dominant pre-neural and subword static embedding architectures in NLP. GloVe bridges the divide between global matrix factorisation (LSA) and local context window models (Word2Vec) by fitting log-bilinear word vectors directly to global co-occurrence probability ratios. FastText enriches word representations with character n-gram subwords, enabling robust handling of morphologically rich languages, rare vocabulary inflections, and out-of-vocabulary (OOV) tokens.`,
    lead: r`Word2Vec revolutionized NLP by training shallow neural networks on sliding windows, but it suffered from two key limitations: it discarded global corpus statistics by processing individual context windows greedily, and it treated words as atomic, indivisible symbols. If a test document contained a slight spelling variation or rare morphological compound like "unquestionably", Word2Vec threw up its hands and returned an unknown token. GloVe solved the global statistical aggregation problem; FastText solved the subword morphology and out-of-vocabulary dilemma.`,
    intuition: [
      r`Ratios of co-occurrence probabilities encode relational meaning: Pennington, Socher, and Manning observed that semantic meaning is best captured not by raw co-occurrence counts, but by ratios of co-occurrence probabilities. Consider the target words "ice" and "steam" probed against context word k: for k = "solid", P(solid | ice) / P(solid | steam) is large; for k = "gas", the ratio is tiny; for k = "water" or k = "fashion", the ratio is near 1. Vector differences (w_ice - w_steam) dot-producted with w_k naturally model this log-probability ratio.`,
      r`Weighted least squares and the dampening function: In a massive text corpus, co-occurrence counts range from 1 to millions. If all co-occurrences were weighted equally, frequent stop words ("the", "of") would dominate the loss function, while rare pairs would drown in noise. GloVe introduces a soft weighting function f(X_ij) = min(1, (X_ij / x_max)^0.75) that prevents stop words from dominating while avoiding over-weighting rare occurrences.`,
      r`FastText and the power of subword morphology: In languages like German ("Donaudampfschiffahrtsgesellschaftskapitän"), Turkish, or Russian, words are built from rich agglutinative morphemes. FastText represents each word as the sum of its character n-grams bounded by special boundary symbols "<" and ">" (e.g. for "where" with n = 3: "<wh", "whe", "her", "ere", "re>"). When an unknown word is encountered at inference time, FastText simply sums the representations of its constituent subwords, yielding an accurate semantic embedding out of the box.`,
    ],
    analogy: r`Think of learning vocabulary like cooking. Word2Vec and GloVe treat every dish as an indivisible monolithic mystery: "beef stew" is a completely distinct entity from "lamb stew" or "stewed carrots". If someone orders "elk stew", the restaurant says "I have never heard of that dish; I cannot cook it" (out of vocabulary). FastText looks inside the recipe at the elemental ingredients: it knows what "elk" means as meat, and it knows the cooking technique of "stew". By assembling the subword ingredients, it can prepare and understand "elk stew" flawlessly even if it has never appeared on the menu before.`,
    steps: [
      {
        title: r`Aggregate global co-occurrence statistics`,
        desc: r`Construct the full vocabulary co-occurrence matrix X_ij from the entire corpus.`,
        detail: r`Scan the text corpus with a symmetric context window (typically radius 10 with harmonic 1/d decay). Accumulate counts in a global sparse co-occurrence matrix X, where X_ij is the total co-occurrence count of word i and context j.`,
      },
      {
        title: r`Apply GloVe weighted least squares optimisation`,
        desc: r`Train word vectors w_i and context vectors w_j to predict log co-occurrences.`,
        detail: r`Minimise the objective J = sum_{i, j} f(X_ij) * (w_i^T * w_j + b_i + b_j - ln(X_ij))^2 using AdaGrad. The weighting function f(X_ij) dampens frequent pairs using exponent alpha = 0.75 with ceiling x_max = 100.`,
      },
      {
        title: r`Sum word and context vectors for GloVe embeddings`,
        desc: r`Combine target and context representations to produce balanced final vectors.`,
        detail: r`Because the co-occurrence matrix is symmetric (X_ij = X_ji), w and w_tilde are identical in expectation. Summing w_i + w_tilde_i yields the final d-dimensional GloVe word embedding with reduced variance.`,
      },
      {
        title: r`Extract character n-grams for FastText representations`,
        desc: r`Decompose each vocabulary word into boundary-bracketed character n-grams.`,
        detail: r`Pad words with angle brackets '<' and '>'. Extract all character n-grams of length n in [3, 6] alongside the special whole-word token. Map n-grams to embedding rows using Fowler-Noll-Vo hash functions.`,
      },
      {
        title: r`Compose word embeddings via subword summation`,
        desc: r`Compute representations for known and out-of-vocabulary words by summing subword vectors.`,
        detail: r`Represent any input word w as the vector sum v_w = sum_{g in G_w} z_g over all its constituent character n-grams. For unseen tokens, decompose into subwords and sum existing hash embeddings to achieve zero OOV rate.`,
      },
    ],
    math: [
      {
        h: r`GloVe log-bilinear objective function`,
        tex: r`J = \sum_{i=1}^V \sum_{j=1}^V f(X_{i, j}) \left( \mathbf{w}_i^T \tilde{\mathbf{w}}_j + b_i + \tilde{b}_j - \ln X_{i, j} \right)^2`,
        p: r`Here $\mathbf{w}_i, \tilde{\mathbf{w}}_j \in \mathbb{R}^d$ are word and context vectors, $b_i, \tilde{b}_j$ are scalar biases, and $X_{i, j}$ is the co-occurrence count between word $i$ and word $j$. The model fits inner products directly to the logarithm of co-occurrence probabilities.`,
      },
      {
        h: r`GloVe co-occurrence weighting function`,
        tex: r`f(x) = \begin{cases} \left( \frac{x}{x_{\max}} \right)^\alpha & \text{if } x < x_{\max} \\ 1 & \text{otherwise} \end{cases}`,
        p: r`Hyperparameters are typically set to $\alpha = 0.75$ and $x_{\max} = 100$. The fractional power dampens high-frequency co-occurrences while ensuring non-zero gradients on rare co-occurrences.`,
      },
      {
        h: r`FastText subword vector composition`,
        tex: r`\mathbf{v}_w = \sum_{g \in \mathcal{G}_w} \mathbf{z}_g`,
        p: r`Here $\mathcal{G}_w$ is the set of character $n$-grams present in word $w$ (including the whole word symbol $\langle w \rangle$), and $\mathbf{z}_g \in \mathbb{R}^d$ is the learned embedding for subword $g$. This additive formulation naturally produces embeddings for novel out-of-vocabulary words.`,
      },
    ],
    keyPoints: [
      r`GloVe fits a log-bilinear model to global co-occurrence probability ratios, uniting global matrix factorisation with local window methods.`,
      r`GloVe uses a sublinear weighting function f(X_ij) = (X_ij / x_max)^0.75 to prevent ubiquitous stop words from dominating parameter updates.`,
      r`Final GloVe embeddings are formed by averaging or summing the target vectors w and context vectors w_tilde.`,
      r`FastText enriches token representations by decomposing words into character n-grams bounded by '<' and '>'.`,
      r`FastText achieves zero Out-of-Vocabulary (OOV) rates by composing unseen words from their known constituent subword embeddings.`,
    ],
    pitfalls: [
      r`Using GloVe without sufficient corpus scale: GloVe relies on dense, stable global co-occurrence statistics; training on small corpora (< 100 million tokens) produces noisy, unaligned embeddings. Use pretrained 6B, 42B, or 840B GloVe weights for small datasets.`,
      r`Hash collisions in FastText subword tables: FastText maps millions of possible character n-grams into a fixed-size embedding table (typically 2 million buckets) via hashing. On very small tables, high collision rates degrade rare word representations.`,
      r`Character n-gram range selection: Using n-grams that are too short (n = 2) captures noisy character pairs; using n-grams that are too long (n > 6) fails to generalise across morphological stems. Standard practice uses n in [3, 6].`,
      r`Discarding whole-word tokens in FastText: FastText explicitly retains the full padded token '<word>' alongside its subwords. Discarding the full-word token prevents the model from capturing idiosyncratic non-compositional idioms.`,
    ],
    code: r`import math
from collections import defaultdict, Counter

class FastTextToy:
    """
    Subword character n-gram extraction and out-of-vocabulary
    embedding composition demonstration.
    """
    def __init__(self, min_n=3, max_n=5, dim=8):
        self.min_n = min_n
        self.max_n = max_n
        self.dim = dim
        self.subword_embeddings = {}
        
    def _get_ngrams(self, word):
        """Extract character n-grams bounded by < and >."""
        padded = f"<{word}>"
        ngrams = [padded]  # Include whole word
        L = len(padded)
        for n in range(self.min_n, min(self.max_n + 1, L)):
            for i in range(L - n + 1):
                ngrams.append(padded[i:i+n])
        return ngrams

    def train_mock(self, word_vector_dict):
        """Simulate learned subword embeddings from known vocabulary."""
        for word, target_vec in word_vector_dict.items():
            ngrams = self._get_ngrams(word)
            # Distribute mock vector across subwords
            for g in ngrams:
                if g not in self.subword_embeddings:
                    # Deterministic hash-based mock initialization
                    h = hash(g) % 1000
                    self.subword_embeddings[g] = [
                        math.sin(h + i) * 0.1 for i in range(self.dim)
                    ]

    def get_embedding(self, word):
        """Compose embedding by summing constituent subword vectors."""
        ngrams = self._get_ngrams(word)
        vec = [0.0] * self.dim
        found = 0
        for g in ngrams:
            if g in self.subword_embeddings:
                for i in range(self.dim):
                    vec[i] += self.subword_embeddings[g][i]
                found += 1
                
        # Average subwords if found
        if found > 0:
            vec = [v / found for v in vec]
        return vec

def cosine_sim(v1, v2):
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    return dot / (norm1 * norm2) if norm1 > 0 and norm2 > 0 else 0.0

# Initialize FastText toy model
ft = FastTextToy(min_n=3, max_n=4, dim=8)

# Known training vocabulary
known_words = {
    "play": [1.0] * 8,
    "player": [1.0] * 8,
    "playing": [1.0] * 8,
    "playful": [1.0] * 8,
    "work": [-1.0] * 8,
    "worker": [-1.0] * 8,
    "working": [-1.0] * 8
}
ft.train_mock(known_words)

# Out-of-vocabulary word (never seen during training)
oov_word = "playfully"
known_subword_count = len([g for g in ft._get_ngrams(oov_word) if g in ft.subword_embeddings])

print(f"Known training words: {list(known_words.keys())}")
print(f"Testing OOV word: '{oov_word}'")
print(f"Subwords in '{oov_word}': {ft._get_ngrams(oov_word)}")
print(f"Matched known subwords: {known_subword_count} / {len(ft._get_ngrams(oov_word))}")

v_oov = ft.get_embedding(oov_word)
v_play = ft.get_embedding("playful")
v_work = ft.get_embedding("worker")

print(f"\nCosine similarity between OOV '{oov_word}' and 'playful': {cosine_sim(v_oov, v_play):+.4f}")
print(f"Cosine similarity between OOV '{oov_word}' and 'worker':  {cosine_sim(v_oov, v_work):+.4f}")
`,
    quiz: [
      {
        q: r`What core mathematical insight motivated the design of the GloVe objective function?`,
        o: [
          r`Ratios of co-occurrence probabilities encode linear relational meaning and can be modelled as vector differences dot-producted with context vectors`,
          r`Word vectors must always have strictly positive integer coefficients`,
          r`Co-occurrence matrices should never be scaled logarithmically`,
          r`The dot product of two words should equal the number of vowels they share`,
        ],
        a: 0,
        why: r`Pennington et al. showed that the ratio P(k|w_i) / P(k|w_j) captures subtle semantic distinctions between words i and j. In log-space, this ratio corresponds to the difference between dot products (w_i - w_j)^T w_k, leading directly to the GloVe objective.`,
      },
      {
        q: r`Why does FastText outperform standard Word2Vec and GloVe on morphologically rich languages like German, Turkish, and Finnish?`,
        o: [
          r`Because FastText decomposes words into character n-grams, enabling it to represent rare grammatical inflections and out-of-vocabulary compounds from shared subword roots`,
          r`Because FastText eliminates the need for gradient descent`,
          r`Because FastText trains exclusively on Wikipedia headlines`,
          r`Because FastText uses 16-bit floating point precision on CPUs`,
        ],
        a: 0,
        why: r`Word2Vec and GloVe assign one monolithic vector per word token. In agglutinative languages with millions of inflected verb and compound noun forms, words appear rarely in text. FastText shares embeddings across character n-grams, allowing morphological variants to share parameters.`,
      },
      {
        q: r`What is the purpose of the weighting function f(X_ij) = (X_ij / x_max)^alpha in GloVe?`,
        o: [
          r`To prevent high-frequency stop words from dominating the squared error loss while still providing informative non-zero gradients on rare co-occurrences`,
          r`To convert the loss into cross-entropy`,
          r`To force all singular values to lie between 0 and 1`,
          r`To ensure that sentences are read in reverse order`,
        ],
        a: 0,
        why: r`Without weighting, extremely common pairs like ("the", "of") would account for the majority of the total squared error, causing the model to optimise solely for stop words. The sublinear curve (alpha = 0.75, capped at x_max) balances frequent and infrequent pairs.`,
      },
    ],
    usedBy: [],
    prereq: ['distributional-semantics', 'lsa-and-svd-for-text'],
    related: ['distributional-semantics', 'lsa-and-svd-for-text', 'word-and-sentence-tokenization'],
    keywords: 'glove fasttext word representation subword ngrams character ngrams pennington bojanowski out of vocabulary oov embeddings',
  },
  {
    id: 'sentence-embeddings-and-sbert',
    short: 'Sentence Embeddings & SBERT',
    title: 'Sentence embeddings and SBERT',
    task: 'concepts',
    module: 'Meaning',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Sentence-BERT (SBERT) uses a Siamese neural network architecture to produce semantically meaningful, fixed-size sentence embeddings from pretrained Transformer models. While raw BERT token representations suffer from severe representation collapse and anisotropy (where sentence embeddings cluster in a narrow cone with high average cosine similarity), SBERT fine-tunes BERT using pooling strategies and metric learning objectives over sentence pairs. This enables massive semantic similarity search, clustering, and retrieval in milliseconds rather than hours.`,
    lead: r`Suppose you need to find the most similar sentence pair across a database of 10,000 documents. With a standard BERT cross-encoder—where two sentences are concatenated as "[CLS] A [SEP] B [SEP]"—you must evaluate 10,000 * 9,999 / 2 = 49,995,000 forward passes through a 12-layer Transformer. On a modern GPU, that takes roughly 65 hours. Sentence-BERT reduces this search time to 5 milliseconds: it maps each sentence independently to a dense vector, turning a combinatorial cross-attention problem into an instant vector index lookup.`,
    intuition: [
      r`The flaw of naive token pooling and representation collapse: If you pass a sentence through pretrained BERT and simply average all token hidden states (mean pooling), the resulting vector performs terribly on semantic textual similarity (often worse than GloVe!). Pretrained BERT embeddings suffer from anisotropy: token embeddings occupy a narrow cone in the vector space, causing unrelated sentences to have artificially high cosine similarities (e.g. 0.85). Fine-tuning with metric contrastive objectives is required to spread representations across the full hypersphere.`,
      r`The Siamese network paradigm: SBERT passes sentence A and sentence B through two weight-sharing Transformer encoders. A pooling layer (typically mean pooling over non-padded tokens) condenses the variable-length token sequence into fixed-size sentence embeddings u and v. During training, u, v, and their absolute element-wise difference |u - v| are concatenated and fed to a 3-way softmax classifier (entailment, neutral, contradiction) on natural language inference datasets (SNLI, MultiNLI).`,
      r`Cross-encoders vs Bi-encoders trade-off: A cross-encoder performs full cross-attention between every token in sentence A and every token in sentence B, achieving the highest possible accuracy at the cost of catastrophic O(N^2) evaluation latency. A bi-encoder (SBERT) encodes sentences independently, sacrificing token-level cross-attention for astronomical speedups: vectors can be precomputed, stored in vector databases (HNSW, FAISS), and queried with sub-millisecond cosine dot products.`,
    ],
    analogy: r`Imagine you run a fingerprint registry with 10 million records. A suspect's fingerprint arrives. A cross-encoder is like hiring a team of forensic scientists to sit down with a magnifying glass and compare the suspect's print ridge-by-ridge against every single one of the 10 million archive cards—one by one. It is extraordinarily accurate, but takes three weeks to answer. SBERT is like an automated digital scanner that converts every fingerprint into a unique 768-dimensional numerical barcode upon arrival. Comparing the suspect's barcode against 10 million precomputed barcodes takes 2 milliseconds on a server.`,
    steps: [
      {
        title: r`Tokenise and encode sentence pairs through shared Transformer`,
        desc: r`Pass sentence tokens through a Siamese pretrained Transformer (BERT or RoBERTa).`,
        detail: r`Tokenise input sentences A and B with subword tokenisers. Pass them independently through the encoder to extract contextual token hidden representations H_A and H_B of shape (seq_len, hidden_dim).`,
      },
      {
        title: r`Apply masked mean pooling over token embeddings`,
        desc: r`Aggregate variable-length token vectors into fixed-size sentence vectors.`,
        detail: r`Compute the mean of token embeddings while applying the attention mask: sum token vectors where mask = 1 and divide by total non-padded token count. This yields fixed-size vectors u, v in R^d.`,
      },
      {
        title: r`Construct composite classification representation`,
        desc: r`Concatenate sentence vectors with their absolute element-wise difference.`,
        detail: r`Construct feature vector [u; v; |u - v|] of dimension 3d. The absolute difference |u - v| explicitly measures distance between corresponding semantic dimensions, giving the linear classifier powerful inductive signal.`,
      },
      {
        title: r`Fine-tune on Natural Language Inference (NLI) pairs`,
        desc: r`Train model parameters using cross-entropy loss over entailment, neutral, and contradiction.`,
        detail: r`Project the 3d composite vector through a classification head: softmax(W * [u; v; |u - v|]). Optimise weights with AdamW over SNLI and MultiNLI sentence pairs to teach the latent space semantic entailment geometry.`,
      },
      {
        title: r`Export sentence embeddings for fast vector retrieval`,
        desc: r`Discard classification head and index single-sentence embeddings for cosine search.`,
        detail: r`At inference time, remove the classification head. Encode corpus documents individually into vector representations and index them in a vector database. Queries are embedded and matched using cosine similarity in milliseconds.`,
      },
    ],
    math: [
      {
        h: r`Attention-masked mean pooling`,
        tex: r`\mathbf{u} = \frac{\sum_{i=1}^L m_i \mathbf{h}_i}{\sum_{i=1}^L m_i}`,
        p: r`Here $\mathbf{h}_i \in \mathbb{R}^d$ is the contextual output embedding for token $i$, $m_i \in \{0, 1\}$ is the attention mask indicator ($0$ for padding tokens, $1$ for real tokens), and $L$ is sequence length. Masked mean pooling aggregates tokens while ignoring padding.`,
      },
      {
        h: r`SBERT NLI classification objective`,
        tex: r`\mathbf{o} = \operatorname{softmax}\left( W \left[ \mathbf{u} \,;\, \mathbf{v} \,;\, |\mathbf{u} - \mathbf{v}| \right] + \mathbf{b} \right)`,
        p: r`Here $\mathbf{u}, \mathbf{v} \in \mathbb{R}^d$ are pooled sentence embeddings, $|\mathbf{u} - \mathbf{v}|$ is the element-wise absolute difference vector, and $W \in \mathbb{R}^{3 \times 3d}$ projects the $3d$ concatenated vector to 3 NLI classes (contradiction, entailment, neutral).`,
      },
      {
        h: r`Triplet margin loss for fine-tuning`,
        tex: r`\mathcal{L}_{\text{triplet}} = \max\left( 0, \, \|\mathbf{s}_a - \mathbf{s}_p\|_2 - \|\mathbf{s}_a - \mathbf{s}_n\|_2 + \epsilon \right)`,
        p: r`Given anchor sentence $\mathbf{s}_a$, positive sentence $\mathbf{s}_p$, and negative sentence $\mathbf{s}_n$, the triplet loss forces the anchor-positive distance to be smaller than the anchor-negative distance by at least margin $\epsilon > 0$.`,
      },
    ],
    keyPoints: [
      r`Sentence-BERT (SBERT) produces fixed-size sentence embeddings that can be compared using cosine similarity in sub-millisecond time.`,
      r`Averaging raw un-fine-tuned BERT token embeddings performs poorly due to anisotropy, where vectors collapse into a narrow directional cone.`,
      r`SBERT uses a Siamese network with attention-masked mean pooling, trained on NLI sentence pairs via the composite vector [u; v; |u - v|].`,
      r`Cross-encoders provide superior accuracy but suffer from O(N^2) evaluation scaling; bi-encoders (SBERT) enable massive precomputed vector search.`,
      r`Modern dense retrieval pipelines combine SBERT bi-encoders for initial candidate retrieval with cross-encoders for final reranking.`,
    ],
    pitfalls: [
      r`Using the [CLS] token embedding without fine-tuning: In raw pretrained BERT, the [CLS] token is trained on Next Sentence Prediction (NSP), not sentence similarity; using it directly yields poor semantic embeddings compared to mean pooling.`,
      r`Neglecting the attention mask during pooling: Naively averaging token vectors across a padded sequence includes zero-padding vectors, dragging the sentence embedding towards origin coordinates. Always mask padding tokens before averaging.`,
      r`Relying on bi-encoders for complex logical reasoning: Bi-encoders cannot perform deep cross-attention between words in different sentences. For tasks requiring nuanced comparative reasoning (such as legal contract contradiction), use cross-encoder rerankers.`,
      r`Ignoring sequence length truncation: Transformer encoders typically truncate inputs at 512 tokens. Passing multi-page documents directly to SBERT discards trailing sections; chunk long texts into smaller passages before embedding.`,
    ],
    code: r`import numpy as np

class SBERTSimulator:
    """
    Simulation of SBERT masked mean pooling, composite feature construction,
    and cosine similarity semantic search.
    """
    def __init__(self, hidden_dim=8):
        self.hidden_dim = hidden_dim

    def mean_pooling(self, token_embeddings, attention_mask):
        """
        Compute attention-masked mean pooling over token embeddings.
        token_embeddings: (batch_size, seq_len, hidden_dim)
        attention_mask: (batch_size, seq_len)
        """
        # Expand mask to match embedding dimension: (batch, seq_len, hidden_dim)
        mask_expanded = np.expand_dims(attention_mask, axis=-1)
        
        # Zero out padding tokens
        sum_embeddings = np.sum(token_embeddings * mask_expanded, axis=1)
        sum_mask = np.clip(np.sum(mask_expanded, axis=1), a_min=1e-9, a_max=None)
        
        # Mean pooled sentence vector
        return sum_embeddings / sum_mask

    def construct_nli_features(self, u, v):
        """
        Construct SBERT classification vector: [u; v; |u - v|]
        u, v: (batch_size, hidden_dim)
        """
        diff = np.abs(u - v)
        return np.concatenate([u, v, diff], axis=-1)

    def cosine_similarity(self, a, b):
        dot = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        return dot / (norm_a * norm_b) if norm_a > 0 and norm_b > 0 else 0.0

# Demonstrate Masked Mean Pooling
sim = SBERTSimulator(hidden_dim=4)

# 2 sentences: Sentence 1 has 3 tokens; Sentence 2 has 2 tokens (1 padding token)
mock_token_embeddings = np.array([
    [[1.0, 2.0, 3.0, 4.0], [2.0, 0.0, 1.0, 1.0], [0.0, 1.0, 2.0, 1.0]],   # Sent 1 (len 3)
    [[3.0, 1.0, 0.0, 2.0], [1.0, 1.0, 2.0, 0.0], [0.0, 0.0, 0.0, 0.0]]    # Sent 2 (len 2 + pad)
])

mock_attention_mask = np.array([
    [1, 1, 1],  # 3 real tokens
    [1, 1, 0]   # 2 real tokens, 1 pad token
])

pooled_sentences = sim.mean_pooling(mock_token_embeddings, mock_attention_mask)

print("Pooled Sentence Vectors (shape: batch x hidden_dim):")
print(f"Sentence 1 pooled: {pooled_sentences[0]}")
print(f"Sentence 2 pooled: {pooled_sentences[1]}")

# Demonstrate Composite [u; v; |u - v|] feature
composite_feat = sim.construct_nli_features(pooled_sentences[0:1], pooled_sentences[1:2])
print(f"\nComposite NLI Feature shape: {composite_feat.shape} (dimension: 3 * {sim.hidden_dim} = 12)")
print(f"Features [u; v; |u - v|]:\n{composite_feat[0]}")

# Semantic Search Simulation across Document Database
database_embeddings = {
    "Doc 0: Deep learning models train on GPU clusters": np.array([0.9, 0.8, 0.1, 0.0]),
    "Doc 1: Neural networks optimize parameters via gradient descent": np.array([0.85, 0.82, 0.15, 0.05]),
    "Doc 2: The bakery bakes sourdough bread every dawn": np.array([0.05, 0.1, 0.9, 0.85])
}

query_embedding = np.array([0.88, 0.79, 0.12, 0.02])
print("\nQuery: 'Machine learning training on hardware accelerators'")
print("Cosine Similarity Search Results:")
for title, emb in database_embeddings.items():
    sim_score = sim.cosine_similarity(query_embedding, emb)
    print(f"  {title:<65} -> Sim: {sim_score:.4f}")
`,
    quiz: [
      {
        q: r`Why does averaging raw, un-fine-tuned token embeddings from standard pretrained BERT perform poorly on Semantic Textual Similarity tasks?`,
        o: [
          r`Because raw BERT token representations suffer from anisotropy, collapsing into a narrow cone where unrelated sentences exhibit artificially high cosine similarity`,
          r`Because raw BERT vectors only contain positive prime numbers`,
          r`Because BERT can only process single words and cannot process full sentences`,
          r`Because attention masks delete all nouns from the sentence`,
        ],
        a: 0,
        why: r`Pretrained BERT token embeddings suffer from severe representation collapse and anisotropy: word representations occupy a narrow cone in the vector space, causing even completely unrelated sentences to have cosine similarities exceeding 0.80. Fine-tuning with contrastive metric learning spreads vectors across the hypersphere.`,
      },
      {
        q: r`What was the primary computational advantage of Sentence-BERT (SBERT) over the standard BERT cross-encoder architecture?`,
        o: [
          r`SBERT maps sentences into independent fixed-size vectors, reducing pairwise search across N documents from O(N^2) combinatorial Transformer passes to sub-millisecond vector cosine comparisons`,
          r`SBERT compresses neural network weights onto an 8-bit floppy disk`,
          r`SBERT eliminates the need for tokenisation`,
          r`SBERT trains in zero iterations using gradient-free regression`,
        ],
        a: 0,
        why: r`Finding the most similar sentence pair among 10,000 sentences using a cross-encoder requires ~50 million forward passes (~65 hours of GPU compute). SBERT encodes each sentence once into an embedding, allowing 50 million comparisons in milliseconds via vector dot products.`,
      },
      {
        q: r`In the SBERT NLI classification architecture, why are vectors concatenated as [u; v; |u - v|] instead of simply [u; v]?`,
        o: [
          r`The absolute difference |u - v| explicitly encodes element-wise distance across semantic dimensions, providing a strong inductive signal that highlights feature discrepancies to the classification head`,
          r`Because neural networks can only process vectors whose length is a multiple of three`,
          r`Because |u - v| removes all punctuation marks from the embeddings`,
          r`Because PyTorch throws a runtime error if vectors are not subtracted`,
        ],
        a: 0,
        why: r`Reimers & Gurevych demonstrated empirically that including the element-wise absolute difference |u - v| significantly improves NLI fine-tuning performance. It acts as an explicit metric comparison feature across all latent dimensions.`,
      },
    ],
    usedBy: [],
    prereq: ['distributional-semantics', 'glove-and-fasttext'],
    related: ['distributional-semantics', 'glove-and-fasttext', 'bm25-and-search-ranking'],
    keywords: 'sbert sentence bert sentence embeddings siamese network bi-encoder cross-encoder mean pooling natural language inference semantic search',
  },
  {
    "id": "contextual-embeddings-elmo-to-bert",
    "short": "Contextual Embeddings: ELMo to BERT",
    "title": "Contextual Embeddings: From Word2Vec and ELMo to Modern Transformer Encoders",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Static embeddings (Word2Vec, GloVe, FastText) collapse multiple meanings of polysemous words (e.g. financial \"bank\" vs river \"bank\") into a single vector. ELMo (Embeddings from Language Models) extracts deep representations by training bidirectional LSTMs and linearly weighting all intermediate layer states. BERT (Bidirectional Encoder Representations from Transformers) leverages multi-head self-attention to condition tokens jointly across left and right contexts. Modern encoder embeddings capture lexical syntax in early layers, syntactic relationships in middle layers, and semantic task nuances in upper layers.",
    "lead": "Static word embeddings assign a single static vector to each word regardless of context, failing on polysemy and homonymy. Contextual representations—pioneered by ELMo and revolutionized by BERT—generate dynamic, context-dependent embeddings by conditioning on the entire surrounding sentence using bidirectional recurrent or transformer architectures.",
    "analogy": "A static word embedding is like an actor wearing the exact same costume and speaking in the exact same monotone voice, whether performing in a Shakespearean tragedy, a children's cartoon, or a courtroom drama. A contextual embedding is an improvisational actor whose costume, accent, and emotional delivery adapt dynamically to whoever else is on stage and whatever line was just spoken.",
    "intuition": [
      "If you look up the word \"apple\" in a static Word2Vec dictionary, you get one 300-dimensional vector. Whether that word appears in \"I ate a crisp green apple\" or \"Apple released the new iPhone\", the input vector to your downstream model is identical. This is a fundamental limitation: natural language is deeply polysemous, where a word's actual meaning is determined by its context. ELMo solved this by running forward and backward LSTMs across the sentence, concatenating hidden states so the representation of \"apple\" reflected its grammatical and topical role. BERT took this further: instead of stitching two separate left-to-right and right-to-left streams, BERT uses self-attention to look simultaneously at every other token in the sentence at every layer. As a result, the contextual embedding for \"apple\" in a technology article occupies a completely different subspace than \"apple\" in an orchard."
    ],
    "steps": [
      "Encode lexical inputs: map subwords to initial token embeddings summed with segment embeddings and positional encodings.",
      "Propagate through contextual layers: pass vectors through bidirectional encoders (biLSTM in ELMo, stacked Transformer blocks in BERT).",
      "Compute all-to-all attention: allow every token position to dynamically attend to all other token positions simultaneously.",
      "Extract intermediate activations: inspect lower layers for syntactic/POS representations and upper layers for task-specific semantic context.",
      "Fine-tune or pool: extract the `[CLS]` token embedding for sentence-level tasks, or token-level contextual vectors for sequence labelling."
    ],
    "math": [
      {
        "h": "Contextual Embeddings: From Word2Vec and ELMo to Modern Transformer Encoders Objective Function",
        "tex": "\\mathcal{L}_{\\text{total}} = \\sum_{i=1}^N \\ell(f(x_i), y_i)",
        "p": "Optimisation objective and loss formulation for contextual embeddings: from word2vec and elmo to modern transformer encoders."
      }
    ],
    "code": "import numpy as np\n\ndef cosine_similarity(v1, v2):\n    \"\"\"Computes cosine similarity between two vectors.\"\"\"\n    dot = np.dot(v1, v2)\n    norm = np.linalg.norm(v1) * np.linalg.norm(v2)\n    return dot / max(norm, 1e-8)\n\ndef mock_bidirectional_context_layer(static_embeddings, context_weights):\n    \"\"\"Simulates a 1-layer bidirectional contextualisation pass.\n    \n    static_embeddings: (T, d)\n    context_weights: (T, T) attention affinity matrix\n    \"\"\"\n    # Contextual embedding = combination of self + attended neighbours\n    contextual = np.matmul(context_weights, static_embeddings)\n    # Layer normalisation simulation\n    mean = np.mean(contextual, axis=-1, keepdims=True)\n    std = np.std(contextual, axis=-1, keepdims=True) + 1e-6\n    return (contextual - mean) / std\n\nnp.random.seed(42)\nd = 8  # Embedding dimension\n\n# Static vectors for words\nv_bank = np.random.randn(d)\nv_river = np.array([2.5, 1.2, -0.5, 0.8, -1.0, 0.2, 1.5, -0.4])\nv_money = np.array([-1.2, -0.8, 2.8, -1.5, 2.0, -0.9, -1.1, 2.2])\n\n# Sentence 1: \"river bank water\"\nsent1 = np.stack([v_river, v_bank, v_river * 0.8])\n# Sentence 2: \"money bank finance\"\nsent2 = np.stack([v_money, v_bank, v_money * 0.9])\n\n# Simulated attention matrices where words strongly attend to neighbours\nattn1 = np.array([[0.6, 0.2, 0.2], [0.45, 0.1, 0.45], [0.3, 0.2, 0.5]])\nattn2 = np.array([[0.6, 0.2, 0.2], [0.45, 0.1, 0.45], [0.3, 0.2, 0.5]])\n\n# Generate dynamic contextual representations\ncontext1 = mock_bidirectional_context_layer(sent1, attn1)\ncontext2 = mock_bidirectional_context_layer(sent2, attn2)\n\nbank_in_river = context1[1]\nbank_in_finance = context2[1]\n\nsim_cross_context = cosine_similarity(bank_in_river, bank_in_finance)\nsim_river_context = cosine_similarity(bank_in_river, context1[0])\nsim_finance_context = cosine_similarity(bank_in_finance, context2[0])\n\nprint(\"Contextual Embedding Disambiguation Demo:\")\nprint(f\"  Similarity between 'bank' (river) and 'bank' (finance): {sim_cross_context:.3f}\")\nprint(f\"  Similarity between 'bank' and 'river' in Sentence 1:    {sim_river_context:.3f}\")\nprint(f\"  Similarity between 'bank' and 'money' in Sentence 2:    {sim_finance_context:.3f}\")",
    "keyPoints": [
      "Contextual embeddings dynamically adapt token representations to the surrounding syntax, semantics, and topical tone of the sentence.",
      "ELMo demonstrated the value of deep multi-layer representations; BERT established all-to-all bidirectional attention as the standard.",
      "Downstream performance benefits from layer-specific feature extraction, where syntactic nuances reside in early layers and task semantics in deeper layers."
    ],
    "pitfalls": [
      "Averaging BERT token embeddings naively to produce sentence embeddings; raw BERT embeddings exhibit anisotropy (occupying a narrow cone in vector space), requiring fine-tuned pooling like SBERT.",
      "Assuming all layers of a deep transformer contain identical contextual information; early layers capture morphology, while deeper layers encode complex semantic and relational patterns.",
      "Treating contextual embeddings as static lookup tables; contextual embeddings require running the full encoder forward pass on the surrounding sentence."
    ],
    "quiz": [
      {
        "q": "What was the primary conceptual limitation of static word embeddings like Word2Vec and GloVe?",
        "o": [
          "They were unable to be trained on large text corpora",
          "They collapsed all senses of polysemous words into a single unchanging vector representation",
          "They could only be calculated using 16-bit floating point arithmetic",
          "They did not support cosine similarity comparisons"
        ],
        "a": 1,
        "why": "Static embeddings assign exactly one vector per dictionary entry, meaning words like \"apple\" (fruit vs tech company) or \"bank\" share identical representations regardless of syntax or context."
      },
      {
        "q": "How did ELMo combine information from its multi-layer bidirectional LSTMs?",
        "o": [
          "It discarded all intermediate states and only kept the final backward hidden vector",
          "It computed a learned, task-specific softmax-weighted sum over all intermediate layer representations",
          "It multiplied the token representations by random orthogonal projection matrices",
          "It replaced recurrent units with convolutional kernels at test time"
        ],
        "a": 1,
        "why": "ELMo learns task-specific scalar mixing weights $s_j$ across the input embedding and both intermediate BiLSTM layer states, letting downstream classifiers select optimal representations."
      },
      {
        "q": "Why does BERT's self-attention mechanism provide richer context than ELMo's bidirectional LSTMs?",
        "o": [
          "BERT processes words one at a time from left to right only",
          "BERT conditions each word jointly on both left and right contexts simultaneously at every layer, rather than concatenating two independent unidirectional models",
          "BERT eliminates the need for training data",
          "BERT relies exclusively on convolutional kernels"
        ],
        "a": 1,
        "why": "ELMo concatenated outputs from two separate unidirectional LSTMs (left-to-right and right-to-left), whereas BERT's cross-token self-attention enables deep bidirectional interaction at every layer."
      }
    ],
    "related": [
      "bert-and-masked-language-models",
      "sentence-embeddings-and-sbert"
    ],
    "keywords": "contextual embeddings elmo to bert, contextual embeddings: from word2vec and elmo to modern transformer encoders, natural language processing, deep learning"
  },
  {
    "id": "word-sense-disambiguation-and-lesk",
    "short": "Word Sense Disambiguation & Lesk",
    "title": "Word Sense Disambiguation: Lesk Algorithm, WordNet, and Supervised Disambiguation",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Polysemy (related meanings, e.g. \"mole\" as skin spot vs underground animal) and homonymy (unrelated identical words, e.g. financial vs river \"bank\") require computational sense selection. WordNet organizes English lexicon into synsets (sets of cognitive synonyms) linked by semantic relations such as hypernyms, hyponyms, and meronyms. The Simplified Lesk algorithm scores candidate synsets by counting lexical overlap between synset definitions/examples and context words in the target sentence. Supervised WSD treats sense selection as classification using sense-annotated corpora (e.g. SemCor) or cross-encoder similarity over synset glosses.",
    "lead": "Word Sense Disambiguation (WSD) identifies which specific semantic meaning of a polysemous word is active in a given text snippet. Grounded in lexical knowledge bases like WordNet, foundational approaches such as the Lesk algorithm exploit overlap between dictionary definitions and surrounding context words, leading to modern supervised cross-encoder classification.",
    "analogy": "Imagine a detective holding several identity profiles for suspects sharing the same alias. To find out which suspect committed a crime at a marina, the detective compares words found at the crime scene (tackle, dock, bait) with each suspect's resume. The suspect whose resume mentions boats and fish is identified as the person in question.",
    "intuition": [
      "When humans read \"The bass was delicious with butter and garlic\", we instantly know \"bass\" refers to a fish, not a low-frequency musical instrument or a singing voice. We do this by cross-referencing surrounding context clues (\"delicious\", \"butter\", \"garlic\") with our internal mental encyclopaedia. Word Sense Disambiguation (WSD) is the computational task of picking the correct dictionary definition (or \"sense\") from a set of candidates. The classic Lesk algorithm mimics this process using dictionary definitions: it looks up all definitions of \"bass\" in a dictionary (like WordNet) and compares them against the surrounding words in the sentence. The sense whose definition and example sentences share the highest word overlap with the context is selected as the winning meaning."
    ],
    "steps": [
      "Extract candidate senses: query WordNet or a lexical database for all candidate synsets of the ambiguous target word.",
      "Preprocess context sentence: tokenise, strip common stopwords, and lemmatise surrounding words to their base forms.",
      "Retrieve glosses and examples: compile the text definitions and usage examples for each candidate sense.",
      "Compute lexical overlap: calculate the token intersection count between the lemmatised context and each sense's gloss.",
      "Select maximum overlap sense: pick the sense with the highest count, falling back to WordNet's most frequent sense (MFS) in case of a tie."
    ],
    "math": [
      {
        "h": "Word Sense Disambiguation: Lesk Algorithm, WordNet, and Supervised Disambiguation formulation (Part 1)",
        "tex": "\\text{Score}_{\\text{Lesk}}(s_k, C) = | \\text{Words}(C) \\cap \\left( \\text{Words}(G(s_k)) \\cup \\text{Words}(E(s_k)) \\right) |",
        "p": "Stop words are stripped, and words are lemmatised before taking the intersection. To resolve ties and sparsity, the Extended Gloss Overlap computes overlap across hypernym synsets $\\text{Hyp}(s_k)$:"
      },
      {
        "h": "Word Sense Disambiguation: Lesk Algorithm, WordNet, and Supervised Disambiguation formulation (Part 2)",
        "tex": "\\text{Score}_{\\text{Extended}}(s_k, C) = \\sum_{r \\in \\text{Relations}} w_r \\cdot | \\text{Words}(C) \\cap \\text{Words}(r(s_k)) |",
        "p": "In modern neural WSD (GlossBERT), target sentence $C$ containing marked target word $[\\text{TGT}] w [/\\text{TGT}]$ is concatenated with gloss $G(s_k)$, and scored via cross-encoder binary classific..."
      },
      {
        "h": "Word Sense Disambiguation: Lesk Algorithm, WordNet, and Supervised Disambiguation formulation (Part 3)",
        "tex": "P(\\text{sense } k \\mid C) = \\sigma\\left( \\mathbf{W} \\cdot \\text{BERT}_{\\text{CLS}}( [\\text{CLS}] C [\\text{SEP}] G(s_k) [\\text{SEP}] ) \\right)",
        "p": "In modern neural WSD (GlossBERT), target sentence $C$ containing marked target word $[\\text{TGT}] w [/\\text{TGT}]$ is concatenated with gloss $G(s_k)$, and scored via cross-encoder binary classific..."
      }
    ],
    "code": "def simplified_lesk(word, sentence, sense_dict):\n    \"\"\"Performs Word Sense Disambiguation using the Simplified Lesk algorithm.\n    \n    sense_dict: dictionary mapping sense_id to {'definition': str, 'examples': list}\n    \"\"\"\n    stopwords = {\"the\", \"a\", \"an\", \"is\", \"was\", \"with\", \"and\", \"in\", \"on\", \"at\", \"to\", \"for\", \"of\"}\n    \n    # 1. Clean context words\n    context_tokens = set([\n        t.lower().strip(\".,!?\") for t in sentence.split() \n        if t.lower().strip(\".,!?\") not in stopwords and t.lower() != word.lower()\n    ])\n    \n    best_sense = None\n    max_overlap = -1\n    overlap_words = []\n    \n    # 2. Iterate through candidate senses\n    for sense_id, data in sense_dict.items():\n        gloss_text = data['definition'] + \" \" + \" \".join(data.get('examples', []))\n        gloss_tokens = set([\n            t.lower().strip(\".,!?\") for t in gloss_text.split()\n            if t.lower().strip(\".,!?\") not in stopwords\n        ])\n        \n        # Calculate set intersection\n        shared = context_tokens.intersection(gloss_tokens)\n        overlap_count = len(shared)\n        \n        if overlap_count > max_overlap:\n            max_overlap = overlap_count\n            best_sense = sense_id\n            overlap_words = list(shared)\n            \n    return best_sense, max_overlap, overlap_words\n\n# Candidate senses for the ambiguous noun 'bass'\nbass_senses = {\n    \"bass.n.01 (fish)\": {\n        \"definition\": \"the lean flesh of a saltwater or freshwater fish used for food\",\n        \"examples\": [\"grilled bass with fresh herbs and lemon\"]\n    },\n    \"bass.n.02 (music)\": {\n        \"definition\": \"an adult male singing voice or low pitch musical instrument like bass guitar\",\n        \"examples\": [\"he played the bass guitar in a rock rhythm band\"]\n    }\n}\n\ntarget_sentence = \"The grilled bass served with lemon and garlic was fresh and delicious\"\nchosen_sense, overlap, words = simplified_lesk(\"bass\", target_sentence, bass_senses)\n\nprint(f\"Target Sentence: '{target_sentence}'\")\nprint(f\"Ambiguous Word: 'bass'\")\nprint(f\"Selected Sense:  {chosen_sense}\")\nprint(f\"Overlap Score:   {overlap} (Shared tokens: {words})\")",
    "keyPoints": [
      "Word Sense Disambiguation resolves polysemy by assigning ambiguous tokens to discrete, structured sense definitions.",
      "The Lesk algorithm provides an intuitive overlap heuristic using dictionary definitions, expandable via hypernym and relational graph traversal.",
      "Modern supervised systems combine cross-encoders with synset glosses to achieve high disambiguation accuracy on complex natural text."
    ],
    "pitfalls": [
      "Relying strictly on exact word matches in dictionary definitions; if a gloss uses \"marine animal\" and the sentence says \"saltwater fish\", standard Lesk produces zero overlap without semantic similarity.",
      "Failing to handle the \"Most Frequent Sense\" (MFS) baseline; in many domains, the top WordNet sense accounts for over 60% of all occurrences, making it hard to beat without robust supervised training.",
      "Attempting all-words WSD using brute-force combinatorial search; evaluating combinations of senses across all words in a paragraph leads to exponential complexity $\\mathcal{O}(K^N)$."
    ],
    "quiz": [
      {
        "q": "What is the core mechanism of the classic Simplified Lesk algorithm for Word Sense Disambiguation?",
        "o": [
          "It fine-tunes a deep transformer on supervised parallel corpora",
          "It counts the word overlap between the target sentence context and the dictionary definition (gloss) of each candidate sense",
          "It calculates acoustic pitch frequencies using phonetic hashing",
          "It inverts the n-gram transition matrix using singular value decomposition"
        ],
        "a": 1,
        "why": "Simplified Lesk identifies the correct sense by calculating the number of shared words between the surrounding context and the textual definitions (glosses) of the candidate senses."
      },
      {
        "q": "What is a \"synset\" in the WordNet lexical database?",
        "o": [
          "A set of cognitive synonyms that represent a single distinct lexical concept",
          "A syntactic tree generated by a dependency parser",
          "A list of misspelled words mapped to their phonetic Soundex code",
          "A cluster of documents sharing high TF-IDF similarity"
        ],
        "a": 0,
        "why": "In WordNet, words that express the same meaning are grouped into a synset (synonym set), representing a specific conceptual node in a semantic graph."
      },
      {
        "q": "Why is the \"Most Frequent Sense\" (MFS) considered such a formidable baseline in WSD evaluation?",
        "o": [
          "WordNet definitions are sorted randomly, so the first sense is always optimal",
          "Natural language sense distributions are heavily skewed, with dominant senses accounting for a large majority of real-world usage",
          "MFS uses deep neural cross-attention to rank senses",
          "MFS eliminates all polysemy from the English language"
        ],
        "a": 1,
        "why": "Lexical frequency distributions follow Zipfian dynamics where one primary meaning often accounts for 60-80% of occurrences, making the majority-class heuristic difficult for unsupervised methods to surpass."
      }
    ],
    "related": [
      "glove-and-fasttext",
      "semantic-search-and-dense-retrieval"
    ],
    "keywords": "word sense disambiguation and lesk, word sense disambiguation: lesk algorithm, wordnet, and supervised disambiguation, natural language processing, deep learning"
  },
  {
    "id": "semantic-role-labelling",
    "short": "Semantic Role Labelling (SRL)",
    "title": "Semantic Role Labelling: PropBank, FrameNet, and the Predicate-Argument Structure",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "SRL abstracts surface syntax into predicate-argument structures answering core semantic questions. PropBank defines predicate-specific core semantic roles (ARG0 for agent/causer, ARG1 for patient/theme) and general adjunct modifiers (ARGM-TMP for time, ARGM-LOC for location). FrameNet organizes language into conceptual semantic frames (e.g. `Commerce_buy`) evoked by lexical targets with specific frame elements. Modern neural SRL casts argument extraction as BIO sequence tagging or span-based classification conditioned on identified predicate tokens.",
    "lead": "Semantic Role Labelling (SRL) identifies \"who did what to whom, when, where, and why\" by parsing sentences into predicates and their semantic arguments. Grounded in computational formalisms like PropBank and FrameNet, SRL abstracts away surface syntactic variations to uncover invariant underlying event semantics.",
    "analogy": "Imagine a theatre play script. Regardless of whether an actor enters from stage left or stage right, or speaks in active or passive voice, the cast list remains fixed: Actor A is the protagonist (Agent), Actor B is the target (Patient), and the clock on the wall sets the time (Temporal modifier). SRL identifies the cast list and assigns theatrical roles for every scene in a text.",
    "intuition": [
      "Consider the three sentences: \"The dog bit the postman\", \"The postman was bitten by the dog\", and \"The postman suffered a bite from the dog\". Syntactically, these sentences look very different: \"the dog\" is a subject in the first sentence, an object of a preposition in the second, and absent as a direct verb subject in the third. Yet semantically, the underlying event is identical: the dog is the attacker (Agent / ARG0) and the postman is the victim (Patient / ARG1). Standard syntactic parsing stops at grammatical relations (subject, object). Semantic Role Labelling takes the crucial next step: given a predicate (verb or event noun), it labels each phrase with its semantic role, enabling information extraction, question answering, and dialogue systems to understand the core participants of any event."
    ],
    "steps": [
      "Identify predicate tokens: scan the sentence for verbal or nominal event anchors (e.g. \"acquired\", \"sold\", \"demolished\").",
      "Generate contextual token encodings: pass the sentence through a bidirectional transformer encoder along with a binary predicate indicator feature.",
      "Extract candidate argument spans: enumerate valid candidate phrases or use BIO token tagging over the sequence.",
      "Score span-role assignments: evaluate compatibility between the predicate embedding and candidate argument representations.",
      "Enforce structural constraints: apply dynamic programming or integer linear programming to ensure spans do not overlap and grammatical constraints are satisfied."
    ],
    "math": [
      {
        "h": "Semantic Role Labelling: PropBank, FrameNet, and the Predicate-Argument Structure formulation (Part 1)",
        "tex": "\\mathbf{g}_{i, j} = [\\mathbf{h}_i \\,;\\, \\mathbf{h}_j \\,;\\, \\mathbf{h}_p \\,;\\, \\mathbf{w}_{j-i}]",
        "p": "Argument classification score for semantic role $r \\in \\mathcal{R}$ is computed via multi-layer perceptron:"
      },
      {
        "h": "Semantic Role Labelling: PropBank, FrameNet, and the Predicate-Argument Structure formulation (Part 2)",
        "tex": "\\text{Score}(i, j, r) = \\mathbf{W}_r \\cdot \\text{ReLU}(\\mathbf{W}_g \\mathbf{g}_{i, j} + \\mathbf{b}_g) + b_r",
        "p": "Global span consistency enforces that arguments cannot overlap and each core role (ARG0, ARG1) typically appears at most once per predicate:"
      },
      {
        "h": "Semantic Role Labelling: PropBank, FrameNet, and the Predicate-Argument Structure formulation (Part 3)",
        "tex": "\\hat{\\mathcal{Y}} = \\arg\\max_{\\mathcal{Y} \\in \\text{ValidSpans}} \\sum_{(i, j, r) \\in \\mathcal{Y}} \\text{Score}(i, j, r)",
        "p": "Global span consistency enforces that arguments cannot overlap and each core role (ARG0, ARG1) typically appears at most once per predicate:"
      }
    ],
    "code": "import numpy as np\n\ndef score_semantic_roles(tokens, predicate_idx, candidate_spans, role_weights):\n    \"\"\"Simulates scoring semantic arguments for a designated predicate.\"\"\"\n    pred_token = tokens[predicate_idx]\n    scored_arguments = []\n    \n    for (start, end), span_type in candidate_spans:\n        span_text = \" \".join(tokens[start:end])\n        # Simple simulated affinity based on grammatical role heuristics\n        if span_type == 'subject' and predicate_idx > start:\n            role = 'ARG0 (Agent/Doer)'\n            confidence = 0.94\n        elif span_type == 'object' and predicate_idx < start:\n            role = 'ARG1 (Patient/Theme)'\n            confidence = 0.91\n        elif span_type == 'prep_phrase':\n            role = 'ARGM-LOC (Location)'\n            confidence = 0.88\n        else:\n            role = 'O (None)'\n            confidence = 0.50\n            \n        scored_arguments.append({\n            'span': span_text,\n            'range': (start, end),\n            'role': role,\n            'confidence': confidence\n        })\n        \n    return scored_arguments\n\n# Sentence: \"Google acquired DeepMind in London\"\nsentence = \"Google acquired DeepMind in London\"\ntokens = sentence.split()\npredicate_idx = 1  # \"acquired\"\n\n# Candidate syntactic constituents\ncandidate_spans = [\n    ((0, 1), 'subject'),       # \"Google\"\n    ((2, 3), 'object'),        # \"DeepMind\"\n    ((3, 5), 'prep_phrase')    # \"in London\"\n]\n\nresults = score_semantic_roles(tokens, predicate_idx, candidate_spans, {})\n\nprint(f\"Sentence: '{sentence}'\")\nprint(f\"Target Predicate: '{tokens[predicate_idx]}'\")\nprint(\"Extracted Semantic Roles:\")\nfor r in results:\n    print(f\"  [{r['span']:12}] -> {r['role']} (conf: {r['confidence']:.2f})\")",
    "keyPoints": [
      "Semantic Role Labelling identifies predicate-argument relationships, capturing who did what to whom across varied surface syntax.",
      "PropBank standardises numbered core roles (ARG0–ARG5) and adjunct modifiers (ARGM-TMP, ARGM-LOC) per predicate sense.",
      "Conditioning bidirectional contextual representations on predicate tokens allows models to extract clean, non-overlapping semantic argument spans."
    ],
    "pitfalls": [
      "Assuming ARG0 always equals grammatical subject; in passive voice (\"The suspect was arrested by the officer\"), the subject is ARG1 while the prepositional agent is ARG0.",
      "Failing to condition the argument extraction on specific predicate indicators; sentences with multiple verbs have distinct role assignments for each verb.",
      "Treating semantic frames across languages as identical without adjusting for language-specific valence patterns and case-marking structures."
    ],
    "quiz": [
      {
        "q": "In the PropBank annotation standard, what semantic entity is typically denoted by ARG0?",
        "o": [
          "The location where the event took place",
          "The agent, causer, or primary instigator of the action",
          "The patient, theme, or entity affected by the action",
          "The timestamp indicating when the action occurred"
        ],
        "a": 1,
        "why": "PropBank designates ARG0 as the external argument or prototype agent/causer, whereas ARG1 represents the prototype patient or theme."
      },
      {
        "q": "Why does Semantic Role Labelling provide more consistent semantic representation than pure dependency parsing across active and passive voices?",
        "o": [
          "Dependency parsing cannot be run on passive sentences",
          "SRL assigns the same underlying roles (ARG0/ARG1) regardless of surface subject/object position shifts",
          "SRL eliminates the need for tokenisation",
          "SRL only functions on nouns rather than verbs"
        ],
        "a": 1,
        "why": "Active (\"A bit B\") and passive (\"B was bitten by A\") have reversed grammatical subjects and objects, but SRL consistently maps A to ARG0 and B to ARG1."
      },
      {
        "q": "What distinguishes FrameNet from PropBank in lexical semantic modelling?",
        "o": [
          "FrameNet organizes words into conceptual semantic frames with domain-specific frame elements rather than numbered arguments",
          "FrameNet only supports numerical database queries",
          "PropBank does not support English verbs",
          "FrameNet is restricted exclusively to acoustic audio analysis"
        ],
        "a": 0,
        "why": "FrameNet groups words into conceptual frames (e.g. `Commerce_buy`, with elements `Buyer`, `Seller`, `Goods`) reflecting frame semantics, whereas PropBank uses general numbered arguments."
      }
    ],
    "related": [
      "conditional-random-fields",
      "bert-and-masked-language-models"
    ],
    "keywords": "semantic role labelling, semantic role labelling: propbank, framenet, and the predicate-argument structure, natural language processing, deep learning"
  },
  {
    "id": "evaluating-embeddings-similarity-analogy-bias",
    "short": "Evaluating Embeddings & Bias",
    "title": "Evaluating Embeddings: Similarity, Analogy, and Cultural Bias",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Intrinsic evaluation tests geometrical consistency (word similarity datasets, analogy arithmetic), whereas extrinsic evaluation measures downstream task metrics (NER, classification). Word similarity tasks (WordSim-353, SimLex-999) evaluate Spearman rank correlation $\\rho$ between human ratings and vector cosine distances. Analogy completion ($\\\\mathbf{v}_{\\\\text{king}} - \\\\mathbf{v}_{\\\\text{man}} + \\\\mathbf{v}_{\\\\text{woman}} \\\\approx \\\\mathbf{v}_{\\\\text{queen}}$) tests linear relational substructures. Bias audits (WEAT, SEAT) quantify cultural, racial, and gender stereotypical associations reflected in cosine geometry.",
    "lead": "Evaluating representation quality in vector spaces requires balancing intrinsic geometric benchmarks and extrinsic downstream performance. Intrinsic metrics like word similarity correlation and vector analogies assess semantic structure, while quantitative audits—such as the Word Embedding Association Test (WEAT)—uncover harmful societal biases encoded within distributional geometries.",
    "analogy": "Evaluating a vector space is like testing a newly forged optical lens. Intrinsic evaluation tests the lens in a laboratory for chromatic aberration, focal sharpness, and distortion. Extrinsic evaluation puts the lens on an actual satellite camera to see if it takes crisp photos of the earth. Bias evaluation checks if the lens has an unwanted colour tint that distorts the true hues of the landscape.",
    "intuition": [
      "When you train word or sentence embeddings, how do you know if the resulting vector space is good? There are two primary evaluation philosophies: intrinsic and extrinsic. Extrinsic evaluation measures how well the embeddings perform as features in an actual end-to-end task, such as document classification or entity recognition. Intrinsic evaluation, on the other hand, probes the geometric properties of the vector space directly: do synonyms sit near each other (similarity)? Can vector arithmetic solve relationships like \"Paris is to France as Tokyo is to Japan\" (analogy)? Crucially, because embeddings learn from human web text, they also internalize human prejudices. Bias testing evaluates whether neutral professions (e.g. \"doctor\", \"nurse\") exhibit illicit geometric proximity to specific demographic terms (\"he\", \"she\"), enabling debiasing before deployment."
    ],
    "steps": [
      "Select intrinsic benchmark datasets: choose semantic similarity datasets (SimLex-999, MEN) and relational analogy datasets (Google Analogy Test).",
      "Compute cosine similarities: calculate pairwise cosine similarities for all word pairs in the benchmark.",
      "Evaluate Spearman correlation: rank model scores against human annotator ratings and compute rank-order correlation $\\rho$.",
      "Evaluate analogy accuracy: solve 3CosAdd vector equations and measure top-1 retrieval accuracy.",
      "Execute WEAT bias audit: define target concept sets and demographic attribute sets to compute effect size $d$ and permutation p-values."
    ],
    "math": [
      {
        "h": "Evaluating Embeddings: Similarity, Analogy, and Cultural Bias Objective Function",
        "tex": "\\mathcal{L}_{\\text{total}} = \\sum_{i=1}^N \\ell(f(x_i), y_i)",
        "p": "Optimisation objective and loss formulation for evaluating embeddings: similarity, analogy, and cultural bias."
      }
    ],
    "code": "import numpy as np\n\ndef cosine_similarity(u, v):\n    \"\"\"Computes cosine similarity between two vectors.\"\"\"\n    norm = np.linalg.norm(u) * np.linalg.norm(v)\n    return np.dot(u, v) / max(norm, 1e-8)\n\ndef evaluate_analogy(vectors, a, b, c):\n    \"\"\"Computes 3CosAdd analogy: b - a + c ~ d.\"\"\"\n    target = vectors[b] - vectors[a] + vectors[c]\n    best_word = None\n    best_sim = -float('inf')\n    \n    for word, vec in vectors.items():\n        if word in (a, b, c):\n            continue\n        sim = cosine_similarity(target, vec)\n        if sim > best_sim:\n            best_sim = sim\n            best_word = word\n            \n    return best_word, best_sim\n\ndef weat_effect_size(vectors, X, Y, A, B):\n    \"\"\"Calculates WEAT effect size d between targets X, Y and attributes A, B.\"\"\"\n    def s(w):\n        sim_A = np.mean([cosine_similarity(vectors[w], vectors[a]) for a in A])\n        sim_B = np.mean([cosine_similarity(vectors[w], vectors[b]) for b in B])\n        return sim_A - sim_B\n        \n    scores_X = [s(x) for x in X]\n    scores_Y = [s(y) for y in Y]\n    all_scores = scores_X + scores_Y\n    \n    diff = np.mean(scores_X) - np.mean(scores_Y)\n    pooled_std = np.std(all_scores) + 1e-8\n    return diff / pooled_std\n\n# Simulated 4D embedding space\nnp.random.seed(42)\nembeddings = {\n    \"king\": np.array([1.0, 0.8, 0.1, 0.2]),\n    \"man\": np.array([0.9, 0.1, 0.1, 0.1]),\n    \"woman\": np.array([0.1, 0.9, 0.1, 0.1]),\n    \"queen\": np.array([0.2, 1.6, 0.1, 0.2]),\n    \"programmer\": np.array([0.8, 0.2, 0.9, 0.1]),\n    \"homemaker\": np.array([0.1, 0.8, 0.1, 0.8])\n}\n\n# 1. Analogy completion\nd_pred, score = evaluate_analogy(embeddings, \"man\", \"king\", \"woman\")\nprint(f\"Analogy: 'man' is to 'king' as 'woman' is to -> '{d_pred}' (sim: {score:.3f})\")\n\n# 2. WEAT Bias Audit (Target: Career vs Family, Attributes: Male vs Female)\nX = [\"programmer\"]\nY = [\"homemaker\"]\nA = [\"man\"]\nB = [\"woman\"]\n\nd = weat_effect_size(embeddings, X, Y, A, B)\nprint(f\"WEAT Effect Size (Gender Bias in Occupations): d = {d:.3f}\")",
    "keyPoints": [
      "Intrinsic evaluation probes semantic geometry via word similarity rankings and linear relational vector analogies.",
      "SimLex-999 separates genuine semantic similarity from loose topical association, offering a more rigorous test than older relatedness datasets.",
      "Auditing vector geometries with tests like WEAT is critical for detecting and mitigating societal bias prior to real-world deployment."
    ],
    "pitfalls": [
      "Overfitting embeddings to intrinsic word similarity benchmarks that do not correlate well with downstream application performance.",
      "Confusing semantic relatedness (e.g. \"coffee\" and \"cup\") with true semantic similarity (e.g. \"coffee\" and \"tea\"); datasets like SimLex-999 strictly test similarity.",
      "Assuming that applying linear projection debiasing completely eliminates societal bias; non-linear probe classifiers often readily reconstruct latent protected attributes."
    ],
    "quiz": [
      {
        "q": "What is the primary distinction between intrinsic and extrinsic evaluation of word embeddings?",
        "o": [
          "Intrinsic evaluation tests geometric properties directly (similarity/analogy), while extrinsic evaluation tests performance on a downstream NLP task",
          "Intrinsic evaluation requires GPU clusters, while extrinsic evaluation runs on CPUs",
          "Intrinsic evaluation only measures inference latency in milliseconds",
          "Extrinsic evaluation tests character spellings, while intrinsic evaluation evaluates grammar"
        ],
        "a": 0,
        "why": "Intrinsic evaluation tests vector space properties (word similarity correlations, analogy arithmetic), whereas extrinsic evaluation measures utility in downstream tasks like sentiment classification."
      },
      {
        "q": "What does the Word Embedding Association Test (WEAT) measure?",
        "o": [
          "The floating-point compression ratio of quantized embeddings",
          "The differential semantic association between target concepts and demographic attribute words, quantifying stereotypical bias",
          "The number of out-of-vocabulary words in a corpus",
          "The optimal learning rate for AdamW optimisers"
        ],
        "a": 1,
        "why": "WEAT adapts the Implicit Association Test to word embeddings, measuring whether neutral concept words show differential geometric proximity to specific demographic or gender words."
      },
      {
        "q": "Which correlation coefficient is standardly used to evaluate model word similarity against human rankings?",
        "o": [
          "Pearson linear correlation $r$",
          "Spearman rank-order correlation $\\rho$",
          "Gini coefficient",
          "Dice overlap coefficient"
        ],
        "a": 1,
        "why": "Spearman's rank-order correlation evaluates monotonic relationship between human rankings and model cosine similarities, making it robust to non-linear rating scales."
      }
    ],
    "related": [
      "distributional-semantics",
      "sentence-embeddings-and-sbert"
    ],
    "keywords": "evaluating embeddings similarity analogy bias, evaluating embeddings: similarity, analogy, and cultural bias, natural language processing, deep learning"
  },
  {
    id: 'bert-and-masked-language-models',
    short: 'BERT & Masked LMs',
    title: 'BERT and masked language models',
    task: 'concepts',
    module: 'Language models',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`BERT (Bidirectional Encoder Representations from Transformers) transformed natural language processing by enabling deep bidirectional pre-training from unlabelled text. Prior language models were constrained to left-to-right or right-to-left causal masking to prevent tokens from indirectly seeing themselves in deep multi-layer networks. BERT introduced Masked Language Modelling (MLM)—masking 15% of input tokens at random and training the Transformer encoder to predict the original words based simultaneously on left and right context. Fine-tuning a single pre-trained BERT model with minimal task-specific layers established state-of-the-art results across eleven diverse NLP benchmarks.`,
    lead: r`In the sentence "The bank can guarantee the deposit because of the river bank's stability", the word "bank" appears twice with completely different meanings. A left-to-right language model processing the first "bank" has only seen "The"; it cannot know whether financial or geographical concepts follow. BERT solves this fundamental bottleneck: by masking words and training with deep bidirectional self-attention across the entire sequence, every token embedding incorporates rich semantic signals from both its past and its future.`,
    intuition: [
      r`The dilemma of deep bidirectional representations: Standard language models cannot use bidirectional self-attention because allowing tokens to look left and right in multi-layer networks leads to cyclic cheating: token i in layer 2 could attend to token i+1 in layer 1, which has already attended to token i in layer 0, trivialising next-token prediction. BERT breaks this cycle with the Cloze task (Masked LM): by corrupting a small fraction of input words with [MASK], the model must use the uncorrupted surrounding context to reconstruct the missing information.`,
      r`The 80/10/10 masking schedule: If BERT only encountered the artificial [MASK] token during pre-training, fine-tuning would suffer from distribution shift because real-world downstream tasks never contain [MASK] tokens. BERT mitigates this with an ingenious 80/10/10 schedule for the 15% selected tokens: 80% are replaced with [MASK], 10% are replaced with a random vocabulary token (injecting noise and forcing the model to verify every token), and 10% are left unchanged (biasing representations towards actual observed words).`,
      r`Pre-train once, fine-tune everywhere: Before BERT, transfer learning in NLP was limited to static word embeddings (Word2Vec, GloVe) or feature-based LSTM representations (ELMo). BERT introduced the modern pre-train and fine-tune paradigm: pre-train a massive 110M (Base) or 340M (Large) parameter encoder on hundreds of millions of words of unlabelled text once, and then fine-tune all parameters end-to-end on task-specific labelled datasets with a single classification head in just a few epochs.`,
    ],
    analogy: r`Think of learning a foreign language by completing crossword puzzles or fill-in-the-blank exam questions. If you read a book from left to right, you can only guess what comes next based on what you have already read. But on a crossword puzzle, a word like "b _ _ k" has both preceding clues ("deposited funds in the") and trailing clues ("to earn compound interest"). By looking at both sides of the sentence simultaneously, your brain effortlessly resolves the blank as "bank". BERT trains a neural network on billions of fill-in-the-blank puzzles until it acquires an intuitive mastery of human grammar, idiom, and semantics.`,
    steps: [
      {
        title: r`Construct composite input embeddings`,
        desc: r`Sum token, segment, and positional embeddings for each sequence position.`,
        detail: r`Tokenise text using WordPiece subwords. Prepend [CLS] and separate sentence pairs with [SEP]. For each token, construct input representation e_i = TokenEmbedding(w_i) + SegmentEmbedding(s_i) + PositionEmbedding(i).`,
      },
      {
        title: r`Apply 80/10/10 Masked LM corruption`,
        desc: r`Randomly select 15% of token positions and apply masking rules.`,
        detail: r`Select 15% of tokens uniformly at random. Of these chosen positions: replace 80% with [MASK], 10% with a random vocabulary token, and leave 10% unchanged. Record target label identities for the selected positions.`,
      },
      {
        title: r`Process bidirectional self-attention across Transformer layers`,
        desc: r`Pass unmasked and masked tokens through deep bidirectional multi-head self-attention.`,
        detail: r`Feed embeddings through L stacked Transformer encoder layers (L = 12 for Base, L = 24 for Large). Unconstrained attention allows every token to attend to all other tokens in the sequence simultaneously.`,
      },
      {
        title: r`Compute cross-entropy loss exclusively on masked tokens`,
        desc: r`Project final encoder hidden states through an MLM prediction head over vocabulary V.`,
        detail: r`Pass hidden states h_i corresponding strictly to the selected 15% masked positions through a linear layer with GeLU activation and layer normalisation, projected to vocabulary size |V|. Compute cross-entropy loss against original target words.`,
      },
      {
        title: r`Fine-tune end-to-end on downstream tasks`,
        desc: r`Attach task-specific output heads and update all network weights with AdamW.`,
        detail: r`For sentence classification, pass the [CLS] embedding to a linear classification head. For token classification (NER, POS), attach heads to each token position. Fine-tune all Transformer parameters with small learning rates (e.g. 2e-5 to 5e-5) for 3 to 5 epochs.`,
      },
    ],
    math: [
      {
        h: r`Masked Language Model (MLM) objective function`,
        tex: r`\mathcal{L}_{\text{MLM}}(\theta) = -\sum_{i \in \mathcal{M}} \log P(w_i \mid \tilde{W}; \theta)`,
        p: r`Here $\mathcal{M}$ is the subset of randomly selected masked positions (15% of all tokens), $\tilde{W}$ is the corrupted input sequence, and $w_i$ is the true original token. Cross-entropy loss is computed exclusively on masked positions, avoiding loss computation on unmasked tokens.`,
      },
      {
        h: r`Prediction head token probability distribution`,
        tex: r`P(w \mid \tilde{W}; \theta) = \operatorname{softmax}\left( \mathbf{W}_v \operatorname{GELU}(\mathbf{W}_h \mathbf{h}_i + \mathbf{b}_h) + \mathbf{b}_v \right)_w`,
        p: r`Here $\mathbf{h}_i \in \mathbb{R}^d$ is the final encoder output vector at masked position $i$, $\mathbf{W}_h \in \mathbb{R}^{d \times d}$, and $\mathbf{W}_v \in \mathbb{R}^{|V| \times d}$ is the vocabulary projection matrix (often tied with input token embeddings to conserve parameters).`,
      },
      {
        h: r`Next Sentence Prediction (NSP) binary objective`,
        tex: r`\mathcal{L}_{\text{NSP}}(\theta) = -\log P(\text{IsNext} \in \{0, 1\} \mid \mathbf{h}_{[\text{CLS}]}; \theta)`,
        p: r`In original BERT, a binary classification loss was applied to the special pooled $[\text{CLS}]$ token to predict whether sentence B naturally followed sentence A (50% actual continuation, 50% random sentence). Later architectures (RoBERTa) proved NSP was unnecessary when training on contiguous text blocks.`,
      },
    ],
    keyPoints: [
      r`BERT uses bidirectional self-attention to encode left and right linguistic context simultaneously across all layers.`,
      r`Masked Language Modelling (MLM) corrupts 15% of tokens, training the encoder on a fill-in-the-blank Cloze task without trivial autoregressive leakage.`,
      r`The 80/10/10 masking rule prevents distribution mismatch between pre-training and downstream inference where [MASK] tokens never appear.`,
      r`Input representations combine WordPiece token embeddings, segment embeddings (sentence A vs B), and learned absolute position embeddings.`,
      r`BERT established the pre-train and fine-tune paradigm: pre-training on unlabelled text produces representations that specialise to downstream tasks in just a few epochs.`,
    ],
    pitfalls: [
      r`Pre-training vs inference mismatch: If you only replace masked words with [MASK], the model learns that representations only need updating when [MASK] is visible, degrading performance on downstream clean text. Always adhere to the 80/10/10 corruption schedule.`,
      r`Using BERT for autoregressive text generation: BERT is an encoder designed for representation learning and classification, not generation. Generating text by iteratively masking and predicting is orders of magnitude slower and less coherent than decoder-only models (like GPT).`,
      r`Exceeding the 512-token maximum sequence length: Standard BERT uses fixed absolute positional embeddings capped at 512 tokens. Longer documents must be chunked or processed with sliding window strategies.`,
      r`Catastrophic forgetting during fine-tuning: Fine-tuning with learning rates that are too high (> 1e-4) destroys pre-trained representations in the lower layers. Use gentle learning rates (2e-5 to 5e-5) with linear warm-up.`,
    ],
    code: r`import numpy as np
import random

class MLMMasker:
    """
    Simulation of BERT 80/10/10 Masked Language Modeling (MLM)
    corruption schedule on tokenised sequences.
    """
    def __init__(self, vocab, mask_prob=0.15):
        self.vocab = vocab
        self.mask_prob = mask_prob
        self.mask_token = "[MASK]"
        
    def mask_sequence(self, tokens):
        """
        Apply BERT 80/10/10 masking rule to tokens.
        Returns corrupted tokens, masked indices, and ground truth labels.
        """
        corrupted = list(tokens)
        masked_indices = []
        labels = []
        
        for i, token in enumerate(tokens):
            # Skip special boundary tokens
            if token in ["[CLS]", "[SEP]"]:
                continue
                
            if random.random() < self.mask_prob:
                masked_indices.append(i)
                labels.append(token)
                
                rand_val = random.random()
                if rand_val < 0.80:
                    # 80% of time: Replace with [MASK]
                    corrupted[i] = self.mask_token
                elif rand_val < 0.90:
                    # 10% of time: Replace with random vocabulary word
                    corrupted[i] = random.choice(self.vocab)
                else:
                    # 10% of time: Keep unchanged
                    corrupted[i] = token
                    
        return corrupted, masked_indices, labels

def softmax(x):
    e_x = np.exp(x - np.max(x, axis=-1, keepdims=True))
    return e_x / np.sum(e_x, axis=-1, keepdims=True)

# Vocabulary and sample sentence
vocab = ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "bank", "river", "capital"]
tokens = ["[CLS]", "the", "brown", "fox", "jumps", "over", "the", "river", "bank", "[SEP]"]

random.seed(42)
masker = MLMMasker(vocab, mask_prob=0.30)  # Elevated probability for demonstration
corrupted_tokens, masked_idx, gold_labels = masker.mask_sequence(tokens)

print("Original Tokens:")
print(" ", " ".join(tokens))
print("\nCorrupted Tokens (after 80/10/10 masking):")
print(" ", " ".join(corrupted_tokens))
print("\nMasked Positions & Targets:")
for idx, target in zip(masked_idx, gold_labels):
    print(f"  Pos {idx}: observed '{corrupted_tokens[idx]}' -> Target: '{target}'")

# Simulate MLM prediction head logits over vocabulary
V = len(vocab)
mock_logits = np.random.randn(len(masked_idx), V)
mock_probs = softmax(mock_logits)

# Compute Cross-Entropy Loss over masked positions
loss = 0.0
for i, target in enumerate(gold_labels):
    target_idx = vocab.index(target) if target in vocab else 0
    prob = mock_probs[i, target_idx]
    loss -= np.log(max(prob, 1e-9))
loss /= len(masked_idx)

print(f"\nSimulated Cross-Entropy MLM Loss across {len(masked_idx)} positions: {loss:.4f}")
`,
    quiz: [
      {
        q: r`Why did BERT introduce the 80/10/10 masking rule instead of replacing all 15% masked words with the [MASK] token?`,
        o: [
          r`To prevent a distribution discrepancy between pre-training and downstream fine-tuning, where the [MASK] token never appears in real-world task text`,
          r`Because replacing 15% of tokens with [MASK] would cause numerical overflow in the softmax denominator`,
          r`Because WordPiece tokenisers cannot encode the [MASK] token more than five times`,
          r`To reduce the number of Transformer attention heads required`,
        ],
        a: 0,
        why: r`If BERT only trained on [MASK] tokens, the network would never learn to contextualise clean, uncorrupted words at test time. Replacing 10% with random words forces the model to maintain contextual representations for every token, and keeping 10% unchanged biases embeddings towards actual observed words.`,
      },
      {
        q: r`What makes bidirectional self-attention in BERT fundamentally different from the causal attention used in decoder-only models like GPT?`,
        o: [
          r`BERT allows every token to attend simultaneously to both left and right tokens in the sequence, whereas causal attention strictly forbids tokens from attending to future positions`,
          r`BERT attention can only process text written in English`,
          r`BERT does not use query, key, and value matrices`,
          r`BERT eliminates the need for matrix multiplication`,
        ],
        a: 0,
        why: r`In causal attention, an upper-triangular mask of negative infinities forces token i to attend only to tokens j <= i. BERT does not apply a causal mask, allowing full bidirectional attention across all positions.`,
      },
      {
        q: r`How does BERT format sentence pairs (such as question-answering or premise-hypothesis pairs) for fine-tuning?`,
        o: [
          r`It concatenates them into a single sequence formatted as [CLS] Sentence A [SEP] Sentence B [SEP] with segment embeddings indicating sentence identity`,
          r`It processes each sentence on a separate GPU without communication`,
          r`It translates sentence B into French before comparison`,
          r`It discards all words in sentence A that do not appear in sentence B`,
        ],
        a: 0,
        why: r`BERT concatenates both sentences into a single continuous sequence with segment embeddings E_A and E_B. This enables full cross-attention between every token in Sentence A and Sentence B across all Transformer layers.`,
      },
    ],
    usedBy: [],
    prereq: ['sentence-embeddings-and-sbert', 'transformer_networks'],
    related: ['sentence-embeddings-and-sbert', 'transformer_networks', 'word-and-sentence-tokenization'],
    keywords: 'bert masked language model mlm cloze devlin roberta transformer bidirectional encoder wordpiece pre-training fine-tuning nsp',
  },
  {
    id: 'gpt-and-decoder-only-models',
    short: 'GPT & Decoder-Only Models',
    title: 'GPT and decoder-only models',
    task: 'concepts',
    module: 'Language models',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Generative Pre-trained Transformer (GPT) models established the decoder-only architecture as the dominant paradigm for modern Large Language Models (LLMs). By training on the standard autoregressive language modelling objective—predicting the next token given preceding context—GPT models scale cleanly with compute, data, and parameters. Using causal lower-triangular attention masking to enforce temporal directionality, GPT unifies natural language generation, reasoning, and few-shot in-context learning without requiring task-specific architecture modifications.`,
    lead: r`Before GPT-3, the dominant paradigm in machine learning was task-specific fine-tuning: you pre-trained a model, threw away its output head, and trained a new classifier on thousands of human-annotated examples for each specific task. GPT proved a startling alternative: if you train a sufficiently large decoder-only Transformer on the simple task of predicting the next word across internet-scale text, the model spontaneously develops the ability to translate languages, answer factual questions, write computer code, and reason through logic puzzles purely by prompting it with a few demonstration examples.`,
    intuition: [
      r`Autoregressive factorization and the chain rule of probability: The joint probability of any sequence of words factorises exactly using the chain rule of probability: P(w_1, ..., w_T) = prod_{t=1}^T P(w_t | w_<t). By conditioning each token strictly on its predecessors, autoregressive models solve both training and generation seamlessly. During training, teacher forcing evaluates all T token predictions in parallel; during generation, the model predicts one token at a time, feeding its output back as input.`,
      r`Causal attention masking: In standard self-attention, token i computes dot products with all tokens j in the sequence. To prevent information leakage from future tokens (w_{i+1}, ..., w_T), causal attention adds an upper-triangular mask of negative infinity (-inf) to the attention logits before the softmax step. Because exp(-inf) = 0, every token is mathematically prevented from looking ahead, guaranteeing valid autoregressive generation.`,
      r`The emergence of in-context learning through scale: As language models grew from GPT-1 (117M parameters) to GPT-2 (1.5B) and GPT-3 (175B), their capabilities underwent a qualitative shift. Rather than updating model weights via gradient descent, users could steer the model's behaviour at inference time simply by prepending natural language instructions and a few input-output demonstrations (few-shot prompting). The model recognizes the pattern and completes the prompt accordingly.`,
    ],
    analogy: r`Think of reading an enthralling mystery novel. As you turn each page, you constantly anticipate what happens next based strictly on the clues you have read so far. You are never allowed to peek ahead at the final chapter (causal masking). If you read ten thousand mystery novels in this manner, you do not merely learn vocabulary: you learn the laws of physics, human psychology, forensic detective procedure, and dramatic narrative structure—because accurately guessing the next word requires understanding the world that generated the text.`,
    steps: [
      {
        title: r`Tokenise text with Byte Pair Encoding (BPE)`,
        desc: r`Segment continuous text into subword token IDs using byte-level BPE.`,
        detail: r`Process input text into an array of subword integers using byte-level Byte Pair Encoding. Prepend positional encodings to token embeddings to track linear word order.`,
      },
      {
        title: r`Apply causal lower-triangular attention mask`,
        desc: r`Mask upper-triangular attention dot products with negative infinity.`,
        detail: r`Compute query-key attention matrix Q * K^T / sqrt(d_k). Add additive causal mask M, where M_{i, j} = 0 for j <= i and M_{i, j} = -inf for j > i. Applying softmax ensures zero attention weight on future positions.`,
      },
      {
        title: r`Pass hidden states through stacked decoder Transformer blocks`,
        desc: r`Process features through masked multi-head self-attention and MLP feedforward layers.`,
        detail: r`Pass representations through L stacked decoder blocks using pre-layer normalisation (Pre-LN) and residual connections: x = x + Attention(LN(x)); x = x + MLP(LN(x)).`,
      },
      {
        title: r`Compute next-token cross-entropy loss across all positions`,
        desc: r`Project final layer states to vocabulary dimension and calculate shifted cross-entropy.`,
        detail: r`Project hidden states to logits over vocabulary |V|. Shift target labels by one position: state at position t predicts token w_{t+1}. Compute cross-entropy loss across all sequence positions simultaneously in parallel.`,
      },
      {
        title: r`Generate text autoregressively with KV caching`,
        desc: r`Predict next token iteratively while caching key and value tensors to accelerate inference.`,
        detail: r`Sample next token w_{t+1} using temperature, top-k, or top-p (nucleus) sampling. Store precomputed K and V projections in a KV cache to avoid recomputing past tokens, reducing per-token generation latency from O(T^2) to O(T).`,
      },
    ],
    math: [
      {
        h: r`Autoregressive sequence log-likelihood objective`,
        tex: r`\mathcal{L}_{\text{AR}}(\theta) = -\sum_{t=1}^T \log P(w_t \mid w_1, w_2, \dots, w_{t-1}; \theta)`,
        p: r`The causal language modelling objective trains network parameters $\theta$ to maximise the log-probability of every token conditioned strictly on its preceding context tokens, evaluated across the entire training corpus.`,
      },
      {
        h: r`Causal masked multi-head self-attention`,
        tex: r`\operatorname{Attention}(Q, K, V) = \operatorname{softmax}\left( \frac{Q K^T}{\sqrt{d_k}} + M \right) V, \quad M_{i, j} = \begin{cases} 0 & j \le i \\ -\infty & j > i \end{cases}`,
        p: r`The additive mask $M \in \mathbb{R}^{T \times T}$ contains $-\infty$ in its strict upper triangle. When passed through the softmax exponentiation, $\exp(-\infty) = 0$, ensuring future tokens receive exactly zero attention weight.`,
      },
      {
        h: r`Temperature-scaled next-token sampling distribution`,
        tex: r`P(w_t = v \mid w_{<t}) = \frac{\exp(z_v / \tau)}{\sum_{j=1}^{|V|} \exp(z_j / \tau)}`,
        p: r`Here $z_v$ is the raw unnormalised logit for token $v$, and $\tau > 0$ is the sampling temperature. Lower temperatures ($\tau \to 0$) approach greedy argmax decoding; higher temperatures ($\tau > 1$) flatten the distribution, increasing diversity.`,
      },
    ],
    keyPoints: [
      r`GPT models use a decoder-only Transformer architecture trained autoregressively on next-token prediction.`,
      r`Causal lower-triangular masking prevents tokens from attending to future positions, ensuring temporal validity.`,
      r`During training, teacher forcing enables parallel evaluation of all sequence positions in a single forward pass.`,
      r`Scaling model parameters, dataset volume, and training compute yields emergent capabilities like few-shot in-context learning.`,
      r`At inference time, Key-Value (KV) caching preserves past key and value vectors, avoiding redundant O(T^2) recomputations.`,
    ],
    pitfalls: [
      r`Neglecting causal masking in decoder training: Forgetting to apply the upper-triangular mask allows the model to see future tokens during self-attention, causing training loss to drop to zero while rendering generation completely broken.`,
      r`Quadratic inference slowdown without KV caching: Generating a sequence of length T by re-encoding all preceding tokens at every step takes O(T^2) operations. Always maintain a KV cache during generation to achieve O(1) step complexity.`,
      r`Greedy decoding degradation: Pure greedy argmax decoding (temperature = 0) frequently causes generative models to enter degenerate repetitive loops. Use nucleus (top-p) sampling with p in [0.9, 0.95] for creative text.`,
      r`Context window truncation without sliding buffers: Passing prompts longer than the model's context window (e.g. 2,048 or 4,096 tokens) triggers out-of-bounds indexing; ensure prompts are truncated or use rotary positional embeddings (RoPE) with context extension.`,
    ],
    code: r`import numpy as np

class MiniCausalAttention:
    """
    Simulation of Causal (Autoregressive) Multi-Head Self-Attention
    with lower-triangular masking and next-token generation.
    """
    def __init__(self, d_model=4):
        self.d_model = d_model
        
    def causal_attention(self, Q, K, V):
        """
        Compute causal masked self-attention.
        Q, K, V shapes: (seq_len, d_model)
        """
        T = Q.shape[0]
        # Scaled dot-product: (T x T)
        scores = np.dot(Q, K.T) / np.sqrt(self.d_model)
        
        # Upper-triangular mask of -inf
        mask = np.triu(np.full((T, T), -np.inf), k=1)
        masked_scores = scores + mask
        
        # Softmax over columns
        exp_scores = np.exp(masked_scores - np.max(masked_scores, axis=-1, keepdims=True))
        attn_weights = exp_scores / np.sum(exp_scores, axis=-1, keepdims=True)
        
        output = np.dot(attn_weights, V)
        return output, attn_weights

def sample_next_token(logits, temperature=0.7):
    """Temperature sampling over vocabulary logits."""
    scaled = logits / max(temperature, 1e-5)
    exp_l = np.exp(scaled - np.max(scaled))
    probs = exp_l / np.sum(exp_l)
    return np.random.choice(len(probs), p=probs), probs

# Sample sequence of 4 tokens
vocab = ["The", "neural", "network", "generates", "text", "smoothly"]
tokens = ["The", "neural", "network", "generates"]
T = len(tokens)

np.random.seed(42)
d = 4
mock_embeddings = np.random.randn(T, d)

attn_layer = MiniCausalAttention(d_model=d)
output, weights = attn_layer.causal_attention(mock_embeddings, mock_embeddings, mock_embeddings)

print(f"Causal Attention Weights Matrix (shape {T}x{T}):")
print("Notice strict zeros in upper triangle (tokens cannot look to the future):\n")
for i, tok in enumerate(tokens):
    row_str = " ".join([f"{w:6.3f}" for w in weights[i]])
    print(f"  Token {i} ('{tok:<9}'): [ {row_str} ]")

# Next-token prediction head simulation
mock_head_weights = np.random.randn(d, len(vocab))
last_hidden_state = output[-1]  # Representation of last token ('generates')
next_token_logits = np.dot(last_hidden_state, mock_head_weights)

sampled_idx, probs = sample_next_token(next_token_logits, temperature=0.7)
print(f"\nNext Token Predictions given: '{' '.join(tokens)}'")
for v_idx, word in enumerate(vocab):
    print(f"  P('{word}'): {probs[v_idx]:.4f}")
print(f"\nSampled next token: '{vocab[sampled_idx]}'")
`,
    quiz: [
      {
        q: r`Why do decoder-only GPT models apply a causal lower-triangular mask to the self-attention matrix?`,
        o: [
          r`To prevent each token from attending to future tokens, preserving strict autoregressive directionality so predictions depend only on past context`,
          r`To invert the matrix during backpropagation`,
          r`To double the throughput of floating-point operations on tensor cores`,
          r`To eliminate the need for training data`,
        ],
        a: 0,
        why: r`If tokens could attend to future positions, next-token prediction would be trivial because the model would simply copy the answer from position t+1. The causal mask forces attention weights on positions j > i to zero.`,
      },
      {
        q: r`What is the primary operational advantage of maintaining a Key-Value (KV) cache during autoregressive inference?`,
        o: [
          r`It stores precomputed key and value vectors for past tokens, avoiding redundant re-encoding of the entire prompt and reducing per-token generation complexity from O(T^2) to O(1)`,
          r`It compresses model weights from 16-bit to 4-bit precision`,
          r`It translates the output text into multiple languages simultaneously`,
          r`It allows the model to train without gradient updates`,
        ],
        a: 0,
        why: r`Because past tokens never change, their K and V projections are identical at every generation step. Storing them in a KV cache allows the model to compute attention for just the single newly generated token, yielding massive inference speedups.`,
      },
      {
        q: r`How does few-shot in-context learning in GPT-3 differ from standard fine-tuning?`,
        o: [
          r`In-context learning steers model outputs purely by providing natural language instructions and demonstration examples in the prompt without modifying any network weights via backpropagation`,
          r`In-context learning requires retraining the embedding layer on the test set`,
          r`In-context learning only works on classification tasks with two classes`,
          r`In-context learning requires access to model weight gradients`,
        ],
        a: 0,
        why: r`In-context learning is entirely gradient-free at inference time. The model relies on its pre-trained pattern recognition capabilities to condition on prompt demonstrations and infer the required mapping without parameter updates.`,
      },
    ],
    usedBy: [],
    prereq: ['bert-and-masked-language-models', 'transformer_networks'],
    related: ['bert-and-masked-language-models', 'transformer_networks', 'sentence-embeddings-and-sbert'],
    keywords: 'gpt generative pre-trained transformer autoregressive causal attention decoder language model radford in-context learning kv cache temperature sampling',
  },
  {
    "id": "neural-language-models",
    "short": "Neural Language Models: NNLM",
    "title": "Neural Language Models: From Bengio's N-gram NNLM to Recurrent Language Models",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Classical n-gram models struggle with zero-probability counts on unseen test sequences, necessitating complex backoff and smoothing (Kneser-Ney). The Bengio NNLM (2003) maps preceding context words to distributed continuous vectors, concatenating them into a hidden feedforward layer. Distributed representations enable automatic generalisation: learning about \"cat walks on a mat\" naturally transfers predictive probability to \"dog walks on a rug\". Computational bottlenecks in computing full vocabulary softmaxes prompted historical innovations like hierarchical softmax and negative sampling.",
    "lead": "Classical n-gram language models suffer from severe curse of dimensionality and sparsity, unable to share statistical strength across semantically similar words. Bengio's 2003 Neural Network Language Model (NNLM) introduced distributed word embeddings and continuous hidden layers, revolutionizing statistical language modelling and laying the groundwork for recurrent and transformer architectures.",
    "analogy": "Imagine a library catalogue that files every book in completely isolated, unindexed steel lockers. If you find a recipe for chocolate cake in Locker #104, you have no way to find a recipe for vanilla cake except by rummaging through every other locker at random. A neural language model organizes the library along a continuous thematic map where all dessert cookbooks sit on adjacent shelves.",
    "intuition": [
      "In classical statistical NLP, an n-gram model predicts the next word by looking up how many times that exact sequence of $n-1$ words appeared in the training library. If the training corpus contains \"The cat sat on the rug\", but never contains \"The dog sat on the carpet\", an n-gram model has zero probability for \"carpet\" following \"The dog sat on the\". It treats \"cat\" and \"dog\", and \"rug\" and \"carpet\", as completely unrelated discrete symbols. Bengio's breakthrough was to represent every word as a continuous coordinate in a dense embedding space. In this continuous space, \"dog\" is near \"cat\", and \"carpet\" is near \"rug\". When the neural network learns parameters that assign high probability to \"rug\" following \"cat\", that smooth mathematical function automatically assigns high probability to \"carpet\" following \"dog\". This continuous representation conquered the curse of dimensionality."
    ],
    "steps": [
      "Extract sliding n-gram windows: construct fixed-length historical context tuples $(w_{t-n+1}, \\dots, w_{t-1})$ and target token $w_t$.",
      "Look up distributed embeddings: project discrete token indices into continuous $d$-dimensional embedding vectors.",
      "Concatenate context representations: flatten individual word vectors into a single contiguous context vector.",
      "Compute hidden layer activations: apply linear transformation and non-linear activation (tanh) to model non-linear word interactions.",
      "Project to vocabulary logits: transform hidden representations into $|V|$-dimensional output scores.",
      "Normalise via softmax and optimise: compute cross-entropy loss against the true token and backpropagate gradients into both weights and embeddings."
    ],
    "math": [
      {
        "h": "Neural Language Models: From Bengio's N-gram NNLM to Recurrent Language Models formulation (Part 1)",
        "tex": "\\mathbf{x} = [\\mathbf{c}(w_{t-n+1}) \\,;\\, \\dots \\,;\\, \\mathbf{c}(w_{t-1})] \\in \\mathbb{R}^{(n-1)d}",
        "p": "The concatenated context vector passes through a non-linear hidden layer with weight matrix $\\mathbf{H}$ and bias $\\mathbf{d}$:"
      },
      {
        "h": "Neural Language Models: From Bengio's N-gram NNLM to Recurrent Language Models formulation (Part 2)",
        "tex": "\\mathbf{a} = \\tanh(\\mathbf{d} + \\mathbf{H}\\mathbf{x})",
        "p": "Output unnormalised logits $\\mathbf{y} \\in \\mathbb{R}^{|V|}$ combine hidden activations with direct skip connections:"
      },
      {
        "h": "Neural Language Models: From Bengio's N-gram NNLM to Recurrent Language Models formulation (Part 3)",
        "tex": "\\mathbf{y} = \\mathbf{b} + \\mathbf{W}\\mathbf{x} + \\mathbf{U}\\mathbf{a}",
        "p": "Predictive probability distribution over the vocabulary is calculated using the softmax function:"
      },
      {
        "h": "Neural Language Models: From Bengio's N-gram NNLM to Recurrent Language Models formulation (Part 4)",
        "tex": "P(w_t = i \\mid w_{t-n+1}, \\dots, w_{t-1}) = \\frac{\\exp(y_i)}{\\sum_{j=1}^{|V|} \\exp(y_j)}",
        "p": "Cross-entropy loss for true next token $w_t^*$ is formulated as:"
      },
      {
        "h": "Neural Language Models: From Bengio's N-gram NNLM to Recurrent Language Models formulation (Part 5)",
        "tex": "\\mathcal{L} = -\\log P(w_t^* \\mid w_{t-n+1}, \\dots, w_{t-1})",
        "p": "Cross-entropy loss for true next token $w_t^*$ is formulated as:"
      }
    ],
    "code": "import numpy as np\n\ndef softmax(z):\n    \"\"\"Numerically stable softmax.\"\"\"\n    shift_z = z - np.max(z)\n    exp_z = np.exp(shift_z)\n    return exp_z / np.sum(exp_z)\n\nclass BengioNNLM:\n    \"\"\"Simplified 3-gram Neural Network Language Model.\"\"\"\n    def __init__(self, vocab_size, embedding_dim, hidden_dim):\n        np.random.seed(42)\n        # Word embedding matrix C\n        self.C = np.random.randn(vocab_size, embedding_dim) * 0.1\n        # Hidden layer weights (context size = 2 for 3-gram)\n        self.H = np.random.randn(hidden_dim, 2 * embedding_dim) * 0.1\n        self.d = np.zeros(hidden_dim)\n        # Output vocabulary projection\n        self.U = np.random.randn(vocab_size, hidden_dim) * 0.1\n        self.b = np.zeros(vocab_size)\n        \n    def forward(self, w1_idx, w2_idx):\n        # 1. Lookup and concatenate embeddings\n        c1 = self.C[w1_idx]\n        c2 = self.C[w2_idx]\n        x = np.concatenate([c1, c2])\n        \n        # 2. Hidden layer with tanh activation\n        a = np.tanh(self.d + np.dot(self.H, x))\n        \n        # 3. Logits and softmax\n        logits = self.b + np.dot(self.U, a)\n        probs = softmax(logits)\n        return probs\n\n# Vocabulary setup\nvocab = {\"the\": 0, \"cat\": 1, \"dog\": 2, \"sat\": 3, \"on\": 4, \"rug\": 5, \"mat\": 6}\ninv_vocab = {v: k for k, v in vocab.items()}\n\nmodel = BengioNNLM(vocab_size=len(vocab), embedding_dim=4, hidden_dim=8)\n\n# Predict next word after context (\"the\", \"cat\")\nw1, w2 = vocab[\"the\"], vocab[\"cat\"]\nprobs = model.forward(w1, w2)\n\nprint(\"Predicted Next Word Probabilities for context: ['the', 'cat'] -> ?\")\nfor idx, p in enumerate(probs):\n    print(f\"  {inv_vocab[idx]:5} -> {p:.4f}\")\n\ntop_token = inv_vocab[np.argmax(probs)]\nprint(f\"\\nMost likely continuation: '{top_token}'\")",
    "keyPoints": [
      "Bengio's NNLM pioneered continuous distributed word embeddings to conquer the combinatorial sparsity of classical n-grams.",
      "Projecting discrete words into continuous vector space allows models to generalise seamlessly across synonymous expressions.",
      "Softmax vocabulary bottlenecks motivated historical innovations including hierarchical softmax, noise-contrastive estimation, and modern subword tokenisation."
    ],
    "pitfalls": [
      "Suffering extreme training latency due to full vocabulary softmax computation; when $|V| > 100,000$, standard softmax backpropagation becomes prohibitively slow.",
      "Treating context as a fixed window; like n-gram models, early NNLMs cannot access dependencies beyond their predetermined input window size $n-1$.",
      "Over-parameterising output projection matrix $\\mathbf{U}$, causing models to overfit rapidly on small text corpora."
    ],
    "quiz": [
      {
        "q": "What fundamental limitation of classical n-gram models did Bengio's NNLM solve?",
        "o": [
          "The inability to compute token probabilities on GPUs",
          "The inability to share statistical strength across semantically similar words due to discrete symbol representations",
          "The inability to parse punctuation marks in Latin scripts",
          "The inability to calculate cross-entropy loss"
        ],
        "a": 1,
        "why": "Classical n-grams treat words as discrete, independent symbols. Bengio's continuous word embeddings allow statistical learning from one phrase to generalise smoothly to synonymous phrases."
      },
      {
        "q": "Where did the primary computational bottleneck lie in Bengio's original 2003 NNLM architecture?",
        "o": [
          "Inverting the Hessian matrix during gradient updates",
          "Computing the normalising denominator of the softmax function across the full vocabulary size $|V|$",
          "Looking up vectors in the embedding matrix",
          "Calculating the hyperbolic tangent tanh activation"
        ],
        "a": 1,
        "why": "Evaluating the softmax denominator requires computing dot products across all $|V|$ words in the vocabulary for every single token prediction, scaling linearly with dictionary size."
      },
      {
        "q": "How did Bengio's NNLM handle a context of $n-1$ words in its input layer?",
        "o": [
          "By averaging all sentence words using bag-of-words",
          "By looking up each word's embedding vector and concatenating them into a single continuous vector",
          "By running an autoregressive transformer with causal masking",
          "By sorting the words into alphabetical order"
        ],
        "a": 1,
        "why": "The NNLM looked up the continuous embedding for each context word and concatenated them into a fixed-length vector $\\mathbf{x} \\in \\mathbb{R}^{(n-1)d}$."
      }
    ],
    "related": [
      "lstm_networks",
      "transformer_networks"
    ],
    "keywords": "neural language models, neural language models: from bengio's n-gram nnlm to recurrent language models, natural language processing, deep learning"
  },
  {
    "id": "instruction-tuning-rlhf-and-dpo",
    "short": "Instruction Tuning, RLHF & DPO",
    "title": "Instruction Tuning, RLHF, and Direct Preference Optimisation (DPO)",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Base language models optimise next-token prediction, frequently producing toxic, repetitive, or unhelpful completions when prompted with instructions. Supervised Fine-Tuning (SFT) trains models on curated instruction-response dialogues, teaching conversational format and task execution. RLHF trains a reward model on pairwise human comparisons, optimising the policy using PPO while constraining policy drift via KL divergence penalties. Direct Preference Optimisation (DPO) derives an exact closed-form algebraic substitution that optimises preference loss directly on policy weights without a separate reward model or RL loop.",
    "lead": "Pretrained base language models are raw sequence completers that mimic internet text rather than helpful assistants. Transforming base models into aligned, instruction-following assistants requires supervised fine-tuning (SFT), Reinforcement Learning from Human Feedback (RLHF) with reward modelling, and modern reference-model-implicit formulations such as Direct Preference Optimisation (DPO).",
    "analogy": "Teaching an LLM is like training an apprentice chef. Pretraining is reading every recipe book in the national archives. SFT is culinary school, where the apprentice cooks exact dishes following instructor demonstrations. RLHF is having a food critic taste two dishes side-by-side and give critique scores. DPO is giving the apprentice a clear side-by-side photo journal of delicious dishes versus burnt dishes, allowing them to adjust their seasoning directly without needing the critic present in the kitchen.",
    "intuition": [
      "If you give a base, un-tuned LLM the prompt \"Write a poem about the ocean\", it might complete the text with \"and explain its metre. Chapter 3: Poetry Analysis\" because it treats your prompt as an excerpt from a high school textbook. It lacks the concept of being an assistant that obeys instructions. Supervised Fine-Tuning (SFT) fixes this by training the model on hundreds of thousands of instruction-answer pairs. However, SFT alone struggles when there are multiple valid answers or nuanced trade-offs between conciseness, tone, and correctness. RLHF solves this by asking humans to rank multiple candidate answers (e.g. \"Response A is better than Response B\"). A reward model learns this human preference function, and the LLM is updated using reinforcement learning. DPO achieves the exact same mathematical objective as RLHF, but eliminates the complex reinforcement learning machinery by proving that the optimal policy can be trained directly on preferred vs dispreferred pairs using simple binary cross-entropy."
    ],
    "steps": [
      "Pretrain base foundation model: train autoregressive transformer on trillion-token web corpora for raw next-token prediction.",
      "Perform Supervised Fine-Tuning (SFT): fine-tune base weights on high-quality demonstration datasets of user instructions and ideal responses.",
      "Collect preference data: sample multiple candidate completions $(y_1, y_2)$ for prompt $x$ and collect human or AI annotator rankings $(y_w \\succ y_l)$.",
      "Train reward model (in classical RLHF): train scalar regression model $r_\\psi(x, y)$ using pairwise ranking loss.",
      "Optimise policy via PPO (classical RLHF): update policy network with actor-critic reinforcement learning and KL divergence penalty.",
      "Alternatively, apply DPO directly: compute implicit reward margins using policy $\\pi_\\theta$ and frozen reference model $\\pi_{\\text{ref}}$, updating $\\theta$ via standard gradient backpropagation."
    ],
    "math": [
      {
        "h": "Instruction Tuning, RLHF, and Direct Preference Optimisation (DPO) formulation (Part 1)",
        "tex": "\\max_\\pi \\mathbb{E}_{x \\sim \\mathcal{D}, y \\sim \\pi(y|x)} \\left[ r_\\psi(x, y) \\right] - \\beta \\mathbb{D}_{\\text{KL}}\\left( \\pi(y|x) \\,\\|\\, \\pi_{\\text{ref}}(y|x) \\right)",
        "p": "The closed-form theoretical optimum policy $\\pi^*(y|x)$ satisfies:"
      },
      {
        "h": "Instruction Tuning, RLHF, and Direct Preference Optimisation (DPO) formulation (Part 2)",
        "tex": "\\pi^*(y|x) = \\frac{1}{Z(x)} \\pi_{\\text{ref}}(y|x) \\exp\\left( \\frac{1}{\\beta} r(x, y) \\right)",
        "p": "Direct Preference Optimisation (DPO) inverts this relationship to express ground-truth reward strictly in terms of policy log-probabilities:"
      },
      {
        "h": "Instruction Tuning, RLHF, and Direct Preference Optimisation (DPO) formulation (Part 3)",
        "tex": "r(x, y) = \\beta \\log \\frac{\\pi(y|x)}{\\pi_{\\text{ref}}(y|x)} + \\beta \\log Z(x)",
        "p": "Substituting this into the Bradley-Terry preference model $P(y_w \\succ y_l \\mid x) = \\sigma(r(x, y_w) - r(x, y_l))$ eliminates $Z(x)$ and yields the DPO objective:"
      },
      {
        "h": "Instruction Tuning, RLHF, and Direct Preference Optimisation (DPO) formulation (Part 4)",
        "tex": "\\mathcal{L}_{\\text{DPO}}(\\pi_\\theta; \\pi_{\\text{ref}}) = - \\mathbb{E}_{(x, y_w, y_l)} \\left[ \\log \\sigma \\left( \\beta \\log \\frac{\\pi_\\theta(y_w|x)}{\\pi_{\\text{ref}}(y_w|x)} - \\beta \\log \\frac{\\pi_\\theta(y_l|x)}{\\pi_{\\text{ref}}(y_l|x)} \\right) \\right]",
        "p": "Substituting this into the Bradley-Terry preference model $P(y_w \\succ y_l \\mid x) = \\sigma(r(x, y_w) - r(x, y_l))$ eliminates $Z(x)$ and yields the DPO objective:"
      }
    ],
    "code": "import numpy as np\n\ndef sigmoid(z):\n    \"\"\"Numerically stable sigmoid function.\"\"\"\n    return 1.0 / (1.0 + np.exp(-np.clip(z, -30, 30)))\n\ndef dpo_loss(pi_logps_win, pi_logps_lose, ref_logps_win, ref_logps_lose, beta=0.1):\n    \"\"\"Computes Direct Preference Optimisation (DPO) loss and implicit rewards.\n    \n    pi_logps: sum of token log-probabilities under policy network pi_theta\n    ref_logps: sum of token log-probabilities under frozen reference network pi_ref\n    \"\"\"\n    # Compute log-ratios for winning and losing responses\n    pi_diff = pi_logps_win - pi_logps_lose\n    ref_diff = ref_logps_win - ref_logps_lose\n    \n    # Margin: beta * [log(pi_w / ref_w) - log(pi_l / ref_l)]\n    logits = beta * (pi_diff - ref_diff)\n    \n    # DPO Loss = -log(sigmoid(logits))\n    loss = -np.log(sigmoid(logits) + 1e-12)\n    \n    # Implicit reward scores\n    reward_win = beta * (pi_logps_win - ref_logps_win)\n    reward_lose = beta * (pi_logps_lose - ref_logps_lose)\n    \n    return loss, reward_win, reward_lose\n\n# Simulation: Prompt = \"Explain why the sky is blue\"\n# Response Winner (clear, helpful): y_w\n# Response Loser (toxic, incorrect): y_l\n\n# Initial reference log-probabilities (frozen SFT model)\nref_win = -12.4\nref_lose = -13.1\n\n# Policy before alignment (similar likelihoods)\npi_win_initial = -12.3\npi_lose_initial = -13.0\n\nloss_initial, r_w_init, r_l_init = dpo_loss(\n    pi_win_initial, pi_lose_initial, ref_win, ref_lose, beta=0.1\n)\n\n# Policy after DPO training (increased probability on winner, decreased on loser)\npi_win_trained = -10.5\npi_lose_trained = -16.2\n\nloss_trained, r_w_opt, r_l_opt = dpo_loss(\n    pi_win_trained, pi_lose_trained, ref_win, ref_lose, beta=0.1\n)\n\nprint(f\"Initial DPO Loss: {loss_initial:.4f} | Margin: {(r_w_init - r_l_init):.3f}\")\nprint(f\"Trained DPO Loss: {loss_trained:.4f} | Margin: {(r_w_opt - r_l_opt):.3f}\")\nprint(f\"Implicit Reward (Winner): {r_w_opt:.3f} | Implicit Reward (Loser): {r_l_opt:.3f}\")",
    "keyPoints": [
      "Alignment bridges the gap between raw web completion and reliable, helpful assistant behaviour.",
      "RLHF combines human preference ranking, reward modelling, and KL-regularised PPO policy optimisation.",
      "DPO achieves equivalent mathematical alignment using a stable, closed-form binary cross-entropy loss directly on the policy network."
    ],
    "pitfalls": [
      "Allowing policy drift without KL divergence regularisation; the model exploits imperfections in the reward model (reward hacking), producing nonsensical repetitive prose.",
      "Applying DPO without an initial Supervised Fine-Tuning (SFT) phase; DPO assumes the reference policy is already in-distribution for the prompt format.",
      "Using noisy, inconsistent preference annotations where annotators disagree on subjective quality, creating conflicting gradient signals."
    ],
    "quiz": [
      {
        "q": "What is the primary role of the KL divergence penalty $\\beta \\mathbb{D}_{\\text{KL}}(\\pi \\,\\|\\, \\pi_{\\text{ref}})$ during RLHF training?",
        "o": [
          "To force the model to output shorter sentences",
          "To prevent the policy model from drifting too far from the initial SFT model and exploiting reward model loopholes",
          "To increase the generation temperature during decoding",
          "To quantise weights into 8-bit integers"
        ],
        "a": 1,
        "why": "Without the KL constraint, the reinforcement learning policy exploits imperfections in the learned reward model (reward hacking), collapsing text coherence."
      },
      {
        "q": "How does Direct Preference Optimisation (DPO) simplify the alignment pipeline compared to standard PPO-based RLHF?",
        "o": [
          "DPO requires no training data whatsoever",
          "DPO replaces neural networks with decision trees",
          "DPO reparameterises the reward model directly into the policy log-probabilities, eliminating the need to train a separate reward model or run RL sampling loops",
          "DPO eliminates the need for reference models"
        ],
        "a": 2,
        "why": "DPO shows that the reward function can be analytically substituted with policy log-ratios, transforming preference alignment into a straightforward supervised binary classification loss."
      },
      {
        "q": "What is the purpose of the initial Supervised Fine-Tuning (SFT) stage before preference alignment?",
        "o": [
          "To train the subword tokeniser vocabulary",
          "To adapt the raw foundation model to follow conversational prompt formats and generate coherent initial responses",
          "To compute validation perplexity on Wikipedia articles",
          "To evaluate hardware cache memory usage"
        ],
        "a": 1,
        "why": "Base models are pre-trained for raw web text completion; SFT teaches the model the basic instruction-following and question-answering dialogue format."
      }
    ],
    "related": [
      "prompting-and-in-context-learning",
      "evaluating-llms-benchmarks-and-judges"
    ],
    "keywords": "instruction tuning rlhf and dpo, instruction tuning, rlhf, and direct preference optimisation (dpo), natural language processing, deep learning"
  },
  {
    "id": "long-context-and-efficient-attention",
    "short": "Long Context & FlashAttention",
    "title": "Long Context and Efficient Attention: FlashAttention, RoPE Scaling, and Sparse Mechanisms",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Standard attention requires materializing an $N \\times N$ affinity matrix in high-bandwidth memory (HBM), causing GPU memory bandwidth bottlenecks. FlashAttention restructures computation via online softmax tiling and kernel fusion, executing full exact attention in SRAM with $\\mathcal{O}(N)$ memory footprint. Rotary Position Embedding (RoPE) encodes relative positional distances into complex plane rotations; RoPE scaling (YaRN, NTK-aware) extends context beyond pretraining lengths. Sparse attention (local sliding windows, global landmarks, BigBird, Longformer) and linear attention mechanisms offer sub-quadratic scaling alternatives.",
    "lead": "Standard self-attention scales quadratically with sequence length ($\\mathcal{O}(N^2)$), creating prohibitive memory and computational bottlenecks for long-context language modelling. Breakthroughs including FlashAttention (tiling IO awareness), Rotary Position Embedding (RoPE) frequency scaling, and sparse linear approximations unlock hundred-thousand-token context windows.",
    "analogy": "Imagine an accountant reconciling a 1,000-page bank ledger. Standard attention requires laying out a million comparison cards across a massive football field, forcing the accountant to spend hours jogging between cards just to read them. FlashAttention is an accountant who sits at a small desk with a pocket notepad, checking transactions in small bundles of 50 and updating a running subtotal without ever needing the football field.",
    "intuition": [
      "If you double the length of a book given to a standard transformer from 2,000 words to 4,000 words, the self-attention memory does not double: it quadruples ($2^2 = 4$). At 32,000 or 128,000 tokens, standard GPUs run out of memory simply allocating the attention matrix $\\mathbf{Q}\\mathbf{K}^T$, even though the final output is just another $N \\times d$ matrix! FlashAttention recognized that modern GPUs are memory-bound rather than compute-bound: reading and writing intermediate $N \\times N$ attention scores to GPU High Bandwidth Memory (HBM) is vastly slower than computing mathematical operations in on-chip SRAM cache. By breaking $\\mathbf{Q}, \\mathbf{K}, \\mathbf{V}$ into small tiles and incrementally updating the softmax denominator on the fly (online softmax), FlashAttention computes exact attention entirely inside fast SRAM without ever writing the massive $N \\times N$ matrix to main memory."
    ],
    "steps": [
      "Partition input matrices: divide $\\mathbf{Q}, \\mathbf{K}, \\mathbf{V}$ into small contiguous blocks (tiles) sized to fit inside GPU on-chip SRAM cache.",
      "Execute outer loop over key-value blocks: load $\\mathbf{K}_j, \\mathbf{V}_j$ into SRAM.",
      "Execute inner loop over query blocks: load $\\mathbf{Q}_i$ and compute block affinity scores $\\mathbf{S}_{ij} = \\mathbf{Q}_i \\mathbf{K}_j^T / \\sqrt{d}$.",
      "Compute online softmax update: maintain running maximum $m_i$ and running sum $\\ell_i$, rescaling prior accumulated output $\\mathbf{O}_i$ before adding new partial products.",
      "Write final outputs to HBM: transfer completed block $\\mathbf{O}_i$ to main memory once all key-value tiles have been processed.",
      "Scale positional encodings: adjust RoPE frequencies via YaRN or NTK interpolation to preserve relative angular distances over expanded sequence lengths."
    ],
    "math": [
      {
        "h": "Long Context and Efficient Attention: FlashAttention, RoPE Scaling, and Sparse Mechanisms Objective Function",
        "tex": "\\mathcal{L}_{\\text{total}} = \\sum_{i=1}^N \\ell(f(x_i), y_i)",
        "p": "Optimisation objective and loss formulation for long context and efficient attention: flashattention, rope scaling, and sparse mechanisms."
      }
    ],
    "code": "import numpy as np\n\ndef standard_attention(Q, K, V):\n    \"\"\"Standard attention materialising full N x N matrix in memory.\"\"\"\n    d_k = Q.shape[-1]\n    scores = np.matmul(Q, K.T) / np.sqrt(d_k)\n    # Full N x N softmax\n    exp_scores = np.exp(scores - np.max(scores, axis=-1, keepdims=True))\n    weights = exp_scores / np.sum(exp_scores, axis=-1, keepdims=True)\n    return np.matmul(weights, V), weights\n\ndef tiled_online_attention(Q, K, V, block_size=4):\n    \"\"\"Simulates FlashAttention's tiled online softmax algorithm.\"\"\"\n    N, d = Q.shape\n    O = np.zeros((N, d))\n    ell = np.zeros(N)\n    m = np.full(N, -np.inf)\n    \n    # Process in tiles (blocks)\n    for j_start in range(0, N, block_size):\n        K_block = K[j_start:j_start + block_size]\n        V_block = V[j_start:j_start + block_size]\n        \n        for i_start in range(0, N, block_size):\n            Q_block = Q[i_start:i_start + block_size]\n            \n            # Tile affinity: shape (block_size, block_size)\n            S_ij = np.matmul(Q_block, K_block.T) / np.sqrt(d)\n            \n            # Online softmax update per row\n            for row in range(S_ij.shape[0]):\n                global_row = i_start + row\n                m_prev = m[global_row]\n                m_curr = np.max(S_ij[row])\n                m_new = max(m_prev, m_curr)\n                \n                exp_old = np.exp(m_prev - m_new) if m_prev != -np.inf else 0.0\n                exp_new = np.exp(S_ij[row] - m_new)\n                \n                ell_new = exp_old * ell[global_row] + np.sum(exp_new)\n                \n                # Rescale prior accumulator and add new contribution\n                O[global_row] = (exp_old * ell[global_row] * O[global_row] + \n                                np.dot(exp_new, V_block)) / ell_new\n                \n                m[global_row] = m_new\n                ell[global_row] = ell_new\n                \n    return O\n\n# Test numerical equivalence\nnp.random.seed(42)\nN, d = 16, 8\nQ = np.random.randn(N, d)\nK = np.random.randn(N, d)\nV = np.random.randn(N, d)\n\nO_standard, P = standard_attention(Q, K, V)\nO_tiled = tiled_online_attention(Q, K, V, block_size=4)\n\nmax_diff = np.max(np.abs(O_standard - O_tiled))\nprint(f\"Standard Attention Output Shape: {O_standard.shape}\")\nprint(f\"Tiled Attention Output Shape:    {O_tiled.shape}\")\nprint(f\"Maximum Numerical Difference:    {max_diff:.8e}\")\nassert max_diff < 1e-6\nprint(\"Verification successful: Tiled online attention matches exact softmax!\")",
    "keyPoints": [
      "Memory IO bandwidth—not compute FLOPs—is the primary bottleneck in long-context attention.",
      "FlashAttention achieves exact attention with $\\mathcal{O}(N)$ memory footprint through kernel fusion and online softmax tiling.",
      "Rotary Position Embedding combined with frequency scaling allows models to expand effective context windows seamlessly."
    ],
    "pitfalls": [
      "Assuming FlashAttention is an approximation; FlashAttention is mathematically exact and computes the identical output as standard softmax attention.",
      "Extrapolating context length with naive linear RoPE position interpolation without adjusting high-frequency dimensions, destroying local grammatical representations.",
      "Ignoring KV-cache memory during long-context autoregressive generation; serving a 128k context model requires tens of gigabytes of VRAM purely for cached keys and values."
    ],
    "quiz": [
      {
        "q": "Why is FlashAttention substantially faster than standard self-attention on modern GPUs?",
        "o": [
          "It replaces floating-point math with integer lookup tables",
          "It tiles computation to compute exact softmax within fast on-chip SRAM, eliminating slow reads and writes of the $N \\times N$ matrix to HBM",
          "It drops 50% of attention heads at random",
          "It changes the transformer to an RNN architecture"
        ],
        "a": 1,
        "why": "FlashAttention is IO-aware: it fuses the attention computation into a single kernel and computes online softmax updates within fast on-chip SRAM, bypassing memory bandwidth bottlenecks."
      },
      {
        "q": "What is the primary mechanism of Rotary Position Embedding (RoPE)?",
        "o": [
          "Adding static sinusoidal vectors directly to input word embeddings",
          "Rotating 2D pairs of query and key vector dimensions by angles proportional to their absolute token index",
          "Replacing self-attention with causal convolutional filters",
          "Hashing token positions into prime modulo buckets"
        ],
        "a": 1,
        "why": "RoPE applies 2D rotation matrices to pairs of coordinates in $\\mathbf{q}$ and $\\mathbf{k}$, ensuring that their inner product $\\mathbf{q}_m^T \\mathbf{k}_n$ naturally reflects relative distance $m-n$."
      },
      {
        "q": "What mathematical property allows online softmax to evaluate attention across tiled blocks incrementally?",
        "o": [
          "Softmax can be rescaled dynamically by tracking running maximums $m$ and normalisation denominators $\\ell$",
          "Softmax is completely linear",
          "Softmax does not require exponentials",
          "Softmax ignores numbers below 0"
        ],
        "a": 0,
        "why": "By maintaining running maximum values and scaling denominators, intermediate exponentiated terms can be rescaled and accumulated across streaming blocks without loss of mathematical precision."
      }
    ],
    "related": [
      "gpt-and-decoder-only-models",
      "serving-latency-and-cost"
    ],
    "keywords": "long context and efficient attention, long context and efficient attention: flashattention, rope scaling, and sparse mechanisms, natural language processing, deep learning"
  },
  {
    "id": "hallucination-and-factuality",
    "short": "Hallucination & Factuality",
    "title": "Hallucination and Factuality in LLMs: Detection, Calibration, and Grounding",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Hallucinations divide into closed-domain unfaithfulness (contradicting provided source context) and open-domain factual fabrication (violating external world knowledge). Root causes include knowledge boundary deficits in pretraining corpora, exposure bias, out-of-distribution prompts, and sycophantic alignment incentives. Detection frameworks leverage self-consistency sampling, internal hidden-state probes, and automated LLM-as-a-judge fact verification (FactScore). Mitigation techniques combine external retrieval augmentation (RAG), verifiable citations, calibrated decoding temperatures, and constrained generation.",
    "lead": "Large language models are probabilistic sequence generators optimised for grammatical fluency rather than factual truth, frequently producing confident but fabricated assertions known as hallucinations. Quantifying factuality requires taxonomy separation (faithfulness vs factual correctness), uncertainty calibration, self-consistency probes, and retrieval grounding.",
    "analogy": "Imagine a charismatic student taking an oral exam who has memorized thousands of textbook phrases but never actually conducted an experiment. When asked a difficult question about a subject they do not know, their instinct is to improvise a polished, impressive-sounding answer rather than admit ignorance. Grounding is requiring the student to point to an open textbook page for every single claim they make.",
    "intuition": [
      "When an LLM produces text, it does not query an internal database of certified facts; it samples the next token according to conditional likelihood $P(w_t \\mid w_{<t})$. A sentence like \"Neil Armstrong walked on Mars in 1973\" has high syntactic plausibility and uses familiar space-exploration terminology, so the model may assign it high conditional probability if conditioned on ambiguous context. Because the model has no built-in distinction between true historical events and plausible-sounding fiction, it asserts falsehoods with the exact same fluent, authoritative tone as verifiable facts. Measuring and mitigating hallucination requires grounding outputs in retrieved evidence documents and testing whether the model's internal token probabilities reflect true calibration uncertainty."
    ],
    "steps": [
      "Extract atomic claims: parse complex generated answers into independent, testable proposition statements (atomic facts).",
      "Retrieve reference evidence: perform dense or hybrid search across authoritative knowledge corpora for each atomic proposition.",
      "Verify entailment: use a fine-tuned NLI model or cross-encoder to classify whether the retrieved text entails, contradicts, or is neutral toward the claim.",
      "Probe generation confidence: measure token-level predictive entropy and logit margins along with semantic self-consistency across diverse decoding paths.",
      "Enforce grounding constraints: instruct the model to produce verifiable citations and refuse generation when retrieval confidence falls below threshold."
    ],
    "math": [
      {
        "h": "Hallucination and Factuality in LLMs: Detection, Calibration, and Grounding formulation (Part 1)",
        "tex": "P(\\text{Faithful} \\mid D, C) = P(\\text{Entailment} \\mid D, C)",
        "p": "FactScore decomposes a generated response $Y$ into a list of atomic factual claims $\\{c_1, \\dots, c_K\\}$, scoring overall precision against knowledge source $\\mathcal{K}$:"
      },
      {
        "h": "Hallucination and Factuality in LLMs: Detection, Calibration, and Grounding formulation (Part 2)",
        "tex": "\\text{FactScore}(Y, \\mathcal{K}) = \\frac{1}{K} \\sum_{k=1}^K \\mathbb{I}(c_k \\text{ is supported by } \\mathcal{K})",
        "p": "Expected Calibration Error (ECE) evaluates whether model confidence $p_i$ matches true accuracy across $M$ probability bins $B_m$:"
      },
      {
        "h": "Hallucination and Factuality in LLMs: Detection, Calibration, and Grounding formulation (Part 3)",
        "tex": "\\text{ECE} = \\sum_{m=1}^M \\frac{|B_m|}{N} \\left| \\text{acc}(B_m) - \\text{conf}(B_m) \\right|",
        "p": "Self-consistency entropy measures uncertainty across $S$ sampled completions $\\{y_1, \\dots, y_S\\}$:"
      },
      {
        "h": "Hallucination and Factuality in LLMs: Detection, Calibration, and Grounding formulation (Part 4)",
        "tex": "\\mathcal{H}(Y \\mid X) = - \\sum_{u \\in \\text{Unique}(Y)} P(u \\mid X) \\log_2 P(u \\mid X)",
        "p": "Self-consistency entropy measures uncertainty across $S$ sampled completions $\\{y_1, \\dots, y_S\\}$:"
      }
    ],
    "code": "import numpy as np\n\ndef evaluate_factscore(atomic_claims, knowledge_base):\n    \"\"\"Evaluates factual precision of extracted claims against verified knowledge.\"\"\"\n    supported_flags = []\n    \n    for claim in atomic_claims:\n        subject, predicate, obj = claim\n        # Check if relation exists in verified knowledge tuples\n        is_supported = any(\n            k_sub == subject and k_pred == predicate and k_obj == obj\n            for (k_sub, k_pred, k_obj) in knowledge_base\n        )\n        supported_flags.append(is_supported)\n        \n    precision = np.mean(supported_flags)\n    return precision, supported_flags\n\ndef self_consistency_entropy(sampled_answers):\n    \"\"\"Computes semantic agreement entropy across multiple stochastic generations.\"\"\"\n    unique_answers, counts = np.unique(sampled_answers, return_counts=True)\n    probs = counts / np.sum(counts)\n    entropy = -np.sum(probs * np.log2(probs + 1e-12))\n    return entropy, unique_answers[np.argmax(counts)]\n\n# Verified Knowledge Base (Subject, Predicate, Object)\nkb = [\n    (\"Alan Turing\", \"born_in\", \"London\"),\n    (\"Alan Turing\", \"died_in\", \"Wilmslow\"),\n    (\"Alan Turing\", \"invented\", \"Turing Machine\")\n]\n\n# Model output decomposed into atomic claims\nclaims_to_audit = [\n    (\"Alan Turing\", \"born_in\", \"London\"),      # Factually correct\n    (\"Alan Turing\", \"invented\", \"Turing Machine\"), # Factually correct\n    (\"Alan Turing\", \"born_in\", \"Cambridge\")     # Hallucinated contradiction!\n]\n\nfact_score, flags = evaluate_factscore(claims_to_audit, kb)\n\n# Self-consistency sampling across 5 runs\nsamples = [\"London\", \"London\", \"London\", \"Cambridge\", \"London\"]\nentropy, consensus = self_consistency_entropy(samples)\n\nprint(f\"FactScore Precision: {fact_score * 100:.1f}%\")\nfor claim, passed in zip(claims_to_audit, flags):\n    status = \"VERIFIED\" if passed else \"HALLUCINATION\"\n    print(f\"  {claim} -> [{status}]\")\n\nprint(f\"\\nSelf-Consistency Consensus Answer: '{consensus}'\")\nprint(f\"Sampling Uncertainty Entropy: {entropy:.3f} bits\")",
    "keyPoints": [
      "LLMs generate syntactically plausible sequences without intrinsic awareness of empirical truth.",
      "FactScore provides a granular evaluation framework by decomposing responses into testable atomic claims.",
      "Grounding generation in external retrieval systems and measuring semantic consistency dramatically reduces hallucination rates."
    ],
    "pitfalls": [
      "Confusing linguistic fluency with factual veracity; models are frequently most eloquent when delivering complete fabrications.",
      "Relying solely on perplexity or generation loss to identify hallucinations; incorrect statements often have low perplexity because they use common words.",
      "Evaluating factuality using an LLM judge without providing ground-truth reference material, causing the judge model to hallucinate its own evaluation."
    ],
    "quiz": [
      {
        "q": "What is the primary difference between faithfulness and factual correctness in language generation?",
        "o": [
          "Faithfulness evaluates consistency with provided input context; factual correctness evaluates truthfulness against real-world knowledge",
          "Faithfulness measures grammar, while factual correctness measures spelling",
          "Faithfulness is only relevant in translation tasks",
          "There is no distinction; both terms denote identical concepts"
        ],
        "a": 0,
        "why": "Faithfulness assesses whether the model remains true to the specific reference document provided in the prompt, whereas factual correctness evaluates consistency with external world facts."
      },
      {
        "q": "How does the FactScore metric measure the factuality of long-form biographical text?",
        "o": [
          "By counting the total character count of the document",
          "By breaking down generated text into atomic propositions and computing the percentage supported by a trusted reference source",
          "By calculating the BLEU score against Wikipedia articles",
          "By measuring the GPU inference time"
        ],
        "a": 1,
        "why": "FactScore decomposes complex paragraphs into discrete atomic claims and verifies what fraction of those individual facts are corroborated by reference texts."
      },
      {
        "q": "Why does self-consistency sampling help identify potential hallucinations in reasoning tasks?",
        "o": [
          "Hallucinated responses typically show high variance and low agreement across diverse random seeds, while robust facts show high consensus",
          "Sampling multiple times eliminates all GPU memory overhead",
          "It forces the model to generate shorter answers",
          "It replaces temperature sampling with greedy argmax decoding"
        ],
        "a": 0,
        "why": "When a model lacks genuine certainty, diverse temperature-sampled generations diverge wildly into different fabrications, producing high entropy and signalling potential hallucinations."
      }
    ],
    "related": [
      "semantic-search-and-dense-retrieval",
      "instruction-tuning-rlhf-and-dpo"
    ],
    "keywords": "hallucination and factuality, hallucination and factuality in llms: detection, calibration, and grounding, natural language processing, deep learning"
  },
  {
    id: 'text-classification-and-sentiment',
    short: 'Text Classification & Sentiment',
    title: 'Text classification and sentiment',
    task: 'concepts',
    module: 'Tasks and evaluation',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Text classification maps variable-length natural language documents into discrete categorical classes, serving as the backbone for sentiment analysis, spam detection, topic tagging, and intent routing. Modern text classification encompasses a spectrum of techniques: from fast linear baselines (TF-IDF with Naive Bayes, Logistic Regression, or Support Vector Machines) to fine-tuned contextual Transformers using pooled [CLS] representations. Handling linguistic subtleties such as negation, sarcasm, class imbalance, and domain shift is essential for reliable production systems.`,
    lead: r`Is the customer review "The hotel room was not bad, but I definitely wouldn't call it luxurious" positive, negative, or neutral? To a naive keyword spotter, the word "bad" flags negative, while "luxurious" flags positive. Effective text classification requires looking past isolated surface words to model compositionality, scope of negation, and subjective stance across whole sentences.`,
    intuition: [
      r`The spectrum of text classification: Text classification problems vary widely in cardinality and structure:
- Binary Classification: Spam vs Ham, Positive vs Negative sentiment.
- Multi-Class Classification: Routing customer support tickets to one of 20 departments (mutually exclusive).
- Multi-Label Classification: Tagging an academic paper with multiple research topics (e.g. both 'Computer Science' and 'Quantitative Biology').
- Fine-Grained Sentiment & Aspect-Based Sentiment Analysis (ABSA): Extracting sentiment targets and associated polarities independently (e.g. food: positive, price: negative).`,
      r`Linear baselines versus deep contextual encoders: A simple TF-IDF representation combined with a linear classifier (Logistic Regression or SVM) provides an extraordinarily competitive baseline: it trains in seconds, evaluates in microseconds, and requires minimal compute. However, bag-of-words linear models fail when word order alters meaning ("not good" vs "good"). Pre-trained Transformer models (BERT, RoBERTa) capture subtle syntactic negation and long-range dependencies, delivering top accuracy when computational budget permits.`,
      r`The challenge of linguistic negation and sarcasm: Negation words ("not", "never", "hardly", "no") invert the emotional polarity of subsequent terms. In classical pipelines, bigrams or negation tagging (appending a _NEG suffix to words between a negative particle and subsequent punctuation) are required to capture polarity shifts. In ironic or sarcastic prose, literal sentiment words contradict intended meaning, posing severe challenges even for advanced neural architectures.`,
    ],
    analogy: r`Think of sorting mail in a bustling corporate post room. A simple linear classifier is like an automated sorting arm that glances at key return addresses or stamped labels ("INVOICE", "URGENT", "LEGAL") and tosses envelopes into corresponding bins at lightning speed. It works brilliantly for 90% of routine mail. A deep Transformer classifier is like an experienced executive assistant who reads the actual letter, detects subtle diplomatic tone, notices that a polite compliment was delivered with veiled frustration, and routes the document to the Chief Executive with an urgent warning flag.`,
    steps: [
      {
        title: r`Normalise and tokenise input documents`,
        desc: r`Clean text, handle contractions, and segment into word or subword tokens.`,
        detail: r`Clean raw text, expand contractions, and remove unwanted artifacts. For linear models, generate n-grams (unigrams and bigrams); for neural models, tokenise with WordPiece or BPE.`,
      },
      {
        title: r`Extract document feature representations`,
        desc: r`Convert text into numerical vectors via TF-IDF or deep Transformer pooling.`,
        detail: r`In linear pipelines: fit TF-IDF vectoriser on training text and compute normalised sparse vectors. In neural pipelines: feed tokens through a Transformer encoder and extract pooled [CLS] or mean token embeddings.`,
      },
      {
        title: r`Mitigate class imbalance in training splits`,
        desc: r`Apply class weighting or focal loss to balance skewed categorical distributions.`,
        detail: r`Calculate inverse class frequencies w_c = N / (C * N_c) and pass class weights to cross-entropy loss. Alternatively, tune decision thresholds or apply SMOTE on continuous dense vectors to prevent minority class neglect.`,
      },
      {
        title: r`Train classifier and optimise decision boundaries`,
        desc: r`Fit linear weights or fine-tune neural parameters on categorical cross-entropy.`,
        detail: r`Train classification parameters using convex optimisation (L-BFGS for Logistic Regression) or AdamW for neural fine-tuning. Monitor macro-averaged F1 score on validation splits to select early stopping checkpoints.`,
      },
      {
        title: r`Evaluate comprehensive performance metrics`,
        desc: r`Compute precision, recall, confusion matrices, and calibration curves.`,
        detail: r`Evaluate test performance using Macro F1 (unweighted class average) and Micro F1 (overall token accuracy). Inspect confusion matrices to identify systematic misclassifications between adjacent classes (e.g. 2-star vs 3-star ratings).`,
      },
    ],
    math: [
      {
        h: r`Multinomial Logistic Regression classification probability`,
        tex: r`P(y = c \mid \mathbf{x}) = \frac{\exp(\mathbf{w}_c^T \mathbf{x} + b_c)}{\sum_{j=1}^C \exp(\mathbf{w}_j^T \mathbf{x} + b_j)}`,
        p: r`Here $\mathbf{x} \in \mathbb{R}^d$ is the document feature vector (TF-IDF or pooled Transformer embedding), $\mathbf{w}_c \in \mathbb{R}^d$ is the learned weight vector for category $c$, and $C$ is the total number of classes.`,
      },
      {
        h: r`Cross-entropy loss with inverse class weighting`,
        tex: r`\mathcal{L}_{\text{CE}}(\theta) = -\sum_{i=1}^N \sum_{c=1}^C \alpha_c \, y_{i, c} \log \hat{y}_{i, c}, \quad \alpha_c = \frac{N}{C \cdot N_c}`,
        p: r`Here $N_c$ is the number of training samples in class $c$. Weighting factor $\alpha_c$ scales the penalty for errors on rare classes, counteracting severe majority class bias.`,
      },
      {
        h: r`Macro-averaged versus Micro-averaged F1 metrics`,
        tex: r`\operatorname{Macro-}F_1 = \frac{1}{C} \sum_{c=1}^C F_{1, c}, \quad \operatorname{Micro-}F_1 = \frac{2 \sum_{c} \operatorname{TP}_c}{2 \sum_c \operatorname{TP}_c + \sum_c \operatorname{FP}_c + \sum_c \operatorname{FN}_c}`,
        p: r`Macro-F1 assigns equal weight to every category regardless of sample frequency, making it the essential metric for imbalanced text classification. Micro-F1 pools global counts, mirroring overall accuracy.`,
      },
    ],
    keyPoints: [
      r`Text classification maps variable-length natural language text into discrete categorical labels.`,
      r`TF-IDF paired with linear classifiers (Logistic Regression, SVM) provides a formidable, fast baseline for production systems.`,
      r`Fine-tuned Transformer models (BERT, RoBERTa) capture syntactic negation, idioms, and long-range semantic dependencies.`,
      r`Negation words alter the polarity of subsequent phrases; capturing negation requires bigrams, suffix tagging, or bidirectional attention.`,
      r`Always evaluate imbalanced text classification using Macro-averaged F1 and confusion matrices rather than overall accuracy.`,
    ],
    pitfalls: [
      r`Evaluating on overall accuracy under severe class imbalance: If 95% of customer emails are spam, a dummy model predicting "spam" achieves 95% accuracy while completely failing on authentic emails. Always report Macro-F1 and per-class recall.`,
      r`Data leakage via global TF-IDF fitting: Fitting TF-IDF vectorisers on the combined train and test set leaks test vocabulary statistics into model features. Always fit vectorisers exclusively on training data.`,
      r`Ignoring domain shift in sentiment models: A sentiment model trained on IMDb film reviews fails on financial news (e.g. "shares plummeted" vs "a terrifying thriller"). Always validate models on representative in-domain text.`,
      r`Stripping negation stop words: Generic stop word removal lists frequently discard words like "not", "no", "never", completely reversing the sentiment polarity of sentences. Always preserve negation particles.`,
    ],
    code: r`import math
import re
from collections import defaultdict, Counter

class SimpleTextClassifier:
    """
    Multinomial Naive Bayes text classifier from scratch
    with Laplace smoothing and n-gram feature extraction.
    """
    def __init__(self, alpha=1.0):
        self.alpha = alpha
        self.classes = set()
        self.class_counts = Counter()
        self.word_counts = defaultdict(Counter)
        self.total_words_in_class = Counter()
        self.vocab = set()
        
    def _tokenize(self, text):
        # Extract unigrams and bigrams
        words = [w.lower() for w in re.findall(r'\b[a-zA-Z]+\b', text)]
        bigrams = [f"{words[i]}_{words[i+1]}" for i in range(len(words)-1)]
        return words + bigrams

    def fit(self, texts, labels):
        for text, label in zip(texts, labels):
            self.classes.add(label)
            self.class_counts[label] += 1
            tokens = self._tokenize(text)
            
            for token in tokens:
                self.vocab.add(token)
                self.word_counts[label][token] += 1
                self.total_words_in_class[label] += 1

    def predict(self, text):
        tokens = self._tokenize(text)
        total_docs = sum(self.class_counts.values())
        V = len(self.vocab)
        
        best_class = None
        best_log_prob = -float('inf')
        
        for c in self.classes:
            # Prior log P(c)
            log_prob = math.log(self.class_counts[c] / total_docs)
            
            # Likelihood sum log P(w|c) with Laplace smoothing
            denom = self.total_words_in_class[c] + self.alpha * V
            for token in tokens:
                if token in self.vocab:
                    count = self.word_counts[c][token]
                    prob_w = (count + self.alpha) / denom
                    log_prob += math.log(prob_w)
                    
            if log_prob > best_log_prob:
                best_log_prob = log_prob
                best_class = c
                
        return best_class

# Sample sentiment training corpus
train_reviews = [
    ("This movie was absolutely wonderful and charming", "positive"),
    ("Great acting, brilliant script, and delightful humor", "positive"),
    ("An inspiring masterpiece with unforgettable performances", "positive"),
    ("Terrible waste of time, boring and poorly directed", "negative"),
    ("Awful dialogue, horrible acting, completely predictable", "negative"),
    ("Dull, uninspired, and thoroughly disappointing experience", "negative")
]

texts, labels = zip(*train_reviews)
clf = SimpleTextClassifier(alpha=1.0)
clf.fit(texts, labels)

test_sentences = [
    "A wonderful performance with delightful acting",
    "Completely terrible and horribly boring",
    "Great script but poorly directed"
]

print("Text Classification & Sentiment Predictions:")
for test in test_sentences:
    pred = clf.predict(test)
    print(f"  Review: '{test}' -> Sentiment: {pred.upper()}")
`,
    quiz: [
      {
        q: r`Why is Macro-averaged F1 preferred over accuracy or Micro-averaged F1 for evaluating imbalanced text classification?`,
        o: [
          r`Because Macro-F1 calculates F1 for each class independently and averages them equally, ensuring rare minority classes contribute just as much to the final score as dominant majority classes`,
          r`Because Macro-F1 cannot be computed if any class has zero samples`,
          r`Because Macro-F1 is identical to Mean Squared Error`,
          r`Because Macro-F1 only evaluates binary classification`,
        ],
        a: 0,
        why: r`When one category contains 90% of samples, overall accuracy and Micro-F1 mirror performance on the dominant class. Macro-F1 computes unweighted arithmetic mean across all categories, penalising models that ignore minority classes.`,
      },
      {
        q: r`Why does naive stop word removal often degrade sentiment analysis model accuracy?`,
        o: [
          r`Because standard stop word lists frequently discard negation particles like "not", "never", and "hardly", inverting the intended semantic sentiment of phrases`,
          r`Because stop words are required to calculate cosine similarity`,
          r`Because Python cannot process strings without stop words`,
          r`Because stop words contain all the vowels in the English language`,
        ],
        a: 0,
        why: r`Stripping "not" turns "not bad" into "bad" and "not good" into "good", completely flipping sentiment polarity. Text classification pipelines for sentiment must preserve negation words or use bigrams.`,
      },
      {
        q: r`What advantage does fine-tuning a pre-trained Transformer (like BERT) offer over a TF-IDF + Logistic Regression baseline for complex sentiment classification?`,
        o: [
          r`The Transformer captures word order, compositional syntax, and long-range negation dependencies, whereas bag-of-words TF-IDF models discard all word sequence order`,
          r`The Transformer trains in fewer clock cycles on a single CPU core`,
          r`The Transformer does not require training labels`,
          r`The Transformer eliminates the need for tokenisation`,
        ],
        a: 0,
        why: r`TF-IDF treats text as an unordered bag of tokens, making it difficult to distinguish "not bad at all" from "bad not at all". Bidirectional self-attention encodes full syntactic compositionality and negation scope across the entire sentence.`,
      },
    ],
    usedBy: [],
    prereq: ['bag-of-words-and-tf-idf', 'bert-and-masked-language-models'],
    related: ['bag-of-words-and-tf-idf', 'bert-and-masked-language-models', 'stop-words-and-n-grams'],
    keywords: 'text classification sentiment analysis polarity multinomial naive bayes logistic regression macro f1 negation handling absa class imbalance',
  },
  {
    id: 'machine-translation',
    short: 'Machine Translation',
    title: 'Machine translation',
    task: 'concepts',
    module: 'Tasks and evaluation',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Machine Translation (MT) automates the conversion of text from one natural language into another while preserving semantic fidelity and grammatical fluency. Modern Neural Machine Translation (NMT) relies on the encoder-decoder Transformer architecture: a bidirectional encoder constructs deep contextual representations of the source sentence, while an autoregressive decoder generates the target translation word by word via cross-attention. Search strategies like beam search explore multiple candidate hypotheses, and translations are evaluated using metrics such as BLEU and chrF.`,
    lead: r`Translating between human languages is vastly more complex than substituting words from a bilingual dictionary. Word order shifts across linguistic families (e.g. English Subject-Verb-Object versus Japanese Subject-Object-Verb), grammatical gender must be reconciled across articles and adjectives, and idioms cannot be translated literally. Neural Machine Translation solves these challenges by mapping sentences into a universal semantic geometry and generating target text guided by cross-attention.`,
    intuition: [
      r`The Sequence-to-Sequence (Seq2Seq) challenge: In text classification, a variable-length sentence maps to a single discrete class. In machine translation, an input sequence of length S in language X must map to an output sequence of variable length T in language Y. Because S and T are rarely equal, translation requires an encoder to compress the source into continuous vectors and a decoder to unpack those vectors into target tokens until a stop token ([EOS]) is emitted.`,
      r`Cross-attention: The bridge between languages: In the original Transformer, cross-attention acts as the dynamic alignment engine. The queries Q come from the target language decoder (representing what the model wants to write next), while the keys K and values V come from the source language encoder (representing what the original sentence said). The attention softmax dynamically highlights which source words the decoder should focus on at each translation step, directly replicating human bilingual alignment.`,
      r`Beam search versus greedy translation: When generating a target sentence, picking the single most probable word at each step (greedy search) is risky: an early poor choice can trap the model in a dead end. Full combinatorial search across all |V|^T possible translations is impossible. Beam search maintains a fixed pool of the top B most promising hypotheses (the beam width, typically B = 4 to 8), expanding and pruning candidates at each step to discover globally fluent translations.`,
    ],
    analogy: r`Think of an expert simultaneous interpreter at the United Nations. As a French delegate speaks, the interpreter does not wait for a complete dictionary lookup of each word. The interpreter listens to the French phrase, absorbs its holistic meaning into their working memory (the encoder), and begins speaking fluent English (the decoder). As they speak, their mental cross-attention constantly glances back at key nouns and verbs in the French statement to ensure no diplomatic nuance is lost, while their internal grammar monitors ensure natural English phrasing.`,
    steps: [
      {
        title: r`Tokenise source and target text with shared subwords`,
        desc: r`Segment multilingual corpora using joint Byte Pair Encoding (BPE).`,
        detail: r`Train a shared subword tokeniser across source and target languages. Shared vocabularies align common roots, numbers, and proper nouns (e.g. international names) across languages.`,
      },
      {
        title: r`Encode source sentence with bidirectional Transformer encoder`,
        desc: r`Transform source tokens into rich contextual representations.`,
        detail: r`Pass source tokens x_1, ..., x_S through stacked encoder blocks. Multi-head self-attention allows all source words to interact bidirectionally, producing contextual output states H_src of shape (S, d_model).`,
      },
      {
        title: r`Decode target tokens using causal and cross-attention`,
        desc: r`Generate target words autoregressively while querying source encoder states.`,
        detail: r`Feed previously generated target tokens y_1, ..., y_{t-1} through decoder blocks. Causal self-attention prevents future leakage, while cross-attention attends over H_src using decoder states as queries Q.`,
      },
      {
        title: r`Explore translation hypotheses via Beam Search`,
        desc: r`Track top B candidate sequences and prune hypotheses using length penalisation.`,
        detail: r`At each step t, expand the B current hypotheses by evaluating all vocabulary tokens. Retain the top B candidates with the highest cumulative log-probability scaled by length normalisation factor: ((5 + t) / 6)^alpha.`,
      },
      {
        title: r`Evaluate translation quality with BLEU and chrF`,
        desc: r`Measure n-gram precision against human reference translations.`,
        detail: r`Compute modified n-gram precisions p_n for n in [1, 4] between candidate translations and gold human references. Multiply by brevity penalty BP = min(1, exp(1 - r/c)) to penalise artificially short outputs.`,
      },
    ],
    math: [
      {
        h: r`Encoder-decoder cross-attention formulation`,
        tex: r`\operatorname{CrossAttention}(Q_{\text{tgt}}, K_{\text{src}}, V_{\text{src}}) = \operatorname{softmax}\left( \frac{Q_{\text{tgt}} K_{\text{src}}^T}{\sqrt{d_k}} \right) V_{\text{src}}`,
        p: r`Here $Q_{\text{tgt}} \in \mathbb{R}^{T \times d_k}$ is projected from target decoder hidden states, while $K_{\text{src}}, V_{\text{src}} \in \mathbb{R}^{S \times d_k}$ are projected from source encoder states. This allows target tokens to query source representations dynamically.`,
      },
      {
        h: r`Bilingual Evaluation Understudy (BLEU) score`,
        tex: r`\operatorname{BLEU} = \operatorname{BP} \cdot \exp\left( \sum_{n=1}^N w_n \ln p_n \right), \quad \operatorname{BP} = \begin{cases} 1 & \text{if } c > r \\ \exp\left(1 - \frac{r}{c}\right) & \text{if } c \le r \end{cases}`,
        p: r`Here $p_n$ is clipped $n$-gram precision, $w_n = 1/N$ (typically $N = 4$), $c$ is candidate translation length, and $r$ is effective reference corpus length. The brevity penalty $\operatorname{BP}$ penalises candidates shorter than reference translations.`,
      },
      {
        h: r`Beam search length normalisation objective`,
        tex: r`\operatorname{Score}(Y) = \frac{1}{\operatorname{LP}(Y)} \sum_{t=1}^T \log P(y_t \mid y_{<t}, X), \quad \operatorname{LP}(Y) = \frac{(5 + |Y|)^\alpha}{(5 + 1)^\alpha}`,
        p: r`Because summing negative log-probabilities naturally favours shorter sequences, length penalty $\operatorname{LP}(Y)$ with parameter $\alpha \in [0.6, 0.8]$ normalises hypothesis scores to prevent premature termination.`,
      },
    ],
    keyPoints: [
      r`Neural Machine Translation maps variable-length source sentences to variable-length target sentences across languages.`,
      r`The encoder-decoder Transformer uses bidirectional source encoding and causal target decoding linked via cross-attention.`,
      r`Cross-attention dynamically aligns target generation steps with relevant source words, replacing heuristic statistical phrase tables.`,
      r`Beam search tracks multiple high-probability translation hypotheses with length normalisation to avoid greedy sub-optimal traps.`,
      r`BLEU evaluates translation quality by combining modified n-gram precision (n=1 to 4) with an exponential brevity penalty.`,
    ],
    pitfalls: [
      r`Evaluating translation without a brevity penalty: Without the brevity penalty, a candidate translation that outputs a single high-confidence word ("the") achieves 100% n-gram precision. Always enforce the BLEU brevity penalty.`,
      r`Setting beam width too large: In beam search, setting beam width B too large (e.g. B > 30) paradoxically degrades BLEU scores by biasing search towards unnaturally short, generic hypotheses. Optimal beam width is typically B in [4, 8].`,
      r`Tokenising languages with whitespace splitting: Languages such as Chinese, Japanese, and Thai do not use spaces between words. Naive tokenisation fails completely; use sentence-piece or character-level subword models (BPE/Unigram).`,
      r`Hallucination under low-resource or out-of-domain input: Seq2Seq decoders can detach from source cross-attention when encountering unknown words or noisy text, generating fluent but completely fabricated target sentences.`,
    ],
    code: r`import math
from collections import Counter

class BLEUEvaluator:
    """
    Sentence-level BLEU score calculation with modified n-gram
    precision and brevity penalty from scratch.
    """
    @staticmethod
    def modified_precision(candidate, reference, n):
        # Extract n-grams
        cand_ngrams = [tuple(candidate[i:i+n]) for i in range(len(candidate) - n + 1)]
        ref_ngrams = [tuple(reference[i:i+n]) for i in range(len(reference) - n + 1)]
        
        if not cand_ngrams:
            return 0.0
            
        cand_counts = Counter(cand_ngrams)
        ref_counts = Counter(ref_ngrams)
        
        # Clipped counts: count cannot exceed maximum occurrences in reference
        clipped_matches = sum(min(count, ref_counts.get(ng, 0)) for ng, count in cand_counts.items())
        total_cand = len(cand_ngrams)
        
        return clipped_matches / total_cand

    @classmethod
    def compute_bleu(cls, candidate_tokens, reference_tokens, max_n=4):
        c = len(candidate_tokens)
        r = len(reference_tokens)
        
        if c == 0:
            return 0.0
            
        # 1. Compute Brevity Penalty (BP)
        if c > r:
            bp = 1.0
        else:
            bp = math.exp(1.0 - (r / c))
            
        # 2. Geometric mean of precisions p_1 .. p_max_n
        log_prec_sum = 0.0
        weights = 1.0 / max_n
        
        for n in range(1, max_n + 1):
            p_n = cls.modified_precision(candidate_tokens, reference_tokens, n)
            if p_n == 0.0:
                # Smoothing: avoid log(0)
                p_n = 1e-9
            log_prec_sum += weights * math.log(p_n)
            
        bleu = bp * math.exp(log_prec_sum)
        return bleu, bp

# Example candidate translation and reference
reference = ["the", "cat", "sat", "on", "the", "mat"]
candidate_good = ["the", "cat", "was", "sitting", "on", "the", "mat"]
candidate_bad = ["the", "the", "the", "the", "the", "the"]

print("Reference Translation:  ", " ".join(reference))
print("Candidate 1 (Good):     ", " ".join(candidate_good))
print("Candidate 2 (Repeated): ", " ".join(candidate_bad))

bleu1, bp1 = BLEUEvaluator.compute_bleu(candidate_good, reference)
bleu2, bp2 = BLEUEvaluator.compute_bleu(candidate_bad, reference)

print("\nEvaluation Results:")
print(f"Candidate 1 -> BLEU: {bleu1 * 100:.2f}% (Brevity Penalty: {bp1:.4f})")
print(f"Candidate 2 -> BLEU: {bleu2 * 100:.2f}% (Brevity Penalty: {bp2:.4f})")
print("Notice how clipped precision prevents repeated 'the' from cheating!")
`,
    quiz: [
      {
        q: r`What is the primary role of the cross-attention mechanism in the encoder-decoder Transformer for Machine Translation?`,
        o: [
          r`It enables the target language decoder to dynamically query and attend over source language representations, aligning target words with corresponding source concepts`,
          r`It translates text by looking up words in an offline SQLite database`,
          r`It prevents the GPU from overheating during matrix multiplication`,
          r`It forces the target translation to have identical token length to the source`,
        ],
        a: 0,
        why: r`Cross-attention uses queries from the target decoder and keys/values from the source encoder. This allows the decoder to focus dynamically on the relevant source words as it generates each target token, replacing classical word alignment tables.`,
      },
      {
        q: r`Why does the BLEU metric include a Brevity Penalty (BP)?`,
        o: [
          r`To prevent degenerate short translations (such as outputting just a single correct word like "the") from achieving artificially high n-gram precision`,
          r`To ensure translations contain at least fifty words`,
          r`To convert negative scores into positive percentages`,
          r`To penalise translations that contain punctuation marks`,
        ],
        a: 0,
        why: r`Precision only measures the fraction of proposed words that are correct. Without a brevity penalty, translating a 30-word sentence into just "The" yields 100% precision. The Brevity Penalty penalises candidates shorter than the reference: BP = exp(1 - r/c).`,
      },
      {
        q: r`Why is Beam Search preferred over simple greedy decoding in Neural Machine Translation?`,
        o: [
          r`Greedy decoding makes irrevocable local choices that frequently trap generation in sub-optimal paths, whereas Beam Search maintains a pool of B diverse hypotheses to find globally higher-probability translations`,
          r`Beam Search runs in O(1) constant time regardless of vocabulary size`,
          r`Beam Search eliminates the need for an encoder`,
          r`Beam Search produces translations without using GPU memory`,
        ],
        a: 0,
        why: r`Greedy search picks the highest-probability word at each step independently. If that choice forces poor options later, greedy search cannot backtrack. Beam search explores the top B paths simultaneously, discovering globally fluent translations.`,
      },
    ],
    usedBy: [],
    prereq: ['bert-and-masked-language-models', 'gpt-and-decoder-only-models'],
    related: ['bert-and-masked-language-models', 'gpt-and-decoder-only-models', 'transformer_networks'],
    keywords: 'machine translation nmt seq2seq encoder decoder cross-attention beam search bleu brevety penalty chrf bpe subwords',
  },
  {
    id: 'semantic-search-and-dense-retrieval',
    short: 'Semantic Search & Dense Retrieval',
    title: 'Semantic search and dense retrieval',
    task: 'concepts',
    module: 'Tasks and evaluation',
    level: 2,
    minutes: 16,
    noLab: true,
    summary: r`Semantic search and dense retrieval transcend lexical keyword matching by projecting queries and documents into a shared continuous vector space. While traditional inverted indexes rely on exact token overlaps (failing on synonyms and paraphrases), dense retrieval uses dual-encoder neural networks to encode passages and queries into dense embeddings. Matched via inner products or cosine similarity and accelerated by Approximate Nearest Neighbour (ANN) indexing, dense retrieval retrieves conceptually relevant documents even when zero exact keywords match.`,
    lead: r`If you search an enterprise knowledge base for "how to fix a flickering monitor", a classical BM25 keyword index returns nothing if the internal engineering documentation is titled "resolving display panel refresh instability". The vocabulary mismatch problem cripples lexical search because humans express the same concept in myriad linguistic forms. Semantic search solves this: by mapping queries and passages into dense continuous representations, "flickering monitor" and "display panel refresh instability" map to neighboring points in semantic space.`,
    intuition: [
      r`The dual-encoder (two-tower) architecture: Rather than evaluating queries and documents through a heavy cross-encoder, dense retrieval uses two independent encoder networks: a Query Tower E_Q(q) and a Passage Tower E_D(d). Because document representations are independent of the query, an entire multi-million document corpus can be encoded once offline and indexed into high-performance vector databases (such as FAISS or HNSW). Query evaluation reduces to a single forward pass through the query tower followed by an inner product search.`,
      r`Contrastive learning and in-batch negative sampling: Training a dual-encoder requires teaching the model to pull relevant query-document pairs close together while pushing irrelevant pairs apart. Computing negative pairs across the whole corpus is computationally intractable. Dense retrieval models employ in-batch negative sampling: for a batch of B query-passage pairs, the other B-1 passages in the batch serve as negative distractors for each query, providing B^2 - B training pairs for the price of B forward passes.`,
      r`Hard negative mining: If training only uses random in-batch negatives, the model quickly learns trivial heuristics (e.g. separating medical text from sports text) but fails to discriminate between closely related passages within the same domain. Hard negative mining deliberately exposes the model to deceptive distractors—such as passages retrieved by BM25 that share query keywords but fail to answer the question—forcing the encoder to learn deep semantic nuances.`,
    ],
    analogy: r`Think of locating a book in an enormous university library. Lexical search is like a strict catalog clerk who will only direct you to a book if your search query matches words printed verbatim on the book's cover title. If you ask for "curing canine fever" and the book is titled "Veterinary Canine Therapeutics", the clerk insists the library has no such book. Dense retrieval is like a knowledgeable professor who has read every book in the building: they understand the conceptual essence of your inquiry and immediately guide you to the exact shelf containing the relevant canine medical treatise, regardless of the words on the cover.`,
    steps: [
      {
        title: r`Encode document collection into dense vector embeddings`,
        desc: r`Pass passage chunks through the document tower and normalise vectors to unit length.`,
        detail: r`Chunk long documents into 200 to 400 token passages. Pass passages through document encoder E_D (e.g. a pre-trained Transformer) and apply mean pooling and L2 normalisation to obtain dense vectors d_i in R^d.`,
      },
      {
        title: r`Index embeddings into Approximate Nearest Neighbour (ANN) graph`,
        desc: r`Build an HNSW or IVF-PQ index to enable logarithmic-time vector similarity search.`,
        detail: r`Insert all document embeddings into an indexing structure (such as Hierarchical Navigable Small World, HNSW). This avoids brute-force linear scanning, enabling sub-millisecond retrieval across millions of vectors.`,
      },
      {
        title: r`Encode user query in real time`,
        desc: r`Process input search query through the query tower to generate query vector q.`,
        detail: r`Pass user query text through query encoder E_Q. Normalise the resulting dense vector q to unit length, ensuring that inner product dot products equal cosine similarity.`,
      },
      {
        title: r`Execute nearest neighbour retrieval over vector index`,
        desc: r`Retrieve the top-k nearest document embeddings with maximum inner product scores.`,
        detail: r`Perform approximate nearest neighbour search over the index to find the top k document vectors that maximise score(q, d) = q^T d. Return the corresponding passage texts and metadata.`,
      },
      {
        title: r`Optionally rerank candidates using a cross-encoder`,
        desc: r`Apply a multi-layer cross-attention reranker over the top candidates.`,
        detail: r`In production two-stage search systems, feed the top 50 to 100 dense retrieval candidates into a high-capacity cross-encoder reranker for precision scoring before serving final results.`,
      },
    ],
    math: [
      {
        h: r`Dual-encoder similarity scoring function`,
        tex: r`\operatorname{Score}(q, d) = \langle E_Q(q), \, E_D(d) \rangle = \frac{E_Q(q) \cdot E_D(d)}{\|E_Q(q)\|_2 \|E_D(d)\|_2}`,
        p: r`Here $E_Q$ and $E_D$ are deep neural encoders mapping text strings to $d$-dimensional continuous vectors. When vectors are $L_2$-normalised, inner product search is mathematically identical to cosine similarity.`,
      },
      {
        h: r`InfoNCE contrastive loss with in-batch negatives`,
        tex: r`\mathcal{L}(q_i, d_i^+) = -\log \frac{\exp\left( \operatorname{Score}(q_i, d_i^+) / \tau \right)}{\exp\left( \operatorname{Score}(q_i, d_i^+) / \tau \right) + \sum_{j \ne i} \exp\left( \operatorname{Score}(q_i, d_j^+) / \tau \right)}`,
        p: r`Here $d_i^+$ is the true relevant document for query $q_i$, $d_j^+$ (for $j \ne i$) are negative passages borrowed from other queries in the minibatch, and $\tau > 0$ is the softmax temperature hyperparameter.`,
      },
      {
        h: r`Reciprocal Rank Fusion (RRF) for hybrid retrieval`,
        tex: r`\operatorname{RRF}(d) = \sum_{m \in \{\text{dense}, \text{sparse}\}} \frac{1}{k + r_m(d)}`,
        p: r`Hybrid search combines BM25 lexical rank $r_{\text{sparse}}(d)$ and dense retrieval rank $r_{\text{dense}}(d)$ using a smoothing constant $k \approx 60$, delivering robust performance across exact keywords and abstract semantics.`,
      },
    ],
    keyPoints: [
      r`Dense retrieval maps queries and documents into a shared continuous embedding space to resolve vocabulary mismatch.`,
      r`The dual-encoder architecture allows offline pre-computation of document embeddings for sub-millisecond retrieval.`,
      r`In-batch negative contrastive training provides quadratic negative pairs without additional forward-pass compute overhead.`,
      r`Hard negative mining exposes the encoder to challenging lexical distractors, driving fine-grained semantic discrimination.`,
      r`Hybrid retrieval combining BM25 and dense retrieval via Reciprocal Rank Fusion provides the industry standard for production search.`,
    ],
    pitfalls: [
      r`Neglecting exact keyword search in dense-only setups: Pure dense retrieval models frequently fail on rare part numbers, acronyms, or proper names with little pre-training frequency. Always pair dense retrieval with sparse BM25 in hybrid configurations.`,
      r`Unnormalised vector dot products: If query and document embeddings are not L2-normalised, vector magnitude dominates dot products, causing long or generic passages with large norms to dominate search results.`,
      r`Document chunking boundary truncation: Splitting a document in the middle of a vital sentence separates questions from their answers. Use overlapping sliding chunks (e.g. 300 tokens with 50-token stride) to preserve context.`,
      r`Evaluating on unrepresentative synthetic queries: Evaluating dense retrieval purely on questions identical to training text creates false confidence; validate on real user search logs containing typos, shorthand, and varied query lengths.`,
    ],
    code: r`import numpy as np

class DenseRetrievalSimulator:
    """
    Simulation of two-tower dense semantic retrieval,
    in-batch negative contrastive loss, and top-k search.
    """
    def __init__(self, dim=4, temperature=0.07):
        self.dim = dim
        self.tau = temperature
        self.doc_index = []
        self.doc_texts = []

    def normalize(self, v):
        norm = np.linalg.norm(v, axis=-1, keepdims=True)
        return v / np.clip(norm, 1e-9, None)

    def index_documents(self, documents, mock_vectors):
        """Index precomputed normalized document vectors."""
        self.doc_texts = list(documents)
        self.doc_index = self.normalize(mock_vectors)

    def contrastive_loss(self, query_embs, pos_doc_embs):
        """
        Compute InfoNCE loss with in-batch negatives.
        query_embs: (B, dim)
        pos_doc_embs: (B, dim)
        """
        q = self.normalize(query_embs)
        d = self.normalize(pos_doc_embs)
        
        # Similarity matrix: (B x B)
        sim_matrix = np.dot(q, d.T) / self.tau
        
        # Diagonal elements are true positives
        B = q.shape[0]
        labels = np.arange(B)
        
        # Softmax cross entropy
        exp_sim = np.exp(sim_matrix - np.max(sim_matrix, axis=1, keepdims=True))
        probs = exp_sim / np.sum(exp_sim, axis=1, keepdims=True)
        
        loss = -np.mean(np.log(np.clip([probs[i, labels[i]] for i in range(B)], 1e-9, None)))
        return loss

    def search(self, query_vector, top_k=2):
        q = self.normalize(query_vector)
        # Inner products equal cosine similarity for normalized vectors
        scores = np.dot(self.doc_index, q)
        ranked_indices = np.argsort(-scores)[:top_k]
        return [(idx, self.doc_texts[idx], scores[idx]) for idx in ranked_indices]

# Documents illustrating semantic matching without exact keyword overlap
docs = [
    "Troubleshooting computer display panel refresh instability and screen flickering.",
    "Baking artisan sourdough bread using wild yeast fermentation cultures.",
    "Cardiovascular endurance training through high intensity interval intervals."
]

# Simulated 4-dimensional normalized embeddings for documents
doc_vectors = np.array([
    [0.90, 0.40, 0.10, 0.05],  # Tech/Hardware
    [0.05, 0.10, 0.95, 0.25],  # Culinary/Baking
    [0.10, 0.85, 0.20, 0.45]   # Fitness/Cardio
])

searcher = DenseRetrievalSimulator(dim=4)
searcher.index_documents(docs, doc_vectors)

# Query: "how to fix a flickering computer monitor" (Shares semantic direction with Doc 0)
query_vec = np.array([0.88, 0.35, 0.08, 0.02])

print(f"Indexed {len(docs)} documents into dense index.")
print("\nQuery: 'how to fix a flickering computer monitor'")
print("Notice: Document 0 shares almost zero exact keywords, but matches semantically!")

results = searcher.search(query_vec, top_k=3)
for rank, (idx, text, score) in enumerate(results, 1):
    print(f"\nRank {rank} [Cosine Similarity: {score:.4f}]:")
    print(f"  Doc {idx}: '{text}'")

# Compute sample In-Batch Negative Contrastive Loss
loss = searcher.contrastive_loss(doc_vectors, doc_vectors)
print(f"\nIn-Batch Negative Contrastive Loss for batch size {len(docs)}: {loss:.4f}")
`,
    quiz: [
      {
        q: r`Why does dense semantic retrieval resolve the vocabulary mismatch problem that limits classical keyword search engines?`,
        o: [
          r`It maps queries and passages into a continuous embedding space where semantically related concepts occupy proximate geometric coordinates even with zero exact word overlap`,
          r`It automatically translates all queries into Latin before searching`,
          r`It deletes all non-vowel characters from the corpus`,
          r`It expands the index by adding all words from the Oxford English Dictionary`,
        ],
        a: 0,
        why: r`Dense retrieval maps text to dense continuous vectors where proximity reflects semantic meaning. Synonyms and paraphrases (e.g. "flickering monitor" and "display panel refresh instability") map to adjacent vectors, overcoming lexical vocabulary gaps.`,
      },
      {
        q: r`What is the primary architectural difference between a dual-encoder (bi-encoder) and a cross-encoder in search pipelines?`,
        o: [
          r`A dual-encoder encodes queries and documents independently allowing offline document pre-computation, whereas a cross-encoder evaluates queries and documents jointly with full cross-attention`,
          r`A dual-encoder can only run on CPU while a cross-encoder runs on GPU`,
          r`A dual-encoder requires supervised labels while a cross-encoder is strictly unsupervised`,
          r`A dual-encoder requires identical text length for query and document`,
        ],
        a: 0,
        why: r`Because dual-encoders encode documents independently of queries, millions of document vectors can be pre-computed, indexed, and searched in milliseconds. Cross-encoders require computing multi-head cross-attention over query-document pairs on the fly.`,
      },
      {
        q: r`Why is hard negative mining crucial when training dual-encoders for dense retrieval?`,
        o: [
          r`It forces the model to discriminate between subtle semantic differences by training on challenging distractors (like passages sharing lexical keywords but lacking the answer)`,
          r`It reduces the memory required for gradient backpropagation to zero`,
          r`It ensures that all document vectors have integer values`,
          r`It prevents the learning rate from decaying`,
        ],
        a: 0,
        why: r`Random in-batch negatives are too easy to differentiate (e.g. distinguishing medicine from music). Hard negatives—such as high-scoring BM25 passages that do not answer the query—train the encoder to capture deep semantic relevance rather than superficial topical overlap.`,
      },
    ],
    usedBy: [],
    prereq: ['sentence-embeddings-and-sbert', 'bm25-and-search-ranking'],
    related: ['sentence-embeddings-and-sbert', 'bm25-and-search-ranking', 'bag-of-words-and-tf-idf'],
    keywords: 'semantic search dense retrieval dual-encoder two-tower infonce contrastive learning ann hnsw faiss rrf hybrid search',
  },
  {
    id: 'evaluation-bleu-rouge-bertscore-llm-as-judge',
    short: 'NLP Eval: BLEU to LLM Judges',
    title: 'Evaluation: BLEU, ROUGE, BERTScore, LLM-as-judge',
    task: 'concepts',
    module: 'Tasks and evaluation',
    level: 2,
    minutes: 18,
    noLab: true,
    summary: r`Evaluating natural language generation (NLG) is notoriously challenging because a single prompt can have hundreds of distinct, equally valid human responses. Evaluation methodologies have evolved across four generations: precision-oriented n-gram matching (BLEU for translation), recall-oriented n-gram and sequence overlap (ROUGE for summarisation), semantic contextual embedding alignment (BERTScore), and model-based LLM-as-a-judge evaluators. Understanding their mathematical assumptions, biases, and trade-offs is crucial for rigorous benchmarking.`,
    lead: r`Suppose a human reference summary reads "The central bank lowered interest rates to stimulate economic expansion", and an AI model generates "To boost financial growth, the monetary authority reduced borrowing costs". A traditional word-overlap metric like BLEU or ROUGE gives this generation a near-zero score because almost none of the exact words match. Yet semantically, the model's summary is flawless. Automated evaluation must reconcile superficial lexical divergence with deep semantic truth.`,
    intuition: [
      r`The one-to-many dilemma of natural language generation: Unlike classification where an image is either a cat or a dog, natural language generation has no single ground truth. Paraphrasing, varying sentence structure, active versus passive voice, and synonym choice mean that two humans writing about the same event will produce completely different word sequences. Evaluation metrics must balance exact factual alignment with syntactic flexibility.`,
      r`BLEU vs ROUGE: Precision vs Recall: BLEU was designed for machine translation, where generating superfluous or hallucinated words is disastrous; it strictly measures modified n-gram precision penalised by a brevity penalty. ROUGE was designed for summarisation, where the primary risk is omitting key facts; it measures n-gram recall (ROUGE-1, ROUGE-2) and longest common subsequences (ROUGE-L) to reward coverage of reference ideas.`,
      r`BERTScore and the shift to continuous semantic matching: BERTScore bypasses surface string matching altogether. It computes pairwise cosine similarities between contextual token embeddings of the candidate and reference from a pre-trained Transformer. Greedy bipartite matching pairs each candidate token with the most similar reference token, capturing synonyms, paraphrases, and morphological derivations seamlessly.`,
      r`LLM-as-a-Judge and cognitive biases: Powerful LLMs (such as GPT-4) can evaluate complex open-ended attributes like coherence, helpfulness, and factual grounding using detailed rubrics. However, LLM judges exhibit systematic cognitive biases: position bias (favouring whichever candidate is presented first or second), verbosity bias (favouring longer, more elaborate responses regardless of factual depth), and self-enhancement bias (favouring outputs generated by their own model family). Debiasing via position swapping and chain-of-thought grading is essential.`,
    ],
    analogy: r`Think of grading an essay exam in an English literature class. A naive automated scanner (BLEU/ROUGE) compares the student's essay word-for-word against the teacher's model answer key; if the student writes "monarch" instead of "king", the scanner docks marks. An embedding-based grader (BERTScore) recognizes that "monarch" and "king" mean the same thing in this historical context, awarding credit. An expert human examiner (LLM-as-a-judge) reads the entire argument, appreciates the student's rhetoric, checks whether the thesis is logically supported by evidence, but must consciously guard against grading long-winded, verbose essays higher purely because they look authoritative.`,
    steps: [
      {
        title: r`Select evaluation metric appropriate to generation task`,
        desc: r`Choose BLEU for translation, ROUGE for summarisation, BERTScore for semantic similarity, or LLM judges for open generation.`,
        detail: r`Determine whether the task requires exact lexical fidelity, factual recall, semantic paraphrase tolerance, or holistic conversational helpfulness.`,
      },
      {
        title: r`Compute surface n-gram overlap metrics (BLEU and ROUGE)`,
        desc: r`Calculate modified precision and recall against reference corpora.`,
        detail: r`Tokenise candidate and reference texts. Compute clipped n-gram precisions and brevity penalty for BLEU; compute unigram/bigram recall and Longest Common Subsequence (LCS) for ROUGE-1, ROUGE-2, and ROUGE-L.`,
      },
      {
        title: r`Calculate contextual embedding alignment via BERTScore`,
        desc: r`Extract token embeddings and perform greedy maximum bipartite matching.`,
        detail: r`Pass candidate and reference sentences through a Transformer encoder. Compute pairwise cosine similarity matrix. For each candidate token, find the maximum similarity with reference tokens to compute BERTScore Precision, Recall, and F1.`,
      },
      {
        title: r`Formulate structured rubrics for LLM-as-a-Judge evaluation`,
        desc: r`Design explicit grading criteria (1-5 Likert scale or pairwise preference) with chain-of-thought reasoning.`,
        detail: r`Prompt an LLM evaluator with explicit criteria covering factual accuracy, relevance, fluency, and tone. Instruct the model to generate step-by-step reasoning before outputting final categorical scores.`,
      },
      {
        title: r`Debias LLM judges via position swapping`,
        desc: r`Evaluate candidate pairs in both orderings (A-B and B-A) to neutralise order bias.`,
        detail: r`In pairwise comparisons, evaluate prompt with candidate A first, then repeat with candidate B first. If the judge reverses preference based purely on presentation order, mark the comparison as a tie or discard biased judgments.`,
      },
    ],
    math: [
      {
        h: r`ROUGE-L Longest Common Subsequence (LCS) recall`,
        tex: r`R_{\text{LCS}} = \frac{\operatorname{LCS}(\text{Ref}, \text{Cand})}{m}, \quad P_{\text{LCS}} = \frac{\operatorname{LCS}(\text{Ref}, \text{Cand})}{n}, \quad \operatorname{ROUGE-L} = \frac{(1 + \beta^2) R_{\text{LCS}} P_{\text{LCS}}}{R_{\text{LCS}} + \beta^2 P_{\text{LCS}}}`,
        p: r`Here $m$ is reference length, $n$ is candidate length, and $\operatorname{LCS}$ is the length of the longest common subsequence of tokens. ROUGE-L captures sentence-level structural similarity without requiring consecutive n-gram matches.`,
      },
      {
        h: r`BERTScore recall and precision via greedy matching`,
        tex: r`R_{\text{BERT}} = \frac{1}{|x|} \sum_{i \in x} \max_{j \in \hat{x}} \mathbf{x}_i^\top \hat{\mathbf{x}}_j, \quad P_{\text{BERT}} = \frac{1}{|\hat{x}|} \sum_{j \in \hat{x}} \max_{i \in x} \mathbf{x}_i^\top \hat{\mathbf{x}}_j`,
        p: r`Here $\mathbf{x}_i$ is the pre-trained contextual embedding for reference token $i$, and $\hat{\mathbf{x}}_j$ is the embedding for candidate token $j$ (both $L_2$-normalised). Greedy matching pairs each token with its highest-scoring semantic partner.`,
      },
      {
        h: r`Spearman rank correlation with human judgment`,
        tex: r`\rho = 1 - \frac{6 \sum_{i=1}^n d_i^2}{n(n^2 - 1)}`,
        p: r`Here $d_i$ is the difference between the metric's rank and the human gold standard rank for item $i$, and $n$ is the total number of evaluated items. Higher rank correlation indicates greater alignment with human qualitative assessment.`,
      },
    ],
    keyPoints: [
      r`Automated evaluation of natural language generation must account for linguistic polysemy and multiple valid surface expressions.`,
      r`BLEU measures precision for machine translation; ROUGE measures recall and subsequence overlap for summarisation.`,
      r`BERTScore aligns contextual token embeddings using greedy bipartite matching, providing robustness against vocabulary mismatch.`,
      r`LLM-as-a-judge provides holistic qualitative evaluations of reasoning and nuance, but requires debiasing against position and verbosity biases.`,
      r`Metric efficacy is validated by measuring Spearman and Pearson rank correlations against human qualitative judgments.`,
    ],
    pitfalls: [
      r`Relying on BLEU for open-ended creative generation: BLEU assumes overlap with a specific reference string; for creative writing or dialogue, valid responses have zero n-gram overlap, rendering BLEU meaningless.`,
      r`Verbosity bias in LLM judges: Large language models systematically award higher marks to longer, verbose responses even if they are repetitive or contain hallucinated details. Normalise or explicitly instruct judges to penalise bloat.`,
      r`Evaluating without position swap in pairwise judging: An LLM judge presented with option A followed by option B frequently picks option A 65% of the time purely due to positional primacy. Always run reciprocal evaluations.`,
      r`Ignoring token normalisation in ROUGE: Failing to lowercase and stem tokens prior to computing ROUGE causes words like "running" and "runs" to be treated as complete mismatches, artificially depressing scores.`,
    ],
    code: r`import numpy as np

def lcs_length(x, y):
    """Compute Longest Common Subsequence (LCS) length via dynamic programming."""
    m, n = len(x), len(y)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if x[i - 1] == y[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]

def compute_rouge_l(candidate_tokens, reference_tokens, beta=1.2):
    """Compute ROUGE-L Precision, Recall, and F-score."""
    lcs = lcs_length(candidate_tokens, reference_tokens)
    if len(candidate_tokens) == 0 or len(reference_tokens) == 0:
        return 0.0, 0.0, 0.0
        
    prec = lcs / len(candidate_tokens)
    rec = lcs / len(reference_tokens)
    
    if prec + rec == 0:
        f_score = 0.0
    else:
        f_score = ((1 + beta**2) * prec * rec) / (rec + (beta**2) * prec)
    return prec, rec, f_score

def simulate_bertscore(candidate_embs, reference_embs):
    """
    Simulate BERTScore greedy maximum bipartite matching.
    candidate_embs: (len_cand, dim) normalized
    reference_embs: (len_ref, dim) normalized
    """
    # Pairwise cosine similarity matrix: (len_cand, len_ref)
    sim_matrix = np.dot(candidate_embs, reference_embs.T)
    
    # Recall: For each reference token, find best matching candidate token
    rec = np.mean(np.max(sim_matrix, axis=0))
    # Precision: For each candidate token, find best matching reference token
    prec = np.mean(np.max(sim_matrix, axis=1))
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0
    return prec, rec, f1

# Example Reference and Candidate summaries
reference_text = ["the", "bank", "lowered", "interest", "rates", "to", "stimulate", "economic", "growth"]
candidate_lexical = ["the", "bank", "reduced", "interest", "rates", "to", "promote", "economic", "expansion"]

print("Reference Summary: ", " ".join(reference_text))
print("Candidate Summary: ", " ".join(candidate_lexical))

# 1. Evaluate ROUGE-L
p_lcs, r_lcs, f_lcs = compute_rouge_l(candidate_lexical, reference_text)
print("\n1. ROUGE-L Evaluation:")
print(f"  Precision: {p_lcs * 100:.1f}%")
print(f"  Recall:    {r_lcs * 100:.1f}%")
print(f"  F-measure: {f_lcs * 100:.1f}%")

# 2. Simulate BERTScore on continuous embeddings
np.random.seed(42)
d = 4
# Mock embeddings where synonyms have high similarity (>0.85)
cand_embs = np.random.randn(len(candidate_lexical), d)
cand_embs = cand_embs / np.linalg.norm(cand_embs, axis=1, keepdims=True)

ref_embs = cand_embs + np.random.randn(len(candidate_lexical), d) * 0.15
ref_embs = ref_embs / np.linalg.norm(ref_embs, axis=1, keepdims=True)

bs_p, bs_r, bs_f1 = simulate_bertscore(cand_embs, ref_embs)
print("\n2. BERTScore Evaluation (Contextual Semantic Alignment):")
print(f"  Precision: {bs_p:.4f}")
print(f"  Recall:    {bs_r:.4f}")
print(f"  F1-Score:  {bs_f1:.4f}")
`,
    quiz: [
      {
        q: r`Why was ROUGE designed primarily as a recall-focused metric for text summarisation while BLEU was designed as a precision-focused metric for machine translation?`,
        o: [
          r`Because in summarisation the primary failure mode is omitting critical source facts (requiring recall), whereas in translation generating extraneous incorrect words destroys fidelity (requiring precision)`,
          r`Because ROUGE can only count single letters while BLEU counts sentences`,
          r`Because BLEU cannot be run on computers with less than 32GB RAM`,
          r`Because ROUGE was invented before machine translation was developed`,
        ],
        a: 0,
        why: r`In translation, every word matters: generating ungrounded extra words is catastrophic, so BLEU measures precision. In summarisation, compressing 1,000 words to 100 requires retaining essential ideas; ROUGE measures how much of the gold summary was covered (recall).`,
      },
      {
        q: r`How does BERTScore overcome the vocabulary mismatch limitation of BLEU and ROUGE?`,
        o: [
          r`By computing cosine similarities between contextual embeddings of candidate and reference tokens and finding the maximum matching for each word regardless of surface spelling`,
          r`By translating all candidate texts into German`,
          r`By replacing all rare words with dictionary synonyms using WordNet`,
          r`By assigning a score of 100% to all sentences longer than ten tokens`,
        ],
        a: 0,
        why: r`BERTScore passes candidate and reference through a pre-trained Transformer. Contextual token embeddings for synonyms (like "lowered" and "reduced") are proximate in vector space. Greedy bipartite matching pairs them, awarding credit where surface string metrics fail.`,
      },
      {
        q: r`What is position bias in LLM-as-a-judge evaluation frameworks, and how is it mitigated?`,
        o: [
          r`The systematic tendency of LLM judges to prefer whichever candidate model response is placed first (or second) in the prompt, mitigated by swapping response positions and verifying consistency`,
          r`The error caused by running models on different operating systems`,
          r`The preference of models to evaluate only nouns`,
          r`The tendency of models to output predictions in reverse alphabetical order`,
        ],
        a: 0,
        why: r`Empirical benchmarks show LLM judges often select candidate A over candidate B >60% of the time purely because option A appeared first. Position debiasing evaluates both (A, B) and (B, A) prompt orderings, declaring a tie if judgment flips.`,
      },
    ],
    usedBy: [],
    prereq: ['machine-translation', 'text-classification-and-sentiment', 'sentence-embeddings-and-sbert'],
    related: ['machine-translation', 'text-classification-and-sentiment', 'sentence-embeddings-and-sbert'],
    keywords: 'evaluation bleu rouge rouge-l bertscore llm-as-a-judge position bias verbosity bias nlg metrics spearman correlation',
  },
  {
    "id": "summarisation",
    "short": "Text Summarisation & ROUGE",
    "title": "Text Summarisation: Extractive vs Abstractive, ROUGE Metrics, and Faithfulness",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Extractive summarisation identifies and stitches together verbatim representative sentences from the original source. Abstractive summarisation generates novel paraphrased sentences, synthesizing ideas much like human writers. ROUGE (Recall-Oriented Understudy for Gisting Evaluation) metrics (ROUGE-1, ROUGE-2, ROUGE-L) evaluate n-gram and longest common subsequence recall against human references. Modern abstractive models suffer from faithfulness errors (introducing unsupported entities or relations), requiring NLI-based consistency auditing.",
    "lead": "Text summarisation condenses long documents into concise, salient overviews while preserving key information. The paradigm has evolved from extractive sentence selection (TextRank) to abstractive sequence-to-sequence synthesis (BART, T5, LLMs), evaluated by lexical overlap (ROUGE) and factual faithfulness metrics (FactCC, QAGS).",
    "analogy": "Extractive summarisation is like assembling a photo collage using scissors to cut out original faces and buildings from existing photographs. Abstractive summarisation is hiring an artist to paint a new canvas portrait based on looking at the scene. The painting is smoother and more artistic, but the painter might accidentally paint blue eyes instead of brown eyes.",
    "intuition": [
      "If you want to summarise a 10-page research paper, you could highlight the 5 most important sentences with a marker and copy them into a bulleted list. That is extractive summarisation: it is factually safe because it never invents new wording, but it can be disjointed and redundant. Alternatively, you could read the paper, digest the concepts, and write a fresh 2-paragraph summary in your own words. That is abstractive summarisation: it is fluent, coherent, and synthesizes concepts, but it introduces the risk of accidentally misattributing quotes or hallucinating claims. Evaluation requires checking both coverage (did you capture the main ideas, measured by ROUGE) and faithfulness (is everything in the summary actually true according to the source text)."
    ],
    "steps": [
      "Determine summarisation paradigm: select extractive selection for safety-critical domains (legal, medical) or abstractive generation for consumer readability.",
      "Preprocess source document: clean whitespace, segment sentences, and truncate to maximum context window limits.",
      "Encode document context: process source tokens through an encoder-decoder architecture (e.g. BART) or decoder-only prompt harness.",
      "Generate summary: decode target tokens autoregressively using beam search with repetition penalties and length normalisation.",
      "Evaluate lexical overlap: calculate ROUGE-1, ROUGE-2, and ROUGE-L scores against reference summaries.",
      "Verify factual faithfulness: run automated natural language inference (NLI) to flag any hallucinated entities or unsupported causal claims."
    ],
    "math": [
      {
        "h": "Text Summarisation: Extractive vs Abstractive, ROUGE Metrics, and Faithfulness formulation (Part 1)",
        "tex": "\\text{ROUGE-N} = \\frac{\\sum_{S \\in \\{R\\}} \\sum_{\\text{gram}_n \\in S} \\text{Count}_{\\text{match}}(\\text{gram}_n)}{\\sum_{S \\in \\{R\\}} \\sum_{\\text{gram}_n \\in S} \\text{Count}(\\text{gram}_n)}",
        "p": "ROUGE-L uses the Longest Common Subsequence (LCS) to capture sentence-level word order without requiring consecutive n-grams:"
      },
      {
        "h": "Text Summarisation: Extractive vs Abstractive, ROUGE Metrics, and Faithfulness formulation (Part 2)",
        "tex": "R_{\\text{LCS}} = \\frac{\\text{LCS}(R, C)}{m}, \\quad P_{\\text{LCS}} = \\frac{\\text{LCS}(R, C)}{n}, \\quad F_{\\text{LCS}} = \\frac{(1 + \\beta^2) R_{\\text{LCS}} P_{\\text{LCS}}}{R_{\\text{LCS}} + \\beta^2 P_{\\text{LCS}}}",
        "p": "where $m$ and $n$ are lengths of reference $R$ and candidate $C$. In extractive graph-based ranking (TextRank), sentence node centrality $S(V_i)$ is solved iteratively with damping factor $d$:"
      },
      {
        "h": "Text Summarisation: Extractive vs Abstractive, ROUGE Metrics, and Faithfulness formulation (Part 3)",
        "tex": "S(V_i) = (1 - d) + d \\sum_{V_j \\in \\text{In}(V_i)} \\frac{w_{ji}}{\\sum_{V_k \\in \\text{Out}(V_j)} w_{jk}} S(V_j)",
        "p": "where $m$ and $n$ are lengths of reference $R$ and candidate $C$. In extractive graph-based ranking (TextRank), sentence node centrality $S(V_i)$ is solved iteratively with damping factor $d$:"
      }
    ],
    "code": "def compute_rouge_n(candidate, reference, n=1):\n    \"\"\"Computes ROUGE-N precision, recall, and F1 score.\"\"\"\n    def get_ngrams(text, n):\n        words = text.lower().split()\n        return [tuple(words[i:i+n]) for i in range(len(words) - n + 1)]\n    \n    cand_ngrams = get_ngrams(candidate, n)\n    ref_ngrams = get_ngrams(reference, n)\n    \n    if not ref_ngrams or not cand_ngrams:\n        return 0.0, 0.0, 0.0\n    \n    # Count matching n-grams\n    ref_counts = {}\n    for g in ref_ngrams:\n        ref_counts[g] = ref_counts.get(g, 0) + 1\n        \n    overlap = 0\n    cand_counts = {}\n    for g in cand_ngrams:\n        cand_counts[g] = cand_counts.get(g, 0) + 1\n        \n    for g, count in cand_counts.items():\n        if g in ref_counts:\n            overlap += min(count, ref_counts[g])\n            \n    recall = overlap / len(ref_ngrams)\n    precision = overlap / len(cand_ngrams)\n    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0\n    return precision, recall, f1\n\n# Example Reference and Model Candidate Summaries\nreference = \"the company reported record profits driven by strong cloud sales in europe\"\ncandidate = \"strong cloud sales helped the company report record profits across european markets\"\n\np1, r1, f1_1 = compute_rouge_n(candidate, reference, n=1)\np2, r2, f1_2 = compute_rouge_n(candidate, reference, n=2)\n\nprint(f\"Candidate Summary: '{candidate}'\")\nprint(f\"Reference Summary: '{reference}'\")\nprint(f\"ROUGE-1 -> Precision: {p1:.3f} | Recall: {r1:.3f} | F1: {f1_1:.3f}\")\nprint(f\"ROUGE-2 -> Precision: {p2:.3f} | Recall: {r2:.3f} | F1: {f1_2:.3f}\")",
    "keyPoints": [
      "Extractive summarisation guarantees verbatim fidelity, whereas abstractive summarisation provides fluency and concise synthesis.",
      "ROUGE-1, ROUGE-2, and ROUGE-L quantify n-gram and longest common subsequence recall against human reference summaries.",
      "Evaluating factual faithfulness via NLI models is essential to prevent hallucinated claims in abstractive summaries."
    ],
    "pitfalls": [
      "Relying exclusively on ROUGE scores; a summary can achieve high ROUGE overlap while introducing factual contradictions that negate the source meaning.",
      "Generating summaries that suffer from the \"lead bias\" of news corpora, where models simply copy the first three sentences because journalists write inverted pyramids.",
      "Extractive summarisation producing dangling pronouns (e.g. including a sentence starting with \"However, he refused...\" without the preceding entity definition)."
    ],
    "quiz": [
      {
        "q": "What is the key functional difference between extractive and abstractive summarisation?",
        "o": [
          "Extractive selects sentences directly from the source; abstractive generates new paraphrased text",
          "Extractive only runs on English; abstractive runs on all languages",
          "Extractive creates longer summaries than abstractive",
          "Abstractive summarisation does not require neural networks"
        ],
        "a": 0,
        "why": "Extractive methods extract and arrange verbatim snippets directly from the original document; abstractive methods compose novel sentences that paraphrase the concepts."
      },
      {
        "q": "Why is ROUGE recall-oriented, in contrast to BLEU which is precision-oriented?",
        "o": [
          "Because summarisation evaluates whether all key source concepts in the human reference were successfully captured in the output",
          "Because ROUGE was designed to evaluate neural speech recognition",
          "Because precision cannot be computed on sentences shorter than 20 words",
          "Because recall requires less floating-point arithmetic"
        ],
        "a": 0,
        "why": "In summarisation, ensuring the summary covers the necessary points found in the reference is paramount, making recall against reference concepts the primary objective."
      },
      {
        "q": "What does ROUGE-L measure between two summary texts?",
        "o": [
          "Character-level Levenshtein edit distance",
          "The length of the Longest Common Subsequence (LCS) of words, reflecting flexible sentence-level order",
          "Latent Dirichlet allocation topic overlap",
          "Audio spectrogram correlation"
        ],
        "a": 1,
        "why": "ROUGE-L evaluates the Longest Common Subsequence of tokens, rewarding summaries that preserve grammatical word order without requiring exact consecutive n-gram matches."
      }
    ],
    "related": [
      "hallucination-and-factuality",
      "bert-and-masked-language-models"
    ],
    "keywords": "summarisation, text summarisation: extractive vs abstractive, rouge metrics, and faithfulness, natural language processing, deep learning"
  },
  {
    "id": "question-answering",
    "short": "Question Answering & SQuAD",
    "title": "Question Answering: Extractive SQuAD, Multi-Hop Reasoning, and Open-Domain QA",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Extractive QA (SQuAD) identifies continuous start and end token indices within a provided reference passage that answer the question. Open-Domain QA (ODQA) decouples into a retriever that scans millions of passages and a reader that extracts or synthesizes the final answer. Multi-hop QA (HotpotQA) requires gathering disjoint clues across multiple disparate documents to deduce the correct conclusion. Evaluation benchmarks evaluate exact match (EM) and token-level macro-averaged F1 score against ground-truth answer strings.",
    "lead": "Question Answering (QA) tests a system's ability to retrieve, understand, and synthesize answers to natural language inquiries. Architectures range from span-extractive reading comprehension on benchmark datasets like SQuAD to complex multi-hop reasoning over knowledge graphs and retriever-reader open-domain pipelines.",
    "analogy": "Extractive QA is like using an index finger to point directly at a single sentence in a brochure handed to you. Open-Domain QA is walking into a multi-storey library, finding the correct aisle, pulling down the right book, and pointing at the page. Multi-Hop QA is following a scavenger hunt where Clue #1 inside an envelope in the attic directs you to open a safe in the basement to find the prize.",
    "intuition": [
      "When you take an open-book reading comprehension test, you read a paragraph and answer a question by underlining the exact phrase that gives the answer. This is Extractive QA (popularised by SQuAD). For instance, given the text \"Marie Curie was awarded the Nobel Prize in Chemistry in 1911\", and the question \"When did Curie win her Chemistry Nobel?\", an extractive model predicts start index 9 and end index 9 to extract \"1911\". In Open-Domain QA, no passage is provided: the system must first act as a search engine to retrieve the right articles from Wikipedia, then read them to find the answer. In Multi-Hop QA, answering the question requires connecting separate clues: e.g. \"What team does the quarterback who won the 2021 Super Bowl play for?\" requires first discovering who won in 2021, and second finding that player's team."
    ],
    "steps": [
      "Format input pair: concatenate the question tokens and context paragraph tokens separated by a `[SEP]` delimiter.",
      "Encode joint sequence: process the concatenated tokens through a bidirectional transformer encoder.",
      "Predict span boundaries: compute linear projections of each token embedding to yield start and end probability distributions.",
      "Filter candidate spans: apply dynamic programming to select the span $(i, j)$ maximising $P_{\\text{start}}(i) \\times P_{\\text{end}}(j)$ where $j \\ge i$ and span length $\\le L_{\\max}$.",
      "Handle unanswerable questions: if the `[CLS]` token score exceeds valid span scores, predict that the question cannot be answered from the text.",
      "Evaluate metrics: compare extracted string against reference spans using Exact Match (EM) binary score and token-overlap F1 score."
    ],
    "math": [
      {
        "h": "Question Answering: Extractive SQuAD, Multi-Hop Reasoning, and Open-Domain QA formulation (Part 1)",
        "tex": "\\mathbf{x} = [\\text{CLS}] \\, q_1, \\dots, q_M \\, [\\text{SEP}] \\, p_1, \\dots, p_N \\, [\\text{SEP}]",
        "p": "Contextual token representations $\\mathbf{H} \\in \\mathbb{R}^{(M+N+3) \\times d}$ are projected to start and end token logits via parameter vectors $\\mathbf{w}_s, \\mathbf{w}_e$:"
      },
      {
        "h": "Question Answering: Extractive SQuAD, Multi-Hop Reasoning, and Open-Domain QA formulation (Part 2)",
        "tex": "s_i = \\mathbf{w}_s^T \\mathbf{h}_i, \\quad e_j = \\mathbf{w}_e^T \\mathbf{h}_j",
        "p": "Probability distributions for start index $i$ and end index $j$ are calculated using softmax:"
      },
      {
        "h": "Question Answering: Extractive SQuAD, Multi-Hop Reasoning, and Open-Domain QA formulation (Part 3)",
        "tex": "P_{\\text{start}}(i) = \\frac{\\exp(s_i)}{\\sum_{k} \\exp(s_k)}, \\quad P_{\\text{end}}(j) = \\frac{\\exp(e_j)}{\\sum_{k} \\exp(e_k)}",
        "p": "The predicted span $(i^*, j^*)$ maximises joint score subject to constraint $i \\le j \\le i + L_{\\max}$:"
      },
      {
        "h": "Question Answering: Extractive SQuAD, Multi-Hop Reasoning, and Open-Domain QA formulation (Part 4)",
        "tex": "(i^*, j^*) = \\arg\\max_{i \\le j \\le i + L_{\\max}} \\left( s_i + e_j \\right)",
        "p": "Loss for true span $(y_s, y_e)$ is formulated as:"
      },
      {
        "h": "Question Answering: Extractive SQuAD, Multi-Hop Reasoning, and Open-Domain QA formulation (Part 5)",
        "tex": "\\mathcal{L}_{\\text{QA}} = - \\log P_{\\text{start}}(y_s) - \\log P_{\\text{end}}(y_e)",
        "p": "Loss for true span $(y_s, y_e)$ is formulated as:"
      }
    ],
    "code": "import numpy as np\n\ndef score_extractive_span(start_logits, end_logits, max_answer_len=5):\n    \"\"\"Finds optimal start and end span maximising joint probability.\"\"\"\n    # Convert logits to probabilities\n    def softmax(z):\n        exp_z = np.exp(z - np.max(z))\n        return exp_z / np.sum(exp_z)\n        \n    p_start = softmax(start_logits)\n    p_end = softmax(end_logits)\n    \n    best_score = -1.0\n    best_span = (0, 0)\n    N = len(start_logits)\n    \n    for i in range(N):\n        for j in range(i, min(N, i + max_answer_len)):\n            score = p_start[i] * p_end[j]\n            if score > best_score:\n                best_score = score\n                best_span = (i, j)\n                \n    return best_span, best_score\n\ndef compute_qa_f1(pred_tokens, gold_tokens):\n    \"\"\"Computes token-level F1 overlap score.\"\"\"\n    common = set(pred_tokens) & set(gold_tokens)\n    if not common:\n        return 0.0\n    p = len(common) / len(pred_tokens)\n    r = len(common) / len(gold_tokens)\n    return (2 * p * r) / (p + r)\n\n# Simulation: \"Marie Curie received the Nobel Prize in 1911\"\n# Tokens: [CLS] When did Curie win ? [SEP] Marie Curie received the Nobel Prize in 1911 [SEP]\ntokens = [\"[CLS]\", \"When\", \"did\", \"Curie\", \"win\", \"?\", \"[SEP]\", \n          \"Marie\", \"Curie\", \"received\", \"the\", \"Nobel\", \"Prize\", \"in\", \"1911\", \"[SEP]\"]\n\n# Simulated logits from model head\nstart_logits = np.array([-5, -5, -5, -5, -5, -5, -5,  0.1, 0.2, 0.1, 0.0, 0.1, 0.2, 0.1, 8.5, -5])\nend_logits   = np.array([-5, -5, -5, -5, -5, -5, -5,  0.1, 0.1, 0.0, 0.1, 0.1, 0.2, 0.1, 8.9, -5])\n\nspan, conf = score_extractive_span(start_logits, end_logits)\nextracted_answer = tokens[span[0]:span[1] + 1]\n\nprint(f\"Extracted Span Indices: {span}\")\nprint(f\"Extracted Answer:       '{' '.join(extracted_answer)}' (Confidence: {conf:.4f})\")\n\nf1 = compute_qa_f1(extracted_answer, [\"1911\"])\nprint(f\"Token-Level F1 Score:   {f1:.2f}\")",
    "keyPoints": [
      "Extractive reading comprehension predicts start and end token indices of answer spans within source paragraphs.",
      "Open-domain QA combines an information retriever with a reader model to locate answers across millions of documents.",
      "Evaluation benchmarks evaluate Exact Match (strict binary) and token-level F1 overlap to quantify comprehension accuracy."
    ],
    "pitfalls": [
      "Assuming all questions are answerable from the passage; SQuAD 2.0 requires systems to abstain when the text does not contain the answer.",
      "Extracting grammatically invalid spans by omitting the constraint $i \\le j$, causing negative length predictions.",
      "Evaluating extractive QA models on generative responses without accounting for semantic equivalence (e.g. marking \"two\" incorrect when gold is \"2\")."
    ],
    "quiz": [
      {
        "q": "How does an extractive QA model like BERT-SQuAD predict an answer from a context paragraph?",
        "o": [
          "It generates answer tokens word-by-word from an internal autoregressive decoder",
          "It computes start and end token classification logits over the input passage, identifying the boundaries of the answer span",
          "It maps questions to SQL queries",
          "It searches an inverted index on disk"
        ],
        "a": 1,
        "why": "Extractive QA identifies the answer as a continuous span within the context document by predicting the start token index and end token index."
      },
      {
        "q": "What defines a \"multi-hop\" question answering task (such as HotpotQA)?",
        "o": [
          "The question must be translated into multiple languages before answering",
          "The answer requires reasoning across and combining information from two or more separate documents or paragraphs",
          "The model must query multiple internet search engines simultaneously",
          "The system requires multiple GPUs to compute forward passes"
        ],
        "a": 1,
        "why": "Multi-hop QA requires connecting intermediate reasoning steps across distinct texts where no single document contains all necessary information to answer the question."
      },
      {
        "q": "In SQuAD evaluation, what is the difference between Exact Match (EM) and F1 score?",
        "o": [
          "EM is a strict binary check (1 if prediction matches gold exactly, 0 otherwise), while F1 measures token-level precision and recall overlap",
          "F1 is only calculated on unanswerable questions",
          "EM measures character count, while F1 measures word count",
          "EM evaluates latency, while F1 evaluates accuracy"
        ],
        "a": 0,
        "why": "Exact Match requires character-for-character agreement with the reference answer, whereas F1 treats predicted and ground-truth answers as bags of tokens and calculates their harmonic mean overlap."
      }
    ],
    "related": [
      "semantic-search-and-dense-retrieval",
      "summarisation"
    ],
    "keywords": "question answering, question answering: extractive squad, multi-hop reasoning, and open-domain qa, natural language processing, deep learning"
  },
  {
    "id": "information-and-relation-extraction",
    "short": "Relation Extraction & OpenIE",
    "title": "Information and Relation Extraction: OpenIE, Distant Supervision, and Knowledge Graph Construction",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Relation Extraction classifies semantic relationships existing between marked entity mentions within a sentence or document. Open Information Extraction (OpenIE) extracts arbitrary relational triples $(s, r, o)$ directly from text without a predefined schema or target relation ontology. Distant supervision aligns existing knowledge bases (e.g. Wikidata) with raw text corpora to automatically create massive, weakly labelled training datasets. Graph construction merges extracted triples into persistent knowledge graphs, resolving entity aliases through link prediction and graph embeddings.",
    "lead": "Information Extraction (IE) transforms unstructured natural language text into structured knowledge tuples (subject, relation, object). From open information extraction (OpenIE) to distant supervision and modern relation classification, IE powers enterprise search, automated knowledge graph construction, and biomedical entity discovery.",
    "analogy": "Imagine reading through thousands of historical letters and filing index cards in a library card catalogue. Instead of keeping the entire letter, you write a concise index card with three boxes: Subject: \"Napoleon\", Relation: \"Exiled to\", Object: \"Saint Helena\". Anyone visiting the library can now search the index cards instantly without reading through centuries of personal correspondence.",
    "intuition": [
      "If you want a computer to answer questions like \"Which tech companies were founded in California?\", an AI cannot afford to read 100 million web pages every time a user asks a question. Instead, it needs a structured database: a Knowledge Graph. Information Extraction (IE) is the automated factory that builds this graph from raw prose. Given a sentence like \"Steve Jobs co-founded Apple in Cupertino\", IE first runs Named Entity Recognition to find \"Steve Jobs\" (Person), \"Apple\" (Organization), and \"Cupertino\" (Location). Next, Relation Extraction identifies the links between them: `(Steve Jobs, Founded, Apple)` and `(Apple, HeadquarteredIn, Cupertino)`. By storing these triples in a graph, computers can instantly query relationships, trace corporate ownership, or discover drug-disease interactions across millions of biomedical papers."
    ],
    "steps": [
      "Detect named entities: tag person, organization, location, and domain-specific entities using NER models.",
      "Insert special entity markers: delimit candidate entity pairs in the sentence using tags like `[E1]`, `[/E1]`, `[E2]`, and `[/E2]`.",
      "Encode marked sequence: pass the augmented sequence through a bidirectional transformer encoder.",
      "Extract entity pair representations: extract and concatenate the hidden states corresponding to the entity markers.",
      "Classify candidate relation: project concatenated embeddings through an MLP classifier to predict relation labels or output `no_relation`.",
      "Link entities to knowledge base: resolve surface strings to canonical entity IDs (e.g. Q312 for Apple Inc.) and insert the triple into the knowledge graph."
    ],
    "math": [
      {
        "h": "Information and Relation Extraction: OpenIE, Distant Supervision, and Knowledge Graph Construction formulation (Part 1)",
        "tex": "P(r \\mid \\mathbf{x}, e_1, e_2) = \\text{softmax}\\left( \\mathbf{W}_r \\mathbf{h}_{\\text{rel}} + \\mathbf{b}_r \\right)",
        "p": "In entity marker architectures, input tokens are augmented with typed entity boundary markers:"
      },
      {
        "h": "Information and Relation Extraction: OpenIE, Distant Supervision, and Knowledge Graph Construction formulation (Part 2)",
        "tex": "\\mathbf{x}' = \\dots [\\text{E1}] e_1 [\\text{/E1}] \\dots [\\text{E2}] e_2 [\\text{/E2}] \\dots",
        "p": "Composite relation vector $\\mathbf{h}_{\\text{rel}}$ concatenates contextual hidden states of opening entity markers:"
      },
      {
        "h": "Information and Relation Extraction: OpenIE, Distant Supervision, and Knowledge Graph Construction formulation (Part 3)",
        "tex": "\\mathbf{h}_{\\text{rel}} = [\\mathbf{h}_{[\\text{E1}]} \\,;\\, \\mathbf{h}_{[\\text{E2}]}]",
        "p": "In distant supervision, under the at-least-one assumption (multi-instance learning), bags of sentences $B = \\{s_1, \\dots, s_M\\}$ containing pair $(e_1, e_2)$ are aggregated via attention weights $\\..."
      },
      {
        "h": "Information and Relation Extraction: OpenIE, Distant Supervision, and Knowledge Graph Construction formulation (Part 4)",
        "tex": "\\mathbf{s}_B = \\sum_{i=1}^M \\alpha_i \\mathbf{s}_i, \\quad \\alpha_i = \\frac{\\exp(\\mathbf{s}_i^T \\mathbf{A} \\mathbf{r})}{\\sum_{j=1}^M \\exp(\\mathbf{s}_j^T \\mathbf{A} \\mathbf{r})}",
        "p": "In distant supervision, under the at-least-one assumption (multi-instance learning), bags of sentences $B = \\{s_1, \\dots, s_M\\}$ containing pair $(e_1, e_2)$ are aggregated via attention weights $\\..."
      }
    ],
    "code": "import numpy as np\n\ndef score_relation_candidates(entity1, entity2, sentence_features, relation_matrix):\n    \"\"\"Simulates classifying relations between marked entities.\"\"\"\n    # Concatenate entity representation vectors\n    pair_repr = np.concatenate([entity1, entity2, sentence_features])\n    \n    # Linear projection to relation logits\n    logits = np.dot(relation_matrix, pair_repr)\n    \n    # Softmax probabilities\n    exp_logits = np.exp(logits - np.max(logits))\n    probs = exp_logits / np.sum(exp_logits)\n    return probs\n\n# Setup simulated relation classes\nrelations = [\"no_relation\", \"founded_by\", \"headquartered_in\", \"subsidiary_of\"]\n\nnp.random.seed(42)\nd = 4\ne_org = np.array([1.2, 0.8, -0.2, 0.5])      # \"Apple\"\ne_person = np.array([0.9, -0.4, 1.1, 0.3])   # \"Steve Jobs\"\nfeat_founded = np.array([0.8, 1.5, 0.2, -0.1]) # \"co-founded with\"\n\n# Synthetic classifier weights\nW = np.random.randn(len(relations), 3 * d) * 0.5\n# Bias founded_by row to respond to founder feature combinations\nW[1, :d] = 0.8\nW[1, d:2*d] = 0.9\n\nprobs = score_relation_candidates(e_org, e_person, feat_founded, W)\nbest_rel_idx = np.argmax(probs)\n\nprint(\"Relation Extraction Simulation:\")\nprint(f\"  Entity 1: 'Apple' (ORG)\")\nprint(f\"  Entity 2: 'Steve Jobs' (PERSON)\")\nprint(\"Predicted Relation Probabilities:\")\nfor rel, p in zip(relations, probs):\n    print(f\"  {rel:18} -> {p * 100:.2f}%\")\n\nprint(f\"\\nExtracted Triple: (Apple, {relations[best_rel_idx]}, Steve Jobs)\")",
    "keyPoints": [
      "Relation extraction converts unstructured sentences into factual $(s, r, o)$ triples to populate structured knowledge graphs.",
      "Distant supervision scales dataset creation using existing knowledge bases, managed via multi-instance learning to filter label noise.",
      "Entity marker insertion provides modern transformer encoders with precise span boundaries for highly accurate relation classification."
    ],
    "pitfalls": [
      "Assuming distant supervision yields clean labels; distant supervision generates significant false positives when sentences mention two entities without expressing the relation.",
      "Ignoring directionality in asymmetric relations (e.g. confusing `founded_by(A, B)` with `founded_by(B, A)`).",
      "Failing to predict a `no_relation` class, forcing the model to hallucinate relations for unrelated entities co-occurring in the same paragraph."
    ],
    "quiz": [
      {
        "q": "What is the core premise of distant supervision in relation extraction?",
        "o": [
          "Human linguists annotate every sentence in real-time",
          "If two entities have a relationship in a known database, any sentence containing both entities is assumed to express that relationship",
          "Relations are extracted solely using optical character recognition",
          "Sentences are translated into Latin to remove syntax noise"
        ],
        "a": 1,
        "why": "Distant supervision heuristically labels text by assuming that if knowledge base triple $(e_1, r, e_2)$ exists, sentences mentioning both $e_1$ and $e_2$ likely express relation $r$."
      },
      {
        "q": "Why do modern relation extractors insert special marker tokens (e.g. `[E1]`, `[E2]`) into input text?",
        "o": [
          "To encrypt the sentence for privacy compliance",
          "To explicitly signal entity spans and boundaries to the self-attention mechanism without altering surrounding token semantics",
          "To reduce sequence length by 50%",
          "To replace word embeddings with punctuation embeddings"
        ],
        "a": 1,
        "why": "Entity markers tell the transformer encoder exactly which tokens comprise entity 1 and entity 2, allowing the network to focus attention on their relational interaction."
      },
      {
        "q": "How does Open Information Extraction (OpenIE) differ from traditional Relation Extraction?",
        "o": [
          "OpenIE only works on open-source code",
          "OpenIE extracts arbitrary relation phrases directly from text without requiring a predefined schema or fixed relation ontology",
          "OpenIE does not extract subjects or objects",
          "OpenIE requires 64-bit integer labels"
        ],
        "a": 1,
        "why": "Traditional relation extraction classifies pairs into a fixed ontology (e.g. 50 predefined relations), whereas OpenIE extracts open-vocabulary relational verbs directly from sentence text."
      }
    ],
    "related": [
      "semantic-role-labelling",
      "semantic-search-and-dense-retrieval"
    ],
    "keywords": "information and relation extraction, information and relation extraction: openie, distant supervision, and knowledge graph construction, natural language processing, deep learning"
  },
  {
    "id": "dialogue-systems",
    "short": "Dialogue Systems & DST",
    "title": "Dialogue Systems: Task-Oriented Dialogue, Slot Filling, and Conversational State Tracking",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Dialogue systems bifurcate into open-domain chit-chat (conversational engagement) and task-oriented dialogue (goal completion). Traditional TOD pipelines operate as modular pipelines: NLU (intent classification and slot filling), DST (dialogue state tracking), DP (dialogue policy), and NLG (natural language generation). Dialogue State Tracking (DST) maintains an accumulated belief state across multi-turn exchanges, tracking active domain constraints (slots and values). End-to-end neural dialogue models combine pipeline stages into single autoregressive models conditioned on dialogue history and database query results.",
    "lead": "Dialogue systems enable multi-turn natural interactions between humans and computers. Task-Oriented Dialogue (TOD) architectures coordinate Natural Language Understanding (intent detection and slot filling), Dialogue State Tracking (DST), and policy optimisation to help users accomplish concrete goals such as flight reservations and technical support.",
    "analogy": "Imagine ordering food at a busy diner counter. You say \"Give me a burger\", then \"Make it medium rare\", and finally \"Add cheddar on that\". The server does not throw away their order pad after each sentence. They hold a clipboard (the Dialogue State) where they check off burger, write \"medium rare\", and add \"cheddar\". Once all necessary fields are filled, they hand the slip to the kitchen.",
    "intuition": [
      "When you chat with a flight booking assistant, the conversation happens across multiple turns: \"I need a flight to Paris\" (Turn 1), \"Sure, when do you want to depart?\" (Turn 2), \"Next Friday morning\" (Turn 3). To book the flight, the assistant cannot treat Turn 3 in isolation—saying \"Next Friday morning\" without context means nothing. The assistant must remember the destination (\"Paris\") from Turn 1, combine it with the departure time (\"next Friday morning\") from Turn 3, check the airline database, and offer flight choices. This memory tracking mechanism is called Dialogue State Tracking (DST). It maps free-form conversational utterances into a structured \"belief state\" (e.g. `destination: Paris`, `departure_date: 2026-11-06`) that a computer database can execute."
    ],
    "steps": [
      "Parse incoming user utterance: run intent classification (e.g. `inform_booking`) and slot filling (BIO tagging for parameters).",
      "Update dialogue belief state: combine new extracted slots with prior history, resolving anaphoric references (e.g. \"there\" -> Paris).",
      "Query backend database: execute API calls or database lookups using the constraints stored in the updated dialogue state.",
      "Select dialogue action: evaluate the dialogue policy to decide system response strategy (e.g. request missing slot, present options, confirm booking).",
      "Generate response: synthesize natural language response reflecting the chosen action and database query results."
    ],
    "math": [
      {
        "h": "Dialogue Systems: Task-Oriented Dialogue, Slot Filling, and Conversational State Tracking formulation (Part 1)",
        "tex": "P(S_t \\mid H_t) = \\prod_{k=1}^K P(w_k \\mid w_{<k}, H_t)",
        "p": "In discriminative slot filling, slot labels are predicted using sequence tagging:"
      },
      {
        "h": "Dialogue Systems: Task-Oriented Dialogue, Slot Filling, and Conversational State Tracking formulation (Part 2)",
        "tex": "y_i = \\arg\\max_{c \\in \\mathcal{C}} P(y_i = c \\mid x_1, \\dots, x_N)",
        "p": "Dialogue policy selection maps state $S_t$ and database return $D_t$ to system action $a_t \\in \\mathcal{A}$:"
      },
      {
        "h": "Dialogue Systems: Task-Oriented Dialogue, Slot Filling, and Conversational State Tracking formulation (Part 3)",
        "tex": "a_t = \\pi(S_t, D_t)",
        "p": "Turn-level Joint Goal Accuracy (JGA) evaluates whether all slot-value pairs match the ground-truth state exactly:"
      },
      {
        "h": "Dialogue Systems: Task-Oriented Dialogue, Slot Filling, and Conversational State Tracking formulation (Part 4)",
        "tex": "\\text{JGA} = \\frac{1}{T} \\sum_{t=1}^T \\mathbb{I}(\\hat{S}_t = S_t^*)",
        "p": "Turn-level Joint Goal Accuracy (JGA) evaluates whether all slot-value pairs match the ground-truth state exactly:"
      }
    ],
    "code": "class DialogueStateTracker:\n    \"\"\"Maintains belief state across multi-turn task-oriented dialogue.\"\"\"\n    def __init__(self):\n        self.state = {}\n        \n    def update(self, user_slots):\n        \"\"\"Updates internal slot-value memory with newly detected slots.\"\"\"\n        for slot, value in user_slots.items():\n            if value is not None:\n                self.state[slot] = value\n        return self.state\n        \n    def get_missing_slots(self, required_slots):\n        \"\"\"Identifies which essential slots have not yet been provided.\"\"\"\n        return [s for s in required_slots if s not in self.state]\n\n# Simulate a 3-turn hotel booking exchange\ntracker = DialogueStateTracker()\nrequired_slots = [\"destination\", \"check_in_date\", \"room_type\"]\n\n# Turn 1: \"I'd like to book a luxury room in Berlin\"\nturn1_extracted = {\"destination\": \"Berlin\", \"room_type\": \"luxury\"}\nstate1 = tracker.update(turn1_extracted)\nmissing1 = tracker.get_missing_slots(required_slots)\n\nprint(\"Turn 1 Dialogue State:\")\nprint(f\"  State: {state1}\")\nprint(f\"  System Action: Request missing slot -> '{missing1[0]}'\")\n\n# Turn 2: User responds: \"Arriving on 12th December\"\nturn2_extracted = {\"check_in_date\": \"2026-12-12\"}\nstate2 = tracker.update(turn2_extracted)\nmissing2 = tracker.get_missing_slots(required_slots)\n\nprint(\"\\nTurn 2 Dialogue State:\")\nprint(f\"  State: {state2}\")\nif not missing2:\n    print(\"  System Action: All slots satisfied! Executing database search API call...\")\n    print(f\"  API Query: SEARCH_HOTELS(city='{state2['destination']}', date='{state2['check_in_date']}', type='{state2['room_type']}')\")",
    "keyPoints": [
      "Task-oriented dialogue systems guide users to goal completion by coordinating NLU, state tracking, and backend API actions.",
      "Dialogue State Tracking maintains structured belief states across multi-turn exchanges, overcoming context fragmentation.",
      "Joint Goal Accuracy provides a rigorous benchmark for evaluating multi-turn conversational understanding."
    ],
    "pitfalls": [
      "Failing to handle user slot correction; if a user says \"Actually, make that London instead\", the system must overwrite the destination slot rather than appending to it.",
      "Evaluating dialogue systems solely on turn-level accuracy rather than end-to-end task success rate.",
      "Exposing database schemas directly to free-form generation models without validation filters, enabling prompt injections through dialogue parameters."
    ],
    "quiz": [
      {
        "q": "What is the primary function of Dialogue State Tracking (DST) in a task-oriented conversational agent?",
        "o": [
          "To generate audio waveforms for speech synthesizers",
          "To maintain an accurate, structured record of user goals, slot values, and constraints across multi-turn interactions",
          "To compress conversation history into single-character tokens",
          "To assign parts of speech to individual words"
        ],
        "a": 1,
        "why": "DST tracks user intent and constraints across turns into an updated belief state, which acts as the parameter set for backend API queries."
      },
      {
        "q": "What is Joint Goal Accuracy (JGA) in dialogue system evaluation?",
        "o": [
          "The percentage of turns where every single predicted slot-value pair in the dialogue state matches ground truth exactly",
          "The average speed of user typing in the chat interface",
          "The BLEU score between system response and user prompt",
          "The total number of conversation turns before termination"
        ],
        "a": 0,
        "why": "JGA is a strict metric: a turn is scored as 1 only if all slot values in the dialogue state are completely correct; if even one slot is wrong or missing, the turn score is 0."
      },
      {
        "q": "What distinguishes Task-Oriented Dialogue (TOD) from Open-Domain Chit-Chat?",
        "o": [
          "TOD runs on neural networks while chit-chat uses rule-based templates",
          "TOD focuses on helping users accomplish specific transactional tasks via APIs, while chit-chat focuses on engaging conversation without explicit task goals",
          "TOD only supports English",
          "Chit-chat systems cannot process multi-turn input"
        ],
        "a": 1,
        "why": "Task-oriented dialogue systems are designed to complete specific goals (booking travel, customer support) through structured APIs, whereas chit-chat systems focus on conversational engagement."
      }
    ],
    "related": [
      "the-agent-loop-react",
      "prompting-and-in-context-learning"
    ],
    "keywords": "dialogue systems, dialogue systems: task-oriented dialogue, slot filling, and conversational state tracking, natural language processing, deep learning"
  },
  {
    "id": "coreference-resolution",
    "short": "Coreference Resolution",
    "title": "Coreference Resolution: Mention Detection, Pairwise Scoring, and SpanBERT",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Coreference resolution identifies mentions (spans of text) and partitions them into clusters referring to identical entities. Coreference encompasses diverse linguistic phenomena: anaphora (pronoun referring back to antecedent), cataphora (pronoun preceding referent), and apposition. Classic approaches rely on mention-pair classification or mention-ranking models evaluated across MUC, $B^3$, and CEAF metrics. Modern end-to-end neural systems (e.g. SpanBERT coref) jointly extract candidate spans and predict antecedent link probabilities without pipelined syntactic parsers.",
    "lead": "Coreference Resolution groups all mentions in a text that refer to the same real-world entity into coherent equivalence clusters. Resolving pronouns (\"she\", \"it\"), noun phrases (\"the company\"), and proper names (\"Alphabet\") is vital for document comprehension, question answering, and automated summarisation.",
    "analogy": "Imagine reading a detective novel where a character is referred to variably as \"the inspector\", \"John\", \"he\", \"the veteran detective\", and \"the man in the raincoat\". As a reader, your brain maintains a single mental dossier for this character, pinning each moniker onto the same bulletin board profile. Coreference resolution builds and maintains these entity dossiers computationally.",
    "intuition": [
      "Consider the sentence: \"Dr Marie Curie visited Paris. She conducted research there because the city offered excellent laboratories.\" Who does \"She\" refer to? Marie Curie. What does \"the city\" and \"there\" refer to? Paris. Humans resolve these referential connections effortlessly. For a computer, however, \"Marie Curie\", \"She\", \"Paris\", \"there\", and \"the city\" are distinct strings of characters. If a question answering system is asked \"Where did Marie Curie conduct research?\", it cannot answer unless it connects \"there\" and \"the city\" back to \"Paris\". Coreference resolution solves this problem: it scans the document, identifies all noun phrases and pronouns (mentions), and links them into clusters that refer to the exact same underlying real-world entity."
    ],
    "steps": [
      "Extract candidate text spans: enumerate all contiguous word sequences up to a maximum span width (e.g. 10 tokens).",
      "Encode span representations: compute contextual token embeddings (SpanBERT) and apply self-attention pooling over internal span words.",
      "Prune candidate mentions: compute unary mention scores $s_m(i)$ and prune top spans to maintain $\\lambda T$ candidates, discarding non-entity phrases.",
      "Score candidate antecedent pairs: compute relational pairwise compatibility scores $s(i, j)$ between surviving spans.",
      "Decode coreference clusters: assign each span to its highest scoring antecedent, linking spans into directed trees and taking transitive closures to form final entity clusters.",
      "Evaluate CoNLL metric: compute the unweighted average of MUC, $B^3$, and $\\text{CEAF}_{\\phi_4}$ F1 scores."
    ],
    "math": [
      {
        "h": "Coreference Resolution: Mention Detection, Pairwise Scoring, and SpanBERT formulation (Part 1)",
        "tex": "\\mathbf{g}_i = [\\mathbf{x}_{\\text{START}(i)} \\,;\\, \\mathbf{x}_{\\text{END}(i)} \\,;\\, \\mathbf{x}_i^* \\,;\\, \\mathbf{\\phi}(i)]",
        "p": "Pairwise coreference score $s(i, j)$ between span $i$ and candidate antecedent $j$ is formulated as:"
      },
      {
        "h": "Coreference Resolution: Mention Detection, Pairwise Scoring, and SpanBERT formulation (Part 2)",
        "tex": "s(i, j) = \\begin{cases} 0 & j = \\epsilon \\\\ s_m(i) + s_m(j) + s_a(i, j) & j \\ne \\epsilon \\end{cases}",
        "p": "where $s_m(i) = \\mathbf{w}_m^T \\text{FFNN}_m(\\mathbf{g}_i)$ measures mention score and $s_a(i, j) = \\mathbf{w}_a^T \\text{FFNN}_a([\\mathbf{g}_i, \\mathbf{g}_j, \\mathbf{g}_i \\odot \\mathbf{g}_j, \\mathb..."
      },
      {
        "h": "Coreference Resolution: Mention Detection, Pairwise Scoring, and SpanBERT formulation (Part 3)",
        "tex": "P(a_i = j) = \\frac{\\exp(s(i, j))}{\\sum_{j' \\in \\mathcal{Y}(i)} \\exp(s(i, j'))}",
        "p": "Training maximises marginal log-likelihood of gold cluster antecedents $\\mathcal{C}(i)$:"
      },
      {
        "h": "Coreference Resolution: Mention Detection, Pairwise Scoring, and SpanBERT formulation (Part 4)",
        "tex": "\\mathcal{L} = \\sum_{i=1}^N \\log \\sum_{j \\in \\mathcal{Y}(i) \\cap \\mathcal{C}(i)} P(a_i = j)",
        "p": "Training maximises marginal log-likelihood of gold cluster antecedents $\\mathcal{C}(i)$:"
      }
    ],
    "code": "import numpy as np\n\ndef resolve_coreference_toy(mentions, pairwise_matrix):\n    \"\"\"Clusters mentions into entities using antecedent link argmax.\"\"\"\n    N = len(mentions)\n    clusters = {i: [i] for i in range(N)}\n    parent = list(range(N))\n    \n    def find(i):\n        if parent[i] == i:\n            return i\n        parent[i] = find(parent[i])\n        return parent[i]\n        \n    def union(i, j):\n        root_i = find(i)\n        root_j = find(j)\n        if root_i != root_j:\n            parent[root_i] = root_j\n            \n    # For each mention i > 0, find best antecedent j < i\n    for i in range(1, N):\n        scores = pairwise_matrix[i, :i]\n        best_j = np.argmax(scores)\n        # Threshold for linking\n        if scores[best_j] > 0.0:\n            union(i, best_j)\n            \n    # Aggregate into clusters\n    final_clusters = {}\n    for i in range(N):\n        root = find(i)\n        if root not in final_clusters:\n            final_clusters[root] = []\n        final_clusters[root].append(mentions[i])\n        \n    return list(final_clusters.values())\n\n# Mentions extracted from: \"Marie Curie arrived in Paris. She loved the capital city.\"\nmentions = [\n    \"Marie Curie\",     # 0\n    \"Paris\",           # 1\n    \"She\",             # 2\n    \"the capital city\" # 3\n]\n\n# Simulated pairwise affinity matrix (row = mention i, col = candidate antecedent j)\npairwise_scores = np.array([\n    [ 0.0,  0.0,  0.0,  0.0],\n    [-2.0,  0.0,  0.0,  0.0],\n    [ 4.5, -3.0,  0.0,  0.0],  # \"She\" -> strong link to \"Marie Curie\"\n    [-3.0,  5.2, -2.5,  0.0]   # \"the capital city\" -> strong link to \"Paris\"\n])\n\nclusters = resolve_coreference_toy(mentions, pairwise_scores)\n\nprint(\"Discovered Coreference Entity Clusters:\")\nfor idx, cluster in enumerate(clusters, 1):\n    print(f\"  Cluster {idx}: {cluster}\")",
    "keyPoints": [
      "Coreference resolution connects pronouns and variant noun phrases to their canonical real-world entity referents.",
      "End-to-end models jointly score mention spans and pairwise antecedent links via contextual transformer encoders.",
      "The standard CoNLL metric combines MUC, $B^3$, and CEAF scores to evaluate clustering fidelity across diverse entity types."
    ],
    "pitfalls": [
      "Conflating apposition or predicative nominals (\"Barack Obama, the president\") as separate entities rather than coreferent mentions of the same individual.",
      "Evaluating models solely on pronoun resolution (Winograd schemas), ignoring complex nominal coreference chains involving lexical variation.",
      "Suffering cubic computational complexity $\\mathcal{O}(N^3)$ without span pruning; unrestricted pairwise comparison over all text spans explodes on long documents."
    ],
    "quiz": [
      {
        "q": "What is the primary objective of coreference resolution?",
        "o": [
          "To translate pronouns into grammatical case markers",
          "To identify all text mentions that refer to the same real-world entity and group them into equivalence clusters",
          "To detect spelling errors in proper nouns",
          "To compute syntactic dependency trees for sentences"
        ],
        "a": 1,
        "why": "Coreference resolution clusters mentions (names, pronouns, definite noun phrases) across a text that refer to the identical underlying entity."
      },
      {
        "q": "What is the official CoNLL evaluation score for coreference resolution systems?",
        "o": [
          "BLEU score averaged over 4-grams",
          "The unweighted arithmetic mean of MUC, $B^3$, and $\\text{CEAF}_{\\phi_4}$ F1 scores",
          "The exact match accuracy of pronouns",
          "The Spearman correlation with human glosses"
        ],
        "a": 1,
        "why": "The standard CoNLL metric averages the F1 scores of three complementary clustering metrics: MUC (link-based), $B^3$ (mention-based), and $\\text{CEAF}_{\\phi_4}$ (entity-based)."
      },
      {
        "q": "Why does SpanBERT achieve superior performance over standard BERT on coreference resolution tasks?",
        "o": [
          "SpanBERT replaces transformers with convolutional networks",
          "SpanBERT is pretrained using span boundary objective and mask contiguous spans, creating richer representations of complete phrases",
          "SpanBERT removes all subword tokenisation",
          "SpanBERT only processes sentences containing pronouns"
        ],
        "a": 1,
        "why": "SpanBERT masks contiguous spans of tokens and introduces a span boundary objective (SBO), training representations to summarise full multi-word mentions from their boundary tokens."
      }
    ],
    "related": [
      "bert-and-masked-language-models",
      "semantic-role-labelling"
    ],
    "keywords": "coreference resolution, coreference resolution: mention detection, pairwise scoring, and spanbert, natural language processing, deep learning"
  },
  {
    "id": "bias-and-fairness-in-nlp",
    "short": "Bias & Fairness in NLP",
    "title": "Bias and Fairness in NLP: Demographic Disparities, Toxicity, and Mitigation Strategies",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Harms of NLP systems partition into representational harms (stereotyping, erasure, toxic association) and allocational harms (denial of resources or opportunities). Evaluation benchmarks evaluate demographic parity, equalized odds, and performance disparities across dialects (e.g. African American Vernacular English). Mitigation techniques span pre-processing (counterfactual data augmentation), in-processing (adversarial debiasing, fairness-constrained losses), and post-processing (toxicity classifiers and safety guardrails). The alignment-tax trade-off requires balancing aggressive safety filtering against model utility and knowledge retention.",
    "lead": "Language models ingest vast uncurated web corpora, inadvertently learning and amplifying societal prejudices, demographic disparities, and toxic stereotypes. Identifying, measuring, and mitigating algorithmic harm requires quantitative fairness metrics, counterfactual data augmentation, representation debiasing, and robust safety guardrails.",
    "analogy": "Imagine a sound recording studio with an acoustic echo chamber. If the city outside has constant traffic rumble, the recording equipment captures and magnifies that rumble into every musical track. Bias in NLP is that acoustic rumble: the training text echoes centuries of societal prejudices, which the neural network dutifully amplifies unless soundproofing acoustic filters (fairness interventions) are deliberately installed.",
    "intuition": [
      "If you train a commercial resume screening model on historical hiring data, and historical hiring predominantly favoured male engineers over female engineers, the model will discover that words like \"women's rugby\" or names like \"Sarah\" correlate with lower hiring rates. Even if you explicitly remove gender columns, the model infers gender through subtle proxies in hobbies, colleges, and language style. In natural language generation, LLMs frequently associate neutral sentences about minority groups with higher toxicity scores, or complete prompts about female doctors with \"the nurse said\". Fairness in NLP is about systematically uncovering these hidden biases, defining rigorous metrics to quantify disparities, and applying algorithmic interventions so automated language systems treat all demographic groups with equal dignity and accuracy."
    ],
    "steps": [
      "Identify potential harms: classify whether the model application poses representational harms (stereotypes) or allocational harms (credit or hiring decisions).",
      "Audit training data: measure demographic representation ratios and word-co-occurrence disparities across protected categories.",
      "Apply Counterfactual Data Augmentation (CDA): create symmetric paired examples by swapping demographic keywords (e.g. gender pronouns, cultural names).",
      "Implement fairness-aware objective: train models with adversarial gradient reversal or demographic parity regularisers.",
      "Evaluate subgroup performance: disaggregate validation metrics across demographic groups, dialects (e.g. AAVE vs standard English), and intersectional identities.",
      "Deploy inference safety guardrails: apply post-generation toxicity filtering and safety calibration before surfacing responses to end users."
    ],
    "math": [
      {
        "h": "Bias and Fairness in NLP: Demographic Disparities, Toxicity, and Mitigation Strategies formulation (Part 1)",
        "tex": "P(\\hat{Y} = 1 \\mid A = 0) = P(\\hat{Y} = 1 \\mid A = 1)",
        "p": "Equalised Odds requires both False Positive Rates and True Positive Rates to be equal across groups given ground-truth label $Y$:"
      },
      {
        "h": "Bias and Fairness in NLP: Demographic Disparities, Toxicity, and Mitigation Strategies formulation (Part 2)",
        "tex": "P(\\hat{Y} = 1 \\mid A = 0, Y = y) = P(\\hat{Y} = 1 \\mid A = 1, Y = y), \\quad \\forall y \\in \\{0, 1\\}",
        "p": "In generative language models, Counterfactual Token Perturbation measures the variation in probability when swapping demographic terms $(t_A, t_B)$ (e.g. \"he\" vs \"she\"):"
      },
      {
        "h": "Bias and Fairness in NLP: Demographic Disparities, Toxicity, and Mitigation Strategies formulation (Part 3)",
        "tex": "\\Delta_{\\text{counterfactual}} = \\mathbb{E}_{x} \\left| \\log P(Y \\mid x[t_A]) - \\log P(Y \\mid x[t_B]) \\right|",
        "p": "Adversarial debiasing trains the main task predictor $\\mathbf{W}_p$ to minimise task loss $\\mathcal{L}_{\\text{task}}$ while maximising the loss of an adversary $\\mathbf{W}_{\\text{adv}}$ predicting ..."
      },
      {
        "h": "Bias and Fairness in NLP: Demographic Disparities, Toxicity, and Mitigation Strategies formulation (Part 4)",
        "tex": "\\min_{\\theta} \\max_{\\phi} \\mathcal{L}_{\\text{task}}(\\theta) - \\lambda \\mathcal{L}_{\\text{adv}}(\\theta, \\phi)",
        "p": "Adversarial debiasing trains the main task predictor $\\mathbf{W}_p$ to minimise task loss $\\mathcal{L}_{\\text{task}}$ while maximising the loss of an adversary $\\mathbf{W}_{\\text{adv}}$ predicting ..."
      }
    ],
    "code": "import numpy as np\n\ndef evaluate_subgroup_metrics(y_true, y_pred, sensitive_attr):\n    \"\"\"Computes demographic parity and equalised odds metrics across groups.\"\"\"\n    groups = np.unique(sensitive_attr)\n    metrics = {}\n    \n    for g in groups:\n        mask = (sensitive_attr == g)\n        n_g = np.sum(mask)\n        positive_rate = np.mean(y_pred[mask])\n        \n        # True Positive Rate (TPR) and False Positive Rate (FPR)\n        pos_mask = mask & (y_true == 1)\n        neg_mask = mask & (y_true == 0)\n        \n        tpr = np.mean(y_pred[pos_mask]) if np.sum(pos_mask) > 0 else 0.0\n        fpr = np.mean(y_pred[neg_mask]) if np.sum(neg_mask) > 0 else 0.0\n        \n        metrics[f\"Group_{g}\"] = {\n            'count': int(n_g),\n            'selection_rate': positive_rate,\n            'TPR': tpr,\n            'FPR': fpr\n        }\n        \n    # Demographic Parity Difference\n    rates = [m['selection_rate'] for m in metrics.values()]\n    dp_diff = np.max(rates) - np.min(rates)\n    \n    # Equalised Odds Max Disparity\n    tprs = [m['TPR'] for m in metrics.values()]\n    fprs = [m['FPR'] for m in metrics.values()]\n    eq_odds_diff = max(np.max(tprs) - np.min(tprs), np.max(fprs) - np.min(fprs))\n    \n    return metrics, dp_diff, eq_odds_diff\n\n# Simulation: Resume screening classifier on Group 0 (baseline) vs Group 1 (minority)\nnp.random.seed(42)\nN = 1000\nsensitive = np.random.binomial(1, 0.4, size=N)  # 40% minority group\ny_true = np.random.binomial(1, 0.5, size=N)     # True qualified status\n\n# Simulate biased model predictions (biased toward Group 0)\nlogits = y_true * 2.0 - 1.0 - (sensitive * 0.8) + np.random.randn(N) * 0.5\ny_pred = (logits > 0).astype(int)\n\nsubgroups, dp_gap, eq_gap = evaluate_subgroup_metrics(y_true, y_pred, sensitive)\n\nprint(\"Algorithmic Fairness Audit Report:\")\nfor g, data in subgroups.items():\n    print(f\"  {g}: Selection Rate={data['selection_rate']*100:.1f}%, TPR={data['TPR']:.3f}, FPR={data['FPR']:.3f}\")\n    \nprint(f\"\\nDemographic Parity Gap:   {dp_gap * 100:.2f}% (Ideal: 0.0%)\")\nprint(f\"Equalised Odds Disparity: {eq_gap * 100:.2f}% (Ideal: 0.0%)\")",
    "keyPoints": [
      "Unchecked NLP models amplify historical societal prejudices present within web-scale pretraining text.",
      "Fairness auditing requires disaggregating error metrics across demographic groups, dialects, and intersectional identities.",
      "Combining counterfactual data augmentation, adversarial debiasing, and post-generation safety guardrails establishes comprehensive harm mitigation."
    ],
    "pitfalls": [
      "Blindly pursuing Demographic Parity when ground truth base rates vary legitimately across non-protected criteria, which can unintentionally harm performance.",
      "Failing to evaluate intersectionality; a system might appear fair toward women and toward racial minorities individually, while exhibiting extreme bias against minority women.",
      "Relying solely on keyword blocklists to filter toxicity, which frequently penalizes reclamation of reclaimed terms within marginalized speech communities."
    ],
    "quiz": [
      {
        "q": "What is the key distinction between representational harms and allocational harms in NLP systems?",
        "o": [
          "Representational harms demean or stereotype groups in text; allocational harms unfairly withhold tangible resources or opportunities",
          "Representational harms only affect images; allocational harms affect text",
          "Allocational harms are intentional; representational harms are always accidental",
          "Representational harms can only occur on cloud servers"
        ],
        "a": 0,
        "why": "Representational harms affect how groups are depicted (stereotypes, toxic language, erasure), while allocational harms directly impact access to resources, jobs, loans, or justice."
      },
      {
        "q": "Which fairness metric requires equal False Positive Rates and True Positive Rates across all demographic groups?",
        "o": [
          "Demographic Parity",
          "Equalised Odds",
          "Perplexity",
          "Dice Similarity"
        ],
        "a": 1,
        "why": "Equalised Odds requires that both the true positive rate (sensitivity) and the false positive rate are equal across protected demographic groups."
      },
      {
        "q": "How does Counterfactual Data Augmentation (CDA) help mitigate gender bias in training corpora?",
        "o": [
          "By deleting all sentences that mention women",
          "By creating duplicate training examples with demographic terms swapped (e.g. \"he\" replaced with \"she\"), breaking spurious statistical correlations",
          "By encrypting training documents using SHA-256",
          "By forcing the model to generate only gender-neutral pronouns"
        ],
        "a": 1,
        "why": "CDA generates counterfactual pairs where gendered words and names are inverted, ensuring that demographic tokens provide zero predictive correlation with task labels."
      }
    ],
    "related": [
      "instruction-tuning-rlhf-and-dpo",
      "guardrails-and-red-teaming"
    ],
    "keywords": "bias and fairness in nlp, bias and fairness in nlp: demographic disparities, toxicity, and mitigation strategies, natural language processing, deep learning"
  },
];
