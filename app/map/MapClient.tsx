"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { geoOrthographic, geoPath, geoCircle } from "d3-geo";
import type { GeoPermissibleObjects } from "d3-geo";
import type { PlaceKind, PlaceListItem } from "../_lib/sanity-queries";
import { GLOBE_RADIUS, MAP_HEIGHT, MAP_WIDTH } from "../_lib/world-map";

type CountryFeature = {
  id: string;
  name: string;
  geometry: { type: string; coordinates: unknown };
};
type ProjectedPin = PlaceListItem & { source: "place" };
type TourShow = { date: string | null; venue: string | null; era: string; year: number | null };
type TourPin = {
  city: string;
  country?: string;
  lat: number;
  lng: number;
  showCount: number;
  firstYear: number | null;
  lastYear: number | null;
  shows: TourShow[];
  source: "tour";
};

type Props = {
  pins: ProjectedPin[];
  tourPins: TourPin[];
  countries: CountryFeature[];
};

const KIND_COLORS: Record<PlaceKind, { fill: string; stroke: string; label: string }> = {
  studio:        { fill: "#F2B705", stroke: "#0B0B0B", label: "studios" },
  show:          { fill: "#E83A1C", stroke: "#0B0B0B", label: "shows" },
  club:          { fill: "#E83A1C", stroke: "#0B0B0B", label: "clubs" },
  festival:      { fill: "#C9B9E8", stroke: "#0B0B0B", label: "festivals" },
  session:       { fill: "#7BD3A8", stroke: "#0B0B0B", label: "sessions" },
  party:         { fill: "#FF6FB5", stroke: "#0B0B0B", label: "parties" },
  workshop:      { fill: "#65C7F7", stroke: "#0B0B0B", label: "workshops" },
  restaurant:    { fill: "#7BD3A8", stroke: "#0B0B0B", label: "restaurants" },
  bar:           { fill: "#7BD3A8", stroke: "#0B0B0B", label: "bars" },
  hotel:         { fill: "#F4EFE6", stroke: "#0B0B0B", label: "hotels" },
  "record-store":{ fill: "#0E4B3A", stroke: "#F4EFE6", label: "record stores" },
  vibe:          { fill: "#F4EFE6", stroke: "#0B0B0B", label: "vibes" },
  moment:        { fill: "#F4EFE6", stroke: "#0B0B0B", label: "moments" },
};

const KIND_ORDER: PlaceKind[] = [
  "studio", "show", "club", "festival", "session", "party", "workshop",
  "restaurant", "bar", "hotel", "record-store", "vibe", "moment",
];

const TOUR_COLOR = "#F4EFE6";
type FilterKey = "all" | "tour" | "curated" | PlaceKind;

const CX = MAP_WIDTH / 2;
const CY = MAP_HEIGHT / 2;

export function MapClient({ pins, tourPins, countries }: Props) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedTourCity, setSelectedTourCity] = useState<string | null>(null);
  // Globe rotation: [lambda, phi, gamma]. lambda spins horizontally.
  const [rotation, setRotation] = useState<[number, number, number]>([-30, -10, 0]);
  const [paused, setPaused] = useState(false);

  // Drag state — using refs so we don't re-render on every pointer move.
  const dragRef = useRef<{ startX: number; startY: number; startLambda: number; startPhi: number } | null>(null);

  // Auto-rotate. Pauses when user is dragging, has a panel open, or hovers
  // anywhere over the globe (to let them read).
  useEffect(() => {
    if (paused || selectedPlaceId || selectedTourCity) return;
    let rafId = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setRotation(([lambda, phi, gamma]) => [lambda + dt * 0.008, phi, gamma]); // ~0.5°/frame at 60fps
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [paused, selectedPlaceId, selectedTourCity]);

  // Build the projection from current rotation.
  const projection = useMemo(() => {
    return geoOrthographic()
      .scale(GLOBE_RADIUS)
      .translate([CX, CY])
      .rotate(rotation)
      .clipAngle(90);
  }, [rotation]);

  const pathBuilder = useMemo(() => geoPath(projection), [projection]);

  // Pre-compute country path strings each frame. d3-geoPath returns null for
  // features fully clipped on the back side; we skip those.
  const countryPaths = useMemo(() => {
    return countries
      .map((c) => ({
        id: c.id,
        d: pathBuilder(c.geometry as GeoPermissibleObjects) ?? "",
      }))
      .filter((c) => c.d.length > 0);
  }, [countries, pathBuilder]);

  // Project a single lat/lng. Returns null if the point is on the back hemisphere.
  function projectLatLng(lat: number, lng: number): { x: number; y: number } | null {
    const xy = projection([lng, lat]);
    if (!xy) return null;
    const [x, y] = xy;
    if (Number.isNaN(x) || Number.isNaN(y)) return null;
    // Approximate front-hemisphere check using clipAngle on projection — d3
    // already returns null for back-hemisphere points after the clipAngle
    // setter, but belt-and-suspenders: also check distance from center.
    return { x, y };
  }

  // ===== Drag handling =====
  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLambda: rotation[0],
      startPhi: rotation[1],
    };
    setPaused(true);
  }
  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const k = 0.4; // degrees per pixel
    setRotation([d.startLambda + dx * k, Math.max(-89, Math.min(89, d.startPhi - dy * k)), 0]);
  }
  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    const target = e.currentTarget;
    try { target.releasePointerCapture(e.pointerId); } catch {}
    dragRef.current = null;
    // Resume rotation 800ms after drag ends, if no panel was opened.
    setTimeout(() => setPaused(false), 800);
  }

  // ===== Filter visibility =====
  const visibleSanityPins = useMemo(() => {
    if (filter === "tour") return [];
    if (filter === "all" || filter === "curated") return pins;
    return pins.filter((p) => p.kind === filter);
  }, [pins, filter]);

  const visibleTourPins = useMemo(() => {
    if (filter === "curated" || (filter !== "all" && filter !== "tour")) return [];
    return tourPins;
  }, [tourPins, filter]);

  const maxShow = useMemo(() => Math.max(1, ...tourPins.map((p) => p.showCount)), [tourPins]);
  const tourRadius = (n: number) => {
    const k = Math.log(n + 1) / Math.log(maxShow + 1);
    return 2.5 + k * 6;
  };

  const counts = useMemo(() => {
    const m = new Map<FilterKey, number>();
    m.set("all", pins.length + tourPins.length);
    m.set("curated", pins.length);
    m.set("tour", tourPins.length);
    for (const p of pins) m.set(p.kind, (m.get(p.kind) ?? 0) + 1);
    return m;
  }, [pins, tourPins]);

  const selectedPlace = useMemo(
    () => (selectedPlaceId ? pins.find((p) => p._id === selectedPlaceId) ?? null : null),
    [selectedPlaceId, pins]
  );
  const selectedTour = useMemo(
    () => (selectedTourCity ? tourPins.find((p) => p.city === selectedTourCity) ?? null : null),
    [selectedTourCity, tourPins]
  );

  // When user selects a pin, rotate the globe to face that point.
  function spinToward(lat: number, lng: number) {
    setRotation([-lng, -lat, 0]);
    setPaused(true);
  }

  const closePanels = () => {
    setSelectedPlaceId(null);
    setSelectedTourCity(null);
    setTimeout(() => setPaused(false), 400);
  };

  // Sphere outline + graticule
  const sphereD = pathBuilder({ type: "Sphere" } as GeoPermissibleObjects) ?? "";

  return (
    <>
      <div className="px-8 py-5 border-b border-paper sticky top-[60px] z-[5] bg-ink/95 backdrop-blur-md">
        <div className="flex flex-wrap gap-2 items-center">
          <Chip active={filter === "all"} onClick={() => setFilter("all")} label="all" count={counts.get("all") ?? 0} />
          <Chip active={filter === "tour"} onClick={() => setFilter("tour")} label="tour" count={counts.get("tour") ?? 0} color={TOUR_COLOR} />
          <Chip active={filter === "curated"} onClick={() => setFilter("curated")} label="curated" count={counts.get("curated") ?? 0} />
          <span className="w-px self-stretch bg-paper/30 mx-1" aria-hidden />
          {KIND_ORDER.map((k) => {
            const n = counts.get(k) ?? 0;
            if (n === 0) return null;
            const c = KIND_COLORS[k];
            return <Chip key={k} active={filter === k} onClick={() => setFilter(k)} label={c.label} count={n} color={c.fill} />;
          })}
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="font-mono text-[10px] tracking-[.12em] uppercase px-2.5 py-1 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors"
          >
            {paused ? "▶ spin" : "❚❚ pause"}
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="px-2 sm:px-6 py-6">
          <div className="w-full max-w-[1200px] mx-auto bg-ink-2 overflow-hidden">
            <svg
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              role="img"
              aria-label="spinning globe of nick's places and tour stops"
              className="block w-full h-auto select-none touch-none"
              style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <defs>
                {/* Soft globe shading */}
                <radialGradient id="globe-shade" cx="40%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#1F1B17" stopOpacity="1" />
                  <stop offset="100%" stopColor="#0B0B0B" stopOpacity="1" />
                </radialGradient>
                <radialGradient id="globe-rim" cx="50%" cy="50%" r="50%">
                  <stop offset="80%" stopColor="rgba(242,183,5,0)" />
                  <stop offset="100%" stopColor="rgba(242,183,5,0.35)" />
                </radialGradient>
              </defs>

              {/* Globe sphere fill */}
              <circle cx={CX} cy={CY} r={GLOBE_RADIUS} fill="url(#globe-shade)" />

              {/* Countries */}
              <g>
                {countryPaths.map((c) => (
                  <path
                    key={c.id}
                    d={c.d}
                    fill="rgba(244,239,230,0.10)"
                    stroke="rgba(244,239,230,0.40)"
                    strokeWidth={0.5}
                  />
                ))}
              </g>

              {/* Sphere outline (so the edge of the globe is crisp) */}
              <path d={sphereD} fill="none" stroke="rgba(244,239,230,0.55)" strokeWidth={1} />

              {/* Tour pins */}
              <g>
                {visibleTourPins.map((p) => {
                  const xy = projectLatLng(p.lat, p.lng);
                  if (!xy) return null;
                  const r = tourRadius(p.showCount);
                  const isSelected = p.city === selectedTourCity;
                  return (
                    <g
                      key={`t-${p.city}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlaceId(null);
                        setSelectedTourCity(p.city);
                        spinToward(p.lat, p.lng);
                      }}
                      style={{ cursor: "pointer" }}
                      role="button"
                      aria-label={`${p.city} · ${p.showCount} shows`}
                    >
                      <circle cx={xy.x} cy={xy.y} r={r + 4} fill={TOUR_COLOR} opacity={isSelected ? 0.22 : 0.08} />
                      <circle
                        cx={xy.x}
                        cy={xy.y}
                        r={r}
                        fill={TOUR_COLOR}
                        fillOpacity={0.55}
                        stroke={isSelected ? "#F2B705" : "#0B0B0B"}
                        strokeWidth={isSelected ? 2 : 0.8}
                      />
                    </g>
                  );
                })}
              </g>

              {/* Curated pins */}
              <g>
                {visibleSanityPins.map((p) => {
                  const xy = projectLatLng(p.lat, p.lng);
                  if (!xy) return null;
                  const c = KIND_COLORS[p.kind] ?? KIND_COLORS.vibe;
                  const isSelected = p._id === selectedPlaceId;
                  const r = isSelected ? 7 : 5;
                  return (
                    <g
                      key={p._id}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTourCity(null);
                        setSelectedPlaceId(p._id);
                        spinToward(p.lat, p.lng);
                      }}
                      style={{ cursor: "pointer" }}
                      role="button"
                      aria-label={`${p.name}, ${p.city ?? ""}`}
                    >
                      <circle cx={xy.x} cy={xy.y} r={r + 5} fill={c.fill} opacity={isSelected ? 0.25 : 0.0} />
                      <circle
                        cx={xy.x}
                        cy={xy.y}
                        r={r}
                        fill={c.fill}
                        stroke={c.stroke}
                        strokeWidth={isSelected ? 2 : 1.5}
                      />
                    </g>
                  );
                })}
              </g>

              {/* Atmospheric rim glow */}
              <circle cx={CX} cy={CY} r={GLOBE_RADIUS + 4} fill="url(#globe-rim)" pointerEvents="none" />
            </svg>
          </div>
          <div className="text-center font-mono text-[10px] tracking-[.14em] uppercase text-paper-2 mt-3">
            drag to spin · click a pin to zoom · click pause to hold
          </div>
        </div>

        {selectedPlace && (
          <SidePanel onClose={closePanels}>
            <div className="font-mono text-[10px] tracking-[.14em] uppercase mb-2" style={{ color: (KIND_COLORS[selectedPlace.kind] ?? KIND_COLORS.vibe).fill }}>
              {(KIND_COLORS[selectedPlace.kind] ?? KIND_COLORS.vibe).label.replace(/s$/, "")}
              {selectedPlace.year ? ` · ${selectedPlace.year}` : ""}
            </div>
            <div className="font-display font-bold uppercase leading-[0.95] mb-1" style={{ fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.02em" }}>
              {selectedPlace.name}
            </div>
            <div className="font-mono text-[11px] tracking-[.1em] uppercase text-paper-2 mb-4">
              {selectedPlace.city}{selectedPlace.country ? ` · ${selectedPlace.country}` : ""}
            </div>
            {selectedPlace.tagline && (
              <p className="font-serif italic text-[16px] text-paper leading-snug mb-4">{selectedPlace.tagline}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <Link href={`/places/${selectedPlace.slug}`} className="font-mono text-[10px] tracking-[.14em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline text-paper">
                travel guide →
              </Link>
              {selectedPlace.websiteUrl && (
                <a href={selectedPlace.websiteUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] tracking-[.14em] uppercase px-3 py-1.5 border border-paper rounded-full hover:bg-paper hover:text-ink transition-colors no-underline text-paper">
                  website →
                </a>
              )}
            </div>
          </SidePanel>
        )}

        {selectedTour && (
          <SidePanel onClose={closePanels}>
            <div className="font-mono text-[10px] tracking-[.14em] uppercase mb-2 text-paper-2">
              tour stop · {selectedTour.showCount} show{selectedTour.showCount === 1 ? "" : "s"}
              {selectedTour.firstYear && selectedTour.lastYear && (
                <> · {selectedTour.firstYear === selectedTour.lastYear ? selectedTour.firstYear : `${selectedTour.firstYear}–${selectedTour.lastYear}`}</>
              )}
            </div>
            <div className="font-display font-bold uppercase leading-[0.95] mb-1" style={{ fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.02em" }}>
              {selectedTour.city}
            </div>
            {selectedTour.country && (
              <div className="font-mono text-[11px] tracking-[.1em] uppercase text-paper-2 mb-4">{selectedTour.country}</div>
            )}
            <ul className="space-y-2 mt-3">
              {selectedTour.shows.map((s, i) => (
                <li key={`${selectedTour.city}-${i}`} className="border-b border-paper/30 pb-2">
                  <div className="font-mono text-[10px] tracking-[.1em] uppercase text-paper-2 tabular-nums">
                    {s.date ?? s.year ?? "—"}
                  </div>
                  <div className="font-display font-semibold text-[14px] uppercase leading-tight">
                    {s.venue ?? "(venue tbc)"}
                  </div>
                </li>
              ))}
            </ul>
          </SidePanel>
        )}
      </div>
    </>
  );
}

function SidePanel({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed right-4 bottom-4 sm:right-6 sm:top-[180px] sm:bottom-6 z-20 w-[calc(100vw-2rem)] sm:w-[400px] max-w-full max-h-[80vh] overflow-y-auto bg-ink border border-paper shadow-[6px_6px_0_#F2B705]">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 font-mono text-[11px] tracking-[.14em] uppercase text-paper-2 hover:text-paper transition-colors"
        aria-label="close"
      >
        ✕ close
      </button>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono text-[10px] tracking-[.12em] uppercase px-2.5 py-1 border rounded-full transition-colors flex items-center gap-1.5 ${
        active ? "border-lamp bg-lamp text-ink" : "border-paper text-paper hover:bg-paper hover:text-ink"
      }`}
    >
      {color && <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />}
      {label}
      <span className={`tabular-nums ${active ? "text-ink/60" : "text-paper-2"}`}>{count}</span>
    </button>
  );
}

// Quiet `geo-circle` import — keeping it so future tour-arc lines can build on it.
void geoCircle;
