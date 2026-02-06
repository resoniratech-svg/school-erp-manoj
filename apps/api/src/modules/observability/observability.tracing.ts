/**
 * Request Tracing
 * Distributed tracing support
 */
import { v4 as uuid } from 'uuid';

// Active traces
const activeTraces = new Map<string, TraceContext>();

export interface TraceContext {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    startTime: number;
    operation: string;
    tags: Record<string, string>;
}

/**
 * Start a new trace
 */
export function startTrace(operation: string, parentTraceId?: string): TraceContext {
    const traceId = parentTraceId || uuid();
    const spanId = uuid().slice(0, 16);

    const context: TraceContext = {
        traceId,
        spanId,
        startTime: Date.now(),
        operation,
        tags: {},
    };

    activeTraces.set(spanId, context);
    return context;
}

/**
 * End a trace and get duration
 */
export function endTrace(spanId: string): number {
    const context = activeTraces.get(spanId);
    if (!context) return 0;

    const duration = Date.now() - context.startTime;
    activeTraces.delete(spanId);
    return duration;
}

/**
 * Add tag to trace
 */
export function addTraceTag(spanId: string, key: string, value: string): void {
    const context = activeTraces.get(spanId);
    if (context) {
        context.tags[key] = value;
    }
}

/**
 * Get trace context
 */
export function getTraceContext(spanId: string): TraceContext | undefined {
    return activeTraces.get(spanId);
}

/**
 * Create child span
 */
export function createChildSpan(parentSpanId: string, operation: string): TraceContext {
    const parent = activeTraces.get(parentSpanId);
    const context: TraceContext = {
        traceId: parent?.traceId || uuid(),
        spanId: uuid().slice(0, 16),
        parentSpanId,
        startTime: Date.now(),
        operation,
        tags: {},
    };

    activeTraces.set(context.spanId, context);
    return context;
}

/**
 * Extract trace headers for propagation
 */
export function extractTraceHeaders(spanId: string): Record<string, string> {
    const context = activeTraces.get(spanId);
    if (!context) return {};

    return {
        'x-trace-id': context.traceId,
        'x-span-id': context.spanId,
        'x-parent-span-id': context.parentSpanId || '',
    };
}
