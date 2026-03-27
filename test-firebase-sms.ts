import "reflect-metadata";
import { FirebaseOtpService } from "./src/infrastructure/sms/FirebaseOtpService";
import dotenv from "dotenv";

dotenv.config();

async function testFirebaseSms() {
    console.log("Starting Firebase SMS test to +918699771329...");
    
    const firebaseOtpService = new FirebaseOtpService();
    try {
        const sessionInfo = await firebaseOtpService.sendOtp("+918699771329");
        console.log("✅ Firebase SMS Request Successful! SessionInfo:", sessionInfo);
    } catch (e) {
        console.error("❌ Firebase SMS Failed!", e.message);
        console.log("Tip: If the error is 'PERMISSION_DENIED', ensure the API key has 'Identity Toolkit API' enabled.");
    }
}

testFirebaseSms();
