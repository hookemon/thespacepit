import type { Item } from "./types";

// First-run defaults. Editable in the settings drawer — persisted to localStorage.
// Bump ITEMS_KEY version in PantryClient.tsx when you change this so existing
// users get the new defaults.
export const SEED_ITEMS: Item[] = [
  // moto · fresh
  { id: "aguacate",        emoji: "🥑", name_es: "aguacate",        name_en: "avocado",        par: 3, current: 3, unit: "u",      source: "moto"  },
  { id: "pimenton",        emoji: "🫑", name_es: "pimentón",        name_en: "bell pepper",    par: 2, current: 2, unit: "u",      source: "moto"  },
  { id: "tomate-cherry",   emoji: "🍅", name_es: "tomate cherry",   name_en: "cherry tomato",  par: 1, current: 1, unit: "caja",   source: "moto"  },
  { id: "cebolla",         emoji: "🧅", name_es: "cebolla",         name_en: "onion",          par: 4, current: 4, unit: "u",      source: "moto"  },
  { id: "ajo",             emoji: "🧄", name_es: "ajo",             name_en: "garlic",         par: 1, current: 1, unit: "cabeza", source: "moto"  },
  { id: "jengibre",        emoji: "🫚", name_es: "jengibre",        name_en: "ginger",         par: 1, current: 1, unit: "raíz",   source: "moto"  },
  { id: "papas-criollas",  emoji: "🥔", name_es: "papas criollas",  name_en: "criolla potato", par: 2, current: 2, unit: "lb",     source: "moto"  },
  { id: "brocoli",         emoji: "🥦", name_es: "brócoli",         name_en: "broccoli",       par: 1, current: 1, unit: "u",      source: "moto"  },
  { id: "coliflor",        emoji: "🌼", name_es: "coliflor",        name_en: "cauliflower",    par: 1, current: 1, unit: "u",      source: "moto"  },
  { id: "calabaza",        emoji: "🎃", name_es: "calabaza",        name_en: "pumpkin",        par: 1, current: 1, unit: "u",      source: "moto"  },
  { id: "platano",         emoji: "🍌", name_es: "plátano",         name_en: "plantain",       par: 4, current: 4, unit: "u",      source: "moto"  },
  { id: "huevos",          emoji: "🥚", name_es: "huevos",          name_en: "eggs",           par: 30, current: 30, unit: "u",    source: "moto"  },
  { id: "papaya",          emoji: "🍈", name_es: "papaya",          name_en: "papaya",         par: 1, current: 1, unit: "u",      source: "moto"  },
  { id: "mango",           emoji: "🥭", name_es: "mango",           name_en: "mango",          par: 4, current: 4, unit: "u",      source: "moto"  },
  { id: "uchuva",          emoji: "🍊", name_es: "uchuva",          name_en: "cape gooseberry", par: 1, current: 1, unit: "lb",    source: "moto"  },
  { id: "fresa",           emoji: "🍓", name_es: "fresa",           name_en: "strawberry",     par: 1, current: 1, unit: "lb",     source: "moto"  },

  // store · pantry
  { id: "lentejas",        emoji: "🫘", name_es: "lentejas",        name_en: "lentils",        par: 1, current: 1, unit: "lb",     source: "store" },
  { id: "arroz",           emoji: "🍚", name_es: "arroz",           name_en: "rice",           par: 2, current: 2, unit: "lb",     source: "store" },
  { id: "pasta",           emoji: "🍝", name_es: "pasta",           name_en: "pasta",          par: 2, current: 2, unit: "paq",    source: "store" },
  { id: "garbanzos",       emoji: "🌰", name_es: "garbanzos",       name_en: "chickpeas",      par: 1, current: 1, unit: "lb",     source: "store" },
  { id: "frijoles-negros", emoji: "⚫", name_es: "frijoles negros", name_en: "black beans",    par: 1, current: 1, unit: "lb",     source: "store" },
  { id: "harina-choclo",   emoji: "🌽", name_es: "harina de choclo", name_en: "choclo flour",  par: 1, current: 1, unit: "lb",     source: "store" },
  { id: "harina-maiz",     emoji: "🫓", name_es: "harina de maíz",  name_en: "corn flour",     par: 1, current: 1, unit: "lb",     source: "store" },
  { id: "yucarina",        emoji: "🥥", name_es: "yucarina",        name_en: "yuca flour",     par: 1, current: 1, unit: "lb",     source: "store" },
  { id: "avena",           emoji: "🥣", name_es: "avena",           name_en: "oatmeal",        par: 1, current: 1, unit: "lb",     source: "store" },
];
