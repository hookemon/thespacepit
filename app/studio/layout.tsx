/**
 * Studio layout — bypasses the site theme so Sanity Studio renders cleanly
 * without inheriting our custom typography or backgrounds.
 */

export { metadata, viewport } from "next-sanity/studio";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
