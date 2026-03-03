import { Service } from "typedi";
import twilio from "twilio";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";

@Service()
export class TwilioService {
    private client: twilio.Twilio | null = null;

    constructor() {
        if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
            this.client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
            logger.info("[TwilioService] 📱 Twilio client initialized.");
        } else {
            logger.warn("[TwilioService] ⚠️ Twilio credentials missing. SMS features disabled.");
        }
    }

    async sendOtp(to: string, otp: string) {
        if (!this.client) {
            throw new CustomError("Twilio is not configured.");
        }

        try {
            const message = await this.client.messages.create({
                body: `Your OTP is ${otp}`,
                from: env.TWILIO_MESSAGING_SERVICE_SID || env.TWILIO_PHONE_NUMBER,
                to,
            });

            logger.info(`✅ OTP sent successfully to : ${to} | SID: ${message.sid}`);
            return message.sid;
        } catch (error: any) {
            logger.error(`❌ Error sending OTP to ${to}: ${error.message}`);
            throw new CustomError("Failed to send OTP via Twilio.");
        }
    }
}
