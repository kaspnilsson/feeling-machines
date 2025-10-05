/**
 * Phase 3: Color Palette Analysis
 * Extracts dominant colors and calculates color metrics from images
 */

export interface DominantColor {
  hex: string;
  rgb: [number, number, number];
  percentage: number; // 0-100
}

export interface ColorAnalysis {
  runId: string;
  artistSlug: string;
  brushSlug: string;
  dominantColors: DominantColor[];
  temperature: number;   // -1 (cool) to 1 (warm)
  saturation: number;    // 0-1 average
  brightness: number;    // 0-1 average
  colorHarmony: 'complementary' | 'analogous' | 'triadic' | 'monochromatic';
  entropy: number;       // color diversity measure
}

/**
 * Convert RGB to hex color code
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert RGB to HSL
 * Returns [hue (0-360), saturation (0-1), lightness (0-1)]
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6;
    } else {
      h = ((r - g) / delta + 4) / 6;
    }
  }

  return [h * 360, s, l];
}

/**
 * Calculate color temperature (-1 for cool, +1 for warm)
 * Based on red-blue balance and hue
 */
export function calculateColorTemperature(colors: Array<{ rgb: [number, number, number]; percentage: number }>): number {
  let weightedTemp = 0;

  for (const color of colors) {
    const [r, g, b] = color.rgb;
    const [hue, saturation] = rgbToHsl(r, g, b);
    const weight = color.percentage / 100;

    // Only consider saturated colors for temperature
    // Grayscale/desaturated colors are neutral
    if (saturation < 0.1) {
      continue; // Skip neutral/gray colors
    }

    // Warm hues: red-yellow (0-60° and 300-360°)
    // Cool hues: cyan-blue (180-240°)
    let temp = 0;
    if (hue < 60 || hue > 300) {
      temp = 1; // Warm (red-orange-yellow)
    } else if (hue >= 120 && hue <= 240) {
      temp = -1; // Cool (cyan-blue)
    } else {
      temp = 0; // Neutral (green-ish)
    }

    // Weight by both percentage and saturation
    weightedTemp += temp * weight * saturation;
  }

  return weightedTemp;
}

/**
 * Calculate average saturation (0-1)
 */
export function calculateSaturation(colors: Array<{ rgb: [number, number, number]; percentage: number }>): number {
  let weightedSat = 0;

  for (const color of colors) {
    const [, saturation] = rgbToHsl(...color.rgb);
    const weight = color.percentage / 100;
    weightedSat += saturation * weight;
  }

  return weightedSat;
}

/**
 * Calculate average brightness/lightness (0-1)
 */
export function calculateBrightness(colors: Array<{ rgb: [number, number, number]; percentage: number }>): number {
  let weightedBrightness = 0;

  for (const color of colors) {
    const [, , lightness] = rgbToHsl(...color.rgb);
    const weight = color.percentage / 100;
    weightedBrightness += lightness * weight;
  }

  return weightedBrightness;
}

/**
 * Determine color harmony type based on hue relationships
 */
export function determineColorHarmony(
  colors: Array<{ rgb: [number, number, number]; percentage: number }>
): 'complementary' | 'analogous' | 'triadic' | 'monochromatic' {
  // Get hues of significant colors (>10% of palette)
  const significantHues = colors
    .filter(c => c.percentage > 10)
    .map(c => rgbToHsl(...c.rgb)[0]);

  if (significantHues.length <= 1) {
    return 'monochromatic';
  }

  // Calculate hue differences
  const hueDiffs = [];
  for (let i = 0; i < significantHues.length - 1; i++) {
    for (let j = i + 1; j < significantHues.length; j++) {
      let diff = Math.abs(significantHues[i] - significantHues[j]);
      // Normalize to 0-180 range
      if (diff > 180) diff = 360 - diff;
      hueDiffs.push(diff);
    }
  }

  const avgDiff = hueDiffs.reduce((a, b) => a + b, 0) / hueDiffs.length;

  // Monochromatic: all colors within 30°
  if (avgDiff < 30) {
    return 'monochromatic';
  }

  // Complementary: colors ~180° apart
  if (hueDiffs.some(diff => Math.abs(diff - 180) < 30)) {
    return 'complementary';
  }

  // Analogous: colors within 60° of each other
  if (avgDiff < 60) {
    return 'analogous';
  }

  // Otherwise triadic (roughly 120° apart)
  return 'triadic';
}

/**
 * Calculate color entropy (diversity measure)
 * Higher entropy = more evenly distributed colors
 */
export function calculateColorEntropy(colors: Array<{ percentage: number }>): number {
  let entropy = 0;

  for (const color of colors) {
    const p = color.percentage / 100;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

/**
 * Extract dominant colors from an image buffer using node-vibrant
 */
export async function extractColorsFromImage(imageBuffer: Buffer): Promise<DominantColor[]> {
  const { Vibrant } = await import('node-vibrant/node');

  const palette = await Vibrant.from(imageBuffer).getPalette();

  const colors: Array<{ rgb: [number, number, number]; population: number }> = [];

  // Extract all available swatches
  Object.values(palette).forEach((swatch) => {
    if (swatch) {
      colors.push({
        rgb: swatch.rgb as [number, number, number],
        population: swatch.population,
      });
    }
  });

  // Calculate total population
  const totalPopulation = colors.reduce((sum, c) => sum + c.population, 0);

  // Convert to percentages and format
  const dominantColors: DominantColor[] = colors
    .map(c => ({
      hex: rgbToHex(...c.rgb),
      rgb: c.rgb.map(Math.round) as [number, number, number],
      percentage: (c.population / totalPopulation) * 100,
    }))
    .sort((a, b) => b.percentage - a.percentage) // Sort by percentage descending
    .slice(0, 8); // Take top 8 colors

  return dominantColors;
}

/**
 * Fetch image from URL and extract colors
 */
export async function extractColorsFromUrl(imageUrl: string): Promise<DominantColor[]> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  return extractColorsFromImage(imageBuffer);
}

/**
 * Analyze color palette - now supports both imageBuffer and pre-computed colors
 */
export async function analyzeColors(input: {
  runId: string;
  artistSlug: string;
  brushSlug: string;
  imageBuffer?: Buffer;
  imageUrl?: string;
  dominantColors?: DominantColor[];
}): Promise<ColorAnalysis> {
  const { runId, artistSlug, brushSlug, imageBuffer, imageUrl, dominantColors: providedColors } = input;

  // Extract colors if not provided
  let dominantColors: DominantColor[];
  if (providedColors) {
    dominantColors = providedColors;
  } else if (imageBuffer) {
    dominantColors = await extractColorsFromImage(imageBuffer);
  } else if (imageUrl) {
    dominantColors = await extractColorsFromUrl(imageUrl);
  } else {
    throw new Error('Must provide either imageBuffer, imageUrl, or dominantColors');
  }

  const temperature = calculateColorTemperature(dominantColors);
  const saturation = calculateSaturation(dominantColors);
  const brightness = calculateBrightness(dominantColors);
  const colorHarmony = determineColorHarmony(dominantColors);
  const entropy = calculateColorEntropy(dominantColors);

  return {
    runId,
    artistSlug,
    brushSlug,
    dominantColors,
    temperature,
    saturation,
    brightness,
    colorHarmony,
    entropy,
  };
}
