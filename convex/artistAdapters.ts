import OpenAI from "openai";

export interface ArtistResponse {
  fullText: string;
  statement: string;
  imagePrompt: string;
  metadata: {
    model: string;
    tokens: number;
    latencyMs: number;
    costEstimate: number;
  };
}

export abstract class ArtistAdapter {
  constructor(
    public readonly slug: string,
    public readonly displayName: string,
    public readonly provider: string
  ) {}

  abstract generateArtistResponse(
    systemPrompt: string,
    userPrompt: string
  ): Promise<ArtistResponse>;
}

/**
 * Parse artist output to extract statement and image prompt
 */
export function parseArtistOutput(fullText: string): {
  statement: string;
  imagePrompt: string;
} {
  const statementMatch =
    /===ARTIST STATEMENT===([\s\S]*?)===FINAL IMAGE PROMPT===/i.exec(fullText);
  const promptMatch = /===FINAL IMAGE PROMPT===([\s\S]*)$/i.exec(fullText);

  return {
    statement: statementMatch?.[1]?.trim() ?? "",
    imagePrompt: promptMatch?.[1]?.trim() ?? "",
  };
}

/**
 * Estimate cost for OpenAI models based on token usage
 */
export function estimateOpenAICost(
  model: string,
  usage: { prompt_tokens: number; completion_tokens: number }
): number {
  const prices: Record<string, { input: number; output: number }> = {
    "gpt-4o-mini": { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
    "gpt-4o": { input: 2.5 / 1_000_000, output: 10 / 1_000_000 },
  };

  const price = prices[model] || prices["gpt-4o-mini"];
  return (
    usage.prompt_tokens * price.input + usage.completion_tokens * price.output
  );
}

/**
 * OpenAI artist adapter
 */
export class OpenAIArtist extends ArtistAdapter {
  constructor(slug: string, displayName: string) {
    super(slug, displayName, "openai");
  }

  async generateArtistResponse(
    systemPrompt: string,
    userPrompt: string
  ): Promise<ArtistResponse> {
    const startTime = Date.now();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: this.slug,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const fullText = response.choices[0].message?.content ?? "";
    const { statement, imagePrompt } = parseArtistOutput(fullText);

    return {
      fullText,
      statement,
      imagePrompt,
      metadata: {
        model: this.slug,
        tokens: response.usage?.total_tokens ?? 0,
        latencyMs: Date.now() - startTime,
        costEstimate: response.usage
          ? estimateOpenAICost(this.slug, response.usage)
          : 0,
      },
    };
  }
}

/**
 * Artist registry - maps slug to adapter instance
 */
export const ARTIST_REGISTRY: Record<string, ArtistAdapter> = {
  "gpt-4o-mini": new OpenAIArtist("gpt-4o-mini", "GPT-4o Mini"),
  "gpt-4o": new OpenAIArtist("gpt-4o", "GPT-4o"),
};

/**
 * Get artist adapter by slug
 */
export function getArtist(slug: string): ArtistAdapter {
  const artist = ARTIST_REGISTRY[slug];
  if (!artist) {
    throw new Error(`Unknown artist: ${slug}`);
  }
  return artist;
}
