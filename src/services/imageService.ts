import { backblaze } from "../lib/s3";
import dns from "node:dns";
import { imageConverting } from "../types/image.types";
import { htmlParser } from "../utils/htmlPraser";
import { imageConvertor } from "../utils/imageConvertor";

dns.setDefaultResultOrder("ipv4first");

class ImageConvertingAndUploadingService {
  constructor() {}

  async imageConverstion(payload: imageConverting): Promise<{ html: string; imagePaths: string[] }> {
    
    // 1. Parse HTML
    const parsedResult = htmlParser.processContent(payload.content);
    const { html, images } = parsedResult;

    // If no images, return clean HTML and empty array
    if (!images || images.length === 0) {
      return { html: html, imagePaths: [] };
    }

    const uploadedPaths: string[] = [];

    // 2. Loop through found images and upload them
    for (const imgData of images) {
      const { placeholder, originalUrl } = imgData;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(originalUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`Failed to fetch image: ${response.status}`);
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const originalBuffer = Buffer.from(arrayBuffer);

        const finalLoad = await imageConvertor.convertToTransparentMask(originalBuffer);

        // Construct S3 Path
        const imageName = `${payload.exam}/${payload.id}_${payload.type}_${placeholder}.png`;

        await backblaze.uploadImage({
          imageName: imageName,
          fileContent: finalLoad,
        });

        // Add the S3 path to our list (IMPORTANT!)
        uploadedPaths.push(imageName);

      } catch (error: any) {
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

export const imageUpload = new ImageConvertingAndUploadingService();