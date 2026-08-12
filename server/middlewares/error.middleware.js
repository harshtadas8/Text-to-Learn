export function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Internal Server Error";

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    message = `Invalid input data: ${errors.join('. ')}`;
    statusCode = 400;
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : 'Duplicate field value';
    message = `Duplicate field value entered: ${value}. Please use another value.`;
    statusCode = 400;
  }

  // Mongoose CastError
  if (err.name === 'CastError') {
    message = `Invalid ${err.path}: ${err.value}.`;
    statusCode = 400;
  }

  // JWT Error
  if (err.name === 'UnauthorizedError') {
    message = "Invalid token. Please log in again.";
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
