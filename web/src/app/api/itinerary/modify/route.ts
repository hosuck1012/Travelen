import { isModifyItineraryRequest, modifyMockItinerary } from "@/lib/trip-api-mock";
import type { ModifyItineraryResponse } from "@/types/trip";

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "요청 본문은 올바른 JSON 형식이어야 합니다." }, { status: 400 });
    }

    if (!isModifyItineraryRequest(body)) {
      return Response.json({ error: "플랜 ID, 수정 요청, 현재 전체 일정을 올바르게 보내 주세요." }, { status: 400 });
    }

    const response: ModifyItineraryResponse = modifyMockItinerary(body);
    return Response.json(response);
  } catch {
    return Response.json({ error: "일정을 수정하는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
