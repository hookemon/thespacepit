import { IntiCover06, IntiCover06SamplePack, IntiKusaBanner, IntiKusaBannerStemPack } from "../../_components/releases/IntiCover06";

/**
 * Headless-render route for cover art export. Renders ONE cover, full-bleed,
 * no nav / no footer / no chrome — so we can screenshot it at print resolution
 * (3000×3000 for Bandcamp / DSP delivery).
 *
 * Usage:
 *   /cover-export/kusa  → KUSA / Cover 06 (team-approved dark mixtape disc)
 *
 * Add more entries to the map below as new releases get their own live covers.
 */

const COVERS: Record<string, () => React.ReactElement> = {
  kusa: () => <IntiCover06 />,
  "kusa-sample-pack": () => <IntiCover06SamplePack />,
  "kusa-banner": () => <IntiKusaBanner />,
  "kusa-banner-stem-pack": () => <IntiKusaBannerStemPack />,
};

// Disable indexing — this route is internal tooling.
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function CoverExportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cover = COVERS[slug];
  if (!cover) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <p>no live cover registered for slug &quot;{slug}&quot;.</p>
        <p>known: {Object.keys(COVERS).join(", ")}</p>
      </main>
    );
  }
  return (
    <main
      style={{
        margin: 0,
        padding: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#0B0B0B",
      }}
    >
      {/* Full-width wrapper. Each cover component sets its own aspect-ratio
          via `aspectRatio` style — square covers (Cover 06 etc.) and wide
          banners (KUSA banner) all render correctly by sizing the browser
          window to match the cover's intended ratio at export time. */}
      <div
        style={{
          width: "100vw",
          margin: "0 auto",
        }}
      >
        {cover()}
      </div>
    </main>
  );
}
