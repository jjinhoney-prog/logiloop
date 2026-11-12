import 'server-only';

/** 시·군·구·동 단위 주소를 권역 대표 좌표로 바꾼다. 상세 주소는 넣지 않는다. */
export async function geocodeRegion(query: string, fetchImpl: typeof fetch = fetch): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.KAKAO_REST_KEY;
  if (!key || !query.trim()) return null;
  try {
    const res = await fetchImpl(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query.trim())}`, { headers: { Authorization: `KakaoAK ${key}` }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const doc = (await res.json())?.documents?.[0];
    const lat = Number(doc?.y), lng = Number(doc?.x);
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132 ? { lat, lng } : null;
  } catch { return null; }
}
