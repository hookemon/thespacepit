/**
 * Press archive — Nick Hook batch 2.
 *
 * Layers in the long-tail of URLs the research agent surfaced after the first
 * import-press-urls.ts run: studio profile pieces (SonicScoop, MusicTech, Apogee,
 * Mixonline, Splice, Serato, DJBooth, 343 Labs, Rekkerd), the Without You /
 * Sirens / Collage v.1 chain, production-credit press for Old English / Rap
 * Monument / All Meow Life / Junglepussy "Spiders" / Azealia "Jumanji" /
 * Rashad-Machinedrum-Hook "Understand", Boiler Room sets, RA artist page,
 * MoMA PS1 Warm Up, Documentary Evidence Spiritual Friendship archive, the
 * full RTJ CU4TRO press wave (NME, Clash, Hypebeast, Consequence, Line of
 * Best Fit, PAN M 360, etc.).
 *
 * Same shape / stableId pattern as import-press-urls.ts and the CZ/MWC scripts.
 *
 * Run: `npx tsx scripts/import-press-urls-batch-2.ts`
 * Dry: `npx tsx scripts/import-press-urls-batch-2.ts --dry`
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { createHash } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const DRY = process.argv.includes("--dry");

type Item = {
  outlet: string;
  author?: string;
  quote: string;
  headline?: string;
  kind?: "review" | "interview" | "feature" | "profile" | "mention" | "list-inclusion" | "premiere";
  year?: number;
  date?: string;
  url?: string;
  relatedEraSlug?: string;
  relatedReleaseSlug?: string;
  featured?: boolean;
};

const ITEMS: Item[] = [
  // ──────────────────────────────────────────────────────────────────
  // STUDIO / CAREER PROFILE
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "SonicScoop",
    headline: "Recording Studio Sweet Spot: thespacepit (Greenpoint, Brooklyn)",
    quote: "SonicScoop's full studio walkthrough — gear, room design, philosophy, history.",
    kind: "feature",
    url: "https://sonicscoop.com/recording-studio-sweet-spot-thespacepit-greenpoint-brooklyn/",
  },
  {
    outlet: "Brooklyn Radio",
    headline: "Nick Hook Studio Tour for Scion AV",
    quote: "Brooklyn Radio's early Scion AV studio tour at thespacepit.",
    kind: "feature",
    url: "https://brooklynradio.com/nick-hook-studio-tour-for-scion-av/",
  },
  {
    outlet: "MusicTech",
    headline: "Nick Hook — artist hub",
    quote: "MusicTech's evergreen Nick Hook artist hub.",
    kind: "profile",
    url: "https://musictech.com/artists/nick-hook/",
  },
  {
    outlet: "MusicTech",
    headline: "The E-mu SP-1200: How one sampler ushered in a revolution",
    quote: "Hook quoted on Paul C and the SP-1200's place in hip-hop production history.",
    kind: "feature",
    url: "https://musictech.com/features/opinion-analysis/e-mu-sp-1200/",
  },
  {
    outlet: "Mix Online",
    headline: "Vengeance Sound's Avenger in the Sonic Kitchen with Nick Hook",
    quote: "Mix Online gear/process Q&A with Nick Hook on Vengeance Sound's Avenger.",
    kind: "interview",
    year: 2018,
    url: "https://www.mixonline.com/the-wire/vengeance-sound",
  },
  {
    outlet: "Apogee Electronics",
    headline: "Nick Hook — Traveling the World with Duet 2",
    quote: "Apogee's interview on touring with the Duet 2 interface.",
    kind: "interview",
    url: "https://apogeedigital.com/blog/nick-hook-traveling-the-world-with-duet-2-2",
  },
  {
    outlet: "Rekkerd",
    headline: "Eventide releases free sample pack by Nick Hook",
    quote: "Rekkerd covers the Eventide H3000 sample pack release.",
    kind: "mention",
    url: "https://rekkerd.org/eventide-releases-free-sample-pack-by-nick-hook/",
  },
  {
    outlet: "Rekkerd",
    headline: "Free Download: SP-1200 Sample Pack by Nick Hook at Reverb",
    quote: "Rekkerd covers the Reverb SP-1200 sample pack release.",
    kind: "mention",
    url: "https://rekkerd.org/free-download-sp-1200-sample-pack-by-nick-hook-at-reverb/",
  },
  {
    outlet: "Rekkerd",
    headline: "New samples by Dhruv Goel, Nick Hook, MeLo-X & TĀLĀ at Splice Sounds",
    quote: "Rekkerd covers the Splice 'Sounds from the Spacepit' pack drop.",
    kind: "mention",
    url: "https://rekkerd.org/new-samples-by-dhruv-goel-nick-hook-melo-x-tala-at-splice-sounds/",
  },
  {
    outlet: "Splice",
    headline: "Nick Hook: Sounds from the Spacepit",
    quote: "Splice editorial sample pack page — Sounds from the Spacepit.",
    kind: "feature",
    url: "https://splice.com/sounds/packs/splice/nick-hook-spacepit-sounds/samples",
  },
  {
    outlet: "Serato",
    headline: "Nick Hook / Hookemon / The Red Mamba on the DDJ-SX & Serato DJ",
    quote: "Serato's 2013 DJ tech feature with Nick Hook (aka Hookemon, The Red Mamba).",
    kind: "interview",
    year: 2013,
    url: "https://serato.com/latest/blog/16185/nick-hook-hookemon-the-red-mamba-on-the-ddj-sx-and-serato-dj",
  },
  {
    outlet: "Serato",
    headline: "Nick Hook — artist page",
    quote: "Serato's evergreen artist page for Nick Hook.",
    kind: "profile",
    url: "https://serato.com/artists/nick-hook",
  },
  {
    outlet: "DJBooth",
    headline: "Nick Hook Serato Vinyl Pressing [Video]",
    quote: "DJBooth covers the Collage v.1 vinyl pressing video from Serato.",
    kind: "feature",
    url: "https://djbooth.net/pro-audio/nick-hook-serato-vinyl-pressing-video",
    relatedReleaseSlug: "cc012-collage-v-1",
  },
  {
    outlet: "343 Labs",
    headline: "343 Labs Free NYC Masterclass — Nick Hook (RTJ CU4TRO)",
    quote: "343 Labs Ableton User Group masterclass — Nick Hook on RTJ CU4TRO production.",
    kind: "feature",
    url: "https://www.343labs.com/events/343-labs-ableton-user-group-open-house-8/",
    relatedReleaseSlug: "rtj-cu4tro-2023",
  },

  // ──────────────────────────────────────────────────────────────────
  // WITHOUT YOU EP / SIRENS / COLLAGE v.1 (2012–2014)
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "FACT Magazine",
    headline: "Download renaissance man Nick Hook's Without You EP",
    quote: "FACT publishes the Without You EP free download.",
    kind: "premiere",
    date: "2012-10-09",
    url: "https://www.factmag.com/2012/10/09/download-renaissance-man-nick-hooks-without-you-ep/",
  },
  {
    outlet: "FACT Magazine",
    headline: "Premiere another track from Azealia Banks and Hud Mo collaborator Nick Hook's Without You",
    quote: "FACT premieres a second single from the Without You EP.",
    kind: "premiere",
    date: "2012-10-05",
    url: "https://www.factmag.com/2012/10/05/111646/",
  },
  {
    outlet: "FACT Magazine",
    headline: "Stream Nick Hook's 'Medium Rare' — collaboration with Machinedrum",
    quote: "FACT streams 'Medium Rare,' a Nick Hook × Machinedrum collab from the forthcoming EP.",
    kind: "premiere",
    date: "2012-10-03",
    url: "https://www.factmag.com/2012/10/03/stream-nick-hooks-medium-rare-a-collaboration-with-machinedrum-from-his-forthcoming-ep/",
  },
  {
    outlet: "Okayplayer",
    headline: "Okayfuture: Nick Hook — Without You [EP Download]",
    quote: "Okayplayer covers the Without You EP free download.",
    kind: "feature",
    url: "https://www.okayplayer.com/news/nick-hook-without-you-ep-download.html",
  },
  {
    outlet: "Brooklyn Radio",
    headline: "Nick Hook — Without You",
    quote: "Brooklyn Radio's Without You EP coverage.",
    kind: "feature",
    url: "http://brooklynradio.com/nick-hook-without-you/",
  },
  {
    outlet: "The FADER",
    headline: "Video: Nick Hook ft. El-P and Rood — \"Sirens\"",
    quote: "FADER premieres the 'Sirens' music video featuring El-P and Rood.",
    kind: "premiere",
    date: "2012-12-03",
    url: "https://www.thefader.com/2012/12/03/video-nick-hook-f-el-p-and-rood-sirens",
  },
  {
    outlet: "XLR8R",
    headline: "Video: Nick Hook — \"Sirens (with El-P and Rood)\"",
    quote: "XLR8R posts the 'Sirens' music video.",
    kind: "premiere",
    url: "https://xlr8r.com/news/video-nick-hook-sirens-with-el-p-and-rood/",
  },
  {
    outlet: "Complex",
    headline: "Video: Nick Hook ft. EL-P & Rood — \"Sirens\"",
    quote: "Complex premieres the 'Sirens' music video.",
    kind: "premiere",
    url: "https://www.complex.com/music/a/erich-donaldson/video-nick-hook-f-el-p-rood-sirens",
  },
  {
    outlet: "Okayplayer",
    headline: "Okayfuture Video: Nick Hook x El-P x Rood — \"Sirens\"",
    quote: "Okayplayer posts the 'Sirens' video.",
    kind: "premiere",
    url: "https://www.okayplayer.com/news/okayfuture-video-nick-hook-x-el-p-x-rood-sirens.html",
  },
  {
    outlet: "Potholes In My Blog",
    headline: "Nick Hook — \"Sirens\" feat. El-P & Rood [Video]",
    quote: "Potholes In My Blog premieres the 'Sirens' video.",
    kind: "premiere",
    url: "http://potholesinmyblog.com/nick-hook-sirens-f-el-p-rood-video/",
  },
  {
    outlet: "UGSMAG",
    headline: "Nick Hook — \"Sirens\" feat. El-P and Rood",
    quote: "UGSMAG premieres 'Sirens.'",
    kind: "premiere",
    url: "https://ugsmag.com/nick-hook-sirens-feat-el-p-and-rood/",
  },
  {
    outlet: "Rugged Ones",
    headline: "El-P & Nick Hook — Using Outboard Effects & Sound Manipulation w/ CONS Project",
    quote: "Coverage of the El-P × Nick Hook CONS Project workshop on outboard effects.",
    kind: "feature",
    date: "2014-04-02",
    url: "https://ruggedones.wordpress.com/2014/04/02/el-p-nick-hook-using-outboard-effects-sound-manipulation-w-cons-project-video/",
  },
  {
    outlet: "The FADER",
    headline: "Photos: CONS Project in Brooklyn with El-P and Nick Hook",
    quote: "FADER photo essay from the CONS Project Brooklyn workshop.",
    kind: "feature",
    date: "2014-01-13",
    url: "http://www.thefader.com/2014/01/13/photos-cons-project-in-brooklyn-with-el-p-and-nick-hook",
  },
  {
    outlet: "FACT Magazine",
    headline: "Hear 'Jaco' — Nick Hook's collaboration with Todd Edwards and Kilo Kish",
    quote: "FACT premieres 'Jaco' — Nick Hook × Todd Edwards × Kilo Kish, from Collage v.1.",
    kind: "premiere",
    date: "2014-11-29",
    url: "https://www.factmag.com/2014/11/29/hear-jaco-nick-hooks-uplifting-collaboration-with-todd-edwards-and-kilo-kish/",
    relatedReleaseSlug: "cc012-collage-v-1",
  },
  {
    outlet: "Complex",
    headline: "Nick Hook and Todd Edwards ft. Kilo Kish — \"Jaco\"",
    quote: "Complex premieres 'Jaco' from Collage v.1.",
    kind: "premiere",
    url: "https://www.complex.com/music/a/marcusd4d6dc4c07/nick-hook-and-todd-edwards-ft-kilo-kish-jaco",
    relatedReleaseSlug: "cc012-collage-v-1",
  },
  {
    outlet: "FACT Magazine",
    headline: "Let's Jam — Nick Hook and Egyptian Lover \"J.A.M.I.T\" for Serato and Ninja Tune's Collage v.1 EP",
    quote: "FACT premieres the Egyptian Lover collaboration from Collage v.1.",
    kind: "premiere",
    date: "2014-11-22",
    url: "https://www.factmag.com/2014/11/22/lets-jam-nick-hook-and-egyptian-lover-j-a-m-i-t-for-serato-and-ninja-tune-collage-v-1-ep/",
    relatedReleaseSlug: "cc012-collage-v-1",
  },
  {
    outlet: "Ninja Tune",
    headline: "Collage v.1 — Nick Hook (Ninja Tune release page)",
    quote: "Official Ninja Tune label release page for Collage v.1.",
    kind: "profile",
    url: "https://ninjatune.net/release/nick-hook/collage-v-1",
    relatedReleaseSlug: "cc012-collage-v-1",
  },
  {
    outlet: "NEST HQ",
    headline: "Nick Hook Teams Up with Ninja Tune & Serato for an EP of Collabs",
    quote: "NEST HQ feature on the Collage v.1 collaboration EP.",
    kind: "feature",
    url: "https://nesthq.com/nick-hook-jaco-collage/",
    relatedReleaseSlug: "cc012-collage-v-1",
  },

  // ──────────────────────────────────────────────────────────────────
  // RBMA / RED BULL ERA — 2011–2014
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "RBMA Daily",
    headline: "Raising Cain: Nick Hook's troublemaking countdown",
    quote: "RBMA alumni YouTube playlist by Nick Hook.",
    kind: "feature",
    date: "2011-11-01",
    url: "https://daily.redbullmusicacademy.com/2011/11/nick_hook_youtube_playlist/",
    relatedEraSlug: "red-bull-rbma",
  },
  {
    outlet: "VICE / Noisey",
    headline: "Red Bull Music Academy Mix Series Vol. 3: Nick Hook",
    quote: "Vice/Noisey's RBMA Mix Series Vol. 3 profile of Nick Hook.",
    kind: "feature",
    url: "https://www.vice.com/en/article/8q7k33/red-bull-music-academy-mix-series-vol-3-nick-hook",
    relatedEraSlug: "red-bull-rbma",
  },
  {
    outlet: "XLR8R",
    headline: "Hi, Doctor Nick! — author archive",
    quote: "XLR8R landing page for Nick Hook's recurring 'Hi, Doctor Nick!' advice column.",
    kind: "profile",
    url: "https://xlr8r.com/author/nick-hook/",
  },
  {
    outlet: "Complex",
    headline: "10 Things We Learned From Baauer and Nick Hook's Reddit AMA",
    quote: "Complex recap of the Baauer × Nick Hook Reddit AMA.",
    kind: "feature",
    date: "2014-11-01",
    url: "https://www.complex.com/music/2014/11/baauer-nick-hook-reddit-ama/",
  },
  {
    outlet: "Complex",
    headline: "Red Bull Followed Baauer and Nick Hook Around the World as They Went \"Searching For Sound\"",
    quote: "Complex covers the Searching For Sound documentary.",
    kind: "feature",
    url: "https://www.complex.com/music/a/khrisd/baauer-searching-for-sound-red-bull-documentary",
  },
  {
    outlet: "IMDb",
    headline: "Baauer: Searching for Sound",
    quote: "IMDb page for the Searching for Sound documentary.",
    kind: "profile",
    url: "https://www.imdb.com/title/tt4206856/",
  },
  {
    outlet: "Ableton",
    headline: "Baauer video documentary & sample pack",
    quote: "Ableton blog covers the Searching for Sound doc + sample pack release.",
    kind: "feature",
    url: "https://www.ableton.com/en/blog/baauer-searching-for-sound-samples/",
  },
  {
    outlet: "Ableton",
    headline: "Push at Sónar — with Jamie Lidell, Nick Hook, Le K and more",
    quote: "Ableton's Sónar Push showcase featuring Nick Hook.",
    kind: "feature",
    url: "https://www.ableton.com/en/blog/push-sonar-jamie-lidell-nick-hook-le-k-and-more/",
    relatedEraSlug: "s-nar",
  },
  {
    outlet: "Ableton",
    headline: "Ableton Artist Showcase during NAMM",
    quote: "Ableton's NAMM artist showcase featuring Nick Hook + Beats Antique, Nosaj Thing, Archie Pelago.",
    kind: "feature",
    url: "https://www.ableton.com/en/blog/ableton-artist-showcase-namm-featuring-nosaj-thing-beats-antique-archie-pelago-more/",
  },
  {
    outlet: "Ableton",
    headline: "Rhythm Roundup: Five Inspired Sample Flips",
    quote: "Ableton blog roundup featuring Nick Hook's sample flip work.",
    kind: "feature",
    url: "https://www.ableton.com/en/blog/rhythm-roundup-five-inspired-sample-flips/",
  },

  // ──────────────────────────────────────────────────────────────────
  // PRODUCTION CREDITS — Azealia "Jumanji" (2012)
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "Stereogum",
    headline: "Azealia Banks — \"Jumanji\"",
    quote: "Stereogum premieres 'Jumanji' produced by Hudson Mohawke and Nick Hook.",
    kind: "premiere",
    year: 2012,
    url: "https://www.stereogum.com/1029251/azealia-banks-jumanji/news/",
  },
  {
    outlet: "FACT Magazine",
    headline: "Stream Azealia Banks' 'Jumanji' — produced by Hudson Mohawke and Nick Hook",
    quote: "FACT streams Azealia Banks' 'Jumanji' — Hudson Mohawke + Nick Hook production.",
    kind: "premiere",
    date: "2012-05-11",
    url: "https://www.factmag.com/2012/05/11/stream-azealia-banks-jumanji/",
  },
  {
    outlet: "self-titled",
    headline: "DOWNLOAD THIS NOW: Azealia Banks, \"Jumanji\"",
    quote: "self-titled premieres 'Jumanji' produced by Hudson Mohawke + Nick Hook.",
    kind: "premiere",
    date: "2012-05-11",
    url: "http://www.self-titledmag.com/2012/05/11/download-this-now-azealia-banks-jumanji-produced-by-hudson-mohawke-nick-hook/",
  },
  {
    outlet: "self-titled",
    headline: "LISTEN: Azealia Banks' Mermaid Ball Mixtape (incl. Nick Hook tracks)",
    quote: "self-titled covers the Mermaid Ball Mixtape — features Nick Hook production.",
    kind: "feature",
    url: "https://www.self-titledmag.com/listen-azealia-banks-mermaid-ball-mixtape-f-crystal-waters-tnght-machinedrum-nick-hook-more/",
  },
  {
    outlet: "HotNewHipHop",
    headline: "Azealia Banks — \"Jumanji\" (Prod. Hudson Mohawke & Nick Hook)",
    quote: "HotNewHipHop premieres 'Jumanji.'",
    kind: "premiere",
    url: "https://www.hotnewhiphop.com/azealia-banks-jumanji-prod-by-hudson-mohawke-and-nick-hook-song.818973.html",
  },
  {
    outlet: "Nialler9",
    headline: "Azealia Banks — \"Jumanji\"",
    quote: "Nialler9 premieres 'Jumanji.'",
    kind: "premiere",
    url: "https://nialler9.com/azealia-banks-jumanji-feat-production-hudson-mohawke-nick-hook/",
  },
  {
    outlet: "The Astral Plane",
    headline: "Azealia Banks — \"Jumanji\" (Prod. Hudson Mohawke & Nick Hook)",
    quote: "The Astral Plane premieres 'Jumanji.'",
    kind: "premiere",
    date: "2012-05-14",
    url: "https://dotheastralplane.com/2012/05/14/new-azealia-banks-jumanji-prod-hudson-mohawke-nick-hook/",
  },
  {
    outlet: "The FADER",
    headline: "Download Azealia Banks' Fantasea Mixtape",
    quote: "FADER covers the Fantasea Mixtape (includes Hook-produced 'Jumanji').",
    kind: "mention",
    date: "2012-07-11",
    url: "https://www.thefader.com/2012/07/11/download-azealia-banks-fantasea-mixtape",
  },

  // ──────────────────────────────────────────────────────────────────
  // PRODUCTION CREDITS — Old English (2014)
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "Complex",
    headline: "Young Thug, Freddie Gibbs & A$AP Ferg — \"Old English\" (Prod. Salva & Nick Hook)",
    quote: "Complex premieres 'Old English' produced by Salva and Nick Hook.",
    kind: "premiere",
    url: "https://www.complex.com/music/a/khrisd/young-thug-freddie-gibbs-aap-ferg-old-english-prod-salva-nick-hook",
    relatedReleaseSlug: "old-english-2014",
  },
  {
    outlet: "AllHipHop",
    headline: "Producers Salva & Nick Hook Discuss \"Old English\"",
    quote: "AllHipHop interview with Salva + Nick Hook on producing 'Old English.'",
    kind: "interview",
    url: "https://allhiphop.com/features/producers-salva-nick-hook-discuss-old-english-feat-young-thug-freddie-gibbs-aap-ferg-other-projects/",
    relatedReleaseSlug: "old-english-2014",
  },
  {
    outlet: "HotNewHipHop",
    headline: "Young Thug, A$AP Ferg & Freddie Gibbs Poured Out \"Old English\" Over A Salva Beat",
    quote: "HotNewHipHop's coverage of the 'Old English' release.",
    kind: "feature",
    url: "https://www.hotnewhiphop.com/190094-young-thug-asap-ferg-and-freddie-gibbs-poured-out-old-english-over-a-salva-beat-new-song",
    relatedReleaseSlug: "old-english-2014",
  },
  {
    outlet: "EARMILK",
    headline: "Young Thug, Freddie Gibbs and A$AP Ferg's \"Old English\" gets dope visual",
    quote: "EARMILK covers the 'Old English' music video.",
    kind: "premiere",
    date: "2015-01-12",
    url: "https://earmilk.com/2015/01/12/young-thug-freddie-gibbs-and-aap-fergs-old-english-gets-dope-visual/",
    relatedReleaseSlug: "old-english-2014",
  },
  {
    outlet: "The Come Up Show",
    headline: "Young Thug ft. Freddie Gibbs & A$AP Ferg — \"Old English\"",
    quote: "The Come Up Show post for 'Old English.'",
    kind: "premiere",
    date: "2014-06-30",
    url: "http://www.thecomeupshow.com/2014/06/30/audio-young-thug-ft-freddie-gibbs-aap-ferg-old-english-prod-salva-nick-hook/",
    relatedReleaseSlug: "old-english-2014",
  },

  // ──────────────────────────────────────────────────────────────────
  // PRODUCTION CREDITS — Rap Monument (2014)
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "Noisey / VICE",
    headline: "Noisey Is Proud to Introduce The Rap Monument",
    quote: "Noisey announces The Rap Monument — Hudson Mohawke + Nick Hook + S-Type co-produced 42-min epic.",
    kind: "premiere",
    url: "https://www.vice.com/en/article/6azwdk/noisey-is-proud-to-introduce-the-rap-monument",
    relatedReleaseSlug: "rap-monument-2015",
  },
  {
    outlet: "NEST HQ",
    headline: "HudMo, Nick Hook, & S-Type Produce 42-Minute Project \"The Rap Monument\"",
    quote: "NEST HQ feature on The Rap Monument production.",
    kind: "feature",
    url: "https://nesthq.com/the-rap-monument/",
    relatedReleaseSlug: "rap-monument-2015",
  },
  {
    outlet: "Okayplayer",
    headline: "Pusha T, Danny Brown, Action Bronson, Flatbush Zombies & More Black Out On \"The Rap Monument\"",
    quote: "Okayplayer's coverage of The Rap Monument.",
    kind: "feature",
    url: "https://www.okayplayer.com/news/pusha-t-danny-brown-bronson-zombies-the-rap-monument-mp3.html",
    relatedReleaseSlug: "rap-monument-2015",
  },
  {
    outlet: "Run The Trap",
    headline: "HudMo + S-Type + 30 Rappers = \"The Rap Monument\"",
    quote: "Run The Trap covers the Rap Monument release.",
    kind: "feature",
    date: "2014-12-03",
    url: "https://runthetrap.com/2014/12/03/hudmo-s-type-30-rappers-rap-monument/",
    relatedReleaseSlug: "rap-monument-2015",
  },
  {
    outlet: "Elevator Mag",
    headline: "Hudson Mohawke FINALLY Releases Dirty Version Of Noisey's \"Rap Monument\"",
    quote: "Elevator Mag covers the dirty/uncensored Rap Monument release.",
    kind: "feature",
    url: "https://www.elevatormag.com/hudson-mohawke-finally-releases-dirty-version-of-noiseys-rap-monument",
    relatedReleaseSlug: "rap-monument-2015",
  },
  {
    outlet: "OnSMASH",
    headline: "Flatbush Zombies Record \"The Rap Monument\" Verses",
    quote: "OnSMASH covers Flatbush Zombies' Rap Monument session.",
    kind: "feature",
    url: "http://onsmash.com/music/flatbush-zombies-record-the-rap-monument-verses/",
    relatedReleaseSlug: "rap-monument-2015",
  },

  // ──────────────────────────────────────────────────────────────────
  // PRODUCTION CREDITS — Run The Jewels "All Meow Life" (Meow The Jewels, 2015)
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "BrooklynVegan",
    headline: "Run the Jewels make the ultimate internet cat supercut with \"All Meow Life\" video",
    quote: "BrooklynVegan covers the All Meow Life cat-supercut video (Nick Hook edit).",
    kind: "feature",
    url: "https://www.brooklynvegan.com/run-the-jewels-17/",
    relatedReleaseSlug: "meow-the-jewels-2015",
  },
  {
    outlet: "DIY Magazine",
    headline: "Run The Jewels stitch together cat gifs for 'All Meow Life (Nick Hook edit)' video",
    quote: "DIY Magazine covers the All Meow Life Nick Hook edit video.",
    kind: "feature",
    date: "2015-11-05",
    url: "https://diymag.com/2015/11/05/run-the-jewels-stitch-together-cat-gifs-for-all-meow-life-nick-hook-edit-video",
    relatedReleaseSlug: "meow-the-jewels-2015",
  },
  {
    outlet: "Consequence",
    headline: "Run the Jewels share the insanely cat-tastic new video for \"All Meow Life\"",
    quote: "Consequence covers the All Meow Life video.",
    kind: "feature",
    year: 2015,
    url: "https://consequence.net/2015/11/run-the-jewels-share-the-insanely-cat-tastic-new-video-for-all-meow-life-watch/",
    relatedReleaseSlug: "meow-the-jewels-2015",
  },
  {
    outlet: "Okayplayer",
    headline: "Meow The Jewels — \"All Meow Life (Nick Hook Remix)\" [Official Video]",
    quote: "Okayplayer posts the All Meow Life Nick Hook remix video.",
    kind: "premiere",
    url: "https://www.okayplayer.com/news/meow-the-jewels-all-meow-life-nick-hook-remix-video.html",
    relatedReleaseSlug: "meow-the-jewels-2015",
  },
  {
    outlet: "2DOPEBOYZ",
    headline: "Run The Jewels — \"All Meow Life (Nick Hook Remix)\" (Video)",
    quote: "2 Dope Boyz covers the All Meow Life Nick Hook remix video.",
    kind: "premiere",
    date: "2015-11-04",
    url: "https://2dopeboyz.com/2015/11/04/run-the-jewels-all-meow-life-nick-hook-remix-video/",
    relatedReleaseSlug: "meow-the-jewels-2015",
  },
  {
    outlet: "Bringing Down The Band",
    headline: "Run the Jewels — \"All Meow Life\" (Nick Hook Remix)",
    quote: "Bringing Down The Band covers the All Meow Life Nick Hook remix.",
    kind: "premiere",
    url: "https://bringingdowntheband.com/run-the-jewels-all-meow-life-nick-hook-runthejewels-nickhook/",
    relatedReleaseSlug: "meow-the-jewels-2015",
  },
  {
    outlet: "Okayplayer",
    headline: "Zack De La Rocha Shares Debut Solo Single 'Digging For Windows' (prod. El-P)",
    quote: "Okayplayer covers Zack De La Rocha's solo single — Hook on additional keys.",
    kind: "premiere",
    url: "https://www.okayplayer.com/zack-de-la-rocha-shares-debut-solo-single-digging-for-windows-prod-el-p/595685",
  },
  {
    outlet: "Stereogum",
    headline: "DJ Rashad, Nick Hook, & Machinedrum — \"Understand\"",
    quote: "Stereogum premieres 'Understand' — DJ Rashad × Nick Hook × Machinedrum.",
    kind: "premiere",
    year: 2015,
    url: "https://www.stereogum.com/1796080/dj-rashad-nick-hook-machinedrum-understand/news/",
  },
  {
    outlet: "Hypebeast",
    headline: "DJ Rashad, Nick Hook & Machinedrum — \"Understand\"",
    quote: "Hypebeast posts 'Understand.'",
    kind: "premiere",
    year: 2015,
    url: "https://hypebeast.com/2015/4/dj-rashad-nick-hook-machinedrum-understand",
  },

  // ──────────────────────────────────────────────────────────────────
  // RELATIONSHIPS LP — additions
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "FACT Magazine",
    headline: "Nick Hook releases Relationships featuring Novelist, Hudson Mohawke",
    quote: "FACT covers the Relationships LP release on Fool's Gold.",
    kind: "review",
    date: "2016-11-01",
    url: "https://www.factmag.com/2016/11/01/nick-hook-relationships-fools-gold/",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "The FADER",
    headline: "Listen To Nick Hook's Debut Full-Length Album, Relationships",
    quote: "FADER stream-out for the Relationships LP.",
    kind: "feature",
    date: "2016-11-01",
    url: "http://www.thefader.com/2016/11/01/nick-hook-relationships-stream",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "VICE",
    headline: "Nick Hook Shares Debut Album Featuring HudMo, DJ Rashad, Novelist",
    quote: "VICE's Relationships album-stream coverage.",
    kind: "feature",
    url: "https://www.vice.com/en/article/nick-hook-album-relationships-stream/",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "Complex",
    headline: "Premiere: Nick Hook Drops \"Gucci's\" Featuring 24hrs, Talks New Album 'Relationships'",
    quote: "Complex premieres 'Gucci's' + interview on the Relationships LP.",
    kind: "interview",
    url: "https://www.complex.com/music/a/jacob-davey/interview-nick-hook",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "HotNewHipHop",
    headline: "Nick Hook — \"Gucci's\" feat. 24hrs",
    quote: "HotNewHipHop posts 'Gucci's' feat. 24hrs.",
    kind: "premiere",
    url: "https://www.hotnewhiphop.com/nick-hook-guccis-feat-24hrs-new-song.1971670.html",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "Theprp",
    headline: "Hear Deftones' Chino Moreno Guest On New Nick Hook Song \"The Infinite Loop\"",
    quote: "Theprp covers Chino Moreno's guest vocal on 'The Infinite Loop.'",
    kind: "feature",
    date: "2016-11-01",
    url: "https://www.theprp.com/2016/11/01/news/hear-deftones-chino-moreno-guest-new-nick-hook-song-infinite-loop/",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "Mixmag",
    headline: "Novelist and Nick Hook premiere 'Can't Tell Me Nothing'",
    quote: "Mixmag premieres 'Can't Tell Me Nothing.'",
    kind: "premiere",
    url: "https://mixmag.net/read/novelist-and-nick-hook-premiere-cant-tell-me-nothing-news",
    relatedReleaseSlug: "cc016-cant-tell-me-nothing-remixes",
  },
  {
    outlet: "VICE",
    headline: "Nick Hook and Novelist Team Up for Transatlantic Grime Anthem \"Can't Tell Me Nothing\"",
    quote: "VICE feature on the Nick Hook + Novelist transatlantic grime anthem.",
    kind: "feature",
    url: "https://www.vice.com/en/article/ae9z5p/nick-hook-novelist-cant-tell-me-nothing-music-video",
    relatedReleaseSlug: "cc016-cant-tell-me-nothing-remixes",
  },
  {
    outlet: "1833.fm",
    headline: "Nick Hook feat. Novelist — Can't Tell Me Nothing",
    quote: "1833.fm premieres 'Can't Tell Me Nothing.'",
    kind: "premiere",
    url: "https://1833.fm/nick-hook-feat-novelist-cant-tell-me-nothing/",
    relatedReleaseSlug: "cc016-cant-tell-me-nothing-remixes",
  },
  {
    outlet: "FACT Magazine",
    headline: "Nick Hook enlists 21 Savage and Bulletproof Dolphin on 'Head'",
    quote: "FACT covers the 'Head' single feat. 21 Savage + Bulletproof Dolphin.",
    kind: "premiere",
    date: "2016-05-10",
    url: "https://www.factmag.com/2016/05/10/nick-hook-head-featuring-21-savage-bulletproof-dolphin/",
    relatedReleaseSlug: "cc014-head",
  },
  {
    outlet: "Hypebeast",
    headline: "Fool's Gold's Nick Hook Links up With 21 Savage & Bulletproof Dolphin for \"Head\"",
    quote: "Hypebeast covers 'Head' feat. 21 Savage + Bulletproof Dolphin.",
    kind: "premiere",
    url: "https://hypebeast.com/2018/5/nick-hook-21-savage-bulletproof-dolphin-head",
    relatedReleaseSlug: "cc014-head",
  },
  {
    outlet: "VICE",
    headline: "DJ Earl Shares Syrupy Remix of 21 Savage's Collaboration with Nick Hook",
    quote: "VICE premieres the DJ Earl remix of 'Head.'",
    kind: "premiere",
    url: "https://www.vice.com/en/article/ez79am/dj-earl-21-savage-nick-hook-remix",
    relatedReleaseSlug: "cc014-head",
  },
  {
    outlet: "The Music Ninja",
    headline: "[Electronic] Nick Hook — Relationships (Album)",
    quote: "The Music Ninja review of the Relationships LP.",
    kind: "review",
    url: "https://www.themusicninja.com/electronic-nick-hook-relationships-album/",
    relatedReleaseSlug: "cc015-relationships",
  },
  {
    outlet: "VICE / THUMP",
    headline: "Listen to the Third Episode of Jubilee's The Pre-Game Podcast with Fool's Gold's Nick Hook",
    quote: "Jubilee's The Pre-Game podcast — Episode 3 with Nick Hook.",
    kind: "interview",
    url: "https://www.vice.com/en/article/ez795m/jubilee-pre-game-podcast-fools-gold-nick-hook",
  },

  // ──────────────────────────────────────────────────────────────────
  // 50 BACKWOODS — additions
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "Mixmag",
    headline: "DJ Earl and Nick Hook recorded '50 Backwoods' in a week-long whirlwind",
    quote: "Mixmag long-feature on the 50 Backwoods week-long recording session.",
    kind: "feature",
    url: "https://mixmag.net/feature/dj-earl-and-nick-hook-recorded-50-backwoods-in-a-week-long-whirlwind",
    relatedReleaseSlug: "cc017-50-backwoods",
  },
  {
    outlet: "FACT Magazine",
    headline: "Nick Hook and DJ Earl on their collab album 50 Backwoods and new video for 'Mood Right Now'",
    quote: "FACT interview + 'Mood Right Now' video premiere.",
    kind: "interview",
    date: "2017-12-22",
    url: "https://www.factmag.com/2017/12/22/nick-hook-dj-earl-mood-right-now-video-interview/",
    relatedReleaseSlug: "cc017-50-backwoods",
  },
  {
    outlet: "Dancing Astronaut",
    headline: "Nick Hook & DJ Earl drop new album '50 Backwoods'",
    quote: "Dancing Astronaut covers the 50 Backwoods release.",
    kind: "feature",
    year: 2017,
    url: "https://dancingastronaut.com/2017/12/nick-hook-dj-earl-drop-new-album-50-backwoods/",
    relatedReleaseSlug: "cc017-50-backwoods",
  },
  {
    outlet: "Tiny Mix Tapes",
    headline: "DJ Earl & Nick Hook hook up for tour and new album 50 Backwoods on Fool's Gold",
    quote: "Tiny Mix Tapes covers the tour + 50 Backwoods release news.",
    kind: "feature",
    url: "https://www.tinymixtapes.com/news/dj-earl-nick-hook-hook-tour-and-new-album-50-backwoods-fools-gold",
    relatedReleaseSlug: "cc017-50-backwoods",
  },
  {
    outlet: "BrooklynVegan",
    headline: "Nick Hook & DJ Earl releasing collab LP next week, share new song ft. Wiki",
    quote: "BrooklynVegan covers the 50 Backwoods release news + 'Hook Chop' premiere.",
    kind: "premiere",
    url: "https://www.brooklynvegan.com/nick-hook-dj-earl-releasing-collab-lp-next-week-share-new-song-ft-wiki/",
    relatedReleaseSlug: "cc017-50-backwoods",
  },
  {
    outlet: "Hypebeast",
    headline: "Wiki Joins Forces With Nick Hook & DJ Earl on New Single, \"Hook Chop\"",
    quote: "Hypebeast premieres 'Hook Chop' feat. Wiki.",
    kind: "premiere",
    year: 2017,
    url: "https://hypebeast.com/2017/11/wiki-nick-hook-dj-earl-hook-chop-single-stream",
    relatedReleaseSlug: "cc017-50-backwoods",
  },

  // ──────────────────────────────────────────────────────────────────
  // SPIRITUAL FRIENDSHIP / GARETH JONES / DOCUMENTARY EVIDENCE
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "Documentary Evidence",
    headline: "Nick Hook — tag archive (Mat Smith / 429 Harrow Road)",
    quote: "Documentary Evidence's tag archive of Nick Hook coverage — the Mute-blog Spiritual Friendship trove.",
    kind: "profile",
    url: "https://429harrowroad.com/tag/nick-hook/",
  },
  {
    outlet: "Documentary Evidence",
    headline: "Calm + Collect — tag archive (Mat Smith / 429 Harrow Road)",
    quote: "Documentary Evidence's Calm + Collect tag archive — Calllm chakra series, Electrogenetic, full label-side coverage.",
    kind: "profile",
    url: "https://429harrowroad.com/tag/calm-collect/",
  },
  {
    outlet: "u-he",
    headline: "u-he Feature — Gareth Jones",
    quote: "u-he feature on Gareth Jones — mentions the Spiritual Friendship project with Nick Hook.",
    kind: "feature",
    url: "https://u-he.com/community/features/gareth-jones.html",
  },
  {
    outlet: "FACT Magazine",
    headline: "There's an unreleased Flatbush Zombies and Nick Cave collaboration out there",
    quote: "FACT covers the Flatbush Zombies × Nick Cave 'Nephilim' collaboration — Hook engineered.",
    kind: "feature",
    date: "2019-08-09",
    url: "https://www.factmag.com/2019/08/09/nick-cave-flatbush-zombies/",
  },
  {
    outlet: "The FADER",
    headline: "There's an unreleased Flatbush Zombies and Nick Cave collaboration out there",
    quote: "FADER covers the Flatbush Zombies × Nick Cave T-Rex collaboration — Hook engineered.",
    kind: "feature",
    date: "2019-08-08",
    url: "https://www.thefader.com/2019/08/08/flatbush-zombies-nick-cave-collaboration-t-rex",
  },
  {
    outlet: "Clash",
    headline: "429 Harrow Road: A Mute Celebration",
    quote: "Clash covers the Documentary Evidence / Mute-orbit project that documents Spiritual Friendship.",
    kind: "feature",
    url: "https://www.clashmusic.com/features/429-harrow-road-a-mute-celebration/",
  },

  // ──────────────────────────────────────────────────────────────────
  // BOILER ROOM / RA / LIVE
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "Boiler Room",
    headline: "Nick Hook | Boiler Room: Shenzhen",
    quote: "Boiler Room set in Shenzhen.",
    kind: "feature",
    date: "2019-06-01",
    url: "https://boilerroom.tv/session/boiler-room-shenzhen/",
    relatedEraSlug: "solo-dj-live",
  },
  {
    outlet: "Boiler Room",
    headline: "Nick Hook Presents: Hooke's Halloween",
    quote: "2013 Boiler Room session — Nick Hook presents Hooke's Halloween.",
    kind: "feature",
    year: 2013,
    url: "https://boilerroom.tv/session/nick-hook-presents-hookes-halloween/",
    relatedEraSlug: "solo-dj-live",
  },
  {
    outlet: "Boiler Room",
    headline: "RBMA x Boiler Room — Hudson Mohawke, Lunice, Jackmaster b2b Oneman, Nick Hook, Machinedrum",
    quote: "RBMA × Boiler Room set with Hudson Mohawke, Lunice, Jackmaster b2b Oneman, Nick Hook, Machinedrum.",
    kind: "feature",
    url: "https://boilerroom.tv/session/red-bull-music-academy-x-boiler-room-hudson-mohawke-lunice-jackmaster-b2b-oneman-nick-hook-machinedrum-special-guests",
    relatedEraSlug: "red-bull-rbma",
  },
  {
    outlet: "Resident Advisor",
    headline: "Nick Hook (NYC) — RA artist page",
    quote: "RA's evergreen Nick Hook NYC artist page.",
    kind: "profile",
    url: "https://ra.co/dj/nickhook",
    relatedEraSlug: "solo-dj-live",
  },
  {
    outlet: "Resident Advisor",
    headline: "Nick Hook — RA biography",
    quote: "RA biography page.",
    kind: "profile",
    url: "https://ra.co/dj/nickhook/biography",
    relatedEraSlug: "solo-dj-live",
  },
  {
    outlet: "NTS / MoMA PS1",
    headline: "Nick Hook — Live From Warm Up (Aug 15, 2015)",
    quote: "NTS x MoMA PS1 Warm Up live recording.",
    kind: "feature",
    date: "2015-08-15",
    url: "https://www.nts.live/shows/moma-ps1/episodes/nick-hook-live-from-warm-up-nts-moma-ps1-15th-august-2015",
  },
  {
    outlet: "MoMA PS1",
    headline: "Warm Up: Nick Hook / Veronica Vasicka / Vessel / Ninos Du Brasil / Cut Hands / French Fries b2b Bambounou",
    quote: "MoMA PS1 Warm Up event listing — Aug 15, 2015.",
    kind: "feature",
    date: "2015-08-15",
    url: "https://www.moma.org/calendar/events/5669",
  },
  {
    outlet: "MoMA",
    headline: "Warm Up 2015: Week 7 Highlights",
    quote: "MoMA's Warm Up 2015 Week 7 highlights post.",
    kind: "feature",
    date: "2015-08-14",
    url: "https://www.moma.org/explore/inside_out/2015/08/14/warm-up-2015-week-7-highlights/",
  },
  {
    outlet: "BrooklynVegan",
    headline: "Run The Jewels began their Terminal 5 run with Gaslamp Killer, Nick Hook, Gangsta Boo & Cuz",
    quote: "BrooklynVegan covers RTJ Terminal 5 night 1 — Nick Hook on the bill.",
    kind: "feature",
    url: "https://www.brooklynvegan.com/run-the-jewels-began-their-terminal-5-run-with-gaslamp-killer-nick-hook-gangsta-boo-cuz-night-1-pics/",
    relatedEraSlug: "rtj-10th-anniversary",
  },
  {
    outlet: "BrooklynVegan",
    headline: "Run the Jewels began 10th anniversary run at Terminal 5 w/ A-Trak & Nick Hook",
    quote: "BrooklynVegan covers the RTJ 10th anniversary Terminal 5 run.",
    kind: "feature",
    url: "https://www.brooklynvegan.com/run-the-jewels-began-10th-anniversary-run-at-terminal-5-w-a-trak-nick-hook-video-setlist/",
    relatedEraSlug: "rtj-10th-anniversary",
  },
  {
    outlet: "BrooklynVegan",
    headline: "Run the Jewels wrapped up NYC run at Terminal 5 with Nick Hook & Stretch Armstrong",
    quote: "BrooklynVegan covers the RTJ Terminal 5 wrap.",
    kind: "feature",
    url: "https://www.brooklynvegan.com/run-the-jewels-wrapped-up-nyc-run-at-terminal-5-with-nick-hook-stretch-armstrong-pics-setlist/",
    relatedEraSlug: "rtj-10th-anniversary",
  },
  {
    outlet: "Time Out NY",
    headline: "Run the Jewels + Gaslamp Killer + Gangsta Boo + Nick Hook + Cuz",
    quote: "Time Out NY listing for the RTJ NYC bill featuring Nick Hook.",
    kind: "feature",
    url: "https://www.timeout.com/newyork/music/run-the-jewels-gaslamp-killer-gangsta-boo-nick-hook-cuz",
  },
  {
    outlet: "KEXP",
    headline: "Live Review: Run the Jewels with The Gaslamp Killer, Nick Hook, Gangsta Boo, and CUZ at The Showbox SoDo",
    quote: "KEXP live review of the Showbox SoDo bill featuring Nick Hook.",
    kind: "review",
    date: "2017-02-13",
    url: "https://www.kexp.org/read/2017/02/13/live-review-run-the-jewels-with-the-gaslamp-killer-nick-hook-gangsta-boo-and-cuz-at-the-showbox-sodo/",
    relatedEraSlug: "run-the-jewels-tour-2017",
  },
  {
    outlet: "First Avenue",
    headline: "Nick Hook — performer page",
    quote: "First Avenue's evergreen performer page for Nick Hook.",
    kind: "profile",
    url: "https://first-avenue.com/performer/nick-hook/",
  },
  {
    outlet: "First Avenue",
    headline: "DJ Earl × Nick Hook present 50 Backwoods Tour",
    quote: "First Avenue event listing for the 50 Backwoods Tour stop.",
    kind: "feature",
    year: 2017,
    url: "http://first-avenue.com/event/2017/12/djearl-nickhook",
    relatedReleaseSlug: "cc017-50-backwoods",
  },
  {
    outlet: "WFUV",
    headline: "Nick Hook, Karizma, DJ Spinn, Novelist, Recloose",
    quote: "WFUV event listing — Nick Hook on a bill with Karizma, DJ Spinn, Novelist, Recloose.",
    kind: "feature",
    date: "2015-10-08",
    url: "http://events.wfuv.org/events/2015/10/8/nick-hook-karizma-dj-spinn-novelist-recloose",
  },
  {
    outlet: "The FADER",
    headline: "This Brenmar Mix Will Catch You Up On The Last Month Of Hip-Hop And Dance Tracks",
    quote: "FADER covers the Brenmar Grey Zone mix — features Nick Hook + Novelist 'Can't Tell Me Nothing.'",
    kind: "mention",
    date: "2016-11-07",
    url: "https://www.thefader.com/2016/11/07/brenmar-grey-zone-volume-5-mix",
    relatedReleaseSlug: "cc016-cant-tell-me-nothing-remixes",
  },

  // ──────────────────────────────────────────────────────────────────
  // LATE 2010s / 2020s
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "FACT Magazine",
    headline: "Nick Hook and 3ASiC have a 'Need 4 Speed' in their frenetic new video",
    quote: "FACT premieres the 'Need 4 Speed' video.",
    kind: "premiere",
    date: "2020-07-11",
    url: "https://www.factmag.com/2020/07/11/nick-hook-3asic-need-4-speed/",
    relatedReleaseSlug: "cc005-need-for-speed",
  },
  {
    outlet: "Complex",
    headline: "Junglepussy Drops Off New Album 'Jp4'",
    quote: "Complex covers Junglepussy's Jp4 — Hook produced 'Spiders.'",
    kind: "feature",
    year: 2020,
    url: "https://www.complex.com/music/2020/10/junglepussy-jp4-album",
    relatedReleaseSlug: "spiders",
  },
  {
    outlet: "BrooklynVegan",
    headline: "Junglepussy announces new album 'Jp4' on Jagjaguwar, shares \"Main Attraction\"",
    quote: "BrooklynVegan covers the Junglepussy Jp4 announce — Hook production credit.",
    kind: "feature",
    url: "https://www.brooklynvegan.com/junglepussy-announces-new-album-jp4-on-jagjaguwar-shares-main-attraction/",
    relatedReleaseSlug: "spiders",
  },

  // ──────────────────────────────────────────────────────────────────
  // RTJ CU4TRO
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "Consequence",
    headline: "Run the Jewels announce Latin American RTJ4 remix album RTJ CU4TRO, share \"Caminando en la Nieve\"",
    quote: "Consequence breaks the RTJ CU4TRO announce + lead single.",
    kind: "feature",
    date: "2022-10-22",
    url: "https://consequence.net/2022/10/run-the-jewels-rtj-cu4tro-caminando-en-la-nieve-stream/",
    relatedReleaseSlug: "rtj-cu4tro-2023",
  },
  {
    outlet: "The Line of Best Fit",
    headline: "Run The Jewels announce RTJ4 Latin remix album RTJ CU4TRO",
    quote: "The Line of Best Fit covers the RTJ CU4TRO announce.",
    kind: "feature",
    url: "https://www.thelineofbestfit.com/news/run-the-jewels-announce-rtj4-latin-remix-album-rtj-cu4tro",
    relatedReleaseSlug: "rtj-cu4tro-2023",
  },
  {
    outlet: "Hypebeast",
    headline: "Run the Jewels To Release Remix Album Made Entirely by Latin Artists",
    quote: "Hypebeast covers the RTJ CU4TRO announce.",
    kind: "feature",
    url: "https://hypebeast.com/2022/10/run-the-jewels-remix-album-latin-artists-rtj-cu4tro",
    relatedReleaseSlug: "rtj-cu4tro-2023",
  },
  {
    outlet: "Clash",
    headline: "Run The Jewels Release 'RTJ CU4TRO' Remix Album",
    quote: "Clash covers the RTJ CU4TRO release.",
    kind: "feature",
    url: "https://www.clashmusic.com/news/run-the-jewels-release-rtj-cu4tro-remix-album/",
    relatedReleaseSlug: "rtj-cu4tro-2023",
  },
  {
    outlet: "PAN M 360",
    headline: "RTJ CU4TRO — Run The Jewels",
    quote: "PAN M 360 review of RTJ CU4TRO.",
    kind: "review",
    url: "https://panm360.com/en/records/rtj-cu4tro-run-the-jewels/",
    relatedReleaseSlug: "rtj-cu4tro-2023",
  },
  {
    outlet: "NME",
    headline: "Run The Jewels share details of new 'RTJ4' Latin remix album",
    quote: "NME covers the RTJ CU4TRO announce.",
    kind: "feature",
    url: "https://www.nme.com/news/music/run-the-jewels-share-details-of-new-rtj4-latin-remix-album-3334167",
    relatedReleaseSlug: "rtj-cu4tro-2023",
  },
  {
    outlet: "Our Generation Music",
    headline: "Run The Jewels releases Latin-inspired remix album 'RTJ CU4TRO'",
    quote: "Our Generation Music covers the RTJ CU4TRO release.",
    kind: "feature",
    url: "https://ourgenerationmusic.com/news/run-the-jewels-releases-latin-inspired-remix-album-rtj-cu4tro/",
    relatedReleaseSlug: "rtj-cu4tro-2023",
  },
  {
    outlet: "Our Culture",
    headline: "Run the Jewels Announce New Remix Album 'RTJ CU4TRO'",
    quote: "Our Culture covers the RTJ CU4TRO announce.",
    kind: "feature",
    date: "2022-10-22",
    url: "https://ourculturemag.com/2022/10/22/run-the-jewels-announce-new-remix-album-rtj-cu4tro/",
    relatedReleaseSlug: "rtj-cu4tro-2023",
  },
  {
    outlet: "Black Rhino Radio",
    headline: "Album of the Week: Run the Jewels — RTJ CU4TRO",
    quote: "Black Rhino Radio's Album of the Week feature on RTJ CU4TRO.",
    kind: "review",
    url: "https://blackrhinoradio.com/reviews/album-of-the-week-album-of-the-week-run-the-jewels-rtj-cu4tro",
    relatedReleaseSlug: "rtj-cu4tro-2023",
  },

  // ──────────────────────────────────────────────────────────────────
  // LATIN / MEXICO
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "Noisey ES (VICE)",
    headline: "Desde Brooklyn, Nick Hook nos prepara para su próxima presentación en la CDMX",
    quote: "Noisey ES interview ahead of Nick Hook's CDMX show.",
    kind: "interview",
    url: "https://noisey.vice.com/es/article/kzkb33/desde-brooklyn-nick-hook-nos-prepara-para-su-proxima-presentacion-en-la-cdmx",
  },

  // ──────────────────────────────────────────────────────────────────
  // FOUNDATION / HUB PAGES
  // ──────────────────────────────────────────────────────────────────
  {
    outlet: "Fool's Gold",
    headline: "Nick Hook — Fool's Gold artist page",
    quote: "Fool's Gold's evergreen artist hub for Nick Hook.",
    kind: "profile",
    url: "https://foolsgoldrecs.com/artists/nick-hook/",
  },
  {
    outlet: "Hypebeast",
    headline: "Nick Hook — Hypebeast tag",
    quote: "Hypebeast's evergreen Nick Hook tag page — covers all coverage.",
    kind: "profile",
    url: "https://hypebeast.com/tags/nick-hook",
  },
];

function stableId(it: Item): string {
  const h = createHash("sha1")
    .update(`${it.outlet}::${it.headline ?? ""}::${it.quote.slice(0, 80)}`)
    .digest("hex")
    .slice(0, 16);
  return `pressQuote-archive-${h}`;
}

async function resolveRef(type: string, slug: string): Promise<string | null> {
  const id = await c.fetch(`*[_type == $type && slug.current == $slug][0]._id`, { type, slug });
  return id || null;
}

(async () => {
  console.log(`\n📰 Press URL batch 2 — ${ITEMS.length} items${DRY ? " (DRY)" : ""}\n`);
  let created = 0, patched = 0, missingEra = 0, missingRelease = 0;

  for (const it of ITEMS) {
    const _id = stableId(it);
    const eraRef = it.relatedEraSlug ? await resolveRef("project", it.relatedEraSlug) : null;
    const releaseRef = it.relatedReleaseSlug ? await resolveRef("release", it.relatedReleaseSlug) : null;
    if (it.relatedEraSlug && !eraRef) missingEra++;
    if (it.relatedReleaseSlug && !releaseRef) missingRelease++;

    const doc: Record<string, unknown> = {
      _id,
      _type: "pressQuote",
      kind: it.kind ?? "feature",
      outlet: it.outlet,
      ...(it.author ? { author: it.author } : {}),
      ...(it.headline ? { headline: it.headline } : {}),
      quote: it.quote,
      ...(it.date ? { date: it.date } : {}),
      ...(it.year ? { year: it.year } : {}),
      ...(it.url ? { url: it.url } : {}),
      ...(it.featured ? { featured: true } : {}),
      source: it.author ? `${it.author} · ${it.outlet}` : it.outlet,
      ...(eraRef ? { relatedEra: { _type: "reference", _ref: eraRef } } : {}),
      ...(releaseRef ? { relatedRelease: { _type: "reference", _ref: releaseRef } } : {}),
    };

    const existing = await c.fetch(`*[_id == $id][0]{_id}`, { id: _id });
    const tag = it.url ? "🔗" : "  ";
    const rel = it.relatedReleaseSlug ? `→${it.relatedReleaseSlug.slice(0, 18)}` : it.relatedEraSlug ? `~${it.relatedEraSlug.slice(0, 18)}` : "";
    const label = `${it.outlet.padEnd(24)} ${(it.headline ?? it.quote).slice(0, 56).padEnd(56)} ${rel}`;

    if (DRY) {
      console.log(`   ${existing ? "↻" : "+"} ${tag} ${label}`);
      if (existing) patched++; else created++;
      continue;
    }

    if (existing) {
      await c.patch(_id).set(doc).commit();
      patched++;
      console.log(`   ↻ ${tag} ${label}`);
    } else {
      await c.create(doc);
      created++;
      console.log(`   + ${tag} ${label}`);
    }
  }

  console.log(`\n✅ ${created} created · ${patched} patched${DRY ? " (DRY)" : ""}`);
  if (missingEra) console.log(`   ⚠ ${missingEra} items had relatedEraSlug that didn't resolve to a project doc — created without era ref`);
  if (missingRelease) console.log(`   ⚠ ${missingRelease} items had relatedReleaseSlug that didn't resolve to a release doc — created without release ref`);
  console.log("");
})();
