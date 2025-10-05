/**
 * Model Configuration
 * Controls sampling parameters for Artists (LLMs)
 */

export interface ModelParameters {
  temperature?: number;      // 0-2, creativity/randomness
  top_p?: number;           // 0-1, nucleus sampling
  max_tokens?: number;      // response length limit
  presence_penalty?: number; // -2 to 2, discourage repetition
  frequency_penalty?: number; // -2 to 2, discourage common words
  seed?: number;            // for deterministic outputs (when supported)
}

/**
 * Default parameters for artistic generation
 * Higher temperature for more creative, diverse outputs
 */
export const DEFAULT_ARTIST_PARAMS: ModelParameters = {
  temperature: 0.9,          // Relatively high for creative variance
  top_p: 0.95,              // Allow diverse token selection
  max_tokens: 2000,         // Generous limit for statements
  presence_penalty: 0.0,    // No penalty (allow recurring themes)
  frequency_penalty: 0.0,   // No penalty (allow style consistency)
  // seed: undefined         // Random by default
};

/**
 * Deterministic parameters for reproducible research
 */
export const DETERMINISTIC_PARAMS: ModelParameters = {
  temperature: 0.7,
  top_p: 1.0,
  max_tokens: 2000,
  presence_penalty: 0.0,
  frequency_penalty: 0.0,
  seed: 42,                 // Fixed seed for reproducibility
};

/**
 * High creativity parameters for exploratory runs
 */
export const HIGH_CREATIVITY_PARAMS: ModelParameters = {
  temperature: 1.2,
  top_p: 0.9,
  max_tokens: 2000,
  presence_penalty: 0.3,    // Encourage novelty
  frequency_penalty: 0.2,
};

/**
 * Balanced parameters for production use
 */
export const BALANCED_PARAMS: ModelParameters = {
  temperature: 0.8,
  top_p: 0.95,
  max_tokens: 1500,
  presence_penalty: 0.0,
  frequency_penalty: 0.0,
};

/**
 * Parameter presets by use case
 */
export const PARAM_PRESETS = {
  default: DEFAULT_ARTIST_PARAMS,
  deterministic: DETERMINISTIC_PARAMS,
  creative: HIGH_CREATIVITY_PARAMS,
  balanced: BALANCED_PARAMS,
} as const;

export type ParamPresetName = keyof typeof PARAM_PRESETS;

/**
 * Get parameters for a given preset
 */
export function getParamPreset(preset: ParamPresetName): ModelParameters {
  return PARAM_PRESETS[preset];
}

/**
 * Merge custom parameters with a preset
 */
export function mergeParams(
  preset: ParamPresetName,
  overrides: Partial<ModelParameters>
): ModelParameters {
  return {
    ...PARAM_PRESETS[preset],
    ...overrides,
  };
}
