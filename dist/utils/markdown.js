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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markdown = void 0;
const cheerio = __importStar(require("cheerio"));
const turndown_1 = __importDefault(require("turndown"));
// @ts-ignore
const turndown_plugin_gfm_1 = require("turndown-plugin-gfm");
class Markdown {
    turndownService;
    constructor() {
        this.turndownService = new turndown_1.default({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            emDelimiter: '*',
        });
        this.turndownService.use(turndown_plugin_gfm_1.gfm);
        this.turndownService.addRule('latex-protect', {
            filter: (node) => false,
            replacement: (c) => c
        });
    }
    convertor(htmlContent) {
        try {
            if (!htmlContent)
                return "";
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
                        let openEnv = null;
                        return parts.map((part) => {
                            part = part.trim();
                            if (part.startsWith('!['))
                                return `\n\n${part}\n\n`;
                            if (part === '$$' || part === '')
                                return '';
                            let cleanPart = part.replace(/\$\$/g, '').trim();
                            if (!cleanPart)
                                return '';
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
                                if (!hasEnd)
                                    openEnv = envName;
                                else
                                    openEnv = null;
                            }
                            else {
                                if (openEnv) {
                                    const hasEnd = new RegExp(`\\\\end\\s*\\{\\s*${openEnv.replace('*', '\\*')}\\s*\\}`).test(cleanPart);
                                    if (hasEnd)
                                        openEnv = null;
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
        }
        catch (error) {
            console.error("Error in converting the markdown:", error);
            return "";
        }
    }
}
exports.markdown = new Markdown();
