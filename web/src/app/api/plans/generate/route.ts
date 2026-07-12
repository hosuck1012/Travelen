import { GeminiPlansError, generatePlansWithGemini } from "@/lib/gemini-plans";
import { isGeneratePlansResponse, isTripPreferences } from "@/lib/trip-api-mock";

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "요청 본문은 올바른 JSON 형식이어야 합니다." }, { status: 400 });
    }

    if (!isTripPreferences(body)) {
      return Response.json({ error: "여행 조건을 모두 올바르게 입력해 주세요." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Gemini API 설정을 확인해 주세요." }, { status: 500 });
    }

    let generated: unknown;
    try {
      generated = await generatePlansWithGemini(apiKey, body);
    } catch (error) {
      if (error instanceof GeminiPlansError) {
        if (error.kind === "schema") {
          return Response.json({ error: "Gemini 요청 형식 또는 JSON Schema가 올바르지 않습니다." }, { status: 400 });
        }
        if (error.kind === "auth") {
          return Response.json(
            { error: "Gemini API 키 설정 또는 사용 권한을 확인해 주세요." },
            { status: error.upstreamStatus === 403 ? 403 : 401 },
          );
        }
        if (error.kind === "quota") {
          return Response.json({ error: "Gemini 사용량 한도를 초과했습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
        }
        if (error.kind === "output" || error.kind === "json") {
          return Response.json({ error: "Gemini 응답 형식이 올바르지 않습니다. 다시 시도해 주세요." }, { status: 502 });
        }
      }

      return Response.json({ error: "Gemini 서비스에 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }, { status: 503 });
    }

    if (!isGeneratePlansResponse(generated)) {
      return Response.json({ error: "Gemini 응답 형식이 올바르지 않습니다. 다시 시도해 주세요." }, { status: 502 });
    }

    return Response.json(generated);
  } catch {
    return Response.json({ error: "여행 플랜을 생성하는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
