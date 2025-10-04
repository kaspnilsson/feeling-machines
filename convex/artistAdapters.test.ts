import { describe, it, expect } from "vitest";
import {
  ArtistAdapter,
  OpenAIArtist,
  parseArtistOutput,
  estimateOpenAICost,
  getArtist,
} from "./artistAdapters";

describe("parseArtistOutput", () => {
  it("should parse valid artist output with both sections", () => {
    const fullText = `
===ARTIST STATEMENT===
This piece explores the duality of human emotion.
===FINAL IMAGE PROMPT===
A serene landscape with contrasting colors
    `.trim();

    const result = parseArtistOutput(fullText);

    expect(result.statement).toBe(
      "This piece explores the duality of human emotion."
    );
    expect(result.imagePrompt).toBe(
      "A serene landscape with contrasting colors"
    );
  });

  it("should handle multiline statements and prompts", () => {
    const fullText = `
===ARTIST STATEMENT===
Line 1 of statement
Line 2 of statement
===FINAL IMAGE PROMPT===
Line 1 of prompt
Line 2 of prompt
    `.trim();

    const result = parseArtistOutput(fullText);

    expect(result.statement).toBe("Line 1 of statement\nLine 2 of statement");
    expect(result.imagePrompt).toBe("Line 1 of prompt\nLine 2 of prompt");
  });

  it("should return empty strings for missing sections", () => {
    const fullText = "Random text without delimiters";

    const result = parseArtistOutput(fullText);

    expect(result.statement).toBe("");
    expect(result.imagePrompt).toBe("");
  });

  it("should handle case-insensitive delimiters", () => {
    const fullText = `
===artist statement===
Test statement
===final image prompt===
Test prompt
    `.trim();

    const result = parseArtistOutput(fullText);

    expect(result.statement).toBe("Test statement");
    expect(result.imagePrompt).toBe("Test prompt");
  });
});

describe("estimateOpenAICost", () => {
  it("should calculate cost for gpt-4o-mini correctly", () => {
    const cost = estimateOpenAICost("gpt-4o-mini", {
      prompt_tokens: 1000,
      completion_tokens: 500,
    });

    // (1000 * 0.15/1M) + (500 * 0.6/1M) = 0.00015 + 0.0003 = 0.00045
    expect(cost).toBe(0.00045);
  });

  it("should calculate cost for gpt-4o correctly", () => {
    const cost = estimateOpenAICost("gpt-4o", {
      prompt_tokens: 1000,
      completion_tokens: 500,
    });

    // (1000 * 2.5/1M) + (500 * 10/1M) = 0.0025 + 0.005 = 0.0075
    expect(cost).toBe(0.0075);
  });

  it("should default to gpt-4o-mini pricing for unknown models", () => {
    const cost = estimateOpenAICost("unknown-model", {
      prompt_tokens: 1000,
      completion_tokens: 500,
    });

    expect(cost).toBe(0.00045);
  });
});

describe("OpenAIArtist", () => {
  it("should have correct metadata", () => {
    const artist = new OpenAIArtist("gpt-4o-mini", "GPT-4o Mini");

    expect(artist.slug).toBe("gpt-4o-mini");
    expect(artist.displayName).toBe("GPT-4o Mini");
    expect(artist.provider).toBe("openai");
  });

  it("should implement ArtistAdapter interface", () => {
    const artist = new OpenAIArtist("gpt-4o-mini", "GPT-4o Mini");

    expect(artist).toBeInstanceOf(ArtistAdapter);
    expect(typeof artist.generateArtistResponse).toBe("function");
  });
});

describe("ArtistAdapter registry", () => {
  it("should throw error for unknown artist slug", () => {
    expect(() => {
      getArtist("unknown-artist");
    }).toThrow("Unknown artist: unknown-artist");
  });

  it("should return artist for valid slug", () => {
    const artist = getArtist("gpt-4o-mini");

    expect(artist).toBeInstanceOf(ArtistAdapter);
    expect(artist.slug).toBe("gpt-4o-mini");
  });
});
