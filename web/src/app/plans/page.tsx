"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import type { GeneratePlansResponse, PlanId, TripPlan } from "@/types/trip";

const planBadges: Record<PlanId, string> = { relax: "휴식형", balance: "균형형", active: "활동형" };

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

function parseGeneratedPlans(raw: string): GeneratePlansResponse | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GeneratePlansResponse;
    return parsed.preferences && Array.isArray(parsed.plans) && parsed.plans.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function getGeneratedPlansSnapshot() {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem("tripmate.generatedPlans") ?? "";
}

function subscribeGeneratedPlans(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function formatDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) return "날짜 미정";
  return `${startDate.replaceAll("-", ".")} - ${endDate.replaceAll("-", ".")}`;
}

export default function PlansPage() {
  const generatedPlansSnapshot = useSyncExternalStore(subscribeGeneratedPlans, getGeneratedPlansSnapshot, () => "");
  const generatedPlans = useMemo(() => parseGeneratedPlans(generatedPlansSnapshot), [generatedPlansSnapshot]);

  if (!generatedPlans) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--background)] px-5 py-12 text-[var(--foreground)]">
        <section className="w-full max-w-2xl rounded-[32px] border border-white bg-white/90 p-8 text-center shadow-[var(--shadow)] md:p-12">
          <p className="text-sm font-black text-[var(--primary)]">여행 플랜 없음</p>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">먼저 여행 조건을 입력해 주세요.</h1>
          <p className="mt-4 leading-7 text-[var(--muted)]">저장된 플랜이 없거나 만료되었습니다. 조건을 입력하면 새로운 플랜 3개를 준비합니다.</p>
          <Link className="mt-7 inline-flex min-h-13 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-2))] px-7 text-sm font-extrabold text-white" href="/planner">
            여행 조건 입력하기
          </Link>
        </section>
      </main>
    );
  }

  const plannerInput = generatedPlans.preferences;
  const plans = generatedPlans.plans;

  const conditionItems = [
    ["여행지", plannerInput.destination],
    ["기간", formatDateRange(plannerInput.startDate, plannerInput.endDate)],
    ["동행", plannerInput.companion],
    ["예산", plannerInput.budgetPerPerson],
    ["밀도", plannerInput.pace],
  ];

  function saveSelectedPlan(plan: TripPlan) {
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
                  {plannerInput.interests.map((preference) => (
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
              const styles = toneStyles[plan.id];
              const places = Array.from(
                new Set(Object.values(plan.days).flatMap((day) => day.items.filter((item) => item.type === "관광지").map((item) => item.title))),
              ).slice(0, 3);
              return (
                <article
                  key={plan.id}
                  className="group overflow-hidden rounded-[28px] border border-[var(--line)] bg-white shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:shadow-[var(--shadow)]"
                >
                  <div className={`relative h-52 overflow-hidden ${styles.image}`}>
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(23,21,31,0.2))]" />
                    <span className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-[#312d3a] shadow-[var(--shadow-sm)]">
                      {planBadges[plan.id]}
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

                    <p className="mt-5 min-h-16 text-sm leading-6 text-[var(--muted)]">{plan.subtitle}</p>

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
                        {places.map((place) => (
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
