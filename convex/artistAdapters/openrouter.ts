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
        response_format: { type: "json_object" },
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

    // Parse JSON response
    let parsedResponse: { statement?: string; imagePrompt?: string };
    try {
      parsedResponse = JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Invalid JSON response from ${this.config.model}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    const statement = parsedResponse.statement?.trim();
    const imagePrompt = parsedResponse.imagePrompt?.trim();

    if (!statement || !imagePrompt) {
      throw new Error(
        `Missing required fields in JSON response from ${this.config.model}. Expected "statement" and "imagePrompt" fields.`
      );
    }

    // Get token usage
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;

    // OpenRouter provides actual cost in response headers (X-RateLimit-Cost)
    // and in the response body under usage.total_cost if available
    // Format: usage.total_cost is in USD (e.g., 0.00123 for $0.00123)
    const costEstimate = usage.total_cost || 0;

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
