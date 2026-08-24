/* =====================================================================
 * js/images.js
 *
 * Maps each round to its scene visual. In the modular source project
 * these are plain relative paths under source/assets/ so the activity
 * opens directly via file:// with no build step required.
 *
 * build/build.js inlines these as base64 data: URIs when it produces
 * dist/Energy_Bar_Challenge_STANDALONE.html, so the shipped standalone
 * has zero external/remote image dependencies.
 * ===================================================================== */
const ROUND_VISUALS = {
  1: "assets/round1.webp",
  2: "assets/round2.webp",
  3: "assets/round3.webp",
  4: "assets/round4.webp",
  5: "assets/round5.webp",
  6: "assets/round6.webp",
  7: "assets/round7.webp",
  8: "assets/round8.webp",
};
