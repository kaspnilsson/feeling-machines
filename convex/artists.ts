export interface ArtistConfig {
  slug: string;
  provider: string;
  displayName: string;
}

export const ARTISTS: ArtistConfig[] = [
  {
    slug: "gpt-4o",
    provider: "openai",
    displayName: "GPT-4o",
  },
  {
    slug: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    displayName: "Claude 3.5 Sonnet",
  },
  {
    slug: "gemini-2.0-flash-exp",
    provider: "google",
    displayName: "Gemini 2.0 Flash",
  },
];

export interface BrushConfig {
  slug: string;
  provider: string;
  displayName: string;
}

export const BRUSHES: BrushConfig[] = [
  {
    slug: "gpt-image-1",
    provider: "openai",
    displayName: "GPT Image 1",
  },
  {
    slug: "dall-e-2",
    provider: "openai",
    displayName: "DALL-E 2",
  },
  {
    slug: "dall-e-3",
    provider: "openai",
    displayName: "DALL-E 3",
  },
  // Phase 2 will add: stable-diffusion, etc.
];

// For Phase 1, use first artist and first brush
export const DEFAULT_ARTIST = ARTISTS[0];
export const DEFAULT_BRUSH = BRUSHES[0];
