import { NewsletterForm } from "./NewsletterForm";

type Theme = "dark" | "paper";

type Props = {
  source: string;
  audienceId?: string;
  theme?: Theme;
  eyebrow?: string;
  heading?: string;
  blurb?: string;
  /** Show a top border. Default true. Pass false when the section above already
   *  ends with a strong divider (e.g. another section with `border-b-2`). */
  topBorder?: boolean;
};

export function NewsletterSection({
  source,
  audienceId,
  theme = "dark",
  eyebrow = "STAY IN THE LOOP · NEWSLETTER",
  heading = "first dibs on drops",
  blurb = "new pack drops, sessions, behind-the-scenes — first in your inbox. no spam, no sales.",
  topBorder = true,
}: Props) {
  const wrap =
    theme === "dark"
      ? `px-5 sm:px-8 py-14 sm:py-16 bg-ink text-paper${topBorder ? " border-t border-paper/30" : ""}`
      : `px-5 sm:px-8 py-14 sm:py-16 bg-paper text-ink${topBorder ? " border-t-2 border-ink" : ""}`;
  const eyebrowColor = "text-lamp";
  const blurbColor = theme === "dark" ? "text-on-dark" : "text-ink-3";

  return (
    <section className={wrap}>
      <div className="max-w-[1180px] mx-auto">
        <div className={`font-mono text-[11px] tracking-[.14em] uppercase ${eyebrowColor}`}>
          {eyebrow}
        </div>
        <h2
          className="font-display font-bold uppercase m-0 mt-2"
          style={{
            fontSize: "clamp(32px, 5vw, 64px)",
            lineHeight: 0.92,
            letterSpacing: "-0.015em",
          }}
        >
          {heading}
        </h2>
        <p
          className={`font-serif italic mt-3 max-w-[640px] ${blurbColor}`}
          style={{ fontSize: 18, lineHeight: 1.4 }}
        >
          {blurb}
        </p>
        <div className="mt-6">
          <NewsletterForm source={source} audienceId={audienceId} />
        </div>
      </div>
    </section>
  );
}
