"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getNormalizedActivityCoordinates } from "@/lib/activity-coordinates";
import type { Activity } from "@/types/trip";

type MapStatus = "idle" | "loading" | "ready" | "error";

type KakaoMapProps = {
  activities: Activity[];
  area: string;
  route: string;
};

type MappableActivity = Activity & {
  latitude: number;
  longitude: number;
  scheduleIndex: number;
};

type KakaoEventBinding = {
  target: object;
  type: string;
  handler: () => void;
};

const KAKAO_MAP_SCRIPT_ID = "kakao-map-javascript-sdk";
let kakaoMapsPromise: Promise<KakaoMapsNamespace> | null = null;

function loadKakaoMaps(apiKey: string): Promise<KakaoMapsNamespace> {
  if (window.kakao?.maps) {
    return new Promise((resolve) => window.kakao?.maps.load(() => resolve(window.kakao!.maps)));
  }

  if (kakaoMapsPromise) return kakaoMapsPromise;

  kakaoMapsPromise = new Promise<KakaoMapsNamespace>((resolve, reject) => {
    const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement("script");

    const handleLoad = () => {
      if (!window.kakao?.maps) {
        reject(new Error("Kakao Maps SDK가 초기화되지 않았습니다."));
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao!.maps));
    };
    const handleError = () => reject(new Error("Kakao Maps SDK를 불러오지 못했습니다."));

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existingScript) {
      script.id = KAKAO_MAP_SCRIPT_ID;
      script.async = true;
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(apiKey)}&autoload=false`;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    kakaoMapsPromise = null;
    throw error;
  });

  return kakaoMapsPromise;
}

function getMappableActivity(activity: Activity, scheduleIndex: number): MappableActivity | null {
  const coordinates = getNormalizedActivityCoordinates(activity);
  return coordinates ? { ...activity, ...coordinates, scheduleIndex } : null;
}

function getTimeRangeLabel(time: string) {
  const [startTime, endTime] = time.split(/\s*[-~]\s*/);
  if (!startTime || !endTime) return time;
  return `${startTime} - ${endTime}`;
}

function applyTextWrapStyle(element: HTMLElement) {
  element.style.maxWidth = "100%";
  element.style.minWidth = "0";
  element.style.whiteSpace = "normal";
  element.style.overflowWrap = "anywhere";
  element.style.wordBreak = "break-all";
}

function appendInfoRow(container: HTMLElement, label: string, value?: string) {
  if (!value) return;

  const row = document.createElement("div");
  row.className = "grid grid-cols-[64px_minmax(0,1fr)] gap-2 text-xs leading-5";
  row.style.width = "100%";
  row.style.minWidth = "0";

  const labelElement = document.createElement("span");
  labelElement.className = "font-black text-[#7c3aed]";
  labelElement.textContent = label;

  const valueElement = document.createElement("span");
  valueElement.className = "min-w-0 break-words font-semibold text-[#4b5563]";
  applyTextWrapStyle(valueElement);
  valueElement.textContent = value;

  row.append(labelElement, valueElement);
  container.append(row);
}

function createInfoWindowContent(activity: MappableActivity) {
  const container = document.createElement("article");
  container.className = "w-[240px] max-w-[calc(100vw-48px)] rounded-2xl border border-white/90 bg-white p-4 text-left shadow-lg";
  container.style.boxSizing = "border-box";
  container.style.whiteSpace = "normal";
  container.style.overflowWrap = "anywhere";
  container.style.wordBreak = "break-all";

  const sequence = document.createElement("div");
  sequence.className = "mb-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#7c3aed] px-2 text-xs font-black text-white";
  sequence.textContent = String(activity.scheduleIndex + 1);

  const title = document.createElement("h3");
  title.className = "break-words text-sm font-black leading-5 text-[#111827]";
  applyTextWrapStyle(title);
  title.textContent = activity.placeName || activity.title;

  const rows = document.createElement("div");
  rows.className = "mt-3 space-y-1.5";
  rows.style.minWidth = "0";
  appendInfoRow(rows, "시간", getTimeRangeLabel(activity.time));
  appendInfoRow(rows, "유형", activity.type);
  appendInfoRow(rows, "주소", activity.roadAddress || activity.address);
  appendInfoRow(rows, "전화", activity.phone);

  container.append(sequence, title, rows);

  if (activity.placeUrl) {
    const link = document.createElement("a");
    link.className = "mt-3 inline-flex rounded-full bg-[#f3efff] px-3 py-1.5 text-xs font-black text-[#6d28d9]";
    link.href = activity.placeUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "카카오맵에서 보기";
    container.append(link);
  }

  return container;
}

function MapMessage({ title, description }: { title: string; description: string }) {
  return (
    <section className="grid min-h-[520px] place-items-center rounded-[32px] border border-white bg-white/88 p-8 text-center shadow-[var(--shadow)] lg:min-h-[720px]">
      <div>
        <p className="text-sm font-black text-[var(--primary)]">{title}</p>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
    </section>
  );
}

export default function KakaoMap({ activities, area, route }: KakaoMapProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);
  const overlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const infoOverlayRef = useRef<KakaoCustomOverlay | null>(null);
  const [maps, setMaps] = useState<KakaoMapsNamespace | null>(null);
  const [status, setStatus] = useState<MapStatus>("idle");
  const [isMapVisible, setIsMapVisible] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY;

  const mappableActivities = useMemo(
    () =>
      activities
        .map((activity, index) => getMappableActivity(activity, index))
        .filter((activity): activity is MappableActivity => activity !== null),
    [activities],
  );

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const diagnostics = activities.map((activity) => {
      const coordinates = getNormalizedActivityCoordinates(activity);
      return {
        title: activity.placeName || activity.title,
        category: activity.category || activity.type,
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
      };
    });
    console.table(diagnostics);

    const coordinateGroups = new Map<string, string[]>();
    diagnostics.forEach(({ title, latitude, longitude }) => {
      if (latitude === null || longitude === null) return;
      const key = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
      coordinateGroups.set(key, [...(coordinateGroups.get(key) ?? []), title]);
    });
    const duplicates = [...coordinateGroups.entries()]
      .filter(([, titles]) => titles.length > 1)
      .map(([coordinate, titles]) => ({ coordinate, titles }));
    if (duplicates.length > 0) console.warn("[KakaoMap] 동일 좌표 일정", duplicates);
  }, [activities]);

  useEffect(() => {
    const element = mapElementRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setIsMapVisible(entry.contentRect.width > 0 && entry.contentRect.height > 0);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!apiKey || !isMapVisible || mappableActivities.length === 0) return;

    let canceled = false;

    void loadKakaoMaps(apiKey)
      .then((loadedMaps) => {
        if (canceled) return;
        setMaps(loadedMaps);
      })
      .catch(() => {
        if (!canceled) setStatus("error");
      });

    return () => {
      canceled = true;
    };
  }, [apiKey, isMapVisible, mappableActivities.length]);

  useEffect(() => {
    const element = mapElementRef.current;
    if (!maps || !element || !isMapVisible || mappableActivities.length === 0) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];
    infoOverlayRef.current?.setMap(null);
    infoOverlayRef.current = null;

    const first = mappableActivities[0];
    const map = mapRef.current ?? new maps.Map(element, {
      center: new maps.LatLng(first.latitude, first.longitude),
      level: 5,
    });
    mapRef.current = map;
    map.relayout();

    const bounds = new maps.LatLngBounds();
    const nextMarkers: KakaoMarker[] = [];
    const nextOverlays: KakaoCustomOverlay[] = [];
    const eventBindings: KakaoEventBinding[] = [];
    const closeInfoOverlay = () => {
      infoOverlayRef.current?.setMap(null);
      infoOverlayRef.current = null;
    };
    const mapClickHandler = () => closeInfoOverlay();
    maps.event.addListener(map, "click", mapClickHandler);
    eventBindings.push({ target: map, type: "click", handler: mapClickHandler });

    mappableActivities.forEach((activity) => {
      const position = new maps.LatLng(activity.latitude, activity.longitude);
      bounds.extend(position);

      const marker = new maps.Marker({
        map,
        position,
        title: activity.placeName || activity.title,
      });
      const markerClickHandler = () => {
        closeInfoOverlay();
        infoOverlayRef.current = new maps.CustomOverlay({
          map,
          position,
          content: createInfoWindowContent(activity),
          yAnchor: 1.35,
        });
      };
      maps.event.addListener(marker, "click", markerClickHandler);
      eventBindings.push({ target: marker, type: "click", handler: markerClickHandler });
      nextMarkers.push(marker);

      const markerContent = document.createElement("div");
      markerContent.className = "grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[var(--primary)] text-xs font-black text-white shadow-lg";
      markerContent.textContent = String(activity.scheduleIndex + 1);
      markerContent.title = activity.placeName || activity.title;
      markerContent.dataset.scheduleMarker = String(activity.scheduleIndex + 1);

      nextOverlays.push(new maps.CustomOverlay({
        map,
        position,
        content: markerContent,
        yAnchor: 2.15,
      }));
    });
    markersRef.current = nextMarkers;
    overlaysRef.current = nextOverlays;

    if (process.env.NODE_ENV !== "production") {
      console.info("[KakaoMap] 마커 생성 완료", {
        activityCount: activities.length,
        validCoordinateCount: mappableActivities.length,
        markerCount: nextMarkers.length,
        overlayCount: nextOverlays.length,
      });
    }

    map.setBounds(bounds, 64, 64, 150, 64);
    setStatus("ready");

    return () => {
      closeInfoOverlay();
      eventBindings.forEach(({ target, type, handler }) => maps.event.removeListener(target, type, handler));
      nextMarkers.forEach((marker) => marker.setMap(null));
      nextOverlays.forEach((overlay) => overlay.setMap(null));
      if (markersRef.current === nextMarkers) markersRef.current = [];
      if (overlaysRef.current === nextOverlays) overlaysRef.current = [];
    };
  }, [activities.length, isMapVisible, mappableActivities, maps]);

  useEffect(
    () => () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
      infoOverlayRef.current?.setMap(null);
      infoOverlayRef.current = null;
      mapRef.current = null;
      mapElementRef.current?.replaceChildren();
    },
    [],
  );

  if (!apiKey) {
    return <MapMessage title="지도 설정 필요" description="카카오맵 JavaScript 키가 설정되지 않아 지도를 표시할 수 없습니다." />;
  }

  if (mappableActivities.length === 0) {
    return <MapMessage title="표시할 좌표 없음" description="이 날짜의 일정에는 지도에 표시할 유효한 위도와 경도 정보가 없습니다." />;
  }

  if (status === "error") {
    return <MapMessage title="지도 로드 실패" description="지도를 불러오지 못했습니다. 카카오맵 키와 등록된 웹 도메인을 확인해 주세요." />;
  }

  return (
    <section className="relative min-h-[520px] overflow-hidden rounded-[32px] border border-white bg-[#f8f7fb] shadow-[var(--shadow)] lg:min-h-[720px]">
      <div ref={mapElementRef} className="absolute inset-0" aria-label={`${area} 카카오맵`} />
      {status !== "ready" ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-white/75 backdrop-blur-sm">
          <div className="rounded-full bg-white px-5 py-3 text-sm font-black text-[var(--primary)] shadow-[var(--shadow-sm)]">지도를 불러오는 중...</div>
        </div>
      ) : null}
      <div className="absolute inset-x-5 bottom-5 z-20 rounded-[22px] border border-white/80 bg-white/92 p-5 shadow-[var(--shadow-sm)] backdrop-blur">
        <div className="text-xs font-black text-[var(--primary)]">카카오맵</div>
        <h2 className="mt-1 text-xl font-black">{area}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{route}</p>
      </div>
    </section>
  );
}
