import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { NHHero } from "./_components/Hero";
import { NHReleaseGrid } from "./_components/ReleaseGrid";
import { NHLiveCatalogue } from "./_components/LiveCatalogue";
import { NHPressWall } from "./_components/PressWall";
import { NHErasStrip } from "./_components/ErasStrip";
import { NHHighlights } from "./_components/Highlights";
import { NHProductionCredits } from "./_components/ProductionCredits";
import { FOOTER_LINKS } from "../_lib/social-links";

export const metadata = {
  title: "nick hook",
  description: "producer · dj · engineer · collaborator. brooklyn → medellín, est. 2011.",
};

export default function NickHookPage() {
  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="nick" />
      <main className="flex-1">
        <NHHero />
        <NHReleaseGrid />
        <NHProductionCredits />
        <NHHighlights />
        <NHLiveCatalogue />
        <NHPressWall />
      </main>
      <Footer
        theme="dark"
        signoff="see u in the pit 🌱"
        meta="booking · coleman@smooth-loop.com"
        links={[...FOOTER_LINKS.nick]}
        id="contact"
      />
    </div>
  );
}
