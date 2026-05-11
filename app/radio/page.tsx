import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { getCollection } from "../_lib/discogs";
import { FOOTER_LINKS } from "../_lib/social-links";
import { RadioClient } from "./RadioClient";

export const revalidate = 3600;

export const metadata = {
  title: "the radio — thespacepit",
  description: "nick's record collection as a station. random pulls from the crate, top youtube match for each. press play.",
};

export default async function RadioPage() {
  const { total, records } = await getCollection();
  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1">
        <header className="px-5 sm:px-8 pt-16 pb-8 border-b border-paper">
          <div className="font-mono text-[11px] tracking-[.14em] uppercase text-lamp mb-2">
            THE RADIO · {total.toLocaleString()} RECORDS FROM THE CRATE
          </div>
          <h1
            className="font-display font-bold uppercase m-0"
            style={{ fontSize: "clamp(56px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.02em" }}
          >
            the radio
          </h1>
          <p className="font-serif italic text-[20px] mt-4 max-w-[760px] text-paper-2">
            random pull from nick&apos;s discogs collection. youtube finds the top match. press play to start the station — skip whenever, reshuffle when the mood changes.
          </p>
        </header>

        {records.length > 0 ? (
          <RadioClient records={records} />
        ) : (
          <div className="px-5 sm:px-8 py-16">
            <p className="font-serif italic text-[20px] text-paper-2">
              the crate is empty — check the discogs connection.
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
