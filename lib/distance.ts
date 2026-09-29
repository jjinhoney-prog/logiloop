import type { Hub, HubDistance } from './types';

export const DIRECTIONS_URL = 'https://apis-navi.kakaomobility.com/v1/directions';
/** 매물·거점 좌표가 고정값이므로 하루 동안 결과를 재사용한다. */
export const DISTANCE_REVALIDATE_SECONDS = 86_400;

type Point = { lat: number; lng: number };

/** 미터 → km(소수 1자리), 초 → 분(정수 반올림) */
export function toKmMinutes(meters: number, seconds: number) {
  return { km: Math.round(meters / 100) / 10, minutes: Math.round(seconds / 60) };
}

interface DirectionsResponse {
  routes?: { result_code: number; summary?: { distance: number; duration: number } }[];
}

export async function fetchHubDistance(origin: Point, hub: Hub, restKey: string, fetchImpl: typeof fetch = fetch): Promise<HubDistance> {
  const url = new URL(DIRECTIONS_URL);
  // 카카오모빌리티는 ‘경도,위도’ 순서를 사용한다.
  url.searchParams.set('origin', `${origin.lng},${origin.lat}`);
  url.searchParams.set('destination', `${hub.lng},${hub.lat}`);
  url.searchParams.set('priority', 'RECOMMEND');
  try {
    const res = await fetchImpl(url, {
      headers: { Authorization: `KakaoAK ${restKey}` },
      next: { revalidate: DISTANCE_REVALIDATE_SECONDS },
    } as RequestInit);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const route = ((await res.json()) as DirectionsResponse).routes?.[0];
    if (!route || route.result_code !== 0 || !route.summary) throw new Error('no route');
    return { hub: hub.name, ...toKmMinutes(route.summary.distance, route.summary.duration) };
  } catch {
    return { hub: hub.name, km: null, minutes: null, note: '확인 불가' };
  }
}

export function fetchHubDistances(origin: Point, hubs: Hub[], restKey: string, fetchImpl: typeof fetch = fetch) {
  return Promise.all(hubs.map((hub) => fetchHubDistance(origin, hub, restKey, fetchImpl)));
}
