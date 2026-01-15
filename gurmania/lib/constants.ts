// Skill levels
export const SKILL_LEVELS = [
  { value: 'BEGINNER', label: 'Početnik' },
  { value: 'INTERMEDIATE', label: 'Srednji' },
  { value: 'ADVANCED', label: 'Napredni' },
] as const;

// Dietary preferences
export const DIETARY_PREFERENCES = [
  'Vegan',
  'Vegetarijan',
  'Bez glutena',
  'Bez laktoze',
  'Keto',
  'Paleo',
  'Mediteranska',
  'Niskougljikohidratna',
  'Pescetarijan',
  'Halal',
  'Kosher',
] as const;

// Allergens
export const ALLERGENS = [
  'Orasi',
  'Kikiriki',
  'Gluten',
  'Laktoza',
  'Jaja',
  'Soja',
  'Riba',
  'Školjke',
  'Celeri',
  'Senf',
  'Sezam',
  'Sumporni dioksid',
  'Ljupin',
  'Mekušci',
] as const;

// Cuisine types
export const CUISINE_TYPES = [
  'Talijanska',
  'Francuska',
  'Japanska',
  'Kineska',
  'Tajlandska',
  'Indijska',
  'Meksička',
  'Španjolska',
  'Grčka',
  'Turska',
  'Libanonska',
  'Mediteranska',
  'Azijska',
  'Američka',
  'Brazilska',
  'Peruanska',
  'Korejska',
  'Vijetnamska',
  'Bliskoistočna',
  'Afrička',
  'Karipska',
  'Hrvatska',
  'Balkanska',
] as const;

// Difficulty levels for courses and lessons
export const DIFFICULTY_LEVELS = [
  { value: 'EASY', label: 'Lako' },
  { value: 'MEDIUM', label: 'Srednje' },
  { value: 'HARD', label: 'Teško' },
] as const;

// Measurement units for ingredients
export const MEASUREMENT_UNITS = [
  // Metric - Volume
  'ml',
  'l',
  'dl',
  
  // Metric - Weight
  'g',
  'kg',
  'mg',
  
  // Imperial - Volume
  'tsp',
  'tbsp',
  'cup',
  'fl oz',
  'pint',
  'quart',
  'gallon',
  
  // Imperial - Weight
  'oz',
  'lb',
  
  // Count/Pieces
  'kom',
  'komad',
  'komada',
  'žlica',
  'žličica',
  'šalica',
  'čaša',
  'prstohvat',
  'narezak',
  'režanj',
  'list',
  
  // Other
  'po ukusu',
] as const;
