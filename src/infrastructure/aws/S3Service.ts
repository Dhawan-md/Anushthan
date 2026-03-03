import { Service } from "typedi";
import { FileUpload } from "graphql-upload-minimal";
import { Upload } from "@aws-sdk/lib-storage";
import { ObjectCannedACL, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

import { getInitializedS3Client } from "../../config/aws";
import { getBucketName } from "../../utils/getBucketName";
import { S3BucketType } from "../../utils/enums";
import { logger } from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import {
    FILENAME_MISSING,
    INTERNAL_ERROR_OCCURRED,
    S3_INITIALIZATION_FAILED,
    SIGNED_URL_GENERATION_FAILED,
} from "../../utils/messages";

@Service()
export class S3Service {
    async generateSignedUrl(
        filePath: string,
        type: S3BucketType
    ): Promise<string> {
        const s3 = await getInitializedS3Client();

        if (!s3) {
            throw new CustomError(S3_INITIALIZATION_FAILED);
        }
        const bucketName = getBucketName(type);

        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: filePath,
        });

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

        if (!signedUrl) {
            logger.error("🔥 Error generating signed URL");
            throw new CustomError(SIGNED_URL_GENERATION_FAILED);
        }

        return signedUrl;
    }
    async uploadFiles(
        documents: FileUpload | FileUpload[],
        type: S3BucketType
    ): Promise<{ filePath: string }[]> {
        const files = Array.isArray(documents) ? documents : [documents];
        const uploadedFiles: { filePath: string }[] = [];
        const s3 = await getInitializedS3Client();

        if (!s3) {
            throw new CustomError(S3_INITIALIZATION_FAILED);
        }

        const bucketName = getBucketName(type);

        try {
            await Promise.all(
                files.map(async (documentPromise) => {
                    const document = await documentPromise;

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
            logger.error(`🔥 File upload failed `, error);

            // Rollback: Delete successfully uploaded files
            await Promise.all(
                uploadedFiles.map(async ({ filePath }) => {
                    await this.deleteFile(bucketName, filePath);
                })
            );

            throw new CustomError(INTERNAL_ERROR_OCCURRED);
        }
    }

    async deleteFile(bucketName: string, filePath: string) {
        const s3 = await getInitializedS3Client();
        if (!s3) {
            throw new CustomError(S3_INITIALIZATION_FAILED);
        }

        try {
            const deleteFile = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: filePath,
            });
            await s3.send(deleteFile);
            logger.info(`🗑️ Deleted file : ${filePath}`);
        } catch (error: any) {
            logger.error(`⚠️ Failed to delete file ${filePath}: ${error.message}`);
        }
    }
}
