const { randomUUID } = require('crypto');

function createError(code, message, statusCode = 500) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || randomUUID();
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
    correlationId,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { createError, errorHandler };
