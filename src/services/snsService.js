const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const logger = require("../config/logger");

// Initialize SNS client
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
});

/**
 * Publish user verification message to SNS topic
 * @param {string} email - User's email address
 * @param {string} token - Verification token
 * @param {string} firstName - User's first name
 * @returns {Promise<boolean>} - True if published successfully
 */
async function publishUserVerification(email, token, firstName) {
  const topicArn = process.env.SNS_TOPIC_ARN;

  if (!topicArn) {
    logger.error("SNS_TOPIC_ARN environment variable is not set");
    throw new Error("SNS topic ARN not configured");
  }

  const message = {
    email: email,
    token: token,
    firstName: firstName,
  };

  const params = {
    TopicArn: topicArn,
    Message: JSON.stringify(message),
    Subject: "User Email Verification",
    MessageAttributes: {
      email: {
        DataType: "String",
        StringValue: email,
      },
      type: {
        DataType: "String",
        StringValue: "email_verification",
      },
    },
  };

  try {
    const command = new PublishCommand(params);
    const response = await snsClient.send(command);

    logger.info("SNS message published successfully", {
      messageId: response.MessageId,
      email: email,
    });

    return true;
  } catch (error) {
    logger.error("Error publishing to SNS", {
      error: error.message,
      email: email,
    });
    throw error;
  }
}

module.exports = {
  publishUserVerification,
};
