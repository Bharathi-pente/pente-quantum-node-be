// Import OTEL setup before any other modules that create metrics
const { getMeter, shutdown: otelShutdown } = require('./otel');

const express = require('express');

const SERVICE_METER_NAME = process.env.OTEL_METER_NAME || 'example-service-meter';
const meter = getMeter(SERVICE_METER_NAME);

// Custom metrics: counter and histogram
const requestCounter = meter.createCounter('http.server.requests', {
  description: 'Count of incoming HTTP requests'
});

const requestDuration = meter.createHistogram('http.server.duration', {
  description: 'Duration of HTTP requests in milliseconds'
});

const app = express();

// Middleware to record request metrics
app.use((req, res, next) => {
  const start = process.hrtime();

  // on finish, record duration and increment counter
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationMs = diff[0] * 1000 + diff[1] / 1e6;

    const attrs = {
      'http.method': req.method,
      'http.route': req.route && req.route.path ? req.route.path : req.path,
      'http.status_code': res.statusCode
    };

    // increment counter
    requestCounter.add(1, attrs);

    // record duration (histogram)
    requestDuration.record(durationMs, attrs);
  });

  next();
});

// Example route
app.get('/hello', (req, res) => {
  // Example of recording a custom metric inside route
  const helloCounter = meter.createCounter('app.hello.requests', {
    description: 'Hello endpoint hits'
  });
  helloCounter.add(1, { 'endpoint': '/hello' });

  // Simulate some work for histogram example
  const workStart = process.hrtime();
  // quick synchronous work
  for (let i = 0; i < 100000; i++) { /* noop busy work */ }
  const workDiff = process.hrtime(workStart);
  const workMs = workDiff[0] * 1000 + workDiff[1] / 1e6;
  const workHistogram = meter.createHistogram('app.hello.work.ms', {
    description: 'Work time inside hello'
  });
  workHistogram.record(workMs, { endpoint: '/hello' });

  res.json({ message: 'Hello, world!' });
});

// health
app.get('/health', (req, res) => res.sendStatus(200));

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const server = app.listen(PORT, () => {
  // minimal console to confirm server started when running locally
  console.log(`Server listening on port ${PORT}`);
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`Received ${signal}, shutting down server...`);
  server.close(async (err) => {
    if (err) {
      console.error('Server close error:', err);
      process.exit(1);
    }

    // Shutdown OpenTelemetry components
    try {
      await otelShutdown();
    } catch (e) {
      console.error('Error during otel shutdown:', e && e.message ? e.message : e);
    }

    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
