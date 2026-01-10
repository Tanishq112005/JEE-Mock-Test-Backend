import sharp from 'sharp';

class ImageConvertor {
    constructor() {}

    async simpleClean(inputBuffer: Buffer): Promise<Buffer> {
        return await sharp(inputBuffer)
            .grayscale()
            .threshold(200) 
            .png()
            .toBuffer();
    }

    async convertToTransparentMask(inputBuffer: Buffer): Promise<Buffer> {
        const cleanBuffer = await this.simpleClean(inputBuffer);
    
        const alphaMask = await sharp(cleanBuffer)
            .negate() 
            .toBuffer();

        return await sharp(cleanBuffer)
            .toColourspace('srgb') 
            .joinChannel(alphaMask) 
            .png()
            .toBuffer();
    }
    
   
    async cleanImageWithSharp(inputBuffer: Buffer): Promise<Buffer> {
        return this.simpleClean(inputBuffer);
    }


    
}

export const imageConvertor = new ImageConvertor();