# Google Search Console — submission checklist

One-time setup so Google can find every page on thespacepit.com. Each
step is a click; the whole thing takes ~10 minutes once you have the
Google account ready.

## 1. Add the property

1. Go to https://search.google.com/search-console
2. Sign in with the Google account that should own search analytics
   (probably your main one — whichever you check email on)
3. Top-left "property" dropdown → **Add property**
4. Pick **URL prefix** (NOT Domain — URL prefix is easier and gives you
   the same data for a single subdomain)
5. Enter `https://thespacepit.com` and click **Continue**

## 2. Verify ownership

Google needs proof you control the site. Cheapest route on Vercel:

1. Pick the **HTML tag** verification method
2. Copy the meta tag it gives you — it looks like:
   `<meta name="google-site-verification" content="ABC123…" />`
3. Tell me the `content="…"` value and I'll add it to `app/layout.tsx`
   under the existing `<head>` tags, then push the deploy
4. Once Vercel finishes the deploy (~1 min), come back to Search Console
   and click **Verify**

(Alternative methods: DNS TXT record — more permanent but slower if your
DNS is at a registrar you don't log into often. Stick with HTML tag.)

## 3. Submit the sitemap

After verification:

1. Left sidebar → **Sitemaps**
2. Under "Add a new sitemap" enter: `sitemap.xml`
3. Click **Submit**

Google should pick up all **381 URLs** within 24-48 hours. The status
will show "Success" with the discovered URL count once they crawl it.

## 4. (Optional) Request indexing for key pages

For the pages you want indexed fastest (the homepage, calm-collect, the
big artists like Run The Jewels, KUSA when it drops):

1. Top search bar in Search Console → paste the URL
2. Click **Request indexing**

Manual requests get crawled in hours instead of days. Worth doing for:
- `/`
- `/calm-collect`
- `/calm-collect/upcoming` (gated; keep noindex)
- `/nick-hook`
- `/collabs`
- Whatever record is dropping next

## 5. What you're tracking afterward

Once Google starts indexing, the dashboard shows:

- **Performance** → impressions / clicks / position for every query.
  You'll find out which keywords are bringing people in (Nick Hook
  packs vs. KUSA vs. Old English etc.).
- **Coverage** → any pages that errored or got blocked. Should stay
  green; if it goes yellow, send me the page list and I'll fix.
- **Enhancements** → flags broken structured data. Our MusicAlbum +
  MusicGroup + Organization JSON-LD should all be valid; if anything
  shows up here we'll address it.

## When to come back

- 48h after submission → verify sitemap status = Success
- 1 week → first impressions should be appearing
- 30 days → real position data starts being useful

That's it. The site is already optimized for search (clean URLs, semantic
metadata, structured data, fast load). Search Console is just the
listening surface.
