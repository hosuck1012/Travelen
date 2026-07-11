"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

type PlannerInput = {
  destination: string;
  startDate: string;
  endDate: string;
  companion: string;
  preferences: string[];
  budget: string;
  pace: string;
};

type Plan = {
  id: string;
  tone: "relax" | "balance" | "active";
  badge: string;
  title: string;
  description: string;
  budget: string;
  movement: string;
  places: string[];
  tags: string[];
};

const defaultInput: PlannerInput = {
  destination: "산토리니, 그리스",
  startDate: "2026-07-24",
  endDate: "2026-07-26",
  companion: "연인",
  preferences: ["맛집 탐방", "카페", "사진 촬영"],
  budget: "100만 원 ~ 180만 원",
  pace: "적당히",
};

const plans: Plan[] = [
  {
    id: "relax",
    tone: "relax",
    badge: "휴식형",
    title: "느긋한 섬 휴식",
    description: "해변과 카페에 오래 머물며 노을 시간을 넉넉히 확보한 여유로운 일정입니다.",
    budget: "1인 약 124만 원",
    movement: "낮음 · 하루 2~3곳",
    places: ["페리사 해변", "피라 마을", "오이아 노을"],
    tags: ["휴양", "카페", "노을", "이동 적음"],
  },
  {
    id: "balance",
    tone: "balance",
    badge: "균형형",
    title: "감성과 관광의 균형",
    description: "대표 관광지, 맛집, 자유 시간을 고르게 배치한 가장 안정적인 추천 플랜입니다.",
    budget: "1인 약 148만 원",
    movement: "보통 · 하루 3~4곳",
    places: ["오이아 마을", "이메로비글리", "현지 맛집 거리"],
    tags: ["AI 추천", "맛집", "사진", "적당한 이동"],
  },
  {
    id: "active",
    tone: "active",
    badge: "활동형",
    title: "섬 구석구석 액티브",
    description: "하이킹과 보트 투어, 로컬 마을 탐방을 촘촘히 담은 활동적인 일정입니다.",
    budget: "1인 약 176만 원",
    movement: "높음 · 하루 4~6곳",
    places: ["스카로스 바위", "화산섬 투어", "아크로티리 유적"],
    tags: ["액티비티", "로컬 체험", "하이킹", "이동 많음"],
  },
];

const toneStyles = {
  relax: {
    image:
      "bg-[radial-gradient(circle_at_72%_27%,#fff0c9_0_7%,transparent_8%),linear-gradient(155deg,transparent_0_45%,#6c5d8d_46%_57%,#44385f_58%),linear-gradient(180deg,#9f91ea_0%,#f0a99f_52%,#75a8c9_100%)]",
    tag: "bg-[#e9f7ef] text-[#237b4e]",
  },
  balance: {
    image:
      "bg-[radial-gradient(circle_at_68%_23%,#fff3c5_0_6%,transparent_7%),linear-gradient(145deg,transparent_0_52%,#67577d_53%_61%,#4d3e61_62%),linear-gradient(180deg,#8f7ce6_0%,#efb29c_52%,#6fa2c8_100%)]",
    tag: "bg-[var(--primary-soft)] text-[var(--primary)]",
  },
  active: {
    image:
      "bg-[radial-gradient(circle_at_22%_18%,#ffd8a2_0_6%,transparent_7%),linear-gradient(145deg,transparent_0_33%,#965e47_34%_48%,#463943_49%),linear-gradient(180deg,#7fa8e8_0%,#e49a75_55%,#5b8bae_100%)]",
    tag: "bg-[#fff0e7] text-[#b15929]",
  },
};

function parsePlannerInput(raw: string | null): PlannerInput {
  if (!raw) return defaultInput;

  try {
    const parsed = JSON.parse(raw) as Partial<PlannerInput>;
    return {
      destination: parsed.destination || defaultInput.destination,
      startDate: parsed.startDate || defaultInput.startDate,
      endDate: parsed.endDate || defaultInput.endDate,
      companion: parsed.companion || defaultInput.companion,
      preferences: parsed.preferences?.length ? parsed.preferences : defaultInput.preferences,
      budget: parsed.budget || defaultInput.budget,
      pace: parsed.pace || defaultInput.pace,
    };
  } catch {
    return defaultInput;
  }
}

function getPlannerInputSnapshot() {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem("tripmate.plannerInput") ?? "";
}

function subscribePlannerInput(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function formatDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) return "날짜 미정";
  return `${startDate.replaceAll("-", ".")} - ${endDate.replaceAll("-", ".")}`;
}

export default function PlansPage() {
  const plannerInputSnapshot = useSyncExternalStore(subscribePlannerInput, getPlannerInputSnapshot, () => "");
  const plannerInput = useMemo(() => parsePlannerInput(plannerInputSnapshot), [plannerInputSnapshot]);

  const conditionItems = useMemo(
    () => [
      ["여행지", plannerInput.destination],
      ["기간", formatDateRange(plannerInput.startDate, plannerInput.endDate)],
      ["동행", plannerInput.companion],
      ["예산", plannerInput.budget],
      ["밀도", plannerInput.pace],
    ],
    [plannerInput],
  );

  function saveSelectedPlan(plan: Plan) {
    sessionStorage.setItem(
      "tripmate.selectedPlan",
      JSON.stringify({
        id: plan.id,
        title: plan.title,
        selectedAt: new Date().toISOString(),
      }),
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-6 text-[var(--foreground)]">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[24px] border border-white/80 bg-white/80 px-5 py-3 shadow-[var(--shadow-sm)] backdrop-blur-xl">
        <Link className="flex items-center gap-3" href="/" aria-label="TripMate AI 홈">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--primary-2))] text-lg font-black text-white">
            ✦
          </span>
          <span className="text-lg font-black sm:text-xl">TripMate AI</span>
        </Link>
        <Link className="text-sm font-extrabold text-[var(--primary)]" href="/planner">
          조건 다시 입력
        </Link>
      </header>

      <section className="mx-auto max-w-7xl py-12 lg:py-16">
        <div className="rounded-[32px] border border-white bg-white/85 p-6 shadow-[var(--shadow)] backdrop-blur md:p-10">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-[#e4d9ff] bg-[var(--primary-soft)] px-4 py-2 text-sm font-black text-[var(--primary)]">
                ✦ AI 추천 결과
              </p>
              <h1 className="text-4xl font-black leading-tight md:text-5xl">
                당신을 위한 3가지 여행 플랜
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
                입력한 조건을 기준으로 휴식형, 균형형, 활동형 mock 플랜을 비교합니다.
              </p>
            </div>

            <div className="grid gap-2 rounded-[24px] border border-[var(--line)] bg-white p-4 text-sm shadow-[var(--shadow-sm)] sm:grid-cols-2 lg:min-w-[430px]">
              {conditionItems.map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#fbfafd] px-4 py-3">
                  <div className="text-xs font-black text-[var(--primary)]">{label}</div>
                  <div className="mt-1 font-extrabold text-[#312d3a]">{value}</div>
                </div>
              ))}
              <div className="rounded-2xl bg-[#fbfafd] px-4 py-3 sm:col-span-2">
                <div className="text-xs font-black text-[var(--primary)]">취향</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {plannerInput.preferences.map((preference) => (
                    <span key={preference} className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-extrabold text-[var(--primary)]">
                      {preference}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => {
              const styles = toneStyles[plan.tone];
              return (
                <article
                  key={plan.id}
                  className="group overflow-hidden rounded-[28px] border border-[var(--line)] bg-white shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:shadow-[var(--shadow)]"
                >
                  <div className={`relative h-52 overflow-hidden ${styles.image}`}>
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(23,21,31,0.2))]" />
                    <span className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-[#312d3a] shadow-[var(--shadow-sm)]">
                      {plan.badge}
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-black">{plan.title}</h2>
                        <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${styles.tag}`}>
                          {plan.tags[0]}
                        </span>
                      </div>
                    </div>

                    <p className="mt-5 min-h-16 text-sm leading-6 text-[var(--muted)]">{plan.description}</p>

                    <div className="mt-6 grid gap-3 text-sm">
                      <div className="rounded-2xl bg-[#fbfafd] p-4">
                        <div className="text-xs font-black text-[var(--muted)]">예상 예산</div>
                        <div className="mt-1 text-lg font-black text-[var(--primary)]">{plan.budget}</div>
                      </div>
                      <div className="rounded-2xl bg-[#fbfafd] p-4">
                        <div className="text-xs font-black text-[var(--muted)]">이동량</div>
                        <div className="mt-1 font-extrabold text-[#312d3a]">{plan.movement}</div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="text-xs font-black text-[var(--muted)]">핵심 장소</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {plan.places.map((place) => (
                          <span key={place} className="rounded-full bg-[#f6f4f8] px-3 py-2 text-xs font-extrabold text-[#625d6d]">
                            {place}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {plan.tags.slice(1).map((tag) => (
                        <span key={tag} className="rounded-full bg-[#f6f4f8] px-3 py-2 text-xs font-extrabold text-[#625d6d]">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <Link
                      className="mt-7 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-2))] px-6 text-sm font-extrabold text-white shadow-[0_14px_34px_rgba(116,71,239,0.24)] transition hover:-translate-y-0.5"
                      href={`/trips/${plan.id}`}
                      onClick={() => saveSelectedPlan(plan)}
                    >
                      이 플랜으로 상세 일정 만들기
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
