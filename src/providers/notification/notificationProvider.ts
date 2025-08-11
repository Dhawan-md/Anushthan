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

  async publish(
    channel: string,
    eventType: string,
    payload: {
      senderUserId: string;
      message: string;
      receiverFcmTokens: any;
    }
  ) {
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

    await this.redisSubscriber.on("message", async (receivedChannel, msg) => {
      try {
        const { eventType, payload } = JSON.parse(msg);

        if (!payload?.senderUserId || !payload?.message) {
          logger.warn(
            `[NotificationProvider.ts] Invalid payload on "${receivedChannel}"`
          );
          return;
        }

        const { senderUserId, message, receiverFcmTokens } = payload;

        const io = getSocketServerInstance();

        io.to(`user_${senderUserId}`).emit(eventType, {
          type: eventType,
          message,
        });

        if (Array.isArray(receiverFcmTokens) && receiverFcmTokens.length > 0) {
          await this.sendFCMToUser(receiverFcmTokens, eventType, message);
        }

        logger.info(
          `[NotificationProvider.ts] Sent "${eventType}" notification to user_${senderUserId}`
        );
      } catch (error) {
        logger.error(
          `[NotificationProvider.ts] Failed to process message on "${receivedChannel}": ${error}`
        );
      }
    });
  }

  async sendFCMToUser(fcmTokens: string[], title: string, body: string) {
    if (!fcmTokens || fcmTokens.length === 0) {
      logger.warn("[NotificationProvider.ts] No FCM tokens provided");
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK", // for flutter apps
        customData: "value",
      },
      tokens: fcmTokens,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      logger.info(
        `[NotificationProvider.ts] Successfully sent FCM to ${response.successCount} devices, failed for ${response.failureCount}`
      );

      if (response.failureCount > 0) {
        response.responses.forEach((res, idx) => {
          if (!res.success) {
            logger.error(
              `[NotificationProvider.ts] Token: ${fcmTokens[idx]} | Error: ${res.error}`
            );
          }
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
}
