const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../config/swagger");

const router = express.Router();

// Swagger UI options
const options = {
  explorer: true,
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Cloud Assignment 2 API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "none",
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true,
  },
};

// Serve swagger docs at /api-docs
router.use("/api-docs", swaggerUi.serve);
router.get("/api-docs", swaggerUi.setup(swaggerSpec, options));

// Serve raw swagger spec as JSON
router.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Redirect root docs to swagger
router.get("/docs", (req, res) => {
  res.redirect("/api-docs");
});

module.exports = router;
