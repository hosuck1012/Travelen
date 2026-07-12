import type { Activity } from "@/types/trip";

export type CoordinateBounds = {
  north: number;
  south: number;
  west: number;
  east: number;
};

export type NormalizedCoordinates = {
  latitude: number;
  longitude: number;
};

const gangneungPlaceCoordinates: Array<{
  keywords: string[];
  coordinates: NormalizedCoordinates;
}> = [
  {
    keywords: ["강릉역"],
    coordinates: { latitude: 37.762402, longitude: 128.898376 },
  },
  {
    keywords: ["안목해변", "안목 해변", "안목 커피거리", "강릉 커피거리"],
    coordinates: { latitude: 37.772756, longitude: 128.947906 },
  },
  {
    keywords: ["주문진"],
    coordinates: { latitude: 37.897753, longitude: 128.833782 },
  },
];

export function normalizeCoordinateValue(value: unknown, min: number, max: number): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value.trim()) : NaN;

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export function getNormalizedActivityCoordinates(activity: Activity): NormalizedCoordinates | null {
  const aliases = activity as Activity & { lat?: unknown; lng?: unknown; x?: unknown; y?: unknown };
  const latitude = normalizeCoordinateValue(activity.latitude ?? aliases.lat ?? aliases.y, -90, 90);
  const longitude = normalizeCoordinateValue(activity.longitude ?? aliases.lng ?? aliases.x, -180, 180);

  if (latitude !== null && longitude !== null) return { latitude, longitude };

  return getKnownPlaceCoordinates(activity);
}

export function withNormalizedActivityCoordinates(activity: Activity, fallbackBounds?: CoordinateBounds): Activity {
  const coordinates = getNormalizedActivityCoordinates(activity) ?? getCoordinatesFromMarker(activity.marker, fallbackBounds);

  return {
    ...activity,
    marker: { ...activity.marker },
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
  };
}

function getKnownPlaceCoordinates(activity: Activity): NormalizedCoordinates | null {
  const searchableText = `${activity.title} ${activity.description} ${activity.meta}`.replace(/\s+/g, "");
  const match = gangneungPlaceCoordinates.find(({ keywords }) => keywords.some((keyword) => searchableText.includes(keyword.replace(/\s+/g, ""))));

  return match?.coordinates ?? null;
}

function getCoordinatesFromMarker(marker: Activity["marker"], bounds?: CoordinateBounds): NormalizedCoordinates | null {
  if (!bounds) return null;

  const xPercent = parsePercent(marker.x);
  const yPercent = parsePercent(marker.y);

  if (xPercent === null || yPercent === null) return null;

  return {
    latitude: bounds.north - (yPercent / 100) * (bounds.north - bounds.south),
    longitude: bounds.west + (xPercent / 100) * (bounds.east - bounds.west),
  };
}

function parsePercent(value: string): number | null {
  const parsed = Number(value.replace("%", ""));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return null;
  return parsed;
}
