// "The pit" — the spacepit world's home page. Previously at /; moved here
// so the root URL (/) can serve as the pop-up campaign landing while still
// keeping the full spacepit experience reachable in one click.
//
// Routing summary:
//   /         → pop-up landing (date drop + sign-up)
//   /the-pit  → THIS page — spacepit world home (hero + room + discord + newsletter)
//   /nick-hook → nick hook world
//   /calm-collect → label world
//
// When the pop-up campaign winds down, just rename this file back to / and
// move the pop-up content to its own route.
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { NewsletterSection } from "../_components/shared/NewsletterSection";
import { Hero } from "../_components/Hero";
import { DiscordStrip } from "../_components/DiscordStrip";
import { StudioClients } from "../_components/StudioClients";
import { FOOTER_LINKS } from "../_lib/social-links";

export default async function ThePitHome() {
  return (
    <>
      <TopNav current="spacepit" />
      <main className="flex-1">
        <Hero />
        <StudioClients />
        <DiscordStrip />

        <NewsletterSection
          source="the-pit"
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
