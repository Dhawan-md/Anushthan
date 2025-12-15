import { FileUpload } from "graphql-upload-minimal";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";

import { CustomError } from "../utils/customError";
import { FILENAME_MISSING, S3_INITIALIZATION_FAILED } from "../utils/messages";
import { getInitializedS3Client } from "../config/aws";
import { getBucketName } from "../utils/getBucketName";
import { S3BucketType } from "../utils/enums";

export const uploadFiles = async (
  documents: FileUpload | FileUpload[]
): Promise<{ cleanName: string }[]> => {
  const files = Array.isArray(documents) ? documents : [documents];

  return Promise.all(
    files.map(async (filePromise) => {
      const file = await filePromise;

      if (!file.filename) throw new CustomError(FILENAME_MISSING);

      const cleanName = `${uuidv4()}-${file.filename.replace(/\s+/g, "")}`;
      return { cleanName };
    })
  );
};

export const uploadBufferToS3 = async (
  buffer: Buffer,
  key: string,
  mimetype: string,
  type: S3BucketType
): Promise<string> => {
  const s3 = await getInitializedS3Client();
  if (!s3) throw new CustomError(S3_INITIALIZATION_FAILED);

  const bucketName = getBucketName(type);

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    },
  });

  try {
    await upload.done();
    console.log("UPLOAD SUCCESS:", key);
  } catch (err) {
    throw new CustomError(`S3 Upload Failed: ${(err as Error).message}`);
  }

  return key; // we will generate CloudFront URL later
};
