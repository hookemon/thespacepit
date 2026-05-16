import type { Metadata } from "next";
import "./globals.css";
import { ListeningProvider } from "./_components/listening/ListeningProvider";
import { MiniPlayer } from "./_components/listening/MiniPlayer";

// Site-wide metadata defaults. Individual pages override via their own
// `export const metadata = {...}` — those wins, this fills the rest.
//
// metadataBase is CRITICAL — without it, Open Graph image URLs resolve
// relative to whatever domain the link's being shared on, which breaks
// previews everywhere. Hard-pin to the production origin.
export const metadata: Metadata = {
  metadataBase: new URL("https://thespacepit.com"),
  title: {
    default: "thespacepit — nick hook · the studio · calm + collect",
    template: "%s · thespacepit",
  },
  description:
    "thespacepit is nick hook's studio, label, and catalog — 15 years of records, brooklyn into medellín. RTJ co-prod, gold records, calm + collect since 2013.",
  applicationName: "thespacepit",
  authors: [{ name: "Nick Hook", url: "https://thespacepit.com/nick-hook" }],
  creator: "Nick Hook",
  publisher: "Calm + Collect",
  keywords: [
    "Nick Hook", "thespacepit", "Calm + Collect", "Run The Jewels",
    "Cu4tro", "Gangsta Boo", "Cubic Zirconia", "Brooklyn producer",
    "music producer", "sample packs", "music studio brooklyn",
  ],
  openGraph: {
    type: "website",
    siteName: "thespacepit",
    url: "https://thespacepit.com",
    title: "thespacepit — nick hook · the studio · calm + collect",
    description:
      "the studio. the label. the catalog. 15 years of records, brooklyn into medellín.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "thespacepit",
    description:
      "the studio. the label. the catalog. 15 years of records, brooklyn into medellín.",
    creator: "@nickhook",
  },
  // Don't index the distro one-sheet routes or the export tools.
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      {/* The ListeningProvider wraps the whole app so any track row anywhere
          can pipe audio to the singleton player. The MiniPlayer renders only
          when something's loaded — sticky bottom bar, persists across
          navigation. */}
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <ListeningProvider>
          {children}
          <MiniPlayer />
        </ListeningProvider>
      </body>
    </html>
  );
}
