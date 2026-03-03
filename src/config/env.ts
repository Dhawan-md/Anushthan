import dotenv from "dotenv";
import { logger } from "../utils/logger";

// Load environment variables from .env file
dotenv.config();

const requiredEnvVars = [
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "NODE_ENV",
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
] as const;

const optionalEnvVars = [
    "PORT",
    "DB_PORT",
    "REDIS_URL",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "AWS_ACCESS_KEY",
    "AWS_SECRET_KEY",
    "AWS_REGION",
    "S3_BUCKET_NAME",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER",
    "TWILIO_MESSAGING_SERVICE_SID",
    "SENDGRID_API_KEY",
    "FROM_EMAIL",
    "GOOGLE_API_CREDENTIALS",
] as const;

export type Env = {
    [K in (typeof requiredEnvVars)[number]]: string;
} & {
    [K in (typeof optionalEnvVars)[number]]?: string;
};

/**
 * Validates that all required environment variables are present.
 * Logs warnings for missing optional variables.
 * @throws {Error} If any required environment variable is missing.
 */
export function validateEnv() {
    const missingRequired = requiredEnvVars.filter((v) => !process.env[v]);
    if (missingRequired.length > 0) {
        const errorMsg = `❌ Missing critical environment variables: ${missingRequired.join(
            ", "
        )}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
    }

    const missingOptional = optionalEnvVars.filter((v) => !process.env[v]);
    if (missingOptional.length > 0) {
        logger.warn(
            `⚠️ Missing optional environment variables: ${missingOptional.join(
                ", "
            )}. Some features may be disabled.`
        );
    }
}

/**
 * Centralized environment configuration object.
 * Use this instead of direct process.env access for better type safety and consistency.
 */
export const env = {
    DB_HOST: process.env.DB_HOST!,
    DB_USER: process.env.DB_USER!,
    DB_PASSWORD: process.env.DB_PASSWORD!,
    DB_NAME: process.env.DB_NAME!,
    NODE_ENV: process.env.NODE_ENV!,
    PORT: process.env.PORT || "5000",
    DB_PORT: process.env.DB_PORT || "5432",
    REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
    AWS_SECRET_KEY: process.env.AWS_SECRET_KEY,
    AWS_REGION: process.env.AWS_REGION || "us-east-1",
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    TWILIO_MESSAGING_SERVICE_SID: process.env.TWILIO_MESSAGING_SERVICE_SID,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL,
    GOOGLE_API_CREDENTIALS: process.env.GOOGLE_API_CREDENTIALS,
} as Env;
