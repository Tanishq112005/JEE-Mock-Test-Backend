"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedChapters = void 0;
const chapter_db_1 = require("../repositories/chapter.db");
const chaptersData = [
    // ================= PHYSICS CLASS 11 =================
    {
        name: "Units and Measurements",
        classNumber: 11, chapterNumber: 1, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Motion in a Straight Line",
        classNumber: 11, chapterNumber: 2, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Motion in a Plane",
        classNumber: 11, chapterNumber: 3, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Laws of Motion",
        classNumber: 11, chapterNumber: 4, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Work, Energy and Power",
        classNumber: 11, chapterNumber: 5, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "System of Particles and Rotational Motion",
        classNumber: 11, chapterNumber: 6, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Gravitation",
        classNumber: 11, chapterNumber: 7, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Mechanical Properties of Solids",
        classNumber: 11, chapterNumber: 8, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Mechanical Properties of Fluids",
        classNumber: 11, chapterNumber: 9, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Thermal Properties of Matter",
        classNumber: 11, chapterNumber: 10, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Thermodynamics (Physics)", // <--- RENAMED
        classNumber: 11, chapterNumber: 11, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Kinetic Theory",
        classNumber: 11, chapterNumber: 12, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Oscillations",
        classNumber: 11, chapterNumber: 13, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Waves",
        classNumber: 11, chapterNumber: 14, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Physical World",
        classNumber: 11, chapterNumber: 15, subject: "Physics",
        syllabus: { cbse: false, jeemain: false, jeeadvanced: false }
    },
    // ================= PHYSICS CLASS 12 =================
    {
        name: "Electric Charges and Fields",
        classNumber: 12, chapterNumber: 1, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Electrostatic Potential and Capacitance",
        classNumber: 12, chapterNumber: 2, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Current Electricity",
        classNumber: 12, chapterNumber: 3, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Moving Charges and Magnetism",
        classNumber: 12, chapterNumber: 4, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Magnetism and Matter",
        classNumber: 12, chapterNumber: 5, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Electromagnetic Induction",
        classNumber: 12, chapterNumber: 6, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Alternating Current",
        classNumber: 12, chapterNumber: 7, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Electromagnetic Waves",
        classNumber: 12, chapterNumber: 8, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Ray Optics and Optical Instruments",
        classNumber: 12, chapterNumber: 9, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Wave Optics",
        classNumber: 12, chapterNumber: 10, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Dual Nature of Radiation and Matter",
        classNumber: 12, chapterNumber: 11, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Atoms",
        classNumber: 12, chapterNumber: 12, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Nuclei",
        classNumber: 12, chapterNumber: 13, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Semiconductor Electronics",
        classNumber: 12, chapterNumber: 14, subject: "Physics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Communication Systems",
        classNumber: 12, chapterNumber: 15, subject: "Physics",
        syllabus: { cbse: false, jeemain: false, jeeadvanced: false }
    },
    // ================= CHEMISTRY CLASS 11 =================
    {
        name: "Some Basic Concepts of Chemistry",
        classNumber: 11, chapterNumber: 1, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Structure of Atom",
        classNumber: 11, chapterNumber: 2, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Classification of Elements and Periodicity",
        classNumber: 11, chapterNumber: 3, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Chemical Bonding and Molecular Structure",
        classNumber: 11, chapterNumber: 4, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Thermodynamics (Chemistry)", // <--- RENAMED
        classNumber: 11, chapterNumber: 5, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Equilibrium",
        classNumber: 11, chapterNumber: 6, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Redox Reactions",
        classNumber: 11, chapterNumber: 7, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Organic Chemistry - Some Basic Principles and Techniques",
        classNumber: 11, chapterNumber: 8, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Hydrocarbons",
        classNumber: 11, chapterNumber: 9, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    // --- Deleted Chapters (Present in Advanced) ---
    {
        name: "States of Matter (Gases & Liquids)",
        classNumber: 11, chapterNumber: 10, subject: "Chemistry",
        syllabus: { cbse: false, jeemain: false, jeeadvanced: true }
    },
    {
        name: "Hydrogen",
        classNumber: 11, chapterNumber: 11, subject: "Chemistry",
        syllabus: { cbse: false, jeemain: false, jeeadvanced: true }
    },
    {
        name: "The s-Block Elements",
        classNumber: 11, chapterNumber: 12, subject: "Chemistry",
        syllabus: { cbse: false, jeemain: false, jeeadvanced: true }
    },
    {
        name: "Environmental Chemistry",
        classNumber: 11, chapterNumber: 14, subject: "Chemistry",
        syllabus: { cbse: false, jeemain: false, jeeadvanced: true }
    },
    // ================= CHEMISTRY CLASS 12 =================
    {
        name: "Solutions",
        classNumber: 12, chapterNumber: 1, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Electrochemistry",
        classNumber: 12, chapterNumber: 2, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Chemical Kinetics",
        classNumber: 12, chapterNumber: 3, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "The d- and f- Block Elements",
        classNumber: 12, chapterNumber: 4, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Coordination Compounds",
        classNumber: 12, chapterNumber: 5, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Haloalkanes and Haloarenes",
        classNumber: 12, chapterNumber: 6, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Alcohols, Phenols and Ethers",
        classNumber: 12, chapterNumber: 7, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Aldehydes, Ketones and Carboxylic Acids",
        classNumber: 12, chapterNumber: 8, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Amines",
        classNumber: 12, chapterNumber: 9, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Biomolecules",
        classNumber: 12, chapterNumber: 10, subject: "Chemistry",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    // --- Deleted Chapters (Present in Advanced) ---
    {
        name: "The Solid State",
        classNumber: 12, chapterNumber: 11, subject: "Chemistry",
        syllabus: { cbse: false, jeemain: false, jeeadvanced: true }
    },
    {
        name: "Surface Chemistry",
        classNumber: 12, chapterNumber: 12, subject: "Chemistry",
        syllabus: { cbse: false, jeemain: false, jeeadvanced: true }
    },
    {
        name: "General Principles (Metallurgy)",
        classNumber: 12, chapterNumber: 13, subject: "Chemistry",
        syllabus: { cbse: false, jeemain: false, jeeadvanced: true }
    },
    {
        name: "Polymers",
        classNumber: 12, chapterNumber: 15, subject: "Chemistry",
        syllabus: { cbse: false, jeemain: false, jeeadvanced: true }
    },
    {
        name: "Chemistry in Everyday Life",
        classNumber: 12, chapterNumber: 16, subject: "Chemistry",
        syllabus: { cbse: false, jeemain: false, jeeadvanced: false }
    },
    // --- P-Block Special Case ---
    {
        name: "The p-Block Elements (Class 11)",
        classNumber: 11, chapterNumber: 13, subject: "Chemistry",
        syllabus: { cbse: false, jeemain: true, jeeadvanced: true }
    },
    {
        name: "The p-Block Elements (Class 12)",
        classNumber: 12, chapterNumber: 14, subject: "Chemistry",
        syllabus: { cbse: false, jeemain: true, jeeadvanced: true }
    },
    // ================= MATHEMATICS CLASS 11 =================
    {
        name: "Sets",
        classNumber: 11, chapterNumber: 1, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Relations and Functions (Class 11)", // <--- RENAMED (Was duplicate)
        classNumber: 11, chapterNumber: 2, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Trigonometric Functions",
        classNumber: 11, chapterNumber: 3, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Complex Numbers and Quadratic Equations",
        classNumber: 11, chapterNumber: 4, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Linear Inequalities",
        classNumber: 11, chapterNumber: 5, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: false }
    },
    {
        name: "Permutations and Combinations",
        classNumber: 11, chapterNumber: 6, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Binomial Theorem",
        classNumber: 11, chapterNumber: 7, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Sequences and Series",
        classNumber: 11, chapterNumber: 8, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Straight Lines",
        classNumber: 11, chapterNumber: 9, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Conic Sections",
        classNumber: 11, chapterNumber: 10, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Introduction to Three Dimensional Geometry",
        classNumber: 11, chapterNumber: 11, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Limits and Derivatives",
        classNumber: 11, chapterNumber: 12, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Statistics",
        classNumber: 11, chapterNumber: 13, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Probability (Class 11)", // <--- RENAMED (Was duplicate)
        classNumber: 11, chapterNumber: 14, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Mathematical Reasoning",
        classNumber: 11, chapterNumber: 15, subject: "Mathematics",
        syllabus: { cbse: false, jeemain: false, jeeadvanced: false }
    },
    {
        name: "Principle of Mathematical Induction",
        classNumber: 11, chapterNumber: 16, subject: "Mathematics",
        syllabus: { cbse: false, jeemain: false, jeeadvanced: false }
    },
    // ================= MATHEMATICS CLASS 12 =================
    {
        name: "Relations and Functions (Class 12)", // <--- RENAMED (Was duplicate)
        classNumber: 12, chapterNumber: 1, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Inverse Trigonometric Functions",
        classNumber: 12, chapterNumber: 2, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Matrices",
        classNumber: 12, chapterNumber: 3, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Determinants",
        classNumber: 12, chapterNumber: 4, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Continuity and Differentiability",
        classNumber: 12, chapterNumber: 5, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Application of Derivatives",
        classNumber: 12, chapterNumber: 6, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Integrals",
        classNumber: 12, chapterNumber: 7, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Application of Integrals",
        classNumber: 12, chapterNumber: 8, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Differential Equations",
        classNumber: 12, chapterNumber: 9, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Vector Algebra",
        classNumber: 12, chapterNumber: 10, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Three Dimensional Geometry",
        classNumber: 12, chapterNumber: 11, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    },
    {
        name: "Linear Programming",
        classNumber: 12, chapterNumber: 12, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: false, jeeadvanced: false }
    },
    {
        name: "Probability (Class 12)", // <--- RENAMED (Was duplicate)
        classNumber: 12, chapterNumber: 13, subject: "Mathematics",
        syllabus: { cbse: true, jeemain: true, jeeadvanced: true }
    }
];
const seedChapters = async () => {
    console.log(`🌱 Starting to seed ${chaptersData.length} chapters...`);
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    for (const data of chaptersData) {
        try {
            await chapter_db_1.chapter.addingChapter({
                name: data.name,
                classNumber: data.classNumber,
                chapterNumber: data.chapterNumber,
                // 🚨 FIX: Cast the string to the SubjectName Enum
                subject: data.subject,
                // Pass the new boolean fields
                isCbse: data.syllabus.cbse,
                isJeeMain: data.syllabus.jeemain,
                isJeeAdvanced: data.syllabus.jeeadvanced
            });
            console.log(`✅ Added: ${data.name}`);
            successCount++;
        }
        catch (err) {
            if (err.message && err.message.includes("Unique constraint failed")) {
                console.log(`⚠️  Skipped (Already exists): ${data.name}`);
                skippedCount++;
            }
            else {
                console.error(`❌ Failed to add ${data.name}:`, err.message);
                errorCount++;
            }
        }
    }
    console.log("\n=================================");
    console.log(`🏁 Seeding Complete!`);
    console.log(`✅ Added: ${successCount}`);
    console.log(`⚠️  Skipped: ${skippedCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log("=================================\n");
};
exports.seedChapters = seedChapters;
(0, exports.seedChapters)();
