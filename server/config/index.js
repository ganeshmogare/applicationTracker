require('dotenv').config();

function getEnv(key, fallback) {
  const val = process.env[key];
  return val === undefined ? fallback : val;
}

// Determine if we're running locally or in production
const isLocal = process.env.NODE_ENV === 'development' || process.env.USE_LOCAL_DB === 'true';

module.exports = {
  server: {
    port: Number(getEnv('API_PORT', 3001)),
    corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:3002'),
  },
  temporal: {
    address: getEnv('TEMPORAL_ADDRESS', '10.0.3.205:7233'),
  },
  database: {
    // Database type: 'sqlite' for local development, 'postgresql' for production
    type: isLocal ? 'sqlite' : 'postgresql',
    
    // SQLite configuration (for local development)
    sqlite: {
      filename: './data/applications.db',
    },
    
    // PostgreSQL configuration (for production/cloud)
    postgresql: {
      host: getEnv('DB_HOST', 'localhost'),
      port: Number(getEnv('DB_PORT', 5432)),
      user: getEnv('DB_USER', 'temporal'),
      password: getEnv('DB_PASSWORD', 'temporal'),
      database: getEnv('DB_NAME', 'temporal'),
    },
    
    // Legacy support - keep the old structure for backward compatibility
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
  
  // Environment information
  environment: {
    isLocal,
    nodeEnv: process.env.NODE_ENV || 'development',
    useLocalDb: isLocal,
  }
};
