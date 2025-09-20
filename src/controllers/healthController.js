const { HealthCheck } = require("../models/HealthCheck");

async function healthCheck(req, res) {
  res.set({
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
  });

  try {
    const healthCheck = await HealthCheck.create({
      check_datetime: new Date(),
    });

    console.log(`Health check record created with ID: ${healthCheck.check_id}`);
    return res.status(200).send();
  } catch (error) {
    console.error(
      "Health check failed - database insert error:",
      error.message
    );
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
