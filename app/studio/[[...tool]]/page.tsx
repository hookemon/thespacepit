"use client";

/**
 * Embedded Sanity Studio. Visit /studio to access the admin dashboard.
 * Configuration lives in /sanity.config.ts.
 */

import { NextStudio } from "next-sanity/studio";
import config from "../../../sanity.config";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
