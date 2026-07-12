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

type PlaceSearchResult = {
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

const KAKAO_PLACE_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizePlace(document: KakaoPlaceDocument): PlaceSearchResult | null {
  const latitude = Number(document.y);
  const longitude = Number(document.x);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

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

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("query")?.trim();

  if (!query) {
    return Response.json({ error: "검색어를 입력해 주세요." }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "카카오 로컬 API 설정을 확인해 주세요." }, { status: 500 });
  }

  const url = new URL(KAKAO_PLACE_SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("size", "5");

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
      },
      cache: "no-store",
    });

    if (response.status === 401 || response.status === 403) {
      return Response.json({ error: "카카오 로컬 API 인증에 실패했습니다. 서버 설정을 확인해 주세요." }, { status: 502 });
    }

    if (!response.ok) {
      return Response.json({ error: "카카오 장소 검색 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
    }

    const payload: unknown = await response.json();
    if (!isRecord(payload) || !Array.isArray(payload.documents)) {
      return Response.json({ error: "카카오 장소 검색 응답 형식이 올바르지 않습니다." }, { status: 502 });
    }

    const places = payload.documents
      .slice(0, 5)
      .map((document) => (isRecord(document) ? normalizePlace(document) : null))
      .filter((place): place is PlaceSearchResult => place !== null);

    return Response.json(places);
  } catch {
    return Response.json({ error: "카카오 장소 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
