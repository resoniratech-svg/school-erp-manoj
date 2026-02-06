/**
 * Metrics Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
    incCounter,
    setGauge,
    observeHistogram,
    getCounter,
    getGauge,
    getHistogram,
    calculatePercentile,
    exportPrometheusMetrics,
    resetMetrics,
} from '../observability.metrics';

describe('Metrics', () => {
    beforeEach(() => {
        resetMetrics();
    });

    describe('counter aggregation', () => {
        it('should increment counter correctly', () => {
            incCounter('test_counter', { method: 'GET' });
            incCounter('test_counter', { method: 'GET' });
            incCounter('test_counter', { method: 'POST' });

            expect(getCounter('test_counter', { method: 'GET' })).toBe(2);
            expect(getCounter('test_counter', { method: 'POST' })).toBe(1);
        });

        it('should increment counter by custom value', () => {
            incCounter('test_counter', {}, 5);
            incCounter('test_counter', {}, 3);

            expect(getCounter('test_counter')).toBe(8);
        });
    });

    describe('gauge', () => {
        it('should set gauge value', () => {
            setGauge('test_gauge', 100);
            expect(getGauge('test_gauge')).toBe(100);

            setGauge('test_gauge', 50);
            expect(getGauge('test_gauge')).toBe(50);
        });
    });

    describe('histogram', () => {
        it('should observe histogram values', () => {
            observeHistogram('test_histogram', 0.1);
            observeHistogram('test_histogram', 0.5);
            observeHistogram('test_histogram', 1.0);

            const data = getHistogram('test_histogram');
            expect(data).not.toBeNull();
            expect(data!.count).toBe(3);
            expect(data!.sum).toBe(1.6);
        });

        it('should calculate percentiles correctly', () => {
            // Add many observations
            for (let i = 0; i < 100; i++) {
                observeHistogram('latency', i / 100);
            }

            const data = getHistogram('latency');
            expect(data).not.toBeNull();

            const p50 = calculatePercentile(data!, 50);
            const p95 = calculatePercentile(data!, 95);

            expect(p50).toBeGreaterThan(0);
            expect(p95).toBeGreaterThan(p50);
        });
    });

    describe('prometheus export', () => {
        it('should export in prometheus format', () => {
            incCounter('http_requests_total', { method: 'GET', path: '/api' });
            setGauge('memory_usage', 1024);

            const output = exportPrometheusMetrics();

            expect(output).toContain('http_requests_total');
            expect(output).toContain('memory_usage');
            expect(output).toContain('# TYPE');
            expect(output).toContain('# HELP');
        });
    });

    describe('no tenant data leakage', () => {
        it('should not expose tenant identifiers in metrics', () => {
            incCounter('http_requests_total', { method: 'GET', path: '/users/:id' });
            setGauge('active_connections', 10);

            const output = exportPrometheusMetrics();

            // Should not contain UUIDs or tenant-specific data
            expect(output).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/);
            expect(output).not.toContain('tenantId');
        });
    });
});
