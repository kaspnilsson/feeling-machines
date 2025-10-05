/**
 * Color analysis runner
 */
"use node";

import { AnalysisRunner, AnalysisResult, RunData } from "../analysisRunner";
import { DatabaseWriter } from "../_generated/server";
import { analyzeColors } from "../../scripts/analyze-colors";

interface ColorAnalysisResult extends AnalysisResult {
  dominantColors: Array<{
    hex: string;
    rgb: number[];
    percentage: number;
  }>;
  temperature: number;
  saturation: number;
  colorHarmony: string;
}

export class ColorRunner extends AnalysisRunner<ColorAnalysisResult> {
  readonly name = "color";
  readonly requiresImage = true;

  async analyze(data: RunData): Promise<ColorAnalysisResult> {
    if (!data.imageUrl) {
      throw new Error("Image URL required for color analysis");
    }

    const result = await analyzeColors({
      runId: data.runId,
      artistSlug: data.artistSlug,
      brushSlug: "unused",
      imageUrl: data.imageUrl,
    });

    return {
      runId: data.runId,
      artistSlug: data.artistSlug,
      dominantColors: result.dominantColors,
      temperature: result.temperature,
      saturation: result.saturation,
      colorHarmony: result.colorHarmony,
      createdAt: Date.now(),
    };
  }

  async save(db: DatabaseWriter, result: ColorAnalysisResult): Promise<void> {
    await db.insert("color_analysis", {
      runId: result.runId,
      artistSlug: result.artistSlug,
      dominantColors: result.dominantColors,
      temperature: result.temperature,
      avgSaturation: result.saturation,
      harmony: result.colorHarmony,
      createdAt: result.createdAt,
    });
  }
}
