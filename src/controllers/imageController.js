const { Image } = require("../models/Image");
const { Product } = require("../models/Product");
const {
  uploadToS3,
  deleteFromS3,
  getS3Path,
} = require("../services/s3Service");
const { trackQuery } = require("../utils/dbMetrics");
const logger = require("../config/logger");

/**
 * POST /v1/product/{productId}/image
 * Upload an image to a product
 */
async function uploadImage(req, res) {
  try {
    const productId = parseInt(req.params.productId);
    const userId = req.user.id; // From auth middleware
    const file = req.file; // From multer middleware

    // Verify product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      logger.warn("Image upload failed - Product not found", {
        productId: productId,
        userId: userId,
      });
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    // Verify user owns the product
    if (product.owner_user_id !== userId) {
      logger.warn("Image upload forbidden - User does not own product", {
        productId: productId,
        userId: userId,
        ownerId: product.owner_user_id,
      });
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only upload images to products that you own",
      });
    }

    // Upload to S3 (metrics tracked in s3Service)
    const s3Result = await uploadToS3(file, userId, productId);

    // Save metadata to database with metrics tracking
    const image = await trackQuery(
      () =>
        Image.create({
          product_id: productId,
          user_id: userId,
          file_name: file.originalname,
          s3_bucket_path: s3Result.s3_bucket_path,
          content_type: file.mimetype,
          file_size: file.size,
          date_created: new Date(),
        }),
      "insert",
      "images"
    );

    logger.info("Image uploaded successfully", {
      imageId: image.image_id,
      productId: productId,
      userId: userId,
      fileName: file.originalname,
      fileSize: file.size,
    });

    // Return response
    return res.status(201).json({
      image_id: image.image_id,
      product_id: image.product_id,
      file_name: image.file_name,
      date_created: image.date_created,
      s3_bucket_path: getS3Path(image.s3_bucket_path),
    });
  } catch (error) {
    logger.error("Upload image error", {
      error: error.message,
      stack: error.stack,
      productId: req.params.productId,
      userId: req.user ? req.user.id : null,
    });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to upload image",
    });
  }
}

/**
 * GET /v1/product/{productId}/image
 * Get all images for a product
 */
async function getAllImages(req, res) {
  try {
    const productId = parseInt(req.params.productId);

    // Verify product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      logger.warn("Get all images failed - Product not found", {
        productId: productId,
      });
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    // Get all images for this product with metrics tracking
    const images = await trackQuery(
      () =>
        Image.findAll({
          where: { product_id: productId },
          order: [["date_created", "DESC"]],
        }),
      "select",
      "images"
    );

    logger.info("Images retrieved successfully", {
      productId: productId,
      imageCount: images.length,
    });

    // Format response
    const formattedImages = images.map((image) => ({
      image_id: image.image_id,
      product_id: image.product_id,
      file_name: image.file_name,
      date_created: image.date_created,
      s3_bucket_path: getS3Path(image.s3_bucket_path),
    }));

    return res.status(200).json(formattedImages);
  } catch (error) {
    logger.error("Get all images error", {
      error: error.message,
      stack: error.stack,
      productId: req.params.productId,
    });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retrieve images",
    });
  }
}

/**
 * GET /v1/product/{productId}/image/{imageId}
 * Get specific image details
 */
async function getImageById(req, res) {
  try {
    const productId = parseInt(req.params.productId);
    const imageId = parseInt(req.params.imageId);

    // Verify product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      logger.warn("Get image by ID failed - Product not found", {
        productId: productId,
        imageId: imageId,
      });
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    // Find image with metrics tracking
    const image = await trackQuery(
      () =>
        Image.findOne({
          where: {
            image_id: imageId,
            product_id: productId,
          },
        }),
      "select",
      "images"
    );

    if (!image) {
      logger.warn("Image not found", {
        productId: productId,
        imageId: imageId,
      });
      return res.status(404).json({
        error: "Not Found",
        message: "Image not found",
      });
    }

    logger.info("Image retrieved successfully", {
      imageId: image.image_id,
      productId: productId,
    });

    // Return image details
    return res.status(200).json({
      image_id: image.image_id,
      product_id: image.product_id,
      file_name: image.file_name,
      date_created: image.date_created,
      s3_bucket_path: getS3Path(image.s3_bucket_path),
    });
  } catch (error) {
    logger.error("Get image by ID error", {
      error: error.message,
      stack: error.stack,
      productId: req.params.productId,
      imageId: req.params.imageId,
    });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retrieve image",
    });
  }
}

/**
 * DELETE /v1/product/{productId}/image/{imageId}
 * Delete an image
 */
async function deleteImage(req, res) {
  try {
    const productId = parseInt(req.params.productId);
    const imageId = parseInt(req.params.imageId);
    const userId = req.user.id; // From auth middleware

    // Verify product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      logger.warn("Delete image failed - Product not found", {
        productId: productId,
        imageId: imageId,
        userId: userId,
      });
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    // Verify user owns the product
    if (product.owner_user_id !== userId) {
      logger.warn("Delete image forbidden - User does not own product", {
        productId: productId,
        userId: userId,
        ownerId: product.owner_user_id,
      });
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only delete images from products that you own",
      });
    }

    // Find image with metrics tracking
    const image = await trackQuery(
      () =>
        Image.findOne({
          where: {
            image_id: imageId,
            product_id: productId,
          },
        }),
      "select",
      "images"
    );

    if (!image) {
      logger.warn("Delete image failed - Image not found", {
        productId: productId,
        imageId: imageId,
      });
      return res.status(404).json({
        error: "Not Found",
        message: "Image not found",
      });
    }

    // Verify user owns the image
    if (image.user_id !== userId) {
      logger.warn("Delete image forbidden - User does not own image", {
        productId: productId,
        imageId: imageId,
        userId: userId,
        imageOwnerId: image.user_id,
      });
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only delete images that you uploaded",
      });
    }

    // Delete from S3 (metrics tracked in s3Service)
    await deleteFromS3(image.s3_bucket_path);

    // Delete from database (hard delete) with metrics tracking
    await trackQuery(() => image.destroy(), "delete", "images");

    logger.info("Image deleted successfully", {
      imageId: imageId,
      productId: productId,
      userId: userId,
    });

    // Return 204 No Content
    return res.status(204).send();
  } catch (error) {
    logger.error("Delete image error", {
      error: error.message,
      stack: error.stack,
      productId: req.params.productId,
      imageId: req.params.imageId,
      userId: req.user ? req.user.id : null,
    });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete image",
    });
  }
}

module.exports = {
  uploadImage,
  getAllImages,
  getImageById,
  deleteImage,
};
