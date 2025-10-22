const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

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
  try {
    if (!BUCKET_NAME) {
      throw new Error("S3_BUCKET_NAME environment variable is not set");
    }

    const s3Key = generateS3Key(userId, productId, file.originalname);

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ServerSideEncryption: "AES256",
      Metadata: {
        originalName: file.originalname,
        userId: userId.toString(),
        productId: productId.toString(),
        uploadDate: new Date().toISOString(),
      },
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    return {
      s3Key: s3Key,
      bucket: BUCKET_NAME,
      size: file.size,
      contentType: file.mimetype,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
}

/**
 * Delete file from S3 bucket
 */
async function deleteFromS3(s3Key) {
  try {
    if (!BUCKET_NAME) {
      throw new Error("S3_BUCKET_NAME environment variable is not set");
    }

    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    console.log(`Successfully deleted file from S3: ${s3Key}`);
    return true;
  } catch (error) {
    console.error("S3 delete error:", error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
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
