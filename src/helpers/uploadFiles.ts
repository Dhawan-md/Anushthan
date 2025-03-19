import { FileUpload } from "graphql-upload-minimal";
import { Upload } from "@aws-sdk/lib-storage";
import { ObjectCannedACL } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

import { CustomError } from "../utils/custumError";
import { FILENAME_MISSING, S3_INITIALIZATION_FAILED } from "../utils/messages";
import { s3 } from "../config/aws";
import { getBucketName } from "./getBucketName";
import { s3BucketType } from "../utils/enums";

export const uploadFiles = async (
  documents: FileUpload | FileUpload[],
  type: s3BucketType
): Promise<
  | { filePath: string; fileName: string }
  | { filePath: string; fileName: string }[]
> => {
  const files = Array.isArray(documents) ? documents : [documents];

  const uploadedFiles = await Promise.all(
    files.map(async (document) => {
      if (!document.filename) throw new CustomError(FILENAME_MISSING);

      const fileName = `${uuidv4()}-${document.filename}`;
      const filePath = `document/${fileName}`;

      if (!s3) {
        throw new CustomError(S3_INITIALIZATION_FAILED);
      }

      const bucketName = getBucketName(type);

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

      return { filePath, fileName: document.filename };
    })
  );
  return uploadFiles.length === 1 ? uploadFiles[0] : uploadedFiles;
};
