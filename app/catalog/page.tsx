import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getCatalogForArtist } from "../_lib/sanity-queries";
import { FOOTER_LINKS } from "../_lib/social-links";
import { CatalogClient } from "./CatalogClient";

export const revalidate = 60;

export const metadata = {
  title: "the catalog — nick hook",
  description:
    "everything nick has been on. label releases, production credits, mixes, remixes, appearances. chronological. filterable.",
};

export default async function CatalogPage() {
  const items = await getCatalogForArtist("nick-hook");

  const productionCount = items.filter((i) => i.roleSet === "production").length;
  const mixCount = items.filter((i) => i.roleSet === "mix").length;
  const labelCount = items.filter((i) => i.roleSet === "label").length;

  return (
    <>
      <TopNav current="nick" />
      <main className="flex-1 bg-paper text-ink">
        <header className="px-8 pt-16 pb-10 border-b-2 border-ink">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">
            EVERYTHING NICK&apos;S BEEN ON · {items.length} ENTRIES
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            the catalog
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[760px]">
            label releases, production work, mixes, remixes, appearances. {labelCount} on calm + collect · {productionCount} produced · {mixCount} mixed · the rest. chronological, filterable, every entry clicks into its world.
          </p>
        </header>

        <CatalogClient items={items} />
      </main>
      <Footer
        theme="dark"
        signoff="see u in the pit 🌱"
        meta="booking · coleman@smooth-loop.com"
        links={[...FOOTER_LINKS.nick]}
      />
    </>
  );
}
