import fetch from "node-fetch";

// --- TYPES ---

export type Subject = "Physics" | "Chemistry" | "Mathematics";

export interface Chapter {
  name: string;
  slug: string;
  description: string;
  keywords: string[]; // Enriched metadata for hybrid search
  isJeeMain: boolean;
  isJeeAdvanced: boolean;
  chapterNumber: number;
  class: 11 | 12;
}

export interface SyllabusGroup {
  group: string;
  subject: Subject;
  chapters: Chapter[];
}

// --- FULL ENRICHED DATA ---

export const SYLLABUS_DATA: SyllabusGroup[] = [

  // ================= PHYSICS =================
  {
    group: "Mechanics",
    subject: "Physics",
    chapters: [
      {
        name: "Motion in a Straight Line",
        slug: "motion-in-a-straight-line",
        description: "One dimensional motion, displacement, velocity, acceleration, equations of motion, graphs",
        keywords: ["rectilinear", "instantaneous velocity", "kinematics", "1d motion", "speed", "average velocity", "free fall"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 3,
        class: 11
      },
      {
        name: "Motion in a Plane",
        slug: "motion-in-a-plane",
        description: "Two dimensional motion, vectors, projectile motion, relative velocity, circular motion",
        keywords: ["vectors", "scalar", "projectile", "trajectory", "river boat", "rain man", "centripetal acceleration", "2d motion"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 4,
        class: 11
      },
      {
        name: "Laws of Motion",
        slug: "laws-of-motion",
        description: "Newton laws, force, inertia, momentum, friction, free body diagrams",
        keywords: ["newton's laws", "fbd", "friction", "tension", "pulley", "constraint motion", "impulse", "pseudo force", "banking of roads"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 5,
        class: 11
      },
      {
        name: "Work, Energy and Power",
        slug: "work-energy-power",
        description: "Work, kinetic energy, potential energy, power, work energy theorem",
        keywords: ["collision", "conservation of energy", "spring constant", "vertical circular motion", "coefficient of restitution", "elastic collision"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 6,
        class: 11
      },
      {
        name: "System of Particles and Rotational Motion",
        slug: "rotational-motion",
        description: "Centre of mass, torque, angular momentum, moment of inertia, rolling motion",
        keywords: ["torque", "inertia", "angular velocity", "rolling", "rigid body", "equilibrium", "com", "radius of gyration", "parallel axis theorem"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 7,
        class: 11
      },
      {
        name: "Gravitation",
        slug: "gravitation",
        description: "Gravitational force, field, potential, satellites, escape velocity",
        keywords: ["kepler's laws", "orbital velocity", "geostationary", "escape speed", "satellite", "g variation"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 8,
        class: 11
      },
      {
        name: "Oscillations",
        slug: "oscillations",
        description: "Simple harmonic motion, time period, energy in SHM, damped and forced Oscillations",
        keywords: ["shm", "simple harmonic motion", "pendulum", "spring block", "resonance", "damping", "phase"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 14,
        class: 11
      },
      {
        name: "Waves",
        slug: "waves",
        description: "Wave motion, sound Waves, Doppler effect, resonance",
        keywords: ["doppler effect", "standing waves", "beats", "organ pipes", "sound", "transverse", "longitudinal", "string waves"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 15,
        class: 11
      }
    ]
  },
  {
    group: "Thermodynamics (Physics)",
    subject: "Physics",
    chapters: [
      {
        name: "Thermal Properties of Matter",
        slug: "thermal-properties-of-matter",
        description: "Heat, temperature, thermal expansion, specific heat capacity, calorimetry, heat transfer",
        keywords: ["calorimetry", "conduction", "convection", "radiation", "stefan's law", "newton's law of cooling", "wien's displacement", "thermal expansion"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 11,
        class: 11
      },
      {
        name: "Thermodynamics (Physics)",
        slug: "thermodynamics-physics",
        description: "Thermal equilibrium, zeroth law, first law of thermodynamics, heat engines, refrigerators, second law, Carnot engine",
        keywords: ["carnot", "heat engine", "cp cv", "adiabatic", "isothermal", "work done", "first law", "entropy physics", "cyclic process"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 12,
        class: 11
      },
      {
        name: "Kinetic Theory",
        slug: "kinetic-theory",
        description: "Equation of state of a perfect gas, work done on compressing a gas, kinetic theory of gases, degrees of freedom",
        keywords: ["ktg", "rms speed", "degrees of freedom", "mean free path", "maxwell distribution", "law of equipartition"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 13,
        class: 11
      }
    ]
  },
  {
    group: "Electromagnetism",
    subject: "Physics",
    chapters: [
      {
        name: "Electric Charges and Fields",
        slug: "electric-charges-and-fields",
        description: "Electric charge, Coulomb law, electric field, Gauss law",
        keywords: ["coulomb's law", "dipole", "flux", "gauss theorem", "charge distribution", "field lines"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 1,
        class: 12
      },
      {
        name: "Electrostatic Potential and Capacitance",
        slug: "electrostatic-potential-and-capacitance",
        description: "Electric potential, capacitors, dielectrics, energy stored",
        keywords: ["capacitance", "dielectric", "equipotential", "potential energy", "parallel plate", "capacitor circuits"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 2,
        class: 12
      },
      {
        name: "Current Electricity",
        slug: "current-electricity",
        description: "Electric current, Ohm law, resistance, Kirchhoff laws",
        keywords: ["ohm's law", "kvl", "kcl", "kirchhoff", "wheatstone bridge", "potentiometer", "meter bridge", "drift velocity", "color code"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 3,
        class: 12
      },
      {
        name: "Moving Charges and Magnetism",
        slug: "moving-charges-and-magnetism",
        description: "Magnetic field, Lorentz force, Biot Savart law",
        keywords: ["biot savart", "ampere's law", "cyclotron", "solenoid", "toroid", "lorentz force", "galvanometer", "magnetic moment"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 4,
        class: 12
      },
      {
        name: "Magnetism and Matter",
        slug: "magnetism-and-matter",
        description: "Magnetic materials, bar magnet, earth magnetism",
        keywords: ["diamagnetic", "paramagnetic", "ferromagnetic", "hysteresis", "earth's magnetism", "dip angle", "magnetic susceptibility"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 5,
        class: 12
      },
      {
        name: "Electromagnetic Induction",
        slug: "electromagnetic-induction",
        description: "Faraday laws, induced emf, inductance",
        keywords: ["emi", "faraday's law", "lenz's law", "eddy currents", "self inductance", "mutual inductance", "motional emf"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 6,
        class: 12
      },
      {
        name: "Alternating Current",
        slug: "alternating-current",
        description: "AC circuits, impedance, resonance, transformers",
        keywords: ["lcr circuit", "resonance", "power factor", "rms value", "transformer", "phasor diagram", "wattless current"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 7,
        class: 12
      }
    ]
  },
  {
    group: "Optics",
    subject: "Physics",
    chapters: [
      {
        name: "Ray Optics and Optical Instruments",
        slug: "ray-optics",
        description: "Reflection, refraction, mirrors, lenses, optical instruments",
        keywords: ["prism", "telescope", "microscope", "total internal reflection", "tir", "lens maker formula", "snell's law", "mirror formula"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 9,
        class: 12
      },
      {
        name: "Wave Optics",
        slug: "wave-optics",
        description: "Interference, diffraction, polarization",
        keywords: ["ydse", "young's double slit", "diffraction", "polarization", "huygens principle", "brewster's law", "fringe width"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 10,
        class: 12
      }
    ]
  },
  {
    group: "Modern Physics",
    subject: "Physics",
    chapters: [
      {
        name: "Dual Nature of Radiation and Matter",
        slug: "dual-nature",
        description: "Photoelectric effect, de Broglie wavelength",
        keywords: ["photoelectric", "de broglie", "davisson germer", "work function", "stopping potential", "photons"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 11,
        class: 12
      },
      {
        name: "Atoms",
        slug: "atoms",
        description: "Bohr model, atomic spectra, energy levels",
        keywords: ["bohr model", "hydrogen spectrum", "lyman", "balmer", "paschen", "rydberg", "atomic structure physics"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 12,
        class: 12
      },
      {
        name: "Nuclei",
        slug: "nuclei",
        description: "Radioactivity, nuclear reactions, binding energy",
        keywords: ["radioactivity", "alpha beta gamma", "half life", "binding energy", "fission", "fusion", "mass defect", "decay constant"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 13,
        class: 12
      },
      {
        name: "Semiconductor Electronics",
        slug: "semiconductor-electronics",
        description: "Diodes, transistors, logic gates",
        keywords: ["pn junction", "diode", "transistor", "logic gates", "zener diode", "rectifier", "led", "solar cell", "and or not nand nor"],
        isJeeMain: true,
        isJeeAdvanced: false,
        chapterNumber: 14,
        class: 12
      }
    ]
  },

  // ================= CHEMISTRY =================
  {
    group: "Physical Chemistry",
    subject: "Chemistry",
    chapters: [
      {
        name: "Some Basic Concepts of Chemistry",
        slug: "some-basic-concepts-of-chemistry",
        description: "Mole concept, stoichiometry, laws of chemical combination, concentration terms",
        keywords: ["mole concept", "molarity", "molality", "normality", "stoichiometry", "limiting reagent", "empirical formula"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 1,
        class: 11
      },
      {
        name: "Structure of Atom",
        slug: "structure-of-atom",
        description: "Atomic models, quantum numbers, orbitals, electronic configuration",
        keywords: ["quantum numbers", "electronic configuration", "orbitals", "aufbau", "pauli exclusion", "hund's rule", "heisenberg", "schrodinger"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 2,
        class: 11
      },
      {
        name: "States of Matter (Gases & Liquids)",
        slug: "states-of-matter",
        description: "Gas laws, kinetic theory of gases, real gases, liquefaction",
        keywords: ["ideal gas", "van der waals", "compressibility factor", "boyle's law", "charles law", "dalton's law", "partial pressure"],
        isJeeMain: false,
        isJeeAdvanced: true,
        chapterNumber: 5,
        class: 11
      },
      {
        name: "Thermodynamics",
        slug: "thermodynamics-chemistry",
        description: "First law, enthalpy, entropy, Gibbs free energy, spontaneity",
        keywords: ["enthalpy", "entropy", "gibbs free energy", "hess law", "spontaneity", "exothermic", "endothermic", "thermochemistry", "bond energy"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 6,
        class: 11
      },
      {
        name: "Equilibrium",
        slug: "equilibrium",
        description: "Chemical equilibrium, ionic equilibrium, acids, bases, buffers",
        keywords: ["kp kc", "le chatelier", "ph calculation", "buffer solution", "solubility product", "ksp", "common ion effect", "hydrolysis", "ionic equilibrium"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 7,
        class: 11
      },
      {
        name: "Redox Reactions",
        slug: "redox-reactions",
        description: "Oxidation number, balancing redox equations, oxidizing and reducing agents",
        keywords: ["oxidation number", "balancing", "disproportionation", "titration", "redox titration", "n-factor", "equivalent weight"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 8,
        class: 11
      },
      {
        name: "The Solid State",
        slug: "solid-state",
        description: "Crystal lattices, unit cells, packing efficiency, defects in solids",
        keywords: ["unit cell", "fcc bcc scc", "packing fraction", "voids", "density of crystal", "bragg's law", "point defects", "schottky frenkel"],
        isJeeMain: false,
        isJeeAdvanced: true,
        chapterNumber: 1,
        class: 12
      },
      {
        name: "Solutions",
        slug: "solutions",
        description: "Types of solutions, concentration terms, colligative properties",
        keywords: ["colligative properties", "raoult's law", "vapour pressure", "osmotic pressure", "elevation in boiling point", "depression in freezing point", "vant hoff factor"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 2,
        class: 12
      },
      {
        name: "Electrochemistry",
        slug: "electrochemistry",
        description: "Electrochemical cells, EMF, Nernst equation, electrolysis",
        keywords: ["nernst equation", "galvanic cell", "electrolysis", "faraday's laws", "conductance", "kohlrausch law", "batteries", "fuel cell"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 3,
        class: 12
      },
      {
        name: "Chemical Kinetics",
        slug: "chemical-kinetics",
        description: "Rate laws, order of reaction, activation energy, Arrhenius equation",
        keywords: ["rate law", "order of reaction", "first order", "half life", "arrhenius", "activation energy", "molecularity", "collision theory"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 4,
        class: 12
      },
      {
        name: "Surface Chemistry",
        slug: "surface-chemistry",
        description: "Adsorption, catalysis, colloids, emulsions",
        keywords: ["adsorption", "colloids", "catalysis", "micelles", "freundlich", "langmuir", "emulsion", "coagulation", "gold number"],
        isJeeMain: false,
        isJeeAdvanced: true,
        chapterNumber: 5,
        class: 12
      }
    ]
  },
  {
    group: "Inorganic Chemistry",
    subject: "Chemistry",
    chapters: [
      {
        name: "Classification of Elements and Periodicity",
        slug: "periodic-classification",
        description: "Modern periodic table, periodic trends, atomic size, ionization energy",
        keywords: ["ionization energy", "electron affinity", "electronegativity", "atomic radius", "periodic trends", "screening effect", "effective nuclear charge"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 3,
        class: 11
      },
      {
        name: "Chemical Bonding and Molecular Structure",
        slug: "chemical-bonding",
        description: "Ionic and covalent bonding, VSEPR theory, hybridization, molecular geometry",
        keywords: ["hybridization", "vsepr", "molecular orbital theory", "mot", "hydrogen bonding", "dipole moment", "resonance", "bond order", "fajans rule"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 4,
        class: 11
      },
      {
        name: "Hydrogen",
        slug: "hydrogen",
        description: "Position of hydrogen, isotopes, preparation and properties",
        keywords: ["heavy water", "hydrogen peroxide", "hydrides", "hardness of water", "isotopes of hydrogen"],
        isJeeMain: false,
        isJeeAdvanced: true,
        chapterNumber: 9,
        class: 11
      },
      {
        name: "The s-Block Elements",
        slug: "s-block-elements",
        description: "Alkali and alkaline earth metals, trends, properties, uses",
        keywords: ["alkali metals", "alkaline earth", "flame test", "solubility trends", "anomalous properties", "cement", "sodium carbonate"],
        isJeeMain: false,
        isJeeAdvanced: true,
        chapterNumber: 10,
        class: 11
      },
      {
        name: "The p-Block Elements (Class 11)",
        slug: "p-block-elements-11",
        description: "Group 13 and 14 elements, trends, compounds",
        keywords: ["boron family", "carbon family", "diborane", "silicones", "silicates", "allotropes of carbon", "inert pair effect"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 11,
        class: 11
      },
      {
        name: "General Principles (Metallurgy)",
        slug: "metallurgy",
        description: "Extraction of metals, concentration of ores, refining",
        keywords: ["ores", "roasting", "calcination", "smelting", "froth floatation", "ellingham diagram", "zone refining", "blast furnace"],
        isJeeMain: false,
        isJeeAdvanced: true,
        chapterNumber: 6,
        class: 12
      },
      {
        name: "The d- and f- Block Elements",
        slug: "d-and-f-block-elements",
        description: "Transition metals, lanthanides, actinides, properties",
        keywords: ["transition elements", "lanthanoid contraction", "kmno4", "k2cr2o7", "oxidation states", "magnetic properties", "colour", "actinoids"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 8,
        class: 12
      },
      {
        name: "The p-Block Elements (Class 12)",
        slug: "p-block-elements-12",
        description: "Group 15 to 18 elements, oxides, halides, compounds",
        keywords: ["nitrogen family", "oxygen family", "halogens", "noble gases", "ammonia", "nitric acid", "sulphuric acid", "interhalogen", "phosphorus"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 7,
        class: 12
      },
      {
        name: "Coordination Compounds",
        slug: "coordination-compounds",
        description: "Werner theory, ligands, coordination number, isomerism",
        keywords: ["iupac naming", "ligands", "isomerism", "vbt", "cft", "crystal field theory", "splitting energy", "magnetic moment", "werner's theory"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 9,
        class: 12
      }
    ]
  },
  {
    group: "Organic Chemistry",
    subject: "Chemistry",
    chapters: [
      {
        name: "Organic Chemistry - Some Basic Principles",
        slug: "organic-chemistry-basics",
        description: "Nomenclature, reaction mechanisms, purification techniques",
        keywords: ["iupac", "isomerism", "resonance", "hyperconjugation", "inductive effect", "electromeric", "carbocation", "carbanion", "chromatography"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 12,
        class: 11
      },
      {
        name: "Hydrocarbons",
        slug: "hydrocarbons",
        description: "Alkanes, alkenes, alkynes, aromatic hydrocarbons",
        keywords: ["alkane", "alkene", "alkyne", "benzene", "markovnikov", "anti-markovnikov", "ozonolysis", "friedel crafts", "aromaticity"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 13,
        class: 11
      },
      {
        name: "Environmental Chemistry",
        slug: "environmental-chemistry",
        description: "Air pollution, water pollution, ozone depletion, green chemistry",
        keywords: ["pollution", "ozone layer", "greenhouse effect", "acid rain", "smog", "bod", "cod", "green chemistry"],
        isJeeMain: false,
        isJeeAdvanced: false,
        chapterNumber: 14,
        class: 11
      },
      {
        name: "Haloalkanes and Haloarenes",
        slug: "haloalkanes-haloarenes",
        description: "Preparation, reactions, SN1 and SN2 mechanisms",
        keywords: ["sn1", "sn2", "nucleophilic substitution", "elimination", "grignard", "optical isomerism", "chirality", "wurtz reaction", "sandmeyer"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 10,
        class: 12
      },
      {
        name: "Alcohols, Phenols and Ethers",
        slug: "alcohols-phenols-ethers",
        description: "Preparation, properties and reactions",
        keywords: ["lucas test", "reimer tiemann", "kolbe reaction", "williamson synthesis", "dehydration", "esterification", "phenol acidity"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 11,
        class: 12
      },
      {
        name: "Aldehydes, Ketones and Carboxylic Acids",
        slug: "aldehydes-ketones-carboxylic-acids",
        description: "Carbonyl compounds, reactions, tests",
        keywords: ["aldol condensation", "cannizzaro", "clemmensen", "wolff kishner", "hvb reaction", "tollens test", "fehling test", "nucleophilic addition"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 12,
        class: 12
      },
      {
        name: "Amines",
        slug: "amines",
        description: "Classification, preparation, reactions and basicity",
        keywords: ["hoffmann bromamide", "gabriel phthalimide", "diazonium salt", "carbylamine test", "hinsberg test", "basicity order", "coupling reaction"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 13,
        class: 12
      },
      {
        name: "Biomolecules",
        slug: "biomolecules",
        description: "Carbohydrates, proteins, nucleic acids, vitamins",
        keywords: ["glucose", "fructose", "amino acids", "proteins", "dna", "rna", "vitamins", "enzymes", "peptide bond", "denaturation"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 14,
        class: 12
      },
      {
        name: "Polymers",
        slug: "polymers",
        description: "Natural and synthetic polymers, polymerization reactions",
        keywords: ["addition polymer", "condensation polymer", "nylon", "bakelite", "rubber", "biodegradable", "vulcanization", "teflon"],
        isJeeMain: false,
        isJeeAdvanced: false,
        chapterNumber: 15,
        class: 12
      },
      {
        name: "Chemistry in Everyday Life",
        slug: "chemistry-in-everyday-life",
        description: "Drugs, detergents, food additives, soaps",
        keywords: ["analgesics", "antibiotics", "antiseptics", "soaps", "detergents", "preservatives", "artificial sweeteners", "tranquilizers"],
        isJeeMain: false,
        isJeeAdvanced: false,
        chapterNumber: 16,
        class: 12
      }
    ]
  },

  // ================= MATHEMATICS =================
  {
    group: "Algebra",
    subject: "Mathematics",
    chapters: [
      {
        name: "Sets",
        slug: "sets",
        description: "Sets, subsets, operations on sets, Venn diagrams",
        keywords: ["venn diagram", "union intersection", "power set", "roster form", "set builder", "complement", "types of sets"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 1,
        class: 11
      },
      {
        name: "Relations and Functions",
        slug: "relations-and-functions-11",
        description: "Relations, functions, domain, range, types of functions",
        keywords: ["domain", "range", "codomain", "cartesian product", "types of relations", "one-one", "onto", "mapping"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 2,
        class: 11
      },
      {
        name: "Complex Numbers and Quadratic Equations",
        slug: "complex-numbers-quadratic-equations",
        description: "Complex numbers, algebraic operations, quadratic equations",
        keywords: ["iota", "modulus", "argument", "polar form", "cube roots of unity", "omega", "conjugate", "discriminant", "roots of equation", "nature of roots"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 5,
        class: 11
      },
      {
        name: "Linear Inequalities",
        slug: "linear-inequalities",
        description: "Linear inequalities in one and two variables, solution regions",
        keywords: ["inequation", "graphical solution", "number line", "solution set", "optimization"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 6,
        class: 11
      },
      {
        name: "Permutations and Combinations",
        slug: "permutations-and-combinations",
        description: "Counting principle, permutations, combinations",
        keywords: ["pnc", "factorial", "arrangement", "selection", "circular permutation", "derangement", "rank of word", "multinomial"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 7,
        class: 11
      },
      {
        name: "Binomial Theorem",
        slug: "binomial-theorem",
        description: "Binomial expansion, general term, middle term",
        keywords: ["pascal's triangle", "general term", "coefficients", "middle term", "remainder problems", "expansion"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 8,
        class: 11
      },
      {
        name: "Sequences and Series",
        slug: "sequences-and-series",
        description: "Arithmetic and geometric progressions, special series",
        keywords: ["ap", "gp", "hp", "arithmetic mean", "geometric mean", "sum of n terms", "infinite gp", "agp", "special series"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 9,
        class: 11
      },
      {
        name: "Matrices",
        slug: "matrices",
        description: "Matrix operations, types of matrices, applications",
        keywords: ["matrix multiplication", "transpose", "symmetric", "skew symmetric", "inverse", "rank", "elementary operations", "orthogonal"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 3,
        class: 12
      },
      {
        name: "Determinants",
        slug: "determinants",
        description: "Determinants, properties, adjoint and inverse",
        keywords: ["cramer's rule", "properties of determinants", "adjoint", "inverse matrix", "system of equations", "consistency"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 4,
        class: 12
      },
      {
        name: "Mathematical Reasoning",
        slug: "mathematical-reasoning",
        description: "Statements, logical connectives, reasoning techniques",
        keywords: ["logic gates", "truth table", "tautology", "fallacy", "contradiction", "implication", "negation", "converse inverse"],
        isJeeMain: false,
        isJeeAdvanced: false,
        chapterNumber: 14,
        class: 11
      },
      {
        name: "Principle of Mathematical Induction",
        slug: "principle-of-mathematical-induction",
        description: "Proof techniques using mathematical induction",
        keywords: ["pmi", "induction step", "base case", "divisibility proofs", "summation proofs"],
        isJeeMain: false,
        isJeeAdvanced: false,
        chapterNumber: 4,
        class: 11
      }
    ]
  },
  {
    group: "Trigonometry",
    subject: "Mathematics",
    chapters: [
      {
        name: "Trigonometric Functions",
        slug: "trigonometric-functions",
        description: "Trigonometric ratios, identities, equations, graphs",
        keywords: ["sin cos tan", "allied angles", "compound angles", "transformation formulas", "trigonometric equations", "general solution", "principal solution", "graphs"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 3,
        class: 11
      },
      {
        name: "Inverse Trigonometric Functions",
        slug: "inverse-trigonometric-functions",
        description: "Inverse trigonometric functions, properties and graphs",
        keywords: ["itf", "inverse trig", "principal value", "domain range", "properties of itf", "summation of series"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 2,
        class: 12
      }
    ]
  },
  {
    group: "Coordinate Geometry",
    subject: "Mathematics",
    chapters: [
      {
        name: "Straight Lines",
        slug: "straight-lines",
        description: "Slope, equations of straight lines, angle between lines",
        keywords: ["slope", "intercept", "distance formula", "section formula", "family of lines", "angle bisector", "locus", "pair of straight lines"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 10,
        class: 11
      },
      {
        name: "Conic Sections",
        slug: "conic-sections",
        description: "Circle, parabola, ellipse, hyperbola",
        keywords: ["circle", "parabola", "ellipse", "hyperbola", "eccentricity", "tangent", "normal", "chord", "focus", "directrix"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 11,
        class: 11
      },
      {
        name: "Introduction to Three Dimensional Geometry",
        slug: "introduction-3d-geometry",
        description: "Coordinates in space, distance between points, lines and planes",
        keywords: ["3d coordinate", "octants", "distance formula 3d", "section formula 3d", "centroid"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 12,
        class: 11
      },
      {
        name: "Three Dimensional Geometry",
        slug: "three-dimensional-geometry",
        description: "Lines and planes in space, angles, distances",
        keywords: ["direction cosines", "drs", "equation of line", "equation of plane", "shortest distance", "skew lines", "angle between planes", "coplanarity"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 11,
        class: 12
      },
      {
        name: "Vector Algebra",
        slug: "vector-algebra",
        description: "Vectors, dot product, cross product, vector equations",
        keywords: ["dot product", "cross product", "scalar triple product", "vector triple product", "projection", "unit vector", "collinear"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 10,
        class: 12
      }
    ]
  },
  {
    group: "Calculus",
    subject: "Mathematics",
    chapters: [
      {
        name: "Limits and Derivatives",
        slug: "limits-and-derivatives",
        description: "Limits, derivatives, basic differentiation rules",
        keywords: ["limits", "l'hopital rule", "continuity", "first principle", "differentiation", "sandwich theorem", "standard limits"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 13,
        class: 11
      },
      {
        name: "Continuity and Differentiability",
        slug: "continuity-and-differentiability",
        description: "Continuity, differentiability, chain rule, derivatives",
        keywords: ["continuity check", "differentiability check", "chain rule", "implicit differentiation", "parametric form", "rolies theorem", "lmvt", "mean value theorem"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 5,
        class: 12
      },
      {
        name: "Application of Derivatives",
        slug: "application-of-derivatives",
        description: "Tangents, normals, maxima, minima, rate of change problems",
        keywords: ["aod", "tangent normal", "increasing decreasing", "monotonicity", "maxima minima", "rate measure", "approximation", "inflection point"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 6,
        class: 12
      },
      {
        name: "Integrals",
        slug: "integrals",
        description: "Indefinite and definite integrals, integration techniques",
        keywords: ["integration", "indefinite integral", "definite integral", "substitution", "by parts", "partial fractions", "king property", "queen property", "leibniz rule"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 7,
        class: 12
      },
      {
        name: "Application of Integrals",
        slug: "application-of-integrals",
        description: "Area under curves using definite integrals",
        keywords: ["aoi", "area under curve", "area between curves", "quadrature"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 8,
        class: 12
      },
      {
        name: "Differential Equations",
        slug: "differential-equations",
        description: "Formation, solution of differential equations, order and degree",
        keywords: ["order degree", "variable separable", "homogeneous", "linear differential equation", "integrating factor", "bernoulli", "formation of de"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 9,
        class: 12
      }
    ]
  },
  {
    group: "Statistics & Probability",
    subject: "Mathematics",
    chapters: [
      {
        name: "Statistics",
        slug: "statistics",
        description: "Mean, median, mode, variance, standard deviation",
        keywords: ["mean", "median", "mode", "variance", "standard deviation", "dispersion", "frequency distribution"],
        isJeeMain: true,
        isJeeAdvanced: false,
        chapterNumber: 15,
        class: 11
      },
      {
        name: "Probability (Class 11)",
        slug: "probability-11",
        description: "Basic probability concepts, events, outcomes, simple probability rules",
        keywords: ["sample space", "events", "mutually exclusive", "axiomatic probability", "addition theorem"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 16,
        class: 11
      },
      {
        name: "Probability (Class 12)",
        slug: "probability-12",
        description: "Conditional probability, Bayes theorem, random variables",
        keywords: ["conditional probability", "bayes theorem", "total probability", "random variable", "probability distribution", "bernoulli trials", "binomial distribution"],
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 13,
        class: 12
      }
    ]
  }
];