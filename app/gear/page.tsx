import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getGear } from "../_lib/sanity-queries";
import { FOOTER_LINKS } from "../_lib/social-links";
import { GearClient } from "./GearClient";

export const revalidate = 3600;

export const metadata = {
  title: "gear — thespacepit",
  description: "the shelf. drum machines, synths, samplers, modular, outboard, mics, dj, software. what's patched in right now.",
};

export default async function GearPage() {
  const items = await getGear();
  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        <header className="px-5 sm:px-8 pt-16 pb-10 border-b border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">
            THE SHELF · LIVE INVENTORY
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            the gear log
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[680px] text-paper-2">
            never turn anything off. if you pull up and something isn&apos;t patched in, patch it in.
            pick a category to drill in.
          </p>
        </header>

        <GearClient items={items} />
      </main>
      <Footer
        theme="paper"
        heptagon="fill-white"
        signoff="see u in the pit 🪐"
        meta="brooklyn · medellín · since 2011"
        links={[...FOOTER_LINKS.spacepit]}
      />
    </div>
  );
}
