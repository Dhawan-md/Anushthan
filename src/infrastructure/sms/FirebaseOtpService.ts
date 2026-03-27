import { Service } from "typedi";
import https from "https";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";

@Service()
export class FirebaseOtpService {
    private apiKey: string;

    constructor() {
        this.apiKey = env.GOOGLE_API_CREDENTIALS || "";
        if (this.apiKey) {
            logger.info("[FirebaseOtpService] 🔥 Firebase OTP Service initialized with API Key.");
        } else {
            logger.warn("[FirebaseOtpService] ⚠️ GOOGLE_API_CREDENTIALS missing. Firebase SMS disabled.");
        }
    }

    async sendOtp(phoneNumber: string): Promise<string> {
        if (!this.apiKey) {
            throw new CustomError("Google API Key is not configured.");
        }

        const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${this.apiKey}`;
        
        const data = JSON.stringify({
            phoneNumber: phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`,
        });

        return new Promise((resolve, reject) => {
            const req = https.request(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": data.length,
                },
            }, (res) => {
                let responseBody = "";
                res.on("data", (chunk) => responseBody += chunk);
                res.on("end", () => {
                    try {
                        const parsed = JSON.parse(responseBody);
                        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                            logger.info(`✅ Firebase OTP request successful for ${phoneNumber}. SessionInfo: ${parsed.sessionInfo}`);
                            resolve(parsed.sessionInfo);
                        } else {
                            const errMsg = parsed.error?.message || "Unknown error";
                            logger.error(`❌ Firebase OTP Error [${res.statusCode}]: ${errMsg}`);
                            reject(new Error(errMsg));
                        }
                    } catch (e) {
                        reject(new Error("Failed to parse Firebase response"));
                    }
                });
            });

            req.on("error", (e) => {
                logger.error(`❌ Network error calling Firebase: ${e.message}`);
                reject(e);
            });

            req.write(data);
            req.end();
        });
    }

    async verifyOtp(sessionInfo: string, otpCode: string): Promise<any> {
        if (!this.apiKey) {
            throw new CustomError("Google API Key is not configured.");
        }

        const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${this.apiKey}`;
        
        const data = JSON.stringify({
            sessionInfo,
            code: otpCode
        });

        return new Promise((resolve, reject) => {
            const req = https.request(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": data.length,
                },
            }, (res) => {
                let responseBody = "";
                res.on("data", (chunk) => responseBody += chunk);
                res.on("end", () => {
                    try {
                        const parsed = JSON.parse(responseBody);
                        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                            logger.info(`✅ Firebase OTP verification successful.`);
                            resolve(parsed); 
                        } else {
                            const errMsg = parsed.error?.message || "Unknown error";
                            logger.error(`❌ Firebase Verification Error [${res.statusCode}]: ${errMsg}`);
                            reject(new Error(errMsg));
                        }
                    } catch (e) {
                        reject(new Error("Failed to parse Firebase response"));
                    }
                });
            });

            req.on("error", (e) => {
                logger.error(`❌ Network error calling Firebase: ${e.message}`);
                reject(e);
            });

            req.write(data);
            req.end();
        });
    }
}
