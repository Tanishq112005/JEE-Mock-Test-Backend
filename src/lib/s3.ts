import B2 from "backblaze-b2";
import {
  BUCKET_NAME,
  BACKBLAZE_APP_KEY,
  BACKBLAZE_KEY_ID,
  IMAGE_EXPIRE_TIME,
} from "../config/env";
import { imageTypes } from "../types/s3.types";

class BackblazeService {
  private b2: B2;
  private bucketId: string | null = null;

  constructor() {
    const bucketkeyId = String(BACKBLAZE_KEY_ID);
    const bucketKeyapplication = String(BACKBLAZE_APP_KEY);
    this.b2 = new B2({
      applicationKeyId: bucketkeyId,
      applicationKey: bucketKeyapplication,
    });
  }

  private async ensureAuthorized() {
    try {
      const authResponse = await this.b2.authorize();

      if (!this.bucketId) {
        const bucketsResponse = await this.b2.listBuckets();
        const bucket = bucketsResponse.data.buckets.find(
          (b: any) => b.bucketName === BUCKET_NAME
        );

        if (!bucket) {
          throw new Error(
            `Bucket with name "${BUCKET_NAME}" not found in your Backblaze account.`
          );
        }
        this.bucketId = bucket.bucketId;
        console.log(`Connected to Backblaze. Bucket ID: ${this.bucketId}`);
      }
    } catch (err) {
      console.error("Backblaze Authorization Failed:", err);
      throw err;
    }
  }

  async uploadImage(payload: imageTypes) {
    try {
      await this.ensureAuthorized();

      const bufferBody = Buffer.isBuffer(payload.fileContent)
        ? payload.fileContent
        : Buffer.from(payload.fileContent);

      console.log(
        `Preparing upload for: ${payload.imageName} (Size: ${bufferBody.length})`
      );

      const uploadUrlResponse = await this.b2.getUploadUrl({
        bucketId: this.bucketId!,
      });

      const { uploadUrl, authorizationToken } = uploadUrlResponse.data;

      await this.b2.uploadFile({
        uploadUrl: uploadUrl,
        uploadAuthToken: authorizationToken,
        fileName: payload.imageName,
        data: bufferBody,
        mime: "image/png",
      });

      console.log(`Upload success: ${payload.imageName}`);
    } catch (err) {
      console.error(`Error uploading ${payload.imageName}:`, err);
      throw err;
    }
  }

  async getImageLink(imageName: string): Promise<string> {
    try {
      await this.ensureAuthorized();
      let expireSeconds = parseInt(IMAGE_EXPIRE_TIME || "86400");
      if (expireSeconds > 604800) {
        console.warn(
          `Warning: IMAGE_EXPIRE_TIME (${expireSeconds}) exceeds B2 limit. Capping at 7 days.`
        );
        expireSeconds = 604800;
      }

      const response = await this.b2.getDownloadAuthorization({
        bucketId: this.bucketId!,
        fileNamePrefix: imageName,
        validDurationInSeconds: expireSeconds,
      });

      return `https://f003.backblazeb2.com/file/${BUCKET_NAME}/${imageName}?Authorization=${response.data.authorizationToken}`;
    } catch (err) {
      console.error("❌ Error generating link:", err);
      throw err;
    }
  }
}

export const backblaze = new BackblazeService();
