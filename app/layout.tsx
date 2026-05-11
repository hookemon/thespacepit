import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
