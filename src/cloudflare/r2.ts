import {
    S3Client,
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand
  } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY || '',
      secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY || '',
    },
  });
  

export const uploadFile = async (key: string, file: Buffer) => {
    await S3.send(
        new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || '',
            Key: key,
            Body: file,
        })
    );
}

export const removeFile = async (key: string) => {
    await S3.send(
        new DeleteObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || '',
            Key: key,
        })
    );
}

export const getSignedUrlForUpload = async (key: string) => {
    return await getSignedUrl(
        S3,
        new GetObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || '',
            Key: key,
        }),
        { expiresIn: 120 }
    );
}
