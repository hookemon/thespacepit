import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getCatalogForArtist, getProjectBySlug } from "../_lib/sanity-queries";
import { FOOTER_LINKS } from "../_lib/social-links";
import { CatalogClient } from "./CatalogClient";

export const revalidate = 60;

export const metadata = {
  title: "the catalog — nick hook",
  description:
    "everything nick has been on. label releases, production credits, mixes, remixes, appearances. chronological. filterable.",
};

// Era pages link in here as `/catalog?era=cubic-zirconia` so visitors land on
// a CZ-only catalog. We resolve the era on the server, narrow `items` to the
// releases owned by that era's project doc, and render the same UI — so all
// the existing role-set chips, side-by-side view, etc. just work, only over a
// smaller set. The banner up top tells the visitor what they're looking at
// and offers a one-click escape back to the full catalog.
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ era?: string }>;
}) {
  const { era } = await searchParams;

  const [allItems, project] = await Promise.all([
    getCatalogForArtist("nick-hook"),
    era ? getProjectBySlug(era) : Promise.resolve(null),
  ]);

  // If the requested era exists AND has releases, narrow the catalog to that
  // set of release IDs. If the era exists but has no releases yet, still
  // narrow (to empty) so visitors see the right context — better than a
  // confusing full list with the wrong banner.
  const eraReleaseIds =
    project ? new Set((project.releases ?? []).map((r) => r._id)) : null;
  const items =
    eraReleaseIds ? allItems.filter((i) => eraReleaseIds.has(i._id)) : allItems;

  const productionCount = items.filter((i) => i.roleSet === "production").length;
  const mixCount = items.filter((i) => i.roleSet === "mix").length;
  const labelCount = items.filter((i) => i.roleSet === "label").length;

  return (
    <>
      <TopNav current="nick" />
      <main className="flex-1 bg-paper text-ink">
        <header className="px-5 sm:px-8 pt-16 pb-10 border-b-2 border-ink">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-redline mb-2">
            {project ? `${project.name.toUpperCase()} · CATALOG` : "EVERYTHING NICK'S BEEN ON"}
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            {project ? project.name.toLowerCase() : "the catalog"}
          </h1>
          {project ? (
            <>
              <p className="font-serif italic text-[20px] mt-4 max-w-[760px]">
                {items.length === 0
                  ? `no catalog entries tagged to ${project.name} yet — but the era page has the story.`
                  : `every release tagged to ${project.name}. ${items.length} entr${items.length === 1 ? "y" : "ies"}, chronological.`}
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                <Link
                  href="/catalog"
                  className="font-mono text-[11px] tracking-[.14em] uppercase px-3 py-1.5 border border-ink rounded-full hover:bg-ink hover:text-paper transition-colors no-underline"
                >
                  ← show full catalog
                </Link>
                <Link
                  href={`/eras/${era}`}
                  className="font-mono text-[11px] tracking-[.14em] uppercase px-3 py-1.5 border border-ink rounded-full hover:bg-ink hover:text-paper transition-colors no-underline"
                >
                  back to {project.name.toLowerCase()} era →
                </Link>
              </div>
            </>
          ) : (
            <p className="font-serif italic text-[20px] mt-4 max-w-[760px]">
              label releases, production work, mixes, remixes, appearances. {labelCount} on calm + collect · {productionCount} produced · {mixCount} mixed · the rest. chronological, filterable, every entry clicks into its world.
            </p>
          )}
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
