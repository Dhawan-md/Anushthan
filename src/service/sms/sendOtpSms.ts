import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendOtpSMS(to: string, otp: string) {
  try {
    const message = await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: process.env.TWILIO_MESSAGING_SERVICE_SID, // your Twilio trial number
      to, // recipient number e.g. +91XXXXXXXXXX
    });

    console.log("OTP sent successfully:", message.sid);
    return message.sid;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
}
