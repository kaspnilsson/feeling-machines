import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ModelParameters, DEFAULT_ARTIST_PARAMS } from "@/convex/modelConfig";

export interface ArtistResponse {
  fullText: string;
  statement: string;
  imagePrompt: string;
  metadata: {
    model: string;
    tokens: number;
    latencyMs: number;
    costEstimate: number;
    params: ModelParameters; // Record parameters used
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
    userPrompt: string,
    params?: ModelParameters
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
    "gpt-5-mini": { input: 1.25 / 1_000_000, output: 10 / 1_000_000 },
  };

  const price = prices[model] || prices["gpt-5-mini"];
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
    userPrompt: string,
    params: ModelParameters = DEFAULT_ARTIST_PARAMS
  ): Promise<ArtistResponse> {
    const startTime = Date.now();
    const finalParams = { ...DEFAULT_ARTIST_PARAMS, ...params };

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: this.slug,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: finalParams.temperature,
      top_p: finalParams.top_p,
      max_tokens: finalParams.max_tokens,
      presence_penalty: finalParams.presence_penalty,
      frequency_penalty: finalParams.frequency_penalty,
      seed: finalParams.seed,
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
        params: finalParams,
      },
    };
  }
}

/**
 * Estimate cost for Anthropic models based on token usage
 */
export function estimateAnthropicCost(
  model: string,
  usage: { input_tokens: number; output_tokens: number }
): number {
  const prices: Record<string, { input: number; output: number }> = {
    "claude-sonnet-4-5": {
      input: 3.0 / 1_000_000,
      output: 15.0 / 1_000_000,
    },
  };

  const price = prices[model] || prices["claude-sonnet-4-5"];
  return usage.input_tokens * price.input + usage.output_tokens * price.output;
}

/**
 * Estimate cost for Google models (currently free/experimental)
 */
export function estimateGoogleCost(
  _model: string,
  _usage: { promptTokenCount?: number; candidatesTokenCount?: number }
): number {
  // Gemini 2.0 Flash is currently free during experimental phase
  return 0;
}

/**
 * Anthropic Claude artist adapter
 */
export class AnthropicArtist extends ArtistAdapter {
  constructor(slug: string, displayName: string) {
    super(slug, displayName, "anthropic");
  }

  async generateArtistResponse(
    systemPrompt: string,
    userPrompt: string,
    params: ModelParameters = DEFAULT_ARTIST_PARAMS
  ): Promise<ArtistResponse> {
    const startTime = Date.now();
    const finalParams = { ...DEFAULT_ARTIST_PARAMS, ...params };

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: this.slug,
      max_tokens: finalParams.max_tokens ?? 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      temperature: finalParams.temperature,
      top_p: finalParams.top_p,
    });

    const fullText =
      response.content[0].type === "text" ? response.content[0].text : "";
    const { statement, imagePrompt } = parseArtistOutput(fullText);

    return {
      fullText,
      statement,
      imagePrompt,
      metadata: {
        model: this.slug,
        tokens: response.usage.input_tokens + response.usage.output_tokens,
        latencyMs: Date.now() - startTime,
        costEstimate: estimateAnthropicCost(this.slug, response.usage),
        params: finalParams,
      },
    };
  }
}

/**
 * Google Gemini artist adapter
 */
export class GoogleArtist extends ArtistAdapter {
  constructor(slug: string, displayName: string) {
    super(slug, displayName, "google");
  }

  async generateArtistResponse(
    systemPrompt: string,
    userPrompt: string,
    params: ModelParameters = DEFAULT_ARTIST_PARAMS
  ): Promise<ArtistResponse> {
    const startTime = Date.now();
    const finalParams = { ...DEFAULT_ARTIST_PARAMS, ...params };

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: this.slug,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: finalParams.temperature,
        topP: finalParams.top_p,
        maxOutputTokens: finalParams.max_tokens,
      },
    });

    const result = await model.generateContent(userPrompt);
    const fullText = result.response.text();
    const { statement, imagePrompt } = parseArtistOutput(fullText);

    const usage = result.response.usageMetadata;

    return {
      fullText,
      statement,
      imagePrompt,
      metadata: {
        model: this.slug,
        tokens: (usage?.totalTokenCount ?? 0),
        latencyMs: Date.now() - startTime,
        costEstimate: estimateGoogleCost(this.slug, usage || {}),
        params: finalParams,
      },
    };
  }
}

/**
 * Artist registry - maps slug to adapter instance
 */
export const ARTIST_REGISTRY: Record<string, ArtistAdapter> = {
  "gpt-5-mini": new OpenAIArtist("gpt-5-mini", "GPT-5 Mini"),
  "claude-sonnet-4-5": new AnthropicArtist(
    "claude-sonnet-4-5",
    "Claude Sonnet 4.5"
  ),
  "gemini-2.5-flash": new GoogleArtist(
    "gemini-2.5-flash",
    "Gemini 2.5 Flash"
  ),
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
