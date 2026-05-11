// World map helpers. The server pre-builds the GeoJSON feature list (parsed
// from the world-atlas topojson) and ships it to the client; rotation +
// projection happens on the client so the globe can spin.

import * as topojson from "topojson-client";
import worldAtlas from "world-atlas/countries-110m.json";

// Output canvas. The page CSS scales this to fit, so resolution-independent.
export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 720;
export const GLOBE_RADIUS = 320;

type GeoFeature = {
  type: "Feature";
  geometry: { type: string; coordinates: unknown };
  properties: { name?: string };
  id?: string;
};

let cachedCountries: GeoFeature[] | null = null;
function countries(): GeoFeature[] {
  if (cachedCountries) return cachedCountries;
  const topo = worldAtlas as unknown as {
    objects: { countries: { type: "GeometryCollection"; geometries: unknown[] } };
  };
  const fc = topojson.feature(
    topo as unknown as Parameters<typeof topojson.feature>[0],
    topo.objects.countries as unknown as Parameters<typeof topojson.feature>[1]
  ) as unknown as { features: GeoFeature[] };
  cachedCountries = fc.features;
  return cachedCountries;
}

/** Serializable GeoJSON features for the world's countries — pass to client. */
export type CountryFeature = {
  id: string;
  name: string;
  geometry: GeoFeature["geometry"];
};

export function worldCountries(): CountryFeature[] {
  return countries().map((f) => ({
    id: String(f.id ?? f.properties?.name ?? ""),
    name: f.properties?.name ?? "",
    geometry: f.geometry,
  }));
}
