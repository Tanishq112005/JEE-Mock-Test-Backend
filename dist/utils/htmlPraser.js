"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlParser = void 0;
const cheerio = __importStar(require("cheerio"));
class HtmlParser {
    constructor() { }
    /**
     * Replaces valid image URLs with simple placeholders (image_0, image_1).
     * Returns:
     * 1. Modified HTML (to save in DB)
     * 2. Image Map (to help you download the files)
     */
    processContent(htmlContent) {
        try {
            if (!htmlContent)
                return { html: "", images: [] };
            // FIX: Load with standard arguments. Cheerio wraps content in <body>.
            const $ = cheerio.load(htmlContent);
            const imagesFound = [];
            // 1. Flatten <picture> tags
            $('picture').each((_, element) => {
                const imgTag = $(element).find('img');
                if (imgTag.length > 0) {
                    $(element).replaceWith(imgTag);
                }
            });
            // 2. Process every <img> tag
            $('img').each((index, element) => {
                const el = $(element);
                // Get the real URL
                const originalUrl = el.attr('data-orsrc') || el.attr('src');
                if (originalUrl && originalUrl.trim() !== '') {
                    const placeholder = `image_${index}`;
                    // UPDATE HTML: Set src="image_0"
                    el.attr('src', placeholder);
                    el.attr('alt', placeholder);
                    // Cleanup attributes
                    el.removeAttr('data-orsrc');
                    el.removeAttr('srcset');
                    el.removeAttr('style');
                    el.removeAttr('width');
                    el.removeAttr('height');
                    // Save mapping
                    imagesFound.push({
                        placeholder: placeholder,
                        originalUrl: originalUrl
                    });
                }
            });
            // 3. Clean up
            $('script').remove();
            $('style').remove();
            // FIX: Extract content from <body> to avoid wrapping in <html><body> tags
            const finalHtml = $('body').html() || $.html();
            return {
                html: finalHtml || "",
                images: imagesFound
            };
        }
        catch (err) {
            console.error("Error processing HTML:", err);
            return { html: htmlContent, images: [] };
        }
    }
}
exports.htmlParser = new HtmlParser();
