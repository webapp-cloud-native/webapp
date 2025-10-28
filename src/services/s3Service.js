const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const metricsService = require("./metrics.service");
const logger = require("../config/logger");

// Initialize S3 Client (uses IAM role from EC2 instance)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * Generate unique S3 key for file storage
 * Pattern: userId/productId/uuid-filename
 */
function generateS3Key(userId, productId, originalFilename) {
  const fileExtension = path.extname(originalFilename);
  const uuid = uuidv4();
  const sanitizedFilename = path.basename(originalFilename, fileExtension);
  const uniqueFilename = `${uuid}-${sanitizedFilename}${fileExtension}`;

  return `user-${userId}/product-${productId}/${uniqueFilename}`;
}

/**
 * Upload file to S3 bucket
 */
async function uploadToS3(file, userId, productId) {
  const startTime = Date.now();

  try {
    const s3Key = generateS3Key(userId, productId, file.originalname);

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Record successful S3 upload metrics
    const duration = Date.now() - startTime;
    metricsService.recordS3Operation("upload", duration, true);

    logger.info("S3 upload successful", {
      s3Key: s3Key,
      fileName: file.originalname,
      fileSize: file.size,
      userId: userId,
      productId: productId,
      duration: duration,
    });

    return {
      s3_bucket_path: s3Key,
      file_name: file.originalname,
    };
  } catch (error) {
    // Record failed S3 upload metrics
    const duration = Date.now() - startTime;
    metricsService.recordS3Operation("upload", duration, false);

    logger.error("S3 upload error", {
      error: error.message,
      stack: error.stack,
      fileName: file.originalname,
      userId: userId,
      productId: productId,
    });
    throw new Error("Failed to upload file to S3");
  }
}

/**
 * Delete file from S3 bucket
 */
async function deleteFromS3(s3Key) {
  const startTime = Date.now();

  try {
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    // Record successful S3 delete metrics
    const duration = Date.now() - startTime;
    metricsService.recordS3Operation("delete", duration, true);

    logger.info("S3 delete successful", {
      s3Key: s3Key,
      duration: duration,
    });

    return true;
  } catch (error) {
    // Record failed S3 delete metrics
    const duration = Date.now() - startTime;
    metricsService.recordS3Operation("delete", duration, false);

    logger.error("S3 delete error", {
      error: error.message,
      stack: error.stack,
      s3Key: s3Key,
    });
    throw new Error("Failed to delete file from S3");
  }
}

/**
 * Get full S3 path (for response)
 */
function getS3Path(s3Key) {
  if (!BUCKET_NAME) {
    return s3Key;
  }
  return `s3://${BUCKET_NAME}/${s3Key}`;
}

module.exports = {
  uploadToS3,
  deleteFromS3,
  getS3Path,
  generateS3Key,
};
