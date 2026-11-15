// Single primary category for each catalog indicator, keyed by immutable REF code.
// Taxonomy retains the approved eleven Wellness categories. Assignments are a
// curated MVP mapping and MUST NOT be used as medical/diagnostic interpretation.
export const ANALYSIS_CATEGORIES = [
  "Sangre",
  "Salud cerebral",
  "Salud digestiva",
  "Corazón y circulación",
  "Hormonas",
  "Inflamación",
  "Riñones",
  "Salud metabólica",
  "Vitaminas y nutrientes",
  "Estrés y energía",
  "Exposición y toxinas"
] as const;
const idsByCategory: readonly (readonly number[])[] = [
  [
    8,
    9,
    23,
    25,
    31,
    32,
    37,
    38,
    41,
    42,
    43,
    44,
    45,
    46,
    47,
    48,
    49,
    50,
    51,
    52,
    54,
    80,
    95,
    96,
    116,
    117,
    125
  ],
  [
    62,
    63,
    75,
    76,
    77,
    103,
    108,
    109,
    110
  ],
  [
    26,
    27,
    28,
    29,
    30,
    39,
    40,
    55,
    56,
    88
  ],
  [
    1,
    2,
    5,
    6,
    7,
    10,
    12,
    13,
    14,
    15,
    18,
    64,
    67,
    89,
    91,
    97,
    98,
    99,
    100,
    101,
    104,
    120
  ],
  [
    61,
    73,
    74,
    79,
    82,
    83,
    84,
    85,
    86,
    92,
    105,
    111,
    112,
    113,
    114,
    115,
    119,
    121,
    122,
    123,
    124
  ],
  [
    20,
    107
  ],
  [
    3,
    4,
    11,
    22,
    24,
    34,
    36,
    53,
    60,
    66,
    71,
    72,
    78
  ],
  [
    16,
    17,
    19,
    57,
    58,
    59,
    65,
    87,
    90,
    93,
    102
  ],
  [
    21,
    33,
    35,
    68,
    81,
    94,
    106,
    118,
    126,
    127,
    128
  ],
  [
    69,
    70
  ],
  []
];
const categoryMap = new Map<string,number>();
idsByCategory.forEach((ids,category)=>ids.forEach(id=>{
 const code="REF-"+String(id).padStart(3,"0");
 if(categoryMap.has(code))throw new Error("Categoría duplicada: "+code);
 categoryMap.set(code,category);
}));
export const categoryForCode=(code:string):number|null=>categoryMap.get(code)??null;
export const categoryForId=(id:number):number|null=>categoryForCode("REF-"+String(id).padStart(3,"0"));
export const CATEGORY_CODES=Object.freeze([...categoryMap.keys()]);
