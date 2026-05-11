import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { CCHero } from "./_components/Hero";
import { CCCatalogGrid } from "./_components/CatalogGrid";
import { CCArtistRoster } from "./_components/ArtistRoster";
import { CCCalllmStrip } from "./_components/CalllmStrip";
import { FOOTER_LINKS } from "../_lib/social-links";

export const metadata = {
  title: "calm + collect",
  description: "a record label · est. 2013 · ny → mde. cultivating records where the sound is shared.",
};

export default function CalmCollectPage() {
  return (
    <>
      <TopNav current="label" />
      <main className="flex-1">
        <CCHero />
        <CCCatalogGrid />
        <CCArtistRoster />
        <CCCalllmStrip />
      </main>
      <Footer
        theme="paper"
        heptagon="fill-black"
        signoff="stay high 💚"
        meta="calm + collect · a record label · 2013 → today"
        links={[...FOOTER_LINKS.label]}
        id="shop"
      />
    </>
  );
}
