/**
 * Metrics Adapter Interface
 * Allows pluggable metrics collection for observability
 */

export interface MetricLabels {
  [key: string]: string | number;
}

export interface IMetricsAdapter {
  /**
   * Record a counter metric (monotonically increasing)
   */
  recordCounter(name: string, value: number, labels?: MetricLabels): void;

  /**
   * Record a gauge metric (can go up or down)
   */
  recordGauge(name: string, value: number, labels?: MetricLabels): void;

  /**
   * Record a histogram metric (distribution of values)
   */
  recordHistogram(name: string, value: number, labels?: MetricLabels): void;

  /**
   * Record a timing metric (in milliseconds)
   */
  recordTiming(name: string, durationMs: number, labels?: MetricLabels): void;

  /**
   * Get adapter name
   */
  getName(): string;
}

/**
 * In-Memory Metrics Adapter (for development/testing)
 */
export class InMemoryMetricsAdapter implements IMetricsAdapter {
  private metrics: Map<string, any[]> = new Map();

  recordCounter(name: string, value: number, labels?: MetricLabels): void {
    this.record('counter', name, value, labels);
  }

  recordGauge(name: string, value: number, labels?: MetricLabels): void {
    this.record('gauge', name, value, labels);
  }

  recordHistogram(name: string, value: number, labels?: MetricLabels): void {
    this.record('histogram', name, value, labels);
  }

  recordTiming(name: string, durationMs: number, labels?: MetricLabels): void {
    this.record('timing', name, durationMs, labels);
  }

  private record(type: string, name: string, value: number, labels?: MetricLabels): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push({
      type,
      value,
      labels,
      timestamp: new Date(),
    });
  }

  getName(): string {
    return 'in-memory';
  }

  /**
   * Get all recorded metrics (useful for testing)
   */
  getMetrics(name?: string): any[] {
    if (name) {
      return this.metrics.get(name) || [];
    }
    return Array.from(this.metrics.entries()).flatMap(([, values]) => values);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

/**
 * Console Metrics Adapter (logs metrics to console)
 */
export class ConsoleMetricsAdapter implements IMetricsAdapter {
  recordCounter(name: string, value: number, labels?: MetricLabels): void {
    this.log('COUNTER', name, value, labels);
  }

  recordGauge(name: string, value: number, labels?: MetricLabels): void {
    this.log('GAUGE', name, value, labels);
  }

  recordHistogram(name: string, value: number, labels?: MetricLabels): void {
    this.log('HISTOGRAM', name, value, labels);
  }

  recordTiming(name: string, durationMs: number, labels?: MetricLabels): void {
    this.log('TIMING', name, durationMs, labels);
  }

  private log(type: string, name: string, value: number, labels?: MetricLabels): void {
    const labelsStr = labels ? ` ${JSON.stringify(labels)}` : '';
    console.log(`[METRIC] ${type} ${name}=${value}${labelsStr}`);
  }

  getName(): string {
    return 'console';
  }
}

/**
 * Prometheus-style Metrics Adapter (placeholder for future implementation)
 */
export class PrometheusMetricsAdapter implements IMetricsAdapter {
  // This would integrate with prom-client library
  // For now, it's a stub showing the interface

  recordCounter(name: string, value: number, labels?: MetricLabels): void {
    // Would call: counter.inc(labels, value)
    console.log(`[Prometheus] Counter: ${name}=${value}`, labels);
  }

  recordGauge(name: string, value: number, labels?: MetricLabels): void {
    // Would call: gauge.set(labels, value)
    console.log(`[Prometheus] Gauge: ${name}=${value}`, labels);
  }

  recordHistogram(name: string, value: number, labels?: MetricLabels): void {
    // Would call: histogram.observe(labels, value)
    console.log(`[Prometheus] Histogram: ${name}=${value}`, labels);
  }

  recordTiming(name: string, durationMs: number, labels?: MetricLabels): void {
    // Would call: histogram.observe(labels, durationMs / 1000)
    console.log(`[Prometheus] Timing: ${name}=${durationMs}ms`, labels);
  }

  getName(): string {
    return 'prometheus';
  }
}
