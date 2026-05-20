import Link from "next/link";
import { TopNav } from "../_components/shared/TopNav";
import { Footer } from "../_components/shared/Footer";
import { FOOTER_LINKS } from "../_lib/social-links";

export const metadata = {
  title: "m4l — devices for ableton live",
  description:
    "Max for Live devices built alongside thespacepit's practice playground. Same engines, dropped into your DAW.",
};

/**
 * The M4L tools rack. Each device is a downloadable folder with the patch
 * + jweb UI + setup notes. For now: HopChords (mirror of the web chord
 * generator). More to come.
 */
export default function M4LPage() {
  const TOOLS = [
    {
      slug: "HopChords",
      name: "HopChords",
      tagline: "13-city chord generator inside Live",
      status: "pending" as const,
      blurb:
        "The same chord generator at /practice/hop_chords. Drop it on a MIDI track, route to any synth or sampler, hit GENERATE. Live's tempo drives the cycle; SONG mode composes a full verse / pre / chorus / bridge / chorus.",
      files: [
        { name: "HopChords.maxpat", status: "missing", note: "the patch — Nick to upload from the build chat" },
        { name: "hop_chords_m4l.html", status: "ready", note: "the jweb UI embedded in the patch" },
        { name: "SETUP.md", status: "ready", note: "quick setup notes" },
      ],
      readmeHref: "/m4l/HopChords/SETUP.md",
      uiPreviewHref: "/m4l/HopChords/hop_chords_m4l.html",
    },
  ];

  return (
    <div className="bg-ink text-paper min-h-screen flex flex-col flex-1">
      <TopNav current="spacepit" />
      <main className="flex-1 px-6 sm:px-8 py-12">
        <div className="max-w-[1080px] mx-auto">
          <div className="font-mono text-[11px] tracking-[.18em] uppercase text-lamp mb-3">
            STUDIO ROOM · M4L
          </div>
          <h1
            className="font-display font-bold uppercase m-0 mb-4"
            style={{ fontSize: "clamp(40px, 8vw, 96px)", lineHeight: 0.92, letterSpacing: "-0.025em" }}
          >
            m4l tools
          </h1>
          <p className="font-serif italic text-[18px] sm:text-[20px] text-paper-2 max-w-[640px] mb-12">
            Same engines that run thespacepit.com/practice/, repackaged as Max for Live
            devices so you can run them inside Ableton. The web ones are free to play. These
            run with Live&apos;s tempo, route MIDI to any track, and live on a single device
            face in your rack.
          </p>

          <div className="grid gap-6">
            {TOOLS.map((tool) => (
              <article
                key={tool.slug}
                className="border-2 border-paper p-6 sm:p-8"
                style={{ boxShadow: "6px 6px 0 #F2B705" }}
              >
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
                  <h2
                    className="font-display font-bold uppercase m-0"
                    style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.01em" }}
                  >
                    {tool.name}
                  </h2>
                  <span
                    className="font-mono text-[10px] tracking-[.18em] uppercase"
                    style={{ color: tool.status === "pending" ? "#E83A1C" : "#7BD3A8" }}
                  >
                    {tool.status === "pending" ? "BUILD IN FLIGHT — patch upload pending" : "READY"}
                  </span>
                </div>
                <p className="font-mono text-[12px] tracking-[.12em] uppercase text-lamp mb-4">
                  {tool.tagline}
                </p>
                <p className="font-serif text-[16px] sm:text-[17px] text-paper mb-6 max-w-[680px]">
                  {tool.blurb}
                </p>

                <div className="grid gap-2 mb-6">
                  <div className="font-mono text-[10px] tracking-[.16em] uppercase text-paper-2">
                    BUNDLE · {tool.files.length} FILES
                  </div>
                  {tool.files.map((f) => (
                    <div key={f.name} className="flex items-baseline gap-3 flex-wrap">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: f.status === "ready" ? "#7BD3A8" : "#E83A1C" }}
                        aria-hidden
                      />
                      <span className="font-mono text-[13px] text-paper">{f.name}</span>
                      <span className="font-serif italic text-[13px] text-paper-2">— {f.note}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={tool.readmeHref}
                    className="inline-flex items-center font-mono text-[11px] tracking-[.14em] uppercase text-ink bg-lamp px-4 py-2.5 no-underline transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px]"
                    style={{ boxShadow: "2px 2px 0 #F4EFE6" }}
                  >
                    ↗ setup notes
                  </Link>
                  <Link
                    href={tool.uiPreviewHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center font-mono text-[11px] tracking-[.14em] uppercase text-paper border-2 border-paper px-4 py-2.5 no-underline transition-colors hover:bg-paper hover:text-ink"
                  >
                    ▶ preview the UI in a browser
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <p className="font-serif italic text-[15px] text-paper-2 mt-12 max-w-[640px]">
            More M4L devices on the way — the tom builder (gated drum synth), and a finger
            drum sampler shell once those builds wrap. For now: just HopChords as we light
            it up.
          </p>
        </div>
      </main>
      <Footer
        theme="dark"
        signoff="patch it. play it."
        meta="m4l · max for live"
        links={[...FOOTER_LINKS.spacepit]}
      />
    </div>
  );
}
