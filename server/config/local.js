require('dotenv').config();

function getEnv(key, fallback) {
  const val = process.env[key];
  return val === undefined ? fallback : val;
}

module.exports = {
  server: {
    port: Number(getEnv('API_PORT', 3001)),
    corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:3001'),
  },
  temporal: {
    address: getEnv('TEMPORAL_ADDRESS', 'localhost:7233'),
  },
  database: {
    // Use SQLite for local development
    type: 'sqlite',
    filename: './data/applications.db',
    // PostgreSQL config (for reference, not used in local mode)
    host: getEnv('DB_HOST', 'localhost'),
    port: Number(getEnv('DB_PORT', 5432)),
    user: getEnv('DB_USER', 'temporal'),
    password: getEnv('DB_PASSWORD', 'temporal'),
    database: getEnv('DB_NAME', 'temporal'),
  },
  email: {
    host: getEnv('EMAIL_SMTP_HOST'),
    port: Number(getEnv('EMAIL_SMTP_PORT', 587)),
    user: getEnv('EMAIL_SMTP_USER'),
    pass: getEnv('EMAIL_SMTP_PASS'),
    from: getEnv('EMAIL_FROM'),
    to: getEnv('EMAIL_TO'),
  },
  gemini: {
    apiKey: getEnv('GEMINI_API_KEY'),
    model: getEnv('GEMINI_MODEL', 'gemini-1.5-flash'),
  },
};
