import { FileUpload } from "graphql-upload-minimal";
import { Upload } from "@aws-sdk/lib-storage";
import { ObjectCannedACL } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

import { CustomError } from "../utils/customError";
import {
  FILENAME_MISSING,
  INTERNAL_ERROR_OCCURRED,
  S3_INITIALIZATION_FAILED,
} from "../utils/messages";
import { getInitializedS3Client } from "../config/aws";
import { getBucketName } from "../utils/getBucketName";
import { S3BucketType } from "../utils/enums";
import { logger } from "../utils/logger";
import { deleteS3File } from "./deleteS3file";

export const uploadFiles = async (
  documents: FileUpload | FileUpload[],
  type: S3BucketType
): Promise<{ filePath: string }[]> => {
  const files = Array.isArray(documents) ? documents : [documents];
  const uploadedFiles: { filePath: string }[] = [];
  const s3 = await getInitializedS3Client();

  if (!s3) {
    throw new CustomError(S3_INITIALIZATION_FAILED);
  }

  const bucketName = getBucketName(type);

  try {
    await Promise.all(
      files.map(async (document) => {
        if (!document.filename) throw new CustomError(FILENAME_MISSING);

        const fileName = `${uuidv4()}-${document.filename}`;
        const filePath = `document/${fileName}`;

        const upload = new Upload({
          client: s3,
          params: {
            Bucket: bucketName,
            Key: filePath,
            Body: document.createReadStream(),
            ContentType: document.mimetype,
            ACL: ObjectCannedACL.private,
          },
        });
        await upload.done();

        logger.info(`✅ File uploaded successfully: ${filePath}`);
        uploadedFiles.push({ filePath });
      })
    );

    return uploadedFiles;
  } catch (error) {
    // ❌ Rollback: Delete successfully uploaded files
    logger.error(`🔥 File upload failed `, error);

    await Promise.all(
      uploadedFiles.map(async ({ filePath }) => {
        await deleteS3File(bucketName, filePath);
      })
    );

    throw new CustomError(INTERNAL_ERROR_OCCURRED);
  }
};
