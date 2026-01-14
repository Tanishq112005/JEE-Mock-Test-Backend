import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
// @ts-ignore
import { gfm } from 'turndown-plugin-gfm';

class Markdown {
    private turndownService: TurndownService;

    constructor() {
        this.turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            emDelimiter: '*',
        });

        this.turndownService.use(gfm);

        this.turndownService.addRule('latex-protect', {
            filter: (node) => false,
            replacement: (c) => c
        });
    }

    convertor(htmlContent: string): string {
        try {
            if (!htmlContent) return "";

            const $ = cheerio.load(htmlContent);

            // ---------------------------------------------------------
            // STEP 1: PRESERVE TABLES & INJECT SPACING
            // ---------------------------------------------------------
            const preservedTables: string[] = [];
            
            $('table').each((i, table) => {
                const $t = $(table);
                
                // 1. Clean container attributes
                $t.removeAttr('style');
                $t.removeAttr('width');
                $t.removeAttr('class');
                $t.removeAttr('border');
                $t.find('colgroup').remove();
                
                // 2. INJECT SPACING (THE FIX)
                // We strip messy original styles, then Apply our own padding.
                // 'padding: 6px 25px' adds 25px gap on Left/Right of every cell.
                $t.find('td, th').each((_, cell) => {
                    $(cell).removeAttr('style'); // Remove old styles
                    $(cell).removeAttr('width');
                    $(cell).attr('style', 'padding: 5px 20px; vertical-align: top; text-align: left;');
                });

                // 3. Save the formatted HTML
                preservedTables.push($.html(table));
                
                // 4. Replace with safe placeholder
                $t.replaceWith(`TABLEPLACEHOLDER${i}`);
            });

            // Process Images
            $('img').each((index, element) => {
                const el = $(element);
                const realUrl = el.attr('data-orsrc') || el.attr('src') || '';
                if (realUrl) {
                    el.attr('src', index.toString());
                    el.attr('alt', `image_${index}`);
                }
            });

            $('style').remove();
            $('script').remove();

            const bodyHtml = $('body').html();
            let markdown = this.turndownService.turndown(bodyHtml || htmlContent || '');

            // Restore Images
            markdown = markdown
                .replace(/\\!\[/g, '![')          
                .replace(/!\[/g, '\n\n![');       

            // ---------------------------------------------------------
            // STEP 4: RESTORE TABLES
            // ---------------------------------------------------------
            markdown = markdown.replace(/TABLEPLACEHOLDER(\d+)/g, (match, id) => {
                return `\n\n${preservedTables[parseInt(id)]}\n\n`;
            });

            // ---------------------------------------------------------
            // STEP 5: Math Processing
            // ---------------------------------------------------------
            const mathRegex = /(\$\$[\s\S]*?\$\$)|(\$[^$\n]+\$)/g;

            markdown = markdown.replace(mathRegex, (match, blockMath, inlineMath) => {
                if (blockMath) {
                    let content = blockMath;
                    content = content.replace(/\$\$\s*\\+\s*begin/g, '\\begin');
                    content = content.replace(/\\text\s+\{\s+/g, '\\text{');
                    content = content.replace(/\\left\\\[/g, '[').replace(/\\right\\\]/g, ']');
                    content = content.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
                    content = content.replace(/\\\\/g, '\\'); 

                    if (content.includes('![')) {
                         let cleanBlock = content.replace(/\$\$/g, '').trim();
                         cleanBlock = cleanBlock.replace(/\\\\/g, '\\\\ '); 
                         return `$$ ${cleanBlock} $$`;
                    }

                    let cleanBlock = content.replace(/\$\$/g, ''); 
                    cleanBlock = cleanBlock.replace(/\\_/g, '_');
                    
                    return `$$ ${cleanBlock.trim()} $$`;
                }

                if (inlineMath) {
                    return inlineMath
                        .replace(/\\\\/g, '\\')
                        .replace(/\\_/g, '_');
                }

                return match;
            });

            markdown = markdown.replace(/\n{3,}/g, '\n\n');

            return markdown;

        } catch (error) {
            console.error("Error in converting the markdown:", error);
            return "";
        }
    }
}

export const markdown = new Markdown();