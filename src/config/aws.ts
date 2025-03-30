import { S3Client } from "@aws-sdk/client-s3";

import { logger } from "../utils/logger";
import { S3_INITIALIZATION_FAILED } from "../utils/messages";

const AWS_REGION = process.env["AWS_REGION"] || "us-east-1";
const AWS_ACCESS_KEY = process.env["AWS_ACCESS_KEY"];
const AWS_SECRET_KEY = process.env["AWS_SECRET_KEY"];

let s3Client: S3Client | null = null;

const createS3Client = (): S3Client | null => {
  if (s3Client) return s3Client;

  try {
    if (!AWS_ACCESS_KEY || !AWS_SECRET_KEY) {
      logger.warn(S3_INITIALIZATION_FAILED);
      return null;
    }

    s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_KEY,
      },
    });

    logger.info("✅ S3 Client initialized successfully");
    return s3Client;
  } catch (error) {
    logger.error("🔥 S3 Initialization Error:", error);
    return null;
  }
};

const getS3Client = (): S3Client | null => createS3Client();

const retryGetS3Client = async (
  retries = 3,
  delay = 2000
): Promise<S3Client | null> => {
  for (let i = 0; i < retries; i++) {
    const s3 = getS3Client();
    if (s3) return s3;

    logger.warn(`Retrying S3 initialization... Attempt ${i + 1}/${retries}`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  logger.error("❌ S3 is unavailable after multiple retries.");
  return null;
};

export const getInitializedS3Client = async (): Promise<S3Client | null> => {
  return retryGetS3Client();
};
