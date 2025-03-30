import speakeasy from "speakeasy";

export const generateUserSecret = () => {
  const userSecret = speakeasy.generateSecret({ length: 20 });

  return userSecret;
};
