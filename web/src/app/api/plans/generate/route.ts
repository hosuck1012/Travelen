import { createMockPlans, isTripPreferences } from "@/lib/trip-api-mock";
import type { GeneratePlansResponse } from "@/types/trip";

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

    const response: GeneratePlansResponse = {
      preferences: body,
      plans: createMockPlans(body),
      generatedAt: new Date().toISOString(),
    };

    return Response.json(response);
  } catch {
    return Response.json({ error: "여행 플랜을 생성하는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
