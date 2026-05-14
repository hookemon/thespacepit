/**
 * robots.txt — tells search-engine crawlers what to index and what to leave
 * alone. Allow everything by default; explicitly disallow the distro-pitch
 * pages + the internal cover-export route + admin Studio.
 */
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/calm-collect/upcoming",  // private distro pitch
          "/cover-export/",           // internal export route
          "/studio/",                 // Sanity Studio admin (if hosted here)
          "/api/",                    // server endpoints
        ],
      },
    ],
    sitemap: "https://thespacepit.com/sitemap.xml",
  };
}
