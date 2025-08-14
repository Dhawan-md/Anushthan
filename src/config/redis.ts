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

const redisPublisher = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});
const redisSubscriber = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

redisPublisher.on("connect", () => {
  logger.info("[Redis] Publisher connected.");
});
redisSubscriber.on("connect", () => {
  logger.info("[Redis] Subscriber connected.");
});

redisPublisher.on("error", (err) => {
  logger.error("[Redis] Publisher error", { error: err });
});
redisSubscriber.on("error", (err) => {
  logger.error("[Redis] Subscriber error", { error: err });
});

export default redis;
export { redisPublisher, redisSubscriber };
