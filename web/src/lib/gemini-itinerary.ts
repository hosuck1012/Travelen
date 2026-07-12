import { GoogleGenAI } from "@google/genai";
import { classifyGeminiError, GeminiPlansError } from "@/lib/gemini-plans";
import { enrichTripPlanWithKakaoPlaces } from "@/lib/kakao-places";
import type { GenerateItineraryRequest, GenerateItineraryResponse, TripPlan } from "@/types/trip";

const stringField = { type: "string" } as const;
const schema = {
  type: "object",
  required: ["days"],
  properties: {
    days: {
      type: "object",
      required: ["day1", "day2", "day3"],
      properties: {
        day1: { $ref: "#/$defs/day" },
        day2: { $ref: "#/$defs/day" },
        day3: { $ref: "#/$defs/day" },
      },
    },
  },
  $defs: {
    marker: {
      type: "object",
      required: ["x", "y"],
      properties: { x: stringField, y: stringField },
    },
    activity: {
      type: "object",
      required: ["id", "time", "type", "title", "description", "meta", "cost", "marker"],
      properties: {
        id: stringField,
        time: stringField,
        type: { type: "string", enum: ["관광지", "식당", "숙소", "이동"] },
        title: stringField,
        description: stringField,
        meta: stringField,
        cost: stringField,
        marker: { $ref: "#/$defs/marker" },
      },
    },
    day: {
      type: "object",
      required: ["id", "label", "area", "summary", "route", "items"],
      properties: {
        id: { type: "string", enum: ["day1", "day2", "day3"] },
        label: stringField,
        area: stringField,
        summary: stringField,
        route: stringField,
        items: { type: "array", items: { $ref: "#/$defs/activity" } },
      },
    },
  },
} as const;

export async function generateItineraryWithGemini(
  apiKey: string,
  request: GenerateItineraryRequest,
): Promise<GenerateItineraryResponse> {
  const ai = new GoogleGenAI({ apiKey });
  let outputText: string | undefined;

  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash",
      store: false,
      system_instruction: "당신은 한국어 여행 일정 설계자입니다. 선택된 플랜에 맞는 현실적인 3일 상세 일정을 JSON Schema에 맞춰 작성하세요.",
      input: [
        "선택된 플랜의 Day 1~3 상세 일정을 생성하세요.",
        "매일 관광지, 식당, 숙소 또는 이동을 자연스럽게 조합하고 각 활동의 시간, 예상 비용, 체류·이동 정보를 포함하세요.",
        "day1, day2, day3 객체의 id는 각각 같은 날짜 키와 정확히 일치해야 합니다.",
        `여행 조건: ${JSON.stringify(request.preferences)}`,
        `선택 플랜: ${JSON.stringify(request.plan)}`,
      ].join("\n"),
      response_format: [{ type: "text", mime_type: "application/json", schema }],
      generation_config: { temperature: 0.7, max_output_tokens: 9000 },
    });
    outputText = interaction.output_text;
  } catch (error) {
    throw classifyGeminiError(error);
  }

  if (!outputText) throw new GeminiPlansError("output");

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText) as unknown;
  } catch {
    throw new GeminiPlansError("json");
  }

  if (typeof parsed !== "object" || parsed === null || !("days" in parsed)) throw new GeminiPlansError("output");
  const plan: TripPlan = { ...request.plan, days: (parsed as { days: TripPlan["days"] }).days };
  const enrichedPlan = await enrichTripPlanWithKakaoPlaces(plan);
  return { plan: enrichedPlan, generatedAt: new Date().toISOString() };
}
