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

            // 1. Process Images
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
            $('colgroup').remove();

            const bodyHtml = $('body').html();
            let markdown = this.turndownService.turndown(bodyHtml || htmlContent || '');

            // ---------------------------------------------------------
            // FIX 1: Ensure images have breathing room
            // ---------------------------------------------------------
            markdown = markdown
                .replace(/\\!\[/g, '![')          
                .replace(/!\[/g, '\n\n![');       

            // ---------------------------------------------------------
            // FIX 2: Math Processing (Cleaning + Stateful Repair)
            // ---------------------------------------------------------
            
            const mathRegex = /(\$\$[\s\S]*?\$\$)|(\$[^$\n]+\$)/g;

            markdown = markdown.replace(mathRegex, (match, blockMath, inlineMath) => {
                // --- CASE 1: Block Math ($$ ... $$) ---
                if (blockMath) {
                    let content = blockMath;

                    // === A. SYNTAX SANITIZER ===
                    
                    // 1. Fix broken begin tags ($$\ $$begin -> \begin)
                    content = content.replace(/\$\$\s*\\+\s*begin/g, '\\begin');
                    
                    // 2. Fix text spacing (\text { emf } -> \text{emf})
                    content = content.replace(/\\text\s+\{\s+/g, '\\text{');

                    // 3. Fix ALL brackets: \left\[, \right\], \[, \] -> [ ]
                    // We do this in order: first \left\[, then just \[
                    content = content.replace(/\\left\\\[/g, '[').replace(/\\right\\\]/g, ']');
                    content = content.replace(/\\\[/g, '[').replace(/\\\]/g, ']');

                    // 4. Standard cleanup (Use single backslash)
                    content = content.replace(/\\\\/g, '\\'); 
                    
                    // ⚠️ CRITICAL FIX: Do NOT add ' \\\\ \n ' here. 
                    // Adding \n creates double newlines if the source already has them, 
                    // which breaks the math block and causes the "EOF got &" error.

                    // === B. SPLIT & REPAIR LOGIC ===
                    
                    // Only process complex logic if the block is split by an IMAGE
                    if (content.includes('![')) {
                        
                        // Split content by the Image Markdown
                        const parts = content.split(/(!\[.*?\]\(.*?\))/g);
                        
                        // STATE TRACKER: Keeps track of open environment across parts
                        let openEnv: string | null = null;

                        return parts.map((part : any) => {
                            part = part.trim();
                            
                            if (part.startsWith('![')) return `\n\n${part}\n\n`;
                            if (part === '$$' || part === '') return '';

                            let cleanPart = part.replace(/\$\$/g, '').trim();
                            if (!cleanPart) return '';

                            // --- STEP 1: Prepend missing \begin if an env is open ---
                            if (openEnv) {
                                cleanPart = `\\begin{${openEnv}}\n${cleanPart}`;
                            }

                            // --- STEP 2: Detect if we are leaving this chunk with an open env ---
                            const beginMatches = [...cleanPart.matchAll(/\\begin\s*\{\s*([a-zA-Z0-9*]+)\s*\}/g)];
                            
                            if (beginMatches.length > 0) {
                                const lastBegin = beginMatches[beginMatches.length - 1];
                                const envName = lastBegin[1];
                                const index = lastBegin.index || 0;

                                const remainingText = cleanPart.slice(index);
                                const hasEnd = new RegExp(`\\\\end\\s*\\{\\s*${envName.replace('*', '\\*')}\\s*\\}`).test(remainingText);

                                if (!hasEnd) openEnv = envName;
                                else openEnv = null;
                            } else {
                                if (openEnv) {
                                     const hasEnd = new RegExp(`\\\\end\\s*\\{\\s*${openEnv.replace('*', '\\*')}\\s*\\}`).test(cleanPart);
                                     if (hasEnd) openEnv = null;
                                }
                            }

                            // --- STEP 3: Append missing \end if we are leaving it open ---
                            if (openEnv) {
                                cleanPart = `${cleanPart}\n\\end{${openEnv}}`;
                            }

                            // Final Cleanup: Double backslashes
                            // We only add \n here because we are reconstructing the block manually
                            cleanPart = cleanPart.replace(/\\\\/g, '\\\\ \n');
                            cleanPart = cleanPart.replace(/\\_/g, '_');

                            return `$$ \n${cleanPart}\n $$`;
                        }).join('\n');
                    }

                    // --- Standard Block Math (No Image) ---
                    // Just clean delimiters and return. 
                    // DO NOT add extra newlines to \\\\ here.
                    let cleanBlock = content.replace(/\$\$/g, ''); 
                    cleanBlock = cleanBlock.replace(/\\_/g, '_');
                    
                    return `$$ \n${cleanBlock}\n $$`;
                }

                // --- CASE 2: Inline Math ($ ... $) ---
                if (inlineMath) {
                    return inlineMath
                        .replace(/\\\\/g, '\\')
                        .replace(/\\_/g, '_');
                }

                return match;
            });

            // Cleanup excess newlines
            markdown = markdown.replace(/\n{3,}/g, '\n\n');

            return markdown;

        } catch (error) {
            console.error("Error in converting the markdown:", error);
            return "";
        }
    }
}

export const markdown = new Markdown();