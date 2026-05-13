/**
 * Cu4tro press batch.
 *
 * Bulk-ingest every CU4TRO press URL extracted from two key emails:
 *   · Daniela Paez's Jan 19, 2023 LATAM campaign recap (Rolling Stone, La
 *     Bestia, Sopitas, GQ Mexico, Telehit, El Sol de México + YouTube
 *     interview, Warp, Indie Rocks, Loopulo, etc.)
 *   · Amaechi's Nov 16, 2022 US/UK reviews recap (NPR, Pitchfork, Telegraph
 *     5-star, Complex, XXL, VIBE, etc.)
 *
 * Each URL becomes a pressQuote doc:
 *   · scrapes og:title + og:description + og:image
 *   · attaches to release `rtj-cu4tro-2023` and era `run-the-jewels-tour-2017`
 *   · idempotent via stable-id hash on (url + outlet) — re-runs are no-ops
 *
 * Run:  npx tsx scripts/import-press-cu4tro.ts
 * Dry:  npx tsx scripts/import-press-cu4tro.ts --dry
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
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

const RELEASE_SLUG = "rtj-cu4tro-2023";
const ERA_SLUG = "run-the-jewels-tour-2017";

type Item = {
  outlet: string;
  url: string;
  kind: "review" | "interview" | "feature" | "profile" | "mention" | "list-inclusion" | "premiere";
  date?: string; // YYYY-MM-DD
  /** When set, used verbatim instead of the og scrape. Useful for pieces
   *  where the headline string is already in our hand. */
  headlineHint?: string;
  /** Hand-curated pull quote (overrides og:description). */
  quoteHint?: string;
  /** Pin to the homepage press wall. Reserve for the strongest 4-6 cu4tro
   *  pieces (Pitchfork album review, Telegraph 5-star, Rolling Stone LATAM,
   *  GQ Mexico, NPR). */
  featured?: boolean;
};

// === LATAM CAMPAIGN (from Daniela's Jan 2023 recap email) ===
const LATAM: Item[] = [
  // GQ Mexico — full interview
  { outlet: "GQ México",         kind: "interview",      date: "2022-11-15", url: "https://www.gq.com.mx/entretenimiento/articulo/run-the-jewels-entrevista-rdj4-cu4tro-2022", featured: true },
  // El Sol de México — feature
  { outlet: "El Sol de México",  kind: "feature",        date: "2022-12-01", url: "https://www.elsoldemexico.com.mx/cultura/run-the-jewels-una-experiencia-completa-alrededor-de-la-musica-9356957.html" },
  // El Sol de México — YouTube interview
  { outlet: "El Sol de México",  kind: "interview",      date: "2022-12-01", url: "https://www.youtube.com/watch?v=5NE2Pl_14ls", headlineHint: "Run The Jewels — entrevista (El Sol de México)" },
  // Telehit
  { outlet: "Telehit",           kind: "feature",        date: "2022-11-25", url: "https://www.telehit.com/musica/run-the-jewels-y-su-viaje-ritmico-en-latinoamerica-amor-mutuo-por-el-hip-hop" },
  // Warp
  { outlet: "Warp",              kind: "feature",        date: "2022-11-30", url: "https://warp.la/un-vistazo-a-los-nike-sb-dunks-x-run-the-jewels-225087" },
  // Indie Rocks
  { outlet: "Indie Rocks!",      kind: "feature",        date: "2022-11-11", url: "https://www.indierocks.mx/musica/noticias/rtj-cuatro-el-nuevo-album-colaborativo-de-run-the-jewels/" },
  // Sopitas
  { outlet: "Sopitas",           kind: "feature",        date: "2022-11-13", url: "https://www.sopitas.com/musica/run-the-jewels-corona-capital-2022-camilo-lara-ims-mensajes-politicos-resena/" },
  // Loopulo (cervezas)
  { outlet: "Loopulo",           kind: "mention",        date: "2022-11-15", url: "https://loopulo.com/cervezas-artesanas/cu4tro-minerva-run-the-jewels/" },
  // Marca Claro / MVS Noticias
  { outlet: "Marca Claro",       kind: "feature",        date: "2022-11-19", url: "https://www.marca.com/claro-mx/trending/2022/11/19/637871da22601ded438b457c.html" },
  // CDMX Secreta
  { outlet: "CDMX Secreta",      kind: "feature",        date: "2022-11-17", url: "https://cdmxsecreta.com/inauguran-exhibicion-de-run-the-jewels-en-cdmx/" },
  // Life and Style
  { outlet: "Life and Style",    kind: "mention",        date: "2022-11-10", url: "https://lifeandstyle.expansion.mx/entretenimiento/2022/11/10/horarios-corona-capital-2022" },
  // La Razón
  { outlet: "La Razón",          kind: "feature",        date: "2022-11-13", url: "https://www.razon.com.mx/entretenimiento/corona-capital-2022-vive-arranque-emo-lleno-energia-506627" },
  // Milenio
  { outlet: "Milenio",           kind: "feature",        date: "2022-11-13", url: "https://www.milenio.com/espectaculos/musica/festival-corona-capital-2022-mejores-momentos-1" },
  // Festivales México
  { outlet: "Festivales México", kind: "feature",        date: "2022-11-13", url: "https://festivalesmexico.com/corona-capital/como-se-vivio-el-dia-1-del-corona-capital/" },
  // Morita Digital
  { outlet: "Morita Digital",    kind: "feature",        date: "2022-11-09", url: "https://moritadigital.com/blog/2022/11/09/corona-capital-2022-bandas-que-no-te-puedes-perder-del-viernes/" },
  // El Heraldo de México
  { outlet: "El Heraldo de México", kind: "feature",     date: "2022-11-17", url: "https://heraldodemexico.com.mx/espectaculos/2022/11/17/corona-capital-2022-artistas-bandas-que-tienes-que-conocer-durante-el-festival-458645.html" },
  // Cultura Colectiva
  { outlet: "Cultura Colectiva", kind: "feature",        date: "2022-11-15", url: "https://culturacolectiva.com/estilo-de-vida/asi-vivimos-el-sabor-capital-en-uno-de-los-mejores-festivales-de-musica/" },
  // GLUC
  { outlet: "GLUC",              kind: "feature",        date: "2022-11-19", url: "https://gluc.mx/entretenimiento/2022/11/19/como-se-vivio-el-dia-uno-del-corona-capital-2022-todo-lo-que-no-puedes-perderte-si-vas-hoy-manana-56884.html" },
  // Ibero (radio)
  { outlet: "Ibero 90.9",        kind: "list-inclusion", date: "2022-11-11", url: "https://ibero909.fm/blog/julieta-venegas-nas-run-the-jewels-sonic-emerson-y-mas-en-los-discos-de-la-semana" },
  // Argentina — La Nación (Costa Rica? actually .com.ar / story is from CR — keep as-is)
  { outlet: "La Nación",         kind: "feature",        date: "2022-11-12", url: "https://www.nacion.com/viva/musica/tico-javier-arce-colaboro-en-disco-del-duo-de-run/UPGBNZOGFRCQJJYKXE2LUNM2EE/story/" },
  // Chile — Cancha General
  { outlet: "Cancha General",    kind: "feature",        date: "2022-11-11", url: "https://canchageneral.com/run-the-jewels-lanzan-rtj4/" },
];

// === US / UK / GLOBAL (from Amaechi's Nov 16, 2022 reviews recap) ===
const GLOBAL: Item[] = [
  { outlet: "Pitchfork",         kind: "review",         date: "2022-11-16", url: "https://pitchfork.com/reviews/albums/run-the-jewels-rtj-cu4tro/", featured: true },
  { outlet: "Pitchfork",         kind: "list-inclusion", date: "2022-11-11", url: "https://pitchfork.com/news/7-new-albums-you-should-listen-to-now-bruce-springsteen-duval-timothy-glorilla/" },
  { outlet: "NPR",               kind: "review",         date: "2022-11-09", url: "https://www.npr.org/2022/11/09/1135562520/new-music-friday-the-best-releases-out-on-nov-11", featured: true },
  { outlet: "The Telegraph",     kind: "review",         date: "2022-11-11", url: "https://www.telegraph.co.uk/music/what-to-listen-to/best-albums-week-christine-queens-wizkid-mgmt-nas/", quoteHint: "Five stars.", featured: true },
  { outlet: "Grammy.com",        kind: "list-inclusion", date: "2022-11-01", url: "https://www.grammy.com/news/november-2022-album-guide-drake-21-savage-roddy-ricch-rm-bts-new-releases" },
  { outlet: "Uproxx",            kind: "list-inclusion", date: "2022-11-15", url: "https://uproxx.com/music/best-new-music-this-week-rihanna-kim-petras/" },
  { outlet: "HipHopDX",          kind: "list-inclusion", date: "2022-11-11", url: "https://hiphopdx.com/news/new-rap-albums-nas-hit-boy-kings-disease-3" },
  { outlet: "Okayplayer",        kind: "list-inclusion", date: "2022-11-11", url: "https://www.okayplayer.com/music/new-hip-hop-afrobeats-rb-albums-you-should-be-listening-to-week-of-november-11.html" },
  { outlet: "Complex",           kind: "feature",        date: "2022-11-11", url: "https://www.complex.com/music/run-the-jewels-rtj-cu4tro-remix-album" },
  { outlet: "XXL",               kind: "list-inclusion", date: "2022-11-11", url: "https://www.xxlmag.com/nas-hit-boy-glorilla-yung-bleu-new-hip-hop-projects/" },
  { outlet: "VIBE",              kind: "list-inclusion", date: "2022-11-11", url: "https://www.vibe.com/music/reviews/nas-glorilla-bleu-new-music-friday-1234710649/" },
  { outlet: "American Songwriter", kind: "list-inclusion", date: "2022-11-19", url: "https://americansongwriter.com/new-song-saturday-hear-new-tracks-from-kim-petras-wale-black-eyed-peas-yuna-and-more/" },
  { outlet: "WXPN",              kind: "list-inclusion", date: "2022-11-11", url: "https://xpn.org/2022/11/11/press-play-11-11-2022/" },
  { outlet: "Tinnitist",         kind: "review",         date: "2022-11-11", url: "https://tinnitist.com/2022/11/11/albums-of-the-week-run-the-jewels-rtj-cu4tro/" },
  { outlet: "Highnote Blog",     kind: "list-inclusion", date: "2022-11-11", url: "https://highnoteblog.com/new-music-friday-nov-11-2022/" },
];

const ALL: Item[] = [...LATAM, ...GLOBAL];

function stableId(url: string, outlet: string): string {
  const h = createHash("sha1").update(`${url}|${outlet}`).digest("hex").slice(0, 16);
  return `pressQuote-cu4tro-${h}`;
}

async function fetchOg(url: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { headers: { "user-agent": UA, "accept": "text/html,application/xhtml+xml" }, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return {} as { title?: string; description?: string; image?: string };
    const html = await res.text();
    const pick = (re: RegExp) => {
      const m = html.match(re);
      return m ? m[1].trim() : undefined;
    };
    let image =
      pick(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<meta[^>]+name=["']twitter:image:src["'][^>]+content=["']([^"']+)["']/i);
    if (image && !/^https?:\/\//i.test(image)) {
      try { image = new URL(image, url).toString(); } catch {}
    }
    return {
      title:
        pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
        pick(/<title>([^<]+)<\/title>/i),
      description:
        pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ??
        pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
      image,
    };
  } catch {
    clearTimeout(t);
    return {} as { title?: string; description?: string; image?: string };
  }
}

async function uploadImage(imageUrl: string, refUrl: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(imageUrl, { headers: { "user-agent": UA, "referer": refUrl }, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 1024) return null;
    const ext = (ct.split("/")[1] ?? "jpg").split(";")[0];
    const filename = `cu4tro-press-${Date.now()}.${ext}`;
    const asset = await c.assets.upload("image", buf, { filename, contentType: ct });
    return asset._id;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // Resolve refs once
  const releaseId = await c.fetch<string | null>(`*[_type == "release" && slug.current == $s][0]._id`, { s: RELEASE_SLUG });
  const eraId     = await c.fetch<string | null>(`*[_type == "project" && slug.current == $s][0]._id`,  { s: ERA_SLUG });
  if (!releaseId) { console.error(`❌ release ${RELEASE_SLUG} not found`); process.exit(1); }
  if (!eraId)     { console.error(`❌ era ${ERA_SLUG} not found`); process.exit(1); }

  console.log(`\ningesting ${ALL.length} cu4tro press pieces${DRY ? " (DRY RUN)" : ""}\n  release: ${RELEASE_SLUG} (${releaseId})\n  era:     ${ERA_SLUG} (${eraId})\n`);

  let created = 0, updated = 0, skipped = 0, failed = 0;
  for (let i = 0; i < ALL.length; i += 1) {
    const it = ALL[i];
    const id = stableId(it.url, it.outlet);
    const existing = await c.fetch<{ _id: string; image?: { _ref: string } } | null>(`*[_id == $id][0] { _id, "image": image.asset }`, { id });

    const og = await fetchOg(it.url);
    const headline = it.headlineHint ?? og.title;
    const quote    = it.quoteHint ?? og.description ?? headline ?? "(see article)";
    const year     = it.date ? parseInt(it.date.slice(0, 4), 10) : undefined;

    let imageRef: { _type: "image"; asset: { _type: "reference"; _ref: string } } | undefined;
    if (og.image && (!existing?.image)) {
      if (!DRY) {
        const assetId = await uploadImage(og.image, it.url);
        if (assetId) imageRef = { _type: "image", asset: { _type: "reference", _ref: assetId } };
      } else {
        imageRef = undefined; // dry — log only
      }
    }

    const doc: Record<string, unknown> = {
      _id: id,
      _type: "pressQuote",
      kind: it.kind,
      headline,
      quote,
      excerpt: og.description,
      outlet: it.outlet,
      source: it.outlet,
      url: it.url,
      date: it.date,
      year,
      featured: it.featured ?? false,
      relatedRelease: { _type: "reference", _ref: releaseId },
      relatedEra:     { _type: "reference", _ref: eraId },
      ...(imageRef ? { image: imageRef } : {}),
    };

    const lbl = `[${i + 1}/${ALL.length}] ${it.outlet}: ${(headline ?? it.url).slice(0, 60)}`;
    if (DRY) {
      console.log(`${existing ? "↻" : "+"} ${lbl} ${og.image ? "· img" : ""}`);
      await sleep(250);
      continue;
    }

    try {
      if (existing) {
        // Patch in place — refresh metadata + add image if we just got one.
        const patch: Record<string, unknown> = {
          headline, quote, outlet: it.outlet, source: it.outlet, url: it.url,
          date: it.date, year, kind: it.kind,
          relatedRelease: { _type: "reference", _ref: releaseId },
          relatedEra:     { _type: "reference", _ref: eraId },
        };
        if (imageRef && !existing.image) patch.image = imageRef;
        await c.patch(existing._id).set(patch).commit();
        updated += 1;
        console.log(`↻ ${lbl} ${imageRef ? "+ img" : ""}`);
      } else {
        await c.createIfNotExists(doc as any);
        created += 1;
        console.log(`+ ${lbl} ${imageRef ? "+ img" : ""}`);
      }
    } catch (err) {
      failed += 1;
      console.log(`✗ ${lbl} — ${(err as Error).message}`);
    }
    await sleep(250);
  }

  console.log(`\n done. created=${created}  updated=${updated}  skipped=${skipped}  failed=${failed}\n`);
})();
