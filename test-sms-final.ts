import "reflect-metadata";
import { TwilioService } from "./src/infrastructure/sms/TwilioService";
import { env } from "./src/config/env";
import dotenv from "dotenv";

dotenv.config();

async function testSms() {
    console.log("Starting SMS test to +918699771329...");
    console.log("Using Twilio SID:", process.env.TWILIO_ACCOUNT_SID ? "Found" : "Missing");
    
    const twilioService = new TwilioService();
    try {
        const sid = await twilioService.sendOtp("+918699771329", "5432");
        console.log("✅ SMS Sent Successfully! SID:", sid);
    } catch (e) {
        console.error("❌ SMS Failed to send!", e.message);
    }
}

testSms();
