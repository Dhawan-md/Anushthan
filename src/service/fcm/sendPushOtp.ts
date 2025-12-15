import admin from "../../config/firebase";
import { CustomError } from "../../utils/customError";

export async function sendOtpPush(deviceToken: string, otp: string) {
  try {
    await admin.messaging().send({
      token: deviceToken,
      data: {
        type: "OTP",
        otp,
      },
    });

    console.log("OTP push sent");
  } catch (error) {
    console.log("Error sending push", error);
    throw new CustomError("Push otp sending failed");
  }
}
