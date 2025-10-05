/**
 * Structured logging utilities for observability
 * Provides consistent logging format across the application
 */
"use node";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  timestamp: number;
  level: LogLevel;
  context: string;
  message: string;
  [key: string]: unknown;
}

export interface MetricData {
  type: "metric";
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp: number;
}

/**
 * Structured logger with JSON output for easy parsing
 */
export class Logger {
  constructor(private defaultContext: string = "app") {}

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const logEntry: LogContext = {
      timestamp: Date.now(),
      level,
      context: this.defaultContext,
      message,
      ...meta,
    };

    const output = JSON.stringify(logEntry);

    switch (level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "debug":
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.log("debug", message, meta);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log("warn", message, meta);
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>) {
    const errorMeta: Record<string, unknown> = { ...meta };

    if (error instanceof Error) {
      errorMeta.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      errorMeta.error = String(error);
    }

    this.log("error", message, errorMeta);
  }

  /**
   * Log a metric for monitoring
   */
  metric(name: string, value: number, tags?: Record<string, string>, unit?: string) {
    const metricData: MetricData = {
      type: "metric",
      name,
      value,
      unit,
      tags,
      timestamp: Date.now(),
    };

    console.log(JSON.stringify(metricData));
  }

  /**
   * Create a child logger with a specific context
   */
  child(context: string): Logger {
    return new Logger(context);
  }
}

// Default logger instance
export const logger = new Logger();

/**
 * Performance measurement utilities
 */
export class PerformanceMonitor {
  private startTime: number;
  private context: string;
  private logger: Logger;

  constructor(context: string) {
    this.context = context;
    this.startTime = Date.now();
    this.logger = new Logger(context);
  }

  /**
   * Mark the end of an operation and log duration
   */
  end(meta?: Record<string, unknown>) {
    const duration = Date.now() - this.startTime;
    this.logger.info(`Operation completed`, {
      durationMs: duration,
      ...meta,
    });
    this.logger.metric(`${this.context}.duration`, duration, undefined, "ms");
    return duration;
  }

  /**
   * Log an intermediate checkpoint
   */
  checkpoint(label: string, meta?: Record<string, unknown>) {
    const elapsed = Date.now() - this.startTime;
    this.logger.debug(`Checkpoint: ${label}`, {
      elapsedMs: elapsed,
      ...meta,
    });
  }
}

/**
 * Create a performance monitor for an operation
 */
export function monitor(context: string): PerformanceMonitor {
  return new PerformanceMonitor(context);
}

/**
 * API call metrics tracking
 */
export interface APIMetrics {
  provider: string;
  operation: string;
  duration: number;
  cost?: number;
  tokens?: number;
  status: "success" | "error";
  errorType?: string;
}

export function logAPICall(metrics: APIMetrics) {
  const apiLogger = new Logger("api");

  apiLogger.info(`API call completed`, {
    provider: metrics.provider,
    operation: metrics.operation,
    durationMs: metrics.duration,
    cost: metrics.cost,
    tokens: metrics.tokens,
    status: metrics.status,
    errorType: metrics.errorType,
  });

  // Log metrics for aggregation
  apiLogger.metric(
    `api.${metrics.provider}.${metrics.operation}.duration`,
    metrics.duration,
    { status: metrics.status },
    "ms"
  );

  if (metrics.cost) {
    apiLogger.metric(
      `api.${metrics.provider}.${metrics.operation}.cost`,
      metrics.cost,
      { status: metrics.status },
      "usd"
    );
  }

  if (metrics.tokens) {
    apiLogger.metric(
      `api.${metrics.provider}.${metrics.operation}.tokens`,
      metrics.tokens,
      { status: metrics.status },
      "tokens"
    );
  }
}

/**
 * Batch operation metrics
 */
export interface BatchMetrics {
  runGroupId: string;
  totalRuns: number;
  successCount: number;
  failureCount: number;
  totalDuration: number;
  totalCost: number;
  avgLatency: number;
}

export function logBatchCompletion(metrics: BatchMetrics) {
  const batchLogger = new Logger("batch");

  const successRate = (metrics.successCount / metrics.totalRuns) * 100;

  batchLogger.info(`Batch completed`, {
    runGroupId: metrics.runGroupId,
    totalRuns: metrics.totalRuns,
    successCount: metrics.successCount,
    failureCount: metrics.failureCount,
    successRate: successRate.toFixed(2),
    totalDurationMs: metrics.totalDuration,
    totalCost: metrics.totalCost,
    avgLatencyMs: metrics.avgLatency,
  });

  // Log metrics
  batchLogger.metric("batch.success_rate", successRate, { runGroupId: metrics.runGroupId }, "%");
  batchLogger.metric("batch.total_cost", metrics.totalCost, { runGroupId: metrics.runGroupId }, "usd");
  batchLogger.metric("batch.avg_latency", metrics.avgLatency, { runGroupId: metrics.runGroupId }, "ms");
}
