import { describe, it, expect } from 'vitest';
import {
  rgbToHex,
  calculateColorTemperature,
  calculateSaturation,
  calculateBrightness,
  determineColorHarmony,
  calculateColorEntropy,
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
});
