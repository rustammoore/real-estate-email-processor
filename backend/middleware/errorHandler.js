const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.status = 400;
    error.message = 'Validation Error';
    error.details = err.details;
  } else if (err.name === 'CastError') {
    error.status = 400;
    error.message = 'Invalid ID format';
  } else if (err.code === 11000) {
    error.status = 409;
    error.message = 'Duplicate entry';
  } else if (err.name === 'JsonWebTokenError') {
    error.status = 401;
    error.message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    error.status = 401;
    error.message = 'Token expired';
  }

  // Send error response
  res.status(error.status).json({
    success: false,
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(error.details && { details: error.details })
  });
};

module.exports = errorHandler; 