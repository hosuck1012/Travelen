# 트리플리 — AI 여행 플래너 한글 UI 목업

Dribbble의 AI 여행 서비스 특유의 **넓은 여백, 둥근 카드, 보라색 포인트, 일정·지도·채팅 결합 구조**를 참고해 새로 구성한 한글 웹 목업입니다.

## 실행 방법

1. `index.html`을 더블클릭합니다.
2. 또는 VS Code에서 Live Server로 실행합니다.

별도의 설치, 빌드, 패키지 매니저가 필요 없습니다.

## 구현된 화면

- 랜딩 히어로
- 이용 방법 4단계
- 인기 여행지 카드
- 여행 조건 입력
- AI 추천 플랜 3개 비교
- 날짜별 일정
- 지도 경로 목업
- AI 일정 수정 채팅
- 모바일 반응형 레이아웃

## 클릭 가능한 기능

- 여행 만들기 버튼 스크롤
- 취향·동행 칩 선택
- AI 플랜 생성 로딩
- 여행 플랜 선택
- Day 1~3 일정 변경
- AI 채팅 메시지 입력
- 공유·내보내기 토스트

## 실제 프로젝트로 옮길 때 교체할 부분

### 1. 샘플 일정 데이터
`index.html` 아래쪽 JavaScript의 `schedules` 객체를 백엔드 API 응답으로 바꿉니다.

### 2. AI 생성
`plannerForm.addEventListener("submit", ...)` 내부의 `setTimeout`을 실제 AI API 호출로 바꿉니다.

### 3. 지도
`.map-panel` 목업을 Google Maps, Mapbox 또는 Naver Maps 컴포넌트로 교체합니다.

### 4. 디자인 시스템
CSS 맨 위 `:root`의 색상과 radius 값을 바꾸면 전체 톤을 빠르게 조정할 수 있습니다.

## 바이브 코딩 도구에 넣을 프롬프트 예시

```text
첨부한 index.html의 UI와 디자인 토큰을 기준으로 React + Next.js 프로젝트로 변환해줘.

조건:
- Tailwind CSS와 shadcn/ui 사용
- 각 영역을 components 폴더에 분리
- 여행 조건 입력은 React Hook Form 사용
- 플랜 데이터와 일정 데이터는 TypeScript 타입 정의
- 지도 영역은 우선 MockMap 컴포넌트로 유지
- 모바일 화면에서는 일정/지도/AI 채팅을 탭으로 전환
- 현재 디자인과 간격, 둥근 카드, 보라색 포인트 톤을 최대한 유지
```

## 추천 컴포넌트 구조

```text
components/
  Header.tsx
  HeroSection.tsx
  HowItWorks.tsx
  DestinationCards.tsx
  TripPreferenceForm.tsx
  PlanOptionCard.tsx
  ItineraryPanel.tsx
  MockMap.tsx
  AiAssistant.tsx
```

이 목업은 디자인과 사용자 흐름 확인용이며 실제 예약·결제·지도 API는 연결되어 있지 않습니다.
