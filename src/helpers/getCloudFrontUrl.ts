// src/helpers/getCloudFrontUrl.ts

export const getCloudfrontUrl = (key: string): string => {
  return `https://${process.env["AWS_CF_DOMAIN"]}/${key}`;
};
