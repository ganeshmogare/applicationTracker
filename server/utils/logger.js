const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Security: List of sensitive fields that should be redacted
const SENSITIVE_FIELDS = [
  'password',
  'pass',
  'secret',
  'key',
  'token',
  'api_key',
  'apiKey',
  'authorization',
  'auth',
  'credential',
  'private',
  'sensitive',
  'GEMINI_API_KEY',
  'EMAIL_SMTP_PASS',
  'DB_PASSWORD',
  'JWT_SECRET',
  'SESSION_SECRET'
];

// Security: Sanitize sensitive data from objects
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = Array.isArray(data) ? [] : {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    // Check if this field contains sensitive data
    const isSensitive = SENSITIVE_FIELDS.some(field => 
      lowerKey.includes(field.toLowerCase())
    );
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Enhanced error serialization
const serializeError = (error) => {
  if (!error) return null;
  
  const serialized = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
  
  // Add additional error properties if they exist
  if (error.code) serialized.code = error.code;
  if (error.statusCode) serialized.statusCode = error.statusCode;
  if (error.status) serialized.status = error.status;
  
  return serialized;
};

// Define log format with security and error handling
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, error, ...meta }) => {
    // Sanitize all metadata
    const sanitizedMeta = sanitizeData(meta);
    
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    // Handle error objects specially
    if (error) {
      const serializedError = serializeError(error);
      if (serializedError) {
        log += `\nError: ${JSON.stringify(serializedError, null, 2)}`;
      }
    }
    
    if (Object.keys(sanitizedMeta).length > 0) {
      log += `\n${JSON.stringify(sanitizedMeta, null, 2)}`;
    }
    
    return log;
  })
);

// Create daily rotate file transport for different log levels
const createDailyRotateTransport = (level, filename) => {
  return new DailyRotateFile({
    filename: path.join(logsDir, `${filename}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d', // Keep logs for 14 days
    level,
    format: logFormat,
  });
};

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'job-application-tracker' },
  transports: [
    // Error logs
    createDailyRotateTransport('error', 'error'),
    
    // Combined logs (all levels)
    createDailyRotateTransport('info', 'combined'),
    
    // Application specific logs
    createDailyRotateTransport('info', 'application'),
    
    // Database logs
    createDailyRotateTransport('info', 'database'),
    
    // API logs
    createDailyRotateTransport('info', 'api'),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, stack, error, ...meta }) => {
          // Sanitize metadata for console output too
          const sanitizedMeta = sanitizeData(meta);
          
          let log = `${timestamp} [${level}]: ${message}`;
          
          if (stack) {
            log += `\n${stack}`;
          }
          
          if (error) {
            const serializedError = serializeError(error);
            if (serializedError) {
              log += `\nError: ${JSON.stringify(serializedError, null, 2)}`;
            }
          }
          
          if (Object.keys(sanitizedMeta).length > 0) {
            log += `\n${JSON.stringify(sanitizedMeta, null, 2)}`;
          }
          
          return log;
        })
      ),
    })
  );
}

// Create specialized loggers
const applicationLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'application' },
  transports: [createDailyRotateTransport('info', 'application')],
});

const databaseLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'database' },
  transports: [createDailyRotateTransport('info', 'database')],
});

const apiLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'api' },
  transports: [createDailyRotateTransport('info', 'api')],
});

// Enhanced logging functions with better error handling
const createLoggerFunctions = (loggerInstance) => ({
  info: (message, meta = {}) => {
    const sanitizedMeta = sanitizeData(meta);
    loggerInstance.info(message, sanitizedMeta);
  },
  error: (message, meta = {}) => {
    const sanitizedMeta = sanitizeData(meta);
    // Ensure error objects are properly serialized
    if (meta.error && meta.error instanceof Error) {
      sanitizedMeta.error = serializeError(meta.error);
    }
    loggerInstance.error(message, sanitizedMeta);
  },
  warn: (message, meta = {}) => {
    const sanitizedMeta = sanitizeData(meta);
    loggerInstance.warn(message, sanitizedMeta);
  },
  debug: (message, meta = {}) => {
    const sanitizedMeta = sanitizeData(meta);
    loggerInstance.debug(message, sanitizedMeta);
  },
});

// Helper functions for different log contexts
const loggers = {
  // Main logger
  logger,
  
  // Application specific logger
  application: createLoggerFunctions(applicationLogger),
  
  // Database specific logger
  database: createLoggerFunctions(databaseLogger),
  
  // API specific logger
  api: createLoggerFunctions(apiLogger),
  
  // Request logger middleware with enhanced security
  requestLogger: (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // Sanitize request data
      const sanitizedHeaders = sanitizeData(req.headers);
      const sanitizedBody = req.body ? sanitizeData(req.body) : undefined;
      const sanitizedQuery = req.query ? sanitizeData(req.query) : undefined;
      
      const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        headers: sanitizedHeaders,
        body: sanitizedBody,
        query: sanitizedQuery,
      };
      
      if (res.statusCode >= 400) {
        apiLogger.error('API Request Error', logData);
      } else {
        apiLogger.info('API Request', logData);
      }
    });
    
    next();
  },
  
  // Utility function to log unhandled errors
  logUnhandledError: (error, context = {}) => {
    const errorData = {
      error: serializeError(error),
      context: sanitizeData(context),
      timestamp: new Date().toISOString(),
    };
    
    logger.error('Unhandled Error', errorData);
  },
  
  // Utility function to log security events
  logSecurityEvent: (event, details = {}) => {
    const securityData = {
      event,
      details: sanitizeData(details),
      timestamp: new Date().toISOString(),
      ip: details.ip || 'unknown',
    };
    
    logger.warn('Security Event', securityData);
  },
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  loggers.logUnhandledError(reason, { 
    type: 'unhandledRejection',
    promise: promise.toString()
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  loggers.logUnhandledError(error, { type: 'uncaughtException' });
  // Exit process after logging
  process.exit(1);
});

module.exports = loggers;
