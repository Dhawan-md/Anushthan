import { Queue, Worker } from "bullmq";

import redis from "./redis";

import { logger } from "../utils/logger";

// Factory to create BullMQ Queue
export const createBullQueue = (name: string) => {
  logger.info(`[BullMQ] Initializing queue "${name}"`);
  const queue = new Queue(name, { connection: redis });

  queue.on("error", (err) => {
    logger.error(`[BullMQ] Error in queue "${name}"`, { error: err });
  });

  return queue;
};

// Factory to create BullMQ Worker
export const createBullWorker = (name: string, processor: any) => {
  logger.info(`[BullMQ] Creating worker for queue "${name}"`);
  const worker = new Worker(name, processor, { connection: redis });

  worker.on("ready", () => {
    logger.info(`[BullMQ] Worker for queue "${name}" is ready.`);
  });

  worker.on("completed", (job) => {
    logger.info(`[BullMQ] Job ${job.id} in queue "${name}" completed.`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`[BullMQ] Job ${job?.id} in queue "${name}" failed`, {
      error: err,
      stack: err.stack,
      jobData: job?.data,
      attemptsMade: job?.attemptsMade,
      maxAttempts: job?.opts.attempts,
    });
  });

  worker.on("error", (err) => {
    logger.error(`[BullMQ] Worker error in "${name}"`, { error: err });
  });

  return worker;
};
