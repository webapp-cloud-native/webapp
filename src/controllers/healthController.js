const { HealthCheck } = require("../models/HealthCheck");
const { trackQuery } = require("../utils/dbMetrics");
const logger = require("../config/logger");

async function healthCheck(req, res) {
  res.set({
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
  });

  try {
    const healthCheck = await trackQuery(
      () =>
        HealthCheck.create({
          check_datetime: new Date(),
        }),
      "insert",
      "health_checks"
    );

    logger.info("Assignment 9 Health check successful", {
      checkId: healthCheck.check_id,
    });

    return res.status(200).send();
  } catch (error) {
    logger.error("Health check failed - database insert error", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(503).send();
  }
}

function methodNotAllowed(req, res) {
  res
    .set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
      Allow: "GET",
    })
    .status(405)
    .send();
}

module.exports = {
  healthCheck,
  methodNotAllowed,
};
