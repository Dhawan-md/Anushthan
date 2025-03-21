import speakeasy from "speakeasy";

export const generateOtp = (userSecret: string) => {
  const createdAt = new Date();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const otpCode = speakeasy.totp({
    secret: userSecret + createdAt.toString(),
    encoding: "base32",
    step: 300,
  });

  console.log(userSecret + createdAt.toString(), 1);

  return {
    otpCode,
    createdAt,
    expiresAt,
  };
};
