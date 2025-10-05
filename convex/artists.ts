export interface ArtistConfig {
  slug: string;
  provider: string;
  displayName: string;
}

export const ARTISTS: ArtistConfig[] = [
  {
    slug: "gpt-5-mini",
    provider: "openai",
    displayName: "GPT-5 Mini",
  },
  {
    slug: "claude-sonnet-4-5",
    provider: "anthropic",
    displayName: "Claude Sonnet 4.5",
  },
  {
    slug: "gemini-2.5-flash",
    provider: "google",
    displayName: "Gemini 2.5 Flash",
  },
  {
    slug: "grok-2-1212",
    provider: "openrouter",
    displayName: "Grok 2 (1212)",
  },
  {
    slug: "deepseek-chat",
    provider: "openrouter",
    displayName: "DeepSeek Chat",
  },
];

export interface BrushConfig {
  slug: string;
  provider: string;
  displayName: string;
}

export const BRUSHES: BrushConfig[] = [
  {
    slug: "gemini-2.5-flash-image",
    provider: "google",
    displayName: "Nano Banana 2.5",
  },
  {
    slug: "gpt-image-1",
    provider: "openai",
    displayName: "GPT Image 1",
  },
];

// For Phase 1, use first artist and first brush
export const DEFAULT_ARTIST = ARTISTS[0];
export const DEFAULT_BRUSH = BRUSHES[0];
