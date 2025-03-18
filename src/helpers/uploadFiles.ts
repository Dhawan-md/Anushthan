import { FileUpload } from "graphql-upload-minimal";
import { Upload } from "@aws-sdk/lib-storage";
import { ObjectCannedACL } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

import { CustomError } from "../utils/custumError";
import { FILENAME_MISSING, S3_INITIALIZATION_FAILED } from "../utils/messages";
import { s3 } from "../config/aws";

export const uploadFiles = async (
  documents: FileUpload[]
): Promise<{ filePath: string; fileName: string }[]> => {
  return await Promise.all(
    documents.map(async (document) => {
      if (!document.filename) throw new CustomError(FILENAME_MISSING);

      const fileName = `${uuidv4()}-${document.filename}`;
      const filePath = `document/${fileName}`;

      if (!s3) {
        throw new CustomError(S3_INITIALIZATION_FAILED);
      }

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: process.env["AWS_BUCKET_NAME"],
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
};
