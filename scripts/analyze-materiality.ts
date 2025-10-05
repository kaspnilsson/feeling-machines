/**
 * Phase 3: Materiality Analysis
 * Classifies materials mentioned in artist statements as concrete vs speculative
 */

export interface MaterialClassification {
  material: string;
  classification: 'concrete' | 'speculative';
}

export interface MaterialityAnalysis {
  runId: string;
  artistSlug: string;
  materials: MaterialClassification[];
  concreteMedia: string[];
  speculativeMedia: string[];
  impossibilityScore: number;  // 0-1, how feasible to physically create
  technicalDetail: number;     // 0-1, specificity of instructions
}

/**
 * Known concrete materials (traditional art materials)
 */
const CONCRETE_MATERIALS = new Set([
  'oil', 'paint', 'acrylic', 'watercolor', 'gouache', 'tempera',
  'canvas', 'linen', 'paper', 'wood', 'panel',
  'bronze', 'clay', 'ceramic', 'porcelain', 'terracotta',
  'marble', 'stone', 'granite', 'limestone',
  'glass', 'metal', 'steel', 'iron', 'copper', 'brass', 'aluminum',
  'ink', 'charcoal', 'graphite', 'pencil', 'pastel', 'crayon',
  'fabric', 'textile', 'silk', 'cotton', 'wool', 'felt',
  'resin', 'epoxy', 'plastic', 'polymer',
  'gold', 'silver', 'platinum', 'leaf',
  'gesso', 'primer', 'varnish',
  'digital', 'video', 'photo', 'photograph',
  'light', 'led', 'neon', 'projection', 'shadow',
  'sound', 'audio', 'speaker',
  'wire', 'thread', 'string', 'rope',
]);

/**
 * Speculative/impossible keywords
 */
const SPECULATIVE_KEYWORDS = [
  'sentient', 'crystallized', 'quantum', 'ethereal', 'astral',
  'dimensional', 'temporal', 'bioluminescent', 'holographic',
  'impossible', 'paradoxical', 'infinite', 'void', 'antimatter',
  'consciousness', 'dream', 'memory', 'thought', 'emotion',
];

/**
 * Extract material mentions from text
 */
export function extractMaterials(text: string): string[] {
  const materials: string[] = [];
  const lowerText = text.toLowerCase();

  // First, check for known materials as standalone words or in compounds
  for (const knownMaterial of CONCRETE_MATERIALS) {
    const regex = new RegExp(`\\b${knownMaterial}\\b`, 'gi');
    if (regex.test(lowerText)) {
      materials.push(knownMaterial);
    }
  }

  // Pattern for material phrases with modifiers
  // Match "X paint", "Y paper", etc.
  const materialPatterns = [
    /([a-z-]{3,20})\s+(?:paint|paper|canvas|leaf|ink|fabric|medium|lacquer|resin)/gi,
    /(?:hand-woven|handmade|synthetic|natural|organic)\s+([a-z-\s]{3,20})(?:\s|,|\.)/gi,
  ];

  for (const pattern of materialPatterns) {
    let match;
    while ((match = pattern.exec(lowerText)) !== null) {
      const material = match[1].trim();
      // Only add if it contains at least one known material keyword
      const hasKnownMaterial = Array.from(CONCRETE_MATERIALS).some(km =>
        material.includes(km)
      );
      if (hasKnownMaterial && material.length < 40) {
        materials.push(material);
      }
    }
  }

  // Check for speculative materials with keywords
  for (const keyword of SPECULATIVE_KEYWORDS) {
    const regex = new RegExp(`${keyword}\\s+([a-z-\s]{2,30})`, 'gi');
    let match;
    while ((match = regex.exec(lowerText)) !== null) {
      const material = `${keyword} ${match[1].trim()}`;
      if (material.length < 40) {
        materials.push(material);
      }
    }
  }

  // Deduplicate
  return Array.from(new Set(materials));
}

/**
 * Classify a material as concrete (real-world) or speculative (invented/impossible)
 */
export function classifyMaterial(material: string): 'concrete' | 'speculative' {
  const lower = material.toLowerCase();

  // Check for speculative keywords first
  for (const keyword of SPECULATIVE_KEYWORDS) {
    if (lower.includes(keyword)) {
      return 'speculative';
    }
  }

  // Check for known concrete materials
  for (const concreteMaterial of CONCRETE_MATERIALS) {
    if (lower.includes(concreteMaterial)) {
      return 'concrete';
    }
  }

  // Default to speculative for unknown materials
  return 'speculative';
}

/**
 * Calculate impossibility score (0 = all concrete, 1 = all speculative)
 */
export function calculateImpossibilityScore(materials: MaterialClassification[]): number {
  if (materials.length === 0) {
    return 0;
  }

  const speculativeCount = materials.filter(m => m.classification === 'speculative').length;
  return speculativeCount / materials.length;
}

/**
 * Calculate technical detail score based on specificity
 */
export function calculateTechnicalDetail(statement: string): number {
  let score = 0;
  const lowerText = statement.toLowerCase();

  // Technical keywords
  const technicalKeywords = [
    'archival', 'acid-free', 'lightfast', 'pigment', 'binder',
    'gesso', 'primer', 'varnish', 'medium', 'technique',
    'layer', 'glaze', 'wash', 'impasto', 'scumble',
    'stretched', 'mounted', 'prepared',
  ];

  // Count technical keywords
  for (const keyword of technicalKeywords) {
    if (lowerText.includes(keyword)) {
      score += 0.1;
    }
  }

  // Measurements (dimensions, weights, etc.)
  const measurementPatterns = [
    /\d+\s*(?:x|by)\s*\d+/,  // "24x36" or "24 by 36"
    /\d+\s*(?:inches|cm|mm|feet|meters)/,  // "12 inches"
    /\d+\s*(?:gsm|lb|oz)/,  // "300gsm"
  ];

  for (const pattern of measurementPatterns) {
    if (pattern.test(lowerText)) {
      score += 0.15;
    }
  }

  // Brand names or specific product names (capitalized words)
  const brandPattern = /\b[A-Z][a-z]+\s+(?:&\s+)?[A-Z][a-z]+\b/g;
  const brands = statement.match(brandPattern);
  if (brands && brands.length > 0) {
    score += brands.length * 0.1;
  }

  // Numbers suggest specificity
  const numberPattern = /\b\d+\b/g;
  const numbers = statement.match(numberPattern);
  if (numbers && numbers.length > 0) {
    score += Math.min(numbers.length * 0.05, 0.2);
  }

  // Cap at 1.0
  return Math.min(score, 1.0);
}

/**
 * Analyze materiality of an artist statement
 */
export async function analyzeMateriality(input: {
  runId: string;
  artistSlug: string;
  statement: string;
}): Promise<MaterialityAnalysis> {
  const { runId, artistSlug, statement } = input;

  // Extract materials
  const extractedMaterials = extractMaterials(statement);

  // Classify each material
  const materials: MaterialClassification[] = extractedMaterials.map(material => ({
    material,
    classification: classifyMaterial(material),
  }));

  // Separate concrete and speculative
  const concreteMedia = materials
    .filter(m => m.classification === 'concrete')
    .map(m => m.material);

  const speculativeMedia = materials
    .filter(m => m.classification === 'speculative')
    .map(m => m.material);

  // Calculate scores
  const impossibilityScore = calculateImpossibilityScore(materials);
  const technicalDetail = calculateTechnicalDetail(statement);

  return {
    runId,
    artistSlug,
    materials,
    concreteMedia,
    speculativeMedia,
    impossibilityScore,
    technicalDetail,
  };
}
