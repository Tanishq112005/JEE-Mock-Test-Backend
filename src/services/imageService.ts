import { backblaze } from "../lib/s3";
import dns from "node:dns";
import { imageConverting } from "../types/image.types";
import { htmlParser } from "../utils/htmlPraser";
import { imageConvertor } from "../utils/imageConvertor";
dns.setDefaultResultOrder("ipv4first");
class ImageConvertingAndUploadingService {
  constructor() {}

  async imageConverstion(payload: imageConverting): Promise<string[]> {
    const imageStringInContent: string[] = htmlParser.extractImages(
      payload.content
    );
    let imageNameInContent: string[] = [];
    for (let i = 0; i < imageStringInContent.length; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const response = await fetch(imageStringInContent[i], {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
          console.error(
            `Failed to fetch image: ${response.status} ${response.statusText}`
          );
          continue;
        }
        const arrayBuffer = await response.arrayBuffer();
        const originalBuffer = Buffer.from(arrayBuffer);
        const finalLoad = await imageConvertor.convertToTransparentMask(
          originalBuffer
        );
        
        const imageName = `${payload.exam}` +'/'+ `${payload.id+'_'+`image_{${i}}`}`;

        await backblaze.uploadImage({
          imageName: imageName,
          fileContent: finalLoad,
        });
        
        imageNameInContent.push(imageName);
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.error(`Timeout fetching image ${i}`);
        } else {
          console.error(`Error proceessing image ${i}:`, error.message);
        }
      }
    }

    return imageNameInContent;
  }
}



export const imageUpload = new ImageConvertingAndUploadingService() ; 