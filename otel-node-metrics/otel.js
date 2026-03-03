/*
  otel.js
  Metrics-only OpenTelemetry setup for Node.js
  - Exports metrics via OTLP HTTP to OTEL_COLLECTOR_URL (default: http://otel-collector:4318/v1/metrics)
  - Registers HTTP and Express instrumentations (no tracing provider is initialized)
  - Starts host metrics
  - Provides Meter and helper shutdown function
*/

const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const hostMetrics = require('@opentelemetry/host-metrics');

// Configuration via environment
const OTEL_COLLECTOR_URL = process.env.OTEL_COLLECTOR_URL || 'http://otel-collector:4318/v1/metrics';
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'my-node-service';

// Create OTLP exporter that will send metrics to the collector over HTTP
const metricExporter = new OTLPMetricExporter({ url: OTEL_COLLECTOR_URL });

// MeterProvider + resource (service name)
const meterProvider = new MeterProvider({
  resource: new Resource({ [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME })
});

// Periodically export metrics (production-friendly defaults)
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 10000, // send every 10s
  exportTimeoutMillis: 5000
});

meterProvider.addMetricReader(metricReader);

// Start host metrics (CPU, memory, event loop, etc.) and attach to our meterProvider
try {
  hostMetrics.start({ meterProvider, name: 'host-metrics', interval: 10000 });
} catch (err) {
  // best-effort: do not crash application for metrics agent failures
  // keep minimal console error for visibility; avoid telemetry/log export
  console.error('hostMetrics.start() failed:', err && err.message ? err.message : err);
}

// Register HTTP + Express instrumentations (they will not export traces because no tracer is initialized)
registerInstrumentations({
  instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()]
});

// Exported helper: get a Meter from our provider for application use
function getMeter(name = SERVICE_NAME) {
  return meterProvider.getMeter(name);
}

// Graceful shutdown helper
async function shutdown(timeoutMs = 5000) {
  try {
    // Stop metric reader and exporter
    await metricReader.shutdown();
  } catch (err) {
    // ignore shutdown errors, but surface minimal info
    console.error('metricReader.shutdown() failed:', err && err.message ? err.message : err);
  }

  try {
    if (metricExporter && typeof metricExporter.shutdown === 'function') {
      await metricExporter.shutdown();
    }
  } catch (err) {
    console.error('metricExporter.shutdown() failed:', err && err.message ? err.message : err);
  }

  try {
    if (meterProvider && typeof meterProvider.shutdown === 'function') {
      await meterProvider.shutdown();
    }
  } catch (err) {
    console.error('meterProvider.shutdown() failed:', err && err.message ? err.message : err);
  }

  // allow optional timeout for other cleanup
  return new Promise((resolve) => setTimeout(resolve, timeoutMs));
}

module.exports = { getMeter, shutdown };
