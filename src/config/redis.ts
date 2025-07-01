import IORedis from "ioredis";

import { logger } from "../utils/logger";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

logger.info(`[Redis] Connecting to Redis at ${redisUrl}...`);

redis.on("connect", () => {
  logger.info("[Redis] Connected to Redis successfully.");
});

redis.on("error", (err) => {
  logger.error("[Redis] Redis connection error:", { error: err });
});

redis.on("ready", () => {
  logger.info("[Redis] Redis connection is ready.");
});

export default redis;
