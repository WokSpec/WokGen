/**
 * OpenTelemetry initialization — no-ops when OTEL_EXPORTER_OTLP_ENDPOINT is unset.
 * Exports to any OTLP-compatible backend (Honeycomb, Jaeger, self-hosted).
 */
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

export function getTracer(name = 'wokgen') {
  return trace.getTracer(name, process.env.npm_package_version ?? '1.0.0');
}

export async function withSpan<T>(
  name: string,
  attrs: Record<string, string | number | boolean>,
  fn: () => Promise<T>
): Promise<T> {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, async span => {
    try {
      Object.entries(attrs).forEach(([k, v]) => span.setAttribute(k, v));
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  });
}
