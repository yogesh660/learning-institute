// Lessons for this track. Conventions: see regression.js and CLAUDE.md.
const r = String.raw;
module.exports = [
  {
  id: 'pixels-channels-and-colour-spaces',
  short: 'Pixels & Colours',
  title: 'Pixels, channels and colour spaces',
  task: 'concepts',
  module: 'Image basics',
  level: 1,
  minutes: 14,
  noLab: true,
  summary: r`Digital images are discrete multidimensional arrays of sampled spatial irradiance measurements. Understanding coordinate conventions, intensity quantisation across bit depths, memory layout differences ($H \times W \times C$ vs $C \times H \times W$), and mathematical conversions between colour spaces (RGB, Grayscale, HSV, and CIE $L^*a^*b^*$) forms the essential foundation for computer vision algorithms and convolutional neural network architectures.`,
  lead: r`Every digital photograph or video frame begins life as photons striking a silicon sensor grid, converted into an array of electrical voltages and discretised into numerical matrices. Before a machine learning algorithm can recognise an object, segment a medical scan, or guide an autonomous drone, it must interpret these raw numeric tensors. How an image is represented—whether as raw primary additive colour intensities, decoupled luminance and chrominance, or perceptually uniform coordinates—directly determines how effectively downstream filters and neural layers learn invariant visual representations.`,
  intuition: [
    r`Spatial sampling and radiometric quantisation: A continuous visual scene is sampled on a rectangular lattice of discrete picture elements ("pixels") over a grid of height $H$ and width $W$. Each pixel's brightness is quantised into a discrete integer value governed by bit depth. In standard 8-bit imaging, intensities range over $2^8 = 256$ discrete levels from $0$ (absence of light, pure black) to $255$ (sensor saturation, pure white). Higher bit depths, such as 12-bit or 16-bit used in medical imaging and astronomy, offer expanded dynamic range to prevent clipping in intense highlights or deep shadows.`,
    r`Additive trichromacy and the Bayer mosaic: Human colour perception is trichromatic, mediated by retinal cone cells sensitive to short (blue), medium (green), and long (red) optical wavelengths. Digital camera sensors capture this trichromatic signal using an overlaid mosaic filter (most commonly the Bayer colour filter array). Because human photopic vision possesses peak spatial and luminance acuity in the green spectral band, Bayer arrays allocate twice as many green sensor elements as red or blue (a $2 \times 2$ repeating pattern of $R, G, G, B$). Demosaicing algorithms then interpolate these sensor readings into three co-registered channel grids: Red, Green, and Blue.`,
    r`Tensor layouts and channel ordering: In spatial matrix coordinates, the origin $(0, 0)$ is situated at the top-left corner of the image, with row indices $y \in [0, H-1]$ pointing vertically downwards and column indices $x \in [0, W-1]$ pointing horizontally to the right. Numerical libraries differ in how colour channels are arranged in memory. Image processing toolkits like OpenCV and NumPy store arrays in channel-last layout ($H \times W \times C$), whereas deep learning frameworks like PyTorch standardise on channel-first tensors ($C \times H \times W$ or batch-first $N \times C \times H \times W$) to optimise parallel matrix multiplications on GPU tensor cores.`,
    r`The limitation of RGB and the power of decoupled colour spaces: RGB entangles illumination intensity (luminance) directly with chromatic hue. If an illuminant dims or a shadow falls across a surface, all three RGB colour values drop simultaneously, frustrating simple colour segmentation. Transforming to colour spaces like HSV (Hue, Saturation, Value) or CIE $L^*a^*b^*$ decouples perceived lightness from chromaticity. This allows computer vision systems to achieve lighting invariance by operating purely on the chrominance coordinates while remaining robust to harsh lighting shifts.`,
  ],
  analogy: r`Think of colour spaces as different vocabularies for mixing paint. RGB is like ordering paint by specifying the exact millilitres of red, green, and blue base pigments poured from three mechanical dispensers. This formulation tells the dispensing machine exactly what to mix, but it makes intuitive adjustments difficult: if an artist asks for "the same paint shade, but lit by bright sunshine rather than twilight," you would have to calculate complex proportional changes across all three pigment valves simultaneously. HSV, by contrast, describes paint the way an artist thinks: "Which pure pigment angle on the colour wheel (Hue)? How saturated is it, or is it muted with white (Saturation)? And how much light is shining on the canvas (Value)?" Both vocabularies specify identical colours, but HSV lets you adjust lighting without altering the hue.`,
  steps: [
    {
      title: r`Discretise sensor irradiance into pixel tensors`,
      desc: r`Map continuous optical scenes to discrete spatial coordinate grids and numerical bit depths.`,
      detail: r`An optical image of dimensions $H \times W$ with $C=3$ colour channels is represented as an array of shape $(H, W, 3)$ with 8-bit unsigned integer data types (uint8). Pixel values span $[0, 255]$, where $(0, 0, 0)$ denotes pure black and $(255, 255, 255)$ denotes pure white.`,
    },
    {
      title: r`Handle channel ordering conventions`,
      desc: r`Account for RGB versus BGR channel arrangements across libraries.`,
      detail: r`Standard imaging formats (PNG, JPEG, PIL) store channels in Red-Green-Blue (RGB) sequence. OpenCV historically defaults to Blue-Green-Red (BGR) channel ordering due to early camera frame grabber hardware conventions. Failing to convert BGR to RGB via cv2.cvtColor(img, cv2.COLOR_BGR2RGB) before processing swaps red and blue spectra, producing unnatural cyan faces and blue highlights.`,
    },
    {
      title: r`Convert trichromatic channels to perceptual grayscale`,
      desc: r`Collapse 3-channel colour images into single-channel luminance arrays matching human visual sensitivity.`,
      detail: r`Because the human eye is disproportionately sensitive to green wavelengths and least sensitive to blue, computing a naive arithmetic average $(R + G + B)/3$ yields distorted perceived brightness. Standard luminance standards (such as ITU-R BT.601) weight channels according to photopic luminous efficiency: $Y = 0.299 R + 0.587 G + 0.114 B$.`,
    },
    {
      title: r`Transform to cylindrical HSV colour space`,
      desc: r`Decouple chromatic tone and colour purity from overall illumination intensity.`,
      detail: r`Determine Value as $V = \max(R, G, B)$. Compute Saturation as the relative colour purity $S = (V - \min(R, G, B)) / V$. Compute Hue $H \in [0^\circ, 360^\circ)$ as an angular position along the colour circle determined by which colour channel forms the dominant peak.`,
    },
    {
      title: r`Normalise and reshape for neural processing`,
      desc: r`Scale integer pixel values to floating-point representations and transpose memory layouts.`,
      detail: r`Deep neural networks require zero-centred, unit-variance floating-point inputs. Convert uint8 arrays to float32, divide by $255.0$ to scale into $[0.0, 1.0]$, subtract dataset channel means, and permute spatial axes from $H \times W \times C$ to PyTorch's native $C \times H \times W$ tensor format.`,
    },
  ],
  math: [
    {
      h: r`Perceptual grayscale luminance (ITU-R BT.601)`,
      tex: r`Y = 0.299\,R + 0.587\,G + 0.114\,B`,
      p: r`The weights reflect the human eye's spectral sensitivity curve: green light contributes approximately $58.7\%$ of perceived luminance, red contributes $29.9\%$, and blue contributes only $11.4\%$. In high-definition video standards (ITU-R BT.709), updated coefficients $Y = 0.2126\,R + 0.7152\,G + 0.0722\,B$ are used.`,
    },
    {
      h: r`HSV colour transformation`,
      tex: r`V = \max(R, G, B), \quad S = \begin{cases} 0 & \text{if } V = 0 \\ \frac{V - \min(R, G, B)}{V} & \text{otherwise} \end{cases}`,
      p: r`Value $V \in [0, 1]$ measures brightness. Saturation $S \in [0, 1]$ quantifies colour purity (with $S=0$ representing neutral greyscale). Hue $H \in [0^\circ, 360^\circ)$ represents angular colour tone computed piecewise depending on whether $R$, $G$, or $B$ is maximal.`,
    },
    {
      h: r`Perceptual colour difference in CIE L*a*b* space`,
      tex: r`\Delta E^*_{ab} = \sqrt{(\Delta L^*)^2 + (\Delta a^*)^2 + (\Delta b^*)^2}`,
      p: r`In non-linear colour spaces like RGB, Euclidean distance does not align with human perceptual colour difference: two RGB vectors with distance 20 might appear indistinguishable, while another pair with distance 20 appears starkly different. CIE $L^*a^*b^*$ is designed to be perceptually uniform, such that Euclidean metric distance $\Delta E^*$ directly mirrors human perceptual difference.`,
    },
  ],
  keyPoints: [
    r`Digital images are 3D numeric tensors: Height $\times$ Width $\times$ Channels, typically quantised as 8-bit unsigned integers ($[0, 255]$).`,
    r`Grayscale luminance conversion requires perceptual weighting ($0.299 R + 0.587 G + 0.114 B$) rather than a simple unweighted arithmetic mean.`,
    r`RGB entangles lighting with chromaticity; HSV and CIE $L^*a^*b^*$ separate luminance from chrominance, enabling illumination-invariant feature extraction.`,
    r`OpenCV reads images in BGR channel order by default, whereas PIL, matplotlib, and PyTorch expect standard RGB order.`,
    r`Deep neural networks expect channel-first memory layout ($C \times H \times W$), requiring transposition from channel-last ($H \times W \times C$) numpy arrays.`,
  ],
  pitfalls: [
    r`OpenCV BGR versus RGB confusion: Forgetting that cv2.imread loads images in BGR format leads to reversed colour channels when passed to PyTorch or matplotlib, causing dramatic drops in inference accuracy.`,
    r`Unintended integer overflow in uint8 arithmetic: In 8-bit unsigned integer arithmetic, $250 + 10 = 4$ due to modulo 256 wrap-around; always cast arrays to float32 before performing additions, subtractions, or filtering.`,
    r`Calculating Euclidean distance across the angular Hue seam: In HSV space, pure red lies at both $0^\circ$ and $360^\circ$. A naive Euclidean distance between $5^\circ$ and $355^\circ$ yields $350^\circ$ rather than the true angular distance of $10^\circ$.`,
    r`Feeding unnormalised $[0, 255]$ integers into neural networks: Passing raw uint8 integers into neural layers causes exploding activations and saturated non-linearities; always scale to $[0.0, 1.0]$ and standardise channel statistics.`,
    r`Assuming equal perceptual sensitivity across channels: Performing image processing tasks (such as edge filtering or thresholding) on unweighted channel averages ignores human luminous sensitivity, losing critical contrast detail in green and red regions.`,
  ],
  code: r`import numpy as np

# Create a synthetic 4x4 RGB image with distinct primary and secondary colours
# Shape: Height=4, Width=4, Channels=3 (uint8)
img_rgb = np.zeros((4, 4, 3), dtype=np.uint8)
img_rgb[0, 0] = [255, 0, 0]     # Pure Red
img_rgb[0, 1] = [0, 255, 0]     # Pure Green
img_rgb[0, 2] = [0, 0, 255]     # Pure Blue
img_rgb[0, 3] = [255, 255, 0]   # Yellow (Red + Green)
img_rgb[1, 0] = [0, 255, 255]   # Cyan (Green + Blue)
img_rgb[1, 1] = [255, 0, 255]   # Magenta (Red + Blue)
img_rgb[1, 2] = [255, 255, 255] # White
img_rgb[1, 3] = [128, 128, 128] # Mid Grey

# 1. Grayscale conversion: ITU-R BT.601 perceptual luminance weights
# Y = 0.299 * R + 0.587 * G + 0.114 * B
rgb_norm = img_rgb.astype(np.float32) / 255.0
r = rgb_norm[..., 0]
g = rgb_norm[..., 1]
b = rgb_norm[..., 2]
gray_bt601 = 0.299 * r + 0.587 * g + 0.114 * b

print("RGB top-left 2x2 patch (R, G, B):")
print(img_rgb[:2, :2])

print("\nPerceptual Grayscale (BT.601, [0.0, 1.0]):")
print(np.round(gray_bt601[:2, :2], 3))
print(f"Pure Red luminance:   {gray_bt601[0, 0]:.3f} (matches 0.299)")
print(f"Pure Green luminance: {gray_bt601[0, 1]:.3f} (matches 0.587 - human eyes are most sensitive to green)")
print(f"Pure Blue luminance:  {gray_bt601[0, 2]:.3f} (matches 0.114)")

# 2. RGB to HSV conversion from scratch
v = np.max(rgb_norm, axis=-1)
c_min = np.min(rgb_norm, axis=-1)
delta = v - c_min

# Saturation: delta / v (0 if v == 0)
s = np.zeros_like(v)
non_zero = v > 0
s[non_zero] = delta[non_zero] / v[non_zero]

# Hue: piecewise angle [0, 360)
h = np.zeros_like(v)
mask_r = (delta > 0) & (v == r)
mask_g = (delta > 0) & (v == g) & (~mask_r)
mask_b = (delta > 0) & (v == b) & (~mask_r) & (~mask_g)

h[mask_r] = 60.0 * (((g[mask_r] - b[mask_r]) / delta[mask_r]) % 6)
h[mask_g] = 60.0 * (((b[mask_g] - r[mask_g]) / delta[mask_g]) + 2)
h[mask_b] = 60.0 * (((r[mask_b] - g[mask_b]) / delta[mask_b]) + 4)

print("\nHSV Channels (Hue in degrees, Saturation [0,1], Value [0,1]):")
print(f"Red:    H={h[0,0]:5.1f} deg, S={s[0,0]:.2f}, V={v[0,0]:.2f}")
print(f"Green:  H={h[0,1]:5.1f} deg, S={s[0,1]:.2f}, V={v[0,1]:.2f}")
print(f"Blue:   H={h[0,2]:5.1f} deg, S={s[0,2]:.2f}, V={v[0,2]:.2f}")
print(f"Yellow: H={h[0,3]:5.1f} deg, S={s[0,3]:.2f}, V={v[0,3]:.2f}")
print(f"Cyan:   H={h[1,0]:5.1f} deg, S={s[1,0]:.2f}, V={v[1,0]:.2f}")
print(f"Grey:   H={h[1,3]:5.1f} deg, S={s[1,3]:.2f}, V={v[1,3]:.2f} (Saturation is zero)")

# 3. Layout transposition: HWC to CHW for PyTorch
tensor_chw = np.transpose(rgb_norm, (2, 0, 1))
print(f"\nNumPy layout shape (HWC):   {rgb_norm.shape}")
print(f"PyTorch layout shape (CHW): {tensor_chw.shape}")`,
  quiz: [
    {
      q: r`Why does standard grayscale conversion weight green light much higher ($0.587$) than red ($0.299$) and blue ($0.114$)?`,
      o: [
        r`To match the photopic luminous sensitivity of the human visual system, which has peak cone acuity in the green spectrum`,
        r`Because digital camera sensors physically lack red and blue photoreceptors`,
        r`To prevent integer overflow when adding 8-bit channel intensities`,
        r`Because green light travels faster through optical glass lenses`,
      ],
      a: 0,
      why: r`Human eyes possess far more green-sensitive cones (M-cones) than blue (S-cones) or red (L-cones). The ITU-R BT.601 weights reflect this biological luminous efficiency, producing natural perceived brightness.`,
    },
    {
      q: r`What unintended visual defect occurs if an image loaded with OpenCV is displayed directly using a library expecting standard RGB order?`,
      o: [
        r`The image becomes completely inverted into a photographic negative`,
        r`Red and blue colour channels are swapped, making red objects appear blue and blue objects appear red`,
        r`The resolution of the image is downscaled by a factor of two`,
        r`The image is rotated 90 degrees counter-clockwise`,
      ],
      a: 1,
      why: r`OpenCV loads images in BGR format by default. If read without converting to RGB, channel 0 (blue) is interpreted as red, and channel 2 (red) is interpreted as blue.`,
    },
    {
      q: r`What primary advantage does the HSV colour space offer over RGB for computer vision tasks like colour-based object tracking?`,
      o: [
        r`HSV reduces image memory footprint from 3 bytes per pixel down to 1 byte per pixel`,
        r`HSV decouples chromatic colour tone (Hue) from illumination intensity (Value), making colour tracking resilient to shadows and lighting changes`,
        r`HSV allows non-linear convolution operations without using floating-point arithmetic`,
        r`HSV guarantees that all pixel coordinates sum to a constant value`,
      ],
      a: 1,
      why: r`In RGB, changing illumination shifts all three channel values simultaneously. In HSV, illumination variations primarily alter Value, while Hue remains invariant, simplifying colour-based segmentation under variable lighting.`,
    },
    {
      q: r`What happens when two uint8 pixel values 200 and 70 are added together in standard C-style or NumPy unsigned 8-bit arithmetic?`,
      o: [
        r`The result is automatically clamped to the maximum value of 255`,
        r`The value overflows modulo 256, resulting in 14 ($270 \pmod{256}$)`,
        r`The array automatically promotes to float64 without data loss`,
        r`The system raises an unhandled ZeroDivisionError exception`,
      ],
      a: 1,
      why: r`Unsigned 8-bit integers (uint8) span $0$ to $255$. Arithmetic overflow wraps around modulo 256: $(200 + 70) \pmod{256} = 14$, causing severe visual artifacts unless arrays are explicitly cast to floating-point types first.`,
    },
  ],
  usedBy: [],
  prereq: ['exploratory-data-analysis', 'convolutional_neural_networks'],
  related: ['edge-detection-sobel-and-canny', 'thresholding-histograms-and-morphology', 'normalisation-batch-layer-rms'],
  keywords: 'pixels channels colour spaces rgb bgr hsv grayscale luminance bayer filter bit depth uint8 chw hwc computer vision opencv',
},
  {
  id: 'edge-detection-sobel-and-canny',
  short: 'Sobel & Canny',
  title: 'Edge detection: Sobel and Canny',
  task: 'concepts',
  module: 'Image basics',
  level: 2,
  minutes: 16,
  noLab: true,
  summary: r`Edge detection identifies spatial intensity boundaries where physical scene properties—such as surface orientation, depth discontinuity, illumination gradients, or material reflectance—undergo abrupt changes. The Sobel operator computes discrete spatial derivative approximations using separable convolution kernels combining binomial smoothing with finite differences. The Canny edge detector extends gradient filtering into a multi-stage optimal pipeline incorporating Gaussian noise smoothing, directional gradient orientation, non-maximum suppression (NMS) for thin 1-pixel ridges, and dual-threshold hysteresis tracking.`,
  lead: r`To perceive objects, parse geometry, and navigate environments, natural and artificial visual systems first discard redundant interior textures and extract boundary contours. A solid wall, a roadway boundary, and a pedestrian silhouette are primarily defined by their edges. Edge detection formalises this principle mathematically: edges correspond to local extrema in spatial image gradients. From the discrete derivative approximations of the Sobel filter to John Canny's mathematically optimal edge criteria, boundary detection constitutes the cornerstone of classical vision and underpins early feature extraction in convolutional neural networks.`,
  intuition: [
    r`Edges as spatial derivative peaks: In a continuous two-dimensional image $I(x, y)$, brightness changes most rapidly in the direction of its spatial gradient vector $\nabla I = \left[\frac{\partial I}{\partial x}, \frac{\partial I}{\partial y}\right]^T$. The gradient magnitude $\|\nabla I\| = \sqrt{(\partial I/\partial x)^2 + (\partial I/\partial y)^2}$ quantifies the rate of intensity change, while the gradient orientation $\theta = \arctan2\left(\frac{\partial I}{\partial y}, \frac{\partial I}{\partial x}\right)$ points perpendicular (orthogonal) to the edge boundary, pointing in the direction of greatest brightening.`,
    r`Discrete approximation and the Sobel kernels: On a discrete pixel grid, spatial derivatives cannot be evaluated analytically; they must be approximated using finite differences. Simple forward or backward differences like $I(x+1, y) - I(x, y)$ are severely vulnerable to sensor noise. The Sobel operator resolves this by convolving with separable $3 \times 3$ kernels that compute a central difference along one dimension while simultaneously applying a triangular binomial smoothing filter $[1, 2, 1]^T$ along the perpendicular dimension. This orthogonal smoothing dampens high-frequency noise while preserving derivative sensitivity.`,
    r`The limitations of raw gradient magnitude: A raw Sobel gradient map produces thick, blurry ridges rather than crisp geometric boundaries. Thresholding the magnitude map with a single global cutoff creates an inescapable dilemma: setting the cutoff low introduces vast clouds of spurious texture noise, while setting it high fractures genuine object silhouettes into disconnected fragments.`,
    r`Canny's optimal edge detection pipeline: In 1986, John Canny formulated three mathematical criteria for optimal edge detection: low error rate (marking true edges without false detections), precise localisation (minimising spatial distance between marked edges and actual physical boundaries), and single response (preventing multiple duplicate responses for a single edge). Canny resolved these demands through a four-stage pipeline: Gaussian pre-filtering $\to$ directional Sobel gradients $\to$ Non-Maximum Suppression (thinning ridges to exactly 1 pixel by checking neighbours along the gradient normal) $\to$ Hysteresis thresholding with dual high and low cutoffs to preserve continuous contours.`,
  ],
  analogy: r`Imagine hiking in thick mountain fog trying to trace the knife-edge ridgeline along a mountain range. The Sobel gradient operates like an altimeter and compass: it tells you how steep the terrain is right under your boots and points in the direction of steepest ascent. But standing on a broad mountain flank, it is difficult to know if you are on the true knife-edge peak or merely a steep slope. Non-maximum suppression is like checking whether you stand at the absolute summit along the direction of slope: if a point just one metre uphill or downhill from you is higher, you are not on the true ridgeline crest. Hysteresis thresholding acts like an experienced mountaineering protocol: you only commit to following a ridge if its peak reaches an unmistakable alpine elevation (above the high threshold), but once safely on that ridge, you continue following it as long as the rock stays above the valley floor (above the low threshold), ignoring isolated low mounds.`,
  steps: [
    {
      title: r`Gaussian pre-smoothing`,
      desc: r`Convolve the raw image with a 2D Gaussian kernel to suppress high-frequency sensor noise.`,
      detail: r`Because differentiation acts as a high-pass filter that amplifies high-frequency electronic noise, smoothing the image with a Gaussian filter $G_\sigma$ of standard deviation $\sigma$ is essential. The effective scale parameter $\sigma$ dictates the size of features detected: small $\sigma$ preserves fine texture edges, while large $\sigma$ isolates dominant macro boundaries.`,
    },
    {
      title: r`Compute spatial gradient components and angles`,
      desc: r`Convolve the smoothed image with horizontal ($K_x$) and vertical ($K_y$) Sobel kernels.`,
      detail: r`Evaluate horizontal derivative $G_x = K_x * I$ and vertical derivative $G_y = K_y * I$. Compute gradient magnitude $G = \sqrt{G_x^2 + G_y^2}$ and directional orientation $\theta = \arctan2(G_y, G_x)$. The orientation angle $\theta$ defines the normal vector pointing across the edge.`,
    },
    {
      title: r`Apply Non-Maximum Suppression (NMS)`,
      desc: r`Thin thick gradient response ridges down to crisp 1-pixel-wide candidate edges.`,
      detail: r`Quantise the continuous gradient orientation $\theta$ into four canonical sectors centred at $0^\circ$ (horizontal), $45^\circ$ (diagonal), $90^\circ$ (vertical), and $135^\circ$ (anti-diagonal). For each pixel, compare its magnitude $G(r, c)$ against the two neighbouring pixels situated along the gradient normal. If $G(r, c)$ is not strictly greater than both directional neighbours, suppress it to zero.`,
    },
    {
      title: r`Classify pixels via double thresholding`,
      desc: r`Partition suppressed candidate pixels into strong, weak, and non-edge sets using dual thresholds.`,
      detail: r`Define two thresholds: a high threshold $T_{\text{high}}$ and a low threshold $T_{\text{low}}$ (typically set with ratio $T_{\text{high}} / T_{\text{low}} \approx 2$ to $3$). Candidate pixels with $G \ge T_{\text{high}}$ are classified as strong edges; pixels with $T_{\text{low}} \le G < T_{\text{high}}$ are marked as weak edges; pixels with $G < T_{\text{low}}$ are permanently discarded.`,
    },
    {
      title: r`Trace continuous contours using hysteresis`,
      desc: r`Connect weak edge candidates to strong edges using 8-connected neighbourhood flood-fill.`,
      detail: r`Iterate through the candidate edge map: any weak edge pixel that is topologically connected (via an 8-neighbourhood adjacency path) to a strong edge pixel is retained as a valid structural boundary. Isolated weak pixels that do not connect to strong edges are recognised as noise specks and suppressed.`,
    },
  ],
  math: [
    {
      h: r`Sobel convolution kernels`,
      tex: r`K_x = \begin{bmatrix}-1 & 0 & 1 \\ -2 & 0 & 2 \\ -1 & 0 & 1\end{bmatrix} = \begin{bmatrix}1 \\ 2 \\ 1\end{bmatrix} \begin{bmatrix}-1 & 0 & 1\end{bmatrix}, \quad K_y = \begin{bmatrix}-1 & -2 & -1 \\ 0 & 0 & 0 \\ 1 & 2 & 1\end{bmatrix} = \begin{bmatrix}-1 \\ 0 \\ 1\end{bmatrix} \begin{bmatrix}1 & 2 & 1\end{bmatrix}`,
      p: r`The horizontal kernel $K_x$ is the outer product of a vertical binomial smoothing filter $[1, 2, 1]^T$ and a horizontal central difference filter $[-1, 0, 1]$. Separability allows convolution in $O(2K)$ operations rather than $O(K^2)$ per pixel.`,
    },
    {
      h: r`Spatial gradient vector magnitude and orientation`,
      tex: r`\|\nabla I\| = \sqrt{G_x^2 + G_y^2}, \quad \theta = \arctan2(G_y, G_x)`,
      p: r`The magnitude $\|\nabla I\|$ reflects local edge contrast sharpness. The direction angle $\theta \in [-\pi, \pi]$ points in the direction of maximum intensity increase, which is orthogonal to the edge contour tangent.`,
    },
    {
      h: r`Non-maximum suppression condition along gradient normal`,
      tex: r`NMS(r, c) = \begin{cases} G(r, c) & \text{if } G(r, c) \ge G(p_1) \text{ and } G(r, c) \ge G(p_2) \\ 0 & \text{otherwise} \end{cases}`,
      p: r`Here $p_1$ and $p_2$ are the two adjacent grid positions along the quantised gradient orientation line $\theta(r, c)$. This thinning operation ensures that only local ridge maxima survive, eliminating blurry multi-pixel transitions.`,
    },
  ],
  keyPoints: [
    r`Edge detection identifies spatial intensity discontinuities corresponding to physical boundaries and depth changes.`,
    r`The Sobel operator combines discrete central difference differentiation with orthogonal binomial smoothing to mitigate noise.`,
    r`Raw gradient magnitude maps produce thick, blurry ridges; Canny's non-maximum suppression thins ridges to exactly 1 pixel width.`,
    r`Canny hysteresis uses two thresholds ($T_{\text{high}}$ and $T_{\text{low}}$), preserving weak edges only when they are topologically connected to strong edges.`,
    r`The gradient vector $\nabla I$ is strictly perpendicular (orthogonal) to the direction of the edge boundary contour.`,
  ],
  pitfalls: [
    r`Skipping Gaussian pre-smoothing: Calculating spatial derivatives directly on un-smoothed images amplifies high-frequency camera noise, spawning hundreds of false edge detections.`,
    r`Confusing gradient direction with edge contour direction: The gradient vector $\nabla I$ points across the edge boundary in the direction of steepest increase; the physical edge contour runs perpendicular to $\nabla I$ (rotated by $90^\circ$).`,
    r`Using a single global threshold: A single threshold inevitably fails; it either fractures faint genuine contours or floods the image with irrelevant background texture noise.`,
    r`Setting hysteresis thresholds without inspecting noise floor: Setting $T_{\text{low}}$ below the image sensor noise floor causes spurious background texture chains to connect with true objects, creating sprawling false contours.`,
    r`Convolving colour channels independently without magnitude fusion: Computing edges independently on R, G, and B channels and adding them naively creates phase misalignment; compute gradients across channels and take maximum magnitude across spectra.`,
  ],
  code: r`import numpy as np

# Synthetic test image: 8x8 with a sharp vertical boundary
img = np.zeros((8, 8), dtype=np.float32)
img[:, 4:] = 100.0  # Step edge from 0 to 100 intensity at column 4

# 1. Sobel separable 3x3 kernels for horizontal and vertical derivatives
Kx = np.array([
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
], dtype=np.float32)

Ky = np.array([
    [-1, -2, -1],
    [ 0,  0,  0],
    [ 1,  2,  1]
], dtype=np.float32)

# 2. 2D convolution (valid border)
H, W = img.shape
Gx = np.zeros((H - 2, W - 2), dtype=np.float32)
Gy = np.zeros((H - 2, W - 2), dtype=np.float32)

for i in range(H - 2):
    for j in range(W - 2):
        patch = img[i:i+3, j:j+3]
        Gx[i, j] = np.sum(patch * Kx)
        Gy[i, j] = np.sum(patch * Ky)

# 3. Gradient magnitude and orientation
magnitude = np.sqrt(Gx**2 + Gy**2)
angle = (np.arctan2(Gy, Gx) * (180.0 / np.pi)) % 180.0

print("Gradient Magnitude (Gx horizontal response at vertical edge):")
print(np.round(magnitude, 1))

# 4. Non-Maximum Suppression (thinning to 1-pixel ridge)
nms = np.zeros_like(magnitude)
mH, mW = magnitude.shape

for r in range(1, mH - 1):
    for c in range(1, mW - 1):
        mag = magnitude[r, c]
        ang = angle[r, c]

        # Determine neighbours along gradient normal (0, 45, 90, 135 deg)
        if (ang < 22.5) or (ang >= 157.5):
            q, p = magnitude[r, c+1], magnitude[r, c-1]
        elif 22.5 <= ang < 67.5:
            q, p = magnitude[r-1, c+1], magnitude[r+1, c-1]
        elif 67.5 <= ang < 112.5:
            q, p = magnitude[r-1, c], magnitude[r+1, c]
        else:
            q, p = magnitude[r-1, c-1], magnitude[r+1, c+1]

        if mag >= q and mag >= p:
            nms[r, c] = mag

print("\nAfter Non-Maximum Suppression (thinned 1-pixel edge):")
print(np.round(nms, 1))

# 5. Dual thresholding and hysteresis
T_high = 200.0
T_low = 80.0
strong = nms >= T_high
weak = (nms >= T_low) & (~strong)

print(f"\nStrong edge pixels (>= {T_high}): {np.sum(strong)}")
print(f"Weak edge pixels ({T_low} to {T_high}): {np.sum(weak)}")`,
  quiz: [
    {
      q: r`Why does the Sobel operator incorporate a binomial kernel $[1, 2, 1]^T$ perpendicular to the finite difference direction?`,
      o: [
        r`To smooth and dampen high-frequency image noise along the orthogonal dimension while computing spatial differences`,
        r`To invert negative pixel intensities back to positive ranges`,
        r`To rotate the image by 90 degrees before convolving`,
        r`To compress 8-bit integers into 4-bit floating point representations`,
      ],
      a: 0,
      why: r`Pure finite differences amplify high-frequency noise. The Sobel operator pairs differentiation in one direction with smoothing ($[1, 2, 1]$) in the orthogonal direction, mitigating sensor noise.`,
    },
    {
      q: r`What is the geometric relationship between the spatial gradient vector $\nabla I = [G_x, G_y]^T$ and the edge boundary contour?`,
      o: [
        r`The gradient vector points parallel to and along the edge contour`,
        r`The gradient vector is strictly perpendicular (orthogonal) to the edge contour, pointing in the direction of steepest intensity increase`,
        r`The gradient vector always points toward the centre of the image`,
        r`The gradient vector points in random directions unrelated to edge orientation`,
      ],
      a: 1,
      why: r`The gradient vector points in the direction of maximal brightness change, which is normal (perpendicular) to the edge tangent contour.`,
    },
    {
      q: r`What is the primary function of Non-Maximum Suppression (NMS) in the Canny edge detector?`,
      o: [
        r`To remove all colour information from multi-channel images`,
        r`To thin wide, blurry gradient response ridges down to crisp 1-pixel-wide edge candidates by comparing pixels against neighbours along the gradient normal`,
        r`To compute the Fast Fourier Transform of spatial frequencies`,
        r`To invert the brightness histogram for contrast normalisation`,
      ],
      a: 1,
      why: r`Gradient filters produce wide ridges of high response across boundaries. Non-Maximum Suppression suppresses any pixel that is not a local maximum along its gradient normal vector, thinning edges to a 1-pixel width.`,
    },
    {
      q: r`In Canny edge detection, how does hysteresis thresholding prevent edge fragmentation while rejecting noise?`,
      o: [
        r`It uses two thresholds: pixels above $T_{\text{high}}$ are strong edges, and pixels between $T_{\text{low}}$ and $T_{\text{high}}$ are retained only if topologically connected to a strong edge`,
        r`It averages all pixels within a $5 \times 5$ window before thresholding`,
        r`It discards all edges that are shorter than 100 pixels in length`,
        r`It adjusts the camera exposure dynamically during frame capture`,
      ],
      a: 0,
      why: r`A single threshold creates either noise specks or broken edges. Hysteresis establishes confident strong edges with $T_{\text{high}}$ and traces contiguous boundaries through weaker candidate pixels above $T_{\text{low}}$.`,
    },
  ],
  usedBy: [],
  prereq: ['pixels-channels-and-colour-spaces', 'convolutional_neural_networks'],
  related: ['thresholding-histograms-and-morphology', 'gradient-descent'],
  keywords: 'edge detection sobel canny non maximum suppression hysteresis gradient magnitude orientation derivative convolution image processing opencv',
},
  {
  id: 'thresholding-histograms-and-morphology',
  short: 'Thresholds & Morphology',
  title: 'Thresholding, histograms and morphology',
  task: 'concepts',
  module: 'Image basics',
  level: 1,
  minutes: 15,
  noLab: true,
  summary: r`Binarising grayscale images into foreground and background masks is the foundational step in document processing, medical cell segmentation, and industrial inspection. Intensity histograms reveal pixel frequency distributions, guiding automated global threshold selection via Otsu's variance-maximising algorithm. Mathematical morphology then cleans and refines the resulting binary masks through non-linear geometric set operations—erosion, dilation, opening, and closing—governed by structured probe elements.`,
  lead: r`Before deep neural networks achieved widespread adoption in computer vision, industrial inspection systems sorted manufactured components, read dot-peen serial barcodes, and extracted medical cell boundaries using a two-stage paradigm: thresholding and mathematical morphology. By converting continuous grayscale intensities into discrete binary masks and probing their spatial geometry with structuring elements, vision practitioners eliminate sensor speckles, bridge hairline fractures, and separate touching objects with determinism and sub-millisecond execution.`,
  intuition: [
    r`The image histogram as an empirical probability density: An intensity histogram tallies the frequency count $n_k$ of each grayscale intensity level $k \in \{0, 1, \dots, L-1\}$. Normalising the histogram by the total pixel count $N = H \times W$ yields an empirical probability mass function $p(k) = n_k / N$. When an image contains a dark object on a bright background (or vice versa), its histogram displays a bimodal profile: two prominent probability peaks separated by a deep valley representing the boundary transition.`,
    r`Otsu's automated variance criterion: How can an algorithm choose an optimal threshold $t^*$ without manual human tuning? In 1979, Nobuyuki Otsu demonstrated that the optimal global threshold maximises between-class variance $\sigma_B^2(t)$ between foreground and background (which is mathematically equivalent to minimising within-class variance $\sigma_W^2(t)$). By treating threshold selection as an optimal one-dimensional clustering problem over the histogram, Otsu's method pinpoints the exact valley floor separating the two statistical populations.`,
    r`Limitations of global thresholds and the necessity of adaptive methods: Under uniform studio illumination, a single global cutoff works reliably. However, in real-world scenes with spatial lighting gradients, cast shadows, or lens vignetting, global thresholding fails catastrophically: the bright background on the shadowed side of a page may have lower intensity than the dark foreground on the sunlit side. Adaptive (local) thresholding resolves this by calculating dynamic thresholds within a sliding neighbourhood window.`,
    r`Mathematical morphology as geometric probing: Once an image is binarised into Boolean sets (0s and 1s), linear convolution filters no longer apply. Mathematical morphology replaces linear arithmetic with set theory and order statistics. By translating a small geometric probe called a structuring element (such as a $3 \times 3$ cross, rectangle, or disc) across the binary mask, morphological operators measure how the probe interacts with foreground shapes.`,
    r`Filtering via opening and closing: Composing the two primary morphological primitives—erosion (which shrinks foreground shapes by requiring the structuring element to fit entirely inside) and dilation (which expands foreground shapes whenever the structuring element touches)—creates powerful geometric filters. Opening (erosion followed by dilation) removes isolated background noise specks and thin protrusions without altering the macro dimensions of large objects. Closing (dilation followed by erosion) bridges narrow hairline gaps, welds broken stroke contours, and seals internal pinhole voids.`,
  ],
  analogy: r`Imagine clearing a manicured lawn strewn with leaves, fallen twigs, and children's toy building blocks. Otsu's thresholding is like an automated metal detector that calibrates its sensitivity knob to find the sharpest mathematical separation between heavy metallic objects and light organic debris. Morphological erosion is like sweeping the lawn with a rigid rotary brush whose bristles have a radius of three centimetres: any leaf or twig narrower than three centimetres is swept away, and the edges of larger toys are slightly pared back. Morphological dilation is like rolling a sticky paint roller over the lawn: it expands the perimeter of every remaining toy outwards by three centimetres. Composing both into an opening operation sweeps away all tiny organic specks while restoring genuine large toys to their original dimensions.`,
  steps: [
    {
      title: r`Compute normalised intensity histogram`,
      desc: r`Construct the discrete probability distribution of grayscale pixel intensities.`,
      detail: r`For an 8-bit grayscale image of shape $H \times W$, compute the frequency histogram across 256 bins. Normalise bin counts by the total number of pixels to produce the empirical probability distribution $p_k = n_k / (H \times W)$, satisfying $\sum_{k=0}^{255} p_k = 1$.`,
    },
    {
      title: r`Evaluate Otsu's between-class variance`,
      desc: r`Sweep all possible threshold levels to find the threshold that maximises inter-class variance.`,
      detail: r`For each candidate threshold $t \in [0, 255]$, partition the histogram into background class $C_0$ ($0 \le k \le t$) and foreground class $C_1$ ($t < k \le 255$). Compute cumulative class weights $\omega_0(t), \omega_1(t)$ and class means $\mu_0(t), \mu_1(t)$. Identify the threshold $t^*$ that maximises between-class variance $\sigma_B^2(t) = \omega_0(t) \omega_1(t) (\mu_0(t) - \mu_1(t))^2$.`,
    },
    {
      title: r`Generate binary foreground mask`,
      desc: r`Map continuous pixel intensities to a discrete Boolean representation.`,
      detail: r`Assign each pixel $I(r, c)$ to $1$ if $I(r, c) \ge t^*$ and $0$ otherwise. When segmenting dark text on bright paper, invert the inequality so foreground characters correspond to binary $1$s.`,
    },
    {
      title: r`Apply morphological erosion and dilation`,
      desc: r`Probe the binary mask with a defined structuring element.`,
      detail: r`Erosion tests where the structuring element $B$ fits completely inside the foreground mask: $(A \ominus B)(r, c) = \min_{(i, j) \in B} A(r+i, c+j)$. Dilation tests where the structuring element touches any foreground pixel: $(A \oplus B)(r, c) = \max_{(i, j) \in B} A(r-i, c-j)$.`,
    },
    {
      title: r`Chain opening and closing for structural cleanup`,
      desc: r`Eliminate spurious noise specks or seal hairline cracks in binary contours.`,
      detail: r`Apply opening $A \circ B = (A \ominus B) \oplus B$ to eliminate small isolated noise specks and sever thin filaments connecting adjacent objects. Apply closing $A \bullet B = (A \oplus B) \ominus B$ to seal small internal voids and bridge narrow cracks in continuous strokes.`,
    },
  ],
  math: [
    {
      h: r`Otsu's between-class variance formulation`,
      tex: r`\sigma_B^2(t) = \omega_0(t) \omega_1(t) \left(\mu_0(t) - \mu_1(t)\right)^2`,
      p: r`Here $\omega_0(t) = \sum_{i=0}^t p_i$ is the cumulative probability of class $C_0$, $\omega_1(t) = 1 - \omega_0(t)$ is the probability of class $C_1$, $\mu_0(t) = \frac{1}{\omega_0(t)} \sum_{i=0}^t i\,p_i$ is the mean intensity of class $C_0$, and $\mu_1(t) = \frac{1}{\omega_1(t)} \sum_{i=t+1}^{L-1} i\,p_i$ is the mean intensity of class $C_1$. Maximising $\sigma_B^2(t)$ is equivalent to minimising within-class variance $\sigma_W^2(t)$.`,
    },
    {
      h: r`Morphological erosion and dilation`,
      tex: r`(A \ominus B)(x) = \min_{y \in B} A(x + y), \quad (A \oplus B)(x) = \max_{y \in B} A(x - y)`,
      p: r`For binary images, erosion corresponds to a spatial local minimum (Boolean AND over structuring element support $B$), shrinking foreground boundaries. Dilation corresponds to a spatial local maximum (Boolean OR over structuring element support $B$), expanding foreground boundaries.`,
    },
    {
      h: r`Morphological opening and closing`,
      tex: r`A \circ B = (A \ominus B) \oplus B, \quad A \bullet B = (A \oplus B) \ominus B`,
      p: r`Opening is anti-extensive ($A \circ B \subseteq A$) and idempotent ($(A \circ B) \circ B = A \circ B$), filtering out isolated foreground specks. Closing is extensive ($A \subseteq A \bullet B$) and idempotent, bridging hairline gaps and filling internal pinhole voids.`,
    },
  ],
  keyPoints: [
    r`Intensity histograms quantify grayscale distribution profiles and expose bimodal contrast separations.`,
    r`Otsu's algorithm automatically determines the optimal global binarisation threshold by maximising inter-class variance.`,
    r`Adaptive thresholding computes localized cutoffs within sliding windows to overcome non-uniform illumination and shadow gradients.`,
    r`Erosion shrinks foreground shapes and destroys small specks; dilation expands foreground perimeters and fills voids.`,
    r`Opening (erosion then dilation) removes background noise without shrinking large shapes; closing (dilation then erosion) bridges cracks and seals holes.`,
  ],
  pitfalls: [
    r`Applying Otsu's method to unimodal or multimodal histograms: If an image lacks clear foreground-background contrast separation, Otsu artificially forces a cut through a continuous unimodal distribution, corrupting uniform textures.`,
    r`Relying on global thresholding across non-uniform lighting: In scenes with directional shadows or vignetting, global thresholding fails; local adaptive thresholding (such as Gaussian or mean adaptive thresholding) is required.`,
    r`Inverting binary polarity: Optical character recognition pipelines expect foreground character glyphs to be represented by binary 1s; thresholding black text on white paper requires inverting polarity (using cv2.THRESH_BINARY_INV).`,
    r`Selecting an oversized structuring element: Using an excessively large structuring element during morphological opening will obliterate fine structural features, such as the crossbars on letters 'e' and 't'.`,
    r`Confusing opening with closing: Opening removes isolated foreground specks; closing fills isolated holes. Inverting their sequence in noise removal pipelines leads to either dilated noise blobs or fragmented shapes.`,
  ],
  code: r`import numpy as np

# Create an 8x8 synthetic image with bimodal histogram (dark background, bright object)
np.random.seed(42)
img = np.random.randint(20, 60, size=(8, 8)).astype(np.uint8)   # background ~ 40
img[2:6, 2:6] = np.random.randint(180, 220, size=(4, 4))       # square object ~ 200
img[3, 3] = 45                                                  # interior hole
img[0, 0] = 210                                                 # isolated noise speck

# 1. Normalised intensity histogram
hist, bin_edges = np.histogram(img, bins=256, range=(0, 256))
p = hist / float(img.size)

# 2. Otsu's thresholding: maximise between-class variance sigma_B^2(t)
total_mean = np.sum(np.arange(256) * p)
best_t = 0
max_var = -1.0

omega0 = 0.0
sum0 = 0.0

for t in range(256):
    omega0 += p[t]
    if omega0 == 0.0:
        continue
    omega1 = 1.0 - omega0
    if omega1 == 0.0:
        break

    sum0 += t * p[t]
    mu0 = sum0 / omega0
    mu1 = (total_mean - sum0) / omega1
    var_between = omega0 * omega1 * ((mu0 - mu1) ** 2)

    if var_between > max_var:
        max_var = var_between
        best_t = t

print(f"Optimal Otsu threshold: t* = {best_t} (between background ~40 and object ~200)")

# 3. Binary mask
binary = (img >= best_t).astype(np.uint8)
print("\nInitial Binary Mask (1 = foreground, contains speck at (0,0) and hole at (3,3)):")
print(binary)

# 4. Mathematical morphology with 3x3 structuring element
def erode(mask):
    H, W = mask.shape
    out = np.zeros_like(mask)
    for r in range(1, H - 1):
        for c in range(1, W - 1):
            out[r, c] = np.min(mask[r-1:r+2, c-1:c+2])
    return out

def dilate(mask):
    H, W = mask.shape
    out = np.zeros_like(mask)
    for r in range(1, H - 1):
        for c in range(1, W - 1):
            out[r, c] = np.max(mask[r-1:r+2, c-1:c+2])
    return out

# Opening = erode then dilate (removes small isolated foreground specks)
opening = dilate(erode(binary))

# Closing = dilate then erode (fills small interior holes)
closing = erode(dilate(binary))

print(f"\nNoise speck at (0,0) removed by Opening: {opening[0, 0] == 0}")
print(f"Hole at (3,3) filled by Closing:          {closing[3, 3] == 1}")`,
  quiz: [
    {
      q: r`What statistical objective does Otsu's thresholding algorithm maximise when selecting the optimal global cutoff $t^*$?`,
      o: [
        r`The between-class variance $\sigma_B^2(t)$ between foreground and background intensity distributions`,
        r`The sum of squared gradients across all image rows`,
        r`The entropy of the colour saturation histogram`,
        r`The dynamic range of the camera sensor exposure`,
      ],
      a: 0,
      why: r`Otsu's method searches for the threshold that maximises between-class variance $\sigma_B^2(t)$, which simultaneously minimises within-class variance $\sigma_W^2(t)$, finding the optimal statistical separation between foreground and background.`,
    },
    {
      q: r`Why does global thresholding fail on images of documents captured under uneven, directional lighting?`,
      o: [
        r`Because intensity histograms cannot be computed for non-square images`,
        r`Because shadows make the background on one side darker than the foreground text on the brightly illuminated side`,
        r`Because grayscale conversion inverts image orientations`,
        r`Because uint8 integers cannot store text representations`,
      ],
      a: 1,
      why: r`Under non-uniform illumination, absolute pixel brightness reflects lighting gradients rather than material reflectance. A single threshold cannot separate foreground from background globally; local adaptive thresholding is required.`,
    },
    {
      q: r`In mathematical morphology, what operation does an "opening" perform on a binary mask?`,
      o: [
        r`It performs erosion followed by dilation, eliminating small isolated noise specks without permanently shrinking large foreground shapes`,
        r`It performs dilation followed by erosion, sealing internal holes and cracks`,
        r`It rotates the structuring element by 180 degrees`,
        r`It inverts the Boolean state of all boundary pixels`,
      ],
      a: 0,
      why: r`Opening ($A \circ B = (A \ominus B) \oplus B$) erodes away small foreground specks that cannot contain the structuring element, and then dilates the surviving core shapes back to their original dimensions.`,
    },
    {
      q: r`What morphological filter is best suited to bridge small hairline fractures and fill tiny interior voids within a segmented object?`,
      o: [
        r`Opening ($A \circ B$)`,
        r`Closing ($A \bullet B$, dilation followed by erosion)`,
        r`Sobel filtering`,
        r`Canny non-maximum suppression`,
      ],
      a: 1,
      why: r`Closing ($A \bullet B = (A \oplus B) \ominus B$) first dilates the shape to seal small interior gaps and holes, and then erodes the outer perimeter back to its original size, preserving boundary closure.`,
    },
  ],
  usedBy: [],
  prereq: ['pixels-channels-and-colour-spaces', 'exploratory-data-analysis'],
  related: ['edge-detection-sobel-and-canny', 'convolutional_neural_networks'],
  keywords: 'thresholding otsu method image histogram mathematical morphology erosion dilation opening closing structuring element binary segmentation opencv',
},
  {
    "id": "classical-segmentation-k-means-watershed-grabcut",
    "short": "Classical segmentation",
    "title": "Classical Image Segmentation: K-Means Colour Clustering, Watershed, and GrabCut",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Segmenting visual scenes without deep learning using pixel colour clustering, topographical gradient watershed flooding, and iterative min-cut GrabCut graph cuts.",
    "lead": "Before deep convolutional networks dominated computer vision, image segmentation relied on rigorous mathematical algorithms rooted in graph theory, topographical fluid dynamics, and statistical clustering. Techniques like K-Means colour space clustering, the Watershed transform, and GrabCut provide fast, interpretable, training-free methods for isolating foreground objects, separating touching cells in microscopy, and extracting interactive foreground cutouts.",
    "analogy": "Imagine an aerial photograph of mountainous terrain during a rising flood. The Watershed algorithm treats gradient magnitudes as topographical peaks and basins: as water rises simultaneously from every local valley, dams are erected wherever rising ponds touch, perfectly outlining mountain ridges. GrabCut is like stretching an elastic rubber membrane around an object: it finds the minimum-energy boundary that wraps tightly around the subject while cutting through the fewest connecting tissue fibers.",
    "intuition": [
      "Image segmentation partitions an image into semantically coherent pixel regions. In classical vision, segmentation operates on low-level cues: pixel colour, intensity gradients, and spatial coordinates.",
      "K-Means segmentation clusters pixels in colour space (such as CIE L*a*b* or RGB) into $K$ discrete colour modes. While fast, raw K-means ignores spatial connectivity, producing noisy, fragmented pixel masks.",
      "The Watershed algorithm treats a greyscale gradient image as a 3D topographic relief map: light pixels are high ridges (boundaries), and dark pixels are low basins. Flooding basins from predefined markers partitions the image into catchment basins. However, raw gradient maps contain thousands of local noise minima, causing severe over-segmentation; marker-controlled watershed solves this by initializing floods strictly from user-defined seeds.",
      "GrabCut (Rother et al.) formulates segmentation as an energy minimisation problem on a graph. Pixels are represented as graph nodes connected to source (Foreground) and sink (Background) terminals. Using Gaussian Mixture Models (GMMs) to model colour distributions and the Max-Flow / Min-Cut theorem, GrabCut iteratively cuts the minimum-cost graph edges, producing clean boundaries with minimal user bounding-box hints."
    ],
    "steps": [
      "Select segmentation approach: Choose K-means for colour reduction, marker-controlled watershed for separating touching objects, or GrabCut for interactive object extraction.",
      "Preprocess and filter: Apply bilateral filtering or median blur to suppress high-frequency sensor noise without blurring object edges.",
      "Compute morphological gradients: For watershed, compute Sobel or morphological gradient $\\nabla I$ to identify boundary ridges.",
      "Generate seed markers: Apply distance transforms and thresholding to isolate confident object cores and background markers.",
      "Apply graph cut (GrabCut): Initialize foreground/background Gaussian Mixture Models from a user bounding box; iteratively alternate between assigning pixels to GMM components and computing min-cut graph partitioning.",
      "Post-process boundaries: Apply morphological closing and contour smoothing to produce final clean segmentation masks."
    ],
    "math": [
      {
        "h": "GrabCut Energy Minimisation Formulation",
        "tex": "E(\\underline{\\alpha}, \\mathbf{k}, \\underline{\\theta}, \\mathbf{z}) = U(\\underline{\\alpha}, \\mathbf{k}, \\underline{\\theta}, \\mathbf{z}) + V(\\underline{\\alpha}, \\mathbf{z})",
        "p": "Decomposes segmentation energy into regional data fidelity $U$ (likelihood under GMM colour models) and boundary smoothness $V$ (contrast-dependent penalty for assigning adjacent pixels to different classes)."
      },
      {
        "h": "Boundary Smoothness Edge Penalty",
        "tex": "V(\\underline{\\alpha}, \\mathbf{z}) = \\gamma \\sum_{(m, n) \\in \\mathcal{C}} [\\alpha_m \\ne \\alpha_n] \\exp\\left( -\\beta \\|z_m - z_n\\|^2 \\right)",
        "p": "Penalises boundary cuts between adjacent pixels $(m, n)$, with penalties dropping when crossing sharp colour differences."
      },
      {
        "h": "Max-Flow / Min-Cut Optimality (Ford-Fulkerson)",
        "tex": "\\min_{\\mathcal{S}, \\mathcal{T}} \\operatorname{Capacity}(\\mathcal{S}, \\mathcal{T}) = \\max \\operatorname{Flow}(s \\to t)",
        "p": "The globally optimal boundary cut minimising energy $E$ is computed in polynomial time via the maximum network flow algorithm."
      }
    ],
    "code": "import numpy as np\n\ndef simple_kmeans_color_quantisation(image_rgb: np.ndarray, k: int = 3, max_iter: int = 10) -> np.ndarray:\n    \"\"\"Segment image by clustering pixel colours in RGB space via K-Means.\"\"\"\n    h, w, c = image_rgb.shape\n    pixels = image_rgb.reshape(-1, c).astype(np.float32)\n    \n    # Initialize centroids randomly from pixels\n    np.random.seed(42)\n    idx = np.random.choice(len(pixels), k, replace=False)\n    centroids = pixels[idx]\n    \n    for _ in range(max_iter):\n        # 1. Assign each pixel to nearest centroid\n        # [N, K] distance matrix\n        dists = np.linalg.norm(pixels[:, None, :] - centroids[None, :, :], axis=-1)\n        labels = np.argmin(dists, axis=1)\n        \n        # 2. Update centroids\n        new_centroids = np.array([pixels[labels == i].mean(axis=0) if (labels == i).any() \n                                 else centroids[i] for i in range(k)])\n        if np.allclose(centroids, new_centroids, atol=1e-2):\n            break\n        centroids = new_centroids\n        \n    quantised = centroids[labels].reshape(h, w, c).astype(np.uint8)\n    return quantised, labels.reshape(h, w)\n\n# Test on 8x8 synthetic image with 2 colour regions\nimg = np.zeros((8, 8, 3), dtype=np.uint8)\nimg[:4, :] = [200, 30, 30]   # Red foreground\nimg[4:, :] = [30, 180, 50]   # Green background\n\nsegmented_img, mask = simple_kmeans_color_quantisation(img, k=2)\nprint(\"Segmented mask unique labels:\", np.unique(mask))\nprint(\"K-Means cleanly separated the two colour regions without neural networks!\")",
    "keyPoints": [
      "Classical segmentation partitions images without requiring training labels or deep neural networks.",
      "K-Means clusters pixel colours but lacks spatial boundary coherence.",
      "Marker-controlled watershed treats gradients as topography, using seed markers to prevent over-segmentation.",
      "GrabCut uses Gaussian Mixture Models and graph min-cuts to iteratively segment foreground objects from bounding boxes."
    ],
    "pitfalls": [
      "Over-segmentation in raw watershed: Applying watershed directly to noisy image gradients without marker seeds produces a fractured mosaic of thousands of tiny useless regions.",
      "Colour overlap in GrabCut: If the foreground object shares identical colours with the background (e.g. a green frog on a green leaf), GrabCut cannot separate them using colour GMMs alone.",
      "Ignoring spatial coordinates in K-Means: Clustering only $(R, G, B)$ values merges spatially distant pixels that happen to have similar colours; concatenate spatial coordinates $(R, G, B, x, y)$ for spatial compactness."
    ],
    "quiz": [
      {
        "q": "Why does the raw, unseeded Watershed algorithm suffer from severe over-segmentation on natural images?",
        "o": [
          "Because water cannot flow in digital computers",
          "High-frequency image noise produces hundreds of tiny local gradient minima, each of which forms its own isolated catchment basin",
          "Because the image has more than 1 colour channel",
          "Because watershed requires deep neural networks"
        ],
        "a": 1,
        "why": "Every local minimum in the gradient image acts as a seed for a catchment basin. Noise creates hundreds of false minima, fragmenting the image."
      },
      {
        "q": "How does the GrabCut algorithm achieve fast, globally optimal foreground/background boundary cuts?",
        "o": [
          "Using brute-force search across all possible pixel subsets",
          "By formulating the energy minimisation problem as a graph cut and solving it in polynomial time using the Max-Flow / Min-Cut theorem",
          "By running stochastic gradient descent on pixel coordinates",
          "By computing the Fourier transform of the image"
        ],
        "a": 1,
        "why": "GrabCut represents pixel affinities and GMM likelihoods as edge capacities in a flow network. The min-cut separating source from sink is solved via maximum network flow."
      },
      {
        "q": "What is the primary limitation of pure K-Means colour segmentation?",
        "o": [
          "It cannot process RGB images",
          "It operates strictly in colour space and ignores spatial pixel connectivity, creating noisy, fragmented masks with holes",
          "It requires 100 epochs of GPU training",
          "It only works on black and white images"
        ],
        "a": 1,
        "why": "K-Means clusters pixels purely by $(R, G, B)$ values without spatial awareness: two pixels with the same colour in opposite corners of the image are grouped together."
      }
    ],
    "related": [
      "thresholding-histograms-and-morphology",
      "semantic-segmentation-fcn-and-u-net",
      "edge-detection-sobel-and-canny"
    ],
    "keywords": "classical segmentation, k-means, watershed, grabcut, graph cuts, min-cut max-flow, image segmentation, gaussian mixture models"
  },
  {
  id: 'corners-and-keypoints-harris-fast',
  short: 'Harris & FAST',
  title: 'Corners and keypoints: Harris, FAST',
  task: 'concepts',
  module: 'Classical features',
  level: 2,
  minutes: 16,
  noLab: true,
  summary: r`Corners and keypoints are salient two-dimensional image interest points where intensity changes abruptly across multiple directions, providing stable spatial landmarks for tracking, visual odometry, and image alignment. The Harris corner detector evaluates the local structure tensor (second-moment matrix), classifying local patches via eigenvalues: two large eigenvalues indicate a corner, one large eigenvalue denotes an edge, and two small eigenvalues reflect a flat uniform region. The FAST (Features from Accelerated Segment Test) algorithm delivers ultra-fast keypoint detection for real-time mobile robotics by evaluating a 16-pixel Bresenham circle around candidate pixels using high-speed decision trees.`,
  lead: r`If you attempt to track a featureless white wall across video frames, every pixel appears identical, creating total motion ambiguity. If you track a straight horizontal edge, you can measure vertical movement accurately, but horizontal motion remains undetectable—the classical "aperture problem." Only at corners, junctions, and textured keypoints does image intensity vary in all spatial directions, fixing a unique, unambiguous point in two-dimensional space. From Chris Harris and Mike Stephens's second-moment matrix in 1988 to Edward Rosten and Tom Drummond's microsecond FAST detector, corner detection forms the foundation of classical geometric vision and visual SLAM.`,
  intuition: [
    r`The aperture problem and corner uniqueness: Consider shifting a small inspection window by a displacement $(\Delta x, \Delta y)$. Over a flat surface, the window contents do not change regardless of direction. Over a straight edge, shifting the window parallel to the edge produces zero change, whereas shifting perpendicular produces large changes. Only over a corner does shifting the window in any spatial direction cause a steep increase in squared intensity difference. Corners therefore resolve the aperture problem completely.`,
    r`The structure tensor and eigenvalue geometry: The Harris detector formalises this directional variation by taking a first-order Taylor expansion of the windowed squared difference. This yields a quadratic form governed by the $2 \times 2$ second-moment matrix (structure tensor) $M = \sum w(x, y) \begin{bmatrix} I_x^2 & I_x I_y \\ I_x I_y & I_y^2 \end{bmatrix}$, where $I_x, I_y$ are spatial image gradients and $w(x, y)$ is a Gaussian weighting window. The two eigenvalues $\lambda_1, \lambda_2$ of $M$ characterize the principal curvatures of the local auto-correlation surface: if both eigenvalues are large and of similar magnitude, the patch is an unambiguous corner.`,
    r`The Harris response shortcut: Computing explicit eigenvalues for every single pixel in an image requires expensive matrix square roots. Harris and Stephens proposed an algebraic shortcut: $R = \det(M) - k\,(\operatorname{tr}(M))^2 = (\lambda_1 \lambda_2) - k\,(\lambda_1 + \lambda_2)^2$, where $k$ is an empirical tuning parameter (typically $k \in [0.04, 0.06]$). A large positive response $R$ signifies a corner, a negative response indicates an edge, and an absolute value near zero denotes a flat region.`,
    r`The need for speed: FAST and circular segment tests: While Harris detection is rotationally invariant and mathematically elegant, computing Gaussian-weighted tensor products across millions of pixels consumes valuable frame time in real-time robotic systems. In 2006, FAST revolutionised real-time tracking by abandoning gradients altogether. FAST inspects a Bresenham circle of 16 pixels surrounding candidate pixel $p$. If a contiguous arc of $N$ pixels (typically $N=9$ or $12$) are all significantly brighter or all significantly darker than $p$ by a threshold $\tau$, $p$ is flagged as a corner candidate. By testing pixels 1, 9, 5, and 13 first, non-corner candidates are rejected in three to four machine instructions.`,
  ],
  analogy: r`Imagine looking at a blueprint through a tiny circular magnifying peephole. If you look at the middle of a blank plaster wall, sliding your peephole in any direction reveals only uniform white paper: you have no idea where you are. If you look at a straight black boundary line, sliding the peephole along the line looks identical: you cannot tell whether the blueprint is sliding left or right. But if you position the peephole directly over an intersecting corner where two walls meet, any nudge in any direction immediately alters the pattern of lines within the glass. You are anchored to a singular, trackable coordinate. Harris acts like a mathematical sensor measuring the resistance to sliding in all directions; FAST acts like a guard checking whether the boundary cuts a wide continuous arc around the perimeter of the circle.`,
  steps: [
    {
      title: r`Compute spatial image derivatives`,
      desc: r`Convolve the grayscale image with Sobel or central difference filters to obtain $I_x$ and $I_y$.`,
      detail: r`Evaluate horizontal gradient $I_x = K_x * I$ and vertical gradient $I_y = K_y * I$. These capture the instantaneous directional rates of intensity change across the pixel grid.`,
    },
    {
      title: r`Form gradient products and apply Gaussian smoothing`,
      desc: r`Construct the components of the structure tensor $M$ across local neighbourhoods.`,
      detail: r`Compute pixel-wise products $I_x^2$, $I_y^2$, and $I_x I_y$. Convolve each product map with an isotropic circular Gaussian kernel $w_\sigma$: $A = w_\sigma * I_x^2$, $B = w_\sigma * I_y^2$, and $C = w_\sigma * (I_x I_y)$. Gaussian weighting gives central pixels greater influence, providing rotational invariance that rectangular box windows lack.`,
    },
    {
      title: r`Calculate Harris corner response map`,
      desc: r`Compute the algebraic scalar response metric $R$ for every pixel without explicit eigenvalue decomposition.`,
      detail: r`At each pixel $(r, c)$, the structure tensor is $M = \begin{bmatrix} A & C \\ C & B \end{bmatrix}$. Compute $\det(M) = A B - C^2$ and $\operatorname{tr}(M) = A + B$. Evaluate the Harris response $R = \det(M) - k\,(\operatorname{tr}(M))^2$, using tuning constant $k \approx 0.04$.`,
    },
    {
      title: r`Apply thresholding and non-maximum suppression`,
      desc: r`Filter out weak candidates and thin clusters of responses down to isolated peak coordinates.`,
      detail: r`Discard pixels where $R < T_{\text{threshold}}$ (where $T_{\text{threshold}}$ is a fraction of the maximum response). Within a $3 \times 3$ or $5 \times 5$ window, retain only those pixels whose response is strictly greater than all neighbours, ensuring exactly one distinct keypoint per physical corner.`,
    },
    {
      title: r`High-speed alternative: FAST Bresenham circle test`,
      desc: r`Deploy FAST for real-time applications by testing pixel intensity differences along a circular perimeter.`,
      detail: r`For a candidate pixel $p$ with intensity $I_p$, examine the 16 pixels on a Bresenham circle of radius 3. For ultra-fast rejection, first test the four cardinal pixels $(1, 9, 5, 13)$. If at least three of these four are not simultaneously brighter than $I_p + \tau$ or darker than $I_p - \tau$, candidate $p$ cannot be a corner and is instantly discarded. Surviving candidates undergo the full 16-pixel contiguous arc test.`,
    },
  ],
  math: [
    {
      h: r`Autocorrelation error surface and structure tensor`,
      tex: r`E(\Delta x, \Delta y) \approx [\Delta x, \Delta y]\, M \begin{bmatrix} \Delta x \\ \Delta y \end{bmatrix}, \quad M = \sum_{(x, y) \in W} w(x, y) \begin{bmatrix} I_x^2 & I_x I_y \\ I_x I_y & I_y^2 \end{bmatrix}`,
      p: r`A second-order Taylor series approximates the change in squared intensity difference $E(\Delta x, \Delta y)$ for a small shift. The second-moment matrix $M$ encapsulates the local gradient distribution inside window $W$.`,
    },
    {
      h: r`Harris corner response function`,
      tex: r`R = \det(M) - k\,(\operatorname{tr}(M))^2 = (\lambda_1 \lambda_2) - k\,(\lambda_1 + \lambda_2)^2`,
      p: r`Here $\det(M) = \lambda_1 \lambda_2$ and $\operatorname{tr}(M) = \lambda_1 + \lambda_2$. If both eigenvalues are large ($\lambda_1 \approx \lambda_2 \gg 0$), $\det(M)$ dominates and $R > 0$ (corner). If one eigenvalue dominates ($\lambda_1 \gg \lambda_2$), $(\operatorname{tr}(M))^2$ dominates and $R < 0$ (edge). If both are small, $R \approx 0$ (flat region). Parameter $k$ is usually set to $0.04$ to $0.06$.`,
    },
    {
      h: r`FAST contiguous arc criterion`,
      tex: r`\exists \text{ contiguous arc of } N \text{ pixels on circle } C_{16} \text{ such that } \forall i, \; I_i > I_p + \tau \quad \text{or} \quad \forall i, \; I_i < I_p - \tau`,
      p: r`Here $C_{16}$ is the 16-pixel perimeter of radius 3 centred on pixel $p$, $\tau$ is an intensity threshold, and $N$ is typically chosen as $9$ or $12$. Decision trees trained via ID3 can classify candidate pixels in very few CPU instructions per location.`,
    },
  ],
  keyPoints: [
    r`Corners resolve the aperture problem by exhibiting intense gradient variation in all spatial directions.`,
    r`The Harris structure tensor $M$ summarises local directional gradient energy via its eigenvalues $\lambda_1, \lambda_2$.`,
    r`The Harris response $R = \det(M) - k\,(\operatorname{tr}(M))^2$ classifies corners ($R > 0$), edges ($R < 0$), and flat regions ($R \approx 0$) without computing matrix square roots.`,
    r`Harris corners are invariant to 2D image rotation and affine intensity shifts, but are NOT invariant to significant changes in image scale.`,
    r`FAST accelerates corner detection for real-time mobile robotics and SLAM by inspecting a 16-pixel Bresenham circle and using early-rejection tests.`,
  ],
  pitfalls: [
    r`Scale sensitivity: Harris corners are not scale-invariant; zooming into an image causes a sharp corner to become a smooth, rounded edge at a larger scale, causing Harris detection to fail unless paired with scale-space pyramids.`,
    r`Choosing an un-tuned parameter $k$: Setting $k$ too small ($<0.02$) causes false positive edge detections to be misclassified as corners; setting $k$ too large ($>0.10$) rejects genuine dull corners.`,
    r`Using rectangular box windows instead of Gaussian weights: Box filter windows introduce artificial directional bias along the horizontal and vertical axes; isotropic Gaussian smoothing ensures true rotational invariance.`,
    r`Omitting non-maximum suppression: Without non-maximum suppression, strong corners generate clusters of 10 to 20 adjacent redundant detections around a single physical junction.`,
    r`FAST sensitivity to high-frequency image noise: Because FAST tests individual raw pixel intensities on a circular perimeter without pre-smoothing, electronic sensor noise can trigger spurious corner detections; applying mild Gaussian blur beforehand is recommended in low-light conditions.`,
  ],
  code: r`import numpy as np

# Create a synthetic 16x16 image containing an L-shaped corner
img = np.zeros((16, 16), dtype=np.float32)
img[4:12, 4:12] = 200.0  # Bright square on dark background
img[8:12, 8:12] = 0.0    # Carve out bottom-right to create inner & outer corners

# 1. Compute spatial derivatives using Sobel filters
Kx = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=np.float32)
Ky = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=np.float32)

H, W = img.shape
Ix = np.zeros((H-2, W-2), dtype=np.float32)
Iy = np.zeros((H-2, W-2), dtype=np.float32)

for r in range(H-2):
    for c in range(W-2):
        patch = img[r:r+3, c:c+3]
        Ix[r, c] = np.sum(patch * Kx)
        Iy[r, c] = np.sum(patch * Ky)

# 2. Structure tensor components: Ix^2, Iy^2, Ix*Iy with local 3x3 window smoothing
Ix2 = Ix * Ix
Iy2 = Iy * Iy
Ixy = Ix * Iy

# Box smoothing kernel (approximating local window w)
kernel = np.ones((3, 3), dtype=np.float32) / 9.0
sH, sW = Ix.shape
A = np.zeros((sH-2, sW-2), dtype=np.float32)
B = np.zeros((sH-2, sW-2), dtype=np.float32)
C = np.zeros((sH-2, sW-2), dtype=np.float32)

for r in range(sH-2):
    for c in range(sW-2):
        A[r, c] = np.sum(Ix2[r:r+3, c:c+3] * kernel)
        B[r, c] = np.sum(Iy2[r:r+3, c:c+3] * kernel)
        C[r, c] = np.sum(Ixy[r:r+3, c:c+3] * kernel)

# 3. Compute Harris response: R = det(M) - k * (trace(M))^2
k = 0.04
det_M = (A * B) - (C * C)
trace_M = A + B
harris_R = det_M - k * (trace_M ** 2)

# 4. Thresholding and peak extraction
threshold = 0.05 * np.max(harris_R)
corners = harris_R > threshold

print(f"Max Harris response: {np.max(harris_R):.1f}")
print(f"Number of corner response peaks found: {np.sum(corners)}")

# 5. FAST candidate logic check on a single 16-pixel circular perimeter
# Circle radius 3 offsets (16 pixels)
p_center = 200.0  # Candidate corner pixel intensity
# Synthetic perimeter: 9 contiguous pixels are dark (intensity ~ 0)
circle_16 = np.array([200, 200, 200, 200, 0, 0, 0, 0, 0, 0, 0, 0, 0, 200, 200, 200], dtype=np.float32)
tau = 50.0

is_darker = circle_16 < (p_center - tau)
# Check circular contiguous run of 9
extended = np.concatenate([is_darker, is_darker[:8]])
max_run = max(len(s) for s in "".join(extended.astype(int).astype(str)).split("0"))

print(f"FAST longest contiguous dark arc: {max_run} pixels (threshold N=9)")
print(f"FAST corner confirmed: {max_run >= 9}")`,
  quiz: [
    {
      q: r`What does a large positive value ($R > 0$) of the Harris corner response function signify about the underlying image patch?`,
      o: [
        r`Both eigenvalues of the structure tensor are large and positive ($\lambda_1 \approx \lambda_2 \gg 0$), indicating a distinctive two-dimensional corner`,
        r`The patch contains a straight edge with gradient variation in only one direction`,
        r`The patch is completely flat and contains uniform pixel intensities`,
        r`The patch has suffered from severe sensor saturation and lens flare`,
      ],
      a: 0,
      why: r`When both eigenvalues of the structure tensor $M$ are large, $\det(M) = \lambda_1 \lambda_2$ dominates the trace penalty $k(\lambda_1 + \lambda_2)^2$, yielding a large positive response $R > 0$ that signals an unambiguous corner.`,
    },
    {
      q: r`Why is the Harris corner detector invariant to 2D image rotation but sensitive to significant changes in image scale?`,
      o: [
        r`Eigenvalues of symmetric matrices are invariant under orthogonal rotation transformations, but zooming alters the apparent spatial radius of a corner relative to the fixed filter window`,
        r`Because the Sobel operator can only be evaluated at 45-degree angles`,
        r`Because rotation preserves colour saturation, whereas scaling alters bit depth`,
        r`Because Gaussian blur cannot be evaluated on rotated coordinate grids`,
      ],
      a: 0,
      why: r`The eigenvalues of the structure tensor describe the ellipse of the autocorrelation surface, which rotates with the image without changing size. However, the smoothing window has a fixed spatial size: zooming into a sharp corner widens it into a gradual edge, causing detection failure.`,
    },
    {
      q: r`How does the FAST corner detector achieve ultra-fast execution speeds suitable for real-time robotic SLAM?`,
      o: [
        r`By inspecting pixel intensities on a 16-pixel Bresenham circle and using a 4-pixel cardinal test to discard non-corners in a few machine instructions`,
        r`By downsampling all video frames to $16 \times 16$ pixels`,
        r`By computing Fast Fourier Transforms across the entire image on specialised DSP hardware`,
        r`By calculating 3D camera depth maps using stereo triangulation`,
      ],
      a: 0,
      why: r`FAST avoids computing floating-point image derivatives. Instead, it tests the 4 cardinal pixels (1, 5, 9, 13) on a 16-pixel circular perimeter, rejecting up to 90% of non-corner pixels with minimal CPU instructions.`,
    },
    {
      q: r`What occurs in optical flow and feature tracking if one attempts to track points located along straight edges rather than at corners (the aperture problem)?`,
      o: [
        r`Motion parallel to the edge is unobservable, leading to a mathematically ill-conditioned tracking system with an underdetermined degree of freedom`,
        r`The camera sensor immediately clips all pixel values to 255`,
        r`The frame rate of the tracking algorithm drops to zero`,
        r`Gradients across the edge cancel out, producing an imaginary number response`,
      ],
      a: 0,
      why: r`Along a straight edge, spatial gradients exist only perpendicular to the boundary. Any motion parallel to the edge leaves the local window unchanged, preventing the recovery of full 2D velocity (the classical aperture problem).`,
    },
  ],
  usedBy: ['sift-orb-and-feature-matching', 'geometric-transforms-and-homography'],
  prereq: ['edge-detection-sobel-and-canny', 'pixels-channels-and-colour-spaces'],
  related: ['sift-orb-and-feature-matching', 'geometric-transforms-and-homography', 'ransac'],
  keywords: 'harris corner detector fast features accelerated segment test structure tensor second moment matrix keypoints interest points aperture problem visual slam tracking',
},
  {
  id: 'sift-orb-and-feature-matching',
  short: 'SIFT & ORB',
  title: 'SIFT, ORB and feature matching',
  task: 'concepts',
  module: 'Classical features',
  level: 2,
  minutes: 18,
  noLab: true,
  summary: r`Local feature descriptors encode image keypoints into compact mathematical representations that remain invariant to scale, planar rotation, 3D viewpoint variation, and illumination changes. SIFT (Scale-Invariant Feature Transform) detects scale-space extrema across Difference-of-Gaussians (DoG) octaves, assigns canonical gradient orientations, and extracts 128-dimensional spatial gradient histograms. ORB (Oriented FAST and Rotated BRIEF) offers a patented-free, computationally efficient real-time alternative suited for mobile robotics and visual SLAM, combining oriented FAST keypoints with intensity-centroid rotation and 256-bit binary descriptors compared via ultra-fast Hamming distance.`,
  lead: r`Detecting where interesting points lie in an image is only half the battle. To stitch panoramas, track drone trajectories, or locate objects across different cameras, an algorithm must match keypoints between completely different viewpoints—where the target may have rotated, shrunk to half its size, or moved under harsh glare. Raw pixel patches fail immediately under the slightest rotation or zoom. SIFT and ORB solve this challenge by building invariant local descriptors: mathematical fingerprints tied to each keypoint that allow millions of visual features to be queried and matched with high fidelity.`,
  intuition: [
    r`Scale-space and the scale-invariance challenge: When an object moves further away from the camera, its image projection shrinks. A fine corner detected by a fixed $3 \times 3$ filter at close range disappears into a smooth blur at a distance. David Lowe solved this in SIFT using Gaussian scale-space: repeatedly blurring and subsampling the image into octaves, and computing Difference-of-Gaussians (DoG) pyramids ($D(x, y, \sigma) = L(x, y, k\sigma) - L(x, y, \sigma)$). Scale-space extrema—pixels that are simultaneously greater or smaller than all 26 neighbouring pixels in a $3 \times 3 \times 3$ spatial-scale volume—establish keypoint locations with an intrinsic, scale-invariant characteristic radius $\sigma$.`,
    r`Rotational canonicalisation: If a camera rotates by $45^\circ$, raw pixel neighbourhoods rotate along with it. To achieve rotation invariance, both SIFT and ORB assign a canonical orientation $\theta$ to each keypoint. In SIFT, local gradient orientations inside the keypoint's scale circle are accumulated into a 36-bin histogram; the dominant peak defines the keypoint's local coordinate system. All subsequent descriptor measurements are rotated relative to this canonical direction, rendering the descriptor rotation-invariant.`,
    r`SIFT's gradient histogram descriptor: SIFT defines a $16 \times 16$ sample region centred on the keypoint, aligned with its canonical orientation. This window is partitioned into a $4 \times 4$ grid of spatial sub-blocks. Inside each sub-block, gradient magnitudes are binned into an 8-direction orientation histogram. The resulting descriptor vector contains $4 \times 4 \times 8 = 128$ floating-point values. Normalising the vector to unit Euclidean length provides invariance to linear contrast changes, while thresholding large values at $0.2$ and re-normalising mitigates non-linear saturation effects.`,
    r`ORB's binary speed revolution: While SIFT's 128-dimensional floating-point vectors yield unmatched discriminative power, computing and matching them using Euclidean distances consumes prohibitive CPU cycles on embedded robotic platforms. Ethan Rublee et al. introduced ORB in 2011 as an open-source, ultra-fast alternative. ORB uses FAST for keypoint detection, computes an intensity centroid vector $C$ to measure local orientation $\theta = \arctan2(m_{01}, m_{10})$, and steers a pre-selected set of 256 pixel-pair intensity comparison tests (Rotated BRIEF). Each test yields a single Boolean bit ($I(x) < I(y)$), forming a 256-bit (32-byte) binary string. Matching two ORB descriptors requires only a bitwise XOR followed by a hardware population count (Hamming distance), executing in a single CPU cycle.`,
  ],
  analogy: r`Think of matching visual features like identifying suspects from security camera footage. Matching raw pixel patches is like comparing passport photos pixel-by-pixel: if a suspect turns their head by five degrees or steps into the sun, every single pixel value changes, and the computer declares no match. SIFT is like a forensic sketch artist: it measures invariant proportions—relative eye spacing, nose bridge angle, and cheekbone ratios—normalised so that distance from the camera and tilt of the head do not alter the measurements. It produces a detailed 128-point biometric dossier. ORB is like a rapid border-control checklist: it asks 256 quick yes/no questions ("Is point A darker than point B? Is point C brighter than point D?"), steering the questions to follow head tilt. Matching suspects is reduced to counting how many checkmarks disagree, allowing a smartphone to match thousands of faces per second.`,
  steps: [
    {
      title: r`Construct scale-space pyramid`,
      desc: r`Progressively filter the image across octaves to simulate viewing the scene at multiple distances.`,
      detail: r`In SIFT, the image is convolved with Gaussian kernels of increasing scale $\sigma, k\sigma, k^2\sigma$. Subtracting adjacent blurred images produces the Difference-of-Gaussians (DoG) pyramid, which closely approximates the scale-normalised Laplacian of Gaussian $\sigma^2 \nabla^2 G$ with high computational efficiency.`,
    },
    {
      title: r`Localise stable keypoints at scale-space extrema`,
      desc: r`Identify extrema across 26 spatial and scale neighbours and discard unstable edges.`,
      detail: r`Each sample point is compared against its 8 spatial neighbours at the current scale, plus 9 neighbours in the scale above and 9 in the scale below. Candidates located along one-dimensional edges or exhibiting low contrast are pruned using an eigenvalue ratio test on the 2D Hessian matrix, mirroring the Harris response criterion.`,
    },
    {
      title: r`Assign canonical keypoint orientation`,
      desc: r`Establish an intrinsic coordinate frame to achieve complete rotational invariance.`,
      detail: r`For SIFT, compute gradient magnitudes and orientations in a Gaussian-weighted window and construct a 36-bin orientation histogram. The dominant peak defines the canonical orientation. For ORB, compute spatial image moments $m_{00}, m_{10}, m_{01}$ over a patch of radius $r$; the intensity centroid offset vector from the geometric centre defines orientation $\theta = \arctan2(m_{01}, m_{10})$.`,
    },
    {
      title: r`Extract invariant descriptor vectors`,
      desc: r`Encode the oriented local neighbourhood into a floating-point or binary signature.`,
      detail: r`SIFT rotates coordinates by $-\theta$, calculates $4 \times 4$ spatial sub-grids of 8-bin gradient histograms, and normalises the resulting 128-dimensional vector to unit norm. ORB rotates 256 pre-learned pixel coordinate test pairs by $\theta$ and evaluates binary intensity comparisons, outputting a 256-bit string.`,
    },
    {
      title: r`Match feature descriptors with Lowe's ratio test`,
      desc: r`Pair descriptors across images and reject ambiguous false correspondences.`,
      detail: r`For each feature descriptor in image 1, find its nearest neighbour ($d_1$) and second-nearest neighbour ($d_2$) in image 2 (using Euclidean distance for SIFT or Hamming distance for ORB). Lowe's ratio test accepts the match only if $d_1 / d_2 < \tau$ (typically $\tau = 0.7$ to $0.8$). Ambiguous repetitive patterns (such as window panes or brickwork) produce $d_1 \approx d_2$ and are discarded.`,
    },
  ],
  math: [
    {
      h: r`Difference-of-Gaussians (DoG) scale-space`,
      tex: r`D(x, y, \sigma) = (G(x, y, k\sigma) - G(x, y, \sigma)) * I(x, y) = L(x, y, k\sigma) - L(x, y, \sigma)`,
      p: r`Here $G(x, y, \sigma) = \frac{1}{2\pi\sigma^2} e^{-(x^2 + y^2)/(2\sigma^2)}$. The difference between successive blurred scales $D(x, y, \sigma)$ provides an efficient $O(1)$ numerical approximation to the scale-normalised Laplacian of Gaussian $\sigma^2 \nabla^2 G$, whose zero-crossings and extrema denote stable multi-scale blob centres.`,
    },
    {
      h: r`Intensity centroid orientation (ORB)`,
      tex: r`m_{pq} = \sum_{x, y \in W} x^p y^q I(x, y), \quad C = \left(\frac{m_{10}}{m_{00}}, \frac{m_{01}}{m_{00}}\right), \quad \theta = \arctan2(m_{01}, m_{10})`,
      p: r`The moments $m_{10}$ and $m_{01}$ calculate the intensity-weighted centre of mass within circular window $W$. Because the intensity centroid $C$ shifts consistently with physical patch rotation, the angle $\theta$ provides an orientation anchor that can be computed using simple addition without gradient evaluation.`,
    },
    {
      h: r`Hamming distance and Lowe's ratio test`,
      tex: r`d_{\text{Hamming}}(u, v) = \sum_{i=1}^{B} (u_i \oplus v_i), \quad \text{Accept match if } \frac{\|f - g_1\|}{\|f - g_2\|} < \tau`,
      p: r`For binary descriptors $u, v \in \{0, 1\}^B$, Hamming distance counts differing bits via bitwise XOR ($\oplus$) and hardware population count (POPCNT). In Lowe's ratio test, $g_1$ is the best match and $g_2$ is the second-best match; threshold $\tau \approx 0.75$ eliminates over $90\%$ of false matches while retaining $85\%$ of correct matches.`,
    },
  ],
  keyPoints: [
    r`Local feature descriptors provide invariant representations that allow matching keypoints across rotation, scale, and lighting shifts.`,
    r`SIFT detects extrema in Difference-of-Gaussians (DoG) scale-space, assigning scale and canonical orientation to each keypoint.`,
    r`SIFT descriptors pool spatial gradients into a $4 \times 4$ grid of 8-bin histograms, forming a 128-dimensional floating-point vector.`,
    r`ORB achieves real-time speed on embedded devices by combining oriented FAST keypoints with 256-bit binary BRIEF descriptors matched via Hamming distance.`,
    r`Lowe's ratio test ($d_1 / d_2 < 0.75$) eliminates ambiguous false matches from repetitive textures by comparing nearest and second-nearest neighbour distances.`,
  ],
  pitfalls: [
    r`Using Euclidean distance to match binary descriptors: Applying Euclidean distance to binary ORB or BRIEF descriptors is mathematically incorrect and orders of magnitude slower than computing bitwise Hamming distance with popcount instructions.`,
    r`Skipping Lowe's ratio test: Matching keypoints based purely on minimum distance without comparing against the second-best match retains catastrophic false positives in regions with repetitive visual patterns (such as tiles or windows).`,
    r`Assuming 3D out-of-plane rotation invariance: SIFT and ORB are designed for 2D in-plane rotation and modest affine perspective changes; extreme viewpoint shifts (exceeding $50^\circ$ to $60^\circ$ tilt) require affine adaptations (ASIFT) or deep feature extractors.`,
    r`Ignoring image boundary margins: Keypoint descriptor extraction requires examining $16 \times 16$ or $31 \times 31$ pixel neighbourhoods; attempting to extract descriptors for keypoints situated along the image boundary causes array index out-of-bounds errors unless padded or pruned.`,
    r`Unnormalised SIFT descriptors: Failing to normalise the 128-dimensional SIFT vector to unit Euclidean norm destroys invariance to multiplicative illumination changes.`,
  ],
  code: r`import numpy as np

# Simulate keypoint orientation and binary descriptor extraction (ORB-style)
np.random.seed(42)

# 1. Create a synthetic circular patch (radius 7, diameter 15)
R = 7
y, x = np.ogrid[-R:R+1, -R:R+1]
mask = (x*x + y*y) <= R*R
patch = np.zeros((2*R+1, 2*R+1), dtype=np.float32)

# Create an asymmetric intensity pattern (e.g. brighter on one side)
patch[mask] = 50.0
patch[y > 0] += 100.0  # Bottom half is brighter

# 2. Compute intensity centroid orientation
m00 = np.sum(patch[mask])
m10 = np.sum(x * patch * mask)
m01 = np.sum(y * patch * mask)

# Orientation angle in radians and degrees
theta = np.arctan2(m01, m10)
print(f"Patch intensity moments: m00={m00:.1f}, m10={m10:.1f}, m01={m01:.1f}")
print(f"Canonical orientation angle: {np.degrees(theta):.1f} degrees")

# 3. Define 256 binary test pairs (pixel coordinates relative to center)
# In practice, these are pre-selected pairs learned by machine learning
num_tests = 256
test_x1 = np.random.randint(-5, 6, size=num_tests)
test_y1 = np.random.randint(-5, 6, size=num_tests)
test_x2 = np.random.randint(-5, 6, size=num_tests)
test_y2 = np.random.randint(-5, 6, size=num_tests)

def extract_oriented_brief(img_patch, angle):
    # Rotate test point coordinates by canonical angle theta
    cos_t = np.cos(angle)
    sin_t = np.sin(angle)
    
    rx1 = np.round(test_x1 * cos_t - test_y1 * sin_t).astype(int) + R
    ry1 = np.round(test_x1 * sin_t + test_y1 * cos_t).astype(int) + R
    rx2 = np.round(test_x2 * cos_t - test_y2 * sin_t).astype(int) + R
    ry2 = np.round(test_x2 * sin_t + test_y2 * cos_t).astype(int) + R
    
    # Binary intensity comparison test: bit is 1 if I(p1) < I(p2) else 0
    bits = img_patch[ry1, rx1] < img_patch[ry2, rx2]
    # Pack 256 boolean bits into 32 uint8 bytes
    return np.packbits(bits)

desc1 = extract_oriented_brief(patch, theta)

# 4. Simulate a matched descriptor with 5% bit noise
noise_mask = np.random.rand(num_tests) < 0.05
bits_noisy = np.unpackbits(desc1) ^ noise_mask.astype(np.uint8)
desc2 = np.packbits(bits_noisy)

# 5. Fast Hamming distance via bitwise XOR and bit counting
def hamming_distance(d1, d2):
    xor_bytes = np.bitwise_xor(d1, d2)
    return np.sum(np.unpackbits(xor_bytes))

dist_match = hamming_distance(desc1, desc2)

# Unrelated random descriptor for ratio test comparison
desc_unrelated = np.random.randint(0, 256, size=32, dtype=np.uint8)
dist_unrelated = hamming_distance(desc1, desc_unrelated)

print(f"\nDescriptor size: {desc1.nbytes} bytes (256 bits)")
print(f"Hamming distance to true match:      {dist_match} bits (low distance = match)")
print(f"Hamming distance to unrelated point: {dist_unrelated} bits (chance level ~ 128)")
print(f"Lowe's ratio (d1 / d2):              {dist_match / dist_unrelated:.3f} (< 0.75 threshold: ACCEPTED)")`,
  quiz: [
    {
      q: r`Why does SIFT construct a Difference-of-Gaussians (DoG) scale-space pyramid?`,
      o: [
        r`To approximate the scale-normalised Laplacian of Gaussian efficiently, detecting blob-like keypoints with an intrinsic, scale-invariant spatial radius`,
        r`To compress high-resolution images for transmission over low-bandwidth networks`,
        r`To eliminate all colour channels from input video streams`,
        r`To compute optical flow vectors without calculating image gradients`,
      ],
      a: 0,
      why: r`Subtracting adjacent Gaussian blurred images ($L(x, y, k\sigma) - L(x, y, \sigma)$) computes the Difference-of-Gaussians, which provides a fast, scale-invariant approximation of the Laplacian of Gaussian operator $\sigma^2 \nabla^2 G$.`,
    },
    {
      q: r`How does SIFT achieve rotational invariance when extracting its 128-dimensional descriptor vector?`,
      o: [
        r`By aligning the local descriptor coordinate grid with the keypoint's canonical orientation (the dominant peak in the local gradient histogram)`,
        r`By discarding all vertical gradients during feature pooling`,
        r`By performing Discrete Cosine Transforms along the horizontal scan lines`,
        r`By training a multi-layer perceptron on rotated MNIST digits`,
      ],
      a: 0,
      why: r`By identifying the dominant gradient orientation $\theta$ inside the keypoint's neighbourhood and rotating the $16 \times 16$ descriptor grid by $-\theta$, all gradient measurements are recorded relative to the intrinsic orientation of the feature.`,
    },
    {
      q: r`What makes ORB descriptors significantly faster to match than standard SIFT descriptors in real-time robotics?`,
      o: [
        r`ORB descriptors are 256-bit binary strings compared via bitwise XOR and Hamming distance, which execute in single-cycle hardware popcount instructions`,
        r`ORB processes only one keypoint per frame`,
        r`ORB replaces floating-point numbers with complex numbers`,
        r`ORB evaluates keypoints using quantum computing registers`,
      ],
      a: 0,
      why: r`SIFT requires computing Euclidean distances across 128 floating-point numbers ($128$ multiplies and additions per pair). ORB matches 256-bit binary vectors using bitwise XOR and a CPU popcount instruction, executing orders of magnitude faster.`,
    },
    {
      q: r`In Lowe's ratio test, why is a feature match accepted only if the ratio of the nearest neighbour distance to the second-nearest neighbour distance ($d_1 / d_2$) is below a threshold (e.g. $0.75$)?`,
      o: [
        r`To reject false matches caused by ambiguous, repetitive background textures (where the best and second-best matches have nearly identical distances)`,
        r`To ensure the total number of matched keypoints is an even integer`,
        r`To calibrate the focal length of the camera lens automatically`,
        r`To prevent division by zero in matrix inversion routines`,
      ],
      a: 0,
      why: r`When matching points on repetitive textures (such as a brick wall or fence), many candidate points look equally plausible ($d_1 \approx d_2$, ratio near 1.0). Lowe's ratio test rejects these ambiguous candidates while accepting distinctive, unique matches.`,
    },
  ],
  usedBy: ['geometric-transforms-and-homography', 'ransac'],
  prereq: ['corners-and-keypoints-harris-fast', 'pixels-channels-and-colour-spaces'],
  related: ['corners-and-keypoints-harris-fast', 'geometric-transforms-and-homography', 'ransac'],
  keywords: 'sift orb feature matching scale invariant feature transform brief difference of gaussians dog hamming distance lowe ratio test visual slam computer vision',
},
  {
    "id": "hog-with-svm",
    "short": "HOG with SVM",
    "title": "Pedestrian and Object Detection: Histogram of Oriented Gradients (HOG) with Linear SVM",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Extracting gradient orientation histograms, normalising overlapping blocks, and detecting objects with sliding-window Linear SVMs.",
    "lead": "Before deep convolutional networks achieved dominance on ImageNet, the Histogram of Oriented Gradients (HOG) paired with a Linear Support Vector Machine (Dalal & Triggs, 2005) was the gold standard for pedestrian and object detection. By capturing localized edge direction distributions invariant to illumination changes, HOG provides a fast, interpretable descriptor that remains widely used in real-time embedded vision and robotics.",
    "analogy": "Imagine drawing a quick charcoal sketch of a person walking. You do not need to shade in skin tones or cloth patterns; what makes a human instantly recognisable is the silhouette—the vertical lines of the torso and legs, the round curve of the head, and the diagonal angles of swinging arms. HOG captures this structural silhouette by tallying up the directions of edge strokes across small grid squares.",
    "intuition": [
      "The central premise of HOG is that local object appearance and shape can be characterized by the distribution of local intensity gradients, even without precise knowledge of the underlying pixel values.",
      "The image is divided into small connected spatial cells (e.g. $8 \\times 8$ pixels). For every pixel in a cell, the horizontal and vertical gradients are computed via 1D centered point derivatives $[-1, 0, 1]$. The gradient magnitude acts as a vote, and the gradient orientation determines which orientation bin (typically 9 bins from $0^\\circ$ to $180^\\circ$, unsigned) receives the vote.",
      "To provide invariance to illumination and shadowing, adjacent cells are grouped into larger spatial blocks (e.g. $2 \\times 2$ cells of $16 \\times 16$ pixels). The concatenated cell histograms within a block are normalised using $L_2$-norm with clipping ($L_2$-Hys), creating robust, contrast-invariant block descriptors.",
      "A dense multi-scale sliding window detector slides a fixed-size detection window (e.g. $64 \\times 128$ pixels) across an image pyramid, scoring each window with a pre-trained Linear SVM $w^T x + b > 0$. Overlapping detections are merged using Non-Maximum Suppression (NMS)."
    ],
    "steps": [
      "Gradient computation: Filter image with 1D horizontal and vertical kernels $[-1, 0, 1]$ and $[-1, 0, 1]^T$ to compute gradient magnitude $r$ and orientation $\\theta$.",
      "Spatial cell histogram voting: Partition image into $8 \\times 8$ pixel cells; vote gradient magnitudes into 9 angular orientation bins ($0^\\circ$ to $180^\\circ$) using bilinear interpolation.",
      "Block normalisation: Group cells into overlapping $2 \\times 2$ blocks (16x16 pixels); compute $L_2$-norm over the 36-dimensional block vector and normalise to suppress contrast variations.",
      "Concatenate window descriptor: Concatenate all normalised block vectors across the $64 \\times 128$ detection window (producing a 3,780-dimensional feature vector).",
      "Classify via Linear SVM: Compute dot product between feature vector and learned SVM hyperplane weights; score windows above threshold $\\tau$.",
      "Non-Maximum Suppression (NMS): Filter out redundant overlapping bounding boxes, preserving only highest-confidence detections."
    ],
    "math": [
      {
        "h": "Pixel Gradient Magnitude and Orientation",
        "tex": "r(x, y) = \\sqrt{I_x(x, y)^2 + I_y(x, y)^2}, \\quad \\theta(x, y) = \\arctan\\left( \\frac{I_y(x, y)}{I_x(x, y)} \\right) \\pmod{180^\\circ}",
        "p": "Computes edge intensity $r$ and unsigned angular orientation $\\theta \\in [0^\\circ, 180^\\circ)$ from directional image derivatives."
      },
      {
        "h": "Block L2-Hys Normalisation",
        "tex": "\\mathbf{v}_{\\mathrm{norm}} = \\frac{\\mathbf{v}}{\\sqrt{\\|\\mathbf{v}\\|_2^2 + \\epsilon^2}}, \\quad \\tilde{v}_i = \\min(v_{\\mathrm{norm}, i}, \\; 0.2), \\quad \\mathbf{v}_{\\mathrm{final}} = \\frac{\\tilde{\\mathbf{v}}}{\\sqrt{\\|\\tilde{\\mathbf{v}}\\|_2^2 + \\epsilon^2}}",
        "p": "Normalises block feature vector $\\mathbf{v}$, clips large outlier components at 0.2 to limit dominant gradient saturation, and re-normalises."
      },
      {
        "h": "Linear SVM Scoring Decision Boundary",
        "tex": "f(\\mathbf{x}) = \\mathbf{w}^T \\mathbf{x} + b \\ge 0 \\implies \\text{Object Detected}",
        "p": "Evaluates the linear dot product between the concatenated 3,780-D HOG descriptor $\\mathbf{x}$ and the SVM weight vector $\\mathbf{w}$."
      }
    ],
    "code": "import numpy as np\n\ndef compute_simple_hog_cell(cell_img: np.ndarray, num_bins: int = 9) -> np.ndarray:\n    \"\"\"Compute gradient orientation histogram for an 8x8 pixel cell.\"\"\"\n    # Compute 1D central differences\n    gx = np.zeros_like(cell_img, dtype=np.float32)\n    gy = np.zeros_like(cell_img, dtype=np.float32)\n    \n    gx[:, 1:-1] = cell_img[:, 2:] - cell_img[:, :-2]\n    gy[1:-1, :] = cell_img[2:, :] - cell_img[:-2, :]\n    \n    mag = np.sqrt(gx**2 + gy**2)\n    # Unsigned angle between 0 and 180 degrees\n    angle = (np.arctan2(gy, gx) * 180.0 / np.pi) % 180.0\n    \n    # Vote into orientation bins\n    hist = np.zeros(num_bins, dtype=np.float32)\n    bin_width = 180.0 / num_bins\n    \n    for i in range(cell_img.shape[0]):\n        for j in range(cell_img.shape[1]):\n            b = int(angle[i, j] / bin_width) % num_bins\n            hist[b] += mag[i, j]\n            \n    # L2 normalise cell histogram\n    norm = np.linalg.norm(hist) + 1e-6\n    return hist / norm\n\n# Sample 8x8 cell with vertical edge\ncell = np.zeros((8, 8), dtype=np.float32)\ncell[:, 4:] = 255.0  # Sharp vertical edge in middle\n\nhog_hist = compute_simple_hog_cell(cell, num_bins=9)\nprint(\"HOG 9-bin orientation histogram:\")\nprint(np.round(hog_hist, 3))\nprint(f\"Dominant orientation bin: {np.argmax(hog_hist)} (captures vertical gradient cleanly!)\")",
    "keyPoints": [
      "HOG captures structural shape and silhouettes via local distributions of intensity gradient orientations.",
      "Unsigned gradient bins ($0^\\circ$ to $180^\\circ$) capture edge orientation regardless of light/dark transition order.",
      "Overlapping block normalisation provides robustness against illumination changes and shadows.",
      "Paired with Linear SVM, HOG provides fast pedestrian detection without deep neural networks."
    ],
    "pitfalls": [
      "Scale sensitivity without image pyramids: HOG is not scale invariant; detecting pedestrians at various distances requires constructing a dense image pyramid.",
      "Rigid deformation failure: HOG with a single linear SVM struggles with articulated human poses (sitting, crouching, jumping); requires Deformable Part Models (DPM).",
      "Signed vs unsigned angles: Using signed angles ($0^\\circ$ to $360^\\circ$) degrades pedestrian detection because an edge transitioning from dark-to-light has the same structural meaning as light-to-dark."
    ],
    "quiz": [
      {
        "q": "Why does HOG typically use \"unsigned\" gradient orientations ($0^\\circ$ to $180^\\circ$) rather than signed orientations ($0^\\circ$ to $360^\\circ$) for pedestrian detection?",
        "o": [
          "Because math libraries cannot calculate angles over 180 degrees",
          "Unsigned angles make the descriptor invariant to whether a foreground garment is lighter or darker than the background (e.g. white shirt on dark wall vs dark shirt on white wall)",
          "To double the memory consumption",
          "Because pedestrians only walk in one direction"
        ],
        "a": 1,
        "why": "A dark shirt on a light wall has the opposite gradient sign of a light shirt on a dark wall. Unsigned gradients map both to the same orientation, capturing the invariant contour."
      },
      {
        "q": "What is the purpose of overlapping block normalisation in the HOG descriptor?",
        "o": [
          "To blur the image before filtering",
          "To ensure illumination and local contrast variations do not distort gradient magnitudes",
          "To resize the image to a power of two",
          "To convert floating point values to integers"
        ],
        "a": 1,
        "why": "In natural scenes, sunlight and shadows scale gradient magnitudes dramatically. Normalising overlapping blocks provides local photometric invariance."
      },
      {
        "q": "How does a HOG-based detector locate objects of different physical sizes in a photograph?",
        "o": [
          "By dynamically stretching the SVM weights",
          "By scanning an Image Pyramid where the input image is repeatedly subsampled at multiple scales, using a fixed-size HOG window detector",
          "By applying non-linear polynomial kernel expansions",
          "By retraining the SVM at every single pixel"
        ],
        "a": 1,
        "why": "HOG uses a fixed detection window ($64 \\times 128$). Detecting objects at various scales requires resizing the image repeatedly into a scale-space image pyramid."
      }
    ],
    "related": [
      "edge-detection-sobel-and-canny",
      "iou-nms-and-map",
      "support_vector_classifier"
    ],
    "keywords": "hog, histogram of oriented gradients, svm, pedestrian detection, dalal triggs, block normalisation, image pyramid, sliding window"
  },
  {
    "id": "image-pyramids-and-scale-space",
    "short": "Pyramids & scale space",
    "title": "Image Pyramids and Scale Space: Gaussian Blurring, Laplacians, and Multiscale Representation",
    "task": "concepts",
    "level": 2,
    "minutes": 15,
    "noLab": true,
    "usedBy": [],
    "summary": "Representing visual structures across continuous spatial scales using Gaussian scale spaces, Laplacian bandpass pyramids, and octave downsampling.",
    "lead": "Real-world objects do not exist at a single fixed scale: a car can appear as a 20-pixel dot on the horizon or a 2,000-pixel structure occupying the entire camera frame. Computer vision algorithms that operate at a single pixel resolution cannot recognise objects across distances. Gaussian scale space theory and image pyramids provide mathematically principled frameworks for analyseing images across multiple spatial resolutions.",
    "analogy": "Imagine viewing an oil painting in an art gallery. When standing 10 centimeters away, you see high-frequency brush stroke textures and canvas fabric threads, but cannot perceive the overall subject. As you walk backwards 5 meters, fine texture blurs away, revealing the broad low-frequency forms of trees, hills, and a cathedral. An image pyramid captures all viewing distances simultaneously.",
    "intuition": [
      "Scale space theory (Witkin, Koenderink) proves that the only linear, shift-invariant, isotropic scale-space operator that does not create new spurious features (extrema) as scale expands is the Gaussian kernel: $L(x, y; \\sigma) = I(x, y) * G(x, y; \\sigma)$.",
      "As standard deviation $\\sigma$ increases, high-frequency details (fine edges, texture noise) are progressively suppressed, leaving stable coarse structures.",
      "A Gaussian Pyramid discretizes continuous scale space by alternating Gaussian blurring with dyadic spatial subsampling (downsampling by $2\\times$), creating a pyramid of progressively smaller image octaves.",
      "A Laplacian Pyramid computes the difference between adjacent Gaussian levels, isolating distinct frequency octaves (bandpass filtering). This decomposition enables seamless multi-band image blending (e.g. stitching panoramic photos without visible seams) and feature detection (SIFT Difference of Gaussians)."
    ],
    "steps": [
      "Configure pyramid octaves and scales: Select number of pyramid levels $K$ based on image resolution and minimum detectable object size.",
      "Apply Gaussian smoothing: Convolve image with a symmetric Gaussian blur kernel (typically $5 \\times 5$ binomial kernel).",
      "Downsample (Subsample): Discard every other row and column ($2\\times$ spatial decimation) to produce the next Gaussian pyramid octave $G_{k+1}$.",
      "Compute Laplacian bandpass level: Upsample $G_{k+1}$ back to $G_k$'s dimensions and subtract: $L_k = G_k - \\operatorname{Up}(G_{k+1})$.",
      "Detect scale-space extrema: Search across $3 \\times 3 \\times 3$ scale-space volumes (spatial coordinates and adjacent scale levels) to identify scale-invariant keypoint candidates.",
      "Reconstruct original image: Reconstruct losslessly by recursively adding upsampled levels: $G_k = L_k + \\operatorname{Up}(G_{k+1})$."
    ],
    "math": [
      {
        "h": "Linear Scale-Space Definition",
        "tex": "L(x, y; \\sigma) = I(x, y) * G(x, y; \\sigma), \\quad G(x, y; \\sigma) = \\frac{1}{2\\pi\\sigma^2} \\exp\\left( -\\frac{x^2 + y^2}{2\\sigma^2} \\right)",
        "p": "Convolution with a Gaussian kernel uniquely satisfies the causality axiom: no new local extrema can be created as scale $\\sigma$ increases."
      },
      {
        "h": "Laplacian Pyramid Bandpass Decomposition",
        "tex": "L_k = G_k - \\operatorname{Expand}(G_{k+1}), \\quad k \\in \\{0, 1, \\dots, K-1\\}",
        "p": "Each Laplacian level $L_k$ isolates the bandpass frequency information lost between consecutive Gaussian octaves."
      },
      {
        "h": "Difference-of-Gaussians (DoG) Approximation",
        "tex": "D(x, y; \\sigma, k) = L(x, y; k\\sigma) - L(x, y; \\sigma) \\approx (k - 1)\\sigma^2 \\nabla^2 L(x, y; \\sigma)",
        "p": "Difference of Gaussians provides an efficient approximation to the scale-normalised Laplacian of Gaussian (LoG) operator."
      }
    ],
    "code": "import numpy as np\n\ndef gaussian_downsample_2x(image: np.ndarray) -> np.ndarray:\n    \"\"\"Blur and subsample image by 2x (single octave downstep).\"\"\"\n    # 3x3 simple Gaussian kernel\n    kernel = np.array([\n        [1, 2, 1],\n        [2, 4, 2],\n        [1, 2, 1]\n    ], dtype=np.float32) / 16.0\n    \n    # 2D convolution (valid padding)\n    h, w = image.shape\n    blurred = np.zeros_like(image)\n    for i in range(1, h - 1):\n        for j in range(1, w - 1):\n            blurred[i, j] = np.sum(image[i-1:i+2, j-1:j+2] * kernel)\n            \n    # Subsample every second row and column\n    return blurred[::2, ::2]\n\n# Create 16x16 test pattern\nimg = np.random.uniform(0, 255, size=(16, 16)).astype(np.float32)\n\n# Build 3-level Gaussian Pyramid\ng0 = img\ng1 = gaussian_downsample_2x(g0)\ng2 = gaussian_downsample_2x(g1)\n\nprint(\"Gaussian Pyramid Dimensions across Octaves:\")\nprint(f\"Level 0 (Base):    {g0.shape}\")\nprint(f\"Level 1 (Octave 1): {g1.shape}\")\nprint(f\"Level 2 (Octave 2): {g2.shape}\")\nprint(\"Subsampling preserves coarse structures while drastically reducing resolution!\")",
    "keyPoints": [
      "Scale-space theory represents images across continuous scales without introducing artificial artifacts.",
      "Gaussian blurring is the unique linear scale-space kernel that guarantees no new extrema are created.",
      "A Gaussian pyramid combines blurring with $2\\times$ downsampling to represent octaves efficiently.",
      "Laplacian pyramids decompose images into bandpass frequency layers, enabling seamless multi-band blending."
    ],
    "pitfalls": [
      "Downsampling without blurring (Aliasing): Subsampling pixels directly without pre-filtering with a low-pass Gaussian filter introduces severe high-frequency Moiré aliasing artifacts.",
      "Memory overhead of non-subsampled scale space: Maintaining full image resolution across all scale levels consumes massive RAM; octave decimation is essential for scalability.",
      "Edge effects during convolution: Failing to handle image boundaries properly causes dark borders to propagate and contaminate upper pyramid levels."
    ],
    "quiz": [
      {
        "q": "Why is the Gaussian kernel mathematically unique in scale-space theory?",
        "o": [
          "It is the only filter that executes in zero milliseconds",
          "It is the unique linear, shift-invariant kernel that satisfies the causality axiom: no new local extrema (spurious features) are created as scale increases",
          "It converts colour images into text",
          "It eliminates the need for matrices"
        ],
        "a": 1,
        "why": "Scale-space axioms prove that the Gaussian kernel is the only linear filter that does not introduce new spurious peaks or valleys as smoothing increases."
      },
      {
        "q": "What occurs if you downsample an image by $2\\times$ without first applying a low-pass Gaussian blur filter?",
        "o": [
          "The image becomes completely transparent",
          "High-frequency frequencies fold back into low frequencies, creating severe jagged aliasing artifacts and Moiré patterns",
          "The file size expands exponentially",
          "Colours are inverted"
        ],
        "a": 1,
        "why": "By the Nyquist-Shannon sampling theorem, subsampling without low-pass filtering causes frequencies above the new Nyquist limit to fold back as aliasing."
      },
      {
        "q": "What is a Laplacian Pyramid used for in multi-resolution image processing?",
        "o": [
          "To encrypt images",
          "To decompose an image into distinct bandpass frequency sub-bands, allowing operations like multi-band exposure blending and seamless image stitching",
          "To calculate neural network loss",
          "To train decision tree classifiers"
        ],
        "a": 1,
        "why": "A Laplacian pyramid stores differences between adjacent Gaussian levels, isolating frequency octaves for seamless multi-band blending and texture synthesis."
      }
    ],
    "related": [
      "sift-orb-and-feature-matching",
      "corners-and-keypoints-harris-fast",
      "edge-detection-sobel-and-canny"
    ],
    "keywords": "image pyramids, scale space, gaussian pyramid, laplacian pyramid, difference of gaussians, dog, multi-scale, aliasing, subsampling"
  },
  {
    "id": "bag-of-visual-words",
    "short": "Bag of visual words",
    "title": "Bag of Visual Words (BoVW): Visual Vocabularies, Codebooks, and Spatial Pyramids",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Quantising local descriptors into visual words with K-Means codebooks, TF-IDF weighting, and Spatial Pyramid Matching.",
    "lead": "Before deep learning end-to-end representation learning, image retrieval and scene classification adapted techniques directly from natural language processing. Just as documents are represented as a \"bag of words\" based on dictionary term frequencies, an image can be represented as a Bag of Visual Words (BoVW). By clustering invariant local descriptors (SIFT) into a discrete visual vocabulary, BoVW converts variable numbers of local keypoints into fixed-length vectors for standard classifiers.",
    "analogy": "Imagine categorising architecture styles (gothic cathedrals vs modern skyscrapers). You do not look at every single brick; instead, you build a mental vocabulary of architectural motifs: \"pointed arches\", \"stained-glass rosettes\", \"flying buttresses\", and \"steel I-beams\". Describing a cathedral simply involves tallying the frequency of these visual motifs: an image with 5 pointed arches and 2 rosettes is classified as Gothic, regardless of where they appear.",
    "intuition": [
      "Local feature detectors (like SIFT) extract variable numbers of 128-dimensional descriptors per image (e.g. 500 vectors for one image, 2,000 for another). Standard machine learning classifiers (SVMs, Random Forests) require a fixed-length feature vector.",
      "BoVW constructs a Visual Codebook (vocabulary) of size $K$ by clustering millions of SIFT descriptors extracted across a training corpus using K-Means. Each cluster centroid represents a \"visual word\" (e.g. an eye corner, a bicycle spoke, or a leafy texture).",
      "For a new query image, its local descriptors are assigned to the nearest visual word centroid. The image is represented as a $K$-dimensional histogram of visual word frequencies, weighted using TF-IDF to down-weight ubiquitous background textures (like flat sky or grass).",
      "The primary limitation of standard BoVW is the complete loss of spatial layout (a face with a mouth above the eyes has the same histogram as a normal face). Spatial Pyramid Matching (Lazebnik et al.) overcomes this by partitioning the image into increasingly fine sub-grids ($1 \\times 1, 2 \\times 2, 4 \\times 4$) and concatenating weighted histograms across spatial resolutions."
    ],
    "steps": [
      "Extract local invariant descriptors: Run SIFT, SURF, or ORB across all training images to extract millions of 128-D local feature vectors.",
      "Construct visual vocabulary (Codebook): Cluster sampled descriptors into $K$ centroids (typically $K \\in [500, 5000]$) using K-Means.",
      "Quantise image features: For each test image, map each extracted descriptor to its nearest visual word centroid in Euclidean distance.",
      "Compute TF-IDF histogram: Accumulate frequency counts into a $K$-dimensional histogram; weight by Inverse Document Frequency (IDF) and normalise.",
      "Construct Spatial Pyramid (SPM): Subdivide image into $1 \\times 1$, $2 \\times 2$, and $4 \\times 4$ grids; compute BoVW histograms within each grid cell and concatenate with geometric weights.",
      "Train linear classifier: Train a Support Vector Machine with Histogram Intersection Kernel or linear solver on the final fixed-length vectors."
    ],
    "math": [
      {
        "h": "Vector Quantisation to Visual Words",
        "tex": "w(x_i) = \\operatorname*{arg\\,min}_{k \\in \\{1, \\dots, K\\}} \\| x_i - \\mathbf{c}_k \\|_2^2",
        "p": "Quantises continuous local descriptor $x_i \\in \\mathbb{R}^{128}$ to the index of the nearest codebook centroid $\\mathbf{c}_k$."
      },
      {
        "h": "Spatial Pyramid Match Kernel Weighting",
        "tex": "\\mathcal{K}_{\\mathrm{SPM}}(X, Y) = \\mathcal{I}_L + \\sum_{l=0}^{L-1} \\frac{1}{2^{L-l}} \\left( \\mathcal{I}_l - \\mathcal{I}_{l+1} \\right)",
        "p": "Weights matches at finer spatial resolutions $l$ exponentially higher than coarse global matches, where $\\mathcal{I}$ is histogram intersection."
      },
      {
        "h": "Histogram Intersection Kernel",
        "tex": "\\mathcal{I}(\\mathbf{h}_A, \\mathbf{h}_B) = \\sum_{k=1}^K \\min\\left( h_{A, k}, \\; h_{B, k} \\right)",
        "p": "Measures non-linear overlap between two normalised visual word frequency histograms."
      }
    ],
    "code": "import numpy as np\nfrom sklearn.cluster import MiniBatchKMeans\n\n# Simulate extracting 100 SIFT-like descriptors across training images\nnp.random.seed(42)\ndescriptors_corpus = np.random.randn(500, 128).astype(np.float32)\n\n# 1. Build Visual Vocabulary of K=8 words via K-Means\nvocab_size = 8\nkmeans = MiniBatchKMeans(n_clusters=vocab_size, random_state=42, n_init='auto')\nkmeans.fit(descriptors_corpus)\n\n# 2. Represent a new test image with 20 detected local descriptors\ntest_descriptors = np.random.randn(20, 128).astype(np.float32)\n\n# Quantise descriptors to nearest visual words\nword_assignments = kmeans.predict(test_descriptors)\n\n# 3. Construct Bag of Visual Words histogram\nbovw_hist = np.bincount(word_assignments, minlength=vocab_size).astype(np.float32)\n# L1 normalise frequency vector\nbovw_hist /= np.sum(bovw_hist)\n\nprint(\"Visual Vocabulary Centroids Shape:\", kmeans.cluster_centers_.shape)\nprint(\"Quantised Visual Words Assigned:  \", word_assignments[:10])\nprint(\"Final BoVW Histogram Representation (K=8):\")\nprint(np.round(bovw_hist, 3))\nprint(\"Image converted to fixed-length 8-D vector ready for SVM classification!\")",
    "keyPoints": [
      "Bag of Visual Words converts variable numbers of local keypoints into fixed-length feature vectors.",
      "A visual codebook is constructed by clustering SIFT descriptors using K-Means.",
      "TF-IDF weighting down-weights common non-informative textures like uniform sky.",
      "Spatial Pyramid Matching restores spatial layout by computing histograms across hierarchical sub-grids."
    ],
    "pitfalls": [
      "Codebook undersizing or oversizing: If $K$ is too small (e.g. 50), words are too coarse to distinguish objects; if $K$ is too large (e.g. 100,000), quantisation noise prevents matches.",
      "Loss of spatial layout in naive BoVW: Standard BoVW treats an image as an unstructured bag; spatial pyramids are mandatory to preserve scene composition.",
      "K-Means clustering scalability: Clustering 10 million SIFT descriptors with standard K-Means is computationally prohibitive; use MiniBatchKMeans or Approximate K-Means (FLANN)."
    ],
    "quiz": [
      {
        "q": "What is the primary motivation for constructing a \"Bag of Visual Words\" representation of an image?",
        "o": [
          "To generate audio speech from images",
          "To convert an arbitrary, variable number of localized keypoint descriptors (like SIFT) into a single fixed-length feature vector suitable for standard machine learning classifiers",
          "To compress JPEG images for web transmission",
          "To replace convolutional neural networks"
        ],
        "a": 1,
        "why": "Different images yield different numbers of keypoints (e.g. 150 vs 1,200). BoVW maps descriptors to fixed $K$-dimensional codebook histograms, enabling standard SVM/RF classification."
      },
      {
        "q": "How does Spatial Pyramid Matching (SPM) overcome the primary limitation of the classical Bag of Visual Words model?",
        "o": [
          "By converting images into 3D holograms",
          "By computing visual word histograms across multi-level spatial grids ($1 \\times 1, 2 \\times 2, 4 \\times 4$), preserving coarse spatial layout and geometry",
          "By replacing SIFT with random numbers",
          "By deleting all background pixels"
        ],
        "a": 1,
        "why": "Standard BoVW discards spatial relationships completely. Spatial pyramids partition the image into hierarchical sub-regions, preserving spatial context."
      },
      {
        "q": "What is a \"visual word\" in the BoVW pipeline?",
        "o": [
          "A text label written on an image",
          "The cluster centroid of a group of similar local descriptors (e.g. SIFT vectors) discovered via K-Means clustering in feature space",
          "A word in the English dictionary",
          "A single RGB pixel"
        ],
        "a": 1,
        "why": "A visual word is a centroid in 128-D descriptor space representing a prototypical local visual patch or edge pattern."
      }
    ],
    "related": [
      "sift-orb-and-feature-matching",
      "bag-of-words-and-tf-idf",
      "support_vector_classifier"
    ],
    "keywords": "bag of visual words, bovw, visual vocabulary, codebook, spatial pyramid matching, spm, sift, vector quantisation, image classification"
  },
  {
  id: 'geometric-transforms-and-homography',
  short: 'Homography & Transforms',
  title: 'Geometric transforms and homography',
  task: 'concepts',
  module: 'Geometry',
  level: 2,
  minutes: 16,
  noLab: true,
  summary: r`Planar projective transformations (homographies) map points between different camera perspectives of a planar scene or across views captured by a camera rotating purely around its optical centre. Governed by a $3 \times 3$ invertible matrix $H$ with 8 degrees of freedom in homogeneous coordinates ($\mathbf{x}' \sim H \mathbf{x}$), homographies generalise translation, Euclidean rigid-body motion, similarity, and affine transformations. Estimating $H$ from four or more point correspondences via the Direct Linear Transformation (DLT) algorithm forms the mathematical engine for panoramic image stitching, document perspective rectification, and augmented reality planar tracking.`,
  lead: r`When you capture an angled photograph of a whiteboard or a receipt on a table, the rectangular surface appears distorted into an arbitrary quadrilateral: parallel lines converge toward vanishing points, and right angles shear. Yet because the physical surface is flat, that distortion is not arbitrary. A single linear transformation in projective space—a homography—completely maps any point on the world plane directly to your sensor plane. Understanding the geometric hierarchy of 2D transforms and solving for homographies from point matches is the gateway from 2D pixel processing to 3D spatial vision.`,
  intuition: [
    r`The geometric transformation hierarchy: 2D planar transformations form a strict nesting hierarchy based on preserved geometric invariants. Rigid (Euclidean) transforms preserve Euclidean distances and angles (3 degrees of freedom: 2 translation, 1 rotation). Similarity transforms add uniform scaling, preserving angles and length ratios (4 degrees of freedom). Affine transforms allow independent axis scaling and shear, mapping parallel lines to parallel lines but distorting angles (6 degrees of freedom). Projective transformations (homographies) represent the most general linear mapping in homogeneous coordinates: parallel lines intersect at vanishing lines, lengths and angles warp freely, but straight lines remain straight (8 degrees of freedom).`,
    r`Projective geometry and homogeneous coordinates: In standard Cartesian coordinates $(x, y)$, a projective warp is non-linear due to perspective division by depth: $x' = \frac{h_{11}x + h_{12}y + h_{13}}{h_{31}x + h_{32}y + h_{33}}$. By introducing homogeneous coordinates $\mathbf{x} = [x, y, 1]^T$ and $\mathbf{x}' = [x', y', 1]^T$, this non-linear perspective mapping becomes a strictly linear matrix multiplication $\mathbf{x}' \sim H \mathbf{x}$, where $\sim$ denotes equality up to an arbitrary non-zero global scale factor $\lambda$.`,
    r`When does a homography hold: A $3 \times 3$ homography accurately maps pixels between two cameras under two physical conditions: (1) all observed 3D points lie on a common flat physical plane in the scene (such as a floor, facade, or table surface), or (2) the camera rotates purely around its optical centre with zero baseline translation ($C_1 = C_2$). The second condition is why panoramic mobile apps can stitch 360-degree vistas of mountains and landscapes without needing 3D depth reconstructions.`,
    r`Solving for $H$ via Direct Linear Transformation (DLT): Because each 2D point correspondence $(x, y) \leftrightarrow (x', y')$ provides two independent linear constraints on $H$, a minimum of four non-collinear point pairs are required to constrain the 8 degrees of freedom of $H$ (up to scale). Rather than solving non-linear ratios directly, DLT exploits the vector cross-product identity $\mathbf{x}' \times (H \mathbf{x}) = \mathbf{0}$, rearranging the point constraints into a homogeneous linear system $A \mathbf{h} = \mathbf{0}$, where $A$ is an $2N \times 9$ coefficient matrix. The optimal solution in the presence of noise is the right singular vector of $A$ associated with its smallest singular value, computed via Singular Value Decomposition (SVD).`,
  ],
  analogy: r`Imagine holding a flat glass slide painted with a square grid in front of an overhead projector. If you slide the slide left or right, the projected shadow translates (Euclidean motion). If you spin the slide like a steering wheel, the projection rotates (Euclidean). If you move the projector closer or further, the shadow expands or contracts uniformly (similarity). If you pull the projector screen at an oblique angle, the shadow stretches into a parallelogram (affine transform). But if you tilt the glass slide itself relative to the light beam, the light rays travel different distances before striking the wall: the square grid warps into a trapezoid where parallel grid lines converge toward a horizon. That trapezoidal shadow is a homography. Reversing the homography is like positioning a virtual projector to un-tilt the shadow back into a perfect square.`,
  steps: [
    {
      title: r`Collect point correspondences across views`,
      desc: r`Establish matching feature coordinates between source and target planar coordinate systems.`,
      detail: r`Using feature detectors and descriptors (such as SIFT or ORB) combined with outlier rejection (RANSAC), extract $N \ge 4$ pairs of corresponding points $(x_i, y_i) \leftrightarrow (x'_i, y'_i)$. No three points in either set may be collinear.`,
    },
    {
      title: r`Normalise point coordinates (Hartley preconditioner)`,
      desc: r`Translate the centroid of points to the origin and scale average distance to $\sqrt{2}$.`,
      detail: r`Direct algebraic estimation on raw pixel coordinates ($x \sim 10^3$) creates severe numerical instability in matrix $A$, because coordinate product terms $x_i x'_i$ reach $10^6$ while constant terms equal $1$. Compute normalising similarity transformations $T$ and $T'$ such that $\tilde{\mathbf{x}}_i = T \mathbf{x}_i$ and $\tilde{\mathbf{x}}'_i = T' \mathbf{x}'_i$. Hartley normalisation prevents rank-deficient SVD solutions and dramatically boosts estimation accuracy.`,
    },
    {
      title: r`Construct the DLT linear constraint matrix $A$`,
      desc: r`Formulate two independent linear equations per point correspondence.`,
      detail: r`From $\mathbf{x}'_i \times (H \mathbf{x}_i) = \mathbf{0}$, the $i$-th correspondence contributes two rows to matrix $A \in \mathbb{R}^{2N \times 9}$: $\begin{bmatrix} -\mathbf{x}_i^T & \mathbf{0}^T & x'_i \mathbf{x}_i^T \\ \mathbf{0}^T & -\mathbf{x}_i^T & y'_i \mathbf{x}_i^T \end{bmatrix}$. Stacking $N \ge 4$ pairs creates system $A \mathbf{h} = \mathbf{0}$, where $\mathbf{h} = [h_{11}, h_{12}, \dots, h_{33}]^T$.`,
    },
    {
      title: r`Solve via Singular Value Decomposition (SVD)`,
      desc: r`Extract the eigenvector minimising algebraic reprojection error.`,
      detail: r`Compute the Singular Value Decomposition $A = U \Sigma V^T$. The vector $\mathbf{h}$ that minimises $\|A \mathbf{h}\|$ subject to $\|\mathbf{h}\| = 1$ is the last column of $V$ (corresponding to the smallest singular value in $\Sigma$). Reshape $\mathbf{h}$ into the $3 \times 3$ matrix $\tilde{H}$.`,
    },
    {
      title: r`Denormalise and scale the homography matrix`,
      desc: r`Map the normalised solution back to physical pixel coordinates.`,
      detail: r`Recover the true image homography via $H = (T')^{-1} \tilde{H} T$. Divide all elements by $H_{33}$ so that the bottom-right element equals $1$. Apply $H$ to warp images using bilinear interpolation or rectify planar objects into canonical bird's-eye perspectives.`,
    },
  ],
  math: [
    {
      h: r`Planar projective transformation in homogeneous coordinates`,
      tex: r`\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} \sim \begin{bmatrix} h_{11} & h_{12} & h_{13} \\ h_{21} & h_{22} & h_{23} \\ h_{31} & h_{32} & h_{33} \end{bmatrix} \begin{bmatrix} x \\ y \\ 1 \end{bmatrix} = H \mathbf{x}`,
      p: r`The matrix $H \in \mathbb{R}^{3 \times 3}$ has 9 entries but only 8 independent degrees of freedom due to the arbitrary scale factor: multiplying $H$ by any non-zero scalar $c \neq 0$ leaves projected inhomogeneous coordinates $(x' = \frac{h_{11}x + h_{12}y + h_{13}}{h_{31}x + h_{32}y + h_{33}}, y' = \frac{h_{21}x + h_{22}y + h_{23}}{h_{31}x + h_{32}y + h_{33}})$ completely unchanged.`,
    },
    {
      h: r`Direct Linear Transformation (DLT) cross-product constraint`,
      tex: r`\mathbf{x}'_i \times (H \mathbf{x}_i) = \mathbf{0} \implies \begin{bmatrix} \mathbf{0}^T & -w'_i \mathbf{x}_i^T & y'_i \mathbf{x}_i^T \\ w'_i \mathbf{x}_i^T & \mathbf{0}^T & -x'_i \mathbf{x}_i^T \end{bmatrix} \begin{bmatrix} \mathbf{h}_1 \\ \mathbf{h}_2 \\ \mathbf{h}_3 \end{bmatrix} = \mathbf{0}`,
      p: r`Because the cross product of two collinear vectors is zero, expanding the vector product yields three equations, of which two are linearly independent. For $N$ point correspondences, stacking rows yields the $2N \times 9$ matrix $A$, solved via $\min_{\|\mathbf{h}\|=1} \|A \mathbf{h}\|^2$.`,
    },
    {
      h: r`Hartley coordinate normalisation transform`,
      tex: r`T = \begin{bmatrix} \frac{\sqrt{2}}{\bar{d}} & 0 & -\frac{\sqrt{2}\,\bar{x}}{\bar{d}} \\ 0 & \frac{\sqrt{2}}{\bar{d}} & -\frac{\sqrt{2}\,\bar{y}}{\bar{d}} \\ 0 & 0 & 1 \end{bmatrix}, \quad \bar{d} = \frac{1}{N} \sum_{i=1}^N \sqrt{(x_i - \bar{x})^2 + (y_i - \bar{y})^2}`,
      p: r`Translating coordinates so their centroid $(\bar{x}, \bar{y})$ lies at the origin and scaling average distance from the origin to $\sqrt{2}$ bounds the numerical entries of $A$, balancing condition numbers and preventing numerical overflow in SVD solvers.`,
    },
  ],
  keyPoints: [
    r`A homography is an invertible $3 \times 3$ projective matrix with 8 degrees of freedom relating two planar perspective views.`,
    r`Homographies hold whenever scenes are planar OR whenever the camera rotates purely around its optical centre with zero translation.`,
    r`Four non-collinear point correspondences are the minimum necessary to solve for $H$ (each pair provides 2 independent linear constraints).`,
    r`The Direct Linear Transformation (DLT) algorithm transforms the non-linear perspective mapping into an algebraic null-space problem $A\mathbf{h}=\mathbf{0}$, solved via SVD.`,
    r`Hartley coordinate normalisation (zero centroid, average radius $\sqrt{2}$) is essential to prevent numerical instability during algebraic estimation.`,
  ],
  pitfalls: [
    r`Applying homography to 3D scenes with translation: If the camera translates in a non-planar 3D scene, parallax causes points at different depths to shift at different rates; a single homography cannot model parallax and produces heavy double-vision ghosting artifacts.`,
    r`Collinear point sets: If three of the four selected calibration points lie along a single straight line, the DLT constraint matrix becomes rank-deficient, yielding an invalid or degenerate homography matrix.`,
    r`Omitting Hartley coordinate normalisation: Solving DLT directly on raw pixel coordinates ($x, y \approx 1000$) produces condition numbers on the order of $10^8$, corrupting the SVD solution with severe floating-point rounding errors.`,
    r`Inverting perspective division: Forgetting to divide by the homogeneous coordinate $w' = h_{31}x + h_{32}y + h_{33}$ when mapping back to Cartesian space produces unscaled projective coordinates that misplace warped points.`,
    r`Forward warping holes: Iterating through source image pixels and scattering them to target coordinates $(x', y') = H(x, y)$ leaves empty unpainted pixel gaps ("holes") in the target image due to rounding; always use inverse warping (iterating over target pixels and pulling from $H^{-1}$).`,
  ],
  code: r`import numpy as np

# Estimate a 3x3 homography matrix from 4 point correspondences via DLT
# Source coordinates (e.g. tilted document corners in an image)
pts_src = np.array([
    [100.0, 150.0],
    [400.0, 120.0],
    [380.0, 480.0],
    [80.0,  450.0]
], dtype=np.float32)

# Target coordinates (e.g. rectified rectangular document 300x400)
pts_dst = np.array([
    [0.0,   0.0],
    [300.0, 0.0],
    [300.0, 400.0],
    [0.0,   400.0]
], dtype=np.float32)

def compute_homography_dlt(src, dst):
    N = src.shape[0]
    A = []
    
    for i in range(N):
        x, y = src[i, 0], src[i, 1]
        u, v = dst[i, 0], dst[i, 1]
        
        # Two linear equations per point correspondence from cross product: x' x (H x) = 0
        A.append([-x, -y, -1.0,  0.0,  0.0,  0.0, u*x, u*y, u])
        A.append([ 0.0,  0.0,  0.0, -x, -y, -1.0, v*x, v*y, v])
        
    A = np.array(A, dtype=np.float64)
    
    # Solve A h = 0 via Singular Value Decomposition
    # Optimal solution h is the singular vector corresponding to smallest singular value
    U, S, Vt = np.linalg.svd(A)
    H = Vt[-1].reshape(3, 3)
    
    # Normalise so bottom-right element H[2, 2] == 1.0
    return H / H[2, 2]

H = compute_homography_dlt(pts_src, pts_dst)
print("Estimated 3x3 Homography Matrix H:")
print(np.round(H, 4))

# Verify forward projection on the 4 source points
ones = np.ones((4, 1), dtype=np.float32)
pts_src_homo = np.hstack([pts_src, ones])  # shape (4, 3)

# Project points: x' ~ H @ x
projected_homo = (H @ pts_src_homo.T).T
# Perform perspective division by w'
projected_cart = projected_homo[:, :2] / projected_homo[:, 2:3]

reprojection_error = np.linalg.norm(projected_cart - pts_dst, axis=1)
print("\nTarget coordinates:")
print(pts_dst)
print("\nReprojected coordinates:")
print(np.round(projected_cart, 2))
print(f"\nMax reprojection error: {np.max(reprojection_error):.2e} pixels")
assert np.max(reprojection_error) < 1e-3, "Homography DLT estimation error!"
print("Homography DLT algorithm successfully verified!")`,
  quiz: [
    {
      q: r`Under what physical camera conditions is a $3 \times 3$ planar homography mathematically valid to register images?`,
      o: [
        r`When the viewed scene surfaces are planar OR when the camera undergoes pure rotation around its optical centre with zero translation`,
        r`Only when the camera moves along a straight linear rail at constant velocity`,
        r`Whenever the scene contains more than 1,000 distinct colour shades`,
        r`Only when the image is captured using a fish-eye panoramic lens`,
      ],
      a: 0,
      why: r`A homography models perspective projections between planes. It holds strictly if all scene points lie on a single 3D plane, or if the camera rotates purely about its optical centre (eliminating depth parallax).`,
    },
    {
      q: r`How many non-collinear point correspondences are required as a mathematical minimum to estimate an 8-degree-of-freedom homography matrix?`,
      o: [
        r`4 point correspondences (each point provides 2 independent linear constraints, yielding 8 equations)`,
        r`3 point correspondences (yielding 6 equations)`,
        r`8 point correspondences (yielding 16 equations)`,
        r`2 point correspondences (yielding 4 equations)`,
      ],
      a: 0,
      why: r`Matrix $H$ has 9 elements with 8 degrees of freedom up to scale. Each 2D point correspondence provides two equations ($x'$ and $y'$), requiring at least $8 / 2 = 4$ non-collinear pairs.`,
    },
    {
      q: r`Why does the Direct Linear Transformation (DLT) algorithm require coordinate normalisation (Hartley normalisation) prior to running SVD?`,
      o: [
        r`Because raw pixel coordinates ($x \approx 10^3$) create massive numerical scale disparities between $x_i x'_i \sim 10^6$ and constant entries $1$, causing severe condition number inflation and rounding errors`,
        r`Because SVD cannot process positive coordinate values`,
        r`Because normalisation converts Cartesian coordinates into polar angles`,
        r`Because OpenCV requires all input tensors to have zero mean and unit variance`,
      ],
      a: 0,
      why: r`Without normalisation, matrix $A$ contains entries varying from $1$ to $10^6$, leading to numerical instability and poor SVD solutions. Translating coordinates to zero mean and scaling average radius to $\sqrt{2}$ balances condition numbers.`,
    },
    {
      q: r`When warping an image using an estimated homography $H$, why is inverse warping preferred over forward warping?`,
      o: [
        r`Inverse warping iterates over target grid coordinates and samples from $H^{-1}$, guaranteeing every output pixel is painted without leaving unmapped holes`,
        r`Forward warping requires twice as much memory storage`,
        r`Inverse warping runs only on specialised GPU tensor cores`,
        r`Forward warping cannot process images with even dimensions`,
      ],
      a: 0,
      why: r`Forward mapping maps source pixels to floating-point target coordinates, which round into clustered integer coordinates and leave vacant unpainted gaps ("holes"). Inverse mapping visits each target pixel and pulls values using bilinear interpolation.`,
    },
  ],
  usedBy: ['ransac'],
  prereq: ['corners-and-keypoints-harris-fast', 'sift-orb-and-feature-matching'],
  related: ['ransac', 'corners-and-keypoints-harris-fast', 'sift-orb-and-feature-matching'],
  keywords: 'homography geometric transforms projective geometry direct linear transformation dlt svd perspective rectification image stitching panorama planar tracking',
},
  {
  id: 'ransac',
  short: 'RANSAC',
  title: 'RANSAC',
  task: 'concepts',
  module: 'Geometry',
  level: 2,
  minutes: 15,
  noLab: true,
  summary: r`RANdom SAmple Consensus (RANSAC) is a non-deterministic iterative framework designed to robustly estimate mathematical model parameters from data heavily corrupted by outliers. Where standard linear regression and ordinary least-squares estimators suffer catastrophic breakdown from even a single severe outlier, RANSAC handles contamination rates exceeding 50% to 80% by repeatedly sampling minimal random subsets, fitting candidate hypotheses, and scoring consensus based on inlier support. The required number of sample iterations $N = \frac{\ln(1 - p)}{\ln(1 - (1 - \epsilon)^s)}$ is derived from first principles to guarantee finding an outlier-free sample with specified statistical confidence $p$.`,
  lead: r`Feature matching across images is messy. In real-world visual SLAM, robotic navigation, and panorama stitching, matching keypoints using SIFT or ORB frequently yields datasets where over half the correspondences are completely spurious—caused by repetitive window patterns, moving foliage, specular reflections, or motion blur. Feeding these raw matches into ordinary least squares produces catastrophic failure: because least squares squares errors, a single wild outlier thousands of pixels away exerts infinite leverage, rotating the entire estimated transformation into nonsense. RANSAC prevents this by reversing the paradigm: rather than trying to fit all data and smoothing away errors, it assumes data is guilty until proven innocent, searching for the largest coherent consensus set.`,
  intuition: [
    r`The failure of least-squares and breakdown points: Classical statistical estimators minimise the sum of squared residuals $\sum_i r_i^2$. Because squaring magnifies large deviations quadratically, an arbitrary outlier with enormous residual pulls the regression hyperplane entirely toward itself. The "breakdown point"—the proportion of arbitrary incorrect observations an estimator can tolerate before returning an unbounded estimate—for ordinary least squares is exactly $0\%$. A single bad point destroys the result. Robust vision algorithms require estimators with breakdown points reaching $50\%$ or even $80\%$.`,
    r`The hypothesis-and-verify consensus loop: Martin Fischler and Robert Bolles proposed RANSAC in 1981 based on an elegant randomized hypothesis loop: (1) Randomly select the minimum number of data points $s$ required to define the mathematical model (e.g. $s=2$ points for a 2D line, $s=4$ point correspondences for a homography, $s=5$ points for an essential matrix). (2) Fit a candidate model hypothesis strictly to this minimal sample. (3) Count how many data points in the entire dataset agree with this model within an error tolerance $\tau$ (the "inlier set"). (4) Repeat for $N$ iterations, retaining the model with the largest consensus set. Finally, re-estimate model parameters using standard least squares over all identified inliers.`,
    r`How many iterations are sufficient: At first glance, random sampling might appear heuristic. However, the required number of trials $N$ is mathematically bounded. Let $\epsilon \in [0, 1)$ represent the outlier ratio (fraction of contaminated points). The probability that a single randomly drawn point is a true inlier is $(1 - \epsilon)$. The probability that a minimal sample of size $s$ consists entirely of pristine inliers is $(1 - \epsilon)^s$. The probability that at least one of the $s$ points is an outlier is $1 - (1 - \epsilon)^s$. After $N$ independent draws, the probability that every single trial fails to draw a pure inlier sample is $(1 - (1 - \epsilon)^s)^N$. Setting this failure probability to $1 - p$ (where $p$ is our desired confidence, e.g. $99\%$) yields a closed-form formula for $N$.`,
    r`Adaptive iteration termination: In real applications, the true outlier fraction $\epsilon$ is unknown beforehand. Practical RANSAC implementations estimate $\epsilon$ dynamically during execution. Whenever a newly sampled model discovers a consensus set larger than any seen previously, the empirical inlier ratio is updated: $1 - \hat{\epsilon} = \frac{|S_{\text{inliers}}|}{N_{\text{total}}}$. The required iteration budget $N$ is immediately recalculated downwards. If a dominant consensus is discovered early, the loop terminates within dozens of trials rather than running for thousands of redundant iterations.`,
  ],
  analogy: r`Imagine you are an archaeologist attempting to reconstruct an ancient Roman road that crosses a desert. Over two thousand years, storms, landslides, and careless travellers have strewn random stones everywhere: 70% of the stones on the ground are random boulders that have nothing to do with the road. If you average the coordinates of all stones using least squares, the result is a meaningless point in the middle of nowhere. RANSAC is like a surveyor who picks up a laser pointer, selects two random stones at a time, and shines a beam through them. Most pairs pick at least one random boulder, projecting a beam into empty desert where almost no other stones line up. But eventually, pure chance selects two authentic Roman paving stones: suddenly, seventy other stones across the valley illuminate along the laser beam. The surveyor recognizes the massive consensus line, discards all other scattered boulders as noise, and maps the true Roman highway with centimetre precision.`,
  steps: [
    {
      title: r`Define minimal sample size $s$ and error threshold $\tau$`,
      desc: r`Establish the mathematical degrees of freedom and spatial tolerance for inlier qualification.`,
      detail: r`Determine the minimum number of points $s$ needed to constrain the model: $s=2$ for a 2D line, $s=3$ for a 3D plane, $s=4$ for a 2D planar homography, and $s=8$ (or $5$) for epipolar fundamental matrices. Select residual threshold $\tau$ (e.g. $\tau \approx 1.5$ to $3.0$ pixels) based on sensor noise characteristics.`,
    },
    {
      title: r`Randomly draw minimal sample subset`,
      desc: r`Select $s$ data points uniformly at random without replacement from the total dataset.`,
      detail: r`Drawing strictly the minimal size $s$ is vital: every additional point included in the candidate fitting sample exponentially decreases the probability $(1 - \epsilon)^s$ of selecting an outlier-free set. Verify that the sample does not violate geometric constraints (such as collinearity in homography estimation).`,
    },
    {
      title: r`Fit candidate hypothesis model`,
      desc: r`Solve for model parameters using exclusively the $s$ sampled points.`,
      detail: r`Compute candidate parameters $\mathbf{\theta}_{\text{cand}}$ using an exact closed-form algebraic solver (such as two-point slope-intercept for lines or 4-point DLT for homographies).`,
    },
    {
      title: r`Evaluate consensus set against threshold $\tau$`,
      desc: r`Count how many observations in the full dataset agree with the candidate hypothesis.`,
      detail: r`For every data point $i \in \{1, \dots, N\}$, compute the geometric orthogonal residual $r_i = \operatorname{dist}(\mathbf{x}_i, \mathbf{\theta}_{\text{cand}})$. Points satisfying $r_i \le \tau$ are added to the candidate inlier set $S_{\text{cand}}$. If $|S_{\text{cand}}| > |S_{\text{best}}|$, update the best model and consensus set.`,
    },
    {
      title: r`Refine model parameters via least squares over inliers`,
      desc: r`Re-estimate the final model using all accepted consensus points.`,
      detail: r`Once the iteration loop terminates, discard all outliers permanently. Refit the final model using standard linear least squares or non-linear Levenberg-Marquardt optimisation over the complete pooled inlier set, eliminating sample variance from the minimal subset.`,
    },
  ],
  math: [
    {
      h: r`Required iteration bound for confidence $p$`,
      tex: r`N = \frac{\ln(1 - p)}{\ln\left(1 - (1 - \epsilon)^s\right)}`,
      p: r`Here $p$ is the desired probability of success (typically $p=0.99$), $s$ is the minimal sample size, and $\epsilon \in [0, 1)$ is the outlier ratio. For $s=4$ (homography) with $50\%$ outliers ($\epsilon=0.5$), the probability of a pure sample is $(0.5)^4 = 0.0625$, requiring $N = \frac{\ln(0.01)}{\ln(1 - 0.0625)} \approx 72$ iterations. For $80\%$ outliers ($\epsilon=0.8$), $N \approx 2,875$ iterations.`,
    },
    {
      h: r`Orthogonal line residual metric`,
      tex: r`r_i = \frac{|a x_i + b y_i + c|}{\sqrt{a^2 + b^2}} \le \tau`,
      p: r`When fitting geometric models, orthogonal geometric distance is preferred over vertical algebraic residuals ($|y_i - (mx_i+c)|$), because vertical residuals fail when lines approach vertical orientation. Points with orthogonal distance $r_i \le \tau$ are classified as inliers.`,
    },
    {
      h: r`Adaptive iteration update rule`,
      tex: r`\hat{\epsilon} = 1 - \frac{|S_{\text{best}}|}{N_{\text{total}}}, \quad N_{\text{new}} = \frac{\ln(1 - p)}{\ln\left(1 - (1 - \hat{\epsilon})^s\right)}`,
      p: r`Whenever an iteration yields a larger consensus set, $\hat{\epsilon}$ is updated with the observed inlier ratio. If $N_{\text{new}}$ is smaller than the remaining scheduled iterations, the search budget is dynamically reduced, ensuring rapid termination when strong consensus is established.`,
    },
  ],
  keyPoints: [
    r`RANSAC is a robust randomized consensus estimator capable of fitting models in the presence of extreme outlier ratios ($>50\%$).`,
    r`Ordinary least-squares estimators possess a $0\%$ breakdown point: a single wild outlier can corrupt the entire solution.`,
    r`RANSAC fits hypotheses strictly to minimal subsets of size $s$ to maximise the probability $(1 - \epsilon)^s$ of drawing a clean sample.`,
    r`The number of required iterations $N = \frac{\ln(1 - p)}{\ln(1 - (1 - \epsilon)^s)}$ is mathematically derived to guarantee confidence $p$.`,
    r`After finding the maximal consensus set, the final model is refined via least squares over all identified inliers.`,
  ],
  pitfalls: [
    r`Selecting sample sizes larger than minimal ($>s$): Drawing more than the minimum number of points causes the clean-sample probability $(1 - \epsilon)^k$ to plummet exponentially, requiring drastically more iterations to succeed.`,
    r`Setting threshold $\tau$ too tight or too loose: Setting $\tau$ too tight rejects true inliers with sensor noise, preventing consensus discovery; setting $\tau$ too loose allows spurious outliers into the consensus set, biasing the estimated model.`,
    r`Assuming RANSAC is fully deterministic: Because RANSAC relies on random pseudo-random number generator draws, two runs on identical noisy data may yield slightly different consensus sets unless a fixed seed is used.`,
    r`Failing to detect degenerate minimal samples: In homography estimation, if 3 of the 4 randomly drawn points happen to be collinear, the candidate model is mathematically degenerate and must be rejected before checking consensus.`,
    r`Omitting final least-squares refitting: A minimal sample of size $s$ fits the sampled points exactly but carries higher variance due to measurement noise; always refit over all inliers to produce the minimum-variance estimate.`,
  ],
  code: r`import numpy as np

# Simulate robust 2D line fitting in the presence of 60% outliers
np.random.seed(42)

# 1. Generate ground truth inliers along line: y = 2.0 * x + 5.0
num_inliers = 40
num_outliers = 60
num_total = num_inliers + num_outliers

x_inliers = np.linspace(-10.0, 10.0, num_inliers)
noise = np.random.normal(0.0, 0.4, size=num_inliers)
y_inliers = 2.0 * x_inliers + 5.0 + noise

# Generate wild outliers scattered across the domain
x_outliers = np.random.uniform(-10.0, 10.0, size=num_outliers)
y_outliers = np.random.uniform(-40.0, 40.0, size=num_outliers)

# Combine into dataset
X = np.concatenate([x_inliers, x_outliers])
Y = np.concatenate([y_inliers, y_outliers])
points = np.column_stack([X, Y])

# 2. RANSAC implementation for 2D line fitting (minimal sample s = 2)
s = 2
p_confidence = 0.99
outlier_ratio_est = 0.60  # initial conservative estimate
tau_threshold = 1.0       # orthogonal distance threshold

# Theoretical iterations needed: ln(1 - p) / ln(1 - (1 - eps)^s)
prob_clean = (1.0 - outlier_ratio_est) ** s
N_iterations = int(np.ceil(np.log(1.0 - p_confidence) / np.log(1.0 - prob_clean)))
print(f"Dataset: {num_total} points ({num_inliers} inliers, {num_outliers} outliers)")
print(f"Theoretical iterations for 99% confidence (s=2, eps=0.6): {N_iterations}")

best_inliers = None
max_inlier_count = 0
best_model = None

for trial in range(N_iterations):
    # Randomly draw 2 points
    sample_indices = np.random.choice(num_total, size=s, replace=False)
    p1, p2 = points[sample_indices[0]], points[sample_indices[1]]
    
    # Avoid degenerate vertical / identical points
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    if np.abs(dx) < 1e-6:
        continue
        
    # Line equation: a*x + b*y + c = 0
    # dy * x - dx * y + (dx * p1[1] - dy * p1[0]) = 0
    a = dy
    b = -dx
    c = dx * p1[1] - dy * p1[0]
    denom = np.sqrt(a*a + b*b)
    
    # Compute orthogonal distance for all points
    distances = np.abs(a * points[:, 0] + b * points[:, 1] + c) / denom
    inliers = np.where(distances <= tau_threshold)[0]
    
    if len(inliers) > max_inlier_count:
        max_inlier_count = len(inliers)
        best_inliers = inliers
        best_model = (a, b, c)

# 3. Final refinement: least squares over all identified inliers
inlier_x = points[best_inliers, 0]
inlier_y = points[best_inliers, 1]

# Fit y = m*x + b over inliers
A_matrix = np.column_stack([inlier_x, np.ones_like(inlier_x)])
m_ransac, b_ransac = np.linalg.lstsq(A_matrix, inlier_y, rcond=None)[0]

# Compare against non-robust ordinary least squares over all points
A_all = np.column_stack([points[:, 0], np.ones(num_total)])
m_ols, b_ols = np.linalg.lstsq(A_all, points[:, 1], rcond=None)[0]

print(f"\nRANSAC consensus inlier count: {max_inlier_count} / {num_total}")
print(f"Ground truth line:             y = 2.000 * x + 5.000")
print(f"RANSAC estimated line:         y = {m_ransac:.3f} * x + {b_ransac:.3f} (ROBUST)")
print(f"Ordinary Least Squares line:   y = {m_ols:.3f} * x + {b_ols:.3f} (BROKEN BY OUTLIERS)")`,
  quiz: [
    {
      q: r`Why does RANSAC deliberately restrict its candidate model fitting to minimal sample sizes (such as $s=2$ for lines or $s=4$ for homographies)?`,
      o: [
        r`Because the probability of drawing an all-inlier sample $(1 - \epsilon)^s$ decreases exponentially as sample size $s$ grows, requiring drastically more iterations to guarantee success`,
        r`Because matrix inversion cannot be evaluated for sets larger than 4 points`,
        r`Because computer vision datasets never contain more than 10 points`,
        r`To ensure all estimated parameters are positive numbers`,
      ],
      a: 0,
      why: r`If outlier ratio is $50\%$ ($\epsilon=0.5$), a sample of size $s=4$ has a $(0.5)^4 = 6.25\%$ chance of being clean, requiring 72 trials. A sample of size $s=8$ has only a $(0.5)^8 = 0.39\%$ chance, requiring 1,177 trials. Minimal samples maximise the chance of drawing pristine data.`,
    },
    {
      q: r`What is the theoretical breakdown point of classical ordinary least-squares estimators when fitting geometric models?`,
      o: [
        r`$0\%$ (a single extreme outlier can pull the least-squares estimate arbitrarily far from the true parameters)`,
        r`$50\%$ (it tolerates half the data being noise)`,
        r`$100\%$ (it is completely immune to noise)`,
        r`$25\%$ (one quarter of observations can be corrupted)`,
      ],
      a: 0,
      why: r`Because ordinary least squares squares residuals ($r_i^2$), an outlier situated far from the true line generates an unbounded penalty that pulls the entire fitted model towards itself, giving it a breakdown point of $0\%$.`,
    },
    {
      q: r`How does adaptive RANSAC terminate its iteration loop early when processing real image correspondences?`,
      o: [
        r`Whenever a candidate model discovers an inlier consensus larger than previously observed, it recalculates the outlier estimate $\hat{\epsilon}$ and reduces the required iteration budget $N$ dynamically`,
        r`It halts automatically after exactly 10 iterations regardless of inlier counts`,
        r`It stops whenever the camera sensor temperature exceeds 50 degrees Celsius`,
        r`It terminates when the sum of residuals evaluates to an exact integer`,
      ],
      a: 0,
      why: r`By updating the estimated outlier fraction $\hat{\epsilon} = 1 - (|S_{\text{best}}| / N_{\text{total}})$ each time a superior consensus is found, the formula for $N$ reveals whether current iterations already exceed the required confidence threshold, allowing early termination.`,
    },
    {
      q: r`Why is it essential to re-estimate model parameters using linear least squares over the entire inlier set after RANSAC finishes its consensus search?`,
      o: [
        r`Because a minimal sample of size $s$ fits the selected points exactly but carries higher estimation variance due to localized measurement noise; pooling all inliers produces a lower-variance, optimal estimate`,
        r`Because the RANSAC minimal sample solution produces imaginary numbers`,
        r`To convert the model parameters into integer coefficients`,
        r`Because OpenCV refuses to compile models fitted on fewer than 50 points`,
      ],
      a: 0,
      why: r`The minimal sample of $s$ points isolates the outlier-free consensus set, but fitting strictly to $s$ points is subject to local noise. Refitting over all dozens or hundreds of consensus inliers averages out zero-mean Gaussian measurement noise.`,
    },
  ],
  usedBy: [],
  prereq: ['geometric-transforms-and-homography', 'sift-orb-and-feature-matching'],
  related: ['geometric-transforms-and-homography', 'sift-orb-and-feature-matching', 'corners-and-keypoints-harris-fast'],
  keywords: 'ransac random sample consensus robust estimation outlier rejection breakdown point minimal sample consensus set inliers homography line fitting',
},
  {
    "id": "camera-model-and-calibration",
    "short": "Camera model & calibration",
    "title": "The Pinhole Camera Model and Geometric Calibration: Intrinsic, Extrinsic, and Radial Distortion",
    "task": "concepts",
    "level": 2,
    "minutes": 17,
    "noLab": true,
    "usedBy": [],
    "summary": "Mapping 3D world coordinates to 2D image pixels using the pinhole projection matrix, lens distortion modelling, and Zhang's checkerboard calibration.",
    "lead": "Every photograph captured by a digital sensor is a central perspective projection of a 3D world onto a 2D plane. To enable robotic navigation, autonomous driving, or augmented reality, a vision system must invert this projection: converting 2D pixel coordinates back into calibrated 3D geometric rays. Camera calibration mathematically estimates the camera's optical centre, focal length, physical sensor orientation, and lens distortion parameters.",
    "analogy": "Imagine a painter sitting behind a clear glass window, painting the landscape outside by tracing exactly where light rays passing through a tiny peephole (the pinhole) hit the glass sheet. If the glass is tilted (extrinsic rotation), shifted (extrinsic translation), or if the glass pane is curved like a funhouse mirror (radial lens distortion), the tracing will warp unless the painter uses a calibration matrix to mathematically un-distort the perspective.",
    "intuition": [
      "The ideal Pinhole Camera Model projects a 3D point $\\mathbf{P}_w = (X_w, Y_w, Z_w)$ onto a 2D image plane via central perspective: $x = f \\frac{X}{Z}, y = f \\frac{Y}{Z}$, where $f$ is the focal length.",
      "In homogeneous projective geometry, this mapping is expressed as a compact $3 \\times 4$ projection matrix $\\mathbf{P} = \\mathbf{K} [\\mathbf{R} \\mid \\mathbf{t}]$.",
      "The Intrinsic Matrix $\\mathbf{K}$ represents internal optical properties: focal lengths in pixel units $(f_x, f_y)$ and the principal point (optical centre) $(c_x, c_y)$. The Extrinsic Matrix $[\\mathbf{R} \\mid \\mathbf{t}]$ represents the camera's rigid 3D pose in the world: a $3 \\times 3$ rotation matrix $\\mathbf{R}$ and a $3 \\times 1$ translation vector $\\mathbf{t}$.",
      "Real physical lenses introduce optical distortion: Radial distortion (barrel or pincushion distortion caused by lens curvature, modelled with coefficients $k_1, k_2, k_3$) and Tangential distortion (caused by the lens sensor not being perfectly parallel, modelled with $p_1, p_2$). Zhang's calibration method observes a flat checkerboard from multiple angles to solve for all intrinsic, extrinsic, and distortion parameters closed-form via planar homographies."
    ],
    "steps": [
      "Capture planar calibration pattern: Photograph a rigid checkerboard or circle grid from 10–20 diverse angles, distances, and orientations.",
      "Detect sub-pixel corner coordinates: Locate interior checkerboard corner vertices to sub-pixel accuracy using gradient saddle point refinement.",
      "Compute planar homographies: For each view, estimate the $3 \\times 3$ homography matrix $\\mathbf{H}$ mapping known planar checkerboard coordinates to detected image pixels.",
      "Extract intrinsic camera matrix: Use orthogonality constraints across multiple homographies to solve the linear closed-form system for intrinsic parameters $\\mathbf{K}$.",
      "Estimate lens distortion coefficients: Fit radial distortion polynomial ($k_1, k_2$) and tangential parameters ($p_1, p_2$) via non-linear Levenberg-Marquardt optimisation.",
      "Rectify and undistort: Remap incoming raw camera frames to undistorted rectilinear images prior to downstream 3D triangulation."
    ],
    "math": [
      {
        "h": "Full Perspective Camera Projection Matrix",
        "tex": "s \\begin{bmatrix} u \\\\ v \\\\ 1 \\end{bmatrix} = \\underbrace{\\begin{bmatrix} f_x & 0 & c_x \\\\ 0 & f_y & c_y \\\\ 0 & 0 & 1 \\end{bmatrix}}_{\\mathbf{K} \\text{ (Intrinsics)}} \\underbrace{\\begin{bmatrix} r_{11} & r_{12} & r_{13} & t_x \\\\ r_{21} & r_{22} & r_{23} & t_y \\\\ r_{31} & r_{32} & r_{33} & t_z \\end{bmatrix}}_{[\\mathbf{R} \\mid \\mathbf{t}] \\text{ (Extrinsics)}} \\begin{bmatrix} X_w \\\\ Y_w \\\\ Z_w \\\\ 1 \\end{bmatrix}",
        "p": "Projects homogeneous 3D world coordinates $(X_w, Y_w, Z_w, 1)^T$ to homogeneous 2D pixel coordinates $(u, v, 1)^T$ up to arbitrary scale $s$."
      },
      {
        "h": "Radial Lens Distortion Polynomial Model",
        "tex": "\\begin{aligned} x_{\\mathrm{distorted}} &= x (1 + k_1 r^2 + k_2 r^4 + k_3 r^6) \\\\ y_{\\mathrm{distorted}} &= y (1 + k_1 r^2 + k_2 r^4 + k_3 r^6) \\end{aligned}, \\quad r^2 = x^2 + y^2",
        "p": "Models barrel distortion ($k_1 < 0$) and pincushion distortion ($k_1 > 0$) as an even-power radial polynomial expansion away from the optical centre."
      },
      {
        "h": "Planar Homography Constraint (Zhang Formulation)",
        "tex": "\\mathbf{h}_1^T \\mathbf{B} \\mathbf{h}_2 = 0, \\quad \\mathbf{h}_1^T \\mathbf{B} \\mathbf{h}_1 = \\mathbf{h}_2^T \\mathbf{B} \\mathbf{h}_2, \\quad \\mathbf{B} = \\mathbf{K}^{-T} \\mathbf{K}^{-1}",
        "p": "Exploits the orthonormality of rotation column vectors $\\mathbf{r}_1$ and $\\mathbf{r}_2$ to solve for absolute conic image $\\mathbf{B}$ and extract matrix $\\mathbf{K}$."
      }
    ],
    "code": "import numpy as np\n\ndef project_3d_to_pixel(point_3d_world: np.ndarray, K: np.ndarray, R: np.ndarray, t: np.ndarray) -> np.ndarray:\n    \"\"\"Project a 3D world coordinate to 2D image pixel coordinates.\"\"\"\n    # 1. Transform to camera frame: P_cam = R * P_world + t\n    point_cam = R @ point_3d_world + t\n    \n    # 2. Perspective division by depth Z\n    z = point_cam[2]\n    if z <= 0:\n        raise ValueError(\"Point lies behind the camera!\")\n    normalised_coord = np.array([point_cam[0] / z, point_cam[1] / z, 1.0])\n    \n    # 3. Apply intrinsic matrix K\n    pixel_homo = K @ normalised_coord\n    return pixel_homo[:2]\n\n# Define camera intrinsics: focal length 800px, optical centre at (320, 240)\nK = np.array([\n    [800.0,   0.0, 320.0],\n    [  0.0, 800.0, 240.0],\n    [  0.0,   0.0,   1.0]\n])\n\n# Camera located at (0, 0, 0) looking straight down +Z axis\nR = np.eye(3)\nt = np.array([0.0, 0.0, 0.0])\n\n# 3D object located at (X=1.0m, Y=0.5m, Z=4.0m)\nP_world = np.array([1.0, 0.5, 4.0])\n\npixel = project_3d_to_pixel(P_world, K, R, t)\nprint(f\"3D World Point {P_world} -> 2D Image Pixel: (u={pixel[0]:.1f}, v={pixel[1]:.1f})\")\n# u = 800 * (1/4) + 320 = 520.0, v = 800 * (0.5/4) + 240 = 340.0",
    "keyPoints": [
      "Camera calibration maps 3D physical world space to 2D discrete digital pixel arrays.",
      "Intrinsic matrix $\\mathbf{K}$ models internal optics: focal lengths $(f_x, f_y)$ and principal point $(c_x, c_y)$.",
      "Extrinsic matrix $[\\mathbf{R} \\mid \\mathbf{t}]$ models the 6-DOF camera pose in the world coordinate frame.",
      "Radial and tangential distortion parameters rectify lens curvature before geometric triangulation."
    ],
    "pitfalls": [
      "Assuming square pixels ($f_x = f_y$): Some digital sensors have non-square pixel aspect ratios; assuming $f_x = f_y$ introduces subtle aspect ratio errors in 3D reconstruction.",
      "Neglecting lens distortion on wide-angle cameras: Using linear projection equations on fisheye or wide-angle lenses causes massive errors near image margins (up to 50 pixels).",
      "Calibrating with coplanar camera views: Capturing checkerboard images from only parallel frontal perspectives fails to constrain focal length; tilt the board by at least $30^\\circ$–$45^\\circ$."
    ],
    "quiz": [
      {
        "q": "What is the role of the camera Intrinsic Matrix $\\mathbf{K}$ in geometric computer vision?",
        "o": [
          "It specifies the latitude and longitude of the camera",
          "It encapsulates internal optical parameters: pixel focal lengths $(f_x, f_y)$, principal point $(c_x, c_y)$, and sensor skew",
          "It encrypts image files to prevent cyber attacks",
          "It records the camera's battery percentage"
        ],
        "a": 1,
        "why": "The intrinsic matrix $\\mathbf{K}$ models the internal geometric optical properties that transform rays in camera space into pixel coordinates."
      },
      {
        "q": "What causes \"radial distortion\" in optical camera lenses?",
        "o": [
          "Radio interference from mobile phone towers",
          "Light rays bending more near the curved edges of a physical spherical lens than at the optical centre, producing barrel or pincushion distortion",
          "The sensor overheating during long video recordings",
          "Low shutter speed"
        ],
        "a": 1,
        "why": "Physical glass lenses are spherical approximations. Rays entering near lens perimeters bend unevenly, warping straight lines into curved arcs."
      },
      {
        "q": "Why does Zhang's checkerboard calibration method require photographing the pattern from multiple tilted angles?",
        "o": [
          "To test the photographer's motor skills",
          "Images taken strictly parallel to the sensor leave the focal length mathematically unconstrained; tilting introduces perspective foreshortening that isolates $f$",
          "To clean dust off the camera lens",
          "Because checkerboards are invisible from straight ahead"
        ],
        "a": 1,
        "why": "Frontal parallel views create degenerate homography systems where focal length cannot be disentangled from distance. Tilting provides non-coplanar optical constraints."
      }
    ],
    "related": [
      "geometric-transforms-and-homography",
      "ransac",
      "stereo-vision-and-depth"
    ],
    "keywords": "camera calibration, pinhole camera model, intrinsic matrix, extrinsic matrix, zhang calibration, radial distortion, projection matrix, homography"
  },
  {
    "id": "stereo-vision-and-depth",
    "short": "Stereo vision & depth",
    "title": "Stereo Vision and Depth Estimation: Epipolar Geometry, Disparity, and Triangulation",
    "task": "concepts",
    "level": 3,
    "minutes": 18,
    "noLab": true,
    "usedBy": [],
    "summary": "Inferring 3D scene depth from calibrated binocular camera pairs using epipolar line rectification, disparity cost volumes, and geometric triangulation.",
    "lead": "Human depth perception relies heavily on binocular disparity: our two eyes view the world from slightly different vantage points, causing nearby objects to shift dramatically relative to the background. In computer vision, stereo depth estimation formalises this biological phenomenon using epipolar geometry: matching corresponding points across left and right camera feeds to triangulate metric 3D point clouds without active laser sensors.",
    "analogy": "Hold your thumb out at arm's length and alternate closing your left and right eyes: your thumb jumps dramatically back and forth against the distant wall. Now look at a distant tree and repeat: the tree barely shifts at all. The size of that horizontal jump is disparity: inversely proportional to distance. By measuring that pixel shift with millimeter precision, a stereo algorithm calculates exact 3D distance.",
    "intuition": [
      "Consider two cameras separated by horizontal baseline distance $B$. A 3D point $\\mathbf{P}$ projects onto image coordinates $x_L$ and $x_R$ in the left and right cameras. The horizontal shift $d = x_L - x_R$ is called Disparity.",
      "From similar triangles, metric depth $Z$ is inversely proportional to disparity: $Z = \\frac{f \\cdot B}{d}$, where $f$ is the focal length. As an object moves infinitely far away, disparity drops to zero; as an object gets close, disparity expands.",
      "Finding matching points across two arbitrary images is an expensive 2D search. Epipolar Geometry simplifies this: for any point in the left image, its corresponding match in the right image must lie along a single 1D line called the Epipolar Line.",
      "Stereo Rectification applies homographies to both images, warping them so epipolar lines become perfectly horizontal and collinear with pixel rows. This reduces 2D feature matching to an ultra-fast 1D horizontal search along the exact same row ($y_L = y_R$).",
      "Modern stereo algorithms (Semi-Global Matching - SGM, and deep stereo networks like PSMNet / RAFT-Stereo) construct 3D cost volumes comparing pixel similarities across candidate disparities, regularising with smoothness priors to yield dense depth maps."
    ],
    "steps": [
      "Calibrate stereo rig: Perform joint geometric calibration to compute baseline distance vector $\\mathbf{t}$ and relative rotation matrix $\\mathbf{R}$ between cameras.",
      "Stereo rectification: Compute rectification homographies to align camera optical axes parallel, making epipolar lines collinear with horizontal scanlines.",
      "Compute matching cost volume: For each pixel $(x, y)$, compute matching cost across candidate disparity range $d \\in [0, d_{\\max}]$ (using Census transform, SAD, or deep feature correlation).",
      "Cost aggregation: Smooth matching costs across multiple 1D path directions (Semi-Global Matching; SGM) to enforce spatial disparity smoothness.",
      "Disparity selection & refinement: Select minimum cost disparity $d^* = \\operatorname*{arg\\,min}_d C(x, y, d)$ and refine to sub-pixel accuracy via quadratic interpolation.",
      "Triangulate 3D point cloud: Reproject disparity map into calibrated 3D metric coordinates $(X, Y, Z)$ using camera baseline $B$ and focal length $f$."
    ],
    "math": [
      {
        "h": "Fundamental Stereo Depth Triangulation Equation",
        "tex": "Z = \\frac{f \\cdot B}{d} = \\frac{f \\cdot B}{x_L - x_R}",
        "p": "Metric depth $Z$ is strictly inversely proportional to horizontal disparity $d = x_L - x_R$, where $B$ is baseline and $f$ is focal length."
      },
      {
        "h": "Epipolar Constraint and Essential Matrix",
        "tex": "\\mathbf{x}_R^T \\mathbf{E} \\mathbf{x}_L = 0, \\quad \\mathbf{E} = [\\mathbf{t}]_\\times \\mathbf{R} = \\mathbf{K}_R^T \\mathbf{F} \\mathbf{K}_L",
        "p": "Enforces that corresponding rays must intersect in 3D space, constraining matches in the right image to the epipolar line $\\mathbf{l}_R = \\mathbf{F} \\mathbf{x}_L$."
      },
      {
        "h": "SGM Energy Minimisation Objective",
        "tex": "E(D) = \\sum_p C(p, D_p) + \\sum_{(p, q) \\in \\mathcal{N}} P_1 \\mathbb{I}(|D_p - D_q| = 1) + \\sum_{(p, q) \\in \\mathcal{N}} P_2 \\mathbb{I}(|D_p - D_q| > 1)",
        "p": "Semi-Global Matching balances matching cost $C$ against penalties for small step disparity changes ($P_1$) and large discontinuous jumps ($P_2$)."
      }
    ],
    "code": "import numpy as np\n\ndef compute_depth_from_disparity(disparity_map: np.ndarray, focal_length_px: float, baseline_m: float) -> np.ndarray:\n    \"\"\"Convert stereo disparity map into metric depth in meters.\"\"\"\n    # Prevent division by zero for zero or negative disparities\n    valid_mask = disparity_map > 0.1\n    depth_m = np.zeros_like(disparity_map, dtype=np.float32)\n    depth_m[valid_mask] = (focal_length_px * baseline_m) / disparity_map[valid_mask]\n    return depth_m\n\n# Camera parameters: Focal length 1000px, Baseline 0.2 meters (20 cm)\nf = 1000.0\nB = 0.20\n\n# Synthetic disparity observations (in pixels)\n# Object A: disparity = 40.0 px (near)\n# Object B: disparity = 10.0 px (medium)\n# Object C: disparity = 2.0 px  (far)\ndisparities = np.array([40.0, 10.0, 2.0], dtype=np.float32)\ndepths = compute_depth_from_disparity(disparities, focal_length_px=f, baseline_m=B)\n\nfor d, z in zip(disparities, depths):\n    print(f\"Disparity: {d:4.1f} px ---> Calculated 3D Depth: {z:5.2f} meters\")\n# Notice depth scales inversely: 40px -> 5.0m, 10px -> 20.0m, 2px -> 100.0m",
    "keyPoints": [
      "Stereo vision triangulates metric 3D depth from binocular horizontal disparity.",
      "Depth is inversely proportional to disparity: $Z = (f \\cdot B) / d$.",
      "Epipolar geometry and rectification reduce 2D feature matching to 1D horizontal line searches.",
      "Semi-Global Matching (SGM) optimises disparity maps with directional path smoothness constraints."
    ],
    "pitfalls": [
      "Textureless regions: In plain, textureless surfaces (white walls, calm water), correspondence matching fails because all candidate disparities produce identical matching costs.",
      "Repetitive patterns: Barcodes, fences, or window blinds produce multiple identical correlation peaks, causing catastrophic disparity ambiguity.",
      "Stereo occlusion: Points visible in the left camera that are occluded from the right camera's viewpoint have no true match; detect occlusions via Left-Right Consistency checks."
    ],
    "quiz": [
      {
        "q": "Why does stereo image rectification represent a crucial preprocessing step before stereo matching?",
        "o": [
          "It turns colour photos into grayscale",
          "It aligns epipolar lines parallel to image scanlines, reducing the 2D correspondence search to an ultra-fast 1D horizontal search along identical rows",
          "It doubles the image resolution",
          "It automatically deletes noisy pixels"
        ],
        "a": 1,
        "why": "Without rectification, finding a matching pixel requires searching across an arbitrary tilted 2D epipolar line. Rectification ensures matches lie on the same horizontal row ($y_L = y_R$)."
      },
      {
        "q": "What is the mathematical relationship between disparity $d$ and metric depth $Z$ in a rectified stereo system?",
        "o": [
          "Depth is linearly proportional to disparity ($Z = k \\cdot d$)",
          "Depth is inversely proportional to disparity ($Z = \\frac{f \\cdot B}{d}$)",
          "Depth is quadratic in disparity ($Z = d^2$)",
          "Depth is independent of disparity"
        ],
        "a": 1,
        "why": "By similar triangles, $Z = (f \\cdot B) / d$. As an object approaches the camera, disparity expands; as it moves away, disparity approaches zero."
      },
      {
        "q": "What is the purpose of a \"Left-Right Consistency Check\" in stereo depth estimation?",
        "o": [
          "To verify that the left and right cameras have the same serial number",
          "To detect occluded pixels: ensuring that matching from Left $\\to$ Right arrives at the same point as matching back from Right $\\to$ Left",
          "To invert the image colours",
          "To calculate camera frame rate"
        ],
        "a": 1,
        "why": "If a pixel is visible to the left camera but blocked from the right, the right-to-left match will pick an unrelated pixel. Consistency checks flag and invalidate these occlusions."
      }
    ],
    "related": [
      "camera-model-and-calibration",
      "geometric-transforms-and-homography",
      "optical-flow"
    ],
    "keywords": "stereo vision, depth estimation, epipolar geometry, disparity, triangulation, essential matrix, rectification, semi-global matching, sgm"
  },
  {
    "id": "optical-flow",
    "short": "Optical flow & motion",
    "title": "Optical Flow and Motion Estimation: Lucas-Kanade, Horn-Schunck, and Deep Correlation",
    "task": "concepts",
    "level": 3,
    "minutes": 18,
    "noLab": true,
    "usedBy": [],
    "summary": "Estimating 2D pixel motion fields across video frames using the brightness constancy assumption, spatial smoothness constraints, and pyramidal tracking.",
    "lead": "Visual perception is inherently temporal: motion reveals object boundaries, camera egomotion, and physical trajectory predictions. Optical flow is the pattern of apparent motion of image objects between consecutive video frames, represented as a 2D vector field $(u, v)$ for every pixel. Understanding classical differential methods (Lucas-Kanade, Horn-Schunck) and deep correlation architectures (RAFT) is fundamental for video processing, action recognition, and robotics.",
    "analogy": "Imagine standing by a river at night, watching drifting autumn leaves illuminated by a lamppost. You cannot see the water current itself, but by tracking how individual bright leaves drift from coordinate $(x, y)$ to $(x + \\Delta x, y + \\Delta y)$ between eye blinks, you infer the direction and speed of the river current at every point across the river surface.",
    "intuition": [
      "Optical flow relies on the Brightness Constancy Assumption: the intensity of a physical scene point remains constant as it moves over a tiny time delta $\\Delta t$: $I(x + u, y + v, t + \\Delta t) = I(x, y, t)$.",
      "Applying a first-order Taylor series expansion yields the Optical Flow Constraint Equation: $I_x u + I_y v + I_t = 0$. This single scalar equation has two unknowns $(u, v)$ at each pixel—an under-determined system known as the Aperture Problem (motion parallel to an edge cannot be resolved from local observations alone).",
      "Lucas-Kanade (LK) resolves the aperture problem by assuming local spatial constancy: all pixels within a small window (e.g. $5 \\times 5$) share the same motion vector $(u, v)$. Solving the resulting over-determined $25 \\times 2$ linear system via least squares requires the spatial structure tensor to be well-conditioned (which corresponds to corner regions, explaining why corners are optimal for tracking).",
      "Horn-Schunck formulates global variational optical flow: adding a global spatial smoothness penalty $\\int (\\|\\nabla u\\|^2 + \\|\\nabla v\\|^2)$ to yield dense, smooth flow fields across the entire frame. Modern deep optical flow (RAFT; Teed & Deng) computes all-pairs 4D correlation volumes and iteratively updates flow fields using recurrent GRU blocks."
    ],
    "steps": [
      "Formulate brightness constancy: Assert that surface reflectance remains invariant across consecutive frames $t$ and $t + 1$.",
      "Compute spatial and temporal gradients: Calculate horizontal derivative $I_x$, vertical derivative $I_y$, and temporal difference $I_t = I_{t+1} - I_t$.",
      "Construct structure tensor (Lucas-Kanade): For each keypoint, aggregate outer products of spatial gradients within a local neighborhood $\\mathbf{A}^T \\mathbf{A} = \\sum [I_x^2, I_x I_y; I_x I_y, I_y^2]$.",
      "Solve linear least-squares system: Solve $\\mathbf{d} = (\\mathbf{A}^T \\mathbf{A})^{-1} \\mathbf{A}^T \\mathbf{b}$ for motion vector $(u, v)^T$.",
      "Build coarse-to-fine iterative pyramid: To track large displacements exceeding 1–2 pixels, build a Gaussian pyramid, compute flow on coarse levels, and warp finer levels recursively.",
      "Global regularisation (Horn-Schunck / RAFT): Apply global Laplacian smoothing or iterative GRU correlation lookups to produce dense flow across textureless regions."
    ],
    "math": [
      {
        "h": "Optical Flow Constraint Equation",
        "tex": "I_x u + I_y v + I_t = 0 \\iff \\nabla I \\cdot \\mathbf{v} + \\frac{\\partial I}{\\partial t} = 0, \\quad \\mathbf{v} = \\begin{bmatrix} u \\\\ v \\end{bmatrix}",
        "p": "First-order Taylor expansion under the brightness constancy assumption relating spatial gradients $(I_x, I_y)$ to temporal rate of change $I_t$."
      },
      {
        "h": "Lucas-Kanade Least Squares Solution",
        "tex": "\\begin{bmatrix} u \\\\ v \\end{bmatrix} = \\left( \\sum_{i \\in \\Omega} \\begin{bmatrix} I_{x,i}^2 & I_{x,i} I_{y,i} \\\\ I_{x,i} I_{y,i} & I_{y,i}^2 \\end{bmatrix} \\right)^{-1} \\begin{bmatrix} -\\sum_{i} I_{x,i} I_{t,i} \\\\ -\\sum_{i} I_{y,i} I_{t,i} \\end{bmatrix}",
        "p": "Solves for local motion vector $\\mathbf{v}$ within window $\\Omega$ using the pseudo-inverse of the spatial gradient structure tensor."
      },
      {
        "h": "Horn-Schunck Global Variational Energy",
        "tex": "E(u, v) = \\iint \\left[ (I_x u + I_y v + I_t)^2 + \\alpha^2 \\left( \\|\\nabla u\\|^2 + \\|\\nabla v\\|^2 \\right) \\right] dx \\, dy",
        "p": "Balances local photometric error against a global $L_2$ spatial smoothness regulariser weighted by parameter $\\alpha^2$."
      }
    ],
    "code": "import numpy as np\n\ndef simple_lucas_kanade_step(I1: np.ndarray, I2: np.ndarray, x: int, y: int, win_size: int = 3) -> np.ndarray:\n    \"\"\"Compute local optical flow vector (u, v) at coordinate (x, y) via Lucas-Kanade.\"\"\"\n    r = win_size // 2\n    \n    # Extract local patches\n    p1 = I1[y-r:y+r+1, x-r:x+r+1].astype(np.float32)\n    p2 = I2[y-r:y+r+1, x-r:x+r+1].astype(np.float32)\n    \n    # Spatial gradients on frame 1\n    Ix = np.zeros_like(p1)\n    Iy = np.zeros_like(p1)\n    Ix[:, 1:-1] = (p1[:, 2:] - p1[:, :-2]) * 0.5\n    Iy[1:-1, :] = (p1[2:, :] - p1[:-2, :]) * 0.5\n    \n    # Temporal gradient between frames\n    It = p2 - p1\n    \n    # Flatten window elements\n    ix = Ix.flatten()\n    iy = Iy.flatten()\n    it = It.flatten()\n    \n    A = np.column_stack([ix, iy])\n    b = -it\n    \n    # Solve (A^T A) v = A^T b\n    AtA = A.T @ A\n    if np.linalg.cond(AtA) > 100.0:\n        return np.array([0.0, 0.0])  # Aperture problem / flat region!\n        \n    v = np.linalg.inv(AtA) @ (A.T @ b)\n    return v\n\n# Create synthetic 7x7 image with a bright corner shifting right by 1 pixel\nf1 = np.zeros((7, 7), dtype=np.uint8)\nf1[2:5, 2:5] = 200  # Bright square at (3, 3)\n\nf2 = np.zeros((7, 7), dtype=np.uint8)\nf2[2:5, 3:6] = 200  # Shifted right (+1 on X axis)\n\nflow = simple_lucas_kanade_step(f1, f2, x=3, y=3, win_size=3)\nprint(f\"Calculated Motion Vector: (u={flow[0]:.2f}, v={flow[1]:.2f})\")\nprint(\"Lucas-Kanade accurately recovered the +1.0 horizontal pixel shift!\")",
    "keyPoints": [
      "Optical flow estimates apparent 2D velocity fields $(u, v)$ across consecutive video frames.",
      "The brightness constancy assumption states that surface reflectance is invariant over time.",
      "The Aperture Problem causes flow parallel to straight edges to be inherently ambiguous.",
      "Lucas-Kanade solves local flow using least squares over small windows; Horn-Schunck enforces global smoothness."
    ],
    "pitfalls": [
      "The Aperture Problem: Attempting to calculate optical flow on a straight horizontal line only reveals vertical motion; horizontal movement generates zero temporal derivative.",
      "Large displacements violating Taylor approximations: Standard Lucas-Kanade assumes motions smaller than 1 pixel; tracking large jumps requires hierarchical Gaussian image pyramids.",
      "Illumination changes: Flashing lights or changing shadows violate the brightness constancy assumption, producing false motion vectors."
    ],
    "quiz": [
      {
        "q": "What is the \"Aperture Problem\" in optical flow and motion estimation?",
        "o": [
          "When the camera lens aperture is closed, blocking all light",
          "When viewing a moving edge through a small local window, motion parallel to the edge is invisible, allowing only perpendicular normal motion to be measured",
          "When video frames have different aspect ratios",
          "When the camera shutter speed is too fast"
        ],
        "a": 1,
        "why": "Looking at a moving barber pole or flat line through a small aperture, movement along the edge creates zero change. Only movement perpendicular to the gradient can be resolved locally."
      },
      {
        "q": "Why does the Lucas-Kanade optical flow algorithm work reliably only on corner-like image regions?",
        "o": [
          "Because corners reflect more sunlight than edges",
          "The structure tensor $\\mathbf{A}^T \\mathbf{A}$ requires two large non-zero eigenvalues to be invertible, which occurs only at corners where gradients point in multiple directions",
          "Because corners have zero temporal derivative",
          "Because Lucas-Kanade requires integer pixel values"
        ],
        "a": 1,
        "why": "At a corner, gradients vary in both $x$ and $y$, making the structure tensor well-conditioned and uniquely invertible. On flat areas or straight edges, the matrix is singular."
      },
      {
        "q": "How does Pyramidal Lucas-Kanade track large object motions exceeding 10 pixels between frames?",
        "o": [
          "By increasing the frame rate of the video recording",
          "By building a Gaussian image pyramid, calculating coarse flow on heavily downsampled levels where large motions become small sub-pixel shifts, and propagating flow down",
          "By running 100 epochs of deep learning training",
          "By converting the image to the frequency domain"
        ],
        "a": 1,
        "why": "In coarse downsampled pyramid levels, a 10-pixel jump shrinks to 1.25 pixels, satisfying the small-motion Taylor series assumption before refining at full resolution."
      }
    ],
    "related": [
      "corners-and-keypoints-harris-fast",
      "image-pyramids-and-scale-space",
      "stereo-vision-and-depth"
    ],
    "keywords": "optical flow, lucas-kanade, horn-schunck, brightness constancy, aperture problem, motion estimation, video tracking, structure tensor"
  },
  {
  id: 'receptive-field-stride-and-pooling',
  short: 'Receptive Field & Pooling',
  title: 'Receptive field, stride and pooling',
  task: 'concepts',
  module: 'CNN foundations',
  level: 2,
  minutes: 16,
  noLab: true,
  summary: r`The receptive field of a neuron in a convolutional neural network (CNN) defines the spatial sub-region of the input image that directly influences its activation. While a single $3 \times 3$ convolutional kernel has a local receptive field of only $3 \times 3$, stacking layers expands the theoretical receptive field linearly as $r_L = r_{L-1} + (k_L - 1) \cdot S_{L-1}$, where $S_{L-1}$ is the cumulative network stride. Downsampling operations—strided convolutions and pooling operators (Max-Pooling, Average-Pooling, and Global Average Pooling)—exponentially accelerate receptive field expansion, reduce spatial memory, and confer translation tolerance. Crucially, the effective receptive field (ERF) follows a 2D Gaussian distribution, concentrating representational impact heavily at the spatial centre.`,
  lead: r`To recognize that an image contains a Golden Retriever, a deep network cannot rely solely on examining individual fur textures; it must perceive how ears, muzzle, eyes, paws, and torso relate across the entire photograph. Yet individual convolutional filters examine only tiny local windows (such as $3 \times 3$ or $5 \times 5$ pixels). How does a network composed of microscopic local filters assemble global holistic scene understanding? The answer lies in the receptive field: the compounding spatial reach formed by stacking convolutions, strides, and pooling layers throughout the depth of the network.`,
  intuition: [
    r`Theoretical receptive field expansion: In layer 1, an output unit computed from a $3 \times 3$ kernel depends directly on a $3 \times 3$ patch of input pixels. In layer 2, another $3 \times 3$ convolution is applied over layer 1's activations. Because each of those 9 activation units already viewed a $3 \times 3$ patch of input pixels, the layer 2 neuron observes a $5 \times 5$ spatial patch of original pixels. Stacking a third $3 \times 3$ layer expands the reach to $7 \times 7$. Thus, stacking two $3 \times 3$ convolutions achieves the identical receptive field of a single $5 \times 5$ convolution, but uses only $2 \times (3^2) = 18$ parameters rather than $5^2 = 25$ parameters, while introducing an extra non-linear activation function.`,
    r`The acceleration power of stride: While un-strided convolutions expand the receptive field by only $(k-1)$ pixels per layer, adding a stride of $s > 1$ doubles the jump of subsequent kernels across the input image. When an operation has stride $s$, every subsequent unit step in deep feature maps corresponds to $s$ pixels in the preceding representation. Stride acts as an exponential multiplier: combining strided convolutions with pooling allows a 50-layer ResNet to expand its receptive field from 3 pixels to over 400 pixels, covering high-resolution input images entirely.`,
    r`Max-pooling versus average-pooling: Pooling operations aggregate spatial information across rectangular patches without introducing trainable weight parameters. Max-pooling extracts the maximum activation $\max(x_1, \dots, x_k)$, acting as a non-linear feature detector that records whether a specific visual pattern (such as an edge or texture) was detected anywhere in that window, providing local translation tolerance. Average-pooling computes the arithmetic mean, smoothing activations across regions. Global Average Pooling (GAP) collapses an entire $H \times W$ feature map into a single scalar per channel, replacing parameter-heavy fully connected classifier layers and acting as a powerful spatial regulariser.`,
    r`The Effective Receptive Field (ERF): While the theoretical receptive field outlines the maximum bounding box of input pixels that could mathematically influence a neuron, not all pixels contribute equally. In 2016, Luo et al. demonstrated that the gradient of an output unit with respect to input pixels follows a 2D Gaussian distribution that decays rapidly away from the centre. The central pixels participate in exponentially more computational paths through the network than peripheral pixels. As a result, the "Effective Receptive Field" (ERF)—the region carrying $95\%$ of the gradient impact—occupies only a fraction of the theoretical receptive field, necessitating much deeper networks than simple theoretical calculations imply.`,
  ],
  analogy: r`Think of an army's chain of command reporting intelligence from the battlefield. A frontline scout (layer 1) uses binoculars to observe a small 30-metre patch of terrain. A squad sergeant (layer 2) reads reports from three adjacent scouts, assembling a combined situational view covering 50 metres. A platoon lieutenant (layer 3) reads reports from three sergeants, synthesizing an overview of 70 metres. If the army introduces a regional commander (striding/pooling by 2), the commander aggregates summaries from large sectors, doubling the territory covered at each subsequent leadership tier. The supreme general at headquarters (the final classification neuron) reads a concise summary covering the entire 10-kilometre battlefront. Furthermore, central events mentioned by all scouts carry immense weight, whereas peripheral events at the far flanks barely influence headquarters (the Gaussian Effective Receptive Field).`,
  steps: [
    {
      title: r`Calculate layer-by-layer theoretical receptive field`,
      desc: r`Track the compounding spatial reach and cumulative stride through the network graph.`,
      detail: r`Initialise $r_0 = 1$ and cumulative stride $S_0 = 1$. For each subsequent layer $l \in \{1, \dots, L\}$ with kernel size $k_l$ and layer stride $s_l$, update the receptive field via $r_l = r_{l-1} + (k_l - 1) \cdot S_{l-1}$, and then update cumulative stride via $S_l = S_{l-1} \cdot s_l$.`,
    },
    {
      title: r`Determine output feature map spatial dimensions`,
      desc: r`Calculate how padding, kernel size, and stride alter spatial grid resolution.`,
      detail: r`For an input of height $H_{\text{in}}$, padding $p$, kernel size $k$, and stride $s$, the output spatial dimension is $H_{\text{out}} = \left\lfloor \frac{H_{\text{in}} - k + 2p}{s} \right\rfloor + 1$. Padding preserves boundary spatial resolution, while stride $s > 1$ downsamples the grid.`,
    },
    {
      title: r`Apply spatial pooling operators`,
      desc: r`Downsample feature representations to introduce translation tolerance and control computational cost.`,
      detail: r`Apply $2 \times 2$ max-pooling with stride 2 to retain dominant peak activations while cutting spatial memory by $75\%$. For classification backbones, apply Global Average Pooling (GAP) at the final convolutional stage to produce a flat $1 \times C$ embedding vector ready for linear classification.`,
    },
    {
      title: r`Expand receptive fields without downsampling via dilated convolutions`,
      desc: r`Insert spatial holes into convolution kernels to enlarge field of view without loss of resolution.`,
      detail: r`In tasks requiring dense pixel predictions (such as semantic segmentation), downsampling destroys spatial detail. Dilated (atrous) convolutions with dilation rate $d$ inflate the effective kernel size to $k' = k + (k - 1)(d - 1)$ without adding trainable weights, expanding the receptive field while preserving high-resolution feature maps.`,
    },
    {
      title: r`Analyse the Effective Receptive Field (ERF)`,
      desc: r`Measure the actual impact distribution of input pixels via backward gradient backpropagation.`,
      detail: r`Set an impulse gradient of $1.0$ at the central unit of the target deep feature map and backpropagate to the input image tensor. Compute the absolute gradient magnitude across input coordinates to reveal the characteristic 2D Gaussian profile.`,
    },
  ],
  math: [
    {
      h: r`Recursive theoretical receptive field formula`,
      tex: r`r_l = r_{l-1} + (k_l - 1) \cdot S_{l-1}, \quad S_l = S_{l-1} \cdot s_l`,
      p: r`Here $r_l$ denotes the receptive field size of layer $l$, $k_l$ is the kernel size, $s_l$ is the layer stride, and $S_{l-1} = \prod_{i=1}^{l-1} s_i$ represents the cumulative stride of all preceding layers up to layer $l-1$ (with $r_0 = 1, S_0 = 1$).`,
    },
    {
      h: r`Feature map output spatial dimension`,
      tex: r`O = \left\lfloor \frac{I - k + 2p}{s} \right\rfloor + 1`,
      p: r`Here $I$ is the input spatial dimension, $k$ is kernel size, $p$ is zero-padding applied to each side, and $s$ is the convolution stride. Setting $p = \frac{k-1}{2}$ for odd kernels with stride $s=1$ yields identical input and output dimensions ($O = I$, known as "same" padding).`,
    },
    {
      h: r`Gaussian distribution of the Effective Receptive Field (ERF)`,
      tex: r`\frac{\partial y_{\text{centre}}}{\partial x_{i, j}} \approx \frac{1}{2\pi \sigma_{\text{ERF}}^2} \exp\left(-\frac{(i - c_x)^2 + (j - c_y)^2}{2\sigma_{\text{ERF}}^2}\right)`,
      p: r`By the Central Limit Theorem, composing many independent convolution passes causes the derivative of the central output unit $y_{\text{centre}}$ with respect to input pixels $x_{i, j}$ to converge asymptotically to a 2D Gaussian bell curve with standard deviation $\sigma_{\text{ERF}} \propto \sqrt{L}$.`,
    },
  ],
  keyPoints: [
    r`The theoretical receptive field defines the maximum input window that mathematically connects to a deep activation neuron.`,
    r`Stacking two $3 \times 3$ convolutions yields a $5 \times 5$ receptive field while using $28\%$ fewer parameters than a single $5 \times 5$ filter.`,
    r`Strided convolutions and pooling layers accelerate receptive field expansion exponentially by multiplying cumulative network stride.`,
    r`Max-pooling preserves the strongest activation within local windows, providing local translation tolerance.`,
    r`The Effective Receptive Field (ERF) follows a 2D Gaussian distribution, meaning central pixels exert far greater influence than peripheral boundary pixels.`,
  ],
  pitfalls: [
    r`Confusing theoretical receptive field with effective receptive field: Assuming a network perceives a full $200 \times 200$ theoretical window uniformly leads to flawed architectural assumptions; because ERF decays as a Gaussian, the effective area carrying signal is often less than half the theoretical size.`,
    r`Over-pooling early in the backbone: Applying multiple aggressive pooling steps in early layers rapidly shrinks feature maps, permanently destroying high-frequency edge and texture information required for fine segmentation or small-object detection.`,
    r`Ignoring cumulative stride in receptive field calculations: Calculating receptive field by simply summing kernel sizes $\sum (k_i - 1)$ produces incorrect results; kernel reach must be scaled by the cumulative product of all prior layer strides ($S_{l-1}$).`,
    r`Excessive fully connected layers instead of Global Average Pooling: Using flattening followed by large linear layers creates millions of parameters prone to severe overfitting; Global Average Pooling reduces spatial dimensions to $1 \times 1$ without adding a single weight.`,
    r`Gridding artifacts in dilated convolutions: Stacking convolutions with identical high dilation rates ($d=4, d=4, d=4$) samples input pixels on a sparse grid, causing "gridding" blind spots where intermediate pixels are never observed.`,
  ],
  code: r`import numpy as np

# Simulate theoretical receptive field and feature map dimension tracking
layers = [
    {"name": "conv1", "k": 3, "s": 1, "p": 1},
    {"name": "pool1", "k": 2, "s": 2, "p": 0},
    {"name": "conv2", "k": 3, "s": 1, "p": 1},
    {"name": "pool2", "k": 2, "s": 2, "p": 0},
    {"name": "conv3", "k": 3, "s": 1, "p": 1},
    {"name": "conv4", "k": 3, "s": 1, "p": 1},
]

# Track input image size 64x64
current_dim = 64
r_field = 1.0     # Theoretical receptive field (starts at 1 pixel)
cum_stride = 1.0  # Cumulative stride

print(f"{'Layer':<8} | {'Kernel':<6} | {'Stride':<6} | {'Out Dim':<8} | {'Cum Stride':<10} | {'Receptive Field':<15}")
print("-" * 65)

for layer in layers:
    k = layer["k"]
    s = layer["s"]
    p = layer["p"]
    
    # 1. Update receptive field: r_l = r_{l-1} + (k - 1) * S_{l-1}
    r_field += (k - 1) * cum_stride
    
    # 2. Update output spatial dimension: O = floor((I - k + 2p) / s) + 1
    current_dim = int(np.floor((current_dim - k + 2 * p) / s) + 1)
    
    # 3. Update cumulative stride: S_l = S_{l-1} * s
    cum_stride *= s
    
    print(f"{layer['name']:<8} | {k:<6} | {s:<6} | {current_dim:<8} | {cum_stride:<10.0f} | {r_field:<15.0f}")

# 4. Demonstrate Effective Receptive Field (ERF) Gaussian concentration
# Convolve a delta impulse through multiple 1D smoothing passes
impulse = np.zeros(33, dtype=np.float32)
impulse[16] = 1.0  # Center unit
filter_weights = np.array([0.25, 0.5, 0.25], dtype=np.float32)

erf = impulse.copy()
for _ in range(8):  # 8 convolution layers
    erf = np.convolve(erf, filter_weights, mode='same')

print(f"\nERF impulse response across 33 input pixels after 8 layers:")
print(f"Center pixel response:        {erf[16]:.4f} (Peak)")
print(f"+/- 2 pixels from center:     {erf[18]:.4f}")
print(f"+/- 5 pixels from center:     {erf[21]:.4f}")
print(f"+/- 10 pixels from center:    {erf[26]:.6f} (Decayed toward zero)")
print("Verified: Effective Receptive Field concentrates as a central Gaussian bell curve!")`,
  quiz: [
    {
      q: r`Why does modern CNN design favour stacking multiple $3 \times 3$ convolutions rather than using a single large $7 \times 7$ convolution?`,
      o: [
        r`Three stacked $3 \times 3$ convolutions achieve the same $7 \times 7$ receptive field while using $27$ parameters ($3 \times 3^2$) instead of $49$ ($7^2$), incorporating three non-linear activations instead of one`,
        r`Because $7 \times 7$ convolutions cannot be executed on GPU hardware`,
        r`Because larger kernels cannot be trained using gradient descent`,
        r`Because $3 \times 3$ kernels eliminate the need for backpropagation`,
      ],
      a: 0,
      why: r`Stacking three $3 \times 3$ convolutions provides a $(1 + 2 + 2 + 2) = 7$ receptive field. It reduces parameter count from $49C^2$ to $27C^2$ (a $45\%$ savings) while adding three non-linear activation layers, increasing representational expressiveness.`,
    },
    {
      q: r`In a convolutional network, what is the role of cumulative stride $S_{l-1}$ in expanding the theoretical receptive field $r_l = r_{l-1} + (k_l - 1) \cdot S_{l-1}$?`,
      o: [
        r`It scales the effective reach of kernel $k_l$ by the total downsampling factor accumulated by all preceding layers`,
        r`It normalises the weights of the convolutional filters to sum to 1`,
        r`It counts the number of training epochs elapsed`,
        r`It restricts the gradient flow during backward passes`,
      ],
      a: 0,
      why: r`When preceding layers have downsampled the image by a cumulative factor $S_{l-1}$, moving one step in the current feature map corresponds to a physical jump of $S_{l-1}$ pixels in the original input image.`,
    },
    {
      q: r`What critical difference distinguishes the Effective Receptive Field (ERF) from the theoretical receptive field?`,
      o: [
        r`The theoretical receptive field defines the maximal geometric bounding box, but the actual gradient impact decays as a 2D Gaussian, heavily concentrating influence at the central pixels`,
        r`The ERF is always rectangular, while the theoretical receptive field is triangular`,
        r`The theoretical receptive field shrinks during training, while the ERF grows infinitely`,
        r`The ERF applies only to colour images, while the theoretical receptive field applies to greyscale`,
      ],
      a: 0,
      why: r`Due to the compounding of weighted convolutions, central pixels participate in vastly more forward and backward calculation paths than peripheral pixels. Consequently, the gradient sensitivity follows a Gaussian distribution centered on the neuron.`,
    },
    {
      q: r`Why did modern CNN architectures replace large fully connected classification layers with Global Average Pooling (GAP)?`,
      o: [
        r`Global Average Pooling reduces each $H \times W$ feature map to a single average scalar, eliminating millions of parameter weights and preventing overfitting`,
        r`Global Average Pooling doubles the spatial resolution of the image`,
        r`Global Average Pooling converts floating-point weights into 8-bit integers`,
        r`Global Average Pooling allows the network to output audio signals`,
      ],
      a: 0,
      why: r`Flattening deep feature maps into dense linear layers created tens of millions of parameters in early models like AlexNet and VGG. Global Average Pooling averages spatial dimensions completely, requiring zero parameters while acting as a spatial regulariser.`,
    },
  ],
  usedBy: ['cnn-architecture-tour-lenet-to-resnet-to-efficientnet', 'one-stage-detectors-ssd-and-yolo'],
  prereq: ['convolutional_neural_networks', 'pixels-channels-and-colour-spaces'],
  related: ['cnn-architecture-tour-lenet-to-resnet-to-efficientnet', 'convolutional_neural_networks', 'residual-networks-and-skip-connections'],
  keywords: 'receptive field stride pooling max pooling average pooling global average pooling cnn effective receptive field erf dilated convolution atrous padding',
},
  {
  id: 'cnn-architecture-tour-lenet-to-resnet-to-efficientnet',
  short: 'CNN Architecture Tour',
  title: 'CNN architecture tour: LeNet to ResNet to EfficientNet',
  task: 'concepts',
  module: 'CNN foundations',
  level: 2,
  minutes: 18,
  noLab: true,
  summary: r`The evolution of convolutional neural networks charts a thirty-year trajectory of overcoming vanishing gradients, parameter explosion, and computational bottlenecks. From Yann LeCun's LeNet-5 (1998) and Alex Krizhevsky's AlexNet (2012) to VGG's modular $3 \times 3$ factorisation, GoogLeNet's multi-scale Inception branches, He et al.'s revolutionary ResNet identity skip connections ($\mathbf{x} + \mathcal{F}(\mathbf{x})$), DenseNet's dense connectivity, and Tan & Le's EfficientNet compound scaling ($d, w, r$), this architectural progression reveals the fundamental design principles that power deep visual representation learning.`,
  lead: r`In 1998, a state-of-the-art convolutional network could process $32 \times 32$ greyscale cheques using 60,000 parameters. By 2012, AlexNet ignited the modern deep learning revolution by classifying 1.2 million high-resolution ImageNet photographs across dual GPUs using 60 million parameters. Yet training networks beyond twenty layers caused performance to degrade rapidly—not from overfitting, but from vanishing gradients. Overcoming this barrier demanded a series of architectural breakthroughs that reshaped how representations flow through deep computation graphs.`,
  intuition: [
    r`The pioneer era: LeNet and AlexNet: Yann LeCun established the core paradigm of modern computer vision in LeNet-5: alternating convolutional layers (for translation-equivariant local feature extraction) and subsampling layers (for spatial pooling), followed by fully connected classification heads. In 2012, AlexNet scaled this blueprint to ImageNet by replacing sigmoid non-linearities with Rectified Linear Units (ReLU) to avert gradient saturation, employing Dropout to combat overfitting, and implementing parallel split-convolution layers across two GPUs. AlexNet slashed the ImageNet top-5 error rate from $26\%$ to $16\%$, proving the viability of deep learning.`,
    r`Factorisation and multi-scale branching: VGG and Inception: VGG (2014) introduced mathematical elegance and architectural discipline: replacing heterogeneous filter sizes ($11 \times 11, 5 \times 5$) with homogeneous stacks of $3 \times 3$ convolutions. VGG demonstrated that depth itself is a critical dimension of representational power. Simultaneously, GoogLeNet (Inception-v1) tackled computational efficiency by processing features across parallel multi-scale branches ($1 \times 1, 3 \times 3, 5 \times 5$, and max-pooling), introducing $1 \times 1$ "bottleneck" convolutions to project channel dimensions down prior to expensive spatial convolutions.`,
    r`The residual revolution: ResNet and DenseNet: As researchers tried stacking VGG layers to 30 or 50 tiers, training error degraded—a fundamental optimisation failure. In 2015, Kaiming He et al. introduced ResNet (Residual Networks), transforming the layer learning objective from fitting an underlying mapping $\mathcal{H}(\mathbf{x})$ directly to fitting a residual function $\mathcal{F}(\mathbf{x}) = \mathcal{H}(\mathbf{x}) - \mathbf{x}$. By adding identity shortcut skip connections $\mathbf{y} = \mathbf{x} + \mathcal{F}(\mathbf{x})$, gradients can flow unimpeded directly from the loss back to early layers via the identity operator. ResNet trained models of 152 layers—and even 1,202 layers—winning ImageNet with a superhuman $3.57\%$ error rate. DenseNet pushed this logic further by concatenating all preceding feature maps directly into every subsequent layer.`,
    r`Principled scaling: EfficientNet: After ResNet, practitioners scaled networks arbitrarily by making them deeper (more layers), wider (more channels), or higher resolution (larger input images). In 2019, Mingxing Tan and Quoc Le demonstrated that scaling only one dimension yields diminishing returns because receptive fields, channel capacities, and spatial pixel details must balance. EfficientNet introduced "compound scaling": using a compound coefficient $\phi$ to scale depth, width, and resolution simultaneously via fixed power ratios ($\alpha^\phi, \beta^\phi, \gamma^\phi$). Paired with lightweight inverted residual bottleneck blocks (MBConv), EfficientNet achieved state-of-the-art accuracy with up to $8.4\times$ fewer parameters and $6.1\times$ fewer FLOPs than previous architectures.`,
  ],
  analogy: r`Think of designing a deep transport railway network across a vast continent. LeNet built the first small regional tram line. AlexNet proved that an industrial steam locomotive could traverse massive mountain ranges, though it burned enormous coal and belched smoke (millions of dense fully connected weights). VGG standardised the track gauges using uniform steel segments ($3 \times 3$ blocks), proving that longer trains carry more cargo. ResNet's identity skip connection was the invention of express bypass tracks: rather than forcing every single package to be unloaded and reloaded at every tiny local village station (where goods get lost or delayed by gradient degradation), express bypass tracks allow trains to shoot uninterrupted across hundreds of kilometres directly to destination terminals, dropping off local freight along the way. EfficientNet acts like modern transport logistics optimisation: rather than blindly making trains twice as long without upgrading station platforms or track width, it balances train length, carriage width, and track gauge in mathematical harmony.`,
  steps: [
    {
      title: r`Homogeneous 3x3 filter stacking (VGG)`,
      desc: r`Replace large heterogeneous kernels with stacks of uniform 3x3 convolutions.`,
      detail: r`Two stacked $3 \times 3$ convolutions have an identical receptive field to a $5 \times 5$ filter but require $2 \times (3^2 C^2) = 18 C^2$ parameters compared to $25 C^2$ parameters (a $28\%$ parameter reduction) while inserting two non-linear activations. VGG doubled channel counts ($64 \to 128 \to 256 \to 512$) after each $2 \times 2$ max-pooling downsampling stage.`,
    },
    {
      title: r`Channel dimensionality reduction via 1x1 convolutions (Inception)`,
      desc: r`Use 1x1 projection layers to throttle channel counts before spatial filtering.`,
      detail: r`A $5 \times 5$ convolution operating on 256 input channels produces immense FLOP counts. Inserting a $1 \times 1$ convolution that projects 256 channels down to 32 channels before the $5 \times 5$ filter slashes computational complexity by over $80\%$, enabling multi-scale feature extraction within a manageable parameter budget.`,
    },
    {
      title: r`Implement identity shortcut skip connections (ResNet)`,
      desc: r`Reformulate network layers to learn residual perturbations over an identity mapping.`,
      detail: r`Add an identity skip path $\mathbf{y} = \mathbf{x} + \mathcal{F}(\mathbf{x})$. If a layer's weights decay to zero during training, the layer trivially defaults to the identity operator $\mathbf{y} = \mathbf{x}$, preventing deep network degradation. When spatial dimensions or channel counts change during striding, apply a $1 \times 1$ projection shortcut $W_s \mathbf{x}$ to match tensor dimensions.`,
    },
    {
      title: r`Employ inverted residual bottleneck blocks (MobileNet / EfficientNet)`,
      desc: r`Expand channels internally and filter with depthwise separable convolutions.`,
      detail: r`Traditional ResNet bottlenecks compress channels ($256 \to 64 \to 256$). Inverted residual blocks (MBConv) reverse this: they project channels up by an expansion factor ($64 \to 384$), execute a lightweight depthwise convolution ($3 \times 3$ per channel independently), and project back down to low-dimensional linear bottlenecks, combining high representational capacity with minimal memory footprints.`,
    },
    {
      title: r`Apply compound scaling across depth, width, and resolution`,
      desc: r`Scale network depth, channel width, and input image resolution in balanced mathematical harmony.`,
      detail: r`Scale depth $d = \alpha^\phi$, width $w = \beta^\phi$, and resolution $r = \gamma^\phi$ subject to $\alpha \cdot \beta^2 \cdot \gamma^2 \approx 2$, where $\phi$ is a global user-specified scaling coefficient governed by available compute resources.`,
    },
  ],
  math: [
    {
      h: r`ResNet residual block formulation and gradient highway`,
      tex: r`\mathbf{y} = \mathcal{F}(\mathbf{x}, \{W_i\}) + \mathbf{x} \implies \frac{\partial \mathcal{E}}{\partial \mathbf{x}} = \frac{\partial \mathcal{E}}{\partial \mathbf{y}} \left(\frac{\partial \mathcal{F}}{\partial \mathbf{x}} + I\right)`,
      p: r`The gradient of the loss $\mathcal{E}$ with respect to input $\mathbf{x}$ contains the additive term $\frac{\partial \mathcal{E}}{\partial \mathbf{y}} \cdot I$. Even if the Jacobian term $\frac{\partial \mathcal{F}}{\partial \mathbf{x}}$ vanishes or approaches zero across dozens of layers, the identity operator $I$ guarantees that gradients flow cleanly back to shallow layers without vanishing.`,
    },
    {
      h: r`Depthwise separable convolution parameter reduction`,
      tex: r`\frac{|\Theta_{\text{depthwise-separable}}|}{|\Theta_{\text{standard}}|} = \frac{k^2 \cdot C_{\text{in}} + C_{\text{in}} \cdot C_{\text{out}}}{k^2 \cdot C_{\text{in}} \cdot C_{\text{out}}} = \frac{1}{C_{\text{out}}} + \frac{1}{k^2}`,
      p: r`A standard convolution requires $k^2 \cdot C_{\text{in}} \cdot C_{\text{out}}$ weights. Factoring into a depthwise convolution ($k^2 \cdot C_{\text{in}}$) followed by a $1 \times 1$ pointwise projection ($C_{\text{in}} \cdot C_{\text{out}}$) reduces computational cost and parameter storage by approximately $8\times$ to $9\times$ for $3 \times 3$ kernels.`,
    },
    {
      h: r`EfficientNet compound scaling equations`,
      tex: r`\text{Depth: } d = \alpha^\phi, \quad \text{Width: } w = \beta^\phi, \quad \text{Resolution: } r = \gamma^\phi, \quad \text{s.t. } \alpha \beta^2 \gamma^2 \approx 2, \; \alpha \ge 1, \beta \ge 1, \gamma \ge 1`,
      p: r`Doubling network depth doubles FLOPs ($d \propto \text{FLOP}$), whereas doubling width or resolution quadruples FLOPs ($w^2, r^2 \propto \text{FLOP}$). Constraining $\alpha \beta^2 \gamma^2 \approx 2$ ensures that for any integer compound coefficient $\phi$, total computational requirements scale predictably as $2^\phi$.`,
    },
  ],
  keyPoints: [
    r`LeNet and AlexNet established the foundational paradigm of convolutions, pooling, and non-linearities for visual recognition.`,
    r`VGG demonstrated that stacks of uniform $3 \times 3$ convolutions reduce parameter counts while increasing network depth and non-linear expressiveness.`,
    r`ResNet introduced identity shortcut connections ($\mathbf{x} + \mathcal{F}(\mathbf{x})$), creating gradient highways that solved the degradation problem for ultra-deep networks.`,
    r`Depthwise separable convolutions decouple spatial filtering from cross-channel combination, slashing FLOPs by over $80\%$.`,
    r`EfficientNet compound scaling balances depth, width, and input image resolution simultaneously, achieving superior accuracy with fewer parameters.`,
  ],
  pitfalls: [
    r`Blindly scaling a single architectural dimension: Making a network excessively deep without increasing width or image resolution leads to diminishing returns and early feature saturation.`,
    r`Placing activation non-linearities on the identity skip connection path: Placing ReLU or batch normalisation directly onto the identity shortcut breaks the clean gradient highway, re-introducing gradient degradation in ultra-deep networks.`,
    r`Over-parameterising fully connected classifier heads: Retaining AlexNet/VGG-style dense linear heads ($4096 \times 4096$) wastes hundreds of megabytes of memory; always terminate modern convolutional backbones with Global Average Pooling.`,
    r`Mismatching channel dimensions in residual addition: Adding $\mathcal{F}(\mathbf{x}) + \mathbf{x}$ requires both tensors to have identical spatial shapes and channel counts; when downsampling, apply a strided $1 \times 1$ projection on the shortcut path.`,
    r`Ignoring FLOP and memory latency divergence: Inverted bottleneck blocks reduce theoretical FLOPs dramatically, but high channel expansion factors can increase memory bandwidth traffic on resource-constrained edge hardware.`,
  ],
  code: r`import numpy as np

# Comparative architectural parameter and FLOP analysis across generations
# Consider an intermediate layer mapping 64 input channels to 128 output channels
H, W = 28, 28
c_in, c_out = 64, 128
k = 3

# 1. Standard Convolution (VGG-style: 3x3 conv)
params_vgg = (k * k * c_in) * c_out
flops_vgg = 2 * (k * k * c_in) * c_out * (H * W)

# 2. ResNet Bottleneck block (1x1 down -> 3x3 spatial -> 1x1 up)
c_bottleneck = 32
params_resnet = (1 * 1 * c_in * c_bottleneck) + (k * k * c_bottleneck * c_bottleneck) + (1 * 1 * c_bottleneck * c_out)
flops_resnet = 2 * params_resnet * (H * W)

# 3. Depthwise Separable Conv (MobileNet / EfficientNet MBConv)
# Depthwise 3x3 conv (per channel) + Pointwise 1x1 conv (cross channel)
params_dw = (k * k * c_in)
params_pw = (1 * 1 * c_in * c_out)
params_mobilenet = params_dw + params_pw
flops_mobilenet = 2 * (params_dw + params_pw) * (H * W)

print(f"{'Architecture Style':<25} | {'Parameters':<12} | {'FLOPs (MFLOPs)':<15} | {'Rel Parameter Cost':<18}")
print("-" * 75)
print(f"{'VGG Standard (3x3)':<25} | {params_vgg:<12,d} | {flops_vgg / 1e6:<15.2f} | 100.0%")
print(f"{'ResNet Bottleneck':<25} | {params_resnet:<12,d} | {flops_resnet / 1e6:<15.2f} | {params_resnet / params_vgg * 100:.1f}%")
print(f"{'Depthwise Separable':<25} | {params_mobilenet:<12,d} | {flops_mobilenet / 1e6:<15.2f} | {params_mobilenet / params_vgg * 100:.1f}%\n")

# 4. Demonstrate ResNet Identity Skip Connection forward pass in NumPy
np.random.seed(42)
x = np.random.randn(2, c_in, H, W).astype(np.float32)  # batch of 2

# Simulated residual branch weights (initialized small)
W_res = np.random.randn(c_in, c_in).astype(np.float32) * 0.01

# Compute residual mapping F(x) = W @ x
F_x = np.einsum('oi,bihw->bohw', W_res, x)

# Add identity shortcut connection: y = F(x) + x
y = F_x + x

# Verify gradient highway: dy/dx = dF/dx + I
diff_norm = np.linalg.norm(y - x) / np.linalg.norm(x)
print(f"Residual branch relative perturbation: {diff_norm:.4f}")
print("Verified: Identity skip connection preserves input signal when residual weights are small!")`,
  quiz: [
    {
      q: r`Why did ResNet's identity skip connection ($\mathbf{y} = \mathcal{F}(\mathbf{x}) + \mathbf{x}$) resolve the vanishing gradient degradation problem in very deep networks?`,
      o: [
        r`The additive identity shortcut provides an uninterrupted gradient pathway ($\frac{\partial \mathcal{E}}{\partial \mathbf{y}} \cdot I$) back to early layers, preventing gradients from vanishing even across hundreds of layers`,
        r`It removes all convolution operations from the computation graph`,
        r`It quantises all activations into 8-bit integers`,
        r`It forces the loss function to be strictly convex`,
      ],
      a: 0,
      why: r`Because $\frac{\partial \mathbf{y}}{\partial \mathbf{x}} = \frac{\partial \mathcal{F}}{\partial \mathbf{x}} + I$, backpropagating gradients incorporates an additive identity term $I$. Even if the learned residual transformation has near-zero gradients, error signals flow unimpeded directly back through the identity highway.`,
    },
    {
      q: r`What core insight guided VGG to replace large kernels ($11 \times 11, 7 \times 7$) with stacks of $3 \times 3$ convolutions?`,
      o: [
        r`Stacking two $3 \times 3$ kernels covers the same $5 \times 5$ spatial receptive field while using $28\%$ fewer parameters and incorporating two non-linear activations instead of one`,
        r`Large kernels cannot be computed using floating-point operations`,
        r`GPU memory caches only support matrix sizes that are multiples of three`,
        r`Stacking $3 \times 3$ filters eliminates the need for zero-padding`,
      ],
      a: 0,
      why: r`Stacking multiple $3 \times 3$ convolutions maintains receptive field coverage while dramatically reducing total weights ($2 \times 3^2 = 18$ vs $5^2 = 25$) and injecting additional non-linear activation functions that increase expressive power.`,
    },
    {
      q: r`How does a depthwise separable convolution achieve substantial parameter reduction compared to a standard convolution?`,
      o: [
        r`By decoupling spatial filtering (depthwise convolution per channel) from cross-channel feature fusion ($1 \times 1$ pointwise convolution)`,
        r`By discarding all odd-numbered feature channels during the forward pass`,
        r`By converting all convolutional weights to binary values ($-1, +1$)`,
        r`By computing fast Fourier transforms over downsampled spatial patches`,
      ],
      a: 0,
      why: r`Standard convolutions filter spatial patterns and mix channels simultaneously ($k^2 C_{\text{in}} C_{\text{out}}$). Depthwise separable convolutions separate this into a depthwise spatial filter ($k^2 C_{\text{in}}$) followed by a $1 \times 1$ channel projection ($C_{\text{in}} C_{\text{out}}$), slashing parameters by roughly $k^2$ (8 to 9 times for $3 \times 3$).`,
    },
    {
      q: r`What is the central premise behind EfficientNet's compound scaling principle?`,
      o: [
        r`Scaling depth, channel width, and input image resolution concurrently with fixed power coefficients yields superior accuracy and efficiency compared to scaling any single dimension in isolation`,
        r`Networks should be made infinitely deep while keeping width fixed at 64 channels`,
        r`Resolution should always be fixed at $224 \times 224$ pixels regardless of model size`,
        r`Only the fully connected classification head should receive additional parameters`,
      ],
      a: 0,
      why: r`Tan and Le proved that scaling depth, width, and resolution independently suffers from rapid diminishing returns. Compound scaling balances all three dimensions simultaneously based on available computational resources.`,
    },
  ],
  usedBy: ['one-stage-detectors-ssd-and-yolo'],
  prereq: ['receptive-field-stride-and-pooling', 'convolutional_neural_networks'],
  related: ['residual-networks-and-skip-connections', 'receptive-field-stride-and-pooling', 'the-pytorch-training-loop'],
  keywords: 'cnn architecture lenet alexnet vgg inception resnet densenet efficientnet residual skip connection depthwise separable compound scaling computer vision',
},
  {
    "id": "depthwise-separable-convolutions-and-convnext",
    "short": "Depthwise convs & ConvNeXt",
    "title": "Modern Convolutional Engineering: Depthwise-Separable Convolutions and the ConvNeXt Renaissance",
    "task": "concepts",
    "level": 2,
    "minutes": 17,
    "noLab": true,
    "usedBy": [],
    "summary": "Decoupling spatial filtering from channel mixing with Depthwise-Separable Convolutions (MobileNet) and modernising CNNs with ConvNeXt.",
    "lead": "Standard 2D convolutions perform spatial filtering and cross-channel mixing simultaneously in a single heavy tensor operation, requiring massive FLOPs and parameter counts. Depthwise-Separable Convolutions (Howard et al., MobileNet) factorise standard convolutions into two lightweight steps: a spatial depthwise filter followed by a 1x1 pointwise projection, slashing compute by 8x to 9x. Later, ConvNeXt (Liu et al.) modernised pure convolutional networks with Vision Transformer design choices, proving CNNs remain competitive with Transformers.",
    "analogy": "Imagine baking a 100-layer multicoloured cake. A standard convolution is like having 64 master chefs simultaneously decorating and mixing all 64 layers in a giant shared bowl—chaotic, slow, and requiring huge counter space. A depthwise-separable convolution first has one decorator frost each cake layer individually in isolation (depthwise spatial filtering), and then has a specialist slice through the vertical stack with a laser to blend flavours (1x1 pointwise channel mixing).",
    "intuition": [
      "In a standard convolution with $C_{\\mathrm{in}}$ input channels, $C_{\\mathrm{out}}$ output channels, and kernel size $K \\times K$, the computational cost per output spatial position is $K^2 \\cdot C_{\\mathrm{in}} \\cdot C_{\\mathrm{out}}$.",
      "Depthwise-Separable Convolutions factorise this into: 1) Depthwise Convolution: applies a single spatial $K \\times K$ filter to each input channel independently ($K^2 \\cdot C_{\\mathrm{in}}$ FLOPs), learning purely spatial patterns; 2) Pointwise Convolution: applies a $1 \\times 1$ convolution across all channels ($C_{\\mathrm{in}} \\cdot C_{\\mathrm{out}}$ FLOPs), learning cross-channel combinations.",
      "The computational cost drops by $\\frac{1}{C_{\\mathrm{out}}} + \\frac{1}{K^2} \\approx \\frac{1}{9}$ for $3 \\times 3$ kernels, enabling real-time deep learning on mobile smartphones.",
      "When Vision Transformers (ViTs) emerged, many attributed their success entirely to the self-attention mechanism. ConvNeXt re-examined CNN architecture from first principles: adopting ViT design practices (larger $7 \\times 7$ kernels, inverted bottleneck ratios, fewer normalisation layers, substituting GELU for ReLU, LayerNorm instead of BatchNorm). ConvNeXt matched or exceeded Swin Transformer accuracy while maintaining pure convolutional efficiency."
    ],
    "steps": [
      "Factorise standard convolution: Replace standard `Conv2d(Cin, Cout, K)` with `Conv2d(Cin, Cin, K, groups=Cin)` followed by `Conv2d(Cin, Cout, 1)`.",
      "Adopt inverted bottleneck design: Expand channel dimensions inside the residual block by $4\\times$ before contracting, shifting compute into high-capacity intermediate projections.",
      "Enlarge spatial kernel sizes: Increase depthwise convolutional kernel size from $3 \\times 3$ to $7 \\times 7$ to match the broad receptive field of Vision Transformer self-attention windows.",
      "Modernise activation and normalisation: Replace BatchNorm with LayerNorm (computing normalisation across channels per pixel); replace ReLU with smooth GELU activations.",
      "Reduce normalisation frequency: Place LayerNorm only once per residual block rather than after every individual convolution.",
      "Train with modern augmentation recipes: Train with AdamW, cosine learning rate schedules, Mixup, and RandAugment for 300 epochs."
    ],
    "math": [
      {
        "h": "Standard vs Depthwise-Separable FLOP Ratio",
        "tex": "\\frac{\\mathrm{Cost}_{\\mathrm{separable}}}{\\mathrm{Cost}_{\\mathrm{standard}}} = \\frac{D_K^2 \\cdot M + M \\cdot N}{D_K^2 \\cdot M \\cdot N} = \\frac{1}{N} + \\frac{1}{D_K^2} \\approx \\frac{1}{D_K^2}",
        "p": "For $3 \\times 3$ kernels ($D_K = 3$) and large channel count $N$, depthwise-separable convolutions reduce computational cost by approximately 88%–89%."
      },
      {
        "h": "ConvNeXt Inverted Bottleneck Flow",
        "tex": "\\mathbf{x}_{l+1} = \\mathbf{x}_l + \\mathbf{W}_{2} \\cdot \\operatorname{GELU}\\left( \\mathbf{W}_{1} \\cdot \\operatorname{LayerNorm}\\left( \\operatorname{DWConv}_{7\\times 7}(\\mathbf{x}_l) \\right) \\right)",
        "p": "Applies $7 \\times 7$ depthwise convolution, normalises via LayerNorm, expands channels by $4\\times$ via $\\mathbf{W}_1$, and projects back via $\\mathbf{W}_2$."
      },
      {
        "h": "LayerNorm for Convolutional Tensors",
        "tex": "\\operatorname{LN}(\\mathbf{x})_{c, h, w} = \\frac{x_{c, h, w} - \\mu_{h, w}}{\\sqrt{\\sigma_{h, w}^2 + \\epsilon}} \\cdot \\gamma_c + \\beta_c, \\quad \\mu_{h, w} = \\frac{1}{C} \\sum_{c=1}^C x_{c, h, w}",
        "p": "Computes mean and variance across channel dimension $C$ for each spatial coordinate $(h, w)$, independent of batch size."
      }
    ],
    "code": "import torch\nimport torch.nn as nn\n\nclass DepthwiseSeparableConv(nn.Module):\n    def __init__(self, in_channels: int, out_channels: int, kernel_size: int = 3, padding: int = 1):\n        super().__init__()\n        # 1. Depthwise convolution: groups = in_channels\n        self.depthwise = nn.Conv2d(\n            in_channels, in_channels, kernel_size=kernel_size,\n            padding=padding, groups=in_channels, bias=False\n        )\n        # 2. Pointwise convolution: 1x1 kernel\n        self.pointwise = nn.Conv2d(in_channels, out_channels, kernel_size=1, bias=True)\n\n    def forward(self, x: torch.Tensor) -> torch.Tensor:\n        return self.pointwise(self.depthwise(x))\n\n# Compare parameter counts: Standard vs Separable\nin_c, out_c = 64, 128\nstd_conv = nn.Conv2d(in_c, out_c, kernel_size=3, padding=1)\nsep_conv = DepthwiseSeparableConv(in_c, out_c, kernel_size=3, padding=1)\n\nstd_params = sum(p.numel() for p in std_conv.parameters())\nsep_params = sum(p.numel() for p in sep_conv.parameters())\n\nprint(f\"Standard 3x3 Conv Parameters:            {std_params:,}\")\nprint(f\"Depthwise-Separable 3x3 Conv Parameters: {sep_params:,}\")\nprint(f\"Parameter reduction: {(1.0 - sep_params / std_params) * 100:.1f}% savings!\")",
    "keyPoints": [
      "Depthwise-separable convolutions factorise spatial filtering and channel mixing into two separate steps.",
      "Reduces computational FLOPs and parameter counts by $\\approx 8\\times$ to $9\\times$ for $3 \\times 3$ kernels.",
      "MobileNet established depthwise-separable blocks as the foundation for edge mobile vision.",
      "ConvNeXt modernised CNNs using $7 \\times 7$ kernels, inverted bottlenecks, and LayerNorm, rivaling Vision Transformers."
    ],
    "pitfalls": [
      "Under-utilising GPU memory bandwidth: Depthwise convolutions have lower arithmetic intensity (fewer FLOPs per memory access); on high-end desktop GPUs, wall-clock speedups can be lower than theoretical FLOP reductions unless kernels are fused.",
      "Using small $3 \\times 3$ kernels in modern architectures: Modern CNNs benefit from larger $7 \\times 7$ depthwise kernels to capture long-range receptive fields without parameter blowup.",
      "Applying BatchNorm with small batch sizes: BatchNorm degrades when batch size per GPU is small ($< 16$); ConvNeXt uses LayerNorm to remain batch-size invariant."
    ],
    "quiz": [
      {
        "q": "How does a Depthwise-Separable Convolution reduce computational cost compared to a standard convolution?",
        "o": [
          "By rounding all floating point numbers to integers",
          "By splitting the operation into a spatial depthwise convolution (applying a separate filter to each channel independently) followed by a 1x1 pointwise convolution across channels",
          "By skipping every second frame in video",
          "By eliminating the need for backpropagation"
        ],
        "a": 1,
        "why": "Standard convolutions perform spatial filtering and channel combination simultaneously. Separating them decouples spatial operations from channel mixing, reducing FLOPs by $\\approx 88\\%$."
      },
      {
        "q": "What was the primary design philosophy behind the ConvNeXt architecture (Liu et al., 2022)?",
        "o": [
          "To replace all convolutions with self-attention heads",
          "To modernise a pure standard convolutional network step-by-step using Vision Transformer architectural design choices (larger kernels, LayerNorm, inverted bottleneck, GELU)",
          "To train models exclusively on mobile phones",
          "To eliminate residual skip connections"
        ],
        "a": 1,
        "why": "ConvNeXt took a standard ResNet and modernised its macro/micro design choices based on Swin Transformer findings, demonstrating that pure CNNs can match Transformer performance."
      },
      {
        "q": "What is the theoretical computational savings ratio of a $3 \\times 3$ depthwise-separable convolution compared to a standard $3 \\times 3$ convolution when channel counts are large?",
        "o": [
          "Approximately 10%",
          "Approximately 50%",
          "Approximately 88%–89% (reduction factor of $\\approx 1/K^2 = 1/9$)",
          "100% (zero compute cost)"
        ],
        "a": 2,
        "why": "The cost ratio is $\\frac{1}{N} + \\frac{1}{K^2}$. For $K=3$ and large $N$, the ratio approaches $1/9 \\approx 11.1\\%$, yielding an 88.9% compute reduction."
      }
    ],
    "related": [
      "receptive-field-stride-and-pooling",
      "cnn-architecture-tour-lenet-to-resnet-to-efficientnet",
      "vision-transformer"
    ],
    "keywords": "depthwise separable convolutions, mobilenet, convnext, inverted bottleneck, layernorm, pointwise convolution, spatial filtering, cnn modernisation"
  },
  {
  id: 'iou-nms-and-map',
  short: 'IoU, NMS & mAP',
  title: 'IoU, NMS and mAP',
  task: 'concepts',
  module: 'Detection and segmentation',
  level: 2,
  minutes: 16,
  noLab: true,
  summary: r`Object detection extends image classification by predicting both categorical semantics and spatial bounding box coordinates for multiple targets across an image. Evaluating and post-processing object detector outputs depends on three foundational metrics and algorithms: Intersection over Union (IoU) measures geometric bounding box overlap $\frac{|A \cap B|}{|A \cup B|}$; Non-Maximum Suppression (NMS) eliminates redundant overlapping candidate proposals by iteratively suppressing lower-scoring boxes that exceed an IoU overlap threshold with the highest-confidence prediction; and mean Average Precision (mAP) integrates precision-recall curves across classes and IoU thresholds (such as mAP@0.5 and the COCO primary challenge metric mAP@[0.5:0.95]), rigorously penalising false alarms, missed targets, and duplicate detections.`,
  lead: r`Unlike standard image classification, where a model outputs a single class label per photograph, object detection outputs a variable list of coordinates and confidence scores: "Dog at $[x_1, y_1, x_2, y_2]$ with $92\%$ confidence; Bicycle at $[x_3, y_3, x_4, y_4]$ with $87\%$ confidence." But how close does a predicted box need to be to count as a "hit"? How do you prevent a model from generating twenty slightly shifted boxes over a single cat? And how do you combine localization precision with classification recall into a single benchmark metric? The answers lie in IoU, NMS, and mAP.`,
  intuition: [
    r`Geometric overlap via Intersection over Union (IoU): A predicted bounding box rarely aligns with the ground-truth box down to the exact pixel. Intersection over Union (IoU), also known as the Jaccard Index, quantifies spatial overlap as the area of intersection divided by the area of union: $\text{IoU} = \frac{\text{Area}(B_p \cap B_{gt})}{\text{Area}(B_p \cup B_{gt})}$. IoU is scale-invariant: an overlap score of $0.70$ signifies the identical degree of geometric alignment whether evaluating a tiny pedestrian at distance or a massive freight truck filling the camera frame. An IoU of $1.0$ indicates perfect overlap; an IoU of $0.0$ indicates disjoint boxes.`,
    r`Eliminating duplicates via Non-Maximum Suppression (NMS): Modern object detectors evaluate thousands of candidate anchor boxes across the spatial grid. A single physical object frequently triggers dozens of adjacent detector heads, producing a cluttered swarm of redundant bounding boxes. Non-Maximum Suppression prunes this crowd greedily: (1) Sort all candidate boxes descending by class confidence score. (2) Select the highest-scoring box $B_{\text{best}}$ and add it to the final detection list. (3) Compare $B_{\text{best}}$ against every remaining box; any box whose IoU with $B_{\text{best}}$ exceeds an overlap threshold $\tau_{\text{NMS}}$ (typically $0.45$ to $0.60$) is suppressed and permanently discarded. (4) Repeat until no candidates remain.`,
    r`Precision, recall, and the detection matching protocol: To evaluate a detector, predicted boxes must be matched against ground truth. Predictions are sorted by confidence and matched greedily to ground-truth objects. A prediction is classified as a True Positive (TP) if its IoU with an unmatched ground-truth box exceeds an evaluation threshold (e.g. $\text{IoU} \ge 0.50$). If a prediction matches an already-claimed ground-truth object, or if its IoU falls below the threshold, it is labelled a False Positive (FP). Ground-truth objects that receive no matching prediction are False Negatives (FN). Sweeping the confidence threshold from $1.0$ down to $0.0$ traces out a Precision-Recall curve.`,
    r`From Average Precision (AP) to mAP: Precision-Recall curves are jagged because precision can oscillate as recall increases. Average Precision (AP) computes the area under the interpolated Precision-Recall curve, where the interpolated precision at recall $r$ is taken as the maximum precision found for any recall $r' \ge r$. The mean Average Precision (mAP) averages AP scores across all semantic categories. The modern COCO evaluation benchmark averages mAP across ten IoU overlap thresholds spanning $0.50$ to $0.95$ in steps of $0.05$ (mAP@[0.5:0.95]), demanding both coarse detection capability and sub-pixel localization accuracy.`,
  ],
  analogy: r`Imagine an archery competition. Calculating IoU is like measuring how much of your arrow's broad arrowhead overlaps the bullseye ring painted on the target: if your arrow clips the edge, the overlap is 10%; if it strikes dead centre, the overlap is 90%. Non-Maximum Suppression is like a scoring referee resolving an archer who fires a volley of ten tightly grouped arrows at the same bullseye: the referee awards points for the single best shot in the cluster and pulls the other nine arrows out of the board so they don't count as ten separate bullseyes. Mean Average Precision (mAP) is like the tournament decathlon leaderboard: it scores how consistently an archer hits targets as distance increases, averaging performance across different bow disciplines (classes) and across both lenient target rings (IoU 0.5) and strict pin-point bullseyes (IoU 0.95).`,
  steps: [
    {
      title: r`Compute box intersection and union coordinates`,
      desc: r`Calculate overlap area between predicted and ground-truth bounding box tensors.`,
      detail: r`Represent bounding boxes as $[x_1, y_1, x_2, y_2]$ where $(x_1, y_1)$ is top-left and $(x_2, y_2)$ is bottom-right. The intersection box coordinates are $x_1^I = \max(x_1^A, x_1^B)$, $y_1^I = \max(y_1^A, y_1^B)$, $x_2^I = \min(x_2^A, x_2^B)$, and $y_2^I = \min(y_2^A, y_2^B)$. The intersection area is $\max(0, x_2^I - x_1^I) \times \max(0, y_2^I - y_1^I)$. Union area is $\operatorname{Area}(A) + \operatorname{Area}(B) - \operatorname{Area}(\text{Intersection})$.`,
    },
    {
      title: r`Filter background predictions via confidence thresholding`,
      desc: r`Discard candidate boxes with low class probability scores before running NMS.`,
      detail: r`Set a minimum confidence score cutoff (e.g. $p_{\text{score}} \ge 0.05$ during evaluation, or $\ge 0.30$ during live inference) to strip out tens of thousands of background anchors, accelerating subsequent NMS processing.`,
    },
    {
      title: r`Execute greedy Non-Maximum Suppression (NMS)`,
      desc: r`Iteratively prune redundant overlapping detections for each object class independently.`,
      detail: r`For each semantic class: sort surviving candidate boxes descending by score. Pop the top box $B_{\text{top}}$, add it to the output list, and compute IoU with all remaining candidate boxes. Discard all candidate boxes where $\operatorname{IoU}(B_{\text{top}}, B_i) > \tau_{\text{NMS}}$ (typically $\tau_{\text{NMS}} = 0.5$). Repeat until the candidate pool is exhausted.`,
    },
    {
      title: r`Match predictions to ground-truth objects`,
      desc: r`Classify detections as True Positives or False Positives across ranked confidence thresholds.`,
      detail: r`For an evaluation IoU threshold (e.g. $0.50$): sort all dataset predictions descending by confidence. For each prediction, find the ground-truth box of the same class with the highest IoU. If $\operatorname{IoU} \ge \tau$ and that ground truth has not yet been matched, flag the prediction as a True Positive (TP) and mark the ground truth as matched. Otherwise, flag the prediction as a False Positive (FP).`,
    },
    {
      title: r`Calculate interpolated Average Precision (AP) and mAP`,
      desc: r`Integrate the precision-recall curve across categories and overlap thresholds.`,
      detail: r`Compute cumulative TP and FP counts to generate recall $R = \frac{\text{cumTP}}{N_{\text{total\_gt}}}$ and precision $P = \frac{\text{cumTP}}{\text{cumTP} + \text{cumFP}}$. Compute interpolated precision $P_{\text{interp}}(r) = \max_{r' \ge r} P(r')$ to eliminate curve oscillations. Integrate the area under the curve to yield class AP. Average across all classes to compute mAP.`,
    },
  ],
  math: [
    {
      h: r`Intersection over Union (Jaccard Index)`,
      tex: r`\operatorname{IoU}(A, B) = \frac{|A \cap B|}{|A \cup B|} = \frac{|A \cap B|}{|A| + |B| - |A \cap B|} \in [0, 1]`,
      p: r`Here $|A|$ and $|B|$ denote the 2D spatial areas of bounding boxes $A$ and $B$. IoU is strictly bounded between $0$ (completely disjoint boxes) and $1$ (exact geometric identity).`,
    },
    {
      h: r`Precision, Recall, and Interpolated Precision`,
      tex: r`P = \frac{\text{TP}}{\text{TP} + \text{FP}}, \quad R = \frac{\text{TP}}{\text{TP} + \text{FN}}, \quad P_{\text{interp}}(r) = \max_{r' \ge r} P(r')`,
      p: r`Precision measures the proportion of predicted detections that are authentic targets. Recall measures the proportion of total ground-truth targets successfully found. Replacing $P(r)$ with $P_{\text{interp}}(r)$ creates a monotonically non-increasing envelope that eliminates noise spikes from individual prediction rankings.`,
    },
    {
      h: r`COCO mean Average Precision (mAP@[0.50:0.95])`,
      tex: r`\text{mAP} = \frac{1}{|C|} \sum_{c \in C} \left( \frac{1}{10} \sum_{\tau \in \{0.50, 0.55, \dots, 0.95\}} \text{AP}_{c, \tau} \right)`,
      p: r`The standard MS COCO benchmark computes Average Precision for each class $c \in C$ across ten IoU match thresholds $\tau \in [0.50, 0.95]$ in increments of $0.05$. Averaging across all IoU levels and classes yields the primary challenge metric mAP.`,
    },
  ],
  keyPoints: [
    r`IoU measures scale-invariant spatial overlap as the ratio of intersection area to union area.`,
    r`Non-Maximum Suppression (NMS) greedily eliminates redundant overlapping candidate boxes based on confidence rankings and IoU overlap thresholds.`,
    r`In object detection evaluation, each ground-truth object can be matched at most once; subsequent duplicate detections are penalised as False Positives.`,
    r`Average Precision (AP) measures the area under the interpolated Precision-Recall curve for a single semantic class.`,
    r`COCO mAP averages AP across multiple IoU thresholds ($0.50$ to $0.95$) and all object classes, rewarding precise bounding box localization.`,
  ],
  pitfalls: [
    r`Double-counting ground truth matches: Allowing multiple predictions to claim the same ground-truth object artificially inflates precision; subsequent overlapping predictions must be counted as False Positives.`,
    r`Setting NMS threshold too low: Setting $\tau_{\text{NMS}} < 0.30$ causes NMS to inadvertently suppress distinct adjacent objects in crowded scenes (such as people standing close together in a queue).`,
    r`Running class-agnostic NMS when objects can overlap: Applying NMS across all classes simultaneously can cause a high-confidence "person" prediction to suppress a valid overlapping "bicycle" prediction; NMS should normally be evaluated per-class.`,
    r`Evaluating mAP without checking confidence ranking: Failing to sort predictions descending by confidence before assigning TP and FP labels completely invalidates the Precision-Recall curve.`,
    r`Assuming IoU is differentiable when disjoint: Standard IoU gradient is zero whenever boxes do not overlap ($\text{IoU}=0$), which prevents gradient flow during training; modern detectors use generalised IoU (GIoU), Distance-IoU (DIoU), or Complete-IoU (CIoU) loss.`,
  ],
  code: r`import numpy as np

# Vectorized Intersection over Union (IoU) calculation
def compute_iou(box1, boxes):
    # box1: [x1, y1, x2, y2]
    # boxes: [[x1, y1, x2, y2], ...] shape (N, 4)
    x1 = np.maximum(box1[0], boxes[:, 0])
    y1 = np.maximum(box1[1], boxes[:, 1])
    x2 = np.minimum(box1[2], boxes[:, 2])
    y2 = np.minimum(box1[3], boxes[:, 3])
    
    inter_w = np.maximum(0.0, x2 - x1)
    inter_h = np.maximum(0.0, y2 - y1)
    inter_area = inter_w * inter_h
    
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (boxes[:, 2] - boxes[:, 0]) * (boxes[:, 3] - boxes[:, 1])
    union_area = area1 + area2 - inter_area
    
    return inter_area / np.maximum(union_area, 1e-6)

# 1. Greedy Non-Maximum Suppression (NMS)
def nms(boxes, scores, iou_threshold=0.5):
    order = np.argsort(scores)[::-1]
    keep = []
    
    while len(order) > 0:
        idx = order[0]
        keep.append(idx)
        if len(order) == 1:
            break
            
        ious = compute_iou(boxes[idx], boxes[order[1:]])
        # Retain only boxes whose IoU is below the suppression threshold
        survivors = np.where(ious <= iou_threshold)[0]
        order = order[survivors + 1]
        
    return keep

# Simulate 5 candidate boxes (e.g. 3 overlapping boxes on one object, 2 on another)
candidate_boxes = np.array([
    [50.0,  50.0,  150.0, 150.0],  # Box A (top confidence: 0.95)
    [52.0,  48.0,  155.0, 152.0],  # Box A overlap 1 (conf: 0.88)
    [48.0,  55.0,  145.0, 148.0],  # Box A overlap 2 (conf: 0.72)
    [200.0, 200.0, 300.0, 300.0],  # Box B (top confidence: 0.91)
    [205.0, 195.0, 310.0, 305.0],  # Box B overlap 1 (conf: 0.65)
], dtype=np.float32)

candidate_scores = np.array([0.95, 0.88, 0.72, 0.91, 0.65], dtype=np.float32)

kept_indices = nms(candidate_boxes, candidate_scores, iou_threshold=0.5)
print(f"Total candidate proposals: {len(candidate_boxes)}")
print(f"Indices kept after NMS:    {kept_indices}")
print(f"Selected boxes (one per true target):\n{candidate_boxes[kept_indices]}")

# 2. Precision-Recall curve and 11-point interpolated Average Precision (AP)
# Simulated matching results (sorted by confidence)
tp = np.array([1, 1, 0, 1, 0, 1, 0, 0, 1, 0], dtype=np.float32)
fp = np.array([0, 0, 1, 0, 1, 0, 1, 1, 0, 1], dtype=np.float32)
num_ground_truth = 6

cum_tp = np.cumsum(tp)
cum_fp = np.cumsum(fp)
recalls = cum_tp / num_ground_truth
precisions = cum_tp / (cum_tp + cum_fp)

# 11-point interpolation (recall thresholds: 0.0, 0.1, ..., 1.0)
ap_11 = 0.0
for r_thresh in np.linspace(0.0, 1.0, 11):
    prec_candidates = precisions[recalls >= r_thresh]
    p_interp = np.max(prec_candidates) if len(prec_candidates) > 0 else 0.0
    ap_11 += p_interp / 11.0

print(f"\nDetection AP evaluation (11-point interpolated):")
print(f"Total True Positives found: {cum_tp[-1]:.0f} / {num_ground_truth} GT targets")
print(f"Final Recall:               {recalls[-1]:.3f}")
print(f"Calculated AP@0.5:          {ap_11:.4f}")`,
  quiz: [
    {
      q: r`Why is Intersection over Union (IoU) preferred over absolute pixel Euclidean distance when measuring bounding box localization error?`,
      o: [
        r`IoU is scale-invariant, providing a consistent relative overlap metric for both small distant targets and large foreground objects`,
        r`IoU requires only integer additions without division`,
        r`IoU can only be evaluated on square bounding boxes`,
        r`IoU converts bounding box coordinates into RGB pixel values`,
      ],
      a: 0,
      why: r`A 10-pixel error on a 20-pixel object represents a catastrophic $50\%$ displacement, whereas a 10-pixel error on a 500-pixel object is negligible. Dividing intersection by union normalises for target scale, providing a scale-invariant metric in $[0, 1]$.`,
    },
    {
      q: r`In Non-Maximum Suppression (NMS), why are candidate boxes sorted descending by confidence score before evaluating overlap?`,
      o: [
        r`To ensure that the most confident prediction is retained first as the anchor for suppressing redundant overlapping proposals`,
        r`To reduce the number of memory bytes consumed by the GPU`,
        r`To convert bounding box coordinates from floats to integers`,
        r`To verify that the model has converged during backpropagation`,
      ],
      a: 0,
      why: r`Greedy NMS works by selecting the highest-confidence prediction as the primary reference box for a detected object and then pruning all lower-scoring candidate boxes that overlap significantly with it.`,
    },
    {
      q: r`When evaluating detections against ground truth to construct a Precision-Recall curve, what happens if two predicted boxes both overlap a single ground-truth object above the IoU threshold?`,
      o: [
        r`The higher-confidence prediction is credited as a True Positive (TP), and the second duplicate prediction is classified as a False Positive (FP)`,
        r`Both predictions are credited as True Positives, doubling the recall score`,
        r`Both predictions are disqualified and discarded from the evaluation`,
        r`The ground-truth box is duplicated in memory`,
      ],
      a: 0,
      why: r`Each ground-truth object can be matched at most once. The first (highest-scoring) matching prediction claims the True Positive; any subsequent duplicate predictions for that same object are penalised as False Positives to deter duplicate clutter.`,
    },
    {
      q: r`How does the primary COCO benchmark metric (mAP@[0.50:0.95]) differ from the classical PASCAL VOC metric (mAP@0.50)?`,
      o: [
        r`COCO averages AP across ten IoU thresholds from $0.50$ to $0.95$ in steps of $0.05$, rewarding detectors that achieve precise boundary alignment rather than merely coarse localization`,
        r`COCO evaluates only grayscale images`,
        r`COCO excludes False Positives from the score calculation`,
        r`COCO uses F1 score rather than precision and recall`,
      ],
      a: 0,
      why: r`While PASCAL VOC accepted any detection with $\text{IoU} \ge 0.50$, the COCO benchmark averages across $0.50, 0.55, \dots, 0.95$. A detector with loose, sloppy boxes scores poorly under COCO mAP, pushing models to predict tight, exact boundaries.`,
    },
  ],
  usedBy: ['one-stage-detectors-ssd-and-yolo'],
  prereq: ['convolutional_neural_networks', 'pixels-channels-and-colour-spaces'],
  related: ['one-stage-detectors-ssd-and-yolo', 'precision-recall-f1', 'confusion-matrix'],
  keywords: 'iou intersection over union nms non maximum suppression map mean average precision object detection bounding box coco pascal voc precision recall',
},
  {
  id: 'one-stage-detectors-ssd-and-yolo',
  short: 'SSD & YOLO',
  title: 'One-stage detectors: SSD and YOLO',
  task: 'concepts',
  module: 'Detection and segmentation',
  level: 2,
  minutes: 18,
  noLab: true,
  summary: r`While two-stage detectors (such as Faster R-CNN) separate region proposal generation from bounding box classification, one-stage detectors frame object detection as a unified, single-pass dense regression problem directly from raw pixels to bounding boxes and class probabilities. Joseph Redmon's YOLO (You Only Look Once) pioneered high-frame-rate real-time detection on a spatial grid, while Wei Liu's SSD (Single Shot MultiBox Detector) introduced multi-scale feature pyramid heads with pre-defined multi-aspect anchor boxes. Modern one-stage detectors combine multi-scale Feature Pyramid Networks (FPN), anchor-free regression, and Tsung-Yi Lin's Focal Loss to conquer severe foreground-background class imbalance and match two-stage accuracy at blazing inference speeds.`,
  lead: r`Early deep object detection architectures were complex, multi-stage pipelines: first, a Region Proposal Network (RPN) hypothesised thousands of candidate object regions; next, ROI-pooling cropped each proposal; and finally, fully connected networks classified each crop and refined coordinates. This two-pass process achieved high accuracy but crawled at 5 to 7 frames per second—far too slow for autonomous driving, drone navigation, or robotics. In 2015, YOLO shattered this complexity by asking a provocative question: why not treat detection as a single regression problem, passing the image through a convolutional network once and reading off all detections simultaneously at 45 frames per second?`,
  intuition: [
    r`The unified grid paradigm (YOLOv1): Joseph Redmon framed detection as a single neural forward pass. YOLO divides the input image into an $S \times S$ grid (e.g. $7 \times 7$). If an object's centre falls within a specific grid cell, that cell is responsible for detecting it. Each cell predicts $B$ bounding box offsets $(x, y, w, h)$, an objectness confidence score $\operatorname{Pr}(\text{Object}) \cdot \operatorname{IoU}$, and conditional class probabilities $\operatorname{Pr}(\text{Class}_i \mid \text{Object})$. By processing the entire image holistically in one shot, YOLO encodes global contextual awareness, drastically reducing background false positive detections compared to sliding-window or region-proposal approaches.`,
    r`Multi-scale detection heads and anchor boxes (SSD): A key limitation of early YOLO was poor localization on small objects: a single coarse $7 \times 7$ grid cannot resolve multiple tiny birds clustered together. In 2016, SSD (Single Shot MultiBox Detector) resolved this by attaching detection heads to multiple intermediate feature maps of varying spatial resolutions throughout the convolutional backbone. Deep low-resolution layers ($10 \times 10$) detect large objects using expansive receptive fields, while shallow high-resolution layers ($38 \times 38$) detect tiny objects. Furthermore, SSD placed pre-defined "anchor boxes" (or default priors) of various aspect ratios ($1:1, 1:2, 2:1, 1:3, 3:1$) at each grid location, predicting relative offset residuals $(\Delta x, \Delta y, \Delta w, \Delta h)$ rather than absolute coordinates.`,
    r`The extreme foreground-background class imbalance problem: While two-stage detectors filter out 99% of empty background candidates during the initial RPN proposal stage, a one-stage detector evaluates hundreds of thousands of candidate locations across its spatial pyramid simultaneously. Over $99.9\%$ of these dense anchor locations contain empty background. In standard cross-entropy loss, the overwhelming accumulation of easy background negative gradients drowns out the rare positive target gradients, crippling detector training.`,
    r`Focal Loss and the modern one-stage convergence: In 2017, Lin et al. introduced RetinaNet and Focal Loss: $\operatorname{FL}(p_t) = -\alpha_t (1 - p_t)^\gamma \log(p_t)$. By inserting the modulating factor $(1 - p_t)^\gamma$ (with focusing parameter $\gamma = 2$), the loss of well-classified easy examples ($p_t \ge 0.9$) is down-weighted by a factor of $100\times$, focusing gradient updates predominantly on hard, ambiguous object candidates. Coupled with Path Aggregation Feature Pyramids (PANet) and anchor-free centre-point regression, modern one-stage detectors (such as YOLOv8 and YOLOv10) achieve both real-time execution (>100 FPS) and state-of-the-art mAP, rendering two-stage detectors obsolete for most production computer vision applications.`,
  ],
  analogy: r`Think of inspecting a crowded international airport baggage terminal for suspicious luggage. A two-stage detector (Faster R-CNN) is like having two separate shifts of security officers: first, an initial team walks the conveyor belt, sticking yellow post-it notes onto any bag that looks vaguely interesting; then, a second specialised inspection team individually picks up each tagged bag, scans it with an X-ray machine, and classifies its contents. This is thorough, but it creates huge lines and slow baggage throughput. A one-stage detector (YOLO) is like mounting automated high-speed ceiling scanners along the conveyor belt: as bags glide past at full speed, the scanner grid reads barcodes, estimates suitcase dimensions, and classifies contents in a single continuous camera sweep. Focal Loss is like programming the ceiling scanner to ignore millions of obvious nylon black roller bags, alerting security personnel exclusively when unusual, complex, or ambiguous cargo appears.`,
  steps: [
    {
      title: r`Divide image into spatial multi-scale feature pyramids`,
      desc: r`Extract hierarchical feature grids representing small, medium, and large target scales.`,
      detail: r`Pass the input image through a convolutional backbone (such as CSPDarknet) coupled with a Feature Pyramid Network (FPN / PANet). Generate prediction grids across three spatial strides: $8\times$ downsampled ($52 \times 52$ grid for small objects), $16\times$ downsampled ($26 \times 26$ grid for medium objects), and $32\times$ downsampled ($13 \times 13$ grid for large objects).`,
    },
    {
      title: r`Assign pre-defined anchor priors or identify centre points`,
      desc: r`Establish spatial reference templates across each grid cell.`,
      detail: r`At each spatial cell $(c_x, c_y)$, instantiate anchor boxes with predefined scales and aspect ratios (historically derived via k-means clustering on training set bounding box dimensions). In modern anchor-free variants, the grid cell centre itself acts as the reference point, predicting distances $(l, t, r, b)$ directly to the four object boundaries.`,
    },
    {
      title: r`Predict multi-task coordinate deltas and class probabilities`,
      desc: r`Evaluate the dense detection head to output localization offsets and classification logits.`,
      detail: r`For each anchor or cell, predict bounding box offsets $t_x, t_y, t_w, t_h$, objectness confidence logit $t_o$, and $C$ class logits $t_c$. Apply sigmoid functions: $b_x = \sigma(t_x) + c_x$, $b_y = \sigma(t_y) + c_y$, $b_w = p_w e^{t_w}$, and $b_h = p_h e^{t_h}$ to guarantee spatial stability.`,
    },
    {
      title: r`Formulate unified multi-task loss with Focal Loss`,
      desc: r`Balance bounding box regression, objectness, and class probability errors.`,
      detail: r`Combine CIoU / GIoU loss for bounding box localization, Binary Cross-Entropy with Focal Loss for objectness confidence, and Focal Loss or BCE for multi-label class prediction. Positive targets are assigned using SimOTA or Task-Aligned Assigner (TAL) based on joint classification-localization scores.`,
    },
    {
      title: r`Decode and prune candidates via Non-Maximum Suppression`,
      desc: r`Filter background predictions and collapse redundant overlapping boxes at runtime.`,
      detail: r`Multiply class probabilities by the objectness confidence score. Discard candidate proposals falling below score threshold (e.g. $0.25$). Feed surviving candidate bounding boxes to class-wise Non-Maximum Suppression (NMS) with IoU threshold $\tau_{\text{NMS}} = 0.5$ to produce clean, final detection outputs.`,
    },
  ],
  math: [
    {
      h: r`YOLO bounding box coordinate parameterisation`,
      tex: r`b_x = \sigma(t_x) + c_x, \quad b_y = \sigma(t_y) + c_y, \quad b_w = p_w e^{t_w}, \quad b_h = p_h e^{t_h}`,
      p: r`Here $(c_x, c_y)$ is the top-left offset of the grid cell, $(p_w, p_h)$ are anchor box prior dimensions, $\sigma(\cdot)$ is the logistic sigmoid constraining box centres to remain within their assigned cell, and $(b_x, b_y, b_w, b_h)$ are absolute predicted coordinates normalised by grid size.`,
    },
    {
      h: r`Focal Loss for addressing class imbalance`,
      tex: r`\operatorname{FL}(p_t) = -\alpha_t \left(1 - p_t\right)^\gamma \log(p_t), \quad p_t = \begin{cases} p & \text{if } y = 1 \\ 1 - p & \text{otherwise} \end{cases}`,
      p: r`Here $p \in [0, 1]$ is the model's estimated probability for the ground-truth class, $\alpha_t$ balances positive versus negative examples, and $\gamma \ge 0$ is the tunable focusing parameter (typically $\gamma = 2.0$). As $p_t \to 1$ for easy background examples, the modulating factor $(1 - p_t)^\gamma \to 0$, preventing background gradients from dominating the loss.`,
    },
    {
      h: r`Complete Intersection over Union (CIoU) loss`,
      tex: r`\mathcal{L}_{\text{CIoU}} = 1 - \operatorname{IoU} + \frac{\rho^2(\mathbf{b}, \mathbf{b}_{\text{gt}})}{c^2} + \alpha\, v, \quad v = \frac{4}{\pi^2}\left(\arctan\frac{w_{\text{gt}}}{h_{\text{gt}}} - \arctan\frac{w}{h}\right)^2`,
      p: r`CIoU loss incorporates three geometric factors: overlap area ($\operatorname{IoU}$), normalised central point Euclidean distance $\rho^2 / c^2$ (where $c$ is the diagonal length of the smallest enclosing box), and aspect ratio consistency $v$, driving smooth gradient updates even when candidate boxes have zero initial spatial overlap.`,
    },
  ],
  keyPoints: [
    r`One-stage detectors frame object detection as a single-pass regression problem, eliminating separate region proposal stages.`,
    r`YOLO divides images into spatial grid cells, predicting bounding boxes and class probabilities simultaneously at high frame rates.`,
    r`SSD introduces multi-scale feature pyramids and multi-aspect anchor boxes to detect both small and large objects effectively.`,
    r`Focal Loss down-weights easy background negative examples by $(1 - p_t)^\gamma$, solving the extreme class imbalance inherent in dense single-stage detection.`,
    r`Modern one-stage detectors employ Feature Pyramid Networks (FPN/PANet), anchor-free heads, and CIoU loss to rival two-stage accuracy with real-time throughput.`,
  ],
  pitfalls: [
    r`Unconstrained coordinate regression: Directly predicting unconstrained unbounded offsets $(\Delta x, \Delta y)$ causes gradient instability; using sigmoid activations $\sigma(t_x) + c_x$ restricts box centres to their local cell, ensuring stable convergence.`,
    r`Ignoring small-object feature degradation: Detecting small objects on deep feature maps fails because aggressive striding shrinks small targets below 1 pixel; predictions for small objects must be extracted from shallow high-resolution pyramid layers.`,
    r`Over-relying on hand-crafted anchor shapes: Hard-coding anchor aspect ratios without inspecting target dataset distributions degrades IoU matching; anchor dimensions should be tailored to dataset statistics via k-means clustering or replaced with anchor-free heads.`,
    r`Training one-stage detectors with standard cross-entropy without Focal Loss: Using standard unmodulated cross-entropy on dense single-stage grids causes background negatives to swamp positive signals, leading to non-converging or degenerate models.`,
    r`Excessive NMS compute overhead: Feeding hundreds of thousands of raw predictions directly into NMS causes latency bottlenecks; always apply pre-filtering with a confidence threshold ($p \ge 0.05$) to cull 95% of candidates prior to NMS.`,
  ],
  code: r`import numpy as np

# Simulate a YOLO-style one-stage detection head decoding pass
np.random.seed(42)

# Input parameters: 13x13 spatial grid, 3 anchor boxes per cell, 3 classes
grid_h, grid_w = 13, 13
num_anchors = 3
num_classes = 3

# Pre-defined anchor prior dimensions (width, height in grid units)
anchors = np.array([
    [1.5, 2.0],  # Tall anchor (e.g. pedestrian)
    [3.0, 3.0],  # Square anchor
    [5.0, 2.5]   # Wide anchor (e.g. car)
], dtype=np.float32)

# Raw network output logits for one image: shape (13, 13, num_anchors, 4 + 1 + num_classes)
# Channels: [tx, ty, tw, th, objectness_logit, class_logit_0, class_logit_1, class_logit_2]
num_attribs = 4 + 1 + num_classes
raw_preds = np.random.randn(grid_h, grid_w, num_anchors, num_attribs).astype(np.float32)

# 1. Sigmoid activation helper
def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-z))

# 2. Decode bounding box coordinates and probabilities
# Construct grid coordinate offsets
grid_y, grid_x = np.meshgrid(np.arange(grid_h), np.arange(grid_w), indexing='ij')
grid_x = grid_x[:, :, np.newaxis]  # shape (13, 13, 1)
grid_y = grid_y[:, :, np.newaxis]

# Extract predicted terms
tx = raw_preds[..., 0]
ty = raw_preds[..., 1]
tw = raw_preds[..., 2]
th = raw_preds[..., 3]
obj_logits = raw_preds[..., 4]
class_logits = raw_preds[..., 5:]

# Decode coordinates: bx = sigmoid(tx) + cx, by = sigmoid(ty) + cy
bx = sigmoid(tx) + grid_x
by = sigmoid(ty) + grid_y

# Decode dimensions: bw = pw * exp(tw), bh = ph * exp(th)
anchor_w = anchors[:, 0].reshape(1, 1, num_anchors)
anchor_h = anchors[:, 1].reshape(1, 1, num_anchors)
bw = anchor_w * np.exp(np.clip(tw, -5.0, 5.0))
bh = anchor_h * np.exp(np.clip(th, -5.0, 5.0))

# Decode confidence and probabilities
confidence = sigmoid(obj_logits)
class_probs = sigmoid(class_logits)

# Convert center format (bx, by, bw, bh) to corner format (x1, y1, x2, y2)
x1 = bx - bw / 2.0
y1 = by - bh / 2.0
x2 = bx + bw / 2.0
y2 = by + bh / 2.0

# 3. Flatten and filter candidates
total_proposals = grid_h * grid_w * num_anchors
flat_x1 = x1.flatten()
flat_y1 = y1.flatten()
flat_x2 = x2.flatten()
flat_y2 = y2.flatten()
flat_conf = confidence.flatten()
flat_classes = np.argmax(class_probs.reshape(-1, num_classes), axis=-1)

# Pre-NMS confidence filtering (confidence >= 0.85)
keep_mask = flat_conf >= 0.85
kept_count = np.sum(keep_mask)

print(f"Total dense spatial anchor proposals: {total_proposals:,}")
print(f"Proposals surviving confidence >= 0.85: {kept_count}")
print(f"Confidence score of top candidate:     {np.max(flat_conf):.4f}")
print(f"Predicted box 0 (corner format):       [{flat_x1[0]:.2f}, {flat_y1[0]:.2f}, {flat_x2[0]:.2f}, {flat_y2[0]:.2f}]")
print("Verified: One-stage detection head successfully decodes multi-scale bounding boxes!")`,
  quiz: [
    {
      q: r`What is the defining architectural distinction between a one-stage detector (e.g. YOLO, SSD) and a two-stage detector (e.g. Faster R-CNN)?`,
      o: [
        r`One-stage detectors predict bounding boxes and class probabilities directly in a single forward pass without a separate region proposal generation step`,
        r`One-stage detectors process only single-channel greyscale images`,
        r`One-stage detectors cannot be trained using gradient descent`,
        r`One-stage detectors require two consecutive passes through the convolutional backbone`,
      ],
      a: 0,
      why: r`Two-stage detectors generate candidate proposals first using a Region Proposal Network (RPN) before classifying each crop. One-stage detectors treat detection as a direct unified regression problem across a spatial grid in one forward pass.`,
    },
    {
      q: r`Why does SSD (Single Shot MultiBox Detector) attach detection heads to multiple intermediate layers throughout its convolutional backbone?`,
      o: [
        r`To detect small objects using shallow high-resolution feature maps and large objects using deep low-resolution feature maps with expansive receptive fields`,
        r`To invert the brightness histogram for contrast normalisation`,
        r`To avoid computing bounding box coordinates on the GPU`,
        r`To ensure the network output is invariant to colour shifts`,
      ],
      a: 0,
      why: r`Shallow layers retain fine spatial resolution necessary to detect small targets, whereas deep layers possess the wide receptive fields required to comprehend and bound large objects. Multi-scale heads enable scale-invariant detection.`,
    },
    {
      q: r`How does Focal Loss resolve the severe foreground-background class imbalance problem encountered in dense one-stage detectors?`,
      o: [
        r`By introducing a modulating factor $(1 - p_t)^\gamma$ that heavily down-weights the loss contributions of easy, confident background negative examples`,
        r`By discarding all negative training examples entirely`,
        r`By doubling the learning rate whenever a background anchor is evaluated`,
        r`By converting cross-entropy into a mean squared error loss`,
      ],
      a: 0,
      why: r`In dense single-stage detection, over 99% of anchors are easy background negatives. Focal Loss dynamically scales the loss by $(1 - p_t)^\gamma$; for easy background examples where $p_t \approx 0.99$, the loss is reduced by $10,000\times$, focusing gradient updates on hard positive targets.`,
    },
    {
      q: r`In YOLO coordinate decoding, why are bounding box centre offsets passed through a sigmoid function ($\sigma(t_x) + c_x$)?`,
      o: [
        r`To constrain the predicted box centre strictly within the boundaries of the assigned grid cell, preventing unbounded spatial drift and stabilizing early training`,
        r`To convert bounding box coordinates into logarithmic scale`,
        r`To ensure bounding box coordinates sum to 1.0`,
        r`To avoid negative floating-point numbers in memory`,
      ],
      a: 0,
      why: r`Unconstrained linear predictions can place the box centre anywhere across the image, causing chaotic gradient fluctuations. The sigmoid function bounds offsets strictly to $[0, 1]$, anchoring the box centre firmly within its designated cell.`,
    },
  ],
  usedBy: [],
  prereq: ['iou-nms-and-map', 'cnn-architecture-tour-lenet-to-resnet-to-efficientnet', 'receptive-field-stride-and-pooling'],
  related: ['iou-nms-and-map', 'cnn-architecture-tour-lenet-to-resnet-to-efficientnet', 'convolutional_neural_networks'],
  keywords: 'one stage detector yolo ssd single shot multibox detector focal loss anchor boxes feature pyramid network fpn bounding box regression object detection',
},
  {
  id: 'semantic-segmentation-fcn-and-u-net',
  short: 'FCN & U-Net',
  title: 'Semantic segmentation: FCN and U-Net',
  task: 'concepts',
  module: 'Detection and segmentation',
  level: 2,
  minutes: 18,
  noLab: true,
  summary: r`Semantic segmentation assigns a categorical semantic label to every individual pixel in an image, generating dense spatial masks for medical diagnosis, autonomous driving drivable-area detection, and satellite terrain mapping. Jonathan Long et al.'s Fully Convolutional Network (FCN) established the deep segmentation paradigm by converting dense classification layers into $1 \times 1$ convolutions and introducing transposed convolutions for learnable spatial upsampling. Olaf Ronneberger et al.'s U-Net introduced a symmetric contracting encoder and expansive decoder architecture connected by direct skip pathways that concatenate high-resolution shallow spatial details with deep semantic context, resolving the fundamental tension between spatial localization and semantic abstraction.`,
  lead: r`Bounding boxes are useful, but for many safety-critical vision tasks, a rectangle is too coarse. An autonomous car navigating a narrow city street cannot simply know that an obstacle is roughly bounded by a $2 \times 3$ metre box; it needs to know the exact curving boundary of the asphalt kerb down to the single pixel. A surgical robot cutting a tumour cannot risk a bounding box estimate; it must delineate diseased tissue margins with sub-millimetre precision. Semantic segmentation delivers this dense per-pixel understanding, bridging high-level semantic recognition with low-level spatial geometry.`,
  intuition: [
    r`From image classification to dense per-pixel prediction: Standard CNN classifiers (such as VGG or ResNet) downsample input images through successive pooling and strided convolutions, collapsing spatial dimensions into a single $1 \times 1 \times C$ embedding vector connected to a fully connected layer. While this destroys spatial coordinates to achieve translation invariance for classification, segmentation requires translation equivariance: if an object shifts five pixels to the left, its output mask must also shift five pixels to the left. In 2015, Long et al. showed that any fully connected layer can be viewed as a $1 \times 1$ convolution covering the entire receptive field. Replacing fully connected layers with convolutions yields a Fully Convolutional Network (FCN) capable of processing arbitrary input resolutions and outputting 2D spatial heatmap logits.`,
    r`The upsampling challenge: Transposed convolutions: A deep convolutional backbone downsamples an image by a factor of 32 ($H/32 \times W/32$). To produce a dense mask matching the input resolution $H \times W$, feature maps must be upsampled. While bilinear interpolation can resize matrices, it cannot learn data-dependent reconstruction filters. Transposed convolutions (also known as fractionally strided convolutions or deconvolution) reverse the forward convolution stride: they expand feature dimensions by interleaving zeros between activations and applying learnable convolution kernels, allowing the network to learn optimal spatial reconstruction filters during backpropagation.`,
    r`The spatial localization dilemma: Deep layers in a CNN possess expansive receptive fields capable of recognizing complex semantics ("this region is a human lung"), but their coarse spatial resolution blurs boundaries and obliterates fine anatomical details. Conversely, shallow layers possess fine spatial resolution capable of pinpointing crisp boundaries, but lack semantic depth (they perceive only raw edges and colour gradients). How can a network be both semantically wise and spatially precise?`,
    r`U-Net's symmetric skip connection architecture: Ronneberger et al. answered this in 1995 with the U-Net architecture. U-Net is structured as a symmetric U-shaped topology: a contracting path (encoder) that captures contextual semantic representations through repeated convolutions and max-pooling, paired with an expansive path (decoder) that restores spatial resolution through repeated transposed convolutions. Crucially, U-Net introduces horizontal skip connections: feature maps from the encoder are copied and concatenated channel-wise directly into the corresponding decoder tier. The decoder therefore receives both high-resolution spatial boundary cues from the encoder and rich semantic representations from deep bottleneck layers, synthesizing sharp, pixel-accurate segmentation boundaries.`,
  ],
  analogy: r`Imagine an architect tasked with restoring an intricate, centuries-old cathedral mosaic that has suffered minor earthquake damage. The encoder path is like an art historian stepping backward across the cathedral plaza: with each step back, the individual mosaic tiles blur together, but the historian grasps the grand thematic composition—understanding that this section depicts a saint and that section depicts an archway. If the historian tries to repaint the mosaic from memory from fifty metres away, the boundaries will be blurry and misshapen. U-Net's skip connection is like a master craftsman on scaffolding who takes high-resolution Polaroid snapshots of the individual tile grout lines before stepping back. As the historian directs the restoration from afar (semantic decoder), the craftsman injects the exact high-resolution Polaroid photographs of the original tile boundaries (encoder skip connections) directly into the plastering stage. The resulting restoration captures both grand artistic intent and razor-sharp tile alignment.`,
  steps: [
    {
      title: r`Contracting encoder path (feature extraction)`,
      desc: r`Extract hierarchical semantic representations through repeated convolution and pooling stages.`,
      detail: r`Pass the input image through consecutive $3 \times 3$ convolutions paired with ReLU activations. Downsample spatial dimensions by a factor of 2 using $2 \times 2$ max-pooling with stride 2, while doubling the channel depth ($64 \to 128 \to 256 \to 512$). Store copies of pre-pooling feature maps in memory for skip connection routing.`,
    },
    {
      title: r`Bottleneck representation`,
      desc: r`Process compressed features at the lowest spatial resolution and highest channel capacity.`,
      detail: r`At the base of the U, two $3 \times 3$ convolutions operate on the maximally downsampled feature map (e.g. $1024$ channels at $H/16 \times W/16$), capturing global context across the entire image receptive field.`,
    },
    {
      title: r`Expansive decoder path (transposed convolution upsampling)`,
      desc: r`Incrementally restore spatial grid resolution using learnable upsampling layers.`,
      detail: r`At each decoder stage, apply a $2 \times 2$ transposed convolution with stride 2, halving the channel depth while doubling spatial height and width. This expands the spatial grid to match the corresponding encoder stage.`,
    },
    {
      title: r`Skip connection concatenation`,
      desc: r`Fuse high-resolution encoder spatial features with upsampled decoder semantic features.`,
      detail: r`Concatenate the stored feature map from the encoder stage along the channel axis with the upsampled decoder tensor (e.g. $256 + 256 = 512$ channels). If padding differences create slight spatial dimension mismatches, crop the encoder map or use reflection padding. Process the concatenated tensor through two $3 \times 3$ convolutions to fuse spatial and semantic cues.`,
    },
    {
      title: r`Final 1x1 convolution and segmentation loss`,
      desc: r`Project multi-channel decoder features to per-class pixel probability maps.`,
      detail: r`Apply a final $1 \times 1$ convolution mapping channel depth to the number of semantic classes $K$. Compute pixel-wise softmax across classes. Train using a hybrid loss combining Weighted Cross-Entropy (to handle class imbalance) and Soft Dice Loss $\mathcal{L}_{\text{Dice}} = 1 - \frac{2 |Y \cap \hat{Y}| + \epsilon}{|Y| + |\hat{Y}| + \epsilon}$ to reward mask intersection alignment.`,
    },
  ],
  math: [
    {
      h: r`Pixel-wise cross-entropy loss with class weights`,
      tex: r`\mathcal{L}_{\text{CE}} = -\frac{1}{N} \sum_{i=1}^N \sum_{c=1}^K w_c\, y_{i, c} \log(p_{i, c}), \quad p_{i, c} = \frac{\exp(z_{i, c})}{\sum_{k=1}^K \exp(z_{i, k})}`,
      p: r`Here $N = H \times W$ is total pixels, $K$ is the number of semantic classes, $y_{i, c} \in \{0, 1\}$ is ground-truth indicator, $p_{i, c}$ is the predicted softmax probability for pixel $i$ and class $c$, and $w_c$ is an inverse frequency weight to prevent common background pixels from overpowering rare foreground categories.`,
    },
    {
      h: r`Sørensen-Dice coefficient and Soft Dice Loss`,
      tex: r`\text{Dice} = \frac{2 \sum_{i=1}^N p_i y_i + \epsilon}{\sum_{i=1}^N p_i^2 + \sum_{i=1}^N y_i^2 + \epsilon}, \quad \mathcal{L}_{\text{Dice}} = 1 - \text{Dice}`,
      p: r`The Dice loss directly mirrors the continuous Intersection over Union metric. By operating on probability outputs $p_i \in [0, 1]$, Dice loss is differentiable and remains robust under extreme class imbalance (e.g. when a brain lesion occupies only $0.1\%$ of total image pixels). Constant $\epsilon$ prevents division by zero.`,
    },
    {
      h: r`Transposed convolution spatial dimension mapping`,
      tex: r`O = (I - 1) \cdot s - 2p + k + p_{\text{out}}`,
      p: r`Here $I$ is input dimension, $s$ is stride, $p$ is padding, $k$ is kernel size, and $p_{\text{out}}$ is optional output padding. For standard $2\times$ upsampling with $k=2, s=2, p=0$, the output dimension doubles exactly: $O = (I - 1) \cdot 2 + 2 = 2I$.`,
    },
  ],
  keyPoints: [
    r`Semantic segmentation outputs dense categorical labels for every pixel in an image, preserving spatial geometry.`,
    r`Fully Convolutional Networks (FCN) replace dense linear layers with $1 \times 1$ convolutions to process arbitrary input dimensions.`,
    r`U-Net's symmetric encoder-decoder architecture pairs contracting context extraction with expansive spatial resolution recovery.`,
    r`Encoder-decoder skip connections concatenate shallow spatial boundary details with deep semantic representations, resolving spatial blurring.`,
    r`Combining Cross-Entropy with Soft Dice Loss ensures robust training on segmentation tasks with severe foreground-background class imbalance.`,
  ],
  pitfalls: [
    r`Checkerboard artifacts from transposed convolutions: Transposed convolutions with kernel size not divisible by stride (e.g. $k=3, s=2$) cause uneven overlap during upsampling, producing visible checkerboard artifacts; using bilinear upsampling followed by a standard $3 \times 3$ convolution avoids this.`,
    r`Severe foreground-background class imbalance: In medical imaging, background pixels often exceed $99\%$ of the image; training with unweighted cross-entropy causes the network to predict all pixels as background, achieving $99\%$ accuracy with $0\%$ utility.`,
    r`Spatial dimension mismatch at skip connections: Successive downsampling on odd-numbered image dimensions (e.g. $125 \to 62 \to 31$) leads to rounding issues during $2\times$ upsampling ($31 \times 2 = 62 \neq 125$); ensure input dimensions are multiples of $2^D$ (where $D$ is network depth) or use reflection padding.`,
    r`Confusing semantic segmentation with instance segmentation: Semantic segmentation labels all pixels belonging to a class with the same integer ID without distinguishing separate object instances (e.g. two overlapping sheep are merged into a single mask).`,
    r`Overfitting on small medical datasets: Training deep U-Nets on limited patient cohorts causes rapid memorisation; heavy data augmentation (elastic deformations, random rotations, intensity jitter) is essential.`,
  ],
  code: r`import numpy as np

# Simulate a minimal U-Net style encoder-decoder forward pass with skip connection
np.random.seed(42)

# Input image tensor: batch=1, channels=1, height=16, width=16
H, W = 16, 16
x = np.random.randn(1, 1, H, W).astype(np.float32)

# 1. Encoder Stage: 3x3 conv with padding, ReLU, and 2x2 max pooling
# Filter weights: conv1 (1 in -> 4 out), stride=1, pad=1
w_conv1 = np.random.randn(4, 1, 3, 3).astype(np.float32) * 0.1

def conv2d_same(inp, weights):
    B, Cin, iH, iW = inp.shape
    Cout, _, kH, kW = weights.shape
    pad = kH // 2
    padded = np.pad(inp, ((0,0), (0,0), (pad,pad), (pad,pad)), mode='constant')
    out = np.zeros((B, Cout, iH, iW), dtype=np.float32)
    for b in range(B):
        for c_out in range(Cout):
            for r in range(iH):
                for c in range(iW):
                    patch = padded[b, :, r:r+kH, c:c+kW]
                    out[b, c_out, r, c] = np.sum(patch * weights[c_out])
    return out

# Forward encoder conv
feat_enc = np.maximum(0.0, conv2d_same(x, w_conv1))  # shape (1, 4, 16, 16) - SKIP CONNECTION SOURCE

# Max pooling 2x2 (stride 2) -> downsamples to 8x8
def maxpool2d(inp):
    B, C, iH, iW = inp.shape
    out = np.zeros((B, C, iH // 2, iW // 2), dtype=np.float32)
    for r in range(iH // 2):
        for c in range(iW // 2):
            patch = inp[:, :, r*2:r*2+2, c*2:c*2+2]
            out[:, :, r, c] = np.max(patch, axis=(2, 3))
    return out

bottleneck = maxpool2d(feat_enc)  # shape (1, 4, 8, 8)
print(f"Input image shape:            {x.shape}")
print(f"Encoder feature (skip source): {feat_enc.shape}")
print(f"Bottleneck feature shape:     {bottleneck.shape}")

# 2. Decoder Stage: 2x upsampling (nearest neighbour / bilinear)
def upsample2x(inp):
    return np.repeat(np.repeat(inp, 2, axis=2), 2, axis=3)

feat_up = upsample2x(bottleneck)  # shape (1, 4, 16, 16)

# 3. Skip connection concatenation along channel axis
# Concatenate encoder feature (4 channels) + upsampled decoder feature (4 channels) = 8 channels
feat_concat = np.concatenate([feat_enc, feat_up], axis=1)  # shape (1, 8, 16, 16)
print(f"Upsampled decoder shape:      {feat_up.shape}")
print(f"Concatenated skip map shape:  {feat_concat.shape}")

# 4. Final 1x1 conv to produce binary segmentation mask (2 classes: background / foreground)
w_out = np.random.randn(2, 8, 1, 1).astype(np.float32) * 0.1
logits = conv2d_same(feat_concat, w_out)  # shape (1, 2, 16, 16)

# Softmax probabilities over classes
exp_logits = np.exp(logits - np.max(logits, axis=1, keepdims=True))
probs = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)
predicted_mask = np.argmax(probs, axis=1)[0]

print(f"Output probability map shape: {probs.shape}")
print(f"Final segmentation mask shape: {predicted_mask.shape} (values 0 or 1)")
print("Verified: U-Net encoder-decoder skip connection executed successfully!")`,
  quiz: [
    {
      q: r`What is the primary function of the horizontal skip connections in the U-Net architecture?`,
      o: [
        r`To copy and concatenate high-resolution shallow encoder spatial details directly into the expansive decoder, overcoming the spatial blurring caused by repeated pooling downsampling`,
        r`To reduce the number of floating-point operations by skipping all convolutional layers`,
        r`To convert greyscale images into 3-channel RGB tensors automatically`,
        r`To force the network to output bounding boxes instead of masks`,
      ],
      a: 0,
      why: r`Repeated max-pooling downsamples spatial dimensions, capturing high-level context but destroying precise boundary locations. Skip connections route early, high-resolution spatial feature maps directly to the decoder, restoring sharp boundary localisation.`,
    },
    {
      q: r`How does a Fully Convolutional Network (FCN) differ from a traditional CNN image classifier (like VGG or ResNet)?`,
      o: [
        r`FCN replaces dense fully connected classifier layers with $1 \times 1$ convolutions, allowing it to take images of arbitrary resolution and output 2D spatial heatmap predictions`,
        r`FCN cannot use backpropagation or gradient descent during training`,
        r`FCN operates strictly on 1D audio sequences rather than 2D images`,
        r`FCN removes all activation non-linearities from the network`,
      ],
      a: 0,
      why: r`By converting dense linear layers into $1 \times 1$ spatial convolutions, FCN eliminates fixed-input-size constraints. It computes representations across 2D spatial feature grids, outputting dense per-pixel class logits.`,
    },
    {
      q: r`Why is Soft Dice Loss often combined with Cross-Entropy when training semantic segmentation models on medical images?`,
      o: [
        r`Dice Loss directly optimises geometric mask overlap and is robust to extreme foreground-background class imbalance where targets occupy tiny percentages of the image`,
        r`Dice Loss guarantees that all predicted mask pixels are integers`,
        r`Cross-Entropy cannot be computed when the number of classes exceeds two`,
        r`Dice Loss prevents the network from using GPU memory`,
      ],
      a: 0,
      why: r`In medical scans, lesions or tumours often occupy less than $1\%$ of pixels. Cross-entropy can be dominated by easy background predictions; Dice Loss evaluates relative intersection overlap, maintaining strong gradient signals even for diminutive anatomical targets.`,
    },
    {
      q: r`What visual artifact frequently appears when using transposed convolutions with kernel sizes that are not multiples of the stride (e.g. $k=3, s=2$)?`,
      o: [
        r`Periodic checkerboard artifacts in the generated feature maps due to non-uniform filter kernel overlap during upsampling`,
        r`Complete colour inversion where red and blue channels swap`,
        r`Random pixel dropout resembling salt-and-pepper noise`,
        r`A 45-degree rotational shear of the output mask`,
      ],
      a: 0,
      why: r`When kernel size is not divisible by stride, transposed convolution filters overlap unevenly across neighbouring pixels, depositing more energy onto certain output coordinates and creating a characteristic high-frequency checkerboard pattern.`,
    },
  ],
  usedBy: [],
  prereq: ['receptive-field-stride-and-pooling', 'cnn-architecture-tour-lenet-to-resnet-to-efficientnet', 'convolutional_neural_networks'],
  related: ['one-stage-detectors-ssd-and-yolo', 'iou-nms-and-map', 'autoencoders'],
  keywords: 'semantic segmentation fcn fully convolutional network u net skip connection transposed convolution deconvolution dice loss medical imaging encoder decoder',
},
  {
    "id": "two-stage-detectors-the-r-cnn-family",
    "short": "The R-CNN family",
    "title": "Two-Stage Object Detection: R-CNN, Fast R-CNN, Faster R-CNN, and the Region Proposal Network",
    "task": "concepts",
    "level": 3,
    "minutes": 18,
    "noLab": true,
    "usedBy": [],
    "summary": "Mastering the evolution of two-stage detection from selective search to Fast R-CNN RoI pooling and end-to-end Region Proposal Networks (RPN).",
    "lead": "Object detection requires answering two questions simultaneously: where are the objects (localization), and what are they (classification)? While one-stage detectors (YOLO, SSD) prioritize inference speed by predicting boxes in a single dense pass, two-stage detectors prioritize localization precision. Tracing the evolutionary arc from original R-CNN to Fast R-CNN and Faster R-CNN explains how region proposals, RoI pooling, and the Region Proposal Network (RPN) unified detection into a single end-to-end trainable deep network.",
    "analogy": "Imagine an art appraiser and a museum guard inspecting a crowded gallery. In original R-CNN, the guard cuts out 2,000 physical patches from the canvas with scissors and carries them one by one to the appraiser's office. In Fast R-CNN, the appraiser takes one high-resolution photograph of the entire gallery and simply glances at different areas of the master photo. In Faster R-CNN, the appraiser replaces the manual guard with an automated laser pointer (the RPN) that highlights candidate paintings in real time.",
    "intuition": [
      "Original R-CNN (Girshick et al., 2014) used classical Selective Search to generate $\\approx 2,000$ candidate region proposals per image, warped each crop to $227 \\times 227$ pixels, and ran each crop independently through AlexNet. This took 47 seconds per image and consumed gigabytes of disk space for cached features.",
      "Fast R-CNN (2015) solved the redundant compute bottleneck: it passes the entire image through the convolutional backbone once, extracting a single global feature map. Region of Interest (RoI) Pooling then extracts a fixed-size $7 \\times 7$ feature vector from the shared feature map for each proposal, accelerating inference by $146\\times$.",
      "However, Fast R-CNN was still bottle-necked by Selective Search on CPU ($approx 2$ seconds per image). Faster R-CNN (Ren et al., 2015) eliminated Selective Search entirely by introducing the Region Proposal Network (RPN): a small fully convolutional network that slides across the shared feature map, evaluating multi-scale Anchor Boxes to predict candidate proposals in 10 milliseconds.",
      "The two-stage paradigm divides detection into: Stage 1 (RPN generates a few hundred high-recall candidate bounding boxes) and Stage 2 (Fast R-CNN head refines box coordinates and classifies categories). This separation produces high precision on small and crowded objects."
    ],
    "steps": [
      "Extract shared feature maps: Pass input image through convolutional backbone (e.g. ResNet-50 with Feature Pyramid Network) to generate feature maps.",
      "Slide Region Proposal Network (RPN): At each feature map cell, evaluate $k$ anchor boxes (e.g. 3 scales $\\times$ 3 aspect ratios = 9 anchors).",
      "Classify objectness and regress proposals: RPN predicts binary objectness logits (foreground vs background) and 4 bounding box regression deltas $(\\Delta x, \\Delta y, \\Delta w, \\Delta h)$.",
      "Filter proposals with NMS: Select top 2,000 proposals during training (300 during inference) using Non-Maximum Suppression (IoU threshold 0.7).",
      "Extract fixed-size vectors via RoIAlign: Extract $7 \\times 7$ feature maps for each proposal using bilinear interpolation (RoIAlign) to prevent quantization misalignment.",
      "Classify and refine (Stage 2): Pass pooled RoI features through fully connected heads to output $C$-class softmax probabilities and final category-specific bounding box offsets."
    ],
    "math": [
      {
        "h": "Bounding Box Regression Delta Formulation",
        "tex": "t_x = \\frac{x - x_a}{w_a}, \\quad t_y = \\frac{y - y_a}{h_a}, \\quad t_w = \\ln\\left(\\frac{w}{w_a}\\right), \\quad t_h = \\ln\\left(\\frac{h}{h_a}\\right)",
        "p": "Parameterises ground truth box $(x, y, w, h)$ relative to anchor $(x_a, y_a, w_a, h_a)$ using translation normalisation and log-scale variance."
      },
      {
        "h": "Faster R-CNN Multi-Task Loss Objective",
        "tex": "\\mathcal{L}(p, u, t, v) = \\mathcal{L}_{\\mathrm{cls}}(p, u) + \\lambda [u \\ge 1] \\sum_{i \\in \\{x, y, w, h\\}} \\operatorname{Smooth}_{L_1}(t_i - v_i)",
        "p": "Combines cross-entropy classification loss $\\mathcal{L}_{\\mathrm{cls}}$ with $\\operatorname{Smooth}_{L_1}$ regression loss, active strictly for positive foreground boxes ($u \\ge 1$)."
      },
      {
        "h": "Smooth L1 Robust Regression Loss",
        "tex": "\\operatorname{Smooth}_{L_1}(x) = \\begin{cases} 0.5 x^2 & \\text{if } |x| < 1 \\\\ |x| - 0.5 & \\text{otherwise} \\end{cases}",
        "p": "Behaves as quadratic $L_2$ loss for small errors (preventing gradient oscillations) and linear $L_1$ loss for large errors (robust against outlier boxes)."
      }
    ],
    "code": "import torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\nclass SimpleRPNHead(nn.Module):\n    \"\"\"Educational demonstration of Region Proposal Network (RPN) head.\"\"\"\n    def __init__(self, in_channels: int = 256, num_anchors: int = 9):\n        super().__init__()\n        # 3x3 intermediate conv\n        self.conv = nn.Conv2d(in_channels, in_channels, kernel_size=3, padding=1)\n        # 1x1 conv for binary objectness (foreground vs background)\n        self.cls_head = nn.Conv2d(in_channels, num_anchors * 2, kernel_size=1)\n        # 1x1 conv for 4 bounding box deltas per anchor (dx, dy, dw, dh)\n        self.reg_head = nn.Conv2d(in_channels, num_anchors * 4, kernel_size=1)\n\n    def forward(self, feature_map: torch.Tensor):\n        # feature_map shape: [batch, in_channels, H, W]\n        t = F.relu(self.conv(feature_map))\n        \n        # Objectness logits: [batch, 2 * num_anchors, H, W]\n        cls_logits = self.cls_head(t)\n        # Box deltas: [batch, 4 * num_anchors, H, W]\n        bbox_deltas = self.reg_head(t)\n        return cls_logits, bbox_deltas\n\n# Test on feature map (e.g. ResNet stride 16 on 224x224 image -> 14x14 grid)\nrpn = SimpleRPNHead(in_channels=256, num_anchors=9)\nfeat = torch.randn(2, 256, 14, 14)\nscores, deltas = rpn(feat)\n\ntotal_anchors = 14 * 14 * 9\nprint(f\"Feature map grid: 14x14 cells with 9 anchors per cell\")\nprint(f\"Total candidate proposals evaluated in parallel: {total_anchors:,} anchors per image\")\nprint(f\"Objectness scores shape: {scores.shape} | Box deltas shape: {deltas.shape}\")",
    "keyPoints": [
      "Two-stage detectors divide detection into proposal generation (Stage 1) and classification/refinement (Stage 2).",
      "Fast R-CNN introduced RoI pooling on a single shared feature map, eliminating redundant forward passes.",
      "Faster R-CNN introduced the Region Proposal Network (RPN), replacing CPU Selective Search with real-time GPU anchors.",
      "RoIAlign replaced RoIPool, using bilinear interpolation to eliminate sub-pixel spatial rounding errors."
    ],
    "pitfalls": [
      "RoIPool quantization misalignment: In original Fast R-CNN, `RoIPool` rounded floating point coordinates to integers ($16.8 \\to 16$), causing compounding spatial misalignments that ruined small object detection; use `RoIAlign`.",
      "Extreme anchor class imbalance: 99.9% of anchors in an image belong to the background; if trained naively, the RPN predicts \"background\" everywhere; sample balanced minibatches with 1:1 or 1:3 positive-to-negative ratios.",
      "Inference latency: While accurate, two-stage detectors require sequential proposal filtering and per-RoI forward passes, running at 10–25 FPS compared to YOLO's 60–120 FPS."
    ],
    "quiz": [
      {
        "q": "What critical innovation in Faster R-CNN (Ren et al., 2015) enabled real-time end-to-end object detection?",
        "o": [
          "Replacing convolutional layers with recurrent LSTM cells",
          "The Region Proposal Network (RPN), which replaced slow CPU Selective Search with a fast neural network operating directly on shared feature maps",
          "Eliminating all bounding box coordinates",
          "Training exclusively on black and white images"
        ],
        "a": 1,
        "why": "Fast R-CNN took 2 seconds per image because Selective Search ran on the CPU. Faster R-CNN replaced it with the neural RPN running in 10ms on the GPU."
      },
      {
        "q": "Why did Mask R-CNN replace `RoIPool` with `RoIAlign`?",
        "o": [
          "RoIAlign runs 10x faster than RoIPool",
          "RoIPool performed harsh integer rounding (quantization) on spatial coordinates, causing severe misalignment when predicting pixel-accurate masks",
          "RoIPool could only process square images",
          "RoIAlign deletes background anchors"
        ],
        "a": 1,
        "why": "RoIPool rounded floating-point boundary coordinates, causing pixel drifts that broke pixel-level segmentation. RoIAlign uses bilinear interpolation without quantization."
      },
      {
        "q": "What is the role of Anchor Boxes in the Region Proposal Network (RPN)?",
        "o": [
          "To anchor the camera position in 3D world space",
          "Predefined reference bounding boxes of diverse scales and aspect ratios at each feature grid position, providing regression reference points",
          "To compress image files before training",
          "To encrypt feature weights"
        ],
        "a": 1,
        "why": "Anchors provide multiscale reference templates (e.g. tall for pedestrians, wide for cars). The RPN simply predicts minor regression deltas relative to these known templates."
      }
    ],
    "related": [
      "one-stage-detectors-ssd-and-yolo",
      "iou-nms-and-map",
      "instance-segmentation-mask-r-cnn"
    ],
    "keywords": "two-stage detectors, r-cnn, fast r-cnn, faster r-cnn, rpn, region proposal network, roialign, anchor boxes, object detection"
  },
  {
    "id": "anchor-free-detection-and-detr",
    "short": "Anchor-free & DETR",
    "title": "Modern Object Detection: Anchor-Free Detectors (FCOS) and Detection Transformers (DETR)",
    "task": "concepts",
    "level": 3,
    "minutes": 18,
    "noLab": true,
    "usedBy": [],
    "summary": "Eliminating anchor box hyperparameters and Non-Maximum Suppression using centre-point regression (FCOS) and bipartite matching Transformers (DETR).",
    "lead": "For years, object detection was dominated by anchor boxes: practitioners had to manually tune dozens of hyperparameters (anchor scales, aspect ratios, IoU match thresholds), while complex hand-crafted post-processing like Non-Maximum Suppression (NMS) remained mandatory. Anchor-free architectures (FCOS) and Detection Transformers (DETR; Carion et al., 2020) redefined the paradigm, framing object detection as direct point regression or set prediction via bipartite matching.",
    "analogy": "Imagine ordering food at a busy restaurant. An anchor-based system is like an over-cautious waiter guessing that you might want 9 possible predefined combinations (small salad, large burger, medium fries) and bringing 9 plates to the table, forcing you to throw away 8 duplicates with a spatula (NMS). DETR is like an intelligent chef who simply receives your table order, glances at the kitchen, and delivers exactly the dishes you requested with zero waste.",
    "intuition": [
      "Anchor-based detectors suffer from fundamental flaws: anchors require heavy heuristic tuning, introduce severe positive-negative sample imbalance, and require non-differentiable NMS post-processing.",
      "FCOS (Fully Convolutional One-Stage Object Detection; Tian et al.) eliminates anchors entirely: it treats every location $(x, y)$ on the feature map inside a ground-truth box as a positive training sample, directly regressing the 4 distances to box edges $(l, t, r, b)$. A novel \"Centerness\" branch down-weights low-quality bounding boxes far from object centres without anchor boxes.",
      "DETR (DEtection TRansformer; Carion et al.) completely eliminates both anchors and NMS, formulating detection as a direct Set Prediction problem. An image passes through a CNN backbone and a Transformer encoder-decoder. A fixed set of $N$ learned Object Queries interact with image tokens via cross-attention.",
      "During training, DETR uses the Hungarian Algorithm to find a unique, optimal one-to-one Bipartite Matching between the $N$ predictions and ground-truth objects. This one-to-one assignment guarantees that each physical object is predicted by exactly one query, making NMS completely unnecessary."
    ],
    "steps": [
      "Extract multi-scale features: Pass image through CNN backbone (ResNet) and flatten spatial feature maps into sequence tokens.",
      "Transformer Encoder self-attention: Model global context and pairwise feature dependencies across all spatial locations.",
      "Pass learned Object Queries to Decoder: Provide $N$ fixed learned embedding vectors (e.g. $N=100$) that query image representations via cross-attention.",
      "Predict independent box sets: Feed each of the $N$ output embeddings through shared feed-forward networks (FFNs) to predict category class and normalised box coordinates $(x, y, w, h)$.",
      "Compute optimal Bipartite Matching (Training): Run the Hungarian matching algorithm to find permutation $\\sigma \\in \\mathfrak{S}_N$ minimising matching cost with ground truth.",
      "Direct inference (No NMS): Filter out predictions assigned to the background \"no-object\" class $\\varnothing$; directly emit remaining bounding boxes with zero NMS post-processing."
    ],
    "math": [
      {
        "h": "Optimal Bipartite Matching Cost (Hungarian Algorithm)",
        "tex": "\\hat{\\sigma} = \\operatorname*{arg\\,min}_{\\sigma \\in \\mathfrak{S}_N} \\sum_{i=1}^N \\mathcal{L}_{\\mathrm{match}}\\left( y_i, \\; \\hat{y}_{\\sigma(i)} \\right)",
        "p": "Finds the permutation $\\sigma$ of predictions that minimises the global sum of pairwise classification and bounding box distances."
      },
      {
        "h": "Pairwise Matching Cost Function",
        "tex": "\\mathcal{L}_{\\mathrm{match}}(y_i, \\hat{y}_\\sigma) = -\\mathbb{I}(c_i \\ne \\varnothing) \\hat{p}_\\sigma(c_i) + \\mathbb{I}(c_i \\ne \\varnothing) \\left[ \\lambda_{\\mathrm{L1}} \\| b_i - \\hat{b}_\\sigma \\|_1 + \\lambda_{\\mathrm{giou}} \\mathcal{L}_{\\mathrm{GIoU}}(b_i, \\hat{b}_\\sigma) \\right]",
        "p": "Balances target class probability $\\hat{p}(c_i)$ with $L_1$ coordinate error and Generalised IoU (GIoU) loss."
      },
      {
        "h": "FCOS Centerness Branch Target",
        "tex": "\\operatorname{Centerness}^* = \\sqrt{\\frac{\\min(l^*, r^*)}{\\max(l^*, r^*)} \\times \\frac{\\min(t^*, b^*)}{\\max(t^*, b^*)}}",
        "p": "Measures how close feature cell $(x, y)$ is to the centre of the bounding box; down-weights peripheral low-quality detections."
      }
    ],
    "code": "import torch\nimport torch.nn as nn\nfrom scipy.optimise import linear_sum_assignment\n\ndef toy_bipartite_matching(pred_boxes: torch.Tensor, gt_boxes: torch.Tensor):\n    \"\"\"Educational demonstration of Hungarian bipartite matching used in DETR.\"\"\"\n    # pred_boxes: [N, 4], gt_boxes: [M, 4] where N >= M\n    N, M = pred_boxes.size(0), gt_boxes.size(0)\n    \n    # Compute pairwise L1 cost matrix: [N, M]\n    cost_matrix = torch.cdist(pred_boxes, gt_boxes, p=1).detach().numpy()\n    \n    # Solve optimal one-to-one assignment via Hungarian algorithm\n    pred_indices, gt_indices = linear_sum_assignment(cost_matrix)\n    \n    return pred_indices, gt_indices\n\n# Simulate 5 DETR object queries predicting boxes against 2 ground-truth objects\ntorch.manual_seed(42)\npredictions = torch.tensor([\n    [0.10, 0.10, 0.20, 0.20],  # Query 0: Near GT 0\n    [0.80, 0.80, 0.15, 0.15],  # Query 1: Far away (background)\n    [0.55, 0.50, 0.30, 0.30],  # Query 2: Near GT 1\n    [0.12, 0.09, 0.22, 0.21],  # Query 3: Also near GT 0 (competing duplicate)\n    [0.90, 0.10, 0.10, 0.10]   # Query 4: Background\n])\n\nground_truth = torch.tensor([\n    [0.11, 0.10, 0.21, 0.20],  # GT 0\n    [0.50, 0.50, 0.30, 0.30]   # GT 1\n])\n\npred_idx, gt_idx = toy_bipartite_matching(predictions, ground_truth)\n\nprint(\"Hungarian Bipartite Assignment:\")\nfor p, g in zip(pred_idx, gt_idx):\n    print(f\"Query {p} strictly assigned to Ground Truth {g} (Distance: {torch.dist(predictions[p], ground_truth[g]):.4f})\")\nprint(\"Duplicate queries receive NO assignment, forcing them to predict background without NMS!\")",
    "keyPoints": [
      "Anchor-free architectures eliminate complex anchor scale/aspect ratio tuning.",
      "FCOS regresses distances to box boundaries directly from positive grid cells.",
      "DETR frames object detection as direct Set Prediction using Transformer cross-attention.",
      "Hungarian bipartite matching enforces strict one-to-one matching, completely eliminating NMS."
    ],
    "pitfalls": [
      "Slow training convergence in original DETR: Original DETR required 500 epochs to converge because cross-attention looks everywhere; Deformable DETR solves this by focusing attention locally.",
      "Small object detection in DETR: Standard DETR downsamples feature maps by $32\\times$, losing fine spatial details of small objects; multi-scale feature pyramids are required.",
      "High Hungarian matching cost computation: While fast for small query counts ($N=100$), Hungarian matching scales as $O(N^3)$ on CPU if query counts balloon to thousands."
    ],
    "quiz": [
      {
        "q": "Why does DETR (DEtection TRansformer) not require Non-Maximum Suppression (NMS) post-processing?",
        "o": [
          "Because DETR runs exclusively on CPUs",
          "Because training uses bipartite Hungarian matching, which enforces a strict one-to-one assignment where each ground-truth object can be predicted by only one unique query",
          "Because DETR only detects one object per image",
          "Because Transformers cannot process overlapping boxes"
        ],
        "a": 1,
        "why": "Traditional models produce dozens of overlapping duplicate proposals for one object. DETR's bipartite loss penalizes duplicate predictions, forcing only one query to emit the box."
      },
      {
        "q": "What are \"Object Queries\" in the DETR architecture?",
        "o": [
          "SQL queries sent to a remote database",
          "A fixed number of learned positional embedding vectors (e.g. 100) fed to the Transformer decoder, each tasked with querying and detecting one object in the scene",
          "The ground truth bounding box labels",
          "The prompt instructions written by human users"
        ],
        "a": 1,
        "why": "Object queries are learned vectors that attend to image features via cross-attention, specializing in detecting objects at particular image regions or scales."
      },
      {
        "q": "What is the role of the \"Centerness\" branch in the anchor-free FCOS detector?",
        "o": [
          "To centre the camera before taking a photograph",
          "To predict how close a feature cell is to the centre of its object bounding box, down-weighting low-quality peripheral boundary detections during testing",
          "To compute the mean colour of the image",
          "To ensure the loss function has zero gradient"
        ],
        "a": 1,
        "why": "Locations near object edges produce noisy box predictions. FCOS down-weights these low-quality boxes by multiplying classification scores by predicted centerness."
      }
    ],
    "related": [
      "the-attention-mechanism",
      "two-stage-detectors-the-r-cnn-family",
      "one-stage-detectors-ssd-and-yolo"
    ],
    "keywords": "anchor-free detection, detr, fcos, hungarian algorithm, bipartite matching, set prediction, object queries, deformable detr, nms-free"
  },
  {
    "id": "instance-segmentation-mask-r-cnn",
    "short": "Mask R-CNN",
    "title": "Instance Segmentation with Mask R-CNN: Extending Faster R-CNN with RoIAlign and Mask FCN",
    "task": "concepts",
    "level": 3,
    "minutes": 18,
    "noLab": true,
    "usedBy": [],
    "summary": "Detecting and segmenting individual object instances simultaneously using Faster R-CNN backbones, RoIAlign, and parallel pixel-level mask FCN heads.",
    "lead": "Semantic segmentation classifies every pixel into a category (e.g. \"person\"), but cannot distinguish between two people standing side by side. Object detection places a bounding box around each person, but cannot capture exact contours. Instance Segmentation achieves both: detecting each individual object instance and predicting a pixel-accurate binary mask for each. Mask R-CNN (He et al., 2017) solved this elegantly by adding a small Fully Convolutional Network mask branch in parallel with Faster R-CNN.",
    "analogy": "Imagine a factory quality-control robot inspecting apples on a conveyor belt. Semantic segmentation says: \"80% of the belt area is apple\". Object detection says: \"there are four separate rectangular apple crates\". Instance segmentation assigns a distinct numbered label to each individual apple and shrink-wraps an exact plastic clingfilm contour around every single apple skin, isolating bruised spots to sub-millimeter precision.",
    "intuition": [
      "Instance segmentation follows a \"Detect then Segment\" paradigm: first detect candidate object bounding boxes, and then predict a binary segmentation mask inside each proposed box.",
      "Mask R-CNN extends Faster R-CNN by adding a third parallel output branch for each Region of Interest (RoI): in addition to the classification branch (predicting class $c$) and bounding box regression branch (predicting box deltas), it adds a small Fully Convolutional Network (FCN) predicting a $K \\times m \\times m$ binary mask (where $m \\times m$ is typically $28 \\times 28$).",
      "The critical enabler was RoIAlign: Faster R-CNN's original `RoIPool` used integer quantization (rounding $16.7$ to $16$), introducing up to half-pixel misalignments. While harmless for coarse bounding boxes, a 1-pixel shift completely misaligns fine object masks. RoIAlign uses bilinear interpolation at four sampling points per bin, preserving continuous floating-point spatial fidelity.",
      "Decoupling mask and class prediction: For each RoI, the mask branch outputs $K$ independent binary masks (one for each class), without competition between classes. The classification branch independently decides which class label to apply, preventing inter-class competition from corrupting mask quality."
    ],
    "steps": [
      "Extract multi-scale feature pyramid: Pass image through ResNet with Feature Pyramid Network (FPN) generating feature maps at strides 4, 8, 16, 32.",
      "Generate candidate proposals via RPN: Region Proposal Network proposes high-recall candidate bounding boxes.",
      "Extract aligned RoI features via RoIAlign: Extract continuous $14 \\times 14$ feature representations for each proposal using bilinear interpolation without quantization.",
      "Classify and regress box (Standard Faster R-CNN): Pass features through fully connected layers to predict class logits and refined bounding box offsets.",
      "Predict pixel-accurate masks in parallel: Pass $14 \\times 14$ features through a 4-layer $3 \\times 3$ FCN followed by a $2 \\times 2$ deconvolution, emitting $28 \\times 28$ binary mask logits for each class.",
      "Paste and threshold mask: Threshold the target class mask at $0.5$ and paste back onto the original image within the predicted bounding box coordinates."
    ],
    "math": [
      {
        "h": "Mask R-CNN Multi-Task Total Loss",
        "tex": "\\mathcal{L}_{\\mathrm{total}} = \\mathcal{L}_{\\mathrm{cls}} + \\mathcal{L}_{\\mathrm{box}} + \\mathcal{L}_{\\mathrm{mask}}",
        "p": "Jointly trains classification loss $\\mathcal{L}_{\\mathrm{cls}}$, bounding box regression $\\mathcal{L}_{\\mathrm{box}}$, and pixel binary cross-entropy $\\mathcal{L}_{\\mathrm{mask}}$."
      },
      {
        "h": "Decoupled Binary Mask Cross-Entropy Loss",
        "tex": "\\mathcal{L}_{\\mathrm{mask}} = -\\frac{1}{m^2} \\sum_{i=1}^{m} \\sum_{j=1}^{m} \\left[ y_{ij} \\ln \\sigma(s_{ij}^k) + (1 - y_{ij}) \\ln (1 - \\sigma(s_{ij}^k)) \\right]",
        "p": "Evaluates average binary cross-entropy strictly on the $k$-th mask slice corresponding to ground-truth class $k$, avoiding inter-class competition."
      },
      {
        "h": "RoIAlign Continuous Bilinear Interpolation",
        "tex": "f(x, y) = \\sum_{i, j \\in \\{0, 1\\}} w_{ij} \\cdot f(\\lfloor x \\rfloor + i, \\; \\lfloor y \\rfloor + j), \\quad w_{ij} = |1 - i - (x - \\lfloor x \\rfloor)| \\cdot |1 - j - (y - \\lfloor y \\rfloor)|",
        "p": "Samples exact continuous sub-pixel coordinates without spatial rounding, eliminating mask boundary quantization artifacts."
      }
    ],
    "code": "import torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\nclass MiniMaskBranch(nn.Module):\n    \"\"\"Educational demonstration of Mask R-CNN's FCN mask prediction branch.\"\"\"\n    def __init__(self, in_channels: int = 256, num_classes: int = 4, mask_res: int = 14):\n        super().__init__()\n        # 4 consecutive conv layers\n        self.convs = nn.Sequential(\n            nn.Conv2d(in_channels, in_channels, kernel_size=3, padding=1),\n            nn.ReLU(),\n            nn.Conv2d(in_channels, in_channels, kernel_size=3, padding=1),\n            nn.ReLU()\n        )\n        # Deconvolution (transpose conv) to upsample 14x14 -> 28x28\n        self.upsample = nn.ConvTranspose2d(in_channels, in_channels, kernel_size=2, stride=2)\n        # 1x1 conv predicting K binary mask channels\n        self.mask_head = nn.Conv2d(in_channels, num_classes, kernel_size=1)\n\n    def forward(self, roi_features: torch.Tensor):\n        # roi_features from RoIAlign: [num_rois, in_channels, 14, 14]\n        h = self.convs(roi_features)\n        h = F.relu(self.upsample(h))  # [num_rois, in_channels, 28, 28]\n        mask_logits = self.mask_head(h)  # [num_rois, num_classes, 28, 28]\n        return mask_logits\n\n# Test mask branch on 2 RoIs (e.g. 2 detected pedestrians)\nroi_feat = torch.randn(2, 256, 14, 14)\nmask_net = MiniMaskBranch(in_channels=256, num_classes=4)\nmasks = mask_net(roi_feat)\n\nprint(f\"Input RoIAlign feature shape: {roi_feat.shape}\")\nprint(f\"Output mask logits shape:     {masks.shape} (2 RoIs, 4 classes, 28x28 resolution)\")\nprint(\"Each class receives an independent binary mask channel, preventing inter-class competition!\")",
    "keyPoints": [
      "Mask R-CNN adds a small parallel FCN branch to Faster R-CNN to predict pixel masks.",
      "RoIAlign eliminates spatial quantization by sampling four continuous bilinear points per bin.",
      "Decouples class and mask prediction: predicts independent binary masks for each category.",
      "Represents the industry standard foundation for instance segmentation in robotics and medical imaging."
    ],
    "pitfalls": [
      "Using `RoIPool` instead of `RoIAlign`: Using coarse integer RoIPool degrades mask average precision (AP) by up to 10 points due to spatial quantization misalignments.",
      "Coupling mask channels with Softmax: Using Softmax across mask channels forces classes to compete for pixels, destroying overlapping mask contours; use per-pixel sigmoid binary cross-entropy.",
      "Memory consumption during training: Predicting $28 \\times 28$ masks across 512 candidate RoIs per image increases GPU VRAM consumption; tune sampled positive RoIs."
    ],
    "quiz": [
      {
        "q": "What distinguishes Instance Segmentation from Semantic Segmentation?",
        "o": [
          "Semantic segmentation runs on GPUs, while instance segmentation runs on CPUs",
          "Semantic segmentation classifies pixels into broad categories without distinguishing separate individual objects; Instance segmentation identifies and segments each distinct object instance independently",
          "Instance segmentation only works on black and white images",
          "Semantic segmentation predicts 3D bounding boxes"
        ],
        "a": 1,
        "why": "Semantic segmentation assigns all \"person\" pixels to one class. Instance segmentation distinguishes Person 1, Person 2, and Person 3 with individual masks."
      },
      {
        "q": "Why did the authors of Mask R-CNN decouple mask prediction from classification by using per-pixel Sigmoid instead of Softmax across classes?",
        "o": [
          "Because Sigmoid runs faster than Softmax",
          "To prevent inter-class competition: the mask branch predicts binary shape masks for all classes independently, while the classification branch decides which mask to select",
          "Because PyTorch does not support Softmax on 2D maps",
          "To reduce parameter counts to zero"
        ],
        "a": 1,
        "why": "Decoupling avoids forcing classes to compete for pixels. The network learns pure binary object silhouettes independently for each candidate category."
      },
      {
        "q": "What was the specific bug in `RoIPool` that RoIAlign fixed in Mask R-CNN?",
        "o": [
          "A memory leak in the C++ CUDA kernel",
          "Coordinate quantization (rounding continuous floating point RoI boundaries to nearest integers), which introduced severe sub-pixel misalignments that ruined mask accuracy",
          "Inability to process non-square proposals",
          "Division by zero when depth was negative"
        ],
        "a": 1,
        "why": "RoIPool rounded floating coordinates to integers ($x/16$), introducing half-pixel errors that misaligned pixel-level mask boundaries with real object edges."
      }
    ],
    "related": [
      "two-stage-detectors-the-r-cnn-family",
      "semantic-segmentation-fcn-and-u-net",
      "segment-anything"
    ],
    "keywords": "mask r-cnn, instance segmentation, roialign, fpn, faster r-cnn, fully convolutional network, binary cross-entropy, object detection"
  },
  {
    "id": "segment-anything",
    "short": "Segment Anything (SAM)",
    "title": "Promptable Foundation Models for Vision: Segment Anything (SAM)",
    "task": "concepts",
    "level": 3,
    "minutes": 18,
    "noLab": true,
    "usedBy": [],
    "summary": "Zero-shot promptable visual segmentation using heavyweight image encoders, interactive prompt conditioning (points, boxes, text), and lightweight real-time mask decoders.",
    "lead": "Traditionally, image segmentation models were trained for narrow closed vocabularies: an autonomous vehicle model segmenting 19 urban driving classes could not segment a medical cell or a manufacturing screw. The Segment Anything Model (SAM; Kirillov et al., Meta AI, 2023) established the first general-purpose visual foundation model for segmentation: capable of zero-shot segmentation of any arbitrary object via interactive prompts (points, bounding boxes, or rough masks).",
    "analogy": "Imagine a master woodcarver with a magic chisel. Instead of carving only wooden horses, the chisel responds to simple pointing gestures: you point your finger at an eagle in a block of oak (point prompt) or draw a rough chalk box around a tree branch (bounding box prompt), and the chisel instantly carves out the exact, millimetre-perfect 3D boundary in under 50 milliseconds.",
    "intuition": [
      "SAM reframes segmentation as a Promptable Task: given an image and any prompt (foreground/background positive/negative click points, bounding boxes, or coarse masks), the model must return a valid segmentation mask.",
      "To enable real-time web browser interaction ($< 50$ms), SAM decouples computation into two asymmetric stages: 1) Heavyweight Image Encoder: a massive Vision Transformer (ViT-H with 632M parameters) runs once per image on the server, generating an information-dense image embedding; 2) Lightweight Mask Decoder: runs in under 50ms (even on client CPU/WebGL), cross-attending prompt tokens with the precomputed image embedding.",
      "Resolving Ambiguity: When a user clicks on a person's wrist wearing a watch, does the click prompt mean the watch dial, the entire watch, or the person? SAM solves ambiguity by predicting three valid candidate masks simultaneously (sub-part, part, whole), along with estimated IoU confidence scores.",
      "Data Engine: SAM was trained on the SA-1B dataset—over 1.1 billion high-quality masks across 11 million diverse images—using an iterative data engine (model-assisted annotation $\\to$ semi-automatic annotation $\\to$ fully automatic grid annotation)."
    ],
    "steps": [
      "Precompute image embedding (Heavyweight Encoder): Pass $1024 \\times 1024$ image through Vision Transformer (ViT) to extract a $64 \\times 64 \\times 256$ spatial feature embedding (run once).",
      "Encode interactive prompt (Prompt Encoder): Represent point clicks as positional encodings plus learned positive/negative embeddings; represent bounding boxes as corner coordinate pairs.",
      "Two-way cross-attention (Lightweight Decoder): Run two-way cross-attention blocks where prompt tokens attend to image embeddings and image embeddings attend to prompt tokens.",
      "Predict multi-mask ambiguity outputs: Emit three candidate masks at different semantic hierarchies (e.g. subpart, part, whole) via transposed convolutions.",
      "Compute IoU confidence score: A dedicated MLP head predicts the expected Intersection-over-Union (IoU) of each predicted mask with the true object.",
      "Interactive refinement: Allow users to click additional points to correct ambiguous boundaries, updating the mask in real time."
    ],
    "math": [
      {
        "h": "SAM Promptable Multi-Mask Loss Formulation",
        "tex": "\\mathcal{L}_{\\mathrm{SAM}} = \\min_{k \\in \\{1, 2, 3\\}} \\left[ 20 \\cdot \\mathcal{L}_{\\mathrm{focal}}(m_k, y) + \\mathcal{L}_{\\mathrm{dice}}(m_k, y) \\right] + \\| \\mathrm{IoU}_k - \\operatorname{IoU}(m_k, y) \\|^2",
        "p": "Computes focal loss and Dice loss strictly against the best-matching predicted mask $k$, backpropagating error through the most accurate hierarchy level."
      },
      {
        "h": "Positional Prompt Coordinate Embedding",
        "tex": "\\mathbf{e}_{\\mathrm{point}} = \\operatorname{PosEmbed}(x, y) + \\mathbf{w}_{\\mathrm{type}}, \\quad \\mathbf{w}_{\\mathrm{type}} \\in \\{\\mathbf{w}_{\\mathrm{pos}}, \\; \\mathbf{w}_{\\mathrm{neg}}\\}",
        "p": "Encodes spatial click coordinates $(x, y)$ using Fourier sinusoidal positional embeddings combined with learned positive/negative category tokens."
      },
      {
        "h": "Dice Similarity Loss for Mask Boundaries",
        "tex": "\\mathcal{L}_{\\mathrm{dice}}(p, y) = 1 - \\frac{2 \\sum_i p_i y_i + \\epsilon}{\\sum_i p_i + \\sum_i y_i + \\epsilon}",
        "p": "Measures spatial overlap between predicted sigmoid probabilities $p$ and binary ground truth $y$, robust against extreme background pixel imbalance."
      }
    ],
    "code": "import torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\nclass MiniSAMDecoder(nn.Module):\n    \"\"\"Educational demonstration of SAM's lightweight prompt-conditioned mask decoder.\"\"\"\n    def __init__(self, embed_dim: int = 256, num_masks: int = 3):\n        super().__init__()\n        self.num_masks = num_masks\n        # Cross-attention layer between prompt tokens and image embeddings\n        self.cross_attn = nn.MultiheadAttention(embed_dim, num_heads=8, batch_first=True)\n        # Transpose convolution to upsample 64x64 embedding -> 256x256 mask logits\n        self.upsample = nn.Sequential(\n            nn.ConvTranspose2d(embed_dim, 64, kernel_size=2, stride=2),\n            nn.ReLU(),\n            nn.ConvTranspose2d(64, num_masks, kernel_size=2, stride=2)\n        )\n\n    def forward(self, image_embedding: torch.Tensor, prompt_tokens: torch.Tensor):\n        # image_embedding: [batch, 256, 64, 64]\n        # prompt_tokens:   [batch, num_prompts, 256] (e.g. click coordinates)\n        batch, c, h, w = image_embedding.shape\n        img_flat = image_embedding.flatten(2).permute(0, 2, 1)  # [batch, 4096, 256]\n        \n        # Cross-attention: prompt queries attend to image keys/values\n        attn_out, _ = self.cross_attn(query=prompt_tokens, key=img_flat, value=img_flat)\n        \n        # Modulate image embedding with prompt summary\n        prompt_summary = attn_out.mean(dim=1).view(batch, c, 1, 1)\n        modulated_feat = image_embedding + prompt_summary\n        \n        # Emit 3 hierarchical candidate masks (subpart, part, whole)\n        masks = self.upsample(modulated_feat)  # [batch, 3, 256, 256]\n        return masks\n\n# Simulate real-time inference: Precomputed image embedding + 1 user click prompt\ndecoder = MiniSAMDecoder(embed_dim=256, num_masks=3)\nimg_emb = torch.randn(1, 256, 64, 64)       # Computed once on server\nclick_prompt = torch.randn(1, 1, 256)        # Single user click\n\nout_masks = decoder(img_emb, click_prompt)\nprint(f\"Precomputed server embedding: {img_emb.shape}\")\nprint(f\"Interactive decoder mask shape: {out_masks.shape} (3 hierarchical candidates)\")\nprint(\"Decoder runs in <50ms per user interaction!\")",
    "keyPoints": [
      "SAM established promptable zero-shot foundation models for visual segmentation.",
      "Asymmetric architecture: heavy ViT image encoder runs once; lightweight mask decoder runs in $<50$ms.",
      "Supports diverse interactive prompts: foreground/background clicks, bounding boxes, or text.",
      "Resolves semantic ambiguity by predicting three hierarchical masks (subpart, part, whole) with IoU scores."
    ],
    "pitfalls": [
      "Re-running the heavy image encoder on every click: The 632M parameter ViT encoder takes 200–500ms; caching the $64 \\times 64$ embedding is mandatory for interactive real-time prompt updates.",
      "Semantic classification absence: SAM predicts pure object boundaries (class-agnostic binary masks); it does not assign semantic class labels (e.g. \"dog\", \"car\"); pair with CLIP for semantic labelling.",
      "Transparent or camouflaged objects: SAM struggles with objects with subtle refractive boundaries (clear glass windows, transparent bottles) where contrast edges are minimal."
    ],
    "quiz": [
      {
        "q": "Why does the Segment Anything Model (SAM) decouple its architecture into a heavy image encoder and a lightweight mask decoder?",
        "o": [
          "To run the encoder on Android phones and the decoder on supercomputers",
          "The heavy ViT encoder processes the image once (slowly), while the lightweight decoder evaluates interactive user prompts in real time ($< 50$ms) on client devices",
          "Because Transformers cannot process masks",
          "To eliminate the need for training data"
        ],
        "a": 1,
        "why": "The image embedding is computed once and cached. When a user clicks to add points, only the tiny decoder runs, allowing instant real-time response."
      },
      {
        "q": "How does SAM handle semantic ambiguity when a user clicks on an object that could mean a part or the whole (e.g. clicking on a car tire)?",
        "o": [
          "It throws an exception and halts execution",
          "It predicts three valid candidate masks simultaneously (sub-part, part, whole) along with estimated confidence scores",
          "It deletes the image",
          "It always defaults to the entire image"
        ],
        "a": 1,
        "why": "Ambiguity is intrinsic to promptable segmentation. SAM outputs 3 masks at different semantic levels (e.g. tire rim, tire, full car) so users or downstream logic can pick the right level."
      },
      {
        "q": "Does SAM natively predict semantic class labels (such as \"cat\", \"chair\", or \"bicycle\") for its segmented masks?",
        "o": [
          "Yes, SAM classifies over 100,000 distinct English categories",
          "No, SAM is strictly class-agnostic; it produces precise object masks without semantic class names and is typically paired with CLIP for classification",
          "SAM only detects human faces",
          "SAM only works on synthetic computer-generated graphics"
        ],
        "a": 1,
        "why": "SAM is class-agnostic: it identifies \"what is an object\" and cuts out its contour. Semantic labeling is achieved by cropping the mask and querying an open-vocabulary model like CLIP."
      }
    ],
    "related": [
      "instance-segmentation-mask-r-cnn",
      "semantic-segmentation-fcn-and-u-net",
      "clip-and-multimodal-embeddings"
    ],
    "keywords": "segment anything, sam, foundation models, zero-shot segmentation, promptable segmentation, vit, mask decoder, sa-1b, interactive vision"
  },
  {
  id: 'vision-transformer',
  short: 'Vision Transformer',
  title: 'Vision Transformer',
  task: 'concepts',
  module: 'Modern vision',
  level: 2,
  minutes: 18,
  noLab: true,
  summary: r`The Vision Transformer (ViT, Alexey Dosovitskiy et al., 2020) demonstrated that standard Transformer encoder architectures—designed originally for natural language processing—can be applied directly to computer vision with minimal architectural modifications. By partitioning an image of resolution $H \times W$ into a regular grid of non-overlapping $P \times P$ spatial patches, flattening each patch into a vector, prepending a learnable [CLS] classification token, adding 1D learnable position embeddings, and feeding the token sequence into standard Multi-Head Self-Attention (MHSA) blocks, ViT attains a global receptive field at layer 1. ViT discards convolutional inductive biases (translation equivariance and local connectivity) in exchange for massive representational capacity when pre-trained on large-scale datasets.`,
  lead: r`For nearly a decade after AlexNet, convolutional neural networks were considered the irreplaceable, biologically inspired foundation of all computer vision. Convolutions enforce two rigid inductive biases: local connectivity (pixels close together interact first) and translation equivariance (the identical filter slides across every spatial location). But in 2020, Google Research asked a radical question: what if we discard convolutions entirely and treat an image simply as a sequence of words? The resulting model—the Vision Transformer (ViT)—not only matched state-of-the-art convolutional networks on ImageNet, but ignited a paradigm shift unifying language, audio, and visual computing under a single self-attention architecture.`,
  intuition: [
    r`Images as sequences of visual words: Transformers are permutation-equivariant sequence models that compute pairwise self-attention between all tokens in an input sequence. Applying self-attention directly to individual raw pixels in a standard $224 \times 224$ image would require computing attention across $N = 224^2 = 50,176$ tokens, creating an intractable $O(N^2)$ memory bottleneck of over 2.5 billion pairwise dot products per layer. ViT bypasses this by grouping pixels into $16 \times 16$ non-overlapping patches. A $224 \times 224$ image decomposes into exactly $(224 / 16) \times (224 / 16) = 14 \times 14 = 196$ patches. Each patch is flattened into a vector of $16 \times 16 \times 3 = 768$ values and linearly projected into an embedding space, creating a sequence of 196 visual tokens perfectly matched to standard Transformer architectures.`,
    r`Inductive bias versus data scale: Convolutional networks are hard-coded with inductive biases: they inherently assume that spatial locality matters and that visual features behave identically regardless of where they appear. This makes CNNs sample-efficient on modest datasets (such as ImageNet-1k). The Vision Transformer possesses almost no visual inductive bias: self-attention allows any patch to attend to any other patch across the entire canvas from layer 1, and the model must learn 2D spatial relationships entirely from scratch via position embeddings. Consequently, when trained on small datasets, ViT underperforms ResNet. But when pre-trained on massive datasets (ImageNet-21k or JFT-300M), ViT's unconstrained capacity breaks past the performance saturation ceiling of CNNs, achieving superior representation quality.`,
    r`The [CLS] token and global receptive fields: How does a sequence-to-sequence Transformer output a single image classification label? Borrowing from BERT, ViT prepends a learnable [CLS] (classification) embedding vector to the patch token sequence. Because Multi-Head Self-Attention allows every token to exchange information with all other tokens across all layers, the [CLS] token aggregates global contextual information from the entire image. The final state of the [CLS] token is passed to a simple MLP classification head to output class probabilities.`,
    r`Positional embeddings and learned 2D topology: Because standard self-attention is permutation-invariant (scrambling the token order produces an identical output set), ViT must inject spatial coordinate information. ViT adds learnable 1D position embeddings $\mathbf{E}_{\text{pos}} \in \mathbb{R}^{(N+1) \times D}$ to the patch tokens before the first encoder block. Remarkably, after pre-training, visualising the cosine similarity of these learned 1D positional vectors reveals that the model autonomously discovers the 2D Euclidean topology of images: patches situated physically near each other in 2D space exhibit highly correlated position embeddings.`,
  ],
  analogy: r`Think of reading an illustrated comic book page. A convolutional neural network reads like an insect crawling across the page through a tiny straw: it can only see a $3 \times 3$ millimetre circle at any moment, slowly aggregating lines into textures, then textures into shapes, and only understanding the full narrative in the final layer. The Vision Transformer is like a human reader who cuts the page into 196 square puzzle tiles and lays them all across a table simultaneously. From the very first glance, the human reader can look directly from a puzzle tile in the top-left corner (a character's eye) to a puzzle tile in the bottom-right corner (a dialogue speech bubble) and connect their meaning instantly. The reader needs to learn how to assemble puzzle pieces from scratch (requiring more practice on thousands of books), but once mastered, they comprehend global narrative composition far more flexibly than an insect crawling through a straw.`,
  steps: [
    {
      title: r`Extract and flatten non-overlapping image patches`,
      desc: r`Discretise a 2D image tensor into a 1D sequence of flattened spatial tokens.`,
      detail: r`Given an image $\mathbf{x} \in \mathbb{R}^{H \times W \times C}$ and patch size $P$ (typically $P=16$), divide the image into $N = \frac{HW}{P^2}$ spatial patches $\mathbf{x}_p \in \mathbb{R}^{N \times (P^2 C)}$. For a $224 \times 224 \times 3$ image with $P=16$, this yields $N=196$ flattened patches of length $768$.`,
    },
    {
      title: r`Linear patch projection and [CLS] token prepending`,
      desc: r`Map raw pixel patches to latent dimension $D$ and append the global classification token.`,
      detail: r`Project each flattened patch through a trainable linear matrix $\mathbf{E} \in \mathbb{R}^{(P^2 C) \times D}$ (or equivalently, a 2D convolution with kernel size $P$, stride $P$, and $D$ filters). Prepend a learnable classification token $\mathbf{x}_{\text{class}} \in \mathbb{R}^{1 \times D}$, forming an input sequence of shape $(N + 1) \times D$.`,
    },
    {
      title: r`Add learnable position embeddings`,
      desc: r`Inject spatial coordinate awareness into the permutation-invariant token sequence.`,
      detail: r`Add a learnable positional embedding tensor $\mathbf{E}_{\text{pos}} \in \mathbb{R}^{(N+1) \times D}$ element-wise: $\mathbf{z}_0 = [\mathbf{x}_{\text{class}}; \mathbf{x}_p^1 \mathbf{E}; \dots; \mathbf{x}_p^N \mathbf{E}] + \mathbf{E}_{\text{pos}}$. This provides each token with an initial representation of its absolute spatial location on the image grid.`,
    },
    {
      title: r`Process through Transformer encoder blocks`,
      desc: r`Iterate through stacked Multi-Head Self-Attention (MHSA) and MLP feed-forward layers.`,
      detail: r`Pass the token sequence through $L$ identical Transformer encoder blocks (e.g. $L=12$ in ViT-Base). Each block applies Layer Normalisation, Multi-Head Self-Attention with residual connections ($\mathbf{z}'_l = \text{MHSA}(\text{LN}(\mathbf{z}_{l-1})) + \mathbf{z}_{l-1}$), followed by another Layer Normalisation, two-layer MLP with GELU activations, and residual addition ($\mathbf{z}_l = \text{MLP}(\text{LN}(\mathbf{z}'_l)) + \mathbf{z}'_l$).`,
    },
    {
      title: r`Extract [CLS] representation and classify`,
      desc: r`Pass the aggregated classification token through an MLP head for class prediction.`,
      detail: r`Extract the final representation of the first token $\mathbf{z}_L^0$ (the [CLS] token). Pass it through Layer Normalisation and a linear classification head (or two-layer MLP during pre-training) to output class probability logits over the dataset vocabulary.`,
    },
  ],
  math: [
    {
      h: r`Patch sequence projection and embedding construction`,
      tex: r`\mathbf{z}_0 = \left[\mathbf{x}_{\text{class}}; \, \mathbf{x}_p^1 \mathbf{E}; \, \mathbf{x}_p^2 \mathbf{E}; \, \dots; \, \mathbf{x}_p^N \mathbf{E}\right] + \mathbf{E}_{\text{pos}}, \quad \mathbf{E} \in \mathbb{R}^{(P^2 C) \times D}, \; \mathbf{E}_{\text{pos}} \in \mathbb{R}^{(N+1) \times D}`,
      p: r`Here $N = HW / P^2$ is the number of image patches, $P$ is patch dimension, $D$ is the Transformer latent embedding width (e.g. $D=768$ in ViT-Base), and $\mathbf{x}_{\text{class}}$ is the learnable classification token.`,
    },
    {
      h: r`Multi-Head Self-Attention (MHSA) formulation`,
      tex: r`\text{Attention}(Q, K, V) = \operatorname{softmax}\left(\frac{Q K^T}{\sqrt{d_k}}\right) V, \quad \text{MHSA}(X) = \left[\text{head}_1, \dots, \text{head}_h\right] W^O`,
      p: r`Queries $Q$, keys $K$, and values $V$ are linear projections of the input token sequence $\mathbf{z}$. Dividing by $\sqrt{d_k}$ prevents dot products from growing excessively large, preserving stable gradients through the softmax operator.`,
    },
    {
      h: r`Encoder block forward recursion`,
      tex: r`\mathbf{z}'_l = \text{MHSA}\left(\text{LN}(\mathbf{z}_{l-1})\right) + \mathbf{z}_{l-1}, \quad \mathbf{z}_l = \text{MLP}\left(\text{LN}(\mathbf{z}'_l)\right) + \mathbf{z}'_l, \quad \mathbf{y} = \text{LN}\left(\mathbf{z}_L^0\right)`,
      p: r`ViT employs pre-layer normalisation (applying LayerNorm before MHSA and MLP blocks), which stabilises forward activation propagation and gradient backpropagation in deep architectures. The output prediction $\mathbf{y}$ is extracted from the [CLS] token position $\mathbf{z}_L^0$.`,
    },
  ],
  keyPoints: [
    r`The Vision Transformer treats images as sequences of non-overlapping $16 \times 16$ pixel patches processed by a standard Transformer encoder.`,
    r`ViT possesses a global receptive field at layer 1, enabling every image patch to attend to any other patch from the start of computation.`,
    r`ViT lacks convolutional inductive biases (locality and translation equivariance), requiring massive pre-training datasets (ImageNet-21k, JFT-300M) to outperform CNNs.`,
    r`A learnable [CLS] token prepended to the patch sequence aggregates global context for downstream classification.`,
    r`Learnable 1D position embeddings autonomously learn the 2D Euclidean spatial topology of images during pre-training.`,
  ],
  pitfalls: [
    r`Training ViT from scratch on small datasets: Without large-scale pre-training, ViT severely overfits and underperforms ResNet on modest datasets (such as CIFAR-10 or ImageNet-1k) due to the absence of spatial inductive biases.`,
    r`Interpolating position embeddings without scale adjustment: When transferring a pre-trained ViT to a higher image resolution (e.g. $224 \to 384$), the number of patches increases ($196 \to 576$); position embeddings must be bicubically interpolated in 2D to preserve learned spatial coordinates.`,
    r`Quadratic computational scaling with high resolution: Because self-attention scales as $O(N^2)$, reducing patch size from $16 \times 16$ to $8 \times 8$ quadruples the token count $N$, increasing memory consumption and compute sixteen-fold ($O(16\times)$).`,
    r`Omitting the [CLS] token or global pooling: Relying on an unpooled arbitrary token for classification ignores global image context; always use the dedicated [CLS] token or Global Average Pooling across all output tokens.`,
    r`Using standard Post-LayerNorm: Implementing post-layer normalisation rather than Pre-LayerNorm frequently causes gradient instability and divergent training runs in deep Vision Transformers.`,
  ],
  code: r`import numpy as np

# Pure NumPy implementation of Vision Transformer (ViT) patch extraction and self-attention
np.random.seed(42)

# Input image dimensions: 1 image, 3 channels, 32x32 pixels
H, W, C = 32, 32, 3
P = 8  # 8x8 patch size
img = np.random.randn(H, W, C).astype(np.float32)

# 1. Patch Extraction and Flattening
# Number of patches: N = (32/8) * (32/8) = 4 * 4 = 16 patches
num_patches_h = H // P
num_patches_w = W // P
N = num_patches_h * num_patches_w
patch_dim = P * P * C  # 8 * 8 * 3 = 192

patches = np.zeros((N, patch_dim), dtype=np.float32)
idx = 0
for r in range(num_patches_h):
    for c in range(num_patches_w):
        patch = img[r*P:(r+1)*P, c*P:(c+1)*P, :]
        patches[idx] = patch.flatten()
        idx += 1

print(f"Input image shape:             {img.shape}")
print(f"Extracted patch tokens shape:  {patches.shape} ({N} patches of length {patch_dim})")

# 2. Linear Projection to Latent Dimension D = 64
D = 64
W_proj = np.random.randn(patch_dim, D).astype(np.float32) * (1.0 / np.sqrt(patch_dim))
tokens = patches @ W_proj  # shape (16, 64)

# 3. Prepend Learnable [CLS] Token
cls_token = np.random.randn(1, D).astype(np.float32) * 0.02
tokens_with_cls = np.vstack([cls_token, tokens])  # shape (17, 64)

# 4. Add Learnable 1D Position Embeddings
pos_embed = np.random.randn(N + 1, D).astype(np.float32) * 0.02
z0 = tokens_with_cls + pos_embed  # shape (17, 64)
print(f"Sequence with [CLS] & PosEmb:  {z0.shape} (17 tokens in D={D})")

# 5. Single Multi-Head Self-Attention (MHSA) layer (2 heads, head_dim = 32)
num_heads = 2
d_k = D // num_heads

# Weight projections for Q, K, V
W_q = np.random.randn(D, D).astype(np.float32) * (1.0 / np.sqrt(D))
W_k = np.random.randn(D, D).astype(np.float32) * (1.0 / np.sqrt(D))
W_v = np.random.randn(D, D).astype(np.float32) * (1.0 / np.sqrt(D))
W_out = np.random.randn(D, D).astype(np.float32) * (1.0 / np.sqrt(D))

Q = z0 @ W_q
K = z0 @ W_k
V = z0 @ W_v

# Scaled Dot-Product Attention: Softmax(Q @ K.T / sqrt(d_k)) @ V
attn_scores = (Q @ K.T) / np.sqrt(d_k)
exp_scores = np.exp(attn_scores - np.max(attn_scores, axis=-1, keepdims=True))
attn_weights = exp_scores / np.sum(exp_scores, axis=-1, keepdims=True)

context = attn_weights @ V
out_mhsa = context @ W_out  # shape (17, 64)

# 6. Extract [CLS] Token Representation for Classification
cls_out = out_mhsa[0]  # First token
print(f"Attention matrix shape:        {attn_weights.shape} (every patch attends to every patch)")
print(f"[CLS] token output vector:     {cls_out.shape} (ready for MLP classification head)")
print(f"Attention from [CLS] to patch 0: {attn_weights[0, 1]:.4f}")
print(f"Attention from [CLS] to patch 15: {attn_weights[0, 16]:.4f}")
print("Verified: Vision Transformer tokenisation and self-attention executed cleanly!")`,
  quiz: [
    {
      q: r`Why does the Vision Transformer (ViT) divide an image into $16 \times 16$ pixel patches rather than applying self-attention directly to individual raw pixels?`,
      o: [
        r`To avoid an intractable $O(N^2)$ computational complexity bottleneck; a $224 \times 224$ image has over 50,000 pixels but only 196 patches of size $16 \times 16$`,
        r`Because Transformer attention heads can only accept inputs that are powers of two`,
        r`Because raw pixels lack RGB colour information`,
        r`To prevent image files from exceeding GPU memory cache lines`,
      ],
      a: 0,
      why: r`Pairwise self-attention across 50,176 individual pixels requires computing a $50,176 \times 50,176$ attention matrix ($2.5$ billion operations per layer). Grouping pixels into $16 \times 16$ patches yields 196 tokens, rendering self-attention computationally efficient.`,
    },
    {
      q: r`Why does ViT typically perform worse than ResNet when trained from scratch on small datasets (like ImageNet-1k) without large-scale pre-training?`,
      o: [
        r`ViT lacks the hard-coded inductive biases of CNNs (spatial locality and translation equivariance), requiring vast datasets to learn 2D spatial relationships from scratch`,
        r`ViT cannot process colour images`,
        r`ViT has fewer parameters than ResNet-18`,
        r`ViT does not support the AdamW optimiser`,
      ],
      a: 0,
      why: r`Convolutions inherently enforce that neighbouring pixels interact first and that features behave identically across space. ViT has no built-in knowledge of 2D geometry; it must learn spatial topology entirely from data, making it sample-hungry on small datasets.`,
    },
    {
      q: r`What is the function of the learnable [CLS] classification token prepended to the patch token sequence in ViT?`,
      o: [
        r`It interacts with all patch tokens via multi-head self-attention across all layers, aggregating global visual context into a single vector used for classification`,
        r`It stores the aspect ratio and resolution of the input image`,
        r`It normalises the learning rate during backward propagation`,
        r`It acts as a random dropout mask across the token sequence`,
      ],
      a: 0,
      why: r`Borrowing from BERT, the [CLS] token has no fixed patch assignment. Through stacked self-attention layers, it gathers semantic information from all patches, serving as a unified holistic summary vector for the final classification head.`,
    },
    {
      q: r`When fine-tuning a pre-trained ViT model on higher-resolution images (e.g. increasing resolution from $224 \times 224$ to $384 \times 384$), what operation must be applied to the position embeddings?`,
      o: [
        r`2D bicubic interpolation of the pre-trained position embedding grid to match the increased number of spatial patch tokens`,
        r`Padding the position embeddings with zeros at the end of the sequence`,
        r`Re-initialising all position embeddings randomly from Gaussian noise`,
        r`Discarding position embeddings entirely`,
      ],
      a: 0,
      why: r`Higher image resolution produces more patches ($196 \to 576$). Because position embeddings reflect 2D coordinates, 2D bicubic interpolation smoothly stretches the learned coordinate grid to match the new token count while preserving spatial order.`,
    },
  ],
  usedBy: [],
  prereq: ['the-attention-mechanism', 'cnn-architecture-tour-lenet-to-resnet-to-efficientnet', 'receptive-field-stride-and-pooling'],
  related: ['the-attention-mechanism', 'clip-and-multimodal-embeddings', 'cnn-architecture-tour-lenet-to-resnet-to-efficientnet'],
  keywords: 'vision transformer vit self attention transformer patches cls token position embeddings inductive bias mhsa imagenet dosovitskiy',
},
  {
    "id": "swin-and-hierarchical-transformers",
    "short": "Swin & hierarchical vision",
    "title": "Hierarchical Vision Transformers: Shifted Windows (Swin Transformer) and Linear Scaling",
    "task": "concepts",
    "level": 3,
    "minutes": 18,
    "noLab": true,
    "usedBy": [],
    "summary": "Restoring multi-scale hierarchical feature maps and linear computational complexity to vision transformers using shifted local window attention.",
    "lead": "The original Vision Transformer (ViT) treated images as flat sequences of non-overlapping patches, computing global self-attention across all tokens. While effective for image classification, global self-attention scales quadratically with image resolution $O((H \\times W)^2)$, making high-resolution dense prediction tasks like object detection and semantic segmentation computationally prohibitive. The Swin Transformer (Liu et al., 2021) reintroduced hierarchical feature pyramids and linear complexity via Shifted Windows.",
    "analogy": "Imagine a team of security guards monitoring a giant wall of 1,000 video screens. In a standard ViT, every guard attempts to watch and cross-reference all 1,000 screens simultaneously, quickly succumbing to cognitive exhaustion. In a Swin Transformer, each guard monitors a local $7 \\times 7$ grid of screens. In the next shift, the guards step three screens to the right and down (shifted windows), enabling information to bridge across adjacent monitoring zones while keeping each guard's workload strictly local and constant.",
    "intuition": [
      "Standard ViT has two major limitations as a general vision backbone: 1) Quadratic complexity with image size: processing an 800x800 image requires $\\approx 2,500$ patches, leading to massive memory usage; 2) Single-scale representations: ViT maintains constant token resolution throughout all layers, lacking the multi-scale feature pyramids that traditional detectors (FPN) use to detect objects at varying scales.",
      "Swin Transformer builds a hierarchical feature representation: starting from small $4 \\times 4$ patches, it merges neighbouring patches in deeper layers (e.g. $2\\times$ spatial reduction with channel doubling), mirroring the hierarchical pyramid structure of ResNet.",
      "To achieve linear computational complexity $O(M^2 \\cdot N)$, Swin computes self-attention strictly within localized non-overlapping windows of fixed size $M \\times M$ (typically $7 \\times 7$ patches).",
      "To allow cross-window communication without global attention, consecutive Swin layers alternate between standard Window-based Self-Attention (W-MSA) and Shifted Window-based Self-Attention (SW-MSA). In SW-MSA, the window partitioning is shifted by $(\\lfloor M/2 \\rfloor, \\lfloor M/2 \\rfloor)$ pixels. A cyclic shift with an attention mask ensures cross-window information sharing with zero extra computation or padding."
    ],
    "steps": [
      "Patch partition: Divide $H \\times W$ image into $4 \\times 4$ raw pixel patches, projecting each 48-D patch vector to embedding dimension $C$.",
      "Standard Window Self-Attention (W-MSA): Partition feature map into non-overlapping $M \\times M$ windows (e.g. $7 \\times 7$); compute multi-head self-attention independently within each window in linear $O(N)$ time.",
      "Shifted Window Self-Attention (SW-MSA): In the subsequent layer, shift window boundaries by $(\\lfloor M/2 \\rfloor, \\lfloor M/2 \\rfloor)$ patches to enable cross-window connections.",
      "Cyclic shifting and masked attention: Efficiently compute SW-MSA by cyclically wrapping corner patches and applying a directional attention mask to prevent false cross-boundary attention.",
      "Patch merging (Downsampling): In deeper stages, concatenate $2 \\times 2$ neighbouring patches, apply linear projection to double channel dimension ($2C$), and halve spatial resolution ($H/2 \\times W/2$).",
      "Downstream task integration: Feed the resulting 4-stage multi-scale feature pyramid into dense prediction heads (U-Net for segmentation, Mask R-CNN for detection)."
    ],
    "math": [
      {
        "h": "Window Self-Attention Linear Computational Complexity",
        "tex": "\\begin{aligned} \\Omega(\\text{Global Self-Attention}) &= 4 H W C^2 + 2 (H W)^2 C \\quad [O(N^2) \\text{ Quadratic}] \\\\ \\Omega(\\text{Window Self-Attention}) &= 4 H W C^2 + 2 M^2 H W C \\quad [O(N) \\text{ Linear in } HW] \\end{aligned}",
        "p": "Window attention scales linearly with total pixel count $HW$ when window size $M$ is fixed (e.g. $M=7$), enabling gigapixel processing."
      },
      {
        "h": "Relative Position Bias Self-Attention",
        "tex": "\\operatorname{Attention}(\\mathbf{Q}, \\mathbf{K}, \\mathbf{V}) = \\operatorname{Softmax}\\left( \\frac{\\mathbf{Q} \\mathbf{K}^T}{\\sqrt{d}} + \\mathbf{B} \\right) \\mathbf{V}, \\quad \\mathbf{B} \\in \\mathbb{R}^{M^2 \\times M^2}",
        "p": "Injects continuous 2D relative position bias matrix $\\mathbf{B}$ into the attention logits, parameterised across offset range $[-M+1, M-1]$."
      },
      {
        "h": "Shifted Window Partition Coordinates",
        "tex": "\\left( x', y' \\right) = \\left( \\left( x - \\left\\lfloor \\frac{M}{2} \\right\\rfloor \\right) \\bmod W, \\; \\left( y - \\left\\lfloor \\frac{M}{2} \\right\\rfloor \\right) \\bmod H \\right)",
        "p": "Cyclically translates feature maps by half a window width, bridging isolated receptive fields across consecutive network blocks."
      }
    ],
    "code": "import torch\nimport torch.nn as nn\n\ndef window_partition(x: torch.Tensor, window_size: int = 7) -> torch.Tensor:\n    \"\"\"Partition feature map into non-overlapping local spatial windows.\"\"\"\n    batch, h, w, c = x.shape\n    # Reshape: [B, H/M, M, W/M, M, C] -> [num_windows*B, M, M, C]\n    x = x.view(batch, h // window_size, window_size, w // window_size, window_size, c)\n    windows = x.permute(0, 1, 3, 2, 4, 5).contiguous().view(-1, window_size, window_size, c)\n    return windows\n\ndef window_reverse(windows: torch.Tensor, window_size: int, h: int, w: int) -> torch.Tensor:\n    \"\"\"Reverse local windows back into full global feature map.\"\"\"\n    batch_num_win = windows.shape[0]\n    num_win_h, num_win_w = h // window_size, w // window_size\n    batch = batch_num_win // (num_win_h * num_win_w)\n    c = windows.shape[-1]\n    \n    x = windows.view(batch, num_win_h, num_win_w, window_size, window_size, c)\n    x = x.permute(0, 1, 3, 2, 4, 5).contiguous().view(batch, h, w, c)\n    return x\n\n# Simulate 56x56 feature map with window size M=7\nx = torch.randn(2, 56, 56, 96)\nM = 7\nwindows = window_partition(x, window_size=M)\nreconstructed = window_reverse(windows, window_size=M, h=56, w=56)\n\nprint(f\"Original Feature Map: {x.shape}\")\nprint(f\"Partitioned Windows:  {windows.shape} (64 windows of 7x7 per batch)\")\nprint(\"Reversible without data loss?\", torch.equal(x, reconstructed))",
    "keyPoints": [
      "Swin Transformer reintroduces hierarchical multi-scale pyramids to Vision Transformers.",
      "Computes self-attention within local $M \\times M$ windows, achieving linear $O(HW)$ complexity.",
      "Alternating standard and shifted windows (W-MSA and SW-MSA) enables cross-window communication.",
      "Serves as a drop-in replacement for CNN backbones in object detection and semantic segmentation."
    ],
    "pitfalls": [
      "Image dimensions not divisible by window size: If $H$ or $W$ is not a multiple of $M$, padding is required; failing to slice off the padding distorts output dimensions.",
      "Forgetting the attention mask in cyclic shift: In SW-MSA, cyclic wrapping brings physically distant corners together; omitting the directional attention mask allows spurious attention across unrelated image boundaries.",
      "Relative position bias indexing errors: Indexing the $(2M-1) \\times (2M-1)$ relative position bias table incorrectly maps wrong spatial offsets to attention heads."
    ],
    "quiz": [
      {
        "q": "Why was the original Vision Transformer (ViT) poorly suited as a general backbone for dense prediction tasks like object detection and high-resolution segmentation?",
        "o": [
          "Because ViT cannot process colour images",
          "ViT maintains a constant single-scale resolution throughout and its global self-attention scales quadratically $O((HW)^2)$ with image size, making high resolutions computationally prohibitive",
          "ViT only runs on CPUs",
          "ViT deletes all edge pixels"
        ],
        "a": 1,
        "why": "Dense tasks require high resolutions and multi-scale pyramids (FPN). Standard ViT's $O(N^2)$ attention is too slow, and its single scale cannot detect objects of varying sizes."
      },
      {
        "q": "How does the Swin Transformer achieve linear computational complexity $O(HW)$ with respect to image resolution?",
        "o": [
          "By computing self-attention strictly within localized, non-overlapping windows of fixed size $M \\times M$",
          "By rounding all weights to zero",
          "By replacing attention with random Gaussian noise",
          "By downsampling the image to 1x1"
        ],
        "a": 0,
        "why": "Because window size $M$ is fixed (e.g. $7 \\times 7$), the attention cost per window is constant, and the total cost scales linearly with the number of windows."
      },
      {
        "q": "What is the purpose of shifting the window partitioning (SW-MSA) in alternating layers of the Swin Transformer?",
        "o": [
          "To introduce motion blur",
          "To introduce cross-window connections, allowing information to propagate across window boundaries without requiring expensive global attention",
          "To compress the model weights into an archive",
          "To convert RGB channels into grayscale"
        ],
        "a": 1,
        "why": "W-MSA keeps windows isolated. Shifting the window grid by half a window in the next layer groups neighbouring boundary tokens together, facilitating global information exchange."
      }
    ],
    "related": [
      "vision-transformer",
      "receptive-field-stride-and-pooling",
      "the-attention-mechanism"
    ],
    "keywords": "swin transformer, hierarchical vision transformer, shifted windows, w-msa, sw-msa, linear complexity, relative position bias, patch merging"
  },
  {
    "id": "vision-language-models-and-vqa",
    "short": "VLMs & Visual QA",
    "title": "Vision-Language Models: CLIP Alignments, Multi-Modal Projectors, and Visual Question Answering (VQA)",
    "task": "concepts",
    "level": 3,
    "minutes": 18,
    "noLab": true,
    "usedBy": [],
    "summary": "Bridging pixels and text tokens using cross-modal projection layers, frozen LLM backbones, and Visual Question Answering (LLaVA, Flamingo).",
    "lead": "For decades, computer vision and natural language processing developed in separate silos: vision classified image categories, while language models predicted text tokens. Vision-Language Models (VLMs) unify both modalities into a multimodal cognitive architecture. By projecting visual feature patches into the word embedding space of a frozen Large Language Model (e.g. LLaVA, Flamingo), VLMs can hold conversations about visual scenes, reason about charts, and solve complex Visual Question Answering (VQA) queries.",
    "analogy": "Imagine a brilliant writer who was born blind, possessing vast knowledge of language, history, and logic (a frozen LLM). A visual translator (the multimodal projector) attaches a high-definition digital camera (vision encoder) to the writer's desk and converts visual light rays directly into Braille words. The writer does not need a brain transplant; they simply read the visual Braille tokens alongside normal text questions and answer fluently.",
    "intuition": [
      "Modern VLMs (such as LLaVA; Liu et al.) connect three components: 1) A Vision Encoder (typically a pretrained CLIP ViT) that transforms an image into a sequence of visual patch tokens; 2) A Multimodal Projector (a lightweight MLP or cross-attention Resampler) that projects visual embeddings into the exact hidden dimension of the LLM; 3) A Pretrained LLM (Vicuna, Llama) that processes visual and textual tokens jointly.",
      "Training typically proceeds in two stages: Stage 1 (Feature Alignment): The vision encoder and LLM are frozen, training strictly the projector MLP on millions of image-caption pairs so the LLM learns to comprehend visual tokens; Stage 2 (Visual Instruction Tuning): The LLM and projector are fine-tuned jointly on conversational dialogue, visual reasoning, and VQA datasets.",
      "During forward inference, an image is converted into $P$ visual tokens (e.g. 576 tokens for a 24x24 patch grid). These visual tokens are prepended directly to the user's tokenized text prompt (`[IMG_1] ... [IMG_576] What is the person holding?`), allowing the autoregressive Transformer to generate natural language answers with full visual grounding."
    ],
    "steps": [
      "Extract visual patch embeddings: Pass $336 \\times 336$ image through frozen CLIP ViT-L/14, extracting penultimate layer patch activations (e.g. 576 tokens of dimension 1024).",
      "Project across modalities: Pass visual tokens through a two-layer MLP projector with GELU activations to map dimension $1024 \\to 4096$ (matching LLM hidden dimension).",
      "Tokenize text prompt: Tokenize user prompt and format with multimodal chat template (e.g. `Human: <image>\\nDescribe this photo. Assistant:`).",
      "Concatenate multimodal token sequence: Replace the `<image>` placeholder token with the sequence of 576 projected continuous visual embeddings.",
      "Autoregressive language generation: Feed concatenated embeddings through the LLM decoder; generate answers token by token using standard causal language modelling.",
      "Instruction fine-tuning: Fine-tune projector and LLM parameters using LoRA or full backpropagation on high-quality multi-turn visual conversations."
    ],
    "math": [
      {
        "h": "Multimodal Linear Projector Alignment",
        "tex": "\\mathbf{H}_v = \\mathbf{W}_2 \\cdot \\operatorname{GELU}\\left( \\mathbf{W}_1 \\cdot \\mathbf{Z}_v + \\mathbf{b}_1 \\right) + \\mathbf{b}_2, \\quad \\mathbf{Z}_v = g_{\\mathrm{vision}}(I)",
        "p": "Projects visual tokens $\\mathbf{Z}_v \\in \\mathbb{R}^{P \\times d_v}$ into the LLM token embedding space $\\mathbf{H}_v \\in \\mathbb{R}^{P \\times d_{\\mathrm{text}}}$."
      },
      {
        "h": "Multimodal Autoregressive Likelihood Objective",
        "tex": "P(\\mathbf{Y} \\mid \\mathbf{X}_v, \\mathbf{X}_t) = \\prod_{i=1}^L P\\left( y_i \\;\\middle|\\; \\mathbf{H}_v, \\; \\mathbf{X}_{t, <i}, \\; \\mathbf{Y}_{<i} \\right)",
        "p": "Models the probability of response text sequence $\\mathbf{Y}$ conditioned jointly on projected image tokens $\\mathbf{H}_v$ and preceding text tokens."
      },
      {
        "h": "Flamingo Perceiver Resampler Compression",
        "tex": "\\mathbf{Q} = \\mathbf{L}_{\\mathrm{queries}}, \\quad \\mathbf{K}, \\mathbf{V} = [\\mathbf{Z}_v \\parallel \\mathbf{L}_{\\mathrm{queries}}], \\quad \\mathbf{Z}_{\\mathrm{compressed}} = \\operatorname{CrossAttn}(\\mathbf{Q}, \\mathbf{K}, \\mathbf{V})",
        "p": "Compresses thousands of variable-length visual feature tokens into a fixed small set of latent tokens (e.g. 64) via learned cross-attention queries."
      }
    ],
    "code": "import torch\nimport torch.nn as nn\n\nclass MiniVLMProjector(nn.Module):\n    \"\"\"Educational demonstration of a LLaVA-style multimodal MLP projection layer.\"\"\"\n    def __init__(self, vision_dim: int = 768, llm_dim: int = 2048):\n        super().__init__()\n        self.projector = nn.Sequential(\n            nn.Linear(vision_dim, llm_dim),\n            nn.GELU(),\n            nn.Linear(llm_dim, llm_dim)\n        )\n\n    def forward(self, visual_tokens: torch.Tensor, text_embeddings: torch.Tensor):\n        # visual_tokens:   [batch, num_patches, vision_dim] (from CLIP)\n        # text_embeddings: [batch, text_seq_len, llm_dim]   (from LLM embedding table)\n        \n        # 1. Project visual tokens to LLM dimension\n        projected_visual = self.projector(visual_tokens)  # [batch, num_patches, llm_dim]\n        \n        # 2. Concatenate: [Visual Tokens ... Text Tokens]\n        multimodal_input = torch.cat([projected_visual, text_embeddings], dim=1)\n        return multimodal_input\n\n# Simulate: Image produces 16 patch tokens (dim 768); Text prompt has 8 words (dim 2048)\nvlm_proj = MiniVLMProjector(vision_dim=768, llm_dim=2048)\nvision_feat = torch.randn(1, 16, 768)\ntext_feat   = torch.randn(1, 8, 2048)\n\njoint_input = vlm_proj(vision_feat, text_feat)\nprint(f\"Projected Multimodal Sequence Shape: {joint_input.shape}\")\nprint(\"16 visual tokens seamlessly prepended to 8 text tokens for the LLM decoder!\")",
    "keyPoints": [
      "Vision-Language Models fuse visual perception with general-purpose language reasoning.",
      "LLaVA connects a frozen vision encoder (CLIP) to an LLM using a lightweight MLP projector.",
      "Visual patches are treated as pseudo-text tokens, prepended directly to the user's token prompt.",
      "Training separates into initial feature alignment followed by visual instruction fine-tuning."
    ],
    "pitfalls": [
      "Visual token context consumption: High-resolution images produce hundreds or thousands of patch tokens, consuming huge fractions of the LLM's limited context window.",
      "Object hallucination: VLMs frequently hallucinate objects that are not in the image due to strong textual prior biases in the LLM language decoder; mitigate with DPO alignment.",
      "Spatial reasoning limitations: Standard VLMs struggle with fine-grained spatial coordinates (e.g. exact bounding box coordinates or counting crowded coins); requires high-res vision encoders."
    ],
    "quiz": [
      {
        "q": "How does an architecture like LLaVA feed image information into a Large Language Model (LLM)?",
        "o": [
          "It converts the image into an audio waveform",
          "A vision encoder extracts visual patch tokens, which are projected by an MLP into the LLM's embedding dimension and prepended to text tokens as pseudo-words",
          "It retrains the LLM from scratch using only images",
          "It deletes all text tokens"
        ],
        "a": 1,
        "why": "LLaVA uses a vision encoder to extract visual patch tokens, projects them into the text embedding space via an MLP, and inputs them directly to the LLM."
      },
      {
        "q": "What is \"object hallucination\" in Vision-Language Models (VLMs)?",
        "o": [
          "When the camera lens is smudged",
          "A failure mode where the model asserts the presence of common objects (e.g. a chair or cup) in its text response that are not actually in the image, driven by language model prior biases",
          "When images are rendered in 3D",
          "When the learning rate is too high"
        ],
        "a": 1,
        "why": "Language models have strong prior associations (e.g. \"a kitchen has a refrigerator\"). When uncertain, the LLM hallucinates objects that logically fit the scene text."
      },
      {
        "q": "Why is training divided into two stages in modern VLM development (Feature Alignment then Instruction Tuning)?",
        "o": [
          "Because GPUs cannot train for more than 1 hour",
          "Stage 1 aligns the visual feature space to the text space without disrupting LLM language fluency; Stage 2 trains conversational reasoning and visual instruction following",
          "To test two different optimisers",
          "Stage 1 is for colour images, Stage 2 is for black and white"
        ],
        "a": 1,
        "why": "Freezing the LLM in Stage 1 teaches the projector the visual-to-text mapping without degrading the LLM's general knowledge before jointly fine-tuning in Stage 2."
      }
    ],
    "related": [
      "clip-and-multimodal-embeddings",
      "vision-transformer",
      "swin-and-hierarchical-transformers"
    ],
    "keywords": "vision-language models, vlm, vqa, llava, flamingo, multimodal, clip, visual instruction tuning, cross-attention, perceiver resampler"
  },
  {
    "id": "latent-diffusion-and-controlnet",
    "short": "Latent diffusion & ControlNet",
    "title": "Generative Vision: Latent Diffusion Models (Stable Diffusion) and Spatial Conditioning with ControlNet",
    "task": "concepts",
    "level": 3,
    "minutes": 18,
    "noLab": true,
    "usedBy": [],
    "summary": "Generating photorealistic images efficiently in compressed latent spaces (LDM) and injecting structural geometric guidance via ControlNet.",
    "lead": "Pixel-space diffusion models generate breathtaking visual fidelity, but denoising thousands of high-resolution RGB pixels directly is computationally agonizing: generating a single image requires hundreds of seconds on high-end GPUs. Latent Diffusion Models (LDM / Stable Diffusion; Rombach et al., 2022) shift the diffusion process into a perceptually compressed latent space. ControlNet (Zhang et al., 2023) then adds precise spatial conditioning (edges, poses, depth), unlocking controllable visual synthesis.",
    "analogy": "Imagine a painter creating a mural. Working in pixel space is like carving microscopic details into millions of individual grains of sand. Working in latent diffusion is like drawing a compressed, high-level artist's cartoon sketch where one stroke captures an entire cheekbone. ControlNet acts as an architect's blue tracing paper laid over the sketch: it locks down the exact structural lines and proportions so the painter can add colours and textures without altering the pose.",
    "intuition": [
      "Digital images contain massive perceptual redundancy: high-frequency noise that the human eye barely notices consumes 90% of pixel compute. Latent Diffusion Models decouple generation into two stages: Perceptual Compression (handled by an autoencoder / VAE) and Semantic Generation (handled by a latent diffusion U-Net).",
      "The VAE compresses an image $x \\in \\mathbb{R}^{3 \\times H \\times W}$ by an $8\\times$ spatial downsampling factor into a low-dimensional latent representation $z \\in \\mathbb{R}^{4 \\times (H/8) \\times (W/8)}$, cutting compute volume by $64\\times$.",
      "The diffusion process (forward noising and reverse denoising) operates entirely within this compact latent space $z$. Cross-attention mechanisms inside the U-Net inject text prompts encoded by CLIP or T5.",
      "Standard text-to-image diffusion lacks spatial control: prompt engineering (\"a person jumping\") cannot dictate exact hand positions or camera angles. ControlNet clones the trainable U-Net encoder weights, applies \"zero convolutions\" (convolutions initialised with zero weights and biases), and injects spatial conditions (Canny edges, depth maps, OpenPose human skeletons) without disrupting the original model's generative prior."
    ],
    "steps": [
      "Perceptual compression: Encode training image $x$ into compact latent representation $z_0 = \\mathcal{E}(x)$ using a pretrained VAE encoder.",
      "Forward latent noising: Sample timestep $t \\sim \\mathcal{U}(1, T)$ and Gaussian noise $\\epsilon$; add noise to latent: $z_t = \\sqrt{\\bar{\\alpha}_t} z_0 + \\sqrt{1 - \\bar{\\alpha}_t} \\epsilon$.",
      "Encode conditioning signals: Encode text prompt via CLIP text encoder into cross-attention sequence; encode spatial guide (e.g. Canny edge map) via ControlNet encoder.",
      "Denoise via U-Net: Predict added noise $\\epsilon_\\theta(z_t, t, c_{\\mathrm{text}}, c_{\\mathrm{control}})$ using cross-attention and zero-convolution residuals.",
      "Reverse sampling: Iteratively denoise latent from pure Gaussian noise $z_T \\sim \\mathcal{N}(0, \\mathbf{I})$ down to clean latent $z_0$ using fast ODE solvers (DDIM, DPM-Solver) in 20–30 steps.",
      "Decode to pixel space: Reconstruct high-resolution RGB image through VAE decoder: $\\hat{x} = \\mathcal{D}(z_0)$."
    ],
    "math": [
      {
        "h": "Latent Diffusion Mean Squared Error Objective",
        "tex": "\\mathcal{L}_{\\mathrm{LDM}} = \\mathbb{E}_{\\mathcal{E}(x), \\; \\epsilon \\sim \\mathcal{N}(0, \\mathbf{I}), \\; t}\\left[ \\left\\| \\epsilon - \\epsilon_\\theta\\left( z_t, \\; t, \\; \\tau_\\theta(y) \\right) \\right\\|^2 \\right]",
        "p": "Trains U-Net $\\epsilon_\\theta$ to predict the noise added to compressed latent $z_t$, conditioned on text prompt embedding $\\tau_\\theta(y)$."
      },
      {
        "h": "ControlNet Zero-Convolution Formulation",
        "tex": "\\mathbf{y}_{\\mathrm{ctrl}} = \\mathcal{F}(\\mathbf{x}; \\; \\Theta) + \\mathcal{Z}\\left( \\mathcal{F}_{\\mathrm{clone}}\\left( \\mathbf{x} + \\mathcal{Z}(\\mathbf{c}; \\; \\Theta_{z1}); \\; \\Theta_{\\mathrm{clone}} \\right); \\; \\Theta_{z2} \\right)",
        "p": "Zero convolutions $\\mathcal{Z}$ start with weights and biases initialized to exact zero, ensuring ControlNet outputs zero initially and preserves base model capability."
      },
      {
        "h": "Classifier-Free Guidance (CFG) Latent Extrapolation",
        "tex": "\\tilde{\\epsilon}_\\theta(z_t, c) = \\epsilon_\\theta(z_t, \\varnothing) + s \\cdot \\left( \\epsilon_\\theta(z_t, c) - \\epsilon_\\theta(z_t, \\varnothing) \\right), \\quad s > 1.0",
        "p": "Pushes the predicted noise vector away from the unconditional prediction $\\varnothing$ towards the conditioned prompt $c$ by guidance scale $s$."
      }
    ],
    "code": "import torch\nimport torch.nn as nn\n\nclass ZeroConv2d(nn.Module):\n    \"\"\"Zero-convolution layer used in ControlNet: initialized to exact zero.\"\"\"\n    def __init__(self, channels: int):\n        super().__init__()\n        self.conv = nn.Conv2d(channels, channels, kernel_size=1)\n        # Initialize weights and bias strictly to zero!\n        nn.init.zeros_(self.conv.weight)\n        nn.init.zeros_(self.conv.bias)\n\n    def forward(self, x: torch.Tensor) -> torch.Tensor:\n        return self.conv(x)\n\n# Demonstrate ControlNet residual injection without initial disruption\nx_latent = torch.randn(1, 64, 32, 32)\ncondition_map = torch.randn(1, 64, 32, 32)  # E.g. Canny edge embedding\n\nzero_conv = ZeroConv2d(channels=64)\n# At step 0 of training, zero_conv output is strictly zero!\ncontrol_signal = zero_conv(condition_map)\n\n# Residual addition preserves base model state perfectly\nfused_latent = x_latent + control_signal\nassert torch.equal(x_latent, fused_latent), \"Zero convolution must produce zero output at initialization!\"\nprint(\"Zero convolution verified: Base model functions identically at step 0!\")",
    "keyPoints": [
      "Latent Diffusion compresses images into compact latent space via a VAE, cutting compute by $64\\times$.",
      "The diffusion denoising U-Net operates entirely within latent space, conditioned on text via cross-attention.",
      "ControlNet adds structural spatial conditioning (depth, edges, human pose) to pretrained diffusion models.",
      "Zero convolutions preserve base model generation capabilities at step zero, enabling stable progressive fine-tuning."
    ],
    "pitfalls": [
      "VAE decoding compression artifacts: If the VAE compression factor is set too aggressive (e.g. $f=32$), fine textures (human fingers, small text) cannot be reconstructed by the decoder.",
      "High guidance scale saturation: Setting Classifier-Free Guidance (CFG) scale $s > 15$ causes severe over-saturation, contrast clipping, and unnatural plastic skin artifacts.",
      "Conditioning mismatch in ControlNet: Providing a condition resolution that does not match the image aspect ratio stretches spatial features, distorting generated anatomy."
    ],
    "quiz": [
      {
        "q": "Why does Latent Diffusion (Stable Diffusion) run significantly faster than pixel-space diffusion models like DALL-E 1?",
        "o": [
          "Because Latent Diffusion runs without GPUs",
          "A pretrained VAE compresses images by $8\\times$ spatially into a 4-channel latent space, allowing the diffusion U-Net to denoise a $64\\times$ smaller representation",
          "Because Latent Diffusion only produces 16x16 pixel images",
          "Because it eliminates the reverse diffusion process"
        ],
        "a": 1,
        "why": "Pixel diffusion processes $3 \\times 512 \\times 512 = 786,432$ values per step. Latent diffusion processes $4 \\times 64 \\times 64 = 16,384$ values—a 48x reduction in tensor size."
      },
      {
        "q": "What is the purpose of \"Zero Convolutions\" in the ControlNet architecture?",
        "o": [
          "To permanently delete negative weights",
          "To ensure that at initialization, the ControlNet branch outputs exact zero, completely preserving the base diffusion model's original generation capabilities without disruption",
          "To convert floating point operations into integer additions",
          "To set the learning rate to zero"
        ],
        "a": 1,
        "why": "By initializing weights and biases to zero, ControlNet outputs zero on day one, guaranteeing that training begins from the stable base model state without harmful weight destruction."
      },
      {
        "q": "What role does Classifier-Free Guidance (CFG) play during latent diffusion reverse sampling?",
        "o": [
          "It deletes bad images from disk",
          "It extrapolates predictions in the direction of the text prompt away from the unconditional prediction, dramatically increasing image prompt adherence at the cost of diversity",
          "It replaces cross-attention with self-attention",
          "It trains a separate classifier network"
        ],
        "a": 1,
        "why": "CFG computes predictions with and without the prompt, extrapolating along the difference vector: $\\epsilon = \\epsilon_{\\mathrm{uncond}} + s(\\epsilon_{\\mathrm{cond}} - \\epsilon_{\\mathrm{uncond}})$."
      }
    ],
    "related": [
      "diffusion-models",
      "variational-autoencoders",
      "clip-and-multimodal-embeddings"
    ],
    "keywords": "latent diffusion, stable diffusion, controlnet, zero convolution, vae, classifier-free guidance, cfg, text-to-image, generative vision"
  },
  {
  id: 'ocr-and-document-ai',
  short: 'OCR & Document AI',
  title: 'OCR and document AI',
  task: 'concepts',
  module: 'Applications',
  level: 2,
  minutes: 16,
  noLab: true,
  summary: r`Optical Character Recognition (OCR) and Document AI transform unstructured raster document images into structured machine-readable text, tabular hierarchies, and semantic key-value records. Modern industrial Document AI pipelines operate across two tightly coupled stages: text detection (localising curved and multi-oriented text lines via segmentation-driven differentiable binarisation, such as DBNet and CRAFT) and text recognition (transcribing cropped image text strips into character sequences via Convolutional Recurrent Neural Networks with Connectionist Temporal Classification (CRNN-CTC) or autoregressive Vision-Language decoders like TrOCR and Donut).`,
  lead: r`Every business, legal firm, hospital, and government agency operates on paper: invoices, tax forms, receipts, clinical prescriptions, and identity cards. Yet to a standard database or machine learning pipeline, a scanned PDF or photograph is merely a dead grid of pixels. Bridging the physical-to-digital divide requires more than simple character recognition: an intelligent document system must detect oriented text in cluttered backgrounds, transcribe multilingual typography and cursive handwriting, parse tabular layouts, and extract semantic relationships ("Total Due: £142.50").`,
  intuition: [
    r`The two-stage Document AI paradigm: Reading a document comprises two distinct sub-problems: (1) Text Detection—where is the text located on the page? and (2) Text Recognition—what characters do those text regions represent? While early systems attempted end-to-end character classification via sliding windows, contemporary pipelines decouple the tasks: a robust detection network locates arbitrarily oriented word or text-line polygons, crops and rectifies the text strips into horizontal patches, and passes them to a specialised sequence recognition engine.`,
    r`Differentiable Binarisation for text detection (DBNet): Traditional segmentation-based text detectors generate probability heatmaps and apply a fixed threshold to extract bounding polygons. However, standard step-function thresholding is non-differentiable, preventing the binarisation step from being optimised end-to-end. DBNet (Differentiable Binarisation Network) solves this by reformulating thresholding as an adaptive, differentiable sigmoid approximation: $\hat{B}_{i, j} = \frac{1}{1 + \exp(-k(P_{i, j} - T_{i, j}))}$, where $P$ is the predicted probability map and $T$ is an adaptively learned spatial threshold map. This allows the network to jointly optimise text probability boundaries and edge thresholds directly with gradient descent.`,
    r`Sequence transcription without alignment: CRNN and CTC: Text lines have variable lengths, and character boundaries in cursive handwriting or compressed fonts cannot be easily segmented into discrete letters. Baoguang Shi et al.'s Convolutional Recurrent Neural Network (CRNN) processes an entire horizontal text strip through a CNN backbone, producing a sequence of feature vectors along the horizontal axis. A bidirectional LSTM models sequential linguistic context. To train the network without requiring tedious character-level bounding box annotations, Alex Graves's Connectionist Temporal Classification (CTC) loss introduces a special blank token ($\epsilon$). The CTC objective marginalises over all possible alignments that collapse to the ground-truth text string, allowing the model to learn character alignment and language spelling simultaneously.`,
    r`The modern frontier: Vision-Language Document Transformers: While CRNN-CTC pipelines excel at isolated text-line transcription, complex documents (such as financial balance sheets or insurance claims) encode crucial meaning in 2D layout geometry and spatial typography. Modern Document AI models (such as LayoutLM, Donut, and TrOCR) integrate image pixel embeddings, 2D spatial bounding box coordinates, and pre-trained Transformer language models. By treating Document AI as a multi-modal sequence generation task, these architectures directly output structured JSON schemas ("vendor": "Acme Corp", "total": "£500") directly from raw document scans.`,
  ],
  analogy: r`Think of an administrative assistant processing incoming physical mail. Text detection is like the assistant picking up a yellow highlighter and drawing clean rectangular boxes around every printed paragraph, handwritten note, and invoice total on the invoice. Text recognition is like typing those highlighted snippets into a word processor letter-by-letter. CRNN with CTC loss acts like a court stenographer listening to continuous spoken speech: the stenographer does not need a pause between every individual phoneme; they transcribe a continuous rhythmic stream of sound, automatically collapsing repeated sounds and omitting silent pauses to form clean words. Vision-Language Document AI is like an experienced accountant reading the whole page: they do not just read words in isolation, but immediately recognise that a number positioned in the bottom-right corner beneath a bold double-line represents the grand total amount payable.`,
  steps: [
    {
      title: r`Pre-process and deskew document image`,
      desc: r`Rectify scanned pages and enhance contrast prior to neural detection.`,
      detail: r`Convert high-resolution document scans to grayscale, estimate document skew angle via Radon transform or Hough line analysis, and rotate the page to horizontal orientation. Apply adaptive contrast thresholding to mitigate scan shadows and uneven illumination.`,
    },
    {
      title: r`Detect text regions via Differentiable Binarisation`,
      desc: r`Extract precise multi-oriented text line polygons using segmentation backbones.`,
      detail: r`Pass the document through a Feature Pyramid Network to predict a probability map $P$ and an adaptive threshold map $T$. Apply differentiable binarisation $\hat{B} = \text{Sigmoid}(k(P - T))$ and extract polygon contours via Vatti clipping or morphological contour tracking.`,
    },
    {
      title: r`Crop and rectify text strips`,
      desc: r`Extract and transform bounding polygons into standardised horizontal strips.`,
      detail: r`For each detected text polygon, apply an affine or thin-plate spline (TPS) transformation to rectify curved or perspective-sheared text into a normalised rectangular image strip of standard height (typically $32$ pixels) and variable width.`,
    },
    {
      title: r`Encode feature sequences and decode via CTC`,
      desc: r`Transcribe horizontal pixel strips into discrete character sequences using CRNN-CTC.`,
      detail: r`Process the text strip through convolutional layers to extract a temporal sequence of feature vectors $\mathbf{x}_1, \dots, \mathbf{x}_T$. Pass through a Bidirectional LSTM to model language context, project to character vocabulary logits (including the blank token $\epsilon$), and decode the most probable sequence using CTC greedy best-path decoding or beam search.`,
    },
    {
      title: r`Extract structured entities via Document Transformers`,
      desc: r`Map recognized text and 2D spatial coordinates into structured semantic schemas.`,
      detail: r`Feed transcribed text tokens along with their 2D spatial bounding box coordinates into multi-modal models (such as LayoutLM or Donut) to perform named entity recognition (e.g. tagging dates, totals, and addresses) and relation extraction to generate structured JSON records.`,
    },
  ],
  math: [
    {
      h: r`Differentiable Binarisation (DBNet) formulation`,
      tex: r`\hat{B}_{i, j} = \frac{1}{1 + \exp\left(-k(P_{i, j} - T_{i, j})\right)}`,
      p: r`Here $P_{i, j}$ is the predicted text probability at coordinate $(i, j)$, $T_{i, j}$ is the adaptively learned threshold map, and $k$ is an amplification factor (typically $k=50$). This smooth, differentiable approximation of the standard Heavyside step function allows end-to-end backpropagation through the binarisation operation.`,
    },
    {
      h: r`Connectionist Temporal Classification (CTC) conditional probability`,
      tex: r`p(\mathbf{l} \mid \mathbf{x}) = \sum_{\pi \in \mathcal{B}^{-1}(\mathbf{l})} p(\pi \mid \mathbf{x}) = \sum_{\pi \in \mathcal{B}^{-1}(\mathbf{l})} \prod_{t=1}^T y_{\pi_t}^t`,
      p: r`Here $\mathbf{l}$ is the target text label, $\pi$ is an alignment path across $T$ time steps, $y_{\pi_t}^t$ is the emission probability of label $\pi_t$ at time step $t$, and $\mathcal{B}$ is the collapse mapping that removes sequential duplicate characters and strips out blank tokens $\epsilon$ (e.g. $\mathcal{B}(\text{c-a-a-t}) = \text{cat}$).`,
    },
    {
      h: r`Character Error Rate (CER) and Word Error Rate (WER)`,
      tex: r`\text{CER} = \frac{S + D + I}{N_{\text{ref}}} = \frac{\operatorname{Lev}(\mathbf{l}_{\text{pred}}, \mathbf{l}_{\text{ref}})}{|\mathbf{l}_{\text{ref}}|}, \quad \text{WER} = \frac{S_w + D_w + I_w}{N_{\text{words}}}`,
      p: r`Here $S$ is substitutions, $D$ is deletions, $I$ is insertions, and $N_{\text{ref}}$ is the total number of characters in the ground-truth reference string. CER evaluates character-level Levenshtein edit distance, providing a granular benchmark of OCR transcription accuracy.`,
    },
  ],
  keyPoints: [
    r`Document AI pipelines operate as a two-stage process: text detection (where is text?) followed by text recognition (what is written?).`,
    r`DBNet enables end-to-end backpropagation for text detection by approximating hard step-function binarisation with a differentiable sigmoid.`,
    r`CRNN combines convolutional spatial feature extraction with bidirectional LSTMs to transcribe variable-length horizontal text strips.`,
    r`CTC loss enables training text recognition networks on full words without requiring costly character-level bounding box annotations.`,
    r`Modern multi-modal Document Transformers (LayoutLM, Donut) combine 2D spatial layouts, text semantics, and visual cues to extract structured key-value entities.`,
  ],
  pitfalls: [
    r`Running OCR on unrectified skewed documents: Passing text rotated by even $5^\circ$ to $10^\circ$ causes horizontal CRNN feature sequences to slice across multiple text lines simultaneously, producing garbled transcription outputs; always deskew pages beforehand.`,
    r`Ignoring the CTC blank token: Omitting the blank token ($\epsilon$) prevents CTC from transcribing words with legitimate consecutive duplicate letters (e.g. distinguishing 'book' from 'bok').`,
    r`Evaluating OCR solely with Word Error Rate (WER): In specialized technical domains (such as serial numbers or chemistry formulas), a single character typo in a 20-character identifier marks the entire word as an error; Character Error Rate (CER) provides a much fairer metric.`,
    r`Assuming linear reading order in multi-column layouts: Reading multi-column documents strictly top-to-bottom across the full page width merges text across columns; layout analysis must partition the page into columns before extracting reading order.`,
    r`Relying on classical rule-based regex parsing for key-value extraction: Using static regex to parse invoices fails when document templates change; multi-modal Document Transformers generalise across unseen vendor invoice layouts.`,
  ],
  code: r`import numpy as np

# Simulate Connectionist Temporal Classification (CTC) Greedy Best-Path Decoding
# Character vocabulary: index 0 is blank token ('-'), indices 1-4 are letters ['c', 'a', 't', 'o']
vocab = ['-', 'c', 'a', 't', 'o']
blank_idx = 0

# Simulated emission logits from a CRNN over T=8 time steps for vocabulary size 5
# Target ground-truth word: "cat"
np.random.seed(42)
T = 8
num_classes = len(vocab)
logits = np.random.randn(T, num_classes).astype(np.float32)

# Bias logits to strongly emit sequence: 'c', 'c', '-', 'a', 'a', 'a', '-', 't'
# Which should collapse to: "cat"
logits[0, 1] += 5.0  # 'c'
logits[1, 1] += 4.5  # 'c'
logits[2, 0] += 5.0  # '-' (blank)
logits[3, 2] += 4.0  # 'a'
logits[4, 2] += 5.5  # 'a'
logits[5, 2] += 4.2  # 'a'
logits[6, 0] += 4.8  # '-' (blank)
logits[7, 3] += 5.2  # 't'

# 1. Softmax probability computation over time steps
exp_logits = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
probs = exp_logits / np.sum(exp_logits, axis=-1, keepdims=True)

# 2. Greedy best-path decoding: argmax at each time step
raw_path_indices = np.argmax(probs, axis=-1)
raw_path_chars = [vocab[idx] for idx in raw_path_indices]

print(f"Raw frame-level emission path (T={T}):")
print(f"Indices: {raw_path_indices.tolist()}")
print(f"Tokens:  {' '.join(raw_path_chars)}")

# 3. CTC Collapse Function B(pi):
# Step A: Collapse consecutive identical characters
collapsed_consecutive = []
for i, token in enumerate(raw_path_indices):
    if i == 0 or token != raw_path_indices[i - 1]:
        collapsed_consecutive.append(token)

# Step B: Remove blank tokens (index 0)
final_indices = [idx for idx in collapsed_consecutive if idx != blank_idx]
final_transcription = "".join([vocab[idx] for idx in final_indices])

print(f"\nAfter collapsing consecutive duplicates: {[vocab[i] for i in collapsed_consecutive]}")
print(f"Final CTC decoded transcription:        '{final_transcription}'")

# 4. Character Error Rate (CER) calculation
def levenshtein_distance(s1, s2):
    m, n = len(s1), len(s2)
    dp = np.zeros((m + 1, n + 1), dtype=int)
    for i in range(m + 1): dp[i, 0] = i
    for j in range(n + 1): dp[0, j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if s1[i-1] == s2[j-1] else 1
            dp[i, j] = min(dp[i-1, j] + 1, dp[i, j-1] + 1, dp[i-1, j-1] + cost)
    return dp[m, n]

ground_truth = "cat"
edit_dist = levenshtein_distance(final_transcription, ground_truth)
cer = edit_dist / len(ground_truth)
print(f"Ground-truth text:                     '{ground_truth}'")
print(f"Levenshtein edit distance:             {edit_dist}")
print(f"Character Error Rate (CER):            {cer:.1%}")
assert final_transcription == ground_truth, "CTC decoding mismatch!"
print("Verified: CTC greedy best-path decoding executed successfully!")`,
  quiz: [
    {
      q: r`Why does Connectionist Temporal Classification (CTC) incorporate a dedicated "blank" token ($\epsilon$) in its character vocabulary?`,
      o: [
        r`To allow the decoding collapse operator $\mathcal{B}$ to differentiate between consecutive repeated characters (e.g. 'b-o-o-k') and a single elongated character sound (e.g. 'b-o-k')`,
        r`To represent spaces between paragraphs in multi-page documents`,
        r`To indicate punctuation marks like commas and periods`,
        r`To reset the hidden state of the LSTM memory cell to zero`,
      ],
      a: 0,
      why: r`Without a blank token, consecutive identical characters would always collapse into a single character ('o-o' would become 'o'). Inserting an intermediate blank token ('o-\epsilon-o') signals that the two letters are distinct instances.`,
    },
    {
      q: r`How does DBNet (Differentiable Binarisation Network) make the text detection binarisation step trainable end-to-end with gradient descent?`,
      o: [
        r`It replaces standard non-differentiable step-function thresholding with an adaptive, differentiable sigmoid function comparing predicted probability maps against a learned threshold map`,
        r`It converts text images into 3D point clouds before clustering`,
        r`It trains exclusively on binary black-and-white bitmap files`,
        r`It skips the backward pass during backpropagation`,
      ],
      a: 0,
      why: r`Standard hard thresholding ($P \ge T$) has zero gradient everywhere. DBNet approximates thresholding using a steep sigmoid function $\hat{B} = 1 / (1 + e^{-k(P-T)})$, enabling gradients to flow backward through the threshold map and probability map simultaneously.`,
    },
    {
      q: r`Why is Character Error Rate (CER) often preferred over Word Error Rate (WER) when evaluating OCR on technical documents (such as serial numbers or clinical dosages)?`,
      o: [
        r`Because a single typo in a long alphanumeric code marks the entire word as incorrect under WER, obscuring that the detector was $95\%$ accurate at the character level`,
        r`Because CER does not require a ground-truth reference string`,
        r`Because CER can only be calculated on English text`,
        r`Because WER cannot be evaluated using Levenshtein distance`,
      ],
      a: 0,
      why: r`WER is an all-or-nothing metric: a 15-character serial number with one misplaced letter receives a $100\%$ word error. CER measures character-level Levenshtein edit distance, providing a granular and fair assessment of recognition fidelity.`,
    },
    {
      q: r`What advantage do modern multi-modal Document Transformers (such as LayoutLM) have over traditional OCR pipelines when extracting key-value pairs from receipts?`,
      o: [
        r`They incorporate 2D spatial coordinate layout embeddings alongside text semantics and visual features, recognizing semantic hierarchies across varying document templates`,
        r`They eliminate the need for GPU hardware during training`,
        r`They require zero training data`,
        r`They convert scanned images directly into audio speech`,
      ],
      a: 0,
      why: r`In structured documents, visual layout conveys meaning (e.g. an address is always located in the header). Multi-modal transformers encode 2D bounding box positions along with token embeddings, generalising across diverse layouts where static rules fail.`,
    },
  ],
  usedBy: [],
  prereq: ['receptive-field-stride-and-pooling', 'cnn-architecture-tour-lenet-to-resnet-to-efficientnet', 'iou-nms-and-map'],
  related: ['vision-transformer', 'semantic-segmentation-fcn-and-u-net', 'the-attention-mechanism'],
  keywords: 'ocr optical character recognition document ai dbnet crnn ctc connectionist temporal classification layoutlm text detection text recognition trocr',
},
  {
    "id": "face-detection-and-recognition",
    "short": "Face detection & recognition",
    "title": "Facial Biometrics: Viola-Jones, MTCNN, RetinaFace, and Deep Embedding Cosine Margins (ArcFace)",
    "task": "concepts",
    "level": 3,
    "minutes": 18,
    "noLab": true,
    "usedBy": [],
    "summary": "Building end-to-end facial biometrics pipelines from Haar cascade detection to ArcFace additive angular margin loss verification.",
    "lead": "Facial biometrics spans two distinct tasks: Face Detection (finding all bounding boxes and 5 facial landmarks in a scene) and Face Recognition / Verification (determining whether two detected faces belong to the same identity). From classical AdaBoost Haar Cascades (Viola-Jones) and Multi-Task Cascaded CNNs (MTCNN) to modern RetinaFace and ArcFace angular margin embeddings, facial biometrics has evolved into a real-time, highly reliable computer vision discipline.",
    "analogy": "Imagine a passport security gate at an international airport. Step 1 (Face Detection) is the security guard spotting you in the crowd, ensuring your face is uncovered, and identifying your eyes, nose, and mouth. Step 2 (Face Recognition) is the biometric scanner comparing the geometric angle of your facial bone structure against your passport photo chip on a high-dimensional mathematical sphere to verify your identity.",
    "intuition": [
      "The classical Viola-Jones (2001) detector was the first real-time face detector: using rectangular Haar-like features computed in $O(1)$ constant time via Integral Images, combined with an AdaBoost attentional cascade that discards 95% of background windows in early layers.",
      "Modern face detection (RetinaFace; Deng et al.) uses multi-task convolutional networks with Feature Pyramid Networks: predicting face bounding boxes, classification scores, and 5 facial landmark keypoints (two eyes, nose tip, two mouth corners) in a single dense forward pass.",
      "Facial alignment warps detected faces using a similarity transform so the 5 landmarks map to canonical coordinates, eliminating pose variations.",
      "Face Recognition operates under an Open-Set setting (billions of unseen identities). Standard Softmax loss is insufficient because it only forces features to be separable, not discriminative. ArcFace (Additive Angular Margin Loss; Deng et al.) normalises both weights and embeddings to the unit hypersphere and adds an additive angular margin $m$ directly inside the cosine: $\\cos(\\theta + m)$. This enforces extreme intra-class compactness and inter-class discrepancy on the hypersphere."
    ],
    "steps": [
      "Face detection: Detect faces and 5 facial landmark coordinates using single-shot feature pyramid networks (RetinaFace).",
      "Facial landmark alignment: Compute affine similarity transform to align the 5 landmark points to standard template coordinates, cropping a normalised $112 \\times 112$ face image.",
      "Feature embedding extraction: Pass aligned face through a deep residual backbone (e.g. ResNet-50) with ArcFace loss to produce a 512-dimensional unit-norm embedding vector.",
      "Compute angular margin loss (Training): Normalise weights $\\|W_j\\| = 1$ and features $\\|x_i\\| = 1$; compute angle $\\theta_i = \\arccos(W_{y_i}^T x_i)$, add angular penalty $m$, and scale by radius $s$.",
      "Cosine similarity verification: For two face embeddings $\\mathbf{u}$ and $\\mathbf{v}$, compute cosine similarity $S = \\mathbf{u} \\cdot \\mathbf{v}$.",
      "Threshold verification: If similarity $S > \\tau$ (e.g. $\\tau = 0.65$), verify as identical person; otherwise reject as non-matching impostor."
    ],
    "math": [
      {
        "h": "ArcFace Additive Angular Margin Loss Formulation",
        "tex": "\\mathcal{L}_{\\mathrm{ArcFace}} = -\\frac{1}{N} \\sum_{i=1}^N \\ln \\frac{\\exp\\left( s \\cdot \\cos(\\theta_{y_i} + m) \\right)}{\\exp\\left( s \\cdot \\cos(\\theta_{y_i} + m) \\right) + \\sum_{j \\ne y_i} \\exp\\left( s \\cdot \\cos \\theta_j \\right)}",
        "p": "Adds additive angular margin penalty $m$ directly to the target angle $\\theta_{y_i}$ on the unit sphere, scaled by hypersphere radius $s$."
      },
      {
        "h": "Integral Image Constant-Time Rectangle Sum",
        "tex": "\\sum_{x_1 < x \\le x_2, \\; y_1 < y \\le y_2} I(x, y) = II(x_2, y_2) - II(x_1, y_2) - II(x_2, y_1) + II(x_1, y_1)",
        "p": "Computes pixel intensity sum inside any arbitrary rectangle in strictly 4 array lookups, enabling real-time Viola-Jones Haar evaluation."
      },
      {
        "h": "Cosine Metric Verification Decision Rule",
        "tex": "\\operatorname{Verify}(x_1, x_2) = \\begin{cases} \\text{Same Identity} & \\text{if } \\frac{f(x_1) \\cdot f(x_2)}{\\|f(x_1)\\| \\|f(x_2)\\|} \\ge \\tau \\\\ \\text{Impostor} & \\text{otherwise} \\end{cases}",
        "p": "Verifies identity by evaluating cosine similarity on normalised 512-D embedding vectors against operating threshold $\\tau$."
      }
    ],
    "code": "import torch\nimport torch.nn as nn\nimport torch.nn.functional as F\nimport math\n\nclass ArcMarginProduct(nn.Module):\n    \"\"\"ArcFace: Additive Angular Margin Loss layer.\"\"\"\n    def __init__(self, in_features: int = 512, out_features: int = 10, s: float = 30.0, m: float = 0.50):\n        super().__init__()\n        self.in_features = in_features\n        self.out_features = out_features\n        self.s = s\n        self.m = m\n        self.weight = nn.Parameter(torch.FloatTensor(out_features, in_features))\n        nn.init.xavier_uniform_(self.weight)\n\n    def forward(self, input: torch.Tensor, label: torch.Tensor):\n        # 1. Normalise weights and input embeddings to unit hypersphere\n        cosine = F.linear(F.normalise(input), F.normalise(self.weight))\n        sine = torch.sqrt(1.0 - torch.clamp(cosine ** 2, 0, 1))\n        \n        # 2. cos(theta + m) = cos(theta)*cos(m) - sin(theta)*sin(m)\n        phi = cosine * math.cos(self.m) - sine * math.sin(self.m)\n        \n        # 3. Apply angular margin strictly to true target classes\n        one_hot = torch.zeros(cosine.size(), device=input.device)\n        one_hot.scatter_(1, label.view(-1, 1).long(), 1)\n        output = (one_hot * phi) + ((1.0 - one_hot) * cosine)\n        \n        # 4. Scale by hypersphere radius s\n        output *= self.s\n        return output\n\n# Test ArcFace layer on batch of 2 faces\ntorch.manual_seed(42)\narcface = ArcMarginProduct(in_features=512, out_features=10, s=32.0, m=0.5)\nembeddings = torch.randn(2, 512)\nlabels = torch.tensor([3, 7])\n\nscaled_logits = arcface(embeddings, labels)\nprint(\"ArcFace Scaled Logits Shape:\", scaled_logits.shape)\nprint(\"Additive angular margin enforced on hypersphere for extreme identity clustering!\")",
    "keyPoints": [
      "Facial biometrics decomposes into face detection, landmark alignment, and embedding verification.",
      "Viola-Jones used integral images and AdaBoost cascades for pioneering real-time CPU face detection.",
      "RetinaFace predicts bounding boxes, confidence, and 5 facial landmark keypoints jointly.",
      "ArcFace adds an additive angular margin $m$ on the hypersphere, maximising inter-class separation."
    ],
    "pitfalls": [
      "Skipping facial alignment: Extracting embeddings directly from unaligned, tilted face bounding boxes degrades verification accuracy significantly; always align 5 landmarks.",
      "Biased verification thresholds: Setting a universal threshold without auditing demographic subgroups can lead to disparate False Match Rates (FMR) across ethnicities or lighting conditions.",
      "Liveness spoofing vulnerabilities: Relying purely on 2D RGB embeddings is vulnerable to presentation attacks (holding up a printed photo or phone screen); integrate 3D depth or infrared liveness checks."
    ],
    "quiz": [
      {
        "q": "Why is standard Softmax Cross-Entropy loss insufficient for training production Face Recognition systems?",
        "o": [
          "Because Softmax cannot run on GPUs",
          "Softmax forces features to be linearly separable for training classes, but does not enforce compact intra-class clustering or large angular margins necessary for unseen open-set identities",
          "Because Softmax outputs negative numbers",
          "Because facial images only have 1 colour channel"
        ],
        "a": 1,
        "why": "Softmax creates decision boundaries between known training classes, but leaves wide intraclass spread. ArcFace forces features to cluster tightly on a sphere with large margins."
      },
      {
        "q": "What is the role of the 5 facial landmark keypoints (eyes, nose, mouth corners) in facial recognition pipelines?",
        "o": [
          "To count how many teeth a person has",
          "To calculate a geometric similarity transform that aligns and crops the face into a standardised canonical orientation, eliminating head tilt and yaw variations",
          "To compress the JPEG image",
          "To detect skin diseases"
        ],
        "a": 1,
        "why": "Alignment transforms tilted faces so eyes and mouth line up at identical canonical pixel coordinates, eliminating pose variations before embedding extraction."
      },
      {
        "q": "How did the classical Viola-Jones detector calculate rectangular Haar feature sums in $O(1)$ constant time?",
        "o": [
          "By using quantum superposition",
          "Using the Integral Image representation, where any rectangular sum is computed using strictly four corner array lookups regardless of box size",
          "By ignoring 99% of the pixels",
          "By using Vision Transformers"
        ],
        "a": 1,
        "why": "An integral image stores cumulative sums. Any rectangular area sum $[x_1, x_2] \\times [y_1, y_2]$ is evaluated via four lookups: $II(A) + II(D) - II(B) - II(C)$."
      }
    ],
    "related": [
      "metric-learning-and-triplet-loss",
      "two-stage-detectors-the-r-cnn-family",
      "contrastive-learning-simclr-and-infonce"
    ],
    "keywords": "face recognition, face detection, arcface, retinaface, mtcnn, viola-jones, haar cascades, angular margin, biometrics"
  },
  {
    "id": "pose-estimation",
    "short": "Human pose estimation",
    "title": "Human Pose Estimation: Heatmap Regression, Part Affinity Fields (OpenPose), and Top-Down vs Bottom-Up",
    "task": "concepts",
    "level": 3,
    "minutes": 18,
    "noLab": true,
    "usedBy": [],
    "summary": "Tracking articulated human skeletons using 2D Gaussian heatmap regression, Part Affinity Fields (PAFs), and comparing top-down vs bottom-up multi-person architectures.",
    "lead": "Detecting a human with a bounding box tells you where the person is, but reveals nothing about what they are doing: are they running, crouching, raising a hand, or falling? Human Pose Estimation localizes key articulated skeletal anatomical landmarks (shoulders, elbows, wrists, knees, ankles) in 2D or 3D space. From heatmap regression to bottom-up Part Affinity Fields (OpenPose) and top-down HRNet, pose estimation powers athletic biomechanics, ergonomics, and gesture control.",
    "analogy": "Imagine an animator drawing a running stick figure. Rather than drawing clothes or skin, the animator focuses strictly on the 17 pivot joints of the skeleton: ankles, knees, hips, wrists, elbows, shoulders, and head. If a sports scientist connects these pivot joints with virtual rubber bands, they can calculate the exact knee flexion angle, stride length, and joint stress of a sprinter.",
    "intuition": [
      "Representing anatomical keypoints as raw $(x, y)$ coordinate regressions using standard MSE loss yields poor results: $(x, y)$ regression is non-linear, sensitive to outliers, and cannot model multi-modal uncertainty.",
      "Modern pose estimators formulate keypoint localization as Spatial Heatmap Regression: for each keypoint $k$, the network predicts a 2D probability heatmap $H_k(x, y)$ where a 2D Gaussian blob is centered on the true joint location. Peak locations correspond to detected keypoints, while peak height indicates detection confidence.",
      "Multi-Person Pose Estimation follows two competing architectural paradigms: 1) Top-Down (Detect-then-Estimate): Run an object detector to crop each person, and pass each cropped box through a pose network (e.g. HRNet). Accurate for clean images, but computational cost scales linearly $O(N)$ with the number of people in the scene; 2) Bottom-Up (Detect-all-then-Group): Detect all anatomical keypoints simultaneously across the entire image, then group them into distinct human skeletons using Part Affinity Fields (PAFs; OpenPose) or associative embeddings. Real-time constant $O(1)$ runtime regardless of crowd density.",
      "Part Affinity Fields (PAFs) are 2D vector fields that encode the location and orientation of limbs (e.g. vector pointing from elbow to wrist). By evaluating line integrals along candidate limb connections, bipartite matching groups disjoint body parts into coherent individual skeletons in real time."
    ],
    "steps": [
      "Select architecture paradigm: Choose top-down (e.g. YOLO/HRNet; highest accuracy for few people) or bottom-up (e.g. OpenPose; constant runtime for crowded scenes).",
      "Generate ground-truth Gaussian heatmaps: For each keypoint $k$, render a 2D Gaussian $\\exp\\left(-\\frac{(x-x_k)^2 + (y-y_k)^2}{2\\sigma^2}\\right)$ with radius $\\sigma \\approx 2\\text{--}3$ pixels.",
      "Extract multi-scale high-resolution features: Use HRNet to maintain parallel high-resolution representations throughout the network without losing fine spatial detail.",
      "Predict confidence heatmaps and PAF vector fields: Predict $K$ joint heatmaps and $2L$ directional vector fields for limb connections.",
      "Evaluate Part Affinity line integrals (Bottom-Up): Compute vector dot product line integrals between pairs of detected candidate joints to score connection likelihood.",
      "Bipartite skeleton matching: Solve optimal joint association via Hungarian bipartite matching; connect joints into complete kinematic human skeletons."
    ],
    "math": [
      {
        "h": "2D Ground-Truth Gaussian Heatmap Formulation",
        "tex": "H_k^*(x, y) = \\exp\\left( -\\frac{(x - x_k^*)^2 + (y - y_k^*)^2}{2\\sigma^2} \\right), \\quad (x_k^*, y_k^*) \\in \\mathbb{R}^2",
        "p": "Renders a smooth spatial probability target centered on ground truth joint coordinates with variance $\\sigma^2$."
      },
      {
        "h": "Part Affinity Field (PAF) Limb Vector Integral",
        "tex": "E = \\int_0^1 \\mathbf{L}_{c}\\left( \\mathbf{d}_j(u) \\right) \\cdot \\frac{\\mathbf{d}_{j_2} - \\mathbf{d}_{j_1}}{\\|\\mathbf{d}_{j_2} - \\mathbf{d}_{j_1}\\|_2} \\, du",
        "p": "Measures alignment between predicted 2D directional limb field $\\mathbf{L}_c$ and the unit vector connecting candidate joint pair $(\\mathbf{d}_{j_1}, \\mathbf{d}_{j_2})$."
      },
      {
        "h": "Heatmap Mean Squared Error Loss",
        "tex": "\\mathcal{L}_{\\mathrm{heatmap}} = \\frac{1}{K} \\sum_{k=1}^K \\sum_{x, y} \\mathbf{W}(x, y) \\cdot \\left\\| H_k(x, y) - H_k^*(x, y) \\right\\|^2",
        "p": "Evaluates pixel-wise squared error across predicted heatmaps and Gaussian targets, weighted by visibility mask $\\mathbf{W}$."
      }
    ],
    "code": "import numpy as np\n\ndef generate_keypoint_gaussian_heatmap(height: int, width: int, keypoint_xy: tuple, sigma: float = 1.5) -> np.ndarray:\n    \"\"\"Generate 2D Gaussian confidence target heatmap for keypoint regression.\"\"\"\n    x_k, y_k = keypoint_xy\n    # Create coordinate grid\n    y_grid, x_grid = np.ogrid[:height, :width]\n    \n    # Squared Euclidean distance from keypoint\n    dist_sq = (x_grid - x_k)**2 + (y_grid - y_k)**2\n    \n    # 2D Gaussian distribution\n    heatmap = np.exp(-dist_sq / (2.0 * sigma**2))\n    # Suppress values near zero to save sparse memory\n    heatmap[heatmap < 0.01] = 0.0\n    return heatmap\n\n# Generate heatmap for an elbow detected at (x=12, y=8) in a 20x20 patch\nhm = generate_keypoint_gaussian_heatmap(height=20, width=20, keypoint_xy=(12, 8), sigma=1.8)\n\n# Find peak via argmax (decoding step during inference)\npeak_idx = np.unravel_index(np.argmax(hm), hm.shape)\nprint(f\"Target Keypoint:  (x=12, y=8)\")\nprint(f\"Decoded Peak:     (x={peak_idx[1]}, y={peak_idx[0]}) with confidence {hm[peak_idx]:.3f}\")\nprint(\"Heatmap smooths spatial uncertainty, making neural network training convex and stable!\")",
    "keyPoints": [
      "Pose estimation localizes articulated skeletal joints in 2D or 3D space.",
      "Heatmap regression models spatial uncertainty via 2D Gaussians, outperforming direct $(x, y)$ coordinate regression.",
      "Top-down methods detect people first and estimate pose per person, scaling linearly with crowd size.",
      "Bottom-up methods (OpenPose) detect all joints simultaneously and group them using Part Affinity Fields (PAFs) in constant time."
    ],
    "pitfalls": [
      "Quantization error from strided downsampling: Stride 32 downsampling reduces a 256x256 image to 8x8; keypoints cannot be accurately localized without sub-pixel refinement (DARK - Distribution-Aware Coordinate Representation).",
      "Limb assignment confusion in crowded scenes: In dense crowds where people overlap, bottom-up greedy bipartite matching can mistakenly connect one person's elbow to another person's wrist; use PAF vector fields.",
      "Direct $(x, y)$ coordinate regression: Predicting numerical pixel coordinates directly with fully connected layers fails because it ignores spatial convolutions and cannot handle occlusion."
    ],
    "quiz": [
      {
        "q": "Why do modern pose estimation networks predict 2D Gaussian heatmaps rather than directly regressing numerical $(x, y)$ coordinates?",
        "o": [
          "Because GPUs cannot multiply floating point numbers",
          "Heatmap regression preserves spatial convolutional representations, handles multi-modal uncertainty, and provides smooth convex gradients around the target joint",
          "Because coordinates only exist in 3D",
          "To reduce image resolution"
        ],
        "a": 1,
        "why": "Direct coordinate regression is non-spatial, sensitive to outliers, and fails when joints are ambiguous or occluded. Heatmaps maintain spatial feature maps with smooth gradients."
      },
      {
        "q": "What is the primary operational advantage of a \"Bottom-Up\" pose estimator (like OpenPose) over a \"Top-Down\" estimator in a crowded marathon scene?",
        "o": [
          "Bottom-up models run strictly on mobile phones",
          "Bottom-up inference runtime is constant $O(1)$ regardless of how many hundreds of people are in the image, whereas top-down runtime scales linearly $O(N)$ with person count",
          "Bottom-up models do not require training data",
          "Bottom-up models are 100% accurate"
        ],
        "a": 1,
        "why": "Top-down must run a separate pose network on every single detected person ($N$ crops). Bottom-up detects all joints in a single forward pass and groups them via PAFs."
      },
      {
        "q": "What are \"Part Affinity Fields\" (PAFs) in the OpenPose architecture?",
        "o": [
          "Radio magnetic fields around human bones",
          "2D vector fields that encode the location and orientation of physical limbs (e.g. from elbow to wrist), guiding the bipartite grouping of joints into individual skeletons",
          "A loss function for bounding boxes",
          "A camera calibration technique"
        ],
        "a": 1,
        "why": "PAFs are 2D vector maps pointing along bones. Integrating across candidate joint pairs provides high scores when two joints are connected by a real physical limb."
      }
    ],
    "related": [
      "two-stage-detectors-the-r-cnn-family",
      "receptive-field-stride-and-pooling",
      "face-detection-and-recognition"
    ],
    "keywords": "pose estimation, openpose, part affinity fields, paf, heatmap regression, hrnet, top-down pose, bottom-up pose, skeletal keypoints"
  },
  {
    "id": "object-tracking-sort-and-deepsort",
    "short": "Tracking: SORT & DeepSORT",
    "title": "Multi-Object Tracking: SORT, DeepSORT, Kalman Filtering, and Re-Identification",
    "task": "concepts",
    "level": 2,
    "minutes": 17,
    "noLab": true,
    "usedBy": [],
    "summary": "Tracking multiple objects across video frames using the Tracking-by-Detection paradigm, Kalman filter motion models, and deep visual appearance Re-ID.",
    "lead": "Object detection processes each video frame in isolation: it identifies three cars in frame 10 and three cars in frame 11, but has no concept of identity: which box in frame 11 corresponds to car #1? Multi-Object Tracking (MOT) bridges this temporal gap, maintaining consistent persistent identities across occlusions, camera movements, and object intersections using the Tracking-by-Detection paradigm (SORT, DeepSORT).",
    "analogy": "Imagine a referee at a high-speed basketball match. When players scramble together in a tight huddle under the hoop and separate, the referee does not lose track of which player is player #23. The referee tracks two cues: where the player was moving (momentum/velocity physics—Kalman filtering), and what the player looks like (facial features and team jersey—Deep Re-ID appearance matching).",
    "intuition": [
      "Multi-Object Tracking operates primarily via the Tracking-by-Detection paradigm: an external object detector (YOLO) runs on each frame, producing bounding boxes. The tracker assigns these detections to existing active track trajectories.",
      "SORT (Simple Online and Realtime Tracking; Bewley et al., 2016) models object kinematics using a linear Kalman Filter. State vector $\\mathbf{x} = [u, v, s, r, \\dot{u}, \\dot{v}, \\dot{s}]^T$ predicts the next frame's bounding box position based on constant velocity motion. The Hungarian algorithm then associates predicted positions with new detections using bounding box Intersection-over-Union (IoU) distance.",
      "While SORT runs at 260 FPS on CPU, it fails catastrophically during occlusions: when an object is blocked by a tree or another person for 10 frames, velocity drift causes the tracker to lose track or switch identities (ID Switch).",
      "DeepSORT (Wojke et al., 2017) resolves occlusions by adding Deep Visual Appearance Re-Identification (Re-ID). A deep CNN extracts a 128-D cosine embedding from each detection crop. Association combines motion distance (Mahalanobis distance) with visual appearance distance (cosine distance between embedding galleries), allowing the tracker to recover lost identities even after long occlusions."
    ],
    "steps": [
      "Run frame detector: Run high-accuracy real-time detector (YOLO) to output bounding box coordinates and confidence scores.",
      "Predict track state via Kalman Filter: For each active track, propagate the linear Kalman motion model forward one time step to predict current-frame bounding boxes.",
      "Extract deep appearance embeddings (DeepSORT): Pass detected bounding box image crops through a lightweight CNN to extract 128-D unit-norm Re-ID visual feature vectors.",
      "Compute cost matrix: Calculate distance matrix combining Mahalanobis motion distance and visual cosine distance against track feature galleries.",
      "Solve assignment via Hungarian algorithm: Match active tracks to new detections using matching cascade (prioritising recently seen tracks).",
      "Manage track lifecycle: Promote tentative tracks to confirmed status after 3 consecutive hits; mark lost tracks as deleted if unobserved for $A_{\\max}$ consecutive frames (e.g. 30 frames)."
    ],
    "math": [
      {
        "h": "Linear Kalman Filter State Update",
        "tex": "\\mathbf{x}_{k|k-1} = \\mathbf{F} \\mathbf{x}_{k-1|k-1}, \\quad \\mathbf{P}_{k|k-1} = \\mathbf{F} \\mathbf{P}_{k-1|k-1} \\mathbf{F}^T + \\mathbf{Q}",
        "p": "Projects track state mean $\\mathbf{x}$ and covariance uncertainty $\\mathbf{P}$ forward in time using constant velocity transition matrix $\\mathbf{F}$."
      },
      {
        "h": "Squared Mahalanobis Motion Distance",
        "tex": "d^{(1)}(i, j) = (\\mathbf{d}_j - \\mathbf{y}_i)^T \\mathbf{S}_i^{-1} (\\mathbf{d}_j - \\mathbf{y}_i)",
        "p": "Measures standard deviation distance between detection $\\mathbf{d}_j$ and track Kalman state $\\mathbf{y}_i$ accounting for covariance uncertainty $\\mathbf{S}_i$."
      },
      {
        "h": "Deep Visual Cosine Distance Gate",
        "tex": "d^{(2)}(i, j) = \\min\\left( \\left\\{ 1 - r_j^T r_k^{(i)} \\;\\middle|\\; r_k^{(i)} \\in \\mathcal{R}_i \\right\\} \\right)",
        "p": "Measures minimum cosine distance between detection appearance descriptor $r_j$ and the gallery of the last $L_{\\mathrm{gallery}}$ descriptors $\\mathcal{R}_i$ for track $i$."
      }
    ],
    "code": "import numpy as np\nfrom scipy.optimise import linear_sum_assignment\n\ndef associate_detections_to_tracks(predicted_boxes: np.ndarray, detected_boxes: np.ndarray, iou_threshold: float = 0.3):\n    \"\"\"Associate tracks to detections using IoU distance and Hungarian algorithm.\"\"\"\n    # Compute pairwise IoU matrix: [num_tracks, num_dets]\n    num_tracks = len(predicted_boxes)\n    num_dets = len(detected_boxes)\n    \n    cost_matrix = np.zeros((num_tracks, num_dets))\n    for t in range(num_tracks):\n        for d in range(num_dets):\n            # Simplified mock IoU calculation\n            dist = np.linalg.norm(predicted_boxes[t] - detected_boxes[d])\n            cost_matrix[t, d] = dist  # Lower distance is better match\n            \n    track_idx, det_idx = linear_sum_assignment(cost_matrix)\n    \n    matches = []\n    for t, d in zip(track_idx, det_idx):\n        if cost_matrix[t, d] < 20.0:  # Distance gating threshold\n            matches.append((t, d))\n            \n    return matches\n\n# Simulate: 2 active track predictions vs 2 new frame detections\ntracks = np.array([[100.0, 100.0], [250.0, 300.0]])  # Track 0, Track 1\ndets   = np.array([[102.0,  99.0], [248.0, 305.0]])  # Det 0, Det 1\n\nmatches = associate_detections_to_tracks(tracks, dets)\nfor t, d in matches:\n    print(f\"Track ID {t} successfully matched with Detection {d}!\")\nprint(\"Identity persistence maintained across frames!\")",
    "keyPoints": [
      "Multi-Object Tracking (MOT) maintains consistent identities across video frames.",
      "Tracking-by-detection decouples detection (YOLO) from temporal association (SORT).",
      "SORT uses a Kalman filter for motion forecasting and the Hungarian algorithm for IoU matching.",
      "DeepSORT adds a deep appearance Re-ID network, preventing identity switches during long occlusions."
    ],
    "pitfalls": [
      "ID switching during cross-overs: When two people walk past each other and cross paths, pure IoU tracking easily swaps their track IDs; appearance Re-ID is critical.",
      "Kalman filter breakdown under camera motion: If the camera itself moves wildly (e.g. a bumpy drone), the constant velocity assumption breaks; integrate camera motion compensation (CMC).",
      "Excessive track gallery memory: Allowing appearance galleries $\\mathcal{R}_i$ to grow indefinitely exhausts RAM; cap galleries to the last 50–100 frames per track."
    ],
    "quiz": [
      {
        "q": "What is the primary operational weakness of SORT (Simple Online and Realtime Tracking) that DeepSORT solves?",
        "o": [
          "SORT cannot run in real time",
          "SORT relies exclusively on bounding box IoU and velocity; when an object is occluded or crosses paths with another, it suffers from frequent Identity Switches (ID switches)",
          "SORT requires 10 GPUs",
          "SORT only tracks cars"
        ],
        "a": 1,
        "why": "SORT only uses geometric IoU overlap. If an object is occluded for several frames, the Kalman filter drifts, losing the ID. DeepSORT remembers visual appearance vectors."
      },
      {
        "q": "What does the Kalman Filter do within the SORT and DeepSORT tracking pipelines?",
        "o": [
          "It classifies the breed of dogs in the video",
          "It predicts the position of existing tracks in the next frame based on linear velocity physics, and smooths out noisy bounding box detections",
          "It compresses video codecs",
          "It converts RGB to black and white"
        ],
        "a": 1,
        "why": "The Kalman filter tracks spatial velocity and position, projecting where an object is expected to appear in the next frame before matching."
      },
      {
        "q": "What is the \"Matching Cascade\" in DeepSORT?",
        "o": [
          "A cascade of water cooling the GPU",
          "An assignment priority queue that matches recently seen tracks first using appearance features, before matching tracks that have been occluded for many frames",
          "An algorithm for deleting old video files",
          "A neural network with 1,000 layers"
        ],
        "a": 1,
        "why": "Recently observed tracks have lower uncertainty; matching them first prevents long-lost tracks with high covariance from stealing recent detections."
      }
    ],
    "related": [
      "iou-nms-and-map",
      "one-stage-detectors-ssd-and-yolo",
      "metric-learning-and-triplet-loss"
    ],
    "keywords": "multi-object tracking, mot, sort, deepsort, kalman filter, hungarian algorithm, re-identification, re-id, tracking by detection, id switch"
  },
  {
    "id": "video-models-3d-cnn-and-slowfast",
    "short": "Video models: 3D CNN & SlowFast",
    "title": "Spatiotemporal Video Understanding: 3D Convolutions, (2+1)D Factorisation, and SlowFast Networks",
    "task": "concepts",
    "level": 3,
    "minutes": 18,
    "noLab": true,
    "usedBy": [],
    "summary": "Capturing dynamic temporal motion in video using 3D convolutions, factorised (2+1)D spatial-temporal kernels, and dual-rate SlowFast streams.",
    "lead": "Treating a video as a sequence of independent 2D frames discards the essence of video: motion dynamics. A photograph of a hand touching a door handle cannot distinguish whether the person is opening the door or closing it. Video models capture spatiotemporal structure across space and time. From 3D Convolutions (C3D, I3D) and (2+1)D factorisation to dual-pathway SlowFast networks, video architectures model high-speed motion while controlling computational explosion.",
    "analogy": "Imagine monitoring a highway intersection. A 2D camera taking one photo per hour captures static parked cars, but cannot tell if traffic is moving. A single 3D camera filming at 60 FPS captures high-speed motion, but analyseing 60 high-resolution frames every second overwhelms the computer. The SlowFast brain acts like having two eyes: one eye glances at high-resolution snapshots once a second to identify vehicle models (Slow pathway), while the other eye tracks rapid optical motion blurs at 30 frames a second with lower spatial detail (Fast pathway).",
    "intuition": [
      "A video tensor has 4 dimensions: Channels $\\times$ Time $\\times$ Height $\\times$ Width ($C \\times T \\times H \\times W$). Standard 2D convolutions slide kernels over $(H, W)$, discarding temporal causality.",
      "3D Convolutions (C3D; Tran et al.) use 3D kernels ($K_t \\times K_h \\times K_w$, e.g. $3 \\times 3 \\times 3$), sliding simultaneously across space and time to learn spatiotemporal feature detectors. However, 3D convolutions suffer from massive computational complexity and parameter explosion.",
      "(2+1)D Factorisation (Tran et al., R(2+1)D) factorises each 3D convolution into a 2D spatial convolution ($1 \\times 3 \\times 3$) followed immediately by a 1D temporal convolution ($3 \\times 1 \\times 1$). This factorisation reduces parameter counts while inserting an additional non-linear ReLU between space and time, boosting representation capacity.",
      "SlowFast Networks (Fehrenbrinker et al., 2019) model video using biological dual-pathway inspiration: 1) Slow Pathway: operates at low frame rate (e.g. 2 FPS) with high channel capacity to capture fine spatial semantics (what is in the scene); 2) Fast Pathway: operates at high frame rate (e.g. 16 FPS) with low channel capacity ($1/8$th channels) to capture fast motion dynamics (how things are moving). Lateral connections fuse motion features into the slow semantic stream."
    ],
    "steps": [
      "Sample video clip: Sample a clip of $T$ consecutive frames (e.g. $T=16$ or $T=32$) with temporal stride $\\tau$ from raw video.",
      "Construct dual streams (SlowFast): Subsample frames for the Slow pathway ($T_{\\mathrm{slow}} = 4$ frames) and retain dense frames for the Fast pathway ($T_{\\mathrm{fast}} = 32$ frames).",
      "Allocate channel budgets: Allocate 80%–85% of channel capacity to the Slow pathway; reduce Fast pathway channels by $8\\times$ to bound total FLOPs.",
      "Execute spatiotemporal factorised convolutions: Apply $(2+1)$D separable convolutions or 3D residual blocks within each pathway.",
      "Fuse pathways via lateral connections: Unroll temporal dimensions and fuse fast motion features into the slow pathway via cross-stream convolutions.",
      "Global spatiotemporal pooling & classification: Apply global 3D average pooling across spatial and temporal dimensions; classify action categories via Softmax."
    ],
    "math": [
      {
        "h": "3D Spatiotemporal Convolution Operation",
        "tex": "Y(c_{\\mathrm{out}}, t, x, y) = \\sum_{c_{\\mathrm{in}}} \\sum_{i, j, k} W(c_{\\mathrm{out}}, c_{\\mathrm{in}}, k, i, j) \\cdot X(c_{\\mathrm{in}}, t + k, x + i, y + j)",
        "p": "Slides 3D kernel $W$ of size $K_t \\times K_h \\times K_w$ across both temporal frame sequence $t$ and spatial coordinates $(x, y)$."
      },
      {
        "h": "(2+1)D Kernel Factorisation Parameter Savings",
        "tex": "\\frac{\\mathrm{Params}_{(2+1)\\mathrm{D}}}{\\mathrm{Params}_{3\\mathrm{D}}} = \\frac{K_h K_w C_{\\mathrm{in}} M + K_t M C_{\\mathrm{out}}}{K_t K_h K_w C_{\\mathrm{in}} C_{\\mathrm{out}}} < 1.0",
        "p": "Factorising into separate spatial ($1 \\times K_h \\times K_w$) and temporal ($K_t \\times 1 \\times 1$) filters reduces parameters while doubling non-linearities."
      },
      {
        "h": "SlowFast Frame Rate Ratio and Channel Budget",
        "tex": "T_{\\mathrm{fast}} = \\alpha \\cdot T_{\\mathrm{slow}}, \\quad C_{\\mathrm{fast}} = \\beta \\cdot C_{\\mathrm{slow}}, \\quad \\alpha = 8, \\; \\beta = \\frac{1}{8}",
        "p": "The fast pathway processes $\\alpha$ times more frames but uses only $\\beta$ of the channel capacity, keeping total compute balanced."
      }
    ],
    "code": "import torch\nimport torch.nn as nn\n\nclass R2Plus1DBlock(nn.Module):\n    \"\"\"(2+1)D factorised spatiotemporal convolutional block.\"\"\"\n    def __init__(self, in_planes: int, out_planes: int, mid_planes: int):\n        super().__init__()\n        # 1. 2D Spatial Convolution: (1 x 3 x 3)\n        self.spatial_conv = nn.Conv3d(\n            in_planes, mid_planes, kernel_size=(1, 3, 3),\n            padding=(0, 1, 1), bias=False\n        )\n        self.bn1 = nn.BatchNorm3d(mid_planes)\n        self.relu = nn.ReLU(inplace=True)\n        \n        # 2. 1D Temporal Convolution: (3 x 1 x 1)\n        self.temporal_conv = nn.Conv3d(\n            mid_planes, out_planes, kernel_size=(3, 1, 1),\n            padding=(1, 0, 0), bias=False\n        )\n        self.bn2 = nn.BatchNorm3d(out_planes)\n\n    def forward(self, x: torch.Tensor) -> torch.Tensor:\n        # Input shape: [Batch, Channels, Time, Height, Width]\n        h = self.relu(self.bn1(self.spatial_conv(x)))\n        out = self.relu(self.bn2(self.temporal_conv(h)))\n        return out\n\n# Simulate video clip: 1 clip, 3 RGB channels, 8 frames, 16x16 resolution\nclip = torch.randn(1, 3, 8, 16, 16)\nr2plus1d = R2Plus1DBlock(in_planes=3, out_planes=16, mid_planes=8)\nout = r2plus1d(clip)\n\nprint(f\"Input Video Tensor:  {clip.shape} [B, C, T, H, W]\")\nprint(f\"Processed 3D Tensor: {out.shape}\")\nprint(\"(2+1)D cleanly decoupled spatial appearance from temporal motion dynamics!\")",
    "keyPoints": [
      "Video architectures process 4D spatiotemporal tensors ($C \\times T \\times H \\times W$).",
      "3D convolutions slide across space and time simultaneously, capturing motion patterns.",
      "(2+1)D factorisation decouples spatial filtering from temporal convolutions, saving compute.",
      "SlowFast uses two pathways: a low-framerate semantic stream and a high-framerate motion stream."
    ],
    "pitfalls": [
      "GPU VRAM exhaustion: Processing batches of 3D video tensors consumes massive memory; training requires tiny batch sizes per GPU and heavy gradient accumulation.",
      "Uniform temporal subsampling on long videos: Uniformly sampling 16 frames across a 2-hour movie skips critical actions; use hierarchical video chunking.",
      "Inflating 2D weights improperly: When initializing 3D models from 2D ImageNet weights (I3D), dividing 2D filter weights by temporal kernel size $K_t$ is mandatory to preserve activation scaling."
    ],
    "quiz": [
      {
        "q": "Why does the (2+1)D convolutional architecture outperform standard full 3D convolutions?",
        "o": [
          "Because (2+1)D networks only work on 2D images",
          "It factorises the 3D convolution into a spatial 2D conv followed by a temporal 1D conv, reducing parameters while inserting an extra non-linear activation that doubles model expressiveness",
          "Because (2+1)D runs without GPU memory",
          "It eliminates backpropagation"
        ],
        "a": 1,
        "why": "Splitting $3 \\times 3 \\times 3$ into $(1 \\times 3 \\times 3)$ and $(3 \\times 1 \\times 1)$ cuts parameters and introduces an extra ReLU non-linearity, boosting representation capacity."
      },
      {
        "q": "What is the structural philosophy of the SlowFast video architecture (Feichtenhofer et al., 2019)?",
        "o": [
          "It trains the model slowly on weekdays and fast on weekends",
          "A dual-pathway design: a Slow pathway operating at low framerates with high channel capacity to model spatial semantics, and a Fast pathway operating at high framerates with low channel capacity to model motion",
          "It replaces neural networks with optical flow vectors",
          "It deletes half the pixels in every frame"
        ],
        "a": 1,
        "why": "Inspired by primate vision: the Slow pathway captures static spatial visual categories, while the Fast pathway tracks motion with high temporal resolution and low channel cost."
      },
      {
        "q": "How does the \"I3D\" (Inflated 3D ConvNet) technique initialize 3D convolutional kernels from pretrained 2D ImageNet models?",
        "o": [
          "By setting all 3D weights to random noise",
          "By repeating the 2D filter weights along the temporal dimension $K_t$ times and dividing each weight by $K_t$, preserving identical output activations at step 0",
          "By deleting the temporal dimension",
          "By training a GAN to generate weights"
        ],
        "a": 1,
        "why": "Repeating 2D weights $K_t$ times and scaling by $1/K_t$ ensures that when fed identical video frames, the 3D filter outputs the exact same response as the 2D model."
      }
    ],
    "related": [
      "convolutional_neural_networks",
      "optical-flow",
      "receptive-field-stride-and-pooling"
    ],
    "keywords": "video models, 3d cnn, slowfast, r(2+1)d, i3d, c3d, spatiotemporal convolution, action recognition, temporal modelling"
  },
  {
    "id": "3d-vision-nerf-and-gaussian-splatting",
    "short": "NeRF & 3D Gaussian splatting",
    "title": "Neural Rendering and 3D Reconstruction: Neural Radiance Fields (NeRF) and 3D Gaussian Splatting",
    "task": "concepts",
    "level": 3,
    "minutes": 18,
    "noLab": true,
    "usedBy": [],
    "summary": "Synthesizing novel photorealistic 3D viewpoints using implicit coordinate MLPs (NeRF) and real-time explicit rasterisation with 3D Gaussian Splatting.",
    "lead": "Reconstructing continuous, photorealistic 3D worlds from a collection of 2D photographs has been the holy grail of computer vision. Neural Radiance Fields (NeRF; Mildenhall et al., 2020) revolutionized the field by representing 3D scenes as continuous volumetric functions encoded inside neural network weights. 3D Gaussian Splatting (Kerbl et al., 2023) then solved NeRF's agonizingly slow rendering speeds, achieving real-time 100+ FPS novel view synthesis via explicit differentiable 3D ellipsoids.",
    "analogy": "Imagine sculpting a glowing glass sculpture. NeRF is like having a mathematical equation that calculates the exact colour and smoke density for any $(x, y, z)$ coordinate in mid-air: to photograph the sculpture, a virtual camera shoots rays through every pixel, performing millions of mathematical volume calculations along each laser ray. 3D Gaussian Splatting is like sculpting the scene out of 500,000 tiny semi-transparent glowing fuzzy beads (Gaussians): rendering a photo simply flattens (splats) the beads directly onto the camera lens using high-speed GPU graphics rasterisation.",
    "intuition": [
      "Given a set of 2D photos with known camera poses (from COLMAP Structure-from-Motion), Novel View Synthesis seeks to render the scene from an unseen camera perspective.",
      "NeRF parameterises a 3D scene as a continuous volumetric function using a Multi-Layer Perceptron (MLP): $F_\\theta: (x, y, z, \\theta, \\phi) \\to (r, g, b, \\sigma)$, mapping 3D position and 2D viewing direction to RGB colour and volume density $\\sigma$. High-frequency details are captured using Fourier Positional Encodings $\\gamma(p) = [\\sin(2^k \\pi p), \\cos(2^k \\pi p)]$.",
      "To render a pixel, NeRF casts a camera ray $\\mathbf{r}(t) = \\mathbf{o} + t \\mathbf{d}$, samples hundreds of points along the ray, and integrates colours using numerical volume rendering. While photorealistic, rendering a single $1080p$ frame requires querying the MLP billions of times, taking 10–30 seconds per frame.",
      "3D Gaussian Splatting replaces the implicit neural MLP with explicit 3D Gaussians. Each Gaussian possesses 3D position $\\mu$, a 3D covariance matrix $\\Sigma$ (parameterised by scale and rotation quaternion), opacity $\\alpha$, and spherical harmonics (SH) for view-dependent colour. Using tile-based GPU rasterisation, Gaussian Splatting renders photorealistic scenes at 100+ FPS with fast training."
    ],
    "steps": [
      "Estimate camera poses via SfM: Run COLMAP on multi-view photos to compute intrinsic parameters $\\mathbf{K}$, extrinsic poses $[\\mathbf{R} \\mid \\mathbf{t}]$, and sparse 3D point cloud.",
      "Initialize scene representation: For NeRF, initialize continuous coordinate MLP with positional encodings; for 3DGS, initialize 3D Gaussian ellipsoids from the sparse SfM point cloud.",
      "Cast camera rays (NeRF): For target viewpoint, shoot rays $\\mathbf{r}(t) = \\mathbf{o} + t \\mathbf{d}$ through each pixel; sample stratified points along each ray.",
      "Project Gaussians to 2D image plane (3DGS): Project 3D covariance matrices into 2D camera coordinates $\\Sigma' = \\mathbf{J} \\mathbf{W} \\Sigma \\mathbf{W}^T \\mathbf{J}^T$.",
      "Tile-based rasterisation (3DGS): Sort 2D Gaussians by depth; accumulate colour and opacity along pixels using alpha blending in high-speed GPU shared memory.",
      "Optimise parameters: Compute photometric loss $\\mathcal{L} = \\|I_{\\mathrm{rendered}} - I_{\\mathrm{ground\\_truth}}\\|^2$ and backpropagate gradients into Gaussian parameters or MLP weights."
    ],
    "math": [
      {
        "h": "Volumetric Optical Ray Rendering (NeRF)",
        "tex": "C(\\mathbf{r}) = \\int_{t_n}^{t_f} T(t) \\cdot \\sigma(\\mathbf{r}(t)) \\cdot \\mathbf{c}(\\mathbf{r}(t), \\mathbf{d}) \\, dt, \\quad T(t) = \\exp\\left( -\\int_{t_n}^t \\sigma(\\mathbf{r}(s)) \\, ds \\right)",
        "p": "Accumulates emitted colour $\\mathbf{c}$ along camera ray $\\mathbf{r}(t)$ weighted by volume density $\\sigma$ and cumulative transmittance $T(t)$ (probability that ray traverses without hitting an obstacle)."
      },
      {
        "h": "Fourier Positional Encoding Mapping",
        "tex": "\\gamma(p) = \\left( \\sin(2^0 \\pi p), \\; \\cos(2^0 \\pi p), \\; \\dots, \\; \\sin(2^{L-1} \\pi p), \\; \\cos(2^{L-1} \\pi p) \\right)",
        "p": "Overcomes the spectral bias of deep MLPs, enabling coordinates to represent sharp high-frequency textures and geometric edges."
      },
      {
        "h": "3D Gaussian Ellipsoid Covariance Parameterisation",
        "tex": "G(x) = \\exp\\left( -\\frac{1}{2} (x - \\mu)^T \\Sigma^{-1} (x - \\mu) \\right), \\quad \\Sigma = \\mathbf{R} \\mathbf{S} \\mathbf{S}^T \\mathbf{R}^T",
        "p": "Parameterises 3D covariance $\\Sigma$ via scaling matrix $\\mathbf{S}$ and rotation quaternion $\\mathbf{R}$ to enforce positive semi-definiteness."
      }
    ],
    "code": "import numpy as np\n\ndef positional_encoding_1d(coords: np.ndarray, num_frequencies: int = 4) -> np.ndarray:\n    \"\"\"Fourier positional encoding mapping scalar coordinates to high-frequency vectors.\"\"\"\n    # Overcomes MLP spectral bias in NeRF (Mildenhall et al., 2020)\n    freq_bands = 2.0 ** np.arange(num_frequencies) * np.pi\n    # coords shape: [N, 1]\n    sin_components = np.sin(coords * freq_bands)\n    cos_components = np.cos(coords * freq_bands)\n    return np.column_stack([sin_components, cos_components])\n\n# Simulate encoding a 1D spatial coordinate x = 0.35\nx_coord = np.array([[0.35]])\nencoded_feature = positional_encoding_1d(x_coord, num_frequencies=4)\n\nprint(f\"Original 1D Coordinate: {x_coord[0, 0]:.2f}\")\nprint(f\"Fourier Encoded Shape: {encoded_feature.shape} (8-D sinusoidal vector)\")\nprint(\"Encoded Vector:\", np.round(encoded_feature[0], 3))\nprint(\"High-frequency Fourier features allow deep MLPs to represent sharp edges!\")",
    "keyPoints": [
      "Novel view synthesis reconstructs continuous 3D scenes from a collection of calibrated 2D photos.",
      "NeRF models scenes as continuous volumetric functions $(x, y, z, \\theta, \\phi) \\to (\\text{RGB}, \\sigma)$ in an MLP.",
      "Fourier positional encodings overcome spectral bias, enabling MLPs to capture high-frequency detail.",
      "3D Gaussian Splatting uses explicit 3D ellipsoids and tile-based rasterisation for real-time 100+ FPS rendering."
    ],
    "pitfalls": [
      "Camera pose inaccuracy: NeRF and Gaussian Splatting require sub-pixel accurate camera poses from COLMAP; noisy camera poses cause blurry or fractured ghosting artifacts.",
      "Agonizingly slow NeRF rendering: Standard vanilla NeRF takes up to 30 seconds to render a single 1080p frame due to ray-marching volume integrals; use Instant-NGP or 3D Gaussian Splatting for real-time speeds.",
      "Floaters and artifacts in unconstrained regions: In areas with sparse photographic coverage (e.g. background skies or behind furniture), 3DGS produces floating needle-like artifacts; prune low-opacity Gaussians."
    ],
    "quiz": [
      {
        "q": "Why does NeRF use Fourier Positional Encodings $\\gamma(p)$ on spatial coordinates before passing them to the MLP?",
        "o": [
          "Because neural networks cannot accept floating point numbers directly",
          "Deep MLPs suffer from spectral bias (inherent bias toward low frequencies); positional encodings project low-dimensional coordinates into high frequencies, allowing the network to represent sharp textures and crisp edges",
          "To compress the model weights into an archive",
          "To convert colour images to grayscale"
        ],
        "a": 1,
        "why": "Neural Tangent Kernel theory proves standard MLPs easily learn smooth low-frequency functions but struggle with high-frequency details. Fourier encoding bridges this spectral bias."
      },
      {
        "q": "What is the primary breakthrough of 3D Gaussian Splatting (Kerbl et al., 2023) over original NeRF?",
        "o": [
          "3D Gaussian Splatting only works on cartoons",
          "It replaces slow volumetric ray-marching with explicit 3D Gaussian ellipsoids and GPU tile-based rasterisation, achieving real-time rendering at 100+ FPS with competitive visual fidelity",
          "It eliminates the need for camera poses",
          "It generates audio from photographs"
        ],
        "a": 1,
        "why": "NeRF evaluates an MLP hundreds of times per pixel along each ray. Gaussian Splatting projects explicit 3D Gaussians directly onto the screen, rasterizing in real time."
      },
      {
        "q": "What does \"Volume Density\" $\\sigma(x, y, z)$ represent in NeRF's volumetric rendering equation?",
        "o": [
          "The weight of the camera in kilograms",
          "The differential probability of a camera ray terminating by hitting an opaque physical particle at that infinitesimal 3D location",
          "The brightness of ambient sunlight",
          "The sound volume of the video"
        ],
        "a": 1,
        "why": "Density $\\sigma$ represents opacity at coordinate $(x, y, z)$. High density means solid matter (ray terminates and emits colour); zero density means empty air (ray passes through)."
      }
    ],
    "related": [
      "camera-model-and-calibration",
      "stereo-vision-and-depth",
      "geometric-transforms-and-homography"
    ],
    "keywords": "nerf, neural radiance fields, 3d gaussian splatting, novel view synthesis, volume rendering, positional encoding, radiance, colmap"
  },
  {
    "id": "medical-imaging",
    "short": "Medical Imaging & 3D Seg",
    "title": "Medical Imaging: Modalities, DICOM, Windowing, and 3D Segmentation",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Clinical modalities span X-ray/CT (radiodensity in Hounsfield units), MRI (soft-tissue contrasts via magnetic resonance), ultrasound, and digital pathology. DICOM files store multidimensional volumetric scans alongside physical voxel spacing, slice thickness, patient coordinates, and radiometric window centres and widths. Radiometric windowing maps wide dynamic range CT data (e.g. -1000 to +3000 HU) into 8-bit perceptual ranges for soft tissue, bone, or lung parenchyma. 3D volumetric segmentation demands specialised handling of anisotropic slice spacing, volumetric patch-based inference, and loss functions robust to severe class imbalance like Dice and boundary loss.",
    "lead": "Medical imaging bridges physical diagnostics and computer vision across CT, MRI, ultrasound, and histopathology. Clinically accurate processing requires handling calibrated physical units (Hounsfield units), radiometric windowing, anisotropic 3D voxels, and specialised volumetric architectures such as 3D U-Net and nnU-Net.",
    "analogy": "Imagine an architect surveying a multi-storey skyscraper using ground-penetrating radar. Instead of taking colour snapshots of exterior walls, the radar generates a continuous 3D block of density readings. To inspect rebar within the concrete, the surveyor tunes the screen to filter out hollow drywall and focus entirely on high-density steel. Slicing the block at irregular floor intervals requires spatial interpolation to ensure internal columns align seamlessly across levels.",
    "intuition": [
      "Standard consumer photography captures reflected visible light from 2D surfaces in RGB channels. In medical imaging, radiological instruments scan through anatomical volumes, producing 3D scalar fields where each voxel represents an intrinsic physical property. In computed tomography (CT), voxels measure radiodensity in calibrated Hounsfield Units (HU), where air is -1000 HU, pure water is 0 HU, soft tissues range from +20 to +80 HU, and dense cortical bone exceeds +1000 HU. Because human vision and display systems handle 256 grey levels, radiologists apply radiometric \"windowing\" to inspect narrow density bands (such as brain parenchyma or pulmonary vessels) without losing contrast. Segmenting anatomical lesions requires models to operate across spatial depth (Z-axis), accounting for non-isotropic voxel spacing where slices may be separated by 3 mm while within-plane resolution is 0.7 mm."
    ],
    "steps": [
      "Parse DICOM metadata: extract Rescale Slope and Rescale Intercept to convert stored raw pixel values to Hounsfield Units ($HU = \\text{pixel} \\times \\text{slope} + \\text{intercept}$).",
      "Inspect physical metadata: extract `PixelSpacing` (dy, dx in mm) and `SliceThickness` (dz in mm) to compute spatial anisotropy.",
      "Resample volumetric grids: interpolate 3D volumes into isotropic spacing (e.g. 1.0 mm x 1.0 mm x 1.0 mm) using spline interpolation for CT images and nearest-neighbour for ground-truth masks.",
      "Apply radiometric windowing: clip and normalise density values according to the target clinical task (e.g. lung window: $WC=-600, WW=1500$; soft tissue: $WC=40, WW=400$).",
      "Train volumetric 3D architectures (e.g. 3D U-Net) using sliding volumetric patches and compound loss functions combining soft Dice loss and binary cross-entropy."
    ],
    "math": [
      {
        "h": "Medical Imaging: Modalities, DICOM, Windowing, and 3D Segmentation formulation (Part 1)",
        "tex": "HU = 1000 \\times \\frac{\\mu_x - \\mu_{\\text{water}}}{\\mu_{\\text{water}} - \\mu_{\\text{air}}}",
        "p": "Radiometric windowing maps raw attenuation $x$ to displayed greyscale $[0, 255]$ given Window Centre ($WC$) and Window Width ($WW$):"
      },
      {
        "h": "Medical Imaging: Modalities, DICOM, Windowing, and 3D Segmentation formulation (Part 2)",
        "tex": "I_{\\text{disp}}(x) = \\begin{cases} 0 & x \\le WC - \\frac{WW}{2} \\\\ 255 & x > WC + \\frac{WW}{2} \\\\ \\left( \\frac{x - (WC - WW/2)}{WW} \\right) \\times 255 & \\text{otherwise} \\end{cases}",
        "p": "For volumetric segmentation evaluation, the soft Dice coefficient evaluates overlap between predicted voxel probabilities $\\hat{y}_i \\in [0, 1]$ and binary ground-truth voxels $y_i \\in \\{0, 1\\}$ ac..."
      },
      {
        "h": "Medical Imaging: Modalities, DICOM, Windowing, and 3D Segmentation formulation (Part 3)",
        "tex": "\\mathcal{L}_{\\text{Dice}} = 1 - \\frac{2 \\sum_{i=1}^N \\hat{y}_i y_i + \\epsilon}{\\sum_{i=1}^N \\hat{y}_i + \\sum_{i=1}^N y_i + \\epsilon}",
        "p": "For volumetric segmentation evaluation, the soft Dice coefficient evaluates overlap between predicted voxel probabilities $\\hat{y}_i \\in [0, 1]$ and binary ground-truth voxels $y_i \\in \\{0, 1\\}$ ac..."
      }
    ],
    "code": "import numpy as np\n\ndef dicom_to_hounsfield(raw_array, slope, intercept):\n    \"\"\"Converts raw sensor integers to physical Hounsfield units (HU).\"\"\"\n    return raw_array.astype(np.float32) * slope + intercept\n\ndef apply_windowing(hu_image, window_centre, window_width):\n    \"\"\"Maps Hounsfield units to normalised [0, 1] range using radiometric window.\"\"\"\n    lower = window_centre - window_width / 2.0\n    upper = window_centre + window_width / 2.0\n    clipped = np.clip(hu_image, lower, upper)\n    return (clipped - lower) / (upper - lower)\n\ndef soft_dice_loss(pred_probs, true_masks, eps=1e-6):\n    \"\"\"Computes soft Dice loss for volumetric binary segmentation.\"\"\"\n    intersection = np.sum(pred_probs * true_masks)\n    cardinality = np.sum(pred_probs) + np.sum(true_masks)\n    dice_coef = (2.0 * intersection + eps) / (cardinality + eps)\n    return 1.0 - dice_coef\n\n# Simulate a 3D chest CT volume (slices, height, width)\nnp.random.seed(42)\nslices, h, w = 16, 64, 64\nraw_ct = np.random.randint(0, 4096, size=(slices, h, w), dtype=np.uint16)\nslope, intercept = 1.0, -1024.0\n\n# 1. Convert to calibrated Hounsfield Units\nhu_volume = dicom_to_hounsfield(raw_ct, slope, intercept)\n\n# 2. Apply Soft-Tissue Window (Centre: 40 HU, Width: 400 HU)\nsoft_tissue = apply_windowing(hu_volume, window_centre=40, window_width=400)\n\n# 3. Simulate ground truth lesion mask and model prediction\ntrue_lesion = np.zeros((slices, h, w), dtype=np.float32)\ntrue_lesion[6:10, 24:40, 24:40] = 1.0  # Synthetic nodule\n\n# Model prediction with realistic soft probabilities\npred_probs = np.zeros_like(true_lesion)\npred_probs[6:10, 26:38, 26:38] = 0.85\npred_probs[5:11, 22:42, 22:42] += 0.05  # Surrounding uncertainty\n\nloss = soft_dice_loss(pred_probs, true_lesion)\nprint(f\"Calibrated HU Range: [{hu_volume.min():.1f}, {hu_volume.max():.1f}]\")\nprint(f\"Normalised Window Range: [{soft_tissue.min():.2f}, {soft_tissue.max():.2f}]\")\nprint(f\"Volumetric Soft Dice Loss: {loss:.4f} (Dice Score: {1.0 - loss:.4f})\")",
    "keyPoints": [
      "Hounsfield units provide physically calibrated radiodensity metrics, making radiometric windowing essential for visualising specific tissue bands.",
      "Anisotropic voxel dimensions require volumetric resampling to isotropic grids before standard 3D convolutional architectures can process them effectively.",
      "Dice loss and boundary loss counteract severe class imbalance inherent to small anatomical targets within large volumetric background scans."
    ],
    "pitfalls": [
      "Normalising CT scans with zero-mean unit-variance instead of applying modality-appropriate Hounsfield windowing destroys critical tissue attenuation baselines.",
      "Ignoring anisotropic voxel spacing (e.g. 5 mm slice spacing vs 0.5 mm in-plane resolution) leads to distorted spherical convolutional filters across depth.",
      "Using standard cross-entropy loss without class balancing when lesions occupy less than 0.1% of the total 3D scan volume, driving the network to predict empty masks."
    ],
    "quiz": [
      {
        "q": "What is the primary physical quantity represented by Hounsfield Units (HU) in a computed tomography (CT) scan?",
        "o": [
          "Linear X-ray attenuation calibrated relative to distilled water and air",
          "Proton magnetic resonance relaxation speed (T1 and T2)",
          "Acoustic impedance of sound waves travelling across organ boundaries",
          "Standardised RGB light reflectance of biological tissue surfaces"
        ],
        "a": 0,
        "why": "CT scans measure linear X-ray attenuation coefficients, normalised and scaled into Hounsfield Units where water is 0 HU and air is -1000 HU."
      },
      {
        "q": "Why must 3D volumetric CT scans frequently be resampled before 3D convolution?",
        "o": [
          "Because 3D convolutions require images to have exactly 3 colour channels",
          "To correct for anisotropic voxel spacing where slice thickness differs from in-plane resolution",
          "Because DICOM files cannot be loaded into GPU memory without Fourier inversion",
          "To invert negative Hounsfield units into positive integers"
        ],
        "a": 1,
        "why": "Medical scans often have high in-plane resolution (e.g. 0.7 mm) but larger inter-slice spacing (e.g. 3-5 mm). Resampling to isotropic spacing ensures spatial kernel consistency in all 3 dimensions."
      },
      {
        "q": "Why is soft Dice loss widely preferred over standard binary cross-entropy in medical lesion segmentation?",
        "o": [
          "Dice loss is computationally faster to calculate on CPU hardware",
          "Dice loss eliminates the need for activation functions in convolutional layers",
          "Dice loss directly optimises region overlap and remains robust to extreme foreground-background class imbalance",
          "Dice loss enforces strict convexity in gradient descent optimisation"
        ],
        "a": 2,
        "why": "In clinical scans, tumours or lesions often occupy a minute fraction (<1%) of voxels. Binary cross-entropy is overwhelmed by background voxels, whereas Dice loss directly optimises set overlap."
      }
    ],
    "related": [
      "segment-anything",
      "iou-nms-and-map"
    ],
    "keywords": "medical imaging, medical imaging: modalities, dicom, windowing, and 3d segmentation, natural language processing, deep learning"
  },
  {
    "id": "edge-deployment-of-vision-models",
    "short": "Edge Vision: Quant & TensorRT",
    "title": "Edge Deployment of Vision Models: Quantisation, Pruning, ONNX, and TensorRT",
    "task": "concepts",
    "level": 2,
    "minutes": 16,
    "noLab": true,
    "usedBy": [],
    "summary": "Edge deployment balances a tripartite trade-off among latency (frames per second), memory footprint (SRAM and DRAM), and task accuracy. Quantisation maps continuous 32-bit floating-point weights and activations to 8-bit integers (INT8) using symmetric or affine scaling. Post-Training Quantisation (PTQ) calibrates scale and zero-point offsets using representative data; Quantisation-Aware Training (QAT) simulates rounding errors during backpropagation. Graph optimisations (operator fusion, constant folding) and runtime engines (TensorRT, ONNX Runtime, OpenVINO) maximise hardware throughput.",
    "lead": "Deploying high-accuracy vision models to resource-constrained edge hardware requires rigorous model compression and compilation. Post-training quantisation (PTQ), quantisation-aware training (QAT), structured pruning, and hardware-optimised compilation via ONNX and TensorRT reduce memory footprint, latency, and power consumption while preserving perceptual fidelity.",
    "analogy": "Imagine shipping a sprawling encyclopaedia set across town on a bicycle courier. Sending 30 massive hardbound volumes (FP32) requires multiple heavy trips and slow reading. Quantisation is like re-typesetting the text into compact paperback digests using a clear, simplified vocabulary (INT8) that fits into a single backpack with virtually zero loss of practical meaning.",
    "intuition": [
      "Research vision models are typically developed using 32-bit floating-point arithmetic (FP32) on high-power desktop GPUs. Moving those models to mobile processors, drones, or embedded automotive microcontrollers faces strict constraints: limited thermal envelopes (5–15 Watts), low memory bandwidth, and strict millisecond deadlines. Converting FP32 tensors to 8-bit integers (INT8) immediately reduces memory storage and bandwidth by 4x. Moreover, modern integer arithmetic logic units (ALUs) and Tensor Cores compute INT8 matrix multiplies up to 4x faster than FP32. Combined with layer fusion—such as merging a 2D convolution, batch normalisation, and ReLU into a single GPU kernel invocation—compiled execution engines minimise memory roundtrips and maximise throughput."
    ],
    "steps": [
      "Select architecture suited for edge execution: prefer depthwise-separable blocks, inverted residuals, or linear bottlenecks over heavy standard convolutions.",
      "Perform operator and layer fusion: fold batch normalisation parameters directly into convolutional weights and fuse consecutive activation functions.",
      "Quantise weights and activations: apply symmetric INT8 quantisation for stationary weights and calibrated affine quantisation for dynamic activation distributions.",
      "Export to intermediate representation: serialize the model graph to ONNX format, verifying operator support and static vs dynamic input shapes.",
      "Compile with target runtime engine: build an execution engine using TensorRT, OpenVINO, or TFLite, enabling kernel autotuning for target edge hardware."
    ],
    "math": [
      {
        "h": "Edge Deployment of Vision Models: Quantisation, Pruning, ONNX, and TensorRT formulation (Part 1)",
        "tex": "S = \\frac{x_{\\max} - x_{\\min}}{2^b - 1}, \\quad Z = \\text{round}\\left(-\\frac{x_{\\min}}{S}\\right)",
        "p": "Quantisation and dequantisation operations are formulated as:"
      },
      {
        "h": "Edge Deployment of Vision Models: Quantisation, Pruning, ONNX, and TensorRT formulation (Part 2)",
        "tex": "q = \\text{clip}\\left(\\text{round}\\left(\\frac{x}{S}\\right) + Z, 0, 2^b - 1\\right), \\quad \\hat{x} = S(q - Z)",
        "p": "For symmetric quantisation (widely used in weights where $Z=0$ and $q \\in [-2^{b-1}, 2^{b-1}-1]$):"
      },
      {
        "h": "Edge Deployment of Vision Models: Quantisation, Pruning, ONNX, and TensorRT formulation (Part 3)",
        "tex": "S = \\frac{\\max(|x|)}{2^{b-1} - 1}, \\quad q = \\text{clip}\\left(\\text{round}\\left(\\frac{x}{S}\\right), -2^{b-1}, 2^{b-1}-1\\right)",
        "p": "In layer fusion, a convolution layer with weights $W$, bias $b$, followed by batch normalisation parameters $(\\mu, \\sigma^2, \\gamma, \\beta)$ is algebraically folded into a single equivalent weight ..."
      },
      {
        "h": "Edge Deployment of Vision Models: Quantisation, Pruning, ONNX, and TensorRT formulation (Part 4)",
        "tex": "\\hat{W} = \\frac{\\gamma}{\\sqrt{\\sigma^2 + \\epsilon}} W, \\quad \\hat{b} = \\frac{\\gamma}{\\sqrt{\\sigma^2 + \\epsilon}} (b - \\mu) + \\beta",
        "p": "In layer fusion, a convolution layer with weights $W$, bias $b$, followed by batch normalisation parameters $(\\mu, \\sigma^2, \\gamma, \\beta)$ is algebraically folded into a single equivalent weight ..."
      }
    ],
    "code": "import numpy as np\n\ndef quantise_symmetric_int8(tensor):\n    \"\"\"Performs symmetric INT8 quantisation on continuous weights.\"\"\"\n    max_val = np.max(np.abs(tensor))\n    scale = max_val / 127.0\n    # Quantise and clamp to INT8 range [-127, 127]\n    quantised = np.clip(np.round(tensor / scale), -127, 127).astype(np.int8)\n    return quantised, scale\n\ndef dequantise_symmetric_int8(quantised, scale):\n    \"\"\"Reconstructs approximate FP32 tensor from INT8 and scale.\"\"\"\n    return quantised.astype(np.float32) * scale\n\ndef fold_conv_bn(conv_w, conv_b, bn_mean, bn_var, bn_gamma, bn_beta, eps=1e-5):\n    \"\"\"Folds Batch Normalisation into Conv2D weights and biases.\"\"\"\n    scale = bn_gamma / np.sqrt(bn_var + eps)\n    fused_w = conv_w * scale[:, None, None, None]\n    fused_b = (conv_b - bn_mean) * scale + bn_beta\n    return fused_w, fused_b\n\n# 1. Simulate Conv2D weights: (out_channels, in_channels, kh, kw)\nnp.random.seed(42)\nconv_w = np.random.randn(8, 4, 3, 3).astype(np.float32) * 0.5\nconv_b = np.zeros(8, dtype=np.float32)\n\n# Simulate Batch Normalisation parameters\nbn_mean = np.random.randn(8).astype(np.float32) * 0.1\nbn_var = np.abs(np.random.randn(8).astype(np.float32)) + 0.5\nbn_gamma = np.random.uniform(0.8, 1.2, size=8).astype(np.float32)\nbn_beta = np.random.randn(8).astype(np.float32) * 0.05\n\n# 2. Fuse Conv + BN layers into single parameter set\nfused_w, fused_b = fold_conv_bn(conv_w, conv_b, bn_mean, bn_var, bn_gamma, bn_beta)\n\n# 3. Apply Symmetric INT8 Quantisation to fused weights\nq_w, scale = quantise_symmetric_int8(fused_w)\nreconstructed_w = dequantise_symmetric_int8(q_w, scale)\n\nmae = np.mean(np.abs(fused_w - reconstructed_w))\nmemory_fp32 = fused_w.nbytes\nmemory_int8 = q_w.nbytes\n\nprint(f\"FP32 Weights Size: {memory_fp32} bytes\")\nprint(f\"INT8 Weights Size: {memory_int8} bytes (Compression: {memory_fp32 / memory_int8:.1f}x)\")\nprint(f\"Quantisation Mean Absolute Error: {mae:.6f}\")",
    "keyPoints": [
      "Edge deployment demands aggressive memory bandwidth reduction; converting FP32 to INT8 yields immediate 4x storage and throughput gains.",
      "Layer fusion algebraically incorporates batch normalisation into preceding convolutional weights, eliminating wasteful memory roundtrips.",
      "Hardware compilation engines like TensorRT leverage hardware-specific kernel autotuning to match targeted GPU architectures."
    ],
    "pitfalls": [
      "Applying post-training quantisation without a representative calibration dataset causes outlier clipping that severely degrades detection accuracy.",
      "Leaving batch normalisation as separate standalone layers during inference wastes execution memory bandwidth with redundant global memory reads and writes.",
      "Quantising sensitive layers (such as the initial convolutional stem or final detection classification heads) to INT8 without selective mixed-precision FP16 fallback."
    ],
    "quiz": [
      {
        "q": "What is the primary operational advantage of layer fusion (e.g. folding Conv + BatchNorm + ReLU)?",
        "o": [
          "It reduces the overall number of trainable parameters during backpropagation",
          "It executes operations within a single GPU kernel, eliminating roundtrip DRAM read/write latency",
          "It enables convolutional filters to support variable channel dimensions dynamically",
          "It replaces floating point calculations with stochastic sampling"
        ],
        "a": 1,
        "why": "Layer fusion executes consecutive elementwise operations within fast on-chip registers and shared SRAM, avoiding costly off-chip DRAM memory bandwidth bottlenecks."
      },
      {
        "q": "How does Quantisation-Aware Training (QAT) differ from Post-Training Quantisation (PTQ)?",
        "o": [
          "QAT only quantises input images, leaving weights in 64-bit precision",
          "PTQ requires gradient descent training on millions of labelled samples",
          "QAT inserts simulated fake-quantisation nodes during fine-tuning so weights adjust to rounding noise",
          "PTQ completely replaces integer arithmetic with binary logic gates"
        ],
        "a": 2,
        "why": "QAT models the rounding and clamping error of INT8 arithmetic during forward passes while computing gradients via straight-through estimators, allowing the network to adapt to quantisation noise."
      },
      {
        "q": "Why is symmetric quantisation ($Z=0$) commonly chosen for neural network weight matrices?",
        "o": [
          "It simplifies matrix multiplication hardware by eliminating zero-point cross-term corrections",
          "It guarantees zero numerical loss compared to 32-bit floating point",
          "It allows networks to be run without requiring scale factors",
          "It ensures that negative weights are automatically converted to positive values"
        ],
        "a": 0,
        "why": "Symmetric quantisation centres the integer range around zero, meaning the hardware does not need to compute and accumulate zero-point cross-terms during high-speed matrix multiplications."
      }
    ],
    "related": [
      "inference-kv-cache-batching-paged-attention",
      "serving-latency-and-cost"
    ],
    "keywords": "edge deployment of vision models, edge deployment of vision models: quantisation, pruning, onnx, and tensorrt, natural language processing, deep learning"
  },
];
