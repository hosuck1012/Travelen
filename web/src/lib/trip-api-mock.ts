import type {
  Activity,
  DayKey,
  ModifyItineraryRequest,
  ModifyItineraryResponse,
  PlanId,
  TripDay,
  TripPlan,
  TripPreferences,
} from "@/types/trip";

const planIds: PlanId[] = ["relax", "balance", "active"];
const companions: TripPreferences["companion"][] = ["혼자", "연인", "친구", "가족"];
const paces: TripPreferences["pace"][] = ["여유롭게", "적당히", "알차게"];
const activityTypes: Activity["type"][] = ["관광지", "식당", "숙소", "이동"];

const planMeta: Record<PlanId, Pick<TripPlan, "title" | "subtitle" | "budget" | "movement" | "tags">> = {
  relax: {
    title: "느긋한 섬 휴식",
    subtitle: "해변과 카페에 오래 머무는 휴식형 상세 일정",
    budget: "1인 약 124만 원",
    movement: "낮음 · 하루 2~3곳",
    tags: ["휴양", "카페", "노을", "이동 적음"],
  },
  balance: {
    title: "감성과 관광의 균형",
    subtitle: "대표 관광지와 자유 시간을 고르게 배치한 균형형 상세 일정",
    budget: "1인 약 148만 원",
    movement: "보통 · 하루 3~4곳",
    tags: ["AI 추천", "맛집", "사진", "적당한 이동"],
  },
  active: {
    title: "섬 구석구석 액티브",
    subtitle: "하이킹과 로컬 탐방을 촘촘히 담은 활동형 상세 일정",
    budget: "1인 약 176만 원",
    movement: "높음 · 하루 4~6곳",
    tags: ["액티비티", "로컬 체험", "하이킹", "이동 많음"],
  },
};

function activity(
  id: string,
  time: string,
  type: Activity["type"],
  title: string,
  description: string,
  meta: string,
  cost: string,
  x: string,
  y: string,
): Activity {
  return { id, time, type, title, description, meta, cost, marker: { x, y } };
}

function createDays(): Record<DayKey, TripDay> {
  return {
    day1: {
      id: "day1",
      label: "7월 24일",
      area: "피라 · 이메로비글리",
      summary: "칼데라 풍경과 산토리니의 첫 노을을 만나는 날",
      route: "오늘 이동 약 12.4km · 차량 35분",
      items: [
        activity("day1-1", "11:00", "이동", "공항에서 피라 이동", "숙소에 짐을 맡기고 여행을 시작합니다.", "차량 20분", "약 25,000원", "42%", "72%"),
        activity("day1-2", "12:30", "식당", "피라 로컬 타베르나", "칼데라 전망과 함께 현지 점심을 즐깁니다.", "체류 1시간 20분", "약 35,000원", "45%", "61%"),
        activity("day1-3", "15:00", "관광지", "이메로비글리 산책", "골목과 전망 포인트를 천천히 둘러봅니다.", "체류 2시간", "무료", "49%", "43%"),
        activity("day1-4", "19:00", "숙소", "칼데라 뷰 호텔", "숙소에서 노을을 감상하며 휴식합니다.", "1박", "포함", "53%", "31%"),
      ],
    },
    day2: {
      id: "day2",
      label: "7월 25일",
      area: "아크로티리 · 오이아",
      summary: "유적과 해변, 오이아 노을을 모두 만나는 날",
      route: "오늘 이동 약 31.2km · 차량 1시간 25분",
      items: [
        activity("day2-1", "09:00", "관광지", "아크로티리 유적", "고대 도시 유적을 관람합니다.", "체류 1시간 30분", "약 18,000원", "31%", "78%"),
        activity("day2-2", "11:30", "관광지", "레드 비치", "붉은 절벽과 해변 풍경을 감상합니다.", "체류 1시간", "무료", "27%", "68%"),
        activity("day2-3", "13:30", "식당", "해변 타베르나 점심", "해산물 중심의 점심을 즐깁니다.", "체류 1시간", "약 40,000원", "36%", "54%"),
        activity("day2-4", "16:30", "관광지", "오이아 마을과 노을", "골목을 둘러보고 대표 노을 포인트를 찾습니다.", "체류 3시간", "무료", "57%", "20%"),
        activity("day2-5", "20:30", "이동", "숙소 복귀", "호텔로 돌아가 하루를 마무리합니다.", "차량 25분", "약 30,000원", "50%", "39%"),
      ],
    },
    day3: {
      id: "day3",
      label: "7월 26일",
      area: "피르고스 · 공항",
      summary: "전통 마을에서 여행을 차분하게 마무리하는 날",
      route: "오늘 이동 약 15.6km · 차량 40분",
      items: [
        activity("day3-1", "09:30", "숙소", "호텔 체크아웃", "조식 후 짐을 정리합니다.", "체류 1시간", "포함", "51%", "35%"),
        activity("day3-2", "11:00", "관광지", "피르고스 마을", "전통 골목과 전망대를 산책합니다.", "체류 2시간", "무료", "43%", "55%"),
        activity("day3-3", "13:30", "식당", "마지막 현지 점심", "그리스 가정식으로 여행을 마무리합니다.", "체류 1시간 20분", "약 30,000원", "47%", "64%"),
        activity("day3-4", "16:00", "이동", "산토리니 공항 이동", "출국 시간에 맞춰 공항으로 이동합니다.", "차량 20분", "약 20,000원", "58%", "73%"),
      ],
    },
  };
}

export function createMockPlans(preferences: TripPreferences): TripPlan[] {
  const dateRange = `${preferences.startDate.replaceAll("-", ".")} - ${preferences.endDate.replaceAll("-", ".")}`;

  return planIds.map((id) => ({
    id,
    ...planMeta[id],
    destination: preferences.destination,
    dateRange,
    hotel: "이메로비글리 칼데라 뷰 호텔",
    days: createDays(),
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isTripPreferences(value: unknown): value is TripPreferences {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.destination) &&
    isNonEmptyString(value.startDate) &&
    isNonEmptyString(value.endDate) &&
    companions.includes(value.companion as TripPreferences["companion"]) &&
    Array.isArray(value.interests) &&
    value.interests.length > 0 &&
    value.interests.every(isNonEmptyString) &&
    isNonEmptyString(value.budgetPerPerson) &&
    paces.includes(value.pace as TripPreferences["pace"])
  );
}

function isActivity(value: unknown): value is Activity {
  return (
    isRecord(value) &&
    isNonEmptyString(value.time) &&
    activityTypes.includes(value.type as Activity["type"]) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.description) &&
    isNonEmptyString(value.meta) &&
    isNonEmptyString(value.cost) &&
    isRecord(value.marker) &&
    isNonEmptyString(value.marker.x) &&
    isNonEmptyString(value.marker.y)
  );
}

function isTripDay(value: unknown): value is TripDay {
  return (
    isRecord(value) &&
    isNonEmptyString(value.label) &&
    isNonEmptyString(value.area) &&
    isNonEmptyString(value.summary) &&
    isNonEmptyString(value.route) &&
    Array.isArray(value.items) &&
    value.items.length > 0 &&
    value.items.every(isActivity)
  );
}

export function isModifyItineraryRequest(value: unknown): value is ModifyItineraryRequest {
  if (!isRecord(value)) return false;
  return (
    planIds.includes(value.planId as PlanId) &&
    isNonEmptyString(value.message) &&
    Array.isArray(value.currentItinerary) &&
    value.currentItinerary.length === 3 &&
    value.currentItinerary.every(isTripDay)
  );
}

export function modifyMockItinerary(request: ModifyItineraryRequest): ModifyItineraryResponse {
  const template = createMockPlans({
    destination: "산토리니, 그리스",
    startDate: "2026-07-24",
    endDate: "2026-07-26",
    companion: "연인",
    interests: ["카페", "사진 촬영"],
    budgetPerPerson: "100만 원 ~ 180만 원",
    pace: "적당히",
  }).find((plan) => plan.id === request.planId)!;
  const [day1, day2, day3] = request.currentItinerary;
  const removed = day2.items.find((item) => item.title.includes("레드 비치")) ?? day2.items.find((item) => item.type === "관광지");
  const cafe = activity("day2-cafe", "14:30", "식당", "오이아 카페 자유시간", "카페에서 충분히 쉬며 자유 시간을 보냅니다.", "체류 2시간", "약 20,000원", "48%", "27%");
  const remaining = day2.items.filter((item) => item !== removed);
  const returnIndex = remaining.findIndex((item) => item.title.includes("숙소 복귀"));
  const updatedItems = [...remaining];
  updatedItems.splice(returnIndex >= 0 ? returnIndex : updatedItems.length, 0, cafe);
  const updatedDay2: TripDay = {
    ...day2,
    id: "day2",
    area: "이메로비글리 · 오이아",
    summary: "이동을 줄이고 카페와 자유 시간을 늘린 여유로운 일정입니다.",
    route: "오늘 이동 약 16.8km · 차량 44분",
    items: updatedItems,
  };
  const plan: TripPlan = {
    ...template,
    days: {
      day1: { ...day1, id: "day1" },
      day2: updatedDay2,
      day3: { ...day3, id: "day3" },
    },
  };

  return {
    plan,
    changes: [
      {
        dayId: "day2",
        summary: "빡빡한 일정 1개를 제거하고 카페 체류 시간을 2시간으로 변경했습니다.",
        before: [removed ? `${removed.title} 일정 포함` : "기존 Day 2 일정", day2.route],
        after: ["오이아 카페 자유시간 · 체류 2시간", updatedDay2.route],
      },
    ],
    message: "둘째 날 이동을 줄이고 카페에서 여유롭게 머무는 일정으로 수정했습니다.",
    modifiedAt: new Date().toISOString(),
  };
}
