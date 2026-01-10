import * as cheerio from 'cheerio';

class HtmlParser {

    constructor() {}


    // extracting the image from the html tags 
    extractImages(htmlContent: string): string[] {
        try {
            const $ = cheerio.load(htmlContent);
            
            const imageLinks = $('img')
                .map((index, element) => {
                    const el = $(element);
                    return el.attr('data-orsrc') || el.attr('src');
                })
                .get();
            
            
            const uniqueLinks = [...new Set(imageLinks)].filter(link => link && link.trim() !== '');
            
            return uniqueLinks as string[];    
        }
        catch(err) {
            console.error("Error extracting images:", err);
            return [];
        }
    }
}

export const htmlParser = new HtmlParser();