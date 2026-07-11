import Link from "next/link";

const planNames: Record<string, string> = {
  relax: "느긋한 섬 휴식",
  balance: "감성과 관광의 균형",
  active: "섬 구석구석 액티브",
};

export default async function TripDetailPendingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const planName = planNames[id] ?? "선택한 여행 플랜";

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
            ✦ 상세 일정 준비 중
          </p>
          <h1 className="text-4xl font-black leading-tight md:text-5xl">{planName}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            이번 단계에서는 플랜 선택 이동까지만 구현했습니다. 다음 단계에서 날짜별 일정, 숙소, 맛집, 이동 동선을 이 화면에 연결합니다.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-2))] px-7 text-base font-extrabold text-white shadow-[0_14px_34px_rgba(116,71,239,0.28)]"
              href="/plans"
            >
              다른 플랜 보기
            </Link>
            <Link
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-[var(--line)] bg-white px-7 text-base font-extrabold text-[#17151f]"
              href="/planner"
            >
              조건 다시 입력
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
