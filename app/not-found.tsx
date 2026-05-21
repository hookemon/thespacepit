/**
 * Site-wide 404 — what shows for any URL that doesn't match a route.
 *
 * Next.js App Router convention: `app/not-found.tsx` at the root of the
 * app catches all unmatched URLs and renders inside the root layout, so
 * we still get <ListeningProvider> + <MiniPlayer> on this page.
 *
 * Client component so we can show the user the path they tried via
 * `usePathname`. (Server `headers()` only gives us host, not pathname.)
 *
 * Per the docs: not-found returns 404 for non-streamed responses, which
 * Google et al see for SEO; the page itself is the on-brand UX.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TopNav } from "./_components/shared/TopNav";
import { Footer } from "./_components/shared/Footer";
import { FOOTER_LINKS } from "./_lib/social-links";

export default function NotFound() {
  const path = usePathname();

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col">
      <TopNav current="spacepit" />
      <main className="flex-1 flex flex-col justify-center px-5 sm:px-8 py-16 max-w-[1180px] mx-auto w-full">
        <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-3 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-lamp" aria-hidden />
          404 · off the grid
        </div>

        <h1
          className="font-display font-black uppercase leading-[0.9] tracking-[-0.02em] m-0 text-paper"
          style={{ fontSize: "clamp(56px, 13vw, 180px)" }}
        >
          you wandered
          <br />
          out of the pit.
        </h1>

        <p
          className="font-serif italic text-on-dark mt-6 max-w-[640px]"
          style={{ fontSize: "clamp(17px, 2vw, 22px)", lineHeight: 1.45 }}
        >
          that link&rsquo;s either from the old internet or somebody fat-fingered a URL.
          either way — three ways back in, plus a few jump-offs below.
        </p>

        {path && path !== "/" && (
          <p className="font-mono text-[11px] tracking-[.14em] uppercase text-mute mt-5">
            you tried: <span className="text-paper">{path}</span>
          </p>
        )}

        {/* Three worlds — the same three the random-router pulls from. */}
        <div className="flex flex-col sm:flex-row gap-3 mt-10">
          <Link
            href="/the-pit"
            className="group inline-flex items-center justify-between gap-4 bg-lamp text-ink px-5 py-4 font-display font-bold uppercase tracking-tight text-[18px] no-underline border-2 border-ink hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_#0B0B0B] transition-all"
          >
            pull up to the pit
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          <Link
            href="/nick-hook"
            className="group inline-flex items-center justify-between gap-4 bg-paper text-ink px-5 py-4 font-display font-bold uppercase tracking-tight text-[18px] no-underline border-2 border-paper hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_#F2B705] transition-all"
          >
            nick hook
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          <Link
            href="/calm-collect"
            className="group inline-flex items-center justify-between gap-4 bg-collect text-paper px-5 py-4 font-display font-bold uppercase tracking-tight text-[18px] no-underline border-2 border-paper hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_#F2B705] transition-all"
          >
            calm + collect
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {/* Quick-jumps for visitors who came here looking for a specific shelf. */}
        <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] tracking-[.16em] uppercase text-mute">
          <span>or jump to —</span>
          <Link href="/catalog" className="text-paper hover:text-lamp transition-colors">
            the catalogue
          </Link>
          <span className="text-ink-3">·</span>
          <Link href="/press" className="text-paper hover:text-lamp transition-colors">
            press archive
          </Link>
          <span className="text-ink-3">·</span>
          <Link href="/sessions" className="text-paper hover:text-lamp transition-colors">
            book a session
          </Link>
          <span className="text-ink-3">·</span>
          <Link href="/listening" className="text-paper hover:text-lamp transition-colors">
            what&rsquo;s in the crate
          </Link>
        </div>
      </main>

      <Footer
        theme="dark"
        heptagon="fill-white"
        signoff="see u in the pit 🪐"
        meta="brooklyn · medellín · since 2011"
        links={[...FOOTER_LINKS.spacepit]}
      />
    </div>
  );
}
