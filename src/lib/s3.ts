import B2 from "backblaze-b2";
import {
  BUCKET_NAME,
  BACKBLAZE_APP_KEY,
  BACKBLAZE_KEY_ID,
  IMAGE_WORKER_BASE_URL, 
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
  
      if (this.bucketId) return;

      await this.b2.authorize();

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
  
  // getting the image link
  getImageLink(imageName: string) {
    
    return `${IMAGE_WORKER_BASE_URL}/${imageName}`;
  }
}

export const backblaze = new BackblazeService();