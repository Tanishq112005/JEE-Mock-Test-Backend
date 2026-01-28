"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageUpload = void 0;
const s3_1 = require("../lib/s3");
const node_dns_1 = __importDefault(require("node:dns"));
const htmlPraser_1 = require("../utils/htmlPraser");
const imageConvertor_1 = require("../utils/imageConvertor");
node_dns_1.default.setDefaultResultOrder("ipv4first");
class ImageConvertingAndUploadingService {
    constructor() { }
    async imageConverstion(payload) {
        // 1. Parse HTML
        const parsedResult = htmlPraser_1.htmlParser.processContent(payload.content);
        const { html, images } = parsedResult;
        // If no images, return clean HTML and empty array
        if (!images || images.length === 0) {
            return { html: html, imagePaths: [] };
        }
        const uploadedPaths = [];
        // 2. Loop through found images and upload them
        for (const imgData of images) {
            const { placeholder, originalUrl } = imgData;
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);
                const response = await fetch(originalUrl, {
                    signal: controller.signal,
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    },
                });
                clearTimeout(timeoutId);
                if (!response.ok) {
                    console.error(`Failed to fetch image: ${response.status}`);
                    continue;
                }
                const arrayBuffer = await response.arrayBuffer();
                const originalBuffer = Buffer.from(arrayBuffer);
                const finalLoad = await imageConvertor_1.imageConvertor.convertToTransparentMask(originalBuffer);
                // Construct S3 Path
                const imageName = `${payload.exam}/${payload.id}_${payload.type}_${placeholder}.png`;
                await s3_1.backblaze.uploadImage({
                    imageName: imageName,
                    fileContent: finalLoad,
                });
                // Add the S3 path to our list (IMPORTANT!)
                uploadedPaths.push(imageName);
            }
            catch (error) {
                console.error(`Error processing image ${originalUrl}:`, error.message);
            }
        }
        // 3. Return BOTH the HTML and the Paths
        return {
            html: html,
            imagePaths: uploadedPaths
        };
    }
}
exports.imageUpload = new ImageConvertingAndUploadingService();
