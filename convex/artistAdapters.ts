import { OpenRouterArtist } from "./artistAdapters/openrouter";

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
    public readonly displayName: string
  ) {}

  abstract generateArtistResponse(
    systemPrompt: string,
    userPrompt: string
  ): Promise<ArtistResponse>;
}

/**
 * OpenRouter adapter - unified interface for all LLM providers via BYOK
 */
export class OpenRouterAdapter extends ArtistAdapter {
  private openrouter: OpenRouterArtist;

  constructor(slug: string, displayName: string, openrouterModel: string) {
    super(slug, displayName);
    this.openrouter = new OpenRouterArtist(
      { model: openrouterModel, displayName },
      process.env.OPENROUTER_API_KEY
    );
  }

  async generateArtistResponse(
    systemPrompt: string,
    userPrompt: string
  ): Promise<ArtistResponse> {
    const response = await this.openrouter.generate({ systemPrompt, userPrompt });

    return {
      fullText: `${response.statement}\n\n${response.imagePrompt}`,
      statement: response.statement,
      imagePrompt: response.imagePrompt,
      metadata: response.metadata,
    };
  }
}

import { ARTISTS } from "./artists";

/**
 * Artist registry - all models use OpenRouter for unified BYOK access
 * This provides consistent cost tracking and API management
 */
export const ARTIST_REGISTRY: Record<string, ArtistAdapter> = Object.fromEntries(
  ARTISTS.map((config) => {
    const adapter = new OpenRouterAdapter(
      config.slug,
      config.displayName,
      config.openrouterModel
    );
    return [config.slug, adapter];
  })
);

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
