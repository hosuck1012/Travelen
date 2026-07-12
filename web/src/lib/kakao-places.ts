import "server-only";

import { normalizeCoordinateValue } from "@/lib/activity-coordinates";
import type { Activity, ActivityCategory, DayKey, TripPlan } from "@/types/trip";

export type KakaoPlace = {
  id: string;
  name: string;
  address: string;
  roadAddress: string;
  latitude: number;
  longitude: number;
  category: string;
  phone: string;
  placeUrl: string;
};

export type KakaoPlacesErrorKind = "auth" | "service" | "format";

export class KakaoPlacesError extends Error {
  constructor(public readonly kind: KakaoPlacesErrorKind) {
    super(kind);
    this.name = "KakaoPlacesError";
  }
}

type KakaoPlaceDocument = {
  id?: unknown;
  place_name?: unknown;
  address_name?: unknown;
  road_address_name?: unknown;
  y?: unknown;
  x?: unknown;
  category_name?: unknown;
  phone?: unknown;
  place_url?: unknown;
};

const KAKAO_PLACE_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const dayKeys: DayKey[] = ["day1", "day2", "day3"];
const activityPriority: Record<ActivityCategory, number> = {
  관광지: 0,
  식당: 1,
  숙소: 2,
  이동: 3,
};
const domesticDestinationNames = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "수원", "고양", "용인", "성남", "안양", "화성",
  "강릉", "속초", "춘천", "원주", "평창", "양양", "동해", "삼척", "태백", "청주", "충주", "제천", "단양", "천안",
  "아산", "공주", "보령", "서산", "전주", "군산", "익산", "남원", "정읍", "여수", "순천", "목포", "담양", "해남",
  "경주", "포항", "안동", "구미", "울릉", "창원", "통영", "거제", "진주", "김해", "남해", "제주", "서귀포",
];
const domesticRegionPattern = /(대한민국|한국|서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|경기도|강원(?:특별자치)?도|충청북도|충청남도|전북특별자치도|전라북도|전라남도|경상북도|경상남도|제주특별자치도)/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizePlace(document: KakaoPlaceDocument): KakaoPlace | null {
  const latitude = normalizeCoordinateValue(document.y, -90, 90);
  const longitude = normalizeCoordinateValue(document.x, -180, 180);
  if (latitude === null || longitude === null) return null;

  return {
    id: asString(document.id),
    name: asString(document.place_name),
    address: asString(document.address_name),
    roadAddress: asString(document.road_address_name),
    latitude,
    longitude,
    category: asString(document.category_name),
    phone: asString(document.phone),
    placeUrl: asString(document.place_url),
  };
}

export function isDomesticDestination(destination: string): boolean {
  const normalized = destination.replace(/\s+/g, "");
  return domesticRegionPattern.test(normalized) || domesticDestinationNames.some((name) => normalized.includes(name));
}

export async function searchKakaoPlaces(query: string, apiKey: string, limit = 5): Promise<KakaoPlace[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const size = Math.min(Math.max(Math.trunc(limit), 1), 15);
  const url = new URL(KAKAO_PLACE_SEARCH_URL);
  url.searchParams.set("query", normalizedQuery);
  url.searchParams.set("size", String(size));

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `KakaoAK ${apiKey}` },
      cache: "no-store",
    });
  } catch {
    throw new KakaoPlacesError("service");
  }

  if (response.status === 401 || response.status === 403) throw new KakaoPlacesError("auth");
  if (!response.ok) throw new KakaoPlacesError("service");

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new KakaoPlacesError("format");
  }
  if (!isRecord(payload) || !Array.isArray(payload.documents)) throw new KakaoPlacesError("format");

  return payload.documents
    .slice(0, size)
    .map((document) => (isRecord(document) ? normalizePlace(document) : null))
    .filter((place): place is KakaoPlace => place !== null);
}

function hasValidCoordinates(activity: Activity): boolean {
  const aliases = activity as Activity & { lat?: unknown; lng?: unknown; x?: unknown; y?: unknown };
  return normalizeCoordinateValue(activity.latitude ?? aliases.lat ?? aliases.y, -90, 90) !== null &&
    normalizeCoordinateValue(activity.longitude ?? aliases.lng ?? aliases.x, -180, 180) !== null;
}

function extractPlaceName(activity: Activity): string {
  if (activity.placeName?.trim()) return activity.placeName.trim();

  return activity.title
    .replace(/[()（）]/g, " ")
    .replace(/\s+(?:도착|출발|방문|관람|감상|산책|체험|투어|휴식|체크인|체크아웃|이동|복귀|인수)(?:\s|$).*$/, "")
    .replace(/에서\s+(?:아침|점심|저녁|식사|휴식).*$/, "")
    .replace(/^(?:카페|식당|맛집|숙소)\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getPlaceSearchQueries(destination: string, activity: Activity): string[] {
  const destinationName = destination.split(/[,/]/)[0].trim();
  const placeName = extractPlaceName(activity);
  const conciseName = placeName.split(/\s+(?:및|그리고|후)\s+/)[0].trim();
  const words = conciseName.split(" ").filter(Boolean);
  const shortenedName = words.length > 1 ? words.slice(0, -1).join(" ") : conciseName;

  return [...new Set([`${destinationName} ${conciseName}`, `${destinationName} ${shortenedName}`].map((query) => query.replace(/\s+/g, " ").trim()))];
}

async function runWithConcurrency(tasks: Array<() => Promise<void>>, concurrency: number): Promise<void> {
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < tasks.length) {
      const task = tasks[nextIndex];
      nextIndex += 1;
      await task();
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
}

export async function enrichTripPlanWithKakaoPlaces(plan: TripPlan): Promise<TripPlan> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey || !isDomesticDestination(plan.destination)) return plan;
  const restApiKey = apiKey;

  const days = Object.fromEntries(
    dayKeys.map((dayKey) => [
      dayKey,
      { ...plan.days[dayKey], items: plan.days[dayKey].items.map((activity) => ({ ...activity, marker: { ...activity.marker } })) },
    ]),
  ) as TripPlan["days"];
  const candidates = dayKeys
    .flatMap((dayKey) => days[dayKey].items.map((activity, itemIndex) => ({ activity, dayKey, itemIndex })))
    .filter(({ activity }) => !hasValidCoordinates(activity))
    .sort((left, right) => activityPriority[left.activity.type] - activityPriority[right.activity.type]);
  const searchCache = new Map<string, Promise<KakaoPlace | null>>();

  async function searchFirstPlace(query: string): Promise<KakaoPlace | null> {
    let search = searchCache.get(query);
    if (!search) {
      search = searchKakaoPlaces(query, restApiKey, 1)
        .then((places) => places[0] ?? null)
        .catch(() => null);
      searchCache.set(query, search);
    }
    return search;
  }

  const tasks = candidates.map(({ activity, dayKey, itemIndex }) => async () => {
    let place: KakaoPlace | null = null;
    for (const query of getPlaceSearchQueries(plan.destination, activity)) {
      place = await searchFirstPlace(query);
      if (place) break;
    }

    if (!place) return;
    days[dayKey].items[itemIndex] = {
      ...activity,
      placeName: place.name,
      placeId: place.id,
      address: place.address,
      roadAddress: place.roadAddress,
      latitude: place.latitude,
      longitude: place.longitude,
      category: place.category,
      phone: place.phone,
      placeUrl: place.placeUrl,
    };
  });

  await runWithConcurrency(tasks, 3);
  return { ...plan, days };
}
