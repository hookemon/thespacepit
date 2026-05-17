/**
 * Root router — every visit to thespacepit.com lands on a random world.
 *
 * One time it's Nick Hook (the artist). One time it's the pit (the
 * studio + YouTube + Discord). One time it's Calm + Collect (the label).
 *
 * Server-side random pick per request. `dynamic = "force-dynamic"`
 * keeps the dice fresh — no caching, no ISR write, no sticky bias.
 * Each refresh / new visit = new world.
 *
 * Per Nick: "different every time."
 */
import { redirect } from "next/navigation";

const WORLDS = ["/nick-hook", "/the-pit", "/calm-collect"] as const;

export const dynamic = "force-dynamic";

// Soft metadata so any rare moment where this page renders (before the
// redirect kicks in) still has a clean title.
export const metadata = {
  title: "thespacepit",
  description:
    "nick hook · thespacepit studio · calm + collect. one site, three worlds, pulled at random every visit.",
};

export default function RootRouter() {
  const world = WORLDS[Math.floor(Math.random() * WORLDS.length)];
  redirect(world);
}
