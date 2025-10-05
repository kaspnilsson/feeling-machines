/**
 * Materiality analysis runner
 */
"use node";

import { AnalysisRunner, AnalysisResult, RunData } from "../analysisRunner";
import { DatabaseWriter } from "../_generated/server";
import { analyzeMateriality } from "../../scripts/analyze-materiality";

interface MaterialityAnalysisResult extends AnalysisResult {
  materials: string[];
  concreteMaterials: string[];
  speculativeMaterials: string[];
  impossibilityScore: number;
  technicalDetail: number;
}

export class MaterialityRunner extends AnalysisRunner<MaterialityAnalysisResult> {
  readonly name = "materiality";
  readonly requiresImage = false;

  async analyze(data: RunData): Promise<MaterialityAnalysisResult> {
    const result = await analyzeMateriality({
      runId: data.runId,
      artistSlug: data.artistSlug,
      statement: data.artistStmt,
    });

    // Extract material strings from MaterialClassification objects
    const materials = result.materials.map((m) => m.material);

    return {
      runId: data.runId,
      artistSlug: data.artistSlug,
      materials,
      concreteMaterials: result.concreteMedia,
      speculativeMaterials: result.speculativeMedia,
      impossibilityScore: result.impossibilityScore,
      technicalDetail: result.technicalDetail,
      createdAt: Date.now(),
    };
  }

  async save(db: DatabaseWriter, result: MaterialityAnalysisResult): Promise<void> {
    await db.insert("materiality_analysis", {
      runId: result.runId,
      artistSlug: result.artistSlug,
      materials: result.materials,
      concreteMaterials: result.concreteMaterials,
      speculativeMaterials: result.speculativeMaterials,
      impossibilityScore: result.impossibilityScore,
      technicalDetail: result.technicalDetail,
      createdAt: result.createdAt,
    });
  }
}
