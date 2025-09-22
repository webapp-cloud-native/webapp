// src/middleware/jsonErrorHandler.js

/**
 * JSON parsing error handler middleware
 * Catches JSON syntax errors and returns 400 Bad Request
 */
function jsonErrorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON parsing error:', {
      message: err.message,
      url: req.url,
      method: req.method,
      body: err.body
    });

    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid JSON format in request body'
    });
  }

  // If it's not a JSON parsing error, pass to next error handler
  next(err);
}

module.exports = { jsonErrorHandler };