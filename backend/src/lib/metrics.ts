/**
 * Metrics Collection Facade
 * Provides a simple interface for recording metrics with pluggable backends
 */

import { IMetricsAdapter, InMemoryMetricsAdapter, MetricLabels } from './adapters/metrics.adapter';

class Metrics {
  private adapter: IMetricsAdapter;

  constructor(adapter?: IMetricsAdapter) {
    this.adapter = adapter || new InMemoryMetricsAdapter();
  }

  /**
   * Set the metrics adapter
   */
  setAdapter(adapter: IMetricsAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Get current adapter
   */
  getAdapter(): IMetricsAdapter {
    return this.adapter;
  }

  /**
   * Increment a counter
   */
  increment(name: string, value: number = 1, labels?: MetricLabels): void {
    this.adapter.recordCounter(name, value, labels);
  }

  /**
   * Set a gauge value
   */
  gauge(name: string, value: number, labels?: MetricLabels): void {
    this.adapter.recordGauge(name, value, labels);
  }

  /**
   * Record a histogram value
   */
  histogram(name: string, value: number, labels?: MetricLabels): void {
    this.adapter.recordHistogram(name, value, labels);
  }

  /**
   * Record a timing (duration in milliseconds)
   */
  timing(name: string, durationMs: number, labels?: MetricLabels): void {
    this.adapter.recordTiming(name, durationMs, labels);
  }

  /**
   * Time a function execution
   */
  async time<T>(
    name: string,
    fn: () => Promise<T>,
    labels?: MetricLabels
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.timing(name, duration, labels);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.timing(name, duration, { ...labels, error: 'true' });
      throw error;
    }
  }

  /**
   * Time a synchronous function execution
   */
  timeSync<T>(name: string, fn: () => T, labels?: MetricLabels): T {
    const start = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - start;
      this.timing(name, duration, labels);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.timing(name, duration, { ...labels, error: 'true' });
      throw error;
    }
  }
}

// Global metrics instance
export const metrics = new Metrics();

// Convenience functions
export const incrementCounter = (name: string, value?: number, labels?: MetricLabels) =>
  metrics.increment(name, value, labels);

export const setGauge = (name: string, value: number, labels?: MetricLabels) =>
  metrics.gauge(name, value, labels);

export const recordHistogram = (name: string, value: number, labels?: MetricLabels) =>
  metrics.histogram(name, value, labels);

export const recordTiming = (name: string, durationMs: number, labels?: MetricLabels) =>
  metrics.timing(name, durationMs, labels);

export const measureTime = <T>(name: string, fn: () => Promise<T>, labels?: MetricLabels) =>
  metrics.time(name, fn, labels);
