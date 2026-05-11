// Nick Hook's external production credits — releases on OTHER labels where
// he produced / co-produced / mixed / remixed / appeared. The C+C catalogue
// already lives at /releases; this is everything else.
//
// Sourced from Discogs (artist 2401021), then hand-curated. Add new credits
// alphabetically by year-desc, edit roles freely.

export type CreditRole = "Producer" | "Co-producer" | "Mixed by" | "Remix" | "Appearance" | "Co-exec producer";

export type ProductionCredit = {
  artist: string;
  title: string;
  year: number;
  role: CreditRole;
  label?: string;
  notes?: string;
  // External link to wherever the world can hear it
  url?: string;
};

// Newest first.
export const PRODUCTION_CREDITS: ProductionCredit[] = [
  // === RUN THE JEWELS ERA ===
  { artist: "Run The Jewels", title: "RTJ CU4TRO", year: 2023, role: "Co-exec producer", label: "BMG", notes: "Latin-American re-imagining of RTJ4." },
  { artist: "Run The Jewels", title: "Run The Jewels 4", year: 2020, role: "Producer", label: "Jewel Runners / BMG", notes: "Multiple production credits on the album." },
  { artist: "Run The Jewels", title: "Yankee And The Brave (Ep. 4)", year: 2020, role: "Appearance" },
  { artist: "What So Not × Run The Jewels", title: "Ju$T (feat. Pharrell + Zack de la Rocha)", year: 2021, role: "Appearance" },
  { artist: "Run The Jewels", title: "Meow The Jewels", year: 2015, role: "Remix" },
  { artist: "Run The Jewels", title: "Run The Jewels", year: 2013, role: "Appearance" },

  // === GOLD RECORDS / MAJOR SINGLES ===
  { artist: "Young Thug, A$AP Ferg, Freddie Gibbs", title: "Old English", year: 2014, role: "Producer", label: "Fool's Gold", notes: "💿 RIAA Gold." },
  { artist: "Young Thug, A$AP Ferg, Freddie Gibbs", title: "Old English (mix)", year: 2014, role: "Mixed by" },

  // === FEATURED ON / APPEARED ON ===
  { artist: "Junglepussy", title: "JP4", year: 2021, role: "Producer" },
  { artist: "Action Bronson", title: "Blue Chips 7000", year: 2018, role: "Appearance" },
  { artist: "Action Bronson", title: "Mr. Wonderful", year: 2015, role: "Appearance" },
  { artist: "Hudson Mohawke", title: "Rap Monument", year: 2015, role: "Mixed by" },
  { artist: "Zack de la Rocha", title: "Digging For Windows", year: 2016, role: "Appearance" },
  { artist: "Danny Brown", title: "Old", year: 2013, role: "Appearance" },
  { artist: "Flatbush Zombies", title: "BetterOffDead", year: 2023, role: "Mixed by" },
  { artist: "Mean Bacharach", title: "Sacrifice", year: 2024, role: "Appearance" },

  // === EARLY PRODUCTION CHOPS ===
  { artist: "L-Vis 1990", title: "Neon Dreams", year: 2011, role: "Co-producer", label: "Island / PMR Records", notes: "Produced 9 of 15 tracks on the debut album." },
  { artist: "Salva", title: "Peacemaker", year: 2014, role: "Producer" },
  { artist: "Nani Castle × Udachi", title: "The Amethyst Tape", year: 2015, role: "Producer" },

  // === REMIX WORK ===
  { artist: "New Age Doom × Lee 'Scratch' Perry", title: "Remix The Universe", year: 2022, role: "Remix" },
  { artist: "Cassius", title: "I ❤️ U So", year: 2011, role: "Remix" },
  { artist: "Busy P × DJ Mehdi", title: "Let The Children Techno", year: 2011, role: "Remix" },
  { artist: "Cardopusher / Nehuen", title: "Split 01", year: 2012, role: "Remix" },
  { artist: "Shuttle", title: "Halo", year: 2012, role: "Producer" },
];
