import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getCollection } from "../_lib/discogs";
import { FOOTER_LINKS } from "../_lib/social-links";
import { ListeningClient } from "./ListeningClient";

// Refresh once an hour at the page level; the underlying fetcher revalidates
// every 12 hours, so a deeper refresh comes from the data layer.
export const revalidate = 3600;

export const metadata = {
  title: "listening room — thespacepit",
  description:
    "nick's record collection — what's in the crates. logged through discogs, surfaced here.",
};

export default async function ListeningPage() {
  const { total, records } = await getCollection();

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        <header className="px-8 pt-16 pb-10 border-b border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">
            THE LISTENING ROOM · LIVE FROM DISCOGS
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            what's in the crate
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[720px] text-paper-2">
            {total > 0
              ? `${total.toLocaleString()} records nick has logged in his discogs collection. influences, samples, things he keeps coming back to. click a cover to go deeper on discogs.`
              : "still pulling from discogs… refresh in a sec."}
          </p>
        </header>

        {total > 0 ? (
          <ListeningClient records={records} total={total} />
        ) : (
          <div className="px-8 py-16">
            <p className="font-serif italic text-[20px] text-paper-2">
              Discogs API didn&apos;t return any records. Check that the collection at{" "}
              <a
                href="https://www.discogs.com/user/nickhook/collection"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                discogs.com/user/nickhook/collection
              </a>{" "}
              is set to public.
            </p>
          </div>
        )}
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
