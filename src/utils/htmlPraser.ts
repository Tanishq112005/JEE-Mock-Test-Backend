import * as cheerio from 'cheerio';

class HtmlParser {

    constructor() {}

    /**
     * Replaces valid image URLs with simple placeholders (image_0, image_1).
     * Returns:
     * 1. Modified HTML (to save in DB)
     * 2. Image Map (to help you download the files)
     */
    processContent(htmlContent: string): { 
        html: string; 
        images: { placeholder: string; originalUrl: string }[] 
    } {
        try {
            if (!htmlContent) return { html: "", images: [] };

            // FIX: Load with standard arguments. Cheerio wraps content in <body>.
            const $ = cheerio.load(htmlContent);
            
            const imagesFound: { placeholder: string; originalUrl: string }[] = [];

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

        } catch (err) {
            console.error("Error processing HTML:", err);
            return { html: htmlContent, images: [] };
        }
    }
}

export const htmlParser = new HtmlParser();