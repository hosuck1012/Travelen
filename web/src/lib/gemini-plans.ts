import { GoogleGenAI } from "@google/genai";
import type { GeneratePlansResponse, TripPreferences } from "@/types/trip";

export type GeminiPlansErrorKind = "schema" | "auth" | "quota" | "service" | "output" | "json";

export class GeminiPlansError extends Error {
  constructor(
    public readonly kind: GeminiPlansErrorKind,
    public readonly upstreamStatus: number | null = null,
  ) {
    super(kind);
    this.name = "GeminiPlansError";
  }
}

const stringField = { type: "string" } as const;
const planSchema = {
  type: "object",
  required: ["id", "title", "subtitle", "destination", "dateRange", "budget", "movement", "hotel", "tags", "highlights"],
  properties: {
    id: { type: "string", enum: ["relax", "balance", "active"] },
    title: stringField,
    subtitle: stringField,
    destination: stringField,
    dateRange: stringField,
    budget: stringField,
    movement: stringField,
    hotel: stringField,
    tags: { type: "array", minItems: 3, items: stringField },
    highlights: { type: "array", minItems: 3, items: stringField },
  },
} as const;

const generatedPlansSchema = {
  type: "object",
  required: ["plans"],
  properties: {
    plans: { type: "array", items: { $ref: "#/$defs/plan" } },
  },
  $defs: {
    plan: planSchema,
  },
} as const;

function getErrorStatus(error: unknown) {
  if (typeof error !== "object" || error === null) return null;
  const candidate = error as { status?: unknown; statusCode?: unknown };
  const status = candidate.status ?? candidate.statusCode;
  return typeof status === "number" ? status : null;
}

export function classifyGeminiError(error: unknown): GeminiPlansError {
  const status = getErrorStatus(error);
  if (status === 400) return new GeminiPlansError("schema", status);
  if (status === 401 || status === 403) return new GeminiPlansError("auth", status);
  if (status === 429) return new GeminiPlansError("quota", status);
  return new GeminiPlansError("service", status);
}

export async function generatePlansWithGemini(
  apiKey: string,
  preferences: TripPreferences,
): Promise<GeneratePlansResponse> {
  const ai = new GoogleGenAI({ apiKey });
  let outputText: string | undefined;

  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash",
      store: false,
      system_instruction:
        "당신은 한국어 여행 일정 설계자입니다. 모든 사용자 표시 문구를 자연스러운 한글로 작성하고, 주어진 JSON Schema만 따르세요.",
      input: [
        "다음 여행 조건에 맞춰 휴식형(relax), 균형형(balance), 활동형(active) 플랜을 정확히 하나씩 생성하세요.",
        "이번 응답에는 상세 일정을 만들지 말고 비교에 필요한 요약만 작성하세요.",
        "각 플랜에는 예산, 이동량, 추천 숙소, 특징 태그와 핵심 장소 3개 이상을 포함하세요.",
        `여행 조건: ${JSON.stringify(preferences)}`,
      ].join("\n"),
      response_format: [
        {
          type: "text",
          mime_type: "application/json",
          schema: generatedPlansSchema,
        },
      ],
      generation_config: { temperature: 0.7, max_output_tokens: 16000 },
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

  if (typeof parsed !== "object" || parsed === null || !("plans" in parsed)) {
    throw new GeminiPlansError("output");
  }

  return {
    preferences,
    plans: (parsed as { plans: GeneratePlansResponse["plans"] }).plans,
    generatedAt: new Date().toISOString(),
  };
}
