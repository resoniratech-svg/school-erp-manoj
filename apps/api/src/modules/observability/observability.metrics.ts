/**
 * Metrics Registry
 * In-memory metrics with Prometheus-compatible export
 */
import { METRIC_NAME, LATENCY_BUCKETS } from './observability.constants';
import type { HistogramData } from './observability.types';

// Counters
const counters = new Map<string, Map<string, number>>();

// Gauges
const gauges = new Map<string, Map<string, number>>();

// Histograms
const histograms = new Map<string, Map<string, HistogramData>>();

/**
 * Increment a counter
 */
export function incCounter(name: string, labels: Record<string, string> = {}, value = 1): void {
    const labelKey = labelsToKey(labels);
    if (!counters.has(name)) {
        counters.set(name, new Map());
    }
    const current = counters.get(name)!.get(labelKey) || 0;
    counters.get(name)!.set(labelKey, current + value);
}

/**
 * Set a gauge value
 */
export function setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const labelKey = labelsToKey(labels);
    if (!gauges.has(name)) {
        gauges.set(name, new Map());
    }
    gauges.get(name)!.set(labelKey, value);
}

/**
 * Observe a histogram value
 */
export function observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const labelKey = labelsToKey(labels);
    if (!histograms.has(name)) {
        histograms.set(name, new Map());
    }

    const metricMap = histograms.get(name)!;
    if (!metricMap.has(labelKey)) {
        metricMap.set(labelKey, {
            count: 0,
            sum: 0,
            buckets: new Map(LATENCY_BUCKETS.map(b => [b, 0])),
        });
    }

    const data = metricMap.get(labelKey)!;
    data.count++;
    data.sum += value;

    // Increment bucket counts
    for (const bucket of LATENCY_BUCKETS) {
        if (value <= bucket) {
            data.buckets.set(bucket, (data.buckets.get(bucket) || 0) + 1);
        }
    }
}

/**
 * Get counter value
 */
export function getCounter(name: string, labels: Record<string, string> = {}): number {
    const labelKey = labelsToKey(labels);
    return counters.get(name)?.get(labelKey) || 0;
}

/**
 * Get gauge value
 */
export function getGauge(name: string, labels: Record<string, string> = {}): number {
    const labelKey = labelsToKey(labels);
    return gauges.get(name)?.get(labelKey) || 0;
}

/**
 * Get histogram data
 */
export function getHistogram(name: string, labels: Record<string, string> = {}): HistogramData | null {
    const labelKey = labelsToKey(labels);
    return histograms.get(name)?.get(labelKey) || null;
}

/**
 * Calculate percentile from histogram
 */
export function calculatePercentile(histogram: HistogramData, percentile: number): number {
    const targetCount = histogram.count * (percentile / 100);
    let cumulative = 0;

    for (const [bucket, count] of histogram.buckets.entries()) {
        cumulative += count;
        if (cumulative >= targetCount) {
            return bucket;
        }
    }

    return histogram.sum / histogram.count; // fallback to average
}

/**
 * Export metrics in Prometheus format
 */
export function exportPrometheusMetrics(): string {
    const lines: string[] = [];

    // Export counters
    for (const [name, values] of counters.entries()) {
        lines.push(`# HELP ${name} Counter metric`);
        lines.push(`# TYPE ${name} counter`);
        for (const [labelKey, value] of values.entries()) {
            const labels = labelKey ? `{${labelKey}}` : '';
            lines.push(`${name}${labels} ${value}`);
        }
    }

    // Export gauges
    for (const [name, values] of gauges.entries()) {
        lines.push(`# HELP ${name} Gauge metric`);
        lines.push(`# TYPE ${name} gauge`);
        for (const [labelKey, value] of values.entries()) {
            const labels = labelKey ? `{${labelKey}}` : '';
            lines.push(`${name}${labels} ${value}`);
        }
    }

    // Export histograms
    for (const [name, values] of histograms.entries()) {
        lines.push(`# HELP ${name} Histogram metric`);
        lines.push(`# TYPE ${name} histogram`);
        for (const [labelKey, data] of values.entries()) {
            const labelPrefix = labelKey ? `${labelKey},` : '';
            for (const [bucket, count] of data.buckets.entries()) {
                lines.push(`${name}_bucket{${labelPrefix}le="${bucket}"} ${count}`);
            }
            lines.push(`${name}_bucket{${labelPrefix}le="+Inf"} ${data.count}`);
            lines.push(`${name}_sum{${labelKey}} ${data.sum}`);
            lines.push(`${name}_count{${labelKey}} ${data.count}`);
        }
    }

    return lines.join('\n');
}

/**
 * Reset all metrics (for testing)
 */
export function resetMetrics(): void {
    counters.clear();
    gauges.clear();
    histograms.clear();
}

/**
 * Convert labels object to string key
 */
function labelsToKey(labels: Record<string, string>): string {
    const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([k, v]) => `${k}="${v}"`).join(',');
}
