function errorHandler(err, req, res, next) {
  console.error('Application error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  }).status(500).send();
}

module.exports = errorHandler;