import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getReleaseDossier, type WriterCredit, type DossierTrack } from "../../../_lib/sanity-queries";
import { urlFor } from "../../../_lib/sanity";
import { PortableText } from "../../../_components/shared/PortableText";
import { PrintButton } from "./PrintButton";

// PRIVATE — never cache, never index, never serve stale. Dossier holds
// publishing splits, IPIs, internal notes; the data shape must always be
// fresh from Sanity at request time.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Dossier — ${slug}`,
    robots: { index: false, follow: false, noarchive: true, nosnippet: true, noimageindex: true },
  };
}

export default async function DossierPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await getReleaseDossier(slug);
  if (!r) notFound();

  const coverUrl = r.cover ? urlFor(r.cover).width(600).height(600).fit("crop").url() : null;
  const dspLinks: Array<{ label: string; url: string }> = [
    { label: "Bandcamp", url: r.bandcampUrl ?? "" },
    { label: "Spotify", url: r.spotifyUrl ?? "" },
    { label: "Apple Music", url: r.appleMusicUrl ?? "" },
    { label: "Tidal", url: r.tidalUrl ?? "" },
    { label: "Deezer", url: r.deezerUrl ?? "" },
    { label: "YouTube", url: r.youtubeUrl ?? "" },
    { label: "YouTube Music", url: r.youtubeMusicUrl ?? "" },
    { label: "Amazon Music", url: r.amazonMusicUrl ?? "" },
    { label: "SoundCloud", url: r.soundcloudUrl ?? "" },
  ].filter((d) => d.url);

  // Album-wide writer split summary — sum writerCredits across every
  // track for at-a-glance distribution. Mostly useful for catalog-level
  // splits checks.
  const writerTotals = new Map<string, { share: number; pro?: string; ipiCae?: string; publisher?: string }>();
  let tracksWithSplits = 0;
  for (const t of r.tracklist ?? []) {
    if (!t.writerCredits || t.writerCredits.length === 0) continue;
    tracksWithSplits += 1;
    for (const wc of t.writerCredits) {
      const cur = writerTotals.get(wc.name) ?? { share: 0, pro: wc.pro, ipiCae: wc.ipiCae, publisher: wc.publisher };
      cur.share += wc.share ?? 0;
      writerTotals.set(wc.name, cur);
    }
  }

  return (
    <>
      {/* Print stylesheet — strip chrome when printing/saving as PDF */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .dossier-track { page-break-inside: avoid; }
          .dossier-header { page-break-after: avoid; }
        }
        @page { margin: 14mm 12mm; size: A4; }
        .dossier-track:not(:last-child) { border-bottom: 1px solid #d4cfc4; }
      `}</style>

      <main className="min-h-screen bg-[#F4EFE6] text-[#0B0B0B] font-[var(--font-instrument-serif)] px-6 py-8 print:px-0 print:py-0">
        <div className="mx-auto max-w-[900px]">

          {/* Confidential banner + action bar (hidden in print) */}
          <div className="no-print mb-6 flex items-start justify-between gap-4 border-2 border-[#E83A1C] bg-[#FFF5F3] p-4">
            <div>
              <div className="font-[var(--font-antonio)] tracking-wider text-[#E83A1C] text-sm font-bold">
                🔒 CONFIDENTIAL DOSSIER · NOT FOR DISTRIBUTION
              </div>
              <div className="text-xs text-[#5a5a5a] mt-1">
                Includes private publishing data (splits, IPI/CAE, internal notes). Share via secure channel only.
                This page is noindex/noarchive but URL is not currently auth-gated — add a token check before sharing the link publicly.
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <PrintButton />
              <Link href={`/releases/${slug}`} className="text-xs underline text-[#5a5a5a]">← back to public page</Link>
            </div>
          </div>

          {/* Header */}
          <header className="dossier-header mb-8">
            <div className="font-[var(--font-jetbrains-mono)] text-xs uppercase tracking-widest text-[#5a5a5a] mb-2">
              {[r.catalogNumber, r.releaseDate ?? r.year, r.format, r.label, r.status?.toUpperCase()].filter(Boolean).join(" · ")}
            </div>
            <h1 className="font-[var(--font-antonio)] text-5xl md:text-6xl font-black uppercase leading-none tracking-tight">
              {r.title}
            </h1>
            <div className="font-[var(--font-antonio)] text-xl mt-2 uppercase tracking-wide">
              {r.artists.map((a) => a.name).join(" · ")}
            </div>
          </header>

          {/* Cover + Identifiers grid */}
          <section className="grid grid-cols-[1fr_2fr] gap-6 mb-8">
            <div>
              {coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt={`${r.title} cover`} className="w-full aspect-square object-cover shadow-[6px_6px_0_#0B0B0B]" />
              )}
            </div>
            <div className="font-[var(--font-jetbrains-mono)] text-sm">
              <table className="w-full border-collapse">
                <tbody>
                  {row("UPC", r.upc)}
                  {row("Catalog #", r.catalogNumber)}
                  {row("Release Date", r.releaseDate ?? (r.year ? String(r.year) : null))}
                  {row("Format", r.format)}
                  {row("Label", r.label)}
                  {row("Original Label", r.originalLabel)}
                  {row("Genre", [r.genre, r.subgenre].filter(Boolean).join(" / "))}
                  {row("Language", r.language)}
                  {row("℗", r.pCopyright)}
                  {row("©", r.cCopyright)}
                  {row("Tracks", r.tracklist?.length ? String(r.tracklist.length) : null)}
                </tbody>
              </table>
            </div>
          </section>

          {/* DSP links */}
          {dspLinks.length > 0 && (
            <section className="mb-8">
              <h2 className="font-[var(--font-antonio)] text-2xl uppercase tracking-wide mb-2 border-b border-[#0B0B0B] pb-1">Distribution</h2>
              <ul className="font-[var(--font-jetbrains-mono)] text-sm grid grid-cols-2 gap-y-1 gap-x-4">
                {dspLinks.map((d) => (
                  <li key={d.label}><span className="font-bold">{d.label}:</span> <span className="break-all text-[#5a5a5a]">{d.url}</span></li>
                ))}
              </ul>
            </section>
          )}

          {/* Tracklist with full per-track payload */}
          <section className="mb-8">
            <h2 className="font-[var(--font-antonio)] text-2xl uppercase tracking-wide mb-2 border-b border-[#0B0B0B] pb-1">
              Tracklist — {r.tracklist?.length ?? 0} tracks
            </h2>
            {!r.tracklist || r.tracklist.length === 0 ? (
              <p className="text-sm italic text-[#5a5a5a]">No tracklist on record.</p>
            ) : (
              <ol className="list-none p-0 m-0">
                {r.tracklist.map((t, i) => (
                  <li key={i} className="dossier-track py-4">
                    <TrackBlock idx={i + 1} track={t} />
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Album-wide writer splits summary */}
          {writerTotals.size > 0 && (
            <section className="mb-8">
              <h2 className="font-[var(--font-antonio)] text-2xl uppercase tracking-wide mb-2 border-b border-[#0B0B0B] pb-1">
                Album-wide Writer Totals
              </h2>
              <div className="text-xs text-[#5a5a5a] mb-2 font-[var(--font-jetbrains-mono)]">
                Sum of writerCredits.share across {tracksWithSplits} track{tracksWithSplits === 1 ? "" : "s"}.
                Each track sums to 100% — totals here = share count × tracks.
              </div>
              <table className="w-full border-collapse font-[var(--font-jetbrains-mono)] text-sm">
                <thead>
                  <tr className="border-b border-[#0B0B0B]">
                    <th className="text-left py-1">Writer</th>
                    <th className="text-left py-1">PRO</th>
                    <th className="text-left py-1">IPI/CAE</th>
                    <th className="text-left py-1">Publisher</th>
                    <th className="text-right py-1">Sum share</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(writerTotals.entries())
                    .sort((a, b) => b[1].share - a[1].share)
                    .map(([name, info]) => (
                      <tr key={name} className="border-b border-[#d4cfc4]">
                        <td className="py-1">{name}</td>
                        <td className="py-1">{info.pro ?? "—"}</td>
                        <td className="py-1">{info.ipiCae ?? "—"}</td>
                        <td className="py-1">{info.publisher ?? "—"}</td>
                        <td className="py-1 text-right">{info.share}%</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Public credits */}
          {r.credits && r.credits.length > 0 && (
            <section className="mb-8">
              <h2 className="font-[var(--font-antonio)] text-2xl uppercase tracking-wide mb-2 border-b border-[#0B0B0B] pb-1">Credits</h2>
              <ul className="font-[var(--font-jetbrains-mono)] text-sm space-y-1">
                {r.credits.map((c, i) => (
                  <li key={i}>
                    <span className="font-bold">{c.role}:</span>{" "}
                    {c.person?.name ?? c.name ?? "—"}
                    {c.instrument ? <span className="text-[#5a5a5a]"> ({c.instrument})</span> : null}
                    {c.tracks && c.tracks.length > 0 ? <span className="text-[#5a5a5a]"> — on {c.tracks.join(", ")}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Liner notes / story */}
          {r.notes && Array.isArray(r.notes) && r.notes.length > 0 && (
            <section className="mb-8">
              <h2 className="font-[var(--font-antonio)] text-2xl uppercase tracking-wide mb-2 border-b border-[#0B0B0B] pb-1">Liner Notes</h2>
              <div className="prose prose-sm max-w-none font-[var(--font-instrument-serif)] text-base leading-relaxed">
                <PortableText value={r.notes as never} />
              </div>
            </section>
          )}

          {/* Internal notes — flagged PRIVATE */}
          {r.internalNotes && (
            <section className="mb-8">
              <h2 className="font-[var(--font-antonio)] text-2xl uppercase tracking-wide mb-2 border-b border-[#E83A1C] pb-1 text-[#E83A1C]">
                Internal Notes (PRIVATE)
              </h2>
              <pre className="font-[var(--font-jetbrains-mono)] text-sm whitespace-pre-wrap bg-[#FFF5F3] border border-[#E83A1C] p-3">
                {r.internalNotes}
              </pre>
            </section>
          )}

          {/* Footer */}
          <footer className="font-[var(--font-jetbrains-mono)] text-xs text-[#5a5a5a] mt-12 pt-4 border-t border-[#d4cfc4]">
            Generated by thespacepit · {new Date().toISOString().slice(0, 10)} · slug: {slug}
          </footer>
        </div>
      </main>
    </>
  );
}

function row(label: string, value: string | null | undefined) {
  if (!value) return null;
  return (
    <tr className="border-b border-[#d4cfc4]">
      <td className="py-1 pr-4 text-[#5a5a5a] uppercase text-xs whitespace-nowrap align-top">{label}</td>
      <td className="py-1 break-all">{value}</td>
    </tr>
  );
}

function TrackBlock({ idx, track }: { idx: number; track: DossierTrack }) {
  const features = track.features && track.features.length > 0 ? track.features : track.feature ? [track.feature] : [];
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="font-[var(--font-jetbrains-mono)] text-xs text-[#5a5a5a]">{String(idx).padStart(2, "0")}</span>
        <h3 className="font-[var(--font-antonio)] text-lg uppercase font-bold flex-1">
          {track.title}
          {features.length > 0 && (
            <span className="font-normal text-[#5a5a5a]"> feat. {features.join(", ")}</span>
          )}
          {track.remixer && <span className="font-normal text-[#5a5a5a]"> ({track.remixer})</span>}
        </h3>
        <span className="font-[var(--font-jetbrains-mono)] text-xs text-[#5a5a5a]">{track.duration ?? "—"}</span>
      </div>
      <div className="font-[var(--font-jetbrains-mono)] text-xs text-[#5a5a5a] flex flex-wrap gap-x-4 gap-y-1 mb-2 ml-9">
        {track.isrc && <span><span className="uppercase">ISRC:</span> {track.isrc}</span>}
        {track.bpm != null && <span><span className="uppercase">BPM:</span> {track.bpm}</span>}
        {track.explicit && <span className="text-[#E83A1C] font-bold">EXPLICIT</span>}
      </div>

      {track.writerCredits && track.writerCredits.length > 0 && (
        <div className="ml-9 mb-2">
          <div className="font-[var(--font-jetbrains-mono)] text-xs uppercase text-[#5a5a5a] mb-1">Writer Splits</div>
          <table className="w-full border-collapse font-[var(--font-jetbrains-mono)] text-xs">
            <thead>
              <tr className="border-b border-[#0B0B0B]">
                <th className="text-left py-1 pr-2">Writer</th>
                <th className="text-left py-1 pr-2">PRO</th>
                <th className="text-left py-1 pr-2">IPI/CAE</th>
                <th className="text-left py-1 pr-2">Publisher</th>
                <th className="text-left py-1 pr-2">Pub PRO</th>
                <th className="text-left py-1 pr-2">Pub IPI</th>
                <th className="text-right py-1">Share</th>
              </tr>
            </thead>
            <tbody>
              {track.writerCredits.map((wc: WriterCredit, j) => (
                <tr key={j} className="border-b border-[#d4cfc4]">
                  <td className="py-1 pr-2">{wc.name}</td>
                  <td className="py-1 pr-2">{wc.pro ?? "—"}</td>
                  <td className="py-1 pr-2">{wc.ipiCae ?? "—"}</td>
                  <td className="py-1 pr-2">{wc.publisher ?? "—"}</td>
                  <td className="py-1 pr-2">{wc.publisherPro ?? "—"}</td>
                  <td className="py-1 pr-2">{wc.publisherIpiCae ?? "—"}</td>
                  <td className="py-1 text-right">{wc.share != null ? `${wc.share}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#0B0B0B]">
                <td colSpan={6} className="py-1 text-right uppercase text-[#5a5a5a]">Total</td>
                <td className="py-1 text-right font-bold">
                  {track.writerCredits.reduce((s: number, wc: WriterCredit) => s + (wc.share ?? 0), 0)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {track.lyrics && (
        <details className="ml-9 mt-2">
          <summary className="font-[var(--font-jetbrains-mono)] text-xs uppercase text-[#5a5a5a] cursor-pointer">Lyrics</summary>
          <pre className="font-[var(--font-instrument-serif)] text-sm whitespace-pre-wrap mt-2 leading-relaxed">{track.lyrics}</pre>
        </details>
      )}
    </div>
  );
}
