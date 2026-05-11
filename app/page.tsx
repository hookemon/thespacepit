import { TopNav } from "./_components/shared/TopNav";
import { Footer } from "./_components/shared/Footer";
import { Hero } from "./_components/Hero";
import { VideoGrid } from "./_components/VideoGrid";
import { GearShelf } from "./_components/GearShelf";
import { DiscordStrip } from "./_components/DiscordStrip";
import { StudioClients } from "./_components/StudioClients";
import { FOOTER_LINKS } from "./_lib/social-links";

export default function SpacepitHome() {
  return (
    <>
      <TopNav current="spacepit" />
      <main className="flex-1">
        <Hero />
        <VideoGrid />
        <GearShelf />
        <StudioClients />
        <DiscordStrip />
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
