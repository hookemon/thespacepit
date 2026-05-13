import type { Metadata } from "next";
import "./globals.css";
import { ListeningProvider } from "./_components/listening/ListeningProvider";
import { MiniPlayer } from "./_components/listening/MiniPlayer";

export const metadata: Metadata = {
  title: "thespacepit",
  description: "the studio. the youtube channel. the discord. brooklyn → medellín.",
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
