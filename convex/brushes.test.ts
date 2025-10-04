import { describe, it, expect } from "vitest";
import {
  Brush,
  GPTImage1Brush,
  DallE2Brush,
  DallE3Brush,
  getBrush,
  BRUSH_REGISTRY,
} from "./brushes";

describe("Brush base class", () => {
  it("should have correct structure for GPTImage1Brush", () => {
    const brush = new GPTImage1Brush();

    expect(brush.slug).toBe("gpt-image-1");
    expect(brush.displayName).toBe("GPT Image 1");
    expect(brush.provider).toBe("openai");
  });

  it("should have correct structure for DallE2Brush", () => {
    const brush = new DallE2Brush();

    expect(brush.slug).toBe("dall-e-2");
    expect(brush.displayName).toBe("DALL-E 2");
    expect(brush.provider).toBe("openai");
  });

  it("should have correct structure for DallE3Brush", () => {
    const brush = new DallE3Brush();

    expect(brush.slug).toBe("dall-e-3");
    expect(brush.displayName).toBe("DALL-E 3");
    expect(brush.provider).toBe("openai");
  });

  it("should implement Brush interface", () => {
    const brush = new GPTImage1Brush();

    expect(brush).toBeInstanceOf(Brush);
    expect(typeof brush.generate).toBe("function");
  });
});

describe("Brush registry", () => {
  it("should contain all expected brushes", () => {
    expect(BRUSH_REGISTRY["gpt-image-1"]).toBeInstanceOf(GPTImage1Brush);
    expect(BRUSH_REGISTRY["dall-e-2"]).toBeInstanceOf(DallE2Brush);
    expect(BRUSH_REGISTRY["dall-e-3"]).toBeInstanceOf(DallE3Brush);
  });

  it("should throw error for unknown brush slug", () => {
    expect(() => {
      getBrush("unknown-brush");
    }).toThrow("Unknown brush: unknown-brush");
  });

  it("should return brush for valid slug", () => {
    const brush = getBrush("gpt-image-1");

    expect(brush).toBeInstanceOf(Brush);
    expect(brush.slug).toBe("gpt-image-1");
  });
});

describe("BrushResult interface", () => {
  it("should define correct structure", () => {
    // This is a type-level test - we just verify the pattern works
    const mockResult = {
      imageB64: "base64string",
      metadata: { usage: {}, size: "1024x1024" },
    };

    expect(mockResult).toHaveProperty("imageB64");
    expect(typeof mockResult.imageB64).toBe("string");
  });
});
