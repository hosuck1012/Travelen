import { generateItineraryWithGemini } from "@/lib/gemini-itinerary";
import { GeminiPlansError } from "@/lib/gemini-plans";
import { isGenerateItineraryRequest, isTripPlan } from "@/lib/trip-api-mock";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "요청 본문은 올바른 JSON 형식이어야 합니다." }, { status: 400 });
    }

    if (!isGenerateItineraryRequest(body)) {
      return Response.json({ error: "여행 조건과 선택한 플랜을 올바르게 보내 주세요." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: "Gemini API 설정을 확인해 주세요." }, { status: 500 });

    try {
      const response = await generateItineraryWithGemini(apiKey, body);
      if (!isTripPlan(response.plan)) {
        return Response.json({ error: "Gemini 상세 일정 응답 형식이 올바르지 않습니다." }, { status: 502 });
      }
      return Response.json(response);
    } catch (error) {
      if (error instanceof GeminiPlansError) {
        if (error.kind === "schema") return Response.json({ error: "상세 일정 요청 형식이 올바르지 않습니다." }, { status: 400 });
        if (error.kind === "auth") return Response.json({ error: "Gemini API 키 설정 또는 사용 권한을 확인해 주세요." }, { status: error.upstreamStatus === 403 ? 403 : 401 });
        if (error.kind === "quota") return Response.json({ error: "Gemini 사용량 한도를 초과했습니다." }, { status: 429 });
        if (error.kind === "output" || error.kind === "json") return Response.json({ error: "Gemini 상세 일정 응답 형식이 올바르지 않습니다." }, { status: 502 });
      }
      return Response.json({ error: "Gemini 서비스에 일시적인 오류가 발생했습니다." }, { status: 503 });
    }
  } catch {
    return Response.json({ error: "상세 일정을 생성하는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
