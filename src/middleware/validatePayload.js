function validatePayload(req, res, next) {
  const contentLength = req.get("Content-Length");
  if (contentLength && parseInt(contentLength) > 0) {
    return res
      .set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
      })
      .status(400)
      .send();
  }

  // Check for query parameters
  if (Object.keys(req.query).length > 0) {
    return res
      .set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
      })
      .status(400)
      .send();
  }
  next();
}

module.exports = { validatePayload };
