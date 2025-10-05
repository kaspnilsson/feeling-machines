import { describe, it, expect } from 'vitest';
import {
  rgbToHex,
  calculateColorTemperature,
  calculateSaturation,
  calculateBrightness,
  determineColorHarmony,
  calculateColorEntropy,
  extractColorsFromImage,
  analyzeColors,
} from './analyze-colors';

describe('Color Analysis', () => {
  describe('rgbToHex', () => {
    it('should convert RGB to hex correctly', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
    });

    it('should pad single digit hex values', () => {
      expect(rgbToHex(10, 15, 20)).toBe('#0a0f14');
    });
  });

  describe('calculateColorTemperature', () => {
    it('should return positive for warm colors', () => {
      // Red is warm
      const temp1 = calculateColorTemperature([
        { rgb: [255, 0, 0] as [number, number, number], percentage: 100 }
      ]);
      expect(temp1).toBeGreaterThan(0);

      // Orange is warm
      const temp2 = calculateColorTemperature([
        { rgb: [255, 165, 0] as [number, number, number], percentage: 100 }
      ]);
      expect(temp2).toBeGreaterThan(0);
    });

    it('should return negative for cool colors', () => {
      // Blue is cool
      const temp = calculateColorTemperature([
        { rgb: [0, 0, 255] as [number, number, number], percentage: 100 }
      ]);
      expect(temp).toBeLessThan(0);
    });

    it('should return near zero for neutral colors', () => {
      // Gray is neutral
      const temp = calculateColorTemperature([
        { rgb: [128, 128, 128] as [number, number, number], percentage: 100 }
      ]);
      expect(Math.abs(temp)).toBeLessThan(0.3);
    });

    it('should weight by percentage', () => {
      const colors = [
        { rgb: [255, 0, 0] as [number, number, number], percentage: 80 }, // Warm
        { rgb: [0, 0, 255] as [number, number, number], percentage: 20 }, // Cool
      ];
      const temp = calculateColorTemperature(colors);
      // Should be warm overall since red is 80%
      expect(temp).toBeGreaterThan(0);
    });
  });

  describe('calculateSaturation', () => {
    it('should return 1.0 for fully saturated colors', () => {
      const sat = calculateSaturation([
        { rgb: [255, 0, 0] as [number, number, number], percentage: 100 }
      ]);
      expect(sat).toBeCloseTo(1.0, 1);
    });

    it('should return 0.0 for grayscale', () => {
      const sat = calculateSaturation([
        { rgb: [128, 128, 128] as [number, number, number], percentage: 100 }
      ]);
      expect(sat).toBeCloseTo(0.0, 1);
    });

    it('should handle mixed saturation', () => {
      const colors = [
        { rgb: [255, 0, 0] as [number, number, number], percentage: 50 }, // Saturated
        { rgb: [128, 128, 128] as [number, number, number], percentage: 50 }, // Gray
      ];
      const sat = calculateSaturation(colors);
      expect(sat).toBeGreaterThan(0.3);
      expect(sat).toBeLessThan(0.7);
    });
  });

  describe('calculateBrightness', () => {
    it('should return 1.0 for white', () => {
      const brightness = calculateBrightness([
        { rgb: [255, 255, 255] as [number, number, number], percentage: 100 }
      ]);
      expect(brightness).toBeCloseTo(1.0, 1);
    });

    it('should return 0.0 for black', () => {
      const brightness = calculateBrightness([
        { rgb: [0, 0, 0] as [number, number, number], percentage: 100 }
      ]);
      expect(brightness).toBeCloseTo(0.0, 1);
    });

    it('should return mid-range for medium colors', () => {
      const brightness = calculateBrightness([
        { rgb: [128, 128, 128] as [number, number, number], percentage: 100 }
      ]);
      expect(brightness).toBeGreaterThan(0.4);
      expect(brightness).toBeLessThan(0.6);
    });
  });

  describe('determineColorHarmony', () => {
    it('should identify monochromatic when colors are similar', () => {
      const colors = [
        { rgb: [200, 100, 100] as [number, number, number], percentage: 40 },
        { rgb: [220, 120, 120] as [number, number, number], percentage: 30 },
        { rgb: [180, 90, 90] as [number, number, number], percentage: 30 },
      ];
      const harmony = determineColorHarmony(colors);
      expect(harmony).toBe('monochromatic');
    });

    it('should identify complementary for opposite hues', () => {
      const colors = [
        { rgb: [255, 0, 0] as [number, number, number], percentage: 50 }, // Red (~0°)
        { rgb: [0, 255, 255] as [number, number, number], percentage: 50 }, // Cyan (~180°)
      ];
      const harmony = determineColorHarmony(colors);
      expect(harmony).toBe('complementary');
    });

    it('should identify analogous for adjacent hues', () => {
      const colors = [
        { rgb: [255, 0, 0] as [number, number, number], percentage: 33 }, // Red
        { rgb: [255, 128, 0] as [number, number, number], percentage: 33 }, // Orange
        { rgb: [255, 255, 0] as [number, number, number], percentage: 34 }, // Yellow
      ];
      const harmony = determineColorHarmony(colors);
      expect(harmony).toBe('analogous');
    });
  });

  describe('calculateColorEntropy', () => {
    it('should return 0 for single color', () => {
      const colors = [
        { percentage: 100 }
      ];
      const entropy = calculateColorEntropy(colors);
      expect(entropy).toBe(0);
    });

    it('should return maximum for evenly distributed colors', () => {
      const colors = [
        { percentage: 25 },
        { percentage: 25 },
        { percentage: 25 },
        { percentage: 25 },
      ];
      const entropy = calculateColorEntropy(colors);
      // Maximum entropy for 4 colors is log2(4) = 2
      expect(entropy).toBeCloseTo(2.0, 1);
    });

    it('should return lower entropy for skewed distribution', () => {
      const colors = [
        { percentage: 70 },
        { percentage: 10 },
        { percentage: 10 },
        { percentage: 10 },
      ];
      const entropy = calculateColorEntropy(colors);
      expect(entropy).toBeLessThan(2.0);
      expect(entropy).toBeGreaterThan(0);
    });
  });

  describe('extractColorsFromImage', () => {
    it('should extract colors from image buffer', async () => {
      // Create a simple test image: 10x10 red square
      const testImageBuffer = await createTestImage(255, 0, 0);

      const colors = await extractColorsFromImage(testImageBuffer);

      expect(colors).toBeDefined();
      expect(colors.length).toBeGreaterThan(0);
      expect(colors.length).toBeLessThanOrEqual(8); // Should extract up to 8 colors

      // Should have red as dominant color
      const dominantColor = colors[0];
      expect(dominantColor.rgb[0]).toBeGreaterThan(200); // Red channel
      expect(dominantColor.percentage).toBeGreaterThan(50); // Majority of image
    });

    it('should return colors sorted by percentage', async () => {
      const testImageBuffer = await createTestImage(100, 150, 200);

      const colors = await extractColorsFromImage(testImageBuffer);

      // Percentages should be in descending order
      for (let i = 0; i < colors.length - 1; i++) {
        expect(colors[i].percentage).toBeGreaterThanOrEqual(colors[i + 1].percentage);
      }
    });

    it('should have percentages that sum to ~100', async () => {
      const testImageBuffer = await createTestImage(128, 128, 128);

      const colors = await extractColorsFromImage(testImageBuffer);

      const totalPercentage = colors.reduce((sum, c) => sum + c.percentage, 0);
      expect(totalPercentage).toBeGreaterThan(90);
      expect(totalPercentage).toBeLessThanOrEqual(105); // Allow slight rounding error
    });
  });

  describe('analyzeColors (full pipeline)', () => {
    it('should analyze image and return complete analysis', async () => {
      const testImageBuffer = await createTestImage(255, 100, 50);

      const result = await analyzeColors({
        runId: 'test-run-123',
        artistSlug: 'gpt-5-mini',
        brushSlug: 'test-brush',
        imageBuffer: testImageBuffer,
      });

      expect(result.runId).toBe('test-run-123');
      expect(result.artistSlug).toBe('gpt-5-mini');
      expect(result.dominantColors).toBeDefined();
      expect(result.temperature).toBeGreaterThanOrEqual(-1);
      expect(result.temperature).toBeLessThanOrEqual(1);
      expect(result.saturation).toBeGreaterThanOrEqual(0);
      expect(result.saturation).toBeLessThanOrEqual(1);
      expect(['complementary', 'analogous', 'triadic', 'monochromatic']).toContain(result.colorHarmony);
    });
  });
});

/**
 * Helper to create a simple solid-color test image
 */
async function createTestImage(r: number, g: number, b: number): Promise<Buffer> {
  // Dynamically import sharp to avoid issues in test environment
  const sharp = (await import('sharp')).default;

  // Create a 10x10 image with a solid color
  const width = 10;
  const height = 10;
  const channels = 3;
  const buffer = Buffer.alloc(width * height * channels);

  for (let i = 0; i < width * height; i++) {
    buffer[i * 3] = r;
    buffer[i * 3 + 1] = g;
    buffer[i * 3 + 2] = b;
  }

  return sharp(buffer, {
    raw: {
      width,
      height,
      channels,
    },
  })
    .png()
    .toBuffer();
}
