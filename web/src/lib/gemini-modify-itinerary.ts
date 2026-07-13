import { GoogleGenAI } from "@google/genai";
import { classifyGeminiError, GeminiPlansError } from "@/lib/gemini-plans";
import { enrichTripPlanWithKakaoPlaces } from "@/lib/kakao-places";
import { isTripPlan } from "@/lib/trip-api-mock";
import type { DayKey, ModifyItineraryRequest, ModifyItineraryResponse, TripDay } from "@/types/trip";

const dayKeys: DayKey[] = ["day1", "day2", "day3"];
const stringField = { type: "string" } as const;
const schema = {
  type: "object",
  required: ["plan", "changes", "message"],
  properties: {
    plan: {
      type: "object",
      required: ["id", "title", "subtitle", "destination", "dateRange", "budget", "movement", "hotel", "tags", "days"],
      properties: {
        id: { type: "string", enum: ["relax", "balance", "active"] },
        title: stringField,
        subtitle: stringField,
        destination: stringField,
        dateRange: stringField,
        budget: stringField,
        movement: stringField,
        hotel: stringField,
        tags: { type: "array", items: stringField },
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
    },
    changes: { type: "array", items: { $ref: "#/$defs/change" } },
    message: stringField,
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
    change: {
      type: "object",
      required: ["dayId", "summary", "before", "after"],
      properties: {
        dayId: { type: "string", enum: ["day1", "day2", "day3"] },
        summary: stringField,
        before: { type: "array", items: stringField },
        after: { type: "array", items: stringField },
      },
    },
  },
} as const;

function normalizeCurrentItinerary(currentItinerary: TripDay[]): Record<DayKey, TripDay> {
  return {
    day1: { ...currentItinerary[0], id: "day1" },
    day2: { ...currentItinerary[1], id: "day2" },
    day3: { ...currentItinerary[2], id: "day3" },
  };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

function isValidResponse(value: unknown, request: ModifyItineraryRequest): value is Omit<ModifyItineraryResponse, "modifiedAt"> {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ModifyItineraryResponse>;
  if (!candidate.plan || !isTripPlan(candidate.plan) || candidate.plan.id !== request.planId) return false;
  if (typeof candidate.message !== "string" || !candidate.message.trim() || !Array.isArray(candidate.changes) || candidate.changes.length === 0) return false;

  const changedDays = new Set<DayKey>();
  for (const change of candidate.changes) {
    if (!dayKeys.includes(change.dayId) || changedDays.has(change.dayId)) return false;
    if (!change.summary?.trim() || !isStringArray(change.before) || !isStringArray(change.after)) return false;
    changedDays.add(change.dayId);
  }

  const originalDays = normalizeCurrentItinerary(request.currentItinerary);
  const daysAreValid = dayKeys.every((dayId) => {
    const unchanged = stableStringify(originalDays[dayId]) === stableStringify(candidate.plan!.days[dayId]);
    return changedDays.has(dayId) ? !unchanged : unchanged;
  });
  if (!daysAreValid) return false;

  const { days: currentDays, ...currentMetadata } = request.currentPlan;
  const { days: candidateDays, ...candidateMetadata } = candidate.plan;
  void currentDays;
  void candidateDays;
  return stableStringify(currentMetadata) === stableStringify(candidateMetadata);
}

export async function modifyItineraryWithGemini(
  apiKey: string,
  request: ModifyItineraryRequest,
): Promise<ModifyItineraryResponse> {
  const currentDays = normalizeCurrentItinerary(request.currentItinerary);
  const ai = new GoogleGenAI({ apiKey });
  let outputText: string | undefined;

  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash",
      store: false,
      system_instruction:
        "당신은 한국어 여행 일정 수정 도우미입니다. 사용자가 요청한 날짜와 항목만 최소한으로 수정하고, 수정 대상이 아닌 날짜는 입력 JSON을 그대로 복사하세요.",
      input: [
        `플랜 ID: ${request.planId}`,
        `사용자 수정 요청: ${request.message}`,
        `현재 플랜 정보: ${JSON.stringify(request.currentPlan)}`,
        `현재 전체 일정: ${JSON.stringify(currentDays)}`,
        "플랜의 제목, 부제, 여행지, 기간, 예산, 이동량, 숙소, 태그는 현재 플랜 정보와 정확히 같게 유지하세요.",
        "수정 요청과 직접 관련된 날짜만 변경하세요. 나머지 날짜는 필드, 활동 순서, 문구와 지도 좌표까지 그대로 유지하세요.",
        "기존 장소를 우선 활용하고, 요청에 꼭 필요한 경우에만 현실적인 장소를 한 곳 이하로 추가하세요. 존재 여부가 불확실한 장소는 만들지 마세요.",
        "changes에는 실제로 변경한 날짜만 넣고, before와 after에는 사용자가 이해할 수 있는 구체적인 변경 내용을 한글로 작성하세요.",
        "plan에는 수정 후 전체 일정을 넣고 message에는 사용자에게 보여줄 짧고 자연스러운 한글 답변을 작성하세요.",
      ].join("\n"),
      response_format: [{ type: "text", mime_type: "application/json", schema }],
      generation_config: { temperature: 0.3, max_output_tokens: 10000 },
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

  if (!isValidResponse(parsed, request)) throw new GeminiPlansError("output");
  const validated = parsed as Omit<ModifyItineraryResponse, "modifiedAt">;
  const plan = await enrichTripPlanWithKakaoPlaces(validated.plan);
  return { ...validated, plan, modifiedAt: new Date().toISOString() };
}
