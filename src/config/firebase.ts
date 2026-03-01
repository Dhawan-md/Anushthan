import admin from "firebase-admin";
import path from "path";
import fs from "fs";
import { logger } from "../utils/logger";

const serviceAccountPath = path.join(__dirname, "../..", "anushthan-test-fcm.json");

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
  logger.info("🔥 Firebase Admin SDK initialized.");
} else {
  logger.warn("⚠️ Firebase credentials (anushthan-test-fcm.json) not found. Skip initialization.");
}

export default admin;
