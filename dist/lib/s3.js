"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backblaze = void 0;
const backblaze_b2_1 = __importDefault(require("backblaze-b2"));
const env_1 = require("../config/env");
class BackblazeService {
    b2;
    bucketId = null;
    constructor() {
        const bucketkeyId = String(env_1.BACKBLAZE_KEY_ID);
        const bucketKeyapplication = String(env_1.BACKBLAZE_APP_KEY);
        this.b2 = new backblaze_b2_1.default({
            applicationKeyId: bucketkeyId,
            applicationKey: bucketKeyapplication,
        });
    }
    async ensureAuthorized() {
        try {
            const authResponse = await this.b2.authorize();
            if (!this.bucketId) {
                const bucketsResponse = await this.b2.listBuckets();
                const bucket = bucketsResponse.data.buckets.find((b) => b.bucketName === env_1.BUCKET_NAME);
                if (!bucket) {
                    throw new Error(`Bucket with name "${env_1.BUCKET_NAME}" not found in your Backblaze account.`);
                }
                this.bucketId = bucket.bucketId;
                console.log(`Connected to Backblaze. Bucket ID: ${this.bucketId}`);
            }
        }
        catch (err) {
            console.error("Backblaze Authorization Failed:", err);
            throw err;
        }
    }
    async uploadImage(payload) {
        try {
            await this.ensureAuthorized();
            const bufferBody = Buffer.isBuffer(payload.fileContent)
                ? payload.fileContent
                : Buffer.from(payload.fileContent);
            console.log(`Preparing upload for: ${payload.imageName} (Size: ${bufferBody.length})`);
            const uploadUrlResponse = await this.b2.getUploadUrl({
                bucketId: this.bucketId,
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
        }
        catch (err) {
            console.error(`Error uploading ${payload.imageName}:`, err);
            throw err;
        }
    }
    async getImageLink(imageName) {
        try {
            await this.ensureAuthorized();
            let expireSeconds = parseInt(env_1.IMAGE_EXPIRE_TIME || "86400");
            if (expireSeconds > 604800) {
                console.warn(`Warning: IMAGE_EXPIRE_TIME (${expireSeconds}) exceeds B2 limit. Capping at 7 days.`);
                expireSeconds = 604800;
            }
            const response = await this.b2.getDownloadAuthorization({
                bucketId: this.bucketId,
                fileNamePrefix: imageName,
                validDurationInSeconds: expireSeconds,
            });
            return `https://f003.backblazeb2.com/file/${env_1.BUCKET_NAME}/${imageName}?Authorization=${response.data.authorizationToken}`;
        }
        catch (err) {
            console.error("❌ Error generating link:", err);
            throw err;
        }
    }
}
exports.backblaze = new BackblazeService();
