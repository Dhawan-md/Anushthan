import speakeasy from "speakeasy";

export const generateOtp = (userSecret: string) => {
  const otpCode = speakeasy.totp({
    secret: userSecret,
    encoding: "base32",
    step: 30,
  });

  const createdAt = new Date();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  return {
    otpCode,
    createdAt,
    expiresAt,
  };
};
