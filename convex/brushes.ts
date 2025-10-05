import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Base interface for all brushes
export interface BrushResult {
  imageB64: string; // All brushes return base64
  // Brush-specific metadata with varying structure per provider
  metadata?: Record<string, unknown>;
}

export abstract class Brush {
  constructor(
    public readonly slug: string,
    public readonly displayName: string,
    public readonly provider: string
  ) {}

  abstract generate(prompt: string): Promise<BrushResult>;
}

// GPT-Image-1 brush
export class GPTImage1Brush extends Brush {
  constructor() {
    super("gpt-image-1", "GPT Image 1", "openai");
  }

  async generate(prompt: string): Promise<BrushResult> {
    console.log(`  → Calling ${this.slug} (${this.provider})`);
    console.log(`  → Prompt: "${prompt.substring(0, 80)}..."`);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      // gpt-image-1 only returns b64, no response_format needed
    });

    if (!response.data || !response.data[0]?.b64_json) {
      console.error(`  ✗ No b64_json in response from ${this.slug}`);
      throw new Error(`No image data returned from ${this.slug}`);
    }

    console.log(
      `  → Received ${response.data[0].b64_json.length} bytes of image data`
    );

    return {
      imageB64: response.data[0].b64_json,
      metadata: {
        usage: response.usage,
        size: response.size,
        quality: response.quality,
      },
    };
  }
}

// DALL-E 2 brush (converts URL to base64)
export class DallE2Brush extends Brush {
  constructor() {
    super("dall-e-2", "DALL-E 2", "openai");
  }

  async generate(prompt: string): Promise<BrushResult> {
    console.log(`  → Calling ${this.slug} (${this.provider})`);
    console.log(`  → Prompt: "${prompt.substring(0, 80)}..."`);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt,
      size: "1024x1024",
      response_format: "b64_json", // Request b64 directly
    });

    if (!response.data || !response.data[0]?.b64_json) {
      console.error(`  ✗ No b64_json in response from ${this.slug}`);
      throw new Error(`No image data returned from ${this.slug}`);
    }

    console.log(
      `  → Received ${response.data[0].b64_json.length} bytes of image data`
    );

    return {
      imageB64: response.data[0].b64_json,
      metadata: {
        size: response.size,
      },
    };
  }
}

// DALL-E 3 brush (converts URL to base64)
export class DallE3Brush extends Brush {
  constructor() {
    super("dall-e-3", "DALL-E 3", "openai");
  }

  async generate(prompt: string): Promise<BrushResult> {
    console.log(`  → Calling ${this.slug} (${this.provider})`);
    console.log(`  → Prompt: "${prompt.substring(0, 80)}..."`);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
      response_format: "b64_json", // Request b64 directly
    });

    if (!response.data || !response.data[0]?.b64_json) {
      console.error(`  ✗ No b64_json in response from ${this.slug}`);
      throw new Error(`No image data returned from ${this.slug}`);
    }

    console.log(
      `  → Received ${response.data[0].b64_json.length} bytes of image data`
    );

    return {
      imageB64: response.data[0].b64_json,
      metadata: {
        size: response.size,
        quality: response.quality,
        revised_prompt: response.data[0].revised_prompt,
      },
    };
  }
}

// Nano Banana (Gemini 2.5 Flash Image) brush
export class NanoBananaBrush extends Brush {
  constructor() {
    super("gemini-2.5-flash-image", "Nano Banana 2.5", "google");
  }

  async generate(prompt: string): Promise<BrushResult> {
    console.log(`  → Calling ${this.slug} (${this.provider})`);
    console.log(`  → Prompt: "${prompt.substring(0, 80)}..."`);

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: this.slug });

    const result = await model.generateContent([prompt]);
    const response = result.response;

    // Get the image part from the response
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (part: { inlineData?: unknown }) => part.inlineData
    );

    if (!imagePart?.inlineData?.data) {
      console.error(`  ✗ No image data in response from ${this.slug}`);
      throw new Error(`No image data returned from ${this.slug}`);
    }

    const imageB64 = imagePart.inlineData.data;
    console.log(`  → Received ${imageB64.length} bytes of image data`);

    return {
      imageB64,
      metadata: {
        mimeType: imagePart.inlineData.mimeType,
        usage: response.usageMetadata,
      },
    };
  }
}

// Brush registry - maps slug to brush instance
export const BRUSH_REGISTRY: Record<string, Brush> = {
  "gemini-2.5-flash-image": new NanoBananaBrush(),
  "gpt-image-1": new GPTImage1Brush(),
};

// Get brush by slug
export function getBrush(slug: string): Brush {
  const brush = BRUSH_REGISTRY[slug];
  if (!brush) {
    throw new Error(`Unknown brush: ${slug}`);
  }
  return brush;
}
