import { Inject, Service } from "typedi";
import Redis from "ioredis";

import { getSocketServerInstance } from "../../config/socket";

import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import admin from "../../config/firebase";

@Service()
export class NotificationProvider {
  constructor(
    @Inject("redisPublisher") private redisPublisher: Redis,
    @Inject("redisSubscriber") private redisSubscriber: Redis
  ) {}

  async publish(channel: string, eventType: string, payload: any) {
    const message = {
      eventType,
      payload,
      timestamp: Date.now(),
    };

    try {
      await this.redisPublisher.publish(channel, JSON.stringify(message));
      logger.info(
        `[NotificationProvider.ts] Published to "${channel}" | Event: "${eventType}"`
      );
    } catch (error) {
      logger.error(
        `[NotificationPublisher.ts] Failed to publish to "${channel}" | Event: "${eventType}" | Error: ${error}`
      );

      throw new CustomError(error);
    }
  }

  async subscribe(channel: string) {
    await this.redisSubscriber.subscribe(channel);
    logger.info(`[NotificationProvider.ts] Subscribed to "${channel}"`);

    await this.redisSubscriber.on(
      "message",
      async (receivedChannel, message) => {
        try {
          const { eventType, payload } = JSON.parse(message);

          if (!payload?.userId || !payload?.message) {
            logger.warn(
              `[NotificationProvider.ts] Invalid payload on "${receivedChannel}"`
            );
            return;
          }

          const { userId, message: msg, fcmToken } = payload;

          const io = getSocketServerInstance();

          io.to(`user_${userId}`).emit(eventType, {
            type: eventType,
            message: msg,
          });

          if (fcmToken) {
            await this.sendFCMToUser(eventType, msg);
          }

          logger.info(
            `[NotificationProvider.ts] Sent "${eventType}" notification to user_${userId}`
          );
        } catch (error) {
          logger.error(
            `[NotificationProvider.ts] Failed to process message on "${receivedChannel}": ${error}`
          );

          throw new CustomError(error);
        }
      }
    );
  }

  async sendFCMToUser(
    // deviceToken: string,
    title: string,
    // body: string,
    msg: string
  ) {
    const message = {
      token:
        "dFCdjog4QY-JyxZXr6YpAe:APA91bH8qcXjaouqPO5kzLfS47RyCiV-223jpQMG7QO714LZiZE1rK1c1uXMo9LZUxcAhlCW3Q0ba8JkKFnDj8K--ip3grO0enhduxT5F_xozQ2iVwmx63c",
      notification: {
        title,
        // body,
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK", // for flutter apps
        customData: "value",
      },
    };

    console.log(msg, "I got the message");

    try {
      const response = await admin.messaging().send(message);
      console.log("Successfully sent message:", response);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
}
