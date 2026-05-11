/**
 * Seed / refresh the Ableton brand page.
 *
 * - Fetches the Ableton article ("Collaborator in Chief") for its og:image
 *   and og:title, uploads the image to Sanity, attaches it as articleImage
 * - Patches the brand doc with:
 *     articleUrl, articleTitle, articleQuote (manually crafted)
 *     One Thing video into videos[]
 *     productsUsed[] — Push 3, Move, Live, Note
 * - Leaves workshops[] empty for Nick to forward emails into
 *
 * Idempotent: re-running will refresh the article image + overwrite the
 * static fields; existing workshops are preserved.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";
import { randomUUID } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const ARTICLE_URL = "https://www.ableton.com/en/blog/nick-hook-collaborator-in-chief/";
const ONE_THING_VIDEO = "https://youtu.be/Yusl2_aoeWA?si=_6TZuKd23v0KSbQJ";

// Logo + product hero images, scraped from ableton.com — they serve the
// canonical og:image per product page, which is good enough for our card.
const LOGO_URL = "https://cdn-resources.ableton.com/80bA26cPQ1hEJDFjpUKntxfqdmG3ZykO/static/images/ableton-wordmark.c025e3df71b3.svg";
const PRODUCT_IMAGES: Record<string, string> = {
  "Push 3":  "https://beta-ableton.imgix.net/media/x4jlr5tt/still-from-header.png",
  "Move":    "https://beta-ableton.imgix.net/media/cz0ca4sz/abletonmove-ogimage_1200x630.jpeg",
  "Live 12": "https://beta-ableton.imgix.net/media/y1tf4gvt/l12-beta-800x600.jpg",
  "Note":    "https://beta-ableton.imgix.net/media/exmb0u2q/note.jpeg",
};

type ArticleBlock = {
  _key: string;
  kind: "h2" | "h3" | "p" | "video" | "soundcloud";
  text?: string;
  url?: string;
  caption?: string;
};

/**
 * Parse the article HTML <article> body into an ordered block array.
 * Walks the children of <article> in document order so paragraphs stay
 * interleaved with their video embeds the way they appear in the original.
 *
 * Strategy: regex over the article HTML for <h2>, <h3>, <p>, <iframe>.
 * Sort by source position, emit one block per hit. Strip HTML inside the
 * captured text. Recognize an <h3> immediately followed by a video iframe
 * as the iframe's caption.
 */
function parseArticleBody(html: string): ArticleBlock[] {
  // Strip the masthead title (the page's own h1) — we already have it via OG.
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
  if (!articleMatch) return [];
  const art = articleMatch[1];

  type Hit =
    | { idx: number; kind: "h2" | "h3" | "p"; text: string }
    | { idx: number; kind: "video"; url: string }
    | { idx: number; kind: "soundcloud"; url: string };

  const hits: Hit[] = [];

  const stripHtml = (s: string) =>
    s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
     .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&ldquo;/g, "“")
     .replace(/&rdquo;/g, "”").replace(/&hellip;/g, "…").replace(/\s+/g, " ").trim();

  for (const m of art.matchAll(/<(h2|h3|p)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    const text = stripHtml(m[2]);
    if (text.length < 8) continue;
    hits.push({ idx: m.index!, kind: m[1] as "h2" | "h3" | "p", text });
  }
  for (const m of art.matchAll(/<iframe[^>]+src=["']([^"']+)["']/g)) {
    const src = m[1];
    const ytMatch = src.match(/(?:youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (ytMatch) {
      hits.push({ idx: m.index!, kind: "video", url: `https://www.youtube.com/watch?v=${ytMatch[1]}` });
      continue;
    }
    const scMatch = src.match(/soundcloud\.com\/player\/\?url=([^&"']+)/);
    if (scMatch) {
      hits.push({ idx: m.index!, kind: "soundcloud", url: decodeURIComponent(scMatch[1]) });
    }
  }

  hits.sort((a, b) => a.idx - b.idx);

  // Skip the article H1 (page title) — first text-block whose tag is h1/h2
  // and contains the brand name is usually the masthead. Easier filter: drop
  // any h2 whose text matches the article title.
  const titleMatch = art.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const pageTitle = titleMatch ? stripHtml(titleMatch[1]) : "";
  // Also drop the "Download as Live Set" h2 — that's not really article body.

  const blocks: ArticleBlock[] = [];
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i];
    if ((h.kind === "h2" || h.kind === "h3") && h.text === pageTitle) continue;
    if (h.kind === "h2" && /^download.*live set/i.test(h.text)) continue;

    if (h.kind === "video") {
      // Pull the immediately-preceding h3 (if within ~600 chars) as caption.
      const prev = hits[i - 1];
      let caption: string | undefined;
      if (prev && prev.kind === "h3" && h.idx - prev.idx < 800) {
        caption = prev.text;
        // pop the duplicate h3 we already emitted
        if (blocks[blocks.length - 1]?.kind === "h3" && blocks[blocks.length - 1].text === prev.text) {
          blocks.pop();
        }
      }
      blocks.push({ _key: randomUUID().replace(/-/g, ""), kind: "video", url: h.url, caption });
      continue;
    }

    if (h.kind === "soundcloud") {
      blocks.push({ _key: randomUUID().replace(/-/g, ""), kind: "soundcloud", url: h.url });
      continue;
    }

    blocks.push({ _key: randomUUID().replace(/-/g, ""), kind: h.kind, text: h.text });
  }

  // Drop trailing fluff: "Posted on..." / "Keep up with..." / "Tags:"
  while (blocks.length > 0) {
    const last = blocks[blocks.length - 1];
    if (last.kind === "p" && (
      /^posted on/i.test(last.text ?? "") ||
      /^keep up with/i.test(last.text ?? "") ||
      /^tags:/i.test(last.text ?? "")
    )) {
      blocks.pop();
    } else {
      break;
    }
  }

  return blocks;
}

// Scrape OG metadata from a URL.
async function fetchOG(url: string): Promise<{ image?: string; title?: string; description?: string }> {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  const html = await res.text();
  const pick = (re: RegExp) => {
    const m = html.match(re);
    return m ? m[1].trim() : undefined;
  };
  return {
    image: pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
        ?? pick(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i),
    title: pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i),
    description: pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i),
  };
}

async function uploadImageFromUrl(url: string, filename: string): Promise<string | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const asset = await sanity.assets.upload("image", buf, { filename });
  return asset._id;
}

async function findBrand(slug: string): Promise<{ _id: string; workshops?: unknown[]; videos?: { youtubeUrl: string }[] } | null> {
  return sanity.fetch(`*[_type == "brand" && slug.current == $slug][0]{ _id, workshops, videos }`, { slug });
}

async function main() {
  // 1. Find or create the brand
  let brand = await findBrand("ableton");
  if (!brand) {
    console.log("creating new Ableton brand doc…");
    const created = await sanity.create({
      _id: "brand-ableton",
      _type: "brand",
      name: "Ableton",
      slug: { _type: "slug", current: "ableton" },
      relationship: "collaborator",
      tagline: "live · push · note · move. brooklyn ⇄ berlin since 2010.",
      websiteUrl: "https://www.ableton.com",
    });
    brand = { _id: created._id };
  }

  // 2. Scrape the article OG metadata + body
  console.log("→ fetching article page…");
  const html = await (await fetch(ARTICLE_URL, {
    headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
  })).text();
  const og = await fetchOG(ARTICLE_URL);
  console.log(`   title: ${og.title}`);
  console.log(`   image: ${og.image}`);

  console.log("→ parsing article body…");
  const articleBody = parseArticleBody(html);
  console.log(`   parsed ${articleBody.length} blocks (${articleBody.filter((b) => b.kind === "video").length} videos, ${articleBody.filter((b) => b.kind === "soundcloud").length} soundcloud)`);

  // 3. Upload the OG image as articleImage
  let articleAssetId: string | null = null;
  if (og.image) {
    console.log("→ uploading article hero image…");
    articleAssetId = await uploadImageFromUrl(og.image, "ableton-collaborator-in-chief.jpg");
    console.log(`   ✓ asset ${articleAssetId}`);
  }

  // 4. Upload the Ableton wordmark logo
  console.log("→ uploading Ableton wordmark logo…");
  const logoAssetId = await uploadImageFromUrl(LOGO_URL, "ableton-wordmark.svg");
  console.log(`   ${logoAssetId ? "✓" : "✗"} asset ${logoAssetId ?? "—"}`);

  // 5. Upload product hero images — each Ableton product page's og:image
  console.log("→ uploading product images…");
  const productAssets: Record<string, string | null> = {};
  for (const [name, url] of Object.entries(PRODUCT_IMAGES)) {
    const ext = url.split(".").pop()?.split("?")[0] ?? "jpg";
    const id = await uploadImageFromUrl(url, `ableton-${name.toLowerCase().replace(/\s+/g, "-")}.${ext}`);
    productAssets[name] = id;
    console.log(`   ${id ? "✓" : "✗"} ${name}`);
  }

  // 6. Build the patch
  const productNote = (name: string) => ({
    "Push 3": "standalone — the brain of every live show.",
    "Move": "first place every idea lands. travel rig.",
    "Live 12": "every record made here since 2008.",
    "Note": "iphone sketchpad — captures the loop in 30 seconds.",
  }[name]);
  const productUrl = (name: string) => ({
    "Push 3": "https://www.ableton.com/en/push/",
    "Move":   "https://www.ableton.com/en/move/",
    "Live 12":"https://www.ableton.com/en/live/",
    "Note":   "https://www.ableton.com/en/note/",
  }[name]);

  const patch: Record<string, unknown> = {
    articleUrl: ARTICLE_URL,
    articleTitle: og.title ?? "Nick Hook: Collaborator in Chief",
    articleQuote:
      "Brooklyn-based producer Nick Hook talks about turning collaboration into a career — and why the studio works best when it's full of people.",
    articleBody,
    productsUsed: Object.keys(PRODUCT_IMAGES).map((name, i) => ({
      _key: `p-${name.toLowerCase().replace(/\s+/g, "-")}`,
      name,
      url: productUrl(name),
      note: productNote(name),
      ...(productAssets[name]
        ? { image: { _type: "image", asset: { _type: "reference", _ref: productAssets[name]! } } }
        : {}),
    })),
  };

  if (articleAssetId) {
    patch.articleImage = {
      _type: "image",
      asset: { _type: "reference", _ref: articleAssetId },
    };
  }
  if (logoAssetId) {
    patch.logo = {
      _type: "image",
      asset: { _type: "reference", _ref: logoAssetId },
    };
  }

  // 5. Add the One Thing video if not already in videos[]
  const existingVideos = brand.videos ?? [];
  const hasOneThing = existingVideos.some((v) => v.youtubeUrl === ONE_THING_VIDEO);
  if (!hasOneThing) {
    patch.videos = [
      ...existingVideos,
      {
        _key: "v-one-thing",
        title: "One Thing — Nick Hook",
        youtubeUrl: ONE_THING_VIDEO,
      },
    ];
  }

  console.log("→ patching brand doc…");
  await sanity.patch(brand._id).set(patch).commit();
  console.log("✓ done");
  console.log(`\nopen http://localhost:3000/partners/ableton to see it.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
