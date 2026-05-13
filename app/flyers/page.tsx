import { redirect } from "next/navigation";

// Short alias — Nick (and visitors) type /flyers, we send them to /wall
// (the canonical route, fits the studio-wall metaphor better).
export default function FlyersAliasPage() {
  redirect("/wall");
}
