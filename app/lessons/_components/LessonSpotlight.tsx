"use client";

// Shared "what should be glowing right now" state for a lab room. The active
// LessonPanel writes the current step's target identifier here; individual UI
// pieces (knobs, step buttons, pads) read it and add the pulsing-glow class
// when their identifier matches.
//
// Target identifiers are free-form strings — typically "ROOM:THING:ID":
//   "909:step:BD:0"        — first step button of the BD row
//   "909:pad:BD"           — the BD pad in the voice strip
//   "moog:knob:SUB"        — the SUB knob on the moog
//
// Steps with no target are fine — the spotlight just stays empty.

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type Ctx = {
  target: string | null;
  setTarget: (t: string | null) => void;
  isActive: (id: string | undefined) => boolean;
};

const SpotlightContext = createContext<Ctx | null>(null);

export function LessonSpotlightProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<string | null>(null);
  const value = useMemo<Ctx>(() => ({
    target,
    setTarget,
    isActive: (id) => !!id && id === target,
  }), [target]);
  return <SpotlightContext.Provider value={value}>{children}</SpotlightContext.Provider>;
}

// Returns no-op handlers when used outside a provider so leaf components
// don't have to special-case it.
export function useSpotlight(): Ctx {
  return useContext(SpotlightContext) ?? {
    target: null,
    setTarget: () => {},
    isActive: () => false,
  };
}

// Convenience class helper — returns the CSS class to apply when this
// element is the active target.
export function spotlightCls(isActive: boolean) {
  return isActive ? "spotlight-on" : "";
}
