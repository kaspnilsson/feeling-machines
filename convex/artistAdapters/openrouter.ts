/**
 * OpenRouter Artist Adapter
 * Provides unified access to models from multiple providers
 */

export interface ArtistResponse {
  statement: string;
  imagePrompt: string;
  metadata: {
    model: string;
    tokens: number;
    costEstimate: number;
    latencyMs: number;
  };
}

export interface OpenRouterConfig {
  model: string; // e.g. "x-ai/grok-2-1212", "deepseek/deepseek-chat"
  displayName: string;
}

export class OpenRouterArtist {
  private apiKey: string;

  constructor(
    public readonly config: OpenRouterConfig,
    apiKey?: string
  ) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY not found in environment");
    }
  }

  async generate({
    systemPrompt,
    userPrompt,
  }: {
    systemPrompt: string;
    userPrompt: string;
  }): Promise<ArtistResponse> {
    const startTime = Date.now();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://feeling-machines.vercel.app",
        "X-Title": "Feeling Machines",
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 1.0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenRouter response");
    }

    // Parse the artist statement and image prompt using the expected format
    const statementMatch = content.match(/===ARTIST STATEMENT===([\s\S]*?)===FINAL IMAGE PROMPT===/i);
    const promptMatch = content.match(/===FINAL IMAGE PROMPT===([\s\S]*)$/i);

    if (!statementMatch || !promptMatch) {
      throw new Error(
        `Invalid response format from ${this.config.model}. Expected ===ARTIST STATEMENT=== and ===FINAL IMAGE PROMPT=== sections.`
      );
    }

    const statement = statementMatch[1].trim();
    const imagePrompt = promptMatch[1].trim();

    // Estimate cost based on usage if available
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;

    // Rough cost estimation (varies by model, these are conservative estimates)
    const inputCostPer1M = 0.50; // $0.50 per 1M input tokens
    const outputCostPer1M = 1.50; // $1.50 per 1M output tokens
    const costEstimate =
      (inputTokens / 1_000_000) * inputCostPer1M +
      (outputTokens / 1_000_000) * outputCostPer1M;

    return {
      statement,
      imagePrompt,
      metadata: {
        model: this.config.model,
        tokens: inputTokens + outputTokens,
        costEstimate,
        latencyMs,
      },
    };
  }
}
