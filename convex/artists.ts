export interface ArtistConfig {
  slug: string;
  producer: string;
  displayName: string;
  /** OpenRouter model identifier for BYOK (bring your own key) */
  openrouterModel: string;
}

export const ARTISTS: ArtistConfig[] = [
  {
    slug: "gpt-5-mini",
    producer: "OpenAI",
    displayName: "GPT-5 Mini",
    openrouterModel: "openai/gpt-5-mini", // https://openrouter.ai/openai/gpt-5-mini
  },
  {
    slug: "claude-sonnet-4.5",
    producer: "Anthropic",
    displayName: "Claude Sonnet 4.5",
    openrouterModel: "anthropic/claude-sonnet-4.5", // https://openrouter.ai/anthropic/claude-sonnet-4.5
  },
  {
    slug: "gemini-2.5-flash",
    producer: "Google",
    displayName: "Gemini 2.5 Flash",
    openrouterModel: "google/gemini-2.5-flash", // https://openrouter.ai/google/gemini-2.5-flash
  },
  {
    slug: "grok-4-fast",
    producer: "xAI",
    displayName: "Grok 4 Fast",
    openrouterModel: "x-ai/grok-4-fast", // https://openrouter.ai/x-ai/grok-4-fast
  },
  {
    slug: "deepseek-chat",
    producer: "DeepSeek",
    displayName: "DeepSeek Chat",
    openrouterModel: "deepseek/deepseek-chat-v3.1", // https://openrouter.ai/deepseek/deepseek-chat-v3.1
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
