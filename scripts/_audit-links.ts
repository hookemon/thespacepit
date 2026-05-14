/* eslint-disable no-console */
/**
 * Site link audit — pulls sitemap.xml from the running dev server, hits
 * every URL, reports anything that doesn't return 2xx/3xx.
 *
 * Pre-req: dev server running on localhost:3000 (or set AUDIT_BASE_URL).
 * Run: `npx tsx scripts/_audit-links.ts`
 */

const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";

type Result = { url: string; status: number; ok: boolean; ms: number };

async function hit(url: string, retries = 2): Promise<Result> {
  const t = Date.now();
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { method: "GET", redirect: "manual" });
      return {
        url,
        status: res.status,
        ok: res.status >= 200 && res.status < 400,
        ms: Date.now() - t,
      };
    } catch {
      if (i === retries) return { url, status: 0, ok: false, ms: Date.now() - t };
      await new Promise((r) => setTimeout(r, 250 * (i + 1)));
    }
  }
  return { url, status: 0, ok: false, ms: Date.now() - t };
}

async function main() {
  console.log(`Pulling sitemap from ${BASE}/sitemap.xml…`);
  const sitemapRes = await fetch(`${BASE}/sitemap.xml`);
  if (!sitemapRes.ok) {
    console.error(`Sitemap fetch failed: ${sitemapRes.status}`);
    process.exit(1);
  }
  const xml = await sitemapRes.text();
  // Lift every <loc>…</loc> out of the XML. Replace the prod origin with
  // the dev base so we're testing the local server, not prod.
  const PROD = "https://thespacepit.com";
  const locs = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g)).map((m) =>
    m[1].replace(PROD, BASE),
  );
  console.log(`→ ${locs.length} URLs in sitemap`);

  const results: Result[] = [];
  // Lower concurrency so the dev server doesn't drop sockets under load.
  const batchSize = 4;
  for (let i = 0; i < locs.length; i += batchSize) {
    const batch = locs.slice(i, i + batchSize);
    const r = await Promise.all(batch.map(hit));
    results.push(...r);
    process.stdout.write(`\r  ${results.length}/${locs.length}`);
  }
  process.stdout.write("\n");

  const bad = results.filter((r) => !r.ok);
  const slow = results.filter((r) => r.ms > 5000);
  console.log(`\n✓ OK:    ${results.length - bad.length}`);
  console.log(`✗ NOT OK: ${bad.length}`);
  console.log(`⚠ SLOW (>5s): ${slow.length}`);
  for (const b of bad) {
    console.log(`  [${b.status || "ERR"}] ${b.url} (${b.ms}ms)`);
  }
  if (slow.length > 0) {
    console.log("\nSlowest 5:");
    for (const s of [...slow].sort((a, b) => b.ms - a.ms).slice(0, 5)) {
      console.log(`  ${s.ms}ms ${s.url}`);
    }
  }
  if (bad.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
