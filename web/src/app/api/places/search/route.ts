import { KakaoPlacesError, searchKakaoPlaces } from "@/lib/kakao-places";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("query")?.trim();

  if (!query) {
    return Response.json({ error: "검색어를 입력해 주세요." }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "카카오 로컬 API 설정을 확인해 주세요." }, { status: 500 });
  }

  try {
    return Response.json(await searchKakaoPlaces(query, apiKey, 5));
  } catch (error) {
    if (error instanceof KakaoPlacesError && error.kind === "auth") {
      return Response.json({ error: "카카오 로컬 API 인증에 실패했습니다. 서버 설정을 확인해 주세요." }, { status: 502 });
    }
    if (error instanceof KakaoPlacesError && error.kind === "format") {
      return Response.json({ error: "카카오 장소 검색 응답 형식이 올바르지 않습니다." }, { status: 502 });
    }
    return Response.json({ error: "카카오 장소 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
