import { modifyItineraryWithGemini } from "@/lib/gemini-modify-itinerary";
import { GeminiPlansError } from "@/lib/gemini-plans";
import { isModifyItineraryRequest } from "@/lib/trip-api-mock";

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Gemini API 설정을 확인해 주세요." }, { status: 500 });
    }

    try {
      const response = await modifyItineraryWithGemini(apiKey, body);
      return Response.json(response);
    } catch (error) {
      if (error instanceof GeminiPlansError && error.kind === "quota") {
        return Response.json({ error: "Gemini 사용량 한도를 초과했습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
      }
      if (error instanceof GeminiPlansError && (error.kind === "output" || error.kind === "json")) {
        return Response.json({ error: "Gemini 일정 수정 응답 형식이 올바르지 않습니다. 다시 시도해 주세요." }, { status: 502 });
      }
      return Response.json({ error: "Gemini에서 일정을 수정하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
    }
  } catch {
    return Response.json({ error: "일정을 수정하는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
