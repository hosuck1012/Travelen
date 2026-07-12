"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { withNormalizedActivityCoordinates } from "@/lib/activity-coordinates";
import KakaoMap from "./KakaoMap";
import type {
  Activity,
  ActivityCategory,
  DayKey,
  GenerateItineraryRequest,
  GenerateItineraryResponse,
  ModifyItineraryRequest,
  ModifyItineraryResponse,
  PlanId,
  PlanSummary,
  TripPreferences,
  TripPlan,
} from "@/types/trip";

type ScheduleItem = Activity;
type ItemType = ActivityCategory;

type ChatMessage = {
  id: number;
  role: "ai" | "user";
  text: string;
  change?: {
    before: string[];
    after: string[];
  };
};

const dayTabs: { key: DayKey; label: string }[] = [
  { key: "day1", label: "Day 1" },
  { key: "day2", label: "Day 2" },
  { key: "day3", label: "Day 3" },
];

const typeStyles: Record<ItemType, string> = {
  관광지: "bg-[var(--primary-soft)] text-[var(--primary)]",
  식당: "bg-[#fff0e7] text-[#b15929]",
  숙소: "bg-[#e9f7ef] text-[#237b4e]",
  이동: "bg-[#eef5ff] text-[#2f6da8]",
};

const santoriniMapBounds = {
  north: 36.49,
  south: 36.33,
  west: 25.31,
  east: 25.52,
};

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: "ai",
    text: "안녕하세요! 일정에서 바꾸고 싶은 부분을 자연스럽게 말해주세요.",
  },
];

const tripPlans: Record<PlanId, TripPlan> = {
  relax: {
    id: "relax",
    title: "느긋한 섬 휴식",
    subtitle: "해변과 카페에 오래 머무는 휴식형 상세 일정",
    destination: "산토리니",
    dateRange: "2026.07.24 - 2026.07.26",
    budget: "1인 약 124만 원",
    movement: "낮음 · 하루 2~3곳",
    hotel: "피라 칼데라 뷰 부티크 호텔",
    tags: ["휴양", "노을", "카페", "이동 적음"],
    days: {
      day1: {
        label: "7월 24일",
        area: "공항 · 피라 · 오이아",
        summary: "도착 후 숙소 체크인과 노을 감상에 집중합니다.",
        route: "오늘 이동 약 14.2km · 차량 42분",
        items: [
          {
            time: "09:30",
            type: "이동",
            title: "산토리니 공항 도착",
            description: "공항에서 예약 차량으로 피라 숙소까지 이동합니다.",
            meta: "차량 18분",
            cost: "약 32,000원",
            marker: { x: "62%", y: "76%" },
          },
          {
            time: "10:30",
            type: "숙소",
            title: "피라 칼데라 뷰 호텔",
            description: "짐을 맡기고 절벽 산책로 주변을 천천히 둘러봅니다.",
            meta: "체류 1시간 20분",
            cost: "숙박 포함",
            marker: { x: "45%", y: "48%" },
          },
          {
            time: "13:00",
            type: "식당",
            title: "아르고 레스토랑",
            description: "칼데라 전망과 그리스식 해산물 점심을 즐깁니다.",
            meta: "도보 8분",
            cost: "약 38,000원",
            marker: { x: "42%", y: "43%" },
          },
          {
            time: "17:20",
            type: "관광지",
            title: "오이아 노을 포인트",
            description: "이른 시간에 이동해 좋은 자리에서 일몰을 감상합니다.",
            meta: "차량 28분",
            cost: "무료",
            marker: { x: "31%", y: "18%" },
          },
        ],
      },
      day2: {
        label: "7월 25일",
        area: "페리사 · 피르고스",
        summary: "해변 휴식과 짧은 마을 산책으로 여유를 유지합니다.",
        route: "오늘 이동 약 22.6km · 차량 58분",
        items: [
          {
            time: "09:30",
            type: "식당",
            title: "숙소 조식",
            description: "테라스 조식 후 늦은 오전 일정으로 시작합니다.",
            meta: "체류 1시간",
            cost: "숙박 포함",
            marker: { x: "45%", y: "48%" },
          },
          {
            time: "11:30",
            type: "관광지",
            title: "페리사 블랙 비치",
            description: "비치 체어를 예약하고 해변에서 충분히 쉬어갑니다.",
            meta: "차량 26분",
            cost: "약 18,000원",
            marker: { x: "57%", y: "82%" },
          },
          {
            time: "15:30",
            type: "식당",
            title: "피르고스 카페",
            description: "언덕 마을의 조용한 카페에서 쉬며 사진을 남깁니다.",
            meta: "차량 16분",
            cost: "약 14,000원",
            marker: { x: "51%", y: "61%" },
          },
          {
            time: "20:00",
            type: "숙소",
            title: "호텔 복귀",
            description: "숙소 근처에서 가벼운 저녁 후 휴식합니다.",
            meta: "차량 14분",
            cost: "약 22,000원",
            marker: { x: "45%", y: "48%" },
          },
        ],
      },
      day3: {
        label: "7월 26일",
        area: "피라 · 공항",
        summary: "체크아웃 전 쇼핑과 점심만 가볍게 진행합니다.",
        route: "오늘 이동 약 8.8km · 차량 24분",
        items: [
          {
            time: "09:00",
            type: "숙소",
            title: "체크아웃 준비",
            description: "느긋한 조식 후 짐을 맡기고 마지막 산책을 준비합니다.",
            meta: "체류 1시간 30분",
            cost: "숙박 포함",
            marker: { x: "45%", y: "48%" },
          },
          {
            time: "11:00",
            type: "관광지",
            title: "피라 중심가 산책",
            description: "기념품 숍과 전망 골목을 무리 없이 둘러봅니다.",
            meta: "도보 10분",
            cost: "무료",
            marker: { x: "43%", y: "45%" },
          },
          {
            time: "13:00",
            type: "식당",
            title: "마지막 수블라키 점심",
            description: "공항 이동 전 간단한 현지식 점심을 먹습니다.",
            meta: "도보 6분",
            cost: "약 16,000원",
            marker: { x: "46%", y: "47%" },
          },
          {
            time: "15:30",
            type: "이동",
            title: "공항 이동",
            description: "예약 차량으로 공항까지 이동해 출국을 준비합니다.",
            meta: "차량 18분",
            cost: "약 32,000원",
            marker: { x: "62%", y: "76%" },
          },
        ],
      },
    },
  },
  balance: {
    id: "balance",
    title: "감성과 관광의 균형",
    subtitle: "대표 명소, 맛집, 자유 시간을 고르게 담은 균형형 상세 일정",
    destination: "산토리니",
    dateRange: "2026.07.24 - 2026.07.26",
    budget: "1인 약 148만 원",
    movement: "보통 · 하루 3~4곳",
    hotel: "이메로비글리 선셋 호텔",
    tags: ["AI 추천", "맛집", "사진", "적당한 이동"],
    days: {
      day1: {
        label: "7월 24일",
        area: "공항 · 피라 · 오이아",
        summary: "첫날은 도착, 피라 산책, 오이아 노을을 균형 있게 배치합니다.",
        route: "오늘 이동 약 18.4km · 차량 52분",
        items: [
          {
            time: "08:30",
            type: "이동",
            title: "산토리니 도착",
            description: "공항에서 픽업 차량으로 숙소 근처까지 이동합니다.",
            meta: "차량 18분",
            cost: "약 32,000원",
            marker: { x: "62%", y: "76%" },
          },
          {
            time: "10:30",
            type: "관광지",
            title: "피라 마을 산책",
            description: "절벽길, 전망 골목, 작은 상점을 천천히 둘러봅니다.",
            meta: "체류 1시간 40분",
            cost: "무료",
            marker: { x: "43%", y: "45%" },
          },
          {
            time: "13:00",
            type: "식당",
            title: "칼데라 뷰 점심",
            description: "현지 해산물과 그리스식 샐러드를 함께 먹습니다.",
            meta: "도보 8분",
            cost: "약 42,000원",
            marker: { x: "41%", y: "42%" },
          },
          {
            time: "16:40",
            type: "관광지",
            title: "오이아 노을 감상",
            description: "일몰 명소로 이동해 사진과 자유 시간을 확보합니다.",
            meta: "차량 28분",
            cost: "무료",
            marker: { x: "31%", y: "18%" },
          },
          {
            time: "20:20",
            type: "숙소",
            title: "이메로비글리 선셋 호텔",
            description: "숙소 체크인 후 다음 날 동선을 확인합니다.",
            meta: "차량 18분",
            cost: "숙박 포함",
            marker: { x: "39%", y: "35%" },
          },
        ],
      },
      day2: {
        label: "7월 25일",
        area: "이메로비글리 · 레드 비치 · 피르고스",
        summary: "사진 명소와 맛집, 마을 산책을 하루 안에 자연스럽게 연결합니다.",
        route: "오늘 이동 약 31.7km · 차량 1시간 18분",
        items: [
          {
            time: "09:00",
            type: "식당",
            title: "숙소 조식",
            description: "전망 좋은 테라스에서 가볍게 하루를 시작합니다.",
            meta: "체류 50분",
            cost: "숙박 포함",
            marker: { x: "39%", y: "35%" },
          },
          {
            time: "10:30",
            type: "관광지",
            title: "스카로스 바위 전망길",
            description: "짧은 하이킹으로 칼데라 전망을 감상합니다.",
            meta: "도보 15분",
            cost: "무료",
            marker: { x: "37%", y: "31%" },
          },
          {
            time: "13:10",
            type: "식당",
            title: "피르고스 로컬 타베르나",
            description: "마을 중심의 현지식 점심과 짧은 골목 산책을 함께합니다.",
            meta: "차량 22분",
            cost: "약 34,000원",
            marker: { x: "51%", y: "61%" },
          },
          {
            time: "16:00",
            type: "관광지",
            title: "레드 비치",
            description: "해변 전망 포인트와 자유 사진 시간을 확보합니다.",
            meta: "차량 20분",
            cost: "무료",
            marker: { x: "38%", y: "84%" },
          },
          {
            time: "19:30",
            type: "이동",
            title: "숙소 복귀",
            description: "일몰 시간 이후 숙소로 돌아와 휴식합니다.",
            meta: "차량 36분",
            cost: "약 35,000원",
            marker: { x: "39%", y: "35%" },
          },
        ],
      },
      day3: {
        label: "7월 26일",
        area: "피라 · 공항",
        summary: "마지막 날은 쇼핑, 점심, 공항 이동으로 간결하게 마무리합니다.",
        route: "오늘 이동 약 12.1km · 차량 32분",
        items: [
          {
            time: "09:00",
            type: "숙소",
            title: "호텔 조식과 체크아웃",
            description: "짐을 정리하고 프런트에 보관을 요청합니다.",
            meta: "체류 1시간",
            cost: "숙박 포함",
            marker: { x: "39%", y: "35%" },
          },
          {
            time: "11:00",
            type: "관광지",
            title: "피라 기념품 쇼핑",
            description: "올리브 제품과 세라믹 소품을 둘러봅니다.",
            meta: "차량 10분",
            cost: "개별 구매",
            marker: { x: "43%", y: "45%" },
          },
          {
            time: "13:00",
            type: "식당",
            title: "현지식 수블라키 점심",
            description: "공항 이동 전 부담 없는 점심으로 마무리합니다.",
            meta: "도보 7분",
            cost: "약 18,000원",
            marker: { x: "46%", y: "47%" },
          },
          {
            time: "15:30",
            type: "이동",
            title: "공항 이동",
            description: "예약 차량으로 공항까지 이동합니다.",
            meta: "차량 18분",
            cost: "약 32,000원",
            marker: { x: "62%", y: "76%" },
          },
        ],
      },
    },
  },
  active: {
    id: "active",
    title: "섬 구석구석 액티브",
    subtitle: "하이킹, 보트 투어, 로컬 탐방을 촘촘히 담은 활동형 상세 일정",
    destination: "산토리니",
    dateRange: "2026.07.24 - 2026.07.26",
    budget: "1인 약 176만 원",
    movement: "높음 · 하루 4~6곳",
    hotel: "피라 중심 액티비티 호텔",
    tags: ["액티비티", "하이킹", "보트 투어", "이동 많음"],
    days: {
      day1: {
        label: "7월 24일",
        area: "공항 · 피라 · 오이아",
        summary: "도착 직후부터 전망 산책과 야경까지 빠르게 둘러봅니다.",
        route: "오늘 이동 약 21.5km · 차량 1시간 4분",
        items: [
          {
            time: "08:20",
            type: "이동",
            title: "산토리니 공항 도착",
            description: "렌터카 픽업 후 피라 방향으로 이동합니다.",
            meta: "차량 18분",
            cost: "약 48,000원",
            marker: { x: "62%", y: "76%" },
          },
          {
            time: "10:00",
            type: "관광지",
            title: "피라 절벽길 워킹",
            description: "피라 전망길을 따라 핵심 포인트를 빠르게 봅니다.",
            meta: "체류 1시간 20분",
            cost: "무료",
            marker: { x: "43%", y: "45%" },
          },
          {
            time: "12:30",
            type: "식당",
            title: "피라 현지식 점심",
            description: "오후 이동 전 든든한 그리스식 점심을 먹습니다.",
            meta: "도보 7분",
            cost: "약 30,000원",
            marker: { x: "46%", y: "47%" },
          },
          {
            time: "15:00",
            type: "관광지",
            title: "오이아 골목 탐방",
            description: "북쪽 마을 골목과 전망 포인트를 넓게 둘러봅니다.",
            meta: "차량 28분",
            cost: "무료",
            marker: { x: "31%", y: "18%" },
          },
          {
            time: "20:30",
            type: "숙소",
            title: "피라 중심 호텔",
            description: "늦은 체크인 후 다음 날 투어 준비를 합니다.",
            meta: "차량 30분",
            cost: "숙박 포함",
            marker: { x: "45%", y: "48%" },
          },
        ],
      },
      day2: {
        label: "7월 25일",
        area: "화산섬 · 온천 · 피르고스",
        summary: "보트 투어와 마을 탐방을 연결하는 가장 활동적인 날입니다.",
        route: "오늘 이동 약 36.4km · 차량 1시간 30분",
        items: [
          {
            time: "08:00",
            type: "이동",
            title: "아티니오스 항구 이동",
            description: "화산섬 보트 투어 탑승을 위해 항구로 이동합니다.",
            meta: "차량 28분",
            cost: "약 28,000원",
            marker: { x: "49%", y: "69%" },
          },
          {
            time: "09:20",
            type: "관광지",
            title: "화산섬 보트 투어",
            description: "화산 지형 트레킹과 온천 체험을 포함한 반일 투어입니다.",
            meta: "체류 4시간",
            cost: "약 82,000원",
            marker: { x: "27%", y: "56%" },
          },
          {
            time: "14:30",
            type: "식당",
            title: "항구 해산물 점심",
            description: "보트 투어 후 항구 근처에서 늦은 점심을 먹습니다.",
            meta: "도보 8분",
            cost: "약 40,000원",
            marker: { x: "49%", y: "69%" },
          },
          {
            time: "17:00",
            type: "관광지",
            title: "피르고스 전망 마을",
            description: "언덕길을 따라 전망대와 골목을 빠르게 탐방합니다.",
            meta: "차량 16분",
            cost: "무료",
            marker: { x: "51%", y: "61%" },
          },
          {
            time: "20:00",
            type: "숙소",
            title: "호텔 복귀",
            description: "숙소 근처에서 간단히 쉬며 다음 날 이동을 준비합니다.",
            meta: "차량 17분",
            cost: "숙박 포함",
            marker: { x: "45%", y: "48%" },
          },
        ],
      },
      day3: {
        label: "7월 26일",
        area: "아크로티리 · 공항",
        summary: "마지막 날까지 유적과 해변 포인트를 보고 공항으로 이동합니다.",
        route: "오늘 이동 약 29.9km · 차량 1시간 12분",
        items: [
          {
            time: "08:30",
            type: "숙소",
            title: "체크아웃",
            description: "이른 체크아웃 후 짐을 차량에 싣고 남부로 이동합니다.",
            meta: "체류 40분",
            cost: "숙박 포함",
            marker: { x: "45%", y: "48%" },
          },
          {
            time: "10:00",
            type: "관광지",
            title: "아크로티리 유적",
            description: "고대 유적지를 둘러보고 남부 해변으로 이동합니다.",
            meta: "차량 28분",
            cost: "약 18,000원",
            marker: { x: "36%", y: "80%" },
          },
          {
            time: "12:30",
            type: "식당",
            title: "레드 비치 근처 점심",
            description: "남부 해변 근처에서 간단한 점심을 먹습니다.",
            meta: "차량 7분",
            cost: "약 24,000원",
            marker: { x: "38%", y: "84%" },
          },
          {
            time: "14:00",
            type: "관광지",
            title: "레드 비치 전망 포인트",
            description: "출국 전 마지막 사진 포인트를 짧게 방문합니다.",
            meta: "체류 45분",
            cost: "무료",
            marker: { x: "39%", y: "86%" },
          },
          {
            time: "16:00",
            type: "이동",
            title: "공항 이동",
            description: "남부에서 공항으로 이동해 출국 수속을 준비합니다.",
            meta: "차량 26분",
            cost: "약 42,000원",
            marker: { x: "62%", y: "76%" },
          },
        ],
      },
    },
  },
};

function cloneTripPlan(plan: TripPlan): TripPlan {
  const fallbackBounds = plan.destination.includes("산토리니") ? santoriniMapBounds : undefined;

  return {
    ...plan,
    tags: [...plan.tags],
    days: {
      day1: { ...plan.days.day1, items: plan.days.day1.items.map((item) => withNormalizedActivityCoordinates(item, fallbackBounds)) },
      day2: { ...plan.days.day2, items: plan.days.day2.items.map((item) => withNormalizedActivityCoordinates(item, fallbackBounds)) },
      day3: { ...plan.days.day3, items: plan.days.day3.items.map((item) => withNormalizedActivityCoordinates(item, fallbackBounds)) },
    },
  };
}

function isPlanId(id: string): id is PlanId {
  return id === "relax" || id === "balance" || id === "active";
}

function InvalidPlanScreen({ id }: { id: string }) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-6 text-[var(--foreground)]">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-[24px] border border-white/80 bg-white/80 px-5 py-3 shadow-[var(--shadow-sm)] backdrop-blur-xl">
        <Link className="flex items-center gap-3" href="/" aria-label="TripMate AI 홈">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--primary-2))] text-lg font-black text-white">
            ✦
          </span>
          <span className="text-lg font-black sm:text-xl">TripMate AI</span>
        </Link>
        <Link className="text-sm font-extrabold text-[var(--primary)]" href="/plans">
          플랜 비교로 돌아가기
        </Link>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-120px)] max-w-5xl place-items-center py-16">
        <div className="w-full rounded-[32px] border border-white bg-white/90 p-8 text-center shadow-[var(--shadow)] backdrop-blur md:p-14">
          <p className="mx-auto mb-5 inline-flex rounded-full border border-[#e4d9ff] bg-[var(--primary-soft)] px-4 py-2 text-sm font-black text-[var(--primary)]">
            ✦ 플랜을 찾을 수 없음
          </p>
          <h1 className="text-4xl font-black leading-tight md:text-5xl">존재하지 않는 플랜입니다.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            요청한 플랜 ID `{id}`에 해당하는 mock 일정이 없습니다. 플랜 비교 화면에서 다시 선택해 주세요.
          </p>
          <Link
            className="mt-8 inline-flex min-h-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-2))] px-7 text-base font-extrabold text-white shadow-[0_14px_34px_rgba(116,71,239,0.28)]"
            href="/plans"
          >
            플랜 다시 선택하기
          </Link>
        </div>
      </section>
    </main>
  );
}

function ItineraryStatusScreen({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-5 py-12 text-[var(--foreground)]">
      <section className="w-full max-w-2xl rounded-[32px] border border-white bg-white/90 p-8 text-center shadow-[var(--shadow)] md:p-12">
        <p className="text-sm font-black text-[var(--primary)]">AI 상세 일정</p>
        <h1 className="mt-3 text-3xl font-black md:text-4xl">{error ? "상세 일정을 만들지 못했습니다." : "선택한 플랜의 상세 일정을 만들고 있어요."}</h1>
        <p className="mt-4 leading-7 text-[var(--muted)]">{error ?? "관광지, 식당, 숙소와 이동 동선을 날짜별로 구성하고 있습니다."}</p>
        {error ? (
          <button className="mt-7 rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-2))] px-7 py-4 text-sm font-extrabold text-white" type="button" onClick={onRetry}>
            다시 시도
          </button>
        ) : (
          <div className="mx-auto mt-7 h-2 max-w-sm overflow-hidden rounded-full bg-[#ece9f3]">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[linear-gradient(90deg,var(--primary),var(--primary-2))]" />
          </div>
        )}
      </section>
    </main>
  );
}

function ScheduleList({ items }: { items: ScheduleItem[] }) {
  return (
    <div className="grid gap-4">
      {items.map((item, index) => (
        <article key={`${item.time}-${item.title}`} className="rounded-[24px] border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-sm)]">
          <div className="flex gap-4">
            <div className="flex w-14 shrink-0 flex-col items-center">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-2))] text-sm font-black text-white">
                {index + 1}
              </span>
              <span className="mt-3 text-xs font-black text-[var(--primary)]">{item.time}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-black ${typeStyles[item.type]}`}>{item.type}</span>
                <span className="text-xs font-bold text-[var(--muted)]">{item.meta}</span>
              </div>
              <h3 className="mt-3 text-xl font-black text-[#17151f]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
              <div className="mt-4 rounded-2xl bg-[#fbfafd] px-4 py-3 text-sm font-extrabold text-[#625d6d]">
                예상 비용: {item.cost}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function ChatPanel({
  messages,
  inputValue,
  isResponding,
  errorMessage,
  onInputChange,
  onSubmit,
  onRetry,
}: {
  messages: ChatMessage[];
  inputValue: string;
  isResponding: boolean;
  errorMessage: string | null;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRetry: () => void;
}) {
  const messagesViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isResponding, errorMessage]);

  return (
    <aside className="flex h-[calc(100vh-10rem)] min-h-[480px] flex-col overflow-hidden rounded-[32px] border border-white bg-[#fcfbfd] shadow-[var(--shadow)] lg:h-[calc(100vh-8rem)] lg:max-h-[720px] lg:min-h-[620px]">
      <div className="flex min-h-16 items-center justify-between border-b border-[var(--line)] bg-white/85 px-5 py-4">
        <strong className="flex items-center gap-2 text-sm font-black">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2d9960] shadow-[0_0_0_5px_rgba(45,153,96,0.1)]" />
          AI 여행 도우미
        </strong>
        <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-black text-[var(--primary)]">Mock</span>
      </div>

      <div ref={messagesViewportRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[92%] rounded-[18px] px-4 py-3 text-sm leading-6 ${
              message.role === "user"
                ? "self-end rounded-br-md bg-[linear-gradient(135deg,var(--primary),var(--primary-2))] text-white"
                : "self-start border border-[var(--line)] bg-white text-[#4c4655]"
            }`}
          >
            <p>{message.text}</p>
            {message.change ? (
              <div className="mt-3 rounded-2xl bg-[#f8f6fc] p-3 text-xs font-bold leading-6 text-[#5b5364]">
                <div className="font-black text-[#b15929]">변경 전</div>
                {message.change.before.map((item) => (
                  <div key={item}>- {item}</div>
                ))}
                <div className="mt-2 font-black text-[var(--primary)]">변경 후</div>
                {message.change.after.map((item) => (
                  <div key={item}>+ {item}</div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {isResponding ? (
          <div className="self-start rounded-[18px] border border-[var(--line)] bg-white px-4 py-3 text-sm font-bold text-[var(--muted)]">
            일정을 다시 구성하는 중...
          </div>
        ) : null}
        {errorMessage ? (
          <div className="self-start rounded-[18px] border border-[#f0cfc7] bg-[#fff7f4] px-4 py-3 text-sm text-[#9b4433]" role="alert">
            <p className="font-bold leading-6">{errorMessage}</p>
            <button className="mt-2 rounded-full border border-[#dcb3a9] bg-white px-3 py-1.5 text-xs font-black" type="button" onClick={onRetry} disabled={isResponding}>
              다시 시도
            </button>
          </div>
        ) : null}
      </div>

      <div className="border-t border-[var(--line)] bg-white p-4">
        <form className="flex gap-2 rounded-[20px] border border-[#e4dfeb] bg-[#fbfafd] p-2" onSubmit={onSubmit}>
          <input
            className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-[#9b95a5]"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="예: 둘째 날 일정을 여유롭게 바꿔줘"
          />
          <button
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-2))] text-lg font-black text-white disabled:opacity-50"
            type="submit"
            disabled={isResponding}
            aria-label="수정 요청 전송"
          >
            →
          </button>
        </form>
      </div>
    </aside>
  );
}

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const requestedId = params.id;
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [itineraryError, setItineraryError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [activeDay, setActiveDay] = useState<DayKey>("day1");
  const [mobilePanel, setMobilePanel] = useState<"schedule" | "map" | "chat">("schedule");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatInput, setChatInput] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const requestInFlightRef = useRef(false);
  const itineraryRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isPlanId(requestedId)) return;
    const requestKey = `${requestedId}:${loadAttempt}`;
    if (itineraryRequestRef.current === requestKey) return;
    itineraryRequestRef.current = requestKey;
    setItineraryError(null);

    const cacheKey = `tripmate.generatedItinerary.${requestedId}`;
    if (loadAttempt === 0) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const response = JSON.parse(cached) as GenerateItineraryResponse;
          if (response.plan?.id === requestedId) {
            queueMicrotask(() => setTrip(cloneTripPlan(response.plan)));
            return;
          }
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }
    }

    const fallback = tripPlans[requestedId];
    const fallbackPlan: PlanSummary = {
      id: fallback.id,
      title: fallback.title,
      subtitle: fallback.subtitle,
      destination: fallback.destination,
      dateRange: fallback.dateRange,
      budget: fallback.budget,
      movement: fallback.movement,
      hotel: fallback.hotel,
      tags: [...fallback.tags],
      highlights: fallback.tags.slice(0, 3),
    };
    const fallbackPreferences: TripPreferences = {
      destination: fallback.destination,
      startDate: "2026-07-24",
      endDate: "2026-07-26",
      companion: "연인",
      interests: fallback.tags,
      budgetPerPerson: fallback.budget,
      pace: requestedId === "relax" ? "여유롭게" : requestedId === "active" ? "알차게" : "적당히",
    };
    let requestBody: GenerateItineraryRequest = { plan: fallbackPlan, preferences: fallbackPreferences };
    const selected = sessionStorage.getItem("tripmate.selectedPlan");
    if (selected) {
      try {
        const parsed = JSON.parse(selected) as GenerateItineraryRequest & { selectedAt?: string };
        if (parsed.plan?.id === requestedId && parsed.preferences) requestBody = { plan: parsed.plan, preferences: parsed.preferences };
      } catch {
        // The fallback above keeps direct links usable when session data is invalid.
      }
    }

    void fetch("/api/itinerary/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })
      .then(async (response) => {
        const data = (await response.json()) as GenerateItineraryResponse | { error?: string };
        if (!response.ok) throw new Error("error" in data && data.error ? data.error : "상세 일정을 만들지 못했습니다.");
        const generated = data as GenerateItineraryResponse;
        sessionStorage.setItem(cacheKey, JSON.stringify(generated));
        setTrip(cloneTripPlan(generated.plan));
      })
      .catch((error: unknown) => {
        setItineraryError(error instanceof Error ? error.message : "상세 일정 생성 중 오류가 발생했습니다.");
      });
  }, [loadAttempt, requestedId]);

  if (!isPlanId(requestedId)) {
    return <InvalidPlanScreen id={requestedId} />;
  }

  if (!trip) {
    return <ItineraryStatusScreen error={itineraryError} onRetry={() => setLoadAttempt((current) => current + 1)} />;
  }

  const currentDay = trip.days[activeDay];

  const summaryItems = [
    ["여행지", trip.destination],
    ["기간", trip.dateRange],
    ["예산", trip.budget],
    ["이동량", trip.movement],
    ["숙소", trip.hotel],
  ];

  async function requestItineraryModification(message: string, appendUserMessage: boolean) {
    if (!trip || !message || requestInFlightRef.current) return;
    requestInFlightRef.current = true;

    const modificationRequest: ModifyItineraryRequest = {
      planId: trip.id,
      message,
      currentItinerary: Object.values(trip.days),
    };

    if (appendUserMessage) {
      setMessages((current) => [...current, { id: Date.now(), role: "user", text: message }]);
      setChatInput("");
    }
    setIsResponding(true);
    setChatError(null);

    try {
      const response = await fetch("/api/itinerary/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modificationRequest),
      });
      const data = (await response.json()) as ModifyItineraryResponse | { error?: string };

      if (!response.ok) {
        throw new Error("error" in data && data.error ? data.error : "일정을 수정하지 못했습니다.");
      }

      const modificationResponse = data as ModifyItineraryResponse;
      const changedDay = modificationResponse.changes[0]?.dayId;
      setTrip(cloneTripPlan(modificationResponse.plan));
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "ai",
          text: modificationResponse.message,
          change: modificationResponse.changes.length
            ? {
                before: modificationResponse.changes.flatMap((change) => change.before),
                after: modificationResponse.changes.flatMap((change) => change.after),
              }
            : undefined,
        },
      ]);
      if (changedDay) setActiveDay(changedDay);
      setMobilePanel("schedule");
      setRetryMessage(null);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      setRetryMessage(message);
    } finally {
      requestInFlightRef.current = false;
      setIsResponding(false);
    }
  }

  function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void requestItineraryModification(chatInput.trim(), true);
  }

  function handleRetry() {
    if (retryMessage) void requestItineraryModification(retryMessage, false);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-6 text-[var(--foreground)]">
      <header className="mx-auto flex max-w-[96rem] items-center justify-between gap-4 rounded-[24px] border border-white/80 bg-white/80 px-5 py-3 shadow-[var(--shadow-sm)] backdrop-blur-xl">
        <Link className="flex items-center gap-3" href="/" aria-label="TripMate AI 홈">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--primary-2))] text-lg font-black text-white">
            ✦
          </span>
          <span className="text-lg font-black sm:text-xl">TripMate AI</span>
        </Link>
        <Link className="text-sm font-extrabold text-[var(--primary)]" href="/plans">
          플랜 비교로 돌아가기
        </Link>
      </header>

      <section className="mx-auto max-w-[96rem] py-10 lg:py-14">
        <div className="rounded-[32px] border border-white bg-white/85 p-6 shadow-[var(--shadow)] backdrop-blur md:p-9">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-[#e4d9ff] bg-[var(--primary-soft)] px-4 py-2 text-sm font-black text-[var(--primary)]">
                ✦ 상세 일정
              </p>
              <h1 className="text-4xl font-black leading-tight md:text-5xl">{trip.title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">{trip.subtitle}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {trip.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-[var(--primary-soft)] px-3 py-2 text-xs font-extrabold text-[var(--primary)]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-2 rounded-[24px] border border-[var(--line)] bg-white p-4 text-sm shadow-[var(--shadow-sm)] sm:grid-cols-2 lg:min-w-[430px]">
              {summaryItems.map(([label, value]) => (
                <div key={label} className={label === "숙소" ? "rounded-2xl bg-[#fbfafd] px-4 py-3 sm:col-span-2" : "rounded-2xl bg-[#fbfafd] px-4 py-3"}>
                  <div className="text-xs font-black text-[var(--primary)]">{label}</div>
                  <div className="mt-1 font-extrabold text-[#312d3a]">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-white bg-white/80 p-3 shadow-[var(--shadow-sm)]">
          <div className="grid grid-cols-3 gap-2 rounded-[20px] bg-[#f5f2fb] p-1">
            {dayTabs.map((day) => (
              <button
                key={day.key}
                className={`rounded-2xl px-3 py-3 text-sm font-black transition ${
                  activeDay === day.key ? "bg-white text-[var(--primary)] shadow-[0_4px_12px_rgba(47,37,74,0.08)]" : "text-[var(--muted)]"
                }`}
                type="button"
                onClick={() => setActiveDay(day.key)}
              >
                <span className="block">{day.label}</span>
                <span className="mt-1 block text-xs font-bold">{trip.days[day.key].label}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 lg:hidden">
            {[
              ["schedule", "일정"],
              ["map", "지도"],
              ["chat", "AI 채팅"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`rounded-2xl px-4 py-3 text-sm font-black ${
                  mobilePanel === key ? "bg-[var(--primary)] text-white" : "bg-white text-[#625d6d]"
                }`}
                type="button"
                onClick={() => setMobilePanel(key as "schedule" | "map" | "chat")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(300px,0.9fr)_minmax(320px,1fr)_minmax(280px,0.8fr)] lg:items-start">
          <section className={`${mobilePanel === "schedule" ? "block" : "hidden"} lg:block`}>
            <div className="mb-5 rounded-[28px] border border-white bg-white/85 p-6 shadow-[var(--shadow-sm)]">
              <div className="text-sm font-black text-[var(--primary)]">{currentDay.area}</div>
              <h2 className="mt-2 text-2xl font-black">{currentDay.summary}</h2>
              <p className="mt-3 text-sm font-bold text-[var(--muted)]">{currentDay.route}</p>
            </div>
            <ScheduleList items={currentDay.items} />
          </section>

          <div className={`${mobilePanel === "map" ? "block" : "hidden"} lg:sticky lg:top-8 lg:block`}>
            <KakaoMap activities={currentDay.items} area={currentDay.area} route={currentDay.route} />
          </div>

          <div className={`${mobilePanel === "chat" ? "block" : "hidden"} lg:sticky lg:top-8 lg:block`}>
            <ChatPanel
              messages={messages}
              inputValue={chatInput}
              isResponding={isResponding}
              errorMessage={chatError}
              onInputChange={setChatInput}
              onSubmit={handleChatSubmit}
              onRetry={handleRetry}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
