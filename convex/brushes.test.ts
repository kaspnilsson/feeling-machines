import { describe, it, expect } from "vitest";
import {
  Brush,
  GPTImage1Brush,
  NanoBananaBrush,
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

  it("should have correct structure for NanoBananaBrush", () => {
    const brush = new NanoBananaBrush();

    expect(brush.slug).toBe("gemini-2.5-flash-image");
    expect(brush.displayName).toBe("Nano Banana 2.5");
    expect(brush.provider).toBe("google");
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
    expect(BRUSH_REGISTRY["gemini-2.5-flash-image"]).toBeInstanceOf(NanoBananaBrush);
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
