export interface ArtistConfig {
  slug: string;
  provider: string;
  producer: string;
  displayName: string;
  /** OpenRouter model identifier (only for openrouter provider) */
  openrouterModel?: string;
}

export const ARTISTS: ArtistConfig[] = [
  {
    slug: "gpt-5-mini",
    provider: "openai",
    producer: "OpenAI",
    displayName: "GPT-5 Mini",
  },
  {
    slug: "claude-sonnet-4-5",
    provider: "anthropic",
    producer: "Anthropic",
    displayName: "Claude Sonnet 4.5",
  },
  {
    slug: "gemini-2.5-flash",
    provider: "google",
    producer: "Google",
    displayName: "Gemini 2.5 Flash",
  },
  {
    slug: "grok-4-fast",
    provider: "openrouter",
    producer: "xAI",
    displayName: "Grok 4 Fast",
    openrouterModel: "x-ai/grok-4-fast",
  },
  {
    slug: "deepseek-chat",
    provider: "openrouter",
    producer: "DeepSeek",
    displayName: "DeepSeek Chat",
    openrouterModel: "deepseek/deepseek-chat-v3.1",
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
