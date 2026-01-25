export type Subject = "Physics" | "Chemistry" | "Mathematics";

// 1. Updated Chapter Interface
export interface Chapter {
  name: string;
  slug: string;
  description: string;
  embedding?: number[];
  isJeeMain: boolean;
  isJeeAdvanced: boolean;
  chapterNumber: number; // New Field: NCERT Chapter Number
  class: 11 | 12;        // New Field: Class 11 or 12
}

// 2. Syllabus Group Interface
export interface SyllabusGroup {
  group: string;
  subject: Subject;
  chapters: Chapter[];
}

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
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 3,
        class: 11
      },
      {
        name: "Motion in a Plane",
        slug: "motion-in-a-plane",
        description: "Two dimensional motion, vectors, projectile motion, relative velocity, circular motion",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 4,
        class: 11
      },
      {
        name: "Laws of Motion",
        slug: "laws-of-motion",
        description: "Newton laws, force, inertia, momentum, friction, free body diagrams",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 5,
        class: 11
      },
      {
        name: "Work, Energy and Power",
        slug: "work-energy-power",
        description: "Work, kinetic energy, potential energy, power, work energy theorem",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 6,
        class: 11
      },
      {
        name: "System of Particles and Rotational Motion",
        slug: "rotational-motion",
        description: "Centre of mass, torque, angular momentum, moment of inertia, rolling motion",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 7,
        class: 11
      },
      {
        name: "Gravitation",
        slug: "gravitation",
        description: "Gravitational force, field, potential, satellites, escape velocity",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 8,
        class: 11
      },
      {
        name: "Oscillations",
        slug: "Oscillations",
        description: "Simple harmonic motion, time period, energy in SHM, damped and forced Oscillations",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 14,
        class: 11
      },
      {
        name: "Waves",
        slug: "Waves",
        description: "Wave motion, sound Waves, Doppler effect, resonance",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 15,
        class: 11
      }
    ]
  },
  {
    group: "Thermodynamics",
    subject: "Physics",
    chapters: [
      {
        name: "Thermal Properties of Matter",
        slug: "thermal-properties-of-matter",
        description: "Heat, temperature, thermal expansion, specific heat capacity, calorimetry, heat transfer",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 11,
        class: 11
      },
      {
        name: "Thermodynamics",
        slug: "thermodynamics-physics",
        description: "Thermal equilibrium, zeroth law, first law of thermodynamics, heat engines, refrigerators, second law, Carnot engine",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 12,
        class: 11
      },
      {
        name: "Kinetic Theory",
        slug: "kinetic-theory",
        description: "Equation of state of a perfect gas, work done on compressing a gas, kinetic theory of gases, degrees of freedom",
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
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 1,
        class: 12
      },
      {
        name: "Electrostatic Potential and Capacitance",
        slug: "electrostatic-potential-and-capacitance",
        description: "Electric potential, capacitors, dielectrics, energy stored",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 2,
        class: 12
      },
      {
        name: "Current Electricity",
        slug: "current-electricity",
        description: "Electric current, Ohm law, resistance, Kirchhoff laws",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 3,
        class: 12
      },
      {
        name: "Moving Charges and Magnetism",
        slug: "moving-charges-and-magnetism",
        description: "Magnetic field, Lorentz force, Biot Savart law",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 4,
        class: 12
      },
      {
        name: "Magnetism and Matter",
        slug: "magnetism-and-matter",
        description: "Magnetic materials, bar magnet, earth magnetism",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 5,
        class: 12
      },
      {
        name: "Electromagnetic Induction",
        slug: "electromagnetic-induction",
        description: "Faraday laws, induced emf, inductance",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 6,
        class: 12
      },
      {
        name: "Alternating Current",
        slug: "alternating-current",
        description: "AC circuits, impedance, resonance, transformers",
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
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 9,
        class: 12
      },
      {
        name: "Wave Optics",
        slug: "wave-optics",
        description: "Interference, diffraction, polarization",
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
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 11,
        class: 12
      },
      {
        name: "Atoms",
        slug: "atoms",
        description: "Bohr model, atomic spectra, energy levels",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 12,
        class: 12
      },
      {
        name: "Nuclei",
        slug: "nuclei",
        description: "Radioactivity, nuclear reactions, binding energy",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 13,
        class: 12
      },
      {
        name: "Semiconductor Electronics",
        slug: "semiconductor-electronics",
        description: "Diodes, transistors, logic gates",
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
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 1,
        class: 11
      },
      {
        name: "Structure of Atom",
        slug: "structure-of-atom",
        description: "Atomic models, quantum numbers, orbitals, electronic configuration",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 2,
        class: 11
      },
      {
        name: "States of Matter (Gases & Liquids)",
        slug: "states-of-matter",
        description: "Gas laws, kinetic theory of gases, real gases, liquefaction",
        isJeeMain: false,
        isJeeAdvanced: true,
        chapterNumber: 5,
        class: 11
      },
      {
        name: "Thermodynamics",
        slug: "thermodynamics-chemistry",
        description: "First law, enthalpy, entropy, Gibbs free energy, spontaneity",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 6,
        class: 11
      },
      {
        name: "Equilibrium",
        slug: "equilibrium",
        description: "Chemical equilibrium, ionic equilibrium, acids, bases, buffers",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 7,
        class: 11
      },
      {
        name: "Redox Reactions",
        slug: "redox-reactions",
        description: "Oxidation number, balancing redox equations, oxidizing and reducing agents",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 8,
        class: 11
      },
      {
        name: "The Solid State",
        slug: "solid-state",
        description: "Crystal lattices, unit cells, packing efficiency, defects in solids",
        isJeeMain: false,
        isJeeAdvanced: true,
        chapterNumber: 1,
        class: 12
      },
      {
        name: "Solutions",
        slug: "solutions",
        description: "Types of solutions, concentration terms, colligative properties",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 2,
        class: 12
      },
      {
        name: "Electrochemistry",
        slug: "electrochemistry",
        description: "Electrochemical cells, EMF, Nernst equation, electrolysis",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 3,
        class: 12
      },
      {
        name: "Chemical Kinetics",
        slug: "chemical-kinetics",
        description: "Rate laws, order of reaction, activation energy, Arrhenius equation",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 4,
        class: 12
      },
      {
        name: "Surface Chemistry",
        slug: "surface-chemistry",
        description: "Adsorption, catalysis, colloids, emulsions",
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
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 3,
        class: 11
      },
      {
        name: "Chemical Bonding and Molecular Structure",
        slug: "chemical-bonding",
        description: "Ionic and covalent bonding, VSEPR theory, hybridization, molecular geometry",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 4,
        class: 11
      },
      {
        name: "Hydrogen",
        slug: "hydrogen",
        description: "Position of hydrogen, isotopes, preparation and properties",
        isJeeMain: false,
        isJeeAdvanced: true,
        chapterNumber: 9,
        class: 11
      },
      {
        name: "The s-Block Elements",
        slug: "s-block-elements",
        description: "Alkali and alkaline earth metals, trends, properties, uses",
        isJeeMain: false,
        isJeeAdvanced: true,
        chapterNumber: 10,
        class: 11
      },
      {
        name: "The p-Block Elements (Class 11)",
        slug: "p-block-elements-11",
        description: "Group 13 and 14 elements, trends, compounds",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 11,
        class: 11
      },
      {
        name: "General Principles (Metallurgy)",
        slug: "metallurgy",
        description: "Extraction of metals, concentration of ores, refining",
        isJeeMain: false,
        isJeeAdvanced: true,
        chapterNumber: 6,
        class: 12
      },
      {
        name: "The d- and f- Block Elements",
        slug: "d-and-f-block-elements",
        description: "Transition metals, lanthanides, actinides, properties",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 8,
        class: 12
      },
      {
        name: "The p-Block Elements (Class 12)",
        slug: "p-block-elements-12",
        description: "Group 15 to 18 elements, oxides, halides, compounds",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 7,
        class: 12
      },
      {
        name: "Coordination Compounds",
        slug: "coordination-compounds",
        description: "Werner theory, ligands, coordination number, isomerism",
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
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 12,
        class: 11
      },
      {
        name: "Hydrocarbons",
        slug: "hydrocarbons",
        description: "Alkanes, alkenes, alkynes, aromatic hydrocarbons",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 13,
        class: 11
      },
      {
        name: "Environmental Chemistry",
        slug: "environmental-chemistry",
        description: "Air pollution, water pollution, ozone depletion, green chemistry",
        isJeeMain: false,
        isJeeAdvanced: false,
        chapterNumber: 14,
        class: 11
      },
      {
        name: "Haloalkanes and Haloarenes",
        slug: "haloalkanes-haloarenes",
        description: "Preparation, reactions, SN1 and SN2 mechanisms",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 10,
        class: 12
      },
      {
        name: "Alcohols, Phenols and Ethers",
        slug: "alcohols-phenols-ethers",
        description: "Preparation, properties and reactions",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 11,
        class: 12
      },
      {
        name: "Aldehydes, Ketones and Carboxylic Acids",
        slug: "aldehydes-ketones-carboxylic-acids",
        description: "Carbonyl compounds, reactions, tests",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 12,
        class: 12
      },
      {
        name: "Amines",
        slug: "amines",
        description: "Classification, preparation, reactions and basicity",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 13,
        class: 12
      },
      {
        name: "Biomolecules",
        slug: "biomolecules",
        description: "Carbohydrates, proteins, nucleic acids, vitamins",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 14,
        class: 12
      },
      {
        name: "Polymers",
        slug: "polymers",
        description: "Natural and synthetic polymers, polymerization reactions",
        isJeeMain: false,
        isJeeAdvanced: false,
        chapterNumber: 15,
        class: 12
      },
      {
        name: "Chemistry in Everyday Life",
        slug: "chemistry-in-everyday-life",
        description: "Drugs, detergents, food additives, soaps",
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
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 1,
        class: 11
      },
      {
        name: "Relations and Functions",
        slug: "relations-and-functions-11",
        description: "Relations, functions, domain, range, types of functions",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 2,
        class: 11
      },
      {
        name: "Complex Numbers and Quadratic Equations",
        slug: "complex-numbers-quadratic-equations",
        description: "Complex numbers, algebraic operations, quadratic equations",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 5,
        class: 11
      },
      {
        name: "Linear Inequalities",
        slug: "linear-inequalities",
        description: "Linear inequalities in one and two variables, solution regions",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 6,
        class: 11
      },
      {
        name: "Permutations and Combinations",
        slug: "permutations-and-combinations",
        description: "Counting principle, permutations, combinations",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 7,
        class: 11
      },
      {
        name: "Binomial Theorem",
        slug: "binomial-theorem",
        description: "Binomial expansion, general term, middle term",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 8,
        class: 11
      },
      {
        name: "Sequences and Series",
        slug: "sequences-and-series",
        description: "Arithmetic and geometric progressions, special series",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 9,
        class: 11
      },
      {
        name: "Matrices",
        slug: "matrices",
        description: "Matrix operations, types of matrices, applications",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 3,
        class: 12
      },
      {
        name: "Determinants",
        slug: "determinants",
        description: "Determinants, properties, adjoint and inverse",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 4,
        class: 12
      },
      {
        name: "Mathematical Reasoning",
        slug: "mathematical-reasoning",
        description: "Statements, logical connectives, reasoning techniques",
        isJeeMain: false,
        isJeeAdvanced: false,
        chapterNumber: 14,
        class: 11
      },
      {
        name: "Principle of Mathematical Induction",
        slug: "principle-of-mathematical-induction",
        description: "Proof techniques using mathematical induction",
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
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 3,
        class: 11
      },
      {
        name: "Inverse Trigonometric Functions",
        slug: "inverse-trigonometric-functions",
        description: "Inverse trigonometric functions, properties and graphs",
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
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 10,
        class: 11
      },
      {
        name: "Conic Sections",
        slug: "conic-sections",
        description: "Circle, parabola, ellipse, hyperbola",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 11,
        class: 11
      },
      {
        name: "Introduction to Three Dimensional Geometry",
        slug: "introduction-3d-geometry",
        description: "Coordinates in space, distance between points, lines and planes",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 12,
        class: 11
      },
      {
        name: "Three Dimensional Geometry",
        slug: "three-dimensional-geometry",
        description: "Lines and planes in space, angles, distances",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 11,
        class: 12
      },
      {
        name: "Vector Algebra",
        slug: "vector-algebra",
        description: "Vectors, dot product, cross product, vector equations",
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
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 13,
        class: 11
      },
      {
        name: "Continuity and Differentiability",
        slug: "continuity-and-differentiability",
        description: "Continuity, differentiability, chain rule, derivatives",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 5,
        class: 12
      },
      {
        name: "Application of Derivatives",
        slug: "application-of-derivatives",
        description: "Tangents, normals, maxima, minima, rate of change problems",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 6,
        class: 12
      },
      {
        name: "Integrals",
        slug: "integrals",
        description: "Indefinite and definite integrals, integration techniques",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 7,
        class: 12
      },
      {
        name: "Application of Integrals",
        slug: "application-of-integrals",
        description: "Area under curves using definite integrals",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 8,
        class: 12
      },
      {
        name: "Differential Equations",
        slug: "differential-equations",
        description: "Formation, solution of differential equations, order and degree",
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
        isJeeMain: true,
        isJeeAdvanced: false,
        chapterNumber: 15,
        class: 11
      },
      {
        name: "Probability (Class 11)",
        slug: "probability-11",
        description: "Basic probability concepts, events, outcomes, simple probability rules",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 16,
        class: 11
      },
      {
        name: "Probability (Class 12)",
        slug: "probability-12",
        description: "Conditional probability, Bayes theorem, random variables",
        isJeeMain: true,
        isJeeAdvanced: true,
        chapterNumber: 13,
        class: 12
      }
    ]
  }
];