"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
    posthog.init(key, {
      api_host: host,
      capture_pageview: "history_change",
      capture_pageleave: true,
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    });

    const handler = (e: Event) => {
      const el = (e.target as Element | null)?.closest?.("[data-track]");
      if (!el) return;
      const event = el.getAttribute("data-track");
      if (!event) return;
      let props: Record<string, unknown> = {};
      const raw = el.getAttribute("data-track-props");
      if (raw) { try { props = JSON.parse(raw); } catch { /* ignore */ } }
      posthog.capture(event, props);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);
  return null;
}
