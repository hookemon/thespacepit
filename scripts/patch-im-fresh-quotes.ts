/**
 * Drop the Gangsta Boo + Nick Hook quotes into the CC007 I'm Fresh liner notes.
 * Both render as blockquotes with attribution lines.
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const quoteBoo =
  "I just remember Nick playing some beats we were vibing at thespacepit studio but nothing was sticking to me, so we decided to create on the spot, piece by piece. I didn't have to write any of the lyrics down because the beat wrote for me, so it was easy to freestyle off the dome. I used my voice like a record to create scratching sounds and we added harmonica and guitar, just to be different. Why not? I just kept hearing more and more as the track went on. Me and Nick overthink things a lot because we're perfectionists with our sounds. I was just thinking about everything that I was doing and how I was feeling at the time while stoned and that's how 'I'm Fresh' was made: two fresh people in the room together with a microphone.";

const quoteNick =
  "'I'm Fresh' was created together during sessions that Boo and I had together this year. Boo asked me to make a beat on the spot. I did it in front of her then she freestyled the whole fucking thing. It was an incredible process.";

function block(text: string, style: "normal" | "blockquote", key: string) {
  return {
    _type: "block",
    _key: key,
    style,
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
  };
}

async function main() {
  const release = await client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "release" && slug.current == "cc007-im-fresh"][0]{ _id, title }`
  );
  if (!release) {
    console.error("CC007 not found");
    process.exit(1);
  }

  const notes = [
    block(quoteBoo, "blockquote", "q1"),
    block("— Gangsta Boo", "normal", "a1"),
    block("", "normal", "spacer"),
    block(quoteNick, "blockquote", "q2"),
    block("— Nick Hook", "normal", "a2"),
  ];

  await client.patch(release._id).set({ notes }).commit({ autoGenerateArrayKeys: true });
  console.log(`✓ added quotes to ${release.title}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
