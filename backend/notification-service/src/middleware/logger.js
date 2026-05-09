const PII_FIELDS = ['email', 'phone', 'password', 'ssn', 'dob', 'address'];

function maskPII(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const masked = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(masked)) {
    if (PII_FIELDS.includes(key.toLowerCase())) {
      masked[key] = '***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskPII(masked[key]);
    }
  }
  return masked;
}

const logger = {
  _log(level, message, meta = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(Object.keys(meta).length ? { meta: maskPII(meta) } : {}),
    };
    process.stdout.write(JSON.stringify(entry) + '\n');
  },
  info(message, meta = {})  { this._log('INFO',  message, meta); },
  warn(message, meta = {})  { this._log('WARN',  message, meta); },
  error(message, meta = {}) { this._log('ERROR', message, meta); },
  debug(message, meta = {}) { this._log('DEBUG', message, meta); },
};

module.exports = logger;
