"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type { TripPreferences } from "@/types/trip";

const companionOptions: TripPreferences["companion"][] = ["혼자", "연인", "친구", "가족"];
const preferenceOptions = [
  "유명 관광지",
  "맛집 탐방",
  "카페",
  "쇼핑",
  "자연과 풍경",
  "역사와 문화",
  "액티비티",
  "휴양",
  "야경",
  "사진 촬영",
];
const budgetOptions = ["100만 원 이하", "100만 원 ~ 180만 원", "180만 원 ~ 250만 원", "250만 원 이상"];
const paceOptions: { value: TripPreferences["pace"]; caption: string }[] = [
  { value: "여유롭게", caption: "하루 핵심 장소 2~3개" },
  { value: "적당히", caption: "하루 핵심 장소 3~4개" },
  { value: "알차게", caption: "하루 핵심 장소 4~6개" },
];

type PlannerForm = TripPreferences;

const initialForm: PlannerForm = {
  destination: "산토리니, 그리스",
  startDate: "2026-07-24",
  endDate: "2026-07-26",
  companion: "연인",
  interests: ["맛집 탐방", "카페", "사진 촬영"],
  budgetPerPerson: "100만 원 ~ 180만 원",
  pace: "적당히",
};

export default function PlannerPage() {
  const router = useRouter();
  const [form, setForm] = useState<PlannerForm>(initialForm);

  const canSubmit = useMemo(
    () =>
      Boolean(
      form.destination.trim() &&
      form.startDate &&
      form.endDate &&
      form.companion &&
      form.interests.length > 0 &&
      form.budgetPerPerson &&
      form.pace,
      ),
    [form],
  );

  function updateField<Key extends keyof PlannerForm>(key: Key, value: PlannerForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function togglePreference(preference: string) {
    setForm((current) => {
      const exists = current.interests.includes(preference);
      return {
        ...current,
        interests: exists
          ? current.interests.filter((item) => item !== preference)
          : [...current.interests, preference],
      };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    sessionStorage.setItem(
      "tripmate.plannerInput",
      JSON.stringify({
        ...form,
        savedAt: new Date().toISOString(),
      }),
    );
    router.push("/plans");
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
        <Link className="text-sm font-extrabold text-[var(--primary)]" href="/">
          랜딩으로 돌아가기
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 py-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:py-20">
        <aside className="lg:sticky lg:top-8">
          <p className="mb-4 inline-flex rounded-full border border-[#e4d9ff] bg-[var(--primary-soft)] px-4 py-2 text-sm font-black text-[var(--primary)]">
            ✦ 여행 조건 입력
          </p>
          <h1 className="text-4xl font-black leading-tight md:text-6xl">
            긴 양식 없이 필요한 조건만 골라주세요.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">
            이번 단계에서는 외부 API 없이 입력값을 브라우저에 임시 저장하고, 다음 화면에서 플랜 비교 준비 상태로 이어집니다.
          </p>

          <div className="mt-8 grid gap-3 text-sm font-bold text-[#5e5968]">
            {["도시 1개 기준", "여행 기간 1~7일", "초안 3개 비교 준비"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/75 p-4 shadow-[var(--shadow-sm)]">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                  ✓
                </span>
                {item}
              </div>
            ))}
          </div>
        </aside>

        <form
          className="rounded-[32px] border border-white bg-white/90 p-5 shadow-[var(--shadow)] backdrop-blur md:p-9"
          onSubmit={handleSubmit}
        >
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-[var(--primary)]">STEP 1</p>
              <h2 className="mt-1 text-2xl font-black">여행 정보 입력</h2>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#ece9f3] sm:w-48">
              <div className="h-full w-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--primary-2))]" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-black">여행지</span>
              <input
                className="min-h-14 w-full rounded-2xl border border-[#e7e3ed] bg-[#fbfafd] px-4 outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(116,71,239,0.1)]"
                value={form.destination}
                onChange={(event) => updateField("destination", event.target.value)}
                placeholder="예: 오사카, 일본"
                required
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-black">출발일</span>
              <input
                className="min-h-14 w-full rounded-2xl border border-[#e7e3ed] bg-[#fbfafd] px-4 outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(116,71,239,0.1)]"
                type="date"
                value={form.startDate}
                onChange={(event) => updateField("startDate", event.target.value)}
                required
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-black">도착일</span>
              <input
                className="min-h-14 w-full rounded-2xl border border-[#e7e3ed] bg-[#fbfafd] px-4 outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(116,71,239,0.1)]"
                type="date"
                value={form.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
                required
              />
            </label>

            <section className="md:col-span-2">
              <h3 className="mb-3 text-sm font-black">동행 유형</h3>
              <div className="flex flex-wrap gap-2">
                {companionOptions.map((option) => {
                  const selected = form.companion === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      className={`rounded-full border px-5 py-3 text-sm font-extrabold transition ${
                        selected
                          ? "border-[#cbb8ff] bg-[var(--primary-soft)] text-[var(--primary)]"
                          : "border-[#e6e1ee] bg-white text-[#625d6d] hover:border-[#cbb8ff]"
                      }`}
                      onClick={() => updateField("companion", option)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="md:col-span-2">
              <div className="mb-3 flex items-baseline gap-2">
                <h3 className="text-sm font-black">여행 취향</h3>
                <span className="text-xs font-bold text-[var(--muted)]">복수 선택</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferenceOptions.map((option) => {
                  const selected = form.interests.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      className={`rounded-full border px-4 py-3 text-sm font-extrabold transition ${
                        selected
                          ? "border-[#cbb8ff] bg-[var(--primary-soft)] text-[var(--primary)]"
                          : "border-[#e6e1ee] bg-white text-[#625d6d] hover:border-[#cbb8ff]"
                      }`}
                      onClick={() => togglePreference(option)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </section>

            <label>
              <span className="mb-2 block text-sm font-black">1인 예산</span>
              <select
                className="min-h-14 w-full rounded-2xl border border-[#e7e3ed] bg-[#fbfafd] px-4 outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(116,71,239,0.1)]"
                value={form.budgetPerPerson}
                onChange={(event) => updateField("budgetPerPerson", event.target.value)}
              >
                {budgetOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <section>
              <h3 className="mb-3 text-sm font-black">일정 밀도</h3>
              <div className="grid gap-2">
                {paceOptions.map((option) => {
                  const selected = form.pace === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        selected
                          ? "border-[#cbb8ff] bg-[var(--primary-soft)]"
                          : "border-[#e6e1ee] bg-white hover:border-[#cbb8ff]"
                      }`}
                      onClick={() => updateField("pace", option.value)}
                    >
                      <span className="block text-sm font-black text-[#17151f]">{option.value}</span>
                      <span className="mt-1 block text-xs font-bold text-[var(--muted)]">{option.caption}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-[var(--muted)]">
              제출하면 입력값만 임시 저장되고, 아직 API는 호출하지 않습니다.
            </p>
            <button
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-2))] px-7 text-base font-extrabold text-white shadow-[0_14px_34px_rgba(116,71,239,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
              disabled={!canSubmit}
            >
              여행 초안 만들기
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
