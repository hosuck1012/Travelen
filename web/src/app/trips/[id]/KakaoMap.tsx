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
  const overlaysRef = useRef<KakaoCustomOverlay[]>([]);
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

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];

    const first = mappableActivities[0];
    const map = mapRef.current ?? new maps.Map(element, {
      center: new maps.LatLng(first.latitude, first.longitude),
      level: 5,
    });
    mapRef.current = map;
    map.relayout();

    const bounds = new maps.LatLngBounds();
    overlaysRef.current = mappableActivities.map((activity) => {
      const position = new maps.LatLng(activity.latitude, activity.longitude);
      bounds.extend(position);

      const markerContent = document.createElement("div");
      markerContent.className = "grid h-9 w-9 place-items-center rounded-full border-4 border-white bg-[var(--primary)] text-sm font-black text-white shadow-lg";
      markerContent.textContent = String(activity.scheduleIndex + 1);
      markerContent.title = activity.title;

      const overlay = new maps.CustomOverlay({
        map,
        position,
        content: markerContent,
        yAnchor: 0.5,
      });
      return overlay;
    });

    map.setBounds(bounds, 64, 64, 150, 64);
    setStatus("ready");

    return () => {
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
    };
  }, [isMapVisible, mappableActivities, maps]);

  useEffect(
    () => () => {
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
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
