"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useMemo, useRef, useState } from "react";
import { getNormalizedActivityCoordinates } from "@/lib/activity-coordinates";
import type { Activity } from "@/types/trip";

type MapStatus = "idle" | "loading" | "ready" | "error";

type GoogleMapProps = {
  activities: Activity[];
  area: string;
  route: string;
};

type MappableActivity = Activity & {
  latitude: number;
  longitude: number;
  scheduleIndex: number;
};

let configuredApiKey: string | null = null;

function configureGoogleMaps(apiKey: string) {
  if (configuredApiKey) return;

  setOptions({
    key: apiKey,
    language: "ko",
    region: "KR",
  });
  configuredApiKey = apiKey;
}

function hasValidCoordinates(activity: Activity, scheduleIndex: number): MappableActivity | null {
  const coordinates = getNormalizedActivityCoordinates(activity);

  if (!coordinates) return null;
  return { ...activity, ...coordinates, scheduleIndex };
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

export default function GoogleMap({ activities, area, route }: GoogleMapProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [status, setStatus] = useState<MapStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const mappableActivities = useMemo(
    () =>
      activities
        .map((activity, index) => hasValidCoordinates(activity, index))
        .filter((activity): activity is MappableActivity => activity !== null),
    [activities],
  );

  useEffect(() => {
    const mapElement = mapElementRef.current;
    if (!mapElement) return;

    const observer = new ResizeObserver(([entry]) => {
      setIsMapVisible(entry.contentRect.width > 0 && entry.contentRect.height > 0);
    });
    observer.observe(mapElement);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (!apiKey || !mapElementRef.current || !isMapVisible || mappableActivities.length === 0) return;

    const googleMapsApiKey = apiKey;
    let canceled = false;
    setStatus("loading");
    setErrorMessage(null);

    async function initializeMap() {
      try {
        configureGoogleMaps(googleMapsApiKey);
        const { Map } = (await importLibrary("maps")) as google.maps.MapsLibrary;
        const { Marker } = (await importLibrary("marker")) as google.maps.MarkerLibrary;

        if (canceled || !mapElementRef.current) return;

        const firstActivity = mappableActivities[0];
        const map = new Map(mapElementRef.current, {
          center: { lat: firstActivity.latitude, lng: firstActivity.longitude },
          zoom: 13,
          clickableIcons: false,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          gestureHandling: "cooperative",
          styles: [
            {
              featureType: "poi",
              elementType: "labels.icon",
              stylers: [{ visibility: "off" }],
            },
          ],
        });
        const bounds = new google.maps.LatLngBounds();

        markersRef.current = mappableActivities.map((activity) => {
          const position = { lat: activity.latitude, lng: activity.longitude };
          bounds.extend(position);
          return new Marker({
            map,
            position,
            title: activity.title,
            label: {
              text: String(activity.scheduleIndex + 1),
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: "900",
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#7657e8",
              fillOpacity: 1,
              scale: 15,
              strokeColor: "#ffffff",
              strokeWeight: 4,
            },
          });
        });

        if (mappableActivities.length > 1) {
          map.fitBounds(bounds, 68);
        } else {
          map.setCenter(bounds.getCenter());
          map.setZoom(14);
        }

        if (!canceled) setStatus("ready");
      } catch {
        if (!canceled) {
          setStatus("error");
          setErrorMessage("지도를 불러오지 못했습니다. API 키 설정과 Google Maps JavaScript API 활성화 상태를 확인해 주세요.");
        }
      }
    }

    void initializeMap();

    return () => {
      canceled = true;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [apiKey, isMapVisible, mappableActivities]);

  if (!apiKey) {
    return <MapMessage title="지도 설정 필요" description="Google Maps API 키가 설정되지 않아 지도를 표시할 수 없습니다." />;
  }

  if (mappableActivities.length === 0) {
    return <MapMessage title="표시할 좌표 없음" description="이 날짜의 일정에는 지도에 표시할 유효한 위도와 경도 정보가 없습니다." />;
  }

  if (status === "error") {
    return <MapMessage title="지도 로드 실패" description={errorMessage ?? "지도를 불러오지 못했습니다."} />;
  }

  return (
    <section className="relative min-h-[520px] overflow-hidden rounded-[32px] border border-white bg-[#f8f7fb] shadow-[var(--shadow)] lg:min-h-[720px]">
      <div ref={mapElementRef} className="absolute inset-0" aria-label={`${area} Google 지도`} />
      {status !== "ready" ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-white/75 backdrop-blur-sm">
          <div className="rounded-full bg-white px-5 py-3 text-sm font-black text-[var(--primary)] shadow-[var(--shadow-sm)]">지도를 불러오는 중...</div>
        </div>
      ) : null}
      <div className="absolute inset-x-5 bottom-5 z-20 rounded-[22px] border border-white/80 bg-white/92 p-5 shadow-[var(--shadow-sm)] backdrop-blur">
        <div className="text-xs font-black text-[var(--primary)]">Google 지도</div>
        <h2 className="mt-1 text-xl font-black">{area}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{route}</p>
      </div>
    </section>
  );
}
