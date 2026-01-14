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
            // ---------------------------------------------------------
            // STEP 1: PRESERVE TABLES & INJECT SPACING
            // ---------------------------------------------------------
            const preservedTables = [];
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
        }
        catch (error) {
            console.error("Error in converting the markdown:", error);
            return "";
        }
    }
}
exports.markdown = new Markdown();
