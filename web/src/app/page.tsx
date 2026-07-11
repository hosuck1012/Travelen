import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "조건 선택",
    description: "도시, 날짜, 동행, 취향, 예산을 순서대로 선택합니다.",
  },
  {
    number: "02",
    title: "초안 비교",
    description: "관광형, 감성형, 가성비형처럼 다른 여행안을 비교합니다.",
  },
  {
    number: "03",
    title: "상세 일정",
    description: "선택한 초안을 바탕으로 일정과 이동 흐름을 구성합니다.",
  },
  {
    number: "04",
    title: "AI 수정",
    description: "바꾸고 싶은 부분만 자연어로 요청해 조정합니다.",
  },
];

const destinations = [
  {
    name: "산토리니",
    description: "노을, 해변, 감성 카페 중심의 여유로운 섬 여행",
    className: "bg-[linear-gradient(180deg,#8f7ce6_0%,#eba49d_46%,#75a8c9_100%)]",
  },
  {
    name: "파리",
    description: "미술관, 로컬 맛집, 야경 산책을 담은 도시 여행",
    className: "bg-[linear-gradient(180deg,#a9cae4_0%,#f3d7b0_54%,#7c996e_100%)]",
  },
  {
    name: "교토",
    description: "전통 골목, 사찰, 찻집을 천천히 즐기는 일정",
    className: "bg-[linear-gradient(180deg,#ead8cf_0%,#ef9aa2_44%,#6e5646_100%)]",
  },
  {
    name: "바르셀로나",
    description: "건축, 시장, 해변을 균형 있게 둘러보는 코스",
    className: "bg-[linear-gradient(180deg,#95c5e5_0%,#f0c987_55%,#d28365_100%)]",
  },
];

const heroStats = [
  ["3개", "여행 초안"],
  ["1~7일", "지원 기간"],
  ["AI", "부분 수정"],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-30 px-5 py-4 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 rounded-[24px] border border-white/80 bg-white/80 px-5 py-3 shadow-[var(--shadow-sm)]">
          <a className="flex items-center gap-3" href="#top" aria-label="TripMate AI 홈">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--primary-2))] text-lg font-black text-white shadow-[0_8px_18px_rgba(116,71,239,0.25)]">
              ✦
            </span>
            <span className="text-xl font-black">TripMate AI</span>
          </a>

          <div className="hidden items-center gap-8 text-sm font-bold text-[#5e5968] md:flex">
            <a className="transition hover:text-[var(--primary)]" href="#how">
              이용 방법
            </a>
            <a className="transition hover:text-[var(--primary)]" href="#destinations">
              추천 여행지
            </a>
            <a className="transition hover:text-[var(--primary)]" href="#features">
              주요 기능
            </a>
          </div>

          <Link
            className="rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-2))] px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(116,71,239,0.27)] transition hover:-translate-y-0.5"
            href="/planner"
          >
            여행 만들기
          </Link>
        </nav>
      </header>

      <section id="top" className="mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] lg:items-center lg:gap-10 lg:pb-28 lg:pt-20">
        <div className="relative z-10 min-w-0">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e4d9ff] bg-[var(--primary-soft)] px-4 py-2 text-sm font-extrabold text-[var(--primary)]">
            ✦ 취향 기반 AI 여행 플래너
          </p>
          <h1 className="max-w-[820px] text-5xl font-black leading-none text-[#17151f] md:text-6xl lg:text-[60px]">
            <span className="block">여행 조건만 고르면</span>
            <span className="mt-3 block text-[0.7em] leading-tight text-[var(--primary)] sm:whitespace-nowrap">
              AI가 일정과 동선을 준비해드립니다.
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted)]">
            TripMate AI는 취향과 예산에 맞는 여행 초안을 보여주고, 선택한 일정의 숙소와 맛집, 이동 흐름까지 한눈에 살펴볼 수 있게 도와줍니다.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-2))] px-7 text-base font-extrabold text-white shadow-[0_14px_34px_rgba(116,71,239,0.28)] transition hover:-translate-y-0.5"
              href="/planner"
            >
              여행 만들기
            </Link>
            <a
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-[var(--line)] bg-white px-7 text-base font-extrabold text-[#17151f] transition hover:-translate-y-0.5 hover:border-[#cbb8ff]"
              href="#destinations"
            >
              추천 여행지 보기
            </a>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            {heroStats.map(([value, label]) => (
              <div key={label} className="rounded-3xl border border-white bg-white/75 p-4 shadow-[var(--shadow-sm)]">
                <dt className="text-2xl font-black text-[var(--primary)]">{value}</dt>
                <dd className="mt-1 text-sm font-bold text-[var(--muted)]">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative z-0 mx-auto w-full max-w-2xl lg:max-w-[460px]">
          <div className="absolute -right-8 top-8 hidden h-[420px] w-[420px] rounded-full border border-dashed border-[rgba(116,71,239,0.24)] lg:block" />
          <div className="relative ml-auto aspect-[0.94] w-full max-w-[460px] overflow-hidden rounded-[48px] bg-[linear-gradient(180deg,#8a77d8_0%,#e69a98_40%,#f5d2b1_65%,#7ea8c6_100%)] shadow-[0_34px_80px_rgba(47,34,85,0.22)]">
            <div className="absolute right-[17%] top-[19%] h-16 w-16 rounded-full bg-[#ffefcf]/90 shadow-[0_0_50px_rgba(255,236,196,0.55)]" />
            <div className="absolute -left-[10%] -right-[8%] bottom-[18%] h-[34%] rotate-[-6deg] rounded-t-[55%] bg-[#654c77]/75" />
            <div className="absolute left-[6%] -right-[14%] bottom-[8%] h-[40%] rotate-[7deg] rounded-t-[58%] bg-[#775873]" />
            <div className="absolute inset-x-0 bottom-0 h-[24%] bg-[linear-gradient(180deg,rgba(130,177,204,0.92),#527e9d)]" />

            <div className="absolute bottom-[18%] right-[9%] z-10 grid grid-cols-3 gap-3">
              {["a", "b", "c", "d", "e"].map((item) => (
                <span
                  key={item}
                  className="block h-14 w-16 rounded-t-xl rounded-b bg-[#fffaf2] shadow-[inset_-8px_-8px_0_rgba(215,218,234,0.33)]"
                />
              ))}
            </div>
          </div>

          <article className="relative -mt-28 w-[min(360px,calc(100%-28px))] rounded-[22px] border border-white/80 bg-white/95 p-5 shadow-[0_20px_50px_rgba(24,20,39,0.2)] backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">산토리니 2박 3일</h2>
                <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                  감성 사진 · 해변 · 노을 코스
                </p>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-2))] text-xl font-black text-white">
                →
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-extrabold text-[#625d6d]">
              <span className="rounded-full bg-[var(--primary-soft)] px-3 py-2 text-[var(--primary)]">맛집</span>
              <span className="rounded-full bg-[#f5f2fb] px-3 py-2">카페</span>
              <span className="rounded-full bg-[#f5f2fb] px-3 py-2">이동 적음</span>
            </div>
          </article>
        </div>
      </section>

      <section id="how" className="px-5 py-20">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-white bg-white/85 p-6 shadow-[var(--shadow)] backdrop-blur md:p-14">
          <div className="max-w-5xl">
            <p className="mb-3 text-sm font-black text-[var(--primary)]">✦ 이용 방법</p>
            <h2 className="text-4xl font-black leading-tight text-[#17151f] md:text-5xl">
              필요한 조건만 고르면 여행 초안을 비교할 수 있어요.
            </h2>
            <p className="mt-4 text-base leading-8 text-[var(--muted)] lg:whitespace-nowrap xl:text-lg">
              조건 입력부터 초안 비교, 상세 일정 선택, AI 수정까지 자연스럽게 이어지는 흐름으로 구성합니다.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <article key={step.number} className="relative rounded-[24px] border border-[var(--line)] bg-white p-6">
                <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--primary-soft)] text-lg font-black text-[var(--primary)]">
                  {step.number}
                </div>
                <h3 className="text-xl font-black">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="destinations" className="mx-auto max-w-7xl px-5 py-20">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-sm font-black text-[var(--primary)]">✦ 추천 여행지</p>
            <h2 className="text-4xl font-black leading-tight md:text-5xl">여행 스타일별 추천 목적지</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              첫 단계에서는 실제 검색 없이 정적 카드로 여행 분위기와 서비스 방향을 보여줍니다.
            </p>
          </div>
          <a className="text-sm font-black text-[var(--primary)]" href="#top">
            위로 돌아가기
          </a>
        </div>

        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((destination) => (
            <article key={destination.name} className="group">
              <div className={`relative h-64 overflow-hidden rounded-[24px] shadow-[var(--shadow-sm)] transition group-hover:-translate-y-1 ${destination.className}`}>
                <div className="absolute inset-x-6 bottom-6 h-20 rounded-t-[55%] bg-black/20" />
                <div className="absolute right-7 top-7 h-12 w-12 rounded-full bg-white/60" />
              </div>
              <h3 className="mt-5 text-xl font-black">{destination.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{destination.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="px-5 pb-24 pt-10">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {[
            ["초안 3개 비교", "상세 검색 전에 서로 다른 여행 콘셉트를 먼저 비교합니다."],
            ["지도와 일정 연결", "다음 단계에서 날짜별 동선과 이동 시간을 함께 확인할 수 있게 확장합니다."],
            ["부분 수정 중심", "전체 일정을 다시 만들지 않고 필요한 부분만 바꾸는 방향으로 설계합니다."],
          ].map(([title, description]) => (
            <article key={title} className="rounded-[28px] border border-white bg-white/80 p-7 shadow-[var(--shadow-sm)]">
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
