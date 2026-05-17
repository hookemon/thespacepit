/**
 * Programmatic sitemap.xml — fed to Google Search Console so every release,
 * artist, era, brand, and editorial page gets crawled.
 *
 * Lists every dynamic URL pulled from Sanity (releases, artists, projects,
 * brands) plus the curated static routes (home, label, catalog, sessions,
 * press, etc.). Updated automatically as Nick adds docs in Sanity Studio.
 *
 * The /calm-collect/upcoming pitch hub + /cover-export internal route stay
 * EXCLUDED — they're internal one-sheets, not for public crawling.
 */
import type { MetadataRoute } from "next";
import {
  getReleaseSlugs,
  getArtistSlugs,
  getProjectSlugs,
  getBrandSlugs,
} from "./_lib/sanity-queries";

const ORIGIN = "https://thespacepit.com";

// Curated static routes. Anything not listed here either lives behind a
// dynamic segment (handled below) or is intentionally excluded (e.g. the
// upcoming/distro-pitch URL).
const STATIC_ROUTES: { path: string; priority: number; changeFreq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  // The root is a random-world router (server redirect). Listed mostly so
  // Google sees the canonical domain; the three world homes below carry
  // the priority weight.
  { path: "/",              priority: 0.5,  changeFreq: "weekly" },
  { path: "/the-pit",       priority: 1.0,  changeFreq: "weekly" },  // spacepit world home
  { path: "/nick-hook",     priority: 1.0,  changeFreq: "weekly" },  // nick world home
  { path: "/calm-collect",  priority: 1.0,  changeFreq: "weekly" },  // label world home
  { path: "/pop-up",        priority: 0.85, changeFreq: "daily" },   // active campaign — date drop
  { path: "/releases",      priority: 0.9,  changeFreq: "weekly" },
  { path: "/artists",       priority: 0.7,  changeFreq: "weekly" },
  { path: "/collabs",       priority: 0.8,  changeFreq: "monthly" },
  { path: "/press",         priority: 0.7,  changeFreq: "weekly" },
  { path: "/sessions",      priority: 0.85, changeFreq: "weekly" },  // bumped — active offer
  { path: "/packs",         priority: 0.8,  changeFreq: "weekly" },
  { path: "/watch",         priority: 0.6,  changeFreq: "weekly" },
  { path: "/tv",            priority: 0.5,  changeFreq: "weekly" },
  { path: "/radio",         priority: 0.6,  changeFreq: "weekly" },
  { path: "/mixes",         priority: 0.5,  changeFreq: "monthly" },
  { path: "/listening",     priority: 0.4,  changeFreq: "monthly" },
  { path: "/vault",         priority: 0.5,  changeFreq: "weekly" },
  { path: "/map",           priority: 0.4,  changeFreq: "monthly" },
  { path: "/studios",       priority: 0.5,  changeFreq: "monthly" },
  { path: "/gear",          priority: 0.6,  changeFreq: "monthly" },
  { path: "/crew",          priority: 0.4,  changeFreq: "monthly" },
  { path: "/partners",      priority: 0.6,  changeFreq: "monthly" },
  { path: "/shows",         priority: 0.5,  changeFreq: "monthly" },
  { path: "/eras",          priority: 0.5,  changeFreq: "monthly" },
  { path: "/contact",       priority: 0.3,  changeFreq: "yearly" },
  { path: "/support",       priority: 0.3,  changeFreq: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [releases, artists, projects, brands] = await Promise.all([
    getReleaseSlugs(),
    getArtistSlugs(),
    getProjectSlugs(),
    getBrandSlugs(),
  ]);

  const dynamic: MetadataRoute.Sitemap = [
    ...releases.map((r) => ({
      url: `${ORIGIN}/releases/${r.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...artists.map((a) => ({
      url: `${ORIGIN}/artists/${a.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...projects.map((p) => ({
      url: `${ORIGIN}/eras/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...brands.map((b) => ({
      url: `${ORIGIN}/partners/${b.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];

  const staticUrls: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${ORIGIN}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));

  return [...staticUrls, ...dynamic];
}
