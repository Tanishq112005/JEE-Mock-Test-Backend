"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const ollama_1 = __importDefault(require("ollama"));
const string_similarity_1 = __importDefault(require("string-similarity"));
class AiService {
    textModel;
    constructor() {
        // Using Qwen 2.5 for better structured output
        this.textModel = "qwen2.5:3b";
    }
    // 1. Chapter Decider (Text-only)
    async chapterDecider(chapterHint, topicName) {
        const VALID_CHAPTERS = [
            // PHYSICS CLASS 11
            "Units and Measurements",
            "Motion in a Straight Line",
            "Motion in a Plane",
            "Laws of Motion",
            "Work, Energy and Power",
            "System of Particles and Rotational Motion",
            "Gravitation",
            "Mechanical Properties of Solids",
            "Mechanical Properties of Fluids",
            "Thermal Properties of Matter",
            "Thermodynamics (Physics)",
            "Kinetic Theory",
            "Oscillations",
            "Waves",
            "Physical World",
            // PHYSICS CLASS 12
            "Electric Charges and Fields",
            "Electrostatic Potential and Capacitance",
            "Current Electricity",
            "Moving Charges and Magnetism",
            "Magnetism and Matter",
            "Electromagnetic Induction",
            "Alternating Current",
            "Electromagnetic Waves",
            "Ray Optics and Optical Instruments",
            "Wave Optics",
            "Dual Nature of Radiation and Matter",
            "Atoms",
            "Nuclei",
            "Semiconductor Electronics",
            "Communication Systems",
            // CHEMISTRY CLASS 11
            "Some Basic Concepts of Chemistry",
            "Structure of Atom",
            "Classification of Elements and Periodicity",
            "Chemical Bonding and Molecular Structure",
            "Thermodynamics (Chemistry)",
            "Equilibrium",
            "Redox Reactions",
            "Organic Chemistry - Some Basic Principles and Techniques",
            "Hydrocarbons",
            "States of Matter (Gases & Liquids)",
            "Hydrogen",
            "The s-Block Elements",
            "Environmental Chemistry",
            "The p-Block Elements (Class 11)",
            // CHEMISTRY CLASS 12
            "Solutions",
            "Electrochemistry",
            "Chemical Kinetics",
            "The d- and f- Block Elements",
            "Coordination Compounds",
            "Haloalkanes and Haloarenes",
            "Alcohols, Phenols and Ethers",
            "Aldehydes, Ketones and Carboxylic Acids",
            "Amines",
            "Biomolecules",
            "The Solid State",
            "Surface Chemistry",
            "General Principles (Metallurgy)",
            "Polymers",
            "Chemistry in Everyday Life",
            "The p-Block Elements (Class 12)",
            // MATHEMATICS CLASS 11
            "Sets",
            "Relations and Functions (Class 11)",
            "Trigonometric Functions",
            "Complex Numbers and Quadratic Equations",
            "Linear Inequalities",
            "Permutations and Combinations",
            "Binomial Theorem",
            "Sequences and Series",
            "Straight Lines",
            "Conic Sections",
            "Introduction to Three Dimensional Geometry",
            "Limits and Derivatives",
            "Statistics",
            "Probability (Class 11)",
            "Mathematical Reasoning",
            "Principle of Mathematical Induction",
            // MATHEMATICS CLASS 12
            "Relations and Functions (Class 12)",
            "Inverse Trigonometric Functions",
            "Matrices",
            "Determinants",
            "Continuity and Differentiability",
            "Application of Derivatives",
            "Integrals",
            "Application of Integrals",
            "Differential Equations",
            "Vector Algebra",
            "Three Dimensional Geometry",
            "Linear Programming",
            "Probability (Class 12)"
        ];
        // --- SAFETY NET MAPPING ---
        // Maps common AI hallucinations (broad terms) to specific valid chapters
        const BROAD_TERM_MAPPING = {
            "calculus": "Continuity and Differentiability",
            "differentiation": "Continuity and Differentiability",
            "derivatives": "Continuity and Differentiability",
            "integration": "Integrals",
            "coordinate geometry": "Conic Sections",
            "vectors": "Vector Algebra",
            "3d": "Three Dimensional Geometry",
            "probability": "Probability (Class 12)", // Default to 12 if unsure
            "functions": "Relations and Functions (Class 12)"
        };
        const prompt = `
      You are a strict classification algorithm.
      Task: Map the input Topic to ONE exact Chapter Name from the list below.

      VALID CHAPTERS LIST:
      ${VALID_CHAPTERS.join(", ")}

      INPUT:
      - Hint: "${chapterHint}"
      - Topic: "${topicName}"

      CRITICAL RULES:
      1. Return ONLY the exact string from the VALID CHAPTERS LIST.
      2. Do NOT output broad subject names like "Calculus", "Algebra", or "Mechanics".
      3. If the topic involves differentiation/derivatives, choose "Continuity and Differentiability".
      4. If the topic involves integration, choose "Integrals".
      5. Do not output markdown, punctuation, or explanations.
    `;
        try {
            const response = await ollama_1.default.chat({
                model: this.textModel,
                messages: [{ role: 'user', content: prompt }],
                stream: false
            });
            let cleanChapterName = response.message.content.trim();
            // Cleanup: Remove quotes, trailing periods, or markdown bolding
            cleanChapterName = cleanChapterName.replace(/['"*]+/g, '').replace(/\.$/, '');
            const lowerName = cleanChapterName.toLowerCase();
            // 1. Check Broad Term Mapping (Fast Fix)
            if (BROAD_TERM_MAPPING[lowerName]) {
                return BROAD_TERM_MAPPING[lowerName];
            }
            // 2. Fuzzy Match against Valid List
            const matches = string_similarity_1.default.findBestMatch(cleanChapterName, VALID_CHAPTERS);
            const bestMatch = matches.bestMatch;
            // If match is decent (>30%), use the strict database name
            if (bestMatch.rating > 0.3) {
                return bestMatch.target;
            }
            console.warn(`Ollama returned a non-standard chapter: ${cleanChapterName} (Best match: ${bestMatch.target} at ${bestMatch.rating})`);
            // 3. Emergency Fallback: Match Input TOPIC against Valid List
            // If AI fails, maybe the topic name itself is close enough (e.g. topic: "Matrices")
            const topicMatch = string_similarity_1.default.findBestMatch(topicName, VALID_CHAPTERS);
            if (topicMatch.bestMatch.rating > 0.4) {
                console.log(`AiService: AI failed, but Topic matched '${topicMatch.bestMatch.target}'`);
                return topicMatch.bestMatch.target;
            }
            return "Unknown Chapter";
        }
        catch (err) {
            console.error("Ollama Chapter Decision Failed:", err);
            return "Unknown Chapter";
        }
    }
}
exports.aiService = new AiService();
