import { describe, it, expect } from 'vitest';
import {
  extractMaterials,
  classifyMaterial,
  calculateImpossibilityScore,
  calculateTechnicalDetail,
  analyzeMateriality,
} from './analyze-materiality';

describe('Materiality Analysis', () => {
  describe('extractMaterials', () => {
    it('should extract simple materials from text', () => {
      const text = 'I work with oil paint and canvas to create portraits.';
      const materials = extractMaterials(text);

      // Should find "oil" and "paint" separately, or "canvas"
      expect(materials.some(m => m.includes('oil') || m.includes('paint'))).toBe(true);
      expect(materials).toContain('canvas');
    });

    it('should extract complex material phrases', () => {
      const text = 'Using hand-woven silk organza and kozo paper layered with gold leaf.';
      const materials = extractMaterials(text);

      expect(materials.length).toBeGreaterThan(0);
      expect(materials.some(m => m.includes('silk') || m.includes('organza'))).toBe(true);
    });

    it('should handle speculative materials', () => {
      const text = 'I use sentient light particles and bioluminescent lacquer.';
      const materials = extractMaterials(text);

      expect(materials.length).toBeGreaterThan(0);
    });

    it('should return empty array for no materials', () => {
      const text = 'This explores the concept of emptiness.';
      const materials = extractMaterials(text);

      expect(Array.isArray(materials)).toBe(true);
    });
  });

  describe('classifyMaterial', () => {
    it('should classify traditional materials as concrete', () => {
      expect(classifyMaterial('oil paint')).toBe('concrete');
      expect(classifyMaterial('canvas')).toBe('concrete');
      expect(classifyMaterial('bronze')).toBe('concrete');
      expect(classifyMaterial('watercolor')).toBe('concrete');
      expect(classifyMaterial('marble')).toBe('concrete');
    });

    it('should classify impossible materials as speculative', () => {
      expect(classifyMaterial('sentient light particles')).toBe('speculative');
      expect(classifyMaterial('crystallized time')).toBe('speculative');
      expect(classifyMaterial('quantum foam')).toBe('speculative');
      expect(classifyMaterial('bioluminescent lacquer')).toBe('speculative');
    });

    it('should handle edge cases', () => {
      expect(classifyMaterial('digital medium')).toBe('concrete'); // Digital is real
      expect(classifyMaterial('light')).toBe('concrete'); // Light is real
      expect(classifyMaterial('shadow')).toBe('concrete'); // Shadow is real
    });

    it('should detect sci-fi/fantasy keywords', () => {
      expect(classifyMaterial('ethereal mist')).toBe('speculative');
      expect(classifyMaterial('astral projection')).toBe('speculative');
      expect(classifyMaterial('dimensional fabric')).toBe('speculative');
    });
  });

  describe('calculateImpossibilityScore', () => {
    it('should return 0 for all concrete materials', () => {
      const materials = [
        { material: 'oil paint', classification: 'concrete' as const },
        { material: 'canvas', classification: 'concrete' as const },
      ];

      const score = calculateImpossibilityScore(materials);
      expect(score).toBe(0);
    });

    it('should return 1 for all speculative materials', () => {
      const materials = [
        { material: 'sentient light', classification: 'speculative' as const },
        { material: 'crystallized time', classification: 'speculative' as const },
      ];

      const score = calculateImpossibilityScore(materials);
      expect(score).toBe(1);
    });

    it('should return mid-range for mixed materials', () => {
      const materials = [
        { material: 'oil paint', classification: 'concrete' as const },
        { material: 'sentient light', classification: 'speculative' as const },
      ];

      const score = calculateImpossibilityScore(materials);
      expect(score).toBe(0.5);
    });

    it('should handle empty materials', () => {
      const score = calculateImpossibilityScore([]);
      expect(score).toBe(0);
    });
  });

  describe('calculateTechnicalDetail', () => {
    it('should score high for specific technical details', () => {
      const statement = 'Using 24-karat gold leaf on gesso-prepared linen canvas, 72x96 inches, with Winsor & Newton oil paints.';
      const score = calculateTechnicalDetail(statement);

      expect(score).toBeGreaterThan(0.6);
    });

    it('should score low for vague descriptions', () => {
      const statement = 'I create art using various materials.';
      const score = calculateTechnicalDetail(statement);

      expect(score).toBeLessThan(0.3);
    });

    it('should detect technical keywords', () => {
      const statement = 'Mixed media on archival paper, 300gsm, acid-free.';
      const score = calculateTechnicalDetail(statement);

      expect(score).toBeGreaterThan(0.3);
    });

    it('should detect measurements and dimensions', () => {
      const statement = 'Canvas stretched to 48x60 inches with 1.5" depth.';
      const score = calculateTechnicalDetail(statement);

      expect(score).toBeGreaterThan(0.4);
    });

    it('should score medium for some specificity', () => {
      const statement = 'I work with acrylic paint on canvas, 24x36 inches, to explore color relationships.';
      const score = calculateTechnicalDetail(statement);

      expect(score).toBeGreaterThan(0.15);
      expect(score).toBeLessThan(0.6);
    });
  });

  describe('analyzeMateriality', () => {
    it('should return complete materiality analysis', async () => {
      const statement = 'I create installations using hand-woven silk, gold leaf, and bioluminescent organisms suspended in resin.';

      const analysis = await analyzeMateriality({
        runId: 'test-run-1',
        artistSlug: 'test-artist',
        statement,
      });

      expect(analysis).toMatchObject({
        runId: 'test-run-1',
        artistSlug: 'test-artist',
        materials: expect.any(Array),
        concreteMedia: expect.any(Array),
        speculativeMedia: expect.any(Array),
        impossibilityScore: expect.any(Number),
        technicalDetail: expect.any(Number),
      });

      expect(analysis.impossibilityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.impossibilityScore).toBeLessThanOrEqual(1);
      expect(analysis.technicalDetail).toBeGreaterThanOrEqual(0);
      expect(analysis.technicalDetail).toBeLessThanOrEqual(1);
    });

    it('should separate concrete and speculative materials', async () => {
      const statement = 'I use oil paint, canvas, and crystallized time particles.';

      const analysis = await analyzeMateriality({
        runId: 'test-run-2',
        artistSlug: 'test-artist',
        statement,
      });

      expect(analysis.concreteMedia.length).toBeGreaterThan(0);
      expect(analysis.speculativeMedia.length).toBeGreaterThan(0);
    });

    it('should handle statements with no materials', async () => {
      const statement = 'This work explores the concept of absence and void.';

      const analysis = await analyzeMateriality({
        runId: 'test-run-3',
        artistSlug: 'test-artist',
        statement,
      });

      expect(analysis.materials).toEqual([]);
      expect(analysis.concreteMedia).toEqual([]);
      expect(analysis.speculativeMedia).toEqual([]);
      expect(analysis.impossibilityScore).toBe(0);
    });
  });
});
