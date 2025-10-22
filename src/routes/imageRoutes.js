const express = require("express");
const {
  uploadImage,
  getAllImages,
  getImageById,
  deleteImage,
} = require("../controllers/imageController");
const { authenticate } = require("../middleware/auth");
const {
  uploadSingleImage,
  handleMulterError,
  validateFilePresence,
} = require("../middleware/fileUpload");
const {
  validateProductId,
  validateImageId,
} = require("../middleware/productValidation");

const router = express.Router();

// POST /v1/product/{productId}/image - Upload image to product
router.post(
  "/v1/product/:productId/image",
  authenticate,
  validateProductId,
  uploadSingleImage,
  handleMulterError,
  validateFilePresence,
  uploadImage
);

// GET /v1/product/{productId}/image - Get all images for a product
router.get("/v1/product/:productId/image", validateProductId, getAllImages);

// GET /v1/product/{productId}/image/{imageId} - Get specific image details
router.get(
  "/v1/product/:productId/image/:imageId",
  validateProductId,
  getImageById
);

// DELETE /v1/product/{productId}/image/{imageId} - Delete an image
router.delete(
  "/v1/product/:productId/image/:imageId",
  authenticate,
  validateProductId,
  deleteImage
);

// Handle method not allowed for image endpoints
router.all("/v1/product/:productId/image", (req, res) => {
  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(req.method)) {
    res.set("Allow", allowedMethods.join(", "));
    return res.status(405).json({
      error: "Method Not Allowed",
      message: `Only ${allowedMethods.join(", ")} methods are allowed`,
    });
  }
});

router.all("/v1/product/:productId/image/:imageId", (req, res) => {
  const allowedMethods = ["GET", "DELETE"];
  if (!allowedMethods.includes(req.method)) {
    res.set("Allow", allowedMethods.join(", "));
    return res.status(405).json({
      error: "Method Not Allowed",
      message: `Only ${allowedMethods.join(", ")} methods are allowed`,
    });
  }
});

module.exports = router;
