const { Image } = require("../models/Image");
const { Product } = require("../models/Product");
const {
  uploadToS3,
  deleteFromS3,
  getS3Path,
} = require("../services/s3Service");

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
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    // Verify user owns the product
    if (product.owner_user_id !== userId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only upload images to products that you own",
      });
    }

    // Upload to S3
    const s3Result = await uploadToS3(file, userId, productId);

    // Save metadata to database
    const image = await Image.create({
      product_id: productId,
      user_id: userId,
      file_name: file.originalname,
      s3_bucket_path: s3Result.s3Key,
      content_type: s3Result.contentType,
      file_size: s3Result.size,
      date_created: new Date(),
    });

    // Return response
    return res.status(201).json({
      image_id: image.image_id,
      product_id: image.product_id,
      file_name: image.file_name,
      date_created: image.date_created,
      s3_bucket_path: image.s3_bucket_path,
    });
  } catch (error) {
    console.error("Upload image error:", error);
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
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    // Get all images for this product
    const images = await Image.findAll({
      where: { product_id: productId },
      order: [["date_created", "DESC"]],
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
    console.error("Get all images error:", error);
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
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    // Find image
    const image = await Image.findOne({
      where: {
        image_id: imageId,
        product_id: productId,
      },
    });

    if (!image) {
      return res.status(404).json({
        error: "Not Found",
        message: "Image not found",
      });
    }

    // Return image details
    return res.status(200).json({
      image_id: image.image_id,
      product_id: image.product_id,
      file_name: image.file_name,
      date_created: image.date_created,
      s3_bucket_path: getS3Path(image.s3_bucket_path),
    });
  } catch (error) {
    console.error("Get image by ID error:", error);
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
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    // Verify user owns the product
    if (product.owner_user_id !== userId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only delete images from products that you own",
      });
    }

    // Find image
    const image = await Image.findOne({
      where: {
        image_id: imageId,
        product_id: productId,
      },
    });

    if (!image) {
      return res.status(404).json({
        error: "Not Found",
        message: "Image not found",
      });
    }

    // Verify user owns the image
    if (image.user_id !== userId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only delete images that you uploaded",
      });
    }

    // Delete from S3
    await deleteFromS3(image.s3_bucket_path);

    // Delete from database (hard delete)
    await image.destroy();

    // Return 204 No Content
    return res.status(204).send();
  } catch (error) {
    console.error("Delete image error:", error);
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
