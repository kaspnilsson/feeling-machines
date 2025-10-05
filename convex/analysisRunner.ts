/**
 * Unified analysis pipeline abstraction
 * Provides a consistent interface for all analysis types (sentiment, color, materiality)
 */
"use node";

import { Id } from "./_generated/dataModel";
import { DatabaseWriter } from "./_generated/server";
import { Logger } from "../utils/logger";

const logger = new Logger("analysisRunner");

/**
 * Base interface for analysis results
 */
export interface AnalysisResult {
  runId: Id<"runs">;
  artistSlug: string;
  createdAt: number;
}

/**
 * Input data for analysis
 */
export interface RunData {
  runId: Id<"runs">;
  artistSlug: string;
  artistStmt: string;
  imageUrl: string | null;
}

/**
 * Abstract base class for all analysis runners
 */
export abstract class AnalysisRunner<T extends AnalysisResult> {
  abstract readonly name: string;
  abstract readonly requiresImage: boolean;

  /**
   * Perform the analysis on run data
   */
  abstract analyze(data: RunData): Promise<T>;

  /**
   * Save analysis results to database
   */
  abstract save(db: DatabaseWriter, result: T): Promise<void>;

  /**
   * Check if this analysis can run on the given data
   */
  canRun(data: RunData): boolean {
    if (this.requiresImage && !data.imageUrl) {
      return false;
    }
    return true;
  }

  /**
   * Execute analysis with error handling and logging
   */
  async execute(data: RunData, db: DatabaseWriter): Promise<boolean> {
    if (!this.canRun(data)) {
      logger.info(`Skipping ${this.name} analysis`, {
        runId: data.runId,
        reason: this.requiresImage ? "no image" : "unknown",
      });
      return false;
    }

    try {
      logger.info(`Starting ${this.name} analysis`, {
        runId: data.runId,
        artistSlug: data.artistSlug,
      });

      const startTime = Date.now();
      const result = await this.analyze(data);
      const duration = Date.now() - startTime;

      await this.save(db, result);

      logger.info(`${this.name} analysis complete`, {
        runId: data.runId,
        durationMs: duration,
      });

      return true;
    } catch (error) {
      logger.error(
        `${this.name} analysis failed`,
        error instanceof Error ? error : new Error(String(error)),
        {
          runId: data.runId,
          artistSlug: data.artistSlug,
        }
      );
      return false;
    }
  }
}

/**
 * Orchestrates multiple analysis runners
 */
export class AnalysisPipeline {
  private runners: AnalysisRunner<AnalysisResult>[] = [];

  /**
   * Register an analysis runner
   */
  register(runner: AnalysisRunner<AnalysisResult>) {
    this.runners.push(runner);
    logger.info(`Registered analysis runner`, { name: runner.name });
  }

  /**
   * Execute all registered analyses in parallel
   */
  async executeAll(data: RunData, db: DatabaseWriter): Promise<AnalysisResults> {
    logger.info(`Starting analysis pipeline`, {
      runId: data.runId,
      runnerCount: this.runners.length,
    });

    const startTime = Date.now();

    // Execute all analyses in parallel
    const results = await Promise.allSettled(
      this.runners.map((runner) => runner.execute(data, db))
    );

    const duration = Date.now() - startTime;

    // Aggregate results
    const summary: AnalysisResults = {
      total: this.runners.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      durationMs: duration,
    };

    results.forEach((result, index) => {
      const runnerName = this.runners[index].name;

      if (result.status === "fulfilled") {
        if (result.value) {
          summary.successful++;
        } else {
          summary.skipped++;
        }
      } else {
        summary.failed++;
        logger.error(
          `Analysis runner failed`,
          result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
          {
            runnerName,
            runId: data.runId,
          }
        );
      }
    });

    logger.info(`Analysis pipeline complete`, {
      runId: data.runId,
      ...summary,
    });

    return summary;
  }
}

/**
 * Results summary from pipeline execution
 */
export interface AnalysisResults {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  durationMs: number;
}
