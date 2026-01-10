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
        const imageStringInContent = htmlPraser_1.htmlParser.extractImages(payload.content);
        let imageNameInContent = [];
        for (let i = 0; i < imageStringInContent.length; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);
                const response = await fetch(imageStringInContent[i], {
                    signal: controller.signal,
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    },
                });
                clearTimeout(timeoutId);
                if (!response.ok) {
                    console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
                    continue;
                }
                const arrayBuffer = await response.arrayBuffer();
                const originalBuffer = Buffer.from(arrayBuffer);
                const finalLoad = await imageConvertor_1.imageConvertor.convertToTransparentMask(originalBuffer);
                const imageName = `${payload.exam}` + '/' + `${payload.id + '_' + `image_{${i}}`}`;
                await s3_1.backblaze.uploadImage({
                    imageName: imageName,
                    fileContent: finalLoad,
                });
                imageNameInContent.push(imageName);
            }
            catch (error) {
                if (error.name === "AbortError") {
                    console.error(`Timeout fetching image ${i}`);
                }
                else {
                    console.error(`Error proceessing image ${i}:`, error.message);
                }
            }
        }
        return imageNameInContent;
    }
}
exports.imageUpload = new ImageConvertingAndUploadingService();
