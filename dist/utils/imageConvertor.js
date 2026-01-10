"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageConvertor = void 0;
const sharp_1 = __importDefault(require("sharp"));
class ImageConvertor {
    constructor() { }
    async simpleClean(inputBuffer) {
        return await (0, sharp_1.default)(inputBuffer)
            .grayscale()
            .threshold(200)
            .png()
            .toBuffer();
    }
    async convertToTransparentMask(inputBuffer) {
        const cleanBuffer = await this.simpleClean(inputBuffer);
        const alphaMask = await (0, sharp_1.default)(cleanBuffer)
            .negate()
            .toBuffer();
        return await (0, sharp_1.default)(cleanBuffer)
            .toColourspace('srgb')
            .joinChannel(alphaMask)
            .png()
            .toBuffer();
    }
    async cleanImageWithSharp(inputBuffer) {
        return this.simpleClean(inputBuffer);
    }
}
exports.imageConvertor = new ImageConvertor();
