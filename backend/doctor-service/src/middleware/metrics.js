const client = require('prom-client');

// Collect default Node.js metrics (memory, CPU, event loop, etc.)
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// ── Custom Metrics ────────────────────────────────────────────────────────────

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
  registers: [register],
});

const httpRequestDurationMs = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500],
  registers: [register],
});

const appointmentsCreatedTotal = new client.Counter({
  name: 'appointments_created_total',
  help: 'Total number of appointments created',
  registers: [register],
});

const appointmentsCancelledTotal = new client.Counter({
  name: 'appointments_cancelled_total',
  help: 'Total number of appointments cancelled',
  registers: [register],
});

const billCreationLatencyMs = new client.Histogram({
  name: 'bill_creation_latency_ms',
  help: 'Latency of bill creation in milliseconds',
  buckets: [10, 50, 100, 250, 500, 1000],
  registers: [register],
});

const paymentsFailedTotal = new client.Counter({
  name: 'payments_failed_total',
  help: 'Total number of failed payment attempts',
  registers: [register],
});

const paymentsSuccessTotal = new client.Counter({
  name: 'payments_success_total',
  help: 'Total number of successful payments',
  registers: [register],
});

// ── HTTP Middleware ────────────────────────────────────────────────────────────

function metricsMiddleware(serviceName) {
  return (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const route = req.route ? req.route.path : req.path;
      const labels = {
        method: req.method,
        route,
        status_code: res.statusCode,
        service: serviceName,
      };
      httpRequestsTotal.inc(labels);
      httpRequestDurationMs.observe(labels, duration);
    });
    next();
  };
}

module.exports = {
  register,
  metricsMiddleware,
  appointmentsCreatedTotal,
  appointmentsCancelledTotal,
  billCreationLatencyMs,
  paymentsFailedTotal,
  paymentsSuccessTotal,
};
