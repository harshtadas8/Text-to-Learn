import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom format for local development
const consoleFormat = printf(({ level, message, timestamp, requestId, userId, ...meta }) => {
  let log = `[${timestamp}] ${level}: `;
  if (requestId) log += `[req:${requestId}] `;
  if (userId) log += `[user:${userId}] `;
  log += message;
  
  // Format additional meta data nicely
  if (Object.keys(meta).length > 0) {
    log += `\n${JSON.stringify(meta, null, 2)}`;
  }
  return log;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), consoleFormat)
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Middleware to inject logger into request object
export const requestLogger = (req, res, next) => {
  req.id = Math.random().toString(36).substring(7); // simple random id
  const userId = req.auth?.sub || 'unauthenticated';
  
  req.logger = logger.child({ requestId: req.id, userId });
  
  const start = Date.now();
  req.logger.info(`${req.method} ${req.originalUrl} - STARTED`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    req.logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};
