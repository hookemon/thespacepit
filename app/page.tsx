import { TopNav } from "./_components/shared/TopNav";
import { Footer } from "./_components/shared/Footer";
import { NewsletterSection } from "./_components/shared/NewsletterSection";
import { Hero } from "./_components/Hero";
import { DiscordStrip } from "./_components/DiscordStrip";
import { StudioClients } from "./_components/StudioClients";
import { ThreeWorlds } from "./_components/ThreeWorlds";
import { FOOTER_LINKS } from "./_lib/social-links";

export default async function SpacepitHome() {
  return (
    <>
      <TopNav current="spacepit" />
      <main className="flex-1">
        {/* Three-worlds triptych — sits ABOVE the hero per Nick's call.
            Friends landing at thespacepit.com couldn't tell the site is
            Nick Hook + thespacepit + Calm + Collect (only one of the three
            is mentioned in the hero). This row makes the three worlds
            unmissable as the first thing on the page. */}
        <ThreeWorlds />
        {/* Hero flows straight into "in the room" — the photo-wall sections
            (VideoGrid, GearShelf, FromTheRoom) lived between them. Per Nick's
            call, those got pulled so the homepage reads as: 3-worlds →
            spacepit hero → the room → discord → newsletter. The picture-
            heavy content still lives at /watch, /gear, /studios. */}
        <Hero />
        <StudioClients />
        <DiscordStrip />

        <NewsletterSection
          source="home"
          heading="first dibs on everything"
          blurb="new pack drops, sessions, mixes, behind-the-scenes from the pit — first in your inbox. no spam, no sales."
        />
      </main>
      <Footer
        theme="paper"
        heptagon="fill-white"
        signoff="see u in the pit 🪐"
        meta="brooklyn · medellín · since 2011"
        links={[...FOOTER_LINKS.spacepit]}
        id="visit"
      />
    </>
  );
}
